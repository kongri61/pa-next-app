// Firebase에서 isActive: false인 매물들을 완전히 삭제하는 스크립트
// 브라우저 콘솔에서 실행하세요

async function deleteInactiveProperties() {
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
    let errorCount = 0;
    
    // Batch를 사용하여 한 번에 삭제 (더 효율적)
    const batch = writeBatch(db);
    const batchSize = 500; // Firestore batch 제한
    let currentBatch = batch;
    let batchCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const propertyId = docSnapshot.id;
      const propertyData = docSnapshot.data();
      
      console.log(`🗑️ ${propertyId} 삭제 예정... (${propertyData.title || '제목 없음'})`);
      
      currentBatch.delete(doc(db, 'properties', propertyId));
      batchCount++;
      
      // Batch 제한에 도달하면 커밋하고 새 batch 생성
      if (batchCount >= batchSize) {
        await currentBatch.commit();
        console.log(`✅ ${batchCount}개 매물 삭제 완료`);
        currentBatch = writeBatch(db);
        batchCount = 0;
        deletedCount += batchSize;
        
        // Firebase 제한 방지를 위한 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 남은 매물들 삭제
    if (batchCount > 0) {
      await currentBatch.commit();
      console.log(`✅ 마지막 ${batchCount}개 매물 삭제 완료`);
      deletedCount += batchCount;
    }
    
    console.log(`\n🎉 삭제 완료!`);
    console.log(`✅ 총 ${deletedCount}개 매물 삭제됨`);
    console.log(`❌ 실패: ${errorCount}개`);
    
    // 페이지 새로고침 안내
    console.log('\n💡 페이지를 새로고침하여 변경사항을 확인하세요.');
    const reload = confirm('페이지를 새로고침하시겠습니까?');
    if (reload) {
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ 삭제 과정에서 오류 발생:', error);
    console.log('\n💡 대안: 브라우저 콘솔에서 다음 코드를 실행하세요:');
    console.log(`
// 직접 실행
(async () => {
  const { getFirestore, collection, getDocs, query, where, deleteDoc, doc } = await import('firebase/firestore');
  const db = getFirestore();
  const q = query(collection(db, 'properties'), where('isActive', '==', false));
  const snapshot = await getDocs(q);
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(doc(db, 'properties', docSnapshot.id));
    console.log('삭제:', docSnapshot.id);
  }
  console.log('완료!');
})();
    `);
  }
}

// 전역 함수로 등록
window.deleteInactiveProperties = deleteInactiveProperties;

// 자동 실행 (선택사항 - 주석 해제하면 페이지 로드 시 자동 실행)
// deleteInactiveProperties();

console.log('✅ deleteInactiveProperties 함수가 준비되었습니다.');
console.log('💡 브라우저 콘솔에서 deleteInactiveProperties()를 실행하세요.');
