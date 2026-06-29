import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import {
  AccordionGroup, ButtonGroup, ColorInput, FontSizeInput,
  IconPicker, NumericUnitInput, SelectInput, SpacingInputGroup,
} from '../inputs';

interface ListStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `list` element.
 *
 * Sections:
 *   1. List Type        — bullet / number / check / dash / arrow / star / none / custom
 *   2. Marker           — color, size, gap, chip wrapper (size + bg + radius + border)
 *   3. Layout           — columns, item gap, indent, dividers between items
 *   4. Typography       — font + alignment
 *   5. Color & Hover    — text color + hover color
 *   6. Container        — bg / border / radius / padding (the list as a card)
 */
export const ListStylesBlock: React.FC<ListStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#E11D48';
  const textColor = themeColors?.textColor || '#D1D5DB';
  const listType: string = styles.listType || 'bullet';
  const customIcon: string = styles.bulletIcon || 'fa-check';

  const showsIconMarker = listType === 'check' || listType === 'arrow' || listType === 'star' || listType === 'custom';
  const hasMarker = listType !== 'none';
  const isIconBased = showsIconMarker; // chip styling only matters for icon markers

  const reset = () => {
    const patch = {
      listType: '', bulletIcon: '',
      color: '', markerColor: '', iconColor: '', hoverColor: '',
      itemGap: '', indent: '', columns: '', columnGap: '',
      markerSize: '', markerGap: '', markerContainerSize: '',
      markerBackgroundColor: '', markerBorderRadius: '',
      markerBorderColor: '', markerBorderWidth: '',
      dividerColor: '', dividerWidth: '',
      backgroundColor: '', borderColor: '', borderWidth: '', borderStyle: '', borderRadius: '',
      padding: '', paddingTop: '', paddingRight: '', paddingBottom: '', paddingLeft: '',
      fontFamily: '', fontSize: '', fontWeight: '', lineHeight: '',
      letterSpacing: '', textTransform: '', textAlign: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  const setListType = (t: string) => onUpdate('listType', t);

  // Padding sample read for SpacingInputGroup
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

      {/* ── 1. LIST TYPE ────────────────────────────────────────────── */}
      <AccordionGroup title="List Type" defaultOpen={true}>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: 'bullet', label: 'Bullet', icon: 'fa-circle' },
              { value: 'number', label: 'Number', icon: 'fa-list-ol' },
              { value: 'check',  label: 'Check',  icon: 'fa-check' },
              { value: 'dash',   label: 'Dash',   icon: 'fa-minus' },
              { value: 'arrow',  label: 'Arrow',  icon: 'fa-arrow-right' },
              { value: 'star',   label: 'Star',   icon: 'fa-star' },
              { value: 'custom', label: 'Custom', icon: 'fa-icons' },
              { value: 'none',   label: 'None',   icon: 'fa-ban' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setListType(opt.value)}
                className={`py-2.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                  listType === opt.value
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >
                <i className={`fa-solid ${opt.icon} text-sm`} />
                <span className="text-[9px]">{opt.label}</span>
              </button>
            ))}
          </div>

          {listType === 'custom' && (
            <IconPicker
              label="Custom Icon"
              value={customIcon}
              onChange={(v) => onUpdate('bulletIcon', v)}
            />
          )}
        </div>
      </AccordionGroup>

      {/* ── 2. MARKER ───────────────────────────────────────────────── */}
      {hasMarker && (
        <AccordionGroup title="Marker" defaultOpen={true}>
          <div className="space-y-3">
            {showsIconMarker || listType === 'dash' ? (
              <ColorInput
                label="Marker Color"
                value={styles.markerColor || styles.iconColor || accent}
                onChange={(v) => onUpdate('markerColor', v)}
                onReset={() => onUpdate('markerColor', '')}
              />
            ) : (
              <p className="text-[10px] text-white/40 leading-relaxed">
                Bullet/Number color follows the list's text color.
              </p>
            )}
            {isIconBased && (
              <>
                <NumericUnitInput
                  label="Marker Icon Size"
                  value={styles.markerSize || ''}
                  onChange={(v) => onUpdate('markerSize', v)}
                  placeholder="0.875rem"
                  units={['rem', 'px', 'em']}
                  step={0.0625}
                  min={0.5}
                  max={3}
                />
                <NumericUnitInput
                  label="Marker ↔ Text Gap"
                  value={styles.markerGap || ''}
                  onChange={(v) => onUpdate('markerGap', v)}
                  placeholder="0.625rem"
                  units={['rem', 'px', 'em']}
                  step={0.0625}
                  min={0}
                  max={3}
                />
                <div className="pt-2 mt-1 border-t border-white/5 space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chip (background)</h5>
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    Wrap the marker in a circular chip. Leave empty for no chip.
                  </p>
                  <NumericUnitInput
                    label="Chip Size"
                    value={styles.markerContainerSize || ''}
                    onChange={(v) => onUpdate('markerContainerSize', v)}
                    placeholder="1.5rem"
                    units={['rem', 'px', 'em']}
                    step={0.0625}
                    min={0.75}
                    max={4}
                  />
                  <ColorInput
                    label="Chip Background"
                    value={styles.markerBackgroundColor || ''}
                    onChange={(v) => onUpdate('markerBackgroundColor', v)}
                    onReset={() => onUpdate('markerBackgroundColor', '')}
                  />
                  <NumericUnitInput
                    label="Chip Radius"
                    value={styles.markerBorderRadius || ''}
                    onChange={(v) => onUpdate('markerBorderRadius', v)}
                    placeholder="9999px"
                    units={['px', 'rem', '%']}
                    step={1}
                    min={0}
                    max={48}
                  />
                  <NumericUnitInput
                    label="Chip Border Width"
                    value={styles.markerBorderWidth || ''}
                    onChange={(v) => onUpdate('markerBorderWidth', v)}
                    placeholder="0"
                    units={['px']}
                    step={1}
                    min={0}
                    max={6}
                  />
                  <ColorInput
                    label="Chip Border Color"
                    value={styles.markerBorderColor || ''}
                    onChange={(v) => onUpdate('markerBorderColor', v)}
                    onReset={() => onUpdate('markerBorderColor', '')}
                  />
                </div>
              </>
            )}
          </div>
        </AccordionGroup>
      )}

      {/* ── 3. LAYOUT ───────────────────────────────────────────────── */}
      <AccordionGroup title="Layout" defaultOpen={false}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Columns</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map(n => {
                const active = (parseInt(String(styles.columns), 10) || 1) === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onUpdate('columns', n)}
                    className={`py-2 text-xs font-bold rounded border transition-all ${
                      active
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
          {(parseInt(String(styles.columns), 10) || 1) > 1 && (
            <NumericUnitInput
              label="Column Gap"
              value={styles.columnGap || ''}
              onChange={(v) => onUpdate('columnGap', v)}
              placeholder="2rem"
              units={['rem', 'px', 'em']}
              step={0.125}
              min={0}
              max={6}
            />
          )}
          <NumericUnitInput
            label="Item Gap (rows)"
            value={styles.itemGap || ''}
            onChange={(v) => onUpdate('itemGap', v)}
            placeholder="0.5rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
          <NumericUnitInput
            label="Indent (left padding)"
            value={styles.indent || ''}
            onChange={(v) => onUpdate('indent', v)}
            placeholder="0px"
            units={['px', 'rem', 'em']}
            step={2}
            min={0}
            max={80}
          />

          <div className="pt-2 mt-1 border-t border-white/5 space-y-3">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Dividers</h5>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Adds a thin line between items. Leave color empty for no divider.
            </p>
            <ColorInput
              label="Divider Color"
              value={styles.dividerColor || ''}
              onChange={(v) => onUpdate('dividerColor', v)}
              onReset={() => onUpdate('dividerColor', '')}
            />
            {styles.dividerColor && (
              <NumericUnitInput
                label="Divider Width"
                value={styles.dividerWidth || ''}
                onChange={(v) => onUpdate('dividerWidth', v)}
                placeholder="1px"
                units={['px']}
                step={1}
                min={1}
                max={6}
              />
            )}
          </div>
        </div>
      </AccordionGroup>

      {/* ── 4. TYPOGRAPHY ───────────────────────────────────────────── */}
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
            placeholder="1rem"
          />
          <SelectInput
            label="Font Weight"
            value={String(styles.fontWeight || '400')}
            options={[
              { label: 'Light',    value: '300' },
              { label: 'Regular',  value: '400' },
              { label: 'Medium',   value: '500' },
              { label: 'Semibold', value: '600' },
              { label: 'Bold',     value: '700' },
            ]}
            onChange={(v) => onUpdate('fontWeight', v)}
          />
          <NumericUnitInput
            label="Line Height"
            value={styles.lineHeight || ''}
            onChange={(v) => onUpdate('lineHeight', v)}
            placeholder="1.6"
            units={['', 'px', 'rem', 'em', '%']}
            step={0.05}
            min={0.8}
            max={4}
          />
          <NumericUnitInput
            label="Letter Spacing"
            value={styles.letterSpacing || ''}
            onChange={(v) => onUpdate('letterSpacing', v)}
            placeholder="0"
            units={['em', 'px', 'rem']}
            step={0.01}
            min={-0.5}
            max={1}
          />
          <SelectInput
            label="Text Transform"
            value={styles.textTransform || ''}
            options={[
              { label: 'None',       value: '' },
              { label: 'Uppercase',  value: 'uppercase' },
              { label: 'Lowercase',  value: 'lowercase' },
              { label: 'Capitalize', value: 'capitalize' },
            ]}
            onChange={(v) => onUpdate('textTransform', v)}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
            <ButtonGroup
              value={styles.textAlign || 'left'}
              options={[
                { icon: 'fa-align-left',   value: 'left',   label: 'Left' },
                { icon: 'fa-align-center', value: 'center', label: 'Center' },
                { icon: 'fa-align-right',  value: 'right',  label: 'Right' },
              ]}
              onChange={(v) => onUpdate('textAlign', v)}
            />
          </div>
        </div>
      </AccordionGroup>

      {/* ── 5. COLOR & HOVER ────────────────────────────────────────── */}
      <AccordionGroup title="Color & Hover" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Text Color"
            value={styles.color || textColor}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <ColorInput
            label="Hover Color"
            value={styles.hoverColor || ''}
            onChange={(v) => onUpdate('hoverColor', v)}
            onReset={() => onUpdate('hoverColor', '')}
          />
          <p className="text-[10px] text-white/40 leading-relaxed">
            Hover color tints each item on mouseover. Leave empty for no hover effect.
          </p>
        </div>
      </AccordionGroup>

      {/* ── 6. CONTAINER (list as a card) ───────────────────────────── */}
      <AccordionGroup title="Container" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Wrap the list in a card-like background. Useful for callouts.
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
            max={8}
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
            onChange={(v) => onUpdate('borderStyle', v)}
          />
          <NumericUnitInput
            label="Border Radius"
            value={styles.borderRadius || ''}
            onChange={(v) => onUpdate('borderRadius', v)}
            placeholder="0.5rem"
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
