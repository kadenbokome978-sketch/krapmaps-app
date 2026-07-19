// Greenlit service worker — makes the app installable (PWA) and gives a fast,
// offline-tolerant shell. Network-first for navigations (always fresh app),
// cache-first for static assets, and never touches API/auth calls.
const CACHE = "greenlit-v1";
const ASSETS = ["/dashboard", "/app.html", "/icon-192.png", "/icon-512.png", "/icon.svg", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Never cache API / auth / cross-origin — always hit the network live.
  if (req.method !== "GET" || url.pathname.startsWith("/api/") || url.origin !== self.location.origin) return;

  // App navigations: network-first (fresh build), fall back to cached shell offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put("/app.html", cp)); return r; })
        .catch(() => caches.match("/app.html") || caches.match("/dashboard"))
    );
    return;
  }

  // Static assets: cache-first, refresh in background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
