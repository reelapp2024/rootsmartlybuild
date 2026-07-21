
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRESET_FONTS, buildGoogleFontsCssUrl } from '../constants';
import { normalizeInternalPath } from '../utils/resolveInternalPageLink';

interface PreviewFrameProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onIframeClick?: () => void;
  /**
   * Soft-open internal canvas links inside GenieBuild (keeps ?projectId=).
   * Skips clicks that already called preventDefault (edit-mode Open|Select chooser).
   */
  onInternalLinkClick?: (href: string) => void;
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  children,
  className,
  style,
  onIframeClick,
  onInternalLinkClick,
}) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const onInternalLinkClickRef = useRef(onInternalLinkClick);
  onInternalLinkClickRef.current = onInternalLinkClick;

  // INJECT GOOGLE FONTS INTO IFRAME IN REAL-TIME
  useEffect(() => {
    const iframe = frameRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;
      // Check if already injected to prevent duplicates
      if (!iframeDoc.getElementById('geniebuild-fonts')) {
        const link = iframeDoc.createElement('link');
        link.id = 'geniebuild-fonts';
        link.rel = 'stylesheet';
        link.href = buildGoogleFontsCssUrl(PRESET_FONTS);
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

        // Suppress ResizeObserver errors in the iframe window too
        const win = doc.defaultView;
        if (win) {
            const suppressIframeResizeObserverErrors = (e: ErrorEvent | PromiseRejectionEvent) => {
                const message = (e instanceof ErrorEvent) ? e.message : (e.reason?.message || '');
                if (message?.includes('ResizeObserver')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            };
            win.addEventListener('error', suppressIframeResizeObserverErrors);
            win.addEventListener('unhandledrejection', suppressIframeResizeObserverErrors);
        }
        
        // Inject Tailwind runtime (required for current GenieBuild class rendering)
        const script = doc.createElement('script');
        script.src = "https://cdn.tailwindcss.com";
        doc.head.appendChild(script);

        // Inject Fonts, Icons, and built CSS from main document
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
                /* Allow content to determine height */
                height: auto;
                min-height: 100%;
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
                min-height: auto;
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
        // Mark iframe ready after a brief tick to let React portal render first content
        requestAnimationFrame(() => requestAnimationFrame(() => setIframeReady(true)));

        // Forward clicks on the iframe's canvas background to the parent (for deselect).
        // Elements inside the iframe set window.__gbElementClicked = true on the IFRAME's window.
        // We check the iframe's window here (doc.defaultView) and only fire onIframeClick
        // when no element was clicked in the same tick.
        if (onIframeClick) {
            doc.addEventListener('click', () => {
                const iframeWin = doc.defaultView as any;
                if (!iframeWin?.__gbElementClicked) {
                    onIframeClick();
                }
                if (iframeWin) iframeWin.__gbElementClicked = false;
            });
        }
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
    if (!mountNode || !frameRef.current) return;
    
    const frame = frameRef.current;
    
    // Auto-resize iframe height based on content
    let isUpdating = false;
    const updateHeight = () => {
        if (isUpdating) return;
        
        // Use requestAnimationFrame to ensure we update in sync with the browser's paint cycle
        // and avoid "ResizeObserver loop completed with undelivered notifications"
        isUpdating = true;
        window.requestAnimationFrame(() => {
            const doc = frame.contentDocument;
            if (doc && doc.body) {
                // Use scrollHeight to get the content height
                const height = doc.body.scrollHeight;
                
                // Get current height to compare
                const currentHeightStr = frame.style.height;
                const currentHeight = currentHeightStr ? parseInt(currentHeightStr, 10) : 0;

                // Only update if the height has actually changed significantly (> 2px)
                // to avoid redundant layout cycles and potential infinite loops
                if (height > 0 && Math.abs(currentHeight - height) > 2) {
                    frame.style.height = `${height}px`;
                }
            }
            isUpdating = false;
        });
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(mountNode);
    
    // Initial update
    setTimeout(updateHeight, 100);

    return () => resizeObserver.disconnect();
  }, [mountNode]);

  // Sync Dynamic Styles (The variable CSS properties).
  // Mirrors both `dynamic-theme-styles` (global theme CSS) and
  // `geniebuild-responsive-overrides` (per-section/element mobile/tablet CSS)
  // from the outer document into the iframe head so iframe-scoped media
  // queries fire based on the iframe's own width.
  useEffect(() => {
      if (!frameRef.current?.contentDocument) return;
      const doc = frameRef.current.contentDocument;

      const mirrorStyle = (id: string) => {
          const mainStyles = document.getElementById(id);
          let frameStyles = doc.getElementById(id);
          if (!mainStyles) return;
          if (!frameStyles) {
              frameStyles = doc.createElement('style');
              frameStyles.id = id;
              doc.head.appendChild(frameStyles);
          }
          if (frameStyles.textContent !== mainStyles.textContent) {
              frameStyles.textContent = mainStyles.textContent;
          }
      };

      const syncStyles = () => {
          mirrorStyle('dynamic-theme-styles');
          mirrorStyle('geniebuild-responsive-overrides');
      };

      const observers: MutationObserver[] = [];
      const observeIfPresent = () => {
          ['dynamic-theme-styles', 'geniebuild-responsive-overrides'].forEach((id) => {
              // Skip if already observing this id
              if (observers.some((o) => (o as any).__watchedId === id)) return;
              const target = document.getElementById(id);
              if (target) {
                  const observer = new MutationObserver(syncStyles);
                  observer.observe(target, { childList: true, characterData: true, subtree: true });
                  (observer as any).__watchedId = id;
                  observers.push(observer);
              }
          });
      };
      observeIfPresent();
      syncStyles();

      // Also watch document.head itself so that style tags added AFTER mount
      // (e.g., geniebuild-responsive-overrides on first user edit) get picked up.
      const headObserver = new MutationObserver(() => {
          observeIfPresent();
          syncStyles();
      });
      headObserver.observe(document.head, { childList: true });
      observers.push(headObserver);

      return () => observers.forEach(o => o.disconnect());
  }, [mountNode]); // Re-setup if mountNode changes (iframe reloads)

  // Auto-apply lazy loading to every <img> inside the iframe.
  // Uses a MutationObserver so dynamically-added images (section swaps,
  // carousels, virtual elements) get decorated without touching each
  // section component individually.
  useEffect(() => {
    if (!frameRef.current?.contentDocument) return;
    const doc = frameRef.current.contentDocument;

    const decorateImg = (img: HTMLImageElement) => {
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
    };

    const decorateAll = () => {
      doc.querySelectorAll('img').forEach((n) => decorateImg(n as HTMLImageElement));
    };
    decorateAll();

    const observer = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.tagName === 'IMG') decorateImg(n as HTMLImageElement);
          else n.querySelectorAll?.('img').forEach((img) => decorateImg(img as HTMLImageElement));
        });
      }
    });
    observer.observe(doc.body || doc, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [mountNode]);

  // Mirror SiteNextJS GenieBuildPageRenderer: intercept internal <a> clicks inside
  // the iframe so navigation stays in the builder under the stored projectId.
  // Bubble phase + defaultPrevented check → edit-mode LinkClickChooser still wins.
  useEffect(() => {
    if (!mountNode) return;

    const onClick = (event: MouseEvent) => {
      if (!onInternalLinkClickRef.current) return;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = String(anchor.getAttribute('href') || '').trim();
      if (!rawHref || rawHref === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return;
      if (anchor.hasAttribute('download')) return;

      // Same-origin / relative paths only — leave true external URLs alone.
      const internalPath = normalizeInternalPath(rawHref);
      if (internalPath === null) return;

      event.preventDefault();
      onInternalLinkClickRef.current(rawHref);
    };

    mountNode.addEventListener('click', onClick);
    return () => mountNode.removeEventListener('click', onClick);
  }, [mountNode]);

  // Viewport is set to device-width for proper responsive behavior
  // The iframe width itself controls the viewport size, not the meta tag

  return (
    <div style={{ position: 'relative', width: style?.width || '100%', height: style?.height || '100%' }}>
        <iframe
            ref={frameRef}
            className={className}
            style={{
                ...style,
                border: 'none',
                display: 'block',
                width: '100%',
                height: '100%'
            }}
            title="Site Preview"
        />
        {/* Dark overlay that fades out once iframe is ready — prevents white flash during Tailwind/font injection */}
        {!iframeReady && (
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: '#0A0F14',
                zIndex: 9999,
                pointerEvents: 'none',
                transition: 'opacity 0.25s ease',
                opacity: 1,
            }} />
        )}
        {mountNode && createPortal(children, mountNode)}
    </div>
  );
};
