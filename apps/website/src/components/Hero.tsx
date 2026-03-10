
import React from 'react';
import { currentTheme } from '../App';

// Import available theme heroes
import CleaningHero from '../themes/cleaning/components/CleaningHero';
import MulticolorHero from '../themes/multicolor/components/HeroSection';

const Hero = () => {
  switch (currentTheme) {
    case 'cleaning':
      return <CleaningHero />;
    case 'multicolor':
      return <MulticolorHero />;
    default:
      return <CleaningHero />;
  }
};

export default Hero;
