// Creates a Stripe Checkout session for a subscription and returns its URL.
// Dependency-free: talks to Stripe's REST API with fetch (matches the codebase).
//
// Required env (server-side):
//   STRIPE_SECRET_KEY        — sk_live_… / sk_test_…
//   STRIPE_PRICE_PRO         — price_… for the Pro plan (recurring)
//   STRIPE_PRICE_STUDIO      — price_… for the Studio plan (recurring)
import { cors, requireUser, readJson } from "./_lib.js";

const SECRET = process.env.STRIPE_SECRET_KEY;
const PRICES = { pro: process.env.STRIPE_PRICE_PRO, studio: process.env.STRIPE_PRICE_STUDIO };

// Stripe expects application/x-www-form-urlencoded with bracketed nested keys.
function form(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(String(v)))
    .join("&");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const user = await requireUser(req, res);
  if (!user || user.byoOnly) { if (!res.headersSent) res.status(401).json({ error: "Sign in to upgrade" }); return; }

  if (!SECRET) return res.status(500).json({ error: "Billing not configured (STRIPE_SECRET_KEY missing)" });

  let body; try { body = await readJson(req); } catch { body = {}; }
  const plan = String(body.plan || "").toLowerCase();
  const price = PRICES[plan];
  if (!price) return res.status(400).json({ error: `Unknown or unconfigured plan "${plan}" (need STRIPE_PRICE_${plan.toUpperCase()})` });

  const origin = (body.origin || req.headers.origin || "").replace(/\/+$/, "") || "https://" + (req.headers.host || "");

  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: "Bearer " + SECRET, "Content-Type": "application/x-www-form-urlencoded" },
      body: form({
        mode: "subscription",
        "line_items[0][price]": price,
        "line_items[0][quantity]": 1,
        success_url: origin + "/?upgraded=1",
        cancel_url: origin + "/?upgrade=cancel",
        client_reference_id: user.id,
        customer_email: user.email || undefined,
        allow_promotion_codes: "true",
        "metadata[userId]": user.id,
        "metadata[plan]": plan,
        "subscription_data[metadata][userId]": user.id,
        "subscription_data[metadata][plan]": plan,
      }),
    });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ error: d?.error?.message || "Stripe checkout failed" });
    return res.status(200).json({ url: d.url });
  } catch (e) {
    return res.status(502).json({ error: "Stripe request failed: " + e.message });
  }
}
