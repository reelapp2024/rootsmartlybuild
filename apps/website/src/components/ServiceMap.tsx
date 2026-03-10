import React from 'react';
import MapboxMap from './MapboxMap';

interface ServiceMapProps {
  theme: 'cleaning' | 'multicolor';
}

const ServiceMap = ({ theme }: { theme: 'cleaning' | 'multicolor' }) => {
  const locations = [
    {
      name: 'Los Angeles',
      coordinates: { lat: 34.0522, lng: -118.2437 },
      description: 'Downtown service hub with 24/7 emergency response',
      responseTime: '15-30 min'
    },
    {
      name: 'San Francisco',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      description: 'Bay Area operations center',
      responseTime: '20-35 min'
    },
    {
      name: 'San Diego',
      coordinates: { lat: 32.7157, lng: -117.1611 },
      description: 'Southern California regional office',
      responseTime: '25-40 min'
    },
    {
      name: 'Sacramento',
      coordinates: { lat: 38.5767, lng: -121.4687 },
      description: 'Central Valley service center',
      responseTime: '30-45 min'
    },
    {
      name: 'Fresno',
      coordinates: { lat: 36.7378, lng: -119.7871 },
      description: 'Central California operations',
      responseTime: '35-50 min'
    }
  ];

  const themeConfig = {
    plumbing: {
      title: 'Plumbing Service Areas',
      subtitle: 'Professional plumbing services across California with certified professionals and emergency response teams.',
      areaName: 'California'
    },
    hvac: {
      title: 'HVAC Service Areas',
      subtitle: 'Expert heating, ventilation, and air conditioning services throughout California with 24/7 emergency support.',
      areaName: 'California'
    },
    roofing: {
      title: 'Roofing Service Areas',
      subtitle: 'Professional roofing services throughout California with expert installation and repair teams.',
      areaName: 'California'
    },
    painting: {
      title: 'Painting Service Areas',
      subtitle: 'Professional interior and exterior painting services throughout California with expert painters and quality finishes.',
      areaName: 'California'
    },
    cleaning: {
      title: 'Cleaning Service Areas',
      subtitle: 'Professional residential and commercial cleaning services throughout California with eco-friendly products and same-day booking.',
      areaName: 'California'
    }
  };

  const config = themeConfig[theme];

  const getThemeGradient = () => {
    switch (theme) {
      case 'cleaning':
        return 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent';
      case 'multicolor':
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent';
      default:
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent';
    }
  };

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'cleaning':
        return { primary: '#10B981', secondary: '#059669' };
      case 'multicolor':
        return { primary: '#3B82F6', secondary: '#1E40AF' };
      default:
        return { primary: '#3B82F6', secondary: '#1E40AF' };
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${getThemeGradient()}`}>
            {config.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {config.subtitle}
          </p>
        </div>
        
        <MapboxMap
          locations={locations}
          areaName={config.areaName}
          className="h-[600px] rounded-2xl shadow-2xl"
          theme={theme}
        />
      </div>
    </section>
  );
};

export default ServiceMap;
