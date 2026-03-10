import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('heading', key);

export const headingProperties: ElementPropertyGroup = {
  elementId: 'heading',
  displayName: 'Heading',
  properties: {
    content: [
      {
        key: 'text',
        label: 'Heading Text',
        type: 'textarea',
        defaultValue: getDefault('text'),
        placeholder: 'Enter heading text',
        category: 'content',
      },
      {
        key: 'headingTag',
        label: 'Heading Level',
        type: 'select',
        defaultValue: getDefault('headingTag'),
        options: [
          { value: 'h1', label: 'H1 (Largest)' },
          { value: 'h2', label: 'H2' },
          { value: 'h3', label: 'H3' },
          { value: 'h4', label: 'H4' },
          { value: 'h5', label: 'H5' },
          { value: 'h6', label: 'H6 (Smallest)' },
        ],
        category: 'content',
      },
     
    
    ],
    style: [
      {
        key: 'textColor',
        label: 'Text Color',
        type: 'color',
        defaultValue: getDefault('textColor'),
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
      {
        key: 'id',
        label: 'Element ID',
        type: 'text',
        defaultValue: getDefault('id'),
        placeholder: 'custom-id',
        category: 'advanced',
      },
    ],
  },
};

