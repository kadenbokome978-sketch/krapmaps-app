// Social preview image for shared results (/r/<handle>). 1200x630 PNG rendered
// from the published snapshot — this is what unfurls in DMs, X, iMessage, etc.
// Reached via /api/og?u=<handle>. Zero client cost (serverless only).
import React from "react";
import { ImageResponse } from "@vercel/og";

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SB_URL || "https://xiudsyiinkqtmowkiqxh.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SB_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWRzeWlpbmtxdG1vd2tpcXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTcwNTMsImV4cCI6MjA1ODMzMzA1M30.xh1I8a8TUrPZ3YtElqCHv9LjI27BnCDp_YY-J_FDBDU";

const hex = (v, fb) => (/^#[0-9A-Fa-f]{3,8}$/.test(String(v || "")) ? v : fb);
const h = React.createElement;

export const config = { runtime: "nodejs" };

export default async function handler(req) {
  const url = new URL(req.url, "http://x");
  const handle = String(url.searchParams.get("u") || "").replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 40);

  let d = null;
  try {
    if (handle) {
      const r = await fetch(`${SB_URL}/rest/v1/km_public_results?id=eq.${encodeURIComponent(handle)}&select=data&limit=1`, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
      if (r.ok) { const rows = await r.json(); d = rows && rows[0] && rows[0].data; }
    }
  } catch {}

  const accent = hex(d?.accent, "#FF2D78");
  const accent2 = hex(d?.accent2, "#C566FF");
  const app = d?.appName || "CreatorOS";
  const handleLabel = d?.handle || (handle ? "@" + handle : "@creator");
  const hero = d?.hero || null;
  const stats = d?.stats || {};

  const font = "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

  const image = h("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#07050F", fontFamily: font, position: "relative", padding: "64px 72px", justifyContent: "space-between" } },
    // ambient glows
    h("div", { style: { position: "absolute", top: -160, left: -120, width: 520, height: 520, borderRadius: 520, background: accent, opacity: 0.16, display: "flex" } }),
    h("div", { style: { position: "absolute", bottom: -180, right: -120, width: 480, height: 480, borderRadius: 480, background: accent2, opacity: 0.14, display: "flex" } }),
    // top: brand + handle
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 18 } },
        h("div", { style: { width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${accent}, ${accent2})`, fontSize: 34, fontWeight: 900, color: "#fff" } }, app.charAt(0)),
        h("div", { style: { fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" } }, app),
      ),
      h("div", { style: { fontSize: 24, color: "rgba(248,238,255,0.55)", fontWeight: 600 } }, handleLabel),
    ),
    // center: the proof
    hero
      ? h("div", { style: { display: "flex", flexDirection: "column", gap: 22 } },
          h("div", { style: { fontSize: 22, letterSpacing: "3px", textTransform: "uppercase", color: accent, fontWeight: 700 } }, "The AI called it before they filmed"),
          h("div", { style: { display: "flex", alignItems: "center", gap: 34 } },
            h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", background: `${accent2}1f`, border: `2px solid ${accent2}55`, borderRadius: 28, padding: "26px 40px" } },
              h("div", { style: { fontSize: 22, color: "rgba(248,238,255,0.5)", fontWeight: 700, letterSpacing: "2px" } }, "AI SCORE"),
              h("div", { style: { fontSize: 108, fontWeight: 900, color: accent2, lineHeight: 1 } }, String(hero.score || 0)),
            ),
            h("div", { style: { fontSize: 72, color: "rgba(248,238,255,0.4)", display: "flex" } }, "→"),
            h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(57,255,20,0.10)", border: "2px solid rgba(57,255,20,0.45)", borderRadius: 28, padding: "26px 40px" } },
              h("div", { style: { fontSize: 22, color: "rgba(248,238,255,0.5)", fontWeight: 700, letterSpacing: "2px" } }, "ACTUAL VIEWS"),
              h("div", { style: { fontSize: 108, fontWeight: 900, color: "#39FF14", lineHeight: 1 } }, String(hero.viewsLabel || "—")),
            ),
          ),
        )
      : h("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
          h("div", { style: { fontSize: 60, fontWeight: 900, color: "#fff", lineHeight: 1.05 } }, "Score your next video"),
          h("div", { style: { fontSize: 60, fontWeight: 900, color: accent, lineHeight: 1.05 } }, "before you film it."),
        ),
    // bottom: stats + CTA
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
      h("div", { style: { display: "flex", gap: 40 } },
        stats.viewsTracked ? h("div", { style: { display: "flex", flexDirection: "column" } }, h("div", { style: { fontSize: 40, fontWeight: 800, color: "#00E5FF" } }, String(stats.viewsTracked)), h("div", { style: { fontSize: 20, color: "rgba(248,238,255,0.45)", fontWeight: 600 } }, "views tracked")) : h("div", {}),
        (stats.accuracy != null) ? h("div", { style: { display: "flex", flexDirection: "column" } }, h("div", { style: { fontSize: 40, fontWeight: 800, color: "#FFD50A" } }, String(stats.accuracy) + "%"), h("div", { style: { fontSize: 20, color: "rgba(248,238,255,0.45)", fontWeight: 600 } }, "AI accuracy")) : h("div", {}),
      ),
      h("div", { style: { fontSize: 24, color: "rgba(248,238,255,0.6)", fontWeight: 700, display: "flex" } }, "Powered by CreatorOS"),
    ),
  );

  return new ImageResponse(image, {
    width: 1200, height: 630,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
  });
}
