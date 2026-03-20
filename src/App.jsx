import { useState, useEffect, useCallback, useRef } from "react";

// Inject styles + fonts
if(typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}.loading-pulse{animation:pulse 1.5s ease-in-out infinite}";
  document.head.appendChild(style);
}
