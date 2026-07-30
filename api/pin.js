// api/pin.js
// Login (email + PIN) and "resend PIN" — combined in one function.
// Unlike SlovAhoj Kids there's no separate registration step: the PIN is
// created by stripe-webhook.js at the moment of first payment. This file
// only ever reads it back / verifies it.

async function sendPinEmail(email, pin) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return { sent: false };
  }
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#1e293b;">
      <h2 style="color:#0b47a6;">Pri Ruke</h2>
      <p>Ви запросили відновлення коду доступу. Ось він:</p>
      <p style="font-size:18px;"><span style="font-family:monospace; background:#f1f5f9; padding:4px 10px; border-radius:6px;">${pin}</span></p>
      <p>Якщо це були не ви — просто ігноруйте цей лист.</p>
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
    return { sent: res.ok };
  } catch (e) {
    console.error('sendPinEmail failed:', e);
    return { sent: false };
  }
}

// Same lightweight rate limiter pattern used in SlovAhoj Kids — a 6-digit
// PIN (1,000,000 combinations) is much harder to brute-force than the kids'
// 4-digit one, but still worth protecting.
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
  response.setHeader('Cache-Control', 'no-store, max-age=0');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.error('Vercel KV is not configured.');
    return response.status(500).json({ error: 'Server storage unavailable.' });
  }

  const body = request.body || {};
  const action = (body.action || 'login').toString();
  const email = (body.email || '').toString().trim().toLowerCase();
  if (!email) return response.status(400).json({ error: 'Email required.' });

  const ip = (request.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || 'unknown';
  const ipOk = await checkRateLimit(url, token, `ratelimit:pin:ip:${ip}`, 30, 900);
  if (!ipOk) return response.status(429).json({ error: 'rate_limited' });

  if (action === 'login') {
    const emailOk = await checkRateLimit(url, token, `ratelimit:pin:email:${email}`, 8, 900);
    if (!emailOk) return response.status(429).json({ error: 'rate_limited' });
  }

  const key = `access:${email}`;
  let record = null;
  try {
    const getRes = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
    const getData = getRes.ok ? await getRes.json() : { result: null };
    if (getData.result) {
      try { record = JSON.parse(getData.result); } catch (e) { record = null; }
    }
  } catch (e) {
    console.error('KV lookup failed:', e);
    return response.status(500).json({ error: 'server_error' });
  }

  if (action === 'resend') {
    // Don't reveal whether this email has ever paid — same response either way.
    if (record?.pin) await sendPinEmail(email, record.pin);
    return response.status(200).json({ sent: true });
  }

  // action === 'login'
  const pin = (body.pin || '').toString().trim();
  if (!pin) return response.status(400).json({ error: 'PIN required.' });
  if (!record) return response.status(404).json({ error: 'not_found' });
  if (pin !== record.pin) return response.status(401).json({ error: 'invalid_pin' });

  return response.status(200).json({ success: true, email, active: record.status === 'active' });
}
