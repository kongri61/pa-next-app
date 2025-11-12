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
        await this.loadFromFirebase(onPropertyUpdate);
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
  private async loadFromFirebase(onPropertyUpdate?: (properties: Property[]) => void): Promise<void> {
    try {
      if (!db) {
        console.warn('Firebase가 초기화되지 않음 - 로드 건너뛰기');
        return;
      }
      
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      
      const firebaseProperties: Property[] = [];
      const rawDataMap = new Map<string, any>(); // 원본 데이터 저장용
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rawDataMap.set(doc.id, data); // 원본 데이터 저장
        
        // Timestamp를 Date로 변환
        // contact 객체를 명시적으로 복사하여 photo 필드가 누락되지 않도록 함
        const property: Property = {
          ...data,
          id: doc.id,
          createdAt: this.safeConvertTimestamp(data.createdAt),
          // contact 객체를 명시적으로 복사 (모든 필드 보존)
          contact: data.contact ? {
            ...data.contact,
            // companyName 명시적으로 보존
            companyName: data.contact.companyName || undefined,
            // name 명시적으로 보존
            name: data.contact.name || undefined,
            // phone 명시적으로 보존
            phone: data.contact.phone || undefined,
            // phone2 명시적으로 보존
            phone2: data.contact.phone2 || undefined,
            // email 명시적으로 보존
            email: data.contact.email || undefined,
            // photo 필드 처리: Firebase Storage URL, Base64, HTTP/HTTPS URL은 유지, 상대 경로는 절대 URL로 변환
            photo: (() => {
              const photo = data.contact.photo;
              if (!photo || typeof photo !== 'string') return undefined;
              // 상대 경로인 경우 절대 URL로 변환 (PC 사이트의 정적 파일 경로)
              if (photo.startsWith('/') && !photo.startsWith('//')) {
                // PC 사이트의 base URL과 결합
                // 환경 변수에서 가져오거나, 기본값으로 실제 PC 사이트 Vercel URL 사용
                const pcSiteUrl = process.env.REACT_APP_PC_SITE_URL || 
                                 'https://pa-realestate-pc.vercel.app';
                const absoluteUrl = `${pcSiteUrl}${photo}`;
                console.log(`📷 매물 ${doc.id}: 상대 경로 프로필 사진을 절대 URL로 변환:`, {
                  relative: photo,
                  absolute: absoluteUrl,
                  pcSiteUrl: pcSiteUrl
                });
                return absoluteUrl;
              }
              // Firebase Storage URL, Base64, HTTP/HTTPS URL은 유지
              return photo;
            })(),
            // phones 배열도 명시적으로 복사
            phones: data.contact.phones || (data.contact.phone ? [data.contact.phone] : []),
          } : data.contact,
          // 매물정보 필드 명시적으로 보존
          maintenanceIncluded: data.maintenanceIncluded || undefined,
          propertyStatus: data.propertyStatus || undefined,
          parkingCount: data.parkingCount || undefined,
          recommendedBusiness: data.recommendedBusiness || undefined,
          keyMoney: data.keyMoney || undefined,
          loanAmount: data.loanAmount || undefined,
          keyDepositMonthly: data.keyDepositMonthly || undefined,
          bedrooms: data.bedrooms || undefined,
          bathrooms: data.bathrooms || undefined,
          maintenanceFee: data.maintenanceFee || undefined,
          propertyType: data.propertyType || undefined,
          mapImage: data.mapImage || undefined,
        } as Property;
        
        // 디버깅: 모든 필수 필드 확인
        const rawContact = data.contact || null;
        const hasPhoto = rawContact && rawContact.photo;
        const rawPhoto = rawContact?.photo;
        
        console.log(`📋 Firebase에서 로드된 매물 ${doc.id}:`, {
          title: property.title,
          // 매물정보 필드
          maintenanceIncluded: property.maintenanceIncluded || '없음',
          propertyStatus: property.propertyStatus || '없음',
          parkingCount: property.parkingCount || '없음',
          recommendedBusiness: property.recommendedBusiness || '없음',
          propertyType: property.propertyType || '없음',
          // 연락처 필드 (상세 디버깅)
          hasContact: !!property.contact,
          hasRawContact: !!rawContact,
          rawContactKeys: rawContact ? Object.keys(rawContact) : [],
          contact: property.contact ? {
            companyName: property.contact.companyName || '없음',
            name: property.contact.name || '없음',
            phone: property.contact.phone || '없음',
            phones: property.contact.phones || '없음',
            email: property.contact.email || '없음',
            hasPhoto: !!property.contact.photo,
            photoType: property.contact.photo ? (
              property.contact.photo.startsWith('data:') ? 'Base64' : 
              (property.contact.photo.includes('firebasestorage.googleapis.com') ? 'Firebase Storage' : 
              (property.contact.photo.startsWith('http://') || property.contact.photo.startsWith('https://') ? 'HTTP/HTTPS URL' : '기타'))
            ) : '없음',
            photoLength: property.contact.photo?.length || 0,
            photo: property.contact.photo ? property.contact.photo.substring(0, 200) + '...' : '없음',
            // 실제 프로필 사진 URL 전체 (처음 200자만)
            photoFullUrl: property.contact.photo ? property.contact.photo.substring(0, 200) : '없음'
          } : '없음',
          // 원본 Firebase 데이터의 contact.photo 확인 (변환 전)
          rawContactPhoto: rawPhoto ? (typeof rawPhoto === 'string' ? {
            type: rawPhoto.startsWith('/') ? '상대 경로' : 
                  (rawPhoto.startsWith('data:') ? 'Base64' : 
                  (rawPhoto.includes('firebasestorage.googleapis.com') ? 'Firebase Storage' : 
                  (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://') ? 'HTTP/HTTPS URL' : '기타'))),
            value: rawPhoto.substring(0, 200) + '...',
            length: rawPhoto.length
          } : typeof rawPhoto) : '없음',
          // 변환 후 프로필 사진 URL
          convertedPhoto: property.contact?.photo ? {
            type: property.contact.photo.startsWith('data:') ? 'Base64' : 
                  (property.contact.photo.includes('firebasestorage.googleapis.com') ? 'Firebase Storage' : 
                  (property.contact.photo.startsWith('http://') || property.contact.photo.startsWith('https://') ? 'HTTP/HTTPS URL' : '기타')),
            value: property.contact.photo.substring(0, 200) + '...',
            length: property.contact.photo.length
          } : '없음',
          // 위치정보
          hasMapImage: !!property.mapImage,
          mapImage: property.mapImage ? property.mapImage.substring(0, 50) + '...' : '없음',
          // Firebase에 실제로 저장된 모든 필드
          allFields: Object.keys(data)
        });
        
        firebaseProperties.push(property);
      });

      console.log(`🔥 Firebase에서 ${firebaseProperties.length}개 매물 로드됨`);

      // 모바일에서는 Firebase 데이터로 IndexedDB를 완전히 교체
      // 1. 기존 IndexedDB의 모든 매물 가져오기
      const existingProperties = await IndexedDB.getAllProperties();
      console.log(`📱 기존 IndexedDB 매물 수: ${existingProperties.length}`);
      
      // 2. Firebase에 없는 매물들을 IndexedDB에서 삭제
      const firebaseIds = new Set(firebaseProperties.map(p => p.id));
      const toDelete = existingProperties.filter(p => !firebaseIds.has(p.id));
      
      if (toDelete.length > 0) {
        console.log(`🗑️ Firebase에 없는 ${toDelete.length}개 매물을 IndexedDB에서 삭제...`);
        console.log(`🗑️ 삭제할 매물 ID: ${toDelete.map(p => p.id).join(', ')}`);
        for (const property of toDelete) {
          try {
            await IndexedDB.deleteProperty(property.id);
            console.log(`  ✅ 삭제 완료: ${property.id} - ${property.title}`);
          } catch (deleteError) {
            console.error(`  ❌ 삭제 실패: ${property.id}`, deleteError);
          }
        }
      } else if (firebaseProperties.length === 0 && existingProperties.length > 0) {
        // Firebase가 비어있고 IndexedDB에 데이터가 있으면 모두 삭제
        console.log(`⚠️ Firebase가 비어있음 - IndexedDB의 모든 매물 삭제...`);
        console.log(`🗑️ 삭제할 매물 ID: ${existingProperties.map(p => p.id).join(', ')}`);
        for (const property of existingProperties) {
          try {
            await IndexedDB.deleteProperty(property.id);
            console.log(`  ✅ 삭제 완료: ${property.id} - ${property.title}`);
          } catch (deleteError) {
            console.error(`  ❌ 삭제 실패: ${property.id}`, deleteError);
          }
        }
      }
      
      // 3. IndexedDB에 있는 모든 매물을 가져와서 Firebase와 비교 (이중 체크)
      const allIndexedDBAfterDelete = await IndexedDB.getAllProperties();
      const stillToDelete = allIndexedDBAfterDelete.filter(p => !firebaseIds.has(p.id));
      if (stillToDelete.length > 0) {
        console.log(`⚠️ 이중 체크: 여전히 ${stillToDelete.length}개 매물이 남아있음 - 강제 삭제...`);
        console.log(`🗑️ 강제 삭제할 매물 ID:`, stillToDelete.map(p => p.id));
        for (const property of stillToDelete) {
          try {
            await IndexedDB.deleteProperty(property.id);
            console.log(`  ✅ 강제 삭제 완료: ${property.id} - ${property.title}`);
          } catch (deleteError) {
            console.error(`  ❌ 강제 삭제 실패: ${property.id}`, deleteError);
          }
        }
      }
      
      // 4. 최종 확인: IndexedDB에 Firebase에 없는 매물이 남아있는지 다시 확인
      const finalCheck = await IndexedDB.getAllProperties();
      const finalToDelete = finalCheck.filter(p => !firebaseIds.has(p.id));
      if (finalToDelete.length > 0) {
        console.log(`⚠️ 최종 체크: ${finalToDelete.length}개 매물이 여전히 남아있음 - 재시도...`);
        console.log(`🗑️ 최종 삭제할 매물 ID:`, finalToDelete.map(p => p.id));
        for (const property of finalToDelete) {
          try {
            await IndexedDB.deleteProperty(property.id);
            console.log(`  ✅ 최종 삭제 완료: ${property.id} - ${property.title}`);
          } catch (deleteError) {
            console.error(`  ❌ 최종 삭제 실패: ${property.id}`, deleteError);
          }
        }
      }

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
          
          // IndexedDB에 마이그레이션된 데이터 저장 (Firebase에 있는 것만)
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
        // Base64 이미지가 없으면 그대로 저장 (Firebase에 있는 것만)
        for (const property of firebaseProperties) {
          // 디버깅: IndexedDB 저장 전 필드 확인
          console.log(`💾 IndexedDB 저장 전 매물 ${property.id} 필드 확인:`, {
            hasContact: !!property.contact,
            contact: property.contact,
            hasContactPhoto: !!property.contact?.photo,
            contactPhotoType: property.contact?.photo ? (property.contact.photo.startsWith('data:') ? 'Base64' : 'URL') : '없음',
            contactPhotoLength: property.contact?.photo?.length || 0,
            hasMapImage: !!property.mapImage,
            mapImage: property.mapImage ? property.mapImage.substring(0, 50) + '...' : '없음'
          });
          
          // contact.photo가 있는지 다시 한 번 확인하고 명시적으로 보존
          const originalData = rawDataMap.get(property.id);
          if (property.contact && !property.contact.photo && originalData?.contact?.photo) {
            // 상대 경로가 아닌 경우에만 복원
            if (!originalData.contact.photo.startsWith('/')) {
              console.warn(`⚠️ 매물 ${property.id}: contact.photo가 누락됨 - 원본 데이터에서 복원 시도`);
              property.contact.photo = originalData.contact.photo;
            } else {
              console.warn(`⚠️ 매물 ${property.id}: contact.photo가 상대 경로 형식 - 제거됨:`, originalData.contact.photo);
              // 상대 경로는 제거 (유효하지 않은 형식)
              property.contact.photo = undefined;
            }
          } else if (property.contact?.photo && property.contact.photo.startsWith('/')) {
            // 상대 경로인 경우 제거
            console.warn(`⚠️ 매물 ${property.id}: contact.photo가 상대 경로 형식 - 제거됨:`, property.contact.photo);
            property.contact.photo = undefined;
          }
          
          await IndexedDB.updateProperty(property);
          
          // 저장 후 확인
          const savedProperty = await IndexedDB.getProperty(property.id);
          console.log(`✅ IndexedDB 저장 후 매물 ${property.id} 확인:`, {
            hasContact: !!savedProperty?.contact,
            hasContactPhoto: !!savedProperty?.contact?.photo,
            contactPhotoLength: savedProperty?.contact?.photo?.length || 0
          });
        }
      }

      // 최종 확인: IndexedDB의 매물 수 확인
      const finalProperties = await IndexedDB.getAllProperties();
      console.log(`📱 최종 IndexedDB 매물 수: ${finalProperties.length}개 (Firebase와 동일해야 함)`);
      console.log('📱 Firebase → IndexedDB 동기화 완료');
      
      // 콜백이 있으면 즉시 UI 업데이트 (Firebase 데이터 직접 사용)
      if (onPropertyUpdate) {
        console.log('🔄 초기 로드 후 UI 업데이트 호출');
        console.log(`📊 Firebase에서 가져온 매물 수: ${firebaseProperties.length}개`);
        console.log(`📋 Firebase 매물 ID: ${firebaseProperties.map(p => p.id).join(', ')}`);
        // IndexedDB가 아닌 Firebase 데이터를 직접 전달
        onPropertyUpdate(firebaseProperties);
      }
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
      console.log(`📋 Firebase 매물 ID 목록:`, snapshot.docs.map(doc => doc.id));
      
      // 모바일 서버인 경우: 먼저 Firebase에 없는 매물을 IndexedDB에서 삭제
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname.includes('vercel.app');
      
      if (!isMainServer) {
        // 모바일 서버: Firebase 스냅샷과 IndexedDB를 먼저 동기화
        const firebaseIds = new Set(snapshot.docs.map(doc => doc.id));
        const allIndexedDBProperties = await IndexedDB.getAllProperties();
        const toDeleteFromIndexedDB = allIndexedDBProperties.filter(p => !firebaseIds.has(p.id));
        
        if (toDeleteFromIndexedDB.length > 0) {
          console.log(`🗑️ 실시간 동기화: Firebase에 없는 ${toDeleteFromIndexedDB.length}개 매물을 IndexedDB에서 삭제...`);
          console.log(`🗑️ 삭제할 매물 ID:`, toDeleteFromIndexedDB.map(p => p.id));
          for (const property of toDeleteFromIndexedDB) {
            try {
              await IndexedDB.deleteProperty(property.id);
              console.log(`  ✅ 삭제 완료: ${property.id} - ${property.title}`);
            } catch (deleteError) {
              console.error(`  ❌ 삭제 실패: ${property.id}`, deleteError);
            }
          }
        } else if (snapshot.docs.length === 0 && allIndexedDBProperties.length > 0) {
          // Firebase가 비어있고 IndexedDB에 데이터가 있으면 모두 삭제
          console.log(`⚠️ 실시간 동기화: Firebase가 비어있음 - IndexedDB의 모든 매물 삭제...`);
          console.log(`🗑️ 삭제할 매물 ID:`, allIndexedDBProperties.map(p => p.id));
          for (const property of allIndexedDBProperties) {
            try {
              await IndexedDB.deleteProperty(property.id);
              console.log(`  ✅ 삭제 완료: ${property.id} - ${property.title}`);
            } catch (deleteError) {
              console.error(`  ❌ 삭제 실패: ${property.id}`, deleteError);
            }
          }
        }
      }
      
      const updatedProperties: Property[] = [];
      
      // 모든 변경사항을 순차적으로 처리
      for (const change of snapshot.docChanges()) {
        try {
          const data = change.doc.data();
          // contact 객체를 명시적으로 복사하여 photo 필드가 누락되지 않도록 함
          const property: Property = {
            ...data,
            id: change.doc.id,
            createdAt: this.safeConvertTimestamp(data.createdAt),
            // contact 객체를 명시적으로 복사 (모든 필드 보존)
            contact: data.contact ? {
              ...data.contact,
              // companyName 명시적으로 보존
              companyName: data.contact.companyName || undefined,
              // name 명시적으로 보존
              name: data.contact.name || undefined,
              // phone 명시적으로 보존
              phone: data.contact.phone || undefined,
              // phone2 명시적으로 보존
              phone2: data.contact.phone2 || undefined,
              // email 명시적으로 보존
              email: data.contact.email || undefined,
              // photo 필드 처리: Firebase Storage URL, Base64, HTTP/HTTPS URL은 유지, 상대 경로는 절대 URL로 변환
              photo: (() => {
                const photo = data.contact.photo;
                if (!photo || typeof photo !== 'string') return undefined;
                // 상대 경로인 경우 절대 URL로 변환 (PC 사이트의 정적 파일 경로)
                if (photo.startsWith('/') && !photo.startsWith('//')) {
                  // PC 사이트의 base URL과 결합
                  const pcSiteUrl = process.env.REACT_APP_PC_SITE_URL || 
                                   'https://pa-realestate-pc.vercel.app';
                  const absoluteUrl = `${pcSiteUrl}${photo}`;
                  console.log(`📷 매물 ${change.doc.id}: 실시간 동기화 - 상대 경로 프로필 사진을 절대 URL로 변환:`, {
                    relative: photo,
                    absolute: absoluteUrl,
                    pcSiteUrl: pcSiteUrl
                  });
                  return absoluteUrl;
                }
                // Firebase Storage URL, Base64, HTTP/HTTPS URL은 유지
                return photo;
              })(),
              // phones 배열도 명시적으로 복사
              phones: data.contact.phones || (data.contact.phone ? [data.contact.phone] : []),
            } : data.contact,
            // 매물정보 필드 명시적으로 보존
            maintenanceIncluded: data.maintenanceIncluded || undefined,
            propertyStatus: data.propertyStatus || undefined,
            parkingCount: data.parkingCount || undefined,
            recommendedBusiness: data.recommendedBusiness || undefined,
            keyMoney: data.keyMoney || undefined,
            loanAmount: data.loanAmount || undefined,
            keyDepositMonthly: data.keyDepositMonthly || undefined,
            bedrooms: data.bedrooms || undefined,
            bathrooms: data.bathrooms || undefined,
            maintenanceFee: data.maintenanceFee || undefined,
            propertyType: data.propertyType || undefined,
            mapImage: data.mapImage || undefined,
          } as Property;
          
          // 디버깅: contact.photo 확인
          if (property.contact?.photo) {
            const isFirebaseStorage = property.contact.photo.includes('firebasestorage.googleapis.com');
            const isBase64 = property.contact.photo.startsWith('data:');
            const isHttp = property.contact.photo.startsWith('http://') || property.contact.photo.startsWith('https://');
            console.log(`📷 실시간 동기화 - 매물 ${property.id} 프로필 사진 확인:`, {
              hasPhoto: true,
              photoType: isBase64 ? 'Base64' : (isFirebaseStorage ? 'Firebase Storage' : (isHttp ? 'HTTP/HTTPS URL' : '기타')),
              photoLength: property.contact.photo.length,
              photoPreview: property.contact.photo.substring(0, 100) + '...'
            });
          } else {
            const rawPhoto = data.contact?.photo;
            console.warn(`⚠️ 실시간 동기화 - 매물 ${property.id} 프로필 사진 없음`, {
              rawPhotoExists: !!rawPhoto,
              rawPhotoType: rawPhoto ? (typeof rawPhoto) : '없음',
              rawPhotoPreview: rawPhoto && typeof rawPhoto === 'string' ? rawPhoto.substring(0, 100) + '...' : '없음'
            });
          }

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

      // UI 업데이트 콜백 호출 (Firebase 스냅샷 데이터 직접 사용)
      if (onPropertyUpdate) {
        // Firebase 스냅샷에서 직접 매물 데이터 추출 (IndexedDB가 아닌 Firebase를 신뢰)
        const firebaseProperties: Property[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // contact 객체를 명시적으로 복사하여 photo 필드가 누락되지 않도록 함
          const property: Property = {
            ...data,
            id: doc.id,
            createdAt: this.safeConvertTimestamp(data.createdAt),
            // contact 객체를 명시적으로 복사 (모든 필드 보존)
            contact: data.contact ? {
              ...data.contact,
              // companyName 명시적으로 보존
              companyName: data.contact.companyName || undefined,
              // name 명시적으로 보존
              name: data.contact.name || undefined,
              // phone 명시적으로 보존
              phone: data.contact.phone || undefined,
              // phone2 명시적으로 보존
              phone2: data.contact.phone2 || undefined,
              // email 명시적으로 보존
              email: data.contact.email || undefined,
              // photo 필드 처리: Firebase Storage URL, Base64, HTTP/HTTPS URL은 유지, 상대 경로는 절대 URL로 변환
              photo: (() => {
                const photo = data.contact.photo;
                if (!photo || typeof photo !== 'string') return undefined;
                // 상대 경로인 경우 절대 URL로 변환 (PC 사이트의 정적 파일 경로)
                if (photo.startsWith('/') && !photo.startsWith('//')) {
                  // PC 사이트의 base URL과 결합
                  const pcSiteUrl = process.env.REACT_APP_PC_SITE_URL || 
                                   'https://pa-realestate-pc.vercel.app';
                  const absoluteUrl = `${pcSiteUrl}${photo}`;
                  console.log(`📷 매물 ${doc.id}: 실시간 동기화 UI 업데이트 - 상대 경로 프로필 사진을 절대 URL로 변환:`, {
                    relative: photo,
                    absolute: absoluteUrl,
                    pcSiteUrl: pcSiteUrl
                  });
                  return absoluteUrl;
                }
                // Firebase Storage URL, Base64, HTTP/HTTPS URL은 유지
                return photo;
              })(),
              // phones 배열도 명시적으로 복사
              phones: data.contact.phones || (data.contact.phone ? [data.contact.phone] : []),
            } : data.contact,
            // 매물정보 필드 명시적으로 보존
            maintenanceIncluded: data.maintenanceIncluded || undefined,
            propertyStatus: data.propertyStatus || undefined,
            parkingCount: data.parkingCount || undefined,
            recommendedBusiness: data.recommendedBusiness || undefined,
            keyMoney: data.keyMoney || undefined,
            loanAmount: data.loanAmount || undefined,
            keyDepositMonthly: data.keyDepositMonthly || undefined,
            bedrooms: data.bedrooms || undefined,
            bathrooms: data.bathrooms || undefined,
            maintenanceFee: data.maintenanceFee || undefined,
            propertyType: data.propertyType || undefined,
            mapImage: data.mapImage || undefined,
          } as Property;
          
          // 디버깅: 실시간 동기화 시 모든 필드 확인
          if (snapshot.docChanges().length > 0) {
            console.log(`📋 실시간 동기화 - 매물 ${doc.id}:`, {
              title: property.title,
              // 매물정보 필드
              maintenanceIncluded: property.maintenanceIncluded || '없음',
              propertyStatus: property.propertyStatus || '없음',
              parkingCount: property.parkingCount || '없음',
              recommendedBusiness: property.recommendedBusiness || '없음',
              propertyType: property.propertyType || '없음',
              // 연락처 필드
              hasContact: !!property.contact,
              contact: property.contact ? {
                companyName: property.contact.companyName || '없음',
                name: property.contact.name || '없음',
                phone: property.contact.phone || '없음',
                phones: property.contact.phones || '없음',
                email: property.contact.email || '없음',
                photo: property.contact.photo ? property.contact.photo.substring(0, 50) + '...' : '없음'
              } : '없음',
              // 위치정보
              hasMapImage: !!property.mapImage,
              mapImage: property.mapImage ? property.mapImage.substring(0, 50) + '...' : '없음'
            });
          }
          
          firebaseProperties.push(property);
        });
        
        console.log('🔄 Firebase 실시간 업데이트 (Firebase 스냅샷 직접 사용):', {
          Firebase매물수: snapshot.docs.length,
          변경된매물수: updatedProperties.length,
          UI업데이트매물수: firebaseProperties.length
        });
        
        console.log('📊 UI 업데이트할 매물들:', firebaseProperties.map(p => ({ id: p.id, title: p.title })));
        onPropertyUpdate(firebaseProperties);
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
      console.log('📋 저장할 필드 확인:', {
        maintenanceIncluded: property.maintenanceIncluded,
        propertyStatus: property.propertyStatus,
        parkingCount: property.parkingCount,
        recommendedBusiness: property.recommendedBusiness,
        propertyType: property.propertyType,
        contact: property.contact,
        mapImage: property.mapImage
      });
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
      console.log('🗑️ 매물 삭제 시작:', propertyId);
      
      // 1. IndexedDB에서 즉시 삭제 (빠른 응답)
      try {
        await IndexedDB.deleteProperty(propertyId);
        console.log('✅ IndexedDB에서 매물 삭제 완료:', propertyId);
      } catch (indexedDBError) {
        console.error('❌ IndexedDB 삭제 실패:', indexedDBError);
        // IndexedDB 삭제 실패해도 계속 진행
      }
      
      // 2. Firebase에서 삭제 (Firebase가 초기화된 경우에만)
      if (this.isOnline && db) {
        try {
          await deleteDoc(doc(db, COLLECTION_NAME, propertyId));
          console.log('🔥 Firebase에서 매물 삭제 완료:', propertyId);
        } catch (firebaseError) {
          console.error('❌ Firebase 삭제 실패:', firebaseError);
          // Firebase 삭제 실패해도 IndexedDB는 삭제되었으므로 계속 진행
          // 오프라인 시 대기열에 추가하지 않음 (이미 IndexedDB에서 삭제되었으므로)
        }
      } else {
        console.log('📴 오프라인 상태 - IndexedDB에서만 삭제됨:', propertyId);
      }
      
      console.log('✅ 매물 삭제 프로세스 완료:', propertyId);
    } catch (error) {
      console.error('❌ 매물 삭제 실패:', error);
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
          console.log('📊 저장할 데이터 전체 확인:', {
            id: property.id,
            title: property.title,
            address: property.address,
            location: property.location,
            createdAt: property.createdAt,
            // 매물정보 필드
            maintenanceIncluded: property.maintenanceIncluded || '없음',
            propertyStatus: property.propertyStatus || '없음',
            parkingCount: property.parkingCount || '없음',
            recommendedBusiness: property.recommendedBusiness || '없음',
            propertyType: property.propertyType || '없음',
            // 연락처 필드
            contact: property.contact ? {
              companyName: property.contact.companyName || '없음',
              name: property.contact.name || '없음',
              phone: property.contact.phone || '없음',
              phones: property.contact.phones || '없음',
              email: property.contact.email || '없음',
              photo: property.contact.photo ? property.contact.photo.substring(0, 50) + '...' : '없음'
            } : '없음',
            // 위치정보
            mapImage: property.mapImage ? property.mapImage.substring(0, 50) + '...' : '없음'
          });
          console.log('📊 원본 property 객체의 모든 키:', Object.keys(property));
          console.log('📄 문서 경로:', docRef.path);
          console.log('🔧 merge 옵션: true');
          
      // undefined 값 제거 (Firebase 호환성)
      const cleanPropertyData = this.removeUndefinedValues(propertyData);
      
      // 디버깅: 정리 전후 비교
      console.log('🔍 데이터 정리 전후 비교:', {
        원본키수: Object.keys(propertyData).length,
        정리후키수: Object.keys(cleanPropertyData).length,
        제거된키: Object.keys(propertyData).filter(key => !(key in cleanPropertyData)),
        contact포함: 'contact' in cleanPropertyData,
        mapImage포함: 'mapImage' in cleanPropertyData,
        maintenanceIncluded포함: 'maintenanceIncluded' in cleanPropertyData,
        propertyStatus포함: 'propertyStatus' in cleanPropertyData,
        parkingCount포함: 'parkingCount' in cleanPropertyData,
        recommendedBusiness포함: 'recommendedBusiness' in cleanPropertyData
      });
      
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