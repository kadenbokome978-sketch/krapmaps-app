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

// Supabase staging — lets big clips go browser→Supabase→server→Gemini, dodging both
// Vercel's ~4.5MB inbound cap and Google's browser-CORS block on the File API.
const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SB_URL || "https://xiudsyiinkqtmowkiqxh.supabase.co";
const SB_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const STAGE_BUCKET = "km-uploads";

import { requireUser } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-Key, X-File-Name, X-Mime-Type, X-Upload-Init, X-Upload-Url, X-Upload-Offset, X-Upload-Command');

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

      // ── SIGN MODE ── ensure the staging bucket exists (auto-create) and hand the browser
      // a signed Supabase upload URL so it can upload a large clip directly (no size cap,
      // no policy setup needed — the signed URL carries its own auth).
      if (payload.stage === 'sign') {
        if (!SB_SVC) return res.status(400).json({ error: 'Large-file upload not configured (SUPABASE_SERVICE_ROLE_KEY missing).' });
        const svcH = { apikey: SB_SVC, Authorization: `Bearer ${SB_SVC}`, 'Content-Type': 'application/json' };
        // Auto-create the private bucket (ignore "already exists").
        await fetch(`${SB_URL}/storage/v1/bucket`, { method: 'POST', headers: svcH, body: JSON.stringify({ id: STAGE_BUCKET, name: STAGE_BUCKET, public: false, file_size_limit: 524288000 }) }).catch(() => {});
        const ext = /mov/i.test(payload.mimeType || '') ? 'mov' : 'mp4';
        const path = `chk/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const signRes = await fetch(`${SB_URL}/storage/v1/object/upload/sign/${STAGE_BUCKET}/${path}`, { method: 'POST', headers: svcH, body: '{}' });
        if (!signRes.ok) { const t = await signRes.text(); return res.status(502).json({ error: `Couldn't create upload URL: ${signRes.status} ${t.slice(0, 150)}` }); }
        const sd = await signRes.json();
        const signedUrl = sd.url ? `${SB_URL}/storage/v1${sd.url}` : null;
        if (!signedUrl) return res.status(502).json({ error: 'No signed URL returned' });
        return res.json({ signedUrl, path });
      }

      // ── INGEST MODE ── pull the staged clip from Supabase (server-side, no size limit)
      // and upload it to Gemini via the proven multipart path, then delete the staged file.
      if (payload.stage === 'ingest') {
        if (!SB_SVC) return res.status(400).json({ error: 'Large-file upload not configured.' });
        const path = payload.path;
        const mime = (payload.mimeType === 'video/quicktime' ? 'video/mov' : payload.mimeType) || 'video/mp4';
        if (!path) return res.status(400).json({ error: 'path required' });
        const svcAuth = { apikey: SB_SVC, Authorization: `Bearer ${SB_SVC}` };
        const dl = await fetch(`${SB_URL}/storage/v1/object/${STAGE_BUCKET}/${path}`, { headers: svcAuth });
        if (!dl.ok) { const t = await dl.text(); return res.status(502).json({ error: `Couldn't read staged clip: ${dl.status} ${t.slice(0, 150)}` }); }
        const buf = Buffer.from(await dl.arrayBuffer());
        const boundary = '----GeminiBoundary' + Date.now();
        const metaPart = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n` + JSON.stringify({ file: { display_name: 'clip' } }) + `\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`);
        const body = Buffer.concat([metaPart, buf, Buffer.from(`\r\n--${boundary}--`)]);
        const up = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}&uploadType=multipart`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
        // Best-effort cleanup of the staged file.
        fetch(`${SB_URL}/storage/v1/object/${STAGE_BUCKET}/${path}`, { method: 'DELETE', headers: svcAuth }).catch(() => {});
        if (!up.ok) { const t = await up.text(); return res.status(502).json({ error: `Gemini upload failed: ${up.status}`, detail: t.slice(0, 200) }); }
        const gd = await up.json();
        const fileUri = gd?.file?.uri;
        if (!fileUri) return res.status(502).json({ error: 'No file URI from Gemini' });
        return res.json({ fileUri, mimeType: mime });
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

    // ── RELAY MODE (chunked resumable) ── forward one raw chunk to the resumable
    // session URL server-side, so the browser never talks to Google directly (no CORS
    // dependency). Each chunk is <4.5MB, so it fits within this function's body cap; the
    // full file can be any size across multiple chunks.
    const relayUrl = req.headers['x-upload-url'];
    if (relayUrl) {
      if (raw.length === 0) return res.status(400).json({ error: 'Empty chunk received' });
      const offset = req.headers['x-upload-offset'] || '0';
      const command = req.headers['x-upload-command'] || 'upload, finalize';
      const gRes = await fetch(String(relayUrl), {
        method: 'POST',
        headers: { 'X-Goog-Upload-Offset': String(offset), 'X-Goog-Upload-Command': String(command) },
        body: raw,
      });
      const text = await gRes.text();
      res.setHeader('Content-Type', 'application/json');
      if (!gRes.ok) {
        // Surface Google's real reason instead of an opaque status.
        let msg = text;
        try { const j = JSON.parse(text); msg = j?.error?.message || j?.error?.status || text; } catch {}
        return res.status(gRes.status).json({ error: `Gemini upload rejected (${gRes.status}): ${String(msg).slice(0, 240)}` });
      }
      return res.status(200).send(text || '{}');
    }

    // ── UPLOAD MODE (legacy single-shot, small files only) ─────────
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
