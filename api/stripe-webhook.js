// api/stripe-webhook.js
// Receives Stripe payment events. On first successful payment, generates a
// single 6-digit access PIN and emails it — this PIN (+ email) is how the
// person unlocks paid content from any device later, since there's no
// separate registration step in Pri Ruke (unlike SlovAhoj Kids, access
// itself only exists once someone has actually paid).

import { createHmac, timingSafeEqual } from 'crypto';

export const config = {
  api: { bodyParser: false }, // need the raw body to verify Stripe's signature
};

function readRawBody(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    })
  );
  const timestamp = parts.t;
  const receivedSig = parts.v1;
  if (!timestamp || !receivedSig) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (Number.isNaN(age) || age > 300) return false;

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expectedSig = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  try {
    return timingSafeEqual(Buffer.from(expectedSig, 'hex'), Buffer.from(receivedSig, 'hex'));
  } catch {
    return false;
  }
}

function kvHeaders() {
  const token = process.env.KV_REST_API_TOKEN;
  if (!token) throw new Error('Vercel KV is not configured.');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
function kvBaseUrl() {
  const url = process.env.KV_REST_API_URL;
  if (!url) throw new Error('Vercel KV is not configured.');
  return url;
}
async function kvSet(key, value) {
  const res = await fetch(`${kvBaseUrl()}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: kvHeaders(),
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV set failed for ${key}: ${res.status}`);
}
async function kvGet(key) {
  const res = await fetch(`${kvBaseUrl()}/get/${encodeURIComponent(key)}`, { headers: kvHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.result === null || data.result === undefined) return null;
  try {
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch {
    return data.result;
  }
}

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

async function sendPinEmail(email, pin) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return;
  }
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#1e293b;">
      <h2 style="color:#0b47a6;">Pri Ruke</h2>
      <p>Дякуємо за оформлення підписки!</p>
      <p style="font-size:18px;">Ваш код доступу: <span style="font-family:monospace; background:#f1f5f9; padding:4px 10px; border-radius:6px;">${pin}</span></p>
      <p>Введіть цей код разом з email на будь-якому пристрої, щоб отримати повний доступ до Pri Ruke.</p>
      <p>Питання? Пишіть нам: slovahoj.kids@gmail.com</p>
    </div>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pri Ruke <noreply@priruke.sk>',
        to: [email],
        subject: 'Ваш код доступу Pri Ruke',
        html,
      }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
  } catch (e) {
    console.error('sendPinEmail failed:', e);
  }
}

async function updateSubscriptionByCustomerId(customerId, patch) {
  const email = await kvGet(`customer_email:${customerId}`);
  if (!email) {
    console.warn(`No email on file for Stripe customer ${customerId}.`);
    return;
  }
  const existing = (await kvGet(`access:${email}`)) || {};
  await kvSet(`access:${email}`, { ...existing, ...patch, customerId, updatedAt: Date.now() });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set.');
    return response.status(500).json({ error: 'Webhook not configured.' });
  }

  const rawBody = await readRawBody(request);
  const signature = request.headers['stripe-signature'];

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    console.warn('Rejected webhook request with invalid Stripe signature.');
    return response.status(400).json({ error: 'Invalid signature.' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    return response.status(400).json({ error: 'Invalid JSON payload.' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = (session.customer_email || session.customer_details?.email || '').toLowerCase();
        const customerId = session.customer;
        if (email && customerId) {
          await kvSet(`customer_email:${customerId}`, email);
          const existing = await kvGet(`access:${email}`);
          // Reuse the same PIN on renewal/resubscribe — only generate (and
          // email) a fresh one the very first time this email pays.
          const pin = existing?.pin || generatePin();
          await kvSet(`access:${email}`, {
            status: 'active',
            customerId,
            subscriptionId: session.subscription,
            pin,
            updatedAt: Date.now(),
          });
          if (!existing?.pin) {
            await sendPinEmail(email, pin);
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        await updateSubscriptionByCustomerId(sub.customer, {
          status: isActive ? 'active' : sub.status,
          subscriptionId: sub.id,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await updateSubscriptionByCustomerId(sub.customer, { status: 'canceled', subscriptionId: sub.id });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await updateSubscriptionByCustomerId(invoice.customer, { status: 'payment_failed' });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('Error while processing Stripe webhook event:', e);
  }

  return response.status(200).json({ received: true });
}
