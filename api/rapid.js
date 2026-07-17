// RapidAPI passthrough — server key, Supabase-gated. One endpoint for all scraper calls
// (TikTok posts/info/comments, Instagram reels/info). Host is allowlisted to prevent SSRF.
// Usage: GET /api/rapid?url=<encoded full rapidapi url>   BYO override: "X-BYO-Key" header.
import { cors, requireUser, resolveKey } from "./_lib.js";

const ALLOWED_HOSTS = new Set([
  "tiktok-scraper7.p.rapidapi.com",
  "instagram-scraper-api2.p.rapidapi.com",
  "www.tikwm.com",   // TIKWM free public API — no RapidAPI key needed (tiktok-scraper7 was disabled by provider)
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

  // tikwm.com is a free public API — no RapidAPI key/headers. RapidAPI hosts still need the key.
  const isTikwm = parsed.hostname === "www.tikwm.com";
  const key = isTikwm ? "" : resolveKey(req, "RAPIDAPI_KEY");
  if (!isTikwm && !key) return res.status(400).json({ error: "No RapidAPI key configured on server" });

  try {
    // NOTE: no Content-Type header — this is a GET with no body, and some gateways
    // reject a body-implying Content-Type on GET with a 405.
    const r = await fetch(parsed.toString(), {
      headers: isTikwm
        ? { "User-Agent": "Mozilla/5.0 (compatible; CreatorOS/1.0)" }
        : { "x-rapidapi-host": parsed.hostname, "x-rapidapi-key": key },
    });
    const text = await r.text();
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
