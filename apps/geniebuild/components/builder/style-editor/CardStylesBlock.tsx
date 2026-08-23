import React from 'react';
import { AccordionGroup, ColorInput, NumericUnitInput, RangeInput, SelectInput, FontSizeInput, TextInput } from '../inputs';
import { colorToHex } from '../state/sectionUpdaters';

interface CardStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/** Reset button row used at the top of Card / Accordion blocks. */
const ResetRow: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="mb-3">
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReset(); }}
      className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
    >
      <i className="fa-solid fa-rotate-left"></i> Reset to Theme
    </button>
  </div>
);

const parsePx = (val: string | undefined, defaultVal: number): number => {
  if (!val || typeof val !== 'string') return defaultVal;
  const num = parseFloat(val);
  if (val.includes('rem')) return Math.round(num * 16);
  if (val.includes('px')) return Math.round(num);
  return Math.round(num) || defaultVal;
};

const WEIGHTS = [
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
];

export const CardStylesBlock: React.FC<CardStylesBlockProps> = ({ styles, onUpdate, onBatchUpdate, themeColors }) => {
  const borderRadiusPx = parsePx(styles.borderRadius, 16);
  const paddingPx = parsePx(styles.padding, 24);
  const themeAccent = themeColors?.accentColor || '#6366f1';

  const reset = () => {
    const patch: Record<string, any> = {};
    Object.keys(styles || {}).forEach((k) => {
      if (k.startsWith('title') || k.startsWith('description') || k.startsWith('badge') ||
          k.startsWith('link') || k.startsWith('image') || k.startsWith('hover') ||
          k === 'contentGap' || k === 'backgroundColor' || k === 'borderColor' ||
          k === 'borderWidth' || k === 'borderRadius' || k === 'padding' || k === 'boxShadow') {
        patch[k] = '';
      }
    });
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      <ResetRow onReset={reset} />

      {/* CARD BOX */}
      <AccordionGroup title="Card Box" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput label={styles.backgroundColor ? "Background" : "Background (Inherited)"} value={styles.backgroundColor || themeColors?.cardBackgroundColor || '#FFFFFF'} onChange={(v) => onUpdate('backgroundColor', colorToHex(v) || v)} onReset={() => onUpdate('backgroundColor', '')} />
          <ColorInput label={styles.borderColor ? "Border Color" : "Border Color (Inherited)"} value={styles.borderColor || themeColors?.cardBorderColor || '#E5E7EB'} onChange={(v) => onUpdate('borderColor', colorToHex(v) || v)} onReset={() => onUpdate('borderColor', '')} />
          <RangeInput label="Border Width" value={parsePx(styles.borderWidth, 1)} min={0} max={6} step={1} unit="px" onChange={(v) => onUpdate('borderWidth', `${v}px`)} />
          <RangeInput label="Corner Radius" value={Math.min(48, Math.max(0, borderRadiusPx))} min={0} max={48} step={2} unit="px" onChange={(v) => onUpdate('borderRadius', `${v}px`)} />
          <RangeInput label="Padding" value={Math.min(96, Math.max(0, paddingPx))} min={0} max={96} step={4} unit="px" onChange={(v) => onUpdate('padding', `${v}px`)} />
          <NumericUnitInput label="Content Gap" value={styles.contentGap || ''} onChange={(v) => onUpdate('contentGap', v)} placeholder="0.75rem" units={['rem', 'px', 'em']} step={0.125} min={0} max={4} />
          <TextInput label="Box Shadow (rest)" value={styles.boxShadow || ''} onChange={(v) => onUpdate('boxShadow', v)} placeholder="0 1px 3px rgba(0,0,0,.1)" />
        </div>
      </AccordionGroup>

      {/* HOVER */}
      <AccordionGroup title="Hover Effect" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Hover Lift"
            value={styles.hoverLift === false || styles.hoverEffect === 'none' ? 'off' : 'on'}
            options={[{ label: 'On (lift + shadow)', value: 'on' }, { label: 'Off', value: 'off' }]}
            onChange={(v) => { onUpdate('hoverLift', v === 'on'); if (v === 'on') onUpdate('hoverEffect', ''); else onUpdate('hoverEffect', 'none'); }}
          />
          <NumericUnitInput label="Lift Distance" value={styles.hoverLiftDistance || ''} onChange={(v) => onUpdate('hoverLiftDistance', v)} placeholder="-4px" units={['px', 'rem']} step={1} min={-24} max={0} />
          <TextInput label="Hover Shadow" value={styles.hoverBoxShadow || ''} onChange={(v) => onUpdate('hoverBoxShadow', v)} placeholder="0 20px 40px -12px rgba(0,0,0,.25)" />
        </div>
      </AccordionGroup>

      {/* IMAGE */}
      <AccordionGroup title="Image" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Aspect Ratio"
            value={styles.imageAspectRatio || '16/9'}
            options={[
              { label: '16:9 (wide)', value: '16/9' },
              { label: '4:3', value: '4/3' },
              { label: '1:1 (square)', value: '1/1' },
              { label: '3:2', value: '3/2' },
              { label: '21:9 (ultra-wide)', value: '21/9' },
            ]}
            onChange={(v) => onUpdate('imageAspectRatio', v)}
          />
          <SelectInput
            label="Object Fit"
            value={styles.imageObjectFit || 'cover'}
            options={[{ label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }, { label: 'Fill', value: 'fill' }]}
            onChange={(v) => onUpdate('imageObjectFit', v)}
          />
        </div>
      </AccordionGroup>

      {/* TITLE */}
      <AccordionGroup title="Title" defaultOpen={false}>
        <div className="space-y-3">
          <FontSizeInput label="Font Size" value={styles.titleFontSize || ''} onChange={(v) => onUpdate('titleFontSize', v)} placeholder="1.125rem" />
          <SelectInput label="Font Weight" value={styles.titleFontWeight || '700'} options={WEIGHTS} onChange={(v) => onUpdate('titleFontWeight', v)} />
          <NumericUnitInput label="Line Height" value={styles.titleLineHeight || ''} onChange={(v) => onUpdate('titleLineHeight', v)} placeholder="1.35" units={['', 'px', 'em']} step={0.05} min={0.8} max={3} />
          <ColorInput label={styles.titleColor ? "Color" : "Color (Inherited)"} value={styles.titleColor || ''} onChange={(v) => onUpdate('titleColor', colorToHex(v) || v)} onReset={() => onUpdate('titleColor', '')} />
        </div>
      </AccordionGroup>

      {/* DESCRIPTION */}
      <AccordionGroup title="Description" defaultOpen={false}>
        <div className="space-y-3">
          <FontSizeInput label="Font Size" value={styles.descriptionFontSize || ''} onChange={(v) => onUpdate('descriptionFontSize', v)} placeholder="0.875rem" />
          <SelectInput label="Font Weight" value={styles.descriptionFontWeight || '400'} options={WEIGHTS} onChange={(v) => onUpdate('descriptionFontWeight', v)} />
          <NumericUnitInput label="Line Height" value={styles.descriptionLineHeight || ''} onChange={(v) => onUpdate('descriptionLineHeight', v)} placeholder="1.625" units={['', 'px', 'em']} step={0.05} min={0.8} max={3} />
          <RangeInput label="Opacity" value={styles.descriptionOpacity !== undefined && styles.descriptionOpacity !== '' ? Math.round(Number(styles.descriptionOpacity) * 100) : 80} min={0} max={100} step={5} onChange={(v) => onUpdate('descriptionOpacity', v / 100)} />
          <ColorInput label={styles.descriptionColor ? "Color" : "Color (Inherited)"} value={styles.descriptionColor || ''} onChange={(v) => onUpdate('descriptionColor', colorToHex(v) || v)} onReset={() => onUpdate('descriptionColor', '')} />
        </div>
      </AccordionGroup>

      {/* BADGE */}
      <AccordionGroup title="Badge" defaultOpen={false}>
        <div className="space-y-3">
          <FontSizeInput label="Font Size" value={styles.badgeFontSize || ''} onChange={(v) => onUpdate('badgeFontSize', v)} placeholder="0.75rem" />
          <TextInput label="Padding" value={styles.badgePadding || ''} onChange={(v) => onUpdate('badgePadding', v)} placeholder="4px 12px" />
          <NumericUnitInput label="Radius" value={styles.badgeRadius || ''} onChange={(v) => onUpdate('badgeRadius', v)} placeholder="9999px" units={['px', 'rem', '%']} step={1} min={0} max={9999} />
          <ColorInput label={styles.badgeBackgroundColor ? "Background" : "Background (Auto)"} value={styles.badgeBackgroundColor || `${themeAccent}22`} onChange={(v) => onUpdate('badgeBackgroundColor', colorToHex(v) || v)} onReset={() => onUpdate('badgeBackgroundColor', '')} />
          <ColorInput label={styles.badgeColor ? "Text Color" : "Text Color (Inherited)"} value={styles.badgeColor || themeAccent} onChange={(v) => onUpdate('badgeColor', colorToHex(v) || v)} onReset={() => onUpdate('badgeColor', '')} />
        </div>
      </AccordionGroup>

      {/* LINK */}
      <AccordionGroup title="Link" defaultOpen={false}>
        <div className="space-y-3">
          <FontSizeInput label="Font Size" value={styles.linkFontSize || ''} onChange={(v) => onUpdate('linkFontSize', v)} placeholder="0.875rem" />
          <ColorInput label={styles.linkColor ? "Color" : "Color (Inherited)"} value={styles.linkColor || themeAccent} onChange={(v) => onUpdate('linkColor', colorToHex(v) || v)} onReset={() => onUpdate('linkColor', '')} />
        </div>
      </AccordionGroup>
    </>
  );
};

export const AccordionStylesBlock: React.FC<CardStylesBlockProps> = ({ styles, onUpdate, onBatchUpdate, themeColors }) => {
  const borderRadiusPx = parsePx(styles.borderRadius, 20);
  const paddingPx = parsePx(styles.padding, 20);

  const reset = () => {
    const patch = {
      backgroundColor: '', borderColor: '', titleColor: '', color: '',
      borderRadius: '', padding: '',
      iconType: '', iconPosition: '', iconSize: '', iconColor: '',
      iconBackgroundColor: '', iconShape: '',
      activeBackgroundColor: '', activeBorderColor: '', activeTitleColor: '',
      hoverBackgroundColor: '',
      itemGap: '', borderWidth: '', borderStyle: '',
      questionFontSize: '', questionFontWeight: '',
      answerFontSize: '', answerLineHeight: '',
      dividerColor: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  const iconType: string = styles.iconType || 'chevron';
  const hasIcon = iconType !== 'none';

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

      {/* ── 1. ITEM CARD ────────────────────────────────────────────── */}
      <AccordionGroup title="Item Card" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={styles.backgroundColor ? "Background" : "Background (Inherited)"}
            value={styles.backgroundColor || themeColors?.accordionBackgroundColor || themeColors?.cardBackgroundColor || '#FFFFFF'}
            onChange={(v) => onUpdate('backgroundColor', colorToHex(v) || v)}
            onReset={() => onUpdate('backgroundColor', '')}
          />
          <ColorInput
            label={styles.borderColor ? "Border Color" : "Border Color (Inherited)"}
            value={styles.borderColor || themeColors?.accordionBorderColor || themeColors?.cardBorderColor || '#E5E7EB'}
            onChange={(v) => onUpdate('borderColor', colorToHex(v) || v)}
            onReset={() => onUpdate('borderColor', '')}
          />
          <RangeInput
            label="Border Width"
            value={parsePx(styles.borderWidth, 1)}
            min={0} max={6} step={1} unit="px"
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
            onChange={(v) => onUpdate('borderStyle', v)}
          />
          <RangeInput
            label="Border Radius"
            value={Math.min(48, Math.max(0, borderRadiusPx))}
            min={0} max={48} step={2} unit="px"
            onChange={(v) => onUpdate('borderRadius', `${v}px`)}
          />
          <RangeInput
            label="Padding"
            value={Math.min(96, Math.max(0, paddingPx))}
            min={0} max={96} step={4} unit="px"
            onChange={(v) => onUpdate('padding', `${v}px`)}
          />
          <NumericUnitInput
            label="Gap Between Items"
            value={styles.itemGap || ''}
            onChange={(v) => onUpdate('itemGap', v)}
            placeholder="0.75rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. ICON ─────────────────────────────────────────────────── */}
      <AccordionGroup title="Icon" defaultOpen={false}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Icon Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'chevron', label: 'Chevron', icon: 'fa-chevron-down' },
                { value: 'plus',    label: 'Plus/Minus', icon: 'fa-plus' },
                { value: 'arrow',   label: 'Arrow',   icon: 'fa-arrow-down' },
                { value: 'caret',   label: 'Caret',   icon: 'fa-caret-down' },
                { value: 'none',    label: 'None',    icon: 'fa-ban' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('iconType', opt.value)}
                  className={`py-2.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                    iconType === opt.value
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${opt.icon} text-sm`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          {hasIcon && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase">Icon Position</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'left',  label: 'Left',  ico: 'fa-arrow-left' },
                    { value: 'right', label: 'Right', ico: 'fa-arrow-right' },
                  ].map(opt => {
                    const active = (styles.iconPosition || 'right') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onUpdate('iconPosition', opt.value)}
                        className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-1.5 ${
                          active
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                        }`}
                      >
                        <i className={`fa-solid ${opt.ico}`} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <SelectInput
                label="Icon Shape (chip)"
                value={styles.iconShape || 'circle'}
                options={[
                  { label: 'Circle (chip)', value: 'circle' },
                  { label: 'Square (chip)', value: 'square' },
                  { label: 'No chip',       value: 'none' },
                ]}
                onChange={(v) => onUpdate('iconShape', v)}
              />
              <NumericUnitInput
                label="Icon Size"
                value={styles.iconSize || ''}
                onChange={(v) => onUpdate('iconSize', v)}
                placeholder="0.875rem"
                units={['rem', 'px', 'em']}
                step={0.0625}
                min={0.5}
                max={2.5}
              />
              <ColorInput
                label={styles.iconColor ? "Icon Color" : "Icon Color (Inherited)"}
                value={styles.iconColor || themeColors?.accentColor || '#3b82f6'}
                onChange={(v) => onUpdate('iconColor', colorToHex(v) || v)}
                onReset={() => onUpdate('iconColor', '')}
              />
              {styles.iconShape !== 'none' && (
                <ColorInput
                  label={styles.iconBackgroundColor ? "Icon Chip Background" : "Icon Chip Background (Inherited)"}
                  value={styles.iconBackgroundColor || ''}
                  onChange={(v) => onUpdate('iconBackgroundColor', colorToHex(v) || v)}
                  onReset={() => onUpdate('iconBackgroundColor', '')}
                />
              )}
            </>
          )}
        </div>
      </AccordionGroup>

      {/* ── 3. QUESTION TEXT ────────────────────────────────────────── */}
      <AccordionGroup title="Question Text" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.titleColor ? "Color" : "Color (Inherited)"}
            value={styles.titleColor || themeColors?.accordionQuestionColor || themeColors?.titleColor || '#F8FAFC'}
            onChange={(v) => onUpdate('titleColor', colorToHex(v) || v)}
            onReset={() => onUpdate('titleColor', '')}
          />
          <NumericUnitInput
            label="Font Size"
            value={styles.questionFontSize || ''}
            onChange={(v) => onUpdate('questionFontSize', v)}
            placeholder="1.125rem"
            units={['rem', 'px', 'em']}
            step={0.0625}
            min={0.75}
            max={2.5}
          />
          <SelectInput
            label="Font Weight"
            value={String(styles.questionFontWeight || '700')}
            options={[
              { label: 'Regular',  value: '400' },
              { label: 'Medium',   value: '500' },
              { label: 'Semibold', value: '600' },
              { label: 'Bold',     value: '700' },
              { label: 'Black',    value: '800' },
            ]}
            onChange={(v) => onUpdate('questionFontWeight', v)}
          />
        </div>
      </AccordionGroup>

      {/* ── 4. ANSWER TEXT ──────────────────────────────────────────── */}
      <AccordionGroup title="Answer Text" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label={styles.color ? "Color" : "Color (Inherited)"}
            value={styles.color || themeColors?.accordionAnswerColor || themeColors?.textColor || '#D1D5DB'}
            onChange={(v) => onUpdate('color', colorToHex(v) || v)}
            onReset={() => onUpdate('color', '')}
          />
          <NumericUnitInput
            label="Font Size"
            value={styles.answerFontSize || ''}
            onChange={(v) => onUpdate('answerFontSize', v)}
            placeholder="1rem"
            units={['rem', 'px', 'em']}
            step={0.0625}
            min={0.75}
            max={1.75}
          />
          <NumericUnitInput
            label="Line Height"
            value={styles.answerLineHeight || ''}
            onChange={(v) => onUpdate('answerLineHeight', v)}
            placeholder="1.65"
            units={['', 'px', 'rem', '%']}
            step={0.05}
            min={1}
            max={3}
          />
          <ColorInput
            label={styles.dividerColor ? "Divider (between question & answer)" : "Divider (between question & answer) (Inherited)"}
            value={styles.dividerColor || ''}
            onChange={(v) => onUpdate('dividerColor', colorToHex(v) || v)}
            onReset={() => onUpdate('dividerColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 5. STATES (open / hover) ────────────────────────────────── */}
      <AccordionGroup title="States" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Customize how an item looks when it's open or hovered. Leave empty to fall back to the default styling.
          </p>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">When Open</h5>
          <ColorInput
            label={styles.activeBackgroundColor ? "Background" : "Background (Inherited)"}
            value={styles.activeBackgroundColor || ''}
            onChange={(v) => onUpdate('activeBackgroundColor', colorToHex(v) || v)}
            onReset={() => onUpdate('activeBackgroundColor', '')}
          />
          <ColorInput
            label={styles.activeBorderColor ? "Border Color" : "Border Color (Inherited)"}
            value={styles.activeBorderColor || ''}
            onChange={(v) => onUpdate('activeBorderColor', colorToHex(v) || v)}
            onReset={() => onUpdate('activeBorderColor', '')}
          />
          <ColorInput
            label={styles.activeTitleColor ? "Question Color" : "Question Color (Inherited)"}
            value={styles.activeTitleColor || ''}
            onChange={(v) => onUpdate('activeTitleColor', colorToHex(v) || v)}
            onReset={() => onUpdate('activeTitleColor', '')}
          />
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-white/5">On Hover</h5>
          <ColorInput
            label={styles.hoverBackgroundColor ? "Background" : "Background (Inherited)"}
            value={styles.hoverBackgroundColor || ''}
            onChange={(v) => onUpdate('hoverBackgroundColor', colorToHex(v) || v)}
            onReset={() => onUpdate('hoverBackgroundColor', '')}
          />
        </div>
      </AccordionGroup>
    </>
  );
};
