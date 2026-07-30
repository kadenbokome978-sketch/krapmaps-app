// Exa search proxy — server key, Supabase-gated. Returns Exa's native /search response.
// Exa is retrieval-first: it returns REAL indexed pages (real URLs), so the prospect
// finder can surface actual TikTok handles instead of hallucinated ones.
// Body: { query, type?, numResults?, includeDomains?, contents? }  BYO: "X-BYO-Key" header.
import { cors, requireUser, readJson, resolveKey } from "./_lib.js";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const user = await requireUser(req, res);
  if (!user) return;

  let body;
  try { body = await readJson(req); } catch { return res.status(400).json({ error: "Bad JSON body" }); }

  const key = resolveKey(req, "EXA_KEY");
  if (!key) return res.status(400).json({ error: "No Exa key configured on server" });

  const query = String(body.query || "").trim();
  if (!query) return res.status(400).json({ error: "query required" });

  // Clamp numResults so a crafted request can't run up cost on our key.
  const payload = {
    query,
    type: ["auto", "fast", "instant", "deep-lite", "deep", "deep-reasoning"].includes(body.type) ? body.type : "auto",
    numResults: Math.min(Math.max(Number(body.numResults) || 10, 1), 25),
    ...(Array.isArray(body.includeDomains) && body.includeDomains.length ? { includeDomains: body.includeDomains } : {}),
    contents: body.contents || { highlights: true },
  };

  try {
    const r = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
