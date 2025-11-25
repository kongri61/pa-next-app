import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  getDoc,
  onSnapshot, 
  query, 
  where,
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
  private deletedProperties: Set<string> = new Set(); // 삭제된 매물 ID 추적

  constructor() {
    // 온라인/오프라인 상태 감지
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  // Firebase 초기화 및 실시간 동기화 시작 (성능 최적화: 실시간 동기화 우선)
  async initialize(onPropertyUpdate?: (properties: Property[]) => void): Promise<void> {
    try {
      console.log('🔥 Firebase 동기화 초기화 시작 (성능 최적화)...');
      
      // Firebase가 초기화되지 않은 경우 체크
      if (!db) {
        console.warn('⚠️ Firebase가 초기화되지 않음 - IndexedDB만 사용');
        this.isInitialized = true;
        return;
      }
      
      // 모바일 서버 감지
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname === 'pa-realestate-pc.vercel.app' ||
                          (window.location.hostname.includes('vercel.app') && 
                           window.location.hostname.includes('pa-realestate'));
      
      console.log('🌐 현재 호스트:', window.location.hostname);
      console.log('🖥️ 메인 서버 여부:', isMainServer);
      
      // 성능 최적화: 실시간 동기화를 먼저 설정하여 즉시 업데이트 수신
      // 초기 데이터 로드는 백그라운드에서 진행
      console.log('⚡ 실시간 동기화 즉시 설정 (초기 데이터는 백그라운드 로드)...');
      this.setupRealTimeSync(onPropertyUpdate);
      
      // 초기화 완료 플래그 설정 (실시간 동기화가 설정되었으므로)
      this.isInitialized = true;
      console.log('✅ 실시간 동기화 설정 완료!');
      
      // 초기 데이터 로드는 백그라운드에서 비동기로 진행 (블로킹 없음)
      if (isMainServer) {
        console.log('🖥️ PC 메인 서버 감지 - Firebase 초기 데이터 설정 (백그라운드)');
        // PC 메인 서버: Firebase에 초기 데이터 업로드 (백그라운드)
        this.setupMainServer().catch(error => {
          console.error('❌ 백그라운드 초기 데이터 설정 실패:', error);
        });
      } else {
        console.log('📱 모바일 서버 감지 - Firebase에서 데이터 로드 (백그라운드)');
        // 모바일 서버: Firebase에서 데이터 로드 (백그라운드)
        // 실시간 동기화가 이미 설정되었으므로 초기 로드는 선택적
        this.loadFromFirebase().catch(error => {
          console.error('❌ 백그라운드 데이터 로드 실패:', error);
        });
      }
      
      // 대기열에 있는 매물들 처리 (백그라운드)
      if (this.pendingUpdates.size > 0) {
        console.log(`🔄 대기열에 있는 ${this.pendingUpdates.size}개 매물 처리 시작 (백그라운드)...`);
        const pendingArray = Array.from(this.pendingUpdates.values());
        this.pendingUpdates.clear();
        
        // 백그라운드에서 처리
        Promise.all(
          pendingArray.map(async (property) => {
            try {
              console.log(`📤 대기열 매물 처리: ${property.id} - ${property.title}`);
              await this.syncToFirebase(property);
              console.log(`✅ 대기열 매물 처리 완료: ${property.id}`);
            } catch (error) {
              console.error(`❌ 대기열 매물 처리 실패: ${property.id}`, error);
              // 실패한 매물은 다시 대기열에 추가
              this.pendingUpdates.set(property.id, property);
            }
          })
        ).then(() => {
          console.log('🎉 대기열 처리 완료!');
        }).catch(error => {
          console.error('❌ 대기열 처리 중 오류:', error);
        });
      }
      
      console.log('✅ Firebase 동기화 초기화 완료 (실시간 동기화 활성화, 초기 데이터는 백그라운드 로드)');
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
        rawDataMap.set(doc.id, data);
        
        // 디버깅: 원본 Firebase 데이터의 모든 필드 확인 (매매용 필드)
        if (data.type === 'sale') {
          console.log(`🔍 Firebase 원본 데이터 - 매매용 매물 ${doc.id}:`, {
            title: data.title,
            type: data.type,
            // 원본 Firebase 필드명 확인 (PC 사이트 필드명 포함)
            keyDepositMonthly: data.keyDepositMonthly,
            keyDepositMonthlyType: typeof data.keyDepositMonthly,
            keyDeposit: data.keyDeposit,
            keyDepositType: typeof data.keyDeposit,
            monthlyRent: data.monthlyRent,
            monthlyRentType: typeof data.monthlyRent,
            loanAmount: data.loanAmount,
            loanAmountType: typeof data.loanAmount,
            loan: data.loan,
            loanType: typeof data.loan,
            // 모든 필드명 확인
            allFields: Object.keys(data),
            // 숫자 필드들 확인 (상세 정보) - 모든 필드 출력
            numericFields: Object.keys(data).filter(key => typeof data[key] === 'number').map(key => ({
              field: key,
              value: data[key],
              type: typeof data[key]
            })),
            // 모든 필드와 값 확인 (문자열, 숫자, 객체 등)
            allFieldValues: Object.keys(data).reduce((acc, key) => {
              const value = data[key];
              if (value !== null && value !== undefined) {
                acc[key] = {
                  value: value,
                  type: typeof value,
                  isNumber: typeof value === 'number',
                  isString: typeof value === 'string',
                  isObject: typeof value === 'object' && !Array.isArray(value)
                };
              }
              return acc;
            }, {} as Record<string, any>),
            // 기보증금/월세 관련 가능한 필드명 확인
            possibleKeyDepositFields: {
              keyDepositMonthly: data.keyDepositMonthly,
              keyDeposit: data.keyDeposit,
              monthlyRent: data.monthlyRent,
              keyDepositMonthlyRent: data.keyDepositMonthlyRent,
              depositMonthly: data.depositMonthly,
              // 숫자 필드 중에서 기보증금/월세로 보이는 필드 찾기
              allNumericFieldsWithValues: Object.keys(data)
                .filter(key => typeof data[key] === 'number')
                .map(key => ({ field: key, value: data[key] }))
            },
            // 융자금 관련 가능한 필드명 확인
            possibleLoanFields: {
              loanAmount: data.loanAmount,
              loan: data.loan,
              loanMoney: data.loanMoney,
              financingAmount: data.financingAmount,
              // 숫자 필드 중에서 융자금으로 보이는 필드 찾기
              allNumericFieldsWithValues: Object.keys(data)
                .filter(key => typeof data[key] === 'number')
                .map(key => ({ field: key, value: data[key] }))
            },
            // 모든 숫자 필드 값 확인
            allNumericValues: Object.keys(data).reduce((acc, key) => {
              if (typeof data[key] === 'number') {
                acc[key] = data[key];
              }
              return acc;
            }, {} as Record<string, number>)
          });
        } // 원본 데이터 저장
        
        // 삭제된 매물 필터링: deletedProperties Set에 있거나 isActive: false인 경우 제외
        if (this.deletedProperties.has(doc.id)) {
          console.log(`⏭️ 삭제된 매물 건너뛰기 (deletedProperties): ${doc.id}`);
          return;
        }
        
        if (data.isActive === false) {
          console.log(`⏭️ 삭제된 매물 건너뛰기 (isActive: false): ${doc.id}`);
          // 삭제된 매물 목록에 추가하여 재로드 방지
          this.deletedProperties.add(doc.id);
          // IndexedDB에서도 삭제
          IndexedDB.deleteProperty(doc.id).catch(err => 
            console.warn(`IndexedDB에서 ${doc.id} 삭제 실패:`, err)
          );
          return;
        }
        
        rawDataMap.set(doc.id, data); // 원본 데이터 저장
        // Timestamp를 Date로 변환
        // contact 객체를 명시적으로 복사하여 photo 필드가 누락되지 않도록 함
        // images 배열 명시적으로 보존 (P001 디버깅)
        const images = Array.isArray(data.images) ? data.images : (data.images ? [data.images] : []);
        
        // P001 특별 디버깅 - images 배열 확인
        if (doc.id === 'P001') {
          console.log('🔍 P001 images 배열 디버깅:', {
            rawImages: data.images,
            rawImagesType: typeof data.images,
            rawImagesIsArray: Array.isArray(data.images),
            rawImagesLength: Array.isArray(data.images) ? data.images.length : (data.images ? 1 : 0),
            processedImages: images,
            processedImagesLength: images.length,
            allDataKeys: Object.keys(data)
          });
        }
        
        const property: Property = {
          ...data,
          id: doc.id,
          createdAt: this.safeConvertTimestamp(data.createdAt),
          // images 배열 명시적으로 보존
          images: images,
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
          // 매물정보 필드 명시적으로 보존 (PC 사이트 필드명 매핑 포함)
          maintenanceIncluded: data.maintenanceIncluded || data.maintenanceFeeItems || undefined,
          propertyStatus: data.propertyStatus || undefined,
          parkingCount: data.parkingCount !== undefined ? data.parkingCount : (data.parkingSpaces !== undefined ? data.parkingSpaces : undefined),
          recommendedBusiness: data.recommendedBusiness || data.recommendedBusinessType || undefined,
          keyMoney: data.keyMoney !== undefined ? data.keyMoney : undefined,
          // 매매용 필드 (PC 사이트 필드명 매핑 포함)
          loanAmount: data.loanAmount !== undefined ? data.loanAmount : undefined,
          keyDepositMonthly: data.keyDepositMonthly !== undefined ? data.keyDepositMonthly : undefined,
          bedrooms: data.bedrooms || undefined,
          bathrooms: data.bathrooms || undefined,
          roomBathInfo: data.roomBathInfo || undefined,
          maintenanceFee: data.maintenanceFee || undefined,
          propertyType: data.propertyType || undefined,
          buildingUse: data.buildingUse || undefined,
          mapImage: data.mapImage || undefined,
        } as Property;
        
        // 디버깅: 모든 필수 필드 확인
        const rawContact = data.contact || null;
        const hasPhoto = rawContact && rawContact.photo;
        const rawPhoto = rawContact?.photo;
        
        // P001 특별 디버깅 - images 배열 확인
        if (doc.id === 'P001') {
          console.log('🔍 P001 images 배열 최종 확인:', {
            propertyImages: property.images,
            propertyImagesLength: property.images?.length || 0,
            propertyImagesIsArray: Array.isArray(property.images),
            rawDataImages: data.images,
            rawDataImagesLength: Array.isArray(data.images) ? data.images.length : (data.images ? 1 : 0),
            rawDataImagesIsArray: Array.isArray(data.images)
          });
        }
        
        console.log(`📋 Firebase에서 로드된 매물 ${doc.id}:`, {
          title: property.title,
          type: property.type,
          // images 배열 정보 추가
          imagesCount: property.images?.length || 0,
          imagesIsArray: Array.isArray(property.images),
          // 매물정보 필드
          maintenanceIncluded: property.maintenanceIncluded || '없음',
          propertyStatus: property.propertyStatus || '없음',
          parkingCount: property.parkingCount || '없음',
          recommendedBusiness: property.recommendedBusiness || '없음',
          propertyType: property.propertyType || '없음',
          // 매매용 필드
          loanAmount: property.loanAmount !== undefined ? property.loanAmount : '없음',
          keyDepositMonthly: property.keyDepositMonthly !== undefined ? property.keyDepositMonthly : '없음',
          // 임대용 필드
          keyMoney: property.keyMoney !== undefined ? property.keyMoney : '없음',
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
            phone: '',
            email: 'kongri61@naver.com',
            photo: '/contact-photo.jpg'
          },
          location: this.convertLocation(data.location) || { lat: 0, lng: 0 }
        };
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
        
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
          
          // IndexedDB 초기화 확인 및 보장
          try {
            await IndexedDB.initDatabase();
          } catch (initError) {
            // 이미 초기화되어 있으면 무시
            console.log('IndexedDB 이미 초기화됨');
          }
          
          await IndexedDB.updateProperty(property);
          
          // 저장 후 확인 (에러 처리 추가)
          try {
            const savedProperty = await IndexedDB.getProperty(property.id);
            console.log(`✅ IndexedDB 저장 후 매물 ${property.id} 확인:`, {
              hasContact: !!savedProperty?.contact,
              hasContactPhoto: !!savedProperty?.contact?.photo,
              contactPhotoLength: savedProperty?.contact?.photo?.length || 0
            });
          } catch (getError) {
            console.warn(`⚠️ IndexedDB 저장 후 확인 실패 (무시):`, getError);
          }
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
          
          // 삭제된 매물 필터링: deletedProperties Set에 있거나 isActive: false인 경우 제외
          if (this.deletedProperties.has(change.doc.id)) {
            console.log(`⏭️ 삭제된 매물 건너뛰기 (deletedProperties): ${change.doc.id}`);
            // IndexedDB에서도 삭제
            await IndexedDB.deleteProperty(change.doc.id);
            return;
          }
          
          if (data.isActive === false) {
            console.log(`⏭️ 삭제된 매물 건너뛰기 (isActive: false): ${change.doc.id}`);
            // 삭제된 매물 목록에 추가하여 재로드 방지
            this.deletedProperties.add(change.doc.id);
            // IndexedDB에서도 삭제
            await IndexedDB.deleteProperty(change.doc.id);
            return;
          }
          
          // contact 객체를 명시적으로 복사하여 photo 필드가 누락되지 않도록 함
          const property: Property = {
            ...data,
            id: change.doc.id,
<<<<<<< HEAD
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
            // 매물정보 필드 명시적으로 보존 (PC 사이트 필드명 매핑 포함)
            maintenanceIncluded: data.maintenanceIncluded || data.maintenanceFeeItems || undefined,
            propertyStatus: (() => {
              // 여러 가능한 필드명 체크 (PC 사이트와의 호환성)
              // propertyStatus, currentBusinessType, status, 매물현황 등
              const checkStringValue = (val: any): string | undefined => {
                if (val && typeof val === 'string' && val.trim() !== '') {
                  return val.trim();
                }
                return undefined;
              };
              
              // 우선순위대로 체크
              return checkStringValue(data.propertyStatus) ||
                     checkStringValue(data.currentBusinessType) ||
                     checkStringValue(data.status) ||
                     checkStringValue(data['매물현황']) ||
                     checkStringValue(data.propertyState) ||
                     checkStringValue(data.rentalStatus) ||
                     checkStringValue(data.saleStatus);
            })(),
            parkingCount: data.parkingCount !== undefined ? data.parkingCount : (data.parkingSpaces !== undefined ? data.parkingSpaces : undefined),
            recommendedBusiness: data.recommendedBusiness || data.recommendedBusinessType || undefined,
            keyMoney: (() => {
              // 여러 가능한 필드명 체크 (PC 사이트와의 호환성)
              const checkValue = (val: any): number | undefined => {
                if (val === undefined || val === null || val === '') return undefined;
                const numValue = typeof val === 'number' ? val : parseFloat(val);
                if (!isNaN(numValue) && numValue > 0) return numValue;
                return undefined;
              };
              
              // 임대용 매물인 경우 특별 처리
              if (data.type === 'rent') {
                // 임대용 매물에서: premium이 권리금으로 사용됨
                // 우선순위: keyMoney > premium (임대용에서 권리금) > 권리금
                return checkValue(data.keyMoney) ||
                       checkValue(data.premium) ||  // 임대용에서 premium이 권리금
                       checkValue(data['권리금']);
              } else {
                // 매매용 매물은 premium이 융자금이므로 제외
                return checkValue(data.keyMoney) ||
                       checkValue(data['권리금']);
              }
            })(),
            // 매매용 필드 (PC 사이트 필드명 매핑 포함)
            // PC 사이트에서 다른 필드명을 사용할 수 있으므로 여러 가능성 확인
            loanAmount: (() => {
              // 여러 가능한 필드명 체크 (PC 사이트와의 호환성)
              const checkValue = (val: any): number | undefined => {
                if (val === undefined || val === null || val === '') return undefined;
                const numValue = typeof val === 'number' ? val : parseFloat(val);
                if (!isNaN(numValue) && numValue > 0) return numValue;
                return undefined;
              };
              
              // 매매용 매물인 경우 특별 처리
              if (data.type === 'sale') {
                // 매매용 매물에서: premium이 융자금으로 사용됨
                // 우선순위: loanAmount > premium (매매용에서 융자금) > loan > loanMoney > financingAmount > 융자금
                const value = checkValue(data.loanAmount) ||
                             checkValue(data.premium) ||  // 매매용에서 premium이 융자금
                             checkValue(data.loan) ||
                             checkValue(data.loanMoney) ||
                             checkValue(data.financingAmount) ||
                             checkValue(data['융자금']);
                
                // 디버깅: 값이 없을 때 로그 출력
                if (!value) {
                  console.log(`⚠️ 매물 ${change.doc.id}: 융자금 필드를 찾을 수 없음`, {
                    loanAmount: data.loanAmount,
                    loan: data.loan,
                    premium: data.premium,
                    allNumericFields: Object.keys(data).filter(k => typeof data[k] === 'number' && data[k] > 0).map(k => ({ key: k, value: data[k] }))
                  });
                }
                
                return value;
              } else {
                // 임대용 매물은 기존 로직 유지
                return checkValue(data.loanAmount) ||
                       checkValue(data.loan) ||
                       checkValue(data.loanMoney) ||
                       checkValue(data.financingAmount) ||
                       checkValue(data['융자금']);
              }
            })(),
            keyDepositMonthly: (() => {
              // 여러 가능한 필드명 체크 (PC 사이트와의 호환성)
              // 필드가 존재하고 값이 유효한 경우에만 반환
              const checkValue = (val: any): number | undefined => {
                if (val === undefined || val === null || val === '') return undefined;
                const numValue = typeof val === 'number' ? val : parseFloat(val);
                if (!isNaN(numValue) && numValue > 0) return numValue;
                return undefined;
              };
              
              // 매매용 매물인 경우 특별 처리
              if (data.type === 'sale') {
                // 매매용 매물에서: deposit(기보증금)과 rentPrice(기월세)를 조합
                // keyDepositMonthly가 있으면 우선 사용
                // 없으면 deposit과 rentPrice를 조합해서 사용하지 않고, 각각 별도로 표시
                // (이 함수는 단일 값을 반환하므로, 실제 표시는 PropertyDetailModal에서 처리)
                // 우선순위: keyDepositMonthly > deposit > rentPrice > 기타
                const value = checkValue(data.keyDepositMonthly) ||
                             checkValue(data.deposit) ||  // 매매용에서 deposit이 기보증금
                             checkValue(data.rentPrice) ||  // 매매용에서 rentPrice가 기월세
                             checkValue(data.keyDeposit) ||
                             checkValue(data.monthlyRent) ||
                             checkValue(data.keyDepositMonthlyRent) ||
                             checkValue(data.depositMonthly) ||
                             checkValue(data['기보증금/월세']) ||
                             checkValue(data['기보증금']);
                
                // 디버깅: 값이 없을 때 로그 출력
                if (!value) {
                  console.log(`⚠️ 매물 ${change.doc.id}: 기보증금/월세 필드를 찾을 수 없음`, {
                    keyDepositMonthly: data.keyDepositMonthly,
                    premium: data.premium,
                    rentPrice: data.rentPrice,
                    keyDeposit: data.keyDeposit,
                    monthlyRent: data.monthlyRent,
                    allNumericFields: Object.keys(data).filter(k => typeof data[k] === 'number' && data[k] > 0).map(k => ({ key: k, value: data[k] }))
                  });
                }
                
                return value;
              } else {
                // 임대용 매물은 기존 로직 유지
                return checkValue(data.keyDepositMonthly) ||
                       checkValue(data.keyDeposit) ||
                       checkValue(data.monthlyRent) ||
                       checkValue(data.keyDepositMonthlyRent) ||
                       checkValue(data.depositMonthly) ||
                       checkValue(data['기보증금/월세']) ||
                       checkValue(data['기보증금']);
              }
            })(),
            bedrooms: data.bedrooms || undefined,
            bathrooms: data.bathrooms || undefined,
            roomBathInfo: data.roomBathInfo || undefined,
            maintenanceFee: data.maintenanceFee || undefined,
            propertyType: data.propertyType || undefined,
            buildingUse: data.buildingUse || undefined,
            mapImage: data.mapImage || undefined,
            bathrooms: data.bathrooms || undefined,
            roomBathInfo: data.roomBathInfo || undefined,
            approvalDate: data.approvalDate || undefined,
            createdAt: this.safeConvertTimestamp(data.createdAt),
            // 필수 필드들이 제대로 읽혀지는지 확인
            maintenanceFeeItems: data.maintenanceFeeItems || undefined,
            buildingUse: data.buildingUse || undefined,
            parkingSpaces: data.parkingSpaces !== undefined && data.parkingSpaces !== null 
            ? (typeof data.parkingSpaces === 'number' ? String(data.parkingSpaces) : String(data.parkingSpaces))
            : undefined,
            recommendedBusinessType: data.recommendedBusinessType || undefined,
            contact: data.contact ? {
              ...data.contact,
              name: data.contact.name || '피에이공인중개사사무소    대표 김동화',
              phone: data.contact.phone || '',
              email: data.contact.email || 'kongri61@naver.com',
              photo: data.contact.photo || '/contact-photo.jpg'
            } : {
              name: '피에이공인중개사사무소    대표 김동화',
              phone: '',
              email: 'kongri61@naver.com',
              photo: '/contact-photo.jpg'
            },
            location: this.convertLocation(data.location) || { lat: 0, lng: 0 }
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
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
            // 이미 위에서 필터링했지만, 추가 확인
            if (this.deletedProperties.has(property.id) || property.isActive === false) {
              console.log(`⏭️ 삭제된 매물 건너뛰기 (이중 확인): ${property.id}`);
              this.deletedProperties.add(property.id);
              await IndexedDB.deleteProperty(property.id);
              return;
            }
            
            console.log(`📝 매물 ${change.type}: ${property.id} - ${property.title}`);
            console.log(`📍 위치: ${property.location?.lat}, ${property.location?.lng}`);
            
            // IndexedDB 초기화 확인 및 보장
            let initSuccess = false;
            try {
              await IndexedDB.initDatabase();
              initSuccess = true;
            } catch (initError: any) {
              // 버전 에러인 경우 재시도
              if (initError?.name === 'VersionError') {
                console.warn('⚠️ IndexedDB 버전 충돌, 재시도 중...');
                try {
                  // 잠시 대기 후 재시도
                  await new Promise(resolve => setTimeout(resolve, 100));
                  await IndexedDB.initDatabase();
                  initSuccess = true;
                } catch (retryError) {
                  console.error('❌ IndexedDB 초기화 재시도 실패:', retryError);
                }
              } else {
                console.warn('⚠️ IndexedDB 초기화 실패 (계속 진행):', initError);
              }
            }
            
            // IndexedDB가 초기화된 경우에만 처리
            if (initSuccess) {
              // 중복 처리 방지: 이미 처리된 매물인지 확인
              try {
                const existingProperty = await IndexedDB.getProperty(property.id);
                if (existingProperty && change.type === 'added') {
                  console.log(`⚠️ 매물 ${property.id}이 이미 로컬에 존재 - 수정으로 처리`);
                }
              } catch (getError) {
                // getProperty 실패해도 계속 진행 (새 매물일 수 있음)
                console.log(`ℹ️ 매물 ${property.id} 조회 실패 (새 매물로 처리):`, getError);
              }
              
              // IndexedDB에 업데이트
              try {
                await IndexedDB.updateProperty(property);
                console.log(`✅ IndexedDB 업데이트 완료: ${property.id}`);
              } catch (updateError) {
                console.error(`❌ IndexedDB 업데이트 실패: ${property.id}`, updateError);
              }
            } else {
              console.warn(`⚠️ IndexedDB 초기화 실패로 인해 ${property.id} 저장 건너뜀`);
            }
            
            updatedProperties.push(property);
          } else if (change.type === 'removed') {
            console.log(`🗑️ 매물 삭제: ${property.id} - ${property.title}`);
<<<<<<< HEAD
            
            // IndexedDB 초기화 확인 및 보장
            let initSuccess = false;
            try {
              await IndexedDB.initDatabase();
              initSuccess = true;
            } catch (initError: any) {
              // 버전 에러인 경우 재시도
              if (initError?.name === 'VersionError') {
                console.warn('⚠️ IndexedDB 버전 충돌, 재시도 중...');
                try {
                  await new Promise(resolve => setTimeout(resolve, 100));
                  await IndexedDB.initDatabase();
                  initSuccess = true;
                } catch (retryError) {
                  console.error('❌ IndexedDB 초기화 재시도 실패:', retryError);
                }
              } else {
                console.warn('⚠️ IndexedDB 초기화 실패 (계속 진행):', initError);
              }
            }
            
            // IndexedDB가 초기화된 경우에만 삭제
            if (initSuccess) {
              try {
                await IndexedDB.deleteProperty(property.id);
                console.log(`✅ IndexedDB 삭제 완료: ${property.id}`);
              } catch (deleteError) {
                console.error(`❌ IndexedDB 삭제 실패: ${property.id}`, deleteError);
              }
            } else {
              console.warn(`⚠️ IndexedDB 초기화 실패로 인해 ${property.id} 삭제 건너뜀`);
            } else {
              // 삭제된 매물 목록에 추가 (재업로드 방지)
              this.deletedProperties.add(property.id);
              // IndexedDB에서 삭제
              await IndexedDB.deleteProperty(property.id);
              console.log(`✅ IndexedDB 삭제 완료: ${property.id}`);
            }
          }
        } catch (changeError) {
          console.error(`❌ 매물 ${change.type} 처리 실패:`, changeError);
        }
      }

      // UI 업데이트 콜백 호출 (중복 방지 및 삭제된 매물 제외)
      if (onPropertyUpdate) {
<<<<<<< HEAD
        // Firebase 스냅샷에서 직접 매물 데이터 추출 (IndexedDB가 아닌 Firebase를 신뢰)
        const firebaseProperties: Property[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // contact 객체를 명시적으로 복사하여 photo 필드가 누락되지 않도록 함
          // 디버깅: 실시간 동기화 시 원본 Firebase 데이터 확인 (매매용 필드)
          if (data.type === 'sale') {
            console.log(`🔍 실시간 동기화 - Firebase 원본 데이터 - 매매용 매물 ${doc.id}:`, {
              title: data.title,
              type: data.type,
              // 원본 Firebase 필드명 확인
              keyDepositMonthly: data.keyDepositMonthly,
              keyDepositMonthlyType: typeof data.keyDepositMonthly,
              loanAmount: data.loanAmount,
              loanAmountType: typeof data.loanAmount,
              // 모든 필드명 확인
              allFields: Object.keys(data),
              // 숫자 필드들 확인 (상세 정보) - 모든 필드 출력
              numericFields: Object.keys(data).filter(key => typeof data[key] === 'number').map(key => ({
                field: key,
                value: data[key],
                type: typeof data[key]
              })),
              // 모든 필드와 값 확인 (문자열, 숫자, 객체 등)
              allFieldValues: Object.keys(data).reduce((acc, key) => {
                const value = data[key];
                if (value !== null && value !== undefined) {
                  acc[key] = {
                    value: value,
                    type: typeof value,
                    isNumber: typeof value === 'number',
                    isString: typeof value === 'string',
                    isObject: typeof value === 'object' && !Array.isArray(value)
                  };
                }
                return acc;
              }, {} as Record<string, any>),
              // 기보증금/월세 관련 가능한 필드명 확인
              possibleKeyDepositFields: {
                keyDepositMonthly: data.keyDepositMonthly,
                keyDeposit: data.keyDeposit,
                monthlyRent: data.monthlyRent,
                keyDepositMonthlyRent: data.keyDepositMonthlyRent,
                depositMonthly: data.depositMonthly,
                // 숫자 필드 중에서 기보증금/월세로 보이는 필드 찾기
                allNumericFieldsWithValues: Object.keys(data)
                  .filter(key => typeof data[key] === 'number')
                  .map(key => ({ field: key, value: data[key] }))
              },
              // 융자금 관련 가능한 필드명 확인
              possibleLoanFields: {
                loanAmount: data.loanAmount,
                loan: data.loan,
                loanMoney: data.loanMoney,
                financingAmount: data.financingAmount,
                // 숫자 필드 중에서 융자금으로 보이는 필드 찾기
                allNumericFieldsWithValues: Object.keys(data)
                  .filter(key => typeof data[key] === 'number')
                  .map(key => ({ field: key, value: data[key] }))
              },
              // 모든 숫자 필드 값 확인
              allNumericValues: Object.keys(data).reduce((acc, key) => {
                if (typeof data[key] === 'number') {
                  acc[key] = data[key];
                }
                return acc;
              }, {} as Record<string, number>)
            });
          }
          
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
            // 매물정보 필드 명시적으로 보존 (PC 사이트 필드명 매핑 포함)
            maintenanceIncluded: data.maintenanceIncluded || data.maintenanceFeeItems || undefined,
            propertyStatus: data.propertyStatus || undefined,
            parkingCount: data.parkingCount !== undefined ? data.parkingCount : (data.parkingSpaces !== undefined ? data.parkingSpaces : undefined),
            recommendedBusiness: data.recommendedBusiness || data.recommendedBusinessType || undefined,
            keyMoney: data.keyMoney !== undefined ? data.keyMoney : undefined,
            // 매매용 필드 (PC 사이트 필드명 매핑 포함)
            // PC 사이트에서 다른 필드명을 사용할 수 있으므로 여러 가능성 확인
            loanAmount: data.loanAmount !== undefined ? data.loanAmount : 
                       (data.loan !== undefined ? data.loan : undefined),
            keyDepositMonthly: data.keyDepositMonthly !== undefined ? data.keyDepositMonthly : 
                              (data.keyDeposit !== undefined ? data.keyDeposit : 
                              (data.monthlyRent !== undefined ? data.monthlyRent : undefined)),
            bedrooms: data.bedrooms || undefined,
            bathrooms: data.bathrooms || undefined,
            roomBathInfo: data.roomBathInfo || undefined,
            maintenanceFee: data.maintenanceFee || undefined,
            propertyType: data.propertyType || undefined,
            buildingUse: data.buildingUse || undefined,
            mapImage: data.mapImage || undefined,
          } as Property;
          
          // 디버깅: 실시간 동기화 시 모든 필드 확인
          if (snapshot.docChanges().length > 0) {
            console.log(`📋 실시간 동기화 - 매물 ${doc.id}:`, {
              title: property.title,
              type: property.type,
              // 매물정보 필드
              maintenanceIncluded: property.maintenanceIncluded || '없음',
              propertyStatus: property.propertyStatus || '없음',
              parkingCount: property.parkingCount || '없음',
              recommendedBusiness: property.recommendedBusiness || '없음',
              propertyType: property.propertyType || '없음',
              // 매매용 필드
              loanAmount: property.loanAmount !== undefined ? property.loanAmount : '없음',
              keyDepositMonthly: property.keyDepositMonthly !== undefined ? property.keyDepositMonthly : '없음',
              // 임대용 필드
              keyMoney: property.keyMoney !== undefined ? property.keyMoney : '없음',
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
        
        const allProperties = await IndexedDB.getAllProperties();
        // 삭제된 매물 제외 및 ID 기준으로 중복 제거
        const uniqueProperties = allProperties
          .filter(property => {
            // deletedProperties Set에 있거나 isActive: false인 경우 제외
            const propId = property.id;
            const normalizedPropId = propId.toUpperCase();
            
            // 대소문자 구분 없이 삭제된 매물 확인
            if (this.deletedProperties.has(propId) || this.deletedProperties.has(normalizedPropId)) {
              return false;
            }
            
            if (property.isActive === false) {
              // 삭제된 매물 목록에 추가 (대소문자 모두)
              this.deletedProperties.add(propId);
              this.deletedProperties.add(normalizedPropId);
              // IndexedDB에서도 삭제
              IndexedDB.deleteProperty(propId).catch(() => null);
              IndexedDB.deleteProperty(normalizedPropId).catch(() => null);
              return false;
            }
            return true;
          })
          .filter((property, index, self) => 
            index === self.findIndex(p => p.id === property.id)
          );
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
        
        console.log('🔄 Firebase 실시간 업데이트 (중복 제거 및 삭제된 매물 제외):', {
          원본: allProperties.length,
          중복제거후: uniqueProperties.length,
          제거된중복: allProperties.length - uniqueProperties.length,
          변경된매물수: updatedProperties.length,
          삭제된매물수: this.deletedProperties.size
        });
        
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
                          window.location.hostname === 'pa-realestate-pc.vercel.app' ||
                          (window.location.hostname.includes('vercel.app') && 
                           window.location.hostname.includes('pa-realestate'));
      
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
      
      // 모바일 서버에서는 수정 불가 (PC에서만 수정 가능)
      const isMainServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '192.168.219.105' ||
                          window.location.hostname === 'pa-realestate-pc.vercel.app' ||
                          (window.location.hostname.includes('vercel.app') && 
                           window.location.hostname.includes('pa-realestate'));
      
      console.log(`🌐 현재 호스트: ${window.location.hostname}`);
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
      // 대소문자 정규화 (P001, p001 모두 처리)
      const normalizedId = propertyId.toUpperCase();
      console.log('🗑️ 매물 삭제 시작:', normalizedId, '(원본:', propertyId, ')');
      
      // 1. 삭제된 매물 목록에 추가 (재업로드 방지) - 대소문자 구분 없이
      this.deletedProperties.add(normalizedId);
      this.deletedProperties.add(propertyId); // 원본 ID도 추가
      console.log('📝 삭제된 매물 목록에 추가:', normalizedId, propertyId);
      
      // 2. IndexedDB에서 즉시 삭제 (빠른 응답) - 대소문자 구분 없이 시도
      const deletePromises = [
        IndexedDB.deleteProperty(normalizedId).catch(() => null),
        normalizedId !== propertyId ? IndexedDB.deleteProperty(propertyId).catch(() => null) : Promise.resolve()
      ];
      await Promise.all(deletePromises);
      console.log('✅ IndexedDB에서 매물 삭제 완료:', normalizedId);
      
      // 3. Firebase에서 완전 삭제 (문서 자체를 삭제, isActive: false가 아님)
      if (this.isOnline && db) {
        try {
          // 대소문자 구분 없이 시도
          await deleteDoc(doc(db, COLLECTION_NAME, normalizedId));
          console.log('🔥 Firebase에서 매물 완전 삭제 완료:', normalizedId);
        } catch (firebaseError: any) {
          // normalizedId로 실패하면 원본 ID로 시도
          if (normalizedId !== propertyId) {
            try {
              await deleteDoc(doc(db, COLLECTION_NAME, propertyId));
              console.log('🔥 Firebase에서 매물 완전 삭제 완료 (원본 ID):', propertyId);
            } catch (secondError) {
              console.error('❌ Firebase 삭제 실패 (모든 시도 실패):', firebaseError, secondError);
            }
          } else {
            console.error('❌ Firebase 삭제 실패:', firebaseError);
          }
        }
      } else {
        console.log('📴 오프라인 상태 - IndexedDB에서만 삭제됨:', normalizedId);
      }
      
      console.log('✅ 매물 삭제 프로세스 완료:', normalizedId);
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
        console.log('P001 images 배열:', {
          images: property.images,
          imagesLength: property.images?.length || 0,
          imagesIsArray: Array.isArray(property.images),
          imagesPreview: property.images?.slice(0, 3).map((img: any, idx: number) => ({
            index: idx,
            url: typeof img === 'string' ? img.substring(0, 100) + '...' : img,
            type: typeof img
          })) || []
        });
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
        // 주차대수를 항상 문자열로 변환
        parkingSpaces: property.parkingSpaces !== undefined && property.parkingSpaces !== null
          ? (typeof property.parkingSpaces === 'number' ? String(property.parkingSpaces) : String(property.parkingSpaces))
          : undefined,
        createdAt: property.createdAt ? Timestamp.fromDate(property.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 이미지 배열 디버깅
      console.log('📷 저장할 이미지 배열 확인:', {
        propertyId: property.id,
        imagesCount: property.images?.length || 0,
        images: property.images?.map((img, idx) => ({
          index: idx,
          type: img.startsWith('data:image/') ? 'Base64' : 'URL',
          length: img.length,
          preview: img.substring(0, 50) + '...'
        })) || []
      });

      // Base64 이미지 크기 확인 (Firestore 문서 크기 제한: 1MB)
      if (property.images && property.images.length > 0) {
        const totalSize = JSON.stringify(property.images).length;
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        console.log(`📊 이미지 배열 총 크기: ${totalSizeMB}MB (${totalSize} bytes)`);
        
        if (totalSize > 900 * 1024) { // 900KB 이상이면 경고
          console.warn(`⚠️ 이미지 배열 크기가 큽니다 (${totalSizeMB}MB). Firestore 문서 크기 제한(1MB)에 근접합니다.`);
        }
      }

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
      
<<<<<<< HEAD
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
        recommendedBusiness포함: 'recommendedBusiness' in cleanPropertyData,
        images포함: 'images' in cleanPropertyData,
        images원본개수: propertyData.images?.length || 0,
        images정리후개수: cleanPropertyData.images?.length || 0
      });
      
      // P001 특별 디버깅 - setDoc 전
      if (property.id === 'P001') {
        console.log('🔍 P001 setDoc 실행 전 디버깅');
        console.log('P001 docRef.path:', docRef.path);
        console.log('P001 images 배열 정보:', {
          propertyImages: property.images,
          propertyImagesLength: property.images?.length || 0,
          propertyImagesIsArray: Array.isArray(property.images),
          propertyDataImages: propertyData.images,
          propertyDataImagesLength: propertyData.images?.length || 0,
          cleanPropertyDataImages: cleanPropertyData.images,
          cleanPropertyDataImagesLength: cleanPropertyData.images?.length || 0,
          imagesInCleanData: 'images' in cleanPropertyData
        });
        console.log('P001 원본 propertyData:', JSON.stringify(propertyData, null, 2));
        console.log('P001 정리된 propertyData:', JSON.stringify(cleanPropertyData, null, 2));
      }
          
          // setDoc 실행 전후 시간 측정
          const startTime = Date.now();
          await setDoc(docRef, cleanPropertyData, { merge: true });
          const endTime = Date.now();
          
          console.log(`✅ Firebase setDoc 성공: ${property.id} (소요시간: ${endTime - startTime}ms)`);
          
          // 저장 후 확인: 실제로 저장된 이미지 개수 확인
          const savedDoc = await getDoc(docRef);
          if (savedDoc.exists()) {
            const savedData = savedDoc.data();
            const savedImagesCount = Array.isArray(savedData.images) ? savedData.images.length : 0;
            const originalImagesCount = Array.isArray(cleanPropertyData.images) ? cleanPropertyData.images.length : 0;
            
            console.log(`📷 저장된 이미지 확인:`, {
              propertyId: property.id,
              원본이미지개수: originalImagesCount,
              저장된이미지개수: savedImagesCount,
              일치여부: originalImagesCount === savedImagesCount
            });
            
            if (originalImagesCount !== savedImagesCount) {
              console.error(`❌ 이미지 개수 불일치! 원본: ${originalImagesCount}개, 저장: ${savedImagesCount}개`);
            }
          }
          
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
            const savedData = directProperty.data();
            console.log(`✅ 매물 ${property.id} Firebase 저장 확인됨:`, savedData.title);
            console.log(`📅 생성일: ${savedData.createdAt?.toDate?.()}`);
            console.log(`🔄 업데이트일: ${savedData.updatedAt?.toDate?.()}`);
            
            // P001 특별 디버깅 - 저장 후 images 배열 확인
            if (property.id === 'P001') {
              console.log('🔍 P001 저장 후 images 배열 확인:', {
                저장전images개수: property.images?.length || 0,
                저장후images개수: savedData.images?.length || 0,
                저장후imagesIsArray: Array.isArray(savedData.images),
                저장후images: savedData.images,
                images일치여부: (property.images?.length || 0) === (savedData.images?.length || 0)
              });
              
              if ((property.images?.length || 0) !== (savedData.images?.length || 0)) {
                console.error('❌ P001 images 배열 개수 불일치!');
                console.error('저장 전:', property.images?.length || 0, '개');
                console.error('저장 후:', savedData.images?.length || 0, '개');
                console.error('저장 전 images:', property.images);
                console.error('저장 후 images:', savedData.images);
              }
            }
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
        console.log('📊 Firebase에 데이터 존재 - PC 로컬(IndexedDB) ↔ Firebase 동기화');
        // Firebase에 데이터가 있으면 PC 로컬(IndexedDB) ↔ Firebase 동기화
        // (모바일은 Firebase에서 읽기만 하므로 일방향)
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

  // PC 로컬(IndexedDB) ↔ Firebase 동기화 (PC 메인 서버용)
  // 주의: 모바일 사이트는 Firebase에서 읽기만 하므로 일방향입니다.
  private async syncBidirectional(localProperties: Property[], firebaseSnapshot: any): Promise<void> {
    try {
      console.log('🔄 PC 로컬(IndexedDB) ↔ Firebase 동기화 시작...');
      
      // Firebase 데이터를 Property 배열로 변환 (삭제된 매물 제외)
      const firebaseProperties: Property[] = firebaseSnapshot.docs
        .filter((doc: any) => {
          const data = doc.data();
          // 삭제된 매물(isActive: false)은 제외
          if (data.isActive === false) {
            console.log(`⏭️ 삭제된 매물 건너뛰기: ${doc.id}`);
            // 삭제된 매물 목록에 추가
            this.deletedProperties.add(doc.id);
            return false;
          }
          return true;
        })
        .map((doc: any) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        }));
      
      // Firebase에 없는 로컬 매물들을 삭제 목록에 추가 (재업로드 방지)
      const localOnlyIds = localProperties
        .filter(local => !firebaseProperties.some(firebase => firebase.id === local.id))
        .map(local => local.id);
      
      // Firebase에 없는 매물 중에서, Firebase에 존재하지 않는 경우 삭제된 것으로 간주
      // (단, 새로 추가된 매물일 수도 있으므로 주의)
      // 하지만 안전을 위해 Firebase에 없는 매물은 업로드하지 않고 삭제 목록에 추가
      for (const id of localOnlyIds) {
        if (!this.deletedProperties.has(id)) {
          // Firebase에서 실제로 존재하는지 확인
          if (db) {
            try {
              const docRef = doc(db, COLLECTION_NAME, id);
              const docSnap = await getDoc(docRef);
              if (!docSnap.exists()) {
                // Firebase에 존재하지 않으면 삭제된 것으로 간주
                console.log(`🗑️ Firebase에 없는 매물 발견 (삭제된 것으로 간주): ${id}`);
                this.deletedProperties.add(id);
                // IndexedDB에서도 삭제
                try {
                  await IndexedDB.deleteProperty(id);
                  console.log(`✅ IndexedDB에서 삭제 완료: ${id}`);
                } catch (error) {
                  console.warn(`⚠️ IndexedDB 삭제 실패: ${id}`, error);
                }
              }
            } catch (error) {
              console.warn(`⚠️ Firebase 확인 실패: ${id}`, error);
            }
          }
        }
      }
      
      console.log(`📊 로컬: ${localProperties.length}개, Firebase: ${firebaseProperties.length}개`);
      
      // 로컬에만 있는 매물들을 Firebase에 업로드 (중복 방지 및 삭제된 매물 제외)
      const localOnly = localProperties.filter(local => 
        !firebaseProperties.some(firebase => firebase.id === local.id) &&
        !this.deletedProperties.has(local.id) // 삭제된 매물은 제외
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
      
      // 삭제된 매물이 로컬에 남아있는 경우 IndexedDB에서도 삭제
      const deletedInLocal = localProperties.filter(local => 
        this.deletedProperties.has(local.id)
      );
      if (deletedInLocal.length > 0) {
        console.log(`🗑️ 삭제된 매물 ${deletedInLocal.length}개를 IndexedDB에서 정리...`);
        for (const property of deletedInLocal) {
          try {
            await IndexedDB.deleteProperty(property.id);
            console.log(`✅ IndexedDB에서 삭제 완료: ${property.id}`);
          } catch (error) {
            console.warn(`⚠️ IndexedDB 삭제 실패: ${property.id}`, error);
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
      
      console.log('✅ PC 로컬(IndexedDB) ↔ Firebase 동기화 완료!');
      console.log('📱 참고: 모바일 사이트는 Firebase에서 읽기만 하므로 일방향입니다.');
    } catch (error) {
      console.error('❌ PC 로컬(IndexedDB) ↔ Firebase 동기화 실패:', error);
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
  // 위치 정보 변환 함수 (GeoPoint 또는 일반 객체 모두 처리)
  private convertLocation(location: any): { lat: number; lng: number } | null {
    try {
      if (!location) return null;
      
      // Firebase GeoPoint 객체인 경우 (latitude, longitude)
      if (location.latitude !== undefined && location.longitude !== undefined) {
        return {
          lat: location.latitude,
          lng: location.longitude
        };
      }
      
      // 일반 객체인 경우 (lat, lng)
      if (location.lat !== undefined && location.lng !== undefined) {
        return {
          lat: typeof location.lat === 'number' ? location.lat : parseFloat(location.lat),
          lng: typeof location.lng === 'number' ? location.lng : parseFloat(location.lng)
        };
      }
      
      return null;
    } catch (error) {
      console.error('위치 정보 변환 오류:', error);
      return null;
    }
  }

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
      
      // 2. IndexedDB와 비교하여 동기화 (삭제된 매물 제외)
      const firebaseProperties: Property[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // 삭제된 매물 필터링: deletedProperties Set에 있거나 isActive: false인 경우 제외
        if (this.deletedProperties.has(doc.id)) {
          console.log(`⏭️ 삭제된 매물 건너뛰기 (deletedProperties): ${doc.id}`);
          return;
        }
        
        if (data.isActive === false) {
          console.log(`⏭️ 삭제된 매물 건너뛰기 (isActive: false): ${doc.id}`);
          // 삭제된 매물 목록에 추가하여 재로드 방지
          this.deletedProperties.add(doc.id);
          // IndexedDB에서도 삭제
          IndexedDB.deleteProperty(doc.id).catch(err => 
            console.warn(`IndexedDB에서 ${doc.id} 삭제 실패:`, err)
          );
          return;
        }
        const property: Property = {
          ...data,
          id: doc.id,
          createdAt: this.safeConvertTimestamp(data.createdAt),
          // 필수 필드들이 제대로 읽혀지는지 확인
          maintenanceFeeItems: data.maintenanceFeeItems || undefined,
          buildingUse: data.buildingUse || undefined,
          parkingSpaces: data.parkingSpaces !== undefined && data.parkingSpaces !== null 
            ? (typeof data.parkingSpaces === 'number' ? String(data.parkingSpaces) : String(data.parkingSpaces))
            : undefined,
          recommendedBusinessType: data.recommendedBusinessType || undefined,
          contact: {
            name: data.contact?.name || '피에이공인중개사사무소    대표 김동화',
            phone: data.contact?.phone || '',
            email: data.contact?.email || 'kongri61@naver.com',
            photo: data.contact?.photo || '/contact-photo.jpg'
          },
          location: this.convertLocation(data.location) || { lat: 0, lng: 0 }
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

  // 삭제된 매물(isActive: false) 완전 삭제
  async deleteInactiveProperties(): Promise<void> {
    try {
      console.log('🗑️ 삭제된 매물(isActive: false) 완전 삭제 시작...');
      
      if (!db) {
        throw new Error('Firebase가 초기화되지 않았습니다.');
      }
      
      // isActive: false인 매물들 조회
      const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', false));
      const querySnapshot = await getDocs(q);
      
      console.log(`📊 삭제된 매물 발견: ${querySnapshot.docs.length}개`);
      
      if (querySnapshot.docs.length === 0) {
        console.log('✅ 삭제할 매물이 없습니다.');
        return;
      }
      
      // 삭제할 매물 목록 출력
      console.log('\n📋 삭제할 매물 목록:');
      const idsToDelete: string[] = [];
      querySnapshot.docs.forEach((docSnapshot, index) => {
        const data = docSnapshot.data();
        console.log(`${index + 1}. ID: ${docSnapshot.id}, 제목: ${data.title || '제목 없음'}`);
        idsToDelete.push(docSnapshot.id);
      });
      
      // 사용자 확인 (브라우저 환경에서만)
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(`정말로 ${idsToDelete.length}개의 삭제된 매물을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
        if (!confirmed) {
          console.log('❌ 사용자가 취소했습니다.');
          return;
        }
      }
      
      let deletedCount = 0;
      let errorCount = 0;
      
      // 각 매물 삭제
      for (const id of idsToDelete) {
        try {
          // IndexedDB에서 먼저 삭제
          await IndexedDB.deleteProperty(id);
          
          // Firebase에서 삭제
          if (this.isOnline && db) {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            console.log(`✅ ${id} 삭제 완료`);
            deletedCount++;
          } else {
            // 오프라인 시 대기열에 추가
            this.pendingUpdates.set(id, null as any);
            console.log(`📴 ${id} 오프라인: 삭제 대기열에 추가됨`);
            deletedCount++;
          }
          
          // 각 삭제 사이에 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ ${id} 삭제 실패:`, error);
          errorCount++;
        }
      }
      
      console.log(`\n🎉 삭제 완료!`);
      console.log(`✅ 성공: ${deletedCount}개`);
      console.log(`❌ 실패: ${errorCount}개`);
      
    } catch (error) {
      console.error('❌ 삭제 과정에서 오류 발생:', error);
      throw error;
    }
  }
}

export const firebaseSync = new FirebaseSync(); 