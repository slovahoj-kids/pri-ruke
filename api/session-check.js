// api/session-check.js
// Called periodically in the background (not on every action) to check
// whether this device is still the one holding the single active session
// for the account. If someone else logged in with the same email+PIN since,
// this will return active:false and the client should log itself out.

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
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!email || !sessionId) {
    return response.status(400).json({ error: 'Email and sessionId are required.' });
  }

  const session = await kvGet(url, token, `session:${email}`);
  const active = !!session && session.sessionId === sessionId;
  return response.status(200).json({ active });
}
