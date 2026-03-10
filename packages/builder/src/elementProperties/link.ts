import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('link', key);

export const linkProperties: ElementPropertyGroup = {
  elementId: 'link',
  displayName: 'Link',
  properties: {
    content: [
      {
        key: 'text',
        label: 'Link Text',
        type: 'text',
        defaultValue: getDefault('text'),
        placeholder: 'Enter link text',
        category: 'content',
      },
      {
        key: 'href',
        label: 'Link URL',
        type: 'url',
        defaultValue: getDefault('href'),
        placeholder: 'https://example.com or #section',
        category: 'content',
      },
      {
        key: 'target',
        label: 'Link Target',
        type: 'select',
        defaultValue: getDefault('target'),
        options: [
          { value: '_self', label: 'Same Window' },
          { value: '_blank', label: 'New Window' },
        ],
        category: 'content',
      },
    ],
    style: [
      {
        key: 'color',
        label: 'Link Color',
        type: 'color',
        defaultValue: getDefault('color'),
        category: 'style',
      },
      {
        key: 'opacity',
        label: 'Opacity',
        type: 'range',
        defaultValue: getDefault('opacity'),
        min: 0,
        max: 1,
        step: 0.01,
        category: 'style',
      },
    ],
    advanced: [
      {
        key: 'rel',
        label: 'Rel Attribute',
        type: 'text',
        defaultValue: getDefault('rel'),
        placeholder: 'e.g., noopener, noreferrer',
        category: 'advanced',
      },
      {
        key: 'className',
        label: 'CSS Class',
        type: 'text',
        defaultValue: getDefault('className'),
        placeholder: 'custom-class-name',
        category: 'advanced',
      },
    ],
  },
};


