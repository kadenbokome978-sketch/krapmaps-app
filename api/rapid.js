// Scraper proxy — server-side, Supabase-gated.
//  • Bright Data TikTok scraper:  GET /api/rapid?bd=1&handle=<user>&n=<count>
//    Uses BRIGHTDATA_TOKEN (server env) to POST the synchronous "TikTok - Posts by Profile Fast API"
//    and returns the posts array directly. This is the current TikTok source.
//  • RapidAPI passthrough (legacy / Instagram):  GET /api/rapid?url=<encoded rapidapi url>
//    Host is allowlisted to prevent SSRF. BYO override via "X-BYO-Key" header.
import { cors, requireUser, resolveKey } from "./_lib.js";

// Give the Bright Data synchronous scrape room to complete.
export const config = { maxDuration: 60 };

// Bright Data "TikTok - Posts by Profile Fast API" dataset.
const BD_DATASET = "gd_m7n5v2gq296pex2f5m";

const ALLOWED_HOSTS = new Set([
  "instagram-scraper-api2.p.rapidapi.com",
]);

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const user = await requireUser(req, res);
  if (!user) return;

  // ── Bright Data TikTok scraper ────────────────────────────────
  if (req.query.bd) {
    // This path spends the operator's server BRIGHTDATA_TOKEN, so a BYO-only caller
    // (unverified X-BYO-Key) must NOT be allowed — require a real session, or anyone
    // could drain scrape credits with a junk header.
    if (user.byoOnly) return res.status(401).json({ error: "Sign in to run a scrape." });
    const token = process.env.BRIGHTDATA_TOKEN;
    if (!token) return res.status(400).json({ error: "BRIGHTDATA_TOKEN not set in Vercel" });
    const handle = String(req.query.handle || "").replace(/^@/, "").trim();
    if (!handle) return res.status(400).json({ error: "handle required" });
    const n = Math.min(Math.max(parseInt(req.query.n, 10) || 30, 1), 100);
    try {
      const bd = await fetch(
        `https://api.brightdata.com/datasets/v3/scrape?dataset_id=${BD_DATASET}&notify=false&include_errors=true`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ input: [{ url: `https://www.tiktok.com/@${handle}`, num_of_posts: n }] }),
        }
      );
      const text = await bd.text();
      res.setHeader("Content-Type", "application/json");
      return res.status(bd.status).send(text);
    } catch (e) {
      return res.status(500).json({ error: "Bright Data request failed: " + e.message });
    }
  }

  // ── RapidAPI passthrough (Instagram, etc.) ────────────────────
  const target = req.query.url;
  if (!target) return res.status(400).json({ error: "url or bd param required" });

  let parsed;
  try { parsed = new URL(target); } catch { return res.status(400).json({ error: "Invalid url" }); }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return res.status(403).json({ error: "Host not allowed: " + parsed.hostname });
  }

  const key = resolveKey(req, "RAPIDAPI_KEY");
  if (!key) return res.status(400).json({ error: "No RapidAPI key configured on server" });

  try {
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
