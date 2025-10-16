import { useState, useEffect, useCallback } from 'react';
import { 
  getProperties, 
  getProperty, 
  addProperty, 
  updateProperty, 
  deleteProperty, 
  searchProperties,
  addMultipleProperties,
  getPropertiesByLocation,
  updatePropertyImages,
  updatePropertyMapImages
} from '../firebase/propertyService';
import { Property } from '../types';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface UsePropertiesReturn {
  properties: Property[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  loadProperties: (pageSize?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  getPropertyById: (id: string) => Promise<Property | null>;
  addNewProperty: (property: Omit<Property, 'id' | 'createdAt'>) => Promise<string>;
  updateExistingProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteExistingProperty: (id: string) => Promise<void>;
  searchPropertiesByTerm: (searchTerm: string, filters?: SearchFilters) => Promise<Property[]>;
  addMultiplePropertiesToDb: (properties: Omit<Property, 'id' | 'createdAt'>[]) => Promise<string[]>;
  getPropertiesByLocationRange: (lat: number, lng: number, radiusKm?: number) => Promise<Property[]>;
  refreshProperties: () => Promise<void>;
  updatePropertyImages: (id: string, images: string[]) => Promise<void>;
  updatePropertyMapImages: (id: string, mapImages: string[]) => Promise<void>;
}

interface SearchFilters {
  propertyType?: string;
  transactionType?: string;
  maxPrice?: number;
}

export const useProperties = (): UsePropertiesReturn => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // 매물 목록 로드
  const loadProperties = useCallback(async (pageSize: number = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getProperties(pageSize);
      setProperties(result.properties);
      setLastDoc(result.lastDoc);
      setHasMore(result.properties.length === pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 더 많은 매물 로드 (페이지네이션)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !lastDoc) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getProperties(20, lastDoc);
      setProperties(prev => [...prev, ...result.properties]);
      setLastDoc(result.lastDoc);
      setHasMore(result.properties.length === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, lastDoc]);

  // 특정 매물 조회
  const getPropertyById = useCallback(async (id: string): Promise<Property | null> => {
    try {
      return await getProperty(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물을 조회하는 중 오류가 발생했습니다.');
      return null;
    }
  }, []);

  // 새 매물 추가
  const addNewProperty = useCallback(async (property: Omit<Property, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const id = await addProperty(property);
      // 새 매물을 목록에 추가
      const newProperty: Property = {
        ...property,
        id,
        createdAt: new Date()
      };
      setProperties(prev => [newProperty, ...prev]);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물을 추가하는 중 오류가 발생했습니다.');
      throw err;
    }
  }, []);

  // 매물 업데이트
  const updateExistingProperty = useCallback(async (id: string, updates: Partial<Property>): Promise<void> => {
    try {
      await updateProperty(id, updates);
      // 로컬 상태 업데이트
      setProperties(prev => 
        prev.map(property => 
          property.id === id 
            ? { ...property, ...updates, updatedAt: new Date() }
            : property
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물을 업데이트하는 중 오류가 발생했습니다.');
      throw err;
    }
  }, []);

  // 매물 삭제 (소프트 삭제)
  const deleteExistingProperty = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteProperty(id);
      // 로컬 상태에서 제거
      setProperties(prev => prev.filter(property => property.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물을 삭제하는 중 오류가 발생했습니다.');
      throw err;
    }
  }, []);

  // 매물 검색
  const searchPropertiesByTerm = useCallback(async (
    searchTerm: string, 
    filters?: SearchFilters
  ): Promise<Property[]> => {
    try {
      return await searchProperties(
        searchTerm,
        filters?.propertyType,
        filters?.transactionType,
        filters?.maxPrice
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물을 검색하는 중 오류가 발생했습니다.');
      return [];
    }
  }, []);

  // 대량 매물 추가
  const addMultiplePropertiesToDb = useCallback(async (
    properties: Omit<Property, 'id' | 'createdAt'>[]
  ): Promise<string[]> => {
    try {
      const ids = await addMultipleProperties(properties);
      // 새 매물들을 목록에 추가
      const newProperties: Property[] = properties.map((property, index) => ({
        ...property,
        id: ids[index],
        createdAt: new Date()
      }));
      setProperties(prev => [...newProperties, ...prev]);
      return ids;
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물을 대량으로 추가하는 중 오류가 발생했습니다.');
      throw err;
    }
  }, []);

  // 지역별 매물 조회
  const getPropertiesByLocationRange = useCallback(async (
    lat: number, 
    lng: number, 
    radiusKm: number = 10
  ): Promise<Property[]> => {
    try {
      return await getPropertiesByLocation(lat, lng, radiusKm);
    } catch (err) {
      setError(err instanceof Error ? err.message : '지역별 매물을 조회하는 중 오류가 발생했습니다.');
      return [];
    }
  }, []);

  // 매물 목록 새로고침
  const refreshProperties = useCallback(async () => {
    setLastDoc(null);
    setHasMore(true);
    await loadProperties();
  }, [loadProperties]);

  // 매물 이미지 업데이트 (모바일 동기화용)
  const updatePropertyImagesCallback = useCallback(async (id: string, images: string[]): Promise<void> => {
    try {
      await updatePropertyImages(id, images);
      // 로컬 상태 업데이트
      setProperties(prev => 
        prev.map(property => 
          property.id === id 
            ? { ...property, images, updatedAt: new Date() }
            : property
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물 이미지를 업데이트하는 중 오류가 발생했습니다.');
      throw err;
    }
  }, []);

  // 매물 지도 이미지 업데이트 (모바일 동기화용)
  const updatePropertyMapImagesCallback = useCallback(async (id: string, mapImages: string[]): Promise<void> => {
    try {
      await updatePropertyMapImages(id, mapImages);
      // 로컬 상태 업데이트
      setProperties(prev => 
        prev.map(property => 
          property.id === id 
            ? { ...property, mapImages, updatedAt: new Date() }
            : property
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '매물 지도 이미지를 업데이트하는 중 오류가 발생했습니다.');
      throw err;
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return {
    properties,
    loading,
    error,
    hasMore,
    lastDoc,
    loadProperties,
    loadMore,
    getPropertyById,
    addNewProperty,
    updateExistingProperty,
    deleteExistingProperty,
    searchPropertiesByTerm,
    addMultiplePropertiesToDb,
    getPropertiesByLocationRange,
    refreshProperties,
    updatePropertyImages: updatePropertyImagesCallback,
    updatePropertyMapImages: updatePropertyMapImagesCallback
  };
}; 