// Service worker d'Envol : garde l'application en cache pour l'ouvrir hors ligne.
// La version et la liste des fichiers sont remplies par build.mjs ; une nouvelle version déclenche la mise à jour.
const VERSION = '6588c85618';
const CACHE = 'envol-' + VERSION;
const ASSETS = ["./","app.js?v=6588c85618","app.css?v=6588c85618","config.js?v=6588c85618","manifest.webmanifest","favicon.svg","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","fonts/bricolage-grotesque-latin-opsz-normal.woff2","fonts/geist-latin-wght-normal.woff2","fonts/geist-mono-latin-wght-normal.woff2"];
const SCOPE = new URL('./', self.location).pathname;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(ASSETS.map((u) => fetch(new Request(u, { cache: 'reload' })).then((r) => {
      if (!r.ok) throw new Error(u + ' ' + r.status);
      return c.put(u, r);
    }))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('envol-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // GitHub (synchronisation) : toujours le réseau
  if (req.mode === 'navigate') {
    // Seule la page de l'application est servie depuis le cache
    if (url.pathname !== SCOPE && url.pathname !== SCOPE + 'index.html') return;
    e.respondWith(caches.match('./', { cacheName: CACHE }).then((hit) => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { cacheName: CACHE }).then((hit) => hit || fetch(req)));
});
