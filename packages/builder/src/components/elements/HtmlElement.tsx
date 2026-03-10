'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Element } from '../../types/builder';
import { buildBoxShadow, buildBorderStyle } from '../../utils/helpers';

interface HtmlElementProps {
  element: Element;
  builderMode?: boolean;
  currentElementStyles?: any;
  activeBreakpoint?: 'desktop' | 'tablet' | 'mobile';
}

function HtmlElement({ 
  element, 
  builderMode = false, 
  currentElementStyles = {},
  activeBreakpoint = 'desktop'
}: HtmlElementProps) {
  const styles = currentElementStyles || element.styles || {};
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(!styles.htmlLazyLoad);

  // Get HTML code based on breakpoint
  const getHtmlCode = () => {
    if (activeBreakpoint === 'mobile' && element.content.htmlCodeMobile) {
      return element.content.htmlCodeMobile;
    }
    if (activeBreakpoint === 'tablet' && element.content.htmlCodeTablet) {
      return element.content.htmlCodeTablet;
    }
    if (element.content.htmlCodeDesktop) {
      return element.content.htmlCodeDesktop;
    }
    return element.content.htmlCode || '<p>Enter HTML code in settings</p>';
  };

  // Sanitize HTML (basic sanitization)
  const sanitizeHtml = (html: string): string => {
    if (styles.htmlSanitize === false) {
      return html;
    }

    // Remove script tags if not allowed
    if (!styles.htmlAllowScripts) {
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      html = html.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
      html = html.replace(/on\w+='[^']*'/gi, ''); // Remove event handlers with single quotes
      html = html.replace(/javascript:/gi, ''); // Remove javascript: protocol
    }

    return html;
  };

  // Process HTML: sanitize and defer scripts
  const processHtml = (html: string): string => {
    let processed = sanitizeHtml(html);
    
    // Add defer to script tags if enabled
    if (styles.htmlDeferScripts) {
      processed = processed.replace(/<script(?![^>]*defer)([^>]*)>/gi, '<script$1 defer>');
    }
    
    return processed;
  };

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (styles.htmlLazyLoad && !shouldLoad && containerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setShouldLoad(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [styles.htmlLazyLoad, shouldLoad]);

  const htmlCode = shouldLoad ? processHtml(getHtmlCode()) : '';
  
  const containerStyle: React.CSSProperties = {
    width: styles.htmlWidth,
    height: styles.htmlHeight,
    minWidth: styles.htmlMinWidth,
    maxWidth: styles.htmlMaxWidth,
    minHeight: styles.htmlMinHeight,
    maxHeight: styles.htmlMaxHeight,
    overflow: styles.htmlOverflow,
    overflowX: styles.htmlOverflowX,
    overflowY: styles.htmlOverflowY,
    textAlign: styles.htmlAlignment,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: styles.htmlVerticalAlign === 'middle' ? 'center' : 
                    styles.htmlVerticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
    backgroundColor: styles.backgroundColor || 'transparent',
    backgroundImage: styles.backgroundImage 
      ? (styles.backgroundImage.startsWith('linear-gradient') || styles.backgroundImage.startsWith('radial-gradient'))
        ? styles.backgroundImage
        : `url(${styles.backgroundImage})`
      : undefined,
    backgroundSize: styles.backgroundImage && !styles.backgroundImage.startsWith('linear-gradient') && !styles.backgroundImage.startsWith('radial-gradient') ? 'cover' : undefined,
    backgroundPosition: styles.backgroundImage && !styles.backgroundImage.startsWith('linear-gradient') && !styles.backgroundImage.startsWith('radial-gradient') ? 'center' : undefined,
    backgroundRepeat: styles.backgroundImage && !styles.backgroundImage.startsWith('linear-gradient') && !styles.backgroundImage.startsWith('radial-gradient') ? 'no-repeat' : undefined,
    borderRadius: styles.borderRadius,
    ...buildBorderStyle(styles),
    boxShadow: buildBoxShadow(styles),
  };
  
  return (
    <div
      ref={containerRef}
      className={`w-full ${builderMode ? '[&>*]:pointer-events-none' : ''}`}
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: htmlCode }}
    />
  );
}

export default React.memo(HtmlElement);


