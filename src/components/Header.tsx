import React, { useState } from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const MainSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  max-width: 1200px;
  margin: 0 auto;
  gap: 0.75rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
  margin-right: 0.75rem;

  @media (max-width: 768px) {
    margin-right: 0;
    justify-content: center;
  }
`;

const Logo = styled.div`
  width: 80px;
  height: 60px;
  background: linear-gradient(90deg, #0f4c3a 0%, #1a5f3a 30%, #2d7d4f 60%, #4ade80 100%);
  transform: skew(-5deg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 2rem;
  font-family: Arial, sans-serif;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  /* 내부 텍스트를 기울기와 반대로 보정 */
  & > span {
    transform: skew(5deg);
    display: block;
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 45px;
    font-size: 1.5rem;
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;

  @media (max-width: 768px) {
    align-items: center;
  }
`;

const CompanyName = styled.h1`
  font-size: 1.75rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CompanyType = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
  white-space: nowrap;
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  max-width: 700px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    max-width: none;
  }
`;

const SearchInput = styled.input`
  flex: 2.5;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  color: #000;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    font-size: 14px;
    padding: 0.75rem;
  }
`;

const AddressInput = styled.input`
  flex: 2.5;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  color: #000;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    font-size: 14px;
    padding: 0.75rem;
  }
`;

const FilterButton = styled.button<{ isActive?: boolean; isOpen?: boolean }>`
  min-width: 60px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: ${props => props.isActive ? '#6B7280' : '#f9fafb'};
  color: ${props => props.isActive ? 'white' : '#374151'};
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background: ${props => props.isActive ? '#4B5563' : '#f3f4f6'};
  }

  &::after {
    content: '▼';
    font-size: 8px;
    transition: transform 0.2s ease;
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
    font-size: 14px;
    padding: 0.75rem;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: ${props => props.isOpen ? '800px' : '0'};
  overflow: hidden;
  transition: all 0.2s ease;
  margin-top: 2px;
  width: auto;
  min-width: fit-content;
`;

const PriceFilterContainer = styled.div`
  padding: 0.75rem;
`;

const FilterTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-weight: bold;
  font-size: 14px;
`;

const FilterTitleText = styled.span`
  display: flex;
  align-items: center;
`;

const ResetButton = styled.button`
  background: #6B7280;
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  
  &:hover {
    background: #4B5563;
  }
`;

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  width: 100%;
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

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const RangeSeparator = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const DepositSlider = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  width: 100%;
  max-width: 100%;
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

const DropdownOption = styled.button<{ isSelected?: boolean }>`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: ${props => props.isSelected ? '#2563eb' : 'white'};
  color: ${props => props.isSelected ? 'white' : '#374151'};
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.isSelected ? '#1d4ed8' : '#f9fafb'};
  }

  &:first-child {
    border-radius: 6px 6px 0 0;
  }

  &:last-child {
    border-radius: 0 0 6px 6px;
  }
`;

const FilterButtonContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-left: auto;

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
`;

const Button = styled.button<{ variant: 'reset' | 'upload' }>`
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  color: white;
  background: ${props => props.variant === 'reset' ? '#6B7280' : '#6B7280'};
  white-space: nowrap;

  &:hover {
    background: ${props => props.variant === 'reset' ? '#4B5563' : '#4B5563'};
  }

  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
    font-size: 14px;
    padding: 0.75rem;
  }
`;

const DepositSection = styled.div`
  padding: 0.75rem;
  padding-top: 0.5rem;
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
}

const Header: React.FC<HeaderProps> = ({ 
  onAddProperty, 
  searchTerm = '', 
  onSearchChange,
  addressSearch = '',
  onAddressSearchChange,
  filters = { type: '', propertyType: '', area: '', price: '', deposit: '' },
  onFilterChange,
  isAdmin
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [depositRange, setDepositRange] = useState({ min: '', max: '' });
  const [areaRange, setAreaRange] = useState({ min: '', max: '' });
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // 가격 옵션들 (6x4 그리드)
  const priceOptions = [
    ['~1억', '2억', '3억', '4억', '5억', '6억'],
    ['7억', '8억', '9억', '10억', '15억', '20억'],
    ['30억', '40억', '50억', '60억', '70억', '80억'],
    ['90억', '100억', '200억', '300억', '400억', '500억~']
  ];

  // 보증금 옵션들
  const depositOptions = [
    '~100만', '~500만', '~1천만', 
    '~2천만', '~3천만', '~4천만'
  ];

  // 면적 옵션들 (6x4 그리드로 변경)
  const areaOptions = [
    ['~5평', '10평', '15평', '20평', '25평', '30평'],
    ['35평', '40평', '45평', '50평', '55평', '60평'],
    ['65평', '70평', '100평', '150평', '180평', '200평~']
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
    setOpenDropdown(openDropdown === filterType ? null : filterType);
  };

  const handleOptionSelect = (filterType: string, value: string) => {
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType as keyof typeof filters] === value ? '' : value
    };
    onFilterChange?.(newFilters);
    setOpenDropdown(null);
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
      price: newSelectedPrices.length > 0 ? `${newSelectedPrices.join(',')}` : ''
    };
    onFilterChange?.(newFilters);
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
    
    setSelectedDeposits(newSelectedDeposits);
    
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
      deposit: newSelectedDeposits.length > 0 ? `${newSelectedDeposits.join(',')}` : ''
    };
    onFilterChange?.(newFilters);
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

    // App.tsx로 필터 값 전달
    const newFilters = {
      ...filters,
      area: newSelectedAreas.length > 0 ? `${newSelectedAreas.join(',')}` : ''
    };
    onFilterChange?.(newFilters);
  };

  const resetPriceFilter = () => {
    setSelectedPrices([]);
    setPriceRange({ min: '', max: '' });
    
    // App.tsx로 필터 값 전달
    const newFilters = {
      ...filters,
      price: ''
    };
    onFilterChange?.(newFilters);
  };

  const resetDepositFilter = () => {
    setSelectedDeposits([]);
    setDepositRange({ min: '', max: '' });
    
    // App.tsx로 필터 값 전달
    const newFilters = {
      ...filters,
      deposit: ''
    };
    onFilterChange?.(newFilters);
  };

  const resetAreaFilter = () => {
    setSelectedAreas([]);
    setAreaRange({ min: '', max: '' });
    
    // App.tsx로 필터 값 전달
    const newFilters = {
      ...filters,
      area: ''
    };
    onFilterChange?.(newFilters);
  };

  const getFilterDisplayText = (filterType: string) => {
    const currentValue = filters[filterType as keyof typeof filters];
    if (!currentValue || currentValue === '') {
      return filterType === 'type' ? '거래유형' :
             filterType === 'area' ? '면적' :
             filterType === 'price' ? '금액' :
             '매물종류';
    }
    
    const option = filterOptions[filterType as keyof typeof filterOptions]?.find(opt => opt.value === currentValue);
    return option?.label || currentValue;
  };

  const getPriceDisplayText = () => {
    let displayText = '';
    
    if (priceRange.min && priceRange.max) {
      if (priceRange.min === priceRange.max) {
        displayText = priceRange.min;
      } else {
        displayText = `${priceRange.min}~${priceRange.max}`;
      }
    }
    
    if (depositRange.min && depositRange.max) {
      if (depositRange.min === depositRange.max) {
        displayText += displayText ? `, ${depositRange.min}` : depositRange.min;
      } else {
        displayText += displayText ? `, ${depositRange.min}~${depositRange.max}` : `${depositRange.min}~${depositRange.max}`;
      }
    }
    
    return displayText || '금액';
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
      
      if (areaRange.min === '0') minText = '~5평';
      if (areaRange.max === '최대값') maxText = '200평~';
      
      const minM2 = convertPyeongToSquareMeters(minText);
      const maxM2 = convertPyeongToSquareMeters(maxText);
      
      if (areaRange.min === areaRange.max) {
        return `면적 <span style="margin-left: 0.5rem;">${minM2}</span>`;
      }
      return `면적 <span style="margin-left: 0.5rem;">${minM2}</span><span style="color: #dc2626; margin-left: 0.25rem;">~</span><span style="margin-left: 0.25rem;">${maxM2}</span>`;
    }
    return '면적';
  };

  // 외부 클릭 시 드롭다운 닫기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.filter-dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  return (
    <HeaderContainer>
      <MainSection>
        <LogoSection>
          <Logo>
            <span>PA</span>
          </Logo>
          <CompanyInfo>
            <CompanyName>피에이</CompanyName>
            <CompanyType>공인중개사사무소</CompanyType>
          </CompanyInfo>
        </LogoSection>

        <SearchSection>
          <SearchInput
            type="text"
            placeholder="매물번호, 제목 검색"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          
          <FilterButtonContainer className="filter-dropdown">
            <FilterButton
              isActive={filters.type !== ''}
              isOpen={openDropdown === 'type'}
              onClick={() => handleDropdownToggle('type')}
            >
              {getFilterDisplayText('type')}
            </FilterButton>
            <DropdownMenu isOpen={openDropdown === 'type'}>
              {filterOptions.type.map((option) => (
                <DropdownOption
                  key={option.value}
                  isSelected={filters.type === option.value}
                  onClick={() => handleOptionSelect('type', option.value)}
                >
                  {option.label}
                </DropdownOption>
              ))}
            </DropdownMenu>
          </FilterButtonContainer>

          <FilterButtonContainer className="filter-dropdown">
            <FilterButton
              isActive={filters.propertyType !== ''}
              isOpen={openDropdown === 'propertyType'}
              onClick={() => handleDropdownToggle('propertyType')}
            >
              {getFilterDisplayText('propertyType')}
            </FilterButton>
            <DropdownMenu isOpen={openDropdown === 'propertyType'}>
              {filterOptions.propertyType.map((option) => (
                <DropdownOption
                  key={option.value}
                  isSelected={filters.propertyType === option.value}
                  onClick={() => handleOptionSelect('propertyType', option.value)}
                >
                  {option.label}
                </DropdownOption>
              ))}
            </DropdownMenu>
          </FilterButtonContainer>

          <FilterButtonContainer className="filter-dropdown">
            <FilterButton
              isActive={areaRange.min !== '' || areaRange.max !== ''}
              isOpen={openDropdown === 'area'}
              onClick={() => handleDropdownToggle('area')}
            >
              {areaRange.min === '' && areaRange.max === '' ? '면적' : areaRange.min === areaRange.max ? areaRange.min : `${areaRange.min}~${areaRange.max}`}
            </FilterButton>
            <DropdownMenu isOpen={openDropdown === 'area'}>
              <PriceFilterContainer>
                <FilterTitle>
                  <FilterTitleText dangerouslySetInnerHTML={{ __html: getAreaTitleHTML() }} />
                  <ResetButton onClick={resetAreaFilter}>초기화</ResetButton>
                </FilterTitle>
                
                {areaOptions.map((row, rowIndex) => (
                  <PriceGrid key={rowIndex}>
                    {row.map((area) => (
                      <PriceButton
                        key={area}
                        isSelected={selectedAreas.includes(area)}
                        isActive={(() => {
                          if (areaRange.min === '0' && area === '~5평') return true;
                          if (areaRange.max === '최대값' && area === '200평~') return true;
                          return areaRange.min === area || areaRange.max === area;
                        })()}
                        isInRange={(() => {
                          if (areaRange.min === '' || areaRange.max === '') return false;
                          
                          const areaValue = parseInt(area.replace(/[평~]/g, ''));
                          let minValue = 0;
                          let maxValue = 999;
                          
                          // 최소값과 최대값 추출
                          if (areaRange.min !== '') {
                            if (areaRange.min === '0') {
                              minValue = 0;
                            } else {
                              minValue = parseInt(areaRange.min.replace(/[평~]/g, ''));
                            }
                          }
                          if (areaRange.max !== '') {
                            if (areaRange.max === '최대값') {
                              maxValue = 999;
                            } else {
                              maxValue = parseInt(areaRange.max.replace(/[평~]/g, ''));
                            }
                          }
                          
                          return areaValue > minValue && areaValue < maxValue && 
                                 !selectedAreas.includes(area) &&
                                 area !== areaRange.min && area !== areaRange.max;
                        })()}
                        onClick={() => handleAreaSelect(area)}
                      >
                        {area}
                      </PriceButton>
                    ))}
                  </PriceGrid>
                ))}

                <CustomRangeContainer>
                  <RangeInput
                    type="text"
                    placeholder="최소"
                    value={areaRange.min === '0' ? '' : areaRange.min === '200' ? '200' : areaRange.min}
                    onChange={(e) => setAreaRange({ ...areaRange, min: e.target.value })}
                  />
                  <RangeSeparator>~</RangeSeparator>
                  <RangeInput
                    type="text"
                    placeholder="최대"
                    value={areaRange.max === '최대값' ? '' : areaRange.max === '5' ? '5' : areaRange.max}
                    onChange={(e) => setAreaRange({ ...areaRange, max: e.target.value })}
                  />
                  <RangeSeparator>평</RangeSeparator>
                </CustomRangeContainer>
              </PriceFilterContainer>
            </DropdownMenu>
          </FilterButtonContainer>

          <FilterButtonContainer className="filter-dropdown">
            <FilterButton
              isActive={priceRange.min !== '' || priceRange.max !== '' || depositRange.min !== '' || depositRange.max !== ''}
              isOpen={openDropdown === 'price'}
              onClick={() => handleDropdownToggle('price')}
            >
              {getPriceDisplayText()}
            </FilterButton>
            <DropdownMenu isOpen={openDropdown === 'price'}>
              <PriceFilterContainer>
                <FilterTitle>
                  <FilterTitleText>매매가</FilterTitleText>
                  <ResetButton onClick={resetPriceFilter}>초기화</ResetButton>
                </FilterTitle>
                
                {priceOptions.map((row, rowIndex) => (
                  <PriceGrid key={rowIndex}>
                    {row.map((price) => (
                      <PriceButton
                        key={price}
                        isSelected={selectedPrices.includes(price)}
                        isActive={(() => {
                          if (priceRange.min === '최소값' && price === '~1억') return true;
                          if (priceRange.max === '최대값' && price === '500억~') return true;
                          return priceRange.min === price || priceRange.max === price;
                        })()}
                        isInRange={(() => {
                          if (priceRange.min === '' || priceRange.max === '') return false;
                          
                          // 가격 값에서 숫자만 추출 (예: "~1억" -> 1, "500억~" -> 500)
                          let priceValue = 0;
                          if (price === '~1억') {
                            priceValue = 1;
                          } else if (price === '500억~') {
                            priceValue = 500;
                          } else {
                            priceValue = parseInt(price.replace(/[억~]/g, ''));
                          }
                          
                          let minValue = 0;
                          let maxValue = 999;
                          
                          // 최소값과 최대값 추출
                          if (priceRange.min !== '') {
                            if (priceRange.min === '최소값') {
                              minValue = 0;
                            } else {
                              minValue = parseInt(priceRange.min.replace(/[억~]/g, ''));
                            }
                          }
                          if (priceRange.max !== '') {
                            if (priceRange.max === '최대값') {
                              maxValue = 999;
                            } else {
                              maxValue = parseInt(priceRange.max.replace(/[억~]/g, ''));
                            }
                          }
                          
                          // 선택된 범위 내에 있고, 선택되지 않은 경우
                          return priceValue > minValue && priceValue < maxValue && 
                                 !selectedPrices.includes(price) &&
                                 price !== priceRange.min && price !== priceRange.max;
                        })()}
                        onClick={() => handlePriceSelect(price)}
                      >
                        {price}
                      </PriceButton>
                    ))}
                  </PriceGrid>
                ))}

                <CustomRangeContainer>
                  <RangeInput
                    type="text"
                    placeholder="최소"
                    value={priceRange.min === '최소값' ? '' : priceRange.min === '1억' ? '1' : priceRange.min === '500억' ? '500' : priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  />
                  <RangeSeparator>~</RangeSeparator>
                  <RangeInput
                    type="text"
                    placeholder="최대"
                    value={priceRange.max === '최대값' ? '' : priceRange.max === '1억' ? '1' : priceRange.max === '500억' ? '500' : priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  />
                  <RangeSeparator>원</RangeSeparator>
                </CustomRangeContainer>
              </PriceFilterContainer>

              <DepositSection>
                <FilterTitle>
                  <FilterTitleText>보증금</FilterTitleText>
                  <ResetButton onClick={resetDepositFilter}>초기화</ResetButton>
                </FilterTitle>
                
                <DepositSlider>
                  {depositOptions.map((deposit) => (
                    <DepositButton
                      key={deposit}
                      isSelected={selectedDeposits.includes(deposit)}
                      isActive={depositRange.min === deposit || depositRange.max === deposit}
                      isInRange={(() => {
                        if (depositRange.min === '' || depositRange.max === '') return false;
                        
                        // 보증금 값에서 숫자만 추출 (예: "~100만" -> 100, "~1천만" -> 1000)
                        let depositValue = 0;
                        if (deposit.includes('천만')) {
                          depositValue = parseInt(deposit.replace(/[~천만]/g, '')) * 1000;
                        } else {
                          depositValue = parseInt(deposit.replace(/[~만]/g, ''));
                        }
                        
                        let minValue = 0;
                        let maxValue = 999;
                        
                        // 최소값과 최대값 추출
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
                        
                        // 선택된 범위 내에 있고, 선택되지 않은 경우
                        return depositValue > minValue && depositValue < maxValue && 
                               !selectedDeposits.includes(deposit) &&
                               deposit !== depositRange.min && deposit !== depositRange.max;
                      })()}
                      onClick={() => handleDepositSelect(deposit)}
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
                    onChange={(e) => setDepositRange({ ...depositRange, min: e.target.value })}
                  />
                  <RangeSeparator>~</RangeSeparator>
                  <RangeInput
                    type="text"
                    placeholder="최대"
                    value={depositRange.max}
                    onChange={(e) => setDepositRange({ ...depositRange, max: e.target.value })}
                  />
                  <RangeSeparator>원</RangeSeparator>
                </CustomRangeContainer>
              </DepositSection>
            </DropdownMenu>
          </FilterButtonContainer>

          <AddressInput
            type="text"
            placeholder="주소 검색"
            value={addressSearch}
            onChange={(e) => onAddressSearchChange?.(e.target.value)}
          />
        </SearchSection>

        <ButtonGroup>
          <Button variant="reset" onClick={() => window.location.reload()}>
            🔄 초기화
          </Button>
          {isAdmin && (
            <Button variant="upload" onClick={onAddProperty}>
              📤 대량 업로드
            </Button>
          )}
        </ButtonGroup>
      </MainSection>
    </HeaderContainer>
  );
};

export default Header; 