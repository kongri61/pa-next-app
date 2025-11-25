const CACHE_NAME = 'real-estate-map-v6'; // 버전 업데이트: 초기 로딩 최적화 - index.tsx에서 데이터 사전 로드
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
      ).then(() => {
        // 모든 클라이언트에게 즉시 제어권 부여 및 강제 새로고침
        return self.clients.claim().then(() => {
          // 모든 클라이언트에게 새 버전 알림
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: 'SW_UPDATED', cacheName: CACHE_NAME });
            });
          });
        });
      });
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // HTML과 메인 JS 파일은 항상 네트워크에서 가져오기 (캐시 무시)
  if (url.pathname === '/' || 
      url.pathname === '/index.html' ||
      url.pathname.includes('/static/js/main.') ||
      url.pathname.includes('/static/js/') && url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // 네트워크 실패 시에만 캐시 확인
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // 정적 파일만 캐시 (로고, 아이콘 등)
  if (event.request.url.includes('/manifest.json') ||
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