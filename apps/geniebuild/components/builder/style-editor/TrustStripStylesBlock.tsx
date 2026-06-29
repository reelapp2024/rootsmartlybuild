import React from 'react';
import { AccordionGroup, ButtonGroup, ColorInput, FontSizeInput, RangeInput, SelectInput } from '../inputs';
import { PRESET_FONTS } from '../../../constants';

interface TrustStripStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

const parsePx = (val: any, fallback = 0): number => {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return fallback;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Dedicated style block for the trust-strip element.
 * Generic Typography / Border blocks are skipped for this type — see App.tsx.
 *
 * Controls (in order of importance):
 *  1. Layout — alignment (justify) + gap between items
 *  2. Icon — color, bg color, container size, icon size, shape (pill / rounded / square)
 *  3. Label — color, font size, font weight, font family
 */
export const TrustStripStylesBlock: React.FC<TrustStripStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || themeColors?.iconColor || '#E11D48';
  const titleColor = themeColors?.titleColor || '#F8FAFC';

  const justify = styles.justifyContent || 'center';
  const gapPx = parsePx(styles.gap, 24);
  const containerSizePx = parsePx(styles.iconContainerSize, 32);
  const iconSizePx = parsePx(styles.iconSize, 14);

  // Shape buttons map to iconBorderRadius value
  const currentShape = (() => {
    const r = styles.iconBorderRadius;
    if (r === '9999px' || r === '50%') return 'pill';
    if (r === '0px' || r === '0') return 'square';
    return 'rounded';
  })();

  const setShape = (shape: 'pill' | 'rounded' | 'square') => {
    const map = { pill: '9999px', rounded: '8px', square: '0px' };
    onUpdate('iconBorderRadius', map[shape]);
  };

  // Reset all trust-strip styles back to theme defaults (clears element overrides).
  const resetAll = () => {
    const patch: Record<string, any> = {
      justifyContent: '', gap: '',
      iconColor: '', iconBackgroundColor: '', iconContainerSize: '', iconSize: '', iconBorderRadius: '',
      iconBorderStyle: '', iconBorderWidth: '', iconBorderColor: '',
      titleColor: '', titleFontSize: '', titleFontWeight: '', titleFontFamily: '', titleLetterSpacing: '',
    };
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

      {/* ── 1. LAYOUT ─────────────────────────────────────────────────── */}
      <AccordionGroup title="Layout" defaultOpen={true}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
          <ButtonGroup
            value={justify}
            options={[
              { label: 'Left', value: 'flex-start', icon: 'fa-align-left' },
              { label: 'Center', value: 'center', icon: 'fa-align-center' },
              { label: 'Right', value: 'flex-end', icon: 'fa-align-right' },
              { label: 'Spread', value: 'space-between', icon: 'fa-arrows-left-right' },
            ]}
            onChange={(v) => onUpdate('justifyContent', v)}
          />
        </div>
        <RangeInput
          label="Gap Between Items"
          value={gapPx}
          min={4} max={80} step={2} unit="px"
          onChange={(v) => onUpdate('gap', `${v}px`)}
        />
      </AccordionGroup>

      {/* ── 2. ICON ───────────────────────────────────────────────────── */}
      <AccordionGroup title="Icon" defaultOpen={true}>
        <ColorInput
          label="Icon Color"
          value={styles.iconColor || accent}
          onChange={(v) => onUpdate('iconColor', v)}
          onReset={() => onUpdate('iconColor', '')}
        />
        <ColorInput
          label="Icon Background"
          value={styles.iconBackgroundColor || `${accent}25`}
          onChange={(v) => onUpdate('iconBackgroundColor', v)}
          onReset={() => onUpdate('iconBackgroundColor', '')}
        />
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/40 uppercase">Shape</label>
          <ButtonGroup
            value={currentShape}
            options={[
              { label: 'Pill', value: 'pill', icon: 'fa-circle' },
              { label: 'Rounded', value: 'rounded', icon: 'fa-square' },
              { label: 'Square', value: 'square', icon: 'fa-stop' },
            ]}
            onChange={(v) => setShape(v as 'pill' | 'rounded' | 'square')}
          />
        </div>
        <RangeInput
          label="Container Size"
          value={containerSizePx}
          min={20} max={64} step={2} unit="px"
          onChange={(v) => onUpdate('iconContainerSize', `${v}px`)}
        />
        <RangeInput
          label="Icon Size"
          value={iconSizePx}
          min={8} max={32} step={1} unit="px"
          onChange={(v) => onUpdate('iconSize', `${v}px`)}
        />
      </AccordionGroup>

      {/* ── 3. LABEL ──────────────────────────────────────────────────── */}
      <AccordionGroup title="Label" defaultOpen={true}>
        <ColorInput
          label="Label Color"
          value={styles.titleColor || titleColor}
          onChange={(v) => onUpdate('titleColor', v)}
          onReset={() => onUpdate('titleColor', '')}
        />
        <FontSizeInput
          label="Font Size"
          value={styles.titleFontSize || ''}
          onChange={(v) => onUpdate('titleFontSize', v)}
          placeholder="13px"
        />
        <SelectInput
          label="Font Weight"
          value={String(styles.titleFontWeight || '600')}
          options={[
            { label: 'Regular', value: '400' },
            { label: 'Medium', value: '500' },
            { label: 'Semibold', value: '600' },
            { label: 'Bold', value: '700' },
          ]}
          onChange={(v) => onUpdate('titleFontWeight', v)}
        />
        <SelectInput
          label="Font Family"
          value={styles.titleFontFamily || ''}
          options={[
            { label: 'Theme Default', value: '' },
            ...PRESET_FONTS.map((f) => ({ label: f.name, value: f.value })),
          ]}
          onChange={(v) => onUpdate('titleFontFamily', v)}
        />
      </AccordionGroup>
    </>
  );

  // (onBatchUpdate kept on Props for parity with other blocks; not needed for these atomic updates.)
  void onBatchUpdate;
};
