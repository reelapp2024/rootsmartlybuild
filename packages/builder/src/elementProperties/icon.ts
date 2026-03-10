import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('icon', key);

export const iconProperties: ElementPropertyGroup = {
  elementId: 'icon',
  displayName: 'Icon',
  properties: {
    content: [
      {
        key: 'iconClass',
        label: 'Icon Class',
        type: 'icon',
        defaultValue: getDefault('iconClass'),
        placeholder: 'e.g., fas fa-star, fa-heart',
        category: 'content',
      },
      {
        key: 'iconName',
        label: 'Icon Name',
        type: 'text',
        defaultValue: getDefault('iconName'),
        placeholder: 'Icon identifier',
        category: 'content',
      },
    ],
    style: [
      {
        key: 'color',
        label: 'Icon Color',
        type: 'color',
        defaultValue: getDefault('color'),
        category: 'style',
      },
      {
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., auto, 32px',
        category: 'style',
      },
      {
        key: 'height',
        label: 'Height',
        type: 'text',
        defaultValue: getDefault('height'),
        placeholder: 'e.g., auto, 32px',
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


