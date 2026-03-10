import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('divider', key);

export const dividerProperties: ElementPropertyGroup = {
  elementId: 'divider',
  displayName: 'Divider',
  properties: {
    content: [],
    style: [
      {
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., 100%, 50%',
        category: 'style',
      },
      {
        key: 'borderTop',
        label: 'Border Style',
        type: 'text',
        defaultValue: getDefault('borderTop'),
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


