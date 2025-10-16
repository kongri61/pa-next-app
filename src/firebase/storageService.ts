import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  UploadMetadata
} from 'firebase/storage';
import { storage } from './config';

// 이미지 업로드
export const uploadImage = async (
  file: File, 
  folder: string = 'properties',
  metadata?: UploadMetadata
): Promise<string> => {
  try {
    // 파일명에 타임스탬프 추가하여 중복 방지
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // 다운로드 URL 반환
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw new Error('이미지 업로드 중 오류가 발생했습니다.');
  }
};

// 여러 이미지 업로드
export const uploadMultipleImages = async (
  files: File[], 
  folder: string = 'properties'
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('다중 이미지 업로드 오류:', error);
    throw new Error('이미지 업로드 중 오류가 발생했습니다.');
  }
};

// 이미지 삭제
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // URL에서 파일 경로 추출
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
    
    if (!path) {
      throw new Error('유효하지 않은 이미지 URL입니다.');
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    throw new Error('이미지 삭제 중 오류가 발생했습니다.');
  }
};

// 폴더 내 모든 파일 삭제
export const deleteFolderContents = async (folder: string): Promise<void> => {
  try {
    const folderRef = ref(storage, folder);
    const result = await listAll(folderRef);
    
    const deletePromises = result.items.map(itemRef => deleteObject(itemRef));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('폴더 내용 삭제 오류:', error);
    throw new Error('폴더 내용 삭제 중 오류가 발생했습니다.');
  }
};

// 이미지 URL 유효성 검사
export const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// 이미지 압축 및 리사이징 (클라이언트 사이드)
export const compressImage = (
  file: File, 
  maxWidth: number = 800, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 이미지 크기 계산
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // 캔버스 크기 설정
      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);

      // 압축된 이미지를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('이미지 압축에 실패했습니다.'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다.'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// 파일 크기 제한 검사
export const validateFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// 파일 타입 검사
export const validateFileType = (file: File, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): boolean => {
  return allowedTypes.includes(file.type);
};

// 파일 업로드 전 검증
export const validateFile = async (
  file: File, 
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): Promise<{ isValid: boolean; error?: string }> => {
  if (!validateFileType(file, allowedTypes)) {
    return { 
      isValid: false, 
      error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP만 지원)' 
    };
  }

  if (!validateFileSize(file, maxSizeMB)) {
    return { 
      isValid: false, 
      error: `파일 크기가 너무 큽니다. (최대 ${maxSizeMB}MB)` 
    };
  }

  return { isValid: true };
}; 