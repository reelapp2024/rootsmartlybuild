import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import { AccordionGroup, ButtonGroup, ColorInput, FontSizeInput, NumericUnitInput, RangeInput, ResponsiveFontSizeInput, SelectInput, TextInput } from '../inputs';

interface HeadingStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
  /** Push secondaryHeadingColor to the section so the highlighted span re-colors site-wide */
  onSectionStyleUpdate?: (key: string, value: any) => void;
}

const WEIGHT_OPTIONS = [
  { label: 'Light',      value: '300' },
  { label: 'Normal',     value: '400' },
  { label: 'Medium',     value: '500' },
  { label: 'Semibold',   value: '600' },
  { label: 'Bold',       value: '700' },
  { label: 'Extra Bold', value: '800' },
  { label: 'Black',      value: '900' },
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
  { label: 'Soft',          value: '0 2px 8px rgba(0, 0, 0, 0.12)' },
  { label: 'Hard',          value: '2px 2px 0 rgba(0, 0, 0, 0.6)' },
  { label: 'Lifted',        value: '0 4px 14px rgba(0, 0, 0, 0.18)' },
  { label: 'Engraved',      value: '0 1px 0 rgba(255,255,255,0.4), 0 -1px 0 rgba(0,0,0,0.4)' },
  { label: 'Neon Glow',     value: '0 0 12px rgba(225,29,72,0.6), 0 0 24px rgba(225,29,72,0.3)' },
  { label: 'Soft Halo',     value: '0 0 18px rgba(255,255,255,0.4)' },
];

/**
 * Dedicated Design-tab panel for the `heading` element.
 * Group names mirror what's user-visible:
 *   Typography  →   font / size / weight / transform / line-height / letter-spacing / italic / decoration
 *   Color       →   primary text color (gradient toggle inside)
 *   Highlighted Word  →  per-element accent color override
 *   Text Shadow →   preset + custom string
 *   Kicker      →   color + size + spacing for the "OUR FEATURES" line above heading
 */
export const HeadingStylesBlock: React.FC<HeadingStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors, onSectionStyleUpdate,
}) => {
  const accentFallback = themeColors?.secondaryHeadingColor || themeColors?.accentColor || '#E11D48';
  const titleFallback  = themeColors?.titleColor || '#F8FAFC';

  const resetAll = () => {
    const patch: Record<string, any> = {
      textAlign: '', fontFamily: '', fontSize: '', fontWeight: '', fontStyle: '',
      textTransform: '', textDecoration: '', lineHeight: '', letterSpacing: '',
      color: '', secondaryHeadingColor: '', gradientFrom: '', gradientTo: '',
      textShadow: '', kickerColor: '', kickerFontSize: '', kickerLetterSpacing: '', kickerBottomSpace: '',
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
          {/* Alignment — first, since it's most common heading edit */}
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
          {/* Font Size — simple by default, with a "Responsive" toggle that swaps in
              a Min / Preferred / Max set of inputs (assembled into clamp() under the hood). */}
          <ResponsiveFontSizeInput
            label="Font Size"
            value={styles.fontSize || ''}
            onChange={(v) => onUpdate('fontSize', v)}
            placeholder="2.5rem"
          />
          <SelectInput
            label="Font Weight"
            value={styles.fontWeight || '700'}
            options={WEIGHT_OPTIONS}
            onChange={(v) => onUpdate('fontWeight', v)}
          />
          <SelectInput
            label="Text Transform"
            value={styles.textTransform || 'none'}
            options={TRANSFORM_OPTIONS}
            onChange={(v) => onUpdate('textTransform', v === 'none' ? '' : v)}
          />
          <SelectInput
            label="Font Style"
            value={styles.fontStyle || 'normal'}
            options={STYLE_OPTIONS}
            onChange={(v) => onUpdate('fontStyle', v)}
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
            placeholder="1.15"
            units={['', 'px', 'rem', 'em', '%']}
            step={0.05}
            min={0.5}
            max={4}
          />
          <NumericUnitInput
            label="Letter Spacing"
            value={styles.letterSpacing || ''}
            onChange={(v) => onUpdate('letterSpacing', v)}
            placeholder="-0.02em"
            units={['em', 'px', 'rem']}
            step={0.01}
            min={-0.5}
            max={1}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── COLOR ─────────── */}
      <AccordionGroup title="Color & Gradient" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={styles.color ? 'Primary Color' : 'Primary Color (Inherited)'}
            value={styles.color || titleFallback}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <p className="text-[9px] text-white/30 italic ml-1">
            Set both gradient colors below to enable gradient text fill (overrides primary color).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ColorInput
              label="Gradient From"
              value={styles.gradientFrom || ''}
              onChange={(v) => onUpdate('gradientFrom', v)}
              onReset={() => onUpdate('gradientFrom', '')}
            />
            <ColorInput
              label="Gradient To"
              value={styles.gradientTo || ''}
              onChange={(v) => onUpdate('gradientTo', v)}
              onReset={() => onUpdate('gradientTo', '')}
            />
          </div>
          {(styles.gradientFrom || styles.gradientTo) && (
            <button
              type="button"
              onClick={() => { onUpdate('gradientFrom', ''); onUpdate('gradientTo', ''); }}
              className="w-full mt-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white/80 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rotate-left text-[9px]" /> Clear Gradient
            </button>
          )}
        </div>
      </AccordionGroup>

      {/* ─────────── HIGHLIGHTED WORD ─────────── */}
      <AccordionGroup title="Highlighted Word" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Override the accent color used for the "Highlighted Word" set in the Content tab.
            Empty = use the section's secondary heading color.
          </p>
          <ColorInput
            label="Highlight Color"
            value={styles.secondaryHeadingColor || accentFallback}
            onChange={(v) => onUpdate('secondaryHeadingColor', v)}
            onReset={() => onUpdate('secondaryHeadingColor', '')}
          />
          {onSectionStyleUpdate && (
            <button
              type="button"
              onClick={() => onSectionStyleUpdate('secondaryHeadingColor', styles.secondaryHeadingColor || '')}
              className="w-full px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
              title="Apply this color to all headings in the current section"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-[9px] mr-1.5" />
              Apply to whole section
            </button>
          )}
          <p className="text-[9px] text-white/30 italic ml-1">
            Highlight visual style (Color / Filled / Underline) is set in the Content tab.
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

      {/* ─────────── KICKER ─────────── */}
      <AccordionGroup title="Kicker (line above heading)" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Small uppercase line shown above the heading. Set the text in the Content tab.
          </p>
          <ColorInput
            label="Kicker Color"
            value={styles.kickerColor || accentFallback}
            onChange={(v) => onUpdate('kickerColor', v)}
            onReset={() => onUpdate('kickerColor', '')}
          />
          <FontSizeInput
            label="Font Size"
            value={styles.kickerFontSize || ''}
            onChange={(v) => onUpdate('kickerFontSize', v)}
            placeholder="0.75rem"
          />
          <NumericUnitInput
            label="Letter Spacing"
            value={styles.kickerLetterSpacing || ''}
            onChange={(v) => onUpdate('kickerLetterSpacing', v)}
            placeholder="0.18em"
            units={['em', 'px', 'rem']}
            step={0.01}
            min={-0.5}
            max={1}
          />
          <NumericUnitInput
            label="Space Below Kicker"
            value={styles.kickerBottomSpace || ''}
            onChange={(v) => onUpdate('kickerBottomSpace', v)}
            placeholder="0.75rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>
    </>
  );
};
