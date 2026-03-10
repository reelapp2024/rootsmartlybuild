
import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2pibG9nczIwMjMiLCJhIjoiY21iM2ZmNDQ4MDZ5djJwc2F4MXdvejRjZSJ9.DM8BhznWkYNPO_ty6UFtkQ';

interface MapboxMapProps {
  locations: Array<{
    name: string;
    coordinates: { lat: number; lng: number };
    description: string;
    responseTime: string;
  }>;
  areaName: string;
  className?: string;
  theme: 'cleaning' | 'multicolor';
  centerCoordinates?: [number, number];
  zoom?: number;
}

const MapboxMap = ({ 
  locations, 
  areaName, 
  className = '', 
  theme,
  centerCoordinates,
  zoom = 10
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return; // prevent map from initializing more than once
    if (!mapboxgl.accessToken) return;

    // Calculate center if not provided
    const center = centerCoordinates || [
      locations.length > 0 ? locations[0].coordinates.lng : -118.2437,
      locations.length > 0 ? locations[0].coordinates.lat : 34.0522
    ];

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
      scrollZoom: true
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      locations.forEach((location) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.background = getThemeColors(theme).primary;
        el.style.border = '3px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
          .setHTML(`
            <div style="padding: 10px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; font-weight: bold; color: ${getThemeColors(theme).primary};">${location.name}</h4>
              <p style="margin: 0 0 5px 0; color: #666;">${location.description}</p>
              <p style="margin: 0; font-weight: bold; color: ${getThemeColors(theme).secondary};">Response Time: ${location.responseTime}</p>
            </div>
          `);

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat([location.coordinates.lng, location.coordinates.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Fit map to show all markers if there are multiple locations
      if (locations.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(location => {
          bounds.extend([location.coordinates.lng, location.coordinates.lat]);
        });
        map.current?.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [locations, theme, centerCoordinates, zoom]);

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'cleaning':
        return { primary: '#10B981', secondary: '#059669', bg: 'from-green-500 to-emerald-600' };
      case 'multicolor':
        return { primary: '#3B82F6', secondary: '#1E40AF', bg: 'from-blue-500 to-blue-600' };
      default:
        return { primary: '#3B82F6', secondary: '#1E40AF', bg: 'from-blue-500 to-blue-600' };
    }
  };

  return (
    <div 
      ref={mapContainer} 
      className={`map-container ${className}`} 
      style={{ height: '100%', width: '100%', borderRadius: '1rem' }} 
    />
  );
};

export default MapboxMap;
