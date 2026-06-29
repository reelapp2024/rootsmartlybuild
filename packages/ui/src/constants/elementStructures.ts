import React from 'react';
import { UNIFIED_DEFAULTS } from './unifiedDefaults';

/**
 * Base element structures - shared across all components
 * LEGACY: This file now re-exports from unifiedDefaults.ts for backward compatibility
 * All new code should use unifiedDefaults.ts directly
 */
export const DEFAULT_ELEMENT_STRUCTURES: Record<string, { 
  defaultCode?: string; 
  defaultStyle: React.CSSProperties; 
  defaultProps: any 
}> = {
  heading: {
    defaultCode: '<h1>{text}</h1>',
    defaultStyle: { 
      // No fontSize - let browser defaults handle it based on headingTag (h1, h2, etc.)
      fontWeight: 700, 
      color: '#000000', // Black by default for visibility on white backgrounds
      marginBottom: 24, 
      lineHeight: 1.2 
    },
    defaultProps: { 
      text: 'Heading', 
      heading: 'Heading', 
      headingTag: 'h1' 
    }
  },
  text: {
    defaultCode: '<p>{text}</p>',
    defaultStyle: UNIFIED_DEFAULTS.text.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.text.defaultProps,
  },
  button: {
    defaultCode: '<button>{buttonText}</button>',
    defaultStyle: UNIFIED_DEFAULTS.button.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.button.defaultProps,
  },
  image: {
    defaultCode: '<img src="{imageUrl}" alt="{imageAlt}" />',
    defaultStyle: UNIFIED_DEFAULTS.image.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.image.defaultProps,
  },
  video: {
    defaultCode: '<video src="{videoUrl}" controls />',
    defaultStyle: UNIFIED_DEFAULTS.video.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.video.defaultProps,
  },
  icon: {
    defaultCode: '<i className="{iconClass}"></i>',
    defaultStyle: UNIFIED_DEFAULTS.icon.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.icon.defaultProps,
  },
  link: {
    defaultCode: '<a href="{href}">{text}</a>',
    defaultStyle: UNIFIED_DEFAULTS.link.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.link.defaultProps,
  },
  divider: {
    defaultCode: '<hr />',
    defaultStyle: UNIFIED_DEFAULTS.divider.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.divider.defaultProps,
  },
  spacer: {
    defaultCode: '<div></div>',
    defaultStyle: UNIFIED_DEFAULTS.spacer.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.spacer.defaultProps,
  },
  container: {
    defaultCode: '<div>{children}</div>',
    defaultStyle: UNIFIED_DEFAULTS.container.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.container.defaultProps,
  },
  html: {
    defaultCode: '<div dangerouslySetInnerHTML={{__html: htmlContent}} />',
    defaultStyle: UNIFIED_DEFAULTS.html.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.html.defaultProps,
  },
  list: {
    defaultCode: '<ul>{items}</ul>',
    defaultStyle: UNIFIED_DEFAULTS.list.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.list.defaultProps,
  },
  input: {
    defaultCode: '<input type="text" placeholder="{placeholder}" />',
    defaultStyle: UNIFIED_DEFAULTS.input.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.input.defaultProps,
  },
  textarea: {
    defaultCode: '<textarea placeholder="{placeholder}"></textarea>',
    defaultStyle: UNIFIED_DEFAULTS.textarea.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.textarea.defaultProps,
  },
  select: {
    defaultCode: '<select><option>Option 1</option></select>',
    defaultStyle: UNIFIED_DEFAULTS.select.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.select.defaultProps,
  },
  label: {
    defaultCode: '<label>{text}</label>',
    defaultStyle: UNIFIED_DEFAULTS.label.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.label.defaultProps,
  },
  badge: {
    defaultCode: '<span>{text}</span>',
    defaultStyle: UNIFIED_DEFAULTS.badge.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.badge.defaultProps,
  }
};

/**
 * Get element structure with optional component-specific overrides
 */
export function getElementStructure(
  elementType: string,
  overrides?: { defaultStyle?: Partial<React.CSSProperties>; defaultProps?: any }
) {
  const base = DEFAULT_ELEMENT_STRUCTURES[elementType] || {
    defaultCode: '<div></div>',
    defaultStyle: {},
    defaultProps: {}
  };

  return {
    ...base,
    defaultStyle: {
      ...base.defaultStyle,
      ...(overrides?.defaultStyle || {})
    },
    defaultProps: {
      ...base.defaultProps,
      ...(overrides?.defaultProps || {})
    }
  };
}

