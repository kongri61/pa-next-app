# Vercel 배포 가이드

## 1. Vercel 계정 생성

1. [Vercel](https://vercel.com)에 가입
2. GitHub 계정으로 로그인

## 2. 프로젝트 연결

1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 선택
3. 프로젝트 설정:
   - Framework Preset: Create React App
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: build

## 3. 환경 변수 설정

Vercel 프로젝트 설정에서 Environment Variables 추가:

| Name | Value |
|------|-------|
| `REACT_APP_GOOGLE_MAPS_API_KEY` | 실제 Google Maps API 키 |
| `REACT_APP_ADMIN_MODE` | false |

## 4. 배포

1. "Deploy" 버튼 클릭
2. 자동으로 배포 진행
3. 배포 완료 후 URL 확인

## 5. 커스텀 도메인 설정

1. Vercel 프로젝트 설정 > Domains
2. "Add Domain" 클릭
3. 도메인 입력 및 DNS 설정

## 6. 자동 배포 설정

- GitHub에 코드 푸시 시 자동 배포
- Pull Request 시 Preview 배포
- Production 브랜치 변경 시 자동 배포 