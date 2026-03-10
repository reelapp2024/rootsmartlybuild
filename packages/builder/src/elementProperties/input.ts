import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('input', key);

export const inputProperties: ElementPropertyGroup = {
  elementId: 'input',
  displayName: 'Input',
  properties: {
    content: [
      {
        key: 'placeholder',
        label: 'Placeholder',
        type: 'text',
        defaultValue: getDefault('placeholder'),
        placeholder: 'Placeholder text',
        category: 'content',
      },
      {
        key: 'type',
        label: 'Input Type',
        type: 'select',
        defaultValue: getDefault('type'),
        options: [
          { value: 'text', label: 'Text' },
          { value: 'email', label: 'Email' },
          { value: 'password', label: 'Password' },
          { value: 'number', label: 'Number' },
          { value: 'tel', label: 'Phone' },
          { value: 'url', label: 'URL' },
          { value: 'date', label: 'Date' },
        ],
        category: 'content',
      },
      {
        key: 'value',
        label: 'Default Value',
        type: 'text',
        defaultValue: getDefault('value'),
        placeholder: 'Default input value',
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


