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
    width: 0px; /* 8px에서 0px로 변경하여 스크롤바 숨김 */
    display: none; /* 스크롤바 완전히 숨김 */
  }

  ::-webkit-scrollbar-track {
    background: transparent; /* #f1f5f9에서 transparent로 변경 */
  }

  ::-webkit-scrollbar-thumb {
    background: transparent; /* #cbd5e1에서 transparent로 변경 */
    border-radius: 0px; /* 4px에서 0px로 변경 */
  }

  ::-webkit-scrollbar-thumb:hover {
    background: transparent; /* #94a3b8에서 transparent로 변경 */
  }

  /* Firefox 스크롤바 숨김 */
  html {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  /* 흰색 박스 숨기기 - 전역 규칙 */
  div[style*="background: white"],
  div[style*="background: #fff"],
  div[style*="background-color: white"],
  div[style*="background-color: #fff"] {
    background: transparent !important;
  }

  /* Google Maps 관련 흰색 박스 숨기기 */
  .gm-style div[style*="background"],
  .gm-style div[style*="white"],
  .gm-style div[style*="#fff"] {
    background: transparent !important;
  }

  /* 특정 위치의 흰색 박스 숨기기 */
  div[style*="position: absolute"][style*="background"],
  div[style*="position: fixed"][style*="background"] {
    background: transparent !important;
  }

  /* 추가 Google Maps UI 요소 숨기기 */
  .gm-style-moc,
  .gm-style-mtc,
  .gm-style-cc,
  .gm-style-sv,
  .gm-style-rc,
  .gm-style-fc,
  .gm-style-om,
  .gm-style-pc {
    display: none !important;
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