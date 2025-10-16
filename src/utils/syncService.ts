import { Property } from '../types';
import * as IndexedDB from './indexedDB';

// Firebase 설정 (실제 구현 시 필요)
// import { initializeApp } from 'firebase/app';
// import { getFirestore, doc, updateDoc, onSnapshot } from 'firebase/firestore';

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private pendingUpdates: Property[] = [];

  constructor() {
    // 온라인/오프라인 상태 감지
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  // 매물 업데이트 (PC/모바일 동기화)
  async updateProperty(property: Property): Promise<void> {
    try {
      // 1. 로컬 IndexedDB에 즉시 저장 (빠른 응답)
      await IndexedDB.updateProperty(property);
      
      if (this.isOnline) {
        // 2. 온라인 상태: 클라우드에 동기화
        await this.syncToCloud(property);
      } else {
        // 3. 오프라인 상태: 대기열에 추가
        this.pendingUpdates.push(property);
        console.log('오프라인 상태: 나중에 동기화 예정');
      }
    } catch (error) {
      console.error('매물 업데이트 실패:', error);
      throw error;
    }
  }

  // 클라우드 동기화 (Firebase/서버)
  private async syncToCloud(property: Property): Promise<void> {
    try {
      // Firebase 예시 (실제 구현 시)
      // await updateDoc(doc(db, 'properties', property.id), property);
      
      // 또는 REST API 호출
      const response = await fetch('/api/properties/' + property.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(property)
      });
      
      if (!response.ok) {
        throw new Error('클라우드 동기화 실패');
      }
      
      console.log('클라우드 동기화 완료:', property.id);
    } catch (error) {
      console.error('클라우드 동기화 실패:', error);
      // 실패 시 대기열에 추가
      this.pendingUpdates.push(property);
    }
  }

  // 클라우드에서 데이터 가져오기
  async loadFromCloud(): Promise<Property[]> {
    try {
      if (!this.isOnline) {
        console.log('오프라인 상태: 로컬 데이터 사용');
        return await IndexedDB.getAllProperties();
      }

      const response = await fetch('/api/properties');
      const cloudProperties = await response.json();
      
      // 클라우드 데이터를 로컬에 동기화
      for (const property of cloudProperties) {
        await IndexedDB.updateProperty(property);
      }
      
      return cloudProperties;
    } catch (error) {
      console.error('클라우드 로드 실패, 로컬 데이터 사용:', error);
      return await IndexedDB.getAllProperties();
    }
  }

  // 온라인 복구 시 대기 중인 업데이트 동기화
  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    console.log('온라인 복구: 대기 중인 업데이트 동기화 시작');
    
    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];
    
    for (const property of updates) {
      try {
        await this.syncToCloud(property);
      } catch (error) {
        console.error('동기화 실패:', property.id, error);
        // 실패한 것은 다시 대기열에 추가
        this.pendingUpdates.push(property);
      }
    }
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log('오프라인 상태: 로컬 IndexedDB만 사용');
  }

  // 실시간 동기화 설정 (Firebase 사용 시)
  setupRealTimeSync(onPropertyUpdate: (property: Property) => void): void {
    // Firebase 실시간 리스너 예시
    // onSnapshot(collection(db, 'properties'), (snapshot) => {
    //   snapshot.docChanges().forEach((change) => {
    //     if (change.type === 'modified') {
    //       const property = change.doc.data() as Property;
    //       // 로컬 IndexedDB 업데이트
    //       IndexedDB.updateProperty(property);
    //       // UI 업데이트
    //       onPropertyUpdate(property);
    //     }
    //   });
    // });
  }
}

export const syncService = new SyncService(); 