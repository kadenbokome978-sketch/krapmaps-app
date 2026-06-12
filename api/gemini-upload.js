// Vercel serverless — proxies video uploads to Gemini Files API (bypasses browser CORS)
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Key, X-File-Name, X-Mime-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const geminiKey = req.headers['x-gemini-key'];
  const fileName  = req.headers['x-file-name'] || 'clip.mp4';
  const mimeType  = req.headers['x-mime-type'] || 'video/mp4';

  if (!geminiKey) return res.status(400).json({ error: 'Missing x-gemini-key header' });

  try {
    // Collect the incoming video bytes
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const videoBuffer = Buffer.concat(chunks);

    // Step 1: start resumable upload session with Gemini
    const startRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': videoBuffer.length,
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: { display_name: fileName } }),
      }
    );

    if (!startRes.ok) {
      const err = await startRes.text();
      return res.status(502).json({ error: `Gemini start failed: ${startRes.status}`, detail: err });
    }

    const uploadUrl = startRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) return res.status(502).json({ error: 'No upload URL from Gemini' });

    // Step 2: upload the video bytes
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': videoBuffer.length,
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
        'Content-Type': mimeType,
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(502).json({ error: `Gemini upload failed: ${uploadRes.status}`, detail: err });
    }

    const data = await uploadRes.json();
    const fileUri = data?.file?.uri;
    if (!fileUri) return res.status(502).json({ error: 'No file URI in Gemini response' });

    res.json({ fileUri, mimeType });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
