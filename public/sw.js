/* ==========================================================================
   BizFlow Ethiopia - Service Worker
   Safe offline fallback & static asset caching.
   Strict rule: ZERO caching of /api/* routes, auth pages, or financial data.
   ========================================================================== */

const CACHE_NAME = 'bizflow-static-v1';
const OFFLINE_FALLBACK_URL = '/offline.html';

// Critical static assets for offline fallback & PWA shell
const PRECACHE_ASSETS = [
  OFFLINE_FALLBACK_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/store-owner.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. NON-GET requests (POST, PUT, DELETE, PATCH): Never touch service worker cache
  if (request.method !== 'GET') {
    return;
  }

  // 2. API ROUTES & AUTHENTICATION: Strictly Network-Only
  // Absolutely no caching of tenant data, sales, financial metrics, or credentials
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/register') ||
      url.pathname.startsWith('/forgot-password')) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Navigation requests (User browsing pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match(OFFLINE_FALLBACK_URL);
        if (cachedOffline) {
          return cachedOffline;
        }
        return new Response('Offline - No connection available.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // 4. Safe Static Assets (Images, Icons, Fonts)
  const isStaticAsset =
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Return empty or fallback if asset unavailable offline
          return caches.match(OFFLINE_FALLBACK_URL);
        });
      })
    );
    return;
  }

  // 5. Default: Network with graceful fail
  event.respondWith(fetch(request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
