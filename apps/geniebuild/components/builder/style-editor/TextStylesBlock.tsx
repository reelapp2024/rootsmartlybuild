import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import { AccordionGroup, ButtonGroup, ColorInput, NumericUnitInput, RangeInput, ResponsiveFontSizeInput, SelectInput, TextInput } from '../inputs';

interface TextStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

const WEIGHT_OPTIONS = [
  { label: 'Light',      value: '300' },
  { label: 'Normal',     value: '400' },
  { label: 'Medium',     value: '500' },
  { label: 'Semibold',   value: '600' },
  { label: 'Bold',       value: '700' },
];

const TRANSFORM_OPTIONS = [
  { label: 'None',       value: 'none' },
  { label: 'UPPERCASE',  value: 'uppercase' },
  { label: 'lowercase',  value: 'lowercase' },
  { label: 'Capitalize', value: 'capitalize' },
];

const STYLE_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
];

const DECORATION_OPTIONS = [
  { label: 'None',           value: 'none' },
  { label: 'Underline',      value: 'underline' },
  { label: 'Strikethrough',  value: 'line-through' },
  { label: 'Overline',       value: 'overline' },
];

const FONT_OPTIONS = [
  { label: 'Theme Default', value: '' },
  ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
];

const TEXT_SHADOW_PRESETS = [
  { label: 'None',          value: 'none' },
  { label: 'Soft',          value: '0 1px 4px rgba(0, 0, 0, 0.1)' },
  { label: 'Hard',          value: '1px 1px 0 rgba(0, 0, 0, 0.5)' },
  { label: 'Lifted',        value: '0 2px 8px rgba(0, 0, 0, 0.15)' },
  { label: 'Soft Halo',     value: '0 0 12px rgba(255, 255, 255, 0.3)' },
];

/**
 * Dedicated Design-tab panel for the `text` element.
 * Group names mirror what's user-visible:
 *   Typography  →   font / size / weight / italic / transform / decoration / line-height / letter-spacing / paragraph spacing
 *   Color       →   text color + inline link color
 *   Text Shadow →   preset + custom
 *   Drop Cap    →   first-letter big-letter toggle (magazine-style)
 */
export const TextStylesBlock: React.FC<TextStylesBlockProps> = ({ styles, onUpdate, onBatchUpdate, themeColors }) => {
  const textFallback = themeColors?.textColor || '#D1D5DB';
  const linkFallback = themeColors?.accentColor || '#3B82F6';
  const dropCapEnabled = !!styles.dropCap;

  // Reset all text styles back to theme defaults.
  const resetAll = () => {
    const patch: Record<string, any> = {
      textAlign: '', fontFamily: '', fontSize: '', fontWeight: '', fontStyle: '',
      textTransform: '', textDecoration: '', lineHeight: '', letterSpacing: '',
      paragraphSpacing: '', color: '', linkColor: '', textShadow: '',
      dropCap: false, dropCapSize: '', dropCapColor: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      {/* ── RESET ─────────────────────────────────────────────────────── */}
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetAll(); }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset to Theme
        </button>
      </div>

      {/* ─────────── TYPOGRAPHY ─────────── */}
      <AccordionGroup title="Typography" defaultOpen={true}>
        <div className="space-y-4">
          {/* Alignment — most common edit, top of typography */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
            <ButtonGroup
              value={styles.textAlign || 'left'}
              options={[
                { icon: 'fa-align-left',    value: 'left',    label: 'Left' },
                { icon: 'fa-align-center',  value: 'center',  label: 'Center' },
                { icon: 'fa-align-right',   value: 'right',   label: 'Right' },
                { icon: 'fa-align-justify', value: 'justify', label: 'Justify' },
              ]}
              onChange={(v) => onUpdate('textAlign', v)}
            />
          </div>
          <SelectInput
            label="Font Family"
            value={styles.fontFamily || ''}
            options={FONT_OPTIONS}
            onChange={(v: string) => onUpdate('fontFamily', v || undefined)}
          />
          {/* Font Size — simple by default; toggle to Responsive for fluid clamp() scaling. */}
          <ResponsiveFontSizeInput
            label="Font Size"
            value={styles.fontSize || ''}
            onChange={(v) => onUpdate('fontSize', v)}
            placeholder="1rem"
          />
          <SelectInput
            label="Font Weight"
            value={styles.fontWeight || '400'}
            options={WEIGHT_OPTIONS}
            onChange={(v) => onUpdate('fontWeight', v)}
          />
          <SelectInput
            label="Font Style"
            value={styles.fontStyle || 'normal'}
            options={STYLE_OPTIONS}
            onChange={(v) => onUpdate('fontStyle', v)}
          />
          <SelectInput
            label="Text Transform"
            value={styles.textTransform || 'none'}
            options={TRANSFORM_OPTIONS}
            onChange={(v) => onUpdate('textTransform', v === 'none' ? '' : v)}
          />
          <SelectInput
            label="Decoration"
            value={styles.textDecoration || 'none'}
            options={DECORATION_OPTIONS}
            onChange={(v) => onUpdate('textDecoration', v === 'none' ? '' : v)}
          />
          <NumericUnitInput
            label="Line Height"
            value={styles.lineHeight || ''}
            onChange={(v) => onUpdate('lineHeight', v)}
            placeholder="1.6"
            units={['', 'px', 'rem', 'em', '%']}
            step={0.05}
            min={0.5}
            max={4}
          />
          <NumericUnitInput
            label="Letter Spacing"
            value={styles.letterSpacing || ''}
            onChange={(v) => onUpdate('letterSpacing', v)}
            placeholder="0.01em"
            units={['em', 'px', 'rem']}
            step={0.01}
            min={-0.5}
            max={1}
          />
          <NumericUnitInput
            label="Paragraph Spacing"
            value={styles.paragraphSpacing || ''}
            onChange={(v) => onUpdate('paragraphSpacing', v)}
            placeholder="1rem"
            units={['rem', 'px', 'em']}
            step={0.25}
            min={0}
            max={10}
          />
          <p className="text-[9px] text-white/30 italic ml-1">
            Paragraph Spacing controls the bottom margin (gap below this text block).
          </p>
        </div>
      </AccordionGroup>

      {/* ─────────── COLOR ─────────── */}
      <AccordionGroup title="Color" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label="Text Color"
            value={styles.color || textFallback}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <ColorInput
            label="Inline Link Color"
            value={styles.linkColor || linkFallback}
            onChange={(v) => onUpdate('linkColor', v)}
            onReset={() => onUpdate('linkColor', '')}
          />
          <p className="text-[9px] text-white/30 italic ml-1">
            "Inline Link Color" applies to any &lt;a&gt; tags inside the text body.
          </p>
        </div>
      </AccordionGroup>

      {/* ─────────── TEXT SHADOW ─────────── */}
      <AccordionGroup title="Text Shadow" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Preset"
            value={styles.textShadow || 'none'}
            options={TEXT_SHADOW_PRESETS}
            onChange={(v) => onUpdate('textShadow', v === 'none' ? '' : v)}
          />
          <TextInput
            label="Custom Shadow"
            value={styles.textShadow || ''}
            onChange={(v) => onUpdate('textShadow', v)}
            placeholder="0 2px 8px rgba(0,0,0,0.2)"
          />
        </div>
      </AccordionGroup>

      {/* ─────────── DROP CAP ─────────── */}
      <AccordionGroup title="Drop Cap (first letter)" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Enlarges the first letter of the paragraph for a magazine-style opening.
          </p>
          <button
            type="button"
            onClick={() => onUpdate('dropCap', !dropCapEnabled)}
            className={`w-full py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
              dropCapEnabled
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
            }`}
          >
            <i className={`fa-solid ${dropCapEnabled ? 'fa-check' : 'fa-xmark'} mr-2`} />
            {dropCapEnabled ? 'Enabled' : 'Disabled'}
          </button>
          {dropCapEnabled && (
            <>
              <RangeInput
                label="Drop Cap Size"
                value={parseFloat(String(styles.dropCapSize || '3').replace(/[^0-9.]/g, '')) || 3}
                min={2} max={6} step={0.5}
                unit="em"
                onChange={(v) => onUpdate('dropCapSize', `${v}em`)}
              />
              <ColorInput
                label="Drop Cap Color"
                value={styles.dropCapColor || ''}
                onChange={(v) => onUpdate('dropCapColor', v)}
                onReset={() => onUpdate('dropCapColor', '')}
              />
            </>
          )}
        </div>
      </AccordionGroup>
    </>
  );
};
