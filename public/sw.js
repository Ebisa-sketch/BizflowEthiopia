/* ==========================================================================
   BizFlow Ethiopia - Service Worker (v3)
   Lightweight offline fallback & critical asset precaching.
   Strict rule: ZERO interception of /api/*, /_next/*, auth routes, or dynamic pages.
   ========================================================================== */

const CACHE_NAME = 'bizflow-static-v3';
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

  // 2. CRITICAL BYPASS: Never intercept Next.js chunks, API calls, auth routes, or app dashboards.
  // Allowing native browser network handling prevents Service Worker thread latency,
  // stops image deferral interventions, and prevents fetch promise rejections.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/forgot-password') ||
    url.pathname.startsWith('/reset-password') ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/sales') ||
    url.pathname.startsWith('/products') ||
    url.pathname.startsWith('/inventory') ||
    url.pathname.startsWith('/customers') ||
    url.pathname.startsWith('/expenses') ||
    url.pathname.startsWith('/reports') ||
    url.pathname.startsWith('/staff') ||
    url.pathname.startsWith('/settings')
  ) {
    return;
  }

  // 3. Navigation requests (Only show offline fallback if user loses connection)
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

  // 4. Precached Static App Assets (Manifest, Icons)
  const isPrecachedAsset =
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname === '/store-owner.svg';

  if (isPrecachedAsset) {
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
        });
      })
    );
    return;
  }

  // 5. Default: Let browser handle all other requests natively with zero SW interference
  return;
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
