import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Property } from '../types';
import * as IndexedDB from './indexedDB';

const COLLECTION_NAME = 'properties';

class FirebaseSync {
  private unsubscribe: (() => void) | null = null;
  private isOnline: boolean = navigator.onLine;
  private pendingUpdates: Map<string, Property> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    // 온라인/오프라인 상태 감지
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  // Firebase 초기화 및 실시간 동기화 시작
  async initialize(onPropertyUpdate?: (properties: Property[]) => void): Promise<void> {
    try {
      console.log('🔥 Firebase 동기화 초기화 시작...');
      
      // Firebase가 초기화되지 않은 경우 체크
      if (!db) {
        console.warn('⚠️ Firebase가 초기화되지 않음 - IndexedDB만 사용');
        this.isInitialized = true;
        return;
      }
      
      // Firebase 연결 테스트
      console.log('🔍 Firebase 연결 테스트 중...');
      const testQuery = query(collection(db, COLLECTION_NAME));
      const testSnapshot = await getDocs(testQuery);
      console.log('✅ Firebase 연결 성공! 기존 매물 수:', testSnapshot.docs.length);
      
      // 모바일 서버 감지 (GitHub Pages 도메인)
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname.includes('vercel.app');
      
      console.log('🌐 현재 호스트:', window.location.hostname);
      console.log('🖥️ 메인 서버 여부:', isMainServer);
      
      if (isMainServer) {
        console.log('🖥️ PC 메인 서버 감지 - Firebase 초기 데이터 설정');
        // PC 메인 서버: Firebase에 초기 데이터 업로드
        await this.setupMainServer();
      } else {
        console.log('📱 모바일 서버 감지 - Firebase에서 데이터 로드');
        // 모바일 서버: Firebase에서 데이터 로드
        await this.loadFromFirebase();
      }
      
      // 실시간 동기화 설정
      this.setupRealTimeSync(onPropertyUpdate);
      
      // 초기화 완료 플래그 설정
      this.isInitialized = true;
      console.log('✅ Firebase 동기화 초기화 완료!');
      console.log(`🔧 isInitialized 플래그: ${this.isInitialized}`);
      
      // 대기열에 있는 매물들 처리
      if (this.pendingUpdates.size > 0) {
        console.log(`🔄 대기열에 있는 ${this.pendingUpdates.size}개 매물 처리 시작...`);
        const pendingArray = Array.from(this.pendingUpdates.values());
        this.pendingUpdates.clear();
        
        for (const property of pendingArray) {
          try {
            console.log(`📤 대기열 매물 처리: ${property.id} - ${property.title}`);
            await this.syncToFirebase(property);
            console.log(`✅ 대기열 매물 처리 완료: ${property.id}`);
          } catch (error) {
            console.error(`❌ 대기열 매물 처리 실패: ${property.id}`, error);
            // 실패한 매물은 다시 대기열에 추가
            this.pendingUpdates.set(property.id, property);
          }
        }
        console.log('🎉 대기열 처리 완료!');
      }
    } catch (error) {
      console.error('❌ Firebase 초기화 실패:', error);
      console.log('📱 오프라인 모드로 전환 (IndexedDB만 사용)');
      this.isInitialized = true; // 오프라인 모드로 계속 진행
    }
  }

  // Firebase에서 모든 매물 데이터 로드 (이미지 마이그레이션 포함)
  private async loadFromFirebase(): Promise<void> {
    try {
      if (!db) {
        console.warn('Firebase가 초기화되지 않음 - 로드 건너뛰기');
        return;
      }
      
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      
      const firebaseProperties: Property[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Timestamp를 Date로 변환
        const property: Property = {
          ...data,
          id: doc.id,
          createdAt: this.safeConvertTimestamp(data.createdAt),
        } as Property;
        firebaseProperties.push(property);
      });

      console.log(`🔥 Firebase에서 ${firebaseProperties.length}개 매물 로드됨`);

      // Base64 이미지가 있는 매물들을 Firebase Storage로 마이그레이션
      const propertiesWithBase64Images = firebaseProperties.filter(property => 
        property.images && property.images.some(img => img.startsWith('data:image/'))
      );
      
      if (propertiesWithBase64Images.length > 0) {
        console.log(`🔄 ${propertiesWithBase64Images.length}개 매물의 Base64 이미지 마이그레이션 시작...`);
        
        try {
          const { migrateAllPropertyImages } = await import('./imageMigration');
          const migratedProperties = await migrateAllPropertyImages(propertiesWithBase64Images);
          
          // 마이그레이션된 매물들로 업데이트
          const updatedProperties = firebaseProperties.map(property => {
            const migratedProperty = migratedProperties.find(mp => mp.id === property.id);
            return migratedProperty || property;
          });
          
          // 마이그레이션된 데이터를 Firebase에 다시 저장
          for (const property of migratedProperties) {
            await this.updateProperty(property);
          }
          
          console.log('✅ Base64 이미지 마이그레이션 완료');
          
          // IndexedDB에 마이그레이션된 데이터 저장
          for (const property of updatedProperties) {
            await IndexedDB.updateProperty(property);
          }
          
        } catch (error) {
          console.error('❌ 이미지 마이그레이션 실패:', error);
          // 마이그레이션 실패 시 원본 데이터 저장
          for (const property of firebaseProperties) {
            await IndexedDB.updateProperty(property);
          }
        }
      } else {
        // Base64 이미지가 없으면 그대로 저장
        for (const property of firebaseProperties) {
          await IndexedDB.updateProperty(property);
        }
      }

      console.log('📱 Firebase → IndexedDB 동기화 완료');
    } catch (error) {
      console.error('❌ Firebase 로드 실패:', error);
      console.log('📱 Firebase 권한 오류 - IndexedDB 데이터만 사용');
      // 오류를 던지지 않고 계속 진행
    }
  }

  // 실시간 동기화 설정
  private setupRealTimeSync(onPropertyUpdate?: (properties: Property[]) => void): void {
    if (!db) {
      console.warn('Firebase가 초기화되지 않음 - 실시간 동기화 건너뛰기');
      return;
    }
    
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'asc'));
    
    this.unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('🔄 Firebase 실시간 업데이트 감지');
      console.log(`📊 현재 Firebase 매물 수: ${snapshot.docs.length}`);
      
      // P001 특별 디버깅
      const p001Doc = snapshot.docs.find(doc => doc.id === 'P001');
      if (p001Doc) {
        console.log('🔍 P001 Firebase 실시간 감지됨:', p001Doc.data().title);
      } else {
        console.log('⚠️ P001 Firebase 실시간에서 발견되지 않음');
      }
      
      const updatedProperties: Property[] = [];
      
      // 모든 변경사항을 순차적으로 처리
      for (const change of snapshot.docChanges()) {
        try {
          const data = change.doc.data();
          const property: Property = {
            ...data,
            id: change.doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Property;

          if (change.type === 'added' || change.type === 'modified') {
            console.log(`📝 매물 ${change.type}: ${property.id} - ${property.title}`);
            console.log(`📍 위치: ${property.location?.lat}, ${property.location?.lng}`);
            
            // 중복 처리 방지: 이미 처리된 매물인지 확인
            const existingProperty = await IndexedDB.getProperty(property.id);
            if (existingProperty && change.type === 'added') {
              console.log(`⚠️ 매물 ${property.id}이 이미 로컬에 존재 - 수정으로 처리`);
            }
            
            // IndexedDB에 업데이트
            await IndexedDB.updateProperty(property);
            updatedProperties.push(property);
            console.log(`✅ IndexedDB 업데이트 완료: ${property.id}`);
          } else if (change.type === 'removed') {
            console.log(`🗑️ 매물 삭제: ${property.id} - ${property.title}`);
            // IndexedDB에서 삭제
            await IndexedDB.deleteProperty(property.id);
            console.log(`✅ IndexedDB 삭제 완료: ${property.id}`);
          }
        } catch (changeError) {
          console.error(`❌ 매물 ${change.type} 처리 실패:`, changeError);
        }
      }

      // UI 업데이트 콜백 호출 (중복 방지)
      if (onPropertyUpdate) {
        const allProperties = await IndexedDB.getAllProperties();
        // ID 기준으로 중복 제거
        const uniqueProperties = allProperties.filter((property, index, self) => 
          index === self.findIndex(p => p.id === property.id)
        );
        
        console.log('🔄 Firebase 실시간 업데이트 (중복 제거):', {
          원본: allProperties.length,
          중복제거후: uniqueProperties.length,
          제거된중복: allProperties.length - uniqueProperties.length,
          변경된매물수: updatedProperties.length
        });
        
        // P001 특별 디버깅
        const p001InIndexedDB = uniqueProperties.find(p => p.id === 'P001');
        if (p001InIndexedDB) {
          console.log('🔍 P001 IndexedDB에서 발견됨:', p001InIndexedDB.title);
        } else {
          console.log('⚠️ P001 IndexedDB에서 발견되지 않음');
        }
        
        console.log('📊 UI 업데이트할 매물들:', uniqueProperties.map(p => ({ id: p.id, title: p.title })));
        onPropertyUpdate(uniqueProperties);
      }
    }, (error) => {
      console.error('❌ Firebase 실시간 동기화 오류:', error);
      console.log('📱 Firebase 권한 오류 - 실시간 동기화 비활성화');
    });
  }

  // 매물 추가 (Firebase + IndexedDB)
  async addProperty(property: Property): Promise<void> {
    try {
      console.log(`➕ addProperty 시작: ${property.id} - ${property.title}`);
      console.log(`🌐 현재 호스트: ${window.location.hostname}`);
      console.log(`🔧 Firebase 초기화 상태: ${this.isInitialized}`);
      console.log(`🌐 온라인 상태: ${this.isOnline}`);
      console.log(`🔥 Firebase db 객체: ${!!db}`);
      
      // 모바일 서버에서는 추가 불가
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname.includes('vercel.app');
      
      console.log(`🖥️ 메인 서버 여부: ${isMainServer}`);
      
      if (!isMainServer) {
        console.warn('📱 모바일 서버에서는 매물 추가가 불가능합니다.');
        throw new Error('모바일 서버에서는 매물 추가가 불가능합니다.');
      }

      // 매물 데이터 검증
      if (!property.id || !property.title) {
        throw new Error(`매물 데이터 검증 실패: ID=${property.id}, 제목=${property.title}`);
      }

      // 1. IndexedDB에 즉시 저장 (빠른 응답)
      console.log(`💾 IndexedDB 저장 시작: ${property.id}`);
      await IndexedDB.updateProperty(property);
      console.log(`✅ IndexedDB 저장 완료: ${property.id}`);
      
      if (this.isOnline && db) {
        // 2. Firebase에 동기화 (Firebase가 초기화된 경우에만)
        console.log(`🔥 Firebase 동기화 시작: ${property.id}`);
        console.log(`🔧 Firebase 초기화 상태: ${this.isInitialized}`);
        console.log(`🌐 온라인 상태: ${this.isOnline}`);
        console.log(`🔥 Firebase db 객체 존재: ${!!db}`);
        
        try {
          console.log(`📤 syncToFirebase 호출 시작: ${property.id}`);
          await this.syncToFirebase(property);
          console.log(`✅ Firebase 동기화 완료: ${property.id}`);
        } catch (syncError) {
          console.error(`❌ Firebase 동기화 실패: ${property.id}`, syncError);
          console.warn(`⚠️ 대기열에 추가: ${property.id}`);
          this.pendingUpdates.set(property.id, property);
        }
      } else {
        // 3. 오프라인 시 또는 Firebase 없을 때 대기열에 추가
        console.log(`📱 오프라인 모드 - 대기열에 추가: ${property.id}`);
        this.pendingUpdates.set(property.id, property);
      }
      
      console.log(`🎉 addProperty 완료: ${property.id}`);
    } catch (error) {
      console.error(`❌ 매물 추가 실패: ${property.id}`, error);
      throw error;
    }
  }

  // 매물 추가/수정 (Firebase + IndexedDB)
  async updateProperty(property: Property): Promise<void> {
    try {
      console.log(`🔄 updateProperty 시작: ${property.id} - ${property.title}`);
      console.log(`🌐 현재 호스트: ${window.location.hostname}`);
      console.log(`🔧 Firebase 초기화 상태: ${this.isInitialized}`);
      console.log(`🌐 온라인 상태: ${this.isOnline}`);
      console.log(`🔥 Firebase db 객체: ${!!db}`);
      
      // 모바일 서버에서는 수정 불가
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname.includes('vercel.app');
      
      console.log(`🖥️ 메인 서버 여부: ${isMainServer}`);
      
      if (!isMainServer) {
        console.warn('📱 모바일 서버에서는 매물 수정이 불가능합니다.');
        throw new Error('모바일 서버에서는 매물 수정이 불가능합니다.');
      }

      // 매물 데이터 검증
      if (!property.id || !property.title) {
        throw new Error(`매물 데이터 검증 실패: ID=${property.id}, 제목=${property.title}`);
      }
      
      // P001 특별 디버깅
      if (property.id === 'P001') {
        console.log('🔍 P001 특별 디버깅 시작');
        console.log('P001 매물 데이터:', JSON.stringify(property, null, 2));
        console.log('P001 pendingUpdates 상태:', this.pendingUpdates.has('P001'));
        console.log('P001 Firebase 초기화 상태:', this.isInitialized);
        console.log('P001 온라인 상태:', this.isOnline);
        console.log('P001 db 객체 존재:', !!db);
      }
      
      // ID 중복 체크
      if (this.pendingUpdates.has(property.id)) {
        console.warn(`⚠️ 매물 ID 중복 감지: ${property.id} - 대기열에서 제거 후 재시도`);
        this.pendingUpdates.delete(property.id);
      }

      // 1. IndexedDB에 즉시 저장 (빠른 응답)
      console.log(`📱 IndexedDB 저장 시작: ${property.id}`);
      await IndexedDB.updateProperty(property);
      console.log(`✅ IndexedDB 저장 완료: ${property.id}`);
      
      if (this.isOnline && db) {
        // 2. Firebase에 동기화 (Firebase가 초기화된 경우에만)
        console.log(`🔥 Firebase 동기화 시작: ${property.id}`);
        console.log(`🔧 Firebase 초기화 상태: ${this.isInitialized}`);
        console.log(`🌐 온라인 상태: ${this.isOnline}`);
        console.log(`🔥 Firebase db 객체 존재: ${!!db}`);
        
        try {
          console.log(`📤 syncToFirebase 호출 시작: ${property.id}`);
          await this.syncToFirebase(property);
          console.log(`✅ Firebase 동기화 완료: ${property.id}`);
        } catch (syncError) {
          console.error(`❌ Firebase 동기화 실패: ${property.id}`, syncError);
          console.warn(`⚠️ 대기열에 추가: ${property.id}`);
          this.pendingUpdates.set(property.id, property);
        }
      } else {
        // 3. 오프라인 시 또는 Firebase 없을 때 대기열에 추가
        console.log(`📴 Firebase 동기화 건너뛰기 - 온라인: ${this.isOnline}, DB: ${!!db}`);
        this.pendingUpdates.set(property.id, property);
        console.log('📴 오프라인 또는 Firebase 없음: 대기열에 추가됨', property.id);
      }
      
      console.log(`🎉 updateProperty 완료: ${property.id}`);
    } catch (error) {
      console.error(`❌ 매물 업데이트 실패: ${property.id}`, error);
      throw error;
    }
  }

  // 매물 삭제 (Firebase + IndexedDB)
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      // 모바일 서버에서는 삭제 불가
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname.includes('vercel.app');
      
      if (!isMainServer) {
        console.warn('📱 모바일 서버에서는 매물 삭제가 불가능합니다.');
        throw new Error('모바일 서버에서는 매물 삭제가 불가능합니다.');
      }

      // 1. IndexedDB에서 즉시 삭제 (빠른 응답)
      await IndexedDB.deleteProperty(propertyId);
      
      if (this.isOnline && db) {
        // 2. Firebase에서 삭제 (Firebase가 초기화된 경우에만)
        await deleteDoc(doc(db, COLLECTION_NAME, propertyId));
        console.log('🔥 Firebase에서 매물 삭제 완료:', propertyId);
      } else {
        // 3. 오프라인 시 대기열에 추가 (null로 표시하여 삭제 대기)
        this.pendingUpdates.set(propertyId, null as any);
        console.log('📴 오프라인: 삭제 대기열에 추가됨', propertyId);
      }
    } catch (error) {
      console.error('매물 삭제 실패:', error);
      throw error;
    }
  }

  // 수동으로 모든 중복 매물 강제 삭제 (P001, P002, P003, P004만 유지)
  async forceCleanAllDuplicates(): Promise<void> {
    try {
      if (!db) return;
      
      console.log('🔥 강제 중복 매물 정리 시작...');
      
      // Firebase에서 직접 모든 매물 조회
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allProperties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Property));
      
      console.log(`📊 현재 Firebase 매물 수: ${allProperties.length}`);
      console.log('📋 현재 매물들:', allProperties.map(p => p.id));
      
      // P001, P002, P003, P004가 아닌 모든 매물 삭제
      const keepIds = ['P001', 'P002', 'P003', 'P004'];
      const toDelete = allProperties.filter((prop: Property) => !keepIds.includes(prop.id));
      
      if (toDelete.length === 0) {
        console.log('✅ 정리할 중복 매물 없음');
        return;
      }
      
      console.log(`🗑️ 삭제할 매물 ${toDelete.length}개:`, toDelete.map(p => p.id));
      
      // 배치로 모든 중복 매물 삭제
      const batch = writeBatch(db);
      for (const property of toDelete) {
        const propertyRef = doc(db, COLLECTION_NAME, property.id);
        batch.delete(propertyRef);
        console.log(`📝 삭제 대기열: ${property.id}`);
      }
      
      await batch.commit();
      console.log(`🎉 ${toDelete.length}개 중복 매물 강제 삭제 완료!`);
      
    } catch (error) {
      console.error('❌ 강제 정리 실패:', error);
    }
  }

  // 중복 매물 정리 (P001, P002, P003, P004만 유지)
  private async cleanDuplicateProperties(): Promise<void> {
    try {
      if (!db) return;
      
      console.log('🧹 중복 매물 정리 시작...');
      
      // Firebase에서 직접 모든 매물 조회
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allProperties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Property));
      
      console.log(`📊 현재 Firebase 매물 수: ${allProperties.length}`);
      console.log('📋 현재 매물들:', allProperties.map(p => p.id));
      
      // 유지할 매물 ID들 (P001, P002, P003, P004만 유지)
      const keepIds = ['P001', 'P002', 'P003', 'P004'];
      
      // 삭제할 매물들 찾기 (UUID가 붙은 매물들도 모두 삭제)
      const toDelete = allProperties.filter((prop: Property) => {
        // P001, P002, P003, P004만 유지
        const shouldKeep = keepIds.includes(prop.id);
        
        if (!shouldKeep) {
          console.log(`🗑️ 삭제 대상: ${prop.id} (${prop.title || '제목 없음'})`);
        } else {
          console.log(`✅ 유지: ${prop.id} (${prop.title || '제목 없음'})`);
        }
        
        return !shouldKeep;
      });
      
      if (toDelete.length === 0) {
        console.log('✅ 정리할 중복 매물 없음');
        return;
      }
      
      console.log(`🗑️ 삭제할 중복 매물 ${toDelete.length}개:`, toDelete.map(p => p.id));
      
      // 중복 매물들 삭제 (배치 처리)
      const batch = writeBatch(db);
      let deleteCount = 0;
      
      for (const property of toDelete) {
        try {
          const propertyRef = doc(db, COLLECTION_NAME, property.id);
          batch.delete(propertyRef);
          deleteCount++;
          console.log(`📝 삭제 대기열 추가: ${property.id}`);
        } catch (error) {
          console.error(`❌ 삭제 대기열 추가 실패: ${property.id}`, error);
        }
      }
      
      if (deleteCount > 0) {
        await batch.commit();
        console.log(`✅ ${deleteCount}개 매물 삭제 완료!`);
      }
      
      console.log('🎉 중복 매물 정리 완료!');
      
    } catch (error) {
      console.error('❌ 중복 매물 정리 실패:', error);
    }
  }

  // undefined 값 제거 함수 (Firebase 호환성)
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  // Firebase에 동기화
  private async syncToFirebase(property: Property): Promise<void> {
    try {
      if (!db) {
        console.warn('Firebase가 초기화되지 않음 - 동기화 건너뛰기');
        // 대기열에 추가
        this.pendingUpdates.set(property.id, property);
        return;
      }
      
      console.log('🔥 Firebase 동기화 시작:', property.id, property.title);
      console.log('📐 면적 정보:', `${Math.round(property.area / 3.3058)}평 (${property.area.toFixed(2)}㎡)`);
      console.log('📍 위치 정보:', property.location.lat, property.location.lng);
      
      // P001 특별 디버깅
      if (property.id === 'P001') {
        console.log('🔍 P001 syncToFirebase 디버깅 시작');
        console.log('P001 Firebase db 객체:', !!db);
        console.log('P001 매물 전체 데이터:', JSON.stringify(property, null, 2));
      }
      
      // 매물 데이터 검증
      if (!property.id || !property.title || !property.address) {
        throw new Error(`매물 데이터 검증 실패: ID=${property.id}, 제목=${property.title}, 주소=${property.address}`);
      }
      
      // Firebase 문서 ID 검증
      console.log(`🔍 Firebase ID 검증: "${property.id}" (길이: ${property.id.length})`);
      
      if (property.id.length === 0 || property.id.length > 1500) {
        throw new Error(`Firebase 문서 ID 길이 오류: ${property.id.length} (1-1500자 허용)`);
      }
      
      // Firebase 문서 ID 문자 검증
      const idPattern = /^[a-zA-Z0-9_-]+$/;
      if (!idPattern.test(property.id)) {
        console.error(`❌ Firebase ID 형식 오류: "${property.id}" - 허용되지 않는 문자 포함`);
        throw new Error(`Firebase 문서 ID 형식 오류: ${property.id} (영문, 숫자, _, - 만 허용)`);
      }
      
      console.log(`✅ Firebase ID 검증 통과: "${property.id}"`);
      
      // ID 중복 체크
      if (this.pendingUpdates.has(property.id)) {
        console.warn(`⚠️ 매물 ID 중복 감지: ${property.id} - 대기열에서 제거 후 재시도`);
        this.pendingUpdates.delete(property.id);
      }
      
      console.log(`✅ 매물 ID 검증 통과: ${property.id}`);
      
      // 저장 전 Firebase 상태 확인
      console.log('🔍 저장 전 Firebase 상태 확인...');
      const beforeSnapshot = await getDocs(query(collection(db, COLLECTION_NAME)));
      console.log(`📊 저장 전 Firebase 매물 수: ${beforeSnapshot.docs.length}`);
      beforeSnapshot.docs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ID: ${doc.id}, 제목: ${doc.data().title}`);
      });
      
      const propertyData = {
        ...property,
        createdAt: property.createdAt ? Timestamp.fromDate(property.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, COLLECTION_NAME, property.id);
      console.log('📄 Firebase 문서 참조 생성:', docRef.path);
      
      // 재시도 로직 추가 (최대 3회)
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔥 Firebase setDoc 시도 ${retryCount + 1}/${maxRetries}:`, property.id);
          console.log('📊 저장할 데이터 요약:', {
            id: property.id,
            title: property.title,
            address: property.address,
            location: property.location,
            createdAt: property.createdAt
          });
          console.log('📄 문서 경로:', docRef.path);
          console.log('🔧 merge 옵션: true');
          
      // undefined 값 제거 (Firebase 호환성)
      const cleanPropertyData = this.removeUndefinedValues(propertyData);
      
      // P001 특별 디버깅 - setDoc 전
      if (property.id === 'P001') {
        console.log('🔍 P001 setDoc 실행 전 디버깅');
        console.log('P001 docRef.path:', docRef.path);
        console.log('P001 원본 propertyData:', JSON.stringify(propertyData, null, 2));
        console.log('P001 정리된 propertyData:', JSON.stringify(cleanPropertyData, null, 2));
      }
          
          // setDoc 실행 전후 시간 측정
          const startTime = Date.now();
          await setDoc(docRef, cleanPropertyData, { merge: true });
          const endTime = Date.now();
          
          console.log(`✅ Firebase setDoc 성공: ${property.id} (소요시간: ${endTime - startTime}ms)`);
          
          // P001 특별 디버깅 - setDoc 후
          if (property.id === 'P001') {
            console.log('🔍 P001 setDoc 실행 후 디버깅');
            console.log('P001 setDoc 성공 확인');
          }
          
          // 저장 후 즉시 확인 (여러 방법으로 검증)
          console.log('🔍 Firebase 저장 확인 시작...');
          
          // 방법 1: 전체 컬렉션 조회
          const verifyDoc = await getDocs(query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc')));
          console.log(`📊 방법 1 - 전체 조회: 총 ${verifyDoc.docs.length}개 매물 존재`);
          
          // 방법 2: 특정 문서 직접 조회
          const directDoc = await getDocs(query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc')));
          const directProperty = directDoc.docs.find(doc => doc.id === property.id);
          
          // 방법 3: ID로 직접 접근 시도
          try {
            const directAccess = await getDocs(query(collection(db, COLLECTION_NAME)));
            const directAccessProperty = directAccess.docs.find(doc => doc.id === property.id);
            console.log(`📊 방법 3 - 직접 접근: ${directAccessProperty ? '발견됨' : '발견 안됨'}`);
          } catch (directError) {
            console.error('❌ 방법 3 - 직접 접근 실패:', directError);
          }
          
          if (directProperty) {
            console.log(`✅ 매물 ${property.id} Firebase 저장 확인됨:`, directProperty.data().title);
            console.log(`📅 생성일: ${directProperty.data().createdAt?.toDate?.()}`);
            console.log(`🔄 업데이트일: ${directProperty.data().updatedAt?.toDate?.()}`);
          } else {
            console.error(`❌ 매물 ${property.id} Firebase 저장 확인 실패!`);
            console.log('🔍 현재 Firebase에 있는 모든 매물:');
            verifyDoc.docs.forEach((doc, index) => {
              console.log(`  ${index + 1}. ID: ${doc.id}, 제목: ${doc.data().title}, 생성일: ${doc.data().createdAt?.toDate?.()}`);
            });
            throw new Error(`매물 ${property.id}가 Firebase에 저장되지 않았습니다.`);
          }
          
          break; // 성공 시 루프 종료
        } catch (retryError) {
          retryCount++;
          console.error(`❌ Firebase 동기화 오류 ${retryCount}/${maxRetries}:`, property.id, retryError);
          console.error('오류 상세 정보:', {
            name: (retryError as Error).name,
            message: (retryError as Error).message,
            code: (retryError as any).code,
            stack: (retryError as Error).stack
          });
          
          if (retryCount >= maxRetries) {
            console.error(`💥 최대 재시도 횟수 초과: ${property.id}`);
            throw retryError; // 최대 재시도 횟수 초과 시 에러 던지기
          }
          
          // 재시도 전 대기 (지수 백오프)
          const waitTime = Math.pow(2, retryCount) * 100;
          console.log(`⏳ ${waitTime}ms 대기 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // 대기열에서 제거
      this.pendingUpdates.delete(property.id);
      
    } catch (error) {
      console.error('❌ Firebase 동기화 실패:', property.id, error);
      console.log('📱 Firebase 오류 - 대기열에 추가하여 나중에 재시도');
      // 실패 시 대기열에 추가
      this.pendingUpdates.set(property.id, property);
      // 오류를 다시 던져서 상위에서 처리할 수 있도록 함
      throw error;
    }
  }

  // 온라인 복구 시 대기 중인 업데이트 동기화
  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    console.log('🌐 온라인 복구: 대기 중인 업데이트 동기화 시작');
    
    const updates = new Map(this.pendingUpdates);
    this.pendingUpdates.clear();
    
    // Map을 Array로 변환하여 반복
    const updatesArray = Array.from(updates.entries());
    for (const [propertyId, property] of updatesArray) {
      try {
        if (property === null) {
          // 삭제 대기 중인 항목
          await deleteDoc(doc(db, COLLECTION_NAME, propertyId));
          console.log('🗑️ 대기 중인 삭제 완료:', propertyId);
        } else {
          // 업데이트 대기 중인 항목
          await this.syncToFirebase(property);
        }
      } catch (error) {
        console.error('동기화 실패:', propertyId, error);
        // 실패한 것은 다시 대기열에 추가
        this.pendingUpdates.set(propertyId, property);
      }
    }
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log('📴 오프라인 모드: IndexedDB만 사용');
  }

  // 초기 데이터 Firebase에 업로드 (한 번만 실행)
  async uploadInitialData(properties: Property[]): Promise<void> {
    try {
      console.log('🚀 초기 데이터를 Firebase에 업로드 중...');
      
      for (const property of properties) {
        await this.syncToFirebase(property);
      }
      
      console.log('✅ 초기 데이터 업로드 완료!');
    } catch (error) {
      console.error('초기 데이터 업로드 실패:', error);
      throw error;
    }
  }

  // 특정 매물의 좌표 수정 (디버깅용)
  async updatePropertyCoordinates(propertyId: string, newLat: number, newLng: number): Promise<void> {
    try {
      console.log(`🔄 매물 ${propertyId}의 좌표를 ${newLat}, ${newLng}로 수정 중...`);
      
      if (!db) {
        console.warn('❌ Firebase가 초기화되지 않음');
        return;
      }
      
      const propertyRef = doc(db, COLLECTION_NAME, propertyId);
      await setDoc(propertyRef, {
        location: { lat: newLat, lng: newLng }
      }, { merge: true });
      
      console.log(`✅ 매물 ${propertyId} 좌표 수정 완료: ${newLat}, ${newLng}`);
    } catch (error) {
      console.error('❌ 좌표 수정 실패:', error);
    }
  }

  // Firebase 데이터 상태 확인 (디버깅용)
  async checkFirebaseData(): Promise<void> {
    console.log('🚀 checkFirebaseData 함수 시작됨');
    
    try {
      console.log('🔧 Firebase db 객체 확인:', !!db);
      console.log('🔧 COLLECTION_NAME:', COLLECTION_NAME);
      
      if (!db) {
        console.warn('❌ Firebase가 초기화되지 않음');
        return;
      }
      
      console.log('🔍 Firebase 데이터 상태 확인 중...');
      
      const propertiesCollection = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(propertiesCollection);
      
      console.log(`📊 Firebase에 총 ${snapshot.docs.length}개의 매물이 있습니다:`);
      
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}`);
        console.log(`   제목: ${data.title}`);
        console.log(`   주소: ${data.address}`);
        console.log(`   가격: ${data.price?.toLocaleString()}원`);
        console.log(`   생성일: ${data.createdAt?.toDate?.() || 'N/A'}`);
        console.log('---');
      });
      
      if (snapshot.docs.length === 0) {
        console.log('⚠️ Firebase에 데이터가 없습니다!');
      }
      
    } catch (error) {
      console.error('Firebase 데이터 확인 실패:', error);
    }
  }

  // 모든 데이터 초기화 (실제 매물 추가 전 정리용)
  async clearAllData(): Promise<void> {
    try {
      console.log('🗑️ Firebase에서 모든 데이터를 초기화 중...');
      
      const propertiesCollection = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(propertiesCollection);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('✅ Firebase 데이터 초기화 완료!');
    } catch (error) {
      console.error('❌ Firebase 데이터 초기화 실패:', error);
      throw error;
    }
  }

  // 데이터베이스 완전 초기화 (IndexedDB + Firebase)
  async resetAllData(): Promise<void> {
    try {
      console.log('🔄 전체 데이터베이스 초기화 시작...');
      
      // Firebase 데이터 초기화
      await this.clearAllData();
      
      // IndexedDB 데이터 초기화
      const { clearAllProperties } = await import('./indexedDB');
      await clearAllProperties();
      
      console.log('✅ 전체 데이터베이스 초기화 완료!');
    } catch (error) {
      console.error('❌ 전체 데이터베이스 초기화 실패:', error);
      throw error;
    }
  }

  // PC 메인 서버 설정
  private async setupMainServer(): Promise<void> {
    try {
      console.log('🖥️ PC 메인 서버 설정 시작...');
      
      // 1. IndexedDB에서 로컬 데이터 확인
      const localProperties = await IndexedDB.getAllProperties();
      console.log(`📱 로컬 IndexedDB 매물 수: ${localProperties.length}`);
      
      // 2. Firebase에서 기존 데이터 확인
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      console.log(`🔥 Firebase 매물 수: ${querySnapshot.docs.length}`);
      
      if (querySnapshot.empty && localProperties.length > 0) {
        console.log('🚀 Firebase가 비어있고 로컬에 데이터 있음 - 업로드 시작');
        // Firebase가 비어있고 로컬에 데이터가 있으면 업로드
        await this.uploadInitialData(localProperties);
      } else if (querySnapshot.docs.length > 0) {
        console.log('📊 Firebase에 데이터 존재 - 양방향 동기화');
        // Firebase에 데이터가 있으면 양방향 동기화
        await this.syncBidirectional(localProperties, querySnapshot);
      } else {
        console.log('📭 Firebase와 로컬 모두 비어있음 - 첫 매물 등록 대기');
        // 둘 다 비어있으면 첫 매물 등록을 위한 준비
        console.log('🔧 첫 매물 등록을 위한 Firebase 준비 완료');
      }
    } catch (error) {
      console.error('❌ PC 메인 서버 설정 실패:', error);
      console.log('📱 Firebase 권한 오류 - IndexedDB만 사용하여 계속 진행');
      // 오류를 던지지 않고 계속 진행
    }
  }

  // 양방향 동기화 (PC 메인 서버용)
  private async syncBidirectional(localProperties: Property[], firebaseSnapshot: any): Promise<void> {
    try {
      console.log('🔄 양방향 동기화 시작...');
      
      // Firebase 데이터를 Property 배열로 변환
      const firebaseProperties: Property[] = firebaseSnapshot.docs.map((doc: any) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      
      console.log(`📊 로컬: ${localProperties.length}개, Firebase: ${firebaseProperties.length}개`);
      
      // 로컬에만 있는 매물들을 Firebase에 업로드 (중복 방지)
      const localOnly = localProperties.filter(local => 
        !firebaseProperties.some(firebase => firebase.id === local.id)
      );
      
      if (localOnly.length > 0) {
        console.log(`📤 로컬에만 있는 ${localOnly.length}개 매물을 Firebase에 업로드...`);
        for (const property of localOnly) {
          // 중복 업로드 방지: 대기열에 있는지 확인
          if (!this.pendingUpdates.has(property.id)) {
            console.log(`📤 업로드 중: ${property.id} - ${property.title}`);
            await this.syncToFirebase(property);
          } else {
            console.log(`⏳ 이미 업로드 대기 중: ${property.id} - 건너뛰기`);
          }
        }
      }
      
      // Firebase에만 있는 매물들을 로컬에 저장
      const firebaseOnly = firebaseProperties.filter(firebase => 
        !localProperties.some(local => local.id === firebase.id)
      );
      
      if (firebaseOnly.length > 0) {
        console.log(`📥 Firebase에만 있는 ${firebaseOnly.length}개 매물을 로컬에 저장...`);
        for (const property of firebaseOnly) {
          await IndexedDB.updateProperty(property);
        }
      }
      
      console.log('✅ 양방향 동기화 완료!');
    } catch (error) {
      console.error('❌ 양방향 동기화 실패:', error);
    }
  }

  // 연결 해제
  disconnect(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('🔌 Firebase 연결 해제됨');
    }
  }

  // 안전한 Timestamp 변환 함수
  private safeConvertTimestamp(timestamp: any): Date {
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
  }

  // 수동 동기화 (사용자가 직접 호출)
  async manualSync(): Promise<void> {
    try {
      console.log('🔄 수동 동기화 시작...');
      
      if (!db) {
        console.warn('⚠️ Firebase가 초기화되지 않음');
        return;
      }
      
      // 1. Firebase에서 최신 데이터 가져오기
      console.log('📥 Firebase에서 최신 데이터 가져오는 중...');
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      
      console.log(`📊 Firebase에서 ${querySnapshot.docs.length}개 매물 발견`);
      
      // 2. IndexedDB와 비교하여 동기화
      const firebaseProperties: Property[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const property: Property = {
          ...data,
          id: doc.id,
          createdAt: this.safeConvertTimestamp(data.createdAt),
        } as Property;
        firebaseProperties.push(property);
      });

      // 3. IndexedDB에 저장
      for (const property of firebaseProperties) {
        await IndexedDB.updateProperty(property);
        console.log('✅ 동기화됨:', property.id, property.title);
      }
      
      console.log('🎉 수동 동기화 완료!');
      
    } catch (error) {
      console.error('❌ 수동 동기화 실패:', error);
      throw error;
    }
  }

  // 상태 확인
  getStatus(): { isOnline: boolean; isInitialized: boolean; pendingCount: number } {
    return {
      isOnline: this.isOnline,
      isInitialized: this.isInitialized,
      pendingCount: this.pendingUpdates.size
    };
  }
}

export const firebaseSync = new FirebaseSync(); 