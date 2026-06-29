import React from 'react';
import { IconPicker, NumericUnitInput } from '../inputs';
import type { ContentFormProps } from './types';

/** Divider element — thin line between sections/elements.
 *  Visual style + (optional) center icon are content-level concerns;
 *  color, thickness, spacing live in the Design tab via DividerStylesBlock. */
export const DividerContentForm: React.FC<ContentFormProps> = ({ content, onContentUpdate }) => {
  const style = String((content as any)?.dividerStyle || 'solid');

  // Inline preview for each style — uses CSS so user sees what they pick.
  const previewLine = (s: string) => {
    const common: React.CSSProperties = { width: '100%', height: '0', borderTopWidth: s === 'double' ? '3px' : '2px' };
    if (s === 'icon') {
      return (
        <div className="flex items-center gap-1.5 w-full">
          <div className="flex-1" style={{ borderTop: '2px solid currentColor' }} />
          <i className="fa-solid fa-star text-[8px]" aria-hidden="true" />
          <div className="flex-1" style={{ borderTop: '2px solid currentColor' }} />
        </div>
      );
    }
    return <div style={{ ...common, borderTopStyle: s as any, borderTopColor: 'currentColor' }} />;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-white/40 uppercase">Divider Style</label>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { value: 'solid',  label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
            { value: 'double', label: 'Double' },
            { value: 'icon',   label: 'Icon Centered' },
          ].map((opt) => {
            const active = style === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onContentUpdate({ dividerStyle: opt.value } as any)}
                className={`flex items-center gap-3 px-3 py-2 rounded border transition-all text-[10px] font-bold uppercase tracking-widest ${
                  active
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/50 hover:border-[#444] hover:text-white/80'
                }`}
              >
                <span className="w-16 text-left flex-shrink-0">{opt.label}</span>
                <span className="flex-1 flex items-center" style={{ color: active ? '#60a5fa' : '#888' }}>
                  {previewLine(opt.value)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {style === 'icon' && (
        <IconPicker
          label="Center Icon"
          value={(content as any)?.icon || 'fa-star'}
          onChange={(v) => {
            const iconValue = v === 'none' ? 'none' : (v.startsWith('fa-') ? v : `fa-${v}`);
            onContentUpdate({ icon: iconValue } as any);
          }}
        />
      )}

      <p className="text-[10px] text-white/40 leading-relaxed">
        Color, thickness &amp; vertical spacing are in the <b>Design</b> tab.
      </p>
    </div>
  );
};

/** Spacer element — pure vertical space between other elements. */
export const SpacerContentForm: React.FC<ContentFormProps> = ({ content, onContentUpdate }) => {
  const height = String((content as any)?.height || '40px');
  // Quick-pick presets for common gaps. One click = no math.
  const PRESETS = [
    { label: 'XS', value: '16px' },
    { label: 'SM', value: '32px' },
    { label: 'MD', value: '64px' },
    { label: 'LG', value: '96px' },
    { label: 'XL', value: '128px' },
  ];
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-white/40 uppercase">Height Preset</label>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onContentUpdate({ height: p.value } as any)}
              className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                height === p.value
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >{p.label}</button>
          ))}
        </div>
      </div>
      <NumericUnitInput
        label="Custom Height"
        value={height}
        onChange={(v) => onContentUpdate({ height: v } as any)}
        placeholder="40px"
        units={['px', 'rem', '%', 'vh']}
        step={4}
        min={0}
        max={500}
      />
      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-300">
        <i className="fa-solid fa-circle-info mr-1" aria-hidden="true"></i>
        A spacer adds pure vertical gap between elements. Use it when you want more breathing room without an extra section.
      </div>
    </div>
  );
};
