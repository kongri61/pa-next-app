# GitHub Pages 배포 가이드

## 1. GitHub 저장소 생성

1. GitHub에서 새 저장소 생성
2. 저장소 이름: `real-estate-map-site`
3. Public으로 설정

## 2. 코드 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/real-estate-map-site.git
git push -u origin main
```

## 3. 환경 변수 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 환경 변수 설정:

- `REACT_APP_GOOGLE_MAPS_API_KEY`: 실제 Google Maps API 키
- `REACT_APP_ADMIN_MODE`: false

## 4. 배포 실행

```bash
npm run deploy
```

## 5. 배포 확인

- GitHub 저장소의 Settings > Pages에서 배포 URL 확인
- 보통 `https://YOUR_USERNAME.github.io/real-estate-map-site` 형태

## 6. 커스텀 도메인 설정 (선택사항)

1. 도메인 구매
2. GitHub 저장소 Settings > Pages에서 Custom domain 설정
3. DNS 설정 업데이트 