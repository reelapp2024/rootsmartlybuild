/**
 * Utility to dynamically load Google Fonts
 * Loads fonts on-demand when they're used in elements
 */

const loadedFonts = new Set<string>();

/**
 * Get Google Fonts URL for a font family
 */
function getGoogleFontUrl(fontFamily: string): string | null {
  // Extract font name from font-family string (e.g., "Roboto, sans-serif" -> "Roboto")
  const fontMatch = fontFamily.match(/^['"]?([^,'"]+)['"]?/);
  if (!fontMatch) return null;
  
  const fontName = fontMatch[1].trim();
  
  // Map of font names to Google Fonts URLs
  const googleFonts: Record<string, string> = {
    'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap',
    'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
    'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
    'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    'Raleway': 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap',
    'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap',
    'Oswald': 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap',
    'Merriweather': 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap',
    'Source Sans Pro': 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap',
    'Ubuntu': 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap',
    'Dancing Script': 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap',
    'Pacifico': 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
    'Comfortaa': 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap',
    'Bebas Neue': 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    'Crimson Text': 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap',
  };
  
  return googleFonts[fontName] || null;
}

/**
 * Load a Google Font dynamically
 * Returns a promise that resolves when the font is loaded
 */
export function loadGoogleFont(fontFamily: string): Promise<void> | void {
  if (typeof window === 'undefined') return;
  
  // Skip if font is already loaded or if it's a system font
  if (loadedFonts.has(fontFamily)) return Promise.resolve();
  
  const fontUrl = getGoogleFontUrl(fontFamily);
  if (!fontUrl) {
    // Not a Google Font (system font), mark as loaded to avoid re-checking
    loadedFonts.add(fontFamily);
    return Promise.resolve();
  }
  
  // Check if link already exists
  const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
  if (existingLink) {
    loadedFonts.add(fontFamily);
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    // Create and add link element
    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    
    // Add event listeners for loading
    link.onload = () => {
      loadedFonts.add(fontFamily);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FontLoader] Loaded Google Font: ${fontFamily} from ${fontUrl}`);
      }
      resolve();
    };
    
    link.onerror = () => {
      console.warn(`[FontLoader] Failed to load font: ${fontFamily} from ${fontUrl}`);
      loadedFonts.add(fontFamily); // Mark as attempted to avoid retries
      resolve(); // Resolve anyway to not block
    };
    
    // Add to head immediately (before onload fires)
    document.head.appendChild(link);
    
    // Fallback: resolve after a short timeout if onload doesn't fire
    setTimeout(() => {
      if (!loadedFonts.has(fontFamily)) {
        loadedFonts.add(fontFamily);
        resolve();
      }
    }, 100);
  });
}

/**
 * Preload common Google Fonts
 */
export function preloadCommonFonts(): void {
  if (typeof window === 'undefined') return;
  
  const commonFonts = [
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
    'Poppins, sans-serif',
    'Inter, sans-serif',
  ];
  
  commonFonts.forEach(font => {
    loadGoogleFont(font);
  });
}

/**
 * Preload all available fonts used in the builder
 */
export function preloadAllBuilderFonts(): void {
  if (typeof window === 'undefined') return;
  
  const allFonts = [
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
    'Playfair Display, serif',
    'Raleway, sans-serif',
    'Poppins, sans-serif',
    'Inter, sans-serif',
    'Nunito, sans-serif',
    'Oswald, sans-serif',
    'Merriweather, serif',
    'Source Sans Pro, sans-serif',
    'Ubuntu, sans-serif',
    'Dancing Script, cursive',
    'Pacifico, cursive',
    'Comfortaa, sans-serif',
    'Bebas Neue, sans-serif',
    'Crimson Text, serif',
  ];
  
  // Load all fonts in parallel
  Promise.all(allFonts.map(font => loadGoogleFont(font))).then(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[FontLoader] All builder fonts preloaded');
    }
  });
}

