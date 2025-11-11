# 배포 문제 해결 요약

## 🔧 수정된 사항

### 1. 배치 파일 경로 문제 해결
모든 배치 파일에서 하드코딩된 경로(`C:\Users\user\매물지도보기`)를 제거하고, 현재 디렉토리 기준으로 작동하도록 수정했습니다.

**수정된 파일:**
- `build.bat`
- `deploy.bat`
- `push.bat`
- `deploy-all.bat`

**변경 내용:**
```batch
# 이전
cd /d "C:\Users\user\매물지도보기"

# 수정 후
cd /d "%~dp0"
```

`%~dp0`는 배치 파일이 있는 디렉토리로 자동 이동하므로, 어떤 경로에서든 작동합니다.

### 2. Vercel 설정 최적화
`vercel.json` 파일을 최신 Vercel 형식에 맞게 최적화했습니다.

**주요 변경:**
- `buildCommand`: `npm run build` 명시
- `outputDirectory`: `build` 폴더 지정
- SPA 라우팅을 위한 routes 설정 유지

## 🚀 배포 방법

### 방법 1: 자동 배포 (권장)
```batch
deploy-all.bat
```
이 파일을 실행하면 다음이 자동으로 실행됩니다:
1. Git 상태 확인
2. 변경사항 커밋
3. GitHub에 푸시
4. Vercel 배포

### 방법 2: 수동 배포
```batch
# 1. 빌드
build.bat

# 2. Git 푸시
push.bat

# 3. Vercel 배포
deploy.bat
```

### 방법 3: 명령줄에서 직접
```bash
# 빌드
npm run build

# Git 푸시
git add .
git commit -m "배포"
git push origin main

# Vercel 배포
npx vercel --prod
```

## ⚠️ 주의사항

### Vercel 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

1. **Vercel 대시보드 접속**: https://vercel.com/dashboard
2. **프로젝트 선택**
3. **Settings** → **Environment Variables**에서 추가:

```
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCgPbhfAQ9gZbn4SVZIJoiLeHeIZek3-Pk
REACT_APP_FIREBASE_API_KEY=AIzaSyBS-gmLGCxE8kRWc5FIQJ7UHaSfXU3eCgM
REACT_APP_FIREBASE_AUTH_DOMAIN=pa-realestate-sync-cb990.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=pa-realestate-sync-cb990
REACT_APP_FIREBASE_STORAGE_BUCKET=pa-realestate-sync-cb990.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=383158087769
REACT_APP_FIREBASE_APP_ID=1:383158087769:web:10b2b80a0f3c7552f54148
```

**중요**: 각 환경 변수에 대해 **Production**, **Preview**, **Development** 모두 선택해야 합니다.

### 빌드 확인
배포 전에 로컬에서 빌드가 성공하는지 확인하세요:
```bash
npm run build
```

빌드가 성공하면 `build` 폴더가 생성됩니다.

## 🔍 문제 해결

### 배포가 실패하는 경우
1. **빌드 로그 확인**: Vercel 대시보드 → Deployments → View Build Logs
2. **환경 변수 확인**: Settings → Environment Variables
3. **GitHub 연결 확인**: Settings → Git
4. **의존성 확인**: `npm install` 실행

### 빌드 오류가 발생하는 경우
1. `node_modules` 삭제 후 재설치:
   ```bash
   rm -rf node_modules
   npm install
   ```
2. TypeScript 오류 확인:
   ```bash
   npm run build
   ```
3. 캐시 삭제:
   ```bash
   npm cache clean --force
   ```

## ✅ 확인 사항

배포 후 다음을 확인하세요:
- [ ] 사이트가 정상적으로 로드됨
- [ ] Google Maps가 표시됨
- [ ] Firebase 연결이 정상 작동
- [ ] 매물 목록이 표시됨
- [ ] 모바일에서도 정상 작동

## 📞 추가 도움

문제가 계속되면:
1. Vercel 대시보드의 빌드 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 네트워크 탭에서 API 호출 확인

