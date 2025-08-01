import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { Property } from '../types';

const MapContainer = styled.div`
  width: 100%;
  height: 85%;
  min-height: 480px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 0 12px 12px 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    border-radius: 0;
    box-shadow: none;
    height: 75%;
    min-height: 360px;
  }

  @media (max-width: 480px) {
    height: 70%;
    min-height: 300px;
  }
`;

const MapError = styled.div`
  text-align: center;
  padding: 2.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 450px;
  border: 1px solid #e5e7eb;
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
    markerClusterer: any;
    markerClustererLoaded: boolean;
    MarkerClusterer?: any;
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
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [internalSelectedClusterId, setInternalSelectedClusterId] = useState<string | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clusterHoverIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 마커 클러스터링 함수
  const createClusterMarker = useCallback((properties: Property[], center: { lat: number; lng: number }) => {
    const clusterId = properties.map(p => p.id).join(',');
    const isSelected = internalSelectedClusterId === clusterId;
    const isHovered = hoveredMarkerId === clusterId;
    const propertyCount = properties.length;
    
    let markerSize = 40;
    let fontSize = 14;
    let backgroundColor = '#2563eb';
    let borderColor = '#1e40af';
    
    if (propertyCount >= 10) {
      markerSize = 50;
      fontSize = 16;
      backgroundColor = '#dc2626';
      borderColor = '#b91c1c';
    } else if (propertyCount >= 5) {
      markerSize = 45;
      fontSize = 15;
      backgroundColor = '#f59e0b';
      borderColor = '#d97706';
    } else if (propertyCount >= 3) {
      markerSize = 42;
      fontSize = 14;
      backgroundColor = '#10b981';
      borderColor = '#059669';
    }
    
    const marker = new window.google.maps.Marker({
      position: center,
      map: mapInstance.current,
      title: propertyCount === 1 
        ? `${properties[0].title} - ${properties[0].price}만원`
        : `${propertyCount}개 매물 클러스터\n${properties.slice(0, 3).map((p, idx) => `${idx + 1}. ${p.title} - ${p.price}만원`).join('\n')}${properties.length > 3 ? `\n... 외 ${properties.length - 3}개 더` : ''}`,
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

    marker.addListener('mouseover', () => {
      setHoveredMarkerId(clusterId);
    });

    marker.addListener('mouseout', () => {
      setHoveredMarkerId(null);
    });

    marker.addListener('click', () => {
      setHoveredMarkerId(null);
      
      // isClusterClicking.current = true; // This line was removed as per the new_code
      
      if (propertyCount === 1) {
        if (onMarkerClick) {
          onMarkerClick(properties[0]);
        }
        if (setSelectedMarkerId) {
          setSelectedMarkerId(properties[0].id);
        }
        if (setSelectedClusterId) {
          setSelectedClusterId('');
        }
      } else {
        if (onClusterClick) {
          onClusterClick(properties);
        }
        if (setSelectedClusterId) {
          setSelectedClusterId(clusterId);
        }
        if (setSelectedMarkerId) {
          setSelectedMarkerId('');
        }
        
        // 클러스터 영역으로 지도 확대
        if (mapInstance.current && properties.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          properties.forEach((property: Property) => {
            if (property.location && property.location.lat && property.location.lng) {
              bounds.extend(new window.google.maps.LatLng(property.location.lat, property.location.lng));
            }
          });
          
          if (!bounds.isEmpty()) {
            const center = bounds.getCenter();
            mapInstance.current.setCenter(center);
            const currentZoom = mapInstance.current.getZoom() || 10;
            const targetZoom = Math.min(currentZoom + 2, 18);
            mapInstance.current.setZoom(targetZoom);
          }
        }
      }
      
      // setTimeout(() => { // This line was removed as per the new_code
      //   isClusterClicking.current = false; // This line was removed as per the new_code
      // }, 1500); // This line was removed as per the new_code
    });

    return marker;
  }, [onMarkerClick, onClusterClick, internalSelectedClusterId, hoveredMarkerId, setSelectedMarkerId, setSelectedClusterId]);

  // 마커 클러스터링 로직
  const clusterMarkers = useCallback((markers: any[], zoom: number) => {
    const clusters: { center: { lat: number; lng: number }; properties: Property[] }[] = [];
    
    let clusterRadius: number;
    if (zoom < 8) {
      clusterRadius = 0.15;
    } else if (zoom < 10) {
      clusterRadius = 0.08;
    } else if (zoom < 12) {
      clusterRadius = 0.04;
    } else if (zoom < 14) {
      clusterRadius = 0.02;
    } else if (zoom < 16) {
      clusterRadius = 0.01;
    } else if (zoom < 18) {
      clusterRadius = 0.005;
    } else {
      clusterRadius = 0.002;
    }

    properties.forEach((property, index) => {
      let addedToCluster = false;
      
      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(property.location.lat - cluster.center.lat, 2) +
          Math.pow(property.location.lng - cluster.center.lng, 2)
        );
        
        if (distance < clusterRadius) {
          cluster.properties.push(property);
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

    return clusters;
  }, [properties]);

  // 마커 생성 및 관리
  const createMarkers = useCallback(() => {
    console.log('=== createMarkers 함수 시작 ===');
    console.log('properties 배열:', properties.length, '개');
    
    // 기존 마커들 제거
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // 기존 클러스터러 제거
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    if (!mapInstance.current || !properties.length) {
      console.log('지도가 초기화되지 않았거나 매물이 없습니다.');
      return;
    }

    console.log(`${properties.length}개의 매물에 대한 마커 생성 시작...`);

    // 모든 마커 생성
    properties.forEach((property, index) => {
      if (!property.location || !property.location.lat || !property.location.lng) {
        console.warn(`매물 ${property.id}의 위치 정보가 없습니다.`);
        return;
      }

      const marker = new window.google.maps.Marker({
        position: { lat: property.location.lat, lng: property.location.lng },
        map: null, // 클러스터러가 관리하므로 null로 설정
        title: `${property.title} - ${property.price}만원`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              <circle cx="15" cy="15" r="14" fill="#3b82f6" stroke="#000000" stroke-width="1.5" filter="url(#shadow)"/>
              <text x="15" y="18" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">1</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30),
          anchor: new window.google.maps.Point(15, 15)
        }
      });

      // 마커에 매물 정보 저장
      (marker as any).propertyId = property.id;
      (marker as any).property = property;
      (marker as any).markerIndex = index + 1;

      // 마커 클릭 이벤트 추가
      marker.addListener('click', () => {
        console.log('마커 클릭 이벤트 발생:', property.id);
        
        // 이전에 선택된 마커가 있다면 선택 해제
        if (selectedMarkerId && selectedMarkerId !== property.id) {
          console.log('이전 마커 선택 해제:', selectedMarkerId);
          // 이전 마커를 찾아서 원래 스타일로 복원
          const previousMarker = markersRef.current.find(m => (m as any).propertyId === selectedMarkerId);
          if (previousMarker) {
            previousMarker.setIcon({
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                  </defs>
                  <circle cx="15" cy="15" r="14" fill="#3b82f6" stroke="#000000" stroke-width="1.5" filter="url(#shadow)"/>
                  <text x="15" y="18" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">1</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(30, 30),
              anchor: new window.google.maps.Point(15, 15)
            });
            previousMarker.setTitle(`${(previousMarker as any).property.title} - ${(previousMarker as any).property.price}만원`);
          }
        }
        
        // 클릭 시 호버 상태 유지
        setHoveredMarkerId(property.id);
        
        if (onMarkerClick) {
          onMarkerClick(property);
        }
        if (setSelectedMarkerId) {
          setSelectedMarkerId(property.id);
        }
        if (setSelectedClusterId) {
          setSelectedClusterId('');
        }
        
        // 클릭된 마커를 선택된 상태로 표시 (빨간색, 크기 증가)
        const markerSize = 38;
        const centerPoint = markerSize / 2;
        const fontSize = Math.max(8, markerSize * 0.3);
        
        marker.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              <circle cx="${centerPoint}" cy="${centerPoint}" r="${centerPoint - 1}" fill="#ef4444" stroke="#000000" stroke-width="2" filter="url(#shadow)"/>
              <text x="${centerPoint}" y="${centerPoint + fontSize/3}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">1</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(markerSize, markerSize),
          anchor: new window.google.maps.Point(centerPoint, centerPoint)
        });
        
        // 클릭된 마커의 툴팁 업데이트
        marker.setTitle(`${property.title} - ${property.price}만원 (선택됨)`);
      });

      // 마커 호버 이벤트 추가
      marker.addListener('mouseover', () => {
        console.log('개별 마커 호버:', property.title);
        
        // 선택된 마커는 호버 효과 적용하지 않음
        const isSelected = selectedMarkerId === property.id;
        if (isSelected) {
          console.log('선택된 마커이므로 호버 효과 적용하지 않음');
          return;
        }
        
        setHoveredMarkerId(property.id);
        
        // 호버 시 시각적 피드백
        marker.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              <circle cx="17" cy="17" r="16" fill="#1e40af" stroke="#000000" stroke-width="2" filter="url(#shadow)"/>
              <text x="17" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="11" font-weight="bold">1</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(34, 34),
          anchor: new window.google.maps.Point(17, 17)
        });
        
        // 호버 시 툴팁 업데이트
        marker.setTitle(`${property.title} - ${property.price}만원 (호버)`);
      });

      marker.addListener('mouseout', () => {
        console.log('개별 마커 호버 해제:', property.title);
        
        // 선택된 마커는 호버 해제 효과 적용하지 않음
        const isSelected = selectedMarkerId === property.id;
        if (isSelected) {
          console.log('선택된 마커이므로 호버 해제 효과 적용하지 않음');
          return;
        }
        
        setHoveredMarkerId(null);
        
        // 호버 해제 시 원래 스타일로 복원
        marker.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              <circle cx="15" cy="15" r="14" fill="#3b82f6" stroke="#000000" stroke-width="1.5" filter="url(#shadow)"/>
              <text x="15" y="18" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">1</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30),
          anchor: new window.google.maps.Point(15, 15)
        });
        
        // 호버 해제 시 툴팁 복원
        marker.setTitle(`${property.title} - ${property.price}만원`);
      });

      markersRef.current.push(marker);
    });

    console.log(`${markersRef.current.length}개의 마커 생성 완료`);
  }, [properties, selectedMarkerId, hoveredMarkerId, onMarkerClick, setSelectedMarkerId, setSelectedClusterId]);

  // 간단한 클러스터링 로직 (개선된 버전)
  const createSimpleClusters = useCallback(() => {
    console.log('간단한 클러스터링 로직 시작');
    
    if (!mapInstance.current || markersRef.current.length === 0) return;
    
    // 모든 마커를 지도에 표시
    markersRef.current.forEach(marker => {
      marker.setMap(mapInstance.current);
    });
    
    // 간단한 클러스터링: 줌 레벨에 따라 마커 표시/숨김
    const updateMarkerVisibility = () => {
      const bounds = mapInstance.current.getBounds();
      
      if (!bounds) return;
      
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (!position) return;
        
        // 모든 줌 레벨에서 마커 표시 (줌 레벨 제한 제거)
        marker.setVisible(true);
      });
    };
    
    // 줌 변경 시 마커 가시성 업데이트
    mapInstance.current.addListener('zoom_changed', updateMarkerVisibility);
    mapInstance.current.addListener('bounds_changed', updateMarkerVisibility);
    
    // 초기 마커 가시성 설정
    updateMarkerVisibility();
    
    console.log('간단한 클러스터링 완료 - 줌 기반 마커 표시');
  }, []);

  // 개별 마커 호버 이벤트 재설정 함수
  const resetIndividualMarkerHoverEvents = useCallback(() => {
    console.log('개별 마커 호버 이벤트 재설정');
    
    markersRef.current.forEach(marker => {
      if (!marker) return;
      
      const property = (marker as any).property;
      if (!property) return;

      // 기존 호버 이벤트 리스너 제거
      if ((marker as any).hoverListeners) {
        window.google.maps.event.removeListener((marker as any).hoverListeners.mouseover);
        window.google.maps.event.removeListener((marker as any).hoverListeners.mouseout);
      }

      // 새로운 호버 이벤트 리스너 추가
      (marker as any).hoverListeners = {
        mouseover: marker.addListener('mouseover', () => {
          console.log('개별 마커 호버 (재설정):', property.title);
          
          // 선택된 마커는 호버 효과 적용하지 않음
          const isSelected = selectedMarkerId === property.id;
          if (isSelected) {
            console.log('선택된 마커이므로 호버 효과 적용하지 않음');
            return;
          }
          
          setHoveredMarkerId(property.id);
          
          // 호버 시 시각적 피드백
          marker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <circle cx="17" cy="17" r="16" fill="#1e40af" stroke="#000000" stroke-width="2" filter="url(#shadow)"/>
                <text x="17" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="11" font-weight="bold">1</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(34, 34),
            anchor: new window.google.maps.Point(17, 17)
          });
          
          // 호버 시 툴팁 업데이트
          marker.setTitle(`${property.title} - ${property.price}만원 (호버)`);
        }),
        mouseout: marker.addListener('mouseout', () => {
          console.log('개별 마커 호버 해제 (재설정):', property.title);
          
          // 선택된 마커는 호버 해제 효과 적용하지 않음
          const isSelected = selectedMarkerId === property.id;
          if (isSelected) {
            console.log('선택된 마커이므로 호버 해제 효과 적용하지 않음');
            return;
          }
          
          setHoveredMarkerId(null);
          
          // 호버 해제 시 원래 스타일로 복원
          marker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <circle cx="15" cy="15" r="14" fill="#3b82f6" stroke="#000000" stroke-width="1.5" filter="url(#shadow)"/>
                <text x="15" y="18" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">1</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(30, 30),
            anchor: new window.google.maps.Point(15, 15)
          });
          
          // 호버 해제 시 툴팁 복원
          marker.setTitle(`${property.title} - ${property.price}만원`);
        })
      };
    });
  }, [selectedMarkerId]);

  // 마커 스타일 업데이트 함수
  const updateMarkerStyles = useCallback(() => {
    if (clustererRef.current) {
      // 클러스터러가 있는 경우, 클러스터러를 다시 렌더링
      clustererRef.current.render();
    } else {
      // 클러스터러가 없는 경우, 개별 마커 스타일 업데이트
      markersRef.current.forEach(marker => {
        if (!marker) return;
        
        const property = (marker as any).property;
        if (!property) return;

        const isSelected = selectedMarkerId === property.id;
        const isHovered = hoveredMarkerId === property.id;
        
        let markerColor = '#3b82f6'; // 기본 파란색
        let markerSize = 30;
        
        if (isSelected) {
          markerColor = '#ef4444'; // 선택된 경우 빨간색
          markerSize = 38;
        } else if (isHovered) {
          markerColor = '#000000'; // 호버된 경우 검은색
          markerSize = 34;
        }
        
        const centerPoint = markerSize / 2;
        const fontSize = Math.max(8, markerSize * 0.3);
        
        marker.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              <circle cx="${centerPoint}" cy="${centerPoint}" r="${centerPoint - 1}" fill="${markerColor}" stroke="#000000" stroke-width="1.5" filter="url(#shadow)"/>
              <text x="${centerPoint}" y="${centerPoint + fontSize/3}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">1</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(markerSize, markerSize),
          anchor: new window.google.maps.Point(centerPoint, centerPoint)
        });

        // 호버 상태에 따른 툴팁 업데이트
        if (isHovered) {
          marker.setTitle(`${property.title} - ${property.price}만원 (호버)`);
        } else if (isSelected) {
          marker.setTitle(`${property.title} - ${property.price}만원 (선택됨)`);
        } else {
          marker.setTitle(`${property.title} - ${property.price}만원`);
        }
      });
    }
  }, [selectedMarkerId, hoveredMarkerId]);

  // 디바운싱을 적용한 마커 스타일 업데이트 함수
  const debouncedUpdateStyles = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateMarkerStyles();
    }, 100);
  }, [updateMarkerStyles]);

  useEffect(() => {
    console.log('GoogleMap 컴포넌트 마운트됨');
    
    // 지도 초기화 함수
    const initializeMap = () => {
      console.log('지도 초기화 시도...');
      console.log('mapRef.current:', !!mapRef.current);
      console.log('window.google:', !!window.google);
      console.log('window.google.maps:', !!(window.google && window.google.maps));
      
      if (!mapRef.current) {
        console.log('지도 컨테이너가 없음');
        return;
      }
      
      if (!window.google || !window.google.maps) {
        console.log('Google Maps API가 로드되지 않음');
        return;
      }
      
      if (mapInstance.current) {
        console.log('지도가 이미 초기화됨');
        return;
      }
      
      try {
        console.log('지도 생성 시작...');
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.5665, lng: 126.9780 }, // 서울시 중심
          zoom: 10, // 서울시 전체가 보이는 줌 레벨
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          backgroundColor: '#ffffff',
          disableDefaultUI: true,
          clickableIcons: false,
          restriction: {
            latLngBounds: {
              north: 38.8, // 북쪽 경계 (강원도 북부)
              south: 34.5, // 남쪽 경계 (전라남도 남부, 제주도 제외)
              west: 125.0, // 서쪽 경계 (인천 서해안)
              east: 131.5  // 동쪽 경계 (강원도 동해안)
            },
            strictBounds: true
          },
          // 클러스터링 관련 설정 - 원래 상태로 복원
          maxZoom: 20, // 최대 줌 레벨을 높여서 모든 줌 레벨에서 마커 표시
          minZoom: 6,
          // 클러스터 분할 방지를 위한 추가 설정
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.TOP_RIGHT,
            style: window.google.maps.ZoomControlStyle.SMALL
          }
        });
        
        mapInstance.current = map;
        console.log('지도 생성 완료');
        
        // 지도 로드 완료 후 마커 생성
        map.addListener('idle', () => {
          console.log('지도 idle 이벤트');
          setIsMapLoaded(true);
        });

        // 줌 변경 이벤트 리스너 추가
        map.addListener('zoom_changed', () => {
          const currentZoom = map.getZoom();
          console.log('줌 레벨 변경:', currentZoom);
          
          // 모든 줌 레벨에서 마커 호버 이벤트 재설정
          setTimeout(() => {
            resetIndividualMarkerHoverEvents();
          }, 100);
          
          // 즉시 마커 스타일 업데이트 (줌 변경은 즉시 반영)
          updateMarkerStyles();
          
          // 줌 레벨에 따른 추가 처리
          if (currentZoom && currentZoom > 15) {
            console.log('높은 줌 레벨에서 개별 마커 표시');
          }
        });

        // 지도 이동 이벤트 리스너 추가
        map.addListener('bounds_changed', () => {
          // 디바운싱된 마커 스타일 업데이트 (지도 이동은 디바운싱 적용)
          debouncedUpdateStyles();
        });
        
        setIsMapLoaded(true);
        setMapError(null);
        
      } catch (error) {
        console.error('지도 초기화 오류:', error);
        setMapError('지도를 로드할 수 없습니다.');
        setIsMapLoaded(false);
      }
    };

    // Google Maps API 로딩 이벤트 리스너
    const handleGoogleMapsLoaded = () => {
      console.log('Google Maps API 로딩 완료');
      setTimeout(initializeMap, 100);
    };

    const handleGoogleMapsError = () => {
      console.log('Google Maps API 로딩 오류');
      setMapError('Google Maps API를 로드할 수 없습니다.');
      setIsMapLoaded(false);
    };

    // MarkerClusterer 로딩 완료 이벤트 리스너
    const handleMarkerClustererLoaded = () => {
      console.log('MarkerClusterer 라이브러리 로딩 완료');
      // 마커가 이미 생성되어 있다면 클러스터러 초기화
      if (markersRef.current.length > 0 && mapInstance.current) {
        console.log('기존 마커에 대해 MarkerClusterer 초기화');
        createMarkers();
      }
    };

    // 클러스터 선택 해제 이벤트 리스너
    const handleResetClusterSelection = () => {
      console.log('클러스터 선택 해제 이벤트');
      setInternalSelectedClusterId(null);
    };

    // 마커 선택 해제 이벤트 리스너
    const handleResetMarkerSelection = () => {
      console.log('마커 선택 해제 이벤트');
      setHoveredMarkerId(null);
      
      // 모든 마커를 원래 스타일로 복원
      markersRef.current.forEach(marker => {
        if (marker) {
          const property = (marker as any).property;
          if (property) {
            marker.setIcon({
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                  </defs>
                  <circle cx="15" cy="15" r="14" fill="#3b82f6" stroke="#000000" stroke-width="1.5" filter="url(#shadow)"/>
                  <text x="15" y="18" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">1</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(30, 30),
              anchor: new window.google.maps.Point(15, 15)
            });
            marker.setTitle(`${property.title} - ${property.price}만원`);
          }
        }
      });
    };

    // 이미 로드된 경우 바로 초기화
    if (window.google && window.google.maps) {
      console.log('Google Maps API가 이미 로드됨');
      setTimeout(initializeMap, 100);
    } else {
      console.log('Google Maps API 로딩 대기...');
      window.addEventListener('googleMapsLoaded', handleGoogleMapsLoaded);
      window.addEventListener('googleMapsError', handleGoogleMapsError);
    }

    // MarkerClusterer 로딩 완료 이벤트 리스너 등록
    window.addEventListener('markerClustererLoaded', handleMarkerClustererLoaded);

    // 초기화 이벤트 리스너
    const handleResetMap = () => {
      console.log('지도 초기화 이벤트');
      if (mapInstance.current) {
        mapInstance.current.setCenter({ lat: 37.5665, lng: 126.9780 }); // 서울시 중심
        mapInstance.current.setZoom(10); // 서울시 전체가 보이는 줌 레벨
        
        // 초기화 버튼 클릭 시에만 호버 상태 초기화
        setHoveredMarkerId(null);
        setInternalSelectedClusterId(null);
        
        // 클러스터 호버 순환 타이머 정리
        if (clusterHoverIntervalRef.current) {
          clearInterval(clusterHoverIntervalRef.current);
          clusterHoverIntervalRef.current = null;
        }
      }
    };

    // 매물 업데이트 이벤트 리스너
    const handlePropertiesUpdated = (event: CustomEvent) => {
      console.log('매물 업데이트 이벤트');
      setTimeout(() => {
        createMarkers();
      }, 200);
    };

    window.addEventListener('resetFilters', handleResetMap);
    window.addEventListener('propertiesUpdated', handlePropertiesUpdated as EventListener);
    window.addEventListener('resetClusterSelection', handleResetClusterSelection);
    window.addEventListener('resetMarkerSelection', handleResetMarkerSelection);

    return () => {
      console.log('GoogleMap 컴포넌트 언마운트');
      window.removeEventListener('googleMapsLoaded', handleGoogleMapsLoaded);
      window.removeEventListener('googleMapsError', handleGoogleMapsError);
      window.removeEventListener('markerClustererLoaded', handleMarkerClustererLoaded);
      window.removeEventListener('resetFilters', handleResetMap);
      window.removeEventListener('propertiesUpdated', handlePropertiesUpdated as EventListener);
      window.removeEventListener('resetClusterSelection', handleResetClusterSelection);
      window.removeEventListener('resetMarkerSelection', handleResetMarkerSelection);
      
      // 타이머 정리
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // 클러스터러 정리
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
      
      // 마커 정리
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
      
      // 클러스터 호버 순환 타이머 정리
      if (clusterHoverIntervalRef.current) {
        clearInterval(clusterHoverIntervalRef.current);
      }
    };
  }, [createMarkers, updateMarkerStyles, debouncedUpdateStyles, createSimpleClusters, resetIndividualMarkerHoverEvents]);

  useEffect(() => {
    if (mapInstance.current && isMapLoaded && properties.length > 0) {
      console.log('마커 생성 useEffect - 조건 만족');
      console.log('properties 개수:', properties.length);
      createMarkers();
    } else {
      console.log('마커 생성 useEffect - 조건 불만족', {
        hasMap: !!mapInstance.current,
        isLoaded: isMapLoaded,
        propertiesCount: properties.length
      });
    }
  }, [properties, isMapLoaded, createMarkers]);

  useEffect(() => {
    if (mapInstance.current && isMapLoaded && markersRef.current.length > 0) {
      console.log('클러스터 업데이트 useEffect');
      updateMarkerStyles();
    }
  }, [selectedMarkerId, hoveredMarkerId, updateMarkerStyles, isMapLoaded]);

  // 클러스터 선택 상태 변경 시 스타일 업데이트
  useEffect(() => {
    if (mapInstance.current && isMapLoaded && clustererRef.current) {
      console.log('클러스터 선택 상태 변경:', internalSelectedClusterId);
    }
  }, [internalSelectedClusterId, isMapLoaded]);

  return (
    <MapContainer>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }} 
      />
      {!isMapLoaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(248, 250, 252, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          {mapError ? (
            <MapError>
              <h3>지도 로드 오류</h3>
              <p>{mapError}</p>
            </MapError>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '1.2rem',
              fontWeight: 500
            }}>
              지도를 로드하는 중...
            </div>
          )}
        </div>
      )}
    </MapContainer>
  );
};

export default GoogleMap; 