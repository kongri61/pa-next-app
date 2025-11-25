const { execSync } = require('child_process');
const path = require('path');

// Windows와 다른 OS 모두 지원
process.env.AUTO_DEPLOY = 'true';

console.log('자동 배포 모드로 빌드를 시작합니다...\n');

try {
  execSync('npm run build', { 
    stdio: 'inherit',
    encoding: 'utf8',
    env: { ...process.env, AUTO_DEPLOY: 'true' }
  });
} catch (error) {
  console.error('빌드 실패:', error.message);
  process.exit(1);
}


