import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('image', key);

export const imageProperties: ElementPropertyGroup = {
  elementId: 'image',
  displayName: 'Image',
  properties: {
    content: [
      {
        key: 'imageUrl',
        label: 'Image URL',
        type: 'url',
        defaultValue: getDefault('imageUrl'),
        placeholder: 'https://example.com/image.jpg',
        category: 'content',
      },
      {
        key: 'imageAlt',
        label: 'Alt Text',
        type: 'text',
        defaultValue: getDefault('imageAlt'),
        placeholder: 'Description of image',
        category: 'content',
      },
      {
        key: 'imageTitle',
        label: 'Title',
        type: 'text',
        defaultValue: getDefault('imageTitle'),
        placeholder: 'Image title',
        category: 'content',
      },
    ],
    style: [
      {
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., 100%, 300px, auto',
        category: 'style',
      },
      {
        key: 'height',
        label: 'Height',
        type: 'text',
        defaultValue: getDefault('height'),
        placeholder: 'e.g., auto, 300px, 50%',
        category: 'style',
      },
      {
        key: 'minWidth',
        label: 'Min Width',
        type: 'text',
        defaultValue: getDefault('minWidth'),
        placeholder: 'e.g., 100px, 10%',
        category: 'style',
      },
      {
        key: 'maxWidth',
        label: 'Max Width',
        type: 'text',
        defaultValue: getDefault('maxWidth'),
        placeholder: 'e.g., 100%, 600px',
        category: 'style',
      },
      {
        key: 'minHeight',
        label: 'Min Height',
        type: 'text',
        defaultValue: getDefault('minHeight'),
        placeholder: 'e.g., 100px, 10%',
        category: 'style',
      },
      {
        key: 'maxHeight',
        label: 'Max Height',
        type: 'text',
        defaultValue: getDefault('maxHeight'),
        placeholder: 'e.g., 600px, 50%',
        category: 'style',
      },
      {
        key: 'objectFit',
        label: 'Object Fit',
        type: 'select',
        defaultValue: getDefault('objectFit'),
        options: [
          { value: 'cover', label: 'Cover' },
          { value: 'contain', label: 'Contain' },
          { value: 'fill', label: 'Fill' },
          { value: 'none', label: 'None' },
          { value: 'scale-down', label: 'Scale Down' },
        ],
        category: 'style',
      },
      {
        key: 'borderRadius',
        label: 'Border Radius',
        type: 'text',
        defaultValue: getDefault('borderRadius'),
        placeholder: 'e.g., 8px, 50%',
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
        key: 'lazy',
        label: 'Lazy Load',
        type: 'checkbox',
        defaultValue: getDefault('lazy'),
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


