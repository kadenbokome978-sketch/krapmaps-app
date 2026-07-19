// Unified AI proxy — holds provider keys server-side, gated by a Supabase session
// (or a caller-supplied BYO key, which spends the caller's own quota, not ours).
// Returns each provider's NATIVE response body so the client's existing parsers are unchanged.
// Body: { provider: "anthropic"|"openai"|"gemini", prompt, system?, maxTokens?, model? }
// BYO override: send header "X-BYO-Key: <key>" to use the caller's own key instead of the server's.
import { cors, requireUser, readJson, resolveKey } from "./_lib.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

// Providers retire model names (gemini-1.5-pro started 404ing) — never pin one.
const CLAUDE_MODELS = ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5-20251001"];
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

// ── Free score (no auth, rate-limited) ──
const RL = new Map();
function freeScoreOk(ip) {
  const now = Date.now(), e = RL.get(ip);
  if (!e || now - e.s > 3600_000) { RL.set(ip, { s: now, c: 1 }); return true; }
  if (e.c >= 3) return false; e.c++; return true;
}
async function handleFreeScore(req, res) {
  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({ error: "AI not configured" });
  const ip = (req.headers["x-forwarded-for"]?.split(",")[0]?.trim()) || "unknown";
  if (!freeScoreOk(ip)) return res.status(429).json({ error: "You've used your free scores for this hour. Sign up for unlimited scoring." });
  let body; try { body = await readJson(req); } catch { return res.status(400).json({ error: "Bad JSON" }); }
  const idea = String(body.idea || "").trim();
  if (!idea || idea.length < 5) return res.status(400).json({ error: "Describe your video idea (at least 5 characters)." });
  if (idea.length > 500) return res.status(400).json({ error: "Keep it under 500 characters." });
  const prompt = `You are an expert TikTok content strategist. A creator wants to know if this video idea will go viral BEFORE they film it.\n\nVideo idea: "${idea}"\n\nScore this idea out of 100 and give a brief verdict. Return ONLY valid JSON:\n{"score":<0-100>,"verdict":"<one punchy sentence>","hook":<0-100>,"retention":<0-100>,"share":<0-100>,"hookTip":"<one sentence to improve the hook>","bestTimeToPost":"<e.g. Tuesday 7pm>"}\n\nBe honest and specific. Don't be generous — most ideas are 40-65. Only truly viral concepts score 80+.`;
  for (const model of ["gemini-2.5-flash","gemini-2.0-flash"]) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7,maxOutputTokens:300} }),
      });
      if (r.status === 404) continue;
      const data = await r.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) return res.status(502).json({ error: "AI returned unexpected format" });
      return res.status(200).json(JSON.parse(m[0]));
    } catch { if (model === "gemini-2.0-flash") return res.status(502).json({ error: "AI service unavailable" }); }
  }
  return res.status(502).json({ error: "AI service unavailable" });
}

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

  // Free score path — no auth required
  if (req.headers["x-free-score"]) return handleFreeScore(req, res);

  const user = await requireUser(req, res);
  if (!user) return;

  let body;
  try { body = await readJson(req); } catch { return res.status(400).json({ error: "Bad JSON body" }); }

  const provider = String(body.provider || "anthropic").toLowerCase();
  const prompt = body.prompt || "";
  const system = body.system || "You are an expert TikTok content strategist. Return ONLY valid JSON.";
  const maxTokens = body.maxTokens || 2000;
  if (!prompt && !body.messages && !body.contents) return res.status(400).json({ error: "prompt, messages, or contents required" });

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
          // body.contents allows rich payloads (video file_data, multi-part); prompt is the simple path.
          body: JSON.stringify({ contents: body.contents || [{ parts: [{ text: system + "\n\n" + prompt }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens } }),
        })
      );
      return send(r);
    }

    return res.status(400).json({ error: "Unknown provider: " + provider });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
