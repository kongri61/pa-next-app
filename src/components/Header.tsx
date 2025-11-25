import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import paLogo from '../assets/pa-logo.png';
import { firebaseSync } from '../utils/firebaseSync';

const HeaderContainer = styled.header`
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.75rem 1rem; /* 모바일 전용: 작은 패딩 */
  position: sticky;
  top: 0;
  z-index: 1000;
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column; /* 2줄 구조 */
  gap: 0.5rem; /* 줄 간격 */
`;

// 첫 번째 줄: 상호명 + 초기화 버튼
const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
  box-sizing: border-box;
`;

// 두 번째 줄: 필터 버튼들
const FilterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between; /* 버튼들 사이 공간 균등 배치 */
  width: 100%;
  gap: 0.5rem;
  box-sizing: border-box;
`;

const MainSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%; /* 모바일 전용: 최대 너비 제한 제거 */
  margin: 0; /* 모바일 전용: 중앙 정렬 제거 */
  gap: 1rem;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

// 왼쪽 섹션 (로고 + 회사명) - 모바일 전용
const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem; /* 모바일 전용: 작은 간격 */
  flex-shrink: 0;
  min-width: auto; /* 모바일 전용: 최소 너비 제거 */
`;

// 중앙 섹션 (검색 + 필터) - 모바일 전용 (사용하지 않음, FilterRow로 대체)
const CenterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-start;
  max-width: 100%;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  & > * {
    flex-shrink: 0;
  }
`;

// 오른쪽 섹션 (버튼들) - 모바일 전용
const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem; /* 모바일 전용: 작은 간격 */
  flex-shrink: 0;
  min-width: auto; /* 모바일 전용: 최소 너비 제거 */
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: auto; /* 모바일 전용: 최소 너비 제거 */
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem; /* 로고와 상호명 사이 간격 축소 */
  min-width: auto; /* 모바일 전용: 최소 너비 제거 */
  transition: gap 0.3s ease;
`;

const CompanyName = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  line-height: 1.2;
  gap: 0;

  .company-main {
    font-size: 0.8rem; /* 크기 축소 */
    font-weight: 700;
    color: #000000;
  }

  .company-sub {
    font-size: 0.8rem; /* 크기 축소 */
    font-weight: 400;
    color: #000000;
    display: block; /* 표시 */
  }
`;

// 검색 필드 (모바일 전용)
const SearchInput = styled.input`
  padding: 0.75rem 1rem; /* 모바일 전용: 큰 터치 영역 */
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem; /* 모바일 전용: 큰 폰트 */
  background: white;
  min-width: 0; /* 모바일 전용: 최소 너비 제거 */
  width: 100%;
  min-height: 44px; /* 모바일 터치 최적화 */
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

// 필터 버튼 (기본 상태) - 모바일 전용
const FilterButtonDefault = styled.button`
  padding: 0.4rem 0.6rem; /* 좌우 패딩 축소 */
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.75rem; /* 폰트 크기 축소 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: auto; /* 최소 높이 제거 */
  touch-action: manipulation;
  width: auto; /* 내용에 맞는 너비 */
  flex: 0 0 auto; /* 크기 고정 */
  
  &:active {
    background: #f9fafb;
    border-color: #9ca3af;
    transform: scale(0.98);
  }
`;

// 액션 버튼 (모바일 전용)
const ActionButton = styled.button`
  padding: 0.4rem 0.6rem; /* 좌우 패딩 축소 */
  background: #4b5563;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.75rem; /* 폰트 크기 축소 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem; /* 간격 축소 */
  white-space: nowrap;
  min-height: auto; /* 최소 높이 제거 */
  touch-action: manipulation;
  
  &:active {
    background: #374151;
    transform: scale(0.98);
  }
  
  svg {
    width: 14px; /* 아이콘 크기 축소 */
    height: 14px;
  }
`;

const FilterPopup = styled.div<{ isOpen: boolean; isWide?: boolean; isPrice?: boolean }>`
  position: fixed;
  /* 모든 모달을 필터링 버튼들 아래에 배치 */
  top: 94px;
  left: ${props => props.isWide ? '50%' : '50%'};
  transform: ${props => props.isWide ? 'translateX(-50%)' : 'translateX(-50%)'};
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  z-index: 999999;
  padding: ${props => props.isPrice ? '0.15rem 0.15rem 0.3rem 0.15rem' : '1rem'};
  margin-top: 0.5rem;
  display: ${props => props.isOpen ? 'block' : 'none'};
  min-width: 200px;
  max-width: ${props => props.isWide ? '1200px' : '500px'};
  /* 금액 모달은 화면 높이에 맞게 조정하여 전체 내용이 보이도록 */
  max-height: ${props => props.isPrice ? 'calc(100vh - 70px)' : 'calc(100vh - 200px)'};
  overflow-y: auto;
  overflow-x: hidden;
  white-space: nowrap;
  opacity: ${props => props.isOpen ? '1' : '0'};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  
  /* 방향 지시 표시 제거 */
  &::before {
    display: none;
  }
`;

const FilterPopupHeader = styled.div<{ isPriceModal?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.isPriceModal ? '0.15rem' : '1rem'};
  padding-bottom: ${props => props.isPriceModal ? '0.15rem' : '0.5rem'};
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

const FilterPopupContent = styled.div<{ isPriceModal?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.isPriceModal ? '0.1rem' : '0.5rem'};
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

const ResetFilterButton = styled.button<{ isPriceModal?: boolean }>`
  padding: ${props => props.isPriceModal ? '0.4rem 0.6rem' : '0.5rem 0.75rem'};
  border: 1px solid #dc2626;
  border-radius: 6px;
  background: #fef2f2;
  color: #dc2626;
  font-size: ${props => props.isPriceModal ? '0.75rem' : '0.8rem'};
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  width: 100%;
  margin-top: ${props => props.isPriceModal ? '0.2rem' : '0.5rem'};

  &:hover {
    background: #fee2e2;
    border-color: #b91c1c;
  }
`;

const FilterButtonContainer = styled.div`
  position: relative;
  display: inline-block;
  flex: 0 0 auto; /* 크기 고정, 내용에 맞는 너비 */
  overflow: visible; /* 팝업이 잘리지 않도록 */
  z-index: 1000;

  @media (max-width: 768px) {
    overflow: visible;
    z-index: 1000;
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
`;

const PriceSection = styled.div<{ isPriceModal?: boolean }>`
  padding: ${props => props.isPriceModal ? '0.15rem' : '1rem'};
  border-bottom: 1px solid #e5e7eb;
`;

const PriceTitle = styled.div<{ isPriceModal?: boolean }>`
  font-weight: bold;
  margin-bottom: ${props => props.isPriceModal ? '0.15rem' : '1rem'};
  color: #374151;
  font-size: ${props => props.isPriceModal ? '0.85rem' : '1rem'};
`;

const PriceGrid = styled.div<{ isPriceModal?: boolean }>`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: ${props => props.isPriceModal ? '0.08rem' : '0.4rem'};
  margin-bottom: ${props => props.isPriceModal ? '0.15rem' : '0.75rem'};
  width: 100%;
`;

const PriceButton = styled.button<{ isSelected?: boolean; isActive?: boolean; isInRange?: boolean; isPriceModal?: boolean }>`
  padding: ${props => props.isPriceModal ? '0.15rem 0.1rem' : '0.4rem 0.3rem'};
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
  font-size: ${props => props.isPriceModal ? '9px' : '11px'};
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

const CustomRangeContainer = styled.div<{ isPriceModal?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.isPriceModal ? '0.2rem' : '0.5rem'};
  margin-bottom: ${props => props.isPriceModal ? '0.1rem' : '0.75rem'};
  position: relative;
`;

const RangeInput = styled.input<{ isPriceModal?: boolean }>`
  flex: 1;
  padding: ${props => props.isPriceModal ? '0.3rem' : '0.5rem'};
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: ${props => props.isPriceModal ? '0.75rem' : '12px'};
  text-align: center;
  max-width: 120px;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const RangeSeparator = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const DepositSection = styled.div<{ isPriceModal?: boolean }>`
  padding: ${props => props.isPriceModal ? '0.15rem' : '1rem'};
`;

const DepositTitle = styled.div<{ isPriceModal?: boolean }>`
  font-weight: bold;
  margin-bottom: ${props => props.isPriceModal ? '0.15rem' : '1rem'};
  color: #374151;
  font-size: ${props => props.isPriceModal ? '0.85rem' : '1rem'};
`;

const DepositSlider = styled.div<{ isPriceModal?: boolean }>`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${props => props.isPriceModal ? '0.08rem' : '0.4rem'};
  margin-bottom: ${props => props.isPriceModal ? '0.15rem' : '0.75rem'};
  width: 100%;
  max-width: 100%;
`;

const DepositButton = styled.button<{ isSelected?: boolean; isActive?: boolean; isInRange?: boolean; isPriceModal?: boolean }>`
  padding: ${props => props.isPriceModal ? '0.15rem 0.1rem' : '0.4rem 0.3rem'};
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
  font-size: ${props => props.isPriceModal ? '9px' : '11px'};
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
  onBulkPropertyUpload?: () => void; // 대량매물등록 핸들러 추가
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  addressSearch?: string;
  onAddressSearchChange?: (value: string) => void;
  propertyNumberSearch?: string;
  onPropertyNumberSearch?: (value: string) => void;
  filters?: {
    type: string;
    propertyType: string;
    area: string;
    price: string;
    deposit: string;
  };
  onFilterChange?: (filters: any) => void;
  isAdmin?: boolean; // 관리자 권한 추가
  onMapReset?: () => void; // 지도 리셋 핸들러 추가
  onRefresh?: () => void; // 새로고침 핸들러 추가
}

const Header: React.FC<HeaderProps> = ({ 
  onAddProperty, 
  onBulkPropertyUpload, // 대량매물등록 핸들러 추가
  searchTerm = '', 
  onSearchChange,
  addressSearch = '',
  onAddressSearchChange,
  propertyNumberSearch = '',
  onPropertyNumberSearch,
  filters = { type: '', propertyType: '', area: '', price: '', deposit: '' },
  onFilterChange,
  isAdmin,
  onMapReset,
  onRefresh
}) => {
  // 디버깅: 관리자 상태 확인
  console.log('🔧 Header 렌더링 - isAdmin:', isAdmin);
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [depositRange, setDepositRange] = useState({ min: '', max: '' });
  const [areaRange, setAreaRange] = useState({ min: '', max: '' });
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
  // 선택된 가격들 (범위 형식 포함)
  const cleanSelectedPrices = useMemo(() => {
    return selectedPrices;
  }, [selectedPrices]);

  // filters 객체가 변경될 때 로컬 상태 동기화
  React.useEffect(() => {
    // price 필터 동기화
    if (filters.price) {
      // 범위 형식 (예: "5억~10억", "최소값~1억", "500억~최대값")을 파싱하여 selectedPrices 설정
      if (filters.price.includes('~')) {
        const [minStr, maxStr] = filters.price.split('~');
        
        // 범위를 매매가 옵션으로 변환
        let minOption = '';
        let maxOption = '';
        
        if (minStr === '최소값') {
          minOption = '~1억';
        } else {
          minOption = `${minStr.replace(/[억]/g, '')}억`;
        }
        
        if (maxStr === '최대값') {
          maxOption = '500억~';
        } else {
          maxOption = `${maxStr.replace(/[억]/g, '')}억`;
        }
        
        if (minStr === maxStr) {
          // 단일 값인 경우
          if (minStr === '최소값') {
            setSelectedPrices(['~1억']);
            setPriceRange({ min: '최소값', max: '1억' });
          } else if (minStr === '최대값') {
            setSelectedPrices(['500억~']);
            setPriceRange({ min: '500억', max: '최대값' });
          } else {
            const value = minStr.replace(/[억]/g, '');
            setSelectedPrices([`${value}억`]);
            setPriceRange({ min: `${value}억`, max: `${value}억` });
          }
        } else {
          // 범위인 경우
          setSelectedPrices([minOption, maxOption]);
          setPriceRange({ min: minStr, max: maxStr });
        }
      } else {
        // 단일 값 형식
        const priceArray = filters.price.split(',').filter(p => p.trim() !== '');
        setSelectedPrices(priceArray);
      }
    } else {
      setSelectedPrices([]);
      setPriceRange({ min: '', max: '' });
    }
    
    // deposit 필터 동기화
    if (filters.deposit) {
      // 새로운 범위 형식 (예: "0~100", "1000~3000")을 파싱하여 selectedDeposits 설정
      if (filters.deposit.includes('~')) {
        const [minStr, maxStr] = filters.deposit.split('~');
        const min = parseInt(minStr);
        const max = maxStr === '9999' ? 9999 : parseInt(maxStr);
        
        // 범위를 보증금 옵션으로 변환
        let minOption = '';
        let maxOption = '';
        
        if (min === 0) {
          minOption = '~100만';
        } else {
          minOption = `${min}만`;
        }
        
        if (max === 9999) {
          maxOption = '4000만~';
        } else {
          maxOption = `${max}만`;
        }
        
        if (min === max) {
          setSelectedDeposits([minOption]);
          if (min === 0) {
            setDepositRange({ min: '0', max: '100' });
          } else {
            setDepositRange({ min: min.toString(), max: min.toString() });
          }
        } else {
          setSelectedDeposits([minOption, maxOption]);
          setDepositRange({ 
            min: min === 0 ? '0' : min.toString(), 
            max: max === 9999 ? '최대값' : max.toString() 
          });
        }
      } else {
        setSelectedDeposits([]);
        setDepositRange({ min: '', max: '' });
      }
    } else {
      setSelectedDeposits([]);
      setDepositRange({ min: '', max: '' });
    }
    
    // area 필터 동기화
    if (filters.area) {
      const areaArray = filters.area.split(',').filter(a => a.trim() !== '');
      // "1" 형태를 "1평" 형태로 변환
      const convertedAreas = areaArray.map(area => {
        if (area === '1') return '1평';
        if (area === '200') return '200평~';
        return area + '평';
      });
      setSelectedAreas(convertedAreas);
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
    '~100만', '500만', '1000만', '2000만', '3000만', '4000만~'
  ];

  // 면적 옵션들 (1차원 배열로 변경)
  const areaOptions = [
    '1평', '10평', '15평', '20평', '25평', '30평',
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
      { value: 'land', label: '토지' },
      { value: 'building', label: '건물' },
      { value: 'commercial', label: '상가' },
      { value: 'office', label: '사무실' },
      { value: 'apartment', label: '아파트' },
      { value: 'officetel', label: '오피스텔' },
      { value: 'villa', label: '빌라' },
      { value: 'house', label: '단독주택' },
      { value: 'other', label: '기타' }
    ]
  };

  const handleDropdownToggle = (filterType: string) => {
    const newDropdown = openDropdown === filterType ? null : filterType;
    setOpenDropdown(newDropdown);
    
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
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType as keyof typeof filters] === value ? '' : value
    };
    
    onFilterChange?.(newFilters);
    // 팝업 자동 닫기 제거 - 오직 외부 클릭 시에만 닫힘
  };

  const handlePriceSelect = (price: string) => {
    console.log('🔧 매매가 버튼 클릭:', price);
    console.log('🔧 현재 선택된 버튼들:', selectedPrices);
    
    let newSelectedPrices = [...selectedPrices];
    
    if (newSelectedPrices.includes(price)) {
      newSelectedPrices = newSelectedPrices.filter(p => p !== price);
      console.log('🔧 선택 해제:', newSelectedPrices);
    } else {
      if (newSelectedPrices.length >= 2) {
        newSelectedPrices = [newSelectedPrices[1], price];
        console.log('🔧 2개 초과 - 첫 번째 제거 후 새로 추가:', newSelectedPrices);
      } else {
        newSelectedPrices.push(price);
        console.log('🔧 새로 추가:', newSelectedPrices);
      }
    }
    
    // 중복 제거 (보증금과 동일한 방식)
    const uniquePrices = newSelectedPrices.filter((item, index) => newSelectedPrices.indexOf(item) === index);
    
    // ~1억 선택 시 1억이 중복으로 선택되지 않도록 강제 처리 (단, ~1억이 선택된 상태에서만)
    if (uniquePrices.includes('~1억') && uniquePrices.includes('1억')) {
      const finalPrices = uniquePrices.filter(p => p !== '1억');
      setSelectedPrices(finalPrices);
      newSelectedPrices = finalPrices;
    } else {
      setSelectedPrices(uniquePrices);
      newSelectedPrices = uniquePrices;
    }
    
    console.log('🔧 최종 선택된 버튼들:', newSelectedPrices);
    
    // 매매가 범위 필터 로직 (보증금과 동일한 시스템)
    if (newSelectedPrices.length === 0) {
      // 선택 해제된 경우
      setPriceRange({ min: '', max: '' });
    } else if (newSelectedPrices.length === 1) {
      const selectedPrice = newSelectedPrices[0];
      
      // 단일 값 선택 시 범위 설정
      if (selectedPrice === '~1억') {
        setPriceRange({ min: '최소값', max: '1억' });
      } else if (selectedPrice === '500억~') {
        setPriceRange({ min: '500억', max: '최대값' });
      } else {
        // 3억, 5억, 8억, 10억, 15억, 20억, 30억, 50억의 경우 해당 값으로 범위 설정
        setPriceRange({ min: selectedPrice, max: selectedPrice });
      }
    } else if (newSelectedPrices.length === 2) {
      // 두 값 선택 시 범위 설정
      const sorted = newSelectedPrices.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;
        
        if (a === '~1억') {
          aValue = 0;
        } else if (a === '500억~') {
          aValue = 500;
        } else {
          aValue = parseInt(a.replace(/[억~]/g, ''));
        }
        
        if (b === '~1억') {
          bValue = 0;
        } else if (b === '500억~') {
          bValue = 500;
        } else {
          bValue = parseInt(b.replace(/[억~]/g, ''));
        }
        
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
    }

    // App.tsx로 필터 값 전달 - 범위 형식으로 전달
    let filterValue = '';
    if (newSelectedPrices.length === 0) {
      // 선택 해제된 경우
      filterValue = '';
    } else if (newSelectedPrices.length === 1) {
      const selectedPrice = newSelectedPrices[0];
      if (selectedPrice === '~1억') {
        filterValue = '최소값~1억';
      } else if (selectedPrice === '500억~') {
        filterValue = '500억~최대값';
      } else {
        const value = selectedPrice.replace(/[~억]/g, '');
        filterValue = `${value}억~${value}억`;
      }
    } else if (newSelectedPrices.length === 2) {
      const sorted = newSelectedPrices.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;
        
        if (a === '~1억') {
          aValue = 0;
        } else if (a === '500억~') {
          aValue = 500;
        } else {
          aValue = parseInt(a.replace(/[~억]/g, ''));
        }
        
        if (b === '~1억') {
          bValue = 0;
        } else if (b === '500억~') {
          bValue = 500;
        } else {
          bValue = parseInt(b.replace(/[~억]/g, ''));
        }
        
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
      
      filterValue = `${minValue}~${maxValue}`;
    }
    
    console.log('🔧 매매가 필터 값 생성:', {
      선택된버튼들: newSelectedPrices,
      생성된필터값: filterValue,
      범위설정: priceRange
    });
    
    const newFilters = {
      ...filters,
      price: filterValue
    };
    
    console.log('🔧 최종 전달할 필터:', newFilters);
    onFilterChange?.(newFilters);
    
    // 팝업 자동 닫기 제거 - 오직 외부 클릭 시에만 닫힘
  };

  const handleDepositSelect = (deposit: string) => {
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
    
    // ~100만 중복 완전 제거
    const uniqueDeposits = newSelectedDeposits.filter((item, index) => newSelectedDeposits.indexOf(item) === index);
    
    // ~100만 선택 시 100만이 중복으로 선택되지 않도록 강제 처리 (단, ~100만이 선택된 상태에서만)
    if (uniqueDeposits.includes('~100만') && uniqueDeposits.includes('100만')) {
      const finalDeposits = uniqueDeposits.filter(d => d !== '100만');
      setSelectedDeposits(finalDeposits);
      newSelectedDeposits = finalDeposits;
    } else {
      setSelectedDeposits(uniqueDeposits);
      newSelectedDeposits = uniqueDeposits;
    }
    
    // 보증금 범위 필터 로직 수정 (매매가와 동일한 시스템)
    if (newSelectedDeposits.length === 0) {
      // 선택 해제된 경우
      setDepositRange({ min: '', max: '' });
    } else if (newSelectedDeposits.length === 1) {
      const selectedDeposit = newSelectedDeposits[0];
      
      // 단일 값 선택 시 범위 설정
      if (selectedDeposit === '~100만') {
        setDepositRange({ min: '0', max: '100' });
      } else if (selectedDeposit === '4000만~') {
        setDepositRange({ min: '4000', max: '최대값' });
      } else {
        // 500만, 1000만, 2000만, 3000만의 경우 해당 값으로 범위 설정
        const depositValue = selectedDeposit.replace(/[~만]/g, '');
        setDepositRange({ min: depositValue, max: depositValue });
      }
    } else if (newSelectedDeposits.length === 2) {
      // 두 값 선택 시 범위 설정
      const sorted = newSelectedDeposits.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;
        
        if (a === '~100만') {
          aValue = 0;
        } else if (a === '4000만~') {
          aValue = 4000;
        } else {
          aValue = parseInt(a.replace(/[~만]/g, ''));
        }
        
        if (b === '~100만') {
          bValue = 0;
        } else if (b === '4000만~') {
          bValue = 4000;
        } else {
          bValue = parseInt(b.replace(/[~만]/g, ''));
        }
        
        return aValue - bValue;
      });
      
      // 범위 설정
      let minValue = '';
      let maxValue = '';
      
      if (sorted[0] === '~100만') {
        minValue = '0';
      } else {
        minValue = sorted[0].replace(/[~만]/g, '');
      }
      
      if (sorted[1] === '4000만~') {
        maxValue = '최대값';
      } else {
        maxValue = sorted[1].replace(/[~만]/g, '');
      }
      
      setDepositRange({ min: minValue, max: maxValue });
    } else {
      setDepositRange({ min: '', max: '' });
    }

    // App.tsx로 필터 값 전달 - 범위 형식으로 전달
    let filterValue = '';
    if (newSelectedDeposits.length === 0) {
      // 선택 해제된 경우
      filterValue = '';
    } else if (newSelectedDeposits.length === 1) {
      const selectedDeposit = newSelectedDeposits[0];
      if (selectedDeposit === '~100만') {
        filterValue = '0~100';
      } else if (selectedDeposit === '4000만~') {
        filterValue = '4000~9999';
      } else {
        const value = selectedDeposit.replace(/[~만]/g, '');
        filterValue = `${value}~${value}`;
      }
    } else if (newSelectedDeposits.length === 2) {
      const sorted = newSelectedDeposits.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;
        
        if (a === '~100만') {
          aValue = 0;
        } else if (a === '4000만~') {
          aValue = 4000;
        } else {
          aValue = parseInt(a.replace(/[~만]/g, ''));
        }
        
        if (b === '~100만') {
          bValue = 0;
        } else if (b === '4000만~') {
          bValue = 4000;
        } else {
          bValue = parseInt(b.replace(/[~만]/g, ''));
        }
        
        return aValue - bValue;
      });
      
      let minValue = 0;
      let maxValue = 0;
      
      if (sorted[0] === '~100만') {
        minValue = 0;
      } else {
        minValue = parseInt(sorted[0].replace(/[~만]/g, ''));
      }
      
      if (sorted[1] === '4000만~') {
        maxValue = 9999;
      } else {
        maxValue = parseInt(sorted[1].replace(/[~만]/g, ''));
      }
      
      filterValue = `${minValue}~${maxValue}`;
    }
    
    const newFilters = {
      ...filters,
      deposit: filterValue
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
    
    // 범위 설정 로직 개선
    if (newSelectedAreas.length === 0) {
      setAreaRange({ min: '', max: '' });
    } else if (newSelectedAreas.length === 1) {
      const selectedArea = newSelectedAreas[0];
      if (selectedArea === '1평') {
        setAreaRange({ min: '1', max: '1' });
      } else if (selectedArea === '200평~') {
        setAreaRange({ min: '200', max: '최대값' });
      } else {
        // 단일 값 선택 (예: "10평")
        const areaValue = selectedArea.replace(/[평~]/g, '');
        setAreaRange({ min: areaValue, max: areaValue });
      }
    } else if (newSelectedAreas.length === 2) {
      // 두 값 선택 시 범위 설정
      const sorted = newSelectedAreas.sort((a, b) => {
        const aValue = parseInt(a.replace(/[평~]/g, ''));
        const bValue = parseInt(b.replace(/[평~]/g, ''));
        return aValue - bValue;
      });
      
      let minValue = '';
      let maxValue = '';
      
      // 최소값 처리
      if (sorted[0] === '1평') {
        minValue = '1';
      } else {
        minValue = sorted[0].replace(/[평~]/g, '');
      }
      
      // 최대값 처리
      if (sorted[1] === '200평~') {
        maxValue = '최대값';
      } else {
        maxValue = sorted[1].replace(/[평~]/g, '');
      }
      
      setAreaRange({ min: minValue, max: maxValue });
    }

    // App.tsx로 필터 값 전달 - "1평"을 "1"로 변환하여 전달
    const processedAreas = newSelectedAreas.map(area => {
      if (area === '1평') return '1';
      if (area === '200평~') return '200'; // 200평~은 200만 전달
      return area.replace(/[평~]/g, '');
    });
    
    console.log('🔧 면적 필터 디버깅:', {
      selectedAreas: newSelectedAreas,
      processedAreas: processedAreas,
      finalAreaValue: processedAreas.length > 0 ? `${processedAreas.join(',')}` : ''
    });
    
    const newFilters = {
      ...filters,
      area: processedAreas.length > 0 ? `${processedAreas.join(',')}` : ''
    };
    onFilterChange?.(newFilters);
  };

  const getFilterDisplayText = (filterType: string) => {
    if (filterType === 'price') {
      let displayText = '';
      
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
      }
      
      // 보증금 선택 여부 확인 (매매가가 선택되지 않은 경우에만)
      if (selectedDeposits.length > 0 && selectedPrices.length === 0) {
        // 중복 완전 제거
        const uniqueDeposits = selectedDeposits.filter((item, index) => selectedDeposits.indexOf(item) === index);
        
        // ~100만이 있으면 100만 제거
        const finalDeposits = uniqueDeposits.includes('~100만') 
          ? uniqueDeposits.filter(d => d !== '100만')
          : uniqueDeposits;
        
        let depositText = '';
        if (finalDeposits.length === 1) {
          // 단일 값 선택 시
          if (finalDeposits[0] === '~100만') {
            depositText = '0~100만';
          } else if (finalDeposits[0] === '4000만~') {
            depositText = '4000만~';
          } else {
            depositText = finalDeposits[0];
          }
        } else if (finalDeposits.length === 2) {
          // 두 값 선택 시 범위 표시
          const sorted = finalDeposits.sort((a, b) => {
            let aValue = 0;
            let bValue = 0;
            
            if (a === '~100만') {
              aValue = 0;
            } else if (a === '4000만~') {
              aValue = 4000;
            } else {
              aValue = parseInt(a.replace(/[~만]/g, ''));
            }
            
            if (b === '~100만') {
              bValue = 0;
            } else if (b === '4000만~') {
              bValue = 4000;
            } else {
              bValue = parseInt(b.replace(/[~만]/g, ''));
            }
            
            return aValue - bValue;
          });
          
          // 범위 표시 형식으로 변환
          let minDisplay = '';
          let maxDisplay = '';
          
          if (sorted[0] === '~100만') {
            minDisplay = '0~100만';
          } else {
            minDisplay = sorted[0];
          }
          
          if (sorted[1] === '4000만~') {
            maxDisplay = '4000만~';
          } else {
            maxDisplay = sorted[1];
          }
          
          // 같은 값이면 중복 제거
          if (minDisplay === maxDisplay) {
            depositText = minDisplay;
          } else {
            depositText = `${minDisplay}~${maxDisplay}`;
          }
        }
        
        displayText = depositText;
      }
      
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
        if (selectedAreas[0] === '1평') {
          return '1평';
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
        
        // 범위 표시 시 "1평"을 "1평"으로 유지
        let minDisplay = sorted[0];
        let maxDisplay = sorted[1];
        
        if (sorted[0] === '1평') {
          minDisplay = '1평';
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
      
      // 중복된 평 단위 제거 및 정리
      minText = minText.replace(/평+/g, '평'); // 연속된 평을 하나로 정리
      maxText = maxText.replace(/평+/g, '평'); // 연속된 평을 하나로 정리
      
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
      if (openDropdown) {
        const target = event.target as Element;
        
        // 필터 드롭다운 영역이 아닌 곳을 클릭했는지 확인
        const isFilterDropdown = target.closest('.filter-dropdown');
        
        // 필터 드롭다운 영역이 아닌 곳을 클릭한 경우에만 닫기
        if (!isFilterDropdown) {
          setOpenDropdown(null);
        }
      }
    };

    const handleTouchOutside = (event: TouchEvent) => {
      if (openDropdown) {
        const target = event.target as Element;
        
        // 필터 드롭다운 영역이 아닌 곳을 터치했는지 확인
        const isFilterDropdown = target.closest('.filter-dropdown');
        
        // 필터 드롭다운 영역이 아닌 곳을 터치한 경우에만 닫기
        if (!isFilterDropdown) {
          setOpenDropdown(null);
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
      {/* 첫 번째 줄: 상호명 + 초기화 버튼 */}
      <TopRow>
        <LeftSection>
          <LogoSection>
            <Logo>
              <img 
                src={paLogo} 
                alt="PA 로고" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // 이미지 로드 실패 시 대체 로고 표시
                  const fallbackLogo = document.createElement('div');
                  fallbackLogo.style.cssText = `
                    width: 45px; /* 로고 크기 축소 */
                    height: 45px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem; /* 폰트 크기 축소 */
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    border: none;
                  `;
                  fallbackLogo.textContent = 'PA';
                  target.parentNode?.insertBefore(fallbackLogo, target);
                }}
                style={{
                  width: '45px', /* 로고 크기 축소 */
                  height: '45px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  boxShadow: 'none',
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none'
                }}
              />
              <CompanyName>
                <div className="company-main">피에이</div>
                <div className="company-sub">공인중개사사무소</div>
              </CompanyName>
            </Logo>
          </LogoSection>
        </LeftSection>

        <RightSection>
          <ActionButton onClick={() => {
            
            // 1. 모든 로컬 필터 상태 초기화
            setSelectedAreas([]);
            setSelectedPrices([]);
            setSelectedDeposits([]);
            setAreaRange({ min: '', max: '' });
            setPriceRange({ min: '', max: '' });
            setDepositRange({ min: '', max: '' });
            setOpenDropdown(null);
            
            // 2. 필터 초기화 (App.tsx로 전달)
            if (onFilterChange) {
              const resetFilters = {
                type: '',
                propertyType: '',
                area: '',
                price: '',
                deposit: ''
              };
              onFilterChange(resetFilters);
            }
            
            // 3. 검색어 초기화
            if (onSearchChange) {
              onSearchChange('');
            }
            if (onAddressSearchChange) {
              onAddressSearchChange('');
            }
            
            // 4. 지도 리셋
            if (onMapReset) {
              onMapReset();
            } else {
              window.location.reload();
            }
          }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            초기화
          </ActionButton>
        </RightSection>
      </TopRow>

      {/* 두 번째 줄: 필터 버튼들 일렬로 배치 */}
      <FilterRow>
          {/* 매물번호, 제목, 주소 검색창 숨김 */}
          {/* <SearchInput
            type="text"
            placeholder="매물번호, 제목, 주소 검색 (예: 1, P1, 상가)"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                // 검색 실행 로직 (필요시 추가)
              }
            }}
            title="매물번호는 숫자만 입력해도 됩니다. 예: 1→P1, 001→P001, 0021→P0021, 상가, 강남구"
          />
          
          <FilterButtonContainer className="filter-dropdown" style={{ overflow: 'visible', zIndex: 99999 }}>
            <FilterButtonDefault
              onClick={() => handleDropdownToggle('type')}
              data-filter="type"
              style={{
                borderColor: openDropdown === 'type' ? '#3b82f6' : '#d1d5db',
                backgroundColor: openDropdown === 'type' ? '#eff6ff' : (filters.type !== '' ? '#f3f4f6' : '#ffffff')
              }}
            >
              {getFilterDisplayText('type')}▼
            </FilterButtonDefault>
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
            <FilterButtonDefault
              onClick={() => handleDropdownToggle('propertyType')}
              data-filter="propertyType"
              style={{
                borderColor: openDropdown === 'propertyType' ? '#3b82f6' : '#d1d5db',
                backgroundColor: openDropdown === 'propertyType' ? '#eff6ff' : (filters.propertyType !== '' ? '#f3f4f6' : '#ffffff')
              }}
            >
              {getFilterDisplayText('propertyType')}▼
            </FilterButtonDefault>
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
            <FilterButtonDefault
              onClick={() => handleDropdownToggle('area')}
              data-filter="area"
              style={{
                borderColor: openDropdown === 'area' ? '#3b82f6' : '#d1d5db',
                backgroundColor: openDropdown === 'area' ? '#eff6ff' : (selectedAreas.length > 0 ? '#f3f4f6' : '#ffffff')
              }}
            >
              {getFilterDisplayText('area')}▼
            </FilterButtonDefault>
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
                          // 선택된 버튼은 항상 파란색으로 표시
                          const isActive = selectedAreas.includes(area);
                          console.log(`🔧 AreaButton ${area} isActive:`, isActive, 'selectedAreas:', selectedAreas);
                          return isActive;
                        })()}
                        isInRange={(() => {
                          if (selectedAreas.length !== 2) return false; // 두 개 버튼이 선택된 경우에만 범위 표시
                          
                          // '1평'과 '200평~' 특별 처리 - 범위 표시 안함
                          if (area === '1평' || area === '200평~') return false;
                          
                          // 선택된 버튼들 사이의 범위만 연한색으로 표시
                          const sortedAreas = selectedAreas.sort((a, b) => {
                            const aValue = parseInt(a.replace(/[평~]/g, ''));
                            const bValue = parseInt(b.replace(/[평~]/g, ''));
                            return aValue - bValue;
                          });
                          
                          const areaValue = parseFloat(area.replace(/[평~]/g, ''));
                          let minValue = 0;
                          let maxValue = 999;
                          
                          // 최소값 처리
                          if (sortedAreas[0] === '1평') {
                            minValue = 1;
                          } else {
                            minValue = parseFloat(sortedAreas[0].replace(/[평~]/g, ''));
                          }
                          
                          // 최대값 처리
                          if (sortedAreas[1] === '200평~') {
                            maxValue = 999;
                          } else {
                            maxValue = parseFloat(sortedAreas[1].replace(/[평~]/g, ''));
                          }
                          
                          // 선택된 버튼들 사이의 값만 연한색으로 표시
                          return areaValue > minValue && areaValue < maxValue && 
                                 !selectedAreas.includes(area);
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newAreaRange = { ...areaRange, min: e.target.value };
                        setAreaRange(newAreaRange);
                        
                        // 입력 필드 값이 변경될 때마다 필터 업데이트
                        let filterValue = '';
                        if (newAreaRange.min && newAreaRange.max) {
                          // 최대값이 '최대값'인 경우 특별 처리
                          if (newAreaRange.max === '최대값') {
                            filterValue = `${newAreaRange.min}~최대값`;
                          } else {
                            filterValue = `${newAreaRange.min}~${newAreaRange.max}`;
                          }
                        } else if (newAreaRange.min) {
                          // 단일 값은 "10평" 형식으로 전달
                          filterValue = newAreaRange.min;
                        } else if (newAreaRange.max) {
                          if (newAreaRange.max === '최대값') {
                            filterValue = `0~최대값`;
                          } else {
                            // 단일 값은 "10평" 형식으로 전달
                            filterValue = newAreaRange.max;
                          }
                        }
                        
                        const newFilters = {
                          ...filters,
                          area: filterValue
                        };
                        onFilterChange?.(newFilters);
                      }}
                    />
                    <RangeSeparator>~</RangeSeparator>
                    <RangeInput
                      type="text"
                      placeholder="최대"
                      value={areaRange.max}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newAreaRange = { ...areaRange, max: e.target.value };
                        setAreaRange(newAreaRange);
                        
                        // 입력 필드 값이 변경될 때마다 필터 업데이트
                        let filterValue = '';
                        if (newAreaRange.min && newAreaRange.max) {
                          // 최대값이 '최대값'인 경우 특별 처리
                          if (newAreaRange.max === '최대값') {
                            filterValue = `${newAreaRange.min}~최대값`;
                          } else {
                            filterValue = `${newAreaRange.min}~${newAreaRange.max}`;
                          }
                        } else if (newAreaRange.min) {
                          // 단일 값은 "10평" 형식으로 전달
                          filterValue = newAreaRange.min;
                        } else if (newAreaRange.max) {
                          if (newAreaRange.max === '최대값') {
                            filterValue = `0~최대값`;
                          } else {
                            // 단일 값은 "10평" 형식으로 전달
                            filterValue = newAreaRange.max;
                          }
                        }
                        
                        const newFilters = {
                          ...filters,
                          area: filterValue
                        };
                        onFilterChange?.(newFilters);
                      }}
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
            <FilterButtonDefault
              onClick={() => handleDropdownToggle('price')}
              data-filter="price"
              style={{
                borderColor: openDropdown === 'price' ? '#3b82f6' : '#d1d5db',
                backgroundColor: openDropdown === 'price' ? '#eff6ff' : ((selectedPrices.length > 0 || selectedDeposits.length > 0) ? '#f3f4f6' : '#ffffff')
              }}
            >
              {(() => {
                const text = getFilterDisplayText('price');
                return text;
              })()}▼
            </FilterButtonDefault>
            <FilterPopup isOpen={openDropdown === 'price'} isWide={true} isPrice={true}>
              <FilterPopupHeader isPriceModal={true}>
                <FilterPopupTitle>금액</FilterPopupTitle>
                <ConfirmButton onClick={() => setOpenDropdown(null)}>확인</ConfirmButton>
              </FilterPopupHeader>
              <FilterPopupContent isPriceModal={true}>
                <PriceSection isPriceModal={true}>
                  <PriceTitle isPriceModal={true}>매매가</PriceTitle>
                  <PriceGrid isPriceModal={true}>
                    {priceOptions.map((price) => (
                      <PriceButton
                        key={price}
                        isPriceModal={true}
                        isActive={(() => {
                          // 선택된 버튼들 중에서 정확히 일치하는 것만 파란색으로 표시
                          return cleanSelectedPrices.includes(price);
                        })()}
                        isInRange={(() => {
                          if (cleanSelectedPrices.length !== 2) return false;
                          
                          // 선택된 두 값 사이의 범위에 있는지 확인
                          const sortedPrices = cleanSelectedPrices.sort((a, b) => {
                            let aValue = 0;
                            let bValue = 0;
                            
                            if (a === '~1억') aValue = 0;
                            else if (a === '500억~') aValue = 500;
                            else aValue = parseFloat(a.replace(/[~억]/g, ''));
                            
                            if (b === '~1억') bValue = 0;
                            else if (b === '500억~') bValue = 500;
                            else bValue = parseFloat(b.replace(/[~억]/g, ''));
                            
                            return aValue - bValue;
                          });
                          
                          const priceValue = (() => {
                            if (price === '~1억') return 0;
                            if (price === '500억~') return 500;
                            return parseFloat(price.replace(/[~억]/g, ''));
                          })();
                          
                          const minValue = (() => {
                            if (sortedPrices[0] === '~1억') return 0;
                            if (sortedPrices[0] === '500억~') return 500;
                            return parseFloat(sortedPrices[0].replace(/[~억]/g, ''));
                          })();
                          
                          const maxValue = (() => {
                            if (sortedPrices[1] === '~1억') return 0;
                            if (sortedPrices[1] === '500억~') return 500;
                            return parseFloat(sortedPrices[1].replace(/[~억]/g, ''));
                          })();
                          
                          return priceValue > minValue && priceValue < maxValue && 
                                 !cleanSelectedPrices.includes(price);
                        })()}
                        onClick={() => {
                          handlePriceSelect(price);
                        }}
                      >
                        {price}
                      </PriceButton>
                    ))}
                  </PriceGrid>

                  <CustomRangeContainer isPriceModal={true}>
                    <RangeInput
                      isPriceModal={true}
                      type="text"
                      placeholder="최소"
                      value={priceRange.min}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newPriceRange = { ...priceRange, min: e.target.value };
                        setPriceRange(newPriceRange);
                        
                        // 입력 필드 값이 변경될 때마다 필터 업데이트
                        let filterValue = '';
                        if (newPriceRange.min && newPriceRange.max) {
                          filterValue = `${newPriceRange.min}~${newPriceRange.max}`;
                        } else if (newPriceRange.min) {
                          filterValue = `${newPriceRange.min}~${newPriceRange.min}`;
                        } else if (newPriceRange.max) {
                          filterValue = `${newPriceRange.max}~${newPriceRange.max}`;
                        }
                        
                        const newFilters = {
                          ...filters,
                          price: filterValue
                        };
                        onFilterChange?.(newFilters);
                      }}
                    />
                    <RangeSeparator>~</RangeSeparator>
                    <RangeInput
                      isPriceModal={true}
                      type="text"
                      placeholder="최대"
                      value={priceRange.max}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newPriceRange = { ...priceRange, max: e.target.value };
                        setPriceRange(newPriceRange);
                        
                        // 입력 필드 값이 변경될 때마다 필터 업데이트
                        let filterValue = '';
                        if (newPriceRange.min && newPriceRange.max) {
                          filterValue = `${newPriceRange.min}~${newPriceRange.max}`;
                        } else if (newPriceRange.min) {
                          filterValue = `${newPriceRange.min}~${newPriceRange.min}`;
                        } else if (newPriceRange.max) {
                          filterValue = `${newPriceRange.max}~${newPriceRange.max}`;
                        }
                        
                        const newFilters = {
                          ...filters,
                          price: filterValue
                        };
                        onFilterChange?.(newFilters);
                      }}
                    />
                    <RangeSeparator>원</RangeSeparator>
                  </CustomRangeContainer>
                </PriceSection>

                <DepositSection isPriceModal={true}>
                  <DepositTitle isPriceModal={true}>보증금</DepositTitle>
                  <DepositSlider isPriceModal={true}>
                    {depositOptions.map((deposit) => (
                      <DepositButton
                        key={deposit}
                        isPriceModal={true}
                        isSelected={selectedDeposits.includes(deposit)}
                        isActive={(() => {
                          // selectedDeposits 배열을 기준으로 활성화 상태 결정
                          if (deposit === '~100만') {
                            return selectedDeposits.includes('~100만');
                          } else if (deposit === '4000만~') {
                            return selectedDeposits.includes('4000만~');
                          } else {
                            return selectedDeposits.includes(deposit);
                          }
                        })()}
                        isInRange={(() => {
                          if (depositRange.min === '' || depositRange.max === '') return false;
                          
                          // '~100만'과 '4000만~' 특별 처리
                          if (deposit === '~100만' || deposit === '4000만~') return false;
                          
                          const depositValue = parseInt(deposit.replace(/[~만]/g, ''));
                          let minValue = 0;
                          let maxValue = 9999;
                          
                          if (depositRange.min !== '') {
                            if (depositRange.min === '0') {
                              minValue = 0;
                            } else {
                              minValue = parseInt(depositRange.min);
                            }
                          }
                          if (depositRange.max !== '') {
                            if (depositRange.max === '최대값') {
                              maxValue = 9999;
                            } else {
                              maxValue = parseInt(depositRange.max);
                            }
                          }
                          
                          return depositValue > minValue && depositValue < maxValue && 
                                 !selectedDeposits.includes(deposit);
                        })()}
                        onClick={() => {
                          handleDepositSelect(deposit);
                        }}
                      >
                        {deposit}
                      </DepositButton>
                    ))}
                  </DepositSlider>

                  <CustomRangeContainer isPriceModal={true}>
                    <RangeInput
                      isPriceModal={true}
                      type="text"
                      placeholder="최소"
                      value={(() => {
                        if (depositRange.min === '') return '';
                        if (depositRange.min === '0') return '0';
                        if (depositRange.min === '최대값') return '';
                        if (depositRange.min === '4000') return '4000만~';
                        const min = parseInt(depositRange.min);
                        return `${min}만`;
                      })()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newDepositRange = { ...depositRange, min: e.target.value };
                        setDepositRange(newDepositRange);
                        
                        // 입력 필드 값이 변경될 때마다 필터 업데이트
                        let filterValue = '';
                        if (newDepositRange.min && newDepositRange.max) {
                          filterValue = `${newDepositRange.min}~${newDepositRange.max}`;
                        } else if (newDepositRange.min) {
                          filterValue = `${newDepositRange.min}~${newDepositRange.min}`;
                        } else if (newDepositRange.max) {
                          filterValue = `${newDepositRange.max}~${newDepositRange.max}`;
                        }
                        
                        const newFilters = {
                          ...filters,
                          deposit: filterValue
                        };
                        onFilterChange?.(newFilters);
                      }}
                    />
                    <RangeSeparator>~</RangeSeparator>
                    <RangeInput
                      isPriceModal={true}
                      type="text"
                      placeholder="최대"
                      value={(() => {
                        if (depositRange.max === '') return '';
                        if (depositRange.max === '최대값') return '최대값';
                        if (depositRange.min === '0' && depositRange.max === '100') return '100만';
                        if (depositRange.min === '4000' && depositRange.max === '최대값') return '최대값';
                        const max = parseInt(depositRange.max);
                        return `${max}만`;
                      })()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newDepositRange = { ...depositRange, max: e.target.value };
                        setDepositRange(newDepositRange);
                        
                        // 입력 필드 값이 변경될 때마다 필터 업데이트
                        let filterValue = '';
                        if (newDepositRange.min && newDepositRange.max) {
                          filterValue = `${newDepositRange.min}~${newDepositRange.max}`;
                        } else if (newDepositRange.min) {
                          filterValue = `${newDepositRange.min}~${newDepositRange.min}`;
                        } else if (newDepositRange.max) {
                          filterValue = `${newDepositRange.max}~${newDepositRange.max}`;
                        }
                        
                        const newFilters = {
                          ...filters,
                          deposit: filterValue
                        };
                        onFilterChange?.(newFilters);
                      }}
                    />
                    <RangeSeparator>원</RangeSeparator>
                  </CustomRangeContainer>
                </DepositSection>
                
                <ResetFilterButton isPriceModal={true} onClick={resetPriceAndDepositFilter}>
                  초기화
                </ResetFilterButton>
              </FilterPopupContent>
            </FilterPopup>
          </FilterButtonContainer>
          
          {/* 주소 검색창 숨김 */}
          {/* <SearchInput
            type="text"
            placeholder="주소 검색"
            value={addressSearch}
            onChange={(e) => onAddressSearchChange?.(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                // 검색 실행 로직 (필요시 추가)
              }
            }}
          /> */}
      </FilterRow>
    </HeaderContainer>
  );
};

export default Header;