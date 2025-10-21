import { addMultipleProperties } from '../firebase/propertyService';
import { Property } from '../types';

// 서울 매물 샘플 데이터
const seoulSampleProperties: Omit<Property, 'id' | 'createdAt'>[] = [
  {
    title: '강남구 역삼동 상가',
    description: '강남구 역삼동에 위치한 상가입니다. 역세권으로 교통이 편리합니다.',
    price: 850000000,
    type: 'sale',
    propertyType: 'commercial',
    address: '서울시 강남구 역삼동 123-45',
    location: { lat: 37.5000, lng: 127.0360 },
    area: 33.0, // 10평 (33㎡)
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
    area: 36.3, // 11평 (36.3㎡)
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
    title: '서울시청 근처 건물',
    description: '서울시청 근처에 위치한 건물입니다.',
    price: 1200000000,
    type: 'sale',
    propertyType: 'building',
    address: '서울시 중구 태평로 1가 123',
    location: { lat: 37.5665, lng: 126.9780 },
    area: 49.5, // 15평 (49.5㎡)
    bedrooms: 2,
    bathrooms: 2,
    images: ['/images/default-property.svg'],
    contact: {
      name: '이부동산',
      phone: '02-5555-7777',
      email: 'lee@realestate.com'
    },
    features: ['시청역', '주차가능', '엘리베이터'],
    isActive: true,
    confirmedDate: '25.07.20',
    floor: '1/10층',
    parking: true,
    elevator: true
  },
  {
    title: '명동 상가',
    description: '명동에 위치한 상가입니다.',
    price: 300000,
    deposit: 50000000,
    type: 'rent',
    propertyType: 'commercial',
    address: '서울시 중구 명동 123-45',
    location: { lat: 37.5636, lng: 126.9826 },
    area: 66.0, // 20평 (66㎡)
    bedrooms: 1,
    bathrooms: 1,
    images: ['/images/default-property.svg'],
    contact: {
      name: '최부동산',
      phone: '02-3333-4444',
      email: 'choi@realestate.com'
    },
    features: ['명동역', '주차가능'],
    isActive: true,
    confirmedDate: '25.07.21',
    floor: '2/8층',
    parking: true,
    elevator: false
  },
  {
    title: '잠실 사무실',
    description: '잠실에 위치한 사무실입니다.',
    price: 400000,
    deposit: 80000000,
    type: 'rent',
    propertyType: 'office',
    address: '서울시 송파구 잠실동 123-45',
    location: { lat: 37.5133, lng: 127.1028 },
    area: 82.5, // 25평 (82.5㎡)
    bedrooms: 2,
    bathrooms: 2,
    images: ['/images/default-property.svg'],
    contact: {
      name: '정부동산',
      phone: '02-6666-8888',
      email: 'jung@realestate.com'
    },
    features: ['잠실역', '주차가능', '엘리베이터'],
    isActive: true,
    confirmedDate: '25.07.22',
    floor: '5/20층',
    parking: true,
    elevator: true
  }
];

// 샘플 데이터 추가 함수
export const addSeoulSampleData = async () => {
  try {
    console.log('🏠 서울 샘플 데이터 추가 시작...');
    const propertyIds = await addMultipleProperties(seoulSampleProperties);
    console.log('✅ 서울 샘플 데이터 추가 완료:', propertyIds);
    return propertyIds;
  } catch (error) {
    console.error('❌ 서울 샘플 데이터 추가 실패:', error);
    throw error;
  }
};

// 전역 함수로 등록 (브라우저 콘솔에서 호출 가능)
(window as any).addSeoulSampleData = addSeoulSampleData;
