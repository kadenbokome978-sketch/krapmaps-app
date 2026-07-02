// Unified AI proxy — holds provider keys server-side, gated by a Supabase session.
// Returns each provider's NATIVE response body so the client's existing parsers are unchanged.
// Body: { provider: "anthropic"|"openai"|"gemini", prompt, system?, maxTokens?, model? }
// BYO override: send header "X-BYO-Key: <key>" to use the caller's own key instead of the server's.
import { cors, requireUser, readJson, resolveKey } from "./_lib.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const user = await requireUser(req, res);
  if (!user) return;

  let body;
  try { body = await readJson(req); } catch { return res.status(400).json({ error: "Bad JSON body" }); }

  const provider = String(body.provider || "anthropic").toLowerCase();
  const prompt = body.prompt || "";
  const system = body.system || "You are an expert TikTok content strategist. Return ONLY valid JSON.";
  const maxTokens = body.maxTokens || 2000;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  try {
    if (provider === "anthropic" || provider === "claude") {
      const key = resolveKey(req, "ANTHROPIC_KEY");
      if (!key) return res.status(400).json({ error: "No Anthropic key configured on server" });
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: body.model || "claude-sonnet-4-6", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
      });
      const text = await r.text();
      res.setHeader("Content-Type", "application/json");
      return res.status(r.status).send(text);
    }

    if (provider === "openai" || provider === "gpt" || provider === "gpt4o") {
      const key = resolveKey(req, "OPENAI_KEY");
      if (!key) return res.status(400).json({ error: "No OpenAI key configured on server" });
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: body.model || "gpt-4o", messages: [{ role: "system", content: system }, { role: "user", content: prompt }], response_format: { type: "json_object" }, max_tokens: maxTokens }),
      });
      const text = await r.text();
      res.setHeader("Content-Type", "application/json");
      return res.status(r.status).send(text);
    }

    if (provider === "gemini") {
      const key = resolveKey(req, "GEMINI_KEY");
      if (!key) return res.status(400).json({ error: "No Gemini key configured on server" });
      const model = body.model || "gemini-1.5-pro";
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: system + "\n\n" + prompt }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens } }),
      });
      const text = await r.text();
      res.setHeader("Content-Type", "application/json");
      return res.status(r.status).send(text);
    }

    return res.status(400).json({ error: "Unknown provider: " + provider });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
