# Launch Readiness — honest assessment

> "Launch" here = the real launch: use it for yourself + Thierno, send free audits, run paying
> clients. NOT a mass public sign-up launch (that comes later, and needs billing + RLS hardening).

---

## ✅ READY (verified in code)

- **Security — no secrets leak to the browser.** Only the Supabase *publishable* key is baked in,
  which is designed to be public. No service-role / secret / AI keys in the frontend bundle.
- **Crash safety.** A real error boundary wraps every view — on any crash the user sees a graceful
  "Something went wrong, your data's safe, reload" screen with Reload / Try Again, never a white screen.
- **No fabricated numbers.** Every predicted/estimated view surface returns "—" (or is hidden) when
  there's no real data. The scoreIdea "mandatory range", assistant, strategy builder, and Home
  analysis all guarded.
- **Brand-fit enforced everywhere.** Off-brand content can't score well or get a "post it" — gated in
  the Checker, scoreIdea, Autopilot, captions, alt-hooks, edit-rescore, gen-ideas.
- **Empty states.** Analytics Overview, Captions, and the main tabs degrade gracefully on a fresh
  account instead of showing zero-walls or fake splits.
- **Self-correction loop.** Daily AI self-test (8 cases), global ⚑ Report button on every screen,
  per-page learned guardrail from reports, review queue in Settings.
- **Video Checker + Audit + Assistant video** all run through the backend Gemini key (no per-user key).
- **Build is clean.**

---

## ⚠️ MUST DO BEFORE YOU RELY ON IT (your actions — not code)

1. **Top up the app's backend AI key.** It's currently dry, so scoring / Checker / audit write-ups /
   the daily self-test won't run until it's funded. Nothing works without this. **#1 blocker.**
2. **Set the niche in Settings for you + Thierno.** Existing accounts onboarded before niche capture,
   so brand-fit runs half-blind for the two people actually using it. 30 seconds each.
3. **Verify Supabase Row-Level Security (RLS) is ON** for every table. The publishable key is safe to
   ship ONLY if RLS restricts what it can read/write. Without RLS, anyone with the key (it's in the
   bundle) could read/write your tables. **Security blocker — check this before real client data goes in.**
4. **Rotate the leaked IG app secret** that was pasted in chat weeks ago. Assume it's compromised.

---

## 🟡 NICE-TO-HAVE (not blockers for this launch)

- **Final visual mobile polish pass.** The code-level sweep is clean; the render-level pass (does
  anything look off on a real phone) is best done by the audit agents — blocked by the Claude spend
  limit. Do it when budget resets, or catch issues live via the ⚑ Report button as you use it.
- **Billing.** Off is fine for the free-audit + DFY launch (you invoice clients directly). Only needed
  when you open self-serve sign-ups.
- **Run the AI Self-Test once** after topping up the key → confirm 8/8 before showing anyone.

---

## Verdict
**The software is launch-ready for your actual launch** (self-use, free audits, DFY clients), pending
the 4 "must do" items above — 3 of which are your actions (fund the key, set niches, rotate the secret)
and 1 is a config check (RLS). None require more building.

The honest gap remains what it's been all week: **not the product — proof + distribution.** Ship it,
send the audits, land the first client.
