// Unified AI proxy — holds provider keys server-side, gated by a Supabase session
// (or a caller-supplied BYO key, which spends the caller's own quota, not ours).
// Returns each provider's NATIVE response body so the client's existing parsers are unchanged.
// Body: { provider: "anthropic"|"openai"|"gemini", prompt, system?, maxTokens?, model? }
// BYO override: send header "X-BYO-Key: <key>" to use the caller's own key instead of the server's.
import { cors, requireUser, readJson, resolveKey } from "./_lib.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

// Providers retire model names (gemini-1.5-pro started 404ing) — never pin one.
const CLAUDE_MODELS = ["claude-sonnet-4-6", "claude-sonnet-5", "claude-haiku-4-5-20251001"];
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

async function tryModels(models, doFetch) {
  let last = null;
  for (const model of models) {
    const r = await doFetch(model);
    if (r.status !== 404) return r; // only "model gone" falls through
    last = r;
  }
  return last;
}

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
  if (!prompt && !body.messages) return res.status(400).json({ error: "prompt or messages required" });

  const send = async (r) => {
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    return res.status(r.status).send(text);
  };

  try {
    if (provider === "anthropic" || provider === "claude") {
      const key = resolveKey(req, "ANTHROPIC_KEY");
      if (!key) return res.status(400).json({ error: "No Anthropic key configured on server" });
      const models = body.model ? [body.model, ...CLAUDE_MODELS.filter(m => m !== body.model)] : CLAUDE_MODELS;
      const r = await tryModels(models, (model) => {
        // body.messages allows rich payloads (multimodal, chat history); prompt is the simple path.
        const payload = { model, max_tokens: maxTokens, messages: body.messages || [{ role: "user", content: prompt }] };
        if (body.system) payload.system = body.system;
        if (body.tools) payload.tools = body.tools;
        return fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
          body: JSON.stringify(payload),
        });
      });
      return send(r);
    }

    if (provider === "openai" || provider === "gpt" || provider === "gpt4o") {
      const key = resolveKey(req, "OPENAI_KEY");
      if (!key) return res.status(400).json({ error: "No OpenAI key configured on server" });
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: body.model || "gpt-4o", messages: [{ role: "system", content: system }, { role: "user", content: prompt }], response_format: { type: "json_object" }, max_tokens: maxTokens }),
      });
      return send(r);
    }

    if (provider === "gemini") {
      const key = resolveKey(req, "GEMINI_KEY");
      if (!key) return res.status(400).json({ error: "No Gemini key configured on server" });
      const models = body.model ? [body.model, ...GEMINI_MODELS.filter(m => m !== body.model)] : GEMINI_MODELS;
      const r = await tryModels(models, (model) =>
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: system + "\n\n" + prompt }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens } }),
        })
      );
      return send(r);
    }

    return res.status(400).json({ error: "Unknown provider: " + provider });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
