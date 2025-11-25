import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import HomePage, { HomePageRef } from './pages/HomePage';
import AddPropertyModal from './components/AddPropertyModal';
import GlobalStyle from './styles/GlobalStyle';
import { Property } from './types';
import { initHybridDataManager } from './utils/hybridDataManager';
import { FirebaseProvider } from './contexts/FirebaseContext';
import FirebaseDebugger from './components/FirebaseDebugger';
import { getAllProperties } from './utils/indexedDB'; // 정적 import로 변경
import './utils/addSampleData'; // 샘플 데이터 추가 함수 로드

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  margin-top: 0; /* 모바일 전용: 헤더 여백 제거 */
  width: 100%;
  max-width: 100%;
  overflow-x: hidden; /* 가로 스크롤 방지 */
`;

interface AppProps {
  initialProperties?: Property[];
}

function App({ initialProperties = [] }: AppProps) {
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isBulkPropertyModalOpen, setIsBulkPropertyModalOpen] = useState(false); // 대량매물등록 모달 상태 추가
  const [isAdmin] = useState(true); // 로그인 기능 제거, 항상 관리자 권한
  const [searchTerm, setSearchTerm] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [propertyNumberSearch, setPropertyNumberSearch] = useState(''); // 매물번호 검색 상태 추가
  const [filters, setFilters] = useState({
    type: '',
    propertyType: '',
    area: '',
    price: '',
    deposit: ''
  });
  const [newProperties, setNewProperties] = useState<Property[]>([]);
  const [isDataManagerInitialized, setIsDataManagerInitialized] = useState(true); // 즉시 true로 설정
  const [showDebugger, setShowDebugger] = useState(false);
  const [preloadedProperties, setPreloadedProperties] = useState<Property[]>(initialProperties); // 초기 데이터로 즉시 설정
  const homePageRef = useRef<HomePageRef>(null);

  // 로그인 기능 제거됨 - 항상 관리자 권한

  // ⚡ 초기 데이터가 있으면 즉시 사용, 없으면 백그라운드에서 로드
  useEffect(() => {
    // 초기 데이터가 이미 있으면 즉시 사용 (index.tsx에서 로드됨)
    if (initialProperties.length > 0) {
      console.log(`⚡ 초기 데이터 즉시 사용: ${initialProperties.length}개 매물`);
      // 즉시 상태 업데이트 (동기적으로)
      setPreloadedProperties(initialProperties);
      setIsDataManagerInitialized(true);
    } else if (preloadedProperties.length === 0) {
      // 초기 데이터가 없고 preloadedProperties도 비어있으면 백그라운드에서 로드
      console.log('⏳ 초기 데이터 없음 - 백그라운드에서 로드 시작...');
      const loadDataAsync = async () => {
        try {
          const loadStartTime = performance.now();
          const properties = await getAllProperties();
          const loadTime = performance.now() - loadStartTime;
          console.log(`✅ IndexedDB에서 ${properties.length}개 매물 로드 완료 (${loadTime.toFixed(2)}ms)`);
          setPreloadedProperties(properties);
        } catch (error) {
          console.error('❌ 데이터 로드 실패:', error);
        }
      };
      loadDataAsync();
    }
    
    // 하이브리드 데이터 관리자 초기화는 백그라운드에서 처리 (블로킹 없음)
    setTimeout(async () => {
      try {
        const hybridStartTime = performance.now();
        await initHybridDataManager();
        const hybridTime = performance.now() - hybridStartTime;
        console.log(`✅ 하이브리드 데이터 관리자 초기화 완료 (${hybridTime.toFixed(2)}ms)`);
      } catch (error) {
        console.warn('⚠️ 하이브리드 데이터 관리자 초기화 실패 (무시):', error);
      }
    }, 0);
  }, [initialProperties, preloadedProperties.length]);

  // 매물 추가 처리 함수
  const handlePropertyAdded = async (newProperties: Property[]) => {
    console.log('새로운 매물이 추가되었습니다:', newProperties);
    console.log('등록된 매물 수:', newProperties.length);
    
    try {
      // Firebase 동기화를 위해 각 매물을 개별적으로 처리
      const { firebaseSync } = await import('./utils/firebaseSync');
      
      let successCount = 0;
      let failCount = 0;
      const failedProperties: Property[] = [];
      
      // 매물 ID는 AddPropertyModal에서 이미 생성되었으므로 그대로 사용
      const uniqueProperties = newProperties.map((property, index) => {
        console.log(`🚀 매물 ${index + 1} 자동 처리:`, {
          id: property.id,
          title: property.title,
          reason: '자동 등록 시스템 v2.0',
          timestamp: new Date().toISOString()
        });
        
        // ID는 이미 생성되었으므로 그대로 사용, 생성 시간만 업데이트
        const newProperty = {
          ...property,
          createdAt: new Date()
        };
        
        return newProperty;
      });
      
      console.log('🔍 고유 ID로 수정된 매물들:', uniqueProperties.map(p => ({ id: p.id, title: p.title })));
      
      // 각 매물을 순차적으로 처리하되, 실패해도 다음 매물은 계속 처리
      for (let i = 0; i < uniqueProperties.length; i++) {
        const property = uniqueProperties[i];
        try {
          console.log(`\n=== 매물 ${i + 1}/${uniqueProperties.length} 처리 시작 ===`);
          console.log(`매물 정보:`, {
            id: property.id,
            title: property.title,
            address: property.address,
            type: property.type,
            propertyType: property.propertyType,
            createdAt: property.createdAt
          });
          
          // P001 특별 디버깅
          if (property.id === 'P001') {
            console.log('🔍 App.tsx P001 특별 디버깅 시작');
            console.log('P001 매물 전체 데이터:', JSON.stringify(property, null, 2));
            console.log('P001 처리 순서:', i + 1);
            console.log('P001 Firebase 동기화 호출 전');
          }
          
          console.log(`매물 ${i + 1}/${uniqueProperties.length} Firebase 동기화 시작:`, property.id, property.title);
          await firebaseSync.updateProperty(property);
          
          // P001 특별 디버깅 - 성공 후
          if (property.id === 'P001') {
            console.log('🔍 App.tsx P001 Firebase 동기화 성공 확인');
          }
          successCount++;
          console.log(`✅ 매물 ${i + 1} Firebase 동기화 완료:`, property.id);
          console.log(`=== 매물 ${i + 1}/${uniqueProperties.length} 처리 완료 ===\n`);
          
          // Firebase 동기화 간격 추가 (동시 쓰기 제한 방지)
          if (i < uniqueProperties.length - 1) {
            console.log('⏳ 다음 매물 처리 전 대기 중...');
            await new Promise(resolve => setTimeout(resolve, 500)); // 200ms에서 500ms로 증가
          }
        } catch (error) {
          failCount++;
          failedProperties.push(property);
          console.error(`❌ 매물 ${i + 1} Firebase 동기화 실패:`, property.id, error);
          
          // P001 특별 디버깅 - 실패 시
          if (property.id === 'P001') {
            console.log('🔍 App.tsx P001 Firebase 동기화 실패 디버깅');
            console.log('P001 오류 상세:', error);
            console.log('P001 오류 스택:', (error as Error).stack);
          }
          
          console.log(`=== 매물 ${i + 1}/${uniqueProperties.length} 처리 실패 ===\n`);
        }
      }
      
      // 로컬 상태 업데이트는 하지 않음 (Firebase 실시간 업데이트에서 처리)
      // setNewProperties(uniqueProperties); // 중복 방지를 위해 주석 처리
      
      // 결과 메시지 표시
      if (successCount === uniqueProperties.length) {
        console.log('✅ 모든 매물이 Firebase에 동기화되었습니다');
        alert(`✅ 모든 ${uniqueProperties.length}개 매물이 성공적으로 등록되었습니다!`);
      } else if (successCount > 0) {
        console.log(`⚠️ ${successCount}개 매물은 성공, ${failCount}개 매물은 실패`);
        alert(`⚠️ ${successCount}개 매물은 등록되었지만, ${failCount}개 매물의 Firebase 동기화에 실패했습니다.\n오프라인 모드로 작동하며, 나중에 자동으로 동기화됩니다.`);
      } else {
        console.log('❌ 모든 매물 Firebase 동기화 실패');
        alert('❌ 모든 매물의 Firebase 동기화에 실패했습니다.\n오프라인 모드로 작동하며, 나중에 자동으로 동기화됩니다.');
      }
      
    } catch (error) {
      console.error('❌ 매물 Firebase 동기화 전체 실패:', error);
      // Firebase 실패해도 로컬 상태는 업데이트
      setNewProperties(newProperties);
      alert('매물이 등록되었지만 Firebase 동기화에 실패했습니다. 오프라인 모드로 작동합니다.');
    }
  };

  // 로그인 기능 제거됨 - 항상 관리자 권한

  // 지도 초기화 함수
  const handleMapReset = () => {
    if (homePageRef.current) {
      homePageRef.current.resetMap();
    }
  };

  const handleRefresh = () => {
    console.log('App - handleRefresh 호출됨');
    window.location.reload();
  };

  // 개발 환경에서만 디버거 표시
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <FirebaseProvider>
      <GlobalStyle />
      <AppContainer>
        <Header 
          onAddProperty={() => setIsAddPropertyModalOpen(true)}
          onBulkPropertyUpload={() => setIsBulkPropertyModalOpen(true)} // 대량매물등록 핸들러 추가
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          addressSearch={addressSearch}
          onAddressSearchChange={setAddressSearch}
          propertyNumberSearch={propertyNumberSearch}
          onPropertyNumberSearch={setPropertyNumberSearch}
          filters={filters}
          onFilterChange={setFilters}
          onMapReset={handleMapReset}
          onRefresh={handleRefresh}
          isAdmin={isAdmin}
        />
        <MainContent>
          {/* 데이터 로딩 완료 후 렌더링 (빠른 표시 보장) */}
          {isDataManagerInitialized ? (
            <HomePage 
              ref={homePageRef}
              searchTerm={searchTerm}
              addressSearch={addressSearch}
              propertyNumberSearch={propertyNumberSearch}
              filters={filters}
              onFilterChange={setFilters}
              onSearchChange={setSearchTerm} // 검색어 변경 핸들러 추가
              onPropertyAdded={handlePropertyAdded}
              isAdmin={isAdmin}
              newProperties={newProperties}
              preloadedProperties={preloadedProperties} // 미리 로드된 데이터 전달
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh',
              fontSize: '1rem',
              color: '#666'
            }}>
              로딩 중...
            </div>
          )}
        </MainContent>
        
        {/* 개발 환경에서만 디버거 표시 */}
        {isDevelopment && (
          <>
            {!showDebugger && (
              <button
                onClick={() => setShowDebugger(true)}
                style={{
                  position: 'fixed',
                  top: '10px',
                  right: '10px',
                  background: '#1f2937',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  zIndex: 9998
                }}
              >
                🔧 Debug
              </button>
            )}
            {showDebugger && (
              <FirebaseDebugger onClose={() => setShowDebugger(false)} />
            )}
          </>
        )}
      </AppContainer>
      
      {isAddPropertyModalOpen && (
        <AddPropertyModal 
          onClose={() => setIsAddPropertyModalOpen(false)}
          onPropertyAdded={handlePropertyAdded}
        />
      )}

      {isBulkPropertyModalOpen && (
        <AddPropertyModal 
          onClose={() => setIsBulkPropertyModalOpen(false)}
          onPropertyAdded={handlePropertyAdded}
        />
      )}

    </FirebaseProvider>
  );
}

export default App;