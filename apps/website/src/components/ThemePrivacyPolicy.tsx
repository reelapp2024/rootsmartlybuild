
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { currentTheme } from '../App';
import { useSEO } from '../hooks/useSEO';

// Cleaning Theme
import CleaningPrivacyPolicyPage from '../themes/cleaning/pages/CleaningPrivacyPolicy';

import MultiColorPrivacyPolicyPage from '../themes/multicolor/pages/PrivacyPolicy'

const ThemePrivacyPolicy = () => {
  const { seoData } = useSEO('/PrivacyPolicy');

  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'cleaning':
        return <CleaningPrivacyPolicyPage />;
                                   case 'multicolor':
        return <MultiColorPrivacyPolicyPage />;
      default:
        return <MultiColorPrivacyPolicyPage />;
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

export default ThemePrivacyPolicy;
