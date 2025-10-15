import { migrateDataToFirebase, checkSyncStatus, getLastSyncTime } from './dataMigration';
import { getProperties } from '../firebase/propertyService';

// 동기화 테스트 함수
export const testSync = async (): Promise<void> => {
  console.log('=== 동기화 테스트 시작 ===');
  
  try {
    // 1. 현재 동기화 상태 확인
    const syncStatus = checkSyncStatus();
    console.log('현재 동기화 상태:', syncStatus);
    
    // 2. 마지막 동기화 시간 확인
    const lastSync = getLastSyncTime();
    console.log('마지막 동기화 시간:', lastSync);
    
    // 3. 동기화 실행
    console.log('동기화 실행 중...');
    const propertyIds = await migrateDataToFirebase();
    console.log('동기화 완료. 생성된 ID들:', propertyIds);
    
    // 4. Firebase에서 데이터 확인
    console.log('Firebase에서 데이터 확인 중...');
    const { properties } = await getProperties(100);
    console.log('Firebase에 저장된 매물 수:', properties.length);
    console.log('매물 목록:', properties.map(p => ({ id: p.id, title: p.title })));
    
    // 5. 최종 상태 확인
    const finalStatus = checkSyncStatus();
    console.log('최종 동기화 상태:', finalStatus);
    
    console.log('=== 동기화 테스트 완료 ===');
    
  } catch (error) {
    console.error('동기화 테스트 실패:', error);
    throw error;
  }
};

// 동기화 상태 리셋 함수
export const resetSyncStatus = (): void => {
  console.log('동기화 상태 리셋 중...');
  
  localStorage.removeItem('firebase_property_count');
  localStorage.removeItem('last_sync_time');
  
  console.log('동기화 상태가 리셋되었습니다.');
};

// 로컬 데이터 확인 함수
export const checkLocalData = (): void => {
  console.log('=== 로컬 데이터 확인 ===');
  
  const localData = localStorage.getItem('properties');
  if (localData) {
    try {
      const properties = JSON.parse(localData);
      console.log('로컬 매물 수:', properties.length);
      console.log('로컬 매물 목록:', properties.map((p: any) => ({ id: p.id, title: p.title })));
    } catch (error) {
      console.error('로컬 데이터 파싱 오류:', error);
    }
  } else {
    console.log('로컬에 저장된 매물 데이터가 없습니다.');
  }
};

// Firebase 데이터 확인 함수
export const checkFirebaseData = async (): Promise<void> => {
  console.log('=== Firebase 데이터 확인 ===');
  
  try {
    const { properties } = await getProperties(1000);
    console.log('Firebase 매물 수:', properties.length);
    console.log('Firebase 매물 목록:', properties.map(p => ({ id: p.id, title: p.title })));
  } catch (error) {
    console.error('Firebase 데이터 확인 오류:', error);
  }
};

// 전체 데이터 비교 함수
export const compareData = async (): Promise<void> => {
  console.log('=== 데이터 비교 ===');
  
  // 로컬 데이터 확인
  const localData = localStorage.getItem('properties');
  const localProperties = localData ? JSON.parse(localData) : [];
  
  // Firebase 데이터 확인
  const { properties: firebaseProperties } = await getProperties(1000);
  
  console.log('로컬 매물 수:', localProperties.length);
  console.log('Firebase 매물 수:', firebaseProperties.length);
  
  // 제목 기준으로 비교
  const localTitles = localProperties.map((p: any) => p.title).sort();
  const firebaseTitles = firebaseProperties.map(p => p.title).sort();
  
  console.log('로컬 제목들:', localTitles);
  console.log('Firebase 제목들:', firebaseTitles);
  
  // 차이점 확인
  const onlyInLocal = localTitles.filter((title: string) => !firebaseTitles.includes(title));
  const onlyInFirebase = firebaseTitles.filter((title: string) => !localTitles.includes(title));
  
  if (onlyInLocal.length > 0) {
    console.log('로컬에만 있는 매물:', onlyInLocal);
  }
  
  if (onlyInFirebase.length > 0) {
    console.log('Firebase에만 있는 매물:', onlyInFirebase);
  }
  
  if (onlyInLocal.length === 0 && onlyInFirebase.length === 0) {
    console.log('✅ 모든 데이터가 동기화되었습니다.');
  } else {
    console.log('⚠️ 데이터 동기화가 필요합니다.');
  }
};

// 성능 테스트 함수
export const performanceTest = async (): Promise<void> => {
  console.log('=== 성능 테스트 시작 ===');
  
  const startTime = performance.now();
  
  try {
    await testSync();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`성능 테스트 완료. 소요 시간: ${duration.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('성능 테스트 실패:', error);
  }
};

// 브라우저 콘솔에서 사용할 수 있는 전역 함수들
if (typeof window !== 'undefined') {
  (window as any).testSync = testSync;
  (window as any).resetSyncStatus = resetSyncStatus;
  (window as any).checkLocalData = checkLocalData;
  (window as any).checkFirebaseData = checkFirebaseData;
  (window as any).compareData = compareData;
  (window as any).performanceTest = performanceTest;
  
  console.log('동기화 테스트 함수들이 전역으로 등록되었습니다:');
  console.log('- testSync(): 동기화 테스트 실행');
  console.log('- resetSyncStatus(): 동기화 상태 리셋');
  console.log('- checkLocalData(): 로컬 데이터 확인');
  console.log('- checkFirebaseData(): Firebase 데이터 확인');
  console.log('- compareData(): 데이터 비교');
  console.log('- performanceTest(): 성능 테스트');
} 