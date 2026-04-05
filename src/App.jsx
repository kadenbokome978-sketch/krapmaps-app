import { useState, useEffect, useCallback, useRef } from "react";


const C = {
  pink:"#FF2D78", cyan:"#00CFFF", yellow:"#FFD60A",
  green:"#00FF94", orange:"#FF6B35", purple:"#C566FF",
  bg:"#07050F", card:"rgba(255,255,255,0.04)",
  cardSolid:"#0D0B18", cardAlt:"rgba(255,255,255,0.02)",
  border:"rgba(255,255,255,0.08)", borderMed:"rgba(255,255,255,0.12)",
  dim:"rgba(255,255,255,0.32)", text:"#F8EEFF", textMed:"#C8A8E0",
  fontHead:"'Bebas Neue', cursive",
  fontSora:"'Sora', sans-serif",
  fontBody:"system-ui, sans-serif",
  fontMono:"monospace",
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
};

const Glass = ({ children, glow, border, style={} }) => (
  <div style={{ background:C.card, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:`1px solid ${border||C.border}`, borderRadius:18, boxShadow:glow?`0 0 40px ${glow}12, inset 0 1px 0 rgba(255,255,255,0.07)`:"inset 0 1px 0 rgba(255,255,255,0.06)", ...style }}>{children}</div>
);
const Tag = ({ children, color, sm }) => (
  <span style={{ background:`${color}18`, border:`1px solid ${color}35`, color, borderRadius:5, padding:sm?"1px 5px":"2px 7px", fontSize:sm?7:8, fontWeight:700, letterSpacing:"0.1em", display:"inline-block", whiteSpace:"nowrap" }}>{children}</span>
);
const Pill = ({ children, color, active, onClick }) => (
  <button onClick={onClick} style={{ padding:"4px 12px", borderRadius:20, border:`1px solid ${active?color:C.border}`, background:active?`${color}20`:"transparent", color:active?color:C.dim, fontSize:9, fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", fontFamily:C.fontBody, transition:"all 0.15s", whiteSpace:"nowrap" }}>{children}</button>
);
const Num = ({ children, color, size=26 }) => (
  <div style={{ fontSize:size, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.04em", color, textShadow:`0 0 18px ${color}45`, lineHeight:1 }}>{children}</div>
);
const SLabel = ({ children, color=C.dim, mb=10 }) => (
  <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", color, marginBottom:mb }}>{children}</div>
);
const Row = ({ children, style={} }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", ...style }}>{children}</div>
);
const Divider = ({ my=10 }) => <div style={{ height:1, background:C.border, margin:`${my}px 0` }} />;
const SectionHead = ({ title, color=C.text, action, actionColor=C.pink }) => (
  <Row style={{ marginBottom:14 }}>
    <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em", color }}>{title}</div>
    {action && <button onClick={action} style={{ width:34, height:34, borderRadius:10, background:`${actionColor}18`, border:`1px solid ${actionColor}30`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:actionColor }}>{I.plus(14,actionColor)}</button>}
  </Row>
);
const StatMini = ({ label, value, color, icon }) => (
  <Glass glow={color} style={{ padding:"13px 11px", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:-8, right:-8, width:50, height:50, borderRadius:"50%", background:`${color}10`, filter:"blur(12px)", pointerEvents:"none" }} />
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
      <div style={{ width:24, height:24, borderRadius:7, background:`${color}15`, border:`1px solid ${color}25`, display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0 }}>{icon}</div>
      <div style={{ fontSize:8, color:C.dim, fontWeight:700, letterSpacing:"0.12em", lineHeight:1.2 }}>{label}</div>
    </div>
    <Num color={color} size={24}>{value}</Num>
  </Glass>
);
const SubTabs = ({ tabs, active, onChange, color=C.pink }) => (
  <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2, marginBottom:14, scrollbarWidth:"none" }}>
    {tabs.map(t => <Pill key={t} active={active===t} color={color} onClick={()=>onChange(t)}>{t}</Pill>)}
  </div>
);
const ActionBtn = ({ children, color, onClick }) => (
  <button onClick={onClick} style={{ padding:"5px 10px", borderRadius:8, background:`${color}18`, border:`1px solid ${color}30`, fontSize:10, fontWeight:700, color, cursor:"pointer", fontFamily:C.fontBody, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{children}</button>
);
const IconBtn = ({ icon, onClick, color=C.dim }) => (
  <button onClick={onClick} style={{ padding:"5px 8px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, cursor:"pointer", color, display:"flex", alignItems:"center" }}>{icon}</button>
);

const HomeView = ({ ideas, calItems, setNav, runAI, aiLoad, openModal, ttViewsDisplay, m, daysToSongkran, scrapedStats, statsError, igData }) => {
  const topIdeas = ideas||[];
  const upcoming = calItems||[];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ borderRadius:22, padding:"20px 18px 17px", position:"relative", overflow:"hidden", background:`linear-gradient(140deg,${C.pink} 0%,${C.purple} 52%,#5B1FFF 100%)`, boxShadow:`0 10px 40px ${C.pink}28` }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.09)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-20, left:-20, width:130, height:130, borderRadius:"50%", background:"rgba(0,0,0,0.12)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)", pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.16em", color:"rgba(255,255,255,0.65)", marginBottom:2 }}>TOTAL VIEWS ALL TIME</div>
          <div style={{ fontSize:58, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1, color:"#fff", fontFamily:C.fontSora }}>{(ttViewsDisplay>=1e6?(ttViewsDisplay/1e6).toFixed(1)+"M":ttViewsDisplay>=1e3?(ttViewsDisplay/1e3).toFixed(1)+"K":String(ttViewsDisplay||0))}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
            <div style={{ background:"rgba(0,255,148,0.2)", border:"1px solid rgba(0,255,148,0.38)", borderRadius:8, padding:"3px 10px", fontSize:10, fontWeight:700, color:C.green }}>{daysToSongkran}D TO SONGKRAN</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", fontWeight:600, letterSpacing:"0.04em" }}>{m?.tt_followers||96} FOLLOWERS</div>
          </div>
          <div style={{ marginTop:6, fontSize:8, color:"rgba(255,255,255,0.3)", letterSpacing:"0.06em" }}>{scrapedStats?.scraped_at?"synced "+new Date(scrapedStats.scraped_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):"synced just now"}</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <StatMini label="TT FOLLOWERS" value={m?.tt_followers>=1e3?(m.tt_followers/1e3).toFixed(1)+"K":String(m?.tt_followers||0)} color={C.pink} icon={I.tt(13,C.pink)} />
        <StatMini label="TOTAL VIEWS" value={ttViewsDisplay>=1e6?(ttViewsDisplay/1e6).toFixed(1)+"M":ttViewsDisplay>=1e3?(ttViewsDisplay/1e3).toFixed(1)+"K":String(ttViewsDisplay||0)} color={C.cyan} icon={I.eye(13,C.cyan)} />
        <StatMini label="BINS MAPPED" value={m?.bins>=1e3?(m.bins/1e3).toFixed(1)+"K":String(m?.bins||0)} color={C.yellow} icon={I.map(13,C.yellow)} />
        <StatMini label="IG POSTS" value={igData?.profile?.media_count||"--"} color={C.purple} icon={I.ig(13,C.purple)} />
      </div>
      <Glass style={{ padding:"14px" }}>
        <SLabel mb={12}>QUICK ACTIONS</SLabel>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
          {[{ic:I.idea,l:"ADD IDEA",c:C.purple,fn:()=>{setNav("content");if(openModal)setTimeout(()=>openModal("addIdea"),50);}},{ic:I.cal,l:"SCHEDULE",c:C.cyan,fn:()=>{setNav("content");if(openModal)setTimeout(()=>openModal("addCal"),50);}},{ic:I.vid,l:"LOG VIDEO",c:C.pink,fn:()=>openModal&&openModal("addVideo")},{ic:I.bar,l:"UPDATE STATS",c:C.yellow,fn:()=>openModal&&openModal("editStats")}].map((x,i)=>(
            <div key={i} onClick={x.fn} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer" }}>
              <div style={{ width:46, height:46, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", background:`${x.c}12`, border:`1px solid ${x.c}25`, color:x.c }}>{x.ic(18,x.c)}</div>
              <span style={{ fontSize:8, fontWeight:700, color:x.c, letterSpacing:"0.06em", textAlign:"center", lineHeight:1.2 }}>{x.l}</span>
            </div>
          ))}
        </div>
      </Glass>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <Glass style={{ padding:"12px" }}>
          <Row style={{ marginBottom:9 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>{I.cal(12,C.cyan)}<span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:C.cyan }}>UPCOMING</span></div>
            <span style={{ fontSize:9, color:C.cyan, fontWeight:700, cursor:"pointer" }} onClick={()=>setNav("content")}>ALL</span>
          </Row>
          {upcoming.map((c,i)=>(
            <div key={c.id} style={{ marginBottom:i<upcoming.length-1?8:0 }}>
              <div style={{ color:C.text, fontSize:11, fontWeight:600, lineHeight:1.3, marginBottom:2 }}>{c.title}</div>
              <div style={{ display:"flex", gap:4 }}><Tag color={C.cyan} sm>{c.date.slice(5)}</Tag><Tag color={C.dim} sm>{c.platform}</Tag></div>
            </div>
          ))}
        </Glass>
        <Glass style={{ padding:"12px" }}>
          <Row style={{ marginBottom:9 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>{I.idea(12,C.purple)}<span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:C.purple }}>TOP IDEAS</span></div>
            <span style={{ fontSize:9, color:C.purple, fontWeight:700, cursor:"pointer" }} onClick={()=>setNav("content")}>ALL</span>
          </Row>
          {topIdeas.map((idea,i)=>(
            <div key={idea.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:i<2?7:0, gap:4 }}>
              <div style={{ fontSize:10, color:C.text, fontWeight:500, flex:1, lineHeight:1.3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{idea.title}</div>
              <Num color={perfColor(idea.viral||0)} size={17}>{idea.viral||0}</Num>
            </div>
          ))}
        </Glass>
      </div>
      <Glass style={{ padding:"14px" }}>
        <SLabel mb={12}>AI ACTIONS</SLabel>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
          {[{ic:I.search,l:"WHAT'S WORKING",c:C.cyan,m:"analysis"},{ic:I.target,l:"NEXT VIDEOS",c:C.green,m:"nextVids"},{ic:I.write,l:"HARLEY BRIEF",c:C.yellow,m:"weekly"},{ic:I.trend,l:"TRENDS",c:C.orange,m:"trends"}].map((a,i)=>(
            <div key={i} onClick={()=>runAI&&runAI(a.m)} style={{ borderRadius:12, padding:"11px 10px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", background:`${a.c}07`, border:`1px solid ${a.c}20`, opacity:aiLoad&&aiLoad[a.m]?0.5:1 }}>
              <div style={{ color:a.c, flexShrink:0 }}>{a.ic(15,a.c)}</div>
              <span style={{ fontSize:9, fontWeight:700, color:a.c, letterSpacing:"0.04em" }}>{a.l}</span>
            </div>
          ))}
        </div>
      </Glass>
    </div>
  );
};

const ContentView = ({ ideas, setIdeas, calItems, setCalItems, scoreIdea, genCaption, aiLoad, captionResult, captionIdea, copied, copyText, openModal, setEditIdeaTarget, setModals, setNavSub }) => {
  const [sub, setSub] = useState("IDEAS");
  const [expanded, setExpanded] = useState(null);
  const [calFilter, setCalFilter] = useState("ALL");
  const sorted = [...ideas].sort((a,b)=>(b.viral||0)-(a.viral||0));
  const filteredCal = calFilter==="ALL" ? calItems : calItems.filter(c=>c.platform.toUpperCase()===calFilter||(calFilter==="BOTH"&&c.platform==="Both"));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <SubTabs tabs={["IDEAS","CALENDAR","CAPTIONS"]} active={sub} onChange={setSub} color={C.pink} />
      {sub==="IDEAS" && (
        <>
          <SectionHead title={`IDEA BANK (${ideas.length})`} action={()=>openModal&&openModal("addIdea")} actionColor={C.pink} />
          {sorted.map(idea=>{
            const ic = (idea.viral||0)>=80?C.green:(idea.viral||0)>=60?C.yellow:C.pink;
            return (
              <Glass key={idea.id} glow={ic} style={{ padding:"14px" }}>
                <Row style={{ marginBottom:10, alignItems:"flex-start", gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:7 }}>{idea.title}</div>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      <Tag color={C.pink}>{idea.type}</Tag>
                      <Tag color={C.cyan}>{idea.hook}</Tag>
                      <Tag color={ic}>{perfLabel(idea.viral||0)}</Tag>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, flexShrink:0 }}>
                    <div style={{ textAlign:"center" }}><Num color={ic} size={30}>{idea.viral||0}</Num><div style={{ fontSize:7, color:C.dim, fontWeight:700, letterSpacing:"0.1em", marginTop:2 }}>VIRAL</div></div>
                    <div style={{ textAlign:"center" }}><Num color={C.orange} size={24}>{idea.hookScore||0}</Num><div style={{ fontSize:7, color:C.dim, fontWeight:700, letterSpacing:"0.1em", marginTop:2 }}>HOOK</div></div>
                  </div>
                </Row>
                {idea.verdict && <div style={{ background:`${ic}09`, border:`1px solid ${ic}22`, borderRadius:10, padding:"9px 11px", marginBottom:10 }}><div style={{ fontSize:11, color:C.textMed, lineHeight:1.55 }}>{idea.verdict}</div></div>}
                {expanded===idea.id && (
                  <>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:10 }}>
                      <div style={{ background:C.cardAlt, borderRadius:9, padding:"9px 10px" }}><SLabel color={ic} mb={4}>VIRALITY</SLabel><div style={{ fontSize:11, color:C.textMed, lineHeight:1.5 }}>{idea.viralReason||"Strong concept with broad appeal."}</div></div>
                      <div style={{ background:C.cardAlt, borderRadius:9, padding:"9px 10px" }}><SLabel color={C.orange} mb={4}>HOOK FEEDBACK</SLabel><div style={{ fontSize:11, color:C.textMed, lineHeight:1.5 }}>{idea.hookFeedback||"Strong opening."}</div></div>
                    </div>
                    {idea.improvedHook && <div style={{ background:`${C.green}09`, border:`1px solid ${C.green}22`, borderRadius:9, padding:"9px 11px", marginBottom:10 }}><SLabel color={C.green} mb={4}>IMPROVED HOOK</SLabel><div style={{ fontSize:12, color:C.text, fontStyle:"italic", lineHeight:1.5 }}>"{idea.improvedHook}"</div></div>}
                    {idea.recs && <div style={{ background:C.cardAlt, borderRadius:10, padding:"10px 12px", marginBottom:10 }}><SLabel mb={8}>RECOMMENDATIONS</SLabel>{idea.recs.map((r,ri)=>(<div key={ri} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:ri<idea.recs.length-1?7:0 }}><div style={{ width:6, height:6, borderRadius:"50%", background:r.impact==="HIGH"?C.green:C.yellow, flexShrink:0, marginTop:4 }} /><div style={{ fontSize:11, color:C.textMed, lineHeight:1.4, flex:1 }}>{r.a}</div><Tag color={r.impact==="HIGH"?C.green:C.yellow}>{r.impact}</Tag></div>))}</div>}
                  </>
                )}
                <div style={{ height:2, background:"rgba(255,255,255,0.06)", borderRadius:2, marginBottom:10 }}><div style={{ height:"100%", width:`${idea.viral||0}%`, background:`linear-gradient(90deg,${ic}50,${ic})`, borderRadius:2 }} /></div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  <ActionBtn color={C.purple} onClick={()=>scoreIdea&&scoreIdea(idea)} disabled={aiLoad&&aiLoad["s"+idea.id]}>{aiLoad&&aiLoad["s"+idea.id]?"SCORING...":idea.viral?"RE-SCORE":"SCORE"}</ActionBtn>
                  <ActionBtn color={C.pink} onClick={()=>genCaption&&genCaption(idea)}>CAPTION</ActionBtn>
                  <ActionBtn color={C.cyan} onClick={()=>{ setSub("CALENDAR"); openModal&&openModal("addCal"); }}>SCHEDULE</ActionBtn>
                  <ActionBtn color={C.yellow} onClick={()=>{ setEditIdeaTarget&&setEditIdeaTarget(idea); setModals&&setModals(m=>({...m,editIdea:true})); }}>EDIT</ActionBtn>
                  <button onClick={()=>setExpanded(expanded===idea.id?null:idea.id)} style={{ padding:"5px 10px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, fontSize:10, fontWeight:700, color:C.dim, cursor:"pointer", letterSpacing:"0.04em" }}>{expanded===idea.id?"LESS ▲":"MORE ▼"}</button>
                  <IconBtn icon={I.trash(12,C.pink)} color={C.pink} onClick={()=>setIdeas(is=>is.filter(x=>x.id!==idea.id))} />
                </div>
              </Glass>
            );
          })}
        </>
      )}
      {sub==="CALENDAR" && (
        <>
          <SectionHead title="CONTENT CALENDAR" action={()=>openModal&&openModal("addCal")} actionColor={C.cyan} />
          <div style={{ display:"flex", gap:5, marginBottom:4, flexWrap:"wrap" }}>
            {["ALL","TIKTOK","INSTAGRAM","BOTH"].map(p=><Pill key={p} active={calFilter===p} color={C.cyan} onClick={()=>setCalFilter(p)}>{p}</Pill>)}
          </div>
          {filteredCal.map(c=>(
            <Glass key={c.id} style={{ padding:"13px 14px" }}>
              <Row>
                <div style={{ flex:1, marginRight:10 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:7, lineHeight:1.3 }}>{c.title}</div>
                  <div style={{ display:"flex", gap:5 }}><Tag color={C.cyan}>{c.date.slice(5)}</Tag><Tag color={C.dim}>{c.platform.toUpperCase()}</Tag></div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ padding:"4px 10px", borderRadius:7, background:`${c.statusColor||C.dim}18`, border:`1px solid ${c.statusColor||C.dim}30`, fontSize:9, fontWeight:700, color:c.statusColor||C.dim, letterSpacing:"0.08em" }}>{c.status}</div>
                  <IconBtn icon={I.trash(12,C.pink)} color={C.pink} onClick={()=>setCalItems(cs=>cs.filter(x=>x.id!==c.id))} />
                </div>
              </Row>
            </Glass>
          ))}
        </>
      )}
      {sub==="CAPTIONS" && (
        <>
          <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em", color:C.text, marginBottom:14 }}>CAPTION GENERATOR</div>
          <Glass style={{ padding:"14px" }}>
            <SLabel mb={10}>TAP AN IDEA TO GENERATE</SLabel>
            {ideas.slice(0,6).map((idea,i)=>(
              <div key={idea.id} onClick={()=>genCaption&&genCaption(idea)} style={{ padding:"10px 12px", borderRadius:11, background:captionIdea?.id===idea.id?`${C.pink}18`:`${C.pink}08`, border:`1px solid ${captionIdea?.id===idea.id?C.pink:C.pink+"18"}`, fontSize:12, fontWeight:600, color:C.text, cursor:"pointer", marginBottom:i<Math.min(ideas.length,6)-1?7:0, lineHeight:1.3, transition:"all 0.15s" }}>
                {idea.title?.slice(0,50)}{(idea.title?.length||0)>50?"...":""}
              </div>
            ))}
          </Glass>
          {aiLoad&&aiLoad.caption && <Glass style={{ padding:"24px", textAlign:"center" }}><div style={{ color:C.dim, fontSize:12 }}>Writing captions...</div></Glass>}
          {captionResult && captionIdea && (
            <>
              <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.12em", fontWeight:700 }}>CAPTIONS FOR: {captionIdea.title?.slice(0,40)?.toUpperCase()}</div>
              <Glass style={{ padding:"14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ width:28, height:28, borderRadius:9, background:`${C.pink}18`, border:`1px solid ${C.pink}28`, display:"flex", alignItems:"center", justifyContent:"center", color:C.pink, flexShrink:0 }}>{I.tt(14,C.pink)}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, flex:1 }}>TikTok Caption</div>
                  <ActionBtn color={copied&&copied.ttCap?C.green:C.pink} onClick={()=>copyText&&copyText("ttCap",(captionResult.tiktok?.caption||"")+" "+(captionResult.tiktok?.hashtags||[]).map(h=>"#"+h).join(" "))}>{copied&&copied.ttCap?"COPIED":"COPY"}</ActionBtn>
                </div>
                <div style={{ fontSize:13, color:C.text, lineHeight:1.8, marginBottom:10 }}>{captionResult.tiktok?.caption}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:captionResult.tiktok?.altCaption?10:0 }}>
                  {(captionResult.tiktok?.hashtags||[]).map(h=><Tag key={h} color={C.pink}>#{h}</Tag>)}
                </div>
                {captionResult.tiktok?.altCaption && <div style={{ background:`${C.pink}08`, border:`1px solid ${C.pink}18`, borderRadius:9, padding:"9px 11px", marginTop:10 }}><SLabel color={C.pink} mb={4}>ALT VERSION</SLabel><div style={{ fontSize:12, color:C.textMed }}>{captionResult.tiktok.altCaption}</div></div>}
              </Glass>
              <Glass style={{ padding:"14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ width:28, height:28, borderRadius:9, background:`${C.purple}18`, border:`1px solid ${C.purple}28`, display:"flex", alignItems:"center", justifyContent:"center", color:C.purple, flexShrink:0 }}>{I.ig(14,C.purple)}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, flex:1 }}>Instagram Caption</div>
                  <ActionBtn color={copied&&copied.igCap?C.green:C.purple} onClick={()=>copyText&&copyText("igCap",(captionResult.instagram?.caption||"")+" "+(captionResult.instagram?.hashtags||[]).map(h=>"#"+h).join(" "))}>{copied&&copied.igCap?"COPIED":"COPY"}</ActionBtn>
                </div>
                <div style={{ fontSize:12, color:C.text, lineHeight:1.8, marginBottom:10 }}>{captionResult.instagram?.caption}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {(captionResult.instagram?.hashtags||[]).map(h=><Tag key={h} color={C.purple}>#{h}</Tag>)}
                </div>
              </Glass>
            </>
          )}
        </>
      )}
    </div>
  );
};

const AnalyticsView = ({ videos=[], totalViews=0, avgRatio=0, facecamAvg=0, hookStats=[], analysis, nextVids, weekly, trends, igData, hasIG, igLoad, fetchIG, runAI, aiLoad={}, setUpdateTarget, openModal, deleteVideo, WL={} }) => {
  const [sub, setSub] = useState("TIKTOK");
  const [showPf, setShowPf] = useState(null);
  const fmt = n => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n||0);
  const perfLabel = s => s>=80?"VIRAL":s>=65?"STRONG":s>=50?"DECENT":s>=35?"WEAK":"FLOPPED";
  const perfColor = s => s>=80?C.green:s>=65?C.yellow:s>=50?C.orange:C.pink;
  const rl = v => v.views>0?(v.likes/v.views)*100:0;
  const ps = v => { if(!v._updated||!v.views)return null; const r=rl(v); const sc=Math.round(Math.min(40,r*1.6)+Math.min(40,Math.log10(Math.max(v.views,1))*13)+Math.min(20,(v.views>0?(v.comments||0)/v.views*100:0)*80)); return {score:sc,label:perfLabel(sc)}; };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <SubTabs tabs={["TIKTOK","INSTAGRAM","ANALYSIS","NEXT MOVES"]} active={sub} onChange={setSub} color={C.cyan} />

      {sub==="TIKTOK" && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:`${C.pink}08`, border:`1px solid ${C.pink}20`, borderRadius:14 }}>
            <div style={{ width:28, height:28, borderRadius:9, background:`${C.pink}18`, border:`1px solid ${C.pink}30`, display:"flex", alignItems:"center", justifyContent:"center", color:C.pink, flexShrink:0 }}>{I.tt(14,C.pink)}</div>
            <div><div style={{ fontSize:12, fontWeight:700, color:C.text }}>TikTok -- {WL.handle||"@findkrap"}</div><div style={{ fontSize:9, color:C.dim, marginTop:1 }}>{videos.length} videos</div></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
            <StatMini label="TOTAL VIEWS" value={fmt(totalViews)} color={C.cyan} icon={I.eye(13,C.cyan)} />
            <StatMini label="AVG RATIO" value={avgRatio.toFixed(1)+"%"} color={avgRatio>=5?C.green:C.yellow} icon={I.bar(13,C.green)} />
            <StatMini label="FACECAM AVG" value={fmt(facecamAvg)} color={C.pink} icon={I.vid(13,C.pink)} />
            <StatMini label="VIDEOS" value={videos.length} color={C.purple} icon={I.star(13,C.purple)} />
          </div>
          {hookStats.length>0 && (
            <Glass style={{ padding:"13px 14px" }}>
              <SLabel mb={10}>HOOK TYPE AVG VIEWS</SLabel>
              {hookStats.slice(0,5).map((h,i)=>(
                <div key={h.hook} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:i<4?8:0 }}>
                  <div style={{ fontSize:9, color:i===0?C.yellow:C.dim, fontWeight:700, letterSpacing:"0.06em", width:90, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {i===0&&<span style={{ color:C.yellow, marginRight:4 }}>*</span>}{h.hook.toUpperCase()}
                  </div>
                  <div style={{ flex:1, height:7, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(h.avg/hookStats[0].avg)*100}%`, background:i===0?`linear-gradient(90deg,${C.yellow}80,${C.yellow})`:`${C.pink}60`, borderRadius:4 }} />
                  </div>
                  <div style={{ fontSize:11, fontWeight:400, fontFamily:C.fontHead, color:i===0?C.yellow:C.text, width:36, textAlign:"right" }}>{fmt(h.avg)}</div>
                </div>
              ))}
            </Glass>
          )}
          {videos.length===0
            ? <Glass style={{ padding:"28px", textAlign:"center" }}><div style={{ color:C.dim, fontSize:11 }}>NO VIDEOS -- Log a video or wait for Apify to auto-scrape</div></Glass>
            : videos.map((v,i)=>{
              const r=rl(v); const perf=ps(v);
              return (
                <Glass key={v.id||i} style={{ overflow:"hidden" }}>
                  <div style={{ padding:"13px 14px" }}>
                    <Row style={{ marginBottom:8, alignItems:"flex-start", gap:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:6 }}>
                          {i===0&&<span style={{ color:C.yellow, marginRight:4 }}>*</span>}{v.title}
                        </div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          <Tag color={C.pink}>{v.type||"video"}</Tag>
                          <Tag color={C.cyan}>{v.hook||"organic"}</Tag>
                          {v.crossPost&&<Tag color={C.purple}>TT+IG</Tag>}
                          {perf&&<Tag color={perfColor(perf.score)}>{perf.label}</Tag>}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                        <button onClick={()=>{ setUpdateTarget&&setUpdateTarget(v); openModal&&openModal("updateVideo"); }} style={{ padding:"5px 9px", borderRadius:8, background:`${C.cyan}18`, border:`1px solid ${C.cyan}35`, color:C.cyan, cursor:"pointer", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                          {I.refresh(12,C.cyan)}<span>24H</span>
                        </button>
                        <IconBtn icon={I.trash(12,C.pink)} color={C.pink} onClick={()=>deleteVideo&&deleteVideo(v.id)} />
                      </div>
                    </Row>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                      {[{l:"VIEWS",v:fmt(v.views),c:C.cyan},{l:"LIKES",v:fmt(v.likes),c:C.pink},{l:"RATIO",v:r.toFixed(1)+"%",c:r>=10?C.green:r>=5?C.yellow:C.orange}].map((s,j)=>(
                        <div key={j} style={{ textAlign:"center", padding:"7px 6px", background:`${s.c}08`, borderRadius:8, border:`1px solid ${s.c}15` }}>
                          <div style={{ fontSize:15, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
                          <div style={{ fontSize:7, color:C.dim, fontWeight:700, letterSpacing:"0.1em", marginTop:3 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {perf && (
                    <div style={{ background:`linear-gradient(135deg,${perfColor(perf.score)}08,transparent)`, borderTop:`1px solid ${C.border}`, padding:"12px 14px" }}>
                      <Row style={{ marginBottom:10 }}>
                        <SLabel color={perfColor(perf.score)} mb={0}>24HR PERFORMANCE</SLabel>
                        <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
                          <Num color={perfColor(perf.score)} size={26}>{perf.score}</Num>
                          <span style={{ fontSize:9, color:C.dim }}>/100</span>
                        </div>
                      </Row>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                        {[{l:"VIEWS",v:fmt(v.views),c:C.cyan},{l:"RATIO",v:r.toFixed(1)+"%",c:C.green},{l:"COMMENTS",v:v.comments||0,c:C.purple},{l:"SHARES",v:v.shares||0,c:C.yellow}].map((s,j)=>(
                          <div key={j} style={{ textAlign:"center", padding:"7px 5px", background:C.card, borderRadius:8 }}>
                            <div style={{ fontSize:13, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
                            <div style={{ fontSize:7, color:C.dim, fontWeight:700, letterSpacing:"0.08em", marginTop:3 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Glass>
              );
            })
          }
        </>
      )}

      {sub==="INSTAGRAM" && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:`${C.purple}08`, border:`1px solid ${C.purple}20`, borderRadius:14 }}>
            <div style={{ width:28, height:28, borderRadius:9, background:`${C.purple}18`, border:`1px solid ${C.purple}30`, display:"flex", alignItems:"center", justifyContent:"center", color:C.purple, flexShrink:0 }}>{I.ig(14,C.purple)}</div>
            <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:700, color:C.text }}>Instagram -- {WL.handle||"@findkrap"}</div><div style={{ fontSize:9, color:C.dim, marginTop:1 }}>Live data</div></div>
            {hasIG&&<button onClick={fetchIG} style={{ padding:"5px 12px", borderRadius:8, background:`${C.purple}18`, border:`1px solid ${C.purple}30`, color:C.purple, fontFamily:C.fontBody, fontWeight:700, fontSize:10, cursor:"pointer" }}>{igLoad?"LOADING...":"REFRESH"}</button>}
          </div>
          {igData ? (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                <StatMini label="FOLLOWERS" value={fmt(igData.profile?.followers_count||0)} color={C.purple} icon={I.ig(13,C.purple)} />
                <StatMini label="AVG LIKES" value={fmt(igData.media?.length?Math.round(igData.media.reduce((s,p)=>s+(p.like_count||0),0)/igData.media.length):0)} color={C.pink} icon={I.heart(13,C.pink)} />
                <StatMini label="AVG REEL VIEWS" value={(()=>{const r=(igData.media||[]).filter(p=>p.media_type==="VIDEO");return fmt(r.length?Math.round(r.reduce((s,p)=>s+(p.video_views||p.plays||0),0)/r.length):0);})()} color={C.cyan} icon={I.eye(13,C.cyan)} />
                <StatMini label="TOTAL POSTS" value={igData.profile?.media_count||0} color={C.yellow} icon={I.bar(13,C.yellow)} />
              </div>
              {igData.media?.map((p,i)=>(
                <Glass key={p.id||i} style={{ padding:"13px 14px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:8 }}>{p.caption?.slice(0,80)||"No caption"}{(p.caption?.length||0)>80?"...":""}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:8 }}>
                    {[{l:"VIEWS",v:fmt(p.video_views||p.plays||p.reach||0),c:C.cyan},{l:"LIKES",v:p.like_count||0,c:C.pink},{l:"COMMENTS",v:p.comments_count||0,c:C.purple}].map((s,j)=>(
                      <div key={j} style={{ textAlign:"center", padding:"7px 6px", background:`${s.c}08`, borderRadius:8, border:`1px solid ${s.c}15` }}>
                        <div style={{ fontSize:15, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
                        <div style={{ fontSize:7, color:C.dim, fontWeight:700, letterSpacing:"0.1em", marginTop:3 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:5 }}><Tag color={C.purple}>{p.media_type||"POST"}</Tag><Tag color={C.dim}>{(p.timestamp||"").slice(5,10)}</Tag></div>
                </Glass>
              ))}
            </>
          ) : (
            <Glass style={{ padding:"28px", textAlign:"center" }}>
              <div style={{ color:C.dim, fontSize:12, marginBottom:12 }}>{hasIG?"Loading Instagram data...":"Add your Instagram token in Settings to see live stats."}</div>
              {!hasIG&&<button onClick={()=>{}} style={{ padding:"8px 16px", borderRadius:10, border:"none", background:`${C.purple}18`, color:C.purple, fontFamily:C.fontBody, fontWeight:700, cursor:"pointer", fontSize:11 }}>GO TO SETTINGS</button>}
            </Glass>
          )}
        </>
      )}

      {sub==="ANALYSIS" && (
        <>
          <Row style={{ marginBottom:4 }}>
            <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em", color:C.text }}>ANALYSIS</div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>runAI&&runAI("analysis")} disabled={aiLoad.analysis} style={{ padding:"6px 14px", borderRadius:10, border:"none", background:C.cyan+"20", color:C.cyan, fontFamily:C.fontBody, fontWeight:700, cursor:"pointer", fontSize:11, opacity:aiLoad.analysis?0.5:1 }}>{aiLoad.analysis?"RUNNING...":"RUN ANALYSIS"}</button>
              <button onClick={()=>runAI&&runAI("weekly")} disabled={aiLoad.weekly} style={{ padding:"6px 14px", borderRadius:10, border:"none", background:C.yellow+"20", color:C.yellow, fontFamily:C.fontBody, fontWeight:700, cursor:"pointer", fontSize:11, opacity:aiLoad.weekly?0.5:1 }}>{aiLoad.weekly?"...":"HARLEY BRIEF"}</button>
            </div>
          </Row>
          {analysis ? (
            <Glass style={{ padding:"14px" }}>
              <SLabel color={C.cyan} mb={12}>WHAT'S WORKING</SLabel>
              {(analysis.whatIsWorking||[]).map((a,i)=>(
                <div key={i} style={{ marginBottom:i<(analysis.whatIsWorking.length-1)?10:0, padding:"11px 12px", borderRadius:12, background:`${a.impact==="high"?C.green:C.cyan}08`, border:`1px solid ${a.impact==="high"?C.green:C.cyan}20` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:a.impact==="high"?C.green:C.cyan, marginBottom:5 }}>{a.insight}</div>
                  <div style={{ fontSize:11, color:C.textMed, lineHeight:1.6 }}>{a.evidence}</div>
                </div>
              ))}
              {(analysis.whatIsNotWorking||[]).length>0&&(
                <>
                  <SLabel color={C.orange} mb={10} style={{ marginTop:14 }}>NEEDS FIXING</SLabel>
                  {analysis.whatIsNotWorking.map((a,i)=>(
                    <div key={i} style={{ marginBottom:i<(analysis.whatIsNotWorking.length-1)?10:0, padding:"11px 12px", borderRadius:12, background:`${C.orange}08`, border:`1px solid ${C.orange}20` }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.orange, marginBottom:5 }}>{a.insight}</div>
                      <div style={{ fontSize:11, color:C.textMed, lineHeight:1.5 }}>{a.evidence}</div>
                      {a.fix&&<div style={{ fontSize:10, color:C.green, fontWeight:600, marginTop:5 }}>Fix: {a.fix}</div>}
                    </div>
                  ))}
                </>
              )}
            </Glass>
          ) : <Glass style={{ padding:"28px", textAlign:"center" }}><div style={{ color:C.dim, fontSize:11 }}>Run analysis to see insights about your content.</div></Glass>}
          {weekly&&(
            <Glass style={{ padding:"14px" }}>
              <SLabel color={C.yellow} mb={10}>HARLEY BRIEF</SLabel>
              <div style={{ fontSize:12, color:C.textMed, lineHeight:1.8, marginBottom:10 }}>{weekly.harleyBrief||weekly.rawSummaryText}</div>
            </Glass>
          )}
        </>
      )}

      {sub==="NEXT MOVES" && (
        <>
          <Row style={{ marginBottom:4 }}>
            <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em", color:C.text }}>NEXT MOVES</div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>runAI&&runAI("nextVids")} disabled={aiLoad.nextVids} style={{ padding:"6px 14px", borderRadius:10, border:"none", background:C.green+"20", color:C.green, fontFamily:C.fontBody, fontWeight:700, cursor:"pointer", fontSize:11, opacity:aiLoad.nextVids?0.5:1 }}>{aiLoad.nextVids?"RUNNING...":"GET RECOMMENDATIONS"}</button>
              <button onClick={()=>runAI&&runAI("trends")} disabled={aiLoad.trends} style={{ padding:"6px 14px", borderRadius:10, border:"none", background:C.orange+"20", color:C.orange, fontFamily:C.fontBody, fontWeight:700, cursor:"pointer", fontSize:11, opacity:aiLoad.trends?0.5:1 }}>{aiLoad.trends?"...":"TRENDS"}</button>
            </div>
          </Row>
          {nextVids?.tiktok?.length>0&&(
            <Glass style={{ padding:"14px" }}>
              <SLabel color={C.pink} mb={12}>TIKTOK IDEAS</SLabel>
              {nextVids.tiktok.map((v,i)=>(
                <div key={i} style={{ marginBottom:i<nextVids.tiktok.length-1?12:0, padding:"12px", borderRadius:12, background:`${C.pink}07`, border:`1px solid ${C.pink}18` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:6 }}>{v.title}</div>
                  <div style={{ fontSize:10, color:C.dim, lineHeight:1.5, marginBottom:6 }}>{v.whyItWillWork}</div>
                  <div style={{ display:"flex", gap:5 }}><Tag color={C.pink}>{v.type||"TT"}</Tag><Tag color={C.cyan}>{v.hook||"organic"}</Tag></div>
                  {v.openingLine&&<div style={{ marginTop:8, padding:"7px 10px", background:`${C.green}09`, borderRadius:8, fontSize:11, color:C.text, fontStyle:"italic" }}>"{v.openingLine}"</div>}
                </div>
              ))}
            </Glass>
          )}
          {nextVids?.songkranAngle&&(
            <Glass style={{ padding:"14px", border:`1px solid ${C.orange}30` }}>
              <SLabel color={C.orange} mb={8}>SONGKRAN ANGLE</SLabel>
              <div style={{ fontSize:12, color:C.textMed, lineHeight:1.7 }}>{nextVids.songkranAngle}</div>
            </Glass>
          )}
          {trends?.trends?.length>0&&(
            <Glass style={{ padding:"14px" }}>
              <SLabel color={C.orange} mb={12}>TRENDING NOW</SLabel>
              {trends.trends.map((t,i)=>(
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 0", borderBottom:i<trends.trends.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ fontSize:16 }}>{i===0?"🔥":i===1?"📈":"🗓"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.text, marginBottom:3 }}>{t.trend}</div>
                    <div style={{ fontSize:10, color:C.dim, lineHeight:1.4 }}>{t.tiktokAngle}</div>
                  </div>
                </div>
              ))}
            </Glass>
          )}
          {!nextVids&&!trends&&<Glass style={{ padding:"28px", textAlign:"center" }}><div style={{ color:C.dim, fontSize:11 }}>Tap GET RECOMMENDATIONS to get AI-powered content ideas.</div></Glass>}
        </>
      )}
    </div>
  );
};
const TasksView = ({ tasks, setTasks, appIdeas, setAppIdeas }) => {
  const [sub, setSub] = useState("TO DO");
  const [taskInput, setTaskInput] = useState("");
  const [assign, setAssign] = useState("BOTH");
  const [ideaInput, setIdeaInput] = useState("");
  const pending = tasks.filter(t=>!t.done);
  const done = tasks.filter(t=>t.done);
  const ac = a => a==="HARLEY"?C.cyan:a==="BOTH"?C.yellow:C.pink;
  const addTask = () => { if(!taskInput.trim()) return; setTasks(ts=>[{id:Date.now(),text:taskInput.trim(),assignee:assign,done:false},...ts]); setTaskInput(""); };
  const addIdea = () => { if(!ideaInput.trim()) return; setAppIdeas(is=>[{id:Date.now(),text:ideaInput.trim(),score:Math.floor(Math.random()*30+65),verdict:"Added! Looks promising.",impact:"HIGH",effort:"MEDIUM"},...is]); setIdeaInput(""); };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <SubTabs tabs={["TO DO","APP IDEAS"]} active={sub} onChange={setSub} color={C.yellow} />
      {sub==="TO DO" && (
        <>
          <SectionHead title={`TASKS (${pending.length})`} action={()=>{}} actionColor={C.yellow} />
          <div style={{ display:"flex", gap:6, marginBottom:4 }}>
            {["ALL","BK","HARLEY","BOTH"].map(a=><Pill key={a} active={a==="ALL"} color={C.yellow} onClick={()=>{}}>{a}</Pill>)}
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <input value={taskInput} onChange={e=>setTaskInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Add a task..." style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"8px 12px", fontSize:16, fontFamily:C.fontBody, outline:"none" }} />
            <div style={{ display:"flex", gap:3, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:3 }}>
              {["BK","H","BOTH"].map(a=><button key={a} onClick={()=>setAssign(a==="H"?"HARLEY":a)} style={{ padding:"4px 8px", borderRadius:7, border:"none", background:assign===(a==="H"?"HARLEY":a)?C.yellow:"transparent", color:"#fff", fontFamily:C.fontBody, fontSize:10, fontWeight:700, cursor:"pointer", opacity:assign===(a==="H"?"HARLEY":a)?1:0.5 }}>{a}</button>)}
            </div>
            <button onClick={addTask} style={{ padding:"8px 14px", borderRadius:10, border:"none", background:C.yellow, color:"#07050F", fontFamily:C.fontBody, fontWeight:700, cursor:"pointer" }}>+</button>
          </div>
          <Glass style={{ padding:"14px" }}>
            {pending.length===0 ? <div style={{ color:C.dim, fontSize:11, textAlign:"center" }}>NO TASKS -- YOU ARE CLEAR</div> : pending.map((t,i)=>(
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<pending.length-1?`1px solid ${C.border}`:"none" }}>
                <button onClick={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:true}:x))} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${C.pink}`, background:"transparent", cursor:"pointer", flexShrink:0 }} />
                <div style={{ flex:1, color:C.text, fontSize:12, fontWeight:600, lineHeight:1.4 }}>{t.text}</div>
                <Tag color={ac(t.assignee)}>{t.assignee}</Tag>
                <IconBtn icon={I.trash(12,C.pink)} color={C.pink} onClick={()=>setTasks(ts=>ts.filter(x=>x.id!==t.id))} />
              </div>
            ))}
          </Glass>
          {done.length>0 && (
            <>
              <SLabel color={C.dim}>COMPLETED ({done.length})</SLabel>
              <Glass style={{ padding:"14px" }}>
                {done.map((t,i)=>(
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<done.length-1?`1px solid ${C.border}`:"none", opacity:0.5 }}>
                    <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${C.green}`, background:`${C.green}22`, flexShrink:0 }} />
                    <div style={{ flex:1, color:C.dim, fontSize:12, textDecoration:"line-through" }}>{t.text}</div>
                    <Tag color={C.dim}>{t.assignee}</Tag>
                  </div>
                ))}
              </Glass>
            </>
          )}
        </>
      )}
      {sub==="APP IDEAS" && (
        <>
          <SectionHead title={`APP IDEAS (${appIdeas.length})`} action={()=>{}} actionColor={C.purple} />
          <div style={{ display:"flex", gap:8 }}>
            <input value={ideaInput} onChange={e=>setIdeaInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIdea()} placeholder="Add a feature idea..." style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"8px 12px", fontSize:16, fontFamily:C.fontBody, outline:"none" }} />
            <button onClick={addIdea} style={{ padding:"8px 14px", borderRadius:10, border:"none", background:C.purple, color:"#fff", fontFamily:C.fontBody, fontWeight:700, cursor:"pointer" }}>+</button>
          </div>
          {appIdeas.map(idea=>(
            <Glass key={idea.id} glow={idea.score>=70?C.cyan:undefined} style={{ padding:"14px" }}>
              <Row style={{ marginBottom:8, alignItems:"flex-start", gap:8 }}>
                <div style={{ flex:1 }}><div style={{ color:C.text, fontSize:13, fontWeight:600, lineHeight:1.4 }}>{idea.text}</div></div>
                <div style={{ textAlign:"center", flexShrink:0 }}><Num color={idea.score>=70?C.green:idea.score>=50?C.yellow:C.pink} size={26}>{idea.score}</Num><div style={{ color:C.dim, fontSize:7, fontWeight:700, letterSpacing:"0.1em" }}>SCORE</div></div>
              </Row>
              {idea.verdict && <div style={{ background:`${C.cyan}09`, border:`1px solid ${C.cyan}20`, borderRadius:9, padding:"8px 10px", marginBottom:10, fontSize:11, color:C.textMed, lineHeight:1.5 }}>{idea.verdict}</div>}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
                {[{l:"IMPACT",v:idea.impact||"HIGH",c:idea.impact==="HIGH"?C.green:C.yellow},{l:"EFFORT",v:idea.effort||"MEDIUM",c:idea.effort==="LOW"?C.green:idea.effort==="HIGH"?C.pink:C.yellow}].map((s,j)=>(
                  <div key={j} style={{ padding:"7px 8px", background:`${s.c}08`, borderRadius:8, border:`1px solid ${s.c}18`, textAlign:"center" }}><div style={{ fontSize:12, fontWeight:700, color:s.c }}>{s.v}</div><div style={{ fontSize:7, color:C.dim, fontWeight:700, letterSpacing:"0.1em", marginTop:2 }}>{s.l}</div></div>
                ))}
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <ActionBtn color={C.purple} onClick={()=>{}}>SCORE IT</ActionBtn>
                <ActionBtn color={C.yellow} onClick={()=>{}}>EDIT</ActionBtn>
                <ActionBtn color={C.cyan} onClick={()=>{}}>TO DO</ActionBtn>
                <IconBtn icon={I.trash(12,C.pink)} color={C.pink} onClick={()=>setAppIdeas(is=>is.filter(x=>x.id!==idea.id))} />
              </div>
            </Glass>
          ))}
        </>
      )}
    </div>
  );
};

const GrowthView = ({ m, ttViewsDisplay, igData, hasIG, igLoad, fetchIG, scrapedStats, saveManual, setManualData }) => {
  const fmt = n => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n||0);
  return (<div style={{ display:"flex", flexDirection:"column", gap:10 }}>
    <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em", color:C.text }}>GROWTH</div>
    {[{icon:I.tt,label:"TikTok",handle:"@findkrap",tag:scrapedStats?"LIVE":"--",tagC:scrapedStats?C.green:C.dim,border:C.pink,stats:[{l:"FOLLOWERS",v:fmt(m?.tt_followers||0),c:C.pink},{l:"TOTAL LIKES",v:fmt(m?.tt_likes||0),c:C.yellow},{l:"TOTAL VIEWS",v:fmt(ttViewsDisplay||0),c:C.cyan}]},{icon:I.ig,label:"Instagram",handle:"@findkrap",tag:hasIG?"CONNECTED":"ADD KEY",tagC:hasIG?C.green:C.yellow,border:C.purple,stats:[{l:"FOLLOWERS",v:igData?fmt(igData.profile?.followers_count||0):(m?.ig_followers?fmt(m.ig_followers):"--"),c:C.purple},{l:"AVG LIKES",v:igData?.media?.length?fmt(Math.round(igData.media.reduce((s,p)=>s+(p.like_count||0),0)/igData.media.length)):"--",c:C.pink},{l:"AVG VIEWS",v:igData?fmt((()=>{const r=igData.media?.filter(p=>p.media_type==="VIDEO");return r?.length?Math.round(r.reduce((s,p)=>s+(p.video_views||p.plays||0),0)/r.length):0;})()):"--",c:C.cyan}]},{icon:I.map,label:"KrapMaps App",handle:"iOS + Android",tag:"",tagC:C.dim,border:C.green,stats:[{l:"BINS MAPPED",v:fmt(m?.bins||0),c:C.green},{l:"CITIES",v:"1.2K+",c:C.yellow},{l:"DOWNLOADS",v:m?.downloads?fmt(m.downloads):"--",c:C.dim}]}].map((block,bi)=>(
      <Glass key={bi} style={{ padding:"14px", border:`1px solid ${block.border}25` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:`${block.border}18`, border:`1px solid ${block.border}30`, display:"flex", alignItems:"center", justifyContent:"center", color:block.border }}>{block.icon(15,block.border)}</div>
          <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:C.text }}>{block.label}</div><div style={{ fontSize:9, color:C.dim }}>{block.handle}</div></div>
          {block.tag && <Tag color={block.tagC}>{block.tag}</Tag>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
          {block.stats.map((s,si)=>(
            <div key={si} style={{ textAlign:"center", padding:"10px 6px", background:`${s.c}08`, borderRadius:10, border:`1px solid ${s.c}15` }}><Num color={s.c} size={18}>{s.v}</Num><div style={{ fontSize:7, color:C.dim, fontWeight:700, letterSpacing:"0.1em", marginTop:4 }}>{s.l}</div></div>
          ))}
        </div>
      </Glass>
    ))}
  </div>);
};

const SettingsView = ({ keys, onEditKeys, scrapedStats, hasIG, WL }) => {
  return (<div style={{ display:"flex", flexDirection:"column", gap:10 }}>
    <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, letterSpacing:"0.06em", color:C.text }}>SETTINGS</div>
    <Glass style={{ padding:"14px", border:`1px solid ${C.purple}25` }}>
      <SLabel color={C.purple} mb={12}>WHITE LABEL CONFIG</SLabel>
      <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"12px", marginBottom:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          {[{k:"APP NAME",v:WL?.appName||"KrapMaps"},{k:"HANDLE",v:WL?.handle||"@findkrap"},{k:"CREATOR 1",v:WL?.creator1||"Bk"},{k:"CREATOR 2",v:WL?.creator2||"Harley"}].map(({k,v})=>(
            <div key={k}><SLabel color={C.dim} mb={3}>{k}</SLabel><div style={{ fontSize:12, fontWeight:600, color:C.text }}>{v}</div></div>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:22, height:22, borderRadius:7, background:C.pink, border:"1px solid rgba(255,255,255,0.2)", flexShrink:0 }} />
          <div style={{ fontSize:11, fontFamily:C.fontMono, color:C.text }}>{C.pink}</div>
          <Tag color={C.purple}>ACCENT</Tag>
        </div>
      </div>
    </Glass>
    <Glass style={{ padding:"14px" }}>
      <SLabel mb={12}>API KEYS</SLabel>
      {[{label:"ANTHROPIC API",desc:"AI scoring + captions",status:"CONNECTED",color:C.green},{label:"SUPABASE",desc:"Database + sync",status:"CONNECTED",color:C.green},{label:"APIFY TOKEN",desc:"TikTok auto-scraper",status:"CONNECTED",color:C.green},{label:"INSTAGRAM TOKEN",desc:"IG stats + media",status:"ADD KEY",color:C.yellow},{label:"APP STORE CONNECT",desc:"iOS download stats",status:"NOT SET",color:C.dim},{label:"GOOGLE PLAY API",desc:"Android download stats",status:"NOT SET",color:C.dim}].map((k,i,arr)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
          <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600, color:C.text }}>{k.label}</div><div style={{ fontSize:9, color:C.dim, marginTop:2 }}>{k.desc}</div></div>
          <Tag color={k.color}>{k.status}</Tag>
        </div>
      ))}
    </Glass>
    <Glass style={{ padding:"14px" }}>
      <SLabel mb={12}>AUTOMATION</SLabel>
      {[{label:"Last scraper run",value:"synced just now",color:C.green},{label:"Schedule",value:"Every 6 hours",color:C.cyan},{label:"Apify actor",value:"clockworks/tiktok-scraper",color:C.dim},{label:"Auto-log new videos",value:"ENABLED",color:C.green},{label:"Auto 24hr update",value:"ENABLED",color:C.green}].map((r,i,arr)=>(
        <Row key={i} style={{ padding:"8px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
          <div style={{ fontSize:11, color:C.textMed }}>{r.label}</div>
          <div style={{ fontSize:11, fontWeight:700, color:r.color, letterSpacing:"0.03em" }}>{r.value}</div>
        </Row>
      ))}
    </Glass>
  </div>);
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

const DEFAULT_SB_URL = "https://xiudsyiinkqtmowkiqxh.supabase.co";
const ANTHROPIC_KEY  = "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";
const DEFAULT_SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWRzeWlpbmtxdG1vd2tpcXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTcwNTMsImV4cCI6MjA1ODMzMzA1M30.xh1I8a8TUrPZ3YtElqCHv9LjI27BnCDp_YY-J_FDBDU";

const WL = {
  appName:"KrapMaps", handle:"@findkrap",
  creator1:"Bk", creator2:"Harley",
  accentColor:C.pink, bg:C.bg,
};

const HOOK_TYPES  = ["edgy/controversial","problem->solution","gamification","achievement","reaction","challenge","pov","tutorial"];
const VIDEO_TYPES = ["facecam","street","screencap","voiceover","mixed"];
const STATUSES    = ["idea","scripted","filming","editing","scheduled","posted"];
const STATUS_C    = { idea:C.dim, scripted:C.purple, filming:C.yellow, editing:C.cyan, scheduled:C.green, posted:C.orange };

const loadJSON  = (k,fb) => { try { return JSON.parse(localStorage.getItem(k))||fb; } catch { return fb; } };
const saveJSON  = (k,d)  => { try { localStorage.setItem(k,JSON.stringify(d)); } catch {} };
const getSbUrl  = () => localStorage.getItem(SB_URL_KEY) || DEFAULT_SB_URL;
const getSbKey  = () => localStorage.getItem(SB_KEY_KEY) || DEFAULT_SB_KEY;
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
const sbFetch = async (table,filter="") => {
  try {
    const r = await fetch(`${getSbUrl()}/rest/v1/${table}?${filter}&limit=1000`,{ headers:{ apikey:getSbKey(),"Authorization":"Bearer "+getSbKey(),"Content-Type":"application/json" } });
    if(!r.ok) return null;
    return r.json();
  } catch { return null; }
};
const sbUpsert = async (table,data) => {
  try {
    await fetch(`${getSbUrl()}/rest/v1/${table}`,{ method:"POST", headers:{ apikey:getSbKey(),"Authorization":"Bearer "+getSbKey(),"Content-Type":"application/json","Prefer":"resolution=merge-duplicates" }, body:JSON.stringify(data) });
  } catch {}
};

// ── AI ────────────────────────────────────────────────────────────
const SYSTEM = `You are the growth strategist for KrapMaps, a community-driven public bin mapping app on iOS and Android across 1,200+ cities. It has gamification (points, streaks, mini-games: Bin Catcher, Bin Lob, Bin Guesser), Team Crimson vs Azure competitions, and a mascot Krap the Snow Monkey. Content team: Harley films in Thailand, Bk edits in UK. Best TikTok formula: Problem -> struggle -> KrapMaps saves the day -> satisfied reaction. Respond ONLY with valid JSON.`;

async function callAI(prompt, maxTokens=2000) {
  const r = await fetch("/api/anthropic", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, system:SYSTEM, messages:[{ role:"user", content:prompt }] })
  });
  const d = await r.json();
  const text = d.content?.map(b=>b.text||"").join("") || "";
  const clean = text.replace(/```json|```/g,"").trim();
  return JSON.parse(clean);
}

// ── NAV ───────────────────────────────────────────────────────────
const NAV = [
  { id:"home",      label:"HOME",      ic:I.home      },
  { id:"content",   label:"CONTENT",   ic:I.write     },
  { id:"analytics", label:"ANALYTICS", ic:I.bar       },
  { id:"tasks",     label:"TASKS",     ic:I.check     },
  { id:"growth",    label:"GROWTH",    ic:I.rocket    },
  { id:"settings",  label:"SETTINGS",  ic:I.settings  },
];

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ keys, onEditKeys }) {
  const isPhone = typeof window!=="undefined" && window.innerWidth < 520;

  // ── STATE ──────────────────────────────────────────────────────
  const [nav, setNav]   = useState("home");
  const [sub, setSub]   = useState(null);
  const [aiErr, setAiErr] = useState(null);

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
  const [statsError, setStatsError] = useState(null);

  const [igData, setIgData]   = useState(null);
  const [igLoad, setIgLoad]   = useState(false);
  const hasIG = !!(keys?.ig);

  const [aiLoad, setAiLoad]   = useState({});
  const [captionResult, setCaptionResult] = useState(null);
  const [captionIdea, setCaptionIdea]     = useState(null);
  const [copied, setCopied]               = useState({});

  const [modals, setModals]   = useState({});
  const [updateTarget, setUpdateTarget]   = useState(null);
  const [editIdeaTarget, setEditIdeaTarget]       = useState(null);
  const [editAppIdeaTarget, setEditAppIdeaTarget] = useState(null);

  const openModal  = (id,data) => { setModals(m=>({...m,[id]:true})); };
  const closeModal = (id)      => { setModals(m=>({...m,[id]:false})); };

  const m = manualData;

  // ── PERSIST TO LOCALSTORAGE ────────────────────────────────────
  useEffect(()=>{ saveJSON(VIDEOS_KEY,videos); },[videos]);
  useEffect(()=>{ saveJSON(IDEAS_KEY,ideas); },[ideas]);
  useEffect(()=>{ saveJSON(CAL_KEY,calItems); },[calItems]);
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
        // Load videos from km_videos
        const vids = await sbFetch("km_videos","select=*&order=created_at.desc");
        if(vids?.length) {
          setVideos(prev => {
            const merged = [...vids];
            prev.forEach(p=>{ if(!merged.find(v=>v.id===p.id||v.url===p.url)) merged.push(p); });
            return merged;
          });
        }
        // Load scraped stats
        const stats = await sbFetch("km_scraped_stats","select=*&order=scraped_at.desc&limit=1");
        if(stats?.[0]) { setScrapedStats(stats[0]); saveJSON(SCRAPE_KEY,stats[0]); }
      } catch(e) { setStatsError("Sync error"); }
      setSbLoaded(true);
    };
    load();
  },[]);

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

  // ── AI FUNCTIONS ──────────────────────────────────────────────
  const runAI = async (mode) => {
    if(aiLoad[mode]) return;
    setAiLoad(l=>({...l,[mode]:true}));
    setAiErr(null);
    try {
      const vSummary = sortedVideos.slice(0,15).map(v=>({ title:v.title, views:v.views, likes:v.likes, ratio:ratio(v).toFixed(1), type:v.type, hook:v.hook, comments:v.comments||0, shares:v.shares||0 }));
      const prompts = {
        analysis: `Analyse these KrapMaps TikTok videos and return JSON: {"whatIsWorking":[{"insight":"string","evidence":"string","impact":"high|medium"}],"whatIsNotWorking":[{"insight":"string","evidence":"string","fix":"string"}],"topFormat":"string","bestHook":"string"}. Videos: ${JSON.stringify(vSummary)}`,
        nextVids:  `Based on these KrapMaps videos suggest next content. Return JSON: {"tiktok":[{"title":"string","type":"string","hook":"string","whyItWillWork":"string","openingLine":"string","priority":"HIGH|MEDIUM"}],"instagram":[{"concept":"string","contentType":"string","whyItWillWork":"string"}],"songkranAngle":"string"}. Videos: ${JSON.stringify(vSummary)}`,
        weekly:    `Write a brief for Harley (films in Thailand). Return JSON: {"harleyBrief":"2-3 sentence brief","priorities":[{"task":"string","why":"string"}],"rawSummaryText":"WhatsApp-ready message to Harley"}. Videos: ${JSON.stringify(vSummary)}`,
        trends:    `Suggest trending content angles for KrapMaps right now (Songkran season, April 2026). Return JSON: {"trends":[{"trend":"string","urgency":"string","tiktokAngle":"string","instagramAngle":"string"}]}`,
      };
      const r = await callAI(prompts[mode], 3000);
      if(mode==="analysis") setAnalysis(r);
      if(mode==="nextVids") setNextVids(r);
      if(mode==="weekly")   setWeekly(r);
      if(mode==="trends")   setTrends(r);
    } catch(e) { setAiErr("AI error: "+e.message); }
    setAiLoad(l=>({...l,[mode]:false}));
  };

  const scoreIdea = async (idea) => {
    const key = "s"+idea.id;
    setAiLoad(l=>({...l,[key]:true}));
    try {
      const r = await callAI(`Score this KrapMaps content idea. Return JSON: {"viralityScore":0-100,"hookScore":0-100,"verdict":"honest sentence","viralityReason":"string","hookFeedback":"string","improvedHook":"string","recommendations":[{"action":"string","impact":"high|medium"}]}. Idea: "${idea.title}" type:${idea.type} hook:${idea.hook}`, 1000);
      setIdeas(is=>is.map(i=>i.id===idea.id?{...i,aiScore:r,viral:r.viralityScore,hookScore:r.hookScore,verdict:r.verdict,viralReason:r.viralityReason,hookFeedback:r.hookFeedback,improvedHook:r.improvedHook,recs:r.recommendations?.map(x=>({a:x.action,impact:x.impact?.toUpperCase()}))}:i));
    } catch(e) { setAiErr("Score failed: "+e.message); }
    setAiLoad(l=>({...l,[key]:false}));
  };

  const genCaption = async (idea) => {
    setAiLoad(l=>({...l,caption:true}));
    setCaptionIdea(idea);
    setCaptionResult(null);
    try {
      const r = await callAI(`Write captions for KrapMaps TikTok and Instagram for this idea: "${idea.title||idea.text}". Return JSON: {"tiktok":{"caption":"string","hashtags":["string"],"altCaption":"string"},"instagram":{"caption":"string","hashtags":["string"]}}`, 1200);
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
    const v = { ...video, id:video.id||Date.now().toString(), created_at:new Date().toISOString() };
    setVideos(vs=>{
      if(vs.find(x=>x.id===v.id||x.url===v.url)) return vs;
      return [v,...vs];
    });
    await sbUpsert("km_videos",[v]).catch(()=>{});
    closeModal("addVideo");
  };
  const deleteVideo = (id) => setVideos(vs=>vs.filter(v=>v.id!==id));
  const updateVideo = (updated) => { setVideos(vs=>vs.map(v=>v.id===updated.id?{...v,...updated,_updated:true}:v)); closeModal("updateVideo"); };

  // ── COMPUTED ──────────────────────────────────────────────────
  const saveManual = (data) => {
    setManualData(data);
    sbUpsert("km_manual",[{id:1,...data,updated_at:new Date().toISOString()}]).catch(()=>{});
  };

  const sortedVideos  = [...videos].sort((a,b)=>(b.views||0)-(a.views||0));
  const totalViews    = videos.reduce((s,v)=>s+(v.views||0),0);
  const avgRatio      = videos.length ? videos.reduce((s,v)=>s+ratio(v),0)/videos.length : 0;
  const facecamAvg    = (()=>{ const fc=videos.filter(v=>v.type==="facecam"); return fc.length?Math.round(fc.reduce((s,v)=>s+(v.views||0),0)/fc.length):0; })();
  const ttViewsDisplay = totalViews || m.tt_views || 0;
  const hookStats = (()=>{
    const map = {};
    videos.forEach(v=>{ if(!v.hook) return; if(!map[v.hook]) map[v.hook]=[]; map[v.hook].push(v.views||0); });
    return Object.entries(map).map(([hook,arr])=>({ hook, avg:Math.round(arr.reduce((s,x)=>s+x,0)/arr.length) })).sort((a,b)=>b.avg-a.avg);
  })();
  const topIdeas      = [...ideas].sort((a,b)=>(b.viral||0)-(a.viral||0)).slice(0,3);
  const upcomingCal   = calItems.filter(c=>c.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
  const daysToSongkran = getDays("2026-04-13");

  // ── MODALS ─────────────────────────────────────────────────────
  const ModalBase = ({ children, onClose }) => (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 0 0" }}>
      <div style={{ background:"#0F0B1E",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",padding:"20px 18px 36px" }}>
        <div onClick={onClose} style={{ width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)",margin:"0 auto 20px" }} />
        {children}
      </div>
    </div>
  );
  const MLabel = ({children}) => <div style={{ fontSize:9,fontWeight:700,letterSpacing:"0.14em",color:C.dim,marginBottom:5,textTransform:"uppercase" }}>{children}</div>;
  const MInput = ({value,onChange,placeholder,type="text"}) => <input type={type} value={value||""} onChange={onChange} placeholder={placeholder} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }} />;
  const MBtn = ({children,onClick,color=C.pink}) => <button onClick={onClick} style={{ width:"100%",padding:"13px",borderRadius:12,border:"none",background:color,color:"#fff",fontFamily:C.fontBody,fontWeight:700,fontSize:15,cursor:"pointer",marginTop:6 }}>{children}</button>;

  const AddVideoModal = () => {
    const [tab, setTab] = useState("manual");
    const [form, setForm] = useState({ title:"", type:"facecam", hook:"achievement", views:"", likes:"", url:"" });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    return (
      <ModalBase onClose={()=>closeModal("addVideo")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Log Video</div>
        <div style={{ display:"flex",gap:6,marginBottom:16 }}>
          {["manual","scan"].map(t=><button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"8px",borderRadius:10,border:`1px solid ${tab===t?C.pink:C.border}`,background:tab===t?C.pink+"20":"transparent",color:tab===t?C.pink:C.dim,fontFamily:C.fontBody,fontWeight:700,fontSize:11,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em" }}>{t}</button>)}
        </div>
        {tab==="manual" && (
          <>
            <MLabel>Title</MLabel><MInput value={form.title} onChange={set("title")} placeholder="Video title" />
            <MLabel>Type</MLabel>
            <select value={form.type} onChange={set("type")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
              {VIDEO_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <MLabel>Hook</MLabel>
            <select value={form.hook} onChange={set("hook")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
              {HOOK_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <div><MLabel>Views</MLabel><MInput value={form.views} onChange={set("views")} placeholder="0" type="number" /></div>
              <div><MLabel>Likes</MLabel><MInput value={form.likes} onChange={set("likes")} placeholder="0" type="number" /></div>
            </div>
            <MLabel>TikTok URL (optional)</MLabel><MInput value={form.url} onChange={set("url")} placeholder="https://tiktok.com/..." />
            <MBtn onClick={()=>addVideo({ title:form.title,type:form.type,hook:form.hook,views:parseInt(form.views)||0,likes:parseInt(form.likes)||0,url:form.url,date:today() })}>Save Video</MBtn>
          </>
        )}
        {tab==="scan" && (
          <div style={{ textAlign:"center",padding:"20px 0" }}>
            <MLabel>TikTok URL</MLabel>
            <MInput value={form.url} onChange={set("url")} placeholder="https://tiktok.com/..." />
            <div style={{ color:C.dim,fontSize:11,marginBottom:16,lineHeight:1.6 }}>Paste a TikTok URL and we'll log it. Stats auto-update when Apify scrapes.</div>
            <MBtn onClick={()=>addVideo({ title:form.url.split("/").pop()||"TikTok video",type:"facecam",hook:"achievement",views:0,likes:0,url:form.url,date:today() })}>Log URL</MBtn>
          </div>
        )}
      </ModalBase>
    );
  };

  const UpdateVideoModal = () => {
    const v = updateTarget;
    const [form, setForm] = useState({ views:v?.views||"", likes:v?.likes||"", comments:v?.comments||"", shares:v?.shares||"" });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    if(!v) return null;
    return (
      <ModalBase onClose={()=>closeModal("updateVideo")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:4 }}>Update Stats</div>
        <div style={{ color:C.dim,fontSize:11,marginBottom:16,lineHeight:1.4 }}>{v.title?.slice(0,50)}</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          {[["Views","views"],["Likes","likes"],["Comments","comments"],["Shares","shares"]].map(([l,k])=>(
            <div key={k}><MLabel>{l}</MLabel><MInput value={form[k]} onChange={set(k)} placeholder="0" type="number" /></div>
          ))}
        </div>
        <MBtn onClick={()=>updateVideo({ id:v.id,views:parseInt(form.views)||v.views,likes:parseInt(form.likes)||v.likes,comments:parseInt(form.comments)||v.comments||0,shares:parseInt(form.shares)||v.shares||0,_updated:true })}>Save Stats</MBtn>
      </ModalBase>
    );
  };

  const AddIdeaModal = () => {
    const [form, setForm] = useState({ title:"", type:"facecam", hook:"achievement", notes:"" });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    return (
      <ModalBase onClose={()=>closeModal("addIdea")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Add Idea</div>
        <MLabel>Idea Title</MLabel><MInput value={form.title} onChange={set("title")} placeholder="Describe the video idea" />
        <MLabel>Type</MLabel>
        <select value={form.type} onChange={set("type")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
          {VIDEO_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <MLabel>Hook Type</MLabel>
        <select value={form.hook} onChange={set("hook")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
          {HOOK_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <MLabel>Notes (optional)</MLabel><MInput value={form.notes} onChange={set("notes")} placeholder="Extra context..." />
        <MBtn onClick={()=>{ if(!form.title.trim()) return; setIdeas(is=>[{id:Date.now(),title:form.title.trim(),type:form.type,hook:form.hook,notes:form.notes,viral:0,hookScore:0,created:today()},...is]); closeModal("addIdea"); }}>Add Idea</MBtn>
      </ModalBase>
    );
  };

  const EditIdeaModal = () => {
    const idea = editIdeaTarget;
    const [form, setForm] = useState({ title:idea?.title||"", type:idea?.type||"facecam", hook:idea?.hook||"achievement" });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    if(!idea) return null;
    return (
      <ModalBase onClose={()=>closeModal("editIdea")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Edit Idea</div>
        <MLabel>Title</MLabel><MInput value={form.title} onChange={set("title")} placeholder="Idea title" />
        <MLabel>Type</MLabel>
        <select value={form.type} onChange={set("type")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
          {VIDEO_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <MLabel>Hook</MLabel>
        <select value={form.hook} onChange={set("hook")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
          {HOOK_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <MBtn onClick={()=>{ setIdeas(is=>is.map(i=>i.id===idea.id?{...i,...form}:i)); closeModal("editIdea"); }}>Save Changes</MBtn>
      </ModalBase>
    );
  };

  const EditAppIdeaModal = () => {
    const idea = editAppIdeaTarget;
    const [text, setText] = useState(idea?.text||"");
    if(!idea) return null;
    return (
      <ModalBase onClose={()=>closeModal("editAppIdea")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Edit App Idea</div>
        <MLabel>Idea</MLabel>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Feature idea..." rows={4} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",resize:"vertical",marginBottom:12 }} />
        <MBtn onClick={()=>{ setAppIdeas(is=>is.map(i=>i.id===idea.id?{...i,text:text.trim()}:i)); closeModal("editAppIdea"); }}>Save</MBtn>
      </ModalBase>
    );
  };

  const AddCalModal = () => {
    const [form, setForm] = useState({ title:"", date:today(), platform:"TikTok", type:"facecam", status:"idea" });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    return (
      <ModalBase onClose={()=>closeModal("addCal")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Schedule Content</div>
        <MLabel>Title</MLabel><MInput value={form.title} onChange={set("title")} placeholder="Content title" />
        <MLabel>Date</MLabel><MInput value={form.date} onChange={set("date")} type="date" />
        <MLabel>Platform</MLabel>
        <select value={form.platform} onChange={set("platform")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
          {["TikTok","Instagram","Both","YouTube"].map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <MLabel>Status</MLabel>
        <select value={form.status} onChange={set("status")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontBody,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
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
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Update Stats</div>
        {[["TT Followers","tt_followers"],["TT Views","tt_views"],["TT Likes","tt_likes"],["Bins Mapped","bins"],["IG Followers","ig_followers"],["Downloads","downloads"]].map(([l,k])=>(
          <div key={k}><MLabel>{l}</MLabel><MInput value={form[k]||""} onChange={set(k)} placeholder="0" type="number" /></div>
        ))}
        <MBtn onClick={()=>{ saveManual(form); closeModal("editStats"); }}>Save Stats</MBtn>
      </ModalBase>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:C.fontBody, position:"relative" }}>
      <div style={{ position:"fixed", top:"-8%", left:"-12%", width:380, height:380, borderRadius:"50%", background:`radial-gradient(circle,${C.pink}12 0%,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"45%", right:"-12%", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle,${C.cyan}09 0%,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"5%", left:"15%", width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle,${C.purple}09 0%,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />

      <div style={{ maxWidth:390, margin:"0 auto", padding:"16px 14px 92px", position:"relative", zIndex:1 }}>
        {/* HEADER */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:27, fontWeight:900, letterSpacing:"-0.03em", color:C.text, lineHeight:1, fontFamily:C.fontSora }}>
              Krap<span style={{ color:C.pink, textShadow:`0 0 20px ${C.pink}70` }}>Maps</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}` }} />
              <span style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", fontWeight:600 }}>
                {WL.creator1.toUpperCase()} + {WL.creator2.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            <div style={{ background:`${C.pink}14`, border:`1px solid ${C.pink}30`, borderRadius:20, padding:"4px 10px", fontSize:9, fontWeight:700, color:C.pink, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>
              {daysToSongkran}D SONGKRAN
            </div>
            <div style={{ width:40, height:40, borderRadius:13, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 18px ${C.pink}38`, color:"#fff", flexShrink:0 }}>
              {I.bin(18,"#fff")}
            </div>
          </div>
        </div>

        {/* VIEWS */}
        {nav==="home"      && <HomeView ideas={topIdeas} calItems={upcomingCal} setNav={id=>{ setNav(id); setSub(null); }} runAI={runAI} aiLoad={aiLoad} openModal={openModal} ttViewsDisplay={ttViewsDisplay} m={m} daysToSongkran={daysToSongkran} scrapedStats={scrapedStats} statsError={statsError} igData={igData} />}
        {nav==="content"   && <ContentView ideas={ideas} setIdeas={setIdeas} calItems={calItems} setCalItems={setCalItems} scoreIdea={scoreIdea} genCaption={genCaption} aiLoad={aiLoad} captionResult={captionResult} captionIdea={captionIdea} copied={copied} copyText={copyText} openModal={openModal} setEditIdeaTarget={setEditIdeaTarget} setModals={setModals} setSub={setSub} />}
        {nav==="analytics" && <AnalyticsView videos={sortedVideos} totalViews={totalViews} avgRatio={avgRatio} facecamAvg={facecamAvg} hookStats={hookStats} analysis={analysis} nextVids={nextVids} weekly={weekly} trends={trends} igData={igData} hasIG={hasIG} igLoad={igLoad} fetchIG={fetchIG} runAI={runAI} aiLoad={aiLoad} setUpdateTarget={setUpdateTarget} openModal={openModal} deleteVideo={deleteVideo} WL={WL} />}
        {nav==="tasks"     && <TasksView tasks={tasks} setTasks={setTasks} appIdeas={appIdeas} setAppIdeas={setAppIdeas} setEditAppIdeaTarget={setEditAppIdeaTarget} setModals={setModals} />}
        {nav==="growth"    && <GrowthView m={m} ttViewsDisplay={ttViewsDisplay} igData={igData} hasIG={hasIG} igLoad={igLoad} fetchIG={fetchIG} scrapedStats={scrapedStats} saveManual={saveManual} setManualData={setManualData} />}
        {nav==="settings"  && <SettingsView keys={keys} onEditKeys={onEditKeys} scrapedStats={scrapedStats} hasIG={hasIG} WL={WL} />}

        {/* AI ERROR */}
        {aiErr && (
          <div style={{ position:"fixed", top:54, left:"50%", transform:"translateX(-50%)", background:"rgba(10,5,20,0.95)", border:"1px solid rgba(255,45,80,0.4)", borderRadius:12, padding:"10px 16px", color:"#FF8888", fontSize:11, zIndex:999, display:"flex", gap:10, alignItems:"center", maxWidth:340, backdropFilter:"blur(20px)" }}>
            {aiErr}<button onClick={()=>setAiErr(null)} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:14 }}>x</button>
          </div>
        )}
      </div>

      {/* NAV BAR */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(5,3,12,0.98)", backdropFilter:"blur(30px)", WebkitBackdropFilter:"blur(30px)", borderTop:"1px solid rgba(255,255,255,0.14)", display:"flex", padding:"8px 2px 22px", zIndex:99 }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>{ setNav(n.id); setSub(null); }} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"2px 0" }}>
            <div style={{ width:42, height:42, borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", background:nav===n.id?`linear-gradient(135deg,${C.pink},${C.purple})`:"rgba(255,255,255,0.09)", boxShadow:nav===n.id?`0 4px 20px ${C.pink}50`:"none", color:nav===n.id?"#fff":"rgba(255,255,255,0.65)" }}>
              {n.ic(15, nav===n.id?"#fff":"rgba(255,255,255,0.65)")}
            </div>
            <span style={{ fontSize:8, fontWeight:800, letterSpacing:"0.08em", color:nav===n.id?C.pink:"rgba(255,255,255,0.55)", textTransform:"uppercase" }}>{n.label}</span>
          </button>
        ))}
      </div>

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

// ROOT
export default function App() {
  const [config, setConfig] = useState(()=>loadJSON(KEYS_KEY,{}));
  return <Dashboard keys={config.keys||{}} onEditKeys={keys=>{ const u={...config,keys}; setConfig(u); saveJSON(KEYS_KEY,u); }} />;
}
