# CreatorOS (KrapMaps)

A whitelabel AI content-strategy app for short-form creators (TikTok / Reels).
Score video ideas before filming, auto-sync channel stats, learn from real
outcomes, and get niche-specific strategy — all in a dark, phone-first UI that
installs to the home screen as a PWA.

## Quick start

```bash
npm install
npm run dev        # local dev (vite)
npm run build      # prebuild guard (scope-check + api syntax) → vite build
npm run smoke      # headless: app must mount on mobile + desktop with no JS errors
node scripts/qa.mjs  # walks every view at both viewports, flags errors/overflow
```

Deploys on Vercel: static Vite build + serverless functions in `api/`.

## Architecture

| Piece | What it is |
|---|---|
| `src/App.jsx` | The entire app (~10k lines, intentionally single-file). All views, the AI pipeline, storage, auth. |
| `api/` | Vercel serverless: `ai.js` (Claude/GPT/Gemini proxy), `perplexity.js`, `rapid.js` (TikTok+IG scrapers, host-allowlisted), `_lib.js` (auth/CORS helpers), plus legacy `proxy.js`, `ig-views.js`, `gemini-upload.js`. |
| `client.config.json` / `client.config.thierno.json` | Whitelabel configs — activation code, branding, niche, prompts. The activation code entered at onboarding selects the client. See `WHITE_LABEL.md`. |
| `scripts/` | `check-scope.mjs` (build guard), `smoke.mjs`, `qa.mjs`, `gen-icons.mjs` (regenerates PWA icons, zero deps). |
| `public/` | PWA manifest + icons. |

**State**: localStorage is the source of truth (`krapmaps_v1_*` keys), mirrored
to Supabase (`km_*` tables) for cross-device persistence. Sync failures never
block the app — they surface in the health system (Settings → System Status +
a dismissible Home banner).

## Two run modes

- **Direct mode (default)** — users paste their own API keys in Settings
  (stored in the browser). One AI provider is enough; everything degrades
  gracefully.
- **Backend mode** (`VITE_REQUIRE_AUTH=true`) — users sign in (Supabase email
  auth incl. password reset) and need **no keys**: all AI/scraping goes through
  the `api/` proxies using server-held env keys. Users who paste a key anyway
  get it forwarded as `X-BYO-Key` (they pay, not you). Full setup:
  `BACKEND_SETUP.md`.

## AI pipeline (the moat)

Idea scoring (`scoreIdea`) builds a large channel-grounded prompt — real video
stats, calibration curves from posted outcomes, hook fatigue, semantic
saturation via embeddings, audience comments, visual DNA from thumbnails, a
small in-browser neural calibrator — then runs a **multi-model consensus**
(Claude spine + GPT/Gemini votes, reconciled with disagreement-based
confidence).

Resilience rules baked into every AI call:

- **Never pin a model name.** Claude and Gemini calls walk a fallback chain on
  404 (Google retiring `gemini-1.5-pro` once broke scoring in production).
- **Repair truncated JSON** (`_extractJSON`/`_repairJSON`) instead of failing
  with "could not parse".
- **429/529 → one retried call** after backoff.
- **Perplexity always goes through `/api/perplexity`** — their API blocks
  browser CORS.

## Conventions

- Responsive via inline `isMobile` ternaries (`window.innerWidth < 900`);
  every component that uses `isMobile` must define it — the prebuild
  scope-check enforces this (an undefined `isMobile` once blanked the app).
- Both client configs share all app code; never fork behaviour per client
  outside the config files.
- All changes ship to both mobile and desktop with sensible responsive values.
