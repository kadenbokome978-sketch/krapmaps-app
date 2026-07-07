# Launch Runbook — start pushing this out

Read this first. There are **two ways to launch**. Do **Path A tomorrow** — it needs
almost no setup and gets you selling. Path B (self-serve SaaS) is a few days of
setup; do it over the coming week once money is already coming in.

---

## Path A — Sell tomorrow (recommended, ~30 min setup)

You don't need billing, backend mode, or the full Stripe integration to start.
You need: the app working, the audit tool working, and a way to take money.

### 1. Make sure the app runs (5 min)
- Merge PR #3 (or open the Vercel preview link on the PR).
- Open the app on your phone. You should see Home, Content, the **AUDIT** tab, and
  in **Settings** a **"Plans — Preview"** card. If you see those, the deploy worked.

### 2. Turn on the audit tool (5 min) — this is your sales weapon
- Settings → add your **TikTok (RapidAPI)** key (the same scraper key that syncs
  your own TikTok). Without it the audit can't pull anyone's videos.
- Go to the **AUDIT** tab → type a creator's @handle → **RUN AUDIT**.
- If it works, you'll get a full report with a **COPY AS TEXT** button.
- Test it on 2–3 handles now so you know it's solid before you send anything.

### 3. Set up a way to take money (10 min) — no code
- In Stripe (or PayPal), create a **Payment Link**:
  - "Content Audit + 30-Day Plan" — one-time, **£50**.
  - (optional) "Monthly Strategy" — recurring, **£29/mo**.
- That's it. No integration needed — you just send the link when someone says yes.

### 4. Get your first 5 conversations (the actual work)
- Make a list of 50 creators (your travel niche + local businesses — see the plan).
- For each: run the AUDIT → **Copy as text** → send it in a DM with:
  > "Made an AI tool, ran your channel through it — here's what it found, free. Happy to send the full breakdown."
- First 3–5 audits **free** for testimonials. Then send the £50 Payment Link.

**That's a real business you can run tomorrow with zero backend setup.**

---

## Path B — Self-serve SaaS (do this over the week, not tonight)

This lets strangers sign up and pay themselves. More setup, bigger payoff. Do it
**in this exact order** — the steps depend on each other.

### Step 1 — Fix Supabase (BLOCKER for everything below)
Backend mode and cross-device sync both need Supabase working. Right now the anon
key is rejected (401).
- Supabase dashboard → make sure the project is **active** (not paused).
- Settings → API → copy the **Project URL** and **anon key**.
- In the app: Settings → Cloud Sync → paste both → **TEST & SAVE**. It must say
  "Connected". Don't go further until it does.

### Step 2 — Create the tables (Supabase SQL editor)
Run these once (full versions in `BACKEND_SETUP.md`):
```sql
create table if not exists km_config       (id text primary key, data jsonb, updated_at timestamptz default now());
create table if not exists km_videos       (id text primary key, title text, views bigint, likes bigint, comments bigint, shares bigint, created_at timestamptz, platform text);
create table if not exists km_ideas        (id text primary key, data jsonb, updated_at timestamptz default now());
create table if not exists km_cal          (id text primary key, data jsonb, updated_at timestamptz default now());
create table if not exists km_deals        (id text primary key, data jsonb, updated_at timestamptz default now());
create table if not exists km_billing      (id text primary key, data jsonb, updated_at timestamptz default now());
alter table km_billing enable row level security;   -- server-only, no anon policies
```

### Step 3 — Enable email auth
Supabase → Authentication → Providers → Email → enable. Turn "Confirm email" OFF
for fastest onboarding (the app handles either way).

### Step 4 — Turn on backend mode + server keys (Vercel env vars)
```
VITE_REQUIRE_AUTH = true
VITE_SB_URL       = your Supabase URL
VITE_SB_KEY       = your Supabase anon key
SUPABASE_URL      = same URL
SUPABASE_ANON_KEY = same anon key
ANTHROPIC_KEY     = your Claude key   (at least one AI key required)
RAPIDAPI_KEY      = your TikTok scraper key
```
Redeploy. Now users get a login screen and never need their own keys.

### Step 5 — Turn on billing (Stripe)
- Stripe → create two recurring Prices: **Pro** and **Studio** → note the `price_…` ids.
- Stripe → Developers → Webhooks → add `https://<your-app>/api/stripe-webhook`,
  subscribe to `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted` → copy the `whsec_…`.
- Vercel env vars:
```
SUPABASE_SERVICE_ROLE_KEY = Supabase service_role key (secret)
STRIPE_SECRET_KEY         = sk_live_… (use sk_test_… while testing)
STRIPE_PRICE_PRO          = price_…
STRIPE_PRICE_STUDIO       = price_…
STRIPE_WEBHOOK_SECRET     = whsec_…
```
Redeploy.

### Step 6 — Test before charging anyone
- Use Stripe **test mode** first. Sign up as a new user, hit the score limit,
  click Upgrade, pay with Stripe's test card `4242 4242 4242 4242`.
- Confirm your tier flips to Pro in Settings. Then switch to live keys.

---

## Pricing (already built into the app)
| Plan | Price | Limit |
|---|---|---|
| Free | £0 | 10 idea scores / month |
| Pro | £29/mo | 400 scores + trends + consensus |
| Studio | £99/mo | Unlimited + neural predictor |

Change the numbers in `api/_billing.js` (`TIERS`).

---

## Honest priorities for tomorrow
1. **Do Path A.** Get the audit tool working and send 10 DMs. That's real progress.
2. Don't do the full Path B setup while tired — it's fiddly and every step depends
   on the last. Do it calmly over the week once you have a paying customer or two.
3. The product is code-complete. What's left is **selling and configuration**, not
   more features. Resist the urge to keep polishing — go get the first yes.
