import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('button', key);

export const buttonProperties: ElementPropertyGroup = {
  elementId: 'button',
  displayName: 'Button',
  properties: {
    content: [
      {
        key: 'buttonText',
        label: 'Button Text',
        type: 'text',
        defaultValue: getDefault('buttonText'),
        placeholder: 'Enter button text',
        category: 'content',
      },
      {
        key: 'href',
        label: 'Link URL',
        type: 'url',
        defaultValue: getDefault('href'),
        placeholder: 'https://example.com or #section',
        category: 'content',
      },
      {
        key: 'target',
        label: 'Link Target',
        type: 'select',
        defaultValue: getDefault('target'),
        options: [
          { value: '_self', label: 'Same Window' },
          { value: '_blank', label: 'New Window' },
        ],
        category: 'content',
      },
    ],
    style: [
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
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., auto, 100%, 200px',
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
        key: 'hoverStyle',
        label: 'Hover Animation',
        type: 'select',
        defaultValue: getDefault('hoverStyle'),
        options: [
          { value: 'none', label: 'None' },
          { value: 'scale', label: 'Scale Up' },
          { value: 'lift', label: 'Lift Up' },
          { value: 'glow', label: 'Glow' },
          { value: 'shrink', label: 'Shrink' },
          { value: 'rotate', label: 'Rotate' },
        ],
        category: 'style',
      },
      {
        key: 'hoverBackgroundColor',
        label: 'Hover Background Color',
        type: 'color',
        defaultValue: getDefault('hoverBackgroundColor'),
        placeholder: 'Leave empty for auto',
        category: 'style',
      },
      {
        key: 'hoverTextColor',
        label: 'Hover Text Color',
        type: 'color',
        defaultValue: getDefault('hoverTextColor'),
        placeholder: 'Leave empty for auto',
        category: 'style',
      },
      {
        key: 'clickStyle',
        label: 'Click Animation',
        type: 'select',
        defaultValue: getDefault('clickStyle'),
        options: [
          { value: 'none', label: 'None' },
          { value: 'press', label: 'Press Down' },
          { value: 'bounce', label: 'Bounce' },
          { value: 'pulse', label: 'Pulse' },
          { value: 'ripple', label: 'Ripple' },
          { value: 'shrink', label: 'Shrink' },
        ],
        category: 'style',
      },
      {
        key: 'clickBackgroundColor',
        label: 'Click Background Color',
        type: 'color',
        defaultValue: getDefault('clickBackgroundColor'),
        placeholder: 'Leave empty for auto',
        category: 'style',
      },
      {
        key: 'clickTextColor',
        label: 'Click Text Color',
        type: 'color',
        defaultValue: getDefault('clickTextColor'),
        placeholder: 'Leave empty for auto',
        category: 'style',
      },
      {
        key: 'onClick',
        label: 'On Click Action',
        type: 'text',
        defaultValue: getDefault('onClick'),
        placeholder: 'JavaScript function name',
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


