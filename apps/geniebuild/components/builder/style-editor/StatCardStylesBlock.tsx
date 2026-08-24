import React from 'react';
import { AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput, SelectInput, RangeInput, TextInput } from '../inputs';

interface StatCardStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

const WEIGHTS = [
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
];
const TRANSFORMS = [
  { label: 'None', value: 'none' },
  { label: 'UPPERCASE', value: 'uppercase' },
  { label: 'lowercase', value: 'lowercase' },
  { label: 'Capitalize', value: 'capitalize' },
];

/**
 * Dedicated Design-tab panel for the `stat-card` element — Elementor-parity.
 * Every sub-part that used to be a hardcoded Tailwind class is now controllable:
 *   • Value (big number): size / weight / color / line-height
 *   • Label: size / weight / transform / letter-spacing / OPACITY / color
 *   • Sub-text: size / weight / OPACITY / color
 *   • Icon container: box size / icon size / colors / radius
 *   • Layout: icon↔value gap, value↔label spacing, card padding/bg/border
 */
export const StatCardStylesBlock: React.FC<StatCardStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const themeAccent = themeColors?.accentColor || '#3b82f6';

  const reset = () => {
    const patch: Record<string, any> = {};
    Object.keys(styles || {}).forEach((k) => {
      if (k.startsWith('title') || k.startsWith('label') || k.startsWith('subText') ||
          k.startsWith('icon') || k === 'iconGap' || k === 'valueBottomSpace' ||
          k === 'padding' || k === 'backgroundColor' || k === 'borderColor' ||
          k === 'borderWidth' || k === 'borderRadius' || k === 'subheadingColor') {
        patch[k] = '';
      }
    });
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  const radius = parseInt(String(styles.borderRadius || '').replace(/[^0-9]/g, '')) || 0;

  return (
    <>
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); reset(); }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset to Theme
        </button>
      </div>

      {/* VALUE — the big number */}
      <AccordionGroup title="Value (big number)" defaultOpen={true}>
        <div className="space-y-3">
          <FontSizeInput label="Font Size" value={styles.titleFontSize || ''} onChange={(v) => onUpdate('titleFontSize', v)} placeholder="1.875rem" />
          <SelectInput label="Font Weight" value={styles.titleFontWeight || '700'} options={WEIGHTS} onChange={(v) => onUpdate('titleFontWeight', v)} />
          <NumericUnitInput label="Line Height" value={styles.titleLineHeight || ''} onChange={(v) => onUpdate('titleLineHeight', v)} placeholder="1.1" units={['', 'px', 'em']} step={0.05} min={0.8} max={3} />
          <ColorInput label={styles.titleColor ? 'Color' : 'Color (Inherited)'} value={styles.titleColor || ''} onChange={(v) => onUpdate('titleColor', v)} onReset={() => onUpdate('titleColor', '')} />
        </div>
      </AccordionGroup>

      {/* LABEL — was locked to text-sm/uppercase/opacity-60 */}
      <AccordionGroup title="Label" defaultOpen={true}>
        <div className="space-y-3">
          <FontSizeInput label="Font Size" value={styles.labelFontSize || ''} onChange={(v) => onUpdate('labelFontSize', v)} placeholder="0.875rem" />
          <SelectInput label="Font Weight" value={styles.labelFontWeight || '600'} options={WEIGHTS} onChange={(v) => onUpdate('labelFontWeight', v)} />
          <SelectInput label="Text Transform" value={styles.labelTextTransform || 'uppercase'} options={TRANSFORMS} onChange={(v) => onUpdate('labelTextTransform', v)} />
          <NumericUnitInput label="Letter Spacing" value={styles.labelLetterSpacing || ''} onChange={(v) => onUpdate('labelLetterSpacing', v)} placeholder="0.05em" units={['em', 'px', 'rem']} step={0.01} min={-0.5} max={1} />
          <RangeInput label="Opacity" value={styles.labelOpacity !== undefined && styles.labelOpacity !== '' ? Math.round(Number(styles.labelOpacity) * 100) : 60} min={0} max={100} step={5} onChange={(v) => onUpdate('labelOpacity', v / 100)} />
          <ColorInput label={styles.subheadingColor ? 'Color' : 'Color (Inherited)'} value={styles.subheadingColor || ''} onChange={(v) => onUpdate('subheadingColor', v)} onReset={() => onUpdate('subheadingColor', '')} />
        </div>
      </AccordionGroup>

      {/* SUB-TEXT — was locked to text-xs/opacity-40 */}
      <AccordionGroup title="Sub-text" defaultOpen={false}>
        <div className="space-y-3">
          <FontSizeInput label="Font Size" value={styles.subTextFontSize || ''} onChange={(v) => onUpdate('subTextFontSize', v)} placeholder="0.75rem" />
          <SelectInput label="Font Weight" value={styles.subTextFontWeight || '400'} options={WEIGHTS} onChange={(v) => onUpdate('subTextFontWeight', v)} />
          <RangeInput label="Opacity" value={styles.subTextOpacity !== undefined && styles.subTextOpacity !== '' ? Math.round(Number(styles.subTextOpacity) * 100) : 40} min={0} max={100} step={5} onChange={(v) => onUpdate('subTextOpacity', v / 100)} />
          <ColorInput label={styles.subTextColor ? 'Color' : 'Color (Inherited)'} value={styles.subTextColor || ''} onChange={(v) => onUpdate('subTextColor', v)} onReset={() => onUpdate('subTextColor', '')} />
        </div>
      </AccordionGroup>

      {/* ICON */}
      <AccordionGroup title="Icon" defaultOpen={false}>
        <div className="space-y-3">
          <TextInput label="Container Size" value={styles.iconContainerSize || ''} onChange={(v) => onUpdate('iconContainerSize', v)} placeholder="2.5rem" />
          <TextInput label="Icon Size" value={styles.iconSize || ''} onChange={(v) => onUpdate('iconSize', v)} placeholder="1.125rem" />
          <ColorInput label={styles.iconColor ? 'Icon Color' : 'Icon Color (Inherited)'} value={styles.iconColor || ''} onChange={(v) => onUpdate('iconColor', v)} onReset={() => onUpdate('iconColor', '')} />
          <ColorInput label={styles.iconBackgroundColor ? 'Icon Background' : 'Icon Background (Auto)'} value={styles.iconBackgroundColor || ''} onChange={(v) => onUpdate('iconBackgroundColor', v)} onReset={() => onUpdate('iconBackgroundColor', '')} />
          <NumericUnitInput label="Icon Radius" value={styles.iconBorderRadius || ''} onChange={(v) => onUpdate('iconBorderRadius', v)} placeholder="0.5rem" units={['px', 'rem', '%']} step={1} min={0} max={100} />
        </div>
      </AccordionGroup>

      {/* LAYOUT */}
      <AccordionGroup title="Layout & Spacing" defaultOpen={false}>
        <div className="space-y-3">
          <NumericUnitInput label="Icon ↔ Value Gap" value={styles.iconGap || ''} onChange={(v) => onUpdate('iconGap', v)} placeholder="1rem" units={['rem', 'px', 'em']} step={1} min={0} max={80} />
          <NumericUnitInput label="Value ↔ Label Spacing" value={styles.valueBottomSpace || ''} onChange={(v) => onUpdate('valueBottomSpace', v)} placeholder="0.75rem" units={['rem', 'px', 'em']} step={1} min={0} max={80} />
          <NumericUnitInput label="Label ↔ Sub-text Spacing" value={styles.labelBottomSpace || ''} onChange={(v) => onUpdate('labelBottomSpace', v)} placeholder="0.25rem" units={['rem', 'px', 'em']} step={0.125} min={0} max={4} />
          <TextInput label="Card Padding" value={styles.padding || ''} onChange={(v) => onUpdate('padding', v)} placeholder="1.5rem" />
          <ColorInput label={styles.backgroundColor ? 'Background' : 'Background (Inherited)'} value={styles.backgroundColor || ''} onChange={(v) => onUpdate('backgroundColor', v)} onReset={() => onUpdate('backgroundColor', '')} />
          <ColorInput label={styles.borderColor ? 'Border Color' : 'Border Color (Inherited)'} value={styles.borderColor || ''} onChange={(v) => onUpdate('borderColor', v)} onReset={() => onUpdate('borderColor', '')} />
          <RangeInput label="Corner Radius" value={radius} min={0} max={48} step={1} onChange={(v) => onUpdate('borderRadius', `${v}px`)} />
        </div>
      </AccordionGroup>
    </>
  );
};
