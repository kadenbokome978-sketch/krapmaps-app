// RapidAPI passthrough — server key, Supabase-gated. One endpoint for all scraper calls
// (TikTok posts/info/comments, Instagram reels/info). Host is allowlisted to prevent SSRF.
// Usage: GET /api/rapid?url=<encoded full rapidapi url>   BYO override: "X-BYO-Key" header.
import { cors, requireUser, resolveKey } from "./_lib.js";

const ALLOWED_HOSTS = new Set([
  "tiktok-scraper7.p.rapidapi.com",
  "instagram-scraper-api2.p.rapidapi.com",
]);

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const user = await requireUser(req, res);
  if (!user) return;

  const target = req.query.url;
  if (!target) return res.status(400).json({ error: "url param required" });

  let parsed;
  try { parsed = new URL(target); } catch { return res.status(400).json({ error: "Invalid url" }); }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return res.status(403).json({ error: "Host not allowed: " + parsed.hostname });
  }

  const key = resolveKey(req, "RAPIDAPI_KEY");
  if (!key) return res.status(400).json({ error: "No RapidAPI key configured on server" });

  try {
    // NOTE: no Content-Type header — this is a GET with no body, and some RapidAPI
    // gateways reject a body-implying Content-Type on GET with a 405.
    const r = await fetch(parsed.toString(), {
      headers: { "x-rapidapi-host": parsed.hostname, "x-rapidapi-key": key },
    });
    const text = await r.text();
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
