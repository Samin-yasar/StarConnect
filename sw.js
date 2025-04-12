const CACHE_NAME = 'private-wave-cache-v1';
const BASE_PATH = '/Private-Wave/';

const ASSETS_TO_CACHE = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}offline.html`,
  `${BASE_PATH}crypto.js`,
  `${BASE_PATH}crypto-js-min.js`,
  `${BASE_PATH}nacl.util.js`,
  `${BASE_PATH}nacl.js`,
  `${BASE_PATH}peer.js`,
  `${BASE_PATH}stars.js`,
  `${BASE_PATH}styles.css`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.error('Service Worker: Failed to cache:', error);
      });
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
            console.log('Service Worker: Delete old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Service Worker: Cache hit:', event.request.url);
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(`${BASE_PATH}offline.html`);
        }
        return new Response('Offline: Please check your connection.', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});
