// 모바일 감지 유틸리티 함수
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// 모바일에서만 검색 기능을 사용하는지 확인
export const isSearchOnlyMode = (): boolean => {
  return isMobile();
};

// 모바일 환경에서 매물 등록 기능을 비활성화하는지 확인
export const shouldDisablePropertyRegistration = (): boolean => {
  return isMobile();
};

// 모바일 환경에서 관리자 기능을 비활성화하는지 확인
export const shouldDisableAdminFeatures = (): boolean => {
  return isMobile();
};




