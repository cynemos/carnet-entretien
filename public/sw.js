// Service worker : rend l'appli installable et l'ouvre même hors réseau (données non disponibles
// hors ligne : elles viennent de l'API à chaque fois). Les fichiers /assets/ ont un nom haché
// et ne changent jamais : ils sont servis depuis le cache. Les pages passent d'abord par le réseau.
const CACHE = 'carnet-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/embleme.svg', '/manifest.webmanifest'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(c => c !== CACHE).map(c => caches.delete(c))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // API et fichiers : jamais en cache

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(rep => { const copie = rep.clone(); caches.open(CACHE).then(c => c.put('/', copie)); return rep; })
      .catch(() => caches.match('/')));
    return;
  }

  if (url.pathname.startsWith('/assets/') || /\.(png|svg|woff2?)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(enCache => enCache || fetch(req).then(rep => {
      if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
      return rep;
    })));
  }
});
