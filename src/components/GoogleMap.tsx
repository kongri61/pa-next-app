import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, memo, useCallback } from 'react';
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
  getZoom: () => number;
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
  
  // 줌 변경 디바운싱을 위한 ref
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          setError('지도를 로드할 수 없습니다. Google Maps API 키를 확인해주세요.');
        }
        return;
      }

      try {
        setError(null);
        
        // 남한 본토 중심점 (대전 근처)
        const koreaCenter = { lat: 36.3504, lng: 127.3845 };
        
        // 남한 본토 경계 설정 (제주도 완전 제외)
        const koreaBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(33.5, 124.5), // 남서쪽 (제주도 완전 제외)
          new window.google.maps.LatLng(38.8, 131.9)  // 북동쪽
        );
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: koreaCenter,
          zoom: 8, // 더 가까운 줌 레벨로 시작하여 클러스터링이 더 잘 보이도록
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
          minZoom: 5, // 최소 줌 레벨을 5로 설정하여 더 자유로운 줌 허용
          styles: [],
          noClear: true,
          restriction: {
            latLngBounds: koreaBounds,
            strictBounds: false // 경계를 약간 넘어갈 수 있도록 허용
          },
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

        // 지도 중심을 남한 중심으로 설정 (줌 레벨은 사용자 선택에 맡김)
        map.panTo(koreaCenter);
        // 줌 레벨은 사용자가 자유롭게 조정할 수 있도록 제거

        // 지도 범위 제한 이벤트 리스너 추가 (줌 레벨은 유지)
        map.addListener('bounds_changed', () => {
          const currentBounds = map.getBounds();
          if (currentBounds && (!koreaBounds.contains(currentBounds.getNorthEast()) || 
              !koreaBounds.contains(currentBounds.getSouthWest()))) {
            // 경계를 벗어나면 중심점만 조정 (줌 레벨 유지)
            const currentZoom = map.getZoom();
            map.setCenter(koreaCenter);
            map.setZoom(currentZoom);
          }
        });

        // 지도 드래그 제한 (줌 레벨은 유지)
        map.addListener('dragend', () => {
          const currentBounds = map.getBounds();
          if (currentBounds && (!koreaBounds.contains(currentBounds.getNorthEast()) || 
              !koreaBounds.contains(currentBounds.getSouthWest()))) {
            // 경계를 벗어나면 중심점만 조정 (줌 레벨 유지)
            const currentZoom = map.getZoom();
            map.setCenter(koreaCenter);
            map.setZoom(currentZoom);
          }
        });

        map.addListener('tilesloaded', () => {
          setIsLoaded(true);
          setError(null);
          // 지도 타일 로드 완료 후 클러스터 업데이트
          setTimeout(() => {
            updateClusters();
          }, 100);
        });

        map.addListener('zoom_changed', () => {
          // 줌 변경 시 클러스터 업데이트 (디바운싱으로 깜빡임 방지)
          if (zoomTimeoutRef.current) {
            clearTimeout(zoomTimeoutRef.current);
          }
          zoomTimeoutRef.current = setTimeout(() => {
            updateClusters();
          }, 300);
        });
        
        map.addListener('error', (error: any) => {
          console.error('지도 오류:', error);
          setError('지도를 로드하는 중 오류가 발생했습니다. Google Maps API 키를 확인해주세요.');
        });
        
      } catch (error) {
        console.error('지도 초기화 오류:', error);
        setError('지도를 초기화할 수 없습니다. Google Maps API 키를 확인해주세요.');
      }
    };

    initMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  // 클러스터링 거리 계산 함수 - 메모이제이션으로 깜빡임 방지
  const getClusterDistance = useCallback((zoom: number) => {
    const isMobile = window.innerWidth <= 768;
    let distance = 0;
    
    if (isMobile) {
      if (zoom < 9) distance = 0.15;      // 낮은 줌에서 더 큰 클러스터
      else if (zoom < 10) distance = 0.08;   // 중간 줌에서 중간 클러스터
      else if (zoom < 11) distance = 0.04;    // 높은 줌에서 작은 클러스터
      else if (zoom < 12) distance = 0.02;    // 매우 높은 줌에서 매우 작은 클러스터
      else distance = 0;                      // 줌 12 이상에서는 개별 마커
    } else {
      if (zoom < 9) distance = 0.2;      // 낮은 줌에서 더 큰 클러스터
      else if (zoom < 10) distance = 0.1;     // 중간 줌에서 중간 클러스터
      else if (zoom < 11) distance = 0.05;      // 높은 줌에서 작은 클러스터
      else if (zoom < 12) distance = 0.025;     // 매우 높은 줌에서 매우 작은 클러스터
      else distance = 0;                      // 줌 12 이상에서는 개별 마커
    }
    
    console.log(`클러스터 거리 계산: 줌=${zoom}, 모바일=${isMobile}, 거리=${distance}`);
    return distance;
  }, []);

  // 고정된 마커 아이콘 생성 - 메모이제이션으로 깜빡임 방지
  const createMarkerIcon = useCallback(() => {
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
  }, []);

  // 선택된 마커 아이콘 생성 - 메모이제이션으로 깜빡임 방지
  const createSelectedMarkerIcon = useCallback(() => {
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
  }, []);

  // 고정된 클러스터 아이콘 생성 - 메모이제이션으로 깜빡임 방지
  const createClusterIcon = useCallback((count: number) => {
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
  }, []);

  // 선택된 클러스터 아이콘 생성 - 메모이제이션으로 깜빡임 방지
  const createSelectedClusterIcon = useCallback((count: number) => {
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
  }, []);

  // 수동 클러스터링 함수 - 메모이제이션으로 깜빡임 방지
  const updateClusters = useCallback(() => {
    if (!mapInstance.current || !window.google) return;

    const zoom = mapInstance.current.getZoom();
    const clusterDistance = getClusterDistance(zoom);
    
    console.log(`줌 레벨: ${zoom}, 클러스터 거리: ${clusterDistance}`);
    
    // 클러스터링이 필요 없는 경우 (개별 마커 표시)
    if (clusterDistance === 0) {
      // 기존 클러스터만 제거하고 마커는 유지
      clustersRef.current.forEach(cluster => {
        try {
          cluster.setMap(null);
        } catch (err) {
          console.error('클러스터 제거 오류:', err);
        }
      });
      clustersRef.current = [];

      // 개별 마커 표시
      console.log('개별 마커 표시 시작, 마커 수:', markersRef.current.length);
      markersRef.current.forEach((marker, index) => {
        console.log(`마커 ${index} 표시:`, marker.property?.id);
        marker.setIcon(createMarkerIcon());
        marker.setMap(mapInstance.current);
        
        // 기존 클릭 이벤트 리스너 제거 (중복 방지)
        if (marker.clickListener) {
          window.google.maps.event.removeListener(marker.clickListener);
        }
        
        // 선택효과가 포함된 클릭 이벤트
        marker.clickListener = marker.addListener('click', () => {
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
      console.log('개별 마커 표시 완료');
      return;
    }

    // 클러스터링이 필요한 경우
    console.log('클러스터링 시작, 마커 수:', markersRef.current.length);
    
    // 기존 클러스터 제거
    clustersRef.current.forEach(cluster => {
      try {
        // 클러스터 클릭 이벤트 리스너 제거
        if (cluster.clickListener) {
          window.google.maps.event.removeListener(cluster.clickListener);
        }
        cluster.setMap(null);
      } catch (err) {
        console.error('클러스터 제거 오류:', err);
      }
    });
    clustersRef.current = [];

    // 마커들을 지도에서 숨김
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });

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

    // 클러스터 생성
    console.log('클러스터 그룹 수:', groups.length);
    groups.forEach((group, groupIndex) => {
      if (group.markers.length === 1) {
        // 개별 마커
        console.log(`그룹 ${groupIndex}: 개별 마커`, group.markers[0].property?.id);
        const marker = group.markers[0];
        const property = group.properties[0];
        
        marker.setIcon(createMarkerIcon());
        marker.setMap(mapInstance.current);
        
        // 기존 클릭 이벤트 리스너 제거 (중복 방지)
        if (marker.clickListener) {
          window.google.maps.event.removeListener(marker.clickListener);
        }
        
        // 선택효과가 포함된 클릭 이벤트
        marker.clickListener = marker.addListener('click', () => {
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
            onMarkerClick(property);
          }
        });
        
      } else {
        // 클러스터
        console.log(`그룹 ${groupIndex}: 클러스터 (${group.markers.length}개 마커)`);
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
        cluster.clickListener = cluster.addListener('click', () => {
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
  }, [getClusterDistance, createMarkerIcon, createSelectedMarkerIcon, createClusterIcon, createSelectedClusterIcon, onMarkerClick, onClusterClick]);

  useEffect(() => {
    if (!mapInstance.current || !window.google || !isLoaded) {
      return;
    }

    // 마커 업데이트를 위한 디바운싱 (더 긴 지연 시간으로 깜빡임 방지)
    const timeoutId = setTimeout(() => {
      try {
        // 현재 매물 ID 목록
        const currentPropertyIds = properties.map(p => p.id).sort();
        const existingPropertyIds = markersRef.current.map(m => m.property?.id).filter(Boolean).sort();
        
        // 매물이 변경되지 않았다면 마커 업데이트 건너뛰기
        if (JSON.stringify(currentPropertyIds) === JSON.stringify(existingPropertyIds)) {
          console.log('매물 변경 없음, 마커 업데이트 건너뛰기');
          return;
        }

        console.log('매물 변경 감지, 마커 업데이트 시작');

        // 기존 클러스터만 제거 (마커는 유지)
        clustersRef.current.forEach(cluster => {
          try {
            // 클러스터 클릭 이벤트 리스너 제거
            if (cluster.clickListener) {
              window.google.maps.event.removeListener(cluster.clickListener);
            }
            cluster.setMap(null);
          } catch (err) {
            console.error('클러스터 제거 오류:', err);
          }
        });
        clustersRef.current = [];

        // 새로 추가된 매물만 마커 생성
        const newProperties = properties.filter(property => 
          !markersRef.current.some(marker => marker.property?.id === property.id)
        );

        // 제거된 매물의 마커만 삭제
        const removedMarkers = markersRef.current.filter(marker => 
          !properties.some(property => property.id === marker.property?.id)
        );

        removedMarkers.forEach(marker => {
          try {
            // 마커 클릭 이벤트 리스너 제거
            if (marker.clickListener) {
              window.google.maps.event.removeListener(marker.clickListener);
            }
            marker.setMap(null);
          } catch (err) {
            console.error('마커 제거 오류:', err);
          }
        });

        // 제거된 마커를 배열에서 삭제
        markersRef.current = markersRef.current.filter(marker => 
          properties.some(property => property.id === marker.property?.id)
        );

        // 새 마커 생성
        newProperties.forEach((property) => {
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

        // 클러스터링 적용을 더 늦게 실행 (깜빡임 방지)
        setTimeout(() => {
          updateClusters();
        }, 100);

      } catch (error) {
        console.error('마커 생성 전체 오류:', error);
        setError('마커를 생성하는 중 오류가 발생했습니다.');
      }
    }, 300); // 디바운싱 지연 시간 증가로 깜빡임 방지

    return () => {
      clearTimeout(timeoutId);
    };
  }, [properties, isLoaded, updateClusters, createMarkerIcon]);

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

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
    getZoom: () => {
      if (mapInstance.current) {
        return mapInstance.current.getZoom();
      }
      return 8; // 기본값을 8로 변경
    },
    resetMarkers: () => {
      if (mapInstance.current) {
        const incheonCenter = { lat: 37.4000, lng: 126.7052 };
        mapInstance.current.panTo(incheonCenter);
        // 줌 레벨은 사용자가 설정한 것을 유지
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
  
  // properties의 id와 주요 필드들을 비교하여 실제 변경사항이 있는지 확인
  const prevProperties = prevProps.properties.map((p: Property) => ({
    id: p.id,
    location: p.location,
    type: p.type,
    isActive: p.isActive
  })).sort((a: any, b: any) => a.id.localeCompare(b.id));
  
  const nextProperties = nextProps.properties.map((p: Property) => ({
    id: p.id,
    location: p.location,
    type: p.type,
    isActive: p.isActive
  })).sort((a: any, b: any) => a.id.localeCompare(b.id));
  
  return JSON.stringify(prevProperties) === JSON.stringify(nextProperties);
};

export default memo(GoogleMap, areEqual); 