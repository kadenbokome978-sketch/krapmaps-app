// Counts one metered action (e.g. a score) against the user's monthly plan
// allowance and says whether it's allowed. Called once per score by the client,
// so the multi-model consensus fan-out is billed as a single unit. Only meaningful
// in backend mode (server keys); BYO/direct callers are never metered.
import { cors, requireUser, readJson } from "./_lib.js";
import { meter, isFounder } from "./_billing.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const user = await requireUser(req, res);
  if (!user) return;
  if (user.byoOnly) return res.status(200).json({ allowed: true, tier: "byo" });
  if (isFounder(user.email)) return res.status(200).json({ allowed: true, tier: "founder", remaining: null });

  let body; try { body = await readJson(req); } catch { body = {}; }
  const m = await meter(user.id, String(body.metric || "scores"), Number(body.cost) || 1);
  return res.status(m.allowed ? 200 : 402).json(m);
}
