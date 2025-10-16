import { Property } from '../types';

const DB_NAME = 'PropertyDB';
const DB_VERSION = 1;
const STORE_NAME = 'properties';

// IndexedDB 연결 및 초기화
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // properties 스토어 생성
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('propertyType', 'propertyType', { unique: false });
      }
    };
  });
};

// 모든 매물 조회
export const getAllProperties = async (): Promise<Property[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 매물 추가
export const addProperty = async (property: Property): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(property);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 매물 수정
export const updateProperty = async (property: Property): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(property);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 매물 삭제
export const deleteProperty = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 특정 매물 조회
export const getProperty = async (id: string): Promise<Property | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 초기 데이터 설정 (첫 실행 시에만)
export const initializeDefaultData = async (defaultProperties: Property[]): Promise<void> => {
  const existingProperties = await getAllProperties();
  
  // 기존 데이터가 없으면 기본 데이터 추가
  if (existingProperties.length === 0) {
    for (const property of defaultProperties) {
      await addProperty(property);
    }
  }
};

// 모든 데이터 초기화 (개발/테스트용)
export const clearAllProperties = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 데이터베이스 완전 초기화 (실제 매물 추가 전 정리용)
export const resetDatabase = async (): Promise<void> => {
  try {
    await clearAllProperties();
    console.log('✅ 데이터베이스가 초기화되었습니다.');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
}; 