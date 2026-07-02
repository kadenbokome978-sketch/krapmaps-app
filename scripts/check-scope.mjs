#!/usr/bin/env node
// Static guard: catches component-scope variables that are USED but never DEFINED.
// This is the exact class of bug that caused the blank-screen-on-mobile crash
// (isMobile referenced in OnboardingPage/VideoReaderView/StatMini without being declared).
// Runs as `prebuild`, so `npm run build` (and Vercel) fail fast instead of shipping a crash.
//
// Zero dependencies — pure string/regex scan. Conservative on purpose: only flags a
// curated set of "must-be-local" identifiers whose definition pattern we know.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "src", "App.jsx");
const src = readFileSync(file, "utf8").split("\n");

// Identifiers that must be declared inside any component that references them.
const GUARDED = ["isMobile"];

// Find top-level component/function boundaries (declarations starting at column 0).
const comps = [];
for (let i = 0; i < src.length; i++) {
  const m = src[i].match(/^(?:function|const|class|export default function)\s+([A-Z][A-Za-z0-9_]*)/);
  if (m) comps.push({ name: m[1], line: i });
}
comps.push({ name: "__END__", line: src.length });

const problems = [];
for (let c = 0; c < comps.length - 1; c++) {
  const start = comps[c].line;
  const end = comps[c + 1].line;
  const body = src.slice(start, end).join("\n");
  for (const id of GUARDED) {
    // usage: the identifier as a standalone word, not preceded by `.` or another word char
    const uses = new RegExp(`[^.\\w]${id}\\b`).test(body);
    if (!uses) continue;
    // definition: `id =`, `id]` (array destructure from useState), or `[id]`
    const defines =
      new RegExp(`\\b${id}\\s*=`).test(body) ||
      new RegExp(`\\[\\s*${id}\\s*[,\\]]`).test(body);
    if (!defines) {
      problems.push(`  • '${id}' is used but never defined in component '${comps[c].name}' (src/App.jsx:${start + 1})`);
    }
  }
}

if (problems.length) {
  console.error("\n✗ scope-check FAILED — undefined component-scoped variables:\n");
  console.error(problems.join("\n"));
  console.error("\nFix: declare the variable inside the component, e.g.");
  console.error("  const isMobile = typeof window !== 'undefined' && (window.__isMobile || window.innerWidth < 900);\n");
  process.exit(1);
}

console.log("✓ scope-check passed — all guarded variables are defined where used.");

// Also syntax-check every serverless function — a broken api/*.js would deploy
// as a 500ing endpoint without this.
import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
const apiDir = join(root, "api");
let apiOk = true;
for (const f of readdirSync(apiDir).filter((n) => n.endsWith(".js"))) {
  try { execFileSync(process.execPath, ["--check", join(apiDir, f)], { stdio: "pipe" }); }
  catch (e) { apiOk = false; console.error(`✗ syntax error in api/${f}:\n${e.stderr}`); }
}
if (!apiOk) process.exit(1);
console.log("✓ api functions syntax-checked.");
