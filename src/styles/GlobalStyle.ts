import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8fafc;
    color: #1a202c;
    line-height: 1.6;
  }

  #root {
    height: 100%;
  }

  /* 스크롤바 스타일링 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* 포커스 스타일 */
  *:focus {
    outline: 2px solid #4299e1;
    outline-offset: 2px;
  }

  /* 버튼 기본 스타일 */
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    transition: all 0.2s ease;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* 입력 필드 기본 스타일 */
  input, select, textarea {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  /* 링크 스타일 */
  a {
    color: #4299e1;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    color: #2b6cb0;
  }

  /* 선택 텍스트 스타일 */
  ::selection {
    background-color: #4299e1;
    color: white;
  }

  /* 모바일 최적화 */
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }
    
    /* 모바일에서 터치 영역 확대 */
    button, input, select, textarea {
      min-height: 44px;
    }
  }

  /* PC 최적화 */
  @media (min-width: 769px) {
    /* PC에서 더 나은 가독성 */
    body {
      font-size: 16px;
    }
    
    /* PC에서 호버 효과 */
    button:hover {
      transform: translateY(-1px);
    }
  }

  /* 다크 모드 지원 (선택적) */
  @media (prefers-color-scheme: dark) {
    html, body {
      background-color: #1a202c;
      color: #f7fafc;
    }
  }

  /* 접근성 개선 */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* 로딩 애니메이션 */
  .loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #4299e1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 페이드 인 애니메이션 */
  .fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 슬라이드 애니메이션 */
  .slide-up {
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 반응형 이미지 */
  img {
    max-width: 100%;
    height: auto;
  }

  /* 테이블 스타일 */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    background-color: #f7fafc;
    font-weight: 600;
    color: #4a5568;
  }

  /* 카드 스타일 */
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    transition: box-shadow 0.2s ease;
  }

  .card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  /* 버튼 변형 */
  .btn-primary {
    background-color: #4299e1;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    background-color: #3182ce;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background-color: #e2e8f0;
    color: #4a5568;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background-color: #cbd5e0;
  }

  .btn-danger {
    background-color: #f56565;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-danger:hover {
    background-color: #e53e3e;
  }

  /* 폼 스타일 */
  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4a5568;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  /* 유틸리티 클래스 */
  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  
  .font-bold { font-weight: bold; }
  .font-semibold { font-weight: 600; }
  
  .text-sm { font-size: 0.875rem; }
  .text-lg { font-size: 1.125rem; }
  .text-xl { font-size: 1.25rem; }
  
  .text-gray-500 { color: #6b7280; }
  .text-gray-700 { color: #374151; }
  .text-blue-600 { color: #2563eb; }
  .text-red-600 { color: #dc2626; }
  .text-green-600 { color: #16a34a; }
  
  .bg-white { background-color: white; }
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-blue-50 { background-color: #eff6ff; }
  
  .p-4 { padding: 1rem; }
  .p-6 { padding: 1.5rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  
  .m-4 { margin: 1rem; }
  .mt-4 { margin-top: 1rem; }
  .mb-4 { margin-bottom: 1rem; }
  .ml-4 { margin-left: 1rem; }
  .mr-4 { margin-right: 1rem; }
  
  .rounded { border-radius: 0.375rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-full { border-radius: 9999px; }
  
  .shadow { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
  .shadow-lg { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); }
  
  .flex { display: flex; }
  .inline-flex { display: inline-flex; }
  .grid { display: grid; }
  .hidden { display: none; }
  
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  
  .w-full { width: 100%; }
  .h-full { height: 100%; }
  .min-h-screen { min-height: 100vh; }
`;

export default GlobalStyle; 