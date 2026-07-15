# KrapMaps — Money Strategy (research-backed)

> Written July 2026. Grounded in live market research, not vibes. Ratings use a fixed
> rubric so they're comparable. Read the Reality Check first — it changes what's worth building.

---

## 0. The Reality Check (what the market actually says)

Five hard facts from current market data, each with a consequence for us:

1. **Solo-creator SaaS is a low-ARPU knife fight.** Median cheapest paid plan for creator
   analytics tools is ~$25/mo; 53% start below $29; $29 is the "impulse" ceiling; anything
   above $49 drops you out of the bottom two-thirds; $99+ "needs a very clear reason."
   vidIQ starts $16.58, Opus Clip $15, Metricool $20–25.
   → **Consequence:** selling $29/mo to solo creators is a grind — high churn, low margin,
   huge CAC. It should be a *distribution funnel*, not the primary revenue engine.

2. **"Predict my video before I post" is now commoditized.** Higgsfield's virality predictor
   is at a ~$300M annualized run-rate; ViralScore, Virality Predictor, OutlierKit and
   OpusClip's hook tester all offer hook score / retention / drop-off prediction.
   → **Consequence:** our Pre-Post / Video Checker is *table stakes*, not a moat. Do NOT
   pour effort into beating Higgsfield at raw prediction — they have a bigger dataset. Our
   edge has to be **personalization to the creator's own channel + outcome learning**, which
   generic predictors structurally can't do.

3. **AI prediction is reliable for *relative ranking*, not *absolute numbers*.** The best
   tools can say "Post A will beat Post B for your audience" — none can promise "this gets
   210k views."
   → **Consequence:** stop showing confident absolute view predictions (that's how you lose
   trust the first time we're wrong). Reframe around *ranking, confidence bands, and
   "better/worse than your last 10."* Turn accuracy into a tracked, provable asset (see F1).

4. **Done-for-you services are where the fast cash is.** UK DFY social pricing: £500–1,200/mo
   mid-tier, £1,500–3,000/mo premium. One agency grew video revenue 340% ($180k→$792k) in a
   year using AI to produce more, cheaper.
   → **Consequence:** the fastest £ is you running the tool *for* clients, not licensing it
   to them. Cash + proof + case studies, immediately.

5. **White-label to agencies is a validated, huge market.** ~73% of agencies already use
   white-label partners; the white-label marketing space is heading toward ~$99B. Agencies
   pay 10x what a solo creator pays and churn far less.
   → **Consequence:** the highest-leverage *product* buyer is an agency, not a creator.

**The thesis in one line:** *The tool is the moat and the credibility; services and agencies
are the money; the free audit is the distribution. Don't monetize solo creators first —
use them to prove the engine, then sell the engine to people with budgets.*

---

## Rating rubric (used everywhere below)

Each idea scored 1–5 on four axes, then an honest overall /10 + a verdict.

- **£ Potential** — how much money is realistically on the table.
- **Speed** — how fast it produces cash (5 = weeks, 1 = 6mo+).
- **Moat** — how hard to copy / how defensible.
- **Effort** — inverse cost (5 = cheap/fast to build, 1 = huge).

---

## 1. APP FEATURE IDEAS (rated)

### F1 — The Proof Engine (predicted vs actual, tracked publicly) ⭐
Auto-log every video's *prediction* at post time, then reconcile against *actual* views a
week later. Build a running, per-creator accuracy scorecard: "KrapMaps was within 18% on
your last 24 videos." Two payoffs: (a) turns the "absolute numbers are unreliable" weakness
into a *trust asset*, and (b) it's marketing — a public "we called it" record no generic
predictor has because they never see your real outcomes.
`£4 · Speed4 · Moat5 · Effort4` → **9/10.** This is the single most defensible thing we can
build. The corpus + outcome loop is the one thing Higgsfield/ViralScore *can't* replicate,
because they're one-shot tools with no relationship to your channel. Build this.

### F2 — Money Dashboard (reframe the whole app around £, not views)
Unify brand deals + creator-fund + predicted earnings into one revenue view. "You're on
track for £2,340 this month; here's the one video type driving it." Creators care about money,
not vanity metrics.
`£3 · Speed4 · Moat3 · Effort4` → **8/10.** Cheap, huge retention/willingness-to-pay lever —
money framing is why someone keeps paying. Reuses the Deals tab + scoring. Do it early.

### F3 — Media Kit + Rate Calculator (auto-built from real synced numbers)
One click → a brand-ready media kit from real stats + a "what to charge" calculator + a
predicted-performance sheet for a given brief. Creators desperately need this and it's the
on-ramp to the marketplace.
`£3 · Speed4 · Moat3 · Effort4` → **8/10.** Genuinely useful, shareable (watermarked = free
marketing), and it feeds the Phase-4 marketplace. High ROI.

### F4 — Competitor Autopsy → Steal-the-Format
Point at any creator; AI reverse-engineers their winning *format* into a repeatable template
personalized to your Voice DNA. Already have most of the audit tech.
`£3 · Speed4 · Moat3 · Effort3` → **8/10.** Best *free lead-gen* feature we have — "spy on any
creator" is inherently viral and screenshot-worthy. Point it outward as the funnel.

### F5 — Trend-to-Script in your Voice (speed as the moat)
Detect a rising sound/format in the creator's niche within hours and auto-draft a script in
their Voice DNA, ranked by predicted fit. Trends decay in days — being *first* is the value.
`£3 · Speed3 · Moat4 · Effort2` → **7.5/10.** Strong and defensible (Voice DNA + corpus +
freshness), but needs reliable trend ingestion to be trustworthy. Phase 2.

### F6 — Hook Lab (per-creator, calibrated A/B)
Generate 5 hook variants, predict each *against the creator's own history*, pick the winner.
Others test hooks generically; ours is calibrated to what's worked for *you*.
`£3 · Speed4 · Moat3 · Effort3` → **7.5/10.** Sharp, cheap, differentiates on personalization.
Bolt onto the Checker.

### F7 — Series / Franchise Builder (the one still unbuilt)
Turn one winner into a 10-part series with escalating hooks + a content calendar. Retention +
follower-growth play (series keep people coming back).
`£2 · Speed3 · Moat3 · Effort3` → **7/10.** Nice, not urgent. Build after the money features.

### F8 — Cadence / Post-time optimizer on the creator's OWN data
Not generic "best time to post" — grounded in when *their* audience actually converts.
`£2 · Speed3 · Moat2 · Effort4` → **6.5/10.** Cheap polish; commoditized elsewhere. Low priority.

**Feature verdict:** build **F1 → F2 → F3 → F4** first. They're the ones that (a) defend against
the commoditized predictors and (b) drive money/retention/distribution. Everything else waits.

---

## 2. BUSINESS / GTM IDEAS (rated)

### B1 — Be the agency first (DFY) ⭐
Run KrapMaps *for* 3–5 paying clients at £750–1,500/mo. Sell the outcome, not the software.
`£4 · Speed5 · Moat3 · Effort4` → **9.5/10.** Fastest real cash, generates the proof/case
studies everything else needs, and you dogfood the product. This is Move #1. Market rate
supports £500–3,000/mo; start at the bottom, raise with results.

### B2 — Sell/white-label to agencies ⭐
Same product, agency-branded dashboard + reports. 10x ARPU vs a creator, far lower churn.
73% of agencies already use white-label partners — the buying behavior is proven.
`£5 · Speed3 · Moat4 · Effort3` → **9.5/10.** Highest ceiling with a real, validated buyer.
Needs 2–3 case studies first (from B1), then this is the scalable engine.

### B3 — The Free Audit as a viral distribution loop ⭐
"Get your free Content Audit" → auto-generated, screenshot-worthy, watermarked, shareable
report using public/scraped data (so it's *not* blocked by the organic-views issue). Every
audit is an ad + a sales opener.
`£3 · Speed5 · Moat3 · Effort4` → **9/10.** This is your distribution answer to the "no
followers, will creators take me seriously" problem — the audit's *quality* is the credential,
not your follower count. Ties directly to F4. Do it now, alongside B1.

### B4 — UGC-ad pre-testing for brands (the sleeper high-value pivot) ⭐
Brands spend huge on UGC/creator ads and would pay real money to predict which creative wins
*before* ad spend. A brand testing 10 UGC variants values a good call at hundreds of £, not $29.
`£5 · Speed2 · Moat4 · Effort3` → **8.5/10.** The buyer here has a *real budget* and a clear
ROI ("don't waste £5k on the losing creative"). Same engine, radically higher-value customer.
Slower to reach (need brand relationships) but the biggest £-per-customer of anything here.

### B5 — Own one niche + sell a "State of [Niche]" data report
Dominate one vertical → dense corpus → sell the aggregate performance insights to brands/
agencies in that niche as a paid report.
`£3 · Speed2 · Moat4 · Effort3` → **7.5/10.** Real moat (data), but needs corpus density first.
Phase 3 data product.

### B6 — Managed-growth guarantee tier
You run it, charge a retainer + upside on results. Higher trust, higher price.
`£4 · Speed3 · Moat3 · Effort3` → **7.5/10.** Great once B1 proves you can deliver outcomes
repeatably. Premium version of B1.

### B7 — Scoring / prediction API (B2B licensing)
License the engine to other apps/tools. Near-zero marginal cost, recurring.
`£4 · Speed2 · Moat3 · Effort2` → **7/10.** Real, but you're selling a commoditized capability
(see Reality Check #2) unless the *personalization/outcome* layer is the pitch. Phase 4.

### B8 — Brand-deal marketplace
(Already logged in IDEAS.md — 9/10 ceiling, ~6 near-term, Phase 4 due to two-sided cold start.)
`£5 · Speed1 · Moat5 · Effort1` → **9/10 ceiling, 6/10 now.** The platform endgame. Seed it
from the B1/B2 creator+agency base — don't launch cold.

**Business verdict:** the money order is **B1 + B3 now → B2 as soon as you have 2 case studies →
B4 as the high-value expansion → B8 as the endgame.**

---

## 3. THE FAST-MONEY PLAN (next 90 days, week by week)

**Rule:** no new feature unless it serves *this quarter's* money goal. The bottleneck is
proof + distribution, not features.

### Weeks 1–2 — Unblock & arm (target: £0, but ready to sell)
- Ship **F3 (Media Kit)** and polish the **Free Audit (B3)** into a screenshot-worthy PDF.
- Rotate the leaked IG secret; get billing live (£19 founding / £29 standard — at the impulse
  ceiling on purpose).
- Standardize views on ORGANIC (done) and *label it* honestly.
- Write ONE killer outreach message to send *with* each free audit.

### Weeks 2–6 — Proof & first cash (target: £2–4k)
- Run **KrapMaps + Thierno** through the tool; log real predicted-vs-actual (start **F1**).
- Send **20–30 free audits** (B3) to creators in one niche → convert 2–3 into **DFY clients (B1)**
  at £750–1,500/mo.
- That's your first £2–4k *and* your first case studies.

### Weeks 6–12 — Package & prove the engine (target: £5–8k MRR)
- Turn the DFY wins into 2–3 hard **case studies** (before/after numbers via F1).
- Launch **self-serve** (£19/£29) with the free audit as the funnel — but treat it as lead-gen,
  not the main revenue.
- Build **F2 (Money Dashboard)** to lift retention on the paying users you do get.
- Start **B2 conversations** with 2–3 small agencies using the case studies.

### Months 4–6 — Scale the high-ARPU engine (target: £15–25k MRR)
- Land **2–3 white-label agency deals (B2)** at £300–800/mo each.
- Open **B4 (UGC ad pre-testing)** conversations with 1–2 brands — one deal here can beat 50
  creator subs.
- Keep the free-audit loop running as always-on distribution.

### Months 6–12 — Platform (target: £40k+ MRR)
- **B8 marketplace** seeded from the agency + creator base.
- **B7 API** if a licensing buyer appears.

---

## 4. Honest overall ratings & the ONE thing

| Move | Overall | Why |
|---|---|---|
| B1 Be the agency (DFY) | **9.5** | Fastest cash + proof. Start today. |
| B2 White-label to agencies | **9.5** | Highest ceiling, validated buyer. Needs case studies first. |
| F1 Proof Engine | **9** | The only real moat vs commoditized predictors. |
| B3 Free-audit loop | **9** | Solves distribution + the "no followers" problem. |
| B8 Marketplace | **9 ceiling / 6 now** | Endgame; seed from the base. |
| B4 UGC ad pre-testing | **8.5** | Biggest £-per-customer; slower to reach. |
| F2/F3/F4 money+kit+autopsy | **8** | Cheap, high-ROI, build first among features. |

**The single most important thing:** land your **first 2–3 paying DFY clients (B1)** using the
**free audit (B3)** as the opener — in the next 30 days. Everything else (white-label, API,
marketplace, most features) is gated on having *proof you can move someone's numbers.* Get that,
and every other door on this list opens. Chase features instead, and you'll have the best tool
nobody's paying for.

---

### Sources
- Creator analytics pricing benchmarks — stealwhatworks.com/blogs/news/creator-analytics-pricing
- vidIQ / Opus Clip / Metricool pricing — outlierkit.com, opus.pro/pricing, metricool.com/pricing
- Pre-publish predictors (Higgsfield ~$300M ARR, ViralScore, Virality Predictor) —
  pasqualepillitteri.it, viralscoreai.app, viralitypredictor.net, opus.pro/blog
- AI prediction accuracy (relative vs absolute) — velocity.li, cotera.co
- UK DFY / agency pricing & AI video revenue growth — superhub.biz, 12amagency.com, mindstudio.ai
- White-label market (73% of agencies, ~$99B) — apaya.com, designrush.com
- Creator economy / AI market size — amt.ai, researchandmarkets.com
