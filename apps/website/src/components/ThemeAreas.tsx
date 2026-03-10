
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningAreas from '../themes/cleaning/pages/CleaningAreas';

import MultiColorAreas from '../themes/multicolor/pages/Areas'

const ThemeAreas = () => {
  const { seoData } = useSEO('/areas');

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningAreas />;
                                 case 'multicolor':
        return <MultiColorAreas />;
      default:
        return <CleaningAreas />;
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

export default ThemeAreas;
