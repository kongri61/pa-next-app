import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AddPropertyModal from './components/AddPropertyModal';
import LoginModal from './components/LoginModal';
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    propertyType: '',
    area: '',
    price: '',
    deposit: ''
  });
  const [newProperties, setNewProperties] = useState<Property[]>([]);

  // 로그인 상태 확인
  useEffect(() => {
    const loginStatus = localStorage.getItem('is_logged_in');
    const userRole = localStorage.getItem('user_role');
    
    if (loginStatus === 'true') {
      setIsLoggedIn(true);
      setIsAdmin(userRole === 'admin');
    }
  }, []);

  // 매물 추가 처리 함수
  const handlePropertyAdded = (newProperties: Property[]) => {
    console.log('새로운 매물이 추가되었습니다:', newProperties);
    setNewProperties(newProperties);
  };

  // 로그인 처리 함수
  const handleLogin = (adminStatus: boolean) => {
    setIsLoggedIn(true);
    setIsAdmin(adminStatus);
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('user_role');
    setIsLoggedIn(false);
    setIsAdmin(false);
    // 로그인 모달 상태 초기화
    setIsLoginModalOpen(false);
  };

  // 관리자 권한 확인 (로그인 상태 기반)
  const checkAdminStatus = () => {
    return isLoggedIn && isAdmin;
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
          isAdmin={checkAdminStatus()}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogoutClick={handleLogout}
        />
        <MainContent>
          <HomePage 
            searchTerm={searchTerm}
            addressSearch={addressSearch}
            filters={filters}
            onPropertyAdded={handlePropertyAdded}
            isAdmin={checkAdminStatus()}
            newProperties={newProperties}
          />
        </MainContent>
      </AppContainer>
      
      {isAddPropertyModalOpen && (
        <AddPropertyModal 
          onClose={() => setIsAddPropertyModalOpen(false)}
          onPropertyAdded={handlePropertyAdded}
        />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </>
  );
}

export default App; 