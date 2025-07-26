# 부동산 매물 지도 사이트

구글 지도를 기반으로 부동산 매물을 등록하고 광고하는 단일 페이지 웹 애플리케이션입니다.

## 주요 기능

- 🗺️ **구글 지도 기반 매물 표시**: 매물의 위치를 지도에 마커로 표시
- 🔍 **매물 검색 및 필터링**: 지역, 가격, 매물 유형별 검색
- 📝 **매물 등록**: 관리자용 모달을 통한 새로운 매물 등록
- 📋 **매물 목록**: 사이드바에 매물 목록 표시
- 📄 **매물 상세 정보**: 모달을 통한 매물 상세 정보 표시
- 📞 **연락처 정보**: 매물 담당자 연락처 표시

## 기술 스택

- **Frontend**: React 18, TypeScript
- **Styling**: Styled Components
- **Maps**: Google Maps JavaScript API
- **Build Tool**: Create React App

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

1. `env.example` 파일을 `.env`로 복사
2. Google Maps API 키 설정

```bash
cp env.example .env
```

`.env` 파일을 편집하여 실제 API 키를 입력:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
REACT_APP_ADMIN_MODE=false
NODE_ENV=production
```

### 3. Google Maps API 키 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Maps JavaScript API 활성화
3. API 키 생성
4. `.env` 파일에 API 키 입력

### 4. 개발 서버 실행

```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션을 확인할 수 있습니다.

## 배포

### GitHub Pages 배포

1. GitHub 저장소 생성
2. 코드 푸시
3. 배포 실행

```bash
npm run deploy
```

### Vercel 배포

1. [Vercel](https://vercel.com)에 가입
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포

### Netlify 배포

1. [Netlify](https://netlify.com)에 가입
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포

### 수동 배포

```bash
npm run build
```

`build` 폴더의 내용을 웹 서버에 업로드

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Header.tsx      # 네비게이션 헤더
│   ├── GoogleMap.tsx   # 구글 지도 컴포넌트
│   ├── AddPropertyModal.tsx    # 매물 등록 모달
│   └── PropertyDetailModal.tsx # 매물 상세 정보 모달
├── pages/              # 페이지 컴포넌트
│   └── HomePage.tsx    # 메인 페이지 (지도 + 사이드바)
├── styles/             # 스타일 파일
│   └── GlobalStyle.tsx # 전역 스타일
├── types/              # TypeScript 타입 정의
│   └── index.ts        # 공통 타입 정의
├── App.tsx             # 메인 앱 컴포넌트
└── index.tsx           # 앱 진입점
```

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Google Maps API 키 | 필수 |
| `REACT_APP_ADMIN_MODE` | 관리자 모드 활성화 | `false` |
| `NODE_ENV` | 환경 설정 | `production` |

## 관리자 기능

관리자 모드를 활성화하는 방법:

1. **환경 변수**: `REACT_APP_ADMIN_MODE=true`
2. **URL 파라미터**: `?admin=true`
3. **로컬 스토리지**: `localStorage.setItem('admin_mode', 'true')`

## 라이선스

MIT License 