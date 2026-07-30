// api/speech-token.js
// Issues a short-lived (~10 minute) Azure Speech authorization token instead
// of handing the raw AZURE_SPEECH_KEY subscription key to the browser — the
// pattern Microsoft itself recommends for browser-based Speech SDK usage.
// Same approach as SlovAhoj Kids' api/speech-token.js, reusing the same
// Azure Speech resource (set the same AZURE_SPEECH_KEY / AZURE_SPEECH_REGION
// values as environment variables in this Vercel project too).

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 'no-store, max-age=0');

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    console.error('AZURE_SPEECH_KEY / AZURE_SPEECH_REGION not configured.');
    return response.status(500).json({ error: 'Speech service is not configured on the server.' });
  }

  try {
    const tokenRes = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Length': '0',
        },
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Azure token issuance failed:', tokenRes.status, errText);
      return response.status(502).json({ error: 'Failed to obtain speech token.' });
    }

    const token = await tokenRes.text();
    return response.status(200).json({ token, region });
  } catch (e) {
    console.error('Azure token request error:', e);
    return response.status(500).json({ error: 'Failed to obtain speech token.' });
  }
}
