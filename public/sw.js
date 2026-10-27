/* ==========================================================================
   BizFlow Ethiopia - Service Worker
   Safe offline fallback & static asset caching.
   Strict rule: ZERO caching of /api/* routes, auth pages, or financial data.
   ========================================================================== */

const CACHE_NAME = 'bizflow-static-v2';
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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
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

  // 2. API ROUTES & AUTHENTICATION: Strictly Network-Only (Bypass Service Worker)
  // Completely bypass service worker interception so the browser handles authentication,
  // login redirects, and API calls natively without SW wrapper promise rejections.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/forgot-password') ||
    url.pathname.startsWith('/reset-password')
  ) {
    return; // Do NOT call event.respondWith - allow native browser network stack to handle directly
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
  event.respondWith(
    fetch(request).catch(() => {
      if (request.mode === 'navigate') {
        return caches.match(OFFLINE_FALLBACK_URL);
      }
      return new Response(JSON.stringify({ error: "Network error" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
