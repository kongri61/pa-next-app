# 배포 체크리스트

## ✅ 사전 준비사항

- [ ] Google Maps API 키 발급
- [ ] API 키에 적절한 제한 설정 (도메인 제한 등)
- [ ] 환경 변수 파일 (.env) 생성
- [ ] 빌드 테스트 완료

## 🔧 환경 변수 설정

### .env 파일 생성
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
REACT_APP_ADMIN_MODE=false
NODE_ENV=production
```

## 🚀 배포 방법 선택

### 옵션 1: Vercel (추천)
- [ ] Vercel 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 환경 변수 설정
- [ ] 배포 실행

### 옵션 2: Netlify
- [ ] Netlify 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 환경 변수 설정
- [ ] 배포 실행

### 옵션 3: GitHub Pages
- [ ] GitHub 저장소 생성
- [ ] 코드 푸시
- [ ] 환경 변수 설정
- [ ] `npm run deploy` 실행

### 옵션 4: 수동 배포
- [ ] `npm run build` 실행
- [ ] 웹 서버에 파일 업로드
- [ ] 서버 설정 확인

## 🔍 배포 후 확인사항

- [ ] 사이트 접속 확인
- [ ] 지도 로딩 확인
- [ ] 매물 목록 표시 확인
- [ ] 검색 기능 확인
- [ ] 관리자 기능 확인 (필요시)
- [ ] 모바일 반응형 확인
- [ ] SSL 인증서 확인 (HTTPS)

## 🛠️ 문제 해결

### 지도가 로드되지 않는 경우
1. Google Maps API 키 확인
2. API 키의 도메인 제한 확인
3. 브라우저 콘솔에서 오류 확인

### 관리자 기능이 작동하지 않는 경우
1. 환경 변수 `REACT_APP_ADMIN_MODE` 확인
2. URL 파라미터 `?admin=true` 시도
3. 로컬 스토리지 설정 확인

### 빌드 오류가 발생하는 경우
1. 의존성 설치 확인: `npm install`
2. TypeScript 오류 수정
3. 환경 변수 파일 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 브라우저 개발자 도구 콘솔
2. 네트워크 탭에서 API 호출 확인
3. 배포 플랫폼의 로그 확인 