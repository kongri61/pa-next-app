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

  const createMarkers = useCallback(() => {
    if (!mapInstance.current) return;
    
    const currentZoom = mapInstance.current.getZoom() || 15;
    
    // 기존 마커들을 제거하지 않고 새 마커만 추가
    const newMarkers: google.maps.Marker[] = [];
    
    if (currentZoom >= 18) {
      properties.forEach((property, index) => {
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

        marker.addListener('mouseover', () => {
          setHoveredMarkerId(property.id);
        });

        marker.addListener('mouseout', () => {
          setHoveredMarkerId(null);
        });

        if (onMarkerClick) {
          marker.addListener('click', () => {
            setHoveredMarkerId(null);
            isClusterClicking.current = true;
            
            if (setSelectedMarkerId) setSelectedMarkerId(property.id);
            if (setSelectedClusterId) setSelectedClusterId('');
            onMarkerClick(property);
            
            setTimeout(() => {
              isClusterClicking.current = false;
            }, 1500);
          });
        }

        newMarkers.push(marker);
      });
    } else {
      const clusters = clusterMarkers([], currentZoom);

      clusters.forEach((cluster, clusterIndex) => {
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

          marker.addListener('mouseover', () => {
            setHoveredMarkerId(property.id);
          });

          marker.addListener('mouseout', () => {
            setHoveredMarkerId(null);
          });

          if (onMarkerClick) {
            marker.addListener('click', () => {
              setHoveredMarkerId(null);
              isClusterClicking.current = true;
              
              if (setSelectedMarkerId) setSelectedMarkerId(property.id);
              if (setSelectedClusterId) setSelectedClusterId('');
              onMarkerClick(property);
              
              setTimeout(() => {
                isClusterClicking.current = false;
              }, 1500);
            });
          }

          newMarkers.push(marker);
        } else {
          const clusterMarker = createClusterMarker(cluster.properties, cluster.center);
          newMarkers.push(clusterMarker);
        }
      });
    }
    
    // 기존 마커들을 제거하고 새 마커들로 교체
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = newMarkers;
  }, [properties, selectedMarkerId, hoveredMarkerId, onMarkerClick, setSelectedMarkerId, setSelectedClusterId, createClusterMarker, clusterMarkers]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      return false;
    }

    if (mapInstance.current) {
      return true;
    }

    try {
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
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        backgroundColor: '#f0f0f0',
        disableDefaultUI: true,
        clickableIcons: false,
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

      mapInstance.current = map;
      
      // 지도 로드 완료 후 마커 생성 (한 번만)
      map.addListener('idle', () => {
        if (markersRef.current.length === 0) {
          createMarkers();
        }
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
            createMarkers();
          }
        }, 300);
      });

      setIsMapLoaded(true);
      setMapError(null);
      return true;
    } catch (error) {
      console.error('지도 초기화 오류:', error);
      setMapError('지도를 로드할 수 없습니다. Google Maps API를 확인해주세요.');
      setIsMapLoaded(false);
      return false;
    }
  }, [createMarkers]);

  const checkAndInit = useCallback(() => {
    if (window.google && window.google.maps) {
      if (initMap()) {
        return;
      }
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

  useEffect(() => {
    if (mapInstance.current && isMapLoaded) {
      // 마커가 없으면 생성
      if (markersRef.current.length === 0) {
        createMarkers();
      } else {
        // 마커가 있으면 상태 변경에 따라 업데이트
        const needsUpdate = properties.length > 0 || selectedMarkerId || selectedClusterId || hoveredMarkerId;
        if (needsUpdate) {
          createMarkers();
        }
      }
    }
  }, [properties, selectedMarkerId, selectedClusterId, hoveredMarkerId, isMapLoaded, createMarkers]);

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