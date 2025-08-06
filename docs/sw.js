const CACHE_NAME = 'real-estate-map-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
  '/logo192.png',
  '/logo512.png'
];

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache addAll failed:', error);
      })
  );
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  // 정적 파일만 캐시
  if (event.request.url.includes('/static/') || 
      event.request.url.includes('/manifest.json') ||
      event.request.url.includes('/favicon.ico') ||
      event.request.url.includes('/logo')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 캐시에서 찾으면 반환
          if (response) {
            return response;
          }
          
          // 캐시에 없으면 네트워크에서 가져오기
          return fetch(event.request).then(
            (response) => {
              // 유효한 응답이 아니면 그대로 반환
              if (!response || response.status !== 200) {
                return response;
              }

              // 응답을 복제하여 캐시에 저장
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.log('Cache put failed:', error);
                });

              return response;
            }
          ).catch((error) => {
            console.log('Fetch failed:', error);
            return new Response('Network error', { status: 503 });
          });
        })
    );
  } else {
    // 다른 요청은 네트워크 우선
    event.respondWith(fetch(event.request));
  }
}); 