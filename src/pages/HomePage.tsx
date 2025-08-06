import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import GoogleMap, { GoogleMapRef } from '../components/GoogleMap';
import PropertyDetailModal from '../components/PropertyDetailModal';
import { Property } from '../types';

// 모바일 우선 3개 섹션 구조
const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  min-height: 600px;
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: #f8fafc;
  overflow: hidden; /* visible에서 hidden으로 변경 */
  margin: 0;
  padding: 0;
  gap: 0;
  width: 100%; /* 100vw에서 100%로 변경 */
  box-sizing: border-box;
  /* 모바일 스크롤 방지 */
  touch-action: none;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    top: 60px;
    height: calc(50vh);
    margin: 0;
    padding: 0;
    gap: 0;
    overflow: hidden; /* visible에서 hidden으로 변경 */
    position: fixed;
    z-index: 1;
    width: 100%; /* 100vw에서 100%로 변경 */
    box-sizing: border-box;
    /* 모바일에서 지도 스크롤 방지 */
    touch-action: none;
    -webkit-overflow-scrolling: touch;
  }
`;

// 1. 지도 섹션
const MapSection = styled.div`
  flex: 0 0 55%;
  position: relative;
  background: white;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden; /* visible에서 hidden으로 변경 */
  z-index: 1;
  margin: 0;
  padding: 0;
  width: 100%; /* 100vw에서 100%로 변경 */
  box-sizing: border-box;
  /* 지도 스크롤 방지 */
  touch-action: pan-x pan-y pinch-zoom;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    flex: 0 0 100%;
    margin: 0;
    padding: 0;
    overflow: hidden; /* visible에서 hidden으로 변경 */
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%; /* 100vw에서 100%로 변경 */
    box-sizing: border-box;
    /* 모바일에서 지도 스크롤 방지 */
    touch-action: pan-x pan-y pinch-zoom;
    -webkit-overflow-scrolling: touch;
  }
  
  @media (max-width: 480px) {
    flex: 0 0 100%;
    width: 100%; /* 100vw에서 100%로 변경 */
    box-sizing: border-box;
    /* 모바일에서 지도 스크롤 방지 */
    touch-action: pan-x pan-y pinch-zoom;
    -webkit-overflow-scrolling: touch;
  }
`;

// 2. 매물 목록 섹션 (하단 55%에서 45%로 감소) - 데스크톱용
const PropertyListSection = styled.div`
  flex: 0 0 45%;
  background: white;
  border-top: none;
  border: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    display: none; /* 모바일에서는 별도 컨테이너 사용 */
  }
`;

// 매물 목록을 위한 별도 컨테이너
const PropertyListContainer = styled.div`
  position: fixed;
  top: calc(60px + 50vh + 0px); /* 헤더 높이 + 지도 높이 + 필터 섹션 높이를 5px에서 0px로 더 줄임 */
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1;
  overflow-y: auto;
  padding: 0.5rem;
  
  @media (min-width: 769px) {
    display: none; /* 데스크톱에서는 기존 레이아웃 사용 */
  }
`;

// 매물 카드 (모바일 최적화)
const PropertyCard = styled.div`
  display: flex;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const PropertyImage = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;
  margin-right: 0.5rem;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
`;

const PropertyInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  gap: 0.1rem;
`;

const PropertyNumber = styled.div`
  font-size: 0.65rem;
  color: #dc2626;
  font-weight: bold;
  margin-bottom: 0.1rem;
`;

const PropertyNumberLabel = styled.span`
  font-size: 0.65rem;
  color: #dc2626;
  font-weight: bold;
`;

const PropertyNumberValue = styled.span`
  font-size: 0.65rem;
  color: #dc2626;
  font-weight: bold;
  margin-left: 0.25rem;
`;

const PropertyAddress = styled.div`
  font-size: 0.75rem;
  color: #1f2937;
  margin-bottom: 0.1rem;
`;

const PropertyTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0 0 0.1rem 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PropertyDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.1rem;
  flex-wrap: wrap;
`;

const DetailTag = styled.span`
  font-size: 0.65rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
  white-space: nowrap;
`;

const PropertyPrice = styled.div`
  margin-top: 0.3rem;
`;

const PriceButton = styled.div`
  background: #f97316;
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  display: inline-block;
  text-align: center;
`;

// 관리자 버튼들
const AdminButtons = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const AdminButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  background: ${props => props.variant === 'delete' ? '#fef2f2' : '#f0f9ff'};
  color: ${props => props.variant === 'delete' ? '#dc2626' : '#0369a1'};

  &:hover {
    background: ${props => props.variant === 'delete' ? '#fee2e2' : '#e0f2fe'};
  }
`;

// 빈 상태
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  text-align: center;
  padding: 2rem;
`;

const EmptyIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

interface HomePageProps {
  searchTerm?: string;
  addressSearch?: string;
  filters?: {
    type: string;
    propertyType: string;
    area: string;
    price: string;
    deposit: string;
  };
  onPropertyAdded?: (properties: Property[]) => void;
  isAdmin?: boolean;
  newProperties?: Property[];
  onMapReset?: () => void; // 지도 리셋 함수 추가
}

export interface HomePageRef {
  resetMap: () => void;
}

const HomePage = forwardRef<HomePageRef, HomePageProps>(({ 
  searchTerm = '', 
  addressSearch = '',
  filters = { type: '', propertyType: '', area: '', price: '', deposit: '' },
  onPropertyAdded,
  isAdmin = false,
  newProperties = [],
  onMapReset
}, ref) => {
  console.log('HomePage 컴포넌트 렌더링됨');
  console.log('filters:', filters);
  
  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<Property | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [selectedClusterProperties, setSelectedClusterProperties] = useState<Property[]>([]);
  const mapRef = useRef<GoogleMapRef>(null);

  // 지도 리셋 함수를 부모 컴포넌트에 노출
  useImperativeHandle(ref, () => ({
    resetMap: () => {
      console.log('HomePage - resetMap 호출됨');
      console.log('mapRef.current:', mapRef.current);
      if (mapRef.current) {
        // 필터링 상태를 false로 설정하여 메시지 숨김
        
        // 선택된 클러스터 초기화
        setSelectedClusterProperties([]);
        
        // 지도 중심을 인천으로 설정
        const incheonCenter = { lat: 37.4000, lng: 126.7052 };
        mapRef.current.setCenter(incheonCenter);
        mapRef.current.setZoom(11);
        
        // 마커 재설정
        if (mapRef.current.resetMarkers) {
          mapRef.current.resetMarkers();
        }
        
        console.log('지도 리셋 완료 - 인천 중심으로 설정');
      } else {
        console.log('mapRef.current가 null입니다');
      }
    }
  }));

  // 개별 마커 클릭 핸들러 - 메모이제이션
  const handleMarkerClick = useCallback((property: Property) => {
    console.log('개별 마커 클릭됨:', property);
    // 매물목록 업데이트를 완전히 별도로 처리
    requestAnimationFrame(() => {
      setSelectedClusterProperties(prev => {
        // 이미 같은 매물이 선택되어 있다면 변경하지 않음
        if (prev.length === 1 && prev[0].id === property.id) {
          return prev;
        }
        return [property];
      });
    });
  }, []);

  // 클러스터 클릭 핸들러 - 메모이제이션
  const handleClusterClick = useCallback((properties: Property[]) => {
    console.log('클러스터 클릭됨, 매물들:', properties);
    // 매물목록 업데이트를 완전히 별도로 처리
    requestAnimationFrame(() => {
      setSelectedClusterProperties(prev => {
        // 이미 같은 매물들이 선택되어 있다면 변경하지 않음
        if (prev.length === properties.length && 
            prev.every((p, i) => p.id === properties[i].id)) {
          return prev;
        }
        return properties;
      });
    });
  }, []);

  // 필터 변경 시 실시간 반영 - 메모이제이션
  const handleFilterChange = useCallback(() => {
    console.log('HomePage useEffect - 필터 변경됨:', filters);
    
    // 필터링 처리 (메시지 없이 즉시 처리)
    console.log('getFilteredProperties():', getFilteredProperties());
    // 필터 변경 시 선택된 클러스터 초기화
    setSelectedClusterProperties([]);
    
    // 필터링된 매물이 있으면 지도 중심 조정
    const filteredProperties = getFilteredProperties();
    if (filteredProperties.length > 0 && mapRef.current) {
      // 필터링된 매물들의 중심점 계산
      const totalLat = filteredProperties.reduce((sum, property) => sum + (property.location?.lat || 0), 0);
      const totalLng = filteredProperties.reduce((sum, property) => sum + (property.location?.lng || 0), 0);
      const avgLat = totalLat / filteredProperties.length;
      const avgLng = totalLng / filteredProperties.length;
      
      console.log('필터링된 매물 중심점:', { lat: avgLat, lng: avgLng });
      
      // 지도 중심을 필터링된 매물들의 중심으로 이동
      mapRef.current.setCenter({ lat: avgLat, lng: avgLng });
      
      // 매물이 1개인 경우 줌 레벨을 높임
      if (filteredProperties.length === 1) {
        mapRef.current.setZoom(15);
      } else if (filteredProperties.length <= 3) {
        mapRef.current.setZoom(13);
      } else {
        mapRef.current.setZoom(11); // 기본 줌 레벨
      }
      
      // 지도 강제 새로고침 (마커 업데이트를 위해)
      setTimeout(() => {
        if (mapRef.current && mapRef.current.resetMarkers) {
          mapRef.current.resetMarkers();
        }
      }, 500);
    } else if (filteredProperties.length === 0 && mapRef.current) {
      // 필터링 결과가 없으면 마커만 숨김 (지도 중심은 변경하지 않음)
      console.log('필터링 결과 없음 - 마커만 숨김');
      
      // 마커들을 지도에서 제거 (resetMarkers 호출하지 않음)
      // 지도 중심은 그대로 유지
    }
  }, [filters, mapRef]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  // SimpleMap 렌더링 추적
  useEffect(() => {
    console.log('HomePage 렌더링 완료');
    console.log('MapSection이 렌더링됨');
    console.log('GoogleMap 컴포넌트가 렌더링됨');
  }, []);

  // 기본 매물 데이터 (사진 기반으로 수정)
  const defaultProperties: Property[] = [
    {
      id: '1',
      title: '강남구 신축 상가',
      description: '강남구 역삼동 신축 상가입니다.',
      address: '서울시 강남구 역삼동',
      type: 'sale',
      propertyType: 'building',
      price: 80000,
      deposit: 0,
      area: 8.0, // 모달 백데이터에 맞춰 수정 (8평)
      floor: '3층',
      parking: true,
      elevator: true,
      contact: {
        name: '부동산114',
        phone: '02-1234-5678',
        email: 'info@realestate114.com'
      },
      images: ['https://via.placeholder.com/300x200/3b82f6/ffffff?text=Commercial+1'],
      location: { lat: 37.5013, lng: 127.0396 }, // 역삼동
      features: ['신축', '역세권', '주차가능'],
      createdAt: new Date(),
      isActive: true
    },
    {
      id: '2',
      title: '강남구 테헤란로 건물',
      description: '강남구 테헤란로 건물입니다.',
      address: '서울시 강남구 테헤란로',
      type: 'sale',
      propertyType: 'building',
      price: 120000,
      deposit: 0,
      area: 14.0,
      floor: '8층',
      parking: true,
      elevator: true,
      contact: {
        name: '강남부동산',
        phone: '02-3456-7890',
        email: 'info@gangnam.com'
      },
      images: ['https://via.placeholder.com/300x200/f59e0b/ffffff?text=Building+1'],
      location: { lat: 37.4919, lng: 127.0079 }, // 테헤란로
      features: ['건물', '테헤란로'],
      createdAt: new Date(),
      isActive: true
    },
    {
      id: '3',
      title: '강남구 삼성동 기타',
      description: '강남구 삼성동 기타 매물입니다.',
      address: '서울시 강남구 삼성동',
      type: 'sale',
      propertyType: 'other',
      price: 60000,
      deposit: 0,
      area: 29.0,
      floor: '2층',
      parking: true,
      elevator: false,
      contact: {
        name: '강남부동산',
        phone: '02-5678-9012',
        email: 'info@gangnam.com'
      },
      images: ['https://via.placeholder.com/300x200/06b6d4/ffffff?text=Other+1'],
      location: { lat: 37.5139, lng: 127.1006 }, // 삼성동
      features: ['기타', '삼성동'],
      createdAt: new Date(),
      isActive: true
    },
    {
      id: '4',
      title: '마포구 홍대입구 근처 사무실',
      description: '마포구 서교동 사무실입니다.',
      address: '서울시 마포구 서교동',
      type: 'rent',
      propertyType: 'office',
      price: 50,
      deposit: 1000,
      area: 2.0, // 실제 면적으로 수정 (2평)
      floor: '2층',
      parking: false,
      elevator: true,
      contact: {
        name: '마포부동산',
        phone: '02-2345-6789',
        email: 'info@mapo.com'
      },
      images: ['https://via.placeholder.com/300x200/10b981/ffffff?text=Office+1'],
      location: { lat: 37.5495, lng: 126.9136 }, // 홍대입구
      features: ['사무실', '홍대입구'],
      createdAt: new Date(),
      isActive: true
    },
    {
      id: '5',
      title: '마포구 합정동 상가',
      description: '마포구 합정동 상가입니다.',
      address: '서울시 마포구 합정동',
      type: 'sale',
      propertyType: 'building',
      price: 30000,
      deposit: 0,
      area: 36.0,
      floor: '1층',
      parking: true,
      elevator: true,
      contact: {
        name: '마포부동산',
        phone: '02-4567-8901',
        email: 'info@mapo.com'
      },
      images: ['https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Commercial+2'],
      location: { lat: 37.5445, lng: 126.9136 }, // 합정동 (홍대입구 근처)
      features: ['상가', '합정동'],
      createdAt: new Date(),
      isActive: true
    },
    {
      id: '6',
      title: '서초구 강남대로 사무실',
      description: '서초구 강남대로 사무실입니다.',
      address: '서울시 서초구 강남대로',
      type: 'rent',
      propertyType: 'office',
      price: 80,
      deposit: 2000,
      area: 12.0,
      floor: '5층',
      parking: true,
      elevator: true,
      contact: {
        name: '서초부동산',
        phone: '02-6789-0123',
        email: 'info@seocho.com'
      },
      images: ['https://via.placeholder.com/300x200/ef4444/ffffff?text=Office+2'],
      location: { lat: 37.4980, lng: 127.0276 }, // 강남대로
      features: ['사무실', '강남대로'],
      createdAt: new Date(),
      isActive: true
    },
    {
      id: '7',
      title: '서초구 반포동 상가',
      description: '서초구 반포동 상가입니다.',
      address: '서울시 서초구 반포동',
      type: 'sale',
      propertyType: 'building',
      price: 150000,
      deposit: 0,
      area: 45.0,
      floor: '1층',
      parking: true,
      elevator: true,
      contact: {
        name: '서초부동산',
        phone: '02-7890-1234',
        email: 'info@seocho.com'
      },
      images: ['https://via.placeholder.com/300x200/84cc16/ffffff?text=Commercial+3'],
      location: { lat: 37.5080, lng: 127.0180 }, // 반포동
      features: ['상가', '반포동'],
      createdAt: new Date(),
      isActive: true
    },
    {
      id: '8',
      title: '종로구 광화문 건물',
      description: '종로구 광화문 건물입니다.',
      address: '서울시 종로구 광화문',
      type: 'sale',
      propertyType: 'building',
      price: 200000,
      deposit: 0,
      area: 18.0,
      floor: '10층',
      parking: true,
      elevator: true,
      contact: {
        name: '종로부동산',
        phone: '02-8901-2345',
        email: 'info@jongno.com'
      },
      images: ['https://via.placeholder.com/300x200/a855f7/ffffff?text=Building+2'],
      location: { lat: 37.5716, lng: 126.9764 }, // 광화문
      features: ['건물', '광화문'],
      createdAt: new Date(),
      isActive: true
    }
  ];

  // 모든 매물 (기본 + 새로 추가된 매물)
  const allProperties = [...defaultProperties, ...newProperties];

  // 디버깅을 위한 로그
  console.log('defaultProperties 개수:', defaultProperties.length);
  console.log('newProperties 개수:', newProperties.length);
  console.log('allProperties 개수:', allProperties.length);
  console.log('allProperties:', allProperties.map(p => ({ id: p.id, title: p.title })));

  const handlePropertyCardClick = (property: Property) => {
    setSelectedPropertyForDetail(property);
  };

  const handleCloseDetailModal = () => {
    setSelectedPropertyForDetail(null);
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    // 매물 업데이트 로직
    console.log('매물 업데이트:', updatedProperty);
    setSelectedPropertyForDetail(null);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${Math.floor(price / 10000)}억${price % 10000 > 0 ? ` ${price % 10000}만` : ''}`;
    }
    return `${price}만`;
  };

  const cleanPropertyTitle = (title: string) => {
    return title.replace(/[^\w\s가-힣]/g, '').trim();
  };

  const maskAddress = (address: string) => {
    const parts = address.split(' ');
    if (parts.length >= 3) {
      return `${parts[0]} ${parts[1]} ${parts[2]}`;
    }
    return address;
  };

  const getFilteredProperties = () => {
    let filtered = allProperties;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 주소 검색 필터
    if (addressSearch) {
      filtered = filtered.filter(property =>
        property.address.toLowerCase().includes(addressSearch.toLowerCase())
      );
    }

    // 거래유형 필터 (매매/임대)
    if (filters.type) {
      filtered = filtered.filter(property => property.type === filters.type);
    }

    // 매물종류 필터 (상가/사무실/건물/기타)
    if (filters.propertyType) {
      filtered = filtered.filter(property => property.propertyType === filters.propertyType);
    }

    // 면적 필터 (Header에서 전달받는 형식: "10평,20평" 또는 "10평~20평")
    if (filters.area) {
      console.log('=== 면적 필터 디버깅 시작 ===');
      console.log('면적 필터 적용:', filters.area);
      const areaValues = filters.area.split(',');
      console.log('면적 값들:', areaValues);
      if (areaValues.length === 1) {
        // 단일 값 선택
        const areaValue = areaValues[0];
        console.log('면적 단일 값:', areaValue);
        if (areaValue.includes('~')) {
          // 범위 값 (예: "10평~20평")
          const parts = areaValue.split('~');
          console.log('면적 범위 파트:', parts);
          if (parts.length === 2) {
            const min = parseFloat(parts[0].replace(/[~평]/g, ''));
            const max = parseFloat(parts[1].replace(/[~평]/g, ''));
            console.log('면적 범위 파싱 결과:', min, '~', max);
            console.log('면적 범위 타입:', typeof min, typeof max);
            console.log('면적 범위 유효성:', !isNaN(min), !isNaN(max));
            
            filtered = filtered.filter(property => {
              // property.area는 이미 숫자이므로 직접 사용 (평 단위)
              const area = property.area;
              const isInRange = area >= min && area <= max;
              console.log(`매물 ${property.id} 면적: ${area}평(${Math.round(area * 3.3058)}m²), 범위: ${min}~${max}평, 포함여부: ${isInRange}`);
              return isInRange;
            });
          }
        } else {
          // 단일 값 (예: "10평")
          const area = parseFloat(areaValue.replace(/[~평]/g, ''));
          console.log('면적 단일 값 파싱:', area);
          filtered = filtered.filter(property => {
            // property.area는 이미 숫자이므로 직접 사용 (평 단위)
            const propertyArea = property.area;
            const isMatch = propertyArea === area;
            console.log(`매물 ${property.id} 면적: ${propertyArea}평(${Math.round(propertyArea * 3.3058)}m²), 필터: ${area}평, 일치여부: ${isMatch}`);
            return isMatch;
          });
        }
      } else if (areaValues.length === 2) {
        // 두 값 선택 (범위)
        const [min, max] = areaValues.map(a => parseFloat(a.replace(/[~평]/g, '')));
        console.log('면적 두 값 범위:', min, '~', max);
        console.log('면적 두 값 타입:', typeof min, typeof max);
        console.log('면적 두 값 유효성:', !isNaN(min), !isNaN(max));
        
        filtered = filtered.filter(property => {
          // property.area는 이미 숫자이므로 직접 사용 (평 단위)
          const area = property.area;
          const isInRange = area >= min && area <= max;
          console.log(`매물 ${property.id} 면적: ${area}평(${Math.round(area * 3.3058)}m²), 범위: ${min}~${max}평, 포함여부: ${isInRange}`);
          return isInRange;
        });
      }
      console.log('면적 필터 적용 후 매물 수:', filtered.length);
      console.log('=== 면적 필터 디버깅 완료 ===');
    }

    // 매매가 필터 (Header에서 전달받는 형식: "8억,10억" 또는 "8억~10억")
    if (filters.price) {
      console.log('=== 매매가 필터 디버깅 시작 ===');
      console.log('매매가 필터 적용:', filters.price);
      const priceValues = filters.price.split(',');
      console.log('매매가 값들:', priceValues);
      if (priceValues.length === 1) {
        // 단일 값 선택
        const priceValue = priceValues[0];
        console.log('매매가 단일 값:', priceValue);
        if (priceValue.includes('~')) {
          // 범위 값 (예: "8억~10억")
          const parts = priceValue.split('~');
          console.log('매매가 범위 파트:', parts);
          if (parts.length === 2) {
            const min = parseFloat(parts[0].replace(/[~억]/g, '')) * 100000000;
            const max = parseFloat(parts[1].replace(/[~억]/g, '')) * 100000000;
            console.log('매매가 범위 파싱 결과:', min, '~', max);
            console.log('매매가 범위 타입:', typeof min, typeof max);
            console.log('매매가 범위 유효성:', !isNaN(min), !isNaN(max));
            
            filtered = filtered.filter(property => {
              const price = property.price * 10000; // 만원 단위를 원 단위로 변환
              const isInRange = price >= min && price <= max;
              console.log(`매물 ${property.id} 매매가: ${property.price}만원 (${price}원), 범위: ${min}~${max}원, 포함여부: ${isInRange}`);
              return isInRange;
            });
          }
        } else {
          // 단일 값 (예: "8억")
          const price = parseFloat(priceValue.replace(/[~억]/g, '')) * 100000000;
          console.log('매매가 단일 값 파싱:', price);
          filtered = filtered.filter(property => property.price * 10000 === price);
        }
      } else if (priceValues.length === 2) {
        // 두 값 선택 (범위)
        const [min, max] = priceValues.map(p => parseFloat(p.replace(/[~억]/g, '')) * 100000000);
        console.log('매매가 두 값 범위:', min, '~', max);
        console.log('매매가 두 값 타입:', typeof min, typeof max);
        console.log('매매가 두 값 유효성:', !isNaN(min), !isNaN(max));
        
        filtered = filtered.filter(property => {
          const price = property.price * 10000; // 만원 단위를 원 단위로 변환
          const isInRange = price >= min && price <= max;
          console.log(`매물 ${property.id} 매매가: ${property.price}만원 (${price}원), 범위: ${min}~${max}원, 포함여부: ${isInRange}`);
          return isInRange;
        });
      }
      console.log('매매가 필터 적용 후 매물 수:', filtered.length);
      console.log('=== 매매가 필터 디버깅 완료 ===');
    }

    // 보증금 필터 (Header에서 전달받는 형식: "1000만,2000만" 또는 "1000만~2000만")
    if (filters.deposit) {
      const depositValues = filters.deposit.split(',');
      if (depositValues.length === 1) {
        // 단일 값 선택
        const depositValue = depositValues[0];
        if (depositValue.includes('~')) {
          // 범위 값 (예: "1000만~2000만")
          const [min, max] = depositValue.split('~').map(d => {
            if (d.includes('천만')) {
              return parseFloat(d.replace(/[~천만]/g, '')) * 10000000;
            } else {
              return parseFloat(d.replace(/[~만]/g, '')) * 10000;
            }
          });
          filtered = filtered.filter(property => {
            const deposit = property.deposit || 0;
            return deposit >= min && deposit <= max;
          });
        } else {
          // 단일 값 (예: "1000만")
          let deposit = 0;
          if (depositValue.includes('천만')) {
            deposit = parseFloat(depositValue.replace(/[~천만]/g, '')) * 10000000;
          } else {
            deposit = parseFloat(depositValue.replace(/[~만]/g, '')) * 10000;
          }
          filtered = filtered.filter(property => (property.deposit || 0) === deposit);
        }
      } else if (depositValues.length === 2) {
        // 두 값 선택 (범위)
        const [min, max] = depositValues.map(d => {
          if (d.includes('천만')) {
            return parseFloat(d.replace(/[~천만]/g, '')) * 10000000;
          } else {
            return parseFloat(d.replace(/[~만]/g, '')) * 10000;
          }
        });
        filtered = filtered.filter(property => {
          const deposit = property.deposit || 0;
          return deposit >= min && deposit <= max;
        });
      }
    }

    // 선택된 클러스터 매물이 있으면 해당 매물들만 반환, 없으면 필터링된 전체 매물 반환
    // 모든 마커가 계속 표시되도록 수정
    return filtered;
  };

  const handleEditProperty = (property: Property) => {
    console.log('매물 수정:', property.id);
  };

  const handleDeleteProperty = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (propertyToDelete) {
      console.log('매물 삭제:', propertyToDelete.id);
      setShowDeleteConfirm(false);
      setPropertyToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPropertyToDelete(null);
  };

  const displayProperties = getFilteredProperties();
  const listProperties = selectedClusterProperties.length > 0 ? selectedClusterProperties : displayProperties;

  console.log('displayProperties:', displayProperties.length, '개 매물');
  console.log('listProperties:', listProperties.length, '개 매물 (목록 표시용)');

  // GoogleMap에 전달할 props 메모이제이션 - 매물목록 상태와 완전히 분리
  const mapProps = useMemo(() => ({
    properties: displayProperties,
    onMarkerClick: handleMarkerClick,
    onClusterClick: handleClusterClick
  }), [displayProperties]); // handleMarkerClick, handleClusterClick 의존성 제거

  return (
    <>
      <HomeContainer>
        <MapSection>
          <GoogleMap
            {...mapProps}
            ref={mapRef}
          />
        </MapSection>
        
        <PropertyListSection>
          <PropertyListContainer>
            {listProperties.length === 0 ? (
              <EmptyState>
                <EmptyIcon>🏠</EmptyIcon>
                <p>현재 매물이 없습니다.</p>
                {isAdmin && (
                  <AdminButton onClick={() => setSelectedPropertyForDetail({} as Property)}>
                    새 매물 추가
                  </AdminButton>
                )}
              </EmptyState>
            ) : (
              listProperties.map(property => {
                // localStorage에서 저장된 이미지 확인
                const savedMainImages = localStorage.getItem(`mainImages_${property.id}`);
                let displayImages = property.images;
                
                if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
                  try {
                    const parsedImages = JSON.parse(savedMainImages);
                    if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                      displayImages = parsedImages;
                    }
                  } catch (error) {
                    console.error('이미지 파싱 오류:', error);
                  }
                }
                
                return (
                  <PropertyCard 
                    key={property.id}
                    onClick={() => handlePropertyCardClick(property)}
                  >
                    <PropertyImage>
                      {displayImages && displayImages.length > 0 ? (
                        <img 
                          src={displayImages[0]} 
                          alt={property.title}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        '🏠'
                      )}
                    </PropertyImage>
                    <PropertyInfo>
                      <PropertyNumber>
                        <PropertyNumberLabel>매물번호</PropertyNumberLabel>
                        <PropertyNumberValue>{property.id}</PropertyNumberValue>
                      </PropertyNumber>
                      <PropertyAddress>
                        {maskAddress(property.address)}
                      </PropertyAddress>
                      <PropertyTitle>
                        {cleanPropertyTitle(property.title)}
                      </PropertyTitle>
                      <PropertyDetails>
                        <DetailTag>
                          {property.type === 'sale' ? '매매' : '임대'}
                        </DetailTag>
                        <DetailTag>전용 {property.area}평({Math.round(property.area * 3.3058)}m²)</DetailTag>
                        {property.floor && <DetailTag>{property.floor}</DetailTag>}
                        {property.parking !== undefined && (
                          <DetailTag>주차 {property.parking ? '가능' : '불가능'}</DetailTag>
                        )}
                        {property.elevator !== undefined && (
                          <DetailTag>엘리베이터 {property.elevator ? '유' : '무'}</DetailTag>
                        )}
                      </PropertyDetails>
                      <PropertyPrice>
                        <PriceButton>
                          {property.type === 'rent' ? (
                            <>
                              {property.deposit && property.deposit > 0 && (
                                <>보증금 {formatPrice(property.deposit)}</>
                              )}
                              {property.deposit && property.deposit > 0 && property.price > 0 && (
                                <> / </>
                              )}
                              {property.price > 0 && (
                                <>임대료 {formatPrice(property.price)}</>
                              )}
                              {(!property.deposit || property.deposit === 0) && (!property.price || property.price === 0) && (
                                <>가격 정보 없음</>
                              )}
                            </>
                          ) : (
                            <>매매 {formatPrice(property.price)}</>
                          )}
                        </PriceButton>
                      </PropertyPrice>
                    </PropertyInfo>
                    {isAdmin && (
                      <AdminButtons>
                        <AdminButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProperty(property);
                          }}
                        >
                          수정
                        </AdminButton>
                        <AdminButton 
                          variant="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProperty(property);
                          }}
                        >
                          삭제
                        </AdminButton>
                      </AdminButtons>
                    )}
                  </PropertyCard>
                );
              })
            )}
          </PropertyListContainer>
        </PropertyListSection>
      </HomeContainer>

      {/* 모바일용 별도 매물 목록 컨테이너 */}
      <PropertyListContainer>
        {listProperties.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🏠</EmptyIcon>
            <p>현재 매물이 없습니다.</p>
            {isAdmin && (
              <AdminButton onClick={() => setSelectedPropertyForDetail({} as Property)}>
                새 매물 추가
              </AdminButton>
            )}
          </EmptyState>
        ) : (
          listProperties.map(property => {
            // localStorage에서 저장된 이미지 확인
            const savedMainImages = localStorage.getItem(`mainImages_${property.id}`);
            let displayImages = property.images;
            
            if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
              try {
                const parsedImages = JSON.parse(savedMainImages);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  displayImages = parsedImages;
                }
              } catch (error) {
                console.error('이미지 파싱 오류:', error);
              }
            }
            
            return (
              <PropertyCard 
                key={property.id}
                onClick={() => handlePropertyCardClick(property)}
              >
                <PropertyImage>
                  {displayImages && displayImages.length > 0 ? (
                    <img 
                      src={displayImages[0]} 
                      alt={property.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    '🏠'
                  )}
                </PropertyImage>
                <PropertyInfo>
                  <PropertyNumber>
                    <PropertyNumberLabel>매물번호</PropertyNumberLabel>
                    <PropertyNumberValue>{property.id}</PropertyNumberValue>
                  </PropertyNumber>
                  <PropertyAddress>
                    {maskAddress(property.address)}
                  </PropertyAddress>
                  <PropertyTitle>
                    {cleanPropertyTitle(property.title)}
                  </PropertyTitle>
                  <PropertyDetails>
                    <DetailTag>
                      {property.type === 'sale' ? '매매' : '임대'}
                    </DetailTag>
                    <DetailTag>전용 {property.area}평({Math.round(property.area * 3.3058)}m²)</DetailTag>
                    {property.floor && <DetailTag>{property.floor}</DetailTag>}
                    {property.parking !== undefined && (
                      <DetailTag>주차 {property.parking ? '가능' : '불가능'}</DetailTag>
                    )}
                    {property.elevator !== undefined && (
                      <DetailTag>엘리베이터 {property.elevator ? '유' : '무'}</DetailTag>
                    )}
                  </PropertyDetails>
                  <PropertyPrice>
                    <PriceButton>
                      {property.type === 'rent' ? (
                        <>
                          {property.deposit && property.deposit > 0 && (
                            <>보증금 {formatPrice(property.deposit)}</>
                          )}
                          {property.deposit && property.deposit > 0 && property.price > 0 && (
                            <> / </>
                          )}
                          {property.price > 0 && (
                            <>임대료 {formatPrice(property.price)}</>
                          )}
                          {(!property.deposit || property.deposit === 0) && (!property.price || property.price === 0) && (
                            <>가격 정보 없음</>
                          )}
                        </>
                      ) : (
                        <>매매 {formatPrice(property.price)}</>
                      )}
                    </PriceButton>
                  </PropertyPrice>
                </PropertyInfo>
                {isAdmin && (
                  <AdminButtons>
                    <AdminButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProperty(property);
                      }}
                    >
                      수정
                    </AdminButton>
                    <AdminButton 
                      variant="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProperty(property);
                      }}
                    >
                      삭제
                    </AdminButton>
                  </AdminButtons>
                )}
              </PropertyCard>
            );
          })
        )}
      </PropertyListContainer>
      
      {selectedPropertyForDetail && (
        <PropertyDetailModal
          property={selectedPropertyForDetail}
          onClose={handleCloseDetailModal}
          onPropertyUpdate={handlePropertyUpdate}
          isAdmin={isAdmin}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#dc2626' }}>매물 삭제</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              정말로 이 매물을 삭제하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default HomePage; 