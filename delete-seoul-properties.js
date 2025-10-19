// Firebase에서 서울 매물들 삭제 스크립트
// 브라우저 콘솔에서 실행하세요

// 삭제할 매물 ID들
const propertiesToDelete = ['P1', 'P001', 'P2'];

// Firebase 삭제 함수
async function deleteSeoulProperties() {
  try {
    console.log('🗑️ 서울 매물 삭제 시작...');
    
    // Firebase 모듈이 로드될 때까지 대기
    if (typeof window.firebaseSync === 'undefined') {
      console.log('⏳ Firebase 모듈 로딩 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (typeof window.firebaseSync === 'undefined') {
      throw new Error('Firebase 모듈을 찾을 수 없습니다. 페이지를 새로고침하고 다시 시도하세요.');
    }
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const propertyId of propertiesToDelete) {
      try {
        console.log(`🗑️ ${propertyId} 삭제 중...`);
        await window.firebaseSync.deleteProperty(propertyId);
        console.log(`✅ ${propertyId} 삭제 완료`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ ${propertyId} 삭제 실패:`, error);
        errorCount++;
      }
      
      // 각 삭제 사이에 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 삭제 완료!`);
    console.log(`✅ 성공: ${deletedCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    
  } catch (error) {
    console.error('❌ 삭제 과정에서 오류 발생:', error);
  }
}

// 실행
deleteSeoulProperties();


