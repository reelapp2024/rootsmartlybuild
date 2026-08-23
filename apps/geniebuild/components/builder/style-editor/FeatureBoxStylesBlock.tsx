import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import { AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput, RangeInput, SelectInput, SpacingInputGroup, TextInput } from '../inputs';

/**
 * Convert a CSS dimension string (rem / px / em / number) to its pixel equivalent
 * for a slider's numeric value. Falls back to `fallback` when value is empty or invalid.
 */
const cssToPx = (val: any, fallback: number): number => {
  if (val === undefined || val === null || val === '') return fallback;
  const s = String(val).trim();
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*(px|rem|em)?$/i);
  if (!m) return fallback;
  const num = parseFloat(m[1]);
  if (!Number.isFinite(num)) return fallback;
  const unit = (m[2] || 'px').toLowerCase();
  if (unit === 'rem' || unit === 'em') return Math.round(num * 16);
  return Math.round(num);
};

/**
 * CardCornerRadiusControl — same UX as IconBorderRadiusControl but for the
 * card itself. Reads / writes `borderRadius` + per-corner `borderTopLeftRadius`
 * etc. Includes shape presets (Square/Rounded/Smooth/Circle) for one-click set.
 *
 * Slider max: 60px. The "Extra Round" preset uses the upper end so the slider
 * stays functional after preset selection (no out-of-range freeze).
 */
const SLIDER_MAX = 60;

const CardCornerRadiusControl: React.FC<{
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
}> = ({ styles, onUpdate, onBatchUpdate }) => {
  const fb = cssToPx(styles.borderRadius, 16);
  const tl = cssToPx(styles.borderTopLeftRadius,     fb);
  const tr = cssToPx(styles.borderTopRightRadius,    fb);
  const br = cssToPx(styles.borderBottomRightRadius, fb);
  const bl = cssToPx(styles.borderBottomLeftRadius,  fb);
  const allEqual = tl === tr && tr === br && br === bl;
  const rawAllValue = allEqual ? tl : fb;
  const allValue = Math.min(rawAllValue, SLIDER_MAX);

  const [perCorner, setPerCorner] = React.useState<boolean>(!allEqual);
  React.useEffect(() => {
    if (!allEqual && !perCorner) setPerCorner(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEqual]);

  // Atomic write — all 5 keys in one patch. Avoids race conditions where
  // 5 separate setState calls each create a fresh element from stale virtualElement.
  const setAll = (px: number) => {
    const patch = {
      borderRadius: `${px}px`,
      borderTopLeftRadius: '',
      borderTopRightRadius: '',
      borderBottomRightRadius: '',
      borderBottomLeftRadius: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
    setPerCorner(false);
  };

  // All preset values stay within slider range so re-using slider after a preset works.
  const PRESETS = [
    { label: 'Square',  value: 0 },
    { label: 'Rounded', value: 8 },
    { label: 'Smooth',  value: 16 },
    { label: 'Round',   value: SLIDER_MAX },
  ];

  return (
    <div className="pt-2 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corner Radius</h4>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPerCorner(v => !v); }}
          className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${
            perCorner
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
          }`}
          title={perCorner ? 'Lock all 4 corners to one value' : 'Edit each corner separately'}
        >
          <i className={`fa-solid ${perCorner ? 'fa-link-slash' : 'fa-link'} mr-1`} />
          {perCorner ? 'Per-corner' : 'All sides'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {PRESETS.map(p => {
          const active = allEqual && rawAllValue === p.value;
          const previewSize = Math.min(p.value, 14);
          return (
            <button
              key={p.label}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAll(p.value); }}
              className={`py-2 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                active
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >
              <span className="w-4 h-4 border-2 border-current" style={{ borderRadius: `${previewSize}px` }} />
              {p.label}
            </button>
          );
        })}
      </div>

      {!perCorner && (
        <RangeInput
          label="Custom Radius"
          value={allValue}
          min={0} max={SLIDER_MAX} step={1}
          onChange={(v) => setAll(v)}
        />
      )}

      {perCorner && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <RangeInput label="Top Left"     value={Math.min(tl, SLIDER_MAX)} min={0} max={SLIDER_MAX} step={1} onChange={(v) => onUpdate('borderTopLeftRadius',     `${v}px`)} />
          <RangeInput label="Top Right"    value={Math.min(tr, SLIDER_MAX)} min={0} max={SLIDER_MAX} step={1} onChange={(v) => onUpdate('borderTopRightRadius',    `${v}px`)} />
          <RangeInput label="Bottom Left"  value={Math.min(bl, SLIDER_MAX)} min={0} max={SLIDER_MAX} step={1} onChange={(v) => onUpdate('borderBottomLeftRadius',  `${v}px`)} />
          <RangeInput label="Bottom Right" value={Math.min(br, SLIDER_MAX)} min={0} max={SLIDER_MAX} step={1} onChange={(v) => onUpdate('borderBottomRightRadius', `${v}px`)} />
        </div>
      )}
    </div>
  );
};

/**
 * CardPaddingControl — wraps SpacingInputGroup so card padding gets the
 * same compact "all sides / per-side" + arrow-key keyboard support that
 * Layout & Spacing block uses. Splits user's value into 4 sides for editing,
 * recombines on change.
 */
const CardPaddingControl: React.FC<{
  styles: any;
  onUpdate: (key: string, val: any) => void;
}> = ({ styles, onUpdate }) => {
  // Parse the saved padding into top/right/bottom/left values
  const parsedSides = React.useMemo(() => {
    const raw = styles.padding;
    // Per-side keys win if any are set
    if (styles.paddingTop || styles.paddingRight || styles.paddingBottom || styles.paddingLeft) {
      return {
        top:    styles.paddingTop    || styles.padding || '',
        right:  styles.paddingRight  || styles.padding || '',
        bottom: styles.paddingBottom || styles.padding || '',
        left:   styles.paddingLeft   || styles.padding || '',
      };
    }
    if (typeof raw !== 'string' || !raw.trim()) {
      return { top: '', right: '', bottom: '', left: '' };
    }
    const parts = raw.trim().split(/\s+/);
    if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
  }, [styles.padding, styles.paddingTop, styles.paddingRight, styles.paddingBottom, styles.paddingLeft]);

  const handleChange = (next: { top?: string; right?: string; bottom?: string; left?: string }) => {
    const t = next.top    ?? parsedSides.top;
    const r = next.right  ?? parsedSides.right;
    const b = next.bottom ?? parsedSides.bottom;
    const l = next.left   ?? parsedSides.left;

    // If all four are equal, store as a single shorthand (cleaner data)
    if (t && t === r && r === b && b === l) {
      onUpdate('padding', t);
      onUpdate('paddingTop', '');
      onUpdate('paddingRight', '');
      onUpdate('paddingBottom', '');
      onUpdate('paddingLeft', '');
    } else {
      // Per-side — clear the shorthand to avoid conflicts
      onUpdate('padding', '');
      onUpdate('paddingTop', t);
      onUpdate('paddingRight', r);
      onUpdate('paddingBottom', b);
      onUpdate('paddingLeft', l);
    }
  };

  return (
    <div className="pt-2 border-t border-white/5">
      <SpacingInputGroup
        label="Padding"
        icon="fa-solid fa-arrows-to-dot"
        values={parsedSides}
        onChange={handleChange}
      />
    </div>
  );
};

/**
 * IconBorderRadiusControl — compact + clear redesign of the icon-corner editor.
 * Default view: 4 shape presets (Square / Rounded / Pill / Circle) + a single slider.
 * Per-corner mode: chevron toggle reveals 4 small inputs in a labeled grid; auto-opens
 * if existing per-corner values differ from each other.
 */
const IconBorderRadiusControl: React.FC<{
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
}> = ({ styles, onUpdate, onBatchUpdate }) => {
  const ICON_SLIDER_MAX = 100;
  const tl = cssToPx(styles.iconBorderTopLeftRadius,     cssToPx(styles.iconBorderRadius, 8));
  const tr = cssToPx(styles.iconBorderTopRightRadius,    cssToPx(styles.iconBorderRadius, 8));
  const br = cssToPx(styles.iconBorderBottomRightRadius, cssToPx(styles.iconBorderRadius, 8));
  const bl = cssToPx(styles.iconBorderBottomLeftRadius,  cssToPx(styles.iconBorderRadius, 8));
  const allEqual = tl === tr && tr === br && br === bl;
  const rawAllValue = allEqual ? tl : cssToPx(styles.iconBorderRadius, 8);
  const allValue = Math.min(rawAllValue, ICON_SLIDER_MAX);

  const [perCorner, setPerCorner] = React.useState<boolean>(!allEqual);

  React.useEffect(() => {
    if (!allEqual && !perCorner) setPerCorner(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEqual]);

  const setAll = (px: number) => {
    const patch = {
      iconBorderRadius: `${px}px`,
      iconBorderTopLeftRadius: '',
      iconBorderTopRightRadius: '',
      iconBorderBottomRightRadius: '',
      iconBorderBottomLeftRadius: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
    setPerCorner(false);
  };

  // All preset values stay within slider range so re-using slider after a preset works.
  const PRESETS = [
    { label: 'Square',  value: 0,                 icon: 'fa-square' },
    { label: 'Rounded', value: 8,                 icon: 'fa-square-full' },
    { label: 'Smooth',  value: 16,                icon: 'fa-square-full' },
    { label: 'Circle',  value: ICON_SLIDER_MAX,   icon: 'fa-circle' },
  ];

  return (
    <div className="pt-2 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Icon Corner Radius</h4>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPerCorner(v => !v); }}
          className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${
            perCorner
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
          }`}
          title={perCorner ? 'Lock all 4 corners to one value' : 'Edit each corner separately'}
        >
          <i className={`fa-solid ${perCorner ? 'fa-link-slash' : 'fa-link'} mr-1`} />
          {perCorner ? 'Per-corner' : 'All sides'}
        </button>
      </div>

      {/* Shape presets — quick set */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {PRESETS.map(p => {
          const active = allEqual && rawAllValue === p.value;
          return (
            <button
              key={p.label}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAll(p.value); }}
              className={`py-2 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                active
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >
              <i className={`fa-solid ${p.icon} text-xs`} style={{ borderRadius: `${Math.min(p.value, 12)}px` }} />
              {p.label}
            </button>
          );
        })}
      </div>

      {!perCorner && (
        <RangeInput
          label="Custom Radius"
          value={allValue}
          min={0} max={ICON_SLIDER_MAX} step={1}
          onChange={(v) => setAll(v)}
        />
      )}

      {perCorner && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <RangeInput
            label="Top Left"
            value={Math.min(tl, ICON_SLIDER_MAX)}
            min={0} max={ICON_SLIDER_MAX} step={1}
            onChange={(v) => onUpdate('iconBorderTopLeftRadius', `${v}px`)}
          />
          <RangeInput
            label="Top Right"
            value={Math.min(tr, ICON_SLIDER_MAX)}
            min={0} max={ICON_SLIDER_MAX} step={1}
            onChange={(v) => onUpdate('iconBorderTopRightRadius', `${v}px`)}
          />
          <RangeInput
            label="Bottom Left"
            value={Math.min(bl, ICON_SLIDER_MAX)}
            min={0} max={ICON_SLIDER_MAX} step={1}
            onChange={(v) => onUpdate('iconBorderBottomLeftRadius', `${v}px`)}
          />
          <RangeInput
            label="Bottom Right"
            value={Math.min(br, ICON_SLIDER_MAX)}
            min={0} max={ICON_SLIDER_MAX} step={1}
            onChange={(v) => onUpdate('iconBorderBottomRightRadius', `${v}px`)}
          />
        </div>
      )}
    </div>
  );
};

interface FeatureBoxStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  /** Atomic multi-key writer — used for preset switches so all 5 keys land in
   *  one render rather than 5 sequential setState calls (eliminates race conditions). */
  onBatchUpdate?: (updates: Record<string, any>) => void;
  elementType: 'feature-box' | 'icon-box' | 'stat-card';
  themeColors?: any;
}

const BLOCK_TITLE: Record<FeatureBoxStylesBlockProps['elementType'], string> = {
  'feature-box': 'Feature Box Typography',
  'icon-box': 'Icon Box Typography',
  'stat-card': 'Stat Card Typography',
};

export const FeatureBoxStylesBlock: React.FC<FeatureBoxStylesBlockProps> = ({ styles, onUpdate, onBatchUpdate, elementType, themeColors }) => {
  const resetAll = () => {
    const keys = Object.keys(styles || {}).filter((k) =>
      k.startsWith('title') || k.startsWith('description') || k.startsWith('icon') ||
      k.startsWith('card') || k === 'backgroundColor' || k === 'borderColor' ||
      k === 'borderWidth' || k === 'borderStyle' || k === 'borderRadius' || k === 'padding' ||
      k === 'iconSize' || k === 'iconColor' || k === 'iconBackgroundColor' ||
      k === 'fontFamily' || k === 'textAlign'
    );
    const patch: Record<string, any> = {};
    keys.forEach((k) => { patch[k] = ''; });
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetAll(); }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset to Theme
        </button>
      </div>
      <AccordionGroup title={BLOCK_TITLE[elementType]} defaultOpen={true}>
        <div className="space-y-4">
          <div className="pt-2 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Title</h4>
            <SelectInput
              label="Font Family"
              value={styles.titleFontFamily || styles.fontFamily || ''}
              options={[
                { label: 'Theme Default', value: '' },
                ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
              ]}
              onChange={(v: string) => onUpdate('titleFontFamily', v)}
            />
            <FontSizeInput label="Font Size" value={styles.titleFontSize || ''} onChange={(v) => onUpdate('titleFontSize', v)} placeholder="1rem" />
            <SelectInput label="Font Weight" value={styles.titleFontWeight || '700'} options={[{ label: 'Normal', value: '400' }, { label: 'Bold', value: '700' }, { label: 'Black', value: '900' }]} onChange={(v) => onUpdate('titleFontWeight', v)} />
            <SelectInput
              label="Text Transform"
              value={styles.titleTextTransform || ''}
              options={[
                { label: 'None', value: '' },
                { label: 'Uppercase', value: 'uppercase' },
                { label: 'Lowercase', value: 'lowercase' },
                { label: 'Capitalize', value: 'capitalize' },
              ]}
              onChange={(v: string) => onUpdate('titleTextTransform', v)}
            />
            <SelectInput
              label="Font Style"
              value={styles.titleFontStyle || 'normal'}
              options={[{ label: 'Normal', value: 'normal' }, { label: 'Italic', value: 'italic' }]}
              onChange={(v: string) => onUpdate('titleFontStyle', v)}
            />
            <NumericUnitInput label="Letter Spacing" value={styles.titleLetterSpacing || ''} onChange={(v) => onUpdate('titleLetterSpacing', v)} placeholder="0.05em" units={['em', 'px', 'rem']} step={0.01} min={-0.5} max={1} />
            <ColorInput label={styles.titleColor ? 'Color' : 'Color (Inherited)'} value={styles.titleColor || ''} onChange={(v) => onUpdate('titleColor', v)} onReset={() => onUpdate('titleColor', '')} />
          </div>
          <div className="pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description</h4>
            <SelectInput
              label="Font Family"
              value={styles.descriptionFontFamily || styles.fontFamily || ''}
              options={[
                { label: 'Theme Default', value: '' },
                ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
              ]}
              onChange={(v: string) => onUpdate('descriptionFontFamily', v)}
            />
            <FontSizeInput label="Font Size" value={styles.descriptionFontSize || ''} onChange={(v) => onUpdate('descriptionFontSize', v)} placeholder="0.875rem" />
            <SelectInput label="Font Weight" value={styles.descriptionFontWeight || '400'} options={[{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Bold', value: '700' }]} onChange={(v) => onUpdate('descriptionFontWeight', v)} />
            <SelectInput
              label="Text Transform"
              value={styles.descriptionTextTransform || ''}
              options={[
                { label: 'None', value: '' },
                { label: 'Uppercase', value: 'uppercase' },
                { label: 'Lowercase', value: 'lowercase' },
                { label: 'Capitalize', value: 'capitalize' },
              ]}
              onChange={(v: string) => onUpdate('descriptionTextTransform', v)}
            />
            <SelectInput
              label="Font Style"
              value={styles.descriptionFontStyle || 'normal'}
              options={[{ label: 'Normal', value: 'normal' }, { label: 'Italic', value: 'italic' }]}
              onChange={(v: string) => onUpdate('descriptionFontStyle', v)}
            />
            <NumericUnitInput label="Letter Spacing" value={styles.descriptionLetterSpacing || ''} onChange={(v) => onUpdate('descriptionLetterSpacing', v)} placeholder="0" units={['em', 'px', 'rem']} step={0.01} min={-0.5} max={1} />
            <ColorInput label={styles.descriptionColor ? 'Color' : 'Color (Inherited)'} value={styles.descriptionColor || ''} onChange={(v) => onUpdate('descriptionColor', v)} onReset={() => onUpdate('descriptionColor', '')} />
          </div>
        </div>
      </AccordionGroup>

      <AccordionGroup title="Feature Box Icon" defaultOpen={true}>
        <div className="space-y-4">
          <TextInput label="Icon Size" value={styles.iconSize || ''} onChange={(v) => onUpdate('iconSize', v)} placeholder="1.25rem" />
          <TextInput label="Container Size" value={styles.iconContainerSize || ''} onChange={(v) => onUpdate('iconContainerSize', v)} placeholder="3rem" />
            <ColorInput label={styles.iconColor ? 'Icon Color' : 'Icon Color (Inherited)'} value={styles.iconColor || ''} onChange={(v) => onUpdate('iconColor', v)} onReset={() => onUpdate('iconColor', '')} />
          <ColorInput label={styles.iconBackgroundColor ? 'Icon Background' : 'Icon Background (Inherited)'} value={styles.iconBackgroundColor || ''} onChange={(v) => onUpdate('iconBackgroundColor', v)} onReset={() => onUpdate('iconBackgroundColor', '')} />

          <div className="pt-2 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Icon Border</h4>
            <SelectInput
              label="Border Style"
              value={styles.iconBorderStyle || 'none'}
              options={[
                { label: 'None', value: 'none' },
                { label: 'Solid', value: 'solid' },
                { label: 'Dashed', value: 'dashed' },
                { label: 'Dotted', value: 'dotted' },
                { label: 'Double', value: 'double' },
              ]}
              onChange={(v) => onUpdate('iconBorderStyle', v)}
            />
            {styles.iconBorderStyle && styles.iconBorderStyle !== 'none' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <RangeInput
                  label="Width"
                  value={styles.iconBorderWidth !== undefined ? parseInt(styles.iconBorderWidth.toString().replace(/[^0-9]/g, '')) : 1}
                  min={0} max={20}
                  onChange={(v) => onUpdate('iconBorderWidth', `${v}px`)}
                />
                <ColorInput label="Color" value={styles.iconBorderColor || ''} onChange={(v) => onUpdate('iconBorderColor', v)} onReset={() => onUpdate('iconBorderColor', '')} />
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Icon Shadow</h4>
            <SelectInput
              label="Shadow Preset"
              value={styles.iconShadow || 'none'}
              options={[
                { label: 'None', value: 'none' },
                { label: 'Small', value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
                { label: 'Medium', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
                { label: 'Large', value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
                { label: 'Extra Large', value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
                { label: 'Inner', value: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' },
                { label: 'Glow', value: `0 0 15px ${styles.iconColor || themeColors?.accentColor || 'rgba(255,255,255,0.3)'}` },
              ]}
              onChange={(v) => onUpdate('iconShadow', v)}
            />
            <TextInput label="Custom Shadow" value={styles.iconShadow || ''} onChange={(v) => onUpdate('iconShadow', v)} placeholder="0 4px 6px rgba(0,0,0,0.1)" />
          </div>

          <IconBorderRadiusControl styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} />
        </div>
      </AccordionGroup>

      {/* ─────────── CARD BORDER ─────────── */}
      <AccordionGroup title="Card Border" defaultOpen={false}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The border around the whole card.
          </p>
          <ColorInput
            label="Border Color"
            value={styles.borderColor || ''}
            onChange={(v) => onUpdate('borderColor', v)}
            onReset={() => onUpdate('borderColor', '')}
          />
          <RangeInput
            label="Border Width"
            value={cssToPx(styles.borderWidth, 1)}
            min={0} max={10} step={1}
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

          {/* Corner radius — shape presets + per-corner mode toggle (matches IconBorderRadiusControl) */}
          <CardCornerRadiusControl styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} />

          {/* Padding — compact "all/per-side" group with arrow-key keyboard steps */}
          <CardPaddingControl styles={styles} onUpdate={onUpdate} />
        </div>
      </AccordionGroup>

      {/* Icon-box layout: icon↔content gap + description opacity/line-height
          (were hardcoded gap-4 / opacity-70 / line-height 1.7). */}
      {elementType === 'icon-box' && (
        <AccordionGroup title="Layout & Spacing" defaultOpen={false}>
          <div className="space-y-3">
            <NumericUnitInput
              label="Icon ↔ Content Gap"
              value={styles.iconSpace || ''}
              onChange={(v) => onUpdate('iconSpace', v)}
              placeholder="1rem"
              units={['rem', 'px', 'em']}
              step={1}
              min={0}
              max={80}
            />
            <RangeInput
              label="Description Opacity"
              value={styles.descriptionOpacity !== undefined && styles.descriptionOpacity !== '' ? Math.round(Number(styles.descriptionOpacity) * 100) : 70}
              min={0} max={100} step={5}
              onChange={(v) => onUpdate('descriptionOpacity', v / 100)}
            />
            <NumericUnitInput
              label="Description Line Height"
              value={styles.descriptionLineHeight || ''}
              onChange={(v) => onUpdate('descriptionLineHeight', v)}
              placeholder="1.7"
              units={['', 'px', 'em']}
              step={0.05}
              min={0.8}
              max={3}
            />
          </div>
        </AccordionGroup>
      )}

      {/* The groups below only make sense for feature-box (badge / CTA / stat / numbered).
          Icon-box / stat-card route through this block too, so we gate each group. */}
      {elementType === 'feature-box' && (
        <>
          <AccordionGroup title="Badge" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-[10px] text-white/40 leading-relaxed">
                The small "New / Popular" pill above the title. Set the text in the Content tab.
              </p>
              <ColorInput
                label="Badge Color"
                value={styles.badgeColor || ''}
                onChange={(v) => onUpdate('badgeColor', v)}
                onReset={() => onUpdate('badgeColor', '')}
              />
              <ColorInput
                label={styles.badgeBackgroundColor ? 'Badge Background' : 'Badge Background (Auto)'}
                value={styles.badgeBackgroundColor || ''}
                onChange={(v) => onUpdate('badgeBackgroundColor', v)}
                onReset={() => onUpdate('badgeBackgroundColor', '')}
              />
              <FontSizeInput label="Font Size" value={styles.badgeFontSize || ''} onChange={(v) => onUpdate('badgeFontSize', v)} placeholder="0.62rem" />
              <SelectInput label="Font Weight" value={String(styles.badgeFontWeight || '800')} options={[{ label: 'Semibold', value: '600' }, { label: 'Bold', value: '700' }, { label: 'Black', value: '800' }]} onChange={(v) => onUpdate('badgeFontWeight', v)} />
              <TextInput label="Padding" value={styles.badgePadding || ''} onChange={(v) => onUpdate('badgePadding', v)} placeholder="3px 9px" />
            </div>
          </AccordionGroup>

          <AccordionGroup title="CTA Link" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-[10px] text-white/40 leading-relaxed">
                The "Learn more →" link at the bottom. Set the text in the Content tab.
              </p>
              <ColorInput
                label="Link Color"
                value={styles.ctaColor || ''}
                onChange={(v) => onUpdate('ctaColor', v)}
                onReset={() => onUpdate('ctaColor', '')}
              />
              <FontSizeInput label="Font Size" value={styles.ctaFontSize || ''} onChange={(v) => onUpdate('ctaFontSize', v)} placeholder="0.82rem" />
              <SelectInput label="Font Weight" value={String(styles.ctaFontWeight || '700')} options={[{ label: 'Medium', value: '500' }, { label: 'Semibold', value: '600' }, { label: 'Bold', value: '700' }]} onChange={(v) => onUpdate('ctaFontWeight', v)} />
            </div>
          </AccordionGroup>

          <AccordionGroup title="Stat (big number)" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-[10px] text-white/40 leading-relaxed">
                The large metric shown in the Stat layout. Set the value in the Content tab.
              </p>
              <FontSizeInput
                label="Font Size"
                value={styles.statFontSize || ''}
                onChange={(v) => onUpdate('statFontSize', v)}
                placeholder="2.75rem"
              />
              <ColorInput
                label="Stat Color"
                value={styles.statColor || ''}
                onChange={(v) => onUpdate('statColor', v)}
                onReset={() => onUpdate('statColor', '')}
              />
            </div>
          </AccordionGroup>

          <AccordionGroup title="Number Badge" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-[10px] text-white/40 leading-relaxed">
                The circular "01 / 02 / 03" chip used by the Numbered layout. Auto-increments unless you override the number in the Content tab.
              </p>
              <TextInput
                label="Chip Size"
                value={styles.numberBadgeSize || ''}
                onChange={(v) => onUpdate('numberBadgeSize', v)}
                placeholder="2.5rem"
              />
              <ColorInput
                label="Chip Color"
                value={styles.numberBadgeColor || ''}
                onChange={(v) => onUpdate('numberBadgeColor', v)}
                onReset={() => onUpdate('numberBadgeColor', '')}
              />
            </div>
          </AccordionGroup>
        </>
      )}
    </>
  );
};
