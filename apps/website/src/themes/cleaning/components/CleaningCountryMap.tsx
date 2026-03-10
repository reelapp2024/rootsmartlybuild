
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2pibG9nczIwMjMiLCJhIjoiY21iM2ZmNDQ4MDZ5djJwc2F4MXdvejRjZSJ9.DM8BhznWkYNPO_ty6UFtkQ';

interface CleaningCountryMapProps {
  locationName?: string;
  lat?: number;
  lng?: number;
  pageType?: string;
}

const CleaningCountryMap: React.FC<CleaningCountryMapProps> = ({
  locationName,
  lat,
  lng,
  pageType = 'country'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      setCurrentTheme(getThemeByName(savedTheme));
    }
  }, []);

  // Listen for theme changes from header
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setSelectedTheme(newTheme);
      setCurrentTheme(getThemeByName(newTheme));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // Don't render if we don't have coordinates
  if (lat == null || lng == null) {
    return null;
  }

  // Get zoom level based on page type
  const getZoomLevel = (type: string) => {
    switch (type) {
      case 'country':
        return 4;
      case 'state':
        return 7;
      case 'city':
        return 11;
      case 'local_area':
        return 14;
      default:
        return 8;
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl.accessToken) return;
    
    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    // Small delay to ensure container is ready
    const initTimeout = setTimeout(() => {
      if (!mapContainer.current) return;

      try {
        // Initialize the map with better scroll handling
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [lng, lat],
          zoom: getZoomLevel(pageType),
          scrollZoom: true,
          doubleClickZoom: true,
          dragPan: true,
          dragRotate: false,
          keyboard: true,
          touchZoomRotate: true,
          boxZoom: true,
          cooperativeGestures: false // Allow scroll to work properly
        });

        // Add custom navigation controls
        const nav = new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        });
        map.current.addControl(nav, 'top-right');

        // Add fullscreen control
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        });
        map.current.addControl(geolocate, 'top-right');

        // Add a marker when the map loads
        map.current.on('load', () => {
          setIsMapReady(true);
          
          // Create colorful custom marker with animation
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.innerHTML = `
            <div style="
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent}, #FF6B6B, #4ECDC4);
              background-size: 400% 400%;
              animation: gradientShift 3s ease infinite;
              border-radius: 50%;
              border: 5px solid white;
              box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 0 10px ${currentTheme.elements.primaryButton.bg}20;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.3s ease;
              position: relative;
            ">
              <div style="
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 2s infinite;
              "></div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style="z-index: 1;">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `;

          // Create colorful enhanced popup
          const popup = new mapboxgl.Popup({ 
            offset: 25, 
            closeButton: true,
            closeOnClick: false,
            className: 'custom-popup'
          })
            .setHTML(`
              <div style="padding: 25px; min-width: 320px; font-family: 'Poppins', sans-serif; position: relative; overflow: hidden;">
                <!-- Background gradient overlay -->
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}10, ${currentTheme.elements.accent}10, #FF6B6B10, #4ECDC410);
                  background-size: 400% 400%;
                  animation: gradientShift 4s ease infinite;
                  z-index: 0;
                "></div>
                
                <div style="position: relative; z-index: 1;">
                  <div style="display: flex; align-items: center; margin-bottom: 20px;">
                    <div style="
                      width: 50px; 
                      height: 50px; 
                      background: linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent}, #FF6B6B, #4ECDC4);
                      background-size: 400% 400%;
                      animation: gradientShift 3s ease infinite;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      margin-right: 15px;
                      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                      border: 3px solid white;
                    ">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 style="margin: 0; color: ${currentTheme.elements.surface}; font-size: 20px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        ${locationName || 'Service Location'}
                      </h4>
                      <p style="margin: 0; color: ${currentTheme.elements.description}; font-size: 15px; font-weight: 500;">
                        🎯 Professional Services Available
                      </p>
                    </div>
                  </div>
                  
                  <div style="
                    background: linear-gradient(135deg, ${currentTheme.elements.surface}15, ${currentTheme.elements.accent}15);
                    padding: 18px;
                    border-radius: 12px;
                    border-left: 5px solid ${currentTheme.elements.accent};
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    position: relative;
                    overflow: hidden;
                  ">
                    <div style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      right: 0;
                      height: 3px;
                      background: linear-gradient(90deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent}, #FF6B6B, #4ECDC4);
                      background-size: 400% 100%;
                      animation: gradientShift 3s ease infinite;
                    "></div>
                    <p style="margin: 0; color: ${currentTheme.elements.surface}; font-size: 15px; line-height: 1.6; font-weight: 500;">
                      ✨ We provide comprehensive cleaning services in this area with professional expertise and reliable results.
                    </p>
                  </div>
                  
                  <!-- Service badges -->
                  <div style="display: flex; gap: 8px; margin-top: 15px; flex-wrap: wrap;">
                    <span style="
                      background: linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent});
                      color: white;
                      padding: 6px 12px;
                      border-radius: 20px;
                      font-size: 12px;
                      font-weight: 600;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    ">🏠 Residential</span>
                    <span style="
                      background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
                      color: white;
                      padding: 6px 12px;
                      border-radius: 20px;
                      font-size: 12px;
                      font-weight: 600;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    ">🏢 Commercial</span>
                    <span style="
                      background: linear-gradient(135deg, #4ECDC4, #7EDDD6);
                      color: white;
                      padding: 6px 12px;
                      border-radius: 20px;
                      font-size: 12px;
                      font-weight: 600;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    ">⭐ Premium</span>
                  </div>
                </div>
              </div>
            `);

          new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          // Add hover effect to marker
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.1)';
            el.style.transition = 'transform 0.3s ease';
          });
          
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
          });
        });

        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Map error:', e);
        });

        // Handle scroll events properly
        map.current.on('wheel', (e) => {
          // Allow normal scroll behavior
          e.preventDefault();
        });

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100);

    // Cleanup on component unmount
    return () => {
      clearTimeout(initTimeout);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lat, lng, locationName, pageType, currentTheme]);

  return (
    <>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .custom-popup .mapboxgl-popup-content {
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border: 3px solid ${currentTheme.elements.accent};
            background: linear-gradient(135deg, white, ${currentTheme.elements.surface}05);
            overflow: hidden;
          }
          .custom-popup .mapboxgl-popup-tip {
            border-top-color: ${currentTheme.elements.accent};
            border-width: 8px;
          }
          .map-container {
            position: relative;
            overflow: hidden;
            border-radius: 16px;
          }
          .map-container .mapboxgl-ctrl-group {
            background: linear-gradient(135deg, white, ${currentTheme.elements.surface}10);
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border: 2px solid ${currentTheme.elements.ring};
          }
          .map-container .mapboxgl-ctrl-group button {
            background: transparent;
            border: none;
            color: ${currentTheme.elements.surface};
            transition: all 0.3s ease;
          }
          .map-container .mapboxgl-ctrl-group button:hover {
            background: ${currentTheme.elements.accent}20;
            transform: scale(1.1);
          }
          .custom-marker:hover {
            animation: pulse 1s infinite;
          }
        `}
      </style>
      <section 
        className="py-16 font-poppins relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: Math.random() * 6 + 3 + 'px',
                height: Math.random() * 6 + 3 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                backgroundColor: currentTheme.elements.accent,
                animationDelay: Math.random() * 3 + 's',
                animationDuration: Math.random() * 3 + 2 + 's'
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-6">
              <div 
                className="w-12 h-1 rounded-full mr-3"
                style={{ backgroundColor: currentTheme.elements.accent }}
              ></div>
              <span 
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: currentTheme.elements.accent }}
              >
                Service Coverage
              </span>
              <div 
                className="w-12 h-1 rounded-full ml-3"
                style={{ backgroundColor: currentTheme.elements.accent }}
              ></div>
            </div>
            
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
              style={{ color: currentTheme.elements.surface }}
            >
              Our Service Coverage in {locationName}
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              Explore our comprehensive service coverage around {locationName}. 
              Click on the marker to learn more about our services in this area.
            </p>
          </div>

          {/* Map Container */}
          <div className="relative">
            <div
              ref={mapContainer}
              className="map-container h-[600px] rounded-2xl shadow-2xl border-2 overflow-hidden"
              style={{ 
                width: '100%',
                borderColor: currentTheme.elements.ring
              }}
            />
            
            {/* Colorful Map Overlay Info */}
            <div 
              className="absolute top-4 left-4 backdrop-blur-sm rounded-xl p-4 shadow-xl border-2"
              style={{ 
                background: `linear-gradient(135deg, white, ${currentTheme.elements.surface}05)`,
                borderColor: currentTheme.elements.ring
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent}, #FF6B6B, #4ECDC4)`,
                    backgroundSize: '400% 400%',
                    animation: 'gradientShift 3s ease infinite'
                  }}
                >
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div 
                    className="font-bold text-sm"
                    style={{ color: currentTheme.elements.surface }}
                  >
                    📍 {locationName}
                  </div>
                  <div 
                    className="text-xs font-medium"
                    style={{ color: currentTheme.elements.accent }}
                  >
                    🎯 Service Area
                  </div>
                </div>
              </div>
            </div>

            {/* Colorful Map Controls Info */}
            <div 
              className="absolute bottom-4 right-4 backdrop-blur-sm rounded-xl p-4 shadow-xl border-2"
              style={{ 
                background: `linear-gradient(135deg, white, ${currentTheme.elements.surface}05)`,
                borderColor: currentTheme.elements.ring
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${currentTheme.elements.accent}, #4ECDC4)`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: currentTheme.elements.surface }}>
                    🖱️ Mouse wheel to zoom
                  </div>
                  <div className="text-xs" style={{ color: currentTheme.elements.description }}>
                    🎮 Drag to explore
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CleaningCountryMap;
