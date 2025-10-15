// 환경변수 설정 관리
export const config = {
  // Google Maps API 키 - 실제 Google Maps API 키로 변경 필요
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyCgPbhfAQ9gZbn4SVZIJoiLeHeIZek3-Pk",
  
  // Firebase 설정
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBS-gmLGCxE8kRWc5FIQJ7UHaSfXU3eCgM",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "pa-realestate-sync-cb990.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "pa-realestate-sync-cb990",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "pa-realestate-sync-cb990.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "383158087769",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:383158087769:web:10b2b80a0f3c7552f54148",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || ""
  },
  
  // 사이트 설정
  site: {
    name: process.env.REACT_APP_SITE_NAME || "부동산 매물 지도 사이트",
    description: process.env.REACT_APP_SITE_DESCRIPTION || "구글 지도 기반 부동산 매물 등록 및 광고 사이트",
    adminMode: process.env.REACT_APP_ADMIN_MODE === "true" || false
  },
  
  // 환경 설정
  environment: process.env.NODE_ENV || "production"
};

// 환경변수 확인 함수
export const validateEnvironment = () => {
  const warnings = [];
  
  if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    warnings.push("Google Maps API 키가 설정되지 않았습니다. 기본값을 사용합니다.");
  }
  
  if (!process.env.REACT_APP_FIREBASE_API_KEY) {
    warnings.push("Firebase API 키가 설정되지 않았습니다. 기본값을 사용합니다.");
  }
  
  if (warnings.length > 0) {
    console.warn("환경변수 경고:", warnings);
  }
  
  return warnings.length === 0;
};

export default config; 