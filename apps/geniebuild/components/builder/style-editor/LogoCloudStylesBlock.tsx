import React from 'react';
import {
  AccordionGroup, ButtonGroup, NumericUnitInput, RangeInput,
} from '../inputs';

interface LogoCloudStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `logo-cloud` element.
 * Sections: Layout / Logo Size / Hover Effect.
 *
 * Note: Logos list, grayscale toggle, marquee toggle, marquee speed all live in the Content tab.
 */
export const LogoCloudStylesBlock: React.FC<LogoCloudStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate,
}) => {
  const justify: string = styles.justifyContent || 'center';

  const reset = () => {
    const patch: Record<string, any> = {
      logoHeight: '', logoGap: '', logoPaddingY: '',
      logoOpacity: '', logoHoverOpacity: '',
      justifyContent: '',
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
          <p className="text-[10px] text-white/40 leading-relaxed">
            Marquee scroll &amp; speed live in the Content tab.
          </p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
            <ButtonGroup
              value={justify}
              options={[
                { icon: 'fa-align-left',          value: 'flex-start',     label: 'Left' },
                { icon: 'fa-align-center',        value: 'center',         label: 'Center' },
                { icon: 'fa-align-right',         value: 'flex-end',       label: 'Right' },
                { icon: 'fa-arrows-left-right',   value: 'space-between',  label: 'Spread' },
              ]}
              onChange={(v) => onUpdate('justifyContent', v)}
            />
          </div>
          <NumericUnitInput
            label="Gap Between Logos"
            value={styles.logoGap || ''}
            onChange={(v) => onUpdate('logoGap', v)}
            placeholder="48px"
            units={['px', 'rem', 'em']}
            step={4}
            min={0}
            max={200}
          />
          <NumericUnitInput
            label="Vertical Padding"
            value={styles.logoPaddingY || ''}
            onChange={(v) => onUpdate('logoPaddingY', v)}
            placeholder="32px"
            units={['px', 'rem', 'em']}
            step={2}
            min={0}
            max={120}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. LOGO SIZE ────────────────────────────────────────────── */}
      <AccordionGroup title="Logo Size" defaultOpen={true}>
        <NumericUnitInput
          label="Logo Height"
          value={styles.logoHeight || ''}
          onChange={(v) => onUpdate('logoHeight', v)}
          placeholder="40px"
          units={['px', 'rem', 'em']}
          step={2}
          min={16}
          max={120}
        />
      </AccordionGroup>

      {/* ── 3. OPACITY (hover-fade effect) ──────────────────────────── */}
      <AccordionGroup title="Opacity" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Idle &amp; hover opacity for each logo. The classic "fade-in on hover" trust-bar look uses ~50% idle, 100% hover.
            (Grayscale mode is set in the Content tab.)
          </p>
          <RangeInput
            label="Idle Opacity"
            value={Math.round((typeof styles.logoOpacity === 'number' ? styles.logoOpacity : 0.5) * 100)}
            min={10} max={100} step={5} unit="%"
            onChange={(v) => onUpdate('logoOpacity', v / 100)}
          />
          <RangeInput
            label="Hover Opacity"
            value={Math.round((typeof styles.logoHoverOpacity === 'number' ? styles.logoHoverOpacity : 1) * 100)}
            min={10} max={100} step={5} unit="%"
            onChange={(v) => onUpdate('logoHoverOpacity', v / 100)}
          />
        </div>
      </AccordionGroup>
    </>
  );
};
