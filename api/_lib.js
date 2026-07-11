// Shared helpers for API routes. Underscore prefix => Vercel does NOT expose this as an endpoint.

// Public Supabase values (safe to expose) — used to verify the caller's session token.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://xiudsyiinkqtmowkiqxh.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_yTwU-ZhqsyiENrB4luw3Dg_kC3fJn96";

export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-BYO-Key");
}

// Verify the Supabase session by asking Supabase who the token belongs to.
// Works regardless of the project's JWT signing algorithm (HS256 or asymmetric).
// Returns the user object, or null after writing an error response.
//
// BYO exception: if the caller supplied their own provider key (X-BYO-Key), no
// session is required — they're spending their own quota, not our server keys.
// This also lets the deployed proxy solve browser CORS for direct-mode users
// (e.g. Perplexity blocks browser calls entirely).
export async function requireUser(req, res) {
  const byo = req.headers["x-byo-key"];
  if (byo && String(byo).trim()) return { byoOnly: true };
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) { res.status(401).json({ error: "Not signed in" }); return null; }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({ error: "Server auth not configured (SUPABASE_URL / SUPABASE_ANON_KEY missing)" });
    return null;
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) { res.status(401).json({ error: "Invalid or expired session" }); return null; }
    return await r.json();
  } catch (e) {
    res.status(401).json({ error: "Auth check failed: " + e.message });
    return null;
  }
}

// Parse a JSON body whether Vercel already parsed it or handed us a stream.
export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

// Resolve which key to use: the user's own (BYO) if they sent one, else the server key.
export function resolveKey(req, envName) {
  const byo = req.headers["x-byo-key"];
  return (byo && String(byo).trim()) || process.env[envName] || process.env[`VITE_${envName}`] || "";
}
