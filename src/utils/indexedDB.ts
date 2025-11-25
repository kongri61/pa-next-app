// IndexedDB 설정
const DB_NAME = 'RealEstateDB';
<<<<<<< HEAD
const DB_VERSION = 4; // 버전 업데이트: 버전 충돌 해결
=======
const DB_VERSION = 4; // 기존 버전 3보다 높게 설정
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
const PROPERTIES_STORE = 'properties';
const IMAGES_STORE = 'images';
const SETTINGS_STORE = 'settings';

// 데이터베이스 인터페이스
interface IDBConfig {
  name: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indexes?: Array<{
      name: string;
      keyPath: string;
      options?: IDBIndexParameters;
    }>;
  }[];
}

// IndexedDB 설정
const dbConfig: IDBConfig = {
  name: DB_NAME,
  version: DB_VERSION,
  stores: [
    {
      name: PROPERTIES_STORE,
      keyPath: 'id',
      indexes: [
        { name: 'type', keyPath: 'type' },
        { name: 'propertyType', keyPath: 'propertyType' },
        { name: 'isActive', keyPath: 'isActive' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'price', keyPath: 'price' },
        { name: 'location', keyPath: 'location' }
      ]
    },
    {
      name: IMAGES_STORE,
      keyPath: 'id'
    },
    {
      name: SETTINGS_STORE,
      keyPath: 'key'
    }
  ]
};

// IndexedDB 관리 클래스
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  // 데이터베이스 초기화
  async init(): Promise<void> {
<<<<<<< HEAD
    // 이미 초기화되어 있으면 성공으로 처리
    if (this.db) {
      console.log('IndexedDB 이미 초기화됨');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbConfig.name, dbConfig.version);

      request.onerror = () => {
        const error = request.error;
        console.error('IndexedDB 초기화 실패:', error);
        
        // 버전 에러인 경우: 현재 버전 확인 후 재시도
        if (error && error.name === 'VersionError') {
          console.warn('⚠️ IndexedDB 버전 충돌 감지, 현재 버전 확인 중...');
          // 현재 버전 확인을 위해 버전 없이 열기 시도
          const checkRequest = window.indexedDB.open(dbConfig.name);
          checkRequest.onsuccess = () => {
            const currentVersion = checkRequest.result.version;
            checkRequest.result.close();
            console.log(`현재 IndexedDB 버전: ${currentVersion}, 요청 버전: ${dbConfig.version}`);
            
            // 현재 버전이 더 높으면 현재 버전으로 열기
            if (currentVersion > dbConfig.version) {
              console.log(`현재 버전(${currentVersion})으로 재시도...`);
              const retryRequest = window.indexedDB.open(dbConfig.name, currentVersion);
              retryRequest.onsuccess = () => {
                this.db = retryRequest.result;
                console.log('IndexedDB 초기화 성공 (현재 버전 사용)');
                resolve();
              };
              retryRequest.onerror = () => {
                console.error('IndexedDB 재시도 실패:', retryRequest.error);
                reject(retryRequest.error);
              };
            } else {
              reject(error);
            }
          };
          checkRequest.onerror = () => {
            reject(error);
          };
        } else {
          reject(error);
        }
=======
    // 이미 초기화 중이면 기존 Promise 반환
    if (this.initPromise) {
      return this.initPromise;
    }

    // 이미 초기화되었으면 즉시 반환
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbConfig.name, dbConfig.version);

      request.onerror = () => {
        console.error('IndexedDB 초기화 실패:', request.error);
        this.initPromise = null;
        reject(request.error);
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB 초기화 성공');
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
<<<<<<< HEAD
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;

        console.log(`IndexedDB 업그레이드: ${oldVersion} → ${newVersion}`);

        // 기존 스토어가 없으면 생성, 있으면 유지
        dbConfig.stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
=======
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        const oldVersion = event.oldVersion || 0;
        const newVersion = event.newVersion || dbConfig.version;

        console.log(`IndexedDB 업그레이드: ${oldVersion} -> ${newVersion}`);

        // 스토어 생성 또는 업데이트
        dbConfig.stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            // 스토어가 없으면 생성
            console.log(`스토어 생성: ${storeConfig.name}`);
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
            const objectStore = db.createObjectStore(storeConfig.name, { keyPath: storeConfig.keyPath });
            
            // 인덱스 생성
            storeConfig.indexes?.forEach(indexConfig => {
<<<<<<< HEAD
              objectStore.createIndex(indexConfig.name, indexConfig.keyPath, indexConfig.options);
            });
            console.log(`스토어 생성: ${storeConfig.name}`);
          } else {
            // 기존 스토어는 유지하고 인덱스만 확인
            // ⚠️ onupgradeneeded 내에서는 버전 변경 트랜잭션이 이미 실행 중이므로
            // db.transaction()을 호출할 수 없습니다. 
            // 버전 변경 트랜잭션 내에서만 인덱스를 추가할 수 있지만,
            // 기존 스토어에 인덱스를 추가하려면 event.transaction을 사용해야 합니다.
            // 하지만 event.transaction이 없을 수 있으므로, 안전하게 인덱스 추가를 스킵합니다.
            
            // 인덱스가 없어도 데이터 조회는 가능하므로 문제없습니다.
            // 인덱스는 성능 최적화를 위한 것이므로, 없어도 기능은 정상 작동합니다.
            console.log(`스토어 ${storeConfig.name} 이미 존재 - 인덱스 확인 스킵 (버전 변경 트랜잭션 제약)`);
=======
              try {
                objectStore.createIndex(indexConfig.name, indexConfig.keyPath, indexConfig.options);
                console.log(`인덱스 생성: ${storeConfig.name}.${indexConfig.name}`);
              } catch (err) {
                console.warn(`인덱스 생성 실패 (이미 존재할 수 있음): ${storeConfig.name}.${indexConfig.name}`, err);
              }
            });
          } else if (transaction) {
            // 스토어가 이미 존재하면 인덱스만 확인/생성
            try {
              const objectStore = transaction.objectStore(storeConfig.name);
              
              // 기존 인덱스 확인 후 없는 것만 생성
              storeConfig.indexes?.forEach(indexConfig => {
                if (!objectStore.indexNames.contains(indexConfig.name)) {
                  try {
                    objectStore.createIndex(indexConfig.name, indexConfig.keyPath, indexConfig.options);
                    console.log(`인덱스 추가: ${storeConfig.name}.${indexConfig.name}`);
                  } catch (err) {
                    console.warn(`인덱스 추가 실패: ${storeConfig.name}.${indexConfig.name}`, err);
                  }
                } else {
                  console.log(`인덱스 이미 존재: ${storeConfig.name}.${indexConfig.name}`);
                }
              });
            } catch (err) {
              console.warn(`스토어 접근 실패: ${storeConfig.name}`, err);
            }
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
          }
        });

        console.log('IndexedDB 스키마 업데이트 완료');
      };
    });

    return this.initPromise;
  }

  // 초기화 확인 및 자동 초기화
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  // 매물 데이터 관리
  async addProperty(property: any): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROPERTIES_STORE], 'readwrite');
      const store = transaction.objectStore(PROPERTIES_STORE);

      const request = store.add(property);

      request.onsuccess = () => {
        resolve(property.id);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getProperty(id: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROPERTIES_STORE], 'readonly');
      const store = transaction.objectStore(PROPERTIES_STORE);

      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllProperties(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      // 성능 최적화: readonly 트랜잭션 사용 및 최소한의 처리
      const transaction = this.db!.transaction([PROPERTIES_STORE], 'readonly', { 
        durability: 'relaxed' // 성능 우선
      });
      const store = transaction.objectStore(PROPERTIES_STORE);

      const request = store.getAll();

      request.onsuccess = () => {
        // 결과를 즉시 반환 (추가 처리 없음)
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async updateProperty(property: any): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROPERTIES_STORE], 'readwrite');
      const store = transaction.objectStore(PROPERTIES_STORE);

      const request = store.put(property);

      request.onsuccess = () => {
        // 캐시 업데이트
        if (propertiesCache !== null) {
          const index = propertiesCache.findIndex(p => p.id === property.id);
          if (index >= 0) {
            propertiesCache[index] = property;
          } else {
            propertiesCache.push(property);
          }
          cacheTimestamp = Date.now();
        }
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteProperty(id: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROPERTIES_STORE], 'readwrite');
      const store = transaction.objectStore(PROPERTIES_STORE);

      const request = store.delete(id);

      request.onsuccess = () => {
        // 캐시에서도 제거
        if (propertiesCache !== null) {
          propertiesCache = propertiesCache.filter(p => p.id !== id);
          cacheTimestamp = Date.now();
        }
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 검색 기능
  async searchProperties(query: string): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    const allProperties = await this.getAllProperties();
    const searchTerm = query.toLowerCase();

    return allProperties.filter(property => {
      const titleMatch = property.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = property.description?.toLowerCase().includes(searchTerm) || false;
      const addressMatch = property.address.toLowerCase().includes(searchTerm);
      
      // 추가 필드 검색: 관리비포함항목, 건축물용도, 주차대수, 추천업종, 매물현황
      const maintenanceFeeItemsMatch = property.maintenanceFeeItems?.toLowerCase().includes(searchTerm) || false;
      const buildingUseMatch = property.buildingUse?.toLowerCase().includes(searchTerm) || false;
      const parkingSpacesMatch = property.parkingSpaces?.toString().includes(query) || false;
      const recommendedBusinessTypeMatch = property.recommendedBusinessType?.toLowerCase().includes(searchTerm) || false;
      // 매물현황: type이 'sale'이면 '매매', 'rent'이면 '임대중'으로 검색
      const propertyStatusMatch = (property.type === 'sale' && searchTerm.includes('매매')) || 
                                  (property.type === 'rent' && searchTerm.includes('임대중')) ||
                                  (property.type === 'rent' && searchTerm.includes('임대'));
      
      // 연락처 정보 검색: 상호명, 이름, 전화번호, 이메일
      const contactNameMatch = property.contact?.name?.toLowerCase().includes(searchTerm) || false;
      // 전화번호 검색: 여러 번호가 쉼표로 구분되어 있을 수 있으므로 각각 검색
      const phoneNumbers = property.contact?.phone?.split(',').map((p: string) => p.trim()) || [];
      const contactPhoneMatch = phoneNumbers.some((phone: string) => phone.includes(query)) || false;
      const contactEmailMatch = property.contact?.email?.toLowerCase().includes(searchTerm) || false;
      // 상호명과 대표 이름 분리 검색
      const parseContactName = (name: string) => {
        if (!name) return { companyName: '', representativeName: '' };
        const parts = name.split(/\s+대표\s+/);
        if (parts.length === 2) {
          return { companyName: parts[0].trim(), representativeName: parts[1].trim() };
        }
        return { companyName: name.trim(), representativeName: '' };
      };
      const { companyName, representativeName } = parseContactName(property.contact?.name || '');
      const companyNameMatch = companyName.toLowerCase().includes(searchTerm) || false;
      const representativeNameMatch = representativeName.toLowerCase().includes(searchTerm) || false;
      
      return titleMatch || descriptionMatch || addressMatch ||
             maintenanceFeeItemsMatch || buildingUseMatch || parkingSpacesMatch ||
             recommendedBusinessTypeMatch || propertyStatusMatch ||
             contactNameMatch || contactPhoneMatch || contactEmailMatch ||
             companyNameMatch || representativeNameMatch;
    });
  }

  // 필터링 기능
  async getPropertiesByFilter(filters: {
    type?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
  }): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    const allProperties = await this.getAllProperties();

    return allProperties.filter(property => {
      if (filters.type && property.type !== filters.type) return false;
      if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
      if (filters.minPrice && property.price < filters.minPrice) return false;
      if (filters.maxPrice && property.price > filters.maxPrice) return false;
      if (filters.isActive !== undefined && property.isActive !== filters.isActive) return false;
      return true;
    });
  }

  // 이미지 관리
  async saveImage(id: string, imageData: Blob): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);

      const request = store.put({ id, data: imageData, timestamp: Date.now() });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getImage(id: string): Promise<Blob | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGES_STORE], 'readonly');
      const store = transaction.objectStore(IMAGES_STORE);

      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 설정 관리
  async saveSetting(key: string, value: any): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getSetting(key: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 데이터베이스 정보
  async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    objectStoreNames: string[];
    propertyCount: number;
    imageCount: number;
    settingsCount: number;
  }> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    const properties = await this.getAllProperties();
    const images = await this.getAllImages();
    const settings = await this.getAllSettings();

    return {
      name: this.db.name,
      version: this.db.version,
      objectStoreNames: Array.from(this.db.objectStoreNames),
      propertyCount: properties.length,
      imageCount: images.length,
      settingsCount: settings.length
    };
  }

  private async getAllImages(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGES_STORE], 'readonly');
      const store = transaction.objectStore(IMAGES_STORE);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async getAllSettings(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 데이터베이스 삭제
  async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(DB_NAME);

      request.onsuccess = () => {
        this.db = null;
        console.log('IndexedDB 삭제 완료');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // localStorage에서 데이터 마이그레이션
  async migrateFromLocalStorage(): Promise<number> {
    await this.ensureInitialized();
    try {
      const localData = localStorage.getItem('properties');
      if (!localData) return 0;

      const properties = JSON.parse(localData);
      let migratedCount = 0;

      for (const property of properties) {
        await this.addProperty(property);
        migratedCount++;
      }

      console.log(`${migratedCount}개의 매물을 localStorage에서 IndexedDB로 마이그레이션 완료`);
      return migratedCount;
    } catch (error) {
      console.error('localStorage 마이그레이션 오류:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
export const indexedDB = new IndexedDBManager();

// 성능 최적화: 데이터 캐시
let propertiesCache: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시 유지 (더 긴 캐시로 성능 향상)

// 편의 함수들
export const initDatabase = () => indexedDB.init();
export const addProperty = (property: any) => {
  propertiesCache = null; // 캐시 무효화
  return indexedDB.addProperty(property);
};
export const getProperty = (id: string) => indexedDB.getProperty(id);
export const getAllProperties = async (): Promise<any[]> => {
  // 캐시가 유효하면 즉시 반환 (매우 빠른 응답 - 동기적 반환)
  const now = Date.now();
  if (propertiesCache !== null && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('⚡ IndexedDB 캐시에서 즉시 반환:', propertiesCache.length, '개');
    // 동기적으로 즉시 반환 (Promise.resolve 사용)
    return propertiesCache;
  }
  
  // 캐시가 없거나 만료되었으면 새로 로드
  console.log('💾 IndexedDB에서 데이터 로드 중...');
  const startTime = performance.now();
  const properties = await indexedDB.getAllProperties();
  const loadTime = performance.now() - startTime;
  console.log(`✅ IndexedDB 로드 완료: ${properties.length}개 (${loadTime.toFixed(2)}ms)`);
  
  // 캐시 업데이트
  propertiesCache = properties;
  cacheTimestamp = now;
  return properties;
};
export const updateProperty = (property: any) => indexedDB.updateProperty(property);
export const deleteProperty = (id: string) => indexedDB.deleteProperty(id);
export const searchProperties = (query: string) => indexedDB.searchProperties(query);
export const getPropertiesByFilter = (filters: any) => indexedDB.getPropertiesByFilter(filters);
export const saveImage = (id: string, imageData: Blob) => indexedDB.saveImage(id, imageData);
export const getImage = (id: string) => indexedDB.getImage(id);
export const saveSetting = (key: string, value: any) => indexedDB.saveSetting(key, value);
export const getSetting = (key: string) => indexedDB.getSetting(key);
export const getDatabaseInfo = () => indexedDB.getDatabaseInfo();
export const clearAllProperties = () => indexedDB.deleteDatabase();
export const deleteDatabase = () => indexedDB.deleteDatabase();
export const migrateFromLocalStorage = () => indexedDB.migrateFromLocalStorage(); 