'use client';

import GenieBuildPageRenderer from '../components/GenieBuildPageRenderer';
import { INITIAL_TEMPLATE } from '@geniebuild/constants';

/**
 * Genie Page - Shows GenieBuild's default homepage sections
 * Uses INITIAL_TEMPLATE from GenieBuild constants.tsx
 * This ensures exact same sections, styles, text, and designs as GenieBuild homepage
 */
export default function GeniePage() {
  // Extract sections and global colors from INITIAL_TEMPLATE (same as GenieBuild uses)
  const sections = INITIAL_TEMPLATE.sections;
  const globalColors = {
    backgroundColor: INITIAL_TEMPLATE.globalStyles.colors.backgroundColor,
    textColor: INITIAL_TEMPLATE.globalStyles.colors.textColor,
    titleColor: INITIAL_TEMPLATE.globalStyles.colors.titleColor,
    accentColor: INITIAL_TEMPLATE.globalStyles.colors.accentColor,
    buttonBackgroundColor: INITIAL_TEMPLATE.globalStyles.colors.buttonBackgroundColor,
    buttonTextColor: INITIAL_TEMPLATE.globalStyles.colors.buttonTextColor
  };

  return (
    <GenieBuildPageRenderer 
      sections={sections} 
      globalColors={globalColors}
    />
  );
}
