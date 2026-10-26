// Majick Ball cache-first service worker (2026-10-26)
// Purpose: Home Screen launches must survive airplane mode. iOS re-fetches
// start_url on every standalone launch; this SW answers from cache first,
// network only as background refresh. HTTPS-only hosts (ngrok, GitHub Pages);
// never registers on LAN HTTP or file:// — registration gate in the pages.
// Dormant-code philosophy: update the version string to force a cache refresh.
const CACHE = 'majick-ball-v1';
const ASSETS = [
  './magic-9ball.html',
  './magic-8ball.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((resp) => {
        if (resp.ok && new URL(e.request.url).origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return resp;
      }).catch(() =>
        // Offline miss on a non-cached URL: retry cache for the request itself
        // (covers 8ball too), then degrade to the 9ball shell as last resort.
        caches.match(e.request, { ignoreSearch: true })
          .then((hit) => hit || caches.match('./magic-9ball.html'))
      );
    })
  );
});