import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  getDoc,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { Property } from '../types';

// 컬렉션 이름
const PROPERTIES_COLLECTION = 'properties';

// 안전한 Timestamp 변환 함수
const safeConvertTimestamp = (timestamp: any): Date => {
  try {
    if (!timestamp) return new Date();
    
    // Firebase Timestamp 객체
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // 이미 Date 객체
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // 문자열 형태의 날짜
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Firebase Timestamp 형태의 객체
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }
    
    // 숫자 형태
    if (typeof timestamp === 'number') {
      const date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    return new Date();
  } catch (error) {
    console.warn('Timestamp 변환 실패, 기본값 사용:', error);
    return new Date();
  }
};

// 매물 추가
export const addProperty = async (property: Omit<Property, 'id' | 'createdAt'>): Promise<string> => {
  try {
    console.log('=== 매물 추가 시작 ===');
    console.log('Firebase 프로젝트 ID:', db.app.options.projectId);
    console.log('컬렉션 이름:', PROPERTIES_COLLECTION);
    console.log('매물 데이터:', property);
    
    const docRef = await addDoc(collection(db, PROPERTIES_COLLECTION), {
      ...property,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('매물 추가 성공, ID:', docRef.id);
    console.log('=== 매물 추가 완료 ===');
    return docRef.id;
  } catch (error) {
    console.error('=== 매물 추가 오류 ===');
    console.error('오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    
    // 구체적인 에러 메시지 제공
    let errorMessage = '매물을 추가하는 중 오류가 발생했습니다.';
    if ((error as any)?.code === 'permission-denied') {
      errorMessage = '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.';
    } else if ((error as any)?.code === 'unauthenticated') {
      errorMessage = '인증이 필요합니다. 로그인해주세요.';
    }
    
    throw new Error(errorMessage);
  }
};

// 매물 목록 조회 (모든 매물 가져오기)
export const getProperties = async (
  pageSize: number = 1000, // 충분히 큰 수로 설정
  lastDoc?: any // QueryDocumentSnapshot<DocumentData>
): Promise<{ properties: Property[]; lastDoc: any | null }> => {
  try {
    console.log('=== 매물 목록 조회 시작 ===');
    console.log('Firebase 프로젝트 ID:', db.app.options.projectId);
    console.log('컬렉션 이름:', PROPERTIES_COLLECTION);
    
    // 단순하게 모든 매물을 가져오기 (limit 없이)
    const querySnapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
    
    console.log('=== Firestore 쿼리 결과 ===');
    console.log('총 문서 수:', querySnapshot.docs.length);
    console.log('빈 결과인가?', querySnapshot.empty);
    console.log('쿼리 결과 문서들:', querySnapshot.docs.map((doc, index) => ({
      index,
      id: doc.id,
      exists: doc.exists(),
      data: doc.data()
    })));
    
    const properties: Property[] = [];

    let index = 0;
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      console.log(`문서 ${index + 1} 처리 중:`, doc.id);
      const data = doc.data();
      console.log(`원본 Firebase 데이터:`, data);
      const property = {
        id: doc.id,
        ...data,
        // 필드명 매핑 (Firebase에서 다른 필드명으로 저장된 경우)
        price: data.price || data.rentPrice || 0,
        deposit: data.deposit || 0,
        createdAt: safeConvertTimestamp(data.createdAt),
        updatedAt: safeConvertTimestamp(data.updatedAt),
        isActive: data.isActive !== false // isActive가 없거나 true인 경우 true로 설정
      } as Property;
      
      console.log(`처리된 매물 ${index + 1}:`, {
        id: property.id,
        title: property.title,
        address: property.address,
        type: property.type,
        price: property.price,
        deposit: property.deposit,
        isActive: property.isActive
      });
      
      // 모든 매물을 포함 (필터링 제거)
      properties.push(property);
      index++;
    });

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    console.log('=== 최종 결과 ===');
    console.log('매물 목록 조회 성공:', properties.length, '개');
    console.log('조회된 매물 목록:', properties.map(p => ({
      id: p.id,
      title: p.title,
      address: p.address,
      isActive: p.isActive
    })));
    console.log('=== 매물 목록 조회 완료 ===');
    
    return { properties, lastDoc: lastVisible };
  } catch (error) {
    console.error('=== 매물 목록 조회 오류 ===');
    console.error('오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw new Error('매물 목록을 조회하는 중 오류가 발생했습니다.');
  }
};

// 특정 매물 조회
export const getProperty = async (id: string): Promise<Property | null> => {
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: safeConvertTimestamp(data.createdAt),
        updatedAt: safeConvertTimestamp(data.updatedAt)
      } as Property;
    } else {
      return null;
    }
  } catch (error) {
    console.error('매물 조회 오류:', error);
    throw new Error('매물을 조회하는 중 오류가 발생했습니다.');
  }
};

// 매물 업데이트
export const updateProperty = async (id: string, updates: Partial<Property>): Promise<void> => {
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('매물 업데이트 오류:', error);
    throw new Error('매물을 업데이트하는 중 오류가 발생했습니다.');
  }
};

// 매물 삭제 (소프트 삭제)
export const deleteProperty = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('매물 삭제 오류:', error);
    throw new Error('매물을 삭제하는 중 오류가 발생했습니다.');
  }
};

// 매물 완전 삭제 (실제 문서 삭제)
export const permanentlyDeleteProperty = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, id);
    await deleteDoc(docRef);
    console.log('매물 완전 삭제 성공:', id);
  } catch (error) {
    console.error('매물 완전 삭제 오류:', error);
    throw new Error('매물을 완전히 삭제하는 중 오류가 발생했습니다.');
  }
};

// 테스트 매물만 삭제 (제목에 "테스트"가 포함된 매물)
export const deleteTestProperties = async (): Promise<number> => {
  try {
    console.log('=== 테스트 매물 삭제 시작 ===');
    
    // 모든 매물 가져오기
    const querySnapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
    console.log('전체 매물 수:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('삭제할 매물이 없습니다.');
      return 0;
    }
    
    // 테스트 매물 필터링 (제목에 "테스트"가 포함된 것들)
    const testProperties: Array<{ id: string; title: string }> = [];
    
    querySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const title = data.title || '';
      const description = data.description || '';
      const contactName = data.contact?.name || '';
      
      // 테스트 매물 판별 조건
      const isTestProperty = 
        title.includes('테스트') || 
        title.includes('test') ||
        title.includes('Test') ||
        description.includes('테스트') ||
        contactName.includes('테스트');
      
      if (isTestProperty) {
        testProperties.push({
          id: docSnapshot.id,
          title: title
        });
      }
    });
    
    console.log('삭제할 테스트 매물 수:', testProperties.length);
    
    if (testProperties.length === 0) {
      console.log('삭제할 테스트 매물이 없습니다.');
      return 0;
    }
    
    // 삭제할 매물 목록 출력
    testProperties.forEach((prop, index) => {
      console.log(`  ${index + 1}. ${prop.title} (ID: ${prop.id})`);
    });
    
    // 배치로 삭제
    const batchSize = 500;
    let deletedCount = 0;
    
    for (let i = 0; i < testProperties.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchProps = testProperties.slice(i, i + batchSize);
      
      for (const prop of batchProps) {
        batch.delete(doc(db, PROPERTIES_COLLECTION, prop.id));
        deletedCount++;
      }
      
      await batch.commit();
      console.log(`${Math.min(i + batchSize, testProperties.length)}/${testProperties.length}개 테스트 매물 삭제 완료...`);
    }
    
    console.log(`=== 테스트 매물 삭제 완료: ${deletedCount}개 ===`);
    return deletedCount;
  } catch (error) {
    console.error('=== 테스트 매물 삭제 오류 ===');
    console.error('오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    
    let errorMessage = '테스트 매물을 삭제하는 중 오류가 발생했습니다.';
    if ((error as any)?.code === 'permission-denied') {
      errorMessage = '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.';
    } else if ((error as any)?.code === 'unauthenticated') {
      errorMessage = '인증이 필요합니다. 로그인해주세요.';
    }
    
    throw new Error(errorMessage);
  }
};

// 모든 매물 삭제 (주의: 모든 데이터가 삭제됩니다)
export const deleteAllProperties = async (): Promise<number> => {
  try {
    console.log('=== 모든 매물 삭제 시작 ===');
    
    // 모든 매물 가져오기
    const querySnapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
    console.log('삭제할 매물 수:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('삭제할 매물이 없습니다.');
      return 0;
    }
    
    // 배치로 삭제 (Firestore는 한 번에 최대 500개까지 처리 가능)
    const batchSize = 500;
    let deletedCount = 0;
    const allDocs = querySnapshot.docs;
    
    // 여러 배치로 나눠서 처리
    for (let i = 0; i < allDocs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = allDocs.slice(i, i + batchSize);
      
      for (const docSnapshot of batchDocs) {
        batch.delete(doc(db, PROPERTIES_COLLECTION, docSnapshot.id));
        deletedCount++;
      }
      
      await batch.commit();
      console.log(`${Math.min(i + batchSize, allDocs.length)}/${allDocs.length}개 매물 삭제 완료...`);
    }
    
    console.log(`=== 모든 매물 삭제 완료: ${deletedCount}개 ===`);
    return deletedCount;
  } catch (error) {
    console.error('=== 모든 매물 삭제 오류 ===');
    console.error('오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    
    let errorMessage = '모든 매물을 삭제하는 중 오류가 발생했습니다.';
    if ((error as any)?.code === 'permission-denied') {
      errorMessage = '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.';
    } else if ((error as any)?.code === 'unauthenticated') {
      errorMessage = '인증이 필요합니다. 로그인해주세요.';
    }
    
    throw new Error(errorMessage);
  }
};

// 매물 검색
export const searchProperties = async (
  searchTerm: string,
  propertyType?: string,
  transactionType?: string,
  maxPrice?: number
): Promise<Property[]> => {
  try {
    let q = query(
      collection(db, PROPERTIES_COLLECTION)
    );

    // 필터 조건 추가
    if (propertyType) {
      q = query(q, where('propertyType', '==', propertyType));
    }
    if (transactionType) {
      q = query(q, where('type', '==', transactionType));
    }
    if (maxPrice) {
      q = query(q, where('price', '<=', maxPrice));
    }

    const querySnapshot = await getDocs(q);
    const properties: Property[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const property = {
        id: doc.id,
        ...data,
        createdAt: safeConvertTimestamp(data.createdAt),
        updatedAt: safeConvertTimestamp(data.updatedAt)
      } as Property;

      // 검색어 필터링 (제목, 설명, 주소에서 검색)
      if (!searchTerm || 
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase())) {
        properties.push(property);
      }
    });

    return properties;
  } catch (error) {
    console.error('매물 검색 오류:', error);
    throw new Error('매물을 검색하는 중 오류가 발생했습니다.');
  }
};

// 테스트 매물 추가 (디버깅용)
export const addTestProperty = async (): Promise<string> => {
  try {
    console.log('=== 테스트 매물 추가 시작 ===');
    
    // 매매용 테스트 매물
    const saleProperty = {
      title: '테스트 매매 매물',
      description: '매매용 테스트 매물입니다.',
      price: 500000000, // 5억원
      type: 'sale' as const,
      propertyType: 'commercial' as const,
      address: '서울특별시 강남구 테헤란로 123',
      location: {
        lat: 37.5665,
        lng: 126.9780
      },
      area: 100, // 100m²
      images: [],
      contact: {
        name: '테스트 중개사',
        phone: '010-1234-5678',
        email: 'test@example.com'
      },
      features: ['주차가능', '엘리베이터'],
      isActive: true,
      floor: '3/10층',
      parking: true,
      elevator: true,
      createdBy: 'system',
      updatedBy: 'system'
    };

    console.log('테스트 매물 데이터:', saleProperty);
    console.log('Firebase 프로젝트 ID:', db.app.options.projectId);
    console.log('컬렉션 이름:', PROPERTIES_COLLECTION);
    
    const docRef = await addDoc(collection(db, PROPERTIES_COLLECTION), {
      ...saleProperty,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('테스트 매물 추가 성공, ID:', docRef.id);
    console.log('=== 테스트 매물 추가 완료 ===');
    return docRef.id;
  } catch (error) {
    console.error('=== 테스트 매물 추가 오류 ===');
    console.error('오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    
    // 구체적인 에러 메시지 제공
    let errorMessage = '테스트 매물을 추가하는 중 오류가 발생했습니다.';
    if ((error as any)?.code === 'permission-denied') {
      errorMessage = '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.';
    } else if ((error as any)?.code === 'unauthenticated') {
      errorMessage = '인증이 필요합니다. 로그인해주세요.';
    }
    
    throw new Error(errorMessage);
  }
};

// 임대용 테스트 매물 추가 (디버깅용)
export const addTestRentProperty = async (): Promise<string> => {
  try {
    console.log('=== 임대용 테스트 매물 추가 시작 ===');
    
    // 임대용 테스트 매물
    const rentProperty = {
      title: '테스트 임대 매물',
      description: '임대용 테스트 매물입니다.',
      price: 500000, // 월세 50만원
      deposit: 10000000, // 보증금 1천만원
      type: 'rent' as const,
      propertyType: 'office' as const,
      address: '서울특별시 마포구 홍대입구역 456',
      location: {
        lat: 37.5563,
        lng: 126.9226
      },
      area: 50, // 50m²
      images: [],
      contact: {
        name: '테스트 중개사',
        phone: '010-9876-5432',
        email: 'rent@example.com'
      },
      features: ['주차가능', '엘리베이터'],
      isActive: true,
      floor: '2/5층',
      parking: false,
      elevator: true,
      createdBy: 'system',
      updatedBy: 'system'
    };

    console.log('임대용 테스트 매물 데이터:', rentProperty);
    console.log('Firebase 프로젝트 ID:', db.app.options.projectId);
    console.log('컬렉션 이름:', PROPERTIES_COLLECTION);
    
    const docRef = await addDoc(collection(db, PROPERTIES_COLLECTION), {
      ...rentProperty,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('임대용 테스트 매물 추가 성공, ID:', docRef.id);
    console.log('=== 임대용 테스트 매물 추가 완료 ===');
    return docRef.id;
  } catch (error) {
    console.error('=== 임대용 테스트 매물 추가 오류 ===');
    console.error('오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    
    // 구체적인 에러 메시지 제공
    let errorMessage = '임대용 테스트 매물을 추가하는 중 오류가 발생했습니다.';
    if ((error as any)?.code === 'permission-denied') {
      errorMessage = '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.';
    } else if ((error as any)?.code === 'unauthenticated') {
      errorMessage = '인증이 필요합니다. 로그인해주세요.';
    }
    
    throw new Error(errorMessage);
  }
};

// 대량 매물 추가
export const addMultipleProperties = async (properties: Omit<Property, 'id' | 'createdAt'>[]): Promise<string[]> => {
  try {
    console.log('대량 매물 추가 시작, 개수:', properties.length);
    console.log('첫 번째 매물 데이터:', properties[0]);
    
    const batch = properties.map((property, index) => {
      console.log(`매물 ${index + 1} 추가 중:`, property.title);
      return addDoc(collection(db, PROPERTIES_COLLECTION), {
        ...property,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    console.log('Firebase에 저장 요청 중...');
    const docRefs = await Promise.all(batch);
    console.log('Firebase 저장 완료, 결과:', docRefs.map(doc => doc.id));
    
    return docRefs.map(docRef => docRef.id);
  } catch (error) {
    console.error('대량 매물 추가 오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw new Error('매물을 대량으로 추가하는 중 오류가 발생했습니다.');
  }
};

// 지역별 매물 조회
export const getPropertiesByLocation = async (
  centerLat: number,
  centerLng: number,
  radiusKm: number = 10
): Promise<Property[]> => {
  try {
    // 간단한 구현: 모든 매물을 가져와서 클라이언트에서 필터링
    // 실제 프로덕션에서는 Geohash나 Firestore GeoPoint를 사용하는 것이 좋습니다
    const { properties } = await getProperties(1000); // 충분히 큰 수로 가져오기
    
    return properties.filter(property => {
      const distance = calculateDistance(
        centerLat, centerLng,
        property.location.lat, property.location.lng
      );
      return distance <= radiusKm;
    });
  } catch (error) {
    console.error('지역별 매물 조회 오류:', error);
    throw new Error('지역별 매물을 조회하는 중 오류가 발생했습니다.');
  }
};

// 두 지점 간의 거리 계산 (km)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}; 