/* Topaman service worker: pages are always fetched fresh when online (no stale versions),
   the last copy is used only when there is no internet. */
const CACHE = 'topaman-v6';
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

/* notifications from topaman-bot/push.js (new chat message or a new ad for a saved search): {t: title, b: text, u: link, tag} */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { b: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.t || 'Topaman', {
    body: d.b || '', tag: d.tag || 'topaman', renotify: true,
    icon: 'icons/icon-192.png', data: { u: d.u || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const u = new URL((e.notification.data && e.notification.data.u) || './', self.registration.scope);
  const chat = u.searchParams.get('chat'), ad = u.searchParams.get('ad');
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => new URL(c.url).origin === location.origin && !new URL(c.url).pathname.includes('/admin'));
    if (w) { if (chat) w.postMessage({ chat }); else if (ad) w.postMessage({ ad }); return w.focus(); }
    return self.clients.openWindow(u.href);
  }));
});
