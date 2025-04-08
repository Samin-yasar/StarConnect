const CACHE_NAME = 'private-wave-cache-v1';
const BASE_PATH = '/Private-Wave/'; 

const ASSETS_TO_CACHE = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}offline.html`, 
];

// Install event - Caching essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch((error) => {
      console.error('Service Worker: Failed to cache assets', error);
    })
  );
});

// Activate event - Clean up old caches
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
});

// Fetch event - Serving from cache first, then fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Service Worker: Serving from cache', event.request.url);
        return cachedResponse;
      }

      console.log('Service Worker: Fetching from network', event.request.url);
      return fetch(event.request).catch(() => {
        return new Response('You are offline. Please check your internet.');
        // Or serve: caches.match(`${BASE_PATH}offline.html`)
      });
    })
  );
});
