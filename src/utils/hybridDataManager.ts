import { initDatabase, getAllProperties as getIndexedDBProperties, addProperty as addToIndexedDB, updateProperty as updateInIndexedDB, deleteProperty as deleteFromIndexedDB } from './indexedDB';
import { Property } from '../types';

// 동기화 상태 (오프라인 전용)
interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
}

// IndexedDB 전용 데이터 관리자 클래스
class IndexedDBDataManager {
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingChanges: 0,
    syncInProgress: false
  };

  // 초기화
  async init(): Promise<void> {
    try {
      // IndexedDB 초기화
      await initDatabase();
      
      // 네트워크 상태 감지
      this.setupNetworkListeners();
      
      console.log('IndexedDB 데이터 관리자 초기화 완료');
    } catch (error) {
      console.error('IndexedDB 데이터 관리자 초기화 실패:', error);
      throw error;
    }
  }

  // 네트워크 상태 감지 설정
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      console.log('네트워크 연결됨');
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      console.log('네트워크 연결 끊김 - 오프라인 모드');
    });
  }

  // 매물 추가 (IndexedDB만 사용)
  async addProperty(property: Omit<Property, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = await addToIndexedDB({
        ...property,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      });

      console.log('매물 추가 완료:', id);
      return id;
    } catch (error) {
      console.error('매물 추가 실패:', error);
      throw error;
    }
  }

  // 매물 조회 (IndexedDB만 사용)
  async getProperties(): Promise<Property[]> {
    try {
      const properties = await getIndexedDBProperties();
      return properties.filter(p => p.isActive !== false);
    } catch (error) {
      console.error('매물 조회 실패:', error);
      throw error;
    }
  }

  // 매물 업데이트 (IndexedDB만 사용)
  async updateProperty(id: string, updates: Partial<Property>): Promise<void> {
    try {
      // 기존 매물 정보 가져오기
      const existingProperty = await getIndexedDBProperties();
      const property = existingProperty.find(p => p.id === id);
      
      if (!property) {
        throw new Error('매물을 찾을 수 없습니다.');
      }

      // 업데이트된 매물 객체 생성
      const updatedProperty = {
        ...property,
        ...updates,
        updatedAt: new Date()
      };

      await updateInIndexedDB(updatedProperty);
      console.log('매물 업데이트 완료:', id);
    } catch (error) {
      console.error('매물 업데이트 실패:', error);
      throw error;
    }
  }

  // 매물 삭제 (IndexedDB만 사용)
  async deleteProperty(id: string): Promise<void> {
    try {
      await deleteFromIndexedDB(id);
      console.log('매물 삭제 완료:', id);
    } catch (error) {
      console.error('매물 삭제 실패:', error);
      throw error;
    }
  }

  // 검색 기능
  async searchProperties(query: string): Promise<Property[]> {
    try {
      const properties = await getIndexedDBProperties();
      const searchTerm = query.toLowerCase();
      
      return properties.filter(property => 
        property.title.toLowerCase().includes(searchTerm) ||
        property.description.toLowerCase().includes(searchTerm) ||
        property.address.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('매물 검색 실패:', error);
      throw error;
    }
  }

  // 필터링 기능
  async getPropertiesByFilter(filters: {
    type?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Property[]> {
    try {
      const properties = await getIndexedDBProperties();
      
      return properties.filter(property => {
        // 거래유형 필터
        if (filters.type && property.type !== filters.type) {
          return false;
        }
        
        // 매물종류 필터
        if (filters.propertyType && property.propertyType !== filters.propertyType) {
          return false;
        }
        
        // 가격 필터
        if (filters.minPrice && property.price < filters.minPrice) {
          return false;
        }
        
        if (filters.maxPrice && property.price > filters.maxPrice) {
          return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('매물 필터링 실패:', error);
      throw error;
    }
  }

  // 동기화 상태 조회
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // 데이터베이스 정보 조회
  async getDatabaseInfo(): Promise<{
    indexedDB: any;
    syncStatus: SyncStatus;
    pendingChanges: number;
  }> {
    try {
      const properties = await getIndexedDBProperties();
      return {
        indexedDB: {
          totalProperties: properties.length,
          activeProperties: properties.filter(p => p.isActive !== false).length
        },
        syncStatus: this.getSyncStatus(),
        pendingChanges: this.syncStatus.pendingChanges
      };
    } catch (error) {
      console.error('데이터베이스 정보 조회 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
const dataManager = new IndexedDBDataManager();

// 외부에서 사용할 함수들
export const initHybridDataManager = () => dataManager.init();
export const addPropertyHybrid = (property: Omit<Property, 'id' | 'createdAt'>) => dataManager.addProperty(property);
export const getPropertiesHybrid = () => dataManager.getProperties();
export const updatePropertyHybrid = (id: string, updates: Partial<Property>) => dataManager.updateProperty(id, updates);
export const deletePropertyHybrid = (id: string) => dataManager.deleteProperty(id);
export const getSyncStatus = () => dataManager.getSyncStatus();
export const getDatabaseInfo = () => dataManager.getDatabaseInfo();
export const searchPropertiesHybrid = (query: string) => dataManager.searchProperties(query);
export const getPropertiesByFilterHybrid = (filters: any) => dataManager.getPropertiesByFilter(filters); 