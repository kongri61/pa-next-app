import React, { useState } from 'react';
import styled from 'styled-components';

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

    // 간단한 로그인 로직 (실제로는 서버 인증 필요)
    if (username === 'kongri61' && password === 'rlaehdghk61@') {
      // 관리자 로그인 성공
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('is_logged_in', 'true');
      onLogin(true);
      onClose();
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    
    setIsLoading(false);
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
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
        
      </ModalContent>
    </ModalOverlay>
  );
};

export default LoginModal; 