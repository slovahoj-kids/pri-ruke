// api/subscription-status.js
// Verifies an email + PIN combination and returns the current access status.
// The front-end calls this once right after the person enters their
// email+PIN, then periodically in the background (e.g. once every few days,
// not on every page load) to refresh the cached "full access" flag used for
// offline mode.

function kvHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function kvGet(url, token, key) {
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers: kvHeaders(token) });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.result === null || data.result === undefined) return null;
  try {
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch {
    return data.result;
  }
}

// A 6-digit PIN (1,000,000 combinations) is harder to brute-force than
// SlovAhoj Kids' 4-digit one, but this endpoint is still worth rate-limiting
// against automated guessing.
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
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const pin = typeof body.pin === 'string' ? body.pin.trim() : '';

  if (!email || !pin) {
    return response.status(400).json({ error: 'Email and PIN are required.' });
  }

  // Rate limit by IP + email: max 10 attempts per 10 minutes.
  const ip = (request.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const allowed = await checkRateLimit(url, token, `rl:sub-status:${ip}:${email}`, 10, 600);
  if (!allowed) {
    return response.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const record = await kvGet(url, token, `access:${email}`);

  if (!record || record.pin !== pin) {
    return response.status(200).json({ active: false, reason: 'invalid_credentials' });
  }

  if (record.status !== 'active') {
    return response.status(200).json({ active: false, reason: 'inactive_subscription' });
  }

  return response.status(200).json({
    active: true,
    plan: record.plan || 'full',
    email,
  });
}
