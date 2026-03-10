
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRESET_FONTS } from '../constants';

interface PreviewFrameProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({ children, className, style }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  // INJECT GOOGLE FONTS INTO IFRAME IN REAL-TIME
  useEffect(() => {
    const iframe = frameRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;
      // Check if already injected to prevent duplicates
      if (!iframeDoc.getElementById('geniebuild-fonts')) {
        const fontFamilies = PRESET_FONTS.map(f => f.name.replace(/\s+/g, '+') + ':wght@300;400;700;900');
        const url = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;
        
        const link = iframeDoc.createElement('link');
        link.id = 'geniebuild-fonts';
        link.rel = 'stylesheet';
        link.href = url;
        iframeDoc.head.appendChild(link);
      }
    };
    
    // Run immediately if already loaded, otherwise wait for load
    if (iframe.contentDocument?.readyState === 'complete') {
      handleLoad();
      return;
    } else {
      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [mountNode]); // Re-inject if the HTML completely resets

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    // We need to wait for the frame to load to access contentDocument
    const handleLoad = () => {
        const doc = frame.contentDocument;
        if (!doc) return;

        // Prevent flash of unstyled content or white background
        // Use device-width for proper responsive behavior (not fixed pixel width)
        doc.open();
        doc.write('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"></head><body><div id="frame-root"></div></body></html>');
        doc.close();
        
        // Inject Tailwind
        const script = doc.createElement('script');
        script.src = "https://cdn.tailwindcss.com";
        doc.head.appendChild(script);

        // Inject Fonts & Icons from main document
        const links = document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], style');
        links.forEach(link => {
            // Clone and append
            doc.head.appendChild(link.cloneNode(true));
        });
        
        // Base Styles
        const styleEl = doc.createElement('style');
        styleEl.textContent = `
            html, body { 
                background-color: transparent; 
                margin: 0; 
                padding: 0;
                overflow-x: hidden;
                /* Ensure full height and width for layout */
                height: 100%;
                min-height: 100vh;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
            }
            * {
                box-sizing: border-box;
            }
            /* Ensure sections can use full width */
            #frame-root {
                width: 100%;
                max-width: 100%;
                min-height: 100vh;
                margin: 0;
                padding: 0;
            }
            /* Ensure all sections take full width */
            #frame-root > * {
                width: 100%;
                max-width: 100%;
            }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: #111; }
            ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        `;
        doc.head.appendChild(styleEl);

        setMountNode(doc.getElementById('frame-root'));
    };

    // If already loaded (rare in React render cycle but possible) or simple mounting
    if (frame.contentDocument?.readyState === 'complete') {
        handleLoad();
    } else {
        frame.addEventListener('load', handleLoad);
    }
    
    return () => {
        frame.removeEventListener('load', handleLoad);
    };
  }, []);

  // Sync Dynamic Styles (The variable CSS properties)
  useEffect(() => {
      if (!frameRef.current?.contentDocument) return;
      const doc = frameRef.current.contentDocument;
      
      const syncStyles = () => {
          const mainStyles = document.getElementById('dynamic-theme-styles');
          let frameStyles = doc.getElementById('dynamic-theme-styles');
          
          if (mainStyles) {
              if (!frameStyles) {
                  frameStyles = doc.createElement('style');
                  frameStyles.id = 'dynamic-theme-styles';
                  doc.head.appendChild(frameStyles);
              }
              if (frameStyles.innerHTML !== mainStyles.innerHTML) {
                  frameStyles.innerHTML = mainStyles.innerHTML;
              }
          }
      };

      // Create an observer to watch for changes in the main document style
      const observer = new MutationObserver(syncStyles);
      const target = document.getElementById('dynamic-theme-styles');
      if (target) {
          observer.observe(target, { childList: true, characterData: true, subtree: true });
          syncStyles(); // Initial sync
      }
      
      return () => observer.disconnect();
  }, [mountNode]); // Re-setup if mountNode changes (iframe reloads)

  // Viewport is set to device-width for proper responsive behavior
  // The iframe width itself controls the viewport size, not the meta tag

  return (
    <>
        <iframe 
            ref={frameRef} 
            className={className} 
            style={{
                ...style, 
                border: 'none',
                display: 'block',
                width: style?.width || '100%',
                height: style?.height || '100%'
            }}
            title="Site Preview"
        />
        {mountNode && createPortal(children, mountNode)}
    </>
  );
};
