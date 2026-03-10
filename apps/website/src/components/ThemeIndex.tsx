
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningIndex from '../themes/cleaning/pages/CleaningIndex';

import MulticolorIndex from '../themes/multicolor/pages/Index'

// Modern Theme
import ModernIndex from '../themes/modern/pages/Index'
import '../themes/modern/index.css' // Import modern theme CSS

const ThemeIndex = () => {
  const { seoData } = useSEO('/home');

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningIndex />;
      case 'multicolor':
        return <MulticolorIndex />;
      case 'modern':
        return <ModernIndex />;
      default:
        return <CleaningIndex />;
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

export default ThemeIndex;
