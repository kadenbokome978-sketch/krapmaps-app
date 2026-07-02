# Backend Setup — server-side keys + accounts

This app can run in two modes:

- **Direct mode (default, current live behaviour):** users bring their own API keys
  (stored in their browser). Nothing below is required. `VITE_REQUIRE_AUTH` is unset.
- **Backend mode (the sellable setup):** users sign in with an account, need **no keys**,
  and all AI/scraping runs through your serverless proxies using **your** keys held on
  the server. Turned on with `VITE_REQUIRE_AUTH=true`.

Backend mode is fully built and **off by default**. Flipping it on is the 3 steps below.

---

## 1. Set Vercel environment variables

Vercel → Project → Settings → Environment Variables. Add these, then redeploy.

**Turns backend mode on (client-side, must start with `VITE_`):**

| Variable | Value |
|---|---|
| `VITE_REQUIRE_AUTH` | `true` |
| `VITE_SB_URL` | your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `VITE_SB_KEY` | your Supabase **anon** public key |

**Server-side secrets (never exposed to the browser — no `VITE_` prefix):**

| Variable | Used by | Required? |
|---|---|---|
| `SUPABASE_URL` | verifying the caller's session | yes |
| `SUPABASE_ANON_KEY` | verifying the caller's session | yes |
| `ANTHROPIC_KEY` | `/api/ai` (Claude) | at least one AI key |
| `OPENAI_KEY` | `/api/ai` (GPT-4o) | optional |
| `GEMINI_KEY` | `/api/ai` (Gemini) | optional |
| `PERPLEXITY_KEY` | `/api/perplexity` (live trends) | optional |
| `RAPIDAPI_KEY` | `/api/rapid` (TikTok + Instagram scraping) | for auto video sync |

You only need **one** AI key for scoring/ideas to work. Add the others to enable
consensus scoring, live trends, and video reading.

> `SUPABASE_URL`/`SUPABASE_ANON_KEY` (server) and `VITE_SB_URL`/`VITE_SB_KEY` (client)
> hold the same two values — they're just read from different places. Set both pairs.

---

## 2. Enable email auth in Supabase

Supabase dashboard → **Authentication → Providers → Email**: enable it.

- For fastest onboarding, turn **"Confirm email" OFF** (users can sign in immediately).
  With it on, the app tells them to confirm via email first — that's handled gracefully.
- No tables or SQL needed — Supabase Auth manages users automatically.

---

## 3. Redeploy

Push/redeploy on Vercel so the new env vars take effect. Done — visitors now get a
login screen, and every AI/scrape call runs on your keys.

---

## How BYO (bring-your-own key) still works

Even in backend mode, if a user pastes their own key in Settings, the client forwards
it as an `X-BYO-Key` header and the server uses **their** key for that call instead of
yours. Great for offloading cost from power users. Leave Settings keys empty to use
your server keys.

---

## What runs where

| Feature | Endpoint | Notes |
|---|---|---|
| Idea scoring, captions, hooks, expand, weekly brief, comment insights | `/api/ai` | Claude/GPT/Gemini, server keys |
| Live trends, competitor spy, gap radar | `/api/perplexity` | server key |
| TikTok sync, IG reels/followers, comments | `/api/rapid` | RapidAPI, host-allowlisted |
| IG public view counts | `/api/ig-views` | no key (public scrape) |
| Gemini video upload | `/api/gemini-upload` | user-key header (legacy path) |

### Phase 2 — complete

Every AI feature now routes through the proxy in backend mode, including the
rich-payload ones: **AI Chat** (tool-calling via `messages`/`tools` passthrough),
**Visual DNA** (multimodal thumbnails), **Channel Theory & post-mortem learning**
(free-text), and **Video AI Reader** (Gemini `contents` passthrough). No feature
requires a local key when backend mode is on.

### Resilience (applies in both modes)

- Model names are never pinned: Claude and Gemini calls try a fallback chain and
  survive provider model retirements (this is what broke scoring when Google
  retired `gemini-1.5-pro`).
- Truncated AI responses are repaired instead of failing ("Could not parse").
- 429/529 get an automatic retried call.
- Perplexity is always routed through `/api/perplexity` (their API blocks
  browser calls); direct-mode users' own keys are forwarded via `X-BYO-Key`,
  which the endpoints accept without a session since the caller pays.

---

## Security notes

- Every `/api/*` call verifies the Supabase session via `/auth/v1/user` before doing
  anything, so only signed-in users can spend your keys.
- `/api/rapid` allowlists RapidAPI hosts (TikTok + Instagram scrapers only) to prevent
  it being used as an open proxy.
- Server keys never reach the browser. Only `VITE_`-prefixed vars are bundled client-side,
  and those are only the public Supabase URL + anon key.
