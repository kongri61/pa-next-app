import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Property } from '../types';

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
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const ImageNavigationButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
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
    transform: translateY(-50%) scale(1.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &.prev {
    left: 1rem;
  }

  &.next {
    right: 1rem;
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
  max-width: 300px;
  width: 100%;
  
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

const ContactHeader = styled.div`
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
`;

const ContactName = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const ContactItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ContactLabel = styled.span`
  color: #64748b;
  font-weight: 500;
  min-width: 60px;
`;

const ContactValue = styled.span`
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  flex: 1;
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

  // 수정 모드 토글 함수
  const toggleEditMode = () => {
    if (isEditMode) {
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

  // useEffect 의존성 배열 수정
  React.useEffect(() => {
    setEditData(property);
    setCurrentImages(property.images || []);
    setCurrentImageIndex(0);
  }, [property]);

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
                {isEditMode ? (
                  <>
                    <CancelButton onClick={toggleEditMode}>취소</CancelButton>
                    <SaveButton onClick={handleSave}>저장</SaveButton>
                  </>
                ) : (
                  <>
                    {isAdmin && (
                      <EditButton onClick={toggleEditMode}>수정</EditButton>
                    )}
                    {isAdmin && (
                      <DeleteButton onClick={handleDeleteProperty}>삭제</DeleteButton>
                    )}
                  </>
                )}
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
                    {isAdmin && (
                      <ImageDeleteButton 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleImageDelete(currentImageIndex);
                        }}
                        title="이미지 삭제"
                      >
                        ×
                      </ImageDeleteButton>
                    )}
                  </ImageContainer>
                  <ImageCounter>{currentImageIndex + 1}/{currentImages.length}</ImageCounter>
                  {isAdmin && (
                    <ImageUploadButton 
                      onClick={() => {
                        console.log('📷 사진업로드 버튼 클릭');
                        console.log('🔍 fileInputRef.current:', fileInputRef.current);
                        console.log('🔍 관리자 권한:', isAdmin);
                        
                        if (fileInputRef.current) {
                          console.log('✅ 파일 입력 요소 클릭 실행');
                          fileInputRef.current.click();
                        } else {
                          console.error('❌ 파일 입력 요소를 찾을 수 없습니다');
                          alert('파일 입력 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
                        }
                      }}
                      title="이미지 업로드"
                    >
                      📷
                    </ImageUploadButton>
                  )}
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
                  {isAdmin && (
                    <ImageUploadButton
                      onClick={() => {
                        console.log('📷 사진업로드 버튼 클릭 (빈 상태)');
                        console.log('🔍 fileInputRef.current:', fileInputRef.current);
                        console.log('🔍 관리자 권한:', isAdmin);
                        
                        if (fileInputRef.current) {
                          console.log('✅ 파일 입력 요소 클릭 실행 (빈 상태)');
                          fileInputRef.current.click();
                        } else {
                          console.error('❌ 파일 입력 요소를 찾을 수 없습니다 (빈 상태)');
                          alert('파일 입력 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
                        }
                      }}
                    >
                      📷
                    </ImageUploadButton>
                  )}
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
                <PropertyInfoItem>
                  <PropertyInfoLabel>매매가</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        type="number"
                        value={editData.price}
                        onChange={(e) => handleEditChange('price', parseInt(e.target.value) || 0)}
                        placeholder="매매가를 입력하세요 (만원)"
                      />
                    ) : (
                      editData.type === 'sale' ? formatPrice(editData.price) : '-'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>보증금/임대료</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <EditInput
                          type="number"
                          value={editData.deposit || 0}
                          onChange={(e) => handleEditChange('deposit', parseInt(e.target.value) || 0)}
                          placeholder="보증금 (만원)"
                          style={{ flex: 1 }}
                        />
                        <EditInput
                          type="number"
                          value={editData.type === 'rent' ? (editData.rentPrice || 0) : 0}
                          onChange={(e) => handleEditChange('rentPrice', parseInt(e.target.value) || 0)}
                          placeholder="임대료 (만원)"
                          style={{ flex: 1 }}
                        />
                      </div>
                    ) : (
                      editData.type === 'rent' 
                        ? `보증금 ${formatDeposit(editData.deposit || 0)} / 월세 ${editData.rentPrice || 0}만원`
                        : '-'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>공급/전용면적</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EditInput
                          type="number"
                          step="0.1"
                          value={Math.round(editData.area / 3.3058)}
                          onChange={(e) => {
                            const pyeongValue = parseFloat(e.target.value) || 0;
                            const m2Value = pyeongValue * 3.3058;
                            handleEditChange('area', m2Value);
                          }}
                          placeholder="면적을 입력하세요 (평)"
                          style={{ flex: 1 }}
                        />
                        <span style={{ 
                          fontSize: '14px',
                          color: '#6b7280',
                          whiteSpace: 'nowrap'
                        }}>
                          평
                        </span>
                        <span style={{ 
                          fontSize: '14px',
                          color: '#6b7280',
                          whiteSpace: 'nowrap'
                        }}>
                          ({Math.round(editData.area)}㎡)
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 8px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          {Math.round(editData.area / 3.3058)}평
                        </span>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 8px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          ({editData.area}㎡)
                        </span>
                      </div>
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
              </PropertyInfoGrid>
            </InfoSection>

            <Section>
              <SectionTitle>매물설명</SectionTitle>
              <div>
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
                <ContactHeader>
                  <ContactName>
                    {isEditMode ? (
                      <EditInput
                        value={editData.contact.name}
                        onChange={(e) => handleNestedEditChange('contact', 'name', e.target.value)}
                        placeholder="연락처명을 입력하세요"
                      />
                    ) : (
                      editData.contact.name
                    )}
                  </ContactName>
                </ContactHeader>
                <ContactItem>
                  <ContactLabel>전화번호</ContactLabel>
                  <ContactValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.contact.phone}
                        onChange={(e) => handleNestedEditChange('contact', 'phone', e.target.value)}
                        placeholder="전화번호를 입력하세요"
                      />
                    ) : (
                      editData.contact.phone
                    )}
                  </ContactValue>
                </ContactItem>
                <ContactItem>
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
                </ContactItem>
              </ContactInfo>
            </Section>
          </LeftPanel>
        </ModalContent>
        
        {/* 숨겨진 파일 입력 */}
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
      </ModalOverlay>
    </>
  );
};

export default PropertyDetailModal; 