import React, { useEffect, useRef, useState, useImperativeHandle, memo, ForwardRefRenderFunction } from 'react';
import styled from 'styled-components';
import { Property } from '../types';

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0; /* 모바일 전용: 최소 높이 제거 */
  position: relative;
  background: #f8fafc;
  /* 모바일 전용: 부모 컨테이너의 50% 높이를 차지 */
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const MapDiv = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0; /* 모바일 전용: 최소 높이 제거 */
  flex: 1;
  position: relative;
`;

interface GoogleMapProps {
  properties: Property[];
  onMarkerClick?: (property: Property) => void;
  onClusterClick?: (properties: Property[]) => void;
}

export interface GoogleMapRef {
  setCenter: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  resetMarkers: () => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleMapComponent: ForwardRefRenderFunction<GoogleMapRef, GoogleMapProps> = ({ properties, onMarkerClick, onClusterClick }, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const markersRef = useRef<any[]>([]);
  const clustersRef = useRef<any[]>([]);
  const isInitialBoundsSet = useRef<boolean>(false); // 초기 bounds 설정 플래그
  
  // 선택 상태 관리 - 깜빡임 방지를 위해 ref 사용
  const selectedMarkerIdRef = useRef<string | null>(null);
  const selectedClusterIdRef = useRef<string | null>(null);

  // Geocoder API를 사용하여 장소 이름으로 좌표 찾기
  const findPlaceCoordinates = async (placeName: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps) {
        console.warn(`⚠️ Google Maps API가 로드되지 않았습니다. ${placeName}의 기본 좌표를 사용합니다.`);
        resolve(null);
        return;
      }

      if (!window.google.maps.Geocoder) {
        console.warn(`⚠️ Geocoder가 사용할 수 없습니다. ${placeName}의 기본 좌표를 사용합니다.`);
        resolve(null);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: placeName + ', 인천' }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          console.log(`✅ ${placeName} 좌표 찾기 성공:`, { lat: location.lat(), lng: location.lng() });
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          console.warn(`⚠️ ${placeName} 좌표를 찾을 수 없습니다. 기본 좌표를 사용합니다.`, status);
          resolve(null);
        }
      });
    });
  };

  // 초기화 범위 설정 함수 (기본 좌표만 사용)
  const initializeBounds = (map: any, isReset: boolean = false) => {
    try {
      console.log('📍 초기화 범위 설정 시작', { isReset });
      
      // 기본 좌표 (인천시청역, 인천문화예술회관, 구월문화공원)
      const topLat = 37.4563;    // 인천시청역 (상단)
      const topLng = 126.7022;
      const bottomLat = 37.4489;  // 인천문화예술회관 (하단)
      const bottomLng = 126.7015;
      const leftLat = 37.4524;    // 구월문화공원 (좌측)
      const leftLng = 126.6996;

      // 우측 경계는 상단과 하단의 경도를 기준으로 적절한 범위 유지
      const rightLng = Math.max(topLng, bottomLng) + 0.01;

      if (map) {
        if (isReset) {
          // 초기화 버튼을 눌렀을 때: fitBounds를 사용하고 줌 레벨을 낮게 설정하여 넓은 범위 표시
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(new window.google.maps.LatLng(topLat, topLng)); // 인천시청역 (상단)
          bounds.extend(new window.google.maps.LatLng(bottomLat, bottomLng)); // 인천문화예술회관 (하단)
          bounds.extend(new window.google.maps.LatLng(leftLat, leftLng)); // 구월문화공원 (좌측)
          bounds.extend(new window.google.maps.LatLng(topLat, rightLng)); // 상단-우측
          bounds.extend(new window.google.maps.LatLng(bottomLat, rightLng)); // 하단-우측

          if (!bounds.isEmpty()) {
            // 중심점 계산
            const centerLat = (topLat + bottomLat) / 2;
            const centerLng = (leftLng + rightLng) / 2;
            
            // 중심점 설정 후 줌 레벨을 15로 설정하여 가까운 범위 표시
            map.setCenter({ lat: centerLat, lng: centerLng });
            map.setZoom(15);
            
            console.log('✅ 초기화 완료 (높은 줌 레벨):', {
              centerLat,
              centerLng,
              zoom: 15,
              상단: `${topLat}, ${topLng} (인천시청역)`,
              하단: `${bottomLat}, ${bottomLng} (인천문화예술회관)`,
              좌측: `${leftLat}, ${leftLng} (구월문화공원)`,
              우측: `${rightLng}`
            });
          }
        } else {
          // 첫 화면 로드 시: 고정 줌 레벨 10 사용
          const centerLat = (topLat + bottomLat) / 2;
          const centerLng = (leftLng + rightLng) / 2;
          const targetZoom = 10;

          map.setCenter({ lat: centerLat, lng: centerLng });
          map.setZoom(targetZoom);

          console.log('✅ 초기화 완료 (고정 줌):', { 
            centerLat, 
            centerLng, 
            zoom: targetZoom,
            상단: `${topLat}, ${topLng} (인천시청역)`,
            하단: `${bottomLat}, ${bottomLng} (인천문화예술회관)`,
            좌측: `${leftLat}, ${leftLng} (구월문화공원)`
          });
        }
      }

      return { topLat, bottomLat, leftLng, rightLng };
    } catch (error) {
      console.error('❌ 초기화 범위 설정 오류:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      if (!window.google || !window.google.maps) {
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            initMap();
          }, 2000);
        } else {
          // 모바일 사이트에서는 에러 메시지를 표시하지 않음 (콘솔에만 기록)
          console.error('지도를 로드할 수 없습니다. 인터넷 연결을 확인해주세요.');
          // setError('지도를 로드할 수 없습니다. 인터넷 연결을 확인해주세요.');
        }
        return;
      }

      try {
        setError(null);
        
        // 초기화 범위 기준점 (인천시청역, 인천문화예술회관, 구월문화공원)
        const defaultTop = { lat: 37.4563, lng: 126.7022 }; // 인천시청역 (상단)
        const defaultBottom = { lat: 37.4489, lng: 126.7015 }; // 인천문화예술회관 (하단)
        const defaultLeft = { lat: 37.4524, lng: 126.6996 }; // 구월문화공원 (좌측)
        const defaultRightLng = Math.max(defaultTop.lng, defaultBottom.lng) + 0.01;
        
        // 초기 중심점 계산
        const initialCenter = {
          lat: (defaultTop.lat + defaultBottom.lat) / 2,
          lng: (defaultLeft.lng + defaultRightLng) / 2
        };
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 10, // 인천시청역, 인천문화예술회관, 구월문화공원이 보이도록 설정
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          zoomControl: false, // 줌 컨트롤 제거
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          disableDefaultUI: true, // 모든 기본 UI 제거
          clickableIcons: false, // 클릭 가능한 아이콘 제거
          draggable: true,
          scrollwheel: true,
          optimized: true,
          backgroundColor: '#f8fafc',
          tilt: 0,
          heading: 0,
          maxZoom: 30, // 최대 줌 레벨을 30으로 설정 (사용자가 수동으로 줌인할 수 있도록)
          minZoom: 5, // 최소 줌 레벨을 5로 유지하여 전체 지도 볼 수 있음
          noClear: true,
          overviewMapControl: false,
          panControl: false,
          keyboardShortcuts: false,
          isFractionalZoomEnabled: true,
          fitBounds: false,
          preserveViewport: true,
          // 지도 범위 제한 (남한 전체, 제주도 제외) - 스크롤 범위는 넓게 유지
          restriction: {
            latLngBounds: {
              north: 38.5, // 남한 북부 (강원도)
              south: 34.0, // 남한 남부 (제주도 제외)
              east: 130.5, // 동해 (강원도 동부)
              west: 124.5  // 서해 (인천 서부)
            },
            strictBounds: true // 엄격한 경계 제한
          }
        });

        mapInstance.current = map;

        // 지도 생성 직후 즉시 초기화 (강제 실행)
        setTimeout(() => {
          console.log('🚀 지도 생성 직후 초기화 실행');
          initializeBounds(map, false);
        }, 200);

        map.addListener('tilesloaded', () => {
          setIsLoaded(true);
          setError(null);
          
          // 초기 bounds 설정은 한 번만 실행
          if (!isInitialBoundsSet.current) {
            isInitialBoundsSet.current = true;
            
            // 지도가 완전히 로드된 후 bounds 설정 (한 번만)
            setTimeout(() => {
              try {
                console.log('🗺️ tilesloaded 이벤트에서 초기화 실행');
                // 초기화 범위 설정
                // 인천시청역(상단), 인천문화예술회관(하단), 구월문화공원(좌측)
                initializeBounds(map, false);
                
                // 추가로 한 번 더 확인 및 재설정 (안정성을 위해)
                setTimeout(() => {
                  const currentCenter = map.getCenter();
                  const currentZoom = map.getZoom();
                  const expectedCenter = { lat: 37.4526, lng: 126.7025 };
                  const expectedZoom = 10;
                  
                  // 중심점이 예상과 다르면 재설정
                  if (currentCenter) {
                    const latDiff = Math.abs(currentCenter.lat() - expectedCenter.lat);
                    const lngDiff = Math.abs(currentCenter.lng() - expectedCenter.lng);
                    
                    if (latDiff > 0.01 || lngDiff > 0.01 || currentZoom !== expectedZoom) {
                      console.log('🔄 지도 위치 재설정:', {
                        현재: { lat: currentCenter.lat(), lng: currentCenter.lng(), zoom: currentZoom },
                        예상: { ...expectedCenter, zoom: expectedZoom }
                      });
                      map.setCenter(expectedCenter);
                      map.setZoom(expectedZoom);
                    } else {
                      console.log('✅ 지도 위치 확인 완료:', {
                        lat: currentCenter.lat(),
                        lng: currentCenter.lng(),
                        zoom: currentZoom
                      });
                    }
                  }
                }, 1000);
              } catch (boundsError) {
                console.warn('⚠️ 초기화 범위 설정 오류:', boundsError);
                // 대체 방법: 중심점과 줌 설정 (클러스터가 보이도록 낮은 줌 레벨)
                if (map && typeof map.setCenter === 'function' && typeof map.setZoom === 'function') {
                  map.setCenter({ lat: 37.4526, lng: 126.7025 }); // 인천시청역과 인천문화예술회관 중심
                  map.setZoom(10); // 클러스터가 보이도록 줌 레벨 낮춤 (13 -> 10)
                }
              }
              
              // 지도 로드 완료 후 클러스터링 업데이트 (마커가 있으면 항상 실행)
              setTimeout(() => {
                if (markersRef.current.length > 0) {
                  console.log('🗺️ 지도 로드 완료 - 클러스터링 업데이트 시작 (초기 로드)');
                  updateClusters();
                } else {
                  console.log('⏳ 지도 로드 완료되었지만 마커가 아직 없음');
                }
              }, 300);
            }, 500); // 지도가 완전히 준비될 때까지 약간의 지연
          } else {
            // 이미 bounds가 설정된 경우에도 클러스터링 업데이트
            setTimeout(() => {
              if (markersRef.current.length > 0) {
                console.log('🗺️ 지도 타일 로드 완료 - 클러스터링 업데이트');
                updateClusters();
              }
            }, 100);
          }
        });

        // 줌 변경 시 클러스터 업데이트 (PC용 사이트와 동일)
        map.addListener('zoom_changed', () => {
          // 초기화 중이면 줌 변경 이벤트 무시
          if ((map as any).__isResetting) {
            console.log('⏸️ 초기화 중이므로 줌 변경 이벤트 무시');
            return;
          }
          
          // 줌 변경 시 즉시 클러스터 업데이트 (PC용 사이트와 동일)
          const currentZoom = map.getZoom();
          console.log(`🔍 줌 레벨 변경 감지: ${currentZoom}, 마커 수: ${markersRef.current.length}, 클러스터 수: ${clustersRef.current.length}`);
          
          // 줌 변경이 완료된 후 클러스터 업데이트 (약간의 지연으로 줌 레벨 안정화)
          if (markersRef.current.length > 0 && mapInstance.current) {
            // PC용 사이트와 동일하게 실행 (약간의 지연으로 줌 레벨이 완전히 변경된 후 실행)
            setTimeout(() => {
              const finalZoom = mapInstance.current.getZoom();
              console.log(`🔄 줌 레벨 ${finalZoom}에서 클러스터 업데이트 실행`);
              console.log(`📊 이전 클러스터 수: ${clustersRef.current.length}`);
              try {
                updateClusters();
                console.log(`✅ 클러스터 업데이트 완료 - 새로운 클러스터 수: ${clustersRef.current.length}`);
              } catch (error) {
                console.error('❌ 클러스터 업데이트 오류:', error);
              }
            }, 100);
          } else {
            console.warn('⚠️ 줌 변경 감지되었지만 마커가 없거나 지도 인스턴스가 없음', {
              markersCount: markersRef.current.length,
              hasMapInstance: !!mapInstance.current
            });
          }
        });
        
        // 지도 이동(dragend) 시에도 클러스터 업데이트
        map.addListener('dragend', () => {
          // 초기화 중이면 무시
          if ((map as any).__isResetting) {
            return;
          }
          // 지도 이동 후 클러스터 업데이트
          setTimeout(() => {
            updateClusters();
          }, 50);
        });
        
        map.addListener('error', (error: any) => {
          console.error('지도 오류:', error);
          // 모바일 사이트에서는 에러 메시지를 표시하지 않음 (콘솔에만 기록)
          // setError('지도를 로드하는 중 오류가 발생했습니다.');
        });
        
      } catch (error) {
        console.error('지도 초기화 오류:', error);
        // 모바일 사이트에서는 에러 메시지를 표시하지 않음 (콘솔에만 기록)
        // setError('지도를 초기화할 수 없습니다.');
      }
    };

    initMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  // 3단계 클러스터링 거리 계산 함수 (PC와 동일)
  const getClusterDistance = (zoom: number) => {
    // 1단계: 대형 클러스터 (매우 넓은 범위) - 낮은 줌 레벨
    const getLargeClusterDistance = () => {
      if (zoom < 7) return 0.25;  // 매우 넓은 범위
      if (zoom < 9) return 0.15;   // 넓은 범위
      if (zoom < 11) return 0.1;   // 중간 범위
      return 0.05; // 좁은 범위
    };

    // 2단계: 중형 클러스터 (중간 범위) - 중간 줌 레벨
    const getMediumClusterDistance = () => {
      if (zoom < 11) return 0.08;   // 중간 범위
      if (zoom < 13) return 0.04;   // 좁은 범위
      if (zoom < 14) return 0.02;   // 매우 좁은 범위
      return 0; // 개별 마커 (줌 14 이상)
    };

    // 3단계: 소형 클러스터 (좁은 범위) - 높은 줌 레벨 (최소 2개)
    const getSmallClusterDistance = () => {
      if (zoom < 13) return 0.025;  // 중간 범위
      if (zoom < 14) return 0.012;  // 좁은 범위
      if (zoom < 15) return 0.006;  // 매우 좁은 범위
      return 0; // 개별 마커 (줌 15 이상)
    };

    return {
      large: getLargeClusterDistance(),
      medium: getMediumClusterDistance(),
      small: getSmallClusterDistance()
    };
  };

  // 고정된 마커 아이콘 생성
  const createMarkerIcon = () => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="16" fill="#1a1a1a" stroke="white" stroke-width="2"/>
          <text x="18" y="23" text-anchor="middle" fill="white" font-size="13" font-weight="bold">1</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(36, 36),
      anchor: new window.google.maps.Point(18, 18)
    };
  };

  // 선택된 마커 아이콘 생성
  const createSelectedMarkerIcon = () => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#000000" stroke="white" stroke-width="3"/>
          <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold">1</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 20)
    };
  };

  // 1단계 대형 클러스터 아이콘 생성
  const createLargeClusterIcon = (count: number) => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="22" fill="#dc2626" stroke="white" stroke-width="4"/>
          <text x="25" y="32" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${count}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(50, 50),
      anchor: new window.google.maps.Point(25, 25)
    };
  };

  // 2단계 중형 클러스터 아이콘 생성
  const createMediumClusterIcon = (count: number) => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22.5" cy="22.5" r="20" fill="#f59e0b" stroke="white" stroke-width="3.5"/>
          <text x="22.5" y="28" text-anchor="middle" fill="white" font-size="15" font-weight="bold">${count}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(45, 45),
      anchor: new window.google.maps.Point(22.5, 22.5)
    };
  };

  // 3단계 소형 클러스터 아이콘 생성
  const createSmallClusterIcon = (count: number) => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="3"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${count}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 20)
    };
  };

  // 선택된 대형 클러스터 아이콘 생성
  const createSelectedLargeClusterIcon = (count: number) => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
          <circle cx="27" cy="27" r="24" fill="#991b1b" stroke="white" stroke-width="5"/>
          <text x="27" y="35" text-anchor="middle" fill="white" font-size="17" font-weight="bold">${count}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(54, 54),
      anchor: new window.google.maps.Point(27, 27)
    };
  };

  // 선택된 중형 클러스터 아이콘 생성
  const createSelectedMediumClusterIcon = (count: number) => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="49" height="49" viewBox="0 0 49 49" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24.5" cy="24.5" r="22" fill="#d97706" stroke="white" stroke-width="4.5"/>
          <text x="24.5" y="31" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${count}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(49, 49),
      anchor: new window.google.maps.Point(24.5, 24.5)
    };
  };

  // 선택된 소형 클러스터 아이콘 생성
  const createSelectedSmallClusterIcon = (count: number) => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="20" fill="#1e40af" stroke="white" stroke-width="4"/>
          <text x="22" y="28" text-anchor="middle" fill="white" font-size="15" font-weight="bold">${count}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(44, 44),
      anchor: new window.google.maps.Point(22, 22)
    };
  };

  // 2단계 클러스터링 함수 (PC용 사이트와 동일)
  const updateClusters = () => {
    if (!window.google) {
      console.warn('⚠️ updateClusters: Google Maps API가 로드되지 않음');
      return;
    }

    if (!mapInstance.current) {
      console.warn('⚠️ updateClusters: 지도 인스턴스가 없음');
      return;
    }

    if (markersRef.current.length === 0) {
      console.warn('⚠️ updateClusters: 마커가 없음');
      return;
    }

    // 현재 줌 레벨 확인
    const currentZoom = mapInstance.current.getZoom();
    if (currentZoom === undefined || currentZoom === null) {
      console.warn('⚠️ updateClusters: 줌 레벨을 가져올 수 없음');
      return;
    }

    // 기존 클러스터 제거
    clustersRef.current.forEach(cluster => {
      try {
        cluster.setMap(null);
      } catch (err) {
        console.error('클러스터 제거 오류:', err);
      }
    });
    clustersRef.current = [];

    // 모든 마커를 먼저 숨김 (클러스터링 로직에서 필요한 것만 표시)
    markersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (err) {
        console.error('마커 숨김 오류:', err);
      }
    });

    const zoom = mapInstance.current.getZoom();
    const clusterDistances = getClusterDistance(zoom);
    
    console.log(`🔍 3단계 클러스터링 시작 - 줌: ${zoom}, 대형거리: ${clusterDistances.large}, 중형거리: ${clusterDistances.medium}, 소형거리: ${clusterDistances.small}`);
    
    if (clusterDistances.small === 0) {
      // 개별 마커 표시 모드 - 모든 마커를 개별적으로 표시
      console.log('📍 개별 마커 표시 모드 - 마커 수:', markersRef.current.length);
      
      markersRef.current.forEach((marker, index) => {
        // 기존 이벤트 리스너 제거 (중복 방지)
        try {
          google.maps.event.clearListeners(marker, 'click');
        } catch (err) {
          // 리스너가 없을 수 있음
        }
        
        // 마커를 지도에 표시
        marker.setIcon(createMarkerIcon());
        marker.setMap(mapInstance.current);
        
        // 선택효과가 포함된 클릭 이벤트
        marker.addListener('click', () => {
          console.log('🖱️ 마커 클릭:', marker.property.title);
          
          // 이전 선택된 마커 스타일 복원
          if (selectedMarkerIdRef.current && selectedMarkerIdRef.current !== marker.property.id) {
            const previousMarker = markersRef.current.find(m => m.property.id === selectedMarkerIdRef.current);
            if (previousMarker) {
              previousMarker.setIcon(createMarkerIcon());
            }
          }
          
          // 이전 선택된 클러스터 스타일 복원
          if (selectedClusterIdRef.current) {
            const previousCluster = clustersRef.current.find(c => c.clusterId === selectedClusterIdRef.current);
            if (previousCluster) {
              let iconFunction;
              if (previousCluster.clusterType === 'large') {
                iconFunction = createLargeClusterIcon;
              } else if (previousCluster.clusterType === 'medium') {
                iconFunction = createMediumClusterIcon;
              } else {
                iconFunction = createSmallClusterIcon;
              }
              previousCluster.setIcon(iconFunction(previousCluster.clusterCount));
            }
            selectedClusterIdRef.current = null;
          }
          
          // 현재 마커 선택 상태 업데이트
          selectedMarkerIdRef.current = marker.property.id;
          
          // 선택된 마커 스타일 적용
          marker.setIcon(createSelectedMarkerIcon());
          
          // 매물목록 업데이트
          if (onMarkerClick) {
            onMarkerClick(marker.property);
          }
        });
      });
      
      console.log('✅ 개별 마커 표시 완료');
      return;
    }

    // 1단계: 대형 클러스터링 (넓은 범위) - 낮은 줌 레벨
    const largeGroups: Array<{
      center: { lat: number; lng: number };
      markers: any[];
      properties: Property[];
      type: 'large';
    }> = [];

    if (clusterDistances.large > 0) {
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        const lat = position.lat();
        const lng = position.lng();
        
        let addedToGroup = false;
        let closestGroup = null;
        let minDistance = Infinity;
        
        for (const group of largeGroups) {
          const distance = Math.sqrt(
            Math.pow(lat - group.center.lat, 2) + Math.pow(lng - group.center.lng, 2)
          );
          
          if (distance <= clusterDistances.large && distance < minDistance) {
            minDistance = distance;
            closestGroup = group;
          }
        }
        
        if (closestGroup) {
          closestGroup.markers.push(marker);
          closestGroup.properties.push(marker.property);
          
          const totalLat = closestGroup.markers.reduce((sum, m) => sum + m.getPosition().lat(), 0);
          const totalLng = closestGroup.markers.reduce((sum, m) => sum + m.getPosition().lng(), 0);
          closestGroup.center = {
            lat: totalLat / closestGroup.markers.length,
            lng: totalLng / closestGroup.markers.length
          };
          
          addedToGroup = true;
        }
        
        if (!addedToGroup) {
          largeGroups.push({
            center: { lat, lng },
            markers: [marker],
            properties: [marker.property],
            type: 'large'
          });
        }
      });
    } else {
      // 대형 클러스터링이 비활성화된 경우 모든 마커를 개별 그룹으로 처리
      markersRef.current.forEach(marker => {
        largeGroups.push({
          center: { lat: marker.getPosition().lat(), lng: marker.getPosition().lng() },
          markers: [marker],
          properties: [marker.property],
          type: 'large'
        });
      });
    }

    console.log(`🔍 1단계 대형 클러스터 생성: ${largeGroups.length}개`);

    // 2단계: 중형 클러스터링 (중간 범위) - 중간 줌 레벨
    const mediumGroups: Array<{
      center: { lat: number; lng: number };
      markers: any[];
      properties: Property[];
      type: 'large' | 'medium';
    }> = [];

    if (clusterDistances.medium > 0) {
      largeGroups.forEach(largeGroup => {
        if (largeGroup.markers.length === 1) {
          // 단일 마커는 개별 마커로 전달
          mediumGroups.push({
            ...largeGroup,
            type: 'large' // 개별 마커는 large 타입으로 처리
          });
          return;
        }

        // 대형 클러스터 내에서 중형 클러스터링 시도
        const tempMediumGroups: Array<{
          center: { lat: number; lng: number };
          markers: any[];
          properties: Property[];
          type: 'medium';
        }> = [];

        largeGroup.markers.forEach(marker => {
          const position = marker.getPosition();
          const lat = position.lat();
          const lng = position.lng();
          
          let addedToMediumGroup = false;
          let closestMediumGroup = null;
          let minMediumDistance = Infinity;
          
          for (const mediumGroup of tempMediumGroups) {
            const distance = Math.sqrt(
              Math.pow(lat - mediumGroup.center.lat, 2) + Math.pow(lng - mediumGroup.center.lng, 2)
            );
            
            if (distance <= clusterDistances.medium && distance < minMediumDistance) {
              minMediumDistance = distance;
              closestMediumGroup = mediumGroup;
            }
          }
          
          if (closestMediumGroup) {
            closestMediumGroup.markers.push(marker);
            closestMediumGroup.properties.push(marker.property);
            
            const totalLat = closestMediumGroup.markers.reduce((sum, m) => sum + m.getPosition().lat(), 0);
            const totalLng = closestMediumGroup.markers.reduce((sum, m) => sum + m.getPosition().lng(), 0);
            closestMediumGroup.center = {
              lat: totalLat / closestMediumGroup.markers.length,
              lng: totalLng / closestMediumGroup.markers.length
            };
            
            addedToMediumGroup = true;
          }
          
          if (!addedToMediumGroup) {
            tempMediumGroups.push({
              center: { lat, lng },
              markers: [marker],
              properties: [marker.property],
              type: 'medium'
            });
          }
        });

        // 중형 클러스터들을 추가 (2개 이상은 클러스터, 1개는 개별 마커로 전달)
        tempMediumGroups.forEach(mediumGroup => {
          if (mediumGroup.markers.length >= 2) {
            mediumGroups.push({
              ...mediumGroup,
              type: 'medium' as 'large' | 'medium'
            });
          } else {
            // 단일 마커는 개별 마커로 전달 (타입을 large로 설정하여 개별 마커로 처리)
            mediumGroups.push({
              ...mediumGroup,
              type: 'large' as 'large' | 'medium'
            });
          }
        });
      });
    } else {
      // 중형 클러스터링이 비활성화된 경우 대형 클러스터를 그대로 사용
      largeGroups.forEach(largeGroup => {
        mediumGroups.push({
          ...largeGroup,
          type: largeGroup.markers.length >= 2 ? 'medium' : 'large' // 2개 이상은 medium, 1개는 large(개별 마커)
        });
      });
    }

    console.log(`🔍 2단계 중형 클러스터 생성: ${mediumGroups.length}개`);

    // 3단계: 소형 클러스터링 (좁은 범위) - 높은 줌 레벨
    const finalGroups: Array<{
      center: { lat: number; lng: number };
      markers: any[];
      properties: Property[];
      type: 'large' | 'medium' | 'small';
    }> = [];

    if (clusterDistances.small > 0) {
      mediumGroups.forEach(mediumGroup => {
        if (mediumGroup.markers.length === 1) {
          // 단일 마커는 개별 마커로 처리 (이미 large 타입으로 설정됨)
          finalGroups.push(mediumGroup);
          return;
        }

        // 중형 클러스터 내에서 소형 클러스터링 시도
        const smallGroups: Array<{
          center: { lat: number; lng: number };
          markers: any[];
          properties: Property[];
          type: 'small';
        }> = [];

        mediumGroup.markers.forEach(marker => {
          const position = marker.getPosition();
          const lat = position.lat();
          const lng = position.lng();
          
          let addedToSmallGroup = false;
          let closestSmallGroup = null;
          let minSmallDistance = Infinity;
          
          for (const smallGroup of smallGroups) {
            const distance = Math.sqrt(
              Math.pow(lat - smallGroup.center.lat, 2) + Math.pow(lng - smallGroup.center.lng, 2)
            );
            
            if (distance <= clusterDistances.small && distance < minSmallDistance) {
              minSmallDistance = distance;
              closestSmallGroup = smallGroup;
            }
          }
          
          if (closestSmallGroup) {
            closestSmallGroup.markers.push(marker);
            closestSmallGroup.properties.push(marker.property);
            
            const totalLat = closestSmallGroup.markers.reduce((sum, m) => sum + m.getPosition().lat(), 0);
            const totalLng = closestSmallGroup.markers.reduce((sum, m) => sum + m.getPosition().lng(), 0);
            closestSmallGroup.center = {
              lat: totalLat / closestSmallGroup.markers.length,
              lng: totalLng / closestSmallGroup.markers.length
            };
            
            addedToSmallGroup = true;
          }
          
          if (!addedToSmallGroup) {
            smallGroups.push({
              center: { lat, lng },
              markers: [marker],
              properties: [marker.property],
              type: 'small'
            });
          }
        });

        // 소형 클러스터들을 최종 그룹에 추가 (2개 이상은 클러스터, 1개는 개별 마커)
        smallGroups.forEach(smallGroup => {
          finalGroups.push({
            ...smallGroup,
            type: smallGroup.markers.length >= 2 ? 'small' : 'large' // 2개 이상은 small, 1개는 large(개별 마커)
          });
        });
      });
    } else {
      // 소형 클러스터링이 비활성화된 경우 중형 클러스터를 그대로 사용
      mediumGroups.forEach(mediumGroup => {
        finalGroups.push({
          ...mediumGroup,
          type: mediumGroup.markers.length >= 2 ? mediumGroup.type : 'large' // 2개 이상은 원래 타입, 1개는 large(개별 마커)
        });
      });
    }

    console.log(`🔍 3단계 소형 클러스터 완료: ${finalGroups.length}개 그룹`);

    // 클러스터에 포함된 마커를 추적하기 위한 Set
    const clusteredMarkers = new Set<any>();

    finalGroups.forEach((group) => {
      if (group.markers.length === 1) {
        // 개별 마커 - 클러스터에 포함되지 않은 단일 마커
        const marker = group.markers[0];
        const property = group.properties[0];
        
        // 기존 이벤트 리스너 제거 (중복 방지)
        try {
          google.maps.event.clearListeners(marker, 'click');
        } catch (err) {
          // 리스너가 없을 수 있음
        }
        
        marker.setIcon(createMarkerIcon());
        marker.setMap(mapInstance.current);
        
        // 선택효과가 포함된 클릭 이벤트
        marker.addListener('click', () => {
          // 이전 선택된 마커 스타일 복원
          if (selectedMarkerIdRef.current && selectedMarkerIdRef.current !== marker.property.id) {
            const previousMarker = markersRef.current.find(m => m.property.id === selectedMarkerIdRef.current);
            if (previousMarker) {
              previousMarker.setIcon(createMarkerIcon());
            }
          }
          
          // 이전 선택된 클러스터 스타일 복원
          if (selectedClusterIdRef.current) {
            const previousCluster = clustersRef.current.find(c => c.clusterId === selectedClusterIdRef.current);
            if (previousCluster) {
              let iconFunction;
              if (previousCluster.clusterType === 'large') {
                iconFunction = createLargeClusterIcon;
              } else if (previousCluster.clusterType === 'medium') {
                iconFunction = createMediumClusterIcon;
              } else {
                iconFunction = createSmallClusterIcon;
              }
              previousCluster.setIcon(iconFunction(previousCluster.clusterCount));
            }
            selectedClusterIdRef.current = null;
          }
          
          // 현재 마커 선택 상태 업데이트
          selectedMarkerIdRef.current = marker.property.id;
          
          // 선택된 마커 스타일 적용
          marker.setIcon(createSelectedMarkerIcon());
          
          // 매물목록 업데이트
          if (onMarkerClick) {
            onMarkerClick(property);
          }
        });
        
      } else if (group.markers.length >= 2) {
        // 3단계 클러스터 (대형, 중형, 소형) - 최소 2개 마커만 클러스터로 표시
        let iconFunction: (count: number) => any;
        let selectedIconFunction: (count: number) => any;
        let zIndex = 10;
        
        if (group.type === 'large') {
          iconFunction = createLargeClusterIcon;
          selectedIconFunction = createSelectedLargeClusterIcon;
          zIndex = 15;
        } else if (group.type === 'medium') {
          iconFunction = createMediumClusterIcon;
          selectedIconFunction = createSelectedMediumClusterIcon;
          zIndex = 12;
        } else {
          iconFunction = createSmallClusterIcon;
          selectedIconFunction = createSelectedSmallClusterIcon;
          zIndex = 10;
        }
        
        const cluster = new window.google.maps.Marker({
          position: group.center,
          map: mapInstance.current,
          zIndex: zIndex,
          icon: iconFunction(group.markers.length)
        });

        // 클러스터 ID 설정
        const clusterId = `${group.type}_cluster_${group.center.lat.toFixed(4)}_${group.center.lng.toFixed(4)}_${group.markers.length}`;
        cluster.clusterId = clusterId;
        cluster.clusterCount = group.markers.length;
        cluster.clusterProperties = group.properties;
        cluster.clusterType = group.type;

        // 클러스터에 포함된 마커들을 추적하고 숨기기
        group.markers.forEach(marker => {
          clusteredMarkers.add(marker);
          marker.setMap(null); // 클러스터에 포함된 마커는 확실히 숨김
        });
        
        console.log(`🎯 ${group.type} 클러스터 생성 및 마커 숨김: ${group.markers.length}개 매물, 위치: ${group.center.lat.toFixed(4)}, ${group.center.lng.toFixed(4)}`);
        
        // 선택효과가 포함된 클릭 이벤트
        cluster.addListener('click', () => {
          // 이전 선택된 마커 스타일 복원
          if (selectedMarkerIdRef.current) {
            const previousMarker = markersRef.current.find(m => m.property.id === selectedMarkerIdRef.current);
            if (previousMarker) {
              previousMarker.setIcon(createMarkerIcon());
            }
            selectedMarkerIdRef.current = null;
          }
          
          // 이전 선택된 클러스터 스타일 복원
          if (selectedClusterIdRef.current && selectedClusterIdRef.current !== clusterId) {
            const previousCluster = clustersRef.current.find(c => c.clusterId === selectedClusterIdRef.current);
            if (previousCluster) {
              let prevIconFunction;
              if (previousCluster.clusterType === 'large') {
                prevIconFunction = createLargeClusterIcon;
              } else if (previousCluster.clusterType === 'medium') {
                prevIconFunction = createMediumClusterIcon;
              } else {
                prevIconFunction = createSmallClusterIcon;
              }
              previousCluster.setIcon(prevIconFunction(previousCluster.clusterCount));
            }
          }
          
          // 현재 클러스터 선택 상태 업데이트
          selectedClusterIdRef.current = clusterId;
          
          // 선택된 클러스터 스타일 적용
          cluster.setIcon(selectedIconFunction(group.markers.length));
          
          console.log(`🖱️ ${group.type} 클러스터 클릭: ${group.markers.length}개 매물`);
          
          // 매물목록 업데이트
          if (onClusterClick) {
            onClusterClick(group.properties);
          }
        });
        
        clustersRef.current.push(cluster);
      }
    });

    // 클러스터에 포함되지 않은 마커가 있는지 확인 (디버깅용)
    const unclusteredMarkers = markersRef.current.filter(m => !clusteredMarkers.has(m) && m.getMap() === null);
    if (unclusteredMarkers.length > 0) {
      console.warn(`⚠️ 클러스터에 포함되지 않은 숨겨진 마커 ${unclusteredMarkers.length}개 발견 - 자동 표시`);
      // 숨겨진 마커를 자동으로 표시
      unclusteredMarkers.forEach(marker => {
        try {
          marker.setMap(mapInstance.current);
          // 클릭 이벤트 추가
          google.maps.event.clearListeners(marker, 'click');
          marker.addListener('click', () => {
            if (onMarkerClick) {
              onMarkerClick(marker.property);
            }
          });
        } catch (err) {
          console.error('마커 표시 오류:', err);
        }
      });
    }
    
    console.log(`✅ 클러스터링 완료 - 줌: ${zoom}, 클러스터: ${clustersRef.current.length}개, 개별 마커: ${markersRef.current.length - clusteredMarkers.size}개, 클러스터된 마커: ${clusteredMarkers.size}개`);
    console.log(`📊 클러스터 거리 - 대형: ${clusterDistances.large}, 중형: ${clusterDistances.medium}, 소형: ${clusterDistances.small}`);
  };

  useEffect(() => {
    if (!mapInstance.current || !window.google) {
      console.log('⏳ 지도 인스턴스 또는 Google Maps API가 준비되지 않음');
      return;
    }

    console.log('=== GoogleMap - 매물 업데이트 ===');
    console.log('받은 매물 수:', properties.length);
    console.log('받은 매물들:', properties.map(p => ({ id: p.id, title: p.title })));
    console.log('지도 로드 상태:', isLoaded);

    try {
      // 기존 마커 제거
      markersRef.current.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (err) {
          console.error('마커 제거 오류:', err);
        }
      });
      markersRef.current = [];

      // 기존 클러스터 제거
      clustersRef.current.forEach(cluster => {
        try {
          cluster.setMap(null);
        } catch (err) {
          console.error('클러스터 제거 오류:', err);
        }
      });
      clustersRef.current = [];

      // 새 마커 생성
      properties.forEach((property, index) => {
        console.log(`🔍 매물 ${index + 1} 처리 중:`, {
          id: property.id,
          title: property.title,
          address: property.address,
          location: property.location
        });

        if (!property.location) {
          console.log(`⚠️ 매물 ${index + 1} 위치 정보 없음:`, property.title);
          return;
        }

        if (!property.location.lat || !property.location.lng) {
          console.log(`⚠️ 매물 ${index + 1} 좌표 정보 불완전:`, property.location);
          return;
        }

        try {
          console.log(`🔨 마커 생성 시작: ${property.id} - ${property.title}`);
          console.log(`📍 위치:`, property.location);
          console.log(`📍 위도:`, property.location.lat);
          console.log(`📍 경도:`, property.location.lng);
          console.log(`🗺️ 지도 인스턴스:`, mapInstance.current);
          
          const marker = new window.google.maps.Marker({
            position: { lat: property.location.lat, lng: property.location.lng },
            map: null, // 클러스터링 로직에서 표시하므로 null로 설정
            title: property.id,
            zIndex: 1,
            optimized: true,
            clickable: true,
            draggable: false,
            animation: null,
            icon: createMarkerIcon()
          });

          marker.property = property;
          markersRef.current.push(marker);
          console.log(`✅ 마커 생성 완료: ${property.id} - ${property.title}`);
          console.log(`📍 마커 위치 확인:`, marker.getPosition());
          // 클러스터링을 위해 마커는 updateClusters에서 표시됨
        } catch (err) {
          console.error('❌ 마커 생성 오류:', err);
        }
      });

      console.log('생성된 마커 수:', markersRef.current.length);

      // 클러스터링 업데이트 - 지도가 준비되면 즉시 실행
      if (markersRef.current.length > 0 && mapInstance.current) {
        if (isLoaded) {
          // 지도가 이미 로드된 경우 즉시 클러스터링 업데이트
          setTimeout(() => {
            console.log('🔄 매물 업데이트 후 클러스터링 업데이트 (지도 로드 완료)');
            updateClusters();
          }, 200);
        } else {
          // 지도가 아직 로드되지 않은 경우 tilesloaded 이벤트에서 처리되지만, 
          // 마커가 있으면 일단 표시 시도
          setTimeout(() => {
            console.log('🔄 지도 로드 대기 중이지만 마커 표시 시도');
            updateClusters();
          }, 500);
          
          // tilesloaded 이벤트에서도 처리되도록 보장
          console.log('⏳ 지도 로드 대기 중 - tilesloaded 이벤트에서도 클러스터링 업데이트 예정');
        }
      }

    } catch (error) {
      console.error('마커 생성 전체 오류:', error);
      setError('마커를 생성하는 중 오류가 발생했습니다.');
    }

    return () => {
      try {
        markersRef.current.forEach(marker => {
          try {
            marker.setMap(null);
          } catch (err) {
            console.error('마커 정리 오류:', err);
          }
        });
        clustersRef.current.forEach(cluster => {
          try {
            cluster.setMap(null);
          } catch (err) {
            console.error('클러스터 정리 오류:', err);
          }
        });
      } catch (err) {
        console.error('정리 과정 오류:', err);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, isLoaded]);

  // isLoaded가 true가 되었을 때 마커가 있으면 클러스터링 업데이트
  useEffect(() => {
    if (isLoaded && mapInstance.current && markersRef.current.length > 0) {
      console.log('🔄 지도 로드 완료 - 마커 클러스터링 업데이트');
      setTimeout(() => {
        updateClusters();
      }, 300);
    }
  }, [isLoaded]);

  useImperativeHandle(ref, () => ({
    setCenter: (position: { lat: number; lng: number } = { lat: 37.4000, lng: 126.7052 }) => {
      if (mapInstance.current) {
        mapInstance.current.panTo(position);
      }
    },
    setZoom: (zoom: number) => {
      if (mapInstance.current) {
        mapInstance.current.setZoom(zoom);
      }
    },
    resetMarkers: () => {
      try {
        // 초기화 중 플래그 설정 (줌 변경 이벤트 무시)
        (mapInstance.current as any).__isResetting = true;
        
        // 기존 에러 메시지 제거
        setError(null);
        
        // Google Maps API와 지도 인스턴스 확인
        if (!window.google || !window.google.maps) {
          console.warn('⚠️ Google Maps API가 아직 로드되지 않았습니다.');
          return;
        }
        
        if (!mapInstance.current) {
          console.warn('⚠️ 지도 인스턴스가 초기화되지 않았습니다.');
          return;
        }
        
        // 기존 마커와 클러스터 제거
        console.log('🗑️ 기존 마커 및 클러스터 제거 시작');
        markersRef.current.forEach(marker => {
          try {
            marker.setMap(null);
          } catch (err) {
            console.error('마커 제거 오류:', err);
          }
        });
        markersRef.current = [];
        
        clustersRef.current.forEach(cluster => {
          try {
            cluster.setMap(null);
          } catch (err) {
            console.error('클러스터 제거 오류:', err);
          }
        });
        clustersRef.current = [];
        console.log('✅ 기존 마커 및 클러스터 제거 완료');
        
        // 지도 초기 범위 설정
        console.log('🔄 초기화 버튼 클릭 - resetMarkers 실행');
        
        // 초기화 범위 설정 (fitBounds 사용하여 자동 줌 조정)
        const boundsResult = initializeBounds(mapInstance.current, true);
        
        if (boundsResult) {
          // fitBounds가 자동으로 줌 레벨을 조정하므로 추가 줌 설정 불필요
          // 초기화 완료 후 플래그 해제
          setTimeout(() => {
            (mapInstance.current as any).__isResetting = false;
            const finalZoom = mapInstance.current?.getZoom?.();
            const finalCenter = mapInstance.current?.getCenter?.();
            console.log('✅ 초기화 완료 - 최종 상태:', {
              zoom: finalZoom,
              center: finalCenter ? { lat: finalCenter.lat(), lng: finalCenter.lng() } : null
            });
          }, 500);
        } else {
          console.warn('⚠️ 초기화 범위 설정 실패');
          (mapInstance.current as any).__isResetting = false;
        }
        
        // 마커 재생성 (properties prop 사용)
        console.log('🔄 마커 재생성 시작 - 매물 수:', properties?.length || 0);
        
        if (properties && properties.length > 0 && mapInstance.current) {
          properties.forEach((property, index) => {
            if (!property.location || !property.location.lat || !property.location.lng) {
              console.log(`⚠️ 매물 ${index + 1} 위치 정보 없음:`, property.title);
              return;
            }

            try {
              const marker = new window.google.maps.Marker({
                position: { lat: property.location.lat, lng: property.location.lng },
                map: mapInstance.current, // 지도에 바로 표시
                title: property.id,
                zIndex: 1,
                optimized: true,
                clickable: true,
                draggable: false,
                animation: null,
                icon: createMarkerIcon()
              });

              marker.property = property;
              markersRef.current.push(marker);
            } catch (err) {
              console.error('❌ 마커 재생성 오류:', err, property);
            }
          });
          
          console.log('✅ 마커 재생성 완료 - 생성된 마커 수:', markersRef.current.length);
        } else {
          console.warn('⚠️ 마커 재생성 건너뜀:', {
            hasProperties: !!properties,
            propertiesLength: properties?.length || 0,
            hasMapInstance: !!mapInstance.current
          });
        }
        
        // 초기화 완료 후 플래그 해제 및 클러스터링 업데이트
        setTimeout(() => {
          (mapInstance.current as any).__isResetting = false;
          console.log('🔄 초기화 완료 - 클러스터링 업데이트 시작');
          console.log('📊 현재 마커 수:', markersRef.current.length);
          if (markersRef.current.length > 0 && mapInstance.current) {
            // isLoaded 체크 제거 - 지도 인스턴스가 있으면 클러스터링 실행
            updateClusters();
          } else {
            console.warn('⚠️ 클러스터링 업데이트 건너뜀:', {
              markersCount: markersRef.current.length,
              hasMapInstance: !!mapInstance.current
            });
          }
        }, 600); // 줌 레벨 설정 완료 후 클러스터링 업데이트
      } catch (error) {
        console.error('❌ resetMarkers 오류:', error);
        // 에러 메시지를 UI에 표시하지 않고 콘솔에만 기록
      }
    }
  }));

  // 모바일 사이트에서는 에러 메시지를 표시하지 않음
  const isMainServer = window.location.hostname === 'localhost' || 
                      window.location.hostname === '192.168.219.105' ||
                      window.location.hostname === 'pa-realestate-pc.vercel.app' ||
                      (window.location.hostname.includes('vercel.app') && 
                       window.location.hostname.includes('pa-realestate'));

  return (
    <MapContainer>
      <MapDiv ref={mapRef} />
      
      {/* PC 서버에서만 에러 메시지 표시 */}
      {error && isMainServer && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}
    </MapContainer>
  );
};

const GoogleMap = React.forwardRef(GoogleMapComponent);

// 커스텀 비교 함수로 불필요한 리렌더링 방지
const areEqual = (prevProps: any, nextProps: any) => {
  // properties 배열이 변경되었는지 확인
  if (prevProps.properties.length !== nextProps.properties.length) {
    return false;
  }
  
  // properties의 내용이 변경되었는지 확인 (필터링 변경 감지)
  const prevProperties = prevProps.properties;
  const nextProperties = nextProps.properties;
  
  // 각 property의 주요 속성들을 비교
  for (let i = 0; i < prevProperties.length; i++) {
    const prev = prevProperties[i];
    const next = nextProperties[i];
    
    if (prev.id !== next.id || 
        prev.type !== next.type || 
        prev.propertyType !== next.propertyType ||
        prev.price !== next.price ||
        prev.area !== next.area ||
        prev.address !== next.address) {
      return false;
    }
  }
  
  return true;
};

export default memo(GoogleMap, areEqual); 