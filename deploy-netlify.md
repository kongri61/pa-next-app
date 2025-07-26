# Netlify 배포 가이드

## 1. Netlify 계정 생성

1. [Netlify](https://netlify.com)에 가입
2. GitHub 계정으로 로그인

## 2. 프로젝트 연결

1. Netlify 대시보드에서 "New site from Git" 클릭
2. GitHub 선택
3. 저장소 선택
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `build`

## 3. 환경 변수 설정

Netlify 사이트 설정 > Environment variables에서 추가:

| Key | Value |
|-----|-------|
| `REACT_APP_GOOGLE_MAPS_API_KEY` | 실제 Google Maps API 키 |
| `REACT_APP_ADMIN_MODE` | false |

## 4. 배포

1. "Deploy site" 클릭
2. 자동으로 배포 진행
3. 배포 완료 후 URL 확인

## 5. 커스텀 도메인 설정

1. Netlify 사이트 설정 > Domain management
2. "Add custom domain" 클릭
3. 도메인 입력 및 DNS 설정

## 6. 자동 배포 설정

- GitHub에 코드 푸시 시 자동 배포
- Pull Request 시 Deploy Preview 생성
- Production 브랜치 변경 시 자동 배포 