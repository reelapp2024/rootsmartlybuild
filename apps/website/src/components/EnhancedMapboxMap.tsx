import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Phone, MapPin, Navigation } from 'lucide-react';

interface ServiceArea {
  name: string;
  coordinates: [number, number];
  radius: number;
  color: string;
}

interface EnhancedMapboxMapProps {
  className?: string;
}

const EnhancedMapboxMap = ({ className = "h-[600px]" }: EnhancedMapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState('pk.eyJ1Ijoic2pibG9nczIwMjMiLCJhIjoiY21iM2ZmNDQ4MDZ5djJwc2F4MXdvejRjZSJ9.DM8BhznWkYNPO_ty6UFtkQ');

  const serviceAreas: ServiceArea[] = [
    {
      name: 'Downtown Metro',
      coordinates: [-74.006, 40.7128],
      radius: 2000,
      color: '#22c55e'
    },
    {
      name: 'North Hills',
      coordinates: [-73.996, 40.7228],
      radius: 1800,
      color: '#3b82f6'
    },
    {
      name: 'Westside District',
      coordinates: [-74.016, 40.7078],
      radius: 2200,
      color: '#f59e0b'
    },
    {
      name: 'East Valley',
      coordinates: [-73.986, 40.7178],
      radius: 1900,
      color: '#ef4444'
    },
    {
      name: 'South Bay Area',
      coordinates: [-74.001, 40.7028],
      radius: 2100,
      color: '#8b5cf6'
    }
  ];

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 40.7128],
      zoom: 11,
      pitch: 30,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      // Add service area circles
      serviceAreas.forEach((area, index) => {
        const sourceId = `service-area-${index}`;
        const layerId = `service-area-layer-${index}`;

        // Create circle data
        const circleData = {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: area.coordinates
          },
          properties: {
            name: area.name,
            radius: area.radius
          }
        };

        map.current?.addSource(sourceId, {
          type: 'geojson',
          data: circleData
        });

        // Add circle layer
        map.current?.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': {
              stops: [
                [10, area.radius / 200],
                [15, area.radius / 100]
              ]
            },
            'circle-color': area.color,
            'circle-opacity': 0.3,
            'circle-stroke-color': area.color,
            'circle-stroke-width': 2
          }
        });

        // Add marker with custom popup
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.innerHTML = `
          <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform duration-200">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
            </svg>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          className: 'custom-popup'
        }).setHTML(`
          <div class="p-4 font-poppins">
            <h3 class="font-bold text-lg text-gray-800 mb-2">${area.name}</h3>
            <p class="text-gray-600 mb-3">Professional service area</p>
            <div class="flex gap-2">
              <a href="tel:5551234567" class="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                </svg>
                Call Now
              </a>
              <a href="/areas/${area.name.toLowerCase().replace(/\s+/g, '-')}" class="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
                Details
              </a>
            </div>
          </div>
        `);

        new mapboxgl.Marker(markerEl)
          .setLngLat(area.coordinates)
          .setPopup(popup)
          .addTo(map.current!);

        // Click events
        map.current?.on('click', layerId, (e) => {
          setSelectedArea(area.name);
          map.current?.flyTo({
            center: area.coordinates,
            zoom: 13,
            pitch: 45
          });
        });

        map.current?.on('mouseenter', layerId, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current?.on('mouseleave', layerId, () => {
          map.current!.getCanvas().style.cursor = '';
        });
      });

      // Add main office marker
      const officeMarker = document.createElement('div');
      officeMarker.innerHTML = `
        <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-pulse">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"></path>
          </svg>
        </div>
      `;

      const officePopup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`
        <div class="p-4 font-poppins">
          <h3 class="font-bold text-lg text-gray-800 mb-2">🏢 Main Office</h3>
          <p class="text-gray-600 mb-3">Our headquarters & dispatch center</p>
          <div class="space-y-2">
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
              </svg>
              123 Business Ave, New York, NY
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
              (555) 123-4567
            </div>
            <a href="tel:5551234567" class="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors mt-3">
              📞 Call Our Office
            </a>
          </div>
        </div>
      `);

      new mapboxgl.Marker(officeMarker)
        .setLngLat([-74.006, 40.7128])
        .setPopup(officePopup)
        .addTo(map.current!);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  return (
    <div className={`relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs z-10">
        <div className="flex items-center mb-3">
          <MapPin className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="font-bold text-gray-800 font-poppins">Service Areas</h3>
        </div>
        
        {selectedArea ? (
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-1">Selected Area:</div>
            <div className="font-semibold text-blue-600">{selectedArea}</div>
          </div>
        ) : null}

        <div className="space-y-2 mb-3">
          {serviceAreas.slice(0, 3).map((area, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedArea(area.name);
                map.current?.flyTo({
                  center: area.coordinates,
                  zoom: 13,
                  pitch: 45
                });
              }}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 rounded-md transition-colors duration-200 flex items-center"
            >
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: area.color }}
              ></div>
              {area.name}
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-200">
          <a 
            href="tel:5551234567"
            className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 w-full"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Now: (555) 123-4567
          </a>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
        <div className="text-sm font-semibold text-gray-800 mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Main Office</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Service Areas</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="absolute top-4 right-4 space-y-2 z-10">
        <button
          onClick={() => {
            map.current?.flyTo({
              center: [-74.006, 40.7128],
              zoom: 11,
              pitch: 30
            });
            setSelectedArea(null);
          }}
          className="bg-white/95 hover:bg-white p-2 rounded-lg shadow-lg transition-colors duration-200"
          title="Reset View"
        >
          <Navigation className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default EnhancedMapboxMap;
