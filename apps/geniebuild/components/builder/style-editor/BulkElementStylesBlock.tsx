import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { AccordionGroup, ColorInput, NumericUnitInput, RangeInput, SelectInput, SpacingInputGroup } from '../inputs';

/**
 * Convert a CSS dimension to its pixel equivalent for slider value display.
 * Falls back to `fallback` when value is empty / invalid.
 */
const cssToPx = (val: any, fallback: number): number => {
  if (val === undefined || val === null || val === '') return fallback;
  const m = String(val).trim().match(/^(-?\d+(?:\.\d+)?)\s*(px|rem|em)?$/i);
  if (!m) return fallback;
  const num = parseFloat(m[1]);
  if (!Number.isFinite(num)) return fallback;
  const unit = (m[2] || 'px').toLowerCase();
  if (unit === 'rem' || unit === 'em') return Math.round(num * 16);
  return Math.round(num);
};

interface BulkElementStylesBlockProps {
  section: Section;
  onSectionUpdate: (sectionId: string, updates: any) => void;
  themeColors?: any;
}

/**
 * BULK ELEMENT STYLES — section-level Design tab panel
 *
 * Lets the user change a style across many elements of the same type at once
 * (e.g. all feature-box icon colors). Behavior:
 *
 *   • By default, only elements that DON'T have an individual override for that
 *     style key are updated. This preserves per-card customization.
 *   • A counter next to each control reports how many elements will be touched
 *     vs. how many have overrides — and a "Override all" button forces it.
 *   • Per-type "Reset all" button strips every common style key from every
 *     element of that type so they fall back to theme defaults.
 *
 * Detection: only types with 2+ instances in the section are shown.
 *
 * Priority chain (unchanged elsewhere in render code):
 *   Element style (sidebar override)  →  Section style (this bulk)  →  Theme  →  Default
 */

type StyleControlSpec = {
  /** Style key to write on the element */
  key: string;
  /** Sidebar label */
  label: string;
};

type TypeConfig = {
  type: string;
  label: string;
  controls: StyleControlSpec[];
  /** Style keys that "Reset all" will strip from every element of this type */
  resetKeys: string[];
  /** When true, the card-shape sub-panel (radius / border / padding) is shown below the color controls */
  hasCardShape?: boolean;
};

const TYPE_CONFIGS: TypeConfig[] = [
  {
    type: 'feature-box',
    label: 'Feature Boxes',
    controls: [
      { key: 'iconColor',           label: 'Icon Color' },
      { key: 'iconBackgroundColor', label: 'Icon Background' },
      { key: 'titleColor',          label: 'Title Color' },
      { key: 'descriptionColor',    label: 'Description Color' },
      { key: 'backgroundColor',     label: 'Card Background' },
      { key: 'borderColor',         label: 'Border Color' },
    ],
    resetKeys: ['iconColor','iconBackgroundColor','titleColor','descriptionColor','backgroundColor','borderColor','color','textColor','borderRadius','borderWidth','borderStyle','padding','borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'],
    hasCardShape: true,
  },
  {
    type: 'testimonial-card',
    label: 'Testimonial Cards',
    controls: [
      { key: 'starColor',          label: 'Star Color' },
      { key: 'titleColor',         label: 'Author Color' },
      { key: 'quoteColor',         label: 'Quote Color' },
      { key: 'descriptionColor',   label: 'Role / Location Color' },
      { key: 'backgroundColor',    label: 'Card Background' },
      { key: 'borderColor',        label: 'Border Color' },
      { key: 'accentColor',        label: 'Accent (badges/stripe)' },
    ],
    resetKeys: ['starColor','titleColor','quoteColor','descriptionColor','backgroundColor','borderColor','accentColor','color','borderRadius','borderWidth','borderStyle','padding','borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'],
    hasCardShape: true,
  },
  {
    type: 'icon-box',
    label: 'Icon Boxes',
    controls: [
      { key: 'iconColor',           label: 'Icon Color' },
      { key: 'iconBackgroundColor', label: 'Icon Background' },
      { key: 'titleColor',          label: 'Title Color' },
      { key: 'descriptionColor',    label: 'Description Color' },
    ],
    resetKeys: ['iconColor','iconBackgroundColor','titleColor','descriptionColor','color','borderRadius','borderWidth','borderStyle','padding'],
    hasCardShape: true,
  },
  {
    type: 'image-box',
    label: 'Image Boxes',
    controls: [
      { key: 'titleColor',         label: 'Title Color' },
      { key: 'descriptionColor',   label: 'Description Color' },
      { key: 'backgroundColor',    label: 'Card Background' },
      { key: 'borderColor',        label: 'Border Color' },
      { key: 'buttonBgColor',      label: 'Button Background' },
      { key: 'buttonTextColor',    label: 'Button Text Color' },
    ],
    resetKeys: [
      'titleColor','descriptionColor','backgroundColor','borderColor','color',
      'borderRadius','borderWidth','borderStyle','padding',
      'borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius',
      'contentPadding','contentGap','imageContentGap',
      'imageHeight','imageAspectRatio','imageObjectFit','imageObjectPosition','imageRadius','imageHover',
      'titleFontSize','titleFontWeight','titleAlign',
      'descriptionFontSize','descriptionAlign','descriptionLineClamp',
      'buttonVariant','buttonBgColor','buttonTextColor','buttonBorderColor',
      'buttonRadius','buttonPadding','buttonFontSize','buttonFontWeight',
      'buttonIconSize','buttonIconGap',
    ],
    hasCardShape: true,
  },
  {
    type: 'stat-card',
    label: 'Stat Cards',
    controls: [
      { key: 'titleColor',       label: 'Number Color' },
      { key: 'descriptionColor', label: 'Label Color' },
      { key: 'backgroundColor',  label: 'Card Background' },
      { key: 'borderColor',      label: 'Border Color' },
    ],
    resetKeys: ['titleColor','descriptionColor','backgroundColor','borderColor','color','borderRadius','borderWidth','borderStyle','padding'],
    hasCardShape: true,
  },
  {
    type: 'heading',
    label: 'Headings',
    controls: [
      { key: 'color',                  label: 'Text Color' },
      { key: 'secondaryHeadingColor',  label: 'Highlighted Word Color' },
    ],
    resetKeys: ['color','secondaryHeadingColor','gradientFrom','gradientTo','textShadow','kickerColor'],
  },
  {
    type: 'text',
    label: 'Text Blocks',
    controls: [
      { key: 'color',     label: 'Text Color' },
      { key: 'linkColor', label: 'Link Color' },
    ],
    resetKeys: ['color','linkColor','textShadow'],
  },
  {
    type: 'button',
    label: 'Buttons',
    controls: [
      { key: 'backgroundColor', label: 'Background' },
      { key: 'color',           label: 'Text Color' },
      { key: 'borderColor',     label: 'Border Color' },
    ],
    resetKeys: ['backgroundColor','color','borderColor','hoverBackgroundColor','hoverColor','hoverBorderColor','boxShadow'],
  },
  {
    type: 'icon',
    label: 'Icons',
    controls: [
      { key: 'iconColor', label: 'Icon Color' },
      { key: 'color',     label: 'Color (fallback)' },
    ],
    resetKeys: ['iconColor','color'],
  },
  {
    type: 'badge',
    label: 'Badges',
    controls: [
      { key: 'backgroundColor', label: 'Background' },
      { key: 'color',           label: 'Text Color' },
    ],
    resetKeys: ['backgroundColor','color','borderColor'],
  },
];

/** A single control row — color picker with override-aware counter + force-all action. */
const BulkControlRow: React.FC<{
  spec: StyleControlSpec;
  matchingElements: WebsiteElement[];
  /** Total cards visible in the section (used when matchingElements is empty / virtual mode). */
  virtualTotal: number;
  /** When set, applyValueToElements call materializes that element type before patching. */
  materializeAsType?: string;
  applyValueToElements: (key: string, val: string, ids: string[], materializeAsType?: string) => void;
}> = ({ spec, matchingElements, virtualTotal, materializeAsType, applyValueToElements }) => {
  const withoutOverride = matchingElements.filter(el => {
    const v = (el.style as any)?.[spec.key];
    return v === undefined || v === '' || v === null;
  });
  const withOverride = matchingElements.filter(el => {
    const v = (el.style as any)?.[spec.key];
    return v !== undefined && v !== '' && v !== null;
  });

  const sampledValue = withOverride[0]
    ? ((withOverride[0].style as any)?.[spec.key] || '')
    : '';

  // Bulk semantics:
  //   • If NONE of the elements have an override → apply to all of them.
  //   • If SOME have overrides → only update the ones without (preserves individual edits).
  //   • If ALL have the same value (i.e. all "overridden" with the same color, which is
  //     basically what happens after first bulk apply) → treat as bulk-controlled and
  //     apply the new value to everyone. This makes re-apply work as the user expects.
  const allSameValue = withOverride.length === matchingElements.length
    && matchingElements.length > 0
    && new Set(matchingElements.map(el => (el.style as any)?.[spec.key])).size === 1;
  const hasMixedOverrides = withOverride.length > 0 && !allSameValue;

  const overrideCount = hasMixedOverrides ? withOverride.length : 0;
  const total = Math.max(virtualTotal, matchingElements.length);
  const willTouchCount =
    matchingElements.length === 0 ? virtualTotal :
    hasMixedOverrides ? withoutOverride.length :
    total;

  // Compute target ids when user changes the color
  const targetForChange = (): string[] => {
    if (matchingElements.length === 0) return []; // virtual mode handled by materializeAsType
    if (hasMixedOverrides) return withoutOverride.map(e => e.id);
    return matchingElements.map(e => e.id);  // all same OR all empty → bulk owns it
  };

  return (
    <div className="space-y-1.5">
      <ColorInput
        label={spec.label}
        value={sampledValue}
        onChange={(v) => applyValueToElements(
          spec.key,
          v,
          targetForChange(),
          materializeAsType,
        )}
        onReset={() => applyValueToElements(
          spec.key,
          '',
          matchingElements.length === 0 ? [] : matchingElements.map(e => e.id),
          materializeAsType,
        )}
      />
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[9px] text-white/40">
          {overrideCount === 0
            ? `Updates all ${total}`
            : `${willTouchCount} of ${total} will update · ${overrideCount} ${overrideCount === 1 ? 'has' : 'have'} individual edits`}
        </span>
        {overrideCount > 0 && (
          <button
            type="button"
            onClick={() => {
              const newValue = sampledValue || '';
              applyValueToElements(spec.key, newValue, matchingElements.map(e => e.id), materializeAsType);
            }}
            className="text-[9px] font-bold text-blue-400 hover:text-blue-300 underline"
            title="Apply to all elements, including ones with individual overrides"
          >
            Override all
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * BulkShapeControls — corner radius (with shape presets), border style,
 * border width, and padding — applied to ALL elements of one type at once.
 *
 * Always overrides every element of the type (force-write semantics) — that's
 * the whole point of bulk shape controls. Individual customizations to these
 * keys are infrequent compared to colors, so the simpler "overwrite all" UX
 * is what the user expects here.
 */
const SHAPE_SLIDER_MAX = 60;

const BulkShapeControls: React.FC<{
  matchingElements: WebsiteElement[];
  virtualTotal: number;
  materializeAsType?: string;
  /** Apply MULTIPLE keys atomically to all elements of this type. */
  applyManyToAllOfType: (patch: Record<string, any>, materializeAsType?: string) => void;
}> = ({ matchingElements, virtualTotal, materializeAsType, applyManyToAllOfType }) => {
  // Read a "representative" value from any matching element (first non-empty);
  // bulk shape rarely diverges, so sampling first works in practice.
  const sample = (key: string): any => {
    const el = matchingElements.find(e => (e.style as any)?.[key]);
    return el ? (el.style as any)[key] : '';
  };

  const fb = cssToPx(sample('borderRadius'), 16);
  const tl = cssToPx(sample('borderTopLeftRadius'),     fb);
  const tr = cssToPx(sample('borderTopRightRadius'),    fb);
  const br = cssToPx(sample('borderBottomRightRadius'), fb);
  const bl = cssToPx(sample('borderBottomLeftRadius'),  fb);
  const allEqual = tl === tr && tr === br && br === bl;
  const rawAllValue = allEqual ? tl : fb;
  const allValue = Math.min(rawAllValue, SHAPE_SLIDER_MAX);

  const [perCorner, setPerCorner] = React.useState<boolean>(!allEqual);
  React.useEffect(() => {
    if (!allEqual && !perCorner) setPerCorner(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEqual]);

  const total = Math.max(virtualTotal, matchingElements.length);

  const setRadiusAll = (px: number) => {
    applyManyToAllOfType({
      borderRadius: `${px}px`,
      borderTopLeftRadius: '',
      borderTopRightRadius: '',
      borderBottomRightRadius: '',
      borderBottomLeftRadius: '',
    }, materializeAsType);
    setPerCorner(false);
  };

  const PRESETS = [
    { label: 'Square',  value: 0 },
    { label: 'Rounded', value: 8 },
    { label: 'Smooth',  value: 16 },
    { label: 'Round',   value: SHAPE_SLIDER_MAX },
  ];

  // Border style + width — sample current
  const currentStyle = sample('borderStyle') || 'solid';
  const currentWidthPx = cssToPx(sample('borderWidth'), 1);

  // Padding — read sample as 4 sides
  const padTop    = sample('paddingTop')    || sample('padding') || '';
  const padRight  = sample('paddingRight')  || sample('padding') || '';
  const padBottom = sample('paddingBottom') || sample('padding') || '';
  const padLeft   = sample('paddingLeft')   || sample('padding') || '';

  const handlePaddingChange = (next: { top?: string; right?: string; bottom?: string; left?: string }) => {
    const t = next.top ?? padTop, r = next.right ?? padRight, b = next.bottom ?? padBottom, l = next.left ?? padLeft;
    if (t && t === r && r === b && b === l) {
      applyManyToAllOfType({
        padding: t,
        paddingTop: '', paddingRight: '', paddingBottom: '', paddingLeft: '',
      }, materializeAsType);
    } else {
      applyManyToAllOfType({
        padding: '',
        paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l,
      }, materializeAsType);
    }
  };

  return (
    <div className="pt-3 mt-1 border-t border-white/5 space-y-4">
      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shape & Spacing</h5>
      <p className="text-[9px] text-white/40 italic">
        Applies to all {total} {total === 1 ? 'element' : 'elements'} — overwrites individual edits.
      </p>

      {/* Corner Radius */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Corner Radius</label>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPerCorner(v => !v); }}
            className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${
              perCorner
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
            }`}
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
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRadiusAll(p.value); }}
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
            min={0} max={SHAPE_SLIDER_MAX} step={1}
            onChange={(v) => setRadiusAll(v)}
          />
        )}
        {perCorner && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <RangeInput label="Top Left"     value={Math.min(tl, SHAPE_SLIDER_MAX)} min={0} max={SHAPE_SLIDER_MAX} step={1} onChange={(v) => applyManyToAllOfType({ borderTopLeftRadius:     `${v}px` }, materializeAsType)} />
            <RangeInput label="Top Right"    value={Math.min(tr, SHAPE_SLIDER_MAX)} min={0} max={SHAPE_SLIDER_MAX} step={1} onChange={(v) => applyManyToAllOfType({ borderTopRightRadius:    `${v}px` }, materializeAsType)} />
            <RangeInput label="Bottom Left"  value={Math.min(bl, SHAPE_SLIDER_MAX)} min={0} max={SHAPE_SLIDER_MAX} step={1} onChange={(v) => applyManyToAllOfType({ borderBottomLeftRadius:  `${v}px` }, materializeAsType)} />
            <RangeInput label="Bottom Right" value={Math.min(br, SHAPE_SLIDER_MAX)} min={0} max={SHAPE_SLIDER_MAX} step={1} onChange={(v) => applyManyToAllOfType({ borderBottomRightRadius: `${v}px` }, materializeAsType)} />
          </div>
        )}
      </div>

      {/* Border Style + Width */}
      <div className="grid grid-cols-2 gap-3">
        <SelectInput
          label="Border Style"
          value={currentStyle}
          options={[
            { label: 'None',   value: 'none' },
            { label: 'Solid',  value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' },
            { label: 'Double', value: 'double' },
          ]}
          onChange={(v: any) => applyManyToAllOfType({ borderStyle: v }, materializeAsType)}
        />
        <RangeInput
          label="Border Width"
          value={currentWidthPx}
          min={0} max={10} step={1} unit="px"
          onChange={(v) => applyManyToAllOfType({ borderWidth: `${v}px` }, materializeAsType)}
        />
      </div>

      {/* Padding */}
      <SpacingInputGroup
        label="Padding"
        icon="fa-solid fa-arrows-to-dot"
        values={{ top: padTop, right: padRight, bottom: padBottom, left: padLeft }}
        onChange={handlePaddingChange}
      />
    </div>
  );
};

/**
 * BulkImageControls — image-box-specific bulk knobs (aspect ratio, object fit,
 * focal point, image radius, hover effect, image height). Force-applied to
 * every image-box in the section.
 */
const BulkImageControls: React.FC<{
  matchingElements: WebsiteElement[];
  virtualTotal: number;
  materializeAsType?: string;
  applyManyToAllOfType: (patch: Record<string, any>, materializeAsType?: string) => void;
}> = ({ matchingElements, virtualTotal, materializeAsType, applyManyToAllOfType }) => {
  const sample = (key: string): any => {
    const el = matchingElements.find(e => (e.style as any)?.[key] !== undefined && (e.style as any)?.[key] !== '');
    return el ? (el.style as any)[key] : '';
  };
  const total = Math.max(virtualTotal, matchingElements.length);
  const set = (key: string, val: any) => applyManyToAllOfType({ [key]: val }, materializeAsType);

  return (
    <div className="pt-3 mt-1 border-t border-white/5 space-y-3">
      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Settings</h5>
      <p className="text-[9px] text-white/40 italic">
        Applies to all {total} {total === 1 ? 'image' : 'images'} — overwrites individual edits.
      </p>
      <SelectInput
        label="Aspect Ratio"
        value={sample('imageAspectRatio') || ''}
        options={[
          { label: 'Free (use Height)',   value: '' },
          { label: '16:9 (Widescreen)',   value: '16/9' },
          { label: '4:3 (Classic)',       value: '4/3' },
          { label: '3:2 (Photo)',         value: '3/2' },
          { label: '1:1 (Square)',        value: '1/1' },
          { label: '9:16 (Vertical)',     value: '9/16' },
          { label: '21:9 (Cinematic)',    value: '21/9' },
        ]}
        onChange={(v) => set('imageAspectRatio', v)}
      />
      {!sample('imageAspectRatio') && (
        <NumericUnitInput
          label="Image Height"
          value={sample('imageHeight') || ''}
          onChange={(v) => set('imageHeight', v)}
          placeholder="12rem"
          units={['rem', 'px', '%']}
          step={0.5}
          min={4}
          max={32}
        />
      )}
      <SelectInput
        label="Object Fit"
        value={sample('imageObjectFit') || 'cover'}
        options={[
          { label: 'Cover (fill, may crop)',          value: 'cover' },
          { label: 'Contain (full image, letterbox)', value: 'contain' },
          { label: 'Fill (stretch)',                  value: 'fill' },
          { label: 'None (original size)',            value: 'none' },
        ]}
        onChange={(v) => set('imageObjectFit', v)}
      />
      <SelectInput
        label="Image Position (focal point)"
        value={sample('imageObjectPosition') || 'center'}
        options={[
          { label: 'Center',       value: 'center' },
          { label: 'Top',          value: 'top' },
          { label: 'Bottom',       value: 'bottom' },
          { label: 'Left',         value: 'left' },
          { label: 'Right',        value: 'right' },
          { label: 'Top Left',     value: 'top left' },
          { label: 'Top Right',    value: 'top right' },
          { label: 'Bottom Left',  value: 'bottom left' },
          { label: 'Bottom Right', value: 'bottom right' },
        ]}
        onChange={(v) => set('imageObjectPosition', v)}
      />
      <NumericUnitInput
        label="Image Radius (image only)"
        value={sample('imageRadius') || ''}
        onChange={(v) => set('imageRadius', v)}
        placeholder="0px"
        units={['px', 'rem', '%']}
        step={1}
        min={0}
        max={48}
      />
      <SelectInput
        label="Hover Effect"
        value={sample('imageHover') || 'none'}
        options={[
          { label: 'None',                value: 'none' },
          { label: 'Zoom (image scales)', value: 'zoom' },
          { label: 'Brighten',            value: 'brighten' },
          { label: 'Darken',              value: 'darken' },
          { label: 'Lift Card (shadow)',  value: 'lift' },
        ]}
        onChange={(v) => set('imageHover', v === 'none' ? '' : v)}
      />
    </div>
  );
};

/**
 * Map section-type → expected element-type when content.items renders cards.
 * Used to expose the bulk panel for sections that haven't yet materialized
 * their per-card elements into section.elements (e.g. fresh FeaturesPlumbing).
 */
const SECTION_DEFAULT_ELEMENT_TYPE: Record<string, string> = {
  features:     'feature-box',
  testimonials: 'testimonial-card',
  services:     'feature-box',
  guarantee:    'feature-box',
  areas:        'feature-box',
  why_choose_us: 'feature-box',
  process:      'feature-box',
};

/**
 * Variant-level override. When a specific plumbing variant uses a different
 * element type than the section-type default (e.g. ServicesPlumbing2 renders
 * image-boxes instead of feature-boxes), key the bulk panel by variant first.
 */
const SECTION_VARIANT_ELEMENT_TYPE: Record<string, string> = {
  ServicesPlumbing2: 'image-box',
};

export const BulkElementStylesBlock: React.FC<BulkElementStylesBlockProps> = ({
  section, onSectionUpdate,
}) => {
  const elements = section.elements || [];
  const items = (section.content?.items || []) as any[];

  // Real elements counted by type
  const realEligible = TYPE_CONFIGS
    .map(cfg => ({ config: cfg, matches: elements.filter(el => el.type === cfg.type) }))
    .filter(g => g.matches.length >= 2);

  // Virtual eligibility: section.type renders N items by default. Even if elements
  // are not yet materialized, bulk should still appear so user can change them all.
  const sectionType = String(section.type || '').toLowerCase().replace(/-/g, '_');
  const variant = String((section as any).variant || (section.styles as any)?.variant || '');
  // Variant override wins (e.g. ServicesPlumbing2 → image-box), then section-type default.
  const expectedType = SECTION_VARIANT_ELEMENT_TYPE[variant] || SECTION_DEFAULT_ELEMENT_TYPE[sectionType];
  const virtualCount = items.length >= 2 ? items.length : (expectedType ? 6 : 0);
  const virtualConfig = expectedType
    ? TYPE_CONFIGS.find(c => c.type === expectedType)
    : undefined;

  // If real eligibility didn't pick up the virtual type, add a fake group
  // (matches list is empty, but writes will fall back to creating elements
  // with the section's own per-card id pattern — see ensureMaterialized below).
  const hasRealForVirtual = expectedType && realEligible.some(r => r.config.type === expectedType);

  const eligibleTypes = [...realEligible];
  if (virtualConfig && !hasRealForVirtual && virtualCount >= 2) {
    eligibleTypes.unshift({ config: virtualConfig, matches: [] });
  }

  if (eligibleTypes.length === 0) return null;

  /**
   * For sections where elements haven't been materialized yet, create them on
   * first bulk apply. Returns the element list we should patch (may include
   * freshly-created records).
   */
  const ensureMaterialized = (typeId: string): WebsiteElement[] => {
    const existing = elements.filter(el => el.type === typeId);
    if (existing.length >= 2) return elements;
    if (typeId !== expectedType) return elements;
    // Synthesize one element per content.items entry. ID convention mirrors
    // FeaturesPlumbing / TestimonialsPlumbing / ServicesPlumbing2: each section has
    // its own per-card id pattern — bulk must mirror so the section's getXEl lookup hits.
    let synthesized: WebsiteElement[];
    if (variant === 'ServicesPlumbing2') {
      // ServicesPlumbing2 uses idx-based id: `${section.id}-sp2-svc${i}`
      const itemList = items.length >= 2 ? items : Array.from({ length: virtualCount }, (_, i) => ({}));
      synthesized = itemList.map((_it: any, i: number) => ({
        id: `${section.id}-sp2-svc${i}`,
        type: typeId as any,
        content: {} as any,
        style: {} as any,
      }));
    } else {
      const prefix = sectionType === 'testimonials' ? 'tp' : 'fp';
      const itemPrefix = sectionType === 'testimonials' ? 'tp-rev' : 'fp-feat';
      const itemList = items.length >= 2 ? items : Array.from({ length: virtualCount }, (_, i) => ({ id: `${itemPrefix}-${i}` }));
      synthesized = itemList.map((it: any, i: number) => ({
        id: `${section.id}-${prefix}-${it.id || `${itemPrefix}-${i}`}`,
        type: typeId as any,
        content: {} as any,
        style: {} as any,
      }));
    }
    // Merge with whatever elements already exist (header / badges / etc.)
    return [...elements, ...synthesized];
  };

  // Apply a style key to a set of element ids. If `materializeAsType` is given,
  // synthesize the section's per-card elements first (for fresh sections).
  const applyToIds = (key: string, val: string, ids: string[], materializeAsType?: string) => {
    const baseList = materializeAsType ? ensureMaterialized(materializeAsType) : elements;
    // If still no specific ids (e.g. virtual mode with bulk apply), target every element of that type
    let targetIds = ids;
    if (targetIds.length === 0 && materializeAsType) {
      targetIds = baseList.filter(el => el.type === materializeAsType).map(el => el.id);
    }
    if (targetIds.length === 0) return;
    const idSet = new Set(targetIds);
    const nextElements = baseList.map(el => {
      if (!idSet.has(el.id)) return el;
      const nextStyle = { ...(el.style || {}) } as any;
      if (val === '' || val === undefined || val === null) {
        delete nextStyle[key];
      } else {
        nextStyle[key] = val;
      }
      return { ...el, style: nextStyle };
    });
    onSectionUpdate(section.id, { elements: nextElements });
  };

  /**
   * Atomic multi-key write across all elements of a given type. Handles the
   * synthetic-element materialization the same way `applyToIds` does, but
   * applies a `patch` object (multiple keys) in a single setSiteData call.
   * Used by Shape & Spacing controls — overwrites every element regardless
   * of individual overrides (force semantics — that's the point of bulk shape).
   *
   * Type-scoped via closure: caller provides the type via `targetType` arg.
   */
  const makeApplyManyForType = (targetType: string) => (patch: Record<string, any>, materializeAsType?: string) => {
    const baseList = materializeAsType ? ensureMaterialized(materializeAsType) : elements;
    const nextElements = baseList.map(el => {
      if (el.type !== targetType) return el;
      const nextStyle = { ...(el.style || {}) } as any;
      Object.entries(patch).forEach(([k, v]) => {
        if (v === '' || v === undefined || v === null) {
          delete nextStyle[k];
        } else {
          nextStyle[k] = v;
        }
      });
      return { ...el, style: nextStyle };
    });
    onSectionUpdate(section.id, { elements: nextElements });
  };

  // "Reset all" — strips every reset key from every element of the given type.
  const resetType = (cfg: TypeConfig) => {
    const baseList = ensureMaterialized(cfg.type);
    const ids = baseList.filter(el => el.type === cfg.type).map(el => el.id);
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const nextElements = baseList.map(el => {
      if (!idSet.has(el.id)) return el;
      const nextStyle = { ...(el.style || {}) } as any;
      cfg.resetKeys.forEach(k => { delete nextStyle[k]; });
      return { ...el, style: nextStyle };
    });
    onSectionUpdate(section.id, { elements: nextElements });
  };

  return (
    <AccordionGroup title="Apply to all elements" defaultOpen={false}>
      <div className="space-y-4">
        <p className="text-[10px] text-white/40 leading-relaxed">
          Change a style for every element of the same type at once. Cards with individual edits are kept by default — use "Override all" to push your change to them too.
        </p>
        {eligibleTypes.map(({ config, matches }) => {
          const isVirtualGroup = matches.length === 0 && config.type === expectedType;
          const groupTotal = isVirtualGroup ? virtualCount : matches.length;
          const matAs = isVirtualGroup ? expectedType : undefined;
          return (
            <div key={config.type} className="bg-[#0E0E0E] border border-[#222] rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">
                  All {config.label} <span className="text-white/40 ml-1">({groupTotal})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => resetType(config)}
                  className="text-[9px] font-bold text-white/50 hover:text-white/80 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                  title={`Strip all overrides from every ${config.label.toLowerCase()}`}
                >
                  <i className="fa-solid fa-rotate-left text-[8px] mr-1" />
                  Reset all
                </button>
              </div>
              <div className="space-y-3">
                {config.controls.map(ctrl => (
                  <BulkControlRow
                    key={ctrl.key}
                    spec={ctrl}
                    matchingElements={matches}
                    virtualTotal={groupTotal}
                    materializeAsType={matAs}
                    applyValueToElements={applyToIds}
                  />
                ))}
              </div>
              {config.hasCardShape && (
                <BulkShapeControls
                  matchingElements={matches}
                  virtualTotal={groupTotal}
                  materializeAsType={matAs}
                  applyManyToAllOfType={makeApplyManyForType(config.type)}
                />
              )}
              {config.type === 'image-box' && (
                <BulkImageControls
                  matchingElements={matches}
                  virtualTotal={groupTotal}
                  materializeAsType={matAs}
                  applyManyToAllOfType={makeApplyManyForType(config.type)}
                />
              )}
            </div>
          );
        })}
      </div>
    </AccordionGroup>
  );
};
