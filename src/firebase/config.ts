import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { config, validateEnvironment } from '../config/environment';

// 환경변수 검증
validateEnvironment();

// Firebase 설정 - 환경변수가 없으면 기본값 사용
const firebaseConfig = config.firebase;

// Firebase 앱 초기화
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase 앱 초기화 성공:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase 앱 초기화 실패:', error);
  throw error;
}

// Firestore 데이터베이스 초기화
let db: Firestore;
try {
  db = getFirestore(app);
  console.log('Firestore 초기화 성공');
} catch (error) {
  console.error('Firestore 초기화 실패:', error);
  throw error;
}

// Firebase 인증 초기화
let auth: Auth;
try {
  auth = getAuth(app);
  console.log('Firebase Auth 초기화 성공');
} catch (error) {
  console.error('Firebase Auth 초기화 실패:', error);
  throw error;
}

// Firebase Storage 초기화
let storage: FirebaseStorage;
try {
  storage = getStorage(app);
  console.log('Firebase Storage 초기화 성공');
} catch (error) {
  console.error('Firebase Storage 초기화 실패:', error);
  throw error;
}

export { db, auth, storage };
export default app; 