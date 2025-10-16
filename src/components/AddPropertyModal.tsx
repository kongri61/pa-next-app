import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { Property } from '../types';
import { addMultipleProperties } from '../firebase/propertyService';
import { useFirebase } from '../contexts/FirebaseContext';
import SyncManager from './SyncManager';

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

const ImageUploadSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
`;

const ImageUploadTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const ImageUploadButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ImagePreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ImagePreviewItem = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const ImagePreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(220, 38, 38, 0.9);
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
  const [showSyncManager, setShowSyncManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useFirebase();

  // 이미지 관련 상태 추가
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 주소검색 관련 상태
  const [addressSearch, setAddressSearch] = useState('');
  const [searchResult, setSearchResult] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

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

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const validFiles = newFiles.filter(file => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB 제한
          alert(`${file.name}은(는) 파일 크기가 너무 큽니다. (최대 5MB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setSelectedImages(prev => [...prev, ...validFiles]);
        
        // 미리보기 URL 생성
        const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
        setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
      }
    }
  };

  // 이미지 제거 핸들러
  const handleImageRemove = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // URL 해제
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  // 이미지 업로드 버튼 클릭
  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
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
        '', // 위도 - 자동 변환됨
        '', // 경도 - 자동 변환됨
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
        '', // 위도 - 자동 변환됨
        '', // 경도 - 자동 변환됨
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

    if (!user) {
      alert('로그인이 필요합니다.');
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

          // 주소를 좌표로 변환하는 함수 (실제 Google Geocoding API 사용)
          const convertAddressToCoordinates = async (address: string): Promise<{lat: number, lng: number} | null> => {
            try {
              console.log(`주소 변환 시작: "${address}"`);
              
              if (!address || address.trim() === '') {
                console.log('주소가 비어있음');
                return null;
              }

              // Google Geocoding API 호출
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyCgPbhfAQ9gZbn4SVZIJoiLeHeIZek3-Pk&language=ko`
              );
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              console.log('Geocoding API 응답:', data);
              
              if (data.status === 'OK' && data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                console.log(`좌표 변환 성공: "${address}" → ${location.lat}, ${location.lng}`);
                return {
                  lat: location.lat,
                  lng: location.lng
                };
              } else {
                console.log(`좌표 변환 실패: "${address}" - ${data.status}`);
                return null;
              }
              
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
              const title = row[headers.findIndex(header => header?.toLowerCase().includes('매물제목'))]?.toString() || '제목 없음';
              const description = row[headers.findIndex(header => header?.toLowerCase().includes('매물설명'))]?.toString() || '설명 없음';
              const type = row[headers.findIndex(header => header?.toLowerCase().includes('거래유형'))]?.toString()?.toLowerCase().includes('임대') ? 'rent' : 'sale';
              const propertyType = getPropertyType(row[headers.findIndex(header => header?.toLowerCase().includes('매물종류'))]?.toString());
              const price = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('매매가'))]?.toString() || '0');
              const deposit = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('보증금'))]?.toString() || '0');
              const address = row[headers.findIndex(header => header?.toLowerCase().includes('주소'))]?.toString() || '주소 없음';
              
              // 주소를 좌표로 변환
              let lat = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('위도'))]?.toString() || '0');
              let lng = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('경도'))]?.toString() || '0');
              
              // 위도/경도가 없거나 0인 경우 주소로 좌표 변환 시도
              if ((lat === 0 && lng === 0) || (isNaN(lat) || isNaN(lng))) {
                console.log(`매물 ${i}: 주소로 좌표 변환 시도 - "${address}"`);
                const coordinates = await convertAddressToCoordinates(address);
                if (coordinates) {
                  lat = coordinates.lat;
                  lng = coordinates.lng;
                  console.log(`매물 ${i}: 좌표 변환 성공 - ${lat}, ${lng}`);
                } else {
                  console.log(`매물 ${i}: 좌표 변환 실패, 기본값 사용`);
                  lat = 37.4000; // 인천 중심 기본 좌표
                  lng = 126.7052;
                }
              }
              
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
              
              const property: Omit<Property, 'id' | 'createdAt'> = {
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
                images: imagePreviewUrls.length > 0 ? imagePreviewUrls : ['/images/default-property.svg'],
                contact: {
                  name: contactName,
                  phone: contactPhone,
                  email: contactEmail
                },
                features: [],
                isActive: true,
                confirmedDate: confirmedDate || undefined,
                floor: floor || undefined,
                parking,
                elevator,
                createdBy: user.uid,
                updatedBy: user.uid
              };
              
              console.log(`매물 ${i} 생성:`, property);
              processedData.push(property);
              
            } catch (error) {
              console.error(`행 ${i} 처리 중 오류:`, error);
            }
          }
          
          console.log('변환된 매물 개수:', processedData.length);
          
          if (processedData.length > 0) {
            // Firebase에 매물 저장
            const propertyIds = await addMultipleProperties(processedData);
            console.log('Firebase에 저장된 매물 ID들:', propertyIds);
            
            // 부모 컴포넌트에 매물 추가 알림
            if (onPropertyAdded) {
              // ID를 포함한 완전한 Property 객체로 변환
              const completeProperties: Property[] = processedData.map((property, index) => ({
                ...property,
                id: propertyIds[index],
                createdAt: new Date()
              }));
              onPropertyAdded(completeProperties);
            }
            
            // 페이지 새로고침으로 즉시 반영
            // window.location.reload();
            
            alert(`총 ${processedData.length}개의 매물이 성공적으로 등록되었습니다. 페이지를 새로고침하여 확인하세요.`);
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

    try {
      console.log(`주소 검색 시작: "${addressSearch}"`);
      
      // Google Geocoding API 호출
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressSearch)}&key=AIzaSyCgPbhfAQ9gZbn4SVZIJoiLeHeIZek3-Pk&language=ko`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Geocoding API 응답:', data);
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;
        
        setSearchResult({
          address: formattedAddress,
          lat: location.lat,
          lng: location.lng
        });
        
        console.log(`주소 검색 성공: "${addressSearch}" → ${formattedAddress} (${location.lat}, ${location.lng})`);
      } else {
        alert(`주소를 찾을 수 없습니다: ${addressSearch}`);
        console.log(`주소 검색 실패: "${addressSearch}" - ${data.status}`);
      }
      
    } catch (error) {
      console.error('주소 검색 오류:', error);
      alert('주소 검색 중 오류가 발생했습니다.');
    }
  };

  const copyCoordinates = () => {
    if (searchResult) {
      const text = `${searchResult.lat}, ${searchResult.lng}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('좌표가 클립보드에 복사되었습니다!');
      }).catch(() => {
        alert('클립보드 복사에 실패했습니다.');
      });
    }
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

  const handleSyncComplete = () => {
    // 동기화 완료 후 처리
    console.log('동기화가 완료되었습니다.');
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>대량 매물 등록</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <UploadSection>
          {/* 동기화 관리자 섹션 */}
          {user && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => setShowSyncManager(!showSyncManager)}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {showSyncManager ? '📊 동기화 관리 숨기기' : '📊 데이터 동기화 관리'}
              </button>
              
              {showSyncManager && (
                <SyncManager onSyncComplete={handleSyncComplete} />
              )}
            </div>
          )}

          <TemplateSection>
            <TemplateTitle>📋 엑셀 템플릿 다운로드</TemplateTitle>
            <TemplateDescription>
              매물 정보를 입력할 수 있는 엑셀 템플릿을 다운로드하세요.
              템플릿에 맞춰 데이터를 입력한 후 업로드하시면 됩니다.
              <br /><br />
              <strong>💡 주소 자동 좌표 변환:</strong>
              <br />
              • 주소만 입력하면 위도/경도가 자동으로 변환됩니다
              <br />
              • 위도/경도 필드를 비워두거나 0으로 입력하세요
              <br />
              • 예: "서울시 강남구 역삼동 123-45" → 자동 좌표 변환
            </TemplateDescription>
            <TemplateButton onClick={downloadTemplate}>
              📥 엑셀 템플릿 다운로드
            </TemplateButton>
          </TemplateSection>

          {/* 이미지 업로드 섹션 */}
          <ImageUploadSection>
            <ImageUploadTitle>📸 매물 사진 등록</ImageUploadTitle>
            <ImageUploadButton onClick={handleImageUploadClick}>
              📷 사진 선택하기
            </ImageUploadButton>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            
            {imagePreviewUrls.length > 0 && (
              <ImagePreviewGrid>
                {imagePreviewUrls.map((url, index) => (
                  <ImagePreviewItem key={index}>
                    <ImagePreview src={url} alt={`미리보기 ${index + 1}`} />
                    <RemoveImageButton onClick={() => handleImageRemove(index)}>
                      ×
                    </RemoveImageButton>
                  </ImagePreviewItem>
                ))}
              </ImagePreviewGrid>
            )}
          </ImageUploadSection>

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
                disabled={!addressSearch.trim()}
              >
                {searchResult ? '🔍 좌표 검색' : '🔍 좌표 검색'}
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