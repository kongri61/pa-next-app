import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDatabase, getAllProperties } from './utils/indexedDB';
import { Property } from './types';

// 전역 변수로 초기 데이터 저장 (즉시 접근 가능)
let initialProperties: Property[] = [];

// ⚡ 앱 시작 전 IndexedDB 미리 초기화 및 데이터 로드 (최대한 빠른 데이터 로딩)
const initializeApp = async () => {
  try {
    const totalStartTime = performance.now();
    
    // 1. IndexedDB 초기화
    const initStartTime = performance.now();
    await initDatabase();
    const initTime = performance.now() - initStartTime;
    console.log(`⚡ IndexedDB 사전 초기화 완료 (${initTime.toFixed(2)}ms)`);
    
    // 2. 데이터 즉시 로드 (초기 렌더링을 위해)
    const loadStartTime = performance.now();
    try {
      initialProperties = await getAllProperties();
      const loadTime = performance.now() - loadStartTime;
      console.log(`⚡ 초기 데이터 로드 완료: ${initialProperties.length}개 (${loadTime.toFixed(2)}ms)`);
    } catch (loadError) {
      console.warn('⚠️ 초기 데이터 로드 실패 (앱은 계속 실행):', loadError);
      initialProperties = [];
    }
    
    const totalTime = performance.now() - totalStartTime;
    console.log(`🎉 전체 초기화 완료 (총 ${totalTime.toFixed(2)}ms)`);
  } catch (error) {
    console.warn('⚠️ IndexedDB 사전 초기화 실패 (앱은 계속 실행):', error);
  }
  
  // 앱 렌더링 (IndexedDB 초기화와 병렬 처리)
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <App initialProperties={initialProperties} />
      </React.StrictMode>
    );
  } else {
    console.error('Root element not found');
  }
};

// 즉시 실행
initializeApp(); 