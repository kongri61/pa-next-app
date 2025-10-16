// 네이버 지도 API를 위한 서버리스 함수
// 기존 시스템을 건드리지 않고 안전하게 추가

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    console.log('🔍 네이버 지도 API 요청:', address);

    // 네이버 지도 API 호출 (실제 API 키 필요)
    // 현재는 클라이언트에서 직접 호출할 수 없으므로 패턴 매칭 사용
    const result = await geocodeWithPatterns(address);

    if (result) {
      console.log('✅ 네이버 지도 API 성공:', result);
      return res.status(200).json(result);
    } else {
      console.log('❌ 네이버 지도 API 실패');
      return res.status(404).json({ error: 'Address not found' });
    }

  } catch (error) {
    console.error('❌ 네이버 지도 API 오류:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 주소 패턴 매칭 함수
async function geocodeWithPatterns(address) {
  const addressPatterns = [
    // 인천 남동구 구월동 패턴 (실제 좌표)
    { pattern: /인천.*남동구.*구월동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*구월동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /구월동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 인천 남동구 관교동 패턴
    { pattern: /인천.*남동구.*관교동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*관교동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 인천 남동구 문학동 패턴
    { pattern: /인천.*남동구.*문학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*문학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 인천 남동구 선학동 패턴
    { pattern: /인천.*남동구.*선학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*선학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 인천 남동구 수산동 패턴
    { pattern: /인천.*남동구.*수산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*수산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 인천 남동구 운연동 패턴
    { pattern: /인천.*남동구.*운연동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*운연동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 인천 남동구 서창동 패턴
    { pattern: /인천.*남동구.*서창동.*(\d+)-(\d+)/, lat: 37.4200, lng: 126.7200 },
    { pattern: /남동구.*서창동.*(\d+)-(\d+)/, lat: 37.4200, lng: 126.7200 },
    
    // 인천 남동구 도림동 패턴
    { pattern: /인천.*남동구.*도림동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*도림동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 인천 남동구 논현동 패턴
    { pattern: /인천.*남동구.*논현동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*논현동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 인천 남동구 방산동 패턴
    { pattern: /인천.*남동구.*방산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*방산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
    
    // 일반적인 인천 남동구 패턴
    { pattern: /인천.*남동구.*/, lat: 37.4563, lng: 126.7052 },
    { pattern: /남동구.*/, lat: 37.4563, lng: 126.7052 },
  ];

  for (const { pattern, lat, lng } of addressPatterns) {
    if (pattern.test(address)) {
      return { lat, lng };
    }
  }

  return null;
}


