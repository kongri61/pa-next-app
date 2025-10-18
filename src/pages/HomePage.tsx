import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import GoogleMap, { GoogleMapRef } from '../components/GoogleMap';
import PropertyDetailModal from '../components/PropertyDetailModal';
import { Property } from '../types';
import { useProperties } from '../hooks/useProperties';
import { isMobile, isSearchOnlyMode, shouldDisablePropertyRegistration, shouldDisableAdminFeatures } from '../utils/mobileDetection';
import { getMobileImageUrls, manageMobileImageCache, syncAllPCImagesToMobile, checkImageSyncStatus } from '../utils/mobileImageUtils';

// 모바일 검색 전용 모드 알림
const MobileSearchOnlyNotice = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  margin: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const NoticeIcon = styled.span`
  font-size: 1.2rem;
  margin-right: 0.5rem;
`;

const NoticeText = styled.span`
  display: inline-block;
  vertical-align: middle;
`;

// PC용 2개 섹션 구조 (데스크톱 우선)
const HomeContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100vh - 60px);
  min-height: 600px;
  position: relative;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: #f8fafc;
  overflow: hidden;
  margin: 0;
  padding: 0;
  gap: 0;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    flex-direction: column;
    top: 60px;
    height: calc(50vh);
    margin: 0;
    padding: 0;
    gap: 0;
    overflow: hidden;
    position: fixed;
    z-index: 1;
    width: 100%;
    box-sizing: border-box;
    touch-action: none;
    -webkit-overflow-scrolling: touch;
  }
`;

// 1. 지도 섹션 (PC용)
const MapSection = styled.div`
  flex: 0 0 60%;
  position: relative;
  background: white;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  z-index: 1;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  touch-action: pan-x pan-y pinch-zoom;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    flex: 0 0 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    touch-action: pan-x pan-y pinch-zoom;
    -webkit-overflow-scrolling: touch;
  }
  
  @media (max-width: 480px) {
    flex: 0 0 100%;
    width: 100%;
    box-sizing: border-box;
    touch-action: pan-x pan-y pinch-zoom;
    -webkit-overflow-scrolling: touch;
  }
`;

// 2. 매물 목록 섹션 (PC/모바일 통합)
const PropertyListSection = styled.div`
  flex: 0 0 40%;
  background: white;
  border-left: 1px solid #e5e7eb;
  margin: 0;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    position: fixed;
    top: calc(60px + 50vh + 0px); /* 헤더 높이 + 지도 높이 */
    left: 0;
    right: 0;
    bottom: 0;
    flex: none;
    border-left: none;
    border-top: 1px solid #e5e7eb;
    padding: 0.5rem;
    z-index: 1;
  }
`;

// 매물 목록을 위한 별도 컨테이너 (제거됨 - 통합된 PropertyListSection 사용)

// 매물 카드 (PC/모바일 최적화)
const PropertyCard = styled.div`
  display: flex;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 120px; /* 기본 높이 최소화 */

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 0.75rem 0.5rem 0.75rem; /* 하단 패딩 최소화 */
    min-height: 130px; /* 모바일에서 높이 최소화 */
    margin-bottom: 0.5rem; /* 하단 마진 최소화 */
  }

  @media (min-width: 768px) {
    padding: 1.25rem;
    min-height: 160px;
    margin-bottom: 1rem;
  }
`;

const PropertyImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;
  margin-right: 0.75rem;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }

  .fallback-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    color: white;
    z-index: 1;
  }

  @media (min-width: 768px) {
    width: 120px;
    height: 120px;
    margin-right: 1rem;
    font-size: 1rem;
    
    .fallback-icon {
      font-size: 3rem;
    }
  }

  @media (max-width: 480px) {
    width: 70px;
    height: 70px;
    margin-right: 0.5rem;
    font-size: 0.7rem;
    
    .fallback-icon {
      font-size: 1.5rem;
    }
  }
`;

const PropertyInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  gap: 0.2rem;

  @media (min-width: 768px) {
    gap: 0.3rem;
  }
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

  @media (min-width: 768px) {
    font-size: 1rem;
    margin-bottom: 0.2rem;
  }
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
  margin-top: 0.2rem; /* 상단 마진 최소화 */
  display: flex;
  gap: 0.4rem; /* 간격 최소화 */
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    margin-top: 0.3rem; /* 상단 마진 최소화 */
    margin-bottom: 0.2rem; /* 하단 마진 최소화 */
    gap: 0.25rem; /* 간격 최소화 */
    flex-wrap: wrap; /* 줄바꿈 허용 */
    overflow-x: visible; /* 가로 스크롤 제거 */
  }
`;

const PriceButton = styled.div<{ isSale?: boolean }>`
  background: ${props => props.isSale ? '#f97316' : '#10b981'}; /* 매매는 오렌지, 임대는 초록 */
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  flex-shrink: 0; /* 모바일에서 축소 방지 */

  &:hover {
    background: ${props => props.isSale ? '#ea580c' : '#059669'}; /* 호버 시 더 진한 색상 */
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 768px) {
    padding: 0.25rem 0.4rem; /* 패딩 최소화 */
    font-size: 0.7rem; /* 폰트 크기 조정 */
    border-radius: 6px; /* 모서리 둥글게 */
    min-width: fit-content; /* 최소 너비 설정 */
    margin-bottom: 0.1rem; /* 하단 마진 최소화 */
  }
`;

// 관리자 버튼들
// const AdminButtons = styled.div`
//   display: flex;
//   gap: 0.25rem;
//   margin-top: 0.5rem;
// `;

// const AdminButton = styled.button<{ variant?: 'edit' | 'delete' }>`
//   padding: 0.2rem 0.4rem;
//   font-size: 0.7rem;
//   border: none;
//   border-radius: 4px;
//   cursor: pointer;
//   transition: background 0.2s;
//   background: ${props => props.variant === 'delete' ? '#fef2f2' : '#f0f9ff'};
//   color: ${props => props.variant === 'delete' ? '#dc2626' : '#0369a1'};

//   &:hover {
//     background: ${props => props.variant === 'delete' ? '#fee2e2' : '#e0f2fe'};
//   }
// `;

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
  propertyNumberSearch?: string; // 매물번호 검색 추가
  filters?: {
    type: string;
    propertyType: string;
    area: string;
    price: string;
    deposit: string;
  };
  onPropertyAdded?: (properties: Property[]) => void;
  newProperties?: Property[];
  onMapReset?: () => void; // 지도 리셋 함수 추가
}

export interface HomePageRef {
  resetMap: () => void;
}

const HomePage = forwardRef<HomePageRef, HomePageProps>(({ 
  searchTerm = '', 
  addressSearch = '',
  propertyNumberSearch = '',
  filters = { type: '', propertyType: '', area: '', price: '', deposit: '' },
  onPropertyAdded,
  newProperties = [],
  onMapReset
}, ref) => {
  console.log('HomePage 컴포넌트 렌더링됨');
  console.log('filters:', filters);
  
  // 모바일 감지 및 검색 전용 모드 확인
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isSearchOnly, setIsSearchOnly] = useState(false);
  
  useEffect(() => {
    const checkMobileStatus = () => {
      const mobile = isMobile();
      const searchOnly = isSearchOnlyMode();
      setIsMobileDevice(mobile);
      setIsSearchOnly(searchOnly);
      
      console.log('모바일 상태 확인:', {
        isMobile: mobile,
        isSearchOnly: searchOnly,
        windowWidth: window.innerWidth,
        userAgent: navigator.userAgent
      });
    };
    
    checkMobileStatus();
    window.addEventListener('resize', checkMobileStatus);
    
    return () => {
      window.removeEventListener('resize', checkMobileStatus);
    };
  }, []);
  
  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<Property | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [selectedClusterProperties, setSelectedClusterProperties] = useState<Property[]>([]);
  const mapRef = useRef<GoogleMapRef>(null);

  // Firebase에서 매물 데이터 가져오기
  const { properties: firebaseProperties, loading, error, loadProperties, refreshProperties } = useProperties();

  // 지도 리셋 함수를 부모 컴포넌트에 노출
  useImperativeHandle(ref, () => ({
    resetMap: () => {
      console.log('HomePage - resetMap 호출됨');
      console.log('mapRef.current:', mapRef.current);
      if (mapRef.current) {
        // 필터링 상태를 false로 설정하여 메시지 숨김
        
        // 선택된 클러스터 초기화
        setSelectedClusterProperties([]);
        
        // 초기화 화면: 구산동, 도림동, 운연동이 보이는 근접한 범위 (30% 좁힌 범위)
        const koreaCenter = { lat: 37.5240, lng: 126.9003 };
        mapRef.current.setCenter(koreaCenter);
        mapRef.current.setZoom(13); // 30% 정도로 범위를 좁힌 줌 레벨
        
        // 마커 재설정
        if (mapRef.current.resetMarkers) {
          mapRef.current.resetMarkers();
        }
        
        console.log('지도 리셋 완료 - 구산동, 도림동, 운연동 중심으로 설정');
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
      // 남한 범위 내의 매물들만 필터링 (제주도 완전 제외)
      const koreaProperties = filteredProperties.filter(property => {
        const lat = property.location?.lat || 0;
        const lng = property.location?.lng || 0;
        return lat >= 33.5 && lat <= 38.8 && lng >= 124.5 && lng <= 131.9;
      });
      
      if (koreaProperties.length > 0) {
        // 남한 범위 내 매물들의 중심점 계산
        const totalLat = koreaProperties.reduce((sum, property) => sum + (property.location?.lat || 0), 0);
        const totalLng = koreaProperties.reduce((sum, property) => sum + (property.location?.lng || 0), 0);
        const avgLat = totalLat / koreaProperties.length;
        const avgLng = totalLng / koreaProperties.length;
        
        console.log('필터링된 매물 중심점 (남한 범위 내):', { lat: avgLat, lng: avgLng });
        
        // 지도 중심을 필터링된 매물들의 중심으로 이동
        mapRef.current.setCenter({ lat: avgLat, lng: avgLng });
        
        // 매물이 적은 경우 줌 레벨을 높임 (사용자가 원하면 더 줌인 가능)
        if (koreaProperties.length === 1) {
          mapRef.current.setZoom(Math.max(15, mapRef.current.getZoom())); // 현재 줌보다 낮지 않게
        } else if (koreaProperties.length <= 3) {
          mapRef.current.setZoom(Math.max(13, mapRef.current.getZoom())); // 현재 줌보다 낮지 않게
        } else {
          mapRef.current.setZoom(Math.max(11, mapRef.current.getZoom())); // 현재 줌보다 낮지 않게
        }
      } else {
        // 남한 범위 내 매물이 없으면 첫화면(의정부시, 화성시, 광주시) 중심으로 이동 (30% 좁힌 범위)
        const koreaCenter = { lat: 37.4563, lng: 126.7052 };
        mapRef.current.setCenter(koreaCenter);
        mapRef.current.setZoom(11); // 30% 정도로 범위를 좁힌 줌 레벨
        console.log('남한 범위 내 매물이 없어 첫화면(의정부시, 화성시, 광주시) 중심으로 이동합니다.');
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

  // 컴포넌트 마운트 시 Firebase에서 매물 로드
  useEffect(() => {
    loadProperties();
    
    // 모바일 이미지 캐시 관리 실행
    if (isMobileDevice) {
      manageMobileImageCache();
    }
  }, [loadProperties, isMobileDevice]);


  // 매물 추가 시 Firebase 새로고침
  useEffect(() => {
    if (newProperties.length > 0) {
      refreshProperties();
    }
  }, [newProperties, refreshProperties]);

  // 모든 매물 (Firebase 매물 + 새로 추가된 매물)
  const allProperties = useMemo(() => [...firebaseProperties, ...newProperties], [firebaseProperties, newProperties]);

  // 매물 데이터가 로드되면 이미지 동기화 실행
  useEffect(() => {
    if (allProperties.length > 0) {
      console.log('=== 매물 데이터 로드됨, 이미지 동기화 시작 ===');
      console.log('로드된 매물 수:', allProperties.length);
      
      // 각 매물의 실제 이미지 상태 확인
      allProperties.forEach((property, index) => {
        console.log(`매물 ${index + 1} 이미지 상태 확인:`, {
          id: property.id,
          title: property.title,
          type: property.type,
          hasImages: property.images && property.images.length > 0,
          imageCount: property.images?.length || 0,
          images: property.images
        });
        
        // 실제 이미지가 있으면 그것을 사용, 없으면 기본 이미지 사용
        let displayImages: string[] = [];
        
        if (property.images && property.images.length > 0) {
          // 실제 매물 이미지가 있는 경우
          displayImages = property.images;
          console.log(`✅ 매물 ${property.id} 실제 이미지 사용:`, displayImages);
        } else {
          // 실제 이미지가 없는 경우 기본 이미지 사용
          if (property.type === 'sale') {
            displayImages = [
              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop&auto=format&q=80',
              'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&auto=format&q=80'
            ];
          } else if (property.type === 'rent') {
            displayImages = [
              'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&auto=format&q=80',
              'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format&q=80'
            ];
          } else {
            displayImages = [
              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop&auto=format&q=80',
              'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&auto=format&q=80'
            ];
          }
          console.log(`⚠️ 매물 ${property.id} 기본 이미지 사용:`, displayImages);
        }
        
        // localStorage에 저장
        const storageKey = `mainImages_${property.id}`;
        localStorage.setItem(storageKey, JSON.stringify(displayImages));
        console.log(`✅ 매물 ${property.id} localStorage에 저장:`, displayImages);
      });
      
      // 항상 이미지 동기화 실행 (강제)
      console.log('🔄 이미지 동기화 강제 실행');
      syncAllPCImagesToMobile(allProperties);
      
      // 동기화 상태 확인
      setTimeout(() => {
        const syncStatus = checkImageSyncStatus();
        console.log('동기화 완료 후 상태:', syncStatus);
      }, 1000);
    }
  }, [allProperties]);

  // 매물 목록 이미지 강제 업데이트를 위한 상태
  const [imageUpdateTrigger, setImageUpdateTrigger] = useState(0);

  // 디버깅을 위한 로그
  console.log('firebaseProperties 개수:', firebaseProperties.length);
  console.log('newProperties 개수:', newProperties.length);
  console.log('allProperties 개수:', allProperties.length);
  console.log('allProperties:', allProperties.map(p => ({ 
    id: p.id, 
    title: p.title, 
    type: p.type, 
    price: p.price, 
    deposit: p.deposit 
  })));

  // 매물번호 검색 시 해당 매물 자동 선택
  useEffect(() => {
    if (propertyNumberSearch && propertyNumberSearch.trim()) {
      const foundProperty = allProperties.find(property => 
        property.id.toLowerCase() === propertyNumberSearch.toLowerCase().trim()
      );
      
      if (foundProperty) {
        console.log('매물번호 검색 결과:', foundProperty);
        // 상세페이지 모달을 열지 않고 매물목록에만 표시
        // setSelectedPropertyForDetail(foundProperty);
        
        // 지도에서 해당 매물 위치로 이동 (남한 범위 내에서만)
        if (mapRef.current) {
          const propertyLocation = {
            lat: foundProperty.location.lat,
            lng: foundProperty.location.lng
          };
          
          // 남한 범위 내에 있는지 확인 (제주도 완전 제외)
          const isInKorea = propertyLocation.lat >= 33.5 && propertyLocation.lat <= 38.8 &&
                           propertyLocation.lng >= 124.5 && propertyLocation.lng <= 131.9;
          
          if (isInKorea) {
            mapRef.current.setCenter(propertyLocation);
            // 줌 레벨은 사용자가 원하는 만큼 줌인할 수 있도록 최소값만 설정
            mapRef.current.setZoom(Math.max(15, mapRef.current.getZoom()));
          } else {
            // 남한 범위 밖이면 첫화면(의정부시, 화성시, 광주시) 중심으로 이동 (30% 좁힌 범위)
            const koreaCenter = { lat: 37.4563, lng: 126.7052 };
            mapRef.current.setCenter(koreaCenter);
            mapRef.current.setZoom(11); // 30% 정도로 범위를 좁힌 줌 레벨
            console.log('매물이 남한 범위 밖에 있어 첫화면(의정부시, 화성시, 광주시) 중심으로 이동합니다.');
          }
        }
      } else {
        console.log('매물번호 검색 결과 없음:', propertyNumberSearch);
        // 검색 결과가 없을 때는 모달 닫기
        setSelectedPropertyForDetail(null);
      }
    }
  }, [propertyNumberSearch, allProperties]);

  // 이미지 프리로딩 함수 (향후 사용 예정)
  // const preloadImage = (src: string): Promise<void> => {
  //   return new Promise((resolve, reject) => {
  //     const img = new Image();
  //     img.onload = () => resolve();
  //     img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  //     img.src = src;
  //   });
  // };

  // SimpleMap 렌더링 추적
  useEffect(() => {
    console.log('HomePage 렌더링 완료');
    console.log('MapSection이 렌더링됨');
    console.log('GoogleMap 컴포넌트가 렌더링됨');
  }, []);

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

  const formatPrice = (price: number, isMobile: boolean = false, isRent: boolean = false) => {
    console.log('formatPrice 호출됨:', price, typeof price, 'isRent:', isRent);
    
    if (!price || price <= 0) {
      console.log('가격이 0이거나 없음');
      return isMobile ? '정보없음' : '가격 정보 없음';
    }
    
    if (isRent) {
      // 임대금액은 만원 단위로 저장되어 있으므로 10000을 곱해서 원 단위로 변환
      const priceInWon = price * 10000;
      console.log('임대금액 원 단위로 변환된 가격:', priceInWon);
      
      if (priceInWon >= 10000) {
        const result = isMobile ? `${Math.floor(priceInWon / 10000)}만` : `${Math.floor(priceInWon / 10000)}만원`;
        console.log('임대금액 만원 단위 결과:', result);
        return result;
      } else {
        const result = isMobile ? `${priceInWon}원` : `${priceInWon.toLocaleString()}원`;
        console.log('임대금액 원 단위 결과:', result);
        return result;
      }
    } else {
      // 매매금액은 억 단위로 저장되어 있으므로 100000000을 곱해서 원 단위로 변환
      const priceInWon = price * 100000000;
      console.log('매매금액 원 단위로 변환된 가격:', priceInWon);
      
      // 매매금액은 억 단위로 표시 (예: 8.5억원)
      if (priceInWon >= 100000000) {
        // 1억 이상인 경우 (억 단위로 표시)
        const eok = priceInWon / 100000000;
        const result = isMobile ? `${eok}억원` : `${eok}억원`;
        console.log('매매금액 억 단위 결과:', result);
        return result;
      } else if (priceInWon >= 10000) {
        // 1만원 이상 1억 미만인 경우 (만원 단위로 표시)
        const man = Math.floor(priceInWon / 10000);
        const result = isMobile ? `${man}만원` : `${man}만원`;
        console.log('매매금액 만원 단위 결과:', result);
        return result;
      } else {
        // 1만원 미만인 경우
        const result = isMobile ? `${priceInWon}원` : `${priceInWon.toLocaleString()}원`;
        console.log('매매금액 원 단위 결과:', result);
        return result;
      }
    }
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

  const getFilteredProperties = useCallback(() => {
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

    // 매물번호 검색 필터
    if (propertyNumberSearch) {
      filtered = filtered.filter(property =>
        property.id.toLowerCase().includes(propertyNumberSearch.toLowerCase())
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
              // property.area를 평 단위로 변환
              const area = Math.round(property.area / 3.3058);
              const isInRange = area >= min && area <= max;
              console.log(`매물 ${property.id} 면적: ${area}평(${Math.round(property.area)}m²), 범위: ${min}~${max}평, 포함여부: ${isInRange}`);
              return isInRange;
            });
          }
        } else {
          // 단일 값 (예: "10평")
          const area = parseFloat(areaValue.replace(/[~평]/g, ''));
          console.log('면적 단일 값 파싱:', area);
          filtered = filtered.filter(property => {
            // property.area를 평 단위로 변환
            const propertyArea = Math.round(property.area / 3.3058);
            const isMatch = propertyArea === area;
            console.log(`매물 ${property.id} 면적: ${propertyArea}평(${Math.round(property.area)}m²), 필터: ${area}평, 일치여부: ${isMatch}`);
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
          // property.area를 평 단위로 변환
          const area = Math.round(property.area / 3.3058);
          const isInRange = area >= min && area <= max;
          console.log(`매물 ${property.id} 면적: ${area}평(${Math.round(property.area)}m²), 범위: ${min}~${max}평, 포함여부: ${isInRange}`);
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
      console.log('=== 보증금 필터 디버깅 시작 ===');
      console.log('보증금 필터 적용:', filters.deposit);
      const depositValues = filters.deposit.split(',');
      console.log('보증금 값들:', depositValues);
      
      if (depositValues.length === 1) {
        // 단일 값 선택
        const depositValue = depositValues[0];
        console.log('보증금 단일 값:', depositValue);
        
        if (depositValue.includes('~')) {
          // 범위 값 (예: "1000만~2000만")
          const parts = depositValue.split('~');
          console.log('보증금 범위 파트:', parts);
          if (parts.length === 2) {
            // 만원 단위로 변환 (매물 데이터가 만원 단위로 저장되어 있음)
            let min = 0;
            let max = 0;
            
            // 최소값 처리
            if (parts[0] === '') {
              min = 0; // 빈 값이면 0부터
            } else if (parts[0].includes('천만')) {
              min = parseFloat(parts[0].replace(/[~천만]/g, '')) * 1000;
            } else {
              min = parseFloat(parts[0].replace(/[~만]/g, ''));
            }
            
            // 최대값 처리
            if (parts[1] === '') {
              max = Number.MAX_SAFE_INTEGER; // 빈 값이면 최대값까지
            } else if (parts[1].includes('천만')) {
              max = parseFloat(parts[1].replace(/[~천만]/g, '')) * 1000;
            } else {
              max = parseFloat(parts[1].replace(/[~만]/g, ''));
            }
            
            console.log('보증금 범위 파싱 결과 (만원):', min, '~', max);
            console.log('보증금 범위 타입:', typeof min, typeof max);
            console.log('보증금 범위 유효성:', !isNaN(min), !isNaN(max));
            
            filtered = filtered.filter(property => {
              const deposit = property.deposit || 0; // 매물 데이터는 만원 단위
              const isInRange = deposit >= min && deposit <= max;
              console.log(`매물 ${property.id} 보증금: ${deposit}만원, 범위: ${min}~${max}만원, 포함여부: ${isInRange}`);
              return isInRange;
            });
          }
        } else {
          // 단일 값 (예: "1000만")
          let deposit = 0;
          if (depositValue.includes('천만')) {
            deposit = parseFloat(depositValue.replace(/[~천만]/g, '')) * 1000; // 천만 → 만원 단위
          } else {
            deposit = parseFloat(depositValue.replace(/[~만]/g, '')); // 만원 단위 그대로
          }
          console.log('보증금 단일 값 파싱 (만원):', deposit);
          filtered = filtered.filter(property => {
            const propertyDeposit = property.deposit || 0; // 매물 데이터는 만원 단위
            const isMatch = propertyDeposit === deposit;
            console.log(`매물 ${property.id} 보증금: ${propertyDeposit}만원, 필터: ${deposit}만원, 일치여부: ${isMatch}`);
            return isMatch;
          });
        }
      } else if (depositValues.length === 2) {
        // 두 값 선택 (범위)
        const [min, max] = depositValues.map(d => {
          if (d.includes('천만')) {
            return parseFloat(d.replace(/[~천만]/g, '')) * 1000; // 천만 → 만원 단위
          } else {
            return parseFloat(d.replace(/[~만]/g, '')); // 만원 단위 그대로
          }
        });
        console.log('보증금 두 값 범위 (만원):', min, '~', max);
        console.log('보증금 두 값 타입:', typeof min, typeof max);
        console.log('보증금 두 값 유효성:', !isNaN(min), !isNaN(max));
        
        filtered = filtered.filter(property => {
          const deposit = property.deposit || 0; // 매물 데이터는 만원 단위
          const isInRange = deposit >= min && deposit <= max;
          console.log(`매물 ${property.id} 보증금: ${deposit}만원, 범위: ${min}~${max}만원, 포함여부: ${isInRange}`);
          return isInRange;
        });
      }
      console.log('보증금 필터 적용 후 매물 수:', filtered.length);
      console.log('=== 보증금 필터 디버깅 완료 ===');
    }

    // 선택된 클러스터 매물이 있으면 해당 매물들만 반환, 없으면 필터링된 전체 매물 반환
    // 모든 마커가 계속 표시되도록 수정
    return filtered;
  }, [allProperties, searchTerm, addressSearch, propertyNumberSearch, filters]);

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

  const displayProperties = useMemo(() => getFilteredProperties(), [
    getFilteredProperties
  ]);
  
  const listProperties = useMemo(() => 
    selectedClusterProperties.length > 0 ? selectedClusterProperties : displayProperties,
    [selectedClusterProperties, displayProperties]
  );

  // 매물 목록이 변경될 때마다 이미지 상태 강제 업데이트
  useEffect(() => {
    if (listProperties.length > 0) {
      console.log('=== 매물 목록 변경, 이미지 상태 강제 업데이트 ===');
      setImageUpdateTrigger(prev => prev + 1);
    }
  }, [listProperties]);

  // 매물 목록의 이미지 정보를 미리 처리하는 메모이제이션
  const processedListProperties = useMemo(() => {
    return listProperties.map(property => {
      const savedMainImages = localStorage.getItem(`mainImages_${property.id}`);
      let displayImages = property.images || [];
      
      // localStorage에 저장된 이미지가 있으면 우선 사용
      if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
        try {
          const parsedImages = JSON.parse(savedMainImages);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            displayImages = parsedImages;
          }
        } catch (error) {
          console.error('메인 이미지 파싱 오류:', error);
        }
      }
      
      // 이미지가 없으면 모바일 안전 이미지 사용
      if (!displayImages || displayImages.length === 0) {
        displayImages = getMobileImageUrls(property.id);
        // localStorage에도 저장
        const storageKey = `mainImages_${property.id}`;
        localStorage.setItem(storageKey, JSON.stringify(displayImages));
      }
      
      return {
        ...property,
        processedImages: displayImages,
        firstImageUrl: displayImages && displayImages.length > 0 ? displayImages[0] : null
      };
    });
  }, [listProperties, imageUpdateTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  console.log('displayProperties:', displayProperties.length, '개 매물');
  console.log('listProperties:', listProperties.length, '개 매물 (목록 표시용)');

  // GoogleMap에 전달할 props 메모이제이션 - 매물목록 상태와 완전히 분리
  const mapProps = useMemo(() => ({
    properties: displayProperties,
    onMarkerClick: handleMarkerClick,
    onClusterClick: handleClusterClick
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [displayProperties]); // handleMarkerClick, handleClusterClick 의존성 제거

  return (
    <>
      {loading && (
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
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '1rem' }}>매물을 불러오는 중...</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Firebase에서 매물 데이터를 동기화하고 있습니다.
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#fee2e2',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>매물 조회 오류</div>
          <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            새로고침
          </button>
        </div>
      )}

      {/* 모바일 검색 전용 모드 알림 */}
      {isSearchOnly && (
        <MobileSearchOnlyNotice>
          <NoticeIcon>🔍</NoticeIcon>
          <NoticeText>모바일 검색 전용 모드 - 매물 검색 및 조회만 가능합니다</NoticeText>
        </MobileSearchOnlyNotice>
      )}

      <HomeContainer>
        <MapSection>
          <GoogleMap
            {...mapProps}
            ref={mapRef}
          />
        </MapSection>
        
        <PropertyListSection>
          {processedListProperties.length === 0 ? (
            <EmptyState>
              <EmptyIcon>🏠</EmptyIcon>
              <p>현재 매물이 없습니다.</p>
              {!isSearchOnly && !shouldDisablePropertyRegistration() && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                  PC에서 매물을 등록할 수 있습니다.
                </div>
              )}
            </EmptyState>
          ) : (
            processedListProperties.map(property => {
              // 이미 처리된 이미지 정보 사용
              const { processedImages, firstImageUrl } = property;
              
              console.log(`매물 ${property.id} 이미지 확인 (처리됨) - 트리거: ${imageUpdateTrigger}:`, {
                processedImages: processedImages,
                firstImageUrl: firstImageUrl,
                hasImages: processedImages && processedImages.length > 0,
                imageType: firstImageUrl ? (firstImageUrl.startsWith('data:') ? 'base64' : 'url') : 'none'
              });
              
              return (
                <PropertyCard 
                  key={property.id}
                  onClick={() => handlePropertyCardClick(property)}
                >
                  <PropertyImage>
                    {firstImageUrl ? (
                      <img 
                        src={firstImageUrl} 
                        alt={property.title}
                        onError={(e) => {
                          console.log(`❌ 매물 ${property.id} 이미지 로딩 실패:`, {
                            src: firstImageUrl,
                            originalSrc: processedImages[0]
                          });
                          
                          // 대체 이미지 시도
                          const target = e.target as HTMLImageElement;
                          if (processedImages && processedImages.length > 1) {
                            console.log(`🔄 매물 ${property.id} 대체 이미지 시도:`, processedImages[1]);
                            target.src = processedImages[1];
                            return;
                          }
                          
                          // 모든 이미지 실패 시 fallback 아이콘 표시
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.log(`✅ 매물 ${property.id} 이미지 로딩 성공:`, {
                            src: firstImageUrl,
                            naturalWidth: target.naturalWidth,
                            naturalHeight: target.naturalHeight
                          });
                        }}
                        loading="eager"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          display: 'block'
                        }}
                      />
                    ) : null}
                    {/* Fallback 아이콘 - 이미지가 없거나 로딩 실패 시 표시 */}
                    <div 
                      className="fallback-icon"
                      style={{
                        display: firstImageUrl ? 'none' : 'flex',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f3f4f6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                        fontSize: '0.875rem',
                        borderRadius: '8px',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
                    >
                      🏠
                    </div>
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
                      <DetailTag>전용 {Math.round(property.area / 3.3058)}평</DetailTag>
                      {property.floor && <DetailTag>{property.floor}</DetailTag>}
                      {property.parking !== undefined && (
                        <DetailTag>주차 {property.parking ? '가능' : '불가능'}</DetailTag>
                      )}
                      {property.elevator !== undefined && (
                        <DetailTag>엘리베이터 {property.elevator ? '유' : '무'}</DetailTag>
                      )}
                    </PropertyDetails>
                    <PropertyPrice>
                      {property.type === 'rent' ? (
                        <>
                          {(() => {
                            console.log('=== 매물 가격 표시 디버깅 ===');
                            console.log('매물 ID:', property.id);
                            console.log('매물 타입:', property.type);
                            console.log('보증금:', property.deposit);
                            console.log('임대료:', property.price);
                            console.log('보증금 조건:', property.deposit && property.deposit > 0);
                            console.log('임대료 조건:', property.price && property.price > 0);
                            return null;
                          })()}
                          {(property.deposit && property.deposit > 0) && (
                            <PriceButton>
                              보증금 {formatPrice(property.deposit, window.innerWidth <= 768, true)}
                            </PriceButton>
                          )}
                          {(property.price && property.price > 0) && (
                            <PriceButton>
                              임대료 {formatPrice(property.price, window.innerWidth <= 768, true)}
                            </PriceButton>
                          )}
                          {(!property.deposit || property.deposit <= 0) && (!property.price || property.price <= 0) && (
                            <PriceButton>
                              {window.innerWidth <= 768 ? '정보없음' : '가격 정보 없음'}
                            </PriceButton>
                          )}
                        </>
                      ) : (
                        <PriceButton isSale={true}>
                          매매 {formatPrice(property.price, window.innerWidth <= 768, false)}
                        </PriceButton>
                      )}
                    </PropertyPrice>
                  </PropertyInfo>
                </PropertyCard>
              );
            })
          )}
        </PropertyListSection>
      </HomeContainer>

      
      {selectedPropertyForDetail && (
        <PropertyDetailModal
          property={selectedPropertyForDetail}
          onClose={handleCloseDetailModal}
          onPropertyUpdate={handlePropertyUpdate}
          isAdmin={!isSearchOnly && !shouldDisableAdminFeatures()}
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