/**
 * Utility function to get appropriate font size classes based on heading tag level
 * This ensures h1-h6 display with proper size hierarchy
 */
export const getHeadingSizeClass = (headingTag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', baseSize?: string): string => {
  // If baseSize is provided and is a Tailwind class, scale it down for smaller tags
  if (baseSize && baseSize.startsWith('text-') && !baseSize.includes('px') && !baseSize.includes('rem')) {
    const sizeMap: Record<string, string> = {
      'h1': baseSize, // Keep original size for h1
      'h2': baseSize.replace(/text-6xl/g, 'text-5xl').replace(/text-5xl/g, 'text-4xl').replace(/text-4xl/g, 'text-3xl'),
      'h3': baseSize.replace(/text-6xl/g, 'text-4xl').replace(/text-5xl/g, 'text-3xl').replace(/text-4xl/g, 'text-2xl').replace(/text-3xl/g, 'text-2xl'),
      'h4': baseSize.replace(/text-6xl/g, 'text-3xl').replace(/text-5xl/g, 'text-2xl').replace(/text-4xl/g, 'text-xl').replace(/text-3xl/g, 'text-xl'),
      'h5': baseSize.replace(/text-6xl/g, 'text-2xl').replace(/text-5xl/g, 'text-xl').replace(/text-4xl/g, 'text-lg').replace(/text-3xl/g, 'text-lg'),
      'h6': baseSize.replace(/text-6xl/g, 'text-xl').replace(/text-5xl/g, 'text-lg').replace(/text-4xl/g, 'text-base').replace(/text-3xl/g, 'text-base')
    };
    return sizeMap[headingTag] || baseSize;
  }
  
  // Default sizes based on heading level (for sections without custom titleSize)
  const defaultSizes: Record<string, string> = {
    'h1': 'text-4xl md:text-6xl',
    'h2': 'text-3xl md:text-5xl',
    'h3': 'text-2xl md:text-4xl',
    'h4': 'text-xl md:text-3xl',
    'h5': 'text-lg md:text-2xl',
    'h6': 'text-base md:text-xl'
  };
  return defaultSizes[headingTag] || 'text-3xl md:text-4xl';
};
