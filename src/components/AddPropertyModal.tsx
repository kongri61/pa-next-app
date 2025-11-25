import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { Property } from '../types';
import { uploadImage, validateFile } from '../firebase/storageService';

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
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1rem;
  width: 95%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  @media (max-width: 768px) {
    width: 98%;
    padding: 0.75rem;
    max-height: 90vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const UploadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FileUploadArea = styled.div<{ isDragOver: boolean; hasFile: boolean }>`
  border: 2px dashed ${props => props.isDragOver ? '#2563eb' : props.hasFile ? '#10b981' : '#d1d5db'};
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  background: ${props => props.isDragOver ? '#eff6ff' : props.hasFile ? '#f0fdf4' : '#f9fafb'};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
`;

const UploadIcon = styled.div`
  font-size: 2.5rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
`;

const UploadText = styled.p`
  font-size: 1rem;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const UploadSubtext = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const TemplateSection = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
`;

const TemplateTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
`;

const TemplateDescription = styled.p`
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0.75rem;
  line-height: 1.4;
`;

const CoordinateGuideSection = styled.div`
  background: #fef3c7;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #f59e0b;
`;

const CoordinateGuideTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.5rem 0;
`;

const CoordinateGuideText = styled.p`
  font-size: 0.75rem;
  color: #92400e;
  margin: 0.25rem 0;
  line-height: 1.4;
`;

const CoordinateExample = styled.div`
  font-size: 0.75rem;
  color: #92400e;
  background: #fef3c7;
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  font-family: monospace;
  font-size: 0.75rem;
  color: #1e40af;
`;

const TemplateButton = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 0.875rem;
`;

const ProgressSection = styled.div`
  background: #f0f9ff;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #bae6fd;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0f2fe;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ width: string }>`
  height: 100%;
  background: #0ea5e9;
  width: ${props => props.width};
  transition: width 0.3s ease;
`;

const ProgressText = styled.p`
  font-size: 0.875rem;
  color: #0369a1;
  margin: 0;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4b5563;
  }
`;

interface AddPropertyModalProps {
  onClose: () => void;
  onPropertyAdded?: (properties: Property[]) => void;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ onClose, onPropertyAdded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    // 논리적으로 정리된 헤더 순서
    const headers = [
<<<<<<< HEAD
      // 기본 정보
      '매물번호', '매물제목', '매물설명', '거래유형', '매물종류', '확인매물날짜',
      // 가격 정보
      '매매가(억원)', '보증금(만원)', '월세(만원)', '기보증금/월세', '융자금/권리금(만원)',
      // 위치 정보
      '주소', '매물현황', '위도', '경도',
      // 면적 정보
      '공급면적(m²)', '전용면적(m²)',
      // 구조 정보
      '방/화장실', '해당층/전체층', '주요구조부', '건축물용도',
      // 편의시설
      '주차', '주차대수', '엘리베이터',
      // 관리 정보
      '관리비(만원)', '관리비포함항목',
      // 기타 정보
      '현업종', '방향', '냉/난방', '인테리어', '입주가능일', '사용승인일', '추천업종',
      // 연락처 정보
      '연락처이름', '연락처전화번호', '연락처이메일', '연락처프로필사진URL'
    ];

    const sampleData = [
      [
        'P0001', '강남구 역삼동 상가', '1층 통유리 상가, 주차 가능, 교통편리', '매매', '상가', '25.07.19',
        '8.5', '0', '0', '', '',
        '서울시 강남구 역삼동 123-45', '매매', '37.5008', '127.0374',
        '82.65', '64.46',
        '3/2', '1/5층', '철근콘크리트조', '제2종 일반주거지역',
        'Y', '50', 'Y',
        '20', '공동청소, 공동전기',
        '공실', '동남쪽', '개별(전기)', '없음', '즉시입주', '1996-05-21', '분석보고서 참조',
        '피에이공인중개사사무소    대표 김동화', '010-7279-9894', 'kongri61@naver.com', '/contact-photo.jpg'
      ],
      [
        'P0002', '서초구 서초동 사무실', '전망 좋은 고층 사무실, 엘리베이터 완비, 주차 편리', '임대', '사무실', '25.07.20',
        '0', '1000', '50', '', '500',
        '서울시 서초구 서초동 456-78', '임대중', '37.4947', '127.0276',
        '99.17', '82.65',
        '4/3', '10/20층', '철근콘크리트조', '제1종 근린생활시설',
        'Y', '30', 'Y',
        '30', '공동청소, 경비',
        '사무실', '남향', '중앙냉난방', '기본인테리어', '협의', '2000-03-15', '사무실, 학원',
        '피에이공인중개사사무소    대표 김동화', '', 'kongri61@naver.com', '/contact-photo.jpg'
      ]
=======
      '매물번호', '매물제목', '매물설명', '거래유형', '매물종류',
      '매매가(억원)', '보증금(만원)', '월세(만원)', '주소', '위도', '경도',
      '공급/전용면적(평)', '공급/전용면적(㎡)', '방/화장실', '해당층/전체층',
      '주차', '엘리베이터', '확인매물날짜', '연락처이름', '연락처전화번호', '연락처전화번호2', '연락처이메일', '연락처프로필사진URL', '위치정보지도이미지URL'
    ];

    const sampleData = [
      ['P001', '강남구 역삼동 상가', '1층 상가 매매', '매매', '상가', '8.5', '0', '0', '서울시 강남구 역삼동 123-45', '37.5008', '127.0374', '19.5', '64.5', '3/2', '1/5층', 'Y', 'Y', '25.07.19', '김부동산', '02-1234-5678', '02-1234-5679', 'kim@realestate.com', 'https://example.com/profile.jpg', 'https://example.com/map.jpg'],
      ['P002', '서초구 서초동 사무실', '고층 사무실 임대', '임대', '사무실', '0', '1000', '50', '서울시 서초구 서초동 456-78', '37.4947', '127.0276', '25.0', '82.5', '4/3', '10/20층', 'Y', 'Y', '25.07.20', '이부동산', '02-2345-6789', '', 'lee@realestate.com', '', '']
>>>>>>> 9e7019311411a0ce2b425e6bb761dfb0f00d242a
    ];

    // 헤더와 샘플 데이터를 결합
    const data = [headers, ...sampleData];
    
    // 디버깅: 헤더 확인
    console.log('📋 엑셀 템플릿 헤더:', headers);
    console.log('📋 헤더 개수:', headers.length);
    console.log('📋 기보증금/월세 필드 위치:', headers.indexOf('기보증금/월세'));
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '매물정보');
    
    // 파일명에 타임스탬프 추가하여 캐시 방지
    const timestamp = new Date().getTime();
    XLSX.writeFile(wb, `매물등록템플릿_${timestamp}.xlsx`);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const data = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(selectedFile);
      });

      const workbook = XLSX.read(data, { type: 'array', cellText: true, cellDates: false });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 먼저 헤더 행을 읽어서 헤더 이름 확인
      const headerRow = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        range: 0, // 첫 번째 행만
        defval: ''
      })[0] as any[];
      
      // 헤더 이름으로 매핑하여 객체 배열로 변환 (인덱스 문제 완전히 해결)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: headerRow, // 헤더 이름을 키로 사용
        raw: true, // 원본 값을 유지
        defval: '', // 빈 셀은 빈 문자열로 처리
        blankrows: false
      }) as any[];
      
      // 디버깅: 엑셀 파일 읽기 결과 확인
      console.log('📄 엑셀 파일 읽기 결과 (헤더 기반 객체 배열):', {
        totalRows: jsonData.length,
        firstRow: jsonData[0],
        secondRow: jsonData[1],
        thirdRow: jsonData[2],
        headers: headerRow
      });

      if (jsonData.length < 1) {
        throw new Error('엑셀 파일에 데이터가 없습니다.');
      }

      const properties: Property[] = [];

      // 헤더 기반 객체 배열로 변환했으므로, 각 행을 객체로 접근
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        // 빈 행 건너뛰기 (모든 주요 필드가 비어있는 경우)
        const propertyId = row['매물번호']?.toString().trim() || '';
        if (!propertyId && !row['매물제목'] && !row['주소']) {
          console.log(`⏭️ 행 ${i + 1} 건너뛰기 (빈 행)`);
          continue;
        }
        
        // 디버깅: 각 행의 주차대수 데이터 확인
        const nextRow = i + 1 < jsonData.length ? jsonData[i + 1] as any : null;
        console.log(`📊 행 ${i + 1} 데이터:`, {
          propertyId: propertyId || 'N/A',
          parkingSpaces: row['주차대수'],
          nextRowPropertyId: nextRow ? (nextRow['매물번호'] || 'N/A') : 'N/A',
          nextRowParkingSpaces: nextRow ? nextRow['주차대수'] : 'N/A (다음 행 없음)'
        });

<<<<<<< HEAD
        // 기본 정보
        const finalPropertyId = propertyId || `P${String(i + 1).padStart(4, '0')}`;
        const title = row['매물제목']?.toString().trim() || '';
        const description = row['매물설명']?.toString().trim() || '';
        const type = row['거래유형'] === '임대' ? 'rent' : 'sale';
        const propertyTypeValue = row['매물종류']?.toString().trim() || '';
        const propertyType = propertyTypeValue === '토지' ? 'land' : 
                             propertyTypeValue === '건물' ? 'building' : 
                             propertyTypeValue === '상가' ? 'commercial' : 
                             propertyTypeValue === '사무실' ? 'office' : 
                             propertyTypeValue === '아파트' ? 'apartment' : 
                             propertyTypeValue === '오피스텔' ? 'officetel' : 
                             propertyTypeValue === '빌라' ? 'villa' : 
                             propertyTypeValue === '단독주택' ? 'house' : 
                             propertyTypeValue === '기타' ? 'other' : 'commercial';
        const confirmedDate = row['확인매물날짜']?.toString().trim() || undefined;
        
        // 가격 정보
        const price = parseFloat(row['매매가(억원)'] || 0) || 0;
        let deposit = row['보증금(만원)'] ? parseFloat(row['보증금(만원)']) : undefined;
        let rentPrice = row['월세(만원)'] ? parseFloat(row['월세(만원)']) : undefined;
        
        // 기보증금/월세 필드 파싱 (예: "2000만/200만", "2000/200", "2000만원/200만원" 등)
        const depositRentValue = row['기보증금/월세']?.toString().trim() || '';
        if (depositRentValue) {
          console.log('💰 기보증금/월세 필드 파싱:', depositRentValue);
          // "/" 구분자가 있는 경우
          if (depositRentValue.includes('/')) {
            const parts = depositRentValue.split('/');
            // 숫자만 추출 (예: "2000만" -> 2000, "200만" -> 200)
            const depositMatch = parts[0].trim().match(/\d+(?:\.\d+)?/);
            const rentMatch = parts[1]?.trim().match(/\d+(?:\.\d+)?/);
            if (depositMatch && depositMatch[0]) {
              deposit = parseFloat(depositMatch[0]);
              console.log('💰 보증금 파싱 결과:', deposit);
            }
            if (rentMatch && rentMatch[0]) {
              rentPrice = parseFloat(rentMatch[0]);
              console.log('💰 월세 파싱 결과:', rentPrice);
            }
          } else {
            // "/" 구분자가 없는 경우 숫자만 추출
            const numbers = depositRentValue.match(/\d+(?:\.\d+)?/g);
            if (numbers && numbers.length >= 2) {
              deposit = parseFloat(numbers[0]);
              rentPrice = parseFloat(numbers[1]);
              console.log('💰 보증금/월세 파싱 결과:', deposit, rentPrice);
            } else if (numbers && numbers.length === 1) {
              deposit = parseFloat(numbers[0]);
              console.log('💰 보증금 파싱 결과:', deposit);
            }
          }
        }
        
        const premium = row['융자금/권리금(만원)'] ? parseFloat(row['융자금/권리금(만원)']) : undefined;
        
        // 위치 정보
        const address = row['주소']?.toString().trim() || '';
        const propertyStatus = row['매물현황']?.toString().trim() || '';
        const lat = parseFloat(row['위도'] || 0) || 0;
        const lng = parseFloat(row['경도'] || 0) || 0;
        
        // 면적 정보 (m²로 직접 입력받음)
        const supplyAreaM2 = parseFloat(row['공급면적(m²)'] || 0) || 0;
        const supplyArea = supplyAreaM2 > 0 ? supplyAreaM2 : undefined;
        const areaM2 = parseFloat(row['전용면적(m²)'] || 0) || 0;
        const area = areaM2 > 0 ? areaM2 : 0;
        
        // 구조 정보 - 방/화장실: 다양한 형식 처리 (숫자, 텍스트, "/" 구분자 등)
        let bedrooms: number | undefined = undefined;
        let bathrooms: number | undefined = undefined;
        let roomBathInfo: string | undefined = undefined;
        const roomBathValue = row['방/화장실']?.toString().trim();
        if (roomBathValue) {
          // 숫자가 있는지 확인
          const hasNumbers = /\d+/.test(roomBathValue);
          
          if (hasNumbers) {
            // 숫자가 있는 경우: 숫자 추출 및 전체 텍스트를 roomBathInfo에 저장
            // "/" 구분자가 있는 경우 (예: "3/2", "3개/2개", "외부 남녀구분 2/1")
            if (roomBathValue.includes('/')) {
              const parts = roomBathValue.split('/');
              // 숫자만 추출 (예: "3개" -> 3)
              const bedMatch = parts[0].match(/\d+/);
              const bathMatch = parts[1]?.match(/\d+/);
              bedrooms = bedMatch ? parseInt(bedMatch[0]) : undefined;
              bathrooms = bathMatch ? parseInt(bathMatch[0]) : undefined;
            } else {
              // 숫자만 있는 경우 (예: "3" -> 방만, "2" -> 화장실만)
              // 또는 텍스트가 포함된 경우 숫자 추출
              const numbers = roomBathValue.match(/\d+/g);
              if (numbers && numbers.length >= 2) {
                // 두 개 이상의 숫자가 있으면 첫 번째는 방, 두 번째는 화장실
                bedrooms = parseInt(numbers[0]);
                bathrooms = parseInt(numbers[1]);
              } else if (numbers && numbers.length === 1) {
                // 숫자가 하나만 있으면 방으로 처리 (화장실은 undefined)
                bedrooms = parseInt(numbers[0]);
              }
            }
            // 숫자가 있어도 전체 텍스트를 roomBathInfo에 저장 (텍스트+숫자+텍스트 모두 포함)
            // 예: "외부 남녀구분 2/1", "외부 남녀구분 2/1 내부" 등
            roomBathInfo = roomBathValue;
          } else {
            // 숫자가 없고 텍스트만 있는 경우 (예: "외부 남녀구분")
            roomBathInfo = roomBathValue;
          }
        }
        const floor = row['해당층/전체층']?.toString().trim() || undefined;
        const mainStructure = row['주요구조부']?.toString().trim() || undefined;
        const buildingUse = row['건축물용도']?.toString().trim() || undefined;
        
        // 편의시설 - 헤더 이름으로 직접 접근 (인덱스 문제 완전히 해결)
        const parkingValue = row['주차']?.toString().trim() || '';
        const parking = parkingValue === 'Y' || parkingValue === 'y' || parkingValue === '예' || parkingValue === '가능';
        
        // 주차대수: 헤더 이름으로 직접 접근 (인덱스 문제 완전히 해결)
        let parkingSpaces: number | string | undefined = undefined;
        const parkingSpacesRaw = row['주차대수'];
        
        if (parkingSpacesRaw !== undefined && parkingSpacesRaw !== null && parkingSpacesRaw !== '') {
          // 주차대수는 항상 문자열로 저장 (숫자만 있어도 문자열로 저장하여 일관성 유지)
          // 예: "4", "22", "4(옥외),22(옥내)", "4(옥외)/22(옥내)" 모두 문자열로 저장
          parkingSpaces = String(parkingSpacesRaw).trim();
          if (parkingSpaces === '') {
            parkingSpaces = undefined;
          }
        }
        
        // 디버깅: 각 행의 주차대수 읽기 정보 출력
        console.log(`🔍 매물 ${i + 1} 주차대수 최종 결과:`, {
          propertyId: finalPropertyId,
          parkingSpacesRaw: parkingSpacesRaw,
          parkingSpacesFinal: parkingSpaces,
          nextRowParkingSpaces: nextRow ? nextRow['주차대수'] : 'N/A (다음 행 없음)'
        });
        
        const elevatorValue = row['엘리베이터']?.toString().trim() || '';
        const elevator = elevatorValue === 'Y' || elevatorValue === 'y' || elevatorValue === '예' || elevatorValue === '있음';
        
        // 관리 정보
        const maintenanceFee = row['관리비(만원)'] ? parseFloat(row['관리비(만원)']) : undefined;
        const maintenanceFeeItems = row['관리비포함항목']?.toString().trim() || undefined;
        
        // 기타 정보
        const currentBusinessType = row['현업종']?.toString().trim() || undefined;
        const direction = row['방향']?.toString().trim() || undefined;
        const coolingHeating = row['냉/난방']?.toString().trim() || undefined;
        const interior = row['인테리어']?.toString().trim() || undefined;
        const moveInDate = row['입주가능일']?.toString().trim() || undefined;
        // 사용승인일: 날짜 형식으로 변환 (YYYY-MM-DD 또는 숫자 형식 처리)
        let approvalDate = row['사용승인일'];
        if (approvalDate) {
          // 숫자 형식인 경우 날짜로 변환 시도
          if (typeof approvalDate === 'number') {
            // Excel 날짜 숫자를 날짜로 변환 (1900-01-01 기준)
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + approvalDate * 86400000);
            // 타임존 문제 방지를 위해 로컬 날짜를 직접 포맷팅
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            approvalDate = `${year}-${month}-${day}`;
          } else if (typeof approvalDate === 'string') {
            // 문자열인 경우 날짜 형식 확인
            // YYYY-MM-DD 형식이 아니면 변환 시도
            if (!/^\d{4}-\d{2}-\d{2}$/.test(approvalDate)) {
              // 다른 형식의 날짜 문자열 처리 (예: 1996-05-21, 19960521 등)
              const dateMatch = approvalDate.match(/(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
              if (dateMatch) {
                approvalDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
              }
            }
          }
        }
        const recommendedBusinessType = row['추천업종']?.toString().trim() || undefined;
        
        // 연락처 정보
        const contactName = row['연락처이름']?.toString().trim() || '피에이공인중개사사무소    대표 김동화';
        // 전화번호: 엑셀에서 입력한 번호 처리
        // - 엑셀에 번호가 있고 고정 번호(032-424-0111)와 다르면: 고정 번호와 함께 저장
        // - 엑셀에 번호가 없거나 고정 번호와 같으면: 고정 번호만 저장
        const excelPhone = row['연락처전화번호']?.toString().trim() || '';
        const fixedPhone = '032-424-0111';
        let contactPhone: string;
        if (!excelPhone) {
          // 엑셀이 비어있으면 고정 번호만 저장
          contactPhone = fixedPhone;
        } else if (excelPhone === fixedPhone) {
          // 엑셀에 고정 번호가 입력되어 있으면 고정 번호만 저장 (중복 방지)
          contactPhone = fixedPhone;
        } else {
          // 엑셀에 다른 번호가 입력되어 있으면 고정 번호와 함께 저장
          contactPhone = `${fixedPhone}, ${excelPhone}`;
        }
        const contactEmail = row['연락처이메일']?.toString().trim() || 'kongri61@naver.com';
        const contactPhoto = row['연락처프로필사진URL']?.toString().trim() || '/contact-photo.jpg';
=======
        const propertyId = row[0] || `P${String(i + 1).padStart(3, '0')}`;
        const title = row[1] || '';
        const description = row[2] || '';
        const type = row[3] === '임대' ? 'rent' : 'sale';
        const propertyType = row[4] === '사무실' ? 'office' : row[4] === '건물' ? 'building' : 'commercial';
        const price = parseFloat(row[5]) || 0;
        const deposit = parseFloat(row[6]) || undefined;
        const rentPrice = parseFloat(row[7]) || undefined;
        const address = row[8] || '';
        const lat = parseFloat(row[9]) || 0;
        const lng = parseFloat(row[10]) || 0;
        const area = parseFloat(row[12]) || 0;
        const bedrooms = row[13] ? row[13].toString().split('/')[0] : undefined;
        const bathrooms = row[13] ? row[13].toString().split('/')[1] : undefined;
        const floor = row[14] || undefined;
        const parking = row[15] === 'Y' || row[15] === 'y' || row[15] === '예';
        const elevator = row[16] === 'Y' || row[16] === 'y' || row[16] === '예';
        const confirmedDate = row[17] || undefined;
        const contactName = row[18] || '중개소';
        const contactPhone = row[19] || '02-0000-0000';
        const contactPhone2 = row[20] || undefined;
        const contactEmail = row[21] || 'contact@realestate.com';
        const contactPhoto = row[22] || undefined;
        const mapImage = row[23] || undefined;
        
        // 추가 필드들 (Excel 컬럼 확장 가능)
        const maintenanceIncluded = row[24] || undefined;
        const propertyStatus = row[25] || undefined;
        const parkingCount = row[26] ? parseInt(row[26]) : undefined;
        const recommendedBusiness = row[27] || undefined;
        const contactCompanyName = row[28] || undefined;
        // 매매용 필드들
        const loanAmount = row[29] ? parseFloat(row[29]) : undefined;
        const keyDepositMonthly = row[30] ? parseFloat(row[30]) : undefined;
        // 임대용 필드들
        const keyMoney = row[31] ? parseFloat(row[31]) : undefined;

        // 전화번호 배열 생성 (phone, phone2 모두 포함)
        const phones: string[] = [];
        if (contactPhone) phones.push(contactPhone);
        if (contactPhone2) phones.push(contactPhone2);
>>>>>>> 9e7019311411a0ce2b425e6bb761dfb0f00d242a

        const property: Property = {
          id: finalPropertyId,
          title,
          description,
          price,
          deposit,
          rentPrice,
          type,
          propertyType,
          address,
          location: { lat, lng },
          bedrooms: bedrooms, // 이미 number | undefined 타입으로 파싱됨
          bathrooms: bathrooms, // 이미 number | undefined 타입으로 파싱됨
          roomBathInfo: roomBathInfo, // 텍스트 정보 (예: "외부 남녀구분")
          area,
          supplyArea,
          images: [],
          contact: {
            name: contactName,
            companyName: contactCompanyName || undefined,
            phone: contactPhone,
<<<<<<< HEAD
            email: contactEmail,
            photo: contactPhoto // 엑셀에서 읽은 프로필 사진 URL 또는 기본값
=======
            phone2: contactPhone2 || undefined,
            phones: phones.length > 0 ? phones : undefined,
            email: contactEmail,
            photo: contactPhoto || undefined
>>>>>>> 9e7019311411a0ce2b425e6bb761dfb0f00d242a
          },
          features: [],
          createdAt: new Date(),
          isActive: true,
          confirmedDate,
          floor,
          parking,
          elevator,
<<<<<<< HEAD
          maintenanceFee,
          premium,
          buildingUse,
          coolingHeating,
          approvalDate,
          maintenanceFeeItems,
          mainStructure,
          currentBusinessType,
          direction,
          interior,
          parkingSpaces,
          moveInDate,
          recommendedBusinessType,
          propertyStatus: propertyStatus || undefined // 엑셀에서 읽은 매물현황 저장
=======
          mapImage: mapImage || undefined,
          // 추가 필드들
          maintenanceIncluded: maintenanceIncluded || undefined,
          propertyStatus: propertyStatus || undefined,
          parkingCount: parkingCount || undefined,
          recommendedBusiness: recommendedBusiness || undefined,
          // 매매용 필드들
          loanAmount: loanAmount || undefined,
          keyDepositMonthly: keyDepositMonthly || undefined,
          // 임대용 필드들
          keyMoney: keyMoney || undefined
>>>>>>> 9e7019311411a0ce2b425e6bb761dfb0f00d242a
        };

        properties.push(property);
        setUploadProgress((i + 1) / jsonData.length * 100);
      }

      if (onPropertyAdded) {
        onPropertyAdded(properties);
      }

      alert(`✅ ${properties.length}개의 매물이 성공적으로 등록되었습니다!`);
      onClose();
    } catch (error) {
      console.error('업로드 실패:', error);
      setError(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>매물 등록</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <UploadSection>
          <TemplateSection>
            <TemplateTitle>📋 엑셀 템플릿 다운로드</TemplateTitle>
            <TemplateDescription>
              매물 정보를 입력할 수 있는 엑셀 템플릿을 다운로드하세요.
              템플릿에 맞춰 데이터를 입력한 후 업로드하시면 됩니다.
              <br /><br />
              <strong>💡 전화번호 입력 안내:</strong>
              <br />
              • 연락처전화번호 컬럼에 매물별 번호만 입력하세요 (예: 010-7279-9894)
              <br />
              • 고정 번호(032-424-0111)는 자동으로 추가되어 저장됩니다.
              <br />
              • 비워두면 고정 번호만 저장됩니다.
            </TemplateDescription>
            
            <TemplateButton onClick={downloadTemplate}>
              📥 엑셀 템플릿 다운로드
            </TemplateButton>
          </TemplateSection>

          <FileUploadArea
            isDragOver={isDragOver}
            hasFile={!!selectedFile}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <UploadIcon>📁</UploadIcon>
            <UploadText>
              {selectedFile ? `선택된 파일: ${selectedFile.name}` : '엑셀 파일을 드래그하거나 클릭하여 업로드하세요'}
            </UploadText>
            <UploadSubtext>
              지원 형식: .xlsx, .xls | 최대 크기: 10MB
            </UploadSubtext>
          </FileUploadArea>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {isUploading && (
            <ProgressSection>
              <ProgressBar>
                <ProgressFill width={`${uploadProgress}%`} />
              </ProgressBar>
              <ProgressText>업로드 중... {uploadProgress}%</ProgressText>
            </ProgressSection>
          )}

          <ButtonGroup>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? '업로드 중...' : '매물 등록'}
            </Button>
            <CancelButton onClick={onClose}>
              취소
            </CancelButton>
          </ButtonGroup>
        </UploadSection>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedFile(file);
            }
          }}
          style={{ display: 'none' }}
        />
      </ModalContent>
    </ModalOverlay>
  );
};

export default AddPropertyModal;

