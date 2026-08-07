import React from 'react';
import {
  AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface PricingItemStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `pricing-item` element.
 * Sections: Card / Featured / Plan / Price / Features / CTA Button.
 */
export const PricingItemStylesBlock: React.FC<PricingItemStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#6366f1';
  const titleCol = themeColors?.titleColor || '#111827';
  const textCol = themeColors?.textColor || '#4B5563';
  const liftFeatured: boolean = styles.liftFeatured !== false; // default on

  const reset = () => {
    const patch: Record<string, any> = {
      backgroundColor: '', borderColor: '', borderWidth: '', borderRadius: '', padding: '',
      accentColor: '', liftFeatured: '',
      badgeBgColor: '', badgeTextColor: '',
      planTitleColor: '', planTitleFontSize: '',
      priceColor: '', priceFontSize: '', periodColor: '',
      descriptionColor: '',
      featureColor: '', checkColor: '',
      ctaBgColor: '', ctaTextColor: '',
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
            "Featured" toggle &amp; badge text live in the Content tab.
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
            label={styles.accentColor ? "Accent Color" : "Accent Color (Inherited)"}
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

      {/* ── 2. FEATURED ─────────────────────────────────────────────── */}
      <AccordionGroup title="Featured (popular plan)" defaultOpen={false}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">Lift / Scale Up</div>
              <div className="text-[10px] text-white/40 mt-0.5">When marked Featured, scale 5% &amp; add shadow.</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={liftFeatured}
              onClick={() => onUpdate('liftFeatured', !liftFeatured)}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${liftFeatured ? 'bg-blue-500' : 'bg-[#333]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${liftFeatured ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <ColorInput
            label={styles.badgeBgColor ? "Badge Background" : "Badge Background (Inherited)"}
            value={styles.badgeBgColor || accent}
            onChange={(v) => onUpdate('badgeBgColor', v)}
            onReset={() => onUpdate('badgeBgColor', '')}
          />
          <ColorInput
            label={styles.badgeTextColor ? "Badge Text Color" : "Badge Text Color (Inherited)"}
            value={styles.badgeTextColor || '#FFFFFF'}
            onChange={(v) => onUpdate('badgeTextColor', v)}
            onReset={() => onUpdate('badgeTextColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 3. PLAN TITLE ───────────────────────────────────────────── */}
      <AccordionGroup title="Plan Title" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.planTitleColor ? "Title Color" : "Title Color (Inherited)"}
            value={styles.planTitleColor || titleCol}
            onChange={(v) => onUpdate('planTitleColor', v)}
            onReset={() => onUpdate('planTitleColor', '')}
          />
          <FontSizeInput
            label="Title Font Size"
            value={styles.planTitleFontSize || ''}
            onChange={(v) => onUpdate('planTitleFontSize', v)}
            placeholder="1.25rem"
          />
        </div>
      </AccordionGroup>

      {/* ── 4. PRICE ────────────────────────────────────────────────── */}
      <AccordionGroup title="Price" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.priceColor ? "Price Color" : "Price Color (Inherited)"}
            value={styles.priceColor || accent}
            onChange={(v) => onUpdate('priceColor', v)}
            onReset={() => onUpdate('priceColor', '')}
          />
          <FontSizeInput
            label="Price Font Size"
            value={styles.priceFontSize || ''}
            onChange={(v) => onUpdate('priceFontSize', v)}
            placeholder="3rem"
          />
          <ColorInput
            label={styles.periodColor ? "Period Color (/month)" : "Period Color (/month) (Inherited)"}
            value={styles.periodColor || textCol}
            onChange={(v) => onUpdate('periodColor', v)}
            onReset={() => onUpdate('periodColor', '')}
          />
          <ColorInput
            label={styles.descriptionColor ? "Description Color" : "Description Color (Inherited)"}
            value={styles.descriptionColor || textCol}
            onChange={(v) => onUpdate('descriptionColor', v)}
            onReset={() => onUpdate('descriptionColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 5. FEATURES ─────────────────────────────────────────────── */}
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
        </div>
      </AccordionGroup>

      {/* ── 5.5 TYPOGRAPHY (shared family + weight + transform + spacing) ── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <TypographyControls
          styles={styles}
          onUpdate={onUpdate}
          showAlignment={false}
          fontSizePlaceholder="1rem"
        />
      </AccordionGroup>

      {/* ── 6. CTA BUTTON ───────────────────────────────────────────── */}
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
