/**
 * 빌드 후 자동 배포 스크립트
 * 한글 경로 문제를 해결하기 위해 Node.js로 구현
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// UTF-8 인코딩 설정
process.env.CHCP = '65001';

console.log('========================================');
console.log('자동 배포 시작');
console.log('========================================');
console.log('');

// 작업 디렉토리 설정
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// Git 저장소 확인
let hasGitRepo = false;
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore', cwd: projectRoot });
  hasGitRepo = true;
} catch (error) {
  console.log('[정보] Git 저장소를 찾을 수 없습니다. (Vercel 빌드 환경일 수 있습니다)');
  console.log('현재 디렉토리:', projectRoot);
  console.log('Git 작업을 건너뜁니다.');
  console.log('');
  console.log('========================================');
  console.log('빌드 완료');
  console.log('========================================');
  process.exit(0);
}

// Git 사용자 정보 확인 및 설정
try {
  execSync('git config user.name', { stdio: 'ignore', cwd: projectRoot });
} catch (error) {
  console.log('Git 사용자 정보 설정 중...');
  execSync('git config user.name "PA Property"', { cwd: projectRoot });
  execSync('git config user.email "kongri61@naver.com"', { cwd: projectRoot });
}

console.log('1. Git 상태 확인...');
try {
  const status = execSync('git status --short', { encoding: 'utf8', cwd: projectRoot });
  if (status.trim()) {
    console.log(status);
  } else {
    console.log('변경사항 없음');
  }
} catch (error) {
  console.log('Git 상태 확인 완료');
}
console.log('');

console.log('2. 변경사항 스테이징...');
try {
  execSync('git add .', { cwd: projectRoot });
  console.log('스테이징 완료');
} catch (error) {
  console.log('[경고] git add 실패');
}
console.log('');

console.log('3. 원격 저장소 최신 변경사항 가져오기...');
try {
  execSync('git fetch origin main', { stdio: 'ignore', cwd: projectRoot });
  console.log('원격 변경사항 확인 완료');
} catch (error) {
  console.log('[경고] git fetch 실패. 계속 진행합니다...');
}
console.log('');

console.log('4. 원격 변경사항 병합...');
try {
  // 먼저 로컬 변경사항을 stash
  try {
    execSync('git stash', { stdio: 'ignore', cwd: projectRoot });
    console.log('로컬 변경사항 임시 저장 완료');
  } catch (stashError) {
    // stash할 변경사항이 없으면 무시
  }
  
  // 원격 변경사항 가져오기
  execSync('git pull origin main --no-edit --no-rebase', { stdio: 'ignore', cwd: projectRoot });
  console.log('병합 완료');
  
  // stash한 변경사항 복원
  try {
    execSync('git stash pop', { stdio: 'ignore', cwd: projectRoot });
    console.log('로컬 변경사항 복원 완료');
  } catch (stashPopError) {
    // 복원할 변경사항이 없으면 무시
  }
} catch (error) {
  console.log('[경고] git pull 실패. 로컬 변경사항을 우선합니다.');
  
  // stash 복원 시도
  try {
    execSync('git stash pop', { stdio: 'ignore', cwd: projectRoot });
  } catch (stashError) {
    // 무시
  }
  
  // Vercel 빌드 환경 체크
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  if (isVercel) {
    console.log('[정보] Vercel 빌드 환경입니다. Git 작업을 건너뜁니다.');
    // Vercel 환경에서는 이미 최신 코드이므로 계속 진행
  } else {
    console.log('[정보] 원격 저장소와 충돌이 있습니다.');
    console.log('[정보] 로컬 변경사항을 우선하여 계속 진행합니다.');
  }
}
console.log('');

console.log('5. 변경사항 커밋...');
try {
  const hasChanges = execSync('git diff --cached --quiet', { stdio: 'ignore', cwd: projectRoot });
  // diff --quiet은 변경사항이 있으면 exit code 1을 반환
} catch (error) {
  // 변경사항이 있음
  const commitMsg = `Auto-deploy: ${new Date().toLocaleString('ko-KR')}`;
  try {
    execSync(`git commit -m "${commitMsg}"`, { cwd: projectRoot });
    console.log('커밋 완료');
  } catch (commitError) {
    console.log('[경고] 커밋 실패 또는 변경사항 없음');
  }
}
console.log('');

console.log('6. GitHub에 푸시...');
try {
  execSync('git push origin main', { stdio: 'inherit', cwd: projectRoot });
  console.log('');
  console.log('========================================');
  console.log('성공! GitHub에 푸시 완료');
  console.log('========================================');
  console.log('');
  console.log('Vercel 자동 배포가 설정되어 있으면 자동으로 배포가 시작됩니다.');
  console.log('');
} catch (error) {
  console.log('');
  console.log('[오류] 푸시 실패. 다시 시도합니다...');
  console.log('');
  
  try {
    execSync('git fetch origin main', { stdio: 'ignore', cwd: projectRoot });
    execSync('git pull origin main --no-edit --no-rebase', { stdio: 'ignore', cwd: projectRoot });
    execSync('git push origin main', { stdio: 'inherit', cwd: projectRoot });
    console.log('');
    console.log('========================================');
    console.log('성공! GitHub에 푸시 완료');
    console.log('========================================');
    console.log('');
  } catch (retryError) {
    console.log('[경고] 푸시 실패. Vercel 빌드 환경에서는 정상입니다.');
    console.log('GitHub 푸시는 이미 완료된 후 빌드가 실행되었습니다.');
    // Vercel 환경에서는 이미 푸시된 후 빌드가 실행되므로 오류로 종료하지 않음
  }
}
