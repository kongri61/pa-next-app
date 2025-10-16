// IndexedDB에서 모든 매물 데이터 삭제 스크립트
// 브라우저 콘솔에서 실행하세요

async function clearAllProperties() {
  try {
    console.log('🗑️ IndexedDB에서 모든 매물 데이터 삭제 시작...');
    
    // IndexedDB 데이터베이스 열기
    const request = indexedDB.open('RealEstateDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['properties'], 'readwrite');
      const store = transaction.objectStore('properties');
      
      // 모든 데이터 조회
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const allProperties = getAllRequest.result;
        console.log('📋 현재 저장된 매물들:', allProperties.map(p => ({ id: p.id, title: p.title, address: p.address })));
        
        // 모든 매물 삭제
        const deleteRequest = store.clear();
        
        deleteRequest.onsuccess = function() {
          console.log('✅ IndexedDB에서 모든 매물 데이터 삭제 완료!');
          console.log(`🗑️ 삭제된 매물 수: ${allProperties.length}개`);
          
          // 페이지 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        };
        
        deleteRequest.onerror = function() {
          console.error('❌ 데이터 삭제 실패:', deleteRequest.error);
        };
      };
      
      getAllRequest.onerror = function() {
        console.error('❌ 데이터 조회 실패:', getAllRequest.error);
      };
    };
    
    request.onerror = function() {
      console.error('❌ IndexedDB 열기 실패:', request.error);
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 실행
clearAllProperties();

