// Vercel serverless — Gemini video vision for the Pre-Post / Video Checker.
// Uses the SERVER's GEMINI_KEY by default (customers never set their own key);
// a browser BYO key can still be passed via X-Gemini-Key to override.
//
// Two modes on the same endpoint (we're at Vercel's function limit, so no new file):
//  1. UPLOAD  — POST the raw video bytes (any non-JSON content-type). Returns {fileUri, mimeType}.
//  2. ANALYSE — POST JSON {fileUri, mimeType, prompt}. Polls the file state once; when it's
//     ACTIVE it runs generateContent and returns {text, done:true}. If Gemini is still
//     processing it returns {pending:true} and the client calls again — this keeps every
//     request short so it never hits the serverless timeout.
export const config = { api: { bodyParser: false }, maxDuration: 60 };

const GEN_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

import { requireUser } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-Key, X-File-Name, X-Mime-Type, X-Upload-Init');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Only fall back to the SERVER's GEMINI_KEY for a signed-in user — otherwise anyone
  // could upload video and run generateContent on the operator's Gemini budget. A caller
  // who brings their own key (X-Gemini-Key) spends their own quota and needs no session.
  const byoKey = req.headers['x-gemini-key'];
  if (!byoKey) {
    const user = await requireUser(req, res);
    if (!user) return;
  }
  const geminiKey = byoKey || process.env.GEMINI_KEY;
  if (!geminiKey) return res.status(400).json({ error: 'No Gemini key configured on server (set GEMINI_KEY).' });

  try {
    // Collect the raw request body.
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    const isJson = contentType.includes('application/json');

    // ── JSON MODES (init + analyse) ───────────────────────────────
    if (isJson) {
      let payload = {};
      try { payload = JSON.parse(raw.toString('utf8') || '{}'); } catch { return res.status(400).json({ error: 'Bad JSON' }); }

      // ── INIT MODE (resumable) ── start a resumable session with the server key and
      // return a self-authorizing upload URL. The browser then streams the bytes DIRECT
      // to Google, bypassing this function's ~4.5MB request-body cap entirely.
      if (payload.init) {
        const mime = (payload.mimeType === 'video/quicktime' ? 'video/mov' : payload.mimeType) || 'video/mp4';
        const size = parseInt(payload.sizeBytes, 10) || 0;
        if (!size) return res.status(400).json({ error: 'sizeBytes required' });
        const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': String(size),
            'X-Goog-Upload-Header-Content-Type': mime,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file: { display_name: payload.fileName || 'clip.mp4' } }),
        });
        if (!startRes.ok) { const t = await startRes.text(); return res.status(502).json({ error: `Init failed: ${startRes.status}`, detail: t.slice(0, 300) }); }
        const uploadUrl = startRes.headers.get('x-goog-upload-url');
        if (!uploadUrl) return res.status(502).json({ error: 'No resumable upload URL from Gemini' });
        return res.json({ uploadUrl, mimeType: mime });
      }

      // ── ANALYSE MODE ──
      const { fileUri, mimeType = 'video/mp4', prompt, json = true, maxTokens = 1800 } = payload;
      if (!fileUri || !prompt) return res.status(400).json({ error: 'Missing fileUri or prompt' });

      const fileId = fileUri.split('/files/')[1] || fileUri.split('/').pop();
      // Poll the file state for up to ~45s within this single request.
      let state = null;
      for (let i = 0; i < 15; i++) {
        const s = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileId}?key=${geminiKey}`);
        if (s.ok) { const sd = await s.json(); state = sd.state; if (state === 'ACTIVE') break; if (state === 'FAILED') return res.status(502).json({ error: 'Gemini failed to process the file — export as MP4 and retry.' }); }
        await new Promise(r => setTimeout(r, 3000));
      }
      if (state !== 'ACTIVE') return res.json({ pending: true, fileUri });

      // Run the analysis.
      let lastErr = '';
      for (const model of GEN_MODELS) {
        const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ file_data: { mime_type: mimeType, file_uri: fileUri } }, { text: prompt }] }], generationConfig: { ...(json ? { responseMimeType: 'application/json' } : {}), maxOutputTokens: maxTokens } }),
        });
        if (genRes.ok) { const gd = await genRes.json(); const text = gd?.candidates?.[0]?.content?.parts?.[0]?.text || ''; return res.json({ text, done: true }); }
        lastErr = `${genRes.status} ${(await genRes.text()).slice(0, 200)}`;
      }
      return res.status(502).json({ error: `Gemini analysis failed: ${lastErr}` });
    }

    // ── UPLOAD MODE ───────────────────────────────────────────────
    const fileName = req.headers['x-file-name'] || 'clip.mp4';
    const rawMime  = req.headers['x-mime-type'] || 'video/mp4';
    const mimeType = rawMime === 'video/quicktime' ? 'video/mov' : rawMime;
    if (raw.length === 0) return res.status(400).json({ error: 'Empty video body received' });

    const boundary = '----GeminiBoundary' + Date.now();
    const metaPart = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n` + JSON.stringify({ file: { display_name: fileName } }) + `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const closePart = Buffer.from(`\r\n--${boundary}--`);
    const body = Buffer.concat([metaPart, raw, closePart]);

    const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}&uploadType=multipart`, {
      method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}`, 'Content-Length': body.length }, body,
    });
    if (!uploadRes.ok) { const err = await uploadRes.text(); return res.status(502).json({ error: `Gemini upload failed: ${uploadRes.status}`, detail: err.slice(0, 300) }); }
    const data = await uploadRes.json();
    const fileUri = data?.file?.uri;
    if (!fileUri) return res.status(502).json({ error: 'No file URI in Gemini response' });
    res.json({ fileUri, mimeType });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
