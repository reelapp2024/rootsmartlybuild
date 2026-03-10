import { ElementPropertyGroup } from './index';
import { getPropertyDefaultValue } from './defaults';

// Get all defaults from unified defaults (single source of truth)
const getDefault = (key: string) => getPropertyDefaultValue('video', key);

export const videoProperties: ElementPropertyGroup = {
  elementId: 'video',
  displayName: 'Video',
  properties: {
    content: [
      {
        key: 'videoUrl',
        label: 'Video URL',
        type: 'url',
        defaultValue: getDefault('videoUrl'),
        placeholder: 'https://example.com/video.mp4 or YouTube embed URL',
        category: 'content',
      },
      {
        key: 'videoAlt',
        label: 'Alt Text',
        type: 'text',
        defaultValue: getDefault('videoAlt'),
        placeholder: 'Description of video',
        category: 'content',
      },
      {
        key: 'poster',
        label: 'Poster Image URL',
        type: 'url',
        defaultValue: getDefault('poster'),
        placeholder: 'Thumbnail image URL',
        category: 'content',
      },
    ],
    style: [
      {
        key: 'width',
        label: 'Width',
        type: 'text',
        defaultValue: getDefault('width'),
        placeholder: 'e.g., 100%, 600px',
        category: 'style',
      },
      {
        key: 'height',
        label: 'Height',
        type: 'text',
        defaultValue: getDefault('height'),
        placeholder: 'e.g., auto, 400px',
        category: 'style',
      },
      {
        key: 'maxWidth',
        label: 'Max Width',
        type: 'text',
        defaultValue: getDefault('maxWidth'),
        placeholder: 'e.g., 100%, 800px',
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
        key: 'controls',
        label: 'Show Controls',
        type: 'checkbox',
        defaultValue: getDefault('controls'),
        category: 'advanced',
      },
      {
        key: 'autoplay',
        label: 'Autoplay',
        type: 'checkbox',
        defaultValue: getDefault('autoplay'),
        category: 'advanced',
      },
      {
        key: 'loop',
        label: 'Loop',
        type: 'checkbox',
        defaultValue: getDefault('loop'),
        category: 'advanced',
      },
      {
        key: 'muted',
        label: 'Muted',
        type: 'checkbox',
        defaultValue: getDefault('muted'),
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


