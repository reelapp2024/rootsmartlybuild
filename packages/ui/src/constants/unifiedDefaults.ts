import React from 'react';

/**
 * UNIFIED DEFAULTS - SINGLE SOURCE OF TRUTH
 * 
 * This file contains ALL default values for ALL elements (container, section, heading, text, etc.)
 * All property definitions and element creation should use this file.
 * 
 * Structure:
 * - Each element type has a `defaultStyle` object (CSS properties)
 * - Each element type has a `defaultProps` object (content/data properties)
 * - Each element type has a `propertyDefaults` array (for sidebar UI defaults)
 */

export interface PropertyDefault {
  key: string;
  defaultValue: any;
  category: 'content' | 'style' | 'advanced';
}

export interface ElementDefaults {
  defaultStyle: React.CSSProperties;
  defaultProps: Record<string, any>;
  propertyDefaults: PropertyDefault[]; // For sidebar UI
}

export const UNIFIED_DEFAULTS: Record<string, ElementDefaults> = {
  // ============================================
  // SECTION DEFAULTS
  // ============================================
  section: {
    defaultStyle: {
      width: '100%',
      height: '100vh',
      maxWidth: 'none',
      display: 'block',
      position: 'relative',
      padding: 0,
      margin: 0,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      backgroundColor: 'transparent',
      overflow: 'visible',
      backgroundType: 'none',
      minHeight: 'auto',
      mobile: { padding: 0, margin: 0 },
      tablet: { padding: 0, margin: 0 },
    } as any,
    defaultProps: {},
    propertyDefaults: [
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'minHeight', defaultValue: 'auto', category: 'style' },
      { key: 'backgroundColor', defaultValue: 'transparent', category: 'style' },
      { key: 'backgroundType', defaultValue: 'none', category: 'style' },
      { key: 'padding', defaultValue: 0, category: 'style' },
      { key: 'margin', defaultValue: 0, category: 'style' },
    ],
  },

  // ============================================
  // CONTAINER DEFAULTS
  // ============================================
  container: {
    defaultStyle: {
      width: 'auto',
      height: '100vh',
      maxWidth: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
      gap: 0,
      position: 'relative',
      boxSizing: 'border-box',
      marginTop: undefined,
      marginRight: '20px',
      marginBottom: undefined,
      marginLeft: '20px',
      backgroundColor: 'transparent',
      color: 'var(--color-heading, #F8FAFC)',
      opacity: 1,
      padding: undefined,
    },
    defaultProps: {},
    propertyDefaults: [
      { key: 'display', defaultValue: 'flex', category: 'style' },
      { key: 'backgroundColor', defaultValue: 'transparent', category: 'style' },
      { key: 'backgroundImage', defaultValue: '', category: 'style' },
      { key: 'backgroundImageOpacity', defaultValue: 1, category: 'style' },
      { key: 'borderRadius', defaultValue: '0', category: 'style' },
      { key: 'border', defaultValue: 'none', category: 'style' },
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'height', defaultValue: 'auto', category: 'style' },
      { key: 'minHeight', defaultValue: 'auto', category: 'style' },
      { key: 'maxWidth', defaultValue: '100%', category: 'style' },
      { key: 'flexDirection', defaultValue: 'column', category: 'style' },
      { key: 'gridColumns', defaultValue: 'auto', category: 'style' },
      { key: 'gridRows', defaultValue: 'auto', category: 'style' },
      { key: 'gap', defaultValue: '16px', category: 'style' },
      { key: 'justifyContent', defaultValue: 'flex-start', category: 'style' },
      { key: 'alignItems', defaultValue: 'stretch', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // HEADING DEFAULTS
  // ============================================
  heading: {
    defaultStyle: {
      fontWeight: 700,
      color: '#ffff',
      marginBottom: 24,
      lineHeight: 1.2,
    },
    defaultProps: {
      text: 'Heading',
      heading: 'Heading',
      headingTag: 'h1',
    },
    propertyDefaults: [
      { key: 'text', defaultValue: 'Heading', category: 'content' },
      { key: 'headingTag', defaultValue: 'h1', category: 'content' },
      { key: 'textColor', defaultValue: '#ffff', category: 'style' },
      { key: 'backgroundColor', defaultValue: 'transparent', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
      { key: 'id', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // TEXT DEFAULTS
  // ============================================
  text: {
    defaultStyle: {
      fontSize: 'var(--text-size-base, 1rem)',
      color: '#000000',
      lineHeight: 1.6,
      width: '100%',
    },
    defaultProps: {
      text: 'Text content',
    },
    propertyDefaults: [
      { key: 'text', defaultValue: 'Text content', category: 'content' },
      { key: 'color', defaultValue: '#000000', category: 'style' },
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'height', defaultValue: 'auto', category: 'style' },
      { key: 'minWidth', defaultValue: '', category: 'style' },
      { key: 'maxWidth', defaultValue: '', category: 'style' },
      { key: 'minHeight', defaultValue: '', category: 'style' },
      { key: 'maxHeight', defaultValue: '', category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // BUTTON DEFAULTS
  // ============================================
  button: {
    defaultStyle: {
      padding: 'var(--button-padding-medium, 12px 24px)',
      backgroundColor: 'var(--color-primary-bg, #2563eb)',
      color: 'var(--color-primary-text, #ffffff)',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: 'var(--button-font-size, 1rem)',
      fontWeight: 600,
    },
    defaultProps: {
      buttonText: 'Button',
      text: 'Button',
    },
    propertyDefaults: [
      { key: 'buttonText', defaultValue: 'Button', category: 'content' },
      { key: 'href', defaultValue: '#', category: 'content' },
      { key: 'target', defaultValue: '_self', category: 'content' },
      { key: 'backgroundColor', defaultValue: 'var(--color-primary-bg, #2563eb)', category: 'style' },
      { key: 'color', defaultValue: 'var(--color-primary-text, #ffffff)', category: 'style' },
      { key: 'borderRadius', defaultValue: '6px', category: 'style' },
      { key: 'border', defaultValue: 'none', category: 'style' },
      { key: 'width', defaultValue: 'auto', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'hoverStyle', defaultValue: 'scale', category: 'style' },
      { key: 'hoverBackgroundColor', defaultValue: '', category: 'style' },
      { key: 'hoverTextColor', defaultValue: '', category: 'style' },
      { key: 'clickStyle', defaultValue: 'press', category: 'style' },
      { key: 'clickBackgroundColor', defaultValue: '', category: 'style' },
      { key: 'clickTextColor', defaultValue: '', category: 'style' },
      { key: 'onClick', defaultValue: '', category: 'advanced' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // IMAGE DEFAULTS
  // ============================================
  image: {
    defaultStyle: {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '8px',
      opacity: 1,
      backgroundColor: 'transparent',
    },
    defaultProps: {
      imageUrl: 'https://picsum.photos/seed/picsum/200/300',
      imageAlt: 'Image',
    },
    propertyDefaults: [
      { key: 'imageUrl', defaultValue: 'https://picsum.photos/seed/picsum/200/300', category: 'content' },
      { key: 'imageAlt', defaultValue: 'Image', category: 'content' },
      { key: 'imageTitle', defaultValue: '', category: 'content' },
      { key: 'width', defaultValue: '', category: 'style' },
      { key: 'height', defaultValue: '', category: 'style' },
      { key: 'minWidth', defaultValue: '', category: 'style' },
      { key: 'maxWidth', defaultValue: '100%', category: 'style' },
      { key: 'minHeight', defaultValue: '', category: 'style' },
      { key: 'maxHeight', defaultValue: '', category: 'style' },
      { key: 'objectFit', defaultValue: 'cover', category: 'style' },
      { key: 'borderRadius', defaultValue: '8px', category: 'style' },
      { key: 'border', defaultValue: 'none', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'lazy', defaultValue: false, category: 'advanced' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // VIDEO DEFAULTS
  // ============================================
  video: {
    defaultStyle: {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '8px',
    },
    defaultProps: {
      videoUrl: '',
      videoAlt: 'Video',
    },
    propertyDefaults: [
      { key: 'videoUrl', defaultValue: '', category: 'content' },
      { key: 'videoAlt', defaultValue: 'Video', category: 'content' },
      { key: 'poster', defaultValue: '', category: 'content' },
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'height', defaultValue: 'auto', category: 'style' },
      { key: 'maxWidth', defaultValue: '100%', category: 'style' },
      { key: 'borderRadius', defaultValue: '8px', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'controls', defaultValue: true, category: 'advanced' },
      { key: 'autoplay', defaultValue: false, category: 'advanced' },
      { key: 'loop', defaultValue: false, category: 'advanced' },
      { key: 'muted', defaultValue: false, category: 'advanced' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // ICON DEFAULTS
  // ============================================
  icon: {
    defaultStyle: {
      fontSize: '2rem',
      color: 'var(--color-accent, #2563eb)',
    },
    defaultProps: {
      iconClass: 'fas fa-star',
      iconName: 'star',
    },
    propertyDefaults: [
      { key: 'iconClass', defaultValue: 'fas fa-star', category: 'content' },
      { key: 'iconName', defaultValue: 'star', category: 'content' },
      { key: 'color', defaultValue: 'var(--color-accent, #2563eb)', category: 'style' },
      { key: 'width', defaultValue: 'auto', category: 'style' },
      { key: 'height', defaultValue: 'auto', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // LINK DEFAULTS
  // ============================================
  link: {
    defaultStyle: {
      color: 'var(--color-accent, #2563eb)',
      textDecoration: 'underline',
      fontSize: '1rem',
    },
    defaultProps: {
      href: '#',
      text: 'Link',
    },
    propertyDefaults: [
      { key: 'href', defaultValue: '#', category: 'content' },
      { key: 'text', defaultValue: 'Link', category: 'content' },
      { key: 'target', defaultValue: '_self', category: 'content' },
      { key: 'color', defaultValue: 'var(--color-accent, #2563eb)', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'rel', defaultValue: '', category: 'advanced' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // DIVIDER DEFAULTS
  // ============================================
  divider: {
    defaultStyle: {
      width: '100%',
      border: 'none',
      borderTop: '1px solid #e2e8f0',
      margin: '24px 0',
    },
    defaultProps: {},
    propertyDefaults: [
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'borderTop', defaultValue: '1px solid #e2e8f0', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // SPACER DEFAULTS
  // ============================================
  spacer: {
    defaultStyle: {
      height: '32px',
      width: '100%',
    },
    defaultProps: {},
    propertyDefaults: [
      { key: 'height', defaultValue: '32px', category: 'style' },
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'backgroundColor', defaultValue: 'transparent', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // LIST DEFAULTS
  // ============================================
  list: {
    defaultStyle: {
      color: '#000000',
      lineHeight: 1.6,
    },
    defaultProps: {
      items: ['Item 1', 'Item 2', 'Item 3'],
    },
    propertyDefaults: [
      { key: 'items', defaultValue: ['Item 1', 'Item 2', 'Item 3'], category: 'content' },
      { key: 'listType', defaultValue: 'ul', category: 'content' },
      { key: 'listStyle', defaultValue: 'disc', category: 'style' },
      { key: 'color', defaultValue: '#000000', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // LABEL DEFAULTS
  // ============================================
  label: {
    defaultStyle: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#000000',
      marginBottom: '8px',
      display: 'block',
    },
    defaultProps: {
      text: 'Label',
    },
    propertyDefaults: [
      { key: 'text', defaultValue: 'Label', category: 'content' },
      { key: 'htmlFor', defaultValue: '', category: 'content' },
      { key: 'color', defaultValue: '#000000', category: 'style' },
      { key: 'marginBottom', defaultValue: '8px', category: 'style' },
      { key: 'display', defaultValue: 'block', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // BADGE DEFAULTS
  // ============================================
  badge: {
    defaultStyle: {
      display: 'inline-block',
      padding: '4px 12px',
      backgroundColor: 'var(--color-badge-bg, rgba(0,0,0,0.1))',
      color: '#000000',
      borderRadius: '12px',
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    defaultProps: {
      text: 'Badge',
    },
    propertyDefaults: [
      { key: 'text', defaultValue: 'Badge', category: 'content' },
      { key: 'display', defaultValue: 'inline-block', category: 'style' },
      { key: 'backgroundColor', defaultValue: 'var(--color-badge-bg, rgba(0,0,0,0.1))', category: 'style' },
      { key: 'color', defaultValue: '#000000', category: 'style' },
      { key: 'borderRadius', defaultValue: '12px', category: 'style' },
      { key: 'border', defaultValue: 'none', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // INPUT DEFAULTS
  // ============================================
  input: {
    defaultStyle: {
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      fontSize: '1rem',
      width: '100%',
    },
    defaultProps: {
      placeholder: 'Enter text...',
      type: 'text',
    },
    propertyDefaults: [
      { key: 'placeholder', defaultValue: 'Enter text...', category: 'content' },
      { key: 'type', defaultValue: 'text', category: 'content' },
      { key: 'value', defaultValue: '', category: 'content' },
      { key: 'name', defaultValue: '', category: 'content' },
      { key: 'borderRadius', defaultValue: '6px', category: 'style' },
      { key: 'border', defaultValue: '1px solid #ccc', category: 'style' },
      { key: 'fontSize', defaultValue: '1rem', category: 'style' },
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'backgroundColor', defaultValue: '#ffffff', category: 'style' },
      { key: 'color', defaultValue: '#000000', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'required', defaultValue: false, category: 'advanced' },
      { key: 'disabled', defaultValue: false, category: 'advanced' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // TEXTAREA DEFAULTS
  // ============================================
  textarea: {
    defaultStyle: {
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      fontSize: '1rem',
      width: '100%',
      minHeight: '100px',
    },
    defaultProps: {
      placeholder: 'Enter text...',
    },
    propertyDefaults: [
      { key: 'placeholder', defaultValue: 'Enter text...', category: 'content' },
      { key: 'value', defaultValue: '', category: 'content' },
      { key: 'name', defaultValue: '', category: 'content' },
      { key: 'rows', defaultValue: 4, category: 'content' },
      { key: 'borderRadius', defaultValue: '6px', category: 'style' },
      { key: 'border', defaultValue: '1px solid #ccc', category: 'style' },
      { key: 'fontSize', defaultValue: '1rem', category: 'style' },
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'minHeight', defaultValue: '100px', category: 'style' },
      { key: 'backgroundColor', defaultValue: '#ffffff', category: 'style' },
      { key: 'color', defaultValue: '#000000', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'marginTop', defaultValue: '0', category: 'style' },
      { key: 'marginRight', defaultValue: '0', category: 'style' },
      { key: 'marginBottom', defaultValue: '0', category: 'style' },
      { key: 'marginLeft', defaultValue: '0', category: 'style' },
      { key: 'required', defaultValue: false, category: 'advanced' },
      { key: 'disabled', defaultValue: false, category: 'advanced' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // SELECT DEFAULTS
  // ============================================
  select: {
    defaultStyle: {
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      fontSize: '1rem',
      width: '100%',
    },
    defaultProps: {
      options: ['Option 1', 'Option 2'],
    },
    propertyDefaults: [
      { key: 'options', defaultValue: ['Option 1', 'Option 2'], category: 'content' },
      { key: 'placeholder', defaultValue: 'Select an option...', category: 'content' },
      { key: 'name', defaultValue: '', category: 'content' },
      { key: 'borderRadius', defaultValue: '6px', category: 'style' },
      { key: 'border', defaultValue: '1px solid #ccc', category: 'style' },
      { key: 'fontSize', defaultValue: '1rem', category: 'style' },
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'backgroundColor', defaultValue: '#ffffff', category: 'style' },
      { key: 'color', defaultValue: '#000000', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'required', defaultValue: false, category: 'advanced' },
      { key: 'disabled', defaultValue: false, category: 'advanced' },
      { key: 'multiple', defaultValue: false, category: 'advanced' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },

  // ============================================
  // HTML DEFAULTS
  // ============================================
  html: {
    defaultStyle: {},
    defaultProps: {
      html: '<div>Custom HTML</div>',
    },
    propertyDefaults: [
      { key: 'htmlContent', defaultValue: '<p>Custom HTML</p>', category: 'content' },
      { key: 'width', defaultValue: '100%', category: 'style' },
      { key: 'opacity', defaultValue: 1, category: 'style' },
      { key: 'className', defaultValue: '', category: 'advanced' },
    ],
  },
};

/**
 * Get default style for an element type
 */
export function getDefaultStyle(elementType: string): React.CSSProperties {
  return UNIFIED_DEFAULTS[elementType]?.defaultStyle || {};
}

/**
 * Get default props for an element type
 */
export function getDefaultProps(elementType: string): Record<string, any> {
  return UNIFIED_DEFAULTS[elementType]?.defaultProps || {};
}

/**
 * Get property default value for sidebar UI
 * Returns the defaultValue for a specific property key
 */
export function getPropertyDefault(elementType: string, propertyKey: string): any {
  const elementDefaults = UNIFIED_DEFAULTS[elementType];
  if (!elementDefaults) return undefined;
  
  const propertyDefault = elementDefaults.propertyDefaults.find(
    (p) => p.key === propertyKey
  );
  
  return propertyDefault?.defaultValue;
}

/**
 * Get all property defaults for an element type (for sidebar UI)
 */
export function getPropertyDefaults(elementType: string): PropertyDefault[] {
  return UNIFIED_DEFAULTS[elementType]?.propertyDefaults || [];
}

/**
 * Get all defaults for an element type
 */
export function getElementDefaults(elementType: string): ElementDefaults {
  return UNIFIED_DEFAULTS[elementType] || {
    defaultStyle: {},
    defaultProps: {},
    propertyDefaults: [],
  };
}
