import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth, 
        (user) => {
          setUser(user);
          setLoading(false);
        },
        (error) => {
          // 인증 오류 발생 시에도 앱은 계속 작동
          console.warn('Firebase 인증 상태 변경 오류 (무시됨):', error);
          setUser(null);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      // 인증 초기화 실패 시에도 앱은 계속 작동
      console.warn('Firebase 인증 리스너 설정 실패 (무시됨):', error);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const value: FirebaseContextType = {
    user,
    loading,
    isAuthenticated: !!user
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}; 