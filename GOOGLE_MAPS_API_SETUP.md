# Google Maps API 키 발급 및 설정 가이드

## 1. Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. Google 계정으로 로그인

## 2. 프로젝트 생성 또는 선택
1. 상단의 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름 입력 (예: "real-estate-map-project")
4. "만들기" 클릭

## 3. API 활성화
1. 왼쪽 메뉴에서 "API 및 서비스" → "라이브러리" 클릭
2. 다음 API들을 검색하여 활성화:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API**

## 4. API 키 생성
1. "API 및 서비스" → "사용자 인증 정보" 클릭
2. "사용자 인증 정보 만들기" → "API 키" 클릭
3. 생성된 API 키를 복사

## 5. API 키 제한 설정 (보안)
1. 생성된 API 키 클릭
2. "애플리케이션 제한사항" 설정:
   - **HTTP 리퍼러(웹사이트)** 선택
   - 다음 도메인 추가:
     ```
     localhost:3000/*
     *.vercel.app/*
     *.netlify.app/*
     ```
3. "API 제한사항" 설정:
   - **API 제한사항 사용** 선택
   - 다음 API만 선택:
     - Maps JavaScript API
     - Geocoding API
     - Places API

## 6. 환경 변수 설정

### 로컬 개발 환경
프로젝트 루트에 `.env.local` 파일 생성:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### Vercel 배포 환경
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. "Settings" → "Environment Variables" 클릭
4. 다음 변수 추가:
   ```
   Name: REACT_APP_GOOGLE_MAPS_API_KEY
   Value: your_actual_api_key_here
   Environment: Production, Preview, Development
   ```

## 7. 코드 수정

### src/config/environment.ts 수정
```typescript
// Google Maps API 키
googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "your_actual_api_key_here",
```

### public/index.html 수정
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=your_actual_api_key_here&libraries=places"></script>
```

## 8. 테스트
1. 로컬에서 `npm start` 실행
2. 브라우저에서 지도가 정상적으로 로드되는지 확인
3. 개발자 도구 콘솔에서 오류 메시지 확인

## 9. 문제 해결

### API 키 오류가 계속 발생하는 경우:
1. API 키가 올바르게 복사되었는지 확인
2. API가 활성화되었는지 확인
3. 도메인 제한 설정 확인
4. API 제한 설정 확인
5. 결제 계정이 설정되었는지 확인

### 결제 계정 설정:
1. Google Cloud Console에서 "결제" 메뉴 클릭
2. 결제 계정 연결 또는 생성
3. Google Maps API는 월 $200 크레딧 무료 제공

## 10. 보안 주의사항
- API 키를 공개 저장소에 커밋하지 마세요
- 도메인 제한을 반드시 설정하세요
- API 사용량을 모니터링하세요 