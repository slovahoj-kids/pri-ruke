// api/session-claim.js
// Called only at the moment of actual login (PIN entry) — never on a page
// reload. Verifies the email+PIN, then claims this device as the single
// active session for that account, silently kicking out any other device
// that was previously logged in with the same PIN.

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
async function kvSet(url, token, key, value) {
  const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: kvHeaders(token),
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV set failed for ${key}: ${res.status}`);
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
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

  if (!email || !pin || !sessionId) {
    return response.status(400).json({ error: 'Email, PIN and sessionId are required.' });
  }

  const record = await kvGet(url, token, `access:${email}`);
  if (!record || record.pin !== pin || record.status !== 'active') {
    return response.status(200).json({ claimed: false, reason: 'invalid_credentials' });
  }

  await kvSet(url, token, `session:${email}`, { sessionId, claimedAt: Date.now() });
  return response.status(200).json({ claimed: true });
}
