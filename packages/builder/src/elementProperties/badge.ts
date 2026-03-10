import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('badge', key);

export const badgeProperties: ElementPropertyGroup = {
  elementId: 'badge',
  displayName: 'Badge',
  properties: {
    content: [
      {
        key: 'text',
        label: 'Badge Text',
        type: 'text',
        defaultValue: getDefault('text'),
        placeholder: 'Enter badge text',
        category: 'content',
      },
    ],
    style: [
      {
        key: 'display',
        label: 'Display',
        type: 'select',
        defaultValue: getDefault('display'),
        options: [
          { value: 'inline-block', label: 'Inline Block' },
          { value: 'block', label: 'Block' },
          { value: 'inline', label: 'Inline' },
        ],
        category: 'style',
      },
      {
        key: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        defaultValue: getDefault('backgroundColor'),
        category: 'style',
      },
      {
        key: 'color',
        label: 'Text Color',
        type: 'color',
        defaultValue: getDefault('color'),
        category: 'style',
      },
      {
        key: 'borderRadius',
        label: 'Border Radius',
        type: 'text',
        defaultValue: getDefault('borderRadius'),
        placeholder: 'e.g., 12px, 50%',
        category: 'style',
      },
      {
        key: 'border',
        label: 'Border',
        type: 'text',
        defaultValue: getDefault('border'),
        placeholder: 'e.g., 1px solid #ccc',
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


