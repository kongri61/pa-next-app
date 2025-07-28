import React, { useState } from 'react';
import styled from 'styled-components';
import GoogleMap from '../components/GoogleMap';
import PropertyDetailModal from '../components/PropertyDetailModal';
import { Property } from '../types';

const HomeContainer = styled.div`
  display: flex;
  height: 100vh;
  min-height: 600px;
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
`;

const MapSection = styled.div`
  flex: 1;
  position: relative;
  height: 100vh;
  min-height: 600px;
`;

const Sidebar = styled.div<{ isOpen: boolean }>`
  width: ${props => props.isOpen ? '450px' : '0'};
  background: white;
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
  transition: width 0.3s ease;
  position: relative;
  height: calc(100vh - 80px) !important;
  min-height: 600px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: ${props => props.isOpen ? '100%' : '0'};
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    height: calc(100vh - 80px) !important;
    min-height: 600px;
  }
`;

const SidebarHeader = styled.div`
  flex-shrink: 0;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  display: flex;
  align-items: center;
  min-height: 60px;
`;

const FilterInfoWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding: 0 0.5rem;
`;

const FilterInfo = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  color: #1f2937;
  display: flex;
  align-items: center;
  flex: 1;
`;

const ResetButton = styled.button`
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  background: #6B7280;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  height: 1.8rem;
  display: flex;
  align-items: center;

  &:hover {
    background: #4B5563;
  }
`;

const PropertyCard = styled.div`
  display: flex;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  min-height: 100px;

  &:hover {
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.4rem;
    margin-bottom: 0.2rem;
    gap: 0.5rem;
    min-height: 90px;
  }
`;

const PropertyCardImage = styled.div`
  width: 100px;
  height: 75px;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;
  position: relative;

  @media (max-width: 768px) {
    width: 80px;
    height: 60px;
  }
`;

const PropertyCardImageElement = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const PropertyCardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  width: 100%;
  padding-bottom: 0;
`;

const PropertyCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  width: 100%;
  min-width: 0;
  position: relative;
`;

const PropertyCardInfo = styled.div`
  flex: 1;
  min-width: 0;
  margin-right: 2rem;
  overflow: hidden;
`;

const PropertyCardNumber = styled.div`
  font-size: 0.75rem;
  color: #374151;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const PropertyCardTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }
`;

const PropertyCardDetails = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
  margin-bottom: 0.2rem;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-wrap: wrap;
  max-height: 3.6rem;
  overflow: visible;
  width: 100%;
  padding-right: 0.5rem;
`;

const InfoBox = styled.div`
  background: white;
  border-radius: 2px;
  padding: 0.05rem 0.15rem;
  font-size: 0.65rem;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
`;

const PropertyCardPricing = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-top: 0.2rem;
  flex-wrap: nowrap;
  overflow: hidden;
  flex-shrink: 0;
`;

const PriceBox = styled.div<{ type: 'deposit' | 'rent' | 'sale' | 'management' }>`
  background: ${props => {
    switch (props.type) {
      case 'deposit':
      case 'rent':
        return '#10b981';
      case 'sale':
        return '#f59e0b';
      case 'management':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }};
  color: white;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 0.55rem;
    padding: 0.1rem 0.25rem;
  }
`;

const PriceLabel = styled.span`
  font-size: 0.6rem;
  margin-right: 0.25rem;
`;

const PriceValue = styled.span`
  font-size: 0.7rem;
  font-weight: bold;
`;

const PropertyCardActions = styled.div`
  display: flex;
  gap: 0.2rem;
  position: absolute;
  top: 0;
  right: 0;
  flex-shrink: 0;
  z-index: 10;
`;

const EditButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 2px;
  padding: 0.03rem 0.1rem;
  font-size: 0.45rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 1.2rem;
  height: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: #059669;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const DeleteButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 2px;
  padding: 0.03rem 0.1rem;
  font-size: 0.45rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 1.2rem;
  height: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: #dc2626;
  }

  &:active {
    transform: scale(0.95);
  }
`;

// 샘플 데이터
const sampleProperties: Property[] = [
  {
    id: '1',
    title: '강남구 신축 상가',
    description: '강남구 역삼동 신축 상가입니다. 역세권으로 교통이 편리합니다.',
    price: 850000000,
    deposit: 50000000,
    type: 'sale',
    propertyType: 'commercial',
    address: '서울시 강남구 역삼동 123-45',
    location: { lat: 37.5013, lng: 127.0396 },
    bedrooms: 3,
    bathrooms: 2,
    area: 84.5,
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop'],
    contact: {
      name: '김부동산',
      phone: '02-1234-5678',
      email: 'kim@realestate.com'
    },
    features: ['역세권', '신축', '주차가능'],
    createdAt: new Date(),
    isActive: true,
    confirmedDate: '25.07.19',
    floor: '3/15층',
    parking: true,
    elevator: true
  },
  {
    id: '2',
    title: '홍대입구 근처 사무실',
    description: '홍대입구역 도보 5분 거리의 사무실입니다.',
    price: 500000,
    deposit: 10000000,
    type: 'rent',
    propertyType: 'office',
    address: '서울시 마포구 서교동 456-78',
    location: { lat: 37.5572, lng: 126.9254 },
    bedrooms: 1,
    bathrooms: 1,
    area: 25.3,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop'],
    contact: {
      name: '박부동산',
      phone: '02-9876-5432',
      email: 'park@realestate.com'
    },
    features: ['역세권', '사무실', '주차불가'],
    createdAt: new Date(),
    isActive: true,
    confirmedDate: '25.07.18',
    floor: '2/5층',
    parking: false,
    elevator: true
  },
  {
    id: '3',
    title: '강남구 테헤란로 건물',
    description: '강남구 테헤란로에 위치한 건물입니다.',
    price: 1200000000,
    deposit: 0,
    type: 'sale',
    propertyType: 'building',
    address: '서울시 강남구 테헤란로 123',
    location: { lat: 37.4981, lng: 127.0276 },
    bedrooms: 2,
    bathrooms: 1,
    area: 45.2,
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=300&fit=crop'],
    contact: {
      name: '이부동산',
      phone: '02-5555-1234',
      email: 'lee@realestate.com'
    },
    features: ['역세권', '건물', '주차가능'],
    createdAt: new Date(),
    isActive: true,
    confirmedDate: '25.07.20',
    floor: '8/12층',
    parking: true,
    elevator: true
  },
  {
    id: '4',
    title: '마포구 합정동 상가',
    description: '마포구 합정동에 위치한 상가입니다.',
    price: 300000000,
    deposit: 0,
    type: 'sale',
    propertyType: 'commercial',
    address: '서울시 마포구 합정동 789-12',
    location: { lat: 37.5498, lng: 126.9147 },
    bedrooms: 0,
    bathrooms: 1,
    area: 120.5,
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=300&fit=crop'],
    contact: {
      name: '최부동산',
      phone: '02-7777-8888',
      email: 'choi@realestate.com'
    },
    features: ['상가', '주차가능', '엘리베이터'],
    createdAt: new Date(),
    isActive: true,
    confirmedDate: '25.07.19',
    floor: '1/3층',
    parking: true,
    elevator: true
  },
  {
    id: '5',
    title: '강남구 삼성동 기타',
    description: '강남구 삼성동에 위치한 기타 매물입니다.',
    price: 650000000,
    deposit: 0,
    type: 'sale',
    propertyType: 'other',
    address: '서울시 강남구 삼성동 456-78',
    location: { lat: 37.5083, lng: 127.0558 },
    bedrooms: 3,
    bathrooms: 2,
    area: 95.8,
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop'],
    contact: {
      name: '정부동산',
      phone: '02-9999-1111',
      email: 'jung@realestate.com'
    },
    features: ['기타', '주차가능', '단독주택'],
    createdAt: new Date(),
    isActive: true,
    confirmedDate: '25.07.21',
    floor: '2/2층',
    parking: true,
    elevator: false
  }
];

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
  isAdmin?: boolean; // 관리자 권한 추가
  newProperties?: Property[]; // 새로운 매물 추가
}

const HomePage: React.FC<HomePageProps> = ({ 
  searchTerm = '', 
  addressSearch = '',
  filters = { type: '', propertyType: '', area: '', price: '', deposit: '' },
  onPropertyAdded,
  isAdmin = false,
  newProperties = []
}) => {
  const [properties, setProperties] = useState<Property[]>(sampleProperties);
  const [selectedClusterProperties, setSelectedClusterProperties] = useState<Property[]>([]);
  const [selectedMarkerProperties, setSelectedMarkerProperties] = useState<Property[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 앱 시작 시 localStorage의 이미지들을 매물 데이터에 반영
  const hasInitialized = React.useRef(false);
  
  React.useEffect(() => {
    if (hasInitialized.current) return; // 이미 실행되었으면 중단
    
    console.log('=== 앱 시작 시 localStorage 데이터 로드 ===');
    
    // localStorage에서 저장된 매물 목록 확인
    const savedProperties = localStorage.getItem('updatedProperties');
    if (savedProperties) {
      try {
        const parsedProperties = JSON.parse(savedProperties);
        if (Array.isArray(parsedProperties) && parsedProperties.length > 0) {
          console.log('localStorage에서 저장된 매물 목록 로드:', parsedProperties.length, '개');
          setProperties(parsedProperties);
          hasInitialized.current = true;
          return; // 저장된 매물이 있으면 기본 샘플 데이터 대신 사용
        }
      } catch (error) {
        console.error('저장된 매물 데이터 파싱 오류:', error);
      }
    }
    
    // localStorage 전체 상태 확인
    console.log('=== localStorage 전체 상태 ===');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('mainImages')) {
        console.log('발견된 메인 이미지 키:', key);
        const value = localStorage.getItem(key);
        console.log('값 길이:', value?.length || 0);
        console.log('값 시작 부분:', value?.substring(0, 100));
        console.log('Unsplash 포함 여부:', value?.includes('unsplash.com'));
        console.log('base64 포함 여부:', value?.includes('data:image/'));
      }
    }
    
    const updatedProperties = properties.map(property => {
      const savedMainImages = localStorage.getItem(`mainImages_${property.id}`);
      console.log(`=== 매물 ${property.id} 이미지 확인 ===`);
      console.log('localStorage 키:', `mainImages_${property.id}`);
      console.log('localStorage 값:', savedMainImages);
      
      if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
        try {
          const parsedImages = JSON.parse(savedMainImages);
          console.log('파싱된 이미지:', parsedImages);
          
          // Unsplash 이미지가 아닌 경우에만 적용
          if (Array.isArray(parsedImages) && parsedImages.length > 0 && 
              !parsedImages[0].includes('unsplash.com')) {
            console.log(`매물 ${property.id}: localStorage 이미지 적용`, parsedImages.length, '개');
            return {
              ...property,
              images: parsedImages
            };
          } else {
            console.log(`매물 ${property.id}: Unsplash 이미지이므로 기본 이미지 유지`);
          }
        } catch (error) {
          console.error(`매물 ${property.id} 이미지 파싱 오류:`, error);
        }
      } else {
        console.log(`매물 ${property.id}: localStorage 이미지 없음`);
      }
      
      return property;
    });
    
    setProperties(updatedProperties);
    hasInitialized.current = true; // 실행 완료 표시
    console.log('매물 데이터 업데이트 완료');
  }, [properties]); // properties 의존성 추가

  // 새로운 매물이 추가될 때 처리
  React.useEffect(() => {
    if (newProperties.length > 0) {
      console.log('=== 새로운 매물 추가 처리 ===');
      console.log('추가될 매물 개수:', newProperties.length);
      
      setProperties(prev => {
        const updatedProperties = [...prev, ...newProperties];
        
        // localStorage에 업데이트된 매물 목록 저장
        localStorage.setItem('updatedProperties', JSON.stringify(updatedProperties));
        console.log('새 매물 추가 및 localStorage 저장. 총 개수:', updatedProperties.length);
        
        return updatedProperties;
      });
    }
  }, [newProperties]);

  const handleMarkerClick = (property: Property) => {
    console.log(`마커 클릭: ${property.title} (${property.id})`);
    setSelectedClusterProperties([]); 
    setSelectedClusterId(''); 
    setSelectedMarkerProperties([property]); 
    setSelectedMarkerId(property.id); 
  };

  const handleClusterClick = (clusterProperties: Property[]) => {
    console.log(`클러스터 클릭: ${clusterProperties.length}개 매물 선택`);
    setSelectedMarkerProperties([]); 
    setSelectedMarkerId(null); 
    setSelectedClusterProperties(clusterProperties);
    setSelectedClusterId(clusterProperties.map(p => p.id).join(',')); 
  };

  const handleShowAllProperties = () => {
    setSelectedClusterProperties([]);
    setSelectedMarkerProperties([]);
    setSelectedMarkerId(null);
    setSelectedClusterId('');
  };

  const handlePropertyCardClick = (property: Property) => {
    console.log('매물 카드 클릭:', property.title);
    setSelectedPropertyForDetail(property);
  };

  const handleCloseDetailModal = () => {
    setSelectedPropertyForDetail(null);
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    console.log('=== handlePropertyUpdate 호출됨 ===');
    console.log('업데이트될 매물:', updatedProperty.title);
    console.log('새 이미지 배열:', updatedProperty.images);
    
    // localStorage에서 저장된 이미지들을 확인하고 업데이트된 매물에 반영
    const savedMainImages = localStorage.getItem(`mainImages_${updatedProperty.id}`);
    if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
      try {
        const parsedImages = JSON.parse(savedMainImages);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          updatedProperty.images = parsedImages;
          console.log('localStorage 이미지 반영:', updatedProperty.images.length, '개');
        }
      } catch (error) {
        console.error('이미지 파싱 오류:', error);
      }
    }
    
    setProperties(prev => {
      const newProperties = prev.map(p => p.id === updatedProperty.id ? updatedProperty : p);
      console.log('매물 목록 업데이트 완료');
      return newProperties;
    });
    
    setSelectedPropertyForDetail(updatedProperty);
    console.log('상세 모달 업데이트 완료');
  };

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      return `${Math.floor(price / 100000000)}억원`;
    } else if (price >= 10000) {
      return `${Math.floor(price / 10000)}만원`;
    }
    return `${price.toLocaleString()}원`;
  };

  const cleanPropertyTitle = (title: string) => {
    return title.replace(/숙/g, '').trim();
  };

  const maskAddress = (address: string) => {
    if (!address) return '';
    const parts = address.split(' ');
    const maskedParts = parts.slice(0, 3);
    return maskedParts.join(' ');
  };

  const getFilteredProperties = () => {
    let filtered = properties;

    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (addressSearch) {
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(addressSearch.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(property => property.type === filters.type);
    }
    if (filters.propertyType) {
      filtered = filtered.filter(property => property.propertyType === filters.propertyType);
    }

    return filtered;
  };

  const handleEditProperty = (property: Property) => {
    console.log('수정 버튼 클릭:', property.title);
    setEditingProperty(property);
  };

  const handleDeleteProperty = (property: Property) => {
    console.log('삭제 버튼 클릭:', property.title);
    setShowDeleteConfirm(property.id);
  };

  const handleConfirmDelete = () => {
    if (showDeleteConfirm) {
      setProperties(prev => {
        const newProperties = prev.filter(p => p.id !== showDeleteConfirm);
        
        // localStorage에 업데이트된 매물 목록 저장
        localStorage.setItem('updatedProperties', JSON.stringify(newProperties));
        console.log('매물 삭제 완료 및 localStorage 저장:', showDeleteConfirm);
        
        return newProperties;
      });
      setShowDeleteConfirm(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // 초기화 기능: 모든 localStorage 데이터 삭제하고 원본 데이터로 복원
  const handleResetAllData = () => {
    if (window.confirm('모든 변경사항을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // localStorage에서 매물 관련 데이터 모두 삭제
      localStorage.removeItem('updatedProperties');
      
      // 이미지 관련 localStorage 데이터도 삭제
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('mainImages') || key.includes('updatedProperties'))) {
          localStorage.removeItem(key);
        }
      }
      
      // 원본 샘플 데이터로 복원
      setProperties(sampleProperties);
      console.log('모든 데이터 초기화 완료');
    }
  };

  const handleSaveEdit = (updatedProperty: Property) => {
    // localStorage에서 저장된 이미지들을 확인하고 보존
    const savedMainImages = localStorage.getItem(`mainImages_${updatedProperty.id}`);
    if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
      try {
        const parsedImages = JSON.parse(savedMainImages);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          // localStorage의 이미지들을 사용
          updatedProperty.images = parsedImages;
          console.log('수정 시 localStorage 이미지 보존:', updatedProperty.images.length, '개');
        }
      } catch (error) {
        console.error('수정 시 이미지 파싱 오류:', error);
      }
    }
    
    setProperties(prev => {
      const newProperties = prev.map(p => p.id === updatedProperty.id ? updatedProperty : p);
      
      // localStorage에 업데이트된 매물 목록 저장
      localStorage.setItem('updatedProperties', JSON.stringify(newProperties));
      console.log('매물 수정 완료 및 localStorage 저장:', updatedProperty.title);
      
      return newProperties;
    });
    setEditingProperty(null);
  };

  const handleCancelEdit = () => {
    setEditingProperty(null);
  };

  const displayProperties = selectedClusterProperties.length > 0
    ? selectedClusterProperties
    : selectedMarkerProperties.length > 0
      ? selectedMarkerProperties
      : getFilteredProperties();
  const filteredProperties = getFilteredProperties();

  return (
    <HomeContainer>
      <MapSection>
        <GoogleMap
          properties={filteredProperties}
          onMarkerClick={handleMarkerClick}
          onClusterClick={handleClusterClick}
          selectedMarkerId={selectedMarkerId}
          setSelectedMarkerId={setSelectedMarkerId}
          selectedClusterId={selectedClusterId}
          setSelectedClusterId={setSelectedClusterId}
        />
      </MapSection>
      <Sidebar isOpen={true}>
        <SidebarHeader>
          <FilterInfoWrap>
            <FilterInfo>
              {selectedClusterProperties.length > 0 
                ? `총 ${properties.length}개 중 ${selectedClusterProperties.length}개 표시`
                : selectedMarkerProperties.length > 0
                  ? `총 ${properties.length}개 중 ${selectedMarkerProperties.length}개 표시`
                  : `총 ${properties.length}개 중 ${filteredProperties.length}개 표시`
              }
            </FilterInfo>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(selectedClusterProperties.length > 0 || selectedMarkerProperties.length > 0) && (
                <ResetButton onClick={handleShowAllProperties}>
                  초기화
                </ResetButton>
              )}
              {isAdmin && (
                <ResetButton 
                  onClick={handleResetAllData}
                  style={{ background: '#dc2626' }}
                >
                  전체초기화
                </ResetButton>
              )}
            </div>
          </FilterInfoWrap>
        </SidebarHeader>

        <div style={{ 
          flex: 1,
          overflow: 'scroll',
          height: 'calc(100vh - 80px)',
          padding: '0.3rem',
          backgroundColor: 'white',
          position: 'relative',
          minHeight: '400px',
          maxHeight: 'none',
          display: 'block',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}>
          {displayProperties.map(property => {
            // localStorage에서 저장된 이미지 확인
            const savedMainImages = localStorage.getItem(`mainImages_${property.id}`);
            let displayImages = property.images;
            
            console.log(`=== 매물 ${property.id} 이미지 확인 ===`);
            console.log('기본 이미지:', property.images);
            console.log('localStorage 키:', `mainImages_${property.id}`);
            console.log('localStorage 값:', savedMainImages);
            
            if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
              try {
                const parsedImages = JSON.parse(savedMainImages);
                console.log('파싱된 이미지:', parsedImages);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  displayImages = parsedImages;
                  console.log('localStorage 이미지 사용:', displayImages.length, '개');
                } else {
                  console.log('파싱된 이미지가 빈 배열이거나 유효하지 않음');
                }
              } catch (error) {
                console.error('이미지 파싱 오류:', error);
              }
            } else {
              console.log('localStorage에 저장된 이미지 없음, 기본 이미지 사용');
            }
            
            console.log('최종 표시할 이미지:', displayImages);
            
            return (
              <PropertyCard 
                key={property.id}
                onClick={() => handlePropertyCardClick(property)}
              >
                <PropertyCardImage>
                  <PropertyCardImageElement 
                    src={displayImages[0]} 
                    alt={property.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                    }}
                  />
                </PropertyCardImage>
                <PropertyCardContent>
                  <PropertyCardHeader>
                    <PropertyCardInfo>
                      <PropertyCardNumber>
                        {property.id} | {maskAddress(property.address)}
                      </PropertyCardNumber>
                      <PropertyCardTitle>
                        {cleanPropertyTitle(property.title)}
                      </PropertyCardTitle>
                      <PropertyCardDetails>
                        전용 {Math.round(property.area / 3.3058)}평
                        <InfoBox>
                          {property.type === 'sale' ? '매매' : '임대'}
                        </InfoBox>
                        {property.floor && <InfoBox>{property.floor}</InfoBox>}
                        {property.parking !== undefined && (
                          <InfoBox>
                            주차 {property.parking ? '가능' : '불가능'}
                          </InfoBox>
                        )}
                        {(() => {
                          console.log(`매물 ${property.id} 엘리베이터 정보:`, property.elevator);
                          return property.elevator !== undefined && (
                            <InfoBox>
                              엘리베이터 {property.elevator ? '유' : '무'}
                            </InfoBox>
                          );
                        })()}
                      </PropertyCardDetails>
                      <PropertyCardPricing>
                        {property.type === 'rent' ? (
                          <>
                            <PriceBox type="deposit">
                              <PriceLabel>보증금</PriceLabel>
                              <PriceValue>{formatPrice(property.deposit || 0)}</PriceValue>
                            </PriceBox>
                            <PriceBox type="rent">
                              <PriceLabel>임대료</PriceLabel>
                              <PriceValue>{formatPrice(property.price)}</PriceValue>
                            </PriceBox>
                          </>
                        ) : (
                          <PriceBox type="sale">
                            <PriceLabel>매매</PriceLabel>
                            <PriceValue>{formatPrice(property.price)}</PriceValue>
                          </PriceBox>
                        )}
                      </PropertyCardPricing>
                    </PropertyCardInfo>
                    <PropertyCardActions>
                      {isAdmin && (
                        <>
                          <EditButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProperty(property);
                            }}
                          >
                            수정
                          </EditButton>
                          <DeleteButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProperty(property);
                            }}
                          >
                            삭제
                          </DeleteButton>
                        </>
                      )}
                    </PropertyCardActions>
                  </PropertyCardHeader>
                </PropertyCardContent>
              </PropertyCard>
            );
          })}
        </div>
      </Sidebar>
      
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

      {/* 수정 모달 */}
      {editingProperty && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>매물 수정</h3>
            <PropertyEditForm
              property={editingProperty}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}
    </HomeContainer>
  );
};

// 매물 수정 폼 컴포넌트
const PropertyEditForm: React.FC<{
  property: Property | null;
  onSave: (property: Property) => void;
  onCancel: () => void;
}> = ({ property, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    price: property?.price || 0,
    deposit: property?.deposit || 0,
    type: property?.type || 'sale',
    propertyType: property?.propertyType || 'commercial',
    address: property?.address || '',
    bedrooms: property?.bedrooms || 0,
    bathrooms: property?.bathrooms || 0,
    area: property?.area || 0,
    floor: property?.floor || '',
    parking: property?.parking || false,
    elevator: property?.elevator || false,
    confirmedDate: property?.confirmedDate || '',
    // 중개소 정보 추가
    contactName: property?.contact?.name || '',
    contactPhone: property?.contact?.phone || '',
    contactEmail: property?.contact?.email || '',
    // 추가 정보
    managementFee: '', // 관리비
    loanAmount: '', // 융자금
    buildingUse: '', // 건축물용도
    heatingType: '', // 난방유형
    approvalDate: '', // 사용승인일
    moveInDate: '' // 입주가능일
  });

  // localStorage에서 저장된 이미지들을 로드
  React.useEffect(() => {
    if (property) {
      console.log('=== PropertyEditForm: localStorage에서 이미지 로드 시작 ===');
      console.log('매물 ID:', property.id);
      
      // localStorage 전체 상태 확인
      console.log('=== localStorage 전체 상태 ===');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('mainImages')) {
          console.log('발견된 메인 이미지 키:', key);
          const value = localStorage.getItem(key);
          console.log('값 길이:', value?.length || 0);
        }
      }
      
      // 매물별로 메인 이미지를 저장할 수 있도록 localStorage 사용
      const savedMainImages = localStorage.getItem(`mainImages_${property.id}`);
      console.log('저장된 메인 이미지:', savedMainImages);
      
      if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
        try {
          const parsedImages = JSON.parse(savedMainImages);
          console.log('파싱된 메인 이미지:', parsedImages.length, '개');
          
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            // property.images를 업데이트하여 localStorage의 이미지들을 사용
            property.images = parsedImages;
            console.log('매물 이미지 업데이트 완료:', property.images.length, '개');
          } else {
            console.log('파싱된 메인 이미지가 빈 배열이거나 유효하지 않음');
          }
        } catch (error) {
          console.error('메인 이미지 파싱 오류:', error);
        }
      } else {
        console.log('저장된 메인 이미지 없음, 기본 이미지 사용');
      }
    }
  }, [property]);

  // property가 변경될 때마다 formData를 업데이트
  React.useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        price: property.price || 0,
        deposit: property.deposit || 0,
        type: property.type || 'sale',
        propertyType: property.propertyType || 'commercial',
        address: property.address || '',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        area: property.area || 0,
        floor: property.floor || '',
        parking: property.parking || false,
        elevator: property.elevator || false,
        confirmedDate: property.confirmedDate || '',
        // 중개소 정보 추가
        contactName: property.contact?.name || '',
        contactPhone: property.contact?.phone || '',
        contactEmail: property.contact?.email || '',
        // 추가 정보
        managementFee: '', // 관리비
        loanAmount: '', // 융자금
        buildingUse: '', // 건축물용도
        heatingType: '', // 난방유형
        approvalDate: '', // 사용승인일
        moveInDate: '' // 입주가능일
      });
    }
  }, [property]);

  if (!property) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    
    const updatedProperty = {
      ...property,
      title: formData.title,
      description: formData.description,
      price: formData.price,
      deposit: formData.deposit,
      type: formData.type,
      propertyType: formData.propertyType,
      address: formData.address,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      area: formData.area,
      floor: formData.floor,
      parking: formData.parking,
      elevator: formData.elevator,
      confirmedDate: formData.confirmedDate,
      // images 필드를 보존하여 매물상세페이지에서 업로드한 이미지들이 사라지지 않도록 함
      images: property.images,
      contact: {
        name: formData.contactName,
        phone: formData.contactPhone,
        email: formData.contactEmail
      }
    };
    onSave(updatedProperty);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <h3 style={{ marginBottom: '1.5rem', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        매물 정보 수정
      </h3>

      {/* 기본 정보 */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>기본 정보</h4>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            매물명
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            매물설명
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              minHeight: '80px'
            }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              거래유형
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'sale' | 'rent' }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
              required
            >
              <option value="sale">매매</option>
              <option value="rent">임대</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              매물종류
            </label>
            <select
              value={formData.propertyType}
              onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value as 'commercial' | 'office' | 'building' }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
              required
            >
              <option value="commercial">상가</option>
              <option value="office">사무실</option>
              <option value="building">건물</option>
              <option value="other">기타</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            주소
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
            required
          />
        </div>
      </div>

      {/* 가격 정보 */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>가격 정보</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              {formData.type === 'sale' ? '매매가' : '임대료'}
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              보증금
            </label>
            <input
              type="number"
              value={formData.deposit}
              onChange={(e) => setFormData(prev => ({ ...prev, deposit: Number(e.target.value) }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              관리비
            </label>
            <input
              type="text"
              value={formData.managementFee}
              onChange={(e) => setFormData(prev => ({ ...prev, managementFee: e.target.value }))}
              placeholder="예: 10만원"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              융자금
            </label>
            <input
              type="text"
              value={formData.loanAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, loanAmount: e.target.value }))}
              placeholder="예: 5억원"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 건물 정보 */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>건물 정보</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              공급/전용면적 (m²)
            </label>
            <input
              type="number"
              value={formData.area}
              onChange={(e) => setFormData(prev => ({ ...prev, area: Number(e.target.value) }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
              step="0.1"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              해당층/전체층
            </label>
            <input
              type="text"
              value={formData.floor}
              onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
              placeholder="예: 3/15층"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              방/화장실
            </label>
            <input
              type="text"
              value={`${formData.bedrooms}/${formData.bathrooms}`}
              onChange={(e) => {
                const [bedrooms, bathrooms] = e.target.value.split('/').map(Number);
                setFormData(prev => ({ 
                  ...prev, 
                  bedrooms: bedrooms || 0, 
                  bathrooms: bathrooms || 0 
                }));
              }}
              placeholder="예: 3/2"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              건축물용도
            </label>
            <input
              type="text"
              value={formData.buildingUse}
              onChange={(e) => setFormData(prev => ({ ...prev, buildingUse: e.target.value }))}
              placeholder="예: 주거용"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              난방유형
            </label>
            <input
              type="text"
              value={formData.heatingType}
              onChange={(e) => setFormData(prev => ({ ...prev, heatingType: e.target.value }))}
              placeholder="예: 개별난방"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              확인매물
            </label>
            <input
              type="text"
              value={formData.confirmedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmedDate: e.target.value }))}
              placeholder="예: 25.07.22"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              주차
            </label>
            <select
              value={formData.parking ? 'true' : 'false'}
              onChange={(e) => setFormData(prev => ({ ...prev, parking: e.target.value === 'true' }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="true">가능</option>
              <option value="false">불가능</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              엘리베이터
            </label>
            <select
              value={formData.elevator ? 'true' : 'false'}
              onChange={(e) => setFormData(prev => ({ ...prev, elevator: e.target.value === 'true' }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="true">있음</option>
              <option value="false">없음</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              사용승인일
            </label>
            <input
              type="text"
              value={formData.approvalDate}
              onChange={(e) => setFormData(prev => ({ ...prev, approvalDate: e.target.value }))}
              placeholder="예: 2020.03.15"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            입주가능일
          </label>
          <input
            type="text"
            value={formData.moveInDate}
            onChange={(e) => setFormData(prev => ({ ...prev, moveInDate: e.target.value }))}
            placeholder="예: 즉시입주"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* 중개소 정보 */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>중개소 정보</h4>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            중개업소명
          </label>
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              전화번호
            </label>
            <input
              type="text"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              이메일
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        <button
          type="button"
          onClick={onCancel}
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
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          저장
        </button>
      </div>
    </form>
  );
};

export default HomePage; 