import React, { useState } from 'react';
import styled from 'styled-components';
import { addTestProperty, addTestRentProperty, getProperties, addImagesToExistingProperties, forceRefreshFirebaseData, addImagesToSpecificProperties } from '../firebase/propertyService';
import { useFirebase } from '../contexts/FirebaseContext';

const DebugContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: #1f2937;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.875rem;
  max-width: 400px;
  z-index: 9999;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    top: 5px;
    right: 5px;
    left: 5px;
    max-width: none;
    font-size: 0.75rem;
    padding: 0.75rem;
  }
`;

const DebugTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #10b981;
  font-size: 1rem;
`;

const DebugButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.7rem;
    margin: 0.2rem;
    min-height: 44px; /* 모바일 터치 최소 크기 */
  }
`;

const DebugLog = styled.div`
  background: #111827;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  font-size: 0.75rem;
  white-space: pre-wrap;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    color: white;
  }
`;

interface FirebaseDebuggerProps {
  onClose: () => void;
}

const FirebaseDebugger: React.FC<FirebaseDebuggerProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { user } = useFirebase();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testAddProperty = async () => {
    if (!user) {
      addLog('❌ 사용자가 로그인되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    addLog('🧪 매매용 테스트 매물 추가 시작...');
    
    try {
      const propertyId = await addTestProperty();
      addLog(`✅ 매매용 테스트 매물 추가 성공! ID: ${propertyId}`);
    } catch (error: any) {
      addLog(`❌ 매매용 테스트 매물 추가 실패: ${error.message}`);
      addLog(`   오류 코드: ${error.code || 'N/A'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAddRentProperty = async () => {
    if (!user) {
      addLog('❌ 사용자가 로그인되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    addLog('🏠 임대용 테스트 매물 추가 시작...');
    
    try {
      const propertyId = await addTestRentProperty();
      addLog(`✅ 임대용 테스트 매물 추가 성공! ID: ${propertyId}`);
      addLog('🔄 페이지를 새로고침하여 변경사항을 확인하세요.');
    } catch (error: any) {
      addLog(`❌ 임대용 테스트 매물 추가 실패: ${error.message}`);
      addLog(`   오류 코드: ${error.code || 'N/A'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPage = () => {
    addLog('🔄 페이지 새로고침 중...');
    window.location.reload();
  };

  const testGetProperties = async () => {
    setIsLoading(true);
    addLog('📋 매물 목록 조회 시작...');
    
    try {
      const { properties } = await getProperties();
      addLog(`✅ 매물 목록 조회 성공! 총 ${properties.length}개`);
      
      if (properties.length > 0) {
        properties.forEach((property, index) => {
          addLog(`   매물 ${index + 1}: ${property.title}`);
          addLog(`     - 타입: ${property.type}`);
          addLog(`     - 가격: ${property.price}`);
          addLog(`     - 보증금: ${property.deposit || '없음'}`);
          addLog(`     - 이미지: ${property.images?.length || 0}개`);
          if (property.type === 'rent') {
            addLog(`     - 보증금 포맷: ${formatPrice(property.deposit || 0)}`);
            addLog(`     - 월세 포맷: ${formatPrice(property.price)}`);
          }
        });
      } else {
        addLog('   저장된 매물이 없습니다.');
      }
    } catch (error: any) {
      addLog(`❌ 매물 목록 조회 실패: ${error.message}`);
      addLog(`   오류 코드: ${error.code || 'N/A'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addImagesToProperties = async () => {
    if (!user) {
      addLog('❌ 사용자가 로그인되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    addLog('🖼️ 기존 매물에 이미지 추가 시작...');
    
    try {
      await addImagesToExistingProperties();
      addLog('✅ 기존 매물에 이미지 추가 성공!');
      addLog('🔄 페이지를 새로고침하여 변경사항을 확인하세요.');
    } catch (error: any) {
      addLog(`❌ 이미지 추가 실패: ${error.message}`);
      addLog(`   오류 코드: ${error.code || 'N/A'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefreshData = async () => {
    setIsLoading(true);
    addLog('🔄 Firebase 데이터 강제 새로고침 시작...');
    
    try {
      const { properties } = await forceRefreshFirebaseData();
      addLog(`✅ 강제 새로고침 성공! 총 ${properties.length}개 매물`);
      
      if (properties.length > 0) {
        properties.forEach((property, index) => {
          addLog(`   매물 ${index + 1}: ${property.title}`);
          addLog(`     - 타입: ${property.type}`);
          addLog(`     - 이미지: ${property.images?.length || 0}개`);
          if (property.images && property.images.length > 0) {
            addLog(`     - 이미지 URL: ${property.images[0]}`);
          }
        });
      } else {
        addLog('   저장된 매물이 없습니다.');
      }
      
      addLog('🔄 페이지를 새로고침하여 변경사항을 확인하세요.');
    } catch (error: any) {
      addLog(`❌ 강제 새로고침 실패: ${error.message}`);
      addLog(`   오류 코드: ${error.code || 'N/A'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addImagesToSpecific = async () => {
    if (!user) {
      addLog('❌ 사용자가 로그인되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    addLog('🖼️ 2,3번 매물에 이미지 추가 시작...');
    addLog(`📱 모바일 환경: ${window.innerWidth <= 768 ? 'YES' : 'NO'}`);
    
    try {
      await addImagesToSpecificProperties();
      addLog('✅ 2,3번 매물에 이미지 추가 성공!');
      
      // 모바일에서 localStorage 강제 새로고침
      if (window.innerWidth <= 768) {
        addLog('📱 모바일용 localStorage 새로고침...');
        localStorage.removeItem('properties_cache');
        localStorage.removeItem('last_sync_time');
        addLog('✅ 모바일 캐시 삭제 완료');
      }
      
      addLog('🔄 페이지를 새로고침하여 변경사항을 확인하세요.');
    } catch (error: any) {
      addLog(`❌ 이미지 추가 실패: ${error.message}`);
      addLog(`   오류 코드: ${error.code || 'N/A'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      const eok = Math.floor(price / 100000000);
      const man = Math.floor((price % 100000000) / 10000);
      if (man > 0) {
        return `${eok}억 ${man}만원`;
      }
      return `${eok}억원`;
    } else if (price >= 10000) {
      return `${Math.floor(price / 10000)}만원`;
    } else if (price > 0) {
      return `${price.toLocaleString()}원`;
    }
    return '가격 정보 없음';
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <DebugContainer>
      <CloseButton onClick={onClose}>×</CloseButton>
      <DebugTitle>🔧 Firebase 디버거</DebugTitle>
      
      <div>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem' }}>
          사용자: {user ? `✅ ${user.email}` : '❌ 로그인 필요'}
        </div>
        
        <DebugButton 
          onClick={testAddProperty} 
          disabled={isLoading || !user}
        >
          🧪 매매용 테스트 매물
        </DebugButton>
        
        <DebugButton 
          onClick={testAddRentProperty} 
          disabled={isLoading || !user}
        >
          🏠 임대용 테스트 매물
        </DebugButton>
        
        <DebugButton 
          onClick={testGetProperties} 
          disabled={isLoading}
        >
          📋 매물 목록 조회
        </DebugButton>
        
        <DebugButton 
          onClick={clearLogs} 
          disabled={isLoading}
        >
          🗑️ 로그 지우기
        </DebugButton>
        
        <DebugButton 
          onClick={addImagesToProperties} 
          disabled={isLoading || !user}
        >
          🖼️ 기존 매물에 이미지 추가
        </DebugButton>
        
        <DebugButton 
          onClick={addImagesToSpecific} 
          disabled={isLoading || !user}
        >
          🖼️ 2,3번 매물에 이미지 추가
        </DebugButton>
        
        <DebugButton 
          onClick={forceRefreshData} 
          disabled={isLoading}
        >
          🔄 Firebase 데이터 강제 새로고침
        </DebugButton>
        
        <DebugButton 
          onClick={refreshPage} 
          disabled={isLoading}
        >
          🔄 페이지 새로고침
        </DebugButton>
      </div>

      {logs.length > 0 && (
        <DebugLog>
          {logs.join('\n')}
        </DebugLog>
      )}
    </DebugContainer>
  );
};

export default FirebaseDebugger;
