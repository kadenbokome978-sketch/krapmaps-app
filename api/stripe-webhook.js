// Stripe webhook — the ONLY thing that grants/revokes paid tiers. Verifies the
// signature with the signing secret, then writes the user's tier server-side.
//
// Required env: STRIPE_WEBHOOK_SECRET (whsec_…) — from the webhook you create in
// Stripe → Developers → Webhooks, pointed at https://<your-app>/api/stripe-webhook
// Subscribe it to: checkout.session.completed, customer.subscription.updated,
// customer.subscription.deleted.
import crypto from "node:crypto";
import { setBilling, getBilling } from "./_billing.js";

// Stripe signs the RAW body — Vercel must NOT pre-parse it.
export const config = { api: { bodyParser: false } };

const WHSEC = process.env.STRIPE_WEBHOOK_SECRET;

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

// Verify the Stripe-Signature header (t=timestamp,v1=hmac). Constant-time compare.
function verify(raw, sig, secret) {
  if (!sig || !secret) return false;
  const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=")));
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts.t + "." + raw.toString("utf8")).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)); } catch { return false; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!WHSEC) return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET missing" });

  const raw = await rawBody(req);
  if (!verify(raw, req.headers["stripe-signature"], WHSEC)) return res.status(400).json({ error: "Bad signature" });

  let event; try { event = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ error: "Bad JSON" }); }
  const obj = event?.data?.object || {};
  const meta = obj.metadata || {};
  const userId = meta.userId || obj.client_reference_id;

  const grant = async (tier) => {
    if (!userId) return;
    const b = await getBilling(userId);
    await setBilling(userId, { ...b, tier, stripeCustomerId: obj.customer || b.stripeCustomerId, updatedBy: event.type });
  };

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await grant(meta.plan || "pro");
        break;
      case "customer.subscription.updated":
        // Active/trialing keeps the paid plan; anything else drops to free.
        await grant(["active", "trialing", "past_due"].includes(obj.status) ? (meta.plan || "pro") : "free");
        break;
      case "customer.subscription.deleted":
        await grant("free");
        break;
      default:
        break; // ignore everything else
    }
  } catch (e) {
    // Log but still 200 so Stripe doesn't hammer retries on a transient DB blip.
    console.error("[stripe-webhook]", event.type, e.message);
  }
  return res.status(200).json({ received: true });
}
