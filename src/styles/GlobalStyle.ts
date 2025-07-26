import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8fafc;
    color: #1f2937;
    line-height: 1.6;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  /* 스크롤바 스타일링 */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* 포커스 스타일 개선 */
  *:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  /* 버튼 기본 스타일 */
  button {
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  /* 입력 필드 기본 스타일 */
  input, textarea, select {
    font-family: inherit;
    transition: all 0.2s ease;
  }

  /* 링크 스타일 */
  a {
    color: #2563eb;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    color: #1d4ed8;
  }

  /* 선택 텍스트 스타일 */
  ::selection {
    background-color: #dbeafe;
    color: #1e40af;
  }

  /* 로딩 애니메이션 */
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

  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  /* 호버 효과 */
  .hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* 반응형 유틸리티 클래스 */
  .mobile-only {
    display: none;
  }

  .desktop-only {
    display: block;
  }

  @media (max-width: 768px) {
    .mobile-only {
      display: block;
    }

    .desktop-only {
      display: none;
    }
  }
`;

export default GlobalStyle; 