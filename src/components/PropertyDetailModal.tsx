import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Property } from '../types';

declare global {
  interface Window {
    google: any;
  }
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 4rem 1rem 1rem 1rem;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  height: 85vh;
  display: flex;
  overflow: hidden;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const LeftPanel = styled.div`
  width: 100%;
  padding: 2.5rem 1rem 1rem 1rem;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0 8px 0 8px;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    color: #333;
    background: #f9fafb;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PropertyNumberBox = styled.div`
  background: #f3f4f6;
  border: 0.05px solid #d1d5db;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  color: #374151;
  font-weight: 500;
`;

const ConfirmedDateBox = styled.div`
  background: #f3f4f6;
  border: 0.05px solid #d1d5db;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  color: #059669;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.2;
`;

const EditButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #2563eb;
  }
`;

const SaveButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #059669;
  }
`;

const CancelButton = styled.button`
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #4b5563;
  }
`;

const DeleteButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #c82333;
  }
`;

const EditInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const EditTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const EditSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ImageSection = styled.div`
  margin-bottom: 0.5rem;
  position: relative;
`;

const MainImage = styled.img`
  width: 100%;
  height: 280px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.25rem;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
`;

const ImageCounter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  width: fit-content;
  margin-left: auto;
  margin-right: 0;
`;

const ImageNavigationButton = styled.button`
  position: absolute;
  bottom: 0.3rem;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: translateX(-50%) scale(1.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &.prev {
    left: calc(50% - 30px); /* 가운데에서 왼쪽으로 30px */
  }

  &.next {
    left: calc(50% + 30px); /* 가운데에서 오른쪽으로 30px */
  }
`;

const ImageUploadButton = styled.button`
  position: absolute;
  bottom: 3rem;
  right: 1rem;
  background: #6b7280;
  border: 3px solid #374151;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  line-height: 1;
  padding: 0;
  margin: 0;
  flex-shrink: 0;

  &:hover {
    background: white;
    color: #374151;
    text-shadow: none;
    border-color: #374151;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ImageDeleteButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;

  &:hover {
    background: rgba(220, 38, 38, 1);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const InfoSection = styled.div`
  margin-bottom: 1rem;
`;

const PropertyInfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
`;

const PropertyInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  
  &:last-child {
    border-bottom: none;
  }
`;

const PropertyInfoLabel = styled.span`
  color: #64748b;
  font-weight: 500;
  min-width: 80px;
`;

const PropertyInfoValue = styled.span`
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  flex: 1;
`;

const ContactInfo = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  max-width: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (min-width: 769px) {
    flex-direction: row;
    padding: 1.25rem;
    gap: 1.25rem;
    max-width: 400px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  }
`;

const ContactPhoto = styled.div`
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  aspect-ratio: 1;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  
  @media (min-width: 769px) {
    width: 120px;
    height: 120px;
  }
  
  img {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    object-fit: cover;
    border: 2px solid #e2e8f0;
    display: block;
  }
  
  > div {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`;

const ContactHeader = styled.div`
  margin-bottom: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  
  @media (min-width: 769px) {
    padding-bottom: 0.75rem;
  }
`;

const MobileContactHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const ContactContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0; /* 텍스트 오버플로우 방지 */
  
  @media (min-width: 769px) {
    gap: 0.75rem;
  }
  
  /* 모바일에서 ContactHeader 숨김 */
  @media (max-width: 768px) {
    > ${ContactHeader} {
      display: none;
    }
  }
`;

const ContactName = styled.h3`
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
  word-break: break-word;
  
  @media (min-width: 769px) {
    font-size: 1rem;
  }
`;

const ContactRepresentative = styled.div`
  font-size: 0.75rem;
  font-weight: 400;
  color: #64748b;
  margin-top: 0.25rem;
  line-height: 1.3;
  
  @media (min-width: 769px) {
    font-size: 0.875rem;
    margin-top: 0.375rem;
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  
  @media (min-width: 769px) {
    padding: 0.375rem 0;
    font-size: 0.875rem;
    gap: 0.625rem;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ContactItemEmail = styled(ContactItem)`
  font-size: 0.6875rem; /* 0.75rem에서 1단계 줄임 (11px) */
  
  @media (min-width: 769px) {
    font-size: 0.8125rem; /* 0.875rem에서 1단계 줄임 (13px) */
  }
`;

const ContactLabel = styled.span`
  color: #64748b;
  font-weight: 500;
  flex-shrink: 0;
`;

const ContactValue = styled.span`
  color: #1e293b;
  font-weight: 600;
  flex: 1;
  word-break: keep-all; /* 단어 단위로 줄바꿈 (전화번호 보호) */
  overflow-wrap: break-word; /* 긴 단어만 줄바꿈 */
`;

const Section = styled.div`
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
`;

const MapPlaceholder = styled.div`
  width: 100%;
  height: 200px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1rem;
  position: relative;
  border-radius: 8px;
`;

const MapContainer = styled.div`
  width: 100%;
  height: 225px; /* 300px에서 25% 줄임 (300 * 0.75 = 225) */
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  background: #f3f4f6;
`;

const formatPrice = (price: number) => {
  // 매매가는 억원 단위로 저장되어 있음
  if (price >= 1) {
    return price % 1 === 0 ? `${price}억원` : `${price}억원`;
  } else if (price >= 0.1) {
    return `${price}억원`;
  }
  return `${price}억원`;
};

const formatDeposit = (deposit: number) => {
  // 보증금은 만원 단위로 저장되어 있음 - 만원 단위로만 표시
  return `${deposit}만원`;
};

const maskAddress = (address: string) => {
  if (!address) return '';
  const parts = address.split(' ');
  const maskedParts = parts.slice(0, 3);
  return maskedParts.join(' ');
};

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  onPropertyUpdate?: (updatedProperty: Property) => void;
  onPropertyDelete?: (propertyId: string) => void;
  isAdmin?: boolean;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ 
  property, 
  onClose, 
  onPropertyUpdate, 
  onPropertyDelete, 
  isAdmin = false 
}) => {
  const [currentImages, setCurrentImages] = useState<string[]>(property.images || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Property>(property);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  // property가 변경되면 editData도 업데이트
  useEffect(() => {
    // property 객체를 그대로 사용 (상대 경로는 firebaseSync에서 절대 URL로 변환됨)
    setEditData(property);
    setCurrentImages(property.images || []);
    setCurrentImageIndex(0);
    setPhotoLoadError(false); // 프로필 사진 에러 상태 초기화
    
    // 디버깅: 매물 필드 값 확인
    if (property.type === 'sale') {
      const allKeys = Object.keys(property);
      const numericFields = allKeys.filter(key => {
        const value = (property as any)[key];
        return typeof value === 'number' && !isNaN(value) && value > 0;
      }).map(key => ({ key, value: (property as any)[key] }));
      
      // 기보증금/월세 관련 가능한 필드명 찾기
      const possibleFields = allKeys.filter(key => 
        key.toLowerCase().includes('deposit') || 
        key.toLowerCase().includes('monthly') || 
        key.toLowerCase().includes('rent') ||
        key.includes('기보증금') ||
        key.includes('월세')
      ).map(key => ({ key, value: (property as any)[key], type: typeof (property as any)[key] }));
      
      console.log('🔍 매매용 매물 - 기보증금/월세 디버깅:', {
        propertyId: property.id,
        keyDepositMonthly: property.keyDepositMonthly,
        keyDepositMonthlyType: typeof property.keyDepositMonthly,
        keyDeposit: property.keyDeposit,
        possibleFields: possibleFields,
        numericFields: numericFields,
        allPropertyKeys: allKeys
      });
      
      // possibleFields와 numericFields 상세 출력
      console.log('📋 possibleFields 상세:', possibleFields);
      console.log('📊 numericFields 상세:', numericFields);
      
      // 모든 숫자 필드 출력 (0 포함)
      const allNumericFields = allKeys.filter(key => {
        const value = (property as any)[key];
        return typeof value === 'number' && !isNaN(value);
      }).map(key => ({ key, value: (property as any)[key], type: typeof (property as any)[key] }));
      console.log('🔢 모든 숫자 필드 (0 포함):', allNumericFields);
    } else if (property.type === 'rent') {
      // 임대용 매물 디버깅
      const allKeys = Object.keys(property);
      const numericFields = allKeys.filter(key => {
        const value = (property as any)[key];
        return typeof value === 'number' && !isNaN(value) && value > 0;
      }).map(key => ({ key, value: (property as any)[key] }));
      
      console.log('🔍 임대용 매물 - 필드 디버깅:', {
        propertyId: property.id,
        deposit: property.deposit,
        rentPrice: property.rentPrice,
        keyMoney: property.keyMoney,
        keyMoneyType: typeof property.keyMoney,
        numericFields: numericFields,
        allPropertyKeys: allKeys
      });
    }
  }, [property]);

  // 수정 모드 토글 함수
  const toggleEditMode = () => {
    if (isEditMode) {
      // 편집 모드 종료 시 property로 복원 (상대 경로는 firebaseSync에서 절대 URL로 변환됨)
      setEditData(property);
    }
    setIsEditMode(!isEditMode);
  };

  // 수정 데이터 저장 함수
  const handleSave = () => {
    if (onPropertyUpdate) {
      onPropertyUpdate(editData);
    }
    setIsEditMode(false);
  };

  // 수정 데이터 변경 핸들러
  const handleEditChange = (field: keyof Property, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 수정 데이터 변경 핸들러 (중첩 객체용)
  const handleNestedEditChange = (parentField: string, childField: string, value: any) => {
    setEditData(prev => {
      const parent = prev[parentField as keyof Property] as any;
      return {
        ...prev,
        [parentField]: {
          ...parent,
          [childField]: value
        }
      };
    });
  };

  // 매물 삭제 함수
  const handleDeleteProperty = () => {
    console.log('🗑️ 매물 삭제 시도:', property.id, property.title);
    console.log('onPropertyDelete 함수 존재:', !!onPropertyDelete);

    const isConfirmed = window.confirm(
      `정말로 매물 "${editData.title}" (매물번호: ${editData.id})을(를) 삭제하시겠습니까?\n\n삭제된 매물은 복구할 수 없습니다.`
    );

    if (isConfirmed) {
      console.log('✅ 삭제 확인됨, 삭제 실행');
      if (onPropertyDelete) {
        onPropertyDelete(property.id);
        console.log('✅ onPropertyDelete 호출 완료');
        } else {
        console.error('❌ onPropertyDelete 함수가 없습니다!');
        alert('삭제 기능이 제대로 연결되지 않았습니다. 페이지를 새로고침해주세요.');
        }
      onClose();
    } else {
      console.log('❌ 삭제 취소됨');
    }
  };

  // 이미지 업로드 핸들러 (Firebase Storage 사용)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 파일 선택됨:', e.target.files?.length || 0);
    
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('📄 선택된 파일:', file.name, file.type, file.size);
      
      if (file.type.startsWith('image/')) {
        try {
          // 파일 크기 체크 (5MB 제한)
          if (file.size > 5 * 1024 * 1024) {
            alert('이미지 파일 크기는 5MB 이하여야 합니다.');
            return;
          }

          console.log('🔥 Firebase Storage에 이미지 업로드 시작...');
          
          // Firebase Storage에 이미지 업로드
          const { uploadImage } = await import('../firebase/storageService');
          
          // 업로드 전에 Firebase 인증 상태 확인
          const { auth } = await import('../firebase/config');
          console.log('🔐 Firebase 인증 상태:', auth.currentUser ? '로그인됨' : '로그인 안됨');
          
          const imageUrl = await uploadImage(file, 'properties');
          
          console.log('✅ Firebase Storage 업로드 완료:', imageUrl);
          
          const newImages = [...currentImages, imageUrl];
          setCurrentImages(newImages);
          const updatedProperty = { ...editData, images: newImages };
          setEditData(updatedProperty);
          
          // 즉시 저장
          if (onPropertyUpdate) {
            console.log('💾 매물 정보 저장 중...');
            onPropertyUpdate(updatedProperty);
            console.log('✅ 매물 정보 저장 완료');
          } else {
            console.warn('⚠️ onPropertyUpdate 함수가 없습니다');
          }
          
          console.log('📷 이미지 업로드 완료:', file.name);
          alert('✅ 이미지가 성공적으로 업로드되었습니다!');
          
        } catch (error) {
          console.error('❌ 이미지 업로드 실패:', error);
          console.error('❌ 오류 상세:', error);
          
          // 더 자세한 오류 메시지 제공
          let errorMessage = '이미지 업로드 중 오류가 발생했습니다.';
          if (error instanceof Error) {
            if (error.message.includes('permission')) {
              errorMessage = '권한이 없습니다. 관리자로 로그인해주세요.';
            } else if (error.message.includes('network')) {
              errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
            } else if (error.message.includes('quota')) {
              errorMessage = '저장 공간이 부족합니다.';
      } else {
              errorMessage = `업로드 실패: ${error.message}`;
            }
          }
          
          alert(`❌ ${errorMessage}\n\n다시 시도해주세요.`);
        }
      } else {
        console.warn('⚠️ 이미지 파일이 아님:', file.type);
        alert('이미지 파일만 업로드 가능합니다. (JPG, PNG, WebP)');
      }
    } else {
      console.log('📁 파일이 선택되지 않음');
    }
    
    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = '';
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(newImages);
    const updatedProperty = { ...editData, images: newImages };
    setEditData(updatedProperty);
    
    // 즉시 저장
    if (onPropertyUpdate) {
        onPropertyUpdate(updatedProperty);
    }
    
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
    console.log('🗑️ 이미지 삭제 완료:', index);
  };

  // 프로필 사진 업로드 핸들러
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 프로필 사진 파일 선택됨:', e.target.files?.length || 0);
    
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('📄 선택된 파일:', file.name, file.type, file.size);
      
      if (file.type.startsWith('image/')) {
        try {
          // 파일 크기 체크 (5MB 제한)
          if (file.size > 5 * 1024 * 1024) {
            alert('이미지 파일 크기는 5MB 이하여야 합니다.');
            return;
          }

          console.log('🔥 Firebase Storage에 프로필 사진 업로드 시작...');
          
          // Firebase Storage에 이미지 업로드
          const { uploadImage } = await import('../firebase/storageService');
          
          // 업로드 전에 Firebase 인증 상태 확인
          const { auth } = await import('../firebase/config');
          console.log('🔐 Firebase 인증 상태:', auth.currentUser ? '로그인됨' : '로그인 안됨');
          
          const photoUrl = await uploadImage(file, 'contacts');
          
          console.log('✅ 프로필 사진 Base64 변환 완료:', {
            photoUrlLength: photoUrl.length,
            photoUrlPreview: photoUrl.substring(0, 50) + '...',
            isBase64: photoUrl.startsWith('data:')
          });
          
          // contact 객체가 없으면 생성
          const currentContact = editData.contact || {
            name: '',
            phone: '',
            email: ''
          };
          
          const updatedProperty = { 
            ...editData, 
            contact: {
              ...currentContact,
              photo: photoUrl
            }
          };
          
          console.log('📋 업데이트할 매물 정보:', {
            id: updatedProperty.id,
            hasContact: !!updatedProperty.contact,
            hasPhoto: !!updatedProperty.contact?.photo,
            photoLength: updatedProperty.contact?.photo?.length || 0
          });
          
          setEditData(updatedProperty);
          
          // 즉시 저장
          if (onPropertyUpdate) {
            console.log('💾 매물 정보 저장 시작...');
            try {
              await onPropertyUpdate(updatedProperty);
              console.log('✅ 매물 정보 저장 완료');
            } catch (saveError) {
              console.error('❌ 매물 정보 저장 실패:', saveError);
              throw saveError;
            }
          } else {
            console.warn('⚠️ onPropertyUpdate 함수가 없습니다');
            alert('⚠️ 저장 함수가 없습니다. 페이지를 새로고침해주세요.');
          }
          
          console.log('📷 프로필 사진 업로드 완료:', file.name);
          alert('✅ 프로필 사진이 성공적으로 업로드되었습니다!');
          
        } catch (error) {
          console.error('❌ 프로필 사진 업로드 실패:', error);
          console.error('❌ 오류 상세:', error);
          
          // 더 자세한 오류 메시지 제공
          let errorMessage = '프로필 사진 업로드 중 오류가 발생했습니다.';
          if (error instanceof Error) {
            if (error.message.includes('permission')) {
              errorMessage = '권한이 없습니다. 관리자로 로그인해주세요.';
            } else if (error.message.includes('network')) {
              errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
            } else if (error.message.includes('quota')) {
              errorMessage = '저장 공간이 부족합니다.';
            } else {
              errorMessage = `업로드 실패: ${error.message}`;
            }
          }
          
          alert(`❌ ${errorMessage}\n\n다시 시도해주세요.`);
        }
      } else {
        console.warn('⚠️ 이미지 파일이 아님:', file.type);
        alert('이미지 파일만 업로드 가능합니다. (JPG, PNG, WebP)');
      }
    } else {
      console.log('📁 파일이 선택되지 않음');
    }
    
    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = '';
  };

  // 펌방지 기능
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };


  // 위치정보 지도 초기화 (mapImage가 없고 location이 있는 경우)
  useEffect(() => {
    if (!mapRef.current || !editData.location || editData.mapImage) {
      return;
    }

    const initMap = () => {
      if (!window.google || !window.google.maps) {
        // Google Maps API가 아직 로드되지 않은 경우 재시도
        setTimeout(() => {
          initMap();
        }, 500);
        return;
      }

      try {
        // 기존 지도 인스턴스 제거
        if (mapInstanceRef.current) {
          mapInstanceRef.current = null;
        }
        if (markerRef.current) {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }

        const location = editData.location;
        if (!location || !location.lat || !location.lng) {
          return;
        }

        // 지도 생성
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: location.lat, lng: location.lng },
          zoom: 16,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          disableDefaultUI: false,
          clickableIcons: false,
          draggable: true,
          scrollwheel: true,
        });

        mapInstanceRef.current = map;

        // 마커 생성 (원형, 진회색, 반투명, 50% 더 넓게)
        const markerIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="21" fill="#4b5563" fill-opacity="0.7" stroke="#374151" stroke-width="3" stroke-opacity="0.8"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(48, 48),
          anchor: new window.google.maps.Point(24, 24)
        };

        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          title: editData.address || editData.title,
          icon: markerIcon,
        });

        markerRef.current = marker;

        // 정보창 생성 (선택사항)
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 0.5rem;">
              <strong>${editData.title}</strong><br/>
              <span style="color: #666; font-size: 0.875rem;">${editData.address}</span>
            </div>
          `,
        });

        // 마커 클릭 시 정보창 표시
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

      } catch (error) {
        console.error('지도 초기화 오류:', error);
      }
    };

    initMap();

    // cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [editData.location, editData.mapImage, editData.address, editData.title]);

  return (
    <>
    <ModalOverlay 
        onClick={(e) => {
          // 모달 배경 클릭 시에만 닫기
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
        <ModalContent 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
        <CloseButton onClick={onClose}>&times;</CloseButton>
        
        <LeftPanel>
          <Header>
            <HeaderLeft>
              <PropertyNumberBox>
                매물번호<br />
                  {editData.id}
              </PropertyNumberBox>
            </HeaderLeft>
              <HeaderRight>
              </HeaderRight>
              <ConfirmedDateBox>
                확인매물<br />
                {editData.confirmedDate || '25.07.19'}
              </ConfirmedDateBox>
          </Header>

          <ImageSection>
            {currentImages.length > 0 ? (
              <>
                <ImageNavigationButton 
                  className="prev" 
                  onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))} 
                  disabled={currentImageIndex === 0}
                >
                  &lt;
                </ImageNavigationButton>
                <ImageNavigationButton 
                  className="next" 
                  onClick={() => setCurrentImageIndex(prev => Math.min(currentImages.length - 1, prev + 1))} 
                  disabled={currentImageIndex === currentImages.length - 1}
                >
                  &gt;
                </ImageNavigationButton>
                <ImageContainer>
                    <MainImage src={currentImages[currentImageIndex]} alt={editData.title} />
                </ImageContainer>
                <ImageCounter>{currentImageIndex + 1}/{currentImages.length}</ImageCounter>
              </>
            ) : (
              <div style={{
                width: '100%',
                height: '280px',
                background: '#f3f4f6',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '1rem',
                position: 'relative'
              }}>
              </div>
            )}
          </ImageSection>

          <InfoSection>
            <SectionTitle>매물정보</SectionTitle>
            <PropertyInfoGrid>
              <PropertyInfoItem>
                <PropertyInfoLabel>주소</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.address}
                        onChange={(e) => handleEditChange('address', e.target.value)}
                        placeholder="주소를 입력하세요"
                      />
                    ) : (
                      maskAddress(editData.address)
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>매물종류</PropertyInfoLabel>
                <PropertyInfoValue>
                    {isEditMode ? (
                      <EditSelect
                        value={editData.propertyType}
                        onChange={(e) => handleEditChange('propertyType', e.target.value)}
                      >
                        <option value="commercial">상가</option>
                        <option value="office">사무실</option>
                        <option value="building">건물</option>
                        <option value="other">기타</option>
                      </EditSelect>
                    ) : (
                      editData.propertyType === 'commercial' ? '상가' :
                      editData.propertyType === 'office' ? '사무실' :
                      editData.propertyType === 'building' ? '건물' : '기타'
                    )}
                </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>거래유형</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditSelect
                        value={editData.type}
                        onChange={(e) => handleEditChange('type', e.target.value)}
                      >
                        <option value="sale">매매</option>
                        <option value="rent">임대</option>
                      </EditSelect>
                    ) : (
                      editData.type === 'sale' ? '매매' : '임대'
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
                {editData.type === 'sale' ? (
                  <>
              <PropertyInfoItem>
                <PropertyInfoLabel>매매가</PropertyInfoLabel>
                      <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            type="number"
                            value={editData.price}
                            onChange={(e) => handleEditChange('price', parseInt(e.target.value) || 0)}
                            placeholder="매매가를 입력하세요 (억 단위)"
                          />
                        ) : (
                          editData.price && editData.price > 0 ? formatPrice(editData.price) : '정보 없음'
                        )}
                      </PropertyInfoValue>
              </PropertyInfoItem>
                    <PropertyInfoItem>
                      <PropertyInfoLabel>기보증금/월세</PropertyInfoLabel>
                      <PropertyInfoValue>
                        {isEditMode ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>기보증금:</span>
                              <EditInput
                                type="number"
                                value={editData.deposit || 0}
                                onChange={(e) => handleEditChange('deposit', parseInt(e.target.value) || 0)}
                                placeholder="기보증금 (만원)"
                                style={{ flex: 1 }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>기월세:</span>
                              <EditInput
                                type="number"
                                value={editData.rentPrice || 0}
                                onChange={(e) => handleEditChange('rentPrice', parseInt(e.target.value) || 0)}
                                placeholder="기월세 (만원)"
                                style={{ flex: 1 }}
                              />
                            </div>
                          </div>
                        ) : (
                          (() => {
                            // 매매용 매물에서: deposit(기보증금)과 rentPrice(기월세) 확인
                            const deposit = editData.deposit;
                            const rentPrice = editData.rentPrice;
                            const depositValue = typeof deposit === 'number' ? deposit : (deposit ? parseFloat(deposit) : undefined);
                            const rentPriceValue = typeof rentPrice === 'number' ? rentPrice : (rentPrice ? parseFloat(rentPrice) : undefined);
                            
                            // keyDepositMonthly가 있으면 우선 사용
                            const keyDepositMonthly = editData.keyDepositMonthly;
                            const keyDepositMonthlyValue = typeof keyDepositMonthly === 'number' ? keyDepositMonthly : (keyDepositMonthly ? parseFloat(keyDepositMonthly) : undefined);
                            
                            if (keyDepositMonthlyValue !== undefined && keyDepositMonthlyValue !== null && !isNaN(keyDepositMonthlyValue) && keyDepositMonthlyValue > 0) {
                              return `${keyDepositMonthlyValue}만원`;
                            }
                            
                            // deposit(기보증금)과 rentPrice(기월세) 조합
                            const hasDeposit = depositValue !== undefined && depositValue !== null && !isNaN(depositValue) && depositValue > 0;
                            const hasRentPrice = rentPriceValue !== undefined && rentPriceValue !== null && !isNaN(rentPriceValue) && rentPriceValue > 0;
                            
                            if (hasDeposit && hasRentPrice) {
                              return `${depositValue}만원/${rentPriceValue}만원`;
                            } else if (hasDeposit) {
                              return `${depositValue}만원/-`;
                            } else if (hasRentPrice) {
                              return `-/${rentPriceValue}만원`;
                            }
                            
                            return '-';
                          })()
                        )}
                      </PropertyInfoValue>
                    </PropertyInfoItem>
                    <PropertyInfoItem>
                      <PropertyInfoLabel>관리비</PropertyInfoLabel>
                      <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            type="number"
                            value={editData.maintenanceFee || 0}
                            onChange={(e) => handleEditChange('maintenanceFee', parseInt(e.target.value) || 0)}
                            placeholder="관리비 (만원)"
                          />
                        ) : (
                          editData.maintenanceFee && editData.maintenanceFee > 0
                            ? `${editData.maintenanceFee.toLocaleString()}만원`
                            : '-'
                        )}
                      </PropertyInfoValue>
                    </PropertyInfoItem>
                    <PropertyInfoItem>
                      <PropertyInfoLabel>관리비포함항목</PropertyInfoLabel>
                      <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            value={editData.maintenanceIncluded || ''}
                            onChange={(e) => handleEditChange('maintenanceIncluded', e.target.value)}
                            placeholder="관리비포함항목"
                          />
                        ) : (
                          editData.maintenanceIncluded || '-'
                        )}
                      </PropertyInfoValue>
                    </PropertyInfoItem>
                    <PropertyInfoItem>
                      <PropertyInfoLabel>융자금</PropertyInfoLabel>
                      <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            type="number"
                            value={(editData as any).premium || editData.loanAmount || 0}
                            onChange={(e) => {
                              // premium 필드에 저장 (매매용에서 융자금은 premium으로 저장)
                              handleEditChange('premium' as any, parseInt(e.target.value) || 0);
                              // loanAmount도 함께 업데이트 (호환성)
                              handleEditChange('loanAmount', parseInt(e.target.value) || 0);
                            }}
                            placeholder="융자금 (만원)"
                          />
                        ) : (
                          (() => {
                            // 매매용 매물에서: premium이 융자금
                            const premium = (editData as any).premium;
                            const loanAmount = editData.loanAmount;
                            
                            const premiumValue = typeof premium === 'number' ? premium : (premium ? parseFloat(premium) : undefined);
                            const loanAmountValue = typeof loanAmount === 'number' ? loanAmount : (loanAmount ? parseFloat(loanAmount) : undefined);
                            
                            // premium 우선, 없으면 loanAmount
                            const value = premiumValue || loanAmountValue;
                            
                            if (value !== undefined && value !== null && !isNaN(value) && value > 0) {
                              return `${value}만원`;
                            }
                            return '-';
                          })()
                        )}
                      </PropertyInfoValue>
                    </PropertyInfoItem>
                  </>
                ) : (
                <>
                  <PropertyInfoItem>
                    <PropertyInfoLabel>보증금</PropertyInfoLabel>
                    <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            type="number"
                            value={editData.deposit || 0}
                            onChange={(e) => handleEditChange('deposit', parseInt(e.target.value) || 0)}
                            placeholder="보증금 (만원)"
                          />
                        ) : (
                          (() => {
                            const deposit = editData.deposit;
                            const depositValue = typeof deposit === 'number' ? deposit : (deposit ? parseFloat(deposit) : undefined);
                            
                            if (depositValue !== undefined && depositValue !== null && !isNaN(depositValue) && depositValue > 0) {
                              return `${depositValue}만원`;
                            }
                            return '정보 없음';
                          })()
                        )}
                    </PropertyInfoValue>
                  </PropertyInfoItem>
                  <PropertyInfoItem>
                    <PropertyInfoLabel>월세</PropertyInfoLabel>
                    <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            type="number"
                            value={editData.rentPrice || 0}
                            onChange={(e) => handleEditChange('rentPrice', parseInt(e.target.value) || 0)}
                            placeholder="월세 (만원)"
                          />
                        ) : (
                          (() => {
                            const rentPrice = editData.rentPrice;
                            const rentPriceValue = typeof rentPrice === 'number' ? rentPrice : (rentPrice ? parseFloat(rentPrice) : undefined);
                            
                            if (rentPriceValue !== undefined && rentPriceValue !== null && !isNaN(rentPriceValue) && rentPriceValue > 0) {
                              return `${rentPriceValue}만원`;
                            }
                            return '정보 없음';
                          })()
                        )}
                    </PropertyInfoValue>
                  </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>관리비</PropertyInfoLabel>
                      <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            type="number"
                            value={editData.maintenanceFee || 0}
                            onChange={(e) => handleEditChange('maintenanceFee', parseInt(e.target.value) || 0)}
                            placeholder="관리비 (만원)"
                          />
                        ) : (
                          editData.maintenanceFee && editData.maintenanceFee > 0
                            ? `${editData.maintenanceFee.toLocaleString()}만원`
                            : '-'
                        )}
                      </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                      <PropertyInfoLabel>관리비포함항목</PropertyInfoLabel>
                      <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            value={editData.maintenanceIncluded || ''}
                            onChange={(e) => handleEditChange('maintenanceIncluded', e.target.value)}
                            placeholder="관리비포함항목"
                          />
                        ) : (
                          editData.maintenanceIncluded || '-'
                        )}
                      </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                      <PropertyInfoLabel>권리금</PropertyInfoLabel>
                      <PropertyInfoValue>
                        {isEditMode ? (
                          <EditInput
                            type="number"
                            value={editData.keyMoney || (editData as any).premium || 0}
                            onChange={(e) => {
                              // keyMoney와 premium 모두 업데이트 (호환성)
                              handleEditChange('keyMoney', parseInt(e.target.value) || 0);
                              handleEditChange('premium' as any, parseInt(e.target.value) || 0);
                            }}
                            placeholder="권리금 (만원)"
                          />
                        ) : (
                          (() => {
                            // 임대용 매물에서: keyMoney 또는 premium이 권리금
                            const keyMoney = editData.keyMoney;
                            const premium = (editData as any).premium;
                            
                            const keyMoneyValue = typeof keyMoney === 'number' ? keyMoney : (keyMoney ? parseFloat(keyMoney) : undefined);
                            const premiumValue = typeof premium === 'number' ? premium : (premium ? parseFloat(premium) : undefined);
                            
                            // keyMoney 우선, 없으면 premium
                            const value = keyMoneyValue || premiumValue;
                            
                            if (value !== undefined && value !== null && !isNaN(value) && value > 0) {
                              return `${value}만원`;
                            }
                            return '-';
                          })()
                        )}
                </PropertyInfoValue>
              </PropertyInfoItem>
                  </>
                )}
                <PropertyInfoItem>
                  <PropertyInfoLabel>매물현황</PropertyInfoLabel>
                <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.propertyStatus || ''}
                        onChange={(e) => handleEditChange('propertyStatus', e.target.value)}
                        placeholder="매물현황 (예: 임대중, 매매중)"
                      />
                    ) : (
                      (() => {
                        const propertyStatus = editData.propertyStatus;
                        // propertyStatus 필드가 있으면 우선 사용
                        if (propertyStatus && typeof propertyStatus === 'string' && propertyStatus.trim() !== '') {
                          return propertyStatus.trim();
                        }
                        // propertyStatus가 없으면 type 필드를 기반으로 표시 (PC 사이트 방식)
                        if (editData.type === 'sale') {
                          return '매매중';
                        } else if (editData.type === 'rent') {
                          return '임대중';
                        }
                        return '-';
                      })()
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>면적정보</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>공급면적:</span>
                          <EditInput
                            type="number"
                            step="0.1"
                            value={editData.supplyArea ? Math.round(editData.supplyArea / 3.3058) : Math.round(editData.area / 3.3058)}
                            onChange={(e) => {
                              const pyeongValue = parseFloat(e.target.value) || 0;
                              const m2Value = pyeongValue * 3.3058;
                              handleEditChange('supplyArea', m2Value);
                            }}
                            placeholder="공급면적 (평)"
                            style={{ flex: 1 }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>전용면적:</span>
                          <EditInput
                            type="number"
                            step="0.1"
                            value={editData.dedicatedArea ? Math.round(editData.dedicatedArea / 3.3058) : Math.round(editData.area / 3.3058)}
                            onChange={(e) => {
                              const pyeongValue = parseFloat(e.target.value) || 0;
                              const m2Value = pyeongValue * 3.3058;
                              handleEditChange('dedicatedArea', m2Value);
                            }}
                            placeholder="전용면적 (평)"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const supplyArea = editData.supplyArea || editData.area;
                        const dedicatedArea = editData.dedicatedArea || editData.area;
                        const supplyAreaM2 = parseFloat(supplyArea.toFixed(2));
                        const supplyAreaPyeong = parseFloat((supplyArea / 3.3058).toFixed(2));
                        const dedicatedAreaM2 = parseFloat(dedicatedArea.toFixed(2));
                        const dedicatedAreaPyeong = parseFloat((dedicatedArea / 3.3058).toFixed(2));
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>공급{supplyAreaM2}m²({supplyAreaPyeong}평)</span>
                            <span>전용{dedicatedAreaM2}m²({dedicatedAreaPyeong}평)</span>
                          </div>
                        );
                      })()
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>주요구조부</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.mainStructure || ''}
                        onChange={(e) => handleEditChange('mainStructure', e.target.value)}
                        placeholder="주요구조부"
                      />
                    ) : (
                      editData.mainStructure || '-'
                    )}
                </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>해당층/전체층</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.floor || ''}
                        onChange={(e) => handleEditChange('floor', e.target.value)}
                        placeholder="예: 2/5층"
                      />
                    ) : (
                      editData.floor || '-'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>건축물용도</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.buildingUse || ''}
                        onChange={(e) => handleEditChange('buildingUse', e.target.value)}
                        placeholder="건축물용도 (예: 제2종 일반주거지역, 제1종 근린생활시설)"
                      />
                    ) : (
                      (() => {
                        const buildingUse = editData.buildingUse;
                        // buildingUse 필드가 있으면 우선 사용
                        if (buildingUse && typeof buildingUse === 'string' && buildingUse.trim() !== '') {
                          return buildingUse.trim();
                        }
                        // buildingUse가 없으면 공란
                        return '';
                      })()
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>방/화장실</PropertyInfoLabel>
                <PropertyInfoValue>
                    {isEditMode ? (
                      (() => {
                        // roomBathInfo가 있으면 텍스트 입력 필드 사용
                        if (editData.roomBathInfo) {
                          return (
                            <EditInput
                              value={editData.roomBathInfo || ''}
                              onChange={(e) => handleEditChange('roomBathInfo', e.target.value)}
                              placeholder="방/화장실 (예: 내부남녀혼용, 외부남녀구분)"
                            />
                          );
                        }
                        // roomBathInfo가 없으면 숫자 입력 필드 사용
                        return (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <EditInput
                              type="number"
                              value={editData.bedrooms || 0}
                              onChange={(e) => handleEditChange('bedrooms', parseInt(e.target.value) || 0)}
                              placeholder="방"
                              style={{ flex: 1 }}
                            />
                            <span>/</span>
                            <EditInput
                              type="number"
                              value={editData.bathrooms || 0}
                              onChange={(e) => handleEditChange('bathrooms', parseInt(e.target.value) || 0)}
                              placeholder="화장실"
                              style={{ flex: 1 }}
                            />
                          </div>
                        );
                      })()
                    ) : (
                      (() => {
                        const roomBathInfo = editData.roomBathInfo;
                        // roomBathInfo 필드가 있으면 우선 사용
                        if (roomBathInfo && typeof roomBathInfo === 'string' && roomBathInfo.trim() !== '') {
                          return roomBathInfo.trim();
                        }
                        // roomBathInfo가 없으면 bedrooms/bathrooms 숫자로 표시
                        return `${editData.bedrooms || 0} / ${editData.bathrooms || 0}`;
                      })()
                    )}
                </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                  <PropertyInfoLabel>방향</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.direction || ''}
                        onChange={(e) => handleEditChange('direction', e.target.value)}
                        placeholder="방향"
                      />
                    ) : (
                      editData.direction || '-'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>냉/난방</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.coolingHeating || ''}
                        onChange={(e) => handleEditChange('coolingHeating', e.target.value)}
                        placeholder="냉/난방"
                      />
                    ) : (
                      editData.coolingHeating || '-'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>인테리어</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.interior || ''}
                        onChange={(e) => handleEditChange('interior', e.target.value)}
                        placeholder="인테리어"
                      />
                    ) : (
                      editData.interior || '-'
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>주차</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditSelect
                        value={editData.parking ? 'true' : 'false'}
                        onChange={(e) => handleEditChange('parking', e.target.value === 'true')}
                      >
                        <option value="true">가능</option>
                        <option value="false">불가능</option>
                      </EditSelect>
                    ) : (
                      editData.parking ? '가능' : '불가능'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>주차대수</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        type="text"
                        value={editData.parkingCount ? String(editData.parkingCount) : ''}
                        onChange={(e) => handleEditChange('parkingCount', e.target.value)}
                        placeholder="주차대수"
                      />
                    ) : (
                      editData.parkingCount && String(editData.parkingCount).trim() !== '' ? String(editData.parkingCount) : '-'
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>엘리베이터</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditSelect
                        value={editData.elevator ? 'true' : 'false'}
                        onChange={(e) => handleEditChange('elevator', e.target.value === 'true')}
                      >
                        <option value="true">있음</option>
                        <option value="false">없음</option>
                      </EditSelect>
                    ) : (
                      editData.elevator ? '있음' : '없음'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>입주가능일</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.moveInDate || ''}
                        onChange={(e) => handleEditChange('moveInDate', e.target.value)}
                        placeholder="입주가능일"
                      />
                    ) : (
                      editData.moveInDate || '-'
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>사용승인일</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.approvalDate || ''}
                        onChange={(e) => handleEditChange('approvalDate', e.target.value)}
                        placeholder="사용승인일"
                      />
                    ) : (
                      editData.approvalDate || '-'
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                  <PropertyInfoLabel>추천업종</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.recommendedBusiness || ''}
                        onChange={(e) => handleEditChange('recommendedBusiness', e.target.value)}
                        placeholder="추천업종"
                        style={{ color: '#dc2626' }}
                      />
                    ) : (
                      <span style={{ color: '#dc2626' }}>
                        {editData.recommendedBusiness || '-'}
                      </span>
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
            </PropertyInfoGrid>
          </InfoSection>

          <Section>
            <SectionTitle>매물설명</SectionTitle>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {isEditMode ? (
                  <EditTextarea
                    value={editData.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    placeholder="매물 설명을 입력하세요"
                  />
                ) : (
                  editData.description
                )}
            </div>
          </Section>

          <Section>
            <SectionTitle>연락처</SectionTitle>
            <ContactInfo>
              {/* 모바일: 상단에 헤더 먼저 표시 */}
              <MobileContactHeader>
                <ContactHeader>
                  <ContactName>
                    {isEditMode ? (
                      <EditInput
                        value={editData.contact.companyName || ''}
                        onChange={(e) => handleNestedEditChange('contact', 'companyName', e.target.value)}
                        placeholder="상호명을 입력하세요"
                      />
                    ) : (
                      <>
                        <span>
                          {editData.contact.companyName || editData.contact.name?.replace(/대표\s*.*/g, '').trim() || ''}
                        </span>
                        {(() => {
                          let representativeName = editData.contact.name || '';
                          if (editData.contact.companyName) {
                            representativeName = representativeName.replace(editData.contact.companyName, '').trim();
                          }
                          representativeName = representativeName.replace(/대표\s*/g, '').trim();
                          representativeName = representativeName.replace(/피에이공인중개사사무소\s*/g, '').trim();
                          const namePattern = /^[가-힣]{2,4}$/;
                          if (representativeName && namePattern.test(representativeName)) {
                            return (
                              <span style={{ fontWeight: 400, marginLeft: '0.5rem' }}>
                                대표 {representativeName}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                  </ContactName>
                </ContactHeader>
              </MobileContactHeader>
              
              {/* 사진과 나머지 정보를 가로로 배치 */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                width: '100%', 
                alignItems: 'flex-start',
                flexDirection: 'row'
              }}>
                <ContactPhoto>
                {isEditMode ? (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    background: '#f9fafb',
                    cursor: 'pointer'
                  }}
                  onClick={() => photoInputRef.current?.click()}
                  >
                    {(() => {
                      const photoUrl = editData.contact?.photo || property.contact?.photo || '';
                      const isValidUrl = photoUrl && (
                        photoUrl.startsWith('data:') ||
                        photoUrl.startsWith('http://') ||
                        photoUrl.startsWith('https://') ||
                        photoUrl.startsWith('blob:')
                      );
                      // 상대 경로는 firebaseSync에서 절대 URL로 변환되므로 별도 처리 불필요
                      if (isValidUrl && !photoLoadError) {
                        return (
                          <img 
                            src={photoUrl} 
                            alt="프로필 사진" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => {
                              console.error('❌ 프로필 사진 로드 실패 (편집 모드):', {
                                propertyId: editData.id,
                                editDataHasPhoto: !!editData.contact?.photo,
                                propertyHasPhoto: !!property.contact?.photo,
                                src: (e.target as HTMLImageElement).src?.substring(0, 100),
                                photoUrl: photoUrl.substring(0, 100) + '...'
                              });
                              setPhotoLoadError(true);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ 프로필 사진 로드 성공 (편집 모드):', {
                                propertyId: editData.id,
                                editDataHasPhoto: !!editData.contact?.photo,
                                propertyHasPhoto: !!property.contact?.photo
                              });
                              setPhotoLoadError(false);
                            }}
                          />
                        );
                      }
                      
                      return (
                        <>
                          <span style={{ fontSize: '2rem' }}>📷</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            프로필 사진 업로드
                          </span>
                        </>
                      );
                    })()}
                  </div>
                ) : (() => {
                  const photoUrl = editData.contact?.photo || property.contact?.photo || '';
                  const isValidUrl = photoUrl && (
                    photoUrl.startsWith('data:') || // Base64
                    photoUrl.startsWith('http://') || // HTTP URL
                    photoUrl.startsWith('https://') || // HTTPS URL
                    photoUrl.startsWith('blob:') // Blob URL
                  );
                  
                  // 상대 경로인 경우 (예: /contact-photo.jpg)는 절대 URL로 변환되어 이미 isValidUrl에 포함됨
                  // 유효한 URL이고 에러가 없는 경우 이미지 표시
                  if (isValidUrl && !photoLoadError) {
                    return (
                      <img 
                        src={photoUrl} 
                        alt="프로필 사진" 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e2e8f0'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const src = target.src || photoUrl;
                          const isBase64 = src.startsWith('data:');
                          const srcLength = src.length;
                          const isHttpUrl = src.startsWith('http://') || src.startsWith('https://');
                          
                          console.error('❌ 프로필 사진 로드 실패:', {
                            propertyId: editData.id,
                            editDataHasPhoto: !!editData.contact?.photo,
                            propertyHasPhoto: !!property.contact?.photo,
                            photoUrl: photoUrl.substring(0, 150),
                            isBase64: isBase64,
                            isHttpUrl: isHttpUrl,
                            srcLength: srcLength,
                            srcPreview: src.substring(0, 150),
                            fullUrl: isHttpUrl ? src : 'N/A',
                            error: '이미지 로드 실패 - URL이 존재하지 않거나 접근 불가능할 수 있습니다',
                            // 원본 Firebase 데이터 확인
                            originalPhoto: property.contact?.photo ? property.contact.photo.substring(0, 150) : '없음'
                          });
                          
                          // Base64 이미지가 너무 긴 경우 경고
                          if (isBase64 && srcLength > 1000000) {
                            console.warn('⚠️ Base64 이미지가 너무 깁니다 (1MB 초과):', srcLength);
                          }
                          
                          // HTTP/HTTPS URL인 경우 URL 접근성 확인
                          if (isHttpUrl) {
                            console.warn('⚠️ HTTP URL 이미지 로드 실패 - URL이 존재하지 않거나 CORS 문제일 수 있습니다:', {
                              url: src.substring(0, 150),
                              fullUrl: src,
                              note: 'PC 사이트의 public 폴더에 파일이 없거나, Firebase Storage URL을 사용해야 할 수 있습니다.'
                            });
                          }
                          
                          setPhotoLoadError(true);
                          target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('✅ 프로필 사진 로드 성공:', {
                            propertyId: editData.id,
                            editDataHasPhoto: !!editData.contact?.photo,
                            propertyHasPhoto: !!property.contact?.photo,
                            srcLength: photoUrl.length,
                            photoType: photoUrl.startsWith('data:') ? 'Base64' : 'URL'
                          });
                          setPhotoLoadError(false);
                        }}
                      />
                    );
                  }
                  
                  // 유효하지 않은 URL이거나 에러가 있는 경우 대체 UI 표시
                  if ((photoUrl && !isValidUrl) || photoLoadError || !photoUrl) {
                    return (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        background: '#f3f4f6'
                      }}>
                        <span style={{ fontSize: '2rem', color: '#9ca3af' }}>👤</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {photoLoadError ? '프로필 사진 없음' : '프로필 사진 없음'}
                        </span>
                      </div>
                    );
                  }
                  
                  // 프로필 사진이 없는 경우
                  return (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#f3f4f6'
                    }}>
                      <span style={{ fontSize: '2rem', color: '#9ca3af' }}>👤</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>프로필 사진 없음</span>
                    </div>
                  );
                })()}
                </ContactPhoto>
                <ContactContent>
                <ContactHeader>
                  <ContactName>
                    {isEditMode ? (
                      <EditInput
                        value={editData.contact.companyName || ''}
                        onChange={(e) => handleNestedEditChange('contact', 'companyName', e.target.value)}
                        placeholder="상호명을 입력하세요"
                      />
                    ) : (
                      <>
                        <span>
                          {editData.contact.companyName || editData.contact.name?.replace(/대표\s*.*/g, '').trim() || ''}
                        </span>
                        {(() => {
                          let representativeName = editData.contact.name || '';
                          if (editData.contact.companyName) {
                            representativeName = representativeName.replace(editData.contact.companyName, '').trim();
                          }
                          representativeName = representativeName.replace(/대표\s*/g, '').trim();
                          representativeName = representativeName.replace(/피에이공인중개사사무소\s*/g, '').trim();
                          const namePattern = /^[가-힣]{2,4}$/;
                          if (representativeName && namePattern.test(representativeName)) {
                            return (
                              <span style={{ fontWeight: 400, marginLeft: '0.5rem' }}>
                                대표 {representativeName}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                  </ContactName>
                  {(() => {
                    // 대표자명 추출: name에서 상호명과 "대표" 제거
                    let representativeName = editData.contact.name || '';
                    
                    // companyName이 있으면 name에서 제거
                    if (editData.contact.companyName) {
                      representativeName = representativeName.replace(editData.contact.companyName, '').trim();
                    }
                    
                    // "대표" 제거
                    representativeName = representativeName.replace(/대표\s*/g, '').trim();
                    
                    // 상호명 패턴 제거 (혹시 남아있을 경우)
                    representativeName = representativeName.replace(/피에이공인중개사사무소\s*/g, '').trim();
                    
                    // 대표자명만 남았는지 확인 (한글 이름 패턴: 2-4자 한글)
                    const namePattern = /^[가-힣]{2,4}$/;
                    if (representativeName && namePattern.test(representativeName)) {
                      return (
                        <ContactRepresentative>
                          {isEditMode ? (
                            <EditInput
                              value={representativeName}
                              onChange={(e) => handleNestedEditChange('contact', 'name', e.target.value)}
                              placeholder="대표자명을 입력하세요"
                              style={{ fontSize: '0.875rem', fontWeight: 400, color: '#64748b' }}
                            />
                          ) : (
                            `대표 ${representativeName}`
                          )}
                        </ContactRepresentative>
                      );
                    }
                    return null;
                  })()}
                </ContactHeader>
                {(() => {
                  // 전화번호 배열 생성 (phones 배열이 있으면 사용, 없으면 phone, phone2를 배열로 변환)
                  const getPhones = (): string[] => {
                    if (editData.contact.phones && editData.contact.phones.length > 0) {
                      return editData.contact.phones;
                    }
                    const phones: string[] = [];
                    // phone 필드에 쉼표가 있으면 분리
                    if (editData.contact.phone) {
                      const phoneParts = editData.contact.phone.split(',').map(p => p.trim()).filter(p => p);
                      phones.push(...phoneParts);
                    }
                    if (editData.contact.phone2) {
                      const phone2Parts = editData.contact.phone2.split(',').map(p => p.trim()).filter(p => p);
                      phones.push(...phone2Parts);
                    }
                    return phones;
                  };

                  let phones = getPhones();
                  
                  // 편집 모드이고 전화번호가 1개 이하일 때 기본적으로 2개까지 표시
                  if (isEditMode && phones.length < 2) {
                    while (phones.length < 2) {
                      phones.push('');
                    }
                  }
                  
                  const hasPhones = phones.length > 0 || isEditMode;

                  if (!hasPhones) return null;

                  return (
                    <>
                      {phones.map((phone, index) => (
                        <ContactItem key={index}>
                          <ContactLabel>전화번호{phones.length > 1 ? ` ${index + 1}` : ''}</ContactLabel>
                          <ContactValue>
                            {isEditMode ? (
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <EditInput
                                  value={phone}
                                  onChange={(e) => {
                                    const newPhones = [...phones];
                                    newPhones[index] = e.target.value;
                                    handleNestedEditChange('contact', 'phones', newPhones);
                                  }}
                                  placeholder="전화번호를 입력하세요"
                                  style={{ flex: 1 }}
                                />
                                {phones.length > 2 && (
                                  <button
                                    onClick={() => {
                                      const newPhones = phones.filter((_, i) => i !== index);
                                      handleNestedEditChange('contact', 'phones', newPhones);
                                    }}
                                    style={{
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '0.25rem 0.5rem',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    삭제
                                  </button>
                                )}
                              </div>
                            ) : (
                              phone.replace(/,/g, '').trim() // 쉼표 제거
                            )}
                          </ContactValue>
                        </ContactItem>
                      ))}
                      {isEditMode && (
                        <ContactItem>
                          <ContactLabel></ContactLabel>
                          <ContactValue>
                            <button
                              onClick={() => {
                                const newPhones = [...phones, ''];
                                handleNestedEditChange('contact', 'phones', newPhones);
                              }}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                width: '100%'
                              }}
                            >
                              + 전화번호 추가
                            </button>
                          </ContactValue>
                        </ContactItem>
                      )}
                    </>
                  );
                })()}
                <ContactItemEmail>
                  <ContactLabel>이메일</ContactLabel>
                  <ContactValue>
                    {isEditMode ? (
                      <EditInput
                        type="email"
                        value={editData.contact.email}
                        onChange={(e) => handleNestedEditChange('contact', 'email', e.target.value)}
                        placeholder="이메일을 입력하세요"
                      />
                    ) : (
                      editData.contact.email
                    )}
                  </ContactValue>
                </ContactItemEmail>
              </ContactContent>
              </div>
            </ContactInfo>
          </Section>

          <Section>
            <SectionTitle>위치정보</SectionTitle>
            {editData.mapImage ? (
              <div style={{
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                <img 
                  src={editData.mapImage} 
                  alt="위치정보 지도"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '500px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div style="padding: 2rem; text-align: center; color: #9ca3af; background: #f3f4f6;">지도 이미지를 불러올 수 없습니다</div>';
                    }
                  }}
                />
              </div>
            ) : editData.location && editData.location.lat && editData.location.lng ? (
              <MapContainer ref={mapRef} />
            ) : (
              <div 
                style={{
                  width: '100%',
                  minHeight: '200px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#f3f4f6',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>위치 정보가 없습니다</span>
              </div>
            )}
          </Section>
        </LeftPanel>
      </ModalContent>
        
        {/* 숨겨진 파일 입력 - 매물 이미지 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ 
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            visibility: 'hidden',
            pointerEvents: 'none'
          }}
        />
        {/* 숨겨진 파일 입력 - 프로필 사진 */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ 
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            visibility: 'hidden',
            pointerEvents: 'none'
          }}
        />
    </ModalOverlay>
    </>
  );
};

export default PropertyDetailModal; 