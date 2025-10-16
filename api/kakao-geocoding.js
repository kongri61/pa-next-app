// 카카오맵 API를 위한 서버리스 함수
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

    console.log('🔍 카카오맵 API 요청:', address);

    // 카카오맵 API 호출
    const result = await geocodeWithKakao(address);

    if (result) {
      console.log('✅ 카카오맵 API 성공:', result);
      return res.status(200).json(result);
    } else {
      console.log('❌ 카카오맵 API 실패');
      return res.status(404).json({ error: 'Address not found' });
    }

  } catch (error) {
    console.error('❌ 카카오맵 API 오류:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 카카오맵 API를 사용한 주소 변환
async function geocodeWithKakao(address) {
  try {
    // 카카오맵 API 키 (환경변수로 관리)
    const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
    
    console.log('🔑 카카오맵 API 키 확인:', KAKAO_API_KEY ? '설정됨' : '설정 안됨');
    console.log('🔑 API 키 길이:', KAKAO_API_KEY ? KAKAO_API_KEY.length : 0);
    console.log('📍 검색 주소:', address);
    console.log('🌐 요청 URL:', `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`);
    
    // 카카오맵 주소 검색 API 호출
    const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_API_KEY}`
      }
    });

    console.log('📡 카카오맵 API 응답 상태:', response.status);

    if (!response.ok) {
      console.log('❌ 카카오맵 API 응답 실패:', response.status);
      const errorText = await response.text();
      console.log('❌ 오류 내용:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('📊 카카오맵 API 응답 데이터:', JSON.stringify(data, null, 2));
    
    if (data.documents && data.documents.length > 0) {
      // 가장 정확한 결과 선택
      const bestResult = data.documents[0];
      
      const result = {
        lat: parseFloat(bestResult.y),
        lng: parseFloat(bestResult.x),
        address: bestResult.address_name,
        accuracy: bestResult.address_type
      };
      
      console.log('✅ 카카오맵 API 성공:', result);
      return result;
    }

    console.log('❌ 카카오맵 API 결과 없음');
    return null;
  } catch (error) {
    console.error('❌ 카카오맵 API 호출 오류:', error);
    return null;
  }
}
