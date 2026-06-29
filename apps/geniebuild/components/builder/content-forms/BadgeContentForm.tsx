import React from 'react';
import { IconPicker, RangeInput, SelectInput, TextInput } from '../inputs';
import { LinkNewTabToggle } from './LinkNewTabToggle';
import type { ContentFormProps } from './types';

type FormProps = ContentFormProps;

export const BadgeContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const iconPosition = content.iconPosition || 'left';
  const hasIcon = content.icon && content.icon !== 'none';

  return (
    <div className="space-y-4">
      <TextInput
        label="Badge Text"
        value={content.text || ''}
        onChange={(v) => onContentUpdate({ text: v })}
        placeholder="Enter badge text"
      />
      <IconPicker
        label="Badge Icon"
        value={content.icon || ''}
        onChange={(v) => {
          const iconValue = v === 'none' ? 'none' : (v.startsWith('fa-') ? v : `fa-${v}`);
          onContentUpdate({ icon: iconValue });
        }}
      />
      {hasIcon && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Icon Position</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onContentUpdate({ iconPosition: 'left' })}
                className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                  iconPosition === 'left'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >Left</button>
              <button
                onClick={() => onContentUpdate({ iconPosition: 'right' })}
                className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                  iconPosition === 'right'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >Right</button>
            </div>
          </div>
          <RangeInput
            label="Icon Size"
            value={content.iconSize ? parseInt(content.iconSize) : 12}
            min={8}
            max={32}
            onChange={(v) => onContentUpdate({ iconSize: `${v}px` })}
          />
          <button
            onClick={() => onContentUpdate({ icon: 'none' })}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <i className="fa-solid fa-trash-can mr-2"></i>Remove Icon
          </button>
        </div>
      )}
      <SelectInput
        label="Pulse Animation"
        value={(content as any)?.pulse || 'none'}
        options={[
          { label: 'None', value: 'none' },
          { label: 'Pulsing dot (for LIVE / NEW)', value: 'pulse-dot' },
          { label: 'Glow (whole badge pulses)', value: 'pulse-glow' },
        ]}
        onChange={(v) => onContentUpdate({ pulse: v })}
      />
      <TextInput
        label="Link (optional URL)"
        value={content?.link || ''}
        onChange={(v) => onContentUpdate({ link: v })}
        placeholder="https://..."
      />
      <LinkNewTabToggle
        visible={!!content?.link && !!String(content.link).trim()}
        value={(content as any).linkNewTab}
        onChange={(v) => onContentUpdate({ linkNewTab: v } as any)}
      />
    </div>
  );
};
