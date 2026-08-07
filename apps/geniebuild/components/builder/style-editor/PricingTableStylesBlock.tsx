import React from 'react';
import {
  AccordionGroup, ColorInput, NumericUnitInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface PricingTableStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `pricing-table` element.
 * Sections: Card / Plan Title / Price / Features / CTA Button.
 */
export const PricingTableStylesBlock: React.FC<PricingTableStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#3b82f6';
  const titleCol = themeColors?.titleColor || '#F8FAFC';
  const textCol = themeColors?.textColor || '#D1D5DB';
  const featureSeparator: boolean = !!styles.featureSeparator;

  const reset = () => {
    const patch: Record<string, any> = {
      backgroundColor: '', borderColor: '', borderWidth: '', borderRadius: '', padding: '',
      planTitleColor: '', priceColor: '', subheadingColor: '',
      featureColor: '', checkColor: '', featureSeparator: '',
      ctaBgColor: '', ctaTextColor: '',
      accentColor: '',
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

      {/* ── 1. CARD ─────────────────────────────────────────────────── */}
      <AccordionGroup title="Card" defaultOpen={true}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            "Most Popular" badge &amp; highlight is toggled in the Content tab.
          </p>
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
          <ColorInput
            label={styles.accentColor ? "Accent Color (popular badge + featured border)" : "Accent Color (popular badge + featured border) (Inherited)"}
            value={styles.accentColor || accent}
            onChange={(v) => onUpdate('accentColor', v)}
            onReset={() => onUpdate('accentColor', '')}
          />
          <NumericUnitInput
            label="Border Radius"
            value={styles.borderRadius || ''}
            onChange={(v) => onUpdate('borderRadius', v)}
            placeholder="1rem"
            units={['rem', 'px', '%']}
            step={0.125}
            min={0}
            max={4}
          />
          <NumericUnitInput
            label="Padding"
            value={styles.padding || ''}
            onChange={(v) => onUpdate('padding', v)}
            placeholder="2rem"
            units={['rem', 'px', 'em']}
            step={0.25}
            min={0}
            max={6}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. PLAN TITLE ───────────────────────────────────────────── */}
      <AccordionGroup title="Plan Title" defaultOpen={false}>
        <ColorInput
          label={styles.planTitleColor ? "Title Color" : "Title Color (Inherited)"}
          value={styles.planTitleColor || titleCol}
          onChange={(v) => onUpdate('planTitleColor', v)}
          onReset={() => onUpdate('planTitleColor', '')}
        />
      </AccordionGroup>

      {/* ── 3. PRICE ────────────────────────────────────────────────── */}
      <AccordionGroup title="Price" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.priceColor ? "Price Color" : "Price Color (Inherited)"}
            value={styles.priceColor || accent}
            onChange={(v) => onUpdate('priceColor', v)}
            onReset={() => onUpdate('priceColor', '')}
          />
          <ColorInput
            label={styles.subheadingColor ? "Period Color (per month)" : "Period Color (per month) (Inherited)"}
            value={styles.subheadingColor || textCol}
            onChange={(v) => onUpdate('subheadingColor', v)}
            onReset={() => onUpdate('subheadingColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 4. FEATURES ─────────────────────────────────────────────── */}
      <AccordionGroup title="Features" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.featureColor ? "Feature Text Color" : "Feature Text Color (Inherited)"}
            value={styles.featureColor || textCol}
            onChange={(v) => onUpdate('featureColor', v)}
            onReset={() => onUpdate('featureColor', '')}
          />
          <ColorInput
            label={styles.checkColor ? "Check Icon Color" : "Check Icon Color (Inherited)"}
            value={styles.checkColor || accent}
            onChange={(v) => onUpdate('checkColor', v)}
            onReset={() => onUpdate('checkColor', '')}
          />
          <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">Feature Separator</div>
              <div className="text-[10px] text-white/40 mt-0.5">Thin line between each feature row.</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={featureSeparator}
              onClick={() => onUpdate('featureSeparator', !featureSeparator)}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${featureSeparator ? 'bg-blue-500' : 'bg-[#333]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${featureSeparator ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </AccordionGroup>

      {/* ── 4.5 TYPOGRAPHY (shared across plan title + features) ──── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <TypographyControls
          styles={styles}
          onUpdate={onUpdate}
          showAlignment={false}
          fontSizePlaceholder="1rem"
        />
      </AccordionGroup>

      {/* ── 5. CTA BUTTON ───────────────────────────────────────────── */}
      <AccordionGroup title="CTA Button" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.ctaBgColor ? "Button Background" : "Button Background (Inherited)"}
            value={styles.ctaBgColor || accent}
            onChange={(v) => onUpdate('ctaBgColor', v)}
            onReset={() => onUpdate('ctaBgColor', '')}
          />
          <ColorInput
            label={styles.ctaTextColor ? "Button Text Color" : "Button Text Color (Inherited)"}
            value={styles.ctaTextColor || '#FFFFFF'}
            onChange={(v) => onUpdate('ctaTextColor', v)}
            onReset={() => onUpdate('ctaTextColor', '')}
          />
        </div>
      </AccordionGroup>

    </>
  );
};
