import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, memo } from 'react';
import styled from 'styled-components';
import { Property } from '../types';

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 300px;
  position: relative;
  background: #f8fafc;
  
  @media (max-width: 768px) {
    width: 100vw;
    height: 100vh;
    min-height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }
`;

const MapDiv = styled.div`
  width: 100%;
  height: 100%;
  min-height: 300px;
  
  @media (max-width: 768px) {
    width: 100vw;
    height: 100vh;
    min-height: 100vh;
  }
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
        
        const incheonCenter = { lat: 37.4000, lng: 126.7052 };
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: incheonCenter,
          zoom: 11,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          disableDefaultUI: true,
          clickableIcons: false,
          draggable: true,
          scrollwheel: true,
          optimized: true,
          backgroundColor: '#f8fafc',
          tilt: 0,
          heading: 0,
          maxZoom: 18,
          minZoom: 6,
          styles: [],
          noClear: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP,
            style: window.google.maps.ZoomControlStyle.SMALL
          },
          overviewMapControl: false,
          panControl: false,
          keyboardShortcuts: false,
          isFractionalZoomEnabled: true,
          fitBounds: false,
          preserveViewport: true
        });

        mapInstance.current = map;

        map.panTo(incheonCenter);
        map.setZoom(11);

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
  }, [retryCount]);

  // 클러스터링 거리 계산 함수
  const getClusterDistance = (zoom: number) => {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      if (zoom < 8) return 0.2;
      if (zoom < 10) return 0.1;
      if (zoom < 12) return 0.05;
      if (zoom < 13) return 0.025;
      return 0;
    } else {
      if (zoom < 8) return 0.25;
      if (zoom < 10) return 0.15;
      if (zoom < 12) return 0.08;
      if (zoom < 13) return 0.03;
      return 0;
    }
  };

  // 고정된 마커 아이콘 생성
  const createMarkerIcon = () => {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" stroke-width="2"/>
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
          <circle cx="18" cy="18" r="16" fill="#1e40af" stroke="white" stroke-width="3"/>
          <text x="18" y="23" text-anchor="middle" fill="white" font-size="13" font-weight="bold">1</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(36, 36),
      anchor: new window.google.maps.Point(18, 18)
    };
  };

  // 고정된 클러스터 아이콘 생성
  const createClusterIcon = (count: number) => {
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

  // 선택된 클러스터 아이콘 생성
  const createSelectedClusterIcon = (count: number) => {
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

  // 수동 클러스터링 함수
  const updateClusters = () => {
    if (!mapInstance.current || !window.google) return;

    // 현재 선택 상태 저장
    const currentSelectedMarkerId = selectedMarkerIdRef.current;
    const currentSelectedClusterId = selectedClusterIdRef.current;

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
    const clusterDistance = getClusterDistance(zoom);
    
    if (clusterDistance === 0) {
      // 개별 마커 표시
      markersRef.current.forEach(marker => {
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
              previousCluster.setIcon(createClusterIcon(previousCluster.clusterCount));
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
      return;
    }

    // 클러스터링 로직
    const groups: Array<{
      center: { lat: number; lng: number };
      markers: any[];
      properties: Property[];
    }> = [];

    markersRef.current.forEach(marker => {
      const position = marker.getPosition();
      const lat = position.lat();
      const lng = position.lng();
      
      let addedToGroup = false;
      let closestGroup = null;
      let minDistance = Infinity;
      
      for (const group of groups) {
        const distance = Math.sqrt(
          Math.pow(lat - group.center.lat, 2) + Math.pow(lng - group.center.lng, 2)
        );
        
        if (distance <= clusterDistance && distance < minDistance) {
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
        groups.push({
          center: { lat, lng },
          markers: [marker],
          properties: [marker.property]
        });
      }
    });

    groups.forEach((group) => {
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
              previousCluster.setIcon(createClusterIcon(previousCluster.clusterCount));
            }
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
        // 클러스터
        const cluster = new window.google.maps.Marker({
          position: group.center,
          map: mapInstance.current,
          zIndex: 10,
          icon: createClusterIcon(group.markers.length)
        });

        // 클러스터 ID 설정
        const clusterId = `cluster_${group.center.lat.toFixed(4)}_${group.center.lng.toFixed(4)}_${group.markers.length}`;
        cluster.clusterId = clusterId;
        cluster.clusterCount = group.markers.length;
        cluster.clusterProperties = group.properties;

        // 개별 마커 숨기기
        group.markers.forEach(marker => {
          marker.setMap(null);
        });
        
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
              previousCluster.setIcon(createClusterIcon(previousCluster.clusterCount));
            }
          }
          
          // 현재 클러스터 선택 상태 업데이트
          selectedClusterIdRef.current = clusterId;
          
          // 선택된 클러스터 스타일 적용
          cluster.setIcon(createSelectedClusterIcon(group.markers.length));
          
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
      properties.forEach((property) => {
        if (!property.location) {
          return;
        }

        try {
          const marker = new window.google.maps.Marker({
            position: { lat: property.location.lat, lng: property.location.lng },
            map: null,
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
          console.error('마커 생성 오류:', err);
        }
      });

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
        const incheonCenter = { lat: 37.4000, lng: 126.7052 };
        mapInstance.current.panTo(incheonCenter);
        mapInstance.current.setZoom(11);
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
            map: null,
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
      {!isLoaded && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#6b7280',
          fontSize: '1.2rem',
          textAlign: 'center',
          zIndex: 1000
        }}>
          지도를 로드하는 중...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#dc2626',
          fontSize: '1rem',
          textAlign: 'center',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '80%'
        }}>
          <div style={{ marginBottom: '1rem' }}>{error}</div>
          <button
            onClick={() => {
              setError(null);
              setRetryCount(0);
              setIsLoaded(false);
            }}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      )}
    </MapContainer>
  );
});

// 커스텀 비교 함수로 불필요한 리렌더링 방지
const areEqual = (prevProps: any, nextProps: any) => {
  // properties 배열이 변경되었는지만 확인
  if (prevProps.properties.length !== nextProps.properties.length) {
    return false;
  }
  
  // properties의 id만 비교하여 실제 변경사항이 있는지 확인
  const prevIds = prevProps.properties.map((p: Property) => p.id).sort();
  const nextIds = nextProps.properties.map((p: Property) => p.id).sort();
  
  return JSON.stringify(prevIds) === JSON.stringify(nextIds);
};

export default memo(GoogleMap, areEqual); 