// Instagram (official) OAuth callback — "Instagram API with Instagram Login".
// Flow: Settings "Connect Instagram" → Meta login → Meta redirects here with
// ?code=…&state=<workspaceId>. We exchange the code for a short-lived token,
// upgrade it to a 60-day long-lived token, and store it in Supabase (km_config)
// under the caller's workspace so the client picks it up on its next config sync.
//
// Redirect URI to register in the Meta app: https://<domain>/api/ig-callback
//
// Required server env vars:
//   IG_APP_ID      — Instagram app id (from the Meta app's Instagram product)
//   IG_APP_SECRET  — Instagram app secret (keep server-side only)
//   IG_REDIRECT_URI (optional) — overrides the auto-derived redirect URI
import { cors } from "./_lib.js";

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://xiudsyiinkqtmowkiqxh.supabase.co";
const _envKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SB_KEY = /^sb_(publishable|secret)_/.test(_envKey) ? _envKey : "sb_publishable_yTwU-ZhqsyiENrB4luw3Dg_kC3fJn96";

const APP_ID = process.env.IG_APP_ID || "";
const APP_SECRET = process.env.IG_APP_SECRET || "";

// Bounce back to the app with a status the client can surface as a toast.
function bounce(res, status) {
  res.writeHead(302, { Location: `/dashboard?ig=${status}` });
  res.end();
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { code, state, error, error_description } = req.query || {};
  if (error) { console.warn("[ig-callback] user denied:", error_description || error); return bounce(res, "denied"); }
  if (!code) return bounce(res, "nocode");
  if (!APP_ID || !APP_SECRET) { console.error("[ig-callback] IG_APP_ID / IG_APP_SECRET not configured"); return bounce(res, "unconfigured"); }

  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const redirectUri = process.env.IG_REDIRECT_URI || `${proto}://${host}/api/ig-callback`;

  try {
    // 1) Exchange the auth code for a short-lived token (+ the IG user id).
    const form = new URLSearchParams({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: String(code).replace(/#_$/, ""), // Meta sometimes appends "#_"
    });
    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const shortData = await shortRes.json().catch(() => ({}));
    if (!shortRes.ok || !shortData.access_token) {
      console.warn("[ig-callback] short-token exchange failed:", shortRes.status, shortData);
      return bounce(res, "exchangefail");
    }

    // 2) Upgrade to a long-lived (60-day) token.
    const longUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(APP_SECRET)}&access_token=${encodeURIComponent(shortData.access_token)}`;
    const longRes = await fetch(longUrl);
    const longData = await longRes.json().catch(() => ({}));
    const token = longData.access_token || shortData.access_token;
    const expiresIn = longData.expires_in || 60 * 24 * 3600; // seconds
    const igUserId = shortData.user_id || null;

    // 3) Store the token in the caller's workspace config (merge, don't clobber).
    const wsCode = String(state || "default").toUpperCase().replace(/[^A-Z0-9]/g, "") || "default";
    const rowId = `${wsCode}:workspace_config`;
    let existing = {};
    try {
      const gr = await fetch(`${SB_URL}/rest/v1/km_config?select=data&id=eq.${encodeURIComponent(rowId)}&limit=1`, { headers: { apikey: SB_KEY } });
      if (gr.ok) { const rows = await gr.json(); existing = rows?.[0]?.data || {}; }
    } catch {}

    const merged = {
      ...existing,
      keys: { ...(existing.keys || {}), ig: token },
      igMeta: { userId: igUserId, expiresAt: Date.now() + expiresIn * 1000, connectedAt: Date.now() },
    };
    const up = await fetch(`${SB_URL}/rest/v1/km_config`, {
      method: "POST",
      headers: { apikey: SB_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{ id: rowId, data: merged, updated_at: new Date().toISOString() }]),
    });
    if (!up.ok) { console.warn("[ig-callback] config upsert failed:", up.status); return bounce(res, "savefail"); }

    return bounce(res, "connected");
  } catch (e) {
    console.error("[ig-callback] error:", e.message);
    return bounce(res, "error");
  }
}
