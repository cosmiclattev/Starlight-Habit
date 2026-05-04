/* ─────────────────────────────────────
   별빛달빛해빗 Service Worker v1.0
   PRD: PWA for Android Chrome + Samsung DeX
───────────────────────────────────── */
var CACHE_NAME = 'ymwt-cache-v1';
var CACHED_URLS = [
  './ymwt.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* 설치: 핵심 파일 캐시 */
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHED_URLS).catch(function(err) {
        console.warn('[SW] Some files could not be cached:', err);
      });
    }).then(function() {
      console.log('[SW] Installed successfully');
      return self.skipWaiting();
    })
  );
});

/* 활성화: 이전 캐시 정리 */
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      console.log('[SW] Activated');
      return self.clients.claim();
    })
  );
});

/* 요청 처리: Cache-first, Network fallback */
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(function(networkResponse) {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        var responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(function() {
        /* 오프라인 + 캐시 없음: 조용히 실패 */
      });
    })
  );
});
