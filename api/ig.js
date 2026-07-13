// Consolidated Instagram endpoint (Vercel Hobby caps functions at 12).
// Routed by ?action=callback | refresh | views.
//   callback — OAuth return: exchange code → 60-day token → store per-workspace
//   refresh  — refresh the stored long-lived token before expiry
//   views    — legacy public reel view-count scrape (best-effort, no auth)
// Redirect URI to register in the Meta app: https://<domain>/api/ig?action=callback
import { cors } from "./_lib.js";

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://xiudsyiinkqtmowkiqxh.supabase.co";
const _envKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SB_KEY = /^sb_(publishable|secret)_/.test(_envKey) ? _envKey : "sb_publishable_yTwU-ZhqsyiENrB4luw3Dg_kC3fJn96";

const APP_ID = process.env.IG_APP_ID || "";
const APP_SECRET = process.env.IG_APP_SECRET || "";

const wsOf = (state) => String(state || "default").toUpperCase().replace(/[^A-Z0-9]/g, "") || "default";
// The IG token lives in its OWN row (not workspace_config) so a client-side
// config save can never overwrite it — that was causing repeated disconnects.
const igRowIdFor = (state) => `${wsOf(state)}:ig_token`;

async function readConfig(rowId) {
  try {
    const gr = await fetch(`${SB_URL}/rest/v1/km_config?select=data&id=eq.${encodeURIComponent(rowId)}&limit=1`, { headers: { apikey: SB_KEY } });
    if (gr.ok) { const rows = await gr.json(); return rows?.[0]?.data || {}; }
  } catch {}
  return {};
}
async function writeConfig(rowId, data) {
  return fetch(`${SB_URL}/rest/v1/km_config`, {
    method: "POST",
    headers: { apikey: SB_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ id: rowId, data, updated_at: new Date().toISOString() }]),
  });
}

// ── OAuth callback ─────────────────────────────────────────────────
async function handleCallback(req, res) {
  const { code, state, error, error_description } = req.query || {};
  const bounce = (status) => { res.writeHead(302, { Location: `/dashboard?ig=${status}` }); res.end(); };
  if (error) { console.warn("[ig] user denied:", error_description || error); return bounce("denied"); }
  if (!code) return bounce("nocode");
  if (!APP_ID || !APP_SECRET) { console.error("[ig] IG_APP_ID / IG_APP_SECRET not configured"); return bounce("unconfigured"); }

  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  // Must byte-match the redirect_uri the client sent to /oauth/authorize. The
  // clean /api/ig-callback path is rewritten to this function via vercel.json.
  const redirectUri = process.env.IG_REDIRECT_URI || `${proto}://${host}/api/ig-callback`;

  try {
    const form = new URLSearchParams({
      client_id: APP_ID, client_secret: APP_SECRET, grant_type: "authorization_code",
      redirect_uri: redirectUri, code: String(code).replace(/#_$/, ""),
    });
    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString(),
    });
    const shortData = await shortRes.json().catch(() => ({}));
    if (!shortRes.ok || !shortData.access_token) { console.warn("[ig] short-token exchange failed:", shortRes.status, shortData); return bounce("exchangefail"); }

    // Upgrade to a long-lived (60-day) token. This was silently failing and we
    // stored the 1-hour short token — the root cause of the constant expiries.
    // Now: retry up to 3×, and record the exact exchange error for diagnostics.
    const longUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(APP_SECRET)}&access_token=${encodeURIComponent(shortData.access_token)}`;
    let longData = {}, exchangeError = null;
    for (let i = 0; i < 3; i++) {
      try {
        const lr = await fetch(longUrl);
        longData = await lr.json().catch(() => ({}));
        if (longData.access_token) { exchangeError = null; break; }
        exchangeError = longData?.error?.message || `HTTP ${lr.status}`;
      } catch (e) { exchangeError = e.message; }
      await new Promise((r) => setTimeout(r, 1500));
    }
    const token = longData.access_token || shortData.access_token;
    const expiresIn = longData.access_token ? (longData.expires_in || 60 * 24 * 3600) : 3600;

    const up = await writeConfig(igRowIdFor(state), {
      ig: token,
      userId: shortData.user_id || null,
      expiresAt: Date.now() + expiresIn * 1000,
      connectedAt: Date.now(),
      longLived: !!longData.access_token,
      exchangeError,
    });
    if (!up.ok) { console.warn("[ig] token upsert failed:", up.status); return bounce("savefail"); }
    return bounce("connected");
  } catch (e) { console.error("[ig] callback error:", e.message); return bounce("error"); }
}

// ── Long-lived token refresh ───────────────────────────────────────
async function handleRefresh(req, res) {
  const rowId = igRowIdFor(req.query.state);
  try {
    const data = await readConfig(rowId);
    const token = data?.ig;
    if (!token) return res.status(200).json({ refreshed: false, reason: "no-token" });
    // Rescue path: if we're still holding a short-lived token (the long exchange
    // failed at connect time), upgrade it now — allowed while it's still valid.
    if (data.longLived === false) {
      const xr = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(APP_SECRET)}&access_token=${encodeURIComponent(token)}`);
      const xd = await xr.json().catch(() => ({}));
      if (xd.access_token) {
        await writeConfig(rowId, { ...data, ig: xd.access_token, expiresAt: Date.now() + (xd.expires_in || 60 * 24 * 3600) * 1000, longLived: true, exchangeError: null, refreshedAt: Date.now() });
        return res.status(200).json({ refreshed: true, upgraded: true, expiresIn: xd.expires_in });
      }
      return res.status(200).json({ refreshed: false, reason: "upgrade-failed: " + (xd?.error?.message || xr.status) });
    }
    const rr = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
    const rd = await rr.json().catch(() => ({}));
    if (!rr.ok || !rd.access_token) return res.status(200).json({ refreshed: false, reason: rd?.error?.message || "refresh-failed" });
    await writeConfig(rowId, { ...data, ig: rd.access_token, expiresAt: Date.now() + (rd.expires_in || 60 * 24 * 3600) * 1000, refreshedAt: Date.now() });
    return res.status(200).json({ refreshed: true, expiresIn: rd.expires_in });
  } catch (e) { return res.status(200).json({ refreshed: false, reason: e.message }); }
}

// ── Legacy public reel view-count scrape (best-effort) ─────────────
async function handleViews(req, res) {
  const { codes } = req.query;
  if (!codes) return res.status(400).json({ error: "codes param required" });
  const codeList = String(codes).split(",").filter(Boolean).slice(0, 20);
  const results = {};
  await Promise.all(codeList.map(async (code) => {
    try {
      const r = await fetch(`https://www.instagram.com/reel/${code}/?__a=1&__d=dis`, {
        headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1", Accept: "application/json, text/javascript, */*", "Accept-Language": "en-US,en;q=0.9" },
      });
      if (!r.ok) return;
      const data = await r.json();
      const media = data?.graphql?.shortcode_media || data?.items?.[0];
      if (media) results[code] = { views: media.video_view_count || media.play_count || 0, likes: media.edge_media_preview_like?.count || media.like_count || 0, comments: media.edge_media_to_comment?.count || media.comment_count || 0, reposts: 0 };
    } catch { /* silent */ }
  }));
  res.json(results);
}

// ── Server-side sync ───────────────────────────────────────────────
// Fetches profile + media + per-media views from the Instagram Graph API using
// the server-stored token, so the browser never calls Instagram directly (Safari
// blocks cross-site requests to graph.instagram.com). Returns clean JSON.
async function handleSync(req, res) {
  const rowId = igRowIdFor(req.query.state);
  const data = await readConfig(rowId);
  const token = data?.ig;
  if (!token) return res.status(200).json({ connected: false, reason: "no-token" });
  try {
    const pr = await fetch(`https://graph.instagram.com/me?fields=id,username,media_count,followers_count&access_token=${encodeURIComponent(token)}`);
    const profile = await pr.json();
    if (profile?.error || !pr.ok) {
      return res.status(200).json({ connected: false, reason: profile?.error?.message || `HTTP ${pr.status}` });
    }
    const mr = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url&limit=50&access_token=${encodeURIComponent(token)}`);
    const media = await mr.json();
    const items = media?.data || [];
    const readInsight = async (id, metric) => {
      try {
        const ir = await fetch(`https://graph.instagram.com/${id}/insights?metric=${metric}&access_token=${encodeURIComponent(token)}`);
        if (!ir.ok) return null;
        const j = await ir.json();
        const d = j?.data?.[0];
        return d?.values?.[0]?.value ?? d?.total_value?.value ?? null;
      } catch { return null; }
    };
    const enriched = await Promise.all(items.map(async (m) => {
      let views = await readInsight(m.id, "views");
      if (views == null) views = await readInsight(m.id, "plays");
      return { ...m, views: views || 0 };
    }));
    return res.status(200).json({ connected: true, profile, media: enriched });
  } catch (e) {
    return res.status(200).json({ connected: false, reason: e.message });
  }
}

// ── Diagnostic — reports exact connection state without exposing the token ──
async function handleDebug(req, res) {
  const rowId = igRowIdFor(req.query.state);
  const out = { rowId };
  try {
    const data = await readConfig(rowId);
    out.tokenRowFound = !!data?.ig;
    out.tokenPrefix = data?.ig ? String(data.ig).slice(0, 6) + "…" : null;
    out.tokenLength = data?.ig ? String(data.ig).length : 0;
    out.longLived = data?.longLived ?? null;
    out.exchangeError = data?.exchangeError ?? null;
    out.connectedAt = data?.connectedAt ? new Date(data.connectedAt).toISOString() : null;
    out.expiresAt = data?.expiresAt ? new Date(data.expiresAt).toISOString() : null;
    // Legacy location check
    const legacy = await readConfig(`${wsOf(req.query.state)}:workspace_config`);
    out.legacyTokenFound = !!legacy?.keys?.ig;
    const token = data?.ig || legacy?.keys?.ig;
    if (token) {
      const pr = await fetch(`https://graph.instagram.com/me?fields=id,username,followers_count&access_token=${encodeURIComponent(token)}`);
      out.graphStatus = pr.status;
      out.graphBody = await pr.json().catch(() => null);
    }
    out.env = { hasAppId: !!APP_ID, hasSecret: !!APP_SECRET, hasSbKey: !!SB_KEY };
  } catch (e) { out.error = e.message; }
  return res.status(200).json(out);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const action = req.query.action || "";
  if (action === "callback") return handleCallback(req, res);
  if (action === "refresh") return handleRefresh(req, res);
  if (action === "views") return handleViews(req, res);
  if (action === "sync") return handleSync(req, res);
  if (action === "debug") return handleDebug(req, res);
  return res.status(400).json({ error: "unknown action" });
}
