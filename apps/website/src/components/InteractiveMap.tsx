
import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface InteractiveMapProps {
  locations: Array<{
    name: string;
    coordinates: { lat: number; lng: number };
    description: string;
    responseTime: string;
  }>;
  areaName: string;
  className?: string;
  theme: 'plumbing' | 'hvac' | 'cleaning' | 'painting' | 'roofing';
  centerCoordinates?: [number, number];
  zoom?: number;
  areaType?: 'local' | 'city' | 'state' | 'country';
}

const InteractiveMap = ({ 
  locations, 
  areaName, 
  className = '', 
  theme,
  centerCoordinates,
  zoom = 10
}: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    // Clean up existing map
    const existingMap = mapRef.current.querySelector('.maplibregl-map');
    if (existingMap) {
      existingMap.remove();
    }

    // Small delay to ensure container is ready
    const initTimeout = setTimeout(() => {
      if (!mapRef.current) return;

      try {
        const center = centerCoordinates || [locations[0].coordinates.lng, locations[0].coordinates.lat];
        
        const map = new maplibregl.Map({
          container: mapRef.current,
          style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=get_your_own_OpIi9uVxtLqVmJvP9Qx9',
          center: center,
          zoom: zoom,
        });

        map.on('load', () => {
          setIsMapReady(true);
          
          locations.forEach(location => {
            new maplibregl.Marker()
              .setLngLat([location.coordinates.lng, location.coordinates.lat])
              .setPopup(new maplibregl.Popup({ offset: 25 })
                .setHTML(
                  `<h3>${location.name}</h3>
                  <p>${location.description}</p>
                  <p>Response Time: ${location.responseTime}</p>`
                ))
              .addTo(map);
          });
        });

        map.on('error', (e) => {
          console.error('Map error:', e);
        });

        // Cleanup function
        return () => map.remove();
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [locations, centerCoordinates, zoom]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="map-container h-full w-full rounded-2xl" style={{ minHeight: '400px' }} />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
