import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('list', key);

// Helper to convert items array to string
const defaultItems = getDefault('items');
const defaultItemsString = typeof defaultItems === 'string' 
  ? defaultItems 
  : (Array.isArray(defaultItems) ? defaultItems.join('\n') : 'Item 1\nItem 2\nItem 3');

export const listProperties: ElementPropertyGroup = {
  elementId: 'list',
  displayName: 'List',
  properties: {
    content: [
      {
        key: 'items',
        label: 'List Items',
        type: 'textarea',
        defaultValue: defaultItemsString,
        placeholder: 'Enter items, one per line',
        category: 'content',
      },
      {
        key: 'listType',
        label: 'List Type',
        type: 'select',
        defaultValue: getDefault('listType'),
        options: [
          { value: 'ul', label: 'Unordered (Bullets)' },
          { value: 'ol', label: 'Ordered (Numbers)' },
        ],
        category: 'content',
      },
    ],
    style: [
      {
        key: 'listStyle',
        label: 'List Style',
        type: 'select',
        defaultValue: getDefault('listStyle'),
        options: [
          // Unordered list styles
          { value: 'disc', label: 'Disc (•)' },
          { value: 'circle', label: 'Circle (○)' },
          { value: 'square', label: 'Square (■)' },
          { value: 'none', label: 'None' },
          // Ordered list styles
          { value: 'decimal', label: 'Decimal (1, 2, 3)' },
          { value: 'decimal-leading-zero', label: 'Decimal Leading Zero (01, 02, 03)' },
          { value: 'lower-alpha', label: 'Lower Alpha (a, b, c)' },
          { value: 'upper-alpha', label: 'Upper Alpha (A, B, C)' },
          { value: 'lower-roman', label: 'Lower Roman (i, ii, iii)' },
          { value: 'upper-roman', label: 'Upper Roman (I, II, III)' },
        ],
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


