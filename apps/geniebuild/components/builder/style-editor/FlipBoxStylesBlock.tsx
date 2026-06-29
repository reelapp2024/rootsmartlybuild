import React from 'react';
import {
  AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput, SelectInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface FlipBoxStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `flip-box` element.
 * Sections: Layout / Front Face / Back Face / Animation.
 *
 * Note: flip direction + front icon + back button text/link live in the Content tab.
 */
export const FlipBoxStylesBlock: React.FC<FlipBoxStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#3b82f6';
  const titleCol = themeColors?.titleColor || '#F8FAFC';
  const textCol = themeColors?.textColor || '#D1D5DB';

  const reset = () => {
    const patch: Record<string, any> = {
      flipBoxHeight: '', borderRadius: '', flipDuration: '', padding: '',
      accentColor: '',
      frontBg: '', frontBorderColor: '',
      frontTitleColor: '', frontDescColor: '',
      frontIconColor: '', frontIconSize: '',
      backBg: '', backTitleColor: '', backDescColor: '',
      backBtnBg: '', backBtnText: '',
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

      {/* ── 1. LAYOUT ───────────────────────────────────────────────── */}
      <AccordionGroup title="Layout" defaultOpen={true}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Flip direction (left/right/top/bottom) is in the Content tab.
          </p>
          <NumericUnitInput
            label="Box Height"
            value={styles.flipBoxHeight || ''}
            onChange={(v) => onUpdate('flipBoxHeight', v)}
            placeholder="16rem"
            units={['rem', 'px', '%']}
            step={1}
            min={4}
            max={48}
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
            label="Padding (both faces)"
            value={styles.padding || ''}
            onChange={(v) => onUpdate('padding', v)}
            placeholder="1.5rem"
            units={['rem', 'px', 'em']}
            step={0.25}
            min={0}
            max={6}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. FRONT FACE ───────────────────────────────────────────── */}
      <AccordionGroup title="Front Face" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label="Background"
            value={styles.frontBg || ''}
            onChange={(v) => onUpdate('frontBg', v)}
            onReset={() => onUpdate('frontBg', '')}
          />
          <ColorInput
            label="Border Color"
            value={styles.frontBorderColor || ''}
            onChange={(v) => onUpdate('frontBorderColor', v)}
            onReset={() => onUpdate('frontBorderColor', '')}
          />
          <ColorInput
            label="Title Color"
            value={styles.frontTitleColor || titleCol}
            onChange={(v) => onUpdate('frontTitleColor', v)}
            onReset={() => onUpdate('frontTitleColor', '')}
          />
          <ColorInput
            label="Description Color"
            value={styles.frontDescColor || textCol}
            onChange={(v) => onUpdate('frontDescColor', v)}
            onReset={() => onUpdate('frontDescColor', '')}
          />
          <ColorInput
            label="Icon Color"
            value={styles.frontIconColor || accent}
            onChange={(v) => onUpdate('frontIconColor', v)}
            onReset={() => onUpdate('frontIconColor', '')}
          />
          <FontSizeInput
            label="Icon Size"
            value={styles.frontIconSize || ''}
            onChange={(v) => onUpdate('frontIconSize', v)}
            placeholder="2.25rem"
          />
        </div>
      </AccordionGroup>

      {/* ── 3. BACK FACE ────────────────────────────────────────────── */}
      <AccordionGroup title="Back Face" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Background"
            value={styles.backBg || accent}
            onChange={(v) => onUpdate('backBg', v)}
            onReset={() => onUpdate('backBg', '')}
          />
          <ColorInput
            label="Title Color"
            value={styles.backTitleColor || '#FFFFFF'}
            onChange={(v) => onUpdate('backTitleColor', v)}
            onReset={() => onUpdate('backTitleColor', '')}
          />
          <ColorInput
            label="Description Color"
            value={styles.backDescColor || ''}
            onChange={(v) => onUpdate('backDescColor', v)}
            onReset={() => onUpdate('backDescColor', '')}
          />
          <ColorInput
            label="Button Background"
            value={styles.backBtnBg || '#FFFFFF'}
            onChange={(v) => onUpdate('backBtnBg', v)}
            onReset={() => onUpdate('backBtnBg', '')}
          />
          <ColorInput
            label="Button Text Color"
            value={styles.backBtnText || '#000000'}
            onChange={(v) => onUpdate('backBtnText', v)}
            onReset={() => onUpdate('backBtnText', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 3.5 TYPOGRAPHY (shared family + weight + spacing) ──── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <TypographyControls
          styles={styles}
          onUpdate={onUpdate}
          showFontSize={false}
          showAlignment={false}
        />
      </AccordionGroup>

      {/* ── 4. ANIMATION ────────────────────────────────────────────── */}
      <AccordionGroup title="Animation" defaultOpen={false}>
        <SelectInput
          label="Flip Duration"
          value={styles.flipDuration || '700ms'}
          options={[
            { label: 'Fast (400ms)',     value: '400ms' },
            { label: 'Normal (700ms)',   value: '700ms' },
            { label: 'Slow (1000ms)',    value: '1000ms' },
            { label: 'Cinematic (1500ms)', value: '1500ms' },
          ]}
          onChange={(v) => onUpdate('flipDuration', v)}
        />
      </AccordionGroup>
    </>
  );
};
