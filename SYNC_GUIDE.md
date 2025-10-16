# 데이터 동기화 가이드

이 가이드는 기존 로컬 데이터를 Firebase로 동기화하는 방법을 설명합니다.

## 1. 동기화가 필요한 이유

### 1.1 현재 상황
- 기존에는 로컬 스토리지에 매물 데이터 저장
- Firebase 설정 후 클라우드 데이터베이스 사용 필요
- 데이터 일관성 및 백업을 위한 동기화 필요

### 1.2 동기화의 장점
- **데이터 백업**: 클라우드에 안전한 데이터 보관
- **실시간 동기화**: 여러 사용자가 동시에 데이터 접근 가능
- **확장성**: 대용량 데이터 처리 가능
- **접근성**: 어디서든 데이터 접근 가능

## 2. 동기화 방법

### 2.1 자동 동기화 (권장)
1. **로그인**: Firebase 인증으로 로그인
2. **동기화 관리자 접근**: "대량 매물 등록" 모달에서 "📊 데이터 동기화 관리" 버튼 클릭
3. **동기화 실행**: "Firebase로 동기화" 버튼 클릭
4. **완료 확인**: 진행률 바와 완료 메시지 확인

### 2.2 수동 동기화
개발자 도구 콘솔에서 직접 실행:

```javascript
// 브라우저 콘솔에서 실행
import { migrateDataToFirebase } from './src/utils/dataMigration';

// 동기화 실행
migrateDataToFirebase()
  .then(ids => console.log('동기화 완료:', ids))
  .catch(error => console.error('동기화 실패:', error));
```

## 3. 동기화 데이터

### 3.1 기본 샘플 데이터
동기화 시 다음 샘플 데이터가 Firebase에 저장됩니다:

1. **강남구 역삼동 상가**
   - 매매: 8억 5천만원
   - 상가, 84.5평
   - 주차/엘리베이터 가능

2. **홍대입구 근처 사무실**
   - 임대: 월 50만원, 보증금 1천만원
   - 사무실, 25.3평
   - 엘리베이터만 가능

3. **인천 송도 신축 건물**
   - 매매: 12억원
   - 건물, 150평
   - 주차/엘리베이터/CCTV 가능

### 3.2 커스텀 데이터 동기화
기존 로컬 데이터가 있는 경우:

```javascript
// 로컬 데이터 확인
const localData = localStorage.getItem('properties');
console.log('로컬 데이터:', JSON.parse(localData));

// 커스텀 데이터 동기화
const customProperties = [
  // 여기에 커스텀 매물 데이터 추가
];

// Firebase에 저장
import { addMultipleProperties } from './src/firebase/propertyService';
addMultipleProperties(customProperties);
```

## 4. 동기화 상태 확인

### 4.1 동기화 상태 표시
- 🟢 **초록색**: 동기화 완료
- 🔴 **빨간색**: 동기화 필요
- 📊 **진행률 바**: 동기화 진행 상황

### 4.2 상태 정보
- **로컬 데이터 수**: 현재 로컬에 저장된 매물 수
- **Firebase 데이터 수**: 클라우드에 저장된 매물 수
- **마지막 동기화 시간**: 최근 동기화 완료 시간

## 5. 동기화 후 작업

### 5.1 데이터 확인
1. **Firebase Console**에서 데이터 확인
   - Firestore Database > properties 컬렉션
   - 각 문서의 필드 확인

2. **애플리케이션에서 확인**
   - 지도에 마커 표시 확인
   - 매물 목록에서 데이터 확인

### 5.2 추가 작업
- **새 매물 등록**: Firebase를 통한 실시간 저장
- **매물 수정**: 클라우드 데이터 업데이트
- **매물 삭제**: 소프트 삭제로 데이터 보존

## 6. 문제 해결

### 6.1 일반적인 문제

#### 동기화 버튼이 비활성화됨
- **원인**: 이미 동기화가 완료된 상태
- **해결**: 로컬 스토리지 초기화 후 재시도

```javascript
// 로컬 스토리지 초기화
localStorage.removeItem('firebase_property_count');
localStorage.removeItem('last_sync_time');
```

#### 동기화 중 오류 발생
- **원인**: Firebase 연결 문제 또는 권한 오류
- **해결**: 
  1. Firebase 설정 확인
  2. 로그인 상태 확인
  3. 네트워크 연결 확인

#### 데이터가 중복으로 저장됨
- **원인**: 동기화를 여러 번 실행
- **해결**: Firebase Console에서 중복 데이터 수동 삭제

### 6.2 디버깅

#### 콘솔 로그 확인
```javascript
// 동기화 상태 확인
import { checkSyncStatus } from './src/utils/dataMigration';
console.log('동기화 상태:', checkSyncStatus());

// 마지막 동기화 시간 확인
import { getLastSyncTime } from './src/utils/dataMigration';
console.log('마지막 동기화:', getLastSyncTime());
```

#### Firebase Console 확인
1. **Authentication**: 로그인된 사용자 확인
2. **Firestore Database**: 데이터 저장 확인
3. **Storage**: 이미지 파일 확인

## 7. 고급 설정

### 7.1 배치 처리
대용량 데이터 동기화 시:

```javascript
// 배치 크기 설정
const BATCH_SIZE = 500;

// 배치별 동기화
for (let i = 0; i < data.length; i += BATCH_SIZE) {
  const batch = data.slice(i, i + BATCH_SIZE);
  await addMultipleProperties(batch);
  console.log(`배치 ${i / BATCH_SIZE + 1} 완료`);
}
```

### 7.2 데이터 검증
동기화 전 데이터 검증:

```javascript
// 데이터 유효성 검사
const validateProperty = (property) => {
  const required = ['title', 'price', 'address', 'location'];
  return required.every(field => property[field]);
};

// 검증 후 동기화
const validProperties = properties.filter(validateProperty);
await addMultipleProperties(validProperties);
```

## 8. 보안 고려사항

### 8.1 데이터 보호
- **인증 필수**: 로그인한 사용자만 동기화 가능
- **권한 제한**: 작성자만 데이터 수정/삭제 가능
- **데이터 암호화**: Firebase 자동 암호화 활용

### 8.2 백업 전략
- **정기 백업**: Firebase 자동 백업 활용
- **다중 저장**: 로컬 + 클라우드 이중 저장
- **버전 관리**: 데이터 변경 이력 추적

## 9. 성능 최적화

### 9.1 동기화 최적화
- **증분 동기화**: 변경된 데이터만 동기화
- **배치 처리**: 대량 데이터 배치 단위 처리
- **캐싱**: 자주 사용하는 데이터 캐싱

### 9.2 네트워크 최적화
- **이미지 압축**: 업로드 전 이미지 압축
- **지연 로딩**: 필요시에만 데이터 로드
- **오프라인 지원**: 네트워크 없이도 기본 기능 사용

## 10. 추가 리소스

- [Firebase 데이터 마이그레이션 가이드](https://firebase.google.com/docs/firestore/manage-data/migrate-data)
- [Firestore 배치 작업](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firebase 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started) 