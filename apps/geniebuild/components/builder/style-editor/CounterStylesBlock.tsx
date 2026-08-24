import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import {
  AccordionGroup, ButtonGroup, ColorInput, FontSizeInput, NumericUnitInput, SelectInput,
} from '../inputs';

interface CounterStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `counter` element.
 * Layout / Number / Label / Card.
 */
export const CounterStylesBlock: React.FC<CounterStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#E11D48';
  const textColor = themeColors?.textColor || '#D1D5DB';
  const mode: string = styles.counterMode || 'card';
  const showsCard = mode === 'card';

  const reset = () => {
    const patch: Record<string, any> = {
      counterMode: '', labelPosition: '',
      numberColor: '', subheadingColor: '', labelColor: '', color: '',
      numberFontSize: '', labelFontSize: '', labelTopSpace: '',
      numberFontWeight: '',
      backgroundColor: '', borderColor: '', borderWidth: '', borderRadius: '', padding: '',
      textAlign: '',
      fontFamily: '',
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

      {/* ── 1. LAYOUT ───────────────────────────────────────────────── */}
      <AccordionGroup title="Layout" defaultOpen={true}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Style</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'card',    label: 'Card',    icon: 'fa-square' },
                { value: 'huge',    label: 'Huge',    icon: 'fa-expand' },
                { value: 'minimal', label: 'Minimal', icon: 'fa-minus' },
                { value: 'inline',  label: 'Inline',  icon: 'fa-arrows-left-right' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('counterMode', opt.value)}
                  className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-2 ${
                    mode === opt.value
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${opt.icon} text-xs`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <SelectInput
            label="Label Position"
            value={styles.labelPosition || 'below'}
            options={[
              { label: 'Below Number', value: 'below' },
              { label: 'Above Number', value: 'above' },
            ]}
            onChange={(v) => onUpdate('labelPosition', v)}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
            <ButtonGroup
              value={styles.textAlign || 'center'}
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

      {/* ── 2. NUMBER ───────────────────────────────────────────────── */}
      <AccordionGroup title="Number" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={styles.numberColor ? "Number Color" : "Number Color (Inherited)"}
            value={styles.numberColor || accent}
            onChange={(v) => onUpdate('numberColor', v)}
            onReset={() => onUpdate('numberColor', '')}
          />
          <FontSizeInput
            label="Number Font Size"
            value={styles.numberFontSize || ''}
            onChange={(v) => onUpdate('numberFontSize', v)}
            placeholder="3rem"
          />
          <SelectInput
            label="Number Weight"
            value={String(styles.numberFontWeight || '800')}
            options={[
              { label: 'Regular',    value: '400' },
              { label: 'Medium',     value: '500' },
              { label: 'Semibold',   value: '600' },
              { label: 'Bold',       value: '700' },
              { label: 'Extra Bold', value: '800' },
              { label: 'Black',      value: '900' },
            ]}
            onChange={(v) => onUpdate('numberFontWeight', v)}
          />
          <SelectInput
            label="Font Family"
            value={styles.fontFamily || ''}
            options={[
              { label: 'Theme Default', value: '' },
              ...PRESET_FONTS.map((f) => ({ label: f.name, value: f.value })),
            ]}
            onChange={(v) => onUpdate('fontFamily', v === '' ? undefined : v)}
          />
        </div>
      </AccordionGroup>

      {/* ── 3. LABEL ────────────────────────────────────────────────── */}
      <AccordionGroup title="Label" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.subheadingColor ? "Label Color" : "Label Color (Inherited)"}
            value={styles.subheadingColor || styles.labelColor || textColor}
            onChange={(v) => onUpdate('subheadingColor', v)}
            onReset={() => onUpdate('subheadingColor', '')}
          />
          <FontSizeInput
            label="Label Font Size"
            value={styles.labelFontSize || ''}
            onChange={(v) => onUpdate('labelFontSize', v)}
            placeholder="0.875rem"
          />
          <NumericUnitInput
            label="Number ↔ Label Gap"
            value={styles.labelTopSpace || ''}
            onChange={(v) => onUpdate('labelTopSpace', v)}
            placeholder="0.5rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>

      {/* ── 4. CARD ─────────────────────────────────────────────────── */}
      {showsCard && (
        <AccordionGroup title="Card" defaultOpen={false}>
          <div className="space-y-3">
            <ColorInput
              label={styles.backgroundColor ? "Card Background" : "Card Background (Inherited)"}
              value={styles.backgroundColor || ''}
              onChange={(v) => onUpdate('backgroundColor', v)}
              onReset={() => onUpdate('backgroundColor', '')}
            />
            <ColorInput
              label={styles.borderColor ? "Card Border" : "Card Border (Inherited)"}
              value={styles.borderColor || ''}
              onChange={(v) => onUpdate('borderColor', v)}
              onReset={() => onUpdate('borderColor', '')}
            />
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
            <NumericUnitInput
              label="Padding"
              value={styles.padding || ''}
              onChange={(v) => onUpdate('padding', v)}
              placeholder="1.5rem"
              units={['rem', 'px', 'em']}
              step={0.125}
              min={0}
              max={4}
            />
          </div>
        </AccordionGroup>
      )}
    </>
  );
};
