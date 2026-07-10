import { cors } from "./_lib.js";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const RATE_LIMIT = new Map();
const MAX_PER_IP = 3;
const WINDOW_MS = 3600_000;

function getIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function rateOk(ip) {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    RATE_LIMIT.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= MAX_PER_IP) return false;
  entry.count++;
  return true;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({ error: "AI not configured" });

  const ip = getIp(req);
  if (!rateOk(ip)) return res.status(429).json({ error: "You've used your free scores for this hour. Sign up for unlimited scoring." });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: "Bad JSON" }); }

  const idea = String(body.idea || "").trim();
  if (!idea || idea.length < 5) return res.status(400).json({ error: "Describe your video idea (at least 5 characters)." });
  if (idea.length > 500) return res.status(400).json({ error: "Keep it under 500 characters." });

  const prompt = `You are an expert TikTok content strategist. A creator wants to know if this video idea will go viral BEFORE they film it.

Video idea: "${idea}"

Score this idea out of 100 and give a brief verdict. Return ONLY valid JSON:
{
  "score": <number 0-100>,
  "verdict": "<one punchy sentence — would you post this or not>",
  "hook": <number 0-100>,
  "retention": <number 0-100>,
  "share": <number 0-100>,
  "hookTip": "<one sentence to improve the hook>",
  "bestTimeToPost": "<e.g. Tuesday 7pm>"
}

Be honest and specific. Don't be generous — most ideas are 40-65. Only truly viral concepts score 80+.`;

  for (const model of GEMINI_MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
          }),
        }
      );
      if (r.status === 404) continue;
      const data = await r.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return res.status(502).json({ error: "AI returned unexpected format" });
      const parsed = JSON.parse(jsonMatch[0]);
      return res.status(200).json(parsed);
    } catch (e) {
      if (model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
        return res.status(502).json({ error: "AI service unavailable" });
      }
    }
  }
  return res.status(502).json({ error: "AI service unavailable" });
}
