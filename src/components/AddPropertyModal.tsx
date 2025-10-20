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
`;

const TemplateSection = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
`;

const TemplateTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
`;

const TemplateDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1rem;
  line-height: 1.5;
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
    const headers = [
      '매물번호', '매물제목', '매물설명', '거래유형', '매물종류',
      '매매가(억원)', '보증금(만원)', '월세(만원)', '주소', '위도', '경도',
      '공급/전용면적(평)', '공급/전용면적(㎡)', '방/화장실', '해당층/전체층',
      '주차', '엘리베이터', '확인매물날짜', '연락처이름', '연락처전화번호', '연락처이메일'
    ];

    const sampleData = [
      ['P001', '강남구 역삼동 상가', '1층 상가 매매', '매매', '상가', '8.5', '0', '0', '서울시 강남구 역삼동 123-45', '37.5008', '127.0374', '19.5', '64.5', '3/2', '1/5층', 'Y', 'Y', '25.07.19', '김부동산', '02-1234-5678', 'kim@realestate.com'],
      ['P002', '서초구 서초동 사무실', '고층 사무실 임대', '임대', '사무실', '0', '1000', '50', '서울시 서초구 서초동 456-78', '37.4947', '127.0276', '25.0', '82.5', '4/3', '10/20층', 'Y', 'Y', '25.07.20', '이부동산', '02-2345-6789', 'lee@realestate.com']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '매물정보');
    XLSX.writeFile(wb, '매물등록템플릿.xlsx');
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

      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('엑셀 파일에 데이터가 없습니다.');
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      const properties: Property[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.every(cell => !cell)) continue;

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
        const contactEmail = row[20] || 'contact@realestate.com';

        const property: Property = {
          id: propertyId,
          title,
          description,
          price,
          deposit,
          rentPrice,
          type,
          propertyType,
          address,
          location: { lat, lng },
          bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
          bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
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
          confirmedDate,
          floor,
          parking,
          elevator
        };

        properties.push(property);
        setUploadProgress((i + 1) / rows.length * 100);
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

