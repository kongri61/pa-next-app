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

// Firebase 인증 초기화 (오류 발생 시에도 계속 진행)
let auth: Auth;
try {
  auth = getAuth(app);
  console.log('Firebase Auth 초기화 성공');
} catch (error) {
  console.warn('Firebase Auth 초기화 실패 (인증 기능 사용 불가):', error);
  // 인증 오류는 앱 실행을 막지 않음 (Firestore는 정상 작동)
  // 빈 Auth 객체 생성 시도
  try {
    auth = getAuth(app);
  } catch (retryError) {
    console.warn('Firebase Auth 재시도 실패 - 인증 기능 비활성화');
  }
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