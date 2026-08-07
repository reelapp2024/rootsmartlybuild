import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import {
  AccordionGroup, ButtonGroup, ColorInput, NumericUnitInput, ResponsiveFontSizeInput, SelectInput,
} from '../inputs';

interface HighlightTextStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `highlight-text` element.
 * The "highlighted word" can be styled in 6 visual modes —
 *   marker / underline / brushstroke / box-outline / strikethrough / none
 * — and we expose color + padding + radius + per-mode tuning.
 */
export const HighlightTextStylesBlock: React.FC<HighlightTextStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#facc15';
  const textColor = themeColors?.textColor || '#D1D5DB';
  const hlMode: string = styles.highlightMode || 'marker';
  const showsBg  = hlMode === 'marker' || hlMode === 'box-outline';
  const showsPad = hlMode === 'marker' || hlMode === 'box-outline';

  const reset = () => {
    const patch: Record<string, any> = {
      highlightMode: '',
      highlightColor: '', highlightTextColor: '',
      highlightPaddingX: '', highlightPaddingY: '', highlightRadius: '',
      color: '',
      fontFamily: '', fontSize: '', fontWeight: '', lineHeight: '', letterSpacing: '',
      textAlign: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      {/* ── RESET ───────────────────────────────────────────────────── */}
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); reset(); }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset to Theme
        </button>
      </div>

      {/* ── 1. HIGHLIGHT STYLE ──────────────────────────────────────── */}
      <AccordionGroup title="Highlight Style" defaultOpen={true}>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'marker',        label: 'Marker',     icon: 'fa-highlighter' },
              { value: 'underline',     label: 'Underline',  icon: 'fa-underline' },
              { value: 'brushstroke',   label: 'Brush',      icon: 'fa-paintbrush' },
              { value: 'box-outline',   label: 'Outline',    icon: 'fa-vector-square' },
              { value: 'strikethrough', label: 'Strike',     icon: 'fa-strikethrough' },
              { value: 'none',          label: 'None',       icon: 'fa-ban' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate('highlightMode', opt.value)}
                className={`py-2.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                  hlMode === opt.value
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >
                <i className={`fa-solid ${opt.icon} text-sm`} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </AccordionGroup>

      {/* ── 2. HIGHLIGHT COLORS ─────────────────────────────────────── */}
      <AccordionGroup title="Highlight Colors" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={
              styles.highlightColor
                ? (hlMode === 'marker' ? 'Highlight Background' : 'Highlight Accent')
                : (hlMode === 'marker' ? 'Highlight Background (Inherited)' : 'Highlight Accent (Inherited)')
            }
            value={styles.highlightColor || accent}
            onChange={(v) => onUpdate('highlightColor', v)}
            onReset={() => onUpdate('highlightColor', '')}
          />
          {showsBg && (
            <ColorInput
              label={styles.highlightTextColor ? "Highlighted Word Text Color" : "Highlighted Word Text Color (Inherited)"}
              value={styles.highlightTextColor || ''}
              onChange={(v) => onUpdate('highlightTextColor', v)}
              onReset={() => onUpdate('highlightTextColor', '')}
            />
          )}
        </div>
      </AccordionGroup>

      {/* ── 3. HIGHLIGHT SHAPE (only for marker/box-outline) ────────── */}
      {showsPad && (
        <AccordionGroup title="Highlight Shape" defaultOpen={false}>
          <div className="space-y-3">
            <NumericUnitInput
              label="Padding (Horizontal)"
              value={styles.highlightPaddingX || ''}
              onChange={(v) => onUpdate('highlightPaddingX', v)}
              placeholder="0.375rem"
              units={['rem', 'px', 'em']}
              step={0.0625}
              min={0}
              max={2}
            />
            <NumericUnitInput
              label="Padding (Vertical)"
              value={styles.highlightPaddingY || ''}
              onChange={(v) => onUpdate('highlightPaddingY', v)}
              placeholder="0.125rem"
              units={['rem', 'px', 'em']}
              step={0.0625}
              min={0}
              max={2}
            />
            <NumericUnitInput
              label="Border Radius"
              value={styles.highlightRadius || ''}
              onChange={(v) => onUpdate('highlightRadius', v)}
              placeholder="0.25rem"
              units={['rem', 'px', '%']}
              step={0.125}
              min={0}
              max={4}
            />
          </div>
        </AccordionGroup>
      )}

      {/* ── 4. PARAGRAPH TYPOGRAPHY ─────────────────────────────────── */}
      <AccordionGroup title="Paragraph Typography" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Font Family"
            value={styles.fontFamily || ''}
            options={[
              { label: 'Theme Default', value: '' },
              ...PRESET_FONTS.map((f) => ({ label: f.name, value: f.value })),
            ]}
            onChange={(v) => onUpdate('fontFamily', v === '' ? undefined : v)}
          />
          <ResponsiveFontSizeInput
            label="Font Size"
            value={styles.fontSize || ''}
            onChange={(v) => onUpdate('fontSize', v)}
            placeholder="1rem"
          />
          <SelectInput
            label="Font Weight"
            value={String(styles.fontWeight || '400')}
            options={[
              { label: 'Light',    value: '300' },
              { label: 'Regular',  value: '400' },
              { label: 'Medium',   value: '500' },
              { label: 'Semibold', value: '600' },
              { label: 'Bold',     value: '700' },
            ]}
            onChange={(v) => onUpdate('fontWeight', v)}
          />
          <NumericUnitInput
            label="Line Height"
            value={styles.lineHeight || ''}
            onChange={(v) => onUpdate('lineHeight', v)}
            placeholder="1.6"
            units={['', 'px', 'rem', 'em', '%']}
            step={0.05}
            min={0.8}
            max={4}
          />
          <NumericUnitInput
            label="Letter Spacing"
            value={styles.letterSpacing || ''}
            onChange={(v) => onUpdate('letterSpacing', v)}
            placeholder="0"
            units={['em', 'px', 'rem']}
            step={0.01}
            min={-0.5}
            max={1}
          />
          <ColorInput
            label={styles.color ? "Text Color (rest of paragraph)" : "Text Color (rest of paragraph) (Inherited)"}
            value={styles.color || textColor}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
            <ButtonGroup
              value={styles.textAlign || 'left'}
              options={[
                { icon: 'fa-align-left',   value: 'left',   label: 'Left' },
                { icon: 'fa-align-center', value: 'center', label: 'Center' },
                { icon: 'fa-align-right',  value: 'right',  label: 'Right' },
              ]}
              onChange={(v) => onUpdate('textAlign', v)}
            />
          </div>
        </div>
      </AccordionGroup>
    </>
  );
};
