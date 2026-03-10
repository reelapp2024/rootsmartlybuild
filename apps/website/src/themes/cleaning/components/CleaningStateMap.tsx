
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2pibG9nczIwMjMiLCJhIjoiY21iM2ZmNDQ4MDZ5djJwc2F4MXdvejRjZSJ9.DM8BhznWkYNPO_ty6UFtkQ';

interface CleaningStateMapProps {
  stateName: string;
  countryName: string;
}

const CleaningStateMap = ({ stateName, countryName }: CleaningStateMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Combined state and country coordinates mapping
  const locationCoordinates: { [key: string]: { center: [number, number]; zoom: number } } = {
    // US States
    'california-usa': { center: [-119.4179, 36.7783], zoom: 5 },
    'california-united states': { center: [-119.4179, 36.7783], zoom: 5 },
    'texas-usa': { center: [-99.9018, 31.9686], zoom: 5 },
    'texas-united states': { center: [-99.9018, 31.9686], zoom: 5 },
    'florida-usa': { center: [-82.4572, 27.7663], zoom: 6 },
    'florida-united states': { center: [-82.4572, 27.7663], zoom: 6 },
    'new york-usa': { center: [-74.2179, 43.2994], zoom: 6 },
    'new york-united states': { center: [-74.2179, 43.2994], zoom: 6 },
    
    // Indian States
    'himachal pradesh-india': { center: [77.1734, 31.1048], zoom: 7 },
    'maharashtra-india': { center: [75.7139, 19.7515], zoom: 6 },
    'rajasthan-india': { center: [74.2179, 27.0238], zoom: 6 },
    'uttar pradesh-india': { center: [80.9462, 26.8467], zoom: 6 },
    'kerala-india': { center: [76.2711, 10.8505], zoom: 7 },
    'karnataka-india': { center: [75.7139, 15.3173], zoom: 6 },
    'gujarat-india': { center: [71.1924, 22.2587], zoom: 6 },
    'punjab-india': { center: [75.3412, 31.1471], zoom: 7 },
    'haryana-india': { center: [76.0856, 29.0588], zoom: 7 },
    'delhi-india': { center: [77.1025, 28.7041], zoom: 9 },
    'goa-india': { center: [74.1240, 15.2993], zoom: 9 },
    'assam-india': { center: [92.9376, 26.2006], zoom: 6 },
    'west bengal-india': { center: [87.8550, 22.9868], zoom: 6 },
    'odisha-india': { center: [85.0985, 20.9517], zoom: 6 },
    'tamil nadu-india': { center: [78.6569, 11.1271], zoom: 6 },
    'andhra pradesh-india': { center: [79.7400, 15.9129], zoom: 6 },
    'telangana-india': { center: [79.0193, 18.1124], zoom: 7 },
    'madhya pradesh-india': { center: [78.6569, 22.9734], zoom: 5 },
    'bihar-india': { center: [85.3131, 25.0961], zoom: 6 },
    'jharkhand-india': { center: [85.2799, 23.6102], zoom: 6 },
    'chhattisgarh-india': { center: [81.8661, 21.2787], zoom: 6 },
    
    // Canadian Provinces
    'ontario-canada': { center: [-85.3232, 51.2538], zoom: 4 },
    'quebec-canada': { center: [-71.9928, 52.9399], zoom: 4 },
    'british columbia-canada': { center: [-126.2421, 54.7267], zoom: 4 },
    'alberta-canada': { center: [-113.4909, 53.9333], zoom: 5 },
    'manitoba-canada': { center: [-98.7393, 53.7609], zoom: 5 },
    'saskatchewan-canada': { center: [-106.3468, 52.9399], zoom: 5 },
    
    // UK Countries/Regions
    'england-uk': { center: [-1.1743, 52.3555], zoom: 6 },
    'scotland-uk': { center: [-4.2026, 56.4907], zoom: 6 },
    'wales-uk': { center: [-3.8183, 52.1307], zoom: 7 },
    'northern ireland-uk': { center: [-6.7910, 54.7877], zoom: 8 },
    'england-united kingdom': { center: [-1.1743, 52.3555], zoom: 6 },
    'scotland-united kingdom': { center: [-4.2026, 56.4907], zoom: 6 },
    'wales-united kingdom': { center: [-3.8183, 52.1307], zoom: 7 },
    'northern ireland-united kingdom': { center: [-6.7910, 54.7877], zoom: 8 },
    
    // Australian States
    'new south wales-australia': { center: [146.9211, -32.1656], zoom: 5 },
    'victoria-australia': { center: [144.2085, -36.5986], zoom: 6 },
    'queensland-australia': { center: [142.7028, -22.1646], zoom: 4 },
    'western australia-australia': { center: [121.6283, -25.2834], zoom: 4 },
    'south australia-australia': { center: [135.7781, -30.0002], zoom: 5 },
    'tasmania-australia': { center: [146.6015, -41.6809], zoom: 7 },
    
    // Afghan Provinces
    'badakhshan-afghanistan': { center: [70.8133, 37.1348], zoom: 7 },
    'balkh-afghanistan': { center: [66.8979, 36.7581], zoom: 7 },
    'kandahar-afghanistan': { center: [65.7372, 31.6295], zoom: 7 },
    'herat-afghanistan': { center: [62.2079, 34.3482], zoom: 7 },
    'nangarhar-afghanistan': { center: [70.1419, 34.1715], zoom: 7 }
  };

  // Country fallback coordinates
  const countryFallbacks: { [key: string]: { center: [number, number]; zoom: number } } = {
    'usa': { center: [-95.7129, 37.0902], zoom: 3 },
    'united states': { center: [-95.7129, 37.0902], zoom: 3 },
    'canada': { center: [-106.3468, 56.1304], zoom: 3 },
    'uk': { center: [-3.4360, 55.3781], zoom: 5 },
    'united kingdom': { center: [-3.4360, 55.3781], zoom: 5 },
    'australia': { center: [133.7751, -25.2744], zoom: 4 },
    'india': { center: [78.9629, 20.5937], zoom: 4 },
    'afghanistan': { center: [67.7090, 33.9391], zoom: 6 }
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
        // Create lookup key for state-country combination
        const normalizedState = stateName.toLowerCase().trim();
        const normalizedCountry = countryName.toLowerCase().trim();
        const lookupKey = `${normalizedState}-${normalizedCountry}`;
        
        console.log('Looking for location:', lookupKey);
        
        // Try to find specific state-country combination first
        let locationData = locationCoordinates[lookupKey];
        
        // If not found, try country fallback
        if (!locationData) {
          locationData = countryFallbacks[normalizedCountry];
          console.log('Using country fallback for:', normalizedCountry);
        }
        
        // Final fallback to world view
        if (!locationData) {
          locationData = { center: [0, 20], zoom: 2 };
          console.log('Using world fallback');
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: locationData.center,
          zoom: locationData.zoom,
          scrollZoom: true
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          setIsMapReady(true);
          
          // Add a marker for the state center
          const el = document.createElement('div');
          el.className = 'state-marker';
          el.style.width = '40px';
          el.style.height = '40px';
          el.style.borderRadius = '50%';
          el.style.background = '#10B981';
          el.style.border = '4px solid white';
          el.style.cursor = 'pointer';
          el.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.innerHTML = '🏠';

          // Create popup for the state
          const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
            .setHTML(`
              <div style="padding: 15px; min-width: 250px;">
                <h4 style="margin: 0 0 10px 0; font-weight: bold; color: #10B981; font-size: 18px;">${stateName}, ${countryName}</h4>
                <p style="margin: 0 0 8px 0; color: #666;">Professional cleaning services available in ${stateName}, ${countryName}</p>
                <p style="margin: 0; font-weight: bold; color: #059669;">✓ Licensed & Insured</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #059669;">✓ 24/7 Emergency Service</p>
              </div>
            `);

          // Add marker to map
          new mapboxgl.Marker(el)
            .setLngLat(locationData.center)
            .setPopup(popup)
            .addTo(map.current!);
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [stateName, countryName]);

  return (
    <section className="py-20 bg-gray-50 font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
            Our Service Coverage in {stateName}, {countryName}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive cleaning service coverage across {stateName}, {countryName}. We're committed to providing professional cleaning solutions in your area.
          </p>
        </div>
        
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="map-container h-[500px] rounded-2xl shadow-2xl border border-gray-200" 
            style={{ width: '100%' }} 
          />
          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
              <div className="text-gray-500">Loading map...</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CleaningStateMap;
