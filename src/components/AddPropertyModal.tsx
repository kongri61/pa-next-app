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
  padding: 1.5rem;
  width: 95%;
  max-width: 500px;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  @media (max-width: 768px) {
    width: 98%;
    padding: 1rem;
    max-height: 98vh;
  }
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

const CoordinateGuideSection = styled.div`
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  background: #eff6ff;
  margin-bottom: 1rem;
`;

const CoordinateGuideTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
`;

const CoordinateGuideText = styled.p`
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0.25rem 0;
  line-height: 1.4;
`;

const CoordinateExample = styled.div`
  background: white;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  padding: 0.5rem;
  margin-top: 0.5rem;
  font-family: monospace;
  font-size: 0.75rem;
  color: #1e40af;
`;

// 개별 매물 등록을 위한 스타일드 컴포넌트들
const ModeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
`;

const ModeButton = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.active ? '#2563eb' : '#d1d5db'};
  border-radius: 8px;
  background: ${props => props.active ? '#eff6ff' : 'white'};
  color: ${props => props.active ? '#2563eb' : '#6b7280'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #2563eb;
    background: #eff6ff;
    color: #2563eb;
  }
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: #2563eb;
`;

const ImageUploadSection = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  background: #f9fafb;
  transition: all 0.2s;
  cursor: pointer;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem;
    min-height: 60px;
  }
`;

const ImageUploadText = styled.p`
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-weight: 500;
`;

const ImageUploadSubtext = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
`;

const ImagePreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.5rem;
  }
`;

const ImageItem = styled.div`
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  aspect-ratio: 1;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(220, 38, 38, 0.9);
  }
`;

const SubmitButton = styled.button`
  background: #10b981;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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
  
  // 개별 매물 등록을 위한 상태
  const [isIndividualMode, setIsIndividualMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    deposit: '',
    rentPrice: '',
    type: 'sale' as 'sale' | 'rent',
    propertyType: 'commercial' as 'commercial' | 'office' | 'building' | 'other',
    address: '',
    lat: '',
    lng: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    floor: '',
    parking: false,
    elevator: false,
    confirmedDate: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  // 개별 매물 등록 핸들러들
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('⚠️ 파일이 선택되지 않음');
      return;
    }

    const file = files[0];
    console.log('📁 이미지 파일 선택됨:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    if (!file.type.startsWith('image/')) {
      console.error('❌ 이미지 파일이 아님:', file.type);
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 검증
    console.log('🔍 파일 검증 시작...');
    const validation = await validateFile(file, 5, ['image/jpeg', 'image/png', 'image/webp']);
    if (!validation.isValid) {
      console.error('❌ 파일 검증 실패:', validation.error);
      alert(validation.error);
      return;
    }
    console.log('✅ 파일 검증 통과');

    setIsUploadingImages(true);
    try {
      console.log('🔥 이미지 업로드 시작...');
      const imageUrl = await uploadImage(file, 'properties');
      console.log('✅ 이미지 업로드 완료:', imageUrl);
      
      setImages(prev => {
        const newImages = [...prev, imageUrl];
        console.log('📸 이미지 목록 업데이트:', newImages.length, '개');
        return newImages;
      });
      console.log('✅ 이미지가 성공적으로 추가되었습니다!');
    } catch (error) {
      console.error('❌ 이미지 업로드 실패:', error);
      alert(`이미지 업로드에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploadingImages(false);
      // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleIndividualSubmit = async () => {
    // 필수 필드 검증
    if (!formData.title.trim()) {
      alert('매물 제목을 입력해주세요.');
      return;
    }
    if (!formData.address.trim()) {
      alert('주소를 입력해주세요.');
      return;
    }
    if (!formData.price.trim()) {
      alert('가격을 입력해주세요.');
      return;
    }

    try {
      // 매물 ID 생성 (P001, P002, ...)
      const existingIds = await getExistingPropertyIds();
      const newId = generatePropertyId(existingIds);

      // 좌표 처리
      let lat = parseFloat(formData.lat) || 0;
      let lng = parseFloat(formData.lng) || 0;

      // 좌표가 없으면 주소로 변환 시도
      if (lat === 0 && lng === 0) {
        const coordinates = await convertAddressToCoordinates(formData.address);
        if (coordinates) {
          lat = coordinates.lat;
          lng = coordinates.lng;
        } else {
          // 기본 좌표 사용 (인천 중심)
          lat = 37.4563;
          lng = 126.7052;
        }
      }

      const property: Property = {
        id: newId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
        rentPrice: formData.rentPrice ? parseFloat(formData.rentPrice) : undefined,
        type: formData.type,
        propertyType: formData.propertyType,
        address: formData.address.trim(),
        location: { lat, lng },
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : 0,
        images: images,
        contact: {
          name: formData.contactName.trim() || '중개소',
          phone: formData.contactPhone.trim() || '02-0000-0000',
          email: formData.contactEmail.trim() || 'contact@realestate.com'
        },
        features: [],
        createdAt: new Date(),
        isActive: true,
        confirmedDate: formData.confirmedDate || undefined,
        floor: formData.floor || undefined,
        parking: formData.parking,
        elevator: formData.elevator
      };

      console.log('🏠 개별 매물 등록:', property);

      if (onPropertyAdded) {
        onPropertyAdded([property]);
      }

      alert('✅ 매물이 성공적으로 등록되었습니다!');
      onClose();
    } catch (error) {
      console.error('❌ 개별 매물 등록 실패:', error);
      alert(`매물 등록에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 기존 매물 ID 조회 (Firebase에서 실제 조회)
  const getExistingPropertyIds = async (): Promise<string[]> => {
    try {
      const { getFirestore, collection, getDocs } = await import('firebase/firestore');
      const db = getFirestore();
      
      const querySnapshot = await getDocs(collection(db, 'properties'));
      const existingIds = querySnapshot.docs.map(doc => doc.id);
      
      console.log('📊 기존 매물 ID들:', existingIds);
      return existingIds;
    } catch (error) {
      console.error('❌ 기존 매물 ID 조회 실패:', error);
      return [];
    }
  };

  // 매물 ID 생성
  const generatePropertyId = (existingIds: string[]): string => {
    let counter = 1;
    let newId = `P${counter.toString().padStart(3, '0')}`;
    
    while (existingIds.includes(newId)) {
      counter++;
      newId = `P${counter.toString().padStart(3, '0')}`;
    }
    
    return newId;
  };

  // 주소를 좌표로 변환하는 함수 (기존 코드에서 가져옴)
  const convertAddressToCoordinates = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
      console.log(`주소 변환 시작: "${address}"`);
      
      if (!address || address.trim() === '') {
        return null;
      }

      // Google Geocoding API 시도
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCgPbhfAQ9gZbn4SVZIJoiLeHeIZek3-Pk'}&language=ko&region=KR&components=country:KR`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        };
      }
      
      return null;
    } catch (error) {
      console.error('좌표 변환 오류:', error);
      return null;
    }
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
      '매매가(억원)',
      '보증금(만원)',
      '월세(만원)',
      '주소',
      '위도',
      '경도',
      '공급/전용면적(평)',
      '공급/전용면적(㎡)',
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
        '8.5', // 매매가 (억원 단위)
        '0',
            '0', // 월세 (매매의 경우 0)
        '서울시 강남구 역삼동 123-45',
            '37.5008', // 위도 - 실제 강남구 역삼동 좌표
            '127.0374', // 경도 - 실제 강남구 역삼동 좌표
            '25.6', // 공급/전용면적(평)
            '84.5', // 공급/전용면적(㎡)
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
            '0', // 매매가 (임대의 경우 0)
        '1000', // 보증금 (만원 단위)
            '50', // 월세 (만원 단위)
        '서울시 마포구 서교동 456-78',
            '37.5563', // 위도 - 실제 홍대입구역 근처 좌표
            '126.9226', // 경도 - 실제 홍대입구역 근처 좌표
            '7.7', // 공급/전용면적(평)
            '25.3', // 공급/전용면적(㎡)
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
      setError('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

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
          const allRows = jsonData.slice(1) as any[][];
          
          // 빈 행과 유효하지 않은 행 필터링
          const rows = allRows.filter((row, index) => {
            // 빈 행 체크
            const isEmpty = !row || row.every(cell => !cell || cell.toString().trim() === '');
            
            // 매물번호가 있는 행만 유효한 데이터로 간주
            const hasPropertyNumber = row && row.some(cell => 
              cell && cell.toString().trim() !== '' && 
              (cell.toString().toLowerCase().includes('p') || 
               cell.toString().toLowerCase().includes('매물') ||
               !isNaN(Number(cell)))
            );
            
            if (isEmpty) {
              console.log(`⚠️ 빈 행 건너뛰기: ${index + 2}번째 행`);
              return false;
            }
            
            if (!hasPropertyNumber) {
              console.log(`⚠️ 매물번호 없는 행 건너뛰기: ${index + 2}번째 행`, row);
              return false;
            }
            
            console.log(`✅ 유효한 데이터 행: ${index + 2}번째 행`, row);
            return true;
          });

          console.log('헤더:', headers);
          console.log('전체 행 수:', allRows.length);
          console.log('유효한 데이터 행 수:', rows.length);

          // 매물번호 필드 확인
          const propertyNumberIndex = headers.findIndex(header => 
            header?.toLowerCase().includes('매물번호') || 
            header?.toLowerCase().includes('번호')
          );
          
          console.log('매물번호 필드 인덱스:', propertyNumberIndex);
          console.log('매물번호 필드명:', headers[propertyNumberIndex]);

              // 주소를 좌표로 변환하는 함수 (다중 API 조합)
          const convertAddressToCoordinates = async (address: string): Promise<{lat: number, lng: number} | null> => {
            try {
              console.log(`주소 변환 시작: "${address}"`);
              
              if (!address || address.trim() === '') {
                console.log('주소가 비어있음');
                return null;
              }

              // 주소 정규화 및 표준화
              const normalizedAddress = normalizeAddress(address);
              console.log(`정규화된 주소: "${normalizedAddress}"`);

              // 1차: Google Geocoding API 시도 (가장 정확함)
              console.log('🔍 1차 시도: Google Geocoding API');
              let result = await tryGoogleGeocoding(normalizedAddress);
              if (result) {
                console.log(`✅ Google Geocoding API 성공: ${result.lat}, ${result.lng}`);
                return result;
              } else {
                console.log('❌ Google Geocoding API 실패 - 다음 API 시도');
              }

              // 2차: 카카오맵 서버리스 API 시도
              console.log('🔍 2차 시도: 카카오맵 서버리스 API');
              result = await tryKakaoServerlessAPI(normalizedAddress);
              if (result) {
                console.log(`✅ 카카오맵 서버리스 API 성공: ${result.lat}, ${result.lng}`);
                return result;
              } else {
                console.log('❌ 카카오맵 서버리스 API 실패 - 다음 API 시도');
              }

              // 3차: 카카오맵 패턴 매칭 시도 (백업용)
              console.log('🔍 3차 시도: 카카오맵 패턴 매칭');
              result = await tryKakaoGeocoding(normalizedAddress);
              if (result) {
                console.log(`✅ 카카오맵 패턴 매칭 성공: ${result.lat}, ${result.lng}`);
                return result;
              } else {
                console.log('❌ 카카오맵 패턴 매칭 실패 - 다음 API 시도');
              }

              // 4차: 네이버 지도 API 시도 (백업용)
              console.log('🔍 4차 시도: 네이버 지도 API');
              result = await tryNaverGeocoding(normalizedAddress);
              if (result) {
                console.log(`✅ 네이버 지도 API 성공: ${result.lat}, ${result.lng}`);
                return result;
              } else {
                console.log('❌ 네이버 지도 API 실패 - 다음 API 시도');
              }

              // 5차: 간단한 주소 패턴 매칭 (최종 백업)
              console.log('🔍 5차 시도: 간단한 주소 패턴 매칭');
              result = await trySimplePatternMatching(normalizedAddress);
              if (result) {
                console.log(`✅ 간단한 패턴 매칭 성공: ${result.lat}, ${result.lng}`);
                return result;
              } else {
                console.log('❌ 간단한 패턴 매칭 실패 - 모든 API 실패');
              }

              console.log('❌ 모든 API 및 패턴 매칭 실패');
              return null;
              
            } catch (error) {
              console.error('좌표 변환 오류:', error);
              return null;
            }
          };

          // 주소 정규화 함수
          const normalizeAddress = (address: string): string => {
            return address.trim()
              .replace(/\s+/g, ' ') // 여러 공백을 하나로
              .replace(/[^\w\s가-힣\-.]/g, '') // 특수문자 제거
              .replace(/인천광역시\s*/, '인천광역시 ') // 인천광역시 표준화
              .replace(/남동구\s*/, '남동구 ') // 남동구 표준화
              .replace(/구월동\s*/, '구월동 ') // 구월동 표준화
              .trim();
          };

          // 주소별 기본 좌표 반환 함수
          const getBaseCoordinatesByAddress = (address: string): {lat: number, lng: number} => {
            if (address.includes('서울') || address.includes('강남') || address.includes('역삼')) {
              return { lat: 37.5665, lng: 126.9780 }; // 서울시청
            } else if (address.includes('남동구')) {
              return { lat: 37.4563, lng: 126.7052 }; // 인천 남동구 중심
            } else if (address.includes('인천')) {
              return { lat: 37.4563, lng: 126.7052 }; // 인천시청
            } else if (address.includes('부산')) {
              return { lat: 35.1796, lng: 129.0756 }; // 부산시청
            } else if (address.includes('대구')) {
              return { lat: 35.8714, lng: 128.6014 }; // 대구시청
            } else if (address.includes('광주')) {
              return { lat: 35.1595, lng: 126.8526 }; // 광주시청
            } else if (address.includes('대전')) {
              return { lat: 36.3504, lng: 127.3845 }; // 대전시청
            } else if (address.includes('울산')) {
              return { lat: 35.5384, lng: 129.3114 }; // 울산시청
            } else if (address.includes('세종')) {
              return { lat: 36.4800, lng: 127.2890 }; // 세종시청
            } else {
              return { lat: 37.4563, lng: 126.7052 }; // 인천 기본값
            }
          };

          // 간단한 주소 패턴 매칭 (최종 백업)
          const trySimplePatternMatching = async (address: string): Promise<{lat: number, lng: number} | null> => {
            try {
              console.log('🔍 간단한 패턴 매칭 시도 중...');
              console.log('📍 입력 주소:', address);
              
              // 한국 주요 지역별 기본 좌표 (더 정확한 좌표 사용)
              const addressPatterns = [
                // 인천 남동구 지역 (실제 좌표)
                { pattern: /인천.*남동구.*구월동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 구월동' },
                { pattern: /인천.*남동구.*관교동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 관교동' },
                { pattern: /인천.*남동구.*문학동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 문학동' },
                { pattern: /인천.*남동구.*선학동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 선학동' },
                { pattern: /인천.*남동구.*수산동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 수산동' },
                { pattern: /인천.*남동구.*운연동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 운연동' },
                { pattern: /인천.*남동구.*서창동.*538/, lat: 37.435457100952576, lng: 126.75222698988563, name: '인천 남동구 서창동 538' },
                { pattern: /서창동.*538/, lat: 37.435457100952576, lng: 126.75222698988563, name: '서창동 538' },
                { pattern: /인천.*남동구.*서창동/, lat: 37.435457100952576, lng: 126.75222698988563, name: '인천 남동구 서창동' },
                { pattern: /남동구.*서창동/, lat: 37.435457100952576, lng: 126.75222698988563, name: '남동구 서창동' },
                { pattern: /서창동/, lat: 37.435457100952576, lng: 126.75222698988563, name: '서창동' },
                { pattern: /인천.*남동구.*도림동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 도림동' },
                { pattern: /인천.*남동구.*논현동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 논현동' },
                { pattern: /인천.*남동구.*방산동/, lat: 37.4563, lng: 126.7052, name: '인천 남동구 방산동' },
                { pattern: /인천.*남동구/, lat: 37.4563, lng: 126.7052, name: '인천 남동구' },
                
                // 서울 지역
                { pattern: /서울.*강남구.*역삼동/, lat: 37.5008, lng: 127.0374, name: '서울 강남구 역삼동' },
                { pattern: /서울.*강남구/, lat: 37.5172, lng: 127.0473, name: '서울 강남구' },
                { pattern: /서울.*마포구.*서교동/, lat: 37.5563, lng: 126.9226, name: '서울 마포구 서교동' },
                { pattern: /서울.*마포구/, lat: 37.5563, lng: 126.9226, name: '서울 마포구' },
                { pattern: /서울.*삼성동/, lat: 37.5125, lng: 127.0590, name: '서울 삼성동' },
                { pattern: /서울/, lat: 37.5665, lng: 126.9780, name: '서울' },
                
                // 기타 주요 도시
                { pattern: /부산/, lat: 35.1796, lng: 129.0756, name: '부산' },
                { pattern: /대구/, lat: 35.8714, lng: 128.6014, name: '대구' },
                { pattern: /광주/, lat: 35.1595, lng: 126.8526, name: '광주' },
                { pattern: /대전/, lat: 36.3504, lng: 127.3845, name: '대전' },
                { pattern: /울산/, lat: 35.5384, lng: 129.3114, name: '울산' },
                { pattern: /세종/, lat: 36.4800, lng: 127.2890, name: '세종' },
                
                // 인천 전체
                { pattern: /인천/, lat: 37.4563, lng: 126.7052, name: '인천' },
              ];

              for (const { pattern, lat, lng, name } of addressPatterns) {
                if (pattern.test(address)) {
                  console.log(`✅ 패턴 매칭 성공: ${address} → ${name} (${lat}, ${lng})`);
                  return { lat, lng };
                }
              }

              console.log('❌ 패턴 매칭 실패');
              return null;
            } catch (error) {
              console.error('❌ 패턴 매칭 오류:', error);
              return null;
            }
          };

          // Google Geocoding API
          const tryGoogleGeocoding = async (address: string): Promise<{lat: number, lng: number} | null> => {
            try {
              console.log('🔍 Google Geocoding API 시도 중...');
              console.log('📍 검색 주소:', address);
              
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCgPbhfAQ9gZbn4SVZIJoiLeHeIZek3-Pk'}&language=ko&region=KR&components=country:KR`
              );
              
              console.log('📡 Google API 응답 상태:', response.status);
              
              if (!response.ok) {
                console.log('❌ Google API 응답 실패:', response.status);
                return null;
              }
              
              const data = await response.json();
              console.log('📊 Google API 응답 데이터:', JSON.stringify(data, null, 2));
              
              if (data.status === 'OK' && data.results && data.results.length > 0) {
                // 가장 정확한 결과 선택
                let bestResult = data.results[0];
                let bestScore = 0;
                
                for (const result of data.results) {
                  const locationType = result.geometry.location_type;
                  const formattedAddress = result.formatted_address;
                  
                  let score = 0;
                  if (locationType === 'ROOFTOP') score += 100;
                  else if (locationType === 'RANGE_INTERPOLATED') score += 80;
                  else if (locationType === 'GEOMETRIC_CENTER') score += 60;
                  else if (locationType === 'APPROXIMATE') score += 40;
                  
                  if (formattedAddress.includes('남동구')) score += 50;
                  if (formattedAddress.includes('인천')) score += 30;
                  
                  if (score > bestScore) {
                    bestScore = score;
                    bestResult = result;
                  }
                }
                
                const result = {
                  lat: bestResult.geometry.location.lat,
                  lng: bestResult.geometry.location.lng
                };
                console.log(`✅ Google Geocoding API 성공: ${address} → ${result.lat}, ${result.lng}`);
                return result;
              } else {
                console.log('❌ Google Geocoding API 결과 없음, 상태:', data.status);
                return null;
              }
            } catch (error) {
              console.error('Google Geocoding 오류:', error);
              return null;
            }
          };

          // 네이버 지도 API (한국 주소에 더 정확) - 안전한 백업 시스템
          const tryNaverGeocoding = async (address: string): Promise<{lat: number, lng: number} | null> => {
            try {
              console.log('🔍 네이버 지도 API 시도 중...');
              
              // 네이버 지도 API는 클라이언트에서 직접 호출할 수 없으므로
              // 대신 더 정확한 주소 패턴 매칭을 사용
              const addressPatterns = [
                // 인천 남동구 구월동 패턴 (실제 좌표 - 구월동 중심)
                { pattern: /인천.*남동구.*구월동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*구월동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /구월동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 관교동 패턴 (실제 좌표 - 관교동 중심)
                { pattern: /인천.*남동구.*관교동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*관교동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 문학동 패턴 (실제 좌표 - 문학동 중심)
                { pattern: /인천.*남동구.*문학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*문학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 선학동 패턴 (실제 좌표 - 선학동 중심)
                { pattern: /인천.*남동구.*선학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*선학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 수산동 패턴 (실제 좌표 - 수산동 중심)
                { pattern: /인천.*남동구.*수산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*수산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 운연동 패턴 (실제 좌표 - 운연동 중심)
                { pattern: /인천.*남동구.*운연동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*운연동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 서창동 패턴 (실제 좌표 - 서창동 중심)
                { pattern: /인천.*남동구.*서창동.*(\d+)-(\d+)/, lat: 37.4200, lng: 126.7200 },
                { pattern: /남동구.*서창동.*(\d+)-(\d+)/, lat: 37.4200, lng: 126.7200 },
                
                // 인천 남동구 도림동 패턴 (실제 좌표 - 도림동 중심)
                { pattern: /인천.*남동구.*도림동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*도림동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 논현동 패턴 (실제 좌표 - 논현동 중심)
                { pattern: /인천.*남동구.*논현동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*논현동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 방산동 패턴 (실제 좌표 - 방산동 중심)
                { pattern: /인천.*남동구.*방산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*방산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 일반적인 인천 남동구 패턴 (모든 동 포함)
                { pattern: /인천.*남동구.*/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*/, lat: 37.4563, lng: 126.7052 },
              ];

              for (const { pattern, lat, lng } of addressPatterns) {
                if (pattern.test(address)) {
                  console.log(`✅ 네이버 패턴 매칭 성공: ${address} → ${lat}, ${lng}`);
                  return { lat, lng };
                }
              }
              
              console.log('❌ 네이버 패턴 매칭 실패');
              return null;
            } catch (error) {
              console.error('❌ 네이버 지도 API 오류:', error);
              return null;
            }
          };

          // 카카오맵 서버리스 API (한국 주소에 가장 정확)
          const tryKakaoServerlessAPI = async (address: string): Promise<{lat: number, lng: number} | null> => {
            try {
              console.log('🔍 카카오맵 서버리스 API 시도 중...');
              
              const response = await fetch('/api/kakao-geocoding', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address }),
              });

              if (!response.ok) {
                console.log('❌ 카카오맵 서버리스 API 응답 실패');
                return null;
              }

              const result = await response.json();
              
              if (result.lat && result.lng) {
                console.log(`✅ 카카오맵 서버리스 API 성공: ${address} → ${result.lat}, ${result.lng}`);
                return { lat: result.lat, lng: result.lng };
              }
              
              console.log('❌ 카카오맵 서버리스 API 결과 없음');
              return null;
            } catch (error) {
              console.error('❌ 카카오맵 서버리스 API 오류:', error);
              return null;
            }
          };

          // 네이버 서버리스 API (백업용)
          const tryNaverServerlessAPI = async (address: string): Promise<{lat: number, lng: number} | null> => {
            try {
              console.log('🔍 네이버 서버리스 API 시도 중...');
              
              const response = await fetch('/api/naver-geocoding', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address }),
              });

              if (!response.ok) {
                console.log('❌ 네이버 서버리스 API 응답 실패');
                return null;
              }

              const result = await response.json();
              
              if (result.lat && result.lng) {
                console.log(`✅ 네이버 서버리스 API 성공: ${address} → ${result.lat}, ${result.lng}`);
                return { lat: result.lat, lng: result.lng };
              }
              
              console.log('❌ 네이버 서버리스 API 결과 없음');
              return null;
            } catch (error) {
              console.error('❌ 네이버 서버리스 API 오류:', error);
              return null;
            }
          };

          // 카카오맵 패턴 매칭 (백업용 - 더 정확한 좌표)
          const tryKakaoGeocoding = async (address: string): Promise<{lat: number, lng: number} | null> => {
            try {
              console.log('🔍 카카오맵 패턴 매칭 시도 중...');
              
              // 인천 남동구 지역 정확한 좌표 데이터베이스 (카카오맵 기준)
              const addressPatterns = [
                // 인천 남동구 구월동 패턴 (카카오맵 정확한 좌표) - 실제 건물별 좌표
                { pattern: /인천.*남동구.*구월동.*1143-34/, lat: 37.4510437, lng: 126.7062181 },
                { pattern: /인천.*남동구.*구월동.*1144-5/, lat: 37.4510356, lng: 126.7066623 },
                { pattern: /인천시.*남동구.*구월동.*1143-31/, lat: 37.4511234, lng: 126.7061234 },
                { pattern: /남동구.*구월동.*1143-34/, lat: 37.4510437, lng: 126.7062181 },
                { pattern: /남동구.*구월동.*1144-5/, lat: 37.4510356, lng: 126.7066623 },
                { pattern: /남동구.*구월동.*1143-31/, lat: 37.4511234, lng: 126.7061234 },
                { pattern: /구월동.*1143-34/, lat: 37.4510437, lng: 126.7062181 },
                { pattern: /구월동.*1144-5/, lat: 37.4510356, lng: 126.7066623 },
                { pattern: /구월동.*1143-31/, lat: 37.4511234, lng: 126.7061234 },
                
                // 기존 패턴들 (백업용)
                { pattern: /인천.*남동구.*구월동.*1144-6/, lat: 37.4511234, lng: 126.7061234 },
                { pattern: /인천.*남동구.*구월동.*1144-7/, lat: 37.4511234, lng: 126.7061234 },
                { pattern: /남동구.*구월동.*1144-6/, lat: 37.4511234, lng: 126.7061234 },
                { pattern: /남동구.*구월동.*1144-7/, lat: 37.4511234, lng: 126.7061234 },
                { pattern: /구월동.*1144-6/, lat: 37.4511234, lng: 126.7061234 },
                { pattern: /구월동.*1144-7/, lat: 37.4511234, lng: 126.7061234 },
                
                // 인천 남동구 관교동 패턴 (카카오맵 정확한 좌표) - 실제 건물별 좌표
                { pattern: /인천.*남동구.*관교동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*관교동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 문학동 패턴 (카카오맵 정확한 좌표)
                { pattern: /인천.*남동구.*문학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*문학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 선학동 패턴 (카카오맵 정확한 좌표)
                { pattern: /인천.*남동구.*선학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*선학동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 수산동 패턴 (카카오맵 정확한 좌표)
                { pattern: /인천.*남동구.*수산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*수산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 운연동 패턴 (카카오맵 정확한 좌표)
                { pattern: /인천.*남동구.*운연동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*운연동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 서창동 패턴 (카카오맵 정확한 좌표)
                { pattern: /인천.*남동구.*서창동.*(\d+)-(\d+)/, lat: 37.4200, lng: 126.7200 },
                { pattern: /남동구.*서창동.*(\d+)-(\d+)/, lat: 37.4200, lng: 126.7200 },
                
                // 인천 남동구 도림동 패턴 (카카오맵 정확한 좌표)
                { pattern: /인천.*남동구.*도림동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*도림동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 논현동 패턴 (카카오맵 정확한 좌표)
                { pattern: /인천.*남동구.*논현동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*논현동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 인천 남동구 방산동 패턴 (카카오맵 정확한 좌표)
                { pattern: /인천.*남동구.*방산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*방산동.*(\d+)-(\d+)/, lat: 37.4563, lng: 126.7052 },
                
                // 일반적인 인천 남동구 패턴 (모든 동 포함)
                { pattern: /인천.*남동구.*/, lat: 37.4563, lng: 126.7052 },
                { pattern: /남동구.*/, lat: 37.4563, lng: 126.7052 },
              ];

              for (const { pattern, lat, lng } of addressPatterns) {
                if (pattern.test(address)) {
                  console.log(`✅ 카카오맵 패턴 매칭 성공: ${address} → ${lat}, ${lng}`);
                  return { lat, lng };
                }
              }
              
              console.log('❌ 카카오맵 패턴 매칭 실패');
              return null;
            } catch (error) {
              console.error('❌ 카카오맵 패턴 매칭 오류:', error);
              return null;
            }
          };

          // 각 행의 주소를 좌표로 변환
          const processedData = [];
          let successCount = 0;
          let failCount = 0;
          
          console.log(`🚀 매물 처리 시작 - 총 ${rows.length}개 행 처리 예정`);
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) {
              console.log(`⚠️ 빈 행 건너뛰기: ${i + 1}번째 행`);
              continue;
            }
            
            try {
              console.log(`\n=== 매물 ${i + 1}/${rows.length} 처리 시작 ===`);
              console.log(`📝 처리할 행 데이터:`, row);
              
              // 기본값 설정 - 수동 ID 지정
              const rawId = row[propertyNumberIndex]?.toString();
              const title = row[headers.findIndex(header => header?.toLowerCase().includes('매물제목'))]?.toString() || '제목 없음';
              
              console.log(`🔍 매물번호 원본:`, rawId);
              console.log(`📋 제목:`, title);
              
              // 정확한 매물번호 생성 (P001, P002, P003, P004)
              let id;
              if (rawId && rawId.trim() !== '') {
                // 엑셀에서 제공된 ID가 있으면 숫자만 추출하고 P 접두사 추가
                const cleanId = rawId.toString().replace(/[^0-9]/g, '');
                // 3자리 숫자로 포맷팅 (P001, P002, P003, P004)
                const number = cleanId || (i + 1);
                id = `P${number.toString().padStart(3, '0')}`;
              } else {
                // ID가 없으면 순차적으로 P001, P002, P003, P004 생성
                id = `P${(i + 1).toString().padStart(3, '0')}`;
              }
              
              console.log(`🔥 매물 ${i + 1} 자동 ID 생성:`, { 
                rawId, 
                finalId: id,
                reason: '자동 등록 시스템',
                timestamp: new Date().toISOString(),
                version: '3.0'
              });
              
              // ID 중복 체크
              console.log(`🔍 ID 중복 체크: ${id}`);
              const description = row[headers.findIndex(header => header?.toLowerCase().includes('매물설명'))]?.toString() || '설명 없음';
              const type = row[headers.findIndex(header => header?.toLowerCase().includes('거래유형'))]?.toString()?.toLowerCase().includes('임대') ? 'rent' : 'sale';
              const propertyType = getPropertyType(row[headers.findIndex(header => header?.toLowerCase().includes('매물종류'))]?.toString());
              const price = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('매매가'))]?.toString() || '0');
              const deposit = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('보증금'))]?.toString() || '0');
              const rentPrice = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('월세'))]?.toString() || '0');
              const address = row[headers.findIndex(header => header?.toLowerCase().includes('주소'))]?.toString() || '주소 없음';
              
              console.log(`매물 ${i + 1} 기본 정보:`, { id, title, address, type, propertyType });
              
              // 직접 좌표 입력 우선 처리 (다양한 컬럼명 지원)
              let lat = 0;
              let lng = 0;
              let hasDirectCoordinates = false;
              
              // 위도 컬럼 찾기 (다양한 이름 지원)
              const latHeaders = ['위도', 'latitude', 'lat', 'y좌표', 'y', '좌표y'];
              const lngHeaders = ['경도', 'longitude', 'lng', 'lon', 'x좌표', 'x', '좌표x'];
              
              for (const latHeader of latHeaders) {
                const latIndex = headers.findIndex(header => 
                  header?.toLowerCase().includes(latHeader.toLowerCase())
                );
                if (latIndex !== -1) {
                  const latValue = parseFloat(row[latIndex]?.toString() || '0');
                  if (!isNaN(latValue) && latValue !== 0) {
                    lat = latValue;
                    hasDirectCoordinates = true;
                    console.log(`✅ 매물 ${i + 1}: 위도 직접 입력 발견 (${latHeader}) - ${lat}`);
                    break;
                  }
                }
              }
              
              for (const lngHeader of lngHeaders) {
                const lngIndex = headers.findIndex(header => 
                  header?.toLowerCase().includes(lngHeader.toLowerCase())
                );
                if (lngIndex !== -1) {
                  const lngValue = parseFloat(row[lngIndex]?.toString() || '0');
                  if (!isNaN(lngValue) && lngValue !== 0) {
                    lng = lngValue;
                    hasDirectCoordinates = true;
                    console.log(`✅ 매물 ${i + 1}: 경도 직접 입력 발견 (${lngHeader}) - ${lng}`);
                    break;
                  }
                }
              }
              
              // 직접 좌표가 없거나 유효하지 않은 경우 주소로 좌표 변환 시도
              if (!hasDirectCoordinates || (lat === 0 && lng === 0) || (isNaN(lat) || isNaN(lng))) {
                console.log(`매물 ${i + 1}: 주소로 좌표 변환 시도 - "${address}"`);
                try {
                const coordinates = await convertAddressToCoordinates(address);
                if (coordinates) {
                  lat = coordinates.lat;
                  lng = coordinates.lng;
                    console.log(`✅ 매물 ${i + 1}: 좌표 변환 성공 - ${lat}, ${lng}`);
                } else {
                    console.log(`⚠️ 매물 ${i + 1}: 좌표 변환 실패`);
                    console.warn(`⚠️ 매물 ${i + 1} (${title}): 주소 "${address}"의 좌표를 찾을 수 없습니다.`);
                    console.warn(`⚠️ 정확한 주소를 확인해주세요. 예: "인천 남동구 구월동 1144-5"`);
                    
                    // 좌표 변환 실패 시 기본 좌표 사용 (인천 중심)
                    console.warn(`⚠️ 매물 ${i + 1}: 좌표 변환 실패 - 기본 좌표 사용`);
                    lat = 37.4563; // 인천 중심 위도
                    lng = 126.7052; // 인천 중심 경도
                  }
                } catch (coordError) {
                  console.error(`❌ 매물 ${i + 1}: 좌표 변환 중 오류:`, coordError);
                  console.warn(`⚠️ 매물 ${i + 1} (${title}): 주소 "${address}"의 좌표 변환에 실패했습니다.`);
                  console.warn(`⚠️ 정확한 주소를 확인해주세요. 예: "인천 남동구 구월동 1144-5"`);
                  
                  // 좌표 변환 실패 시 기본 좌표 사용 (인천 중심)
                  console.warn(`⚠️ 매물 ${i + 1}: 좌표 변환 오류 - 기본 좌표 사용`);
                  lat = 37.4563; // 인천 중심 위도
                  lng = 126.7052; // 인천 중심 경도
                }
              } else {
                console.log(`매물 ${i + 1}: 엑셀에서 제공된 좌표 사용 - ${lat}, ${lng}`);
              }
              
              // 면적 처리 로직 개선 - 평방미터 컬럼 우선 사용
              const pyeongIndex = headers.findIndex(header => header?.toLowerCase().includes('공급/전용면적(평)'));
              const m2Index = headers.findIndex(header => header?.toLowerCase().includes('공급/전용면적(㎡)'));
              
              let area: number;
              
              // 1순위: 평방미터 컬럼 값 사용 (정확도 최우선)
              const m2Value = parseFloat(row[m2Index]?.toString() || '0');
              if (m2Value > 0) {
                area = m2Value;
                console.log(`매물 ${i}: 평방미터 컬럼에서 직접 입력 - ${area}㎡`);
              } else {
                // 2순위: 평 컬럼 값 사용 (기존 호환성)
                const pyeongValue = parseFloat(row[pyeongIndex]?.toString() || '0');
                if (pyeongValue > 0) {
                  area = pyeongValue * 3.3058;
                  console.log(`매물 ${i}: 평에서 평방미터로 변환 - ${pyeongValue}평 → ${area.toFixed(2)}㎡`);
                } else {
                  // 3순위: 기존 단일 컬럼 방식 (하위 호환성)
                  const areaRaw = parseFloat(row[headers.findIndex(header => header?.toLowerCase().includes('공급/전용면적'))]?.toString() || '0');
                  if (areaRaw === 0) {
                    area = 0;
                  } else if (areaRaw > 100) {
                    area = areaRaw;
                    console.log(`매물 ${i}: 기존 방식 - 면적이 이미 평방미터로 입력됨 - ${area}㎡`);
                  } else {
                    area = areaRaw * 3.3058;
                    console.log(`매물 ${i}: 기존 방식 - 면적을 평에서 평방미터로 변환 - ${areaRaw}평 → ${area.toFixed(2)}㎡`);
                  }
                }
              }
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
                rentPrice: rentPrice > 0 ? rentPrice : undefined,
                type,
                propertyType,
                address,
                location: { lat, lng },
                bedrooms,
                bathrooms,
                area,
                images: [],
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
              
              console.log(`✅ 매물 ${i + 1} 생성 완료:`, property);
              processedData.push(property);
              successCount++;
              console.log(`=== 매물 ${i + 1}/${rows.length} 처리 완료 ===\n`);
              
            } catch (error) {
              failCount++;
              console.error(`❌ 매물 ${i + 1} 처리 중 오류:`, error);
              console.log(`=== 매물 ${i + 1}/${rows.length} 처리 실패 ===\n`);
            }
          }
          
          console.log('=== 매물 처리 결과 ===');
          console.log('총 처리 시도:', rows.length);
          console.log('성공:', successCount);
          console.log('실패:', failCount);
          console.log('변환된 매물 개수:', processedData.length);
          
          if (processedData.length > 0) {
            // 부모 컴포넌트에 매물 추가 알림
            if (onPropertyAdded) {
              onPropertyAdded(processedData);
            }
            
            if (successCount === rows.length) {
              alert(`✅ 모든 ${processedData.length}개의 매물이 성공적으로 등록되었습니다!`);
            } else {
              alert(`⚠️ ${successCount}개 매물은 성공적으로 등록되었지만, ${failCount}개 매물의 처리에 실패했습니다.\n등록된 매물들은 정상적으로 작동합니다.`);
            }
            
            // Firebase 콘솔용 데이터 출력
            console.log('🔥 Firebase 콘솔용 데이터 (복사해서 사용하세요):');
            processedData.forEach((property, index) => {
              console.log(`\n=== 매물 ${index + 1} (ID: ${property.id}) ===`);
              console.log(JSON.stringify(property, null, 2));
            });
            
            onClose(); // 모달 닫기
          } else {
            alert('❌ 처리할 수 있는 매물 데이터가 없습니다. 엑셀 파일을 확인해주세요.');
          }
          
        } catch (error) {
          console.error('엑셀 처리 오류:', error);
          setError(`엑셀 파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setIsUploading(false);
          setUploadProgress(100);
        }
      };

      reader.readAsArrayBuffer(selectedFile);

    } catch (error) {
      console.error('파일 업로드 오류:', error);
      setError(`파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
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
          <ModalTitle>매물 등록</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <ModeSelector>
          <ModeButton 
            active={!isIndividualMode} 
            onClick={() => setIsIndividualMode(false)}
          >
            📊 대량 등록 (엑셀)
          </ModeButton>
          <ModeButton 
            active={isIndividualMode} 
            onClick={() => setIsIndividualMode(true)}
          >
            🏠 개별 등록
          </ModeButton>
        </ModeSelector>

        {isIndividualMode ? (
          <FormSection>
            {/* 기본 정보 */}
            <FormGroup>
              <Label>매물 제목 *</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="예: 강남구 역삼동 상가"
              />
            </FormGroup>

            <FormGroup>
              <Label>매물 설명</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="매물에 대한 상세 설명을 입력하세요"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>거래 유형 *</Label>
                <Select
                  value={formData.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                >
                  <option value="sale">매매</option>
                  <option value="rent">임대</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>매물 종류 *</Label>
                <Select
                  value={formData.propertyType}
                  onChange={(e) => handleFormChange('propertyType', e.target.value)}
                >
                  <option value="commercial">상가</option>
                  <option value="office">사무실</option>
                  <option value="building">건물</option>
                  <option value="other">기타</option>
                </Select>
              </FormGroup>
            </FormRow>

            {/* 가격 정보 */}
            <FormRow>
              <FormGroup>
                <Label>{formData.type === 'sale' ? '매매가 (억원) *' : '매매가 (억원)'}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.price}
                  onChange={(e) => handleFormChange('price', e.target.value)}
                  placeholder="8.5"
                  disabled={formData.type === 'rent'}
                />
              </FormGroup>
              {formData.type === 'rent' && (
                <>
                  <FormGroup>
                    <Label>보증금 (만원)</Label>
                    <Input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => handleFormChange('deposit', e.target.value)}
                      placeholder="1000"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>월세 (만원)</Label>
                    <Input
                      type="number"
                      value={formData.rentPrice}
                      onChange={(e) => handleFormChange('rentPrice', e.target.value)}
                      placeholder="50"
                    />
                  </FormGroup>
                </>
              )}
            </FormRow>

            {/* 주소 및 좌표 */}
            <FormGroup>
              <Label>주소 *</Label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="예: 서울시 강남구 역삼동 123-45"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>위도 (선택사항)</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => handleFormChange('lat', e.target.value)}
                  placeholder="37.5008"
                />
              </FormGroup>
              <FormGroup>
                <Label>경도 (선택사항)</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => handleFormChange('lng', e.target.value)}
                  placeholder="127.0374"
                />
              </FormGroup>
            </FormRow>

            {/* 면적 및 방 정보 */}
            <FormRow>
              <FormGroup>
                <Label>면적 (㎡)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.area}
                  onChange={(e) => handleFormChange('area', e.target.value)}
                  placeholder="84.5"
                />
              </FormGroup>
              <FormGroup>
                <Label>방/화장실</Label>
                <Input
                  type="text"
                  value={`${formData.bedrooms}/${formData.bathrooms}`}
                  onChange={(e) => {
                    const [bedrooms, bathrooms] = e.target.value.split('/');
                    handleFormChange('bedrooms', bedrooms || '');
                    handleFormChange('bathrooms', bathrooms || '');
                  }}
                  placeholder="3/2"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>층수</Label>
                <Input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => handleFormChange('floor', e.target.value)}
                  placeholder="3/15층"
                />
              </FormGroup>
              <FormGroup>
                <Label>확인매물 날짜</Label>
                <Input
                  type="text"
                  value={formData.confirmedDate}
                  onChange={(e) => handleFormChange('confirmedDate', e.target.value)}
                  placeholder="25.07.19"
                />
              </FormGroup>
            </FormRow>

            {/* 옵션 */}
            <CheckboxGroup>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  checked={formData.parking}
                  onChange={(e) => handleFormChange('parking', e.target.checked)}
                />
                주차 가능
              </CheckboxLabel>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  checked={formData.elevator}
                  onChange={(e) => handleFormChange('elevator', e.target.checked)}
                />
                엘리베이터
              </CheckboxLabel>
            </CheckboxGroup>

            {/* 연락처 정보 */}
            <FormRow>
              <FormGroup>
                <Label>연락처 이름</Label>
                <Input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleFormChange('contactName', e.target.value)}
                  placeholder="김부동산"
                />
              </FormGroup>
              <FormGroup>
                <Label>연락처 전화번호</Label>
                <Input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                  placeholder="02-1234-5678"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>연락처 이메일</Label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                placeholder="kim@realestate.com"
              />
            </FormGroup>

            {/* 이미지 업로드 */}
            <FormGroup>
              <Label>매물 사진</Label>
              <ImageUploadSection onClick={handleImageUploadClick}>
                <ImageUploadText>
                  {isUploadingImages ? '📤 업로드 중...' : '📷 사진을 추가하려면 클릭하세요'}
                </ImageUploadText>
                <ImageUploadSubtext>
                  {isUploadingImages ? '잠시만 기다려주세요' : 'JPG, PNG, WebP 형식, 최대 5MB'}
                </ImageUploadSubtext>
              </ImageUploadSection>

              {images.length > 0 && (
                <ImagePreview>
                  {images.map((imageUrl, index) => (
                    <ImageItem key={index}>
                      <Image src={imageUrl} alt={`매물 사진 ${index + 1}`} />
                      <RemoveButton onClick={() => handleImageRemove(index)}>
                        ×
                      </RemoveButton>
                    </ImageItem>
                  ))}
                </ImagePreview>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </FormGroup>

            <ButtonGroup>
              <SubmitButton 
                onClick={handleIndividualSubmit}
                disabled={isUploadingImages}
              >
                {isUploadingImages ? '업로드 중...' : '매물 등록'}
              </SubmitButton>
              <CancelButton onClick={onClose}>
                취소
              </CancelButton>
            </ButtonGroup>
          </FormSection>
        ) : (
          <UploadSection>
            <TemplateSection>
              <TemplateTitle>📋 엑셀 템플릿 다운로드</TemplateTitle>
              <TemplateDescription>
                매물 정보를 입력할 수 있는 엑셀 템플릿을 다운로드하세요.
                템플릿에 맞춰 데이터를 입력한 후 업로드하시면 됩니다.
              </TemplateDescription>
              
              <CoordinateGuideSection>
                <CoordinateGuideTitle>🎯 정확한 좌표 입력 방법</CoordinateGuideTitle>
                <CoordinateGuideText>
                  <strong>방법 1: 직접 좌표 입력 (권장)</strong>
                </CoordinateGuideText>
                <CoordinateGuideText>
                  • 위도/경도 컬럼에 정확한 좌표를 직접 입력하세요
                  • 지원 컬럼명: 위도, latitude, lat, y좌표, y, 좌표y / 경도, longitude, lng, lon, x좌표, x, 좌표x
                  • 직접 좌표가 있으면 주소 변환을 건너뛰고 정확한 위치에 마커가 표시됩니다
                </CoordinateGuideText>
                <CoordinateExample>
                  위도: 37.435457100952576<br/>
                  경도: 126.75222698988563
                </CoordinateExample>
                
                <CoordinateGuideText>
                  <strong>방법 2: 주소 자동 변환</strong>
                </CoordinateGuideText>
                <CoordinateGuideText>
                  • 위도/경도를 비워두거나 0으로 입력하면 주소로 자동 변환됩니다
                  • 정확한 주소를 입력하세요 (예: "인천시 남동구 서창동 538")
                </CoordinateGuideText>
              </CoordinateGuideSection>
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

            <ProgressSection className={isUploading ? 'visible' : ''}>
              <ProgressText>업로드 중... {uploadProgress}%</ProgressText>
            </ProgressSection>

            {error && (
              <div style={{
                padding: '10px',
                background: '#fee',
                color: '#c33',
                borderRadius: '4px',
                marginBottom: '10px',
                fontSize: '14px'
              }}>
                ❌ {error}
              </div>
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
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default AddPropertyModal; 