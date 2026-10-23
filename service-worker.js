const CACHE_NAME = 'cafe-milano-cleaning-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/icon-180.png'
];

// Requests that should always be re-fetched when online, so a deploy shows
// up the next time the app is opened instead of staying stuck on whatever
// was cached at install time. Everything else (icons, fonts, etc.) rarely
// changes, so cache-first there is fine and keeps things fast/offline-safe.
function isAppShellRequest(request) {
  if (request.mode === 'navigate') return true;
  const url = new URL(request.url);
  return url.origin === self.location.origin &&
    (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/manifest.webmanifest'));
}

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for the app shell (index.html/manifest/navigations) so
// edits show up as soon as the device is online again; cache-first for
// everything else (icons etc.), with the app shell's cached copy as the
// offline fallback either way.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  if (isAppShellRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cache successful same-origin responses for next time
          if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached — fall back to the app shell for navigations
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
