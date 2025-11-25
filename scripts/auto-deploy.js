const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// UTF-8 인코딩 설정
process.env.CHCP = '65001';

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


