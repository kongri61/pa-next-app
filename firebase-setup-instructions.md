# 🔥 Firebase 프로젝트 설정 완료 후 작업

## Firebase 콘솔에서 복사할 설정 정보

Firebase 콘솔에서 웹 앱을 추가한 후, 다음과 같은 설정 정보가 표시됩니다:

```javascript
// Firebase SDK 설정
const firebaseConfig = {
  apiKey: "your-actual-api-key-here",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 설정 적용 방법

1. **Firebase 콘솔에서 위 정보를 복사**
2. **`src/firebase/config.ts` 파일에서 다음 부분을 수정**:

```typescript
const firebaseConfig = {
  // 여기에 Firebase 콘솔에서 복사한 실제 값들을 붙여넣기
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "복사한-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "복사한-auth-domain", 
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "복사한-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "복사한-storage-bucket",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "복사한-sender-id",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "복사한-app-id"
};
```

## Firestore 데이터베이스 설정

1. **Firebase 콘솔에서 "Firestore Database" 선택**
2. **"데이터베이스 만들기" 클릭**
3. **보안 규칙**: "테스트 모드에서 시작" 선택 (나중에 변경 가능)
4. **위치**: asia-northeast3 (서울) 선택 (권장)
5. **"완료" 클릭**

## 보안 규칙 설정 (선택사항)

기본 테스트 모드는 30일 후 자동으로 데이터 접근을 차단합니다.
프로덕션 환경에서는 다음과 같은 규칙을 설정하는 것이 좋습니다:

```javascript
// Firestore 보안 규칙 예시
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // properties 컬렉션 - 읽기는 모든 사용자, 쓰기는 관리자만
    match /properties/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 다음 단계

Firebase 설정이 완료되면:
1. 설정 정보를 코드에 적용
2. 앱을 다시 빌드 및 배포
3. 실시간 동기화 테스트 