// ── sw.js ──
// Bump VERSION on every deploy — triggers update banner in the app.
const VERSION  = 'segvision-v2';
const CACHE    = VERSION;
const PRECACHE = ['./', './index.html', './manifest.json', './css/style.css',
                  './js/main.js', './js/ui.js', './js/model.js', './js/ade20k.js',
                  './icon-192.svg', './icon-512.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  // Don't skipWaiting — wait for user to approve via banner
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go to network for CDN (model files, fonts)
  if (['cdn.jsdelivr.net','huggingface.co','fonts.googleapis.com','fonts.gstatic.com']
      .some(h => url.hostname.includes(h))) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }))
  );
});

// User approved update — skip waiting and take control
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
