import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import {
  AccordionGroup, ButtonGroup, ColorInput, NumericUnitInput, ResponsiveFontSizeInput, SelectInput,
} from '../inputs';

interface BlockquoteStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `blockquote` element.
 * Sections: Style preset / Colors / Quote typography / Author typography / Layout.
 */
export const BlockquoteStylesBlock: React.FC<BlockquoteStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#E11D48';
  const textColor = themeColors?.textColor || '#D1D5DB';
  const mode: string = styles.blockquoteMode || 'bar-left';
  const showsBar = mode === 'bar-left';
  const showsCard = mode === 'card';

  const reset = () => {
    const patch: Record<string, any> = {
      blockquoteMode: '',
      borderColor: '', authorColor: '', color: '',
      backgroundColor: '', borderWidth: '', borderStyle: '', borderRadius: '',
      fontFamily: '', fontSize: '', fontWeight: '', fontStyle: '',
      lineHeight: '', letterSpacing: '',
      padding: '', textAlign: '',
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

      {/* ── 1. STYLE PRESET ─────────────────────────────────────────── */}
      <AccordionGroup title="Style Preset" defaultOpen={true}>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { value: 'bar-left',    label: 'Bar Left',    icon: 'fa-bars-staggered' },
            { value: 'large-quote', label: 'Large Quote', icon: 'fa-quote-left' },
            { value: 'card',        label: 'Card',        icon: 'fa-square' },
            { value: 'minimal',     label: 'Minimal',     icon: 'fa-italic' },
            { value: 'center',      label: 'Centered',    icon: 'fa-align-center' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate('blockquoteMode', opt.value)}
              className={`flex items-center gap-3 px-3 py-2 rounded border transition-all text-[10px] font-bold uppercase tracking-widest ${
                mode === opt.value
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/50 hover:border-[#444] hover:text-white/80'
              }`}
            >
              <i className={`fa-solid ${opt.icon} w-4 flex-shrink-0`} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </AccordionGroup>

      {/* ── 2. COLORS ───────────────────────────────────────────────── */}
      <AccordionGroup title="Colors" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label="Quote Text Color"
            value={styles.color || textColor}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <ColorInput
            label="Author Color"
            value={styles.authorColor || accent}
            onChange={(v) => onUpdate('authorColor', v)}
            onReset={() => onUpdate('authorColor', '')}
          />
          {showsBar && (
            <ColorInput
              label="Accent Bar Color"
              value={styles.borderColor || accent}
              onChange={(v) => onUpdate('borderColor', v)}
              onReset={() => onUpdate('borderColor', '')}
            />
          )}
          {showsCard && (
            <>
              <ColorInput
                label="Card Background"
                value={styles.backgroundColor || ''}
                onChange={(v) => onUpdate('backgroundColor', v)}
                onReset={() => onUpdate('backgroundColor', '')}
              />
              <ColorInput
                label="Card Border"
                value={styles.borderColor || ''}
                onChange={(v) => onUpdate('borderColor', v)}
                onReset={() => onUpdate('borderColor', '')}
              />
            </>
          )}
        </div>
      </AccordionGroup>

      {/* ── 3. QUOTE TYPOGRAPHY ─────────────────────────────────────── */}
      <AccordionGroup title="Quote Typography" defaultOpen={false}>
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
          <SelectInput
            label="Font Style"
            value={styles.fontStyle || 'italic'}
            options={[
              { label: 'Italic', value: 'italic' },
              { label: 'Normal', value: 'normal' },
            ]}
            onChange={(v) => onUpdate('fontStyle', v)}
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
        </div>
      </AccordionGroup>

      {/* ── 4. LAYOUT ───────────────────────────────────────────────── */}
      <AccordionGroup title="Layout" defaultOpen={false}>
        <div className="space-y-3">
          <NumericUnitInput
            label="Padding"
            value={styles.padding || ''}
            onChange={(v) => onUpdate('padding', v)}
            placeholder={showsCard ? '1.5rem' : '0.5rem'}
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
          {showsCard && (
            <NumericUnitInput
              label="Border Radius"
              value={styles.borderRadius || ''}
              onChange={(v) => onUpdate('borderRadius', v)}
              placeholder="0.75rem"
              units={['rem', 'px', '%']}
              step={0.125}
              min={0}
              max={4}
            />
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
            <ButtonGroup
              value={styles.textAlign || (mode === 'center' ? 'center' : 'left')}
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
