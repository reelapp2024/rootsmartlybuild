import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const getZoomLevel = (pageType) => {
  switch (pageType) {
    case 'country': return 3;
    case 'state': return 7;
    case 'city': return 10;
    case 'local_area': return 13;
    default: return 8;
  }
};

// Load token from ENV
const MAPBOX_TOKEN =  import.meta.env.VITE_MAPBOX_TOKEN;

const MapSection = ({
  locationName = 'Service Area',
  lat,
  lng,
  pageType = 'country'
}) => {

  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {

    let map;
    let mapboxgl;
    let mounted = true;

    const loadMap = async () => {

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

        map.on('load', () => {

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

        });

        map.addControl(
          new mapboxgl.default.NavigationControl({ visualizePitch: true }),
          'top-right'
        );

        const markerEl = document.createElement('div');

        markerEl.style.width = '60px';
        markerEl.style.height = '60px';
        markerEl.style.background = `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`;
        markerEl.style.borderRadius = '50%';
        markerEl.style.boxShadow = `0 10px 30px ${colors.primaryButton.bg}40`;
        markerEl.style.display = 'flex';
        markerEl.style.alignItems = 'center';
        markerEl.style.justifyContent = 'center';
        markerEl.style.color = 'white';
        markerEl.style.fontSize = '28px';
        markerEl.style.border = '4px solid white';
        markerEl.innerHTML = '📍';

        new mapboxgl.default.Marker(markerEl)
          .setLngLat([lng, lat])
          .addTo(map);
      }

    };

    loadMap();

    return () => {
      mounted = false;
      if (map) map.remove();
    };

  }, [lat, lng, locationName, pageType, colors]);

  if (lat == null || lng == null) return null;

  return (
    <section className="py-16 bg-white">

      <div className="container mx-auto px-4 sm:px-8 lg:px-16">

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Interactive Service Map
          </h2>
          <p className="text-gray-600 mt-4">
            Find our service location and coverage area.
          </p>
        </div>

        <div
          ref={mapRef}
          className="w-full h-[500px] rounded-3xl shadow-2xl overflow-hidden"
        />

      </div>

    </section>
  );
};

export default MapSection;