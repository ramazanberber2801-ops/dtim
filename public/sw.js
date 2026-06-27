// DTIM Service Worker — basic offline caching for PWA
const CACHE_NAME = 'dtim-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/images/dtim-logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Network-first for API calls, cache-first for static assets
  const url = new URL(event.request.url);

  if (url.origin === location.origin) {
    // Same-origin: cache-first
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone).catch(() => {}));
          return response;
        }).catch(() => cached);
      })
    );
  } else {
    // Cross-origin (APIs): network-first, fallback to cache
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then((c) => c || new Response('', { status: 504 })))
    );
  }
});
