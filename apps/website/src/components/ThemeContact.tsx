
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningContact from '../themes/cleaning/pages/CleaningContact';

import MultiColorContact from '../themes/multicolor/pages/Contact'

const ThemeContact = () => {
  const { seoData } = useSEO('/contact');

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningContact />;
                                 case 'multicolor':
        return <MultiColorContact />;
      default:
        return <CleaningContact />;
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

export default ThemeContact;
