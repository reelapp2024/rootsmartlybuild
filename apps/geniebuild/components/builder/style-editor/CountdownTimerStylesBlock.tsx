import React from 'react';
import {
  AccordionGroup, ButtonGroup, ColorInput, FontSizeInput, NumericUnitInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface CountdownTimerStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `countdown-timer` element.
 * Sections: Layout / Numbers / Labels / Boxes (boxed mode only) / Heading.
 */
export const CountdownTimerStylesBlock: React.FC<CountdownTimerStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#F59E0B';
  const titleCol = themeColors?.titleColor || '#F8FAFC';
  const textCol = themeColors?.textColor || '#C7CDD6';
  const mode: string = styles.timerMode || 'boxed';
  const showsBox = mode === 'boxed' || mode === 'flip';

  const reset = () => {
    const patch: Record<string, any> = {
      timerMode: '',
      accentColor: '', numberColor: '', labelColor: '', subheadingColor: '',
      numberFontSize: '', labelFontSize: '', headingFontSize: '',
      timerGap: '',
      boxBackgroundColor: '', boxBorderColor: '', boxBorderRadius: '',
      textAlign: '', color: '',
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
                { value: 'boxed',   label: 'Boxed',   icon: 'fa-square' },
                { value: 'minimal', label: 'Minimal', icon: 'fa-grip-lines' },
                { value: 'flip',    label: 'Flip',    icon: 'fa-clock' },
                { value: 'inline',  label: 'Inline',  icon: 'fa-arrows-left-right' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('timerMode', opt.value)}
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
          <NumericUnitInput
            label="Gap Between Units"
            value={styles.timerGap || ''}
            onChange={(v) => onUpdate('timerGap', v)}
            placeholder="12px"
            units={['px', 'rem', 'em']}
            step={2}
            min={0}
            max={60}
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

      {/* ── 2. NUMBERS ──────────────────────────────────────────────── */}
      <AccordionGroup title="Numbers" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={styles.numberColor ? "Number Color" : "Number Color (Inherited)"}
            value={styles.numberColor || titleCol}
            onChange={(v) => onUpdate('numberColor', v)}
            onReset={() => onUpdate('numberColor', '')}
          />
          <FontSizeInput
            label="Number Font Size"
            value={styles.numberFontSize || ''}
            onChange={(v) => onUpdate('numberFontSize', v)}
            placeholder="1.75rem"
          />
        </div>
      </AccordionGroup>

      {/* ── 3. LABELS ───────────────────────────────────────────────── */}
      <AccordionGroup title="Labels" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.labelColor ? "Label Color" : "Label Color (Inherited)"}
            value={styles.labelColor || textCol}
            onChange={(v) => onUpdate('labelColor', v)}
            onReset={() => onUpdate('labelColor', '')}
          />
          <FontSizeInput
            label="Label Font Size"
            value={styles.labelFontSize || ''}
            onChange={(v) => onUpdate('labelFontSize', v)}
            placeholder="0.625rem"
          />
        </div>
      </AccordionGroup>

      {/* ── 4. BOXES (boxed/flip only) ──────────────────────────────── */}
      {showsBox && (
        <AccordionGroup title="Boxes" defaultOpen={false}>
          <div className="space-y-3">
            <ColorInput
              label={styles.boxBackgroundColor ? "Box Background" : "Box Background (Inherited)"}
              value={styles.boxBackgroundColor || ''}
              onChange={(v) => onUpdate('boxBackgroundColor', v)}
              onReset={() => onUpdate('boxBackgroundColor', '')}
            />
            <ColorInput
              label={styles.boxBorderColor ? "Box Border / Accent" : "Box Border / Accent (Inherited)"}
              value={styles.boxBorderColor || styles.accentColor || accent}
              onChange={(v) => onUpdate('boxBorderColor', v)}
              onReset={() => onUpdate('boxBorderColor', '')}
            />
            <NumericUnitInput
              label="Box Border Radius"
              value={styles.boxBorderRadius || ''}
              onChange={(v) => onUpdate('boxBorderRadius', v)}
              placeholder="8px"
              units={['px', 'rem', '%']}
              step={1}
              min={0}
              max={48}
            />
          </div>
        </AccordionGroup>
      )}

      {/* ── 5. HEADING ──────────────────────────────────────────────── */}
      <AccordionGroup title="Heading (above timer)" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.subheadingColor ? "Heading Color" : "Heading Color (Inherited)"}
            value={styles.subheadingColor || textCol}
            onChange={(v) => onUpdate('subheadingColor', v)}
            onReset={() => onUpdate('subheadingColor', '')}
          />
          <FontSizeInput
            label="Heading Font Size"
            value={styles.headingFontSize || ''}
            onChange={(v) => onUpdate('headingFontSize', v)}
            placeholder="0.75rem"
          />
          <p className="text-[10px] text-white/40 leading-relaxed">
            Toggle <b>Show Heading</b> in the Content tab.
          </p>
        </div>
      </AccordionGroup>

      {/* ── 5.5 TYPOGRAPHY (shared font family + weight + spacing) ─── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <TypographyControls
          styles={styles}
          onUpdate={onUpdate}
          showFontSize={false}
          showAlignment={false}
        />
      </AccordionGroup>

      {/* ── 6. ACCENT (overall) ─────────────────────────────────────── */}
      <AccordionGroup title="Accent" defaultOpen={false}>
        <ColorInput
          label={styles.accentColor ? "Accent Color (used for borders + expired message)" : "Accent Color (used for borders + expired message) (Inherited)"}
          value={styles.accentColor || accent}
          onChange={(v) => onUpdate('accentColor', v)}
          onReset={() => onUpdate('accentColor', '')}
        />
      </AccordionGroup>
    </>
  );
};
