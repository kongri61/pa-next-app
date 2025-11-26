# 배포 명령어 가이드

## ✅ 제시하신 명령어 (수정 버전)

```cmd
cd /d "d:\1-2. CURSOR_지도기반사이트만들기"
git add .
git commit -m "Fix: PropertyDetailModal 이미지 줌 및 모바일 반응형 개선"
git push origin main
npx vercel --prod --yes
```

## ⚠️ 주의사항

### 1. Vercel 제한 문제
Vercel 제한에 걸려 있다면 마지막 명령어(`npx vercel --prod --yes`)가 실패할 수 있습니다.

**해결 방법:**
- GitHub에 푸시만 하면 Vercel이 자동 배포를 시도합니다 (연동되어 있다면)
- Vercel CLI 대신 GitHub 연동 자동 배포 사용

### 2. 커밋 메시지
현재 변경사항에 맞게 커밋 메시지를 수정했습니다:
- "Fix: PropertyDetailModal 이미지 줌 및 모바일 반응형 개선"

## 🚀 실행 방법

### 방법 1: 배치 파일 사용 (권장)
```cmd
deploy-vercel-cmd.bat
```
더블클릭하거나 명령어로 실행

### 방법 2: 명령어 직접 실행
```cmd
cd /d "d:\1-2. CURSOR_지도기반사이트만들기"
git add .
git commit -m "Fix: PropertyDetailModal 이미지 줌 및 모바일 반응형 개선"
git push origin main
npx vercel --prod --yes
```

## 🔄 Vercel 실패 시 대안

### 옵션 1: GitHub 푸시만 (자동 배포)
```cmd
cd /d "d:\1-2. CURSOR_지도기반사이트만들기"
git add .
git commit -m "Fix: PropertyDetailModal 이미지 줌 및 모바일 반응형 개선"
git push origin main
```
→ Vercel이 GitHub와 연동되어 있으면 자동 배포됨

### 옵션 2: Netlify 사용
```cmd
cd /d "d:\1-2. CURSOR_지도기반사이트만들기"
npm run build
```
→ build 폴더를 [Netlify Drop](https://app.netlify.com/drop)에 드래그 앤 드롭

### 옵션 3: GitHub Pages 사용
```cmd
cd /d "d:\1-2. CURSOR_지도기반사이트만들기"
npm run deploy
```

## 📝 단계별 설명

1. **`cd /d "..."`**: 프로젝트 폴더로 이동
2. **`git add .`**: 모든 변경사항 스테이징
3. **`git commit -m "..."`**: 커밋 생성
4. **`git push origin main`**: GitHub에 푸시
5. **`npx vercel --prod --yes`**: Vercel 프로덕션 배포 (제한 시 실패 가능)

## ✅ 권장 순서

1. 먼저 GitHub에 푸시만 시도
2. Vercel 자동 배포 확인
3. 실패하면 Netlify 사용

