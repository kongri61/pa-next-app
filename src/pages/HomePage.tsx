import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import GoogleMap, { GoogleMapRef } from '../components/GoogleMap';
import PropertyDetailModal from '../components/PropertyDetailModal';
import { Property } from '../types';
import { useProperties } from '../hooks/useProperties';

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

// 2. 매물 목록 섹션 (PC용)
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
  min-height: 120px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  &:last-child {
    margin-bottom: 0;
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
  }

  @media (min-width: 768px) {
    width: 120px;
    height: 120px;
    margin-right: 1rem;
    font-size: 1rem;
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
  margin-top: 0.3rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    margin-top: 0.4rem;
    gap: 0.2rem;
    flex-wrap: nowrap; /* 모바일에서 줄바꿈 방지 */
    overflow-x: auto; /* 필요시 가로 스크롤 */
  }
`;

const PriceButton = styled.div`
  background: #10b981;
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
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 768px) {
    padding: 0.25rem 0.4rem; /* 패딩 더 작게 */
    font-size: 0.65rem; /* 폰트 크기 더 작게 */
    border-radius: 4px; /* 모서리 더 둥글게 */
    min-width: fit-content; /* 최소 너비 설정 */
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
        
        // 지도 중심을 남한 중심으로 설정 (줌 레벨은 사용자 선택에 맡김)
        const koreaCenter = { lat: 36.3504, lng: 127.3845 };
        mapRef.current.setCenter(koreaCenter);
        // 줌 레벨은 사용자가 자유롭게 조정할 수 있도록 제거
        
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
        // 남한 범위 내 매물이 없으면 남한 중심으로 이동 (줌 레벨은 유지)
        const koreaCenter = { lat: 36.3504, lng: 127.3845 };
        mapRef.current.setCenter(koreaCenter);
        // 줌 레벨은 사용자가 설정한 것을 유지
        console.log('남한 범위 내 매물이 없어 남한 중심으로 이동합니다.');
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
  }, [loadProperties]);

  // 매물 추가 시 Firebase 새로고침
  useEffect(() => {
    if (newProperties.length > 0) {
      refreshProperties();
    }
  }, [newProperties, refreshProperties]);

  // 모든 매물 (Firebase 매물 + 새로 추가된 매물)
  const allProperties = useMemo(() => [...firebaseProperties, ...newProperties], [firebaseProperties, newProperties]);

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
            // 남한 범위 밖이면 남한 중심으로 이동 (줌 레벨은 유지)
            const koreaCenter = { lat: 36.3504, lng: 127.3845 };
            mapRef.current.setCenter(koreaCenter);
            // 줌 레벨은 사용자가 설정한 것을 유지
            console.log('매물이 남한 범위 밖에 있어 남한 중심으로 이동합니다.');
          }
        }
      } else {
        console.log('매물번호 검색 결과 없음:', propertyNumberSearch);
        // 검색 결과가 없을 때는 모달 닫기
        setSelectedPropertyForDetail(null);
      }
    }
  }, [propertyNumberSearch, allProperties]);

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

  const formatPrice = (price: number, isMobile: boolean = false) => {
    console.log('formatPrice 호출됨:', price, typeof price);
    
    if (!price || price <= 0) {
      console.log('가격이 0이거나 없음');
      return isMobile ? '정보없음' : '가격 정보 없음';
    }
    
    if (price >= 100000000) {
      // 1억 이상인 경우
      const eok = Math.floor(price / 100000000);
      const man = Math.floor((price % 100000000) / 10000);
      if (man > 0) {
        const result = isMobile ? `${eok}억${man}만` : `${eok}억 ${man}만원`;
        console.log('1억 이상 결과:', result);
        return result;
      }
      const result = isMobile ? `${eok}억` : `${eok}억원`;
      console.log('1억 결과:', result);
      return result;
    } else if (price >= 10000) {
      // 1만원 이상 1억 미만인 경우
      const result = isMobile ? `${Math.floor(price / 10000)}만` : `${Math.floor(price / 10000)}만원`;
      console.log('1만원 이상 결과:', result);
      return result;
    } else if (price > 0) {
      // 1만원 미만인 경우
      const result = isMobile ? `${price}원` : `${price.toLocaleString()}원`;
      console.log('1만원 미만 결과:', result);
      return result;
    }
    
    console.log('기본값 반환');
    return isMobile ? '정보없음' : '가격 정보 없음';
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
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>오류 발생</div>
          <div style={{ fontSize: '0.9rem' }}>{error}</div>
        </div>
      )}

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
                {/* isAdmin && (
                  <AdminButton onClick={() => setSelectedPropertyForDetail({} as Property)}>
                    새 매물 추가
                  </AdminButton>
                ) */}
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
                                보증금 {formatPrice(property.deposit, window.innerWidth <= 768)}
                              </PriceButton>
                            )}
                            {(property.price && property.price > 0) && (
                              <PriceButton>
                                임대료 {formatPrice(property.price, window.innerWidth <= 768)}
                              </PriceButton>
                            )}
                            {(!property.deposit || property.deposit <= 0) && (!property.price || property.price <= 0) && (
                              <PriceButton>
                                {window.innerWidth <= 768 ? '정보없음' : '가격 정보 없음'}
                              </PriceButton>
                            )}
                          </>
                        ) : (
                          <PriceButton>
                            매매 {formatPrice(property.price, window.innerWidth <= 768)}
                          </PriceButton>
                        )}
                      </PropertyPrice>
                    </PropertyInfo>
                    {/* isAdmin && (
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
                    ) */}
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
            {/* isAdmin && (
              <AdminButton onClick={() => setSelectedPropertyForDetail({} as Property)}>
                새 매물 추가
              </AdminButton>
            ) */}
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
                          console.log('=== 모바일 매물 가격 표시 디버깅 ===');
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
                            보증금 {formatPrice(property.deposit, true)}
                          </PriceButton>
                        )}
                        {(property.price && property.price > 0) && (
                          <PriceButton>
                            임대료 {formatPrice(property.price, true)}
                          </PriceButton>
                        )}
                        {(!property.deposit || property.deposit <= 0) && (!property.price || property.price <= 0) && (
                          <PriceButton>
                            정보없음
                          </PriceButton>
                        )}
                      </>
                    ) : (
                      <PriceButton>
                        매매 {formatPrice(property.price, true)}
                      </PriceButton>
                    )}
                  </PropertyPrice>
                </PropertyInfo>
                {/* isAdmin && (
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
                ) */}
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
          isAdmin={false}
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