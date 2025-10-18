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

// PC에서 등록한 이미지를 모바일에서 동기화하는 함수
export const syncPCImagesToMobile = (propertyId: string, pcImages: string[]): void => {
  try {
    console.log(`PC 이미지를 모바일로 동기화 시작 - 매물 ${propertyId}:`, pcImages);
    
    if (!pcImages || pcImages.length === 0) {
      console.log('PC 이미지가 없어 모바일 기본 이미지 사용');
      const mobileImageUrls = getMobileImageUrls(propertyId);
      const storageKey = `mainImages_${propertyId}`;
      localStorage.setItem(storageKey, JSON.stringify(mobileImageUrls));
      return;
    }
    
    // PC 이미지를 모바일 안전 URL로 변환
    const mobileSafeImages = pcImages.map(imageUrl => {
      // 이미 모바일 안전한 URL인지 확인
      if (imageUrl.includes('unsplash.com') || imageUrl.includes('picsum.photos') || imageUrl.includes('via.placeholder.com')) {
        return imageUrl;
      }
      
      // base64 이미지인 경우 그대로 사용
      if (imageUrl.startsWith('data:image/')) {
        return imageUrl;
      }
      
      // 외부 URL인 경우 모바일 안전 이미지로 대체
      return getSafeImageUrl(imageUrl, propertyId);
    });
    
    // localStorage에 저장
    const storageKey = `mainImages_${propertyId}`;
    localStorage.setItem(storageKey, JSON.stringify(mobileSafeImages));
    
    console.log(`PC 이미지 모바일 동기화 완료 - 매물 ${propertyId}:`, mobileSafeImages);
    
    // 저장 이벤트 발생
    window.dispatchEvent(new Event('storage'));
    
  } catch (error) {
    console.error(`PC 이미지 모바일 동기화 오류 - 매물 ${propertyId}:`, error);
    
    // 오류 발생 시 모바일 기본 이미지 사용
    const mobileImageUrls = getMobileImageUrls(propertyId);
    const storageKey = `mainImages_${propertyId}`;
    localStorage.setItem(storageKey, JSON.stringify(mobileImageUrls));
  }
};

// 모든 매물의 PC 이미지를 모바일로 동기화
export const syncAllPCImagesToMobile = (properties: any[]): void => {
  try {
    console.log('=== 모든 PC 이미지 모바일 동기화 시작 ===');
    console.log('동기화할 매물 수:', properties.length);
    
    properties.forEach((property, index) => {
      console.log(`매물 ${index + 1} 동기화 중:`, {
        id: property.id,
        title: property.title,
        images: property.images,
        imageCount: property.images?.length || 0
      });
      
      syncPCImagesToMobile(property.id, property.images || []);
    });
    
    console.log('=== 모든 PC 이미지 모바일 동기화 완료 ===');
    
  } catch (error) {
    console.error('모든 PC 이미지 모바일 동기화 오류:', error);
  }
};

// 모바일 이미지 동기화 상태 확인
export const checkImageSyncStatus = (): {
  totalProperties: number;
  syncedProperties: number;
  unsyncedProperties: string[];
  syncStatus: 'complete' | 'partial' | 'none';
} => {
  try {
    console.log('=== 이미지 동기화 상태 확인 시작 ===');
    
    // localStorage에서 mainImages 키들 확인
    const allKeys = Object.keys(localStorage);
    const mainImageKeys = allKeys.filter(key => key.startsWith('mainImages_'));
    
    console.log('localStorage mainImages 키 수:', mainImageKeys.length);
    console.log('발견된 키들:', mainImageKeys);
    
    const syncedProperties: string[] = [];
    const unsyncedProperties: string[] = [];
    
    // 각 키의 이미지 상태 확인
    mainImageKeys.forEach(key => {
      const propertyId = key.replace('mainImages_', '');
      const savedImages = localStorage.getItem(key);
      
      if (savedImages && savedImages !== 'null' && savedImages !== '[]') {
        try {
          const images = JSON.parse(savedImages);
          if (Array.isArray(images) && images.length > 0) {
            syncedProperties.push(propertyId);
            console.log(`✅ 매물 ${propertyId} 동기화됨:`, images.length, '개 이미지');
          } else {
            unsyncedProperties.push(propertyId);
            console.log(`❌ 매물 ${propertyId} 동기화 안됨: 빈 배열`);
          }
        } catch (error) {
          unsyncedProperties.push(propertyId);
          console.log(`❌ 매물 ${propertyId} 동기화 안됨: 파싱 오류`);
        }
      } else {
        unsyncedProperties.push(propertyId);
        console.log(`❌ 매물 ${propertyId} 동기화 안됨: 데이터 없음`);
      }
    });
    
    let syncStatus: 'complete' | 'partial' | 'none';
    if (syncedProperties.length === mainImageKeys.length && mainImageKeys.length > 0) {
      syncStatus = 'complete';
    } else if (syncedProperties.length > 0) {
      syncStatus = 'partial';
    } else {
      syncStatus = 'none';
    }
    
    const result = {
      totalProperties: mainImageKeys.length,
      syncedProperties: syncedProperties.length,
      unsyncedProperties,
      syncStatus
    };
    
    console.log('동기화 상태 결과:', result);
    console.log('=== 이미지 동기화 상태 확인 완료 ===');
    
    return result;
    
  } catch (error) {
    console.error('이미지 동기화 상태 확인 오류:', error);
    return {
      totalProperties: 0,
      syncedProperties: 0,
      unsyncedProperties: [],
      syncStatus: 'none'
    };
  }
};

