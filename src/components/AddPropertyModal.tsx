import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { Property } from '../types';

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
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
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
  gap: 1.5rem;
`;

const FileUploadArea = styled.div<{ isDragOver: boolean; hasFile: boolean }>`
  border: 2px dashed ${props => props.isDragOver ? '#2563eb' : props.hasFile ? '#10b981' : '#d1d5db'};
  border-radius: 8px;
  padding: 2rem;
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
  font-size: 3rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const UploadText = styled.p`
  font-size: 1rem;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const UploadSubtext = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 6px;
  margin-top: 1rem;
`;

const FileIcon = styled.span`
  font-size: 1.5rem;
  color: #10b981;
`;

const FileName = styled.span`
  font-size: 0.875rem;
  color: #065f46;
  font-weight: 500;
`;

const FileSize = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const TemplateSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
  margin-bottom: 1rem;
`;

const TemplateTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const TemplateDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const TemplateButton = styled.button`
  background: #10b981;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);

  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  background: #2563eb;
  color: white;
  padding: 1rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
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
  padding: 1rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #4b5563;
  }
`;

const ProgressSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 6px;
  display: none;

  &.visible {
    display: block;
  }
`;

const ProgressText = styled.p`
  font-size: 0.875rem;
  color: #065f46;
  margin: 0;
`;

const AddressSearchSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
  margin-bottom: 1rem;
`;

const AddressSearchTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const AddressSearchDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const AddressSearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const AddressSearchButton = styled.button`
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const CoordinateResult = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #065f46;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 주소검색 관련 상태
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number } | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
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
    console.log('=== 엑셀 템플릿 다운로드 시작 ===');
    
    // 템플릿 헤더 정의
    const headers = [
      '매물번호',
      '매물제목', 
      '매물설명',
      '거래유형',
      '매물종류',
      '매매가',
      '보증금',
      '주소',
      '위도',
      '경도',
      '공급/전용면적',
      '방/화장실',
      '해당층/전체층',
      '주차',
      '엘리베이터',
      '확인매물날짜',
      '연락처이름',
      '연락처전화번호',
      '연락처이메일'
    ];
    
    // 샘플 데이터
    const sampleData = [
      [
        '001',
        '강남구 역삼동 상가',
        '강남구 역삼동에 위치한 상가입니다. 역세권으로 교통이 편리합니다.',
        '매매',
        '상가',
        '850000000',
        '0',
        '서울시 강남구 역삼동 123-45',
        '37.5013',
        '127.0396',
        '84.5',
        '3/2',
        '3/15층',
        '가능',
        '있음',
        '25.07.19',
        '김부동산',
        '02-1234-5678',
        'kim@realestate.com'
      ],
      [
        '002',
        '홍대입구 근처 사무실',
        '홍대입구역 도보 5분 거리의 사무실입니다.',
        '임대',
        '사무실',
        '500000',
        '10000000',
        '서울시 마포구 서교동 456-78',
        '37.5572',
        '126.9254',
        '25.3',
        '1/1',
        '2/5층',
        '불가능',
        '있음',
        '25.07.18',
        '박부동산',
        '02-9876-5432',
        'park@realestate.com'
      ]
    ];
    
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    
    // 열 너비 조정
    const colWidths = headers.map(() => ({ wch: 15 }));
    worksheet['!cols'] = colWidths;
    
    // 시트 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, '매물등록템플릿');
    
    // 엑셀 파일 생성 및 다운로드
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blobData);
    const link = document.createElement('a');
    link.href = url;
    link.download = '매물_등록_템플릿.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('엑셀 템플릿 다운로드 완료');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 엑셀 파일 읽기
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const excelData = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(excelData, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          console.log('엑셀 데이터:', jsonData);

          // 헤더 제거하고 데이터만 추출
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];

          console.log('헤더:', headers);
          console.log('데이터 행 수:', rows.length);

          // 매물번호 필드 확인
          const propertyNumberIndex = headers.findIndex(header => 
            header?.toLowerCase().includes('매물번호') || 
            header?.toLowerCase().includes('번호')
          );
          
          console.log('매물번호 필드 인덱스:', propertyNumberIndex);
          console.log('매물번호 필드명:', headers[propertyNumberIndex]);

          // 주소를 좌표로 변환하는 함수
          const convertAddressToCoordinates = async (address: string) => {
            try {
              console.log(`주소 변환 시작: "${address}"`);
              
              // Google Geocoding API 호출 (실제 구현 시)
              // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyCgPbhfAQ9gZbn4SVZIJoiLeHeIZek3-Pk`);
              // const data = await response.json();
              // return data.results[0].geometry.location;

              // 시뮬레이션 (실제 구현에서는 위의 API 사용)
              const mockResults = {
                '서울시 강남구': { lat: 37.5665, lng: 126.9780 },
                '서울시 마포구': { lat: 37.5575, lng: 126.9250 },
                '서울시 서초구': { lat: 37.4837, lng: 127.0324 },
                '서울시 송파구': { lat: 37.5145, lng: 127.1059 },
                '서울시 강서구': { lat: 37.5509, lng: 126.8495 },
                '서울시 영등포구': { lat: 37.5264, lng: 126.8962 },
                '서울시 용산구': { lat: 37.5384, lng: 126.9654 },
                '서울시 성동구': { lat: 37.5506, lng: 127.0409 },
                '서울시 광진구': { lat: 37.5384, lng: 127.0822 },
                '서울시 동대문구': { lat: 37.5744, lng: 127.0395 },
                '서울시 중랑구': { lat: 37.6064, lng: 127.0926 },
                '서울시 성북구': { lat: 37.5894, lng: 127.0167 },
                '서울시 강북구': { lat: 37.6396, lng: 127.0257 },
                '서울시 도봉구': { lat: 37.6688, lng: 127.0471 },
                '서울시 노원구': { lat: 37.6542, lng: 127.0568 },
                '서울시 은평구': { lat: 37.6026, lng: 126.9291 },
                '서울시 서대문구': { lat: 37.5791, lng: 126.9368 },
                '서울시 양천구': { lat: 37.5169, lng: 126.8665 },
                '서울시 강동구': { lat: 37.5301, lng: 127.1238 },
                '인천시 중구': { lat: 37.4639, lng: 126.6486 },
                '인천시 동구': { lat: 37.4739, lng: 126.6439 },
                '인천시 미추홀구': { lat: 37.4639, lng: 126.6486 },
                '인천시 연수구': { lat: 37.4106, lng: 126.6788 },
                '인천시 남동구': { lat: 37.4471, lng: 126.7310 },
                '인천시 부평구': { lat: 37.5074, lng: 126.7219 },
                '인천시 계양구': { lat: 37.5372, lng: 126.7370 },
                '인천시 서구': { lat: 37.4517, lng: 126.6768 },
                '인천시 강화군': { lat: 37.7464, lng: 126.4880 },
                '인천시 옹진군': { lat: 37.4464, lng: 126.6370 },
                // 추가 매칭을 위한 별칭들
                '강남구': { lat: 37.5665, lng: 126.9780 },
                '마포구': { lat: 37.5575, lng: 126.9250 },
                '서초구': { lat: 37.4837, lng: 127.0324 },
                '송파구': { lat: 37.5145, lng: 127.1059 },
                '강서구': { lat: 37.5509, lng: 126.8495 },
                '영등포구': { lat: 37.5264, lng: 126.8962 },
                '용산구': { lat: 37.5384, lng: 126.9654 },
                '성동구': { lat: 37.5506, lng: 127.0409 },
                '광진구': { lat: 37.5384, lng: 127.0822 },
                '동대문구': { lat: 37.5744, lng: 127.0395 },
                '중랑구': { lat: 37.6064, lng: 127.0926 },
                '성북구': { lat: 37.5894, lng: 127.0167 },
                '강북구': { lat: 37.6396, lng: 127.0257 },
                '도봉구': { lat: 37.6688, lng: 127.0471 },
                '노원구': { lat: 37.6542, lng: 127.0568 },
                '은평구': { lat: 37.6026, lng: 126.9291 },
                '서대문구': { lat: 37.5791, lng: 126.9368 },
                '양천구': { lat: 37.5169, lng: 126.8665 },
                '강동구': { lat: 37.5301, lng: 127.1238 },
                '연수구': { lat: 37.4106, lng: 126.6788 },
                '남동구': { lat: 37.4471, lng: 126.7310 },
                '부평구': { lat: 37.5074, lng: 126.7219 },
                '계양구': { lat: 37.5372, lng: 126.7370 },
                '서구': { lat: 37.4517, lng: 126.6768 },
                '강화군': { lat: 37.7464, lng: 126.4880 },
                '옹진군': { lat: 37.4464, lng: 126.6370 },
                // 더 구체적인 주소들
                '역삼동': { lat: 37.5665, lng: 126.9780 },
                '홍대': { lat: 37.5575, lng: 126.9250 },
                '송도': { lat: 37.4106, lng: 126.6788 },
                '부평': { lat: 37.5074, lng: 126.7219 }
              };

              // 정확한 매칭 시도
              if (mockResults[address as keyof typeof mockResults]) {
                console.log(`정확한 매칭 성공: "${address}"`);
                return mockResults[address as keyof typeof mockResults];
              }

              // 부분 매칭 시도
              for (const [key, value] of Object.entries(mockResults)) {
                if (address.includes(key) || key.includes(address)) {
                  console.log(`부분 매칭 성공: "${address}" -> "${key}"`);
                  return value;
                }
              }

              // 대소문자 무시 매칭 시도
              const lowerAddress = address.toLowerCase();
              for (const [key, value] of Object.entries(mockResults)) {
                const lowerKey = key.toLowerCase();
                if (lowerAddress.includes(lowerKey) || lowerKey.includes(lowerAddress)) {
                  console.log(`대소문자 무시 매칭 성공: "${address}" -> "${key}"`);
                  return value;
                }
              }

              console.log(`매칭 실패: "${address}"`);
              return null;
            } catch (error) {
              console.error('좌표 변환 오류:', error);
              return null;
            }
          };

          // 각 행의 주소를 좌표로 변환
          const processedData = [];
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            try {
              // 기본값 설정
              const id = row[propertyNumberIndex]?.toString() || `auto_${Date.now()}_${i}`;
              const title = row[headers.findIndex(header => header?.toLowerCase().includes('매물제목'))]?.toString() || '제목 없음';
              const description = row[headers.findIndex(header => header?.toLowerCase().includes('매물설명'))]?.toString() || '설명 없음';
              const type = row[headers.findIndex(header => header?.toLowerCase().includes('거래유형'))]?.toString()?.toLowerCase().includes('임대') ? 'rent' : 'sale';
              const propertyType = getPropertyType(row[headers.findIndex(header => header?.toLowerCase().includes('매물종류'))]?.toString());
              const price = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('매매가'))]?.toString() || '0');
              const deposit = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('보증금'))]?.toString() || '0');
              const address = row[headers.findIndex(header => header?.toLowerCase().includes('주소'))]?.toString() || '주소 없음';
              const lat = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('위도'))]?.toString() || '37.5665');
              const lng = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('경도'))]?.toString() || '126.9780');
              const area = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('공급/전용면적'))]?.toString() || '0');
              const bedrooms = parseBedrooms(row[headers.findIndex(header => header?.toLowerCase().includes('방/화장실'))]?.toString());
              const bathrooms = parseBathrooms(row[headers.findIndex(header => header?.toLowerCase().includes('방/화장실'))]?.toString());
              const floor = row[headers.findIndex(header => header?.toLowerCase().includes('해당층/전체층'))]?.toString() || '';
              const parking = parseBoolean(row[headers.findIndex(header => header?.toLowerCase().includes('주차'))]?.toString());
              const elevator = parseBoolean(row[headers.findIndex(header => header?.toLowerCase().includes('엘리베이터'))]?.toString());
              const confirmedDate = row[headers.findIndex(header => header?.toLowerCase().includes('확인매물날짜'))]?.toString() || '';
              const contactName = row[headers.findIndex(header => header?.toLowerCase().includes('연락처이름'))]?.toString() || '중개소';
              const contactPhone = row[headers.findIndex(header => header?.toLowerCase().includes('연락처전화번호'))]?.toString() || '02-0000-0000';
              const contactEmail = row[headers.findIndex(header => header?.toLowerCase().includes('연락처이메일'))]?.toString() || 'contact@realestate.com';
              
              const property: Property = {
                id,
                title,
                description,
                price,
                deposit: deposit > 0 ? deposit : undefined,
                type,
                propertyType,
                address,
                location: { lat, lng },
                bedrooms,
                bathrooms,
                area,
                images: ['https://via.placeholder.com/300x200'],
                contact: {
                  name: contactName,
                  phone: contactPhone,
                  email: contactEmail
                },
                features: [],
                createdAt: new Date(),
                isActive: true,
                confirmedDate: confirmedDate || undefined,
                floor: floor || undefined,
                parking,
                elevator
              };
              
              console.log(`매물 ${i} 생성:`, property);
              processedData.push(property);
              
            } catch (error) {
              console.error(`행 ${i} 처리 중 오류:`, error);
            }
          }
          
          console.log('변환된 매물 개수:', processedData.length);
          
          if (processedData.length > 0) {
            // 부모 컴포넌트에 매물 추가 알림
            if (onPropertyAdded) {
              onPropertyAdded(processedData);
            }
            
            alert(`총 ${processedData.length}개의 매물이 지도에 등록되었습니다.`);
            onClose(); // 모달 닫기
          } else {
            alert('처리할 수 있는 매물 데이터가 없습니다.');
          }
          
        } catch (error) {
          console.error('엑셀 처리 오류:', error);
          alert('엑셀 파일 처리 중 오류가 발생했습니다.');
        } finally {
          setIsUploading(false);
          setUploadProgress(100);
        }
      };

      reader.readAsArrayBuffer(selectedFile);

    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 주소검색으로 좌표변환 함수
  const searchAddress = async () => {
    if (!addressSearch.trim()) {
      alert('주소를 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      // Google Geocoding API 사용 (실제 구현 시 API 키 필요)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressSearch)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('주소 검색에 실패했습니다.');
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setSearchResult({
          lat: location.lat,
          lng: location.lng
        });
      } else {
        alert('해당 주소를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      
      // API 키가 없는 경우를 위한 시뮬레이션
      // 실제 구현에서는 Google Geocoding API를 사용해야 합니다
      const mockResults = {
        '서울시 강남구': { lat: 37.5665, lng: 126.9780 },
        '서울시 마포구': { lat: 37.5575, lng: 126.9250 },
        '서울시 서초구': { lat: 37.4837, lng: 127.0324 },
        '서울시 송파구': { lat: 37.5145, lng: 127.1059 },
        '서울시 강서구': { lat: 37.5509, lng: 126.8495 },
        '서울시 영등포구': { lat: 37.5264, lng: 126.8962 },
        '서울시 용산구': { lat: 37.5384, lng: 126.9654 },
        '서울시 성동구': { lat: 37.5506, lng: 127.0409 },
        '서울시 광진구': { lat: 37.5384, lng: 127.0822 },
        '서울시 동대문구': { lat: 37.5744, lng: 127.0395 },
        '서울시 중랑구': { lat: 37.6064, lng: 127.0926 },
        '서울시 성북구': { lat: 37.5894, lng: 127.0167 },
        '서울시 강북구': { lat: 37.6396, lng: 127.0257 },
        '서울시 도봉구': { lat: 37.6688, lng: 127.0471 },
        '서울시 노원구': { lat: 37.6542, lng: 127.0568 },
        '서울시 은평구': { lat: 37.6026, lng: 126.9291 },
        '서울시 서대문구': { lat: 37.5791, lng: 126.9368 },
        '서울시 양천구': { lat: 37.5169, lng: 126.8665 },
        '서울시 강동구': { lat: 37.5301, lng: 127.1238 },
        '인천시 중구': { lat: 37.4639, lng: 126.6486 },
        '인천시 동구': { lat: 37.4739, lng: 126.6439 },
        '인천시 미추홀구': { lat: 37.4639, lng: 126.6486 },
        '인천시 연수구': { lat: 37.4106, lng: 126.6788 },
        '인천시 남동구': { lat: 37.4471, lng: 126.7310 },
        '인천시 부평구': { lat: 37.5074, lng: 126.7219 },
        '인천시 계양구': { lat: 37.5372, lng: 126.7370 },
        '인천시 서구': { lat: 37.4517, lng: 126.6768 },
        '인천시 강화군': { lat: 37.7464, lng: 126.4880 },
        '인천시 옹진군': { lat: 37.4464, lng: 126.6370 },
        // 추가 매칭을 위한 별칭들
        '강남구': { lat: 37.5665, lng: 126.9780 },
        '마포구': { lat: 37.5575, lng: 126.9250 },
        '서초구': { lat: 37.4837, lng: 127.0324 },
        '송파구': { lat: 37.5145, lng: 127.1059 },
        '강서구': { lat: 37.5509, lng: 126.8495 },
        '영등포구': { lat: 37.5264, lng: 126.8962 },
        '용산구': { lat: 37.5384, lng: 126.9654 },
        '성동구': { lat: 37.5506, lng: 127.0409 },
        '광진구': { lat: 37.5384, lng: 127.0822 },
        '동대문구': { lat: 37.5744, lng: 127.0395 },
        '중랑구': { lat: 37.6064, lng: 127.0926 },
        '성북구': { lat: 37.5894, lng: 127.0167 },
        '강북구': { lat: 37.6396, lng: 127.0257 },
        '도봉구': { lat: 37.6688, lng: 127.0471 },
        '노원구': { lat: 37.6542, lng: 127.0568 },
        '은평구': { lat: 37.6026, lng: 126.9291 },
        '서대문구': { lat: 37.5791, lng: 126.9368 },
        '양천구': { lat: 37.5169, lng: 126.8665 },
        '강동구': { lat: 37.5301, lng: 127.1238 },
        '연수구': { lat: 37.4106, lng: 126.6788 },
        '남동구': { lat: 37.4471, lng: 126.7310 },
        '부평구': { lat: 37.5074, lng: 126.7219 },
        '계양구': { lat: 37.5372, lng: 126.7370 },
        '서구': { lat: 37.4517, lng: 126.6768 },
        '강화군': { lat: 37.7464, lng: 126.4880 },
        '옹진군': { lat: 37.4464, lng: 126.6370 },
        // 더 구체적인 주소들
        '역삼동': { lat: 37.5665, lng: 126.9780 },
        '홍대': { lat: 37.5575, lng: 126.9250 },
        '송도': { lat: 37.4106, lng: 126.6788 },
        '부평': { lat: 37.5074, lng: 126.7219 }
      };

      console.log(`주소 검색 시도: "${addressSearch}"`);

      // 정확한 매칭 시도
      if (mockResults[addressSearch as keyof typeof mockResults]) {
        console.log(`정확한 매칭 성공: "${addressSearch}"`);
        setSearchResult(mockResults[addressSearch as keyof typeof mockResults]);
        alert('시뮬레이션 결과입니다. 실제 구현에서는 Google Geocoding API를 사용합니다.');
        return;
      }

      // 부분 매칭 시도
      for (const [key, value] of Object.entries(mockResults)) {
        if (addressSearch.includes(key) || key.includes(addressSearch)) {
          console.log(`부분 매칭 성공: "${addressSearch}" -> "${key}"`);
          setSearchResult(value);
          alert('시뮬레이션 결과입니다. 실제 구현에서는 Google Geocoding API를 사용합니다.');
          return;
        }
      }

      // 대소문자 무시 매칭 시도
      const lowerAddress = addressSearch.toLowerCase();
      for (const [key, value] of Object.entries(mockResults)) {
        const lowerKey = key.toLowerCase();
        if (lowerAddress.includes(lowerKey) || lowerKey.includes(lowerAddress)) {
          console.log(`대소문자 무시 매칭 성공: "${addressSearch}" -> "${key}"`);
          setSearchResult(value);
          alert('시뮬레이션 결과입니다. 실제 구현에서는 Google Geocoding API를 사용합니다.');
          return;
        }
      }

      console.log(`매칭 실패: "${addressSearch}"`);
      alert('해당 주소를 찾을 수 없습니다. (시뮬레이션 모드)');
    } finally {
      setIsSearching(false);
    }
  };

  const copyCoordinates = () => {
    if (searchResult) {
      const coordinates = `${searchResult.lat}, ${searchResult.lng}`;
      navigator.clipboard.writeText(coordinates).then(() => {
        alert('좌표가 클립보드에 복사되었습니다!');
      }).catch(() => {
        // 클립보드 API가 지원되지 않는 경우
        const textArea = document.createElement('textarea');
        textArea.value = coordinates;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('좌표가 클립보드에 복사되었습니다!');
      });
    }
  };

  // 엑셀 데이터를 Property 객체로 변환하는 함수
  const convertExcelDataToProperties = (excelData: any[][]): Property[] => {
    console.log('=== 엑셀 데이터 변환 시작 ===');
    console.log('엑셀 데이터:', excelData);
    
    if (!excelData || excelData.length < 2) {
      console.log('엑셀 데이터가 없거나 헤더만 있음');
      return [];
    }
    
    const properties: Property[] = [];
    const headers = excelData[0];
    console.log('헤더:', headers);
    
    // 헤더 인덱스 찾기
    const getColumnIndex = (columnName: string): number => {
      return headers.findIndex(header => 
        header && header.toString().toLowerCase().includes(columnName.toLowerCase())
      );
    };
    
    const idIndex = getColumnIndex('매물번호');
    const titleIndex = getColumnIndex('매물제목');
    const descriptionIndex = getColumnIndex('매물설명');
    const typeIndex = getColumnIndex('거래유형');
    const propertyTypeIndex = getColumnIndex('매물종류');
    const priceIndex = getColumnIndex('매매가');
    const depositIndex = getColumnIndex('보증금');
    const addressIndex = getColumnIndex('주소');
    const latIndex = getColumnIndex('위도');
    const lngIndex = getColumnIndex('경도');
    const areaIndex = getColumnIndex('공급/전용면적');
    const bedroomsIndex = getColumnIndex('방/화장실');
    const floorIndex = getColumnIndex('해당층/전체층');
    const parkingIndex = getColumnIndex('주차');
    const elevatorIndex = getColumnIndex('엘리베이터');
    const confirmedDateIndex = getColumnIndex('확인매물날짜');
    const contactNameIndex = getColumnIndex('연락처이름');
    const contactPhoneIndex = getColumnIndex('연락처전화번호');
    const contactEmailIndex = getColumnIndex('연락처이메일');
    
    console.log('컬럼 인덱스:', {
      idIndex, titleIndex, descriptionIndex, typeIndex, propertyTypeIndex,
      priceIndex, depositIndex, addressIndex, latIndex, lngIndex, areaIndex,
      bedroomsIndex, floorIndex, parkingIndex, elevatorIndex, confirmedDateIndex,
      contactNameIndex, contactPhoneIndex, contactEmailIndex
    });
    
    // 데이터 행 처리
    for (let i = 1; i < excelData.length; i++) {
      const row = excelData[i];
      console.log(`행 ${i} 처리:`, row);
      
      if (!row || row.length === 0) continue;
      
      try {
        // 기본값 설정
        const id = row[idIndex]?.toString() || `auto_${Date.now()}_${i}`;
        const title = row[titleIndex]?.toString() || '제목 없음';
        const description = row[descriptionIndex]?.toString() || '설명 없음';
        const type = row[typeIndex]?.toString()?.toLowerCase().includes('임대') ? 'rent' : 'sale';
        const propertyType = getPropertyType(row[propertyTypeIndex]?.toString());
        const price = parseFloat(row[priceIndex]?.toString() || '0');
        const deposit = parseFloat(row[depositIndex]?.toString() || '0');
        const address = row[addressIndex]?.toString() || '주소 없음';
        const lat = parseFloat(row[latIndex]?.toString() || '37.5665');
        const lng = parseFloat(row[lngIndex]?.toString() || '126.9780');
        const area = parseFloat(row[areaIndex]?.toString() || '0');
        const bedrooms = parseBedrooms(row[bedroomsIndex]?.toString());
        const bathrooms = parseBathrooms(row[bedroomsIndex]?.toString());
        const floor = row[floorIndex]?.toString() || '';
        const parking = parseBoolean(row[parkingIndex]?.toString());
        const elevator = parseBoolean(row[elevatorIndex]?.toString());
        const confirmedDate = row[confirmedDateIndex]?.toString() || '';
        const contactName = row[contactNameIndex]?.toString() || '중개소';
        const contactPhone = row[contactPhoneIndex]?.toString() || '02-0000-0000';
        const contactEmail = row[contactEmailIndex]?.toString() || 'contact@realestate.com';
        
        const property: Property = {
          id,
          title,
          description,
          price,
          deposit: deposit > 0 ? deposit : undefined,
          type,
          propertyType,
          address,
          location: { lat, lng },
          bedrooms,
          bathrooms,
          area,
          images: ['https://via.placeholder.com/300x200'],
          contact: {
            name: contactName,
            phone: contactPhone,
            email: contactEmail
          },
          features: [],
          createdAt: new Date(),
          isActive: true,
          confirmedDate: confirmedDate || undefined,
          floor: floor || undefined,
          parking,
          elevator
        };
        
        console.log(`매물 ${i} 생성:`, property);
        properties.push(property);
        
      } catch (error) {
        console.error(`행 ${i} 처리 중 오류:`, error);
      }
    }
    
    console.log('변환된 매물 개수:', properties.length);
    return properties;
  };
  
  // 매물종류 변환 함수
  const getPropertyType = (type: string | undefined): 'commercial' | 'office' | 'building' | 'other' => {
    if (!type) return 'commercial';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('상가')) return 'commercial';
    if (lowerType.includes('사무실')) return 'office';
    if (lowerType.includes('건물')) return 'building';
    return 'other';
  };
  
  // 방 개수 파싱 함수
  const parseBedrooms = (bedroomsStr: string | undefined): number => {
    if (!bedroomsStr) return 0;
    const match = bedroomsStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  
  // 화장실 개수 파싱 함수
  const parseBathrooms = (bathroomsStr: string | undefined): number => {
    if (!bathroomsStr) return 0;
    const match = bathroomsStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  
  // 불린 값 파싱 함수
  const parseBoolean = (value: string | undefined): boolean => {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    return lowerValue.includes('가능') || lowerValue.includes('있음') || lowerValue.includes('true') || lowerValue.includes('1');
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>대량 매물 등록</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <UploadSection>
          <TemplateSection>
            <TemplateTitle>📋 엑셀 템플릿 다운로드</TemplateTitle>
            <TemplateDescription>
              매물 정보를 입력할 수 있는 엑셀 템플릿을 다운로드하세요.
              템플릿에 맞춰 데이터를 입력한 후 업로드하시면 됩니다.
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
              {selectedFile ? '파일이 선택되었습니다' : '엑셀 파일을 드래그하거나 클릭하여 업로드'}
            </UploadText>
            <UploadSubtext>
              {selectedFile ? '다른 파일로 변경하려면 클릭하세요' : '지원 형식: .xlsx, .xls'}
            </UploadSubtext>
            
            {selectedFile && (
              <FileInfo>
                <FileIcon>📄</FileIcon>
                <div>
                  <FileName>{selectedFile.name}</FileName>
                  <FileSize> ({formatFileSize(selectedFile.size)})</FileSize>
                </div>
              </FileInfo>
            )}
          </FileUploadArea>

          <FileInput
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
          />

          <AddressSearchSection>
            <AddressSearchTitle>주소검색으로 좌표변환</AddressSearchTitle>
            <AddressSearchDescription>
              주소를 입력하여 위도/경도 좌표를 자동으로 변환할 수 있습니다.
              변환된 좌표는 엑셀 파일의 위도/경도 필드에 사용하세요.
            </AddressSearchDescription>
            
            <AddressSearchInput
              type="text"
              placeholder="주소를 입력하세요 (예: 서울시 강남구)"
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
            />
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <AddressSearchButton 
                onClick={searchAddress}
                disabled={isSearching || !addressSearch.trim()}
              >
                {isSearching ? '검색 중...' : '🔍 좌표 검색'}
              </AddressSearchButton>
              
              {searchResult && (
                <AddressSearchButton onClick={copyCoordinates}>
                  📋 좌표 복사
                </AddressSearchButton>
              )}
            </div>
            
            {searchResult && (
              <CoordinateResult>
                <strong>검색 결과:</strong><br />
                위도: {searchResult.lat.toFixed(6)}<br />
                경도: {searchResult.lng.toFixed(6)}
              </CoordinateResult>
            )}
          </AddressSearchSection>

          <ProgressSection className={isUploading ? 'visible' : ''}>
            <ProgressText>업로드 중... {uploadProgress}%</ProgressText>
          </ProgressSection>

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
      </ModalContent>
    </ModalOverlay>
  );
};

export default AddPropertyModal; 