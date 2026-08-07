import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import { AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput, RangeInput, SelectInput, TextInput } from '../inputs';

interface TestimonialCardStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

const WEIGHT_OPTIONS = [
  { label: 'Light', value: '300' },
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra Bold', value: '800' },
  { label: 'Black', value: '900' },
];

const TRANSFORM_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'UPPERCASE', value: 'uppercase' },
  { label: 'lowercase', value: 'lowercase' },
  { label: 'Capitalize', value: 'capitalize' },
];

const STYLE_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
];

const FONT_OPTIONS = [
  { label: 'Theme Default', value: '' },
  ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
];

/**
 * Dedicated Design-tab controls for the `testimonial-card` element.
 * Label names mirror the Content-tab fields 1-to-1 so users always know
 * which piece of the card each control drives:
 *
 *   Content field        →   Design-tab group
 *   ────────────────────────────────────────────
 *   Quote                →   "Quote Text"
 *   Author               →   "Author Name"
 *   Role / Location      →   "Role / Location"
 *   Service Tag          →   "Service Tag"
 *   Rating               →   "Rating Stars"
 *   Avatar               →   "Avatar"
 *   Verified tick        →   "Verified Tick"
 *   (card itself)        →   "Card"
 */
export const TestimonialCardStylesBlock: React.FC<TestimonialCardStylesBlockProps> = ({ styles, onUpdate, onBatchUpdate, themeColors }) => {
  const accent = themeColors?.accentColor || '#E11D48';

  // Reset clears every style key this block writes — mirrors the prefixes used below.
  const resetAll = () => {
    const keys = Object.keys(styles || {}).filter((k) =>
      k.startsWith('quote') || k.startsWith('author') || k.startsWith('role') ||
      k.startsWith('tag') || k.startsWith('rating') || k.startsWith('avatar') ||
      k.startsWith('verified') || k.startsWith('card') ||
      k === 'backgroundColor' || k === 'borderColor' || k === 'borderRadius' || k === 'padding'
    );
    const patch: Record<string, any> = {};
    keys.forEach((k) => { patch[k] = ''; });
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      {/* ── RESET ─────────────────────────────────────────────────────── */}
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetAll(); }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset to Theme
        </button>
      </div>
      {/* ─────────── QUOTE ─────────── */}
      <AccordionGroup title="Quote Text" defaultOpen={true}>
        <div className="space-y-4">
          <SelectInput
            label="Font Family"
            value={styles.quoteFontFamily || styles.fontFamily || ''}
            options={FONT_OPTIONS}
            onChange={(v: string) => onUpdate('quoteFontFamily', v)}
          />
          <FontSizeInput
            label="Font Size"
            value={styles.quoteFontSize || ''}
            onChange={(v) => onUpdate('quoteFontSize', v)}
            placeholder="1.0625rem"
          />
          <SelectInput
            label="Font Weight"
            value={styles.quoteFontWeight || '500'}
            options={WEIGHT_OPTIONS}
            onChange={(v) => onUpdate('quoteFontWeight', v)}
          />
          <SelectInput
            label="Font Style"
            value={styles.quoteFontStyle || 'normal'}
            options={STYLE_OPTIONS}
            onChange={(v: string) => onUpdate('quoteFontStyle', v)}
          />
          <NumericUnitInput
            label="Line Height"
            value={styles.quoteLineHeight || ''}
            onChange={(v) => onUpdate('quoteLineHeight', v)}
            placeholder="1.6"
            units={['', 'px', 'rem', 'em', '%']}
            step={0.05}
            min={0.5}
            max={4}
          />
          <NumericUnitInput
            label="Letter Spacing"
            value={styles.quoteLetterSpacing || ''}
            onChange={(v) => onUpdate('quoteLetterSpacing', v)}
            placeholder="-0.005em"
            units={['em', 'px', 'rem']}
            step={0.01}
            min={-0.5}
            max={1}
          />
          <ColorInput
            label={styles.quoteColor ? "Text Color" : "Text Color (Inherited)"}
            value={styles.quoteColor || ''}
            onChange={(v) => onUpdate('quoteColor', v)}
            onReset={() => onUpdate('quoteColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── AUTHOR NAME ─────────── */}
      <AccordionGroup title="Author Name" defaultOpen={false}>
        <div className="space-y-4">
          <SelectInput
            label="Font Family"
            value={styles.titleFontFamily || styles.fontFamily || ''}
            options={FONT_OPTIONS}
            onChange={(v: string) => onUpdate('titleFontFamily', v)}
          />
          <FontSizeInput
            label="Font Size"
            value={styles.titleFontSize || ''}
            onChange={(v) => onUpdate('titleFontSize', v)}
            placeholder="0.9375rem"
          />
          <SelectInput
            label="Font Weight"
            value={styles.titleFontWeight || '700'}
            options={WEIGHT_OPTIONS}
            onChange={(v) => onUpdate('titleFontWeight', v)}
          />
          <SelectInput
            label="Text Transform"
            value={styles.titleTextTransform || ''}
            options={TRANSFORM_OPTIONS}
            onChange={(v: string) => onUpdate('titleTextTransform', v)}
          />
          <NumericUnitInput
            label="Letter Spacing"
            value={styles.titleLetterSpacing || ''}
            onChange={(v) => onUpdate('titleLetterSpacing', v)}
            placeholder="-0.005em"
            units={['em', 'px', 'rem']}
            step={0.01}
            min={-0.5}
            max={1}
          />
          <ColorInput
            label={styles.titleColor ? "Text Color" : "Text Color (Inherited)"}
            value={styles.titleColor || ''}
            onChange={(v) => onUpdate('titleColor', v)}
            onReset={() => onUpdate('titleColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── ROLE / LOCATION ─────────── */}
      <AccordionGroup title="Role / Location" defaultOpen={false}>
        <div className="space-y-4">
          <SelectInput
            label="Font Family"
            value={styles.descriptionFontFamily || styles.fontFamily || ''}
            options={FONT_OPTIONS}
            onChange={(v: string) => onUpdate('descriptionFontFamily', v)}
          />
          <FontSizeInput
            label="Font Size"
            value={styles.descriptionFontSize || ''}
            onChange={(v) => onUpdate('descriptionFontSize', v)}
            placeholder="0.75rem"
          />
          <SelectInput
            label="Font Weight"
            value={styles.descriptionFontWeight || '500'}
            options={WEIGHT_OPTIONS}
            onChange={(v) => onUpdate('descriptionFontWeight', v)}
          />
          <SelectInput
            label="Text Transform"
            value={styles.descriptionTextTransform || ''}
            options={TRANSFORM_OPTIONS}
            onChange={(v: string) => onUpdate('descriptionTextTransform', v)}
          />
          <ColorInput
            label={styles.descriptionColor ? "Text Color" : "Text Color (Inherited)"}
            value={styles.descriptionColor || ''}
            onChange={(v) => onUpdate('descriptionColor', v)}
            onReset={() => onUpdate('descriptionColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── SERVICE TAG ─────────── */}
      <AccordionGroup title="Service Tag" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The colored pill at the top-right of the card (shows the service name from the Content tab).
          </p>
          <FontSizeInput
            label="Font Size"
            value={styles.serviceFontSize || ''}
            onChange={(v) => onUpdate('serviceFontSize', v)}
            placeholder="0.65rem"
          />
          <SelectInput
            label="Font Weight"
            value={styles.serviceFontWeight || '800'}
            options={WEIGHT_OPTIONS}
            onChange={(v) => onUpdate('serviceFontWeight', v)}
          />
          <ColorInput
            label={styles.accentColor ? "Tag Color (text + border)" : "Tag Color (text + border) (Inherited)"}
            value={styles.accentColor || ''}
            onChange={(v) => onUpdate('accentColor', v)}
            onReset={() => onUpdate('accentColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── RATING STARS ─────────── */}
      <AccordionGroup title="Rating Stars" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Controls the star row at the top-left (number of filled stars comes from the Content tab).
          </p>
          <TextInput
            label="Star Size"
            value={styles.starSize || ''}
            onChange={(v) => onUpdate('starSize', v)}
            placeholder="0.95rem"
          />
          <ColorInput
            label={styles.starColor ? "Star Color" : "Star Color (Inherited)"}
            value={styles.starColor || ''}
            onChange={(v) => onUpdate('starColor', v)}
            onReset={() => onUpdate('starColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── AVATAR ─────────── */}
      <AccordionGroup title="Avatar" defaultOpen={false}>
        <div className="space-y-4">
          <TextInput
            label="Size"
            value={styles.avatarSize || ''}
            onChange={(v) => onUpdate('avatarSize', v)}
            placeholder="3rem"
          />
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
              Shape
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Circle', value: '50%' },
                { label: 'Rounded', value: '0.75rem' },
                { label: 'Square', value: '0' },
              ].map(opt => {
                const current = styles.avatarBorderRadius !== undefined ? styles.avatarBorderRadius : '50%';
                const active = current === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onUpdate('avatarBorderRadius', opt.value)}
                    className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                      active
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <TextInput
            label="Custom Border Radius"
            value={styles.avatarBorderRadius || ''}
            onChange={(v) => onUpdate('avatarBorderRadius', v)}
            placeholder="50% or 12px"
          />
        </div>
      </AccordionGroup>

      {/* ─────────── VERIFIED TICK ─────────── */}
      <AccordionGroup title="Verified Tick" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The small checkmark next to the author's name (toggle on/off in the Content tab).
          </p>
          <ColorInput
            label={styles.verifiedColor ? "Tick Background" : "Tick Background (Inherited)"}
            value={styles.verifiedColor || ''}
            onChange={(v) => onUpdate('verifiedColor', v)}
            onReset={() => onUpdate('verifiedColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── DATE ─────────── */}
      <AccordionGroup title="Date" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The timestamp shown in the footer — e.g. "3 weeks ago". Set the actual text in the Content tab.
          </p>
          <FontSizeInput
            label="Font Size"
            value={styles.dateFontSize || ''}
            onChange={(v) => onUpdate('dateFontSize', v)}
            placeholder="0.7rem"
          />
          <ColorInput
            label={styles.dateColor ? "Text Color" : "Text Color (Inherited)"}
            value={styles.dateColor || ''}
            onChange={(v) => onUpdate('dateColor', v)}
            onReset={() => onUpdate('dateColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── SOURCE PILL ─────────── */}
      <AccordionGroup title="Source Pill" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The "via Google / Yelp / …" badge in the footer. Choose the platform in the Content tab.
          </p>
          <ColorInput
            label={styles.sourceColor ? "Override Brand Color" : "Override Brand Color (Inherited)"}
            value={styles.sourceColor || ''}
            onChange={(v) => onUpdate('sourceColor', v)}
            onReset={() => onUpdate('sourceColor', '')}
          />
          <p className="text-[9px] text-white/30 italic ml-1">
            Leave empty to use the platform's native brand color (Google blue, Yelp red, etc.).
          </p>
        </div>
      </AccordionGroup>

      {/* ─────────── VERIFIED CUSTOMER PILL ─────────── */}
      <AccordionGroup title="Verified Customer Pill" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The green "Verified Customer" pill (toggle on/off in the Content tab).
          </p>
          <ColorInput
            label={styles.verifiedCustomerColor ? "Pill Color" : "Pill Color (Inherited)"}
            value={styles.verifiedCustomerColor || ''}
            onChange={(v) => onUpdate('verifiedCustomerColor', v)}
            onReset={() => onUpdate('verifiedCustomerColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── HELPFUL COUNT ─────────── */}
      <AccordionGroup title="Helpful Count" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The "👍 X found this helpful" row in the footer. Set the number in the Content tab.
          </p>
          <FontSizeInput
            label="Font Size"
            value={styles.helpfulFontSize || ''}
            onChange={(v) => onUpdate('helpfulFontSize', v)}
            placeholder="0.7rem"
          />
          <ColorInput
            label={styles.helpfulColor ? "Text Color" : "Text Color (Inherited)"}
            value={styles.helpfulColor || ''}
            onChange={(v) => onUpdate('helpfulColor', v)}
            onReset={() => onUpdate('helpfulColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── CRITERIA BREAKDOWN ─────────── */}
      <AccordionGroup title="Criteria Breakdown" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The per-criterion rating row (Quality / Value / Speed). Add criteria in the Content tab.
          </p>
          <ColorInput
            label={styles.criteriaBgColor ? "Chip Background" : "Chip Background (Inherited)"}
            value={styles.criteriaBgColor || ''}
            onChange={(v) => onUpdate('criteriaBgColor', v)}
            onReset={() => onUpdate('criteriaBgColor', '')}
          />
          <ColorInput
            label={styles.criteriaLabelColor ? "Label Color" : "Label Color (Inherited)"}
            value={styles.criteriaLabelColor || ''}
            onChange={(v) => onUpdate('criteriaLabelColor', v)}
            onReset={() => onUpdate('criteriaLabelColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── BUSINESS REPLY ─────────── */}
      <AccordionGroup title="Business Reply" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The nested response box below the quote (enable in the Content tab).
          </p>
          <ColorInput
            label={styles.replyBgColor ? "Reply Background" : "Reply Background (Inherited)"}
            value={styles.replyBgColor || ''}
            onChange={(v) => onUpdate('replyBgColor', v)}
            onReset={() => onUpdate('replyBgColor', '')}
          />
          <ColorInput
            label={styles.replyStripeColor ? "Reply Stripe" : "Reply Stripe (Inherited)"}
            value={styles.replyStripeColor || ''}
            onChange={(v) => onUpdate('replyStripeColor', v)}
            onReset={() => onUpdate('replyStripeColor', '')}
          />
          <ColorInput
            label={styles.replyAuthorColor ? "Reply Author Color" : "Reply Author Color (Inherited)"}
            value={styles.replyAuthorColor || ''}
            onChange={(v) => onUpdate('replyAuthorColor', v)}
            onReset={() => onUpdate('replyAuthorColor', '')}
          />
          <ColorInput
            label={styles.replyTextColor ? "Reply Text Color" : "Reply Text Color (Inherited)"}
            value={styles.replyTextColor || ''}
            onChange={(v) => onUpdate('replyTextColor', v)}
            onReset={() => onUpdate('replyTextColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── ACCENT STRIPE ─────────── */}
      <AccordionGroup title="Accent Stripe" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The colored vertical bar on the card's left edge (toggle in the Content tab).
          </p>
          <TextInput
            label="Stripe Width"
            value={styles.accentStripeWidth || ''}
            onChange={(v) => onUpdate('accentStripeWidth', v)}
            placeholder="4px"
          />
          <ColorInput
            label={styles.accentStripeColor ? "Stripe Color" : "Stripe Color (Inherited)"}
            value={styles.accentStripeColor || ''}
            onChange={(v) => onUpdate('accentStripeColor', v)}
            onReset={() => onUpdate('accentStripeColor', '')}
          />
          <p className="text-[9px] text-white/30 italic ml-1">
            Leave empty to use the card's accent color.
          </p>
        </div>
      </AccordionGroup>

      {/* ─────────── CARD ─────────── */}
      <AccordionGroup title="Card" defaultOpen={false}>
        <div className="space-y-4">
          <ColorInput
            label={styles.backgroundColor ? "Background Color" : "Background Color (Inherited)"}
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
          <RangeInput
            label="Border Width"
            value={styles.borderWidth !== undefined ? parseInt(styles.borderWidth.toString().replace(/[^0-9]/g, '')) || 1 : 1}
            min={0}
            max={8}
            onChange={(v) => onUpdate('borderWidth', `${v}px`)}
          />
          <SelectInput
            label="Border Style"
            value={styles.borderStyle || 'solid'}
            options={[
              { label: 'None',   value: 'none' },
              { label: 'Solid',  value: 'solid' },
              { label: 'Dashed', value: 'dashed' },
              { label: 'Dotted', value: 'dotted' },
              { label: 'Double', value: 'double' },
            ]}
            onChange={(v: any) => onUpdate('borderStyle', v)}
          />
          <RangeInput
            label="Border Radius"
            value={styles.borderRadius !== undefined ? parseInt(styles.borderRadius.toString().replace(/[^0-9]/g, '')) || 24 : 24}
            min={0}
            max={60}
            onChange={(v) => onUpdate('borderRadius', `${v}px`)}
          />
          <TextInput
            label="Padding"
            value={styles.padding || ''}
            onChange={(v) => onUpdate('padding', v)}
            placeholder="2rem"
          />
          <SelectInput
            label="Shadow"
            value={styles.boxShadow || ''}
            options={[
              { label: 'None', value: 'none' },
              { label: 'Subtle', value: '0 1px 2px rgba(15,23,42,0.04)' },
              { label: 'Soft', value: '0 4px 12px -4px rgba(15,23,42,0.08)' },
              { label: 'Medium', value: '0 10px 25px -10px rgba(15,23,42,0.12)' },
              { label: 'Large', value: '0 20px 40px -20px rgba(15,23,42,0.15), 0 8px 16px -8px rgba(15,23,42,0.08)' },
              { label: 'Accent Glow', value: `0 20px 40px -20px ${accent}35, 0 8px 16px -8px rgba(15,23,42,0.08)` },
            ]}
            onChange={(v) => onUpdate('boxShadow', v)}
          />
        </div>
      </AccordionGroup>
    </>
  );
};
