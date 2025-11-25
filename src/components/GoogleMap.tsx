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

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.google || !window.google.maps) {
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            initMap();
          }, 2000);
        } else {
          setError('지도를 로드할 수 없습니다. 인터넷 연결을 확인해주세요.');
        }
        return;
      }

      try {
        setError(null);
        
        // 인천 중심점
        const incheonCenter = { lat: 37.4563, lng: 126.7052 };
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: incheonCenter,
          zoom: 10, // 인천광역시 전체가 보이도록 설정
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

        // 지도 초기 범위 설정: 인천가좌시장(상단), 인천문학경기장(하단), 인하대병원(좌측), 장수동(우측)
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(new window.google.maps.LatLng(37.4700, 126.7000)); // 인천가좌시장 (상단)
        bounds.extend(new window.google.maps.LatLng(37.4300, 126.6900)); // 인천문학경기장 (하단)
        bounds.extend(new window.google.maps.LatLng(37.4500, 126.6400)); // 인하대병원 (좌측)
        bounds.extend(new window.google.maps.LatLng(37.4200, 126.7200)); // 장수동 (우측)
        map.fitBounds(bounds);

        map.addListener('tilesloaded', () => {
          setIsLoaded(true);
          setError(null);
          
          // 초기 bounds 설정은 한 번만 실행
          if (!isInitialBoundsSet.current) {
            isInitialBoundsSet.current = true;
            
            // 지도가 완전히 로드된 후 bounds 설정 (한 번만)
            setTimeout(() => {
              try {
                if (map && bounds && !bounds.isEmpty() && typeof map.fitBounds === 'function') {
                  map.fitBounds(bounds);
                }
              } catch (boundsError) {
                console.warn('⚠️ fitBounds 오류, 대체 방법 사용:', boundsError);
                // 대체 방법: 중심점과 줌 설정
                if (map && typeof map.setCenter === 'function' && typeof map.setZoom === 'function') {
                  map.setCenter({ lat: 37.4500, lng: 126.6800 });
                  map.setZoom(13);
                }
              }
            }, 500); // 지도가 완전히 준비될 때까지 약간의 지연
          }
        });

        // 줌 변경 시 클러스터 업데이트
        map.addListener('zoom_changed', () => {
          // 초기화 중이면 줌 변경 이벤트 무시
          if ((map as any).__isResetting) {
            return;
          }
          // 줌 변경 시 즉시 클러스터 업데이트
          updateClusters();
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
          setError('지도를 로드하는 중 오류가 발생했습니다.');
        });
        
      } catch (error) {
        console.error('지도 초기화 오류:', error);
        setError('지도를 초기화할 수 없습니다.');
      }
    };

    initMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  // 2단계 클러스터링 거리 계산 함수
  const getClusterDistance = (zoom: number) => {
    const isMobile = window.innerWidth <= 768;
    
    // 1단계: 대형 클러스터 (넓은 범위) - 더 좁게 축소
    const getLargeClusterDistance = () => {
      if (isMobile) {
<<<<<<< HEAD
        if (zoom < 6) return 0.25;   // 매우 넓은 범위
        if (zoom < 8) return 0.15;   // 넓은 범위
        if (zoom < 10) return 0.08; // 중간 범위
        return 0.02; // 좁은 범위
      } else {
        if (zoom < 6) return 0.3;   // 매우 넓은 범위
        if (zoom < 8) return 0.2;   // 넓은 범위
        if (zoom < 10) return 0.1;  // 중간 범위
        return 0.04; // 좁은 범위
=======
        if (zoom < 6) return 0.15;   // 매우 넓은 범위 (0.25 -> 0.15)
        if (zoom < 8) return 0.09;   // 넓은 범위 (0.15 -> 0.09)
        if (zoom < 10) return 0.05; // 중간 범위 (0.08 -> 0.05)
        return 0.015; // 좁은 범위 (0.025 -> 0.015)
      } else {
        if (zoom < 6) return 0.18;   // 매우 넓은 범위 (0.3 -> 0.18)
        if (zoom < 8) return 0.11;   // 넓은 범위 (0.18 -> 0.11)
        if (zoom < 10) return 0.06;  // 중간 범위 (0.09 -> 0.06)
        return 0.025; // 좁은 범위 (0.04 -> 0.025)
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
      }
    };

    // 2단계: 소형 클러스터 (좁은 범위) - 더 좁게 축소
    const getSmallClusterDistance = () => {
      if (isMobile) {
<<<<<<< HEAD
        if (zoom < 10) return 0.04; // 중간 범위
        if (zoom < 12) return 0.02; // 좁은 범위
        if (zoom < 14) return 0.008; // 매우 좁은 범위
        return 0; // 개별 마커
      } else {
        if (zoom < 10) return 0.05;  // 중간 범위
        if (zoom < 12) return 0.025; // 좁은 범위
        if (zoom < 14) return 0.012; // 매우 좁은 범위
        return 0; // 개별 마커
=======
        if (zoom < 10) return 0.025;  // 중간 범위 (0.04 -> 0.025)
        if (zoom < 12) return 0.012;  // 좁은 범위 (0.02 -> 0.012)
        if (zoom < 13) return 0.006;  // 매우 좁은 범위 (0.01 -> 0.006)
        return 0; // 개별 마커 (줌 13 이상)
      } else {
        if (zoom < 10) return 0.03;   // 중간 범위 (0.05 -> 0.03)
        if (zoom < 12) return 0.015;  // 좁은 범위 (0.025 -> 0.015)
        if (zoom < 13) return 0.008;  // 매우 좁은 범위 (0.012 -> 0.008)
        return 0; // 개별 마커 (줌 13 이상)
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
      }
    };

    return {
      large: getLargeClusterDistance(),
      small: getSmallClusterDistance()
    };
  };

  // 고정된 마커 아이콘 생성
  const createMarkerIcon = () => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<<<<<<< HEAD
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#1f2937" stroke="white" stroke-width="2"/>
          <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">1</text>
=======
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="16" fill="#1a1a1a" stroke="white" stroke-width="2"/>
          <text x="18" y="23" text-anchor="middle" fill="white" font-size="13" font-weight="bold">1</text>
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
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
<<<<<<< HEAD
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="16" fill="#111827" stroke="white" stroke-width="3"/>
          <text x="18" y="23" text-anchor="middle" fill="white" font-size="13" font-weight="bold">1</text>
=======
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#000000" stroke="white" stroke-width="3"/>
          <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold">1</text>
>>>>>>> f85309789388d81d24ee5d938e63dd690806b864
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

  // 2단계 소형 클러스터 아이콘 생성
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

  // 2단계 클러스터링 함수
  const updateClusters = () => {
    if (!mapInstance.current || !window.google) return;

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
    
    console.log(`🔍 2단계 클러스터링 시작 - 줌: ${zoom}, 대형거리: ${clusterDistances.large}, 소형거리: ${clusterDistances.small}`);
    
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
              const iconFunction = previousCluster.clusterType === 'large' ? createLargeClusterIcon : createSmallClusterIcon;
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

    // 1단계: 대형 클러스터링 (넓은 범위)
    const largeGroups: Array<{
      center: { lat: number; lng: number };
      markers: any[];
      properties: Property[];
      type: 'large';
    }> = [];

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

    console.log(`🔍 1단계 대형 클러스터 생성: ${largeGroups.length}개`);

    // 2단계: 소형 클러스터링 (각 대형 클러스터 내에서)
    const finalGroups: Array<{
      center: { lat: number; lng: number };
      markers: any[];
      properties: Property[];
      type: 'large' | 'small';
    }> = [];

    largeGroups.forEach(largeGroup => {
      if (largeGroup.markers.length === 1) {
        // 단일 마커는 그대로 유지
        finalGroups.push(largeGroup);
        return;
      }

      // 대형 클러스터 내에서 소형 클러스터링 시도
      const smallGroups: Array<{
        center: { lat: number; lng: number };
        markers: any[];
        properties: Property[];
        type: 'small';
      }> = [];

      largeGroup.markers.forEach(marker => {
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

      // 소형 클러스터들을 최종 그룹에 추가
      smallGroups.forEach(smallGroup => {
        if (smallGroup.markers.length === 1) {
          // 단일 마커는 개별 마커로 처리
          finalGroups.push({
            ...smallGroup,
            type: 'large' // 개별 마커는 large 타입으로 처리
          });
        } else {
          // 소형 클러스터로 처리
          finalGroups.push(smallGroup);
        }
      });
    });

    console.log(`🔍 2단계 소형 클러스터 완료: ${finalGroups.length}개 그룹`);

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
              const iconFunction = previousCluster.clusterType === 'large' ? createLargeClusterIcon : createSmallClusterIcon;
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
        
      } else {
        // 2단계 클러스터 (대형 또는 소형)
        const isLargeCluster = group.type === 'large';
        const iconFunction = isLargeCluster ? createLargeClusterIcon : createSmallClusterIcon;
        const selectedIconFunction = isLargeCluster ? createSelectedLargeClusterIcon : createSelectedSmallClusterIcon;
        
        const cluster = new window.google.maps.Marker({
          position: group.center,
          map: mapInstance.current,
          zIndex: isLargeCluster ? 15 : 10, // 대형 클러스터가 위에 표시
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
              const prevIconFunction = previousCluster.clusterType === 'large' ? createLargeClusterIcon : createSmallClusterIcon;
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
      console.warn(`⚠️ 클러스터에 포함되지 않은 숨겨진 마커 ${unclusteredMarkers.length}개 발견`);
    }
    
    console.log(`✅ 클러스터링 완료 - 클러스터: ${clustersRef.current.length}개, 개별 마커: ${markersRef.current.length - clusteredMarkers.size}개, 클러스터된 마커: ${clusteredMarkers.size}개`);
  };

  useEffect(() => {
    if (!mapInstance.current || !window.google || !isLoaded) {
      return;
    }

    console.log('=== GoogleMap - 매물 업데이트 ===');
    console.log('받은 매물 수:', properties.length);
    console.log('받은 매물들:', properties.map(p => ({ id: p.id, title: p.title })));

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
            map: mapInstance.current,
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
          console.log(`🗺️ 마커가 지도에 표시됨:`, marker.getMap() === mapInstance.current);
          
          // 마커가 제대로 표시되었는지 확인 (안전장치)
          setTimeout(() => {
            try {
              if (marker.getMap() !== mapInstance.current) {
                console.warn(`⚠️ 마커가 지도에 표시되지 않음, 다시 표시: ${property.id}`);
                marker.setMap(mapInstance.current);
              }
            } catch (checkErr) {
              console.error(`❌ 마커 표시 확인 오류: ${property.id}`, checkErr);
            }
          }, 100);
        } catch (err) {
          console.error('❌ 마커 생성 오류:', err);
        }
      });

      console.log('생성된 마커 수:', markersRef.current.length);

      // 모든 마커가 표시되었는지 최종 확인
      setTimeout(() => {
        markersRef.current.forEach((marker, index) => {
          try {
            if (marker.getMap() !== mapInstance.current) {
              console.warn(`⚠️ 마커 ${index + 1}가 표시되지 않음, 강제 표시: ${marker.property.id}`);
              marker.setMap(mapInstance.current);
            }
          } catch (err) {
            console.error(`❌ 마커 ${index + 1} 표시 확인 오류:`, err);
          }
        });
        
        updateClusters();
      }, 200);

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
        
        if (mapInstance.current) {
          // 구월동 중심점 (초기화 버튼 클릭 시)
          const guwolDongCenter = { lat: 37.4563, lng: 126.7052 };
          mapInstance.current.panTo(guwolDongCenter);
          mapInstance.current.setZoom(14); // 구월동 주변만 보이도록 줌 레벨 높임
        }
        
        // 마커 재생성
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
        
        if (!mapInstance.current) {
          console.warn('⚠️ 지도 인스턴스가 초기화되지 않았습니다.');
          return;
        }
        
        // 지도 초기 범위 설정: 구월로(상단), 인천문화예술회관(하단), 석바위공원(좌측) - 좌측을 오른쪽으로 이동
        console.log('🔄 초기화 버튼 클릭 - resetMarkers 실행');
        
        // 원본 기준점
        const topLat = 37.456;    // 구월로 (상단)
        const bottomLat = 37.448; // 인천문화예술회관 (하단)
        const leftLng = 126.6975 + 0.0055 + 0.01;  // 좌측 경계 (석바위소공원 앞, 롯데하이마트 주안점 제외) - 0.0155만큼 오른쪽으로 이동
        const rightLng = 126.702; // 구월로 (우측)
        
        // 상하우측은 50% 더 크게 만들기 위해 각 방향으로 25% 확장, 좌측은 지정된 값 사용
        const latRange = topLat - bottomLat; // 0.008
        const lngRange = rightLng - leftLng; // 계산됨
        const latPadding = latRange * 0.25;   // 0.002
        const rightLngPadding = lngRange * 0.25;   // 우측 확장
        const leftLngPadding = 0;  // 좌측은 지정된 값 그대로 사용
        
        // 최종 좌표 계산
        const finalTopLat = topLat + latPadding;
        const finalBottomLat = bottomLat - latPadding;
        const finalLeftLng = leftLng; // 지정된 좌측 경계 사용 (석바위소공원 앞)
        const finalRightLng = rightLng + rightLngPadding;
        
        console.log('📍 초기화 bounds 설정:', {
          상단: `${finalTopLat}`,
          하단: `${finalBottomLat}`,
          좌측: `${finalLeftLng} (석바위소공원 앞, 롯데하이마트 주안점 제외)`,
          우측: `${finalRightLng}`
        });
        
        // bounds 생성 및 확장
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(new window.google.maps.LatLng(finalTopLat, finalRightLng));     // 상단-우측
        bounds.extend(new window.google.maps.LatLng(finalBottomLat, finalLeftLng));   // 하단-좌측
        bounds.extend(new window.google.maps.LatLng(finalTopLat, finalLeftLng));      // 상단-좌측
        bounds.extend(new window.google.maps.LatLng(finalBottomLat, finalRightLng));  // 하단-우측
        
        // bounds가 유효한지 확인하고 fitBounds 실행
        const isEmpty = bounds.isEmpty();
        console.log('🔍 bounds 상태 확인:', { isEmpty, bounds: bounds.toString() });
        
        if (bounds && !isEmpty && mapInstance.current) {
          // fitBounds가 작동하지 않으므로 항상 대체 방법 사용
          // 중심점과 bounds에 맞는 줌 레벨 계산
          const centerLat = (finalTopLat + finalBottomLat) / 2;
          const centerLng = (finalLeftLng + finalRightLng) / 2;
          
          // bounds 크기에 따라 적절한 줌 레벨 계산
          const latDiff = finalTopLat - finalBottomLat;
          const lngDiff = finalRightLng - finalLeftLng;
          const maxDiff = Math.max(latDiff, lngDiff);
          
          // 경도 차이를 기반으로 줌 레벨 계산
          // 줌 레벨을 16으로 명시적으로 설정
          const calculatedZoom = 16;
          
          console.log('🔧 [초기화] 줌 레벨 설정 시작 - 목표 줌: 16');
          console.log('🔧 [초기화] 현재 줌 레벨:', mapInstance.current?.getZoom?.());
          
          // 중심점 설정
          mapInstance.current.setCenter({ lat: centerLat, lng: centerLng });
          
          // 줌 레벨을 여러 번 설정하여 확실하게 적용
          console.log('🔧 [초기화] setZoom(16) 호출 전 줌:', mapInstance.current?.getZoom?.());
          mapInstance.current.setZoom(16);
          console.log('🔧 [초기화] setZoom(16) 호출 직후 줌:', mapInstance.current?.getZoom?.());
          
          // 즉시 다시 설정 (다른 이벤트에 의해 변경되는 것을 방지)
          setTimeout(() => {
            const beforeZoom = mapInstance.current?.getZoom?.();
            console.log('🔧 [초기화] 1차 설정 전 줌:', beforeZoom);
            mapInstance.current.setZoom(16);
            const actualZoom = mapInstance.current?.getZoom?.();
            console.log('🔧 [초기화] 1차 설정 후 줌 레벨:', actualZoom);
            console.log('🔧 [초기화] 지도 객체:', mapInstance.current);
            console.log('🔧 [초기화] maxZoom 설정:', (mapInstance.current as any)?.get('maxZoom'));
            
            if (actualZoom !== 16) {
              console.warn('⚠️ [초기화] 줌 레벨이 16이 아닙니다! 다시 설정합니다.', { expected: 16, actual: actualZoom });
              mapInstance.current.setZoom(16);
            }
          }, 50);
          
          // 추가 확인 및 재설정
          setTimeout(() => {
            const beforeZoom = mapInstance.current?.getZoom?.();
            console.log('🔧 [초기화] 2차 설정 전 줌:', beforeZoom);
            mapInstance.current.setZoom(16);
            const actualZoom = mapInstance.current?.getZoom?.();
            console.log('🔧 [초기화] 2차 설정 후 줌 레벨:', actualZoom);
            
            if (actualZoom !== 16) {
              console.warn('⚠️ [초기화] 여전히 줌 레벨이 16이 아닙니다!', { expected: 16, actual: actualZoom });
              mapInstance.current.setZoom(16);
            }
          }, 200);
          
          // 최종 확인
          setTimeout(() => {
            const actualZoom = mapInstance.current?.getZoom?.();
            console.log('🔧 [초기화] 최종 줌 레벨:', actualZoom);
            console.log('🔧 [초기화] 최종 확인 - 지도 객체 타입:', typeof mapInstance.current);
            console.log('🔧 [초기화] 최종 확인 - getZoom 함수:', typeof mapInstance.current?.getZoom);
            if (actualZoom !== 16) {
              console.error('❌ [초기화] 줌 레벨 설정 실패!', { expected: 16, actual: actualZoom });
              // 강제로 다시 설정
              mapInstance.current.setZoom(16);
              console.log('🔧 [초기화] 강제 재설정 후 줌:', mapInstance.current?.getZoom?.());
            }
          }, 500);
          
          // 초기화 완료 후 플래그 해제
          setTimeout(() => {
            (mapInstance.current as any).__isResetting = false;
          }, 1000);
          
          console.log('✅ 초기화: 중심점과 줌으로 지도 위치 설정 완료', { 
            centerLat, 
            centerLng, 
            zoom: calculatedZoom,
            latDiff,
            lngDiff,
            maxDiff
          });
        } else {
          console.warn('⚠️ bounds가 유효하지 않음:', { isEmpty, hasMapInstance: !!mapInstance.current });
        }
        
        // 마커 재생성
        if (properties && properties.length > 0) {
          properties.forEach((property) => {
            if (!property.location) {
              return;
            }

            try {
              const marker = new window.google.maps.Marker({
                position: { lat: property.location.lat, lng: property.location.lng },
                map: mapInstance.current,
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
              console.error('마커 재생성 오류:', err);
            }
          });
        }
        
        setTimeout(() => {
          updateClusters();
        }, 100);
      } catch (error) {
        console.error('❌ resetMarkers 오류:', error);
        // 에러 메시지를 UI에 표시하지 않고 콘솔에만 기록
      }
    }
  }));

  return (
    <MapContainer>
      <MapDiv ref={mapRef} />
      
      {error && (
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