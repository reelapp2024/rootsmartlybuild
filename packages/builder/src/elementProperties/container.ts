import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('container', key);

export const containerProperties: ElementPropertyGroup = {
  elementId: 'container',
  displayName: 'Container',
  properties: {
    content: [],
    style: [
      {
        key: 'display',
        label: 'Container Type',
        type: 'select',
        defaultValue: getDefault('display'),
        options: [
          { value: 'flex', label: 'Flex' },
          { value: 'grid', label: 'Grid' },
        ],
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
        key: 'backgroundImage',
        label: 'Background Image URL',
        type: 'url',
        defaultValue: getDefault('backgroundImage'),
        placeholder: 'https://example.com/img.jpg',
        category: 'style',
      },
      {
        key: 'backgroundImageOpacity',
        label: 'Background Image Opacity',
        type: 'range',
        defaultValue: getDefault('backgroundImageOpacity'),
        min: 0,
        max: 5,
        step: 0.1,
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
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., 100%, 1200px',
        category: 'style',
      },
      {
        key: 'height',
        label: 'Height',
        type: 'text',
        defaultValue: getDefault('height'),
        placeholder: 'e.g., auto, 400px, 100vh',
        category: 'style',
      },
      {
        key: 'minHeight',
        label: 'Min Height',
        type: 'text',
        defaultValue: getDefault('minHeight'),
        placeholder: 'e.g., auto, 200px',
        category: 'style',
      },
      {
        key: 'maxWidth',
        label: 'Max Width',
        type: 'text',
        defaultValue: getDefault('maxWidth'),
        placeholder: 'e.g., 100%, 1200px',
        category: 'style',
      },
      {
        key: 'flexDirection',
        label: 'Flex Direction',
        type: 'select',
        defaultValue: getDefault('flexDirection'),
        options: [
          { value: 'column', label: 'Column (Top to Bottom)' },
          { value: 'row', label: 'Row (Left to Right)' },
          { value: 'column-reverse', label: 'Column Reverse' },
          { value: 'row-reverse', label: 'Row Reverse' },
        ],
        category: 'style',
        showWhen: 'flex', // Only show when display is 'flex'
      },
      {
        key: 'gridColumns',
        label: 'Grid Columns',
        type: 'select',
        defaultValue: getDefault('gridColumns'),
        options: [
          { value: 'auto', label: 'Auto' },
          { value: '1', label: '1 Column' },
          { value: '2', label: '2 Columns' },
          { value: '3', label: '3 Columns' },
          { value: '4', label: '4 Columns' },
          { value: '5', label: '5 Columns' },
          { value: '6', label: '6 Columns' },
        ],
        category: 'style',
        showWhen: 'grid', // Only show when display is 'grid'
      },
      {
        key: 'gridRows',
        label: 'Grid Rows',
        type: 'select',
        defaultValue: getDefault('gridRows'),
        options: [
          { value: 'auto', label: 'Auto' },
          { value: '1', label: '1 Row' },
          { value: '2', label: '2 Rows' },
          { value: '3', label: '3 Rows' },
          { value: '4', label: '4 Rows' },
        ],
        category: 'style',
        showWhen: 'grid', // Only show when display is 'grid'
      },
      {
        key: 'gap',
        label: 'Gap',
        type: 'text',
        defaultValue: getDefault('gap'),
        placeholder: 'e.g., 16px, 1rem',
        category: 'style',
        showWhen: ['flex', 'grid'], // Show for flex and grid
      },
      {
        key: 'justifyContent',
        label: 'Horizontal Position',
        type: 'select',
        defaultValue: getDefault('justifyContent'),
        options: [
          { value: 'flex-start', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'flex-end', label: 'Right' },
          { value: 'space-between', label: 'Space Between' },
          { value: 'space-around', label: 'Space Around' },
        ],
        category: 'style',
        showWhen: 'flex', // Only show when display is 'flex'
      },
      {
        key: 'alignItems',
        label: 'Vertical Position',
        type: 'select',
        defaultValue: getDefault('alignItems'),
        options: [
          { value: 'flex-start', label: 'Top' },
          { value: 'center', label: 'Center' },
          { value: 'flex-end', label: 'Bottom' },
          { value: 'stretch', label: 'Stretch' },
        ],
        category: 'style',
        showWhen: 'flex', // Only show when display is 'flex'
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


