import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from './config';

// 사용자 회원가입
export const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 프로필 업데이트 (이름 설정)
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    return user;
  } catch (error: any) {
    console.error('회원가입 오류:', error);
    let errorMessage = '회원가입 중 오류가 발생했습니다.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = '이미 사용 중인 이메일입니다.';
        break;
      case 'auth/weak-password':
        errorMessage = '비밀번호가 너무 약합니다.';
        break;
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일입니다.';
        break;
    }
    
    throw new Error(errorMessage);
  }
};

// 사용자 로그인
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('로그인 오류:', error);
    let errorMessage = '로그인 중 오류가 발생했습니다.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = '등록되지 않은 이메일입니다.';
        break;
      case 'auth/wrong-password':
        errorMessage = '비밀번호가 올바르지 않습니다.';
        break;
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일입니다.';
        break;
      case 'auth/user-disabled':
        errorMessage = '비활성화된 계정입니다.';
        break;
    }
    
    throw new Error(errorMessage);
  }
};

// 사용자 로그아웃
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// 인증 상태 변경 감지
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 비밀번호 재설정 이메일 발송
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('비밀번호 재설정 오류:', error);
    let errorMessage = '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = '등록되지 않은 이메일입니다.';
        break;
      case 'auth/invalid-email':
        errorMessage = '유효하지 않은 이메일입니다.';
        break;
    }
    
    throw new Error(errorMessage);
  }
};

// 비밀번호 변경
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('로그인된 사용자가 없습니다.');
    }

    // 현재 비밀번호로 재인증
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // 새 비밀번호로 변경
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error('비밀번호 변경 오류:', error);
    let errorMessage = '비밀번호 변경 중 오류가 발생했습니다.';
    
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = '현재 비밀번호가 올바르지 않습니다.';
        break;
      case 'auth/weak-password':
        errorMessage = '새 비밀번호가 너무 약합니다.';
        break;
      case 'auth/requires-recent-login':
        errorMessage = '보안을 위해 다시 로그인해주세요.';
        break;
    }
    
    throw new Error(errorMessage);
  }
};

// 프로필 업데이트
export const updateUserProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('로그인된 사용자가 없습니다.');
    }

    await updateProfile(user, { displayName, photoURL });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    throw new Error('프로필 업데이트 중 오류가 발생했습니다.');
  }
}; 