#!/usr/bin/env node
// Browser smoke test: builds are pointless if the app won't mount.
// Boots `vite preview`, loads the app at BOTH mobile and desktop viewports,
// and fails if the root stays empty or any page/JS error fires (e.g. ReferenceError).
//
// Playwright is optional. If it can't be found, the test SKIPS (exit 0) rather than
// failing CI on environments without a browser. Network errors (blocked CDNs) are ignored.

import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  try { ({ chromium } = require("playwright-core")); } catch {}
}
if (!chromium) {
  console.log("• smoke: playwright not installed — skipping browser smoke test.");
  process.exit(0);
}

const PORT = 4173;
const URL = `http://localhost:${PORT}/`;
const EXEC = process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium";

const preview = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  stdio: "ignore",
});

const cleanup = () => { try { preview.kill(); } catch {} };
process.on("exit", cleanup);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A network failure (blocked CDN, missing font) is not an app crash — ignore those.
const isNetworkNoise = (t) =>
  /Failed to load resource|ERR_|net::|status of 404|status of 403/i.test(t);

async function checkViewport(browser, label, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`${label} PAGEERROR: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !isNetworkNoise(m.text())) errors.push(`${label} CONSOLE: ${m.text()}`);
  });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2000);
  const len = await page.$eval("#root", (el) => el.innerHTML.length).catch(() => 0);
  await ctx.close();
  if (len < 100) errors.push(`${label}: #root is empty (length ${len}) — app did not mount`);
  return errors;
}

(async () => {
  // wait for preview server to be reachable
  let up = false;
  for (let i = 0; i < 30; i++) {
    try { const r = await fetch(URL); if (r.ok) { up = true; break; } } catch {}
    await sleep(500);
  }
  if (!up) { console.error("✗ smoke: preview server never came up"); cleanup(); process.exit(1); }

  let browser;
  try {
    browser = await chromium.launch({ executablePath: EXEC });
  } catch {
    try { browser = await chromium.launch(); }
    catch (e) { console.log("• smoke: could not launch chromium — skipping.", e.message); cleanup(); process.exit(0); }
  }

  const errors = [
    ...(await checkViewport(browser, "mobile", { viewport: { width: 390, height: 844 }, isMobile: true })),
    ...(await checkViewport(browser, "desktop", { viewport: { width: 1440, height: 900 } })),
  ];
  await browser.close();
  cleanup();

  if (errors.length) {
    console.error("\n✗ smoke test FAILED:\n" + errors.map((e) => "  • " + e).join("\n") + "\n");
    process.exit(1);
  }
  console.log("✓ smoke test passed — app mounts cleanly on mobile + desktop.");
  process.exit(0);
})();
