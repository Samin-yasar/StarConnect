const CACHE_NAME = 'private-wave-cache-v4'; // New cache name to force refresh

const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'offline.html',
  'crypto.js',
  'nacl-util.js',
  'nacl.min.js',
  'ui.js',
  'peer.js',
  'stars.js',
  'styles.css',
  'https://unpkg.com/simple-peer@9.11.1/simplepeer.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return Promise.all(
        ASSETS_TO_CACHE.map((asset) =>
          cache.add(asset).catch((err) => console.error('Failed to cache', asset, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Service Worker: Cache hit:', url.pathname);
        // Refresh CDN assets in background
        if (url.origin === 'https://cdnjs.cloudflare.com' || url.origin === 'https://unpkg.com') {
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('offline.html');
        }
        return new Response('Offline: Please check your connection.', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});
