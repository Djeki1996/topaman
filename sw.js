/* Topaman service worker: pages are always fetched fresh when online (no stale versions),
   the last copy is used only when there is no internet. */
const CACHE = 'topaman-v4';
const CORE = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  /* pages and scripts are revalidated with the server every time, so updates show up at once */
  const fresh = req.mode === 'navigate' || /\.(html|js|webmanifest|png)$|\/$/.test(new URL(req.url).pathname);
  /* a navigation Request cannot be re-fetched with an init object (TypeError), so fetch by URL */
  const net = fresh ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  e.respondWith(net.then(res => {
    if (!res.ok) return res;
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('./'))));
});
