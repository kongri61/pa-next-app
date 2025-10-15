import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import HomePage, { HomePageRef } from './pages/HomePage';
import GlobalStyle from './styles/GlobalStyle';
import { Property } from './types';
import { initHybridDataManager } from './utils/hybridDataManager';
import { FirebaseProvider } from './contexts/FirebaseContext';
import FirebaseDebugger from './components/FirebaseDebugger';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  margin-top: 0; // 헤더 여백 제거

  @media (max-width: 768px) {
    margin-top: 0; // 모바일에서도 헤더 여백 제거
  }
`;

function App() {
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
  const [isDataManagerInitialized, setIsDataManagerInitialized] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const homePageRef = useRef<HomePageRef>(null);

  // 하이브리드 데이터 관리자 초기화
  useEffect(() => {
    const initializeDataManager = async () => {
      try {
        await initHybridDataManager();
        setIsDataManagerInitialized(true);
        console.log('하이브리드 데이터 관리자 초기화 완료');
      } catch (error) {
        console.error('하이브리드 데이터 관리자 초기화 실패:', error);
        // 초기화 실패해도 앱은 계속 실행
        setIsDataManagerInitialized(true);
      }
    };

    initializeDataManager();
  }, []);

  // 매물 추가 처리 함수 (검색 결과 업데이트용)
  const handlePropertyAdded = (newProperties: Property[]) => {
    console.log('새로운 매물이 추가되었습니다:', newProperties);
    setNewProperties(newProperties);
  };

  // 지도 리셋 함수
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
        />
        <MainContent>
          {isDataManagerInitialized ? (
            <HomePage 
              ref={homePageRef}
              searchTerm={searchTerm}
              addressSearch={addressSearch}
              propertyNumberSearch={propertyNumberSearch}
              filters={filters}
              onPropertyAdded={handlePropertyAdded}
              newProperties={newProperties}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh',
              fontSize: '1.2rem',
              color: '#666'
            }}>
              데이터베이스 초기화 중...
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
    </FirebaseProvider>
  );
}

export default App; 