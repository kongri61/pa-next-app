const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const projectRoot = path.resolve(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupGit() {
  console.log('========================================');
  console.log('Git 저장소 설정 도우미');
  console.log('========================================\n');

  // Git 저장소 확인
  const gitDir = path.join(projectRoot, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('Git 저장소가 없습니다. 초기화 중...');
    try {
      execSync('git init', { cwd: projectRoot, stdio: 'inherit', encoding: 'utf8' });
      console.log('Git 저장소가 초기화되었습니다.\n');
    } catch (error) {
      console.error('Git 초기화 실패:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Git 저장소가 이미 존재합니다.\n');
  }

  // 원격 저장소 확인
  try {
    const remoteOutput = execSync('git remote -v', { 
      cwd: projectRoot, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('현재 원격 저장소:');
    console.log(remoteOutput);
    
    const hasRemote = remoteOutput.trim().length > 0;
    if (hasRemote) {
      const change = await question('원격 저장소를 변경하시겠습니까? (Y/N): ');
      if (change.toLowerCase() !== 'y') {
        console.log('설정을 완료했습니다.');
        rl.close();
        return;
      }
    }
  } catch (error) {
    // 원격 저장소가 없음
  }

  // 원격 저장소 URL 입력
  const remoteUrl = await question('원격 저장소 URL을 입력하세요 (예: https://github.com/username/repo.git): ');
  
  if (remoteUrl.trim()) {
    try {
      // 기존 원격 저장소 제거
      try {
        execSync('git remote remove origin', { 
          cwd: projectRoot, 
          stdio: 'pipe',
          encoding: 'utf8'
        });
      } catch (error) {
        // 원격 저장소가 없으면 무시
      }

      // 새 원격 저장소 추가
      execSync(`git remote add origin "${remoteUrl}"`, { 
        cwd: projectRoot, 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      console.log('원격 저장소가 설정되었습니다.');
    } catch (error) {
      console.error('원격 저장소 설정 실패:', error.message);
    }
  }

  // 브랜치 확인
  try {
    const branchOutput = execSync('git branch --show-current', { 
      cwd: projectRoot, 
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    
    if (!branchOutput) {
      // 브랜치가 없으면 main 브랜치 생성
      execSync('git checkout -b main', { 
        cwd: projectRoot, 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      console.log('main 브랜치를 생성했습니다.');
    } else {
      console.log(`현재 브랜치: ${branchOutput}`);
    }
  } catch (error) {
    // 브랜치 생성 실패 시 무시
  }

  console.log('\n========================================');
  console.log('Git 설정이 완료되었습니다!');
  console.log('========================================');
  
  rl.close();
}

setupGit().catch(error => {
  console.error('오류 발생:', error);
  rl.close();
  process.exit(1);
});


