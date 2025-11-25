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
      
      return properties.filter(property => {
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