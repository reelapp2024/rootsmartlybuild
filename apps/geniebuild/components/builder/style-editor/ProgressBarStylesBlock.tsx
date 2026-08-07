import React from 'react';
import {
  AccordionGroup, ColorInput, NumericUnitInput, SelectInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface ProgressBarStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `progress-bar` element.
 * Sections: Bar / Label / Effects.
 */
export const ProgressBarStylesBlock: React.FC<ProgressBarStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#3b82f6';
  const textCol = themeColors?.textColor || '#D1D5DB';
  const shape: string = styles.barShape || 'pill';
  const labelPos: string = styles.labelPosition || 'top';
  const isStriped: boolean = !!styles.striped;

  const reset = () => {
    const patch: Record<string, any> = {
      fillColor: '', trackColor: '', barShape: '', barHeight: '',
      striped: '', animatedStripes: '',
      labelPosition: '', labelColor: '', insideLabelColor: '',
      color: '',
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

      {/* ── 1. BAR ──────────────────────────────────────────────────── */}
      <AccordionGroup title="Bar" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={styles.fillColor ? "Fill Color" : "Fill Color (Inherited)"}
            value={styles.fillColor || accent}
            onChange={(v) => onUpdate('fillColor', v)}
            onReset={() => onUpdate('fillColor', '')}
          />
          <ColorInput
            label={styles.trackColor ? "Track Color" : "Track Color (Inherited)"}
            value={styles.trackColor || ''}
            onChange={(v) => onUpdate('trackColor', v)}
            onReset={() => onUpdate('trackColor', '')}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Shape</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'pill',   label: 'Pill',    icon: 'fa-capsules' },
                { value: 'rounded', label: 'Rounded', icon: 'fa-square-full' },
                { value: 'square', label: 'Square',  icon: 'fa-square' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('barShape', opt.value)}
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
          <NumericUnitInput
            label="Bar Height"
            value={styles.barHeight || ''}
            onChange={(v) => onUpdate('barHeight', v)}
            placeholder="10px"
            units={['px', 'rem', 'em']}
            step={1}
            min={2}
            max={48}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. LABEL ────────────────────────────────────────────────── */}
      <AccordionGroup title="Label" defaultOpen={true}>
        <div className="space-y-3">
          <SelectInput
            label="Label Position"
            value={labelPos}
            options={[
              { label: 'Above the bar', value: 'top' },
              { label: 'Below the bar', value: 'bottom' },
              { label: 'Inside the bar', value: 'inside' },
            ]}
            onChange={(v) => onUpdate('labelPosition', v)}
          />
          {labelPos !== 'inside' && (
            <ColorInput
              label={styles.labelColor ? "Label Color" : "Label Color (Inherited)"}
              value={styles.labelColor || textCol}
              onChange={(v) => onUpdate('labelColor', v)}
              onReset={() => onUpdate('labelColor', '')}
            />
          )}
          {labelPos === 'inside' && (
            <ColorInput
              label={styles.insideLabelColor ? "Inside Label Color" : "Inside Label Color (Inherited)"}
              value={styles.insideLabelColor || '#FFFFFF'}
              onChange={(v) => onUpdate('insideLabelColor', v)}
              onReset={() => onUpdate('insideLabelColor', '')}
            />
          )}
          <p className="text-[10px] text-white/40 leading-relaxed">
            Toggle <b>Show Label</b> / <b>Show Percent</b> in the Content tab.
          </p>
        </div>
      </AccordionGroup>

      {/* ── 2.5 LABEL TYPOGRAPHY ─────────────────────────────────── */}
      <AccordionGroup title="Label Typography" defaultOpen={false}>
        <TypographyControls
          styles={styles}
          onUpdate={onUpdate}
          showAlignment={false}
          fontSizePlaceholder="0.75rem"
        />
      </AccordionGroup>

      {/* ── 3. EFFECTS ──────────────────────────────────────────────── */}
      <AccordionGroup title="Effects" defaultOpen={false}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">Striped Pattern</div>
              <div className="text-[10px] text-white/40 mt-0.5">Diagonal stripes for active / "in progress" feel.</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isStriped}
              onClick={() => onUpdate('striped', !isStriped)}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isStriped ? 'bg-blue-500' : 'bg-[#333]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isStriped ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {isStriped && (
            <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">Animate Stripes</div>
                <div className="text-[10px] text-white/40 mt-0.5">Stripes scroll continuously.</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={styles.animatedStripes !== false}
                onClick={() => onUpdate('animatedStripes', styles.animatedStripes === false ? true : false)}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${styles.animatedStripes !== false ? 'bg-blue-500' : 'bg-[#333]'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${styles.animatedStripes !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}
        </div>
      </AccordionGroup>
    </>
  );
};
