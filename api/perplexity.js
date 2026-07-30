// Perplexity live-search proxy — server key, Supabase-gated. Returns native Perplexity response.
// Body: { prompt, system? }  BYO override: "X-BYO-Key" header.
import { cors, requireUser, readJson, resolveKey } from "./_lib.js";

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const user = await requireUser(req, res);
  if (!user) return;

  let body;
  try { body = await readJson(req); } catch { return res.status(400).json({ error: "Bad JSON body" }); }
  const prompt = body.prompt || "";
  const system = body.system || "Return ONLY valid JSON.";
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const key = resolveKey(req, "PERPLEXITY_KEY");
  if (!key) return res.status(400).json({ error: "No Perplexity key configured on server" });

  try {
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: body.model || "sonar-reasoning-pro", messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }),
    });
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
