const fs = require('fs');
const path = require('path');

// AUTO_DEPLOY 환경 변수 확인
const autoDeploy = process.env.AUTO_DEPLOY === 'true' || process.env.AUTO_DEPLOY === '1';

// .env.production 파일 확인
const envProdPath = path.join(__dirname, '..', '.env.production');
const hasEnvProd = fs.existsSync(envProdPath);

// 자동 배포 활성화 조건 확인
if (autoDeploy || hasEnvProd) {
  console.log('자동 배포를 시작합니다...');
  require('./auto-deploy.js');
} else {
  console.log('자동 배포가 비활성화되어 있습니다.');
  console.log('자동 배포를 활성화하려면:');
  console.log('  - npm run deploy:auto');
  console.log('  - 또는 AUTO_DEPLOY=true npm run build');
  console.log('  - 또는 .env.production 파일 생성');
}


