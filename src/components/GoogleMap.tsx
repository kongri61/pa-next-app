import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { Property } from '../types';

const MapContainer = styled.div`
  width: 100%;
  height: calc(100vh - 80px);
  min-height: 600px;
  position: relative;
  overflow: visible;
  background: #f0f0f0;
`;

const FallbackMap = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #e5e7eb 25%, transparent 25%), 
              linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #e5e7eb 75%), 
              linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1.2rem;
  font-weight: 500;
`;

const MapError = styled.div`
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
`;

interface GoogleMapProps {
  properties: Property[];
  onMarkerClick?: (property: Property) => void;
  onClusterClick?: (properties: Property[]) => void;
  selectedMarkerId?: string | null;
  setSelectedMarkerId?: (id: string) => void;
  selectedClusterId?: string | null;
  setSelectedClusterId?: (id: string) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  properties,
  onMarkerClick,
  onClusterClick,
  selectedMarkerId,
  setSelectedMarkerId,
  selectedClusterId,
  setSelectedClusterId
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const isClusterClicking = useRef(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  // 마커 클러스터링 함수
  const createClusterMarker = useCallback((properties: Property[], center: { lat: number; lng: number }) => {
    const clusterId = properties.map(p => p.id).join(',');
    const isSelected = selectedClusterId === clusterId;
    const isHovered = hoveredMarkerId === clusterId;
    const propertyCount = properties.length;
    
    // 매물 개수에 따른 클러스터 마커 크기와 색상 결정
    let markerSize = 40;
    let fontSize = 14;
    let backgroundColor = '#2563eb';
    let borderColor = '#1e40af';
    
    if (propertyCount >= 10) {
      markerSize = 50;
      fontSize = 16;
      backgroundColor = '#dc2626'; // 빨간색
      borderColor = '#b91c1c';
    } else if (propertyCount >= 5) {
      markerSize = 45;
      fontSize = 15;
      backgroundColor = '#f59e0b'; // 주황색
      borderColor = '#d97706';
    } else if (propertyCount >= 3) {
      markerSize = 42;
      fontSize = 14;
      backgroundColor = '#10b981'; // 초록색
      borderColor = '#059669';
    }
    
    const marker = new window.google.maps.Marker({
      position: center,
      map: mapInstance.current,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          isSelected
            ? `<svg width="${markerSize + 4}" height="${markerSize + 4}" viewBox="0 0 ${markerSize + 4} ${markerSize + 4}" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${(markerSize + 4) / 2}" cy="${(markerSize + 4) / 2}" r="${markerSize / 2}" fill="white" stroke="#111" stroke-width="3"/>
                <text x="${(markerSize + 4) / 2}" y="${(markerSize + 4) / 2 + fontSize / 3}" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${propertyCount}</text>
              </svg>`
            : isHovered
              ? `<svg width="${markerSize + 2}" height="${markerSize + 2}" viewBox="0 0 ${markerSize + 2} ${markerSize + 2}" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="${(markerSize + 2) / 2}" cy="${(markerSize + 2) / 2}" r="${markerSize / 2}" fill="white" stroke="#111" stroke-width="3"/>
                  <text x="${(markerSize + 2) / 2}" y="${(markerSize + 2) / 2 + fontSize / 3}" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${propertyCount}</text>
                </svg>`
              : `<svg width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="${markerSize / 2}" cy="${markerSize / 2}" r="${markerSize / 2 - 2}" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="3"/>
                  <text x="${markerSize / 2}" y="${markerSize / 2 + fontSize / 3}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${propertyCount}</text>
                </svg>`
        ),
        scaledSize: isSelected
          ? new window.google.maps.Size(markerSize + 4, markerSize + 4)
          : isHovered
            ? new window.google.maps.Size(markerSize + 2, markerSize + 2)
            : new window.google.maps.Size(markerSize, markerSize),
        anchor: isSelected
          ? new window.google.maps.Point((markerSize + 4) / 2, (markerSize + 4) / 2)
          : isHovered
            ? new window.google.maps.Point((markerSize + 2) / 2, (markerSize + 2) / 2)
            : new window.google.maps.Point(markerSize / 2, markerSize / 2)
      }
    });

    // 클러스터 마커 hover 이벤트
    marker.addListener('mouseover', () => {
      setHoveredMarkerId(clusterId);
    });

    marker.addListener('mouseout', () => {
      setHoveredMarkerId(null);
    });

    marker.addListener('click', () => {
      console.log(`클러스터 클릭: ${propertyCount}개 매물`);
      setHoveredMarkerId(null); // 클릭 시 hover 상태 해제
      
      isClusterClicking.current = true;
      
      if (propertyCount === 1) {
        if (onMarkerClick) {
          onMarkerClick(properties[0]);
        }
      } else {
        if (onClusterClick) {
          onClusterClick(properties);
        }
      }
      
      setTimeout(() => {
        isClusterClicking.current = false;
      }, 1500);
    });

    return marker;
  }, [onMarkerClick, onClusterClick, selectedClusterId, hoveredMarkerId]);

  // 마커 클러스터링 로직
  const clusterMarkers = useCallback((markers: any[], zoom: number) => {
    const clusters: { center: { lat: number; lng: number }; properties: Property[] }[] = [];
    
    // 줌 레벨에 따른 클러스터 반경 설정 - 더 넓게 조정
    let clusterRadius: number;
    if (zoom < 8) {
      clusterRadius = 0.15; // 매우 넓은 범위
    } else if (zoom < 10) {
      clusterRadius = 0.08; // 넓은 범위
    } else if (zoom < 12) {
      clusterRadius = 0.04; // 중간 범위
    } else if (zoom < 14) {
      clusterRadius = 0.02; // 좁은 범위
    } else if (zoom < 16) {
      clusterRadius = 0.01; // 매우 좁은 범위
    } else if (zoom < 18) {
      clusterRadius = 0.005; // 개별 마커 근처
    } else {
      clusterRadius = 0.002; // 거의 개별 마커
    }

    console.log(`줌 레벨 ${zoom}, 클러스터 반경: ${clusterRadius}`);

    properties.forEach((property, index) => {
      let addedToCluster = false;
      
      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(property.location.lat - cluster.center.lat, 2) +
          Math.pow(property.location.lng - cluster.center.lng, 2)
        );
        
        if (distance < clusterRadius) {
          cluster.properties.push(property);
          // 클러스터 중심점을 매물들의 평균 위치로 업데이트
          cluster.center = {
            lat: cluster.properties.reduce((sum, p) => sum + p.location.lat, 0) / cluster.properties.length,
            lng: cluster.properties.reduce((sum, p) => sum + p.location.lng, 0) / cluster.properties.length
          };
          addedToCluster = true;
          break;
        }
      }
      
      if (!addedToCluster) {
        clusters.push({
          center: property.location,
          properties: [property]
        });
      }
    });

    console.log(`총 ${properties.length}개 매물이 ${clusters.length}개 클러스터로 그룹화됨`);
    return clusters;
  }, [properties]);

  const createMarkers = useCallback(() => {
    if (!mapInstance.current) {
      console.log('mapInstance가 없어서 마커 생성 불가');
      return;
    }
    
    console.log('마커 생성 시작, properties 개수:', properties.length);
    const currentZoom = mapInstance.current.getZoom() || 15;
    console.log('현재 줌 레벨:', currentZoom);
    
    if (currentZoom >= 18) {
      console.log('개별 마커 생성 모드');
      properties.forEach((property, index) => {
        console.log(`마커 ${index + 1} 생성:`, property.title, property.location);
        const isSelected = selectedMarkerId === property.id;
        const isHovered = hoveredMarkerId === property.id;
        const marker = new window.google.maps.Marker({
          position: property.location,
          map: mapInstance.current,
          title: property.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
              isSelected
                ? `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="20" fill="white" stroke="#111" stroke-width="3"/><text x="22" y="29" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="16" font-weight="bold">1</text></svg>`
                : isHovered
                  ? `<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="17" cy="17" r="15" fill="white" stroke="#111" stroke-width="3"/><text x="17" y="22" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="12" font-weight="bold">1</text></svg>`
                  : `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="13" fill="#2563eb" stroke="#1e40af" stroke-width="2"/><text x="15" y="19" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">1</text></svg>`
            ),
            scaledSize: isSelected
              ? new window.google.maps.Size(44, 44)
              : isHovered
                ? new window.google.maps.Size(34, 34)
                : new window.google.maps.Size(30, 30),
            anchor: isSelected
              ? new window.google.maps.Point(22, 22)
              : isHovered
                ? new window.google.maps.Point(17, 17)
                : new window.google.maps.Point(15, 15)
          }
        });

        // 마커 hover 이벤트
        marker.addListener('mouseover', () => {
          setHoveredMarkerId(property.id);
        });

        marker.addListener('mouseout', () => {
          setHoveredMarkerId(null);
        });

        if (onMarkerClick) {
          marker.addListener('click', () => {
            console.log(`개별 마커 클릭됨: ${property.id} - ${property.title}`);
            setHoveredMarkerId(null); // 클릭 시 hover 상태 해제
            isClusterClicking.current = true;
            
            if (setSelectedMarkerId) setSelectedMarkerId(property.id);
            if (setSelectedClusterId) setSelectedClusterId('');
            onMarkerClick(property);
            
            setTimeout(() => {
              isClusterClicking.current = false;
            }, 1500);
          });
        }

        markersRef.current.push(marker);
      });
      console.log('개별 마커 생성 완료, 총 마커 개수:', markersRef.current.length);
    } else {
      console.log('클러스터 모드');
      const clusters = clusterMarkers([], currentZoom);
      console.log('생성된 클러스터 개수:', clusters.length);

      clusters.forEach((cluster, clusterIndex) => {
        console.log(`클러스터 ${clusterIndex + 1}: ${cluster.properties.length}개 매물`);
        if (cluster.properties.length === 1) {
          const property = cluster.properties[0];
          const isSelected = selectedMarkerId === property.id;
          const isHovered = hoveredMarkerId === property.id;
          const marker = new window.google.maps.Marker({
            position: property.location,
            map: mapInstance.current,
            title: property.title,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                isSelected
                  ? `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="20" fill="white" stroke="#111" stroke-width="3"/><text x="22" y="29" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="16" font-weight="bold">1</text></svg>`
                  : isHovered
                    ? `<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="17" cy="17" r="15" fill="white" stroke="#111" stroke-width="3"/><text x="17" y="22" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="12" font-weight="bold">1</text></svg>`
                    : `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="13" fill="#2563eb" stroke="#1e40af" stroke-width="2"/><text x="15" y="19" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">1</text></svg>`
              ),
              scaledSize: isSelected
                ? new window.google.maps.Size(44, 44)
                : isHovered
                  ? new window.google.maps.Size(34, 34)
                  : new window.google.maps.Size(30, 30),
              anchor: isSelected
                ? new window.google.maps.Point(22, 22)
                : isHovered
                  ? new window.google.maps.Point(17, 17)
                  : new window.google.maps.Point(15, 15)
            }
          });

          // 마커 hover 이벤트
          marker.addListener('mouseover', () => {
            setHoveredMarkerId(property.id);
          });

          marker.addListener('mouseout', () => {
            setHoveredMarkerId(null);
          });

          if (onMarkerClick) {
            marker.addListener('click', () => {
              console.log(`클러스터링된 단일 마커 클릭됨: ${property.id} - ${property.title}`);
              setHoveredMarkerId(null); // 클릭 시 hover 상태 해제
              isClusterClicking.current = true;
              
              if (setSelectedMarkerId) setSelectedMarkerId(property.id);
              if (setSelectedClusterId) setSelectedClusterId('');
              onMarkerClick(property);
              
              setTimeout(() => {
                isClusterClicking.current = false;
              }, 1500);
            });
          }

          markersRef.current.push(marker);
        } else {
          const clusterMarker = createClusterMarker(cluster.properties, cluster.center);
          markersRef.current.push(clusterMarker);
        }
      });
      console.log('클러스터 마커 생성 완료, 총 마커 개수:', markersRef.current.length);
    }
  }, [properties, selectedMarkerId, hoveredMarkerId, onMarkerClick, setSelectedMarkerId, setSelectedClusterId, createClusterMarker, clusterMarkers]);

  const updateMarkers = useCallback(() => {
    if (!mapInstance.current) return;
    
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    createMarkers();
  }, [createMarkers]);

  // 지도 초기화
  const initMap = useCallback(() => {
    console.log('지도 초기화 시도...');
    console.log('mapRef.current:', mapRef.current);
    console.log('window.google:', window.google);
    console.log('window.google.maps:', window.google?.maps);
    
    if (!mapRef.current) {
      console.log('mapRef가 없음');
      return false;
    }
    
    if (!window.google) {
      console.log('Google Maps API가 로드되지 않음');
      return false;
    }
    
    if (!window.google.maps) {
      console.log('Google Maps 객체가 없음');
      return false;
    }

    if (mapInstance.current) {
      console.log('기존 지도 인스턴스 업데이트');
      updateMarkers();
      return true;
    }

    try {
      console.log('새 지도 인스턴스 생성 시작...');
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.5665, lng: 126.9780 },
        zoom: 10,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        zoomControl: false, // 확대/축소 버튼 제거
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        backgroundColor: '#f0f0f0',
        disableDefaultUI: true, // 모든 기본 UI 비활성화
        clickableIcons: false, // POI 클릭 비활성화
        maxZoom: 20,
        minZoom: 8,
        tilt: 0,
        disableDoubleClickZoom: false,
        restriction: {
          latLngBounds: {
            north: 38.0,
            south: 34.5,
            east: 131.0,
            west: 125.0
          },
          strictBounds: false
        },
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'landscape',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      console.log('지도 인스턴스 생성 완료:', map);
      mapInstance.current = map;
      
      // 지도가 완전히 로드된 후 마커 생성
      map.addListener('idle', () => {
        console.log('지도 로드 완료, 마커 생성 시작');
        updateMarkers();
      });

      map.addListener('zoom_changed', () => {
        if (isClusterClicking.current) {
          return;
        }
        
        markersRef.current.forEach(marker => {
          if (marker && marker.setMap) {
            marker.setMap(null);
          }
        });
        markersRef.current = [];

        setTimeout(() => {
          if (!isClusterClicking.current) {
            updateMarkers();
          }
        }, 300);
      });

      console.log('지도 초기화 완료');
      setIsMapLoaded(true);
      setMapError(null);
      return true;
    } catch (error) {
      console.error('지도 초기화 오류:', error);
      setMapError('지도를 로드할 수 없습니다. Google Maps API를 확인해주세요.');
      setIsMapLoaded(false);
      return false;
    }
  }, [updateMarkers]);

  const checkAndInit = useCallback(() => {
    console.log('Google Maps API 확인 중...');
    if (window.google && window.google.maps) {
      console.log('Google Maps API 로드됨, 지도 초기화 시도');
      if (initMap()) {
        console.log('지도 초기화 성공');
        return;
      }
    } else {
      console.log('Google Maps API 아직 로드되지 않음, 재시도...');
    }
    
    setTimeout(checkAndInit, 100);
  }, [initMap]);

  useEffect(() => {
    checkAndInit();

    return () => {
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, [checkAndInit]);

  // properties가 변경될 때 마커 업데이트
  useEffect(() => {
    if (mapInstance.current && isMapLoaded) {
      updateMarkers();
    }
  }, [properties, selectedMarkerId, selectedClusterId, hoveredMarkerId, isMapLoaded, updateMarkers]);

  return (
    <MapContainer>
      {!isMapLoaded && mapError ? (
        <FallbackMap>
          <MapError>
            <div style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🗺️</div>
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>지도 로드 실패</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{mapError}</div>
            <button 
              onClick={() => {
                setMapError(null);
                setIsMapLoaded(false);
                checkAndInit();
              }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              다시 시도
            </button>
          </MapError>
        </FallbackMap>
      ) : (
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      )}
    </MapContainer>
  );
};

export default GoogleMap; 