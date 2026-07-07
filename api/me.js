// Returns the signed-in user's plan + usage. The client reads its tier from here
// (never from the client-writable side) so entitlements can't be forged.
import { cors, requireUser } from "./_lib.js";
import { getBilling, TIERS, configured } from "./_billing.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = await requireUser(req, res);
  if (!user) return;
  if (user.byoOnly) return res.status(200).json({ tier: "byo", usage: {}, billingConfigured: false });

  const b = await getBilling(user.id);
  // Expose limits as finite numbers or null (JSON can't carry Infinity).
  const limits = Object.fromEntries(Object.entries(TIERS).map(([k, v]) => [k, { ...v, scores: v.scores === Infinity ? null : v.scores }]));
  return res.status(200).json({
    tier: b.tier || "free",
    usage: b.usage || {},
    period: b.period || null,
    limits,
    billingConfigured: configured(),
  });
}
