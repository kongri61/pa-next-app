const { spawn } = require('child_process');
const { exec } = require('child_process');

console.log('개발 서버를 시작합니다...');
console.log('서버가 준비되면 브라우저가 자동으로 열립니다.');

// React 개발 서버 시작 (react-scripts start 직접 호출)
const server = spawn('npx', ['react-scripts', 'start'], {
  shell: true,
  stdio: 'inherit'
});

// 10초 후 브라우저 열기 (서버가 시작되는 시간을 고려)
setTimeout(() => {
  const url = 'http://localhost:3000';
  console.log('\n브라우저를 엽니다...');
  
  // Windows에서 브라우저 열기
  exec(`start "" "${url}"`, (error) => {
    if (error) {
      console.error('브라우저를 열 수 없습니다:', error);
      console.log(`수동으로 브라우저에서 ${url}을 열어주세요.`);
    }
  });
}, 10000); // 10초 후

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  server.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  process.exit();
});


