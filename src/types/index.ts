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
  area: number; // 평방미터
  images: string[];
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  features: string[];
  createdAt: Date;
  isActive: boolean;
  confirmedDate?: string; // 확인매물 날짜 (예: "25.07.19")
  // 추가된 필드들
  floor?: string; // 층수 (예: "2/5층")
  parking?: boolean; // 주차 가능 여부
  elevator?: boolean; // 엘리베이터 유무
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