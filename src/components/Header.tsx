import React, { useState } from 'react';
import styled from 'styled-components';
import logoImage from '../assets/logo.png';

const HeaderContainer = styled.header`
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 1000; /* z-index를 100에서 1000으로 높임 */
  /* 하얀 박스 문제 해결을 위한 추가 설정 */
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    height: auto;
    z-index: 1000; /* 모바일에서도 z-index를 1000으로 높임 */
    position: sticky; /* sticky 유지 */
    top: 0;
    overflow: hidden;
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
  }
`;

const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  gap: 0.75rem;
  background: #fff; /* 배경색 명시적 설정 */
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 768px) {
    gap: 0.5rem;
    background: #fff;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }
`;

const HeaderTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: #fff; /* 배경색 명시적 설정 */
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    gap: 0.5rem;
    background: #fff;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem; /* 0.3rem에서 0.4rem으로 간격 더 늘림 */
  justify-content: space-between; /* flex-start에서 space-between으로 변경 */
  position: relative;
  overflow: hidden; /* visible에서 hidden으로 변경 */
  background: #fff; /* 배경색 명시적 설정 */
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.5rem; /* 좌우 패딩 추가 */
  min-height: 60px; /* 최소 높이 설정 */
  flex-wrap: nowrap; /* 줄바꿈 방지 */

  @media (max-width: 768px) {
    gap: 0.3rem; /* 모바일에서 간격 줄임 */
    overflow: hidden; /* visible에서 hidden으로 변경 */
    background: #fff;
    width: 100%;
    box-sizing: border-box;
    padding: 0.4rem 0.3rem; /* 모바일에서도 좌우 패딩 추가 */
    min-height: 60px; /* 모바일 최소 높이 증가 */
    flex-wrap: nowrap; /* 줄바꿈 방지 */
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const Logo = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;

  @media (max-width: 768px) {
    gap: 0.05rem;
  }
`;

const CompanyName = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const CompanyType = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const FilterButton = styled.button<{ isActive?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: ${props => props.isActive ? '#f3f4f6' : '#ffffff'};
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
    flex: 1;
    justify-content: center;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap; /* 줄바꿈 제거, 말줄임표로 처리 */
  }
`;

const FilterPopup = styled.div<{ isOpen: boolean; isWide?: boolean }>`
  position: fixed;
  top: 120px;
  left: ${props => props.isWide ? '50%' : '50%'};
  transform: ${props => props.isWide ? 'translateX(-50%)' : 'translateX(-50%)'};
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  z-index: 999999;
  padding: 1rem;
  margin-top: 0.5rem;
  display: ${props => props.isOpen ? 'block' : 'none'};
  min-width: 200px;
  max-width: ${props => props.isWide ? '1200px' : '500px'};
  white-space: nowrap;
  opacity: ${props => props.isOpen ? '1' : '0'};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: ${props => props.isWide ? '50%' : '50%'};
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: white;
    border-left: 1px solid #d1d5db;
    border-top: 1px solid #d1d5db;
  }

  @media (max-width: 768px) {
    position: fixed;
    top: 120px; /* 헤더 높이 + 여백 */
    left: 0;
    right: 0;
    transform: none;
    max-width: 100vw;
    width: 100vw;
    margin: 0;
    max-height: calc(100vh - 140px); /* 화면 높이에서 헤더 높이와 여백을 뺀 값 */
    overflow-y: auto;
    border-radius: 0;
    z-index: 999999;
    background: #fff;
    box-sizing: border-box;
    
    &::before {
      display: none;
    }
  }
`;

const FilterPopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const FilterPopupTitle = styled.div`
  font-weight: bold;
  font-size: 0.9rem;
  color: #374151;
`;

const ConfirmButton = styled.button`
  padding: 0.3rem 0.8rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #2563eb;
  }
`;

const FilterPopupContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterPopupButton = styled.button<{ isSelected?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.isSelected ? '#3b82f6' : '#d1d5db'};
  border-radius: 6px;
  background: ${props => props.isSelected ? '#eff6ff' : 'white'};
  color: ${props => props.isSelected ? '#1e40af' : '#374151'};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;

  &:hover {
    background: ${props => props.isSelected ? '#dbeafe' : '#f9fafb'};
    border-color: ${props => props.isSelected ? '#3b82f6' : '#9ca3af'};
  }
`;

const ResetFilterButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: 1px solid #dc2626;
  border-radius: 6px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  width: 100%;
  margin-top: 0.5rem;

  &:hover {
    background: #fee2e2;
    border-color: #b91c1c;
  }
`;

const FilterButtonContainer = styled.div`
  position: relative;
  display: inline-block;
  overflow: hidden; /* visible에서 hidden으로 변경 */
  z-index: 1000;

  @media (max-width: 768px) {
    overflow: hidden; /* visible에서 hidden으로 변경 */
    z-index: 1000;
  }
`;

const ResetButton = styled.button`
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
  margin-left: 0; /* 1.5rem에서 0으로 변경 */
  margin-right: 0.5rem; /* 우측 여백 추가하여 안쪽으로 이동 */
  position: relative;
  z-index: 1;
  flex-shrink: 0; /* 크기 고정 */

  &:hover {
    background: #4b5563;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    margin-left: 0; /* 0.8rem에서 0으로 변경 */
    margin-right: 0.3rem; /* 모바일에서도 우측 여백 추가 */
    position: relative;
    z-index: 1;
    flex-shrink: 0; /* 크기 고정 */
  }
`;

const AreaSection = styled.div`
  padding: 1rem;
`;

const AreaTitle = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  color: #374151;
`;

const AreaSlider = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.3rem;
  }
`;

const AreaButton = styled.button<{ isSelected?: boolean; isActive?: boolean; isInRange?: boolean }>`
  padding: 0.4rem 0.3rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: ${props => {
    if (props.isActive) return '#1e40af';
    if (props.isInRange) return '#e0f2fe';
    if (props.isSelected) return '#dbeafe';
    return 'white';
  }};
  color: ${props => {
    if (props.isActive) return 'white';
    if (props.isInRange) return '#0369a1';
    if (props.isSelected) return '#1e40af';
    return '#374151';
  }};
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  width: 100%;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: ${props => props.isActive ? '#1e3a8a' : '#f3f4f6'};
  }

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 0.3rem 0.2rem;
  }
`;

const PriceSection = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const PriceTitle = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  color: #374151;
`;

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.3rem;
  }
`;

const PriceButton = styled.button<{ isSelected?: boolean; isActive?: boolean; isInRange?: boolean }>`
  padding: 0.4rem 0.3rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: ${props => {
    if (props.isActive) return '#1e40af';
    if (props.isInRange) return '#e0f2fe';
    if (props.isSelected) return '#dbeafe';
    return 'white';
  }};
  color: ${props => {
    if (props.isActive) return 'white';
    if (props.isInRange) return '#0369a1';
    if (props.isSelected) return '#1e40af';
    return '#374151';
  }};
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  width: 100%;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: ${props => props.isActive ? '#1e3a8a' : '#f3f4f6'};
  }
`;

const CustomRangeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  position: relative;
`;

const RangeInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
  max-width: 120px;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }

  @media (max-width: 768px) {
    max-width: 100px;
  }
`;

const RangeSeparator = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const DepositSection = styled.div`
  padding: 1rem;
`;

const DepositTitle = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  color: #374151;
`;

const DepositSlider = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  width: 100%;
  max-width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.3rem;
  }
`;

const DepositButton = styled.button<{ isSelected?: boolean; isActive?: boolean; isInRange?: boolean }>`
  padding: 0.4rem 0.3rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: ${props => {
    if (props.isActive) return '#1e40af';
    if (props.isInRange) return '#e0f2fe';
    if (props.isSelected) return '#dbeafe';
    return 'white';
  }};
  color: ${props => {
    if (props.isActive) return 'white';
    if (props.isInRange) return '#0369a1';
    if (props.isSelected) return '#1e40af';
    return '#374151';
  }};
  font-size: 11px;
  cursor: pointer !important;
  pointer-events: auto !important;
  transition: all 0.2s ease;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  width: 100%;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  z-index: 10;

  &:hover {
    background: ${props => props.isActive ? '#1e3a8a' : '#f3f4f6'};
    border-color: #3b82f6;
  }

  &:active {
    transform: scale(0.98);
  }
`;

interface HeaderProps {
  onAddProperty: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  addressSearch?: string;
  onAddressSearchChange?: (value: string) => void;
  filters?: {
    type: string;
    propertyType: string;
    area: string;
    price: string;
    deposit: string;
  };
  onFilterChange?: (filters: any) => void;
  isAdmin?: boolean; // 관리자 권한 추가
  isLoggedIn?: boolean; // 로그인 상태 추가
  onLoginClick?: () => void; // 로그인 클릭 핸들러 추가
  onLogoutClick?: () => void; // 로그아웃 클릭 핸들러 추가
  onMapReset?: () => void; // 지도 리셋 핸들러 추가
}

const Header: React.FC<HeaderProps> = ({ 
  onAddProperty, 
  searchTerm = '', 
  onSearchChange,
  addressSearch = '',
  onAddressSearchChange,
  filters = { type: '', propertyType: '', area: '', price: '', deposit: '' },
  onFilterChange,
  isAdmin,
  isLoggedIn,
  onLoginClick,
  onLogoutClick,
  onMapReset
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [depositRange, setDepositRange] = useState({ min: '', max: '' });
  const [areaRange, setAreaRange] = useState({ min: '', max: '' });
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // filters 객체가 변경될 때 로컬 상태 동기화
  React.useEffect(() => {
    console.log('=== filters 변경 감지 ===');
    console.log('filters.price:', filters.price);
    console.log('filters.deposit:', filters.deposit);
    console.log('filters.area:', filters.area);
    
    // price 필터 동기화
    if (filters.price) {
      const priceArray = filters.price.split(',').filter(p => p.trim() !== '');
      setSelectedPrices(priceArray);
      console.log('selectedPrices 업데이트:', priceArray);
    } else {
      setSelectedPrices([]);
    }
    
    // deposit 필터 동기화
    if (filters.deposit) {
      const depositArray = filters.deposit.split(',').filter(d => d.trim() !== '');
      setSelectedDeposits(depositArray);
      console.log('selectedDeposits 업데이트:', depositArray);
    } else {
      setSelectedDeposits([]);
    }
    
    // area 필터 동기화
    if (filters.area) {
      const areaArray = filters.area.split(',').filter(a => a.trim() !== '');
      // "0,5" 형태를 "~5평" 형태로 변환
      const convertedAreas = areaArray.map(area => {
        if (area === '0') return '~5평';
        if (area === '999') return '200평~';
        return area + '평';
      });
      setSelectedAreas(convertedAreas);
      console.log('selectedAreas 업데이트:', convertedAreas);
    } else {
      setSelectedAreas([]);
    }
  }, [filters.price, filters.deposit, filters.area]);

  // 가격 옵션들 (1차원 배열로 변경)
  const priceOptions = [
    '~1억', '2억', '3억', '4억', '5억', '6억',
    '7억', '8억', '9억', '10억', '15억', '20억',
    '30억', '40억', '50억', '60억', '70억', '80억',
    '90억', '100억', '200억', '300억', '400억', '500억~'
  ];

  // 보증금 옵션들
  const depositOptions = [
    '~100만', '~500만', '~1천만', 
    '~2천만', '~3천만', '~4천만'
  ];

  // 면적 옵션들 (1차원 배열로 변경)
  const areaOptions = [
    '~5평', '10평', '15평', '20평', '25평', '30평',
    '35평', '40평', '45평', '50평', '55평', '60평',
    '65평', '70평', '100평', '150평', '180평', '200평~'
  ];

  // 필터 옵션들
  const filterOptions = {
    type: [
      { value: '', label: '전체' },
      { value: 'sale', label: '매매' },
      { value: 'rent', label: '임대' }
    ],
    propertyType: [
      { value: '', label: '전체' },
      { value: 'commercial', label: '상가' },
      { value: 'office', label: '사무실' },
      { value: 'building', label: '건물' },
      { value: 'other', label: '기타' }
    ]
  };

  const handleDropdownToggle = (filterType: string) => {
    console.log('=== 필터 드롭다운 토글 ===');
    console.log('필터 타입:', filterType);
    console.log('현재 열린 드롭다운:', openDropdown);
    
    const newDropdown = openDropdown === filterType ? null : filterType;
    setOpenDropdown(newDropdown);
    
    console.log('새 드롭다운 상태:', newDropdown);
    console.log('드롭다운이 열렸는지:', newDropdown !== null);
    
    // 팝업창을 열 때 자동 스크롤
    if (newDropdown) {
      setTimeout(() => {
        const filterButton = document.querySelector(`[data-filter="${filterType}"]`);
        if (filterButton) {
          // 헤더 높이를 고려하여 스크롤 위치 조정
          const headerHeight = 120; // 헤더 높이 (대략적)
          const buttonRect = filterButton.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetScrollTop = scrollTop + buttonRect.top - headerHeight - 20; // 20px 여백
          
          window.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const handleOptionSelect = (filterType: string, value: string) => {
    console.log('=== 필터 옵션 선택 ===');
    console.log('필터 타입:', filterType);
    console.log('선택된 값:', value);
    console.log('현재 필터:', filters);
    
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType as keyof typeof filters] === value ? '' : value
    };
    
    console.log('새 필터:', newFilters);
    onFilterChange?.(newFilters);
    // 팝업 자동 닫기 제거 - 오직 외부 클릭 시에만 닫힘
  };

  const handlePriceSelect = (price: string) => {
    let newSelectedPrices = [...selectedPrices];
    
    if (newSelectedPrices.includes(price)) {
      newSelectedPrices = newSelectedPrices.filter(p => p !== price);
    } else {
      if (newSelectedPrices.length >= 2) {
        newSelectedPrices = [newSelectedPrices[1], price];
      } else {
        newSelectedPrices.push(price);
      }
    }
    
    setSelectedPrices(newSelectedPrices);
    
    // 매매가 선택 시 보증금 초기화
    if (newSelectedPrices.length > 0) {
      setSelectedDeposits([]);
      setDepositRange({ min: '', max: '' });
    }
    
    if (newSelectedPrices.length === 1) {
      if (newSelectedPrices[0] === '~1억') {
        setPriceRange({ min: '최소값', max: '1억' });
      } else if (newSelectedPrices[0] === '500억~') {
        setPriceRange({ min: '500억', max: '최대값' });
      } else {
        setPriceRange({ min: newSelectedPrices[0], max: newSelectedPrices[0] });
      }
    } else if (newSelectedPrices.length === 2) {
      const sorted = newSelectedPrices.sort((a, b) => {
        const aValue = parseInt(a.replace(/[억~]/g, ''));
        const bValue = parseInt(b.replace(/[억~]/g, ''));
        return aValue - bValue;
      });
      
      // 최소값과 최대값 처리
      let minValue = sorted[0];
      let maxValue = sorted[1];
      
      if (sorted[0] === '~1억') {
        minValue = '최소값';
      }
      if (sorted[1] === '500억~') {
        maxValue = '최대값';
      }
      
      setPriceRange({ min: minValue, max: maxValue });
    } else {
      setPriceRange({ min: '', max: '' });
    }

    // App.tsx로 필터 값 전달
    const newFilters = {
      ...filters,
      price: newSelectedPrices.length > 0 ? `${newSelectedPrices.join(',')}` : '',
      deposit: '' // 매매가 선택 시 보증금 필터 초기화
    };
    onFilterChange?.(newFilters);
    
    // 팝업 자동 닫기 제거 - 오직 외부 클릭 시에만 닫힘
  };

  const handleDepositSelect = (deposit: string) => {
    console.log('=== 보증금 선택 함수 ===');
    console.log('선택된 보증금:', deposit);
    console.log('현재 selectedDeposits:', selectedDeposits);
    
    let newSelectedDeposits = [...selectedDeposits];
    
    if (newSelectedDeposits.includes(deposit)) {
      newSelectedDeposits = newSelectedDeposits.filter(d => d !== deposit);
    } else {
      if (newSelectedDeposits.length >= 2) {
        newSelectedDeposits = [newSelectedDeposits[1], deposit];
      } else {
        newSelectedDeposits.push(deposit);
      }
    }
    
    console.log('새로운 selectedDeposits:', newSelectedDeposits);
    
    setSelectedDeposits(newSelectedDeposits);
    
    // 보증금 선택 시 매매가 초기화
    if (newSelectedDeposits.length > 0) {
      setSelectedPrices([]);
      setPriceRange({ min: '', max: '' });
    }

    if (newSelectedDeposits.length === 1) {
      setDepositRange({ min: newSelectedDeposits[0], max: newSelectedDeposits[0] });
    } else if (newSelectedDeposits.length === 2) {
      // 보증금 값에서 숫자만 추출하여 정렬
      const sorted = newSelectedDeposits.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;
        
        if (a.includes('천만')) {
          aValue = parseInt(a.replace(/[~천만]/g, '')) * 1000;
        } else {
          aValue = parseInt(a.replace(/[~만]/g, ''));
        }
        
        if (b.includes('천만')) {
          bValue = parseInt(b.replace(/[~천만]/g, '')) * 1000;
        } else {
          bValue = parseInt(b.replace(/[~만]/g, ''));
        }
        
        return aValue - bValue;
      });
      setDepositRange({ min: sorted[0], max: sorted[1] });
    } else {
      setDepositRange({ min: '', max: '' });
    }

    // App.tsx로 필터 값 전달
    const newFilters = {
      ...filters,
      deposit: newSelectedDeposits.length > 0 ? `${newSelectedDeposits.join(',')}` : '',
      price: '' // 보증금 선택 시 매매가 필터 초기화
    };
    onFilterChange?.(newFilters);
    
    // 팝업 자동 닫기 제거 - 오직 외부 클릭 시에만 닫힘
  };

  const handleAreaSelect = (area: string) => {
    let newSelectedAreas = [...selectedAreas];
    
    if (newSelectedAreas.includes(area)) {
      newSelectedAreas = newSelectedAreas.filter(a => a !== area);
    } else {
      if (newSelectedAreas.length >= 2) {
        newSelectedAreas = [newSelectedAreas[1], area];
      } else {
        newSelectedAreas.push(area);
      }
    }
    
    setSelectedAreas(newSelectedAreas);
    
    if (newSelectedAreas.length === 1) {
      if (newSelectedAreas[0] === '~5평') {
        setAreaRange({ min: '0', max: '5' });
      } else if (newSelectedAreas[0] === '200평~') {
        setAreaRange({ min: '200', max: '최대값' });
      } else {
        setAreaRange({ min: newSelectedAreas[0], max: newSelectedAreas[0] });
      }
    } else if (newSelectedAreas.length === 2) {
      const sorted = newSelectedAreas.sort((a, b) => {
        const aValue = parseInt(a.replace(/[평~]/g, ''));
        const bValue = parseInt(b.replace(/[평~]/g, ''));
        return aValue - bValue;
      });
      
      // 최소값과 최대값 처리
      let minValue = sorted[0];
      let maxValue = sorted[1];
      
      if (sorted[0] === '~5평') {
        minValue = '0';
      }
      if (sorted[1] === '200평~') {
        maxValue = '최대값';
      }
      
      setAreaRange({ min: minValue, max: maxValue });
    } else {
      setAreaRange({ min: '', max: '' });
    }

    // App.tsx로 필터 값 전달 - "~5평"을 "0,5"로 변환하여 전달
    const processedAreas = newSelectedAreas.map(area => {
      if (area === '~5평') return '0,5';
      if (area === '200평~') return '200,999';
      return area.replace(/[평~]/g, '');
    });
    
    const newFilters = {
      ...filters,
      area: processedAreas.length > 0 ? `${processedAreas.join(',')}` : ''
    };
    onFilterChange?.(newFilters);
    
    // 팝업 자동 닫기 제거 - 오직 외부 클릭 시에만 닫힘
  };

  const getFilterDisplayText = (filterType: string) => {
    console.log('=== getFilterDisplayText 호출됨 ===');
    console.log('filterType:', filterType);
    console.log('selectedPrices:', selectedPrices);
    console.log('selectedDeposits:', selectedDeposits);
    
    if (filterType === 'price') {
      let displayText = '';
      
      console.log('=== 금액 필터 디버깅 ===');
      console.log('selectedPrices:', selectedPrices);
      console.log('selectedDeposits:', selectedDeposits);
      console.log('filters.price:', filters.price);
      console.log('filters.deposit:', filters.deposit);
      
      // 매매가 선택 여부 확인
      if (selectedPrices.length > 0) {
        if (selectedPrices.length === 1) {
          displayText = selectedPrices[0];
        } else if (selectedPrices.length === 2) {
          const sorted = selectedPrices.sort((a, b) => {
            const aValue = parseInt(a.replace(/[억~]/g, ''));
            const bValue = parseInt(b.replace(/[억~]/g, ''));
            return aValue - bValue;
          });
          displayText = `${sorted[0]}~${sorted[1]}`;
        }
        console.log('매매가 표시 텍스트:', displayText);
      }
      
      // 보증금 선택 여부 확인 (매매가가 선택되지 않은 경우에만)
      if (selectedDeposits.length > 0 && selectedPrices.length === 0) {
        let depositText = '';
        if (selectedDeposits.length === 1) {
          depositText = selectedDeposits[0];
        } else if (selectedDeposits.length === 2) {
          const sorted = selectedDeposits.sort((a, b) => {
            let aValue = 0;
            let bValue = 0;
            if (a.includes('천만')) {
              aValue = parseInt(a.replace(/[~천만]/g, '')) * 1000;
            } else {
              aValue = parseInt(a.replace(/[~만]/g, ''));
            }
            if (b.includes('천만')) {
              bValue = parseInt(b.replace(/[~천만]/g, '')) * 1000;
            } else {
              bValue = parseInt(b.replace(/[~만]/g, ''));
            }
            return aValue - bValue;
          });
          depositText = `${sorted[0]}~${sorted[1]}`;
        }
        
        displayText = depositText;
        console.log('보증금 표시 텍스트:', displayText);
      }
      
      console.log('최종 표시 텍스트:', displayText);
      return displayText || '금액';
    }
    
    const currentValue = filters[filterType as keyof typeof filters];
    if (!currentValue || currentValue === '') {
      return filterType === 'type' ? '거래유형' :
             filterType === 'area' ? '면적' :
             filterType === 'price' ? '금액' :
             '매물종류';
    }
    
    if (filterType === 'area') {
      if (selectedAreas.length === 1) {
        // 단일 값 선택 시
        if (selectedAreas[0] === '~5평') {
          return '0~5평';
        } else if (selectedAreas[0] === '200평~') {
          return '200평~';
        }
        return selectedAreas[0];
      } else if (selectedAreas.length === 2) {
        const sorted = selectedAreas.sort((a, b) => {
          const aValue = parseInt(a.replace(/[평~]/g, ''));
          const bValue = parseInt(b.replace(/[평~]/g, ''));
          return aValue - bValue;
        });
        
        // 범위 표시 시 "~5평"을 "0"으로 변환
        let minDisplay = sorted[0];
        let maxDisplay = sorted[1];
        
        if (sorted[0] === '~5평') {
          minDisplay = '0';
        }
        if (sorted[1] === '200평~') {
          maxDisplay = '200평~';
        }
        
        return `${minDisplay}~${maxDisplay}`;
      }
    }
    
    const option = filterOptions[filterType as keyof typeof filterOptions]?.find(opt => opt.value === currentValue);
    return option?.label || currentValue;
  };

  // 면적을 m²로 환산하는 함수
  const convertPyeongToSquareMeters = (pyeong: string) => {
    const num = parseFloat(pyeong.replace(/[평~]/g, ''));
    if (isNaN(num)) return '';
    const squareMeters = Math.round(num * 3.3058);
    return `<span style="color: #dc2626;">(${squareMeters}m²)</span>`;
  };

  const getAreaTitleHTML = () => {
    if (areaRange.min && areaRange.max) {
      let minText = areaRange.min;
      let maxText = areaRange.max;
      
      // m² 변환을 위한 실제 값 계산
      let minM2Text = '';
      let maxM2Text = '';
      
      if (areaRange.min === '0') {
        minM2Text = '<span style="color: #dc2626;">(0m²)</span>';
      } else {
        minM2Text = convertPyeongToSquareMeters(minText);
      }
      
      if (areaRange.max === '최대값') {
        maxM2Text = '<span style="color: #dc2626;">(최대m²)</span>';
      } else {
        maxM2Text = convertPyeongToSquareMeters(maxText);
      }
      
      if (areaRange.min === areaRange.max) {
        return `면적 <span style="margin-left: 0.5rem;">${minM2Text}</span>`;
      }
      return `면적 <span style="margin-left: 0.5rem;">${minM2Text}</span><span style="color: #dc2626; margin-left: 0.25rem;">~</span><span style="margin-left: 0.25rem;">${maxM2Text}</span>`;
    }
    return '면적';
  };

  const resetAreaFilter = () => {
    setAreaRange({ min: '', max: '' });
    setSelectedAreas([]);
    const newFilters = {
      ...filters,
      area: ''
    };
    onFilterChange?.(newFilters);
    // 팝업 자동 닫기 제거 - 오직 외부 클릭 시에만 닫힘
  };

  const resetPriceAndDepositFilter = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedPrices([]);
    setDepositRange({ min: '', max: '' });
    setSelectedDeposits([]);
    const newFilters = {
      ...filters,
      price: '',
      deposit: ''
    };
    onFilterChange?.(newFilters);
    // 팝업 자동 닫기 제거 - 오직 외부 클릭 시에만 닫힘
  };

  // 외부 클릭 시 드롭다운 닫기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('=== 외부 클릭 이벤트 발생 ===');
      console.log('현재 열린 드롭다운:', openDropdown);
      
      if (openDropdown) {
        const target = event.target as Element;
        console.log('클릭된 요소:', target);
        console.log('클릭된 요소 클래스:', target.className);
        console.log('클릭된 요소 태그:', target.tagName);
        
        // 필터 드롭다운 영역이 아닌 곳을 클릭했는지 확인
        const isFilterDropdown = target.closest('.filter-dropdown');
        console.log('필터 드롭다운 영역 클릭 여부:', !!isFilterDropdown);
        
        // 필터 드롭다운 영역이 아닌 곳을 클릭한 경우에만 닫기
        if (!isFilterDropdown) {
          console.log('드롭다운 닫기 실행');
          setOpenDropdown(null);
        } else {
          console.log('드롭다운 유지');
        }
      }
    };

    const handleTouchOutside = (event: TouchEvent) => {
      console.log('=== 외부 터치 이벤트 발생 ===');
      console.log('현재 열린 드롭다운:', openDropdown);
      
      if (openDropdown) {
        const target = event.target as Element;
        console.log('터치된 요소:', target);
        console.log('터치된 요소 클래스:', target.className);
        console.log('터치된 요소 태그:', target.tagName);
        
        // 필터 드롭다운 영역이 아닌 곳을 터치했는지 확인
        const isFilterDropdown = target.closest('.filter-dropdown');
        console.log('필터 드롭다운 영역 터치 여부:', !!isFilterDropdown);
        
        // 필터 드롭다운 영역이 아닌 곳을 터치한 경우에만 닫기
        if (!isFilterDropdown) {
          console.log('드롭다운 닫기 실행 (터치)');
          setOpenDropdown(null);
        } else {
          console.log('드롭다운 유지 (터치)');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [openDropdown]);

  return (
    <HeaderContainer>
      <MainSection>
        <HeaderTopRow>
          <LogoSection>
            <Logo src={logoImage} alt="피에이 로고" />
            <CompanyInfo>
              <CompanyName>피에이</CompanyName>
              <CompanyType>공인중개사사무소</CompanyType>
            </CompanyInfo>
          </LogoSection>
          
          <ResetButton onClick={() => {
            console.log('초기화 버튼 클릭됨');
            console.log('onMapReset 함수:', onMapReset);
            
            // Header 컴포넌트 내부 필터 상태 초기화
            setSelectedAreas([]);
            setSelectedPrices([]);
            setSelectedDeposits([]);
            setAreaRange({ min: '', max: '' });
            setPriceRange({ min: '', max: '' });
            setDepositRange({ min: '', max: '' });
            setOpenDropdown(null);
            
            // 필터 초기화
            if (onFilterChange) {
              const resetFilters = {
                type: '',
                propertyType: '',
                area: '',
                price: '',
                deposit: ''
              };
              onFilterChange(resetFilters);
              console.log('필터 초기화 완료');
            }
            
            // 지도 리셋
            if (onMapReset) {
              console.log('지도 리셋 함수 호출');
              onMapReset();
            } else {
              console.log('페이지 새로고침 실행');
              window.location.reload();
            }
          }}>
            초기화
          </ResetButton>
        </HeaderTopRow>

        <FilterRow>
          <FilterButtonContainer className="filter-dropdown" style={{ overflow: 'visible', zIndex: 99999 }}>
            <FilterButton
              isActive={filters.type !== ''}
              onClick={() => handleDropdownToggle('type')}
              data-filter="type"
              style={{
                borderColor: openDropdown === 'type' ? '#3b82f6' : '#d1d5db',
                backgroundColor: openDropdown === 'type' ? '#eff6ff' : (filters.type !== '' ? '#f3f4f6' : '#ffffff')
              }}
            >
              {getFilterDisplayText('type')}▼
            </FilterButton>
            <FilterPopup isOpen={openDropdown === 'type'} isWide={filters.type !== ''}>
              <FilterPopupHeader>
                <FilterPopupTitle>거래유형</FilterPopupTitle>
                <ConfirmButton onClick={() => setOpenDropdown(null)}>확인</ConfirmButton>
              </FilterPopupHeader>
              <FilterPopupContent>
                {filterOptions.type.map((option) => (
                  <FilterPopupButton
                    key={option.value}
                    isSelected={filters.type === option.value}
                    onClick={() => handleOptionSelect('type', option.value)}
                  >
                    {option.label}
                  </FilterPopupButton>
                ))}
              </FilterPopupContent>
            </FilterPopup>
          </FilterButtonContainer>

          <FilterButtonContainer className="filter-dropdown" style={{ overflow: 'visible', zIndex: 99999 }}>
            <FilterButton
              isActive={filters.propertyType !== ''}
              onClick={() => handleDropdownToggle('propertyType')}
              data-filter="propertyType"
              style={{
                borderColor: openDropdown === 'propertyType' ? '#3b82f6' : '#d1d5db',
                backgroundColor: openDropdown === 'propertyType' ? '#eff6ff' : (filters.propertyType !== '' ? '#f3f4f6' : '#ffffff')
              }}
            >
              {getFilterDisplayText('propertyType')}▼
            </FilterButton>
            <FilterPopup isOpen={openDropdown === 'propertyType'} isWide={filters.propertyType !== ''}>
              <FilterPopupHeader>
                <FilterPopupTitle>매물종류</FilterPopupTitle>
                <ConfirmButton onClick={() => setOpenDropdown(null)}>확인</ConfirmButton>
              </FilterPopupHeader>
              <FilterPopupContent>
                {filterOptions.propertyType.map((option) => (
                  <FilterPopupButton
                    key={option.value}
                    isSelected={filters.propertyType === option.value}
                    onClick={() => handleOptionSelect('propertyType', option.value)}
                  >
                    {option.label}
                  </FilterPopupButton>
                ))}
              </FilterPopupContent>
            </FilterPopup>
          </FilterButtonContainer>

          <FilterButtonContainer className="filter-dropdown" style={{ overflow: 'visible', zIndex: 99999 }}>
            <FilterButton
              isActive={selectedAreas.length > 0}
              onClick={() => handleDropdownToggle('area')}
              data-filter="area"
              style={{
                borderColor: openDropdown === 'area' ? '#3b82f6' : '#d1d5db',
                backgroundColor: openDropdown === 'area' ? '#eff6ff' : (selectedAreas.length > 0 ? '#f3f4f6' : '#ffffff')
              }}
            >
              {getFilterDisplayText('area')}▼
            </FilterButton>
            <FilterPopup isOpen={openDropdown === 'area'} isWide={true}>
              <FilterPopupHeader>
                <FilterPopupTitle>면적</FilterPopupTitle>
                <ConfirmButton onClick={() => setOpenDropdown(null)}>확인</ConfirmButton>
              </FilterPopupHeader>
              <FilterPopupContent>
                <AreaSection>
                  <AreaTitle dangerouslySetInnerHTML={{ __html: getAreaTitleHTML() }} />
                  <AreaSlider>
                    {areaOptions.map((area) => (
                      <AreaButton
                        key={area}
                        isSelected={selectedAreas.includes(area)}
                        isActive={(() => {
                          if (areaRange.min === '' || areaRange.max === '') return false;
                          
                          // '~5평'과 '200평~' 특별 처리
                          if (area === '~5평' && areaRange.min === '0') return true;
                          if (area === '200평~' && areaRange.max === '최대값') return true;
                          
                          return areaRange.min === area || areaRange.max === area;
                        })()}
                        isInRange={(() => {
                          if (areaRange.min === '' || areaRange.max === '') return false;
                          
                          // '~5평'과 '200평~' 특별 처리
                          if (area === '~5평' || area === '200평~') return false;
                          
                          const areaValue = parseFloat(area.replace(/[~평]/g, ''));
                          let minValue = 0;
                          let maxValue = 999;
                          
                          // 최소값 처리
                          if (areaRange.min === '0') {
                            minValue = 0; // '~5평' 선택 시
                          } else {
                            minValue = parseFloat(areaRange.min.replace(/[~평]/g, ''));
                          }
                          
                          // 최대값 처리
                          if (areaRange.max === '최대값') {
                            maxValue = 999; // '200평~' 선택 시
                          } else {
                            maxValue = parseFloat(areaRange.max.replace(/[~평]/g, ''));
                          }
                          
                          return areaValue > minValue && areaValue < maxValue && 
                                 !selectedAreas.includes(area) &&
                                 area !== areaRange.min && area !== areaRange.max;
                        })()}
                        onClick={() => handleAreaSelect(area)}
                      >
                        {area}
                      </AreaButton>
                    ))}
                  </AreaSlider>

                  <CustomRangeContainer>
                    <RangeInput
                      type="text"
                      placeholder="최소"
                      value={areaRange.min}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAreaRange({ ...areaRange, min: e.target.value })}
                    />
                    <RangeSeparator>~</RangeSeparator>
                    <RangeInput
                      type="text"
                      placeholder="최대"
                      value={areaRange.max}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAreaRange({ ...areaRange, max: e.target.value })}
                    />
                    <RangeSeparator>평</RangeSeparator>
                  </CustomRangeContainer>
                  
                  <ResetFilterButton onClick={resetAreaFilter}>
                    초기화
                  </ResetFilterButton>
                </AreaSection>
              </FilterPopupContent>
            </FilterPopup>
          </FilterButtonContainer>

          <FilterButtonContainer className="filter-dropdown">
            <FilterButton
              isActive={selectedPrices.length > 0 || selectedDeposits.length > 0}
              onClick={() => handleDropdownToggle('price')}
              data-filter="price"
              style={{
                borderColor: openDropdown === 'price' ? '#3b82f6' : '#d1d5db',
                backgroundColor: openDropdown === 'price' ? '#eff6ff' : ((selectedPrices.length > 0 || selectedDeposits.length > 0) ? '#f3f4f6' : '#ffffff')
              }}
            >
              {(() => {
                const text = getFilterDisplayText('price');
                console.log('금액 버튼 텍스트 렌더링:', text);
                return text;
              })()}▼
            </FilterButton>
            <FilterPopup isOpen={openDropdown === 'price'} isWide={true}>
              <FilterPopupHeader>
                <FilterPopupTitle>금액</FilterPopupTitle>
                <ConfirmButton onClick={() => setOpenDropdown(null)}>확인</ConfirmButton>
              </FilterPopupHeader>
              <FilterPopupContent>
                <PriceSection>
                  <PriceTitle>매매가</PriceTitle>
                  <PriceGrid>
                    {priceOptions.map((price) => (
                      <PriceButton
                        key={price}
                        isSelected={selectedPrices.includes(price)}
                        isActive={(() => {
                          if (priceRange.min === '' || priceRange.max === '') return false;
                          
                          // '~1억'과 '500억~' 특별 처리
                          if (price === '~1억' && priceRange.min === '최소값') return true;
                          if (price === '500억~' && priceRange.max === '최대값') return true;
                          
                          return priceRange.min === price || priceRange.max === price;
                        })()}
                        isInRange={(() => {
                          if (priceRange.min === '' || priceRange.max === '') return false;
                          
                          // '~1억'과 '500억~' 특별 처리
                          if (price === '~1억' || price === '500억~') return false;
                          
                          const priceValue = parseFloat(price.replace(/[~억]/g, ''));
                          let minValue = 0;
                          let maxValue = 999;
                          
                          // 최소값 처리
                          if (priceRange.min === '최소값') {
                            minValue = 0; // '~1억' 선택 시
                          } else {
                            minValue = parseFloat(priceRange.min.replace(/[~억]/g, ''));
                          }
                          
                          // 최대값 처리
                          if (priceRange.max === '최대값') {
                            maxValue = 999; // '500억~' 선택 시
                          } else {
                            maxValue = parseFloat(priceRange.max.replace(/[~억]/g, ''));
                          }
                          
                          return priceValue > minValue && priceValue < maxValue && 
                                 !selectedPrices.includes(price) &&
                                 price !== priceRange.min && price !== priceRange.max;
                        })()}
                        onClick={() => {
                          console.log('매매가 버튼 클릭됨:', price);
                          handlePriceSelect(price);
                        }}
                      >
                        {price}
                      </PriceButton>
                    ))}
                  </PriceGrid>

                  <CustomRangeContainer>
                    <RangeInput
                      type="text"
                      placeholder="최소"
                      value={priceRange.min}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPriceRange({ ...priceRange, min: e.target.value })}
                    />
                    <RangeSeparator>~</RangeSeparator>
                    <RangeInput
                      type="text"
                      placeholder="최대"
                      value={priceRange.max}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPriceRange({ ...priceRange, max: e.target.value })}
                    />
                    <RangeSeparator>억원</RangeSeparator>
                  </CustomRangeContainer>
                </PriceSection>

                <DepositSection>
                  <DepositTitle>보증금</DepositTitle>
                  <DepositSlider>
                    {depositOptions.map((deposit) => (
                      <DepositButton
                        key={deposit}
                        isSelected={selectedDeposits.includes(deposit)}
                        isActive={(() => {
                          if (depositRange.min === '' || depositRange.max === '') return false;
                          
                          // '~100만' 특별 처리
                          if (deposit === '~100만' && depositRange.min === '~100만') return true;
                          
                          return depositRange.min === deposit || depositRange.max === deposit;
                        })()}
                        isInRange={(() => {
                          if (depositRange.min === '' || depositRange.max === '') return false;
                          
                          let depositValue = 0;
                          if (deposit.includes('천만')) {
                            depositValue = parseInt(deposit.replace(/[~천만]/g, '')) * 1000;
                          } else {
                            depositValue = parseInt(deposit.replace(/[~만]/g, ''));
                          }
                          
                          let minValue = 0;
                          let maxValue = 999;
                          
                          if (depositRange.min !== '') {
                            if (depositRange.min.includes('천만')) {
                              minValue = parseInt(depositRange.min.replace(/[~천만]/g, '')) * 1000;
                            } else {
                              minValue = parseInt(depositRange.min.replace(/[~만]/g, ''));
                            }
                          }
                          if (depositRange.max !== '') {
                            if (depositRange.max.includes('천만')) {
                              maxValue = parseInt(depositRange.max.replace(/[~천만]/g, '')) * 1000;
                            } else {
                              maxValue = parseInt(depositRange.max.replace(/[~만]/g, ''));
                            }
                          }
                          
                          return depositValue > minValue && depositValue < maxValue && 
                                 !selectedDeposits.includes(deposit) &&
                                 deposit !== depositRange.min && deposit !== depositRange.max;
                        })()}
                        onClick={() => {
                          console.log('보증금 버튼 클릭됨:', deposit);
                          handleDepositSelect(deposit);
                        }}
                      >
                        {deposit}
                      </DepositButton>
                    ))}
                  </DepositSlider>

                  <CustomRangeContainer>
                    <RangeInput
                      type="text"
                      placeholder="최소"
                      value={depositRange.min}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositRange({ ...depositRange, min: e.target.value })}
                    />
                    <RangeSeparator>~</RangeSeparator>
                    <RangeInput
                      type="text"
                      placeholder="최대"
                      value={depositRange.max}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositRange({ ...depositRange, max: e.target.value })}
                    />
                    <RangeSeparator>원</RangeSeparator>
                  </CustomRangeContainer>
                </DepositSection>
                
                <ResetFilterButton onClick={resetPriceAndDepositFilter}>
                  초기화
                </ResetFilterButton>
              </FilterPopupContent>
            </FilterPopup>
          </FilterButtonContainer>
        </FilterRow>
      </MainSection>
    </HeaderContainer>
  );
};

export default Header;