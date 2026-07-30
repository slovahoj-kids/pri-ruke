// api/subscription-status.js
export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 'no-store, max-age=0');

  const email = (request.query?.email || '').toString().trim().toLowerCase();
  if (!email) {
    return response.status(400).json({ error: 'Missing email.' });
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.error('Vercel KV is not configured.');
    return response.status(500).json({ error: 'Not configured.' });
  }

  try {
    const kvRes = await fetch(`${url}/get/${encodeURIComponent(`access:${email}`)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!kvRes.ok) return response.status(200).json({ active: false });
    const data = await kvRes.json();
    if (!data.result) return response.status(200).json({ active: false });
    const record = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    return response.status(200).json({ active: record?.status === 'active' });
  } catch (e) {
    console.error('Failed to read subscription status from KV:', e);
    return response.status(500).json({ error: 'Failed to check subscription status.' });
  }
}
