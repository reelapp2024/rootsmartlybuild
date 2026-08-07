import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import { AccordionGroup, ButtonGroup, ColorInput, RangeInput, SelectInput, TextInput } from '../inputs';

/**
 * @deprecated Prefer dedicated *StylesBlock per element type (HeadingStylesBlock,
 * TextStylesBlock, …). TypographyBlock remains only as a fallback for types
 * without a dedicated Design panel — do not add new usages.
 */
interface TypographyBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  context: 'section' | 'element';
  elementType?: string;
  sectionId?: string;
  themeColors?: any;
  normalizedTheme?: any;
  defaultTypography?: any;
  onSectionStyleUpdate?: (sectionId: string, key: string, value: any) => void;
}

export const TypographyBlock: React.FC<TypographyBlockProps> = ({
  styles,
  onUpdate,
  onBatchUpdate,
  context,
  elementType,
  sectionId,
  themeColors,
  normalizedTheme,
  defaultTypography,
  onSectionStyleUpdate,
}) => {
  const parseCssToPx = (val?: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return 16;
    const num = parseFloat(val);
    if (!Number.isFinite(num)) return 16;
    if (val.includes('rem')) return num * 16;
    if (val.includes('em')) return num * 16;
    if (val.includes('px')) return num;
    return num;
  };
  const parseLineHeightMultiplier = (lh?: unknown, fontSizeStr?: unknown): number => {
    if (typeof lh === 'number' && Number.isFinite(lh)) return lh;
    if (typeof lh !== 'string' || lh.trim() === '') return 1.25;
    const num = parseFloat(lh);
    if (!Number.isFinite(num)) return 1.25;
    if (lh.includes('px') || lh.includes('rem') || lh.includes('em')) {
      const fontPx = parseCssToPx(fontSizeStr as any);
      if (!Number.isFinite(fontPx) || fontPx <= 0) return 1.25;
      const lhPx = parseCssToPx(lh);
      return Math.min(3, Math.max(0.5, lhPx / fontPx));
    }
    return Math.min(3, Math.max(0.5, num));
  };

  return (
    <AccordionGroup title="Typography" defaultOpen={true}>
      {/* Icon Reset Button */}
      {elementType === 'icon' && (
        <div className="mb-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onBatchUpdate) onBatchUpdate({ color: '' });
              else onUpdate('color', '');
            }}
            className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            title="Reset to default dynamic theme icon color"
          >
            <i className="fa-solid fa-rotate-left"></i>
            Default Theme Icon
          </button>
        </div>
      )}

      {elementType !== 'badge' && (
        <ColorInput
          label={elementType === 'icon' ? 'Icon Color' : 'Text Color'}
          value={
            styles.color ||
            styles.textColor ||
            (elementType === 'icon' ? (styles.iconColor || themeColors?.iconColor || themeColors?.accentColor) :
              (elementType === 'heading' ? themeColors?.titleColor :
                themeColors?.textColor)) ||
            ''
          }
          onChange={(v) => onUpdate(elementType === 'icon' ? 'iconColor' : 'color', v)}
          onReset={() => onUpdate(elementType === 'icon' ? 'iconColor' : 'color', '')}
        />
      )}

      {(elementType === 'feature-box' || elementType === 'icon-box' || elementType === 'stat-card') && (
        <div className="mt-3 space-y-3">
          <ColorInput
            label="Icon Color"
            value={styles.iconColor || themeColors?.iconColor || themeColors?.accentColor || ''}
            onChange={(v) => onUpdate('iconColor', v)}
            onReset={() => onUpdate('iconColor', '')}
          />
          <ColorInput
            label="Icon Background"
            value={styles.iconBackgroundColor || ''}
            onChange={(v) => onUpdate('iconBackgroundColor', v)}
            onReset={() => onUpdate('iconBackgroundColor', '')}
          />
          <SelectInput
            label="Title Font Family"
            value={styles.titleFontFamily || ''}
            options={[
              { label: `Theme Default (${(defaultTypography?.titleFontFamily || 'Inter').split(',')[0].replace(/['"]/g, '').trim()})`, value: '' },
              ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
            ]}
            onChange={(v: string) => onUpdate('titleFontFamily', v === '' ? undefined : v)}
          />
          <SelectInput
            label="Description Font Family"
            value={styles.descriptionFontFamily || ''}
            options={[
              { label: `Theme Default (${(defaultTypography?.descriptionFontFamily || 'Inter').split(',')[0].replace(/['"]/g, '').trim()})`, value: '' },
              ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
            ]}
            onChange={(v: string) => onUpdate('descriptionFontFamily', v === '' ? undefined : v)}
          />
          <RangeInput
            label="Title Font Size"
            value={parseInt((styles.titleFontSize || '20').toString().replace(/[^0-9]/g, '')) || 20}
            min={12} max={64}
            onChange={(v) => onUpdate('titleFontSize', `${v}px`)}
          />
          <RangeInput
            label="Description Font Size"
            value={parseInt((styles.descriptionFontSize || '14').toString().replace(/[^0-9]/g, '')) || 14}
            min={10} max={32}
            onChange={(v) => onUpdate('descriptionFontSize', `${v}px`)}
          />
        </div>
      )}

      {elementType === 'heading' && (
        <div className="mt-3">
          <ColorInput
            label="Secondary Heading Color"
            value={styles.secondaryHeadingColor || normalizedTheme?.secondaryHeadingColor || '#F59E0B'}
            onChange={(v) => {
              if (context === 'element' && sectionId && onSectionStyleUpdate) {
                onSectionStyleUpdate(sectionId, 'secondaryHeadingColor', v);
              } else {
                onUpdate('secondaryHeadingColor', v);
              }
            }}
            onReset={() => {
              if (context === 'element' && sectionId && onSectionStyleUpdate) onSectionStyleUpdate(sectionId, 'secondaryHeadingColor', '');
              else onUpdate('secondaryHeadingColor', '');
            }}
          />
          <p className="text-[9px] text-white/30 mt-1 italic ml-1">Controls the color of highlighted words (spans) in the heading.</p>
        </div>
      )}

      {(elementType === 'stat-card' || elementType === 'counter' || elementType === 'countdown-timer' || elementType === 'testimonial' || elementType === 'pricing-table') && (
        <div className="mt-3">
          <ColorInput
            label="Subheading Color"
            value={styles.subheadingColor || normalizedTheme?.subheadingColor || themeColors?.textColor || ''}
            onChange={(v) => onUpdate('subheadingColor', v)}
            onReset={() => onUpdate('subheadingColor', '')}
          />
          <p className="text-[9px] text-white/30 mt-1 italic ml-1">Controls the color of labels, roles, or periods.</p>
        </div>
      )}

      {(elementType === 'heading' || elementType === 'text') && (
        <SelectInput
          label="Font Family"
          value={styles.fontFamily || ''}
          options={[
            {
              label: `Theme Default (${(
                (elementType === 'heading' ? defaultTypography?.titleFontFamily : defaultTypography?.descriptionFontFamily) || 'Inter'
              ).split(',')[0].replace(/['"]/g, '').trim()})`,
              value: '',
            },
            ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
          ]}
          onChange={(v: string) => {
            if (v === '') onUpdate('fontFamily', undefined);
            else onUpdate('fontFamily', v);
          }}
        />
      )}

      {elementType === 'icon' && (
        <div className="space-y-4 mb-4">
          <RangeInput
            label="Icon Size"
            value={parseInt((styles.fontSize || '32').toString().replace(/[^0-9]/g, '')) || 32}
            min={16} max={128} step={4} unit="px"
            onChange={(v) => onUpdate('fontSize', `${v}px`)}
          />
          <TextInput label="Container Size" value={styles.iconContainerSize || ''} onChange={(v) => onUpdate('iconContainerSize', v)} placeholder="3rem" />
          <ColorInput label="Icon Background" value={styles.iconBackgroundColor || ''} onChange={(v) => onUpdate('iconBackgroundColor', v)} onReset={() => onUpdate('iconBackgroundColor', '')} />

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
                { label: 'Glow', value: `0 0 15px ${styles.color || themeColors?.accentColor || 'rgba(255,255,255,0.3)'}` },
              ]}
              onChange={(v) => onUpdate('iconShadow', v)}
            />
          </div>

          <div className="pt-2 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Icon Border Radius</h4>
            <RangeInput
              label="All Corners"
              value={styles.iconBorderRadius !== undefined ? parseInt(styles.iconBorderRadius.toString().replace(/[^0-9]/g, '')) : 0}
              min={0} max={100}
              onChange={(v) => {
                onUpdate('iconBorderRadius', `${v}px`);
                onUpdate('iconBorderTopLeftRadius', '');
                onUpdate('iconBorderTopRightRadius', '');
                onUpdate('iconBorderBottomRightRadius', '');
                onUpdate('iconBorderBottomLeftRadius', '');
              }}
            />
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              <RangeInput
                label="Top Left"
                value={styles.iconBorderTopLeftRadius !== undefined ? parseInt(styles.iconBorderTopLeftRadius.toString().replace(/[^0-9]/g, '')) : (styles.iconBorderRadius !== undefined ? parseInt(styles.iconBorderRadius.toString().replace(/[^0-9]/g, '')) : 0)}
                min={0} max={100}
                onChange={(v) => onUpdate('iconBorderTopLeftRadius', `${v}px`)}
              />
              <RangeInput
                label="Top Right"
                value={styles.iconBorderTopRightRadius !== undefined ? parseInt(styles.iconBorderTopRightRadius.toString().replace(/[^0-9]/g, '')) : (styles.iconBorderRadius !== undefined ? parseInt(styles.iconBorderRadius.toString().replace(/[^0-9]/g, '')) : 0)}
                min={0} max={100}
                onChange={(v) => onUpdate('iconBorderTopRightRadius', `${v}px`)}
              />
              <RangeInput
                label="Bottom Right"
                value={styles.iconBorderBottomRightRadius !== undefined ? parseInt(styles.iconBorderBottomRightRadius.toString().replace(/[^0-9]/g, '')) : (styles.iconBorderRadius !== undefined ? parseInt(styles.iconBorderRadius.toString().replace(/[^0-9]/g, '')) : 0)}
                min={0} max={100}
                onChange={(v) => onUpdate('iconBorderBottomRightRadius', `${v}px`)}
              />
              <RangeInput
                label="Bottom Left"
                value={styles.iconBorderBottomLeftRadius !== undefined ? parseInt(styles.iconBorderBottomLeftRadius.toString().replace(/[^0-9]/g, '')) : (styles.iconBorderRadius !== undefined ? parseInt(styles.iconBorderRadius.toString().replace(/[^0-9]/g, '')) : 0)}
                min={0} max={100}
                onChange={(v) => onUpdate('iconBorderBottomLeftRadius', `${v}px`)}
              />
            </div>
          </div>
        </div>
      )}

      <SelectInput label="Font Weight" value={styles.fontWeight || '400'} options={[{ label: 'Normal', value: '400' }, { label: 'Bold', value: '700' }, { label: 'Black', value: '900' }, { label: 'Light', value: '300' }]} onChange={(v) => onUpdate('fontWeight', v)} />

      {(elementType === 'heading' || elementType === 'text') && (() => {
        const clamped = Math.min(3, Math.max(0.8, parseLineHeightMultiplier(styles.lineHeight, styles.fontSize)));
        return (
          <RangeInput
            label="Line Height"
            value={clamped}
            min={0.8} max={3} step={0.05} unit=""
            onChange={(v) => onUpdate('lineHeight', `${v}`)}
          />
        );
      })()}

      <div className="mt-2">
        <label className="text-[10px] font-bold text-white/40 capitalize ml-1 mb-1 block">Alignment</label>
        <ButtonGroup
          value={styles.textAlign || 'left'}
          onChange={(v) => onUpdate('textAlign', v)}
          options={[
            { icon: 'fa-align-left', value: 'left', label: 'Left' },
            { icon: 'fa-align-center', value: 'center', label: 'Center' },
            { icon: 'fa-align-right', value: 'right', label: 'Right' },
            { icon: 'fa-align-justify', value: 'justify', label: 'Justify' },
          ]}
        />
      </div>
      <div className="mt-4">
        <SelectInput
          label="Text Transform"
          value={styles.textTransform || ''}
          options={[
            { label: 'None', value: '' },
            { label: 'Uppercase', value: 'uppercase' },
            { label: 'Lowercase', value: 'lowercase' },
            { label: 'Capitalize', value: 'capitalize' },
          ]}
          onChange={(v: string) => onUpdate('textTransform', v)}
        />
      </div>
    </AccordionGroup>
  );
};
