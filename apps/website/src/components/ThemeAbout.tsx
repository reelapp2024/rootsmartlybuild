
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningAbout from '../themes/cleaning/pages/CleaningAbout';

// Multicolor Theme

import MultiColorAbout from '../themes/multicolor/pages/About'

const ThemeAbout = () => {
  const { seoData } = useSEO('/about');

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningAbout />;
                                  case 'multicolor':
        return <MultiColorAbout />;
      default:
        return <CleaningAbout />;
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

export default ThemeAbout;
