
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningServicesPage from '../themes/cleaning/pages/CleaningServices';

import MultiColorServicesPage from '../themes/multicolor/pages/Services'

const ThemeServices = () => {
  const { seoData } = useSEO('/services');

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningServicesPage />;
                                   case 'multicolor':
        return <MultiColorServicesPage />;
      default:
        return <CleaningServicesPage />;
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

export default ThemeServices;
