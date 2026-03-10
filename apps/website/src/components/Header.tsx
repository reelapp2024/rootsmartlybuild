
import React from 'react';
import { currentTheme } from '../App';

// Import available theme headers
import CleaningHeader from '../themes/cleaning/components/CleaningHeader';
import MulticolorHeader from '../themes/multicolor/components/Header';

const Header = () => {
  switch (currentTheme) {
    case 'cleaning':
      return <CleaningHeader />;
    case 'multicolor':
      return <MulticolorHeader />;
    default:
      return <CleaningHeader />;
  }
};

export default Header;
