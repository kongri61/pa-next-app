export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  deposit?: number; // 보증금 (원)
  rentPrice?: number; // 임대료 (원)
  type: 'sale' | 'rent';
  propertyType: 'commercial' | 'office' | 'building' | 'other';
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  area: number; // 평방미터 (기본 면적, 전용면적로 사용 가능)
  supplyArea?: number; // 공급면적 (평방미터)
  dedicatedArea?: number; // 전용면적 (평방미터)
  images: string[];
  contact: {
    name: string;
    phone: string;
    phone2?: string; // 두 번째 전화번호
    email: string;
    photo?: string; // 프로필 사진 URL
  };
  features: string[];
  createdAt: Date;
  isActive: boolean;
  confirmedDate?: string; // 확인매물 날짜 (예: "25.07.19")
  // 추가된 필드들
  floor?: string; // 층수 (예: "2/5층")
  parking?: boolean; // 주차 가능 여부
  elevator?: boolean; // 엘리베이터 유무
  // 매매용 필드들
  loanAmount?: number; // 융자금 (억 단위)
  keyDeposit?: number; // 기보증금 (만원 단위)
  keyDepositMonthly?: number; // 기보증금/월세 (만원 단위)
  // 임대용 필드들
  keyMoney?: number; // 권리금 (만원 단위)
  // 공통 추가 필드들
  maintenanceFee?: number; // 관리비
  maintenanceIncluded?: string; // 관리비포함항목
  propertyStatus?: string; // 매물현황
  mainStructure?: string; // 주요구조부
  direction?: string; // 방향
  coolingHeating?: string; // 냉/난방
  interior?: string; // 인테리어
  parkingCount?: number; // 주차대수
  moveInDate?: string; // 입주가능일
  approvalDate?: string; // 사용승인일
  recommendedBusiness?: string; // 추천업종
  mapImage?: string; // 위치정보 지도 이미지 URL
  // Firebase 관련 필드들
  createdBy?: string; // 생성한 사용자 ID
  updatedBy?: string; // 수정한 사용자 ID
  updatedAt?: Date; // 수정 날짜
}

export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  property: Property;
}

export interface SearchFilters {
  type?: 'sale' | 'rent';
  propertyType?: 'commercial' | 'office' | 'building' | 'other';
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  location?: string;
} 