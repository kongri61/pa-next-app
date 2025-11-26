const { exec } = require('child_process');
const waitOn = require('wait-on');

const url = 'http://localhost:3000';

console.log('서버가 시작될 때까지 기다리는 중...');

waitOn({
  resources: [url],
  timeout: 60000, // 60초 타임아웃
  interval: 1000, // 1초마다 확인
})
  .then(() => {
    console.log('서버가 준비되었습니다! 브라우저를 엽니다...');
    
    // Windows에서 브라우저 열기
    const command = process.platform === 'win32' 
      ? `start "" "${url}"`
      : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
    
    exec(command, (error) => {
      if (error) {
        console.error('브라우저를 열 수 없습니다:', error);
        console.log(`수동으로 브라우저에서 ${url}을 열어주세요.`);
      } else {
        console.log('브라우저가 열렸습니다!');
      }
    });
  })
  .catch((err) => {
    console.error('서버 시작 대기 중 오류 발생:', err);
    console.log(`수동으로 브라우저에서 ${url}을 열어주세요.`);
  });



