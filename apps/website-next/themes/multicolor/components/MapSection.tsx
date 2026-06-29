'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import 'mapbox-gl/dist/mapbox-gl.css';

type PageType = 'country' | 'state' | 'city' | 'local_area';

// The pageType prop will decide the zoom level for map
const getZoomLevel = (pageType: PageType | string): number => {
  switch (pageType) {
    case 'country': return 3;
    case 'state': return 7;
    case 'city': return 10;
    case 'local_area': return 13;
    default: return 8;
  }
};

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2pibG9nczIwMjMiLCJhIjoiY21iM2ZmNDQ4MDZ5djJwc2F4MXdvejRjZSJ9.DM8BhznWkYNPO_ty6UFtkQ';

console.log(MAPBOX_TOKEN,"this is mapbox token");

interface MapSectionProps {
  locationName?: string;
  lat?: number;
  lng?: number;
  pageType?: PageType | string;
}

const MapSection = ({
  locationName = 'Service Area',
  lat,
  lng,
  pageType = 'country'
}: MapSectionProps) => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Intersection Observer to detect when map section is visible
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before it's visible
        threshold: 0.1
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  useEffect(() => {
    // Only load map when section is visible
    if (!isVisible || !mapRef.current) return;

    let map: any;
    let mapboxgl: any;
    let mounted = true;

    const loadMap = async () => {
      setIsLoading(true);
      try {
        mapboxgl = await import('mapbox-gl');
        mapboxgl.default.accessToken = MAPBOX_TOKEN;

      if (mapRef.current && lat != null && lng != null && mounted) {
        map = new mapboxgl.default.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [lng, lat],
          zoom: getZoomLevel(pageType),
          projection: 'globe',
          pitch: 45,
        });

        // Add custom overlay for service area
        map.on('load', () => {
          
          // Add custom layer for service area highlight
          map.addSource('service-area', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              properties: {
                name: locationName
              }
            }
          });

          // Add service area circle
          map.addLayer({
            id: 'service-area-circle',
            type: 'circle',
            source: 'service-area',
            paint: {
              'circle-radius': {
                stops: [
                  [0, 0],
                  [20, 1000]
                ],
                base: 2
              },
              'circle-color': `${colors.primaryButton.bg}20`,
              'circle-stroke-color': colors.primaryButton.bg,
              'circle-stroke-width': 2,
              'circle-opacity': 0.3
            }
          });

          // Add service area pulse effect
          map.addLayer({
            id: 'service-area-pulse',
            type: 'circle',
            source: 'service-area',
            paint: {
              'circle-radius': {
                stops: [
                  [0, 0],
                  [20, 1500]
                ],
                base: 2
              },
              'circle-color': `${colors.accent}15`,
              'circle-stroke-color': colors.accent,
              'circle-stroke-width': 1,
              'circle-opacity': 0.2
            }
          });

          setMapReady(true);
          setIsLoading(false);
        });

        map.addControl(new mapboxgl.default.NavigationControl({ visualizePitch: true }), 'top-right');

        // Add custom marker with theme colors and enhanced design
        const markerEl = document.createElement('div');
        markerEl.style.width = '60px';
        markerEl.style.height = '60px';
        markerEl.style.background = `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`;
        markerEl.style.borderRadius = '50%';
        markerEl.style.boxShadow = `0 10px 30px ${colors.primaryButton.bg}40, 0 0 0 4px rgba(255,255,255,0.8)`;
        markerEl.style.display = 'flex';
        markerEl.style.alignItems = 'center';
        markerEl.style.justifyContent = 'center';
        markerEl.style.color = 'white';
        markerEl.style.fontSize = '28px';
        markerEl.style.border = '4px solid white';
        markerEl.style.position = 'relative';
        markerEl.style.cursor = 'pointer';
        markerEl.style.transition = 'all 0.3s ease';
        
        // Add pulsing animation
        const pulseEl = document.createElement('div');
        pulseEl.style.position = 'absolute';
        pulseEl.style.width = '100%';
        pulseEl.style.height = '100%';
        pulseEl.style.borderRadius = '50%';
        pulseEl.style.background = `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`;
        pulseEl.style.opacity = '0.3';
        pulseEl.style.animation = 'pulse 2s infinite';
        pulseEl.style.zIndex = '-1';
        
        markerEl.appendChild(pulseEl);
        markerEl.innerHTML += '📍';
        
        // Add hover effect
        markerEl.addEventListener('mouseenter', () => {
          markerEl.style.transform = 'scale(1.1)';
          markerEl.style.boxShadow = `0 15px 40px ${colors.primaryButton.bg}50, 0 0 0 6px rgba(255,255,255,0.9)`;
        });
        
        markerEl.addEventListener('mouseleave', () => {
          markerEl.style.transform = 'scale(1)';
          markerEl.style.boxShadow = `0 10px 30px ${colors.primaryButton.bg}40, 0 0 0 4px rgba(255,255,255,0.8)`;
        });

        // Create enhanced popup content
        const popupContent = `
          <div style="
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 280px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            border: 2px solid ${colors.primaryButton.bg}20;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 2px solid ${colors.primaryButton.bg}15;
            ">
              <div style="
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent});
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
              ">📍</div>
              <div>
                <h3 style="
                  margin: 0;
                  font-size: 18px;
                  font-weight: 700;
                  color: #1f2937;
                  line-height: 1.2;
                ">${locationName}</h3>
                <p style="
                  margin: 4px 0 0 0;
                  font-size: 14px;
                  color: #6b7280;
                  font-weight: 500;
                ">Service Location</p>
              </div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                padding: 8px 12px;
                background: ${colors.primaryButton.bg}08;
                border-radius: 8px;
                border-left: 3px solid ${colors.primaryButton.bg};
              ">
                <div style="
                  width: 8px;
                  height: 8px;
                  background: ${colors.primaryButton.bg};
                  border-radius: 50%;
                "></div>
                <span style="
                  font-size: 14px;
                  color: #374151;
                  font-weight: 600;
                ">Professional Services Available</span>
              </div>
              
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: ${colors.accent}08;
                border-radius: 8px;
                border-left: 3px solid ${colors.accent};
              ">
                <div style="
                  width: 8px;
                  height: 8px;
                  background: ${colors.accent};
                  border-radius: 50%;
                "></div>
                <span style="
                  font-size: 14px;
                  color: #374151;
                  font-weight: 600;
                ">24/7 Emergency Support</span>
              </div>
            </div>
            
            <div style="
              display: flex;
              gap: 8px;
              margin-top: 16px;
            ">
              <button style="
                flex: 1;
                padding: 10px 16px;
                background: linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent});
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
              " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                Get Directions
              </button>
              <button style="
                flex: 1;
                padding: 10px 16px;
                background: white;
                color: ${colors.primaryButton.bg};
                border: 2px solid ${colors.primaryButton.bg};
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
              " onmouseover="this.style.background='${colors.primaryButton.bg}10'" onmouseout="this.style.background='white'">
                Call Now
              </button>
            </div>
          </div>
        `;

        new mapboxgl.default.Marker(markerEl)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.default.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            className: 'custom-popup'
          }).setHTML(popupContent))
          .addTo(map);
      }
      } catch (error) {
        console.error('Error loading mapbox:', error);
        setIsLoading(false);
      }
    };

    loadMap();

    return () => {
      mounted = false;
      if (map) map.remove();
    };
  }, [isVisible, lat, lng, locationName, pageType, colors]);

  if (lat == null || lng == null) return null;

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.1;
            }
            100% {
              transform: scale(1.4);
              opacity: 0;
            }
          }
          
          .custom-popup .mapboxgl-popup-content {
            padding: 0 !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
          }
          
          .custom-popup .mapboxgl-popup-tip {
            border-top-color: white !important;
          }
        `}
      </style>
      <section ref={containerRef} className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span 
              className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
              style={{ 
                color: colors.primaryButton.bg,
                backgroundColor: `${colors.primaryButton.bg}15`
              }}
            >
              Service Area
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            <span style={{ color: colors.primaryButton.bg }}>Interactive</span> Service Map
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
            Find our service location and coverage area on the interactive map below.
          </p>
        </div>

        {/* Map Container */}
        <div className="relative">
          {/* Loading Placeholder */}
          {isLoading && (
            <div
              className="w-full h-[500px] rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center"
              style={{
                border: `3px solid ${colors.primaryButton.bg}20`,
                background: `linear-gradient(135deg, ${colors.primaryButton.bg}10, ${colors.accent}10)`
              }}
            >
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent mb-4" style={{ color: colors.primaryButton.bg }}></div>
                <p className="text-gray-600 font-medium">Loading map...</p>
              </div>
            </div>
          )}
          
          {/* Map */}
          <div
            ref={mapRef}
            id="map-container"
            className={`w-full h-[500px] rounded-3xl shadow-2xl overflow-hidden ${isLoading ? 'hidden' : ''}`}
            style={{
              border: `3px solid ${colors.primaryButton.bg}20`
            }}
          />
          
          {/* Map Info Card */}
          <div 
            className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl"
            style={{
              border: `2px solid ${colors.primaryButton.bg}20`
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                }}
              >
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 text-lg">{locationName}</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primaryButton.bg }}></div>
                Professional Service Available
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }}></div>
                24/7 Emergency Support
              </li>
            </ul>
          </div>

          {/* Map Controls Info */}
          <div 
            className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg"
            style={{
              border: `2px solid ${colors.primaryButton.bg}20`
            }}
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Navigation className="w-4 h-4" style={{ color: colors.primaryButton.bg }} />
              <span>Use controls to navigate</span>
            </div>
          </div>
        </div>

        {/* Map Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="flex items-center gap-4 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: `${colors.primaryButton.bg}08`,
              border: `1px solid ${colors.primaryButton.bg}20`
            }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
              }}
            >
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Precise Location</h4>
              <p className="text-sm text-gray-600">Exact service coordinates</p>
            </div>
          </div>

          <div 
            className="flex items-center gap-4 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: `${colors.primaryButton.bg}08`,
              border: `1px solid ${colors.primaryButton.bg}20`
            }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
              }}
            >
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Interactive Map</h4>
              <p className="text-sm text-gray-600">Zoom and explore the area</p>
            </div>
          </div>

          <div 
            className="flex items-center gap-4 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: `${colors.primaryButton.bg}08`,
              border: `1px solid ${colors.primaryButton.bg}20`
            }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
              }}
            >
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Easy Navigation</h4>
              <p className="text-sm text-gray-600">Find us quickly</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default MapSection;
