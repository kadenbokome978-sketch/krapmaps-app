import { useState, useEffect, useCallback, useRef } from "react";

const C = {
  // KrapMaps brand
  pink:"#FF2D78", pinkDark:"#CC1A5E", pinkLight:"#FF6BA8", pinkBg:"#FFF0F5", pinkSoft:"#FFE0ED",
  // Accents
  cyan:"#0EA5E9", yellow:"#F59E0B", green:"#10B981", orange:"#F97316", purple:"#8B5CF6",
  // Layout — light mode
  bg:"#FDF4F7", card:"#FFFFFF", cardAlt:"#FFF8FB",
  border:"#F5DCE8", borderStrong:"#FFADD0",
  muted:"#EDD5E2", mutedText:"#B07090",
  text:"#1A0812", textMed:"#4A2035", dim:"#9B6B82",
};

const KEYS_KEY    = "krapmaps_v16_config";
const MANUAL_KEY  = "krapmaps_v16_manual";
const VIDEOS_KEY  = "krapmaps_v16_videos";
const IDEAS_KEY   = "krapmaps_v16_ideas";
const CAL_KEY     = "krapmaps_v16_calendar";
const TRENDS_KEY  = "krapmaps_v16_trends";

const SYNC_KEY   = "krapmaps_v16_syncurl";
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

const HOOK_TYPES  = ["edgy/controversial","problem→solution","gamification","achievement","challenge","reaction","demo","other"];
const VIDEO_TYPES = ["facecam","street","screencap","voiceover","mixed"];
const STATUSES    = ["idea","scripted","filming","editing","scheduled","posted"];
const STATUS_C    = { idea:C.mutedText, scripted:C.purple, filming:C.yellow, editing:C.orange, scheduled:C.cyan, posted:C.green };

const fmt   = n => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n||0);
const igViews = p => p.video_views||p.plays||p.reach||null;
const ratio = v => v.views>0?((v.likes/v.views)*100):0;
const getDaysUntil = d => Math.ceil((new Date(d)-new Date())/(1000*60*60*24));
const today = () => new Date().toISOString().slice(0,10);

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function Tag({ children, color=C.pink, size=10 }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:6, padding:"2px 8px", fontSize:size, fontWeight:700, fontFamily:"'Syne',sans-serif", whiteSpace:"nowrap" }}>{children}</span>;
}

function StatCard({ label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", position:"relative", overflow:"hidden", cursor:onClick?"pointer":"default", boxShadow:"0 1px 4px rgba(255,45,120,0.04)" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color }} />
      <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:4 }}>{label}</div>
      <div style={{ color, fontSize:22, fontWeight:800, fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ color:C.dim, fontSize:10, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function Btn({ children, onClick, color=C.pink, disabled=false, outline=false, small=false, full=false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline?"transparent":disabled?C.muted:color,
      border:`1px solid ${disabled?C.muted:color}`,
      color: outline?color:disabled?C.dim:[C.yellow,C.green,C.cyan].includes(color)?C.bg:"#fff",
      padding:small?"6px 14px":"11px 22px", borderRadius:small?8:12,
      fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:small?11:13,
      cursor:disabled?"not-allowed":"pointer", whiteSpace:"nowrap", width:full?"100%":"auto",
    }}>{children}</button>
  );
}

function FInput({ label, value, onChange, type="text", placeholder, textarea, rows=3, color=C.pink }) {
  const [f,setF] = useState(false);
  const s = { width:"100%", background:C.bg, border:`1px solid ${f?color:C.borderStrong}`, borderRadius:10, color:C.text, padding:"10px 14px", fontSize:13, fontFamily:"'DM Mono',monospace", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" };
  return (
    <div>
      {label && <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", marginBottom:5, fontFamily:"'Syne',sans-serif" }}>{label}</div>}
      {textarea
        ? <textarea rows={rows} placeholder={placeholder} value={value||""} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...s,resize:"vertical"}} />
        : <input type={type} placeholder={placeholder} value={value||""} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={s} />}
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth=500 }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:C.card, border:`1px solid ${C.borderStrong}`, borderRadius:22, padding:28, width:"100%", maxWidth, maxHeight:"92vh", overflowY:"auto", boxShadow:`0 24px 64px rgba(255,45,120,0.18)` }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:C.text, fontSize:17, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.dim, fontSize:20, cursor:"pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ScoreRing({ score, color, label, size=52 }) {
  const r=(size-8)/2, circ=2*Math.PI*r, dash=(score/100)*circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.muted} strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
        <text x={size/2} y={size/2+4} textAnchor="middle" fill={color} fontSize="11" fontWeight="800" fontFamily="'Syne',sans-serif">{score}</text>
      </svg>
      <div style={{ color:C.dim, fontSize:9, fontFamily:"'Syne',sans-serif" }}>{label}</div>
    </div>
  );
}

function ChipGroup({ label, options, value, onChange, color=C.pink }) {
  return (
    <div>
      {label && <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", marginBottom:6, fontFamily:"'Syne',sans-serif" }}>{label}</div>}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {options.map(o => (
          <button key={o} onClick={()=>onChange(o)} style={{ padding:"5px 10px", borderRadius:7, cursor:"pointer", fontSize:10, background:value===o?color+"33":C.muted+"22", border:`1px solid ${value===o?color:C.border}`, color:value===o?color:C.dim, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

// ─── AI ───────────────────────────────────────────────────────────────────────
const SYSTEM = `You are the growth strategist for KrapMaps — a crowdsourced gamified bin-finding app on iOS & Android. TikTok: @findkrap. Also active on Instagram. Goal: push the app as big as possible across both platforms. Best TikTok formula: Problem→struggle→KrapMaps saves the day→reaction. Edgy/controversial hooks and facecam/street content outperform demos. Hook must land in 1-2 seconds. Instagram strategy: more polished, community-focused, behind-the-scenes, aesthetic bin content, before/after maps, user-generated content reposts. Mini-games: bin catcher slider + guess the country quiz. Songkran April 13-15 Thailand is a major activation. Harley in Thailand films, Bk in UK edits/strategy. Respond ONLY with valid JSON — no markdown, no preamble.`;

async function callAI(prompt, maxTokens=1000) {
  const headers = {"Content-Type":"application/json"};
  const apiUrl = window.location.hostname === "localhost" ? "https://api.anthropic.com/v1/messages" : "/api/proxy";
  if(apiUrl.includes("anthropic")) { headers["x-api-key"] = ANTHROPIC_KEY; headers["anthropic-version"] = "2023-06-01"; headers["anthropic-dangerous-direct-browser-access"] = "true"; }
  const res = await fetch(apiUrl, {
    method:"POST", headers,
    body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, system:SYSTEM, messages:[{role:"user",content:prompt}] }),
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
    { id:"Instagram", color:C.pink, icon:"📸", desc:"Meta Developer Console → Instagram Basic Display → Access Token", fields:[{key:"ig",label:"Instagram Access Token"}], url:"https://developers.facebook.com/docs/instagram-basic-display-api/getting-started" },
    { id:"App Store", color:C.cyan, icon:"🍎", desc:"App Store Connect → Users & Access → Keys → Generate API Key", fields:[{key:"apple_key_id",label:"Key ID"},{key:"apple_issuer",label:"Issuer ID"},{key:"apple_p8",label:"Private Key (.p8)",textarea:true}], url:"https://developer.apple.com/documentation/appstoreconnectapi" },
    { id:"Google Play", color:C.green, icon:"▶️", desc:"Play Console → Setup → API Access → Service Account → JSON key", fields:[{key:"play",label:"Service Account JSON",textarea:true}], url:"https://developers.google.com/android-publisher/getting_started" },
  ];
  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(180deg,${C.pinkBg} 0%,${C.bg} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:24, minHeight:"100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@800;900;1000&family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ width:"100%", maxWidth:580 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:56, marginBottom:8, filter:"drop-shadow(0 4px 12px rgba(255,45,120,0.3))" }}>🗑</div>
          <div style={{ color:C.pink, fontSize:28, fontWeight:900, fontFamily:"'Nunito',sans-serif", letterSpacing:"-0.02em" }}>🗑 KrapMaps</div><div style={{ color:C.textMed, fontSize:15, fontWeight:700, fontFamily:"'Syne',sans-serif", marginTop:4 }}>Content OS</div>
          <div style={{ color:C.mutedText, fontSize:11, letterSpacing:"0.12em", fontFamily:"'Syne',sans-serif", marginTop:6 }}>CONNECT YOUR PLATFORMS</div>
          <div style={{ color:C.dim, fontSize:12, marginTop:12, lineHeight:1.7 }}>Leave blank and skip — you can add keys any time from Settings.</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:22 }}>
          {platforms.map(({ id, color, icon, desc, fields:fs, url }) => (
            <div key={id} style={{ background:C.card, border:`1px solid ${C.borderStrong}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${color}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:17 }}>{icon}</span><div style={{ color:C.text, fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>{id}</div></div>
                <a href={url} target="_blank" rel="noreferrer" style={{ color, fontSize:10, fontFamily:"'Syne',sans-serif", textDecoration:"none" }}>How to get ↗</a>
              </div>
              <div style={{ color:C.dim, fontSize:11, marginBottom:10, lineHeight:1.5 }}>{desc}</div>
              {fs.map(f => (
                <div key={f.key} style={{ marginBottom:7 }}>
                  <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.08em", marginBottom:3, fontFamily:"'Syne',sans-serif" }}>{f.label}</div>
                  {f.textarea
                    ? <textarea rows={2} placeholder={`Paste ${f.label}...`} value={keys[f.key]||""} onChange={e=>setKeys(k=>({...k,[f.key]:e.target.value}))} style={{ width:"100%", background:C.bg, border:`1px solid ${keys[f.key]?color+"66":C.border}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:11, fontFamily:"'DM Mono',monospace", outline:"none", resize:"vertical", boxSizing:"border-box" }} />
                    : <div style={{ position:"relative" }}>
                        <input type={show[f.key]?"text":"password"} placeholder={`Paste ${f.label}...`} value={keys[f.key]||""} onChange={e=>setKeys(k=>({...k,[f.key]:e.target.value}))} style={{ width:"100%", background:C.bg, border:`1px solid ${keys[f.key]?color+"66":C.border}`, borderRadius:8, color:C.text, padding:"8px 34px 8px 12px", fontSize:12, fontFamily:"'DM Mono',monospace", outline:"none", boxSizing:"border-box" }} />
                        <button onClick={()=>setShow(s=>({...s,[f.key]:!s[f.key]}))} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:12 }}>{show[f.key]?"🙈":"👁"}</button>
                      </div>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={()=>onSave(keys)} style={{ width:"100%", background:C.pink, border:"none", color:"#fff", padding:"14px", borderRadius:12, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, cursor:"pointer", boxShadow:`0 6px 24px ${C.pink}55`, letterSpacing:"-0.01em" }}>Launch Dashboard →</button>
        <div style={{ textAlign:"center", color:C.dim, fontSize:10, marginTop:8 }}>Keys stored locally in your browser only.</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function Dashboard({ keys, onEditKeys }) {
  const [nav, setNav]             = useState("home");
  const [sub, setSub]             = useState(null);

  // Data
  const [manualData, setManualData] = useState(()=>loadJSON(MANUAL_KEY,{}));
  const [videos, setVideos]         = useState(()=>loadJSON(VIDEOS_KEY,[]));
  const [ideas, setIdeas]           = useState(()=>loadJSON(IDEAS_KEY,[]));
  const [calItems, setCalItems]     = useState(()=>loadJSON(CAL_KEY,[]));
  const [trends, setTrends]         = useState(()=>loadJSON(TRENDS_KEY,null));

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
  const [analysis, setAnalysis]     = useState(null);
  const [nextVids, setNextVids]     = useState(null);
  const [weekly, setWeekly]         = useState(null);
  const [captionResult, setCaptionResult] = useState(null);
  const [captionIdea, setCaptionIdea]     = useState(null);

  // UI
  const [draft, setDraft]           = useState({});
  const [aiLoad, setAiLoad]         = useState({});
  const [aiErr, setAiErr]           = useState(null);
  const [modals, setModals]         = useState({});
  const [copied, setCopied]         = useState({});

  // Save to both localStorage AND Supabase on every change
  useEffect(()=>{ saveJSON(VIDEOS_KEY,videos); sbSet("km_videos",videos); },[videos]);
  useEffect(()=>{ saveJSON(IDEAS_KEY,ideas); sbSet("km_ideas",ideas); },[ideas]);
  useEffect(()=>{ saveJSON(CAL_KEY,calItems); sbSet("km_calendar",calItems); },[calItems]);
  useEffect(()=>{ saveJSON(MANUAL_KEY,manualData); sbSet("km_manual",manualData); },[manualData]);
  useEffect(()=>{ if(trends){ saveJSON(TRENDS_KEY,trends); sbSet("km_trends",trends); } },[trends]);

  // Load from Supabase on first open (overrides empty localStorage)
  useEffect(()=>{
    async function loadFromSupabase() {
      const [v,i,c,m,t] = await Promise.all([
        sbGet("km_videos"), sbGet("km_ideas"), sbGet("km_calendar"),
        sbGet("km_manual"), sbGet("km_trends")
      ]);
      if(v) { try { const parsed=JSON.parse(v); if(parsed.length>0) setVideos(parsed); } catch{} }
      if(i) { try { const parsed=JSON.parse(i); if(parsed.length>0) setIdeas(parsed); } catch{} }
      if(c) { try { const parsed=JSON.parse(c); if(parsed.length>0) setCalItems(parsed); } catch{} }
      if(m) { try { const parsed=JSON.parse(m); if(Object.keys(parsed).length>0) setManualData(parsed); } catch{} }
      if(t) { try { setTrends(JSON.parse(t)); } catch{} }
    }
    loadFromSupabase();
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
              tt_likes: tt.total_likes>0 ? tt.total_likes : d.tt_likes,
              tt_date: new Date().toISOString().slice(0,10),
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
  const daysToSongkran = getDaysUntil("2025-04-13");

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
  const addIdea     = idea => { setIdeas(is=>[idea,...is]); closeModal("addIdea"); };
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
        analysis:`Analyse KrapMaps content across TikTok AND Instagram. IMPORTANT: separate organic vs promoted/paid videos in your analysis — organic performance is what matters for strategy. Return: {"tiktok":{"whatIsWorking":[{"insight":"","evidence":"","impact":"high|medium|low"}],"whatIsNotWorking":[{"insight":"","evidence":"","fix":""}],"hookAnalysis":{"bestHook":"","worstHook":"","reasoning":""},"typeAnalysis":{"bestType":"","worstType":"","reasoning":""},"keyPattern":"","urgentFix":""},"instagram":{"whatIsWorking":[{"insight":"","evidence":"","impact":"high|medium|low"}],"whatIsNotWorking":[{"insight":"","evidence":"","fix":""}],"keyPattern":"","urgentFix":""},"crossPlatform":"1 sentence insight spanning both platforms"}. TikTok all:${JSON.stringify(ttSummary)} TikTok organic only:${JSON.stringify(organicOnly)} TikTok promoted:${JSON.stringify(promotedOnly)} Instagram API:${JSON.stringify(igSummary)} Instagram cross-posts:${JSON.stringify(igLoggedSummary)}`,
        nextVids:`Generate next content for KrapMaps across both platforms. Return: {"tiktok":[{"title":"","type":"","hook":"","whyItWillWork":"","openingLine":"","structure":"","priority":""}],"instagram":[{"caption":"","contentType":"Reel|Carousel|Story|Post","concept":"","whyItWillWork":"","priority":""}],"songkranAngle":"one cross-platform Songkran idea"}. TikTok data:${JSON.stringify(ttSummary)} IG data:${JSON.stringify(igSummary)} IG cross-posts:${JSON.stringify(igLoggedSummary)}`,
        weekly:`Weekly summary covering BOTH TikTok and Instagram for KrapMaps. Return: {"weekSummary":"","tiktokHighlight":{"title":"","whyItWorked":""},"instagramHighlight":{"caption":"","whyItWorked":""},"biggestLearning":"","harleyBrief":"brief for Harley covering both TikTok filming and Instagram content","thisWeekTarget":"","rawSummaryText":"casual WhatsApp message from Bk to Harley covering both platforms"}. TikTok:${JSON.stringify(ttSummary)} Instagram API:${JSON.stringify(igSummary)} IG cross-posts:${JSON.stringify(igLoggedSummary)}`,
        trends:`Analyse current trends (March 2026) for KrapMaps across TikTok AND Instagram. Return: {"trends":[{"trend":"","tiktokAngle":"","instagramAngle":"","urgency":"🔥 Now|📈 This week|🗓 Soon","format":"facecam|street|screencap|mixed|reel|carousel"}],"topOpportunity":"","songkranTrendAngle":""}`,
      };
      const r = await callAI(prompts[mode], 1000);
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
      const r = await callAI(`Score this KrapMaps TikTok idea. Return: {"viralityScore":0-100,"hookScore":0-100,"viralityReason":"1 sentence","hookFeedback":"1 sentence","improvedHook":"better hook in one line","bestFormat":"facecam|street|screencap","bestHookType":"string"}. Idea:"${idea.title}" Hook:${idea.hook} Notes:${idea.notes||"none"}`);
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
    { id:"home",      icon:"🏠", label:"Home" },
    { id:"content",   icon:"✏️", label:"Content" },
    { id:"analytics", icon:"📊", label:"Analytics" },
    { id:"growth",    icon:"📈", label:"Growth" },
    { id:"settings",  icon:"⚙️", label:"Settings" },
  ];

  const navBtnStyle = (id) => ({
    display:"flex", flexDirection:"column", alignItems:"center", gap:3,
    padding:"10px 0", flex:1, background:"none", border:"none", cursor:"pointer",
    borderTop: nav===id ? `3px solid ${C.pink}` : "3px solid transparent",
    color: nav===id ? C.pink : C.mutedText,
    fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:9, letterSpacing:"0.05em",
    transition:"color 0.15s",
  });

  function goTo(navId, subId=null) { setNav(navId); setSub(subId); }

  // ─── SECTION CONTENT ──────────────────────────────────────────────────────

  // HOME
  const HomeView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* Top banner */}
      <div style={{ background:`linear-gradient(135deg,${C.pink},${C.pinkDark})`, borderRadius:20, padding:"22px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:`0 8px 32px ${C.pink}44` }}>
        <div>
          <div style={{ color:"#fff", fontSize:22, fontWeight:900, fontFamily:"'Nunito',sans-serif", letterSpacing:"-0.01em" }}>🗑 KrapMaps HQ</div>
          <div style={{ color:"rgba(255,255,255,0.85)", fontSize:12, marginTop:4 }}>Bk + Harley · {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"short"})}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
          <div style={{ background:"rgba(255,255,255,0.25)", color:"#fff", fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:13, padding:"8px 16px", borderRadius:100, border:"1px solid rgba(255,255,255,0.4)" }}>🎉 T–{daysToSongkran}d</div>
          {syncUrl && <div style={{ color:"rgba(255,255,255,0.8)", fontSize:9, fontFamily:"'Syne',sans-serif" }}>{syncing?"⏳ syncing...":lastSync?"✓ synced "+lastSync.toLocaleTimeString():"⚪ auto sync on"}</div>}
        </div>
      </div>

      {/* Key stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        <StatCard label="TT FOLLOWERS" value={fmt(m.tt_followers||0)} color={C.pink} sub={m.tt_date||"—"} onClick={()=>goTo("growth")} />
        <StatCard label="TT VIEWS"     value={fmt(m.tt_views||0)}     color={C.cyan}  onClick={()=>goTo("growth")} />
        <StatCard label="BINS MAPPED"  value={fmt(m.bins||0)}          color={C.yellow} sub={m.bins_date||"—"} onClick={()=>goTo("growth")} />
        <StatCard label="VIDEOS LOGGED" value={videos.length}          color={C.green} onClick={()=>goTo("analytics")} />
      </div>
      {/* Instagram live stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        <StatCard label="IG FOLLOWERS" value={igData?.profile?.followers_count!=null?fmt(igData.profile.followers_count):"—"} color={C.purple} sub={igData?`@${igData.profile.username}`:"no key — add in Settings"} onClick={()=>goTo("growth")} />
        <StatCard label="IG REEL VIEWS" value={igData?.media?.length?fmt(Math.round(igData.media.filter(p=>p.media_type==="VIDEO"||p.media_type==="REEL").reduce((s,p)=>s+(igViews(p)||0),0)/Math.max(igData.media.filter(p=>p.media_type==="VIDEO"||p.media_type==="REEL").length,1))):"—"} color={C.cyan} sub="avg per Reel" onClick={()=>goTo("growth")} />
        <StatCard label="IG AVG LIKES" value={igData?.media?.length?fmt(Math.round(igData.media.reduce((s,p)=>s+(p.like_count||0),0)/igData.media.length)):"—"} color={C.pink} sub="last 20 posts" onClick={()=>goTo("growth")} />
        <StatCard label="IG POSTS" value={igData?fmt(igData.profile.media_count):"—"} color={C.green} sub="total posts" onClick={()=>goTo("growth")} />
      </div>

      {/* Today's actions */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:14 }}>QUICK ACTIONS</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { icon:"💡", label:"Add a video idea",    sub:"Save it before you forget",   action:()=>{ setNav("content"); setSub("ideas"); setTimeout(()=>openModal("addIdea"),50); } },
            { icon:"📅", label:"Schedule a post",     sub:"Add to the content calendar", action:()=>{ setNav("content"); setSub("calendar"); setTimeout(()=>openModal("addCal"),50); } },
            { icon:"🎬", label:"Log a posted video",  sub:"Track its stats",             action:()=>openModal("addVideo") },
            { icon:"✏️", label:"Update TikTok stats", sub:"Followers, views, likes",     action:()=>openModal("editStats") },
          ].map(({ icon, label, sub, action }) => (
            <button key={label} onClick={action} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.pink}`, borderRadius:12, padding:"14px 16px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 4px rgba(255,45,120,0.06)" }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <div>
                <div style={{ color:C.text, fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{label}</div>
                <div style={{ color:C.dim, fontSize:10, marginTop:1 }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming + top idea side by side */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif" }}>📅 UPCOMING</div>
            <button onClick={()=>goTo("content","calendar")} style={{ background:"none", border:"none", color:C.cyan, fontSize:10, fontFamily:"'Syne',sans-serif", cursor:"pointer", fontWeight:700 }}>View all →</button>
          </div>
          {upcomingCal.length===0
            ? <div style={{ color:C.dim, fontSize:12 }}>Nothing scheduled — <span style={{ color:C.cyan, cursor:"pointer" }} onClick={()=>{ goTo("content","calendar"); openModal("addCal"); }}>add one</span></div>
            : upcomingCal.map(c=>(
              <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div>
                  <div style={{ color:C.text, fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:600 }}>{c.title}</div>
                  <div style={{ color:C.dim, fontSize:10 }}>{c.date?.slice(5)} · {c.platform}</div>
                </div>
                <Tag color={STATUS_C[c.status]||C.dim} size={8}>{c.status}</Tag>
              </div>
            ))
          }
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif" }}>💡 TOP IDEAS</div>
            <button onClick={()=>goTo("content","ideas")} style={{ background:"none", border:"none", color:C.purple, fontSize:10, fontFamily:"'Syne',sans-serif", cursor:"pointer", fontWeight:700 }}>View all →</button>
          </div>
          {topIdeas.length===0
            ? <div style={{ color:C.dim, fontSize:12 }}>No ideas yet — <span style={{ color:C.purple, cursor:"pointer" }} onClick={()=>{ goTo("content","ideas"); openModal("addIdea"); }}>add one</span></div>
            : topIdeas.slice(0,3).map(i=>(
              <div key={i.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ color:C.text, fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:600, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight:8 }}>{i.title}</div>
                {i.aiScore && <div style={{ color:C.purple, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, flexShrink:0 }}>{i.aiScore.viralityScore}</div>}
              </div>
            ))
          }
        </div>
      </div>

      {/* AI actions */}
      {videos.length>=2 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:12 }}>AI ACTIONS</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <Btn small outline color={C.cyan}   onClick={()=>runAI("analysis")} disabled={aiLoad.analysis}>{aiLoad.analysis?"⏳ Analysing...":"🔍 What's Working"}</Btn>
            <Btn small outline color={C.green}  onClick={()=>runAI("nextVids")} disabled={aiLoad.nextVids}>{aiLoad.nextVids?"⏳ Generating...":"🚀 Next Video Ideas"}</Btn>
            <Btn small outline color={C.yellow} onClick={()=>runAI("weekly")}   disabled={aiLoad.weekly}>{aiLoad.weekly?"⏳ Writing...":"📋 Harley Brief"}</Btn>
            <Btn small outline color={C.orange} onClick={()=>runAI("trends")}   disabled={aiLoad.trends}>{aiLoad.trends?"⏳ Analysing...":"📈 Trend Analysis"}</Btn>
          </div>
        </div>
      )}
    </div>
  );

  // CONTENT sub-tabs
  const contentSubs = [
    { id:"calendar", label:"📅 Calendar" },
    { id:"ideas",    label:"💡 Ideas" },
    { id:"captions", label:"✍️ Captions" },
  ];

  const ContentView = () => {
    const activeSub = sub || "calendar";
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Sub-nav */}
        <div style={{ display:"flex", gap:6, background:C.pinkBg, padding:"6px", borderRadius:12, border:`1px solid ${C.borderStrong}` }}>
          {contentSubs.map(s=>(
            <button key={s.id} onClick={()=>setSub(s.id)} style={{ flex:1, background:activeSub===s.id?C.pink:"transparent", border:"none", borderRadius:8, padding:"8px", color:activeSub===s.id?"#fff":C.mutedText, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, cursor:"pointer" }}>{s.label}</button>
          ))}
        </div>

        {/* CALENDAR */}
        {activeSub==="calendar" && (()=>{
          const [calFilter, setCalFilter] = useState("all");
          const filteredCal = calFilter==="all" ? calItems : calItems.filter(c=>c.platform===calFilter||(calFilter==="Both"&&c.platform==="Both"));
          return (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Content Calendar</div>
              <Btn small onClick={()=>openModal("addCal")}>+ Schedule</Btn>
            </div>
            {/* Platform filter */}
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {["all","TikTok","Instagram","Both"].map(p=>(
                <button key={p} onClick={()=>setCalFilter(p)} style={{ padding:"5px 12px", borderRadius:8, cursor:"pointer", fontSize:11, background:calFilter===p?C.pink:C.pinkBg, border:`1px solid ${calFilter===p?C.pink:C.border}`, color:calFilter===p?"#fff":C.dim, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>
                  {p==="all"?"All":p==="TikTok"?"🎵 TikTok":p==="Instagram"?"📸 Instagram":"🔀 Both"}
                </button>
              ))}
              <div style={{ marginLeft:"auto", display:"flex", gap:5, flexWrap:"wrap" }}>
                {STATUSES.map(s=><Tag key={s} color={STATUS_C[s]} size={8}>{s}</Tag>)}
              </div>
            </div>
            {filteredCal.length===0
              ? <Empty icon="📅" title="Calendar empty" sub="Schedule your upcoming content." action={()=>openModal("addCal")} actionLabel="Schedule First Post" />
              : filteredCal.map(c=>(
                <div key={c.id} style={{ background:C.card, border:`1px solid ${c.date<today()?C.border:STATUS_C[c.status]+"44"}`, borderRadius:14, padding:"14px 16px", display:"grid", gridTemplateColumns:"80px 1fr auto auto", gap:12, alignItems:"center" }}>
                  <div>
                    <div style={{ color:STATUS_C[c.status]||C.dim, fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>{c.date?.slice(5)}</div>
                    <div style={{ color:C.dim, fontSize:10 }}>{c.platform}</div>
                  </div>
                  <div>
                    <div style={{ color:C.text, fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:600 }}>{c.title}</div>
                    {c.notes && <div style={{ color:C.dim, fontSize:11, marginTop:2 }}>{c.notes}</div>}
                    <div style={{ display:"flex", gap:4, marginTop:4 }}>
                      {c.type && <Tag color={C.pink} size={8}>{c.type}</Tag>}
                      {c.hook && <Tag color={C.cyan} size={8}>{c.hook}</Tag>}
                    </div>
                  </div>
                  <select value={c.status} onChange={e=>updateCalStatus(c.id,e.target.value)} style={{ background:C.bg, border:`1px solid ${STATUS_C[c.status]||C.border}`, borderRadius:8, color:STATUS_C[c.status]||C.text, padding:"5px 8px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:10, cursor:"pointer", outline:"none" }}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>deleteCalItem(c.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14 }}>✕</button>
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
              <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Idea Bank ({ideas.length})</div>
              <Btn small onClick={()=>openModal("addIdea")}>+ Add Idea</Btn>
            </div>
            {ideas.length===0
              ? <Empty icon="💡" title="Idea bank empty" sub="Save ideas before filming. AI scores virality + rates the hook." action={()=>openModal("addIdea")} actionLabel="Add First Idea" />
              : topIdeas.map(idea=>(
                <div key={idea.id} style={{ background:C.card, border:`1px solid ${idea.aiScore?.viralityScore>=70?C.pink+"44":C.border}`, borderRadius:16, padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ color:C.text, fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:5 }}>{idea.title}</div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        <Tag color={C.pink} size={9}>{idea.type}</Tag>
                        <Tag color={C.cyan} size={9}>{idea.hook}</Tag>
                      </div>
                      {idea.notes && <div style={{ color:C.dim, fontSize:11, marginTop:5 }}>{idea.notes}</div>}
                    </div>
                    {idea.aiScore && (
                      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                        <ScoreRing score={idea.aiScore.viralityScore} color={idea.aiScore.viralityScore>=70?C.green:idea.aiScore.viralityScore>=50?C.yellow:C.dim} label="Viral" />
                        <ScoreRing score={idea.aiScore.hookScore} color={idea.aiScore.hookScore>=70?C.pink:idea.aiScore.hookScore>=50?C.orange:C.dim} label="Hook" />
                      </div>
                    )}
                  </div>
                  {idea.aiScore && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                      <div style={{ background:C.pinkBg, borderRadius:8, padding:"10px 12px" }}>
                        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.08em", fontFamily:"'Syne',sans-serif", marginBottom:3 }}>VIRALITY</div>
                        <div style={{ color:C.text, fontSize:11, lineHeight:1.5 }}>{idea.aiScore.viralityReason}</div>
                      </div>
                      <div style={{ background:C.pinkBg, borderRadius:8, padding:"10px 12px" }}>
                        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.08em", fontFamily:"'Syne',sans-serif", marginBottom:3 }}>HOOK</div>
                        <div style={{ color:C.text, fontSize:11, lineHeight:1.5 }}>{idea.aiScore.hookFeedback}</div>
                      </div>
                      {idea.aiScore.improvedHook && (
                        <div style={{ background:C.pink+"0F", border:`1px solid ${C.pink}33`, borderRadius:8, padding:"10px 12px", gridColumn:"1/-1" }}>
                          <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.08em", fontFamily:"'Syne',sans-serif", marginBottom:3 }}>✨ IMPROVED HOOK</div>
                          <div style={{ color:C.text, fontSize:12, fontStyle:"italic" }}>"{idea.aiScore.improvedHook}"</div>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                    <Btn small outline color={C.purple} onClick={()=>scoreIdea(idea)} disabled={aiLoad["s"+idea.id]}>{aiLoad["s"+idea.id]?"⏳":idea.aiScore?"↻ Re-score":"🎯 Score It"}</Btn>
                    <Btn small outline color={C.yellow} onClick={()=>genCaption(idea)}>✍️ Caption</Btn>
                    <Btn small outline color={C.cyan} onClick={()=>{ setSub("calendar"); openModal("addCal",{title:idea.title,type:idea.type,hook:idea.hook}); }}>📅 Schedule</Btn>
                    <button onClick={()=>deleteIdea(idea.id)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.dim, padding:"5px 12px", borderRadius:7, cursor:"pointer", fontSize:11, marginLeft:"auto" }}>✕</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* CAPTIONS */}
        {activeSub==="captions" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Caption Generator</div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px" }}>
              <div style={{ color:C.dim, fontSize:12, lineHeight:1.7, marginBottom:14 }}>Type a quick idea or pick from your idea bank below.</div>
              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div style={{ flex:1 }}><FInput placeholder="e.g. Bin catcher game is actually addictive" value={draft.quickCaption} onChange={e=>setDraft(d=>({...d,quickCaption:e.target.value}))} color={C.yellow} /></div>
                <Btn color={C.yellow} onClick={()=>genCaption({title:draft.quickCaption||"KrapMaps video",hook:"gamification",notes:""})} disabled={aiLoad.caption}>{aiLoad.caption?"⏳":"Generate"}</Btn>
              </div>
              {ideas.length>0 && (
                <div>
                  <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", marginBottom:7, fontFamily:"'Syne',sans-serif" }}>FROM IDEA BANK</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {ideas.slice(0,8).map(i=>(
                      <button key={i.id} onClick={()=>genCaption(i)} style={{ background:C.muted+"22", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"6px 12px", fontSize:11, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>{i.title.slice(0,30)}{i.title.length>30?"...":""}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {aiLoad.caption && <div style={{ background:C.card, border:`1px solid ${C.yellow}33`, borderRadius:12, padding:"20px", textAlign:"center", color:C.dim, fontSize:13 }}>⏳ Writing caption...</div>}
            {captionResult && captionIdea && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif" }}>CAPTIONS FOR: {captionIdea.title}</div>
                {/* TikTok caption */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.pink}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ color:C.pink, fontSize:12, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>🎵 TikTok Caption</div>
                    <Btn small color={copied.ttCaption?C.green:C.pink} onClick={()=>copyText("ttCaption",(captionResult.tiktok?.caption||captionResult.caption||"")+" "+(captionResult.tiktok?.hashtags||captionResult.hashtags||[]).map(h=>"#"+h).join(" "))}>{copied.ttCaption?"✓ Copied":"Copy"}</Btn>
                  </div>
                  <div style={{ color:C.text, fontSize:13, lineHeight:1.8, marginBottom:10 }}>{captionResult.tiktok?.caption||captionResult.caption}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                    {(captionResult.tiktok?.hashtags||captionResult.hashtags||[]).map(h=><Tag key={h} color={C.pink} size={9}>#{h}</Tag>)}
                  </div>
                  {(captionResult.tiktok?.altCaption||captionResult.altCaption) && (
                    <div style={{ background:C.pinkBg, borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ color:C.mutedText, fontSize:9, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>EDGY ALT</div>
                      <div style={{ color:C.text, fontSize:12 }}>{captionResult.tiktok?.altCaption||captionResult.altCaption}</div>
                    </div>
                  )}
                </div>
                {/* Instagram caption */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.purple}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ color:C.purple, fontSize:12, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>📸 Instagram Caption</div>
                    <Btn small color={copied.igCaption?C.green:C.purple} onClick={()=>copyText("igCaption",(captionResult.instagram?.caption||"")+" "+(captionResult.instagram?.hashtags||[]).map(h=>"#"+h).join(" "))}>{copied.igCaption?"✓ Copied":"Copy"}</Btn>
                  </div>
                  <div style={{ color:C.text, fontSize:13, lineHeight:1.8, marginBottom:10 }}>{captionResult.instagram?.caption||"Generate caption above to see Instagram version"}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                    {(captionResult.instagram?.hashtags||[]).map(h=><Tag key={h} color={C.purple} size={9}>#{h}</Tag>)}
                  </div>
                  {captionResult.instagram?.altCaption && (
                    <div style={{ background:C.purple+"11", borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ color:C.mutedText, fontSize:9, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>AESTHETIC ALT</div>
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
    { id:"videos",   label:"🎬 Videos" },
    { id:"analysis", label:"🔍 What's Working" },
    { id:"nextVids", label:"🚀 Next Moves" },
    { id:"weekly",   label:"📋 Harley Brief" },
    { id:"trends",   label:"📈 Trends" },
  ];

  const AnalyticsView = () => {
    const activeSub = sub || "videos";
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Sub-nav */}
        <div style={{ display:"flex", gap:4, overflowX:"auto", scrollbarWidth:"none" }}>
          {analyticsSubs.map(s=>(
            <button key={s.id} onClick={()=>setSub(s.id)} style={{ background:activeSub===s.id?C.pinkBg:"transparent", border:`1px solid ${activeSub===s.id?C.pink:C.border}`, borderRadius:10, padding:"7px 14px", color:activeSub===s.id?C.pink:C.mutedText, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>{s.label}</button>
          ))}
        </div>

        {/* VIDEOS */}
        {activeSub==="videos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Videos ({videos.length})</div>
              <Btn small onClick={()=>openModal("addVideo")}>+ Log Video</Btn>
            </div>
            {videos.length>0 && (()=>{
              const organic = videos.filter(v=>!v.promoted);
              const promoted = videos.filter(v=>v.promoted);
              const organicAvgViews = organic.length?Math.round(organic.reduce((s,v)=>s+v.views,0)/organic.length):0;
              const promotedAvgViews = promoted.length?Math.round(promoted.reduce((s,v)=>s+v.views,0)/promoted.length):0;
              return (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                    <StatCard label="TOTAL VIEWS" value={fmt(totalViews)} color={C.cyan} />
                    <StatCard label="AVG RATIO" value={`${avgRatio.toFixed(1)}%`} color={avgRatio>=5?C.green:C.yellow} />
                    <StatCard label="FACECAM AVG" value={fmt(facecamAvg)} color={C.pink} />
                    <StatCard label="VIDEOS" value={videos.length} color={C.green} />
                  </div>
                  {promoted.length>0 && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div style={{ background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:12, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ color:C.dim, fontSize:9, fontFamily:"'Syne',sans-serif", letterSpacing:"0.1em", marginBottom:3 }}>ORGANIC AVG VIEWS</div>
                          <div style={{ color:C.pink, fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>{fmt(organicAvgViews)}</div>
                          <div style={{ color:C.dim, fontSize:10, marginTop:2 }}>{organic.length} videos</div>
                        </div>
                        <div style={{ color:C.green, fontSize:22 }}>🌱</div>
                      </div>
                      <div style={{ background:"#F59E0B0F", border:`1px solid ${C.yellow}44`, borderRadius:12, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ color:C.dim, fontSize:9, fontFamily:"'Syne',sans-serif", letterSpacing:"0.1em", marginBottom:3 }}>PROMOTED AVG VIEWS</div>
                          <div style={{ color:C.yellow, fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>{fmt(promotedAvgViews)}</div>
                          <div style={{ color:C.dim, fontSize:10, marginTop:2 }}>{promoted.length} videos · paid</div>
                        </div>
                        <div style={{ color:C.yellow, fontSize:22 }}>🚀</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {hookStats.length>0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
                <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", marginBottom:12, fontFamily:"'Syne',sans-serif" }}>HOOK TYPE — AVG VIEWS</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {hookStats.map((h,i)=>(
                    <div key={h.hook} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ color:i===0?C.yellow:C.dim, fontSize:10, width:130, fontFamily:"'Syne',sans-serif", fontWeight:i===0?700:400 }}>{i===0&&"🏆 "}{h.hook}</div>
                      <div style={{ flex:1, height:6, background:C.muted+"33", borderRadius:3 }}><div style={{ height:"100%", width:`${(h.avg/hookStats[0].avg)*100}%`, background:i===0?C.yellow:C.pink+"55", borderRadius:3 }} /></div>
                      <div style={{ color:i===0?C.yellow:C.text, fontSize:10, width:40, textAlign:"right", fontFamily:"'Syne',sans-serif" }}>{fmt(h.avg)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {videos.length===0
              ? <Empty icon="🎬" title="No videos logged" sub="Log posted videos to unlock AI analysis." action={()=>openModal("addVideo")} actionLabel="Log First Video" />
              : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 70px 70px 60px 55px 60px 26px", padding:"8px 14px", background:C.pinkBg, color:C.dim, fontSize:9, fontWeight:700, letterSpacing:"0.1em", gap:6, fontFamily:"'Syne',sans-serif" }}>
                    {["TITLE","DATE","TT VIEWS","TT LIKES","IG VIEWS","IG LIKES","RATIO",""].map(h=><div key={h}>{h}</div>)}
                  </div>
                  {sortedVideos.map((v,i)=>{
                    const r=ratio(v); const hot=r>=5;
                    return (
                      <div key={v.id} style={{ display:"grid", gridTemplateColumns:"1fr 65px 70px 65px 70px 65px 55px 26px", padding:"10px 14px", borderBottom:`1px solid ${C.border}`, gap:6, alignItems:"center", background:i===0?C.pinkBg:"transparent" }}>
                        <div>
                          <div style={{ color:C.text, fontSize:11, fontFamily:"'Syne',sans-serif", fontWeight:600, marginBottom:3, lineHeight:1.2 }}>{i===0&&<span style={{ color:C.yellow }}>🏆 </span>}{v.title}</div>
                          <div style={{ display:"flex", gap:4 }}><Tag color={C.pink} size={8}>{v.type}</Tag><Tag color={C.cyan} size={8}>{v.hook}</Tag>{v.promoted&&<Tag color={C.yellow} size={8}>🚀 paid</Tag>}{v.crossPost&&<Tag color={C.purple} size={8}>TT+IG</Tag>}</div>
                        </div>
                        <div style={{ color:C.dim, fontSize:10 }}>{v.date?.slice(5)}</div>
                        <div style={{ color:C.cyan, fontWeight:700, fontFamily:"'Syne',sans-serif", fontSize:11 }}>{fmt(v.views)}</div>
                        <div style={{ color:C.pink, fontWeight:700, fontFamily:"'Syne',sans-serif", fontSize:11 }}>{fmt(v.likes)}</div>
                        <div style={{ color:C.text, fontSize:10 }}>{v.comments}</div>
                        <div style={{ color:hot?C.yellow:C.dim, fontWeight:hot?800:400, fontFamily:"'Syne',sans-serif", fontSize:10 }}>{hot?"🔥":""}{r.toFixed(1)}%</div>
                        <button onClick={()=>deleteVideo(v.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:12, padding:0 }}>✕</button>
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
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>What's Working</div>
              <Btn small outline color={C.cyan} onClick={()=>runAI("analysis")} disabled={videos.length<2||aiLoad.analysis}>{aiLoad.analysis?"⏳ Analysing...":"↻ Run Analysis"}</Btn>
            </div>
            {!analysis
              ? <Empty icon="🔍" title="No analysis yet" sub="Log 2+ videos then run analysis." action={()=>runAI("analysis")} actionLabel="Run Analysis" disabled={videos.length<2||aiLoad.analysis} />
              : (
                <>
                  <div style={{ background:`linear-gradient(135deg,${C.pinkBg},${C.card})`, border:`1px solid ${C.pink}44`, borderRadius:14, padding:"18px 20px" }}>
                    <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.12em", fontFamily:"'Syne',sans-serif", marginBottom:5 }}>KEY PATTERN</div>
                    <div style={{ color:C.text, fontSize:15, fontWeight:800, fontFamily:"'Syne',sans-serif", lineHeight:1.4 }}>{analysis.keyPattern}</div>
                    <div style={{ marginTop:12, padding:"11px 14px", background:C.yellow+"15", border:`1px solid ${C.yellow}44`, borderRadius:9 }}>
                      <div style={{ color:C.yellow, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:3 }}>⚡ URGENT FIX</div>
                      <div style={{ color:C.text, fontSize:12, lineHeight:1.5 }}>{analysis.urgentFix}</div>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[{label:"HOOK",data:analysis.hookAnalysis,bk:"bestHook",wk:"worstHook",c:C.cyan},{label:"FORMAT",data:analysis.typeAnalysis,bk:"bestType",wk:"worstType",c:C.green}].map(({label,data,bk,wk,c})=>(
                      <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
                        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:8 }}>{label} ANALYSIS</div>
                        <div style={{ display:"flex", gap:5, marginBottom:7 }}><Tag color={C.green} size={9}>✓ {data[bk]}</Tag><Tag color="#FF6B6B" size={9}>✗ {data[wk]}</Tag></div>
                        <div style={{ color:C.dim, fontSize:11, lineHeight:1.5 }}>{data.reasoning}</div>
                      </div>
                    ))}
                  </div>
                  {[{title:"✅ What's Working",items:analysis.whatIsWorking,bg:C.green+"0A",border:C.green,icon:(i)=>i.impact==="high"?"🔥":i.impact==="medium"?"📈":"💡"},{title:"❌ Not Working",items:analysis.whatIsNotWorking,bg:"#FF2D2D08",border:"#FF2D2D",icon:()=>"⚠️"}].map(({title,items,bg,border:bc,icon})=>(
                    <div key={title} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px" }}>
                      <div style={{ color:bc===C.green?C.green:"#FF6B6B", fontSize:13, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:10 }}>{title}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {items?.map((item,i)=>(
                          <div key={i} style={{ display:"flex", gap:10, padding:"10px 12px", background:bg, border:`1px solid ${bc}22`, borderRadius:9 }}>
                            <div style={{ fontSize:14, flexShrink:0 }}>{icon(item)}</div>
                            <div style={{ flex:1 }}>
                              <div style={{ color:C.text, fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", marginBottom:2 }}>{item.insight}</div>
                              <div style={{ color:C.dim, fontSize:11, lineHeight:1.4 }}>{item.evidence}</div>
                              {item.fix && <div style={{ color:C.cyan, fontSize:11, marginTop:3 }}>→ {item.fix}</div>}
                            </div>
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
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Next 3 Videos</div>
              <Btn small outline color={C.green} onClick={()=>runAI("nextVids")} disabled={videos.length<2||aiLoad.nextVids}>{aiLoad.nextVids?"⏳":"↻ Regenerate"}</Btn>
            </div>
            {!nextVids
              ? <Empty icon="🚀" title="No moves yet" sub="Log 2+ videos to get AI video recommendations." action={()=>runAI("nextVids")} actionLabel="Generate" disabled={videos.length<2||aiLoad.nextVids} />
              : (
                <>
                  {/* TikTok moves */}
                {(nextVids.tiktok||nextVids.nextVideos)?.length>0 && (
                  <div style={{ color:C.pink, fontSize:11, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>🎵 TikTok Videos</div>
                )}
                {(nextVids.tiktok||nextVids.nextVideos)?.map((v,i)=>(
                    <div key={i} style={{ background:C.card, border:`1px solid ${i===0?C.pink:C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${i===0?C.pink:i===1?C.cyan:C.green}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:3 }}>{v.priority}</div>
                          <div style={{ color:C.text, fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", lineHeight:1.3 }}>"{v.title}"</div>
                        </div>
                        <div style={{ display:"flex", gap:5 }}>
                          <Tag color={C.pink} size={9}>{v.type}</Tag>
                          <Tag color={C.cyan} size={9}>{v.hook}</Tag>
                          <Btn small outline color={C.purple} onClick={()=>{ addIdea({ id:Date.now(), title:v.title, hook:v.hook, type:v.type, notes:v.whyItWillWork }); }}>+ Ideas</Btn>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div style={{ background:C.pinkBg, borderRadius:9, padding:"10px 12px" }}>
                          <div style={{ color:C.yellow, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:3 }}>🎬 OPENING LINE</div>
                          <div style={{ color:C.text, fontSize:11, fontStyle:"italic", lineHeight:1.5 }}>"{v.openingLine}"</div>
                        </div>
                        <div style={{ background:C.pinkBg, borderRadius:9, padding:"10px 12px" }}>
                          <div style={{ color:C.cyan, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:3 }}>📐 STRUCTURE</div>
                          <div style={{ color:C.text, fontSize:11, lineHeight:1.5 }}>{v.structure}</div>
                        </div>
                      </div>
                      <div style={{ marginTop:9, padding:"9px 12px", background:C.green+"0A", border:`1px solid ${C.green}22`, borderRadius:8 }}>
                        <div style={{ color:C.green, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:2 }}>WHY IT'LL WORK</div>
                        <div style={{ color:C.dim, fontSize:11, lineHeight:1.5 }}>{v.whyItWillWork}</div>
                      </div>
                    </div>
                  ))}
                  {nextVids.songkranAngle && (
                    <div style={{ background:`linear-gradient(135deg,${C.pink}15,${C.yellow}08)`, border:`1px solid ${C.pink}44`, borderRadius:14, padding:"16px 20px" }}>
                      <div style={{ color:C.pink, fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:6 }}>🎉 SONGKRAN SPECIAL</div>
                      <div style={{ color:C.text, fontSize:13, lineHeight:1.6 }}>{nextVids.songkranAngle}</div>
                    </div>
                  )}
                </>
              )
            }
          </div>
        )}

        {/* HARLEY BRIEF */}
        {activeSub==="weekly" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Harley Brief</div>
              <Btn small outline color={C.yellow} onClick={()=>runAI("weekly")} disabled={videos.length<2||aiLoad.weekly}>{aiLoad.weekly?"⏳":"↻ Regenerate"}</Btn>
            </div>
            {!weekly
              ? <Empty icon="📋" title="No brief yet" sub="Generates a WhatsApp-ready summary for Harley." action={()=>runAI("weekly")} actionLabel="Generate Brief" disabled={videos.length<2||aiLoad.weekly} />
              : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", gridColumn:"1/-1" }}>
                      <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:5 }}>WEEK SUMMARY</div>
                      <div style={{ color:C.text, fontSize:13, lineHeight:1.7 }}>{weekly.weekSummary}</div>
                    </div>
                    <div style={{ background:C.card, border:`1px solid ${C.green}33`, borderRadius:12, padding:"14px 16px" }}>
                      <div style={{ color:C.green, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:4 }}>🏆 TOP VIDEO</div>
                      <div style={{ color:C.text, fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>{weekly.topVideo?.title}</div>
                      <div style={{ color:C.dim, fontSize:11, lineHeight:1.5 }}>{weekly.topVideo?.whyItWorked}</div>
                    </div>
                    <div style={{ background:C.card, border:`1px solid ${C.cyan}33`, borderRadius:12, padding:"14px 16px" }}>
                      <div style={{ color:C.cyan, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:4 }}>💡 LEARNING</div>
                      <div style={{ color:C.text, fontSize:12, lineHeight:1.5 }}>{weekly.biggestLearning}</div>
                    </div>
                  </div>
                  <div style={{ background:C.yellow+"0F", border:`1px solid ${C.yellow}44`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>🎯</span>
                    <div><div style={{ color:C.yellow, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:2 }}>THIS WEEK'S TARGET</div><div style={{ color:C.text, fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{weekly.thisWeekTarget}</div></div>
                  </div>
                  <div style={{ background:C.card, border:`1px solid ${C.pink}44`, borderRadius:12, padding:"16px 18px" }}>
                    <div style={{ color:C.pink, fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:8 }}>📱 HARLEY'S FILMING BRIEF — BOTH PLATFORMS</div>
                    <div style={{ color:C.text, fontSize:12, lineHeight:1.8 }}>{weekly.harleyBrief}</div>
                  </div>
                  {/* TikTok + Instagram highlights side by side */}
                  {(weekly.tiktokHighlight||weekly.instagramHighlight) && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {weekly.tiktokHighlight && (
                        <div style={{ background:C.card, border:`1px solid ${C.pink}33`, borderRadius:12, padding:"14px 16px" }}>
                          <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:4 }}>🎵 TIKTOK HIGHLIGHT</div>
                          <div style={{ color:C.text, fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>{weekly.tiktokHighlight.title||weekly.topVideo?.title}</div>
                          <div style={{ color:C.dim, fontSize:11, lineHeight:1.5 }}>{weekly.tiktokHighlight.whyItWorked||weekly.topVideo?.whyItWorked}</div>
                        </div>
                      )}
                      {weekly.instagramHighlight && (
                        <div style={{ background:C.card, border:`1px solid ${C.purple}33`, borderRadius:12, padding:"14px 16px" }}>
                          <div style={{ color:C.purple, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:4 }}>📸 INSTAGRAM HIGHLIGHT</div>
                          <div style={{ color:C.text, fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>{weekly.instagramHighlight.caption}</div>
                          <div style={{ color:C.dim, fontSize:11, lineHeight:1.5 }}>{weekly.instagramHighlight.whyItWorked}</div>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ background:C.card, border:`1px solid ${C.green}44`, borderRadius:12, padding:"16px 18px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ color:C.green, fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>💬 COPY FOR HARLEY (WhatsApp)</div>
                      <Btn small color={copied.weekly?C.green:C.muted} onClick={()=>copyText("weekly",weekly.rawSummaryText)}>{copied.weekly?"✓ Copied":"Copy"}</Btn>
                    </div>
                    <div style={{ background:C.pinkBg, borderRadius:9, padding:"12px 14px", color:C.text, fontSize:12, lineHeight:1.8, fontFamily:"'DM Mono',monospace", whiteSpace:"pre-wrap" }}>{weekly.rawSummaryText}</div>
                  </div>
                </>
              )
            }
          </div>
        )}

        {/* TRENDS */}
        {activeSub==="trends" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Trend Analysis</div>
              <Btn small color={C.orange} onClick={()=>runAI("trends")} disabled={aiLoad.trends}>{aiLoad.trends?"⏳ Analysing...":"↻ Refresh"}</Btn>
            </div>
            {!trends
              ? <Empty icon="📈" title="No trends yet" sub="AI maps current TikTok trends to KrapMaps opportunities." action={()=>runAI("trends")} actionLabel="Analyse Trends" color={C.orange} />
              : (
                <>
                  {trends.topOpportunity && (
                    <div style={{ background:`linear-gradient(135deg,#FFF7ED,${C.card})`, border:`1px solid ${C.orange}44`, borderRadius:14, padding:"18px 20px" }}>
                      <div style={{ color:C.orange, fontSize:9, letterSpacing:"0.12em", fontFamily:"'Syne',sans-serif", marginBottom:5 }}>🔥 TOP OPPORTUNITY</div>
                      <div style={{ color:C.text, fontSize:15, fontWeight:800, fontFamily:"'Syne',sans-serif", lineHeight:1.4 }}>{trends.topOpportunity}</div>
                    </div>
                  )}
                  {trends.songkranTrendAngle && (
                    <div style={{ background:`linear-gradient(135deg,${C.pink}15,${C.yellow}08)`, border:`1px solid ${C.pink}44`, borderRadius:12, padding:"14px 18px" }}>
                      <div style={{ color:C.pink, fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:5 }}>🎉 SONGKRAN ANGLE</div>
                      <div style={{ color:C.text, fontSize:13, lineHeight:1.6 }}>{trends.songkranTrendAngle}</div>
                    </div>
                  )}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {trends.trends?.map((t,i)=>(
                      <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5 }}>
                              <div style={{ color:C.text, fontSize:13, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>{t.trend}</div>
                              <Tag color={t.urgency?.includes("Now")?C.pink:t.urgency?.includes("week")?C.yellow:C.cyan} size={8}>{t.urgency}</Tag>
                              <Tag color={C.muted} size={8}>{t.format}</Tag>
                            </div>
                            <div style={{ color:C.dim, fontSize:11, lineHeight:1.5, marginBottom:8 }}>{t.why}</div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                              <div style={{ background:C.pinkBg, borderRadius:7, padding:"9px 11px" }}>
                                <div style={{ color:C.pink, fontSize:9, letterSpacing:"0.08em", fontFamily:"'Syne',sans-serif", marginBottom:2 }}>🎵 TIKTOK ANGLE</div>
                                <div style={{ color:C.text, fontSize:11, lineHeight:1.5 }}>{t.tiktokAngle||t.contentIdea}</div>
                              </div>
                              {t.instagramAngle && (
                                <div style={{ background:C.purple+"0F", borderRadius:7, padding:"9px 11px" }}>
                                  <div style={{ color:C.purple, fontSize:9, letterSpacing:"0.08em", fontFamily:"'Syne',sans-serif", marginBottom:2 }}>📸 INSTAGRAM ANGLE</div>
                                  <div style={{ color:C.text, fontSize:11, lineHeight:1.5 }}>{t.instagramAngle}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          <Btn small outline color={C.purple} onClick={()=>{ addIdea({ id:Date.now(), title:t.tiktokAngle||t.contentIdea, hook:"edgy/controversial", type:t.format||"facecam", notes:`Trend: ${t.trend}` }); goTo("content","ideas"); }}>+ Ideas</Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            }
          </div>
        )}
      </div>
    );
  };

  // GROWTH
  const GrowthView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Growth Stats</div>
        <Btn small outline onClick={()=>openModal("editStats")}>✏️ Update TikTok + Bins</Btn>
      </div>

      {/* TikTok */}
      <div style={{ background:C.card, border:`1px solid ${C.borderStrong}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.pink}` }}>
        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:12 }}>🎵 TIKTOK (@findkrap)</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          <StatCard label="FOLLOWERS" value={fmt(m.tt_followers||0)} color={C.pink} sub={m.tt_date||"—"} />
          <StatCard label="TOTAL VIEWS" value={fmt(m.tt_views||0)} color={C.cyan} />
          <StatCard label="TOTAL LIKES" value={fmt(m.tt_likes||0)} color={C.pink} />
          <StatCard label="BINS MAPPED" value={fmt(m.bins||0)} color={C.yellow} sub={m.bins_date||"—"} />
        </div>
      </div>

      {/* Instagram */}
      <div style={{ background:C.card, border:`1px solid ${C.borderStrong}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.pink}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif" }}>📸 INSTAGRAM</div>
          {hasIG && <Btn small outline color={C.pink} onClick={fetchIG} disabled={igLoad}>{igLoad?"⏳":"↻ Refresh"}</Btn>}
        </div>
        {!hasIG && <div style={{ color:C.dim, fontSize:12 }}>No key yet — add in <span style={{ color:C.pink, cursor:"pointer" }} onClick={()=>setNav("settings")}>Settings</span></div>}
        {igLoad && <div style={{ color:C.dim, fontSize:12 }}>Fetching...</div>}
        {igError && <div style={{ color:"#FF6B6B", fontSize:12 }}>⚠ {igError}</div>}
        {igData && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
              <StatCard label="USERNAME" value={`@${igData.profile.username}`} color={C.pink} />
              <StatCard label="FOLLOWERS" value={igData.profile.followers_count!=null?fmt(igData.profile.followers_count):"—"} color={C.purple} sub="live" />
              <StatCard label="POSTS" value={igData.profile.media_count} color={C.cyan} sub="live" />
              <StatCard label="ACCOUNT TYPE" value={igData.profile.account_type} color={C.yellow} />
            </div>
            {igData.profile.account_type==="PERSONAL" && (
              <div style={{ background:C.yellow+"15", border:`1px solid ${C.yellow}44`, borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:11, color:C.text }}>
                💡 <strong>Switch to Creator account</strong> in Instagram Settings to unlock Reel view counts and follower stats.
              </div>
            )}
            {igData.media.length>0 && (
              <div style={{ background:C.bg, borderRadius:10, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 70px 65px 55px 55px", padding:"7px 12px", color:C.dim, fontSize:9, fontWeight:700, letterSpacing:"0.1em", gap:6, fontFamily:"'Syne',sans-serif" }}>{["CAPTION","DATE","TYPE","VIEWS","LIKES","CMNT"].map(h=><div key={h}>{h}</div>)}</div>
                {igData.media.map(p=>(
                  <div key={p.id} style={{ display:"grid", gridTemplateColumns:"1fr 80px 70px 65px 55px 55px", padding:"9px 12px", borderTop:`1px solid ${C.border}`, gap:6, alignItems:"center" }}>
                    <div style={{ color:C.text, fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.caption?.slice(0,50)||"(no caption)"}</div>
                    <div style={{ color:C.dim, fontSize:10 }}>{p.timestamp?.slice(0,10)}</div>
                    <Tag color={C.purple} size={8}>{p.media_type==="VIDEO"?"REEL":p.media_type}</Tag>
                    <div style={{ color:C.cyan, fontWeight:700, fontSize:11, fontFamily:"'Syne',sans-serif" }}>{igViews(p)!=null?fmt(igViews(p)):"—"}</div>
                    <div style={{ color:C.pink, fontWeight:700, fontSize:11 }}>{p.like_count??"—"}</div>
                    <div style={{ color:C.text, fontSize:11 }}>{p.comments_count??"—"}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* App Store */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.cyan}` }}>
        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:12 }}>🍎 APP STORE {hasApple&&<Tag color={C.green} size={8}>KEY SAVED</Tag>}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[["iOS Downloads","ios_downloads","number"],["iOS Rating","ios_rating","text"],["iOS Reviews","ios_reviews","number"],["Active Users","ios_active","number"]].map(([label,key,type])=>(
            <div key={key}>
              <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.08em", marginBottom:3, fontFamily:"'Syne',sans-serif" }}>{label}</div>
              <input type={type} value={m[key]||""} onChange={e=>setManualData(d=>({...d,[key]:e.target.value}))} placeholder="0" style={{ width:"100%", background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:12, fontFamily:"'DM Mono',monospace", outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Google Play */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.green}` }}>
        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:12 }}>▶️ GOOGLE PLAY {hasPlay&&<Tag color={C.green} size={8}>KEY SAVED</Tag>}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[["Android Installs","android_installs","number"],["Android Rating","android_rating","text"],["Android Reviews","android_reviews","number"],["Active Users","android_active","number"]].map(([label,key,type])=>(
            <div key={key}>
              <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.08em", marginBottom:3, fontFamily:"'Syne',sans-serif" }}>{label}</div>
              <input type={type} value={m[key]||""} onChange={e=>setManualData(d=>({...d,[key]:e.target.value}))} placeholder="0" style={{ width:"100%", background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:12, fontFamily:"'DM Mono',monospace", outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // SETTINGS
  const SettingsView = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ color:C.text, fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Settings</div>

      {/* SUPABASE */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.purple}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <div style={{ color:C.text, fontSize:13, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>🗄 Database (Supabase)</div>
            <div style={{ color:C.dim, fontSize:11, marginTop:2 }}>Saves everything permanently — survives between sessions</div>
          </div>
          <Tag color={C.purple} size={9}>CONNECTED</Tag>
        </div>
        <div style={{ background:C.pinkBg, borderRadius:10, padding:"12px 14px", fontSize:11, color:C.dim, lineHeight:1.6 }}>
          Connected to your Supabase project. All videos, ideas, calendar and stats are saved permanently. <br/>
          <strong style={{ color:C.purple }}>One time setup required:</strong> Go to supabase.com → your project → SQL Editor → run the setup SQL below.
        </div>
        <div style={{ marginTop:10, background:C.bg, borderRadius:8, padding:"10px 12px", fontSize:10, fontFamily:"'DM Mono',monospace", color:C.text, overflowX:"auto" }}>
          {"create table if not exists km_videos (id int primary key, value text, updated_at timestamptz); create table if not exists km_ideas (id int primary key, value text, updated_at timestamptz); create table if not exists km_calendar (id int primary key, value text, updated_at timestamptz); create table if not exists km_manual (id int primary key, value text, updated_at timestamptz); create table if not exists km_trends (id int primary key, value text, updated_at timestamptz);"}
        </div>
        <div style={{ color:C.dim, fontSize:10, marginTop:8 }}>Copy this SQL → Supabase → SQL Editor → Run. One time only.</div>
      </div>

      {/* AUTO SYNC */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${C.green}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ color:C.text, fontSize:13, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>🤖 Auto Sync</div>
            <div style={{ color:C.dim, fontSize:11, marginTop:2 }}>Paste your GitHub raw file URL — stats update automatically every night</div>
          </div>
          {lastSync && <div style={{ color:C.green, fontSize:10, fontFamily:"'Syne',sans-serif", textAlign:"right" }}>✓ Last sync<br/>{lastSync.toLocaleTimeString()}</div>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ flex:1 }}>
            <FInput
              placeholder="https://raw.githubusercontent.com/YOUR_USERNAME/krapmaps-stats/main/krapmaps_stats.json"
              value={syncUrl}
              onChange={e=>setSyncUrl(e.target.value)}
              color={C.green}
            />
          </div>
          <Btn color={C.green} onClick={()=>{ saveSyncUrl(syncUrl); fetchSync(); }} disabled={!syncUrl||syncing}>{syncing?"⏳":"Save + Sync"}</Btn>
        </div>
        {syncErr && <div style={{ color:"#FF6B6B", fontSize:11, marginTop:8 }}>⚠ {syncErr} — check the URL is correct and the repo is public</div>}
        {syncData && (
          <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
            {syncData.tiktok?.account && <Tag color={C.green} size={9}>🎵 TT: {fmt(syncData.tiktok.account.followers||0)} followers · {syncData.tiktok.videos?.length||0} videos</Tag>}
            {syncData.instagram && <Tag color={C.purple} size={9}>📸 IG: {fmt(syncData.instagram.followers||0)} followers</Tag>}
            <Tag color={C.dim} size={9}>Scraped: {syncData.scraped_at?.slice(0,10)||"—"}</Tag>
          </div>
        )}
        <div style={{ marginTop:10, color:C.dim, fontSize:10, lineHeight:1.6 }}>
          Don't have this set up yet? <span style={{ color:C.green, cursor:"pointer", fontWeight:700 }} onClick={()=>window.open("https://github.com","_blank")}>See the SETUP.md guide in your repo</span> — takes 20 minutes, free forever.
        </div>
      </div>

      {/* API Keys */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px" }}>
        <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.1em", fontFamily:"'Syne',sans-serif", marginBottom:14 }}>API KEYS</div>
        <SetupScreen existingKeys={keys} onSave={newKeys=>{ onEditKeys(newKeys); }} />
      </div>
      {/* Songkran */}
      <div style={{ background:`linear-gradient(135deg,${C.pink},${C.pinkDark})`, borderRadius:16, padding:"22px 24px", boxShadow:`0 8px 32px ${C.pink}44` }}>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:36 }}>💦🎉🗑</div>
          <div style={{ color:"#fff", fontSize:22, fontWeight:900, fontFamily:"'Nunito',sans-serif", marginTop:8 }}>Songkran Activation</div>
          <div style={{ color:"rgba(255,255,255,0.9)", fontSize:13, fontWeight:700, marginTop:4, fontFamily:"'Syne',sans-serif" }}>April 13–15 · Thailand</div>
          <div style={{ display:"inline-block", background:"rgba(255,255,255,0.25)", color:"#fff", fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:16, padding:"9px 24px", borderRadius:100, marginTop:12, border:"1px solid rgba(255,255,255,0.4)" }}>T–{daysToSongkran} days</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            {title:"🎥 Content Goals",color:C.pink,items:["Bin-finding during Songkran chaos",'"No bins in Thailand" hook','City vs. city leaderboard','Participant reaction facecam','Double points geo-zone clip']},
            {title:"📱 In-App Features",color:C.cyan,items:["Songkran badge (limited)","City vs. city leaderboard","One-tap share card","Geo-based double points","Minigame promo"]},
            {title:"🤝 Outreach",color:C.yellow,items:["Thai universities","Drink brands (Chang, Leo)","Expat groups","Shopping malls","NGO waste partners"]},
            {title:"📊 Targets",color:C.green,items:["200+ bins in Thailand","Views from Songkran content","Downloads during festival","Leaderboard participants","Festival-goer shares"]},
          ].map(({title,color,items})=>(
            <div key={title} style={{ background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"14px 16px" }}>
              <div style={{ color:"#fff", fontWeight:800, fontSize:12, fontFamily:"'Syne',sans-serif", marginBottom:8 }}>{title}</div>
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
      <div style={{ background:C.pinkBg, border:`2px dashed ${C.borderStrong}`, borderRadius:16, padding:"44px 24px", textAlign:"center" }}>
        <div style={{ fontSize:38, marginBottom:10 }}>{icon}</div>
        <div style={{ color:C.text, fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:6 }}>{title}</div>
        <div style={{ color:C.dim, fontSize:12, marginBottom:16 }}>{sub}</div>
        {action && <Btn color={color} onClick={action} disabled={disabled}>{actionLabel}</Btn>}
      </div>
    );
  }

  // MODALS
  const AddVideoModal = () => {
    const [mode, setMode]         = useState("screenshot");
    const [form, setForm]         = useState({ date:today(), type:"facecam", hook:"edgy/controversial", crossPost:true });
    const [scanning, setScanning] = useState(false);
    const [scanErr, setScanErr]   = useState(null);
    const [preview, setPreview]   = useState(null);
    const fileRef                 = useRef();
    const set = (k,v) => setForm(f=>({...f,[k]:v}));

    async function analyseScreenshot(file) {
      setScanning(true); setScanErr(null);
      setPreview(URL.createObjectURL(file));
      try {
        const b64 = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
        const scanHeaders = {"Content-Type":"application/json"};
        const scanUrl = window.location.hostname === "localhost" ? "https://api.anthropic.com/v1/messages" : "/api/proxy";
        if(scanUrl.includes("anthropic")) { scanHeaders["x-api-key"] = ANTHROPIC_KEY; scanHeaders["anthropic-version"] = "2023-06-01"; scanHeaders["anthropic-dangerous-direct-browser-access"] = "true"; }
        const resp = await fetch(scanUrl, {
          method:"POST", headers:scanHeaders,
          body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800, system:SYSTEM,
            messages:[{ role:"user", content:[
              { type:"image", source:{ type:"base64", media_type:file.type||"image/jpeg", data:b64 }},
              { type:"text", text:'This is a screenshot of a TikTok video from @findkrap (KrapMaps). Extract all visible info. Return JSON only: {"title":"caption or first on-screen text","date":"YYYY-MM-DD or null","views":number or null,"likes":number or null,"comments":number or null,"shares":number or null,"type":"facecam|street|screencap|voiceover|mixed","hook":"edgy/controversial|problem→solution|gamification|achievement|challenge|reaction|demo|other","promoted":false,"confidence":"high|medium|low","notes":"anything notable"}. Convert K to thousands (14.2K=14200), M to millions. Null if unclear.' }
            ]}]
          })
        });
        const rawText = await resp.text();
        let data;
        try { data = JSON.parse(rawText); } catch(e) { throw new Error("Invalid response: " + rawText.slice(0,200)); }
        if(data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        const text = data.content?.map(b=>b.text||"").join("")||"";
        const p = JSON.parse(text.replace(/```json|```/g,"").trim());
        setForm(f=>({...f,
          title:p.title||f.title, date:p.date||f.date,
          views:p.views!=null?String(p.views):f.views,
          likes:p.likes!=null?String(p.likes):f.likes,
          comments:p.comments!=null?String(p.comments):f.comments,
          shares:p.shares!=null?String(p.shares):f.shares,
          type:p.type||f.type, hook:p.hook||f.hook,
          promoted:p.promoted||f.promoted, notes:p.notes||f.notes,
          _confidence:p.confidence,
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
        <div><div style={{ color:form[field]?color:C.dim, fontWeight:800, fontSize:12, fontFamily:"'Syne',sans-serif" }}>{label}</div><div style={{ color:C.dim, fontSize:10, marginTop:1 }}>{sub}</div></div>
        <div style={{ width:36, height:20, borderRadius:10, background:form[field]?color:C.muted, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
          <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:form[field]?18:2, transition:"left 0.2s" }} />
        </div>
      </div>
    );

    return (
      <Modal title="Log a Video" onClose={()=>closeModal("addVideo")} maxWidth={540}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Mode switcher */}
          <div style={{ display:"flex", gap:5, background:C.pinkBg, padding:"5px", borderRadius:12, border:`1px solid ${C.borderStrong}` }}>
            {[["screenshot","📱 Scan Screenshot"],["manual","✏️ Manual Entry"]].map(([m,l])=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, background:mode===m?C.pink:"transparent", border:"none", borderRadius:8, padding:"8px", color:mode===m?"#fff":C.mutedText, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
            ))}
          </div>

          {/* ── SCREENSHOT MODE ── */}
          {mode==="screenshot" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ color:C.dim, fontSize:11, lineHeight:1.6 }}>Screenshot your TikTok video page — Claude reads the views, likes, comments, shares, hook type and content type automatically. Works from any screenshot showing the stats.</div>
              <div
                onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer?.files?.[0]; if(f) analyseScreenshot(f); }}
                onDragOver={e=>e.preventDefault()}
                onClick={()=>fileRef.current?.click()}
                style={{ border:`2px dashed ${scanning?C.pink:C.borderStrong}`, borderRadius:16, padding:scanning?"28px 20px":"36px 20px", textAlign:"center", cursor:"pointer", background:scanning?C.pink+"08":C.pinkBg, transition:"all 0.2s" }}
              >
                {scanning ? (
                  <>
                    <div style={{ fontSize:36, marginBottom:8 }}>🔍</div>
                    <div style={{ color:C.pink, fontWeight:800, fontFamily:"'Syne',sans-serif", fontSize:14 }}>Reading your screenshot...</div>
                    <div style={{ color:C.dim, fontSize:11, marginTop:4 }}>Extracting stats, hook type, content type</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:40, marginBottom:10 }}>📱</div>
                    <div style={{ color:C.text, fontWeight:800, fontFamily:"'Syne',sans-serif", fontSize:15 }}>Drop screenshot here</div>
                    <div style={{ color:C.dim, fontSize:11, marginTop:4 }}>or tap to pick from your photos</div>
                    <div style={{ marginTop:12, display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                      {["Video page","Analytics view","Any TikTok screenshot"].map(t=><span key={t} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:"3px 8px", fontSize:10, color:C.dim }}>{t}</span>)}
                    </div>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) analyseScreenshot(e.target.files[0]); }} />
              </div>
              {scanErr && <div style={{ color:"#FF6B6B", fontSize:11, background:"#FF2D2D0A", borderRadius:8, padding:"8px 12px" }}>⚠ {scanErr} — try Manual Entry instead</div>}
              {preview && !scanning && (
                <div style={{ borderRadius:10, overflow:"hidden", maxHeight:160, display:"flex", justifyContent:"center", background:C.bg }}>
                  <img src={preview} style={{ maxHeight:160, maxWidth:"100%", objectFit:"contain" }} alt="screenshot preview" />
                </div>
              )}
              <div style={{ color:C.mutedText, fontSize:10, textAlign:"center" }}>After scanning, Claude fills the form — you just review and save. Takes ~5 seconds.</div>
            </div>
          )}

          {/* ── MANUAL / REVIEW MODE ── */}
          {mode==="manual" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {form._confidence && (
                <div style={{ background:form._confidence==="high"?C.green+"0F":form._confidence==="medium"?C.yellow+"0F":"#FF6B6B0F", border:`1px solid ${form._confidence==="high"?C.green:form._confidence==="medium"?C.yellow:"#FF6B6B"}44`, borderRadius:10, padding:"9px 12px", fontSize:11, color:C.text }}>
                  {form._confidence==="high"?"✅ Stats read clearly — review and save.":form._confidence==="medium"?"⚠️ Medium confidence — double-check the numbers.":"⚠️ Low confidence — screenshot unclear. Check everything carefully."}
                </div>
              )}
              <FInput label="TITLE / HOOK TEXT *" placeholder="e.g. No bins in Thailand 🇹🇭" value={form.title} onChange={e=>set("title",e.target.value)} />
              <FInput label="DATE POSTED" type="date" value={form.date} onChange={e=>set("date",e.target.value)} />
              <ChipGroup label="VIDEO TYPE" options={VIDEO_TYPES} value={form.type} onChange={v=>set("type",v)} color={C.pink} />
              <ChipGroup label="HOOK TYPE" options={HOOK_TYPES} value={form.hook} onChange={v=>set("hook",v)} color={C.cyan} />

              {/* TikTok stats */}
              <div style={{ background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:12, padding:"12px 14px" }}>
                <div style={{ color:C.pink, fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:10 }}>🎵 TikTok Stats</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[["VIEWS *","views"],["LIKES","likes"],["COMMENTS","comments"],["SHARES","shares"]].map(([l,k])=><FInput key={k} label={l} type="number" placeholder="0" value={form[k]} onChange={e=>set(k,e.target.value)} color={C.pink} />)}
                </div>
              </div>

              <Toggle field="crossPost" label="📲 Posted to TikTok + Instagram Reels" sub="Log stats for both platforms" color={C.purple} />

              {form.crossPost && (
                <div style={{ background:C.purple+"0A", border:`1px solid ${C.purple}44`, borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ color:C.purple, fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>📸 Instagram Reels Stats</div>
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
    return (
      <Modal title="Add Idea" onClose={()=>closeModal("addIdea")}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <FInput label="IDEA / HOOK TITLE *" placeholder="e.g. Bin catcher game is actually addictive" value={form.title} onChange={e=>set("title",e.target.value)} />
          <ChipGroup label="VIDEO TYPE" options={VIDEO_TYPES} value={form.type} onChange={v=>set("type",v)} color={C.pink} />
          <ChipGroup label="HOOK TYPE" options={HOOK_TYPES} value={form.hook} onChange={v=>set("hook",v)} color={C.cyan} />
          <FInput label="NOTES (optional)" placeholder="Any context for filming" value={form.notes} onChange={e=>set("notes",e.target.value)} />
          <Btn full onClick={()=>{ if(!form.title) return; addIdea({ id:Date.now(),...form, notes:form.notes||"" }); }} disabled={!form.title}>Save Idea</Btn>
        </div>
      </Modal>
    );
  };

  const AddCalModal = () => {
    const [form, setForm] = useState({ date:today(), platform:"TikTok", status:"idea", ...draft });
    const set = (k,v) => setForm(f=>({...f,[k]:v}));
    return (
      <Modal title="Schedule Content" onClose={()=>closeModal("addCal")}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
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
              <div style={{ color:C.dim, fontSize:9, letterSpacing:"0.08em", marginBottom:3, fontFamily:"'Syne',sans-serif" }}>{label}</div>
              <input type={type} value={form[key]||""} placeholder={label} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{ width:"100%", background:C.pinkBg, border:`1px solid ${C.borderStrong}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:12, fontFamily:"'DM Mono',monospace", outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          <Btn full onClick={()=>saveManual(form)}>Save</Btn>
        </div>
      </Modal>
    );
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'DM Mono',monospace", paddingBottom:80 }}>
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
        {nav==="growth"    && <GrowthView />}
        {nav==="settings"  && <SettingsView />}
      </div>

      {/* Bottom nav bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.card, borderTop:`2px solid ${C.borderStrong}`, display:"flex", zIndex:50, boxShadow:"0 -4px 24px rgba(255,45,120,0.10)" }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>{ setNav(n.id); setSub(null); }} style={navBtnStyle(n.id)}>
            <span style={{ fontSize:20 }}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      {modals.addVideo  && <AddVideoModal />}
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
  // Always go straight to dashboard — setup screen available in Settings
  return <Dashboard keys={config.keys||{}} onEditKeys={keys=>{ const u={...config,keys}; setConfig(u); saveJSON(KEYS_KEY,u); }} />;
}
