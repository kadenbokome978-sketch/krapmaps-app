import { useState, useEffect, useCallback, useRef } from "react";

// Inject styles + fonts
if(typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}.loading-pulse{animation:pulse 1.5s ease-in-out infinite}input::placeholder,textarea::placeholder{color:#7A5A8A!important;opacity:1}input,textarea,select{color-scheme:dark}";
  document.head.appendChild(style);
}
// Inject fonts
if(typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sora:wght@600;700;800;900&family=Barlow:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
}

/
