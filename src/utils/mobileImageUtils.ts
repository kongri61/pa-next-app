// 모바일 이미지 처리 유틸리티 함수
export const getMobileImageUrls = (propertyId: string): string[] => {
  // 모바일에서 안정적으로 작동하는 이미지 URL들 (다양한 서비스 사용)
  const mobileImageUrls = [
    // 1차: Unsplash (안정적이고 빠름)
    `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop&auto=format&q=80`,
    `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&auto=format&q=80`,
    `https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&auto=format&q=80`,
    `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format&q=80`,
    // 2차: Picsum (백업용)
    `https://picsum.photos/400/300?random=1`,
    `https://picsum.photos/400/300?random=2`,
    // 3차: Placeholder (최후 수단)
    `https://via.placeholder.com/400x300/667eea/ffffff?text=매물${propertyId.slice(-2)}`,
    `https://via.placeholder.com/400x300/764ba2/ffffff?text=Property`
  ];
  
  return mobileImageUrls;
};

// 모바일에서 안전한 이미지 URL 생성
export const getSafeImageUrl = (originalUrl: string, propertyId: string, index: number = 0): string => {
  // 원본 URL이 유효한지 확인
  if (originalUrl && originalUrl.startsWith('http')) {
    return originalUrl;
  }
  
  // 안전한 기본 이미지 URL 반환
  const safeUrls = getMobileImageUrls(propertyId);
  return safeUrls[index % safeUrls.length];
};

// 모바일 이미지 로딩 상태 관리
export const createMobileImageLoader = (propertyId: string) => {
  const imageUrls = getMobileImageUrls(propertyId);
  let currentIndex = 0;
  
  return {
    getCurrentImage: () => imageUrls[currentIndex],
    getNextImage: () => {
      currentIndex = (currentIndex + 1) % imageUrls.length;
      return imageUrls[currentIndex];
    },
    hasMoreImages: () => currentIndex < imageUrls.length - 1,
    reset: () => {
      currentIndex = 0;
    },
    getCurrentIndex: () => currentIndex
  };
};

// 모바일에서 이미지 로딩 실패 시 처리
export const handleMobileImageError = (
  target: HTMLImageElement,
  propertyId: string,
  loader: ReturnType<typeof createMobileImageLoader>
): boolean => {
  console.log(`모바일 이미지 로딩 실패 - 매물 ${propertyId}, 현재 인덱스: ${loader.getCurrentIndex()}`);
  
  if (loader.hasMoreImages()) {
    // 다음 이미지로 시도
    const nextImageUrl = loader.getNextImage();
    console.log(`다음 이미지로 시도: ${nextImageUrl}`);
    
    // 이미지 로딩 타임아웃 설정 (5초)
    const timeoutId = setTimeout(() => {
      console.log(`이미지 로딩 타임아웃: ${nextImageUrl}`);
      target.dispatchEvent(new Event('error'));
    }, 5000);
    
    // 이미지 로딩 성공 시 타임아웃 클리어
    const originalOnLoad = target.onload;
    target.onload = (e) => {
      clearTimeout(timeoutId);
      if (originalOnLoad) originalOnLoad.call(target, e);
    };
    
    target.src = nextImageUrl;
    return true; // 재시도 중
  } else {
    // 모든 이미지 실패 시 폴백 아이콘 표시
    console.log(`모든 이미지 로딩 실패 - 폴백 아이콘 표시`);
    target.style.display = 'none';
    
    const parent = target.parentElement;
    if (parent && !parent.querySelector('.fallback-icon')) {
      const fallback = document.createElement('div');
      fallback.className = 'fallback-icon';
      fallback.textContent = '🏠';
      fallback.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2rem;
        color: white;
        z-index: 1;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        animation: fadeIn 0.3s ease-in;
      `;
      
      // CSS 애니메이션 추가
      if (!document.querySelector('#fallback-animation')) {
        const style = document.createElement('style');
        style.id = 'fallback-animation';
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `;
        document.head.appendChild(style);
      }
      
      parent.appendChild(fallback);
    }
    return false; // 재시도 불가
  }
};

// 모바일 이미지 로딩 성공 시 처리
export const handleMobileImageLoad = (target: HTMLImageElement): void => {
  console.log('모바일 이미지 로딩 성공');
  
  const parent = target.parentElement;
  const loading = parent?.querySelector('.image-loading') as HTMLElement;
  const fallback = parent?.querySelector('.fallback-icon');
  
  if (loading) {
    loading.style.display = 'none';
  }
  if (fallback) {
    fallback.remove();
  }
  
  // 부드러운 페이드인 애니메이션
  target.style.transition = 'opacity 0.3s ease-in-out';
  target.style.opacity = '1';
  target.style.display = 'block';
  
  // 이미지 캐시 최적화를 위한 메타데이터 추가
  if (!target.hasAttribute('data-loaded')) {
    target.setAttribute('data-loaded', 'true');
    target.setAttribute('data-load-time', Date.now().toString());
  }
};

// 모바일 이미지 프리로딩 함수
export const preloadMobileImages = (propertyId: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const imageUrls = getMobileImageUrls(propertyId);
    const loadedImages: string[] = [];
    let completed = 0;
    
    const checkComplete = () => {
      if (completed === imageUrls.length) {
        if (loadedImages.length > 0) {
          resolve(loadedImages);
        } else {
          reject(new Error('모든 이미지 로딩 실패'));
        }
      }
    };
    
    imageUrls.forEach((url, index) => {
      const img = new Image();
      img.onload = () => {
        loadedImages[index] = url;
        completed++;
        checkComplete();
      };
      img.onerror = () => {
        completed++;
        checkComplete();
      };
      img.src = url;
    });
  });
};

// 모바일 이미지 캐시 관리
export const manageMobileImageCache = (): void => {
  const cacheKey = 'mobile_image_cache';
  const maxCacheSize = 50; // 최대 50개 이미지 캐시
  
  try {
    const cachedImages = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    
    // 캐시 크기 제한
    if (cachedImages.length > maxCacheSize) {
      const trimmedCache = cachedImages.slice(-maxCacheSize);
      localStorage.setItem(cacheKey, JSON.stringify(trimmedCache));
    }
  } catch (error) {
    console.error('이미지 캐시 관리 오류:', error);
    localStorage.removeItem(cacheKey);
  }
};

// 모바일 이미지 성능 모니터링
export const monitorMobileImagePerformance = (propertyId: string, startTime: number): void => {
  const loadTime = Date.now() - startTime;
  const performanceData = {
    propertyId,
    loadTime,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown'
  };
  
  console.log('모바일 이미지 성능 데이터:', performanceData);
  
  // 성능 데이터를 localStorage에 저장 (선택적)
  try {
    const performanceKey = 'mobile_image_performance';
    const existingData = JSON.parse(localStorage.getItem(performanceKey) || '[]');
    existingData.push(performanceData);
    
    // 최근 100개 데이터만 유지
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }
    
    localStorage.setItem(performanceKey, JSON.stringify(existingData));
  } catch (error) {
    console.error('성능 데이터 저장 오류:', error);
  }
};

