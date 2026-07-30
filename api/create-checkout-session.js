// api/create-checkout-session.js
// Creates a Stripe Checkout session for the €5/month "full access" plan.
// Unlike SlovAhoj Kids, there's no plan whitelist needed — just one plan.

const PRICE_ID = 'price_1TycvuRLZSrXJTd8uU5eDAlK'; // Pri Ruke — Повний доступ, €5/mo

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return response.status(500).json({ error: 'Stripe is not configured on the server.' });
  }

  const body = request.body || {};
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ error: 'A valid email is required.' });
  }

  const origin = request.headers.origin || `https://${request.headers.host}`;

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('line_items[0][price]', PRICE_ID);
  params.set('line_items[0][quantity]', '1');
  params.set('customer_email', email);
  params.set('success_url', `${origin}/?payment=success`);
  params.set('cancel_url', `${origin}/?payment=cancelled`);
  params.set('allow_promotion_codes', 'true');

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error('Stripe Checkout session creation failed:', data);
      return response.status(502).json({ error: 'Failed to start checkout.' });
    }

    return response.status(200).json({ url: data.url });
  } catch (e) {
    console.error('Failed to create Stripe Checkout session:', e);
    return response.status(500).json({ error: 'Failed to start checkout.' });
  }
}
