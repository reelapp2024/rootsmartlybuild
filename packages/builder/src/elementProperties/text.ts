import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('text', key);

export const textProperties: ElementPropertyGroup = {
  elementId: 'text',
  displayName: 'Text',
  properties: {
    content: [
      {
        key: 'text',
        label: 'Text Content',
        type: 'textarea',
        defaultValue: getDefault('text'),
        placeholder: 'Enter text content',
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
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., 100%, auto, 500px, 50%',
        category: 'style',
      },
      {
        key: 'height',
        label: 'Height',
        type: 'text',
        defaultValue: getDefault('height'),
        placeholder: 'e.g., auto, 100px, 50vh',
        category: 'style',
      },
      {
        key: 'minWidth',
        label: 'Min Width',
        type: 'text',
        defaultValue: getDefault('minWidth'),
        placeholder: 'e.g., 200px, 50%',
        category: 'style',
      },
      {
        key: 'maxWidth',
        label: 'Max Width',
        type: 'text',
        defaultValue: getDefault('maxWidth'),
        placeholder: 'e.g., 800px, 100%',
        category: 'style',
      },
      {
        key: 'minHeight',
        label: 'Min Height',
        type: 'text',
        defaultValue: getDefault('minHeight'),
        placeholder: 'e.g., 50px, 10vh',
        category: 'style',
      },
      {
        key: 'maxHeight',
        label: 'Max Height',
        type: 'text',
        defaultValue: getDefault('maxHeight'),
        placeholder: 'e.g., 500px, 80vh',
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


