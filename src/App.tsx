import React, { useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AddPropertyModal from './components/AddPropertyModal';
import GlobalStyle from './styles/GlobalStyle';
import { Property } from './types';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
`;

function App() {
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    propertyType: '',
    area: '',
    price: '',
    deposit: ''
  });

  // 매물 추가 처리 함수
  const handlePropertyAdded = (newProperties: Property[]) => {
    console.log('새로운 매물이 추가되었습니다:', newProperties);
    // 여기서 실제로 매물을 저장하거나 상태를 업데이트할 수 있습니다
    // 현재는 콘솔에만 출력
  };

  // 관리자 권한 확인 (배포 환경에 맞게 수정)
  const isAdmin = () => {
    // 방법 1: 환경 변수 기반 (빌드 시 설정)
    const envAdmin = process.env.REACT_APP_ADMIN_MODE === 'true';
    
    // 방법 2: URL 파라미터로 관리자 모드 활성화 (임시)
    const urlParams = new URLSearchParams(window.location.search);
    const adminMode = urlParams.get('admin');
    
    // 방법 3: 로컬 스토리지 기반 (개발자 도구에서 설정 가능)
    const localStorageAdmin = localStorage.getItem('admin_mode') === 'true';
    
    // 방법 4: 특정 도메인에서만 관리자 권한 부여
    const allowedDomains = ['localhost', '127.0.0.1'];
    const currentDomain = window.location.hostname;
    
    // 방법 5: 특정 IP에서만 관리자 권한 부여 (클라이언트에서는 제한적)
    const allowedIPs = ['127.0.0.1', 'localhost'];
    const currentIP = window.location.hostname;
    
    return envAdmin || 
           adminMode === 'true' || 
           localStorageAdmin ||
           allowedDomains.includes(currentDomain) ||
           allowedIPs.includes(currentIP);
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Header 
          onAddProperty={() => setIsAddPropertyModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          addressSearch={addressSearch}
          onAddressSearchChange={setAddressSearch}
          filters={filters}
          onFilterChange={setFilters}
          isAdmin={isAdmin()}
        />
        <MainContent>
          <HomePage 
            searchTerm={searchTerm}
            addressSearch={addressSearch}
            filters={filters}
            onPropertyAdded={handlePropertyAdded}
          />
        </MainContent>
      </AppContainer>
      
      {isAddPropertyModalOpen && (
        <AddPropertyModal 
          onClose={() => setIsAddPropertyModalOpen(false)}
        />
      )}
    </>
  );
}

export default App; 