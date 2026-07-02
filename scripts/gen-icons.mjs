#!/usr/bin/env node
// Generates the PWA icons as PNGs with zero dependencies (pure math + zlib).
// Design: dark rounded square, pink→purple diagonal gradient ring "C" mark.
// Run: node scripts/gen-icons.mjs   (writes into public/)
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

// ── minimal PNG encoder ──
const crcTable = (() => { const t=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1; t[n]=c>>>0; } return t; })();
const crc32 = (buf) => { let c=0xFFFFFFFF; for(const b of buf) c = crcTable[(c^b)&0xFF] ^ (c>>>8); return (c^0xFFFFFFFF)>>>0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8]=8; ihdr[9]=6; // 8-bit RGBA
  const raw = Buffer.alloc(height * (1 + width*4));
  for(let y=0;y<height;y++){ raw[y*(1+width*4)] = 0; rgba.copy(raw, y*(1+width*4)+1, y*width*4, (y+1)*width*4); }
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── icon painter ──
const lerp = (a,b,t) => a+(b-a)*t;
function drawIcon(S) {
  const px = Buffer.alloc(S*S*4);
  const corner = S*0.22;                 // rounded-square corner radius
  const cx=S/2, cy=S/2;
  const rOuter=S*0.30, rInner=S*0.175;   // ring "C"
  const gapHalf = Math.PI/4.4;           // half-angle of the C opening (faces right)
  const AA = 1.6;                        // soft-edge width in px
  const bgTop=[13,9,26], bgBot=[7,5,15]; // dark vertical bg gradient
  const gA=[255,45,120], gB=[197,102,255]; // pink → purple

  const sd = (x,y) => { // signed distance to rounded-square edge (positive = inside)
    const dx=Math.max(Math.abs(x-cx)-(S/2-corner),0), dy=Math.max(Math.abs(y-cy)-(S/2-corner),0);
    return corner - Math.hypot(dx,dy);
  };
  for(let y=0;y<S;y++) for(let x=0;x<S;x++){
    const i=(y*S+x)*4;
    const inside = sd(x+0.5,y+0.5);
    if(inside<=0){ px[i+3]=0; continue; }
    const edge = Math.min(1, inside/AA);
    const t=y/S;
    let r=lerp(bgTop[0],bgBot[0],t), g=lerp(bgTop[1],bgBot[1],t), b=lerp(bgTop[2],bgBot[2],t);
    // ring "C"
    const dx=x+0.5-cx, dy=y+0.5-cy;
    const dist=Math.hypot(dx,dy);
    const ringDist = Math.min(rOuter-dist, dist-rInner);           // >0 inside annulus
    let ang = Math.atan2(dy,dx);                                    // gap centered at 0 rad (right)
    const angDist = (Math.abs(ang)-gapHalf) * dist;                 // >0 outside the gap, in px
    const cov = Math.min(1, Math.max(0, Math.min(ringDist, angDist)/AA));
    if(cov>0){
      const gt=(x+y)/(2*S);
      const cr=lerp(gA[0],gB[0],gt), cg=lerp(gA[1],gB[1],gt), cb=lerp(gA[2],gB[2],gt);
      r=lerp(r,cr,cov); g=lerp(g,cg,cov); b=lerp(b,cb,cov);
    }
    px[i]=Math.round(r); px[i+1]=Math.round(g); px[i+2]=Math.round(b); px[i+3]=Math.round(255*edge);
  }
  return encodePNG(S,S,px);
}

mkdirSync("public", { recursive: true });
for(const size of [180, 192, 512]) {
  const name = size===180 ? "public/apple-touch-icon.png" : `public/icon-${size}.png`;
  writeFileSync(name, drawIcon(size));
  console.log("wrote", name);
}
console.log("done");
