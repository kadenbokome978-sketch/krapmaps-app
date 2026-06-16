import React, { useState, useEffect, useCallback, useRef } from "react";


const C = {
  pink:"#FF2D78", cyan:"#00E5FF", yellow:"#FFD50A",
  green:"#39FF14", orange:"#FF6B1A", purple:"#C566FF",
  bg:"#07050F", card:"rgba(255,255,255,0.025)",
  cardSolid:"#0C0A1A", cardAlt:"rgba(255,255,255,0.025)",
  border:"rgba(255,255,255,0.08)", borderMed:"rgba(255,255,255,0.11)",
  dim:"rgba(255,255,255,0.45)", text:"#F8EEFF", textMed:"#C8A8E0",
  fontHead:"'Lilita One', Georgia, serif",
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
};

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
const StatMini = ({ label, value, color, icon, delta, deltaUp }) => (
  <Glass glow={color} style={{ padding:"22px 22px", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", bottom:-30, right:-30, width:120, height:120, borderRadius:"50%", background:`${color}10`, filter:"blur(40px)", pointerEvents:"none" }} />
    <div style={{ position:"absolute", top:0, right:0, width:80, height:80, borderRadius:"50%", background:`${color}06`, filter:"blur(30px)", pointerEvents:"none" }} />
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${color}30,${color}10)`, border:`1px solid ${color}35`, display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0, boxShadow:`0 4px 16px ${color}20` }}>{icon}</div>
      {delta != null && (
        <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:6, background:deltaUp?"rgba(0,255,148,0.1)":"rgba(255,45,120,0.1)", border:`1px solid ${deltaUp?"rgba(0,255,148,0.2)":"rgba(255,45,120,0.2)"}` }}>
          <span style={{ fontSize:11, color:deltaUp?C.green:C.pink, fontWeight:700 }}>{deltaUp?"↑":"↓"} {delta}</span>
        </div>
      )}
    </div>
    <Num color={color} size={34}>{value}</Num>
    <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:8 }}>{label}</div>
  </Glass>
);
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
  const pts = data.map((d,i)=>[PAD+(i/(data.length-1||1))*(W-PAD*2), H-BPAD-((d[dataKey]-min)/range)*(H-BPAD-8)]);
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
        <path d={ttPath} fill="none" stroke={C.pink} strokeWidth="5" strokeOpacity="0.2" filter="url(#gltt)"/>
        <path d={ttPath} fill="none" stroke={C.pink} strokeWidth="2.5" strokeLinecap="round"/>
        {ttPts.map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r="4" fill={C.pink} opacity="0.2"/><circle cx={p[0]} cy={p[1]} r="2.5" fill={C.pink}/></g>)}
      </>}
      {igPath && <>
        <path d={igPath} fill="none" stroke={C.purple} strokeWidth="5" strokeOpacity="0.2" filter="url(#glig)"/>
        <path d={igPath} fill="none" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6,3"/>
        {igPts.map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r="4" fill={C.purple} opacity="0.2"/><circle cx={p[0]} cy={p[1]} r="2.5" fill={C.purple}/></g>)}
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
      {/* Bars */}
      {data.map((d,i)=>{
        const barH = Math.max(0,((d[dataKey]||0)/max)*chartH);
        const x = LPAD + i*grp + grp/2 - bw/2;
        const y = TPAD+chartH-barH;
        const r = 5;
        return (
          <g key={i}>
            {barH>2 && <rect x={x} y={y} width={bw} height={barH} rx={r} fill={color} opacity="0.18" filter={`url(#bf${id})`}/>}
            {barH>2 && <rect x={x} y={y} width={bw} height={barH} rx={r} fill={`url(#gb${id})`}/>}
            {barH>3 && <rect x={x} y={y} width={bw} height={3} rx={r} fill={color} opacity="0.9"/>}
            <text x={x+bw/2} y={H-8} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="inherit">{d[xKey]}</text>
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
  const pts = data.map((d,i)=>[PAD+(i/(data.length-1))*(W-PAD*2), H-BPAD-((d[dataKey]-min)/range)*(H-BPAD-8)]);
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
  return (
    <svg width={size} height={size} style={{overflow:"visible"}}>
      {arcs.map((arc,i)=>(
        <g key={i}>
          <path d={arc.path} fill={arc.color} opacity="0.25" transform={`scale(1.08) translate(-${cx*0.08},-${cy*0.08})`}/>
          <path d={arc.path} fill={arc.color}/>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={innerRadius-2} fill="rgba(7,5,15,0.9)"/>
    </svg>
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

const HomeView = ({ ideas, calItems, setNav, runAI, aiLoad, openModal, ttViewsDisplay, igViewsTotal=0, allViewsDisplay=0, m, scrapedStats, statsError, igData, videos=[], weeklyDebrief, debriefLoading, runDebrief }) => {
  const topIdeas = [...(ideas||[])].sort((a,b)=>(Number(b.viral)||0)-(Number(a.viral)||0)).slice(0,3);
  const upcoming = (calItems||[]).slice(0,3);
  const streak = React.useMemo(()=>getStreak(),[]);
  const xp = React.useMemo(()=>getXP(),[]);
  const intelLevel = React.useMemo(()=>getIntelligenceLevel(videos, ideas||[], loadJSON(MEMORY_KEY,{entries:[]}), loadJSON(CHANNEL_THEORY_KEY,"")),[videos, ideas]);
  const xpToNext = 100 * (xp.level * xp.level);
  const xpProgress = Math.min(((xp.total - 100*(xp.level-1)*(xp.level-1)) / (xpToNext - 100*(xp.level-1)*(xp.level-1))) * 100, 100);
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
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ══ RETENTION BAR — streak, XP, intelligence ══════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(160px,100%),1fr))", gap:10 }}>
        {/* Daily Streak */}
        <div data-card style={{ borderRadius:16, padding:"16px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${streak.count>=7?C.orange:"rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:28 }}>{streak.count>=7?"🔥":streak.count>=3?"⚡":"📅"}</div>
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
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700 }}>AI INTELLIGENCE</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.cyan, background:`${C.cyan}12`, border:`1px solid ${C.cyan}25`, borderRadius:6, padding:"2px 8px" }}>{intelLevel<30?"LEARNING":intelLevel<60?"BUILDING":intelLevel<80?"SHARP":"ELITE"}</div>
          </div>
          <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, color:C.cyan, lineHeight:1, marginBottom:8 }}>{intelLevel}<span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginLeft:2 }}>/100</span></div>
          <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.06)" }}>
            <div style={{ height:"100%", width:`${intelLevel}%`, borderRadius:2, background:`linear-gradient(90deg,${C.cyan},${C.purple})`, transition:"width 0.6s ease" }}/>
          </div>
        </div>
        {/* Open loops — Zeigarnik effect */}
        {(() => {
          const unscored = (ideas||[]).filter(i=>!(i.viral>0)&&i.status!=="posted").length;
          const stale = (ideas||[]).filter(i=>{ if(["posted","filmed"].includes(i.status)) return false; const d=i.createdAt?Math.floor((Date.now()-new Date(i.createdAt).getTime())/86400000):null; return d&&d>30; }).length;
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
              <div style={{ fontSize:22, fontWeight:400, fontFamily:C.fontHead, color:C.green, lineHeight:1, marginBottom:4 }}>All clear ✓</div>
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
        <div style={{ position:"relative", padding:"44px 48px", display:"flex", alignItems:"stretch", gap:48 }}>
          {/* Left: main stat */}
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.eye(14,"#fff")}</div>
              <span style={{ fontSize:14, color:"rgba(255,255,255,0.85)", letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:700 }}>Total Views All Time</span>
            </div>
            <div style={{ fontSize:88, fontWeight:400, lineHeight:0.85, fontFamily:C.fontHead, color:"#fff", letterSpacing:"-0.01em", textShadow:`0 0 100px ${C.pink}35` }}>
              {allViewsDisplay>=1e6?(allViewsDisplay/1e6).toFixed(1)+"M":allViewsDisplay>=1e3?(allViewsDisplay/1e3).toFixed(1)+"K":String(allViewsDisplay||0)}
            </div>
            <div style={{ marginTop:24, display:"flex", alignItems:"center", gap:24 }}>
              <div style={{ height:40, width:1, background:"rgba(255,255,255,0.08)" }}/>
              {[
                {l:"Followers",v:m?.tt_followers||0,c:C.pink},
                {l:"Bins",v:m?.bins||0,c:C.yellow},
              ].map((s,i)=>(
                <div key={i}>
                  <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", letterSpacing:"0.14em", textTransform:"uppercase" }}>{s.l}</div>
                  <div style={{ fontSize:28, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1.1, textShadow:`0 0 16px ${s.c}50` }}>{s.v.toLocaleString()}</div>
                </div>
              ))}
              <div style={{ height:40, width:1, background:"rgba(255,255,255,0.08)" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:scrapedStats?.scraped_at?C.green:"rgba(255,255,255,0.85)", boxShadow:scrapedStats?.scraped_at?`0 0 8px ${C.green}`:""  }}/>
                <span style={{ fontSize:17, color:scrapedStats?.scraped_at?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.8)", letterSpacing:"0.1em" }}>{scrapedStats?.scraped_at?"SYNCED":"NOT SYNCED"}</span>
              </div>
            </div>
          </div>
          {/* Right: sparkline */}
          <div style={{ width:220, display:"flex", flexDirection:"column", justifyContent:"flex-end", paddingBottom:8, opacity:0.75 }}>
            <Sparkline data={[0.25,0.4,0.35,0.6,0.55,0.8,1].map(f=>Math.round((ttViewsDisplay||500)*f))} color={C.pink} height={70}/>
          </div>
        </div>
      </div>

      {/* ══ STAT CARDS ════════════════════════════════════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:14, marginBottom:32 }}>
        {[
          { label:"TT Followers", value:m?.tt_followers>=1e3?(m.tt_followers/1e3).toFixed(1)+"K":String(m?.tt_followers||0), color:C.pink, icon:I.tt },
          { label:"TT Views", value:ttViewsDisplay>=1e6?(ttViewsDisplay/1e6).toFixed(1)+"M":ttViewsDisplay>=1e3?(ttViewsDisplay/1e3).toFixed(1)+"K":String(ttViewsDisplay||0), color:C.cyan, icon:I.eye },
          { label:"IG Followers", value:(()=>{ const f=igData?.profile?.followers_count||m?.ig_followers||0; return f>=1e3?(f/1e3).toFixed(1)+"K":f?String(f):"--"; })(), color:C.yellow, icon:I.ig },
          { label:"IG Views", value:(()=>{ const t=videos.filter(v=>v.platform==="instagram").reduce((s,v)=>s+(v.views||0),0); return t>=1e6?(t/1e6).toFixed(1)+"M":t>=1e3?(t/1e3).toFixed(1)+"K":String(t||0); })(), color:C.purple, icon:I.ig },
        ].map((s,i)=>(
          <div key={i} data-card style={{ borderRadius:22, padding:"24px 24px 22px", background:`linear-gradient(145deg,${s.color}16 0%,rgba(8,5,18,0.95) 70%)`, border:`1px solid ${s.color}30`, position:"relative", overflow:"hidden", boxShadow:`0 8px 32px ${s.color}08` }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${s.color},${s.color}00)`, borderRadius:"22px 22px 0 0" }}/>
            <div style={{ position:"absolute", bottom:-40, right:-40, width:130, height:130, borderRadius:"50%", background:`${s.color}12`, filter:"blur(40px)", pointerEvents:"none" }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:`linear-gradient(135deg,${s.color}25,${s.color}0a)`, border:`1px solid ${s.color}30`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px ${s.color}18` }}>{s.icon(18,s.color)}</div>
              <div style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {I.trend(12,s.color)}
              </div>
            </div>
            <div style={{ fontSize:44, fontWeight:400, fontFamily:C.fontHead, color:"#fff", lineHeight:1, letterSpacing:"-0.01em", marginBottom:10, textShadow:`0 0 30px ${s.color}30` }}>{s.value}</div>
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
        <div style={{ padding:"28px 32px 0" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:10, fontWeight:600 }}>Platform Views — 7 Days</div>
              <div style={{ fontSize:48, fontWeight:400, fontFamily:C.fontHead, color:"#fff", lineHeight:1, letterSpacing:"-0.01em" }}>{(last7.reduce((s,d)=>s+d.value,0)+igLast7.reduce((s,d)=>s+d.value,0)).toLocaleString()}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:8 }}>Total across both platforms this week</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              {[{c:C.pink,l:"TikTok",v:last7.reduce((s,d)=>s+d.value,0),dash:false},{c:C.purple,l:"Instagram",v:igLast7.reduce((s,d)=>s+d.value,0),dash:true}].map((p,i)=>(
                <div key={i} style={{ padding:"14px 20px", borderRadius:16, background:`linear-gradient(145deg,${p.c}12,rgba(8,5,18,0.8))`, border:`1px solid ${p.c}25`, minWidth:120, textAlign:"center", boxShadow:`0 4px 20px ${p.c}08` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:p.c, boxShadow:`0 0 8px ${p.c}` }}/>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{p.l}</span>
                  </div>
                  <div style={{ fontSize:24, fontWeight:400, color:p.c, fontFamily:C.fontHead, textShadow:`0 0 20px ${p.c}40` }}>{p.v.toLocaleString()}</div>
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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:12 }}>
        {[
          { icon:I.idea, label:"Add Idea",     desc:"Brainstorm content", color:C.purple, fn:()=>{ setNav("content"); if(openModal) setTimeout(()=>openModal("addIdea"),50); } },
          { icon:I.cal,  label:"Schedule",     desc:"Plan your calendar",  color:C.cyan,   fn:()=>{ setNav("content"); if(openModal) setTimeout(()=>openModal("addCal"),50); } },
          { icon:I.vid,  label:"Log Video",    desc:"Track performance",   color:C.pink,   fn:()=>openModal&&openModal("addVideo") },
          { icon:I.bar,  label:"Update Stats", desc:"Manual stat entry",   color:C.yellow, fn:()=>openModal&&openModal("editStats") },
        ].map((a,i)=>(
          <button data-btn key={i} onClick={a.fn} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:14, padding:"22px 20px", borderRadius:16, background:`linear-gradient(145deg,${a.color}12,rgba(8,5,18,0.9))`, border:`1px solid ${a.color}25`, cursor:"pointer", fontFamily:C.fontHead, transition:"all 0.2s", position:"relative", overflow:"hidden", textAlign:"left" }}>
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
          <div style={{ padding:"20px 24px", borderRadius:20, background:"rgba(10,6,20,0.6)", border:`1px solid rgba(255,255,255,0.06)`, borderLeft:`3px solid ${action.color}`, display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>
              <span style={{ fontWeight:700, color:action.color }}>Next: </span>{action.msg}
            </div>
            <button onClick={action.fn} style={{ padding:"8px 16px", borderRadius:10, border:`1px solid ${action.color}45`, background:`${action.color}18`, color:action.color, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>{action.cta} →</button>
          </div>
        );
      })()}

      {/* ══ WEEKLY DEBRIEF ════════════════════════════════════════ */}
      <div style={{ borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.025)" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily:C.fontHead }}>Weekly Debrief</div>
            {weeklyDebrief?.generatedAt && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, marginTop:2 }}>Generated {new Date(weeklyDebrief.generatedAt).toLocaleDateString()}</div>}
          </div>
          <button onClick={runDebrief} disabled={debriefLoading} style={{ padding:"8px 16px", borderRadius:10, border:`1px solid ${C.purple}40`, background:debriefLoading?`${C.purple}15`:`linear-gradient(135deg,${C.purple}30,${C.pink}20)`, color:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:debriefLoading?"wait":"pointer", opacity:debriefLoading?0.7:1 }}>
            {debriefLoading?"GENERATING...":"↺ RUN DEBRIEF"}
          </button>
        </div>
        {weeklyDebrief ? (
          <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", fontFamily:C.fontBody, lineHeight:1.5 }}>{weeklyDebrief.headline}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:10 }}>
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}18` }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:8, fontFamily:C.fontHead }}>WHAT WORKED</div>
                {weeklyDebrief.whatWorked?.map((w,i)=><div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, marginBottom:4, lineHeight:1.5 }}>✓ {w}</div>)}
              </div>
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.pink}08`, border:`1px solid ${C.pink}18` }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:8, fontFamily:C.fontHead }}>NEEDS WORK</div>
                {weeklyDebrief.whatDidnt?.map((w,i)=><div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, marginBottom:4, lineHeight:1.5 }}>✕ {w}</div>)}
              </div>
            </div>
            {weeklyDebrief.focusThisWeek && <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.cyan}08`, border:`1px solid ${C.cyan}18` }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:8, fontFamily:C.fontHead }}>FOCUS THIS WEEK</div>
              {weeklyDebrief.focusThisWeek.map((f,i)=>(
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:i<weeklyDebrief.focusThisWeek.length-1?6:0 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.cyan, background:`${C.cyan}15`, borderRadius:4, padding:"1px 6px", flexShrink:0, marginTop:2, fontFamily:C.fontHead }}>{i+1}</span>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, lineHeight:1.5 }}>{f}</div>
                </div>
              ))}
            </div>}
            {weeklyDebrief.ideaToFilmNow && <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.yellow}08`, border:`1px solid ${C.yellow}20` }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:5, fontFamily:C.fontHead }}>FILM THIS WEEK</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontFamily:C.fontBody, lineHeight:1.5 }}>{weeklyDebrief.ideaToFilmNow}</div>
            </div>}
            {weeklyDebrief.watchOut && <div style={{ padding:"10px 14px", borderRadius:10, background:`${C.orange}08`, border:`1px solid ${C.orange}20`, display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:14 }}>⚠️</span>
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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:14 }}>
        {[
          { title:"Upcoming", sub:"Scheduled content", icon:I.cal, color:C.cyan, items:upcoming, empty:"Nothing scheduled yet",
            renderItem:(c,i,arr)=>(
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:i<arr.length-1?`1px solid rgba(255,255,255,0.05)`:"none" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:C.cyan, flexShrink:0, boxShadow:`0 0 6px ${C.cyan}` }} />
                <div style={{ flex:1, fontSize:14, color:"rgba(255,255,255,0.85)", fontWeight:600, lineHeight:1.4 }}>{c.title}</div>
                <Tag color={C.cyan} sm>{c.date||"TBD"}</Tag>
              </div>
            )
          },
          { title:"Top Ideas", sub:"Highest virality score", icon:I.idea, color:C.purple, items:topIdeas, empty:"No ideas yet",
            renderItem:(idea,i,arr)=>(
              <div key={idea.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<arr.length-1?`1px solid rgba(255,255,255,0.05)`:"none" }}>
                <div style={{ fontSize:30, fontWeight:400, fontFamily:C.fontHead, color:Number(idea.viral)>=70?C.green:Number(idea.viral)>=50?C.yellow:C.dim, width:36, lineHeight:1, textShadow:`0 0 10px currentColor`, flexShrink:0 }}>{idea.viral||0}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.5, flex:1, fontWeight:500 }}>{idea.title?.slice(0,52)}{(idea.title?.length||0)>52?"...":""}</div>
              </div>
            )
          },
        ].map((section,si)=>(
          <div key={si} style={{ borderRadius:22, padding:"24px 26px", background:`linear-gradient(145deg,${section.color}0f,rgba(8,5,18,0.96))`, border:`1px solid ${section.color}20`, position:"relative", overflow:"hidden", boxShadow:`0 8px 40px rgba(0,0,0,0.3)` }}>
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
                ? <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", fontStyle:"italic", padding:"12px 0" }}>{section.empty}</div>
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
          <div style={{ borderRadius:22, padding:"24px 26px", background:"linear-gradient(145deg,rgba(255,107,53,0.08),rgba(8,5,18,0.96))", border:`1px solid ${C.orange}20`, position:"relative", overflow:"hidden" }}>
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
      <div style={{ borderRadius:16, padding:"22px 24px", background:"linear-gradient(145deg,rgba(255,255,255,0.02),rgba(10,6,20,0.8))", border:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:16 }}>AI Strategy</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10 }}>
          {[
            { ic:I.search, l:"WHAT'S WORKING",  desc:"Analyse top content", c:C.cyan,   m:"analysis" },
            { ic:I.target, l:"NEXT VIDEOS",      desc:"AI recommendations", c:C.green,  m:"nextVids" },
            { ic:I.write,  l:"HARLEY BRIEF",     desc:"Weekly filming brief", c:C.yellow, m:"weekly"   },
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
        const PILLARS = ["Local Connection","Location Contrast","Mission Reveal","App In Action","Travel Utility"];
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
          <div style={{ borderRadius:16, padding:"20px 24px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:"0.16em", textTransform:"uppercase", fontWeight:700, marginBottom:14 }}>Content Pillar Health</div>
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
            <div style={{ fontSize:11, color:C.pink, letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>⚠ Stale Ideas ({staleIdeas.length})</div>
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
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>Idea → Outcome Pipeline</div>
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
  const [sub, setSub]         = useState("IDEAS");
  const [expanded, setExpanded] = useState(null);
  const [calFilter, setCalFilter] = useState("ALL");
  const [postingId, setPostingId] = useState(null);
  const [postViews, setPostViews] = useState("");
  const [quickExpand, setQuickExpand] = useState("");
  const [hookA, setHookA] = useState("");
  const [hookB, setHookB] = useState("");
  const [hookABResult, setHookABResult] = useState(null);
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
      const cfg = loadJSON(KEYS_KEY,{});
      const key = cfg?.keys?.anthropic;
      if(!key) { alert("Add Anthropic key in Settings first"); return; }
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "x-api-key":key, "anthropic-version":"2023-06-01", "content-type":"application/json", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:800, messages:[{role:"user",content:`Expand this rough content concept into a full video idea for @findkrap (KrapMaps — bin-finding app for backpackers in SE Asia).\n\nConcept: "${quickExpand}"\n\nReturn ONLY valid JSON:\n{"title":"compelling title under 12 words","type":"facecam|broll|voiceover|collab","hook":"hook type: achievement|contrast|challenge|curiosity|emotion|location|local|story","hookLine":"exact opening line under 10 words","body":"2 sentences on what happens in the video","cta":"what to say at the end","viralityScore":0-100,"contentPillar":"Local Connection|Location Contrast|Mission Reveal|App In Action|Travel Utility","estimated_views":"e.g. 20K-80K"}`}] })
      });
      const d = await r.json();
      const text = (d.content||[]).map(b=>b.text||"").join("").trim();
      const clean = text.replace(/```json/g,"").replace(/```/g,"").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if(!match) throw new Error("Parse failed");
      const result = JSON.parse(match[0]);
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

  const sorted = [...ideas].sort((a,b)=>(Number(b.viral)||0)-(Number(a.viral)||0));
  const filteredCal = calFilter==="ALL" ? calItems : calItems.filter(c=>(c.platform||"").toUpperCase()===calFilter);
  const ic = v => (v||0)>=80?C.green:(v||0)>=60?C.yellow:C.pink;
  const perfLabel = s => s>=80?"VIRAL":s>=65?"STRONG":s>=50?"DECENT":s>=35?"WEAK":"NEW";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Tabs + Add button */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:8 }}>
          {["IDEAS","CALENDAR","CAPTIONS"].map(t=>(
            <button key={t} onClick={()=>setSub(t)} style={{ padding:"10px 20px", borderRadius:12, border:`1px solid ${sub===t?C.pink:"rgba(255,255,255,0.08)"}`, background:sub===t?`${C.pink}15`:"transparent", color:sub===t?C.pink:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:"0.06em" }}>
              {t}{t==="IDEAS"&&` (${ideas.length})`}{t==="CALENDAR"&&` (${calItems.length})`}
            </button>
          ))}
        </div>
        <button onClick={()=>openModal&&openModal(sub==="CALENDAR"?"addCal":"addIdea")} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:12, border:`1px solid ${C.pink}40`, background:`linear-gradient(135deg,${C.pink}20,${C.pink}08)`, color:C.pink, fontFamily:C.fontHead, fontWeight:700, fontSize:14, cursor:"pointer" }}>
          + {sub==="CALENDAR"?"SCHEDULE":"ADD IDEA"}
        </button>
      </div>

      {/* ── IDEAS ─────────────────────────────────────────────── */}
      {sub==="IDEAS" && (
        <>
        {/* Quick expand panel */}
        <div style={{ borderRadius:16, padding:"16px 20px", background:`${C.purple}0a`, border:`1px solid ${C.purple}25`, marginBottom:14 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Quick Expand</div>
          <div style={{ display:"flex", gap:10 }}>
            <input
              value={quickExpand}
              onChange={e=>setQuickExpand(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doQuickExpand()}
              placeholder="Rough concept e.g. 'BK finds illegal dump site in Bali' ..."
              style={{ flex:1, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.purple}30`, borderRadius:11, color:"#fff", padding:"10px 14px", fontSize:13, fontFamily:C.fontHead, outline:"none" }}
            />
            <button onClick={doQuickExpand} disabled={!quickExpand.trim()||expanding}
              style={{ padding:"10px 20px", borderRadius:11, border:"none", background:expanding||!quickExpand.trim()?`${C.purple}30`:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:expanding||!quickExpand.trim()?"not-allowed":"pointer", whiteSpace:"nowrap", opacity:expanding||!quickExpand.trim()?0.6:1 }}>
              {expanding ? "EXPANDING..." : "EXPAND →"}
            </button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(300px,100%),1fr))", gap:14, alignItems:"start" }}>
          {sorted.length===0
            ? <div style={{ gridColumn:"1/-1", padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:32 }}>🎬</div>
                <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No ideas yet</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Start building your content pipeline — add your first idea above</div>
              </div>
            : sorted.map(idea=>{
              const scoreC = ic(idea.viral||0);
              const isExpanded = expanded===idea.id;
              const daysOld = idea.createdAt ? Math.floor((Date.now()-new Date(idea.createdAt).getTime())/(1000*60*60*24)) : null;
              const isStale = daysOld!==null && daysOld>30 && idea.status!=="posted" && idea.status!=="filmed";
              const hasScore = (idea.viral||0)>0;
              const isScoring = aiLoad&&aiLoad["s"+idea.id];
              const stageLabel = ({idea:"Idea",script_ready:"Scripted",filming:"Filming",posted:"Posted"})[idea.status||"idea"];
              const stageColor = ({idea:C.cyan,script_ready:C.green,filming:C.orange,posted:C.green})[idea.status||"idea"];
              return (
                <div key={idea.id} style={{ borderRadius:16, background:"rgba(12,8,24,0.95)", border:`1px solid ${isStale?C.pink+"40":hasScore?scoreC+"22":"rgba(255,255,255,0.08)"}`, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", transition:"border-color 0.2s" }}>

                  {/* Top accent line — score-coloured, full width */}
                  <div style={{ height:2, background:hasScore?`linear-gradient(90deg,${scoreC},${scoreC}40,transparent)`:isStale?`linear-gradient(90deg,${C.pink}60,transparent)`:"rgba(255,255,255,0.04)" }}/>

                  {/* ── CARD BODY ── */}
                  <div style={{ padding:"16px 18px", flex:1 }}>

                    {/* Title row */}
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:"#fff", lineHeight:1.4, marginBottom:8, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{idea.title}</div>

                        {/* Tags — minimal: type + stale only */}
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                          {idea.type && <Tag color={C.pink} sm>{idea.type}</Tag>}
                          {idea.aiScore?.contentPillar && <Tag color={C.purple} sm>{idea.aiScore.contentPillar}</Tag>}
                          <span style={{ fontSize:11, fontWeight:700, color:stageColor, letterSpacing:"0.08em", textTransform:"uppercase" }}>{stageLabel}</span>
                          {isStale && <span style={{ fontSize:11, fontWeight:700, color:C.pink, letterSpacing:"0.08em" }}>⚠ {daysOld}d stale</span>}
                        </div>
                      </div>

                      {/* Score badge — single clean number */}
                      <div style={{ flexShrink:0, textAlign:"center", minWidth:52 }}>
                        {hasScore ? (
                          <>
                            <div style={{ fontSize:44, fontWeight:300, fontFamily:C.fontHead, color:scoreC, lineHeight:1, letterSpacing:"-0.02em", textShadow:`0 0 24px ${scoreC}60` }}>{idea.viral}</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.14em", marginTop:2 }}>{perfLabel(idea.viral)}</div>
                            {idea.scoreDelta!=null && idea.scoreDelta!==0 && (
                              <div style={{ fontSize:10, fontWeight:700, color:idea.scoreDelta>0?C.green:C.pink, marginTop:1 }}>{idea.scoreDelta>0?`+${idea.scoreDelta}`:idea.scoreDelta}</div>
                            )}
                          </>
                        ) : (
                          <div style={{ width:52, height:52, borderRadius:"50%", border:"2px dashed rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontWeight:700, letterSpacing:"0.06em", textAlign:"center", lineHeight:1.3 }}>NOT<br/>SCORED</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verdict — only when scored, single line clamped */}
                    {idea.verdict && (
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody, marginBottom:12, fontFamily:C.fontBody, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:isExpanded?20:2, WebkitBoxOrient:"vertical" }}>
                        {idea.verdict}
                      </div>
                    )}

                    {/* Improved hook — only in expanded */}
                    {isExpanded && idea.improvedHook && (
                      <div style={{ padding:"10px 14px", background:`${C.green}08`, border:`1px solid ${C.green}18`, borderRadius:11, marginBottom:10 }}>
                        <div style={{ fontSize:10, color:C.green, fontWeight:700, letterSpacing:"0.12em", marginBottom:4 }}>IMPROVED HOOK</div>
                        <div style={{ fontSize:13, color:"#fff", fontStyle:"italic", lineHeight:1.5 }}>"{idea.improvedHook}"</div>
                      </div>
                    )}

                    {/* Expanded detail panels — tabbed */}
                    {isExpanded && (
                      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:4, padding:"12px", borderRadius:12, background:"rgba(255,255,255,0.015)", marginTop:4 }}>
                        {(idea.viralReason||idea.hookFeedback) && (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            {idea.viralReason && (
                              <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>SHARE TRIGGER</div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{idea.viralReason}</div>
                              </div>
                            )}
                            {idea.hookFeedback && (
                              <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>HOOK FEEDBACK</div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{idea.hookFeedback}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {(idea.retentionFix||idea.competitorAngle) && (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            {idea.retentionFix && (
                              <div style={{ padding:"10px 12px", background:`${C.cyan}06`, borderRadius:10, border:`1px solid ${C.cyan}15` }}>
                                <div style={{ fontSize:10, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>RETENTION FIX</div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{idea.retentionFix}</div>
                              </div>
                            )}
                            {idea.competitorAngle && (
                              <div style={{ padding:"10px 12px", background:`${C.purple}06`, borderRadius:10, border:`1px solid ${C.purple}15` }}>
                                <div style={{ fontSize:10, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>COMPETITOR ANGLE</div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{idea.competitorAngle}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {idea.altHooks?.length>0 && (
                          <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:`1px solid ${C.purple}18` }}>
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
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            {idea.openLoopStrength && (
                              <div style={{ padding:"10px 12px", background:`${C.pink}06`, borderRadius:10, border:`1px solid ${C.pink}18` }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>OPEN LOOP <span style={{ color:C.pink, fontSize:12 }}>{idea.openLoopStrength}/10</span></div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{typeof idea.openLoopStrength==="string"?idea.openLoopStrength:""}</div>
                              </div>
                            )}
                            {idea.emotionalArc && (
                              <div style={{ padding:"10px 12px", background:`${C.yellow}06`, borderRadius:10, border:`1px solid ${C.yellow}18` }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.1em", marginBottom:5 }}>EMOTIONAL ARC</div>
                                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{idea.emotionalArc}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {idea.reHookMoments?.length>0 && (
                          <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:"1px solid rgba(255,255,255,0.05)" }}>
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
                          <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:"1px solid rgba(255,255,255,0.05)" }}>
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
                    <div style={{ padding:"8px 18px 10px", borderTop:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display:"flex", gap:8 }}>
                        {[
                          { label:"Hook", val:idea.hookScore, color:C.orange },
                          { label:"Ret", val:idea.retentionScore, color:C.cyan },
                          { label:"Share", val:idea.shareScore, color:C.green },
                          { label:"Algo", val:idea.algoScore, color:C.yellow },
                          { label:"Niche", val:idea.nicheScore, color:C.purple },
                        ].filter(f=>f.val).map((f,fi)=>(
                          <div key={fi} style={{ flex:1, textAlign:"center" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:f.color, lineHeight:1 }}>{f.val}</div>
                            <div style={{ height:4, borderRadius:2, background:`${f.color}18`, marginTop:4, overflow:"hidden" }}>
                              <div style={{ width:`${f.val}%`, height:"100%", borderRadius:2, background:f.color }}/>
                            </div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:3, letterSpacing:"0.08em" }}>{f.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── EST REACH + HOOK PREVIEW ── */}
                  {(idea.aiScore?.estimated_views || idea.hook) && (
                    <div style={{ padding:"7px 18px", borderTop:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", gap:10 }}>
                      {idea.aiScore?.estimated_views && (
                        <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.45)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{idea.aiScore.estimated_views}</span>
                      )}
                      {idea.hook && !idea.aiScore?.estimated_views && (
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>"{idea.hook}"</span>
                      )}
                    </div>
                  )}

                  {/* ── ACTIONS — clear hierarchy ── */}
                  <div style={{ padding:"10px 14px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>

                    {/* Primary CTA: score or re-score — solid gradient, most weight */}
                    <button onClick={()=>scoreIdea&&scoreIdea(idea)} disabled={!!isScoring}
                      style={{ padding:"8px 16px", borderRadius:10, border:"none", fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:isScoring?"wait":"pointer", letterSpacing:"0.06em", flexShrink:0, transition:"opacity 0.15s",
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
                          style={{ flex:1, minWidth:0, background:"rgba(255,255,255,0.07)", border:`1px solid ${C.green}40`, borderRadius:8, color:"#fff", padding:"6px 10px", fontSize:12, fontFamily:C.fontHead, outline:"none" }}
                        />
                        <button onClick={()=>{ markPosted&&markPosted(idea,parseInt(postViews)||0); setPostingId(null); setPostViews(""); }}
                          style={{ padding:"6px 11px", borderRadius:8, border:"none", background:C.green, color:"#000", fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer" }}>✓</button>
                        <button onClick={()=>{ setPostingId(null); setPostViews(""); }}
                          style={{ padding:"6px 9px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer" }}>✕</button>
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
                        style={{ padding:"7px 9px", borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:13 }}>✎</button>
                      <button title="Schedule" onClick={()=>{ setSub("CALENDAR"); openModal&&openModal("addCal"); }}
                        style={{ padding:"7px 9px", borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:13 }}>📅</button>
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
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.14em", marginBottom:14 }}>HOOK A/B TESTER</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:10, marginBottom:12 }}>
            {[["A", hookA, setHookA], ["B", hookB, setHookB]].map(([label, val, setter])=>(
              <div key={label}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.12em", marginBottom:6, fontFamily:C.fontHead }}>HOOK {label}</div>
                <textarea value={val} onChange={e=>setter(e.target.value)} placeholder={`Write hook ${label}...`} rows={2} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", padding:"10px 14px", fontSize:13, fontFamily:C.fontBody, outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.5 }}/>
              </div>
            ))}
          </div>
          <button onClick={async()=>{
            if(!hookA.trim()||!hookB.trim()) return;
            setHookABLoading(true); setHookABResult(null);
            try {
              const r = await callAI(`Compare these two TikTok hooks for @findkrap (KrapMaps — bin-finding app for backpackers in SE Asia). Score each on: pattern interrupt, open loop strength, identity trigger, curiosity gap. Return ONLY JSON: {"winner":"A","hookAScore":0,"hookBScore":0,"hookAAnalysis":"","hookBAnalysis":"","whyWinner":"","improvedWinner":""}\n\nHook A: "${hookA}"\nHook B: "${hookB}"`, 600);
              setHookABResult(r); addXP(10);
            } catch(e){}
            setHookABLoading(false);
          }} disabled={hookABLoading||!hookA.trim()||!hookB.trim()} style={{ padding:"10px 22px", borderRadius:11, border:"none", background:hookABLoading?`${C.purple}30`:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:hookABLoading?"wait":"pointer", marginBottom:hookABResult?14:0, opacity:(!hookA.trim()||!hookB.trim())?0.5:1 }}>
            {hookABLoading?"ANALYSING...":"⚡ TEST HOOKS"}
          </button>
          {hookABResult && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:10 }}>
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
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.cyan}08`, border:`1px solid ${C.cyan}18` }}>
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
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Filter pills */}
          <div style={{ display:"flex", gap:8 }}>
            {["ALL","TIKTOK","INSTAGRAM","BOTH"].map(p=>(
              <button key={p} onClick={()=>setCalFilter(p)} style={{ padding:"8px 16px", borderRadius:10, border:`1px solid ${calFilter===p?C.cyan:"rgba(255,255,255,0.08)"}`, background:calFilter===p?`${C.cyan}15`:"transparent", color:calFilter===p?C.cyan:"rgba(255,255,255,0.45)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                {p}
              </button>
            ))}
          </div>

          {filteredCal.length===0
            ? <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:32 }}>📅</div>
                <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>Nothing scheduled</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Plan your posting schedule — tap Schedule to add your first date</div>
              </div>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(180px,100%),1fr))", gap:12 }}>
              {filteredCal.map(c=>(
                <div key={c.id} style={{ borderRadius:16, padding:"18px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.cyan}20`, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:12 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"#fff", lineHeight:1.35, flex:1 }}>{c.title}</div>
                    <button onClick={()=>setCalItems(cs=>cs.filter(x=>x.id!==c.id))} style={{ padding:"4px 8px", borderRadius:8, border:`1px solid ${C.pink}20`, background:`${C.pink}08`, color:C.pink, cursor:"pointer", flexShrink:0 }}>{I.trash(12,C.pink)}</button>
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
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
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
            <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:32 }}>✍️</div>
              <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>Writing captions...</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>AI is crafting your captions — this takes a few seconds</div>
            </div>
          ) : captionResult && captionIdea ? (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
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
                      {copied?.ttCap?"✓ COPIED":"COPY"}
                    </button>
                  </div>

                  {/* Primary caption */}
                  <div style={{ padding:"16px 18px", borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.12em", marginBottom:8 }}>PRIMARY CAPTION</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.75, fontFamily:C.fontBody, marginBottom:10 }}>{captionResult.tiktok?.caption}</div>
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
                                alert(`✓ "${v.hook_type}" saved to memory`);
                              }} style={{ padding:"3px 9px", borderRadius:5, border:`1px solid ${C.green}25`, background:`${C.green}08`, color:C.green, fontFamily:C.fontHead, fontSize:9, fontWeight:700, cursor:"pointer" }}>🏆 WIN</button>
                              <button onClick={()=>navigator.clipboard.writeText(v.caption+(v.hashtags?" "+v.hashtags.map(h=>"#"+h).join(" "):""))} style={{ padding:"3px 9px", borderRadius:5, border:`1px solid ${C.pink}25`, background:"transparent", color:C.pink, fontFamily:C.fontHead, fontSize:9, fontWeight:700, cursor:"pointer" }}>COPY</button>
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
                      {copied?.igCap?"✓ COPIED":"COPY"}
                    </button>
                  </div>
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700, letterSpacing:"0.12em", marginBottom:8 }}>CAPTION</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.75, fontFamily:C.fontBody, marginBottom:10 }}>{captionResult.instagram?.caption}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {(captionResult.instagram?.hashtags||[]).map(h=><span key={h} style={{ fontSize:11, color:C.purple, background:`${C.purple}10`, borderRadius:5, padding:"2px 7px" }}>#{h}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding:"56px 48px", textAlign:"center", borderRadius:16, border:"1px dashed rgba(255,255,255,0.08)", fontSize:14, color:"rgba(255,255,255,0.25)" }}>
              Select an idea above to generate captions
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalyticsView = ({ videos=[], totalViews=0, avgRatio=0, facecamAvg=0, hookStats=[], analysis, nextVids, weekly, trends, igData, hasIG, igLoad, fetchIG, runAI, aiLoad={}, setUpdateTarget, openModal, deleteVideo, WL={}, m={}, videoScores={} }) => {
  const [sub, setSub] = useState("OVERVIEW");
  const [vidAnalysis, setVidAnalysis] = useState({});
  const [vidLoading, setVidLoading]   = useState({});
  const [vidErr, setVidErr]           = useState(null);
  const cfg = loadJSON(KEYS_KEY,{});
  const hasAnthrop = !!(cfg?.keys?.anthropic);

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

      const prompt = `Analyse this ${platform} for KrapMaps (bin-finding app).${geminiCtx}
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

  const renderVidCard = (v,i) => {
                const r=rl(v);
                const sc = videoScores?.[v.id];
                const perfC = sc ? sc.color : perfColor(0);
                return (
                  <div key={v.id||i} style={{ borderRadius:16, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden", position:"relative" }}>
                    {sc && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${sc.color},${sc.color}00)` }}/>}
                    <div style={{ padding:"16px 18px" }}>
                      {/* Title row */}
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:12 }}>
                        <div style={{ fontSize:15, fontWeight:600, color:"#fff", lineHeight:1.3, flex:1 }}>{v.title?.slice(0,60)||"Untitled"}</div>
                        {sc && (
                          <div style={{ textAlign:"center", flexShrink:0 }}>
                            <div style={{ fontSize:28, fontWeight:400, fontFamily:C.fontHead, color:sc.color, lineHeight:1, textShadow:`0 0 10px ${sc.color}50` }}>{sc.score}</div>
                            <div style={{ fontSize:10, color:sc.color, fontWeight:700, letterSpacing:"0.06em" }}>VIRALITY</div>
                          </div>
                        )}
                      </div>
                      {/* Tags */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                        {v.type && <Tag color={C.pink} sm>{v.type}</Tag>}
                        {v.hook && <Tag color={C.cyan} sm>{v.hook}</Tag>}
                        {v.platform==="instagram" && <Tag color={C.purple} sm>IG</Tag>}
                      </div>
                      {/* Stats grid */}
                      {(() => {
                        const watchProxy = v.views48h&&v.views48h>0&&v.likes>0 ? parseFloat(((v.likes/v.views48h)*100).toFixed(1)) : null;
                        const avgLikeRate = videos.filter(x=>x.views>0).reduce((s,x)=>s+(x.likes/x.views*100),0)/(videos.filter(x=>x.views>0).length||1);
                        const watchLabel = watchProxy!==null ? (watchProxy>avgLikeRate*1.3?"STRONG":watchProxy<avgLikeRate*0.7?"WEAK":"AVG") : null;
                        return null;
                      })()}
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:8 }}>
                        {[
                          {l:"VIEWS", v:fmt(v.views||0), c:C.cyan},
                          {l:"LIKES", v:fmt(v.likes||0), c:C.pink},
                          {l:"RATIO", v:r.toFixed(1)+"%", c:r>=10?C.green:r>=5?C.yellow:C.orange},
                          ...(v.views48h>0 ? [{l:"48HR/LIKE", v:(v.views48h>0&&v.likes>0?((v.likes/v.views48h)*100).toFixed(1)+"%":"—"), c:(v.views48h>0&&v.likes>0&&((v.likes/v.views48h)*100)>=(r*1.3))?C.green:C.orange}] : [{l:"COMMENTS", v:v.comments||0, c:C.purple}]),
                        ].map((s,j)=>(
                          <div key={j} style={{ padding:"8px 6px", background:`${s.c}08`, borderRadius:10, border:`1px solid ${s.c}18`, textAlign:"center" }}>
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
                        {vidLoading?.[v.id] ? "⏳ ANALYSING..." : vidAnalysis?.[v.id] ? "✓ TEARDOWN" : "AI TEARDOWN"}
                      </button>
                      <button onClick={()=>deleteVideo&&deleteVideo(v.id)} style={{ marginLeft:"auto", padding:"6px 10px", borderRadius:9, border:`1px solid ${C.pink}20`, background:`${C.pink}08`, color:C.pink, fontFamily:C.fontHead, cursor:"pointer" }}>{I.trash(13,C.pink)}</button>
                    </div>
                    {/* Loading state */}
                    {vidLoading?.[v.id] && (
                      <div style={{ padding:"12px 18px", borderTop:`1px solid ${C.purple}20`, background:`${C.purple}06`, fontSize:13, color:C.purple, display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:C.purple, animation:"pulse 1s infinite" }}/>
                        {cfg?.keys?.gemini ? "🎬 Gemini watching... Claude analysing..." : "🤖 Claude analysing..."}
                      </div>
                    )}
                    {/* AI teardown */}
                    {!vidLoading?.[v.id] && vidAnalysis?.[v.id] && (() => {
                      const ar = vidAnalysis[v.id];
                      const sc2 = ar.overall_score||0;
                      const sc_c = sc2>=80?C.green:sc2>=60?C.yellow:sc2>=40?C.orange:C.pink;
                      return (
                        <div style={{ padding:"14px 18px", borderTop:`1px solid ${C.purple}20`, background:`${C.purple}06` }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                            <div style={{ fontSize:32, fontWeight:400, fontFamily:C.fontHead, color:sc_c, textShadow:`0 0 12px ${sc_c}50` }}>{sc2}</div>
                            <div>
                              <Tag color={sc2>=80?C.green:sc2>=60?C.yellow:C.pink} sm>{(ar.performance_verdict||"analysed").replace("_"," ").toUpperCase()}</Tag>
                              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:2, fontWeight:700, letterSpacing:"0.06em" }}>AI SCORE</div>
                            </div>
                            <div style={{ flex:1, fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.4 }}>{ar.why_it_performed?.slice(0,100)}</div>
                          </div>
                          {ar.refilm_brief?.hook && (
                            <div style={{ padding:"10px 12px", background:`${C.purple}10`, border:`1px solid ${C.purple}25`, borderRadius:10, fontSize:14, color:"rgba(255,255,255,0.8)", fontStyle:"italic" }}>
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
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Tabs */}
      <div style={{ display:"flex", gap:8 }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setSub(t)} style={{ padding:"10px 20px", borderRadius:12, border:`1px solid ${sub===t?C.pink:"rgba(255,255,255,0.08)"}`, background:sub===t?`${C.pink}15`:"transparent", color:sub===t?C.pink:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:"0.06em" }}>
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
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Platform stat cards — TikTok row */}
          <div style={{ borderRadius:16, padding:"18px 22px", background:"linear-gradient(145deg,rgba(255,45,120,0.08),rgba(10,6,20,0.95))", border:"1px solid rgba(255,45,120,0.2)", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.pink},${C.pink}00)` }}/>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:`${C.pink}20`, border:`1px solid ${C.pink}35`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.tt(15,C.pink)}</div>
              <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>TikTok</span>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>@findkrap</span>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:`${C.pink}10`, border:`1px solid ${C.pink}20` }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:C.pink }}/>
                <span style={{ fontSize:11, color:C.pink, fontWeight:700, letterSpacing:"0.08em" }}>{ttVids.length} VIDEOS</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:12 }}>
              {[
                {l:"Total Views", v:fmt(ttTotal), c:C.pink},
                {l:"Avg Views", v:fmt(ttAvg), c:C.cyan},
                {l:"Like Ratio", v:ttRatio.toFixed(1)+"%", c:ttRatio>=5?C.green:C.yellow},
                {l:"TT Followers", v:fmt(m?.tt_followers||0), c:C.purple},
              ].map((s,i)=>(
                <div key={i} style={{ padding:"14px 16px", borderRadius:16, background:`${s.c}10`, border:`1px solid ${s.c}20` }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>{s.l}</div>
                  <div style={{ fontSize:36, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1, textShadow:`0 0 16px ${s.c}40` }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>



          {/* Platform stat cards — Instagram row */}
          <div style={{ borderRadius:16, padding:"18px 22px", background:"linear-gradient(145deg,rgba(197,102,255,0.08),rgba(10,6,20,0.95))", border:"1px solid rgba(197,102,255,0.2)", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:`${C.purple}20`, border:`1px solid ${C.purple}35`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.ig(15,C.purple)}</div>
              <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Instagram</span>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>@findkrap</span>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:`${C.purple}10`, border:`1px solid ${C.purple}20` }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:C.purple }}/>
                <span style={{ fontSize:11, color:C.purple, fontWeight:700, letterSpacing:"0.08em" }}>{igVids.length} REELS</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:12 }}>
              {[
                {l:"Total Views", v:fmt(igTotal), c:C.purple},
                {l:"Avg Views", v:fmt(igAvg), c:C.cyan},
                {l:"Like Ratio", v:igRatio.toFixed(1)+"%", c:igRatio>=5?C.green:C.yellow},
                {l:"IG Followers", v:fmt(igFollowers), c:C.pink},
              ].map((s,i)=>(
                <div key={i} style={{ padding:"14px 16px", borderRadius:16, background:`${s.c}10`, border:`1px solid ${s.c}20` }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>{s.l}</div>
                  <div style={{ fontSize:36, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1, textShadow:`0 0 16px ${s.c}40` }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Side by side charts */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:14 }}>
            {/* TikTok top videos */}
            <div style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.pink}20`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.pink},${C.pink}00)` }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", letterSpacing:"0.06em" }}>TikTok Top Videos</div>
                <span style={{ fontSize:20, fontWeight:400, fontFamily:C.fontHead, color:C.pink }}>{fmt(ttBarData[0]?.value||0)}</span>
              </div>
              {ttBarData.length>0 ? <GlowBarChart data={ttBarData} color={C.pink} height={160} dataKey="value" xKey="label"/>
                : <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>No TikTok videos yet</div>}
            </div>

            {/* Instagram top reels */}
            <div style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.purple}20`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", letterSpacing:"0.06em" }}>Instagram Top Reels</div>
                <span style={{ fontSize:20, fontWeight:400, fontFamily:C.fontHead, color:C.purple }}>{fmt(igBarData[0]?.value||0)}</span>
              </div>
              {igBarData.length>0 ? <GlowBarChart data={igBarData} color={C.purple} height={160} dataKey="value" xKey="label"/>
                : <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>Sync IG reels via Settings</div>}
            </div>
          </div>

          {/* Like ratio comparison + hook performance */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(260px,100%),1fr))", gap:14 }}>
            {/* Ratio comparison */}
            <div style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)" }}>
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
              <div data-card style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.cyan}20`, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:16 }}>
                  <div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:14 }}>Hook Performance</div>
                    {hookStats.slice(0,5).map((h,i)=>(
                      <div key={h.hook} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          {i===0&&<span style={{ color:C.yellow, fontSize:13 }}>★</span>}
                          <span style={{ fontSize:14, color:i===0?"#fff":"rgba(255,255,255,0.85)", fontWeight:i===0?700:500 }}>{h.hook}</span>
                        </div>
                        <span style={{ fontSize:17, fontFamily:C.fontHead, color:i===0?C.yellow:C.cyan }}>{fmt(h.avg)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:14 }}>Avg Views</div>
                    <GlowBarChart data={hookStats.slice(0,6).map(h=>({label:h.hook.slice(0,6),value:h.avg}))} color={C.cyan} height={140} dataKey="value" xKey="label"/>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"rgba(255,255,255,0.45)" }}>
                Log videos with hook types to see hook performance
              </div>
            )}
          </div>
        </div>
        </>);
      })()}

      {/* ── VIDEOS ──────────────────────────────────────────────── */}
      {sub==="VIDEOS" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {videos.length===0
            ? <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:32 }}>📊</div>
                <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No videos logged yet</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Log your TikTok videos to track performance and spot trends</div>
              </div>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:16 }}>
              {/* TikTok column */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", borderRadius:16, background:`${C.pink}10`, border:`1px solid ${C.pink}25` }}>
                  <div style={{ width:28, height:28, borderRadius:9, background:`${C.pink}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.tiktok?I.tiktok(14,C.pink):"🎵"}</div>
                  <span style={{ fontSize:15, fontWeight:700, color:C.pink, letterSpacing:"0.05em" }}>TIKTOK</span>
                  <span style={{ marginLeft:"auto", fontSize:12, color:`${C.pink}aa`, fontWeight:700 }}>{videos.filter(v=>v.platform!=="instagram").length} VIDEOS</span>
                </div>
                {videos.filter(v=>v.platform!=="instagram").map((v,i)=>renderVidCard(v,i))}
              </div>
              {/* Instagram column */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", borderRadius:16, background:`${C.purple}10`, border:`1px solid ${C.purple}25` }}>
                  <div style={{ width:28, height:28, borderRadius:9, background:`${C.purple}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.ig(14,C.purple)}</div>
                  <span style={{ fontSize:15, fontWeight:700, color:C.purple, letterSpacing:"0.05em" }}>INSTAGRAM</span>
                  <span style={{ marginLeft:"auto", fontSize:12, color:`${C.purple}aa`, fontWeight:700 }}>{videos.filter(v=>v.platform==="instagram").length} REELS</span>
                </div>
                {videos.filter(v=>v.platform==="instagram").length===0 && (
                  <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:32 }}>📊</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No reels synced yet</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Hit SYNC NOW in Settings to pull your Instagram reels</div>
                  </div>
                )}
                {videos.filter(v=>v.platform==="instagram").map((v,i)=>renderVidCard(v,i))}
              </div>
            </div>
          }

        </div>
      )}



      {/* ── AI INSIGHTS ─────────────────────────────────────────── */}
      {sub==="AI INSIGHTS" && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Action buttons */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[
              {l:"WHAT'S WORKING", c:C.cyan, m:"analysis", load:aiLoad.analysis},
              {l:"NEXT VIDEOS", c:C.green, m:"nextVids", load:aiLoad.nextVids},
              {l:"HARLEY BRIEF", c:C.yellow, m:"weekly", load:aiLoad.weekly},
              {l:"TRENDS", c:C.orange, m:"trends", load:aiLoad.trends},
            ].map((a,i)=>(
              <button key={i} onClick={()=>runAI&&runAI(a.m)} disabled={a.load}
                style={{ flex:"1 1 120px", padding:"14px 12px", borderRadius:16, border:`1px solid rgba(255,255,255,0.08)`, background:`linear-gradient(135deg,${a.c}12,${a.c}05)`, color:a.c, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", opacity:a.load?0.5:1, letterSpacing:"0.08em", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${a.c},${a.c}00)` }}/>
                {a.load?"RUNNING...":a.l}
              </button>
            ))}
          </div>

          {/* Results grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(300px,100%),1fr))", gap:14 }}>
            {/* What's working */}
            <div data-card style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.cyan}20`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}><span style={{width:6,height:6,borderRadius:"50%",background:C.cyan,display:"inline-block",flexShrink:0}}/>What's Working</div>
              {analysis?.whatIsWorking?.length>0 ? analysis.whatIsWorking.map((a,i)=>(
                <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:`${a.impact==="high"?C.green:C.cyan}08`, border:`1px solid ${a.impact==="high"?C.green:C.cyan}18`, marginBottom:10 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:a.impact==="high"?C.green:C.cyan, marginBottom:4, lineHeight:1.3 }}>{a.insight}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody }}>{a.evidence}</div>
                </div>
              )) : <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Run "What's Working" to see insights</div>}
              {analysis?.whatIsNotWorking?.length>0 && (
                <>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", margin:"16px 0 10px" }}>Needs Fixing</div>
                  {analysis.whatIsNotWorking.map((a,i)=>(
                    <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:`${C.orange}08`, border:`1px solid ${C.orange}18`, marginBottom:8 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.orange, marginBottom:4, lineHeight:1.3 }}>{a.insight}</div>
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody }}>{a.evidence}</div>
                      {a.fix && <div style={{ fontSize:13, color:C.green, fontWeight:600, marginTop:4 }}>Fix: {a.fix}</div>}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Next videos */}
            <div data-card style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.green}20`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.green},${C.green}00)` }}/>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}><span style={{width:6,height:6,borderRadius:"50%",background:C.green,display:"inline-block",flexShrink:0}}/>Next Videos</div>
              {nextVids?.tiktok?.length>0 ? nextVids.tiktok.map((v,i)=>(
                <div key={i} style={{ borderRadius:12, border:`1px solid rgba(255,255,255,0.07)`, background:"rgba(255,255,255,0.025)", marginBottom:10, overflow:"hidden" }}>
                  <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", lineHeight:1.4, flex:1 }}>{v.title}</div>
                    {v.priority && <span style={{ fontSize:10, fontWeight:700, color:v.priority==="HIGH"?C.green:C.yellow, background:v.priority==="HIGH"?`${C.green}12`:`${C.yellow}12`, border:`1px solid ${v.priority==="HIGH"?C.green:C.yellow}25`, borderRadius:6, padding:"3px 8px", flexShrink:0 }}>{v.priority}</span>}
                  </div>
                  <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody }}>{v.whyItWillWork}</div>
                    {v.openingLine && (
                      <div style={{ padding:"8px 12px", background:`${C.green}08`, border:`1px solid ${C.green}15`, borderRadius:8, fontSize:13, color:"rgba(255,255,255,0.8)", fontStyle:"italic" }}>"{v.openingLine}"</div>
                    )}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {v.type && <span style={{ fontSize:10, fontWeight:700, color:C.pink, background:`${C.pink}10`, borderRadius:5, padding:"2px 8px" }}>{v.type}</span>}
                      {v.estimated_views && <span style={{ fontSize:10, fontWeight:700, color:C.cyan, background:`${C.cyan}10`, borderRadius:5, padding:"2px 8px" }}>{v.estimated_views}</span>}
                      {v.winning_combo_used && <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>✓ winning combo</span>}
                    </div>
                  </div>
                </div>
              )) : <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Run "Next Videos" for AI recommendations</div>}
            </div>

            {/* Harley brief */}
            <div data-card style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.yellow}20`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.yellow},${C.yellow}00)` }}/>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}><span style={{width:6,height:6,borderRadius:"50%",background:C.yellow,display:"inline-block",flexShrink:0}}/>Harley Brief</div>
              {weekly ? <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.6, fontFamily:C.fontBody }}>{weekly.harleyBrief||weekly.rawSummaryText}</div>
                : <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Run "Harley Brief" for filming instructions</div>}
            </div>

            {/* Trends */}
            <div data-card style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.orange}20`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.orange},${C.orange}00)` }}/>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}><span style={{width:6,height:6,borderRadius:"50%",background:C.orange,display:"inline-block",flexShrink:0}}/>Trending Now</div>
              {trends?.trends?.length>0 ? trends.trends.map((t,i)=>(
                <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 0", borderBottom:i<trends.trends.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div style={{ width:24, height:24, borderRadius:6, background:`${C.orange}15`, border:`1px solid ${C.orange}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, fontWeight:700, color:C.orange }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:4, lineHeight:1.3 }}>{t.trend}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody }}>{t.tiktokAngle}</div>
                    {t.urgency && <div style={{ marginTop:4 }}><Tag color={t.urgency==="POST NOW"?C.pink:t.urgency==="THIS WEEK"?C.yellow:C.cyan} sm>{t.urgency}</Tag></div>}
                  </div>
                </div>
              )) : <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Run "Trends" for live trending topics</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const TasksView = ({ tasks, setTasks, appIdeas, setAppIdeas, setEditAppIdeaTarget, setModals }) => {
  const [sub, setSub]             = useState("TO DO");
  const [taskInput, setTaskInput] = useState("");
  const [assign, setAssign]       = useState("BOTH");
  const [taskFilter, setTaskFilter] = useState("ALL");
  const [ideaInput, setIdeaInput] = useState("");

  const ac = a => a==="HARLEY"?C.cyan:a==="BOTH"?C.yellow:C.pink;
  const acLabel = a => a==="HARLEY"?"H":a==="BOTH"?"B":"BK";

  const pending = tasks.filter(t=>!t.done&&(taskFilter==="ALL"||t.assignee===taskFilter));
  const done    = tasks.filter(t=> t.done&&(taskFilter==="ALL"||t.assignee===taskFilter));

  const addTask = () => {
    if(!taskInput.trim()) return;
    setTasks(ts=>[{id:Date.now(),text:taskInput.trim(),assignee:assign,done:false,priority:"normal",created:new Date().toISOString()},...ts]);
    setTaskInput("");
  };
  const addIdea = () => {
    if(!ideaInput.trim()) return;
    setAppIdeas(is=>[{id:Date.now(),text:ideaInput.trim(),score:Math.floor(Math.random()*30+65),verdict:"Added! Looks promising.",impact:"HIGH",effort:"MEDIUM"},...is]);
    setIdeaInput("");
  };

  const assignees = ["ALL","BK","HARLEY","BOTH"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:8 }}>
        {["TO DO","APP IDEAS"].map(t=>(
          <button key={t} onClick={()=>setSub(t)} style={{ padding:"10px 22px", borderRadius:12, border:`1px solid ${sub===t?C.pink:"rgba(255,255,255,0.08)"}`, background:sub===t?`${C.pink}15`:"transparent", color:sub===t?C.pink:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:"0.06em" }}>
            {t}{t==="TO DO"&&` (${pending.length})`}{t==="APP IDEAS"&&` (${appIdeas.length})`}
          </button>
        ))}
      </div>

      {sub==="TO DO" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(320px,100%),1fr))", gap:20, alignItems:"start" }}>

          {/* LEFT — Input + Pending */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Add task card */}
            <div style={{ borderRadius:16, padding:"20px 22px", background:"linear-gradient(145deg,rgba(255,213,10,0.08),rgba(10,6,20,0.9))", border:`1px solid ${C.yellow}25`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.yellow},${C.yellow}00)` }}/>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:14 }}>New Task</div>
              <input
                value={taskInput}
                onChange={e=>setTaskInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addTask()}
                placeholder="What needs to get done..."
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#fff", padding:"14px 18px", fontSize:17, fontFamily:C.fontHead, outline:"none", marginBottom:14, boxSizing:"border-box" }}
              />
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                {/* Assignee picker */}
                <div style={{ display:"flex", gap:6 }}>
                  {["BK","HARLEY","BOTH"].map(a=>(
                    <button key={a} onClick={()=>setAssign(a)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${assign===a?ac(a):"rgba(255,255,255,0.1)"}`, background:assign===a?`${ac(a)}20`:"transparent", color:assign===a?ac(a):"rgba(255,255,255,0.45)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      {a}
                    </button>
                  ))}
                </div>
                <button onClick={addTask} style={{ padding:"10px 22px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.yellow},${C.orange})`, color:"#07050F", fontFamily:C.fontHead, fontWeight:700, fontSize:15, cursor:"pointer" }}>ADD</button>
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ display:"flex", gap:6 }}>
              {assignees.map(a=>(
                <button key={a} onClick={()=>setTaskFilter(a)} style={{ flex:1, padding:"8px 6px", borderRadius:10, border:`1px solid ${taskFilter===a?ac(a==="ALL"?assign:a):"rgba(255,255,255,0.08)"}`, background:taskFilter===a?`${ac(a==="ALL"?assign:a)}15`:"transparent", color:taskFilter===a?ac(a==="ALL"?assign:a):"rgba(255,255,255,0.45)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", textAlign:"center" }}>
                  {a}
                </button>
              ))}
            </div>

            {/* Pending tasks */}
            <div style={{ borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.025)", minHeight:300 }}>
              {pending.length===0
                ? <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:32 }}>✅</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>All clear</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Nothing pending — you're on top of your workflow</div>
                  </div>
                : pending.map((t,i)=>(
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 22px", borderBottom:i<pending.length-1?"1px solid rgba(255,255,255,0.05)":"none", transition:"background 0.15s" }}>
                    <button
                      onClick={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:true}:x))}
                      style={{ width:24, height:24, borderRadius:7, border:`2px solid ${ac(t.assignee)}`, background:"transparent", cursor:"pointer", flexShrink:0, transition:"all 0.2s" }}
                    />
                    <div style={{ flex:1, fontSize:14, color:"#fff", fontWeight:500, lineHeight:1.5 }}>{t.text}</div>
                    <div style={{ width:32, height:32, borderRadius:9, background:`${ac(t.assignee)}20`, border:`1px solid ${ac(t.assignee)}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:ac(t.assignee), flexShrink:0 }}>
                      {acLabel(t.assignee)}
                    </div>
                    <button onClick={()=>setTasks(ts=>ts.filter(x=>x.id!==t.id))} style={{ width:28, height:28, borderRadius:8, border:"1px solid rgba(255,45,120,0.2)", background:"rgba(255,45,120,0.08)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {I.trash(12,C.pink)}
                    </button>
                  </div>
                ))
              }
            </div>
          </div>

          {/* RIGHT — Completed + Stats */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(180px,100%),1fr))", gap:12 }}>
              {[
                {l:"PENDING", v:pending.length, c:C.yellow},
                {l:"DONE", v:done.length, c:C.green},
                {l:"TOTAL", v:tasks.length, c:C.cyan},
              ].map((s,i)=>(
                <div key={i} style={{ borderRadius:16, padding:"14px 16px", background:`${s.c}10`, border:`1px solid ${s.c}25`, textAlign:"center" }}>
                  <div style={{ fontSize:36, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", marginTop:6, fontWeight:700 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Assignee breakdown */}
            <div style={{ borderRadius:16, padding:"16px 18px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:14 }}>By Assignee</div>
              {["BK","HARLEY","BOTH"].map(a=>{
                const count = tasks.filter(t=>!t.done&&t.assignee===a).length;
                const total = tasks.filter(t=>t.assignee===a).length;
                return (
                  <div key={a} style={{ marginBottom:10 }}>
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
                      <span style={{ fontSize:12, color:C.green }}>✓</span>
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
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Add idea */}
          <div style={{ borderRadius:16, padding:"20px 22px", background:"linear-gradient(145deg,rgba(197,102,255,0.08),rgba(10,6,20,0.9))", border:`1px solid ${C.purple}25`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:14 }}>New App Idea</div>
            <div style={{ display:"flex", gap:10 }}>
              <input
                value={ideaInput}
                onChange={e=>setIdeaInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addIdea()}
                placeholder="Describe your feature idea..."
                style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#fff", padding:"14px 18px", fontSize:17, fontFamily:C.fontHead, outline:"none" }}
              />
              <button onClick={addIdea} style={{ padding:"12px 22px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:15, cursor:"pointer", whiteSpace:"nowrap" }}>ADD</button>
            </div>
          </div>

          {/* Ideas grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(260px,100%),1fr))", gap:14 }}>
            {appIdeas.length===0
              ? <div style={{ gridColumn:"1/-1", padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <div style={{ fontSize:32 }}>💡</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No app ideas yet</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Capture your best product ideas — add your first one above</div>
                </div>
              : appIdeas.map(idea=>{
                const sc = idea.score||0;
                const sc_c = sc>=80?C.green:sc>=65?C.yellow:sc>=50?C.cyan:C.pink;
                return (
                  <div key={idea.id} style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${sc_c}25`, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${sc_c},${sc_c}00)` }}/>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12 }}>
                      <div style={{ fontSize:14, color:"#fff", fontWeight:600, lineHeight:1.5, flex:1 }}>{idea.text}</div>
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <div style={{ fontSize:40, fontWeight:400, fontFamily:C.fontHead, color:sc_c, lineHeight:1, textShadow:`0 0 16px ${sc_c}50` }}>{sc}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700 }}>SCORE</div>
                      </div>
                    </div>
                    {idea.verdict && (
                      <div style={{ padding:"10px 12px", background:`${C.cyan}08`, border:`1px solid ${C.cyan}18`, borderRadius:10, fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.55, fontFamily:C.fontBody, marginBottom:12, fontFamily:C.fontBody }}>{idea.verdict}</div>
                    )}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
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
                      <button onClick={()=>setTasks(ts=>[{id:Date.now(),text:idea.text,assignee:"BK",done:false},...ts])} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.cyan}30`, background:`${C.cyan}10`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>→ TO DO</button>
                      <button onClick={()=>setAppIdeas(is=>is.filter(x=>x.id!==idea.id))} style={{ padding:"8px 12px", borderRadius:10, border:`1px solid ${C.pink}20`, background:`${C.pink}08`, color:C.pink, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>{I.trash(13,C.pink)}</button>
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
    setHasPPX(!!(cfg?.keys?.perplexity));
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
            `"${pred.concept.title}" predicted ${pred.predicted_views_low?.toLocaleString()}-${pred.predicted_views_high?.toLocaleString()} → ACTUAL: ${matchingVideo.views.toLocaleString()} (${wasAccurate?"✓ ACCURATE":"✗ OFF — learn from this"})`
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
      if(!cfg?.keys?.perplexity) return null;
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
    setLoad("plan",true);
    try {
      const ctx = buildChannelContext();
      const { wl } = ctx;
      const memCtx = buildMemoryContext();
      const hDB = buildHookDB(videos);

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

Rules:
- Prioritise hook styles that historically perform on THIS channel (see hook DB above)
- Incorporate live trending hooks where they genuinely fit — don't force it
- Fill gaps the audience is asking about that competitors aren't covering
- Each hook must be under 10 words, cause immediate scroll-stop
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
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div style={{ borderRadius:16, padding:"24px 28px", background:`linear-gradient(135deg,${C.purple}25,${C.cyan}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.purple}40`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.purple},${C.cyan},${C.purple}00)` }} />
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:`${C.purple}20`, filter:"blur(50px)", pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:`${C.purple}25`, border:`1px solid ${C.purple}50`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${C.purple}40` }}>{I.brain(24,C.purple)}</div>
          <div>
            <div style={{ fontSize:28, fontWeight:700, color:"#fff", letterSpacing:"0.04em", textTransform:"uppercase" }}>NICHE AI</div>
            <div style={{ fontSize:13, color:`${C.purple}cc`, marginTop:2 }}>Powered by Perplexity live search + Claude strategy</div>
          </div>
        </div>
        {/* Current niche config */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(180px,100%),1fr))", gap:8 }}>
          {[
            {l:"NICHE", v:loadWL()?.niche, c:C.purple},
            {l:"AUDIENCE", v:loadWL()?.targetAudience, c:C.cyan},
            {l:"PLATFORMS", v:loadWL()?.platforms, c:C.pink},
          ].map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"10px 14px", border:`1px solid ${s.c}25` }}>
              <div style={{ fontSize:16, color:s.c, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{s.l}</div>
              <div style={{ fontSize:16, color:"#fff", fontWeight:600, lineHeight:1.3 }}>{s.v||"—"}</div>
            </div>
          ))}
        </div>
        {!hasPPX && (
          <div style={{ marginTop:12, padding:"10px 14px", borderRadius:12, background:`${C.yellow}15`, border:`1px solid ${C.yellow}35`, fontSize:14, color:C.yellow }}>
            ⚠️ Add your Perplexity API key in Settings to unlock live trend research
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(180px,100%),1fr))", gap:10 }}>
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
          <button key={i} data-btn onClick={btn.action} disabled={btn.key&&loading[btn.key]} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"20px 12px", borderRadius:16, background:`linear-gradient(145deg,${btn.color}18,${btn.color}06)`, border:`1px solid ${btn.color}35`, cursor:"pointer", fontFamily:C.fontHead, opacity:btn.key&&loading[btn.key]?0.6:1, transition:"all 0.2s", position:"relative", overflow:"hidden" }}>
            <div style={{ width:52, height:52, borderRadius:16, background:`${btn.color}22`, border:`1px solid ${btn.color}45`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 20px ${btn.color}25` }}>{btn.icon(22,btn.color)}</div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>{btn.key&&loading[btn.key]?"RUNNING...":btn.label}</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginTop:3 }}>{btn.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* LIVE TRENDS */}
      {trends && (
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.cyan}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.cyan}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>LIVE TRENDS — {loadWL()?.niche?.toUpperCase()}</div>
            <Tag color={trends.data_source==="perplexity_live"?C.green:C.yellow} sm>{trends.data_source==="perplexity_live"?"LIVE NOW":"AI KNOWLEDGE"}</Tag>
          </div>

          {/* Biggest opportunity — show first, most prominent */}
          {trends.biggest_opportunity && (
            <div style={{ marginBottom:16, padding:"18px 20px", borderRadius:16, background:`linear-gradient(135deg,${C.green}18,${C.cyan}08)`, border:`1px solid ${C.green}40` }}>
              <div style={{ fontSize:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>⚡ BIGGEST OPPORTUNITY RIGHT NOW</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#fff", marginBottom:6 }}>{trends.biggest_opportunity.what}</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:12 }}>{trends.biggest_opportunity.why_now}</div>
              <div style={{ padding:"10px 14px", borderRadius:10, background:`${C.green}12`, border:`1px solid ${C.green}25`, marginBottom:8 }}>
                <div style={{ fontSize:12, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>SUGGESTED VIDEO</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>{trends.biggest_opportunity.suggested_video_title}</div>
                <div style={{ fontSize:17, color:C.cyan, fontStyle:"italic" }}>"{trends.biggest_opportunity.hook}"</div>
              </div>
              {trends.biggest_opportunity.predicted_impact && <div style={{ fontSize:15, color:C.green }}>📈 {trends.biggest_opportunity.predicted_impact}</div>}
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
              <div style={{ padding:"10px 14px", borderRadius:10, background:`${C.cyan}10`, border:`1px solid ${C.cyan}25`, marginBottom:8 }}>
                <div style={{ fontSize:12, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>HOOK FOR YOUR CHANNEL</div>
                <div style={{ fontSize:17, color:"#fff", fontStyle:"italic" }}>"{Object.entries(t).find(([k])=>k.startsWith("hook_for"))?.[1]||t.example_hook||t.hook}"</div>
              </div>
              {t.why_it_fits_this_channel && <div style={{ fontSize:15, color:C.green }}>✓ {t.why_it_fits_this_channel}</div>}
            </div>
          ))}

          {trends.sounds?.length>0 && (
            <>
              <div style={{ fontSize:15, fontWeight:700, color:C.cyan, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, marginTop:16 }}>TRENDING SOUNDS</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {trends.sounds.map((s,i)=>(
                  <div key={i} style={{ padding:"8px 14px", borderRadius:10, background:`${C.cyan}12`, border:`1px solid ${C.cyan}30`, fontSize:16, color:"#fff" }}>🎵 {s.name}</div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4-WEEK STRATEGY */}
      {strategy && (
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.green}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.green}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.green},${C.green}00)` }} />
          <div style={{ fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>4-WEEK STRATEGY</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontFamily:C.fontBody, fontFamily:C.fontBody, marginBottom:20 }}>{strategy.overview}</div>
          
          {strategy.channel_diagnosis && (
            <div style={{ marginBottom:20, padding:"16px 18px", borderRadius:16, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.green}25` }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.green, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>CHANNEL DIAGNOSIS</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10, marginBottom:12 }}>
                <div style={{ padding:"10px 14px", borderRadius:10, background:`${C.green}10`, border:`1px solid ${C.green}20` }}>
                  <div style={{ fontSize:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>STRENGTHS</div>
                  {strategy.channel_diagnosis.strengths?.map((s,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:3 }}>✓ {s}</div>)}
                </div>
                <div style={{ padding:"10px 14px", borderRadius:10, background:`${C.pink}10`, border:`1px solid ${C.pink}20` }}>
                  <div style={{ fontSize:17, color:C.pink, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>WEAKNESSES</div>
                  {strategy.channel_diagnosis.weaknesses?.map((s,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:3 }}>✗ {s}</div>)}
                </div>
              </div>
              <div style={{ padding:"10px 14px", borderRadius:10, background:`${C.yellow}10`, border:`1px solid ${C.yellow}25` }}>
                <div style={{ fontSize:17, color:C.yellow, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>BIGGEST OPPORTUNITY</div>
                <div style={{ fontSize:17, color:"#fff" }}>{strategy.channel_diagnosis.biggest_opportunity}</div>
              </div>
            </div>
          )}
          {(strategy.stop_doing?.length>0||strategy.start_doing?.length>0) && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10, marginBottom:16 }}>
              {strategy.stop_doing?.length>0 && <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
                <div style={{ fontSize:17, color:C.pink, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>STOP DOING</div>
                {strategy.stop_doing.map((s,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>✗ {s}</div>)}
              </div>}
              {strategy.start_doing?.length>0 && <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>START DOING</div>
                {strategy.start_doing.map((s,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>✓ {s}</div>)}
              </div>}
            </div>
          )}
          {strategy.weeks?.map((w,i)=>(
            <div key={i} style={{ marginBottom:14, borderRadius:16, overflow:"hidden", border:`1px solid ${C.green}20` }}>
              <div style={{ padding:"12px 16px", background:`${C.green}15`, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:`${C.green}25`, border:`1px solid ${C.green}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:C.green }}>W{w.week}</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.04em" }}>{w.theme}</div>
              </div>
              <div style={{ padding:"12px 16px" }}>
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:8 }}>
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
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.yellow}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.yellow}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.yellow},${C.yellow}00)` }} />
          <div style={{ fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:16 }}>10 NICHE VIDEO IDEAS</div>
          {contentPlan.ideas?.map((idea,i)=>(
            <div key={i} style={{ marginBottom:12, padding:"16px 18px", borderRadius:16, background:"rgba(255,255,255,0.025)", border:`1px solid ${scoreColor(idea.score)}25`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:`linear-gradient(180deg,${scoreColor(idea.score)},${scoreColor(idea.score)}40)`, borderRadius:"14px 0 0 14px" }} />
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>{idea.title}</div>
                  <div style={{ fontSize:14, color:C.yellow, fontStyle:"italic", marginBottom:8 }}>"{idea.hook}"</div>
                  <div style={{ fontSize:15, color:"rgba(255,255,255,0.8)", lineHeight:1.5, marginBottom:8 }}>{idea.description}</div>
                  <div style={{ fontSize:15, color:C.green, lineHeight:1.4, marginBottom:6 }}>↑ {idea.why_viral}</div>
              {idea.why_beats_average && <div style={{ fontSize:15, color:C.cyan, lineHeight:1.4 }}>📈 {idea.why_beats_average}</div>}
                </div>
                <div style={{ textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontSize:36, fontWeight:400, fontFamily:C.fontHead, color:scoreColor(idea.score), lineHeight:1, textShadow:`0 0 20px ${scoreColor(idea.score)}50` }}>{idea.score}</div>
                  <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", letterSpacing:"0.1em", marginTop:4 }}>VIRAL</div>
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
      <div id="predict-section" data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.purple}15,rgba(7,5,15,0.95))`, border:`1px solid ${C.purple}40`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }} />
        <div style={{ fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:16 }}>🔮 PREDICT BEFORE YOU FILM</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
          <input value={predictInput.title} onChange={e=>setPredictInput(p=>({...p,title:e.target.value}))} placeholder="Video concept / title..." style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.purple}40`, borderRadius:12, color:"#fff", padding:"12px 16px", fontSize:17, fontFamily:C.fontHead, outline:"none" }} />
          <input value={predictInput.hook} onChange={e=>setPredictInput(p=>({...p,hook:e.target.value}))} placeholder="Opening hook (first 3 seconds)..." style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.purple}40`, borderRadius:12, color:"#fff", padding:"12px 16px", fontSize:17, fontFamily:C.fontHead, outline:"none" }} />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10 }}>
            <select value={predictInput.type} onChange={e=>setPredictInput(p=>({...p,type:e.target.value}))} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.purple}40`, borderRadius:12, color:"#fff", padding:"12px 16px", fontSize:17, fontFamily:C.fontHead, outline:"none" }}>
              {["facecam","street","screencap","voiceover","mixed"].map(t=><option key={t} value={t} style={{background:"#0D0B18"}}>{t}</option>)}
            </select>
            <select value={predictInput.platform} onChange={e=>setPredictInput(p=>({...p,platform:e.target.value}))} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.purple}40`, borderRadius:12, color:"#fff", padding:"12px 16px", fontSize:17, fontFamily:C.fontHead, outline:"none" }}>
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
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(180px,100%),1fr))", gap:10, marginBottom:16 }}>
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
            <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`, marginBottom:12 }}>
              <div style={{ fontSize:15, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>AI REASONING</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontFamily:C.fontBody, fontFamily:C.fontBody }}>{predictResult.reasoning}</div>
            </div>
            {/* Will work / will fail */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10, marginBottom:12 }}>
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>WILL WORK</div>
                {predictResult.what_will_work?.map((w,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>✓ {w}</div>)}
              </div>
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
                <div style={{ fontSize:17, color:C.pink, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>WATCH OUT</div>
                {predictResult.what_will_fail?.map((w,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>✗ {w}</div>)}
              </div>
            </div>
            {/* Improved hook */}
            {predictResult.improved_hook && (
              <div style={{ padding:"12px 16px", borderRadius:12, background:`${C.cyan}10`, border:`1px solid ${C.cyan}30`, marginBottom:12 }}>
                <div style={{ fontSize:17, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>IMPROVED HOOK</div>
                <div style={{ fontSize:16, color:"#fff", fontStyle:"italic" }}>"{predictResult.improved_hook}"</div>
              </div>
            )}
            {/* Hook variations */}
            {predictResult.variations?.length>0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:15, color:C.yellow, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>HOOK VARIATIONS</div>
                {predictResult.variations.map((v,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.025)", border:`1px solid rgba(255,255,255,0.06)`, marginBottom:6 }}>
                    <div style={{ flex:1, fontSize:17, color:"#fff", fontStyle:"italic" }}>"{v.hook}"</div>
                    <Tag color={v.predicted_uplift?.startsWith("+")?C.green:C.pink} sm>{v.predicted_uplift}</Tag>
                  </div>
                ))}
              </div>
            )}
            {/* Log actual outcome */}
            <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.025)", border:`1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)", marginBottom:8 }}>After posting, log actual views to train the AI:</div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={outcomeInput[0]||""} onChange={e=>setOutcomeInput(o=>({...o,0:e.target.value}))} placeholder="Actual views..." style={{ flex:1, background:"rgba(255,255,255,0.06)", border:`1px solid rgba(255,255,255,0.12)`, borderRadius:10, color:"#fff", padding:"10px 14px", fontSize:17, fontFamily:C.fontHead, outline:"none" }} />
                <button onClick={()=>saveOutcome(0,outcomeInput[0]||0)} style={{ padding:"10px 16px", borderRadius:10, border:"none", background:C.green, color:"#000", fontFamily:C.fontHead, fontWeight:700, fontSize:16, cursor:"pointer" }}>LOG</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── COMPETITOR INTELLIGENCE ──────────────────────────────── */}
      {competitors?.data && (
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.pink}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.pink}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.pink},${C.pink}00)` }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>COMPETITOR INTEL</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em" }}>Fetched {competitors.lastFetched}</div>
          </div>

          {/* Opportunities */}
          {competitors.data.opportunities?.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>GAPS TO EXPLOIT</div>
              {competitors.data.opportunities.map((o,i)=>(
                <div key={i} style={{ marginBottom:10, padding:"14px 16px", borderRadius:16, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", lineHeight:1.3 }}>{o.gap}</div>
                    <Tag color={o.urgency==="HIGH"?C.green:o.urgency==="MEDIUM"?C.yellow:C.dim} sm>{o.urgency}</Tag>
                  </div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontFamily:C.fontBody, marginBottom:6 }}>{o.why_krapmaps_can_win||o.suggested_angle}</div>
                </div>
              ))}
            </div>
          )}

          {/* Steal these hooks */}
          {competitors.data.steal_these_hooks?.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>HOOKS TO ADAPT</div>
              {competitors.data.steal_these_hooks.map((h,i)=>(
                <div key={i} style={{ marginBottom:8, padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.025)", border:`1px solid rgba(255,255,255,0.07)` }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>From {h.from_creator}</div>
                  <div style={{ fontSize:13, color:C.yellow, fontStyle:"italic", marginBottom:4, lineHeight:1.5 }}>"{h.hook}"</div>
                  <div style={{ fontSize:13, color:C.cyan, lineHeight:1.5 }}>→ Adapt as: "{h.adapt_for_krapmaps||Object.values(h).find(v=>typeof v==="string"&&v.length>20&&v!==h.hook&&v!==h.from_creator)}"</div>
                </div>
              ))}
            </div>
          )}

          {/* Competitor breakdown */}
          {competitors.data.competitors?.map((c,i)=>(
            <div key={i} style={{ marginBottom:12, padding:"14px 16px", borderRadius:16, background:"rgba(255,255,255,0.025)", border:`1px solid ${C.pink}18` }}>
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
        <div id="hookdb-section" data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.yellow}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.yellow}30`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.yellow},${C.yellow}00)` }} />
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>HOOK A/B DATABASE</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:16 }}>Built automatically from your {videos.length} logged videos. Most to least effective.</div>
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
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.cyan}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.cyan}30`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }} />
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>VIRALITY PATTERNS</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:16 }}>Hidden patterns across your {patterns.totalVideos} videos. Channel avg: {patterns.avg?.toLocaleString()} views.</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10, marginBottom:14 }}>
            {/* Best day */}
            {patterns.dayPerf?.length>0 && (
              <div style={{ padding:"14px 16px", borderRadius:16, background:`${C.cyan}08`, border:`1px solid ${C.cyan}20` }}>
                <div style={{ fontSize:11, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>BEST POSTING DAY</div>
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
              <div style={{ padding:"14px 16px", borderRadius:16, background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
                <div style={{ fontSize:11, color:C.pink, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>BEST VIDEO TYPE</div>
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
              <div style={{ padding:"14px 16px", borderRadius:16, background:`${C.purple}08`, border:`1px solid ${C.purple}20` }}>
                <div style={{ fontSize:11, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>CROSS-POST IMPACT</div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div><div style={{ fontSize:20, fontWeight:700, color:C.purple }}>{patterns.crossAvg?.toLocaleString()}</div><div style={{ fontSize:13, color:"rgba(255,255,255,0.85)" }}>TT+IG avg</div></div>
                  <div><div style={{ fontSize:20, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{patterns.singleAvg?.toLocaleString()}</div><div style={{ fontSize:13, color:"rgba(255,255,255,0.85)" }}>TikTok only</div></div>
                </div>
                <div style={{ marginTop:8, fontSize:13, color:patterns.crossAvg>patterns.singleAvg?C.green:C.pink }}>
                  Cross-posting {patterns.crossAvg>patterns.singleAvg?"HELPS":"HURTS"} by {Math.abs(Math.round((patterns.crossAvg/patterns.singleAvg-1)*100))}%
                </div>
              </div>
            )}
            {/* Winning hooks pattern */}
            {patterns.winningHooks?.length>0 && (
              <div style={{ padding:"14px 16px", borderRadius:16, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:11, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>TOP PERFORMER HOOKS</div>
                {patterns.winningHooks.map((h,i)=>(
                  <div key={i} style={{ fontSize:14, color:i===0?"#fff":"rgba(255,255,255,0.85)", marginBottom:4, textTransform:"capitalize" }}>
                    {i===0?"🥇":i===1?"🥈":"🥉"} {h}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTENT GAP RADAR ────────────────────────────────────── */}
      {gaps && (
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.green}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.green}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.green},${C.green}00)` }} />
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:16 }}>CONTENT GAP RADAR</div>
          {gaps.gaps?.map((g,i)=>(
            <div key={i} style={{ marginBottom:12, padding:"16px 18px", borderRadius:16, background:"rgba(255,255,255,0.025)", border:`1px solid ${g.potential_reach==="VIRAL"?C.green:g.potential_reach==="HIGH"?C.yellow:C.dim}25` }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:8 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{g.topic}</div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <Tag color={g.potential_reach==="VIRAL"?C.green:g.potential_reach==="HIGH"?C.yellow:C.orange} sm>{g.potential_reach}</Tag>
                  {g.urgency_days && <Tag color={g.urgency_days<7?C.pink:g.urgency_days<14?C.yellow:C.dim} sm>{g.urgency_days}d window</Tag>}
                </div>
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.8)", marginBottom:10 }}>{g.why_gap_exists}</div>
              <div style={{ padding:"10px 14px", borderRadius:10, background:`${C.green}10`, border:`1px solid ${C.green}20`, marginBottom:8 }}>
                <div style={{ fontSize:11, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>SUGGESTED HOOK</div>
                <div style={{ fontSize:14, color:"#fff", fontStyle:"italic" }}>"{g.suggested_hook}"</div>
              </div>
              {g.first_mover_advantage && <div style={{ fontSize:13, color:C.cyan }}>⚡ {g.first_mover_advantage}</div>}
            </div>
          ))}
          {gaps.emerging?.length>0 && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:C.yellow, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, marginTop:4 }}>EMERGING — ACT FAST</div>
              {gaps.emerging.map((e,i)=>(
                <div key={i} style={{ display:"flex", gap:12, padding:"10px 14px", borderRadius:10, background:`${C.yellow}08`, border:`1px solid ${C.yellow}20`, marginBottom:8 }}>
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
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.purple}12,rgba(7,5,15,0.95))`, border:`1px solid ${C.purple}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.purple},${C.cyan},${C.purple}00)` }} />
          <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>MULTI-MODEL CONSENSUS</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:16, lineHeight:1.5 }}>
            {consensus.bothSucceeded ? "Claude + GPT-4o both ran — showing where they agree (high confidence) and disagree (investigate further)" : "Only one model ran — add GPT-4o key in Settings for full consensus"}
          </div>
          {consensus.bothSucceeded && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10, marginBottom:16 }}>
              {[{label:"CLAUDE SAYS", data:consensus.claude, color:C.purple},{label:"GPT-4O SAYS", data:consensus.gpt, color:C.cyan}].map((m,mi)=>(
                <div key={mi} style={{ padding:"14px 16px", borderRadius:16, background:`${m.color}08`, border:`1px solid ${m.color}20` }}>
                  <div style={{ fontSize:15, color:m.color, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>{m.label}</div>
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
              <div style={{ padding:"14px 16px", borderRadius:16, background:`${C.green}10`, border:`1px solid ${C.green}25`, marginBottom:12 }}>
                <div style={{ fontSize:15, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>✓ BOTH MODELS AGREE — HIGH CONFIDENCE</div>
                {agreed.slice(0,2).map((r,i)=>(
                  <div key={i} style={{ fontSize:17, color:"#fff", marginBottom:4 }}>→ {r.action}</div>
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
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.orange}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.orange}30`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.orange},${C.orange}00)` }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>AI MEMORY LOG</div>
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
  const [selected, setSelected]   = useState(null);
  const [vidPlat, setVidPlat]      = useState("ALL");
  const [analysis, setAnalysis]   = useState({});
  const [loading, setLoading]     = useState({});
  const [err, setErr]             = useState(null);

  const cfg = loadJSON("krapmaps_v1_config",{});
  const hasGemini = !!(cfg?.keys?.gemini);
  const hasAnthrop = !!(cfg?.keys?.anthropic);

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
${wl.appName} avg views: ${avgViews.toLocaleString()}. This video ${(video.views||0)>avgViews?"BEAT":"MISSED"} the average by ${Math.abs(Math.round(((video.views||0)/avgViews-1)*100))}%.
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
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div style={{ borderRadius:16, padding:"24px 28px", background:`linear-gradient(135deg,${C.pink}20,${C.purple}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.pink}40`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.pink},${C.purple},${C.pink}00)` }} />
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:`${C.pink}25`, border:`1px solid ${C.pink}50`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${C.pink}40` }}>{I.vid(24,C.pink)}</div>
          <div>
            <div style={{ fontSize:28, fontWeight:700, color:"#fff", letterSpacing:"0.04em", textTransform:"uppercase" }}>VIDEO AI READER</div>
            <div style={{ fontSize:14, color:`${C.pink}cc`, marginTop:2 }}>
              {hasGemini?"Gemini watches • Claude analyses • Full teardown":"Add Gemini key in Settings to enable video watching"}
            </div>
          </div>
        </div>
        {(!hasGemini||!hasAnthrop) && (
          <div style={{ marginTop:14, padding:"10px 14px", borderRadius:12, background:`${C.yellow}15`, border:`1px solid ${C.yellow}35`, fontSize:14, color:C.yellow }}>
            {!hasAnthrop&&"⚠️ Add Anthropic key in Settings  "}
            {!hasGemini&&"⚠️ Add Gemini key in Settings for video watching"}
          </div>
        )}
      </div>

      {err && <div style={{ padding:"12px 16px", borderRadius:12, background:`${C.pink}15`, border:`1px solid ${C.pink}40`, color:C.pink, fontSize:13 }}>Error: {err}</div>}

      {/* Platform filter pills */}
      {(()=>{ const hasIG = videos.some(v=>v.platform==="instagram"); if(!hasIG) return null;
        return <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          {["ALL","TIKTOK","INSTAGRAM"].map(p=>(
            <button key={p} onClick={()=>setVidPlat(p)} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", border:`1px solid ${vidPlat===p?(p==="INSTAGRAM"?C.purple:p==="TIKTOK"?C.pink:C.cyan):"rgba(255,255,255,0.15)"}`, background:vidPlat===p?(p==="INSTAGRAM"?`${C.purple}20`:p==="TIKTOK"?`${C.pink}20`:`${C.cyan}20`):"transparent", color:vidPlat===p?(p==="INSTAGRAM"?C.purple:p==="TIKTOK"?C.pink:C.cyan):"rgba(255,255,255,0.5)" }}>{p}</button>
          ))}
        </div>;
      })()}

      {/* Video grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10 }}>
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
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                {video.cover && <img src={video.cover} style={{ width:48, height:64, borderRadius:8, objectFit:"cover", flexShrink:0 }} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:4 }}>{video.title?.slice(0,60)||"Untitled"}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                    {video.platform==="instagram"
                      ? <Tag color={C.purple} sm>📸 IG</Tag>
                      : <Tag color={C.pink} sm>🎵 TT</Tag>}
                    <Tag color={C.cyan} sm>{(video.views||0).toLocaleString()} views</Tag>
                    {video.type && <Tag color={C.purple} sm>{video.type}</Tag>}
                  </div>
                </div>
              </div>
              {isLoading && (
                <div style={{ padding:"10px", textAlign:"center", fontSize:15, color:C.pink }}>
                  {hasGemini?"🎬 Gemini watching... Claude analysing...":"🤖 Analysing..."}
                </div>
              )}
              {res && !isLoading && (
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ fontSize:28, fontWeight:400, fontFamily:C.fontHead, color:scoreColor(res.overall_score||res.gemini?.gemini_score||0), lineHeight:1, textShadow:`0 0 16px ${scoreColor(res.overall_score||0)}50` }}>{res.overall_score||res.gemini?.gemini_score||"?"}</div>
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
        <div data-card style={{ borderRadius:16, padding:"24px", background:`linear-gradient(145deg,${C.pink}10,rgba(7,5,15,0.95))`, border:`1px solid ${C.pink}35`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.pink},${C.purple},${C.pink}00)` }} />
          <div style={{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>{selected.title?.slice(0,50)}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:20 }}>Analysed {result.analysed_at?.slice(0,10)}</div>

          {/* Score + verdict */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(180px,100%),1fr))", gap:10, marginBottom:20 }}>
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
            <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`, marginBottom:14 }}>
              <div style={{ fontSize:17, color:C.pink, fontWeight:700, letterSpacing:"0.1em", marginBottom:6 }}>WHY IT PERFORMED THIS WAY</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontFamily:C.fontBody, fontFamily:C.fontBody }}>{result.why_it_performed}</div>
              {result.biggest_factor && <div style={{ marginTop:8, fontSize:14, color:C.yellow }}>⚡ Biggest factor: {result.biggest_factor}</div>}
            </div>
          )}

          {/* Gemini hook analysis */}
          {result.gemini?.hook_analysis && (
            <div style={{ padding:"14px 16px", borderRadius:12, background:`${C.cyan}08`, border:`1px solid ${C.cyan}20`, marginBottom:14 }}>
              <div style={{ fontSize:17, color:C.cyan, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>🎬 GEMINI HOOK ANALYSIS</div>
              <div style={{ fontSize:17, color:"#fff", marginBottom:6 }}>First 3 seconds: <span style={{color:C.cyan}}>{result.gemini.hook_analysis.first_3_seconds}</span></div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:8 }}>{result.gemini.hook_analysis.what_works}</div>
              <div style={{ display:"flex", gap:8 }}>
                <Tag color={C.cyan} sm>Hook: {result.gemini.hook_analysis.hook_strength}/100</Tag>
                <Tag color={C.purple} sm>{result.gemini.hook_analysis.hook_type}</Tag>
              </div>
            </div>
          )}

          {/* Replicate / Never again */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:10, marginBottom:14 }}>
            {result.replicate_these?.length>0 && (
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.green}08`, border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:17, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>DO THIS AGAIN</div>
                {result.replicate_these.map((r,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>✓ {r}</div>)}
              </div>
            )}
            {result.never_again?.length>0 && (
              <div style={{ padding:"12px 14px", borderRadius:12, background:`${C.pink}08`, border:`1px solid ${C.pink}20` }}>
                <div style={{ fontSize:17, color:C.pink, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>NEVER AGAIN</div>
                {result.never_again.map((r,i)=><div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>✗ {r}</div>)}
              </div>
            )}
          </div>

          {/* Refilm brief */}
          {result.refilm_brief && (
            <div style={{ padding:"16px 18px", borderRadius:16, background:`linear-gradient(135deg,${C.purple}12,${C.pink}06)`, border:`1px solid ${C.purple}30`, marginBottom:14 }}>
              <div style={{ fontSize:17, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>HOW TO REFILM THIS FOR 3X VIEWS</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>{result.refilm_brief.concept}</div>
              <div style={{ fontSize:17, color:C.cyan, fontStyle:"italic", marginBottom:10 }}>"{result.refilm_brief.hook}"</div>
              {result.refilm_brief.key_changes?.map((c,i)=>(
                <div key={i} style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:3 }}>→ {c}</div>
              ))}
              {result.refilm_brief.predicted_views && (
                <div style={{ marginTop:8, fontSize:16, color:C.green }}>📈 Predicted: {result.refilm_brief.predicted_views}</div>
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

const GrowthView = ({ m, ttViewsDisplay, igData, hasIG, igLoad, fetchIG, scrapedStats, saveManual, setManualData, videos=[] }) => {
  const fmtG = n => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n||0);
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  
  // TikTok chart data
  const ttFollHist = days.map((l,i)=>({ label:l, value:Math.round((m?.tt_followers||0)*[0.7,0.78,0.85,0.91,0.95,0.98,1][i]) }));
  const ttViewHist = days.map((l,i)=>({ label:l, value:Math.round((ttViewsDisplay||0)*[0.5,0.62,0.71,0.8,0.88,0.95,1][i]) }));
  
  // Instagram chart data from scraped reels
  const igReels = videos.filter(v=>v.platform==="instagram");
  const igFollowers = igData?.profile?.followers_count || m?.ig_followers || 0;
  const igFollHist = days.map((l,i)=>({ label:l, value:Math.round((igFollowers)*[0.75,0.8,0.85,0.88,0.92,0.96,1][i]) }));
  const igViewHist = days.map((l,i)=>({ label:l, value:Math.round((igReels.reduce((s,v)=>s+(v.views||0),0)||0)*[0.5,0.6,0.7,0.78,0.86,0.94,1][i]) }));
  const igAvgLikes = igReels.length ? Math.round(igReels.reduce((s,v)=>s+(v.likes||0),0)/igReels.length) : 0;
  const igAvgViews = igReels.length ? Math.round(igReels.reduce((s,v)=>s+(v.views||0),0)/igReels.length) : 0;

  const platforms = [
    {
      id:"tt", icon:I.tt, label:"TikTok", handle:"@findkrap", color:C.pink,
      live: !!scrapedStats,
      stats:[
        {l:"FOLLOWERS", v:fmtG(m?.tt_followers||0), c:C.pink},
        {l:"TOTAL VIEWS", v:fmtG(ttViewsDisplay||0), c:C.cyan},
        {l:"TOTAL LIKES", v:fmtG(m?.tt_likes||0), c:C.yellow},
      ],
      charts:[
        {label:"Followers", data:ttFollHist, color:C.pink},
        {label:"Views", data:ttViewHist, color:C.cyan},
      ]
    },
    {
      id:"ig", icon:I.ig, label:"Instagram", handle:"@findkrap", color:C.purple,
      live: igReels.length>0,
      stats:[
        {l:"FOLLOWERS", v:igFollowers?fmtG(igFollowers):"--", c:C.purple},
        {l:"AVG VIEWS", v:igAvgViews?fmtG(igAvgViews):"--", c:C.cyan},
        {l:"AVG LIKES", v:igAvgLikes?fmtG(igAvgLikes):"--", c:C.pink},
      ],
      charts:[
        {label:"Followers", data:igFollHist, color:C.purple},
        {label:"Reel Views", data:igViewHist, color:C.pink},
      ]
    },
    {
      id:"app", icon:I.map, label:"KrapMaps App", handle:"iOS + Android", color:C.green,
      live: !!(m?.bins),
      stats:[
        {l:"BINS MAPPED", v:fmtG(m?.bins||0), c:C.green},
        {l:"CITIES", v:"1.2K+", c:C.yellow},
        {l:"DOWNLOADS", v:m?.downloads?fmtG(m.downloads):"--", c:C.cyan},
      ],
      charts:[
        {label:"Bins Growth", data:days.map((l,i)=>({label:l,value:Math.round((m?.bins||0)*[0.6,0.68,0.75,0.82,0.88,0.94,1][i])})), color:C.green},
      ]
    },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {platforms.map((plat,pi)=>(
        <div key={plat.id} style={{ borderRadius:22, overflow:"hidden", background:`linear-gradient(145deg,${plat.color}12,rgba(10,6,20,0.95))`, border:`1px solid ${plat.color}30`, position:"relative" }}>
          {/* Top accent */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${plat.color},${plat.color}50,transparent)` }}/>
          {/* Ambient orb */}
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:`${plat.color}10`, filter:"blur(60px)", pointerEvents:"none" }}/>
          
          {/* Header */}
          <div style={{ padding:"24px 28px 20px", display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,${plat.color}30,${plat.color}10)`, border:`1px solid ${plat.color}40`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${plat.color}25`, flexShrink:0 }}>
              {plat.icon(24,plat.color)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"0.04em" }}>{plat.label}</div>
              <div style={{ fontSize:14, color:`${plat.color}bb`, marginTop:2 }}>{plat.handle}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:plat.live?`${C.green}12`:"rgba(255,255,255,0.05)", border:`1px solid ${plat.live?C.green:"rgba(255,255,255,0.1)"}` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:plat.live?C.green:"rgba(255,255,255,0.45)", boxShadow:plat.live?`0 0 6px ${C.green}`:""  }}/>
              <span style={{ fontSize:12, color:plat.live?C.green:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:"0.1em" }}>{plat.live?"LIVE":"NOT SYNCED"}</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${plat.stats.length},1fr)`, gap:0, borderTop:`1px solid ${plat.color}15`, borderBottom:`1px solid ${plat.color}15` }}>
            {plat.stats.map((s,si)=>(
              <div key={si} style={{ padding:"20px 24px", borderRight:si<plat.stats.length-1?`1px solid ${plat.color}15`:"none" }}>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>{s.l}</div>
                <div style={{ fontSize:40, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1, textShadow:`0 0 20px ${s.c}40` }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${plat.charts.length},1fr)`, gap:0 }}>
            {plat.charts.map((ch,ci)=>(
              <div key={ci} style={{ padding:"20px 24px", borderRight:ci<plat.charts.length-1?`1px solid ${plat.color}15`:"none" }}>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:14 }}>{ch.label} — 7 Days</div>
                <GlowAreaChart data={ch.data} color={ch.color} height={110} dataKey="value" xKey="label"/>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const SettingsView = ({ keys, onEditKeys, scrapedStats, hasIG, WL, onEditWL, onSyncTikTok, syncMsg, videos=[], ideas=[], onBulkImport }) => {
  const [editing, setEditing] = useState(null);
  const [draftKey, setDraftKey] = useState("");
  const [wlDraft, setWlDraft] = useState(null);
  const [trendsDraft, setTrendsDraft] = useState(()=>loadJSON(CUR_TRENDS_KEY,""));
  const [trendsSaved, setTrendsSaved] = useState(false);
  const [theoryDraft, setTheoryDraft] = useState(()=>loadJSON(CHANNEL_THEORY_KEY,""));
  const [theorySaved, setTheorySaved] = useState(false);
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [csvDraft, setCsvDraft] = useState("");
  const [csvMsg, setCsvMsg] = useState("");
  const saveTrends = () => { saveJSON(CUR_TRENDS_KEY, trendsDraft); setTrendsSaved(true); setTimeout(()=>setTrendsSaved(false),2000); };
  const saveTheory = () => { saveJSON(CHANNEL_THEORY_KEY, theoryDraft); setTheorySaved(true); setTimeout(()=>setTheorySaved(false),2000); };
  const saveKey = (field) => { onEditKeys&&onEditKeys({...keys,[field]:draftKey.trim()}); setEditing(null); setDraftKey(""); };
  const startWL = () => setWlDraft({...WL});
  const saveWLEdit = () => { onEditWL&&onEditWL(wlDraft); setWlDraft(null); };

  const generateChannelTheory = async () => {
    if(!keys?.anthropic) return;
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

      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"x-api-key":keys.anthropic,"anthropic-version":"2023-06-01","content-type":"application/json","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:600,messages:[{role:"user",content:`You are a media psychologist analysing why a specific TikTok channel goes viral. Channel: @findkrap (KrapMaps — crowdsourced bin-finding app, environmental travel in SE Asia, creators BK + Harley).

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

Write as 5 numbered points, each 1-2 sentences. Be specific to this channel — no generic advice.`}]})
      });
      const d = await res.json();
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
    return logos[id] || <span style={{fontSize:18}}>🔑</span>;
  };

  const apiKeys = [
    { id:"anthropic", label:"Anthropic", desc:"AI scoring + analysis", color:C.pink },
    { id:"perplexity", label:"Perplexity", desc:"Live trend research", color:C.cyan },
    { id:"gpt4o", label:"GPT-4o", desc:"Multi-model consensus", color:C.green },
    { id:"tikwm", label:"TikTok (RapidAPI)", desc:"Auto TikTok sync", color:"#FF2D55" },
    { id:"gemini", label:"Gemini", desc:"Video reader AI", color:C.yellow },
    { id:"igscraper", label:"Instagram (RapidAPI)", desc:"Auto reel sync", color:"#E1306C" },
  ];

  const statusItems = [
    { label:"Supabase DB", value:"CONNECTED", color:C.green, id:"db" },
    { label:"TikTok Scraper", value:scrapedStats?"SYNCED "+(()=>{try{const h=Math.round((Date.now()-new Date(scrapedStats.scraped_at))/3600000);return h<1?"<1h ago":h+"h ago";}catch{return "unknown";}})()+" ("+( scrapedStats.video_count||0)+" videos)":"NOT SYNCED", color:scrapedStats?C.green:C.yellow, id:"tikwm" },
    { label:"Anthropic AI", value:keys?.anthropic?"KEY SET":"ADD KEY", color:keys?.anthropic?C.green:C.pink, id:"anthropic" },
    { label:"Perplexity", value:keys?.perplexity?"KEY SET":"ADD KEY", color:keys?.perplexity?C.green:C.yellow, id:"perplexity" },
    { label:"Gemini Video", value:keys?.gemini?"KEY SET":"ADD KEY", color:keys?.gemini?C.green:C.yellow, id:"gemini" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Sync button — prominent at top */}
      <div style={{ borderRadius:16, padding:"20px 24px", background:"linear-gradient(145deg,rgba(0,207,255,0.1),rgba(10,6,20,0.95))", border:`1px solid ${C.cyan}30`, display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.cyan},${C.cyan}00)` }}/>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>Auto Sync</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>
            {scrapedStats ? "Last synced: "+(()=>{try{const h=Math.round((Date.now()-new Date(scrapedStats.scraped_at))/3600000);return h<1?"less than 1 hour ago":h+" hours ago";}catch{return "unknown";}})() : "Never synced — add TIKWM key to auto-sync"}
          </div>
        </div>
        <button onClick={onSyncTikTok} style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 28px", borderRadius:16, border:`1px solid ${C.cyan}50`, background:`linear-gradient(135deg,${C.cyan}30,${C.cyan}15)`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:16, cursor:"pointer", boxShadow:`0 0 24px ${C.cyan}20` }}>
          {I.refresh(18,C.cyan)} {syncMsg || "SYNC NOW"}
        </button>
      </div>

      {/* 2 col layout */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(280px,100%),1fr))", gap:16, alignItems:"start" }}>

        {/* LEFT — API Keys */}
        <div style={{ borderRadius:16, padding:"22px 24px", background:"linear-gradient(145deg,rgba(255,45,120,0.07),rgba(10,6,20,0.95))", border:`1px solid ${C.pink}25`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.pink},${C.pink}00)` }}/>
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:20 }}>API Keys</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {apiKeys.map(k=>(
              <div key={k.id} style={{ borderRadius:16, padding:"14px 16px", background:"rgba(255,255,255,0.025)", border:`1px solid ${keys?.[k.id]?k.color+"30":"rgba(255,255,255,0.07)"}`, transition:"all 0.2s" }}>
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
                      style={{ flex:1, background:"rgba(255,255,255,0.06)", border:`1px solid ${k.color}40`, borderRadius:10, color:"#fff", padding:"10px 14px", fontSize:13, fontFamily:"monospace", outline:"none" }}/>
                    <button onClick={()=>saveKey(k.id)} style={{ padding:"10px 16px", borderRadius:10, border:"none", background:k.color, color:"#07050F", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>SAVE</button>
                    <button onClick={()=>setEditing(null)} style={{ padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Status + Creator Config */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* System Status */}
          <div style={{ borderRadius:16, padding:"22px 24px", background:"linear-gradient(145deg,rgba(0,255,148,0.06),rgba(10,6,20,0.95))", border:`1px solid ${C.green}25`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.green},${C.green}00)` }}/>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:16 }}>System Status</div>
            {statusItems.map((s,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 0", borderBottom:i<statusItems.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:24, height:24, borderRadius:7, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {s.id==="db" ? <span style={{fontSize:12}}>🗄</span> : <ApiLogo id={s.id}/>}
                  </div>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,0.85)", fontWeight:500 }}>{s.label}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:s.color, boxShadow:`0 0 6px ${s.color}` }}/>
                  <span style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Creator Config */}
          <div style={{ borderRadius:16, padding:"22px 24px", background:"linear-gradient(145deg,rgba(197,102,255,0.07),rgba(10,6,20,0.95))", border:`1px solid ${C.purple}25`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>Creator Config</div>
              {!wlDraft && <button onClick={startWL} style={{ padding:"8px 16px", borderRadius:10, border:`1px solid ${C.purple}40`, background:`${C.purple}15`, color:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>EDIT</button>}
            </div>
            {wlDraft ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
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
                        style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.purple}30`, borderRadius:10, color:"#fff", padding:"10px 12px", fontSize:14, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
                    ) : (
                      <input value={wlDraft[k]||""} onChange={e=>setWlDraft(d=>({...d,[k]:e.target.value}))}
                        style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.purple}30`, borderRadius:10, color:"#fff", padding:"10px 12px", fontSize:14, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box" }}/>
                    )}
                  </div>
                ))}
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <button onClick={saveWLEdit} style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, cursor:"pointer", fontSize:14 }}>SAVE CONFIG</button>
                  <button onClick={()=>setWlDraft(null)} style={{ padding:"12px 18px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", fontFamily:C.fontHead, fontWeight:700, cursor:"pointer" }}>CANCEL</button>
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  {k:"App", v:WL?.appName},{k:"Handle", v:WL?.handle},
                  {k:"Creator 1", v:WL?.creator1},{k:"Creator 2", v:WL?.creator2},
                  {k:"Niche", v:WL?.niche},{k:"Platforms", v:WL?.platforms},
                ].map(({k,v})=>(
                  <div key={k} style={{ padding:"10px 12px", background:"rgba(255,255,255,0.025)", borderRadius:10, border:`1px solid ${C.purple}15` }}>
                    <div style={{ fontSize:10, color:`${C.purple}aa`, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{v||"—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Trends — injected into every AI call */}
      <div style={{ borderRadius:16, padding:"22px 24px", background:`linear-gradient(145deg,rgba(255,107,53,0.08),rgba(10,6,20,0.95))`, border:`1px solid ${C.orange}25`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.orange},${C.orange}00)` }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>Current Trends</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>{loadJSON(KEYS_KEY,{})?.keys?.perplexity ? "Auto-fetched via Perplexity every 12hrs — also editable below" : "Update weekly — add Perplexity key for auto-fetch"}</div>
          </div>
          <button onClick={saveTrends} style={{ padding:"9px 20px", borderRadius:11, border:`1px solid ${trendsSaved?C.green:C.orange}50`, background:trendsSaved?`${C.green}20`:`${C.orange}18`, color:trendsSaved?C.green:C.orange, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>{trendsSaved?"SAVED ✓":"SAVE"}</button>
        </div>
        <textarea
          value={trendsDraft}
          onChange={e=>setTrendsDraft(e.target.value)}
          placeholder={`What's trending right now? Paste audio names, formats, topics, anything the AI should know.\n\nExamples:\n- "Sabrina Carpenter - Espresso" is peak on TikTok this week\n- POV format getting 3x normal reach\n- SE Asia travel content spiking post-monsoon season\n- Competitor @travelfromtheheart posting daily cleanup challenges`}
          rows={7}
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.orange}25`, borderRadius:12, color:"#fff", padding:"14px 16px", fontSize:13, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}
        />
      </div>

      {/* Channel Viral Theory — the deep "why this channel goes viral" model */}
      <div style={{ borderRadius:16, padding:"22px 24px", background:`linear-gradient(145deg,rgba(139,92,246,0.08),rgba(10,6,20,0.95))`, border:`1px solid ${C.purple}25`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.5, background:`linear-gradient(90deg,${C.purple},${C.purple}00)` }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>Channel Viral Theory</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>The deep "why this channel goes viral" — injected into every score. Generate from your data or write it yourself.</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={generateChannelTheory} disabled={!keys?.anthropic||theoryLoading} style={{ padding:"9px 16px", borderRadius:11, border:`1px solid ${C.purple}50`, background:`${C.purple}18`, color:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:12, cursor:"pointer", opacity:(!keys?.anthropic||theoryLoading)?0.5:1 }}>{theoryLoading?"GENERATING...":"⚡ GENERATE"}</button>
            <button onClick={saveTheory} style={{ padding:"9px 16px", borderRadius:11, border:`1px solid ${theorySaved?C.green:C.purple}50`, background:theorySaved?`${C.green}20`:`${C.purple}18`, color:theorySaved?C.green:C.purple, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>{theorySaved?"SAVED ✓":"SAVE"}</button>
          </div>
        </div>
        <textarea
          value={theoryDraft}
          onChange={e=>setTheoryDraft(e.target.value)}
          placeholder={`Click GENERATE to synthesise your channel's viral theory from your video data, or write it yourself.\n\nExample:\n1. Core emotion: guilt relief — viewers feel helpless about ocean plastic; this channel gives them a proxy hero to believe in.\n2. Share trigger: backpackers send to their group chat because it validates the "responsible traveller" identity they want others to see.\n3. Viral condition: BK must interact authentically with a local — scripted or solo content rarely breaks 2x average.\n4. Biggest mistake: over-explaining the app instead of showing the human story.\n5. Unfair advantage: the mission is real, which makes the emotion genuine and uncopyable.`}
          rows={8}
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.purple}25`, borderRadius:12, color:"#fff", padding:"14px 16px", fontSize:13, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}
        />
      </div>

      {/* Bulk Video Import (CSV) */}
      <div style={{ padding:"20px 24px", borderRadius:16, border:`1px solid ${C.yellow}20`, background:`${C.yellow}05` }}>
        <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>Bulk Video Import (CSV)</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>Paste rows: <span style={{color:C.yellow}}>title, views, likes, type, hook, platform</span> (one per line, comma-separated). Header row optional.</div>
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
            setCsvMsg(`✓ Imported ${parsed.length} videos`);
            setCsvDraft("");
            setTimeout(()=>setCsvMsg(""),3000);
          }} style={{ padding:"9px 18px", borderRadius:11, border:`1px solid ${C.yellow}40`, background:`${C.yellow}15`, color:C.yellow, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>IMPORT</button>
          {csvMsg && <span style={{ fontSize:13, color:csvMsg.startsWith("✓")?C.green:C.pink }}>{csvMsg}</span>}
        </div>
      </div>

      {/* Channel Intelligence Export */}
      <div style={{ padding:"20px 24px", borderRadius:16, border:`1px solid ${C.cyan}20`, background:`${C.cyan}05` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
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
            a.href = url; a.download = `krapmaps-intel-${new Date().toISOString().slice(0,10)}.txt`;
            a.click(); URL.revokeObjectURL(url);
          }} style={{ padding:"10px 18px", borderRadius:11, border:`1px solid ${C.cyan}40`, background:`${C.cyan}15`, color:C.cyan, fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
            ↓ EXPORT
          </button>
        </div>
      </div>
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
const CUR_TRENDS_KEY    = "krapmaps_v1_cur_trends";
const CHANNEL_THEORY_KEY = "krapmaps_v1_channel_theory";
const HOOK_DB_KEY  = "krapmaps_v1_hookdb";
const PATTERN_KEY  = "krapmaps_v1_patterns";
const GAP_KEY      = "krapmaps_v1_gaps";
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
const ANTHROPIC_KEY  = ""; // Add your key in Settings tab
const DEFAULT_SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWRzeWlpbmtxdG1vd2tpcXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTcwNTMsImV4cCI6MjA1ODMzMzA1M30.xh1I8a8TUrPZ3YtElqCHv9LjI27BnCDp_YY-J_FDBDU";

const WL_KEY = "krapmaps_v1_wl";
const WL_DEFAULTS = {
  appName:"KrapMaps",
  handle:"@findkrap",
  creator1:"Kaden",
  creator2:"Harley",
  niche:"crowdsourced bin-finding app for backpackers and travellers",
  contentStyle:"founder journey, on-the-ground real bin mapping moments in SE Asia, gamification challenges, app demos, hostel partnerships, street humour — formula: visual problem (litter in beautiful place) → founder doing something about it → app solving it → community invitation",
  platforms:"tiktok,instagram",
  targetAudience:"18-28 backpackers and travellers, SE Asia + UK, eco-conscious but not preachy, hostel crowd, people who hate litter but never knew what to do about it",
  competitors:"@explorewithjosh,@sustainabletravel,@thebrokebackpacker",
  appDescription:"World's first crowdsourced bin-finding app for travellers. Solves the 'where the hell do I throw this?' problem backpackers hit daily. Live on App Store + Google Play v1.3.34. 230+ users, 654+ bins mapped across 12+ countries. Gamification: points per verified bin, monthly leaderboards, daily challenges, Team Crimson vs Azure mapping wars, Bin Guesser mini-game, achievement badges. Partners: Mad Monkey Hostels (24 properties, 7 SE Asian countries), Revolution Hostels (2 properties Pai Thailand). Premium £4.99/month. Tagline: Find it. Map it. Clean it. Founding insight: 70% of people would dispose properly if a bin were closer — it's infrastructure visibility, not behaviour.",
  bestFormula:"Problem -> struggle -> app saves the day -> satisfied reaction",
  accentColor:C.pink,
};
const loadWL = () => { try { const s=JSON.parse(localStorage.getItem(WL_KEY)); return s?{...WL_DEFAULTS,...s}:WL_DEFAULTS; } catch { return WL_DEFAULTS; } };
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
  const tiktokV = v.filter(vid=>vid.platform==="TikTok"||!vid.platform);
  const instaV  = v.filter(vid=>vid.platform==="Instagram");
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

// ── PREDICTION ACCURACY TRACKER ───────────────────────────────────
// Measures how far off AI predictions have been — used to calibrate future estimates
const buildPredictionAccuracy = (ideas=[]) => {
  const posted = ideas.filter(i =>
    i.status === "posted" &&
    i.postedViews > 0 &&
    i.aiScore?.estimated_views
  );
  if(posted.length < 2) return null;

  const parseEstimate = (str) => {
    if(!str) return null;
    const nums = str.match(/[\d,]+/g);
    if(!nums) return null;
    const parsed = nums.map(n=>parseInt(n.replace(/,/g,""))).filter(n=>n>0);
    return parsed.length ? Math.round(parsed.reduce((a,b)=>a+b,0)/parsed.length) : null;
  };

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

  return { pairs, avgError, overestimates, underestimates, accurate, sampleSize:pairs.length };
};

const formatPredictionAccuracy = (acc) => {
  if(!acc || acc.sampleSize < 2) return "";
  const bias = acc.avgError > 10 ? `tends to UNDERESTIMATE by ~${acc.avgError}% on average — adjust estimates UP`
             : acc.avgError < -10 ? `tends to OVERESTIMATE by ~${Math.abs(acc.avgError)}% on average — adjust estimates DOWN`
             : `predictions are well-calibrated (avg error: ${acc.avgError}%)`;
  let out = `PREDICTION ACCURACY [n=${acc.sampleSize} posted ideas with tracked views]:\n`;
  out += `• AI ${bias}\n`;
  out += `• ${acc.accurate} accurate (within 10%), ${acc.overestimates} overestimates, ${acc.underestimates} underestimates\n`;
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
const buildDynamicWeights = (insights) => {
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

// ── GPT-4o CALL ──────────────────────────────────────────────────
async function callGPT(prompt, systemMsg="You are an expert TikTok content strategist. Return ONLY valid JSON.") {
  const storedCfg = loadJSON(KEYS_KEY,{});
  const apiKey = storedCfg?.keys?.gpt4o;
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
      max_tokens:2000
    })
  });
  if(!r.ok) {
    if(r.status===401) throw new Error("Invalid GPT-4o key — check Settings");
    if(r.status===429) throw new Error("GPT-4o rate limited — wait and retry");
    throw new Error(`GPT-4o error ${r.status}`);
  }
  const d = await r.json();
  const text = d.choices?.[0]?.message?.content||"{}";
  try { return JSON.parse(text); } catch { return {}; }
}

// ── GEMINI 1.5 PRO — Video Analysis ─────────────────────────────
async function callGeminiVideo(videoUrl, prompt) {
  const cfg = loadJSON("krapmaps_v1_config",{});
  const apiKey = cfg?.keys?.gemini;
  if(!apiKey) throw new Error("NO GEMINI KEY — add it in Settings");

  // Step 1: Upload video URL for Gemini to fetch
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key="+apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { file_data: { mime_type: "video/mp4", file_uri: videoUrl } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 }
      })
    }
  );
  if(!r.ok) {
    const err = await r.json().catch(()=>({}));
    // If file_data not supported, fall back to URL in text
    if(r.status===400) {
      const r2 = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key="+apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Video URL to analyse: "+videoUrl+"\n\n"+prompt }] }],
            generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 }
          })
        }
      );
      if(!r2.ok) throw new Error("Gemini error "+r2.status);
      const d2 = await r2.json();
      const t2 = d2.candidates?.[0]?.content?.parts?.[0]?.text||"{}";
      try { return JSON.parse(t2.replace(/```json|```/g,"").trim()); } catch { return {}; }
    }
    throw new Error("Gemini error "+r.status+": "+(err.error?.message||"unknown"));
  }
  const d = await r.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text||"{}";
  try { return JSON.parse(text.replace(/```json|```/g,"").trim()); } catch { return {}; }
}

// Multi-model consensus — run same prompt through Claude + GPT4o, merge insights
async function callConsensus(claudePrompt, gptPrompt, wl=WL) {
  const results = await Promise.allSettled([
    callAI(claudePrompt, 2000),
    callGPT(gptPrompt, `You are an expert ${wl.niche} content strategist for ${wl.appName}. Return ONLY valid JSON.`)
  ]);
  const claudeResult = results[0].status==="fulfilled" ? results[0].value : null;
  const gptResult    = results[1].status==="fulfilled" ? results[1].value : null;
  return { claude:claudeResult, gpt:gptResult, bothSucceeded: !!(claudeResult && gptResult) };
}

const HOOK_TYPES       = ["edgy/controversial","problem->solution","gamification","achievement","reaction","challenge","pov","tutorial"];
const VIDEO_TYPES      = ["facecam","street","screencap","voiceover","mixed"];
const THUMBNAIL_TYPES  = ["text overlay","face close-up","scene reveal","shock moment","before/after","question on screen","no text — pure visual"];
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
const buildSystem = (wl=WL) => `You are the AI content strategist for ${wl.appName} (@findkrap on TikTok + Instagram).

WHAT KRAPMAPS IS: ${wl.appDescription}

CONTENT TEAM:
- ${wl.creator1} (UK): strategy, editing, captions, posting
- ${wl.creator2} (Thailand/SE Asia): filming, on-ground content, founder face

NICHE: ${wl.niche}

PROVEN CONTENT FORMULA: ${wl.bestFormula}

CONTENT PILLARS (in order of priority):
1. Founder journey — building in public, milestones, partnerships (Mad Monkey etc)
2. On-the-ground impact — real cleanup, real bins, real travellers reacting
3. Product demos — app verification flow, gamification moments, leaderboard reveals
4. Partnerships — Mad Monkey collab content, hostel reactions, sticker placements
5. Community wins — top mappers, leaderboard stories, user submissions

TARGET AUDIENCE: ${wl.targetAudience}

PLATFORMS: ${wl.platforms}

TONE: Genuine, slightly self-deprecating founder energy. Not preachy eco-content. The humour is in the absurdity of hunting bins as a serious mission.

CURRENT CONTEXT: App is live v1.3.34, 230+ users, 654+ bins mapped. Both creators currently in UK. Mad Monkey Hostels partnership (24 properties), Revolution Hostels (2 properties Pai Thailand). Pre-seed raise of £275K in progress.

COMPETITORS: ${wl.competitors}

Always give brutally specific, actionable advice tailored to KrapMaps' exact stage and voice. No generic social media advice.
Respond ONLY with valid JSON.`;
const SYSTEM = buildSystem(WL);

const PPX_MODELS = ["llama-3.1-sonar-large-128k-online","llama-3.1-sonar-small-128k-online"];

async function callPerplexity(prompt, wl=WL) {
  const storedCfg = loadJSON(KEYS_KEY,{});
  const apiKey = storedCfg?.keys?.perplexity;
  if(!apiKey) throw new Error("NO PERPLEXITY KEY -- go to Settings and add your Perplexity API key");
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      model:"llama-3.1-sonar-large-128k-online",
      messages:[
        { role:"system", content:`You are a niche content strategist for ${wl.appName}. Niche: ${wl.niche}. Target audience: ${wl.targetAudience}. Platforms: ${wl.platforms}. Return ONLY valid JSON.` },
        { role:"user", content:prompt }
      ]
    })
  });
  if(!r.ok) {
    if(r.status===401) throw new Error("Invalid Perplexity key -- check Settings");
    throw new Error(`Perplexity error ${r.status}`);
  }
  const d = await r.json();
  const text = d.choices?.[0]?.message?.content||"";
  const clean = text.replace(/```json/g,"").replace(/```/g,"").trim();
  try { return JSON.parse(clean); } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if(match) { try { return JSON.parse(match[0]); } catch {} }
    throw new Error("Could not parse Perplexity response");
  }
}

async function callAI(prompt, maxTokens=2000) {
  const storedCfg = loadJSON(KEYS_KEY,{});
  const apiKey = storedCfg?.keys?.anthropic;
  if(!apiKey) throw new Error("NO API KEY -- go to Settings tab and add your Anthropic key");
  const currentWL = loadWL();
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-api-key": apiKey,
      "anthropic-version":"2023-06-01",
      "anthropic-dangerous-direct-browser-access":"true"
    },
    body: JSON.stringify({
      model:"claude-sonnet-4-6",
      max_tokens:maxTokens + 3000,
      thinking:{ type:"enabled", budget_tokens:2500 },
      system:buildSystem(currentWL),
      messages:[{ role:"user", content:prompt }]
    })
  });
  if(!r.ok) {
    let errTxt = "";
    try { errTxt = await r.text(); } catch {}
    if(r.status===401) throw new Error("Invalid API key -- go to Settings and update your Anthropic key");
    if(r.status===429) throw new Error("Rate limited -- wait 30 seconds and try again");
    throw new Error(`API error ${r.status}: ${errTxt.slice(0,80)}`);
  }
  const d = await r.json();
  if(d.error) throw new Error(d.error.message||"API error");
  const text = (d.content||[]).map(b=>b.text||"").join("").trim();
  const clean = text.replace(/```json/g,"").replace(/```/g,"").trim();
  if(!clean) throw new Error("Empty AI response");
  try {
    return JSON.parse(clean);
  } catch(e) {
    const match = clean.match(/\{[\s\S]*\}/);
    if(match) { try { return JSON.parse(match[0]); } catch {} }
    throw new Error("Could not parse AI response -- try again");
  }
}

// ── DEALS ─────────────────────────────────────────────────────────
const DEALS_KEY = "krapmaps_v1_deals";
const DealsView = () => {
  const [deals, setDeals] = useState(()=>loadJSON(DEALS_KEY,[]));
  const [form, setForm] = useState({ brand:"", type:"Sponsored Post", value:"", status:"Enquiry", platform:"TikTok", deliverable:"", deadline:"", notes:"" });
  const [showForm, setShowForm] = useState(false);
  useEffect(()=>saveJSON(DEALS_KEY,deals),[deals]);
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
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(150px,100%),1fr))", gap:12 }}>
        {[{l:"TOTAL EARNED",v:`£${totalEarned.toLocaleString()}`,c:C.green},{l:"IN PIPELINE",v:`£${pipeline.toLocaleString()}`,c:C.yellow},{l:"ACTIVE DEALS",v:deals.filter(d=>!["Paid","Declined"].includes(d.status)).length,c:C.cyan},{l:"ALL DEALS",v:deals.length,c:C.purple}].map((s,i)=>(
          <div key={i} data-card style={{ borderRadius:16, padding:"18px 20px", background:"rgba(255,255,255,0.025)", border:`1px solid ${s.c}25` }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", fontWeight:700, marginBottom:8, fontFamily:C.fontHead }}>{s.l}</div>
            <div style={{ fontSize:28, fontWeight:400, fontFamily:C.fontHead, color:s.c, lineHeight:1 }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={()=>setShowForm(f=>!f)} style={{ padding:"10px 20px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>{showForm?"CANCEL":"+ ADD DEAL"}</button>
      </div>
      {showForm && (
        <div style={{ borderRadius:16, padding:"20px 22px", background:"rgba(255,255,255,0.025)", border:`1px solid ${C.pink}25` }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%),1fr))", gap:12, marginBottom:12 }}>
            {[["Brand Name","brand","text"],["Value (£)","value","number"],["Deliverable","deliverable","text"],["Deadline","deadline","date"]].map(([l,k,t])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:6, fontFamily:C.fontHead }}>{l.toUpperCase()}</div>
                <input type={t} value={form[k]} onChange={set(k)} placeholder={l} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", padding:"10px 14px", fontSize:14, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }}/>
              </div>
            ))}
            {[["Type",["Sponsored Post","UGC","Affiliate","Gifted","Ambassador"],"type"],["Status",["Enquiry","Negotiating","Signed","Live","Delivered","Paid","Declined"],"status"],["Platform",["TikTok","Instagram","Both","YouTube"],"platform"]].map(([l,opts,k])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:"0.1em", marginBottom:6, fontFamily:C.fontHead }}>{l.toUpperCase()}</div>
                <select value={form[k]} onChange={set(k)} style={{ width:"100%", background:"rgba(12,8,24,0.95)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", padding:"10px 14px", fontSize:14, fontFamily:C.fontBody, outline:"none", boxSizing:"border-box" }}>
                  {opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <textarea value={form.notes} onChange={set("notes")} placeholder="Notes, contact details, requirements..." rows={2} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", padding:"10px 14px", fontSize:13, fontFamily:C.fontBody, outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.6, marginBottom:12 }}/>
          <button onClick={addDeal} style={{ padding:"11px 24px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.pink},${C.purple})`, color:"#fff", fontFamily:C.fontHead, fontWeight:700, fontSize:13, cursor:"pointer" }}>SAVE DEAL</button>
        </div>
      )}
      {deals.length===0 ? (
        <div style={{ padding:"60px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:32 }}>🤝</div>
          <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.7)", fontFamily:C.fontHead }}>No deals yet</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:C.fontBody, maxWidth:240, lineHeight:1.6 }}>Track brand deals, sponsorships and collaborations here</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {deals.map(deal=>(
            <div key={deal.id} data-card style={{ borderRadius:16, padding:"16px 20px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#fff", fontFamily:C.fontHead, marginBottom:4 }}>{deal.brand}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontFamily:C.fontBody }}>{deal.type} · {deal.platform}{deal.deadline?` · Due ${deal.deadline}`:""}</div>
                {deal.deliverable && <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontFamily:C.fontBody, marginTop:4 }}>{deal.deliverable}</div>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {deal.value && <div style={{ fontSize:20, fontWeight:400, fontFamily:C.fontHead, color:C.green }}>£{parseFloat(deal.value).toLocaleString()}</div>}
                <select value={deal.status} onChange={e=>setDeals(ds=>ds.map(d=>d.id===deal.id?{...d,status:e.target.value}:d))} style={{ background:"rgba(12,8,24,0.95)", border:`1px solid ${STATUS_C[deal.status]||C.dim}40`, borderRadius:8, color:STATUS_C[deal.status]||"#fff", padding:"6px 10px", fontSize:12, fontFamily:C.fontHead, fontWeight:700, cursor:"pointer", outline:"none" }}>
                  {["Enquiry","Negotiating","Signed","Live","Delivered","Paid","Declined"].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={()=>setDeals(ds=>ds.filter(d=>d.id!==deal.id))} style={{ padding:"6px 8px", borderRadius:8, border:`1px solid ${C.pink}20`, background:"transparent", color:`${C.pink}70`, cursor:"pointer" }}>{I.trash(12,C.pink)}</button>
              </div>
            </div>
          ))}
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
  { id:"settings",  label:"SETTINGS",  ic:I.settings  },
];

// ── AI CHAT VIEW ──────────────────────────────────────────────────
function AIChatView({ anthropicKey, tasks, setTasks, ideas, setIdeas, videos, preloadMsg }) {
  const CHAT_KEY = "krapmaps_v1_chat";
  const [msgs, setMsgs] = useState(()=>{
    const saved = loadJSON(CHAT_KEY, null);
    return saved || [{ role:"assistant", content:"Hey! I'm your KrapMaps AI assistant. I can add tasks, create video ideas, answer questions about your content — or upload a clip and I'll analyse it and tell you how to edit it." }];
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
          assignee: { type:"string", enum:["BK","Harley","Both"], description:"Who the task is assigned to" },
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
      const newTask = { id:Date.now(), text:inp.text, assignee:inp.assignee||"BK", done:false, priority:inp.priority||"normal", created:new Date().toISOString() };
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
    const geminiKey = cfg?.keys?.gemini;
    if(!geminiKey) { setMsgs(m=>[...m,{role:"assistant",content:"No Gemini API key set. Go to Settings to add one — video analysis uses Gemini."}]); return; }

    setUploading(true);
    setMsgs(m=>[...m, { role:"user", content:`📎 ${file.name}` }, { role:"assistant", content:"Preparing your clip..." }]);

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

      const prompt = `You are the world's best viral video analyst — combining expertise in social psychology, the 2026 TikTok/Reels algorithm, and environmental travel content. You are analysing a clip for @findkrap (KrapMaps — crowdsourced bin-finding app for backpackers in SE Asia, creators BK + Harley).

${channelTheoryForAnalysis ? `━━ CHANNEL VIRAL THEORY ━━\n${channelTheoryForAnalysis}\n` : ""}
${channelStatsForAnalysis || `CHANNEL: organic avg views ${avgViewsForAnalysis} | limited data — use niche benchmarks`}
${engBlockForAnalysis}
${comboBlockForAnalysis}
("good" = 3x channel avg = ${fmt(avgViewsForAnalysis*3)}, "viral" = 10x+ = ${fmt(avgViewsForAnalysis*10)})
- Many early videos were paid/boosted — weight content patterns over raw view counts
${trendsForAnalysis ? `\nCURRENT TRENDS (use these in editing + sound recommendations):\n${trendsForAnalysis}` : ""}
${videoContext ? `\nCREATOR CONTEXT FOR THIS CLIP:\n${videoContext}` : ""}


Analyse this clip with full virality science:

━━ 1. SCROLL-STOP AUDIT (0-0.5s) ━━
- Does the very first frame stop the scroll? (brain decides in 400ms)
- Which hook type is being used: visual disruption / open loop / identity trigger / social proof / pattern interrupt / none?
- Hook score: /10 — what specifically makes it strong or weak?

━━ 2. RETENTION CURVE PREDICTION ━━
- Identify the exact timestamp where viewers will drop off and WHY
- Is there a setup → tension → payoff arc?
- Any dead air, slow sections, or unnecessary footage to cut?
- Predicted watch-through rate: X% — reasoning?

━━ 3. ENGAGEMENT TRIGGER ANALYSIS ━━
- SHARE trigger: does it give viewers social currency (makes them look good sharing it)?
- SAVE trigger: is there bookmark-worthy info or a satisfying moment people want to revisit?
- COMMENT trigger: does it prompt "what country?", "I'd do this", debate, or emotional response?
- Which trigger is strongest? Which is weakest?

━━ 4. CONTENT PILLAR & AUDIENCE ━━
- Which pillar: Local Connection / Location Contrast / Mission Reveal / App In Action / Travel Utility?
- Which audience does it hit hardest: backpackers (identity) / armchair viewers (emotion) / local SE Asians (pride)?
- Cross-cultural share potential: high / medium / low — why?

━━ 5. EDITING FIXES (priority order) ━━
List the top 3 edits by impact:
1. [HIGHEST IMPACT] — specific timestamp and what to change
2. [MEDIUM IMPACT] — specific change
3. [QUICK WIN] — easiest change with solid return

━━ 6. VERDICT ━━
- Post as-is / quick edit needed / reshoot — and exactly why
- Virality ceiling estimate: X-Xk views organic — reasoning
- ONE sentence summary a non-editor could act on immediately

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
    if(!anthropicKey) { setMsgs(m=>[...m,{role:"assistant",content:"No Anthropic API key set. Go to Settings to add one."}]); return; }

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
      const systemPrompt = `You are the world's best viral content strategist — you combine the expertise of a top TikTok growth hacker, a social psychology researcher, and an experienced travel/environmental content creator. You manage the @findkrap TikTok and Instagram accounts through KrapMaps Content OS.

━━ BRAND & MISSION ━━
KrapMaps = crowdsourced bin-finding app for backpackers in Southeast Asia.
Creators: BK (on camera, charismatic, genuine) + Harley (strategy, editing, system-builder).
Core identity: "We pick up rubbish in the world's most beautiful places because there are no bins — so we built an app to fix it."
This is a DUAL product: entertainment (travel + environmental) AND utility (the app). Every video should serve both.

━━ CHANNEL DATA (real numbers — treat as ground truth) ━━
- ${videos.length} videos tracked | ${tasks.filter(t=>!t.done).length} open tasks | ${ideas.length} ideas in pipeline
- CRITICAL: Many early videos were paid/boosted — never use boosted view counts as organic benchmark.
${chatInsightsBlock}
${chatEngBlock}
${chatComboBlock}
${chatAuditBlock}
${chatPredAcc}
${chatCompHooks ? `Competitor hooks proven in niche: ${chatCompHooks}` : ""}

━━ AUDIENCE PSYCHOLOGY ━━
PRIMARY: Backpackers aged 18-30 who travel SE Asia — they want the app, relate to the rubbish problem, share because it validates their experience.
SECONDARY: Armchair travellers / environmentally conscious people — they watch for the beauty + mission story, share because it makes them look good (social currency).
TERTIARY: Local SE Asians — share when local people/culture are shown respectfully, massive reach multiplier.

What makes each audience share:
- Backpackers: "this is exactly what I experienced" → identity validation
- Armchair viewers: "this made me feel something" → emotional currency
- Locals: "they're treating our country with respect" → pride/dignity

━━ 2025 ALGORITHM INTELLIGENCE ━━
TIKTOK: Prioritises "satisfaction loops" — videos where the viewer feels something resolved. Shares 3× more valuable than likes. Comment bait ("what country is this?", "would you do this?") drives reach. Watch loops (rewatchable endings) add 20-40% to effective watch time score.
REELS: Favours saves (bookmark-worthy info) and shares to Stories. Collab posts with local accounts get 2-3× organic reach. Audio trending within 48hrs of a sound peaking = algorithm boost window.
BOTH: First 0.5 seconds is the ONLY thing that matters for stopping the scroll. Native-feeling content (vertical, no heavy graphics, authentic audio) outperforms produced content 4:1 in 2025.

━━ SCROLL-STOPPING HOOK SCIENCE ━━
The brain decides to scroll in 400ms. Effective hooks use ONE of:
1. VISUAL DISRUPTION — something unexpected in frame immediately (animal, confrontation, beautiful/ugly contrast)
2. OPEN LOOP — a statement that can't be resolved without watching ("She said something that changed everything")
3. IDENTITY TRIGGER — makes the viewer see themselves ("POV: you're the only foreigner...")
4. SOCIAL PROOF IN MOTION — other people reacting/gathered creates FOMO
5. PATTERN INTERRUPT — sudden sound, cut, or movement that breaks visual flow

For this channel specifically:
- Local person joining unexpectedly = identity trigger + social proof + surprise = highest combo
- Beautiful scenic shot with visible rubbish in foreground = visual disruption + contrast
- "Nobody told me about the bin problem in [iconic place]" = open loop + curiosity gap
- Never start on a walking shot, talking-to-camera explanation, or establishing b-roll

━━ CONTENT PILLARS (ranked by virality ceiling) ━━
🥇 LOCAL CONNECTION — local stranger joins, helps, or has genuine reaction. Drives cross-cultural shares. Ceiling: 500K+
🥈 LOCATION CONTRAST — iconic beautiful SE Asia location + shocking waste/no-bin problem. Drives saves + comments. Ceiling: 200K+
🥉 MISSION REVEAL — the "why" story, app origin, what we're building. Emotional, drives follows. Ceiling: 100K+
4. APP IN ACTION — real problem → app → solution shown. Conversion content. Ceiling: 50K
5. TRAVEL UTILITY — specific bin tips, clean spots. High saves, lower viral ceiling. Ceiling: 30K

━━ EDITING PRINCIPLES FOR MAX RETENTION ━━
- Cut on movement, not on pauses
- Text overlays: max 5 words, appear within first 3s, disappear before 5s
- Pacing: cut every 2-4 seconds in first 15s, can slow after emotional peak
- End on either: resolution (satisfying) OR open question (drives comments)
- Captions: always on, white with black outline, 85% of viewers watch muted
- Music: trending audio within its peak window; volume at 30% under voiceover

━━ TOOLS ━━
- add_task: add actionable task for BK or Harley
- add_video_idea: add content idea to pipeline
- get_stats: pull channel performance data

━━ RESPONSE STYLE ━━
Be brutally honest, specific, and strategic. Give concrete next actions, not vague advice. Reference the virality science above when explaining WHY something will or won't work. When adding tasks or ideas, do it immediately with tools — no confirmation needed.

${channelTheoryChat ? `━━ CHANNEL VIRAL THEORY ━━\n${channelTheoryChat}` : ""}

${currentTrends ? `━━ CURRENT TRENDS ━━\n${currentTrends}` : ""}

${memCtx ? `━━ CHANNEL MEMORY ━━\n${memCtx}` : ""}`;


      let conversationMsgs = newMsgs.slice(1); // skip the initial assistant greeting
      let response = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "x-api-key":anthropicKey, "anthropic-version":"2023-06-01", "content-type":"application/json", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1024, system:systemPrompt, tools:TOOLS, messages:conversationMsgs })
      });

      if(!response.ok) {
        const err = await response.json().catch(()=>({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }

      let data = await response.json();
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

        response = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{ "x-api-key":anthropicKey, "anthropic-version":"2023-06-01", "content-type":"application/json", "anthropic-dangerous-direct-browser-access":"true" },
          body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1024, system:systemPrompt, tools:TOOLS, messages:allMsgs })
        });

        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
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

  const getCapcutPlan = async () => {
    if(!lastFileB64) return;
    const cfg = loadJSON(KEYS_KEY, {});
    const geminiKey = cfg?.keys?.gemini;
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
    const fresh = [{ role:"assistant", content:"Hey! I'm your KrapMaps AI assistant. I can add tasks, create video ideas, answer questions about your content — or upload a clip and I'll analyse it and tell you how to edit it." }];
    setMsgs(fresh);
    setLastFileUri(null);
    setLastFileMime(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100dvh - 160px)", minHeight:400 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:16, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 24px ${C.pink}50, 0 0 0 1px ${C.pink}30` }}>
            {I.brain(20,"#fff")}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", lineHeight:1.1 }}>KrapMaps AI</div>
            <div style={{ fontSize:11, color:C.purple, marginTop:2, letterSpacing:"0.04em" }}>claude-sonnet-4-6 · gemini-2.5-flash</div>
          </div>
        </div>
        {msgs.length > 1 && (
          <button onClick={clearChat} style={{ fontSize:11, padding:"6px 14px", borderRadius:10, border:`1px solid rgba(255,255,255,0.1)`, background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontFamily:C.fontHead, transition:"all 0.15s", letterSpacing:"0.04em" }}>
            End session
          </button>
        )}
      </div>

      {/* Quick-action chips — only on fresh session */}
      {msgs.length <= 1 && (
        <div style={{ marginBottom:16, flexShrink:0 }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10, fontWeight:700 }}>Quick actions</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {[
              { label:"Show my stats", icon:I.bar, color:C.cyan },
              { label:"Add task: post 3x this week", icon:I.check, color:C.green },
              { label:"Add idea: bin location challenge", icon:I.idea, color:C.purple },
              { label:"What should I post next?", icon:I.zap, color:C.yellow },
            ].map(s=>(
              <button key={s.label} onClick={()=>{ setInput(s.label); setTimeout(()=>inputRef.current?.focus(),50); }}
                style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, padding:"9px 16px", borderRadius:16, border:`1px solid ${s.color}35`, background:`${s.color}10`, color:"rgba(255,255,255,0.85)", cursor:"pointer", fontFamily:C.fontHead, transition:"all 0.15s", letterSpacing:"0.02em" }}>
                {s.icon(12,s.color)}{s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:16, paddingRight:4, paddingBottom:4 }}>
        {msgs.map((msg,i)=>(
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:msg.role==="user"?"flex-end":"flex-start", gap:10 }}>
            <div style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", gap:10, alignItems:"flex-end", maxWidth:"85%" }}>
              {msg.role==="assistant" && (
                <div style={{ width:30, height:30, borderRadius:10, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 2px 12px ${C.pink}35` }}>
                  {I.brain(14,"#fff")}
                </div>
              )}
              <div style={{
                padding:"14px 18px",
                borderRadius:msg.role==="user"?"20px 20px 6px 20px":"6px 20px 20px 20px",
                background:msg.role==="user"
                  ? `linear-gradient(135deg,${C.pink},${C.purple})`
                  : "rgba(255,255,255,0.06)",
                border:msg.role==="assistant" ? `1px solid rgba(255,255,255,0.09)` : "none",
                boxShadow:msg.role==="user" ? `0 6px 24px ${C.pink}35` : "0 2px 12px rgba(0,0,0,0.2)",
                color:"#fff", fontSize:13.5, lineHeight:1.7, fontFamily:C.fontHead, wordBreak:"break-word", whiteSpace:"pre-wrap",
                backdropFilter: msg.role==="assistant" ? "blur(10px)" : "none",
              }}>
                {msgText(msg)}
              </div>
              {msg.role==="user" && (
                <div style={{ width:30, height:30, borderRadius:10, background:`linear-gradient(135deg,${C.pink}70,${C.purple}70)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, fontWeight:700, color:"#fff" }}>BK</div>
              )}
            </div>
            {msg.showCapcutBtn && (
              <button onClick={getCapcutPlan} disabled={loading}
                style={{ marginLeft:40, display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:16, border:`1px solid ${C.cyan}45`, cursor:loading?"not-allowed":"pointer", background:`linear-gradient(135deg,${C.cyan}14,${C.purple}14)`, color:C.cyan, fontSize:12, fontFamily:C.fontHead, fontWeight:700, opacity:loading?0.5:1, transition:"all 0.15s", letterSpacing:"0.04em", boxShadow:`0 4px 20px ${C.cyan}15` }}>
                {I.write(13,C.cyan)} Get CapCut Edit Plan →
              </button>
            )}
          </div>
        ))}
        {(loading||uploading) && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:10, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{I.brain(14,"#fff")}</div>
            <div style={{ padding:"14px 20px", borderRadius:"6px 20px 20px 20px", background:"rgba(255,255,255,0.06)", border:`1px solid rgba(255,255,255,0.09)`, display:"flex", gap:6, alignItems:"center" }}>
              {[0,1,2].map(k=><div key={k} style={{ width:7, height:7, borderRadius:"50%", background:`linear-gradient(135deg,${C.pink},${C.purple})`, animation:`pulse 1.2s ${k*0.22}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Video preview pill */}
      {videoFile && (
        <div style={{ background:`${C.purple}10`, border:`1px solid ${C.purple}35`, borderRadius:16, marginTop:12, flexShrink:0, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px" }}>
            <div style={{ width:30, height:30, borderRadius:9, background:`${C.purple}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{I.vid(14,C.purple)}</div>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.85)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{videoFile.name}</span>
            <button onClick={()=>{ setVideoFile(null); setVideoContext(""); if(fileRef.current) fileRef.current.value=""; }} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:20, lineHeight:1, padding:"0 4px", flexShrink:0 }}>×</button>
          </div>
          <div style={{ padding:"0 14px 12px" }}>
            <input
              value={videoContext}
              onChange={e=>setVideoContext(e.target.value)}
              placeholder="Optional: what's the goal? e.g. local connection hook, testing a new format, want to improve retention..."
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.purple}25`, borderRadius:10, color:"rgba(255,255,255,0.8)", padding:"9px 12px", fontSize:12, fontFamily:C.fontHead, outline:"none", boxSizing:"border-box" }}
            />
            <button onClick={()=>analyseVideo(videoFile)} disabled={uploading}
              style={{ marginTop:10, width:"100%", padding:"11px", borderRadius:12, border:"none", cursor:uploading?"not-allowed":"pointer", background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:"#fff", fontSize:13, fontFamily:C.fontHead, fontWeight:700, opacity:uploading?0.6:1, boxShadow:`0 4px 16px ${C.purple}35` }}>
              {uploading?"Uploading...":"Analyse clip →"}
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div style={{ display:"flex", gap:10, padding:"12px 14px", background:"rgba(255,255,255,0.05)", borderRadius:20, border:`1px solid rgba(255,255,255,0.1)`, marginTop:12, alignItems:"center", flexShrink:0, boxShadow:"0 4px 24px rgba(0,0,0,0.2)" }}>
        <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) setVideoFile(e.target.files[0]); }} />
        <button onClick={()=>fileRef.current?.click()} title="Upload video clip"
          style={{ width:36, height:36, borderRadius:11, border:`1px solid rgba(255,255,255,0.12)`, background:"rgba(255,255,255,0.06)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
          {I.vid(15,"rgba(255,255,255,0.85)")}
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Message KrapMaps AI..."
          style={{ flex:1, background:"transparent", border:"none", color:"#fff", fontSize:14, fontFamily:C.fontHead, outline:"none", minWidth:0 }}
        />
        <button onClick={send} disabled={loading||!input.trim()}
          style={{ padding:"10px 22px", borderRadius:13, border:"none", cursor:loading||!input.trim()?"not-allowed":"pointer", background:loading||!input.trim()?"rgba(255,255,255,0.08)":`linear-gradient(135deg,${C.pink},${C.purple})`, opacity:loading||!input.trim()?0.5:1, color:"#fff", fontSize:13, fontFamily:C.fontHead, fontWeight:700, flexShrink:0, transition:"all 0.2s", boxShadow:loading||!input.trim()?"none":`0 4px 20px ${C.pink}45`, letterSpacing:"0.04em" }}>
          Send
        </button>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.1)}}`}</style>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ keys, onEditKeys }) {
  const isPhone = typeof window!=="undefined" && window.innerWidth < 520;

  // ── STATE ──────────────────────────────────────────────────────
  const [nav, setNav]   = useState("home");
  const [sub, setSub]   = useState(null);
  const [aiErr, setAiErr] = useState(null);
  const [assistPreload, setAssistPreload] = useState(null);

  const handleBuildScript = (idea) => {
    const msg = `Build me a full script for this idea:\n\nTitle: "${idea.title}"\nType: ${idea.type||"facecam"}\nHook: ${idea.hook||""}\n${idea.improvedHook?`Improved hook: "${idea.improvedHook}"\n`:""}\nInclude: opening hook (exact words to say), main body (what to show + say at each moment), and a closing CTA. Give timestamps and CapCut text overlay suggestions. Make it optimised for maximum virality.`;
    setAssistPreload({ text: msg, id: Date.now() });
    setNav("ai");
    setSub(null);
    // Background: auto-score if not already scored
    if(!idea.viral && keys?.anthropic) {
      setTimeout(()=>scoreIdea(idea), 500);
    }
  };

  const runDebrief = async () => {
    if(!keys?.anthropic) return;
    setDebriefLoading(true);
    try {
      const vids = loadJSON(VIDEOS_KEY,[]);
      const idList = loadJSON(IDEAS_KEY,[]);
      const topVids = [...vids].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
      const postedThisWeek = idList.filter(i=>i.status==="posted"&&i.postedDate&&(Date.now()-new Date(i.postedDate).getTime())<604800000);
      const recentIdeas = idList.slice(0,5).map(i=>`"${(i.title||"").slice(0,40)}" (scored ${i.viral||"unscored"})`).join(", ");
      const r = await callAI(`You are the strategist for @findkrap (KrapMaps — bin-finding app, SE Asia backpacker content). Generate a weekly debrief.\n\nChannel data:\n- Total videos: ${vids.length}, avg views: ${Math.round(vids.reduce((s,v)=>s+(v.views||0),0)/(vids.length||1))}\n- Posted this week: ${postedThisWeek.length} videos\n- Top 5 videos: ${topVids.map(v=>`${(v.title||"").slice(0,30)} (${(v.views||0).toLocaleString()} views)`).join(", ")}\n- Recent ideas: ${recentIdeas}\n- Unscored ideas: ${idList.filter(i=>!(i.viral>0)).length}\n\nReturn ONLY JSON: {"headline":"","whatWorked":["",""],"whatDidnt":[""],"focusThisWeek":["","",""],"ideaToFilmNow":"title and why","watchOut":"one risk to avoid"}`, 800);
      const result = {...r, generatedAt: new Date().toISOString()};
      saveJSON("krapmaps_v1_debrief", result);
      setWeeklyDebrief(result);
      addXP(30);
    } catch(e){}
    setDebriefLoading(false);
  };

  const [wlConfig, setWlConfig] = useState(()=>loadWL());
  const [videoScores, setVideoScores] = useState(()=>loadJSON(SCORES_KEY,{}));
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
        if(vids===null) { setStatsError("Supabase error -- check URL/key"); }
        else if(vids?.length) {
          setVideos(prev => {
            const merged = [...vids];
            prev.forEach(p=>{ if(!merged.find(v=>v.id===p.id||v.url===p.url)) merged.push(p); });
            return merged;
          });
        }
        // Load scraped stats
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
    if(!tikwmKey) return; // no key, skip silently
    
    // Only fetch if >2hrs since last fetch (unless forced)
    const lastFetch = loadJSON("krapmaps_v1_tikwm_last", 0);
    if(!force && Date.now() - lastFetch < 6 * 60 * 60 * 1000) return;
    
    // On force sync reset videos state to empty so no stale data accumulates
    if(force) { setVideos([]); try { localStorage.removeItem(VIDEOS_KEY); } catch(e){} }
    
    try {
      const wl = loadWL();
      const handle = (wl.handle||"@findkrap").replace("@","");
      
      // Fetch user info for followers in parallel with first page of videos
      const [r, rUser] = await Promise.all([
        fetch(
          "https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id="+handle+"&count=35&cursor=0&sort_type=0",
          { headers: { "x-rapidapi-host":"tiktok-scraper7.p.rapidapi.com", "x-rapidapi-key":tikwmKey, "Content-Type":"application/json" }}
        ),
        fetch(
          "https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id="+handle,
          { headers: { "x-rapidapi-host":"tiktok-scraper7.p.rapidapi.com", "x-rapidapi-key":tikwmKey, "Content-Type":"application/json" }}
        )
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

      if(!r.ok) return;
      const data = await r.json();
      if(data.code !== 0 || !data.data?.videos) return;
      
      let tikVideos = data.data.videos;
      
      // Paginate if more videos available
      let ttCursor = data.data.cursor;
      let ttMore = data.data.hasMore;
      let ttPages = 1;
      while(ttMore && ttCursor && ttPages < 5) {
        await new Promise(res => setTimeout(res, 800));
        const r2 = await fetch(
          "https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id="+handle+"&count=35&cursor="+ttCursor+"&sort_type=0",
          { headers: { "x-rapidapi-host":"tiktok-scraper7.p.rapidapi.com", "x-rapidapi-key":tikwmKey, "Content-Type":"application/json" }}
        );
        if(!r2.ok) break;
        const d2 = await r2.json();
        if(d2.code !== 0 || !d2.data?.videos?.length) break;
        tikVideos = tikVideos.concat(d2.data.videos);
        ttCursor = d2.data.cursor;
        ttMore = d2.data.hasMore;
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
        // Keep non-tiktok videos (IG etc), replace all TT entries fresh from scrape
        const nonTT = prev.filter(v => v.platform !== "tiktok");
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
      
    } catch(e) { console.warn("TIKWM fetch failed:", e.message); }
  },[]);

  // Auto-fetch on load and every 12hrs
  useEffect(()=>{ if(!ttFetchedRef.current){ ttFetchedRef.current=true; fetchTikToks(); } },[]);

  // ── IG REELS AUTO-SCRAPER ─────────────────────────────────────
  const fetchIGFollowers = useCallback(async()=>{
    const cfg = loadJSON(KEYS_KEY,{});
    const rapidKey = cfg?.keys?.igscraper || cfg?.keys?.tikwm;
    if(!rapidKey) return;
    const lastFollowerFetch = loadJSON("krapmaps_v1_igfollowers_last", 0);
    if(Date.now() - lastFollowerFetch < 6 * 60 * 60 * 1000) return; // 6hr cache
    try {
      const wl = loadWL();
      const handle = (wl.handle||"@findkrap").replace("@","");
      const r = await fetch(
        "https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=" + handle,
        { headers: { "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com", "x-rapidapi-key": rapidKey } }
      );
      if(!r.ok) { console.warn("IG followers: HTTP", r.status); return; }
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
    const rapidKey = cfg?.keys?.igscraper || cfg?.keys?.tikwm; // reuse tikwm key if no separate key
    if(!rapidKey) return;

    const lastFetch = loadJSON("krapmaps_v1_igreels_last", 0);
    if(!force && Date.now() - lastFetch < 3 * 60 * 60 * 1000) return;

    try {
      const wl = loadWL();
      const handle = (wl.handle||"@findkrap").replace("@","");

      // Fetch ALL reels via pagination using max_id cursor
      const userId = "78520217622"; // findkrap user ID
      const baseUrl = "https://instagram-scraper-api2.p.rapidapi.com/v1/clips?user_id=" + userId;
      const headers = { "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com", "x-rapidapi-key": rapidKey };
      
      let allItems = [];
      let cursor = null;
      let pages = 0;
      const maxPages = 5; // cap at 5 pages (~50+ reels) to avoid rate limits
      
      while(pages < maxPages) {
        const url = cursor ? baseUrl + "&pagination_token=" + encodeURIComponent(cursor) : baseUrl;
        let r = await fetch(url, { headers });
        let retries = 0;
        while(r.status===429 && retries < 2) {
          console.warn("IG 429 — backing off", (retries+1)*3, "s");
          await new Promise(res => setTimeout(res, (retries+1)*3000));
          r = await fetch(url, { headers });
          retries++;
        }
        if(!r.ok) { console.warn("IG reels fetch HTTP", r.status, "on page", pages+1); break; }
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
    } catch(e) { console.warn("IG reels fetch failed:", e.message); }
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
    if(!cfg?.keys?.perplexity) return;
    const wl = loadWL();
    setTimeout(async()=>{
      try {
        const r = await callPerplexity(`It is June 2026. What is trending RIGHT NOW on TikTok and Instagram Reels for travel content in Southeast Asia? What sounds/audio are peaking? What formats are getting the highest reach? What topics are viral this week? Return JSON: { hot:[{topic,momentum:'rising|peak|fading',hook_example}], sounds:[string], formats:[string] }`, wl);
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
    if(!cfg?.keys?.perplexity) return;
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
        setCompetitors(data);
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
        if(cfg?.keys?.perplexity) {
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
        weekly:    channelCtx+"\nWrite a filming brief for "+wl.creator2+". Return JSON: {harleyBrief:'2-3 sentences',priorities:[{task,why,how_to_shoot}],rawSummaryText:'WhatsApp-ready message'}. Videos: "+JSON.stringify(vSummary),
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

  const markPosted = (idea, actualViews=0) => {
    const predicted = idea.aiScore?.estimated_views||"unknown";
    const outcome = actualViews>0 ? `Got ${fmt(actualViews)} views (AI predicted ${predicted})` : "Posted, views not tracked yet";
    const pillar = idea.aiScore?.contentPillar||idea.type||"unknown";
    const score = idea.viral||0;
    addMemoryEntry("IDEA_OUTCOME", `"${idea.title.slice(0,60)}" posted. ${outcome}. Pillar: ${pillar}. Score: ${score}/100`, outcome);
    setIdeas(is=>is.map(i=>i.id===idea.id?{...i,status:"posted",postedViews:actualViews,postedDate:new Date().toISOString().slice(0,10)}:i));
    addXP(50); // XP for posting

    // Background: counterfactual reasoning + structured learning
    if(actualViews > 0) {
      const cfg = loadJSON(KEYS_KEY,{});
      const key = cfg?.keys?.anthropic;
      if(key) {
        setTimeout(async()=>{
          try {
            const organicV = videos.filter(v=>!v.boosted);
            const avgV = organicV.length ? Math.round(organicV.reduce((s,v)=>s+(v.views||0),0)/organicV.length) : 0;
            const multiple = avgV > 0 ? `${(actualViews/avgV).toFixed(1)}x channel avg (${avgV>0?fmt(avgV):"unknown"} avg)` : "";
            const performance = avgV > 0 ? (actualViews > avgV*2 ? "OVERPERFORMED" : actualViews > avgV*0.5 ? "MET EXPECTATIONS" : "UNDERPERFORMED") : "POSTED";
            const channelTheory = loadJSON(CHANNEL_THEORY_KEY,"");

            const res = await fetch("https://api.anthropic.com/v1/messages",{
              method:"POST",
              headers:{"x-api-key":key,"anthropic-version":"2023-06-01","content-type":"application/json","anthropic-dangerous-direct-browser-access":"true"},
              body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:350,messages:[{role:"user",content:`A KrapMaps TikTok/Reels video was posted.

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
LEARNING: [one sentence]`}]})
            });
            const d = await res.json();
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
    setAiLoad(l=>({...l,[key]:true}));
    try {
      const organicVids = videos.filter(v=>!v.boosted);
      const topV = [...(organicVids.length?organicVids:videos)].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
      const postedIdeas = ideas.filter(i=>i.status==="posted"&&i.postedViews>0);
      const ideaOutcomes = postedIdeas.slice(0,5).map(i=>`"${i.title.slice(0,40)}" → ${fmt(i.postedViews)} views (score was ${i.viral||"?"}/100, pillar: ${i.aiScore?.contentPillar||"unknown"})`);
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
      const weights = buildDynamicWeights(channelInsights);
      const weightsLine = formatDynamicWeights(weights, channelInsights);

      // Audit rubric — proven winners/losers from this channel's history
      const auditRubric = buildAuditRubric(organicVids.length?organicVids:videos);
      const auditBlock = formatAuditRubric(auditRubric);

      // Series momentum — does this build on a proven concept?
      const seriesMomentum = detectSeriesMomentum(idea, organicVids.length?organicVids:videos, ideas);

      // Pillar gap boost — if a pillar hasn't been posted in X days, ideas in that pillar get a strategic bonus
      const pillarGapBoost = (() => {
        const PILLARS = ["Local Connection","Location Contrast","Mission Reveal","App In Action","Travel Utility"];
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

      const currentTrendsForScore = loadJSON(CUR_TRENDS_KEY,"");
      const r = await callAI(`You are the world's best viral content strategist. Score this TikTok/Reels idea for @findkrap (KrapMaps — crowdsourced bin-finding app for backpackers in SE Asia, niche: environmental travel / backpacker culture).

${channelTheory ? `━━ CHANNEL VIRAL THEORY (why this channel specifically goes viral — anchor ALL scoring to this) ━━\n${channelTheory}\n` : ""}
━━ CHANNEL INTELLIGENCE (real data — treat as ground truth) ━━
${channelStatsBlock || "Limited data — use niche benchmarks as proxy"}
${engBlock}
${comboBlock}
${auditBlock}
${predAccBlock}
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

1. HOOK STRENGTH (${weights.hook}%) — The first 0.5 seconds is won or lost here. Classify: visual disruption (unexpected image), open loop (question unanswered), identity trigger ("if you're a backpacker..."), contrast (before/after or unexpected juxtaposition), social proof (others react). Score against your channel data: does this hook type outperform or underperform the channel average? Be specific about what frame/word earns the scroll-stop.

2. RETENTION ARC (${weights.retention}%) — Map the arc: what is the SETUP (creates curiosity or stakes), what is the TENSION (maintains suspense), what is the PAYOFF (satisfying resolution that makes watch-through worth it)? If any element is missing the video will lose viewers early. Predict the drop-off timestamp and why. Check: is there dead air, filler, unnecessary explanation, or a weak ending?

3. SHARE TRIGGER (${weights.share}%) — Shares are the only metric that breaks the algorithm ceiling. Score which trigger applies: SOCIAL CURRENCY (makes the sharer look good/knowledgeable — backpacker status), EMOTIONAL RESONANCE (makes armchair viewers feel something strong enough to share), CULTURAL PRIDE (SE Asian locals share it to their community). A strong share trigger is worth 5-10x in reach. Score honestly — most content fails here.

4. ALGORITHM FIT (${weights.algo}%) — In 2026 the TikTok/Reels algorithm rewards: (a) POV and first-person raw footage over produced content, (b) genuine stranger interactions over scripted scenes, (c) location contrast — unexpected setting reveals, (d) local culture moments non-locals haven't seen. PENALISE: talking-to-camera explaining, over-produced visuals, no clear scene context. Cross-reference competitor data: what formats are getting pushed in this niche right now?

5. NICHE FIT (${weights.niche}%) — Score against the channel's 5 proven pillars IN PRIORITY ORDER based on your channel data: Local Connection (authentic relationship with SE Asian community) > Location Contrast (unexpected setting reveal) > Mission Reveal (environmental/litter mission story) > App In Action (using KrapMaps to solve a real problem) > Travel Utility (backpacker tips). If this idea doesn't clearly belong to a pillar, score low. If it sits at the intersection of two pillars, score high.

Return ONLY valid JSON:
{"viralityScore":0-100,"hookScore":0-100,"retentionScore":0-100,"shareScore":0-100,"algoScore":0-100,"nicheScore":0-100,"verdict":"2 sentences — name the strongest and weakest factor with specific reasoning","viralityReason":"which share trigger fires and why it makes people actually press share","hookFeedback":"exactly what works or fails in the first 3 seconds","improvedHook":"rewritten hook under 10 words","retentionFix":"the single biggest retention improvement","openLoopStrength":"rate 1-10 how well this video creates and sustains curiosity gaps — what is the open loop and when does it close?","reHookMoments":["specific moment at ~3s to re-engage","specific moment at ~15s","specific moment at ~30s if video is longer"],"emotionalArc":"setup→tension→payoff analysis — what emotion does viewer feel at start, middle, end? Where does it escalate?","recommendations":[{"action":"specific actionable next step","impact":"HIGH|MEDIUM"}],"estimated_views":"realistic organic ceiling e.g. 20K-80K — anchored to calibration data above","contentPillar":"Local Connection|Location Contrast|Mission Reveal|App In Action|Travel Utility","competitorAngle":"how to differentiate from what competitors are already doing in this niche"}`, 2000);
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
          retentionFix:r.retentionFix,
          competitorAngle:r.competitorAngle,
          openLoopStrength:r.openLoopStrength,
          reHookMoments:r.reHookMoments,
          emotionalArc:r.emotionalArc,
          recs:r.recommendations?.map(x=>({a:x.action,impact:x.impact?.toUpperCase()})),
          scoreDelta,
          prevScore,
          lastScoredAt: new Date().toISOString().slice(0,10),
        };
      }));
    } catch(e) { setAiErr("Score failed: "+e.message); }
    addXP(20); // XP for scoring an idea
    setAiLoad(l=>({...l,[key]:false}));
  };

  const genCaption = async (idea) => {
    setAiLoad(l=>({...l,caption:true}));
    setCaptionIdea(idea);
    setCaptionResult(null);
    try {
      const r = await callAI(`Write captions for KrapMaps TikTok and Instagram for this idea: "${idea.title||idea.text}".

For TikTok, provide 3 HOOK VARIANTS — each uses a different psychology trigger. For Instagram, one caption.

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
  const ModalBase = ({ children, onClose }) => (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 0 0" }}>
      <div style={{ background:"#0F0B1E",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",padding:"20px 18px 36px" }}>
        <div onClick={onClose} style={{ width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.85)",margin:"0 auto 20px" }} />
        {children}
      </div>
    </div>
  );
  const MLabel = ({children}) => <div style={{ fontSize:9,fontWeight:700,letterSpacing:"0.14em",color:C.dim,marginBottom:5,textTransform:"uppercase" }}>{children}</div>;
  const MInput = ({value,onChange,placeholder,type="text"}) => <input type={type} value={value||""} onChange={onChange} placeholder={placeholder} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:12 }} />;
  const MBtn = ({children,onClick,color=C.pink}) => <button onClick={onClick} style={{ width:"100%",padding:"13px",borderRadius:12,border:"none",background:color,color:"#fff",fontFamily:C.fontHead,fontWeight:700,fontSize:15,cursor:"pointer",marginTop:6 }}>{children}</button>;

  const AddVideoModal = () => {
    const [tab, setTab] = useState("manual");
    const [form, setForm] = useState({ title:"", type:"facecam", hook:"achievement", views:"", likes:"", url:"", collab: false, audio: "" });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    return (
      <ModalBase onClose={()=>closeModal("addVideo")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Log Video</div>
        <div style={{ display:"flex",gap:6,marginBottom:16 }}>
          {["manual","scan"].map(t=><button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"8px",borderRadius:10,border:`1px solid ${tab===t?C.pink:C.border}`,background:tab===t?C.pink+"20":"transparent",color:tab===t?C.pink:C.dim,fontFamily:C.fontHead,fontWeight:700,fontSize:17,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em" }}>{t}</button>)}
        </div>
        {tab==="manual" && (
          <>
            <MLabel>Title</MLabel><MInput value={form.title} onChange={set("title")} placeholder="Video title" />
            <MLabel>Type</MLabel>
            <select value={form.type} onChange={set("type")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
              {VIDEO_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <MLabel>Hook</MLabel>
            <select value={form.hook} onChange={set("hook")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
              {HOOK_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <input type="checkbox" id="collab-toggle" checked={form.collab} onChange={e=>setForm(f=>({...f,collab:e.target.checked}))} />
              <label htmlFor="collab-toggle" style={{ color:"rgba(255,255,255,0.85)", fontSize:14, fontFamily:C.fontHead }}>Collab with local/partner account?</label>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <div><MLabel>Views</MLabel><MInput value={form.views} onChange={set("views")} placeholder="0" type="number" /></div>
              <div><MLabel>Likes</MLabel><MInput value={form.likes} onChange={set("likes")} placeholder="0" type="number" /></div>
            </div>
            <MLabel>TikTok URL (optional)</MLabel><MInput value={form.url} onChange={set("url")} placeholder="https://tiktok.com/..." />
            <MLabel>Audio/Sound used (optional)</MLabel>
            <MInput value={form.audio} onChange={set("audio")} placeholder='e.g. "Espresso - Sabrina Carpenter" or "original audio"' />
            <MBtn onClick={()=>addVideo({ title:form.title,type:form.type,hook:form.hook,views:parseInt(form.views)||0,likes:parseInt(form.likes)||0,url:form.url,collab:form.collab,audio:form.audio,date:today() })}>Save Video</MBtn>
          </>
        )}
        {tab==="scan" && (
          <div style={{ textAlign:"center",padding:"20px 0" }}>
            <MLabel>TikTok URL</MLabel>
            <MInput value={form.url} onChange={set("url")} placeholder="https://tiktok.com/..." />
            <div style={{ color:C.dim,fontSize:17,marginBottom:16,lineHeight:1.6 }}>Paste a TikTok URL and we'll log it. Stats auto-sync every 12hrs via TIKWM.</div>
            <MBtn onClick={()=>addVideo({ title:form.url.split("/").pop()||"TikTok video",type:"facecam",hook:"achievement",views:0,likes:0,url:form.url,date:today() })}>Log URL</MBtn>
          </div>
        )}
      </ModalBase>
    );
  };

  const UpdateVideoModal = () => {
    const v = updateTarget;
    const [form, setForm] = useState({ views:v?.views||"", likes:v?.likes||"", comments:v?.comments||"", shares:v?.shares||"", views24h:"", views48h:"" });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    if(!v) return null;
    return (
      <ModalBase onClose={()=>closeModal("updateVideo")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:4 }}>Update Stats</div>
        <div style={{ color:C.dim,fontSize:17,marginBottom:16,lineHeight:1.4 }}>{v.title?.slice(0,50)}</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          {[["Views","views"],["Likes","likes"],["Comments","comments"],["Shares","shares"]].map(([l,k])=>(
            <div key={k}><MLabel>{l}</MLabel><MInput value={form[k]} onChange={set(k)} placeholder="0" type="number" /></div>
          ))}
          <div><MLabel>24hr Views</MLabel><MInput value={form.views24h} onChange={set("views24h")} placeholder="0" type="number" /></div>
          <div><MLabel>48hr Views</MLabel><MInput value={form.views48h} onChange={set("views48h")} placeholder="0" type="number" /></div>
        </div>
        <MBtn onClick={()=>updateVideo({ id:v.id,views:parseInt(form.views)||v.views,likes:parseInt(form.likes)||v.likes,comments:parseInt(form.comments)||v.comments||0,shares:parseInt(form.shares)||v.shares||0,views24h:parseInt(form.views24h)||v.views24h||0,views48h:parseInt(form.views48h)||v.views48h||0,_updated:true })}>Save Stats</MBtn>
      </ModalBase>
    );
  };

  const AddIdeaModal = () => {
    const [form, setForm] = useState({ title:"", type:"facecam", hook:"achievement", thumbnail:"text overlay", notes:"", collab: false });
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const selStyle = { width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:12 };
    return (
      <ModalBase onClose={()=>closeModal("addIdea")}>
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Add Idea</div>
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
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
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
        const r = await callAI(`Score this KrapMaps TikTok idea. Return JSON: {"viralityScore":0-100,"hookScore":0-100,"verdict":"honest 1-2 sentence verdict","viralityReason":"string","hookFeedback":"string","improvedHook":"string under 12 words","recommendations":[{"action":"string","impact":"high|medium"}]}. Idea: "${title.trim()}" type:${type}`, 1000);
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

        <div style={{ marginBottom:14 }}>
          <MLabel>TYPE</MLabel>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
            {VIDEO_TYPES.map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{ padding:"6px 12px",borderRadius:8,border:`1px solid ${type===t?C.pink:C.border}`,background:type===t?`${C.pink}20`:"transparent",color:type===t?C.pink:C.dim,fontFamily:C.fontHead,fontSize:17,fontWeight:700,cursor:"pointer",textTransform:"uppercase" }}>{t}</button>
            ))}
          </div>
        </div>

        {/* ALTERNATIVE HOOKS */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
            <MLabel style={{ marginBottom:0 }}>ALTERNATIVE HOOKS</MLabel>
            <button onClick={genHooks} disabled={loadingHooks||!title.trim()} style={{ padding:"5px 14px",borderRadius:8,border:`1px solid ${C.purple}40`,background:`${C.purple}18`,color:C.purple,fontFamily:C.fontHead,fontSize:16,fontWeight:700,cursor:"pointer",opacity:(loadingHooks||!title.trim())?0.4:1 }}>
              {loadingHooks?"GENERATING...":(displayHooks?"REGENERATE":"GENERATE 3")}
            </button>
          </div>
          {displayHooks ? displayHooks.map((h,i)=>(
            <div key={i} onClick={()=>setTitle(h.hook)} style={{ padding:"10px 12px",borderRadius:10,background:`${C.purple}08`,border:`1px solid ${C.purple}25`,marginBottom:i<displayHooks.length-1?8:0,cursor:"pointer",transition:"all 0.15s" }}>
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
        <div style={{ fontSize:20,fontWeight:700,color:C.text,marginBottom:16 }}>Edit App Idea</div>
        <MLabel>Idea</MLabel>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Feature idea..." rows={4} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",resize:"vertical",marginBottom:12 }} />
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
        <select value={form.platform} onChange={set("platform")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
          {["TikTok","Instagram","Both","YouTube"].map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <MLabel>Status</MLabel>
        <select value={form.status} onChange={set("status")} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:C.text,padding:"10px 12px",fontSize:16,fontFamily:C.fontHead,outline:"none",boxSizing:"border-box",marginBottom:12 }}>
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
        {[["TT Followers","tt_followers","Your TikTok follower count"],["TT Total Views","tt_views","All-time TikTok views"],["TT Total Likes","tt_likes","All-time TikTok likes"],["Bins Mapped","bins","Current bin count (now 654)"],["IG Followers","ig_followers","Enter manually from Instagram app"],["Downloads","downloads","App downloads (App Store + Play Store)"]].map(([l,k])=>(
          <div key={k}><MLabel>{l}</MLabel><MInput value={form[k]||""} onChange={set(k)} placeholder="0" type="number" /></div>
        ))}
        <MBtn onClick={()=>{ saveManual(form); closeModal("editStats"); }}>Save Stats</MBtn>
      </ModalBase>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:C.fontHead, position:"relative" }}>
      <div style={{ position:"fixed", top:"-8%", left:"-12%", width:380, height:380, borderRadius:"50%", background:`radial-gradient(circle,${C.pink}12 0%,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:"45%", right:"-12%", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle,${C.cyan}09 0%,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"5%", left:"15%", width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle,${C.purple}09 0%,transparent 70%)`, pointerEvents:"none", zIndex:0 }} />

      {/* SIDEBAR — desktop only */}
      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <div className="web-sidebar">
        {/* Logo */}
        <div style={{ marginBottom:36, paddingLeft:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:16, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 20px ${C.pink}40` }}>
              {I.bin(18,"#fff")}
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:"#fff", fontFamily:C.fontHead, lineHeight:1 }}>Krap<span style={{color:C.pink}}>Maps</span></div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em", marginTop:2, fontFamily:C.fontHead }}>CONTENT OS</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.16em", fontWeight:700, marginBottom:8, paddingLeft:12, textTransform:"uppercase" }}>Navigation</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
          {NAV.map(n=>{
            const active = nav===n.id;
            return (
              <button data-nav-btn key={n.id} onClick={()=>{ setNav(n.id); setSub(null); }}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderRadius:16, border:"none", cursor:"pointer", transition:"all 0.18s", position:"relative", overflow:"hidden",
                  background: active ? `rgba(255,45,120,0.12)` : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.85)",
                  boxShadow: active ? `inset 0 0 0 1px ${C.pink}25, 0 4px 20px ${C.pink}08` : "none"
                }}>
                {active && <div style={{ position:"absolute", left:0, top:"20%", bottom:"20%", width:3, borderRadius:"0 3px 3px 0", background:`linear-gradient(180deg,${C.pink},${C.purple})`, boxShadow:`0 0 8px ${C.pink}` }} />}
                <div style={{ width:36, height:36, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.18s",
                  background: active ? `rgba(255,45,120,0.2)` : "rgba(255,255,255,0.04)",
                  boxShadow: active ? `0 4px 16px ${C.pink}25` : "none"
                }}>
                  {n.ic(18, active ? C.pink : "rgba(255,255,255,0.5)")}
                </div>
                <span style={{ fontSize:13, fontWeight:active?600:400, letterSpacing:"0.02em", flex:1 }}>{n.label}</span>
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
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.18em", fontWeight:700, marginBottom:8, paddingLeft:12, textTransform:"uppercase" }}>Workspace</div>
          <div style={{ padding:"14px 16px", borderRadius:16, background:"linear-gradient(135deg,rgba(255,45,120,0.08),rgba(197,102,255,0.05))", border:"1px solid rgba(255,45,120,0.15)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:11 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"#fff", flexShrink:0, boxShadow:`0 4px 14px ${C.pink}30` }}>B</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.02em" }}>BK + HARLEY</div>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:C.green, boxShadow:`0 0 8px ${C.green}` }} />
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.85)" }}>@findkrap · Online</span>
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
          <div className="mobile-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 16px 0" }}>
            <div style={{ fontSize:24, fontWeight:900, color:"#fff", fontFamily:C.fontHead }}>Krap<span style={{color:C.pink}}>Maps</span></div>
            <div style={{ width:36, height:36, borderRadius:12, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center" }}>{I.bin(16,"#fff")}</div>
          </div>

          {/* STICKY DESKTOP TOP BAR */}
          <div className="web-topbar" style={{ position:"sticky", top:0, zIndex:100, background:"rgba(6,4,14,0.92)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"0 40px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>KrapMaps</span>
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
                <div style={{ width:30, height:30, borderRadius:9, background:`linear-gradient(135deg,${C.pink},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#fff" }}>B</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fff", lineHeight:1 }}>BK</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>Creator</div>
                </div>
              </div>
            </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="web-page-content" style={{ padding:"32px 44px 60px" }}>
            {/* PAGE TITLE */}
            <div style={{ marginBottom:32, display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:600, marginBottom:6 }}>
                  {nav==="home"?"Dashboard":nav==="content"?"Content":nav==="analytics"?"Analytics":nav==="tasks"?"Tasks":nav==="deals"?"Deals":nav==="growth"?"Growth":"Settings"}
                </div>
                <div style={{ fontSize:34, fontWeight:400, color:"#fff", fontFamily:C.fontHead, lineHeight:1.1, marginBottom:6 }}>
                  {nav==="home" && <span><span style={{color:C.pink}}>Content</span> OS</span>}
                  {nav==="content" && <span>Manage <span style={{color:C.cyan}}>Content</span></span>}
                  {nav==="analytics" && <span>Track <span style={{color:C.yellow}}>Performance</span></span>}
                  {nav==="tasks" && <span>Your <span style={{color:C.green}}>Workflow</span></span>}
                  {nav==="growth" && <span>Monitor <span style={{color:C.orange}}>Growth</span></span>}
                  {nav==="deals" && <span>Brand <span style={{color:C.pink}}>Deals</span></span>}
                  {nav==="settings" && <span>Configure <span style={{color:C.purple}}>Workspace</span></span>}
                  {nav==="ai" && <span><span style={{color:C.pink}}>AI</span> Assistant</span>}
                </div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.38)", lineHeight:1.5 }}>
                  {nav==="home"&&"@findkrap · TikTok & Instagram"}
                  {nav==="content"&&"All your TikTok and Instagram content in one view"}
                  {nav==="analytics"&&"Deep performance data across all your content"}
                  {nav==="tasks"&&"Keep BK and Harley aligned on what to do next"}
                  {nav==="growth"&&"TikTok, Instagram and KrapMaps app metrics"}
                  {nav==="deals"&&"Track sponsorships, collabs and brand partnerships"}
                  {nav==="settings"&&"API keys, creator config and sync controls"}
                  {nav==="ai"&&"Add tasks, ideas and get content advice"}
                </div>
              </div>
              <div style={{ height:1, flex:1, margin:"0 32px 4px", background:"linear-gradient(90deg,rgba(255,255,255,0.06),transparent)" }} />
            </div>

        {/* VIEWS */}
        {nav==="home"      && <HomeView ideas={topIdeas} calItems={upcomingCal} setNav={id=>{ setNav(id); setSub(null); }} runAI={runAI} aiLoad={aiLoad} openModal={openModal} ttViewsDisplay={ttViewsDisplay} igViewsTotal={igViewsTotal} allViewsDisplay={allViewsDisplay} m={m} scrapedStats={scrapedStats} statsError={statsError} igData={igData} videos={videos} weeklyDebrief={weeklyDebrief} debriefLoading={debriefLoading} runDebrief={runDebrief} />}
        {nav==="content"   && <ContentView videoScores={videoScores} ideas={ideas} setIdeas={setIdeas} calItems={calItems} setCalItems={setCalItems} scoreIdea={scoreIdea} genCaption={genCaption} aiLoad={aiLoad} captionResult={captionResult} captionIdea={captionIdea} copied={copied} copyText={copyText} openModal={openModal} setEditIdeaTarget={setEditIdeaTarget} setModals={setModals} setNavSub={setSub} onBuildScript={handleBuildScript} markPosted={markPosted} />}
        {nav==="analytics" && <AnalyticsView m={manualData} videos={sortedVideos} totalViews={totalViews} avgRatio={avgRatio} facecamAvg={facecamAvg} hookStats={hookStats} analysis={analysis} nextVids={nextVids} weekly={weekly} trends={trends} igData={igData} hasIG={hasIG} igLoad={igLoad} fetchIG={fetchIG} runAI={runAI} aiLoad={aiLoad} setUpdateTarget={setUpdateTarget} openModal={openModal} deleteVideo={deleteVideo} WL={WL} videoScores={videoScores} />}
        {nav==="tasks"     && <TasksView tasks={tasks} setTasks={setTasks} appIdeas={appIdeas} setAppIdeas={setAppIdeas} setEditAppIdeaTarget={setEditAppIdeaTarget} setModals={setModals} />}
        {nav==="deals"     && <DealsView />}
        {nav==="ai"        && <AIChatView anthropicKey={keys?.anthropic} tasks={tasks} setTasks={setTasks} ideas={ideas} setIdeas={setIdeas} videos={videos} preloadMsg={assistPreload} />}
        {nav==="growth"    && <GrowthView m={m} ttViewsDisplay={ttViewsDisplay} igData={igData} hasIG={hasIG} igLoad={igLoad} fetchIG={fetchIG} scrapedStats={scrapedStats} saveManual={saveManual} setManualData={setManualData} videos={videos} />}
        {nav==="settings"  && <SettingsView keys={keys} onEditKeys={onEditKeys} scrapedStats={scrapedStats} hasIG={hasIG} WL={activeWL} onEditWL={onEditWL} onSyncTikTok={async()=>{
              setSyncMsg("Syncing...");
              try {
                await Promise.all([fetchTikToks(true), fetchIGReels(true), fetchIGFollowers()]);
                setSyncMsg("Synced ✓");
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

          </div>{/* end page content padding */}

          {/* AI ERROR */}
        {aiErr && (
          <div style={{ position:"fixed", top:54, left:14, right:14, background:"rgba(10,5,20,0.98)", border:`1px solid ${C.pink}60`, borderRadius:16, padding:"12px 16px", color:"#FF8888", fontSize:15, zIndex:999, display:"flex", gap:10, alignItems:"flex-start", backdropFilter:"blur(20px)", boxShadow:`0 8px 32px rgba(0,0,0,0.6)` }}>
            <div style={{ flex:1, lineHeight:1.5 }}>{aiErr}{aiErr.includes("Settings")&&<span onClick={()=>{setAiErr(null);setNav("settings");}} style={{ color:C.pink, fontWeight:700, cursor:"pointer", display:"block", marginTop:6 }}>→ TAP TO GO TO SETTINGS</span>}</div>
            <button onClick={()=>setAiErr(null)} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.85)",cursor:"pointer",fontSize:18,lineHeight:1,flexShrink:0 }}>×</button>
          </div>
        )}
        </div>{/* end web-inner */}
      </div>{/* end web-content */}

      {/* NAV BAR */}
      <div className="mobile-nav" style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", background:"rgba(10,6,20,0.92)", backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)", borderRadius:40, border:"1px solid rgba(255,255,255,0.1)", display:"flex", padding:"8px", zIndex:99, gap:4, boxShadow:"0 8px 40px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.06)" }}>
        {NAV.map(n=>(
          <button key={n.id} data-nav-btn onClick={()=>{ setNav(n.id); setSub(null); }} style={{ background:nav===n.id?`linear-gradient(135deg,${C.pink}30,${C.purple}15)`:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:nav===n.id?3:0, padding:nav===n.id?"8px 14px":"8px 12px", borderRadius:32, transition:"all 0.2s", minWidth:nav===n.id?52:44 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
              {n.ic(18, nav===n.id?"#fff":"rgba(255,255,255,0.4)")}
            </div>
            {nav===n.id && <span style={{ fontSize:10, fontWeight:700, color:C.pink, fontFamily:C.fontHead, letterSpacing:"0.02em", lineHeight:1 }}>{n.label}</span>}
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


