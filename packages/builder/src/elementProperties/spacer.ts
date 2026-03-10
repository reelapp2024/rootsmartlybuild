import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('spacer', key);

export const spacerProperties: ElementPropertyGroup = {
  elementId: 'spacer',
  displayName: 'Spacer',
  properties: {
    content: [],
    style: [
      {
        key: 'height',
        label: 'Height',
        type: 'text',
        defaultValue: getDefault('height'),
        placeholder: 'e.g., 24px, 2rem',
        category: 'style',
      },
      {
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., 100%, 50px',
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


