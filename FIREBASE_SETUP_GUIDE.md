# Firebase 설정 가이드

이 가이드는 부동산 매물 지도 사이트에 Firebase를 설정하는 방법을 설명합니다.

## 1. Firebase 프로젝트 생성

### 1.1 Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. Google 계정으로 로그인

### 1.2 새 프로젝트 생성
1. "프로젝트 추가" 클릭
2. 프로젝트 이름 입력 (예: `real-estate-map-site`)
3. Google Analytics 사용 여부 선택 (선택사항)
4. "프로젝트 만들기" 클릭

## 2. Firebase 서비스 설정

### 2.1 Authentication 설정
1. 왼쪽 메뉴에서 "Authentication" 클릭
2. "시작하기" 클릭
3. "로그인 방법" 탭에서 "이메일/비밀번호" 활성화
4. "사용 설정" 토글을 켜고 "저장" 클릭

### 2.2 Firestore Database 설정
1. 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 선택:
   - **테스트 모드**: 개발 중에만 사용
   - **프로덕션 모드**: 실제 배포 시 사용
4. 데이터베이스 위치 선택 (한국: `asia-northeast3`)

### 2.3 Storage 설정
1. 왼쪽 메뉴에서 "Storage" 클릭
2. "시작하기" 클릭
3. 보안 규칙 선택 (테스트 모드 권장)
4. Storage 위치 선택 (Firestore와 동일한 위치 권장)

## 3. 웹 앱 등록

### 3.1 웹 앱 추가
1. 프로젝트 개요 페이지에서 웹 아이콘(`</>`) 클릭
2. 앱 닉네임 입력 (예: `real-estate-web`)
3. "Firebase 호스팅 설정" 체크 해제 (선택사항)
4. "앱 등록" 클릭

### 3.2 Firebase 설정 정보 복사
등록 후 표시되는 Firebase 설정 정보를 복사:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

## 4. 환경 변수 설정

### 4.1 .env 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 Firebase 설정 정보를 입력:

```env
# Google Maps API 키
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase 설정
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# 기타 환경 변수들
REACT_APP_SITE_NAME=부동산 매물 지도 사이트
REACT_APP_SITE_DESCRIPTION=구글 지도 기반 부동산 매물 등록 및 광고 사이트
REACT_APP_ADMIN_MODE=false
NODE_ENV=production
```

## 5. Firestore 보안 규칙 설정

### 5.1 기본 규칙 (개발용)
Firestore Database > 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 매물 컬렉션 규칙
    match /properties/{propertyId} {
      // 읽기: 모든 사용자
      allow read: if true;
      
      // 쓰기: 인증된 사용자만
      allow write: if request.auth != null;
      
      // 업데이트: 작성자만
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
      
      // 삭제: 작성자만 (소프트 삭제)
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
    
    // 사용자 프로필 규칙
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### 5.2 프로덕션 규칙
실제 배포 시에는 더 엄격한 규칙을 적용하세요.

## 6. Storage 보안 규칙 설정

### 6.1 기본 규칙 (개발용)
Storage > 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 이미지 파일 규칙
    match /properties/{allPaths=**} {
      // 읽기: 모든 사용자
      allow read: if true;
      
      // 쓰기: 인증된 사용자만
      allow write: if request.auth != null &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB 제한
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 7. 인덱스 설정

### 7.1 복합 인덱스 생성
Firestore에서 복합 쿼리를 사용하기 위해 인덱스를 생성해야 할 수 있습니다.

1. Firestore Database > 인덱스 탭으로 이동
2. "복합 인덱스 만들기" 클릭
3. 다음 인덱스들을 추가:

**매물 검색 인덱스:**
- 컬렉션: `properties`
- 필드: `isActive` (오름차순), `createdAt` (내림차순)

**매물 타입별 인덱스:**
- 컬렉션: `properties`
- 필드: `isActive` (오름차순), `propertyType` (오름차순), `createdAt` (내림차순)

**거래 타입별 인덱스:**
- 컬렉션: `properties`
- 필드: `isActive` (오름차순), `type` (오름차순), `createdAt` (내림차순)

## 8. 테스트

### 8.1 로컬 테스트
```bash
npm start
```

### 8.2 Firebase 에뮬레이터 사용 (선택사항)
개발 중에 Firebase 에뮬레이터를 사용할 수 있습니다:

```bash
npm install -g firebase-tools
firebase login
firebase init emulators
firebase emulators:start
```

## 9. 배포 시 주의사항

### 9.1 보안 규칙 업데이트
프로덕션 배포 전에 보안 규칙을 엄격하게 설정하세요.

### 9.2 환경 변수 설정
배포 플랫폼(Vercel, Netlify 등)에서 환경 변수를 설정하세요.

### 9.3 도메인 허용 목록
Firebase Console에서 허용된 도메인을 설정하세요.

## 10. 문제 해결

### 10.1 일반적인 오류
- **권한 오류**: 보안 규칙 확인
- **인덱스 오류**: 필요한 인덱스 생성
- **API 키 오류**: 환경 변수 확인

### 10.2 디버깅
- Firebase Console의 로그 확인
- 브라우저 개발자 도구의 네트워크 탭 확인
- Firebase SDK 디버그 모드 활성화

## 11. 추가 리소스

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 보안 규칙 가이드](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage 보안 규칙](https://firebase.google.com/docs/storage/security)
- [Firebase 인증 가이드](https://firebase.google.com/docs/auth) 