
import React from 'react';
import { currentTheme } from '../App';

// Import available theme footers
import CleaningFooter from '../themes/cleaning/components/CleaningFooter';
import MulticolorFooter from '../themes/multicolor/components/Footer';

const Footer = () => {
  switch (currentTheme) {
    case 'cleaning':
      return <CleaningFooter />;
    case 'multicolor':
      return <MulticolorFooter />;
    default:
      return <CleaningFooter />;
  }
};

export default Footer;
