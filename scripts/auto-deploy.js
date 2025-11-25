<<<<<<< HEAD
=======
/**
 * 빌드 후 자동 배포 스크립트
 * 한글 경로 문제를 해결하기 위해 Node.js로 구현
 */

>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// UTF-8 인코딩 설정
process.env.CHCP = '65001';

<<<<<<< HEAD
const projectRoot = path.resolve(__dirname, '..');

console.log('========================================');
console.log('자동 배포 스크립트 시작');
console.log('========================================\n');

// Git 저장소 확인
const gitDir = path.join(projectRoot, '.git');
if (!fs.existsSync(gitDir)) {
  console.log('Git 저장소가 없습니다. 초기화 중...');
  try {
    execSync('git init', { cwd: projectRoot, stdio: 'inherit', encoding: 'utf8' });
    console.log('Git 저장소가 초기화되었습니다.');
    console.log('원격 저장소를 설정해주세요: git remote add origin YOUR_REPO_URL');
    process.exit(1);
  } catch (error) {
    console.error('Git 초기화 실패:', error.message);
    process.exit(1);
  }
}

// 원격 저장소 확인
try {
  execSync('git remote -v', { cwd: projectRoot, stdio: 'pipe', encoding: 'utf8' });
} catch (error) {
  console.log('원격 저장소가 설정되지 않았습니다.');
  console.log('원격 저장소를 설정해주세요: git remote add origin YOUR_REPO_URL');
  process.exit(1);
}

// 현재 브랜치 확인
let currentBranch = 'main';
try {
  const branchOutput = execSync('git branch --show-current', { 
    cwd: projectRoot, 
    encoding: 'utf8',
    stdio: 'pipe'
  }).trim();
  if (branchOutput) {
    currentBranch = branchOutput;
  }
} catch (error) {
  // 기본값 사용
}

console.log(`현재 브랜치: ${currentBranch}\n`);

// Git 상태 확인
console.log('1. Git 상태 확인 중...');
try {
  execSync('git status', { cwd: projectRoot, stdio: 'inherit', encoding: 'utf8' });
} catch (error) {
  console.error('Git 상태 확인 실패:', error.message);
}

// 변경사항 커밋
console.log('\n2. 변경사항 커밋 중...');
try {
  execSync('git add .', { cwd: projectRoot, stdio: 'inherit', encoding: 'utf8' });
  
  const commitMessage = `Auto deploy: ${new Date().toLocaleString('ko-KR')}`;
  execSync(`git commit -m "${commitMessage}"`, { 
    cwd: projectRoot, 
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('커밋 완료');
} catch (error) {
  console.log('커밋할 변경사항이 없거나 커밋 실패 (계속 진행)');
}

// GitHub에 푸시
console.log('\n3. GitHub에 푸시 중...');
try {
  execSync(`git push origin ${currentBranch}`, { 
    cwd: projectRoot, 
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('푸시 완료');
} catch (error) {
  console.error('푸시 실패:', error.message);
  console.log('계속 진행합니다...');
}

// Vercel 배포
console.log('\n4. Vercel 배포 중...');
try {
  execSync('npx vercel --prod --yes', { 
    cwd: projectRoot, 
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('배포 완료');
} catch (error) {
  console.error('배포 실패:', error.message);
  process.exit(1);
}

console.log('\n========================================');
console.log('모든 작업이 완료되었습니다!');
console.log('========================================');

=======
console.log('========================================');
console.log('자동 배포 시작');
console.log('========================================');
console.log('');

// 작업 디렉토리 설정
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// Git 저장소 확인
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore', cwd: projectRoot });
} catch (error) {
  console.error('[오류] Git 저장소를 찾을 수 없습니다.');
  console.error('현재 디렉토리:', projectRoot);
  process.exit(1);
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
  execSync('git pull origin main --no-edit --no-rebase', { stdio: 'ignore', cwd: projectRoot });
  console.log('병합 완료');
} catch (error) {
  console.log('[경고] git pull 실패. 충돌이 있을 수 있습니다.');
  console.log('충돌 해결 후 다시 실행하세요.');
  process.exit(1);
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
    console.log('[오류] 푸시 실패. 수동으로 해결해주세요.');
    process.exit(1);
  }
}

>>>>>>> f85309789388d81d24ee5d938e63dd690806b864

