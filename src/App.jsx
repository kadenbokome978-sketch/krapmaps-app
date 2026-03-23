import { useState, useEffect, useCallback, useRef } from "react";

// Inject styles + fonts
if(typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}.loading-pulse{animation:pulse 1.5s ease-in-out infinite}input::placeholder,textarea::placeholder{color:#7A5A8A!important;opacity:1}input,textarea,select{color-scheme:dark}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}::-webkit-scrollbar{display:none}";
  document.head.appendChild(style);
}
// Inject fonts
if(typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sora:wght@600;700;800;900&family=Barlow:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
}

// ─── DEVICE DETECTION ─────────────────────────────────────────────────────────
function useDevice() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 390);
  useEffect(()=>{
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  },[]);
  const phone  = w < 480;
  const tablet = w >= 480 && w < 900;
  const desktop = w >= 900;
  return { w, phone, tablet, desktop,
    // Responsive helpers
    cols4: phone ? "repeat(2,1fr)" : "repeat(4,1fr)",
    cols2: phone ? "1fr" : "1fr 1fr",
    pad: phone ? "12px 14px" : "18px 20px",
    padSm: phone ? "10px 12px" : "14px 16px",
    gap: phone ? 8 : 12,
    gapSm: phone ? 6 : 8,
    fs: {
      title: phone ? 18 : 22,
      body: phone ? 12 : 13,
      label: phone ? 8 : 9,
      number: phone ? 22 : 28,
    }
  };
}

const C = {
  pink:"#FF2D78", pinkDark:"#D4235F", pinkLight:"#FF6BA8", pinkBg:"#1A0520",
  cyan:"#00CFFF", yellow:"#FFD60A", green:"#00FF94", orange:"#FF6B35", purple:"#C566FF",
  bg:"#080010", card:"#100018", cardAlt:"#16001F",
  border:"#1E0030", borderStrong:"#FF2D7850",
  muted:"#2D0840", mutedText:"#C890B0",
  text:"#F8EEFF", textMed:"#E8C8DC", dim:"#B070A0",
  // Fonts
  fontHead:"'Bebas Neue', cursive",
  fontBody:"'Barlow', sans-serif",
  fontMono:"'DM Mono', monospace",
};


// ─── WHITE LABEL CONFIG ───────────────────────────────────────────────────────
// Change these values to rebrand for any client
const WL = {
  appName:      "KrapMaps",          // Dashboard title
  tagline:      "Content OS",        // Subtitle
  handle:       "@findkrap",         // Social handle
  platform:     "TikTok",            // Primary platform
  niche:        "app",               // Content niche
  creator1:     "Bk",                // Creator 1 name
  creator2:     "Harley",            // Creator 2 name
  accentColor:  "#FF2D78",           // Primary brand colour (hex)
  accentColor2: "#C566FF",           // Secondary colour
  logoEmoji:    null,                // Set to emoji e.g. "🎵" or null for default icon
  // AI context -- describe what the brand/product does
  brandContext: "KrapMaps is a gamified bin-finding app. Users map bin locations and compete on leaderboards.",
};

// Override C.pink with WL accent if different
if (WL.accentColor !== "#FF2D78" && typeof document !== "undefined") {
  document.documentElement.style.setProperty("--wl-accent", WL.accentColor);
}


// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  home:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  content:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  analytics:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  growth:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  plus:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg>,
  video:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23,7 16,12 23,17 23,7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  star:     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>,
  tiktok:   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>,
  bin:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><rect x="5" y="6" width="14" height="14" rx="1"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  bolt:     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>,
  eye:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  heart:    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  refresh:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  check:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  camera:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  idea:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  target:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  send:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9 22,2"/></svg>,
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  rocket:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  fire:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  warning:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  ok:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>,
  apple:    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
  instagram:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  clip:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  wand:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>,
  map:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  loader:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
};
const KEYS_KEY    = "krapmaps_v1_config";
const MANUAL_KEY  = "krapmaps_v1_manual";
const VIDEOS_KEY  = "krapmaps_v1_videos";
const IDEAS_KEY   = "krapmaps_v1_ideas";
const CAL_KEY     = "krapmaps_v1_calendar";
const TRENDS_KEY  = "krapmaps_v1_trends";
const TASKS_KEY   = "krapmaps_v1_tasks";
const APPIDEAS_KEY  = "krapmaps_v1_appideas";
const ANALYSIS_KEY  = "krapmaps_v1_analysis";
const NEXTVIDS_KEY  = "krapmaps_v1_nextvids";
const WEEKLY_KEY    = "krapmaps_v1_weekly";
const TRENDS_KEY2   = "krapmaps_v1_trends2";

const SYNC_KEY   = "krapmaps_v1_syncurl";
const SB_URL_KEY = "krapmaps_sb_url";
const SB_KEY_KEY = "krapmaps_sb_key";

// Supabase hardcoded defaults (can be overridden in settings)
const DEFAULT_SB_URL = "https://xiudsyiinkqtmowkiqxh.supabase.co";
const ANTHROPIC_KEY = "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";
const DEFAULT_SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWRzeWlpbmtxdG1vd2tpcXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzU5OTcsImV4cCI6MjA4OTQ1MTk5N30.8aHpQIcEcrDXo9DJN52SWAOee-rrkp-ti00h72-_sZE";

const loadJSON = (k,fb) => { try { return JSON.parse(localStorage.getItem(k))||fb; } catch { return fb; } };
const saveJSON = (k,d)  => { try { localStorage.setItem(k,JSON.stringify(d)); } catch {} };

// Supabase DB layer
const getSbUrl = () => localStorage.getItem(SB_URL_KEY) || DEFAULT_SB_URL;
const getSbKey = () => localStorage.getItem(SB_KEY_KEY) || DEFAULT_SB_KEY;

async function sbGet(table) {
  try {
    const res = await fetch(getSbUrl() + "/rest/v1/" + table + "?order=updated_at.desc&limit=1", {
      headers: {
        "apikey": getSbKey(),
        "Authorization": "Bearer " + getSbKey(),
        "Content-Type": "application/json",
      }
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data[0].value;
    return null;
  } catch(e) { return null; }
}

async function sbSet(table, value) {
  try {
    // Upsert with id=1 so we always have one row per table
    await fetch(getSbUrl() + "/rest/v1/" + table, {
      method: "POST",
      headers: {
        "apikey": getSbKey(),
        "Authorization": "Bearer " + getSbKey(),
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ id: 1, value: JSON.stringify(value), updated_at: new Date().toISOString() })
    });
  } catch(e) { /* silently fail, localStorage is backup */ }
}

async function sbInit() {
  // Create tables if they don't exist via RPC - tables created in Supabase dashboard
  // We just try to read and fall back to localStorage if tables don't exist yet
}

const HOOK_TYPES  = ["edgy/controversial","problem->solution","gamification","achievement","challenge","reaction","demo","other"];
const VIDEO_TYPES = ["facecam","street","screencap","voiceover","mixed"];
const STATUSES    = ["idea","scripted","filming","editing","scheduled","posted"];
const STATUS_C    = { idea:C.mutedText, scripted:C.purple, filming:C.yellow, editing:C.orange, scheduled:C.cyan, posted:C.green };

const fmt   = n => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n||0);
const igViews = p => p.video_views||p.plays||p.reach||null;
const ratio = v => v.views>0?((v.likes/v.views)*100):0;
const perfScore = v => {
  try {
    if(!v._updated||!v.views) return null;
    const r = ratio(v);
    // Ratio score 0-40: 25%+ = perfect, 10% = good, 2% = weak
    const ratioScore = Math.min(40, r * 1.6);
    // View score 0-40: organic only, log scale
    const viewBase = v.promoted ? v.views * 0.15 : v.views;
    const viewScore = Math.min(40, Math.log10(Math.max(viewBase,1)) * 13);
    // Comment rate 0-20
    const commentRate = v.views>0?(v.comments/v.views)*100:0;
    const commentScore = Math.min(20, commentRate * 80);
    const score = Math.round(ratioScore + viewScore + commentScore);
    const label = score>=80?"VIRAL":score>=65?"STRONG":score>=50?"DECENT":score>=35?"WEAK":"FLOPPED";
    return { score, label };
  } catch(e) { return null; }
};
const getDaysUntil = d => { const target = new Date(d); const now = new Date(); now.setHours(0,0,0,0); return Math.ceil((target-now)/(1000*60*60*24)); };
const today = () => new Date().toISOString().slice(0,10);

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function Tag({ children, color=C.pink, size=10 }) {
  return <span style={{ background:color+"15", color, border:`1px solid ${color}35`, borderRadius:20, padding:"2px 10px", fontSize:size, fontWeight:600, fontFamily:C.fontBody, whiteSpace:"nowrap", letterSpacing:"0.03em" }}>{children}</span>;
}

function StatCard({ label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ background:`linear-gradient(135deg, ${C.card} 0%, ${color}08 100%)`, border:`1px solid ${color}30`, borderRadius:14, padding:"14px 16px", position:"relative", overflow:"hidden", cursor:onClick?"pointer":"default", boxShadow:`0 2px 12px ${color}12` }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${color}, ${color}00)` }} />
      <div style={{ position:"absolute", top:0, right:0, width:60, height:60, background:`radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
      <div style={{ color:color+"99", fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, marginBottom:6, fontWeight:700 }}>{label}</div>
      <div style={{ color, fontSize:26, fontWeight:400, fontFamily:C.fontHead, lineHeight:1, textShadow:`0 0 16px ${color}40`, letterSpacing:"0.06em" }}>{value}</div>
      {sub && <div style={{ color:C.dim, fontSize:10, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function Btn({ children, onClick, color=C.pink, disabled=false, outline=false, small=false, full=false }) {
  const isLoading = typeof children === "string" && (children.includes("...") || children.includes("Analysing") || children.includes("Generating") || children.includes("Writing"));
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline?color+"15":disabled?C.muted:color,
      border:`1px solid ${disabled?C.muted:color}${outline?"80":""}`,
      color: outline?color:[C.yellow,C.green,C.cyan].includes(color)?C.bg:"#fff",
      padding:small?"6px 14px":"10px 20px", borderRadius:10,
      fontFamily:C.fontBody, fontWeight:700, fontSize:small?11:13,
      cursor:disabled?"not-allowed":"pointer", whiteSpace:"nowrap", width:full?"100%":"auto",
      opacity:disabled&&!isLoading?0.5:1,
      transition:"all 0.2s",
    }} className={isLoading?"loading-pulse":""}>{children}</button>
  );
}

function FInput({ label, value, onChange, type="text", placeholder, textarea, rows=3, color=C.pink }) {
  const [f,setF] = useState(false);
  const s = { width:"100%", background:C.cardAlt, border:`1px solid ${f?color+"80":C.border}`, borderRadius:10, color:C.text, padding:"10px 14px", fontSize:16, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box", transition:"all 0.2s", boxShadow:f?`0 0 0 3px ${color}12`:"none" };
  return (
    <div>
      {label && <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", marginBottom:5, fontFamily:C.fontBody }}>{label}</div>}
      {textarea
        ? <textarea rows={rows} placeholder={placeholder} value={value||""} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...s,resize:"vertical"}} />
        : <input type={type} placeholder={placeholder} value={value||""} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={s} />}
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth=500 }) {
  const isPhone = typeof window !== "undefined" && window.innerWidth < 480;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:200, display:"flex", alignItems:isPhone?"flex-end":"center", justifyContent:"center", padding:isPhone?0:20 }} onClick={onClose}>
      <div style={{ background:C.card, border:`1px solid ${C.borderStrong}`, borderRadius:isPhone?"18px 18px 0 0":18, padding:isPhone?16:22, width:"100%", maxWidth:isPhone?"100%":maxWidth, maxHeight:isPhone?"88vh":"90vh", overflowY:"auto", boxShadow:`0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px ${C.borderStrong}` }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:C.text, fontSize:20, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.04em" }}>{title}</div>
          <button onClick={onClose} style={{ background:C.muted+"40", border:`1px solid ${C.border}`, color:C.dim, cursor:"pointer", borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ScoreRing({ score, color, label, size=52 }) {
  const r=(size-8)/2, circ=2*Math.PI*r, safeScore=isNaN(score)||score==null?0:score, scoreNorm=safeScore>10?safeScore/10:safeScore, dash=(scoreNorm/10)*circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.muted} strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
        <text x={size/2} y={size/2+4} textAnchor="middle" fill={color} fontSize="11" fontWeight="800" fontFamily="Bebas Neue, sans-serif">{isNaN(safeScore)?0:safeScore}</text>
      </svg>
      <div style={{ color:C.dim, fontSize:9, fontFamily:C.fontBody }}>{label}</div>
    </div>
  );
}

function ChipGroup({ label, options, value, onChange, color=C.pink }) {
  return (
    <div>
      {label && <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.12em", marginBottom:6, fontFamily:C.fontBody, fontWeight:700 }}>{label}</div>}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {options.map(o => (
          <button key={o} onClick={()=>onChange(o)} style={{ padding:"5px 10px", borderRadius:7, cursor:"pointer", fontSize:10, background:value===o?color+"20":"transparent", border:`1px solid ${value===o?color:C.border}`, color:value===o?color:"#fff", fontFamily:C.fontBody, fontWeight:600, letterSpacing:"0.02em", opacity:value===o?1:0.6, textTransform:"uppercase" }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

// ─── AI ───────────────────────────────────────────────────────────────────────
const SYSTEM = `You are the growth strategist for KrapMaps. Here is the full app context:

WHAT IT IS: KrapMaps is a community-driven public bin mapping app. Users photograph and pin bin locations on a live map. The community verifies pins to keep data accurate. Available on iOS and Android across 1,200+ cities including Thailand, Spain, UK, Bali, Vietnam, Philippines. Target users: travelers, backpackers, digital nomads, expats, eco-conscious people -- anyone who has been walking around a new city holding rubbish with no idea where the nearest bin is.

GAMIFICATION: Points and Streaks (earn points for adding/verifying bins, daily streaks from 3 to 365 days with milestone rewards). Daily and Weekly Challenges (add a bin with photo, verify 3 bins, map in 5 different cities). 27 Achievements across Bronze through Legendary tiers for bins mapped, points earned, cities explored. Global and friends Leaderboards with Ranks. Duo Streaks (partner with a friend, both map a bin daily). 

MINI-GAMES (3 arcade games with their own leaderboards and 5 lives/day free, 10 lives/day premium): Bin Catcher (catch falling trash in a bin, speed increases), Bin Lob (physics-based, lob trash into a shrinking distant bin), Bin Guesser (guess which country a bin photo is from, 10-second timer with hints).

SOCIAL: Add friends, compare stats, track progress. Team Crimson vs Team Azure monthly competitions. Community goals that unlock rewards for everyone.

REWARDS: Redeem points for Amazon vouchers ($5-$500), double-points boosts, giveaway entries. Monthly giveaways including iPhone draws. Earn giveaway tickets through challenges and streaks.

CUSTOMISATION: 9 free app themes (Bubblegum Pink, Midnight Dark, Ocean Deep, Golden Sunset, Forest Green, Neon Electric, Arctic Frost, Desert Oasis, Krap Dark). Custom username colors, profile emojis, profile photos.

MASCOT: Krap the Snow Monkey -- cute mascot with moods (happy, celebrating, sad, thinking, running, sleeping) that appears for achievements, alerts, and guidance.

CONTENT TEAM: Harley films in Thailand, Bk edits and strategises in UK. TikTok: @findkrap. Also active on Instagram.

TIKTOK STRATEGY: Best formula: Problem (holding rubbish, no bin in sight) -> struggle -> KrapMaps saves the day -> satisfied reaction. Best hook types: achievement and challenge consistently outperform. Best formats: street facecam and screencap gamification content. Hook must land in 1-2 seconds. Best performing videos reference the app solving a real problem, showing gamification features, or street reactions.

INSTAGRAM STRATEGY: More polished, community-focused, behind-the-scenes, aesthetic bin photography, before/after maps, achievement showcases, UGC reposts.

UPCOMING: Songkran festival April 13-15 2026 in Thailand -- major activation opportunity. Water festival means massive outdoor activity, lots of rubbish, perfect KrapMaps moment.

CONTENT ANGLES THAT WORK: Bin finding in unfamiliar cities, gamification achievements, team competitions, mini-game challenges, streak milestones, bin photography from unusual countries, comparing bin quality across cities, reactions to finding/not finding bins, app download CTAs with problem-solution format.

Respond ONLY with valid JSON -- no markdown, no preamble.`;
async function callAI(prompt, maxTokens=2000) {
  const headers = {"Content-Type":"application/json"};
  const isVercel = window.location.hostname.includes("vercel.app") || window.location.hostname.includes("krapmaps");
  const apiUrl = isVercel ? "/api/proxy" : "https://api.anthropic.com/v1/messages";
  if(!isVercel) { headers["x-api-key"] = ANTHROPIC_KEY; headers["anthropic-version"] = "2023-06-01"; headers["anthropic-dangerous-direct-browser-access"] = "true"; }
  const res = await fetch(apiUrl, {
    method:"POST", headers,
    body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens||2000, system:SYSTEM, messages:[{role:"user",content:prompt}] }),
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch(e) { throw new Error("Invalid response: " + raw.slice(0,100)); }
  if(data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = data.content?.map(b=>b.text||"").join("")||"";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

// ─── SETUP ────────────────────────────────────────────────────────────────────
function SetupScreen({ onSave, existingKeys={} }) {
  const [keys, setKeys] = useState({ ig:"", apple_key_id:"", apple_issuer:"", apple_p8:"", play:"", ...existingKeys });
  const [show, setShow] = useState({});
  const platforms = [
    { id:"Instagram", color:C.pink, icon:Icon.instagram, desc:"Meta Developer Console -> Instagram Basic Display -> Access Token", fields:[{key:"ig",label:"Instagram Access Token"}], url:"https://developers.facebook.com/docs/instagram-basic-display-api/getting-started" },
    { id:"App Store", color:C.cyan, icon:Icon.apple, desc:"App Store Connect -> Users & Access -> Keys -> Generate API Key", fields:[{key:"apple_key_id",label:"Key ID"},{key:"apple_issuer",label:"Issuer ID"},{key:"apple_p8",label:"Private Key (.p8)",textarea:true}], url:"https://developer.apple.com/documentation/appstoreconnectapi" },
    { id:"Google Play", color:C.green, icon:"▶️", desc:"Play Console -> Setup -> API Access -> Service Account -> JSON key", fields:[{key:"play",label:"Service Account JSON",textarea:true}], url:"https://developers.google.com/android-publisher/getting_started" },
  ];
  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(180deg,${C.pinkBg} 0%,${C.bg} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@800;900;1000&family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ width:"100%", maxWidth:580 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ marginBottom:12, color:C.pink, filter:`drop-shadow(0 0 20px ${C.pink})` }}><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><rect x="5" y="6" width="14" height="14" rx="1"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></div>
          <div style={{ color:C.pink, fontSize:28, fontWeight:900, fontFamily:C.fontHead, letterSpacing:"-0.02em", display:"flex", alignItems:"center", gap:8 }}><span>{Icon.bin}</span>KrapMaps</div><div style={{ color:C.textMed, fontSize:15, fontWeight:700, fontFamily:C.fontBody, marginTop:4 }}>Content OS</div>
          <div style={{ color:C.dim, fontSize:11, letterSpacing:"0.12em", fontFamily:C.fontBody, marginTop:6 }}>CONNECT YOUR PLATFORMS</div>
          <div style={{ color:C.dim, fontSize:12, marginTop:12, lineHeight:1.7 }}>Leave blank and skip -- you can add keys any time from Settings.</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:22 }}>
          {platforms.map(({ id, color, icon, desc, fields:fs, url }) => (
            <div key={id} style={{ background:C.card, border:`1px solid ${C.borderStrong}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${color}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:17 }}>{icon}</span><div style={{ color:C.text, fontSize:14, fontWeight:800, fontFamily:C.fontBody }}>{id}</div></div>
                <a href={url} target="_blank" rel="noreferrer" style={{ color, fontSize:10, fontFamily:C.fontBody, textDecoration:"none" }}>How to get ↗</a>
              </div>
              <div style={{ color:C.dim, fontSize:11, marginBottom:10, lineHeight:1.5 }}>{desc}</div>
              {fs.map(f => (
                <div key={f.key} style={{ marginBottom:7 }}>
                  <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.08em", marginBottom:3, fontFamily:C.fontBody }}>{f.label}</div>
                  {f.textarea
                    ? <textarea rows={2} placeholder={`Paste ${f.label}...`} value={keys[f.key]||""} onChange={e=>setKeys(k=>({...k,[f.key]:e.target.value}))} style={{ width:"100%", background:C.bg, border:`1px solid ${keys[f.key]?color+"66":C.border}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:11, fontFamily:C.fontMono, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
                    : <div style={{ position:"relative" }}>
                        <input type={show[f.key]?"text":"password"} placeholder={`Paste ${f.label}...`} value={keys[f.key]||""} onChange={e=>setKeys(k=>({...k,[f.key]:e.target.value}))} style={{ width:"100%", background:C.bg, border:`1px solid ${keys[f.key]?color+"66":C.border}`, borderRadius:8, color:C.text, padding:"8px 34px 8px 12px", fontSize:12, fontFamily:C.fontMono, outline:"none", boxSizing:"border-box" }} />
                        <button onClick={()=>setShow(s=>({...s,[f.key]:!s[f.key]}))} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:12 }}>{show[f.key]?"🙈":"👁"}</button>
                      </div>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={()=>onSave(keys)} style={{ width:"100%", background:C.pink, border:"none", color:"#fff", padding:"14px", borderRadius:12, fontFamily:C.fontBody, fontWeight:800, fontSize:15, cursor:"pointer", boxShadow:`0 6px 24px ${C.pink}55`, letterSpacing:"-0.01em" }}>Launch Dashboard /</button>
        <div style={{ textAlign:"center", color:C.dim, fontSize:10, marginTop:8 }}>Keys stored locally in your browser only.</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function Dashboard({ keys, onEditKeys }) {
  const D = useDevice();
  const [nav, setNav]             = useState("home");
  const [sub, setSub]             = useState(null);

  // Data
  const [manualData, setManualData] = useState(()=>loadJSON(MANUAL_KEY,{}));
  const [videos, setVideos]         = useState(()=>loadJSON(VIDEOS_KEY,[]));
  const [ideas, setIdeas]           = useState(()=>loadJSON(IDEAS_KEY,[]));
  const [calItems, setCalItems]     = useState(()=>loadJSON(CAL_KEY,[]));
  const [trends, setTrends]         = useState(()=>loadJSON(TRENDS_KEY,null));
  const [tasks, setTasks]           = useState(()=>loadJSON(TASKS_KEY,[]));
  const [appIdeas, setAppIdeas]     = useState(()=>loadJSON(APPIDEAS_KEY,[]));

  // IG
  const [igData, setIgData]   = useState(null);
  const [igError, setIgError] = useState(null);
  const [igLoad, setIgLoad]   = useState(false);

  // Auto-sync
  const [syncUrl, setSyncUrl]       = useState(()=>localStorage.getItem(SYNC_KEY)||"");
  const [syncData, setSyncData]     = useState(null);
  const [syncing, setSyncing]       = useState(false);
  const [lastSync, setLastSync]     = useState(null);
  const [syncErr, setSyncErr]       = useState(null);

  // Auto-sync on load and every 30 mins
  useEffect(()=>{
    if(syncUrl) fetchSync();
    const interval = setInterval(()=>{ if(syncUrl) fetchSync(); }, 30*60*1000);
    return ()=>clearInterval(interval);
  },[syncUrl]);

  async function fetchSync() {
    if(!syncUrl) return;
    setSyncing(true); setSyncErr(null);
    try {
      const res = await fetch(syncUrl+"?t="+Date.now()); // bust cache
      if(!res.ok) throw new Error("HTTP "+res.status);
      const data = await res.json();
      setSyncData(data);
      setLastSync(new Date());
      // Auto-populate manual stats from TikTok scrape
      if(data.tiktok?.account) {
        const acc = data.tiktok.account;
        setManualData(d=>({...d,
          tt_followers: acc.followers||d.tt_followers,
          tt_views:     acc.total_views||d.tt_views,
          tt_likes:     acc.total_likes||d.tt_likes,
          tt_date:      new Date().toISOString().slice(0,10),
        }));
      }
    } catch(e) { setSyncErr(e.message); }
    setSyncing(false);
  }

  function saveSyncUrl(url) {
    setSyncUrl(url);
    localStorage.setItem(SYNC_KEY, url);
  }

  // AI results
  const [analysis, setAnalysis]     = useState(()=>loadJSON(ANALYSIS_KEY,null));
  const [nextVids, setNextVids]     = useState(()=>loadJSON(NEXTVIDS_KEY,null));
  const [weekly, setWeekly]         = useState(()=>loadJSON(WEEKLY_KEY,null));
  const [captionResult, setCaptionResult] = useState(()=>loadJSON("krapmaps_v1_caption",null));
  const [captionIdea, setCaptionIdea]     = useState(()=>loadJSON("krapmaps_v1_captionidea",null));

  // UI
  const [draft, setDraft]           = useState({});
  const [aiLoad, setAiLoad]         = useState({});
  const [aiErr, setAiErr]           = useState(null);
  const [modals, setModals]         = useState({});
  const [tasksTab, setTasksTab]       = useState("todo");
  const [updateTarget, setUpdateTarget] = useState(null);
  const [copied, setCopied]         = useState({});

  // Save to both localStorage AND Supabase on every change
  const [sbLoaded, setSbLoaded] = useState(false);
  useEffect(()=>{
    // Dedupe before saving to prevent accumulation
    const seen=new Set(); const deduped=videos.filter(v=>{ const id=String(v.id||''); if(seen.has(id)) return false; seen.add(id); return true; });
    if(deduped.length!==videos.length) { setVideos(deduped); return; }
    saveJSON(VIDEOS_KEY,videos); if(sbLoaded) sbSet("km_videos",videos).catch(()=>{});
  },[videos, sbLoaded]);
  useEffect(()=>{ saveJSON(IDEAS_KEY,ideas); sbSet("km_ideas",ideas).catch(()=>{}); },[ideas]);
  useEffect(()=>{ saveJSON(CAL_KEY,calItems); sbSet("km_calendar",calItems).catch(()=>{}); },[calItems]);
  useEffect(()=>{ saveJSON(MANUAL_KEY,manualData); sbSet("km_manual",manualData).catch(()=>{}); },[manualData]);
  useEffect(()=>{ if(trends){ saveJSON(TRENDS_KEY,trends); sbSet("km_trends",trends).catch(()=>{}); } },[trends]);
  useEffect(()=>{ if(analysis) saveJSON(ANALYSIS_KEY,analysis); },[analysis]);
  useEffect(()=>{ if(captionResult) saveJSON("krapmaps_v1_caption",captionResult); },[captionResult]);
  useEffect(()=>{ if(captionIdea) saveJSON("krapmaps_v1_captionidea",captionIdea); },[captionIdea]);
  useEffect(()=>{ if(nextVids) saveJSON(NEXTVIDS_KEY,nextVids); },[nextVids]);
  useEffect(()=>{ if(weekly) saveJSON(WEEKLY_KEY,weekly); },[weekly]);
  useEffect(()=>{ saveJSON(TASKS_KEY,tasks); sbSet("km_tasks",tasks).catch(()=>{}); },[tasks]);
  useEffect(()=>{ saveJSON(APPIDEAS_KEY,appIdeas); sbSet("km_appideas",appIdeas).catch(()=>{}); },[appIdeas]);

  // Load from Supabase on first open (overrides empty localStorage)
  useEffect(()=>{
    async function loadFromSupabase() {
      try { const [v,i,c,m,t,tk,ai] = await Promise.all([
        sbGet("km_videos"), sbGet("km_ideas"), sbGet("km_calendar"),
        sbGet("km_manual"), sbGet("km_trends"), sbGet("km_tasks"), sbGet("km_appideas")
      ]);
      if(v) { try { const parsed=JSON.parse(v); if(Array.isArray(parsed)&&parsed.length>0) {
        // Dedupe by id to prevent doubling from Apify scraper
        const seen=new Set(); const deduped=parsed.filter(x=>{ const id=String(x.id||''); if(seen.has(id)) return false; seen.add(id); return true; });
        setVideos(deduped);
      }} catch{} }
      else { try { const local=JSON.parse(localStorage.getItem(VIDEOS_KEY)); if(Array.isArray(local)&&local.length>0) setVideos(local); } catch{} }
      if(i) { try { const parsed=JSON.parse(i); if(Array.isArray(parsed)&&parsed.length>0) setIdeas(parsed); } catch{} }
      else { try { const local=JSON.parse(localStorage.getItem(IDEAS_KEY)); if(Array.isArray(local)&&local.length>0) setIdeas(local); } catch{} }
      if(c) { try { const parsed=JSON.parse(c); if(Array.isArray(parsed)&&parsed.length>0) setCalItems(parsed); } catch{} }
      else { try { const local=JSON.parse(localStorage.getItem(CAL_KEY)); if(Array.isArray(local)&&local.length>0) setCalItems(local); } catch{} }
      if(m) { try { const parsed=JSON.parse(m); if(Object.keys(parsed).length>0) setManualData(parsed); } catch{} }
      else { try { const local=JSON.parse(localStorage.getItem(MANUAL_KEY)); if(local&&Object.keys(local).length>0) setManualData(local); } catch{} }
      if(t) { try { setTrends(JSON.parse(t)); } catch{} }
      else { try { const local=loadJSON(TRENDS_KEY,null); if(local) setTrends(local); } catch{} }
      if(tk) { try { const parsed=JSON.parse(tk); if(Array.isArray(parsed)&&parsed.length>0) setTasks(parsed); } catch{} }
      else { try { const local=JSON.parse(localStorage.getItem(TASKS_KEY)); if(Array.isArray(local)&&local.length>0) setTasks(local); } catch{} }
      if(ai) { try { const parsed=JSON.parse(ai); if(Array.isArray(parsed)&&parsed.length>0) setAppIdeas(parsed); } catch{} }
      else { try { const local=JSON.parse(localStorage.getItem(APPIDEAS_KEY)); if(Array.isArray(local)&&local.length>0) setAppIdeas(local); } catch{} }
      } catch(e) { console.log("SB load error:", e); }
    }
    loadFromSupabase().then(()=>setSbLoaded(true));
  },[]);

  // Load scraped stats from Supabase (TikTok + Instagram + App Store)
  const [scrapedStats, setScrapedStats] = useState(null);
  useEffect(()=>{
    async function loadScraped() {
      try {
        const res = await fetch(getSbUrl() + "/rest/v1/km_scraped_stats?order=updated_at.desc&limit=1", {
          headers: { "apikey": getSbKey(), "Authorization": "Bearer " + getSbKey(), "Content-Type": "application/json" }
        });
        const data = await res.json();
        console.log("Scraped stats response:", data);
        if(Array.isArray(data) && data.length > 0) {
          const parsed = JSON.parse(data[0].value);
          console.log("Parsed scraped stats:", parsed);
          setScrapedStats(parsed);
          if(parsed.tiktok) {
            const tt = parsed.tiktok;
            setManualData(d=>({...d,
              tt_followers: tt.followers>0 ? tt.followers : d.tt_followers,
              tt_likes:     tt.total_likes>0 ? tt.total_likes : d.tt_likes,
              tt_date:      new Date().toISOString().slice(0,10),
              // Never overwrite bins or tt_views from scraper -- keep manual values
            }));
          }
        } else {
          console.log("No scraped stats found in Supabase");
        }
      } catch(e) { console.log("Scraped stats error:", e.message); }
    }
    loadScraped();
    const interval = setInterval(loadScraped, 30*60*1000);
    return ()=>clearInterval(interval);
  },[]);

  const openModal  = (k,d={}) => { setDraft(d); setModals(m=>({...m,[k]:true})); };
  const closeModal = k => { setModals(m=>({...m,[k]:false})); setDraft({}); };
  const copyText   = (k,text) => { navigator.clipboard.writeText(text); setCopied(c=>({...c,[k]:true})); setTimeout(()=>setCopied(c=>({...c,[k]:false})),2000); };

  const hasIG    = !!keys.ig;
  const hasApple = !!(keys.apple_key_id && keys.apple_issuer && keys.apple_p8);
  const hasPlay  = !!keys.play;
  const m        = manualData;
  // Auto-calculate total TikTok views from logged videos if scraper hasn't set it
  const calcTtViews = videos.length > 0 ? videos.reduce((s,v)=>s+(parseInt(v.views)||0),0) : 0;
  const ttViewsDisplay = calcTtViews > 0 ? calcTtViews : (m.tt_views||0);
  const daysToSongkran = getDaysUntil("2026-04-13");

  // Use scraped Instagram data if no API key
  useEffect(()=>{
    if(scrapedStats?.instagram && !igData) {
      const ig = scrapedStats.instagram;
      setIgData({ profile:{ username:ig.username, followers_count:ig.followers, media_count:ig.posts, account_type:ig.account_type }, media:ig.media||[] });
    }
  },[scrapedStats]);

  const fetchIG = useCallback(async () => {
    if(!hasIG) return;
    setIgLoad(true); setIgError(null);
    try {
      const p = await (await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count&access_token=${keys.ig}`)).json();
      if(p.error) throw new Error(p.error.message);
      const med = await (await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count,video_views,plays,reach&access_token=${keys.ig}&limit=20`)).json();
      setIgData({ profile:p, media:med.data||[] });
    } catch(e) { setIgError(e.message); }
    setIgLoad(false);
  },[keys.ig,hasIG]);
  useEffect(()=>fetchIG(),[fetchIG]);

  // Actions
  const addVideo    = v => { setVideos(vs=>[v,...vs]); closeModal("addVideo"); };
  const deleteVideo = id => setVideos(vs=>vs.filter(v=>v.id!==id));
  const updateVideo  = (id, updates) => setVideos(vs=>vs.map(v=>v.id===id?{...v,...updates}:v));
  const addIdea     = (idea, keepOpen=false) => { setIdeas(is=>[idea,...is]); if(!keepOpen) closeModal("addIdea"); };
  const deleteIdea  = id => setIdeas(is=>is.filter(i=>i.id!==id));
  const addCalItem  = item => { setCalItems(cs=>[...cs,item].sort((a,b)=>a.date.localeCompare(b.date))); closeModal("addCal"); };
  const deleteCalItem = id => setCalItems(cs=>cs.filter(c=>c.id!==id));
  const updateCalStatus = (id,status) => setCalItems(cs=>cs.map(c=>c.id===id?{...c,status}:c));
  const saveManual  = u => { setManualData(d=>({...d,...u})); closeModal("editStats"); };

  // Merge scraped videos into logged videos (match by title similarity, don't duplicate)
  useEffect(()=>{
    if(!syncData?.tiktok?.videos?.length) return;
    const scraped = syncData.tiktok.videos;
    setVideos(existing => {
      const merged = [...existing];
      scraped.forEach(sv => {
        const exists = existing.some(ev =>
          ev.title?.toLowerCase().includes(sv.title?.toLowerCase()?.slice(0,20)) ||
          sv.title?.toLowerCase().includes(ev.title?.toLowerCase()?.slice(0,20))
        );
        if(!exists && sv.views > 0 && sv.title) {
          merged.push({
            id: Date.now() + Math.random(),
            title: sv.title,
            date: sv.date || today(),
            type: "facecam",
            hook: "other",
            views: sv.views || 0,
            likes: sv.likes || 0,
            comments: sv.comments || 0,
            shares: sv.shares || 0,
            notes: "Auto-synced from GitHub",
            autoSynced: true,
          });
        }
      });
      return merged;
    });
  },[syncData]);

  async function runAI(mode) {
    if(mode!=="trends" && videos.length<2){ setAiErr("Add at least 2 videos first."); return; }
    setAiErr(null); setAiLoad(l=>({...l,[mode]:true}));
    try {
      const ttSummary = videos.map(v=>({ title:v.title,date:v.date,type:v.type,hook:v.hook,views:v.views,likes:v.likes,comments:v.comments,shares:v.shares,likeRatio:ratio(v).toFixed(1)+"%",crossPost:v.crossPost||false,promoted:v.promoted||false }));
      const organicOnly = ttSummary.filter(v=>!v.promoted);
      const promotedOnly = ttSummary.filter(v=>v.promoted);
      const igLoggedSummary = videos.filter(v=>v.crossPost&&(v.igViews||v.igLikes)).map(v=>({ title:v.title,date:v.date,igViews:v.igViews||0,igLikes:v.igLikes||0,igComments:v.igComments||0,ttViews:v.views,comparison:v.igViews&&v.views?`IG got ${Math.round((v.igViews/v.views)*100)}% of TT views`:null }));
      const igSummary = igData?.media?.map(p=>({ caption:p.caption?.slice(0,80)||"",date:p.timestamp?.slice(0,10),type:p.media_type,likes:p.like_count||0,comments:p.comments_count||0 })) || [];
      const igProfile = igData?.profile ? { username:igData.profile.username, posts:igData.profile.media_count } : null;
      const prompts = {
        analysis:`Analyse KrapMaps TikTok organic content. Return flat JSON only: {"keyPattern":"one sentence","urgentFix":"one sentence","hookAnalysis":{"bestHook":"string","worstHook":"string","reasoning":"one sentence"},"typeAnalysis":{"bestType":"string","worstType":"string","reasoning":"one sentence"},"whatIsWorking":[{"insight":"string","evidence":"string","impact":"high|medium|low"}],"whatIsNotWorking":[{"insight":"string","evidence":"string","fix":"string"}]}. Keep all strings under 20 words. Organic videos:${JSON.stringify(organicOnly)}`,
        nextVids:`Generate next content for KrapMaps across both platforms. Return: {"tiktok":[{"title":"","type":"","hook":"","whyItWillWork":"","openingLine":"","structure":"","priority":""}],"instagram":[{"caption":"","contentType":"Reel|Carousel|Story|Post","concept":"","whyItWillWork":"","priority":""}],"songkranAngle":"one cross-platform Songkran idea"}. TikTok data:${JSON.stringify(ttSummary)} IG data:${JSON.stringify(igSummary)} IG cross-posts:${JSON.stringify(igLoggedSummary)}`,
        weekly:`Weekly summary covering BOTH TikTok and Instagram for KrapMaps. Return: {"weekSummary":"","tiktokHighlight":{"title":"","whyItWorked":""},"instagramHighlight":{"caption":"","whyItWorked":""},"biggestLearning":"","harleyBrief":"brief for Harley covering both TikTok filming and Instagram content","thisWeekTarget":"","rawSummaryText":"casual WhatsApp message from Bk to Harley covering both platforms"}. TikTok:${JSON.stringify(ttSummary)} Instagram API:${JSON.stringify(igSummary)} IG cross-posts:${JSON.stringify(igLoggedSummary)}`,
        trends:`Analyse current trends (March 2026) for KrapMaps across TikTok AND Instagram. Return: {"trends":[{"trend":"","tiktokAngle":"","instagramAngle":"","urgency":"🔥 Now|📈 This week|🗓 Soon","format":"facecam|street|screencap|mixed|reel|carousel"}],"topOpportunity":"","songkranTrendAngle":""}`,
      };
      const r = await callAI(prompts[mode], 3000);
      if(mode==="analysis") { setAnalysis(r); setSub("analysis"); }
      if(mode==="nextVids") { setNextVids(r); setSub("nextVids"); }
      if(mode==="weekly")   { setWeekly(r);   setSub("weekly"); }
      if(mode==="trends")   { setTrends(r);   setSub("trends"); }
      setNav("analytics");
    } catch(e) { setAiErr("AI error: "+e.message); }
    setAiLoad(l=>({...l,[mode]:false}));
  }

  async function scoreIdea(idea) {
    setAiLoad(l=>({...l,["s"+idea.id]:true}));
    try {
      const scorePrompt = "You are scoring a TikTok content idea for KrapMaps -- a gamified bin-finding app. NOT a toilet app. Users find bins, map them, earn points. CONTEXT: @findkrap posts street content, facecam reactions, achievement reveals, gamification clips. Best performers: Tired of holding rubbish (23% like ratio), Rating bins 10/10 FROM THE APP (20% ratio), POV you find the best bin (13% ratio). Audience: young, fun, global. SCORING RULES: Score based on CONCEPT STRENGTH and EXECUTION POTENTIAL, not whether it contains specific words. A creative or unusual idea can score high even without obvious viral hooks. Score viralityScore and hookScore INDEPENDENTLY. viralityScore = will people share comment follow after watching (concept level). hookScore = does the OPENING LINE grab attention in 2 seconds (execution level). Be varied: same score twice in a row is wrong. High scores 75+ require genuine mass appeal or strong emotional reaction potential. Medium scores 50-70 for solid ideas that need refinement. Low scores 30-49 for generic or unclear concepts only. Idea title: " + idea.title + ". Video type: " + idea.type + ". Hook/opening: " + idea.hook + ". Creator notes: " + (idea.notes||"none") + ". Return JSON only: {viralityScore:integer 0-100,hookScore:integer 0-100,verdict:honest 1 sentence,viralityReason:1 sentence on why it will or wont spread,hookFeedback:1 sentence on opening line only,improvedHook:rewrite the opening stronger,bestFormat:facecam|street|screencap,recommendations:[{action:string,impact:high|medium|low},{action:string,impact:high|medium|low},{action:string,impact:high|medium|low}]}";
      const r = await callAI(scorePrompt, 1200);
      setIdeas(is=>is.map(i=>i.id===idea.id?{...i,aiScore:r}:i));
    } catch(e) { setAiErr("Score error: "+e.message); }
    setAiLoad(l=>({...l,["s"+idea.id]:false}));
  }

  async function genCaption(idea) {
    setCaptionIdea(idea); setCaptionResult(null);
    setAiLoad(l=>({...l,caption:true}));
    setSub("captions"); setNav("content");
    try {
      const r = await callAI(`Write captions for KrapMaps content on BOTH TikTok and Instagram. Return: {"tiktok":{"caption":"punchy 1-3 sentences with CTA, max 150 chars","hashtags":["12","to","15","tags","no","hash"],"altCaption":"edgy alternative version"},"instagram":{"caption":"slightly longer, community-feel, 2-4 sentences, ends with question or CTA","hashtags":["15","to","20","ig","tags","no","hash"],"altCaption":"more aesthetic/visual alternative"}}. Idea:"${idea.title}" Hook:${idea.hook} Notes:${idea.notes||"none"}`);
      setCaptionResult(r);
    } catch(e) { setAiErr("Caption error: "+e.message); }
    setAiLoad(l=>({...l,caption:false}));
  }

  // Computed
  const sortedVideos = [...videos].sort((a,b)=>b.views-a.views);
  const avgRatio     = videos.length ? videos.reduce((s,v)=>s+ratio(v),0)/videos.length : 0;
  const totalViews   = videos.reduce((s,v)=>s+v.views,0);
  const facecamAvg   = (()=>{ const fc=videos.filter(v=>v.type==="facecam"||v.type==="street"); return fc.length?Math.round(fc.reduce((s,v)=>s+v.views,0)/fc.length):0; })();
  const hookStats    = HOOK_TYPES.map(h=>{ const hv=videos.filter(v=>v.hook===h); return { hook:h,count:hv.length,avg:hv.length?Math.round(hv.reduce((s,v)=>s+v.views,0)/hv.length):0 }; }).filter(h=>h.count>0).sort((a,b)=>b.avg-a.avg);
  const upcomingCal  = calItems.filter(c=>c.date>=today()).slice(0,4);
  const topIdeas     = [...ideas].sort((a,b)=>(b.aiScore?.viralityScore||0)-(a.aiScore?.viralityScore||0));

  // ─── NAV ──────────────────────────────────────────────────────────────────
  const NAV = [
    { id:"home",      icon:Icon.home,      label:"Home" },
    { id:"content",   icon:Icon.content,   label:"Content" },
    { id:"analytics", icon:Icon.analytics, label:"Analytics" },
    { id:"tasks",     icon:Icon.target,    label:"Tasks" },
    { id:"growth",    icon:Icon.growth,    label:"Growth" },
    { id:"settings",  icon:Icon.settings,  label:"Settings" },
  ];

  const navBtnStyle = (id) => ({
    display:"flex", flexDirection:"column", alignItems:"center", gap:4,
    padding:D.phone?"5px 0 6px":"8px 0 10px", flex:1, background:"none", border:"none", cursor:"pointer",
    color: nav===id ? C.pink : "#888",
    fontFamily:C.fontBody, fontWeight:700, fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase",
    transition:"all 0.2s", position:"relative",
  });

  function goTo(navId, subId=null) { setNav(navId); setSub(subId); }

  // ─── SECTION CONTENT ──────────────────────────────────────────────────────

  // HOME
  const HomeView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:D.phone?10:14 }}>

      {/* Banner */}
      <div style={{ borderRadius:D.phone?12:20, padding:D.phone?"14px 14px":"20px 22px", position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#120020 0%,#1E0035 50%,#120020 100%)", border:`1px solid ${C.pink}30` }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:`radial-gradient(circle,${C.pink}25 0%,transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ color:C.text, fontSize:D.phone?20:28, fontWeight:900, fontFamily:"'Sora', sans-serif", letterSpacing:"-0.02em", lineHeight:1.1 }}>{WL.appName} <span style={{ color:C.pink }}>HQ</span></div>
              <div style={{ color:C.dim, fontSize:D.phone?10:12, fontFamily:C.fontBody, marginTop:2 }}>{WL.creator1} + {WL.creator2} · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>
              {scrapedStats?.scraped_at && <div style={{ color:C.dim, fontSize:8, fontFamily:C.fontBody, marginTop:3, opacity:0.4, letterSpacing:"0.04em" }}>synced {(()=>{ try { const d=new Date(scrapedStats.scraped_at); const h=Math.round((Date.now()-d)/3600000); return h<1?"just now":h<24?h+"h ago":Math.round(h/24)+"d ago"; } catch{return "";} })()}</div>}
            </div>
            <div style={{ background:`linear-gradient(135deg,${C.pink},${C.pinkDark})`, color:"#fff", fontFamily:C.fontBody, fontWeight:700, fontSize:D.phone?10:11, padding:D.phone?"4px 10px":"4px 12px", borderRadius:20 }}>{daysToSongkran}d to Songkran</div>
          </div>
        </div>
      </div>

      {/* TikTok stats 2x2 on phone, 4col on tablet+ */}
      <div style={{ display:"grid", gridTemplateColumns:D.cols4, gap:D.phone?6:8 }}>
        <StatCard label="FOLLOWERS" value={fmt(m.tt_followers||0)} color={C.pink} sub={m.tt_date||"--"} onClick={()=>goTo("growth")} />
        <StatCard label="TT VIEWS"  value={fmt(ttViewsDisplay)}     color={C.cyan} sub="from videos" onClick={()=>goTo("growth")} />
        <StatCard label="BINS"      value={fmt(m.bins||0)}          color={C.yellow} onClick={()=>goTo("growth")} />
        <StatCard label="VIDEOS"    value={videos.length}           color={C.green} onClick={()=>goTo("analytics")} />
      </div>

      {/* Quick actions -- 2x2 grid always */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:D.phone?6:10 }}>
        {[
          { icon:Icon.idea,     label:"Add Idea",      action:()=>{ setNav("content"); setSub("ideas"); setTimeout(()=>openModal("addIdea"),50); } },
          { icon:Icon.calendar, label:"Schedule",      action:()=>{ setNav("content"); setSub("calendar"); setTimeout(()=>openModal("addCal"),50); } },
          { icon:Icon.video,    label:"Log Video",     action:()=>openModal("addVideo") },
          { icon:Icon.tiktok,   label:"Update Stats",  action:()=>openModal("editStats") },
        ].map(({ icon, label, action }) => (
          <button key={label} onClick={action} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:D.phone?"10px 12px":"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:D.phone?26:32, height:D.phone?26:32, borderRadius:8, background:C.pink+"18", border:`1px solid ${C.pink}25`, display:"flex", alignItems:"center", justifyContent:"center", color:C.pink, flexShrink:0 }}>{icon}</div>
            <div style={{ color:C.text, fontSize:D.phone?11:12, fontWeight:600, fontFamily:C.fontBody, lineHeight:1.2 }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Upcoming + Top Ideas -- side by side on phone too */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:D.phone?6:10 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:D.phone?"10px 12px":"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ color:C.cyan, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700 }}>UPCOMING</div>
            <button onClick={()=>goTo("content","calendar")} style={{ background:"none", border:"none", color:C.cyan, fontSize:9, fontFamily:C.fontBody, cursor:"pointer", fontWeight:600 }}>All</button>
          </div>
          {upcomingCal.length===0
            ? <div style={{ color:C.dim, fontSize:10, fontFamily:C.fontBody }}>None -- <span style={{ color:C.cyan, cursor:"pointer", fontWeight:700 }} onClick={()=>{ goTo("content","calendar"); openModal("addCal"); }}>add</span></div>
            : upcomingCal.slice(0,3).map(c=>(
              <div key={c.id} style={{ marginBottom:6 }}>
                <div style={{ color:C.text, fontSize:D.phone?10:11, fontFamily:C.fontBody, fontWeight:600, lineHeight:1.3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{c.title}</div>
                <div style={{ color:C.dim, fontSize:9, marginTop:1 }}>{c.date?.slice(5)}</div>
              </div>
            ))
          }
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:D.phone?"10px 12px":"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ color:C.purple, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700 }}>TOP IDEAS</div>
            <button onClick={()=>goTo("content","ideas")} style={{ background:"none", border:"none", color:C.purple, fontSize:9, fontFamily:C.fontBody, cursor:"pointer", fontWeight:600 }}>All</button>
          </div>
          {topIdeas.length===0
            ? <div style={{ color:C.dim, fontSize:10, fontFamily:C.fontBody }}>None -- <span style={{ color:C.purple, cursor:"pointer", fontWeight:700 }} onClick={()=>{ goTo("content","ideas"); openModal("addIdea"); }}>add</span></div>
            : topIdeas.slice(0,3).map(i=>(
              <div key={i.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, gap:4 }}>
                <div style={{ color:C.text, fontSize:D.phone?10:11, fontFamily:C.fontBody, fontWeight:500, flex:1, lineHeight:1.3, wordBreak:"break-word", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{i.title}</div>
                {i.aiScore?.viralityScore!=null && <div style={{ color:i.aiScore.viralityScore>=80?C.green:i.aiScore.viralityScore>=60?C.yellow:C.pink, fontFamily:C.fontHead, fontSize:D.phone?14:16, flexShrink:0, marginLeft:4 }}>{i.aiScore.viralityScore}</div>}
              </div>
            ))
          }
        </div>
      </div>

      {/* AI actions */}
      {videos.length>=2 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:D.phone?"10px 12px":"14px 16px" }}>
          <div style={{ color:C.dim, fontSize:8, letterSpacing:"0.12em", fontFamily:C.fontBody, marginBottom:8, fontWeight:700 }}>AI ACTIONS</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <Btn small outline color={C.cyan}   onClick={()=>runAI("analysis")} disabled={aiLoad.analysis}>{aiLoad.analysis?"...":"What's Working"}</Btn>
            <Btn small outline color={C.green}  onClick={()=>runAI("nextVids")} disabled={aiLoad.nextVids}>{aiLoad.nextVids?"...":"Next Videos"}</Btn>
            <Btn small outline color={C.yellow} onClick={()=>runAI("weekly")}   disabled={aiLoad.weekly}>{aiLoad.weekly?"...":"Harley Brief"}</Btn>
            <Btn small outline color={C.orange} onClick={()=>runAI("trends")}   disabled={aiLoad.trends}>{aiLoad.trends?"...":"Trends"}</Btn>
          </div>
        </div>
      )}
    </div>
  );

  // CONTENT sub-tabs
  const contentSubs = [
    { id:"calendar", label:"Calendar", short:"Cal" },
    { id:"ideas",    label:"Ideas",    short:"Ideas" },
    { id:"captions", label:"Captions", short:"Captions" },
  ];

  const ContentView = () => {
    const activeSub = sub || "calendar";
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Sub-nav */}
        <div style={{ display:"flex", gap:4, background:C.card, padding:"5px", borderRadius:12, border:`1px solid ${C.border}` }}>
          {contentSubs.map(s=>(
            <button key={s.id} onClick={()=>setSub(s.id)} style={{ flex:1, background:activeSub===s.id?C.pink:"transparent", border:`1px solid ${activeSub===s.id?C.pink+"50":"transparent"}`, borderRadius:8, padding:"8px 14px", color:activeSub===s.id?"#fff":C.mutedText, fontFamily:C.fontBody, fontWeight:600, fontSize:12, cursor:"pointer", transition:"all 0.2s" }}>{s.label}</button>
          ))}
        </div>

        {/* CALENDAR */}
        {activeSub==="calendar" && (()=>{
          const [calFilter, setCalFilter] = useState("all");
          const filteredCal = calFilter==="all" ? calItems : calItems.filter(c=>c.platform===calFilter||(calFilter==="Both"&&c.platform==="Both"));
          return (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>Content Calendar</div>
              <Btn small onClick={()=>openModal("addCal")}>+ Schedule</Btn>
            </div>
            {/* Platform filter + status legend */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"flex", gap:6, background:C.card, padding:"5px", borderRadius:10, border:`1px solid ${C.border}` }}>
                {["all","TikTok","Instagram","Both"].map(p=>(
                  <button key={p} onClick={()=>setCalFilter(p)} style={{ flex:1, padding:"6px 10px", borderRadius:7, cursor:"pointer", fontSize:11, background:calFilter===p?C.pink:"transparent", border:"none", color:"#fff", fontFamily:C.fontBody, fontWeight:700, transition:"all 0.2s", textTransform:"uppercase", letterSpacing:"0.05em", opacity:calFilter===p?1:0.5 }}>
                    {p==="all"?"All":p}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                {STATUSES.map(s=>(
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:4, background:STATUS_C[s]+"15", border:`1px solid ${STATUS_C[s]}40`, borderRadius:20, padding:"3px 10px" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:STATUS_C[s], flexShrink:0 }} />
                    <span style={{ color:STATUS_C[s], fontSize:9, fontFamily:C.fontBody, fontWeight:600, letterSpacing:"0.05em" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            {filteredCal.length===0
              ? <Empty icon={Icon.calendar} title="Calendar empty" sub="Schedule your upcoming content." action={()=>openModal("addCal")} actionLabel="SCHEDULE FIRST POST" />
              : filteredCal.map(c=>(
                <div key={c.id} style={{ background:C.card, borderLeft:`3px solid ${STATUS_C[c.status]||C.border}`, borderTop:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, borderRadius:14, padding:D.phone?"10px 12px":"14px 16px", display:"grid", gridTemplateColumns:D.phone?"1fr auto auto":"80px 1fr auto auto", gap:D.phone?8:12, alignItems:"center" }}>
                  <div>
                    <div style={{ color:STATUS_C[c.status]||C.pink, fontSize:14, fontWeight:700, fontFamily:C.fontHead, letterSpacing:"0.04em" }}>{c.date?.slice(5)}</div>
                    <div style={{ color:C.dim, fontSize:10 }}>{c.platform}</div>
                  </div>
                  <div>
                    <div style={{ color:C.text, fontSize:13, fontFamily:C.fontBody, fontWeight:600, lineHeight:1.3 }}>{c.title}</div>
                    {c.notes && <div style={{ color:C.dim, fontSize:11, marginTop:2 }}>{c.notes}</div>}
                    <div style={{ display:"flex", gap:4, marginTop:4 }}>
                      {c.type && <Tag color={C.pink} size={8}>{c.type}</Tag>}
                      {c.hook && <Tag color={C.cyan} size={8}>{c.hook}</Tag>}
                    </div>
                  </div>
                  <select value={c.status} onChange={e=>updateCalStatus(c.id,e.target.value)} style={{ background:C.card, border:`1px solid ${STATUS_C[c.status]||C.border}`, borderRadius:8, color:"#fff", padding:"5px 8px", fontFamily:C.fontBody, fontWeight:700, fontSize:10, cursor:"pointer", outline:"none", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>deleteCalItem(c.id)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.dim, cursor:"pointer", borderRadius:7, padding:"3px 7px", display:"flex", alignItems:"center" }}>{Icon.trash}</button>
                </div>
              ))
            }
          </div>
          );
        })()}

        {/* IDEAS */}
        {activeSub==="ideas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>Idea Bank ({ideas.length})</div>
              <Btn small onClick={()=>openModal("addIdea")}>+ Add Idea</Btn>
            </div>
            {ideas.length===0
              ? <Empty icon={Icon.idea} title="Idea bank empty" sub="Save ideas before filming. AI scores virality + rates the hook." action={()=>openModal("addIdea")} actionLabel="ADD FIRST IDEA" />
              : topIdeas.map(idea=>(
                <div key={idea.id} style={{ background:C.card, border:`1px solid ${(idea.aiScore?.viralityScore>=7||idea.aiScore?.viralityScore>=70)?C.pink+"44":C.border}`, borderRadius:14, padding:D.phone?"12px 14px":"16px 18px" }}>
                  {/* Title + scores row */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ color:C.text, fontSize:14, fontWeight:700, fontFamily:C.fontBody, marginBottom:6, lineHeight:1.3 }}>{idea.title}</div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        <Tag color={C.pink} size={9}>{idea.type}</Tag>
                        <Tag color={C.cyan} size={9}>{idea.hook}</Tag>
                      </div>
                      {idea.notes && <div style={{ color:C.dim, fontSize:11, marginTop:6, lineHeight:1.5 }}>{idea.notes}</div>}
                    </div>
                    {idea.aiScore && (
                      <div style={{ display:"flex", gap:D.phone?8:12, alignItems:"center", flexShrink:0 }}>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ color:idea.aiScore.viralityScore>=80?C.green:idea.aiScore.viralityScore>=60?C.yellow:C.pink, fontSize:28, fontWeight:400, fontFamily:C.fontHead, lineHeight:1 }}>{idea.aiScore.viralityScore}</div>
                          <div style={{ color:C.dim, fontSize:8, fontFamily:C.fontBody, fontWeight:700, letterSpacing:"0.1em" }}>VIRAL</div>
                        </div>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ color:idea.aiScore.hookScore>=80?C.pink:idea.aiScore.hookScore>=60?C.orange:C.dim, fontSize:24, fontWeight:400, fontFamily:C.fontHead, lineHeight:1 }}>{idea.aiScore.hookScore}</div>
                          <div style={{ color:C.dim, fontSize:8, fontFamily:C.fontBody, fontWeight:700, letterSpacing:"0.1em" }}>HOOK</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* AI analysis */}
                  {idea.aiScore && (
                    <div style={{ display:"flex", flexDirection:"column", gap:D.phone?6:7, marginBottom:10 }}>
                      {idea.aiScore.verdict && (
                        <div style={{ background:C.pink+"10", border:`1px solid ${C.pink}25`, borderRadius:10, padding:"10px 12px" }}>
                          <div style={{ color:C.pink, fontSize:12, fontWeight:700, fontFamily:C.fontBody }}>{idea.aiScore.verdict}</div>
                        </div>
                      )}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                        <div style={{ background:C.cardAlt, borderRadius:9, padding:"9px 11px" }}>
                          <div style={{ color:C.dim, fontSize:8, letterSpacing:"0.1em", fontFamily:C.fontBody, marginBottom:3, fontWeight:700 }}>VIRALITY</div>
                          <div style={{ color:C.textMed, fontSize:11, lineHeight:1.5 }}>{idea.aiScore.viralityReason}</div>
                        </div>
                        <div style={{ background:C.cardAlt, borderRadius:9, padding:"9px 11px" }}>
                          <div style={{ color:C.dim, fontSize:8, letterSpacing:"0.1em", fontFamily:C.fontBody, marginBottom:3, fontWeight:700 }}>HOOK</div>
                          <div style={{ color:C.textMed, fontSize:11, lineHeight:1.5 }}>{idea.aiScore.hookFeedback}</div>
                        </div>
                      </div>
                      {idea.aiScore.improvedHook && (
                        <div style={{ background:C.green+"0A", border:`1px solid ${C.green}22`, borderRadius:9, padding:"9px 11px" }}>
                          <div style={{ color:C.green, fontSize:8, letterSpacing:"0.1em", fontFamily:C.fontBody, marginBottom:3, fontWeight:700 }}>IMPROVED HOOK</div>
                          <div style={{ color:C.text, fontSize:12, fontStyle:"italic" }}>"{idea.aiScore.improvedHook}"</div>
                        </div>
                      )}
                      {idea.aiScore.recommendations?.length>0 && (
                        <div style={{ background:C.cardAlt, borderRadius:10, padding:"10px 12px" }}>
                          <div style={{ color:C.dim, fontSize:8, letterSpacing:"0.1em", fontFamily:C.fontBody, marginBottom:8, fontWeight:700 }}>RECOMMENDATIONS</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            {idea.aiScore.recommendations.map((rec,i)=>(
                              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                                <div style={{ width:6, height:6, borderRadius:"50%", background:rec.impact==="high"?C.green:rec.impact==="medium"?C.yellow:C.cyan, flexShrink:0, marginTop:4 }} />
                                <div style={{ color:C.textMed, fontSize:11, lineHeight:1.4, flex:1 }}>{rec.action}</div>
                                <Tag color={rec.impact==="high"?C.green:rec.impact==="medium"?C.yellow:C.cyan} size={8}>{rec.impact}</Tag>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                    <Btn small color={C.purple} onClick={()=>scoreIdea(idea)} disabled={aiLoad["s"+idea.id]}>{aiLoad["s"+idea.id]?"SCORING...":idea.aiScore?"RE-SCORE":"SCORE IT"}</Btn>
                    <Btn small color={C.pink} onClick={()=>genCaption(idea)}>CAPTION</Btn>
                    <Btn small outline color={C.cyan} onClick={()=>{ setSub("calendar"); openModal("addCal",{title:idea.title,type:idea.type,hook:idea.hook}); }}>SCHEDULE</Btn>
                    <button onClick={()=>deleteIdea(idea.id)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.dim, padding:"5px 8px", borderRadius:7, cursor:"pointer", marginLeft:"auto", display:"flex", alignItems:"center" }}>{Icon.trash}</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* CAPTIONS */}
        {activeSub==="captions" && (
          <div style={{ display:"flex", flexDirection:"column", gap:D.phone?10:14 }}>
            <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>Caption Generator</div>
            {(()=>{
              const [captionInput, setCaptionInput] = useState("");
              const [scanningCaption, setScanningCaption] = useState(false);
              const [captionScanErr, setCaptionScanErr] = useState(null);
              const captionFileRef = useRef();

              async function scanForCaption(file) {
                setScanningCaption(true); setCaptionScanErr(null);
                try {
                  const b64 = await new Promise((res,rej)=>{ const img=new Image(); const url=URL.createObjectURL(file); img.onload=()=>{ const canvas=document.createElement("canvas"); const max=1024; let w=img.width,h=img.height; if(w>max||h>max){if(w>h){h=Math.round(h*max/w);w=max;}else{w=Math.round(w*max/h);h=max;}} canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);res(canvas.toDataURL("image/jpeg",0.8).split(",")[1]);URL.revokeObjectURL(url);}; img.onerror=rej; img.src=url; });
                  const scanHeaders={"Content-Type":"application/json"};
                  const isV=window.location.hostname.includes("vercel.app")||window.location.hostname.includes("krapmaps");
                  const scanUrl=isV?"/api/proxy":"https://api.anthropic.com/v1/messages";
                  if(!isV){scanHeaders["x-api-key"]=ANTHROPIC_KEY;scanHeaders["anthropic-version"]="2023-06-01";scanHeaders["anthropic-dangerous-direct-browser-access"]="true";}
                  const captionPrompt = 'What is this TikTok video about? Return JSON only: {"title":"one sentence description","hook":"edgy/controversial|problem->solution|gamification|achievement|challenge|reaction|demo|other","notes":"any extra context"}';
                  const resp=await fetch(scanUrl,{
                    method:"POST",
                    headers:scanHeaders,
                    body:JSON.stringify({
                      model:"claude-sonnet-4-20250514",
                      max_tokens:300,
                      system:SYSTEM,
                      messages:[{
                        role:"user",
                        content:[
                          {type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},
                          {type:"text",text:captionPrompt}
                        ]
                      }]
                    })
                  });
                  const raw=await resp.text(); let data; try{data=JSON.parse(raw);}catch(e){throw new Error("Invalid response");}
                  if(data.error)throw new Error(data.error.message);
                  const text=data.content?.map(b=>b.text||"").join("")||"";
                  const p=JSON.parse(text.replace(/```json|```/g,"").trim());
                  genCaption({title:p.title||"KrapMaps video",hook:p.hook||"gamification",notes:p.notes||""});
                } catch(e){setCaptionScanErr("Scan failed -- try typing instead");}
                setScanningCaption(false);
              }

              return (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px" }}>
                  {/* Screenshot scan area */}
                  <div
                    onClick={()=>captionFileRef.current?.click()}
                    onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer?.files?.[0]; if(f) scanForCaption(f); }}
                    onDragOver={e=>e.preventDefault()}
                    style={{ border:`2px dashed ${scanningCaption?C.yellow:C.border}`, borderRadius:12, padding:"16px", textAlign:"center", cursor:"pointer", background:scanningCaption?C.yellow+"08":C.cardAlt, marginBottom:12, transition:"all 0.2s" }}
                  >
                    {scanningCaption
                      ? <div style={{ color:C.yellow, fontWeight:700, fontFamily:C.fontBody, fontSize:13 }}>Reading screenshot...</div>
                      : <div>
                          <div style={{ color:C.yellow, display:"flex", justifyContent:"center", marginBottom:6 }}><div style={{ transform:"scale(1.5)", display:"inline-block" }}>{Icon.camera}</div></div>
                          <div style={{ color:C.text, fontWeight:600, fontFamily:C.fontBody, fontSize:13, marginBottom:2 }}>Scan video screenshot</div>
                          <div style={{ color:C.dim, fontSize:10 }}>AI reads what it's about and generates caption</div>
                        </div>
                    }
                    <input ref={captionFileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) scanForCaption(e.target.files[0]); }} />
                  </div>
                  {captionScanErr && <div style={{ color:"#FF6B6B", fontSize:11, marginBottom:10 }}>{captionScanErr}</div>}
                  {/* Text input -- fixed keyboard bug by using local state */}
                  <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700, marginBottom:6 }}>OR TYPE AN IDEA</div>
                  <div style={{ display:"flex", gap:8, marginBottom:ideas.length>0?12:0, flexDirection:D.phone?"column":"row" }}>
                    <input
                      value={captionInput}
                      onChange={e=>setCaptionInput(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&genCaption({title:captionInput||"KrapMaps video",hook:"gamification",notes:""})}
                      placeholder="e.g. Found a bin using KrapMaps..."
                      style={{ flex:1, background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"10px 14px", fontSize:16, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }}
                    />
                    <Btn color={C.pink} onClick={()=>genCaption({title:captionInput||"KrapMaps video",hook:"gamification",notes:""})} disabled={aiLoad.caption}>{aiLoad.caption?"Generating...":"GENERATE"}</Btn>
                  </div>
                  {ideas.length>0 && (
                    <div>
                      <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", marginBottom:7, fontFamily:C.fontBody, fontWeight:700 }}>FROM IDEA BANK</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {ideas.slice(0,6).map(i=>(
                          <button key={i.id} onClick={()=>genCaption(i)} style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"6px 12px", fontSize:11, fontFamily:C.fontBody, cursor:"pointer" }}>{i.title.slice(0,25)}{i.title.length>25?"...":""}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {aiLoad.caption && <div style={{ background:C.card, border:`1px solid ${C.yellow}33`, borderRadius:12, padding:"20px", textAlign:"center", color:C.dim, fontSize:13 }}>⏳ Writing caption...</div>}
            {captionResult && captionIdea && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:4 }}>CAPTIONS FOR</div><div style={{ color:C.text, fontSize:13, fontWeight:700, fontFamily:C.fontBody, marginBottom:12 }}>{captionIdea.title}</div>
                {/* TikTok caption */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:D.phone?"12px 14px":"18px 20px", borderTop:`1px solid ${C.pink}30` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.14em", fontWeight:700, fontFamily:C.fontBody }}>TIKTOK CAPTION</div>
                    <Btn small color={copied.ttCaption?C.green:C.pink} onClick={()=>copyText("ttCaption",(captionResult.tiktok?.caption||captionResult.caption||"")+" "+(captionResult.tiktok?.hashtags||captionResult.hashtags||[]).map(h=>"#"+h).join(" "))}>{copied.ttCaption?"✓ Copied":"Copy"}</Btn>
                  </div>
                  <div style={{ color:C.text, fontSize:14, lineHeight:1.8, marginBottom:12, fontFamily:C.fontBody }}>{captionResult.tiktok?.caption||captionResult.caption}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                    {(captionResult.tiktok?.hashtags||captionResult.hashtags||[]).map(h=><Tag key={h} color={C.pink} size={9}>#{h}</Tag>)}
                  </div>
                  {(captionResult.tiktok?.altCaption||captionResult.altCaption) && (
                    <div style={{ background:C.pinkBg, borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ color:C.dim, fontSize:9, fontFamily:C.fontBody, marginBottom:4 }}>EDGY ALT</div>
                      <div style={{ color:C.text, fontSize:12 }}>{captionResult.tiktok?.altCaption||captionResult.altCaption}</div>
                    </div>
                  )}
                </div>
                {/* Instagram caption */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.purple}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ color:C.purple, fontSize:9, letterSpacing:"0.14em", fontWeight:700, fontFamily:C.fontBody }}>INSTAGRAM CAPTION</div>
                    <Btn small color={copied.igCaption?C.green:C.purple} onClick={()=>copyText("igCaption",(captionResult.instagram?.caption||"")+" "+(captionResult.instagram?.hashtags||[]).map(h=>"#"+h).join(" "))}>{copied.igCaption?"✓ Copied":"Copy"}</Btn>
                  </div>
                  <div style={{ color:C.text, fontSize:14, lineHeight:1.8, marginBottom:12, fontFamily:C.fontBody }}>{captionResult.instagram?.caption||"Generate caption above to see Instagram version"}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                    {(captionResult.instagram?.hashtags||[]).map(h=><Tag key={h} color={C.purple} size={9}>#{h}</Tag>)}
                  </div>
                  {captionResult.instagram?.altCaption && (
                    <div style={{ background:C.purple+"11", borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ color:C.dim, fontSize:9, fontFamily:C.fontBody, marginBottom:4 }}>AESTHETIC ALT</div>
                      <div style={{ color:C.text, fontSize:12 }}>{captionResult.instagram.altCaption}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ANALYTICS sub-tabs
  const analyticsSubs = [
    { id:"videos",   label:"Videos",    short:"Videos" },
    { id:"analysis", label:"Analysis",   short:"Analysis" },
    { id:"nextVids", label:"Next Moves", short:"Next" },
    { id:"weekly",   label:"Harley",     short:"Harley" },
    { id:"trends",   label:"Trends",     short:"Trends" },
  ];

  const AnalyticsView = () => {
    const activeSub = sub || "videos";
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Sub-nav */}
        <div style={{ display:"flex", gap:4, overflowX:"auto", scrollbarWidth:"none", WebkitOverflowScrolling:"touch", paddingBottom:2 }}>
          {analyticsSubs.map(s=>(
            <button key={s.id} onClick={()=>setSub(s.id)} style={{ background:activeSub===s.id?C.pink:"transparent", border:`1px solid ${activeSub===s.id?C.pink:C.border}`, borderRadius:20, padding:D.phone?"5px 10px":"6px 16px", color:"#fff", fontFamily:C.fontBody, fontWeight:700, fontSize:D.phone?9:11, cursor:"pointer", whiteSpace:"nowrap", opacity:activeSub===s.id?1:0.5, textTransform:"uppercase", letterSpacing:"0.03em" }}>{D.phone?s.short:s.label}</button>
          ))}
        </div>

        {/* VIDEOS */}
        {activeSub==="videos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:20, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.05em" }}>VIDEOS</div>
              <Btn small onClick={()=>openModal("addVideo")}>+ Log Video</Btn>
            </div>
            {videos.length>0 && (()=>{
              const organic = videos.filter(v=>!v.promoted);
              const promoted = videos.filter(v=>v.promoted);
              const organicAvgViews = organic.length?Math.round(organic.reduce((s,v)=>s+v.views,0)/organic.length):0;
              const promotedAvgViews = promoted.length?Math.round(promoted.reduce((s,v)=>s+v.views,0)/promoted.length):0;
              return (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ display:"grid", gridTemplateColumns:D.cols4, gap:D.gapSm }}>
                    <StatCard label="TOTAL VIEWS" value={fmt(totalViews)} color={C.cyan} />
                    <StatCard label="AVG RATIO" value={`${avgRatio.toFixed(1)}%`} color={avgRatio>=5?C.green:C.yellow} />
                    <StatCard label="FACECAM AVG" value={fmt(facecamAvg)} color={C.pink} />
                    <StatCard label="VIDEOS" value={videos.length} color={C.green} />
                  </div>
                  {promoted.length>0 && (
                    <div style={{ display:"grid", gridTemplateColumns:D.phone?"1fr":"1fr 1fr", gap:10 }}>
                      <div style={{ background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:12, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ color:C.dim, fontSize:9, fontFamily:C.fontBody, letterSpacing:"0.1em", marginBottom:6, fontWeight:700 }}>ORGANIC AVG VIEWS</div>
                          <div style={{ color:C.pink, fontSize:26, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.05em", lineHeight:1 }}>{fmt(organicAvgViews)}</div>
                          <div style={{ color:C.dim, fontSize:10, marginTop:6 }}>{organic.length} videos</div>
                        </div>
                        <div style={{ color:C.green }}>{Icon.ok}</div>
                      </div>
                      <div style={{ background:"#F59E0B0F", border:`1px solid ${C.yellow}44`, borderRadius:12, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ color:C.dim, fontSize:9, fontFamily:C.fontBody, letterSpacing:"0.1em", marginBottom:6, fontWeight:700 }}>PROMOTED AVG VIEWS</div>
                          <div style={{ color:C.yellow, fontSize:26, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.05em", lineHeight:1 }}>{fmt(promotedAvgViews)}</div>
                          <div style={{ color:C.dim, fontSize:10, marginTop:6 }}>{promoted.length} videos · paid</div>
                        </div>
                        <div style={{ color:C.yellow }}>{Icon.rocket}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {hookStats.length>0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
                <div style={{ color:"#fff", fontSize:9, letterSpacing:"0.12em", marginBottom:14, fontFamily:C.fontBody, fontWeight:700, opacity:0.6 }}>HOOK TYPE -- AVG VIEWS</div>
                <div style={{ display:"flex", flexDirection:"column", gap:D.phone?6:7 }}>
                  {hookStats.map((h,i)=>(
                    <div key={h.hook.replace("->","-\u200B>")} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ color:i===0?C.yellow:"#fff", fontSize:D.phone?9:10, width:D.phone?80:D.tablet?110:140, fontFamily:C.fontBody, fontWeight:i===0?700:500, textTransform:"uppercase", letterSpacing:"0.02em", opacity:i===0?1:0.8, lineHeight:1.2 }}>{i===0&&<span style={{color:C.yellow,marginRight:4}}>{Icon.star}</span>}{h.hook}</div>
                      <div style={{ flex:1, height:8, background:C.muted+"44", borderRadius:4 }}><div style={{ height:"100%", width:`${(h.avg/hookStats[0].avg)*100}%`, background:i===0?`linear-gradient(90deg,${C.yellow},${C.yellow}AA)`:C.pink+"66", borderRadius:4, transition:"width 0.3s" }} /></div>
                      <div style={{ color:i===0?C.yellow:C.text, fontSize:11, width:45, textAlign:"right", fontFamily:C.fontHead, letterSpacing:"0.05em" }}>{fmt(h.avg)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {videos.length===0
              ? <Empty icon={Icon.video} title="No videos logged" sub="Log posted videos to unlock AI analysis." action={()=>openModal("addVideo")} actionLabel="LOG FIRST VIDEO" />
              : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
                  {!D.phone && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 55px 65px 60px 55px 36px", padding:"10px 16px", background:C.pinkBg, color:"#fff", fontSize:9, fontWeight:700, letterSpacing:"0.08em", gap:8, fontFamily:C.fontBody, opacity:0.7 }}>
                      {["TITLE","DATE","VIEWS","LIKES","RATIO",""].map(h=><div key={h}>{h}</div>)}
                    </div>
                  )}
                  {sortedVideos.map((v,i)=>{
                    const r=ratio(v); const hot=r>=5;
                    const ps = perfScore(v);
                    return (
                      <div key={v.id} style={{ borderBottom:`1px solid ${C.border}`, background:i===0?C.pink+"08":"transparent" }}>
                        {D.phone ? (
                          <div style={{ padding:"12px 14px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                              <div style={{ flex:1, marginRight:8 }}>
                                <div style={{ color:C.text, fontSize:12, fontFamily:C.fontBody, fontWeight:600, lineHeight:1.3, marginBottom:4 }}>{i===0&&<span style={{ color:C.yellow, marginRight:4 }}>{Icon.star}</span>}{v.title}{ps&&<span style={{ background:ps.score>=65?C.green+"25":ps.score>=50?C.yellow+"25":C.pink+"25", color:ps.score>=65?C.green:ps.score>=50?C.yellow:C.pink, fontSize:8, marginLeft:5, padding:"1px 5px", borderRadius:4, fontFamily:C.fontBody, fontWeight:700 }}>{ps.label}</span>}</div>
                                <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}><Tag color={C.pink} size={8}>{v.type}</Tag><Tag color={C.cyan} size={8}>{v.hook}</Tag>{v.promoted&&<Tag color={C.yellow} size={8}>PAID</Tag>}{v.crossPost&&<Tag color={C.purple} size={8}>TT+IG</Tag>}</div>
                              </div>
                              <div style={{ display:"flex", gap:4 }}>
                                <button onClick={()=>{ setUpdateTarget(v); openModal("updateVideo"); }} style={{ background:C.cyan+"20", border:`1px solid ${C.cyan}40`, borderRadius:8, color:C.cyan, cursor:"pointer", padding:"6px 10px", fontSize:9, fontFamily:C.fontBody, fontWeight:700 }}>24H</button>
                                <button onClick={()=>deleteVideo(v.id)} style={{ background:"#FF2D7815", border:"1px solid #FF2D7840", borderRadius:8, color:"#FF2D78", cursor:"pointer", padding:"6px 8px", display:"flex", alignItems:"center" }}>{Icon.trash}</button>
                              </div>
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                              <div style={{ background:C.cardAlt, borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                                <div style={{ color:C.cyan, fontSize:15, fontWeight:400, fontFamily:C.fontHead }}>{fmt(v.views)}</div>
                                <div style={{ color:C.dim, fontSize:7, fontFamily:C.fontBody, fontWeight:700, letterSpacing:"0.06em" }}>VIEWS</div>
                              </div>
                              <div style={{ background:C.cardAlt, borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                                <div style={{ color:C.pink, fontSize:15, fontWeight:400, fontFamily:C.fontHead }}>{fmt(v.likes)}</div>
                                <div style={{ color:C.dim, fontSize:7, fontFamily:C.fontBody, fontWeight:700, letterSpacing:"0.06em" }}>LIKES</div>
                              </div>
                              <div style={{ background:C.cardAlt, borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                                <div style={{ color:hot?C.yellow:"#fff", fontSize:15, fontWeight:400, fontFamily:C.fontHead }}>{r.toFixed(1)}%</div>
                                <div style={{ color:C.dim, fontSize:7, fontFamily:C.fontBody, fontWeight:700, letterSpacing:"0.06em" }}>RATIO</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 55px 65px 60px 55px 36px", padding:"12px 16px", gap:8, alignItems:"center" }}>
                            <div>
                              <div style={{ color:C.text, fontSize:12, fontFamily:C.fontBody, fontWeight:600, marginBottom:4, lineHeight:1.3 }}>{i===0&&<span style={{ color:C.yellow, marginRight:4 }}>{Icon.star}</span>}{v.title}{ps&&<span style={{ background:ps.score>=65?C.green+"25":ps.score>=50?C.yellow+"25":C.pink+"25", color:ps.score>=65?C.green:ps.score>=50?C.yellow:C.pink, fontSize:8, marginLeft:5, padding:"1px 6px", borderRadius:4, fontFamily:C.fontBody, fontWeight:700 }}>{ps.label}</span>}</div>
                              <div style={{ display:"flex", gap:4 }}><Tag color={C.pink} size={9}>{v.type}</Tag><Tag color={C.cyan} size={9}>{v.hook}</Tag>{v.promoted&&<Tag color={C.yellow} size={9}>PAID</Tag>}{v.crossPost&&<Tag color={C.purple} size={9}>TT+IG</Tag>}</div>
                            </div>
                            <div style={{ color:"#fff", fontSize:10, opacity:0.5, fontFamily:C.fontBody }}>{v.date?.slice(5)}</div>
                            <div style={{ color:C.cyan, fontWeight:400, fontFamily:C.fontHead, fontSize:14, letterSpacing:"0.03em" }}>{fmt(v.views)}</div>
                            <div style={{ color:C.pink, fontWeight:400, fontFamily:C.fontHead, fontSize:14, letterSpacing:"0.03em" }}>{fmt(v.likes)}</div>
                            <div style={{ color:hot?C.yellow:"#fff", fontWeight:400, fontFamily:C.fontHead, fontSize:14, opacity:hot?1:0.6 }}>{r.toFixed(1)}%</div>
                            <div style={{ display:"flex", gap:3 }}>
                              <button onClick={()=>{ setUpdateTarget(v); openModal("updateVideo"); }} style={{ background:C.cyan+"20", border:`1px solid ${C.cyan}50`, borderRadius:6, color:C.cyan, cursor:"pointer", padding:"3px 8px", display:"flex", alignItems:"center", gap:3, fontSize:9, fontFamily:C.fontBody, fontWeight:700 }}>{Icon.refresh}<span>24H</span></button>
                              <button onClick={()=>deleteVideo(v.id)} style={{ background:"#FF2D7815", border:"1px solid #FF2D7840", borderRadius:6, color:"#FF2D78", cursor:"pointer", padding:"3px 7px", display:"flex", alignItems:"center" }}>{Icon.trash}</button>
                            </div>
                          </div>
                        )}
                        {ps && (
                          <div style={{ background:`linear-gradient(135deg,${ps.score>=65?C.green:ps.score>=50?C.yellow:C.pink}08,transparent)`, borderTop:`1px solid ${C.border}40`, padding:D.phone?"10px 14px":"10px 16px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                              <div style={{ color:ps.score>=65?C.green:ps.score>=50?C.yellow:C.pink, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700 }}>24HR PERFORMANCE</div>
                              <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
                                <div style={{ color:ps.score>=65?C.green:ps.score>=50?C.yellow:C.pink, fontSize:26, fontWeight:400, fontFamily:C.fontHead, lineHeight:1 }}>{ps.score}</div>
                                <div style={{ color:C.dim, fontSize:9, fontFamily:C.fontBody }}>/100</div>
                              </div>
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                              {[{label:"VIEWS",val:fmt(v.views),color:C.cyan},{label:"RATIO",val:r.toFixed(1)+"%",color:r>=10?C.green:r>=5?C.yellow:C.pink},{label:"LIKES",val:fmt(v.likes),color:C.purple}].map(({label,val,color})=>(
                                <div key={label} style={{ background:C.card, borderRadius:8, padding:"7px 10px", textAlign:"center" }}>
                                  <div style={{ color, fontSize:D.phone?14:15, fontWeight:400, fontFamily:C.fontHead }}>{val}</div>
                                  <div style={{ color:C.dim, fontSize:7, letterSpacing:"0.08em", fontFamily:C.fontBody, fontWeight:700, marginTop:2 }}>{label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* WHAT'S WORKING */}
        {activeSub==="analysis" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>What's Working</div>
              <Btn small outline color={C.cyan} onClick={()=>runAI("analysis")} disabled={videos.length<2||aiLoad.analysis}>{aiLoad.analysis?"Analysing...":"RUN ANALYSIS"}</Btn>
            </div>
            {!analysis
              ? <Empty icon={Icon.search} title="No analysis yet" sub="Log 2+ videos then run analysis." action={()=>runAI("analysis")} actionLabel="RUN ANALYSIS" disabled={videos.length<2||aiLoad.analysis} />
              : !analysis?.keyPattern ? <div style={{ color:C.dim, padding:"20px", textAlign:"center", fontSize:11, letterSpacing:"0.08em" }}>UNEXPECTED FORMAT -- TAP RUN ANALYSIS AGAIN</div>
              : (
                <>
                  {/* Key Pattern */}
                  <div style={{ background:C.card, border:`1px solid ${C.pink}30`, borderRadius:16, padding:"20px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.pink},${C.purple})` }} />
                    <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>KEY PATTERN</div>
                    <div style={{ color:C.text, fontSize:15, fontWeight:600, fontFamily:C.fontBody, lineHeight:1.6, marginBottom:14 }}>{analysis.keyPattern}</div>
                    <div style={{ background:C.yellow+"12", border:`1px solid ${C.yellow}30`, borderRadius:10, padding:"12px 14px" }}>
                      <div style={{ color:C.yellow, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:6 }}>URGENT FIX</div>
                      <div style={{ color:C.text, fontSize:13, lineHeight:1.6 }}>{analysis.urgentFix}</div>
                    </div>
                  </div>
                  {/* Hook + Format */}
                  <div style={{ display:"grid", gridTemplateColumns:D.cols2, gap:D.gap }}>
                    {[{label:"HOOK",data:analysis.hookAnalysis,bk:"bestHook",wk:"worstHook",color:C.cyan},{label:"FORMAT",data:analysis.typeAnalysis,bk:"bestType",wk:"worstType",color:C.green}].map(({label,data,bk,wk,color})=>(
                      <div key={label} style={{ background:C.card, border:`1px solid ${color}20`, borderRadius:14, padding:D.phone?"12px":"16px" }}>
                        <div style={{ color:color, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:10 }}>{label}</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%", background:C.green, flexShrink:0 }} />
                            <div style={{ color:C.text, fontSize:12, fontWeight:600, fontFamily:C.fontBody }}>{data?.[bk]}</div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%", background:"#FF6B6B", flexShrink:0 }} />
                            <div style={{ color:C.textMed, fontSize:12, fontFamily:C.fontBody }}>{data?.[wk]}</div>
                          </div>
                        </div>
                        <div style={{ color:C.dim, fontSize:11, lineHeight:1.6, fontFamily:C.fontBody }}>{data?.reasoning}</div>
                      </div>
                    ))}
                  </div>
                  {/* Working / Not Working */}
                  {[{title:"WHAT'S WORKING",items:analysis.whatIsWorking,accent:C.green,icon:(i)=>i.impact==="high"?Icon.fire:i.impact==="medium"?Icon.growth:Icon.idea},{title:"NOT WORKING",items:analysis.whatIsNotWorking,accent:"#FF5555",icon:()=>Icon.warning}].map(({title,items,accent,icon})=>(
                    <div key={title} style={{ background:C.card, border:`1px solid ${accent}20`, borderRadius:16, padding:"18px", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:accent }} />
                      <div style={{ color:accent, fontSize:10, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:12 }}>{title}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {items?.map((item,i)=>(
                          <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", background:accent+"0A", borderRadius:10 }}>
                            <div style={{ color:accent, flexShrink:0, marginTop:2 }}>{icon(item)}</div>
                            <div style={{ flex:1 }}>
                              <div style={{ color:C.text, fontSize:13, fontWeight:700, fontFamily:C.fontBody, marginBottom:4, lineHeight:1.3 }}>{item.insight}</div>
                              <div style={{ color:C.textMed, fontSize:12, lineHeight:1.5 }}>{item.evidence}</div>
                              {item.fix && <div style={{ color:C.cyan, fontSize:12, marginTop:6, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><span>&#8594;</span>{item.fix}</div>}
                            </div>
                            {item.impact && <Tag color={item.impact==="high"?C.green:item.impact==="medium"?C.yellow:C.dim} size={8}>{item.impact}</Tag>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )
            }
          </div>
        )}

        {/* NEXT MOVES */}
        {activeSub==="nextVids" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>Next 3 Videos</div>
              <Btn small outline color={C.green} onClick={()=>runAI("nextVids")} disabled={videos.length<2||aiLoad.nextVids}>{aiLoad.nextVids?"Generating...":"REGENERATE"}</Btn>
            </div>
            {!nextVids
              ? <Empty icon={Icon.rocket} title="No moves yet" sub="Log 2+ videos to get AI video recommendations." action={()=>runAI("nextVids")} actionLabel="GENERATE" disabled={videos.length<2||aiLoad.nextVids} />
              : (
                <>
                  <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:4 }}>TIKTOK VIDEOS</div>
                  {(nextVids.tiktok||nextVids.nextVideos)?.map((v,i)=>(
                    <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px", marginBottom:10, position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:i===0?C.pink:i===1?C.cyan:C.green }} />
                      {/* Header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6 }}>
                            <div style={{ color:C.mutedText, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, textTransform:"uppercase" }}>{(v.priority||"MEDIUM").toUpperCase()}</div>
                            <Tag color={C.pink} size={9}>{v.type}</Tag>
                            <Tag color={C.cyan} size={9}>{v.hook}</Tag>
                          </div>
                          <div style={{ color:C.text, fontSize:15, fontWeight:700, fontFamily:C.fontBody, lineHeight:1.4, letterSpacing:"-0.01em" }}>{v.title}</div>
                        </div>
                        <Btn small color={C.pink} onClick={()=>{ addIdea({ id:Date.now(), title:v.title, hook:v.hook, type:v.type, notes:v.whyItWillWork }); }}>+ SAVE</Btn>
                      </div>
                      {/* Opening + Structure */}
                      <div style={{ display:"grid", gridTemplateColumns:D.cols2, gap:D.gapSm, marginBottom:8 }}>
                        <div style={{ background:C.cardAlt, borderRadius:10, padding:"12px 14px" }}>
                          <div style={{ color:C.yellow, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:6 }}>OPENING LINE</div>
                          <div style={{ color:C.text, fontSize:12, fontStyle:"italic", lineHeight:1.6 }}>"{v.openingLine}"</div>
                        </div>
                        <div style={{ background:C.cardAlt, borderRadius:10, padding:"12px 14px" }}>
                          <div style={{ color:C.cyan, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:6 }}>STRUCTURE</div>
                          <div style={{ color:C.textMed, fontSize:12, lineHeight:1.6 }}>{v.structure}</div>
                        </div>
                      </div>
                      {/* Why it'll work */}
                      <div style={{ background:C.green+"0A", border:`1px solid ${C.green}20`, borderRadius:10, padding:"12px 14px" }}>
                        <div style={{ color:C.green, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:6 }}>WHY IT'LL WORK</div>
                        <div style={{ color:C.textMed, fontSize:12, lineHeight:1.6 }}>{v.whyItWillWork}</div>
                      </div>
                    </div>
                  ))}
                  {nextVids.songkranAngle && (
                    <div style={{ background:`linear-gradient(135deg,${C.pink}12,${C.purple}08)`, border:`1px solid ${C.pink}30`, borderRadius:16, padding:"18px" }}>
                      <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>SONGKRAN SPECIAL</div>
                      <div style={{ color:C.text, fontSize:13, lineHeight:1.7 }}>{nextVids.songkranAngle}</div>
                    </div>
                  )}
                </>
              )
            }
          </div>
        )}

        {/* HARLEY BRIEF */}
        {activeSub==="weekly" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>Harley Brief</div>
              <Btn small outline color={C.yellow} onClick={()=>runAI("weekly")} disabled={videos.length<2||aiLoad.weekly} style={{ color:"#fff" }}>{aiLoad.weekly?"Writing...":"REGENERATE"}</Btn>
            </div>
            {!weekly
              ? <Empty icon={Icon.send} title="No brief yet" sub="Generates a WhatsApp-ready summary for Harley." action={()=>runAI("weekly")} actionLabel="Generate Brief" disabled={videos.length<2||aiLoad.weekly} />
              : (
                <>
                  {/* Week summary */}
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />
                    <div style={{ color:C.cyan, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>WEEK SUMMARY</div>
                    <div style={{ color:C.text, fontSize:14, lineHeight:1.7, fontFamily:C.fontBody }}>{weekly.weekSummary}</div>
                  </div>
                  {/* Stats row */}
                  <div style={{ display:"grid", gridTemplateColumns:D.cols2, gap:D.gap }}>
                    {weekly.tiktokHighlight && (
                      <div style={{ background:C.card, border:`1px solid ${C.pink}25`, borderRadius:14, padding:"16px" }}>
                        <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>TIKTOK HIGHLIGHT</div>
                        <div style={{ color:C.text, fontSize:13, fontWeight:700, fontFamily:C.fontBody, marginBottom:6, lineHeight:1.3 }}>{weekly.tiktokHighlight?.title||weekly.topVideo?.title}</div>
                        <div style={{ color:C.textMed, fontSize:12, lineHeight:1.5 }}>{weekly.tiktokHighlight?.whyItWorked||weekly.topVideo?.whyItWorked}</div>
                      </div>
                    )}
                    {weekly.biggestLearning && (
                      <div style={{ background:C.card, border:`1px solid ${C.cyan}25`, borderRadius:14, padding:"16px" }}>
                        <div style={{ color:C.cyan, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>BIGGEST LEARNING</div>
                        <div style={{ color:C.text, fontSize:13, lineHeight:1.6, fontFamily:C.fontBody }}>{weekly.biggestLearning}</div>
                      </div>
                    )}
                  </div>
                  {/* Target */}
                  {weekly.thisWeekTarget && (
                    <div style={{ background:C.yellow+"0F", border:`1px solid ${C.yellow}30`, borderRadius:14, padding:"16px 18px", display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ color:C.yellow, flexShrink:0 }}>{Icon.target}</div>
                      <div>
                        <div style={{ color:C.yellow, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:4 }}>THIS WEEK'S TARGET</div>
                        <div style={{ color:C.text, fontSize:14, fontWeight:700, fontFamily:C.fontBody }}>{weekly.thisWeekTarget}</div>
                      </div>
                    </div>
                  )}
                  {/* Harley brief */}
                  <div style={{ background:C.card, border:`1px solid ${C.pink}25`, borderRadius:16, padding:"18px" }}>
                    <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:12 }}>HARLEY'S BRIEF</div>
                    <div style={{ color:C.text, fontSize:13, lineHeight:1.8, fontFamily:C.fontBody }}>{weekly.harleyBrief}</div>
                  </div>
                  {/* WhatsApp copy */}
                  <div style={{ background:C.card, border:`1px solid ${C.green}25`, borderRadius:16, padding:"18px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div style={{ color:C.green, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700 }}>WHATSAPP COPY</div>
                      <Btn small color={copied.weekly?C.green:C.pink} onClick={()=>copyText("weekly",weekly.rawSummaryText)}>{copied.weekly?"✓ COPIED":"COPY"}</Btn>
                    </div>
                    <div style={{ background:C.cardAlt, borderRadius:10, padding:"14px 16px", color:C.text, fontSize:13, lineHeight:1.9, fontFamily:C.fontBody, whiteSpace:"pre-wrap" }}>{weekly.rawSummaryText}</div>
                  </div>
                </>
              )
            }
          </div>
        )}

        {/* TRENDS */}
        {activeSub==="trends" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>Trend Analysis</div>
              <Btn small color={C.pink} onClick={()=>runAI("trends")} disabled={aiLoad.trends}>{aiLoad.trends?"Analysing...":"REFRESH"}</Btn>
            </div>
            {!trends
              ? <Empty icon={Icon.growth} title="No trends yet" sub="AI maps current TikTok trends to KrapMaps opportunities." action={()=>runAI("trends")} actionLabel="Analyse Trends" color={C.pink} />
              : (
                <>
                  {/* Top opportunity */}
                  {trends.topOpportunity && (
                    <div style={{ background:C.card, border:`1px solid ${C.orange}25`, borderRadius:16, padding:"18px", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.orange},${C.pink})` }} />
                      <div style={{ color:C.orange, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>TOP OPPORTUNITY</div>
                      <div style={{ color:C.text, fontSize:15, fontWeight:700, fontFamily:C.fontBody, lineHeight:1.5 }}>{trends.topOpportunity}</div>
                    </div>
                  )}
                  {/* Songkran */}
                  {trends.songkranTrendAngle && (
                    <div style={{ background:`linear-gradient(135deg,${C.pink}12,${C.purple}08)`, border:`1px solid ${C.pink}25`, borderRadius:16, padding:"18px" }}>
                      <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>SONGKRAN ANGLE</div>
                      <div style={{ color:C.text, fontSize:13, lineHeight:1.7 }}>{trends.songkranTrendAngle}</div>
                    </div>
                  )}
                  {/* Trend cards */}
                  {trends.trends?.map((t,i)=>(
                    <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:t.urgency?.includes("Now")?C.pink:t.urgency?.includes("week")?C.yellow:C.cyan }} />
                      {/* Trend header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:6 }}>
                            <div style={{ color:C.text, fontSize:15, fontWeight:700, fontFamily:C.fontBody, lineHeight:1.3 }}>{t.trend}</div>
                            <Tag color={t.urgency?.includes("Now")?C.pink:t.urgency?.includes("week")?C.yellow:C.cyan} size={9}>{t.urgency}</Tag>
                            <Tag color={C.cyan} size={9}>{t.format}</Tag>
                          </div>
                          {t.why && <div style={{ color:C.textMed, fontSize:12, lineHeight:1.6, marginBottom:12 }}>{t.why}</div>}
                        </div>
                        <Btn small color={C.pink} onClick={()=>{ addIdea({ id:Date.now(), title:t.tiktokAngle||t.contentIdea, hook:"edgy/controversial", type:t.format||"facecam", notes:`Trend: ${t.trend}` }); goTo("content","ideas"); }}>+ SAVE</Btn>
                      </div>
                      {/* Angles */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        <div style={{ background:C.cardAlt, borderRadius:10, padding:"12px 14px" }}>
                          <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:6 }}>TIKTOK ANGLE</div>
                          <div style={{ color:C.text, fontSize:12, lineHeight:1.6 }}>{t.tiktokAngle||t.contentIdea}</div>
                        </div>
                        {t.instagramAngle && (
                          <div style={{ background:C.cardAlt, borderRadius:10, padding:"12px 14px" }}>
                            <div style={{ color:C.purple, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:6 }}>INSTAGRAM ANGLE</div>
                            <div style={{ color:C.text, fontSize:12, lineHeight:1.6 }}>{t.instagramAngle}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )
            }
          </div>
        )}
      </div>
    );
  };


  // TASKS & IDEAS VIEW
  const TasksView = () => {
    const [taskInput, setTaskInput]       = useState("");
    const [ideaInput, setIdeaInput]       = useState("");
    const [taskAssign, setTaskAssign]     = useState("Bk");
    const [aiRecs, setAiRecs]             = useState(null);
    const [aiRecLoad, setAiRecLoad]       = useState(false);
    const [aiRecErr, setAiRecErr]         = useState(null);
    const activeTab = tasksTab;
    const setActiveTab = setTasksTab;

    const addTask = () => {
      if(!taskInput.trim()) return;
      setTasks(ts=>[{ id:Date.now(), text:taskInput.trim(), done:false, assignee:taskAssign, created:today() }, ...ts]);
      setTaskInput("");
    };

    const addIdea = () => {
      if(!ideaInput.trim()) return;
      const newIdea = { id:Date.now(), text:ideaInput.trim(), category:"feature", created:today() };
      setAppIdeas(is=>[newIdea, ...is]);
      setIdeaInput("");
      // Auto score after add
      setTimeout(() => scoreAppIdea(newIdea), 300);
    };

    async function scoreAppIdea(idea) {
      setAiLoad(l=>({...l,["ai"+idea.id]:true}));
      try {
        const r = await callAI('Score this feature idea for KrapMaps -- a litter bin finder app where users crowdsource bin locations. NOT a toilet app. Score genuinely and vary scores -- avoid round numbers. Return JSON only: {"appScore": precise integer 0-100 based on real value to the app,"verdict":"honest punchy sentence","impact":"high|medium|low","effort":"high|medium|low","recommendation":"one specific actionable step"}. Idea:"' + idea.text + '"', 600);
        setAppIdeas(is=>is.map(i=>i.id===idea.id?{...i,score:r}:i));
      } catch(e) {}
      setAiLoad(l=>({...l,["ai"+idea.id]:false}));
    }

    async function analyseAndRecommend() {
      setAiRecLoad(true); setAiRecErr(null);
      try {
        const todoSummary = tasks.filter(t=>!t.done).map(t=>({ task:t.text, assignee:t.assignee }));
        const ideasSummary = appIdeas.map(i=>i.text);
        const result = await callAI('Advise KrapMaps app and Content OS business. Analyse current todos and app ideas. Return valid JSON only: {"analysis":"2 sentences","recommendations":[{"title":"string","why":"one sentence","category":"feature|content|business|growth","assignee":"Bk|Harley|Both"}],"topPriority":"one sentence"}. Todos:' + JSON.stringify(todoSummary) + ' Ideas:' + JSON.stringify(ideasSummary), 1200);
        setAiRecs(result);
      } catch(e) { setAiRecErr("AI error: " + e.message); }
      setAiRecLoad(false);
    }

    const pendingTasks = tasks.filter(t=>!t.done);
    const doneTasks = tasks.filter(t=>t.done);

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:D.phone?10:14 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>TASKS & IDEAS</div>
          <Btn small color={C.purple} onClick={analyseAndRecommend} disabled={aiRecLoad}>{aiRecLoad?"Analysing...":"AI RECOMMEND"}</Btn>
        </div>

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:4, background:C.card, padding:"5px", borderRadius:10, border:`1px solid ${C.border}` }}>
          {[["todo","To Do"],["ideas","Ideas"],["done","Done"]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{ flex:1, padding:"8px", borderRadius:8, border:"none", background:activeTab===id?C.pink:"transparent", color:"#fff", fontFamily:C.fontBody, fontWeight:700, fontSize:11, cursor:"pointer", transition:"all 0.2s", opacity:activeTab===id?1:0.45, letterSpacing:"0.04em" }}>{label}{id==="todo"&&pendingTasks.length>0?` (${pendingTasks.length})`:id==="done"&&doneTasks.length>0?` (${doneTasks.length})`:""}</button>
          ))}
        </div>

        {/* AI Analysis */}
        {aiRecErr && <div style={{ color:"#FF6B6B", fontSize:11, background:"#FF2D2D0A", borderRadius:10, padding:"10px 14px" }}>Error: {aiRecErr}</div>}
        {aiRecs && (
          <div style={{ background:`linear-gradient(135deg,${C.card},${C.purple}0A)`, border:`1px solid ${C.purple}30`, borderRadius:14, padding:"16px 18px" }}>
            <div style={{ color:C.purple, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>AI ANALYSIS</div>
            <div style={{ color:C.textMed, fontSize:12, lineHeight:1.6, marginBottom:10 }}>{aiRecs.analysis||""}</div>
            {aiRecs.topPriority && (
              <div style={{ background:C.pink+"15", border:`1px solid ${C.pink}30`, borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700, marginBottom:4 }}>TOP PRIORITY</div>
                <div style={{ color:C.text, fontSize:12, fontWeight:600, fontFamily:C.fontBody }}>{aiRecs.topPriority}</div>
              </div>
            )}
            <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, fontWeight:700, marginBottom:8 }}>RECOMMENDED NEXT IDEAS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {aiRecs.recommendations?.map((r,i)=>(
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                      <div style={{ color:C.text, fontSize:14, fontWeight:700, fontFamily:C.fontBody, lineHeight:1.3 }}>{r.title}</div>
                      <Tag color={r.category==="feature"?C.cyan:r.category==="business"?C.purple:r.category==="growth"?C.green:C.yellow} size={8}>{r.category}</Tag>
                      <Tag color={r.assignee==="Harley"?C.orange:r.assignee==="Both"?C.purple:C.pink} size={8}>{r.assignee}</Tag>
                    </div>
                    <div style={{ color:C.textMed, fontSize:12, lineHeight:1.6 }}>{r.why||r.reason||""}</div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={()=>{ setAppIdeas(is=>[{ id:Date.now(), text:r.title, category:r.category, created:today() },...is]); }} style={{ background:C.green+"20", border:`1px solid ${C.green}40`, borderRadius:7, color:C.green, cursor:"pointer", padding:"4px 10px", fontSize:10, fontFamily:C.fontBody, fontWeight:600 }}>+ Add</button>
                    <button onClick={()=>setAiRecs(prev=>({...prev,recommendations:prev.recommendations.filter((_,j)=>j!==i)}))} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:7, color:C.dim, cursor:"pointer", padding:"4px 8px", display:"flex", alignItems:"center" }}>{Icon.trash}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TO DO TAB */}
        {activeTab==="todo" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Add task */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <input value={taskInput} onChange={e=>setTaskInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Add a task..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:D.phone?"8px 10px":"10px 14px", fontSize:D.phone?12:13, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }} />
              <div style={{ display:"flex", gap:3, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"3px", flexShrink:0 }}>
                {["Bk","H","Both"].map(a=>(
                  <button key={a} onClick={()=>setTaskAssign(a==="H"?"Harley":a)} style={{ padding:D.phone?"3px 7px":"4px 10px", borderRadius:7, border:"none", background:(taskAssign==="Harley"?a==="H":taskAssign===a)?C.pink:"transparent", color:"#fff", fontFamily:C.fontBody, fontSize:D.phone?9:10, fontWeight:700, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.03em", opacity:(taskAssign==="Harley"?a==="H":taskAssign===a)?1:0.5 }}>{a}</button>
                ))}
              </div>
              <Btn onClick={addTask} disabled={!taskInput.trim()}>{Icon.plus}</Btn>
            </div>
            {/* Task list */}
            {pendingTasks.length===0
              ? <div style={{ textAlign:"center", padding:"32px", color:C.dim, fontSize:11, fontFamily:C.fontBody, letterSpacing:"0.08em" }}>NO TASKS -- YOU'RE CLEAR</div>
              : pendingTasks.map(t=>(
                <div key={t.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                  <button onClick={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:true}:x))} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${C.pink}`, background:"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:C.pink }} />
                  <div style={{ flex:1 }}>
                    <div style={{ color:C.text, fontSize:13, fontFamily:C.fontBody, fontWeight:500, textTransform:"none", lineHeight:1.4 }}>{t.text}</div>
                    <div style={{ color:C.dim, fontSize:10, marginTop:2 }}>{t.created?new Date(t.created).toLocaleDateString("en-GB",{day:"numeric",month:"short"}):""}</div>
                  </div>
                  <Tag color={t.assignee==="Harley"?C.orange:t.assignee==="Both"?C.purple:C.pink} size={9}>{t.assignee}</Tag>
                  <button onClick={()=>setTasks(ts=>ts.filter(x=>x.id!==t.id))} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:7, color:C.dim, cursor:"pointer", padding:"3px 7px", display:"flex", alignItems:"center" }}>{Icon.trash}</button>
                </div>
              ))
            }
          </div>
        )}

        {/* APP IDEAS TAB */}
        {activeTab==="ideas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Add idea */}
            <div style={{ display:"flex", gap:8 }}>
              <input value={ideaInput} onChange={e=>setIdeaInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIdea()} placeholder="Add an idea..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:D.phone?"8px 10px":"10px 14px", fontSize:D.phone?12:13, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }} />
              <Btn onClick={addIdea} disabled={!ideaInput.trim()}>{Icon.plus}</Btn>
            </div>
            {/* Ideas list */}
            {appIdeas.length===0
              ? <div style={{ textAlign:"center", padding:"32px", color:C.dim, fontSize:11, fontFamily:C.fontBody, letterSpacing:"0.08em" }}>NO IDEAS YET -- TAP AI RECOMMEND</div>
              : appIdeas.map(idea=>(
                <div key={idea.id} style={{ background:C.card, border:`1px solid ${idea.score?.appScore>=70?C.cyan+"40":C.border}`, borderRadius:14, padding:"14px 16px" }}>
                  {/* Idea header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:idea.score?10:4 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ color:C.text, fontSize:13, fontFamily:C.fontBody, fontWeight:600, lineHeight:1.4, textTransform:"none" }}>{idea.text}</div>
                      <div style={{ color:C.dim, fontSize:10, marginTop:3 }}>{idea.created?new Date(idea.created).toLocaleDateString("en-GB",{day:"numeric",month:"short"}):""}</div>
                    </div>
                    {idea.score && (
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <div style={{ color:idea.score.appScore>=70?C.green:idea.score.appScore>=50?C.yellow:C.pink, fontSize:26, fontWeight:400, fontFamily:C.fontHead, lineHeight:1 }}>{idea.score.appScore}</div>
                        <div style={{ color:C.dim, fontSize:8, fontFamily:C.fontBody, fontWeight:700, letterSpacing:"0.1em" }}>SCORE</div>
                      </div>
                    )}
                  </div>
                  {/* Score details */}
                  {idea.score && (
                    <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:10 }}>
                      <div style={{ background:C.pink+"10", border:`1px solid ${C.pink}20`, borderRadius:9, padding:"9px 12px" }}>
                        <div style={{ color:C.pink, fontSize:12, fontWeight:600, fontFamily:C.fontBody }}>{idea.score.verdict}</div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                        <div style={{ background:C.cardAlt, borderRadius:8, padding:"8px 10px" }}>
                          <div style={{ color:C.dim, fontSize:8, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700, marginBottom:3 }}>IMPACT</div>
                          <Tag color={idea.score.impact==="high"?C.green:idea.score.impact==="medium"?C.yellow:C.dim} size={9}>{idea.score.impact}</Tag>
                        </div>
                        <div style={{ background:C.cardAlt, borderRadius:8, padding:"8px 10px" }}>
                          <div style={{ color:C.dim, fontSize:8, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700, marginBottom:3 }}>EFFORT</div>
                          <Tag color={idea.score.effort==="low"?C.green:idea.score.effort==="medium"?C.yellow:C.pink} size={9}>{idea.score.effort}</Tag>
                        </div>
                      </div>
                      {idea.score.recommendation && (
                        <div style={{ background:C.green+"0A", border:`1px solid ${C.green}20`, borderRadius:8, padding:"9px 12px" }}>
                          <div style={{ color:C.green, fontSize:8, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700, marginBottom:4 }}>RECOMMENDATION</div>
                          <div style={{ color:C.textMed, fontSize:12, lineHeight:1.5 }}>{idea.score.recommendation}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Actions */}
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn small color={C.purple} onClick={()=>scoreAppIdea(idea)} disabled={aiLoad["ai"+idea.id]}>{aiLoad["ai"+idea.id]?"SCORING...":idea.score?"RE-SCORE":"SCORE IT"}</Btn>
                    <Btn small outline color={C.pink} onClick={()=>{ setTasks(ts=>[{ id:Date.now(), text:idea.text, done:false, assignee:"Both", created:today() },...ts]); setActiveTab("todo"); }}>TO DO</Btn>
                    <button onClick={()=>setAppIdeas(is=>is.filter(x=>x.id!==idea.id))} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:7, color:C.dim, cursor:"pointer", padding:"3px 7px", display:"flex", alignItems:"center", marginLeft:"auto" }}>{Icon.trash}</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* DONE TAB */}
        {activeTab==="done" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {doneTasks.length===0
              ? <div style={{ textAlign:"center", padding:"32px", color:C.dim, fontSize:11, fontFamily:C.fontBody, letterSpacing:"0.08em" }}>NOTHING COMPLETED YET</div>
              : doneTasks.map(t=>(
                <div key={t.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, opacity:0.6 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:C.green+"30", border:`2px solid ${C.green}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.green, flexShrink:0 }}>{Icon.check}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:C.text, fontSize:13, fontFamily:C.fontBody, fontWeight:500, textDecoration:"line-through", textTransform:"none" }}>{t.text}</div>
                  </div>
                  <Tag color={t.assignee==="Harley"?C.orange:t.assignee==="Both"?C.purple:C.pink} size={9}>{t.assignee}</Tag>
                  <button onClick={()=>setTasks(ts=>ts.filter(x=>x.id!==t.id))} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:7, color:C.dim, cursor:"pointer", padding:"3px 7px", display:"flex", alignItems:"center" }}>{Icon.trash}</button>
                </div>
              ))
            }
            {doneTasks.length>0 && (
              <Btn outline color={C.dim} onClick={()=>setTasks(ts=>ts.filter(t=>!t.done))}>Clear completed ({doneTasks.length})</Btn>
            )}
          </div>
        )}
      </div>
    );
  };

  // GROWTH
  const GrowthView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:D.phone?10:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>Growth Stats</div>
        <Btn small outline color={C.pink} onClick={()=>openModal("editStats")}>Update Stats</Btn>
      </div>

      {/* TikTok */}
      <div style={{ background:C.card, border:`1px solid ${C.borderStrong}`, borderRadius:14, padding:D.phone?"12px 14px":"18px 20px", borderTop:`1px solid ${C.pink}30` }}>
        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, marginBottom:12, fontWeight:700 }}>TIKTOK (@findkrap)</div>
        <div style={{ display:"grid", gridTemplateColumns:D.cols4, gap:D.gapSm }}>
          <StatCard label="FOLLOWERS" value={fmt(m.tt_followers||0)} color={C.pink} sub={m.tt_date||"--"} />
          <StatCard label="TOTAL VIEWS" value={fmt(ttViewsDisplay)} color={C.cyan} sub="from videos" />
          <StatCard label="TOTAL LIKES" value={fmt(m.tt_likes||0)} color={C.pink} />
          <StatCard label="BINS MAPPED" value={fmt(m.bins||0)} color={C.yellow} sub={m.bins_date||"--"} />
        </div>
      </div>

      {/* Instagram */}
      <div style={{ background:C.card, border:`1px solid ${C.borderStrong}`, borderRadius:14, padding:"16px 18px", borderTop:`1px solid ${C.purple}40` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700 }}>INSTAGRAM (@{igData?.profile?.username||"findkrap"})</div>
          {hasIG && <Btn small outline color={C.purple} onClick={fetchIG} disabled={igLoad}>{igLoad?"...":"REFRESH"}</Btn>}
        </div>
        {!hasIG && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            <StatCard label="FOLLOWERS" value="--" color={C.purple} sub="add key in Settings" />
            <StatCard label="AVG VIEWS" value="--" color={C.cyan} />
            <StatCard label="AVG LIKES" value="--" color={C.pink} />
            <StatCard label="POSTS" value="--" color={C.green} />
          </div>
        )}
        {igLoad && <div style={{ color:C.dim, fontSize:12, padding:"12px 0" }}>Fetching Instagram...</div>}
        {igError && <div style={{ color:"#FF6B6B", fontSize:11, marginBottom:8 }}>Error: {igError}</div>}
        {igData && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:D.cols4, gap:D.gapSm, marginBottom:14 }}>
              <StatCard label="FOLLOWERS" value={igData.profile.followers_count!=null?fmt(igData.profile.followers_count):"--"} color={C.purple} sub="live" />
              <StatCard label="AVG REEL VIEWS" value={igData.media?.filter(p=>p.media_type==="VIDEO"||p.media_type==="REEL").length?fmt(Math.round(igData.media.filter(p=>p.media_type==="VIDEO"||p.media_type==="REEL").reduce((s,p)=>s+(igViews(p)||0),0)/Math.max(igData.media.filter(p=>p.media_type==="VIDEO"||p.media_type==="REEL").length,1))):"--"} color={C.cyan} sub="avg per reel" />
              <StatCard label="AVG LIKES" value={igData.media?.length?fmt(Math.round(igData.media.reduce((s,p)=>s+(p.like_count||0),0)/igData.media.length)):"--"} color={C.pink} sub="last 20 posts" />
              <StatCard label="POSTS" value={igData?.profile?.media_count!=null?fmt(igData.profile.media_count):"--"} color={C.green} sub="total" />
            </div>
          </>
        )}
      </div>

      {/* App Store */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.cyan}` }}>
        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, marginBottom:12, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>APP STORE {hasApple&&<Tag color={C.green} size={8}>KEY SAVED</Tag>}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[["iOS Downloads","ios_downloads","number"],["iOS Rating","ios_rating","text"],["iOS Reviews","ios_reviews","number"],["Active Users","ios_active","number"]].map(([label,key,type])=>(
            <div key={key}>
              <div style={{ color:C.textMed, fontSize:9, letterSpacing:"0.1em", marginBottom:4, fontFamily:C.fontBody, fontWeight:600, textTransform:"uppercase" }}>{label}</div>
              <input type={type} value={m[key]||""} onChange={e=>setManualData(d=>({...d,[key]:e.target.value}))} placeholder="0" style={{ width:"100%", background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:12, fontFamily:C.fontMono, outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Google Play */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.green}` }}>
        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.12em", fontFamily:C.fontBody, marginBottom:12 }}>▶️ GOOGLE PLAY {hasPlay&&<Tag color={C.green} size={8}>KEY SAVED</Tag>}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[["Android Installs","android_installs","number"],["Android Rating","android_rating","text"],["Android Reviews","android_reviews","number"],["Active Users","android_active","number"]].map(([label,key,type])=>(
            <div key={key}>
              <div style={{ color:C.textMed, fontSize:9, letterSpacing:"0.1em", marginBottom:4, fontFamily:C.fontBody, fontWeight:600, textTransform:"uppercase" }}>{label}</div>
              <input type={type} value={m[key]||""} onChange={e=>setManualData(d=>({...d,[key]:e.target.value}))} placeholder="0" style={{ width:"100%", background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:12, fontFamily:C.fontMono, outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // SETTINGS
  const SettingsView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ color:C.text, fontSize:D.phone?18:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em" }}>Settings</div>
      {/* White Label Config */}
      <div style={{ background:C.card, border:`1px solid ${C.purple}30`, borderRadius:14, padding:"16px 18px" }}>
        <div style={{ color:C.purple, fontSize:9, letterSpacing:"0.14em", fontFamily:C.fontBody, fontWeight:700, marginBottom:12 }}>WHITE LABEL</div>
        <div style={{ color:C.dim, fontSize:11, lineHeight:1.7, marginBottom:10 }}>To rebrand for a client, edit the <span style={{ color:C.cyan, fontFamily:C.fontMono, fontSize:10 }}>WL</span> config at the top of the source file. Change appName, handle, accentColor, brandContext. Then redeploy.</div>
        <div style={{ background:C.cardAlt, borderRadius:10, padding:"10px 12px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[["App Name", WL.appName],["Handle", WL.handle],["Creator 1", WL.creator1],["Creator 2", WL.creator2]].map(([k,v])=>(
              <div key={k}>
                <div style={{ color:C.dim, fontSize:8, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700 }}>{k}</div>
                <div style={{ color:C.text, fontSize:12, fontFamily:C.fontBody, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:20, height:20, borderRadius:6, background:WL.accentColor, border:"1px solid rgba(255,255,255,0.2)" }} />
            <div style={{ color:C.text, fontSize:11, fontFamily:C.fontMono }}>{WL.accentColor}</div>
          </div>
        </div>
      </div>

      {/* SUPABASE */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.purple}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <div style={{ color:C.text, fontSize:13, fontWeight:800, fontFamily:C.fontBody }}>🗄 Database (Supabase)</div>
            <div style={{ color:C.dim, fontSize:11, marginTop:2 }}>Saves everything permanently -- survives between sessions</div>
          </div>
          <Tag color={C.purple} size={9}>CONNECTED</Tag>
        </div>
        <div style={{ background:C.pinkBg, borderRadius:10, padding:"12px 14px", fontSize:11, color:C.dim, lineHeight:1.6 }}>
          Connected to your Supabase project. All videos, ideas, calendar and stats are saved permanently. <br/>
          <strong style={{ color:C.purple }}>One time setup required:</strong> Go to supabase.com / your project / SQL Editor / run the setup SQL below.
        </div>
        <div style={{ marginTop:10, background:C.bg, borderRadius:8, padding:"10px 12px", fontSize:10, fontFamily:C.fontMono, color:C.text, overflowX:"auto" }}>
          {"create table if not exists km_videos (id int primary key, value text, updated_at timestamptz); create table if not exists km_ideas (id int primary key, value text, updated_at timestamptz); create table if not exists km_calendar (id int primary key, value text, updated_at timestamptz); create table if not exists km_manual (id int primary key, value text, updated_at timestamptz); create table if not exists km_trends (id int primary key, value text, updated_at timestamptz); create table if not exists km_tasks (id int primary key, value text, updated_at timestamptz); create table if not exists km_appideas (id int primary key, value text, updated_at timestamptz);"}
        </div>
        <div style={{ color:C.dim, fontSize:10, marginTop:8 }}>Copy this SQL to Supabase SQL Editor and Run. One time only.</div>
      </div>

      {/* API Keys */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px" }}>
        <div style={{ color:C.dim, fontSize:8, letterSpacing:"0.15em", fontFamily:C.fontBody, marginBottom:12, fontWeight:700 }}>API KEYS</div>
        <SetupScreen existingKeys={keys} onSave={newKeys=>{ onEditKeys(newKeys); }} />
      </div>
      {/* Songkran */}
      <div style={{ background:`linear-gradient(135deg,${C.pink},${C.pinkDark})`, borderRadius:16, padding:"22px 24px", boxShadow:`0 8px 32px ${C.pink}44` }}>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:36 }}>💦🎉🗑</div>
          <div style={{ color:"#fff", fontSize:22, fontWeight:900, fontFamily:C.fontHead, marginTop:8 }}>Songkran Activation</div>
          <div style={{ color:"rgba(255,255,255,0.9)", fontSize:13, fontWeight:700, marginTop:4, fontFamily:C.fontBody }}>April 13-15 · Thailand</div>
          <div style={{ display:"inline-block", background:"rgba(255,255,255,0.25)", color:"#fff", fontFamily:C.fontHead, fontWeight:900, fontSize:16, padding:"9px 24px", borderRadius:100, marginTop:12, border:"1px solid rgba(255,255,255,0.4)" }}>T-{daysToSongkran} days</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:D.phone?"1fr":"1fr 1fr", gap:10 }}>
          {[
            {title:"🎥 Content Goals",color:C.pink,items:["Bin-finding during Songkran chaos",'"No bins in Thailand" hook','City vs. city leaderboard','Participant reaction facecam','Double points geo-zone clip']},
            {title:"📱 In-App Features",color:C.cyan,items:["Songkran badge (limited)","City vs. city leaderboard","One-tap share card","Geo-based double points","Minigame promo"]},
            {title:"🤝 Outreach",color:C.yellow,items:["Thai universities","Drink brands (Chang, Leo)","Expat groups","Shopping malls","NGO waste partners"]},
            {title:"📊 Targets",color:C.green,items:["200+ bins in Thailand","Views from Songkran content","Downloads during festival","Leaderboard participants","Festival-goer shares"]},
          ].map(({title,color,items})=>(
            <div key={title} style={{ background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"14px 16px" }}>
              <div style={{ color:"#fff", fontWeight:800, fontSize:12, fontFamily:C.fontBody, marginBottom:8 }}>{title}</div>
              {items.map((item,i)=>(
                <div key={i} style={{ display:"flex", gap:6, marginBottom:5 }}>
                  <div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,0.6)", marginTop:5, flexShrink:0 }} />
                  <div style={{ color:"rgba(255,255,255,0.9)", fontSize:11, lineHeight:1.4 }}>{item}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Empty state helper
  function Empty({ icon, title, sub, action, actionLabel, disabled=false, color=C.pink }) {
    return (
      <div style={{ background:C.card, border:`1px dashed ${C.border}`, borderRadius:16, padding:"48px 24px", textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16, color:C.mutedText }}>
          <div style={{ transform:"scale(2.8)", display:"inline-block" }}>{icon}</div>
        </div>
        <div style={{ color:"#fff", fontSize:13, fontWeight:700, fontFamily:C.fontBody, marginBottom:6, letterSpacing:"0.02em" }}>{title}</div>
        <div style={{ color:"#fff", fontSize:10, marginBottom:20, lineHeight:1.6, opacity:0.5 }}>{sub}</div>
        {action && <Btn color={color} onClick={action} disabled={disabled}>{actionLabel}</Btn>}
      </div>
    );
  }


  // UPDATE VIDEO STATS MODAL (24hr scan)
  const UpdateVideoModal = () => {
    const v = updateTarget;
    const [mode, setMode] = useState("screenshot");
    const [form, setForm] = useState({ views:String(v?.views||0), likes:String(v?.likes||0), comments:String(v?.comments||0), shares:String(v?.shares||0) });
    const [scanning, setScanning] = useState(false);
    const [scanErr, setScanErr] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileRef = useRef();
    const set = (k,val) => setForm(f=>({...f,[k]:val}));

    async function scanUpdate(file) {
      setScanning(true); setScanErr(null);
      setPreview(URL.createObjectURL(file));
      try {
        const b64 = await new Promise((res,rej)=>{
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const max = 1024;
            let w = img.width, h = img.height;
            if(w > max || h > max) { if(w > h) { h = Math.round(h*max/w); w=max; } else { w=Math.round(w*max/h); h=max; } }
            canvas.width = w; canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            res(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
            URL.revokeObjectURL(url);
          };
          img.onerror = rej;
          img.src = url;
        });
        const scanHeaders = {"Content-Type":"application/json"};
        const isVercel2 = window.location.hostname.includes("vercel.app") || window.location.hostname.includes("krapmaps");
        const scanUrl = isVercel2 ? "/api/proxy" : "https://api.anthropic.com/v1/messages";
        if(!isVercel2) { scanHeaders["x-api-key"] = ANTHROPIC_KEY; scanHeaders["anthropic-version"] = "2023-06-01"; scanHeaders["anthropic-dangerous-direct-browser-access"] = "true"; }
        const resp = await fetch(scanUrl, {
          method:"POST", headers:scanHeaders,
          body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400, system:SYSTEM,
            messages:[{ role:"user", content:[
              { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:b64 }},
              { type:"text", text:'This is a TikTok video analytics or video page screenshot taken ~24 hours after posting. Extract the current stats. Views = play count (largest number, often shown prominently). Likes = heart count. Comments = speech bubble count. Shares = arrow/forward count. Return JSON only: {"views":number or null,"likes":number or null,"comments":number or null,"shares":number or null,"saves":number or null,"confidence":"high|medium|low","note":"anything unusual about the numbers"}. Convert ALL abbreviated numbers: 14.2K=14200, 1.3M=1300000, 87.7K=87700. Return null only if truly not visible, not if you are unsure -- make your best estimate.' }
            ]}]
          })
        });
        const rawText = await resp.text();
        let data;
        try { data = JSON.parse(rawText); } catch(e) { throw new Error("Invalid response: " + rawText.slice(0,100)); }
        if(data.error) throw new Error(data.error.message);
        const text = data.content?.map(b=>b.text||"").join("")||"";
        const p = JSON.parse(text.replace(/```json|```/g,"").trim());
        setForm(f=>({
          views: p.views!=null?String(p.views):f.views,
          likes: p.likes!=null?String(p.likes):f.likes,
          comments: p.comments!=null?String(p.comments):f.comments,
          shares: p.shares!=null?String(p.shares):f.shares,
        }));
        setMode("manual");
      } catch(e) { setScanErr("Scan failed: "+e.message); }
      setScanning(false);
    }

    function save() {
      updateVideo(v.id, {
        views:parseInt(form.views)||v.views,
        likes:parseInt(form.likes)||v.likes,
        comments:parseInt(form.comments)||v.comments,
        shares:parseInt(form.shares)||v.shares,
        _updated: today(),
      });
      closeModal("updateVideo");
    }

    if(!v) return null;
    return (
      <Modal title="Update Stats" onClose={()=>closeModal("updateVideo")}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Video title */}
          <div style={{ background:C.cardAlt, borderRadius:10, padding:"10px 14px" }}>
            <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700, marginBottom:4 }}>UPDATING</div>
            <div style={{ color:C.text, fontSize:D.phone?11:13, fontWeight:600, fontFamily:C.fontBody, lineHeight:1.3 }}>{v.title}</div>
            <div style={{ color:C.dim, fontSize:10, marginTop:3 }}>{v.date} · {v.views?.toLocaleString()} views when logged</div>
          </div>

          {/* Mode switcher */}
          <div style={{ display:"flex", gap:4, background:C.card, padding:"4px", borderRadius:10, border:`1px solid ${C.border}` }}>
            {[["screenshot","Scan Screenshot"],["manual","Manual Entry"]].map(([m,l])=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, background:mode===m?C.cyan:"transparent", border:"none", borderRadius:7, padding:"7px", color:"#fff", fontFamily:C.fontBody, fontWeight:700, fontSize:11, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.05em", opacity:mode===m?1:0.5 }}>{l}</button>
            ))}
          </div>

          {/* Screenshot drop zone */}
          {mode==="screenshot" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div
                onClick={()=>fileRef.current?.click()}
                onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer?.files?.[0]; if(f) scanUpdate(f); }}
                onDragOver={e=>e.preventDefault()}
                style={{ border:`2px dashed ${scanning?C.cyan:C.border}`, borderRadius:14, padding:"28px 20px", textAlign:"center", cursor:"pointer", background:scanning?C.cyan+"08":C.card, transition:"all 0.2s" }}
              >
                {scanning ? (
                  <div style={{ color:C.cyan, fontWeight:700, fontFamily:C.fontBody, fontSize:14 }}>Reading stats...</div>
                ) : (
                  <>
                    <div style={{ color:C.cyan, display:"flex", justifyContent:"center", marginBottom:10 }}><div style={{ transform:"scale(2)", display:"inline-block" }}>{Icon.camera}</div></div>
                    <div style={{ color:C.text, fontWeight:700, fontFamily:C.fontBody, fontSize:14, marginBottom:4 }}>Drop 24hr screenshot</div>
                    <div style={{ color:C.dim, fontSize:11 }}>or tap to pick from photos</div>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) scanUpdate(e.target.files[0]); }} />
              </div>
              {scanErr && <div style={{ color:"#FF6B6B", fontSize:11, background:"#FF2D2D0A", borderRadius:8, padding:"8px 12px" }}>{scanErr}</div>}
              {preview && !scanning && <img src={preview} style={{ maxHeight:120, maxWidth:"100%", objectFit:"contain", borderRadius:8 }} alt="preview" />}
            </div>
          )}

          {/* Manual entry */}
          {mode==="manual" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["VIEWS","views"],["LIKES","likes"],["COMMENTS","comments"],["SHARES","shares"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:C.fontBody, fontWeight:700, marginBottom:4, textTransform:"uppercase" }}>{label}</div>
                  <input type="number" value={form[key]} onChange={e=>set(key,e.target.value)} style={{ width:"100%", background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:9, color:C.text, padding:"9px 12px", fontSize:14, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", letterSpacing:"0.04em" }} />
                </div>
              ))}
            </div>
          )}

          <Btn full color={C.cyan} onClick={save}>SAVE UPDATED STATS</Btn>
        </div>
      </Modal>
    );
  };

  // MODALS
  const AddVideoModal = () => {
    const [mode, setMode]         = useState("screenshot");
    const [form, setForm]         = useState({ date:today(), type:"facecam", hook:"edgy/controversial", crossPost:true });
    const [scanning, setScanning] = useState(false);
    const [scanErr, setScanErr]   = useState(null);
    const [preview, setPreview]   = useState(null);
    const fileRef                 = useRef();
    const set = (k,v) => setForm(f=>({...f,[k]:v}));

    async function analyseScreenshot(file, platform="tiktok") {
      setScanning(true); setScanErr(null);
      setPreview(URL.createObjectURL(file));
      try {
        const b64 = await new Promise((res,rej)=>{
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const max = 1024;
            let w = img.width, h = img.height;
            if(w > max || h > max) { if(w > h) { h = Math.round(h*max/w); w=max; } else { w=Math.round(w*max/h); h=max; } }
            canvas.width = w; canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            res(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
            URL.revokeObjectURL(url);
          };
          img.onerror = rej;
          img.src = url;
        });
        const scanHeaders = {"Content-Type":"application/json"};
        const isVercel2 = window.location.hostname.includes("vercel.app") || window.location.hostname.includes("krapmaps");
        const scanUrl = isVercel2 ? "/api/proxy" : "https://api.anthropic.com/v1/messages";
        if(!isVercel2) { scanHeaders["x-api-key"] = ANTHROPIC_KEY; scanHeaders["anthropic-version"] = "2023-06-01"; scanHeaders["anthropic-dangerous-direct-browser-access"] = "true"; }
        const resp = await fetch(scanUrl, {
          method:"POST", headers:scanHeaders,
          body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800, system:SYSTEM,
            messages:[{ role:"user", content:[
              { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:b64 }},
              { type:"text", text:'This is a TikTok screenshot. Extract stats carefully. On TikTok: Views appear as the large number on the video or in analytics. Likes are the heart count. Comments are the speech bubble count. Shares are the arrow count. Bookmarks/saves may also appear. Return JSON only: {"title":"video caption text or description","date":"YYYY-MM-DD if visible or null","views":number or null (look for play count or view count - the biggest number),"likes":number or null (heart icon count),"comments":number or null (comment bubble count),"shares":number or null (share/arrow count),"saves":number or null (bookmark count if visible),"type":"facecam|street|screencap|voiceover|mixed","hook":"edgy/controversial|problem->solution|gamification|achievement|challenge|reaction|demo|other","promoted":false,"confidence":"high|medium|low","notes":"anything notable about the video"}. IMPORTANT: Convert ALL abbreviated numbers (14.2K=14200, 1.3M=1300000, 4.4K=4400). If a number is ambiguous look for context clues. Return null only if truly not visible.' }
            ]}]
          })
        });
        const rawText = await resp.text();
        let data;
        try { data = JSON.parse(rawText); } catch(e) { throw new Error("Invalid response: " + rawText.slice(0,200)); }
        if(data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        const text = data.content?.map(b=>b.text||"").join("")||"";
        const p = JSON.parse(text.replace(/```json|```/g,"").trim());
        const isIG = platform === "instagram" || p.notes?.includes("platform:instagram");
        setForm(f=>({...f,
          title:p.title||f.title, date:p.date||f.date,
          views:p.views!=null?String(p.views):f.views,
          likes:p.likes!=null?String(p.likes):f.likes,
          comments:p.comments!=null?String(p.comments):f.comments,
          shares:p.shares!=null?String(p.shares):f.shares,
          igViews:isIG&&p.igViews!=null?String(p.igViews):isIG&&p.views!=null?String(p.views):f.igViews,
          igLikes:isIG&&p.likes!=null?String(p.likes):f.igLikes,
          igComments:isIG&&p.comments!=null?String(p.comments):f.igComments,
          crossPost:isIG?true:f.crossPost,
          type:p.type||f.type, hook:p.hook||f.hook,
          promoted:p.promoted||f.promoted, notes:p.notes||f.notes,
          _confidence:p.confidence,
          _platform:isIG?"instagram":"tiktok",
        }));
        setMode("manual");
      } catch(e) { setScanErr("Scan failed: "+e.message); }
      setScanning(false);
    }

    const saveVideo = () => {
      if(!form.title||!form.views) return;
      addVideo({ id:Date.now(),...form,
        views:parseInt(form.views)||0, likes:parseInt(form.likes)||0,
        comments:parseInt(form.comments)||0, shares:parseInt(form.shares)||0,
        igViews:form.crossPost?(parseInt(form.igViews)||null):null,
        igLikes:form.crossPost?(parseInt(form.igLikes)||null):null,
        igComments:form.crossPost?(parseInt(form.igComments)||null):null,
        igShares:form.crossPost?(parseInt(form.igShares)||null):null,
        crossPost:form.crossPost, promoted:!!form.promoted, notes:form.notes||""
      });
    };

    const Toggle = ({field, label, sub, color}) => (
      <div style={{ background:form[field]?color+"11":C.pinkBg, border:`1px solid ${form[field]?color:C.border}`, borderRadius:12, padding:"11px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>set(field,!form[field])}>
        <div><div style={{ color:form[field]?color:C.dim, fontWeight:800, fontSize:12, fontFamily:C.fontBody }}>{label}</div><div style={{ color:C.dim, fontSize:D.phone?8:9, marginTop:2 }}>{sub}</div></div>
        <div style={{ width:36, height:20, borderRadius:10, background:form[field]?color:C.muted, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
          <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:form[field]?18:2, transition:"left 0.2s" }} />
        </div>
      </div>
    );

    return (
      <Modal title="Log a Video" onClose={()=>closeModal("addVideo")} maxWidth={540}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* Mode switcher */}
          <div style={{ display:"flex", gap:5, background:C.pinkBg, padding:"5px", borderRadius:12, border:`1px solid ${C.borderStrong}` }}>
            {[["screenshot","Scan TikTok"],["instagram","Scan Instagram"],["manual","Manual Entry"]].map(([m,l])=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, background:mode===m?C.pink:"transparent", border:"none", borderRadius:8, padding:"8px", color:"#fff", fontFamily:C.fontBody, fontWeight:700, fontSize:11, cursor:"pointer", transition:"all 0.15s", textTransform:"uppercase", letterSpacing:"0.05em", opacity:mode===m?1:0.5 }}>{l}</button>
            ))}
          </div>

          {/* ── INSTAGRAM SCAN MODE ── */}
          {mode==="instagram" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ color:C.dim, fontSize:11, lineHeight:1.6 }}>Screenshot your Instagram Reel analytics page. Claude will extract plays, likes, comments and reach.</div>
              <div
                onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer?.files?.[0]; if(f) analyseScreenshot(f, "instagram"); }}
                onDragOver={e=>e.preventDefault()}
                onClick={()=>fileRef.current?.click()}
                style={{ border:`2px dashed ${scanning?C.purple:C.borderStrong}`, borderRadius:16, padding:scanning?"28px 20px":"36px 20px", textAlign:"center", cursor:"pointer", background:scanning?C.purple+"08":C.pinkBg, transition:"all 0.2s" }}
              >
                {scanning ? (
                  <div style={{ color:C.purple, fontWeight:700, fontFamily:C.fontBody, fontSize:14 }}>Reading Instagram stats...</div>
                ) : (
                  <>
                    <div style={{ color:C.purple, display:"flex", justifyContent:"center", marginBottom:10 }}><div style={{ transform:"scale(2)", display:"inline-block" }}>{Icon.instagram}</div></div>
                    <div style={{ color:C.text, fontWeight:700, fontFamily:C.fontBody, fontSize:15 }}>Drop Instagram screenshot</div>
                    <div style={{ color:C.dim, fontSize:11, marginTop:4 }}>Reel analytics or post page</div>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) analyseScreenshot(e.target.files[0], "instagram"); }} />
              </div>
              {scanErr && <div style={{ color:"#FF6B6B", fontSize:11, background:"#FF2D2D0A", borderRadius:8, padding:"8px 12px" }}>{scanErr}</div>}
              {preview && !scanning && (
                <div style={{ borderRadius:10, overflow:"hidden", maxHeight:160, display:"flex", justifyContent:"center", background:C.bg }}>
                  <img src={preview} style={{ maxHeight:160, maxWidth:"100%", objectFit:"contain" }} alt="preview" />
                </div>
              )}
            </div>
          )}

          {/* ── SCREENSHOT MODE ── */}
          {mode==="screenshot" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ color:C.dim, fontSize:11, lineHeight:1.6 }}>Screenshot your TikTok video page -- Claude reads the views, likes, comments, shares, hook type and content type automatically. Works from any screenshot showing the stats.</div>
              <div
                onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer?.files?.[0]; if(f) analyseScreenshot(f); }}
                onDragOver={e=>e.preventDefault()}
                onClick={()=>fileRef.current?.click()}
                style={{ border:`2px dashed ${scanning?C.pink:C.borderStrong}`, borderRadius:16, padding:scanning?"28px 20px":"36px 20px", textAlign:"center", cursor:"pointer", background:scanning?C.pink+"08":C.pinkBg, transition:"all 0.2s" }}
              >
                {scanning ? (
                  <>
                    <div style={{ fontSize:36, marginBottom:8 }}>🔍</div>
                    <div style={{ color:C.pink, fontWeight:800, fontFamily:C.fontBody, fontSize:14 }}>Reading your screenshot...</div>
                    <div style={{ color:C.dim, fontSize:11, marginTop:4 }}>Extracting stats, hook type, content type</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:40, marginBottom:10 }}>📱</div>
                    <div style={{ color:C.text, fontWeight:800, fontFamily:C.fontBody, fontSize:15 }}>Drop screenshot here</div>
                    <div style={{ color:C.dim, fontSize:11, marginTop:4 }}>or tap to pick from your photos</div>
                    <div style={{ marginTop:12, display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                      {["Video page","Analytics view","Any TikTok screenshot"].map(t=><span key={t} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:"3px 8px", fontSize:10, color:C.dim }}>{t}</span>)}
                    </div>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) analyseScreenshot(e.target.files[0]); }} />
              </div>
              {scanErr && <div style={{ color:"#FF6B6B", fontSize:11, background:"#FF2D2D0A", borderRadius:8, padding:"8px 12px" }}>⚠ {scanErr} -- try Manual Entry instead</div>}
              {preview && !scanning && (
                <div style={{ borderRadius:10, overflow:"hidden", maxHeight:160, display:"flex", justifyContent:"center", background:C.bg }}>
                  <img src={preview} style={{ maxHeight:160, maxWidth:"100%", objectFit:"contain" }} alt="screenshot preview" />
                </div>
              )}
              <div style={{ color:C.dim, fontSize:10, textAlign:"center" }}>After scanning, Claude fills the form -- you just review and save. Takes ~5 seconds.</div>
            </div>
          )}

          {/* ── MANUAL / REVIEW MODE ── */}
          {mode==="manual" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {form._confidence && (
                <div style={{ background:form._confidence==="high"?C.green+"0F":form._confidence==="medium"?C.yellow+"0F":"#FF6B6B0F", border:`1px solid ${form._confidence==="high"?C.green:form._confidence==="medium"?C.yellow:"#FF6B6B"}44`, borderRadius:10, padding:"9px 12px", fontSize:11, color:C.text }}>
                  {form._confidence==="high"?"✅ Stats read clearly -- review and save.":form._confidence==="medium"?"⚠️ Medium confidence -- double-check the numbers.":"⚠️ Low confidence -- screenshot unclear. Check everything carefully."}
                </div>
              )}
              <FInput label="TITLE / HOOK TEXT *" placeholder="e.g. No bins in Thailand 🇹🇭" value={form.title} onChange={e=>set("title",e.target.value)} />
              <FInput label="DATE POSTED" type="date" value={form.date} onChange={e=>set("date",e.target.value)} />
              <ChipGroup label="VIDEO TYPE" options={VIDEO_TYPES} value={form.type} onChange={v=>set("type",v)} color={C.pink} />
              <ChipGroup label="HOOK TYPE" options={HOOK_TYPES} value={form.hook} onChange={v=>set("hook",v)} color={C.cyan} />

              {/* TikTok stats */}
              <div style={{ background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:12, padding:"12px 14px" }}>
                <div style={{ color:C.pink, fontSize:10, fontWeight:800, fontFamily:C.fontBody, marginBottom:10 }}>🎵 TikTok Stats</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[["VIEWS *","views"],["LIKES","likes"],["COMMENTS","comments"],["SHARES","shares"]].map(([l,k])=><FInput key={k} label={l} type="number" placeholder="0" value={form[k]} onChange={e=>set(k,e.target.value)} color={C.pink} />)}
                </div>
              </div>

              <Toggle field="crossPost" label="📲 Posted to TikTok + Instagram Reels" sub="Log stats for both platforms" color={C.purple} />

              {form.crossPost && (
                <div style={{ background:C.purple+"0A", border:`1px solid ${C.purple}44`, borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ color:C.purple, fontSize:10, fontWeight:800, fontFamily:C.fontBody, marginBottom:4 }}>📸 Instagram Reels Stats</div>
                  <div style={{ color:C.dim, fontSize:10, marginBottom:10 }}>Views = Reel plays. Leave blank if not posted to IG yet.</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {[["REEL VIEWS","igViews"],["LIKES","igLikes"],["COMMENTS","igComments"],["SHARES","igShares"]].map(([l,k])=><FInput key={k} label={l} type="number" placeholder="0" value={form[k]} onChange={e=>set(k,e.target.value)} color={C.purple} />)}
                  </div>
                </div>
              )}

              <FInput label="NOTES" placeholder="e.g. posted 9pm, trending sound" value={form.notes} onChange={e=>set("notes",e.target.value)} />
              <Toggle field="promoted" label="🚀 Promoted / Paid ad" sub="AI separates organic vs paid performance" color={C.yellow} />

              <div style={{ display:"flex", gap:8 }}>
                <Btn outline color={C.pink} onClick={()=>{ setMode("screenshot"); setPreview(null); setScanErr(null); }}>← Scan another</Btn>
                <Btn full onClick={saveVideo} disabled={!form.title||!form.views}>Save Video</Btn>
              </div>
            </div>
          )}

        </div>
      </Modal>
    );
  };

  const AddIdeaModal = () => {
    const [form, setForm] = useState({ type:"facecam", hook:"edgy/controversial" });
    const set = (k,v) => setForm(f=>({...f,[k]:v}));

    function saveAndScore() {
      if(!form.title?.trim()) return;
      const newIdea = { id:Date.now(), title:form.title.trim(), type:form.type||"facecam", hook:form.hook||"other", notes:form.notes||"" };
      setIdeas(is=>[newIdea,...is]);
      setModals(m=>({...m,addIdea:false}));
      setDraft({});
      setTimeout(() => scoreIdea(newIdea), 800);
    }

    return (
      <Modal title="Add Idea" onClose={()=>closeModal("addIdea")}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <FInput label="IDEA / HOOK TITLE *" placeholder="e.g. Bin catcher game is actually addictive" value={form.title} onChange={e=>set("title",e.target.value)} />
          <ChipGroup label="VIDEO TYPE" options={VIDEO_TYPES} value={form.type} onChange={v=>set("type",v)} color={C.pink} />
          <ChipGroup label="HOOK TYPE" options={HOOK_TYPES} value={form.hook} onChange={v=>set("hook",v)} color={C.cyan} />
          <FInput label="NOTES (optional)" placeholder="Any context for filming" value={form.notes} onChange={e=>set("notes",e.target.value)} />
          <Btn full onClick={saveAndScore} disabled={!form.title}>SAVE & SCORE</Btn>
        </div>
      </Modal>
    );
  };

  const AddCalModal = () => {
    const [form, setForm] = useState({ date:today(), platform:"TikTok", status:"idea", ...draft });
    const set = (k,v) => setForm(f=>({...f,[k]:v}));
    return (
      <Modal title="Schedule Content" onClose={()=>closeModal("addCal")}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <FInput label="TITLE *" placeholder="e.g. Bin catcher challenge" value={form.title} onChange={e=>set("title",e.target.value)} color={C.cyan} />
          <FInput label="DATE *" type="date" value={form.date} onChange={e=>set("date",e.target.value)} color={C.cyan} />
          <ChipGroup label="PLATFORM" options={["TikTok","Instagram","Both"]} value={form.platform} onChange={v=>set("platform",v)} color={C.cyan} />
          <ChipGroup label="STATUS" options={STATUSES} value={form.status} onChange={v=>set("status",v)} color={STATUS_C[form.status]||C.dim} />
          <ChipGroup label="VIDEO TYPE" options={VIDEO_TYPES} value={form.type} onChange={v=>set("type",v)} color={C.pink} />
          <ChipGroup label="HOOK TYPE" options={HOOK_TYPES.slice(0,5)} value={form.hook} onChange={v=>set("hook",v)} color={C.cyan} />
          <FInput label="NOTES FOR HARLEY" placeholder="Any filming notes" value={form.notes} onChange={e=>set("notes",e.target.value)} color={C.cyan} />
          <Btn full color={C.cyan} onClick={()=>{ if(!form.title||!form.date) return; addCalItem({ id:Date.now(),...form }); }} disabled={!form.title||!form.date}>Schedule</Btn>
        </div>
      </Modal>
    );
  };

  const EditStatsModal = () => {
    const [form, setForm] = useState({...manualData});
    return (
      <Modal title="Update TikTok + Bins" onClose={()=>closeModal("editStats")}>
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          {[["TikTok Followers","tt_followers","number"],["TikTok Total Views","tt_views","number"],["TikTok Total Likes","tt_likes","number"],["Date","tt_date","date"],["Bins on Map","bins","number"],["Bins Date","bins_date","date"]].map(([label,key,type])=>(
            <div key={key}>
              <div style={{ color:C.textMed, fontSize:9, letterSpacing:"0.1em", marginBottom:4, fontFamily:C.fontBody, fontWeight:600, textTransform:"uppercase" }}>{label}</div>
              <input type={type} value={form[key]||""} placeholder={label} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{ width:"100%", background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:12, fontFamily:C.fontMono, outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          <Btn full onClick={()=>saveManual(form)}>Save</Btn>
        </div>
      </Modal>
    );
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:C.fontMono, paddingBottom:80 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@800;900;1000&family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Content area */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"20px 18px" }}>
        {aiErr && (
          <div style={{ background:"#FF2D2D11", border:"1px solid #FF2D2D44", borderRadius:10, padding:"11px 15px", marginBottom:14, color:"#FF8888", fontSize:11, display:"flex", justifyContent:"space-between" }}>
            ⚠ {aiErr}
            <button onClick={()=>setAiErr(null)} style={{ background:"none",border:"none",color:C.dim,cursor:"pointer" }}>✕</button>
          </div>
        )}
        {nav==="home"      && <HomeView />}
        {nav==="content"   && <ContentView />}
        {nav==="analytics" && <AnalyticsView />}
        {nav==="tasks"     && <TasksView />}
        {nav==="growth"    && <GrowthView />}
        {nav==="settings"  && <SettingsView />}
      </div>

      {/* Bottom nav bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#0A0012EE", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:`1px solid ${C.borderStrong}`, display:"flex", zIndex:50, boxShadow:"0 -8px 32px rgba(0,0,0,0.5)" }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>{ setNav(n.id); setSub(null); }} style={navBtnStyle(n.id)}>
            <div style={{ width:34, height:34, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background:nav===n.id?C.pink+"25":"transparent", border:nav===n.id?`1px solid ${C.pink}50`:"1px solid transparent", transition:"all 0.2s" }}>{n.icon}</div>
            <span>{n.label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      {modals.addVideo  && <AddVideoModal />}
      {modals.updateVideo && <UpdateVideoModal />}
      {modals.addIdea   && <AddIdeaModal />}
      {modals.addCal    && <AddCalModal />}
      {modals.editStats && <EditStatsModal />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [config, setConfig] = useState(()=>loadJSON(KEYS_KEY,{}));
  function handleSave(keys) { const u={...config,keys,launched:true}; setConfig(u); saveJSON(KEYS_KEY,u); }
  // Always go straight to dashboard -- setup screen available in Settings
  return <Dashboard keys={config.keys||{}} onEditKeys={keys=>{ const u={...config,keys}; setConfig(u); saveJSON(KEYS_KEY,u); }} />;
}
