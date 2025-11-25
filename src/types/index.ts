export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  deposit?: number; // 보증금 (원)
  rentPrice?: number; // 임대료 (원)
  type: 'sale' | 'rent';
  propertyType: 'land' | 'building' | 'commercial' | 'office' | 'apartment' | 'officetel' | 'villa' | 'house' | 'other';
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  roomBathInfo?: string; // 방/화장실 텍스트 정보 (예: "외부 남녀구분")
  area: number; // 전용면적 (평방미터)
  supplyArea?: number; // 공급면적 (평방미터)
  images: string[];
  contact: {
    name: string;
    phone: string;
    email: string;
    photo?: string; // 연락처 사진 URL
  };
  features: string[];
  createdAt: Date;
  isActive: boolean;
  confirmedDate?: string; // 확인매물 날짜 (예: "25.07.19")
  // 추가된 필드들
  floor?: string; // 층수 (예: "2/5층")
  parking?: boolean; // 주차 가능 여부
  elevator?: boolean; // 엘리베이터 유무
  // 상세 정보 필드들
  maintenanceFee?: number; // 관리비 (만원)
  premium?: number; // 권리금 (만원)
  buildingUse?: string; // 건축물용도
  coolingHeating?: string; // 냉/난방
  approvalDate?: string; // 사용승인일
  maintenanceFeeItems?: string; // 관리비포함항목
  mainStructure?: string; // 주요구조부
  currentBusinessType?: string; // 현업종
  direction?: string; // 방향
  interior?: string; // 인테리어
  parkingSpaces?: number | string; // 주차대수 (숫자 또는 문자열, 예: "4(옥외)/22(옥내)")
  moveInDate?: string; // 입주가능일
  recommendedBusinessType?: string; // 추천업종
  propertyStatus?: string; // 매물현황 (예: "매매중", "임대중")
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
  propertyType?: 'land' | 'building' | 'commercial' | 'office' | 'apartment' | 'officetel' | 'villa' | 'house' | 'other';
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  location?: string;
} 