# 자동 배포 가이드

## 개요

이 프로젝트는 한글 경로 문제를 해결하고 자동 배포를 지원합니다.

## 해결된 문제

### 1. 한글 경로 문제
- 모든 배치 파일과 PowerShell 스크립트에 UTF-8 인코딩 설정 추가
- Git 명령어 실행 시 한글 경로 올바르게 처리
- Git 저장소 자동 감지 및 오류 처리

### 2. Git 저장소 찾지 못하는 문제
- 모든 스크립트에 Git 저장소 확인 로직 추가
- 명확한 오류 메시지 제공

### 3. 자동 배포
- Git post-commit hook을 통한 자동 푸시
- package.json 스크립트를 통한 빌드 후 자동 배포
- 여러 배포 방법 제공

## 자동 배포 방법

### 방법 1: Git Hook 사용 (가장 편리)

커밋 후 자동으로 푸시됩니다.

```bash
git add .
git commit -m "변경사항"
# 자동으로 GitHub에 푸시됨
```

**설정 확인:**
- `.git/hooks/post-commit` 파일이 존재하는지 확인
- main 브랜치에서만 자동 푸시됩니다

### 방법 2: npm 스크립트 사용

#### 빌드 후 자동 배포
```bash
npm run build:deploy
```

#### 빌드 후 자동 배포 (배치 파일)
```bash
npm run deploy:auto
```

#### 빌드 후 자동 배포 (PowerShell)
```bash
npm run deploy:auto:ps1
```

#### 빌드 후 자동 배포 (자동)
```bash
npm run build
# postbuild 스크립트가 자동으로 실행됨
```

### 방법 3: 배치 파일 직접 실행

#### 자동 배포만
```bash
auto-deploy.bat
```

#### 빌드 + 자동 배포
```bash
build-and-deploy.bat
```

### 방법 4: PowerShell 스크립트 실행

#### 자동 배포만
```powershell
.\auto-deploy.ps1
```

#### 빌드 + 자동 배포
```powershell
.\build-and-deploy.ps1
```

## 스크립트 설명

### auto-deploy.bat / auto-deploy.ps1
- 변경사항 자동 커밋 및 푸시
- 원격 변경사항 자동 병합
- 충돌 처리

### build-and-deploy.bat / build-and-deploy.ps1
- 프로젝트 빌드
- 빌드 후 자동 배포

### scripts/auto-deploy.js
- Node.js 기반 자동 배포 스크립트
- 한글 경로 문제 완전 해결
- package.json의 postbuild 스크립트에서 사용

## 주의사항

1. **Git Hook 자동 푸시**
   - 모든 커밋 후 자동으로 푸시됩니다
   - 실수로 커밋하면 즉시 푸시되므로 주의가 필요합니다
   - 자동 푸시를 비활성화하려면 `.git/hooks/post-commit` 파일을 삭제하거나 이름을 변경하세요

2. **충돌 처리**
   - 원격 저장소와 충돌이 발생하면 자동으로 병합을 시도합니다
   - 자동 병합이 실패하면 수동으로 해결해야 합니다

3. **Vercel 자동 배포**
   - GitHub에 푸시하면 Vercel이 자동으로 배포를 시작합니다
   - Vercel 대시보드에서 배포 상태를 확인하세요

## 문제 해결

### Git 저장소를 찾을 수 없습니다
- 현재 디렉토리가 Git 저장소인지 확인하세요
- `git init` 또는 `git clone`으로 저장소를 초기화하세요

### 한글 경로 문제
- 모든 스크립트는 UTF-8 인코딩을 사용합니다
- PowerShell에서 실행할 때는 `-ExecutionPolicy Bypass` 옵션을 사용하세요

### 푸시 실패
- 원격 저장소 연결 확인: `git remote -v`
- 인증 정보 확인: GitHub Personal Access Token 또는 SSH 키
- 네트워크 연결 확인

## 추천 워크플로우

1. 코드 수정
2. `git add .` (변경사항 스테이징)
3. `git commit -m "변경사항 설명"` (자동으로 푸시됨)
4. Vercel에서 자동 배포 확인

또는

1. 코드 수정
2. `npm run build` (빌드 후 자동 배포)
3. Vercel에서 자동 배포 확인


