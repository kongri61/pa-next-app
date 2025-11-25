// 브라우저 콘솔에서 직접 실행할 수 있는 코드
// 이 코드를 복사해서 브라우저 콘솔에 붙여넣고 실행하세요

(async function deleteInactiveProperties() {
  try {
    console.log('🗑️ 삭제된 매물(isActive: false) 완전 삭제 시작...');
    
    // Firebase 모듈 import
    const { getFirestore, collection, getDocs, query, where, deleteDoc, doc, writeBatch } = await import('firebase/firestore');
    const db = getFirestore();
    
    if (!db) {
      throw new Error('Firebase가 초기화되지 않았습니다.');
    }
    
    // isActive: false인 매물들 조회
    const q = query(collection(db, 'properties'), where('isActive', '==', false));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 삭제된 매물 발견: ${querySnapshot.docs.length}개`);
    
    if (querySnapshot.docs.length === 0) {
      console.log('✅ 삭제할 매물이 없습니다.');
      return;
    }
    
    // 삭제할 매물 목록 출력
    console.log('\n📋 삭제할 매물 목록:');
    querySnapshot.docs.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      console.log(`${index + 1}. ID: ${docSnapshot.id}, 제목: ${data.title || '제목 없음'}`);
    });
    
    // 사용자 확인
    const confirmed = confirm(`정말로 ${querySnapshot.docs.length}개의 삭제된 매물을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
    
    if (!confirmed) {
      console.log('❌ 사용자가 취소했습니다.');
      return;
    }
    
    let deletedCount = 0;
    const batch = writeBatch(db);
    const batchSize = 500;
    let batchCount = 0;
    let currentBatch = batch;
    
    for (const docSnapshot of querySnapshot.docs) {
      const propertyId = docSnapshot.id;
      currentBatch.delete(doc(db, 'properties', propertyId));
      batchCount++;
      
      if (batchCount >= batchSize) {
        await currentBatch.commit();
        console.log(`✅ ${batchCount}개 매물 삭제 완료`);
        currentBatch = writeBatch(db);
        batchCount = 0;
        deletedCount += batchSize;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (batchCount > 0) {
      await currentBatch.commit();
      deletedCount += batchCount;
    }
    
    console.log(`\n🎉 삭제 완료! 총 ${deletedCount}개 매물 삭제됨`);
    
    // IndexedDB에서도 삭제
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('RealEstateDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const allProperties = await new Promise((resolve, reject) => {
        const transaction = db.transaction(['properties'], 'readonly');
        const store = transaction.objectStore('properties');
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
      
      const inactiveProperties = allProperties.filter(p => p.isActive === false);
      
      if (inactiveProperties.length > 0) {
        console.log(`🗑️ IndexedDB에서 ${inactiveProperties.length}개 삭제된 매물 삭제 중...`);
        for (const property of inactiveProperties) {
          const transaction = db.transaction(['properties'], 'readwrite');
          const store = transaction.objectStore('properties');
          store.delete(property.id);
        }
        console.log('✅ IndexedDB 정리 완료');
      }
    } catch (error) {
      console.warn('⚠️ IndexedDB 정리 중 오류 (무시 가능):', error);
    }
    
    const reload = confirm('페이지를 새로고침하시겠습니까?');
    if (reload) {
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ 삭제 과정에서 오류 발생:', error);
  }
})();

