import { uploadImage } from '../firebase/storageService';

// Base64 이미지를 Firebase Storage로 마이그레이션
export const migrateBase64ToFirebase = async (base64Url: string): Promise<string> => {
  try {
    // Base64 데이터에서 파일 정보 추출
    const matches = base64Url.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // MIME 타입에서 파일 확장자 추출
    const extension = mimeType.split('/')[1] || 'jpg';
    
    // Base64를 Blob으로 변환
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Blob을 File 객체로 변환
    const fileName = `migrated_${Date.now()}.${extension}`;
    const file = new File([blob], fileName, { type: mimeType });
    
    // Firebase Storage에 업로드
    const firebaseUrl = await uploadImage(file, 'properties');
    
    console.log('✅ Base64 이미지 마이그레이션 완료:', firebaseUrl);
    return firebaseUrl;
    
  } catch (error) {
    console.error('❌ Base64 이미지 마이그레이션 실패:', error);
    throw error;
  }
};

// 매물의 모든 Base64 이미지를 Firebase Storage로 마이그레이션
export const migratePropertyImages = async (property: any): Promise<any> => {
  try {
    if (!property.images || property.images.length === 0) {
      return property;
    }

    console.log(`🔄 매물 ${property.id}의 이미지 마이그레이션 시작...`);
    
    const migratedImages: string[] = [];
    
    for (let i = 0; i < property.images.length; i++) {
      const imageUrl = property.images[i];
      
      // Base64 이미지인지 확인
      if (imageUrl.startsWith('data:image/')) {
        console.log(`📷 이미지 ${i + 1}/${property.images.length} 마이그레이션 중...`);
        try {
          const firebaseUrl = await migrateBase64ToFirebase(imageUrl);
          migratedImages.push(firebaseUrl);
          console.log(`✅ 이미지 ${i + 1} 마이그레이션 완료`);
        } catch (error) {
          console.error(`❌ 이미지 ${i + 1} 마이그레이션 실패:`, error);
          // 실패한 이미지는 원본 유지
          migratedImages.push(imageUrl);
        }
      } else {
        // 이미 Firebase URL이거나 다른 형태의 URL
        migratedImages.push(imageUrl);
      }
    }
    
    const migratedProperty = {
      ...property,
      images: migratedImages
    };
    
    console.log(`✅ 매물 ${property.id} 이미지 마이그레이션 완료`);
    return migratedProperty;
    
  } catch (error) {
    console.error('❌ 매물 이미지 마이그레이션 실패:', error);
    return property;
  }
};

// 모든 매물의 Base64 이미지를 마이그레이션
export const migrateAllPropertyImages = async (properties: any[]): Promise<any[]> => {
  console.log(`🔄 전체 매물 이미지 마이그레이션 시작... (${properties.length}개 매물)`);
  
  const migratedProperties: any[] = [];
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    console.log(`📦 매물 ${i + 1}/${properties.length} 처리 중...`);
    
    try {
      const migratedProperty = await migratePropertyImages(property);
      migratedProperties.push(migratedProperty);
      console.log(`✅ 매물 ${i + 1} 처리 완료`);
    } catch (error) {
      console.error(`❌ 매물 ${i + 1} 처리 실패:`, error);
      // 실패한 매물은 원본 유지
      migratedProperties.push(property);
    }
  }
  
  console.log(`✅ 전체 매물 이미지 마이그레이션 완료`);
  return migratedProperties;
};
