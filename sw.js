/* ================================================
   별빛달빛해빗 Service Worker
   전략: HTML은 항상 네트워크 우선 (최신 index.html 보장)
         정적 자원(아이콘 등)만 캐시
   index.html 갈아끼우면 자동으로 새 버전 적용됨
   ================================================ */

var CACHE = 'starlight-v3';
var STATIC = [
  '/Starlight-Habit/manifest.json',
  '/Starlight-Habit/icon-192.png',
  '/Starlight-Habit/icon-512.png'
];

/* 설치 - 정적 자원만 캐시 */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(STATIC).catch(function() {});
    }).then(function() {
      return self.skipWaiting(); /* 즉시 활성화 */
    })
  );
});

/* 활성화 - 이전 버전 캐시 삭제 */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim(); /* 즉시 모든 탭에 적용 */
    })
  );
});

/* 요청 처리 */
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;

  var url = new URL(e.request.url);

  /* HTML 문서 → 항상 네트워크 우선 (index.html 업데이트 즉시 반영) */
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        /* 오프라인일 때만 캐시 */
        return caches.match('/Starlight-Habit/index.html');
      })
    );
    return;
  }

  /* 정적 자원 → 캐시 우선, 없으면 네트워크 */
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function() {});
    })
  );
});
