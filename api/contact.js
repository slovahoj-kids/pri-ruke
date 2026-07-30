// api/contact.js
// Receives the contact form and forwards it by email via Resend, with
// reply-to set to the sender so replying goes straight back to them.

function kvHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function checkRateLimit(url, token, bucketKey, limit, windowSeconds) {
  try {
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(bucketKey)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const incrData = incrRes.ok ? await incrRes.json() : { result: 0 };
    const count = incrData.result || 0;
    if (count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(bucketKey)}/${windowSeconds}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    return count <= limit;
  } catch (e) {
    console.error('Rate limit check failed — failing open:', e);
    return true;
  }
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  const body = request.body || {};
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 3000) : '';
  // Honeypot field — real users never fill this in; bots usually do.
  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';

  if (honeypot) {
    return response.status(200).json({ ok: true }); // silently drop, pretend success
  }
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ error: 'Заповніть ім’я, коректний email і повідомлення.' });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    const ip = (request.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const allowed = await checkRateLimit(kvUrl, kvToken, `rl:contact:${ip}`, 5, 3600);
    if (!allowed) {
      return response.status(429).json({ error: 'Забагато повідомлень. Спробуйте пізніше.' });
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return response.status(500).json({ error: 'Форма тимчасово недоступна.' });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#1e293b;">
      <h2 style="color:#2C5AA0;">Нове повідомлення з priruke.sk</h2>
      <p><b>Ім'я:</b> ${escapeHtml(name)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>Повідомлення:</b></p>
      <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'При руке <noreply@noviydim.sk>',
        to: ['slovahoj.kids@gmail.com'],
        reply_to: email,
        subject: `При руке — повідомлення від ${name}`,
        html,
      }),
    });
    if (!res.ok) {
      console.error('Resend error:', await res.text());
      return response.status(502).json({ error: 'Не вдалося надіслати повідомлення.' });
    }
    return response.status(200).json({ ok: true });
  } catch (e) {
    console.error('Contact form send failed:', e);
    return response.status(500).json({ error: 'Не вдалося надіслати повідомлення.' });
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
