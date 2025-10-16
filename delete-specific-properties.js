// IndexedDB에서 특정 매물들만 삭제하는 스크립트
// 브라우저 콘솔에서 실행하세요

async function deleteSpecificProperties() {
  try {
    console.log('🗑️ 특정 매물들 삭제 시작...');
    
    // 삭제할 매물 ID들
    const propertiesToDelete = ['P1', 'P001', 'P2'];
    
    // IndexedDB 데이터베이스 열기
    const request = indexedDB.open('RealEstateDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['properties'], 'readwrite');
      const store = transaction.objectStore('properties');
      
      let deletedCount = 0;
      let totalToDelete = propertiesToDelete.length;
      
      // 각 매물 삭제
      propertiesToDelete.forEach((propertyId, index) => {
        const deleteRequest = store.delete(propertyId);
        
        deleteRequest.onsuccess = function() {
          console.log(`✅ ${propertyId} 삭제 완료`);
          deletedCount++;
          
          if (deletedCount === totalToDelete) {
            console.log(`🎉 삭제 완료! 총 ${deletedCount}개 매물 삭제됨`);
            
            // 페이지 새로고침
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        };
        
        deleteRequest.onerror = function() {
          console.log(`⚠️ ${propertyId} 삭제 실패 (이미 없거나 오류):`, deleteRequest.error);
          deletedCount++;
          
          if (deletedCount === totalToDelete) {
            console.log(`🎉 삭제 완료! 총 ${deletedCount}개 매물 처리됨`);
            
            // 페이지 새로고침
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        };
      });
    };
    
    request.onerror = function() {
      console.error('❌ IndexedDB 열기 실패:', request.error);
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 실행
deleteSpecificProperties();

