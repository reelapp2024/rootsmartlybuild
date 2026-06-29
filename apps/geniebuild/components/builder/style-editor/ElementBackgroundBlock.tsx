import React from 'react';
import { AccordionGroup, ColorInput, ImageControl, RangeInput, SelectInput, TextInput } from '../inputs';

/**
 * ElementBackgroundBlock — element-level background editor.
 * Three modes: Color (default) / Gradient / Image. Plus optional Overlay
 * (only meaningful when bg is image or gradient — gated by `showOverlay` prop)
 * and an element Opacity slider.
 *
 * The block writes to flat element.style keys so the render-side helper
 * `resolveElementBackground` can compose a single CSS `background` shorthand.
 *
 * Style keys written:
 *   bgType                     'color' | 'gradient' | 'image'   (default 'color')
 *   backgroundColor            CSS color string                  (color mode)
 *   bgGradientFrom             CSS color                          (gradient mode)
 *   bgGradientTo               CSS color
 *   bgGradientAngle            number degrees (0-360, default 135)
 *   backgroundImage            url(…) or http URL                  (image mode)
 *   bgImageSize                'cover' | 'contain' | 'auto' | '100% 100%'
 *   bgImagePosition            'center' | 'top' | … etc
 *   bgImageRepeat              'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
 *   overlayColor               CSS color                          (overlay)
 *   overlayOpacity             '0'-'1' string                     (overlay)
 *   opacity                    '0'-'1' string                     (whole element opacity)
 */
interface ElementBackgroundBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  /** When true, the Overlay group is rendered. Default false. */
  showOverlay?: boolean;
  /** Optional upload trigger for the image mode (called with no args). */
  onUploadBackgroundImage?: () => void;
  themeColors?: any;
}

const POSITIONS = [
  { label: 'Center',       value: 'center' },
  { label: 'Top',          value: 'top' },
  { label: 'Bottom',       value: 'bottom' },
  { label: 'Left',         value: 'left' },
  { label: 'Right',        value: 'right' },
  { label: 'Top Left',     value: 'top left' },
  { label: 'Top Right',    value: 'top right' },
  { label: 'Bottom Left',  value: 'bottom left' },
  { label: 'Bottom Right', value: 'bottom right' },
];

const SIZES = [
  { label: 'Cover',     value: 'cover' },
  { label: 'Contain',   value: 'contain' },
  { label: 'Auto',      value: 'auto' },
  { label: 'Stretch',   value: '100% 100%' },
];

const REPEATS = [
  { label: 'No Repeat',   value: 'no-repeat' },
  { label: 'Repeat',      value: 'repeat' },
  { label: 'Repeat X',    value: 'repeat-x' },
  { label: 'Repeat Y',    value: 'repeat-y' },
];

const GRADIENT_ANGLE_PRESETS = [
  { label: 'Top → Bottom (180°)',     value: 180 },
  { label: 'Bottom → Top (0°)',        value: 0 },
  { label: 'Left → Right (90°)',       value: 90 },
  { label: 'Right → Left (270°)',      value: 270 },
  { label: 'Diagonal ↘ (135°)',        value: 135 },
  { label: 'Diagonal ↙ (225°)',        value: 225 },
  { label: 'Diagonal ↖ (315°)',        value: 315 },
  { label: 'Diagonal ↗ (45°)',         value: 45 },
];

export const ElementBackgroundBlock: React.FC<ElementBackgroundBlockProps> = ({
  styles, onUpdate, showOverlay = false, onUploadBackgroundImage,
}) => {
  const bgType: 'color' | 'gradient' | 'image' =
    styles.bgType === 'gradient' || styles.bgType === 'image' ? styles.bgType : 'color';

  const bgGradientAngle = Number(styles.bgGradientAngle ?? 135);

  const resetBackground = () => {
    onUpdate('bgType', '');
    onUpdate('backgroundColor', '');
    onUpdate('bgGradientFrom', '');
    onUpdate('bgGradientTo', '');
    onUpdate('bgGradientAngle', '');
    onUpdate('bgImage', '');
    onUpdate('bgImagePosition', '');
    onUpdate('bgImageSize', '');
    onUpdate('bgImageRepeat', '');
    onUpdate('overlayColor', '');
    onUpdate('overlayOpacity', '');
    onUpdate('overlayBlendMode', '');
  };

  return (
    <>
      <AccordionGroup title="Background" defaultOpen={false}>
        <div className="space-y-4">
          {/* Reset */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetBackground(); }}
            className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-rotate-left"></i> Reset Background
          </button>
          {/* Mode picker */}
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
              Background Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'color',    label: 'Color',    icon: 'fa-fill-drip' },
                { value: 'gradient', label: 'Gradient', icon: 'fa-rainbow' },
                { value: 'image',    label: 'Image',    icon: 'fa-image' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate('bgType', opt.value === 'color' ? '' : opt.value)}
                  className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                    bgType === opt.value
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${opt.icon} text-sm`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific controls */}
          {bgType === 'color' && (
            <ColorInput
              label="Color"
              value={styles.backgroundColor || ''}
              onChange={(v) => onUpdate('backgroundColor', v)}
              onReset={() => onUpdate('backgroundColor', '')}
            />
          )}

          {bgType === 'gradient' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <ColorInput
                  label="From"
                  value={styles.bgGradientFrom || ''}
                  onChange={(v) => onUpdate('bgGradientFrom', v)}
                  onReset={() => onUpdate('bgGradientFrom', '')}
                />
                <ColorInput
                  label="To"
                  value={styles.bgGradientTo || ''}
                  onChange={(v) => onUpdate('bgGradientTo', v)}
                  onReset={() => onUpdate('bgGradientTo', '')}
                />
              </div>
              <SelectInput
                label="Direction"
                value={String(bgGradientAngle)}
                options={GRADIENT_ANGLE_PRESETS.map(o => ({ label: o.label, value: String(o.value) }))}
                onChange={(v: string) => onUpdate('bgGradientAngle', parseInt(v, 10))}
              />
              <RangeInput
                label="Custom Angle"
                value={bgGradientAngle}
                min={0} max={360} step={5} unit="°"
                onChange={(v: number) => onUpdate('bgGradientAngle', v)}
              />
            </div>
          )}

          {bgType === 'image' && (
            <div className="space-y-3">
              <ImageControl
                label="Background Image URL"
                value={styles.backgroundImage || ''}
                onChange={(v) => onUpdate('backgroundImage', v)}
                onUpload={onUploadBackgroundImage ?? (() => {})}
              />
              <SelectInput
                label="Size"
                value={styles.bgImageSize || 'cover'}
                options={SIZES}
                onChange={(v: string) => onUpdate('bgImageSize', v)}
              />
              <SelectInput
                label="Position"
                value={styles.bgImagePosition || 'center'}
                options={POSITIONS}
                onChange={(v: string) => onUpdate('bgImagePosition', v)}
              />
              <SelectInput
                label="Repeat"
                value={styles.bgImageRepeat || 'no-repeat'}
                options={REPEATS}
                onChange={(v: string) => onUpdate('bgImageRepeat', v)}
              />
              <ColorInput
                label="Fallback Color"
                value={styles.backgroundColor || ''}
                onChange={(v) => onUpdate('backgroundColor', v)}
                onReset={() => onUpdate('backgroundColor', '')}
              />
              <p className="text-[9px] text-white/30 italic ml-1">
                Fallback color shows while the image loads.
              </p>
            </div>
          )}

          {/* Element opacity — applies to the whole element, regardless of bg mode */}
          <div className="pt-3 border-t border-white/5">
            <RangeInput
              label="Element Opacity"
              value={styles.opacity !== undefined && styles.opacity !== '' ? Math.round(parseFloat(styles.opacity) * 100) : 100}
              min={0} max={100} step={1} unit="%"
              onChange={(v: number) => onUpdate('opacity', v === 100 ? '' : (v / 100).toString())}
            />
          </div>
        </div>
      </AccordionGroup>

      {/* Overlay — gated. Sirf un elements pe meaningful jinka bg image/gradient hai. */}
      {showOverlay && (
        <AccordionGroup title="Overlay" defaultOpen={false}>
          <div className="space-y-3">
            <p className="text-[10px] text-white/40 leading-relaxed">
              A flat color layer on top of the background — useful when the background is an image or vivid gradient and you need to dim it.
            </p>
            <ColorInput
              label="Overlay Color"
              value={styles.overlayColor || ''}
              onChange={(v) => onUpdate('overlayColor', v)}
              onReset={() => onUpdate('overlayColor', '')}
            />
            <RangeInput
              label="Overlay Opacity"
              value={styles.overlayOpacity !== undefined ? Math.round(parseFloat(styles.overlayOpacity) * 100) : 0}
              min={0} max={100} step={1} unit="%"
              onChange={(v: number) => onUpdate('overlayOpacity', v === 0 ? '' : (v / 100).toString())}
            />
            <TextInput
              label="Blend Mode (advanced)"
              value={styles.overlayBlend || ''}
              onChange={(v) => onUpdate('overlayBlend', v)}
              placeholder="multiply · screen · overlay · darken …"
            />
          </div>
        </AccordionGroup>
      )}
    </>
  );
};

/**
 * Resolve element.style → CSS background shorthand-friendly properties.
 * Use in render cases for elements that participate in the new background system.
 *
 * Returns an object with up to:
 *   - backgroundColor
 *   - backgroundImage   (gradient OR url(...) string)
 *   - backgroundSize, backgroundPosition, backgroundRepeat
 *
 * Plus a separate overlay descriptor when overlay is set.
 */
export type ResolvedBackground = {
  backgroundStyle: React.CSSProperties;
  overlay?: { color: string; opacity: number; blendMode?: string };
};

export function resolveElementBackground(style: any | undefined): ResolvedBackground {
  if (!style) return { backgroundStyle: {} };
  const bgType = style.bgType === 'gradient' || style.bgType === 'image' ? style.bgType : 'color';

  const bgStyle: React.CSSProperties = {};

  if (bgType === 'gradient' && style.bgGradientFrom && style.bgGradientTo) {
    const angle = Number(style.bgGradientAngle ?? 135);
    bgStyle.backgroundImage = `linear-gradient(${angle}deg, ${style.bgGradientFrom}, ${style.bgGradientTo})`;
    if (style.backgroundColor) bgStyle.backgroundColor = style.backgroundColor;
  } else if (bgType === 'image' && style.backgroundImage) {
    const url = String(style.backgroundImage).trim();
    const wrapped = url.startsWith('url(') ? url : `url(${JSON.stringify(url)})`;
    bgStyle.backgroundImage = wrapped;
    bgStyle.backgroundSize = style.bgImageSize || 'cover';
    bgStyle.backgroundPosition = style.bgImagePosition || 'center';
    bgStyle.backgroundRepeat = style.bgImageRepeat || 'no-repeat';
    if (style.backgroundColor) bgStyle.backgroundColor = style.backgroundColor;
  } else if (style.backgroundColor) {
    // Default: simple color
    bgStyle.backgroundColor = style.backgroundColor;
  }

  let overlay: ResolvedBackground['overlay'];
  const overlayOpacity = style.overlayOpacity !== undefined && style.overlayOpacity !== ''
    ? parseFloat(style.overlayOpacity)
    : 0;
  if (overlayOpacity > 0) {
    overlay = {
      color: style.overlayColor || '#000000',
      opacity: overlayOpacity,
      blendMode: style.overlayBlend || undefined,
    };
  }

  return { backgroundStyle: bgStyle, overlay };
}
