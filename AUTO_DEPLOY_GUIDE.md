# 자동 배포 가이드

## 개선 사항

### 1. PowerShell 한글 경로 문제 해결
- 모든 배치 파일에 `chcp 65001` 추가하여 UTF-8 인코딩 설정
- Node.js 스크립트에서도 UTF-8 인코딩 명시적 설정

### 2. Git 저장소 자동 확인 및 설정
- Git 저장소가 없으면 자동으로 초기화
- 원격 저장소 확인 및 안내 메시지 제공
- 브랜치 자동 감지 (main 또는 master)

### 3. 자동 배포 시스템
- 빌드 후 자동으로 Git 커밋, 푸시, Vercel 배포
- 수동 실행 없이 `npm run build`만으로 배포 가능

## 사용 방법

### 방법 1: 자동 배포 활성화 후 빌드 (권장)

```bash
npm run deploy:auto
```

이 명령어는 다음을 자동으로 수행합니다:
1. 프로젝트 빌드
2. Git 변경사항 커밋
3. GitHub에 푸시
4. Vercel에 배포

### 방법 2: 배치 파일 사용

```bash
# Windows에서
deploy-all.bat
```

또는

```bash
run.bat
# 메뉴에서 "1. 자동 배포" 선택
```

### 방법 3: 수동 단계별 실행

```bash
# 1. 빌드
npm run build

# 2. 자동 배포 (빌드 후)
node scripts/auto-deploy.js
```

## Git 저장소 설정

### 처음 사용하는 경우

```bash
npm run setup:git
```

이 명령어는 다음을 수행합니다:
- Git 저장소 초기화 (필요한 경우)
- 원격 저장소 URL 입력 및 설정
- 브랜치 설정

### 수동 설정

```bash
# Git 저장소 초기화
git init

# 원격 저장소 추가
git remote add origin YOUR_REPO_URL

# 브랜치 설정
git checkout -b main
```

## 자동 배포 활성화/비활성화

### 자동 배포 활성화 방법

1. **환경 변수 사용**:
   ```bash
   AUTO_DEPLOY=true npm run build
   ```

2. **.env.production 파일 생성**:
   ```
   # .env.production 파일이 존재하면 자동 배포 활성화
   ```

3. **deploy:auto 스크립트 사용**:
   ```bash
   npm run deploy:auto
   ```

### 자동 배포 비활성화

- `.env.production` 파일이 없고 `AUTO_DEPLOY` 환경 변수가 설정되지 않은 경우
- 일반 `npm run build` 실행 시 자동 배포는 건너뜀

## 문제 해결

### PowerShell 한글 경로 오류

모든 배치 파일에 UTF-8 인코딩이 설정되어 있습니다. 여전히 문제가 발생하면:

```powershell
# PowerShell에서 실행
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```

### Git 저장소를 찾을 수 없음

```bash
# Git 저장소 확인
git status

# Git 저장소 초기화
git init

# 원격 저장소 설정
npm run setup:git
```

### 원격 저장소가 설정되지 않음

```bash
# 원격 저장소 확인
git remote -v

# 원격 저장소 추가
git remote add origin YOUR_REPO_URL

# 또는 설정 도우미 사용
npm run setup:git
```

## 배치 파일 개선 사항

### build.bat
- UTF-8 인코딩 설정
- 에러 처리 개선
- pause 제거 (자동 실행 시)

### push.bat
- UTF-8 인코딩 설정
- Git 저장소 자동 확인
- 원격 저장소 확인
- 브랜치 자동 감지
- 에러 처리 개선

### deploy.bat
- UTF-8 인코딩 설정
- `--yes` 플래그 추가 (비대화형 모드)
- 에러 처리 개선

### deploy-all.bat
- UTF-8 인코딩 설정
- Git 저장소 확인
- 빌드 단계 추가
- 브랜치 자동 감지
- 전체 프로세스 에러 처리

## 스크립트 파일

### scripts/auto-deploy.js
- Git 커밋 및 푸시 자동화
- Vercel 배포 자동화
- UTF-8 인코딩 지원

### scripts/check-auto-deploy.js
- 자동 배포 활성화 조건 확인
- 환경 변수 및 파일 기반 활성화

### scripts/setup-git.js
- Git 저장소 초기화 도우미
- 원격 저장소 설정 도우미
- 대화형 설정

### scripts/set-env-and-build.js
- 자동 배포 모드로 빌드 실행

## 주의사항

1. **첫 실행 전**: Git 저장소와 원격 저장소를 설정해야 합니다.
2. **Vercel 설정**: Vercel CLI가 설치되어 있고 로그인되어 있어야 합니다.
3. **Git 인증**: GitHub 푸시를 위해서는 인증이 필요합니다 (SSH 키 또는 Personal Access Token).

## 자동 배포 흐름

```
npm run deploy:auto
  ↓
npm run build
  ↓
postbuild 스크립트 실행
  ↓
check-auto-deploy.js (자동 배포 활성화 확인)
  ↓
auto-deploy.js 실행
  ↓
1. Git 저장소 확인
2. Git 상태 확인
3. 변경사항 커밋
4. GitHub 푸시
5. Vercel 배포
```


