import React from 'react';
import {
  AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface ReviewCarouselStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `review-carousel` element.
 * Sections: Wrapper / Review Card / Stars / Typography.
 *
 * Reviews list, marquee toggle, marquee speed live in the Content tab.
 */
export const ReviewCarouselStylesBlock: React.FC<ReviewCarouselStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const titleCol = themeColors?.titleColor || '#F8FAFC';
  const textCol = themeColors?.textColor || '#D1D5DB';

  const reset = () => {
    const patch: Record<string, any> = {
      wrapBg: '', wrapBorder: '', wrapPadding: '', wrapRadius: '',
      backgroundColor: '', borderColor: '', borderRadius: '', padding: '',
      reviewCardBg: '', reviewCardBorder: '', reviewCardRadius: '',
      reviewCardWidth: '', reviewCardGap: '',
      starColor: '',
      reviewTextColor: '', authorColor: '',
      reviewFontSize: '', authorFontSize: '',
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

      {/* ── 1. WRAPPER ──────────────────────────────────────────────── */}
      <AccordionGroup title="Wrapper" defaultOpen={true}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The outer container around the carousel. Marquee scroll &amp; speed live in the Content tab.
          </p>
          <ColorInput
            label={styles.wrapBg ? "Background" : "Background (Inherited)"}
            value={styles.wrapBg || ''}
            onChange={(v) => onUpdate('wrapBg', v)}
            onReset={() => onUpdate('wrapBg', '')}
          />
          <ColorInput
            label={styles.wrapBorder ? "Border Color" : "Border Color (Inherited)"}
            value={styles.wrapBorder || ''}
            onChange={(v) => onUpdate('wrapBorder', v)}
            onReset={() => onUpdate('wrapBorder', '')}
          />
          <NumericUnitInput
            label="Border Radius"
            value={styles.wrapRadius || ''}
            onChange={(v) => onUpdate('wrapRadius', v)}
            placeholder="0.75rem"
            units={['rem', 'px', '%']}
            step={0.125}
            min={0}
            max={4}
          />
          <NumericUnitInput
            label="Padding"
            value={styles.wrapPadding || ''}
            onChange={(v) => onUpdate('wrapPadding', v)}
            placeholder="1.5rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. REVIEW CARD ──────────────────────────────────────────── */}
      <AccordionGroup title="Review Card" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={styles.reviewCardBg ? "Card Background" : "Card Background (Inherited)"}
            value={styles.reviewCardBg || ''}
            onChange={(v) => onUpdate('reviewCardBg', v)}
            onReset={() => onUpdate('reviewCardBg', '')}
          />
          <ColorInput
            label={styles.reviewCardBorder ? "Card Border" : "Card Border (Inherited)"}
            value={styles.reviewCardBorder || ''}
            onChange={(v) => onUpdate('reviewCardBorder', v)}
            onReset={() => onUpdate('reviewCardBorder', '')}
          />
          <NumericUnitInput
            label="Card Width"
            value={styles.reviewCardWidth || ''}
            onChange={(v) => onUpdate('reviewCardWidth', v)}
            placeholder="260px"
            units={['px', 'rem', '%']}
            step={20}
            min={150}
            max={500}
          />
          <NumericUnitInput
            label="Gap Between Cards"
            value={styles.reviewCardGap || ''}
            onChange={(v) => onUpdate('reviewCardGap', v)}
            placeholder="1rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
          <NumericUnitInput
            label="Card Border Radius"
            value={styles.reviewCardRadius || ''}
            onChange={(v) => onUpdate('reviewCardRadius', v)}
            placeholder="0.5rem"
            units={['rem', 'px', '%']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>

      {/* ── 3. STARS ────────────────────────────────────────────────── */}
      <AccordionGroup title="Star Rating" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Per-review rating (1–5) is in the Content tab.
          </p>
          <ColorInput
            label={styles.starColor ? "Star Color" : "Star Color (Inherited)"}
            value={styles.starColor || '#F59E0B'}
            onChange={(v) => onUpdate('starColor', v)}
            onReset={() => onUpdate('starColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 4. TYPOGRAPHY ───────────────────────────────────────────── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.reviewTextColor ? "Review Text Color" : "Review Text Color (Inherited)"}
            value={styles.reviewTextColor || textCol}
            onChange={(v) => onUpdate('reviewTextColor', v)}
            onReset={() => onUpdate('reviewTextColor', '')}
          />
          <FontSizeInput
            label="Review Font Size"
            value={styles.reviewFontSize || ''}
            onChange={(v) => onUpdate('reviewFontSize', v)}
            placeholder="0.875rem"
          />
          <ColorInput
            label={styles.authorColor ? "Author Color" : "Author Color (Inherited)"}
            value={styles.authorColor || titleCol}
            onChange={(v) => onUpdate('authorColor', v)}
            onReset={() => onUpdate('authorColor', '')}
          />
          <FontSizeInput
            label="Author Font Size"
            value={styles.authorFontSize || ''}
            onChange={(v) => onUpdate('authorFontSize', v)}
            placeholder="0.75rem"
          />
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
    </>
  );
};
