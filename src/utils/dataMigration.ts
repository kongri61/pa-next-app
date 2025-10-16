import { addMultipleProperties } from '../firebase/propertyService';
import { Property } from '../types';

// 샘플 데이터 (기존 로컬 데이터)
const sampleProperties: Omit<Property, 'id' | 'createdAt'>[] = [
  {
    title: '강남구 역삼동 상가',
    description: '강남구 역삼동에 위치한 상가입니다. 역세권으로 교통이 편리합니다.',
    price: 850000000,
    type: 'sale',
    propertyType: 'commercial',
    address: '서울시 강남구 역삼동 123-45',
    location: { lat: 37.5000, lng: 127.0360 },
    area: 84.5,
    bedrooms: 3,
    bathrooms: 2,
    images: ['/images/default-property.svg'],
    contact: {
      name: '김부동산',
      phone: '02-1234-5678',
      email: 'kim@realestate.com'
    },
    features: ['역세권', '주차가능', '엘리베이터'],
    isActive: true,
    confirmedDate: '25.07.19',
    floor: '3/15층',
    parking: true,
    elevator: true
  },
  {
    title: '홍대입구 근처 사무실',
    description: '홍대입구역 도보 5분 거리의 사무실입니다.',
    price: 500000,
    deposit: 10000000,
    type: 'rent',
    propertyType: 'office',
    address: '서울시 마포구 서교동 456-78',
    location: { lat: 37.5570, lng: 126.9250 },
    area: 25.3,
    bedrooms: 1,
    bathrooms: 1,
    images: ['/images/default-property.svg'],
    contact: {
      name: '박부동산',
      phone: '02-9876-5432',
      email: 'park@realestate.com'
    },
    features: ['역세권', '엘리베이터'],
    isActive: true,
    confirmedDate: '25.07.18',
    floor: '2/5층',
    parking: false,
    elevator: true
  },
  {
    title: '인천 송도 신축 건물',
    description: '인천 송도에 위치한 신축 건물입니다. 현대적인 시설을 갖추고 있습니다.',
    price: 1200000000,
    type: 'sale',
    propertyType: 'building',
    address: '인천시 연수구 송도동 789-12',
    location: { lat: 37.4000, lng: 126.7052 },
    area: 150.0,
    bedrooms: 5,
    bathrooms: 3,
    images: ['/images/default-property.svg'],
    contact: {
      name: '이부동산',
      phone: '032-1234-5678',
      email: 'lee@realestate.com'
    },
    features: ['신축', '주차가능', '엘리베이터', 'CCTV'],
    isActive: true,
    confirmedDate: '25.07.20',
    floor: '1/10층',
    parking: true,
    elevator: true
  }
];

// 데이터 마이그레이션 함수
export const migrateDataToFirebase = async (): Promise<string[]> => {
  try {
    console.log('데이터 마이그레이션 시작...');
    
    // Firebase에 데이터 추가
    const propertyIds = await addMultipleProperties(sampleProperties);
    
    console.log('마이그레이션 완료:', propertyIds);
    return propertyIds;
  } catch (error) {
    console.error('마이그레이션 오류:', error);
    throw new Error('데이터 마이그레이션 중 오류가 발생했습니다.');
  }
};

// 로컬 스토리지에서 데이터 가져오기
export const getLocalData = (): Property[] => {
  try {
    const localData = localStorage.getItem('properties');
    if (localData) {
      return JSON.parse(localData);
    }
    return [];
  } catch (error) {
    console.error('로컬 데이터 읽기 오류:', error);
    return [];
  }
};

// 로컬 데이터를 Firebase 형식으로 변환
export const convertLocalDataToFirebase = (localProperties: Property[]): Omit<Property, 'id' | 'createdAt'>[] => {
  return localProperties.map(property => {
    const { id, createdAt, ...firebaseProperty } = property;
    return {
      ...firebaseProperty,
      isActive: true
    };
  });
};

// 데이터 동기화 상태 확인
export const checkSyncStatus = (): { isSynced: boolean; localCount: number; firebaseCount: number } => {
  const localData = getLocalData();
  const firebaseCount = parseInt(localStorage.getItem('firebase_property_count') || '0');
  
  return {
    isSynced: localData.length === firebaseCount,
    localCount: localData.length,
    firebaseCount
  };
};

// 동기화 상태 저장
export const saveSyncStatus = (count: number): void => {
  localStorage.setItem('firebase_property_count', count.toString());
  localStorage.setItem('last_sync_time', new Date().toISOString());
};

// 마지막 동기화 시간 확인
export const getLastSyncTime = (): Date | null => {
  const lastSync = localStorage.getItem('last_sync_time');
  return lastSync ? new Date(lastSync) : null;
}; 