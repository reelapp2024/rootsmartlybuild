import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('select', key);

// Helper to convert options array to string
const defaultOptions = getDefault('options');
const defaultOptionsString = Array.isArray(defaultOptions) 
  ? defaultOptions.join('\n') 
  : (defaultOptions || 'Option 1\nOption 2\nOption 3');

export const selectProperties: ElementPropertyGroup = {
  elementId: 'select',
  displayName: 'Select',
  properties: {
    content: [
      {
        key: 'options',
        label: 'Options',
        type: 'textarea',
        defaultValue: defaultOptionsString,
        placeholder: 'Enter options, one per line',
        category: 'content',
      },
      {
        key: 'placeholder',
        label: 'Placeholder',
        type: 'text',
        defaultValue: getDefault('placeholder'),
        placeholder: 'Placeholder text',
        category: 'content',
      },
      {
        key: 'name',
        label: 'Field Name',
        type: 'text',
        defaultValue: getDefault('name'),
        placeholder: 'Field name for form submission',
        category: 'content',
      },
    ],
    style: [
      {
        key: 'borderRadius',
        label: 'Border Radius',
        type: 'text',
        defaultValue: getDefault('borderRadius'),
        placeholder: 'e.g., 6px, 50%',
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
        key: 'fontSize',
        label: 'Font Size',
        type: 'text',
        defaultValue: getDefault('fontSize'),
        placeholder: 'e.g., 1rem, 16px',
        category: 'style',
      },
      {
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., 100%, 300px',
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
        key: 'required',
        label: 'Required',
        type: 'checkbox',
        defaultValue: getDefault('required'),
        category: 'advanced',
      },
      {
        key: 'disabled',
        label: 'Disabled',
        type: 'checkbox',
        defaultValue: getDefault('disabled'),
        category: 'advanced',
      },
      {
        key: 'multiple',
        label: 'Multiple Selection',
        type: 'checkbox',
        defaultValue: getDefault('multiple'),
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


