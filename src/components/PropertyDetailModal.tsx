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
  
  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    opacity: 0.6;
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
  object-fit: contain; /* 화질 개선을 위해 cover에서 contain으로 변경 */
  background: #f3f4f6; /* 배경색 추가 */
  border-radius: 8px;
  margin-bottom: 0.25rem;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px; /* 가로 화면만 페이지 넘김 도구 안으로 좁힘 */
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto; /* 중앙 정렬 */
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  column-gap: 1.5rem;
  margin-bottom: 1rem;
  position: relative;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    column-gap: 0.5rem;
  }
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
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  max-width: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
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

const ContactContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ContactPhotoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const ContactPhoto = styled.div<{ src?: string }>`
  width: 70px;
  height: 70px;
  border-radius: 8px;
  background: ${props => props.src ? `url(${props.src})` : '#f3f4f6'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.src ? 'pointer' : 'default'};
  position: relative;
  overflow: hidden;
  
  @media (min-width: 769px) {
    width: 120px;
    height: 120px;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
  }
  
  &:hover {
    border-color: transparent;
  }
`;

const ContactPhotoText = styled.div<{ src?: string; show?: boolean }>`
  display: ${props => (props.show !== false && !props.src) ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  
  .label-top {
    position: absolute;
    top: 4px;
    left: 4px;
    color: #6b7280;
    font-size: 0.5rem;
    font-weight: 500;
  }
  
  .label-center {
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  }
  
  .label-bottom {
    position: absolute;
    bottom: 4px;
    left: 4px;
    color: #6b7280;
    font-size: 0.5rem;
    font-weight: 500;
  }
`;

const ContactPhotoButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.15rem 0.4rem;
  font-size: 0.625rem;
  cursor: pointer;
  
  &:hover {
    background: #2563eb;
  }
`;

const ContactDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ContactHeader = styled.div`
  margin-bottom: 0.25rem;
  padding-bottom: 0.25rem;
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

const ContactName = styled.h3`
  font-size: 0.9rem;
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
  justify-content: space-between;
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

const ContactSectionContainer = styled.div`
  display: flex;
  gap: 6rem;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`;

const SmallMapWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    width: 100%;
    flex: none; /* 모바일에서 flex 제거 */
    order: 2; /* 연락처 아래에 표시 */
  }
`;

const SmallMapTitle = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const SmallMapContainer = styled.div`
  min-width: 154px; /* 140px * 1.1 = 154px */
  max-width: 231px; /* 210px * 1.1 = 231px */
  height: 154px; /* 140px * 1.1 = 154px */
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  @media (max-width: 768px) {
    max-width: 100%;
    width: 100%;
    min-width: 100%;
    height: 220px; /* 200px * 1.1 = 220px */
  }
`;

const SmallMapDiv = styled.div`
  width: 100%;
  height: 100%;
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
  // PC 메인 서버 감지 (모바일에서는 수정 불가)
  const isMainServer = window.location.hostname === 'localhost' || 
                      window.location.hostname === '192.168.219.105' ||
                      window.location.hostname === 'pa-realestate-pc.vercel.app' ||
                      (window.location.hostname.includes('vercel.app') && 
                       window.location.hostname.includes('pa-realestate'));
  
  // PC 메인 서버이고 관리자 권한이 있을 때만 수정 가능
  const canEdit = isMainServer && isAdmin;
  const [currentImages, setCurrentImages] = useState<string[]>(property.images || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Property>(() => ({
    ...property,
    contact: {
      ...property.contact,
      // Firebase에서 가져온 연락처 정보 사용 (없을 경우에만 기본값 사용)
      name: property.contact?.name || '피에이공인중개사사무소    대표 김동화',
      email: property.contact?.email || 'kongri61@naver.com',
      phone: property.contact?.phone || '032-424-0111',
      photo: property.contact?.photo || `${process.env.PUBLIC_URL || ''}/contact-photo.jpg`
    }
  }));

  // contact.name을 파싱해서 상호명과 대표 이름을 분리하는 함수
  const parseContactName = (name: string) => {
    if (!name) return { companyName: '', representativeName: '' };
    
    // "상호명    대표 이름" 형식 파싱
    const parts = name.split(/\s+대표\s+/);
    if (parts.length === 2) {
      return {
        companyName: parts[0].trim(),
        representativeName: parts[1].trim()
      };
    }
    
    // "대표"가 없는 경우 전체를 상호명으로 처리
    return {
      companyName: name.trim(),
      representativeName: ''
    };
  };

  // 연락처 정보 로그 (Firebase 연동 확인)
  useEffect(() => {
    console.log('📞 연락처 정보 Firebase 연동 확인:', {
      propertyId: property.id,
      contactFromFirebase: property.contact,
      contactInEditData: editData.contact,
      hasName: !!property.contact?.name,
      hasPhone: !!property.contact?.phone,
      hasEmail: !!property.contact?.email,
      hasPhoto: !!property.contact?.photo
    });
  }, [property.id, property.contact, editData.contact]);

  // 위치 정보 로그 (Firebase 연동 확인)
  useEffect(() => {
    console.log('📍 위치정보 Firebase 연동 확인:', {
      propertyId: property.id,
      locationFromFirebase: property.location,
      locationInEditData: editData.location,
      hasLocation: !!property.location,
      hasLat: property.location?.lat !== undefined && property.location?.lat !== null,
      hasLng: property.location?.lng !== undefined && property.location?.lng !== null,
      lat: property.location?.lat,
      lng: property.location?.lng,
      isValidLocation: property.location && 
                      property.location.lat && 
                      property.location.lng && 
                      property.location.lat !== 0 && 
                      property.location.lng !== 0,
      locationType: typeof property.location,
      latType: typeof property.location?.lat,
      lngType: typeof property.location?.lng
    });
  }, [property.id, property.location, editData.location]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contactPhotoInputRef = useRef<HTMLInputElement>(null);
  const smallMapRef = useRef<HTMLDivElement>(null);
  const smallMapInstance = useRef<any>(null);
  const smallMarkerRef = useRef<any>(null);

  // property가 변경될 때 contact 정보를 Firebase에서 가져온 값으로 업데이트
  useEffect(() => {
    setEditData(prev => ({
      ...prev,
      contact: {
        // Firebase에서 가져온 연락처 정보 사용 (없을 경우에만 기본값 사용)
        name: property.contact?.name || prev.contact?.name || '피에이공인중개사사무소    대표 김동화',
        email: property.contact?.email || prev.contact?.email || 'kongri61@naver.com',
        phone: property.contact?.phone || prev.contact?.phone || '032-424-0111',
        photo: property.contact?.photo || prev.contact?.photo || '/contact-photo.jpg'
      }
    }));
  }, [property.id, property.contact]);
  
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
  }, [property]);

  // 수정 모드 토글 함수
  const toggleEditMode = () => {
    // 저장 중일 때는 취소 불가
    if (isSaving) {
      return;
    }
    
    if (isEditMode) {
      setEditData({
        ...property,
        contact: {
          // Firebase에서 가져온 연락처 정보 사용
          name: property.contact?.name || '피에이공인중개사사무소    대표 김동화',
          email: property.contact?.email || 'kongri61@naver.com',
          phone: property.contact?.phone || '032-424-0111',
          photo: property.contact?.photo || `${process.env.PUBLIC_URL || ''}/contact-photo.jpg`
        }
      });
    }
    setIsEditMode(!isEditMode);
  };

  // 수정 데이터 저장 함수
  const handleSave = async () => {
    if (!onPropertyUpdate) {
      setIsEditMode(false);
      return;
    }

    // 저장 중 상태로 변경
    setIsSaving(true);

    try {
      // 저장할 때 수정된 연락처 정보를 그대로 저장
      await onPropertyUpdate(editData);
      
      // 저장 성공 시 편집 모드 종료
      setIsEditMode(false);
    } catch (error) {
      // 저장 실패 시 에러 메시지는 onPropertyUpdate에서 이미 표시됨
      // 편집 모드는 유지하여 사용자가 다시 시도할 수 있도록 함
      console.error('매물 저장 실패:', error);
    } finally {
      // 저장 완료 (성공/실패 관계없이)
      setIsSaving(false);
    }
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
      // contact 정보는 사용자가 수정한 값을 그대로 저장
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

  // 이미지 업로드 핸들러 (Firebase Storage 사용) - 여러 파일 동시 업로드 지원
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 파일 선택됨:', e.target.files?.length || 0);
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('📁 파일이 선택되지 않음');
      return;
    }

    // 여러 파일 처리
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('이미지 파일만 업로드 가능합니다. (JPG, PNG, WebP)');
      e.target.value = '';
      return;
    }

    // 파일 크기 검증 및 업로드
    const { validateFile, uploadImage } = await import('../firebase/storageService');
    
    let successCount = 0;
    let failCount = 0;
    const failedFiles: string[] = [];
    const uploadedUrls: string[] = [];

    // 업로드 진행 상황 표시
    const totalFiles = imageFiles.length;
    let processedFiles = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      processedFiles++;
      
      try {
        console.log(`📄 파일 ${processedFiles}/${totalFiles} 처리 중:`, file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
        
        // 파일 검증
        const validation = await validateFile(file, 5, ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
        if (!validation.isValid) {
          console.warn(`⚠️ 파일 검증 실패 (${file.name}):`, validation.error);
          failedFiles.push(`${file.name}: ${validation.error}`);
          failCount++;
          continue;
        }

        // uploadImage 함수 내에서 Firestore 크기 제한을 고려한 압축이 자동으로 수행됨
        // 여기서는 추가 압축 없이 원본 파일을 그대로 전달
        console.log(`🔥 이미지 ${processedFiles}/${totalFiles} 업로드 시작:`, file.name);
        console.log(`📋 업로드 정보:`, {
          propertyId: property.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        // 이미지 업로드 (uploadImage 함수 내에서 Firestore 크기 제한을 고려한 압축 수행)
        let imageUrl: string;
        try {
          imageUrl = await uploadImage(file, 'properties');
          console.log(`✅ 이미지 ${processedFiles}/${totalFiles} 업로드 완료:`, file.name);
          console.log(`📷 업로드된 이미지 URL:`, imageUrl.substring(0, 100) + '...');
          uploadedUrls.push(imageUrl);
          successCount++;
        } catch (uploadError) {
          console.error(`❌ 이미지 업로드 중 예외 발생:`, uploadError);
          throw uploadError; // 상위 catch로 전달
        }
        
      } catch (error) {
        console.error(`❌ 이미지 ${processedFiles}/${totalFiles} 업로드 실패 (${file.name}):`, error);
        
        let errorMessage = '알 수 없는 오류';
        if (error instanceof Error) {
          errorMessage = error.message;
          if (error.message.includes('permission')) {
            errorMessage = '권한 없음';
          } else if (error.message.includes('network') || error.message.includes('Network')) {
            errorMessage = '네트워크 오류';
          } else if (error.message.includes('quota') || error.message.includes('Quota')) {
            errorMessage = '저장 공간 부족';
          } else if (error.message.includes('변환')) {
            errorMessage = '이미지 변환 실패';
          }
        }
        
        failedFiles.push(`${file.name}: ${errorMessage}`);
        failCount++;
      }
    }

    // 업로드 결과 처리
    console.log('📊 업로드 결과 요약:', {
      propertyId: property.id,
      totalFiles: totalFiles,
      successCount: successCount,
      failCount: failCount,
      uploadedUrls: uploadedUrls.length,
      currentImagesCount: currentImages.length
    });

    if (uploadedUrls.length > 0) {
      const newImages = [...currentImages, ...uploadedUrls];
      console.log('📸 새로운 이미지 배열:', {
        기존이미지개수: currentImages.length,
        새로추가된이미지개수: uploadedUrls.length,
        총이미지개수: newImages.length
      });
      
      setCurrentImages(newImages);
      const updatedProperty = { ...editData, images: newImages };
      setEditData(updatedProperty);
      
      // 즉시 저장
      if (onPropertyUpdate) {
        console.log('💾 매물 정보 저장 중...', {
          propertyId: property.id,
          imagesCount: newImages.length
        });
        try {
          onPropertyUpdate(updatedProperty);
          console.log('✅ 매물 정보 저장 완료');
        } catch (saveError) {
          console.error('❌ 매물 정보 저장 실패:', saveError);
          alert('이미지는 업로드되었지만 매물 정보 저장에 실패했습니다. 페이지를 새로고침해주세요.');
        }
      } else {
        console.error('❌ onPropertyUpdate 함수가 없습니다!');
        alert('매물 정보 업데이트 함수가 없습니다. 페이지를 새로고침해주세요.');
      }
    } else {
      console.warn('⚠️ 업로드된 이미지가 없습니다.');
    }

    // 결과 알림
    let message = '';
    if (successCount > 0) {
      message += `✅ ${successCount}개 이미지 업로드 완료\n`;
    }
    if (failCount > 0) {
      message += `❌ ${failCount}개 이미지 업로드 실패\n\n`;
      message += `실패한 파일:\n${failedFiles.join('\n')}`;
    }
    
    if (message) {
      alert(message);
    }

    // 파일 입력 초기화
    e.target.value = '';
  };

  // 연락처 사진 업로드 핸들러
  const handleContactPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (file.type.startsWith('image/')) {
        try {
          if (file.size > 5 * 1024 * 1024) {
            alert('이미지 파일 크기는 5MB 이하여야 합니다.');
            return;
          }

          const { uploadImage } = await import('../firebase/storageService');
          const photoUrl = await uploadImage(file, 'contacts');
          
          const updatedContact = { ...editData.contact, photo: photoUrl };
          const updatedProperty = { ...editData, contact: updatedContact };
          setEditData(updatedProperty);
          
          if (onPropertyUpdate) {
            onPropertyUpdate(updatedProperty);
          }
          
          alert('✅ 연락처 사진이 성공적으로 업로드되었습니다!');
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
        alert('이미지 파일만 업로드 가능합니다.');
      }
    }
    
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

  // 이전 매물 ID를 추적하기 위한 ref
  const prevPropertyIdRef = React.useRef<string>(property.id);

  // useEffect 의존성 배열 수정 - property 객체를 의존성으로 포함
  React.useEffect(() => {
    // 매물이 변경되었거나 수정 모드가 아닐 때만 editData를 초기화
    // (수정 중인 데이터를 덮어쓰지 않도록, 하지만 매물이 바뀌면 초기화)
    const prevPropertyId = prevPropertyIdRef.current;
    if (property.id !== prevPropertyId || !isEditMode) {
      // property 객체를 완전히 새로 복사하여 editData 초기화
      setEditData({
        ...property,
        contact: {
          // Firebase에서 가져온 연락처 정보 사용
          name: property.contact?.name || '피에이공인중개사사무소    대표 김동화',
          email: property.contact?.email || 'kongri61@naver.com',
          phone: property.contact?.phone || '032-424-0111',
          photo: property.contact?.photo || `${process.env.PUBLIC_URL || ''}/contact-photo.jpg`
        },
        // 주차대수와 방/화장실 정보를 명시적으로 복사
        parkingSpaces: property.parkingSpaces,
        roomBathInfo: property.roomBathInfo,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms
      });
      setCurrentImages(property.images || []);
      setCurrentImageIndex(0);
      prevPropertyIdRef.current = property.id;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    property, 
    isEditMode
  ]);

  // 위치 정보 변환 함수 (GeoPoint 또는 일반 객체 모두 처리)
  const convertLocation = (location: any): { lat: number; lng: number } | null => {
    try {
      if (!location) return null;
      
      // Firebase GeoPoint 객체인 경우 (latitude, longitude)
      if (location.latitude !== undefined && location.longitude !== undefined) {
        return {
          lat: typeof location.latitude === 'number' ? location.latitude : parseFloat(location.latitude),
          lng: typeof location.longitude === 'number' ? location.longitude : parseFloat(location.longitude)
        };
      }
      
      // 일반 객체인 경우 (lat, lng)
      if (location.lat !== undefined && location.lng !== undefined) {
        return {
          lat: typeof location.lat === 'number' ? location.lat : parseFloat(location.lat),
          lng: typeof location.lng === 'number' ? location.lng : parseFloat(location.lng)
        };
      }
      
      return null;
    } catch (error) {
      console.error('위치 정보 변환 오류:', error);
      return null;
    }
  };

  // 작은 지도 초기화 (개선된 버전 - 재시도 로직 포함)
  useEffect(() => {
    // 위치 정보 확인 및 변환
    const rawLocation = property.location || editData.location;
    const location = convertLocation(rawLocation);
    
    console.log('🗺️ 지도 초기화 시도:', {
      propertyId: property.id,
      rawLocation: rawLocation,
      convertedLocation: location,
      hasLocation: !!location,
      hasLat: location?.lat !== undefined && location?.lat !== null,
      hasLng: location?.lng !== undefined && location?.lng !== null,
      lat: location?.lat,
      lng: location?.lng,
      isValidLocation: location && location.lat && location.lng && location.lat !== 0 && location.lng !== 0
    });

    if (!location || !location.lat || !location.lng || location.lat === 0 || location.lng === 0) {
      console.log('📍 위치정보 없음 또는 유효하지 않음:', { 
        propertyLocation: property.location, 
        editDataLocation: editData.location,
        rawLocation: rawLocation,
        convertedLocation: location
      });
      return;
    }

    // 지도 초기화 함수
    const initializeMap = (retryCount = 0) => {
      // Google Maps API 로드 확인
      if (!window.google || !window.google.maps) {
        console.log('⏳ Google Maps API 로드 대기 중... (재시도:', retryCount, ')');
        if (retryCount < 10) {
          setTimeout(() => initializeMap(retryCount + 1), 500);
        } else {
          console.error('❌ Google Maps API 로드 실패 (최대 재시도 횟수 초과)');
        }
        return;
      }

      // DOM 요소 확인
      if (!smallMapRef.current) {
        console.log('⏳ 지도 DOM 요소 대기 중... (재시도:', retryCount, ')');
        if (retryCount < 10) {
          setTimeout(() => initializeMap(retryCount + 1), 500);
        } else {
          console.error('❌ 지도 DOM 요소를 찾을 수 없음 (최대 재시도 횟수 초과)');
        }
        return;
      }

      // 기존 지도와 마커 제거
      if (smallMarkerRef.current) {
        smallMarkerRef.current.setMap(null);
        smallMarkerRef.current = null;
      }
      if (smallMapInstance.current) {
        smallMapInstance.current = null;
      }

      try {
        console.log('🗺️ 지도 생성 시작:', { lat: location.lat, lng: location.lng });
        
        const map = new window.google.maps.Map(smallMapRef.current, {
          center: { lat: location.lat, lng: location.lng },
          zoom: 14,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: 'auto',
          draggable: true,
          scrollwheel: true,
          clickableIcons: false
        });

        smallMapInstance.current = map;

        // 지도 로드 완료 후 마커 생성
        window.google.maps.event.addListenerOnce(map, 'idle', () => {
          try {
            const marker = new window.google.maps.Marker({
              position: { lat: location.lat, lng: location.lng },
              map: map,
              title: property.id,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#4b5563" fill-opacity="0.6" stroke="#374151" stroke-width="2"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12)
              }
            });

            smallMarkerRef.current = marker;
            console.log('✅ 작은 지도 초기화 성공:', { 
              lat: location.lat, 
              lng: location.lng,
              markerPosition: marker.getPosition()
            });
          } catch (markerError) {
            console.error('❌ 마커 생성 오류:', markerError);
          }
        });

      } catch (error) {
        console.error('❌ 작은 지도 초기화 오류:', error);
        // 오류 발생 시 재시도
        if (retryCount < 3) {
          console.log('🔄 지도 초기화 재시도:', retryCount + 1);
          setTimeout(() => initializeMap(retryCount + 1), 1000);
        }
      }
    };

    // DOM이 완전히 렌더링된 후 지도 초기화 (모바일에서는 더 긴 지연)
    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 1000 : 200; // 모바일에서는 더 긴 지연 (1초)
    
    // Google Maps API가 이미 로드되어 있는지 확인
    const checkAndInit = () => {
      if (window.google && window.google.maps) {
        initializeMap(0);
      } else {
        // API가 로드될 때까지 대기
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            initializeMap(0);
          }
        }, 200);
        
        // 최대 10초 대기
        setTimeout(() => {
          clearInterval(checkInterval);
          if (window.google && window.google.maps) {
            initializeMap(0);
          } else {
            console.error('❌ Google Maps API 로드 타임아웃');
          }
        }, 10000);
      }
    };
    
    const timer = setTimeout(() => {
      checkAndInit();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (smallMarkerRef.current) {
        smallMarkerRef.current.setMap(null);
        smallMarkerRef.current = null;
      }
      if (smallMapInstance.current) {
        smallMapInstance.current = null;
      }
    };
  }, [property.location, editData.location, property.id]);

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
                    <CancelButton onClick={toggleEditMode} disabled={isSaving}>취소</CancelButton>
                    <SaveButton onClick={handleSave} disabled={isSaving}>
                      {isSaving ? '저장 중...' : '저장'}
                    </SaveButton>
                  </>
                ) : (
                  <>
                    {canEdit && (
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
                {isEditMode ? (
                  <EditInput
                    type="text"
                    value={editData.confirmedDate || ''}
                    onChange={(e) => handleEditChange('confirmedDate', e.target.value)}
                    placeholder="예: 25.07.19"
                    style={{ 
                      width: '100%', 
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      padding: '0.1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '2px',
                      background: 'white'
                    }}
                  />
                ) : (
                  editData.confirmedDate || property.confirmedDate || '25.07.19'
                )}
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
                        console.log('🔍 매물 ID:', property.id);
                        
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
                  maxWidth: '600px', /* 가로 화면만 페이지 넘김 도구 안으로 좁힘 */
                  height: '280px',
                  background: '#f3f4f6',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: '1rem',
                  position: 'relative',
                  margin: '0 auto' /* 중앙 정렬 */
                }}>
                  {isAdmin && (
                    <ImageUploadButton
                      onClick={() => {
                        console.log('📷 사진업로드 버튼 클릭 (빈 상태)');
                        console.log('🔍 fileInputRef.current:', fileInputRef.current);
                        console.log('🔍 관리자 권한:', isAdmin);
                        console.log('🔍 매물 ID:', property.id);
                        
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
                          <EditInput
                            type="number"
                            value={editData.keyDepositMonthly || 0}
                            onChange={(e) => handleEditChange('keyDepositMonthly', parseInt(e.target.value) || 0)}
                            placeholder="기보증금/월세 (만원)"
                          />
                        ) : (
                          editData.keyDepositMonthly && editData.keyDepositMonthly > 0 
                            ? `${editData.keyDepositMonthly}만원` 
                            : '-'
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
                            value={editData.loanAmount || 0}
                            onChange={(e) => handleEditChange('loanAmount', parseInt(e.target.value) || 0)}
                            placeholder="융자금 (억 단위)"
                          />
                        ) : (
                          editData.loanAmount && editData.loanAmount > 0
                            ? formatPrice(editData.loanAmount)
                            : '-'
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
                          editData.deposit && editData.deposit > 0
                            ? formatDeposit(editData.deposit)
                            : '정보 없음'
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
                          editData.rentPrice && editData.rentPrice > 0
                            ? `${editData.rentPrice}만원`
                            : '정보 없음'
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
                            value={editData.keyMoney || 0}
                            onChange={(e) => handleEditChange('keyMoney', parseInt(e.target.value) || 0)}
                            placeholder="권리금 (만원)"
                          />
                        ) : (
                          editData.keyMoney && editData.keyMoney > 0
                            ? `${editData.keyMoney}만원`
                            : '-'
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
                        placeholder="매물현황"
                      />
                    ) : (
                      editData.propertyStatus || '-'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                {/* 오른쪽 섹션 */}
                <PropertyInfoItem>
                  <PropertyInfoLabel>해당층/전체층</PropertyInfoLabel>
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
                        const supplyAreaM2 = Math.round(supplyArea);
                        const supplyAreaPyeong = Math.round(supplyArea / 3.3058);
                        const dedicatedAreaM2 = Math.round(dedicatedArea);
                        const dedicatedAreaPyeong = Math.round(dedicatedArea / 3.3058);
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
                {/* 오른쪽 섹션 */}
                <PropertyInfoItem>
                  <PropertyInfoLabel>면적정보</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '50px' }}>공급:</span>
                          <EditInput
                            type="number"
                            step="0.01"
                            value={editData.supplyArea || ''}
                            onChange={(e) => {
                              const m2Value = parseFloat(e.target.value) || 0;
                              handleEditChange('supplyArea', m2Value);
                            }}
                            placeholder="공급면적 (m²)"
                            style={{ flex: 1 }}
                          />
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>m²</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '50px' }}>전용:</span>
                          <EditInput
                            type="number"
                            step="0.01"
                            value={editData.area || ''}
                            onChange={(e) => {
                              const m2Value = parseFloat(e.target.value) || 0;
                              handleEditChange('area', m2Value);
                            }}
                            placeholder="전용면적 (m²)"
                            style={{ flex: 1 }}
                          />
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>m²</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {editData.supplyArea && editData.supplyArea > 0 ? (
                          `공급${editData.supplyArea.toFixed(2)}m²(${(editData.supplyArea / 3.3058).toFixed(2)}평)/전용${editData.area.toFixed(2)}m²(${(editData.area / 3.3058).toFixed(2)}평)`
                        ) : (
                          `전용${editData.area.toFixed(2)}m²(${(editData.area / 3.3058).toFixed(2)}평)`
                        )}
                      </div>
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                {/* 왼쪽 섹션 */}
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
                {/* 오른쪽 섹션 */}
                <PropertyInfoItem>
                  <PropertyInfoLabel>건축물용도</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.buildingUse || ''}
                        onChange={(e) => handleEditChange('buildingUse', e.target.value)}
                        placeholder="건축물용도"
                      />
                    ) : (
                      editData.buildingUse || '-'
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                {/* 왼쪽 섹션 */}
                <PropertyInfoItem>
                  <PropertyInfoLabel>방/화장실</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={(() => {
                          // 편집 모드에서는 editData의 값을 직접 사용
                          // roomBathInfo에 전체 텍스트가 있으면 그대로 표시 (텍스트+숫자+텍스트 포함)
                          const textInfo = editData.roomBathInfo;
                          if (textInfo && textInfo.trim() !== '') {
                            return textInfo;
                          }
                          
                          // roomBathInfo가 없거나 빈 문자열이면 숫자 정보만 표시
                          const bed = editData.bedrooms;
                          const bath = editData.bathrooms;
                          if (bed !== undefined && bed !== null && bath !== undefined && bath !== null) {
                            return `${bed}/${bath}`;
                          } else if (bed !== undefined && bed !== null) {
                            return `${bed}`;
                          } else if (bath !== undefined && bath !== null) {
                            return `/${bath}`;
                          }
                          return '';
                        })()}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            handleEditChange('bedrooms', undefined);
                            handleEditChange('bathrooms', undefined);
                            handleEditChange('roomBathInfo', undefined);
                            return;
                          }
                          
                          // 숫자가 있는지 확인
                          const hasNumbers = /\d+/.test(value);
                          
                          if (hasNumbers) {
                            // 숫자가 있으면 숫자를 추출하여 bedrooms/bathrooms에 저장
                            // "/" 구분자가 있는 경우
                            if (value.includes('/')) {
                              const parts = value.split('/');
                              // 숫자만 추출
                              const bedMatch = parts[0].match(/\d+/);
                              const bathMatch = parts[1]?.match(/\d+/);
                              const bedrooms = bedMatch ? parseInt(bedMatch[0]) : undefined;
                              const bathrooms = bathMatch ? parseInt(bathMatch[0]) : undefined;
                              handleEditChange('bedrooms', bedrooms);
                              handleEditChange('bathrooms', bathrooms);
                            } else {
                              // 숫자만 있는 경우
                              const numbers = value.match(/\d+/g);
                              if (numbers && numbers.length >= 2) {
                                handleEditChange('bedrooms', parseInt(numbers[0]));
                                handleEditChange('bathrooms', parseInt(numbers[1]));
                              } else if (numbers && numbers.length === 1) {
                                handleEditChange('bedrooms', parseInt(numbers[0]));
                                handleEditChange('bathrooms', undefined);
                              } else {
                                handleEditChange('bedrooms', undefined);
                                handleEditChange('bathrooms', undefined);
                              }
                            }
                            
                            // 전체 텍스트를 roomBathInfo에 저장 (텍스트+숫자+텍스트 포함)
                            handleEditChange('roomBathInfo', value);
                          } else {
                            // 숫자가 없으면 텍스트 정보로만 저장
                            handleEditChange('roomBathInfo', value);
                            handleEditChange('bedrooms', undefined);
                            handleEditChange('bathrooms', undefined);
                          }
                        }}
                        placeholder="방/화장실 (예: 3/2, 외부 남녀구분, 외부 남녀구분 2/1, 또는 외부 남녀구분 2/1 내부)"
                      />
                    ) : (
                      (() => {
                        // 편집 모드가 아닐 때는 항상 property의 값을 직접 사용 (현재 매물의 실제 데이터)
                        // editData는 사용하지 않음 (다른 매물 데이터가 섞일 수 있음)
                        if (!property) return '-';
                        
                        // roomBathInfo에 전체 텍스트가 있으면 그대로 표시 (텍스트, 텍스트+숫자 모두 가능)
                        const textInfo = property.roomBathInfo;
                        if (textInfo && textInfo.trim() !== '') {
                          // roomBathInfo가 있으면 그대로 표시 (텍스트, 숫자, 텍스트+숫자 모두 표시)
                          return textInfo;
                        }
                        
                        // roomBathInfo가 없거나 빈 문자열이면 숫자 정보만 표시
                        const bed = property.bedrooms;
                        const bath = property.bathrooms;
                        if (bed !== undefined && bed !== null && bath !== undefined && bath !== null) {
                          return `${bed}/${bath}`;
                        } else if (bed !== undefined && bed !== null) {
                          return `${bed}`;
                        } else if (bath !== undefined && bath !== null) {
                          return `화장실 ${bath}`;
                        }
                        return '-';
                      })()
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                {/* 오른쪽 섹션 */}
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
                {/* 왼쪽 섹션 */}
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
                {/* 오른쪽 섹션 */}
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
                {/* 왼쪽 섹션 */}
                <PropertyInfoItem>
                  <PropertyInfoLabel>건축물용도</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.propertyType === 'commercial' ? '상가' : editData.propertyType === 'office' ? '사무실' : editData.propertyType === 'building' ? '건물' : '기타'}
                        readOnly
                        style={{ backgroundColor: '#f3f4f6' }}
                      />
                    ) : (
                      editData.propertyType === 'commercial' ? '상가' :
                      editData.propertyType === 'office' ? '사무실' :
                      editData.propertyType === 'building' ? '건물' : '기타'
                    )}
                  </PropertyInfoValue>
              </PropertyInfoItem>
              <PropertyInfoItem>
                <PropertyInfoLabel>방/화장실</PropertyInfoLabel>
                <PropertyInfoValue>
                    {isEditMode ? (
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
                    ) : (
                      `${editData.bedrooms || 0} / ${editData.bathrooms || 0}`
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
                {/* 오른쪽 섹션 */}
                <PropertyInfoItem>
                  <PropertyInfoLabel>주차대수</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        type="text"
                        value={(() => {
                          // 편집 모드에서는 editData의 값을 직접 사용
                          const parkingSpaces = editData.parkingSpaces;
                          if (parkingSpaces === undefined || parkingSpaces === null) return '';
                          return typeof parkingSpaces === 'string' ? parkingSpaces : String(parkingSpaces);
                        })()}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          handleEditChange('parkingSpaces', value || undefined);
                        }}
                        placeholder="주차대수 (예: 4대 또는 4(옥외),22(옥내))"
                      />
                    ) : (
                      (() => {
                        // 편집 모드가 아닐 때는 항상 property의 주차대수를 직접 사용 (현재 매물의 실제 데이터)
                        // editData는 사용하지 않음 (다른 매물 데이터가 섞일 수 있음)
                        // property 객체가 변경될 때 확실히 반영되도록 property.id도 확인
                        if (!property || !property.id) return '-';
                        
                        const parkingSpaces = property.parkingSpaces;
                        if (parkingSpaces === undefined || parkingSpaces === null) return '-';
                        
                        // 문자열인 경우 그대로 표시
                        if (typeof parkingSpaces === 'string') {
                          return parkingSpaces;
                        }
                        // 숫자인 경우도 문자열로 변환하여 표시 (기존 데이터 호환성)
                        if (typeof parkingSpaces === 'number') {
                          return `${parkingSpaces}대`;
                        }
                        // 기타 경우
                        return String(parkingSpaces);
                      })()
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                {/* 왼쪽 섹션 */}
                <PropertyInfoItem>
                  <PropertyInfoLabel>주차대수</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        type="number"
                        value={editData.parkingCount || 0}
                        onChange={(e) => handleEditChange('parkingCount', parseInt(e.target.value) || 0)}
                        placeholder="주차대수"
                      />
                    ) : (
                      editData.parkingCount && editData.parkingCount > 0 ? `${editData.parkingCount}대` : '-'
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
                        type="date"
                        value={(() => {
                          const date = editData.approvalDate || property.approvalDate || '';
                          if (!date) return '';
                          // 문자열인 경우 날짜 형식 확인 (우선 처리)
                          if (typeof date === 'string') {
                            // YYYY-MM-DD 형식이면 그대로 사용 (타임존 문제 방지)
                            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                              return date;
                            }
                            // 다른 형식의 날짜 문자열 처리
                            const dateMatch = date.match(/(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
                            if (dateMatch) {
                              return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                            }
                            // 숫자 문자열인 경우
                            const numDate = parseFloat(date);
                            if (!isNaN(numDate)) {
                              const excelEpoch = new Date(1899, 11, 30);
                              const convertedDate = new Date(excelEpoch.getTime() + numDate * 86400000);
                              // 로컬 날짜를 직접 포맷팅하여 타임존 문제 방지
                              const year = convertedDate.getFullYear();
                              const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
                              const day = String(convertedDate.getDate()).padStart(2, '0');
                              return `${year}-${month}-${day}`;
                            }
                            return date;
                          }
                          // 숫자 형식인 경우 날짜로 변환 (타임존 문제 방지를 위해 로컬 날짜 직접 계산)
                          if (typeof date === 'number') {
                            const excelEpoch = new Date(1899, 11, 30);
                            const convertedDate = new Date(excelEpoch.getTime() + date * 86400000);
                            // 로컬 날짜를 직접 포맷팅하여 타임존 문제 방지
                            const year = convertedDate.getFullYear();
                            const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
                            const day = String(convertedDate.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          }
                          return '';
                        })()}
                        onChange={(e) => handleEditChange('approvalDate', e.target.value)}
                        placeholder="사용승인일"
                      />
                    ) : (
                      (() => {
                        const date = editData.approvalDate || property.approvalDate || '';
                        if (!date) return '-';
                        // 숫자 형식인 경우 날짜로 변환
                        if (typeof date === 'number') {
                          const excelEpoch = new Date(1899, 11, 30);
                          const convertedDate = new Date(excelEpoch.getTime() + date * 86400000);
                          // 타임존 문제 방지를 위해 로컬 날짜를 직접 포맷팅
                          const year = convertedDate.getFullYear();
                          const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
                          const day = String(convertedDate.getDate()).padStart(2, '0');
                          return `${year}.${month}.${day}`;
                        }
                        // 문자열인 경우 날짜 형식 확인
                        if (typeof date === 'string') {
                          // YYYY-MM-DD 형식인 경우
                          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                            const [year, month, day] = date.split('-');
                            return `${year}.${month}.${day}`;
                          }
                          // 다른 형식의 날짜 문자열 처리
                          const dateMatch = date.match(/(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
                          if (dateMatch) {
                            return `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`;
                          }
                          // 숫자 문자열인 경우
                          const numDate = parseFloat(date);
                          if (!isNaN(numDate)) {
                            const excelEpoch = new Date(1899, 11, 30);
                            const convertedDate = new Date(excelEpoch.getTime() + numDate * 86400000);
                            // 타임존 문제 방지를 위해 로컬 날짜를 직접 포맷팅
                            const year = convertedDate.getFullYear();
                            const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
                            const day = String(convertedDate.getDate()).padStart(2, '0');
                            return `${year}.${month}.${day}`;
                          }
                          return date;
                        }
                        return '-';
                      })()
                    )}
                  </PropertyInfoValue>
                </PropertyInfoItem>
                <PropertyInfoItem>
                  <PropertyInfoLabel>추천업종</PropertyInfoLabel>
                  <PropertyInfoValue>
                    {isEditMode ? (
                      <EditInput
                        value={editData.recommendedBusinessType || editData.recommendedBusiness || ''}
                        onChange={(e) => {
                          handleEditChange('recommendedBusinessType', e.target.value);
                          handleEditChange('recommendedBusiness', e.target.value);
                        }}
                        placeholder="추천업종"
                      />
                    ) : (
                      <span style={{
                        color: '#dc2626',
                        fontWeight: '700',
                        display: 'inline-block'
                      }}>
                        {editData.recommendedBusinessType || editData.recommendedBusiness || '-'}
                      </span>
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
                    style={{ minHeight: '150px' }}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.6' }}>{editData.description || '-'}</div>
                )}
            </div>
          </Section>

          <Section>
            <SectionTitle style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '21rem' }}>
              <span>연락처</span>
              {((property.location && property.location.lat && property.location.lng) || 
                (editData.location && editData.location.lat && editData.location.lng)) && (
                <span>위치정보</span>
              )}
            </SectionTitle>
            <ContactSectionContainer>
              <ContactInfo>
                <ContactHeader>
                  {isEditMode ? (
                    <EditInput
                      value={editData.contact.name || ''}
                      onChange={(e) => handleNestedEditChange('contact', 'name', e.target.value)}
                      placeholder="상호명    대표 이름"
                      style={{ fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  ) : (
                    <ContactName>
                      {(() => {
                        const { companyName, representativeName } = parseContactName(editData.contact.name || property.contact.name || '');
                        return (
                          <>
                            <span>{companyName || '피에이공인중개사사무소'}</span>
                            {representativeName && (
                              <span style={{ marginLeft: '1rem', fontWeight: 'normal' }}>대표 {representativeName}</span>
                            )}
                          </>
                        );
                      })()}
                    </ContactName>
                  )}
                </ContactHeader>
                <ContactContent>
                  <ContactPhotoSection>
                    <ContactPhoto 
                      src={editData.contact.photo || '/contact-photo.jpg'}
                      onClick={() => {
                        if (isAdmin && contactPhotoInputRef.current) {
                          contactPhotoInputRef.current.click();
                        }
                      }}
                      style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                    >
                      <img 
                        src={editData.contact.photo || `${process.env.PUBLIC_URL || ''}/contact-photo.jpg`}
                        alt="연락처 사진"
                        onLoad={() => {
                          console.log('✅ 연락처 사진 로드 성공:', editData.contact.photo || `${process.env.PUBLIC_URL || ''}/contact-photo.jpg`);
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const defaultPhoto = `${process.env.PUBLIC_URL || ''}/contact-photo.jpg`;
                          console.error('❌ 연락처 사진 로드 실패:', {
                            attemptedUrl: target.src,
                            defaultPhoto: defaultPhoto,
                            currentSrc: editData.contact.photo,
                            windowOrigin: window.location.origin,
                            publicUrl: process.env.PUBLIC_URL
                          });
                          // 기본 이미지로 재시도 (다른 경로 시도)
                          if (!target.src.includes('contact-photo.jpg') || target.src !== window.location.origin + defaultPhoto) {
                            target.src = defaultPhoto;
                            // 그래도 실패하면 절대 경로 시도
                            setTimeout(() => {
                              if (target.complete && target.naturalHeight === 0) {
                                target.src = '/contact-photo.jpg';
                              }
                            }, 100);
                          }
                        }}
                        style={{ display: 'block' }}
                      />
                      {!editData.contact.photo && (
                        <ContactPhotoText src={undefined} show={true}>
                          <span className="label-center">사진입력</span>
                        </ContactPhotoText>
                      )}
                    </ContactPhoto>
                    {isAdmin && (
                      <ContactPhotoButton
                        onClick={() => {
                          if (contactPhotoInputRef.current) {
                            contactPhotoInputRef.current.click();
                          }
                        }}
                      >
                        사진입력
                      </ContactPhotoButton>
                    )}
                  </ContactPhotoSection>
                  <ContactDetails>
                    <ContactItem>
                      <ContactLabel>전화번호</ContactLabel>
                      <ContactValue>
                        {isEditMode ? (
                          <EditInput
                            value={editData.contact.phone || ''}
                            onChange={(e) => handleNestedEditChange('contact', 'phone', e.target.value)}
                            placeholder="전화번호를 입력하세요"
                          />
                        ) : (
                          (() => {
                            const phone = editData.contact.phone || property.contact?.phone || '032-424-0111';
                            // 쉼표로 구분된 전화번호를 줄바꿈으로 표시
                            if (phone.includes(',')) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'right' }}>
                                  {phone.split(',').map((num, idx) => (
                                    <span key={idx}>{num.trim()}</span>
                                  ))}
                                </div>
                              );
                            }
                            return phone;
                          })()
                        )}
                      </ContactValue>
                    </ContactItem>
                    <ContactItem>
                      <ContactLabel>이메일</ContactLabel>
                      <ContactValue>
                        {isEditMode ? (
                          <EditInput
                            type="email"
                            value={editData.contact.email || ''}
                            onChange={(e) => handleNestedEditChange('contact', 'email', e.target.value)}
                            placeholder="이메일을 입력하세요"
                          />
                        ) : (
                          editData.contact.email || property.contact?.email || 'kongri61@naver.com'
                        )}
                      </ContactValue>
                    </ContactItem>
                  </ContactDetails>
                </ContactContent>
              </ContactInfo>
              {(() => {
                // 위치 정보 변환 및 확인
                const rawLocation = property.location || editData.location;
                const location = convertLocation(rawLocation);
                const hasValidLocation = location && location.lat && location.lng && location.lat !== 0 && location.lng !== 0;
                
                return hasValidLocation ? (
                  <SmallMapWrapper>
                    <SmallMapContainer>
                      <SmallMapDiv ref={smallMapRef} />
                    </SmallMapContainer>
                  </SmallMapWrapper>
                ) : (
                  <SmallMapWrapper>
                    <div style={{ 
                      width: '100%', 
                      height: window.innerWidth <= 768 ? '200px' : '140px',
                      background: '#f3f4f6',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      fontSize: '0.875rem'
                    }}>
                      위치정보 없음
                    </div>
                  </SmallMapWrapper>
                );
              })()}
            </ContactSectionContainer>
            <input
              ref={contactPhotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleContactPhotoUpload}
              style={{ 
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                visibility: 'hidden',
                pointerEvents: 'none'
              }}
            />
          </Section>
          </LeftPanel>
        </ModalContent>
        
        {/* 숨겨진 파일 입력 - 매물 이미지 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple // 여러 파일 동시 선택 가능
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