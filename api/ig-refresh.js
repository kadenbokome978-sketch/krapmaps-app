// Refreshes a stored Instagram long-lived token. Meta long-lived tokens last 60
// days and can be refreshed any time after they're 24h old, extending another 60.
// The client calls this on load when the stored token is within ~10 days of expiry;
// it can also be hit by a cron. Keyed by workspace via ?state=<workspaceId>.
import { cors } from "./_lib.js";

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://xiudsyiinkqtmowkiqxh.supabase.co";
const _envKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SB_KEY = /^sb_(publishable|secret)_/.test(_envKey) ? _envKey : "sb_publishable_yTwU-ZhqsyiENrB4luw3Dg_kC3fJn96";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const wsCode = String(req.query.state || "default").toUpperCase().replace(/[^A-Z0-9]/g, "") || "default";
  const rowId = `${wsCode}:workspace_config`;

  try {
    const gr = await fetch(`${SB_URL}/rest/v1/km_config?select=data&id=eq.${encodeURIComponent(rowId)}&limit=1`, { headers: { apikey: SB_KEY } });
    if (!gr.ok) return res.status(200).json({ refreshed: false, reason: "config-read-failed" });
    const rows = await gr.json();
    const data = rows?.[0]?.data || {};
    const token = data?.keys?.ig;
    if (!token) return res.status(200).json({ refreshed: false, reason: "no-token" });

    const rr = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
    const rd = await rr.json().catch(() => ({}));
    if (!rr.ok || !rd.access_token) return res.status(200).json({ refreshed: false, reason: "refresh-failed" });

    const merged = {
      ...data,
      keys: { ...(data.keys || {}), ig: rd.access_token },
      igMeta: { ...(data.igMeta || {}), expiresAt: Date.now() + (rd.expires_in || 60 * 24 * 3600) * 1000, refreshedAt: Date.now() },
    };
    await fetch(`${SB_URL}/rest/v1/km_config`, {
      method: "POST",
      headers: { apikey: SB_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{ id: rowId, data: merged, updated_at: new Date().toISOString() }]),
    });
    return res.status(200).json({ refreshed: true, expiresIn: rd.expires_in });
  } catch (e) {
    return res.status(200).json({ refreshed: false, reason: e.message });
  }
}
