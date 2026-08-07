import React from 'react';
import {
  AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput, SelectInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface ToggleStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `toggle` element.
 * Sections: Switch / Layout / Typography / Card.
 */
export const ToggleStylesBlock: React.FC<ToggleStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#22c55e';
  const titleCol = themeColors?.titleColor || '#F8FAFC';
  const textCol = themeColors?.textColor || '#D1D5DB';
  const shape: string = styles.switchShape || 'pill';
  const size: string = styles.switchSize || 'md';
  const labelPos: string = styles.labelPosition || 'right';

  const reset = () => {
    const patch: Record<string, any> = {
      switchShape: '', switchSize: '', labelPosition: '',
      switchOnColor: '', switchOffColor: '', switchKnobColor: '',
      titleColor: '', descriptionColor: '', color: '',
      titleFontSize: '', descriptionFontSize: '',
      backgroundColor: '', borderColor: '', borderWidth: '', borderStyle: '', borderRadius: '', padding: '',
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

      {/* ── 1. SWITCH ───────────────────────────────────────────────── */}
      <AccordionGroup title="Switch" defaultOpen={true}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Shape</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'pill',   label: 'Pill',   icon: 'fa-capsules' },
                { value: 'ios',    label: 'iOS',    icon: 'fa-mobile-screen' },
                { value: 'square', label: 'Square', icon: 'fa-square' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('switchShape', opt.value)}
                  className={`py-2.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                    shape === opt.value
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Size</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'sm', label: 'SM' },
                { value: 'md', label: 'MD' },
                { value: 'lg', label: 'LG' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('switchSize', opt.value)}
                  className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                    size === opt.value
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
          <ColorInput
            label={styles.switchOnColor ? "ON Color" : "ON Color (Inherited)"}
            value={styles.switchOnColor || accent}
            onChange={(v) => onUpdate('switchOnColor', v)}
            onReset={() => onUpdate('switchOnColor', '')}
          />
          <ColorInput
            label={styles.switchOffColor ? "OFF Color" : "OFF Color (Inherited)"}
            value={styles.switchOffColor || ''}
            onChange={(v) => onUpdate('switchOffColor', v)}
            onReset={() => onUpdate('switchOffColor', '')}
          />
          <ColorInput
            label={styles.switchKnobColor ? "Knob Color" : "Knob Color (Inherited)"}
            value={styles.switchKnobColor || '#FFFFFF'}
            onChange={(v) => onUpdate('switchKnobColor', v)}
            onReset={() => onUpdate('switchKnobColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. LAYOUT ───────────────────────────────────────────────── */}
      <AccordionGroup title="Layout" defaultOpen={true}>
        <SelectInput
          label="Label Position"
          value={labelPos}
          options={[
            { label: 'Switch on the Right', value: 'right' },
            { label: 'Switch on the Left',  value: 'left' },
          ]}
          onChange={(v) => onUpdate('labelPosition', v)}
        />
      </AccordionGroup>

      {/* ── 3. TYPOGRAPHY ───────────────────────────────────────────── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.titleColor ? "Title Color" : "Title Color (Inherited)"}
            value={styles.titleColor || titleCol}
            onChange={(v) => onUpdate('titleColor', v)}
            onReset={() => onUpdate('titleColor', '')}
          />
          <FontSizeInput
            label="Title Font Size"
            value={styles.titleFontSize || ''}
            onChange={(v) => onUpdate('titleFontSize', v)}
            placeholder="0.95rem"
          />
          <ColorInput
            label={styles.descriptionColor ? "Description Color" : "Description Color (Inherited)"}
            value={styles.descriptionColor || textCol}
            onChange={(v) => onUpdate('descriptionColor', v)}
            onReset={() => onUpdate('descriptionColor', '')}
          />
          <FontSizeInput
            label="Description Font Size"
            value={styles.descriptionFontSize || ''}
            onChange={(v) => onUpdate('descriptionFontSize', v)}
            placeholder="0.875rem"
          />
          {/* Shared typography (font family / weight / style / line-height / letter-spacing / transform) */}
          <div className="pt-2 mt-2 border-t border-white/5">
            <TypographyControls
              styles={styles}
              onUpdate={onUpdate}
              showFontSize={false}
              showAlignment={false}
            />
          </div>
        </div>
      </AccordionGroup>

      {/* ── 4. CARD ─────────────────────────────────────────────────── */}
      <AccordionGroup title="Card" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.backgroundColor ? "Background" : "Background (Inherited)"}
            value={styles.backgroundColor || ''}
            onChange={(v) => onUpdate('backgroundColor', v)}
            onReset={() => onUpdate('backgroundColor', '')}
          />
          <ColorInput
            label={styles.borderColor ? "Border Color" : "Border Color (Inherited)"}
            value={styles.borderColor || ''}
            onChange={(v) => onUpdate('borderColor', v)}
            onReset={() => onUpdate('borderColor', '')}
          />
          <NumericUnitInput
            label="Border Radius"
            value={styles.borderRadius || ''}
            onChange={(v) => onUpdate('borderRadius', v)}
            placeholder="0.5rem"
            units={['rem', 'px', '%']}
            step={0.125}
            min={0}
            max={4}
          />
          <NumericUnitInput
            label="Padding"
            value={styles.padding || ''}
            onChange={(v) => onUpdate('padding', v)}
            placeholder="1rem"
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
