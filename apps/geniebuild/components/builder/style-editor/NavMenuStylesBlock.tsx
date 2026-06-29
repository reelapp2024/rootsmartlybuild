import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import {
  AccordionGroup, ButtonGroup, ColorInput, FontSizeInput,
  NumericUnitInput, SelectInput, SpacingInputGroup,
} from '../inputs';

interface NavMenuStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `nav-menu` element.
 *
 * Sections:
 *   1. Layout       — orientation, alignment, item gap, item padding
 *   2. Indicator    — hover/active style (none/underline/pill/bg)
 *   3. Typography   — font family/size/weight
 *   4. Colors       — link / hover / active colors
 *   5. Mobile       — breakpoint where the menu collapses to a hamburger
 *   6. Container    — bg / border / radius / padding (the nav as a card)
 */
export const NavMenuStylesBlock: React.FC<NavMenuStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#E11D48';
  const itemColor = themeColors?.titleColor || '#111827';

  const reset = () => {
    const patch = {
      orientation: '', justifyContent: '', itemGap: '', itemPadding: '',
      indicator: '',
      fontFamily: '', fontSize: '', fontWeight: '',
      color: '', hoverColor: '', activeColor: '',
      mobileBreakpoint: '',
      backgroundColor: '', borderColor: '', borderWidth: '', borderStyle: '', borderRadius: '',
      padding: '', paddingTop: '', paddingRight: '', paddingBottom: '', paddingLeft: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  // Padding sample for SpacingInputGroup
  const padTop    = styles.paddingTop    || styles.padding || '';
  const padRight  = styles.paddingRight  || styles.padding || '';
  const padBottom = styles.paddingBottom || styles.padding || '';
  const padLeft   = styles.paddingLeft   || styles.padding || '';
  const handlePaddingChange = (next: { top?: string; right?: string; bottom?: string; left?: string }) => {
    const t = next.top ?? padTop, r = next.right ?? padRight, b = next.bottom ?? padBottom, l = next.left ?? padLeft;
    if (t && t === r && r === b && b === l) {
      if (onBatchUpdate) onBatchUpdate({ padding: t, paddingTop: '', paddingRight: '', paddingBottom: '', paddingLeft: '' });
      else { onUpdate('padding', t); onUpdate('paddingTop', ''); onUpdate('paddingRight', ''); onUpdate('paddingBottom', ''); onUpdate('paddingLeft', ''); }
    } else {
      if (onBatchUpdate) onBatchUpdate({ padding: '', paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l });
      else { onUpdate('padding', ''); onUpdate('paddingTop', t); onUpdate('paddingRight', r); onUpdate('paddingBottom', b); onUpdate('paddingLeft', l); }
    }
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
            <label className="text-[10px] font-bold text-white/40 uppercase">Orientation</label>
            <ButtonGroup
              value={styles.orientation || 'horizontal'}
              options={[
                { icon: 'fa-grip-lines',          value: 'horizontal', label: 'Horizontal' },
                { icon: 'fa-grip-lines-vertical', value: 'vertical',   label: 'Vertical' },
              ]}
              onChange={(v) => onUpdate('orientation', v)}
            />
          </div>
          <SelectInput
            label="Alignment"
            value={styles.justifyContent || 'flex-start'}
            options={[
              { label: 'Left',          value: 'flex-start' },
              { label: 'Center',        value: 'center' },
              { label: 'Right',         value: 'flex-end' },
              { label: 'Space Between', value: 'space-between' },
            ]}
            onChange={(v) => onUpdate('justifyContent', v)}
          />
          <NumericUnitInput
            label="Gap Between Items"
            value={styles.itemGap || ''}
            onChange={(v) => onUpdate('itemGap', v)}
            placeholder="1.75rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={6}
          />
          <NumericUnitInput
            label="Item Padding"
            value={styles.itemPadding || ''}
            onChange={(v) => onUpdate('itemPadding', v)}
            placeholder="0.5rem 0.25rem"
            units={['rem', 'px', 'em']}
            step={0.0625}
            min={0}
            max={2}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. INDICATOR ────────────────────────────────────────────── */}
      <AccordionGroup title="Hover Indicator" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Visual feedback when a user hovers over a nav link.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { value: 'none',      label: 'Color Only', icon: 'fa-paint-roller' },
              { value: 'underline', label: 'Underline',  icon: 'fa-underline' },
              { value: 'pill',      label: 'Pill BG',    icon: 'fa-pills' },
              { value: 'bg',        label: 'Soft BG',    icon: 'fa-square' },
            ].map(opt => {
              const active = (styles.indicator || 'underline') === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('indicator', opt.value)}
                  className={`py-2.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${opt.icon} text-sm`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </AccordionGroup>

      {/* ── 3. TYPOGRAPHY ───────────────────────────────────────────── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Font Family"
            value={styles.fontFamily || ''}
            options={[
              { label: 'Theme Default', value: '' },
              ...PRESET_FONTS.map((f) => ({ label: f.name, value: f.value })),
            ]}
            onChange={(v: string) => onUpdate('fontFamily', v === '' ? undefined : v)}
          />
          <FontSizeInput
            label="Font Size"
            value={styles.fontSize || ''}
            onChange={(v) => onUpdate('fontSize', v)}
            placeholder="0.9375rem"
          />
          <SelectInput
            label="Font Weight"
            value={String(styles.fontWeight || '600')}
            options={[
              { label: 'Regular',  value: '400' },
              { label: 'Medium',   value: '500' },
              { label: 'Semibold', value: '600' },
              { label: 'Bold',     value: '700' },
            ]}
            onChange={(v) => onUpdate('fontWeight', v)}
          />
        </div>
      </AccordionGroup>

      {/* ── 4. COLORS ───────────────────────────────────────────────── */}
      <AccordionGroup title="Colors" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Link Color"
            value={styles.color || itemColor}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <ColorInput
            label="Hover Color"
            value={styles.hoverColor || accent}
            onChange={(v) => onUpdate('hoverColor', v)}
            onReset={() => onUpdate('hoverColor', '')}
          />
          <ColorInput
            label="Active Color (current page)"
            value={styles.activeColor || ''}
            onChange={(v) => onUpdate('activeColor', v)}
            onReset={() => onUpdate('activeColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 4.5 DROPDOWN PANEL ──────────────────────────────────────── */}
      <AccordionGroup title="Dropdown Panel" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Surface for dropdown menus that open on hover. Hover and "View All" use the Hover Color above.
          </p>
          <ColorInput
            label="Background"
            value={styles.dropdownBackgroundColor || ''}
            onChange={(v) => onUpdate('dropdownBackgroundColor', v)}
            onReset={() => onUpdate('dropdownBackgroundColor', '')}
          />
          <ColorInput
            label="Border Color"
            value={styles.dropdownBorderColor || ''}
            onChange={(v) => onUpdate('dropdownBorderColor', v)}
            onReset={() => onUpdate('dropdownBorderColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 5. MOBILE ───────────────────────────────────────────────── */}
      <AccordionGroup title="Mobile (Hamburger)" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Below this breakpoint, the menu collapses into a hamburger icon.
          </p>
          <SelectInput
            label="Collapse Below"
            value={styles.mobileBreakpoint || 'lg'}
            options={[
              { label: 'Small (≤ 640px) — only on phones', value: 'sm' },
              { label: 'Medium (≤ 768px) — phones + small tablets', value: 'md' },
              { label: 'Large (≤ 1024px) — phones + tablets', value: 'lg' },
            ]}
            onChange={(v) => onUpdate('mobileBreakpoint', v)}
          />
        </div>
      </AccordionGroup>

      {/* ── 6. CONTAINER ────────────────────────────────────────────── */}
      <AccordionGroup title="Container" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Optional background + border around the whole nav row.
          </p>
          <ColorInput
            label="Background"
            value={styles.backgroundColor || ''}
            onChange={(v) => onUpdate('backgroundColor', v)}
            onReset={() => onUpdate('backgroundColor', '')}
          />
          <ColorInput
            label="Border Color"
            value={styles.borderColor || ''}
            onChange={(v) => onUpdate('borderColor', v)}
            onReset={() => onUpdate('borderColor', '')}
          />
          <NumericUnitInput
            label="Border Width"
            value={styles.borderWidth || ''}
            onChange={(v) => onUpdate('borderWidth', v)}
            placeholder="1px"
            units={['px']}
            step={1}
            min={0}
            max={6}
          />
          <SelectInput
            label="Border Style"
            value={styles.borderStyle || 'solid'}
            options={[
              { label: 'None',   value: 'none' },
              { label: 'Solid',  value: 'solid' },
              { label: 'Dashed', value: 'dashed' },
              { label: 'Dotted', value: 'dotted' },
            ]}
            onChange={(v) => onUpdate('borderStyle', v)}
          />
          <NumericUnitInput
            label="Border Radius"
            value={styles.borderRadius || ''}
            onChange={(v) => onUpdate('borderRadius', v)}
            placeholder="0px"
            units={['rem', 'px', '%']}
            step={0.125}
            min={0}
            max={4}
          />
          <SpacingInputGroup
            label="Padding"
            icon="fa-solid fa-arrows-to-dot"
            values={{ top: padTop, right: padRight, bottom: padBottom, left: padLeft }}
            onChange={handlePaddingChange}
          />
        </div>
      </AccordionGroup>
    </>
  );
};
