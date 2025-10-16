# 🔍 Firebase 매물 저장 테스트 체크리스트

## ✅ 테스트 전 확인사항

### 1. Firestore 보안 규칙 설정
- [ ] Firebase 콘솔에서 Firestore 규칙이 올바르게 설정되었는가?
- [ ] 규칙이 "게시"되었는가?
- [ ] 인증된 사용자에게 읽기/쓰기 권한이 있는가?

### 2. 사용자 인증 상태
- [ ] 웹사이트에서 로그인이 되어 있는가?
- [ ] Firebase 인증이 정상적으로 작동하는가?

### 3. 개발 환경 설정
- [ ] 개발 서버가 정상적으로 실행되고 있는가?
- [ ] 브라우저 콘솔에 에러가 없는가?

## 🧪 테스트 실행 단계

### Step 1: 디버거 활성화
1. 브라우저에서 `http://localhost:3000` 접속
2. 우측 상단 "🔧 Debug" 버튼 클릭
3. Firebase 디버거 패널이 열리는지 확인

### Step 2: 테스트 매물 추가
1. "🧪 테스트 매물 추가" 버튼 클릭
2. 콘솔에서 다음 메시지 확인:
   ```
   === 테스트 매물 추가 시작 ===
   Firebase 프로젝트 ID: pa-realestate-sync-cb990
   컬렉션 이름: properties
   현재 인증된 사용자: [사용자UID]
   테스트 매물 데이터: {...}
   테스트 매물 추가 성공, ID: [문서ID]
   === 테스트 매물 추가 완료 ===
   ```

### Step 3: 매물 목록 조회
1. "📋 매물 목록 조회" 버튼 클릭
2. 콘솔에서 다음 메시지 확인:
   ```
   === 매물 목록 조회 시작 ===
   Firebase 프로젝트 ID: pa-realestate-sync-cb990
   컬렉션 이름: properties
   총 문서 수: 1
   매물 목록 조회 성공: 1 개
   === 매물 목록 조회 완료 ===
   ```

## 🚨 문제 발생 시 해결 방법

### 에러: `permission-denied`
**원인:** Firestore 보안 규칙 문제
**해결:**
1. Firebase 콘솔 → Firestore Database → 규칙
2. 다음 규칙으로 변경:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /properties/{document} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. "게시" 버튼 클릭
4. 2-3분 대기 후 다시 시도

### 에러: `unauthenticated`
**원인:** 사용자 인증 문제
**해결:**
1. 웹사이트에서 로그아웃
2. 다시 로그인
3. 테스트 재실행

### 에러: `invalid-argument`
**원인:** 데이터 형식 문제
**해결:**
1. 콘솔에서 상세 에러 메시지 확인
2. 매물 데이터 구조 검토
3. 필수 필드 누락 여부 확인

## 📊 성공 확인 방법

### 1. 콘솔 로그 확인
- 모든 단계에서 성공 메시지가 표시되는가?
- 에러 메시지가 없는가?

### 2. Firebase 콘솔 확인
1. Firebase 콘솔 → Firestore Database → 데이터 탭
2. `properties` 컬렉션이 생성되었는가?
3. 테스트 매물 데이터가 저장되었는가?

### 3. 웹사이트에서 확인
1. 매물 목록 조회 기능 테스트
2. 지도에 매물 마커가 표시되는가?
3. 매물 상세 정보가 정상적으로 표시되는가?

## 🔄 다음 단계

테스트가 성공하면:
1. 실제 엑셀 파일로 매물 대량 등록 테스트
2. 다양한 매물 타입으로 테스트
3. 에러 처리 및 사용자 경험 개선

테스트가 실패하면:
1. 위의 해결 방법 시도
2. Firebase 콘솔에서 추가 설정 확인
3. 네트워크 연결 및 브라우저 설정 확인

---

**테스트 완료 후 결과를 알려주세요!**

