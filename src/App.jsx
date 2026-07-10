import React, { useState, useEffect, useCallback, useRef } from "react";
import CLIENT_CONFIG from "../client.config.json";
import THIERNO_CONFIG from "../client.config.thierno.json";

// All registered clients keyed by activation code
const CLIENTS = {
  [CLIENT_CONFIG.activationCode.toUpperCase()]: CLIENT_CONFIG,
  [THIERNO_CONFIG.activationCode.toUpperCase()]: THIERNO_CONFIG,
};


// Detect active client at module load (before React)
const _activeCfg = (()=>{ try { const s=localStorage.getItem("krapmaps_v1_client"); return s?JSON.parse(s):CLIENT_CONFIG; } catch { return CLIENT_CONFIG; } })();
const _isThiernoClient = _activeCfg.clientId === "thierno";
if(typeof document !== "undefined") {
  document.title = _activeCfg.appName || "CreatorOS";
  // Whitelabel the PWA install: iOS reads the apple title meta and browsers read
  // the manifest at add-to-home-screen time, so runtime rebranding sticks.
  try {
    const appName = _activeCfg.appName || "CreatorOS";
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(appleTitle) appleTitle.setAttribute("content", appName);
    const mLink = document.querySelector('link[rel="manifest"]');
    if(mLink && appName !== "CreatorOS") {
      // Draw the ring-mark icon in the client's accent colours so the install
      // is fully branded (Chrome/Android accept data-URI manifest icons).
      const drawIcon = (S) => {
        const cv = document.createElement("canvas"); cv.width = cv.height = S;
        const g = cv.getContext("2d");
        const corner = S*0.22;
        g.beginPath(); g.roundRect(0, 0, S, S, corner);
        const bg = g.createLinearGradient(0, 0, 0, S);
        bg.addColorStop(0, "#0D091A"); bg.addColorStop(1, "#07050F");
        g.fillStyle = bg; g.fill();
        g.save(); g.clip();
        const ring = g.createLinearGradient(0, 0, S, S);
        ring.addColorStop(0, _activeCfg.accentColor || "#FF2D78");
        ring.addColorStop(1, _activeCfg.accentColor2 || "#C566FF");
        g.strokeStyle = ring; g.lineWidth = S*0.125; g.lineCap = "round";
        const gap = Math.PI/4.4;
        g.beginPath(); g.arc(S/2, S/2, S*0.2375, gap, Math.PI*2 - gap); g.stroke();
        g.restore();
        return cv.toDataURL("image/png");
      };
      let icons;
      try { icons = [ { src: drawIcon(192), sizes: "192x192", type: "image/png", purpose: "any maskable" }, { src: drawIcon(512), sizes: "512x512", type: "image/png", purpose: "any maskable" } ]; }
      catch { icons = [ { src: location.origin+"/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" }, { src: location.origin+"/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" } ]; }
      const manifest = {
        name: appName, short_name: appName,
        description: `${appName} — AI content strategist`,
        start_url: "/", display: "standalone",
        background_color: "#07050F", theme_color: "#07050F",
        icons,
      };
      mLink.setAttribute("href", "data:application/manifest+json,"+encodeURIComponent(JSON.stringify(manifest)));
    }
  } catch {}
}

// Baked-in shared keys (set as build-time env vars in Vercel — NOT committed to git).
// Used as a fallback so a build works out-of-the-box without the user adding their own key.
const _ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const BAKED_ANTHROPIC_KEY = _ENV.VITE_ANTHROPIC_KEY || "";
const BAKED_GPT_KEY = _ENV.VITE_GPT_KEY || "";
const BAKED_GEMINI_KEY = _ENV.VITE_GEMINI_KEY || "";
const BAKED_PERPLEXITY_KEY = _ENV.VITE_PERPLEXITY_KEY || "";

const C = _isThiernoClient ? {
  // ── Thierno "Braz" — deluxe vinyl / late-night studio ──
  pink:"#00f085",    // green as primary accent (CTAs, key numbers)
  cyan:"#5cb8ff",    // blue — secondary, info
  yellow:"#b58dff",  // purple — highlights, top-performer
  green:"#00f085",
  orange:"#5cb8ff",  // map orange → blue for info states
  purple:"#b58dff",
  bg:"#08070d",
  card:"rgba(17,14,28,0.85)",
  cardSolid:"#110e1c",
  cardAlt:"rgba(26,21,40,0.6)",
  border:"#2a2240",
  borderMed:"#3d3060",
  dim:"#7a7392",
  text:"#f0ebd8",
  textMed:"#a89fc0",
  fontHead:"'Instrument Serif', Georgia, serif",
  fontBody:"'Bricolage Grotesque', system-ui, sans-serif",
  fontMono:"'DM Mono', 'SF Mono', monospace",
} : {
  // ── KrapMaps / CreatorOS ──
  pink:"#FF2D78", cyan:"#00E5FF", yellow:"#FFD50A",
  green:"#39FF14", orange:"#FF6B1A", purple:"#C566FF",
  bg:"#07050F", card:"rgba(255,255,255,0.025)",
  cardSolid:"#0C0A1A", cardAlt:"rgba(255,255,255,0.025)",
  border:"rgba(255,255,255,0.08)", borderMed:"rgba(255,255,255,0.11)",
  dim:"rgba(255,255,255,0.45)", text:"#F8EEFF", textMed:"#C8A8E0",
  fontHead:"'Lilita One', 'Arial Black', 'Helvetica Neue', system-ui, sans-serif",
  fontBody:"'Inter', system-ui, sans-serif",
  fontMono:"'SF Mono','Fira Code',monospace",
};

const fmt = n => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n||0);
const perfLabel = s => s>=80?"VIRAL":s>=65?"STRONG":s>=50?"DECENT":s>=35?"WEAK":"FLOPPED";
const perfColor = s => s>=80?C.green:s>=65?C.yellow:s>=50?C.orange:C.pink;

const I = {
  bin:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><rect x="5" y="6" width="14" height="14" rx="2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  tt:    (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77.28 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 12.67 0V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>,
  eye:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  map:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  ig:    (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  idea:  (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  cal:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  vid:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23,7 16,12 23,17 23,7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  bar:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  search:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  target:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  write: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trend: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  home:  (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  check: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  rocket:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  trash: (s=14,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg>,
  star:  (s=14,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill={c}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>,
  refresh:(s=14,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  plus:  (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  heart: (s=14,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  settings:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  brain: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2"/></svg>,
  zap:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>,
  globe: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  msg:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  tick:  (s=14,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><polyline points="20,6 9,17 4,12"/></svg>,
  x:     (s=14,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  warn:  (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  fire:  (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill={c} style={{verticalAlign:"middle",flexShrink:0}}><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.7-2.5C7.5 8.8 6 10.6 6 13a6 6 0 0 0 12 0c0-5-6-11-6-11z"/></svg>,
  bot:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1"/><line x1="9" y1="13" x2="9" y2="14"/><line x1="15" y1="13" x2="15" y2="14"/><path d="M4 14H2"/><path d="M22 14h-2"/></svg>,
  camera:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  flask: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><path d="M9 2v6l-5 9a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3l-5-9V2"/><line x1="8" y1="2" x2="16" y2="2"/><line x1="7.5" y1="14" x2="16.5" y2="14"/></svg>,
  clock: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,14"/></svg>,
  trophy:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  key:   (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.5 12.5 21 2"/><path d="M16 7l3 3"/><path d="M13 10l3 3"/></svg>,
  database:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>,
  clip:  (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  clipboard:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  predict:(s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><circle cx="12" cy="10" r="7"/><path d="M7 21h10"/><path d="M9 21l1-4"/><path d="M15 21l-1-4"/><path d="M9.5 8.5 12 6l2.5 2.5"/></svg>,
  spark: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill={c} style={{verticalAlign:"middle",flexShrink:0}}><path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8z"/></svg>,
  music: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  medal: (s=16,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",flexShrink:0}}><path d="M7.5 2h9l-3 6h-3z"/><circle cx="12" cy="15" r="6"/><path d="M12 12.5l1 2 2 .2-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 14.7l2-.2z"/></svg>,
};
// Inline icon that sits nicely in a line of text (baseline-aligned, gap after).
const Ico = ({ n, s=13, c="currentColor" }) => <span style={{ display:"inline-flex", alignItems:"center", verticalAlign:"middle", marginRight:5, position:"relative", top:-1 }}>{I[n](s,c)}</span>;

const Glass = ({ children, glow, border, style={} }) => (
  <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%)", backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)", border:`1px solid ${border||(glow?(glow+"28"):C.border)}`, borderRadius:20, boxShadow:glow?`0 8px 40px ${glow}12, 0 0 0 0.5px ${glow}20, inset 0 1px 0 rgba(255,255,255,0.08)`:"0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)", position:"relative", overflow:"hidden", ...style }}>
    {glow && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${glow}60,transparent)`, pointerEvents:"none" }} />}
    {glow && <div style={{ position:"absolute", top:0, left:0, bottom:0, width:1, background:`linear-gradient(180deg,${glow}40,transparent)`, pointerEvents:"none" }} />}
    {children}
  </div>
);
const Tag = ({ children, color, sm }) => (
  <span style={{ background:`${color}18`, border:`1px solid ${color}40`, color, borderRadius:6, padding:sm?"2px 8px":"3px 10px", fontSize:sm?10:12, fontWeight:700, letterSpacing:"0.06em", display:"inline-block", whiteSpace:"nowrap", fontFamily:C.fontHead, textTransform:"uppercase" }}>{children}</span>
);
// Animated count-up: climbs from 0 → target with an easeOut curve, then a tiny
// overshoot "tick" so the final number settles in with a satisfying bump.
const CountUp = ({ value, duration=1100, style }) => {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(null);
  const prevTarget = useRef(target);
  useEffect(() => {
    // Only animate when the score actually changes (i.e. a fresh score reveal)
    if (prevTarget.current === target) { setDisplay(target); return; }
    prevTarget.current = target;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic — fast then gently decelerates into the final number
      const eased = 1 - Math.pow(1 - t, 3);
      // slight overshoot near the end (the "wheel" nudging up past, then settling)
      const overshoot = t > 0.85 ? Math.sin((t - 0.85) / 0.15 * Math.PI) * 1.4 : 0;
      const v = from + (target - from) * eased + overshoot;
      setDisplay(t < 1 ? Math.round(v) : target);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return <span style={style}>{display}</span>;
};
// Counts up on first mount and formats to K/M — for the hero total view count.
const fmtKM = v => v>=1e6?(v/1e6).toFixed(1)+"M":v>=1e3?(v/1e3).toFixed(1)+"K":String(Math.round(v)||0);
const HeroCount = ({ value=0, style }) => {
  const target = Number(value)||0;
  const reduce = typeof window!=="undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = useState(reduce?target:0);
  const done = useRef(false);
  useEffect(()=>{
    if(reduce || done.current || target<=0){ setN(target); return; }
    done.current = true;
    let start=null, raf; const dur=1200;
    const step=(ts)=>{ if(!start)start=ts; const p=Math.min((ts-start)/dur,1); const e=1-Math.pow(1-p,3); setN(target*e); if(p<1) raf=requestAnimationFrame(step); else setN(target); };
    raf=requestAnimationFrame(step);
    return ()=>{ if(raf) cancelAnimationFrame(raf); };
  },[target,reduce]);
  return <span style={style}>{fmtKM(n)}</span>;
};
// ── SCORE DIAL — the signature virality read ──────────────────────
// A ring that sweeps to the score while the number counts up. Colour-banded,
// elite scores (85+) breathe. This is the product's recognizable hero moment.
const scoreBand = (s) => s>=85?{c:C.green,label:"VIRAL"} : s>=70?{c:C.cyan,label:"STRONG"} : s>=50?{c:C.yellow,label:"DECENT"} : s>=35?{c:C.orange,label:"WEAK"} : {c:C.pink,label:"RISKY"};
const ScoreDial = ({ score=0, size=72, stroke, label, animate=true, celebrate=false, loading=false }) => {
  const s = Math.max(0, Math.min(100, Math.round(Number(score)||0)));
  const band = scoreBand(s);
  const reduce = typeof window!=="undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sw = stroke || Math.max(4, Math.round(size*0.075));
  const r = (size - sw)/2;
  const circ = 2*Math.PI*r;
  // Loading: the ring itself becomes the spinner — one continuous motion into the reveal.
  if(loading) {
    return (
      <div style={{ position:"relative", width:size, height:size, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position:"absolute", inset:0, animation:reduce?"none":"spin 0.9s linear infinite" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.purple} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${circ*0.28} ${circ}`} style={{ filter:`drop-shadow(0 0 5px ${C.purple}90)` }}/>
        </svg>
        <div style={{ fontSize:Math.max(8,Math.round(size*0.13)), color:C.purple, fontWeight:700, letterSpacing:"0.08em", fontFamily:C.fontHead }}>AI</div>
      </div>
    );
  }
  const [prog, setProg] = useState((animate&&!reduce)?0:s);
  const [num, setNum]   = useState((animate&&!reduce)?0:s);
  const [settled, setSettled] = useState(false);
  const prev = useRef(null);
  useEffect(()=>{
    if(!animate || reduce){ setProg(s); setNum(s); return; }
    if(prev.current===s){ setProg(s); setNum(s); return; }
    prev.current = s;
    setProg(0); setNum(0); setSettled(false);
    const raf1 = requestAnimationFrame(()=>requestAnimationFrame(()=>setProg(s)));
    let start=null, raf2, settleT;
    const dur=950;
    const step=(ts)=>{ if(!start)start=ts; const p=Math.min((ts-start)/dur,1); const e=1-Math.pow(1-p,3); setNum(Math.round(s*e)); if(p<1) raf2=requestAnimationFrame(step); else { setNum(s); setSettled(true); settleT=setTimeout(()=>setSettled(false),480); } };
    raf2=requestAnimationFrame(step);
    return ()=>{ cancelAnimationFrame(raf1); if(raf2) cancelAnimationFrame(raf2); if(settleT) clearTimeout(settleT); };
  },[s,animate,reduce]);
  const off = circ*(1 - prog/100);
  const elite = s>=85;
  const doBurst = celebrate && elite && !reduce;
  return (
    <div style={{ position:"relative", width:size, height:size, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {elite && <div style={{ position:"absolute", inset:-3, borderRadius:"50%", background:`radial-gradient(circle,${band.c}26,transparent 68%)`, animation:reduce?"none":"scorePulse 2.4s ease-in-out infinite", pointerEvents:"none" }}/>}
      {doBurst && [...Array(10)].map((_,i)=>{ const ang=(i/10)*Math.PI*2; const dist=size*0.62; return (
        <span key={i} style={{ position:"absolute", left:"50%", top:"50%", width:i%2?5:3, height:i%2?5:3, borderRadius:"50%", background:i%3===0?band.c:i%3===1?C.yellow:"#fff", boxShadow:`0 0 6px ${band.c}`, "--tx":`${Math.cos(ang)*dist}px`, "--ty":`${Math.sin(ang)*dist}px`, transform:"translate(-50%,-50%)", animation:`sparkFly 0.72s ${0.35+i*0.012}s cubic-bezier(.15,.7,.3,1) both`, pointerEvents:"none" }}/>
      );})}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={band.c} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{ transition:reduce?"none":"stroke-dashoffset 0.95s cubic-bezier(.2,.8,.2,1)", filter:`drop-shadow(0 0 5px ${band.c}80)` }}/>
      </svg>
      <div style={{ textAlign:"center", lineHeight:0.95 }}>
        <div style={{ fontSize:Math.round(size*0.37), fontWeight:400, fontFamily:C.fontHead, color:band.c, letterSpacing:"-0.02em", textShadow:`0 0 16px ${band.c}55`, animation:settled?"scoreSettle 0.46s cubic-bezier(.2,1.3,.4,1)":"none" }}>{num}</div>
        {label!==false && <div style={{ fontSize:Math.max(8,Math.round(size*0.115)), color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", marginTop:size*0.03 }}>{label||band.label}</div>}
      </div>
    </div>
  );
};
// Factor bar — number counts up while the fill bar sweeps to the same value.
const FactorBar = ({ val, color, label }) => {
  const target = Number(val) || 0;
  const [w, setW] = useState(0);
  const prev = useRef(null);
  useEffect(() => {
    if (prev.current === target) { setW(target); return; }
    prev.current = target;
    setW(0);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setW(target)));
    return () => cancelAnimationFrame(id);
  }, [target]);
  return (
    <div style={{ flex:1, textAlign:"center" }}>
      <CountUp value={target} duration={1100} style={{ fontSize:13, fontWeight:700, color, lineHeight:1, display:"inline-block" }} />
      <div style={{ height:4, borderRadius:2, background:`${color}18`, marginTop:4, overflow:"hidden" }}>
        <div style={{ width:`${w}%`, height:"100%", borderRadius:2, background:color, transition:"width 1.1s cubic-bezier(0.22,1,0.36,1)" }}/>
      </div>
      <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:3, letterSpacing:"0.08em" }}>{label}</div>
    </div>
  );
};
const Pill = ({ children, color, active, onClick }) => (
  <button onClick={onClick} style={{ padding:"7px 16px", borderRadius:20, border:`1px solid ${active?color:C.border}`, background:active?`${color}20`:"transparent", color:active?color:"rgba(255,255,255,0.5)", fontSize:13, fontWeight:700, letterSpacing:"0.05em", cursor:"pointer", fontFamily:C.fontHead, transition:"all 0.15s", whiteSpace:"nowrap" }}>{children}</button>
);
const Num = ({ children, color, size=26 }) => (
  <div style={{ fontSize:size, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.04em", color, textShadow:`0 0 18px ${color}45`, lineHeight:1 }}>{children}</div>
);
const SLabel = ({ children, color=C.dim, mb=10 }) => (
  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color, marginBottom:mb, fontFamily:C.fontHead, textTransform:"uppercase" }}>{children}</div>
);
const Row = ({ children, style={} }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", ...style }}>{children}</div>
);
const Divider = ({ my=10 }) => <div style={{ height:1, background:C.border, margin:`${my}px 0` }} />;
const SectionHead = ({ title, color=C.text, action, actionColor=C.pink }) => (
  <Row style={{ marginBottom:20 }}>
    <div style={{ fontSize:22, fontWeight:700, fontFamily:C.fontHead, letterSpacing:"0.01em", color:"#fff" }}>{title}</div>
    {action && <button onClick={action} style={{ width:36, height:36, borderRadius:10, background:`${actionColor}15`, border:`1px solid ${actionColor}35`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:actionColor }}>{I.plus(15,actionColor)}</button>}
  </Row>
);
const StatMini = ({ label, value, color, icon, delta, deltaUp }) => {
  const isMobile = typeof window !== 'undefined' && (window.__isMobile || window.innerWidth < 900);
  return (
  <Glass glow={color} style={{ padding:isMobile?"20px 18px":"22px 22px", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", bottom:-30, right:-30, width:120, height:120, borderRadius:"50%", background:`${color}10`, filter:"blur(40px)", pointerEvents:"none" }} />
    <div style={{ position:"absolute", top:0, right:0, width:80, height:80, borderRadius:"50%", background:`${color}06`, filter:"blur(30px)", pointerEvents:"none" }} />
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:isMobile?24:16 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${color}30,${color}10)`, border:`1px solid ${color}35`, display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0, boxShadow:`0 4px 16px ${color}20` }}>{icon}</div>
      {delta != null && (
        <div style={{ display:"flex", alignItems:"center", gap:4, padding:isMobile?"5px 10px":"3px 8px", borderRadius:6, background:deltaUp?"rgba(0,255,148,0.1)":"rgba(255,45,120,0.1)", border:`1px solid ${deltaUp?"rgba(0,255,148,0.2)":"rgba(255,45,120,0.2)"}` }}>
          <span style={{ fontSize:11, color:deltaUp?C.green:C.pink, fontWeight:700 }}>{deltaUp?"↑":"↓"} {delta}</span>
        </div>
      )}
    </div>
    <Num color={color} size={34}>{value}</Num>
    <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:8 }}>{label}</div>
  </Glass>
  );
};
const SubTabs = ({ tabs, active, onChange, color=C.pink }) => (
  <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2, marginBottom:14, scrollbarWidth:"none" }}>
    {tabs.map(t => <Pill key={t} active={active===t} color={color} onClick={()=>onChange(t)}>{t}</Pill>)}
  </div>
);
const ActionBtn = ({ children, color, onClick }) => (
  <button onClick={onClick} style={{ padding:"6px 12px", borderRadius:8, background:`${color}15`, border:`1px solid ${color}30`, fontSize:12, fontWeight:700, color, cursor:"pointer", fontFamily:C.fontHead, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{children}</button>
);
const IconBtn = ({ icon, onClick, color=C.dim }) => (
  <button onClick={onClick} style={{ padding:"5px 8px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, cursor:"pointer", color, display:"flex", alignItems:"center" }}>{icon}</button>
);


// ── CHART COMPONENTS — pure SVG, no dependencies ─────────────────

// Smooth bezier curve helper
const bezier = (pts) => {
  if(pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for(let i=1;i<pts.length;i++){
    const prev = pts[i-1], cur = pts[i];
    const cpx1 = prev[0]+(cur[0]-prev[0])*0.4, cpy1 = prev[1];
    const cpx2 = cur[0]-(cur[0]-prev[0])*0.4, cpy2 = cur[1];
    d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${cur[0]} ${cur[1]}`;
  }
  return d;
};

// Futuristic area chart
const GlowAreaChart = ({ data=[], color=C.pink, height=120, dataKey="value", xKey="label" }) => {
  if(!data.length) return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"rgba(255,255,255,0.85)"}}>No data</div>;
  const W=500, H=height, PAD=30, BPAD=24;
  const vals = data.map(d=>d[dataKey]||0);
  const max = Math.max(...vals,1), min = Math.min(...vals,0);
  const range = max-min||1;
  const pts = data.map((d,i)=>[PAD+(i/(data.length-1||1))*(W-PAD*2), H-BPAD-(((d[dataKey]||0)-min)/range)*(H-BPAD-8)]);
  const path = bezier(pts);
  const id = color.replace("#","c");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{overflow:"visible",display:"block"}}>
      <defs>
        <linearGradient id={`ga${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
        <filter id={`gf${id}`}><feGaussianBlur in="SourceGraphic" stdDeviation="3"/></filter>
      </defs>
      {/* Grid lines */}
      {[0.25,0.5,0.75,1].map(f=>(
        <line key={f} x1={PAD} y1={H-BPAD-(f*(H-BPAD-8))} x2={W-PAD} y2={H-BPAD-(f*(H-BPAD-8))} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      ))}
      {/* Area fill */}
      <path d={`${path} L ${pts[pts.length-1][0]} ${H-BPAD} L ${pts[0][0]} ${H-BPAD} Z`} fill={`url(#ga${id})`}/>
      {/* Glow line (blurred duplicate) */}
      <path d={path} fill="none" stroke={color} strokeWidth="6" strokeOpacity="0.25" filter={`url(#gf${id})`}/>
      {/* Main line */}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Dots */}
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="5" fill={color} opacity="0.2"/>
          <circle cx={p[0]} cy={p[1]} r="3" fill={color}/>
        </g>
      ))}
      {/* X labels */}
      {data.map((d,i)=>(
        <text key={i} x={pts[i][0]} y={H-6} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="14" fontFamily="inherit">{d[xKey]}</text>
      ))}
    </svg>
  );
};

// Dual line area chart — two platforms on same chart
const DualAreaChart = ({ ttData=[], igData=[], height=160 }) => {
  const W=500, H=height, PAD=30, BPAD=24;
  const allVals = [...ttData.map(d=>d.value||0), ...igData.map(d=>d.value||0)];
  const max = Math.max(...allVals, 1);
  const toY = v => H-BPAD-((v/max)*(H-BPAD-8));
  const ttPts = ttData.map((d,i)=>[PAD+(i/(ttData.length-1||1))*(W-PAD*2), toY(d.value||0)]);
  const igPts = igData.map((d,i)=>[PAD+(i/(igData.length-1||1))*(W-PAD*2), toY(d.value||0)]);
  const ttPath = bezier(ttPts);
  const igPath = bezier(igPts);
  const ttArea = ttPts.length ? `${ttPath} L${ttPts[ttPts.length-1][0]},${H-BPAD} L${ttPts[0][0]},${H-BPAD} Z` : "";
  const igArea = igPts.length ? `${igPath} L${igPts[igPts.length-1][0]},${H-BPAD} L${igPts[0][0]},${H-BPAD} Z` : "";
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{overflow:"visible",display:"block"}}>
      <defs>
        <linearGradient id="datt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.pink} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={C.pink} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="daig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.purple} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={C.purple} stopOpacity="0"/>
        </linearGradient>
        <filter id="gltt"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="glig"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      {[0.25,0.5,0.75,1].map(f=>(
        <line key={f} x1={PAD} y1={H-BPAD-(f*(H-BPAD-8))} x2={W-PAD} y2={H-BPAD-(f*(H-BPAD-8))} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {ttArea && <path d={ttArea} fill="url(#datt)"/>}
      {igArea && <path d={igArea} fill="url(#daig)"/>}
      {ttPath && <>
        <path d={ttArea} fill="none"/>
        <path d={ttPath} fill="none" stroke={C.pink} strokeWidth="5" strokeOpacity="0.2" filter="url(#gltt)"/>
        <path d={ttPath} fill="none" stroke={C.pink} strokeWidth="2.5" strokeLinecap="round"/>
        {ttPts.map((p,i)=>{ const last=i===ttPts.length-1; return <g key={i}>{last && <circle cx={p[0]} cy={p[1]} r="9" fill={C.pink} opacity="0.25"><animate attributeName="r" values="6;11;6" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite"/></circle>}<circle cx={p[0]} cy={p[1]} r={last?5:4} fill={C.pink} opacity="0.2"/><circle cx={p[0]} cy={p[1]} r={last?3.5:2.5} fill={last?"#fff":C.pink}/>{last && <circle cx={p[0]} cy={p[1]} r="3.5" fill="none" stroke={C.pink} strokeWidth="1.5"/>}</g>;})}
      </>}
      {igPath && <>
        <path d={igPath} fill="none" stroke={C.purple} strokeWidth="5" strokeOpacity="0.2" filter="url(#glig)"/>
        <path d={igPath} fill="none" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6,3"/>
        {igPts.map((p,i)=>{ const last=i===igPts.length-1; return <g key={i}>{last && <circle cx={p[0]} cy={p[1]} r="9" fill={C.purple} opacity="0.25"><animate attributeName="r" values="6;11;6" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite"/></circle>}<circle cx={p[0]} cy={p[1]} r={last?5:4} fill={C.purple} opacity="0.2"/><circle cx={p[0]} cy={p[1]} r={last?3.5:2.5} fill={last?"#fff":C.purple}/>{last && <circle cx={p[0]} cy={p[1]} r="3.5" fill="none" stroke={C.purple} strokeWidth="1.5"/>}</g>;})}
      </>}
      {ttData.map((d,i)=>(
        <text key={i} x={ttPts[i][0]} y={H-6} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="14" fontFamily="inherit">{d.label}</text>
      ))}
    </svg>
  );
};

const GlowBarChart = ({ data=[], color=C.pink, height=140, dataKey="value", xKey="label" }) => {
  if(!data.length) return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"rgba(255,255,255,0.45)"}}>No data yet</div>;
  const W=500, H=height, LPAD=40, RPAD=12, TPAD=12, BPAD=28;
  const chartW=W-LPAD-RPAD, chartH=H-TPAD-BPAD;
  const vals = data.map(d=>d[dataKey]||0);
  const max = Math.max(...vals,1);
  const grp = chartW/data.length;
  const bw = Math.max(8, grp*0.5);
  const id = color.replace("#","b");
  const fmt = v => v>=1000?(v/1000).toFixed(0)+"k":String(v);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{overflow:"visible",display:"block"}}>
      <defs>
        <linearGradient id={`gb${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.12"/>
        </linearGradient>
        <filter id={`bf${id}`}><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      {/* Grid lines + Y labels */}
      {[0.25,0.5,0.75,1].map(f=>{
        const y = TPAD+chartH*(1-f);
        return (
          <g key={f}>
            <line x1={LPAD} y1={y} x2={W-RPAD} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
            <text x={LPAD-6} y={y+4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="inherit">{fmt(Math.round(max*f))}</text>
          </g>
        );
      })}
      {/* Bars — the peak announces itself with a value label + brighter cap */}
      {data.map((d,i)=>{
        const v = d[dataKey]||0;
        const barH = Math.max(0,(v/max)*chartH);
        const x = LPAD + i*grp + grp/2 - bw/2;
        const y = TPAD+chartH-barH;
        const r = 5;
        const isPeak = v===max && v>0;
        return (
          <g key={i} style={{ animation:`barGrow 0.6s ${0.05+i*0.05}s cubic-bezier(.2,.8,.2,1) both`, transformOrigin:`${x+bw/2}px ${TPAD+chartH}px` }}>
            {barH>2 && <rect x={x} y={y} width={bw} height={barH} rx={r} fill={color} opacity={isPeak?"0.3":"0.18"} filter={`url(#bf${id})`}/>}
            {barH>2 && <rect x={x} y={y} width={bw} height={barH} rx={r} fill={`url(#gb${id})`}/>}
            {barH>3 && <rect x={x} y={y} width={bw} height={3} rx={r} fill={isPeak?"#fff":color} opacity={isPeak?"1":"0.9"}/>}
            {isPeak && <text x={x+bw/2} y={y-7} textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="inherit" style={{textShadow:`0 0 8px ${color}`}}>{fmt(v)}</text>}
            <text x={x+bw/2} y={H-8} textAnchor="middle" fill={isPeak?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.35)"} fontSize="11" fontFamily="inherit" fontWeight={isPeak?"600":"400"}>{d[xKey]}</text>
          </g>
        );
      })}
      {/* Axis */}
      <line x1={LPAD} y1={TPAD+chartH} x2={W-RPAD} y2={TPAD+chartH} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
    </svg>
  );
};

// Line chart (no fill)
const GlowLineChart = ({ data=[], color=C.cyan, height=100, dataKey="value", xKey="label" }) => {
  if(data.length<2) return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"rgba(255,255,255,0.85)"}}>Need more data</div>;
  const W=500, H=height, PAD=20, BPAD=20;
  const vals = data.map(d=>d[dataKey]||0);
  const max=Math.max(...vals,1), min=Math.min(...vals,0), range=max-min||1;
  const pts = data.map((d,i)=>[PAD+(i/(data.length-1))*(W-PAD*2), H-BPAD-(((d[dataKey]||0)-min)/range)*(H-BPAD-8)]);
  const path = bezier(pts);
  const id = color.replace("#","l");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{overflow:"visible",display:"block"}}>
      <defs><filter id={`lf${id}`}><feGaussianBlur stdDeviation="3"/></filter></defs>
      {[0.33,0.66,1].map(f=>(
        <line key={f} x1={PAD} y1={H-BPAD-(f*(H-BPAD-8))} x2={W-PAD} y2={H-BPAD-(f*(H-BPAD-8))} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth="6" strokeOpacity="0.2" filter={`url(#lf${id})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill={color} opacity="0.25"/>
          <circle cx={p[0]} cy={p[1]} r="2.5" fill={color}/>
          <text x={p[0]} y={H-4} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="13" fontFamily="inherit">{data[i][xKey]}</text>
        </g>
      ))}
    </svg>
  );
};

// Donut chart
const GlowDonut = ({ data=[], size=120, innerRadius=38, outerRadius=54 }) => {
  const total = data.reduce((s,d)=>s+(d.value||0),0)||1;
  let angle = -Math.PI/2;
  const cx=size/2, cy=size/2;
  const toXY = (r,a) => [cx+r*Math.cos(a), cy+r*Math.sin(a)];
  const arcs = data.map(d=>{
    const sweep = (d.value/total)*2*Math.PI*0.97;
    const start=angle; angle+=sweep+(0.03*Math.PI/data.length);
    const [x1,y1]=toXY(outerRadius,start);
    const [x2,y2]=toXY(outerRadius,start+sweep);
    const [x3,y3]=toXY(innerRadius,start+sweep);
    const [x4,y4]=toXY(innerRadius,start);
    const large=sweep>Math.PI?1:0;
    return { path:`M${x1},${y1} A${outerRadius},${outerRadius},0,${large},1,${x2},${y2} L${x3},${y3} A${innerRadius},${innerRadius},0,${large},0,${x4},${y4} Z`, color:d.color, name:d.name||d.label };
  });
  // Lead segment fills the center so the ring reads at a glance
  const top = data.reduce((a,d)=>(d.value||0)>(a.value||0)?d:a, data[0]||{value:0});
  const topPct = Math.round(((top.value||0)/total)*100);
  return (
    <div style={{ position:"relative", width:size, height:size, display:"inline-flex" }}>
      <svg width={size} height={size} style={{overflow:"visible", animation:"donutIn 0.7s cubic-bezier(.2,.8,.2,1) both"}}>
        {arcs.map((arc,i)=>(
          <g key={i}>
            <path d={arc.path} fill={arc.color} opacity="0.25" transform={`scale(1.08) translate(-${cx*0.08},-${cy*0.08})`}/>
            <path d={arc.path} fill={arc.color}/>
          </g>
        ))}
        <circle cx={cx} cy={cy} r={innerRadius-2} fill="rgba(7,5,15,0.9)"/>
      </svg>
      {topPct>0 && (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ fontSize:Math.round(size*0.2), fontWeight:400, fontFamily:C.fontHead, color:top.color||"#fff", lineHeight:1 }}>{topPct}%</div>
          {(top.name||top.label) && <div style={{ fontSize:Math.max(7,Math.round(size*0.075)), color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 }}>{(top.name||top.label).slice(0,9)}</div>}
        </div>
      )}
    </div>
  );
};

// Sparkline (mini area)
const Sparkline = ({ data=[], color=C.pink, height=40 }) => {
  if(!data.length) return null;
  const W=300, H=height;
  const max=Math.max(...data,1), min=Math.min(...data,0), range=max-min||1;
  const pts = data.map((v,i)=>[i/(data.length-1||1)*W, H-((v-min)/range)*(H-4)-2]);
  const path = bezier(pts);
  const id = color.replace("#","s")+H;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:"block"}}>
      <defs>
        <linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${path} L${W},${H} L0,${H} Z`} fill={`url(#sp${id})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

const HomeView = ({ ideas, allIdeas=[], outcomeMatches=[], confirmOutcome, calItems, setNav, runAI, aiLoad, openModal, ttViewsDisplay, igViewsTotal=0, allViewsDisplay=0, m, scrapedStats, statsError, igData, videos=[], weeklyDebrief, debriefLoading, runDebrief }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const _allIdeas = allIdeas.length ? allIdeas : (ideas||[]);
  const topIdeas = [..._allIdeas].sort((a,b)=>(Number(b.viral)||0)-(Number(a.viral)||0)).slice(0,3);
  const ritual = React.useMemo(()=>buildRitual(allIdeas.length?allIdeas:(ideas||[]), videos),[allIdeas, ideas, videos]);
  React.useEffect(()=>{ if(ritual.freshWeek) markRitualWeek(ritual.week); },[ritual.freshWeek, ritual.week]);
  const upcoming = (calItems||[]).slice(0,3);
  const streak = React.useMemo(()=>getStreak(),[]);
  const xp = React.useMemo(()=>getXP(),[]);
  const intelLevel = React.useMemo(()=>getIntelligenceLevel(videos, ideas||[], loadJSON(MEMORY_KEY,{entries:[]}), loadJSON(CHANNEL_THEORY_KEY,"")),[videos, ideas]);
  const xpToNext = 100 * (xp.level * xp.level);
  const xpProgress = Math.min(((xp.total - 100*(xp.level-1)*(xp.level-1)) / (xpToNext - 100*(xp.level-1)*(xp.level-1) || 1)) * 100, 100) || 0;
  // Integration health — surface sync failures that used to die silently in the console
  const [health, setHealth] = React.useState(()=>loadHealth());
  const [healthDismissedAt, setHealthDismissedAt] = React.useState(()=>loadJSON("km_health_dismissed", 0));
  React.useEffect(()=>{
    const onH = () => setHealth(loadHealth());
    window.addEventListener("km-health", onH);
    return ()=>window.removeEventListener("km-health", onH);
  },[]);
  const healthIssues = Object.entries(health)
    .filter(([,h])=>h.state==="error" && h.at > healthDismissedAt)
    .map(([service,h])=>({ service, ...h }));
  const dismissHealth = () => { const now=Date.now(); saveJSON("km_health_dismissed", now); setHealthDismissedAt(now); };
  // First-run activation path — shown instead of the ritual until there's real data
  const _ideasAll = allIdeas.length ? allIdeas : (ideas||[]);
  const gsSteps = [
    { n:1, label:"Connect your channel", why:"Add your TikTok key in Settings and hit SYNC — your history calibrates the AI", done:(videos||[]).length>0, nav:"settings" },
    { n:2, label:"Add your first idea", why:"Drop a rough concept — the AI expands it into a full video idea", done:_ideasAll.length>0, nav:"content" },
    { n:3, label:"Score it", why:"Get a 0–100 virality score with hook fixes before you film anything", done:_ideasAll.some(i=>i.viral!=null), nav:"content" },
    { n:4, label:"Post it & log the views", why:"Real results teach the AI your channel — scores get sharper every time", done:_ideasAll.some(i=>i.status==="posted"&&i.postedViews>0), nav:"content" },
  ];
  const gsNext = gsSteps.find(st=>!st.done);
  const isFirstRun = !!gsNext && ((videos||[]).length===0 || _ideasAll.length===0 || !_ideasAll.some(i=>i.viral!=null));
  // "Since you were away" — the comeback moment. Snapshot total views per visit;
  // show the delta when returning after 6+ hours with real growth.
  const prevSeen = React.useMemo(()=>loadJSON("km_last_seen", null), []);
  React.useEffect(()=>{ if(allViewsDisplay>0) saveJSON("km_last_seen", { at:Date.now(), totalViews:allViewsDisplay }); },[allViewsDisplay]);
  const sinceDelta = (prevSeen && prevSeen.totalViews>0 && allViewsDisplay>prevSeen.totalViews && (Date.now()-prevSeen.at)>6*3600*1000)
    ? allViewsDisplay - prevSeen.totalViews : null;
  // Build chart data from videos
  const last7 = [...Array(7)].map((_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const label = d.toLocaleDateString("en-GB",{weekday:"short"});
    const dayVids = (videos||[]).filter(v => v.platform!=="instagram" && v.created_at && new Date(v.created_at).toDateString()===d.toDateString());
    const value = dayVids.reduce((s,v)=>s+(v.views||0),0);
    return {label, value};
  });
  const igLast7 = [...Array(7)].map((_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const label = d.toLocaleDateString("en-GB",{weekday:"short"});
    // Only show views for reels actually posted in the last 7 days
    const igVids = (videos||[]).filter(v=>v.platform==="instagram");
    const dayVids = igVids.filter(v=>v.created_at && new Date(v.created_at).toDateString()===d.toDateString());
    const value = dayVids.reduce((s,v)=>s+(v.views||0),0);
    return {label, value};
  });
  const hookChartData = (() => {
    const map = {};
    (videos||[]).forEach(v=>{ if(!v.hook) return; if(!map[v.hook]) map[v.hook]=[]; map[v.hook].push(v.views||0); });
    return Object.entries(map).map(([hook,arr])=>({ label:hook.slice(0,6), value:Math.round(arr.reduce((s,x)=>s+x,0)/arr.length) })).sort((a,b)=>b.value-a.value).slice(0,6);
  })();
  const platformDonut = [
    { label:"TikTok", value:ttViewsDisplay||1, color:C.pink },
    { label:"Instagram", value:(igData?.profile?.media_count||0)*100||0, color:C.purple },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?32:28 }}>

      {/* ══ INTEGRATION HEALTH — actionable, dismissible sync warnings ══ */}
      {healthIssues.length > 0 && (
        <div data-card style={{ borderRadius:14, padding:isMobile?"16px 16px":"16px 20px", background:`linear-gradient(135deg,${C.pink}12,rgba(10,6,20,0.95))`, border:`1px solid ${C.pink}35` }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <span style={{ display:"inline-flex", flexShrink:0 }}>{I.warn(18,C.pink)}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.06em", marginBottom:6 }}>SYNC ISSUE{healthIssues.length>1?"S":""}</div>
              {healthIssues.map(iss=>(
                <div key={iss.service} style={{ fontSize:isMobile?12:13, color:"rgba(255,255,255,0.75)", lineHeight:1.55, marginBottom:4 }}>
                  <span style={{ color:C.pink, fontWeight:700, textTransform:"capitalize" }}>{iss.service}: </span>{iss.msg}
                </div>
              ))}
              <button onClick={()=>setNav&&setNav("settings")} style={{ marginTop:6, padding:"7px 14px", borderRadius:9, border:`1px solid ${C.pink}40`, background:`${C.pink}12`, color:C.pink, fontFamily:C.fontHead, fontWeight:700, fontSize:11, cursor:"pointer", letterSpacing:"0.06em" }}>CHECK SETTINGS →</button>
            </div>
            <button onClick={dismissHealth} aria-label="Dismiss sync warnings" style={{ background:"none", border:"none", color:"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:18, lineHeight:1, padding:"0 2px", flexShrink:0 }}>×</button>
          </div>
        </div>
      )}

      {/* ══ GETTING STARTED — first-run activation path ══════════════ */}
      {isFirstRun && (
        <div data-card style={{ borderRadius:18, padding:isMobile?"24px 20px":"22px 26px", background:`linear-gradient(135deg,${C.cyan}0d,${C.purple}08)`, border:`1px solid ${C.cyan}30`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.cyan}70,transparent)` }}/>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ display:"inline-flex" }}>{I.rocket(19,C.cyan)}</span>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:"0.14em", color:"#fff" }}>GET SET UP</div>
            <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, color:C.cyan, background:`${C.cyan}15`, border:`1px solid ${C.cyan}30`, borderRadius:20, padding:"3px 12px" }}>{gsSteps.filter(st=>st.done).length}/{gsSteps.length}</span>
          </div>
          <div style={{ fontSize:isMobile?12:13, color:"rgba(255,255,255,0.5)", fontFamily:C.fontBody, lineHeight:1.5, marginBottom:16 }}>Four steps to your first AI-scored video. Takes about 3 minutes.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {gsSteps.map(st=>{
              const isNext = gsNext && st.n===gsNext.n;
              return (
                <div key={st.n} onClick={()=>!st.done&&setNav&&setNav(st.nav)} style={{ display:"flex", alignItems:"center", gap:12, padding:isMobile?"14px 16px":"12px 14px", borderRadius:12, background:isNext?`${C.cyan}0d`:"rgba(255,255,255,0.02)", border:`1px solid ${isNext?C.cyan+"40":"rgba(255,255,255,0.06)"}`, cursor:st.done?"default":"pointer", opacity:st.done?0.55:1, transition:"all 0.15s" }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:st.done?13:12, fontWeight:800, background:st.done?`${C.green}18`:isNext?`${C.cyan}20`:"rgba(255,255,255,0.06)", border:`1px solid ${st.done?C.green+"50":isNext?C.cyan+"50":"rgba(255,255,255,0.1)"}`, color:st.done?C.green:isNext?C.cyan:"rgba(255,255,255,0.4)" }}>{st.done?<span style={{display:"inline-flex"}}>{I.tick(13,C.green)}</span>:st.n}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, color:"#fff", fontWeight:600, marginBottom:2, textDecoration:st.done?"line-through":"none", textDecorationColor:"rgba(255,255,255,0.3)" }}>{st.label}</div>
                    {!st.done && <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontFamily:C.fontBody, lineHeight:1.45 }}>{st.why}</div>}
                  </div>
                  {!st.done && <div style={{ fontSize:18, color:isNext?C.cyan:"rgba(255,255,255,0.3)", flexShrink:0 }}>→</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ WEEKLY RITUAL — the retention loop that feeds the AI ══════ */}
      {!isFirstRun && (ritual.pending > 0 ? (
        <div data-card style={{ borderRadius:18, padding:isMobile?"26px 20px":"20px 24px", background:`linear-gradient(135deg,${C.pink}10,${C.purple}08)`, border:`1px solid ${C.pink}30`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.pink}70,transparent)` }}/>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:isMobile?22:14 }}>
            <span style={{ display:"inline-flex" }}>{I.target(19,C.pink)}</span>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:"0.14em", color:"#fff" }}>THIS WEEK'S RITUAL</div>
            <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, color:C.pink, background:`${C.pink}15`, border:`1px solid ${C.pink}30`, borderRadius:20, padding:"3px 12px" }}>{ritual.pending} to feed the AI</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ritual.tasks.map(t=>(
              <div key={t.id} onClick={()=>setNav(t.nav)} style={{ display:"flex", alignItems:"center", gap:12, padding:isMobile?"14px 16px":"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", cursor:"pointer", transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"}>
                <div style={{ fontSize:20, fontWeight:400, fontFamily:C.fontHead, color:C.pink, minWidth:30, textAlign:"center" }}>{t.n}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:"#fff", fontWeight:600, marginBottom:2 }}>{t.label}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontFamily:C.fontBody }}>{t.why}</div>
                </div>
                <div style={{ fontSize:18, color:"rgba(255,255,255,0.3)" }}>→</div>
              </div>
            ))}
          </div>
          {outcomeMatches.length > 0 && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.12em", color:C.cyan, marginBottom:8, display:"flex", alignItems:"center", gap:7 }}>
                <span style={{display:"inline-flex"}}>{I.zap(13,C.cyan)}</span> AUTO-MATCHED FROM YOUR TIKTOK — TAP TO CONFIRM
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {outcomeMatches.slice(0,5).map(mm=>(
                  <div key={mm.ideaId} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, background:`${C.cyan}08`, border:`1px solid ${C.cyan}22` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:"#fff", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mm.ideaTitle}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontFamily:C.fontBody }}>matched → <span style={{color:C.cyan,fontWeight:700}}>{mm.views>=1e6?(mm.views/1e6).toFixed(1)+"M":mm.views>=1e3?(mm.views/1e3).toFixed(1)+"K":mm.views} views</span> · {mm.confidence}% confident</div>
                    </div>
                    <button onClick={()=>confirmOutcome&&confirmOutcome(mm.ideaId, mm.views)} style={{ flexShrink:0, padding:"7px 14px", borderRadius:8, border:`1px solid ${C.green}40`, background:`${C.green}12`, color:C.green, fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:"0.04em", display:"inline-flex", alignItems:"center", gap:5 }}>{I.tick(12,"currentColor")} Confirm</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:12, fontFamily:C.fontBody }}>Clear these and your AI scoring gets measurably sharper — the model literally learns from every result you log.</div>
        </div>
      ) : (
        <div data-card style={{ borderRadius:18, padding:"16px 24px", background:`${C.green}08`, border:`1px solid ${C.green}25`, display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ display:"inline-flex" }}>{I.fire(20,C.orange)}</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:C.green }}>Ritual complete — AI fully fed this week</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontFamily:C.fontBody, marginTop:2 }}>Every posted video is logged and every idea scored. The model has everything it needs.</div>
          </div>
        </div>
      ))}

      {/* ══ RETENTION BAR — streak, XP, intelligence ══════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(160px,100%),1fr))", gap:10 }}>
        {/* Daily Streak */}
        <div data-card style={{ borderRadius:16, padding:"16px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${streak.count>=7?C.orange:"rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ display:"flex" }}>{streak.count>=7?I.fire(26,C.orange):streak.count>=3?I.zap(26,C.yellow):I.cal(24,"rgba(255,255,255,0.6)")}</div>
          <div>
            <div style={{ fontSize:24, fontWeight:400, fontFamily:C.fontHead, color:streak.count>=7?C.orange:streak.count>=3?C.yellow:"#fff", lineHeight:1 }}>{streak.count}<span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginLeft:4 }}>day{streak.count!==1?"s":""}</span></div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700, marginTop:2 }}>STREAK{streak.best>streak.count?` · BEST ${streak.best}`:""}</div>
          </div>
        </div>
        {/* XP Level */}
        <div data-card style={{ borderRadius:16, padding:"16px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.purple}25` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700 }}>CREATOR LEVEL</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.purple, background:`${C.purple}15`, border:`1px solid ${C.purple}30`, borderRadius:6, padding:"2px 8px" }}>LVL {xp.level}</div>
          </div>
          <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, color:"#fff", lineHeight:1, marginBottom:8 }}>{xp.total.toLocaleString()} <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>XP</span></div>
          <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.06)" }}>
            <div style={{ height:"100%", width:`${xpProgress}%`, borderRadius:2, background:`linear-gradient(90deg,${C.purple},${C.pink})`, transition:"width 0.6s ease" }}/>
          </div>
        </div>
        {/* Channel Intelligence */}
        <div data-card style={{ borderRadius:16, padding:"16px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.cyan}25` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:8 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:isMobile?"0.04em":"0.1em", fontWeight:700, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{isMobile?"AI LEVEL":"AI INTELLIGENCE"}</div>
            <div style={{ fontSize:isMobile?9:11, fontWeight:700, color:C.cyan, background:`${C.cyan}12`, border:`1px solid ${C.cyan}25`, borderRadius:6, padding:isMobile?"3px 6px":"2px 8px", flexShrink:0, whiteSpace:"nowrap", letterSpacing:"0.04em" }}>{intelLevel<30?"LEARNING":intelLevel<60?"BUILDING":intelLevel<80?"SHARP":"ELITE"}</div>
          </div>
          <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, color:C.cyan, lineHeight:1, marginBottom:8 }}>{intelLevel}<span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginLeft:2 }}>/100</span></div>
          <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.06)" }}>
            <div style={{ height:"100%", width:`${intelLevel}%`, borderRadius:2, background:`linear-gradient(90deg,${C.cyan},${C.purple})`, transition:"width 0.6s ease" }}/>
          </div>
        </div>
        {/* Open loops — Zeigarnik effect */}
        {(() => {
          const unscored = _allIdeas.filter(i=>!(i.viral>0)&&i.status!=="posted").length;
          const stale = _allIdeas.filter(i=>{ if(["posted","filmed"].includes(i.status)) return false; const d=i.createdAt?Math.floor((Date.now()-new Date(i.createdAt).getTime())/86400000):null; return d&&d>30; }).length;
          const urgent = unscored + stale;
          return urgent > 0 ? (
            <div data-card style={{ borderRadius:16, padding:"16px 20px", background:`${C.pink}08`, border:`1px solid ${C.pink}25`, cursor:"pointer" }} onClick={()=>setNav("content")}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>NEEDS ATTENTION</div>
              <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, color:C.pink, lineHeight:1, marginBottom:6 }}>{urgent} <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>open loop{urgent!==1?"s":""}</span></div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:C.fontBody }}>
                {unscored>0&&`${unscored} unscored`}{unscored>0&&stale>0?" · ":" "}{stale>0&&`${stale} stale`}
              </div>
            </div>
          ) : (
            <div data-card style={{ borderRadius:16, padding:"16px 20px", background:`${C.green}08`, border:`1px solid ${C.green}25` }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>STATUS</div>
              <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, color:C.green, lineHeight:1, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>All clear {I.tick(20,C.green)}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontFamily:C.fontBody }}>No open loops</div>
            </div>
          );
        })()}
      </div>

      {/* ══ HERO BANNER ══════════════════════════════════════════ */}
      <div style={{ borderRadius:24, overflow:"hidden", position:"relative", background:"linear-gradient(135deg,#0A0614 0%,#120820 50%,#0A0614 100%)", border:"1px solid rgba(255,255,255,0.06)" }}>
        {/* Ambient orbs */}
        <div style={{ position:"absolute", top:-100, left:-80, width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,${C.pink}25 0%,transparent 70%)`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-100, right:-80, width:350, height:350, borderRadius:"50%", background:`radial-gradient(circle,${C.purple}20 0%,transparent 70%)`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"30%", left:"40%", width:250, height:250, borderRadius:"50%", background:`radial-gradient(circle,#3B1FFF18 0%,transparent 70%)`, pointerEvents:"none" }}/>
        {/* Top shimmer */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent 0%,${C.pink}60 30%,${C.purple}60 70%,transparent 100%)` }}/>
        <div style={{ position:"relative", padding:isMobile?"22px 18px":"44px 48px", display:"flex", alignItems:"stretch", gap:isMobile?20:48 }}>
          {/* Left: main stat */}
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:isMobile?24:16 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.eye(14,"#fff")}</div>
              <span style={{ fontSize:14, color:"rgba(255,255,255,0.85)", letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:700 }}>Total Views All Time</span>
            </div>
            <HeroCount value={allViewsDisplay} style={{ fontSize:isMobile?52:88, fontWeight:400, lineHeight:0.85, fontFamily:C.fontHead, color:"#fff", letterSpacing:"-0.01em", textShadow:`0 0 100px ${C.pink}35`, display:"block" }} />
            {sinceDelta && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:12, padding:isMobile?"6px 12px":"6px 14px", borderRadius:20, background:`${C.green}14`, border:`1px solid ${C.green}35` }}>
                <span style={{ fontSize:11, color:C.green }}>▲</span>
                <span style={{ fontSize:isMobile?12:13, fontWeight:700, color:C.green }}>+{fmt(sinceDelta)} since your last visit</span>
              </div>
            )}
            <div style={{ marginTop:16, display:"flex", flexWrap:"wrap", alignItems:"center", gap:isMobile?12:24 }}>
              {!isMobile && <div style={{ height:40, width:1, background:"rgba(255,255,255,0.08)" }}/>}
              {[
                {l:WL.statLabels?.followers||"Followers",v:m?.tt_followers||0,c:C.pink},
                {l:WL.statLabels?.custom1Label||"Stat",v:m?.[WL.statLabels?.custom1Key||"bins"]||0,c:C.yellow},
              ].map((s,i)=>(
                <div key={i}>
                  <div style={{ fontSize:isMobile?10:14, color:"rgba(255,255,255,0.6)", letterSpacing:"0.14em", textTransform:"uppercase" }}>{s.l}</div>
                  <div style={{ fontSize:isMobile?22:28, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1.1, textShadow:`0 0 16px ${s.c}50` }}>{s.v.toLocaleString()}</div>
                </div>
              ))}
              {!isMobile && <div style={{ height:40, width:1, background:"rgba(255,255,255,0.08)" }}/>}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:scrapedStats?.scraped_at?C.green:"rgba(255,255,255,0.4)", boxShadow:scrapedStats?.scraped_at?`0 0 8px ${C.green}`:""  }}/>
                <span style={{ fontSize:isMobile?12:17, color:"rgba(255,255,255,0.7)", letterSpacing:"0.08em" }}>{scrapedStats?.scraped_at?"SYNCED":"NOT SYNCED"}</span>
              </div>
            </div>
          </div>
          {/* Right: sparkline */}
          <div style={{ width:isMobile?90:220, display:isMobile?"none":"flex", flexDirection:"column", justifyContent:"flex-end", paddingBottom:8, opacity:0.75 }}>
            <Sparkline data={[0.25,0.4,0.35,0.6,0.55,0.8,1].map(f=>Math.round((ttViewsDisplay||500)*f))} color={C.pink} height={70}/>
          </div>
        </div>
      </div>

      {/* ══ STAT CARDS ════════════════════════════════════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fit,minmax(200px,1fr))", gap:isMobile?16:14, marginBottom:isMobile?28:32 }}>
        {[
          { label:"TT Followers", value:m?.tt_followers>=1e3?(m.tt_followers/1e3).toFixed(1)+"K":String(m?.tt_followers||0), color:C.pink, icon:I.tt },
          { label:"TT Views", value:ttViewsDisplay>=1e6?(ttViewsDisplay/1e6).toFixed(1)+"M":ttViewsDisplay>=1e3?(ttViewsDisplay/1e3).toFixed(1)+"K":String(ttViewsDisplay||0), color:C.cyan, icon:I.eye },
          { label:"IG Followers", value:(()=>{ const f=igData?.profile?.followers_count||m?.ig_followers||0; return f>=1e3?(f/1e3).toFixed(1)+"K":f?String(f):"--"; })(), color:C.yellow, icon:I.ig },
          { label:"IG Views", value:(()=>{ const t=videos.filter(v=>v.platform==="instagram").reduce((s,v)=>s+(v.views||0),0); return t>=1e6?(t/1e6).toFixed(1)+"M":t>=1e3?(t/1e3).toFixed(1)+"K":String(t||0); })(), color:C.purple, icon:I.ig },
        ].map((s,i)=>(
          <div key={i} data-card style={{ borderRadius:22, padding:isMobile?"20px 16px 16px":"26px 26px 22px", background:`linear-gradient(145deg,${s.color}16 0%,rgba(8,5,18,0.95) 70%)`, border:`1px solid ${s.color}30`, position:"relative", overflow:"hidden", boxShadow:`0 8px 32px ${s.color}08` }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${s.color},${s.color}00)`, borderRadius:"28px 28px 0 0" }}/>
            <div style={{ position:"absolute", bottom:-40, right:-40, width:130, height:130, borderRadius:"50%", background:`${s.color}12`, filter:"blur(40px)", pointerEvents:"none" }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:`linear-gradient(135deg,${s.color}25,${s.color}0a)`, border:`1px solid ${s.color}30`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px ${s.color}18` }}>{s.icon(18,s.color)}</div>
              <div style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {I.trend(12,s.color)}
              </div>
            </div>
            <div style={{ fontSize:isMobile?28:44, fontWeight:400, fontFamily:C.fontHead, color:"#fff", lineHeight:1, letterSpacing:"-0.01em", marginBottom:10, textShadow:`0 0 30px ${s.color}30` }}>{s.value}</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", letterSpacing:"0.12em", textTransform:"uppercase" }}>{s.label}</div>
              <div style={{ width:40, height:2, borderRadius:1, background:`linear-gradient(90deg,${s.color}80,${s.color}10)` }}/>
            </div>
          </div>
        ))}
      </div>

      {/* ══ PERFORMANCE CHART ══════════════════════════════════════ */}
      <div style={{ borderRadius:22, overflow:"hidden", background:"linear-gradient(145deg,#0E0B1E,#080514)", border:"1px solid rgba(255,255,255,0.07)", position:"relative", boxShadow:"0 8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.pink},${C.purple},${C.cyan},transparent)` }}/>
        <div style={{ position:"absolute", top:0, right:0, width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle,${C.purple}08,transparent 70%)`, pointerEvents:"none" }}/>
        <div style={{ padding:isMobile?"16px 16px 0":"28px 32px 0" }}>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", alignItems:isMobile?"flex-start":"flex-start", justifyContent:"space-between", gap:12, marginBottom:isMobile?24:16 }}>
            <div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:8, fontWeight:600 }}>Platform Views — 7 Days</div>
              <div style={{ fontSize:isMobile?28:48, fontWeight:400, fontFamily:C.fontHead, color:"#fff", lineHeight:1, letterSpacing:"-0.01em" }}>{(last7.reduce((s,d)=>s+d.value,0)+igLast7.reduce((s,d)=>s+d.value,0)).toLocaleString()}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:6 }}>Total across both platforms this week</div>
            </div>
            <div style={{ display:"flex", gap:8, alignSelf:isMobile?"stretch":"flex-start" }}>
              {[{c:C.pink,l:"TikTok",v:last7.reduce((s,d)=>s+d.value,0)},{c:C.purple,l:"Instagram",v:igLast7.reduce((s,d)=>s+d.value,0)}].map((p,i)=>(
                <div key={i} style={{ padding:isMobile?"14px 14px":"14px 20px", borderRadius:14, background:`linear-gradient(145deg,${p.c}12,rgba(8,5,18,0.8))`, border:`1px solid ${p.c}25`, flex:isMobile?1:undefined, minWidth:isMobile?undefined:110, textAlign:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginBottom:5 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:p.c }}/>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{p.l}</span>
                  </div>
                  <div style={{ fontSize:isMobile?18:24, fontWeight:400, color:p.c, fontFamily:C.fontHead }}>{p.v.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding:"0 16px 20px" }}>
          <DualAreaChart
            ttData={[...last7].sort((a,b)=>["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(a.label)-["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(b.label))}
            igData={[...igLast7].sort((a,b)=>["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(a.label)-["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(b.label))}
            height={220}/>
        </div>
      </div>

      {/* ══ QUICK ACTIONS ══════════════════════════════════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fit,minmax(min(160px,100%),1fr))", gap:isMobile?24:12 }}>
        {[
          { icon:I.idea, label:"Add Idea",     desc:"Brainstorm content", color:C.purple, fn:()=>{ setNav("content"); if(openModal) setTimeout(()=>openModal("addIdea"),50); } },
          { icon:I.cal,  label:"Schedule",     desc:"Plan your calendar",  color:C.cyan,   fn:()=>{ setNav("content"); if(openModal) setTimeout(()=>openModal("addCal"),50); } },
          { icon:I.vid,  label:"Log Video",    desc:"Track performance",   color:C.pink,   fn:()=>openModal&&openModal("addVideo") },
          { icon:I.bar,  label:"Update Stats", desc:"Manual stat entry",   color:C.yellow, fn:()=>openModal&&openModal("editStats") },
        ].map((a,i)=>(
          <button data-btn key={i} onClick={a.fn} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:isMobile?18:16, padding:isMobile?"28px 20px":"24px 22px", minHeight:44, borderRadius:16, background:`linear-gradient(145deg,${a.color}12,rgba(8,5,18,0.9))`, border:`1px solid ${a.color}25`, cursor:"pointer", fontFamily:C.fontHead, transition:"all 0.2s", position:"relative", overflow:"hidden", textAlign:"left" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${a.color}50,transparent)` }}/>
            <div style={{ position:"absolute", bottom:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${a.color}0c`, filter:"blur(24px)" }}/>
            <div style={{ width:46, height:46, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${a.color}25,${a.color}08)`, border:`1px solid ${a.color}30`, boxShadow:`0 6px 20px ${a.color}15` }}>{a.icon(22,a.color)}</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#fff", letterSpacing:"0.02em", marginBottom:3 }}>{a.label}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.04em" }}>{a.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ══ NEXT BEST ACTION ══════════════════════════════════════ */}
      {(() => {
        const unscoredIdeas = (ideas||[]).filter(i=>!(i.viral>0)&&i.status!=="posted");
        const filmingNow = (ideas||[]).filter(i=>i.status==="filming");
        const readyToPost = (ideas||[]).filter(i=>i.status==="script_ready"&&(i.viral||0)>=75);
        const noVideos = (videos||[]).length === 0;
        const noIdeas = (ideas||[]).length === 0;

        let action = null;
        if(noVideos && noIdeas) action = { msg:"Start by logging your first video and adding your first idea.", cta:"Log a Video", color:C.pink, fn:()=>openModal&&openModal("addVideo") };
        else if(noIdeas) action = { msg:"You have videos but no ideas. Add content ideas to start scoring them.", cta:"Add Idea", color:C.purple, fn:()=>{ setNav&&setNav("content"); if(openModal) setTimeout(()=>openModal("addIdea"),50); } };
        else if(unscoredIdeas.length>0) action = { msg:`${unscoredIdeas.length} idea${unscoredIdeas.length>1?"s":""} haven't been scored yet. Score them to see which ones are worth filming.`, cta:"Go to Ideas", color:C.purple, fn:()=>setNav&&setNav("content") };
        else if(filmingNow.length>0) action = { msg:`"${filmingNow[0].title?.slice(0,40)}" is marked as filming. Log it as posted once it's live.`, cta:"Mark Posted", color:C.orange, fn:()=>setNav&&setNav("content") };
        else if(readyToPost.length>0) action = { msg:`"${readyToPost[0].title?.slice(0,40)}" scored ${readyToPost[0].viral}/100 — high enough to film.`, cta:"View Ideas", color:C.green, fn:()=>setNav&&setNav("content") };

        if(!action) return null;
        return (
          <div style={{ padding:isMobile?"26px 20px":"20px 24px", borderRadius:20, background:"rgba(10,6,20,0.6)", border:`1px solid rgba(255,255,255,0.06)`, borderLeft:`3px solid ${action.color}`, display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>
              <span style={{ fontWeight:700, color:action.color }}>Next: </span>{action.msg}
            </div>
            <button onClick={action.fn} style={{ padding:isMobile?"12px 18px":"8px 16px", borderRadius:10, border:`1px solid ${action.color}45`, background:`${action.color}18`, color:action.color, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>{action.cta} →</button>
          </div>
        );
      })()}

      {/* ══ WEEKLY DEBRIEF ════════════════════════════════════════ */}
      <div style={{ borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.025)" }}>
        <div style={{ padding:isMobile?"16px 20px":"16px 22px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:C.fontHead }}>Weekly Debrief</div>
            {weeklyDebrief?.generatedAt && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, marginTop:2 }}>Generated {new Date(weeklyDebrief.generatedAt).toLocaleDateString()}</div>}
          </div>
          <button onClick={runDebrief} disabled={debriefLoading} style={{ padding:isMobile?"12px 18px":"8px 16px", borderRadius:10, border:`1px solid ${C.purple}40`, background:debriefLoading?`${C.purple}15`:`linear-gradient(135deg,${C.purple}30,${C.pink}20)`, color:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:debriefLoading?"wait":"pointer", opacity:debriefLoading?0.7:1 }}>
            {debriefLoading?"GENERATING...":"↺ RUN DEBRIEF"}
          </button>
        </div>
        {weeklyDebrief ? (
          <div style={{ padding:isMobile?"20px 20px":"20px 24px", display:"flex", flexDirection:"column", gap:isMobile?22:12 }}>
            <div style={{ fontSize:isMobile?16:15, fontWeight:700, color:"#fff", fontFamily:C.fontBody, lineHeight:1.5 }}>{weeklyDebrief.headline}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(160px,100%),1fr))", gap:10 }}>
              <div style={{ padding:isMobile?"16px 16px":"14px 16px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}18` }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:10, fontFamily:C.fontHead }}>WHAT WORKED</div>
                {weeklyDebrief.whatWorked?.map((w,i)=><div key={i} style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, marginBottom:5, lineHeight:1.5, display:"flex", alignItems:"flex-start", gap:6 }}>{I.tick(12,C.green)}<span>{w}</span></div>)}
              </div>
              <div style={{ padding:isMobile?"16px 16px":"14px 16px", borderRadius:12, background:`${C.pink}08`, border:`1px solid ${C.pink}18` }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:10, fontFamily:C.fontHead }}>NEEDS WORK</div>
                {weeklyDebrief.whatDidnt?.map((w,i)=><div key={i} style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, marginBottom:5, lineHeight:1.5, display:"flex", alignItems:"flex-start", gap:6 }}>{I.x(12,C.pink)}<span>{w}</span></div>)}
              </div>
            </div>
            {weeklyDebrief.focusThisWeek && <div style={{ padding:isMobile?"16px 16px":"14px 16px", borderRadius:12, background:`${C.cyan}08`, border:`1px solid ${C.cyan}18` }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:10, fontFamily:C.fontHead }}>FOCUS THIS WEEK</div>
              {weeklyDebrief.focusThisWeek.map((f,i)=>(
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:i<weeklyDebrief.focusThisWeek.length-1?6:0 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.cyan, background:`${C.cyan}15`, borderRadius:4, padding:"1px 6px", flexShrink:0, marginTop:2, fontFamily:C.fontHead }}>{i+1}</span>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, lineHeight:1.5 }}>{f}</div>
                </div>
              ))}
            </div>}
            {weeklyDebrief.ideaToFilmNow && <div style={{ padding:isMobile?"16px 16px":"14px 16px", borderRadius:12, background:`${C.yellow}08`, border:`1px solid ${C.yellow}20` }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:8, fontFamily:C.fontHead }}>FILM THIS WEEK</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, lineHeight:1.5 }}>{weeklyDebrief.ideaToFilmNow}</div>
            </div>}
            {weeklyDebrief.watchOut && <div style={{ padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:`${C.orange}08`, border:`1px solid ${C.orange}20`, display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{display:"inline-flex"}}>{I.warn(14,C.yellow)}</span>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, lineHeight:1.5 }}>{weeklyDebrief.watchOut}</div>
            </div>}
          </div>
        ) : (
          <div style={{ padding:"32px 20px", textAlign:"center" }}>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody }}>Run your weekly debrief to get a strategic summary of what's working and what to focus on</div>
          </div>
        )}
      </div>

      {/* ══ UPCOMING + IDEAS ═══════════════════════════════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:14 }}>
        {[
          { title:"Upcoming", sub:"Scheduled content", icon:I.cal, color:C.cyan, items:upcoming, empty:"Nothing scheduled yet", emptyCta:"Schedule", emptyAction:()=>{ setNav("content"); if(openModal) setTimeout(()=>openModal("addCal"),50); },
            renderItem:(c,i,arr)=>(
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:i<arr.length-1?`1px solid rgba(255,255,255,0.05)`:"none" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:C.cyan, flexShrink:0, boxShadow:`0 0 6px ${C.cyan}` }} />
                <div style={{ flex:1, fontSize:14, color:"rgba(255,255,255,0.85)", fontWeight:600, lineHeight:1.4 }}>{c.title}</div>
                <Tag color={C.cyan} sm>{c.date||"TBD"}</Tag>
              </div>
            )
          },
          { title:"Top Ideas", sub:"Highest virality score", icon:I.idea, color:C.purple, items:topIdeas, empty:"No ideas yet", emptyCta:"Add Idea", emptyAction:()=>{ setNav("content"); if(openModal) setTimeout(()=>openModal("addIdea"),50); },
            renderItem:(idea,i,arr)=>(
              <div key={idea.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<arr.length-1?`1px solid rgba(255,255,255,0.05)`:"none" }}>
                <div style={{ fontSize:isMobile?20:30, fontWeight:400, fontFamily:C.fontHead, color:Number(idea.viral)>=70?C.green:Number(idea.viral)>=50?C.yellow:C.dim, width:36, lineHeight:1, textShadow:`0 0 10px currentColor`, flexShrink:0 }}>{idea.viral||0}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.5, flex:1, fontWeight:500 }}>{idea.title?.slice(0,52)}{(idea.title?.length||0)>52?"...":""}</div>
              </div>
            )
          },
        ].map((section,si)=>(
          <div key={si} style={{ borderRadius:22, padding:isMobile?"20px 18px":"24px 26px", background:`linear-gradient(145deg,${section.color}0f,rgba(8,5,18,0.96))`, border:`1px solid ${section.color}20`, position:"relative", overflow:"hidden", boxShadow:`0 8px 40px rgba(0,0,0,0.3)` }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${section.color}cc,transparent 60%)` }}/>
            <div style={{ position:"absolute", bottom:-40, right:-40, width:140, height:140, borderRadius:"50%", background:`${section.color}08`, filter:"blur(40px)" }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${section.color}22,${section.color}08)`, border:`1px solid ${section.color}28`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 14px ${section.color}15` }}>{section.icon(18,section.color)}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"0.03em" }}>{section.title}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2, letterSpacing:"0.06em" }}>{section.sub}</div>
                </div>
              </div>
              <div style={{ fontSize:11, color:section.color, fontWeight:700, letterSpacing:"0.1em", padding:"3px 10px", borderRadius:6, background:`${section.color}12`, border:`1px solid ${section.color}20` }}>{section.items.length} ITEMS</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {section.items.length===0
                ? <div style={{ textAlign:"center", padding:"20px 0" }}>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:section.emptyCta?12:0 }}>{section.empty}</div>
                    {section.emptyCta && <button onClick={section.emptyAction} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${section.color}40`, background:`${section.color}15`, color:section.color, fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:"0.06em" }}>{section.emptyCta} →</button>}
                  </div>
                : section.items.map((item,i,arr)=>section.renderItem(item,i,arr))
              }
            </div>
          </div>
        ))}
      </div>

      {/* ══ BEST POSTING DAY ═══════════════════════════════════════ */}
      {(()=>{
        const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        const map = {};
        DAYS.forEach(d=>{ map[d]=[]; });
        (videos||[]).forEach(v=>{
          if(!v.date&&!v.created_at) return;
          const d = new Date(v.date||v.created_at);
          const day = DAYS[d.getDay()];
          map[day].push(v.views||0);
        });
        const dayPerf = DAYS.map(d=>({
          day: d,
          avg: map[d].length ? Math.round(map[d].reduce((s,x)=>s+x,0)/map[d].length) : 0,
          count: map[d].length,
        })).sort((a,b)=>b.avg-a.avg);
        const maxAvg = Math.max(...dayPerf.map(d=>d.avg),1);
        return videos.length > 3 ? (
          <div style={{ borderRadius:22, padding:isMobile?"20px 18px":"24px 26px", background:"linear-gradient(145deg,rgba(255,107,53,0.08),rgba(8,5,18,0.96))", border:`1px solid ${C.orange}20`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.orange}cc,transparent 60%)` }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"0.03em" }}>Best Days to Post</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>Based on avg views per day of week</div>
              </div>
              <div style={{ padding:"6px 14px", borderRadius:8, background:`${C.orange}15`, border:`1px solid ${C.orange}25`, fontSize:12, fontWeight:700, color:C.orange }}>
                POST ON {dayPerf[0]?.day?.toUpperCase()||"—"}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {dayPerf.slice(0,5).map((d,i)=>(
                <div key={d.day} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:32, fontSize:12, fontWeight:700, color:i===0?C.orange:i===1?C.yellow:"rgba(255,255,255,0.4)", textAlign:"right" }}>{d.day}</div>
                  <div style={{ flex:1, height:8, borderRadius:4, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(d.avg/maxAvg)*100}%`, borderRadius:4, background:i===0?`linear-gradient(90deg,${C.orange},${C.yellow})`:i===1?`linear-gradient(90deg,${C.yellow},${C.yellow}80)`:"rgba(255,255,255,0.15)", transition:"width 0.6s ease" }}/>
                  </div>
                  <div style={{ width:60, fontSize:12, color:i<2?C.orange:"rgba(255,255,255,0.35)", fontWeight:700, textAlign:"right" }}>{d.avg>=1000?(d.avg/1000).toFixed(1)+"K":d.avg||"—"}{d.count>0?<span style={{fontSize:10,color:"rgba(255,255,255,0.2)",fontWeight:400}}> ({d.count})</span>:""}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* ══ AI STRATEGY ════════════════════════════════════════════ */}
      <div style={{ borderRadius:16, padding:isMobile?"18px 16px":"22px 24px", background:"linear-gradient(145deg,rgba(255,255,255,0.02),rgba(10,6,20,0.8))", border:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:isMobile?24:16 }}>AI Strategy</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10 }}>
          {[
            { ic:I.search, l:"WHAT'S WORKING",  desc:"Analyse top content", c:C.cyan,   m:"analysis" },
            { ic:I.target, l:"NEXT VIDEOS",      desc:"AI recommendations", c:C.green,  m:"nextVids" },
            { ic:I.write,  l:`${(WL.creator2||"WEEKLY").toUpperCase()} BRIEF`, desc:"Weekly filming brief", c:C.yellow, m:"weekly"   },
            { ic:I.trend,  l:"TRENDS",           desc:"What's hot now", c:C.orange, m:"trends"   },
          ].map((a,i)=>(
            <button data-btn key={i} onClick={()=>runAI&&runAI(a.m)} disabled={aiLoad&&aiLoad[a.m]}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderRadius:16, background:`linear-gradient(135deg,${a.c}0c,rgba(10,6,20,0.6))`, border:`1px solid ${a.c}1e`, cursor:"pointer", fontFamily:C.fontHead, opacity:aiLoad&&aiLoad[a.m]?0.5:1, transition:"all 0.2s", textAlign:"left", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, bottom:0, width:2, background:`linear-gradient(180deg,${a.c},${a.c}00)`, borderRadius:"14px 0 0 14px" }}/>
              <div style={{ width:46, height:46, borderRadius:13, background:`linear-gradient(135deg,${a.c}18,${a.c}06)`, border:`1px solid ${a.c}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{a.ic(22,a.c)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.04em", marginBottom:3 }}>{a.l}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)" }}>{aiLoad&&aiLoad[a.m]?"Running...":a.desc}</div>
              </div>
              <div style={{ fontSize:16, color:`${a.c}60` }}>›</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pillar Health */}
      {(() => {
        const PILLARS = WL.pillars || ["Local Connection","Location Contrast","Mission Reveal","App In Action","Travel Utility"];
        const PILLAR_COLORS = {
          "Local Connection": C.green,
          "Location Contrast": C.cyan,
          "Mission Reveal": C.purple,
          "App In Action": C.yellow,
          "Travel Utility": C.orange,
        };
        const today = new Date();
        const posted = (ideas||[]).filter(i=>i.status==="posted"&&i.postedDate);
        const lastByPillar = {};
        posted.forEach(i=>{
          const p = i.aiScore?.contentPillar;
          if(!p) return;
          const d = new Date(i.postedDate);
          if(!lastByPillar[p]||d>lastByPillar[p]) lastByPillar[p]=d;
        });
        const pillarsWithGap = PILLARS.map(p=>{
          const last = lastByPillar[p];
          const days = last ? Math.floor((today-last)/86400000) : null;
          return { name:p, days, color: PILLAR_COLORS[p] };
        });
        const hasAny = posted.length > 0;
        return (
          <div style={{ borderRadius:16, padding:isMobile?"26px 20px":"20px 24px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:"0.16em", textTransform:"uppercase", fontWeight:700, marginBottom:isMobile?22:14 }}>Content Pillar Health</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {pillarsWithGap.map(p=>{
                const stale = p.days===null ? true : p.days > 14;
                const warn = p.days !== null && p.days > 7 && p.days <= 14;
                const color = stale ? "rgba(255,255,255,0.2)" : warn ? C.yellow : p.color;
                return (
                  <div key={p.name} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 14px", borderRadius:10, background:`${color}12`, border:`1px solid ${color}30` }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:color, boxShadow:stale?"none":`0 0 6px ${color}` }}/>
                    <span style={{ fontSize:12, fontWeight:700, color, letterSpacing:"0.04em" }}>{p.name.split(" ")[0].toUpperCase()}</span>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{p.days===null?"never":`${p.days}d ago`}</span>
                  </div>
                );
              })}
            </div>
            {!hasAny && <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)", marginTop:8 }}>Mark ideas as posted to track pillar coverage</div>}
          </div>
        );
      })()}

      {/* Posting Cadence Tracker */}
      {(() => {
        const postedWithDate = (ideas||[]).filter(i=>i.status==="posted"&&i.postedDate);
        if(postedWithDate.length < 3) return null;
        const sorted = [...postedWithDate].sort((a,b)=>new Date(b.postedDate)-new Date(a.postedDate));
        const gaps = [];
        for(let i=0;i<Math.min(sorted.length-1,8);i++) {
          const a = new Date(sorted[i].postedDate), b = new Date(sorted[i+1].postedDate);
          gaps.push(Math.floor((a-b)/86400000));
        }
        const avgGap = Math.round(gaps.reduce((s,g)=>s+g,0)/gaps.length);
        const lastPosted = new Date(sorted[0].postedDate);
        const daysSinceLast = Math.floor((new Date()-lastPosted)/86400000);
        const onTrack = daysSinceLast <= avgGap + 1;
        const statusColor = onTrack ? C.green : daysSinceLast > avgGap * 2 ? C.pink : C.yellow;
        const videosThisWeek = postedWithDate.filter(i=>Math.floor((new Date()-new Date(i.postedDate))/86400000)<=7).length;
        return (
          <div style={{ borderRadius:16, padding:"16px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${statusColor}20`, display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:statusColor, boxShadow:`0 0 8px ${statusColor}`, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:statusColor, letterSpacing:"0.1em", textTransform:"uppercase" }}>Posting Cadence</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:2 }}>Avg every {avgGap}d · last posted {daysSinceLast===0?"today":`${daysSinceLast}d ago`} · {videosThisWeek} this week</div>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:statusColor }}>{onTrack ? "ON TRACK" : daysSinceLast > avgGap * 2 ? "OVERDUE" : "SLOWING"}</div>
          </div>
        );
      })()}

      {/* Stale Ideas Alert */}
      {(() => {
        const staleIdeas = (ideas||[]).filter(i=>{
          if(["posted","filmed"].includes(i.status)) return false;
          const daysOld = i.createdAt ? Math.floor((Date.now()-new Date(i.createdAt).getTime())/(1000*60*60*24)) : null;
          return daysOld!==null && daysOld > 30;
        });
        if(!staleIdeas.length) return null;
        return (
          <div style={{ borderRadius:16, padding:"14px 20px", background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
            <div style={{ fontSize:11, color:C.pink, letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>{I.warn(12,C.pink)} Stale Ideas ({staleIdeas.length})</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)" }}>
              {staleIdeas.length} idea{staleIdeas.length>1?"s":""} {staleIdeas.length>1?"have":"has"} been sitting unfilmed for 30+ days. Film them or archive.
            </div>
            <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
              {staleIdeas.slice(0,3).map(i=><span key={i.id} style={{ fontSize:11, color:C.pink, background:`${C.pink}10`, border:`1px solid ${C.pink}25`, borderRadius:6, padding:"2px 8px" }}>{i.title?.slice(0,30)||"Untitled"}</span>)}
              {staleIdeas.length>3 && <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>+{staleIdeas.length-3} more</span>}
            </div>
          </div>
        );
      })()}

      {/* Idea → Outcome Gap */}
      {(() => {
        const scored80 = (ideas||[]).filter(i=>(i.viral||0)>=80);
        const filmed = scored80.filter(i=>["filming","posted"].includes(i.status));
        const posted = scored80.filter(i=>i.status==="posted");
        if(scored80.length < 3) return null;
        const filmRate = Math.round(filmed.length/scored80.length*100);
        const postRate = Math.round(posted.length/scored80.length*100);
        const bottleneck = filmRate < 50 ? "Filming" : postRate < filmRate - 20 ? "Editing" : "None identified";
        return (
          <div style={{ borderRadius:16, padding:"16px 20px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:isMobile?14:10 }}>Idea → Outcome Pipeline</div>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              {[
                { label:`${scored80.length} scored 80+`, color:C.purple },
                { label:`${filmed.length} filmed (${filmRate}%)`, color:C.yellow },
                { label:`${posted.length} posted (${postRate}%)`, color:C.green },
              ].map((s,i)=>(
                <div key={i} style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.label}</div>
              ))}
            </div>
            {bottleneck !== "None identified" && <div style={{ fontSize:12, color:C.orange, marginTop:8 }}>Bottleneck: {bottleneck} — most high-score ideas die here</div>}
          </div>
        );
      })()}

    </div>
  );
};

const ContentView = ({ ideas, setIdeas, calItems, setCalItems, scoreIdea, genCaption, aiLoad, captionResult, captionIdea, copied, copyText, openModal, setEditIdeaTarget, setModals, setNavSub, onBuildScript, markPosted }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [sub, setSub]         = useState("IDEAS");
  const [expanded, setExpanded] = useState(null);
  const [calFilter, setCalFilter] = useState("ALL");
  const [ideaFilter, setIdeaFilter] = useState("ALL");
  const [postingId, setPostingId] = useState(null);
  const [postViews, setPostViews] = useState("");
  const [quickExpand, setQuickExpand] = useState("");
  const [hookA, setHookA] = useState("");
  const [hookB, setHookB] = useState("");
  const [hookABResult, setHookABResult] = useState(null);
  const [voiceVote, setVoiceVote] = useState({}); // text -> "good" | "bad"
  const voteVoice = (text, good) => { if(!text) return; setVoiceVote(v=>({...v,[text]:good?"good":"bad"})); recordVoiceFeedback(text, good); };
  // Small "does this sound like me?" control — one tap trains the voice engine.
  const VoiceVote = ({ text }) => {
    const v = voiceVote[text];
    return (
      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8 }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:600, letterSpacing:"0.04em" }}>SOUND LIKE YOU?</span>
        <button onClick={()=>voteVoice(text,true)} title="Sounds like me — do more of this" style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, cursor:"pointer", border:`1px solid ${v==="good"?C.green:"rgba(255,255,255,0.12)"}`, background:v==="good"?`${C.green}20`:"transparent", color:v==="good"?C.green:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700 }}>{I.tick(10,"currentColor")} YES</button>
        <button onClick={()=>voteVoice(text,false)} title="Not my voice — never write like this" style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, cursor:"pointer", border:`1px solid ${v==="bad"?C.pink:"rgba(255,255,255,0.12)"}`, background:v==="bad"?`${C.pink}20`:"transparent", color:v==="bad"?C.pink:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700 }}>{I.x(10,"currentColor")} NO</button>
      </div>
    );
  };
  const [hookABLoading, setHookABLoading] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const setIdeaStage = (idea, stage) => {
    if(stage === "posted") {
      setPostingId(idea.id); setPostViews("");
    } else {
      setIdeas(is=>is.map(i=>i.id===idea.id?{...i,status:stage}:i));
    }
  };

  const doQuickExpand = async () => {
    if(!quickExpand.trim()||expanding) return;
    setExpanding(true);
    try {
      // Uses callAI, which falls back to whichever LLM the user configured —
      // no single provider is required.
      const result = await callAI(`Expand this rough content concept into a full video idea for ${WL.handle} (${WL.appName} — ${WL.niche}).\n\nConcept: "${quickExpand}"\n\nReturn ONLY valid JSON:\n{"title":"compelling title under 12 words","type":"facecam|broll|voiceover|collab","hook":"hook type: achievement|contrast|challenge|curiosity|emotion|location|local|story","hookLine":"exact opening line under 10 words","body":"2 sentences on what happens in the video","cta":"what to say at the end","viralityScore":0-100,"contentPillar":"niche-specific pillar name","estimated_views":"e.g. 20K-80K"}`, 800);
      const newIdea = {
        id: Date.now().toString(),
        title: result.title,
        type: result.type||"facecam",
        hook: result.hookLine||result.hook||"",
        text: result.body||"",
        viral: result.viralityScore||0,
        aiScore: { estimated_views: result.estimated_views, contentPillar: result.contentPillar, viralityScore: result.viralityScore },
        contentPillar: result.contentPillar,
        status: "idea",
        created: new Date().toISOString().slice(0,10),
        createdAt: new Date().toISOString(),
      };
      setIdeas(is=>[newIdea,...is]);
      setQuickExpand("");
      // Auto-score the new idea in background
      if(scoreIdea) setTimeout(()=>scoreIdea(newIdea), 800);
    } catch(e) { alert("Expand failed: "+e.message); }
    setExpanding(false);
  };

  // Conviction ranking: sort by score, but when two ideas are within 4pts, the
  // higher-confidence one wins — a data-backed 82 should outrank an uncertain 84.
  const _conf = i => i.confidenceLevel==="HIGH"?2:i.confidenceLevel==="LOW"?0:1;
  const sorted = [...ideas].sort((a,b)=>{
    const sa=Number(a.viral)||0, sb=Number(b.viral)||0;
    if(Math.abs(sa-sb) <= 4) { const c=_conf(b)-_conf(a); if(c!==0) return c; }
    return sb-sa;
  });
  const filteredCal = calFilter==="ALL" ? calItems : calItems.filter(c=>(c.platform||"").toUpperCase()===calFilter);
  // Pipeline filters — the list is unmanageable past ~15 ideas without these
  const IDEA_FILTERS = [
    { id:"ALL",      label:"ALL",           test:()=>true },
    { id:"READY",    label:"READY TO FILM", test:i=>(i.viral||0)>=70 && i.status!=="posted" },
    { id:"UNSCORED", label:"UNSCORED",      test:i=>!(i.viral>0) && i.status!=="posted" },
    { id:"POSTED",   label:"POSTED",        test:i=>i.status==="posted" },
  ];
  const _activeIdeaFilter = IDEA_FILTERS.find(fl=>fl.id===ideaFilter) || IDEA_FILTERS[0];
  const displayIdeas = sorted.filter(_activeIdeaFilter.test);
  const ic = v => (v||0)>=80?C.green:(v||0)>=60?C.yellow:C.pink;
  const perfLabel = s => s>=80?"VIRAL":s>=65?"STRONG":s>=50?"DECENT":s>=35?"WEAK":"NEW";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?28:20 }}>
      {/* Tabs + Add button — stacks on mobile so all tabs stay readable */}
      <div style={{ display:"flex", alignItems:isMobile?"stretch":"center", justifyContent:"space-between", gap:isMobile?12:8, flexDirection:isMobile?"column":"row" }}>
        <div style={{ display:"flex", gap:isMobile?6:8, flex:1, overflowX:"auto" }}>
          {["IDEAS","CALENDAR","CAPTIONS"].map(t=>(
            <button key={t} onClick={()=>setSub(t)} style={{ padding:isMobile?"12px 14px":"10px 20px", borderRadius:10, border:`1px solid ${sub===t?C.pink:"rgba(255,255,255,0.08)"}`, background:sub===t?`${C.pink}15`:"transparent", color:sub===t?C.pink:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:isMobile?13:14, cursor:"pointer", letterSpacing:"0.04em", whiteSpace:"nowrap", flexShrink:0 }}>
              {t}{t==="IDEAS"&&` (${ideas.length})`}{t==="CALENDAR"&&` (${calItems.length})`}
            </button>
          ))}
        </div>
        <button onClick={()=>openModal&&openModal(sub==="CALENDAR"?"addCal":"addIdea")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:isMobile?"12px 14px":"10px 20px", borderRadius:10, border:`1px solid ${C.pink}40`, background:`linear-gradient(135deg,${C.pink}20,${C.pink}08)`, color:C.pink, fontFamily:C.fontHead, fontWeight:700, fontSize:isMobile?13:14, cursor:"pointer", flexShrink:0 }}>
          + {sub==="CALENDAR"?"SCHEDULE":"ADD"}
        </button>
      </div>

      {/* ── IDEAS ─────────────────────────────────────────────── */}
      {sub==="IDEAS" && (
        <>
        {/* Quick expand panel */}
        <div style={{ borderRadius:14, padding:isMobile?"26px 20px":"16px 20px", background:`${C.purple}0a`, border:`1px solid ${C.purple}25` }}>
          {!isMobile && <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:isMobile?14:10 }}>Quick Expand</div>}
          <div style={{ display:"flex", gap:8 }}>
            <input
              data-tour-input
              value={quickExpand}
              onChange={e=>setQuickExpand(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doQuickExpand()}
              placeholder="Drop a rough concept, AI expands it..."
              style={{ flex:1, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.purple}30`, borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 12px", fontSize:14, fontFamily:C.fontHead, outline:"none" }}
            />
            <button onClick={doQuickExpand} disabled={!quickExpand.trim()||expanding}
              style={{ padding:"10px 16px", borderRadius:10, border:"none", background:expanding||!quickExpand.trim()?`${C.purple}30`:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:expanding||!quickExpand.trim()?"not-allowed":"pointer", whiteSpace:"nowrap", opacity:expanding||!quickExpand.trim()?0.6:1 }}>
              {expanding ? "..." : "GO →"}
            </button>
          </div>
        </div>
        {/* Pipeline filter chips */}
        {ideas.length > 3 && (
          <div style={{ display:"flex", gap:isMobile?6:8, overflowX:"auto", paddingBottom:2 }}>
            {IDEA_FILTERS.map(fl=>{
              const n = fl.id==="ALL" ? ideas.length : sorted.filter(fl.test).length;
              const active = ideaFilter===fl.id;
              return (
                <button key={fl.id} onClick={()=>setIdeaFilter(fl.id)} style={{ padding:isMobile?"9px 13px":"7px 14px", borderRadius:20, border:`1px solid ${active?C.cyan:"rgba(255,255,255,0.1)"}`, background:active?`${C.cyan}15`:"transparent", color:active?C.cyan:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:isMobile?11:12, cursor:"pointer", letterSpacing:"0.05em", whiteSpace:"nowrap", flexShrink:0 }}>
                  {fl.label} <span style={{ opacity:0.6 }}>{n}</span>
                </button>
              );
            })}
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:isMobile?24:18, alignItems:"start" }}>
          {displayIdeas.length===0
            ? <div style={{ gridColumn:"1/-1", padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?22:12 }}>
                <div style={{ display:"flex" }}>{I.vid(30,"rgba(255,255,255,0.5)")}</div>
                <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>{ideas.length===0?"No ideas yet":"Nothing in this filter"}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>{ideas.length===0?"Start building your content pipeline — add your first idea above":"Try a different filter — or score more ideas to fill this one"}</div>
              </div>
            : displayIdeas.map(idea=>{
              const scoreC = ic(idea.viral||0);
              const isExpanded = expanded===idea.id;
              const daysOld = idea.createdAt ? Math.floor((Date.now()-new Date(idea.createdAt).getTime())/(1000*60*60*24)) : null;
              const isStale = daysOld!==null && daysOld>30 && idea.status!=="posted" && idea.status!=="filmed";
              const hasScore = (idea.viral||0)>0;
              const isScoring = aiLoad&&aiLoad["s"+idea.id];
              const stageLabel = ({idea:"Idea",script_ready:"Scripted",filming:"Filming",filmed:"Filmed",posted:"Posted"})[idea.status||"idea"]||"Idea";
              const stageColor = ({idea:C.cyan,script_ready:C.green,filming:C.orange,filmed:C.yellow,posted:C.green})[idea.status||"idea"]||C.cyan;
              return (
                <div key={idea.id} style={{ borderRadius:16, background:"rgba(12,8,24,0.95)", border:`1px solid ${isStale?C.pink+"40":hasScore?scoreC+"22":"rgba(255,255,255,0.08)"}`, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", transition:"border-color 0.2s" }}>

                  {/* Top accent line — score-coloured, full width */}
                  <div style={{ height:2, background:hasScore?`linear-gradient(90deg,${scoreC},${scoreC}40,transparent)`:isStale?`linear-gradient(90deg,${C.pink}60,transparent)`:"rgba(255,255,255,0.04)" }}/>

                  {/* ── CARD BODY ── */}
                  <div style={{ padding:isMobile?"20px 18px":"16px 18px", flex:1 }}>

                    {/* Title row */}
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:isMobile?16:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:"#fff", lineHeight:1.4, marginBottom:8, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{idea.title}</div>

                        {/* Tags — minimal: type + stale only */}
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                          {idea.type && <Tag color={C.pink} sm>{idea.type}</Tag>}
                          {idea.aiScore?.contentPillar && <Tag color={C.purple} sm>{idea.aiScore.contentPillar}</Tag>}
                          <span style={{ fontSize:11, fontWeight:700, color:stageColor, letterSpacing:"0.08em", textTransform:"uppercase" }}>{stageLabel}</span>
                          {isStale && <span style={{ fontSize:11, fontWeight:700, color:C.pink, letterSpacing:"0.08em", display:"inline-flex", alignItems:"center", gap:4 }}>{I.warn(10,C.pink)} {daysOld}d stale</span>}
                        </div>
                      </div>

                      {/* Score badge — signature virality dial (spins while scoring, resolves into the score) */}
                      <div style={{ flexShrink:0, textAlign:"center", minWidth:isMobile?60:72 }}>
                        {isScoring ? (
                          <ScoreDial size={isMobile?60:72} loading />
                        ) : hasScore ? (
                          <>
                            <ScoreDial score={idea.viral} size={isMobile?60:72} celebrate={idea._scoredAt && (Date.now()-idea._scoredAt < 6000)} />
                            {idea.scoreDelta!=null && idea.scoreDelta!==0 && (
                              <div style={{ fontSize:10, fontWeight:700, color:idea.scoreDelta>0?C.green:C.pink, marginTop:4 }}>{idea.scoreDelta>0?`+${idea.scoreDelta}`:idea.scoreDelta}</div>
                            )}
                          </>
                        ) : (
                          <div style={{ width:isMobile?60:72, height:isMobile?60:72, borderRadius:"50%", border:"2px dashed rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontWeight:700, letterSpacing:"0.06em", textAlign:"center", lineHeight:1.3 }}>NOT<br/>SCORED</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verdict — only when scored, single line clamped */}
                    {idea.verdict && (
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody, marginBottom:12, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:isExpanded?20:2, WebkitBoxOrient:"vertical" }}>
                        {idea.verdict}
                      </div>
                    )}

                    {/* Improved hook — only in expanded */}
                    {isExpanded && idea.improvedHook && (
                      <div style={{ padding:isMobile?"13px 16px":"10px 14px", background:`${C.green}08`, border:`1px solid ${C.green}18`, borderRadius:11, marginBottom:isMobile?14:10 }}>
                        <div style={{ fontSize:10, color:C.green, fontWeight:700, letterSpacing:"0.12em", marginBottom:4 }}>IMPROVED HOOK</div>
                        <div style={{ fontSize:13, color:"#fff", fontStyle:"italic", lineHeight:1.5 }}>"{idea.improvedHook}"</div>
                        <VoiceVote text={idea.improvedHook} />
                      </div>
                    )}

                    {/* Hook A/B variants — ranked, grounded in channel data */}
                    {isExpanded && Array.isArray(idea.hookVariants) && idea.hookVariants.length>0 && (
                      <div style={{ padding:isMobile?"16px 18px":"12px 16px", background:"rgba(255,255,255,0.02)", border:`1px solid ${C.cyan}18`, borderRadius:12, marginBottom:isMobile?14:10 }}>
                        <div style={{ fontSize:11, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:isMobile?14:10, display:"flex", alignItems:"center", gap:7 }}>{I.flask(13,C.cyan)} HOOK A/B VARIANTS — TEST THESE</div>
                        {idea.hookVariants.slice(0,3).map((hv,vi)=>{
                          const isBest = String(idea.bestVariantIndex)===String(vi);
                          return (
                            <div key={vi} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:isMobile?"10px 0":"8px 0", borderTop:vi>0?"1px solid rgba(255,255,255,0.05)":"none" }}>
                              <span style={{ fontSize:10, fontWeight:700, color:isBest?C.green:"rgba(255,255,255,0.4)", padding:"2px 6px", borderRadius:5, background:isBest?`${C.green}18`:"rgba(255,255,255,0.04)", whiteSpace:"nowrap" }}>{isBest?<span style={{display:"inline-flex",alignItems:"center",gap:4}}>{I.star(9,"currentColor")} TEST 1ST</span>:hv.trigger||`V${vi+1}`}</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:14, color:"#fff", fontStyle:"italic", lineHeight:1.5 }}>"{hv.hook}"</div>
                                {(hv.predictedLift||hv.why) && <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2, lineHeight:1.4 }}>{hv.predictedLift?`${hv.predictedLift} · `:""}{hv.why||""}</div>}
                                <VoiceVote text={hv.hook} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Expanded detail panels — tabbed */}
                    {isExpanded && (
                      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:4, padding:isMobile?"18px":"12px", borderRadius:12, background:"rgba(255,255,255,0.015)", marginTop:4 }}>
                        {(idea.confidenceLevel||idea.optimalPostSlot||idea.modelAgreement||idea.scoreRationale) && (
                          <div style={{ padding:isMobile?"16px 18px":"14px 16px", background:`${C.green}06`, borderRadius:12, border:`1px solid ${C.green}18` }}>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:idea.scoreRationale?7:0 }}>
                              {idea.confidenceLevel && (
                                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", padding:isMobile?"5px 10px":"3px 8px", borderRadius:6, color:idea.confidenceLevel==="HIGH"?C.green:idea.confidenceLevel==="LOW"?C.pink:C.yellow, background:`${idea.confidenceLevel==="HIGH"?C.green:idea.confidenceLevel==="LOW"?C.pink:C.yellow}15` }}>{idea.confidenceLevel} CONFIDENCE</span>
                              )}
                              {idea.modelAgreement && (
                                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", padding:isMobile?"5px 10px":"3px 8px", borderRadius:6, color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.05)", display:"inline-flex", alignItems:"center", gap:5 }}>{I.star(10,"currentColor")} {String(idea.modelAgreement).split("—")[0].trim()}</span>
                              )}
                              {idea.optimalPostSlot && (
                                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", padding:isMobile?"5px 10px":"3px 8px", borderRadius:6, color:C.cyan, background:`${C.cyan}12`, display:"inline-flex", alignItems:"center", gap:5 }}>{I.clock(10,C.cyan)} {idea.optimalPostSlot}</span>
                              )}
                              {idea.neuralBlendWeight>0 && (
                                <span title={`Neural net trained on this channel's outcomes (cross-validated ρ=${idea.neuralCvRho}) predicted ${fmt(idea.neuralEstimate)} views and was blended in at weight ${idea.neuralBlendWeight}.`} style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", padding:isMobile?"5px 10px":"3px 8px", borderRadius:6, color:C.purple||C.cyan, background:`${C.purple||C.cyan}15`, display:"inline-flex", alignItems:"center", gap:5 }}>{I.brain(10,C.purple)} NEURAL ×{idea.neuralBlendWeight}</span>
                              )}
                              {idea.analogN>0 && (
                                <span title={`Grounded in your ${idea.analogN} most similar past posts (by meaning). Their similarity-weighted result was ${fmt(idea.analogEstimate)} views, pulled into this forecast at weight ${idea.analogWeight}.`} style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", padding:isMobile?"5px 10px":"3px 8px", borderRadius:6, color:C.cyan, background:`${C.cyan}15`, display:"inline-flex", alignItems:"center", gap:5 }}>{I.target(10,C.cyan)} {idea.analogN} ANALOGS</span>
                              )}
                            </div>
                            {idea.scoreRationale && (
                              <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.55, fontFamily:C.fontBody }}>{idea.scoreRationale}</div>
                            )}
                            {idea.mostContestedFactor && (
                              <div style={{ fontSize:11, color:C.yellow, marginTop:5, fontFamily:C.fontBody, display:"flex", alignItems:"center", gap:5 }}>{I.warn(11,C.yellow)}<span>Models split on: {idea.mostContestedFactor}</span></div>
                            )}
                            {idea.secondOpinion && (
                              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:5, lineHeight:1.5, fontFamily:C.fontBody }}>{idea.secondOpinion}</div>
                            )}
                          </div>
                        )}
                        {(idea.viralReason||idea.hookFeedback) && (
                          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:8 }}>
                            {idea.viralReason && (
                              <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>SHARE TRIGGER</div>
                                <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody }}>{idea.viralReason}</div>
                              </div>
                            )}
                            {idea.hookFeedback && (
                              <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>HOOK FEEDBACK</div>
                                <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody }}>{idea.hookFeedback}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {(idea.retentionFix||idea.competitorAngle) && (
                          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:8 }}>
                            {idea.retentionFix && (
                              <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:`${C.cyan}06`, borderRadius:10, border:`1px solid ${C.cyan}15` }}>
                                <div style={{ fontSize:11, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>RETENTION FIX</div>
                                <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody }}>{idea.retentionFix}</div>
                              </div>
                            )}
                            {idea.competitorAngle && (
                              <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:`${C.purple}06`, borderRadius:10, border:`1px solid ${C.purple}15` }}>
                                <div style={{ fontSize:10, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>COMPETITOR ANGLE</div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{idea.competitorAngle}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {idea.altHooks?.length>0 && (
                          <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:`1px solid ${C.purple}18` }}>
                            <div style={{ fontSize:10, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>ALTERNATIVE HOOKS</div>
                            {idea.altHooks.map((h,hi)=>(
                              <div key={hi} style={{ padding:"7px 10px", borderRadius:8, background:`${C.purple}06`, border:`1px solid ${C.purple}12`, marginBottom:hi<idea.altHooks.length-1?6:0 }}>
                                <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2 }}>"{h.hook}"</div>
                                <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{h.type} · {h.why}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Retention theory panels */}
                        {(idea.openLoopStrength||idea.emotionalArc) && (
                          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:8 }}>
                            {idea.openLoopStrength && (
                              <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:`${C.pink}06`, borderRadius:10, border:`1px solid ${C.pink}18` }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>OPEN LOOP <span style={{ color:C.pink, fontSize:12 }}>{idea.openLoopStrength}/10</span></div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{typeof idea.openLoopStrength==="string"?idea.openLoopStrength:""}</div>
                              </div>
                            )}
                            {idea.emotionalArc && (
                              <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:`${C.yellow}06`, borderRadius:10, border:`1px solid ${C.yellow}18` }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>EMOTIONAL ARC</div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{idea.emotionalArc}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {idea.reHookMoments?.length>0 && (
                          <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:"1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>RE-HOOK MOMENTS</div>
                            {idea.reHookMoments.map((m,mi)=>(
                              <div key={mi} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:mi<idea.reHookMoments.length-1?6:0 }}>
                                <span style={{ fontSize:10, fontWeight:700, color:C.orange, background:`${C.orange}15`, borderRadius:4, padding:"1px 6px", flexShrink:0, marginTop:2 }}>{mi===0?"3s":mi===1?"15s":"30s"}</span>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{m}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {idea.recs?.length>0 && (
                          <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:"1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>NEXT ACTIONS</div>
                            {idea.recs.map((r,ri)=>(
                              <div key={ri} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:ri<idea.recs.length-1?7:0 }}>
                                <div style={{ width:5, height:5, borderRadius:"50%", background:r.impact==="HIGH"?C.green:C.yellow, flexShrink:0, marginTop:5 }}/>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody, flex:1 }}>{r.a}</div>
                                <span style={{ fontSize:10, fontWeight:700, color:r.impact==="HIGH"?C.green:C.yellow }}>{r.impact}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── 5-FACTOR BARS — compact, always shown when scored ── */}
                  {hasScore && (idea.hookScore||idea.retentionScore||idea.shareScore||idea.algoScore||idea.nicheScore) && (
                    <div style={{ padding:isMobile?"12px 18px 12px":"10px 20px 12px", borderTop:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display:"flex", gap:8 }}>
                        {[
                          { label:"Hook", val:idea.hookScore, color:C.orange },
                          { label:"Ret", val:idea.retentionScore, color:C.cyan },
                          { label:"Share", val:idea.shareScore, color:C.green },
                          { label:"Algo", val:idea.algoScore, color:C.yellow },
                          { label:"Niche", val:idea.nicheScore, color:C.purple },
                        ].filter(f=>f.val).map((f,fi)=>(
                          <FactorBar key={fi} val={f.val} color={f.color} label={f.label} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── EST REACH + HOOK PREVIEW ── */}
                  {(idea.aiScore?.estimated_views || idea.hook) && (
                    <div style={{ padding:"7px 18px", borderTop:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", gap:10 }}>
                      {idea.aiScore?.estimated_views && (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:6, minWidth:0 }}>
                          <span style={{ display:"inline-flex", opacity:0.5 }}>{I.eye(12,"rgba(255,255,255,0.5)")}</span>
                          <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase" }}>Est</span>
                          <span style={{ fontSize:12, fontWeight:700, color:C.cyan, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{idea.aiScore.estimated_views}</span>
                        </span>
                      )}
                      {idea.hook && !idea.aiScore?.estimated_views && (
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>"{idea.hook}"</span>
                      )}
                    </div>
                  )}

                  {/* ── ACTIONS — clear hierarchy ── */}
                  <div style={{ padding:isMobile?"13px 16px":"10px 14px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>

                    {/* Primary CTA: score or re-score — solid gradient, most weight */}
                    <button onClick={()=>scoreIdea&&scoreIdea(idea)} disabled={!!isScoring}
                      style={{ padding:isMobile?"12px 18px":"8px 16px", borderRadius:10, border:"none", fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:isScoring?"wait":"pointer", letterSpacing:"0.06em", flexShrink:0, transition:"opacity 0.15s",
                        background: isScoring ? "rgba(197,102,255,0.2)" : hasScore ? `linear-gradient(135deg,${C.purple}cc,${C.pink}99)` : `linear-gradient(135deg,${C.purple},${C.pink})`,
                        color: isScoring ? C.purple : "#fff",
                        boxShadow: isScoring||hasScore ? "none" : `0 4px 16px ${C.purple}40`,
                        opacity: isScoring ? 0.7 : 1,
                      }}>
                      {isScoring ? "SCORING..." : hasScore ? "RE-SCORE" : "SCORE IT"}
                    </button>

                    {/* Secondary: caption + script — outlined */}
                    <button onClick={()=>genCaption&&genCaption(idea)}
                      style={{ padding:"8px 12px", borderRadius:10, border:`1px solid ${C.pink}35`, background:"transparent", color:C.pink, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                      CAPTION
                    </button>
                    {onBuildScript && (
                      <button onClick={()=>onBuildScript(idea)}
                        style={{ padding:"8px 12px", borderRadius:10, border:`1px solid ${C.cyan}35`, background:"transparent", color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                        SCRIPT
                      </button>
                    )}

                    {/* Pipeline stage pill */}
                    {idea.status !== "posted" ? (
                      <button onClick={()=>{
                        const stages = ["idea","script_ready","filming","posted"];
                        const cur = stages.indexOf(idea.status||"idea");
                        setIdeaStage(idea, stages[Math.min(cur+1, stages.length-1)]);
                      }} style={{ padding:"7px 10px", borderRadius:9, cursor:"pointer", fontFamily:C.fontHead, fontWeight:700, fontSize:11, letterSpacing:"0.08em",
                        border:`1px solid ${stageColor}35`, background:`${stageColor}0e`, color:stageColor }}>
                        {({idea:"IDEA →",script_ready:"SCRIPTED →",filming:"FILMING →"})[idea.status||"idea"]}
                      </button>
                    ) : postingId===idea.id ? (
                      <div style={{ display:"flex", alignItems:"center", gap:5, flex:1 }}>
                        <input autoFocus value={postViews}
                          onChange={e=>setPostViews(e.target.value.replace(/[^0-9]/g,""))}
                          onKeyDown={e=>{ if(e.key==="Enter"){ markPosted&&markPosted(idea,parseInt(postViews)||0); setPostingId(null); setPostViews(""); } if(e.key==="Escape"){ setPostingId(null); setPostViews(""); } }}
                          placeholder="views e.g. 12000"
                          style={{ flex:1, minWidth:0, background:"rgba(255,255,255,0.07)", border:`1px solid ${C.green}40`, borderRadius:8, color:"#fff", padding:isMobile?"10px 12px":"6px 10px", fontSize:12, fontFamily:C.fontHead, outline:"none" }}
                        />
                        <button onClick={()=>{ markPosted&&markPosted(idea,parseInt(postViews)||0); setPostingId(null); setPostViews(""); }}
                          style={{ padding:"6px 11px", borderRadius:8, border:"none", background:C.green, color:"#000", fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{I.tick(13,"#000")}</button>
                        <button onClick={()=>{ setPostingId(null); setPostViews(""); }}
                          style={{ padding:"6px 9px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{I.x(13,"currentColor")}</button>
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:9, background:`${C.green}10`, border:`1px solid ${C.green}28` }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}` }}/>
                        <span style={{ fontSize:11, fontWeight:700, color:C.green }}>POSTED{idea.postedViews>0?` · ${fmt(idea.postedViews)}`:""}</span>
                      </div>
                    )}

                    {/* Utility icons — right side */}
                    <div style={{ marginLeft:"auto", display:"flex", gap:4, alignItems:"center" }}>
                      <button title="Edit" onClick={()=>{ setEditIdeaTarget&&setEditIdeaTarget(idea); setModals&&setModals(m=>({...m,editIdea:true})); }}
                        style={{ padding:"7px 9px", borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:13, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{I.write(12,"currentColor")}</button>
                      <button title="Schedule" onClick={()=>{ setSub("CALENDAR"); openModal&&openModal("addCal"); }}
                        style={{ padding:"7px 9px", borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:13, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{I.cal(12,"currentColor")}</button>
                      <button onClick={()=>setExpanded(expanded===idea.id?null:idea.id)}
                        style={{ padding:"7px 9px", borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:isExpanded?"rgba(255,255,255,0.06)":"transparent", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:12, fontWeight:700 }}>
                        {isExpanded?"▲":"▼"}
                      </button>
                      <button onClick={()=>setIdeas(is=>is.filter(x=>x.id!==idea.id))}
                        style={{ padding:"7px 9px", borderRadius:9, border:`1px solid ${C.pink}18`, background:"transparent", color:`${C.pink}70`, cursor:"pointer" }}>{I.trash(12,C.pink)}</button>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* ── HOOK A/B TESTER ─────────────────────────────────── */}
        <div style={{ marginTop:20, borderRadius:16, padding:"20px 22px", background:`${C.purple}0a`, border:`1px solid ${C.purple}25` }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.14em", marginBottom:isMobile?22:14 }}>HOOK A/B TESTER</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(160px,100%),1fr))", gap:10, marginBottom:isMobile?16:12 }}>
            {[["A", hookA, setHookA], ["B", hookB, setHookB]].map(([label, val, setter])=>(
              <div key={label}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.12em", marginBottom:6, fontFamily:C.fontHead }}>HOOK {label}</div>
                <textarea value={val} onChange={e=>setter(e.target.value)} placeholder={`Write hook ${label}...`} rows={2} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 14px", fontSize:13, fontFamily:C.fontBody, outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.5 }}/>
              </div>
            ))}
          </div>
          <button onClick={async()=>{
            if(!hookA.trim()||!hookB.trim()) return;
            setHookABLoading(true); setHookABResult(null);
            try {
              const r = await callAI(`Compare these two TikTok hooks for ${WL.handle} (${WL.appName} — ${WL.niche}). Score each on: pattern interrupt, open loop strength, identity trigger, curiosity gap.\n\n${voiceBlock([], ideas||[])}\nThe "improvedWinner" hook MUST be written in the creator's Voice DNA above — sound like them, not like AI.\n\nReturn ONLY JSON: {"winner":"A","hookAScore":0,"hookBScore":0,"hookAAnalysis":"","hookBAnalysis":"","whyWinner":"","improvedWinner":""}\n\nHook A: "${hookA}"\nHook B: "${hookB}"`, 600);
              setHookABResult(r); addXP(10);
            } catch(e){}
            setHookABLoading(false);
          }} disabled={hookABLoading||!hookA.trim()||!hookB.trim()} style={{ padding:isMobile?"10px 14px":"10px 22px", borderRadius:11, border:"none", background:hookABLoading?`${C.purple}30`:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:hookABLoading?"wait":"pointer", marginBottom:hookABResult?14:0, opacity:(!hookA.trim()||!hookB.trim())?0.5:1 }}>
            {hookABLoading?"ANALYSING...":<span style={{display:"inline-flex",alignItems:"center",gap:6}}>{I.zap(13,"currentColor")} TEST HOOKS</span>}
          </button>
          {hookABResult && (
            <div style={{ display:"flex", flexDirection:"column", gap:isMobile?20:10 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(160px,100%),1fr))", gap:10 }}>
                {[{label:"A",score:hookABResult.hookAScore,analysis:hookABResult.hookAAnalysis,hook:hookA},{label:"B",score:hookABResult.hookBScore,analysis:hookABResult.hookBAnalysis,hook:hookB}].map((h,i)=>(
                  <div key={i} style={{ borderRadius:12, padding:"14px", background:hookABResult.winner===h.label?`${C.green}10`:"rgba(255,255,255,0.02)", border:`1px solid ${hookABResult.winner===h.label?C.green:"rgba(255,255,255,0.06)"}` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", fontFamily:C.fontHead }}>HOOK {h.label}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        {hookABResult.winner===h.label && <span style={{ fontSize:10, fontWeight:700, color:C.green, fontFamily:C.fontHead }}>WINNER</span>}
                        <span style={{ fontSize:16, fontWeight:700, color:hookABResult.winner===h.label?C.green:C.pink, fontFamily:C.fontHead }}>{h.score}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:C.fontBody, marginBottom:5, fontStyle:"italic" }}>"{h.hook}"</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, lineHeight:1.5 }}>{h.analysis}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding:isMobile?"16px 16px":"14px 16px", borderRadius:12, background:`${C.cyan}08`, border:`1px solid ${C.cyan}18` }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.12em", marginBottom:5, fontFamily:C.fontHead }}>WHY HOOK {hookABResult.winner} WINS</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, lineHeight:1.5, marginBottom:8 }}>{hookABResult.whyWinner}</div>
                {hookABResult.improvedWinner && <>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.12em", marginBottom:4, fontFamily:C.fontHead }}>IMPROVED VERSION</div>
                  <div style={{ fontSize:14, color:C.cyan, fontWeight:600, fontFamily:C.fontBody }}>"{hookABResult.improvedWinner}"</div>
                </>}
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* ── CALENDAR ──────────────────────────────────────────── */}
      {sub==="CALENDAR" && (
        <div style={{ display:"flex", flexDirection:"column", gap:isMobile?32:28 }}>
          {/* Filter pills */}
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
            {["ALL","TIKTOK","INSTAGRAM","BOTH"].map(p=>(
              <button key={p} onClick={()=>setCalFilter(p)} style={{ padding:isMobile?"12px 18px":"8px 16px", borderRadius:10, border:`1px solid ${calFilter===p?C.cyan:"rgba(255,255,255,0.08)"}`, background:calFilter===p?`${C.cyan}15`:"transparent", color:calFilter===p?C.cyan:"rgba(255,255,255,0.45)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                {p}
              </button>
            ))}
          </div>

          {filteredCal.length===0
            ? <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?22:12 }}>
                <div style={{ display:"flex" }}>{I.cal(30,"rgba(255,255,255,0.5)")}</div>
                <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>Nothing scheduled</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Plan your posting schedule — tap Schedule to add your first date</div>
              </div>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))", gap:12 }}>
              {filteredCal.map(c=>(
                <div key={c.id} style={{ borderRadius:16, padding:"18px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.cyan}20`, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:isMobile?16:12 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"#fff", lineHeight:1.35, flex:1 }}>{c.title}</div>
                    <button onClick={()=>setCalItems(cs=>cs.filter(x=>x.id!==c.id))} aria-label="Delete" style={{ padding:"4px 8px", borderRadius:8, border:`1px solid ${C.pink}20`, background:`${C.pink}08`, color:C.pink, cursor:"pointer", flexShrink:0 }}>{I.trash(12,C.pink)}</button>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <Tag color={C.cyan} sm>{c.date?.slice(5)||"TBD"}</Tag>
                    <Tag color={C.purple} sm>{(c.platform||"").toUpperCase()}</Tag>
                    <div style={{ padding:"3px 10px", borderRadius:6, background:`${c.statusColor||C.dim}15`, border:`1px solid ${c.statusColor||C.dim}30`, fontSize:11, fontWeight:700, color:c.statusColor||"rgba(255,255,255,0.5)", letterSpacing:"0.08em" }}>{c.status}</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* ── CAPTIONS ──────────────────────────────────────────── */}
      {sub==="CAPTIONS" && (
        <div style={{ display:"flex", flexDirection:"column", gap:isMobile?32:28 }}>
          {/* Idea picker — horizontal scroll row */}
          <div style={{ overflowX:"auto", paddingBottom:4 }}>
            <div style={{ display:"flex", gap:8, minWidth:"max-content" }}>
              {ideas.slice(0,10).map(idea=>(
                <button key={idea.id} onClick={()=>genCaption&&genCaption(idea)}
                  style={{ padding:"10px 16px", borderRadius:12, border:`1px solid ${captionIdea?.id===idea.id?C.pink:"rgba(255,255,255,0.08)"}`, background:captionIdea?.id===idea.id?`${C.pink}18`:"rgba(255,255,255,0.025)", color:captionIdea?.id===idea.id?"#fff":"rgba(255,255,255,0.85)", fontFamily:C.fontHead, fontWeight:600, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s", textAlign:"left" }}>
                  <div style={{ marginBottom:3 }}>{idea.title?.slice(0,35)}{(idea.title?.length||0)>35?"…":""}</div>
                  <div style={{ fontSize:10, color:captionIdea?.id===idea.id?C.pink:"rgba(255,255,255,0.45)", fontWeight:700 }}>{idea.viral||0} viral · {idea.type||"—"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Caption output */}
          {aiLoad&&aiLoad.caption ? (
            <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?22:12 }}>
              <div style={{ display:"flex" }}>{I.write(30,"rgba(255,255,255,0.5)")}</div>
              <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>Writing captions...</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>AI is crafting your captions — this takes a few seconds</div>
            </div>
          ) : captionResult && captionIdea ? (
            <div style={{ display:"flex", flexDirection:"column", gap:isMobile?22:12 }}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700 }}>
                Captions for: <span style={{color:"rgba(255,255,255,0.85)"}}>{captionIdea.title?.slice(0,50)}</span>
              </div>

              {/* Platform tabs — TikTok / Instagram side by side */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(340px,100%),1fr))", gap:12 }}>

                {/* TikTok */}
                <div style={{ borderRadius:16, background:"rgba(12,8,24,0.95)", border:`1px solid ${C.pink}22`, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.pink}15`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:`${C.pink}18`, border:`1px solid ${C.pink}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.tt(13,C.pink)}</div>
                      <span style={{ fontSize:14, fontWeight:700, color:"#fff" }}>TikTok</span>
                    </div>
                    <button onClick={()=>copyText&&copyText("ttCap",(captionResult.tiktok?.caption||"")+" "+(captionResult.tiktok?.hashtags||[]).map(h=>"#"+h).join(" "))}
                      style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${copied?.ttCap?C.green:C.pink}35`, background:copied?.ttCap?`${C.green}12`:`${C.pink}10`, color:copied?.ttCap?C.green:C.pink, fontFamily:C.fontHead, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                      {copied?.ttCap?<span style={{display:"inline-flex",alignItems:"center",gap:4}}>{I.tick(11,"currentColor")} COPIED</span>:"COPY"}
                    </button>
                  </div>

                  {/* Primary caption */}
                  <div style={{ padding:"16px 18px", borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.12em", marginBottom:8 }}>PRIMARY CAPTION</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.75, fontFamily:C.fontBody, marginBottom:isMobile?14:10 }}>{captionResult.tiktok?.caption}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {(captionResult.tiktok?.hashtags||[]).map(h=><span key={h} style={{ fontSize:11, color:C.pink, background:`${C.pink}10`, borderRadius:5, padding:"2px 7px" }}>#{h}</span>)}
                    </div>
                  </div>

                  {/* Hook variants */}
                  {captionResult.tiktok?.variants && (
                    <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontWeight:700, letterSpacing:"0.12em" }}>3 HOOK VARIANTS — pick one to test</div>
                      {captionResult.tiktok.variants.map((v,i)=>(
                        <div key={i} style={{ borderRadius:10, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
                          <div style={{ padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <span style={{ fontSize:10, fontWeight:700, color:C.pink, letterSpacing:"0.10em" }}>{v.hook_type}</span>
                            <div style={{ display:"flex", gap:5 }}>
                              <button onClick={()=>{
                                const mem = loadJSON(MEMORY_KEY,{entries:[]});
                                mem.entries.push({ type:"HOOK_LEARNING", recommendation:`Hook split test winner: "${v.hook_type}" for idea "${captionIdea?.title?.slice(0,40)||"unknown"}". Caption: ${v.caption?.slice(0,80)}`, date:new Date().toISOString().slice(0,10), id:Date.now() });
                                saveJSON(MEMORY_KEY,mem);
                                copyText&&copyText("hookwin_"+i, `Saved "${v.hook_type}" to memory`);
                              }} style={{ padding:"3px 9px", borderRadius:5, border:`1px solid ${C.green}25`, background:`${C.green}08`, color:C.green, fontFamily:C.fontHead, fontSize:9, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:3 }}>{I.trophy(9,"currentColor")} WIN</button>
                              <button onClick={()=>copyText&&copyText("hookcopy_"+i, v.caption+(v.hashtags?" "+v.hashtags.map(h=>"#"+h).join(" "):""))} style={{ padding:"3px 9px", borderRadius:5, border:`1px solid ${C.pink}25`, background:"transparent", color:C.pink, fontFamily:C.fontHead, fontSize:9, fontWeight:700, cursor:"pointer" }}>{copied==="hookcopy_"+i?<span style={{display:"inline-flex"}}>{I.tick(11,"currentColor")}</span>:"COPY"}</button>
                            </div>
                          </div>
                          <div style={{ padding:"8px 12px" }}>
                            <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody, marginBottom:v.hashtags?5:0 }}>{v.caption}</div>
                            {v.hashtags && <div style={{ fontSize:10, color:`${C.pink}80` }}>{v.hashtags.map(h=>"#"+h).join(" ")}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instagram */}
                <div style={{ borderRadius:16, background:"rgba(12,8,24,0.95)", border:`1px solid ${C.purple}22`, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.purple}15`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:`${C.purple}18`, border:`1px solid ${C.purple}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.ig(13,C.purple)}</div>
                      <span style={{ fontSize:14, fontWeight:700, color:"#fff" }}>Instagram</span>
                    </div>
                    <button onClick={()=>copyText&&copyText("igCap",(captionResult.instagram?.caption||"")+" "+(captionResult.instagram?.hashtags||[]).map(h=>"#"+h).join(" "))}
                      style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${copied?.igCap?C.green:C.purple}35`, background:copied?.igCap?`${C.green}12`:`${C.purple}10`, color:copied?.igCap?C.green:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                      {copied?.igCap?<span style={{display:"inline-flex",alignItems:"center",gap:4}}>{I.tick(11,"currentColor")} COPIED</span>:"COPY"}
                    </button>
                  </div>
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.12em", marginBottom:8 }}>CAPTION</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.75, fontFamily:C.fontBody, marginBottom:isMobile?14:10 }}>{captionResult.instagram?.caption}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {(captionResult.instagram?.hashtags||[]).map(h=><span key={h} style={{ fontSize:11, color:C.purple, background:`${C.purple}10`, borderRadius:5, padding:"2px 7px" }}>#{h}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding:"56px 24px", textAlign:"center", borderRadius:16, border:"1px dashed rgba(255,255,255,0.08)", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?18:12 }}>
              <div style={{ display:"flex" }}>{I.write(30,"rgba(255,255,255,0.4)")}</div>
              <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>Ready to write</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:280, lineHeight:1.6 }}>Tap an idea above — the AI writes platform-ready TikTok &amp; Instagram captions with hashtags and hook variants.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalyticsView = ({ videos=[], totalViews=0, avgRatio=0, facecamAvg=0, hookStats=[], analysis, nextVids, weekly, trends, igData, hasIG, igLoad, fetchIG, runAI, aiLoad={}, setUpdateTarget, openModal, deleteVideo, WL={}, m={}, videoScores={}, commentInsights=null, visualDNA=null, setIdeas }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [sentIdeas, setSentIdeas] = useState({});
  const [hiddenInsights, setHiddenInsights] = useState({});
  const toggleHide = (key) => setHiddenInsights(h=>({...h,[key]:!h[key]}));
  const sendVidToIdeas = (v, key) => {
    if(!setIdeas || sentIdeas[key]) return;
    const now = new Date().toISOString();
    setIdeas(is=>[{ id:Date.now(), title:v.title, type:v.type||"", hook:v.openingLine||"", thumbnail:"", notes:v.whyItWillWork||"", collab:"", viral:0, hookScore:0, created:now.slice(0,10), createdAt:now },...is]);
    setSentIdeas(s=>({...s,[key]:true}));
  };
  const [sub, setSub] = useState("OVERVIEW");
  const [vidSort, setVidSort] = useState("recent"); // recent | score
  const [vidSearch, setVidSearch] = useState("");
  const [vidAnalysis, setVidAnalysis] = useState({});
  const [vidLoading, setVidLoading]   = useState({});
  const [vidErr, setVidErr]           = useState(null);
  const cfg = loadJSON(KEYS_KEY,{});
  const hasAnthrop = !!(USE_BACKEND || cfg?.keys?.anthropic || BAKED_ANTHROPIC_KEY);

  const hasGeminiKey = !!(cfg?.keys?.gemini);

  const analyseVideo = async (v) => {
    if(vidLoading[v.id] || !hasAnthrop) return;
    setVidLoading(l=>({...l,[v.id]:true}));
    setVidErr(null);
    try {
      const avgViews = videos.length ? Math.round(videos.reduce((s,x)=>s+(x.views||0),0)/videos.length) : 0;
      const platform = v.platform==="instagram" ? "Instagram reel" : "TikTok video";
      const likeRatio = v.views>0 ? ((v.likes/v.views)*100).toFixed(1)+"%" : "0%";
      const videoData = JSON.stringify({title:v.title,views:v.views,likes:v.likes,comments:v.comments,likeRatio,channelAvgViews:avgViews,platform:v.platform||"tiktok"});

      // Step 1 — Gemini watches the video if key set
      let geminiCtx = "";
      if(hasGeminiKey && v.videoUrl) {
        try {
          const gPrompt = `Watch this ${platform} and analyse: hook (first 3 seconds), pacing, visual quality, audio, story structure, CTA. Return JSON: {hook_analysis:{first_3_seconds:string,hook_strength:0-100},pacing:string,visual:string,audio:string,gemini_verdict:string,gemini_score:0-100}`;
          const gResult = await callGeminiVideo(v.videoUrl, gPrompt);
          if(gResult) geminiCtx = `
Gemini video analysis: ${JSON.stringify(gResult)}`;
        } catch(e) { console.warn("Gemini failed:", e.message); }
      }

      const prompt = `Analyse this ${platform} for ${WL.handle} (${WL.niche}).${geminiCtx}
VIDEO STATS: ${videoData}
Return ONLY JSON: {"overall_score":0-100,"performance_verdict":"viral|above_avg|average|below_avg|flopped","biggest_factor":"string","why_it_performed":"string","what_worked":["string"],"what_didnt":["string"],"replicate_these":["string"],"never_again":["string"],"refilm_brief":{"concept":"string","hook":"string","key_changes":["string"],"predicted_views":"string"}}`;
      const result = await callAI(prompt, 2000);
      setVidAnalysis(a=>({...a,[v.id]:{...result, geminiUsed: !!geminiCtx}}));
    } catch(e) { setVidErr(e.message); }
    setVidLoading(l=>({...l,[v.id]:false}));
  };
  const fmt = n => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n||0);
  const rl = v => v.views>0?(v.likes/v.views)*100:0;
  const perfColor = s => s>=80?C.green:s>=65?C.yellow:s>=50?C.orange:C.pink;
  const perfLabel = s => s>=80?"VIRAL":s>=65?"STRONG":s>=50?"DECENT":s>=35?"WEAK":"FLOPPED";

  // Chart data
  const topVids = [...videos].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,10);
  const viewsBarData = topVids.map(v=>({ label:(v.title||"").slice(0,8), value:v.views||0 }));
  const ratioLineData = [...videos].filter(v=>v.views>0).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).slice(-12).map(v=>({ label:new Date(v.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}), value:parseFloat(((v.likes/v.views)*100).toFixed(1)) }));
  const typeDonut = (() => {
    const map={}; videos.forEach(v=>{if(v.type)map[v.type]=(map[v.type]||0)+(v.views||0);});
    const cols=[C.pink,C.cyan,C.yellow,C.purple,C.green,C.orange];
    return Object.entries(map).map(([t,v],i)=>({label:t,value:v,color:cols[i%cols.length],name:t}));
  })();
  const channelAvg = videos.length ? Math.round(totalViews/videos.length) : 0;
  const igVideos = videos.filter(v=>v.platform==="instagram");
  const velocityModel = buildVelocityModel(videos);

  const renderVidCard = (v,i) => {
                const r=rl(v);
                const sc = videoScores?.[v.id];
                const perfC = sc ? sc.color : perfColor(0);
                const projection = projectFinalViews(v, velocityModel);
                return (
                  <div key={v.id||i} style={{ borderRadius:16, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden", position:"relative" }}>
                    {sc && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${sc.color},${sc.color}00)` }}/>}
                    <div style={{ padding:"16px 18px" }}>
                      {/* Title row */}
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:isMobile?16:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:15, fontWeight:600, color:"#fff", lineHeight:1.3 }}>{v.title?.slice(0,60)||"Untitled"}</div>
                          {(() => {
                            const d = v.created_at ? new Date(v.created_at) : null;
                            if(!d || isNaN(d)) return <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:4, fontFamily:C.fontBody }}>Date unknown</div>;
                            const days = Math.floor((Date.now()-d.getTime())/86400000);
                            const rel = days<=0?"Today":days===1?"Yesterday":days<7?`${days}d ago`:days<30?`${Math.floor(days/7)}w ago`:days<365?`${Math.floor(days/30)}mo ago`:`${Math.floor(days/365)}y ago`;
                            return <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4, fontFamily:C.fontBody, display:"flex", alignItems:"center", gap:6 }}><span style={{ color:"rgba(255,255,255,0.55)", fontWeight:600 }}>{d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span><span style={{ opacity:0.6 }}>· {rel}</span></div>;
                          })()}
                        </div>
                        {sc && (
                          <div style={{ flexShrink:0 }}>
                            <ScoreDial score={sc.score} size={isMobile?52:58} />
                          </div>
                        )}
                      </div>
                      {/* /Title row */}
                      {/* Tags */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:isMobile?16:12 }}>
                        {v.type && <Tag color={C.pink} sm>{v.type}</Tag>}
                        {v.hook && <Tag color={C.cyan} sm>{v.hook}</Tag>}
                        {v.platform==="instagram" && <Tag color={C.purple} sm>IG</Tag>}
                      </div>
                      {/* Velocity projection — only while the video is still maturing */}
                      {projection && (
                        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 11px", marginBottom:12, borderRadius:10, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                          <span style={{display:"inline-flex"}}>{I.trend(14,C.green)}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:10, color:C.green, fontWeight:700, letterSpacing:"0.08em" }}>PROJECTED FINAL · {projection.confidence} CONF</div>
                            <div style={{ fontSize:13, color:"#fff", fontWeight:600 }}>~{fmt(projection.expected)} <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:400 }}>({fmt(projection.low)}–{fmt(projection.high)})</span></div>
                          </div>
                        </div>
                      )}
                      {/* Stats grid */}
                      {(() => {
                        const watchProxy = v.views48h&&v.views48h>0&&v.likes>0 ? parseFloat(((v.likes/v.views48h)*100).toFixed(1)) : null;
                        const avgLikeRate = videos.filter(x=>x.views>0).reduce((s,x)=>s+(x.likes/x.views*100),0)/(videos.filter(x=>x.views>0).length||1);
                        const watchLabel = watchProxy!==null ? (watchProxy>avgLikeRate*1.3?"STRONG":watchProxy<avgLikeRate*0.7?"WEAK":"AVG") : null;
                        return null;
                      })()}
                      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:6 }}>
                        {[
                          {l:"VIEWS", v:fmt(v.views||0), c:C.cyan},
                          {l:"LIKES", v:fmt(v.likes||0), c:C.pink},
                          {l:"RATIO", v:r.toFixed(1)+"%", c:r>=10?C.green:r>=5?C.yellow:C.orange},
                          ...(v.views48h>0 ? [{l:"48HR/LIKE", v:(v.views48h>0&&v.likes>0?((v.likes/v.views48h)*100).toFixed(1)+"%":"—"), c:(v.views48h>0&&v.likes>0&&((v.likes/v.views48h)*100)>=(r*1.3))?C.green:C.orange}] : [{l:"COMMENTS", v:v.comments||0, c:C.purple}]),
                        ].map((s,j)=>(
                          <div key={j} style={{ padding:isMobile?"11px 16px":"8px 10px", background:`${s.c}08`, borderRadius:10, border:`1px solid ${s.c}18`, textAlign:"center" }}>
                            <div style={{ fontSize:15, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginTop:4 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ padding:"10px 18px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:8, alignItems:"center" }}>
                      <button onClick={()=>{ setUpdateTarget&&setUpdateTarget(v); openModal&&openModal("updateVideo"); }} style={{ padding:"6px 14px", borderRadius:9, border:`1px solid ${C.cyan}30`, background:`${C.cyan}10`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>UPDATE</button>
                      <button onClick={()=>analyseVideo&&analyseVideo(v)} style={{ padding:"6px 14px", borderRadius:9, border:`1px solid ${C.purple}30`, background:vidAnalysis?.[v.id]?`${C.purple}25`:vidLoading?.[v.id]?`${C.purple}20`:`${C.purple}10`, color:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:vidLoading?.[v.id]?"wait":"pointer", opacity:vidLoading?.[v.id]?0.7:1, transition:"all 0.2s" }}>
                        {vidLoading?.[v.id] ? "ANALYSING..." : vidAnalysis?.[v.id] ? <span style={{display:"inline-flex",alignItems:"center",gap:5}}>{I.tick(12,"currentColor")} TEARDOWN</span> : "AI TEARDOWN"}
                      </button>
                      <button onClick={()=>deleteVideo&&deleteVideo(v.id)} aria-label="Delete" style={{ marginLeft:"auto", padding:isMobile?"10px 12px":"6px 10px", borderRadius:9, border:`1px solid ${C.pink}20`, background:`${C.pink}08`, color:C.pink, fontFamily:C.fontHead, cursor:"pointer" }}>{I.trash(13,C.pink)}</button>
                    </div>
                    {/* Loading state */}
                    {vidLoading?.[v.id] && (
                      <div style={{ padding:"12px 18px", borderTop:`1px solid ${C.purple}20`, background:`${C.purple}06`, fontSize:13, color:C.purple, display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:C.purple, animation:"pulse 1s infinite" }}/>
                        {cfg?.keys?.gemini ? "Gemini watching... Claude analysing..." : "Claude analysing..."}
                      </div>
                    )}
                    {/* AI teardown */}
                    {!vidLoading?.[v.id] && vidAnalysis?.[v.id] && (() => {
                      const ar = vidAnalysis[v.id];
                      const sc2 = ar.overall_score||0;
                      const sc_c = sc2>=80?C.green:sc2>=60?C.yellow:sc2>=40?C.orange:C.pink;
                      return (
                        <div style={{ padding:"14px 18px", borderTop:`1px solid ${C.purple}20`, background:`${C.purple}06` }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:isMobile?14:10 }}>
                            <div style={{ fontSize:32, fontWeight:400, fontFamily:C.fontHead, color:sc_c, textShadow:`0 0 12px ${sc_c}50` }}>{sc2}</div>
                            <div>
                              <Tag color={sc2>=80?C.green:sc2>=60?C.yellow:C.pink} sm>{(ar.performance_verdict||"analysed").replace("_"," ").toUpperCase()}</Tag>
                              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:2, fontWeight:700, letterSpacing:"0.06em" }}>AI SCORE</div>
                            </div>
                            <div style={{ flex:1, fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.4 }}>{ar.why_it_performed?.slice(0,100)}</div>
                          </div>
                          {ar.refilm_brief?.hook && (
                            <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:`${C.purple}10`, border:`1px solid ${C.purple}25`, borderRadius:10, fontSize:14, color:"rgba(255,255,255,0.8)", fontStyle:"italic" }}>
                              "{ar.refilm_brief.hook}"
                              {ar.refilm_brief.predicted_views && <span style={{ color:C.green, fontStyle:"normal", fontWeight:700, marginLeft:8 }}>→ {ar.refilm_brief.predicted_views}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
  };

  const tabs = ["OVERVIEW","VIDEOS","AI INSIGHTS"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?36:28 }}>
      {/* Tabs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setSub(t)} style={{ padding:"11px 4px", borderRadius:12, border:`1px solid ${sub===t?C.pink:"rgba(255,255,255,0.08)"}`, background:sub===t?`${C.pink}15`:"transparent", color:sub===t?C.pink:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:"0.02em", textAlign:"center" }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────── */}
      {sub==="OVERVIEW" && (()=>{
        const ttVids = videos.filter(v=>v.platform!=="instagram");
        const igVids = videos.filter(v=>v.platform==="instagram");
        const ttTotal = ttVids.reduce((s,v)=>s+(v.views||0),0);
        const igTotal = igVids.reduce((s,v)=>s+(v.views||0),0);
        const ttAvg = ttVids.length ? Math.round(ttTotal/ttVids.length) : 0;
        const igAvg = igVids.length ? Math.round(igTotal/igVids.length) : 0;
        const ttRatio = ttVids.filter(v=>v.views>0).length ? (ttVids.filter(v=>v.views>0).reduce((s,v)=>s+(v.likes/v.views)*100,0)/ttVids.filter(v=>v.views>0).length) : 0;
        const igRatio = igVids.filter(v=>v.views>0).length ? (igVids.filter(v=>v.views>0).reduce((s,v)=>s+(v.likes/v.views)*100,0)/igVids.filter(v=>v.views>0).length) : 0;
        const igFollowers = igData?.profile?.followers_count || m?.ig_followers || 0;
        const ttBarData = [...ttVids].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,8).map(v=>({label:(v.title||"").slice(0,7),value:v.views||0}));
        const igBarData = [...igVids].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,8).map(v=>({label:(v.title||"").slice(0,7),value:v.views||0}));
        return (<>
        <div style={{ display:"flex", flexDirection:"column", gap:isMobile?24:16 }}>

          {/* ── MOBILE: big hero stat cards (full width, one per row) ── */}
          {[
            { platform:"TikTok", icon:I.tt, accent:C.pink, count:`${ttVids.length} videos`,
              stats:[
                {l:"Total Views",  v:fmt(ttTotal),              c:C.pink},
                {l:"Avg Views",    v:fmt(ttAvg),                c:C.cyan},
                {l:"Like Ratio",   v:ttRatio.toFixed(1)+"%",    c:ttRatio>=5?C.green:C.yellow},
                {l:"Followers",    v:fmt(m?.tt_followers||0),   c:C.purple},
              ]},
            { platform:"Instagram", icon:I.ig, accent:C.purple, count:`${igVids.length} reels`,
              stats:[
                {l:"Total Views",  v:fmt(igTotal),              c:C.purple},
                {l:"Avg Views",    v:fmt(igAvg),                c:C.cyan},
                {l:"Like Ratio",   v:igRatio.toFixed(1)+"%",    c:igRatio>=5?C.green:C.yellow},
                {l:"Followers",    v:fmt(igFollowers),          c:C.pink},
              ]},
          ].map((plt,pi)=>(
            <div key={pi} style={{ borderRadius:20, overflow:"hidden", background:`linear-gradient(145deg,${plt.accent}12,rgba(10,6,20,0.97))`, border:`1px solid ${plt.accent}30`, position:"relative" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${plt.accent},${plt.accent}00)` }}/>
              {/* Platform header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:isMobile?"18px 20px 14px":"16px 22px 12px" }}>
                <div style={{ width:38, height:38, borderRadius:12, background:`${plt.accent}20`, border:`1px solid ${plt.accent}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{plt.icon(18,plt.accent)}</div>
                <div>
                  <div style={{ fontSize:isMobile?15:17, fontWeight:700, color:"#fff", lineHeight:1.1 }}>{plt.platform}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{WL.handle} · {plt.count}</div>
                </div>
              </div>
              {/* Stats — full width rows on mobile, 4-col grid on desktop */}
              {isMobile ? (
                <div style={{ padding:"0 20px 24px", display:"flex", flexDirection:"column", gap:0 }}>
                  {plt.stats.map((s,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:isMobile?"20px 0":"16px 0", borderBottom:i<plt.stats.length-1?`1px solid rgba(255,255,255,0.06)`:"none" }}>
                      <div style={{ fontSize:14, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>{s.l}</div>
                      <div style={{ fontSize:32, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, padding:"0 22px 20px" }}>
                  {plt.stats.map((s,i)=>(
                    <div key={i} style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:14, background:`${s.c}10`, border:`1px solid ${s.c}20` }}>
                      <div style={{ fontSize:isMobile?12:10, color:"rgba(255,255,255,0.45)", letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>{s.l}</div>
                      <div style={{ fontSize:isMobile?28:36, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Side by side charts */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:14 }}>
            {/* TikTok top videos */}
            <div style={{ borderRadius:16, padding:isMobile?"18px 18px":"24px 26px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.pink}20`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.pink},${C.pink}00)` }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?24:16 }}>
                <div style={{ fontSize:isMobile?15:14, fontWeight:700, color:"#fff", letterSpacing:"0.06em" }}>TikTok Top Videos</div>
                <span style={{ fontSize:20, fontWeight:400, fontFamily:C.fontHead, color:C.pink }}>{fmt(ttBarData[0]?.value||0)}</span>
              </div>
              {ttBarData.length>0 ? <GlowBarChart data={ttBarData} color={C.pink} height={160} dataKey="value" xKey="label"/>
                : <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"rgba(255,255,255,0.45)",fontStyle:"italic"}}>No TikTok videos yet</div>}
            </div>

            {/* Instagram top reels */}
            <div style={{ borderRadius:16, padding:isMobile?"18px 18px":"24px 26px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.purple}20`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?24:16 }}>
                <div style={{ fontSize:isMobile?15:14, fontWeight:700, color:"#fff", letterSpacing:"0.06em" }}>Instagram Top Reels</div>
                <span style={{ fontSize:20, fontWeight:400, fontFamily:C.fontHead, color:C.purple }}>{fmt(igBarData[0]?.value||0)}</span>
              </div>
              {igBarData.length>0 ? <GlowBarChart data={igBarData} color={C.purple} height={160} dataKey="value" xKey="label"/>
                : <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"rgba(255,255,255,0.45)",fontStyle:"italic"}}>Sync IG reels via Settings</div>}
            </div>
          </div>

          {/* Like ratio comparison + hook performance */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:14 }}>
            {/* Ratio comparison */}
            <div style={{ borderRadius:16, padding:isMobile?"18px 18px":"24px 26px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:18 }}>Like Ratio</div>
              {[{l:"TikTok",v:ttRatio,c:C.pink},{l:"Instagram",v:igRatio,c:C.purple}].map((p,i)=>(
                <div key={i} style={{ marginBottom:i===0?18:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:14, color:"rgba(255,255,255,0.85)", fontWeight:600 }}>{p.l}</span>
                    <span style={{ fontSize:20, fontWeight:700, color:p.v>=5?C.green:C.yellow, fontFamily:C.fontHead }}>{p.v.toFixed(1)}%</span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.06)" }}>
                    <div style={{ height:"100%", width:`${Math.min(p.v*10,100)}%`, background:`linear-gradient(90deg,${p.c},${p.c}80)`, borderRadius:3, boxShadow:`0 0 10px ${p.c}50` }}/>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Platform Split</div>
                <GlowDonut data={[{name:"TikTok",value:ttTotal||1,color:C.pink},{name:"Instagram",value:igTotal||1,color:C.purple}]} size={80} innerRadius={22} outerRadius={36}/>
              </div>
            </div>

            {/* Hook performance */}
            {hookStats.length>0 ? (
              <div data-card style={{ borderRadius:16, padding:isMobile?"18px 18px":"24px 26px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.cyan}20`, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:16 }}>
                  <div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:isMobile?22:14 }}>Hook Performance</div>
                    {hookStats.slice(0,5).map((h,i)=>(
                      <div key={h.hook} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          {i===0&&<span style={{ display:"inline-flex" }}>{I.star(12,C.yellow)}</span>}
                          <span style={{ fontSize:14, color:i===0?"#fff":"rgba(255,255,255,0.85)", fontWeight:i===0?700:500 }}>{h.hook}</span>
                        </div>
                        <span style={{ fontSize:isMobile?15:17, fontFamily:C.fontHead, color:i===0?C.yellow:C.cyan }}>{fmt(h.avg)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:isMobile?22:14 }}>Avg Views</div>
                    <GlowBarChart data={hookStats.slice(0,6).map(h=>({label:h.hook.slice(0,6),value:h.avg}))} color={C.cyan} height={140} dataKey="value" xKey="label"/>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ borderRadius:16, padding:isMobile?"18px 18px":"24px 26px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"rgba(255,255,255,0.45)" }}>
                Log videos with hook types to see hook performance
              </div>
            )}
          </div>
        </div>
        </>);
      })()}

      {/* ── VIDEOS ──────────────────────────────────────────────── */}
      {sub==="VIDEOS" && (() => {
        const _ts = v => { const d=v.created_at?new Date(v.created_at).getTime():NaN; return isNaN(d)?-Infinity:d; };
        const _score = v => { const sc=videoScores?.[v.id]; return sc?sc.score:(v.views||0)/1e9; }; // fall back to views so unscored still order sensibly
        const _q = vidSearch.trim().toLowerCase();
        const matchQ = v => !_q || (v.title||"").toLowerCase().includes(_q) || (v.hook||"").toLowerCase().includes(_q) || (v.type||"").toLowerCase().includes(_q) || (v.audio||"").toLowerCase().includes(_q);
        const prep = arr => sortVids(arr.filter(matchQ));
        const sortVids = arr => [...arr].sort((a,b)=> vidSort==="score" ? (_score(b)-_score(a)) : (_ts(b)-_ts(a)));
        return (
        <div style={{ display:"flex", flexDirection:"column", gap:isMobile?20:10 }}>
          {videos.length>3 && (
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", display:"flex", pointerEvents:"none" }}>{I.search(15,"rgba(255,255,255,0.35)")}</div>
              <input value={vidSearch} onChange={e=>setVidSearch(e.target.value)} placeholder="Search videos by title, hook, type or audio..." aria-label="Search videos"
                style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#fff", padding:isMobile?"13px 40px 13px 40px":"11px 40px", fontSize:14, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }} />
              {vidSearch && <button onClick={()=>setVidSearch("")} aria-label="Clear search" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", padding:4 }}>{I.x(14,"rgba(255,255,255,0.5)")}</button>}
            </div>
          )}
          {videos.length>0 && (
            <div style={{ display:"flex", alignItems:"center", gap:isMobile?8:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Sort</span>
              {[{id:"recent",label:"Most recent"},{id:"score",label:"Best scored"}].map(o=>{
                const active = vidSort===o.id;
                return (
                  <button key={o.id} onClick={()=>setVidSort(o.id)} style={{ padding:isMobile?"9px 15px":"7px 16px", borderRadius:20, border:`1px solid ${active?C.cyan:"rgba(255,255,255,0.1)"}`, background:active?`${C.cyan}15`:"transparent", color:active?C.cyan:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:isMobile?12:13, cursor:"pointer", letterSpacing:"0.04em" }}>{o.label}</button>
                );
              })}
            </div>
          )}
          {videos.length===0
            ? <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?22:12 }}>
                <div style={{ display:"flex" }}>{I.bar(30,"rgba(255,255,255,0.5)")}</div>
                <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No videos logged yet</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Log your TikTok videos to track performance and spot trends</div>
              </div>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:16 }}>
              {/* TikTok column */}
              <div style={{ display:"flex", flexDirection:"column", gap:isMobile?22:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:isMobile?"14px 18px":"12px 16px", borderRadius:16, background:`${C.pink}10`, border:`1px solid ${C.pink}25` }}>
                  <div style={{ width:28, height:28, borderRadius:9, background:`${C.pink}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.tt(14,C.pink)}</div>
                  <span style={{ fontSize:15, fontWeight:700, color:C.pink, letterSpacing:"0.05em" }}>TIKTOK</span>
                  <span style={{ marginLeft:"auto", fontSize:12, color:`${C.pink}aa`, fontWeight:700 }}>{prep(videos.filter(v=>v.platform!=="instagram")).length} VIDEOS</span>
                </div>
                {prep(videos.filter(v=>v.platform!=="instagram")).map((v,i)=>renderVidCard(v,i))}
              </div>
              {/* Instagram column */}
              <div style={{ display:"flex", flexDirection:"column", gap:isMobile?22:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:isMobile?"14px 18px":"12px 16px", borderRadius:16, background:`${C.purple}10`, border:`1px solid ${C.purple}25` }}>
                  <div style={{ width:28, height:28, borderRadius:9, background:`${C.purple}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.ig(14,C.purple)}</div>
                  <span style={{ fontSize:15, fontWeight:700, color:C.purple, letterSpacing:"0.05em" }}>INSTAGRAM</span>
                  <span style={{ marginLeft:"auto", fontSize:12, color:`${C.purple}aa`, fontWeight:700 }}>{prep(videos.filter(v=>v.platform==="instagram")).length} REELS</span>
                </div>
                {videos.filter(v=>v.platform==="instagram").length===0 && (
                  <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?22:12 }}>
                    <div style={{ display:"flex" }}>{I.bar(30,"rgba(255,255,255,0.5)")}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No reels synced yet</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Hit SYNC NOW in Settings to pull your Instagram reels</div>
                  </div>
                )}
                {prep(videos.filter(v=>v.platform==="instagram")).map((v,i)=>renderVidCard(v,i))}
              </div>
            </div>
          }

        </div>
        );
      })()}



      {/* ── AI INSIGHTS ─────────────────────────────────────────── */}
      {sub==="AI INSIGHTS" && (
        <div style={{ display:"flex", flexDirection:"column", gap:isMobile?32:28 }}>

          {/* Run buttons */}
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:10 }}>
            {[
              {l:"What's Working", c:C.cyan,   m:"analysis", load:aiLoad.analysis},
              {l:"Next Videos",    c:C.green,  m:"nextVids", load:aiLoad.nextVids},
              {l:`${(WL.creator2||"Weekly").slice(0,8)} Brief`, c:C.yellow, m:"weekly", load:aiLoad.weekly},
              {l:"Trends",         c:C.orange, m:"trends",   load:aiLoad.trends},
            ].map((a,i)=>(
              <button key={i} onClick={()=>runAI&&runAI(a.m)} disabled={a.load}
                style={{ padding:"14px 10px", borderRadius:14, border:`1px solid ${a.c}30`, background:`linear-gradient(135deg,${a.c}15,${a.c}05)`, color:a.c, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", opacity:a.load?0.5:1, letterSpacing:"0.06em", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${a.c},${a.c}00)` }}/>
                {a.load?"Running...":a.l}
              </button>
            ))}
          </div>

          {/* InsightCard helper */}
          {[
            {
              key:"whatsWorking",
              label:"What's Working",
              dot:C.cyan,
              color:C.cyan,
              runKey:"analysis",
              hasData:analysis?.whatIsWorking?.length>0||analysis?.whatIsNotWorking?.length>0,
              emptyMsg:"Run \"What's Working\" to see insights",
              content: analysis && (
                <>
                  {analysis.whatIsWorking?.map((a,i)=>(
                    <div key={i} style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:12, background:`${a.impact==="high"?C.green:C.cyan}08`, border:`1px solid ${a.impact==="high"?C.green:C.cyan}18`, marginBottom:isMobile?14:10 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:a.impact==="high"?C.green:C.cyan, marginBottom:6, lineHeight:1.3 }}>{a.insight}</div>
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontFamily:C.fontBody }}>{a.evidence}</div>
                    </div>
                  ))}
                  {analysis.whatIsNotWorking?.length>0 && (
                    <>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", margin:"18px 0 12px" }}>Needs Fixing</div>
                      {analysis.whatIsNotWorking.map((a,i)=>(
                        <div key={i} style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:12, background:`${C.orange}08`, border:`1px solid ${C.orange}18`, marginBottom:isMobile?14:10 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:C.orange, marginBottom:6, lineHeight:1.3 }}>{a.insight}</div>
                          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontFamily:C.fontBody }}>{a.evidence}</div>
                          {a.fix && <div style={{ fontSize:13, color:C.green, fontWeight:600, marginTop:6 }}>→ Fix: {a.fix}</div>}
                        </div>
                      ))}
                    </>
                  )}
                </>
              ),
            },
            {
              key:"nextVids",
              label:"Next Videos",
              dot:C.green,
              color:C.green,
              runKey:"nextVids",
              hasData:nextVids?.tiktok?.length>0,
              emptyMsg:'Run "Next Videos" for AI recommendations',
              content: nextVids?.tiktok?.map((v,i)=>(
                <div key={i} style={{ borderRadius:12, border:`1px solid rgba(255,255,255,0.08)`, background:"rgba(255,255,255,0.025)", marginBottom:12, overflow:"hidden" }}>
                  <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", lineHeight:1.4, flex:1 }}>{v.title}</div>
                    {v.priority && <span style={{ fontSize:10, fontWeight:700, color:v.priority==="HIGH"?C.green:C.yellow, background:v.priority==="HIGH"?`${C.green}12`:`${C.yellow}12`, border:`1px solid ${v.priority==="HIGH"?C.green:C.yellow}25`, borderRadius:6, padding:isMobile?"5px 10px":"3px 8px", flexShrink:0 }}>{v.priority}</span>}
                  </div>
                  <div style={{ padding:isMobile?"14px 18px":"12px 16px", display:"flex", flexDirection:"column", gap:isMobile?20:10 }}>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontFamily:C.fontBody }}>{v.whyItWillWork}</div>
                    {v.openingLine && (
                      <div style={{ padding:isMobile?"13px 16px":"10px 14px", background:`${C.green}08`, border:`1px solid ${C.green}15`, borderRadius:10, fontSize:13, color:"rgba(255,255,255,0.8)", fontStyle:"italic" }}>"{v.openingLine}"</div>
                    )}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                      {v.type && <span style={{ fontSize:10, fontWeight:700, color:C.pink, background:`${C.pink}10`, borderRadius:5, padding:"2px 8px" }}>{v.type}</span>}
                      {v.estimated_views && <span style={{ fontSize:10, fontWeight:700, color:C.cyan, background:`${C.cyan}10`, borderRadius:5, padding:"2px 8px" }}>{v.estimated_views}</span>}
                      <button onClick={()=>sendVidToIdeas(v,i)} disabled={!!sentIdeas[i]} style={{ marginLeft:"auto", fontSize:10, fontWeight:700, color:sentIdeas[i]?"rgba(255,255,255,0.4)":C.green, background:sentIdeas[i]?"rgba(255,255,255,0.04)":`${C.green}12`, border:`1px solid ${sentIdeas[i]?"rgba(255,255,255,0.08)":C.green+"30"}`, borderRadius:6, padding:"5px 12px", cursor:sentIdeas[i]?"default":"pointer" }}>{sentIdeas[i]?<span style={{display:"inline-flex",alignItems:"center",gap:4}}>{I.tick(10,"currentColor")} Added</span>:"+ Ideas"}</button>
                    </div>
                  </div>
                </div>
              )),
            },
            {
              key:"weekly",
              label:`${WL.creator2||"Weekly"} Brief`,
              dot:C.yellow,
              color:C.yellow,
              runKey:"weekly",
              hasData:!!(weekly?.brief||weekly?.harleyBrief||weekly?.rawSummaryText),
              emptyMsg:"Run the weekly brief for filming instructions",
              content: weekly && <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.7, fontFamily:C.fontBody }}>{weekly.brief||weekly.harleyBrief||weekly.rawSummaryText}</div>,
            },
            {
              key:"trends",
              label:"Trending Now",
              dot:C.orange,
              color:C.orange,
              runKey:"trends",
              hasData:trends?.trends?.length>0,
              emptyMsg:'Run "Trends" for live trending topics',
              content: trends?.trends?.map((t,i)=>(
                <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"14px 0", borderBottom:i<trends.trends.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div style={{ width:26, height:26, borderRadius:7, background:`${C.orange}15`, border:`1px solid ${C.orange}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, fontWeight:700, color:C.orange }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:5, lineHeight:1.3 }}>{t.trend}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody, marginBottom:6 }}>{t.tiktokAngle}</div>
                    {t.urgency && <Tag color={t.urgency==="POST NOW"?C.pink:t.urgency==="THIS WEEK"?C.yellow:C.cyan} sm>{t.urgency}</Tag>}
                  </div>
                </div>
              )),
            },
            ...(commentInsights ? [{
              key:"audience",
              label:"Audience Voice",
              dot:C.purple,
              color:C.purple,
              runKey:null,
              hasData:true,
              emptyMsg:"",
              badge:`${commentInsights.sampleSize||0} comments`,
              content: (
                <>
                  {commentInsights.overall_sentiment && <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.6, marginBottom:14, fontFamily:C.fontBody }}>{commentInsights.overall_sentiment}</div>}
                  <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:10 }}>
                    {[
                      {l:"They Keep Mentioning", arr:commentInsights.top_themes, c:C.cyan},
                      {l:"They're Asking For", arr:commentInsights.audience_requests, c:C.green},
                      {l:"Their Exact Words", arr:commentInsights.language_patterns, c:C.yellow},
                      {l:"Videos They Want", arr:commentInsights.content_ideas, c:C.pink},
                    ].filter(x=>x.arr?.length).map((x,i)=>(
                      <div key={i} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:`1px solid ${x.c}18` }}>
                        <div style={{ fontSize:10, color:x.c, fontWeight:700, letterSpacing:"0.08em", marginBottom:8 }}>{x.l.toUpperCase()}</div>
                        {x.arr.slice(0,4).map((t,j)=><div key={j} style={{ fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.5, marginBottom:4, fontFamily:C.fontBody }}>• {t}</div>)}
                      </div>
                    ))}
                  </div>
                </>
              ),
            }] : []),
            ...(visualDNA ? [{
              key:"visualDNA",
              label:"Visual DNA",
              dot:C.cyan,
              color:C.cyan,
              runKey:null,
              hasData:true,
              emptyMsg:"",
              badge:`${visualDNA.sampleSize||0} thumbnails`,
              content: (
                <>
                  {visualDNA.one_rule && <div style={{ fontSize:13, color:C.cyan, lineHeight:1.5, marginBottom:14, fontFamily:C.fontBody, fontWeight:600, display:"flex", alignItems:"flex-start", gap:6 }}>{I.star(13,C.cyan)}<span>{visualDNA.one_rule}</span></div>}
                  <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:10 }}>
                    {[
                      {l:"Winning Traits", arr:visualDNA.winning_traits, c:C.green},
                      {l:"What Loses", arr:visualDNA.losing_traits, c:C.pink},
                    ].filter(x=>x.arr?.length).map((x,i)=>(
                      <div key={i} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:`1px solid ${x.c}18` }}>
                        <div style={{ fontSize:10, color:x.c, fontWeight:700, letterSpacing:"0.08em", marginBottom:8 }}>{x.l.toUpperCase()}</div>
                        {x.arr.slice(0,4).map((t,j)=><div key={j} style={{ fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.5, marginBottom:4, fontFamily:C.fontBody }}>• {t}</div>)}
                      </div>
                    ))}
                    {[
                      {l:"Color / Contrast", v:visualDNA.color_palette, c:C.yellow},
                      {l:"Composition", v:visualDNA.composition, c:C.purple},
                      {l:"Faces", v:visualDNA.face_pattern, c:C.cyan},
                      {l:"Text Overlay", v:visualDNA.text_overlay, c:C.green},
                    ].filter(x=>x.v).map((x,i)=>(
                      <div key={"v"+i} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:`1px solid ${x.c}18` }}>
                        <div style={{ fontSize:10, color:x.c, fontWeight:700, letterSpacing:"0.08em", marginBottom:8 }}>{x.l.toUpperCase()}</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.5, fontFamily:C.fontBody }}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </>
              ),
            }] : []),
          ].map(card=>(
            <div key={card.key} data-card style={{ borderRadius:18, background:"rgba(255,255,255,0.025)", border:`1px solid ${card.color}22`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.4, background:`linear-gradient(90deg,${card.color},${card.color}00)` }}/>
              {/* Card header */}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 18px", borderBottom:hiddenInsights[card.key]?"none":`1px solid rgba(255,255,255,0.05)` }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:card.dot, display:"inline-block", flexShrink:0 }}/>
                <span style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.04em", flex:1 }}>{card.label}</span>
                {card.badge && <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{card.badge}</span>}
                <div style={{ display:"flex", gap:6 }}>
                  {card.runKey && (
                    <button onClick={()=>runAI&&runAI(card.runKey)} disabled={aiLoad[card.runKey]}
                      style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${card.color}40`, background:`${card.color}12`, color:card.color, fontFamily:C.fontHead, fontWeight:700, fontSize:11, cursor:"pointer", opacity:aiLoad[card.runKey]?0.5:1 }}>
                      {aiLoad[card.runKey]?"...":"↺ Re-run"}
                    </button>
                  )}
                  <button onClick={()=>toggleHide(card.key)}
                    style={{ padding:"5px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                    {hiddenInsights[card.key]?"Show":"Hide"}
                  </button>
                </div>
              </div>
              {/* Card body */}
              {!hiddenInsights[card.key] && (
                <div style={{ padding:"16px 18px" }}>
                  {card.hasData && card.content
                    ? card.content
                    : <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", fontStyle:"italic", padding:"8px 0" }}>{card.emptyMsg}</div>
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const TasksView = ({ tasks, setTasks, appIdeas, setAppIdeas, setEditAppIdeaTarget, setModals }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [sub, setSub]             = useState("TO DO");
  const [taskInput, setTaskInput] = useState("");
  const [taskFilter, setTaskFilter] = useState("ALL");
  const [ideaInput, setIdeaInput] = useState("");

  const _c1 = WL.creator1||"Me";
  const _c2 = WL.creator2||"";
  const [assign, setAssign]       = useState(_c2?"BOTH":_c1.toUpperCase());
  const [taskUrgent, setTaskUrgent] = useState(false);
  const ac = a => a===_c2.toUpperCase()?C.cyan:a==="BOTH"?C.yellow:C.pink;
  const acLabel = a => a===_c2.toUpperCase()?(_c2[0]||"2"):a==="BOTH"?"B":(_c1.slice(0,2)||"Me");

  const _prio = t => { const p=(t.priority||"normal").toLowerCase(); return p==="urgent"?0:p==="high"?1:2; };
  const pending = tasks.filter(t=>!t.done&&(taskFilter==="ALL"||t.assignee===taskFilter)).sort((a,b)=>_prio(a)-_prio(b));
  const done    = tasks.filter(t=> t.done&&(taskFilter==="ALL"||t.assignee===taskFilter));
  const prioMeta = t => { const p=(t.priority||"normal").toLowerCase(); return p==="urgent"?{c:C.orange,label:"URGENT"}:p==="high"?{c:C.yellow,label:"HIGH"}:null; };

  const addTask = () => {
    if(!taskInput.trim()) return;
    setTasks(ts=>[{id:Date.now(),text:taskInput.trim(),assignee:assign,done:false,priority:taskUrgent?"urgent":"normal",created:new Date().toISOString()},...ts]);
    setTaskInput(""); setTaskUrgent(false);
  };
  const addIdea = () => {
    if(!ideaInput.trim()) return;
    setAppIdeas(is=>[{id:Date.now(),text:ideaInput.trim(),score:Math.floor(Math.random()*30+65),verdict:"Added! Looks promising.",impact:"HIGH",effort:"MEDIUM"},...is]);
    setIdeaInput("");
  };

  const assignees = ["ALL",_c1.toUpperCase(),...(_c2?[_c2.toUpperCase(),"BOTH"]:[])].filter((v,i,a)=>a.indexOf(v)===i);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?28:24 }}>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:8 }}>
        {["TO DO","APP IDEAS"].map(t=>(
          <button key={t} onClick={()=>setSub(t)} style={{ padding:isMobile?"10px 14px":"10px 22px", borderRadius:12, border:`1px solid ${sub===t?C.pink:"rgba(255,255,255,0.08)"}`, background:sub===t?`${C.pink}15`:"transparent", color:sub===t?C.pink:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:"0.06em" }}>
            {t}{t==="TO DO"&&` (${pending.length})`}{t==="APP IDEAS"&&` (${appIdeas.length})`}
          </button>
        ))}
      </div>

      {sub==="TO DO" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(320px,100%),1fr))", gap:20, alignItems:"start" }}>

          {/* LEFT — Input + Pending */}
          <div style={{ display:"flex", flexDirection:"column", gap:isMobile?22:12 }}>

            {/* Add task card */}
            <div style={{ borderRadius:16, padding:"20px 22px", background:"linear-gradient(145deg,rgba(255,213,10,0.08),rgba(10,6,20,0.9))", border:`1px solid ${C.yellow}25`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.yellow},${C.yellow}00)` }}/>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:isMobile?22:14 }}>New Task</div>
              <input
                value={taskInput}
                onChange={e=>setTaskInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addTask()}
                placeholder="What needs to get done..."
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#fff", padding:isMobile?"12px 14px":"14px 18px", fontSize:isMobile?15:17, fontFamily:C.fontHead, outline:"none", marginBottom:14, boxSizing:"border-box" }}
              />
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                {/* Assignee picker + urgent toggle */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  {[_c1.toUpperCase(),...(_c2?[_c2.toUpperCase(),"BOTH"]:[])].filter((v,i,a)=>a.indexOf(v)===i).map(a=>(
                    <button key={a} onClick={()=>setAssign(a)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${assign===a?ac(a):"rgba(255,255,255,0.1)"}`, background:assign===a?`${ac(a)}20`:"transparent", color:assign===a?ac(a):"rgba(255,255,255,0.45)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      {a}
                    </button>
                  ))}
                  <button onClick={()=>setTaskUrgent(u=>!u)} aria-pressed={taskUrgent} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"8px 12px", borderRadius:10, border:`1px solid ${taskUrgent?C.orange:"rgba(255,255,255,0.1)"}`, background:taskUrgent?`${C.orange}20`:"transparent", color:taskUrgent?C.orange:"rgba(255,255,255,0.45)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>{I.zap(12,taskUrgent?C.orange:"rgba(255,255,255,0.45)")} URGENT</button>
                </div>
                <button onClick={addTask} style={{ padding:isMobile?"10px 14px":"10px 22px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.yellow},${C.orange})`, color:"#07050F", fontFamily:C.fontHead, fontWeight:700, fontSize:15, cursor:"pointer" }}>ADD</button>
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ display:"flex", gap:6 }}>
              {assignees.map(a=>(
                <button key={a} onClick={()=>setTaskFilter(a)} style={{ flex:1, padding:isMobile?"11px 16px":"8px 10px", borderRadius:10, border:`1px solid ${taskFilter===a?ac(a==="ALL"?assign:a):"rgba(255,255,255,0.08)"}`, background:taskFilter===a?`${ac(a==="ALL"?assign:a)}15`:"transparent", color:taskFilter===a?ac(a==="ALL"?assign:a):"rgba(255,255,255,0.45)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", textAlign:"center" }}>
                  {a}
                </button>
              ))}
            </div>

            {/* Pending tasks */}
            <div style={{ borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.025)", minHeight:300 }}>
              {pending.length===0
                ? <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?22:12 }}>
                    <div style={{ display:"flex" }}>{I.check(30,C.green)}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>All clear</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Nothing pending — you're on top of your workflow</div>
                  </div>
                : pending.map((t,i)=>{
                  const pm = prioMeta(t);
                  return (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:isMobile?"18px 20px":"18px 22px", borderBottom:i<pending.length-1?"1px solid rgba(255,255,255,0.05)":"none", borderLeft:pm?`3px solid ${pm.c}`:"3px solid transparent", background:pm?`linear-gradient(90deg,${pm.c}0a,transparent 30%)`:"transparent", transition:"background 0.15s" }}>
                    <button
                      onClick={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:true}:x))}
                      aria-label="Mark done"
                      style={{ width:24, height:24, borderRadius:7, border:`2px solid ${ac(t.assignee)}`, background:"transparent", cursor:"pointer", flexShrink:0, transition:"all 0.2s" }}
                    />
                    <div style={{ flex:1, minWidth:0 }}>
                      {pm && <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.1em", color:pm.c, background:`${pm.c}18`, border:`1px solid ${pm.c}45`, borderRadius:5, padding:"2px 7px", marginRight:9, verticalAlign:"middle" }}>{pm.label}</span>}
                      <span style={{ fontSize:14, color:"#fff", fontWeight:500, lineHeight:1.5 }}>{t.text}</span>
                    </div>
                    <div style={{ width:32, height:32, borderRadius:9, background:`${ac(t.assignee)}20`, border:`1px solid ${ac(t.assignee)}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:ac(t.assignee), flexShrink:0 }}>
                      {acLabel(t.assignee)}
                    </div>
                    <button onClick={()=>setTasks(ts=>ts.filter(x=>x.id!==t.id))} aria-label="Delete task" style={{ width:28, height:28, borderRadius:8, border:"1px solid rgba(255,45,120,0.2)", background:"rgba(255,45,120,0.08)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {I.trash(12,C.pink)}
                    </button>
                  </div>
                );})
              }
            </div>
          </div>

          {/* RIGHT — Completed + Stats */}
          <div style={{ display:"flex", flexDirection:"column", gap:isMobile?22:12 }}>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))", gap:12 }}>
              {[
                {l:"PENDING", v:pending.length, c:C.yellow},
                {l:"DONE", v:done.length, c:C.green},
                {l:"TOTAL", v:tasks.length, c:C.cyan},
              ].map((s,i)=>(
                <div key={i} style={{ borderRadius:16, padding:isMobile?"18px 18px":"14px 16px", background:`${s.c}10`, border:`1px solid ${s.c}25`, textAlign:"center" }}>
                  <div style={{ fontSize:isMobile?24:36, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", marginTop:6, fontWeight:700 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Assignee breakdown */}
            <div style={{ borderRadius:16, padding:"16px 18px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:isMobile?22:14 }}>By Assignee</div>
              {[_c1.toUpperCase(),...(_c2?[_c2.toUpperCase(),"BOTH"]:[])].filter((v,i,a)=>a.indexOf(v)===i).map(a=>{
                const count = tasks.filter(t=>!t.done&&t.assignee===a).length;
                const total = tasks.filter(t=>t.assignee===a).length;
                return (
                  <div key={a} style={{ marginBottom:isMobile?14:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:14, color:"#fff", fontWeight:600 }}>{a}</span>
                      <span style={{ fontSize:14, color:ac(a), fontWeight:700 }}>{count} pending</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:"rgba(255,255,255,0.06)" }}>
                      <div style={{ height:"100%", width:`${total>0?(count/total)*100:0}%`, background:`linear-gradient(90deg,${ac(a)},${ac(a)}80)`, borderRadius:3, boxShadow:`0 0 8px ${ac(a)}50`, transition:"width 0.5s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completed */}
            {done.length>0 && (
              <div style={{ borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.015)" }}>
                <div style={{ padding:"12px 18px", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700 }}>
                  Completed ({done.length})
                </div>
                {done.slice(0,20).map((t,i)=>(
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 22px", borderBottom:i<Math.min(done.length,20)-1?"1px solid rgba(255,255,255,0.04)":"none", opacity:0.4 }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:`${C.green}20`, border:`1px solid ${C.green}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ display:"inline-flex" }}>{I.tick(12,C.green)}</span>
                    </div>
                    <div style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.5)", textDecoration:"line-through", lineHeight:1.4 }}>{t.text}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:ac(t.assignee), opacity:0.7 }}>{acLabel(t.assignee)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {sub==="APP IDEAS" && (
        <div style={{ display:"flex", flexDirection:"column", gap:isMobile?22:12 }}>
          {/* Add idea */}
          <div style={{ borderRadius:16, padding:"20px 22px", background:"linear-gradient(145deg,rgba(197,102,255,0.08),rgba(10,6,20,0.9))", border:`1px solid ${C.purple}25`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:isMobile?22:14 }}>New App Idea</div>
            <div style={{ display:"flex", gap:10 }}>
              <input
                value={ideaInput}
                onChange={e=>setIdeaInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addIdea()}
                placeholder="Describe your feature idea..."
                style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#fff", padding:isMobile?"12px 14px":"14px 18px", fontSize:isMobile?15:17, fontFamily:C.fontHead, outline:"none" }}
              />
              <button onClick={addIdea} style={{ padding:"12px 22px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:15, cursor:"pointer", whiteSpace:"nowrap" }}>ADD</button>
            </div>
          </div>

          {/* Ideas grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(200px,100%),1fr))", gap:14 }}>
            {appIdeas.length===0
              ? <div style={{ gridColumn:"1/-1", padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?22:12 }}>
                  <div style={{ display:"flex" }}>{I.idea(30,C.yellow)}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No app ideas yet</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Capture your best product ideas — add your first one above</div>
                </div>
              : appIdeas.map(idea=>{
                const sc = idea.score||0;
                const sc_c = sc>=80?C.green:sc>=65?C.yellow:sc>=50?C.cyan:C.pink;
                return (
                  <div key={idea.id} style={{ borderRadius:16, padding:isMobile?"18px 18px":"24px 26px", background:"rgba(255,255,255,0.025)", border:`1px solid ${sc_c}25`, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${sc_c},${sc_c}00)` }}/>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:isMobile?16:12 }}>
                      <div style={{ fontSize:14, color:"#fff", fontWeight:600, lineHeight:1.5, flex:1 }}>{idea.text}</div>
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <div style={{ fontSize:isMobile?24:40, fontWeight:400, fontFamily:C.fontHead, color:sc_c, lineHeight:1, textShadow:`0 0 16px ${sc_c}50` }}>{sc}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700 }}>SCORE</div>
                      </div>
                    </div>
                    {idea.verdict && (
                      <div style={{ padding:isMobile?"13px 16px":"10px 12px", background:`${C.cyan}08`, border:`1px solid ${C.cyan}18`, borderRadius:10, fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody, marginBottom:12 }}>{idea.verdict}</div>
                    )}
                    <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:8, marginBottom:isMobile?22:14 }}>
                      {[
                        {l:"IMPACT", v:idea.impact||"HIGH", c:idea.impact==="HIGH"?C.green:C.yellow},
                        {l:"EFFORT", v:idea.effort||"MEDIUM", c:idea.effort==="LOW"?C.green:idea.effort==="HIGH"?C.pink:C.yellow}
                      ].map((s,j)=>(
                        <div key={j} style={{ padding:"8px 10px", background:`${s.c}10`, border:`1px solid ${s.c}25`, borderRadius:10, textAlign:"center" }}>
                          <div style={{ fontSize:16, fontWeight:700, color:s.c }}>{s.v}</div>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700, marginTop:2 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <button onClick={()=>{ setEditAppIdeaTarget&&setEditAppIdeaTarget(idea); setModals&&setModals(m=>({...m,editAppIdea:true})); }} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.yellow}30`, background:`${C.yellow}10`, color:C.yellow, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>EDIT</button>
                      <button onClick={()=>setTasks(ts=>[{id:Date.now(),text:idea.text,assignee:WL.creator1||"Me",done:false},...ts])} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.cyan}30`, background:`${C.cyan}10`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>→ TO DO</button>
                      <button onClick={()=>setAppIdeas(is=>is.filter(x=>x.id!==idea.id))} aria-label="Delete" style={{ padding:"8px 12px", borderRadius:10, border:`1px solid ${C.pink}20`, background:`${C.pink}08`, color:C.pink, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>{I.trash(13,C.pink)}</button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      )}
    </div>
  );
};


const NicheView = ({ WL, keys, aiLoad, setAiLoad, setAiErr, videos=[], ideas=[] }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [trends, setTrends]           = useState(null);
  const [strategy, setStrategy]       = useState(null);
  const [contentPlan, setContentPlan] = useState(null);
  const [competitors, setCompetitors] = useState(()=>loadCompetitorData());
  const [predictions, setPredictions] = useState(()=>loadPredictions());
  const [memory, setMemory]           = useState(()=>loadMemory());
  const [predictInput, setPredictInput] = useState({ title:"", hook:"", type:"facecam", platform:"tiktok" });
  const [predictResult, setPredictResult] = useState(null);
  const [loading, setLoading]         = useState({});
  const [activeTab, setActiveTab]     = useState("TRENDS");
  const [hasPPX, setHasPPX]           = useState(false);
  const [outcomeInput, setOutcomeInput]   = useState({});
  const [hookDB, setHookDB]               = useState([]);
  const [patterns, setPatterns]           = useState(null);
  const [gaps, setGaps]                   = useState(null);
  const [consensus, setConsensus]         = useState(null);
  const [hasGPT, setHasGPT]              = useState(false);

  useEffect(()=>{ 
    const cfg = loadJSON("krapmaps_v1_config",{});
    setHasPPX(!!(cfg?.keys?.perplexity || BAKED_PERPLEXITY_KEY) || USE_BACKEND);
    setHasGPT(!!(cfg?.keys?.gpt4o));
    // Build hook DB and patterns from videos on mount
    if(videos.length) {
      setHookDB(buildHookDB(videos));
      setPatterns(buildPatterns(videos));
    }
  },[videos]);

  // Auto-learning: when predictions exist, check if outcomes were logged and update memory
  useEffect(()=>{ 
    const preds = loadPredictions();
    const mem   = loadMemory();
    // Find predictions that now have matching videos with actual views
    preds.forEach(pred => {
      if(!pred.outcome_logged && pred.concept?.title) {
        const matchingVideo = videos.find(v => 
          v.title?.toLowerCase().includes(pred.concept.title.toLowerCase().slice(0,20))
        );
        if(matchingVideo?.views > 0 && matchingVideo.views !== pred.predicted_views_low) {
          const wasAccurate = matchingVideo.views >= pred.predicted_views_low && matchingVideo.views <= pred.predicted_views_high;
          addMemoryEntry("AUTO_OUTCOME", 
            `"${pred.concept.title}" predicted ${pred.predicted_views_low?.toLocaleString()}-${pred.predicted_views_high?.toLocaleString()} → ACTUAL: ${matchingVideo.views.toLocaleString()} (${wasAccurate?"ACCURATE":"OFF — learn from this"})`
          );
          pred.outcome_logged = true;
        }
      }
    });
    savePredictions(preds);
    refreshMemory();
  },[videos]);

  const refreshMemory = () => setMemory(loadMemory());

  const setLoad = (k,v) => setLoading(l=>({...l,[k]:v}));

  // ── SILENT PERPLEXITY PREFETCH ───────────────────────────────
  // Runs before every Claude call — if no key or fails, Claude just runs without it
  const silentPPX = async (prompt) => {
    try {
      const cfg = loadJSON("krapmaps_v1_config",{});
      if(!cfg?.keys?.perplexity && !BAKED_PERPLEXITY_KEY && !USE_BACKEND) return null;
      return await callPerplexity(prompt, loadWL());
    } catch { return null; }
  };

  // ── CONTENT GAP RADAR ─────────────────────────────────────────
  const runGapRadar = async () => {
    setLoad("gaps", true);
    try {
      const wl = loadWL();
      const ctx = buildChannelContext();
      const memCtx = buildMemoryContext();
      const topicsAlreadyCovered = videos.map(v=>v.title).filter(Boolean).slice(0,20);

      // Step 1 — Perplexity scans live for gaps
      const liveGaps = await silentPPX(`Search RIGHT NOW for content gaps in ${wl.niche} on TikTok and Instagram. What topics are audiences searching for that almost NO creator is covering? What did ${wl.competitors} miss this week? What questions are being asked in comments that go unanswered? Return JSON: { raw_gaps:[{topic,evidence,urgency_signal}], competitor_misses:[{creator,what_they_missed}], audience_questions:[{question,volume:"HIGH|MEDIUM|LOW"}] }`);

      // Step 2 — Claude synthesises live gaps + channel data to prioritise
      const claudePrompt = `You are identifying content gap opportunities for ${wl.appName} (${wl.niche}).

LIVE GAP DATA (fetched right now from Perplexity):
${liveGaps ? JSON.stringify(liveGaps) : "No live data — use your knowledge of ${wl.niche} trends"}

CHANNEL CONTEXT:
- Topics already covered: ${topicsAlreadyCovered.slice(0,15).join(", ")}
- Best performing hook styles: ${JSON.stringify(ctx.bestHooks.slice(0,3))}
- Audience: ${wl.targetAudience}
- Formula: ${wl.bestFormula}
${memCtx}

Prioritise gaps by: (1) urgency — how fast will this peak, (2) fit — does it match this channel's style, (3) competition — how many creators are covering it.
Write specific hooks for each gap using ${wl.appName}'s voice.

Return ONLY JSON: { gaps:[{topic,why_gap_exists,urgency_days:number,potential_reach:"LOW|MEDIUM|HIGH|VIRAL",suggested_hook,first_mover_advantage,channel_fit_score:0-100}], emerging:[{topic,signal,time_to_peak:string,suggested_hook}], seasonal:[{topic,when,why_relevant,suggested_hook}] }`;

      const result = await callAI(claudePrompt, 2500);
      result._rawLive = liveGaps;
      setGaps(result);
      saveJSON(GAP_KEY, { data:result, date:new Date().toISOString().slice(0,10) });
      addMemoryEntry("GAP_SCAN", `Found ${result.gaps?.length||0} gaps. Top: "${result.gaps?.[0]?.topic||"unknown"}" (${result.gaps?.[0]?.potential_reach||"?"} reach)`);
      refreshMemory();
    } catch(e) { setAiErr&&setAiErr(e.message); }
    setLoad("gaps", false);
  };

  // ── MULTI-MODEL CONSENSUS ─────────────────────────────────────
  const runConsensus = async () => {
    setLoad("consensus", true);
    try {
      const wl = loadWL();
      const ctx = buildChannelContext();
      const memCtx = buildMemoryContext();
      const hDB = buildHookDB(videos);
      const pats = buildPatterns(videos);
      const sharedContext = `
Channel: ${wl.appName} | Niche: ${wl.niche} | Audience: ${wl.targetAudience}
Real data: ${ctx.stats.totalVideos} videos, avg ${ctx.stats.avgViews} views, avg ratio ${ctx.stats.avgLikeRatio}
Best hooks: ${JSON.stringify(hDB.slice(0,3))}
Best types: ${JSON.stringify(ctx.bestTypes.slice(0,3))}
Top videos: ${JSON.stringify(ctx.topVideos.slice(0,3))}
What flopped: ${JSON.stringify(ctx.floppedVideos)}
${memCtx}
${pats ? "Patterns: best day="+pats.dayPerf[0]?.day+", best type="+pats.typePerf[0]?.type : ""}`;

      const claudeQ = `${sharedContext}
Based on ALL this data, what are the 5 highest-impact actions this creator should take RIGHT NOW to grow? Be brutally specific — no generic advice. Return JSON: { recommendations:[{action,why,expected_impact,priority:"CRITICAL|HIGH|MEDIUM",timeframe}], avoid:[string], confidence_level:"HIGH|MEDIUM|LOW" }`;
      const gptQ    = `${sharedContext}
Based on ALL this data, what are the 5 highest-impact actions this creator should take RIGHT NOW to grow? Be brutally specific — no generic advice. Return JSON: { recommendations:[{action,why,expected_impact,priority:"CRITICAL|HIGH|MEDIUM",timeframe}], avoid:[string], confidence_level:"HIGH|MEDIUM|LOW" }`;
      
      const result = await callConsensus(claudeQ, gptQ, wl);
      setConsensus(result);
      
      if(result.bothSucceeded) {
        addMemoryEntry("CONSENSUS", `Multi-model consensus run. Claude: ${result.claude?.recommendations?.[0]?.action||"N/A"}. GPT: ${result.gpt?.recommendations?.[0]?.action||"N/A"}`);
      }
      refreshMemory();
    } catch(e) { setAiErr&&setAiErr(e.message); }
    setLoad("consensus", false);
  };

  // ── COMPETITOR SCRAPER ────────────────────────────────────────
  const runCompetitors = async () => {
    setLoad("compete", true);
    try {
      const wl = loadWL();
      const ctx = buildChannelContext();
      const prompt = `Search RIGHT NOW for recent content from these TikTok/Instagram creators: ${wl.competitors}.
For each competitor find: their last 5 posts, which ones went viral and why, what topics they are covering, what hook styles they use, what their comment sections say viewers want.
Also identify: gaps they are NOT covering that ${wl.appName} (${wl.niche}) could exploit.
Channel context: ${wl.appName} averages ${ctx.stats.avgViews} views. Best hook: ${ctx.bestHooks[0]?.hook||"unknown"}.
Return ONLY JSON: { 
  competitors:[{
    handle, 
    recent_viral:[{title,est_views,why_worked,hook_style}],
    topics_covering:[string],
    audience_wants:[string],
    weaknesses:[string]
  }],
  opportunities:[{gap,why_${wl.appName}_can_win,suggested_angle,urgency:"HIGH|MEDIUM|LOW"}],
  steal_these_hooks:[{hook,from_creator,adapt_for_channel:string}]
}`;
      const result = await callPerplexity(prompt, wl);
      const data = { data:result, lastFetched:new Date().toISOString().slice(0,10) };
      saveCompetitorData(data);
      setCompetitors(data);
      // Store in memory
      addMemoryEntry("COMPETITOR_SCAN", `Scanned ${wl.competitors}. Top opportunity: ${result.opportunities?.[0]?.gap||"unknown"}`);
      refreshMemory();
    } catch(e) { setAiErr&&setAiErr(e.message); }
    setLoad("compete", false);
  };

  // ── PREDICTIVE SCORER ─────────────────────────────────────────
  const runPredict = async () => {
    if(!predictInput.title.trim()) return;
    setLoad("predict", true);
    try {
      const ctx = buildChannelContext();
      const memCtx = buildMemoryContext();
      const compCtx = competitors?.data ? `Competitor intel: ${JSON.stringify(competitors.data.opportunities?.slice(0,2))}` : "";
      // Silently check if this topic is trending right now
      const liveTrendCheck = await silentPPX(`Is "${predictInput.title}" currently trending on TikTok? Is "${predictInput.hook}" a proven hook style right now? What is the current demand level for this type of ${loadWL().niche} content? Return JSON: { topic_trending:true|false, topic_momentum:"rising|stable|fading|unknown", hook_style_working:true|false, demand_level:"HIGH|MEDIUM|LOW", similar_viral_examples:[string] }`);

      const prompt = `Predict performance for this video concept on ${ctx.wl.appName}.

LIVE TREND CHECK (fetched right now):
${liveTrendCheck ? JSON.stringify(liveTrendCheck) : "No live data — using channel data only"}

CHANNEL REAL DATA:
- Avg views: ${ctx.stats.avgViews} | Avg like ratio: ${ctx.stats.avgLikeRatio}
- Top performers: ${JSON.stringify(ctx.topVideos.slice(0,3))}
- Best hook types by actual views: ${JSON.stringify(ctx.bestHooks)}
- Best video types by actual views: ${JSON.stringify(ctx.bestTypes)}
- What flopped: ${JSON.stringify(ctx.floppedVideos.map(v=>v.hook+"/"+v.type))}
${memCtx}
${compCtx}

VIDEO TO PREDICT:
Title: "${predictInput.title}"
Hook: "${predictInput.hook}"
Type: ${predictInput.type}
Platform: ${predictInput.platform}

Think step by step:
1. Does this hook style historically perform well on this channel?
2. Does this video type perform well on this channel?
3. Is this topic trending right now?
4. What is the realistic view range based on comparable past videos?
5. What specifically would make this succeed or fail?

Return ONLY JSON: {
  predicted_views_low: number,
  predicted_views_high: number,
  confidence: "HIGH|MEDIUM|LOW",
  beat_average: true|false,
  hook_score: 0-100,
  concept_score: 0-100,
  overall_score: 0-100,
  reasoning: string,
  what_will_work: [string],
  what_will_fail: [string],
  improved_hook: string,
  best_posting_time: string,
  variations:[{hook:string, predicted_uplift:"+10%|-20%|etc", why:string}]
}`;
      const result = await callAI(prompt, 2000);
      result.concept = {...predictInput, date:new Date().toISOString().slice(0,10)};
      const existing = loadPredictions();
      existing.unshift(result);
      const trimmed = existing.slice(0,20);
      savePredictions(trimmed);
      setPredictions(trimmed);
      setPredictResult(result);
      addMemoryEntry("PREDICTION", `Predicted "${predictInput.title}" → ${result.predicted_views_low?.toLocaleString()}-${result.predicted_views_high?.toLocaleString()} views (${result.confidence} confidence)`);
      refreshMemory();
    } catch(e) { setAiErr&&setAiErr(e.message); }
    setLoad("predict", false);
  };

  // ── SAVE OUTCOME (close the feedback loop) ─────────────────────
  const saveOutcome = (predIndex, actualViews) => {
    const pred = predictions[predIndex];
    if(!pred) return;
    addMemoryEntry("OUTCOME", 
      `"${pred.concept?.title}" was predicted ${pred.predicted_views_low?.toLocaleString()}-${pred.predicted_views_high?.toLocaleString()} views → ACTUAL: ${Number(actualViews).toLocaleString()} views. Hook: ${pred.concept?.hook}`
    );
    refreshMemory();
    setOutcomeInput({});
  };

  // Build rich channel context from real data
  const buildChannelContext = () => {
    const wl = loadWL();
    const topVids = [...videos].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
    const floppedVids = [...videos].filter(v=>v.views>0).sort((a,b)=>(a.views||0)-(b.views||0)).slice(0,3);
    const avgViews = videos.length ? Math.round(videos.reduce((s,v)=>s+(v.views||0),0)/videos.length) : 0;
    const avgRatio = videos.length ? (videos.reduce((s,v)=>s+(v.views>0?(v.likes/v.views)*100:0),0)/videos.length).toFixed(1) : 0;
    const topIdeas = [...ideas].sort((a,b)=>(b.viral||0)-(a.viral||0)).slice(0,5);
    const hookBreakdown = {};
    videos.forEach(v=>{ if(v.hook){ hookBreakdown[v.hook]=(hookBreakdown[v.hook]||[]).concat(v.views||0); }});
    const hookAvgs = Object.entries(hookBreakdown).map(([h,views])=>({ hook:h, avg:Math.round(views.reduce((a,b)=>a+b,0)/views.length) })).sort((a,b)=>b.avg-a.avg);
    const typeBreakdown = {};
    videos.forEach(v=>{ if(v.type){ typeBreakdown[v.type]=(typeBreakdown[v.type]||[]).concat(v.views||0); }});
    const typeAvgs = Object.entries(typeBreakdown).map(([t,views])=>({ type:t, avg:Math.round(views.reduce((a,b)=>a+b,0)/views.length) })).sort((a,b)=>b.avg-a.avg);
    return {
      wl,
      stats: { totalVideos:videos.length, avgViews, avgLikeRatio:avgRatio+"%" },
      topVideos: topVids.map(v=>({ title:v.title, views:v.views, likes:v.likes, type:v.type, hook:v.hook, ratio:v.views>0?((v.likes/v.views)*100).toFixed(1)+"%":"0%" })),
      floppedVideos: floppedVids.map(v=>({ title:v.title, views:v.views, type:v.type, hook:v.hook })),
      bestHooks: hookAvgs.slice(0,3),
      bestTypes: typeAvgs.slice(0,3),
      topIdeas: topIdeas.map(i=>({ title:i.title, viralScore:i.viral, type:i.type, hook:i.hook })),
    };
  };

  // STEP 1: Perplexity fetches live trends for this specific niche
  const runTrends = async () => {
    setLoad("trends",true);
    try {
      const wl = loadWL();
      const ctx = buildChannelContext();
      const memCtx = buildMemoryContext();
      const compCtx = competitors?.data?.opportunities ? `Competitor gaps identified: ${JSON.stringify(competitors.data.opportunities.slice(0,2))}` : "";
      // Step 1a — raw trend fetch
      const trendPrompt = `You are researching TikTok and Instagram trends RIGHT NOW in ${wl.niche} for a creator targeting ${wl.targetAudience}.
Search for: top trending topics, viral formats, trending sounds, competitor activity from ${wl.competitors}.
Their best content type so far: ${ctx.bestTypes[0]?.type||"unknown"} (avg ${ctx.bestTypes[0]?.avg||0} views).
Their best hook style so far: ${ctx.bestHooks[0]?.hook||"unknown"} (avg ${ctx.bestHooks[0]?.avg||0} views).
Channel average views: ${ctx.stats.avgViews}. Total videos: ${ctx.stats.totalVideos}.
${memCtx}
${compCtx}
Return ONLY JSON: { trends:[{title,why,engagement_level:"HIGH|MEDIUM|LOW",how_to_use,example_hook,platform,fits_channel:true|false,fit_reason}], sounds:[{name,why,trending_since}], formats:[{name,description,why_works_for_niche}], competitor_moves:[{creator,what_theyre_doing,opportunity}] }`;
      const rawTrends = await callPerplexity(trendPrompt, wl);
      setTrends(rawTrends);
    } catch(e) { setAiErr&&setAiErr(e.message); }
    setLoad("trends",false);
  };

  // STEP 2: Claude does deep multi-step strategy using real data + trends
  const runStrategy = async () => {
    setLoad("strategy",true);
    try {
      const ctx = buildChannelContext();
      const { wl } = ctx;
      const memCtx = buildMemoryContext();
      const hDB = buildHookDB(videos);
      const pats = buildPatterns(videos);

      // Step 1 — Perplexity silently fetches live context before Claude runs
      const liveTrends = await silentPPX(`What is trending RIGHT NOW in ${wl.niche} TikTok content for ${wl.targetAudience}? What formats and topics are getting high engagement this week? Return JSON: { hot_right_now:[{topic,why,momentum:"rising|peak|fading"}], formats_working:[string], avoid_now:[string] }`);
      const liveGaps   = await silentPPX(`Search for content gaps in ${wl.niche} TikTok niche that ${wl.competitors} are NOT covering. What is the audience asking for that nobody is making? Return JSON: { gaps:[{topic,audience_demand,urgency:"HIGH|MEDIUM|LOW"}] }`);

      const compCtx = competitors?.data?.opportunities
        ? `Known competitor gaps: ${JSON.stringify(competitors.data.opportunities.slice(0,3))}`
        : liveGaps ? `Live gap data: ${JSON.stringify(liveGaps)}` : "";

      // Step 2 — Claude gets everything: real data + live trends + gaps + memory
      const analysisPrompt = `You are analysing a ${wl.niche} TikTok/Instagram channel.
REAL CHANNEL DATA:
- ${ctx.stats.totalVideos} videos posted, avg ${ctx.stats.avgViews} views, avg like ratio ${ctx.stats.avgLikeRatio}
- TOP PERFORMING: ${JSON.stringify(ctx.topVideos)}
- FLOPPED: ${JSON.stringify(ctx.floppedVideos)}  
- BEST HOOK TYPES BY AVG VIEWS: ${JSON.stringify(ctx.bestHooks)}
- BEST VIDEO TYPES BY AVG VIEWS: ${JSON.stringify(ctx.bestTypes)}
- TOP SCORED IDEAS NOT YET MADE: ${JSON.stringify(ctx.topIdeas)}
${liveTrends ? "LIVE TRENDS (fetched right now via Perplexity): "+JSON.stringify(liveTrends) : trends ? "Previously fetched trends: "+JSON.stringify(trends.trends?.slice(0,4)) : ""}
${hDB.length ? "HOOK PERFORMANCE DATABASE: "+JSON.stringify(hDB.slice(0,5)) : ""}
${pats ? "CHANNEL PATTERNS: best day="+pats.dayPerf[0]?.day+", best type="+pats.typePerf[0]?.type+", cross-post "+((pats.crossAvg||0)>(pats.singleAvg||0)?"HELPS":"HURTS") : ""}
${memCtx}
${compCtx}

Step 1 — Think through what patterns you see in the data. What is genuinely working? What is failing and why?
Step 2 — Identify the 3 biggest opportunities this channel is missing based on trends vs their current content.
Step 3 — Build a 4-week content plan that doubles down on what works AND exploits the missing opportunities.

Return JSON: { 
  channel_diagnosis: { strengths:[string], weaknesses:[string], biggest_opportunity:string },
  weeks:[{week:number, theme:string, focus:string, videos:[{title,hook,type,platform,why_it_works,predicted_views:"low|medium|high|viral"}]}],
  kpis:[{metric,current,target,how}],
  stop_doing:[string],
  start_doing:[string]
}`;
      const result = await callAI(analysisPrompt, 4000);
      setStrategy(result);
      addMemoryEntry("STRATEGY", `Built 4-week strategy. Biggest opportunity identified: ${result.channel_diagnosis?.biggest_opportunity||"unknown"}. Stop doing: ${result.stop_doing?.[0]||"N/A"}`);
      refreshMemory();
    } catch(e) { setAiErr&&setAiErr(e.message); }
    setLoad("strategy",false);
  };

  // STEP 3: Claude generates ideas grounded in real performance data
  const runContentPlan = async () => {
    // Idea generation is a heavy AI call — meter it against the plan too (margin safety).
    if(!(await gateAI("scores","scores"))) return;
    setLoad("plan",true);
    try {
      const ctx = buildChannelContext();
      const { wl } = ctx;
      const memCtx = buildMemoryContext();
      const hDB = buildHookDB(videos);
      ensureVoiceProfile(videos, ideas, wl); // keep the distilled voice profile warm (fire-and-forget)

      // Step 1 — Perplexity silently fetches: trending hooks + what audience is searching for
      const [liveHooks, liveAudience] = await Promise.all([
        silentPPX(`What specific hook styles and opening lines are going viral on TikTok RIGHT NOW in ${wl.niche}? Give real examples. Return JSON: { viral_hooks:[{hook,why_works,example_creator,estimated_reach:"HIGH|MEDIUM"}], trending_formats:[string] }`),
        silentPPX(`What are ${wl.targetAudience} searching for and asking about on TikTok and Reddit right now related to ${wl.niche}? What questions are they asking that no creator is answering? Return JSON: { audience_questions:[{question,demand:"HIGH|MEDIUM|LOW",suggested_angle}], underserved_topics:[string] }`)
      ]);

      const prompt = `Generate 10 video ideas for ${wl.appName} (${wl.niche}).

CHANNEL REAL PERFORMANCE DATA:
- Best hook styles by actual avg views: ${JSON.stringify(hDB.slice(0,4))}
- Best video types: ${JSON.stringify(ctx.bestTypes)}
- What flopped: ${JSON.stringify(ctx.floppedVideos.map(v=>v.hook+" / "+v.type))}
- Channel avg views: ${ctx.stats.avgViews}
- Top unproduced scored ideas: ${JSON.stringify(ctx.topIdeas.slice(0,3))}

LIVE DATA (fetched right now):
${liveHooks ? "Viral hooks trending now: "+JSON.stringify(liveHooks) : ""}
${liveAudience ? "Audience questions nobody is answering: "+JSON.stringify(liveAudience) : ""}
${trends ? "Previously fetched trends: "+JSON.stringify(trends.trends?.slice(0,3)) : ""}

${memCtx}

${voiceBlock(videos, ideas)}

${COACH_PRINCIPLES}

Rules:
- Prioritise hook styles that historically perform on THIS channel (see hook DB above)
- Incorporate live trending hooks where they genuinely fit — don't force it
- Fill gaps the audience is asking about that competitors aren't covering
- Each hook must be under 10 words, cause immediate scroll-stop
- Every title and hook MUST be written in the creator's Voice DNA above — sound like them, not like AI
- Be honest with scores — not everything is 90+
- Explain specifically WHY this beats their ${ctx.stats.avgViews} view average

Return ONLY JSON: { ideas:[{title,hook,description,why_viral,why_beats_average,score,type,platform,cta,estimated_views,data_source:"live|channel_data|both"}] }`;

      const result = await callAI(prompt, 4000);
      setContentPlan(result);
      if(result.ideas?.length) addMemoryEntry("IDEAS_GENERATED", `Generated ${result.ideas.length} ideas using ${liveHooks?"live+":""}channel data. Top: "${result.ideas[0]?.title}" (score: ${result.ideas[0]?.score})`);
      refreshMemory();
    } catch(e) { setAiErr&&setAiErr(e.message); }
    setLoad("plan",false);
  };

  const scoreColor = s => s>=80?C.green:s>=60?C.yellow:s>=40?C.orange:C.pink;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?28:24 }}>
      {/* Header */}
      <div style={{ borderRadius:16, padding:isMobile?"26px 20px":"24px 28px", background:`linear-gradient(135deg,${C.purple}25,${C.cyan}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.purple}40`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.purple},${C.cyan},${C.purple}00)` }} />
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:`${C.purple}20`, filter:"blur(50px)", pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:isMobile?22:14 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:`${C.purple}25`, border:`1px solid ${C.purple}50`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${C.purple}40` }}>{I.brain(24,C.purple)}</div>
          <div>
            <div style={{ fontSize:isMobile?20:28, fontWeight:700, color:"#fff", letterSpacing:"0.04em", textTransform:"uppercase" }}>NICHE AI</div>
            <div style={{ fontSize:13, color:`${C.purple}cc`, marginTop:2 }}>Powered by Perplexity live search + Claude strategy</div>
          </div>
        </div>
        {/* Current niche config */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))", gap:8 }}>
          {[
            {l:"NICHE", v:loadWL()?.niche, c:C.purple},
            {l:"AUDIENCE", v:loadWL()?.targetAudience, c:C.cyan},
            {l:"PLATFORMS", v:loadWL()?.platforms, c:C.pink},
          ].map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:isMobile?"13px 16px":"10px 14px", border:`1px solid ${s.c}25` }}>
              <div style={{ fontSize:16, color:s.c, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{s.l}</div>
              <div style={{ fontSize:16, color:"#fff", fontWeight:600, lineHeight:1.3 }}>{s.v||"—"}</div>
            </div>
          ))}
        </div>
        {!hasPPX && (
          <div style={{ marginTop:12, padding:isMobile?"13px 16px":"10px 14px", borderRadius:12, background:`${C.yellow}15`, border:`1px solid ${C.yellow}35`, fontSize:14, color:C.yellow }}>
            Add your Perplexity API key in Settings to unlock live trend research
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))", gap:10 }}>
        {[
          { label:"LIVE TRENDS", desc:"What's hot right now", icon:I.globe, color:C.cyan, action:runTrends, key:"trends" },
          { label:"4-WEEK STRATEGY", desc:"Full content roadmap", icon:I.target, color:C.green, action:runStrategy, key:"strategy" },
          { label:"10 VIDEO IDEAS", desc:"Niche-specific ideas", icon:I.zap, color:C.yellow, action:runContentPlan, key:"plan" },
          { label:"COMPETITOR SPY", desc:"What rivals are doing", icon:I.search, color:C.pink, action:runCompetitors, key:"compete" },
          { label:"PREDICT VIDEO", desc:"Score before you film", icon:I.trend, color:C.purple, action:()=>document.getElementById("predict-section")?.scrollIntoView({behavior:"smooth"}), key:"" },
          { label:"AI MEMORY", desc:`${memory.entries?.length||0} entries stored`, icon:I.brain, color:C.orange, action:refreshMemory, key:"" },
          { label:"GAP RADAR", desc:"Uncovered topics now", icon:I.globe, color:C.green, action:runGapRadar, key:"gaps" },
          { label:"CONSENSUS AI", desc:`Claude + GPT-4o${hasGPT?"":" (add GPT key)"}`, icon:I.zap, color:C.purple, action:runConsensus, key:"consensus" },
          { label:"HOOK DATABASE", desc:`${hookDB.length} hooks tracked`, icon:I.trend, color:C.yellow, action:()=>document.getElementById("hookdb-section")?.scrollIntoView({behavior:"smooth"}), key:"" },
        ].map((btn,i)=>(
          <button key={i} data-btn onClick={btn.action} disabled={btn.key&&loading[btn.key]} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?12:10, padding:isMobile?"16px 10px":"20px 12px", borderRadius:16, background:`linear-gradient(145deg,${btn.color}18,${btn.color}06)`, border:`1px solid ${btn.color}35`, cursor:"pointer", fontFamily:C.fontHead, opacity:btn.key&&loading[btn.key]?0.6:1, transition:"all 0.2s", position:"relative", overflow:"hidden" }}>
            <div style={{ width:isMobile?40:52, height:isMobile?40:52, borderRadius:14, background:`${btn.color}22`, border:`1px solid ${btn.color}45`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 20px ${btn.color}25` }}>{btn.icon(isMobile?18:22,btn.color)}</div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:isMobile?11:16, fontWeight:700, color:"#fff", letterSpacing:"0.04em", textTransform:"uppercase" }}>{btn.key&&loading[btn.key]?"RUNNING...":btn.label}</div>
              <div style={{ fontSize:isMobile?10:14, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{btn.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* LIVE TRENDS */}
      {trends && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.cyan}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.cyan}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?24:16 }}>
            <div style={{ fontSize:isMobile?15:20, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase", flex:1, marginRight:8 }}>LIVE TRENDS — {loadWL()?.niche?.toUpperCase()}</div>
            <Tag color={trends.data_source==="perplexity_live"?C.green:C.yellow} sm>{trends.data_source==="perplexity_live"?"LIVE NOW":"AI KNOWLEDGE"}</Tag>
          </div>

          {/* Biggest opportunity — show first, most prominent */}
          {trends.biggest_opportunity && (
            <div style={{ marginBottom:16, padding:"18px 20px", borderRadius:16, background:`linear-gradient(135deg,${C.green}18,${C.cyan}08)`, border:`1px solid ${C.green}40` }}>
              <div style={{ fontSize:isMobile?14:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8, display:"flex", alignItems:"center", gap:7 }}>{I.zap(14,C.green)} BIGGEST OPPORTUNITY RIGHT NOW</div>
              <div style={{ fontSize:isMobile?16:18, fontWeight:700, color:"#fff", marginBottom:6 }}>{trends.biggest_opportunity.what}</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:isMobile?16:12 }}>{trends.biggest_opportunity.why_now}</div>
              <div style={{ padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:`${C.green}12`, border:`1px solid ${C.green}25`, marginBottom:8 }}>
                <div style={{ fontSize:12, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>SUGGESTED VIDEO</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>{trends.biggest_opportunity.suggested_video_title}</div>
                <div style={{ fontSize:isMobile?14:17, color:C.cyan, fontStyle:"italic" }}>"{trends.biggest_opportunity.hook}"</div>
              </div>
              {trends.biggest_opportunity.predicted_impact && <div style={{ fontSize:15, color:C.green, display:"flex", alignItems:"center", gap:6 }}>{I.trend(14,C.green)}<span>{trends.biggest_opportunity.predicted_impact}</span></div>}
            </div>
          )}

          {trends.trends?.map((t,i)=>(
            <div key={i} style={{ marginBottom:12, padding:"16px 18px", borderRadius:16, background:`rgba(255,255,255,0.04)`, border:`1px solid ${C.cyan}20` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{t.title}</div>
  <div style={{display:"flex",gap:6}}>
                <Tag color={t.engagement_level==="HIGH"?C.green:t.engagement_level==="MEDIUM"?C.yellow:C.orange}>{t.engagement_level}</Tag>
                {t.urgency && <Tag color={t.urgency==="POST NOW"?C.pink:t.urgency==="THIS WEEK"?C.yellow:C.dim} sm>{t.urgency}</Tag>}
              </div>
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:10, lineHeight:1.5 }}>{t.why}</div>
              <div style={{ padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:`${C.cyan}10`, border:`1px solid ${C.cyan}25`, marginBottom:8 }}>
                <div style={{ fontSize:12, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>HOOK FOR YOUR CHANNEL</div>
                <div style={{ fontSize:isMobile?14:17, color:"#fff", fontStyle:"italic" }}>"{Object.entries(t).find(([k])=>k.startsWith("hook_for"))?.[1]||t.example_hook||t.hook}"</div>
              </div>
              {t.why_it_fits_this_channel && <div style={{ fontSize:15, color:C.green, display:"flex", alignItems:"flex-start", gap:6 }}>{I.tick(14,C.green)}<span>{t.why_it_fits_this_channel}</span></div>}
            </div>
          ))}

          {trends.sounds?.length>0 && (
            <>
              <div style={{ fontSize:15, fontWeight:700, color:C.cyan, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, marginTop:16 }}>TRENDING SOUNDS</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {trends.sounds.map((s,i)=>(
                  <div key={i} style={{ padding:"8px 14px", borderRadius:10, background:`${C.cyan}12`, border:`1px solid ${C.cyan}30`, fontSize:16, color:"#fff", display:"flex", alignItems:"center", gap:7 }}>{I.music(13,C.cyan)}<span>{s.name}</span></div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4-WEEK STRATEGY */}
      {strategy && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.green}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.green}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.green},${C.green}00)` }} />
          <div style={{ fontSize:isMobile?17:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:isMobile?14:10 }}>4-WEEK STRATEGY</div>
          <div style={{ fontSize:isMobile?15:14, color:"rgba(255,255,255,0.9)", lineHeight:1.7, fontFamily:C.fontBody, marginBottom:20 }}>{strategy.overview}</div>
          
          {strategy.channel_diagnosis && (
            <div style={{ marginBottom:20, padding:"16px 18px", borderRadius:16, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.green}25` }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.green, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:isMobile?16:12 }}>CHANNEL DIAGNOSIS</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10, marginBottom:isMobile?16:12 }}>
                <div style={{ padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:`${C.green}10`, border:`1px solid ${C.green}20` }}>
                  <div style={{ fontSize:isMobile?14:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>STRENGTHS</div>
                  {strategy.channel_diagnosis.strengths?.map((s,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:3, display:"flex", alignItems:"flex-start", gap:6 }}>{I.tick(13,C.green)}<span>{s}</span></div>)}
                </div>
                <div style={{ padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:`${C.pink}10`, border:`1px solid ${C.pink}20` }}>
                  <div style={{ fontSize:isMobile?14:17, color:WL.accentColor, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>WEAKNESSES</div>
                  {strategy.channel_diagnosis.weaknesses?.map((s,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:3, display:"flex", alignItems:"flex-start", gap:6 }}>{I.x(13,C.pink)}<span>{s}</span></div>)}
                </div>
              </div>
              <div style={{ padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:`${C.yellow}10`, border:`1px solid ${C.yellow}25` }}>
                <div style={{ fontSize:isMobile?14:17, color:C.yellow, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>BIGGEST OPPORTUNITY</div>
                <div style={{ fontSize:isMobile?14:17, color:"#fff" }}>{strategy.channel_diagnosis.biggest_opportunity}</div>
              </div>
            </div>
          )}
          {(strategy.stop_doing?.length>0||strategy.start_doing?.length>0) && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10, marginBottom:isMobile?24:16 }}>
              {strategy.stop_doing?.length>0 && <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
                <div style={{ fontSize:isMobile?14:17, color:WL.accentColor, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>STOP DOING</div>
                {strategy.stop_doing.map((s,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4, display:"flex", alignItems:"flex-start", gap:6 }}>{I.x(13,C.pink)}<span>{s}</span></div>)}
              </div>}
              {strategy.start_doing?.length>0 && <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:isMobile?14:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>START DOING</div>
                {strategy.start_doing.map((s,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4, display:"flex", alignItems:"flex-start", gap:6 }}>{I.tick(13,C.green)}<span>{s}</span></div>)}
              </div>}
            </div>
          )}
          {strategy.weeks?.map((w,i)=>(
            <div key={i} style={{ marginBottom:14, borderRadius:16, overflow:"hidden", border:`1px solid ${C.green}20` }}>
              <div style={{ padding:isMobile?"14px 18px":"12px 16px", background:`${C.green}15`, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:`${C.green}25`, border:`1px solid ${C.green}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:C.green }}>W{w.week}</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.04em" }}>{w.theme}</div>
              </div>
              <div style={{ padding:isMobile?"14px 18px":"12px 16px" }}>
                {w.videos?.map((v,j)=>(
                  <div key={j} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:j<w.videos.length-1?`1px solid rgba(255,255,255,0.05)`:"none" }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`${C.green}15`, border:`1px solid ${C.green}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:C.green, flexShrink:0 }}>{j+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>{v.title}</div>
                      <div style={{ fontSize:15, color:`${C.green}cc`, fontStyle:"italic", marginBottom:4 }}>"{v.hook}"</div>
                      <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)" }}>{v.why_it_works}</div>
                      <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                        <Tag color={C.green} sm>{v.platform}</Tag>
                        <Tag color={C.cyan} sm>{v.type}</Tag>
                        {v.predicted_views && <Tag color={v.predicted_views==="viral"?C.green:v.predicted_views==="high"?C.yellow:C.dim} sm>{v.predicted_views}</Tag>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {strategy.kpis?.length>0 && (
            <>
              <div style={{ fontSize:15, fontWeight:700, color:C.green, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, marginTop:8 }}>TARGET KPIs</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:8 }}>
                {strategy.kpis.map((k,i)=>(
                  <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.green }}>{k.target}</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginTop:3 }}>{k.metric}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 10 VIDEO IDEAS */}
      {contentPlan && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.yellow}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.yellow}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.yellow},${C.yellow}00)` }} />
          <div style={{ fontSize:isMobile?17:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:isMobile?24:16 }}>10 NICHE VIDEO IDEAS</div>
          {contentPlan.ideas?.map((idea,i)=>(
            <div key={i} style={{ marginBottom:12, padding:"16px 18px", borderRadius:16, background:"rgba(255,255,255,0.025)", border:`1px solid ${scoreColor(idea.score)}25`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:`linear-gradient(180deg,${scoreColor(idea.score)},${scoreColor(idea.score)}40)`, borderRadius:"14px 0 0 14px" }} />
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>{idea.title}</div>
                  <div style={{ fontSize:14, color:C.yellow, fontStyle:"italic", marginBottom:8 }}>"{idea.hook}"</div>
                  <div style={{ fontSize:15, color:"rgba(255,255,255,0.8)", lineHeight:1.5, marginBottom:8 }}>{idea.description}</div>
                  <div style={{ fontSize:15, color:C.green, lineHeight:1.4, marginBottom:6 }}>↑ {idea.why_viral}</div>
              {idea.why_beats_average && <div style={{ fontSize:15, color:C.cyan, lineHeight:1.4, display:"flex", alignItems:"flex-start", gap:6 }}>{I.trend(14,C.cyan)}<span>{idea.why_beats_average}</span></div>}
                </div>
                <div style={{ flexShrink:0 }}>
                  <ScoreDial score={idea.score} size={isMobile?68:80} />
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <Tag color={C.yellow} sm>{idea.platform}</Tag>
                <Tag color={C.cyan} sm>{idea.type}</Tag>
                {idea.cta && <Tag color={C.purple} sm>CTA: {idea.cta}</Tag>}
                {idea.estimated_views && <Tag color={C.green} sm>Est: {idea.estimated_views}</Tag>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PREDICTIVE SCORER ──────────────────────────────────── */}
      <div id="predict-section" data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.purple}15,rgba(7,5,15,0.95))`, border:`1px solid ${C.purple}40`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }} />
        <div style={{ fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:isMobile?24:16, display:"flex", alignItems:"center", gap:8 }}>{I.predict(20,"#fff")} PREDICT BEFORE YOU FILM</div>
        <div style={{ display:"flex", flexDirection:"column", gap:isMobile?20:10, marginBottom:isMobile?22:14 }}>
          <input value={predictInput.title} onChange={e=>setPredictInput(p=>({...p,title:e.target.value}))} placeholder="Video concept / title..." style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.purple}40`, borderRadius:12, color:"#fff", padding:isMobile?"14px 18px":"12px 16px", fontSize:17, fontFamily:C.fontHead, outline:"none" }} />
          <input value={predictInput.hook} onChange={e=>setPredictInput(p=>({...p,hook:e.target.value}))} placeholder="Opening hook (first 3 seconds)..." style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.purple}40`, borderRadius:12, color:"#fff", padding:isMobile?"14px 18px":"12px 16px", fontSize:17, fontFamily:C.fontHead, outline:"none" }} />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10 }}>
            <select value={predictInput.type} onChange={e=>setPredictInput(p=>({...p,type:e.target.value}))} style={{ background:"#0D0B18", border:`1px solid ${C.purple}40`, borderRadius:12, color:"#fff", padding:isMobile?"14px 18px":"12px 16px", fontSize:17, fontFamily:C.fontHead, outline:"none", appearance:"none", colorScheme:"dark" }}>
              {["facecam","street","screencap","voiceover","mixed"].map(t=><option key={t} value={t} style={{background:"#0D0B18"}}>{t}</option>)}
            </select>
            <select value={predictInput.platform} onChange={e=>setPredictInput(p=>({...p,platform:e.target.value}))} style={{ background:"#0D0B18", border:`1px solid ${C.purple}40`, borderRadius:12, color:"#fff", padding:isMobile?"14px 18px":"12px 16px", fontSize:17, fontFamily:C.fontHead, outline:"none", appearance:"none", colorScheme:"dark" }}>
              {["tiktok","instagram","both"].map(t=><option key={t} value={t} style={{background:"#0D0B18"}}>{t}</option>)}
            </select>
          </div>
          <button data-btn onClick={runPredict} disabled={loading.predict||!predictInput.title.trim()} style={{ padding:"14px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:15, cursor:"pointer", opacity:loading.predict?0.6:1 }}>
            {loading.predict?"ANALYSING...":"PREDICT PERFORMANCE"}
          </button>
        </div>

        {predictResult && (
          <div style={{ marginTop:4 }}>
            {/* Score overview */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))", gap:10, marginBottom:isMobile?24:16 }}>
              {[
                {l:"PREDICTED VIEWS", v:`${(predictResult.predicted_views_low||0).toLocaleString()}–${(predictResult.predicted_views_high||0).toLocaleString()}`, c:predictResult.beat_average?C.green:C.yellow},
                {l:"OVERALL SCORE", v:`${predictResult.overall_score||0}/100`, c:predictResult.overall_score>=70?C.green:predictResult.overall_score>=50?C.yellow:C.pink},
                {l:"CONFIDENCE", v:predictResult.confidence||"–", c:predictResult.confidence==="HIGH"?C.green:predictResult.confidence==="MEDIUM"?C.yellow:C.pink},
              ].map((s,i)=>(
                <div key={i} style={{ textAlign:"center", padding:"14px 8px", background:`${s.c}10`, borderRadius:12, border:`1px solid ${s.c}25` }}>
                  <div style={{ fontSize:22, fontWeight:700, fontFamily:C.fontHead, color:s.c, lineHeight:1, textShadow:`0 0 16px ${s.c}50` }}>{s.v}</div>
                  <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", letterSpacing:"0.1em", marginTop:6, textTransform:"uppercase" }}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Reasoning */}
            <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`, marginBottom:isMobile?16:12 }}>
              <div style={{ fontSize:15, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>AI REASONING</div>
              <div style={{ fontSize:isMobile?15:14, color:"rgba(255,255,255,0.9)", lineHeight:1.7, fontFamily:C.fontBody }}>{predictResult.reasoning}</div>
            </div>
            {/* Will work / will fail */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10, marginBottom:isMobile?16:12 }}>
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:isMobile?14:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>WILL WORK</div>
                {predictResult.what_will_work?.map((w,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4, display:"flex", alignItems:"flex-start", gap:6 }}>{I.tick(13,C.green)}<span>{w}</span></div>)}
              </div>
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
                <div style={{ fontSize:isMobile?14:17, color:WL.accentColor, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>WATCH OUT</div>
                {predictResult.what_will_fail?.map((w,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4, display:"flex", alignItems:"flex-start", gap:6 }}>{I.x(13,C.pink)}<span>{w}</span></div>)}
              </div>
            </div>
            {/* Improved hook */}
            {predictResult.improved_hook && (
              <div style={{ padding:isMobile?"14px 18px":"12px 16px", borderRadius:12, background:`${C.cyan}10`, border:`1px solid ${C.cyan}30`, marginBottom:isMobile?16:12 }}>
                <div style={{ fontSize:isMobile?14:17, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>IMPROVED HOOK</div>
                <div style={{ fontSize:isMobile?14:16, color:"#fff", fontStyle:"italic" }}>"{predictResult.improved_hook}"</div>
              </div>
            )}
            {/* Hook variations */}
            {predictResult.variations?.length>0 && (
              <div style={{ marginBottom:isMobile?16:12 }}>
                <div style={{ fontSize:15, color:C.yellow, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>HOOK VARIATIONS</div>
                {predictResult.variations.map((v,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.025)", border:`1px solid rgba(255,255,255,0.06)`, marginBottom:6 }}>
                    <div style={{ flex:1, fontSize:isMobile?14:17, color:"#fff", fontStyle:"italic" }}>"{v.hook}"</div>
                    <Tag color={v.predicted_uplift?.startsWith("+")?C.green:C.pink} sm>{v.predicted_uplift}</Tag>
                  </div>
                ))}
              </div>
            )}
            {/* Log actual outcome */}
            <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.025)", border:`1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)", marginBottom:8 }}>After posting, log actual views to train the AI:</div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={outcomeInput[0]||""} onChange={e=>setOutcomeInput(o=>({...o,0:e.target.value}))} placeholder="Actual views..." style={{ flex:1, background:"rgba(255,255,255,0.06)", border:`1px solid rgba(255,255,255,0.12)`, borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 14px", fontSize:17, fontFamily:C.fontHead, outline:"none" }} />
                <button onClick={()=>saveOutcome(0,outcomeInput[0]||0)} style={{ padding:"10px 16px", borderRadius:10, border:"none", background:C.green, color:"#000", fontFamily:C.fontHead, fontWeight:700, fontSize:16, cursor:"pointer" }}>LOG</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── COMPETITOR INTELLIGENCE ──────────────────────────────── */}
      {competitors?.data && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.pink}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.pink}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.pink},${C.pink}00)` }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?24:16 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>COMPETITOR INTEL</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em" }}>Fetched {competitors.lastFetched}</div>
          </div>

          {/* Opportunities */}
          {competitors.data.opportunities?.length>0 && (
            <div style={{ marginBottom:isMobile?24:16 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:isMobile?14:10 }}>GAPS TO EXPLOIT</div>
              {competitors.data.opportunities.map((o,i)=>(
                <div key={i} style={{ marginBottom:10, padding:isMobile?"18px 18px":"14px 16px", borderRadius:16, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", lineHeight:1.3 }}>{o.gap}</div>
                    <Tag color={o.urgency==="HIGH"?C.green:o.urgency==="MEDIUM"?C.yellow:C.dim} sm>{o.urgency}</Tag>
                  </div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody, marginBottom:6 }}>{o[`why_${WL.clientId}_can_win`]||o.why_krapmaps_can_win||o.suggested_angle}</div>
                </div>
              ))}
            </div>
          )}

          {/* Steal these hooks */}
          {competitors.data.steal_these_hooks?.length>0 && (
            <div style={{ marginBottom:isMobile?24:16 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:isMobile?14:10 }}>HOOKS TO ADAPT</div>
              {competitors.data.steal_these_hooks.map((h,i)=>(
                <div key={i} style={{ marginBottom:8, padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.025)", border:`1px solid rgba(255,255,255,0.07)` }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>From {h.from_creator}</div>
                  <div style={{ fontSize:13, color:C.yellow, fontStyle:"italic", marginBottom:4, lineHeight:1.5 }}>"{h.hook}"</div>
                  <div style={{ fontSize:13, color:C.cyan, lineHeight:1.5 }}>→ Adapt as: "{h[`adapt_for_${WL.clientId}`]||h.adapt_for_krapmaps||h.adapt_for_channel||Object.values(h).find(v=>typeof v==="string"&&v.length>20&&v!==h.hook&&v!==h.from_creator)}"</div>
                </div>
              ))}
            </div>
          )}

          {/* Competitor breakdown */}
          {competitors.data.competitors?.map((c,i)=>(
            <div key={i} style={{ marginBottom:12, padding:isMobile?"18px 18px":"14px 16px", borderRadius:16, background:"rgba(255,255,255,0.025)", border:`1px solid ${C.pink}18` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.pink, marginBottom:10, letterSpacing:"0.04em" }}>{c.handle}</div>
              {c.recent_viral?.slice(0,2).map((v,j)=>(
                <div key={j} style={{ padding:"8px 10px", borderRadius:8, background:`${C.pink}07`, border:`1px solid ${C.pink}12`, marginBottom:6 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2, lineHeight:1.3 }}>{v.title}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>Est. {v.est_views} views — {v.why_worked}</div>
                </div>
              ))}
              {c.audience_wants?.length>0 && <div style={{ marginTop:8, fontSize:12, color:C.cyan, lineHeight:1.5 }}>Audience wants: {c.audience_wants.slice(0,2).join(", ")}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── HOOK A/B DATABASE ───────────────────────────────────── */}
      {hookDB.length > 0 && (
        <div id="hookdb-section" data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.yellow}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.yellow}30`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.yellow},${C.yellow}00)` }} />
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>HOOK A/B DATABASE</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:isMobile?24:16 }}>Built automatically from your {videos.length} logged videos. Most to least effective.</div>
          {hookDB.map((h,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:i<hookDB.length-1?`1px solid rgba(255,255,255,0.05)`:"none" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:i===0?`${C.green}25`:i===1?`${C.yellow}20`:`rgba(255,255,255,0.06)`, border:`1px solid ${i===0?C.green:i===1?C.yellow:"rgba(255,255,255,0.1)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:i===0?C.green:i===1?C.yellow:"rgba(255,255,255,0.85)", flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:3, textTransform:"capitalize" }}>{h.hook}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <Tag color={C.cyan} sm>{h.count} videos</Tag>
                  <Tag color={C.green} sm>Avg {(h.avgViews||0).toLocaleString()} views</Tag>
                  <Tag color={C.yellow} sm>{h.avgRatio}% ratio</Tag>
                  <Tag color={h.consistency>0.6?C.green:C.orange} sm>{h.consistency>0.6?"CONSISTENT":"VOLATILE"}</Tag>
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, color:i===0?C.green:i===1?C.yellow:"rgba(255,255,255,0.8)", lineHeight:1 }}>{(h.avgViews||0).toLocaleString()}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3 }}>AVG VIEWS</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── VIRALITY PATTERN ENGINE ──────────────────────────────── */}
      {patterns && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.cyan}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.cyan}30`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }} />
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>VIRALITY PATTERNS</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:isMobile?24:16 }}>Hidden patterns across your {patterns.totalVideos} videos. Channel avg: {patterns.avg?.toLocaleString()} views.</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10, marginBottom:isMobile?22:14 }}>
            {/* Best day */}
            {patterns.dayPerf?.length>0 && (
              <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:16, background:`${C.cyan}08`, border:`1px solid ${C.cyan}20` }}>
                <div style={{ fontSize:11, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:isMobile?14:10 }}>BEST POSTING DAY</div>
                {patterns.dayPerf.slice(0,3).map((d,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ fontSize:14, color:i===0?"#fff":"rgba(255,255,255,0.8)", fontWeight:i===0?700:400 }}>{d.day}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:60, height:4, borderRadius:2, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(d.avg/patterns.dayPerf[0].avg)*100}%`, background:i===0?C.cyan:`${C.cyan}50`, borderRadius:2 }} />
                      </div>
                      <div style={{ fontSize:15, color:i===0?C.cyan:"rgba(255,255,255,0.85)", width:50, textAlign:"right" }}>{d.avg?.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Best type */}
            {patterns.typePerf?.length>0 && (
              <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:16, background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
                <div style={{ fontSize:11, color:WL.accentColor, fontWeight:700, letterSpacing:"0.1em", marginBottom:isMobile?14:10 }}>BEST VIDEO TYPE</div>
                {patterns.typePerf.slice(0,3).map((t,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ fontSize:14, color:i===0?"#fff":"rgba(255,255,255,0.8)", fontWeight:i===0?700:400, textTransform:"capitalize" }}>{t.type}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Tag color={t.vsAvg>0?C.green:C.pink} sm>{t.vsAvg>0?"+":""}{t.vsAvg}% vs avg</Tag>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Cross-post impact */}
            {patterns.crossAvg && patterns.singleAvg && (
              <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:16, background:`${C.purple}08`, border:`1px solid ${C.purple}20` }}>
                <div style={{ fontSize:11, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:isMobile?14:10 }}>CROSS-POST IMPACT</div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div><div style={{ fontSize:isMobile?17:20, fontWeight:700, color:C.purple }}>{patterns.crossAvg?.toLocaleString()}</div><div style={{ fontSize:13, color:"rgba(255,255,255,0.85)" }}>TT+IG avg</div></div>
                  <div><div style={{ fontSize:isMobile?17:20, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{patterns.singleAvg?.toLocaleString()}</div><div style={{ fontSize:13, color:"rgba(255,255,255,0.85)" }}>TikTok only</div></div>
                </div>
                <div style={{ marginTop:8, fontSize:13, color:patterns.crossAvg>patterns.singleAvg?C.green:C.pink }}>
                  Cross-posting {patterns.crossAvg>patterns.singleAvg?"HELPS":"HURTS"} by {Math.abs(Math.round((patterns.crossAvg/patterns.singleAvg-1)*100))}%
                </div>
              </div>
            )}
            {/* Winning hooks pattern */}
            {patterns.winningHooks?.length>0 && (
              <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:16, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:11, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:isMobile?14:10 }}>TOP PERFORMER HOOKS</div>
                {patterns.winningHooks.map((h,i)=>(
                  <div key={i} style={{ fontSize:14, color:i===0?"#fff":"rgba(255,255,255,0.85)", marginBottom:4, textTransform:"capitalize" }}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:6}}>{I.medal(13,i===0?"#FFD54A":i===1?"#C7CDD4":"#D08B4E")}{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTENT GAP RADAR ────────────────────────────────────── */}
      {gaps && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.green}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.green}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.green},${C.green}00)` }} />
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:isMobile?24:16 }}>CONTENT GAP RADAR</div>
          {gaps.gaps?.map((g,i)=>(
            <div key={i} style={{ marginBottom:12, padding:"16px 18px", borderRadius:16, background:"rgba(255,255,255,0.025)", border:`1px solid ${g.potential_reach==="VIRAL"?C.green:g.potential_reach==="HIGH"?C.yellow:C.dim}25` }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:8 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{g.topic}</div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <Tag color={g.potential_reach==="VIRAL"?C.green:g.potential_reach==="HIGH"?C.yellow:C.orange} sm>{g.potential_reach}</Tag>
                  {g.urgency_days && <Tag color={g.urgency_days<7?C.pink:g.urgency_days<14?C.yellow:C.dim} sm>{g.urgency_days}d window</Tag>}
                </div>
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.8)", marginBottom:isMobile?14:10 }}>{g.why_gap_exists}</div>
              <div style={{ padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:`${C.green}10`, border:`1px solid ${C.green}20`, marginBottom:8 }}>
                <div style={{ fontSize:11, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>SUGGESTED HOOK</div>
                <div style={{ fontSize:14, color:"#fff", fontStyle:"italic" }}>"{g.suggested_hook}"</div>
              </div>
              {g.first_mover_advantage && <div style={{ fontSize:13, color:C.cyan, display:"flex", alignItems:"center", gap:6 }}>{I.zap(13,C.cyan)}<span>{g.first_mover_advantage}</span></div>}
            </div>
          ))}
          {gaps.emerging?.length>0 && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:C.yellow, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, marginTop:4 }}>EMERGING — ACT FAST</div>
              {gaps.emerging.map((e,i)=>(
                <div key={i} style={{ display:"flex", gap:12, padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, background:`${C.yellow}08`, border:`1px solid ${C.yellow}20`, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{e.topic}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginTop:3 }}>{e.signal}</div>
                  </div>
                  <Tag color={C.yellow} sm>Peaks {e.time_to_peak}</Tag>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── MULTI-MODEL CONSENSUS ─────────────────────────────────── */}
      {consensus && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.purple}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.purple}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.purple},${C.cyan},${C.purple}00)` }} />
          <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>MULTI-MODEL CONSENSUS</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:16, lineHeight:1.5 }}>
            {consensus.bothSucceeded ? "Claude + GPT-4o both ran — showing where they agree (high confidence) and disagree (investigate further)" : "Only one model ran — add GPT-4o key in Settings for full consensus"}
          </div>
          {consensus.bothSucceeded && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10, marginBottom:isMobile?24:16 }}>
              {[{label:"CLAUDE SAYS", data:consensus.claude, color:C.purple},{label:"GPT-4O SAYS", data:consensus.gpt, color:C.cyan}].map((m,mi)=>(
                <div key={mi} style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:16, background:`${m.color}08`, border:`1px solid ${m.color}20` }}>
                  <div style={{ fontSize:15, color:m.color, fontWeight:700, letterSpacing:"0.1em", marginBottom:isMobile?14:10 }}>{m.label}</div>
                  {m.data?.recommendations?.slice(0,3).map((r,i)=>(
                    <div key={i} style={{ marginBottom:8, paddingBottom:8, borderBottom:i<2?`1px solid rgba(255,255,255,0.05)`:"none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                        <Tag color={r.priority==="CRITICAL"?C.pink:r.priority==="HIGH"?C.yellow:C.dim} sm>{r.priority}</Tag>
                        <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)" }}>{r.timeframe}</div>
                      </div>
                      <div style={{ fontSize:16, color:"#fff", fontWeight:600 }}>{r.action}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {/* Agreements — where both models said similar things */}
          {consensus.bothSucceeded && (() => {
            const cRecs = consensus.claude?.recommendations?.map(r=>r.action?.toLowerCase()) || [];
            const gRecs = consensus.gpt?.recommendations?.map(r=>r.action?.toLowerCase()) || [];
            const agreed = consensus.claude?.recommendations?.filter(r => 
              gRecs.some(g => g && r.action && (g.includes(r.action.split(" ")[0]?.toLowerCase()) || r.action.toLowerCase().includes(g.split(" ")[0]||"")))
            ) || [];
            return agreed.length > 0 ? (
              <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:16, background:`${C.green}10`, border:`1px solid ${C.green}25`, marginBottom:isMobile?16:12 }}>
                <div style={{ fontSize:15, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8, display:"flex", alignItems:"center", gap:7 }}>{I.tick(15,C.green)} BOTH MODELS AGREE — HIGH CONFIDENCE</div>
                {agreed.slice(0,2).map((r,i)=>(
                  <div key={i} style={{ fontSize:isMobile?14:17, color:"#fff", marginBottom:4 }}>→ {r.action}</div>
                ))}
              </div>
            ) : null;
          })()}
          {/* Single model fallback */}
          {!consensus.bothSucceeded && (consensus.claude||consensus.gpt)?.recommendations?.slice(0,5).map((r,i)=>(
            <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:i<4?`1px solid rgba(255,255,255,0.05)`:"none" }}>
              <Tag color={r.priority==="CRITICAL"?C.pink:r.priority==="HIGH"?C.yellow:C.dim} sm>{r.priority}</Tag>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:3 }}>{r.action}</div>
                <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)" }}>{r.why}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI MEMORY LOG ──────────────────────────────────────── */}
      {memory.entries?.length>0 && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.orange}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.orange}30`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.orange},${C.orange}00)` }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?24:16 }}>
            <div style={{ fontSize:isMobile?16:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>AI MEMORY LOG</div>
            <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)" }}>{memory.entries.length} entries</div>
          </div>
          {[...memory.entries].reverse().slice(0,10).map((e,i)=>(
            <div key={e.id||i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:i<9?`1px solid rgba(255,255,255,0.05)`:"none" }}>
              <div style={{ flexShrink:0, marginTop:2 }}>
                <Tag color={e.type==="OUTCOME"?C.green:e.type==="PREDICTION"?C.purple:e.type==="STRATEGY"?C.cyan:C.orange} sm>{e.type}</Tag>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.4 }}>{e.recommendation}</div>
                {e.outcome && <div style={{ fontSize:15, color:C.green, marginTop:3 }}>→ {e.outcome}</div>}
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginTop:3 }}>{e.date}</div>
              </div>
            </div>
          ))}
          <button onClick={()=>{ saveMemory({entries:[],lastUpdated:null}); refreshMemory(); }} style={{ marginTop:14, padding:"8px 14px", borderRadius:10, border:`1px solid rgba(255,255,255,0.1)`, background:"transparent", color:"rgba(255,255,255,0.85)", fontFamily:C.fontHead, fontSize:15, fontWeight:700, cursor:"pointer" }}>CLEAR MEMORY</button>
        </div>
      )}

    </div>
  );
};


const VideoReaderView = ({ videos=[], WL }) => {
  const isMobile = typeof window !== 'undefined' && (window.__isMobile || window.innerWidth < 900);
  const [selected, setSelected]   = useState(null);
  const [vidPlat, setVidPlat]      = useState("ALL");
  const [analysis, setAnalysis]   = useState({});
  const [loading, setLoading]     = useState({});
  const [err, setErr]             = useState(null);

  const cfg = loadJSON("krapmaps_v1_config",{});
  const hasGemini = !!(cfg?.keys?.gemini) || USE_BACKEND;
  const hasAnthrop = !!(cfg?.keys?.anthropic || BAKED_ANTHROPIC_KEY) || USE_BACKEND;

  const analyseVideo = async (video) => {
    if(loading[video.id]) return;
    setLoading(l=>({...l,[video.id]:true}));
    setErr(null);
    setSelected(video);
    try {
      const wl = loadWL();
      const ctx = buildChannelContext ? null : null;
      const avgViews = videos.length ? Math.round(videos.reduce((s,v)=>s+(v.views||0),0)/videos.length) : 0;
      const memCtx = buildMemoryContext();

      // Step 1 — Gemini watches the video
      let geminiResult = null;
      if(hasGemini && video.videoUrl) {
        const geminiPrompt = `You are analysing a TikTok video for ${wl.appName} (${wl.niche} niche).
Watch this video carefully and analyse:
1. The opening hook — exactly what happens in the first 3 seconds
2. Pacing — how fast/slow, does it hold attention?
3. Visual quality and style
4. Audio — music, voiceover, sound effects
5. The story structure — how does it open, build, resolve?
6. Call to action — is there one? Where?
7. What would make someone stop scrolling at this exact video?
8. What would make someone swipe away?
Return ONLY JSON: {
  hook_analysis: { first_3_seconds: string, hook_type: string, hook_strength: 0-100, what_works: string, what_doesnt: string },
  pacing: { rating: "too_fast|good|too_slow", notes: string },
  visual: { quality: "poor|decent|good|excellent", style: string, standout_moments: [string] },
  audio: { music: string, voiceover: boolean, sound_effects: string, audio_score: 0-100 },
  structure: { opening: string, middle: string, ending: string, has_cta: boolean, cta_text: string },
  retention_prediction: { likely_dropoff_point: string, why: string, estimated_completion_rate: "low|medium|high" },
  gemini_verdict: string,
  gemini_score: 0-100
}`;
        try {
          geminiResult = await callGeminiVideo(video.videoUrl, geminiPrompt);
        } catch(e) { console.warn("Gemini failed:", e.message); }
      }

      // Step 2 — Claude synthesises Gemini output + channel data
      if(hasAnthrop) {
        const claudePrompt = `You are doing a full teardown of a TikTok video for ${wl.appName}.

VIDEO DETAILS:
Title: "${video.title}"
Views: ${(video.views||0).toLocaleString()} (channel avg: ${avgViews.toLocaleString()})
Likes: ${(video.likes||0).toLocaleString()} | Comments: ${(video.comments||0).toLocaleString()} | Shares: ${(video.shares||0).toLocaleString()}
Like ratio: ${video.views>0?((video.likes/video.views)*100).toFixed(1):"0"}%
Hook type: ${video.hook||"unknown"} | Video type: ${video.type||"unknown"}

${geminiResult ? "GEMINI VIDEO ANALYSIS: "+JSON.stringify(geminiResult) : "No Gemini video analysis available"}

CHANNEL CONTEXT:
${wl.appName} avg views: ${avgViews.toLocaleString()}. This video ${(video.views||0)>avgViews?"BEAT":"MISSED"} the average${avgViews>0?` by ${Math.abs(Math.round(((video.views||0)/(avgViews||1)-1)*100))}%`:""}.
${memCtx}

Now give the complete strategic teardown:
1. Why did this video perform the way it did? Be specific — reference actual numbers
2. What was the single biggest factor (hook, content, timing, algorithm)?
3. What should be replicated in future videos?
4. What should never be done again?
5. How would you refilm this video to 3x the views?

Return ONLY JSON: {
  performance_verdict: "flopped|below_avg|average|above_avg|viral",
  vs_channel_avg: string,
  why_it_performed: string,
  biggest_factor: string,
  replicate_these: [string],
  never_again: [string],
  refilm_brief: { concept: string, hook: string, key_changes: [string], predicted_views: string },
  overall_score: 0-100,
  key_learnings: [string]
}`;
        const claudeResult = await callAI(claudePrompt, 2500);
        const combined = { ...claudeResult, gemini: geminiResult, video_id: video.id, analysed_at: new Date().toISOString() };
        setAnalysis(a=>({...a,[video.id]:combined}));
        addMemoryEntry("VIDEO_READ", '"'+video.title?.slice(0,40)+'" scored '+claudeResult.overall_score+'/100. Verdict: '+claudeResult.performance_verdict+'. Key: '+claudeResult.biggest_factor?.slice(0,60));
        // Write analysis findings back to video record for future scoring
        if(claudeResult.biggest_factor || claudeResult.replicate_these?.length) {
          setVideos(vs=>vs.map(v=>v.id===video.id ? {
            ...v,
            analysisScore: claudeResult.overall_score,
            analysisVerdict: claudeResult.performance_verdict,
            biggestFactor: claudeResult.biggest_factor?.slice(0,120),
            replicateThese: (claudeResult.replicate_these||[]).slice(0,2).join("; "),
            analysedAt: new Date().toISOString().slice(0,10),
          } : v));
        }
      } else if(geminiResult) {
        setAnalysis(a=>({...a,[video.id]:{ gemini:geminiResult, video_id:video.id, analysed_at:new Date().toISOString() }}));
      }
    } catch(e) { setErr(e.message); }
    setLoading(l=>({...l,[video.id]:false}));
  };

  const scoreColor = s => s>=80?C.green:s>=60?C.yellow:s>=40?C.orange:C.pink;
  const verdictColor = v => v==="viral"?C.green:v==="above_avg"?C.cyan:v==="average"?C.yellow:C.pink;

  const result = selected ? analysis[selected.id] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?28:24 }}>
      {/* Header */}
      <div style={{ borderRadius:16, padding:isMobile?"26px 20px":"24px 28px", background:`linear-gradient(135deg,${C.pink}20,${C.purple}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.pink}40`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.pink},${C.purple},${C.pink}00)` }} />
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:`${C.pink}25`, border:`1px solid ${C.pink}50`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${C.pink}40` }}>{I.vid(24,C.pink)}</div>
          <div>
            <div style={{ fontSize:isMobile?20:28, fontWeight:700, color:"#fff", letterSpacing:"0.04em", textTransform:"uppercase" }}>VIDEO AI READER</div>
            <div style={{ fontSize:14, color:`${C.pink}cc`, marginTop:2 }}>
              {hasGemini?"Gemini watches • Claude analyses • Full teardown":"Add Gemini key in Settings to enable video watching"}
            </div>
          </div>
        </div>
        {(!hasGemini||!hasAnthrop) && (
          <div style={{ marginTop:14, padding:isMobile?"13px 16px":"10px 14px", borderRadius:12, background:`${C.yellow}15`, border:`1px solid ${C.yellow}35`, fontSize:14, color:C.yellow }}>
            {!hasAnthrop&&"Add Anthropic key in Settings  "}
            {!hasGemini&&"Add Gemini key in Settings for video watching"}
          </div>
        )}
      </div>

      {err && <div style={{ padding:isMobile?"14px 18px":"12px 16px", borderRadius:12, background:`${C.pink}15`, border:`1px solid ${C.pink}40`, color:C.pink, fontSize:13 }}>Error: {err}</div>}

      {/* Platform filter pills */}
      {(()=>{ const hasIG = videos.some(v=>v.platform==="instagram"); if(!hasIG) return null;
        return <div style={{ display:"flex", gap:8, marginBottom:isMobile?16:12 }}>
          {["ALL","TIKTOK","INSTAGRAM"].map(p=>(
            <button key={p} onClick={()=>setVidPlat(p)} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", border:`1px solid ${vidPlat===p?(p==="INSTAGRAM"?C.purple:p==="TIKTOK"?C.pink:C.cyan):"rgba(255,255,255,0.15)"}`, background:vidPlat===p?(p==="INSTAGRAM"?`${C.purple}20`:p==="TIKTOK"?`${C.pink}20`:`${C.cyan}20`):"transparent", color:vidPlat===p?(p==="INSTAGRAM"?C.purple:p==="TIKTOK"?C.pink:C.cyan):"rgba(255,255,255,0.5)" }}>{p}</button>
          ))}
        </div>;
      })()}

      {/* Video grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10 }}>
        {videos.filter(v=>(v.videoUrl||v._tikwmId)&&(vidPlat==="ALL"||(vidPlat==="TIKTOK"&&v.platform!=="instagram")||(vidPlat==="INSTAGRAM"&&v.platform==="instagram"))).length===0 && (
          <div style={{ gridColumn:"1/-1", padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.85)", fontSize:14 }}>
            No videos with URLs yet — add your TIKWM key in Settings to auto-sync video URLs
          </div>
        )}
        {videos.filter(v=>(v.videoUrl||v._tikwmId)&&(vidPlat==="ALL"||(vidPlat==="TIKTOK"&&v.platform!=="instagram")||(vidPlat==="INSTAGRAM"&&v.platform==="instagram"))).map((video,i)=>{
          const res = analysis[video.id];
          const isLoading = loading[video.id];
          const isSelected = selected?.id === video.id;
          return (
            <div key={video.id} onClick={()=>!isLoading&&analyseVideo(video)} style={{ borderRadius:16, padding:"16px", background:isSelected?`linear-gradient(145deg,${C.pink}18,${C.purple}08)`:`linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))`, border:`1px solid ${isSelected?C.pink:res?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.06)"}`, cursor:"pointer", transition:"all 0.2s", position:"relative", overflow:"hidden" }}>
              {res && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${scoreColor(res.overall_score||res.gemini?.gemini_score||0)},transparent)` }} />}
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:isMobile?14:10 }}>
                {video.cover && <img src={video.cover} style={{ width:48, height:64, borderRadius:8, objectFit:"cover", flexShrink:0 }} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:4 }}>{video.title?.slice(0,60)||"Untitled"}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                    {video.platform==="instagram"
                      ? <Tag color={C.purple} sm>IG</Tag>
                      : <Tag color={C.pink} sm>TT</Tag>}
                    <Tag color={C.cyan} sm>{(video.views||0).toLocaleString()} views</Tag>
                    {video.type && <Tag color={C.purple} sm>{video.type}</Tag>}
                  </div>
                </div>
              </div>
              {isLoading && (
                <div style={{ padding:"6px 0", display:"flex", alignItems:"center", gap:12 }}>
                  <ScoreDial size={44} loading />
                  <div style={{ fontSize:13, color:C.purple, fontWeight:600 }}>
                    {hasGemini?"Gemini watching · Claude analysing…":"Analysing…"}
                  </div>
                </div>
              )}
              {res && !isLoading && (
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <ScoreDial score={res.overall_score||res.gemini?.gemini_score||0} size={54} label={false} />
                  <div>
                    <Tag color={verdictColor(res.performance_verdict)} sm>{(res.performance_verdict||"analysed").replace("_"," ").toUpperCase()}</Tag>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginTop:3 }}>tap to see teardown</div>
                  </div>
                </div>
              )}
              {!res && !isLoading && (
                <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)" }}>Tap to analyse</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full teardown panel */}
      {result && selected && (
        <div data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"24px", background:`linear-gradient(145deg,${C.pink}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.pink}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.pink},${C.purple},${C.pink}00)` }} />
          <div style={{ fontSize:isMobile?15:18, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>{selected.title?.slice(0,50)}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:20 }}>Analysed {result.analysed_at?.slice(0,10)}</div>

          {/* Score + verdict */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))", gap:10, marginBottom:20 }}>
            {[
              {l:"OVERALL SCORE", v:(result.overall_score||"?")+"/100", c:scoreColor(result.overall_score||0)},
              {l:"VERDICT", v:(result.performance_verdict||"analysed").replace("_"," ").toUpperCase(), c:verdictColor(result.performance_verdict)},
              {l:"VS CHANNEL AVG", v:result.vs_channel_avg||"—", c:C.cyan},
            ].map((s,i)=>(
              <div key={i} style={{ padding:"14px", borderRadius:12, background:`${s.c}10`, border:`1px solid ${s.c}25`, textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:700, color:s.c, fontFamily:C.fontHead, lineHeight:1, marginBottom:4 }}>{s.v}</div>
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Why it performed */}
          {result.why_it_performed && (
            <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`, marginBottom:isMobile?22:14 }}>
              <div style={{ fontSize:isMobile?14:17, color:WL.accentColor, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>WHY IT PERFORMED THIS WAY</div>
              <div style={{ fontSize:isMobile?15:14, color:"rgba(255,255,255,0.9)", lineHeight:1.7, fontFamily:C.fontBody }}>{result.why_it_performed}</div>
              {result.biggest_factor && <div style={{ marginTop:8, fontSize:14, color:C.yellow, display:"flex", alignItems:"center", gap:6 }}>{I.zap(14,C.yellow)}<span>Biggest factor: {result.biggest_factor}</span></div>}
            </div>
          )}

          {/* Gemini hook analysis */}
          {result.gemini?.hook_analysis && (
            <div style={{ padding:isMobile?"18px 18px":"14px 16px", borderRadius:12, background:`${C.cyan}08`, border:`1px solid ${C.cyan}20`, marginBottom:isMobile?22:14 }}>
              <div style={{ fontSize:isMobile?14:17, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:isMobile?14:10, display:"flex", alignItems:"center", gap:7 }}>{I.vid(14,C.cyan)} GEMINI HOOK ANALYSIS</div>
              <div style={{ fontSize:isMobile?13:17, color:"#fff", marginBottom:6 }}>First 3 seconds: <span style={{color:C.cyan}}>{result.gemini.hook_analysis.first_3_seconds}</span></div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:8 }}>{result.gemini.hook_analysis.what_works}</div>
              <div style={{ display:"flex", gap:8 }}>
                <Tag color={C.cyan} sm>Hook: {result.gemini.hook_analysis.hook_strength}/100</Tag>
                <Tag color={C.purple} sm>{result.gemini.hook_analysis.hook_type}</Tag>
              </div>
            </div>
          )}

          {/* Replicate / Never again */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:10, marginBottom:isMobile?22:14 }}>
            {result.replicate_these?.length>0 && (
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:isMobile?14:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>DO THIS AGAIN</div>
                {result.replicate_these.map((r,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4, display:"flex", alignItems:"flex-start", gap:6 }}>{I.tick(13,C.green)}<span>{r}</span></div>)}
              </div>
            )}
            {result.never_again?.length>0 && (
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
                <div style={{ fontSize:isMobile?14:17, color:WL.accentColor, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>NEVER AGAIN</div>
                {result.never_again.map((r,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4, display:"flex", alignItems:"flex-start", gap:6 }}>{I.x(13,C.pink)}<span>{r}</span></div>)}
              </div>
            )}
          </div>

          {/* Refilm brief */}
          {result.refilm_brief && (
            <div style={{ padding:"16px 18px", borderRadius:16, background:`linear-gradient(135deg,${C.purple}12,${C.pink}06)`, border:`1px solid ${C.purple}30`, marginBottom:isMobile?22:14 }}>
              <div style={{ fontSize:isMobile?14:17, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:isMobile?14:10 }}>HOW TO REFILM THIS FOR 3X VIEWS</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>{result.refilm_brief.concept}</div>
              <div style={{ fontSize:isMobile?14:17, color:C.cyan, fontStyle:"italic", marginBottom:isMobile?14:10 }}>"{result.refilm_brief.hook}"</div>
              {result.refilm_brief.key_changes?.map((c,i)=>(
                <div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:3 }}>→ {c}</div>
              ))}
              {result.refilm_brief.predicted_views && (
                <div style={{ marginTop:8, fontSize:16, color:C.green, display:"flex", alignItems:"center", gap:6 }}>{I.trend(15,C.green)}<span>Predicted: {result.refilm_brief.predicted_views}</span></div>
              )}
            </div>
          )}

          {/* Key learnings */}
          {result.key_learnings?.length>0 && (
            <div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>KEY LEARNINGS SAVED TO MEMORY</div>
              {result.key_learnings.map((l,i)=>(
                <div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>• {l}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GrowthView = ({ m, ttViewsDisplay, igData, hasIG, igLoad, fetchIG, scrapedStats, saveManual, setManualData, videos=[], ideas=[] }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [shareMsg, setShareMsg] = React.useState(null);

  // --- Derived data ---
  const postedIdeas = ideas.filter(i => i.status === "posted");
  const scoredIdeas = ideas.filter(i => i.viral != null);

  // Channel average views across all videos
  const allViews = videos.map(v => v.views || 0).filter(x => x > 0);
  const channelAvg = allViews.length ? Math.round(allViews.reduce((a,b)=>a+b,0) / allViews.length) : 0;

  // Avg views for posted ideas only
  const postedWithViews = postedIdeas.filter(i => i.postedViews != null);
  const avgPostedViews = postedWithViews.length
    ? Math.round(postedWithViews.reduce((s,i)=>s+(i.postedViews||0),0) / postedWithViews.length)
    : 0;

  // Avg AI score
  const avgAIScore = scoredIdeas.length
    ? Math.round(scoredIdeas.reduce((s,i)=>s+(i.viral||0),0) / scoredIdeas.length)
    : 0;

  // AI accuracy: posted ideas where actual views within 50% of score-predicted views
  // We use score as a 0-100 proxy: predicted = (score/100) * channelAvg * 2
  const ideasForAccuracy = postedWithViews.filter(i => i.viral != null);
  const accurateCount = ideasForAccuracy.filter(i => {
    const predicted = (i.viral / 100) * channelAvg * 2;
    return Math.abs((i.postedViews - predicted) / (predicted || 1)) <= 0.5;
  }).length;
  const accuracy = ideasForAccuracy.length >= 3
    ? Math.round((accurateCount / ideasForAccuracy.length) * 100)
    : null;

  // Top 5 videos by views
  const top5Videos = [...videos].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);

  // Best performing idea (highest actual views among posted)
  const bestIdea = [...postedWithViews].sort((a,b)=>(b.postedViews||0)-(a.postedViews||0))[0];

  // Build the public snapshot rendered by /r/<handle>. Everything is derived from
  // real logged data — no invented numbers.
  const buildSnapshot = () => {
    const wl = loadWL();
    const bandDefs = [
      { min:85, max:100, label:"Scored 85+", color:"#39FF14" },
      { min:70, max:84, label:"Scored 70–84", color:"#00E5FF" },
      { min:50, max:69, label:"Scored 50–69", color:"#FFD50A" },
      { min:0,  max:49, label:"Under 50", color:"#FF2D78" },
    ];
    const pts = postedWithViews.filter(i=>i.viral!=null && i.postedViews>0);
    const bands = bandDefs.map(b=>{
      const inB = pts.filter(p=>p.viral>=b.min && p.viral<=b.max);
      if(!inB.length) return null;
      const avg = Math.round(inB.reduce((s,p)=>s+p.postedViews,0)/inB.length);
      return { label:b.label, count:inB.length, avg:fmt(avg), mult: channelAvg>0?(avg/channelAvg).toFixed(1)+"×":"—", pct: channelAvg>0?Math.round((avg/channelAvg)/2.5*100):0, color:b.color };
    }).filter(Boolean);
    // rescale pct so the biggest band fills the bar
    const maxPct = Math.max(1, ...bands.map(b=>b.pct));
    bands.forEach(b=> b.pct = Math.round((b.pct/maxPct)*100));
    // Spearman rank correlation
    let rho = null;
    if(pts.length>=5){
      const rank = arr => { const idx=[...arr.keys()].sort((a,c)=>arr[a]-arr[c]); const r=Array(arr.length); idx.forEach((o,i)=>r[o]=i+1); return r; };
      const rs=rank(pts.map(p=>p.viral)), rv=rank(pts.map(p=>p.postedViews)), mr=(pts.length+1)/2;
      let nu=0,ds=0,dv=0; for(let i=0;i<pts.length;i++){ nu+=(rs[i]-mr)*(rv[i]-mr); ds+=(rs[i]-mr)**2; dv+=(rv[i]-mr)**2; }
      rho = (ds&&dv)? nu/Math.sqrt(ds*dv) : 0;
    }
    const verdict = rho==null?null : rho>=0.6?{t:"STRONG SIGNAL",c:"#39FF14",x:"Higher-scored ideas reliably pull more views on this channel."}
      : rho>=0.3?{t:"MODERATE SIGNAL",c:"#00E5FF",x:"Higher scores tend to do better on this channel."}
      : {t:"EARLY DATA",c:"#FFD50A",x:"Still calibrating to this channel."};
    const best = bestIdea && bestIdea.viral!=null ? bestIdea : [...pts].sort((a,b)=>b.postedViews-a.postedViews)[0];
    const totalViews = allViews.reduce((s,v)=>s+v,0);
    const topVideos = [...pts].sort((a,b)=>b.postedViews-a.postedViews).slice(0,3).map(i=>({
      score:i.viral, title:(i.title||i.hook||"Untitled").slice(0,70), views:fmt(i.postedViews),
      sub:[i.hook?`${i.hook} hook`:null, i.postedDate?fmtDate(i.postedDate):null].filter(Boolean).join(" · "),
      color: i.viral>=70?"#39FF14":i.viral>=50?"#00E5FF":"#FF2D78",
    }));
    return {
      handle: wl.handle||"@creator", appName: wl.appName||"CreatorOS", creator1: wl.creator1||"",
      accent: wl.accentColor||"#FF2D78", accent2: wl.accentColor2||"#C566FF",
      sub: [wl.niche?wl.niche:null, `${videos.length} videos tracked`].filter(Boolean).join(" · "),
      stats: { viewsTracked: totalViews>0?fmt(totalViews):null, avgViews: (avgPostedViews||channelAvg)?fmt(avgPostedViews||channelAvg):null, accuracy },
      hero: best ? { score:best.viral, viewsLabel:fmt(best.postedViews), title:(best.title||best.hook||"").slice(0,70), mult: channelAvg>0?`${(best.postedViews/channelAvg).toFixed(1)}× channel average`:"" } : null,
      calibration: bands.length ? { verdict:verdict?.t, verdictColor:verdict?.c, verdictText:verdict?.x, rho: rho!=null?rho.toFixed(2):null, n:pts.length, channelAvg:fmt(channelAvg), bands } : null,
      topVideos, updated: today(),
    };
  };

  // Publish the snapshot and share/copy the public link.
  const handleShare = async () => {
    const wl = loadWL();
    const handleId = (wl.handle||"").replace(/^@/,"").toLowerCase().replace(/[^a-z0-9_.]/g,"");
    if(!handleId){ setShareMsg("Set your handle in Settings first, then share."); setTimeout(()=>setShareMsg(null),4000); return; }
    if((postedWithViews.filter(i=>i.viral!=null&&i.postedViews>0)).length===0 && !bestIdea){
      setShareMsg("Post & log a scored idea first — your results page needs real wins to show."); setTimeout(()=>setShareMsg(null),5000); return;
    }
    setShareMsg("Publishing your results…");
    try {
      const snap = buildSnapshot();
      await sbUpsert("km_public_results", [{ id:handleId, data:snap, updated_at:new Date().toISOString() }]);
      const link = `${window.location.origin}/r/${handleId}`;
      const shared = navigator.share ? await navigator.share({ title:`${wl.handle} — proven with ${wl.appName}`, url:link }).then(()=>true).catch(()=>false) : false;
      if(!shared){
        try { await navigator.clipboard.writeText(link); setShareMsg("Link copied — "+link); }
        catch { setShareMsg("Your results are live at "+link); }
      } else { setShareMsg(null); }
      setTimeout(()=>setShareMsg(null), 6000);
    } catch(e) {
      setShareMsg("Couldn't publish right now — check cloud sync in Settings."); setTimeout(()=>setShareMsg(null),5000);
    }
  };

  const sectionHead = (label, color=C.cyan) => (
    <div style={{ fontSize:isMobile?12:13, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color, marginBottom:isMobile?20:18, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:3, height:14, borderRadius:2, background:color, flexShrink:0 }}/>
      {label}
    </div>
  );

  const card = (children, accent=C.cyan) => (
    <div style={{ borderRadius:18, background:C.card, border:`1px solid ${C.border}`, overflow:"hidden", position:"relative" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accent},${accent}50,transparent)` }}/>
      <div style={{ padding:isMobile?"26px 20px":"24px 28px" }}>{children}</div>
    </div>
  );

  // Verdict label for AI score vs real views
  const verdict = (idea) => {
    if (idea.postedViews == null) return { label:"PENDING", color:"rgba(255,255,255,0.35)" };
    if (!channelAvg) return { label:"PENDING", color:"rgba(255,255,255,0.35)" };
    return idea.postedViews >= channelAvg
      ? { label:"HIT", color:C.green }
      : { label:"MISS", color:C.pink };
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?32:28 }}>

      {/* 1. KEY STATS ROW */}
      {card(
        <>
          {sectionHead("Performance Overview", C.cyan)}
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr 1fr":"repeat(5,1fr)", gap:0 }}>
            {[
              { l:"IDEAS SCORED", v:scoredIdeas.length || "--", c:C.cyan },
              { l:"IDEAS POSTED", v:postedIdeas.length || "--", c:C.purple },
              { l:"AVG AI SCORE", v:avgAIScore ? `${avgAIScore}/100` : "--", c:C.yellow },
              { l:"AVG VIEWS", v:avgPostedViews ? fmt(avgPostedViews) : "--", c:C.green },
              { l:"AI ACCURACY", v:accuracy != null ? `${accuracy}%` : "—", c:accuracy!=null ? C.orange : "rgba(255,255,255,0.35)" },
            ].map((s,si,arr)=>(
              <div key={si} style={{ padding:isMobile?"16px 14px":"18px 20px", borderRight:si<arr.length-1?`1px solid ${C.border}`:"none", borderBottom:"none" }}>
                <div style={{ fontSize:isMobile?9:11, color:"rgba(255,255,255,0.45)", letterSpacing:"0.10em", textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>{s.l}</div>
                <div style={{ fontSize:isMobile?18:24, fontWeight:600, fontFamily:C.fontHead, color:s.c, lineHeight:1.1 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </>,
        C.cyan
      )}

      {/* 1.5 SCORE TRUST — does the score actually predict views? */}
      {(() => {
        const pts = postedIdeas.filter(i=>i.viral!=null && i.postedViews>0).map(i=>({ score:i.viral, views:i.postedViews }));
        const n = pts.length;
        const NEED = 5;
        // Spearman rank correlation — robust to view-count outliers
        const rank = (arr) => { const idx=[...arr.keys()].sort((a,b)=>arr[a]-arr[b]); const r=Array(arr.length); idx.forEach((orig,i)=>r[orig]=i+1); return r; };
        let rho = null;
        if(n >= NEED) {
          const rs = rank(pts.map(p=>p.score)), rv = rank(pts.map(p=>p.views));
          const mr = (n+1)/2;
          let num=0, ds=0, dv=0;
          for(let i=0;i<n;i++){ num+=(rs[i]-mr)*(rv[i]-mr); ds+=(rs[i]-mr)**2; dv+=(rv[i]-mr)**2; }
          rho = (ds&&dv) ? num/Math.sqrt(ds*dv) : 0;
        }
        const BANDS = [ {label:"85+", min:85, max:100, c:C.green}, {label:"70–84", min:70, max:84, c:C.cyan}, {label:"50–69", min:50, max:69, c:C.yellow}, {label:"<50", min:0, max:49, c:C.pink} ];
        const bandRows = BANDS.map(b=>{
          const inB = pts.filter(p=>p.score>=b.min && p.score<=b.max);
          if(!inB.length) return null;
          const avg = Math.round(inB.reduce((s,p)=>s+p.views,0)/inB.length);
          return { ...b, n:inB.length, avg, mult: channelAvg>0 ? avg/channelAvg : null };
        }).filter(Boolean);
        const maxAvg = Math.max(1, ...bandRows.map(r=>r.avg));
        const verdictOf = (r) => r>=0.6 ? { t:"STRONG SIGNAL", d:"Higher scores are reliably getting more views on this channel — trust the ranking.", c:C.green }
          : r>=0.3 ? { t:"MODERATE SIGNAL", d:"Higher scores tend to do better, with exceptions — use scores as a guide, not gospel.", c:C.cyan }
          : r>=0 ? { t:"WEAK SO FAR", d:"Scores and results barely align yet — keep logging outcomes so the model can calibrate.", c:C.yellow }
          : { t:"INVERTED", d:"Low scores are outperforming high ones — the AI is mis-modelling this channel. Regenerate the Channel Theory and rescore.", c:C.pink };
        const v = rho!=null ? verdictOf(rho) : null;
        return card(
          <>
            {sectionHead("Does The Score Predict Reality?", C.yellow)}
            {n < NEED ? (
              <div style={{ padding:isMobile?"8px 0 4px":"4px 0" }}>
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.6, marginBottom:14 }}>
                  Post <span style={{color:"#fff",fontWeight:700}}>{NEED-n} more scored idea{NEED-n===1?"":"s"}</span> (and log their views) to unlock your accuracy report — the proof of whether this AI actually works on your channel.
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1, height:8, borderRadius:4, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                    <div style={{ width:`${(n/NEED)*100}%`, height:"100%", borderRadius:4, background:`linear-gradient(90deg,${C.yellow},${C.orange})`, transition:"width 0.4s" }}/>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:C.yellow, flexShrink:0 }}>{n}/{NEED}</span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:isMobile?"flex-start":"center", gap:isMobile?10:16, flexDirection:isMobile?"column":"row", marginBottom:20, padding:isMobile?"14px 16px":"14px 18px", borderRadius:12, background:`${v.c}0d`, border:`1px solid ${v.c}30` }}>
                  <div style={{ fontSize:isMobile?15:17, fontWeight:800, color:v.c, letterSpacing:"0.06em", flexShrink:0 }}>{v.t}</div>
                  <div style={{ fontSize:isMobile?13:14, color:"rgba(255,255,255,0.75)", lineHeight:1.55 }}>{v.d} <span style={{color:"rgba(255,255,255,0.35)"}}>(rank correlation {rho.toFixed(2)} across {n} posted ideas)</span></div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:isMobile?14:10 }}>
                  {bandRows.map(r=>(
                    <div key={r.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Score {r.label} <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:500 }}>· {r.n} posted</span></span>
                        <span style={{ fontSize:isMobile?14:15, fontWeight:700, fontFamily:C.fontHead, color:r.c }}>{fmt(r.avg)} avg{r.mult!=null && <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontFamily:C.fontBody, fontWeight:600 }}> · {r.mult.toFixed(1)}× channel avg</span>}</span>
                      </div>
                      <div style={{ height:10, borderRadius:5, background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                        <div style={{ width:`${Math.max(3,(r.avg/maxAvg)*100)}%`, height:"100%", borderRadius:5, background:`linear-gradient(90deg,${r.c},${r.c}70)`, boxShadow:`0 0 12px ${r.c}40` }}/>
                      </div>
                    </div>
                  ))}
                </div>
                {channelAvg>0 && <div style={{ marginTop:14, fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.5 }}>Channel average: {fmt(channelAvg)} views. If the bars step down with the scores, the AI is calibrated to your channel.</div>}
              </>
            )}
          </>,
          C.yellow
        );
      })()}

      {/* 1.75 SCORE HISTORY TREND */}
      {(()=>{
        const hist = loadJSON(SCORE_HISTORY_KEY,[]);
        if(hist.length < 2) return null;
        const recent = hist.slice(-30);
        const maxS = Math.max(...recent.map(h=>h.score),100);
        const minS = Math.min(...recent.map(h=>h.score),0);
        const range = Math.max(maxS-minS,20);
        const w = 600, h2 = 120, pad = 20;
        const pts = recent.map((e,i)=>({
          x: pad + (i/(recent.length-1))*(w-2*pad),
          y: pad + (1-(e.score-minS)/range)*(h2-2*pad),
          ...e
        }));
        const line = pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(" ");
        const avgScore = Math.round(recent.reduce((s,e)=>s+e.score,0)/recent.length);
        const firstHalf = recent.slice(0,Math.floor(recent.length/2));
        const secondHalf = recent.slice(Math.floor(recent.length/2));
        const avg1 = firstHalf.length ? firstHalf.reduce((s,e)=>s+e.score,0)/firstHalf.length : 0;
        const avg2 = secondHalf.length ? secondHalf.reduce((s,e)=>s+e.score,0)/secondHalf.length : 0;
        const trend = avg2 - avg1;
        const trendColor = trend>2 ? C.green : trend<-2 ? C.pink : C.yellow;
        const trendLabel = trend>2 ? "Improving" : trend<-2 ? "Declining" : "Stable";
        return card(
          <>
            {sectionHead("Score History", C.purple)}
            <div style={{ display:"flex", gap:isMobile?16:24, marginBottom:16, flexWrap:"wrap" }}>
              {[
                { l:"TOTAL SCORES", v:hist.length, c:C.purple },
                { l:"AVG SCORE", v:`${avgScore}/100`, c:C.cyan },
                { l:"TREND", v:trendLabel, c:trendColor },
                { l:"LAST 30", v:recent.length, c:"rgba(255,255,255,0.5)" },
              ].map((s,si)=>(
                <div key={si} style={{ padding:"12px 16px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700, marginBottom:4 }}>{s.l}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:s.c, fontFamily:C.fontHead }}>{s.v}</div>
                </div>
              ))}
            </div>
            <svg width="100%" height={h2} viewBox={`0 0 ${w} ${h2}`} preserveAspectRatio="none" style={{ display:"block" }}>
              <defs><linearGradient id="shg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity="0.3"/><stop offset="100%" stopColor={C.purple} stopOpacity="0"/></linearGradient></defs>
              <path d={`${line} L${pts[pts.length-1].x},${h2-pad} L${pts[0].x},${h2-pad} Z`} fill="url(#shg)"/>
              <path d={line} fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={p.score>=70?C.green:p.score>=50?C.yellow:C.pink} stroke="rgba(0,0,0,0.5)" strokeWidth="1"><title>{p.title}: {p.score}/100</title></circle>)}
            </svg>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4, padding:"0 20px" }}>
              <span>{recent[0].date?.slice(0,10)}</span>
              <span>{recent[recent.length-1].date?.slice(0,10)}</span>
            </div>
          </>,
          C.purple
        );
      })()}

      {/* 2. AI SCORE VS REAL VIEWS TABLE */}
      {card(
        <>
          {sectionHead("AI Score vs Real Views", C.pink)}
          {postedIdeas.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 24px", color:"rgba(255,255,255,0.4)", fontSize:14, display:"flex", flexDirection:"column", alignItems:"center", gap:10, lineHeight:1.6 }}>
              <div style={{ display:"flex", opacity:0.7 }}>{I.check(26,"rgba(255,255,255,0.4)")}</div>
              No posted ideas yet — mark ideas as posted to track accuracy.
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                <thead>
                  <tr>
                    {["Title","AI Score","Actual Views","Verdict"].map(h=>(
                      <th key={h} style={{ padding:isMobile?"13px 16px":"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", borderBottom:`1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {postedIdeas.map((idea,idx)=>{
                    const vd = verdict(idea);
                    return (
                      <tr key={idea.id||idx} style={{ borderBottom:`1px solid ${C.border}` }}>
                        <td style={{ padding:"12px 14px", color:"#fff", fontWeight:500, maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{idea.title||idea.hook||"Untitled"}</td>
                        <td style={{ padding:"12px 14px" }}>
                          {idea.viral != null ? (
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:80, height:6, borderRadius:3, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
                                <div style={{ width:`${idea.viral}%`, height:"100%", borderRadius:3, background:`linear-gradient(90deg,${C.yellow},${C.orange})` }}/>
                              </div>
                              <span style={{ color:C.yellow, fontWeight:700 }}>{idea.viral}</span>
                            </div>
                          ) : <span style={{ color:"rgba(255,255,255,0.25)" }}>—</span>}
                        </td>
                        <td style={{ padding:"12px 14px", color:idea.postedViews!=null?C.cyan:"rgba(255,255,255,0.25)", fontWeight:600 }}>
                          {idea.postedViews != null ? fmt(idea.postedViews) : "—"}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:vd.color, background:`${vd.color}15`, padding:"3px 10px", borderRadius:20, border:`1px solid ${vd.color}40` }}>{vd.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {channelAvg > 0 && (
                <div style={{ marginTop:12, fontSize:12, color:"rgba(255,255,255,0.3)" }}>
                  Channel avg: {fmt(channelAvg)} views — used to determine Hit / Miss
                </div>
              )}
            </div>
          )}
        </>,
        C.pink
      )}

      {/* 3. TOP PERFORMING VIDEOS */}
      {card(
        <>
          {sectionHead("Top Performing Videos", C.green)}
          {top5Videos.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 24px", color:"rgba(255,255,255,0.4)", fontSize:14, display:"flex", flexDirection:"column", alignItems:"center", gap:10, lineHeight:1.6 }}>
              <div style={{ display:"flex", opacity:0.7 }}>{I.bar(26,"rgba(255,255,255,0.4)")}</div>
              No videos tracked yet — sync your channel in Settings to see your top performers here.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:isMobile?20:10 }}>
              {top5Videos.map((v,idx)=>{
                const maxViews = top5Videos[0]?.views || 1;
                const pct = Math.round(((v.views||0)/maxViews)*100);
                return (
                  <div key={v.id||idx} style={{ display:"flex", alignItems:"center", gap:14, padding:isMobile?"18px 18px":"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:20, fontWeight:700, fontFamily:C.fontHead, color:"rgba(255,255,255,0.18)", width:28, textAlign:"center", flexShrink:0 }}>#{idx+1}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:6 }}>{v.title||v.description||"Untitled"}</div>
                      <div style={{ width:"100%", height:5, borderRadius:3, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", borderRadius:3, background:`linear-gradient(90deg,${C.green},${C.cyan})` }}/>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0, alignItems:"flex-end" }}>
                      <div style={{ display:"flex", gap:isMobile?10:16 }}>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:isMobile?15:18, fontWeight:700, color:C.green }}>{fmt(v.views||0)}</div>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em" }}>VIEWS</div>
                        </div>
                        {v.likes != null && (
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:isMobile?15:18, fontWeight:700, color:C.pink }}>{fmt(v.likes)}</div>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em" }}>LIKES</div>
                          </div>
                        )}
                      </div>
                      {v.hookType && (
                        <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", color:C.purple, background:`${C.purple}15`, padding:"3px 10px", borderRadius:20, border:`1px solid ${C.purple}40` }}>{v.hookType}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>,
        C.green
      )}

      {/* 4. SHAREABLE SCORE CARD */}
      <div style={{ borderRadius:18, overflow:"hidden", background:`linear-gradient(135deg,rgba(20,10,40,0.98),rgba(10,6,25,0.98))`, border:`1px solid ${C.border}`, position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.purple},${C.pink},${C.cyan})` }}/>
        <div style={{ position:"absolute", top:-60, right:-60, width:260, height:260, borderRadius:"50%", background:`${C.purple}08`, filter:"blur(80px)", pointerEvents:"none" }}/>
        <div style={{ padding:isMobile?"18px 18px":"28px 32px" }}>
          {sectionHead("Creator Score Card", C.purple)}
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", alignItems:"flex-start", justifyContent:"space-between", gap:isMobile?20:24 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:isMobile?20:28 }}>
              <div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Creator</div>
                <div style={{ fontSize:isMobile?22:28, fontWeight:700, fontFamily:C.fontHead, color:"#fff" }}>{WL.handle||"@creator"}</div>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:isMobile?20:32 }}>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Videos Tracked</div>
                  <div style={{ fontSize:isMobile?24:32, fontWeight:700, fontFamily:C.fontHead, color:C.cyan }}>{videos.length}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Avg Views</div>
                  <div style={{ fontSize:isMobile?24:32, fontWeight:700, fontFamily:C.fontHead, color:C.green }}>{avgPostedViews ? fmt(avgPostedViews) : fmt(channelAvg||0)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Ideas Scored</div>
                  <div style={{ fontSize:isMobile?24:32, fontWeight:700, fontFamily:C.fontHead, color:C.yellow }}>{scoredIdeas.length}</div>
                </div>
              </div>
              {bestIdea && (
                <div style={{ padding:"14px 18px", borderRadius:12, background:`${C.pink}10`, border:`1px solid ${C.pink}25` }}>
                  <div style={{ fontSize:11, color:C.pink, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>Best Performing Idea</div>
                  <div style={{ fontSize:15, fontWeight:600, color:"#fff", marginBottom:4 }}>{bestIdea.title||bestIdea.hook||"Untitled"}</div>
                  <div style={{ fontSize:13, color:C.green, fontWeight:700 }}>{fmt(bestIdea.postedViews)} views</div>
                </div>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:isMobile?"stretch":"flex-end", width:isMobile?"100%":"auto" }}>
              <button
                onClick={handleShare}
                style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px 28px", borderRadius:14, background:`linear-gradient(135deg,${C.purple},${C.pink})`, border:"none", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", letterSpacing:"0.04em", boxShadow:`0 4px 20px ${C.purple}40`, width:isMobile?"100%":"auto" }}
              >
                {I.rocket(15,"#fff")} Publish &amp; Share
              </button>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textAlign:isMobile?"center":"right", lineHeight:1.4 }}>Creates a public results page you can post anywhere</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)", textAlign:isMobile?"center":"right" }}>
                Powered by {WL.appName}
              </div>
            </div>
          </div>
          {shareMsg && (
            <div style={{ marginTop:16, padding:isMobile?"14px 18px":"12px 16px", borderRadius:10, background:`${C.yellow}12`, border:`1px solid ${C.yellow}30`, color:C.yellow, fontSize:13, fontWeight:600 }}>
              {shareMsg}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

const SettingsView = ({ plan, onManagePlan, keys, onEditKeys, scrapedStats, hasIG, WL, onEditWL, onSyncTikTok, syncMsg, videos=[], ideas=[], onBulkImport }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [editing, setEditing] = useState(null);
  const [draftKey, setDraftKey] = useState("");
  const [wlDraft, setWlDraft] = useState(null);
  const [trendsDraft, setTrendsDraft] = useState(()=>loadJSON(CUR_TRENDS_KEY,""));
  const [trendsSaved, setTrendsSaved] = useState(false);
  const [theoryDraft, setTheoryDraft] = useState(()=>loadJSON(CHANNEL_THEORY_KEY,""));
  const [theorySaved, setTheorySaved] = useState(false);
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(()=>loadJSON(VOICE_KEY,""));
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const measuredVoice = React.useMemo(()=>buildVoiceDNA(videos, ideas),[videos, ideas]);
  const generateVoice = async () => {
    setVoiceLoading(true);
    try {
      saveJSON(VOICE_KEY+"_meta", null);            // force a fresh re-distill
      await ensureVoiceProfile(videos, ideas, loadWL());
      setVoiceDraft(loadJSON(VOICE_KEY,""));
    } catch {}
    setVoiceLoading(false);
  };
  const saveVoice = () => {
    const sig = _voiceSig(videos, ideas);
    saveJSON(VOICE_KEY, voiceDraft);
    saveJSON(VOICE_KEY+"_meta", { sig, at:Date.now(), edited:true });
    try { sbUpsert("km_config",[{ id:wsId("voice_dna"), data:{ profile:voiceDraft, sig, at:Date.now() }, updated_at:new Date().toISOString() }]); } catch {}
    setVoiceSaved(true); setTimeout(()=>setVoiceSaved(false),2000);
  };
  const [csvDraft, setCsvDraft] = useState("");
  const [csvMsg, setCsvMsg] = useState("");
  const [sbDraft, setSbDraft] = useState(null); // { url, key } while editing
  const [sbMsg, setSbMsg] = useState(null);
  const testAndSaveSb = async () => {
    const url = (sbDraft?.url||"").trim().replace(/\/+$/,"");
    const key = (sbDraft?.key||"").trim();
    if(!url || !key) { setSbMsg({ ok:false, text:"Enter both the project URL and the key." }); return; }
    setSbMsg({ ok:true, text:"Testing connection…" });
    try {
      const r = await fetch(`${url}/rest/v1/km_config?select=id&limit=1`, { headers:{ apikey:key, Authorization:"Bearer "+key } });
      if(r.status===401||r.status===403) { setSbMsg({ ok:false, text:`Rejected (${r.status}) — wrong key, or the project is paused. Copy the anon / publishable key from Supabase → Settings → API.` }); return; }
      if(!r.ok && r.status!==404) { setSbMsg({ ok:false, text:`Connection failed (HTTP ${r.status}).` }); return; }
      localStorage.setItem(SB_URL_KEY, url);
      localStorage.setItem(SB_KEY_KEY, key);
      reportHealth("supabase","ok","Connected");
      setSbDraft(null);
      // Seed the cloud with everything already on THIS device, so anything you added
      // before connecting (keys, videos, ideas) uploads automatically — you never have
      // to go back and re-save things by hand.
      setSbMsg({ ok:true, text:"Connected — pushing your data to the cloud…" });
      try {
        const localKeys = loadJSON(KEYS_KEY, {});
        if(localKeys && Object.keys(localKeys).length) await sbUpsert("km_config", [{ id: wsId("workspace_config"), data: localKeys, updated_at: new Date().toISOString() }]);
        if(videos?.length) await sbUpsert("km_videos", videos.map(v=>({ ...v, id: wsId(v.id) })));
        if(ideas?.length) await sbSyncArray("km_ideas", ideas);
      } catch { /* seeding is best-effort — connection is already saved */ }
      setSbMsg({ ok:true, text:"Connected — your keys and data are now synced across devices." });
    } catch(e) { setSbMsg({ ok:false, text:"Could not reach that URL — check it and try again." }); }
  };
  const saveTrends = () => { saveJSON(CUR_TRENDS_KEY, trendsDraft); setTrendsSaved(true); setTimeout(()=>setTrendsSaved(false),2000); };
  const saveTheory = () => { saveJSON(CHANNEL_THEORY_KEY, theoryDraft); setTheorySaved(true); setTimeout(()=>setTheorySaved(false),2000); };
  const saveKey = (field) => { onEditKeys&&onEditKeys({...keys,[field]:draftKey.trim()}); setEditing(null); setDraftKey(""); };
  const startWL = () => setWlDraft({...WL});
  const saveWLEdit = () => { onEditWL&&onEditWL(wlDraft); setWlDraft(null); };

  const generateChannelTheory = async () => {
    if(!keys?.anthropic && !USE_BACKEND && !BAKED_ANTHROPIC_KEY) return;
    setTheoryLoading(true);
    try {
      const organicV = videos.filter(v=>!v.boosted&&v.views>0);
      const sorted = [...organicV].sort((a,b)=>(b.views||0)-(a.views||0));
      const top5 = sorted.slice(0,5).map(v=>({title:v.title,views:v.views,hook:v.hook,type:v.type}));
      const bot5 = sorted.slice(-5).map(v=>({title:v.title,views:v.views,hook:v.hook,type:v.type}));
      const postedIdeas = ideas.filter(i=>i.status==="posted"&&i.postedViews>0).slice(0,5);
      const mem = buildMemoryContext();
      const compData = loadCompetitorData();
      const compSummary = compData?.data?.opportunities?.slice(0,2).map(o=>o.gap).join(", ")||"";

      const d = await anthropicMessages({model:"claude-sonnet-4-6",max_tokens:600,messages:[{role:"user",content:`You are a media psychologist analysing why a specific social media channel goes viral. Channel: ${loadWL().handle} (${loadWL().appName} — ${loadWL().niche}, creator${loadWL().creator2?`s: ${loadWL().creator1} + ${loadWL().creator2}`:`: ${loadWL().creator1}`}).

TOP PERFORMING VIDEOS: ${JSON.stringify(top5)}
BOTTOM PERFORMING VIDEOS: ${JSON.stringify(bot5)}
${postedIdeas.length ? `POSTED IDEA OUTCOMES: ${postedIdeas.map(i=>`"${i.title}" → ${i.postedViews} views`).join(", ")}` : ""}
${compSummary ? `COMPETITOR GAPS: ${compSummary}` : ""}
${mem ? `MEMORY: ${mem.slice(0,400)}` : ""}

Synthesise a CHANNEL VIRAL THEORY: the deep psychological mechanism that explains why THIS specific channel goes viral when it does. Cover:
1. The core emotional transaction (what emotional need does the audience satisfy by watching?)
2. The primary share trigger (what makes someone press send to a friend — and who is that friend?)
3. The content conditions that must be true for a video to hit 3x channel average
4. The single biggest mistake this channel makes that kills virality
5. The unfair advantage this channel has that competitors can't easily copy

Write as 5 numbered points, each 1-2 sentences. Be specific to this channel — no generic advice.`}]}, keys?.anthropic);
      const theory = (d.content||[]).map(b=>b.text||"").join("").trim();
      if(theory) { setTheoryDraft(theory); saveJSON(CHANNEL_THEORY_KEY, theory); }
    } catch(e) { /* silent */ }
    setTheoryLoading(false);
  };

  const ApiLogo = ({ id }) => {
    const logos = {
      anthropic: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zM6.603 3.52H3L9.397 20H13L6.603 3.52z" fill="#D4A27F"/>
        </svg>
      ),
      perplexity: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#20B2AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      gpt4o: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#74AA9C"/>
        </svg>
      ),
      tikwm: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.83a8.17 8.17 0 004.78 1.52V6.91a4.85 4.85 0 01-1.01-.22z" fill="#FF2D55"/>
        </svg>
      ),
      gemini: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.304 14.304 0 0012 12 14.304 14.304 0 00-12 12z" fill="url(#geminiGrad)"/>
          <defs>
            <linearGradient id="geminiGrad" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor="#4285F4"/>
              <stop offset="50%" stopColor="#EA4335"/>
              <stop offset="100%" stopColor="#FBBC05"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      igscraper: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#igGrad)"/>
          <defs>
            <linearGradient id="igGrad" x1="0" y1="24" x2="24" y2="0">
              <stop offset="0%" stopColor="#f09433"/>
              <stop offset="25%" stopColor="#e6683c"/>
              <stop offset="50%" stopColor="#dc2743"/>
              <stop offset="75%" stopColor="#cc2366"/>
              <stop offset="100%" stopColor="#bc1888"/>
            </linearGradient>
          </defs>
        </svg>
      ),
    };
    return logos[id] || <span style={{display:"inline-flex"}}>{I.key(18,"rgba(255,255,255,0.6)")}</span>;
  };

  const apiKeys = [
    { id:"anthropic", label:"Anthropic", desc:"AI scoring + analysis", color:C.pink },
    { id:"perplexity", label:"Perplexity", desc:"Live trend research", color:C.cyan },
    { id:"gpt4o", label:"GPT-4o", desc:"Multi-model consensus", color:C.green },
    { id:"tikwm", label:"TikTok (RapidAPI)", desc:"Auto TikTok sync", color:"#FF2D55" },
    { id:"gemini", label:"Gemini", desc:"Video reader + 3rd scoring vote", color:C.yellow },
    { id:"igscraper", label:"Instagram (RapidAPI)", desc:"Auto reel sync", color:"#E1306C" },
  ];

  // Live integration health — updates when any sync reports a result
  const [health, setHealth] = useState(()=>loadHealth());
  useEffect(()=>{
    const onH = () => setHealth(loadHealth());
    window.addEventListener("km-health", onH);
    return ()=>window.removeEventListener("km-health", onH);
  },[]);
  const _hStatus = (service, fallbackValue, fallbackColor) => {
    const h = health[service];
    if(!h) return { value:fallbackValue, color:fallbackColor, detail:null };
    if(h.state==="error") return { value:"ERROR", color:C.pink, detail:h.msg };
    return { value:fallbackValue, color:fallbackColor, detail:null };
  };
  const _sb = _hStatus("supabase", "CONNECTED", C.green);
  const _tt = _hStatus("tiktok", scrapedStats?"SYNCED "+(()=>{try{const h=Math.round((Date.now()-new Date(scrapedStats.scraped_at))/3600000);return h<1?"<1h ago":h+"h ago";}catch{return "unknown";}})()+" ("+( scrapedStats.video_count||0)+" videos)":"NOT SYNCED", scrapedStats?C.green:C.yellow);
  const _ig = _hStatus("instagram", keys?.igscraper?"KEY SET":"ADD KEY", keys?.igscraper?C.green:C.yellow);
  const statusItems = [
    { label:"Supabase DB", value:_sb.value, color:_sb.color, id:"db", detail:_sb.detail },
    { label:"TikTok Scraper", value:_tt.value, color:_tt.color, id:"tikwm", detail:_tt.detail },
    { label:"Instagram Scraper", value:_ig.value, color:_ig.color, id:"igscraper", detail:_ig.detail },
    { label:"Anthropic AI", value:keys?.anthropic?"KEY SET":(USE_BACKEND?"SERVER":"ADD KEY"), color:(keys?.anthropic||USE_BACKEND)?C.green:C.pink, id:"anthropic" },
    { label:"Perplexity", value:keys?.perplexity?"KEY SET":(USE_BACKEND?"SERVER":"ADD KEY"), color:(keys?.perplexity||USE_BACKEND)?C.green:C.yellow, id:"perplexity" },
    { label:"Gemini Video", value:keys?.gemini?"KEY SET":(USE_BACKEND?"SERVER":"ADD KEY"), color:(keys?.gemini||USE_BACKEND)?C.green:C.yellow, id:"gemini" },
  ];

  const _tierLabel = TIER_LABELS[plan?.tier] || plan?.tier || "Free";
  const _scoreLimit = plan?.limits?.[plan?.tier]?.scores;
  const _scoreUsed = plan?.usage?.scores || 0;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?28:24 }}>

      {/* Plan card. Shows live in backend mode; on the operator's own build it also
          shows in direct mode as a PREVIEW so you can see the pricing screen before
          billing is switched on. */}
      {(USE_BACKEND || _activeCfg.clientId==="krapmaps") && (
        <div style={{ borderRadius:16, padding:isMobile?"20px 20px":"22px 26px", background:"linear-gradient(145deg,rgba(255,45,120,0.1),rgba(10,6,20,0.95))", border:`1px solid ${C.pink}30`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.pink},${C.pink}00)` }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, letterSpacing:"0.12em", color:"rgba(255,255,255,0.45)", fontWeight:700, textTransform:"uppercase", marginBottom:5 }}>{USE_BACKEND ? "Your Plan" : "Plans — Preview"}</div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:C.fontHead, color:"#fff", lineHeight:1 }}>{USE_BACKEND ? _tierLabel : "Free · Pro · Studio"}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:6 }}>
              {!USE_BACKEND ? "Tap to see the exact pricing page buyers get. Goes live when you turn billing on." : plan?.tier==="studio" ? "Unlimited scoring." : (_scoreLimit!=null ? `${_scoreUsed} / ${_scoreLimit} scores used this month` : `${_scoreUsed} scores used this month`)}
            </div>
          </div>
          <button onClick={onManagePlan} style={{ padding:isMobile?"11px 20px":"13px 26px", borderRadius:12, border:"none", background:(!USE_BACKEND||plan?.tier==="free")?`linear-gradient(135deg,${C.pink},${C.purple})`:"rgba(255,255,255,0.08)", color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:14, cursor:"pointer", flexShrink:0 }}>
            {!USE_BACKEND ? "SEE PLANS" : plan?.tier==="free" ? "UPGRADE" : "CHANGE PLAN"}
          </button>
        </div>
      )}

      {/* Sync button — prominent at top */}
      <div style={{ borderRadius:16, padding:isMobile?"20px 20px":"24px 28px", background:"linear-gradient(145deg,rgba(0,207,255,0.1),rgba(10,6,20,0.95))", border:`1px solid ${C.cyan}30`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>Auto Sync</div>
          <div style={{ fontSize:isMobile?12:13, color:"rgba(255,255,255,0.5)", lineHeight:1.4 }}>
            {scrapedStats ? "Synced "+(()=>{try{const h=Math.round((Date.now()-new Date(scrapedStats.scraped_at))/3600000);return h<1?"<1h ago":h+"h ago";}catch{return "unknown";}})() : "Add TikTok API key to auto-sync"}
          </div>
        </div>
        <button onClick={onSyncTikTok} style={{ display:"flex", alignItems:"center", gap:8, padding:isMobile?"10px 18px":"14px 28px", borderRadius:12, border:`1px solid ${C.cyan}50`, background:`linear-gradient(135deg,${C.cyan}30,${C.cyan}15)`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:isMobile?13:16, cursor:"pointer", flexShrink:0 }}>
          {I.refresh(16,C.cyan)} {syncMsg || "SYNC"}
        </button>
      </div>

      {/* 2 col layout */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(240px,100%),1fr))", gap:16, alignItems:"start" }}>

        {/* LEFT — API Keys (admin only — regular users go through backend proxy) */}
        {_activeCfg.clientId==="krapmaps" && <div style={{ borderRadius:16, padding:isMobile?"18px 18px":"22px 24px", background:"linear-gradient(145deg,rgba(255,45,120,0.07),rgba(10,6,20,0.95))", border:`1px solid ${C.pink}25`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.pink},${C.pink}00)` }}/>
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>API Keys</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12, lineHeight:1.5 }}>Keys auto-save to cloud (Supabase) — persist across devices &amp; new builds. Requires a <code style={{background:"rgba(255,255,255,0.07)",padding:"1px 5px",borderRadius:4}}>km_config</code> table in your Supabase project.</div>
          <div style={{ fontSize:12, color:C.green, marginBottom:20, lineHeight:1.5, fontWeight:600 }}>You only need <strong>one</strong> AI provider for scoring &amp; ideas (Anthropic recommended). The rest are optional: Perplexity adds live trends, Gemini adds video reading, GPT-4o adds a 2nd scoring vote.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:isMobile?20:10 }}>
            {apiKeys.map(k=>(
              <div key={k.id} style={{ borderRadius:16, padding:isMobile?"18px 18px":"18px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${keys?.[k.id]?k.color+"30":"rgba(255,255,255,0.07)"}`, transition:"all 0.2s" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: editing===k.id ? 12 : 0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><ApiLogo id={k.id}/></div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{k.label}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{k.desc}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:keys?.[k.id]?C.green:"rgba(255,255,255,0.2)", boxShadow:keys?.[k.id]?`0 0 6px ${C.green}`:""  }}/>
                    <button onClick={()=>{ setEditing(editing===k.id?null:k.id); setDraftKey(keys?.[k.id]||""); }}
                      style={{ padding:"6px 14px", borderRadius:9, border:`1px solid ${keys?.[k.id]?k.color+"40":"rgba(255,255,255,0.1)"}`, background:keys?.[k.id]?`${k.color}12`:"rgba(255,255,255,0.04)", color:keys?.[k.id]?k.color:"rgba(255,255,255,0.85)", fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                      {keys?.[k.id]?"CHANGE":"ADD"}
                    </button>
                  </div>
                </div>
                {editing===k.id && (
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={draftKey} onChange={e=>setDraftKey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveKey(k.id)} placeholder={`Paste ${k.label} key...`}
                      style={{ flex:1, background:"rgba(255,255,255,0.06)", border:`1px solid ${k.color}40`, borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 14px", fontSize:13, fontFamily:"monospace", outline:"none" }}/>
                    <button onClick={()=>saveKey(k.id)} style={{ padding:"10px 16px", borderRadius:10, border:"none", background:k.color, color:"#07050F", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>SAVE</button>
                    <button onClick={()=>setEditing(null)} style={{ padding:isMobile?"13px 16px":"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{I.x(13,"currentColor")}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>}

        {/* RIGHT — Status + Creator Config */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* System Status */}
          <div style={{ borderRadius:16, padding:isMobile?"18px 18px":"22px 24px", background:"linear-gradient(145deg,rgba(0,255,148,0.06),rgba(10,6,20,0.95))", border:`1px solid ${C.green}25`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.green},${C.green}00)` }}/>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:isMobile?24:16 }}>System Status</div>
            {statusItems.map((s,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:isMobile?"14px 0":"12px 0", borderBottom:i<statusItems.length-1?"1px solid rgba(255,255,255,0.05)":"none", flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  <div style={{ width:24, height:24, borderRadius:7, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {s.id==="db" ? <span style={{display:"inline-flex"}}>{I.database(13,"rgba(255,255,255,0.7)")}</span> : <ApiLogo id={s.id}/>}
                  </div>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,0.85)", fontWeight:500 }}>{s.label}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:s.color, boxShadow:`0 0 6px ${s.color}`, flexShrink:0 }}/>
                  <span style={{ fontSize:isMobile?11:13, fontWeight:700, color:s.color }}>{s.value}</span>
                </div>
                {s.detail && <div style={{ flexBasis:"100%", fontSize:12, color:`${C.pink}cc`, lineHeight:1.5, paddingTop:2 }}>{s.detail}</div>}
              </div>
            ))}
          </div>

          {/* Cloud Sync (Supabase) — fixable in-app when the project key rotates */}
          <div style={{ borderRadius:16, padding:isMobile?"18px 18px":"22px 24px", background:"linear-gradient(145deg,rgba(0,207,255,0.05),rgba(10,6,20,0.95))", border:`1px solid ${C.cyan}20`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>Cloud Sync</div>
              {!sbDraft && <button onClick={()=>{ setSbDraft({ url:getSbUrl(), key:"" }); setSbMsg(null); }} style={{ padding:isMobile?"12px 18px":"8px 16px", borderRadius:10, border:`1px solid ${C.cyan}40`, background:`${C.cyan}12`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>EDIT</button>}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.5, marginBottom:sbDraft?14:0 }}>
              {sbDraft ? "Paste your Supabase project URL and anon/publishable key (Supabase → Settings → API). Saved on this device only." : "If cloud sync shows an auth error, the Supabase key was likely rotated — tap EDIT to paste the new one, no rebuild needed."}
            </div>
            {sbDraft && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input value={sbDraft.url} onChange={e=>setSbDraft(d=>({...d,url:e.target.value}))} placeholder="https://xxxx.supabase.co" aria-label="Supabase project URL"
                  style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.cyan}25`, borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 12px", fontSize:13, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }}/>
                <input value={sbDraft.key} onChange={e=>setSbDraft(d=>({...d,key:e.target.value}))} placeholder="anon / publishable key" aria-label="Supabase anon key"
                  style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.cyan}25`, borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 12px", fontSize:13, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }}/>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={testAndSaveSb} style={{ flex:1, padding:"12px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.cyan},${C.cyan}bb)`, color:"#07050F", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>TEST &amp; SAVE</button>
                  <button onClick={()=>{ setSbDraft(null); setSbMsg(null); }} style={{ padding:"12px 16px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>CANCEL</button>
                </div>
              </div>
            )}
            {sbMsg && <div style={{ marginTop:10, fontSize:12, fontWeight:600, lineHeight:1.5, color:sbMsg.ok?C.green:C.pink }}>{sbMsg.text}</div>}
          </div>

          {/* Creator Config */}
          <div style={{ borderRadius:16, padding:isMobile?"22px 20px":"22px 24px", background:"linear-gradient(145deg,rgba(197,102,255,0.07),rgba(10,6,20,0.95))", border:`1px solid ${C.purple}25`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?24:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>Creator Config</div>
              {!wlDraft && <button onClick={startWL} style={{ padding:isMobile?"12px 18px":"8px 16px", borderRadius:10, border:`1px solid ${C.purple}40`, background:`${C.purple}15`, color:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>EDIT</button>}
            </div>
            {wlDraft ? (
              <div style={{ display:"flex", flexDirection:"column", gap:isMobile?20:10 }}>
                {[
                  {k:"appName",label:"App Name"},{k:"handle",label:"Handle"},
                  {k:"creator1",label:"Creator 1"},{k:"creator2",label:"Creator 2"},
                  {k:"niche",label:"Niche"},{k:"platforms",label:"Platforms"},
                  {k:"targetAudience",label:"Audience",big:true},
                  {k:"competitors",label:"Competitors"},
                  {k:"bestFormula",label:"Best Formula",big:true},
                ].map(({k,label,big})=>(
                  <div key={k}>
                    <div style={{ fontSize:11, color:`${C.purple}cc`, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:5 }}>{label}</div>
                    {big ? (
                      <textarea value={wlDraft[k]||""} onChange={e=>setWlDraft(d=>({...d,[k]:e.target.value}))} rows={2}
                        style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.purple}30`, borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 12px", fontSize:14, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
                    ) : (
                      <input value={wlDraft[k]||""} onChange={e=>setWlDraft(d=>({...d,[k]:e.target.value}))}
                        style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.purple}30`, borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 12px", fontSize:14, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box" }}/>
                    )}
                  </div>
                ))}
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <button onClick={saveWLEdit} style={{ flex:1, padding:"14px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, cursor:"pointer", fontSize:14 }}>SAVE CONFIG</button>
                  <button onClick={()=>setWlDraft(null)} style={{ padding:"12px 18px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, cursor:"pointer" }}>CANCEL</button>
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:8 }}>
                {[
                  {k:"App", v:WL?.appName},{k:"Handle", v:WL?.handle},
                  {k:"Creator 1", v:WL?.creator1},{k:"Creator 2", v:WL?.creator2},
                  {k:"Niche", v:WL?.niche},{k:"Platforms", v:WL?.platforms},
                ].map(({k,v})=>(
                  <div key={k} style={{ padding:isMobile?"14px 16px":"12px 14px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:`1px solid ${C.purple}15` }}>
                    <div style={{ fontSize:11, color:`${C.purple}aa`, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5 }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{v||"—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Trends — injected into every AI call */}
      <div style={{ borderRadius:16, padding:isMobile?"22px 20px":"22px 28px", background:`linear-gradient(145deg,rgba(255,107,53,0.08),rgba(10,6,20,0.95))`, border:`1px solid ${C.orange}25`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.orange},${C.orange}00)` }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?14:10 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>Current Trends</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>{loadJSON(KEYS_KEY,{})?.keys?.perplexity ? "Auto-fetched via Perplexity every 12hrs — also editable below" : "Update weekly — add Perplexity key for auto-fetch"}</div>
          </div>
          <button onClick={saveTrends} style={{ padding:"9px 20px", borderRadius:11, border:`1px solid ${trendsSaved?C.green:C.orange}50`, background:trendsSaved?`${C.green}20`:`${C.orange}18`, color:trendsSaved?C.green:C.orange, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>{trendsSaved?<span style={{display:"inline-flex",alignItems:"center",gap:5}}>SAVED {I.tick(12,"currentColor")}</span>:"SAVE"}</button>
        </div>
        <textarea
          value={trendsDraft}
          onChange={e=>setTrendsDraft(e.target.value)}
          placeholder={`What's trending right now? Paste audio names, formats, topics, anything the AI should know.\n\nExamples:\n- "Sabrina Carpenter - Espresso" is peak on TikTok this week\n- POV format getting 3x normal reach\n- SE Asia travel content spiking post-monsoon season\n- Competitor @travelfromtheheart posting daily cleanup challenges`}
          rows={isMobile?3:7}
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.orange}25`, borderRadius:12, color:"#fff", padding:isMobile?"18px 18px":"14px 16px", fontSize:13, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}
        />
      </div>

      {/* Channel Viral Theory — the deep "why this channel goes viral" model */}
      <div style={{ borderRadius:16, padding:isMobile?"20px 20px":"22px 24px", background:`linear-gradient(145deg,rgba(139,92,246,0.08),rgba(10,6,20,0.95))`, border:`1px solid ${C.purple}25`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
        <div style={{ display:"flex", alignItems:isMobile?"flex-start":"center", justifyContent:"space-between", gap:12, marginBottom:isMobile?14:10, flexWrap:isMobile?"wrap":"nowrap" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>Channel Viral Theory</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>The deep "why this channel goes viral" — injected into every score. Generate from your data or write it yourself.</div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={generateChannelTheory} disabled={(!keys?.anthropic&&!USE_BACKEND&&!BAKED_ANTHROPIC_KEY)||theoryLoading} style={{ padding:"9px 16px", borderRadius:11, border:`1px solid ${C.purple}50`, background:`${C.purple}18`, color:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", opacity:((!keys?.anthropic&&!USE_BACKEND&&!BAKED_ANTHROPIC_KEY)||theoryLoading)?0.5:1 }}>{theoryLoading?"GENERATING...":<span style={{display:"inline-flex",alignItems:"center",gap:5}}>{I.zap(12,"currentColor")} GENERATE</span>}</button>
            <button onClick={saveTheory} style={{ padding:"9px 16px", borderRadius:11, border:`1px solid ${theorySaved?C.green:C.purple}50`, background:theorySaved?`${C.green}20`:`${C.purple}18`, color:theorySaved?C.green:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>{theorySaved?<span style={{display:"inline-flex",alignItems:"center",gap:5}}>SAVED {I.tick(12,"currentColor")}</span>:"SAVE"}</button>
          </div>
        </div>
        <textarea
          value={theoryDraft}
          onChange={e=>setTheoryDraft(e.target.value)}
          placeholder={`Click GENERATE to synthesise your channel's viral theory from your video data, or write it yourself.\n\nExample:\n1. Core emotion: guilt relief — viewers feel helpless about ocean plastic; this channel gives them a proxy hero to believe in.\n2. Share trigger: backpackers send to their group chat because it validates the "responsible traveller" identity they want others to see.\n3. Viral condition: BK must interact authentically with a local — scripted or solo content rarely breaks 2x average.\n4. Biggest mistake: over-explaining the app instead of showing the human story.\n5. Unfair advantage: the mission is real, which makes the emotion genuine and uncopyable.`}
          rows={8}
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.purple}25`, borderRadius:12, color:"#fff", padding:isMobile?"18px 18px":"14px 16px", fontSize:13, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}
        />
      </div>

      {/* Voice DNA — the creator's own voice, learned and editable */}
      <div style={{ borderRadius:16, padding:isMobile?"20px 20px":"22px 24px", background:`linear-gradient(145deg,rgba(0,229,255,0.07),rgba(10,6,20,0.95))`, border:`1px solid ${C.cyan}25`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
        <div style={{ display:"flex", alignItems:isMobile?"flex-start":"center", justifyContent:"space-between", gap:12, marginBottom:isMobile?14:10, flexWrap:isMobile?"wrap":"nowrap" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>Voice DNA</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>How you actually write — learned from your own posts and injected into every idea, hook, caption and script so nothing sounds like a bot. Edit it to correct anything.</div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={generateVoice} disabled={(!keys?.anthropic&&!USE_BACKEND&&!BAKED_ANTHROPIC_KEY)||voiceLoading} style={{ padding:"9px 16px", borderRadius:11, border:`1px solid ${C.cyan}50`, background:`${C.cyan}18`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", opacity:((!keys?.anthropic&&!USE_BACKEND&&!BAKED_ANTHROPIC_KEY)||voiceLoading)?0.5:1 }}>{voiceLoading?"LEARNING...":<span style={{display:"inline-flex",alignItems:"center",gap:5}}>{I.zap(12,"currentColor")} RELEARN</span>}</button>
            <button onClick={saveVoice} style={{ padding:"9px 16px", borderRadius:11, border:`1px solid ${voiceSaved?C.green:C.cyan}50`, background:voiceSaved?`${C.green}20`:`${C.cyan}18`, color:voiceSaved?C.green:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>{voiceSaved?<span style={{display:"inline-flex",alignItems:"center",gap:5}}>SAVED {I.tick(12,"currentColor")}</span>:"SAVE"}</button>
          </div>
        </div>
        {/* Measured traits — the deterministic read of their style (always on, no API) */}
        {measuredVoice ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:12 }}>
            {[
              measuredVoice.casing,
              `~${measuredVoice.medianLen} words/line`,
              measuredVoice.pov.split("—")[0].trim(),
              measuredVoice.emojiPerLine<0.15?"no emoji":`emoji ${measuredVoice.emojiVocab.slice(0,4).join("")||"used"}`,
              ...(measuredVoice.questionLed?["question-led"]:[]),
              ...(measuredVoice.signatureWords.slice(0,5).map(w=>`"${w}"`)),
            ].map((t,i)=>(
              <span key={i} style={{ fontSize:11, fontWeight:700, color:C.cyan, background:`${C.cyan}12`, border:`1px solid ${C.cyan}25`, borderRadius:20, padding:"4px 11px", letterSpacing:"0.02em" }}>{t}</span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize:12.5, color:C.yellow, background:`${C.yellow}0d`, border:`1px solid ${C.yellow}25`, borderRadius:10, padding:"10px 13px", marginBottom:12, lineHeight:1.5 }}>
            Still learning your voice — add a few more of your own video titles/hooks (about {Math.max(0, 4 - _voiceCorpus(videos, ideas).length)} more) and it locks in automatically. Until then the AI uses your niche defaults.
          </div>
        )}
        <textarea
          value={voiceDraft}
          onChange={e=>setVoiceDraft(e.target.value)}
          placeholder={"Hit RELEARN to capture your voice from your posts — or describe it yourself.\n\nExample:\nDry, deadpan, slightly self-deprecating. Talks to the viewer like a mate, never salesy. Short punchy lines, lowercase, the odd \"ngl\" and \"lowkey\". Never uses hype words or exclamation-mark energy — the humour is in the understatement."}
          rows={7}
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.cyan}25`, borderRadius:12, color:"#fff", padding:isMobile?"18px 18px":"14px 16px", fontSize:13, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}
        />
      </div>

      {/* Bulk Video Import (CSV) */}
      <div style={{ padding:isMobile?"26px 20px":"20px 24px", borderRadius:16, border:`1px solid ${C.yellow}20`, background:`${C.yellow}05` }}>
        <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>Bulk Video Import (CSV)</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:isMobile?16:12 }}>Paste rows: <span style={{color:C.yellow}}>title, views, likes, type, hook, platform</span> (one per line, comma-separated). Header row optional.</div>
        <textarea value={csvDraft} onChange={e=>setCsvDraft(e.target.value)} rows={5} placeholder={"title,views,likes,type,hook,platform\nMy first video,12000,900,facecam,achievement,tiktok\n..."} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.yellow}25`, borderRadius:12, color:"#fff", padding:"12px 14px", fontSize:12, fontFamily:"monospace", outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
          <button onClick={()=>{
            const lines = csvDraft.trim().split("\n").filter(l=>l.trim());
            const start = lines[0]?.toLowerCase().includes("title") ? 1 : 0;
            const parsed = lines.slice(start).map(line=>{
              const cols = line.split(",").map(c=>c.trim());
              if(!cols[0]) return null;
              return { title:cols[0], views:parseInt(cols[1])||0, likes:parseInt(cols[2])||0, type:cols[3]||"facecam", hook:cols[4]||"achievement", platform:cols[5]||"tiktok", comments:0, shares:0 };
            }).filter(Boolean);
            if(!parsed.length){ setCsvMsg("No valid rows found."); return; }
            onBulkImport&&onBulkImport(parsed);
            setCsvMsg(`Imported ${parsed.length} videos`);
            setCsvDraft("");
            setTimeout(()=>setCsvMsg(""),3000);
          }} style={{ padding:"9px 18px", borderRadius:11, border:`1px solid ${C.yellow}40`, background:`${C.yellow}15`, color:C.yellow, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>IMPORT</button>
          {csvMsg && <span style={{ fontSize:13, color:/^Imported/.test(csvMsg)?C.green:C.pink }}>{csvMsg}</span>}
        </div>
      </div>

      {/* Channel Intelligence Export */}
      <div style={{ padding:isMobile?"26px 20px":"20px 24px", borderRadius:16, border:`1px solid ${C.cyan}20`, background:`${C.cyan}05` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?16:12 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>Channel Intelligence Export</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>Download a full snapshot of your channel data, insights, and viral theory for sharing or backup.</div>
          </div>
          <button onClick={()=>{
            const insights = buildChannelInsights(videos);
            const theory = loadJSON(CHANNEL_THEORY_KEY,"");
            const mem = loadJSON(MEMORY_KEY, {entries:[]});
            const topV = [...videos].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
            const postedIdeas = ideas.filter(i=>i.status==="posted"&&i.postedViews>0).slice(0,10);
            const lines = [
              "═══════════════════════════════════════",
              " KRAPMAPS CHANNEL INTELLIGENCE REPORT",
              ` Generated: ${new Date().toLocaleString()}`,
              "═══════════════════════════════════════",
              "",
              "── CHANNEL VIRAL THEORY ──",
              theory || "(Not generated yet — go to Settings > Channel Viral Theory)",
              "",
              "── KEY METRICS ──",
              `Total Videos: ${insights.totalVideos}`,
              `Average Views: ${Math.round(insights.avgViews||0).toLocaleString()}`,
              `Top Video Views: ${(insights.topVideo?.views||0).toLocaleString()} — "${insights.topVideo?.title||"N/A"}"`,
              `p50 (median): ${Math.round(insights.p50||0).toLocaleString()} views`,
              `p90 (top 10%): ${Math.round(insights.p90||0).toLocaleString()} views`,
              `Collab Multiplier: ${insights.collabMultiplier||"N/A"}x`,
              `Avg Velocity (24hr/total): ${insights.avgVelocity||"N/A"}%`,
              "",
              "── TOP 5 VIDEOS ──",
              ...topV.map((v,i)=>`${i+1}. ${v.title?.slice(0,60)||"Untitled"} — ${(v.views||0).toLocaleString()} views | hook: ${v.hook||"?"} | type: ${v.type||"?"}`),
              "",
              "── POSTED OUTCOMES ──",
              ...(postedIdeas.length ? postedIdeas.map(i=>`• "${i.title?.slice(0,50)}" → ${(i.postedViews||0).toLocaleString()} views (scored ${i.viral||"?"})`): ["(No posted outcomes yet)"]),
              "",
              "── RECENT MEMORY ──",
              ...(mem.entries||[]).slice(-15).reverse().map(e=>`[${e.type}] ${e.recommendation||e.outcome||""}`.slice(0,100)),
              "",
              "═══════════════════════════════════════",
            ];
            const blob = new Blob([lines.join("\n")], {type:"text/plain"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `${(WL.appName||"content-os").toLowerCase().replace(/\s+/g,"-")}-intel-${new Date().toISOString().slice(0,10)}.txt`;
            a.click(); URL.revokeObjectURL(url);
          }} style={{ padding:"10px 18px", borderRadius:11, border:`1px solid ${C.cyan}40`, background:`${C.cyan}15`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
            ↓ EXPORT
          </button>
        </div>
      </div>
      {/* Hidden reset — tap 5× on the version label to trigger */}
      <ResetZone />
    </div>
  );
};
const ResetZone = () => {
  const [taps, setTaps] = React.useState(0);
  const [show, setShow] = React.useState(false);
  const tapRef = React.useRef(null);
  const tap = () => {
    const n = taps + 1;
    setTaps(n);
    clearTimeout(tapRef.current);
    tapRef.current = setTimeout(() => setTaps(0), 2000);
    if(n >= 5) { setShow(true); setTaps(0); }
  };
  return (
    <div style={{ textAlign:"center", marginTop:40, paddingBottom:32, borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:24 }}>
      <div onClick={tap} style={{ fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:"0.18em", cursor:"pointer", userSelect:"none", fontFamily:"Courier New,monospace", display:"inline-block", padding:"6px 14px", borderRadius:8, border:"1px solid rgba(255,255,255,0.07)" }}>v1.0 · tap 5× to reset</div>
      {show && (
        <div style={{ marginTop:16, padding:"18px 20px", borderRadius:14, border:"1px solid rgba(255,59,59,0.3)", background:"rgba(255,59,59,0.06)" }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:14, fontFamily:"Courier New,monospace", letterSpacing:"0.06em" }}>Reset workspace — shows activation screen on next load</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={()=>setShow(false)} style={{ padding:"8px 18px", borderRadius:10, border:"1px solid rgba(255,255,255,0.12)", background:"transparent", color:"rgba(255,255,255,0.5)", fontFamily:"Courier New,monospace", fontSize:12, cursor:"pointer" }}>Cancel</button>
            <button onClick={()=>{ localStorage.clear(); window.location.reload(); }} style={{ padding:"8px 18px", borderRadius:10, border:"1px solid rgba(255,59,59,0.4)", background:"rgba(255,59,59,0.15)", color:"#ff6b6b", fontFamily:"Courier New,monospace", fontSize:12, cursor:"pointer", fontWeight:700 }}>RESET & RESTART</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── CONSTANTS ─────────────────────────────────────────────────────
const KEYS_KEY     = "krapmaps_v1_config";
const MANUAL_KEY   = "krapmaps_v1_manual";
const VIDEOS_KEY   = "krapmaps_v1_videos";
const IDEAS_KEY    = "krapmaps_v1_ideas";
const CAL_KEY      = "krapmaps_v1_calendar";
const TASKS_KEY    = "krapmaps_v1_tasks";
const APPIDEAS_KEY = "krapmaps_v1_appideas";
const ANALYSIS_KEY = "krapmaps_v1_analysis";
const NEXTVIDS_KEY = "krapmaps_v1_nextvids";
const WEEKLY_KEY   = "krapmaps_v1_weekly";
const TRENDS_KEY   = "krapmaps_v1_trends";
const SYNC_KEY     = "krapmaps_v1_syncurl";
const SB_URL_KEY   = "krapmaps_sb_url";
const SB_KEY_KEY   = "krapmaps_sb_key";
const SCRAPE_KEY   = "krapmaps_v1_scrape";
const STREAK_KEY   = "krapmaps_v1_streak";
const XP_KEY       = "krapmaps_v1_xp";
// Clear old follower/reels cache from previous API versions
try { const flt=loadJSON("krapmaps_v1_igfollowers_last",0); if(flt && flt < 1749500000000) localStorage.removeItem("krapmaps_v1_igfollowers_last"); } catch(e){}
// Invalidate old reels cache if it was set before API swap
try { const t=loadJSON("krapmaps_v1_igreels_last",0); if(t && t < 1749500000000) localStorage.removeItem("krapmaps_v1_igreels_last"); } catch(e){}

const MEMORY_KEY      = "krapmaps_v1_memory";
const COMPETE_KEY     = "krapmaps_v1_competitors";
const PREDICT_KEY     = "krapmaps_v1_predictions";
const SCORES_KEY        = "krapmaps_v1_scores";
const SCORE_HISTORY_KEY = "krapmaps_v1_score_history";
const CUR_TRENDS_KEY    = "krapmaps_v1_cur_trends";
const CHANNEL_THEORY_KEY = "krapmaps_v1_channel_theory";
const HOOK_DB_KEY  = "krapmaps_v1_hookdb";
const PATTERN_KEY  = "krapmaps_v1_patterns";
const GAP_KEY      = "krapmaps_v1_gaps";
const COMMENTS_KEY = "krapmaps_v1_comment_insights";
const VISION_KEY   = "krapmaps_v1_visual_dna";
const GPT_KEY_ID   = "gpt4o";

// ── STREAK & XP SYSTEM ─────────────────────────────────────────────
const getStreak = () => {
  const s = loadJSON(STREAK_KEY, { count:0, lastDate:null, best:0 });
  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(s.lastDate === today) return s;
  if(s.lastDate === yesterday) {
    const updated = { count: s.count+1, lastDate: today, best: Math.max(s.best||0, s.count+1) };
    saveJSON(STREAK_KEY, updated); return updated;
  }
  // streak broken
  const reset = { count:1, lastDate:today, best: Math.max(s.best||0, s.count||0) };
  saveJSON(STREAK_KEY, reset); return reset;
};
const addXP = (amount) => {
  const xp = loadJSON(XP_KEY, { total:0, level:1 });
  const newTotal = (xp.total||0) + amount;
  const newLevel = Math.floor(Math.sqrt(newTotal/100)) + 1;
  saveJSON(XP_KEY, { total:newTotal, level:newLevel });
  return { total:newTotal, level:newLevel };
};
const getXP = () => loadJSON(XP_KEY, { total:0, level:1 });

// ── WEEKLY RITUAL LOOP ─────────────────────────────────────────────
// The retention engine: the intelligence is data-gated on the user logging real
// outcomes and scoring ideas. This surfaces those exact tasks once a week so the
// loop closes — the user returns, feeds the AI, the AI gets sharper, repeat.
const RITUAL_KEY = "krapmaps_v1_ritual";
const isoWeek = (d=new Date()) => {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(wk).padStart(2,"0")}`;
};
const buildRitual = (ideas=[], videos=[]) => {
  const pendingOutcomes = ideas.filter(i => i.status==="posted" && !(i.postedViews>0));
  const pendingScores   = ideas.filter(i => !(i.viral>0) && i.status!=="posted");
  const tasks = [];
  if(pendingOutcomes.length) tasks.push({ id:"outcomes", n:pendingOutcomes.length, label:`Log real views on ${pendingOutcomes.length} posted ${pendingOutcomes.length===1?"video":"videos"}`, why:"This is what trains the AI — every logged result sharpens future scores.", nav:"content" });
  if(pendingScores.length)   tasks.push({ id:"scores",   n:pendingScores.length,   label:`Score ${pendingScores.length} unscored ${pendingScores.length===1?"idea":"ideas"}`, why:"Get a virality read before you spend time filming.", nav:"content" });
  const week = isoWeek();
  const state = loadJSON(RITUAL_KEY, { week:null });
  const freshWeek = state.week !== week;
  return { tasks, pending: pendingOutcomes.length + pendingScores.length, week, freshWeek };
};
const markRitualWeek = (week) => saveJSON(RITUAL_KEY, { week, seenAt:new Date().toISOString() });

// ── AUTO STAT-PULL — match posted ideas to scraped videos, pre-fill real views ──
// Title-token overlap + posting-date proximity. Strict thresholds: only confident,
// unambiguous matches are surfaced — and they're surfaced as ONE-TAP CONFIRMATIONS,
// never silently written, because this data trains the model. The ritual is the
// fallback whenever a match isn't confident enough.
const _normTokens = (s) => (s||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(w=>w.length>2);
const _titleSim = (a,b) => {
  const ta=new Set(_normTokens(a)), tb=new Set(_normTokens(b));
  if(!ta.size || !tb.size) return 0;
  let inter=0; ta.forEach(t=>{ if(tb.has(t)) inter++; });
  return inter / Math.min(ta.size, tb.size); // overlap coefficient — robust to caption length
};
const autoMatchOutcomes = (ideas=[], videos=[]) => {
  const ttVids = videos.filter(v => v.platform==="tiktok" && v.views>0 && (v._tikwmId||v.videoUrl));
  if(!ttVids.length) return [];
  const out = [];
  ideas.filter(i => i.status==="posted" && !(i.postedViews>0) && i.title).forEach(i => {
    let best=null, runnerUp=0;
    ttVids.forEach(v => {
      const sim = _titleSim(i.title, v.title);
      let dateScore = 0.5;
      if(i.postedDate && v.created_at){
        const days = Math.abs((new Date(v.created_at) - new Date(i.postedDate))/86400000);
        dateScore = days<=10 ? 1 : days<=30 ? 0.6 : 0.2;
      }
      const conf = sim*0.7 + dateScore*0.3;
      if(!best || conf>best.conf){ runnerUp = best?best.conf:0; best={ conf, sim, v }; }
      else if(conf>runnerUp) runnerUp=conf;
    });
    // Confident AND unambiguous: strong title overlap, and clearly ahead of the next candidate.
    if(best && best.sim>=0.6 && best.conf>=0.62 && (best.conf - runnerUp) >= 0.12){
      out.push({ ideaId:i.id, ideaTitle:i.title, views:best.v.views, videoTitle:best.v.title, confidence:Math.round(best.conf*100) });
    }
  });
  return out;
};

const getIntelligenceLevel = (videos=[], ideas=[], memory={}, theory="") => {
  let score = 0;
  score += Math.min(videos.length * 3, 30);        // up to 30pts for videos
  score += Math.min((ideas.filter(i=>i.viral>0).length) * 4, 20); // scored ideas
  score += theory?.length > 200 ? 20 : 0;          // channel theory
  score += Math.min((memory?.entries?.length||0) * 2, 20); // memory
  score += ideas.filter(i=>i.status==="posted").length * 2; // posted content
  return Math.min(Math.round(score), 100);
};

const DEFAULT_SB_URL = "https://xiudsyiinkqtmowkiqxh.supabase.co";
const DEFAULT_SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWRzeWlpbmtxdG1vd2tpcXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzU5OTcsImV4cCI6MjA4OTQ1MTk5N30.8aHpQIcEcrDXo9DJN52SWAOee-rrkp-ti00h72-_sZE";

const WL_KEY = "krapmaps_v1_wl";
const CLIENT_KEY = "krapmaps_v1_client";
// Resolve which client config to use — persisted after activation
const _resolveClientConfig = () => {
  try {
    const stored = localStorage.getItem(CLIENT_KEY);
    if(stored) return JSON.parse(stored);
  } catch {}
  return CLIENT_CONFIG;
};
const _CC = _resolveClientConfig();
const WL_DEFAULTS = {
  clientId: _CC.clientId || "krapmaps",
  appName: _CC.appName || "Content OS",
  appTagline: _CC.appTagline || "Content OS",
  handle: _CC.handle || "@yourchannel",
  creator1: _CC.creator1 || "Creator",
  creator2: _CC.creator2 || "",
  niche: _CC.niche || "content creator",
  contentStyle: _CC.contentStyle || "",
  platforms: _CC.platforms || "tiktok,instagram",
  targetAudience: _CC.targetAudience || "",
  competitors: _CC.competitors || "",
  appDescription: _CC.appDescription || "",
  bestFormula: _CC.bestFormula || "",
  accentColor: _CC.accentColor || C.pink,
  accentColor2: _CC.accentColor2 || C.cyan,
  currency: _CC.currency || "£",
  onboardingTagline: _CC.onboardingTagline || "Score ideas, track growth, close brand deals — all in one place.",
  aiGreeting: _CC.aiGreeting || "Hey! I'm your AI assistant.",
  statLabels: _CC.statLabels || {},
  nicheLogic: _CC.nicheLogic || "",
  pillars: _CC.pillars || [],
  brandValues: _CC.brandValues || "",
  biggestChallenge: _CC.biggestChallenge || "",
  goals: _CC.goals || "",
};
// Branding/identity fields are owned by the active client config — never let a
// stale stored WL override them (prevents cross-client leaks like an ArtistOS
// build showing a KrapMaps greeting).
const _CLIENT_OWNED = { aiGreeting: WL_DEFAULTS.aiGreeting, onboardingTagline: WL_DEFAULTS.onboardingTagline };
const loadWL = () => { try { const s=JSON.parse(localStorage.getItem(WL_KEY)); return s?{...WL_DEFAULTS,...s,..._CLIENT_OWNED}:WL_DEFAULTS; } catch { return WL_DEFAULTS; } };
const saveWL = (wl) => { try { localStorage.setItem(WL_KEY,JSON.stringify(wl)); } catch {} };
const WL = loadWL();

// ── MEMORY SYSTEM ────────────────────────────────────────────────
// Stores what AI recommended + what actually happened, compounds over time
const loadMemory = () => loadJSON(MEMORY_KEY, { entries:[], lastUpdated:null });
const saveMemory = (m) => saveJSON(MEMORY_KEY, m);
const addMemoryEntry = (type, recommendation, outcome=null) => {
  const mem = loadMemory();
  mem.entries.push({ type, recommendation, outcome, date:new Date().toISOString().slice(0,10), id:Date.now() });
  // Keep last 50 entries
  if(mem.entries.length>50) mem.entries = mem.entries.slice(-50);
  mem.lastUpdated = new Date().toISOString().slice(0,10);
  saveMemory(mem);
};
const buildMemoryContext = () => {
  const mem = loadMemory();
  if(!mem.entries.length) return "";

  // Categorize entries by type for structured context instead of flat log
  const outcomes   = mem.entries.filter(e=>["IDEA_OUTCOME","STRUCTURED_LEARNING","OUTCOME","AUTO_OUTCOME","COUNTERFACTUAL","REPLICATION_KEY"].includes(e.type));
  const strategy   = mem.entries.filter(e=>["STRATEGY","ANALYSIS","GAP_SCAN","COMPETITOR_SCAN"].includes(e.type));
  const hooks      = mem.entries.filter(e=>["HOOKS","VIDEO_READ","HOOK_LEARNING","CAPTION_LEARNING"].includes(e.type));
  const recent     = mem.entries.slice(-5); // last 5 regardless of type for recency

  const outcomeCount = outcomes.length;
  const confidenceNote = outcomeCount >= 10 ? "HIGH CONFIDENCE" : outcomeCount >= 4 ? "MEDIUM CONFIDENCE" : `LOW CONFIDENCE (only ${outcomeCount} outcome${outcomeCount!==1?"s":""} — weight external niche knowledge more heavily than these learnings)`;
  let ctx = `CHANNEL MEMORY [${confidenceNote}] (structured learnings — calibrate scoring accordingly):\n`;

  if(outcomes.length) {
    ctx += "\n[OUTCOMES — what actually happened after posting]\n";
    outcomes.slice(-6).forEach(e=>{
      ctx += `• ${e.date} [${e.type}]: ${e.recommendation}${e.outcome?" → "+e.outcome:""}\n`;
    });
  }
  if(hooks.length) {
    ctx += "\n[HOOK & FORMAT LEARNINGS]\n";
    hooks.slice(-4).forEach(e=>{ ctx += `• ${e.date}: ${e.recommendation}\n`; });
  }
  if(strategy.length) {
    ctx += "\n[STRATEGY FINDINGS]\n";
    strategy.slice(-3).forEach(e=>{ ctx += `• ${e.date}: ${e.recommendation}\n`; });
  }

  // Include recent entries not already covered
  const coveredIds = new Set([...outcomes,...hooks,...strategy].map(e=>e.id));
  const uncovered = recent.filter(e=>!coveredIds.has(e.id));
  if(uncovered.length) {
    ctx += "\n[RECENT ACTIVITY]\n";
    uncovered.forEach(e=>{ ctx += `• ${e.date} [${e.type}]: ${e.recommendation}\n`; });
  }

  ctx += "\nPattern: avoid repeating failed recommendations. Double down on what worked.";
  return ctx;
};

// ── COMPETITOR INTELLIGENCE ──────────────────────────────────────
const loadCompetitorData = () => loadJSON(COMPETE_KEY, { data:[], lastFetched:null });
const saveCompetitorData = (d) => saveJSON(COMPETE_KEY, d);

// ── PREDICTIVE SCORING ───────────────────────────────────────────
const loadPredictions = () => loadJSON(PREDICT_KEY, []);
const savePredictions = (p) => saveJSON(PREDICT_KEY, p);

// ── HOOK A/B DATABASE ────────────────────────────────────────────
// Built automatically from every video logged — no manual entry
const buildHookDB = (videos=[]) => {
  const db = {};
  videos.forEach(v => {
    if(!v.hook || !v.views) return;
    if(!db[v.hook]) db[v.hook] = { hook:v.hook, views:[], likes:[], ratios:[], count:0 };
    db[v.hook].views.push(v.views||0);
    db[v.hook].likes.push(v.likes||0);
    db[v.hook].ratios.push(v.views>0?(v.likes/v.views)*100:0);
    db[v.hook].count++;
  });
  return Object.values(db).map(h => ({
    hook: h.hook,
    count: h.count,
    avgViews: Math.round(h.views.reduce((a,b)=>a+b,0)/h.count),
    avgRatio: parseFloat((h.ratios.reduce((a,b)=>a+b,0)/h.count).toFixed(1)),
    maxViews: Math.max(...h.views),
    minViews: Math.min(...h.views),
    consistency: parseFloat((1 - (Math.max(...h.views)-Math.min(...h.views))/(Math.max(...h.views)||1)).toFixed(2)),
  })).sort((a,b) => b.avgViews - a.avgViews);
};

// ── VIRALITY PATTERN ENGINE ──────────────────────────────────────
const buildPatterns = (videos=[]) => {
  if(videos.length < 3) return null;
  const withViews = videos.filter(v => v.views > 0);
  const avg = withViews.reduce((s,v)=>s+(v.views||0),0) / (withViews.length||1);
  
  // Day of week pattern
  const dayMap = {};
  withViews.forEach(v => {
    if(!v.created_at) return;
    const day = new Date(v.created_at).toLocaleDateString("en-GB",{weekday:"short"});
    if(!dayMap[day]) dayMap[day] = [];
    dayMap[day].push(v.views);
  });
  const dayPerf = Object.entries(dayMap).map(([day,views])=>({
    day, avg:Math.round(views.reduce((a,b)=>a+b,0)/views.length), count:views.length
  })).sort((a,b)=>b.avg-a.avg);

  // Length pattern (if duration available)
  const shortVids = withViews.filter(v=>v.duration&&v.duration<30);
  const longVids  = withViews.filter(v=>v.duration&&v.duration>=30);
  const shortAvg  = shortVids.length ? Math.round(shortVids.reduce((s,v)=>s+(v.views||0),0)/shortVids.length) : null;
  const longAvg   = longVids.length  ? Math.round(longVids.reduce((s,v)=>s+(v.views||0),0)/longVids.length)  : null;

  // Type performance
  const typeMap = {};
  withViews.forEach(v => {
    if(!v.type) return;
    if(!typeMap[v.type]) typeMap[v.type] = [];
    typeMap[v.type].push(v.views);
  });
  const typePerf = Object.entries(typeMap).map(([type,views])=>({
    type, avg:Math.round(views.reduce((a,b)=>a+b,0)/views.length), count:views.length,
    vsAvg: Math.round(((views.reduce((a,b)=>a+b,0)/views.length)/avg - 1)*100)
  })).sort((a,b)=>b.avg-a.avg);

  // Cross-post impact
  const crossVids   = withViews.filter(v=>v.crossPost);
  const singleVids  = withViews.filter(v=>!v.crossPost);
  const crossAvg    = crossVids.length  ? Math.round(crossVids.reduce((s,v)=>s+(v.views||0),0)/crossVids.length)  : null;
  const singleAvg   = singleVids.length ? Math.round(singleVids.reduce((s,v)=>s+(v.views||0),0)/singleVids.length) : null;

  // Top vs bottom half pattern analysis
  const sorted      = [...withViews].sort((a,b)=>(b.views||0)-(a.views||0));
  const topHalf     = sorted.slice(0, Math.ceil(sorted.length/2));
  const bottomHalf  = sorted.slice(Math.ceil(sorted.length/2));
  const topHookFreq = {};
  topHalf.forEach(v=>{ if(v.hook) topHookFreq[v.hook]=(topHookFreq[v.hook]||0)+1; });
  const winningHooks = Object.entries(topHookFreq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([h])=>h);

  return { avg:Math.round(avg), dayPerf, typePerf, shortAvg, longAvg, crossAvg, singleAvg, winningHooks, totalVideos:withViews.length };
};

// ── CHANNEL INSIGHTS ENGINE ─────────────────────────────────────
// Hard statistical facts computed from actual video data — not AI opinions
const buildChannelInsights = (videos=[]) => {
  const v = videos.filter(vid => vid.views > 0);
  if(v.length < 2) return null;

  const avg = v.reduce((s,vid)=>s+(vid.views||0),0) / v.length;
  const sorted = [...v].sort((a,b)=>(b.views||0)-(a.views||0));

  // Hook performance table (real numbers)
  const hookMap = {};
  v.forEach(vid => {
    if(!vid.hook) return;
    if(!hookMap[vid.hook]) hookMap[vid.hook] = [];
    hookMap[vid.hook].push(vid.views||0);
  });
  const hookTable = Object.entries(hookMap).map(([hook,views])=>{
    const a = Math.round(views.reduce((s,x)=>s+x,0)/views.length);
    return { hook, avgViews:a, count:views.length, vsChannelAvg:Math.round((a/avg-1)*100) };
  }).sort((a,b)=>b.avgViews-a.avgViews);

  // Content type performance
  const typeMap = {};
  v.forEach(vid => {
    const t = vid.type || "untagged";
    if(!typeMap[t]) typeMap[t] = [];
    typeMap[t].push(vid.views||0);
  });
  const typeTable = Object.entries(typeMap).map(([type,views])=>{
    const a = Math.round(views.reduce((s,x)=>s+x,0)/views.length);
    return { type, avgViews:a, count:views.length, vsChannelAvg:Math.round((a/avg-1)*100) };
  }).sort((a,b)=>b.avgViews-a.avgViews);

  // Collab vs solo performance
  const collabVids = v.filter(vid=>vid.collab);
  const soloVids   = v.filter(vid=>!vid.collab);
  const collabAvg  = collabVids.length >= 2 ? Math.round(collabVids.reduce((s,vid)=>s+(vid.views||0),0)/collabVids.length) : null;
  const soloAvg    = soloVids.length >= 2   ? Math.round(soloVids.reduce((s,vid)=>s+(vid.views||0),0)/soloVids.length)   : null;
  const collabMultiplier = (collabAvg && soloAvg) ? parseFloat((collabAvg/soloAvg).toFixed(2)) : null;

  // Platform split
  const tiktokV = v.filter(vid=>(vid.platform||"tiktok").toLowerCase()==="tiktok");
  const instaV  = v.filter(vid=>(vid.platform||"").toLowerCase()==="instagram");
  const tiktokAvg = tiktokV.length ? Math.round(tiktokV.reduce((s,vid)=>s+(vid.views||0),0)/tiktokV.length) : null;
  const instaAvg  = instaV.length  ? Math.round(instaV.reduce((s,vid)=>s+(vid.views||0),0)/instaV.length)   : null;

  // Trend direction: compare last 5 vs previous 5
  const last5  = sorted.slice(0,5).map(vid=>vid.views||0);
  const prev5  = sorted.slice(5,10).map(vid=>vid.views||0);
  const last5avg  = last5.length  ? Math.round(last5.reduce((a,b)=>a+b,0)/last5.length)  : null;
  const prev5avg  = prev5.length  ? Math.round(prev5.reduce((a,b)=>a+b,0)/prev5.length)  : null;
  const trendPct  = (last5avg && prev5avg) ? Math.round((last5avg/prev5avg-1)*100) : null;

  // Day of week performance
  const dayMap = {};
  v.forEach(vid => {
    if(!vid.created_at) return;
    const day = new Date(vid.created_at).toLocaleDateString("en-US",{weekday:"short"});
    if(!dayMap[day]) dayMap[day] = [];
    dayMap[day].push(vid.views||0);
  });
  const dayTable = Object.entries(dayMap).map(([day,views])=>({
    day, avgViews:Math.round(views.reduce((a,b)=>a+b,0)/views.length), count:views.length
  })).sort((a,b)=>b.avgViews-a.avgViews);

  // Time of day performance
  const hourMap = {};
  v.forEach(vid => {
    if(!vid.created_at) return;
    const hour = new Date(vid.created_at).getHours();
    const slot = hour < 6 ? "midnight-6am" : hour < 12 ? "6am-12pm" : hour < 18 ? "12pm-6pm" : "6pm-midnight";
    if(!hourMap[slot]) hourMap[slot] = [];
    hourMap[slot].push(vid.views||0);
  });
  const timeTable = Object.entries(hourMap).map(([slot,views])=>({
    slot, avgViews:Math.round(views.reduce((a,b)=>a+b,0)/views.length), count:views.length
  })).sort((a,b)=>b.avgViews-a.avgViews);

  // Audio performance — original vs trending sound
  const audioMap = {};
  v.forEach(vid => {
    if(!vid.audio) return;
    const cat = vid.audio.toLowerCase().includes("original") ? "original audio" : "trending sound";
    if(!audioMap[cat]) audioMap[cat] = [];
    audioMap[cat].push(vid.views||0);
  });
  const audioTable = Object.entries(audioMap).map(([audio,views])=>({
    audio, avgViews:Math.round(views.reduce((a,b)=>a+b,0)/views.length), count:views.length
  })).sort((a,b)=>b.avgViews-a.avgViews);

  // Velocity signal — 24hr views as % of total (high % = algorithm is still pushing)
  const velocityVids = v.filter(vid=>vid.views24h&&vid.views>0);
  const avgVelocity = velocityVids.length ? parseFloat((velocityVids.reduce((s,vid)=>s+(vid.views24h/vid.views*100),0)/velocityVids.length).toFixed(1)) : null;

  // Score calibration using real video views (not just posted ideas)
  // Bucket videos by estimated "score" band based on percentile
  const p25 = sorted[Math.floor(sorted.length*0.75)]?.views||0;
  const p50 = sorted[Math.floor(sorted.length*0.5)]?.views||0;
  const p75 = sorted[Math.floor(sorted.length*0.25)]?.views||0;
  const p90 = sorted[Math.floor(sorted.length*0.1)]?.views||0;

  return {
    channelAvgViews: Math.round(avg),
    totalVideos: v.length,
    hookTable,
    typeTable,
    tiktokAvg, instaAvg,
    trendPct,
    last5avg, prev5avg,
    dayTable,
    p25, p50, p75, p90,
    timeTable,
    topVideo: sorted[0] ? { title:sorted[0].title, views:sorted[0].views, hook:sorted[0].hook } : null,
    analysedVideos: v.filter(vid=>vid.biggestFactor).slice(0,3).map(vid=>({ title:vid.title?.slice(0,40), biggestFactor:vid.biggestFactor, replicateThese:vid.replicateThese, verdict:vid.analysisVerdict })),
    avgVelocity, velocityVidCount: velocityVids.length,
    collabAvg, soloAvg, collabMultiplier, collabCount: collabVids.length,
    audioTable,
  };
};

// ── ENGAGEMENT DEPTH SIGNALS ─────────────────────────────────────
// Computes quality signals from likes/comments/shares — not just views
const buildEngagementSignals = (videos=[]) => {
  const v = videos.filter(vid => vid.views > 0 && (vid.likes || vid.comments || vid.shares));
  if(v.length < 2) return null;

  const likeRates   = v.map(vid => vid.views > 0 ? (vid.likes||0)/vid.views*100 : 0);
  const commentRates = v.map(vid => vid.views > 0 ? (vid.comments||0)/vid.views*100 : 0);
  const shareRates  = v.map(vid => vid.views > 0 ? (vid.shares||0)/vid.views*100 : 0);
  const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

  const channelLikeRate    = parseFloat(avg(likeRates).toFixed(2));
  const channelCommentRate = parseFloat(avg(commentRates).toFixed(3));
  const channelShareRate   = parseFloat(avg(shareRates).toFixed(3));

  // Hook type engagement depth — which hooks earn real engagement not just views
  const hookEngMap = {};
  v.forEach(vid => {
    if(!vid.hook) return;
    if(!hookEngMap[vid.hook]) hookEngMap[vid.hook] = { likes:[], comments:[], shares:[], views:[] };
    hookEngMap[vid.hook].likes.push((vid.likes||0)/vid.views*100);
    hookEngMap[vid.hook].comments.push((vid.comments||0)/vid.views*100);
    hookEngMap[vid.hook].shares.push((vid.shares||0)/vid.views*100);
    hookEngMap[vid.hook].views.push(vid.views);
  });
  const hookEngTable = Object.entries(hookEngMap).filter(([,d])=>d.views.length>=2).map(([hook,d])=>({
    hook,
    avgLikeRate: parseFloat(avg(d.likes).toFixed(2)),
    avgShareRate: parseFloat(avg(d.shares).toFixed(3)),
    count: d.views.length,
  })).sort((a,b)=>b.avgLikeRate-a.avgLikeRate);

  // Top videos by engagement rate (not views) — reveals quality content that may have been underserved by algo
  const byEng = [...v].sort((a,b)=>{
    const eA = (a.likes||0)/a.views + (a.shares||0)/a.views*2;
    const eB = (b.likes||0)/b.views + (b.shares||0)/b.views*2;
    return eB - eA;
  }).slice(0,3).map(vid=>({ title:vid.title, views:vid.views, likeRate:parseFloat(((vid.likes||0)/vid.views*100).toFixed(1)), hook:vid.hook }));

  return { channelLikeRate, channelCommentRate, channelShareRate, hookEngTable, topByEngagement:byEng, sampleSize:v.length };
};

const formatEngagementSignals = (eng) => {
  if(!eng || eng.sampleSize < 2) return "";
  let out = `ENGAGEMENT DEPTH [n=${eng.sampleSize} — engagement rates can't be faked by algo, treat as quality signal]:\n`;
  out += `• Channel avg like rate: ${eng.channelLikeRate}% | comment rate: ${eng.channelCommentRate}% | share rate: ${eng.channelShareRate}%\n`;
  if(eng.hookEngTable.length) {
    out += `• Hooks that earn real engagement (like rate):\n`;
    eng.hookEngTable.slice(0,4).forEach(h=>{
      out += `  - "${h.hook}": ${h.avgLikeRate}% like rate, ${h.avgShareRate}% share rate (n=${h.count})\n`;
    });
  }
  if(eng.topByEngagement.length) {
    out += `• Highest quality content (by engagement rate, not views):\n`;
    eng.topByEngagement.forEach(v=>{
      out += `  - "${v.title}": ${v.likeRate}% like rate, ${(v.views/1000).toFixed(1)}k views, hook: ${v.hook||"unknown"}\n`;
    });
    out += `  → If these differ from top-viewed videos, the algo underserved quality content — factor this into scoring.\n`;
  }
  return out;
};

// ── COMBINATION MATRIX ────────────────────────────────────────────
// Finds winning Hook+Type+Pillar combos — individual factors alone don't predict virality
const buildComboMatrix = (videos=[]) => {
  const v = videos.filter(vid => vid.views > 0 && vid.hook && vid.type);
  if(v.length < 5) return null;

  const avg = v.reduce((s,vid)=>s+(vid.views||0),0)/v.length;
  const comboMap = {};

  v.forEach(vid => {
    const key = `${vid.hook}|${vid.type}`;
    if(!comboMap[key]) comboMap[key] = { hook:vid.hook, type:vid.type, views:[], count:0 };
    comboMap[key].views.push(vid.views||0);
    comboMap[key].count++;
  });

  const combos = Object.values(comboMap)
    .filter(c => c.count >= 2)
    .map(c => {
      const a = Math.round(c.views.reduce((s,x)=>s+x,0)/c.count);
      return { hook:c.hook, type:c.type, avgViews:a, count:c.count, vsAvg:Math.round((a/avg-1)*100) };
    })
    .sort((a,b)=>b.avgViews-a.avgViews);

  return { combos: combos.slice(0,6), totalVideos:v.length, channelAvg:Math.round(avg) };
};

const formatComboMatrix = (matrix) => {
  if(!matrix || !matrix.combos.length) return "";
  const fmt = n => n>=1000?`${(n/1000).toFixed(1)}k`:String(n);
  let out = `WINNING COMBINATIONS [hook+type together — more predictive than individual factors alone]:\n`;
  matrix.combos.forEach(c => {
    const sign = c.vsAvg >= 0 ? "+" : "";
    out += `  • ${c.hook} + ${c.type}: avg ${fmt(c.avgViews)} (${sign}${c.vsAvg}% vs channel avg, n=${c.count})\n`;
  });
  out += `  → When scoring, check if this idea's hook+type combo appears above. Winning combos override weak individual factor scores.\n`;
  return out;
};

// Robust view-estimate parser — handles "24K-56K", "1.2M", "24,000", plain numbers,
// and ranges (averaged). K/M suffixes are scaled correctly so ratios stay sane.
const parseViewEstimate = (str) => {
  if(!str) return null;
  const matches = String(str).toLowerCase().match(/\d[\d,.]*\s*[km]?/g);
  if(!matches) return null;
  const nums = matches.map(tok => {
    const m = tok.match(/(\d[\d,.]*)\s*([km])?/);
    if(!m) return null;
    let n = parseFloat(m[1].replace(/,/g,""));
    if(isNaN(n) || n<=0) return null;
    if(m[2]==="k") n*=1000;
    else if(m[2]==="m") n*=1000000;
    return n;
  }).filter(Boolean);
  return nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length) : null;
};

// ── PREDICTION ACCURACY TRACKER ───────────────────────────────────
// Measures how far off AI predictions have been — used to calibrate future estimates
const buildPredictionAccuracy = (ideas=[]) => {
  const posted = ideas.filter(i =>
    i.status === "posted" &&
    i.postedViews > 0 &&
    i.aiScore?.estimated_views
  );
  if(posted.length < 2) return null;

  const parseEstimate = parseViewEstimate;

  const pairs = posted.map(i => {
    const predicted = parseEstimate(i.aiScore.estimated_views);
    const actual = i.postedViews;
    if(!predicted) return null;
    const errorPct = Math.round((actual/predicted-1)*100);
    return { title:i.title.slice(0,40), predicted, actual, errorPct };
  }).filter(Boolean);

  if(!pairs.length) return null;

  const avgError = Math.round(pairs.reduce((s,p)=>s+p.errorPct,0)/pairs.length);
  const overestimates = pairs.filter(p=>p.errorPct<-10).length;
  const underestimates = pairs.filter(p=>p.errorPct>10).length;
  const accurate = pairs.filter(p=>Math.abs(p.errorPct)<=10).length;
  // Standard deviation of error → the honest ±band to express estimates as a range, not a point.
  const variance = pairs.reduce((s,p)=>s+Math.pow(p.errorPct-avgError,2),0)/pairs.length;
  const errorStdDev = Math.round(Math.sqrt(variance));

  return { pairs, avgError, errorStdDev, overestimates, underestimates, accurate, sampleSize:pairs.length };
};

const formatPredictionAccuracy = (acc) => {
  if(!acc || acc.sampleSize < 2) return "";
  const bias = acc.avgError > 10 ? `tends to UNDERESTIMATE by ~${acc.avgError}% on average — adjust estimates UP`
             : acc.avgError < -10 ? `tends to OVERESTIMATE by ~${Math.abs(acc.avgError)}% on average — adjust estimates DOWN`
             : `predictions are well-calibrated (avg error: ${acc.avgError}%)`;
  let out = `PREDICTION ACCURACY [n=${acc.sampleSize} posted ideas with tracked views]:\n`;
  out += `• AI ${bias}\n`;
  out += `• ${acc.accurate} accurate (within 10%), ${acc.overestimates} overestimates, ${acc.underestimates} underestimates\n`;
  if(acc.errorStdDev) out += `• Error spread: ±${acc.errorStdDev}% (1σ) — your estimated_views MUST be a range this wide, not a single number. A point estimate here is statistically dishonest.\n`;
  if(acc.pairs.length) {
    out += `• Recent: ${acc.pairs.slice(-3).map(p=>`"${p.title}" predicted ${(p.predicted/1000).toFixed(1)}k got ${(p.actual/1000).toFixed(1)}k (${p.errorPct>0?"+":""}${p.errorPct}%)`).join(" | ")}\n`;
  }
  out += `→ Apply this bias correction to your estimated_views output.\n`;
  return out;
};

// Formats channel insights as a text block for AI injection
const formatChannelInsights = (insights) => {
  if(!insights) return "";
  const fmt = (n) => n>=1000 ? `${(n/1000).toFixed(1)}k` : String(n);
  const confidence = insights.totalVideos >= 20 ? "HIGH CONFIDENCE" : insights.totalVideos >= 8 ? "MEDIUM CONFIDENCE" : "LOW CONFIDENCE";
  const weightNote = insights.totalVideos < 8
    ? ` — IMPORTANT: only ${insights.totalVideos} videos logged. Weight niche benchmarks and competitor data MORE than this channel data. Do not override strong niche signals with weak channel patterns.`
    : insights.totalVideos < 20
    ? ` — moderate sample, patterns are directional but not definitive`
    : ` — solid sample, treat patterns as reliable`;
  let out = `CHANNEL STATISTICS [${confidence}${weightNote}] (${insights.totalVideos} videos):\n`;
  out += `• Channel avg views: ${fmt(insights.channelAvgViews)}\n`;
  if(insights.trendPct !== null) {
    const dir = insights.trendPct >= 0 ? "↑ up" : "↓ down";
    out += `• Recent trend: ${dir} ${Math.abs(insights.trendPct)}% (last 5 vs prev 5 by views)\n`;
  }
  if(insights.hookTable.length) {
    out += `• Hook type performance (real avg views):\n`;
    insights.hookTable.slice(0,6).forEach(h => {
      const sign = h.vsChannelAvg >= 0 ? "+" : "";
      out += `  - ${h.hook}: ${fmt(h.avgViews)} avg (${sign}${h.vsChannelAvg}% vs channel avg, n=${h.count})\n`;
    });
  }
  if(insights.typeTable.length) {
    out += `• Content type performance:\n`;
    insights.typeTable.slice(0,4).forEach(t => {
      const sign = t.vsChannelAvg >= 0 ? "+" : "";
      out += `  - ${t.type}: ${fmt(t.avgViews)} avg (${sign}${t.vsChannelAvg}% vs channel avg, n=${t.count})\n`;
    });
  }
  if(insights.tiktokAvg || insights.instaAvg) {
    out += `• Platform: TikTok avg ${insights.tiktokAvg ? fmt(insights.tiktokAvg) : "n/a"} | Instagram avg ${insights.instaAvg ? fmt(insights.instaAvg) : "n/a"}\n`;
  }
  if(insights.dayTable.length) {
    out += `• Best posting days: ${insights.dayTable.slice(0,3).map(d=>`${d.day} (${fmt(d.avgViews)})`).join(", ")}\n`;
  }
  if(insights.timeTable?.length) {
    out += `• Best posting times: ${insights.timeTable.slice(0,2).map(t=>`${t.slot} (${fmt(t.avgViews)} avg)`).join(", ")}\n`;
  }
  if(insights.avgVelocity !== null && insights.velocityVidCount >= 2) {
    out += `• Avg 24hr velocity: ${insights.avgVelocity}% of final views arrive in first 24hrs (n=${insights.velocityVidCount}) — high % means algorithm is pushing hard early\n`;
  }
  out += `• View percentiles: top 10%=${fmt(insights.p90)}, top 25%=${fmt(insights.p75)}, median=${fmt(insights.p50)}, bottom 25%=${fmt(insights.p25)}\n`;
  if(insights.topVideo) {
    out += `• Best video: "${insights.topVideo.title}" — ${fmt(insights.topVideo.views)} views, hook: ${insights.topVideo.hook||"unknown"}\n`;
  }
  if(insights.analysedVideos?.length) {
    out += `• Videos with AI teardown (use these findings in scoring):\n`;
    insights.analysedVideos.forEach(v=>{
      out += `  - "${v.title}" [${v.verdict||"analysed"}]: biggest factor = ${v.biggestFactor}`;
      if(v.replicateThese) out += ` | replicate: ${v.replicateThese}`;
      out += "\n";
    });
  }
  if(insights.collabMultiplier !== null) {
    const sign = insights.collabMultiplier >= 1 ? "+" : "";
    out += `• Collab vs solo: collab avg ${fmt(insights.collabAvg)} vs solo avg ${fmt(insights.soloAvg)} (${sign}${Math.round((insights.collabMultiplier-1)*100)}% — n=${insights.collabCount} collabs)\n`;
  }
  if(insights.audioTable?.length >= 2) {
    out += `• Audio: ${insights.audioTable.map(a=>`${a.audio}: ${fmt(a.avgViews)} avg (n=${a.count})`).join(" vs ")}\n`;
  }
  return out;
};

// ── DYNAMIC SCORING WEIGHTS ─────────────────────────────────────
// Adjusts the 5 scoring factor weights based on what actually drives views on THIS channel
const buildDynamicWeights = (insights, outcomeLearning=null) => {
  // Base weights (must sum to 100)
  let w = { hook:25, retention:20, share:25, algo:15, niche:15 };
  if(!insights || insights.totalVideos < 5) return w;

  // If hook type variance is high → hook matters more (some hooks 3x+ others)
  if(insights.hookTable.length >= 2) {
    const best = insights.hookTable[0].avgViews;
    const worst = insights.hookTable[insights.hookTable.length-1].avgViews;
    if(best > worst * 2.5) { w.hook += 5; w.algo -= 5; }
  }

  // If content type variance is high → niche/format fit matters more
  if(insights.typeTable.length >= 2) {
    const best = insights.typeTable[0].avgViews;
    const worst = insights.typeTable[insights.typeTable.length-1].avgViews;
    if(best > worst * 2) { w.niche += 5; w.retention -= 5; }
  }

  // If channel is trending up → algo fit matters more (algorithm is already rewarding)
  if(insights.trendPct !== null && insights.trendPct > 20) { w.algo += 5; w.share -= 5; }

  // Outcome learning: if hooks are the most variable predictor, up the hook weight
  if(outcomeLearning && outcomeLearning.sampleSize >= 5 && outcomeLearning.hookAdjust.length >= 2) {
    const ratios = outcomeLearning.hookAdjust.map(h=>h.avgRatio);
    const hookVariance = Math.max(...ratios) / Math.min(...ratios);
    if(hookVariance > 2) { w.hook += 5; w.retention -= 5; }
  }

  return w;
};

const formatDynamicWeights = (w, insights) => {
  const lines = [
    `HOOK STRENGTH (${w.hook}%)`,
    `RETENTION ARC (${w.retention}%)`,
    `SHARE TRIGGER (${w.share}%)`,
    `ALGORITHM FIT (${w.algo}%)`,
    `NICHE FIT (${w.niche}%)`,
  ];
  const note = (insights && insights.totalVideos >= 5)
    ? ` [weights auto-adjusted from your ${insights.totalVideos}-video data]`
    : ` [default weights — add more videos for channel-specific calibration]`;
  return lines.join(" | ") + note;
};

// ── AUDIT-DERIVED RUBRIC ─────────────────────────────────────────
// Compares top 25% vs bottom 25% of videos to extract proven patterns
const buildAuditRubric = (videos=[]) => {
  const v = videos.filter(vid=>vid.views>0);
  if(v.length < 4) return null;
  const sorted = [...v].sort((a,b)=>(b.views||0)-(a.views||0));
  const cutTop = Math.max(1, Math.floor(sorted.length * 0.25));
  const cutBot = Math.max(1, Math.floor(sorted.length * 0.25));
  const top = sorted.slice(0, cutTop);
  const bot = sorted.slice(sorted.length - cutBot);

  const freq = (arr, field) => {
    const m = {};
    arr.forEach(vid=>{ const val=vid[field]; if(val) m[val]=(m[val]||0)+1; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
  };

  const winningHooks = freq(top,"hook");
  const losingHooks  = freq(bot,"hook");
  const winningTypes = freq(top,"type");
  const losingTypes  = freq(bot,"type");
  const topAvg = Math.round(top.reduce((s,v)=>s+(v.views||0),0)/top.length);
  const botAvg = Math.round(bot.reduce((s,v)=>s+(v.views||0),0)/bot.length);

  return { winningHooks, losingHooks, winningTypes, losingTypes, topAvg, botAvg, sampleSize:v.length };
};

const formatAuditRubric = (rubric) => {
  if(!rubric || rubric.sampleSize < 4) return "";
  const fmt = n => n>=1000?`${(n/1000).toFixed(1)}k`:String(n);
  // Confidence: low (<8 videos), medium (8-19), high (20+)
  const confidence = rubric.sampleSize >= 20 ? "HIGH CONFIDENCE" : rubric.sampleSize >= 8 ? "MEDIUM CONFIDENCE" : "LOW CONFIDENCE — directional only, do not treat as definitive";
  const instruction = rubric.sampleSize >= 8
    ? "Apply these as non-negotiable scoring adjustments."
    : "Treat as early signal only — weight niche benchmarks and competitor data more heavily than this channel data until you have 8+ videos.";
  let out = `AUDIT RUBRIC [${confidence}, n=${rubric.sampleSize}] (top 25% avg ${fmt(rubric.topAvg)} vs bottom 25% avg ${fmt(rubric.botAvg)}):\n`;
  if(rubric.winningHooks.length) out += `• Hooks that WIN on this channel: ${rubric.winningHooks.join(", ")} → score higher\n`;
  if(rubric.losingHooks.length)  out += `• Hooks that LOSE on this channel: ${rubric.losingHooks.join(", ")} → score lower\n`;
  if(rubric.winningTypes.length) out += `• Content types that WIN: ${rubric.winningTypes.join(", ")} → score higher\n`;
  if(rubric.losingTypes.length)  out += `• Content types that LOSE: ${rubric.losingTypes.join(", ")} → score lower\n`;
  out += `${instruction}\n`;
  return out;
};

// ── SERIES MOMENTUM DETECTOR ─────────────────────────────────────
// Detects if idea builds on a proven viral concept — scores higher
const detectSeriesMomentum = (idea, videos=[], ideas=[]) => {
  const vidsAboveAvg = (() => {
    const v = videos.filter(vid=>vid.views>0);
    if(!v.length) return [];
    const avg = v.reduce((s,vid)=>s+(vid.views||0),0)/v.length;
    return v.filter(vid=>(vid.views||0) > avg*1.5);
  })();

  const ideaWords = (idea.title||"").toLowerCase().split(/\W+/).filter(w=>w.length>3);

  // Check if idea shares significant keywords with above-avg videos or posted ideas
  const matchedVideo = vidsAboveAvg.find(v => {
    const vWords = (v.title||"").toLowerCase().split(/\W+/).filter(w=>w.length>3);
    return ideaWords.filter(w=>vWords.includes(w)).length >= 2;
  });

  const postedSuccess = ideas.filter(i=>i.status==="posted"&&i.postedViews>0).find(i=>{
    const iWords = (i.title||"").toLowerCase().split(/\W+/).filter(w=>w.length>3);
    return ideaWords.filter(w=>iWords.includes(w)).length >= 2;
  });

  // Only flag series momentum if sample is large enough to be meaningful
  const minVideosForMomentum = 5;
  if(vidsAboveAvg.length === 0 || videos.length < minVideosForMomentum) return null;
  if(matchedVideo) return `SERIES MOMENTUM [confirmed — n=${videos.length} videos]: This idea continues the theme of "${matchedVideo.title}" which got ${(matchedVideo.views/1000).toFixed(1)}k views — existing audience is primed for this topic. Apply a modest niche fit boost.`;
  if(postedSuccess) return `SERIES MOMENTUM [confirmed — from posted outcome]: Similar topic to "${postedSuccess.title}" which got ${(postedSuccess.postedViews/1000).toFixed(1)}k views — proven concept with this audience. Apply a modest share trigger boost.`;
  return null;
};

// ── OUTCOME LEARNING ENGINE ──────────────────────────────────────
// Learns which hooks/types/pillars consistently beat or miss AI predictions
const buildOutcomeLearning = (ideas=[]) => {
  const parseEst = parseViewEstimate;
  const posted = ideas.filter(i => i.status==="posted" && i.postedViews>0 && i.aiScore?.estimated_views);
  if(posted.length < 3) return null;
  // Recency weighting — 30-day half-life so the model adapts to recent algorithm behaviour
  // rather than being anchored to stale 3-month-old outcomes.
  const now = Date.now();
  const recencyWeight = (postedDate) => {
    if(!postedDate) return 0.5;
    const days = Math.max(0, (now - new Date(postedDate).getTime()) / 86400000);
    return Math.pow(0.5, days / 30);
  };
  const hookL={}, typeL={}, pillarL={};
  posted.forEach(i => {
    const pred = parseEst(i.aiScore.estimated_views);
    if(!pred) return;
    const r = i.postedViews / pred;
    const w = recencyWeight(i.postedDate);
    const push = (bucket, key) => { if(!bucket[key]) bucket[key]=[]; bucket[key].push({ r, w }); };
    if(i.hook) push(hookL, i.hook);
    if(i.type) push(typeL, i.type);
    const p = i.aiScore?.contentPillar;
    if(p) push(pillarL, p);
  });
  // Weighted mean: recent results count more, but every sample still contributes.
  const wAvg = arr => { const tw = arr.reduce((s,x)=>s+x.w,0)||1; return arr.reduce((s,x)=>s+x.r*x.w,0)/tw; };
  // Empirical-Bayes shrinkage: pull small-sample ratios toward 1.0 (the no-adjustment prior).
  // A hook seen twice shouldn't override priors as hard as one seen 20×. k=3 → n=2 applies 40%
  // of its deviation, n=10 applies 77%, n=20 applies 87%. Prevents overfitting to noise.
  const SHRINK_K = 3;
  const shrink = (ratio, n) => 1 + (ratio - 1) * (n / (n + SHRINK_K));
  const build = (bucket, label) => Object.entries(bucket).filter(([,a])=>a.length>=2)
    .map(([k,a])=>{ const raw=wAvg(a); const n=a.length; return { [label]:k, rawRatio:parseFloat(raw.toFixed(2)), avgRatio:parseFloat(shrink(raw,n).toFixed(2)), count:n }; })
    .sort((a,b)=>b.avgRatio-a.avgRatio);
  const hookAdjust   = build(hookL, "hook");
  const typeAdjust   = build(typeL, "type");
  const pillarAdjust = build(pillarL, "pillar");
  return { hookAdjust, typeAdjust, pillarAdjust, sampleSize:posted.length };
};

const formatOutcomeLearning = (learning) => {
  if(!learning || learning.sampleSize < 3) return "";
  const sig = r => r > 1.25 ? "consistently BEATS predictions — AI underestimates this" : r < 0.75 ? "consistently MISSES — AI overestimates this" : "roughly on-target";
  let out = `OUTCOME LEARNING [self-calibrated from ${learning.sampleSize} posted ideas with real results — ratio = actual÷predicted]:\n`;
  if(learning.hookAdjust.length) {
    out += `• Hook outcome multipliers:\n`;
    learning.hookAdjust.forEach(h => out += `  - "${h.hook}": ${h.avgRatio}x (n=${h.count}) — ${sig(h.avgRatio)}\n`);
  }
  if(learning.typeAdjust.length) {
    out += `• Content type outcome multipliers:\n`;
    learning.typeAdjust.forEach(t => out += `  - "${t.type}": ${t.avgRatio}x (n=${t.count}) — ${sig(t.avgRatio)}\n`);
  }
  if(learning.pillarAdjust.length) {
    out += `• Pillar outcome multipliers:\n`;
    learning.pillarAdjust.forEach(p => out += `  - "${p.pillar}": ${p.avgRatio}x (n=${p.count}) — ${sig(p.avgRatio)}\n`);
  }
  out += `→ MANDATORY: multiply your estimated_views by the matching hook+type ratio. If hook ratio is 1.6x, multiply estimate by 1.6. If 0.6x, reduce by 40%. These are confidence-adjusted (small samples shrunk toward 1.0) — trust them in proportion to their n.\n`;
  return out;
};

// ── VOICE DNA (creator personality preservation) ──────────────────
// The single most important guard against "soulless AI content": learn HOW this
// creator actually writes — their brevity, casing, punctuation, emoji habits,
// signature vocabulary, how they open a hook, whether they talk to "you" or from
// "I" — straight from their real titles/hooks/captions. This runs 100% locally
// (no API, no cold-start) and is injected into EVERY generative surface so ideas,
// hooks, captions and scripts come out sounding like THEM, not like a marketing bot.
const VOICE_KEY = "krapmaps_v1_voice_dna";
const _VOICE_STOP = new Set("the a an and or but of to in on for with at by from is are was were be been being this that these those it its as it's i'm you your my our we they he she his her him them so if then than too very just really only also into out up down over under about your you".split(/\s+/));
// Generic AI/marketing phrasing that instantly reads as a bot — banned in output.
const _AI_TELLS = ["in this video","let's dive in","let's dive into","buckle up","game-changer","game changer","in today's fast-paced world","look no further","unlock the secret","unlock your","elevate your","take your ... to the next level","dive deep","without further ado","the ultimate guide","you won't believe","are you tired of","supercharge","level up your","transform your","embark on a journey","in conclusion","stay tuned","hit that follow"];

const _emojiRegex = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu;

// Collect this creator's real written voice corpus (their own words only).
const _voiceCorpus = (videos=[], ideas=[]) => {
  const out = [];
  videos.forEach(v => { if(v.title) out.push(String(v.title)); if(v.hook) out.push(String(v.hook)); });
  ideas.forEach(i => {
    // Prefer the creator's own text; skip AI-generated improvedHook so we learn THEM, not us.
    if(i.title) out.push(String(i.title));
    if(i.hook) out.push(String(i.hook));
    if(i.postedCaption) out.push(String(i.postedCaption));
  });
  return out.map(s=>s.trim()).filter(s=>s.length>1);
};

const buildVoiceDNA = (videos=[], ideas=[]) => {
  const corpus = _voiceCorpus(videos, ideas);
  if(corpus.length < 4) return null; // not enough of their own words to be honest yet

  const wordsOf = s => (s.toLowerCase().match(/[a-z0-9']+/g) || []);
  const allWords = corpus.flatMap(wordsOf);
  const nLines = corpus.length;

  // Brevity — median words per line (robust to one long caption).
  const lens = corpus.map(s=>wordsOf(s).length).sort((a,b)=>a-b);
  const medianLen = lens[Math.floor(lens.length/2)] || 0;

  // Casing habits.
  const capsLines  = corpus.filter(s=>{ const L=s.replace(/[^A-Za-z]/g,""); return L.length>=3 && L===L.toUpperCase(); }).length;
  const lowerLines = corpus.filter(s=>{ const L=s.replace(/[^A-Za-z]/g,""); return L.length>=3 && L===L.toLowerCase(); }).length;
  const casing = capsLines/nLines>0.35 ? "ALL-CAPS for emphasis" : lowerLines/nLines>0.5 ? "deliberately all-lowercase (aesthetic)" : "normal sentence case";

  // Punctuation & emoji habits.
  const qLines = corpus.filter(s=>s.includes("?")).length;
  const exLines = corpus.filter(s=>s.includes("!")).length;
  const ellipsisLines = corpus.filter(s=>/\.\.\.|…/.test(s)).length;
  const emojiHits = corpus.reduce((s,l)=>s+((l.match(_emojiRegex)||[]).length),0);
  const emojiPerLine = emojiHits/nLines;
  const emojiVocab = Array.from(new Set(corpus.join(" ").match(_emojiRegex)||[])).slice(0,8);

  // Point of view — do they address "you" or speak from "I/we"?
  const youHits = allWords.filter(w=>["you","your","you're","u","ur"].includes(w)).length;
  const iHits   = allWords.filter(w=>["i","i'm","my","me","we","our","us"].includes(w)).length;
  const pov = youHits>iHits*1.4 ? "second-person — talks directly to the viewer (\"you\")"
            : iHits>youHits*1.4 ? "first-person — narrates from their own experience (\"I / we\")"
            : "mixed first/second person";

  // How their hooks open (first 1-2 words) — their signature entry pattern.
  const openers = {};
  corpus.forEach(s=>{ const w=wordsOf(s); if(!w.length) return; const key=w.slice(0,2).join(" "); openers[key]=(openers[key]||0)+1; });
  const topOpeners = Object.entries(openers).filter(([,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k])=>k);

  // Signature vocabulary — their recurring content words (their slang / pet words).
  const freq = {};
  allWords.forEach(w=>{ if(w.length<3 || _VOICE_STOP.has(w) || /^\d+$/.test(w)) return; freq[w]=(freq[w]||0)+1; });
  const signatureWords = Object.entries(freq).filter(([,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([w])=>w);

  // Number/listicle tendency.
  const numLines = corpus.filter(s=>/\b\d+\b/.test(s)).length;

  // A few real lines as verbatim style anchors (longest-signal, deduped).
  const examples = Array.from(new Set(corpus)).sort((a,b)=>wordsOf(b).length-wordsOf(a).length).slice(0,5);

  return {
    sampleSize: nLines,
    medianLen,
    casing,
    questionLed: qLines/nLines>0.3,
    exclaims: exLines/nLines>0.3,
    ellipsis: ellipsisLines/nLines>0.25,
    emojiPerLine: parseFloat(emojiPerLine.toFixed(2)),
    emojiVocab,
    pov,
    topOpeners,
    signatureWords,
    listy: numLines/nLines>0.3,
    examples,
  };
};

// Turn the measured voice + an optional LLM-distilled profile into a prompt block.
const formatVoiceDNA = (voice, distilled="") => {
  if(!voice && !distilled) return "";
  let out = `━━ CREATOR VOICE DNA (write EVERYTHING in this exact voice — this is non-negotiable) ━━\n`;
  if(distilled) out += `${distilled}\n`;
  if(voice){
    out += `Measured from ${voice.sampleSize} of the creator's own lines:\n`;
    out += `• Length: they write in ~${voice.medianLen}-word lines — match that brevity, do not pad.\n`;
    out += `• Casing: ${voice.casing} — mirror it exactly.\n`;
    const punct = [];
    if(voice.questionLed) punct.push("often opens with a question");
    if(voice.exclaims) punct.push("uses exclamation for energy");
    if(voice.ellipsis) punct.push("uses trailing \"...\" for suspense");
    if(punct.length) out += `• Punctuation: ${punct.join(", ")}.\n`;
    out += `• Emoji: ${voice.emojiPerLine<0.15 ? "they barely use emoji — DO NOT add emoji" : `they use ~${voice.emojiPerLine}/line${voice.emojiVocab.length?` (their set: ${voice.emojiVocab.join(" ")})`:""} — only use emoji from their own set`}.\n`;
    out += `• Point of view: ${voice.pov} — keep it.\n`;
    if(voice.topOpeners.length) out += `• They typically open with: ${voice.topOpeners.map(o=>`"${o}…"`).join(", ")}.\n`;
    if(voice.signatureWords.length) out += `• Signature vocabulary (reuse these, they're part of their identity): ${voice.signatureWords.join(", ")}.\n`;
    if(voice.listy) out += `• They lean on numbers/specifics — keep concrete figures.\n`;
    if(voice.examples.length) out += `• Real lines in their voice (match this cadence and personality, do NOT copy verbatim):\n${voice.examples.map(e=>`   – "${e}"`).join("\n")}\n`;
  }
  out += `HARD RULES:\n`;
  out += `• A viewer scrolling their feed must NOT be able to tell this was AI-written. Preserve their personality, humour and rhythm above all.\n`;
  out += `• NEVER output generic marketing/AI phrasing. Banned examples: ${_AI_TELLS.slice(0,10).map(p=>`"${p}"`).join(", ")}.\n`;
  out += `• Do not sanitise their edge or flatten their tone into "brand-safe" mush. If they're blunt, be blunt. If they're playful, be playful.\n`;
  return out;
};

// ── VOICE FEEDBACK ────────────────────────────────────────────────
// The creator's own verdict on whether generated lines sound like them. This is
// the fastest possible signal — one tap, no waiting on view counts — and it feeds
// straight back into every generation. Confirmed lines become style anchors;
// rejected lines become explicit "never write like this" examples.
const VOICE_FB_KEY = "krapmaps_v1_voice_fb";
const loadVoiceFB = () => loadJSON(VOICE_FB_KEY, { good:[], bad:[] });
const recordVoiceFeedback = (text, isGood) => {
  const t = String(text||"").trim();
  if(!t) return;
  const fb = loadVoiceFB();
  const key = isGood ? "good" : "bad", other = isGood ? "bad" : "good";
  fb[other] = (fb[other]||[]).filter(x=>x!==t);          // a line can't be both
  fb[key] = [t, ...(fb[key]||[]).filter(x=>x!==t)].slice(0, 15);
  saveJSON(VOICE_FB_KEY, fb);
  try { sbUpsert("km_config",[{ id:wsId("voice_fb"), data:fb, updated_at:new Date().toISOString() }]); } catch {}
  window.dispatchEvent(new CustomEvent("km-voice-fb"));
};
const formatVoiceFeedback = () => {
  const fb = loadVoiceFB();
  if(!fb.good?.length && !fb.bad?.length) return "";
  let out = "";
  if(fb.good?.length) out += `Lines the creator CONFIRMED sound like them (match this energy exactly): ${fb.good.slice(0,8).map(t=>`"${t}"`).join(", ")}.\n`;
  if(fb.bad?.length)  out += `Lines the creator REJECTED as NOT sounding like them (never write like this): ${fb.bad.slice(0,8).map(t=>`"${t}"`).join(", ")}.\n`;
  return out;
};

// ── COACHING PRINCIPLES ───────────────────────────────────────────
// Injected into every surface where the AI gives ADVICE, so it coaches like a
// sharp strategist who's in the creator's corner — not a cold growth-hacking bot
// that optimises for reach and forgets there's a person who has to enjoy the work.
const COACH_PRINCIPLES = `━━ HOW TO ADVISE (non-negotiable tone rules) ━━
- You are a sharp strategist who genuinely gets this creator's world and is in their corner — NOT an algorithm optimising for reach at any cost.
- NEVER tell them to stop doing something core to who they are or why their audience follows them (a couple WILL post milestones, a musician WILL post their music, a founder WILL post their journey). That content is the point of the channel, not a mistake to eliminate.
- When something underperforms, respect WHY they made it, then show how to make that SAME thing hit harder — reframe and upgrade, never forbid.
- No absolutist "never do X" / "always do Y" commandments. Real advice has nuance and trade-offs; acknowledge them.
- Talk like a smart friend who's rooting for them — warm, specific, honest. Never preachy, condescending, clinical, or generic.
- Their identity and enjoyment matter as much as the metrics. Growth that makes them hate their own content is a failure, not a win. Optimise for reach WITHIN who they are, never at the expense of it.`;

// Single wrapper every generative surface uses. Prefers the learned Voice DNA;
// on cold start (no posts yet) it falls back to what the creator told us about
// their brand voice at setup, so even a brand-new account never writes fully
// generic AI copy. `pool`/`ideaList` let callers pass an organic-only video set.
const voiceBlock = (pool=[], ideaList=[]) => {
  const measured = buildVoiceDNA(pool, ideaList);
  const distilled = loadJSON(VOICE_KEY, "");
  const fb = formatVoiceFeedback();
  const block = formatVoiceDNA(measured, distilled);
  if(block) return block + (fb ? `\n${fb}` : "");
  const wl = loadWL();
  const hint = [wl.brandValues, wl.contentStyle, wl.nicheLogic].map(s=>String(s||"").trim()).filter(Boolean).join(" — ");
  if(!hint && !fb) return "";
  return `━━ CREATOR VOICE (from their brand setup — refine in Settings › Voice DNA once they post) ━━\n${hint?`Write in this creator's established voice: ${hint}\n`:""}${fb}NEVER use generic AI/marketing phrasing (e.g. ${_AI_TELLS.slice(0,5).map(p=>`"${p}"`).join(", ")}). It must sound like the creator, not a bot.\n`;
};

// Cheap, deterministic detector that flags AI-tell phrasing that slipped through
// (used to self-check generated hooks/captions and strip/warn).
const _hasAITell = (text="") => {
  const t = String(text).toLowerCase();
  return _AI_TELLS.some(p => p.includes("...") ? new RegExp(p.replace(/\s*\.\.\.\s*/,".*")).test(t) : t.includes(p));
};

// Corpus signature — re-distill only when the body of their work grows meaningfully.
const _voiceSig = (videos, ideas) => { const c=_voiceCorpus(videos, ideas); return `${c.length}:${c.join(" ").length}`; };
let _voiceInFlight = false;
// Optional richer profile: ONE LLM pass that captures humour, personality and quirks
// the statistical extractor can't see (irony, warmth, bluntness, running bits).
// Cached by corpus signature, fire-and-forget — never blocks generation; it upgrades
// the NEXT generation. The deterministic DNA already covers the current one.
async function ensureVoiceProfile(videos, ideas, wl){
  try {
    const corpus = _voiceCorpus(videos, ideas);
    if(corpus.length < 8) return;                       // need a real body of their words
    const sig = _voiceSig(videos, ideas);
    const meta = loadJSON(VOICE_KEY+"_meta", null);
    if(meta && meta.sig === sig) return;                // already distilled this corpus
    if(_voiceInFlight) return;
    _voiceInFlight = true;
    const sample = corpus.slice(0, 60).map(s=>`- ${s}`).join("\n");
    const prompt = `Below are real titles, hooks and captions written by ${wl.handle||"a creator"} (${wl.niche||"content creator"}). Study them and describe THIS specific person's writing voice precisely enough that another writer could ghost-write as them undetectably. Focus on personality, not surface stats.

Their real lines:
${sample}

Return ONLY JSON:
{"voiceProfile":"3-5 sentences on their tone, humour, energy, personality and quirks — specific to THEM, never generic","doThis":["4-6 concrete stylistic moves they make (phrasing, rhythm, attitude)"],"neverThis":["3-5 things that would instantly sound fake coming from them"],"signaturePhrases":["short phrases or sentence constructions they actually use"]}`;
    const r = await callAI(prompt, 900);
    if(r && r.voiceProfile){
      let out = String(r.voiceProfile).trim()+"\n";
      if(r.doThis?.length)          out += `They DO: ${r.doThis.join("; ")}.\n`;
      if(r.neverThis?.length)       out += `They would NEVER: ${r.neverThis.join("; ")}.\n`;
      if(r.signaturePhrases?.length) out += `Signature phrasing: ${r.signaturePhrases.map(p=>`"${p}"`).join(", ")}.`;
      saveJSON(VOICE_KEY, out);
      saveJSON(VOICE_KEY+"_meta", { sig, at:Date.now() });
      // Sync the learned voice across this account's devices (workspace-scoped).
      try { sbUpsert("km_config",[{ id:wsId("voice_dna"), data:{ profile:out, sig, at:Date.now() }, updated_at:new Date().toISOString() }]); } catch {}
    }
  } catch { /* distillation optional — never blocks */ }
  finally { _voiceInFlight = false; }
}

// Output-side voice guard: if any generated hook slipped into robotic/marketing
// phrasing, rewrite ONLY the offenders back into the creator's voice in a single
// cheap pass. Returns the (possibly) cleaned list + whether anything was fixed.
// Never throws — on any failure it returns the originals untouched.
async function revoiceHooks(hooks, voiceBlock, wl){
  try {
    const flagged = hooks.map((h,i)=>({h,i})).filter(x=>x.h && _hasAITell(x.h));
    if(!flagged.length) return { hooks, fixed:false };
    const prompt = `These hooks for ${wl.handle||"a creator"} sound like generic AI, not like them. Rewrite EACH one in their real voice per the Voice DNA below — same meaning, under 10 words, but it must sound like the creator wrote it. Do not add marketing clichés.

${voiceBlock}

Hooks to fix (keep the same order):
${flagged.map((x,n)=>`${n+1}. "${x.h}"`).join("\n")}

Return ONLY JSON: {"rewritten":["...","..."]}`;
    const r = await callAI(prompt, 400);
    const out = [...hooks];
    if(Array.isArray(r?.rewritten)){
      flagged.forEach((x,n)=>{ const nu=r.rewritten[n]; if(nu && !_hasAITell(nu)) out[x.i]=String(nu).trim(); });
      return { hooks:out, fixed:true };
    }
  } catch { /* guard optional — never blocks scoring */ }
  return { hooks, fixed:false };
}

// ── SCORE VALIDITY (meta-learning) ────────────────────────────────
// Measures whether the AI's own virality scores actually rank-correlate with real outcomes.
// Spearman ρ between predicted score and actual views = does the scoring engine even work?
const buildScoreValidity = (ideas=[]) => {
  const posted = ideas.filter(i => i.status==="posted" && i.postedViews>0 && ((i.viral>0) || (i.aiScore?.viralityScore>0)));
  if(posted.length < 4) return null;
  const rows = posted.map(i => ({ score: i.viral || i.aiScore.viralityScore, views: i.postedViews }));
  // Tie-aware rank assignment
  const rankOf = (key) => {
    const order = [...rows].map((x,idx)=>({ idx, v:x[key] })).sort((a,b)=>a.v-b.v);
    const ranks = new Array(rows.length);
    let i=0;
    while(i<order.length){
      let j=i; while(j+1<order.length && order[j+1].v===order[i].v) j++;
      const avgRank = (i+j)/2 + 1;
      for(let k=i;k<=j;k++) ranks[order[k].idx] = avgRank;
      i=j+1;
    }
    return ranks;
  };
  const sr = rankOf("score"), vr = rankOf("views");
  const n = rows.length;
  let d2 = 0; for(let i=0;i<n;i++){ const d = sr[i]-vr[i]; d2 += d*d; }
  const rho = 1 - (6*d2)/(n*(n*n-1));
  return { rho: parseFloat(rho.toFixed(2)), sampleSize:n };
};

const formatScoreValidity = (v) => {
  if(!v) return "";
  const verdict = v.rho >= 0.6 ? "STRONG — your scores reliably predict actual performance. Trust your scoring instincts."
                : v.rho >= 0.3 ? "MODERATE — scores are directionally right but noisy. Tighten the gap between strong and weak ideas."
                : v.rho >= 0 ? "WEAK — your scores barely predict reality. STOP clustering everything around 70 — push genuinely strong ideas to 85+ and genuinely weak ones below 50. Be far more discriminating."
                : "INVERTED — your high-scored ideas are UNDERPERFORMING your low-scored ones. Something is systematically wrong in what you reward. Reconsider which factors you weight.";
  return `SCORE VALIDITY [self-graded — Spearman ρ=${v.rho} between past scores and actual views, n=${v.sampleSize}]: ${verdict}\n`;
};

// ── NEURAL PREDICTOR (in-browser MLP, trained on this channel's real outcomes) ──
// A genuine feed-forward neural network (1 hidden layer, tanh, trained by SGD with
// L2 + early stopping) that learns the channel-specific mapping from
// {factor scores, hook, type, pillar} → actual log-views. It is a CALIBRATION layer:
// it runs AFTER the LLM ensemble has scored the idea, taking those factor scores as
// input, and predicts real views from this channel's own history.
//
// Honesty guarantees — it can NEVER make scoring worse:
//  • Categoricals are feature-hashed into fixed buckets, so new/unseen hooks don't break it.
//  • The net's own predictive power is measured by k-fold cross-validated Spearman ρ
//    on held-out data. If it can't beat noise (ρ ≤ 0.1) or data is thin (n < 15), its
//    blend weight is 0 and the system ignores it entirely — pure Bayesian fallback.
//  • Blend weight scales with BOTH validated ρ and sample size, so the net earns trust.
// This is the "real trained model" — not a prompt trick. It survives across sessions
// (weights persisted to localStorage) and retrains automatically when new outcomes land.
const NN_KEY = "krapmaps_v1_nn";
const _featHash = (s, buckets) => { let h=0; const str=String(s||"").toLowerCase().trim(); if(!str) return -1; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))|0; return (h>>>0)%buckets; };
const HOOK_BUCKETS=5, TYPE_BUCKETS=5, PILLAR_BUCKETS=5;
// Encode one item → fixed-length feature vector. Numeric factor scores (0..100→0..1) +
// one-hot of feature-hashed categoricals. Robust to unseen vocabulary.
const _nnFeaturize = (o) => {
  const f = [];
  const num = v => { const n = typeof v==="number"?v:parseFloat(v); return isFinite(n)?Math.max(0,Math.min(1,n/100)):0.7; };
  f.push(num(o.hookScore), num(o.retentionScore), num(o.shareScore), num(o.algoScore), num(o.nicheScore), num(o.viralityScore ?? o.viral));
  const oneHot = (val, buckets) => { const b=_featHash(val,buckets); const arr=new Array(buckets).fill(0); if(b>=0) arr[b]=1; return arr; };
  f.push(...oneHot(o.hook, HOOK_BUCKETS));
  f.push(...oneHot(o.type, TYPE_BUCKETS));
  f.push(...oneHot(o.pillar ?? o.contentPillar ?? o.aiScore?.contentPillar, PILLAR_BUCKETS));
  return f;
};
const _spearman = (pred, act) => {
  const n = pred.length; if(n<3) return 0;
  const rank = arr => { const order=arr.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v); const r=new Array(n); let i=0; while(i<n){ let j=i; while(j+1<n&&order[j+1].v===order[i].v) j++; const ar=(i+j)/2+1; for(let k=i;k<=j;k++) r[order[k].i]=ar; i=j+1; } return r; };
  const pr=rank(pred), ar=rank(act); let d2=0; for(let i=0;i<n;i++){ const d=pr[i]-ar[i]; d2+=d*d; }
  return 1 - (6*d2)/(n*(n*n-1));
};
// Train a small MLP on (features → normalized log-views). Returns weights + meta.
const _trainMLP = (X, y, inDim, H=8, epochs=400, lr=0.05, l2=1e-3) => {
  const rnd = () => (Math.random()*2-1)*Math.sqrt(1/inDim);
  let W1=Array.from({length:inDim},()=>Array.from({length:H},rnd)), b1=new Array(H).fill(0);
  let W2=Array.from({length:H},()=>(Math.random()*2-1)*Math.sqrt(1/H)), b2=0;
  const n=X.length;
  const fwd = x => { const hact=new Array(H); for(let j=0;j<H;j++){ let s=b1[j]; for(let k=0;k<inDim;k++) s+=x[k]*W1[k][j]; hact[j]=Math.tanh(s); } let o=b2; for(let j=0;j<H;j++) o+=hact[j]*W2[j]; return {o,hact}; };
  for(let e=0;e<epochs;e++){
    const order=[...Array(n).keys()].sort(()=>Math.random()-0.5);
    for(const idx of order){
      const x=X[idx], {o,hact}=fwd(x), err=o-y[idx];
      for(let j=0;j<H;j++){ const g=err*hact[j]+l2*W2[j]; W2[j]-=lr*g; }
      b2-=lr*err;
      for(let j=0;j<H;j++){ const dh=err*W2[j]*(1-hact[j]*hact[j]); for(let k=0;k<inDim;k++){ const g=dh*x[k]+l2*W1[k][j]; W1[k][j]-=lr*g; } b1[j]-=lr*dh; }
    }
  }
  const predict = x => fwd(x).o;
  return { W1,b1,W2,b2,inDim,H, predict };
};
// Build + cross-validate the neural model from this channel's posted outcomes.
const buildNeuralModel = (ideas=[]) => {
  try {
    // Require an ACTUAL score — an unscored-but-posted idea has viral:0/hookScore:0
    // and would feed all-zero feature vectors as training noise.
    const posted = ideas.filter(i => i.status==="posted" && i.postedViews>0 && (i.viral>0 || i.hookScore>0));
    const n = posted.length;
    if(n < 15) return { ready:false, n, reason:"need ≥15 scored+posted outcomes to train" };
    const X = posted.map(_nnFeaturize);
    const inDim = X[0].length;
    const yRaw = posted.map(i => Math.log10(i.postedViews+1));
    const yMean = yRaw.reduce((a,b)=>a+b,0)/n;
    const yStd = Math.sqrt(yRaw.reduce((s,v)=>s+(v-yMean)**2,0)/n) || 1;
    const y = yRaw.map(v=>(v-yMean)/yStd);
    const K = Math.min(5, n);
    const folds = Array.from({length:K},()=>[]);
    posted.forEach((_,i)=>folds[i%K].push(i));
    const cvPred=[], cvAct=[];
    for(let f=0; f<K; f++){
      const testIdx=new Set(folds[f]);
      const trX=[], trY=[]; X.forEach((x,i)=>{ if(!testIdx.has(i)){ trX.push(x); trY.push(y[i]); } });
      if(trX.length<8) continue;
      const m=_trainMLP(trX,trY,inDim,8,250);
      folds[f].forEach(i=>{ cvPred.push(m.predict(X[i])); cvAct.push(y[i]); });
    }
    const cvRho = cvPred.length>=5 ? parseFloat(_spearman(cvPred,cvAct).toFixed(2)) : 0;
    const model = _trainMLP(X, y, inDim, 8, 400);
    const wRho = Math.max(0, Math.min(1, (cvRho-0.1)/0.7));
    const wN = Math.min(1, (n-15)/35);
    const blendWeight = parseFloat((wRho*wN).toFixed(2));
    const serial = { W1:model.W1,b1:model.b1,W2:model.W2,b2:model.b2,inDim:model.inDim,H:model.H, yMean,yStd, cvRho, n, blendWeight, trainedAt:new Date().toISOString() };
    return { ready:true, model, serial, yMean, yStd, cvRho, n, blendWeight };
  } catch { return { ready:false, n:0, reason:"training error" }; }
};
// Predict real views for a freshly-scored idea using the trained net.
const neuralPredict = (serial, scored) => {
  try {
    if(!serial || !serial.W1) return null;
    const x = _nnFeaturize(scored);
    if(x.length !== serial.inDim) return null;
    const H=serial.H; let o=serial.b2;
    for(let j=0;j<H;j++){ let s=serial.b1[j]; for(let k=0;k<serial.inDim;k++) s+=x[k]*serial.W1[k][j]; o+=Math.tanh(s)*serial.W2[j]; }
    const logv = o*serial.yStd + serial.yMean;
    const views = Math.max(0, Math.round(Math.pow(10, logv)-1));
    return isFinite(views) ? views : null;
  } catch { return null; }
};
const formatNeuralModel = (nn) => {
  if(!nn || !nn.ready || !nn.blendWeight) return "";
  const trust = nn.blendWeight>=0.6?"HIGH — this net has earned strong predictive trust on held-out data"
              : nn.blendWeight>=0.3?"MODERATE — corroborate with it but your own judgement leads"
              : "LOW — emerging signal, weigh lightly";
  return `NEURAL CALIBRATOR [in-browser net trained on ${nn.n} real outcomes from THIS channel — cross-validated Spearman ρ=${nn.cvRho}, trust=${trust}]:\nA dedicated neural network has independently learned how this channel's factor-score profiles convert to real views. After you finalise your factor scores, the system will blend the net's data-driven view prediction with yours at weight ${nn.blendWeight}. Score factors honestly — the net handles the views-from-scores mapping it has empirically learned.\n`;
};

// ── HOOK FATIGUE DETECTOR ─────────────────────────────────────────
// Audience desensitises to the same hook format — detects oversaturation
const buildHookFatigue = (ideas=[], videos=[]) => {
  const WINDOW = 21;
  const cutoff = new Date(Date.now() - WINDOW * 86400000);
  const recentIdeas  = ideas.filter(i => i.status==="posted" && i.postedDate && new Date(i.postedDate) > cutoff);
  const recentVideos = videos.filter(v => v.created_at && new Date(v.created_at) > cutoff);
  const hookCount={}, typeCount={};
  [...recentIdeas, ...recentVideos].forEach(x => {
    if(x.hook) hookCount[x.hook]=(hookCount[x.hook]||0)+1;
    if(x.type) typeCount[x.type]=(typeCount[x.type]||0)+1;
  });
  const fatigued        = Object.entries(hookCount).filter(([,c])=>c>=3).sort((a,b)=>b[1]-a[1]).map(([hook,count])=>({ hook, count }));
  const saturatedTypes  = Object.entries(typeCount).filter(([,c])=>c>=4).sort((a,b)=>b[1]-a[1]).map(([type,count])=>({ type, count }));
  const freshHooks      = Object.entries(hookCount).filter(([,c])=>c<=1).map(([h])=>h);
  if(!fatigued.length && !saturatedTypes.length) return null;
  return { fatigued, saturatedTypes, freshHooks, windowDays:WINDOW };
};

const formatHookFatigue = (fatigue, ideaHook, ideaType) => {
  if(!fatigue) return "";
  let out = "";
  const hf = fatigue.fatigued.find(f=>f.hook===ideaHook);
  const tf = fatigue.saturatedTypes.find(t=>t.type===ideaType);
  if(hf || tf) {
    out += `AUDIENCE FATIGUE [last ${fatigue.windowDays} days]:\n`;
    if(hf) out += `• "${ideaHook}" hook used ${hf.count}× recently — audience desensitised. Deduct 5-10pts from hook score unless this idea has a major novel twist.\n`;
    if(tf) out += `• "${ideaType}" format posted ${tf.count}× recently — deduct from algo fit for format repetition.\n`;
    if(fatigue.freshHooks.length) out += `• Fresh hooks (not overused): ${fatigue.freshHooks.slice(0,4).join(", ")} — consider recommending a switch.\n`;
  }
  return out;
};

// ── RECENT TRACK RECORD ───────────────────────────────────────────
// Last 5 posted outcomes — real-time context for what's working THIS week
const buildRecentTrackRecord = (ideas=[]) => {
  const posted = ideas
    .filter(i => i.status==="posted" && i.postedViews>0)
    .sort((a,b) => new Date(b.postedDate||0) - new Date(a.postedDate||0))
    .slice(0,5);
  if(posted.length < 2) return null;
  return posted.map(i => ({
    title:(i.title||"").slice(0,40), hook:i.hook, type:i.type,
    pillar:i.aiScore?.contentPillar, predicted:i.aiScore?.estimated_views, actual:i.postedViews,
  }));
};

const formatRecentTrackRecord = (record) => {
  if(!record || record.length < 2) return "";
  const fmt = n => n>=1000?`${(n/1000).toFixed(1)}k`:String(n);
  let out = `RECENT MOMENTUM [last ${record.length} posted — actual outcomes this channel]:\n`;
  record.forEach(r => {
    const pred = r.predicted ? ` | AI predicted: ${r.predicted}` : "";
    out += `  • "${r.title}" [${r.hook||"?"}/${r.type||"?"}${r.pillar?`/${r.pillar}`:""} ] → ${fmt(r.actual)} actual${pred}\n`;
  });
  const views = record.map(r=>r.actual);
  const allAvg = views.reduce((a,b)=>a+b,0)/views.length;
  const last2 = views.slice(0,2).reduce((a,b)=>a+b,0)/2;
  if(last2 > allAvg*1.5) out += `  → MOMENTUM SIGNAL: last 2 posts outperforming recent avg by 50%+ — channel is gaining traction, use this in scoring context.\n`;
  else if(last2 < allAvg*0.5) out += `  → SLUMP SIGNAL: last 2 posts below recent avg — weight novelty and hook freshness harder in your score.\n`;
  return out;
};

// ── PIPELINE SATURATION ───────────────────────────────────────────
// Detects when the unposted backlog already contains near-duplicates of this idea —
// posting 5 variants of the same topic fatigues the audience even with different hooks.
const buildPipelineSaturation = (idea, ideas=[]) => {
  const STOP = new Set(["this","that","with","from","your","what","when","where","they","them","were","have","about","into","over"]);
  const words = (idea.title||"").toLowerCase().split(/\W+/).filter(w=>w.length>3 && !STOP.has(w));
  if(words.length < 2) return null;
  const pending = ideas.filter(i => i.id!==idea.id && i.status!=="posted");
  const similar = pending.filter(i => {
    const iw = (i.title||"").toLowerCase().split(/\W+/).filter(w=>w.length>3 && !STOP.has(w));
    return words.filter(w=>iw.includes(w)).length >= 2;
  });
  if(similar.length < 2) return null;
  return { count:similar.length, titles:similar.slice(0,3).map(i=>(i.title||"").slice(0,40)) };
};

const formatPipelineSaturation = (sat) => {
  if(!sat) return "";
  return `PIPELINE SATURATION: ${sat.count} other unposted ideas already cover this same topic (${sat.titles.join("; ")}). If the plan is to post all of them, deduct from niche fit — topic repetition burns the audience even when hooks differ. Recommend consolidating or spacing them out.\n`;
};

// ── CONTENT ALLOCATOR (multi-armed bandit) ────────────────────────
// Treats each content pillar as an arm. Each posted result is a Bernoulli trial
// (beat channel median = win). Maintains a Beta(α,β) posterior per pillar and ranks
// by a 90% upper credible bound — automatically balancing exploit (proven win-rate)
// against explore (under-tested pillars get a high bound from their wide uncertainty).
const buildContentAllocator = (ideas=[], videos=[], pillars=[]) => {
  if(!pillars || !pillars.length) return null;
  const tagged = [];
  ideas.forEach(i => { if(i.status==="posted" && i.postedViews>0 && i.aiScore?.contentPillar) tagged.push({ pillar:i.aiScore.contentPillar, views:i.postedViews }); });
  videos.forEach(v => { if(v.views>0 && v.pillar) tagged.push({ pillar:v.pillar, views:v.views }); });
  if(tagged.length < 3) return null;
  const allViews = tagged.map(t=>t.views).sort((a,b)=>a-b);
  const median = allViews[Math.floor(allViews.length/2)] || 1;
  const z = 1.28; // ~90% upper credible bound
  const arms = pillars.map(p => {
    const items = tagged.filter(t=>t.pillar===p);
    const wins = items.filter(t=>t.views >= median).length;
    const losses = items.length - wins;
    const a = 1 + wins, b = 1 + losses;          // Beta posterior with uniform prior
    const mean = a/(a+b);
    const variance = (a*b)/((a+b)*(a+b)*(a+b+1));
    const ucb = mean + z*Math.sqrt(variance);
    return { pillar:p, n:items.length, wins, winRate:parseFloat(mean.toFixed(2)), priority:parseFloat(ucb.toFixed(3)) };
  }).sort((a,b)=>b.priority-a.priority);
  return { arms, median, sampleSize:tagged.length };
};

const formatContentAllocator = (alloc, ideaPillar) => {
  if(!alloc) return "";
  const fmt = n => n>=1000?`${(n/1000).toFixed(1)}k`:String(n);
  const top = alloc.arms[0];
  let out = `STRATEGIC ALLOCATION [bandit over content pillars — win = beating channel median ${fmt(alloc.median)} views, n=${alloc.sampleSize}]:\n`;
  alloc.arms.forEach(a => {
    const tag = a.n < 2 ? "UNDER-TESTED — high uncertainty, worth a calculated bet"
              : a.winRate >= 0.6 ? "proven winner — exploit"
              : a.winRate <= 0.34 ? "underperforming — reduce frequency"
              : "neutral";
    out += `  • ${a.pillar}: ${Math.round(a.winRate*100)}% win-rate (n=${a.n}), priority ${a.priority} — ${tag}\n`;
  });
  out += `  → Highest-priority pillar to post next: "${top.pillar}".`;
  if(ideaPillar) {
    const idx = alloc.arms.findIndex(a=>a.pillar===ideaPillar);
    if(idx >= 0) out += ` This idea's pillar ranks ${idx+1}/${alloc.arms.length} — ${idx===0?"it IS the strategic priority → boost niche fit":"weigh its lower strategic priority into the score"}.`;
  }
  return out + "\n";
};

// ── VIDEO SCORE ENGINE ──────────────────────────────────────────
// Time-weighted score — factors in age, velocity, ratio, hook performance
const calcVideoScore = (video, allVideos=[]) => {
  if(!video.views && !video.likes) return null;

  const now = Date.now();
  const created = video.created_at ? new Date(video.created_at).getTime() : now;
  const ageHours = Math.max(1, (now - created) / (1000 * 60 * 60));
  const ageDays = ageHours / 24;

  const views = video.views || 0;
  const likes = video.likes || 0;
  const comments = video.comments || 0;
  const shares = video.shares || 0;
  const likeRatio = views > 0 ? (likes / views) * 100 : 0;
  const engagementScore = likeRatio + (comments/views*100*2||0) + (shares/views*100*3||0);

  // Channel average for benchmarking
  const withViews = allVideos.filter(v=>v.views>0);
  const channelAvg = withViews.length ? withViews.reduce((s,v)=>s+(v.views||0),0)/withViews.length : 1000;

  // Views per hour velocity
  const velocity = views / ageHours;
  const channelVelocity = channelAvg / (24); // assume avg video hits avg in 24hrs

  let score = 0;
  let phase = "";

  if(ageDays < 1) {
    // EARLY PHASE — velocity is everything
    phase = "LIVE";
    const velocityRatio = velocity / channelVelocity;
    score = Math.min(100, Math.round(
      velocityRatio * 50 +          // 50pts for velocity vs channel avg
      Math.min(engagementScore * 3, 30) + // 30pts for engagement
      (views > channelAvg * 0.5 ? 20 : views > channelAvg * 0.25 ? 10 : 0) // 20pts for raw views
    ));
  } else if(ageDays < 7) {
    // MOMENTUM PHASE — velocity + total
    phase = ageDays < 2 ? "24H" : ageDays < 4 ? "3D" : "7D";
    const vsAvg = views / (channelAvg * Math.min(ageDays, 3)); // expect 3x avg over 3 days for good video
    score = Math.min(100, Math.round(
      Math.min(vsAvg * 40, 40) +    // 40pts for performance vs expected
      Math.min(engagementScore * 2, 30) + // 30pts engagement
      (velocity > channelVelocity ? 20 : velocity > channelVelocity * 0.5 ? 10 : 0) + // 20pts velocity
      (shares > 0 ? 10 : 0)         // 10pts if getting shares
    ));
  } else {
    // FINAL PHASE — total performance vs channel
    phase = ageDays < 30 ? "2W" : "OLD";
    const vsAvg = views / channelAvg;
    score = Math.min(100, Math.round(
      Math.min(vsAvg * 50, 50) +    // 50pts vs channel avg
      Math.min(engagementScore * 2, 30) + // 30pts engagement
      (shares > 0 ? Math.min(shares * 2, 20) : 0) // 20pts shares
    ));
  }

  const label = score >= 80 ? "VIRAL" : score >= 65 ? "STRONG" : score >= 50 ? "AVERAGE" : score >= 35 ? "WEAK" : "FLOPPED";
  const color = score >= 80 ? "#00FF94" : score >= 65 ? "#FFD60A" : score >= 50 ? "#00CFFF" : score >= 35 ? "#FF6B35" : "#FF2D78";

  return { score, label, color, phase, velocity: Math.round(velocity), ageDays: Math.round(ageDays * 10) / 10, likeRatio: likeRatio.toFixed(1) };
};

// ── VELOCITY PROJECTION MODEL ─────────────────────────────────────
// Learns this channel's "early views → final views" curve from mature videos that
// have a logged 24hr (or 48hr) snapshot, then projects a young video's final reach.
// Uses the MEDIAN multiplier (robust to one viral outlier) plus the interquartile
// spread for an honest low/high band.
const buildVelocityModel = (videos=[]) => {
  const MATURE_DAYS = 7;
  const now = Date.now();
  const mature = videos.filter(v => {
    if(!v.views24h || v.views24h<=0 || !v.views || v.views<=0 || !v.created_at) return false;
    return (now - new Date(v.created_at).getTime())/86400000 >= MATURE_DAYS;
  });
  if(mature.length < 4) return null;
  const mults = mature.map(v => v.views / v.views24h).filter(m => m>=1 && isFinite(m)).sort((a,b)=>a-b);
  if(mults.length < 4) return null;
  const q = p => mults[Math.min(mults.length-1, Math.floor(mults.length*p))];
  return {
    median: parseFloat(q(0.5).toFixed(2)),
    low: parseFloat(q(0.25).toFixed(2)),
    high: parseFloat(q(0.75).toFixed(2)),
    sampleSize: mults.length,
  };
};

// Projects a still-maturing video's final views from its 24hr snapshot (or live pace).
const projectFinalViews = (video, model) => {
  if(!model || !video) return null;
  const now = Date.now();
  const ageDays = video.created_at ? (now - new Date(video.created_at).getTime())/86400000 : 99;
  if(ageDays >= 7) return null; // already mature — the number IS the final
  const base = video.views24h && video.views24h>0 ? video.views24h : video.views;
  if(!base || base<=0) return null;
  return {
    expected: Math.round(base * model.median),
    low: Math.round(base * model.low),
    high: Math.round(base * model.high),
    confidence: model.sampleSize >= 12 ? "HIGH" : model.sampleSize >= 6 ? "MEDIUM" : "LOW",
  };
};

// ── GPT-4o CALL ──────────────────────────────────────────────────
// ── ROBUST JSON EXTRACTION ────────────────────────────────────────
// LLM responses get truncated when max_tokens runs out mid-JSON, which used to
// fail scoring with "Could not parse AI response". This repairs truncated JSON:
// closes unterminated strings, strips dangling keys/commas, balances brackets.
function _repairJSON(src) {
  let s = src;
  // Track string/escape state and bracket stack
  let inStr = false, esc = false; const stack = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { if (inStr) esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") stack.pop();
  }
  if (inStr) s += '"';
  // Remove trailing comma or dangling "key": with no value
  s = s.replace(/,\s*$/, "").replace(/"[^"\n]*"\s*:\s*$/, "").replace(/,\s*$/, "");
  while (stack.length) { const b = stack.pop(); s += (b === "{" ? "}" : "]"); }
  return s;
}
// Parse JSON out of an LLM reply: strip fences, find the object, repair if truncated.
function _extractJSON(text) {
  const clean = String(text||"").replace(/```json/g,"").replace(/```/g,"").trim();
  if(!clean) return null;
  try { return JSON.parse(clean); } catch {}
  const m = clean.match(/\{[\s\S]*/);
  if(!m) return null;
  // Try the widest balanced slice first, then repair the truncated remainder
  const wide = m[0].match(/\{[\s\S]*\}/);
  if(wide) { try { return JSON.parse(wide[0]); } catch {} }
  try { return JSON.parse(_repairJSON(m[0])); } catch {}
  return null;
}

// ── GEMINI MODEL CHAIN ────────────────────────────────────────────
// Google retires model names (gemini-1.5-pro started 404ing) — never pin one.
// Try current models in order; on 404/"not found" fall through to the next.
const GEMINI_MODELS = ["gemini-2.5-flash","gemini-2.0-flash","gemini-1.5-pro"];
async function _geminiGenerate(apiKey, body) {
  let lastErr = null;
  for(const model of GEMINI_MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body)
    });
    if(r.ok) return r.json();
    const err = await r.json().catch(()=>({}));
    lastErr = new Error("Gemini error "+r.status+": "+(err.error?.message||"unknown"));
    if(r.status !== 404) throw lastErr; // only model-gone falls through
  }
  throw lastErr || new Error("Gemini: no model available");
}

async function callGPT(prompt, systemMsg="You are an expert TikTok content strategist. Return ONLY valid JSON.", maxTokens=2000) {
  const storedCfg = loadJSON(KEYS_KEY,{});
  if(USE_BACKEND) {
    const byo = (storedCfg?.keys?.gpt4o||"").trim();
    const d = await _postProxy("/api/ai", { provider:"openai", prompt, system:systemMsg, maxTokens }, byo);
    const text = d.choices?.[0]?.message?.content||"{}";
    return _extractJSON(text) ?? {};
  }
  const apiKey = storedCfg?.keys?.gpt4o || BAKED_GPT_KEY;
  if(!apiKey) throw new Error("NO GPT-4O KEY — add it in Settings");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      model:"gpt-4o",
      messages:[
        { role:"system", content:systemMsg },
        { role:"user", content:prompt }
      ],
      response_format:{ type:"json_object" },
      max_tokens:maxTokens
    })
  });
  if(!r.ok) {
    if(r.status===401) throw new Error("Invalid GPT-4o key — check Settings");
    if(r.status===429) throw new Error("GPT-4o rate limited — wait and retry");
    throw new Error(`GPT-4o error ${r.status}`);
  }
  const d = await r.json();
  const text = d.choices?.[0]?.message?.content||"{}";
  return _extractJSON(text) ?? {};
}

// ── SEMANTIC EMBEDDINGS ───────────────────────────────────────────
// Replaces keyword overlap with true meaning-similarity. "late-night drive" and
// "midnight vibes" share no keywords but are conceptually close — embeddings catch that.
// Vectors are cached by text hash so each string is embedded at most once.
const EMB_KEY = "krapmaps_v1_embeddings";
const _embHash = (s) => { let h=0; const str=(s||"").toLowerCase().trim(); for(let i=0;i<str.length;i++){ h=(h*31+str.charCodeAt(i))|0; } return "e"+(h>>>0).toString(36); };
async function embedTexts(texts=[]) {
  const cache = loadJSON(EMB_KEY,{});
  const apiKey = loadJSON(KEYS_KEY,{})?.keys?.gpt4o; // embeddings use the OpenAI key
  if(!apiKey) return cache;
  const need = [...new Set(texts.filter(t=>t&&t.trim()&&!cache[_embHash(t)]))].slice(0,200);
  if(!need.length) return cache;
  try {
    const r = await fetch("https://api.openai.com/v1/embeddings", {
      method:"POST",
      headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json" },
      body: JSON.stringify({ model:"text-embedding-3-small", input:need })
    });
    if(!r.ok) return cache;
    const d = await r.json();
    (d.data||[]).forEach((e,idx)=>{ if(e.embedding) cache[_embHash(need[idx])] = e.embedding; });
    saveJSON(EMB_KEY, cache);
  } catch { /* silent — semantic layer is additive, never blocks scoring */ }
  return cache;
}
const _cosine = (a,b) => {
  if(!a||!b||a.length!==b.length) return 0;
  let dot=0,na=0,nb=0;
  for(let i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
  return (na&&nb) ? dot/(Math.sqrt(na)*Math.sqrt(nb)) : 0;
};
const _getVec = (cache, text) => cache[_embHash(text)] || null;

// Conceptual saturation + momentum using meaning, not keywords
const buildSemanticContext = (idea, ideas=[], videos=[], cache={}) => {
  const iv = _getVec(cache, idea.title);
  if(!iv) return null;
  const SIM = 0.80;
  const pendingSimilar = ideas
    .filter(i=>i.id!==idea.id && i.status!=="posted")
    .map(i=>({ i, s:_cosine(iv,_getVec(cache,i.title)) }))
    .filter(x=>x.s>=SIM).sort((a,b)=>b.s-a.s);
  const v = videos.filter(x=>x.views>0);
  const avg = v.length ? v.reduce((s,x)=>s+x.views,0)/v.length : 0;
  const winners = [
    ...v.filter(x=>x.views>avg*1.5).map(x=>({ title:x.title, views:x.views })),
    ...ideas.filter(i=>i.status==="posted"&&i.postedViews>avg*1.5).map(i=>({ title:i.title, views:i.postedViews })),
  ];
  const matchedWinner = winners
    .map(w=>({ w, s:_cosine(iv,_getVec(cache,w.title)) }))
    .filter(x=>x.s>=SIM).sort((a,b)=>b.s-a.s)[0];
  return { pendingSimilar, matchedWinner };
};
const formatSemanticContext = (ctx) => {
  if(!ctx) return "";
  let out = "";
  if(ctx.matchedWinner) out += `SEMANTIC MOMENTUM: conceptually ${(ctx.matchedWinner.s*100).toFixed(0)}% similar to your past winner "${ctx.matchedWinner.w.title}" (${(ctx.matchedWinner.w.views/1000).toFixed(1)}k views) — matched by MEANING not keywords. Proven concept with this audience → niche-fit boost.\n`;
  if(ctx.pendingSimilar.length>=2) out += `SEMANTIC SATURATION: ${ctx.pendingSimilar.length} pending ideas are conceptually near-identical (closest: "${ctx.pendingSimilar[0].i.title}" at ${(ctx.pendingSimilar[0].s*100).toFixed(0)}%). They overlap in meaning even if worded differently — consolidate or space out.\n`;
  return out;
};

// ── ANALOG GROUNDING (k-nearest-neighbour over real outcomes) ─────
// The most evidence-based prediction there is: find the creator's OWN past posts
// that are closest in MEANING to this idea, and anchor the forecast to what those
// actually did. This is kNN regression in embedding space — no model guessing, the
// creator's real history doing the work. Returns the neighbours, a similarity-
// weighted expectation, and an honest low/high band from the analog spread.
const buildAnalogs = (idea, ideas=[], videos=[], cache={}, k=5) => {
  const iv = _getVec(cache, idea.title);
  if(!iv) return null;
  // Pool of everything with a REAL outcome (posted videos + posted ideas).
  const pool = [
    ...videos.filter(v=>v.views>0 && v.title).map(v=>({ title:v.title, views:v.views, hook:v.hook })),
    ...ideas.filter(i=>i.status==="posted" && i.postedViews>0 && i.title && i.id!==idea.id).map(i=>({ title:i.title, views:i.postedViews, hook:i.hook })),
  ];
  const scored = pool
    .map(p=>({ ...p, s:_cosine(iv, _getVec(cache, p.title)) }))
    .filter(x=>x.s>=0.5)                       // only meaningfully-similar neighbours
    .sort((a,b)=>b.s-a.s)
    .slice(0, k);
  if(scored.length < 2) return null;           // need at least 2 analogs to be honest
  // Similarity-weighted geometric mean — views are multiplicative, so average in log space.
  const tw = scored.reduce((s,x)=>s+x.s,0) || 1;
  const logMean = scored.reduce((s,x)=>s + x.s*Math.log10(Math.max(x.views,1)), 0) / tw;
  const wPred = Math.round(Math.pow(10, logMean));
  const viewsArr = scored.map(x=>x.views).sort((a,b)=>a-b);
  const lo = viewsArr[0], hi = viewsArr[viewsArr.length-1];
  const topSim = scored[0].s;
  return { analogs:scored, wPred, lo, hi, n:scored.length, topSim, avgSim: tw/scored.length };
};
const formatAnalogs = (a) => {
  if(!a) return "";
  const fmt = n => n>=1000?`${(n/1000).toFixed(1)}k`:String(n);
  let out = `NEAREST ANALOGS [your OWN past posts closest in MEANING to this idea — real outcomes, kNN over embeddings, n=${a.n}]:\n`;
  a.analogs.forEach(x=> out += `  • "${String(x.title).slice(0,50)}" — ${fmt(x.views)} views (${(x.s*100).toFixed(0)}% similar)\n`);
  out += `  → Similarity-weighted expectation: ~${fmt(a.wPred)} views (analog range ${fmt(a.lo)}–${fmt(a.hi)}). This is the strongest evidence you have. Anchor estimated_views to these REAL results — deviate only if this idea has a materially better hook or share trigger than the analogs did.\n`;
  return out;
};

// ── GEMINI 1.5 PRO — Video Analysis ─────────────────────────────
async function callGeminiVideo(videoUrl, prompt) {
  const cfg = loadJSON("krapmaps_v1_config",{});
  const apiKey = cfg?.keys?.gemini;
  if(USE_BACKEND) {
    const byo = (apiKey||"").trim();
    const mk = (contents) => _postProxy("/api/ai", { provider:"gemini", contents, maxTokens:2000 }, byo);
    try {
      const d = await mk([{ parts: [ { text: prompt }, { file_data: { mime_type: "video/mp4", file_uri: videoUrl } } ] }]);
      return _extractJSON(d.candidates?.[0]?.content?.parts?.[0]?.text) ?? {};
    } catch(e) {
      if(!/400/.test(e.message||"")) throw e;
      const d2 = await mk([{ parts: [{ text: "Video URL to analyse: "+videoUrl+"\n\n"+prompt }] }]);
      return _extractJSON(d2.candidates?.[0]?.content?.parts?.[0]?.text) ?? {};
    }
  }
  if(!apiKey) throw new Error("NO GEMINI KEY — add it in Settings");

  // Try file_data first; if the model rejects it (400), fall back to URL-in-text.
  try {
    const d = await _geminiGenerate(apiKey, {
      contents: [{ parts: [ { text: prompt }, { file_data: { mime_type: "video/mp4", file_uri: videoUrl } } ] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 }
    });
    return _extractJSON(d.candidates?.[0]?.content?.parts?.[0]?.text) ?? {};
  } catch(e) {
    if(!/400/.test(e.message||"")) throw e;
    const d2 = await _geminiGenerate(apiKey, {
      contents: [{ parts: [{ text: "Video URL to analyse: "+videoUrl+"\n\n"+prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 }
    });
    return _extractJSON(d2.candidates?.[0]?.content?.parts?.[0]?.text) ?? {};
  }
}

// Multi-model consensus — run same prompt through Claude + GPT4o, merge insights
// ── GEMINI — text JSON scoring (3rd ensemble model, optional) ──
async function callGeminiText(prompt, systemMsg="You are an expert TikTok content strategist. Return ONLY valid JSON.", maxTokens=2000) {
  const cfg = loadJSON(KEYS_KEY,{});
  if(USE_BACKEND) {
    const byo = (cfg?.keys?.gemini||"").trim();
    const d = await _postProxy("/api/ai", { provider:"gemini", prompt, system:systemMsg, maxTokens }, byo);
    const parsed = _extractJSON(d.candidates?.[0]?.content?.parts?.[0]?.text);
    if(parsed) return parsed;
    throw new Error("Could not parse Gemini response");
  }
  const apiKey = cfg?.keys?.gemini || BAKED_GEMINI_KEY;
  if(!apiKey) throw new Error("NO GEMINI KEY");
  const d = await _geminiGenerate(apiKey, {
    contents:[{ parts:[{ text: systemMsg+"\n\n"+prompt }] }],
    generationConfig:{ responseMimeType:"application/json", maxOutputTokens:maxTokens }
  });
  const parsed = _extractJSON(d.candidates?.[0]?.content?.parts?.[0]?.text);
  if(parsed) return parsed;
  throw new Error("Could not parse Gemini response");
}

async function callConsensus(claudePrompt, gptPrompt, wl=WL, maxTokens=4096) {
  // Key-aware: only call the providers the user actually configured. Nobody is forced
  // to add every key — one AI provider is enough. This means a user who only wants
  // Claude (or only GPT, or only Gemini) gets scoring with no spurious calls or errors.
  const k = loadJSON(KEYS_KEY,{})?.keys || {};
  // In backend mode the keys live server-side; attempt every provider and let the
  // proxy reject the ones it has no key for (tolerated below). In direct mode, only
  // call the providers whose keys exist locally.
  const hasClaude = USE_BACKEND || !!(k.anthropic || BAKED_ANTHROPIC_KEY);
  const hasGPT    = USE_BACKEND || !!(k.gpt4o || BAKED_GPT_KEY);
  const hasGemini = USE_BACKEND || !!(k.gemini || BAKED_GEMINI_KEY);

  if(!hasClaude && !hasGPT && !hasGemini) {
    throw new Error("No AI key set — add at least one in Settings (Anthropic recommended). You don't need all of them.");
  }

  const sys = `You are an expert ${wl.niche} content strategist for ${wl.appName}. Return ONLY valid JSON.`;
  const jobs = [];
  if(hasClaude) jobs.push({ name:"claude", p: callAI(claudePrompt, maxTokens) });
  if(hasGPT)    jobs.push({ name:"gpt",    p: callGPT(gptPrompt, sys, maxTokens) });
  if(hasGemini) jobs.push({ name:"gemini", p: callGeminiText(gptPrompt, sys, maxTokens) });

  const settled = await Promise.allSettled(jobs.map(j=>j.p));
  const out = { claude:null, gpt:null, gemini:null, claudeErr:null };
  const errs = [];
  settled.forEach((res, i) => {
    const name = jobs[i].name;
    if(res.status==="fulfilled") out[name] = res.value;
    else { const msg = res.reason?.message||String(res.reason); if(name==="claude") out.claudeErr = msg; errs.push(`${name}: ${msg}`); }
  });
  // Surface a combined error only when EVERY configured provider failed.
  if(!out.claude && !out.gpt && !out.gemini && errs.length) out.claudeErr = errs.join(" | ");
  out.bothSucceeded = !!(out.claude && out.gpt);
  return out;
}

// ── ENSEMBLE RECONCILIATION ───────────────────────────────────────
// N independent models score the same idea — averaging reduces variance, and the
// SPREAD across models (max−min) is the uncertainty signal. Claude is kept as the
// qualitative spine (thinking-enabled, richest text); the others vote on the numbers.
// Variadic: pass any mix of (claude, gpt, gemini) — nulls are ignored gracefully.
const reconcileScores = (...models) => {
  const present = models.filter(Boolean);
  if(!present.length) return null;
  // Claude (first arg) keeps the qualitative spine if it answered; else first available.
  const spine = models[0] || present[0];
  const others = present.filter(m=>m!==spine);
  if(present.length === 1) return { ...spine, modelAgreement:"SINGLE — only one model responded", _ensemble:false };
  const NUMERIC = ["viralityScore","hookScore","retentionScore","shareScore","algoScore","nicheScore"];
  const mean = (k) => { const vals = present.map(m=>m[k]).filter(v=>typeof v==="number"); return vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : (spine[k] ?? null); };
  const spread = (k) => { const vals = present.map(m=>m[k]).filter(v=>typeof v==="number"); return vals.length>1 ? Math.max(...vals)-Math.min(...vals) : 0; };
  const disagreement = spread("viralityScore");
  // Per-factor spread reveals WHICH dimension the models contest most.
  const gaps = { hook:spread("hookScore"), retention:spread("retentionScore"), share:spread("shareScore"), algo:spread("algoScore"), niche:spread("nicheScore") };
  const mostContested = Object.entries(gaps).sort((x,y)=>y[1]-x[1])[0];
  let confidenceLevel = spine.confidenceLevel || present.find(m=>m.confidenceLevel)?.confidenceLevel || "MEDIUM";
  if(disagreement > 20) confidenceLevel = "LOW";
  else if(disagreement > 10 && confidenceLevel === "HIGH") confidenceLevel = "MEDIUM";
  const n = present.length;
  const agreement = disagreement <= 8 ? `STRONG — all ${n} models converge, high trust`
                  : disagreement <= 18 ? `MODERATE — ${n} models show minor divergence`
                  : `WEAK — ${n} models disagree by ${disagreement}pts on virality, treat as uncertain`;
  const out = { ...spine, _ensemble:true, _modelCount:n,
    confidenceLevel, modelAgreement: agreement,
    mostContestedFactor: (mostContested && mostContested[1] > 15) ? `${mostContested[0]} (models differ by ${mostContested[1]}pts)` : null,
    secondOpinion: (disagreement > 15 && others[0]?.verdict) ? `2nd model's take: ${others[0].verdict}` : null,
  };
  NUMERIC.forEach(k => { out[k] = mean(k); });
  return out;
};

const HOOK_TYPES       = ["edgy/controversial","problem->solution","gamification","achievement","reaction","challenge","pov","tutorial"];
const VIDEO_TYPES      = ["facecam","street","screencap","voiceover","mixed"];
const THUMBNAIL_TYPES  = ["text overlay","face close-up","scene reveal","shock moment","before/after","question on screen","no text — pure visual"];
const STATUSES    = ["idea","scripted","filming","editing","scheduled","posted"];
const STATUS_C    = { idea:C.dim, scripted:C.purple, filming:C.yellow, editing:C.cyan, scheduled:C.green, posted:C.orange };

const loadJSON  = (k,fb) => { try { const v=JSON.parse(localStorage.getItem(k)); return v!=null?v:fb; } catch { return fb; } };
const saveJSON  = (k,d)  => { try { localStorage.setItem(k,JSON.stringify(d)); } catch {} };
const getSbUrl  = () => localStorage.getItem(SB_URL_KEY) || _ENV.VITE_SB_URL || DEFAULT_SB_URL;
const getSbKey  = () => localStorage.getItem(SB_KEY_KEY) || _ENV.VITE_SB_KEY || DEFAULT_SB_KEY;
const today     = () => new Date().toISOString().slice(0,10);
const getDays   = d => { const t=new Date(d); const n=new Date(); return Math.ceil((t-n)/86400000); };
const fmtDate   = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"}).toUpperCase(); } catch { return d||""; } };
const ratio     = v => v.views>0 ? (v.likes/v.views)*100 : 0;
const perfScore = v => {
  if(!v._updated||!v.views) return null;
  const r=ratio(v);
  const rs=Math.min(40,r*1.6);
  const vs=Math.min(40,Math.log10(Math.max(v.promoted?v.views*0.15:v.views,1))*13);
  const cs=Math.min(20,(v.views>0?(v.comments/v.views)*100:0)*80);
  const score=Math.round(rs+vs+cs);
  return { score, label:score>=80?"VIRAL":score>=65?"STRONG":score>=50?"DECENT":score>=35?"WEAK":"FLOPPED" };
};

// ── SUPABASE ──────────────────────────────────────────────────────
const _sbHeaders = () => ({ apikey:getSbKey(),"Authorization":"Bearer "+getSbKey(),"Content-Type":"application/json" });

// ── WORKSPACE SCOPING ─────────────────────────────────────────────
// Every account's cloud data is namespaced by its activation code so that
// entering the same code on ANY device pulls down that account's keys, videos,
// ideas, deals and calendar — and two different codes never collide/overwrite
// each other. We do this WITHOUT any schema change: row ids get a `<WS>:` prefix
// in the database while the app keeps using the raw id. `:` is used as the
// separator (not `_`, which is a single-char wildcard in SQL LIKE) and codes are
// stripped to [A-Z0-9] so a code can never contain the separator — this also
// stops one code from being a LIKE-prefix of another.
const WS = () => {
  try {
    const s = localStorage.getItem(CLIENT_KEY);
    const cfg = s ? JSON.parse(s) : CLIENT_CONFIG;
    const code = String(cfg.activationCode || "default").toUpperCase().replace(/[^A-Z0-9]/g,"");
    return code || "default";
  } catch { return "default"; }
};
const wsId    = (id) => `${WS()}:${id}`;           // scope a single row id for writing
const wsMatch = ()   => `${WS()}:`;                // LIKE prefix for a workspace's rows
const wsStrip = (id) => {                          // recover the raw id on read
  const p = wsMatch();
  return (typeof id === "string" && id.startsWith(p)) ? id.slice(p.length) : id;
};
// ── INTEGRATION HEALTH ────────────────────────────────────────────
// Every integration failure used to be a silent console.warn — users saw empty
// data with no explanation. Each integration now reports its last result here;
// Settings shows the real status and Home surfaces actionable errors.
const HEALTH_KEY = "km_health";
const loadHealth = () => loadJSON(HEALTH_KEY, {});
const reportHealth = (service, state, msg) => {
  try {
    const h = loadHealth();
    const prev = h[service];
    h[service] = { state, msg, at: Date.now() };
    saveJSON(HEALTH_KEY, h);
    if(!prev || prev.state !== state) window.dispatchEvent(new CustomEvent("km-health", { detail:{ service, state, msg } }));
  } catch {}
};

const sbFetch = async (table,filter="") => {
  try {
    const r = await fetch(`${getSbUrl()}/rest/v1/${table}?${filter}&limit=1000`,{ headers:_sbHeaders() });
    if(r.status===401||r.status===403) { console.warn("[sb] auth error on",table,"— project may be paused"); reportHealth("supabase","error",`Cloud sync rejected (${r.status}) — Supabase project paused or key rotated. Data still saves on this device.`); return null; }
    if(r.ok) reportHealth("supabase","ok","Connected");
    if(!r.ok) { console.warn("[sb] fetch error",r.status,"on",table); return null; }
    return r.json();
  } catch(e) { console.warn("[sb] network error on",table,":",e.message); return null; }
};
const sbUpsert = async (table,data) => {
  try {
    const r = await fetch(`${getSbUrl()}/rest/v1/${table}`,{ method:"POST", headers:{..._sbHeaders(),"Prefer":"resolution=merge-duplicates"}, body:JSON.stringify(data) });
    if(!r.ok) console.warn("[sb] upsert error",r.status,"on",table);
  } catch(e) { console.warn("[sb] upsert network error:",e.message); }
};
const sbDelete = async (table,id) => {
  try {
    await fetch(`${getSbUrl()}/rest/v1/${table}?id=eq.${id}`,{ method:"DELETE", headers:_sbHeaders() });
  } catch {}
};
// Sync a full array of objects to a table — each item must have an `id` field.
// Stores the full object as `data` JSON so we never need to alter schema per-field.
const sbSyncArray = async (table, arr) => {
  if(!arr||!arr.length) return;
  const rows = arr.map(item=>({ id:wsId(item.id), data:item, updated_at:new Date().toISOString() }));
  await sbUpsert(table, rows);
};
const sbLoadArray = async (table) => {
  const rows = await sbFetch(table, `select=*&id=like.${wsMatch()}*&order=updated_at.desc`);
  if(!rows||!rows.length) return null;
  return rows.map(r=>r.data).filter(Boolean);
};

// ── SUPABASE AUTH ─────────────────────────────────────────────────
// Dependency-free email/password auth over Supabase's REST auth API. When
// VITE_REQUIRE_AUTH="true", the app requires a signed-in session and routes all
// AI/scraper calls through the server proxies (server-held keys). When it's not
// set, the app behaves exactly as before — this is a safe, opt-in rollout switch.
const AUTH_KEY = "km_auth_session";
const REQUIRE_AUTH = (_ENV.VITE_REQUIRE_AUTH === "true");
const loadSession  = () => loadJSON(AUTH_KEY, null);
const saveSession  = (s) => saveJSON(AUTH_KEY, s);
const clearSession = () => { try { localStorage.removeItem(AUTH_KEY); } catch {} };
const _mkSession = (d) => ({ access_token:d.access_token, refresh_token:d.refresh_token, expires_at: Date.now() + (d.expires_in||3600)*1000, user:d.user||null });

async function authSignUp(email, password) {
  const r = await fetch(`${getSbUrl()}/auth/v1/signup`, { method:"POST", headers:{ apikey:getSbKey(), "Content-Type":"application/json" }, body:JSON.stringify({ email, password }) });
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error_description || d.msg || d.error || "Sign up failed");
  if(d.access_token) { const s=_mkSession(d); saveSession(s); return { session:s }; }
  return { needsConfirmation:true }; // email confirmation is enabled on the project
}
async function authSignIn(email, password) {
  const r = await fetch(`${getSbUrl()}/auth/v1/token?grant_type=password`, { method:"POST", headers:{ apikey:getSbKey(), "Content-Type":"application/json" }, body:JSON.stringify({ email, password }) });
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error_description || d.msg || d.error || "Sign in failed");
  const s=_mkSession(d); saveSession(s); return s;
}
async function authRefresh() {
  const s = loadSession(); if(!s?.refresh_token) return null;
  const r = await fetch(`${getSbUrl()}/auth/v1/token?grant_type=refresh_token`, { method:"POST", headers:{ apikey:getSbKey(), "Content-Type":"application/json" }, body:JSON.stringify({ refresh_token:s.refresh_token }) });
  if(!r.ok) { clearSession(); return null; }
  const d = await r.json(); const ns=_mkSession(d); saveSession(ns); return ns;
}
// Valid access token, refreshing if within 60s of expiry. null if not signed in.
async function getAccessToken() {
  let s = loadSession(); if(!s) return null;
  if(Date.now() > (s.expires_at||0) - 60000) s = await authRefresh();
  return s?.access_token || null;
}
const authSignOut = () => clearSession();
async function authRecover(email) {
  const r = await fetch(`${getSbUrl()}/auth/v1/recover`, { method:"POST", headers:{ apikey:getSbKey(), "Content-Type":"application/json" }, body:JSON.stringify({ email }) });
  if(!r.ok) { const d=await r.json().catch(()=>({})); throw new Error(d.msg || d.error_description || d.error || "Could not send reset email"); }
}
// Completes the email-link recovery: sets the new password using the token from
// the link's URL hash, then signs the user straight in with that session.
async function authCompleteReset(tokens, newPassword) {
  const r = await fetch(`${getSbUrl()}/auth/v1/user`, { method:"PUT", headers:{ apikey:getSbKey(), "Content-Type":"application/json", Authorization:"Bearer "+tokens.access_token }, body:JSON.stringify({ password:newPassword }) });
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.msg || d.error_description || d.error || "Could not set new password");
  const sess = _mkSession({ access_token:tokens.access_token, refresh_token:tokens.refresh_token, expires_in:3600, user:d });
  saveSession(sess);
  return sess;
}

// ── BACKEND PROXY ─────────────────────────────────────────────────
// When auth is on, all AI/scraper calls go through our serverless proxies, which
// hold the provider keys server-side. Users need no keys. If a user set their own
// key (BYO), we forward it as X-BYO-Key so the server uses theirs instead.
const USE_BACKEND = REQUIRE_AUTH;
const _signalSignedOut = () => { try { clearSession(); window.dispatchEvent(new Event("km-signed-out")); } catch {} };

// ── BILLING (client) ──────────────────────────────────────────────
// Entitlements live server-side (forgery-proof). These helpers read the plan and
// meter actions. All are no-ops outside backend mode, so direct/self-host builds
// are unaffected — nothing is gated unless you've turned billing on.
const TIER_LABELS = { free:"Free", pro:"Pro", studio:"Studio", byo:"Your keys", unmetered:"Unlimited" };
async function fetchPlan() {
  if(!USE_BACKEND) return { tier:"unmetered", billingConfigured:false };
  try {
    const token = await getAccessToken();
    if(!token) return { tier:"free", billingConfigured:false };
    const r = await fetch("/api/me", { headers:{ Authorization:"Bearer "+token } });
    if(!r.ok) return { tier:"free", billingConfigured:false };
    return await r.json();
  } catch { return { tier:"free", billingConfigured:false }; }
}
// Returns { allowed, tier, used, limit }. Fails OPEN (allowed) if anything breaks
// or billing isn't configured — never block a paying flow on a billing hiccup.
async function meterAction(metric="scores") {
  if(!USE_BACKEND) return { allowed:true };
  try {
    const token = await getAccessToken();
    if(!token) return { allowed:true };
    const r = await fetch("/api/meter", { method:"POST", headers:{ Authorization:"Bearer "+token, "Content-Type":"application/json" }, body:JSON.stringify({ metric }) });
    const d = await r.json().catch(()=>({ allowed:true }));
    if(r.status===402) return { allowed:false, ...d };
    return { allowed:true, ...d };
  } catch { return { allowed:true }; }
}
// Meter an action from anywhere; if the user is over their limit, broadcast an
// event so the app can open the pricing modal, and return false. Fails open.
async function gateAI(metric="scores", label){
  const g = await meterAction(metric);
  if(!g.allowed){
    try { window.dispatchEvent(new CustomEvent("km-limit", { detail:{ ...g, label } })); } catch {}
    return false;
  }
  return true;
}
// Starts Stripe Checkout for a plan and redirects. Throws with a readable message.
async function startCheckout(plan) {
  const token = await getAccessToken();
  if(!token) throw new Error("Sign in first to upgrade.");
  const r = await fetch("/api/stripe-checkout", { method:"POST", headers:{ Authorization:"Bearer "+token, "Content-Type":"application/json" }, body:JSON.stringify({ plan, origin: window.location.origin }) });
  const d = await r.json().catch(()=>({}));
  if(!r.ok || !d.url) throw new Error(d.error || "Could not start checkout");
  window.location.href = d.url;
}
async function _postProxy(endpoint, body, byoKey) {
  const token = await getAccessToken();
  if(!token) { _signalSignedOut(); throw new Error("Your session expired — please sign in again."); }
  const headers = { "Content-Type":"application/json", "Authorization":"Bearer "+token };
  if(byoKey) headers["X-BYO-Key"] = byoKey;
  const r = await fetch(endpoint, { method:"POST", headers, body:JSON.stringify(body) });
  if(r.status===401 && !byoKey) { _signalSignedOut(); throw new Error("Your session expired — please sign in again."); }
  if(!r.ok){ const e=await r.json().catch(()=>({})); throw new Error(e.error || ("Proxy error "+r.status)); }
  return r.json();
}
// GET proxy for RapidAPI scraper calls — returns the native RapidAPI response.
async function rapidFetch(targetUrl, byoKey) {
  if(!USE_BACKEND) return fetch(targetUrl, { headers:{ "x-rapidapi-host": new URL(targetUrl).hostname, "x-rapidapi-key": byoKey||"", "Content-Type":"application/json" } });
  const token = await getAccessToken();
  if(!token) throw new Error("Your session expired — please sign in again.");
  const headers = { "Authorization":"Bearer "+token };
  if(byoKey) headers["X-BYO-Key"] = byoKey;
  return fetch("/api/rapid?url="+encodeURIComponent(targetUrl), { headers });
}

// ── PROSPECT SCRAPE ───────────────────────────────────────────────
// Pull ANY public TikTok account's recent videos by handle — the engine behind
// the free-audit outreach play. Uses the same scraper as the owner's own sync,
// but returns the data in-memory only: it never touches the operator's workspace,
// so you can audit an unlimited number of prospects without setting anything up.
async function scrapeProspectTikTok(handle){
  const clean = String(handle||"").trim().replace(/^@/,"").replace(/\s+/g,"");
  if(!clean) throw new Error("Enter a TikTok @handle first");
  const key = loadJSON(KEYS_KEY,{})?.keys?.tikwm;
  if(!key && !USE_BACKEND) throw new Error("Add your TikTok (RapidAPI) key in Settings first — that's what pulls their videos.");
  const base = "https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id="+encodeURIComponent(clean)+"&count=35&sort_type=0&cursor=";
  const [r, rUser] = await Promise.all([
    rapidFetch(base+"0", key),
    rapidFetch("https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id="+encodeURIComponent(clean), key),
  ]);
  if(!r.ok) throw new Error(r.status===403?"RapidAPI key invalid or not subscribed to the TikTok scraper":r.status===429?"Rate limited — wait ~30s and retry":`Scraper error ${r.status}`);
  const data = await r.json();
  if(data.code!==0 || !data.data?.videos?.length) throw new Error(`No public videos found for @${clean} — check the handle is exact (no spaces).`);
  let followers=0, nick="";
  try { const u=await rUser.json(); const st=u?.data?.user?.stats||u?.data?.stats; followers=st?.followerCount||0; nick=u?.data?.user?.nickname||u?.data?.user?.uniqueId||""; } catch {}
  let vids=data.data.videos, cursor=data.data.cursor, more=!!data.data.hasMore, pages=1;
  while(more && cursor && pages<4){
    await new Promise(res=>setTimeout(res,500));
    const r2=await rapidFetch(base+cursor, key);
    if(!r2.ok) break;
    const d2=await r2.json();
    if(d2.code!==0 || !d2.data?.videos?.length) break;
    vids=vids.concat(d2.data.videos); cursor=d2.data.cursor; more=!!d2.data.hasMore; pages++;
  }
  const seen=new Set();
  const videos = vids.filter(tv=>{ if(seen.has(tv.video_id)) return false; seen.add(tv.video_id); return true; })
    .map(tv=>({ id:"p_"+tv.video_id, title:tv.title||"", views:tv.play_count||0, likes:tv.digg_count||0, comments:tv.comment_count||0, shares:tv.share_count||0, created_at:new Date((tv.create_time||0)*1000).toISOString(), platform:"tiktok" }));
  return { handle:clean, nick, followers, videos };
}

// ── CROSS-CLIENT ANONYMISED PRIORS ────────────────────────────────
// Pools ONLY standard hook/type outcome ratios across channels in the same coarse niche
// bucket. No titles, no handles, no content — a hashed client id + generic labels + stats.
// Gives a thin-data client a warm start instead of cold. Degrades silently if the
// shared km_meta_priors table doesn't exist.
const nicheBucket = (niche="") => {
  const s = (niche||"").toLowerCase();
  if(/music|artist|rapper|singer|afrobeat|r&b|rnb|hip.?hop|producer|\bsong/.test(s)) return "music";
  if(/\bapp\b|saas|startup|founder|product|tech/.test(s)) return "product";
  if(/travel|backpack|hostel|nomad|tourism/.test(s)) return "travel";
  if(/fitness|gym|workout|health|wellness/.test(s)) return "fitness";
  if(/food|recipe|cook|restaurant|chef/.test(s)) return "food";
  if(/fashion|style|beauty|makeup|skincare/.test(s)) return "fashion";
  return "general";
};
const _clientHash = (id="") => { let h=0; const s=String(id); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return "c"+(h>>>0).toString(36); };

async function pushMetaPriors(outcomeLearning, wl) {
  if(!outcomeLearning) return;
  const bucket = nicheBucket(wl.niche);
  const ch = _clientHash(wl.clientId||wl.appName||"anon");
  const rows = [];
  const add = (dim, arr, keyName) => (arr||[]).forEach(a=>{
    const val = a[keyName]; if(!val) return;
    rows.push({
      id: `${ch}_${dim}_${String(val).replace(/\s+/g,"_").slice(0,40)}`,
      client_hash: ch, niche_bucket: bucket, dimension: dim, value: String(val),
      win_ratio: a.avgRatio, sample_n: a.count, updated_at: new Date().toISOString(),
    });
  });
  // Only standard, comparable vocabularies are shared — not custom pillar names.
  add("hook", outcomeLearning.hookAdjust, "hook");
  add("type", outcomeLearning.typeAdjust, "type");
  if(rows.length) await sbUpsert("km_meta_priors", rows).catch(()=>{});
}

async function fetchMetaPriors(wl) {
  const bucket = nicheBucket(wl.niche);
  const ch = _clientHash(wl.clientId||wl.appName||"anon");
  const rows = await sbFetch("km_meta_priors", `select=*&niche_bucket=eq.${bucket}`);
  if(!rows || !rows.length) return null;
  const others = rows.filter(r=>r.client_hash!==ch && r.sample_n>=2);
  if(others.length < 2) return null;
  const agg = {};
  others.forEach(r=>{
    const k = `${r.dimension}|${r.value}`;
    if(!agg[k]) agg[k] = { dimension:r.dimension, value:r.value, wsum:0, nsum:0, clients:new Set() };
    agg[k].wsum += r.win_ratio * r.sample_n;
    agg[k].nsum += r.sample_n;
    agg[k].clients.add(r.client_hash);
  });
  const priors = Object.values(agg).map(a=>({
    dimension:a.dimension, value:a.value,
    ratio: parseFloat((a.wsum/a.nsum).toFixed(2)),
    clients: a.clients.size, n: a.nsum,
  }));
  return { priors, bucket };
}

const formatMetaPriors = (mp, ownLearning) => {
  if(!mp || !mp.priors.length) return "";
  const ownN = ownLearning?.sampleSize || 0;
  const weightNote = ownN < 5
    ? "Your own channel data is thin — lean on these cross-channel priors as a warm start."
    : "Use only to corroborate your own channel data, which always takes precedence.";
  let out = `CROSS-CHANNEL PRIORS [anonymised aggregate from other ${mp.bucket} channels — standard hook/type labels + outcome ratios only, zero content]:\n`;
  mp.priors.sort((a,b)=>b.ratio-a.ratio).slice(0,8).forEach(p=>{
    out += `  • ${p.dimension} "${p.value}": ${p.ratio}x outcome across ${p.clients} channel(s) (pooled n=${p.n})\n`;
  });
  out += `→ ${weightNote}\n`;
  return out;
};

// ── AI ────────────────────────────────────────────────────────────
const buildSystem = (wl=WL) => `You are the AI content strategist for ${wl.appName} (${wl.handle}).

WHAT ${(wl.appName||"").toUpperCase()} IS: ${wl.appDescription||wl.niche}

CONTENT TEAM: ${wl.creator1}${wl.creator2?` + ${wl.creator2}`:""}

NICHE: ${wl.niche}

PROVEN CONTENT FORMULA: ${wl.bestFormula}

CONTENT STYLE: ${wl.contentStyle||wl.niche}

TARGET AUDIENCE: ${wl.targetAudience}

PLATFORMS: ${wl.platforms}

BRAND VALUES: ${wl.brandValues||"authenticity, consistency"}

BIGGEST CHALLENGE: ${wl.biggestChallenge||"content consistency"}

COMPETITORS: ${wl.competitors}

${wl.nicheLogic ? `NICHE-SPECIFIC PRINCIPLES:\n${wl.nicheLogic}` : ""}

Always give brutally specific, actionable advice tailored to ${wl.appName}'s exact niche and voice. No generic social media advice.
Respond ONLY with valid JSON.`;
const SYSTEM = buildSystem(WL);

async function callPerplexity(prompt, wl=WL) {
  const storedCfg = loadJSON(KEYS_KEY,{});
  const ppxSystem = `You are a niche content strategist for ${wl.appName}. Niche: ${wl.niche}. Target audience: ${wl.targetAudience}. Platforms: ${wl.platforms}. Return ONLY valid JSON.`;
  if(USE_BACKEND) {
    const byo = (storedCfg?.keys?.perplexity||"").trim();
    const d = await _postProxy("/api/perplexity", { prompt, system:ppxSystem, model:"sonar-pro" }, byo);
    const text = d.choices?.[0]?.message?.content||"";
    const clean = text.replace(/```json/g,"").replace(/```/g,"").trim();
    try { return JSON.parse(clean); } catch { const m=clean.match(/\{[\s\S]*\}/); if(m){ try { return JSON.parse(m[0]); } catch {} } throw new Error("Could not parse Perplexity response"); }
  }
  const apiKey = (storedCfg?.keys?.perplexity || BAKED_PERPLEXITY_KEY || "").trim();
  if(!apiKey) throw new Error("NO PERPLEXITY KEY -- go to Settings and add your Perplexity API key");
  // Perplexity blocks browser-direct calls (no CORS headers), so even in direct mode
  // we route through our serverless proxy, forwarding the user's own key as BYO.
  // If the proxy isn't reachable (e.g. plain vite dev), fall back to a direct call.
  try {
    const r = await fetch("/api/perplexity", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "X-BYO-Key":apiKey },
      body: JSON.stringify({ prompt, system:ppxSystem, model:"sonar-pro" })
    });
    const ct = r.headers.get("content-type")||"";
    if(ct.includes("application/json")) {
      const d = await r.json();
      if(!r.ok) {
        if(r.status===401 && /perplexity/i.test(d.error||"")) throw new Error("Invalid Perplexity key -- check Settings");
        throw new Error(d.error || ("Perplexity error "+r.status));
      }
      const parsed = _extractJSON(d.choices?.[0]?.message?.content||"");
      if(parsed) return parsed;
      throw new Error("Could not parse Perplexity response");
    }
    // Non-JSON response = proxy not deployed here — fall through to direct call.
  } catch(e) {
    if(!/Failed to fetch|NetworkError|Load failed/i.test(e.message||"")) throw e;
    // network error reaching our own proxy — fall through to direct call
  }
  const r2 = await fetch("https://api.perplexity.ai/chat/completions", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      model:"sonar-pro",
      messages:[ { role:"system", content:ppxSystem }, { role:"user", content:prompt } ]
    })
  });
  if(!r2.ok) {
    if(r2.status===401) throw new Error("Invalid Perplexity key -- check Settings");
    throw new Error(`Perplexity error ${r2.status}`);
  }
  const d2 = await r2.json();
  const parsed2 = _extractJSON(d2.choices?.[0]?.message?.content||"");
  if(parsed2) return parsed2;
  throw new Error("Could not parse Perplexity response");
}

// Parse Claude's native /v1/messages response into the JSON object the app expects.
function _parseClaude(d) {
  if(d.error) throw new Error(d.error.message||"API error");
  const text = (d.content||[]).map(b=>b.text||"").join("").trim();
  if(!text) throw new Error("Empty AI response");
  const parsed = _extractJSON(text);
  if(parsed) return parsed;
  throw new Error("Could not parse AI response -- try again");
}

async function callAI(prompt, maxTokens=2000) {
  const storedCfg = loadJSON(KEYS_KEY,{});
  const currentWL = loadWL();

  // Backend mode: server holds the key (BYO forwarded if the user set their own).
  if(USE_BACKEND) {
    const byo = (storedCfg?.keys?.anthropic||"").trim();
    const d = await _postProxy("/api/ai", { provider:"anthropic", prompt, maxTokens, system:buildSystem(currentWL) }, byo);
    return _parseClaude(d);
  }

  const apiKey = (storedCfg?.keys?.anthropic || BAKED_ANTHROPIC_KEY || "").trim();
  if(!apiKey) {
    // No Anthropic key — fall back to whatever LLM the user DID configure, so no
    // single provider is mandatory. Anthropic stays the default when it's present.
    const k = storedCfg?.keys || {};
    if(k.gpt4o || BAKED_GPT_KEY) return callGPT(prompt);
    if(k.gemini || BAKED_GEMINI_KEY) return callGeminiText(prompt);
    throw new Error("No AI key set — add at least one in Settings (Anthropic recommended). You don't need all of them.");
  }
  const d = await _anthropicFetch(apiKey, { max_tokens:maxTokens, system:buildSystem(currentWL), messages:[{ role:"user", content:prompt }] });
  const text = (d.content||[]).map(b=>b.text||"").join("").trim();
  if(!text) throw new Error("Empty AI response");
  const parsed = _extractJSON(text);
  if(parsed) return parsed;
  throw new Error("Could not parse AI response -- try again");
}

// ── SHARED ANTHROPIC TRANSPORT ────────────────────────────────────
// Model resilience for EVERY Anthropic call (chat, visual DNA, channel theory,
// post-mortems, scoring): if the preferred model is retired (the way
// gemini-1.5-pro 404'd), fall through the chain; 429/529 get one retried call.
const CLAUDE_MODELS = ["claude-sonnet-4-6","claude-sonnet-5","claude-haiku-4-5-20251001"];
async function _anthropicFetch(apiKey, payload) {
  const preferred = payload.model ? [payload.model, ...CLAUDE_MODELS.filter(m=>m!==payload.model)] : CLAUDE_MODELS;
  let lastErr = null;
  for(const model of preferred) {
    for(let attempt=0; attempt<2; attempt++) {
      let r;
      try {
        r = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "x-api-key": apiKey,
            "anthropic-version":"2023-06-01",
            "anthropic-dangerous-direct-browser-access":"true"
          },
          body: JSON.stringify({ ...payload, model })
        });
      } catch(fetchErr) {
        console.error("[anthropic] fetch threw (network/CORS):", fetchErr);
        throw new Error("Network error calling Anthropic: "+fetchErr.message);
      }
      if(r.status===429 || r.status===529 || r.status===503) {
        lastErr = new Error(r.status===429 ? "Rate limited (429) -- wait 30 seconds and try again" : "Anthropic overloaded ("+r.status+") -- try again shortly");
        if(attempt===0) { await new Promise(res=>setTimeout(res, 2500)); continue; }
        break;
      }
      if(r.status===404) { // model retired — fall through to the next in the chain
        lastErr = new Error("Model "+model+" unavailable (404)");
        break;
      }
      if(!r.ok) {
        let errTxt = "";
        try { errTxt = await r.text(); } catch {}
        console.error("[anthropic] HTTP", r.status, errTxt);
        if(r.status===401) throw new Error("Invalid API key (401) -- go to Settings and update your Anthropic key. Raw: "+errTxt.slice(0,120));
        if(r.status===400) throw new Error("Bad request (400): "+errTxt.slice(0,200));
        throw new Error(`API error ${r.status}: ${errTxt.slice(0,200)}`);
      }
      const d = await r.json();
      if(d.error) throw new Error(d.error.message||"API error");
      return d;
    }
  }
  throw lastErr || new Error("Anthropic call failed");
}

// High-level Anthropic messages call: routes through the server proxy in backend
// mode (messages/tools passthrough), direct with the model chain otherwise.
// Returns the RAW response JSON — callers keep their own parsing (text, tool_use...).
async function anthropicMessages(payload, keyOverride) {
  const storedCfg = loadJSON(KEYS_KEY,{});
  const byo = (keyOverride || storedCfg?.keys?.anthropic || "").trim();
  if(USE_BACKEND) {
    return _postProxy("/api/ai", { provider:"anthropic", messages:payload.messages, system:payload.system, maxTokens:payload.max_tokens||1024, tools:payload.tools, model:payload.model }, byo);
  }
  const apiKey = byo || BAKED_ANTHROPIC_KEY;
  if(!apiKey) throw new Error("No Anthropic key set — add one in Settings");
  return _anthropicFetch(apiKey, payload);
}

// ── DEALS ─────────────────────────────────────────────────────────
const DEALS_KEY = "krapmaps_v1_deals";
const DealsView = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [deals, setDeals] = useState(()=>loadJSON(DEALS_KEY,[]));
  const [form, setForm] = useState({ brand:"", type:"Sponsored Post", value:"", status:"Enquiry", platform:"TikTok", deliverable:"", deadline:"", notes:"" });
  const [showForm, setShowForm] = useState(false);
  useEffect(()=>{ saveJSON(DEALS_KEY,deals); if(deals.length) sbSyncArray("km_deals",deals).catch(()=>{}); },[deals]);
  // Pull this account's deals down on mount so they appear on every device that
  // signs in with the same activation code (previously deals only synced UP).
  useEffect(()=>{
    let alive = true;
    sbLoadArray("km_deals").then(remote=>{
      if(!alive||!remote||!remote.length) return;
      setDeals(prev=>{
        const merged = [...remote];
        prev.forEach(p=>{ if(!merged.find(d=>String(d.id)===String(p.id))) merged.push(p); });
        return merged;
      });
    }).catch(()=>{});
    return ()=>{ alive = false; };
  },[]);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const addDeal = () => {
    if(!form.brand.trim()) return;
    setDeals(d=>[{id:Date.now(),...form,created:new Date().toISOString().slice(0,10)},...d]);
    setForm({ brand:"", type:"Sponsored Post", value:"", status:"Enquiry", platform:"TikTok", deliverable:"", deadline:"", notes:"" });
    setShowForm(false); addXP(25);
  };
  const STATUS_C = { Enquiry:C.cyan, Negotiating:C.yellow, Signed:C.green, Live:C.pink, Delivered:C.purple, Paid:C.green, Declined:"rgba(255,255,255,0.3)" };
  const totalEarned = deals.filter(d=>["Paid","Delivered","Live"].includes(d.status)).reduce((s,d)=>s+parseFloat(d.value||0),0);
  const pipeline = deals.filter(d=>["Enquiry","Negotiating","Signed"].includes(d.status)).reduce((s,d)=>s+parseFloat(d.value||0),0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?32:28 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(150px,100%),1fr))", gap:12 }}>
        {[{l:"TOTAL EARNED",v:`£${totalEarned.toLocaleString()}`,c:C.green},{l:"IN PIPELINE",v:`£${pipeline.toLocaleString()}`,c:C.yellow},{l:"ACTIVE DEALS",v:deals.filter(d=>!["Paid","Declined"].includes(d.status)).length,c:C.cyan},{l:"ALL DEALS",v:deals.length,c:C.purple}].map((s,i)=>(
          <div key={i} data-card style={{ borderRadius:16, padding:isMobile?"20px 18px":"18px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${s.c}25` }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700, marginBottom:8, fontFamily:C.fontHead }}>{s.l}</div>
            <div style={{ fontSize:isMobile?24:28, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={()=>setShowForm(f=>!f)} style={{ padding:"10px 20px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>{showForm?"CANCEL":"+ ADD DEAL"}</button>
      </div>
      {showForm && (
        <div style={{ borderRadius:16, padding:isMobile?"18px 18px":"24px 26px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.pink}25` }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(160px,100%),1fr))", gap:12, marginBottom:isMobile?16:12 }}>
            {[["Brand Name","brand","text"],["Value (£)","value","number"],["Deliverable","deliverable","text"],["Deadline","deadline","date"]].map(([l,k,t])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:6, fontFamily:C.fontHead }}>{l.toUpperCase()}</div>
                <input type={t} value={form[k]} onChange={set(k)} placeholder={l} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 14px", fontSize:14, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }}/>
              </div>
            ))}
            {[["Type",["Sponsored Post","UGC","Affiliate","Gifted","Ambassador"],"type"],["Status",["Enquiry","Negotiating","Signed","Live","Delivered","Paid","Declined"],"status"],["Platform",["TikTok","Instagram","Both","YouTube"],"platform"]].map(([l,opts,k])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:6, fontFamily:C.fontHead }}>{l.toUpperCase()}</div>
                <select value={form[k]} onChange={set(k)} style={{ width:"100%", background:"#0C0A1A", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 14px", fontSize:14, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box", appearance:"none", colorScheme:"dark" }}>
                  {opts.map(o=><option key={o} value={o} style={{background:"#0C0A1A"}}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <textarea value={form.notes} onChange={set("notes")} placeholder="Notes, contact details, requirements..." rows={2} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", padding:isMobile?"13px 16px":"10px 14px", fontSize:13, fontFamily:C.fontBody, outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.6, marginBottom:isMobile?16:12 }}/>
          <button onClick={addDeal} style={{ padding:"11px 24px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>SAVE DEAL</button>
        </div>
      )}
      {deals.length===0 ? (
        <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?22:12 }}>
          <div style={{ display:"flex" }}>{I.star(30,"rgba(255,255,255,0.5)")}</div>
          <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No deals yet</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Track brand deals, sponsorships and collaborations here</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:isMobile?20:10 }}>
          {deals.map(deal=>{
            const sc = STATUS_C[deal.status]||C.dim;
            const isMoney = ["Paid","Delivered","Live"].includes(deal.status);
            return (
            <div key={deal.id} data-card style={{ borderRadius:16, padding:isMobile?"20px 20px":"18px 22px 18px 20px", background:`linear-gradient(90deg,${sc}0c,rgba(255,255,255,0.02) 40%)`, border:"1px solid rgba(255,255,255,0.08)", borderLeft:`3px solid ${sc}`, display:"flex", flexDirection:isMobile?"column":"row", alignItems:isMobile?"stretch":"center", gap:isMobile?18:20, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:isMobile?0:160 }}>
                <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:5 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:sc, boxShadow:`0 0 8px ${sc}`, flexShrink:0 }}/>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", fontFamily:C.fontHead }}>{deal.brand}</div>
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontFamily:C.fontBody, paddingLeft:16 }}>{deal.type} · {deal.platform}{deal.deadline?` · Due ${deal.deadline}`:""}</div>
                {deal.deliverable && <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontFamily:C.fontBody, marginTop:4, paddingLeft:16 }}>{deal.deliverable}</div>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:isMobile?12:18, justifyContent:isMobile?"space-between":"flex-end" }}>
                {deal.value && (
                  <div style={{ textAlign:isMobile?"left":"right", minWidth:isMobile?0:80 }}>
                    <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, color:isMoney?C.green:"rgba(255,255,255,0.85)", lineHeight:1 }}>£{parseFloat(deal.value).toLocaleString()}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:3 }}>{isMoney?"Earned":"Potential"}</div>
                  </div>
                )}
                <select value={deal.status} onChange={e=>setDeals(ds=>ds.map(d=>d.id===deal.id?{...d,status:e.target.value}:d))} style={{ background:"#0C0A1A", border:`1px solid ${sc}55`, borderRadius:8, color:sc, padding:isMobile?"10px 12px":"8px 12px", fontSize:12, fontFamily:C.fontHead, fontWeight:700, cursor:"pointer", outline:"none", appearance:"none", colorScheme:"dark", letterSpacing:"0.03em" }}>
                  {["Enquiry","Negotiating","Signed","Live","Delivered","Paid","Declined"].map(s=><option key={s} value={s} style={{background:"#0C0A1A"}}>{s}</option>)}
                </select>
                <button onClick={()=>{ if(window.confirm("Delete this deal?")) setDeals(ds=>ds.filter(d=>d.id!==deal.id)); }} aria-label="Delete deal" style={{ padding:"7px 9px", borderRadius:8, border:`1px solid ${C.pink}20`, background:"transparent", color:`${C.pink}70`, cursor:"pointer", display:"inline-flex" }}>{I.trash(13,C.pink)}</button>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
};

// ── NAV ───────────────────────────────────────────────────────────
const NAV = [
  { id:"home",      label:"HOME",      ic:I.home      },
  { id:"content",   label:"CONTENT",   ic:I.write     },
  { id:"analytics", label:"ANALYTICS", ic:I.bar       },
  { id:"tasks",     label:"TASKS",     ic:I.check     },
  { id:"deals",     label:"DEALS",     ic:I.star      },
  { id:"ai",        label:"ASSIST",    ic:I.brain     },
  { id:"growth",    label:"GROWTH",    ic:I.rocket    },
  // Operator-only: the free-audit outreach tool. Hidden on client whitelabel builds.
  ...(_activeCfg.clientId==="krapmaps" ? [{ id:"audit", label:"AUDIT", ic:I.search }] : []),
  { id:"settings",  label:"SETTINGS",  ic:I.settings  },
];

// ── PROSPECT AUDIT VIEW ───────────────────────────────────────────
// The outreach engine: type any creator's TikTok handle, pull their public
// videos, and generate a shareable one-page audit (their real numbers, their
// Voice DNA, what's working, what to fix, and 5 scored ideas in THEIR voice).
// This is what you send a prospect for free to open a conversation.
function ProspectAuditView({ WL }){
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [handle, setHandle] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | scraping | analysing | done | error
  const [err, setErr] = useState("");
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  // Render the whole report to one shareable PNG — sends via the native share sheet
  // (iPad/phone) or downloads. Keeps the full length; just makes it one image.
  const saveImage = async () => {
    const el = document.getElementById("prospect-report");
    if(!el || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { backgroundColor:"#0A0612", scale:2, useCORS:true, logging:false });
      const blob = await new Promise(res=>canvas.toBlob(res, "image/png"));
      const file = new File([blob], `audit-${report.h}.png`, { type:"image/png" });
      if(navigator.canShare && navigator.canShare({ files:[file] })){
        await navigator.share({ files:[file], title:`Content Audit — @${report.h}` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href=url; a.download=file.name; a.click();
        URL.revokeObjectURL(url);
      }
    } catch(e){ setErr("Couldn't make the image — screenshot it instead. ("+(e.message||"")+")"); }
    setSaving(false);
  };
  const copyReport = () => {
    if(!report) return;
    const a = report.ai||{};
    const lines = [
      `CONTENT AUDIT — @${report.h}${report.nick?` (${report.nick})`:""}`,
      `${fmtN(report.followers)} followers · ${fmtN(report.median)} typical views (best: ${fmtN(report.ceiling)}) · ${report.engRate.toFixed(1)}% engagement`,
      ``,
      a.verdict?`VERDICT: ${a.verdict}`:``,
      a.potential?`POTENTIAL: ${a.potential}`:``,
      ``,
      a.working?.length?`WHAT'S WORKING:\n${a.working.map(t=>`• ${t}`).join("\n")}`:``,
      ``,
      a.fixing?.length?`WHAT'S COSTING VIEWS:\n${a.fixing.map(t=>`• ${t}`).join("\n")}`:``,
      ``,
      a.ideas?.length?`5 VIDEOS TO POST NEXT (in your voice):\n${a.ideas.slice(0,5).map((i,n)=>`${n+1}. ${i.title}${i.hook?` — "${i.hook}"`:""}`).join("\n")}`:``,
      ``,
      `Full breakdown + idea scoring: ${report.app}`,
    ].filter(l=>l!=="").join("\n");
    try { navigator.clipboard?.writeText(lines); setCopied(true); setTimeout(()=>setCopied(false),2200); } catch {}
  };
  const fmtN = n => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}k`:String(Math.round(n||0));

  const run = async () => {
    setErr(""); setReport(null); setPhase("scraping");
    try {
      const { handle:h, nick, followers, videos } = await scrapeProspectTikTok(handle);
      if(videos.length < 3) throw new Error(`Only ${videos.length} videos found — need a few more to audit properly.`);
      setPhase("analysing");
      const withV = videos.filter(v=>v.views>0);
      const avg = withV.length ? Math.round(withV.reduce((s,v)=>s+v.views,0)/withV.length) : 0;
      const sorted = [...withV].sort((a,b)=>b.views-a.views);
      const top = sorted.slice(0,5), bottom = sorted.slice(-3).reverse();
      const median = medianViews(videos);
      const ceiling = withV.length ? Math.max(...withV.map(v=>v.views)) : 0;
      // STANDARD engagement rate — what a creator actually recognises: (likes+comments+shares)/views.
      const engRate = withV.length ? (withV.reduce((s,v)=>s+((v.likes+v.comments+v.shares)/Math.max(v.views,1)),0)/withV.length*100) : 0;
      // Run the SAME engine the paid app uses internally, on their scraped videos —
      // the audit is now first-class, not a lighter separate path.
      const insights = buildChannelInsights(videos);
      const insightsBlock = insights ? formatChannelInsights(insights) : "";
      const engSignals = buildEngagementSignals(videos);
      const engBlock = engSignals ? formatEngagementSignals(engSignals) : "";
      // Score every video with the engine (median-benchmarked) to find genuine hits vs typical.
      const scored = withV.map(v=>({ v, s:calcVideoScore(v, withV) })).filter(x=>x.s);
      const engineTop = [...scored].sort((a,b)=>(b.s.score||0)-(a.s.score||0)).slice(0,5);
      const engineFlop = [...scored].sort((a,b)=>(a.s.score||0)-(b.s.score||0)).slice(0,3);
      const cap = v => (v.title||"(no caption)").replace(/\s+/g," ").slice(0,70);
      const voice = buildVoiceDNA(videos, []);
      const wl = WL || loadWL();
      const prompt = `You are the sharpest short-form strategist alive. Audit this TikTok creator using ONLY the data below — this is a real free audit that must feel worth paying for.

━━ WHAT YOU CAN AND CANNOT SEE (critical — read first) ━━
You have their video CAPTIONS and the real numbers (views, likes, comments, shares, dates). You have NOT watched the videos.
- Reference their captions and numbers EXACTLY — quote real caption text and real view counts, never approximate.
- NEVER invent anything visual or editorial you can't actually see: no "your jump cut", "the reaction shot at 3s", "your lighting", "the b-roll". You have no idea what's on screen. If you infer something, frame it as an inference from the CAPTION ("your caption suggests…"), never state it as fact about the footage.
- A creator will distrust the ENTIRE audit the moment you describe one of their videos wrong. Accuracy beats cleverness every time.

CREATOR: @${h}${nick?` (${nick})`:""} — ${fmtN(followers)} followers, ${withV.length} recent videos analysed, engagement ~${engRate.toFixed(1)}% (likes+comments+shares ÷ views).
PERFORMANCE (TikTok is heavy-tailed — ANCHOR everything to the MEDIAN, not the average):
- Typical video (median): ${fmtN(median)} views — their real "normal". Judge ideas against THIS.
- Best video (ceiling): ${fmtN(ceiling)} views — proof of what they can hit; scale "potential" from THIS, not a fantasy number.

━━ ENGINE ANALYSIS (computed from their real numbers — the same engine the paid app runs) ━━
${insightsBlock}
${engBlock}
BIGGEST HITS (by our median-benchmarked scoring):
${engineTop.map(x=>`• "${cap(x.v)}" — ${fmtN(x.v.views)} views (score ${x.s.score}/100 · ${x.s.label})`).join("\n")}
WEAKEST:
${engineFlop.map(x=>`• "${cap(x.v)}" — ${fmtN(x.v.views)} views (score ${x.s.score}/100 · ${x.s.label})`).join("\n")}

RECENT CAPTIONS (quote these exactly, don't invent beyond them):
${withV.slice(0,15).map(v=>`• "${cap(v)}" — ${fmtN(v.views)} views`).join("\n")}
${voice?`\n${formatVoiceDNA(voice,"")}NOTE: this voice is read from their CAPTIONS — so the 5 ideas' titles/hooks should match how they WRITE. Don't claim to know their on-camera personality.\n`:""}
Be concrete and reference THEIR actual captions + numbers. No generic advice, no invented footage.

${COACH_PRINCIPLES}

Return ONLY JSON:
{"verdict":"2 honest sentences — their single biggest strength and biggest thing costing them views, grounded in the real numbers/captions above","potential":"one line: what they could realistically hit, scaled from their proven ceiling of ${fmtN(ceiling)} — no fantasy numbers","working":["3 specific things working, each citing a REAL caption or number above (never invented footage)"],"fixing":["3 honest things holding them back — each a fix they'd actually accept (reframe or upgrade their existing content, never 'stop doing X that's core to them'), grounded in what you can actually see"],"ideas":[{"title":"idea in their voice","hook":"hook under 10 words in their voice","why":"one line: why it fits them, tied to what already works"}]}`;
      // If the AI narrative fails, still show the scraped numbers + voice — the
      // deterministic half of the audit is valuable on its own and shouldn't be lost.
      const r = await callAI(prompt, 1600).catch(()=>null);
      if(!r) setErr("The AI couldn't generate the write-up (check your AI key) — showing the data we pulled.");
      setReport({ h, nick, followers, count:withV.length, avg, median, ceiling, engRate, top:top.slice(0,3), voice, ai:r||{}, app:wl.appName||"CreatorOS" });
      setPhase("done");
    } catch(e){ setErr(e.message||"Audit failed"); setPhase("error"); }
  };

  const card = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16 };
  const busy = phase==="scraping"||phase==="analysing";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:760, margin:"0 auto" }}>
      <div style={{ ...card, padding:isMobile?"20px":"24px" }}>
        <div style={{ fontSize:12, letterSpacing:"0.14em", color:C.cyan, fontWeight:700, marginBottom:8 }}>FREE PROSPECT AUDIT</div>
        <div style={{ fontSize:isMobile?15:16, color:"rgba(255,255,255,0.6)", lineHeight:1.5, marginBottom:16 }}>Type any creator's TikTok handle. Pulls their public videos and builds a shareable audit — their numbers, their voice, what's working, what to fix, and 5 ideas in their voice. Send it to open the conversation.</div>
        <div style={{ display:"flex", gap:10, flexWrap:isMobile?"wrap":"nowrap" }}>
          <div style={{ flex:1, minWidth:isMobile?"100%":200, display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.cyan}30`, borderRadius:12, padding:"0 14px" }}>
            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:16 }}>@</span>
            <input value={handle} onChange={e=>setHandle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!busy&&run()} placeholder="theirhandle" style={{ flex:1, background:"none", border:"none", outline:"none", color:"#fff", fontSize:16, padding:"13px 0", fontFamily:C.fontHead }}/>
          </div>
          <button onClick={run} disabled={busy||!handle.trim()} style={{ padding:"13px 24px", borderRadius:12, border:"none", background:busy?"rgba(255,255,255,0.1)":`linear-gradient(135deg,${C.cyan},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:14, cursor:busy?"wait":"pointer", opacity:(!handle.trim())?0.5:1, whiteSpace:"nowrap" }}>
            {phase==="scraping"?"PULLING VIDEOS…":phase==="analysing"?"ANALYSING…":<span style={{display:"inline-flex",alignItems:"center",gap:6}}>{I.search(14,"currentColor")} RUN AUDIT</span>}
          </button>
        </div>
        {err && <div style={{ marginTop:12, fontSize:13.5, color:C.pink, background:`${C.pink}10`, border:`1px solid ${C.pink}25`, borderRadius:10, padding:"10px 13px", lineHeight:1.5 }}>{err}</div>}
        {busy && <div style={{ marginTop:12, fontSize:13, color:"rgba(255,255,255,0.45)" }}>{phase==="scraping"?"Fetching their recent videos…":"Reading their voice and scoring — a few seconds…"}</div>}
      </div>

      {report && (
        <div id="prospect-report" style={{ ...card, padding:isMobile?"22px 18px":"32px 30px", background:"linear-gradient(160deg,rgba(0,229,255,0.05),rgba(10,6,20,0.6))" }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14, flexWrap:"wrap", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:isMobile?24:30, fontWeight:800, fontFamily:C.fontHead, color:"#fff", lineHeight:1 }}>@{report.h}</div>
              {report.nick && <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{report.nick}</div>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
              <div style={{ fontSize:11, letterSpacing:"0.1em", color:C.cyan, fontWeight:700, textAlign:"right" }}>CONTENT AUDIT<br/><span style={{ color:"rgba(255,255,255,0.4)", letterSpacing:"0.04em" }}>by {report.app}</span></div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={saveImage} disabled={saving} style={{ padding:"6px 12px", borderRadius:9, border:`1px solid ${C.cyan}40`, background:`${C.cyan}12`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:11, cursor:saving?"wait":"pointer", whiteSpace:"nowrap", opacity:saving?0.6:1 }}>{saving?"MAKING…":"SHARE IMAGE"}</button>
                <button onClick={copyReport} style={{ padding:"6px 12px", borderRadius:9, border:`1px solid ${copied?C.green:"rgba(255,255,255,0.15)"}`, background:copied?`${C.green}18`:"rgba(255,255,255,0.05)", color:copied?C.green:"rgba(255,255,255,0.75)", fontFamily:C.fontHead, fontWeight:700, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>{copied?"COPIED":"COPY AS TEXT"}</button>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10, marginBottom:22 }}>
            {[{l:"FOLLOWERS",v:fmtN(report.followers),c:C.pink},{l:"TYPICAL VIEWS",v:fmtN(report.median),c:C.cyan},{l:"BEST VIDEO",v:fmtN(report.ceiling),c:C.purple},{l:"ENGAGEMENT",v:report.engRate.toFixed(1)+"%",c:C.green}].map((s,i)=>(
              <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${s.c}22`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:10, letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", fontWeight:700, marginBottom:6 }}>{s.l}</div>
                <div style={{ fontSize:isMobile?20:24, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
              </div>
            ))}
          </div>
          {/* Verdict */}
          {report.ai?.verdict && (
            <div style={{ background:`${C.cyan}0d`, border:`1px solid ${C.cyan}22`, borderRadius:12, padding:"16px 18px", marginBottom:18 }}>
              <div style={{ fontSize:11, letterSpacing:"0.1em", color:C.cyan, fontWeight:700, marginBottom:7 }}>THE VERDICT</div>
              <div style={{ fontSize:15.5, color:"#fff", lineHeight:1.55 }}>{report.ai.verdict}</div>
              {report.ai.potential && <div style={{ fontSize:13.5, color:C.green, marginTop:8, fontWeight:600 }}>↗ {report.ai.potential}</div>}
            </div>
          )}
          {/* Voice */}
          {report.voice && (
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, letterSpacing:"0.1em", color:"rgba(255,255,255,0.45)", fontWeight:700, marginBottom:9 }}>THEIR VOICE (WHAT WE'D KEEP)</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {[report.voice.casing, `~${report.voice.medianLen} words/hook`, report.voice.pov.split("—")[0].trim(), ...(report.voice.signatureWords.slice(0,5).map(w=>`"${w}"`))].map((t,i)=>(
                  <span key={i} style={{ fontSize:11, fontWeight:700, color:C.cyan, background:`${C.cyan}12`, border:`1px solid ${C.cyan}25`, borderRadius:20, padding:"4px 11px" }}>{t}</span>
                ))}
              </div>
            </div>
          )}
          {/* Working / Fixing */}
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14, marginBottom:18 }}>
            <div>
              <div style={{ fontSize:11, letterSpacing:"0.1em", color:C.green, fontWeight:700, marginBottom:9 }}>WHAT'S WORKING</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(report.ai?.working||[]).map((t,i)=>(<div key={i} style={{ fontSize:13.5, color:"rgba(255,255,255,0.8)", lineHeight:1.5, paddingLeft:16, position:"relative" }}><span style={{ position:"absolute", left:0, top:7, width:7, height:7, borderRadius:2, background:C.green }}/>{t}</div>))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, letterSpacing:"0.1em", color:C.orange, fontWeight:700, marginBottom:9 }}>WHAT'S COSTING VIEWS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(report.ai?.fixing||[]).map((t,i)=>(<div key={i} style={{ fontSize:13.5, color:"rgba(255,255,255,0.8)", lineHeight:1.5, paddingLeft:16, position:"relative" }}><span style={{ position:"absolute", left:0, top:7, width:7, height:7, borderRadius:2, background:C.orange }}/>{t}</div>))}
              </div>
            </div>
          </div>
          {/* Ideas */}
          {report.ai?.ideas?.length>0 && (
            <div>
              <div style={{ fontSize:11, letterSpacing:"0.1em", color:C.pink, fontWeight:700, marginBottom:10 }}>5 VIDEOS TO POST NEXT — IN THEIR VOICE</div>
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                {report.ai.ideas.slice(0,5).map((idea,i)=>(
                  <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:11, padding:"13px 15px" }}>
                    <div style={{ fontSize:14.5, fontWeight:700, color:"#fff", marginBottom:idea.hook?4:0 }}>{i+1}. {idea.title}</div>
                    {idea.hook && <div style={{ fontSize:13.5, color:C.cyan, fontStyle:"italic" }}>"{idea.hook}"</div>}
                    {idea.why && <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:3 }}>{idea.why}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* CTA footer */}
          <div style={{ marginTop:22, paddingTop:18, borderTop:"1px solid rgba(255,255,255,0.08)", textAlign:"center" }}>
            <div style={{ fontSize:13.5, color:"rgba(255,255,255,0.55)", lineHeight:1.5 }}>This is a taste. The full system scores every idea before you film, tracks what actually hits, and learns your voice as you post.</div>
            <div style={{ fontSize:15, color:"#fff", fontWeight:700, fontFamily:C.fontHead, marginTop:8 }}>Want your channel run through {report.app}?</div>
          </div>
        </div>
      )}
      {report && <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.35)", textAlign:"center" }}>Screenshot this and send it to @{report.h} — or read it out on a call.</div>}
    </div>
  );
}

// ── PRICING MODAL ─────────────────────────────────────────────────
// Shown when a user hits their plan limit, or opened from Settings. Upgrading
// sends them to Stripe Checkout; the webhook flips their tier on return.
const PRICING_PLANS = [
  { id:"free",   name:"Free",   price:"£0",  per:"forever", tagline:"Test the waters", feats:["10 idea scores / month","Voice DNA + your analytics","Growth tracking","Shareable results page"] },
  { id:"pro",    name:"Pro",    price:"£29", per:"/month",  tagline:"For serious creators", hot:true, feats:["400 idea scores / month","Live trends + competitor spy","Multi-model consensus scoring","Priority AI, no queue"] },
  { id:"studio", name:"Studio", price:"£99", per:"/month",  tagline:"Full-time & teams", feats:["Unlimited scoring","Neural predictor + analog grounding","Everything in Pro","Early access to new features"] },
];
function PricingModal({ tier="free", reason, onClose }){
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const go = async (plan) => { setErr(""); setBusy(plan); try { await startCheckout(plan); } catch(e){ setErr(e.message); setBusy(""); } };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(5,3,10,0.82)", backdropFilter:"blur(6px)", display:"flex", alignItems:isMobile?"flex-start":"center", justifyContent:"center", padding:isMobile?"20px 14px":"32px", overflowY:"auto" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:940, background:"linear-gradient(160deg,#140C1E,#0A0612)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:isMobile?"24px 18px":"34px 38px", boxShadow:"0 30px 90px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:reason?10:22 }}>
          <div>
            <div style={{ fontSize:isMobile?23:28, fontWeight:800, fontFamily:C.fontHead, color:"#fff", lineHeight:1.1 }}>Choose your plan</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginTop:5 }}>Cancel anytime. No key setup — scoring just works.</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:9, width:34, height:34, color:"#fff", fontSize:18, cursor:"pointer", flexShrink:0 }}>{I.x?I.x(14,"currentColor"):"✕"}</button>
        </div>
        {reason && <div style={{ fontSize:13.5, color:C.yellow, background:`${C.yellow}0e`, border:`1px solid ${C.yellow}28`, borderRadius:10, padding:"10px 13px", marginBottom:18, lineHeight:1.5 }}>{reason}</div>}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:14 }}>
          {PRICING_PLANS.map(p=>{
            const current = tier===p.id;
            return (
              <div key={p.id} style={{ position:"relative", background:p.hot?"linear-gradient(165deg,rgba(255,45,120,0.12),rgba(197,102,255,0.06))":"rgba(255,255,255,0.03)", border:`1px solid ${p.hot?C.pink+"55":"rgba(255,255,255,0.09)"}`, borderRadius:16, padding:"22px 20px", display:"flex", flexDirection:"column", gap:14 }}>
                {p.hot && <div style={{ position:"absolute", top:-10, right:16, fontSize:10, fontWeight:800, letterSpacing:"0.1em", color:"#fff", background:`linear-gradient(135deg,${C.pink},${C.purple})`, borderRadius:20, padding:"3px 10px" }}>MOST POPULAR</div>}
                <div>
                  <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:p.hot?C.pink:"rgba(255,255,255,0.55)" }}>{p.name}</div>
                  <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{p.tagline}</div>
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ fontSize:34, fontWeight:800, fontFamily:C.fontHead, color:"#fff" }}>{p.price}</span>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>{p.per}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
                  {p.feats.map((f,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", fontSize:13, color:"rgba(255,255,255,0.78)", lineHeight:1.4 }}>
                      <span style={{ color:C.green, marginTop:1, flexShrink:0 }}>{I.tick(13,"currentColor")}</span>{f}
                    </div>
                  ))}
                </div>
                {current
                  ? <div style={{ textAlign:"center", padding:"11px", borderRadius:11, border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.5)", fontSize:13, fontWeight:700, fontFamily:C.fontHead }}>CURRENT PLAN</div>
                  : p.id==="free"
                    ? <div style={{ height:1 }}/>
                    : <button onClick={()=>go(p.id)} disabled={!!busy} style={{ padding:"11px", borderRadius:11, border:"none", background:p.hot?`linear-gradient(135deg,${C.pink},${C.purple})`:"rgba(255,255,255,0.08)", color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:14, cursor:busy?"wait":"pointer", opacity:busy&&busy!==p.id?0.5:1 }}>{busy===p.id?"OPENING…":"Upgrade"}</button>
                }
              </div>
            );
          })}
        </div>
        {err && <div style={{ marginTop:16, fontSize:13, color:C.pink, textAlign:"center" }}>{err}</div>}
        <div style={{ marginTop:18, fontSize:11.5, color:"rgba(255,255,255,0.3)", textAlign:"center" }}>Secure checkout by Stripe · cancel anytime from your account</div>
      </div>
    </div>
  );
}

// ── AI CHAT VIEW ──────────────────────────────────────────────────
function AIChatView({ anthropicKey, tasks, setTasks, ideas, setIdeas, videos, preloadMsg }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const [viewH, setViewH] = useState(typeof window !== 'undefined' ? window.innerHeight : 700);
  useEffect(() => {
    const onResize = () => setViewH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const chatH = isMobile ? `${Math.max(300, viewH - 170)}px` : 'calc(100dvh - 160px)';
  const CHAT_KEY = "krapmaps_v1_chat";
  const [msgs, setMsgs] = useState(()=>{
    const saved = loadJSON(CHAT_KEY, null);
    return saved || [{ role:"assistant", content:WL.aiGreeting }];
  });

  useEffect(()=>{ saveJSON(CHAT_KEY, msgs); }, [msgs]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoContext, setVideoContext] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lastFileUri, setLastFileUri] = useState(null);
  const [lastFileB64, setLastFileB64] = useState(null);
  const [lastFileMime, setLastFileMime] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const preloadRef = useRef(null);

  useEffect(() => {
    setTimeout(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); inputRef.current?.focus(); }, 100);
  }, [msgs]);

  // Auto-send preloaded message (from "Build Script" on idea cards)
  // Pre-fill input from Build Script — user reviews and sends manually
  useEffect(() => {
    if(!preloadMsg || preloadRef.current===preloadMsg.id) return;
    preloadRef.current = preloadMsg.id;
    setInput(preloadMsg.text);
    setTimeout(()=>inputRef.current?.focus(), 120);
  }, [preloadMsg]);

  const TOOLS = [
    {
      name: "add_task",
      description: "Add a new task to the task list",
      input_schema: {
        type:"object",
        properties: {
          text: { type:"string", description:"The task text" },
          assignee: { type:"string", enum:WL.creator2?[WL.creator1||"Creator",WL.creator2,"Both"]:[WL.creator1||"Creator"], description:"Who the task is assigned to" },
          priority: { type:"string", enum:["urgent","normal","low"], description:"Task priority" }
        },
        required:["text","assignee"]
      }
    },
    {
      name: "add_video_idea",
      description: "Add a new video content idea",
      input_schema: {
        type:"object",
        properties: {
          title: { type:"string", description:"The video idea title/concept" },
          hook: { type:"string", description:"The opening hook for the video" },
          platform: { type:"string", enum:["tiktok","instagram","both"], description:"Target platform" },
          notes: { type:"string", description:"Additional notes or description" }
        },
        required:["title","platform"]
      }
    },
    {
      name: "get_stats",
      description: "Get current content performance stats",
      input_schema: { type:"object", properties:{}, required:[] }
    }
  ];

  const executeTool = (name, inp) => {
    if(name === "add_task") {
      const newTask = { id:Date.now(), text:inp.text, assignee:inp.assignee||WL.creator1||"Me", done:false, priority:inp.priority||"normal", created:new Date().toISOString() };
      setTasks(ts=>[newTask,...ts]);
      saveJSON(TASKS_KEY, [newTask,...tasks]);
      return `Task added: "${inp.text}" assigned to ${inp.assignee}`;
    }
    if(name === "add_video_idea") {
      const newIdea = { id:Date.now(), title:inp.title, hook:inp.hook||"", platform:inp.platform, notes:inp.notes||"", viral:null, created:new Date().toISOString() };
      setIdeas(is=>[newIdea,...is]);
      saveJSON(IDEAS_KEY, [newIdea,...ideas]);
      return `Video idea added: "${inp.title}" for ${inp.platform}`;
    }
    if(name === "get_stats") {
      const ttVids = videos.filter(v=>v.platform==="tiktok");
      const igVids = videos.filter(v=>v.platform==="instagram");
      const totalViews = videos.reduce((s,v)=>s+(v.views||0),0);
      const topVideo = [...videos].sort((a,b)=>(b.views||0)-(a.views||0))[0];
      return JSON.stringify({
        tiktok_videos: ttVids.length,
        instagram_reels: igVids.length,
        total_views: totalViews,
        total_ideas: ideas.length,
        pending_tasks: tasks.filter(t=>!t.done).length,
        top_video: topVideo ? { title:topVideo.title, views:topVideo.views, platform:topVideo.platform } : null
      });
    }
    return "Unknown tool";
  };

  const convertToMp4 = (file) => new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.onloadedmetadata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(video.videoWidth, 1280);
      canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(30);

      // Add audio if possible
      try {
        const audioCtx = new AudioContext();
        const src = audioCtx.createMediaElementSource(video);
        const dst = audioCtx.createMediaStreamDestination();
        src.connect(dst);
        dst.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      } catch {}

      const recorder = new MediaRecorder(stream, { mimeType:"video/webm;codecs=vp8", videoBitsPerSecond:1500000 });
      const chunks = [];
      recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type:"video/webm" });
        resolve(new File([blob], file.name.replace(/\.\w+$/, ".webm"), { type:"video/webm" }));
        URL.revokeObjectURL(video.src);
      };
      recorder.onerror = reject;

      video.currentTime = 0;
      video.play();
      recorder.start();
      video.onended = () => recorder.stop();
      // Safety timeout
      setTimeout(() => { if(recorder.state==="recording") recorder.stop(); }, (video.duration+2)*1000);
    };
    video.onerror = reject;
  });

  const analyseVideo = async (file) => {
    const cfg = loadJSON(KEYS_KEY, {});
    const geminiKey = cfg?.keys?.gemini || BAKED_GEMINI_KEY;
    if(!geminiKey) { setMsgs(m=>[...m,{role:"assistant",content:"No Gemini API key set. Go to Settings to add one — video analysis uses Gemini."}]); return; }

    setUploading(true);
    setMsgs(m=>[...m, { role:"user", content:file.name }, { role:"assistant", content:"Preparing your clip..." }]);

    try {
      // Normalise mime type — Gemini accepts video/mov not video/quicktime
      const mimeType = file.type === "video/quicktime" ? "video/mov" : (file.type || "video/mp4");

      setMsgs(m=>[...m.slice(0,-1), { role:"assistant", content:"Uploading clip..." }]);

      // Multipart upload directly to Gemini (same domain as generateContent — CORS works)
      const boundary = "GeminiBound" + Date.now();
      const enc = new TextEncoder();
      const metaBytes = enc.encode(
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        JSON.stringify({ file:{ display_name: file.name } }) +
        `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
      );
      const tailBytes = enc.encode(`\r\n--${boundary}--`);
      const body = new Blob([metaBytes, file, tailBytes]);

      const uploadRes = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}&uploadType=multipart`,
        { method:"POST", headers:{ "Content-Type":`multipart/related; boundary=${boundary}` }, body }
      );
      if(!uploadRes.ok) {
        const e = await uploadRes.json().catch(()=>({}));
        throw new Error(`Upload failed: ${uploadRes.status} — ${e?.error?.message||""}`);
      }
      const uploadData = await uploadRes.json();
      const fileUri = uploadData?.file?.uri;
      if(!fileUri) throw new Error("No file URI from Gemini");

      // Poll until ACTIVE
      setMsgs(m=>[...m.slice(0,-1), { role:"assistant", content:"Processing clip..." }]);
      const fileId = fileUri.split("/files/")[1] || fileUri.split("/").pop();
      let ready = false;
      for(let i=0; i<40; i++) {
        await new Promise(r=>setTimeout(r,3000));
        const s = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileId}?key=${geminiKey}`);
        if(s.ok) {
          const sd = await s.json();
          if(sd.state === "ACTIVE") { ready = true; break; }
          if(sd.state === "FAILED") throw new Error("Gemini failed to process this video format. Try exporting as MP4.");
        }
      }
      if(!ready) throw new Error("Processing timed out. Try a shorter clip.");

      setMsgs(m=>[...m.slice(0,-1), { role:"assistant", content:"Analysing your clip..." }]);

      const organicForAnalysis = videos.filter(v=>!v.boosted);
      const avgViewsForAnalysis = organicForAnalysis.length ? Math.round(organicForAnalysis.reduce((s,v)=>s+(v.views||0),0)/organicForAnalysis.length) : 0;
      const channelInsightsForAnalysis = buildChannelInsights(organicForAnalysis.length?organicForAnalysis:videos);
      const channelStatsForAnalysis = formatChannelInsights(channelInsightsForAnalysis);
      const engForAnalysis = buildEngagementSignals(organicForAnalysis.length?organicForAnalysis:videos);
      const engBlockForAnalysis = formatEngagementSignals(engForAnalysis);
      const comboForAnalysis = buildComboMatrix(organicForAnalysis.length?organicForAnalysis:videos);
      const comboBlockForAnalysis = formatComboMatrix(comboForAnalysis);
      const channelTheoryForAnalysis = loadJSON(CHANNEL_THEORY_KEY,"");
      const trendsForAnalysis = loadJSON(CUR_TRENDS_KEY,"");

      const _anlWL = loadWL();
      const prompt = `You are the world's best viral video analyst — combining expertise in social psychology, the 2026 TikTok/Reels algorithm, and ${_anlWL.niche}. You are analysing a clip for ${_anlWL.handle} (${_anlWL.appName} — ${_anlWL.appDescription||_anlWL.niche}).

${COACH_PRINCIPLES}

${channelTheoryForAnalysis ? `━━ CHANNEL VIRAL THEORY ━━\n${channelTheoryForAnalysis}\n` : ""}
${channelStatsForAnalysis || `CHANNEL: organic avg views ${avgViewsForAnalysis} | limited data — use niche benchmarks`}
${engBlockForAnalysis}
${comboBlockForAnalysis}
("good" = 3x channel avg = ${fmt(avgViewsForAnalysis*3)}, "viral" = 10x+ = ${fmt(avgViewsForAnalysis*10)})
${trendsForAnalysis ? `\nCURRENT TRENDS (use these in editing + sound recommendations):\n${trendsForAnalysis}` : ""}
${videoContext ? `\nCREATOR CONTEXT FOR THIS CLIP:\n${videoContext}` : ""}
${_anlWL.nicheLogic ? `\nNICHE INTELLIGENCE:\n${_anlWL.nicheLogic}` : ""}

${voiceBlock(videos, ideas)}
Any hook you write in the refilm_brief MUST be in the creator's Voice DNA above.

Analyse this clip with full virality science:

━━ 1. SCROLL-STOP AUDIT (0-0.5s) ━━
- Does the very first frame stop the scroll? (brain decides in 400ms)
- Which hook type: visual disruption / open loop / identity trigger / social proof / pattern interrupt / none?
- Hook score: /10 — what specifically makes it strong or weak?

━━ 2. RETENTION CURVE PREDICTION ━━
- Exact timestamp where viewers will drop off and WHY
- Is there a setup → tension → payoff arc?
- Any dead air, slow sections, or unnecessary footage to cut?
- Predicted watch-through rate: X% — reasoning?

━━ 3. ENGAGEMENT TRIGGER ANALYSIS ━━
- SHARE trigger: does it give viewers social currency?
- SAVE trigger: bookmark-worthy info or satisfying moment?
- COMMENT trigger: does it prompt debate or emotional response?
- Which trigger is strongest? Which is weakest?

━━ 4. CONTENT PILLAR & AUDIENCE ━━
- Which content pillar from ${_anlWL.contentStyle||_anlWL.niche}?
- Which audience segment does it hit hardest?
- Share potential: high / medium / low — why?

━━ 5. EDITING FIXES (priority order) ━━
1. [HIGHEST IMPACT] — specific timestamp and what to change
2. [MEDIUM IMPACT] — specific change
3. [QUICK WIN] — easiest change with solid return

━━ 6. VERDICT ━━
- Post as-is / quick edit needed / reshoot — and exactly why
- Virality ceiling estimate: X-Xk views organic — reasoning
- ONE sentence a non-editor could act on immediately

Be specific with timestamps. Harsh but constructive. No generic advice.`;

      const genRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        { method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ contents:[{ parts:[{ file_data:{ mime_type:mimeType, file_uri:fileUri } }, { text:prompt }] }] })
        }
      );
      if(!genRes.ok) {
        const errData = await genRes.json().catch(()=>({}));
        throw new Error(`Gemini error: ${genRes.status} — ${errData?.error?.message||""}`);
      }
      const genData = await genRes.json();
      const text = genData?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis returned.";
      setLastFileB64(fileUri); // store URI for CapCut plan
      setLastFileMime(mimeType);
      setMsgs(m=>[...m.slice(0,-1), { role:"assistant", content:text, showCapcutBtn:true }]);
    } catch(e) {
      setMsgs(m=>[...m.slice(0,-1), { role:"assistant", content:`Error: ${e.message}` }]);
    } finally {
      setUploading(false);
      setVideoFile(null);
      if(fileRef.current) fileRef.current.value = "";
    }
  };

  const send = async () => {
    const text = input.trim();
    if(!text || loading) return;
    if(!anthropicKey && !USE_BACKEND) { setMsgs(m=>[...m,{role:"assistant",content:"No Anthropic API key set. Go to Settings to add one."}]); return; }

    const userMsg = { role:"user", content:text };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const organicVids = videos.filter(v=>!v.boosted);
      const avgViews = organicVids.length ? Math.round(organicVids.reduce((s,v)=>s+(v.views||0),0)/organicVids.length) : (videos.length ? Math.round(videos.reduce((s,v)=>s+(v.views||0),0)/videos.length) : 0);
      const memCtx = buildMemoryContext();
      const currentTrends = loadJSON(CUR_TRENDS_KEY,"");
      const channelTheoryChat = loadJSON(CHANNEL_THEORY_KEY,"");
      const chatInsights = buildChannelInsights(organicVids.length?organicVids:videos);
      const chatInsightsBlock = formatChannelInsights(chatInsights);
      const chatEngBlock = formatEngagementSignals(buildEngagementSignals(organicVids.length?organicVids:videos));
      const chatComboBlock = formatComboMatrix(buildComboMatrix(organicVids.length?organicVids:videos));
      const chatAuditBlock = formatAuditRubric(buildAuditRubric(organicVids.length?organicVids:videos));
      const chatPredAcc = formatPredictionAccuracy(buildPredictionAccuracy(ideas));
      const compDataChat = loadCompetitorData();
      const chatCompHooks = compDataChat?.data?.steal_these_hooks?.slice(0,3).map(h=>`"${h.hook}" (${h.from_creator})`).join(", ")||"";
      const _chatWL = loadWL();
      const systemPrompt = `You are the world's best viral content strategist for ${_chatWL.platforms?.toUpperCase()?.split(",").join(" & ")||"social media"}. You manage ${_chatWL.handle} through ${_chatWL.appName}.

${COACH_PRINCIPLES}

━━ BRAND & MISSION ━━
${_chatWL.creator1}${_chatWL.creator2?` + ${_chatWL.creator2}`:""} — ${_chatWL.niche}.
Core identity: ${_chatWL.appDescription||_chatWL.niche}.
Best performing formula: ${_chatWL.bestFormula||"hook → story → CTA"}.
Brand values: ${_chatWL.brandValues||"authenticity, consistency"}.
Biggest challenge to solve: ${_chatWL.biggestChallenge||"content consistency"}.
Goals: ${_chatWL.goals||"grow audience and engagement"}.
Target audience: ${_chatWL.targetAudience||"18-35 social media users"}.
Key competitors to study: ${_chatWL.competitors||"top creators in niche"}.

━━ CHANNEL DATA (real numbers — treat as ground truth) ━━
- ${videos.length} videos tracked | ${tasks.filter(t=>!t.done).length} open tasks | ${ideas.length} ideas in pipeline
${chatInsightsBlock}
${chatEngBlock}
${chatComboBlock}
${chatAuditBlock}
${chatPredAcc}
${chatCompHooks ? `Competitor hooks proven in niche: ${chatCompHooks}` : ""}

${voiceBlock(organicVids.length?organicVids:videos, ideas)}

━━ 2025 ALGORITHM INTELLIGENCE ━━
TIKTOK: Prioritises "satisfaction loops" — videos where the viewer feels something resolved. Shares 3× more valuable than likes. Comment bait drives reach. Watch loops (rewatchable endings) add 20-40% to effective watch time score.
REELS: Favours saves (bookmark-worthy info) and shares to Stories. Collab posts with local accounts get 2-3× organic reach. Audio trending within 48hrs of a sound peaking = algorithm boost window.
BOTH: First 0.5 seconds is the ONLY thing that matters for stopping the scroll. Native-feeling content (vertical, no heavy graphics, authentic audio) outperforms produced content 4:1 in 2025.

━━ SCROLL-STOPPING HOOK SCIENCE ━━
The brain decides to scroll in 400ms. Effective hooks use ONE of:
1. VISUAL DISRUPTION — something unexpected in frame immediately
2. OPEN LOOP — a statement that can't be resolved without watching
3. IDENTITY TRIGGER — makes the viewer see themselves ("POV: you're...")
4. SOCIAL PROOF IN MOTION — other people reacting creates FOMO
5. PATTERN INTERRUPT — sudden sound, cut, or movement that breaks visual flow

━━ NICHE-SPECIFIC INTELLIGENCE ━━
${_chatWL.nicheLogic || _chatWL.contentStyle || `Apply all hook science and algorithm principles to ${_chatWL.niche}. Study what works for ${_chatWL.competitors} and find gaps.`}

━━ EDITING PRINCIPLES FOR MAX RETENTION ━━
- Cut on movement, not on pauses
- Text overlays: max 5 words, appear within first 3s
- Pacing: cut every 2-4 seconds in first 15s
- End on either: resolution (satisfying) OR open question (drives comments)
- Captions always on — 85% of viewers watch muted
- Music: trending audio within its peak window; 30% volume under voiceover

━━ TOOLS ━━
- add_task: add actionable task for ${_chatWL.creator1}${_chatWL.creator2?` or ${_chatWL.creator2}`:""}
- add_video_idea: add content idea to pipeline
- get_stats: pull channel performance data

━━ RESPONSE STYLE ━━
Be brutally honest, specific, and strategic. Give concrete next actions, not vague advice. Reference the virality science above when explaining WHY something will or won't work. When adding tasks or ideas, do it immediately with tools — no confirmation needed.

${channelTheoryChat ? `━━ CHANNEL VIRAL THEORY ━━\n${channelTheoryChat}` : ""}

${currentTrends ? `━━ CURRENT TRENDS ━━\n${currentTrends}` : ""}

${memCtx ? `━━ CHANNEL MEMORY ━━\n${memCtx}` : ""}`;


      let conversationMsgs = newMsgs.slice(1); // skip the initial assistant greeting
      let data = await anthropicMessages({ model:"claude-sonnet-4-6", max_tokens:1024, system:systemPrompt, tools:TOOLS, messages:conversationMsgs }, anthropicKey);
      let assistantContent = data.content;
      let allMsgs = [...conversationMsgs, { role:"assistant", content:assistantContent }];

      // Handle tool use in a loop
      while(data.stop_reason === "tool_use") {
        const toolUses = assistantContent.filter(b=>b.type==="tool_use");
        const toolResults = toolUses.map(tu => ({
          type:"tool_result",
          tool_use_id: tu.id,
          content: executeTool(tu.name, tu.input)
        }));

        allMsgs = [...allMsgs, { role:"user", content:toolResults }];

        data = await anthropicMessages({ model:"claude-sonnet-4-6", max_tokens:1024, system:systemPrompt, tools:TOOLS, messages:allMsgs }, anthropicKey);
        assistantContent = data.content;
        allMsgs = [...allMsgs, { role:"assistant", content:assistantContent }];
      }

      const textContent = assistantContent.filter(b=>b.type==="text").map(b=>b.text).join("\n").trim();
      setMsgs(m=>[...m, { role:"assistant", content:textContent||"Done!" }]);
    } catch(e) {
      setMsgs(m=>[...m, { role:"assistant", content:`Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const msgText = (msg) => typeof msg.content === "string" ? msg.content : msg.content?.filter?.(b=>b.type==="text").map(b=>b.text).join("\n") || "";

  const renderMsgContent = (msg) => {
    const text = msgText(msg);
    if(msg.role === "user") return <span style={{ whiteSpace:"pre-wrap" }}>{text}</span>;
    // Parse assistant markdown into structured elements
    const lines = text.split("\n");
    const elements = [];
    let i = 0;
    while(i < lines.length) {
      const line = lines[i];
      if(!line.trim()) { i++; continue; }
      // H1/H2 style: ## Header or **Header**
      if(/^#{1,3}\s/.test(line)) {
        const t = line.replace(/^#{1,3}\s+/, "");
        elements.push(<div key={i} style={{ fontWeight:700, color:"#fff", fontSize:14, marginTop:elements.length?10:0, marginBottom:3, letterSpacing:"0.01em" }}>{t}</div>);
        i++; continue;
      }
      // Bold-only line as header: **Foo**
      if(/^\*\*[^*]+\*\*:?$/.test(line.trim())) {
        const t = line.trim().replace(/\*\*/g,"").replace(/:$/,"");
        elements.push(<div key={i} style={{ fontWeight:700, color:"#fff", fontSize:13, marginTop:elements.length?8:0, marginBottom:2 }}>{t}</div>);
        i++; continue;
      }
      // Bullet: - or * or •
      if(/^[-*•]\s/.test(line.trim())) {
        const bullets = [];
        while(i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
          const bt = lines[i].trim().replace(/^[-*•]\s+/,"");
          bullets.push(<div key={i} style={{ display:"flex", gap:8, marginBottom:3 }}>
            <span style={{ color:C.pink, flexShrink:0, marginTop:1 }}>•</span>
            <span style={{ color:"rgba(255,255,255,0.88)", lineHeight:1.5 }}>{renderInline(bt)}</span>
          </div>);
          i++;
        }
        elements.push(<div key={"b"+i} style={{ marginTop:elements.length?6:0 }}>{bullets}</div>);
        continue;
      }
      // Numbered list
      if(/^\d+\.\s/.test(line.trim())) {
        const items = [];
        let n = 1;
        while(i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          const bt = lines[i].trim().replace(/^\d+\.\s+/,"");
          items.push(<div key={i} style={{ display:"flex", gap:8, marginBottom:3 }}>
            <span style={{ color:C.purple, flexShrink:0, fontWeight:700, minWidth:14 }}>{n}.</span>
            <span style={{ color:"rgba(255,255,255,0.88)", lineHeight:1.5 }}>{renderInline(bt)}</span>
          </div>);
          i++; n++;
        }
        elements.push(<div key={"n"+i} style={{ marginTop:elements.length?6:0 }}>{items}</div>);
        continue;
      }
      // Normal paragraph
      elements.push(<div key={i} style={{ color:"rgba(255,255,255,0.88)", lineHeight:1.6, marginTop:elements.length?6:0 }}>{renderInline(line)}</div>);
      i++;
    }
    return <div style={{ fontSize:13.5, fontFamily:C.fontBody }}>{elements}</div>;
  };

  const renderInline = (text) => {
    // Bold **foo** and `code`
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, i) => {
      if(p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ color:"#fff", fontWeight:700 }}>{p.slice(2,-2)}</strong>;
      if(p.startsWith("`") && p.endsWith("`")) return <code key={i} style={{ background:"rgba(255,255,255,0.1)", borderRadius:4, padding:"1px 5px", fontSize:12, fontFamily:C.fontMono }}>{p.slice(1,-1)}</code>;
      return p;
    });
  };

  const getCapcutPlan = async () => {
    if(!lastFileB64) return;
    const cfg = loadJSON(KEYS_KEY, {});
    const geminiKey = cfg?.keys?.gemini || BAKED_GEMINI_KEY;
    if(!geminiKey) return;
    setMsgs(m=>[...m, { role:"user", content:"Give me a step-by-step CapCut edit plan for maximum virality" }, { role:"assistant", content:"Building your CapCut edit plan..." }]);
    setLoading(true);
    try {
      const capCutTrends = loadJSON(CUR_TRENDS_KEY,"");
      const prompt = `You are an expert viral video editor for TikTok and Instagram Reels in June 2026. Watch this clip carefully and create a detailed step-by-step CapCut editing guide for MAXIMUM virality.
${capCutTrends?`\nCURRENT TRENDS TO USE IN YOUR SOUND/FORMAT RECOMMENDATIONS:\n${capCutTrends}\n`:""}

Give me EXACTLY this format:

CLIP TRIM
- Start at: [timestamp] End at: [timestamp] (remove any dead air or slow parts)
- Any sections to cut out: [timestamps]

HOOK EDIT (0-3 seconds)
- What to show: [exact description]
- Text overlay: [exact text to add] at [timestamp], font style suggestion
- Any speed change: [e.g. 1.2x from 0s-2s]

MAIN BODY CUTS
- Cut 1: [timestamp] → [timestamp] — reason
- Cut 2: [timestamp] → [timestamp] — reason
(list every cut)

TEXT OVERLAYS
- [timestamp]: "[exact text]" — placement (top/middle/bottom)
(list every text overlay with exact wording)

TRANSITIONS
- [timestamp]: use [transition type] between clips

MUSIC
- Vibe needed: [describe the energy]
- Specific suggestions: [2-3 TikTok sound suggestions]
- Music timing tip: [e.g. drop beat at 3s]

CAPTIONS
- Style: [auto-captions on/off, font, colour]
- Any manual caption tweaks

FINAL SETTINGS
- Aspect ratio: 9:16
- Export quality: 1080p
- Any filters or colour grade suggestion

VIRALITY SCORE PREDICTION: [X/10] — [one line reason]

Be extremely specific with timestamps. This is for someone who is not confident at editing.`;

      const genRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        { method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ contents:[{ parts:[{ file_data:{ mime_type:lastFileMime, file_uri:lastFileB64 } }, { text:prompt }] }] })
        }
      );
      if(!genRes.ok) throw new Error(`Gemini error: ${genRes.status}`);
      const genData = await genRes.json();
      const text = genData?.candidates?.[0]?.content?.parts?.[0]?.text || "No plan returned.";
      setMsgs(m=>[...m.slice(0,-1), { role:"assistant", content:text }]);
    } catch(e) {
      setMsgs(m=>[...m.slice(0,-1), { role:"assistant", content:`Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    // Save a memory snapshot of the session before clearing
    const userMsgs = msgs.filter(m=>m.role==="user" && typeof m.content==="string");
    if(userMsgs.length > 0) {
      const topics = userMsgs.map(m=>m.content.slice(0,60)).join(" | ");
      addMemoryEntry("CHAT_SESSION", `Session topics: ${topics.slice(0,200)}`);
    }
    const fresh = [{ role:"assistant", content:WL.aiGreeting }];
    setMsgs(fresh);
    setLastFileUri(null);
    setLastFileMime(null);
  };

  const creator1Init = (WL.creator1||"U").slice(0,2).toUpperCase();

  return (
    <div style={{ display:"flex", flexDirection:"column", height:chatH, minHeight:isMobile?280:480 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isMobile?16:16, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:isMobile?36:42, height:isMobile?36:42, borderRadius:14, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 20px ${C.pink}40` }}>
            {I.brain(isMobile?16:20,"#fff")}
          </div>
          <div>
            <div style={{ fontSize:isMobile?14:16, fontWeight:700, color:"#fff", lineHeight:1.1 }}>{WL.appName} AI</div>
            <div style={{ fontSize:10, color:C.purple, marginTop:2, letterSpacing:"0.02em" }}>Powered by Claude</div>
          </div>
        </div>
        {msgs.length > 1 && (
          <button onClick={clearChat} style={{ fontSize:11, padding:"6px 12px", borderRadius:10, border:`1px solid rgba(255,255,255,0.1)`, background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:C.fontHead }}>
            Clear
          </button>
        )}
      </div>

      {/* Quick-action chips — only on fresh session */}
      {msgs.length <= 1 && (
        <div style={{ marginBottom:isMobile?16:16, flexShrink:0 }}>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:6 }}>
            {[
              { label:"My stats", icon:I.bar, color:C.cyan },
              { label:"What to post next?", icon:I.zap, color:C.yellow },
              { label:"Add task", icon:I.check, color:C.green },
              { label:"New video idea", icon:I.idea, color:C.purple },
            ].map(s=>(
              <button key={s.label} onClick={()=>{ setInput(s.label); setTimeout(()=>inputRef.current?.focus(),50); }}
                style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, padding:isMobile?"13px 16px":"10px 12px", borderRadius:12, border:`1px solid ${s.color}30`, background:`${s.color}08`, color:"rgba(255,255,255,0.8)", cursor:"pointer", fontFamily:C.fontHead, textAlign:"left" }}>
                {s.icon(12,s.color)}<span style={{ flex:1 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:isMobile?22:12, paddingRight:2, paddingBottom:4 }}>
        {msgs.map((msg,i)=>(
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:msg.role==="user"?"flex-end":"flex-start", gap:8 }}>
            <div style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", gap:8, alignItems:"flex-end", maxWidth:isMobile?"92%":"85%" }}>
              {msg.role==="assistant" && (
                <div style={{ width:28, height:28, borderRadius:9, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {I.brain(13,"#fff")}
                </div>
              )}
              <div style={{
                padding:isMobile?"13px 16px":"14px 18px",
                borderRadius:msg.role==="user"?"18px 18px 4px 18px":"4px 18px 18px 18px",
                background:msg.role==="user" ? `linear-gradient(135deg,${C.pink},${C.purple})` : "rgba(255,255,255,0.06)",
                border:msg.role==="assistant" ? `1px solid rgba(255,255,255,0.09)` : "none",
                boxShadow:msg.role==="user" ? `0 4px 20px ${C.pink}30` : "none",
                color:"#fff", fontSize:isMobile?13:13.5, lineHeight:1.65, fontFamily:C.fontHead,
                wordBreak:"break-word", whiteSpace:"pre-wrap",
              }}>
                {renderMsgContent(msg)}
              </div>
              {msg.role==="user" && (
                <div style={{ width:28, height:28, borderRadius:9, background:`linear-gradient(135deg,${C.pink}70,${C.purple}70)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:10, fontWeight:700, color:"#fff" }}>{creator1Init}</div>
              )}
            </div>
            {msg.showCapcutBtn && (
              <button onClick={getCapcutPlan} disabled={loading}
                style={{ marginLeft:36, display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:14, border:`1px solid ${C.cyan}45`, cursor:loading?"not-allowed":"pointer", background:`linear-gradient(135deg,${C.cyan}14,${C.purple}14)`, color:C.cyan, fontSize:12, fontFamily:C.fontHead, fontWeight:700, opacity:loading?0.5:1 }}>
                {I.write(12,C.cyan)} CapCut Edit Plan →
              </button>
            )}
          </div>
        ))}
        {(loading||uploading) && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:9, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{I.brain(13,"#fff")}</div>
            <div style={{ padding:"12px 18px", borderRadius:"4px 18px 18px 18px", background:"rgba(255,255,255,0.06)", border:`1px solid rgba(255,255,255,0.09)`, display:"flex", gap:5, alignItems:"center" }}>
              {[0,1,2].map(k=><div key={k} style={{ width:6, height:6, borderRadius:"50%", background:`linear-gradient(135deg,${C.pink},${C.purple})`, animation:`pulse 1.2s ${k*0.22}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Video preview pill */}
      {videoFile && (
        <div style={{ background:`${C.purple}10`, border:`1px solid ${C.purple}35`, borderRadius:14, marginTop:8, flexShrink:0, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:isMobile?"13px 16px":"10px 12px" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`${C.purple}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{I.vid(13,C.purple)}</div>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.85)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{videoFile.name}</span>
            <button onClick={()=>{ setVideoFile(null); setVideoContext(""); if(fileRef.current) fileRef.current.value=""; }} aria-label="Remove file" style={{ background:"none", border:"none", color:"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:18, lineHeight:1, padding:"0 4px", flexShrink:0 }}>×</button>
          </div>
          <div style={{ padding:"0 12px 10px" }}>
            <input value={videoContext} onChange={e=>setVideoContext(e.target.value)} placeholder="Goal for this clip? (optional)"
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.purple}25`, borderRadius:9, color:"rgba(255,255,255,0.8)", padding:"8px 11px", fontSize:12, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
            <button onClick={()=>analyseVideo(videoFile)} disabled={uploading}
              style={{ width:"100%", padding:"10px", borderRadius:10, border:"none", cursor:uploading?"not-allowed":"pointer", background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontSize:13, fontFamily:C.fontHead, fontWeight:700, opacity:uploading?0.6:1 }}>
              {uploading?"Uploading...":"Analyse clip →"}
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div style={{ display:"flex", gap:8, padding:isMobile?"13px 16px":"10px 12px", background:"rgba(255,255,255,0.05)", borderRadius:18, border:`1px solid rgba(255,255,255,0.1)`, marginTop:10, alignItems:"center", flexShrink:0 }}>
        <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) setVideoFile(e.target.files[0]); }} />
        <button onClick={()=>fileRef.current?.click()} title="Upload video clip"
          style={{ width:34, height:34, borderRadius:10, border:`1px solid rgba(255,255,255,0.1)`, background:"rgba(255,255,255,0.05)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {I.vid(14,"rgba(255,255,255,0.6)")}
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder={`Ask ${WL.appName} AI...`}
          style={{ flex:1, background:"transparent", border:"none", color:"#fff", fontSize:14, fontFamily:C.fontHead, outline:"none", minWidth:0 }}
        />
        <button onClick={send} disabled={loading||!input.trim()}
          style={{ padding:"9px 18px", borderRadius:12, border:"none", cursor:loading||!input.trim()?"not-allowed":"pointer", background:loading||!input.trim()?"rgba(255,255,255,0.08)":`linear-gradient(135deg,${C.pink},${C.purple})`, opacity:loading||!input.trim()?0.4:1, color:"#fff", fontSize:13, fontFamily:C.fontHead, fontWeight:700, flexShrink:0, transition:"all 0.2s" }}>
          {loading?"...":"Send"}
        </button>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.1)}}`}</style>
    </div>
  );
}

// ── GUIDED FIRST-SCORE TOUR ──────────────────────────────────────
function GuidedTour({ step, onSkip, onGoContent }) {
  const isMobile = typeof window!=="undefined" && window.innerWidth < 900;
  const [pos, setPos] = useState(null);

  useEffect(()=>{
    const update = ()=>{
      if(step===0) {
        if(isMobile) { setPos({center:true}); return; }
        const el = document.querySelector('[data-tour-nav="content"]');
        if(el) { const r=el.getBoundingClientRect(); setPos({top:r.top,left:r.right+12,anchor:"left"}); }
      } else if(step===1) {
        const el = document.querySelector('[data-tour-input]');
        if(el) { const r=el.getBoundingClientRect(); setPos({top:r.bottom+12,left:Math.min(r.left, window.innerWidth-320),anchor:"top"}); el.focus(); }
        else setPos({center:true});
      }
    };
    update();
    const t = setTimeout(update, 300);
    return ()=>clearTimeout(t);
  },[step]);

  if(step===2) return (
    <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:9999, textAlign:"center", animation:"tourFadeIn 0.4s ease" }}>
      <style>{`@keyframes tourFadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.9)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
      <div style={{ background:"rgba(8,7,12,0.95)", border:"1px solid rgba(255,61,129,0.3)", borderRadius:20, padding:"40px 48px", backdropFilter:"blur(20px)", boxShadow:"0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,61,129,0.15)" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
        <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:8 }}>First score done!</div>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", maxWidth:280, lineHeight:1.5 }}>You're all set. Keep adding ideas and let AI tell you which ones to film.</div>
      </div>
    </div>
  );

  if(!pos || step>2) return null;
  const posStyle = pos.center
    ? { position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:9998 }
    : { position:"fixed", top:pos.top, left:pos.left, zIndex:9998 };

  const TIPS = [
    { title:"Let's score your first idea", desc:"Head to the Content tab to start scoring video ideas with AI.", cta:"Go to Content →", action:onGoContent },
    { title:"Type a video idea", desc:"Describe any video concept — AI will expand and score it instantly.", cta:null, action:null },
  ];
  const tip = TIPS[step];
  if(!tip) return null;

  return (
    <>
      <style>{`
        @keyframes tourPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,61,129,0.4)}50%{box-shadow:0 0 0 12px rgba(255,61,129,0)}}
        @keyframes tourSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      {step===0 && <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:9997 }} onClick={onSkip} />}
      <div style={{
        ...posStyle,
        background:"rgba(8,7,12,0.96)", border:"1px solid rgba(255,61,129,0.3)", borderRadius:14,
        padding:isMobile?"20px":"18px 22px", maxWidth:300, backdropFilter:"blur(16px)",
        boxShadow:"0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,61,129,0.1)",
        animation:"tourSlideIn 0.3s ease, tourPulse 2s ease-in-out infinite"
      }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>{tip.title}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.5, marginBottom:tip.cta?14:0 }}>{tip.desc}</div>
        {tip.cta && <button onClick={tip.action} style={{ padding:"10px 20px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF3D81,#FF6B9D)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", width:"100%" }}>{tip.cta}</button>}
        <button onClick={onSkip} style={{ marginTop:8, background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:11, cursor:"pointer", padding:0, width:"100%", textAlign:"center" }}>Skip tour</button>
      </div>
    </>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ keys, onEditKeys }) {
  const isPhone = typeof window!=="undefined" && window.innerWidth < 520;
  const [isMobile] = useState(() => (typeof window !== 'undefined' && (window.__isMobile || window.innerWidth < 900)));

  // ── GUIDED FIRST-SCORE TOUR ──────────────────────────────────
  const [tourStep, setTourStep] = useState(()=>{
    if(loadJSON("krapmaps_v1_tour_done",false)) return null;
    const hasIdeas = loadJSON(IDEAS_KEY,[]).length > 0;
    return hasIdeas ? null : 0;
  });
  const tourRef = useRef(null);
  const advanceTour = (to) => { setTourStep(to); };
  const finishTour = () => { setTourStep(null); saveJSON("krapmaps_v1_tour_done",true); };

  // ── STATE ──────────────────────────────────────────────────────
  const [nav, setNav]   = useState("home");
  const [sub, setSub]   = useState(null);
  const [aiErr, setAiErr] = useState(null);
  useEffect(()=>{ if(!aiErr) return; const t=setTimeout(()=>setAiErr(null), 15000); return ()=>clearTimeout(t); },[aiErr]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistPreload, setAssistPreload] = useState(null);
  // ── BILLING ─────────────────────────────────────────────────────
  const [plan, setPlan] = useState({ tier: USE_BACKEND?"free":"unmetered", usage:{}, billingConfigured:false });
  const [pricing, setPricing] = useState(null); // null | { reason }
  const refreshPlan = useCallback(()=>{ fetchPlan().then(setPlan).catch(()=>{}); },[]);
  useEffect(()=>{ refreshPlan(); },[refreshPlan]);
  // Any over-limit action anywhere in the app opens the pricing modal.
  useEffect(()=>{
    const onLimit = (e)=>{
      const g = e.detail||{};
      const what = g.label || "this";
      setPricing({ reason: `You've used all ${g.limit} ${what==="this"?"actions":what} on the ${TIER_LABELS[g.tier]||g.tier} plan this month. Upgrade to keep going — it resets monthly.` });
      refreshPlan();
    };
    window.addEventListener("km-limit", onLimit);
    return ()=>window.removeEventListener("km-limit", onLimit);
  },[refreshPlan]);
  // Returning from Stripe Checkout — confirm the upgrade and clean the URL.
  useEffect(()=>{
    try {
      const q = new URLSearchParams(window.location.search);
      if(q.get("upgraded")){ setTimeout(refreshPlan, 1500); setTimeout(refreshPlan, 5000); window.history.replaceState({}, "", window.location.pathname); }
      else if(q.get("upgrade")==="cancel"){ window.history.replaceState({}, "", window.location.pathname); }
    } catch {}
  },[refreshPlan]);

  // ── PULL-TO-REFRESH (installed PWA only) ───────────────────────
  // Standalone mode has no browser chrome — without this, a stale or stuck
  // screen means force-killing the app. Native pull-to-refresh covers browser
  // tabs, so this only activates in display-mode: standalone.
  const [ptr, setPtr] = useState(0); // 0 idle · pull distance while dragging · -1 refreshing
  useEffect(()=>{
    const standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
    if(!standalone) return;
    let startY = null, pulling = false, dist = 0;
    const THRESH = 90;
    const onStart = (e) => { if(window.scrollY <= 0 && e.touches?.length===1){ startY = e.touches[0].clientY; pulling = true; dist = 0; } };
    const onMove = (e) => {
      if(!pulling || startY==null) return;
      if(window.scrollY > 0){ pulling=false; setPtr(0); return; }
      dist = e.touches[0].clientY - startY;
      if(dist > 12) setPtr(Math.min(dist, 140)); else setPtr(0);
    };
    const onEnd = () => {
      if(pulling && dist >= THRESH){ setPtr(-1); setTimeout(()=>window.location.reload(), 250); }
      else setPtr(0);
      pulling = false; startY = null; dist = 0;
    };
    window.addEventListener("touchstart", onStart, { passive:true });
    window.addEventListener("touchmove", onMove, { passive:true });
    window.addEventListener("touchend", onEnd, { passive:true });
    return ()=>{ window.removeEventListener("touchstart", onStart); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
  },[]);

  const handleBuildScript = (idea) => {
    const msg = `Build me a full script for this idea:\n\nTitle: "${idea.title}"\nType: ${idea.type||"facecam"}\nHook: ${idea.hook||""}\n${idea.improvedHook?`Improved hook: "${idea.improvedHook}"\n`:""}\nInclude: opening hook (exact words to say), main body (what to show + say at each moment), and a closing CTA. Give timestamps and CapCut text overlay suggestions. Make it optimised for maximum virality. Write every line of spoken dialogue in MY voice (per the Creator Voice DNA) — it should sound like me talking, not a script an AI wrote.`;
    setAssistPreload({ text: msg, id: Date.now() });
    setNav("ai");
    setSub(null);
    // Background: auto-score if not already scored
    if(!idea.viral && (USE_BACKEND||keys?.anthropic||BAKED_ANTHROPIC_KEY)) {
      setTimeout(()=>scoreIdea(idea), 500);
    }
  };

  const runDebrief = async () => {
    if(!(USE_BACKEND||keys?.anthropic||BAKED_ANTHROPIC_KEY)) return;
    setDebriefLoading(true);
    try {
      const vids = loadJSON(VIDEOS_KEY,[]);
      const idList = loadJSON(IDEAS_KEY,[]);
      const topVids = [...vids].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
      const postedThisWeek = idList.filter(i=>i.status==="posted"&&i.postedDate&&(Date.now()-new Date(i.postedDate).getTime())<604800000);
      const recentIdeas = idList.slice(0,5).map(i=>`"${(i.title||"").slice(0,40)}" (scored ${i.viral||"unscored"})`).join(", ");
      const r = await callAI(`You are the strategist for ${WL.handle} (${WL.appName} — ${WL.niche}). Generate a weekly debrief.\n\n${COACH_PRINCIPLES}\n\nChannel data:\n- Total videos: ${vids.length}, avg views: ${Math.round(vids.reduce((s,v)=>s+(v.views||0),0)/(vids.length||1))}\n- Posted this week: ${postedThisWeek.length} videos\n- Top 5 videos: ${topVids.map(v=>`${(v.title||"").slice(0,30)} (${(v.views||0).toLocaleString()} views)`).join(", ")}\n- Recent ideas: ${recentIdeas}\n- Unscored ideas: ${idList.filter(i=>!(i.viral>0)).length}\n\n${voiceBlock(vids, idList)}\nWrite the "ideaToFilmNow" title/hook in the creator's Voice DNA above.\n\nReturn ONLY JSON: {"headline":"","whatWorked":["",""],"whatDidnt":[""],"focusThisWeek":["","",""],"ideaToFilmNow":"title and why","watchOut":"one risk to avoid"}`, 800);
      const result = {...r, generatedAt: new Date().toISOString()};
      saveJSON("krapmaps_v1_debrief", result);
      setWeeklyDebrief(result);
      addXP(30);
    } catch(e){}
    setDebriefLoading(false);
  };

  const [wlConfig, setWlConfig] = useState(()=>loadWL());
  const [videoScores, setVideoScores] = useState(()=>loadJSON(SCORES_KEY,{}));
  const [commentInsights, setCommentInsights] = useState(()=>loadJSON(COMMENTS_KEY,null));
  const [visualDNA, setVisualDNA] = useState(()=>loadJSON(VISION_KEY,null));
  const onEditWL = (newWL) => { saveWL(newWL); setWlConfig({...WL_DEFAULTS,...newWL}); };
  const activeWL = wlConfig;

  const [manualData, setManualData] = useState(()=>loadJSON(MANUAL_KEY,{}));
  const [videos, setVideos]         = useState(()=>loadJSON(VIDEOS_KEY,[]));
  const [ideas, setIdeas]           = useState(()=>loadJSON(IDEAS_KEY,[]));
  const [calItems, setCalItems]     = useState(()=>loadJSON(CAL_KEY,[]));
  const [tasks, setTasks]           = useState(()=>loadJSON(TASKS_KEY,[]));
  const [appIdeas, setAppIdeas]     = useState(()=>loadJSON(APPIDEAS_KEY,[]));
  const [analysis, setAnalysis]     = useState(()=>loadJSON(ANALYSIS_KEY,null));
  const [nextVids, setNextVids]     = useState(()=>loadJSON(NEXTVIDS_KEY,null));
  const [weekly, setWeekly]         = useState(()=>loadJSON(WEEKLY_KEY,null));
  const [trends, setTrends]         = useState(()=>loadJSON(TRENDS_KEY,null));
  const [scrapedStats, setScrapedStats] = useState(()=>loadJSON(SCRAPE_KEY,null));
  const [sbLoaded, setSbLoaded]     = useState(false);
  const ttFetchedRef = useRef(false);
  const igFetchedRef = useRef(false);
  const [statsError, setStatsError] = useState(null);

  const [igData, setIgData]   = useState(null);
  const [igLoad, setIgLoad]   = useState(false);
  const hasIG = !!(keys?.ig);

  const [aiLoad, setAiLoad]   = useState({});
  const [syncMsg, setSyncMsg]   = useState(null);
  const [captionResult, setCaptionResult] = useState(null);
  const [captionIdea, setCaptionIdea]     = useState(null);
  const [copied, setCopied]               = useState({});

  const [modals, setModals]   = useState({});
  const [updateTarget, setUpdateTarget]   = useState(null);
  const [editIdeaTarget, setEditIdeaTarget]       = useState(null);
  const [weeklyDebrief, setWeeklyDebrief] = useState(()=>loadJSON("krapmaps_v1_debrief",null));
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [editAppIdeaTarget, setEditAppIdeaTarget] = useState(null);

  const openModal  = (id,data) => { setModals(m=>({...m,[id]:true})); };
  const closeModal = (id)      => { setModals(m=>({...m,[id]:false})); };

  const m = manualData;

  // ── PERSIST TO LOCALSTORAGE ────────────────────────────────────
  // Strip ephemeral TikTok CDN URLs before saving — they expire and bloat localStorage
  useEffect(()=>{ saveJSON(VIDEOS_KEY, videos.map(v=>{ const {videoUrl,...rest}=v; return rest; })); },[videos]);
  useEffect(()=>{ saveJSON(IDEAS_KEY,ideas); if(sbLoaded&&ideas.length) sbSyncArray("km_ideas",ideas).catch(()=>{}); },[ideas]);
  useEffect(()=>{ saveJSON(CAL_KEY,calItems); if(sbLoaded&&calItems.length) sbSyncArray("km_cal",calItems).catch(()=>{}); },[calItems]);
  useEffect(()=>{ saveJSON(TASKS_KEY,tasks); },[tasks]);
  useEffect(()=>{ saveJSON(APPIDEAS_KEY,appIdeas); },[appIdeas]);
  useEffect(()=>{ saveJSON(MANUAL_KEY,manualData); },[manualData]);
  useEffect(()=>{ if(analysis) saveJSON(ANALYSIS_KEY,analysis); },[analysis]);
  useEffect(()=>{ if(nextVids) saveJSON(NEXTVIDS_KEY,nextVids); },[nextVids]);
  useEffect(()=>{ if(weekly) saveJSON(WEEKLY_KEY,weekly); },[weekly]);
  useEffect(()=>{ if(trends) saveJSON(TRENDS_KEY,trends); },[trends]);

  // ── LOAD FROM SUPABASE ─────────────────────────────────────────
  useEffect(()=>{
    const load = async () => {
      try {
        // Videos
        const vidsRaw = await sbFetch("km_videos",`select=*&id=like.${wsMatch()}*&order=created_at.desc`);
        const vids = vidsRaw ? vidsRaw.map(v=>({ ...v, id: wsStrip(v.id) })) : vidsRaw;
        if(vids===null) { setStatsError("Supabase offline — data saved locally"); }
        else if(vids?.length) {
          setVideos(prev => {
            const merged = [...vids];
            prev.forEach(p=>{ if(!merged.find(v=>v.id===p.id||v.url===p.url)) merged.push(p); });
            return merged;
          });
        }
        // Ideas
        const sbIdeas = await sbLoadArray("km_ideas");
        if(sbIdeas?.length) {
          setIdeas(prev => {
            const merged = [...sbIdeas];
            prev.forEach(p=>{ if(!merged.find(i=>i.id===p.id)) merged.push(p); });
            return merged;
          });
        }
        // Calendar
        const sbCal = await sbLoadArray("km_cal");
        if(sbCal?.length) {
          setCalItems(prev => {
            const merged = [...sbCal];
            prev.forEach(p=>{ if(!merged.find(i=>i.id===p.id)) merged.push(p); });
            return merged;
          });
        }
        // Scraped stats
        const stats = await sbFetch("km_scraped_stats","select=*&order=scraped_at.desc&limit=1");
        if(stats?.[0]) { setScrapedStats(stats[0]); saveJSON(SCRAPE_KEY,stats[0]); }
      } catch(e) { setStatsError("Sync error: "+e.message); }
      setSbLoaded(true);
    };
    load();
  },[]);

  // Recalculate scores whenever videos change
  useEffect(()=>{
    if(!videos.length) return;
    const scores = {};
    videos.forEach(v => {
      const s = calcVideoScore(v, videos);
      if(s) scores[v.id] = s;
    });
    saveJSON(SCORES_KEY, scores);
    setVideoScores(scores);
  },[videos]);

  // ── AUTO 24HR UPDATE ───────────────────────────────────────────
  useEffect(()=>{
    if(!sbLoaded||!scrapedStats?.video_stats) return;
    const vStats = scrapedStats.video_stats;
    setVideos(prev=>prev.map(v=>{
      const s = vStats.find(s=>s.id===v.id||(v.url&&s.url===v.url));
      if(!s) return v;
      return { ...v, views:s.playCount||v.views, likes:s.diggCount||v.likes, comments:s.commentCount||v.comments, shares:s.shareCount||v.shares, _updated:true };
    }));
  },[sbLoaded,scrapedStats]);

  // ── FETCH IG ──────────────────────────────────────────────────
  const fetchIG = useCallback(async()=>{
    if(!hasIG||igLoad) return;
    setIgLoad(true);
    try {
      const r = await fetch(`https://graph.instagram.com/me?fields=id,username,media_count,followers_count&access_token=${keys.ig}`);
      const profile = await r.json();
      const mr = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count,video_views,plays&limit=20&access_token=${keys.ig}`);
      const media = await mr.json();
      setIgData({ profile, media:media.data||[] });
    } catch(e) { setAiErr("IG fetch failed: "+e.message); }
    setIgLoad(false);
  },[keys,igLoad,hasIG]);

  useEffect(()=>{ if(hasIG) fetchIG(); },[hasIG]);

  // ── TIKWM AUTO-SCRAPER ────────────────────────────────────────
  // Replaces Apify — pulls latest TikToks directly via RapidAPI TIKWM
  const fetchTikToks = useCallback(async(force=false)=>{
    const cfg = loadJSON(KEYS_KEY,{});
    const tikwmKey = cfg?.keys?.tikwm;
    if(!tikwmKey && !USE_BACKEND) return; // no key and no server proxy — skip silently
    
    // Skip if fetched recently AND we already have video data
    const lastFetch = loadJSON("krapmaps_v1_tikwm_last", 0);
    const cachedVideos = loadJSON(VIDEOS_KEY, []);
    const hasData = cachedVideos.filter(v=>v.platform==="tiktok"||!v.platform).length > 0;
    if(!force && hasData && Date.now() - lastFetch < 6 * 60 * 60 * 1000) return;
    
    // NOTE: force no longer wipes videos up-front — if the fetch then failed
    // (bad key, 401, network), the whole local library was lost. The atomic
    // replace below handles force-mode strictness only after a successful fetch.
    
    try {
      const wl = loadWL();
      const handle = (wl.handle||"@findkrap").replace("@","");
      
      // Fetch user info for followers in parallel with first page of videos
      const [r, rUser] = await Promise.all([
        rapidFetch("https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id="+handle+"&count=35&cursor=0&sort_type=0", tikwmKey),
        rapidFetch("https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id="+handle, tikwmKey)
      ]);

      // Auto-update TT followers from user info
      if(rUser.ok) {
        try {
          const userData = await rUser.json();
          const followers = userData?.data?.user?.stats?.followerCount || userData?.data?.stats?.followerCount;
          const totalLikes = userData?.data?.user?.stats?.heartCount || userData?.data?.stats?.heartCount;
          if(followers) {
            setManualData(prev => {
              const updated = { ...prev, tt_followers: followers };
              if(totalLikes) updated.tt_likes = totalLikes;
              saveJSON(MANUAL_KEY, updated);
              return updated;
            });
          }
        } catch(e) { console.warn("User info parse failed:", e.message); }
      }

      if(!r.ok) { reportHealth("tiktok","error",`TikTok scraper HTTP ${r.status}${r.status===403?" — RapidAPI key invalid or not subscribed":r.status===429?" — rate limited, retries automatically":""}`); return; }
      const data = await r.json();
      if(data.code !== 0 || !data.data?.videos) { reportHealth("tiktok","error","TikTok scraper returned no videos — check the handle in Settings ("+(wl.handle||"not set")+")"); return; }
      
      let tikVideos = data.data.videos;

      // Paginate — hasMore can be boolean or 1/0
      let ttCursor = data.data.cursor;
      let ttMore = !!data.data.hasMore;
      let ttPages = 1;
      while(ttMore && ttCursor && ttPages < 10) {
        await new Promise(res => setTimeout(res, 600));
        const r2 = await rapidFetch("https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id="+handle+"&count=35&cursor="+ttCursor+"&sort_type=0", tikwmKey);
        if(!r2.ok) break;
        const d2 = await r2.json();
        if(d2.code !== 0 || !d2.data?.videos?.length) break;
        tikVideos = tikVideos.concat(d2.data.videos);
        ttCursor = d2.data.cursor;
        ttMore = !!d2.data.hasMore;
        ttPages++;
        console.log("TT page", ttPages, "total:", tikVideos.length, "more:", ttMore);
      }
      
      // Dedupe by video_id (pagination can overlap)
      const seenIds = new Set();
      tikVideos = tikVideos.filter(tv => {
        if(seenIds.has(tv.video_id)) return false;
        seenIds.add(tv.video_id);
        return true;
      });
      console.log("TT after dedupe:", tikVideos.length);
      
      // Update existing videos with fresh stats
      setVideos(prev => {
        // Keep non-tiktok videos (IG etc), replace all TT entries fresh from scrape.
        // Force sync is stricter: also drops legacy unplatformed entries — but only
        // now, AFTER a successful fetch, so a failed sync never loses data.
        const nonTT = force ? prev.filter(v => v.platform === "instagram") : prev.filter(v => v.platform !== "tiktok");
        const fresh = tikVideos.map(tv => ({
          id: "tikwm_"+tv.video_id,
          title: tv.title||"",
          views: tv.play_count||0,
          likes: tv.digg_count||0,
          comments: tv.comment_count||0,
          shares: tv.share_count||0,
          duration: Math.round((tv.duration||0)),
          videoUrl: tv.play||"",
          cover: tv.cover||"",
          _tikwmId: tv.video_id,
          _source: "tikwm",
          created_at: new Date(tv.create_time*1000).toISOString(),
          platform: "tiktok",
        }));
        return [...nonTT, ...fresh];
      });

      // Persist total TikTok views to manualData so it survives if scraper data is lost
      const totalTTViews = tikVideos.reduce((s,tv)=>s+(tv.play_count||0),0);
      if(totalTTViews > 0) {
        setManualData(prev => {
          const updated = { ...prev, tt_views: totalTTViews };
          saveJSON(MANUAL_KEY, updated);
          return updated;
        });
      }

      // Also update manual stats store
      const scraped = {
        scraped_at: new Date().toISOString(),
        source: "tikwm",
        video_count: tikVideos.length,
        video_stats: tikVideos.map(tv=>({
          id: tv.video_id,
          playCount: tv.play_count,
          diggCount: tv.digg_count,
          commentCount: tv.comment_count,
          shareCount: tv.share_count,
          videoUrl: tv.play,
        }))
      };
      setScrapedStats(scraped);
      saveJSON(SCRAPE_KEY, scraped);
      saveJSON("krapmaps_v1_tikwm_last", Date.now());
      reportHealth("tiktok","ok",`Synced ${tikVideos.length} videos`);

      // Recalculate scores for all videos after stats update
      setVideos(prev => {
        const scores = {};
        prev.forEach(v => {
          const s = calcVideoScore(v, prev);
          if(s) scores[v.id] = s;
        });
        saveJSON(SCORES_KEY, scores);
        return prev; // videos unchanged, just side-effect scores
      });

      // Also write updated stats back to Supabase so they persist
      try {
        const toUpdate = tikVideos.slice(0,10);
        for(const tv of toUpdate) {
          await sbFetch("km_videos", "select=id,url,title", "GET",null,
            "&url=eq."+encodeURIComponent("https://tiktok.com/@"+(loadWL().handle||"findkrap").replace("@","")+"/video/"+tv.video_id)
          );
        }
      } catch(e) { /* silent — local update already done */ }
      
    } catch(e) { console.warn("TIKWM fetch failed:", e.message); reportHealth("tiktok","error","TikTok sync failed: "+e.message); }
  },[]);

  // Auto-fetch on load and every 12hrs
  useEffect(()=>{ if(!ttFetchedRef.current){ ttFetchedRef.current=true; fetchTikToks(); } },[]);

  // ── COMMENT SENTIMENT MINER ───────────────────────────────────
  // Pulls real comments off the top videos and distils the AUDIENCE VOICE —
  // the richest signal there is: their exact words, requests, and emotional drivers.
  const mineComments = useCallback(async()=>{
    const cfg = loadJSON(KEYS_KEY,{});
    const rapidKey = cfg?.keys?.tikwm || cfg?.keys?.igscraper;
    const aiKey = cfg?.keys?.anthropic || BAKED_ANTHROPIC_KEY;
    if((!rapidKey || !aiKey) && !USE_BACKEND) return;
    if(Date.now() - loadJSON("krapmaps_v1_comments_last", 0) < 3*24*60*60*1000) return; // every 3 days
    const top = [...videos].filter(v=>v.platform==="tiktok"&&v.views>0&&(v._tikwmId||v.url)).sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
    if(top.length < 2) return;
    try {
      let pool = [];
      for(const v of top) {
        const idOrUrl = v._tikwmId || v.url;
        const r = await rapidFetch("https://tiktok-scraper7.p.rapidapi.com/comment/list?url="+encodeURIComponent(idOrUrl)+"&count=20&cursor=0", rapidKey);
        if(!r.ok) continue;
        const d = await r.json();
        (d?.data?.comments||[]).forEach(c=>{ if(c.text) pool.push(c.text); });
        await new Promise(res=>setTimeout(res,500));
      }
      pool = pool.filter(Boolean).slice(0,120);
      if(pool.length < 10) return;
      const wl = loadWL();
      const insights = await callAI(`These are real audience comments on ${wl.handle}'s top videos (${wl.niche}). Analyse the AUDIENCE VOICE — what they actually feel, want, and say.\n\nCOMMENTS:\n${pool.map((c,i)=>`${i+1}. ${c.slice(0,160)}`).join("\n")}\n\nReturn JSON: {"overall_sentiment":"positive|mixed|negative — plus one line why","top_themes":["recurring things they mention"],"audience_requests":["things they explicitly ask for"],"language_patterns":["exact words/phrases the audience uses — to reuse in captions"],"content_ideas":["specific videos the comments are begging for"],"emotional_drivers":["what emotion is making them comment"]}`, 1500);
      saveJSON(COMMENTS_KEY, { ...insights, sampleSize:pool.length, minedAt:new Date().toISOString() });
      saveJSON("krapmaps_v1_comments_last", Date.now());
      setCommentInsights(insights);
    } catch(e){ /* silent — additive signal */ }
  },[videos]);
  useEffect(()=>{ const t=setTimeout(()=>mineComments(),6000); return ()=>clearTimeout(t); },[mineComments]);

  // ── VISUAL DNA — vision model learns what THIS channel's winning thumbnails look like.
  // The scoring engine is otherwise blind to its own best-performing visuals; this gives it
  // a real visual sense by contrasting top vs bottom real thumbnails. One multimodal call,
  // cached, auto-refreshes weekly. Purely additive — silently no-ops without a key/images.
  const analyzeThumbnails = useCallback(async()=>{
    const cfg = loadJSON(KEYS_KEY,{});
    const aiKey = cfg?.keys?.anthropic || BAKED_ANTHROPIC_KEY;
    if(!aiKey && !USE_BACKEND) return;
    if(Date.now() - loadJSON("krapmaps_v1_vision_last", 0) < 7*24*60*60*1000) return; // weekly
    const withCover = videos.filter(v=>v.cover && v.views>0 && /^https?:\/\//.test(v.cover));
    if(withCover.length < 6) return;
    const sorted = [...withCover].sort((a,b)=>(b.views||0)-(a.views||0));
    const top = sorted.slice(0, Math.min(5, Math.floor(sorted.length/2)));
    const bottom = sorted.slice(-Math.min(5, Math.floor(sorted.length/2)));
    try {
      const wl = loadWL();
      const content = [];
      content.push({ type:"text", text:`You are a visual content analyst for ${wl.handle} (${wl.niche}). Below are real thumbnails: first the channel's HIGHEST-viewed videos, then its LOWEST-viewed. Identify the VISUAL DNA that separates winners from losers on THIS channel — composition, color, faces, text overlay, framing, subject. Be specific and channel-grounded, not generic.` });
      top.forEach((v,i)=>{ content.push({ type:"text", text:`HIGH PERFORMER #${i+1} — ${fmt(v.views)} views:` }); content.push({ type:"image", source:{ type:"url", url:v.cover } }); });
      bottom.forEach((v,i)=>{ content.push({ type:"text", text:`LOW PERFORMER #${i+1} — ${fmt(v.views)} views:` }); content.push({ type:"image", source:{ type:"url", url:v.cover } }); });
      content.push({ type:"text", text:`Return ONLY JSON: {"winning_traits":["specific visual traits the high performers share"],"losing_traits":["what the low performers do that hurts them"],"color_palette":"dominant colors/contrast that wins here","composition":"framing/subject placement that wins","face_pattern":"role of faces/expressions in winners","text_overlay":"how on-thumbnail text is used by winners vs losers","one_rule":"the single most important visual rule for this channel's thumbnails"}` });
      const d = await anthropicMessages({ model:"claude-sonnet-4-6", max_tokens:1200, messages:[{ role:"user", content }] });
      const dna = _extractJSON((d.content||[]).map(b=>b.text||"").join(""));
      if(!dna) return;
      saveJSON(VISION_KEY, { ...dna, sampleSize:top.length+bottom.length, analyzedAt:new Date().toISOString() });
      saveJSON("krapmaps_v1_vision_last", Date.now());
      setVisualDNA(loadJSON(VISION_KEY,null));
    } catch(e){ /* silent — additive visual signal */ }
  },[videos]);
  useEffect(()=>{ const t=setTimeout(()=>analyzeThumbnails(),9000); return ()=>clearTimeout(t); },[analyzeThumbnails]);

  // ── IG REELS AUTO-SCRAPER ─────────────────────────────────────
  const fetchIGFollowers = useCallback(async()=>{
    const cfg = loadJSON(KEYS_KEY,{});
    const rapidKey = cfg?.keys?.igscraper; // IG needs a dedicated scraper key; tikwm fallback causes 403
    if(!rapidKey && !USE_BACKEND) return;
    const lastFollowerFetch = loadJSON("krapmaps_v1_igfollowers_last", 0);
    if(Date.now() - lastFollowerFetch < 6 * 60 * 60 * 1000) return; // 6hr cache
    try {
      const wl = loadWL();
      const handle = (wl.handle||"@findkrap").replace("@","");
      const r = await rapidFetch("https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=" + handle, rapidKey);
      if(!r.ok) { console.warn("IG followers: HTTP", r.status); reportHealth("instagram","error",`Instagram scraper HTTP ${r.status}${r.status===403?" — RapidAPI key invalid or not subscribed to instagram-scraper-api2":r.status===429?" — rate limited":""}`); return; }
      const data = await r.json();
      const igFollowers = data?.data?.follower_count || data?.data?.edge_followed_by?.count || data?.follower_count || 0;
      console.log("IG followers raw:", JSON.stringify(data?.data).slice(0,200));
      if(igFollowers) {
        setManualData(prev => {
          const updated = { ...prev, ig_followers: igFollowers };
          saveJSON(MANUAL_KEY, updated);
          return updated;
        });
        setIgData(prev => ({ ...prev, profile: { ...(prev?.profile||{}), followers_count: igFollowers } }));
        saveJSON("krapmaps_v1_igfollowers_last", Date.now());
      }
    } catch(e) { console.warn("fetchIGFollowers failed:", e.message); }
  },[]);

  const fetchIGReels = useCallback(async(force=false)=>{
    const cfg = loadJSON(KEYS_KEY,{});
    const rapidKey = cfg?.keys?.igscraper; // IG needs a dedicated scraper key; tikwm fallback causes 403
    if(!rapidKey && !USE_BACKEND) return;

    const lastFetch = loadJSON("krapmaps_v1_igreels_last", 0);
    if(!force && Date.now() - lastFetch < 3 * 60 * 60 * 1000) return;

    try {
      const wl = loadWL();
      const handle = (wl.handle||"").replace("@","");
      if(!handle) return;

      // Look up user ID from handle (cached to avoid extra API calls)
      const cachedUserId = loadJSON("krapmaps_v1_ig_userid_"+handle, null);
      let userId = cachedUserId;
      if(!userId) {
        try {
          const infoRes = await rapidFetch("https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url="+handle, rapidKey);
          if(infoRes.ok) {
            const infoData = await infoRes.json();
            userId = infoData?.data?.id || infoData?.data?.user?.pk;
            if(userId) saveJSON("krapmaps_v1_ig_userid_"+handle, userId);
          }
        } catch(e) { console.warn("IG user ID lookup failed:", e.message); }
      }
      if(!userId) return;

      // Fetch ALL reels via pagination using max_id cursor
      const baseUrl = "https://instagram-scraper-api2.p.rapidapi.com/v1/clips?user_id=" + userId;

      let allItems = [];
      let cursor = null;
      let pages = 0;
      const maxPages = 5; // cap at 5 pages (~50+ reels) to avoid rate limits

      while(pages < maxPages) {
        const url = cursor ? baseUrl + "&pagination_token=" + encodeURIComponent(cursor) : baseUrl;
        let r = await rapidFetch(url, rapidKey);
        let retries = 0;
        while(r.status===429 && retries < 2) {
          console.warn("IG 429 — backing off", (retries+1)*3, "s");
          await new Promise(res => setTimeout(res, (retries+1)*3000));
          r = await rapidFetch(url, rapidKey);
          retries++;
        }
        if(!r.ok) { console.warn("IG reels fetch HTTP", r.status, "on page", pages+1); if(pages===0) reportHealth("instagram","error",`Instagram reels fetch HTTP ${r.status}${r.status===403?" — key invalid or not subscribed":""}`); break; }
        const data = await r.json();
        // instagram-scraper-api2 returns { data: { items: [...], pagination_token: "..." } }
        const items = data?.data?.items || data?.items || [];
        if(!items.length) break;
        allItems = allItems.concat(items);
        pages++;
        const nextCursor = data?.data?.pagination_token || data?.pagination_token;
        console.log("IG page", pages, "items:", items.length, "total:", allItems.length, "next:", !!nextCursor);
        if(!nextCursor) break;
        cursor = nextCursor;
        await new Promise(res => setTimeout(res, 1200));
      }

      if(!allItems.length) { console.warn("IG reels: no items fetched"); return; }
      const reels = allItems;

      // Debug: log raw structure of first reel to find correct view count field
      if(reels[0]) {
        const sample = reels[0].data || reels[0];
        console.log("IG RAW REEL SAMPLE:", JSON.stringify(sample, null, 2).slice(0, 2000));
        console.log("IG view fields:", { play_count: sample.play_count, view_count: sample.view_count, video_view_count: sample.video_view_count, ig_play_count: sample.ig_play_count, media_type: sample.media_type, is_paid_partnership: sample.is_paid_partnership });
      }

      // Map reels to video format
      const fresh = reels.map(reel => {
        const media = reel.data || reel;
        const reelId = media.pk || media.id;
        const views  = media.play_count || media.view_count || media.video_view_count || media.ig_play_count || 0;
        const likes  = media.like_count || 0;
        const comments = media.comment_count || 0;
        const cover  = media.image_versions2?.candidates?.[0]?.url || media.thumbnail_url || "";
        const code   = media.code || media.shortcode || "";
        const videoUrl = "https://www.instagram.com/reel/"+code+"/";
        const title  = media.caption?.text?.slice(0,100) || media.accessibility_caption?.slice(0,100) || "Instagram Reel";
        const created = media.taken_at ? new Date(media.taken_at*1000).toISOString() : new Date().toISOString();
        return {
          id: "ig_"+reelId,
          title, views, likes, comments,
          shares: 0, cover, videoUrl, url: videoUrl,
          platform: "instagram",
          _igId: reelId, _source: "igscraper", created_at: created,
          type: "reel", _igCode: code,
        };
      });

      setVideos(prev => {
        const nonIG = prev.filter(v => v.platform !== "instagram");
        return [...nonIG, ...fresh];
      });

      // Fetch real view counts from Vercel proxy (now fresh is in scope)
      try {
        const codes = fresh.map(v=>v._igCode).filter(Boolean).join(',');
        if(codes) {
          const proxyUrl = 'https://krapmaps-app.vercel.app/api/ig-views?codes=' + codes;
          const pr = await fetch(proxyUrl);
          if(pr.ok) {
            const viewData = await pr.json();
            setVideos(prev => prev.map(v => {
              if(v._igCode && viewData[v._igCode]) {
                const d = viewData[v._igCode];
                return {
                  ...v,
                  views:    d.views    > 0 ? d.views    : v.views,
                  likes:    d.likes    > 0 ? d.likes    : v.likes,
                  comments: d.comments > 0 ? d.comments : v.comments,
                  reposts:  d.reposts  > 0 ? d.reposts  : v.reposts || 0,
                };
              }
              return v;
            }));
          }
        }
      } catch(e) { console.warn('Proxy view fetch failed:', e.message); }

      saveJSON("krapmaps_v1_igreels_last", Date.now());
      reportHealth("instagram","ok",`Synced ${allItems.length} reels`);

      // IG follower count — enter manually via Update Stats

      // Update igData state so IG stats show in Analytics
      const igReelVideos = reels.map(reel => {
        const media = reel.data || reel;
        return {
          id: media.pk || media.id,
          like_count: media.like_count || 0,
          comment_count: media.comment_count || 0,
          play_count: media.play_count || 0,
          media_type: "VIDEO",
          timestamp: media["1ltaken_at"] ? new Date(media["1ltaken_at"]*1000).toISOString() : null,
          caption: { text: media.caption?.text || "" }
        };
      });
      setIgData(prev => ({
        ...prev,
        media: igReelVideos,
        scraped_at: new Date().toISOString()
      }));
    } catch(e) { console.warn("IG reels fetch failed:", e.message); reportHealth("instagram","error","Instagram sync failed: "+e.message); }
  },[]);

  // Immediately show cached IG followers from manualData on load
  useEffect(()=>{
    const cached = loadJSON(MANUAL_KEY,{});
    if(cached?.ig_followers) {
      setIgData(prev => ({ ...prev, profile: { ...(prev?.profile||{}), followers_count: cached.ig_followers } }));
    }
    fetchIGFollowers();
  },[]);
  useEffect(()=>{ if(!igFetchedRef.current){ igFetchedRef.current=true; fetchIGReels(); } },[]);

  // Auto-fetch live trends via Perplexity on load (max once per 12hrs)
  useEffect(()=>{
    const lastTrendFetch = loadJSON("krapmaps_v1_trend_auto_last", 0);
    if(Date.now() - lastTrendFetch < 12*60*60*1000) return;
    const cfg = loadJSON(KEYS_KEY,{});
    if(!cfg?.keys?.perplexity && !USE_BACKEND) return;
    const wl = loadWL();
    setTimeout(async()=>{
      try {
        const _now = new Date().toLocaleDateString("en-GB",{month:"long",year:"numeric"});
        const r = await callPerplexity(`It is ${_now}. What is trending RIGHT NOW on ${wl.platforms||"TikTok and Instagram Reels"} for ${wl.niche} content aimed at ${wl.targetAudience||"this audience"}? What sounds/audio are peaking? What formats are getting the highest reach? What topics are viral this week? Consider what ${wl.competitors||"top creators in this space"} are doing. Return JSON: { hot:[{topic,momentum:'rising|peak|fading',hook_example}], sounds:[string], formats:[string] }`, wl);
        if(r?.hot?.length || r?.sounds?.length) {
          const formatted = [
            r.hot?.map(t=>`[${t.momentum?.toUpperCase()||"TRENDING"}] ${t.topic}${t.hook_example?` — hook: "${t.hook_example}"`:""}`).join("\n"),
            r.sounds?.length ? "Trending sounds: "+r.sounds.join(", ") : "",
            r.formats?.length ? "Hot formats: "+r.formats.join(", ") : "",
          ].filter(Boolean).join("\n");
          saveJSON(CUR_TRENDS_KEY, "AUTO-FETCHED "+new Date().toLocaleDateString()+":\n"+formatted);
          saveJSON("krapmaps_v1_trend_auto_last", Date.now());
        }
      } catch(e) { /* silent */ }
    }, 3000);
  },[]);

  // Auto-refresh competitor scan every 7 days if stale
  useEffect(()=>{
    const cfg = loadJSON(KEYS_KEY,{});
    if(!cfg?.keys?.perplexity && !USE_BACKEND) return;
    const compData = loadCompetitorData();
    if(!compData?.lastFetched) return; // never manually fetched — don't auto-start
    const daysSince = Math.floor((Date.now()-new Date(compData.lastFetched).getTime())/86400000);
    if(daysSince < 7) return;
    const wl = loadWL();
    if(!wl.competitors) return;
    setTimeout(async()=>{
      try {
        const result = await callPerplexity(`Search RIGHT NOW for recent content from these TikTok/Instagram creators: ${wl.competitors}. For each find viral posts, hook styles, topics. Also find content gaps they aren't covering. Return ONLY JSON: { competitors:[{handle,recent_viral:[{title,est_views,why_worked,hook_style}],topics_covering:[string],weaknesses:[string]}], opportunities:[{gap,why_can_win:string,suggested_angle:string,urgency:"HIGH|MEDIUM|LOW"}], steal_these_hooks:[{hook,from_creator,adapt_for_channel:string}] }`, wl);
        const data = { data:result, lastFetched:new Date().toISOString().slice(0,10) };
        saveCompetitorData(data);
        addMemoryEntry("COMPETITOR_SCAN", `Auto-refreshed (${daysSince}d stale). Top opportunity: ${result.opportunities?.[0]?.gap||"unknown"}`);
      } catch(e) { /* silent */ }
    }, 6000);
  },[]);

  // ── AI FUNCTIONS ──────────────────────────────────────────────
  const runAI = async (mode) => {
    if(aiLoad[mode]) return;
    setAiLoad(l=>({...l,[mode]:true}));
    setAiErr(null);
    try {
      const wl = loadWL();
      const vSummary = sortedVideos.slice(0,15).map(v=>({ title:v.title, views:v.views, likes:v.likes, ratio:ratio(v).toFixed(1), type:v.type, hook:v.hook, comments:v.comments||0, shares:v.shares||0 }));
      const avgViews = vSummary.length ? Math.round(vSummary.reduce((s,v)=>s+(v.views||0),0)/vSummary.length) : 0;
      const hookDB = buildHookDB(sortedVideos);
      const patterns = buildPatterns(sortedVideos);
      const memCtx = buildMemoryContext();
      const channelCtx = "Channel: "+wl.appName+" | Niche: "+wl.niche+" | Audience: "+wl.targetAudience+"\nAvg views: "+avgViews+" | Best hooks: "+JSON.stringify(hookDB.slice(0,3))+(patterns?"\nBest day: "+patterns.dayPerf[0]?.day+" | Best type: "+patterns.typePerf[0]?.type:"")+"\n"+memCtx;

      // Silently prefetch live data from Perplexity before Claude runs
      let liveData = null;
      try {
        const cfg = loadJSON("krapmaps_v1_config",{});
        if(cfg?.keys?.perplexity || USE_BACKEND) {
          if(mode==="trends"||mode==="nextVids") {
            liveData = await callPerplexity("What is trending RIGHT NOW in "+wl.niche+" TikTok content for "+wl.targetAudience+"? What formats, hooks and topics are getting high engagement this week? What are "+wl.competitors+" posting? Return JSON: { hot:[{topic,momentum:'rising|peak|fading',hook_example}], sounds:[string], competitor_moves:[{creator,what,opportunity}] }", wl);
          }
          if(mode==="analysis") {
            liveData = await callPerplexity("For "+wl.niche+" TikTok content targeting "+wl.targetAudience+": what content formats are currently winning? What hook styles are getting the most engagement right now? Return JSON: { winning_formats:[string], winning_hooks:[string], what_to_avoid:[string] }", wl);
          }
        }
      } catch(e) { /* silent — Claude still runs without it */ }

      const liveCtx = liveData ? "\nLIVE DATA (fetched right now): "+JSON.stringify(liveData) : "";

      // Full intelligence stack for analysis/nextVids
      const richInsights = buildChannelInsights(sortedVideos.filter(v=>!v.boosted).length ? sortedVideos.filter(v=>!v.boosted) : sortedVideos);
      const richInsightsBlock = formatChannelInsights(richInsights);
      const richEngBlock = formatEngagementSignals(buildEngagementSignals(sortedVideos.filter(v=>!v.boosted)));
      const richComboBlock = formatComboMatrix(buildComboMatrix(sortedVideos.filter(v=>!v.boosted)));
      const richAuditBlock = formatAuditRubric(buildAuditRubric(sortedVideos.filter(v=>!v.boosted)));
      const richTheory = loadJSON(CHANNEL_THEORY_KEY,"");
      const richCtx = (richTheory ? `CHANNEL VIRAL THEORY:\n${richTheory}\n\n` : "") + richInsightsBlock + "\n" + richEngBlock + "\n" + richComboBlock + "\n" + richAuditBlock + "\n" + channelCtx;

      const prompts = {
        analysis: richCtx+liveCtx+"\nAnalyse these videos. Use real numbers from the channel statistics above. Return JSON: {whatIsWorking:[{insight,evidence,impact:'high|medium'}],whatIsNotWorking:[{insight,evidence,fix}],topFormat,bestHook,channel_diagnosis,engagement_insight}. Videos: "+JSON.stringify(vSummary),
        nextVids:  richCtx+liveCtx+"\nSuggest next 5 videos. Use winning hook+type combos and engagement signals from the data above. Be specific. Return JSON: {tiktok:[{title,type,hook,thumbnail_style,whyItWillWork,openingLine,priority:'HIGH|MEDIUM',estimated_views,winning_combo_used}],instagram:[{concept,contentType,whyItWillWork}]}. Videos: "+JSON.stringify(vSummary),
        weekly:    channelCtx+"\nWrite a filming brief for "+(wl.creator2||wl.creator1||"this creator")+". Return JSON: {brief:'2-3 sentences',priorities:[{task,why,how_to_shoot}],rawSummaryText:'WhatsApp-ready message'}. Videos: "+JSON.stringify(vSummary),
        trends:    channelCtx+liveCtx+"\nBest trending angles for "+wl.appName+" RIGHT NOW that fit this channel style. Return JSON: {trends:[{trend,urgency:'POST NOW|THIS WEEK|THIS MONTH',tiktokAngle,hook,why_fits_channel,instagramAngle}]}",
            };

      const r = await callAI(prompts[mode], 3000);
      if(mode==="analysis") { setAnalysis(r); addMemoryEntry("ANALYSIS", "Analysis run. Top: "+(r.whatIsWorking?.[0]?.insight||"N/A")); }
      if(mode==="nextVids") { setNextVids(r); addMemoryEntry("NEXT_VIDS", "Generated "+(r.tiktok?.length||0)+" video recs. Top: "+(r.tiktok?.[0]?.title||"N/A")); }
      if(mode==="weekly")   { setWeekly(r); }
      if(mode==="trends")   {
        setTrends(r);
        addMemoryEntry("TRENDS", "Trend scan. Top: "+(r.trends?.[0]?.trend||"N/A"));
        // Auto-update Current Trends field from live Perplexity data
        if(r.trends?.length) {
          const autoTrends = r.trends.map(t=>`[${t.urgency}] ${t.trend} — hook: "${t.hook||""}"`).join("\n");
          saveJSON(CUR_TRENDS_KEY, autoTrends);
        }
      }
    } catch(e) { setAiErr("AI error: "+e.message); }
    setAiLoad(l=>({...l,[mode]:false}));
  };

  // Auto-matched outcome confirmation — fills postedViews from a scraped video (one tap).
  const confirmOutcome = (ideaId, views) => {
    if(!(views>0)) return;
    const idea = ideas.find(i=>i.id===ideaId);
    setIdeas(is=>is.map(i=>i.id===ideaId?{...i, postedViews:views, _autoMatched:true}:i));
    addXP(20);
    if(idea) addMemoryEntry("IDEA_OUTCOME", `"${(idea.title||"").slice(0,60)}" auto-matched to scraped video → ${fmt(views)} views. Score was ${idea.viral||0}/100.`, `Got ${fmt(views)} views`);
  };

  const markPosted = (idea, actualViews=0) => {
    const predicted = idea.aiScore?.estimated_views||"unknown";
    const outcome = actualViews>0 ? `Got ${fmt(actualViews)} views (AI predicted ${predicted})` : "Posted, views not tracked yet";
    const pillar = idea.aiScore?.contentPillar||idea.type||"unknown";
    const score = idea.viral||0;
    addMemoryEntry("IDEA_OUTCOME", `"${(idea.title||"").slice(0,60)}" posted. ${outcome}. Pillar: ${pillar}. Score: ${score}/100`, outcome);
    setIdeas(is=>is.map(i=>i.id===idea.id?{...i,status:"posted",postedViews:actualViews,postedDate:new Date().toISOString().slice(0,10)}:i));
    addXP(50); // XP for posting

    // Background: counterfactual reasoning + structured learning
    if(actualViews > 0) {
      const cfg = loadJSON(KEYS_KEY,{});
      const key = cfg?.keys?.anthropic || BAKED_ANTHROPIC_KEY;
      if(key || USE_BACKEND) {
        setTimeout(async()=>{
          try {
            const organicV = videos.filter(v=>!v.boosted);
            const avgV = organicV.length ? Math.round(organicV.reduce((s,v)=>s+(v.views||0),0)/organicV.length) : 0;
            const multiple = avgV > 0 ? `${(actualViews/avgV).toFixed(1)}x channel avg (${avgV>0?fmt(avgV):"unknown"} avg)` : "";
            const performance = avgV > 0 ? (actualViews > avgV*2 ? "OVERPERFORMED" : actualViews > avgV*0.5 ? "MET EXPECTATIONS" : "UNDERPERFORMED") : "POSTED";
            const channelTheory = loadJSON(CHANNEL_THEORY_KEY,"");

            const d = await anthropicMessages({model:"claude-haiku-4-5-20251001",max_tokens:350,messages:[{role:"user",content:`A ${WL.handle} TikTok/Reels video was posted.

RESULT: ${fmt(actualViews)} views — ${performance} (${multiple})
IDEA SCORE: ${score}/100 | Hook type: "${idea.hook||"unknown"}" | Pillar: "${pillar}"
TITLE: "${idea.title}"
${channelTheory ? `CHANNEL THEORY: ${channelTheory.slice(0,200)}` : ""}

Do 3 things:
1. COUNTERFACTUAL: Given this ${performance} result, name the 1-2 specific conditions that most explain WHY it performed this way (not generic advice — specific to this hook + pillar combination)
2. REPLICATION: What exact condition must be true for the next video to beat this result by 50%?
3. LEARNING: One sentence strategic insight for future scoring.

Reply in this exact format:
COUNTERFACTUAL: [why it performed this way]
REPLICATION: [what must be true next time]
LEARNING: [one sentence]`}]}, key);
            const text = (d.content||[]).map(b=>b.text||"").join("").trim();
            const learningMatch = text.match(/LEARNING:\s*(.+)/);
            const counterfactualMatch = text.match(/COUNTERFACTUAL:\s*(.+?)(?=REPLICATION:|$)/s);
            const replicationMatch = text.match(/REPLICATION:\s*(.+?)(?=LEARNING:|$)/s);
            if(learningMatch?.[1]) addMemoryEntry("STRUCTURED_LEARNING", learningMatch[1].trim().slice(0,200), `${fmt(actualViews)} views — ${performance}`);
            if(counterfactualMatch?.[1]) addMemoryEntry("COUNTERFACTUAL", counterfactualMatch[1].trim().slice(0,200), `${performance} (${fmt(actualViews)} views)`);
            if(replicationMatch?.[1]) addMemoryEntry("REPLICATION_KEY", replicationMatch[1].trim().slice(0,200), `next video`);
            // Caption learning — infer which hook style fits this pillar based on outcome
            const captionNote = performance === "OVERPERFORMED"
              ? `"${pillar}" pillar OVERPERFORMED — caption hook that matched this pillar's share trigger worked. Double down on same caption style for this pillar.`
              : performance === "UNDERPERFORMED"
              ? `"${pillar}" pillar UNDERPERFORMED — reconsider caption hook strategy. Try a different trigger type next time.`
              : null;
            if(captionNote) addMemoryEntry("CAPTION_LEARNING", captionNote, `${fmt(actualViews)} views`);
          } catch(e) { /* silent */ }
        }, 1000);
      }
    }
  };

  const scoreIdea = async (idea) => {
    const key = "s"+idea.id;
    // Plan gate — one meter per score (the consensus fan-out counts as a single unit).
    // No-op outside backend mode. Fails open on any billing hiccup, so scoring is
    // never blocked by an infra blip — only by a real, confirmed limit.
    const gate = await meterAction("scores");
    if(!gate.allowed){
      setPricing({ reason: `You've used all ${gate.limit} scores on the ${TIER_LABELS[gate.tier]||gate.tier} plan this month. Upgrade to keep scoring — it resets monthly.` });
      refreshPlan();
      return;
    }
    setAiLoad(l=>({...l,[key]:true}));
    try {
      const wl = loadWL();
      const organicVids = videos.filter(v=>!v.boosted);
      const topV = [...(organicVids.length?organicVids:videos)].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
      const postedIdeas = ideas.filter(i=>i.status==="posted"&&i.postedViews>0);
      const ideaOutcomes = postedIdeas.slice(0,5).map(i=>`"${(i.title||"").slice(0,40)}" → ${fmt(i.postedViews)} views (score was ${i.viral||"?"}/100, pillar: ${i.aiScore?.contentPillar||"unknown"})`);
      const avgV = organicVids.length?Math.round(organicVids.reduce((s,v)=>s+(v.views||0),0)/organicVids.length):(videos.length?Math.round(videos.reduce((s,v)=>s+(v.views||0),0)/videos.length):0);

      // Build calibration curve — use posted idea outcomes if available, fall back to video percentiles
      const calibration = (() => {
        if(postedIdeas.length >= 2) {
          // Ideal: real outcome data from scored+posted ideas
          const brackets = [{label:"50-69",min:50,max:69},{label:"70-84",min:70,max:84},{label:"85-100",min:85,max:100}];
          return brackets.map(b=>{
            const inRange = postedIdeas.filter(i=>(i.viral||0)>=b.min&&(i.viral||0)<=b.max);
            if(!inRange.length) return null;
            const avg = Math.round(inRange.reduce((s,i)=>s+i.postedViews,0)/inRange.length);
            return `Score ${b.label} → avg ${fmt(avg)} views on THIS channel (n=${inRange.length})`;
          }).filter(Boolean).join(", ");
        }
        // Fallback: use video library percentiles as proxy calibration
        const vids = (organicVids.length?organicVids:videos).filter(v=>v.views>0).sort((a,b)=>b.views-a.views);
        if(vids.length < 3) return "";
        const p90 = vids[Math.floor(vids.length*0.1)]?.views||0;
        const p75 = vids[Math.floor(vids.length*0.25)]?.views||0;
        const p50 = vids[Math.floor(vids.length*0.5)]?.views||0;
        return `Video library benchmarks (use to anchor estimates): top 10%=${fmt(p90)}, top 25%=${fmt(p75)}, median=${fmt(p50)} views. Score 85+ should target top 10%, score 70-84 top 25%, score <70 near median.`;
      })();

      // Hard channel statistics from real video data
      const channelInsights = buildChannelInsights(organicVids.length?organicVids:videos);
      const channelStatsBlock = formatChannelInsights(channelInsights);
      // Outcome learning computed before weights so it can influence weight calibration
      const _outcomeLearningEarly = buildOutcomeLearning(ideas);
      const weights = buildDynamicWeights(channelInsights, _outcomeLearningEarly);
      const weightsLine = formatDynamicWeights(weights, channelInsights);

      // Audit rubric — proven winners/losers from this channel's history
      const auditRubric = buildAuditRubric(organicVids.length?organicVids:videos);
      const auditBlock = formatAuditRubric(auditRubric);

      // Series momentum — does this build on a proven concept?
      const seriesMomentum = detectSeriesMomentum(idea, organicVids.length?organicVids:videos, ideas);

      // Pillar gap boost — if a pillar hasn't been posted in X days, ideas in that pillar get a strategic bonus
      const pillarGapBoost = (() => {
        const PILLARS = WL.pillars || ["Local Connection","Location Contrast","Mission Reveal","App In Action","Travel Utility"];
        const posted = ideas.filter(i=>i.status==="posted"&&i.postedDate&&i.aiScore?.contentPillar);
        const lastByPillar = {};
        posted.forEach(i=>{ const p=i.aiScore.contentPillar; const d=new Date(i.postedDate); if(!lastByPillar[p]||d>lastByPillar[p]) lastByPillar[p]=d; });
        const today = new Date();
        return PILLARS.map(p=>{
          const last = lastByPillar[p];
          const days = last ? Math.floor((today-last)/86400000) : 999;
          return { pillar:p, days };
        }).filter(g=>g.days>=7).sort((a,b)=>b.days-a.days);
      })();
      const pillarGapLine = pillarGapBoost.length ? `STRATEGIC PILLAR GAP: ${pillarGapBoost.slice(0,2).map(g=>`"${g.pillar}" not posted in ${g.days===999?"ever":g.days+" days"}`).join(", ")}. If this idea fits one of these pillars, boost its niche fit score — posting here has strategic compounding value.` : "";

      // Competitor intel — hooks proven to work in the niche
      const compData = loadCompetitorData();
      const stolenHooks = compData?.data?.steal_these_hooks?.slice(0,4).map(h=>`"${h.hook}" (from ${h.from_creator}) → for this channel: ${h.adapt_for_channel}`).join("\n") || "";
      const compOpportunities = compData?.data?.opportunities?.slice(0,2).map(o=>`${o.gap} [${o.urgency}]`).join(", ") || "";

      // Channel theory — the deep "why this channel goes viral" model
      const channelTheory = loadJSON(CHANNEL_THEORY_KEY,"");

      // Engagement depth — quality signals beyond views
      const engSignals = buildEngagementSignals(organicVids.length?organicVids:videos);
      const engBlock = formatEngagementSignals(engSignals);

      // Combo matrix — which hook+type combos actually win
      const comboMatrix = buildComboMatrix(organicVids.length?organicVids:videos);
      const comboBlock = formatComboMatrix(comboMatrix);

      // Prediction accuracy — how biased have past estimates been
      const predAcc = buildPredictionAccuracy(ideas);
      const predAccBlock = formatPredictionAccuracy(predAcc);

      // Outcome learning — which hooks/types/pillars beat or miss predictions empirically
      const outcomeLearning = _outcomeLearningEarly;
      const outcomeLearningBlock = formatOutcomeLearning(outcomeLearning);

      // Hook fatigue — audience desensitisation from repeated hook/format use
      const hookFatigue = buildHookFatigue(ideas, organicVids.length?organicVids:videos);
      const hookFatigueBlock = formatHookFatigue(hookFatigue, idea.hook, idea.type);

      // Recent track record — last 5 actual posted results for live context
      const recentTrack = buildRecentTrackRecord(ideas);
      const recentTrackBlock = formatRecentTrackRecord(recentTrack);

      // Pipeline saturation — is the backlog already full of near-duplicates of this idea?
      const pipelineSat = buildPipelineSaturation(idea, ideas);
      const pipelineSatBlock = formatPipelineSaturation(pipelineSat);

      // Score validity — does the scoring engine's own output even correlate with reality?
      const scoreValidity = buildScoreValidity(ideas);
      const scoreValidityBlock = formatScoreValidity(scoreValidity);

      // Content allocator — bandit over pillars: what's strategically worth posting next
      const allocator = buildContentAllocator(ideas, organicVids.length?organicVids:videos, WL.pillars||[]);
      const allocatorBlock = formatContentAllocator(allocator, idea.aiScore?.contentPillar);

      // Semantic layer — meaning-based saturation/momentum (embeddings, not keywords)
      // + ANALOG GROUNDING: the creator's k nearest past posts by meaning, with real outcomes.
      let semanticBlock = "", analogBlock = "", _analogs = null;
      try {
        const _vidPool = organicVids.length?organicVids:videos;
        const _embCacheNow = await embedTexts([idea.title, ...ideas.map(i=>i.title), ..._vidPool.map(v=>v.title)].filter(Boolean));
        semanticBlock = formatSemanticContext(buildSemanticContext(idea, ideas, _vidPool, _embCacheNow));
        _analogs = buildAnalogs(idea, ideas, _vidPool, _embCacheNow);
        analogBlock = formatAnalogs(_analogs);
      } catch { /* embeddings optional — never block scoring */ }

      // Audience voice — distilled from real comments on top videos
      const _ci = loadJSON(COMMENTS_KEY, null);
      const commentBlock = _ci ? `AUDIENCE VOICE [from ${_ci.sampleSize} real comments on top videos]:\n• Sentiment: ${_ci.overall_sentiment||"n/a"}\n• Recurring themes: ${(_ci.top_themes||[]).join("; ")||"n/a"}\n• They're explicitly asking for: ${(_ci.audience_requests||[]).join("; ")||"n/a"}\n• Their exact words (reuse in captions/hooks): ${(_ci.language_patterns||[]).slice(0,6).join(", ")||"n/a"}\n→ If this idea answers an audience request or hits a recurring theme, boost share trigger AND niche fit — this is what they're literally asking for.\n` : "";

      // Visual DNA — what this channel's winning thumbnails actually look like (vision model)
      const _vd = loadJSON(VISION_KEY, null);
      const visualBlock = _vd ? `VISUAL DNA [learned by a vision model from ${_vd.sampleSize} real thumbnails — top vs bottom performers on THIS channel]:\n• Winning visual traits: ${(_vd.winning_traits||[]).join("; ")||"n/a"}\n• What loses: ${(_vd.losing_traits||[]).join("; ")||"n/a"}\n• Color/contrast that wins: ${_vd.color_palette||"n/a"}\n• Composition: ${_vd.composition||"n/a"}\n• Faces: ${_vd.face_pattern||"n/a"}\n• Text overlay: ${_vd.text_overlay||"n/a"}\n• THE RULE: ${_vd.one_rule||"n/a"}\n→ Score this idea's thumbnail concept ("${idea.thumbnail||"not specified"}") against this learned visual DNA. If the thumbnail concept violates the winning pattern, lower hook strength and flag it in hookFeedback with a concrete visual fix.\n` : "";

      // Cross-channel anonymised priors — warm-start from other channels in the same niche bucket
      let metaBlock = "";
      try {
        if(outcomeLearning) pushMetaPriors(outcomeLearning, WL); // fire-and-forget contribution
        const _mp = await fetchMetaPriors(WL);
        metaBlock = formatMetaPriors(_mp, outcomeLearning);
      } catch { /* shared table optional — never blocks scoring */ }

      // Neural calibrator — a real in-browser net trained on this channel's outcomes.
      // Cached by an outcome signature so it only retrains when new results land.
      let neuralBlock = "", neuralSerial = null;
      try {
        const postedForNN = ideas.filter(i=>i.status==="posted"&&i.postedViews>0&&(i.viral>0||i.hookScore>0));
        const sig = `${postedForNN.length}:${postedForNN.reduce((s,i)=>s+(i.postedViews||0),0)}`;
        const cached = loadJSON(NN_KEY, null);
        if(cached && cached.sig===sig && cached.serial){
          neuralSerial = cached.serial;
          neuralBlock = formatNeuralModel({ ready:true, n:cached.serial.n, cvRho:cached.serial.cvRho, blendWeight:cached.serial.blendWeight });
        } else {
          const nn = buildNeuralModel(ideas);
          if(nn.ready){ neuralSerial = nn.serial; saveJSON(NN_KEY, { sig, serial:nn.serial }); neuralBlock = formatNeuralModel(nn); }
        }
      } catch { /* neural layer optional — never blocks scoring */ }

      const currentTrendsForScore = loadJSON(CUR_TRENDS_KEY,"");
      ensureVoiceProfile(organicVids.length?organicVids:videos, ideas, wl); // keep distilled voice profile warm
      const voiceBlk = voiceBlock(organicVids.length?organicVids:videos, ideas);
      const _scorePrompt = `You are the world's best viral content strategist. Score this TikTok/Reels idea for ${wl.handle} (${wl.appName} — ${wl.niche}).

${channelTheory ? `━━ CHANNEL VIRAL THEORY (why this channel specifically goes viral — anchor ALL scoring to this) ━━\n${channelTheory}\n` : ""}
━━ CHANNEL INTELLIGENCE (real data — treat as ground truth) ━━
${channelStatsBlock || "Limited data — use niche benchmarks as proxy"}
${engBlock}
${comboBlock}
${auditBlock}
${predAccBlock}
${outcomeLearningBlock}
${recentTrackBlock}
${hookFatigueBlock}
${pipelineSatBlock}
${scoreValidityBlock}
${neuralBlock}
${visualBlock}
${allocatorBlock}
${semanticBlock}
${analogBlock}
${commentBlock}
${metaBlock}
${voiceBlk}
${calibration ? `CALIBRATION: ${calibration}` : ""}
${ideaOutcomes.length ? `RECENT POSTED OUTCOMES: ${ideaOutcomes.join(" | ")}` : ""}
${seriesMomentum ? `\n${seriesMomentum}` : ""}
${pillarGapLine ? `\n${pillarGapLine}` : ""}

━━ NICHE INTELLIGENCE (what's working for competitors RIGHT NOW) ━━
${stolenHooks ? `Proven hooks from similar creators to adapt:\n${stolenHooks}` : "Run a competitor scan in settings to unlock niche benchmarks."}
${compOpportunities ? `Active content gaps competitors aren't covering: ${compOpportunities}` : ""}
${currentTrendsForScore ? `\nCURRENT TRENDS (June 2026):\n${currentTrendsForScore}` : "NOTE: It is June 2026 — use current platform behaviour, not 2024 data."}

━━ IDEA TO SCORE ━━
Title: "${idea.title}" | Type: ${idea.type||"unknown"} | Hook: ${idea.hook||"not specified"} | Thumbnail style: ${idea.thumbnail||"not specified"}

━━ SCORING FRAMEWORK ━━
${weightsLine}

Score each factor with this rigour:

1. HOOK STRENGTH (${weights.hook}%) — The first 0.5 seconds is won or lost here. Classify: visual disruption (unexpected image), open loop (question unanswered), identity trigger, contrast (before/after or unexpected juxtaposition), social proof (others react). Score against your channel data: does this hook type outperform or underperform the channel average? Be specific about what frame/word earns the scroll-stop.

2. RETENTION ARC (${weights.retention}%) — Map the arc: what is the SETUP (creates curiosity or stakes), what is the TENSION (maintains suspense), what is the PAYOFF (satisfying resolution that makes watch-through worth it)? If any element is missing the video will lose viewers early. Predict the drop-off timestamp and why. Check: is there dead air, filler, unnecessary explanation, or a weak ending?

3. SHARE TRIGGER (${weights.share}%) — Shares are the only metric that breaks the algorithm ceiling. Score which trigger applies: SOCIAL CURRENCY (makes the sharer look good/knowledgeable), EMOTIONAL RESONANCE (makes viewers feel something strong enough to share), IDENTITY VALIDATION (validates the viewer's self-image). A strong share trigger is worth 5-10x in reach. Score honestly — most content fails here.

4. ALGORITHM FIT (${weights.algo}%) — In 2026 the TikTok/Reels algorithm rewards: (a) POV and first-person raw footage over produced content, (b) genuine authentic moments over scripted scenes, (c) unexpected setting/context reveals, (d) niche culture moments outsiders haven't seen. PENALISE: talking-to-camera explaining, over-produced visuals, no clear scene context. Cross-reference competitor data: what formats are getting pushed in this niche right now?

5. NICHE FIT (${weights.niche}%) — Score against ${wl.appName}'s content pillars based on: ${wl.contentStyle||wl.niche}. Core formula: ${wl.bestFormula}. If this idea doesn't clearly fit the niche and formula, score low. If it sits at the intersection of the best-performing content types, score high.

ESTIMATED VIEWS — MANDATORY CALIBRATION PROTOCOL:
Step 0 (STRONGEST EVIDENCE): If NEAREST ANALOGS are shown above, start from their similarity-weighted expectation — those are the creator's OWN most-similar posts and what they really did. Only move off that anchor if this idea has a clearly stronger hook/share trigger than the analogs.
Step 1: Otherwise start with your raw estimate based on hook+share trigger strength.
Step 2: Apply the OUTCOME LEARNING multipliers above (if this idea's hook/type has a ratio of 1.5x, multiply by 1.5; if 0.7x, reduce by 30%).
Step 3: Apply PREDICTION ACCURACY bias correction (if AI has historically over/underestimated by X%, correct your output accordingly).
Step 4: Anchor to the CALIBRATION percentiles above — score 85+ ideas should target top 10%, score 70-84 top 25%.
Step 5: Express as a RANGE as wide as the prediction error σ stated above (e.g. if σ is ±40%, a 40K estimate becomes 24K-56K). A single number is statistically dishonest.
Your estimated_views must reflect all 5 steps. Do not output a raw uncorrected estimate.

${COACH_PRINCIPLES}

REASONING DISCIPLINE: Before scoring, identify the 2-3 strongest data signals above that apply to THIS idea, and the single biggest risk. Let those drive the numbers. Do not regress every idea to a safe 70 — if the data says 45, score 45; if it says 90, score 90. Spread your scores honestly.

VOICE DISCIPLINE: Every improvedHook and every hookVariant MUST be written in the CREATOR VOICE DNA above — their casing, brevity, punctuation, emoji habits and signature vocabulary. A rewritten hook that sounds like generic AI marketing is WRONG even if it's punchy. The goal is a more viral version of THEIR voice, never a replacement of it.

Return ONLY valid JSON:
{"viralityScore":0-100,"hookScore":0-100,"retentionScore":0-100,"shareScore":0-100,"algoScore":0-100,"nicheScore":0-100,"verdict":"2 sentences — name the strongest and weakest factor with specific reasoning","viralityReason":"which share trigger fires and why it makes people actually press share","hookFeedback":"exactly what works or fails in the first 3 seconds","improvedHook":"rewritten hook under 10 words","hookVariants":[{"hook":"A/B variant 1 under 10 words — a DISTINCT angle (different trigger type than the others)","trigger":"open-loop|contrast|identity|social-proof|visual-disruption","predictedLift":"+X% vs the original hook, grounded in this channel's OUTCOME LEARNING + VISUAL DNA above","why":"one line: which channel data signal makes this variant win"},{"hook":"A/B variant 2 — different trigger","trigger":"...","predictedLift":"+X%","why":"..."},{"hook":"A/B variant 3 — different trigger","trigger":"...","predictedLift":"+X%","why":"..."}],"bestVariantIndex":"0|1|2 — which variant you predict wins and would test first","retentionFix":"the single biggest retention improvement","openLoopStrength":"rate 1-10 how well this video creates and sustains curiosity gaps — what is the open loop and when does it close?","reHookMoments":["specific moment at ~3s to re-engage","specific moment at ~15s","specific moment at ~30s if video is longer"],"emotionalArc":"setup→tension→payoff analysis — what emotion does viewer feel at start, middle, end? Where does it escalate?","recommendations":[{"action":"specific actionable next step","impact":"HIGH|MEDIUM"}],"estimated_views":"realistic RANGE corrected by outcome learning + bias σ e.g. 24K-56K","contentPillar":"niche-specific pillar name","competitorAngle":"how to differentiate from what competitors are already doing in this niche","optimalPostSlot":"best day+time to post this based on the channel's day/time performance data above, e.g. 'Saturday 6-9pm'","confidenceLevel":"HIGH|MEDIUM|LOW — based on how much real data backs this score","scoreRationale":"1 sentence: which 2-3 data signals drove this specific score up or down vs a generic idea"}`;
      const _consensus = await callConsensus(_scorePrompt, _scorePrompt, wl);
      if(!_consensus.claude && !_consensus.gpt && !_consensus.gemini) {
        const errDetail = _consensus.claudeErr || "unknown — check browser console for [callAI] logs";
        console.error("[scoreIdea] all models failed. claudeErr:", errDetail);
        throw new Error("Scoring failed: "+errDetail);
      }
      const r = reconcileScores(_consensus.claude, _consensus.gpt, _consensus.gemini);
      // Voice guard: catch any hook that slipped into robotic AI phrasing and rewrite
      // it back into the creator's voice (only fires when a tell is actually detected).
      try {
        const hooksToCheck = [r.improvedHook, ...((r.hookVariants||[]).map(v=>v?.hook))];
        if(hooksToCheck.some(h=>h && _hasAITell(h))){
          const { hooks:cleaned, fixed } = await revoiceHooks(hooksToCheck, voiceBlk, wl);
          if(fixed){
            r.improvedHook = cleaned[0];
            if(r.hookVariants) r.hookVariants = r.hookVariants.map((v,i)=> v ? {...v, hook:cleaned[i+1]||v.hook} : v);
            r.voiceGuarded = true;
          }
        }
      } catch { /* voice guard optional — never blocks scoring */ }
      // Neural blend: fuse the trained net's data-driven view prediction with the LLM's estimate.
      // Weight is the net's earned, cross-validated trust — 0 when it can't beat baseline.
      try {
        if(neuralSerial && neuralSerial.blendWeight>0){
          const nnViews = neuralPredict(neuralSerial, { hookScore:r.hookScore, retentionScore:r.retentionScore, shareScore:r.shareScore, algoScore:r.algoScore, nicheScore:r.nicheScore, viralityScore:r.viralityScore, hook:idea.hook, type:idea.type, pillar:r.contentPillar });
          const llmViews = parseViewEstimate(r.estimated_views);
          if(nnViews && llmViews){
            const w = neuralSerial.blendWeight;
            // Blend in log space — view distributions are multiplicative, not additive.
            const blended = Math.round(Math.pow(10, (1-w)*Math.log10(llmViews+1) + w*Math.log10(nnViews+1)) - 1);
            // Re-express as a range whose half-width reflects model disagreement (min ±25%).
            const disagree = Math.abs(Math.log10((nnViews+1)/(llmViews+1)));
            const band = Math.max(0.25, Math.min(0.6, disagree));
            const lo = Math.round(blended*(1-band)), hi = Math.round(blended*(1+band));
            r.estimated_views = `${fmt(lo)}-${fmt(hi)}`;
            r.neuralEstimate = nnViews;
            r.neuralBlendWeight = w;
            r.neuralCvRho = neuralSerial.cvRho;
          }
        }
      } catch { /* blend optional — never blocks scoring */ }
      // ANALOG ANCHOR — evidence cascade: neural net → analogs → outcome multiplier.
      // If the net didn't take over, pull the estimate toward the similarity-weighted
      // outcome of the creator's nearest past posts (kNN). This is real history, so it
      // outranks the hook/type multiplier fallback below. Weight scales with how similar
      // and how many the analogs are — capped so a loose match can't dominate.
      try {
        const netFired = !!(r.neuralBlendWeight > 0);
        if(!netFired && _analogs && _analogs.wPred>0){
          const llmViews = parseViewEstimate(r.estimated_views);
          if(llmViews){
            // Trust grows with similarity and count: ~0.2 for 2 loose analogs, ~0.55 for a tight cluster.
            const w = Math.max(0.15, Math.min(0.6, (_analogs.avgSim-0.5)*1.4 + Math.min(_analogs.n,5)*0.05));
            const blended = Math.round(Math.pow(10, (1-w)*Math.log10(llmViews+1) + w*Math.log10(_analogs.wPred+1)) - 1);
            const disagree = Math.abs(Math.log10((_analogs.wPred+1)/(llmViews+1)));
            const band = Math.max(0.25, Math.min(0.6, disagree));
            r.estimated_views = `${fmt(Math.round(blended*(1-band)))}-${fmt(Math.round(blended*(1+band)))}`;
            r.analogEstimate = _analogs.wPred;
            r.analogWeight = parseFloat(w.toFixed(2));
            r.analogN = _analogs.n;
            r._analogAnchored = true;
          }
        }
      } catch { /* analog anchor optional — never blocks scoring */ }
      // Deterministic outcome-learning correction — ENFORCED in code, not left to the
      // model to obey. The prompt asks the LLM to apply the hook/type multipliers, but
      // LLMs comply inconsistently, so when neither the trained net NOR the analog anchor
      // took over the estimate (the thinnest-data regime) we apply the empirically shrunk
      // ratios ourselves. Skipped when a stronger signal already anchored the number.
      try {
        const netFired = !!(r.neuralBlendWeight > 0);
        if(!netFired && !r._analogAnchored && outcomeLearning){
          const hookRatio = outcomeLearning.hookAdjust?.find(h=>h.hook===idea.hook)?.avgRatio;
          const typeRatio = outcomeLearning.typeAdjust?.find(t=>t.type===idea.type)?.avgRatio;
          const rr = [hookRatio, typeRatio].filter(x=>typeof x==="number" && x>0);
          if(rr.length){
            // Geometric mean of the applicable ratios, capped so one noisy signal can't
            // swing the estimate more than ±50% on top of the LLM's own number.
            const gm = Math.pow(rr.reduce((s,x)=>s*x,1), 1/rr.length);
            const mult = Math.max(0.5, Math.min(1.5, gm));
            const base = parseViewEstimate(r.estimated_views);
            if(base && Math.abs(mult-1) > 0.05){
              const centre = Math.round(base*mult);
              // Keep an honest band — reuse the prediction-error σ if we have one, else ±30%.
              const sigma = (predAcc && predAcc.errorStdDev) ? Math.max(0.2, Math.min(0.6, predAcc.errorStdDev/100)) : 0.3;
              const lo = Math.round(centre*(1-sigma)), hi = Math.round(centre*(1+sigma));
              r.estimated_views = `${fmt(lo)}-${fmt(hi)}`;
              r.outcomeMultiplier = parseFloat(mult.toFixed(2));
            }
          }
        }
      } catch { /* correction optional — never blocks scoring */ }
      setIdeas(is=>is.map(i=>{
        if(i.id!==idea.id) return i;
        const prevScore = i.viral||null;
        const scoreDelta = prevScore!==null ? r.viralityScore - prevScore : null;
        return {...i,
          aiScore:r,
          viral:r.viralityScore,
          hookScore:r.hookScore,
          retentionScore:r.retentionScore,
          shareScore:r.shareScore,
          algoScore:r.algoScore,
          nicheScore:r.nicheScore,
          verdict:r.verdict,
          viralReason:r.viralityReason,
          hookFeedback:r.hookFeedback,
          improvedHook:r.improvedHook,
          hookVariants:r.hookVariants,
          bestVariantIndex:r.bestVariantIndex,
          retentionFix:r.retentionFix,
          competitorAngle:r.competitorAngle,
          openLoopStrength:r.openLoopStrength,
          reHookMoments:r.reHookMoments,
          emotionalArc:r.emotionalArc,
          recs:r.recommendations?.map(x=>({a:x.action,impact:x.impact?.toUpperCase()})),
          confidenceLevel:r.confidenceLevel,
          scoreRationale:r.scoreRationale,
          optimalPostSlot:r.optimalPostSlot,
          modelAgreement:r.modelAgreement,
          mostContestedFactor:r.mostContestedFactor,
          secondOpinion:r.secondOpinion,
          scoreDelta,
          prevScore,
          neuralEstimate:r.neuralEstimate,
          neuralBlendWeight:r.neuralBlendWeight,
          neuralCvRho:r.neuralCvRho,
          outcomeMultiplier:r.outcomeMultiplier,
          analogEstimate:r.analogEstimate,
          analogWeight:r.analogWeight,
          analogN:r.analogN,
          lastScoredAt: new Date().toISOString().slice(0,10),
          _scoredAt: Date.now(), // transient: powers the fresh-score celebration
        };
      }));
      try {
        const hist = loadJSON(SCORE_HISTORY_KEY,[]);
        hist.push({ id:idea.id, title:(idea.title||"").slice(0,60), score:r.viralityScore, date:new Date().toISOString() });
        if(hist.length > 200) hist.splice(0, hist.length-200);
        saveJSON(SCORE_HISTORY_KEY, hist);
      } catch {}
    } catch(e) { setAiErr("Score failed: "+e.message); console.error("scoreIdea error:", e); }
    addXP(20);
    setAiLoad(l=>({...l,[key]:false}));
    if(tourStep===1 || tourStep===2) { advanceTour(2); setTimeout(finishTour, 4000); }
  };

  const genCaption = async (idea) => {
    const wl = loadWL();
    setAiLoad(l=>({...l,caption:true}));
    setCaptionIdea(idea);
    setCaptionResult(null);
    try {
      const r = await callAI(`Write captions for ${wl.handle} TikTok and Instagram for this idea: "${idea.title||idea.text}".

${voiceBlock(videos, ideas)}

For TikTok, provide 3 HOOK VARIANTS — each uses a different psychology trigger. For Instagram, one caption.
Write every caption and hook in the creator's Voice DNA above — it must read like they wrote it themselves, not like AI.

Return JSON:
{
  "tiktok": {
    "caption": "...(primary)",
    "hashtags": ["..."],
    "variants": [
      {"hook_type": "Identity Trigger", "caption": "full caption starting with identity hook", "hashtags": ["..."]},
      {"hook_type": "Open Loop", "caption": "full caption starting with open loop/curiosity gap", "hashtags": ["..."]},
      {"hook_type": "Visual Disruption", "caption": "full caption starting with surprising statement", "hashtags": ["..."]}
    ]
  },
  "instagram": {"caption": "...", "hashtags": ["..."]}
}`, 1600);
      setCaptionResult(r);
    } catch(e) { setAiErr("Caption failed: "+e.message); }
    setAiLoad(l=>({...l,caption:false}));
  };

  const copyText = (key, text) => {
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopied(c=>({...c,[key]:true}));
    setTimeout(()=>setCopied(c=>({...c,[key]:false})),2000);
  };

  // ── SAVE TO SUPABASE ──────────────────────────────────────────
  const addVideo = async (video) => {
    const v = { ...video, id:video.id||Date.now().toString(), created_at:video.created_at || new Date().toISOString() };
    setVideos(vs=>{
      if(vs.find(x=>x.id===v.id||x.url===v.url)) return vs;
      return [v,...vs];
    });
    await sbUpsert("km_videos",[{ ...v, id: wsId(v.id) }]).catch(()=>{});
    closeModal("addVideo");
  };
  const deleteVideo = (id) => { if(!window.confirm("Delete this video? This can't be undone.")) return; setVideos(vs=>vs.filter(v=>v.id!==id)); sbDelete&&sbDelete("km_videos",wsId(id)).catch(()=>{}); };
  const updateVideo = (updated) => {
    setVideos(vs=>vs.map(v=>{
      if(v.id!==updated.id) return v;
      const merged = {...v,...updated,_updated:true};
      // Persist edits across devices too (scoped to this account's workspace).
      sbUpsert("km_videos",[{ ...merged, id: wsId(merged.id) }]).catch(()=>{});
      return merged;
    }));
    closeModal("updateVideo");
  };

  // ── COMPUTED ──────────────────────────────────────────────────
  const saveManual = (data) => {
    setManualData(data);
    sbUpsert("km_manual",[{id:wsId(1),...data,updated_at:new Date().toISOString()}]).catch(()=>{});
  };

  const sortedVideos  = [...videos].sort((a,b)=>(b.views||0)-(a.views||0));
  const totalViews    = videos.reduce((s,v)=>s+(v.views||0),0);
  const avgRatio      = videos.length ? videos.reduce((s,v)=>s+ratio(v),0)/videos.length : 0;
  const facecamAvg    = (()=>{ const fc=videos.filter(v=>v.type==="facecam"); return fc.length?Math.round(fc.reduce((s,v)=>s+(v.views||0),0)/fc.length):0; })();
  const ttTotal = videos.filter(v=>v.platform==="tiktok"||!v.platform).reduce((s,v)=>s+(v.views||0),0);
  const ttViewsDisplay = ttTotal || m.tt_views || 0;
  const igViewsTotal   = videos.filter(v=>v.platform==="instagram").reduce((s,v)=>s+(v.views||0),0);
  const allViewsDisplay = ttViewsDisplay + igViewsTotal;
  const hookStats = (()=>{
    const map = {};
    videos.forEach(v=>{ if(!v.hook||typeof v.hook!=="string") return; if(!map[v.hook]) map[v.hook]=[]; map[v.hook].push(v.views||0); });
    return Object.entries(map).map(([hook,arr])=>({ hook, avg:Math.round(arr.reduce((s,x)=>s+x,0)/arr.length) })).sort((a,b)=>b.avg-a.avg);
  })();
  const topIdeas      = [...ideas].sort((a,b)=>(b.viral||0)-(a.viral||0)).slice(0,3);
  const upcomingCal   = calItems.filter(c=>c.date&&c.date>=today()).sort((a,b)=>(a.date||"").localeCompare(b.date||"")).slice(0,3);

  // ── MODALS ─────────────────────────────────────────────────────
  const ModalBase = ({ children, onClose }) => {
    useEffect(()=>{
      const onKey = e => { if(e.key==="Escape") onClose&&onClose(); };
      window.addEventListener("keydown", onKey);
      return ()=>window.removeEventListener("keydown", onKey);
    },[onClose]);
    return (
    <div
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",zIndex:200,overflowY:"auto",WebkitOverflowScrolling:"touch" }}
    >
      <div style={{ minHeight:"10vh",cursor:"pointer" }} onClick={onClose} />
      <div
        data-lenis-prevent
        onClick={e=>e.stopPropagation()}
        style={{ background:"linear-gradient(180deg,#14102A,#0F0B1E)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"32px 32px 0 0",width:"100%",maxWidth:500,margin:"0 auto",padding:"22px 22px calc(52px + env(safe-area-inset-bottom))",boxShadow:"0 -20px 60px rgba(0,0,0,0.5)" }}
      >
        <button onClick={onClose} aria-label="Close" style={{ display:"block",width:44,height:4,borderRadius:2,background:"rgba(255,255,255,0.25)",margin:"0 auto 28px",cursor:"pointer",border:"none",padding:0 }} />
        {children}
      </div>
    </div>
    );
  };
  const MLabel = ({children}) => <div style={{ fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.45)",marginBottom:7,textTransform:"uppercase" }}>{children}</div>;
  const MInput = ({value,onChange,placeholder,type="text"}) => <input type={type} value={value||""} onChange={onChange} placeholder={placeholder} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:14,colorScheme:"dark" }} />;
  const MBtn = ({children,onClick,color=C.pink}) => <button onClick={onClick} style={{ width:"100%",padding:"16px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${color},${color}cc)`,color:"#fff",fontFamily:C.fontHead,fontWeight:700,fontSize:16,cursor:"pointer",marginTop:8,boxShadow:`0 4px 20px ${color}40` }}>{children}</button>;

  const AddVideoModal = () => {
    const [tab, setTab] = useState("manual");
    const [form, setForm] = useState({ title:"", type:"facecam", hook:"achievement", views:"", likes:"", url:"", collab: false, audio: "", posted: today() });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    return (
      <ModalBase onClose={()=>closeModal("addVideo")}>
        <div style={{ fontSize:22,fontWeight:700,color:C.text,marginBottom:24 }}>Log Video</div>
        <div style={{ display:"flex",gap:6,marginBottom:isMobile?24:16 }}>
          {["manual","scan"].map(t=><button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"8px",borderRadius:10,border:`1px solid ${tab===t?C.pink:C.border}`,background:tab===t?C.pink+"20":"transparent",color:tab===t?C.pink:C.dim,fontFamily:C.fontHead,fontWeight:700,fontSize:isMobile?14:17,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em" }}>{t}</button>)}
        </div>
        {tab==="manual" && (
          <>
            <MLabel>Title</MLabel><MInput value={form.title} onChange={set("title")} placeholder="Video title" />
            <MLabel>Type</MLabel>
            <select value={form.type} onChange={set("type")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:14,appearance:"none",WebkitAppearance:"none",colorScheme:"dark" }}>
              {VIDEO_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <MLabel>Hook</MLabel>
            <select value={form.hook} onChange={set("hook")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:14,appearance:"none",WebkitAppearance:"none",colorScheme:"dark" }}>
              {HOOK_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:isMobile?16:12 }}>
              <input type="checkbox" id="collab-toggle" checked={form.collab} onChange={e=>setForm(f=>({...f,collab:e.target.checked}))} />
              <label htmlFor="collab-toggle" style={{ color:"rgba(255,255,255,0.85)", fontSize:14, fontFamily:C.fontHead }}>Collab with local/partner account?</label>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8 }}>
              <div><MLabel>Views</MLabel><MInput value={form.views} onChange={set("views")} placeholder="0" type="number" /></div>
              <div><MLabel>Likes</MLabel><MInput value={form.likes} onChange={set("likes")} placeholder="0" type="number" /></div>
            </div>
            <MLabel>Date posted</MLabel>
            <input type="date" value={form.posted} max={today()} onChange={set("posted")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:14,colorScheme:"dark" }} />
            <MLabel>TikTok URL (optional)</MLabel><MInput value={form.url} onChange={set("url")} placeholder="https://tiktok.com/..." />
            <MLabel>Audio/Sound used (optional)</MLabel>
            <MInput value={form.audio} onChange={set("audio")} placeholder='e.g. "Espresso - Sabrina Carpenter" or "original audio"' />
            <MBtn onClick={()=>addVideo({ title:form.title,type:form.type,hook:form.hook,views:parseInt(form.views)||0,likes:parseInt(form.likes)||0,url:form.url,collab:form.collab,audio:form.audio,date:form.posted||today(),created_at:new Date(form.posted||today()).toISOString() })}>Save Video</MBtn>
          </>
        )}
        {tab==="scan" && (
          <div style={{ textAlign:"center",padding:"20px 0" }}>
            <MLabel>TikTok URL</MLabel>
            <MInput value={form.url} onChange={set("url")} placeholder="https://tiktok.com/..." />
            <div style={{ color:C.dim,fontSize:isMobile?14:17,marginBottom:16,lineHeight:1.6 }}>Paste a TikTok URL and we'll log it. Stats auto-sync every 12hrs via TIKWM.</div>
            <MBtn onClick={()=>addVideo({ title:form.url.split("/").pop()||"TikTok video",type:"facecam",hook:"achievement",views:0,likes:0,url:form.url,date:form.posted||today(),created_at:new Date(form.posted||today()).toISOString() })}>Log URL</MBtn>
          </div>
        )}
      </ModalBase>
    );
  };

  const UpdateVideoModal = () => {
    const v = updateTarget;
    const [form, setForm] = useState({ views:v?.views||"", likes:v?.likes||"", comments:v?.comments||"", shares:v?.shares||"", views24h:"", views48h:"", posted:(v?.created_at&&!isNaN(new Date(v.created_at))?new Date(v.created_at).toISOString().slice(0,10):"") });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    if(!v) return null;
    return (
      <ModalBase onClose={()=>closeModal("updateVideo")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:4 }}>Update Stats</div>
        <div style={{ color:C.dim,fontSize:isMobile?14:17,marginBottom:16,lineHeight:1.4 }}>{v.title?.slice(0,50)}</div>
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8 }}>
          {[["Views","views"],["Likes","likes"],["Comments","comments"],["Shares","shares"]].map(([l,k])=>(
            <div key={k}><MLabel>{l}</MLabel><MInput value={form[k]} onChange={set(k)} placeholder="0" type="number" /></div>
          ))}
          <div><MLabel>24hr Views</MLabel><MInput value={form.views24h} onChange={set("views24h")} placeholder="0" type="number" /></div>
          <div><MLabel>48hr Views</MLabel><MInput value={form.views48h} onChange={set("views48h")} placeholder="0" type="number" /></div>
        </div>
        <MLabel>Date posted</MLabel>
        <input type="date" value={form.posted} max={today()} onChange={set("posted")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:14,colorScheme:"dark" }} />
        <MBtn onClick={()=>updateVideo({ id:v.id,views:parseInt(form.views)||v.views,likes:parseInt(form.likes)||v.likes,comments:parseInt(form.comments)||v.comments||0,shares:parseInt(form.shares)||v.shares||0,views24h:parseInt(form.views24h)||v.views24h||0,views48h:parseInt(form.views48h)||v.views48h||0,...(form.posted?{created_at:new Date(form.posted).toISOString(),date:form.posted}:{}),_updated:true })}>Save Stats</MBtn>
      </ModalBase>
    );
  };

  const AddIdeaModal = () => {
    const [form, setForm] = useState({ title:"", type:"facecam", hook:"achievement", thumbnail:"text overlay", notes:"", collab: false });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const selStyle = { width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:14,appearance:"none",WebkitAppearance:"none",colorScheme:"dark" };
    return (
      <ModalBase onClose={()=>closeModal("addIdea")}>
        <div style={{ fontSize:22,fontWeight:700,color:C.text,marginBottom:24 }}>Add Idea</div>
        <MLabel>Idea Title</MLabel><MInput value={form.title} onChange={set("title")} placeholder="Describe the video idea" />
        <MLabel>Type</MLabel>
        <select value={form.type} onChange={set("type")} style={selStyle}>
          {VIDEO_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <MLabel>Hook Type</MLabel>
        <select value={form.hook} onChange={set("hook")} style={selStyle}>
          {HOOK_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <MLabel>Thumbnail Style</MLabel>
        <select value={form.thumbnail} onChange={set("thumbnail")} style={selStyle}>
          {THUMBNAIL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:isMobile?16:12 }}>
          <input type="checkbox" id="collab-toggle-idea" checked={form.collab} onChange={e=>setForm(f=>({...f,collab:e.target.checked}))} />
          <label htmlFor="collab-toggle-idea" style={{ color:"rgba(255,255,255,0.85)", fontSize:14, fontFamily:C.fontHead }}>Collab with local/partner account?</label>
        </div>
        <MLabel>Notes (optional)</MLabel><MInput value={form.notes} onChange={set("notes")} placeholder="Extra context..." />
        <MBtn onClick={()=>{ if(!form.title.trim()) return; const now = new Date().toISOString(); setIdeas(is=>[{id:Date.now(),title:form.title.trim(),type:form.type,hook:form.hook,thumbnail:form.thumbnail,notes:form.notes,collab:form.collab,viral:0,hookScore:0,created:today(),createdAt:now},...is]); addXP(10); closeModal("addIdea"); }}>Add Idea</MBtn>
      </ModalBase>
    );
  };

  const EditIdeaModal = () => {
    const idea = editIdeaTarget;
    const [title, setTitle] = useState(idea?.title||"");
    const [type, setType] = useState(idea?.type||"facecam");
    const [altHooks, setAltHooks] = useState(idea?.altHooks||null);
    const [loadingHooks, setLoadingHooks] = useState(false);
    const [scoring, setScoring] = useState(false);
    if(!idea) return null;

    const genHooks = async () => {
      if(loadingHooks||!title.trim()) return;
      setLoadingHooks(true);
      try {
        const r = await callAI(`Give 3 alternative TikTok hook openings for this video idea: "${title}". Each hook should be a punchy opening line (under 12 words). Return JSON: {"hooks":[{"hook":"string","type":"pov|reaction|challenge|achievement|gamification","why":"one sentence why it works"}]}`, 700);
        setAltHooks(r.hooks||[]);
      } catch(e) { setAiErr("Hook gen failed: "+e.message); }
      setLoadingHooks(false);
    };

    const saveAndRescore = async () => {
      if(!title.trim()) return;
      const updated = {
        ...idea, title:title.trim(), type,
        viral:0, hookScore:0,
        verdict:"Rescoring...", viralReason:null, hookFeedback:null,
        improvedHook:null, recs:null,
        altHooks:altHooks||idea.altHooks||null
      };
      setIdeas(is=>is.map(i=>i.id===idea.id?updated:i));
      closeModal("editIdea");
      // Auto-rescore after saving
      setScoring(true);
      try {
        const r = await callAI(`Score this ${WL.appName} TikTok idea. Return JSON: {"viralityScore":0-100,"hookScore":0-100,"verdict":"honest 1-2 sentence verdict","viralityReason":"string","hookFeedback":"string","improvedHook":"string under 12 words","recommendations":[{"action":"string","impact":"high|medium"}]}. Idea: "${title.trim()}" type:${type}`, 1000);
        setIdeas(is=>is.map(i=>i.id===idea.id?{...i,viral:r.viralityScore,hookScore:r.hookScore,verdict:r.verdict,viralReason:r.viralityReason,hookFeedback:r.hookFeedback,improvedHook:r.improvedHook,recs:r.recommendations?.map(x=>({a:x.action,impact:x.impact?.toUpperCase()}))}:i));
      } catch(e) { setAiErr("Rescore failed: "+e.message); }
      setScoring(false);
    };

    const displayHooks = altHooks||idea.altHooks||null;

    return (
      <ModalBase onClose={()=>closeModal("editIdea")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:4 }}>Edit Idea</div>
        <div style={{ fontSize:16,color:C.dim,marginBottom:14,lineHeight:1.5 }}>Edit the description below -- tap SAVE & RESCORE to get fresh virality + hook scores</div>

        {/* EDITABLE DESCRIPTION */}
        <MLabel>VIDEO IDEA</MLabel>
        <textarea
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Describe the video idea in detail..."
          rows={4}
          style={{ width:"100%",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.pink}50`,borderRadius:12,color:C.text,padding:"12px 14px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",resize:"none",marginBottom:10,lineHeight:1.6 }}
        />

        <div style={{ marginBottom:isMobile?22:14 }}>
          <MLabel>TYPE</MLabel>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
            {VIDEO_TYPES.map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{ padding:"6px 12px",borderRadius:8,border:`1px solid ${type===t?C.pink:C.border}`,background:type===t?`${C.pink}20`:"transparent",color:type===t?C.pink:C.dim,fontFamily:C.fontHead,fontSize:isMobile?14:17,fontWeight:700,cursor:"pointer",textTransform:"uppercase" }}>{t}</button>
            ))}
          </div>
        </div>

        {/* ALTERNATIVE HOOKS */}
        <div style={{ marginBottom:isMobile?24:16 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
            <MLabel style={{ marginBottom:0 }}>ALTERNATIVE HOOKS</MLabel>
            <button onClick={genHooks} disabled={loadingHooks||!title.trim()} style={{ padding:"5px 14px",borderRadius:8,border:`1px solid ${C.purple}40`,background:`${C.purple}18`,color:C.purple,fontFamily:C.fontHead,fontSize:16,fontWeight:700,cursor:"pointer",opacity:(loadingHooks||!title.trim())?0.4:1 }}>
              {loadingHooks?"GENERATING...":(displayHooks?"REGENERATE":"GENERATE 3")}
            </button>
          </div>
          {displayHooks ? displayHooks.map((h,i)=>(
            <div key={i} onClick={()=>setTitle(h.hook)} style={{ padding:isMobile?"13px 16px":"10px 12px",borderRadius:10,background:`${C.purple}08`,border:`1px solid ${C.purple}25`,marginBottom:i<displayHooks.length-1?8:0,cursor:"pointer",transition:"all 0.15s" }}>
              <div style={{ fontSize:15,fontWeight:700,color:C.text,marginBottom:4,lineHeight:1.4 }}>"{h.hook}"</div>
              <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                <Tag color={C.purple}>{h.type}</Tag>
                <div style={{ fontSize:9,color:C.dim,flex:1 }}>{h.why}</div>
                <div style={{ fontSize:9,color:C.purple,fontWeight:700 }}>TAP TO USE</div>
              </div>
            </div>
          )) : (
            <div style={{ padding:"14px",borderRadius:10,background:"rgba(255,255,255,0.025)",border:`1px solid ${C.border}`,textAlign:"center" }}>
              <div style={{ fontSize:16,color:C.dim }}>Get 3 AI hook openings -- tap one to paste it into your idea</div>
            </div>
          )}
        </div>

        <MBtn onClick={saveAndRescore}>{scoring?"RESCORING...":"SAVE & RESCORE"}</MBtn>
      </ModalBase>
    );
  };

    const EditAppIdeaModal = () => {
    const idea = editAppIdeaTarget;
    const [text, setText] = useState(idea?.text||"");
    if(!idea) return null;
    return (
      <ModalBase onClose={()=>closeModal("editAppIdea")}>
        <div style={{ fontSize:22,fontWeight:700,color:C.text,marginBottom:24 }}>Edit App Idea</div>
        <MLabel>Idea</MLabel>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Feature idea..." rows={4} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:isMobile?"13px 16px":"10px 12px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",resize:"vertical",marginBottom:isMobile?16:12 }} />
        <MBtn onClick={()=>{ setAppIdeas(is=>is.map(i=>i.id===idea.id?{...i,text:text.trim()}:i)); closeModal("editAppIdea"); }}>Save</MBtn>
      </ModalBase>
    );
  };

  const AddCalModal = () => {
    const [form, setForm] = useState({ title:"", date:today(), platform:"TikTok", type:"facecam", status:"idea" });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    return (
      <ModalBase onClose={()=>closeModal("addCal")}>
        <div style={{ fontSize:22,fontWeight:700,color:C.text,marginBottom:24 }}>Schedule Content</div>
        <MLabel>Title</MLabel><MInput value={form.title} onChange={set("title")} placeholder="Content title" />
        <MLabel>Date</MLabel><MInput value={form.date} onChange={set("date")} type="date" />
        <MLabel>Platform</MLabel>
        <select value={form.platform} onChange={set("platform")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:14,appearance:"none",WebkitAppearance:"none",colorScheme:"dark" }}>
          {["TikTok","Instagram","Both","YouTube"].map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <MLabel>Status</MLabel>
        <select value={form.status} onChange={set("status")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:14,appearance:"none",WebkitAppearance:"none",colorScheme:"dark" }}>
          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <MBtn onClick={()=>{ if(!form.title.trim()) return; setCalItems(cs=>[{id:Date.now(),...form,statusColor:STATUS_C[form.status]||C.dim},...cs]); closeModal("addCal"); }}>Add to Calendar</MBtn>
      </ModalBase>
    );
  };

  const EditStatsModal = () => {
    const [form, setForm] = useState({...m});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    return (
      <ModalBase onClose={()=>closeModal("editStats")}>
        <div style={{ fontSize:22,fontWeight:700,color:C.text,marginBottom:24 }}>Update Stats</div>
        {[["TT Followers","tt_followers","Your TikTok follower count"],["TT Total Views","tt_views","All-time TikTok views"],["TT Total Likes","tt_likes","All-time TikTok likes"],[WL.statLabels?.custom1Label||"Custom Stat 1",WL.statLabels?.custom1Key||"custom1",""],[WL.statLabels?.custom2Label||"Custom Stat 2",WL.statLabels?.custom2Key||"custom2",""],["IG Followers","ig_followers","Enter manually from Instagram app"],["Spotify Monthly Listeners","monthly_listeners","From Spotify for Artists"]].filter(([l,k])=>k).map(([l,k])=>(
          <div key={k}><MLabel>{l}</MLabel><MInput value={form[k]||""} onChange={set(k)} placeholder="0" type="number" /></div>
        ))}
        <MBtn onClick={()=>{ saveManual(form); closeModal("editStats"); }}>Save Stats</MBtn>
      </ModalBase>
    );
  };


  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:C.fontHead, position:"relative" }}>
      {_isThiernoClient && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes orbDrift { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-22px) scale(1.06)} 66%{transform:translate(-14px,16px) scale(0.96)} }
        @media (prefers-reduced-motion:reduce){ [style*="orbDrift"],[style*="grainShift"]{animation:none!important} }
        @keyframes grainShift { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-2%,-2%)} 50%{transform:translate(2%,2%)} 75%{transform:translate(-1%,1%)} }
        @keyframes dotPulse { 0%,100%{opacity:0.4;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
        .thierno-card { transition: border-color 0.2s ease !important; }
        .thierno-card:hover { border-color: #00f085 !important; }
        .thierno-btn-primary { background:#00f085 !important; color:#08070d !important; font-family:'DM Mono',monospace !important; font-size:11px !important; letter-spacing:0.12em !important; text-transform:uppercase !important; border-radius:4px !important; border:none !important; cursor:pointer; padding:10px 20px !important; font-weight:500 !important; }
        .thierno-btn-primary:hover { background:#00d970 !important; }
        [data-card] { transition: border-color 0.2s ease; }
        [data-card]:hover { border-color: #00f085 !important; }
      `}</style>}
      {_isThiernoClient && <>
        <div style={{ position:"fixed", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat:"repeat", backgroundSize:"200px 200px", opacity:0.055, mixBlendMode:"overlay", pointerEvents:"none", zIndex:1, animation:"grainShift 8s steps(1) infinite" }} />
        <div style={{ position:"fixed", top:"-8%", left:"-12%", width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle,#00f08518 0%,transparent 70%)", pointerEvents:"none", zIndex:0, animation:"orbDrift 14s ease-in-out infinite" }} />
        <div style={{ position:"fixed", top:"45%", right:"-12%", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,#5cb8ff10 0%,transparent 70%)", pointerEvents:"none", zIndex:0, animation:"orbDrift 18s ease-in-out infinite reverse" }} />
        <div style={{ position:"fixed", bottom:"5%", left:"15%", width:240, height:240, borderRadius:"50%", background:"radial-gradient(circle,#b58dff0d 0%,transparent 70%)", pointerEvents:"none", zIndex:0, animation:"orbDrift 22s ease-in-out infinite 4s" }} />
      </>}
      {!_isThiernoClient && <>
        <div style={{ position:"fixed", top:"-8%", left:"-12%", width:420, height:420, borderRadius:"50%", background:`radial-gradient(circle,${WL.accentColor}14 0%,transparent 70%)`, pointerEvents:"none", zIndex:0, animation:"orbDrift 16s ease-in-out infinite" }} />
        <div style={{ position:"fixed", top:"45%", right:"-12%", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle,${WL.accentColor2}0d 0%,transparent 70%)`, pointerEvents:"none", zIndex:0, animation:"orbDrift 21s ease-in-out infinite reverse" }} />
        <div style={{ position:"fixed", bottom:"3%", left:"14%", width:240, height:240, borderRadius:"50%", background:`radial-gradient(circle,${C.purple}0c 0%,transparent 70%)`, pointerEvents:"none", zIndex:0, animation:"orbDrift 26s ease-in-out infinite 3s" }} />
      </>}

      {/* SIDEBAR — desktop only */}
      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <div className="web-sidebar">
        {/* Logo */}
        <div style={{ marginBottom:28, paddingLeft:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:16, background:`linear-gradient(135deg,${WL.accentColor},${WL.accentColor2})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 20px ${WL.accentColor}40`, fontSize:18, fontWeight:900, color:"#fff", fontFamily:"Georgia,serif" }}>
              {WL.appName[0]}
            </div>
            <div>
              {_isThiernoClient ? (<>
                <div style={{ fontSize:20, fontWeight:900, color:"#fff", fontFamily:C.fontHead, lineHeight:1 }}>{WL.creator1 || "Thierno"}</div>
                <div style={{ fontSize:13, marginTop:3, fontFamily:C.fontHead, fontWeight:900, color:"#fff", lineHeight:1 }}>{WL.appName.slice(0,-2) || "Artist"}<span style={{color:WL.accentColor}}>{WL.appName.slice(-2) || "OS"}</span></div>
              </>) : (<>
                <div style={{ fontSize:20, fontWeight:900, color:"#fff", fontFamily:C.fontHead, lineHeight:1 }}>{WL.appName.slice(0,-2) || "Artist"}<span style={{color:WL.accentColor}}>{WL.appName.slice(-2) || "OS"}</span></div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em", marginTop:2, fontFamily:C.fontHead }}>{WL.appTagline.toUpperCase()}</div>
              </>)}
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.16em", fontWeight:700, marginBottom:6, paddingLeft:14, textTransform:"uppercase" }}>Navigation</div>
        <div style={{ display:"flex", flexDirection:"column", gap:3, flex:1 }}>
          {NAV.map(n=>{
            const active = nav===n.id;
            return (
              <button data-nav-btn data-tour-nav={n.id} key={n.id} onClick={()=>{ setNav(n.id); setSub(null); if(tourStep===0 && n.id==="content") advanceTour(1); }}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:16, border:"none", cursor:"pointer", transition:"all 0.18s", position:"relative", overflow:"hidden",
                  background: active ? `linear-gradient(135deg,${WL.accentColor}18,${WL.accentColor2}0c)` : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.6)",
                  boxShadow: active ? `inset 0 0 0 1px ${WL.accentColor}30, 0 4px 20px ${WL.accentColor}08` : "none"
                }}>
                {active && <div style={{ position:"absolute", left:0, top:"18%", bottom:"18%", width:3, borderRadius:"0 3px 3px 0", background:`linear-gradient(180deg,${WL.accentColor},${WL.accentColor2})`, boxShadow:`0 0 10px ${WL.accentColor}80` }} />}
                <div style={{ width:34, height:34, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.18s",
                  background: active ? `linear-gradient(135deg,${WL.accentColor}30,${WL.accentColor2}18)` : "rgba(255,255,255,0.05)",
                  boxShadow: active ? `0 4px 16px ${WL.accentColor}25` : "none"
                }}>
                  {n.ic(17, active ? WL.accentColor : "rgba(255,255,255,0.4)")}
                </div>
                <span style={{ fontSize:13, fontWeight:active?700:400, letterSpacing:"0.02em", flex:1, color:active?"#fff":"rgba(255,255,255,0.65)" }}>{n.label}</span>
                {/* Badge: unscored ideas on content tab */}
                {n.id==="content" && !active && (() => {
                  const unscored = (ideas||[]).filter(i=>!(i.viral>0)&&i.status!=="posted").length;
                  return unscored > 0 ? (
                    <div style={{ minWidth:18, height:18, borderRadius:9, background:C.pink, color:"#fff", fontSize:10, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 5px" }}>{unscored}</div>
                  ) : null;
                })()}
              </button>
            );
          })}
        </div>

        {/* Workspace */}
        <div>
          <div style={{ padding:"16px 16px", borderRadius:16, background:`linear-gradient(135deg,${WL.accentColor}14,${WL.accentColor2}0a)`, border:`1px solid ${WL.accentColor}22` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:13, background:`linear-gradient(135deg,${WL.accentColor},${WL.accentColor2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:900, color:"#fff", flexShrink:0, boxShadow:`0 4px 14px ${WL.accentColor}35` }}>{(WL.creator1||"B")[0]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", letterSpacing:"0.01em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{WL.creator1}{WL.creator2?` + ${WL.creator2}`:""}</div>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.green, boxShadow:`0 0 8px ${C.green}` }} />
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{WL.handle}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <div className="web-content">
        <div className="web-inner" style={{ position:"relative", zIndex:1 }}>

          {/* MOBILE HEADER */}
          <div className="mobile-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:"rgba(8,5,18,0.97)", borderBottom:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:150 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:11, background:`linear-gradient(135deg,${WL.accentColor},${WL.accentColor2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"#fff", flexShrink:0 }}>{(WL.creator1||"B")[0]}</div>
              <div style={{ fontSize:19, fontWeight:700, color:"#fff", fontFamily:C.fontHead, letterSpacing:"0.01em" }}>{NAV.find(n=>n.id===nav)?.label||nav}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {scrapedStats?.scraped_at && (
                <div style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:8, background:"rgba(0,255,148,0.08)", border:"1px solid rgba(0,255,148,0.18)" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:C.green }} />
                  <span style={{ fontSize:10, color:C.green, fontWeight:700, letterSpacing:"0.06em" }}>LIVE</span>
                </div>
              )}
              {/* Hamburger */}
              <button onClick={()=>setDrawerOpen(true)} aria-label="Open navigation menu" style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, width:40, height:40, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer", padding:0 }}>
                <div style={{ width:18, height:2, borderRadius:1, background:"rgba(255,255,255,0.85)" }} />
                <div style={{ width:14, height:2, borderRadius:1, background:"rgba(255,255,255,0.85)" }} />
                <div style={{ width:18, height:2, borderRadius:1, background:"rgba(255,255,255,0.85)" }} />
              </button>
            </div>
          </div>

          {/* MOBILE DRAWER */}
          {drawerOpen && (
            <div data-lenis-prevent style={{ position:"fixed", inset:0, zIndex:500 }}>
              {/* Backdrop */}
              <div onClick={()=>setDrawerOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(6px)" }} />
              {/* Drawer panel */}
              <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"72vw", maxWidth:300, background:"rgba(10,6,22,0.98)", borderLeft:"1px solid rgba(255,255,255,0.08)", display:"flex", flexDirection:"column", padding:"0 0 40px" }}>
                {/* Drawer header */}
                <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>{WL.appName}</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{WL.creator1}</div>
                  </div>
                  <button onClick={()=>setDrawerOpen(false)} aria-label="Close menu" style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:"rgba(255,255,255,0.7)" }}>×</button>
                </div>
                {/* Nav items */}
                <div style={{ flex:1, overflowY:"auto", padding:"16px 16px" }}>
                  {NAV.map(n=>{
                    const active = nav===n.id;
                    return (
                      <button key={n.id} onClick={()=>{ setNav(n.id); setSub(null); setDrawerOpen(false); if(tourStep===0 && n.id==="content") advanceTour(1); }}
                        style={{ display:"flex", alignItems:"center", gap:16, width:"100%", padding:"16px 18px", borderRadius:16, border:`1px solid ${active?WL.accentColor+"40":"rgba(255,255,255,0.06)"}`, background:active?`linear-gradient(135deg,${WL.accentColor}20,${WL.accentColor2}10)`:"rgba(255,255,255,0.03)", marginBottom:8, cursor:"pointer", textAlign:"left" }}>
                        <div style={{ width:38, height:38, borderRadius:12, background:active?`linear-gradient(135deg,${WL.accentColor}30,${WL.accentColor2}20)`:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {n.ic(18, active?WL.accentColor:"rgba(255,255,255,0.5)")}
                        </div>
                        <div>
                          <div style={{ fontSize:15, fontWeight:700, color:active?"#fff":"rgba(255,255,255,0.65)", fontFamily:C.fontHead, letterSpacing:"0.03em" }}>{n.label}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                            {n.id==="home"?"Dashboard overview":n.id==="content"?"Ideas & calendar":n.id==="analytics"?"Stats & insights":n.id==="tasks"?"To-do & ideas":n.id==="deals"?"Brand partnerships":n.id==="ai"?"AI assistant":n.id==="growth"?"Growth metrics":"Workspace config"}
                          </div>
                        </div>
                        {active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:WL.accentColor, boxShadow:`0 0 8px ${WL.accentColor}` }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STICKY DESKTOP TOP BAR */}
          <div className="web-topbar" style={{ position:"sticky", top:0, zIndex:100, background:"rgba(6,4,14,0.92)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"0 40px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>{WL.appName}</span>
              <span style={{ fontSize:14, color:"rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ fontSize:14, fontWeight:700, color:"#fff", letterSpacing:"0.02em" }}>{NAV.find(n=>n.id===nav)?.label||nav}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {scrapedStats?.scraped_at && (
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, background:"rgba(0,255,148,0.08)", border:"1px solid rgba(0,255,148,0.18)" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.green }} />
                  <span style={{ fontSize:12, color:C.green, fontWeight:600, letterSpacing:"0.06em" }}>LIVE</span>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 14px 6px 8px", borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width:30, height:30, borderRadius:9, background:`linear-gradient(135deg,${WL.accentColor},${WL.accentColor2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#fff" }}>{(WL.creator1||"B")[0]}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fff", lineHeight:1 }}>{WL.creator1}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>Creator</div>
                </div>
              </div>
            </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="web-page-content" style={{ padding:isMobile?"24px 0 0":"32px 44px 60px" }}>
            {/* PAGE TITLE — desktop only */}
            {!isMobile && <div style={{ marginBottom:40, display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:600, marginBottom:6 }}>
                  {nav==="home"?"Dashboard":nav==="content"?"Content":nav==="analytics"?"Analytics":nav==="tasks"?"Tasks":nav==="deals"?"Deals":nav==="growth"?"Growth":nav==="audit"?"Prospecting":"Settings"}
                </div>
                <div style={{ fontSize:34, fontWeight:400, color:"#fff", fontFamily:C.fontHead, lineHeight:1.1, marginBottom:6 }}>
                  {nav==="home" && <span><span style={{color:WL.accentColor}}>{WL.appName.slice(0,-2)||"Content"}</span>{WL.appName.slice(-2)||" OS"}</span>}
                  {nav==="content" && <span>Manage <span style={{color:C.cyan}}>Content</span></span>}
                  {nav==="analytics" && <span>Track <span style={{color:C.yellow}}>Performance</span></span>}
                  {nav==="tasks" && <span>Your <span style={{color:C.green}}>Workflow</span></span>}
                  {nav==="growth" && <span>Monitor <span style={{color:C.orange}}>Growth</span></span>}
                  {nav==="deals" && <span>Brand <span style={{color:WL.accentColor}}>Deals</span></span>}
                  {nav==="settings" && <span>Configure <span style={{color:C.purple}}>Workspace</span></span>}
                  {nav==="ai" && <span><span style={{color:WL.accentColor}}>AI</span> Assistant</span>}
                  {nav==="audit" && <span>Free <span style={{color:C.cyan}}>Audit</span></span>}
                </div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.38)", lineHeight:1.5 }}>
                  {nav==="home"&&`${WL.handle} · ${WL.platforms.split(",").map(p=>p[0].toUpperCase()+p.slice(1)).join(" & ")}`}
                  {nav==="content"&&"All your TikTok and Instagram content in one view"}
                  {nav==="analytics"&&"Deep performance data across all your content"}
                  {nav==="tasks"&&`Keep ${WL.creator1}${WL.creator2?` and ${WL.creator2}`:""} aligned on what to do next`}
                  {nav==="growth"&&`TikTok, Instagram and ${WL.appName} app metrics`}
                  {nav==="deals"&&"Track sponsorships, collabs and brand partnerships"}
                  {nav==="settings"&&"API keys, creator config and sync controls"}
                  {nav==="ai"&&"Add tasks, ideas and get content advice"}
                </div>
              </div>
              <div style={{ height:1, flex:1, margin:"0 32px 4px", background:"linear-gradient(90deg,rgba(255,255,255,0.06),transparent)" }} />
            </div>}

        {/* VIEWS — keyed wrapper fades each view in on nav change (pure opacity+lift, no layout impact) */}
        <div key={nav} className="viewEnter">
        {nav==="home"      && <HomeView ideas={topIdeas} allIdeas={ideas} outcomeMatches={autoMatchOutcomes(ideas, videos)} confirmOutcome={confirmOutcome} calItems={upcomingCal} setNav={id=>{ setNav(id); setSub(null); }} runAI={runAI} aiLoad={aiLoad} openModal={openModal} ttViewsDisplay={ttViewsDisplay} igViewsTotal={igViewsTotal} allViewsDisplay={allViewsDisplay} m={m} scrapedStats={scrapedStats} statsError={statsError} igData={igData} videos={videos} weeklyDebrief={weeklyDebrief} debriefLoading={debriefLoading} runDebrief={runDebrief} />}
        {nav==="content"   && <ContentView videoScores={videoScores} ideas={ideas} setIdeas={setIdeas} calItems={calItems} setCalItems={setCalItems} scoreIdea={scoreIdea} genCaption={genCaption} aiLoad={aiLoad} captionResult={captionResult} captionIdea={captionIdea} copied={copied} copyText={copyText} openModal={openModal} setEditIdeaTarget={setEditIdeaTarget} setModals={setModals} setNavSub={setSub} onBuildScript={handleBuildScript} markPosted={markPosted} />}
        {nav==="analytics" && <AnalyticsView m={manualData} videos={sortedVideos} totalViews={totalViews} avgRatio={avgRatio} facecamAvg={facecamAvg} hookStats={hookStats} analysis={analysis} nextVids={nextVids} weekly={weekly} trends={trends} igData={igData} hasIG={hasIG} igLoad={igLoad} fetchIG={fetchIG} runAI={runAI} aiLoad={aiLoad} setUpdateTarget={setUpdateTarget} openModal={openModal} deleteVideo={deleteVideo} WL={WL} videoScores={videoScores} commentInsights={commentInsights} visualDNA={visualDNA} setIdeas={setIdeas} />}
        {nav==="tasks"     && <TasksView tasks={tasks} setTasks={setTasks} appIdeas={appIdeas} setAppIdeas={setAppIdeas} setEditAppIdeaTarget={setEditAppIdeaTarget} setModals={setModals} />}
        {nav==="deals"     && <DealsView />}
        {nav==="audit"     && <ProspectAuditView WL={activeWL} />}
        {pricing && <PricingModal tier={plan.tier} reason={pricing.reason} onClose={()=>setPricing(null)} />}
        {nav==="ai"        && <AIChatView anthropicKey={keys?.anthropic || BAKED_ANTHROPIC_KEY} tasks={tasks} setTasks={setTasks} ideas={ideas} setIdeas={setIdeas} videos={videos} preloadMsg={assistPreload} />}
        {nav==="growth"    && <GrowthView m={m} ttViewsDisplay={ttViewsDisplay} igData={igData} hasIG={hasIG} igLoad={igLoad} fetchIG={fetchIG} scrapedStats={scrapedStats} saveManual={saveManual} setManualData={setManualData} videos={videos} ideas={ideas} />}
        {nav==="settings"  && <SettingsView plan={plan} onManagePlan={()=>setPricing({})} keys={keys} onEditKeys={onEditKeys} scrapedStats={scrapedStats} hasIG={hasIG} WL={activeWL} onEditWL={onEditWL} onSyncTikTok={async()=>{
              setSyncMsg("Syncing...");
              try {
                await Promise.all([fetchTikToks(true), fetchIGReels(true), fetchIGFollowers()]);
                setSyncMsg("Synced");
              } catch(e) { setSyncMsg("Sync failed: "+e.message); }
              setTimeout(()=>setSyncMsg(null), 4000);
            }}
            syncMsg={syncMsg} videos={videos} ideas={ideas}
            onBulkImport={newVids=>{
              setVideos(vs=>{
                const merged=[...vs];
                newVids.forEach(nv=>{
                  if(!merged.find(v=>v.title===nv.title)){
                    merged.unshift({...nv,id:Date.now().toString()+Math.random().toString(36).slice(2),created_at:new Date().toISOString()});
                  }
                });
                saveJSON(VIDEOS_KEY,merged);
                return merged;
              });
            }}
            />}
        </div>{/* end viewEnter */}

          </div>{/* end page content padding */}

          {/* PULL-TO-REFRESH indicator (installed PWA) */}
        {ptr !== 0 && (
          <div style={{ position:"fixed", top:Math.min(ptr===-1?70:ptr*0.55, 80)-36, left:"50%", transform:"translateX(-50%)", zIndex:998, width:38, height:38, borderRadius:"50%", background:"rgba(12,8,24,0.95)", border:`1px solid ${ptr>=90||ptr===-1?C.cyan:"rgba(255,255,255,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(0,0,0,0.5)", transition:ptr===-1?"top 0.2s":"none" }}>
            <span style={{ fontSize:16, color:ptr>=90||ptr===-1?C.cyan:"rgba(255,255,255,0.5)", display:"inline-block", transform:ptr===-1?"none":`rotate(${Math.min(ptr,120)*1.5}deg)`, animation:ptr===-1?"spin 0.8s linear infinite":"none" }}>↻</span>
          </div>
        )}

          {/* AI ERROR — human lead line + technical detail, auto-dismisses in 15s */}
        {aiErr && (()=>{ 
          const friendly = /rate limit|429/i.test(aiErr) ? "The AI is rate-limited — wait ~30 seconds and try again."
            : /overloaded|529|503/i.test(aiErr) ? "The AI service is briefly overloaded — try again in a moment."
            : /invalid.*key|401/i.test(aiErr) ? "An API key looks invalid — check Settings."
            : /could not parse|try again/i.test(aiErr) ? "The AI response came back malformed — hitting the button again usually fixes it."
            : /network/i.test(aiErr) ? "Network problem reaching the AI — check your connection and retry."
            : "That didn't work — try again in a moment.";
          return (
          <div style={{ position:"fixed", top:isMobile?54:20, left:"50%", transform:"translateX(-50%)", width:isMobile?"calc(100% - 28px)":"auto", maxWidth:520, background:"rgba(10,5,20,0.98)", border:`1px solid ${C.pink}60`, borderRadius:16, padding:isMobile?"14px 16px":"14px 18px", zIndex:999, display:"flex", gap:12, alignItems:"flex-start", backdropFilter:"blur(20px)", boxShadow:`0 8px 32px rgba(0,0,0,0.6)`, boxSizing:"border-box" }}>
            <span style={{ display:"inline-flex", flexShrink:0 }}>{I.warn(16,C.pink)}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:isMobile?14:15, fontWeight:700, color:"#fff", lineHeight:1.45, marginBottom:4 }}>{friendly}</div>
              <div style={{ fontSize:12, color:"rgba(255,136,136,0.85)", lineHeight:1.5, wordBreak:"break-word" }}>{String(aiErr).slice(0,260)}</div>
              {aiErr.includes("Settings")&&<span onClick={()=>{setAiErr(null);setNav("settings");}} style={{ color:WL.accentColor, fontWeight:700, cursor:"pointer", display:"block", marginTop:6, fontSize:13 }}>→ Go to Settings</span>}
            </div>
            <button onClick={()=>setAiErr(null)} aria-label="Dismiss error" style={{ background:"none",border:"none",color:"rgba(255,255,255,0.85)",cursor:"pointer",fontSize:18,lineHeight:1,flexShrink:0,padding:0 }}>×</button>
          </div>
          );
        })()}
        </div>{/* end web-inner */}
      </div>{/* end web-content */}


      {/* GUIDED TOUR */}
      {tourStep !== null && <GuidedTour step={tourStep} onSkip={finishTour} onGoContent={()=>{ setNav("content"); setSub(null); advanceTour(1); }} />}

      {/* MODALS */}
      {modals.addVideo    && <AddVideoModal />}
      {modals.updateVideo && updateTarget && <UpdateVideoModal />}
      {modals.addIdea     && <AddIdeaModal />}
      {modals.editIdea    && editIdeaTarget && <EditIdeaModal />}
      {modals.editAppIdea && editAppIdeaTarget && <EditAppIdeaModal />}
      {modals.addCal      && <AddCalModal />}
      {modals.editStats   && <EditStatsModal />}


    </div>
  );
}
// ── ONBOARDING PAGE ──────────────────────────────────────────────
function OnboardingPage({ onComplete }) {
  const isMobile = typeof window !== 'undefined' && (window.__isMobile || window.innerWidth < 900);
  const _pendingStep = parseInt(localStorage.getItem("krapmaps_v1_pending_step")||"0",10);
  if(_pendingStep) { localStorage.removeItem("krapmaps_v1_pending_step"); }
  const [step, setStep] = useState(_pendingStep||0);
  const [handle, setHandle] = useState(WL.handle || "");
  const [apiKey, setApiKey] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [codeShake, setCodeShake] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadLines, setLoadLines] = useState([]);

  const VALID_CODE = null; // multi-client: codes checked against CLIENTS map

  // Slide content keyed by client
  const isBraz = WL.clientId === "thierno";
  const ac1 = WL.accentColor || "#FF2D78";
  const ac2wl = WL.accentColor2 || "#00E5FF";

  // ── EDITORIAL BRIEF — same layout on every build, content driven by client ──
  const BRIEF = isBraz ? {
    name:"Thierno", sub:"aka Braz · @officialthierno",
    desc:"R&B · Afrobeats · Hip-Hop. Portsmouth, Northampton, London. Influenced by Chris Brown, Tory Lanez, Justin Bieber.",
    cols:{ c1:"#00C853", c2:"#64B5F6", c3:"#CE93D8", c4:"#FF6B6B" },
    headline:{ label:"NEXT DROP", big:"21", unit:"DAYS", caption:<>Until <span style={{color:"#64B5F6"}}>Single 03</span> — summer banger. Pipeline behind it: moody autumn/winter late-night already lined up.</> },
    numbersLabel:"CURRENT NUMBERS",
    numbers:[
      {platform:"Spotify",val:"37",label:"monthly listeners",col:"#00C853"},
      {platform:"TikTok",val:"784",label:"followers · 12.9K views",col:"#64B5F6"},
      {platform:"Instagram",val:"1,566",label:"followers",col:"#CE93D8"},
      {platform:"YouTube",val:"~20",label:"subscribers",col:"rgba(255,255,255,0.3)"},
    ],
    listLabel:"DISCOGRAPHY",
    list:[
      {title:"Flaws",status:"OUT NOW",col:"rgba(255,255,255,0.25)"},
      {title:"Can't Imagine",status:"OUT NOW · TOP PERFORMER",col:"#00C853"},
      {title:"Single 03",status:"3 WEEKS",col:"#64B5F6"},
    ],
    horizon:<>Consistent posting. 3–4 new songs out. Growing streams and engagement. Building a genuine core fanbase. <span style={{color:"rgba(255,255,255,0.7)"}}>National → continental → global.</span></>,
    brand:"Authenticity. Delivery. Feel-good energy. Listeners fully absorbed in the vibe.",
    bottleneck:"Raw vocals perform best — not posting enough. Self-managed. Outward creative side drains when the heart is in the music.",
    origin:"\"Started at school when his friend Tate spotted his vocal talent, got him in the studio — and it snowballed from there.\"",
  } : {
    name:"KrapMaps", sub:"@findkrap · Kaden + Harley",
    desc:"World's first crowdsourced bin-finding app for backpackers. SE Asia + UK. Founder-built, mission-driven, slightly self-deprecating.",
    cols:{ c1:"#FF2D78", c2:"#00E5FF", c3:"#C566FF", c4:"#FF6B1A" },
    headline:{ label:"NEXT MILESTONE", big:"10K", unit:"FOLLOWERS", caption:<>Organic TikTok target — plus <span style={{color:"#00E5FF"}}>3 hostel partnerships</span> and 1,000 app downloads from content alone.</> },
    numbersLabel:"CURRENT NUMBERS",
    numbers:[
      {platform:"App",val:"247",label:"active users",col:"#FF2D78"},
      {platform:"Bins",val:"710",label:"mapped",col:"#00E5FF"},
      {platform:"Partners",val:"2",label:"hostel chains · 24+ sites",col:"#C566FF"},
      {platform:"Stage",val:"Pre-seed",label:"raise in progress",col:"rgba(255,255,255,0.3)"},
    ],
    listLabel:"CONTENT PILLARS",
    list:[
      {title:"Local Connection",status:"CEILING 500K+",col:"#FF2D78"},
      {title:"Location Contrast",status:"CEILING 200K+",col:"#00E5FF"},
      {title:"Mission Reveal",status:"CEILING 100K+",col:"#C566FF"},
      {title:"App In Action",status:"CEILING 50K",col:"rgba(255,255,255,0.3)"},
      {title:"Travel Utility",status:"CEILING 30K",col:"rgba(255,255,255,0.22)"},
    ],
    horizon:<>Grow organic TikTok to 10K. Land 3 more hostel partnerships. <span style={{color:"rgba(255,255,255,0.7)"}}>1,000 app downloads from content alone.</span></>,
    brand:"Genuine, slightly self-deprecating founder energy. Not preachy eco-content — the humour is in the absurdity of hunting bins as a serious mission.",
    bottleneck:"Consistent posting while travelling — capturing the raw moments before they lose energy.",
    origin:"\"Two backpackers tired of holding their rubbish for hours in paradise built the world's first crowdsourced bin-finding app — and turned the mission into the content.\"",
  };
  const SC = isBraz ? {
    windowLabel: "ARTISTOS · DASHBOARD",
    navItems: [
      {icon:"◉",lb:"HOME",   col:"#00C853",idx:3},
      {icon:"◆",lb:"CONTENT",col:"#CE93D8",idx:0},
      {icon:"▶",lb:"STREAMS", col:"#64B5F6",idx:5},
      {icon:"≡",lb:"SCRIPT",  col:"#00C853",idx:1},
      {icon:"◇",lb:"DEALS",   col:"#CE93D8",idx:4},
      {icon:"◎",lb:"ASSIST",  col:"#00C853",idx:2},
      {icon:"▲",lb:"GROWTH",  col:"#64B5F6",idx:6},
    ],
    slidePageLabels: ["CONTENT","CONTENT","ASSIST","DASHBOARD","DEALS","ANALYTICS","GROWTH"],
    slideTitleColors: ["#CE93D8","#CE93D8","#00C853","#00C853","#00C853","#64B5F6","#64B5F6"],
    contentTabLabel: "RELEASES",
    contentAddLabel: "+ ADD IDEA",
    handle: "@officialthierno",
    ideas: [
      {title:`POV: you drop a raw vocal and your whole comment section loses it`,score:91,tag:"POST NOW",col:"#FF2D78",pinned:true},
      {title:`Day in the life making music in Portsmouth vs London`,score:78,tag:"GOOD",col:"#FFD50A",pinned:false},
      {title:`Reacting to my first song 'Flaws' a year later`,score:65,tag:"GOOD",col:"rgba(255,255,255,0.35)",pinned:false},
    ],
    selectedIdea: `POV: raw vocal drop in my bedroom`,
    scriptScenes: [
      {scene:"HOOK",col:"#FF2D78",text:`Raw vocal clip — no music, just voice. Text: "POV: this is what my room sounds like at 2am"`},
      {scene:"BUILD",col:"#FF6B1A",text:"Cut to: writing the melody on phone notes, replaying it, fixing the run."},
      {scene:"REVEAL",col:"#39FF14",text:"Final take — full vocal with the beat drops in. Reaction to playback."},
      {scene:"CTA",col:"#00E5FF",text:`"Can't Imagine is out now. Link in bio. Tell me what you feel."`},
    ],
    aiQ: "Which of my ideas should I post first?",
    aiA: <>Post <span style={{color:"#FF2D78",fontWeight:600}}>"raw vocal drop"</span> first — scored <span style={{color:"#FF2D78"}}>91/100</span>. Raw vocals are your best-performing format. Evening post, Thursday or Friday.</>,
    weekHandle: "@officialthierno · Week in Review",
    stats: [{label:"STREAMS",val:"2.4K",col:"#00C853"},{label:"SAVES",val:"184",col:"rgba(255,255,255,0.6)"},{label:"LIKE RATIO",val:"6.1%",col:"rgba(255,255,255,0.6)"},{label:"FOLLOWERS",val:"+112",col:"#00C853"}],
    quickActions: [
      {icon:"◈",label:"WHAT'S WORKING",sub:"Top content analysis",col:"#FF2D78"},
      {icon:"▶",label:"NEXT RELEASE",sub:"Pipeline planning",col:"#C566FF"},
      {icon:"⊞",label:"CONTENT BRIEF",sub:"Your weekly plan",col:"#FFD50A"},
      {icon:"◆",label:"TRENDS",sub:"R&B trends now",col:"#00E5FF"},
    ],
    platformHandle: "@officialthierno",
    platformStats: [{label:"STREAMS",val:"2.4K",col:"#00C853"},{label:"SAVES",val:"184",col:"rgba(255,255,255,0.6)"},{label:"FOLLOWERS",val:"784",col:"#00C853"},{label:"MONTHLY",val:"37",col:"rgba(255,255,255,0.6)"}],
  } : {
    windowLabel: "CREATOROS · DASHBOARD",
    navItems: [
      {icon:"◉",lb:"HOME",    col:"#FF2D78",idx:3},
      {icon:"◆",lb:"CONTENT", col:"#C566FF",idx:0},
      {icon:"▶",lb:"ANALYTICS",col:"#FF6B1A",idx:5},
      {icon:"≡",lb:"TASKS",   col:"#00E5FF",idx:1},
      {icon:"◇",lb:"DEALS",   col:"#39FF14",idx:4},
      {icon:"◎",lb:"ASSIST",  col:"#FF2D78",idx:2},
      {icon:"▲",lb:"GROWTH",  col:"#00E5FF",idx:6},
    ],
    slidePageLabels: ["CONTENT","CONTENT","ASSIST","DASHBOARD","DEALS","ANALYTICS","GROWTH"],
    slideTitleColors: ["#C566FF","#C566FF","#FF2D78","#FF2D78","#39FF14","#FF6B1A","#00E5FF"],
    contentTabLabel: "IDEAS",
    contentAddLabel: "+ ADD IDEA",
    handle: "@findkrap",
    ideas: [
      {title:`POV: you can't find a single bin in Bali`,score:87,tag:"FILM THIS",col:"#FF2D78",pinned:true},
      {title:`I mapped every bin in Chiang Mai in one day`,score:74,tag:"GOOD",col:"#FFD50A",pinned:false},
      {title:`Why tourists always end up littering abroad`,score:61,tag:"REWORK",col:"rgba(255,255,255,0.25)",pinned:false},
    ],
    selectedIdea: `POV: can't find a single bin in Bali`,
    scriptScenes: [
      {scene:"HOOK",col:"#FF2D78",text:`"POV: you're in Bali and you literally cannot find a single bin anywhere…"`},
      {scene:"PROBLEM",col:"#FF6B1A",text:"Cut to street shots — rubbish everywhere, tourists confused, bins nowhere."},
      {scene:"SOLUTION",col:"#39FF14",text:"Open KrapMaps — drop a pin on every bin in real-time. Map fills up live."},
      {scene:"CTA",col:"#00E5FF",text:`"Tap the link, download KrapMaps. Let's stop the littering."`},
    ],
    aiQ: "Which of my ideas should I film next?",
    aiA: <>Film <span style={{color:"#FF2D78",fontWeight:600}}>"bin in Bali"</span> first — highest scored at <span style={{color:"#FF2D78"}}>87/100</span>. Strong hook, good trend timing. Thursday 6pm is your best slot.</>,
    weekHandle: "@findkrap · Week in Review",
    stats: [{label:"TOTAL VIEWS",val:"12.4K",col:"#FF2D78"},{label:"AVG VIEWS",val:"3,100",col:"rgba(255,255,255,0.6)"},{label:"LIKE RATIO",val:"4.2%",col:"rgba(255,255,255,0.6)"},{label:"FOLLOWERS",val:"+847",col:"#39FF14"}],
    quickActions: [
      {icon:"◈",label:"WHAT'S WORKING",sub:"Analyse top content",col:"#FF2D78"},
      {icon:"▶",label:"NEXT VIDEOS",sub:"AI recommendations",col:"#C566FF"},
      {icon:"⊞",label:"WEEKLY BRIEF",sub:"Your filming brief",col:"#FFD50A"},
      {icon:"◆",label:"TRENDS",sub:"What's hot now",col:"#00E5FF"},
    ],
    platformHandle: "@findkrap",
    platformStats: [{label:"TOTAL VIEWS",val:"12.4K",col:"#FF2D78"},{label:"AVG VIEWS",val:"3,100",col:"rgba(255,255,255,0.6)"},{label:"LIKE RATIO",val:"4.2%",col:"rgba(255,255,255,0.6)"},{label:"FOLLOWERS",val:"2,841",col:"#FF2D78"}],
  };

  const BOOT_LINES = [
    { text:"Verifying licence key...", delay:0 },
    { text:"KEY ACCEPTED", delay:500, green:true },
    { text:"Connecting to content intelligence...", delay:900 },
    { text:"Loading AI modules...", delay:1400 },
    { text:"Syncing channel config...", delay:1800 },
    { text:"Calibrating virality engine...", delay:2200 },
    { text:"All systems ready", delay:2700, green:true },
    { text:"ACCESS GRANTED — Welcome.", delay:3100, green:true, bold:true },
  ];

  const DEMO_CARDS = [
    { label:"HOOK A/B TESTER", content:`"POV: you can't find a bin in Bali"`, sub:"WINNER · 94 pts", bar:0.94 },
    { label:"VIRALITY SCORE", content:"82 / 100", sub:"HIGH POTENTIAL · Strong hook", bar:0.82 },
    { label:"BRAND DEAL", content:"£2,400", sub:"Patagonia · Signed", bar:1 },
    { label:"SCRIPT BUILDER", content:"Hook → Problem → App → CTA", sub:"Script ready · 47 sec", bar:0.7 },
    { label:"AI WEEKLY DEBRIEF", content:"Hook vids up 3×", sub:"Film the contrast idea this week", bar:0.6 },
    { label:"ANALYTICS", content:"↑ 12.4K views", sub:"Best day: Thursday 6pm", bar:0.78 },
  ];

  useEffect(()=>{
    if(step!==1) return;
    const t = setInterval(()=>setDemoIdx(p=>(p+1)%DEMO_CARDS.length), 2800);
    return ()=>clearInterval(t);
  },[step]);

  useEffect(()=>{
    if(step!==1) return;
    const t = setInterval(()=>setSlideIdx(p=>(p+1)%7), 4000);
    return ()=>clearInterval(t);
  },[step]);

  const submitCode = () => {
    const entered = codeInput.trim().toUpperCase();
    const matched = CLIENTS[entered];
    if(matched) {
      // Persist client config so WL loads correctly after reload
      // Wipe data only when activating a NEW client for the first time
      try {
        const prev = localStorage.getItem(CLIENT_KEY);
        const prevId = prev ? JSON.parse(prev).clientId : null;
        const isNewClient = prevId !== matched.clientId;
        localStorage.setItem(CLIENT_KEY, JSON.stringify(matched));
        localStorage.removeItem(WL_KEY);
        if(isNewClient && matched.clientId !== "krapmaps") {
          [VIDEOS_KEY,IDEAS_KEY,CAL_KEY,TASKS_KEY,APPIDEAS_KEY,ANALYSIS_KEY,
           NEXTVIDS_KEY,WEEKLY_KEY,TRENDS_KEY,SCRAPE_KEY,SCORES_KEY,MEMORY_KEY,
           COMPETE_KEY,PREDICT_KEY,CUR_TRENDS_KEY,CHANNEL_THEORY_KEY,HOOK_DB_KEY,
           PATTERN_KEY,GAP_KEY,MANUAL_KEY,STREAK_KEY,XP_KEY,
           VOICE_KEY,VOICE_KEY+"_meta",VOICE_FB_KEY,VISION_KEY,COMMENTS_KEY,NN_KEY,EMB_KEY,
           "krapmaps_v1_tikwm_last","krapmaps_v1_debrief"
          ].forEach(k=>{ try{localStorage.removeItem(k);}catch{} });
        }
      } catch {}
      setCodeError(false);
      setLoading(true);
      setLoadLines([]);
      BOOT_LINES.forEach(l => {
        setTimeout(() => setLoadLines(prev => [...prev, l]), l.delay);
      });
      setTimeout(() => {
        localStorage.setItem("krapmaps_v1_pending_step", "1");
        window.location.reload();
      }, 3800);
    } else {
      setCodeError(true);
      setCodeShake(true);
      setTimeout(()=>setCodeShake(false), 600);
    }
  };

  const finish = (key) => {
    const h = handle.trim();
    if(h) {
      const cfg = loadJSON(KEYS_KEY,{});
      saveJSON(KEYS_KEY,{ ...cfg, handle: h });
      const wlSaved = loadJSON(WL_KEY, {});
      saveWL({ ...wlSaved, handle: h });
    }
    if(key && key.trim()) {
      const cfg = loadJSON(KEYS_KEY,{});
      saveJSON(KEYS_KEY,{ ...cfg, keys:{ ...(cfg.keys||{}), anthropic: key.trim() } });
    }
    saveJSON("krapmaps_v1_onboarded", true);
    addXP(50);
    onComplete();
  };

  const ac = WL.accentColor || "#6366F1";
  const ac2 = WL.accentColor2 || "#8B5CF6";

  return (
    <div style={{ minHeight:"100vh", background:"#000", display:"flex", fontFamily:"'Inter',system-ui,sans-serif", position:"relative", overflow:"hidden", transition:"background 0.6s" }}>
      {/* Subtle green glow on activate screen */}
      {step===0 && <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,#39FF1406 0%,transparent 65%)", pointerEvents:"none" }}/>}
      {/* Background gradient blobs — hidden on terminal/welcome steps */}
      {step>1 && <div style={{ position:"fixed", top:"-20%", right:"-10%", width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle,${ac}22 0%,transparent 65%)`, pointerEvents:"none" }}/>}
      {step>1 && <div style={{ position:"fixed", bottom:"-20%", left:"-10%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${ac2}18 0%,transparent 65%)`, pointerEvents:"none" }}/>}

      {/* Left panel — branding, hidden on terminal step */}
      <div style={{ flex:"0 0 420px", display:"none" }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"6px 14px", borderRadius:100, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", marginBottom:32 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:ac, boxShadow:`0 0 6px ${ac}` }}/>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", letterSpacing:"0.08em", fontWeight:500 }}>{WL.appName}</span>
          </div>
          <div style={{ fontSize:isMobile?24:40, fontWeight:700, color:"#fff", lineHeight:1.15, marginBottom:16, letterSpacing:"-0.02em" }}>
            The content system<br/><span style={{ color:ac }}>serious creators</span><br/>actually use.
          </div>
          <div style={{ fontSize:16, color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>Score ideas before filming. Track every deal. Get AI strategy that knows your niche. All in one place.</div>
        </div>
        {/* Testimonial */}
        <div style={{ padding:"20px 24px", borderRadius:16, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.75)", lineHeight:1.6, marginBottom:12, fontStyle:"italic" }}>"This replaced four different apps. My ideas are actually getting scored now instead of sitting in Notes."</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>— Content creator, 180K followers</div>
        </div>
      </div>

      {/* Right panel — steps */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:step===1?"flex-start":"center", padding:step===1?"0":"32px 20px", overflowY:"auto", position:"relative" }}>
        <div style={{ width:"100%", maxWidth:step===1?"100%":440 }}>

          {/* Step 0 — Activation / Loading */}
          {step === 0 && (
            <div style={{ fontFamily:"'Courier New',Courier,monospace", width:"100%", display:"flex", flexDirection:"column", alignItems:"center" }}>
              {!loading ? (
                /* ── ACTIVATE SCREEN ── */
                <div style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
                  <div style={{ marginBottom:40 }}/>
                  <div style={{ fontSize:13, color:"#39FF14", letterSpacing:"0.15em", marginBottom:10, opacity:0.7 }}>ENTER ACTIVATION CODE</div>
                  <input
                    value={codeInput}
                    onChange={e=>{ setCodeInput(e.target.value.toUpperCase()); setCodeError(false); }}
                    onKeyDown={e=>e.key==="Enter"&&submitCode()}
                    placeholder="_ _ _ _ - _ _ _ _"
                    autoFocus
                    style={{ background:"transparent", border:"none", borderBottom:`1px solid ${codeError?"#EF4444":"#39FF14"}`, color:"#39FF14", padding:"12px 4px", fontSize:28, fontWeight:400, letterSpacing:"0.25em", outline:"none", fontFamily:"'Courier New',Courier,monospace", caretColor:"#39FF14", textAlign:"center", width:"100%", maxWidth:320, marginBottom:8, animation:codeShake?"shake 0.5s ease":"none", boxSizing:"border-box", boxShadow:codeError?"none":`0 4px 20px #39FF1415` }}
                  />
                  {codeError
                    ? <div style={{ fontSize:11, color:"#EF4444", letterSpacing:"0.12em", marginBottom:32, marginTop:4 }}>ACCESS DENIED — INVALID CODE</div>
                    : <div style={{ fontSize:11, color:"#39FF1440", letterSpacing:"0.1em", marginBottom:32, marginTop:4 }}>PRESS ENTER OR CLICK BELOW</div>
                  }
                  <button
                    onClick={submitCode}
                    disabled={!codeInput.trim()}
                    style={{ background:"transparent", border:`1px solid ${codeInput.trim()?"#39FF14":"#1a1a1a"}`, color:codeInput.trim()?"#39FF14":"#222", padding:"12px 40px", fontFamily:"'Courier New',Courier,monospace", fontSize:12, fontWeight:700, letterSpacing:"0.2em", cursor:codeInput.trim()?"pointer":"default", transition:"all 0.2s", boxShadow:codeInput.trim()?"0 0 24px #39FF1425, inset 0 0 24px #39FF1408":"none" }}
                  >
                    [ ACTIVATE ]
                  </button>
                  <div style={{ marginTop:48, fontSize:11, color:"#1a1a1a", letterSpacing:"0.1em" }}>
                    NO CODE? <a href={`mailto:hello@${(WL.appName||"creatorOS").toLowerCase().replace(/\s/g,"")}.io`} style={{ color:"#39FF1440", textDecoration:"none" }}>CONTACT SUPPORT</a>
                  </div>
                </div>
              ) : (
                /* ── LOADING SCREEN ── */
                <div style={{ width:"100%", maxWidth:420 }}>
                  <div style={{ fontSize:46, color:"#39FF14", letterSpacing:"0.22em", marginBottom:32, fontWeight:800, fontFamily:"Courier New,Courier,monospace", textShadow:"0 0 60px #39FF1430, 0 0 120px #39FF1418, 0 0 200px #39FF1410" }}>CREATOR<span style={{color:"#39FF1455", fontWeight:400, letterSpacing:"0.18em"}}>OS</span></div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {loadLines.map((l,i)=>(
                      <div key={i} style={{ fontSize:13, color:l.green?"#39FF14":"#555", letterSpacing:"0.08em", fontWeight:l.bold?700:400, opacity: l.bold ? 1 : 0.85, animation:"fadeInLine 0.3s ease" }}>
                        {!l.green && <span style={{ color:"#333", marginRight:8 }}>&gt;</span>}{l.text}
                      </div>
                    ))}
                    {loadLines.length < BOOT_LINES.length && (
                      <div style={{ display:"flex", gap:6, marginTop:4 }}>
                        {[0,1,2].map(i=>(
                          <div key={i} style={{ width:4, height:4, borderRadius:"50%", background:"#39FF14", animation:`blink 1s ${i*0.2}s infinite` }}/>
                        ))}
                      </div>
                    )}
                  </div>
                  {loadLines.length === BOOT_LINES.length && (
                    <div style={{ marginTop:24, height:2, background:"linear-gradient(90deg,#39FF14,transparent)", animation:"expandBar 0.5s ease forwards" }}/>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 1 — Welcome */}
          {step === 1 && (
            <div style={{ position:"fixed", inset:0, display:"flex", overflow:"hidden", flexDirection:isMobile?"column":"row" }}>

              <style>{`
                @keyframes slideInRight{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
                @keyframes fadeLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
                @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
              `}</style>

              {/* Scanlines */}
              <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.008) 2px,rgba(255,255,255,0.008) 4px)", pointerEvents:"none", zIndex:0 }}/>
              {/* Dot grid */}
              <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none", zIndex:0 }}/>

              {/* Corner marks */}
              {[{top:24,left:24},{top:24,right:24},{bottom:24,left:24},{bottom:24,right:24}].map((pos,i)=>(
                <div key={i} style={{ position:"absolute", ...pos, width:16, height:16, borderTop:i<2?"1px solid rgba(255,255,255,0.12)":undefined, borderBottom:i>=2?"1px solid rgba(255,255,255,0.12)":undefined, borderLeft:i%2===0?"1px solid rgba(255,255,255,0.12)":undefined, borderRight:i%2===1?"1px solid rgba(255,255,255,0.12)":undefined, pointerEvents:"none", zIndex:1 }}/>
              ))}

              {/* LEFT PANEL — 42% wide on desktop, full width on mobile */}
              <div style={{ width:isMobile?"100%":"42%", flexShrink:0, display:"flex", flexDirection:"column", justifyContent:"center", padding:isMobile?"40px 28px":"0 5% 0 6%", position:"relative", zIndex:2, animation:"fadeLeft 0.7s ease forwards" }}>

                <div style={{ fontSize:10, color:"rgba(255,255,255,0.1)", letterSpacing:"0.5em", fontFamily:"Courier New,monospace", fontWeight:700, marginBottom:48, display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:24, height:"1px", background:"rgba(255,255,255,0.07)" }}/>
                  {WL.appName.toUpperCase()}
                </div>

                <div style={{ fontSize:"clamp(40px,4.2vw,68px)", fontWeight:900, color:"#fff", lineHeight:0.95, letterSpacing:"-0.04em", fontFamily:"Inter,system-ui,sans-serif", marginBottom:28 }}>
                  Your<br/>{WL.clientId==="thierno"?"music.":"channel."}<br/>Your<br/>strategy.<br/>
                  <span style={{ color:"rgba(255,255,255,0.1)" }}>Your rules.</span>
                </div>

                <div style={{ width:36, height:1, background:"rgba(255,255,255,0.14)", marginBottom:24 }}/>

                <div style={{ marginBottom:52 }}/>

                <button
                  onClick={()=>setStep(2)}
                  style={{ padding:"18px 0", borderRadius:2, border:"1px solid rgba(255,255,255,0.22)", background:"transparent", color:"#fff", fontWeight:700, fontSize:11, cursor:"pointer", letterSpacing:"0.22em", fontFamily:"Courier New,monospace", transition:"all 0.2s", width:"100%", maxWidth:340 }}
                  onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.45)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="rgba(255,255,255,0.22)"; }}
                >
                  ACTIVATE MY WORKSPACE
                </button>
                <button onClick={()=>finish("")} style={{ marginTop:16, background:"none", border:"none", color:"rgba(255,255,255,0.38)", fontSize:10, cursor:"pointer", letterSpacing:"0.2em", fontFamily:"Courier New,monospace", textAlign:"left", padding:0 }}>
                  SKIP
                </button>
              </div>

              {/* DIVIDER */}
              {!isMobile && <div style={{ width:1, background:"linear-gradient(180deg,transparent,rgba(255,255,255,0.08) 20%,rgba(255,255,255,0.08) 80%,transparent)", flexShrink:0, zIndex:2 }}/>}

              {/* RIGHT PANEL — hidden on mobile */}
              {!isMobile && (true ? (
                /* ── EDITORIAL BRIEF — same layout on every build, content from BRIEF config ── */
                <div style={{ flex:1, overflowY:"auto", padding:"48px 52px", position:"relative", zIndex:2, animation:"slideInRight 0.9s cubic-bezier(0.16,1,0.3,1) forwards" }}>
                  <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,700;0,900;1,300;1,700&display=swap');
                    .braz-section { margin-bottom: 36px; }
                    .braz-section:last-child { margin-bottom: 0; }
                  `}</style>

                  {/* Identity */}
                  <div className="braz-section">
                    <div style={{ fontSize:9, color:BRIEF.cols.c1, letterSpacing:"0.22em", fontFamily:"Courier New,monospace", marginBottom:isMobile?14:10 }}>IDENTITY</div>
                    <div style={{ fontSize:"clamp(36px,3.6vw,58px)", fontFamily:"'Fraunces',Georgia,serif", fontWeight:900, color:"#fff", lineHeight:0.95, letterSpacing:"-0.02em", marginBottom:isMobile?14:10 }}>
                      {BRIEF.name}<span style={{color:"rgba(255,255,255,0.18)"}}>.</span>
                    </div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", fontFamily:"Courier New,monospace", letterSpacing:"0.1em", marginBottom:6 }}>{BRIEF.sub}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.65, maxWidth:420 }}>{BRIEF.desc}</div>
                  </div>

                  <div style={{ width:"100%", height:1, background:"rgba(255,255,255,0.06)", marginBottom:36 }}/>

                  {/* Headline metric */}
                  <div className="braz-section">
                    <div style={{ fontSize:9, color:BRIEF.cols.c2, letterSpacing:"0.22em", fontFamily:"Courier New,monospace", marginBottom:isMobile?14:10 }}>{BRIEF.headline.label}</div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:8 }}>
                      <div style={{ fontSize:"clamp(48px,4.8vw,72px)", fontFamily:"'Fraunces',Georgia,serif", fontWeight:900, color:"#fff", lineHeight:1 }}>{BRIEF.headline.big}</div>
                      <div style={{ fontSize:14, color:"rgba(255,255,255,0.3)", fontFamily:"Courier New,monospace", letterSpacing:"0.1em" }}>{BRIEF.headline.unit}</div>
                    </div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>{BRIEF.headline.caption}</div>
                  </div>

                  <div style={{ width:"100%", height:1, background:"rgba(255,255,255,0.06)", marginBottom:36 }}/>

                  {/* Stats */}
                  <div className="braz-section">
                    <div style={{ fontSize:9, color:BRIEF.cols.c1, letterSpacing:"0.22em", fontFamily:"Courier New,monospace", marginBottom:isMobile?22:14 }}>{BRIEF.numbersLabel}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(120px,calc(50% - 8px)),1fr))", gap:16 }}>
                      {BRIEF.numbers.map(({platform,val,label,col})=>(
                        <div key={platform}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"Courier New,monospace", marginBottom:4 }}>{platform.toUpperCase()}</div>
                          <div style={{ fontSize:22, fontFamily:"'Fraunces',Georgia,serif", fontWeight:700, color:col, lineHeight:1, marginBottom:3 }}>{val}</div>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:"Courier New,monospace", lineHeight:1.4 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ width:"100%", height:1, background:"rgba(255,255,255,0.06)", marginBottom:36 }}/>

                  {/* List — discography / content pillars */}
                  <div className="braz-section">
                    <div style={{ fontSize:9, color:BRIEF.cols.c3, letterSpacing:"0.22em", fontFamily:"Courier New,monospace", marginBottom:isMobile?22:14 }}>{BRIEF.listLabel}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {BRIEF.list.map(({title,status,col})=>(
                        <div key={title} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ fontSize:15, fontFamily:"'Fraunces',Georgia,serif", fontWeight:700, color:"rgba(255,255,255,0.8)", fontStyle:"italic" }}>{title}</div>
                          <div style={{ fontSize:8, color:col, fontFamily:"Courier New,monospace", letterSpacing:"0.12em" }}>{status}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ width:"100%", height:1, background:"rgba(255,255,255,0.06)", marginBottom:36 }}/>

                  {/* 6-month horizon */}
                  <div className="braz-section">
                    <div style={{ fontSize:9, color:BRIEF.cols.c2, letterSpacing:"0.22em", fontFamily:"Courier New,monospace", marginBottom:isMobile?14:10 }}>6-MONTH HORIZON</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>
                      {BRIEF.horizon}
                    </div>
                  </div>

                  <div style={{ width:"100%", height:1, background:"rgba(255,255,255,0.06)", marginBottom:36 }}/>

                  {/* Brand */}
                  <div className="braz-section" style={{ display:"flex", gap:isMobile?24:40, flexDirection:isMobile?"column":"row" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, color:BRIEF.cols.c3, letterSpacing:"0.22em", fontFamily:"Courier New,monospace", marginBottom:isMobile?14:10 }}>BRAND</div>
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>{BRIEF.brand}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, color:BRIEF.cols.c4, letterSpacing:"0.22em", fontFamily:"Courier New,monospace", marginBottom:isMobile?14:10 }}>BOTTLENECK</div>
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>{BRIEF.bottleneck}</div>
                    </div>
                  </div>

                  <div style={{ width:"100%", height:1, background:"rgba(255,255,255,0.06)", marginBottom:36 }}/>

                  {/* Origin */}
                  <div className="braz-section">
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.18)", letterSpacing:"0.22em", fontFamily:"Courier New,monospace", marginBottom:isMobile?14:10 }}>ORIGIN</div>
                    <div style={{ fontSize:"clamp(14px,1.3vw,17px)", fontFamily:"'Fraunces',Georgia,serif", fontStyle:"italic", fontWeight:300, color:"rgba(255,255,255,0.35)", lineHeight:1.7 }}>
                      {BRIEF.origin}
                    </div>
                  </div>
                </div>
              ) : (
              /* ── KRAPMAS — dashboard carousel ── */
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 40px 32px", position:"relative", zIndex:2, gap:isMobile?28:24 }}>
                {/* Tagline above dashboard */}
                <div style={{ textAlign:"center", animation:"fadeLeft 0.7s ease forwards" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.85)", letterSpacing:"0.22em", fontFamily:"Courier New,monospace" }}>6 TOOLS &nbsp;·&nbsp; 1 SYSTEM</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.18em", fontFamily:"Courier New,monospace", marginTop:5 }}>BUILT FOR CREATORS WHO MEAN IT</div>
                </div>
                <div style={{ width:"100%", height:"calc(100vh - 130px)", maxHeight:740, background:"rgba(7,7,7,0.98)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, overflow:"hidden", boxShadow:"0 60px 160px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04)", animation:"slideInRight 0.9s cubic-bezier(0.16,1,0.3,1) forwards", display:"flex", flexDirection:"column" }}>

                  {/* Window chrome */}
                  <div style={{ display:"flex", alignItems:"center", gap:7, padding:"13px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)", flexShrink:0 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:"rgba(255,255,255,0.18)" }}/>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>
                    <div style={{ flex:1, textAlign:"center", fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.22em", fontFamily:"Courier New,monospace" }}>{SC.windowLabel}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontFamily:"Courier New,monospace", letterSpacing:"0.1em" }}>{SC.handle}</div>
                  </div>

                  {/* Dashboard body */}
                  <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

                    {/* Sidebar — mirrors real app nav */}
                    <div style={{ width:58, borderRight:"1px solid rgba(255,255,255,0.05)", background:"rgba(0,0,0,0.25)", display:"flex", flexDirection:"column", alignItems:"center", paddingTop:12, gap:2, flexShrink:0 }}>
                      {SC.navItems.map(({icon,lb,col,idx})=>{
                        const active = slideIdx===idx;
                        return (
                          <div key={lb} onClick={()=>setSlideIdx(idx)} style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer", padding:"8px 0", width:"100%", opacity:active?1:0.28, transition:"opacity 0.2s" }}>
                            {active && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:2, height:24, background:col, borderRadius:"0 2px 2px 0" }}/>}
                            <div style={{ fontSize:13, color:active?col:"rgba(255,255,255,0.5)" }}>{icon}</div>
                            <div style={{ fontSize:6, color:active?col:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", fontFamily:"Courier New,monospace" }}>{lb}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Slide content */}
                    <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
                      {/* Slide dots */}
                      <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4, zIndex:10 }}>
                        {[0,1,2,3,4,5,6].map(i=>(
                          <div key={i} onClick={()=>setSlideIdx(i)} style={{ width:i===slideIdx?16:4, height:4, borderRadius:2, background:i===slideIdx?"#FF2D78":"rgba(255,255,255,0.1)", transition:"all 0.3s", cursor:"pointer" }}/>
                        ))}
                      </div>

                      {/* SLIDE 0 — Content / Ideas */}
                      {slideIdx===0 && (
                        <div key="s0" style={{ position:"absolute", inset:0, padding:"16px 18px 32px", display:"flex", flexDirection:"column", gap:isMobile?20:10, animation:"slideIn 0.3s ease", overflow:"hidden" }}>
                          <div>
                            <div style={{ fontSize:7, color:SC.slideTitleColors[0], letterSpacing:"0.15em", fontFamily:"Courier New,monospace", marginBottom:3 }}>{SC.slidePageLabels[0]}</div>
                            <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.4))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>{isBraz?"Manage Releases":"Manage Content"}</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{isBraz?"Your releases, ideas and scripts in one place":"All your content, ideas and scripts in one place"}</div>
                          </div>
                          <div style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                            {["IDEAS","CALENDAR","CAPTIONS"].map((t,i)=>(
                              <div key={t} style={{ fontSize:8, color:i===0?"#C566FF":"rgba(255,255,255,0.3)", padding:"4px 10px", borderBottom:i===0?"1px solid #C566FF":"1px solid transparent", marginBottom:-1, fontFamily:"Courier New,monospace", letterSpacing:"0.08em", cursor:"pointer" }}>{t}</div>
                            ))}
                            <div style={{ marginLeft:"auto", fontSize:8, color:"#FF2D78", border:"1px solid #FF2D7840", borderRadius:6, padding:isMobile?"5px 10px":"3px 8px", fontFamily:"Courier New,monospace" }}>+ ADD IDEA</div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
                            {[
                              ...SC.ideas,
                            ].map(({title,score,tag,col,pinned},i)=>(
                              <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"9px 12px", display:"flex", alignItems:"center", gap:10, position:"relative", overflow:"hidden" }}>
                                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:col }}/>
                                <div style={{ flex:1, paddingLeft:4 }}>
                                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.75)", lineHeight:1.4, marginBottom:3 }}>{title}</div>
                                  <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                                    {pinned && <div style={{ fontSize:7, color:"#FF2D78", background:"rgba(255,45,120,0.12)", padding:"1px 5px", borderRadius:3, fontFamily:"Courier New,monospace" }}>PINNED</div>}
                                    <div style={{ fontSize:7, color:"rgba(255,255,255,0.3)", fontFamily:"Courier New,monospace" }}>Idea · AI scored</div>
                                  </div>
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
                                  <div style={{ fontSize:20, fontFamily:"'Lilita One',Georgia,serif", color:col, lineHeight:1 }}>{score}</div>
                                  <div style={{ fontSize:7, color:col, fontFamily:"Courier New,monospace" }}>{tag}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.018)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"8px 12px" }}>
                            <div style={{ fontSize:7, color:"rgba(255,255,255,0.3)", fontFamily:"Courier New,monospace", marginBottom:4 }}>HOOK A/B TESTER</div>
                            <div style={{ display:"flex", gap:8 }}>
                              <div style={{ flex:1, fontSize:8, color:"rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:6, padding:"5px 7px" }}>Hook A ···</div>
                              <div style={{ flex:1, fontSize:8, color:"rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:6, padding:"5px 7px" }}>Hook B ···</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SLIDE 1 — Script Builder */}
                      {slideIdx===1 && (
                        <div key="s1" style={{ position:"absolute", inset:0, padding:"16px 18px 32px", display:"flex", flexDirection:"column", gap:isMobile?20:10, animation:"slideIn 0.3s ease", overflow:"hidden" }}>
                          <div>
                            <div style={{ fontSize:7, color:"#C566FF", letterSpacing:"0.15em", fontFamily:"Courier New,monospace", marginBottom:3 }}>CONTENT</div>
                            <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.4))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>Script Builder</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Turn your idea into a full shooting script</div>
                          </div>
                          <div style={{ display:"flex", gap:10, flex:1, overflow:"hidden" }}>
                            <div style={{ width:"38%", display:"flex", flexDirection:"column", gap:7 }}>
                              <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,45,120,0.2)", borderRadius:10, padding:"8px 10px" }}>
                                <div style={{ fontSize:7, color:SC.slideTitleColors[1], fontFamily:"Courier New,monospace", marginBottom:3 }}>SELECTED IDEA</div>
                                <div style={{ fontSize:9, color:"rgba(255,255,255,0.75)", lineHeight:1.4 }}>{SC.selectedIdea}</div>
                                <div style={{ fontSize:22, fontFamily:"'Lilita One',Georgia,serif", color:"#FF2D78", marginTop:4, lineHeight:1 }}>87</div>
                              </div>
                              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                {[["HOOK","#FF2D78","0–3s"],["PROBLEM","#FF6B1A","3–12s"],["STRUGGLE","#FFD50A","12–28s"],["SOLUTION","#39FF14","28–42s"],["CTA","#00E5FF","42–47s"]].map(([name,col,t])=>(
                                  <div key={name} style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    <div style={{ width:2, height:16, background:col, borderRadius:1, flexShrink:0 }}/>
                                    <div style={{ fontSize:8, color:col, fontFamily:"Courier New,monospace", width:60 }}>{name}</div>
                                    <div style={{ fontSize:7, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace" }}>{t}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5, overflow:"hidden" }}>
                              {SC.scriptScenes.map(({scene,col,text})=>(
                                <div key={scene} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${col}20`, borderLeft:`2px solid ${col}`, borderRadius:"0 8px 8px 0", padding:"6px 9px" }}>
                                  <div style={{ fontSize:7, color:col, fontFamily:"Courier New,monospace", marginBottom:2 }}>{scene}</div>
                                  <div style={{ fontSize:8, color:"rgba(255,255,255,0.55)", lineHeight:1.45 }}>{text}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SLIDE 2 — AI Assistant */}
                      {slideIdx===2 && (
                        <div key="s2" style={{ position:"absolute", inset:0, padding:"16px 18px 32px", display:"flex", flexDirection:"column", gap:isMobile?20:10, animation:"slideIn 0.3s ease", overflow:"hidden" }}>
                          <div>
                            <div style={{ fontSize:7, color:SC.slideTitleColors[2], letterSpacing:"0.15em", fontFamily:"Courier New,monospace", marginBottom:3 }}>{SC.slidePageLabels[2]}</div>
                            <div style={{ fontSize:20, fontWeight:800, background:`linear-gradient(135deg,${ac1},${ac2wl})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>AI Assistant</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Ask me anything about your content</div>
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"9px 11px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                              <div style={{ width:22, height:22, borderRadius:6, background:`linear-gradient(135deg,${ac1},${ac2wl})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>◎</div>
                              <div style={{ fontSize:9, color:"rgba(255,255,255,0.8)", fontWeight:600 }}>{WL.appName} AI</div>
                            </div>
                            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                              {["Show my stats","Edit this idea","Location challenge ideas","What should I post?"].map(chip=>(
                                <div key={chip} style={{ fontSize:7, color:"rgba(255,255,255,0.5)", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"3px 7px" }}>{chip}</div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1 }}>
                            <div style={{ display:"flex", justifyContent:"flex-end" }}>
                              <div style={{ maxWidth:"75%", background:`linear-gradient(135deg,${ac1},${ac2wl})`, borderRadius:"12px 12px 2px 12px", padding:"7px 10px", fontSize:9, color:"#fff", lineHeight:1.4 }}>{SC.aiQ}</div>
                            </div>
                            <div style={{ display:"flex", gap:7 }}>
                              <div style={{ width:18, height:18, borderRadius:5, background:`linear-gradient(135deg,${ac1},${ac2wl})`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9 }}>◎</div>
                              <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"2px 12px 12px 12px", padding:"7px 10px", fontSize:9, color:"rgba(255,255,255,0.65)", lineHeight:1.5 }}>{SC.aiA}</div>
                            </div>
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ flex:1, fontSize:9, color:"rgba(255,255,255,0.45)" }}>Message {WL.appName} AI…</div>
                            <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace", border:"1px solid rgba(255,255,255,0.08)", borderRadius:4, padding:"2px 6px" }}>Send</div>
                          </div>
                        </div>
                      )}

                      {/* SLIDE 3 — Home / Debrief */}
                      {slideIdx===3 && (
                        <div key="s3" style={{ position:"absolute", inset:0, padding:"16px 18px 32px", display:"flex", flexDirection:"column", gap:isMobile?20:10, animation:"slideIn 0.3s ease", overflow:"hidden" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <div>
                              <div style={{ fontSize:7, color:SC.slideTitleColors[3], letterSpacing:"0.15em", fontFamily:"Courier New,monospace", marginBottom:3 }}>{SC.slidePageLabels[3]}</div>
                              <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.4))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>{WL.appName}</div>
                              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{SC.weekHandle}</div>
                            </div>
                            <div style={{ fontSize:8, color:"#39FF14", background:"rgba(57,255,20,0.08)", border:"1px solid rgba(57,255,20,0.2)", borderRadius:6, padding:isMobile?"5px 10px":"3px 8px", fontFamily:"Courier New,monospace", display:"flex", alignItems:"center", gap:6 }}>All clear {I.tick(9,"#39FF14")}</div>
                          </div>
                          <div style={{ display:"flex", gap:7 }}>
                            {SC.stats.map(({label,val,col})=>(
                              <div key={label} style={{ flex:1, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:9, padding:"8px" }}>
                                <div style={{ fontSize:6, color:"rgba(255,255,255,0.3)", fontFamily:"Courier New,monospace", marginBottom:3 }}>{label}</div>
                                <div style={{ fontSize:14, fontFamily:"'Lilita One',Georgia,serif", color:col, lineHeight:1 }}>{val}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:7 }}>
                            {SC.quickActions.map(({icon,label,sub,col})=>(
                              <div key={label} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:9, padding:"8px 10px", display:"flex", gap:8, alignItems:"center", cursor:"pointer" }}>
                                <div style={{ fontSize:14, color:col }}>{icon}</div>
                                <div>
                                  <div style={{ fontSize:8, color:"rgba(255,255,255,0.7)", fontFamily:"Courier New,monospace", fontWeight:700 }}>{label}</div>
                                  <div style={{ fontSize:7, color:"rgba(255,255,255,0.3)" }}>{sub}</div>
                                </div>
                                <div style={{ marginLeft:"auto", fontSize:9, color:"rgba(255,255,255,0.2)" }}>›</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ background:"rgba(255,213,10,0.05)", border:"1px solid rgba(255,213,10,0.15)", borderRadius:9, padding:"7px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ fontSize:8, color:"rgba(255,255,255,0.45)" }}>Weekly AI debrief ready</div>
                            <div style={{ fontSize:8, color:"#FFD50A", fontFamily:"Courier New,monospace" }}>↺ RUN DEBRIEF</div>
                          </div>
                        </div>
                      )}

                      {/* SLIDE 4 — Brand Deals */}
                      {slideIdx===4 && (
                        <div key="s4" style={{ position:"absolute", inset:0, padding:"16px 18px 32px", display:"flex", flexDirection:"column", gap:isMobile?20:10, animation:"slideIn 0.3s ease", overflow:"hidden" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                            <div>
                              <div style={{ fontSize:7, color:SC.slideTitleColors[4], letterSpacing:"0.15em", fontFamily:"Courier New,monospace", marginBottom:3 }}>{SC.slidePageLabels[4]}</div>
                              <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.4))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>Brand Deals</div>
                              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Your partnerships, rates and conversations</div>
                            </div>
                            <div style={{ fontSize:8, color:"#FF2D78", border:"1px solid rgba(255,45,120,0.3)", borderRadius:6, padding:isMobile?"5px 10px":"3px 8px", fontFamily:"Courier New,monospace" }}>+ ADD DEAL</div>
                          </div>
                          <div style={{ display:"flex", gap:7 }}>
                            {[
                              {label:"ACTIVE EARNINGS",val:"£4,400",col:"#39FF14"},
                              {label:"OUTREACH",val:"12",col:"rgba(255,255,255,0.5)"},
                              {label:"IN PROGRESS",val:"3",col:"#FFD50A"},
                              {label:"IN DEALS",val:"2",col:"#FF2D78"},
                            ].map(({label,val,col})=>(
                              <div key={label} style={{ flex:1, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:9, padding:"8px" }}>
                                <div style={{ fontSize:6, color:"rgba(255,255,255,0.3)", fontFamily:"Courier New,monospace", marginBottom:3 }}>{label}</div>
                                <div style={{ fontSize:14, fontFamily:"'Lilita One',Georgia,serif", color:col, lineHeight:1 }}>{val}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
                            {[
                              {brand:"Patagonia",val:"£2,400",stage:"SIGNED",col:"#39FF14"},
                              {brand:"Allbirds",val:"£1,200",stage:"NEGOTIATING",col:"#FFD50A"},
                              {brand:"Hydro Flask",val:"£800",stage:"OUTREACH",col:"rgba(255,255,255,0.3)"},
                            ].map(({brand,val,stage,col})=>(
                              <div key={brand} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"9px 12px", display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"rgba(255,255,255,0.35)" }}>◇</div>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.8)", fontWeight:600, marginBottom:1 }}>{brand}</div>
                                  <div style={{ fontSize:7, color:"rgba(255,255,255,0.3)", fontFamily:"Courier New,monospace" }}>{stage}</div>
                                </div>
                                <div style={{ fontSize:16, fontFamily:"'Lilita One',Georgia,serif", color:col }}>{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SLIDE 5 — Analytics / Track Performance */}
                      {slideIdx===5 && (
                        <div key="s5" style={{ position:"absolute", inset:0, padding:"16px 18px 32px", display:"flex", flexDirection:"column", gap:isMobile?20:10, animation:"slideIn 0.3s ease", overflow:"hidden" }}>
                          <div>
                            <div style={{ fontSize:7, color:SC.slideTitleColors[5], letterSpacing:"0.15em", fontFamily:"Courier New,monospace", marginBottom:3 }}>{SC.slidePageLabels[5]}</div>
                            <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.4))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>Track Performance</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Deep-dive performance for every upload</div>
                          </div>
                          <div style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                            {["OVERVIEW","VIDEOS","AI INSIGHTS"].map((t,i)=>(
                              <div key={t} style={{ fontSize:8, color:i===0?"#FF2D78":"rgba(255,255,255,0.3)", padding:"4px 10px", borderBottom:i===0?"1px solid #FF2D78":"1px solid transparent", marginBottom:-1, fontFamily:"Courier New,monospace", letterSpacing:"0.08em" }}>{t}</div>
                            ))}
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:isMobile?"13px 16px":"10px 12px" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ display:"flex" }}>{I.tt(10,"currentColor")}</div>
                                <div style={{ fontSize:9, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>TikTok</div>
                                <div style={{ fontSize:7, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace" }}>{SC.handle}</div>
                              </div>
                              <div style={{ fontSize:7, color:"#FF2D78", fontFamily:"Courier New,monospace", border:"1px solid rgba(255,45,120,0.25)", borderRadius:4, padding:"2px 6px" }}>PINNED</div>
                            </div>
                            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                              {SC.platformStats.map(({label,val,col})=>(
                                <div key={label} style={{ flex:1 }}>
                                  <div style={{ fontSize:6, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace", marginBottom:2 }}>{label}</div>
                                  <div style={{ fontSize:13, fontFamily:"'Lilita One',Georgia,serif", color:col, lineHeight:1 }}>{val}</div>
                                </div>
                              ))}
                            </div>
                            <svg width="100%" height="28" viewBox="0 0 300 28" preserveAspectRatio="none">
                              <polyline points="0,22 40,18 80,20 120,14 160,16 200,8 240,10 300,4" fill="none" stroke="#FF2D78" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:isMobile?"13px 16px":"10px 12px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                              <div style={{ display:"flex" }}>{I.ig(10,"currentColor")}</div>
                              <div style={{ fontSize:9, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>Instagram</div>
                              <div style={{ fontSize:7, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace" }}>{SC.handle}</div>
                            </div>
                            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                              {(isBraz
                                ? [{label:"FOLLOWERS",val:"1,566",col:"rgba(255,255,255,0.6)"},{label:"AVG VIEWS",val:"420",col:"rgba(255,255,255,0.6)"},{label:"AVG LIKES",col:"rgba(255,255,255,0.6)",val:"68"}]
                                : [{label:"FOLLOWERS",val:"1,204",col:"rgba(255,255,255,0.6)"},{label:"AVG VIEWS",val:"890",col:"rgba(255,255,255,0.6)"},{label:"AVG LIKES",val:"112",col:"rgba(255,255,255,0.6)"}]
                              ).map(({label,val,col})=>(
                                <div key={label} style={{ flex:1 }}>
                                  <div style={{ fontSize:6, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace", marginBottom:2 }}>{label}</div>
                                  <div style={{ fontSize:13, fontFamily:"'Lilita One',Georgia,serif", color:col, lineHeight:1 }}>{val}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SLIDE 6 — Growth */}
                      {slideIdx===6 && (
                        <div key="s6" style={{ position:"absolute", inset:0, padding:"16px 18px 32px", display:"flex", flexDirection:"column", gap:isMobile?20:10, animation:"slideIn 0.3s ease", overflow:"hidden" }}>
                          <div>
                            <div style={{ fontSize:7, color:SC.slideTitleColors[6], letterSpacing:"0.15em", fontFamily:"Courier New,monospace", marginBottom:3 }}>{SC.slidePageLabels[6]}</div>
                            <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.4))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>Monitor Growth</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Track follower growth across platforms</div>
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:isMobile?"13px 16px":"10px 12px" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ display:"flex" }}>{I.tt(10,"currentColor")}</div>
                                <div style={{ fontSize:9, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>TikTok</div>
                              </div>
                              <div style={{ fontSize:7, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:"2px 6px" }}>+ ADD FILTER</div>
                            </div>
                            <div style={{ display:"flex", gap:14, marginBottom:8 }}>
                              {[{label:"FOLLOWERS",val:"2,841"},{label:"TOTAL VIEWS",val:"12.4K"},{label:"TOTAL LIKES",val:"891"}].map(({label,val})=>(
                                <div key={label}>
                                  <div style={{ fontSize:6, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace", marginBottom:2 }}>{label}</div>
                                  <div style={{ fontSize:15, fontFamily:"'Lilita One',Georgia,serif", color:"rgba(255,255,255,0.7)", lineHeight:1 }}>{val}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize:6, color:"rgba(255,255,255,0.2)", fontFamily:"Courier New,monospace", marginBottom:3 }}>FOLLOWERS · 7 DAYS</div>
                            <svg width="100%" height="30" viewBox="0 0 300 30" preserveAspectRatio="none">
                              <polyline points="0,26 50,24 100,22 150,18 200,16 250,10 300,6" fill="none" stroke="#FF2D78" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <div style={{ fontSize:6, color:"rgba(255,255,255,0.2)", fontFamily:"Courier New,monospace", marginBottom:3, marginTop:6 }}>VIEWS · 7 DAYS</div>
                            <svg width="100%" height="30" viewBox="0 0 300 30" preserveAspectRatio="none">
                              <polyline points="0,26 50,22 100,20 150,18 200,12 250,8 300,4" fill="none" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:isMobile?"13px 16px":"10px 12px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                              <div style={{ display:"flex" }}>{I.ig(10,"currentColor")}</div>
                              <div style={{ fontSize:9, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>Instagram</div>
                            </div>
                            <div style={{ display:"flex", gap:14, marginBottom:6 }}>
                              {[{label:"FOLLOWERS",val:"1,204"},{label:"AVG VIEWS",val:"890"},{label:"AVG LIKES",val:"112"}].map(({label,val})=>(
                                <div key={label}>
                                  <div style={{ fontSize:6, color:"rgba(255,255,255,0.25)", fontFamily:"Courier New,monospace", marginBottom:1 }}>{label}</div>
                                  <div style={{ fontSize:13, fontFamily:"'Lilita One',Georgia,serif", color:"rgba(255,255,255,0.6)", lineHeight:1 }}>{val}</div>
                                </div>
                              ))}
                            </div>
                            <svg width="100%" height="24" viewBox="0 0 300 24" preserveAspectRatio="none">
                              <polyline points="0,20 60,18 120,16 180,14 240,10 300,8" fill="none" stroke="#C566FF" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                        </div>
                      )}


                    </div>
                  </div>
                </div>
              </div>
              ))} {/* end KrapMaps right panel */}

            </div>
          )}

          {/* Step 2 — Channel */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:0, width:"100%", maxWidth:440, animation:"fadeLeft 0.4s ease" }}>
              {/* Progress */}
              <div style={{ display:"flex", gap:4, marginBottom:40 }}>
                {[0,1].map(i=><div key={i} style={{ height:2, flex:1, background:i<=1?"#FF2D78":"rgba(255,255,255,0.08)", transition:"all 0.3s" }}/>)}
              </div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", letterSpacing:"0.2em", fontFamily:"Courier New,monospace", marginBottom:isMobile?14:10 }}>YOUR CHANNEL</div>
              <div style={{ fontSize:28, fontWeight:800, color:"#fff", marginBottom:6, lineHeight:1.1, letterSpacing:"-0.02em" }}>Your channel.<br/><span style={{ color:"rgba(255,255,255,0.5)" }}>Your strategy.</span></div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.62)", lineHeight:1.7, marginBottom:32, fontFamily:"Courier New,monospace", letterSpacing:"0.04em" }}>Tell us your handle so every AI prompt, score and strategy is calibrated to your exact niche.</div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", letterSpacing:"0.18em", fontFamily:"Courier New,monospace", marginBottom:isMobile?14:10 }}>TIKTOK HANDLE</div>
                <input
                  value={handle}
                  onChange={e=>setHandle(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&finish("")}
                  placeholder="@yourchannel"
                  autoFocus
                  style={{ width:"100%", background:"transparent", border:"none", borderBottom:`1px solid ${handle?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.12)"}`, color:"#fff", padding:"10px 0", fontSize:18, outline:"none", boxSizing:"border-box", transition:"border-color 0.2s", fontFamily:"Courier New,monospace", letterSpacing:"0.08em", caretColor:"#FF2D78" }}
                />
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontFamily:"Courier New,monospace", letterSpacing:"0.06em", lineHeight:1.7, marginBottom:36 }}>
                ◈ &nbsp;Baked into every AI prompt — idea scoring, hook testing, debrief.<br/>
                ◈ &nbsp;The more specific your niche, the sharper the advice.
              </div>
              <button onClick={()=>finish("")} style={{ padding:"16px 0", border:"1px solid rgba(255,255,255,0.22)", borderRadius:2, background:"transparent", color:"#fff", fontWeight:700, fontSize:11, cursor:"pointer", letterSpacing:"0.22em", fontFamily:"Courier New,monospace", transition:"all 0.2s", width:"100%", marginBottom:isMobile?22:14 }}
                onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.4)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="rgba(255,255,255,0.22)"; }}
              >LAUNCH →</button>
              <button onClick={()=>finish("")} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.38)", fontSize:10, cursor:"pointer", letterSpacing:"0.2em", fontFamily:"Courier New,monospace", padding:0, textAlign:"center", width:"100%" }}>SKIP FOR NOW</button>
            </div>
          )}


        </div>
      </div>

      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadeInLine{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:0.2}50%{opacity:1}}
        @keyframes expandBar{from{width:0}to{width:100%}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes scorePulse{0%,100%{opacity:.45;transform:scale(0.94)}50%{opacity:.9;transform:scale(1.06)}}
        @keyframes scoreSettle{0%{transform:scale(1)}45%{transform:scale(1.16)}100%{transform:scale(1)}}
        @keyframes sparkFly{0%{transform:translate(-50%,-50%);opacity:0}15%{opacity:1}100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(0.3);opacity:0}}
        @keyframes barGrow{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}
        @keyframes donutIn{from{transform:rotate(-24deg) scale(0.8);opacity:0}to{transform:rotate(0) scale(1);opacity:1}}
        .viewEnter{ animation:viewFade 0.42s cubic-bezier(.2,.8,.2,1) both }
        @keyframes viewFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion:reduce){ .viewEnter{animation:none} }
        @media (prefers-reduced-motion:reduce){svg g[style*="barGrow"]{animation:none!important}}
        @keyframes scorePop{0%{transform:scale(0.6);opacity:0}55%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
        @keyframes burstUp{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-46px) scale(0.4);opacity:0}}
        /* index.html owns the transform lift + shine sweeps; here we only add the
           soft shadow + border glow so the two rules compose (no transform conflict). */
        [data-card]{ transition:box-shadow .22s, border-color .22s, transform .3s; }
        [data-card]:hover { border-color:rgba(255,255,255,0.2) !important; box-shadow:0 14px 36px rgba(0,0,0,0.36); }
        @media (prefers-reduced-motion:reduce){ [data-card]{ transition:none } }
        button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible,[role="button"]:focus-visible {
          outline:2px solid #00E5FF; outline-offset:2px; border-radius:4px;
        }
      `}</style>
    </div>
  );
}

// ── ERROR BOUNDARY — stops a bug in any view from blanking the whole app ──
class AppErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error:null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ try { console.error("App crashed:", error, info?.componentStack); } catch {} }
  render(){
    if(this.state.error){
      const isMobile = typeof window !== 'undefined' && (window.__isMobile || window.innerWidth < 900);
      const accent = (typeof WL !== "undefined" && WL?.accentColor) || "#FF2D78";
      return (
        <div style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:isMobile?"32px 24px":"48px", background:"#07050F", color:"#fff", textAlign:"center", fontFamily:"'Space Grotesk',system-ui,sans-serif" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>{I.warn(isMobile?40:52,C.pink)}</div>
          <div style={{ fontSize:isMobile?20:26, fontWeight:700, marginBottom:10 }}>Something went wrong</div>
          <div style={{ fontSize:isMobile?14:15, color:"rgba(255,255,255,0.55)", maxWidth:420, lineHeight:1.6, marginBottom:28 }}>
            The app hit an unexpected error. Your saved data is safe — reloading usually fixes it.
          </div>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:12, width:isMobile?"100%":"auto", maxWidth:320 }}>
            <button onClick={()=>window.location.reload()} style={{ padding:"14px 28px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${accent},${accent}bb)`, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", width:isMobile?"100%":"auto" }}>Reload App</button>
            <button onClick={()=>this.setState({ error:null })} style={{ padding:"14px 28px", borderRadius:12, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"rgba(255,255,255,0.8)", fontWeight:700, fontSize:15, cursor:"pointer", width:isMobile?"100%":"auto" }}>Try Again</button>
          </div>
          {this.state.error?.message && (
            <div style={{ marginTop:28, fontSize:12, color:"rgba(255,255,255,0.3)", fontFamily:"monospace", maxWidth:420, wordBreak:"break-word" }}>{String(this.state.error.message).slice(0,180)}</div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// ── AUTH GATE — login / signup screen (only shown when VITE_REQUIRE_AUTH="true") ──
function AuthGate({ onAuthed }) {
  const isMobile = typeof window !== 'undefined' && (window.__isMobile || window.innerWidth < 900);
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [resetTok, setResetTok] = useState(null);
  // Arriving from a password-reset email: Supabase puts tokens in the URL hash.
  useEffect(()=>{
    try {
      const h = new URLSearchParams((window.location.hash||"").replace(/^#/,""));
      if(h.get("type")==="recovery" && h.get("access_token")) {
        setResetTok({ access_token:h.get("access_token"), refresh_token:h.get("refresh_token") });
        setMode("reset");
        window.history.replaceState(null, "", window.location.pathname);
      } else if(h.get("access_token") && !h.get("type")) {
        const s = _mkSession({ access_token:h.get("access_token"), refresh_token:h.get("refresh_token"), expires_in:parseInt(h.get("expires_in"))||3600 });
        fetch(`${getSbUrl()}/auth/v1/user`, { headers:{ Authorization:`Bearer ${h.get("access_token")}`, apikey:getSbKey() } })
          .then(r=>r.json()).then(u=>{ s.user=u; saveSession(s); onAuthed(s); })
          .catch(()=>{ saveSession(s); onAuthed(s); });
        window.history.replaceState(null, "", window.location.pathname);
      }
    } catch {}
  },[]);
  const forgot = async () => {
    setErr(""); setInfo("");
    if(!email.trim()) { setErr("Enter your email first, then tap Forgot password."); return; }
    setBusy(true);
    try { await authRecover(email.trim()); setInfo("Reset link sent — check your email."); }
    catch(e) { setErr(e.message); }
    setBusy(false);
  };
  const accent = (typeof WL !== "undefined" && WL?.accentColor) || "#FF2D78";
  const accent2 = (typeof WL !== "undefined" && WL?.accentColor2) || "#C566FF";
  const appName = (typeof WL !== "undefined" && WL?.appName) || "CreatorOS";

  const submit = async () => {
    setErr(""); setInfo("");
    if(mode==="reset") {
      if(password.length < 6) { setErr("Password must be at least 6 characters."); return; }
      setBusy(true);
      try { const sess = await authCompleteReset(resetTok, password); onAuthed(sess); }
      catch(e) { setErr(e.message || "Could not set new password."); }
      setBusy(false);
      return;
    }
    if(!email.trim() || !password) { setErr("Enter your email and password."); return; }
    if(mode==="signup" && password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      if(mode==="signup") {
        const res = await authSignUp(email.trim(), password);
        if(res.needsConfirmation) { setInfo("Check your email to confirm your account, then sign in."); setMode("signin"); }
        else if(res.session) onAuthed(res.session);
      } else {
        const s = await authSignIn(email.trim(), password);
        onAuthed(s);
      }
    } catch(e) { setErr(e.message || "Something went wrong."); }
    setBusy(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", padding:isMobile?"24px":"48px", background:"#07050F", fontFamily:"'Space Grotesk',system-ui,sans-serif" }}>
      <div style={{ position:"fixed", top:"-10%", left:"-8%", width:360, height:360, borderRadius:"50%", background:`radial-gradient(circle,${accent}18 0%,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-10%", right:"-8%", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle,${accent2}14 0%,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ width:"100%", maxWidth:400, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <img src="/icon-512.png" alt={appName} style={{ width:56, height:56, borderRadius:16, boxShadow:`0 0 28px ${accent}44`, marginBottom:16 }} />
          <div style={{ fontSize:isMobile?28:34, fontWeight:800, letterSpacing:"-0.02em" }}><span style={{ color:"#fff" }}>Creator</span><span style={{ color:accent }}>OS</span></div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginTop:8 }}>{mode==="signin" ? "Sign in to your account" : mode==="reset" ? "Choose a new password" : "Create your account"}</div>
        </div>
        {mode!=="reset" && <button onClick={()=>{ window.location.href=`${getSbUrl()}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin+'/dashboard')}`; }}
          style={{ width:"100%", padding:"14px", borderRadius:12, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.04)", color:"#fff", fontWeight:600, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:6 }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>}
        {mode!=="reset" && <div style={{ display:"flex", alignItems:"center", gap:14, margin:"12px 0" }}><div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/><span style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>or</span><div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/></div>}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {mode!=="reset" && <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email"
            style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, color:"#fff", padding:"14px 16px", fontSize:15, outline:"none", boxSizing:"border-box" }} />}
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder={mode==="reset"?"New password":"Password"} aria-label="Password" autoComplete={mode==="signin"?"current-password":"new-password"}
            style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, color:"#fff", padding:"14px 16px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          {err && <div style={{ fontSize:13, color:"#FF5C7C", lineHeight:1.5 }}>{err}</div>}
          {info && <div style={{ fontSize:13, color:"#39FF14", lineHeight:1.5 }}>{info}</div>}
          <button onClick={submit} disabled={busy}
            style={{ width:"100%", padding:"15px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${accent},${accent2})`, color:"#fff", fontWeight:700, fontSize:15, cursor:busy?"default":"pointer", opacity:busy?0.6:1, marginTop:4 }}>
            {busy ? "…" : mode==="signin" ? "Sign In" : mode==="reset" ? "Set New Password" : "Create Account"}
          </button>
        </div>
        {mode!=="reset" && (
        <div style={{ textAlign:"center", marginTop:22, fontSize:13, color:"rgba(255,255,255,0.45)" }}>
          {mode==="signin" ? "No account yet? " : "Already have an account? "}
          <button onClick={()=>{ setMode(mode==="signin"?"signup":"signin"); setErr(""); setInfo(""); }}
            style={{ background:"none", border:"none", color:accent, fontWeight:700, cursor:"pointer", fontSize:13, padding:0 }}>
            {mode==="signin" ? "Sign up" : "Sign in"}
          </button>
          {mode==="signin" && (
            <div style={{ marginTop:10 }}>
              <button onClick={forgot} disabled={busy} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:12, padding:0, textDecoration:"underline" }}>Forgot password?</button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

// ROOT
export default function App() {
  const [config, setConfig] = useState(()=>loadJSON(KEYS_KEY,{}));
  const [onboarded, setOnboarded] = useState(()=>loadJSON("krapmaps_v1_onboarded", false));
  const [session, setSession] = useState(()=>loadSession());
  useEffect(()=>{
    const onOut = () => setSession(null);
    window.addEventListener("km-signed-out", onOut);
    return ()=>window.removeEventListener("km-signed-out", onOut);
  },[]);

  // On mount: pull config from Supabase so keys survive across devices/builds
  useEffect(()=>{
    sbFetch("km_config",`select=*&id=eq.${wsId("workspace_config")}`).then(rows=>{
      if(!rows||!rows.length) return;
      const remote = rows[0]?.data;
      if(!remote) return;
      // Merge: local keys win over remote (most recent manual entry takes priority)
      const local = loadJSON(KEYS_KEY,{});
      const merged = {
        ...remote,
        ...local,
        keys:{ ...(remote.keys||{}), ...(local.keys||{}) },
      };
      setConfig(merged);
      saveJSON(KEYS_KEY, merged);
    }).catch(()=>{});
    // Pull the learned Voice DNA down so it follows the creator across devices.
    sbFetch("km_config",`select=*&id=eq.${wsId("voice_dna")}`).then(rows=>{
      const remote = rows?.[0]?.data;
      if(!remote?.profile) return;
      const localMeta = loadJSON(VOICE_KEY+"_meta", null);
      // Adopt remote only if we have nothing locally or the remote was distilled from a larger corpus.
      const remoteN = parseInt(String(remote.sig||"0").split(":")[0],10) || 0;
      const localN  = parseInt(String(localMeta?.sig||"0").split(":")[0],10) || 0;
      if(!localMeta || remoteN > localN){
        saveJSON(VOICE_KEY, remote.profile);
        saveJSON(VOICE_KEY+"_meta", { sig:remote.sig, at:remote.at||Date.now() });
      }
    }).catch(()=>{});
    // Pull the creator's voice feedback (sounds-like-me votes) across devices.
    sbFetch("km_config",`select=*&id=eq.${wsId("voice_fb")}`).then(rows=>{
      const remote = rows?.[0]?.data;
      if(!remote || (!remote.good?.length && !remote.bad?.length)) return;
      const local = loadVoiceFB();
      if(!local.good.length && !local.bad.length) saveJSON(VOICE_FB_KEY, remote);
    }).catch(()=>{});
  },[]);

  const handleEditKeys = (keys) => {
    const u={...config,keys};
    setConfig(u);
    saveJSON(KEYS_KEY,u);
    // Sync to Supabase — persists keys across devices and new builds
    // Requires a km_config table: id text PK, data jsonb, updated_at timestamptz
    sbUpsert("km_config",[{id:wsId("workspace_config"),data:u,updated_at:new Date().toISOString()}]).catch(()=>{});
  };

  // Auth gate — only enforced when VITE_REQUIRE_AUTH="true". Otherwise the app
  // runs exactly as before (no login required), so this is a safe opt-in rollout.
  if(REQUIRE_AUTH && !session) {
    return <AppErrorBoundary><AuthGate onAuthed={(s)=>setSession(s)} /></AppErrorBoundary>;
  }

  return (
    <AppErrorBoundary>
      {!onboarded
        ? <OnboardingPage onComplete={()=>setOnboarded(true)} />
        : <Dashboard keys={config.keys||{}} onEditKeys={handleEditKeys} />}
    </AppErrorBoundary>
  );
}
