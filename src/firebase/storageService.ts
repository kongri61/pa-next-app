import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  UploadMetadata
} from 'firebase/storage';
import { storage } from './config';

// 이미지 업로드 (Firebase Storage 우선, 실패 시 Base64 fallback)
// Firebase Storage에 업로드하여 다운로드 URL만 Firestore에 저장 (문서 크기 제한 없음)
export const uploadImage = async (
  file: File, 
  folder: string = 'properties',
  metadata?: UploadMetadata
): Promise<string> => {
  try {
    console.log('🔥 이미지 업로드 시작:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder: folder
    });

    // Firebase Storage에 업로드 시도 (다운로드 URL만 Firestore에 저장)
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;
      
      console.log('📤 Firebase Storage 업로드 시도:', filePath);
      
      // 이미지 압축 (Storage는 크기 제한이 크지만 네트워크 효율을 위해 압축)
      let fileToUpload = file;
      if (file.size > 2 * 1024 * 1024) { // 2MB 이상이면 압축
        try {
          fileToUpload = await compressImage(file, 1920, 0.85); // 최대 너비 1920px, 품질 85%
          const compressedSizeMB = (fileToUpload.size / 1024 / 1024).toFixed(2);
          const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
          console.log(`✅ 압축 완료: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
        } catch (compressError) {
          console.warn('⚠️ 압축 실패, 원본 파일 사용:', compressError);
          fileToUpload = file;
        }
      }
      
      const storageRef = ref(storage, filePath);
      
      // 타임아웃 설정 (5초)
      const uploadPromise = uploadBytes(storageRef, fileToUpload, {
        contentType: file.type,
        ...metadata
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('업로드 타임아웃')), 5000);
      });
      
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any;
      
      console.log('✅ Firebase Storage 업로드 완료:', snapshot.metadata.fullPath);
      
      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ 다운로드 URL 획득:', downloadURL);
      console.log('✅ Firestore에 URL만 저장 (크기: 약 ' + downloadURL.length + ' bytes)');
      
      return downloadURL;
    } catch (storageError: any) {
      // CORS 오류 또는 네트워크 오류 감지
      const errorMessage = storageError?.message || String(storageError || '');
      const isCorsError = errorMessage.includes('CORS') || 
                         errorMessage.includes('ERR_FAILED') || 
                         errorMessage.includes('network') ||
                         errorMessage.includes('타임아웃');
      
      console.warn('⚠️ Firebase Storage 업로드 실패:', errorMessage);
      if (isCorsError) {
        console.warn('⚠️ CORS 오류 감지 - Base64로 자동 전환');
      } else {
        console.warn('⚠️ 업로드 실패 - Base64로 자동 전환');
      }
      
      // Storage 업로드 실패 시 Base64로 fallback
      console.log('📝 Base64 변환 시작 (Fallback)...');
      
      try {
        // Base64 변환 전에 이미지 압축 (Firestore 문서 크기 제한 준수)
        let fileToConvert = file;
        
        // Firestore 문서 크기 제한(1MB)을 고려하여 각 이미지를 약 80KB 이하로 압축
        if (file.size > 100 * 1024) { // 100KB 이상이면 압축
          try {
            // 더 강한 압축 적용 (최대 너비 1000px, 품질 70%)
            fileToConvert = await compressImage(file, 1000, 0.7);
            const compressedSizeKB = (fileToConvert.size / 1024).toFixed(2);
            const originalSizeKB = (file.size / 1024).toFixed(2);
            console.log(`✅ Base64용 압축 완료: ${originalSizeKB}KB → ${compressedSizeKB}KB`);
            
            // 압축 후에도 여전히 크면 추가 압축
            if (fileToConvert.size > 150 * 1024) { // 150KB 이상이면 추가 압축
              console.log(`🗜️ 추가 압축 중: ${file.name}`);
              fileToConvert = await compressImage(file, 800, 0.65); // 최대 너비 800px, 품질 65%
              const finalSizeKB = (fileToConvert.size / 1024).toFixed(2);
              console.log(`✅ 추가 압축 완료: ${compressedSizeKB}KB → ${finalSizeKB}KB`);
            }
          } catch (compressError) {
            console.warn('⚠️ 압축 실패, 원본 파일 사용:', compressError);
            fileToConvert = file;
          }
        }
        
        const base64Url = await convertToBase64(fileToConvert);
        const base64SizeKB = (base64Url.length / 1024).toFixed(2);
        const base64SizeMB = (base64Url.length / 1024 / 1024).toFixed(2);
        console.log('✅ Base64 변환 완료, 길이:', base64Url.length, `(${base64SizeKB}KB / ${base64SizeMB}MB)`);
        console.warn('⚠️ Base64 사용 중 - Firestore 문서 크기 제한(1MB) 주의');
        
        // Base64 크기가 너무 크면 경고
        if (base64Url.length > 80 * 1024) { // 80KB 이상이면 경고
          console.warn(`⚠️ Base64 이미지 크기가 큽니다 (${base64SizeKB}KB). 여러 이미지 업로드 시 Firestore 제한에 걸릴 수 있습니다.`);
        }
        
        return base64Url;
      } catch (base64Error) {
        console.error('❌ Base64 변환도 실패:', base64Error);
        throw new Error('이미지 업로드에 실패했습니다. (Storage 및 Base64 변환 모두 실패)');
      }
    }
  } catch (error) {
    console.error('❌ 이미지 업로드 실패:', error);
    throw new Error('이미지 업로드에 실패했습니다.');
  }
};


// 파일을 Base64로 변환하는 함수
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      console.log('✅ Base64 변환 완료');
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      console.error('❌ Base64 변환 실패:', error);
      reject(new Error('Base64 변환에 실패했습니다.'));
    };
    reader.readAsDataURL(file);
  });
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