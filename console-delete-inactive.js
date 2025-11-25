// 브라우저 콘솔에서 바로 실행할 수 있는 코드
// 이 코드를 복사해서 브라우저 콘솔에 붙여넣고 실행하세요

(async function() {
  try {
    console.log('🗑️ 삭제된 매물(isActive: false) 완전 삭제 시작...');
    
    // firebaseSync가 있는지 확인
    if (!window.firebaseSync) {
      console.error('❌ firebaseSync를 찾을 수 없습니다.');
      console.log('💡 페이지를 새로고침하고 다시 시도해주세요.');
      return;
    }
    
    // Firebase 모듈을 동적으로 가져오기
    // webpack의 require를 사용하거나, 이미 로드된 모듈 찾기
    let firestoreModule;
    try {
      // webpack의 require 사용 시도
      if (typeof __webpack_require__ !== 'undefined') {
        firestoreModule = __webpack_require__('firebase/firestore');
      } else {
        // 동적 import 시도
        firestoreModule = await import('firebase/firestore');
      }
    } catch (e) {
      console.error('❌ Firebase 모듈을 가져올 수 없습니다:', e);
      console.log('💡 대안: firebaseSync를 사용하여 각 매물을 개별 삭제하세요.');
      return;
    }
    
    const { getFirestore, collection, getDocs, query, where, doc, writeBatch } = firestoreModule;
    
    // db 가져오기
    let db;
    if (window.__firebaseDb) {
      db = window.__firebaseDb;
    } else {
      db = getFirestore();
    }
    
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
    const idsToDelete = [];
    querySnapshot.docs.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      console.log(`${index + 1}. ID: ${docSnapshot.id}, 제목: ${data.title || '제목 없음'}`);
      idsToDelete.push(docSnapshot.id);
    });
    
    // 사용자 확인
    const confirmed = confirm(`정말로 ${idsToDelete.length}개의 삭제된 매물을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
    
    if (!confirmed) {
      console.log('❌ 사용자가 취소했습니다.');
      return;
    }
    
    // firebaseSync를 사용하여 각 매물 삭제 (더 안전함)
    console.log('\n🗑️ 매물 삭제 시작...');
    let successCount = 0;
    let failCount = 0;
    
    for (const id of idsToDelete) {
      try {
        await window.firebaseSync.deleteProperty(id);
        console.log(`✅ ${id} 삭제 완료`);
        successCount++;
        // 각 삭제 사이에 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ ${id} 삭제 실패:`, error);
        failCount++;
      }
    }
    
    console.log(`\n🎉 삭제 완료!`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    
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
    console.log('\n💡 대안: firebaseSync를 사용하여 각 매물을 개별 삭제하세요.');
    console.log('예: window.firebaseSync.deleteProperty("매물ID")');
  }
})();










