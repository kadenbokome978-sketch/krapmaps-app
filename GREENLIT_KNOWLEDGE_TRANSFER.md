# Greenlit — Knowledge Transfer for NEXUS

Extracted from this Claude Code session's conversation context only. Where something was not discussed in this session, it is marked **UNKNOWN — not covered in this session's context** rather than invented. This session worked directly in the `krapmaps-app` codebase (repo name is legacy; the live product is branded **Greenlit**, deployed at **greenlit.space**), so Sections 3 and 5 (Product/Technical) are the most complete — they're drawn from direct code inspection, not just recollection.

---

# 1. Executive Summary

**What is Greenlit?**
Greenlit is an AI content-strategy SaaS for short-form video creators (TikTok/Instagram). It ingests a creator's channel data (posted videos, views, comments, thumbnails) and uses a cascade of AI models (Anthropic → GPT → Gemini, in that provider order) to score content ideas, predict performance, analyze visual style, and coach the creator toward higher-performing videos.

**What problem does it solve?**
Creators post content somewhat blind — they don't know in advance which video ideas are likely to work, and after posting they don't systematically learn from what did/didn't. Greenlit closes that loop: score an idea before filming → film it → check the actual result (via a 6-judge AI panel and/or real posted metrics) → feed that outcome back into future scoring, so the system gets sharper the more the creator uses it.

**Who is it for?**
TikTok/Instagram creators who want data-driven content strategy rather than guessing. The product also has an outreach/prospecting side (a "prospect finder" that scores and ranks creator leads), suggesting a second audience of agencies, managers, or the Greenlit team itself doing outbound to creators — **exact target customer for the outreach feature (in-house growth tool vs. a sold feature) is UNKNOWN — not covered in this session's context.**

**Why does it exist?**
UNKNOWN — the founding motivation/origin story was not discussed in this session.

---

# 2. Business History

**UNKNOWN — not covered in this session's context.** This session was pure engineering (bug fixes, feature builds) inside an already-existing, already-deployed product. No milestones, pivots, founding story, or naming history (why "Greenlit" / why the repo is still called `krapmaps-app`) came up. The repo itself is evidence the product may have been renamed from "KrapMaps" to "Greenlit" at some point, but the rename's timing/reasoning is not in this session's context.

---

# 3. Product Knowledge

This is the most substantively documented section — built directly from code read/written in this session (`src/App.jsx`, a single-file React SPA of ~15,000+ lines).

## Current / recently-built features (this session)

- **Cross-device sync (Supabase-backed).** Previously, AI results (analysis, next-video ideas, weekly reports, trends, Deep Scan results, tasks) were stored client-side only, so they didn't follow a user across browsers/devices. Fixed by syncing these to Supabase `km_config` (one row per key, keyed by `data` JSONB column) via `sbSyncJSON`/`sbLoadJSON` helpers, loaded on boot.
- **Deep Visual Scan.** Auto-runs once at the start of a user's "build" (fires when ≥5 videos with view data exist, a Gemini key is configured, and no scan result exists yet), plus a manual re-scan button in Settings. This scan analyzes visual style across the creator's video library.
- **6-person AI judges panel ("X Factor" style).** The product's centerpiece feature this session. Uploaded videos are watched by 6 specialist AI judges — Maya, Theo, Priya, Jordan, Kwame, Elena — each scoring a different "lens": Hook, Retention, Share, Emotion, Fit, Differentiation (`PANEL_LENSES`). Explicitly built to look like people, not emojis/avatars — each judge has an inline-SVG portrait (`JudgeAvatar`) with varied skin tone/hair/style. Presented on an X-Factor-style "stage" (`JudgesStage`) with spotlights, per-judge YES/NO badges, and a tally. `PanelWhy` shows per-lens detail: score bars, headline, evidence, suggested fix. If the underlying model skips returning a structured panel, `_panelFromVerdict()` synthesizes one from the verdict so the panel always renders.
- **The Checker (video-analysis tool), consolidated.** Originally there were multiple overlapping views — a "Reader" (AI Teardown), a "Test Audience" prototype, a separate "Checker." The user determined these were redundant/confusing (Reader duplicated AI Teardown; a synthetic audience became the judges panel idea). Consolidated into **one Checker with two modes**, built directly on `PrePostCheck` (which now takes `ideas`/`setIdeas` props and an `attachId` state to let a filmed video attach back to its originating idea). Idea cards now show a "FILMED · GO/RISKY/NO" badge with the judge tally once a video's been checked.
- **Score-idea-then-confirm-when-filmed loop.** The original ask that kicked off adjacent work this session: users wanted to see how a video idea's predicted score compares once it's actually posted/filmed, so the system improves over time. `buildCheckLearning()`/`formatCheckLearning()` extract "execution learning" from filmed ideas (per-lens scores stored on `idea.check.lenses`) and feed it back into future scoring context.
- **Format Elo.** `calcFormatElo()` computes Elo-style ratings per content format, now feeding into the scoring prompt context (previously display-only in Analytics — see "islands" below).
- **Prospect finder upgrade — "Verify & rank."** Previously weak; upgraded so `enrichAndRank()` scrapes each candidate and scores fit using: inconsistency (40% weight), underperformance (25%), recency (20%), follower-band fit (15%). Uses `_mapPool()` (bounded-concurrency map) and `_parseBand()` (follower-band parsing) helpers, with a live progress bar (`findProg` state) during verification.
- **Outreach channels.** User explicitly wants **email and text**, not cold calling or calls. An outreach message generator (DM/text/email channel toggle) was proposed but the user said to leave it for later — **not built this session.**

## Removed / rejected features (this session)

- **`VideoReaderView` ("Reader")** — removed entirely (~287 lines + its nav entry). Judged redundant with "AI Teardown," and had a live crash bug (see Section 9).
- **`TestAudienceView`** — an earlier prototype for a "synthetic audience" of AI viewers; evolved into the judges-panel concept, then the standalone view was removed in favor of wiring the panel directly into `PrePostCheck`.
- **`CheckerView`** — removed as a separate view; replaced by direct use of `PrePostCheck`.

## Known architecture problem: "the three islands" (identified but only partially fixed)

A system-map document produced mid-session (found in scratchpad as `brain-map.html`) identified that most signals the app collects properly feed a central "Channel Brain" that `scoreIdea()` reads (posted outcomes, audience/comment insights, visual DNA, cross-creator corpus, channel insights/theory) — but **three newer, richer features only display, and don't teach the brain back:**

1. **Panel video verdict** — written to the idea card only; the judges' real judgement of a filmed video "evaporates" instead of feeding outcome learning / Hook / Fit signals. *(Session work below appears to have begun closing this gap via `buildCheckLearning()`.)*
2. **Format/Content Elo** — computed live in Analytics for a leaderboard; historically never touched scoring. *(Session work above wired Elo into the scoring prompt — likely resolves this island, though full verification wasn't re-confirmed after the change.)*
3. **Deep Visual Scan** — display-only in Analytics + Settings, while an *older* "Visual DNA" signal already feeds scoring — i.e., two visual brains where only one is wired. **Recommended fix (from the map, not yet executed): merge Deep Scan into the single Visual DNA signal `scoreIdea()` reads, rather than running two parallel visual analyses.**

The map's own recommended fix order was: (1) panel verdict → brain, (2) merge the two visual brains, (3) Format Elo → scoring weight. Items 1 and 3 appear to have been actioned this session; **item 2 (merging Deep Scan into Visual DNA) has NOT been done — confirm before assuming it's resolved.**

## Planned functionality (explicitly discussed, not yet built)

- Outreach message generation with a DM/text/email channel toggle (deferred by user request).
- TikTok scraper root-cause fix — the *symptom* (opaque "Scraper error" message) was fixed, but *why* the scraper fails is still unknown (see Section 9).

---

# 4. Branding

**UNKNOWN — not covered in this session's context.** No discussion of logo, color palette, typography, brand identity, positioning, tone of voice, or design philosophy occurred. The judges-panel UI direction ("make it look like X Factor," "no emojis, make them into people") is a *feature design* decision, not brand-system documentation, though it may be relevant input for a future brand-voice doc (playful, personality-driven, competitive/talent-show energy).

---

# 5. Technical Knowledge

## Architecture
- **Frontend:** Single-file React SPA, `src/App.jsx`, ~15,000+ lines. Built with Vite.
- **Backend:** Vercel serverless functions under `api/*.js`.
- **Database/Auth/Storage:** Supabase — Postgres tables (`km_config`, `km_videos`, `km_ideas`, `km_cal`, `km_corpus`, `km_billing`), Supabase Auth, and Supabase Storage (bucket `km-uploads`, auto-created if missing).
- **Deployment flow:** work happens on branch `claude/wizardly-dirac-jxhvft` → PR → merge to `main` → Vercel auto-deploys to greenlit.space.

## AI provider stack
- Multi-provider cascade: **Anthropic → GPT → Gemini**, in that fallback order, for scoring/analysis.
- **Gemini File API** used specifically for video vision (the judges panel watches uploaded clips). Uses `gemini-2.5-flash` then `gemini-2.0-flash` as fallback models (`GEN_MODELS` in `api/gemini-upload.js`).
- Server holds `GEMINI_KEY` centrally so customers don't need their own key by default; a BYO key can override via `X-Gemini-Key` header (and BYO callers skip the login requirement, since they're spending their own quota).

## Upload pipeline (heavily debugged this session — now the load-bearing technical detail)
Getting large video clips from a user's browser into Gemini for the judges panel to watch went through several failed architectures before landing on the current one:
1. ~~Direct browser POST to the serverless function~~ — dead end, Vercel caps inbound request bodies at ~4.5MB.
2. ~~Google resumable upload, direct browser→Google via XHR~~ — dead end, blocked by CORS (Google's File API doesn't allow browser-direct uploads).
3. ~~Chunked relay through the serverless function~~ — dead end, Google's resumable API requires chunks be an exact multiple of 8MB (8,388,608 bytes), but Vercel's ~4.5MB body cap makes that impossible to satisfy.
4. **Current (working) architecture: browser → Supabase Storage (staged) → server → Gemini.**
   - `stage=sign` — server auto-creates the `km-uploads` bucket if missing, then returns a Supabase **signed upload URL** so the browser can PUT the file directly to Supabase Storage (no server body-size limit applies; a signed URL carries its own auth).
   - Browser uploads via **XHR** (not `fetch`) specifically to get upload progress percentage, needed for iPad/iOS UX.
   - `stage=ingest` — server pulls the staged file from Supabase (server-side, no size limit) and re-uploads it to Gemini via the proven multipart method, then best-effort deletes the staged copy.
   - Auth for Supabase Storage server calls uses **`apikey` header only** — Supabase's new-style `sb_secret_...` service-role keys are *not* valid JWTs, so sending them as `Authorization: Bearer` is silently rejected. This one line (`apikey`-only) was the fix for two separate 404-class bugs.
   - Bucket creation must **not** pass an explicit `file_size_limit` — a value above the Supabase project's own global cap causes the *entire* bucket-creation call to fail with 413 Payload Too Large. Fixed by omitting the parameter and inheriting the project default (this session's final, just-merged fix, PR #312 in the repo, commit `3c2117b`).

## Known limitations / technical debt
- `src/App.jsx` is a single ~15,000-line file — noted implicitly by the Vite build warning ("Some chunks are larger than 500kB after minification") — no code-splitting in place.
- The old chunked-relay upload path (`relay` mode) is still present in `api/gemini-upload.js` but unused after the architecture pivot to Supabase staging — dead code not yet cleaned up.
- TikTok scraper (Bright Data-backed, `api/rapid.js`) throws a generic, cause-unknown failure under some conditions — the error now surfaces Bright Data's real message instead of a swallowed one, but the underlying root cause (could be session expiry, Bright Data credit exhaustion, or token misconfiguration) is still undiagnosed.
- iOS Low Power Mode can throttle `requestAnimationFrame` enough that UI reveals (e.g., the judges panel appearing) silently never fire; patched with a `setTimeout` safety net, but this class of bug (animation-dependent UI state) may recur elsewhere in the app.

## APIs / integrations referenced in code
- Anthropic API, OpenAI (GPT) API, Google Gemini API (generateContent + File API).
- Supabase REST (`/rest/v1/...`) and Storage (`/storage/v1/...`) APIs.
- Bright Data "TikTok - Posts by Profile Fast API" dataset (`gd_m7n5v2gq296pex2f5m`) for TikTok scraping — synchronous scrape endpoint, gated to signed-in users only (prevents anonymous credit drain).
- RapidAPI passthrough for Instagram scraping (`instagram-scraper-api2.p.rapidapi.com`), host-allowlisted to prevent SSRF, with an optional BYO-key override header.

## Security constraints explicitly enforced this session (must be preserved by any future work)
- **Never use the `VITE_` env-var prefix for API keys** — Vite bakes `VITE_`-prefixed vars into the public JS bundle, exposing them to anyone.
- **The GitHub repo is public** — all code is visible to anyone.
- **Never push to any branch other than `claude/wizardly-dirac-jxhvft`** without explicit permission.
- Never place secrets inside AI prompts.
- Spend limits should be set on all API providers.
- Supabase new-style secret keys (`sb_secret_...`) authenticate via the `apikey` header only, never `Authorization: Bearer` (they are not JWTs).

---

# 6. Marketing

**UNKNOWN — not covered in this session's context.** No discussion of launch strategy, TikTok/organic growth tactics, SEO, community building, partnerships, or named competitors occurred. The only marketing-adjacent artifact is the *product's own* outreach/prospecting feature (Section 3), which is a feature Greenlit ships to its users, not Greenlit's own go-to-market plan.

---

# 7. Revenue

There is a real, working billing system in the codebase (`api/_billing.js`), so this is partially documented from code, though no business-side commentary (actual pricing strategy, conversion data, etc.) was discussed.

**Tiers found in code (`TIERS` in `api/_billing.js`):**

| Tier | Label | AI scoring calls/mo | Audits/mo | Price |
|---|---|---|---|---|
| `free` | Free | 10 | 1 | $0 |
| `pro` | Pro | Unlimited | Unlimited | $29 |
| `studio` | Studio | Unlimited | Unlimited | $99 |

- **Monetization mechanism:** usage metering gates the main cost driver (AI scoring calls) per monthly period; tier and usage are stored server-side only (`km_billing` table, service-role-key-only writes) so a client can never forge a paid tier — the client reads its tier through `/api/me`.
- **"Founder" / comped accounts:** an email allowlist (`FOUNDER_EMAILS` env var) grants unlimited top-tier access with no Stripe involvement — described in code comments as being for "design partners who pay in data + testimonials," implying an early-access/beta-partner arrangement rather than a paying customer.
- **Payment processor:** Stripe is referenced in comments as the intended integration ("no Stripe" for founders implies Stripe *is* the normal path) but no Stripe integration code, webhook handling, or checkout flow was seen or discussed in this session.
- **Future revenue opportunities:** UNKNOWN beyond the existing three-tier structure — no discussion of add-ons, usage-based upsells, agency/team plans, or the outreach feature's monetization status (bundled into Pro/Studio, or a separate product?).

---

# 8. Roadmap

No formal roadmap document was discussed. What exists is inferable only from the sequence of user requests this session, which is not the same thing as a prioritized roadmap — flagging that distinction explicitly.

**Short term (explicitly next, this session):**
- Confirm the video-upload fix (PR #312, just merged) actually resolves end-to-end upload in production — user was asked to retest and hasn't yet confirmed. This is the single open loop as of the end of this session.
- Diagnose the TikTok scraper's actual root cause (error message now surfaces correctly, but the underlying failure reason is still unknown).

**Medium term (discussed, deferred by user):**
- Build the outreach message generator (email/text, channel toggle) — user said "leave that for now just thoughts," i.e., wanted to think about it before committing.
- Merge Deep Visual Scan into the single Visual DNA signal (identified as the one un-fixed "island" from the brain-map analysis).

**Long term:**
UNKNOWN — not discussed.

**Why each item matters:** stated inline above where the reasoning was actually given; no separate long-term strategic rationale was discussed for items beyond their immediate bug/feature purpose.

---

# 9. Known Problems

| Issue | Impact | Priority (inferred) | Status / proposed solution |
|---|---|---|---|
| Bucket creation 413 due to `file_size_limit` exceeding project cap | Blocked ALL large-clip uploads to the judges panel | Critical | **Fixed this session** — parameter removed, PR #312 merged to `main`. Awaiting user confirmation of live behavior. |
| Reader crash — `Can't find variable: buildChannelContext` | Crashed the Reader page entirely | Critical (for that page) | **Fixed** — dead reference removed; page itself later deleted as redundant. |
| TikTok scraper generic "Scraper error" | Hid the real failure reason from the user, blocking debugging | High | **Partially fixed** — real error message now surfaces from Bright Data; root cause of the underlying scrape failures is still unknown. |
| Judges panel silently missing on off-brand-verdict videos | Model sometimes omitted the panel from its response, leaving users with no explanation | High | **Fixed** — `_panelFromVerdict()` fallback always synthesizes a panel from the verdict. |
| Upload hanging indefinitely on large clips | Users stuck on "Uploading your clip…" with no feedback or completion | Critical | **Fixed** via the Supabase-staging architecture rebuild (see Section 5). |
| Judges panel not rendering after a successful upload on iOS | Looked like total failure even though the upload/analysis succeeded | High | **Fixed** — traced to `requestAnimationFrame` throttling under iOS Low Power Mode; `setTimeout` safety net added. |
| "Uploading your clip…" subtitle stayed static regardless of actual stage | Misleading progress messaging | Low/Medium | **Fixed** — subtitle now tracks the real stage. |
| Deep Scan / Visual DNA duplication ("two visual brains, one wired") | Deep Scan's analysis never actually influences scoring, despite looking like it does | Medium (silent, not user-facing-broken, but wastes signal) | **Not fixed** — recommended fix: merge into the single Visual DNA signal. |
| Unused legacy `relay` upload mode still present in `api/gemini-upload.js` | Dead code / maintenance debt, not user-facing | Low | **Not fixed** — candidate for cleanup. |
| `src/App.jsx` is a single ~15,000-line file with large minified chunks | Build-time warning; potential long-term maintainability/perf concern | Low (not urgent) | **Not addressed** — Vite suggests code-splitting via dynamic `import()`/`manualChunks`. |

---

# 10. Lessons Learned

- **Diagnosing upload failures required treating each error message as a real clue, not noise** — the path from "hangs forever" → "400 CORS-style failure" → "400 chunk-granularity mismatch" → "66MB over fallback limit" → "404 bucket doesn't exist" → "413 bucket size cap exceeded" was a genuine iterative debugging process, not one fix; each error retired one wrong architecture and pointed at the next.
- **A plausible-looking success can be a false negative.** The resumable direct-upload approach was briefly believed to be working because the user waited about a minute without an error — it was actually silently failing to CORS. Lesson: absence of an immediate error is not confirmation of success, especially with async browser uploads.
- **Non-JWT API keys can look like "auth failing" when it's really "wrong header."** Supabase's newer `sb_secret_...` service-role keys broke silently under the old `Authorization: Bearer` pattern (which works fine for legacy JWT-style keys) — a subtle key-format-vs-header-convention mismatch that cost two separate rounds of debugging (once for bucket auth, implicitly a risk anywhere else `SUPABASE_SERVICE_ROLE_KEY` is used with a Bearer header).
- **Platform limits compound in nonobvious ways.** Vercel's ~4.5MB body cap and Google's 8MB chunk-granularity requirement are each individually reasonable, but together they made a whole architecture (chunked relay through the serverless function) mathematically impossible — no amount of retrying could have fixed it; the fix had to be architectural (route around the server entirely via Supabase staging).
- **Redundant features accumulate under different names for the same underlying idea.** "Reader," "Test Audience," and "Checker" were three separate builds converging on the same job (assess a video), which only became clear once the user pushed back ("I don't even know what this page does... I thought that was what AI Teardown was for"). Lesson: naming/reviewing overlapping features earlier would have saved the later consolidation work.
- **"Islands" of computed-but-unused data are an easy trap in an AI-scoring product.** Three separate features (panel verdict, Format Elo, Deep Scan) were each independently built, looked complete, and displayed nicely — but didn't feed back into the core scoring loop that's supposed to be the product's compounding advantage. Building a feature that *computes* a signal is not the same as *wiring* it into the system that uses signals.
- **Mobile-specific quirks (iOS Low Power Mode throttling `requestAnimationFrame`) can masquerade as a completely unrelated bug** (the user reported it as "no judges showed," which reads like an upload/API failure, not an animation-timing issue).

---

# 11. Missing Documentation

No formal documentation beyond inline code comments exists for Greenlit based on this session. Recommended documents a NEXUS vault should contain, with suggested filenames matching a per-venture vault convention:

| Suggested filename | Purpose | Why it's missing/needed |
|---|---|---|
| `Greenlit/00-overview.md` | Executive summary, problem/solution/audience (Section 1) | Never written in this session; this document's Section 1 is the closest substitute but is scoped to session context only. |
| `Greenlit/history.md` | Founding story, pivots, naming (KrapMaps → Greenlit?), major decisions | Entirely absent — Section 2 above is fully UNKNOWN. |
| `Greenlit/product-overview.md` | Full current feature set, mode-by-mode | Partially reconstructable from code (this doc's Section 3), but should be authored properly, not reverse-engineered from a bug-fix session. |
| `Greenlit/architecture.md` | System architecture, upload pipeline, provider cascade, Supabase schema | Section 5 above is a strong starting draft (built from direct code reads) but should be formalized and kept in sync with code. |
| `Greenlit/brand-guidelines.md` | Logo, colors, typography, tone of voice, positioning | Entirely absent — Section 4 fully UNKNOWN. |
| `Greenlit/marketing-strategy.md` | Launch plan, channels, competitors, growth tactics | Entirely absent — Section 6 fully UNKNOWN. |
| `Greenlit/pricing-and-revenue.md` | Full pricing rationale, Stripe integration status, upsell plans | Section 7 partially reconstructed from `_billing.js`; rationale and Stripe status are UNKNOWN. |
| `Greenlit/roadmap.md` | Prioritized short/medium/long-term plan with rationale | Absent as a real artifact — Section 8 is inferred from session request order only, not a real prioritized roadmap. |
| `Greenlit/known-issues.md` | Living bug/debt tracker | This session's Section 9 is a good seed but should become a maintained doc, not a one-time export. |
| `Greenlit/decisions-log.md` | Running log of "why we chose X over Y" (e.g., why Supabase staging over resumable relay) | Would have made this knowledge-transfer exercise far faster; several architectural rationales in Section 5 exist only because this session happened to narrate them. |

---

# 12. Future Opportunities

Items explicitly raised by the user and then deliberately postponed, with the stated or inferable reason:

- **Outreach message generator (DM/text/email channel toggle).** User's own words: "leave that for now just thoughts" — postponed not because it's low-value, but because the user wanted to think it through further before committing to a design. The underlying need (email/text over cold calling) is already decided; only the generator's design/build is deferred.
- **Merging Deep Visual Scan into the single Visual DNA scoring signal.** Identified as a real gap by the brain-map analysis but not acted on this session — postponed implicitly, by omission, not by explicit user deferral; recommend confirming with the user whether this is still wanted before assuming priority.
- **Cleanup of the unused legacy chunked-relay upload code path.** Left in place after the Supabase-staging pivot; low urgency, purely technical debt, no functional impact — reasonable to postpone indefinitely unless it causes confusion in future maintenance.

No other "postponed" items were identified with enough context to include here; anything beyond this list would be invention.

---

*End of knowledge transfer. Compiled from this session's conversation context and direct reads of `src/App.jsx`, `api/gemini-upload.js`, `api/_billing.js`, and `api/rapid.js` only. Sections 2, 4, and 6 are substantively empty by necessity — that gap itself is the most actionable finding here: those three areas need a real authoring session with the founder, not extraction from an engineering session.*
