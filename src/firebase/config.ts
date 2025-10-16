import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase 설정 (Firebase 콘솔에서 제공된 실제 설정)
const firebaseConfig = {
  apiKey: "AIzaSyBS-gmLGCxE8kRWc5FIQJ7UHaSfXU3eCgM",
  authDomain: "pa-realestate-sync-cb990.firebaseapp.com",
  projectId: "pa-realestate-sync-cb990",
  storageBucket: "pa-realestate-sync-cb990.firebasestorage.app",
  messagingSenderId: "383158087769",
  appId: "1:383158087769:web:10b2b80a0f3c7552f54148"
};

let app: any = null;
let db: any = null;

try {
  // Firebase 앱 초기화
  app = initializeApp(firebaseConfig);
  
  // Firestore 데이터베이스 초기화
  db = getFirestore(app);
  
  console.log('🔥 Firebase 초기화 성공');
} catch (error) {
  console.warn('⚠️ Firebase 초기화 실패 (데모 모드):', error);
  // Firebase 없이도 앱이 작동하도록 null 유지
}

// Firebase 에뮬레이터 연결 비활성화 (실제 Firebase 사용)
console.log('🌐 실제 Firebase 사용 (에뮬레이터 비활성화)');

export { db };
export default app; 