// Vercel serverless — proxies video uploads to Gemini Files API (bypasses browser CORS)
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Key, X-File-Name, X-Mime-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const geminiKey = req.headers['x-gemini-key'];
  const fileName  = req.headers['x-file-name'] || 'clip.webm';
  const rawMime   = req.headers['x-mime-type'] || 'video/webm';
  // Normalise quicktime to mov which Gemini accepts
  const mimeType  = rawMime === 'video/quicktime' ? 'video/mov' : rawMime;

  if (!geminiKey) return res.status(400).json({ error: 'Missing x-gemini-key header' });

  try {
    // Collect the incoming video bytes
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const videoBuffer = Buffer.concat(chunks);

    if (videoBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty video body received' });
    }

    // Use multipart upload (simpler and more reliable than resumable for small files)
    const boundary = '----GeminiBoundary' + Date.now();
    const metaPart = Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n` +
      JSON.stringify({ file: { display_name: fileName } }) +
      `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const closePart = Buffer.from(`\r\n--${boundary}--`);
    const body = Buffer.concat([metaPart, videoBuffer, closePart]);

    const uploadRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}&uploadType=multipart`,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': body.length,
        },
        body,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(502).json({ error: `Gemini upload failed: ${uploadRes.status}`, detail: err });
    }

    const data = await uploadRes.json();
    const fileUri = data?.file?.uri;
    if (!fileUri) return res.status(502).json({ error: 'No file URI in Gemini response', raw: data });

    res.json({ fileUri, mimeType });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
