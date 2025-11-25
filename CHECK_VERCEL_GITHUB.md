# Vercel-GitHub 연동 확인 가이드

## 🔍 연동 상태 확인 방법

### 방법 1: Vercel 대시보드에서 확인 (가장 확실한 방법)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 접속
   - 로그인 (GitHub 계정으로 로그인했는지 확인)

2. **프로젝트 선택**
   - 프로젝트 목록에서 해당 프로젝트 클릭
   - 프로젝트 이름: `real-estate-map-site` 또는 `pa-next-app` (문서에 따라 다름)

3. **Git 연동 확인**
   - **Settings** 탭 클릭
   - **Git** 섹션 확인
   - **"Connected Git Repository"** 섹션에서:
     - ✅ GitHub 저장소가 연결되어 있으면: **연동됨**
     - ❌ "No Git Repository" 또는 비어있으면: **연동 안 됨**

4. **자동 배포 설정 확인**
   - **Git** 탭에서:
     - **Production Branch**: `main`으로 설정되어 있는지 확인
     - **Auto-deploy**: 활성화되어 있는지 확인

### 방법 2: GitHub 저장소에서 확인

1. **GitHub 저장소 접속**
   - 저장소 URL 확인 (예: `https://github.com/사용자명/저장소명`)

2. **Webhooks 확인**
   - **Settings** → **Webhooks** 탭
   - Vercel webhook이 있는지 확인
   - URL이 `https://api.vercel.com/v1/integrations/deploy/...` 형태인지 확인

3. **Deployments 확인**
   - **Settings** → **Deployments** (있는 경우)
   - Vercel이 연결되어 있는지 확인

### 방법 3: 최근 배포 확인

1. **Vercel 대시보드** → **Deployments** 탭
2. 최근 배포 내역 확인:
   - **"Git Commit"** 또는 **"GitHub"** 아이콘이 있으면: ✅ 연동됨
   - **"Manual"** 또는 **"CLI"**만 있으면: ❌ 연동 안 됨

## ✅ 연동되어 있는 경우

**작동 방식:**
- GitHub에 `git push origin main` 실행
- Vercel이 자동으로 감지
- 자동으로 빌드 및 배포 시작
- **더블클릭 불필요!**

**확인 방법:**
```bash
# 작은 변경사항 테스트
git commit -m "test auto-deploy" --allow-empty
git push origin main

# Vercel 대시보드에서 자동 배포 확인
```

## ❌ 연동되어 있지 않은 경우

**연동 설정 방법:**

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard

2. **프로젝트 선택** 또는 **New Project**

3. **GitHub 저장소 연결**
   - "Import Git Repository" 클릭
   - GitHub 저장소 선택
   - 또는 Settings → Git → "Connect Git Repository"

4. **프로젝트 설정**
   - Framework Preset: **Create React App**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `build`

5. **환경 변수 설정**
   - Settings → Environment Variables
   - 필요한 환경 변수 추가:
     - `REACT_APP_GOOGLE_MAPS_API_KEY`
     - `REACT_APP_ADMIN_MODE`

6. **자동 배포 활성화**
   - Git 탭에서 "Auto-deploy" 활성화
   - Production Branch를 `main`으로 설정

## 🧪 테스트 방법

연동이 제대로 되어 있는지 테스트:

1. **작은 변경사항 만들기**
   ```bash
   # 빈 커밋으로 테스트
   git commit -m "test auto-deploy" --allow-empty
   git push origin main
   ```

2. **Vercel 대시보드 확인**
   - Deployments 탭에서 새로운 배포가 자동으로 시작되는지 확인
   - 배포 상태가 "Building" 또는 "Deploying"으로 변경되는지 확인

3. **성공 확인**
   - 배포가 자동으로 완료되면 ✅ 연동 정상 작동
   - 배포가 시작되지 않으면 ❌ 연동 문제 또는 설정 필요

## 📋 체크리스트

연동 확인 체크리스트:

- [ ] Vercel 대시보드에서 GitHub 저장소가 연결되어 있음
- [ ] Git 탭에서 "Auto-deploy"가 활성화되어 있음
- [ ] Production Branch가 `main`으로 설정되어 있음
- [ ] GitHub 저장소의 Webhooks에 Vercel webhook이 있음
- [ ] 최근 배포 내역에 "Git Commit" 또는 "GitHub" 아이콘이 있음
- [ ] 테스트 푸시 후 자동 배포가 시작됨

## 🔧 문제 해결

### 자동 배포가 작동하지 않는 경우:

1. **Vercel 대시보드 확인**
   - Settings → Git에서 저장소 연결 확인
   - Deployments 탭에서 최근 배포 확인

2. **GitHub 저장소 확인**
   - Settings → Webhooks에서 Vercel webhook 확인
   - 최근 푸시가 있는지 확인

3. **수동 배포 테스트**
   - Vercel 대시보드에서 "Redeploy" 클릭
   - 또는 `deploy-all.bat` 실행

4. **재연동**
   - Settings → Git → "Disconnect" 후 다시 연결

## 💡 요약

**연동되어 있으면:**
- ✅ `git push origin main`만 하면 자동 배포
- ✅ 더블클릭 불필요
- ✅ Vercel이 GitHub 푸시를 자동 감지

**연동되어 있지 않으면:**
- ❌ 수동으로 `deploy-all.bat` 실행 필요
- ❌ 또는 Vercel 대시보드에서 수동 배포

**확인 방법:**
- Vercel 대시보드 → Settings → Git 탭 확인

