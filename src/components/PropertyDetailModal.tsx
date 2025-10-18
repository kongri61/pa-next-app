import React, { useState } from 'react';
import styled from 'styled-components';
import { Property } from '../types';
import { useProperties } from '../hooks/useProperties';

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
  padding: 6rem 1rem 1rem 1rem;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  overflow: hidden;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  @media (max-width: 768px) {
    max-width: 95vw;
    height: 95vh;
  }
`;

const LeftPanel = styled.div`
  width: 100%;
  padding: 2rem 2rem 1.5rem 2rem;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1rem 1rem 1rem;
  }
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
  border: 0.05px solid #d1d5db;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  color: #374151;
  font-weight: 500;
`;

const PropertyTitle = styled.h1`
  font-size: 1.2rem;
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
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  gap: 1rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 0;
    font-size: 0.8rem;
    gap: 0.5rem;
  }
`;

const PropertyInfoLabel = styled.span`
  color: #64748b;
  font-weight: 500;
  min-width: 100px;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    min-width: 90px;
    font-size: 0.8rem;
  }
`;

const PropertyInfoValue = styled.span`
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    line-height: 1.3;
  }
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
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
`;

const formatPrice = (price: number, isRent: boolean = false) => {
  console.log('모달 formatPrice 호출됨:', price, typeof price, 'isRent:', isRent);
  
  if (!price || price <= 0) {
    console.log('모달: 가격이 0이거나 없음');
    return '가격 정보 없음';
  }
  
  if (isRent) {
    // 임대금액은 만원 단위로 저장되어 있으므로 10000을 곱해서 원 단위로 변환
    const priceInWon = price * 10000;
    console.log('모달: 임대금액 원 단위로 변환된 가격:', priceInWon);
    
    if (priceInWon >= 10000) {
      const result = `${Math.floor(priceInWon / 10000)}만원`;
      console.log('모달: 임대금액 만원 단위 결과:', result);
      return result;
    } else {
      const result = `${priceInWon.toLocaleString()}원`;
      console.log('모달: 임대금액 원 단위 결과:', result);
      return result;
    }
  } else {
    // 매매금액은 억 단위로 저장되어 있으므로 100000000을 곱해서 원 단위로 변환
    const priceInWon = price * 100000000;
    console.log('모달: 매매금액 원 단위로 변환된 가격:', priceInWon);
    
    // 매매금액은 억 단위로 표시 (예: 8.5억원)
    if (priceInWon >= 100000000) {
      // 1억 이상인 경우 (억 단위로 표시)
      const eok = priceInWon / 100000000;
      const result = `${eok}억원`;
      console.log('모달: 매매금액 억 단위 결과:', result);
      return result;
    } else if (priceInWon >= 10000) {
      // 1만원 이상 1억 미만인 경우 (만원 단위로 표시)
      const man = Math.floor(priceInWon / 10000);
      const result = `${man}만원`;
      console.log('모달: 매매금액 만원 단위 결과:', result);
      return result;
    } else {
      // 1만원 미만인 경우
      const result = `${priceInWon.toLocaleString()}원`;
      console.log('모달: 매매금액 원 단위 결과:', result);
      return result;
    }
  }
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
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const { updatePropertyImages } = useProperties();

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
          console.log('✅ 모달: localStorage 이미지 적용 완료');
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
    
    
    setCurrentImageIndex(0);
    setImageLoading(true);
    setImageError(false);
  }, [property.id, property.images]);

  // currentImages가 변경될 때마다 localStorage에 저장
  React.useEffect(() => {
    console.log('=== 메인 이미지 상태 변경 ===', currentImages.length, '개');
    localStorage.setItem(`mainImages_${property.id}`, JSON.stringify(currentImages));
  }, [currentImages, property.id]);

  // 이미지 인덱스 변경 시 로딩 상태 초기화
  React.useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [currentImageIndex]);

  // mapImages는 업로드 시에만 저장하므로 useEffect 제거
  // React.useEffect(() => {
  //   console.log('=== 지도 이미지 상태 변경 ===', mapImages.length, '개');
  //   const mapImagesKey = `mapImages_${property.id}`;
  //   localStorage.setItem(mapImagesKey, JSON.stringify(mapImages));
  //   console.log('지도 이미지 저장 완료, 키:', mapImagesKey);
  // }, [mapImages, property.id]);

  // 이미지 삭제 함수
  const handleDeleteImage = async (imageIndex: number) => {
    console.log('=== 이미지 삭제 시작 ===');
    console.log('삭제할 이미지 인덱스:', imageIndex);
    console.log('현재 이미지 개수:', currentImages.length);
    
    const updatedImages = currentImages.filter((_, index) => index !== imageIndex);
    console.log('삭제 후 이미지 개수:', updatedImages.length);
    
    try {
      // Firebase에 이미지 업데이트
      await updatePropertyImages(property.id, updatedImages);
      console.log('Firebase 이미지 업데이트 완료');
      
      // 로컬 상태 업데이트
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
    } catch (error) {
      console.error('이미지 삭제 중 오류:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
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
              <PropertyNumberBox>
                매물번호<br />
                {property.id}
              </PropertyNumberBox>
              <PropertyTitle style={{ display: 'none' }}>{property.title}</PropertyTitle>
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
                  {currentImages && currentImages.length > 0 ? (
                    <>
                      {imageLoading && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '2rem',
                          color: '#6b7280',
                          background: '#f3f4f6',
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          zIndex: 1
                        }}>
                          ⏳ 로딩중...
                        </div>
                      )}
                      <MainImage 
                        src={currentImages[currentImageIndex]} 
                        alt={property.title}
                        onError={(e) => {
                          console.log('모달 이미지 로딩 실패:', currentImages[currentImageIndex]);
                          setImageError(true);
                          setImageLoading(false);
                        }}
                        onLoad={(e) => {
                          console.log('모달 이미지 로딩 성공:', currentImages[currentImageIndex]);
                          setImageError(false);
                          setImageLoading(false);
                        }}
                        loading="eager"
                        style={{
                          display: imageError ? 'none' : 'block',
                          opacity: imageLoading ? 0 : 1,
                          transition: 'opacity 0.3s ease'
                        }}
                      />
                      {imageError && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '4rem',
                          color: '#6b7280',
                          background: '#f3f4f6',
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          zIndex: 1
                        }}>
                          🏠
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '4rem',
                      color: '#6b7280',
                      background: '#f3f4f6',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      zIndex: 1
                    }}>
                      🏠
                    </div>
                  )}
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
                          reader.onload = async (e) => {
                            console.log('파일 읽기 완료');
                            const result = e.target?.result;
                            console.log('읽기 결과:', result ? '성공' : '실패');
                            
                            if (result) {
                              const newImages = [...currentImages, result as string];
                              console.log('새 이미지 배열:', newImages.length);
                              
                              try {
                                // Firebase에 이미지 업데이트
                                await updatePropertyImages(property.id, newImages);
                                console.log('Firebase 이미지 업데이트 완료');
                                
                                // 로컬 상태 업데이트
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
                              } catch (error) {
                                console.error('이미지 업로드 중 오류:', error);
                                alert('이미지 업로드 중 오류가 발생했습니다.');
                              }
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
                      
                    </span>
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
                        reader.onload = async (e) => {
                          console.log('파일 읽기 완료');
                          const result = e.target?.result;
                          console.log('읽기 결과:', result ? '성공' : '실패');
                          
                          if (result) {
                            const newImages = [result as string];
                            console.log('새 이미지 배열:', newImages.length);
                            
                            try {
                              // Firebase에 이미지 업데이트
                              await updatePropertyImages(property.id, newImages);
                              console.log('Firebase 이미지 업데이트 완료 (빈 영역)');
                              
                              // 로컬 상태 업데이트
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
                            } catch (error) {
                              console.error('이미지 업로드 중 오류 (빈 영역):', error);
                              alert('이미지 업로드 중 오류가 발생했습니다.');
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
                    
                  </span>
                </ImageUploadButton>
              </div>
            )}
          </ImageSection>

          <InfoSection>
            <SectionTitle>매물정보</SectionTitle>
            <PropertyInfoGrid>
              <PropertyInfoItem>
                <PropertyInfoLabel>주소</PropertyInfoLabel>
                <PropertyInfoValue>{maskAddress(property.address)}</PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>매물종류</PropertyInfoLabel>
                <PropertyInfoValue>
                  {property.propertyType === 'commercial' ? '상가' :
                   property.propertyType === 'office' ? '사무실' :
                   property.propertyType === 'building' ? '건물' : '기타'}
                </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>거래유형</PropertyInfoLabel>
                <PropertyInfoValue>{property.type === 'sale' ? '매매' : '임대'}</PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>매매가</PropertyInfoLabel>
                <PropertyInfoValue>{property.type === 'sale' ? formatPrice(property.price, false) : '-'}</PropertyInfoValue>
              </PropertyInfoItem>
              {property.type === 'rent' && (
                <>
                  <PropertyInfoItem>
                    <PropertyInfoLabel>보증금</PropertyInfoLabel>
                    <PropertyInfoValue>
                      {(() => {
                        console.log('=== 모달 보증금 표시 디버깅 ===');
                        console.log('매물 ID:', property.id);
                        console.log('보증금:', property.deposit);
                        console.log('보증금 조건:', property.deposit && property.deposit > 0);
                        
                        if (property.deposit && property.deposit > 0) {
                          return formatPrice(property.deposit, true);
                        }
                        return '정보 없음';
                      })()}
                    </PropertyInfoValue>
                  </PropertyInfoItem>
                  <PropertyInfoItem>
                    <PropertyInfoLabel>월세</PropertyInfoLabel>
                    <PropertyInfoValue>
                      {(() => {
                        console.log('=== 모달 월세 표시 디버깅 ===');
                        console.log('매물 ID:', property.id);
                        console.log('월세:', property.price);
                        console.log('월세 조건:', property.price && property.price > 0);
                        
                        if (property.price && property.price > 0) {
                          return formatPrice(property.price, true);
                        }
                        return '정보 없음';
                      })()}
                    </PropertyInfoValue>
                  </PropertyInfoItem>
                </>
              )}
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
                <PropertyInfoValue style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <span>{Math.round(property.area / 3.3058)}평</span>
                  <span style={{ color: '#6b7280' }}>({Math.round(property.area)}㎡)</span>
                </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>건축물용도</PropertyInfoLabel>
                <PropertyInfoValue>
                  {property.propertyType === 'commercial' ? '상업용' :
                   property.propertyType === 'office' ? '사무용' :
                   property.propertyType === 'building' ? '건물용' : '기타용도'}
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
              </ContactHeader>
              <ContactItem>
                <ContactLabel>전화번호</ContactLabel>
                <ContactValue>{property.contact.phone}</ContactValue>
              </ContactItem>
              <ContactItem>
                <ContactLabel>이메일</ContactLabel>
                <ContactValue>{property.contact.email}</ContactValue>
              </ContactItem>
            </ContactInfo>
          </Section>

        </LeftPanel>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PropertyDetailModal; 