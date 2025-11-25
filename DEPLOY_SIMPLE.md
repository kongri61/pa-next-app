# 간단한 배포 가이드

## 🚀 가장 간단한 방법 (권장)

### Windows에서:
1. **`build-and-deploy.bat` 파일을 더블클릭**
   - 빌드 → 커밋 → 푸시 → Vercel 자동 배포가 모두 자동으로 진행됩니다!

### 또는 명령어로:
```bash
# 방법 1: 배치 파일 실행
build-and-deploy.bat

# 방법 2: npm 스크립트 사용
npm run build:deploy
```

---

## 📋 단계별 수동 배포

### 1단계: 빌드
```bash
npm run build
```

### 2단계: Git 커밋 및 푸시
```bash
git add .
git commit -m "변경사항 설명"
git push origin main
```

### 3단계: Vercel 자동 배포
- GitHub에 푸시하면 **자동으로 Vercel 배포가 시작**됩니다!
- Vercel 대시보드에서 배포 상태 확인: https://vercel.com/dashboard

---

## ⚙️ Vercel 자동 배포 설정 확인

Vercel이 GitHub와 연동되어 있는지 확인:

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. Settings > Git 확인
4. "Production Branch"가 `main`으로 설정되어 있는지 확인
5. "Auto-deploy" 옵션이 활성화되어 있는지 확인

---

## 🔍 배포 확인

배포 완료 후:
1. Vercel 대시보드에서 배포 상태 확인
2. 배포된 URL로 접속하여 사이트 동작 확인
3. 브라우저 콘솔에서 오류 확인

---

## ❌ 문제 해결

### 빌드 실패 시:
```bash
# 캐시 삭제 후 재빌드
rmdir /s /q node_modules\.cache
npm run build
```

### 푸시 실패 시:
```bash
# 원격 저장소 최신 변경사항 가져오기
git pull origin main
# 다시 푸시
git push origin main
```

### Vercel 배포가 안 될 때:
1. Vercel 대시보드에서 프로젝트 설정 확인
2. GitHub 저장소 연결 확인
3. 환경 변수 설정 확인

---

## 💡 팁

- **가장 빠른 방법**: `build-and-deploy.bat` 더블클릭
- **자동 배포**: GitHub 푸시만 하면 Vercel이 자동으로 배포
- **배포 상태**: Vercel 대시보드에서 실시간 확인 가능

