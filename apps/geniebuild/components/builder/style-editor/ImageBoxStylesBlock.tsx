import React, { useMemo } from 'react';
import { IMAGE_BOX_DEFAULT_TITLE_HEADING, PRESET_FONTS } from '../../../constants';
import { AccordionGroup, RangeInput, SelectInput } from '../inputs';
import { ImageElementStylesBlock } from './ImageStylesBlock';

interface DefaultSizes {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
  text: string;
  textSmall: string;
  textLarge: string;
  textXl: string;
}

interface ImageBoxStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
  defaultSizes?: DefaultSizes;
}

const FONT_OPTIONS = [
  { label: 'Theme Default', value: '' },
  ...PRESET_FONTS.map((f) => ({ label: f.name, value: f.value })),
];

const HEADING_LEVELS = [
  { label: 'H1 (Largest)', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'H5', value: 'h5' },
  { label: 'H6 (Smallest)', value: 'h6' },
];

const TEXT_SIZE_OPTIONS = [
  { label: 'Base', value: 'base' },
  { label: 'Small', value: 'small' },
  { label: 'Large', value: 'large' },
  { label: 'XL', value: 'xl' },
];

const IB_IMAGE_KEY_MAP: Record<string, string> = {
  aspectRatio: 'imageAspectRatio',
  borderRadius: 'imageRadius',
  objectFit: 'imageObjectFit',
  objectPosition: 'imageObjectPosition',
  borderWidth: 'imageBorderWidth',
  borderStyle: 'imageBorderStyle',
  borderColor: 'imageBorderColor',
  boxShadow: 'imageBoxShadow',
  filterPreset: 'imageFilterPreset',
  opacity: 'imageOpacity',
  brightness: 'imageBrightness',
  contrast: 'imageContrast',
  saturate: 'imageSaturate',
  grayscale: 'imageGrayscale',
  sepia: 'imageSepia',
  blur: 'imageBlur',
  overlayColor: 'imageOverlayColor',
  overlayOpacity: 'imageOverlayOpacity',
  hoverEffect: 'imageHover',
  hoverScale: 'imageHoverScale',
  hueRotate: 'imageHueRotate',
  backgroundColor: 'imageBackgroundColor',
};

function mapToImageElementStyles(styles: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [elKey, ibKey] of Object.entries(IB_IMAGE_KEY_MAP)) {
    if (styles[ibKey] !== undefined && styles[ibKey] !== '') out[elKey] = styles[ibKey];
  }
  if (styles.imageAspectRatio) out.aspectRatio = styles.imageAspectRatio;
  else if (!out.aspectRatio) out.aspectRatio = 'auto';
  if (!out.objectFit) out.objectFit = styles.imageObjectFit || 'cover';
  if (!out.objectPosition) out.objectPosition = styles.imageObjectPosition || 'center';
  return out;
}

/**
 * Design-tab panel for `image-box`: card border, title/description typography, image (same as image element).
 */
export const ImageBoxStylesBlock: React.FC<ImageBoxStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors, defaultSizes,
}) => {
  const sizes: DefaultSizes = defaultSizes || {
    h1: '3rem', h2: '2.5rem', h3: '2rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem',
    text: '1rem', textSmall: '0.875rem', textLarge: '1.125rem', textXl: '1.25rem',
  };

  const titleTag = (styles.titleHeadingTag || IMAGE_BOX_DEFAULT_TITLE_HEADING) as keyof Pick<DefaultSizes, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>;

  const imageElementStyles = useMemo(() => mapToImageElementStyles(styles), [styles]);

  const onImageElementUpdate = (key: string, val: any) => {
    onUpdate(IB_IMAGE_KEY_MAP[key] || key, val);
  };

  const onImageElementBatch = (updates: Record<string, any>) => {
    const mapped: Record<string, any> = {};
    for (const [k, v] of Object.entries(updates)) {
      mapped[IB_IMAGE_KEY_MAP[k] || k] = v;
    }
    if (onBatchUpdate) onBatchUpdate(mapped);
    else Object.entries(mapped).forEach(([k, v]) => onUpdate(k, v));
  };

  const borderWidthPx = parseFloat(String(styles.borderWidth || '0').replace(/px$/, '')) || 0;
  const borderRadiusRaw = String(styles.borderRadius || '0.875rem');
  const borderRadiusIsPercent = borderRadiusRaw.includes('%');
  const borderRadiusVal = parseFloat(borderRadiusRaw.replace(/[^\d.]/g, '')) || 0;

  return (
    <>
      <AccordionGroup title="Card" defaultOpen={true}>
        <CardBorderControls
          borderWidthPx={borderWidthPx}
          borderRadiusVal={borderRadiusVal}
          borderRadiusIsPercent={borderRadiusIsPercent}
          onUpdate={onUpdate}
        />
      </AccordionGroup>

      <AccordionGroup title="Title" defaultOpen={true}>
        <div className="space-y-3">
          <SelectInput
            label="Font Family"
            value={styles.titleFontFamily || ''}
            options={FONT_OPTIONS}
            onChange={(v) => onUpdate('titleFontFamily', v)}
          />
          <SelectInput
            label="Heading Level"
            value={titleTag}
            options={HEADING_LEVELS}
            onChange={(v) => {
              const tag = v as keyof Pick<DefaultSizes, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>;
              const preset = sizes[tag] || sizes.h5;
              if (onBatchUpdate) {
                onBatchUpdate({ titleHeadingTag: v, titleFontSize: preset });
              } else {
                onUpdate('titleHeadingTag', v);
                onUpdate('titleFontSize', preset);
              }
            }}
          />
        </div>
      </AccordionGroup>

      <AccordionGroup title="Description" defaultOpen={false}>
        <DescriptionTypographyControls styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} sizes={sizes} />
      </AccordionGroup>

      <AccordionGroup title="Image" defaultOpen={false}>
        <ImageElementStylesBlock
          styles={imageElementStyles}
          onUpdate={onImageElementUpdate}
          onBatchUpdate={onImageElementBatch}
          themeColors={themeColors}
          embedded
        />
      </AccordionGroup>
    </>
  );
};

const CardBorderControls: React.FC<{
  borderWidthPx: number;
  borderRadiusVal: number;
  borderRadiusIsPercent: boolean;
  onUpdate: (key: string, val: any) => void;
}> = ({ borderWidthPx, borderRadiusVal, borderRadiusIsPercent, onUpdate }) => (
  <div className="space-y-3">
    <RangeInput
      label="Border Width (px)"
      value={borderWidthPx}
      min={0}
      max={8}
      step={1}
      onChange={(v) => onUpdate('borderWidth', v > 0 ? `${v}px` : '0px')}
    />
    <RangeInput
      label={borderRadiusIsPercent ? 'Border Radius (%)' : 'Border Radius (rem)'}
      value={borderRadiusVal}
      min={0}
      max={borderRadiusIsPercent ? 50 : 2}
      step={borderRadiusIsPercent ? 1 : 0.125}
      onChange={(v) => onUpdate('borderRadius', borderRadiusIsPercent ? `${v}%` : `${v}rem`)}
    />
  </div>
);

const DescriptionTypographyControls: React.FC<{
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  sizes: DefaultSizes;
}> = ({ styles, onUpdate, onBatchUpdate, sizes }) => (
  <div className="space-y-3">
    <SelectInput
      label="Font Family"
      value={styles.descriptionFontFamily || ''}
      options={FONT_OPTIONS}
      onChange={(v) => onUpdate('descriptionFontFamily', v)}
    />
    <SelectInput
      label="Text Size"
      value={styles.descriptionTextSize || 'base'}
      options={TEXT_SIZE_OPTIONS}
      onChange={(v) => {
        const preset =
          v === 'small' ? sizes.textSmall
            : v === 'large' ? sizes.textLarge
            : v === 'xl' ? sizes.textXl
            : sizes.text;
        if (onBatchUpdate) {
          onBatchUpdate({ descriptionTextSize: v, descriptionFontSize: preset });
        } else {
          onUpdate('descriptionTextSize', v);
          onUpdate('descriptionFontSize', preset);
        }
      }}
    />
  </div>
);
