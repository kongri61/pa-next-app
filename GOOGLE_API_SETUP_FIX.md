# Google API 설정 문제 해결 가이드

## 🚨 긴급 해결사항: Google Identity Toolkit API 활성화

### 1. Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 프로젝트 ID: `245277344961` 선택 (콘솔 로그에서 확인된 프로젝트)

### 2. Identity Toolkit API 활성화
1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"라이브러리"** 클릭
2. 검색창에 **"Identity Toolkit API"** 입력
3. **"Identity Toolkit API"** 클릭
4. **"사용 설정"** 버튼 클릭

### 3. 추가 필요한 API들 활성화
다음 API들도 함께 활성화하세요:

#### Maps JavaScript API
1. 검색창에 **"Maps JavaScript API"** 입력
2. **"사용 설정"** 클릭

#### Geocoding API
1. 검색창에 **"Geocoding API"** 입력
2. **"사용 설정"** 클릭

#### Places API
1. 검색창에 **"Places API"** 입력
2. **"사용 설정"** 클릭

### 4. API 키 확인 및 설정
1. **"API 및 서비스"** → **"사용자 인증 정보"** 클릭
2. 기존 API 키 확인 또는 새로 생성
3. API 키 클릭하여 제한 설정 확인

### 5. API 키 제한 설정
```
애플리케이션 제한사항:
- HTTP 리퍼러(웹사이트)
- 도메인: *.vercel.app/*

API 제한사항:
- Maps JavaScript API
- Geocoding API
- Places API
- Identity Toolkit API
```

## 🔧 Firebase 설정 확인

### 1. Firebase 프로젝트 확인
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 `real-estate-map-demo` 선택
3. **Authentication** → **Sign-in method** 확인
4. **이메일/비밀번호** 활성화 상태 확인

### 2. Firestore 보안 규칙 확인
Firestore Database → 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /properties/{propertyId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

## 🌐 Vercel 환경 변수 설정

### 1. Vercel 대시보드 접속
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 `real-estate-map-site` 선택

### 2. 환경 변수 설정
**Settings** → **Environment Variables**에서 다음 설정:

```
Name: REACT_APP_GOOGLE_MAPS_API_KEY
Value: [실제 Google Maps API 키]
Environment: Production, Preview, Development

Name: REACT_APP_FIREBASE_API_KEY
Value: [실제 Firebase API 키]
Environment: Production, Preview, Development

Name: REACT_APP_FIREBASE_AUTH_DOMAIN
Value: real-estate-map-demo.firebaseapp.com
Environment: Production, Preview, Development

Name: REACT_APP_FIREBASE_PROJECT_ID
Value: real-estate-map-demo
Environment: Production, Preview, Development

Name: REACT_APP_FIREBASE_STORAGE_BUCKET
Value: real-estate-map-demo.appspot.com
Environment: Production, Preview, Development

Name: REACT_APP_FIREBASE_MESSAGING_SENDER_ID
Value: [실제 Sender ID]
Environment: Production, Preview, Development

Name: REACT_APP_FIREBASE_APP_ID
Value: [실제 App ID]
Environment: Production, Preview, Development
```

### 3. 배포 재시작
환경 변수 설정 후 **Deployments** → **Redeploy** 클릭

## 🖼️ 이미지 및 Favicon 문제 해결

### 1. Favicon 추가
`public` 폴더에 `favicon.ico` 파일이 있는지 확인하고, 없다면 추가:

```bash
# public 폴더에 favicon.ico 파일 복사
cp [favicon 파일 경로] public/favicon.ico
```

### 2. 이미지 경로 확인
`build` 폴더의 이미지 파일들이 올바르게 생성되었는지 확인

## 🔍 배포 후 확인사항

### 1. 사이트 접속 테스트
- [배포된 URL](https://real-estate-map-site-fvsn3bkyi-paproperty.vercel.app) 접속
- 브라우저 개발자 도구 콘솔 확인

### 2. 기능 테스트
- 지도 로딩 확인
- 로그인/회원가입 기능 확인
- 매물 등록 기능 확인

### 3. 오류 모니터링
브라우저 콘솔에서 다음 오류들이 해결되었는지 확인:
- ✅ Identity Toolkit API 403 오류 해결
- ✅ Firebase Firestore 연결 오류 해결
- ✅ 이미지 로딩 오류 해결
- ✅ Favicon 404 오류 해결

## 📞 추가 지원

문제가 지속되면 다음을 확인하세요:
1. Google Cloud Console의 API 사용량 및 할당량
2. Firebase Console의 사용량 및 결제 상태
3. Vercel 배포 로그 확인
4. 브라우저 네트워크 탭에서 API 호출 상태 확인 