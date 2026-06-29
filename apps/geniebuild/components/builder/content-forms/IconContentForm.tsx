import React from 'react';
import { ColorInput, IconPicker, RangeInput, TextInput } from '../inputs';
import type { IconContentFormProps, ElementStyleInput } from './types';

export const IconContentForm: React.FC<IconContentFormProps> = ({ content, style, onElementUpdate }) => {
  const safeStyle: ElementStyleInput = style || {};

  return (
    <div className="space-y-4">
      <IconPicker
        label="Icon"
        value={content.icon || 'fa-star'}
        onChange={(v) => {
          const iconValue = v.startsWith('fa-') ? v : `fa-${v}`;
          onElementUpdate({ content: { ...content, icon: iconValue } });
        }}
      />
      <RangeInput
        label="Icon Size"
        value={parseInt((content.iconSize || safeStyle.fontSize || '32').toString().replace(/[^0-9]/g, '')) || 32}
        min={16} max={128} step={4} unit="px"
        onChange={(v) => {
          onElementUpdate({
            content: { ...content, iconSize: `${v}px` },
            style: { ...safeStyle, fontSize: `${v}px` },
          });
        }}
      />
      <ColorInput
        label="Icon Color"
        value={safeStyle.color || ''}
        onChange={(v) => onElementUpdate({ style: { ...safeStyle, color: v } })}
      />
      <ColorInput
        label="Background Color"
        value={safeStyle.iconBackgroundColor || ''}
        onChange={(v) => onElementUpdate({ style: { ...safeStyle, iconBackgroundColor: v } })}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Container Size"
          value={safeStyle.iconContainerSize || ''}
          onChange={(v) => onElementUpdate({ style: { ...safeStyle, iconContainerSize: v } })}
          placeholder="3rem"
        />
        <RangeInput
          label="Radius"
          value={parseInt((safeStyle.iconBorderRadius || '0').toString().replace(/[^0-9]/g, '')) || 0}
          min={0} max={100} unit="px"
          onChange={(v) => onElementUpdate({ style: { ...safeStyle, iconBorderRadius: `${v}px` } })}
        />
      </div>
    </div>
  );
};
