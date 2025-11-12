import React, { useState } from 'react';
import styled from 'styled-components';
import { addTestProperty, addTestRentProperty, getProperties, deleteAllProperties, deleteTestProperties } from '../firebase/propertyService';
import * as IndexedDB from '../utils/indexedDB';
import { firebaseSync } from '../utils/firebaseSync';

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
`;

const DangerButton = styled(DebugButton)`
  background: #ef4444;

  &:hover {
    background: #dc2626;
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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testAddProperty = async () => {
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

  const handleDeleteTestProperties = async () => {
    const confirmed = window.confirm(
      '테스트 매물만 삭제합니다.\n\n제목에 "테스트"가 포함된 매물들이 삭제됩니다.\n실제 등록된 매물은 유지됩니다.\n\n계속하시겠습니까?'
    );

    if (!confirmed) {
      addLog('❌ 삭제가 취소되었습니다.');
      return;
    }

    setIsLoading(true);
    addLog('🗑️ 테스트 매물 삭제 시작...');
    
    try {
      const deletedCount = await deleteTestProperties();
      if (deletedCount > 0) {
        addLog(`✅ 테스트 매물 삭제 완료! 총 ${deletedCount}개 삭제됨`);
        addLog('🔄 페이지를 새로고침하여 변경사항을 확인하세요.');
        
        // 2초 후 자동 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        addLog('ℹ️ 삭제할 테스트 매물이 없습니다.');
      }
    } catch (error: any) {
      addLog(`❌ 테스트 매물 삭제 실패: ${error.message}`);
      addLog(`   오류 코드: ${error.code || 'N/A'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllProperties = async () => {
    const confirmed = window.confirm(
      '⚠️ 경고: 모든 매물이 삭제됩니다!\n\n이 작업은 되돌릴 수 없습니다. 정말로 모든 매물을 삭제하시겠습니까?'
    );

    if (!confirmed) {
      addLog('❌ 삭제가 취소되었습니다.');
      return;
    }

    setIsLoading(true);
    addLog('🗑️ 모든 매물 삭제 시작...');
    
    try {
      const deletedCount = await deleteAllProperties();
      addLog(`✅ 모든 매물 삭제 완료! 총 ${deletedCount}개 삭제됨`);
      addLog('🔄 페이지를 새로고침하여 변경사항을 확인하세요.');
      
      // 2초 후 자동 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      addLog(`❌ 모든 매물 삭제 실패: ${error.message}`);
      addLog(`   오류 코드: ${error.code || 'N/A'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanIndexedDB = async () => {
    setIsLoading(true);
    addLog('🧹 IndexedDB 정리 시작...');
    
    try {
      // 1. Firebase에서 현재 매물 목록 가져오기
      const { properties: firebaseProperties } = await getProperties();
      const firebaseIds = new Set(firebaseProperties.map(p => p.id));
      addLog(`🔥 Firebase 매물 수: ${firebaseProperties.length}개`);
      addLog(`📋 Firebase 매물 ID: ${Array.from(firebaseIds).join(', ') || '(없음)'}`);
      
      // 2. IndexedDB에서 모든 매물 가져오기
      const allIndexedDBProperties = await IndexedDB.getAllProperties();
      addLog(`📱 IndexedDB 매물 수: ${allIndexedDBProperties.length}개`);
      addLog(`📋 IndexedDB 매물 ID: ${allIndexedDBProperties.map(p => p.id).join(', ')}`);
      
      // 3. Firebase에 없는 매물 찾기
      const toDelete = allIndexedDBProperties.filter(p => !firebaseIds.has(p.id));
      
      if (toDelete.length === 0) {
        addLog('✅ IndexedDB에 정리할 매물이 없습니다.');
      } else {
        addLog(`🗑️ 삭제할 매물 ${toDelete.length}개: ${toDelete.map(p => p.id).join(', ')}`);
        
        // 4. 삭제 실행 (여러 번 시도)
        let successCount = 0;
        let failCount = 0;
        
        for (const property of toDelete) {
          try {
            await IndexedDB.deleteProperty(property.id);
            addLog(`  ✅ 삭제 완료: ${property.id} - ${property.title}`);
            successCount++;
          } catch (error: any) {
            addLog(`  ❌ 삭제 실패: ${property.id} - ${error.message}`);
            failCount++;
          }
        }
        
        // 5. 삭제 후 재확인 및 재시도
        const afterDelete = await IndexedDB.getAllProperties();
        const stillExists = afterDelete.filter(p => !firebaseIds.has(p.id));
        
        if (stillExists.length > 0) {
          addLog(`⚠️ 여전히 ${stillExists.length}개 매물이 남아있음 - 재시도...`);
          for (const property of stillExists) {
            try {
              await IndexedDB.deleteProperty(property.id);
              addLog(`  ✅ 재시도 삭제 완료: ${property.id}`);
              successCount++;
            } catch (error: any) {
              addLog(`  ❌ 재시도 삭제 실패: ${property.id} - ${error.message}`);
              failCount++;
            }
          }
        }
        
        addLog(`✅ IndexedDB 정리 완료! 성공: ${successCount}개, 실패: ${failCount}개`);
      }
      
      // 6. 최종 확인 (간단히)
      const finalProperties = await IndexedDB.getAllProperties();
      addLog(`📱 최종 IndexedDB 매물 수: ${finalProperties.length}개`);
      
      if (finalProperties.length > firebaseProperties.length) {
        addLog('⚠️ IndexedDB에 여전히 불필요한 매물이 있습니다.');
        addLog('💡 IndexedDB 완전 초기화를 시도하세요.');
      } else {
        addLog('✅ IndexedDB 정리 완료!');
      }
      
      addLog('🔄 페이지를 새로고침합니다...');
      
      // 즉시 새로고침 (대기 시간 제거)
      window.location.reload();
    } catch (error: any) {
      addLog(`❌ IndexedDB 정리 실패: ${error.message}`);
      addLog(`   스택: ${error.stack}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearIndexedDB = async () => {
    const confirmed = window.confirm(
      '⚠️ 경고: IndexedDB를 완전히 초기화합니다!\n\n모든 로컬 데이터가 삭제됩니다.\n\n계속하시겠습니까?'
    );

    if (!confirmed) {
      addLog('❌ 초기화가 취소되었습니다.');
      return;
    }

    setIsLoading(true);
    addLog('🗑️ IndexedDB 완전 초기화 시작...');
    
    try {
      // IndexedDB 데이터베이스 완전 삭제 (빠른 실행)
      addLog('🗑️ IndexedDB 데이터베이스 삭제 중...');
      await IndexedDB.deleteDatabase();
      addLog('✅ IndexedDB 데이터베이스 삭제 완료');
      addLog('🔄 페이지를 새로고침합니다...');
      
      // 즉시 새로고침 (대기 시간 제거)
      window.location.reload();
    } catch (error: any) {
      addLog(`❌ IndexedDB 초기화 실패: ${error.message}`);
      addLog('💡 브라우저 개발자 도구에서 수동으로 삭제해보세요.');
      addLog('   Application > IndexedDB > RealEstateDB > 삭제');
      setIsLoading(false);
    }
  };

  return (
    <DebugContainer>
      <CloseButton onClick={onClose}>×</CloseButton>
      <DebugTitle>🔧 Firebase 디버거</DebugTitle>
      
      <div>
        
        <DebugButton 
          onClick={testAddProperty} 
          disabled={isLoading}
        >
          🧪 매매용 테스트 매물
        </DebugButton>
        
        <DebugButton 
          onClick={testAddRentProperty} 
          disabled={isLoading}
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
          onClick={refreshPage} 
          disabled={isLoading}
        >
          🔄 페이지 새로고침
        </DebugButton>
        
        <DebugButton 
          onClick={handleDeleteTestProperties} 
          disabled={isLoading}
          style={{ marginTop: '0.5rem', background: '#f59e0b' }}
        >
          🧹 테스트 매물만 삭제
        </DebugButton>
        
        <DebugButton 
          onClick={handleCleanIndexedDB} 
          disabled={isLoading}
          style={{ marginTop: '0.5rem', background: '#3b82f6' }}
        >
          🧹 IndexedDB 정리
        </DebugButton>
        
        <DangerButton 
          onClick={handleClearIndexedDB} 
          disabled={isLoading}
          style={{ marginTop: '0.5rem', background: '#dc2626' }}
        >
          🗑️ IndexedDB 완전 초기화
        </DangerButton>
        
        <DangerButton 
          onClick={handleDeleteAllProperties} 
          disabled={isLoading}
          style={{ marginTop: '0.5rem' }}
        >
          ⚠️ 모든 매물 삭제
        </DangerButton>
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
