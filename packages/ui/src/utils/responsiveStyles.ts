import React from 'react';

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

/**
 * Generate responsive CSS with media queries
 * Returns a style object with CSS custom properties and media query classes
 */
export function addResponsiveStyles(
  baseStyles: React.CSSProperties,
  elementType?: string
): React.CSSProperties & { className?: string } {
  // Base responsive styles that apply to all elements
  const responsiveBase: React.CSSProperties = {
    maxWidth: '100%',
    boxSizing: 'border-box',
    width: baseStyles.width === '100%' ? '100%' : undefined,
  };

  // Text-specific responsive styles
  const textResponsive: React.CSSProperties = 
    (elementType === 'text' || elementType === 'heading' || 
     elementType === 'label' || elementType === 'badge' || elementType === 'link') ? {
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      wordBreak: 'break-word' as const,
      hyphens: 'auto' as const,
    } : {};

  // Image-specific responsive styles
  const imageResponsive: React.CSSProperties = 
    elementType === 'image' ? {
      height: 'auto',
      maxWidth: '100%',
      objectFit: 'contain' as const,
    } : {};

  // Container-specific responsive styles
  const containerResponsive: React.CSSProperties = 
    (elementType === 'container' || elementType === 'row' || elementType === 'column') ? {
      width: '100%',
      maxWidth: '100%',
    } : {};

  const result = {
    ...responsiveBase,
    ...textResponsive,
    ...imageResponsive,
    ...containerResponsive,
    ...baseStyles,
  };
  
  // For headings, remove fontSize to let browser defaults handle it
  if (elementType === 'heading') {
    delete result.fontSize;
    delete (result as any).headingFontSize;
  }
  
  return result;
}

/**
 * Generate responsive font size that scales down on mobile
 */
export function getResponsiveFontSize(
  baseSize: string | number,
  mobileScale: number = 0.75,
  tabletScale: number = 0.875
): string {
  const base = typeof baseSize === 'string' 
    ? parseFloat(baseSize.replace(/[^\d.]/g, '')) 
    : baseSize;
  const unit = typeof baseSize === 'string' 
    ? baseSize.replace(/[\d.]/g, '') || 'px'
    : 'px';

  // Use CSS clamp for fluid typography
  const mobileSize = base * mobileScale;
  const tabletSize = base * tabletScale;
  
  // Clamp between mobile and desktop sizes
  return `clamp(${mobileSize}${unit}, ${tabletSize}${unit} + 1vw, ${base}${unit})`;
}

/**
 * Generate responsive padding that scales down on mobile
 */
export function getResponsivePadding(
  basePadding: string | number,
  mobileScale: number = 0.5,
  tabletScale: number = 0.75
): string {
  if (typeof basePadding === 'string' && basePadding.includes(' ')) {
    // Handle multiple values (e.g., "20px 40px")
    const parts = basePadding.split(' ').map(p => {
      const num = parseFloat(p.replace(/[^\d.]/g, ''));
      const unit = p.replace(/[\d.]/g, '') || 'px';
      if (isNaN(num)) return p;
      return `${num * mobileScale}${unit}`;
    });
    return parts.join(' ');
  }

  const base = typeof basePadding === 'string' 
    ? parseFloat(basePadding.replace(/[^\d.]/g, '')) 
    : basePadding;
  const unit = typeof basePadding === 'string' 
    ? basePadding.replace(/[\d.]/g, '') || 'px'
    : 'px';

  if (isNaN(base)) return String(basePadding);

  const mobilePadding = base * mobileScale;
  return `${mobilePadding}${unit}`;
}

/**
 * Generate responsive gap that scales down on mobile
 */
export function getResponsiveGap(
  baseGap: string | number,
  mobileScale: number = 0.75
): string {
  const base = typeof baseGap === 'string' 
    ? parseFloat(baseGap.replace(/[^\d.]/g, '')) 
    : baseGap;
  const unit = typeof baseGap === 'string' 
    ? baseGap.replace(/[\d.]/g, '') || 'px'
    : 'px';

  if (isNaN(base)) return String(baseGap);

  const mobileGap = base * mobileScale;
  return `${mobileGap}${unit}`;
}

/**
 * Generate responsive grid columns that stack on mobile
 */
export function getResponsiveGridColumns(
  desktopColumns: string,
  tabletColumns?: string,
  mobileColumns: string = '1'
): string {
  // If it's already a responsive value (contains repeat or auto), return as-is
  if (desktopColumns.includes('repeat') || desktopColumns.includes('auto')) {
    return desktopColumns;
  }

  // Extract number of columns
  const match = desktopColumns.match(/(\d+)/);
  if (!match) return desktopColumns;

  const desktopCols = parseInt(match[1], 10);
  const tabletCols = tabletColumns ? parseInt(tabletColumns, 10) : Math.min(desktopCols, 2);
  const mobileCols = parseInt(mobileColumns, 10);

  // Use CSS Grid with auto-fit for responsive behavior
  // On mobile: 1 column, tablet: 2 columns (or specified), desktop: original
  return `repeat(${mobileCols}, 1fr)`;
}

/**
 * Generate responsive styles object with mobile-first approach
 */
export function generateResponsiveStyles(options: {
  fontSize?: string | number;
  padding?: string | number;
  margin?: string | number;
  gap?: string | number;
  gridColumns?: string;
  width?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
}): React.CSSProperties {
  const {
    fontSize,
    padding,
    margin,
    gap,
    gridColumns,
    width,
    maxWidth,
    minHeight,
  } = options;

  const styles: React.CSSProperties = {};

  if (fontSize) {
    styles.fontSize = getResponsiveFontSize(fontSize);
  }

  if (padding) {
    styles.padding = getResponsivePadding(padding);
  }

  if (margin) {
    styles.margin = getResponsivePadding(margin);
  }

  if (gap) {
    styles.gap = getResponsiveGap(gap);
  }

  if (gridColumns) {
    styles.gridTemplateColumns = getResponsiveGridColumns(gridColumns);
  }

  if (width) {
    styles.width = typeof width === 'string' ? width : `${width}px`;
  }

  if (maxWidth) {
    styles.maxWidth = typeof maxWidth === 'string' ? maxWidth : `${maxWidth}px`;
  }

  if (minHeight) {
    // Min height should be smaller on mobile
    const base = typeof minHeight === 'string' 
      ? parseFloat(minHeight.replace(/[^\d.]/g, '')) 
      : minHeight;
    const unit = typeof minHeight === 'string' 
      ? minHeight.replace(/[\d.]/g, '') || 'px'
      : 'px';
    
    if (!isNaN(base)) {
      styles.minHeight = `clamp(${base * 0.6}${unit}, ${base * 0.8}${unit} + 2vh, ${base}${unit})`;
    } else {
      styles.minHeight = String(minHeight);
    }
  }

  return styles;
}

