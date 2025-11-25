import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, memo } from 'react';
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

const GoogleMap = forwardRef<GoogleMapRef, GoogleMapProps>(({
  properties,
  onMarkerClick,
  onClusterClick
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const markersRef = useRef<any[]>([]);
  const clustersRef = useRef<any[]>([]);
  
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
          maxZoom: 18,
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

        map.panTo(incheonCenter);
        map.setZoom(10); // 인천광역시 전체가 보이도록 설정

        map.addListener('tilesloaded', () => {
          setIsLoaded(true);
          setError(null);
        });

        map.addListener('zoom_changed', () => {
          // 줌 변경 시 클러스터 업데이트
          setTimeout(() => {
            updateClusters();
          }, 100);
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
    
    // 1단계: 대형 클러스터 (넓은 범위)
    const getLargeClusterDistance = () => {
      if (isMobile) {
        if (zoom < 6) return 0.25;   // 매우 넓은 범위
        if (zoom < 8) return 0.15;   // 넓은 범위
        if (zoom < 10) return 0.08; // 중간 범위
        return 0.02; // 좁은 범위
      } else {
        if (zoom < 6) return 0.3;   // 매우 넓은 범위
        if (zoom < 8) return 0.2;   // 넓은 범위
        if (zoom < 10) return 0.1;  // 중간 범위
        return 0.04; // 좁은 범위
      }
    };

    // 2단계: 소형 클러스터 (좁은 범위)
    const getSmallClusterDistance = () => {
      if (isMobile) {
        if (zoom < 10) return 0.04; // 중간 범위
        if (zoom < 12) return 0.02; // 좁은 범위
        if (zoom < 14) return 0.008; // 매우 좁은 범위
        return 0; // 개별 마커
      } else {
        if (zoom < 10) return 0.05;  // 중간 범위
        if (zoom < 12) return 0.025; // 좁은 범위
        if (zoom < 14) return 0.012; // 매우 좁은 범위
        return 0; // 개별 마커
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
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#1f2937" stroke="white" stroke-width="2"/>
          <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">1</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(32, 32),
      anchor: new window.google.maps.Point(16, 16)
    };
  };

  // 선택된 마커 아이콘 생성
  const createSelectedMarkerIcon = () => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="16" fill="#111827" stroke="white" stroke-width="3"/>
          <text x="18" y="23" text-anchor="middle" fill="white" font-size="13" font-weight="bold">1</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(36, 36),
      anchor: new window.google.maps.Point(18, 18)
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

    const zoom = mapInstance.current.getZoom();
    const clusterDistances = getClusterDistance(zoom);
    
    console.log(`🔍 2단계 클러스터링 시작 - 줌: ${zoom}, 대형거리: ${clusterDistances.large}, 소형거리: ${clusterDistances.small}`);
    
    if (clusterDistances.small === 0) {
      // 개별 마커 표시
      console.log('📍 개별 마커 표시 모드 - 마커 수:', markersRef.current.length);
      
      markersRef.current.forEach((marker, index) => {
        console.log(`📍 마커 ${index + 1} 표시:`, marker.property.title);
        const position = marker.getPosition();
        console.log(`📍 마커 위치:`, position ? {
          lat: position.lat(),
          lng: position.lng()
        } : '위치 없음');
        console.log(`📍 지도 인스턴스:`, !!mapInstance.current);
        
        // 마커를 지도에 표시
        marker.setIcon(createMarkerIcon());
        marker.setMap(mapInstance.current);
        
        // 마커가 실제로 지도에 표시되었는지 확인
        setTimeout(() => {
          const isVisible = marker.getMap() === mapInstance.current;
          console.log(`📍 마커 ${index + 1} 표시 상태:`, isVisible ? '표시됨' : '숨김');
        }, 100);
        
        // 기존 이벤트 리스너 제거 (중복 방지)
        const existingListeners = marker.get('listeners');
        if (existingListeners) {
          google.maps.event.clearListeners(marker, 'click');
        }
        
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

    finalGroups.forEach((group) => {
      if (group.markers.length === 1) {
        // 개별 마커
        const marker = group.markers[0];
        const property = group.properties[0];
        
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

        // 개별 마커 숨기기
        group.markers.forEach(marker => {
          marker.setMap(null);
        });
        
        console.log(`🎯 ${group.type} 클러스터 생성: ${group.markers.length}개 매물, 위치: ${group.center.lat.toFixed(4)}, ${group.center.lng.toFixed(4)}`);
        
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
            title: property.address,
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
        } catch (err) {
          console.error('❌ 마커 생성 오류:', err);
        }
      });

      console.log('생성된 마커 수:', markersRef.current.length);

      setTimeout(() => {
        updateClusters();
      }, 100);

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
      
      properties.forEach((property) => {
        if (!property.location) {
          return;
        }

        try {
          const marker = new window.google.maps.Marker({
            position: { lat: property.location.lat, lng: property.location.lng },
            map: mapInstance.current,
            title: property.address,
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
      
      setTimeout(() => {
        updateClusters();
      }, 100);
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
});

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