import type { Section } from './types/builder';

/**
 * SECTION_TEMPLATES - Default section templates with new nested background object architecture
 * Each template defines default styles including the new background: {} object structure
 */
export const SECTION_TEMPLATES: Record<string, Partial<Section>> = {
  // Hero Section Template
  hero_a: {
    styles: {
      background: {
        type: 'image',
        image: {
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          position: 'center',
          size: 'cover',
          repeat: 'no-repeat',
        },
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '72px 40px',
      minHeight: '420px',
      backgroundColor: '#e0e7ff', // Legacy fallback
    },
  },

  // Features Section Template
  features_a: {
    styles: {
      background: {
        type: 'color',
        color: '#ffffff',
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '80px 40px',
      backgroundColor: '#ffffff', // Legacy fallback
    },
  },

  // Content Section Template
  content_a: {
    styles: {
      background: {
        type: 'color',
        color: '#ffffff',
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '80px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#ffffff', // Legacy fallback
    },
  },

  // CTA Section Template
  cta_a: {
    styles: {
      background: {
        type: 'gradient',
        gradient: {
          type: 'linear',
          colors: [
            { color: '#667eea', stop: '0%' },
            { color: '#764ba2', stop: '100%' },
          ],
          angle: '90deg',
        },
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '80px 40px',
      backgroundColor: '#667eea', // Legacy fallback
    },
  },

  // Services Section Template
  services_a: {
    styles: {
      background: {
        type: 'color',
        color: '#f9fafb',
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '80px 40px',
      backgroundColor: '#f9fafb', // Legacy fallback
    },
  },

  // Testimonial Section Template
  testimonial_a: {
    styles: {
      background: {
        type: 'color',
        color: '#ffffff',
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '80px 40px',
      backgroundColor: '#ffffff', // Legacy fallback
    },
  },

  // FAQ Section Template
  faq_a: {
    styles: {
      background: {
        type: 'color',
        color: '#f9fafb',
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '80px 40px',
      backgroundColor: '#f9fafb', // Legacy fallback
    },
  },

  // Process Section Template
  process_a: {
    styles: {
      background: {
        type: 'color',
        color: '#ffffff',
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '80px 40px',
      backgroundColor: '#ffffff', // Legacy fallback
    },
  },

  // Default Section Template (fallback)
  default: {
    styles: {
      background: {
        type: 'color',
        color: '#e5e7eb',
        overlay: {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      },
      padding: '40px',
      backgroundColor: '#e5e7eb', // Legacy fallback
    },
  },
};

/**
 * Get default section template by type
 */
export function getSectionTemplate(sectionType: string): Partial<Section> {
  return SECTION_TEMPLATES[sectionType] || SECTION_TEMPLATES.default || {};
}

/**
 * Helper to convert legacy flat background properties to new nested background object
 */
export function normalizeBackground(styles: any): any {
  // If background object already exists, return as-is
  if (styles.background && typeof styles.background === 'object' && styles.background.type) {
    return styles.background;
  }

  // Convert from legacy flat properties
  if (styles.backgroundType) {
    const bgType = styles.backgroundType;
    
    if (bgType === 'color') {
      return {
        type: 'color',
        color: styles.backgroundColor || '#0E1214',
        overlay: styles.overlayColor || styles.overlayOpacity
          ? {
              enabled: true,
              color: styles.overlayColor || '#000000',
              opacity: typeof styles.overlayOpacity === 'string' 
                ? parseFloat(styles.overlayOpacity) 
                : (styles.overlayOpacity || 0.5),
              blendMode: styles.overlayBlendMode || 'normal',
            }
          : {
              enabled: false,
              color: '#000000',
              opacity: 0.5,
              blendMode: 'normal',
            },
      };
    }
    
    if (bgType === 'image') {
      return {
        type: 'image',
        image: {
          url: styles.backgroundImage || '',
          position: styles.backgroundPosition || 'center',
          size: styles.backgroundSize || 'cover',
          repeat: styles.backgroundRepeat || 'no-repeat',
        },
        overlay: styles.overlayColor || styles.overlayOpacity
          ? {
              enabled: true,
              color: styles.overlayColor || '#000000',
              opacity: typeof styles.overlayOpacity === 'string' 
                ? parseFloat(styles.overlayOpacity) 
                : (styles.overlayOpacity || 0.5),
              blendMode: styles.overlayBlendMode || 'normal',
            }
          : {
              enabled: false,
              color: '#000000',
              opacity: 0.5,
              blendMode: 'normal',
            },
      };
    }
    
    if (bgType === 'gradient') {
      let gradientColors = [];
      try {
        gradientColors = typeof styles.gradientColors === 'string'
          ? JSON.parse(styles.gradientColors)
          : (styles.gradientColors || []);
      } catch (e) {
        gradientColors = [{ color: '#667eea', stop: '0%' }, { color: '#764ba2', stop: '100%' }];
      }
      
      return {
        type: 'gradient',
        gradient: {
          type: styles.gradientType || 'linear',
          colors: gradientColors,
          angle: styles.gradientAngle || styles.gradientDirection || '90deg',
        },
        overlay: styles.overlayColor || styles.overlayOpacity
          ? {
              enabled: true,
              color: styles.overlayColor || '#000000',
              opacity: typeof styles.overlayOpacity === 'string' 
                ? parseFloat(styles.overlayOpacity) 
                : (styles.overlayOpacity || 0.5),
              blendMode: styles.overlayBlendMode || 'normal',
            }
          : {
              enabled: false,
              color: '#000000',
              opacity: 0.5,
              blendMode: 'normal',
            },
      };
    }
    
    if (bgType === 'video') {
      return {
        type: 'video',
        video: {
          url: styles.backgroundVideo || styles.backgroundVideoUrl || '',
          autoplay: styles.backgroundVideoAutoplay !== false,
          loop: styles.backgroundVideoLoop !== false,
          muted: styles.backgroundVideoMuted !== false,
        },
        overlay: styles.overlayColor || styles.overlayOpacity
          ? {
              enabled: styles.backgroundVideoOverlay !== false,
              color: styles.overlayColor || '#000000',
              opacity: typeof styles.overlayOpacity === 'string' 
                ? parseFloat(styles.overlayOpacity) 
                : (styles.overlayOpacity || 0.5),
              blendMode: styles.overlayBlendMode || 'normal',
            }
          : {
              enabled: styles.backgroundVideoOverlay !== false,
              color: '#000000',
              opacity: 0.5,
              blendMode: 'normal',
            },
      };
    }
  }
  
  // Fallback: infer from existing properties
  if (styles.backgroundImage && !styles.backgroundImage.startsWith('linear-gradient') && !styles.backgroundImage.startsWith('radial-gradient')) {
    return {
      type: 'image',
      image: {
        url: styles.backgroundImage,
        position: styles.backgroundPosition || 'center',
        size: styles.backgroundSize || 'cover',
        repeat: styles.backgroundRepeat || 'no-repeat',
      },
      overlay: {
        enabled: false,
        color: '#000000',
        opacity: 0.5,
        blendMode: 'normal',
      },
    };
  }
  
  if (styles.gradientColors) {
    let gradientColors = [];
    try {
      gradientColors = typeof styles.gradientColors === 'string'
        ? JSON.parse(styles.gradientColors)
        : (styles.gradientColors || []);
    } catch (e) {
      gradientColors = [{ color: '#667eea', stop: '0%' }, { color: '#764ba2', stop: '100%' }];
    }
    
    return {
      type: 'gradient',
      gradient: {
        type: styles.gradientType || 'linear',
        colors: gradientColors,
        angle: styles.gradientAngle || styles.gradientDirection || '90deg',
      },
      overlay: {
        enabled: false,
        color: '#000000',
        opacity: 0.5,
        blendMode: 'normal',
      },
    };
  }
  
  // Default to color
  return {
    type: 'color',
    color: styles.backgroundColor || '#0E1214',
    overlay: {
      enabled: false,
      color: '#000000',
      opacity: 0.5,
      blendMode: 'normal',
    },
  };
}
