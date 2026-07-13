// GET  → the signed-in user's plan + usage + their access code (entitlements,
//        read from the server so they can't be forged).
// POST { code } → authorize activation of that code for THIS account. Builds are
//        account-bound: a code only works for the account(s) it belongs to.
//        Resolution order: admin (any code) → founder's derived code → the user's
//        own minted code → a hand-made client build the email is allow-listed for.
import { cors, requireUser, readJson } from "./_lib.js";
import { getBilling, TIERS, configured, isFounder } from "./_billing.js";

const ADMINS = new Set(
  String(process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
);
// CLIENT_ACCESS: JSON mapping an activation code → the emails allowed to use it,
// e.g. {"BRAZ2024":["thierno@x.com"],"KRAP9341":["kaden@x.com"]}. Hand-made builds
// only; self-serve codes are bound automatically via billing.
let CLIENT_ACCESS = {};
try { CLIENT_ACCESS = JSON.parse(process.env.CLIENT_ACCESS || "{}"); } catch {}
const allowFor = (code) => {
  const key = Object.keys(CLIENT_ACCESS).find((k) => k.toUpperCase() === code.toUpperCase());
  const list = key ? CLIENT_ACCESS[key] : null;
  return Array.isArray(list) ? list.map((e) => String(e).toLowerCase()) : null;
};
const founderCode = (id) => "FND" + String(id).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = await requireUser(req, res);
  if (!user) return;
  const email = String(user.email || "").toLowerCase();

  // ── Activation authorization ──────────────────────────────────────
  if (req.method === "POST") {
    if (user.byoOnly) return res.status(200).json({ ok: true });
    let body; try { body = await readJson(req); } catch { body = {}; }
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ ok: false, error: "No code entered." });

    if (ADMINS.has(email)) return res.status(200).json({ ok: true, admin: true });
    if (isFounder(email) && code === founderCode(user.id)) return res.status(200).json({ ok: true });
    const b = await getBilling(user.id);
    if (b.accessCode && code === String(b.accessCode).toUpperCase()) return res.status(200).json({ ok: true });
    const allow = allowFor(code);
    if (allow && allow.includes(email)) return res.status(200).json({ ok: true });
    return res.status(403).json({ ok: false, error: "This code isn't linked to your account." });
  }

  // ── Plan / entitlements ───────────────────────────────────────────
  if (user.byoOnly) return res.status(200).json({ tier: "byo", usage: {}, billingConfigured: false });

  if (isFounder(email)) {
    return res.status(200).json({ tier: "founder", usage: {}, period: null, limits: {}, accessCode: founderCode(user.id), billingConfigured: configured() });
  }

  const b = await getBilling(user.id);
  const limits = Object.fromEntries(Object.entries(TIERS).map(([k, v]) => [k, { ...v, scores: v.scores === Infinity ? null : v.scores, audits: v.audits === Infinity ? null : v.audits }]));
  return res.status(200).json({
    tier: b.tier || "free",
    usage: b.usage || {},
    period: b.period || null,
    limits,
    accessCode: b.accessCode || null,
    billingConfigured: configured(),
  });
}
