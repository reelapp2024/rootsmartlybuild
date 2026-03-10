
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningAreaDetail from '../themes/cleaning/pages/CleaningAreaDetail';

// Removed deleted theme imports

import MultiColorAreaDetail from '../themes/multicolor/pages/AreaDetail'

const ThemeAreaDetail = () => {
  const location = useLocation();
  const { seoData } = useSEO(location.pathname);

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningAreaDetail />;
                                 case 'multicolor':
        return <MultiColorAreaDetail />;
      default:
        return <CleaningAreaDetail />;
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

export default ThemeAreaDetail;
