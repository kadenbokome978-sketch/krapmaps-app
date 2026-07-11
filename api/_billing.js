// Billing + usage state. Underscore prefix => NOT exposed as an endpoint.
// Tier and usage live in a locked-down `km_billing` table that ONLY the server
// can write (via the Supabase service-role key), so a client can never forge its
// own paid tier. The client reads its tier through /api/me, never directly.
//
// Table (run once in Supabase SQL editor):
//   create table if not exists km_billing (
//     id text primary key, data jsonb, updated_at timestamptz default now());
//   alter table km_billing enable row level security;   -- no anon policies: server-only
//
// Required env (server-side, no VITE_ prefix):
//   SUPABASE_SERVICE_ROLE_KEY  — Supabase → Settings → API → service_role key

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SB_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = "km_billing";
const _h = () => ({ apikey: SVC, Authorization: "Bearer " + SVC, "Content-Type": "application/json" });

// Monthly allowances per tier. `scores` gates AI scoring calls (the main cost).
export const TIERS = {
  free:   { label: "Free",   scores: 10,       price: 0 },
  pro:    { label: "Pro",    scores: 400,      price: 29 },
  studio: { label: "Studio", scores: Infinity, price: 99 },
};

// Founding / comped accounts — unlimited access, no Stripe. Set FOUNDER_EMAILS
// to a comma-separated list of the founding creators' login emails (server env,
// no VITE_ prefix). Matching is case-insensitive. These accounts get the top
// tier for free — used for design partners who pay in data + testimonials.
const FOUNDERS = new Set(
  String(process.env.FOUNDER_EMAILS || "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
);
export function isFounder(email) {
  return !!email && FOUNDERS.has(String(email).trim().toLowerCase());
}

export function periodKey(d = new Date()) {
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

export function configured() { return !!(SB_URL && SVC); }

export async function getBilling(userId) {
  const fallback = { tier: "free", usage: {}, period: periodKey() };
  if (!configured() || !userId) return fallback;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(userId)}&select=data&limit=1`, { headers: _h() });
    if (!r.ok) return fallback;
    const rows = await r.json();
    return (rows && rows[0] && rows[0].data) || fallback;
  } catch { return fallback; }
}

export async function setBilling(userId, data) {
  if (!configured() || !userId) return;
  try {
    await fetch(`${SB_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ..._h(), Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{ id: userId, data, updated_at: new Date().toISOString() }]),
    });
  } catch { /* best-effort — never crash the request over a billing write */ }
}

// Meter a metered action. Resets counters monthly. Returns
// { allowed, tier, used, limit, remaining }. If billing isn't configured,
// everything is allowed (so the app still works before you wire Stripe).
export async function meter(userId, metric = "scores", cost = 1) {
  if (!configured() || !userId) return { allowed: true, tier: "unmetered", used: 0, limit: Infinity, remaining: Infinity };
  const b = (await getBilling(userId)) || { tier: "free", usage: {}, period: periodKey() };
  const tier = b.tier || "free";
  const pk = periodKey();
  if (b.period !== pk) { b.period = pk; b.usage = {}; }         // monthly reset
  const used = b.usage?.[metric] || 0;
  const limit = (TIERS[tier] || TIERS.free)[metric] ?? Infinity;
  if (used + cost > limit) return { allowed: false, tier, used, limit, remaining: 0 };
  b.usage = { ...(b.usage || {}), [metric]: used + cost };
  await setBilling(userId, b);
  return { allowed: true, tier, used: used + cost, limit, remaining: limit === Infinity ? Infinity : limit - (used + cost) };
}
