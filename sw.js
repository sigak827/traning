// Tornet: gör att appen öppnas även utan internet.
// Hämtar alltid senaste versionen när det finns nät och sparar en kopia.
const CACHE = 'tornet-v1';
const FILES = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const wait = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
  e.respondWith(
    Promise.race([fetch(req), wait])
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(hit => hit || caches.match('./index.html'))
          .then(hit => hit || fetch(req))
      )
  );
});
