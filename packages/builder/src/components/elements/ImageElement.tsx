'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Element } from '../../types/builder';

interface ImageElementProps {
  element: Element;
  builderMode?: boolean;
  activeBreakpoint?: 'desktop' | 'tablet' | 'mobile';
  currentElementStyles?: any;
}

function ImageElement({ 
  element, 
  builderMode = false,
  activeBreakpoint = 'desktop',
  currentElementStyles = {}
}: ImageElementProps) {
  const styles = currentElementStyles || element.styles || {};
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(!styles.imageLazyLoad);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get image URL based on breakpoint
  const getImageUrl = () => {
    if (activeBreakpoint === 'mobile' && element.content.imageUrlMobile) {
      return element.content.imageUrlMobile;
    }
    if (activeBreakpoint === 'tablet' && element.content.imageUrlTablet) {
      return element.content.imageUrlTablet;
    }
    if (element.content.imageUrlDesktop) {
      return element.content.imageUrlDesktop;
    }
    return element.content.imageUrl || '';
  };

  const imageUrl = getImageUrl();
  const altText = element.content.imageAlt || '';
  const caption = element.content.imageCaption || '';
  const imageLink = element.content.imageLink || '';

  // Get aspect ratio class
  const getAspectRatioClass = (ratio?: string) => {
    if (ratio === 'original' || ratio === 'custom') return '';
    switch (ratio) {
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      case '21:9': return 'aspect-[21/9]';
      case '9:16': return 'aspect-[9/16]';
      default: return 'aspect-video';
    }
  };

  // Get alignment class
  const getAlignmentClass = (alignment?: string) => {
    switch (alignment) {
      case 'left': return 'mx-0 mr-auto';
      case 'right': return 'mx-0 ml-auto';
      case 'center': return 'mx-auto';
      case 'full': return 'w-full';
      default: return '';
    }
  };

  // Build filter string
  const buildFilter = () => {
    const filters: string[] = [];
    if (styles.imageFilterGrayscale) filters.push(`grayscale(${styles.imageFilterGrayscale})`);
    if (styles.imageFilterBlur) filters.push(`blur(${styles.imageFilterBlur})`);
    if (styles.imageFilterBrightness) filters.push(`brightness(${styles.imageFilterBrightness})`);
    if (styles.imageFilterContrast) filters.push(`contrast(${styles.imageFilterContrast})`);
    if (styles.imageFilterSaturate) filters.push(`saturate(${styles.imageFilterSaturate})`);
    if (styles.imageFilter) filters.push(styles.imageFilter);
    return filters.length > 0 ? filters.join(' ') : undefined;
  };

  // Build hover filter string
  const buildHoverFilter = () => {
    if (styles.imageHoverFilter) return styles.imageHoverFilter;
    return undefined;
  };

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (styles.imageLazyLoad && !shouldLoad && containerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [styles.imageLazyLoad, shouldLoad]);

  // Get responsive values based on breakpoint
  const getResponsiveValue = (desktop: string | undefined, tablet: string | undefined, mobile: string | undefined) => {
    if (activeBreakpoint === 'mobile' && mobile) return mobile;
    if (activeBreakpoint === 'tablet' && tablet) return tablet;
    return desktop;
  };

  const aspectRatio = styles.imageAspectRatio || '16:9';
  const objectFit = (getResponsiveValue(
    styles.imageObjectFit || 'cover',
    styles.imageObjectFitTablet,
    styles.imageObjectFitMobile
  ) || 'cover') as 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  const objectPosition = styles.imageObjectPosition || 'center';
  const alignment = getResponsiveValue(
    styles.imageAlignment || 'left',
    styles.imageAlignmentTablet,
    styles.imageAlignmentMobile
  ) || 'left';
  const opacity = styles.imageOpacity || '1';
  const hoverOpacity = styles.imageHoverOpacity;
  const hoverScale = styles.imageHoverScale;
  const transitionDuration = styles.imageTransitionDuration || '0.3s';
  const filter = buildFilter();
  const hoverFilter = buildHoverFilter();

  // Get responsive dimensions
  const imageWidth = getResponsiveValue(
    styles.imageWidth,
    styles.imageWidthTablet,
    styles.imageWidthMobile
  );
  const imageHeight = getResponsiveValue(
    styles.imageHeight,
    styles.imageHeightTablet,
    styles.imageHeightMobile
  );

  // Container styles
  const containerStyle: React.CSSProperties = {
    width: imageWidth || (alignment === 'full' ? '100%' : undefined),
    minWidth: styles.imageMinWidth,
    maxWidth: styles.imageMaxWidth,
    minHeight: styles.imageMinHeight,
    maxHeight: styles.imageMaxHeight,
    opacity: opacity,
    filter: filter,
    transition: transitionDuration ? `all ${transitionDuration}` : undefined,
    backgroundColor: styles.imagePlaceholderColor || undefined,
  };

  // Image wrapper styles (for aspect ratio and object positioning)
  const imageWrapperStyle: React.CSSProperties = {
    objectFit: objectFit,
    objectPosition: objectPosition === 'custom' 
      ? `${styles.imageObjectPositionX || '50%'} ${styles.imageObjectPositionY || '50%'}`
      : objectPosition,
  };

  // Overlay styles
  const overlayText = styles.imageOverlayText;
  const overlayColor = styles.imageOverlayColor || 'transparent';
  const overlayOpacity = styles.imageOverlayOpacity || '0.5';
  const overlayPosition = styles.imageOverlayPosition || 'center';
  
  const getOverlayPositionClass = () => {
    switch (overlayPosition) {
      case 'top': return 'top-0';
      case 'bottom': return 'bottom-0';
      default: return 'top-1/2 -translate-y-1/2';
    }
  };

  // Hover styles (applied via className with CSS)
  const hoverStyles: React.CSSProperties = {};
  if (hoverOpacity) hoverStyles.opacity = hoverOpacity;
  if (hoverScale) hoverStyles.transform = `scale(${hoverScale})`;
  if (hoverFilter) hoverStyles.filter = hoverFilter;

  const aspectRatioClass = getAspectRatioClass(aspectRatio);
  const alignmentClass = getAlignmentClass(alignment);

  // Generate unique ID for this image instance for hover styles
  const imageId = `image-${element.id}`;
  const hasHoverEffects = !builderMode && (hoverOpacity || hoverScale || hoverFilter);

  // Placeholder image
  const placeholderUrl = styles.imagePlaceholder;
  const showPlaceholder = placeholderUrl && !imageLoaded;
  const blurPlaceholder = styles.imageBlurPlaceholder;

  // If no image URL, show placeholder in builder mode, nothing in preview
  if (!imageUrl) {
    if (builderMode) {
      return (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">No image selected</p>
            <p className="text-xs text-gray-400">Add image URL or upload an image</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const imageComponent = (
    <>
      {hasHoverEffects && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .${imageId}:hover {
              opacity: ${hoverOpacity || opacity} !important;
              transform: ${hoverScale ? `scale(${hoverScale})` : 'none'} !important;
              filter: ${hoverFilter || filter || 'none'} !important;
            }
          `
        }} />
      )}
      <div 
        ref={containerRef}
        className={`relative ${aspectRatioClass} rounded-lg overflow-hidden ${alignmentClass} ${imageId}`}
        style={containerStyle}
      >
        {/* Placeholder */}
        {showPlaceholder && (
          <div className="absolute inset-0 z-10">
            <img
              src={placeholderUrl}
              alt=""
              className={`w-full h-full object-cover ${blurPlaceholder ? 'blur-sm' : ''}`}
              style={{ position: 'absolute', inset: 0 }}
            />
          </div>
        )}
        
        {/* Main Image */}
        {aspectRatio === 'original' || aspectRatio === 'custom' ? (
          <img
            src={shouldLoad ? imageUrl : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'}
            alt={altText}
            width={imageWidth ? parseInt(imageWidth) : undefined}
            height={imageHeight ? parseInt(imageHeight) : undefined}
            className="w-full h-auto"
            style={{
              ...imageWrapperStyle,
              ...(builderMode ? { pointerEvents: 'none' } : {}),
              ...(showPlaceholder ? { opacity: 0 } : {}),
            }}
            onLoad={() => setImageLoaded(true)}
            loading={styles.imageLazyLoad ? 'lazy' : 'eager'}
          />
        ) : (
          <img
            src={shouldLoad ? imageUrl : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'}
            alt={altText}
            className="w-full h-full object-cover"
            style={{
              ...imageWrapperStyle,
              position: 'absolute',
              inset: 0,
              ...(builderMode ? { pointerEvents: 'none' } : {}),
              ...(showPlaceholder ? { opacity: 0 } : {}),
            }}
            onLoad={() => setImageLoaded(true)}
            loading={styles.imageLazyLoad ? 'lazy' : 'eager'}
          />
        )}

        {/* Overlay */}
        {overlayText && overlayColor !== 'transparent' && (
          <div 
            className={`absolute left-0 right-0 ${getOverlayPositionClass()} z-20 flex items-center justify-center p-4`}
            style={{
              backgroundColor: overlayColor,
              opacity: overlayOpacity,
            }}
          >
            <p className="text-white font-medium text-center">{overlayText}</p>
          </div>
        )}
      </div>
    </>
  );

  // Wrap in link if imageLink is provided and not in builder mode
  if (imageLink && !builderMode) {
    return (
      <div>
        <a 
          href={imageLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          {imageComponent}
        </a>
        {caption && (
          <p className="text-sm text-gray-600 mt-2 text-center">{caption}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {imageComponent}
      {caption && (
        <p className="text-sm text-gray-600 mt-2 text-center">{caption}</p>
      )}
    </div>
  );
}

export default React.memo(ImageElement);


