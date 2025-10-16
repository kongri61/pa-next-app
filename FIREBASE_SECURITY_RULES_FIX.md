# Firebase 보안 규칙 수정 가이드

## 문제 상황
매물 목록 조회 시 "매물을 불러오는 중 오류가 발생했습니다" 오류가 발생하고 있습니다.

## 원인 분석
Firebase Firestore 보안 규칙이 너무 제한적으로 설정되어 있어서 인증되지 않은 사용자가 매물을 조회할 수 없습니다.

## 해결 방법

### 1. Firebase 콘솔 접속
1. [Firebase 콘솔](https://console.firebase.google.com/)에 접속
2. 프로젝트 `pa-realestate-sync-cb990` 선택
3. 왼쪽 메뉴에서 "Firestore Database" 클릭
4. "규칙" 탭 클릭

### 2. 보안 규칙 수정
현재 규칙을 다음과 같이 수정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 매물 컬렉션 - 읽기는 모든 사용자에게 허용, 쓰기는 인증된 사용자만
    match /properties/{document} {
      allow read: if true;  // 모든 사용자가 매물 조회 가능
      allow write: if request.auth != null;  // 인증된 사용자만 매물 추가/수정/삭제 가능
    }
    
    // 기타 컬렉션들도 필요에 따라 설정
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. 규칙 게시
1. "게시" 버튼 클릭
2. 확인 메시지에서 "게시" 클릭

### 4. 테스트
1. 브라우저에서 사이트 새로고침
2. 매물 목록이 정상적으로 로드되는지 확인
3. 개발자 도구 콘솔에서 오류 메시지 확인

## 추가 디버깅

### Firebase 디버거 사용
1. 개발 환경에서 우측 상단 "🔧 Debug" 버튼 클릭
2. "📋 매물 목록 조회" 버튼 클릭
3. 콘솔 로그 확인

### 일반적인 오류 코드
- `permission-denied`: 보안 규칙 문제
- `unauthenticated`: 인증 문제
- `unavailable`: Firebase 서비스 문제
- `not-found`: 컬렉션이 존재하지 않음

## 주의사항
- 보안 규칙 수정 후 즉시 적용됩니다
- 프로덕션 환경에서는 더 엄격한 규칙을 고려하세요
- 매물 데이터의 민감한 정보는 클라이언트에서 필터링하세요

## 문제가 지속되는 경우
1. Firebase 프로젝트 설정 확인
2. API 키가 올바른지 확인
3. 네트워크 연결 상태 확인
4. 브라우저 캐시 삭제 후 재시도
