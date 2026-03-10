
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningTermsConditionsPage from '../themes/cleaning/pages/CleaningTermsConditions';

import MultiColorTermsConditionsPage from '../themes/multicolor/pages/TermsConditons'

const ThemeTermsConditions = () => {
  const { seoData } = useSEO('/TermsConditions');

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningTermsConditionsPage />;
                                   case 'multicolor':
        return <MultiColorTermsConditionsPage />;
      default:
        return <MultiColorTermsConditionsPage />;
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

export default ThemeTermsConditions;
