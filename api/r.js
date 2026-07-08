// Public shareable results page. No login — renders a creator's published snapshot
// from Supabase (km_public_results, keyed by lowercased handle). Whitelabel-aware.
// Reached via /r/<handle> (rewritten to /api/r?u=<handle>).

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SB_URL || "https://xiudsyiinkqtmowkiqxh.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SB_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWRzeWlpbmtxdG1vd2tpcXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzU5OTcsImV4cCI6MjA4OTQ1MTk5N30.8aHpQIcEcrDXo9DJN52SWAOee-rrkp-ti00h72-_sZE";

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Only allow hex colours through to inline styles (defence-in-depth against CSS injection).
const hex = (v, fb) => (/^#[0-9A-Fa-f]{3,8}$/.test(String(v || "")) ? v : fb);
const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);

function page(d) {
  const accent = hex(d.accent, "#FF2D78");
  const accent2 = hex(d.accent2, "#C566FF");
  const app = esc(d.appName || "CreatorOS");
  const handle = esc(d.handle || "@creator");
  const initial = esc((d.creator1 || d.handle || "C").replace(/^@/, "").charAt(0).toUpperCase());
  const stats = d.stats || {};
  const hero = d.hero || null;
  const cal = d.calibration || null;
  const vids = Array.isArray(d.topVideos) ? d.topVideos.slice(0, 3) : [];
  const bandColor = (c) => hex(c, "#00E5FF");

  const heroBlock = hero ? `
  <section class="card hero">
    <span class="rail"></span>
    <div class="eyebrow">The AI called it before they filmed</div>
    <h1>Scored this idea <span style="color:${accent2}">${num(hero.score)}</span> — it did <span style="color:#39FF14">${esc(hero.viewsLabel || "")}</span>.</h1>
    <div class="proof">
      <div class="pill score"><div class="lab">AI score</div><div class="num">${num(hero.score)}</div></div>
      <span class="arrow"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg></span>
      <div class="pill real"><div class="lab">Actual views</div><div class="num">${esc(hero.viewsLabel || "")}</div></div>
    </div>
    ${hero.title ? `<div class="kick">&ldquo;${esc(hero.title)}&rdquo;${hero.mult ? ` &middot; <b>${esc(hero.mult)}</b>` : ""}</div>` : ""}
  </section>` : "";

  const statCellArr = [
    stats.viewsTracked ? `<div><div class="n c1">${esc(stats.viewsTracked)}</div><div class="l">Views tracked</div></div>` : "",
    stats.avgViews ? `<div><div class="n c2">${esc(stats.avgViews)}</div><div class="l">Avg / video</div></div>` : "",
    (stats.accuracy != null) ? `<div><div class="n c3">${num(stats.accuracy)}</div><div class="l">AI accuracy %</div></div>` : "",
  ].filter(Boolean);
  const statCount = statCellArr.length || 1;
  const statsBlock = statCellArr.length ? `<section class="card"><div class="stats">${statCellArr.join("")}</div></section>` : "";

  const calBlock = cal && Array.isArray(cal.bands) && cal.bands.length ? `
  <section class="card calib">
    <span class="rail"></span>
    <div class="sechead"><span class="tick"></span>Does the score predict reality?</div>
    ${cal.verdict ? `<div class="verdict"><span class="tag" style="color:${bandColor(cal.verdictColor)}">${esc(cal.verdict)}</span><span class="txt">${esc(cal.verdictText || "")}${cal.rho != null ? ` Rank correlation <b>${esc(cal.rho)}</b> across ${num(cal.n)} posted videos.` : ""}</span></div>` : ""}
    ${cal.bands.map((b) => `
    <div class="band">
      <div class="row"><span class="name">${esc(b.label)} <span class="cnt">&middot; ${num(b.count)} posted</span></span><span class="mult" style="color:${bandColor(b.color)}">${esc(b.mult)} <span class="avg">&middot; ${esc(b.avg)} avg</span></span></div>
      <div class="track"><div class="fill" style="width:${Math.max(3, Math.min(100, num(b.pct)))}%;background:linear-gradient(90deg,${bandColor(b.color)},${bandColor(b.color)}80)"></div></div>
    </div>`).join("")}
    ${cal.channelAvg ? `<div class="foot">Channel average: ${esc(cal.channelAvg)} views. When the bars step down with the scores, the AI is calibrated to this channel.</div>` : ""}
  </section>` : "";

  const vidsBlock = vids.length ? `
  <section class="card vids">
    <span class="rail"></span>
    <div class="sechead"><span class="tick" style="background:#00E5FF"></span>Top calls</div>
    ${vids.map((v) => {
      const c = bandColor(v.color);
      return `<div class="vrow">
        <div class="vscore" style="color:${c};background:${c}1a;border:1px solid ${c}4d">${num(v.score)}<small>SCORE</small></div>
        <div class="vmeta"><div class="vtitle">${esc(v.title)}</div>${v.sub ? `<div class="vsub">${esc(v.sub)}</div>` : ""}</div>
        <div class="vviews">${esc(v.views)}</div>
      </div>`;
    }).join("")}
  </section>` : "";

  const origin = d.origin || "";
  const shareTitle = `${handle} — proven with ${app}`;
  const shareDesc = hero ? `AI scored it ${num(hero.score)} before filming — it did ${esc(hero.viewsLabel)} views.` : `${app} — AI virality scores for TikTok & Reels.`;

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>${shareTitle}</title>
<meta name="theme-color" content="#07050F"/>
<meta property="og:title" content="${shareTitle}"/>
<meta property="og:description" content="${shareDesc}"/>
<meta property="og:type" content="website"/>
<meta property="og:image" content="${esc(origin)}api/og?u=${encodeURIComponent(d.hid||"")}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${shareTitle}"/>
<meta name="twitter:description" content="${shareDesc}"/>
<meta name="twitter:image" content="${esc(origin)}api/og?u=${encodeURIComponent(d.hid||"")}"/>
<style>
  :root{--ground:#07050F;--ink:#F8EEFF;--muted:rgba(248,238,255,.5);--faint:rgba(248,238,255,.32);
    --accent:${accent};--accent2:${accent2};--cyan:#00E5FF;--green:#39FF14;--yellow:#FFD50A;--orange:#FF6B1A;--pink:#FF2D78;
    --card:rgba(255,255,255,.025);--line:rgba(255,255,255,.08);
    --head:"Helvetica Neue",-apple-system,system-ui,"Segoe UI",Arial,sans-serif;--body:-apple-system,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--ground);color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;line-height:1.5;min-height:100vh}
  .bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
  .bg::after{content:"";position:absolute;inset:0;opacity:.03;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px 180px}
  .blob{position:absolute;border-radius:50%;filter:blur(60px)}
  .b1{top:-140px;left:-120px;width:420px;height:420px;background:radial-gradient(circle,${accent}38,transparent 70%)}
  .b2{bottom:-160px;right:-120px;width:380px;height:380px;background:radial-gradient(circle,${accent2}30,transparent 70%)}
  .wrap{position:relative;z-index:1;max-width:600px;margin:0 auto;padding:26px 20px 40px;display:flex;flex-direction:column;gap:18px}
  .topbar{display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:9px;font-family:var(--head);font-weight:900;letter-spacing:-.02em;font-size:19px}
  .mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${accent}59}
  .shared{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--faint);text-transform:uppercase}
  .who{display:flex;align-items:center;gap:14px;padding:2px}
  .av{width:52px;height:52px;border-radius:16px;flex:none;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:var(--head);font-weight:900;font-size:24px;color:#fff}
  .handle{font-family:var(--head);font-weight:800;font-size:22px;letter-spacing:-.01em}
  .subl{color:var(--muted);font-size:13px;margin-top:3px}
  .card{position:relative;background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden}
  .card .rail{position:absolute;top:0;left:0;right:0;height:2px}
  .hero{padding:26px 22px 24px;background:linear-gradient(160deg,${accent}1a,rgba(10,6,20,.6))}
  .hero .rail{background:linear-gradient(90deg,var(--accent),var(--accent2),transparent)}
  .eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}
  .hero h1{font-family:var(--head);font-weight:900;font-size:clamp(24px,6.4vw,34px);line-height:1.05;letter-spacing:-.02em;margin:12px 0 20px;text-wrap:balance}
  .proof{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .pill{flex:1;min-width:130px;border-radius:16px;padding:16px 18px;text-align:center;border:1px solid}
  .pill .lab{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:6px}
  .pill .num{font-family:var(--head);font-weight:900;font-size:40px;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
  .pill.score{background:${accent2}17;border-color:${accent2}4d}.pill.score .num{color:var(--accent2)}
  .pill.real{background:rgba(57,255,20,.08);border-color:rgba(57,255,20,.28)}.pill.real .num{color:var(--green)}
  .arrow{color:var(--faint);flex:none;display:flex}
  .kick{margin-top:16px;font-size:14px;text-align:center;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:12px;padding:11px}
  .kick b{color:var(--green)}
  .stats{display:grid;grid-template-columns:repeat(${statCount},1fr)}
  .stats>div{padding:18px 16px;text-align:center}
  .stats>div+div{border-left:1px solid var(--line)}
  .stats .n{font-family:var(--head);font-weight:800;font-size:26px;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
  .stats .c1{color:var(--cyan)}.stats .c2{color:var(--accent)}.stats .c3{color:var(--yellow)}
  .stats .l{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-top:6px}
  .calib{padding:22px}.calib .rail{background:linear-gradient(90deg,var(--yellow),var(--orange),transparent)}
  .sechead{display:flex;align-items:center;gap:9px;font-family:var(--head);font-weight:800;font-size:14px;letter-spacing:.02em;text-transform:uppercase;margin-bottom:16px}
  .sechead .tick{width:3px;height:15px;border-radius:2px;background:var(--yellow);flex:none}
  .verdict{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:12px;background:rgba(57,255,20,.06);border:1px solid rgba(57,255,20,.28);margin-bottom:18px}
  .verdict .tag{font-family:var(--head);font-weight:900;font-size:15px;letter-spacing:.05em;flex:none}
  .verdict .txt{font-size:12.5px;color:var(--muted);line-height:1.5}.verdict b{color:var(--ink)}
  .band{margin-bottom:13px}.band:last-child{margin-bottom:0}
  .band .row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-size:13px}
  .band .name{font-weight:700}.band .name .cnt{color:var(--faint);font-weight:500}
  .band .mult{font-family:var(--head);font-weight:800;font-variant-numeric:tabular-nums}
  .band .mult .avg{font-family:var(--body);font-weight:600;font-size:12px;color:var(--faint)}
  .track{height:10px;border-radius:5px;background:rgba(255,255,255,.05);overflow:hidden}
  .fill{height:100%;border-radius:5px;transform-origin:left;animation:grow 1.1s cubic-bezier(.2,.8,.2,1) both}
  .foot{margin-top:15px;font-size:11.5px;color:var(--faint);line-height:1.5}
  .vids{padding:20px 22px}.vids .rail{background:linear-gradient(90deg,var(--cyan),transparent)}
  .vrow{display:flex;align-items:center;gap:13px;padding:12px 0;border-bottom:1px solid var(--line)}.vrow:last-child{border-bottom:none}
  .vscore{width:44px;height:44px;border-radius:12px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--head);font-weight:900;font-size:18px;line-height:1}
  .vscore small{font-family:var(--mono);font-size:7px;letter-spacing:.1em;font-weight:700;opacity:.7;margin-top:2px}
  .vmeta{flex:1;min-width:0}.vtitle{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .vsub{font-family:var(--mono);font-size:11px;color:var(--faint);margin-top:3px}
  .vviews{font-family:var(--head);font-weight:800;font-size:16px;color:var(--cyan);flex:none;font-variant-numeric:tabular-nums}
  .cta{text-align:center;padding:28px 22px 24px;background:linear-gradient(160deg,${accent2}1a,rgba(10,6,20,.5))}
  .cta .rail{background:linear-gradient(90deg,transparent,var(--accent),var(--accent2),transparent)}
  .cta h2{font-family:var(--head);font-weight:900;font-size:23px;letter-spacing:-.01em;margin-bottom:8px;text-wrap:balance}
  .cta p{color:var(--muted);font-size:13.5px;max-width:340px;margin:0 auto 18px}
  .btn{display:inline-flex;align-items:center;gap:9px;font-family:var(--head);font-weight:800;font-size:15px;color:#fff;text-decoration:none;padding:14px 26px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 8px 28px ${accent}59;transition:transform .15s,box-shadow .15s}
  .btn:hover{transform:translateY(-2px)}.btn:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
  .powered{margin-top:16px;font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--faint)}.powered b{color:var(--muted);font-weight:700}
  @keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  @media (prefers-reduced-motion:reduce){.fill{animation:none}}
</style></head><body>
<div class="bg"><div class="blob b1"></div><div class="blob b2"></div></div>
<div class="wrap">
  <div class="topbar">
    <div class="brand"><span class="mark"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg></span>${app}</div>
    <span class="shared">Shared results</span>
  </div>
  <div class="who">
    <div class="av">${initial}</div>
    <div><div class="handle">${handle}</div><div class="subl">${esc(d.sub || "Verified results")}</div></div>
  </div>
  ${heroBlock}
  ${statsBlock}
  ${calBlock}
  ${vidsBlock}
  <section class="card cta">
    <span class="rail"></span>
    <h2>Score your next video before you film it.</h2>
    <p>Free AI virality scores, hook fixes and growth tracking for TikTok &amp; Reels.</p>
    <a class="btn" href="${esc(origin || "/")}">Try ${app} free
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg></a>
    <div class="powered">Powered by <b>CreatorOS</b></div>
  </section>
</div>
</body></html>`;
}

function notFound(res, msg) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(404).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found</title><body style="margin:0;background:#07050F;color:#F8EEFF;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px"><div><div style="font-size:42px;font-weight:900">404</div><p style="color:rgba(248,238,255,.5);margin-top:8px">${esc(msg || "These results aren't shared publicly.")}</p></div></body>`);
}

export default async function handler(req, res) {
  const raw = (req.query && req.query.u) || "";
  const handle = String(Array.isArray(raw) ? raw[0] : raw).replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 40);
  if (!handle) return notFound(res, "No creator specified.");

  try {
    const r = await fetch(`${SB_URL}/rest/v1/km_public_results?id=eq.${encodeURIComponent(handle)}&select=data&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY },
    });
    if (!r.ok) return notFound(res, "Couldn't load these results right now.");
    const rows = await r.json();
    const data = rows && rows[0] && rows[0].data;
    if (!data) return notFound(res, "These results aren't shared publicly.");

    const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
    const host = req.headers["x-forwarded-host"] || req.headers.host || "";
    data.origin = host ? `${proto}://${host}/` : "/";
    data.hid = handle; // sanitized id for the og:image URL

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=120, s-maxage=300");
    return res.status(200).send(page(data));
  } catch (e) {
    return notFound(res, "Couldn't load these results right now.");
  }
}
