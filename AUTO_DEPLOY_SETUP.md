# 자동 배포 설정 가이드

## 현재 상황

이전에는 자동 배포가 작동했지만, 업그레이드 후 수동 배포로 변경되었습니다.

## 자동 배포 복구 방법

### 방법 1: Vercel 자동 배포 (가장 간단, 권장)

Vercel이 GitHub와 연동되어 있으면 **GitHub에 푸시만 하면 자동으로 배포**됩니다.

1. **Vercel 대시보드 확인**
   - [Vercel 대시보드](https://vercel.com/dashboard) 접속
   - 프로젝트 설정에서 GitHub 저장소가 연결되어 있는지 확인
   - "Git" 탭에서 자동 배포가 활성화되어 있는지 확인

2. **자동 배포 활성화**
   - Vercel 프로젝트 설정 > Git
   - "Production Branch"를 `main`으로 설정
   - "Auto-deploy" 옵션이 활성화되어 있는지 확인

3. **사용 방법**
   - 코드 수정 후 커밋: `git commit -m "변경사항"`
   - GitHub에 푸시: `git push origin main`
   - **자동으로 Vercel 배포 시작!** (더블클릭 불필요)

### 방법 2: Git Hook 사용 (로컬 자동화)

커밋 후 자동으로 푸시하고 배포하려면 Git hook을 사용할 수 있습니다.

**Windows에서 Git hook 활성화:**
```bash
# Git Bash에서 실행
chmod +x .git/hooks/post-commit
```

**주의사항:**
- 모든 커밋 후 자동으로 푸시됩니다
- 실수로 커밋하면 즉시 푸시되므로 주의가 필요합니다

### 방법 3: GitHub Actions (고급)

GitHub Actions를 사용하여 더 세밀한 제어가 가능합니다.

1. `.github/workflows/deploy.yml` 파일이 이미 생성되어 있습니다
2. GitHub 저장소의 Settings > Secrets에서 다음을 설정:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

## 추천 방법

**가장 간단한 방법:**
1. Vercel이 GitHub와 연동되어 있는지 확인
2. 코드 수정 후 `git push origin main`만 실행
3. 자동으로 배포됨 (더블클릭 불필요)

**더 편리하게 하려면:**
- Git hook을 사용하여 커밋 후 자동 푸시
- 또는 `deploy-all.bat`를 사용 (더블클릭 한 번)

## 문제 해결

### Vercel 자동 배포가 작동하지 않는 경우:

1. **Vercel 대시보드 확인**
   - 프로젝트 설정 > Git에서 저장소 연결 확인
   - Deployments 탭에서 최근 배포 확인

2. **GitHub 저장소 확인**
   - Settings > Webhooks에서 Vercel webhook 확인
   - 최근 푸시가 있는지 확인

3. **수동 배포**
   - Vercel 대시보드에서 "Redeploy" 클릭
   - 또는 `deploy-all.bat` 실행

## 현재 설정 확인

현재 프로젝트에는 다음이 설정되어 있습니다:
- ✅ `deploy-all.bat`: 수동 배포 스크립트
- ✅ `.github/workflows/deploy.yml`: GitHub Actions 워크플로우 (주석 처리됨)
- ✅ Vercel 자동 배포: GitHub 연동 시 자동 작동

**결론:** Vercel이 GitHub와 연동되어 있으면 `git push origin main`만 하면 자동 배포됩니다!

