
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningServiceDetail from '../themes/cleaning/pages/CleaningServiceDetail';

import MultiColorServiceDetail from '../themes/multicolor/pages/DrainCleaning'

const ThemeServiceDetail = () => {
  const location = useLocation();
  const { seoData } = useSEO(location.pathname);

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningServiceDetail />;
                                 case 'multicolor':
        return <MultiColorServiceDetail />;
      default:
        return <CleaningServiceDetail />;
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>{seoData.meta_title}</title>
        <meta name="description" content={seoData.meta_description} />
        <meta name="keywords" content={seoData.meta_keywords} />
      </Helmet>
      {renderThemeComponent()}
    </HelmetProvider>
  );
};

export default ThemeServiceDetail;
