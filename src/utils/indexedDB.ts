// IndexedDB 설정
const DB_NAME = 'RealEstateDB';
const DB_VERSION = 3; // 버전 업데이트: PC 사이트 URL 수정 (pa-realestate-pc.vercel.app)
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

  // 데이터베이스 초기화
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbConfig.name, dbConfig.version);

      request.onerror = () => {
        console.error('IndexedDB 초기화 실패:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB 초기화 성공');
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 기존 스토어 삭제
        if (db.objectStoreNames.contains(PROPERTIES_STORE)) {
          db.deleteObjectStore(PROPERTIES_STORE);
        }
        if (db.objectStoreNames.contains(IMAGES_STORE)) {
          db.deleteObjectStore(IMAGES_STORE);
        }
        if (db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.deleteObjectStore(SETTINGS_STORE);
        }

        // 스토어 생성
        dbConfig.stores.forEach(storeConfig => {
          const objectStore = db.createObjectStore(storeConfig.name, { keyPath: storeConfig.keyPath });
          
          // 인덱스 생성
          storeConfig.indexes?.forEach(indexConfig => {
            objectStore.createIndex(indexConfig.name, indexConfig.keyPath, indexConfig.options);
          });
        });

        console.log('IndexedDB 스키마 업데이트 완료');
      };
    });
  }

  // 매물 데이터 관리
  async addProperty(property: any): Promise<string> {
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
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROPERTIES_STORE], 'readonly');
      const store = transaction.objectStore(PROPERTIES_STORE);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async updateProperty(property: any): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROPERTIES_STORE], 'readwrite');
      const store = transaction.objectStore(PROPERTIES_STORE);

      const request = store.put(property);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteProperty(id: string): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROPERTIES_STORE], 'readwrite');
      const store = transaction.objectStore(PROPERTIES_STORE);

      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 검색 기능
  async searchProperties(query: string): Promise<any[]> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');

    const allProperties = await this.getAllProperties();
    const searchTerm = query.toLowerCase();

    return allProperties.filter(property => 
      property.title.toLowerCase().includes(searchTerm) ||
      property.description.toLowerCase().includes(searchTerm) ||
      property.address.toLowerCase().includes(searchTerm)
    );
  }

  // 필터링 기능
  async getPropertiesByFilter(filters: {
    type?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
  }): Promise<any[]> {
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

// 편의 함수들
export const initDatabase = () => indexedDB.init();
export const addProperty = (property: any) => indexedDB.addProperty(property);
export const getProperty = (id: string) => indexedDB.getProperty(id);
export const getAllProperties = () => indexedDB.getAllProperties();
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