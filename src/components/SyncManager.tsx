import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { migrateDataToFirebase, checkSyncStatus, saveSyncStatus, getLastSyncTime } from '../utils/dataMigration';
import { testMobileImageSync, fixMobileImagesForProperties2And3 } from '../firebase/propertyService';
import { useProperties } from '../hooks/useProperties';
import { useFirebase } from '../contexts/FirebaseContext';

const SyncContainer = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const SyncTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.5rem 0;
`;

const SyncStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const StatusIndicator = styled.div<{ isSynced: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.isSynced ? '#28a745' : '#dc3545'};
`;

const StatusText = styled.span`
  font-size: 0.9rem;
  color: #6c757d;
`;

const SyncButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const SyncInfo = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: #007bff;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

interface SyncManagerProps {
  onSyncComplete?: () => void;
}

const SyncManager: React.FC<SyncManagerProps> = ({ onSyncComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState(checkSyncStatus());
  const [isTestingImages, setIsTestingImages] = useState(false);
  const [isFixingMobileImages, setIsFixingMobileImages] = useState(false);
  const { user } = useFirebase();
  const { refreshProperties } = useProperties();

  useEffect(() => {
    // 컴포넌트 마운트 시 동기화 상태 확인
    setSyncStatus(checkSyncStatus());
  }, []);

  const handleSync = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 데이터 마이그레이션 실행
      const propertyIds = await migrateDataToFirebase();
      
      clearInterval(progressInterval);
      setSyncProgress(100);

      // 동기화 상태 저장
      saveSyncStatus(propertyIds.length);
      
      // 상태 업데이트
      setSyncStatus(checkSyncStatus());
      
      // 매물 목록 새로고침
      await refreshProperties();

      // 완료 콜백 호출
      if (onSyncComplete) {
        onSyncComplete();
      }

      alert(`동기화가 완료되었습니다. ${propertyIds.length}개의 매물이 Firebase에 저장되었습니다.`);

    } catch (error) {
      console.error('동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleTestImageSync = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsTestingImages(true);

    try {
      await testMobileImageSync();
      await refreshProperties();
      alert('모바일 이미지 동기화 테스트가 완료되었습니다.');
    } catch (error) {
      console.error('이미지 동기화 테스트 오류:', error);
      alert('이미지 동기화 테스트 중 오류가 발생했습니다.');
    } finally {
      setIsTestingImages(false);
    }
  };

  const handleFixMobileImages = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsFixingMobileImages(true);

    try {
      await fixMobileImagesForProperties2And3();
      await refreshProperties();
      alert('핸드폰용 매물 2,3번 이미지 수정이 완료되었습니다. 페이지를 새로고침해주세요.');
    } catch (error) {
      console.error('핸드폰 이미지 수정 오류:', error);
      alert('핸드폰 이미지 수정 중 오류가 발생했습니다.');
    } finally {
      setIsFixingMobileImages(false);
    }
  };

  const formatLastSyncTime = (date: Date | null): string => {
    if (!date) return '동기화 기록 없음';
    return date.toLocaleString('ko-KR');
  };

  return (
    <SyncContainer>
      <SyncTitle>📊 데이터 동기화 관리</SyncTitle>
      
      <SyncStatus>
        <StatusIndicator isSynced={syncStatus.isSynced} />
        <StatusText>
          {syncStatus.isSynced 
            ? '동기화 완료' 
            : `동기화 필요 (로컬: ${syncStatus.localCount}, Firebase: ${syncStatus.firebaseCount})`
          }
        </StatusText>
      </SyncStatus>

      {isSyncing && (
        <div>
          <ProgressBar>
            <ProgressFill progress={syncProgress} />
          </ProgressBar>
          <SyncInfo>동기화 중... {syncProgress}%</SyncInfo>
        </div>
      )}

      <SyncButton 
        onClick={handleSync}
        disabled={isSyncing || syncStatus.isSynced}
      >
        {isSyncing ? '동기화 중...' : 'Firebase로 동기화'}
      </SyncButton>

      <SyncButton 
        onClick={handleTestImageSync}
        disabled={isTestingImages}
        style={{ marginTop: '0.5rem', background: '#28a745' }}
      >
        {isTestingImages ? '이미지 테스트 중...' : '📸 모바일 이미지 동기화 테스트'}
      </SyncButton>

      <SyncButton 
        onClick={handleFixMobileImages}
        disabled={isFixingMobileImages}
        style={{ marginTop: '0.5rem', background: '#dc3545' }}
      >
        {isFixingMobileImages ? '핸드폰 이미지 수정 중...' : '📱 핸드폰 매물 2,3번 이미지 수정'}
      </SyncButton>

      <SyncInfo>
        마지막 동기화: {formatLastSyncTime(getLastSyncTime())}
      </SyncInfo>
    </SyncContainer>
  );
};

export default SyncManager; 