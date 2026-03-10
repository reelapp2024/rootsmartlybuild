// Element Property Definitions
// These define what properties and options are available in the sidebar for each element type
// Based on elementId from BuilderElement database

export interface ElementProperty {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'color' | 'url' | 'select' | 'checkbox' | 'range' | 'image' | 'icon';
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  category: 'content' | 'style' | 'advanced';
  showWhen?: string | string[]; // Show property only when display type matches (for containers)
}

export interface ElementPropertyGroup {
  elementId: string;
  displayName: string;
  properties: {
    content: ElementProperty[];
    style: ElementProperty[];
    advanced: ElementProperty[];
  };
}

// Export all element property definitions
export { headingProperties } from './heading';
export { textProperties } from './text';
export { buttonProperties } from './button';
export { imageProperties } from './image';
export { videoProperties } from './video';
export { iconProperties } from './icon';
export { linkProperties } from './link';
export { dividerProperties } from './divider';
export { spacerProperties } from './spacer';
export { containerProperties } from './container';
export { htmlProperties } from './html';
export { listProperties } from './list';
export { inputProperties } from './input';
export { textareaProperties } from './textarea';
export { selectProperties } from './select';
export { labelProperties } from './label';
export { badgeProperties } from './badge';

// Import all element properties
import { headingProperties } from './heading';
import { textProperties } from './text';
import { buttonProperties } from './button';
import { imageProperties } from './image';
import { videoProperties } from './video';
import { iconProperties } from './icon';
import { linkProperties } from './link';
import { dividerProperties } from './divider';
import { spacerProperties } from './spacer';
import { containerProperties } from './container';
import { htmlProperties } from './html';
import { listProperties } from './list';
import { inputProperties } from './input';
import { textareaProperties } from './textarea';
import { selectProperties } from './select';
import { labelProperties } from './label';
import { badgeProperties } from './badge';

// Registry of all element properties
export const elementPropertiesRegistry: Record<string, ElementPropertyGroup> = {
  heading: headingProperties,
  text: textProperties,
  button: buttonProperties,
  image: imageProperties,
  video: videoProperties,
  icon: iconProperties,
  link: linkProperties,
  divider: dividerProperties,
  spacer: spacerProperties,
  container: containerProperties,
  html: htmlProperties,
  list: listProperties,
  input: inputProperties,
  textarea: textareaProperties,
  select: selectProperties,
  label: labelProperties,
  badge: badgeProperties,
};

// Element category mapping (UI categorization only)
const ELEMENT_CATEGORIES: Record<string, string> = {
  container: 'Layout',
  heading: 'Basic',
  text: 'Basic',
  button: 'Basic',
  image: 'Media',
  video: 'Media',
  icon: 'Media',
  link: 'Basic',
  list: 'Basic',
  badge: 'Basic',
  divider: 'Basic',
  spacer: 'Basic',
  html: 'Advanced',
  input: 'Form',
  textarea: 'Form',
  select: 'Form',
  label: 'Form',
};

// Helper to get properties for an element
export const getElementProperties = (elementId: string): ElementPropertyGroup | null => {
  if (!elementId) return null;
  // Normalize elementId: lowercase and handle common variations
  const normalizedId = elementId.toLowerCase().trim();
  return elementPropertiesRegistry[normalizedId] || null;
};

/**
 * Generate builder elements list from registry (single source of truth)
 * Automatically creates the list from elementPropertiesRegistry
 */
export interface BuilderElement {
  _id: string;
  elementId: string;
  displayName: string;
  category: string;
  isActive: boolean;
}

export function getBuilderElementsList(): BuilderElement[] {
  return Object.keys(elementPropertiesRegistry).map((elementId) => {
    const properties = elementPropertiesRegistry[elementId];
    return {
      _id: elementId,
      elementId: elementId,
      displayName: properties.displayName,
      category: ELEMENT_CATEGORIES[elementId] || 'Basic',
      isActive: true,
    };
  });
}
