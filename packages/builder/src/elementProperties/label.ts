import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('label', key);

export const labelProperties: ElementPropertyGroup = {
  elementId: 'label',
  displayName: 'Label',
  properties: {
    content: [
      {
        key: 'text',
        label: 'Label Text',
        type: 'text',
        defaultValue: getDefault('text'),
        placeholder: 'Enter label text',
        category: 'content',
      },
      {
        key: 'htmlFor',
        label: 'For (Input ID)',
        type: 'text',
        defaultValue: getDefault('htmlFor'),
        placeholder: 'ID of associated input',
        category: 'content',
      },
    ],
    style: [
      {
        key: 'color',
        label: 'Text Color',
        type: 'color',
        defaultValue: getDefault('color'),
        category: 'style',
      },
      {
        key: 'marginBottom',
        label: 'Margin Bottom',
        type: 'text',
        defaultValue: getDefault('marginBottom'),
        placeholder: 'e.g., 0, 8px, 1rem',
        category: 'style',
      },
      {
        key: 'display',
        label: 'Display',
        type: 'select',
        defaultValue: getDefault('display'),
        options: [
          { value: 'block', label: 'Block' },
          { value: 'inline', label: 'Inline' },
          { value: 'inline-block', label: 'Inline Block' },
        ],
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


