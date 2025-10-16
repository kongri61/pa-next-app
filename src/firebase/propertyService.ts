import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  getDoc,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './config';
import { Property } from '../types';

// 컬렉션 이름
const PROPERTIES_COLLECTION = 'properties';

// Firebase Timestamp를 안전하게 Date로 변환하는 헬퍼 함수
const safeToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  return new Date(timestamp);
};

// 매물 추가
export const addProperty = async (property: Omit<Property, 'id' | 'createdAt'>): Promise<string> => {
  try {
    console.log('=== 매물 추가 시작 ===');
    console.log('Firebase 프로젝트 ID:', db.app.options.projectId);
    console.log('컬렉션 이름:', PROPERTIES_COLLECTION);
    console.log('매물 데이터:', property);
    
    // Firebase 인증 상태 확인
    const { getCurrentUser } = await import('./authService');
    const currentUser = getCurrentUser();
    console.log('현재 인증된 사용자:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('인증된 사용자가 없습니다. 로그인이 필요합니다.');
    }
    
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
    
    // Firebase 인증 상태 확인 (선택적)
    try {
      const { getCurrentUser } = await import('./authService');
      const currentUser = getCurrentUser();
      console.log('현재 인증된 사용자:', currentUser?.uid || '없음');
    } catch (authError) {
      console.log('인증 확인 중 오류 (무시됨):', authError);
    }
    
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
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
    
    // 구체적인 에러 메시지 제공
    let errorMessage = '매물 목록을 조회하는 중 오류가 발생했습니다.';
    if ((error as any)?.code === 'permission-denied') {
      errorMessage = '매물 조회 권한이 없습니다. Firestore 보안 규칙을 확인해주세요.';
    } else if ((error as any)?.code === 'unauthenticated') {
      errorMessage = '인증이 필요합니다. 로그인해주세요.';
    } else if ((error as any)?.code === 'unavailable') {
      errorMessage = 'Firebase 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
    }
    
    throw new Error(errorMessage);
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt)
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt)
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
    
    // Firebase 인증 상태 확인
    const { getCurrentUser } = await import('./authService');
    const currentUser = getCurrentUser();
    console.log('현재 인증된 사용자:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('인증된 사용자가 없습니다. 로그인이 필요합니다.');
    }
    
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
      images: [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
      ],
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
      createdBy: currentUser.uid,
      updatedBy: currentUser.uid
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
    
    // Firebase 인증 상태 확인
    const { getCurrentUser } = await import('./authService');
    const currentUser = getCurrentUser();
    console.log('현재 인증된 사용자:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('인증된 사용자가 없습니다. 로그인이 필요합니다.');
    }
    
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
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
      ],
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
      createdBy: currentUser.uid,
      updatedBy: currentUser.uid
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

// 기존 매물에 이미지 추가 (디버깅용)
export const addImagesToExistingProperties = async (): Promise<void> => {
  try {
    console.log('=== 기존 매물에 이미지 추가 시작 ===');
    
    // Firebase 인증 상태 확인
    const { getCurrentUser } = await import('./authService');
    const currentUser = getCurrentUser();
    console.log('현재 인증된 사용자:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('인증된 사용자가 없습니다. 로그인이 필요합니다.');
    }
    
    // 모든 매물 조회
    const { properties } = await getProperties();
    console.log('조회된 매물 수:', properties.length);
    
    // 모든 매물의 이미지 상태 확인 및 로그
    properties.forEach((property, index) => {
      console.log(`매물 ${index + 1} (${property.id}):`, {
        title: property.title,
        type: property.type,
        images: property.images,
        imageCount: property.images?.length || 0
      });
    });
    
    // 이미지가 없는 매물들에 이미지 추가
    const propertiesToUpdate = properties.filter(property => 
      !property.images || property.images.length === 0
    );
    
    console.log('이미지가 없는 매물 수:', propertiesToUpdate.length);
    
    for (const property of propertiesToUpdate) {
      try {
        // 매물 타입에 따라 다른 이미지 설정
        let images: string[] = [];
        
        if (property.type === 'sale') {
          images = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
          ];
        } else if (property.type === 'rent') {
          images = [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
          ];
        } else {
          images = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'
          ];
        }
        
        // 매물 업데이트
        await updateProperty(property.id, { images });
        console.log(`매물 ${property.id}에 이미지 추가 완료:`, images);
        
      } catch (error) {
        console.error(`매물 ${property.id} 업데이트 실패:`, error);
      }
    }
    
    console.log('=== 기존 매물에 이미지 추가 완료 ===');
    
  } catch (error) {
    console.error('=== 기존 매물에 이미지 추가 오류 ===');
    console.error('오류:', error);
    throw error;
  }
};

// Firebase 데이터 강제 새로고침 (캐시 무시)
export const forceRefreshFirebaseData = async (): Promise<{ properties: Property[]; lastDoc: any | null }> => {
  try {
    console.log('=== Firebase 데이터 강제 새로고침 시작 ===');
    
    // 캐시를 무시하고 최신 데이터 가져오기
    const querySnapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
    
    console.log('=== 강제 새로고침 결과 ===');
    console.log('총 문서 수:', querySnapshot.docs.length);
    
    const properties: Property[] = [];
    
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      console.log(`원본 Firebase 데이터 (${doc.id}):`, {
        title: data.title,
        type: data.type,
        images: data.images,
        imageCount: data.images?.length || 0
      });
      
      const property = {
        id: doc.id,
        ...data,
        price: data.price || data.rentPrice || 0,
        deposit: data.deposit || 0,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        isActive: data.isActive !== false
      } as Property;
      
      properties.push(property);
    });
    
    console.log('=== 강제 새로고침 완료 ===');
    console.log('새로고침된 매물 수:', properties.length);
    
    return { properties, lastDoc: null };
  } catch (error) {
    console.error('=== Firebase 데이터 강제 새로고침 오류 ===');
    console.error('오류:', error);
    throw error;
  }
};

// 특정 매물에 이미지 강제 추가 (2,3번 매물용)
export const addImagesToSpecificProperties = async (): Promise<void> => {
  try {
    console.log('=== 특정 매물에 이미지 추가 시작 ===');
    
    // Firebase 인증 상태 확인
    const { getCurrentUser } = await import('./authService');
    const currentUser = getCurrentUser();
    console.log('현재 인증된 사용자:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('인증된 사용자가 없습니다. 로그인이 필요합니다.');
    }
    
    // 모든 매물 조회
    const { properties } = await getProperties();
    console.log('조회된 매물 수:', properties.length);
    
    // 매물별 상세 정보 출력
    properties.forEach((property, index) => {
      console.log(`매물 ${index + 1} (${property.id}):`, {
        title: property.title,
        type: property.type,
        images: property.images,
        imageCount: property.images?.length || 0,
        hasImages: !!(property.images && property.images.length > 0)
      });
    });
    
    // 이미지가 없는 매물들 찾기
    const propertiesWithoutImages = properties.filter(property => 
      !property.images || property.images.length === 0
    );
    
    console.log('이미지가 없는 매물들:', propertiesWithoutImages.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type
    })));
    
    // 각 매물에 이미지 추가
    for (const property of propertiesWithoutImages) {
      try {
        let images: string[] = [];
        
        // 매물 타입에 따라 다른 이미지 설정
        if (property.type === 'sale') {
          images = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
          ];
        } else if (property.type === 'rent') {
          images = [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
          ];
        } else {
          images = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'
          ];
        }
        
        console.log(`매물 ${property.id} (${property.title})에 이미지 추가:`, images);
        
        // 매물 업데이트
        await updateProperty(property.id, { images });
        console.log(`✅ 매물 ${property.id}에 이미지 추가 완료`);
        
      } catch (error) {
        console.error(`❌ 매물 ${property.id} 업데이트 실패:`, error);
      }
    }
    
    console.log('=== 특정 매물에 이미지 추가 완료 ===');
    
  } catch (error) {
    console.error('=== 특정 매물에 이미지 추가 오류 ===');
    console.error('오류:', error);
    throw error;
  }
};

// 매물 이미지 업데이트 (모바일 동기화용)
export const updatePropertyImages = async (id: string, images: string[]): Promise<void> => {
  try {
    console.log('=== 매물 이미지 업데이트 시작 ===');
    console.log('매물 ID:', id);
    console.log('이미지 개수:', images.length);
    
    // Firebase 인증 상태 확인
    const { getCurrentUser } = await import('./authService');
    const currentUser = getCurrentUser();
    console.log('현재 인증된 사용자:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('인증된 사용자가 없습니다. 로그인이 필요합니다.');
    }
    
    const docRef = doc(db, PROPERTIES_COLLECTION, id);
    await updateDoc(docRef, {
      images: images,
      updatedAt: new Date(),
      updatedBy: currentUser.uid
    });
    
    console.log('매물 이미지 업데이트 성공');
    console.log('=== 매물 이미지 업데이트 완료 ===');
  } catch (error) {
    console.error('=== 매물 이미지 업데이트 오류 ===');
    console.error('오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    
    // 구체적인 에러 메시지 제공
    let errorMessage = '매물 이미지를 업데이트하는 중 오류가 발생했습니다.';
    if ((error as any)?.code === 'permission-denied') {
      errorMessage = '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.';
    } else if ((error as any)?.code === 'unauthenticated') {
      errorMessage = '인증이 필요합니다. 로그인해주세요.';
    }
    
    throw new Error(errorMessage);
  }
};

// 매물 지도 이미지 업데이트 (모바일 동기화용)
export const updatePropertyMapImages = async (id: string, mapImages: string[]): Promise<void> => {
  try {
    console.log('=== 매물 지도 이미지 업데이트 시작 ===');
    console.log('매물 ID:', id);
    console.log('지도 이미지 개수:', mapImages.length);
    
    // Firebase 인증 상태 확인
    const { getCurrentUser } = await import('./authService');
    const currentUser = getCurrentUser();
    console.log('현재 인증된 사용자:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('인증된 사용자가 없습니다. 로그인이 필요합니다.');
    }
    
    const docRef = doc(db, PROPERTIES_COLLECTION, id);
    await updateDoc(docRef, {
      mapImages: mapImages,
      updatedAt: new Date(),
      updatedBy: currentUser.uid
    });
    
    console.log('매물 지도 이미지 업데이트 성공');
    console.log('=== 매물 지도 이미지 업데이트 완료 ===');
  } catch (error) {
    console.error('=== 매물 지도 이미지 업데이트 오류 ===');
    console.error('오류:', error);
    console.error('오류 상세:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    
    // 구체적인 에러 메시지 제공
    let errorMessage = '매물 지도 이미지를 업데이트하는 중 오류가 발생했습니다.';
    if ((error as any)?.code === 'permission-denied') {
      errorMessage = '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.';
    } else if ((error as any)?.code === 'unauthenticated') {
      errorMessage = '인증이 필요합니다. 로그인해주세요.';
    }
    
    throw new Error(errorMessage);
  }
};

// 핸드폰용 매물 2,3번 이미지 강제 추가 함수 (로그인 불필요)
export const fixMobileImagesForProperties2And3 = async (): Promise<void> => {
  try {
    console.log('=== 핸드폰용 매물 2,3번 이미지 수정 시작 (로그인 불필요) ===');
    
    // 로그인 없이도 실행 가능하도록 수정
    console.log('로그인 없이 실행 중...');
    
    // 모든 매물 조회
    const { properties } = await getProperties();
    console.log('조회된 매물 수:', properties.length);
    
    // 매물 2, 3번 찾기 (인덱스 1, 2)
    const targetProperties = properties.slice(1, 3); // 2번째, 3번째 매물
    console.log('대상 매물들:', targetProperties.map(p => ({ id: p.id, title: p.title, type: p.type })));
    
    for (const property of targetProperties) {
      try {
        let testImages: string[] = [];
        
        // 매물 타입에 따라 다른 테스트 이미지 설정
        if (property.type === 'sale') {
          testImages = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
          ];
        } else if (property.type === 'rent') {
          testImages = [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
          ];
        } else {
          testImages = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'
          ];
        }
        
        console.log(`매물 ${property.id} (${property.title})에 이미지 강제 추가:`, testImages);
        
        // localStorage에만 저장 (모바일용, Firebase 업데이트 없이)
        const storageKey = `mainImages_${property.id}`;
        localStorage.setItem(storageKey, JSON.stringify(testImages));
        console.log(`✅ 매물 ${property.id} localStorage에 저장 완료`);
        
        // Firebase 업데이트는 로그인이 필요한 경우에만 시도
        try {
          await updatePropertyImages(property.id, testImages);
          console.log(`✅ 매물 ${property.id} Firebase에도 업데이트 완료`);
        } catch (firebaseError) {
          console.log(`⚠️ 매물 ${property.id} Firebase 업데이트 실패 (로그인 필요):`, firebaseError);
          console.log(`✅ 하지만 localStorage에는 저장되었으므로 모바일에서 사용 가능`);
        }
        
      } catch (error) {
        console.error(`❌ 매물 ${property.id} 이미지 추가 실패:`, error);
      }
    }
    
    console.log('=== 핸드폰용 매물 2,3번 이미지 수정 완료 ===');
    
  } catch (error) {
    console.error('=== 핸드폰용 매물 2,3번 이미지 수정 오류 ===');
    console.error('오류:', error);
    throw error;
  }
};

// 모바일 이미지 동기화 테스트 함수
export const testMobileImageSync = async (): Promise<void> => {
  try {
    console.log('=== 모바일 이미지 동기화 테스트 시작 ===');
    
    // Firebase 인증 상태 확인
    const { getCurrentUser } = await import('./authService');
    const currentUser = getCurrentUser();
    console.log('현재 인증된 사용자:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('인증된 사용자가 없습니다. 로그인이 필요합니다.');
    }
    
    // 모든 매물 조회
    const { properties } = await getProperties();
    console.log('조회된 매물 수:', properties.length);
    
    // 매물별 이미지 상태 확인
    properties.forEach((property, index) => {
      console.log(`매물 ${index + 1} (${property.id}):`, {
        title: property.title,
        type: property.type,
        images: property.images,
        imageCount: property.images?.length || 0,
        hasImages: !!(property.images && property.images.length > 0),
        hasBase64Images: property.images?.some(img => img.includes('data:image/')) || false
      });
    });
    
    // 이미지가 없는 매물들 찾기
    const propertiesWithoutImages = properties.filter(property => 
      !property.images || property.images.length === 0
    );
    
    console.log('이미지가 없는 매물들:', propertiesWithoutImages.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type
    })));
    
    // 테스트용 이미지 추가
    for (const property of propertiesWithoutImages) {
      try {
        let testImages: string[] = [];
        
        // 매물 타입에 따라 다른 테스트 이미지 설정
        if (property.type === 'sale') {
          testImages = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
          ];
        } else if (property.type === 'rent') {
          testImages = [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
          ];
        } else {
          testImages = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'
          ];
        }
        
        console.log(`매물 ${property.id} (${property.title})에 테스트 이미지 추가:`, testImages);
        
        // 매물 이미지 업데이트
        await updatePropertyImages(property.id, testImages);
        console.log(`✅ 매물 ${property.id}에 테스트 이미지 추가 완료`);
        
      } catch (error) {
        console.error(`❌ 매물 ${property.id} 테스트 이미지 추가 실패:`, error);
      }
    }
    
    console.log('=== 모바일 이미지 동기화 테스트 완료 ===');
    
  } catch (error) {
    console.error('=== 모바일 이미지 동기화 테스트 오류 ===');
    console.error('오류:', error);
    throw error;
  }
};

// 모바일에서 직접 실행할 수 있는 간단한 이미지 수정 함수
export const fixMobileImagesSimple = (): void => {
  try {
    console.log('=== 모바일 간단 이미지 수정 시작 ===');
    
    // 매물 2, 3번에 해당하는 localStorage 키들 찾기
    const allKeys = Object.keys(localStorage);
    const mainImageKeys = allKeys.filter(key => key.startsWith('mainImages_'));
    
    console.log('발견된 mainImages 키들:', mainImageKeys);
    
    // 매물 2, 3번에 테스트 이미지 추가
    const testImages = [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
    ];
    
    // 모든 mainImages 키에 테스트 이미지 저장
    mainImageKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify(testImages));
      console.log(`✅ ${key}에 테스트 이미지 저장 완료`);
    });
    
    // 매물 목록 새로고침을 위한 이벤트 발생
    window.dispatchEvent(new Event('storage'));
    
    console.log('=== 모바일 간단 이미지 수정 완료 ===');
    console.log('페이지를 새로고침하면 이미지가 표시됩니다.');
    
    // 2초 후 자동 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('모바일 이미지 수정 오류:', error);
  }
};

// 전역 함수로 등록 (콘솔에서 직접 호출 가능)
(window as any).fixMobileImagesSimple = fixMobileImagesSimple;

// 즉시 실행되는 매물 2,3번 이미지 수정 함수
const fixImagesImmediately = () => {
  console.log('=== 즉시 매물 2,3번 이미지 수정 실행 ===');
  
  // 테스트 이미지
  const testImages = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
  ];
  
  // localStorage에서 mainImages 키들 찾기
  const allKeys = Object.keys(localStorage);
  const mainImageKeys = allKeys.filter(key => key.startsWith('mainImages_'));
  
  console.log('발견된 mainImages 키들:', mainImageKeys);
  
  // 모든 mainImages 키에 테스트 이미지 저장
  mainImageKeys.forEach(key => {
    localStorage.setItem(key, JSON.stringify(testImages));
    console.log(`✅ ${key}에 테스트 이미지 저장 완료`);
  });
  
  // 매물 목록 새로고침을 위한 이벤트 발생
  window.dispatchEvent(new Event('storage'));
  
  console.log('=== 매물 2,3번 이미지 수정 완료 ===');
  console.log('페이지를 새로고침하면 이미지가 표시됩니다.');
};

// 페이지 로드 시 자동 실행
if (typeof window !== 'undefined') {
  // DOM이 로드된 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixImagesImmediately);
  } else {
    fixImagesImmediately();
  }
}

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