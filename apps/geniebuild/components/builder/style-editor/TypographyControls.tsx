import React from 'react';
import { PRESET_FONTS } from '../../../constants';
import {
  ButtonGroup, NumericUnitInput, ResponsiveFontSizeInput, SelectInput,
} from '../inputs';

interface TypographyControlsProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  /** Field key prefixes — set when this is for a child element (e.g. 'title', 'description'). */
  prefix?: string;
  /** Show alignment row. Default true. */
  showAlignment?: boolean;
  /** Show line-height. Default true. */
  showLineHeight?: boolean;
  /** Show letter-spacing. Default true. */
  showLetterSpacing?: boolean;
  /** Show text-transform. Default true. */
  showTextTransform?: boolean;
  /** Show font-style (italic). Default true. */
  showFontStyle?: boolean;
  /** Show responsive font-size. Default true. (Off for inline / chip-like text where clamp is overkill.) */
  showFontSize?: boolean;
  /** Placeholder for font-size when shown. */
  fontSizePlaceholder?: string;
}

const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const key = (prefix: string | undefined, base: string): string => {
  if (!prefix) return base;
  // titleColor → titleFontSize, titleFontWeight, etc.
  return `${prefix}${cap(base)}`;
};

const WEIGHT_OPTIONS = [
  { label: 'Light',      value: '300' },
  { label: 'Regular',    value: '400' },
  { label: 'Medium',     value: '500' },
  { label: 'Semibold',   value: '600' },
  { label: 'Bold',       value: '700' },
  { label: 'Extra Bold', value: '800' },
  { label: 'Black',      value: '900' },
];

/**
 * Reusable Typography controls — drop-in for any element style block that has text content.
 *
 * By default writes to top-level style keys: fontFamily, fontSize, fontWeight, fontStyle,
 * textTransform, lineHeight, letterSpacing, textAlign.
 *
 * Pass `prefix="title"` to target prefixed keys: titleFontFamily, titleFontSize, etc.
 * (Used when an element has multiple text parts — e.g. testimonial-card has quote + title + author.)
 */
export const TypographyControls: React.FC<TypographyControlsProps> = ({
  styles, onUpdate, prefix,
  showAlignment = true,
  showLineHeight = true,
  showLetterSpacing = true,
  showTextTransform = true,
  showFontStyle = true,
  showFontSize = true,
  fontSizePlaceholder = '1rem',
}) => {
  const k = (base: string) => key(prefix, base);

  return (
    <div className="space-y-3 min-w-0">
      <SelectInput
        label="Font Family"
        value={styles[k('fontFamily')] || ''}
        options={[
          { label: 'Theme Default', value: '' },
          ...PRESET_FONTS.map((f) => ({ label: f.name, value: f.value })),
        ]}
        onChange={(v: string) => onUpdate(k('fontFamily'), v === '' ? undefined : v)}
      />
      {showFontSize && (
        <ResponsiveFontSizeInput
          label="Font Size"
          value={styles[k('fontSize')] || ''}
          onChange={(v) => onUpdate(k('fontSize'), v)}
          placeholder={fontSizePlaceholder}
        />
      )}
      <SelectInput
        label="Font Weight"
        value={String(styles[k('fontWeight')] || '400')}
        options={WEIGHT_OPTIONS}
        onChange={(v) => onUpdate(k('fontWeight'), v)}
      />
      {showFontStyle && (
        <SelectInput
          label="Font Style"
          value={styles[k('fontStyle')] || 'normal'}
          options={[
            { label: 'Normal', value: 'normal' },
            { label: 'Italic', value: 'italic' },
          ]}
          onChange={(v) => onUpdate(k('fontStyle'), v === 'normal' ? '' : v)}
        />
      )}
      {showLineHeight && (
        <NumericUnitInput
          label="Line Height"
          value={styles[k('lineHeight')] || ''}
          onChange={(v) => onUpdate(k('lineHeight'), v)}
          placeholder="1.5"
          units={['', 'px', 'rem', 'em', '%']}
          step={0.05}
          min={0.5}
          max={4}
        />
      )}
      {showLetterSpacing && (
        <NumericUnitInput
          label="Letter Spacing"
          value={styles[k('letterSpacing')] || ''}
          onChange={(v) => onUpdate(k('letterSpacing'), v)}
          placeholder="0"
          units={['em', 'px', 'rem']}
          step={0.01}
          min={-0.5}
          max={1}
        />
      )}
      {showTextTransform && (
        <SelectInput
          label="Text Transform"
          value={styles[k('textTransform')] || ''}
          options={[
            { label: 'None',       value: '' },
            { label: 'Uppercase',  value: 'uppercase' },
            { label: 'Lowercase',  value: 'lowercase' },
            { label: 'Capitalize', value: 'capitalize' },
          ]}
          onChange={(v) => onUpdate(k('textTransform'), v)}
        />
      )}
      {showAlignment && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
          <ButtonGroup
            value={styles[k('textAlign')] || 'left'}
            options={[
              { icon: 'fa-align-left',   value: 'left',   label: 'Left' },
              { icon: 'fa-align-center', value: 'center', label: 'Center' },
              { icon: 'fa-align-right',  value: 'right',  label: 'Right' },
            ]}
            onChange={(v) => onUpdate(k('textAlign'), v)}
          />
        </div>
      )}
    </div>
  );
};
