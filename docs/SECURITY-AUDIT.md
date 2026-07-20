# Security Audit — July 2026

Full review of the API surface + client auth/session handling. Below: what was fixed in code, what needs your action in dashboards, and what was deliberately deferred (with reasoning).

## ✅ Fixed in code (deployed)

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | **Critical** | `api/proxy.js` was an unauthenticated, unmetered open relay to the operator's Anthropic key — anyone could bill Claude to your account. | Deleted (unused; `api/ai.js` supersedes it). |
| 2 | **Critical** | Bright Data scrape path used the server token even for BYO-only callers — a junk `X-BYO-Key: x` header drained scrape credits with no login. | `requireUser` now supports `allowByo:false`; the `bd` path rejects BYO-only callers. |
| 3 | **Critical** | `api/gemini-upload` fell back to the server Gemini key with no auth — anonymous video uploads spent your Gemini budget. | Requires a session unless a real BYO Gemini key is supplied; client now sends the token. |
| 4 | **Medium** | Free-score rate limit keyed on spoofable `X-Forwarded-For` chain. | Now uses the trusted platform IP (`x-real-ip`). |

## ⚠️ You must do these (dashboard, not code)

1. **Rotate `BRIGHTDATA_TOKEN` now.** It was reachable by anonymous callers (issue #2), so treat it as burned. Also rotate `ANTHROPIC_KEY` and `GEMINI_KEY` since `proxy.js`/`gemini-upload` were anonymously spendable while deployed.
2. **Supabase RLS review** — the client uses a public publishable key and reads/writes tables directly. Verify:
   - `km_config` (holds Instagram access tokens) — **service-role only**, no anon read/write.
   - The billing/entitlements table — writable **only** by the service role (Stripe webhook). Confirm no client can self-upgrade `tier` via a direct PostgREST write.
   - `km_public_results` — read-only of intentionally-shared rows, **no anonymous writes**.
   - Every client-touched table: RLS enabled, policies scoped to `auth.uid()`.
3. **Confirm `SUPABASE_SERVICE_ROLE_KEY`** is set only as a server env var in Vercel, never in the client bundle.

## ⏸ Deferred (noted, not done — with reasoning)

- **Server-side metering enforcement in `api/ai.js` (High).** `ai.js` checks auth but not the plan meter; a signed-in free user could loop it. Deferred because `ai.js` serves many *legitimate operator* calls (audits, captions, teardowns) that must not be billed as "scores" — a naive meter would block your own usage. Needs a per-call-type metering design. Lower real risk than the anon holes (requires a real, bannable account).
- **CORS allowlist (High).** Wildcard `Access-Control-Allow-Origin: *` on credentialed endpoints. Real risk is low here because auth uses bearer tokens in `localStorage` (not cookies), so a third-party page can't read the token to abuse a visitor's session. Deferred because an incomplete origin allowlist (greenlit.space + app subdomain + Vercel preview URLs) would break the app. Do it once the exact production domains are locked.
- **`api/ig.js` auth + ownership checks (Medium).** IG OAuth `views`/`sync`/`refresh` are unauthenticated and keyed by client `state`. Fix when the Instagram integration is actively used.
- **`callConsensus` niche hardening (Low).** Currently only ever called with the operator's own workspace, so no leak today. Add a `systemOverride` param if it's ever pointed at a prospect.

## Confirmed clean
- **No hardcoded provider secrets** in source or git history. The only baked-in key is the Supabase *publishable* (anon) key — safe by design, provided RLS is correct.
- Stripe webhook uses correct raw-body HMAC verification; tier grants are server-side only.
- `api/rapid.js` `url=` passthrough is SSRF-guarded by a host allowlist.
</content>
