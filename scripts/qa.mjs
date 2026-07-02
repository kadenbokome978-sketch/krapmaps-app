#!/usr/bin/env node
// QA harness: walks every nav view at mobile + desktop, capturing JS errors,
// horizontal overflow (classic mobile bug), empty renders, and screenshots.
// Not wired into build — run manually: `node scripts/qa.mjs`
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require("playwright")); } catch { try { ({ chromium } = require("playwright-core")); } catch {} }
if (!chromium) { console.log("• qa: playwright unavailable — skipping."); process.exit(0); }

const PORT = 4173, URL = `http://localhost:${PORT}/`, EXEC = process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium";
const OUT = "/tmp/claude-0/-home-user-krapmaps-app/b4d48af6-36da-56f8-9086-55d42d3d2483/scratchpad/qa";
mkdirSync(OUT, { recursive: true });
const NAV = ["home", "content", "analytics", "tasks", "deals", "growth", "settings"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isNoise = (t) => /Failed to load resource|ERR_|net::|status of 40[0-9]|Lenis|gsap/i.test(t);

const preview = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
process.on("exit", () => { try { preview.kill(); } catch {} });

const seed = () => {
  const vids = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, title: `Demo video ${i + 1} with a longish title to test wrapping`, views: 12000 * (i + 1), likes: 900 * (i + 1), comments: 40 * i, shares: 10 * i, type: ["facecam", "voiceover", "skit"][i % 3], hook: ["achievement", "question", "shock"][i % 3], platform: i % 4 === 0 ? "instagram" : "tiktok", created_at: new Date(2026, 5, i + 1).toISOString() }));
  const ideas = Array.from({ length: 6 }, (_, i) => ({ id: 100 + i, title: `Content idea ${i + 1} — a fairly descriptive concept line`, hook: "You won't believe this", type: "facecam", viral: 40 + i * 9, status: i % 2 ? "posted" : "idea", postedViews: i % 2 ? 30000 + i * 5000 : null }));
  localStorage.setItem("krapmaps_v1_onboarded", "true");
  localStorage.setItem("krapmaps_v1_videos", JSON.stringify(vids));
  localStorage.setItem("krapmaps_v1_ideas", JSON.stringify(ideas));
  localStorage.setItem("krapmaps_v1_deals", JSON.stringify([{ id: 1, brand: "Acme Co", type: "Sponsored Post", value: "2500", status: "Signed", platform: "TikTok", deliverable: "1x video", created: "2026-06-01" }]));
};

async function run(browser, label, viewport, isMobileFlag) {
  const ctx = await browser.newContext({ viewport, isMobile: isMobileFlag });
  await ctx.addInitScript(seed);
  const page = await ctx.newPage();
  const findings = [];
  page.on("pageerror", (e) => findings.push(`[${label}] PAGEERROR: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !isNoise(m.text())) findings.push(`[${label}] CONSOLE: ${m.text()}`); });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 20000 });
  await sleep(1500);

  for (const view of NAV) {
    try {
      if (isMobileFlag) {
        // open drawer (hamburger is the 40x40 button top-left with no text), then click label
        await page.evaluate(() => {
          const btns = [...document.querySelectorAll("button")];
          const burger = btns.find((b) => !b.textContent.trim() && b.offsetWidth <= 44 && b.getBoundingClientRect().top < 90 && b.getBoundingClientRect().left < 90);
          burger && burger.click();
        });
        await sleep(350);
        await page.evaluate((v) => {
          const btns = [...document.querySelectorAll("button")];
          const t = btns.find((b) => b.textContent.trim().toUpperCase().startsWith(v.toUpperCase().slice(0, 4)));
          t && t.click();
        }, view === "home" ? "HOME" : view);
      } else {
        await page.evaluate((v) => {
          const btns = [...document.querySelectorAll("[data-nav-btn]")];
          const map = { home: "HOME", content: "CONTENT", analytics: "ANALYTICS", tasks: "TASKS", deals: "DEALS", growth: "GROWTH", settings: "SETTINGS" };
          const t = btns.find((b) => b.textContent.trim().toUpperCase().includes(map[v]));
          t && t.click();
        }, view);
      }
      await sleep(900);
      // horizontal overflow check
      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        return { scrollW: de.scrollWidth, clientW: de.clientWidth, over: de.scrollWidth - de.clientWidth };
      });
      if (overflow.over > 2) findings.push(`[${label}] OVERFLOW on '${view}': content ${overflow.over}px wider than viewport (scrollW ${overflow.scrollW} > ${overflow.clientW})`);
      const rootLen = await page.$eval("#root", (el) => el.innerHTML.length).catch(() => 0);
      if (rootLen < 200) findings.push(`[${label}] EMPTY on '${view}': #root length ${rootLen}`);
      await page.screenshot({ path: `${OUT}/${label}-${view}.png` }).catch(() => {});
    } catch (e) {
      findings.push(`[${label}] ERROR navigating '${view}': ${e.message}`);
    }
  }
  await ctx.close();
  return findings;
}

(async () => {
  let up = false;
  for (let i = 0; i < 30; i++) { try { const r = await fetch(URL); if (r.ok) { up = true; break; } } catch {} await sleep(500); }
  if (!up) { console.error("✗ qa: preview never came up"); process.exit(1); }
  let browser; try { browser = await chromium.launch({ executablePath: EXEC }); } catch { browser = await chromium.launch(); }
  const all = [
    ...(await run(browser, "mobile", { width: 390, height: 844 }, true)),
    ...(await run(browser, "desktop", { width: 1440, height: 900 }, false)),
  ];
  await browser.close();
  console.log(`\nScreenshots: ${OUT}`);
  if (all.length) { console.log("\n⚠ QA findings:\n" + all.map((f) => "  • " + f).join("\n")); }
  else { console.log("\n✓ QA: no errors, overflow, or empty views across mobile + desktop."); }
})();
