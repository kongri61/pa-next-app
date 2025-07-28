import React, { useState } from 'react';
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
  padding: 3rem 1rem 1rem 1rem;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 95%;
  max-width: 800px;
  height: 90vh;
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
  padding: 7rem 2rem 2rem 2rem;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 3rem;
  right: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
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
  margin-bottom: 2rem;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PropertyNumberBox = styled.div`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
`;

const PropertyTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
`;

const ConfirmedDateBox = styled.div`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #059669;
  font-weight: 600;
`;

const ImageSection = styled.div`
  margin-bottom: 2rem;
  position: relative;
`;

const MainImage = styled.img`
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 1rem;
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
  border: 2px solid #374151;
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

  /* 카메라 아이콘을 정확히 중앙에 유지 */
  & > span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    line-height: 1;
    font-size: inherit;
    position: relative;
    top: 0;
    left: 0;
    transform: none;
    margin: 0;
    padding: 0;
  }
`;

const InfoSection = styled.div`
  margin-bottom: 2rem;
`;

const PropertyInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 1px;
    height: 100%;
    background: #e2e8f0;
    transform: translateX(-50%);
  }
`;

const PropertyInfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  max-width: 400px;
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
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
`;

const ContactName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
`;

const ContactType = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
`;

const ContactItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ContactLabel = styled.span`
  color: #64748b;
  font-weight: 500;
  min-width: 80px;
`;

const ContactValue = styled.span`
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  flex: 1;
`;

const Section = styled.div`
  margin-bottom: 2rem;
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
  height: 300px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1rem;
  position: relative;
  border-radius: 8px;
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

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
`;

const formatPrice = (price: number) => {
  if (price >= 100000000) {
    return `${Math.floor(price / 100000000)}억원`;
  } else if (price >= 10000) {
    return `${Math.floor(price / 10000)}만원`;
  }
  return `${price.toLocaleString()}원`;
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
  isAdmin?: boolean; // 관리자 권한 추가
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose, onPropertyUpdate, isAdmin = false }) => {
  const [currentImages, setCurrentImages] = useState<string[]>(property.images || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapImages, setMapImages] = useState<string[]>([]);

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
    console.log('=== 매물 변경 감지 ===');
    console.log('매물 ID:', property.id);
    console.log('매물 이미지 개수:', property.images?.length || 0);
    
    // localStorage에서 저장된 이미지들을 로드
    const savedMainImages = localStorage.getItem(`mainImages_${property.id}`);
    console.log('저장된 메인 이미지:', savedMainImages);
    
    if (savedMainImages && savedMainImages !== 'null' && savedMainImages !== '[]') {
      try {
        const parsedImages = JSON.parse(savedMainImages);
        console.log('파싱된 메인 이미지:', parsedImages.length, '개');
        
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          setCurrentImages(parsedImages);
          console.log('localStorage 이미지 적용 완료');
        } else {
          console.log('파싱된 메인 이미지가 빈 배열이거나 유효하지 않음');
          setCurrentImages(property.images || []);
        }
      } catch (error) {
        console.error('메인 이미지 파싱 오류:', error);
        setCurrentImages(property.images || []);
      }
    } else {
      console.log('저장된 메인 이미지 없음, 기본 이미지 사용');
      setCurrentImages(property.images || []);
    }
    
    // 지도 이미지도 로드
    const savedMapImages = localStorage.getItem(`mapImages_${property.id}`);
    console.log('저장된 지도 이미지:', savedMapImages);
    
    if (savedMapImages && savedMapImages !== 'null' && savedMapImages !== '[]') {
      try {
        const parsedMapImages = JSON.parse(savedMapImages);
        console.log('파싱된 지도 이미지:', parsedMapImages.length, '개');
        
        if (Array.isArray(parsedMapImages) && parsedMapImages.length > 0) {
          setMapImages(parsedMapImages);
          console.log('localStorage 지도 이미지 적용 완료');
        } else {
          console.log('파싱된 지도 이미지가 빈 배열이거나 유효하지 않음');
          setMapImages([]);
        }
      } catch (error) {
        console.error('지도 이미지 파싱 오류:', error);
        setMapImages([]);
      }
    } else {
      console.log('저장된 지도 이미지 없음');
      setMapImages([]);
    }
    
    setCurrentImageIndex(0);
  }, [property.id, property.images]);

  // currentImages가 변경될 때마다 localStorage에 저장
  React.useEffect(() => {
    console.log('=== 메인 이미지 상태 변경 ===', currentImages.length, '개');
    localStorage.setItem(`mainImages_${property.id}`, JSON.stringify(currentImages));
  }, [currentImages, property.id]);

  // mapImages는 업로드 시에만 저장하므로 useEffect 제거
  // React.useEffect(() => {
  //   console.log('=== 지도 이미지 상태 변경 ===', mapImages.length, '개');
  //   const mapImagesKey = `mapImages_${property.id}`;
  //   localStorage.setItem(mapImagesKey, JSON.stringify(mapImages));
  //   console.log('지도 이미지 저장 완료, 키:', mapImagesKey);
  // }, [mapImages, property.id]);

  // 이미지 삭제 함수
  const handleDeleteImage = (imageIndex: number) => {
    console.log('=== 이미지 삭제 시작 ===');
    console.log('삭제할 이미지 인덱스:', imageIndex);
    console.log('현재 이미지 개수:', currentImages.length);
    
    const updatedImages = currentImages.filter((_, index) => index !== imageIndex);
    console.log('삭제 후 이미지 개수:', updatedImages.length);
    
    setCurrentImages(updatedImages);
    
    // 현재 이미지 인덱스 조정
    if (updatedImages.length === 0) {
      setCurrentImageIndex(0);
    } else if (currentImageIndex >= updatedImages.length) {
      setCurrentImageIndex(updatedImages.length - 1);
    }
    
    // localStorage에 저장
    const storageKey = `mainImages_${property.id}`;
    if (updatedImages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(updatedImages));
      console.log('localStorage 업데이트 완료');
    } else {
      // 모든 이미지가 삭제된 경우 localStorage에서 제거
      localStorage.removeItem(storageKey);
      console.log('localStorage에서 이미지 키 제거');
    }
    
    // 부모 컴포넌트 업데이트
    if (onPropertyUpdate) {
      const updatedProperty = {
        ...property,
        images: updatedImages
      };
      onPropertyUpdate(updatedProperty);
      console.log('부모 컴포넌트 업데이트 완료');
    }
    
    console.log('=== 이미지 삭제 완료 ===');
  };

  // 지도 이미지 삭제 함수
  const handleDeleteMapImage = (imageIndex: number) => {
    console.log('=== 지도 이미지 삭제 시작 ===');
    console.log('삭제할 지도 이미지 인덱스:', imageIndex);
    console.log('현재 지도 이미지 개수:', mapImages.length);
    
    const updatedMapImages = mapImages.filter((_, index) => index !== imageIndex);
    console.log('삭제 후 지도 이미지 개수:', updatedMapImages.length);
    
    setMapImages(updatedMapImages);
    
    // localStorage에 저장
    const storageKey = `mapImages_${property.id}`;
    if (updatedMapImages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(updatedMapImages));
      console.log('지도 이미지 localStorage 업데이트 완료');
    } else {
      // 모든 지도 이미지가 삭제된 경우 localStorage에서 제거
      localStorage.removeItem(storageKey);
      console.log('localStorage에서 지도 이미지 키 제거');
    }
    
    console.log('=== 지도 이미지 삭제 완료 ===');
  };

  return (
    <ModalOverlay 
      onClick={onClose}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        
        <LeftPanel>
          <Header>
            <HeaderLeft>
              <PropertyNumberBox>매물번호 {property.id}</PropertyNumberBox>
              <PropertyTitle>{property.title}</PropertyTitle>
            </HeaderLeft>
            {property.confirmedDate && (
              <ConfirmedDateBox>확인매물 {property.confirmedDate}</ConfirmedDateBox>
            )}
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
                  <MainImage src={currentImages[currentImageIndex]} alt={property.title} />
                  {isAdmin && (
                    <ImageDeleteButton 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteImage(currentImageIndex);
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('=== 상단 이미지 업로드 버튼 클릭됨 ===');
                      
                      // 파일 입력 요소를 동적으로 생성
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.style.display = 'none';
                      
                      input.onchange = (event) => {
                        console.log('=== 파일 선택됨 ===');
                        const target = event.target as HTMLInputElement;
                        console.log('파일 목록:', target.files);
                        console.log('파일 개수:', target.files?.length);
                        
                        if (target.files && target.files.length > 0) {
                          const file = target.files[0];
                          console.log('첫 번째 파일:', file.name, file.size, file.type);
                          
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            console.log('파일 읽기 완료');
                            const result = e.target?.result;
                            console.log('읽기 결과:', result ? '성공' : '실패');
                            
                            if (result) {
                              const newImages = [...currentImages, result as string];
                              console.log('새 이미지 배열:', newImages.length);
                              setCurrentImages(newImages);
                              // 새 이미지가 추가되면 마지막 이미지(새로 추가된 이미지)로 이동
                              setCurrentImageIndex(newImages.length - 1);
                              console.log('이미지 상태 업데이트 완료');
                              
                              // localStorage에 저장
                              const storageKey = `mainImages_${property.id}`;
                              const imageData = JSON.stringify(newImages);
                              console.log('localStorage 저장 시작');
                              console.log('저장 키:', storageKey);
                              console.log('저장할 데이터 길이:', imageData.length);
                              console.log('저장할 데이터 타입:', typeof imageData);
                              console.log('저장할 데이터 시작 부분:', imageData.substring(0, 100));
                              
                              // 기존 Unsplash 이미지 제거
                              const existingData = localStorage.getItem(storageKey);
                              if (existingData && existingData.includes('unsplash.com')) {
                                console.log('기존 Unsplash 이미지 제거');
                                localStorage.removeItem(storageKey);
                              }
                              
                              localStorage.setItem(storageKey, imageData);
                              console.log('localStorage 저장 완료');
                              
                              // 저장 확인
                              const savedData = localStorage.getItem(storageKey);
                              console.log('저장 확인:', savedData ? '성공' : '실패');
                              if (savedData) {
                                const parsedData = JSON.parse(savedData);
                                console.log('파싱된 저장 데이터:', parsedData.length, '개');
                              }
                              
                              // 부모 컴포넌트 업데이트
                              if (onPropertyUpdate) {
                                const updatedProperty = {
                                  ...property,
                                  images: newImages
                                };
                                onPropertyUpdate(updatedProperty);
                                console.log('부모 컴포넌트 업데이트 완료');
                              }
                              
                              console.log('=== 이미지 업로드 완료 ===');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      
                      document.body.appendChild(input);
                      input.click();
                      document.body.removeChild(input);
                    }}
                    title="이미지 업로드"
                  >
                    <span style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      lineHeight: '1',
                      fontSize: 'inherit',
                      margin: 0,
                      padding: 0
                    }}>
                      +
                    </span>
                  </ImageUploadButton>
                )}
              </>
            ) : (
              <div style={{
                width: '100%',
                height: '400px',
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
                이미지를 업로드해주세요
                <ImageUploadButton 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('=== 빈 이미지 영역 업로드 버튼 클릭됨 ===');
                    
                    // 파일 입력 요소를 동적으로 생성
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.style.display = 'none';
                    
                    input.onchange = (event) => {
                      console.log('=== 파일 선택됨 ===');
                      const target = event.target as HTMLInputElement;
                      console.log('파일 목록:', target.files);
                      console.log('파일 개수:', target.files?.length);
                      
                      if (target.files && target.files.length > 0) {
                        const file = target.files[0];
                        console.log('첫 번째 파일:', file.name, file.size, file.type);
                        
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          console.log('파일 읽기 완료');
                          const result = e.target?.result;
                          console.log('읽기 결과:', result ? '성공' : '실패');
                          
                          if (result) {
                            const newImages = [result as string];
                            console.log('새 이미지 배열:', newImages.length);
                            setCurrentImages(newImages);
                            setCurrentImageIndex(0);
                            console.log('이미지 상태 업데이트 완료');
                            
                            // localStorage에 저장
                            const storageKey = `mainImages_${property.id}`;
                            const imageData = JSON.stringify(newImages);
                            console.log('localStorage 저장 시작 (빈 영역)');
                            console.log('저장 키:', storageKey);
                            console.log('저장할 데이터 길이:', imageData.length);
                            console.log('저장할 데이터 타입:', typeof imageData);
                            console.log('저장할 데이터 시작 부분:', imageData.substring(0, 100));
                            
                            // 기존 Unsplash 이미지 제거
                            const existingData = localStorage.getItem(storageKey);
                            if (existingData && existingData.includes('unsplash.com')) {
                              console.log('기존 Unsplash 이미지 제거 (빈 영역)');
                              localStorage.removeItem(storageKey);
                            }
                            
                            localStorage.setItem(storageKey, imageData);
                            console.log('localStorage 저장 완료 (빈 영역)');
                            
                            // 저장 확인
                            const savedData = localStorage.getItem(storageKey);
                            console.log('저장 확인 (빈 영역):', savedData ? '성공' : '실패');
                            if (savedData) {
                              const parsedData = JSON.parse(savedData);
                              console.log('저장된 이미지 개수 (빈 영역):', parsedData.length);
                              console.log('저장된 데이터 타입:', typeof parsedData[0]);
                              console.log('저장된 데이터 시작 부분:', parsedData[0]?.substring(0, 100));
                              console.log('base64 포함 여부:', parsedData[0]?.includes('data:image/'));
                            }
                            
                            // localStorage 전체 상태 확인
                            console.log('=== 빈 영역 업로드 후 localStorage 전체 상태 ===');
                            for (let i = 0; i < localStorage.length; i++) {
                              const key = localStorage.key(i);
                              if (key && key.includes('mainImages')) {
                                console.log('발견된 메인 이미지 키:', key);
                                const value = localStorage.getItem(key);
                                console.log('값 길이:', value?.length || 0);
                                console.log('값 시작 부분:', value?.substring(0, 100));
                                console.log('base64 포함 여부:', value?.includes('data:image/'));
                              }
                            }
                            
                            if (onPropertyUpdate) {
                              const updatedProperty = {
                                ...property,
                                images: newImages
                              };
                              onPropertyUpdate(updatedProperty);
                              console.log('부모 컴포넌트 업데이트 완료');
                            }
                          }
                        };
                        
                        reader.onerror = (error) => {
                          console.error('파일 읽기 오류:', error);
                        };
                        
                        console.log('파일 읽기 시작');
                        reader.readAsDataURL(file);
                      }
                    };
                    
                    document.body.appendChild(input);
                    input.click();
                    document.body.removeChild(input);
                  }}
                >
                  <span style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    lineHeight: '1',
                    fontSize: 'inherit',
                    margin: 0,
                    padding: 0
                  }}>
                    +
                  </span>
                </ImageUploadButton>
              </div>
            )}
          </ImageSection>

          <InfoSection>
            <SectionTitle>매물정보</SectionTitle>
            <PropertyInfoGrid>
              <PropertyInfoColumn>
                <PropertyInfoItem>
                  <PropertyInfoLabel>주소</PropertyInfoLabel>
                  <PropertyInfoValue>{maskAddress(property.address)}</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>매물종류</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {property.propertyType === 'apartment' ? '아파트' :
                     property.propertyType === 'house' ? '단독주택' :
                     property.propertyType === 'commercial' ? '상가' : '토지'}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>거래유형</PropertyInfoLabel>
                  <PropertyInfoValue>{property.type === 'sale' ? '매매' : '임대'}</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>매매가</PropertyInfoLabel>
                  <PropertyInfoValue>{property.type === 'sale' ? formatPrice(property.price) : '-'}</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>보증금/임대료</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {property.type === 'rent' 
                      ? `보증금 ${formatPrice(property.deposit || 0)} / 월세 ${formatPrice(property.price)}`
                      : '-'}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>관리비</PropertyInfoLabel>
                  <PropertyInfoValue>-</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>융자금</PropertyInfoLabel>
                  <PropertyInfoValue>-</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>공급/전용면적</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {Math.round(property.area / 3.3058)}평 ({property.area}㎡)
                  </PropertyInfoValue>
                </PropertyInfoItem>
              </PropertyInfoColumn>
              <PropertyInfoColumn>
                <PropertyInfoItem>
                  <PropertyInfoLabel>건축물용도</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {property.propertyType === 'apartment' ? '주거용' :
                     property.propertyType === 'commercial' ? '상업용' : '주거용'}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>해당층/전체층</PropertyInfoLabel>
                  <PropertyInfoValue>{property.floor || '-'}</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>방/화장실</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {property.bedrooms || 0}방 / {property.bathrooms || 0}화장실
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>난방유형</PropertyInfoLabel>
                  <PropertyInfoValue>-</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>주차</PropertyInfoLabel>
                  <PropertyInfoValue>{property.parking ? '가능' : '불가능'}</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>엘리베이터</PropertyInfoLabel>
                  <PropertyInfoValue>{property.elevator ? '있음' : '없음'}</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>사용승인일</PropertyInfoLabel>
                  <PropertyInfoValue>-</PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>입주가능일</PropertyInfoLabel>
                  <PropertyInfoValue>-</PropertyInfoValue>
                </PropertyInfoItem>
              </PropertyInfoColumn>
            </PropertyInfoGrid>
          </InfoSection>

          <Section>
            <SectionTitle>매물설명</SectionTitle>
            <div>
              {property.description}
            </div>
          </Section>

          <Section>
            <SectionTitle>연락처</SectionTitle>
            <ContactInfo>
              <ContactHeader>
                <ContactName>{property.contact.name}</ContactName>
                <ContactType>공인중개사사무소</ContactType>
              </ContactHeader>
              <ContactItem>
                <ContactLabel>전화번호</ContactLabel>
                <ContactValue>{property.contact.phone}</ContactValue>
              </ContactItem>
              <ContactItem>
                <ContactLabel>이메일</ContactLabel>
                <ContactValue>{property.contact.email}</ContactValue>
              </ContactItem>
              <ContactItem>
                <ContactLabel>주소</ContactLabel>
                <ContactValue>서울특별시 강남구 역삼동 123-45</ContactValue>
              </ContactItem>
            </ContactInfo>
          </Section>

          <Section>
            <SectionTitle>위치정보</SectionTitle>
            <MapPlaceholder>
              {mapImages.length > 0 ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img 
                    src={mapImages[0]} 
                    alt="위치 정보" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  {isAdmin && (
                    <ImageDeleteButton 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteMapImage(0);
                      }}
                      title="지도 이미지 삭제"
                      style={{ 
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem'
                      }}
                    >
                      ×
                    </ImageDeleteButton>
                  )}
                  {mapImages.length > 1 && (
                    <>
                      <ImageNavigationButton 
                        className="prev" 
                        onClick={() => {
                          // 지도 이미지 네비게이션 로직 추가 가능
                        }}
                        style={{ left: '0.5rem' }}
                      >
                        &lt;
                      </ImageNavigationButton>
                      <ImageNavigationButton 
                        className="next" 
                        onClick={() => {
                          // 지도 이미지 네비게이션 로직 추가 가능
                        }}
                        style={{ right: '0.5rem' }}
                      >
                        &gt;
                      </ImageNavigationButton>
                    </>
                  )}
                  {isAdmin && (
                    <ImageUploadButton 
                      onClick={() => {
                        console.log('=== 지도 이미지 업로드 버튼 클릭됨 ===');
                        console.log('현재 지도 이미지 개수:', mapImages.length);
                        
                        // 파일 입력 요소를 동적으로 생성
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.style.display = 'none';
                        
                        input.onchange = async (event) => {
                          console.log('=== 지도 이미지 파일 선택됨 ===');
                          const target = event.target as HTMLInputElement;
                          console.log('지도 이미지 파일 목록:', target.files);
                          console.log('지도 이미지 파일 개수:', target.files?.length);
                          
                          if (target.files && target.files.length > 0) {
                            try {
                              // 파일 크기 체크 (5MB 제한)
                              const maxSize = 5 * 1024 * 1024; // 5MB
                              const validFiles = Array.from(target.files).filter(file => {
                                if (file.size > maxSize) {
                                  console.warn(`파일 ${file.name}이 너무 큽니다: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                                  return false;
                                }
                                return true;
                              });
                              
                              if (validFiles.length === 0) {
                                console.error('유효한 파일이 없습니다.');
                                return;
                              }
                              
                              console.log('처리할 파일 개수:', validFiles.length);
                              
                              const filePromises = validFiles.map((file, index) => {
                                console.log(`지도 이미지 파일 ${index + 1}:`, file.name, file.size, file.type);
                                
                                return new Promise<string>((resolve, reject) => {
                                  const reader = new FileReader();
                                  
                                  reader.onload = (e) => {
                                    console.log(`지도 이미지 ${index + 1} 읽기 완료`);
                                    if (e.target?.result) {
                                      resolve(e.target.result as string);
                                    } else {
                                      reject(new Error(`지도 이미지 ${index + 1} 읽기 실패`));
                                    }
                                  };
                                  
                                  reader.onerror = (error) => {
                                    console.error(`지도 이미지 ${index + 1} 읽기 오류:`, error);
                                    reject(error);
                                  };
                                  
                                  console.log(`지도 이미지 ${index + 1} 읽기 시작`);
                                  reader.readAsDataURL(file);
                                });
                              });
                              
                              console.log('모든 파일 읽기 시작...');
                              const newMapImages = await Promise.all(filePromises);
                              console.log('모든 파일 읽기 완료:', newMapImages.length, '개');
                              
                              const updatedMapImages = [...mapImages, ...newMapImages];
                              console.log('업데이트될 지도 이미지 배열:', updatedMapImages.length, '개');
                              
                              // 먼저 localStorage에 저장
                              const mapImagesKey = `mapImages_${property.id}`;
                              const mapImagesData = JSON.stringify(updatedMapImages);
                              console.log('localStorage에 저장될 데이터 길이:', mapImagesData.length);
                              localStorage.setItem(mapImagesKey, mapImagesData);
                              console.log('지도 이미지 localStorage 저장 완료, 키:', mapImagesKey);
                              
                              // 그 다음 상태 업데이트
                              setMapImages(updatedMapImages);
                              
                              // 저장 확인
                              const saved = localStorage.getItem(mapImagesKey);
                              console.log('저장 확인:', saved ? JSON.parse(saved).length + '개' : '저장 실패');
                              
                              // 즉시 저장된 데이터 확인
                              setTimeout(() => {
                                const verifySaved = localStorage.getItem(mapImagesKey);
                                console.log('저장 검증:', verifySaved ? JSON.parse(verifySaved).length + '개' : '검증 실패');
                                
                                // localStorage 전체 상태 확인
                                console.log('=== 업로드 후 localStorage 전체 상태 ===');
                                for (let i = 0; i < localStorage.length; i++) {
                                  const key = localStorage.key(i);
                                  if (key && key.includes('mapImages')) {
                                    console.log('발견된 지도 이미지 키:', key);
                                    const value = localStorage.getItem(key);
                                    console.log('값 길이:', value?.length || 0);
                                    console.log('값이 null인가?:', value === null);
                                    console.log('값이 "null"인가?:', value === 'null');
                                  }
                                }
                              }, 100);
                              
                            } catch (error) {
                              console.error('지도 이미지 업로드 중 오류:', error);
                            }
                          }
                        };
                        
                        document.body.appendChild(input);
                        input.click();
                        document.body.removeChild(input);
                      }}
                      style={{ bottom: '1rem', right: '1rem' }}
                    >
                      <span style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        lineHeight: '1',
                        fontSize: 'inherit',
                        margin: 0,
                        padding: 0
                      }}>
                        +
                      </span>
                    </ImageUploadButton>
                  )}
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: '1rem',
                  position: 'relative'
                }}>
                  지도 이미지를 업로드해주세요
                  {isAdmin && (
                    <ImageUploadButton 
                      onClick={() => {
                        console.log('=== 지도 이미지 업로드 버튼 클릭됨 ===');
                        console.log('현재 지도 이미지 개수:', mapImages.length);
                        
                        // 파일 입력 요소를 동적으로 생성
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.style.display = 'none';
                        
                        input.onchange = async (event) => {
                          console.log('=== 지도 이미지 파일 선택됨 ===');
                          const target = event.target as HTMLInputElement;
                          console.log('지도 이미지 파일 목록:', target.files);
                          console.log('지도 이미지 파일 개수:', target.files?.length);
                          
                          if (target.files && target.files.length > 0) {
                            try {
                              // 파일 크기 체크 (5MB 제한)
                              const maxSize = 5 * 1024 * 1024; // 5MB
                              const validFiles = Array.from(target.files).filter(file => {
                                if (file.size > maxSize) {
                                  console.warn(`파일 ${file.name}이 너무 큽니다: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                                  return false;
                                }
                                return true;
                              });
                              
                              if (validFiles.length === 0) {
                                console.error('유효한 파일이 없습니다.');
                                return;
                              }
                              
                              console.log('처리할 파일 개수:', validFiles.length);
                              
                              const filePromises = validFiles.map((file, index) => {
                                console.log(`지도 이미지 파일 ${index + 1}:`, file.name, file.size, file.type);
                                
                                return new Promise<string>((resolve, reject) => {
                                  const reader = new FileReader();
                                  
                                  reader.onload = (e) => {
                                    console.log(`지도 이미지 ${index + 1} 읽기 완료`);
                                    if (e.target?.result) {
                                      resolve(e.target.result as string);
                                    } else {
                                      reject(new Error(`지도 이미지 ${index + 1} 읽기 실패`));
                                    }
                                  };
                                  
                                  reader.onerror = (error) => {
                                    console.error(`지도 이미지 ${index + 1} 읽기 오류:`, error);
                                    reject(error);
                                  };
                                  
                                  console.log(`지도 이미지 ${index + 1} 읽기 시작`);
                                  reader.readAsDataURL(file);
                                });
                              });
                              
                              console.log('모든 파일 읽기 시작...');
                              const newMapImages = await Promise.all(filePromises);
                              console.log('모든 파일 읽기 완료:', newMapImages.length, '개');
                              
                              const updatedMapImages = [...mapImages, ...newMapImages];
                              console.log('업데이트될 지도 이미지 배열:', updatedMapImages.length, '개');
                              
                              // 먼저 localStorage에 저장
                              const mapImagesKey = `mapImages_${property.id}`;
                              const mapImagesData = JSON.stringify(updatedMapImages);
                              console.log('localStorage에 저장될 데이터 길이:', mapImagesData.length);
                              localStorage.setItem(mapImagesKey, mapImagesData);
                              console.log('지도 이미지 localStorage 저장 완료, 키:', mapImagesKey);
                              
                              // 그 다음 상태 업데이트
                              setMapImages(updatedMapImages);
                              
                              // 저장 확인
                              const saved = localStorage.getItem(mapImagesKey);
                              console.log('저장 확인:', saved ? JSON.parse(saved).length + '개' : '저장 실패');
                              
                              // 즉시 저장된 데이터 확인
                              setTimeout(() => {
                                const verifySaved = localStorage.getItem(mapImagesKey);
                                console.log('저장 검증:', verifySaved ? JSON.parse(verifySaved).length + '개' : '검증 실패');
                                
                                // localStorage 전체 상태 확인
                                console.log('=== 업로드 후 localStorage 전체 상태 ===');
                                for (let i = 0; i < localStorage.length; i++) {
                                  const key = localStorage.key(i);
                                  if (key && key.includes('mapImages')) {
                                    console.log('발견된 지도 이미지 키:', key);
                                    const value = localStorage.getItem(key);
                                    console.log('값 길이:', value?.length || 0);
                                    console.log('값이 null인가?:', value === null);
                                    console.log('값이 "null"인가?:', value === 'null');
                                  }
                                }
                              }, 100);
                              
                            } catch (error) {
                              console.error('지도 이미지 업로드 중 오류:', error);
                            }
                          }
                        };
                        
                        document.body.appendChild(input);
                        input.click();
                        document.body.removeChild(input);
                      }}
                      style={{ 
                        position: 'absolute',
                        bottom: '1rem',
                        right: '1rem'
                      }}
                    >
                      <span style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        lineHeight: '1',
                        fontSize: 'inherit',
                        margin: 0,
                        padding: 0
                      }}>
                        +
                      </span>
                    </ImageUploadButton>
                  )}
                </div>
              )}
            </MapPlaceholder>
          </Section>
        </LeftPanel>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PropertyDetailModal; 