import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import GoogleMap, { GoogleMapRef } from '../components/GoogleMap';
import PropertyDetailModal from '../components/PropertyDetailModal';
import { Property } from '../types';
import * as IndexedDB from '../utils/indexedDB';
import { firebaseSync } from '../utils/firebaseSync';

// Firebase 모듈을 전역에서 접근 가능하도록 설정 (디버깅용)
(window as any).firebaseSync = firebaseSync;

// 매물 삭제 유틸리티 함수 추가 (콘솔에서 사용 가능)
(window as any).deleteProperties = async (ids: string | string[]) => {
  const idsToDelete = Array.isArray(ids) ? ids : [ids];
  console.log('🗑️ 매물 삭제 시작:', idsToDelete);
  
  const results = [];
  for (const id of idsToDelete) {
    try {
      await firebaseSync.deleteProperty(id);
      console.log(`✅ ${id} 삭제 완료`);
      results.push({ id, status: 'success' });
    } catch (error) {
      console.error(`❌ ${id} 삭제 실패:`, error);
      results.push({ id, status: 'error', error });
    }
  }
  
  console.log('📊 삭제 결과:', results);
  return results;
};

// 강제 정리 함수 추가
(window as any).forceCleanAll = async () => {
  console.log('🔥 강제 정리 시작...');
  try {
    await firebaseSync.forceCleanAllDuplicates();
    console.log('✅ 강제 정리 완료!');
    // 페이지 새로고침
    window.location.reload();
  } catch (error) {
    console.error('❌ 강제 정리 실패:', error);
  }
};

// 자동 정리 비활성화 (무한 루프 방지)
// setTimeout(async () => {
//   console.log('🚀 자동 강제 정리 시작...');
//   try {
//     await firebaseSync.forceCleanAllDuplicates();
//     console.log('✅ 자동 정리 완료!');
//     // 페이지 새로고침으로 결과 확인
//     setTimeout(() => {
//       window.location.reload();
//     }, 1000);
//   } catch (error) {
//     console.error('❌ 자동 정리 실패:', error);
//   }
// }, 2000);

// 수동 정리 함수 (더 강력한 버전)
(window as any).nuclearClean = async () => {
  console.log('💥 핵 정리 시작 - 모든 매물 삭제');
  try {
    // 1. 모든 매물 삭제
    const { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } = await import('firebase/firestore');
    const db = getFirestore();
    
    const querySnapshot = await getDocs(collection(db, 'properties'));
    console.log(`📊 현재 매물 수: ${querySnapshot.docs.length}`);
    
    if (querySnapshot.docs.length === 0) {
      console.log('✅ 삭제할 매물이 없습니다.');
      return;
    }
    
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach(docSnapshot => {
      batch.delete(doc(db, 'properties', docSnapshot.id));
      console.log(`🗑️ 삭제 예정: ${docSnapshot.id}`);
    });
    
    await batch.commit();
    console.log('💥 모든 매물 삭제 완료!');
    
    // 2. 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ 핵 정리 실패:', error);
  }
};

// 간단한 정리 함수
(window as any).simpleClean = async () => {
  console.log('🧹 간단 정리 시작...');
  try {
    await firebaseSync.forceCleanAllDuplicates();
    console.log('✅ 간단 정리 완료!');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ 간단 정리 실패:', error);
  }
};

// UUID 매물만 삭제하는 정확한 정리 함수 (수동 실행)
(window as any).cleanUUID = async () => {
  console.log('🎯 수동 UUID 매물 정리 시작 - P001, P002, P003, P004만 유지');
  try {
    const { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } = await import('firebase/firestore');
    const db = getFirestore();
    
    const querySnapshot = await getDocs(collection(db, 'properties'));
    console.log(`📊 현재 매물 수: ${querySnapshot.docs.length}`);
    console.log('📋 현재 매물들:', querySnapshot.docs.map(d => d.id));
    
    // P001, P002, P003, P004만 유지하고 나머지 삭제
    const keepIds = ['P001', 'P002', 'P003', 'P004'];
    const toDelete = querySnapshot.docs.filter(docSnapshot => !keepIds.includes(docSnapshot.id));
    
    if (toDelete.length === 0) {
      console.log('✅ 정리할 UUID 매물이 없습니다.');
      return;
    }
    
    console.log(`🗑️ 삭제할 UUID 매물 ${toDelete.length}개:`, toDelete.map(d => d.id));
    
    const batch = writeBatch(db);
    toDelete.forEach(docSnapshot => {
      batch.delete(doc(db, 'properties', docSnapshot.id));
      console.log(`🗑️ 삭제 예정: ${docSnapshot.id}`);
    });
    
    await batch.commit();
    console.log('🎯 수동 UUID 매물 정리 완료!');
    
    // 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ 수동 UUID 매물 정리 실패:', error);
  }
};

// 현재 매물 상태 확인 함수
(window as any).checkProperties = async () => {
  console.log('📊 현재 매물 상태 확인');
  try {
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');
    const db = getFirestore();
    
    const querySnapshot = await getDocs(collection(db, 'properties'));
    console.log(`📊 총 매물 수: ${querySnapshot.docs.length}`);
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}, 제목: ${data.title || '제목 없음'}`);
    });
    
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('❌ 매물 상태 확인 실패:', error);
    return 0;
  }
};

// 삭제된 매물(isActive: false) 완전 삭제 함수
(window as any).deleteInactiveProperties = async () => {
  console.log('🗑️ 삭제된 매물(isActive: false) 완전 삭제 시작...');
  try {
    // Firebase 모듈을 동적으로 가져오기
    const firestoreModule = await import('firebase/firestore');
    const { getFirestore, collection, getDocs, query, where, doc, writeBatch } = firestoreModule;
    
    // 이미 초기화된 db가 있으면 사용, 없으면 새로 가져오기
    const db = (window as any).__firebaseDb || getFirestore();
    
    if (!db) {
      throw new Error('Firebase가 초기화되지 않았습니다.');
    }
    
    // isActive: false인 매물들 조회
    const q = query(collection(db, 'properties'), where('isActive', '==', false));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 삭제된 매물 발견: ${querySnapshot.docs.length}개`);
    
    if (querySnapshot.docs.length === 0) {
      console.log('✅ 삭제할 매물이 없습니다.');
      return;
    }
    
    // 삭제할 매물 목록 출력
    console.log('\n📋 삭제할 매물 목록:');
    querySnapshot.docs.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      console.log(`${index + 1}. ID: ${docSnapshot.id}, 제목: ${data.title || '제목 없음'}`);
    });
    
    // 사용자 확인
    const confirmed = window.confirm(`정말로 ${querySnapshot.docs.length}개의 삭제된 매물을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
    
    if (!confirmed) {
      console.log('❌ 사용자가 취소했습니다.');
      return;
    }
    
    let deletedCount = 0;
    const batch = writeBatch(db);
    const batchSize = 500;
    let batchCount = 0;
    let currentBatch = batch;
    
    for (const docSnapshot of querySnapshot.docs) {
      const propertyId = docSnapshot.id;
      currentBatch.delete(doc(db, 'properties', propertyId));
      batchCount++;
      
      if (batchCount >= batchSize) {
        await currentBatch.commit();
        console.log(`✅ ${batchCount}개 매물 삭제 완료`);
        currentBatch = writeBatch(db);
        batchCount = 0;
        deletedCount += batchSize;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (batchCount > 0) {
      await currentBatch.commit();
      deletedCount += batchCount;
    }
    
    console.log(`\n🎉 삭제 완료! 총 ${deletedCount}개 매물 삭제됨`);
    
    // IndexedDB에서도 삭제
    const allProperties = await IndexedDB.getAllProperties();
    const inactiveProperties = allProperties.filter(p => p.isActive === false);
    
    if (inactiveProperties.length > 0) {
      console.log(`🗑️ IndexedDB에서 ${inactiveProperties.length}개 삭제된 매물 삭제 중...`);
      for (const property of inactiveProperties) {
        await IndexedDB.deleteProperty(property.id);
      }
      console.log('✅ IndexedDB 정리 완료');
    }
    
    const reload = window.confirm('페이지를 새로고침하시겠습니까?');
    if (reload) {
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ 삭제 과정에서 오류 발생:', error);
  }
};

// 자동 정리 로직 비활성화 - 무한 루프 방지
console.log('🚫 자동 정리 로직 비활성화됨 - 수동 정리만 사용 가능');
console.log('💡 브라우저 콘솔에서 deleteInactiveProperties()를 실행하여 삭제된 매물을 완전히 삭제하세요.');

// 기존 매물 데이터 변환 함수 (만원 → 억원 단위)
(window as any).convertExistingProperties = async () => {
  console.log('🔄 기존 매물 데이터 변환 시작 (만원 → 억원 단위)...');
  try {
    const { getFirestore, collection, getDocs, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore();
    
    const querySnapshot = await getDocs(collection(db, 'properties'));
    console.log(`📊 변환할 매물 수: ${querySnapshot.docs.length}`);
    
    let convertedCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const originalPrice = data.price;
      
      // 만원 단위인지 확인 (1000 이상이면 만원 단위로 가정)
      if (originalPrice >= 1000) {
        const newPrice = originalPrice / 10000; // 만원 → 억원 변환
        console.log(`🔄 ${docSnapshot.id}: ${originalPrice}만원 → ${newPrice}억원`);
        
        await updateDoc(doc(db, 'properties', docSnapshot.id), {
          price: newPrice
        });
        
        convertedCount++;
      } else {
        console.log(`⏭️ ${docSnapshot.id}: 이미 억원 단위 (${originalPrice})`);
      }
    }
    
    console.log(`✅ 변환 완료: ${convertedCount}개 매물 변환됨`);
    
    // 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ 매물 데이터 변환 실패:', error);
  }
};

// 테스트용 매물 추가 함수 (개발용)
(window as any).addTestProperty = async () => {
  console.log('🧪 테스트 매물 추가 시작...');
  try {
    const testProperty: Property = {
      id: 'TEST001',
      title: '테스트 매물 - 8.5억원',
      description: '테스트용 매물입니다.',
      price: 8.5, // 8.5억원 (억원 단위로 변경)
      type: 'sale',
      propertyType: 'commercial',
      address: '서울시 강남구 테스트동 123-45',
      location: { lat: 37.5665, lng: 126.9780 },
      area: 100, // 100m²
      images: [],
      contact: {
        name: '테스트 중개소',
        phone: '02-1234-5678',
        email: 'test@test.com'
      },
      features: [],
      createdAt: new Date(),
      isActive: true
    };
    
    console.log('📊 테스트 매물 데이터:', testProperty);
    await firebaseSync.updateProperty(testProperty);
    console.log('✅ 테스트 매물 추가 완료!');
    
    // 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ 테스트 매물 추가 실패:', error);
  }
};

// 모바일 전용 2개 섹션 구조 (모든 화면 크기에서 모바일 레이아웃 강제)
const HomeContainer = styled.div`
  display: flex !important;
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
  width: 100% !important;
  box-sizing: border-box;
  
  /* 모바일 전용: 항상 세로 배치 (지도 위, 매물 아래) */
  flex-direction: column !important;
  height: calc(100vh - 80px) !important; /* 헤더 높이 조정 (모바일은 더 작음) */
  min-height: calc(100vh - 80px) !important;
  max-height: calc(100vh - 80px) !important;
  align-items: stretch !important;
  flex-wrap: nowrap !important;
`;

// 1. 지도 섹션 (모바일 전용) - 반만 보이도록
const MapSection = styled.div<{ show: boolean }>`
  position: relative;
  background: white;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  display: ${props => props.show ? 'flex' : 'none'};
  flex-direction: column;

  /* 모바일 전용: 항상 반만 보이도록 - flex 속성으로 강제 */
  flex: 0 0 50% !important;
  height: 50% !important;
  min-height: 50% !important;
  max-height: 50% !important;
  width: 100% !important;
  z-index: 1;
  order: 1;
  
  /* 지도 컨테이너가 전체 높이를 차지하도록 */
  > div {
    height: 100% !important;
    width: 100% !important;
  }
`;

// 2. 매물 목록 섹션 (모바일 전용) - 반만 보이도록
const PropertyListSection = styled.div<{ show: boolean }>`
  background: white;
  margin: 0;
  padding: 0;
  
  /* Flexbox 컨테이너 설정 */
  display: ${props => props.show ? 'flex' : 'none'};
  flex-direction: column;
  
  /* 오버플로우 처리 */
  overflow: hidden;
  
  /* 터치 최적화 */
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
  
  /* 시각적 효과 */
  box-shadow: none;
  
  width: 100%;

  /* 모바일 전용: 항상 반만 보이도록 */
  flex: 0 0 50% !important;
  height: 50% !important;
  min-height: 50% !important;
  max-height: 50% !important;
  width: 100% !important;
  display: flex !important;
  border-left: none;
  border-top: 1px solid #e2e8f0;
  box-shadow: none;
  border-radius: 0;
  margin: 0;
  position: relative;
  z-index: 0;
  order: 2;
`;

// 매물 목록 헤더 - 고정 높이로 스크롤 영역 확보
const PropertyListHeader = styled.div`
  flex: 0 0 auto; /* 고정 높이 */
  padding: 0.4rem 1rem; /* 상하 패딩 축소 */
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: auto; /* 최소 높이 제거 */
  
  .property-count {
    font-size: 0.75rem;
    color: #718096;
    background: #e2e8f0;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
`;

// 매물 목록 컨테이너 - 완전한 스크롤 보장
const PropertyListContainer = styled.div`
  flex: 1 1 auto; /* flex-grow, flex-shrink, flex-basis */
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  margin: 0;
  
  /* 높이를 부모에서 자동 계산하도록 설정 */
  height: auto;
  min-height: 0;
  max-height: none;
  
  /* 부드러운 스크롤 */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  
  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  /* Firefox 스크롤바 */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
  
  /* 마지막 매물까지 완전한 스크롤을 위한 하단 여백 */
  padding-bottom: 3rem;
`;

// 매물 카드 (모바일 전용)
const PCPropertyCard = styled.div`
  padding: 1rem;
  border-bottom: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:last-child {
    margin-bottom: 0.5rem;
    padding-bottom: 1rem;
  }
`;

// 매물 이미지 영역 (모바일 전용)
const PropertyImageSection = styled.div`
  flex-shrink: 0;
  width: 100px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid #e5e7eb;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// 매물 정보 영역 (모바일 전용)
const PropertyInfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
`;

// 매물 헤더 (번호 + 주소) - 모바일 전용
const PropertyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
`;

// 매물 번호
const PropertyNumber = styled.span`
  color: #dc2626;
  font-weight: bold;
`;

// 매물 주소
const PropertyAddress = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

// 매물 제목 (모바일 전용)
const PCPropertyTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  line-height: 1.4;
`;

// 매물 상세 정보 (모바일 전용)
const PCPropertyDetails = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  white-space: normal;
  text-overflow: unset;
`;

// 가격 정보 컨테이너
const PriceContainer = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
`;

// 매매가 버튼 (모바일 전용)
const SalePriceButton = styled.div`
  background: #f97316;
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
`;

// 임대료 버튼들 (모바일 전용)
const RentPriceButton = styled.div`
  background: #10b981;
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
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

interface HomePageProps {
  searchTerm?: string;
  addressSearch?: string;
  propertyNumberSearch?: string;
  filters?: {
    type: string;
    propertyType: string;
    area: string;
    price: string;
    deposit: string;
  };
  onFilterChange?: (filters: any) => void; // 필터 변경 핸들러 추가
  onSearchChange?: (searchTerm: string) => void; // 검색어 변경 핸들러 추가
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
  propertyNumberSearch = '',
  filters = { type: '', propertyType: '', area: '', price: '', deposit: '' },
  onFilterChange, // 필터 변경 핸들러 추가
  onSearchChange, // 검색어 변경 핸들러 추가
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
  const mapRef = useRef<GoogleMapRef>(null);
  const [selectedClusterProperties, setSelectedClusterProperties] = useState<Property[]>([]);
  const [defaultProperties, setDefaultProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false); // 로딩 화면 비활성화
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false); // Firebase 연결 상태

  // 기본 매물 데이터 (빈 배열로 초기화 - 서울 매물 제거됨)
  const initialProperties: Property[] = useMemo(() => [], []);

  // 디버깅 코드 제거됨 - 안정성을 위해

  // 데이터 초기화 및 Firebase 실시간 동기화 (성능 최적화: IndexedDB 우선 로드)
  useEffect(() => {
    console.log('🚀 데이터 초기화 시작 (성능 최적화: IndexedDB 우선 로드)...');
    
    // 모바일 서버 감지
    // PC 메인 서버: localhost, 192.168.219.105, pa-realestate-pc.vercel.app, pa-realestate-*.vercel.app
    // 모바일 사이트: real-estate-map-site.vercel.app 또는 기타 도메인
    const isMainServer = window.location.hostname === 'localhost' || 
                        window.location.hostname === '192.168.219.105' ||
                        window.location.hostname === 'pa-realestate-pc.vercel.app' ||
                        (window.location.hostname.includes('vercel.app') && 
                         window.location.hostname.includes('pa-realestate'));
    
    console.log('🌐 현재 호스트:', window.location.hostname);
    console.log('🖥️ 메인 서버 여부:', isMainServer);
    
    // 1단계: IndexedDB에서 즉시 로드 (빠른 초기 표시)
    const loadFromIndexedDB = async () => {
      try {
        console.log('📦 IndexedDB에서 즉시 로드 시작...');
        const IndexedDB = await import('../utils/indexedDB');
        const localProperties = await IndexedDB.getAllProperties();
        console.log('✅ IndexedDB 로드 완료:', localProperties.length, '개 매물');
        
        if (localProperties.length > 0) {
          // IndexedDB에 데이터가 있으면 즉시 표시
          setDefaultProperties(localProperties);
          console.log('⚡ IndexedDB 데이터 즉시 표시 완료');
        } else {
          // IndexedDB에 데이터가 없으면 빈 배열로 시작
          setDefaultProperties(initialProperties);
        }
      } catch (dbError) {
        console.warn('⚠️ IndexedDB 로드 실패, 빈 배열로 시작:', dbError);
        setDefaultProperties(initialProperties);
      }
    };
    
    // 2단계: Firebase 초기화 및 실시간 동기화 (백그라운드)
    const initializeFirebase = async () => {
      try {
        setError(null);
        
        await firebaseSync.initialize((properties) => {
          console.log('🔄 Firebase 실시간 업데이트 받음:', properties.length, '개 매물');
          
          // Firebase 데이터로 업데이트 (IndexedDB 데이터보다 최신일 수 있음)
          setDefaultProperties(properties);
          setIsFirebaseConnected(true);
          
          console.log('✅ Firebase 동기화 완료:', {
            매물수: properties.length,
            위치정보있는매물: properties.filter(p => p.location && p.location.lat && p.location.lng).length,
            연락처있는매물: properties.filter(p => p.contact && p.contact.name).length,
            이미지있는매물: properties.filter(p => p.images && p.images.length > 0).length
          });
        });
        
        console.log('✅ Firebase 실시간 동기화 설정 완료');
      } catch (error) {
        console.error('❌ Firebase 초기화 실패:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다. 오프라인 모드로 전환합니다.');
        setIsFirebaseConnected(false);
        // IndexedDB 데이터는 이미 표시되었으므로 오류만 표시
      }
    };

    // 병렬 실행: IndexedDB 즉시 로드 + Firebase 백그라운드 초기화
    loadFromIndexedDB().then(() => {
      // IndexedDB 로드 완료 후 Firebase 초기화 시작 (지연 없이 즉시)
      initializeFirebase();
    });
    
    return () => {
      try {
        firebaseSync.disconnect();
      } catch (error) {
        console.warn('Firebase 연결 해제 실패:', error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProperties]); // initialProperties는 상수이지만 ESLint 요구사항 충족

  // 지도 리셋 함수를 부모 컴포넌트에 노출
  useImperativeHandle(ref, () => ({
    resetMap: () => {
      console.log('HomePage - resetMap 호출됨');
      console.log('mapRef.current:', mapRef.current);
      if (mapRef.current) {
        // 1. 선택된 클러스터 초기화
        setSelectedClusterProperties([]);
        
        // 2. 모바일 목록 숨기기
        // setShowMobileList(false); // 이 변수는 모바일 목록 컴포넌트에서 관리하므로 여기서는 제거
        
        // 4. 지도 중심을 구월동으로 설정 (초기화 버튼 클릭 시)
        const guwolDongCenter = { lat: 37.4563, lng: 126.7052 }; // 구월동 중심 좌표
        mapRef.current.setCenter(guwolDongCenter);
        mapRef.current.setZoom(14); // 구월동 주변만 보이도록 줌 레벨 높임
        
        // 5. 마커 재설정
        if (mapRef.current.resetMarkers) {
          mapRef.current.resetMarkers();
        } else {
          console.warn('⚠️ resetMarkers 함수가 없습니다.');
        }
        
        console.log('지도 리셋 완료 - 구월동 중심으로 설정, 모든 상태 초기화');
      } else {
        console.log('mapRef.current가 null입니다');
      }
    }
  }));

  // 모든 매물 (중복 제거)
  const allProperties = React.useMemo(() => {
    const combined = [...defaultProperties, ...newProperties];
    // ID 기준으로 중복 제거
    const unique = combined.filter((property, index, self) => 
      index === self.findIndex(p => p.id === property.id)
    );
    console.log('📊 매물 중복 제거:', {
      원본: combined.length,
      중복제거후: unique.length,
      제거된중복: combined.length - unique.length
    });
    return unique;
  }, [defaultProperties, newProperties]);

  // 디버깅을 위한 로그
  console.log('📊 === HomePage 렌더링 상태 ===');
  console.log('defaultProperties 개수:', defaultProperties.length);
  console.log('defaultProperties ID:', defaultProperties.map(p => p.id).join(', '));
  console.log('newProperties 개수:', newProperties.length);
  console.log('allProperties 개수:', allProperties.length);
  console.log('allProperties ID:', allProperties.map(p => p.id).join(', '));
  console.log('allProperties:', allProperties.map(p => ({ id: p.id, title: p.title, price: p.price, type: p.type })));
  
  // 매매가 매물 디버깅
  const saleProperties = allProperties.filter(p => p.type === 'sale');
  console.log('매매가 매물들:', saleProperties.map(p => ({ id: p.id, title: p.title, price: p.price, priceInWon: p.price * 10000 })));

  const handlePropertyCardClick = (property: Property) => {
    setSelectedPropertyForDetail(property);
  };

  const handleMarkerClick = (property: Property) => {
    // 마커 클릭 시에는 모달을 열지 않고 해당 매물만 목록에 표시
    console.log('마커 클릭됨:', property.id, property.title);
    setSelectedClusterProperties([property]);
  };

  const handleCloseDetailModal = () => {
    setSelectedPropertyForDetail(null);
  };

  const handlePropertyUpdate = async (updatedProperty: Property) => {
    try {
      // 모바일 서버에서는 수정 불가 (PC에서만 수정 가능)
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname === 'pa-realestate-pc.vercel.app' ||
                          (window.location.hostname.includes('vercel.app') && 
                           window.location.hostname.includes('pa-realestate'));
      
      if (!isMainServer) {
        alert('📱 모바일에서는 매물 수정이 불가능합니다. PC에서 수정해주세요.');
        return;
      }

      console.log('🔄 매물 업데이트 시작:', {
        propertyId: updatedProperty.id,
        imagesCount: updatedProperty.images?.length || 0,
        images: updatedProperty.images?.map((img, idx) => ({
          index: idx,
          type: img?.startsWith('data:image/') ? 'Base64' : img?.startsWith('http') ? 'URL' : 'Unknown',
          length: img?.length || 0,
          preview: img?.substring(0, 50) + '...'
        })) || []
      });
      
      try {
        // Firebase + IndexedDB 동기화 업데이트
        await firebaseSync.updateProperty(updatedProperty);
        console.log('✅ Firebase 업데이트 완료:', updatedProperty.id);
        
        // 로컬 상태도 업데이트
        setDefaultProperties(prevProperties => 
          prevProperties.map(property => 
            property.id === updatedProperty.id ? updatedProperty : property
          )
        );
        
        // 선택된 매물도 업데이트
        setSelectedPropertyForDetail(updatedProperty);
        
        console.log('✅ 로컬 상태 업데이트 완료:', updatedProperty.id);
        
        // 성공 메시지 표시
        alert('매물이 성공적으로 수정되었습니다. (Firebase + IndexedDB 동기화 완료) 🔥');
      } catch (error) {
        console.error('❌ 매물 업데이트 실패:', error);
        console.error('❌ 업데이트 실패한 매물:', updatedProperty.id);
        alert('매물 업데이트 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
        throw error;
      }
      
      // Firebase 상태 확인
      const status = firebaseSync.getStatus();
      console.log('🔥 Firebase 상태:', status);
      
    } catch (error) {
      console.error('❌ 매물 업데이트 실패:', error);
      alert('매물 수정 중 오류가 발생했습니다. (오프라인 상태에서는 나중에 동기화됩니다)');
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      const eok = Math.round(price / 100000000 * 10) / 10; // 소수점 첫째자리까지 반올림
      return eok % 1 === 0 ? `${eok}억원` : `${eok}억원`; // 정수면 정수로, 소수면 소수로
    } else if (price >= 10000) {
      const man = Math.round(price / 10000 * 10) / 10; // 소수점 첫째자리까지 반올림
      return man % 1 === 0 ? `${man}만원` : `${man}만원`; // 정수면 정수로, 소수면 소수로
    }
    return `${price.toLocaleString()}원`;
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

    // 검색어 필터 - 완전히 새로 작성 v4.0
    if (searchTerm) {
      console.log('🚀 검색 시작 v4.0:', { 검색어: searchTerm, 전체매물: allProperties.map(p => p.id) });
      
      const searchLower = searchTerm.toLowerCase();
      let results: Property[] = [];
      
      // 1단계: 정확한 ID 매칭
      const exactMatches = allProperties.filter(property => 
        property.id.toLowerCase() === searchLower
      );
      results = [...results, ...exactMatches];
      console.log('1단계 정확매칭:', exactMatches.map(p => p.id));
      
      // 2단계: 숫자만 입력된 경우 P 접두사 매칭
      if (/^\d+$/.test(searchTerm)) {
        const searchNumber = searchTerm;
        console.log('2단계 숫자매칭 시작:', searchNumber);
        
        const numberMatches = allProperties.filter(property => {
          const propertyId = property.id.toLowerCase();
          
          // P1, P01, P001, P0001 등 모든 가능한 형식 체크
          const patterns = [
            `p${searchNumber}`,      // P1
            `p0${searchNumber}`,     // P01
            `p00${searchNumber}`,    // P001
            `p000${searchNumber}`,   // P0001
            `p0000${searchNumber}`   // P00001
          ];
          
          const isMatch = patterns.includes(propertyId);
          console.log(`  ${propertyId} 매칭체크:`, { 패턴들: patterns, 결과: isMatch });
          
          return isMatch;
        });
        
        results = [...results, ...numberMatches];
        console.log('2단계 숫자매칭 결과:', numberMatches.map(p => p.id));
      }
      
      // 3단계: 제목/주소 부분 매칭 (숫자만 입력된 경우 제외)
      const partialMatches = allProperties.filter(property => {
        // 숫자만 입력된 경우는 2단계에서 처리했으므로 제외
        if (/^\d+$/.test(searchTerm)) {
          return false;
        }
        
        const titleMatch = property.title.toLowerCase().includes(searchLower);
        const addressMatch = property.address.toLowerCase().includes(searchLower);
        const idMatch = property.id.toLowerCase().includes(searchLower);
        const descriptionMatch = property.description?.toLowerCase().includes(searchLower) || false;
        
        // 추가 필드 검색: 관리비포함항목, 건축물용도, 주차대수, 추천업종, 매물현황
        const maintenanceFeeItemsMatch = property.maintenanceFeeItems?.toLowerCase().includes(searchLower) || false;
        const buildingUseMatch = property.buildingUse?.toLowerCase().includes(searchLower) || false;
        const parkingSpacesMatch = property.parkingSpaces?.toString().includes(searchTerm) || false;
        const recommendedBusinessTypeMatch = property.recommendedBusinessType?.toLowerCase().includes(searchLower) || false;
        // 매물현황: type이 'sale'이면 '매매', 'rent'이면 '임대중'으로 검색
        const propertyStatusMatch = (property.type === 'sale' && searchTerm.includes('매매')) || 
                                    (property.type === 'rent' && searchTerm.includes('임대중')) ||
                                    (property.type === 'rent' && searchTerm.includes('임대'));
        
        // 연락처 정보 검색: 상호명, 이름, 전화번호, 이메일
        const contactNameMatch = property.contact?.name?.toLowerCase().includes(searchLower) || false;
        // 전화번호 검색: 여러 번호가 쉼표로 구분되어 있을 수 있으므로 각각 검색
        const phoneNumbers = property.contact?.phone?.split(',').map(p => p.trim()) || [];
        const contactPhoneMatch = phoneNumbers.some(phone => phone.includes(searchTerm)) || false;
        const contactEmailMatch = property.contact?.email?.toLowerCase().includes(searchLower) || false;
        // 상호명과 대표 이름 분리 검색
        const parseContactName = (name: string) => {
          if (!name) return { companyName: '', representativeName: '' };
          const parts = name.split(/\s+대표\s+/);
          if (parts.length === 2) {
            return { companyName: parts[0].trim(), representativeName: parts[1].trim() };
          }
          return { companyName: name.trim(), representativeName: '' };
        };
        const { companyName, representativeName } = parseContactName(property.contact?.name || '');
        const companyNameMatch = companyName.toLowerCase().includes(searchLower) || false;
        const representativeNameMatch = representativeName.toLowerCase().includes(searchLower) || false;
        
        const isMatch = titleMatch || addressMatch || idMatch || descriptionMatch ||
                       maintenanceFeeItemsMatch || buildingUseMatch || parkingSpacesMatch ||
                       recommendedBusinessTypeMatch || propertyStatusMatch ||
                       contactNameMatch || contactPhoneMatch || contactEmailMatch ||
                       companyNameMatch || representativeNameMatch;
        
        // 이미 매칭된 것은 제외
        const alreadyMatched = results.some(r => r.id === property.id);
        
        return isMatch && !alreadyMatched;
      });
      
      results = [...results, ...partialMatches];
      console.log('3단계 부분매칭 결과:', partialMatches.map(p => p.id));
      
      filtered = results;
      
      console.log('🎯 최종 검색 결과 v4.0:', {
        검색어: searchTerm,
        전체매물수: allProperties.length,
        전체매물ID: allProperties.map(p => p.id),
        최종결과수: filtered.length,
        최종결과ID: filtered.map(p => p.id),
        버전: '4.0 - 완전 재작성'
      });
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
              // dedicatedArea가 있으면 그것을 사용, 없으면 area 사용
              const areaForFilter = property.dedicatedArea || property.area;
              const area = Math.round(areaForFilter / 3.3058);
              const isInRange = area >= min && area <= max;
              console.log(`매물 ${property.id} 면적: ${area}평(${Math.round(areaForFilter)}m²), 범위: ${min}~${max}평, 포함여부: ${isInRange}`);
              return isInRange;
            });
          }
        } else {
          // 단일 값 (예: "10평" 또는 "200" - 200평~ 버튼)
          const area = parseFloat(areaValue.replace(/[~평]/g, ''));
          console.log('면적 단일 값 파싱:', area);
          filtered = filtered.filter(property => {
            // dedicatedArea가 있으면 그것을 사용, 없으면 area 사용
            const areaForFilter = property.dedicatedArea || property.area;
            const propertyArea = Math.round(areaForFilter / 3.3058);
            
            // 200은 200평 이상을 의미 (200평~ 버튼)
            if (area === 200) {
              const isMatch = propertyArea >= 200;
              console.log(`매물 ${property.id} 면적: ${propertyArea}평(${Math.round(areaForFilter)}m²), 필터: 200평 이상, 포함여부: ${isMatch}`);
              return isMatch;
            } else {
              // 일반 단일 값은 정확히 일치해야 함
              const isMatch = propertyArea === area;
              console.log(`매물 ${property.id} 면적: ${propertyArea}평(${Math.round(areaForFilter)}m²), 필터: ${area}평, 일치여부: ${isMatch}`);
              return isMatch;
            }
          });
        }
      } else if (areaValues.length === 2) {
        // 두 값 선택 (범위)
        const [min, max] = areaValues.map(a => parseFloat(a.replace(/[~평]/g, '')));
        console.log('면적 두 값 범위:', min, '~', max);
        console.log('면적 두 값 타입:', typeof min, typeof max);
        console.log('면적 두 값 유효성:', !isNaN(min), !isNaN(max));
        
        filtered = filtered.filter(property => {
          // dedicatedArea가 있으면 그것을 사용, 없으면 area 사용
          const areaForFilter = property.dedicatedArea || property.area;
          const area = Math.round(areaForFilter / 3.3058);
          
          // 200은 200평 이상을 의미 (200평~ 버튼)
          const actualMax = max === 200 ? Infinity : max;
          const isInRange = area >= min && area <= actualMax;
          
          console.log(`매물 ${property.id} 면적: ${area}평(${Math.round(areaForFilter)}m²), 범위: ${min}~${actualMax === Infinity ? '무제한' : actualMax}평, 포함여부: ${isInRange}`);
          return isInRange;
        });
      }
      console.log('면적 필터 적용 후 매물 수:', filtered.length);
      console.log('=== 면적 필터 디버깅 완료 ===');
    }

    // 매매가 필터 (Header에서 전달받는 형식: "8억~10억", "최소값~1억", "500억~최대값" 등)
    if (filters.price) {
      console.log('=== 매매가 필터 디버깅 시작 ===');
      console.log('매매가 필터 적용:', filters.price);
      console.log('전체 매물 수:', allProperties.length);
      console.log('필터링 전 매물 수:', filtered.length);
      
      // 매매가 필터는 매매매물에만 적용
      const saleProperties = filtered.filter(property => property.type === 'sale');
      console.log('매매매물만 필터링 후 매물 수:', saleProperties.length);
      console.log('매매매물 목록:', saleProperties.map(p => ({ id: p.id, price: p.price, title: p.title })));
      
      if (filters.price.includes('~')) {
        // 범위 형식 (예: "8억~10억", "최소값~1억", "500억~최대값")
        const [minStr, maxStr] = filters.price.split('~');
        console.log('범위 파싱:', minStr, '~', maxStr);
        
        // 최소값 처리
        let min = 0;
        if (minStr === '최소값' || minStr === '') {
          min = 0;
        } else {
          min = parseFloat(minStr.replace(/[억]/g, '')) * 100000000;
        }
        
        // 최대값 처리
        let max = 999999999999;
        if (maxStr === '최대값' || maxStr === '') {
          max = 999999999999;
        } else {
          max = parseFloat(maxStr.replace(/[억]/g, '')) * 100000000;
        }
        
        console.log('매매가 범위 파싱 결과:', min, '~', max);
        console.log('범위 (억원 단위):', min / 100000000, '~', max / 100000000);
        
        filtered = saleProperties.filter(property => {
          // 매매가는 억원 단위로 저장되어 있다고 가정
          const priceInEok = property.price; // 억원 단위
          const isInRange = priceInEok >= (min / 100000000) && priceInEok <= (max / 100000000);
          console.log(`매물 ${property.id} (${property.title}) 매매가: ${priceInEok}억원, 범위: ${min / 100000000}~${max / 100000000}억원, 포함여부: ${isInRange}`);
          console.log(`  - 매물 가격 (억원): ${priceInEok}`);
          console.log(`  - 최소값 (억원): ${min / 100000000}`);
          console.log(`  - 최대값 (억원): ${max / 100000000}`);
          console.log(`  - 최소값 조건: ${priceInEok >= (min / 100000000)}`);
          console.log(`  - 최대값 조건: ${priceInEok <= (max / 100000000)}`);
          return isInRange;
        });
      } else {
        // 단일 값 형식 (예: "8억")
        const priceValue = parseFloat(filters.price.replace(/[~억]/g, '')); // 억원 단위
        console.log('매매가 단일 값:', priceValue, '억원');
        
        filtered = saleProperties.filter(property => {
          const priceInEok = property.price; // 억원 단위
          const isMatch = priceInEok === priceValue;
          console.log(`매물 ${property.id} (${property.title}) 매매가: ${priceInEok}억원, 검색값: ${priceValue}억원, 일치여부: ${isMatch}`);
          return isMatch;
        });
      }
      
      console.log('매매가 필터 적용 후 매물 수:', filtered.length);
      console.log('최종 필터링된 매물:', filtered.map(p => ({ id: p.id, price: p.price, title: p.title })));
      console.log('=== 매매가 필터 디버깅 완료 ===');
    }

    // 보증금 필터 (Header에서 전달받는 형식: "0~100", "1000~1000", "1000~3000", "4000~9999" 등)
    if (filters.deposit) {
      console.log('=== 보증금 필터 디버깅 시작 ===');
      console.log('보증금 필터 적용:', filters.deposit);
      
      // 보증금 필터는 임대매물에만 적용
      filtered = filtered.filter(property => property.type === 'rent');
      console.log('임대매물만 필터링 후 매물 수:', filtered.length);
      
      if (filters.deposit.includes('~')) {
        // 범위 형식 (예: "0~100", "1000~3000")
        const [minStr, maxStr] = filters.deposit.split('~');
        
        // 최소값 처리
        let min = 0;
        if (minStr === '최소값' || minStr === '') {
          min = 0;
        } else {
          min = parseInt(minStr);
        }
        
        // 최대값 처리
        let max = 9999;
        if (maxStr === '최대값' || maxStr === '9999' || maxStr === '') {
          max = 9999;
        } else {
          max = parseInt(maxStr);
        }
        
        console.log('보증금 범위 파싱:', min, '~', max);
        
        filtered = filtered.filter(property => {
          const deposit = property.deposit || 0; // property.deposit은 이미 만원 단위
          const isInRange = deposit >= min && deposit <= max;
          console.log(`매물 ${property.id} 보증금: ${deposit}만원, 범위: ${min}~${max}만원, 포함여부: ${isInRange}`);
          console.log(`  - 매물 보증금 (만원): ${deposit}`);
          console.log(`  - 최소값 (만원): ${min}`);
          console.log(`  - 최대값 (만원): ${max}`);
          console.log(`  - 최소값 조건: ${deposit >= min}`);
          console.log(`  - 최대값 조건: ${deposit <= max}`);
          return isInRange;
        });
      } else {
        // 단일 값 형식
        const depositValue = parseInt(filters.deposit);
        console.log('보증금 단일 값:', depositValue);
        
        filtered = filtered.filter(property => {
          const deposit = property.deposit || 0;
          const isMatch = deposit === depositValue;
          console.log(`매물 ${property.id} 보증금: ${deposit}만원, 검색값: ${depositValue}만원, 일치여부: ${isMatch}`);
          return isMatch;
        });
      }
      
      console.log('보증금 필터 적용 후 매물 수:', filtered.length);
      console.log('=== 보증금 필터 디버깅 완료 ===');
    }

    // 선택된 클러스터 매물이 있으면 해당 매물들만 반환, 없으면 필터링된 전체 매물 반환
    // 모든 마커가 계속 표시되도록 수정
    return filtered;
  };

  // 정렬된 매물 목록 생성 (매물번호 순서)
  const getSortedProperties = (properties: Property[]) => {
    console.log('=== 매물 정렬 시작 ===');
    console.log('정렬 전 매물들:', properties.map(p => ({ id: p.id, title: p.title })));
    
    const sorted = [...properties].sort((a, b) => {
      // 매물번호를 숫자로 변환하여 정렬 (P001 -> 1, P002 -> 2)
      const extractNumber = (id: string) => {
        const match = id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      const aId = extractNumber(a.id);
      const bId = extractNumber(b.id);
      const result = aId - bId;
      console.log(`정렬 비교: ${a.id}(${aId}) vs ${b.id}(${bId}) = ${result}`);
      return result;
    });
    
    console.log('정렬 후 매물들:', sorted.map(p => ({ id: p.id, title: p.title })));
    console.log('=== 매물 정렬 완료 ===');
    return sorted;
  };

  const handleEditProperty = (property: Property) => {
    console.log('매물 수정:', property.id);
  };

  const handleDeleteProperty = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // 모바일 서버에서는 삭제 불가
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname.includes('vercel.app');
      
      if (!isMainServer) {
        alert('📱 모바일에서는 매물 삭제가 불가능합니다. PC에서 삭제해주세요.');
        setShowDeleteConfirm(false);
        return;
      }

      if (!propertyToDelete) return;

      console.log('🗑️ 매물 삭제 시작:', propertyToDelete.id);
      
      // Firebase + IndexedDB 동기화 삭제
      await firebaseSync.deleteProperty(propertyToDelete.id);
      
      // 로컬 상태에서도 제거
      setDefaultProperties(prevProperties => 
        prevProperties.filter(property => property.id !== propertyToDelete.id)
      );
      
      // 선택된 매물이 삭제된 경우 모달 닫기
      if (selectedPropertyForDetail?.id === propertyToDelete.id) {
        setSelectedPropertyForDetail(null);
      }
      
      // 삭제 모달 닫기
      setShowDeleteConfirm(false);
      setPropertyToDelete(null);
      
      // 성공 메시지 표시
      alert('매물이 성공적으로 삭제되었습니다. (Firebase + IndexedDB 동기화 완료) 🔥');
      
      // Firebase 상태 확인
      const status = firebaseSync.getStatus();
      console.log('🔥 Firebase 상태:', status);
      
    } catch (error) {
      console.error('❌ 매물 삭제 실패:', error);
      alert('매물 삭제 중 오류가 발생했습니다. (오프라인 상태에서는 나중에 동기화됩니다)');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPropertyToDelete(null);
  };

  const displayProperties = getFilteredProperties();
  const sortedProperties = getSortedProperties(displayProperties);
  const listProperties = selectedClusterProperties.length > 0 ? selectedClusterProperties : sortedProperties;

  console.log('=== 매물 목록 상태 ===');
  console.log('전체 매물 수:', allProperties.length);
  console.log('필터링된 매물 수:', displayProperties.length);
  console.log('정렬된 매물 수:', sortedProperties.length);
  console.log('표시될 매물 수:', listProperties.length);
  console.log('선택된 클러스터 매물 수:', selectedClusterProperties.length);
  console.log('지도에 표시될 매물들:', displayProperties.map(p => ({ id: p.id, title: p.title })));
  console.log('목록에 표시될 매물들:', listProperties.map(p => ({ id: p.id, title: p.title })));

  // 로딩 화면 비활성화
  // if (isLoading) {
  //   return (
  //     <div style={{
  //       display: 'flex',
  //       flexDirection: 'column',
  //       alignItems: 'center',
  //       justifyContent: 'center',
  //       height: '100vh',
  //       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  //       color: 'white',
  //       padding: '20px'
  //     }}>
  //       <div style={{
  //         width: '80px',
  //         height: '80px',
  //         border: '4px solid rgba(255, 255, 255, 0.3)',
  //         borderTop: '4px solid white',
  //         borderRadius: '50%',
  //         animation: 'spin 1s linear infinite',
  //         marginBottom: '20px'
  //       }} />
  //       <h2 style={{ margin: 0, fontSize: '1.5rem', textAlign: 'center' }}>데이터 로딩 중...</h2>
  //       <p style={{ margin: '10px 0 0 0', opacity: 0.8, textAlign: 'center' }}>
  //         Firebase에서 매물 정보를 불러오는 중입니다
  //       </p>
  //       <p style={{ margin: '5px 0 0 0', opacity: 0.6, fontSize: '0.875rem', textAlign: 'center' }}>
  //         잠시만 기다려주세요
  //       </p>
  //       <style>{`
  //         @keyframes spin {
  //           0% { transform: rotate(0deg); }
  //           100% { transform: rotate(360deg); }
  //         }
  //       `}</style>
  //     </div>
  //   );
  // }

  // 오류 화면 (개선된 버전)
  if (error && allProperties.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f0f0f0',
        color: '#333',
        padding: '20px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>데이터 로드 오류</h2>
        <p style={{ margin: '0 0 1.5rem 0', textAlign: 'center', maxWidth: '400px' }}>{error}</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            새로고침
          </button>
          <button 
            onClick={async () => {
              try {
                setIsLoading(true);
                setError(null);
                const IndexedDB = await import('../utils/indexedDB');
                const localProperties = await IndexedDB.getAllProperties();
                setDefaultProperties(localProperties);
                setIsLoading(false);
              } catch (err) {
                setError('로컬 데이터를 불러올 수 없습니다.');
                setIsLoading(false);
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            오프라인 모드로 전환
          </button>
        </div>
      </div>
    );
  }

  // 모바일 전용 사이트이므로 탭 전환 버튼 불필요 (지도와 목록이 동시에 보임)

  return (
    <>
      <HomeContainer>
        <MapSection show={true}>
          <GoogleMap
            ref={mapRef}
            properties={displayProperties}
            onMarkerClick={handleMarkerClick}
            onClusterClick={(clusterProperties) => {
              console.log('클러스터 클릭됨:', clusterProperties.length, '개 매물');
              setSelectedClusterProperties(clusterProperties);
            }}
          />
        </MapSection>
        
        <PropertyListSection show={true}>
          <PropertyListHeader>
            <div className="property-count">
              {selectedClusterProperties.length > 0 
                ? `선택된 매물 ${selectedClusterProperties.length}개`
                : searchTerm 
                  ? `검색 결과: ${listProperties.length}개 (전체 ${allProperties.length}개 중)`
                  : `총 ${allProperties.length}개 매물`
              }
              {!isFirebaseConnected && allProperties.length > 0 && (
                <span style={{ 
                  marginLeft: '0.5rem', 
                  fontSize: '0.7rem', 
                  color: '#f59e0b',
                  fontWeight: 600
                }}>
                  (오프라인 모드)
                </span>
              )}
            </div>
          </PropertyListHeader>
          
          <PropertyListContainer>
            {listProperties.length === 0 ? (
              <EmptyState>
                <p>검색 조건에 맞는 매물이 없습니다.</p>
              </EmptyState>
            ) : (
              listProperties.map((property, index) => (
                <PCPropertyCard
                  key={`${property.id}-${index}`}
                  onClick={() => handlePropertyCardClick(property)}
                >
                  <PropertyImageSection>
                    {property.images && property.images.length > 0 ? (
                      <img 
                        src={property.images[0]} 
                        alt={`${property.title} 대표사진`}
                        onLoadStart={() => {
                          console.log('🔄 이미지 로드 시작:', {
                            propertyId: property.id,
                            src: property.images[0]?.substring(0, 50) + '...',
                            isBase64: property.images[0]?.startsWith('data:'),
                            base64Length: property.images[0]?.length
                          });
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error('❌ 이미지 로드 실패:', {
                            src: target.src,
                            propertyId: property.id,
                            propertyTitle: property.title,
                            images: property.images
                          });
                          target.style.display = 'none';
                          // 이미지 로드 실패 시 기본 아이콘 표시
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '🏠';
                            parent.style.fontSize = '1.5rem';
                            parent.style.color = '#9ca3af';
                            parent.style.display = 'flex';
                            parent.style.alignItems = 'center';
                            parent.style.justifyContent = 'center';
                          }
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.log('✅ 매물목록 이미지 로드 성공:', {
                            src: target.src,
                            propertyId: property.id,
                            propertyTitle: property.title
                          });
                          target.style.display = 'block';
                          target.style.opacity = '1';
                        }}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '6px',
                          minHeight: '80px',
                          display: 'block',
                          backgroundColor: '#f3f4f6',
                          opacity: '0',
                          transition: 'opacity 0.3s ease'
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '1.5rem',
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        minHeight: '80px'
                      }}>
                        🏠
                      </div>
                    )}
                  </PropertyImageSection>
                  <PropertyInfoSection>
                    <PropertyHeader>
                      <PropertyNumber 
                        style={{
                          color: searchTerm && property.id.toLowerCase().includes(searchTerm.toLowerCase()) 
                            ? '#dc2626' 
                            : '#dc2626',
                          fontWeight: searchTerm && property.id.toLowerCase() === searchTerm.toLowerCase() 
                            ? 'bold' 
                            : 'bold',
                          backgroundColor: searchTerm && property.id.toLowerCase() === searchTerm.toLowerCase() 
                            ? '#fef2f2' 
                            : 'transparent',
                          padding: searchTerm && property.id.toLowerCase() === searchTerm.toLowerCase() 
                            ? '2px 6px' 
                            : '0',
                          borderRadius: searchTerm && property.id.toLowerCase() === searchTerm.toLowerCase() 
                            ? '4px' 
                            : '0'
                        }}
                      >
                        {property.id}
                      </PropertyNumber>
                      <PropertyAddress>{maskAddress(property.address)}</PropertyAddress>
                    </PropertyHeader>
                    <PCPropertyTitle>{cleanPropertyTitle(property.title)}</PCPropertyTitle>
                    <PCPropertyDetails>
                       <div style={{ marginBottom: '0.25rem' }}>
                         <span style={{ 
                           display: 'inline-block', 
                           padding: '2px 6px', 
                           backgroundColor: '#f8fafc', 
                           borderRadius: '3px',
                           border: 'none',
                           fontSize: '12px',
                           color: '#374151',
                           marginRight: '4px'
                         }}>
                           전용 {Math.round((property.dedicatedArea || property.area) / 3.3058)}평
                         </span>
                         {property.type === 'sale' ? '매매' : '임대'} {property.floor}
                       </div>
                       <div>
                         주차 {property.parking ? '가능' : '불가능'} 엘리베이터 {property.elevator ? '유' : '무'}
                       </div>
                     </PCPropertyDetails>
                     <PriceContainer>
                       {property.type === 'sale' ? (
                         <SalePriceButton>매매 {property.price}억원</SalePriceButton>
                       ) : (
                         <>
                           {property.deposit && property.deposit > 0 && (
                             <RentPriceButton>보증금 {property.deposit}만원</RentPriceButton>
                           )}
                           {property.deposit && property.deposit > 0 && (property.rentPrice || 0) > 0 && (
                             <RentPriceButton>임대료 {property.rentPrice}만원</RentPriceButton>
                           )}
                           {(!property.deposit || property.deposit === 0) && (!property.rentPrice || property.rentPrice === 0) && (
                             <RentPriceButton>가격 정보 없음</RentPriceButton>
                           )}
                         </>
                       )}
                     </PriceContainer>
                  </PropertyInfoSection>
                </PCPropertyCard>
              ))
            )}
          </PropertyListContainer>
        </PropertyListSection>
      </HomeContainer>

      {selectedPropertyForDetail && (
        <PropertyDetailModal
          property={selectedPropertyForDetail}
          onClose={handleCloseDetailModal}
          onPropertyUpdate={handlePropertyUpdate}
          isAdmin={isAdmin}
          onPropertyDelete={async (propertyId) => {
            console.log('🗑️ PropertyDetailModal에서 매물 삭제 요청:', propertyId);
            
            try {
              // 실제 삭제 로직 호출
              console.log('🔄 firebaseSync.deleteProperty 호출 시작...');
              await firebaseSync.deleteProperty(propertyId);
              console.log('✅ firebaseSync.deleteProperty 완료');
              
              // 로컬 상태에서 즉시 제거 (UI 즉시 반영)
              // 대소문자 구분 없이 비교
              const normalizedId = propertyId.toUpperCase();
              setDefaultProperties(prevProperties => {
                const filtered = prevProperties.filter(property => {
                  const propId = property.id.toUpperCase();
                  return propId !== normalizedId && property.id !== propertyId;
                });
                console.log('🔄 로컬 상태 업데이트:', {
                  이전개수: prevProperties.length,
                  삭제후개수: filtered.length,
                  삭제된ID: propertyId,
                  필터링된매물ID: filtered.map(p => p.id)
                });
                return filtered;
              });
              
              // 선택된 매물이 삭제된 경우 모달 닫기
              if (selectedPropertyForDetail?.id?.toLowerCase() === propertyId.toLowerCase()) {
                setSelectedPropertyForDetail(null);
                console.log('✅ 삭제된 매물 모달 닫기');
              }
              
              // 클러스터 선택된 매물 목록에서도 제거
              setSelectedClusterProperties(prev => 
                prev.filter(property => property.id.toLowerCase() !== propertyId.toLowerCase())
              );
              
              // IndexedDB에서도 확인하여 삭제
              try {
                await IndexedDB.deleteProperty(propertyId);
                console.log('✅ IndexedDB에서도 삭제 확인 완료');
              } catch (indexedDBError) {
                console.warn('⚠️ IndexedDB 삭제 확인 실패 (무시 가능):', indexedDBError);
              }
              
              console.log('✅ 매물 삭제 완료:', propertyId);
              alert('매물이 성공적으로 삭제되었습니다!');
              
            } catch (error) {
              console.error('❌ 매물 삭제 실패:', error);
              console.error('❌ 삭제 실패 상세:', {
                propertyId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
              });
              alert('매물 삭제 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
            }
          }}
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