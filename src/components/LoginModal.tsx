import React, { useState } from 'react';
import styled from 'styled-components';
import * as IndexedDB from '../utils/indexedDB';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  text-align: center;
  font-size: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Button = styled.button`
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #1d4ed8;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
  
  &:hover {
    background: #4b5563;
  }
`;

const ClearButton = styled.button`
  padding: 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
  
  &:hover {
    background: #b91c1c;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 0.5rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (isAdmin: boolean) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  // 모달이 열릴 때 상태 초기화
  React.useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError('');
      setIsLoading(false);
      // 폼 리셋
      if (formRef.current) {
        formRef.current.reset();
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('=== 로그인 시도 시작 ===');
    console.log('입력된 아이디:', username);
    console.log('입력된 비밀번호:', password);
    console.log('아이디 길이:', username.length);
    console.log('비밀번호 길이:', password.length);
    console.log('아이디 공백 제거:', username.trim());
    console.log('비밀번호 공백 제거:', password.trim());
    console.log('onLogin 함수 존재:', !!onLogin);
    console.log('onClose 함수 존재:', !!onClose);

    // 입력값 검증
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      console.log('로그인 실패 - 빈 입력값');
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      setIsLoading(false);
      return;
    }

    console.log('=== 로그인 검증 시작 ===');
    console.log('예상 아이디: kongri61');
    console.log('예상 비밀번호: rlaehdghk61@');
    console.log('아이디 일치:', trimmedUsername === 'kongri61');
    console.log('비밀번호 일치:', trimmedPassword === 'rlaehdghk61@');
    console.log('아이디 타입:', typeof trimmedUsername);
    console.log('비밀번호 타입:', typeof trimmedPassword);

    // 간단한 로그인 로직 (실제로는 서버 인증 필요)
    if (trimmedUsername === 'kongri61' && trimmedPassword === 'rlaehdghk61@') {
      console.log('=== 로그인 성공 ===');
      console.log('관리자 권한 부여');
      
      try {
        // 관리자 로그인 성공
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('is_logged_in', 'true');
        
        console.log('localStorage 설정 완료');
        console.log('user_role:', localStorage.getItem('user_role'));
        console.log('is_logged_in:', localStorage.getItem('is_logged_in'));
        
        if (onLogin) {
          console.log('onLogin 함수 호출');
          onLogin(true);
        } else {
          console.log('onLogin 함수가 없음');
        }
        
        if (onClose) {
          console.log('onClose 함수 호출');
          onClose();
        } else {
          console.log('onClose 함수가 없음');
        }
        
        console.log('로그인 모달 닫힘');
      } catch (error) {
        console.error('로그인 처리 중 오류:', error);
        setError('로그인 처리 중 오류가 발생했습니다.');
      }
    } else {
      console.log('=== 로그인 실패 ===');
      console.log('잘못된 아이디 또는 비밀번호');
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    
    setIsLoading(false);
    console.log('=== 로그인 처리 완료 ===');
  };

  const handleClose = () => {
    // 모달 닫을 때 상태 초기화
    setUsername('');
    setPassword('');
    setError('');
    setIsLoading(false);
    // 폼 리셋
    if (formRef.current) {
      formRef.current.reset();
    }
    onClose();
  };

  const handleClearIndexedDB = async () => {
    const confirmed = window.confirm(
      '⚠️ IndexedDB를 완전히 초기화합니다!\n\n모든 로컬 데이터가 삭제됩니다.\n\n계속하시겠습니까?'
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await IndexedDB.deleteDatabase();
      alert('✅ IndexedDB 초기화 완료!\n페이지를 새로고침합니다.');
      window.location.reload();
    } catch (error: any) {
      setError(`IndexedDB 초기화 실패: ${error.message}`);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose}>&times;</CloseButton>
        <Title>로그인</Title>
        <Form onSubmit={handleSubmit} key={isOpen ? 'open' : 'closed'} ref={formRef}>
          <InputGroup>
            <Label htmlFor="username">아이디</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="off"
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="new-password"
              required
            />
          </InputGroup>
          
          <ButtonContainer>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
            <CancelButton onClick={handleClose}>나가기</CancelButton>
            <ClearButton 
              onClick={handleClearIndexedDB} 
              disabled={isLoading}
              type="button"
            >
              🗑️ IndexedDB 초기화
            </ClearButton>
          </ButtonContainer>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
        
      </ModalContent>
    </ModalOverlay>
  );
};

export default LoginModal; 