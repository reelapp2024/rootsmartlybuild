import React from 'react';
import { AccordionGroup, ColorInput, NumericUnitInput, RangeInput, SelectInput } from '../inputs';

interface BlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  /** Atomic multi-key writer — used by image-style presets so all keys land in one render */
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
  /** When true, render flat sub-sections inside a parent accordion (e.g. image-box). */
  embedded?: boolean;
}

/**
 * Predefined visual styles for the image element. Each preset writes a small
 * patch of style keys (radius / border / shadow / filter / aspect) atomically.
 * Empty string ("") clears that key — letting the renderer fall back to defaults.
 *
 * To add a new preset, append to this array; the picker UI iterates it.
 */
type ImagePreset = {
  key: string;
  label: string;
  /** Lucide / FA icon name for the preview button */
  icon: string;
  /** Style keys + values to write. Use '' to clear a key. */
  patch: Record<string, any>;
};

const buildImagePresets = (themeColors: any): ImagePreset[] => {
  const accent = themeColors?.accentColor || themeColors?.accent || '#E11D48';
  return [
    {
      key: 'default',
      label: 'Default',
      icon: 'fa-image',
      patch: {
        borderRadius: '0%',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: '',
        boxShadow: '',
        filterPreset: '',
        backgroundColor: '',
      },
    },
    {
      key: 'rounded',
      label: 'Rounded',
      icon: 'fa-square-full',
      patch: {
        borderRadius: '12px',
        borderWidth: '0px',
        borderStyle: 'none',
        boxShadow: '0 4px 12px -4px rgba(0,0,0,0.15)',
        filterPreset: '',
      },
    },
    {
      key: 'card',
      label: 'Card',
      icon: 'fa-id-card',
      patch: {
        borderRadius: '20px',
        borderWidth: '0px',
        borderStyle: 'none',
        boxShadow: '0 10px 25px -10px rgba(0, 0, 0, 0.25)',
        filterPreset: '',
      },
    },
    {
      key: 'circle',
      label: 'Circle',
      icon: 'fa-circle',
      patch: {
        borderRadius: '50%',
        aspectRatio: '1 / 1',
        objectFit: 'cover',
        borderWidth: '0px',
        borderStyle: 'none',
        boxShadow: '0 4px 14px -4px rgba(0,0,0,0.2)',
        filterPreset: '',
      },
    },
    {
      key: 'polaroid',
      label: 'Polaroid',
      icon: 'fa-camera-retro',
      patch: {
        borderRadius: '4px',
        borderWidth: '12px',
        borderStyle: 'solid',
        borderColor: '#FFFFFF',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 12px 28px -8px rgba(0,0,0,0.35)',
        filterPreset: '',
      },
    },
    {
      key: 'frame',
      label: 'Frame',
      icon: 'fa-vector-square',
      patch: {
        borderRadius: '4px',
        borderWidth: '4px',
        borderStyle: 'solid',
        borderColor: accent,
        boxShadow: '',
        filterPreset: '',
      },
    },
    {
      key: 'vintage',
      label: 'Vintage',
      icon: 'fa-clock-rotate-left',
      patch: {
        borderRadius: '6px',
        borderWidth: '6px',
        borderStyle: 'solid',
        borderColor: '#D4A574',
        boxShadow: '0 8px 20px -6px rgba(82,52,30,0.4)',
        filterPreset: 'sepia(60%) contrast(110%)',
      },
    },
    {
      key: 'glow',
      label: 'Glow',
      icon: 'fa-sun',
      patch: {
        borderRadius: '12px',
        borderWidth: '0px',
        borderStyle: 'none',
        boxShadow: `0 0 32px ${accent}66`,
        filterPreset: '',
      },
    },
    {
      key: 'sketch',
      label: 'Sketch',
      icon: 'fa-pen-nib',
      patch: {
        borderRadius: '8px',
        borderWidth: '2px',
        borderStyle: 'dashed',
        borderColor: themeColors?.titleColor || '#0F172A',
        boxShadow: '',
        filterPreset: 'grayscale(100%) contrast(110%)',
      },
    },
  ];
};

/**
 * Detect which preset (if any) currently matches the saved styles.
 * Returns the preset key, or null when none match (custom edits).
 */
const detectActivePreset = (styles: any, presets: ImagePreset[]): string | null => {
  for (const preset of presets) {
    const allMatch = Object.entries(preset.patch).every(([k, v]) => {
      const current = styles?.[k];
      // Empty patch values match empty/undefined current values
      if (v === '' || v === undefined || v === null) {
        return current === undefined || current === null || current === '' || current === '0px' || current === 'none';
      }
      // Normalize "0px" === "0px" via string compare (CSS values vary)
      return String(current ?? '').toLowerCase() === String(v).toLowerCase();
    });
    if (allMatch) return preset.key;
  }
  return null;
};

/** Section-level Image Settings (size + position) — shown only when background is an image */
export const SectionImageSettingsBlock: React.FC<BlockProps> = ({ styles, onUpdate }) => {
  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Settings</h4>
      <SelectInput
        label="Background Size"
        value={styles.background?.image?.size || styles.backgroundSize || 'cover'}
        options={[
          { label: 'Cover', value: 'cover' },
          { label: 'Contain', value: 'contain' },
          { label: 'Auto', value: 'auto' },
          { label: '100% 100%', value: '100% 100%' },
        ]}
        onChange={(v) => {
          onUpdate('backgroundSize', v);
          if (styles.background?.image) onUpdate('background', { ...styles.background, image: { ...styles.background.image, size: v } });
        }}
      />
      <SelectInput
        label="Background Position"
        value={styles.background?.image?.position || styles.backgroundPosition || 'center'}
        options={[
          { label: 'Center', value: 'center' },
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
          { label: 'Top Left', value: 'top left' },
          { label: 'Top Right', value: 'top right' },
          { label: 'Bottom Left', value: 'bottom left' },
          { label: 'Bottom Right', value: 'bottom right' },
        ]}
        onChange={(v) => {
          onUpdate('backgroundPosition', v);
          if (styles.background?.image) onUpdate('background', { ...styles.background, image: { ...styles.background.image, position: v } });
        }}
      />
    </div>
  );
};

type ElementBgOverlayProps = BlockProps;

/**
 * Element-level Background block.
 *
 * Used as a fallback for elements that don't have a dedicated background editor
 * (icon, badge, button, list, divider, etc.). For these, overlay doesn't make
 * sense visually — overlay is only meaningful on top of an image/gradient bg
 * (which is handled by `ElementBackgroundBlock` for card-like elements, and by
 * `ImageElementStylesBlock` for the image element itself).
 *
 * So this block is just: Background Color + Opacity. Title kept honest.
 */
export const ElementBackgroundOverlayBlock: React.FC<ElementBgOverlayProps> = ({ styles, onUpdate }) => {
  return (
    <AccordionGroup title="Background" defaultOpen={false}>
      <ColorInput
        label={styles.backgroundColor ? "Background Color" : "Background Color (Inherited)"}
        value={styles.backgroundColor || ''}
        onChange={(v) => onUpdate('backgroundColor', v)}
        onReset={() => onUpdate('backgroundColor', '')}
      />
      <RangeInput
        label="Opacity"
        value={styles.opacity !== undefined ? Math.round(parseFloat(styles.opacity) * 100) : 100}
        min={0} max={100} step={1} unit="%"
        onChange={(v) => onUpdate('opacity', (v / 100).toString())}
      />
    </AccordionGroup>
  );
};

/** Image element — shape/aspect, borders, filters, hover effects, tint overlay */
export const ImageElementStylesBlock: React.FC<BlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors, embedded = false,
}) => {
  const presets = React.useMemo(() => buildImagePresets(themeColors), [themeColors]);
  const activePreset = detectActivePreset(styles, presets);

  const applyPreset = (preset: ImagePreset) => {
    if (onBatchUpdate) {
      onBatchUpdate(preset.patch);
    } else {
      Object.entries(preset.patch).forEach(([k, v]) => onUpdate(k, v));
    }
  };

  const ImgSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({
    title, defaultOpen = false, children,
  }) => {
    if (embedded) {
      return (
        <div className="pt-3 mt-1 border-t border-white/5 first:border-0 first:pt-0 first:mt-0 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          {children}
        </div>
      );
    }
    return <AccordionGroup title={title} defaultOpen={defaultOpen}>{children}</AccordionGroup>;
  };

  return (
    <>
      {/* ─────────── STYLE PRESETS ─────────── */}
      <ImgSection title="Style Presets" defaultOpen={true}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            One-click visual styles. Select any preset, then tweak the controls below to customize.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map(preset => {
              const active = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyPreset(preset); }}
                  className={`py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1.5 ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/50 hover:border-[#555] hover:text-white/80'
                  }`}
                  title={`Apply ${preset.label} preset`}
                >
                  <i className={`fa-solid ${preset.icon} text-base`} />
                  <span className="text-[9px]">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </ImgSection>

      {/* ─────────── SHAPE & STRUCTURE ─────────── */}
      <ImgSection title="Shape & Structure" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Aspect Ratio"
            value={styles.aspectRatio || 'auto'}
            options={[
              { label: 'Original (Auto)',   value: 'auto' },
              { label: 'Square (1:1)',      value: '1 / 1' },
              { label: 'Landscape (4:3)',   value: '4 / 3' },
              { label: 'Landscape (16:9)',  value: '16 / 9' },
              { label: 'Cinematic (21:9)',  value: '21 / 9' },
              { label: 'Portrait (3:4)',    value: '3 / 4' },
              { label: 'Portrait (9:16)',   value: '9 / 16' },
            ]}
            onChange={(v: string) => onUpdate('aspectRatio', v)}
          />
          <RangeInput
            label="Corner Roundness (%)"
            value={parseFloat(styles.borderRadius) || 0}
            min={0} max={50} step={1}
            onChange={(v: number) => onUpdate('borderRadius', `${v}%`)}
          />
          <SelectInput
            label="Image Fit"
            value={styles.objectFit || 'cover'}
            options={[
              { label: 'Cover',    value: 'cover' },
              { label: 'Contain',  value: 'contain' },
              { label: 'Fill',     value: 'fill' },
              { label: 'None',     value: 'none' },
              { label: 'Scale-Down', value: 'scale-down' },
            ]}
            onChange={(v: string) => onUpdate('objectFit', v)}
          />
          <SelectInput
            label="Object Position"
            value={styles.objectPosition || 'center'}
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
            onChange={(v: string) => onUpdate('objectPosition', v)}
          />
        </div>
      </ImgSection>

      {/* ─────────── BORDER ─────────── */}
      <ImgSection title="Border" defaultOpen={false}>
        <div className="space-y-3">
          <RangeInput
            label="Border Width (px)"
            value={parseFloat(styles.borderWidth) || 0}
            min={0} max={20} step={1}
            onChange={(v: number) => {
              onUpdate('borderWidth', `${v}px`);
              if (v > 0 && (!styles.borderStyle || styles.borderStyle === 'none')) onUpdate('borderStyle', 'solid');
              if (v === 0) onUpdate('borderStyle', 'none');
            }}
          />
          {(parseFloat(styles.borderWidth) > 0) && (
            <>
              <SelectInput
                label="Border Style"
                value={styles.borderStyle || 'solid'}
                options={[
                  { label: 'Solid',  value: 'solid' },
                  { label: 'Dashed', value: 'dashed' },
                  { label: 'Dotted', value: 'dotted' },
                  { label: 'Double', value: 'double' },
                ]}
                onChange={(v: string) => onUpdate('borderStyle', v)}
              />
              <ColorInput
                label={styles.borderColor ? "Border Color" : "Border Color (Inherited)"}
                value={styles.borderColor || '#ffffff'}
                onChange={(v: string) => onUpdate('borderColor', v)}
                onReset={() => onUpdate('borderColor', '')}
              />
            </>
          )}
        </div>
      </ImgSection>

      {/* ─────────── SHADOW ─────────── */}
      <ImgSection title="Shadow" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Box Shadow"
            value={styles.boxShadow || 'none'}
            options={[
              { label: 'None',         value: 'none' },
              { label: 'Soft Drop',    value: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' },
              { label: 'Heavy Float',  value: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
              { label: 'Glow Effect',  value: `0 0 30px ${themeColors?.accentColor || 'rgba(255,255,255,0.3)'}` },
            ]}
            onChange={(v: string) => onUpdate('boxShadow', v === 'none' ? '' : v)}
          />
        </div>
      </ImgSection>

      {/* ─────────── COLOR FILTER PRESET ─────────── */}
      <ImgSection title="Color Filter" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Filter Preset"
            value={styles.filterPreset || 'none'}
            options={[
              { label: 'Normal',         value: 'none' },
              { label: 'Grayscale',      value: 'grayscale(100%)' },
              { label: 'Sepia Vintage',  value: 'sepia(100%)' },
              { label: 'High Contrast',  value: 'contrast(150%) saturate(150%)' },
              { label: 'Blurred Soft',   value: 'blur(4px)' },
            ]}
            onChange={(v: string) => onUpdate('filterPreset', v === 'none' ? '' : v)}
          />
          <p className="text-[9px] text-white/30 italic ml-1">
            Combines with the adjustments below — preset first, then your tweaks.
          </p>
        </div>
      </ImgSection>

      {/* ─────────── COLOR ADJUSTMENTS ─────────── */}
      <ImgSection title="Color Adjustments" defaultOpen={false}>
        <div className="space-y-3">
          <RangeInput
            label="Image Opacity (%)"
            value={styles.opacity !== undefined ? Math.round(parseFloat(styles.opacity) * 100) : 100}
            min={0} max={100} step={1}
            onChange={(v: number) => onUpdate('opacity', (v / 100).toString())}
          />
          <RangeInput
            label="Brightness (%)"
            value={styles.brightness !== undefined ? parseFloat(styles.brightness) : 100}
            min={0} max={200} step={5}
            onChange={(v: number) => onUpdate('brightness', v === 100 ? '' : String(v))}
          />
          <RangeInput
            label="Contrast (%)"
            value={styles.contrast !== undefined ? parseFloat(styles.contrast) : 100}
            min={0} max={200} step={5}
            onChange={(v: number) => onUpdate('contrast', v === 100 ? '' : String(v))}
          />
          <RangeInput
            label="Saturation (%)"
            value={styles.saturate !== undefined ? parseFloat(styles.saturate) : 100}
            min={0} max={200} step={5}
            onChange={(v: number) => onUpdate('saturate', v === 100 ? '' : String(v))}
          />
          <RangeInput
            label="Hue Rotate (°)"
            value={parseFloat(styles.hueRotate) || 0}
            min={0} max={360} step={5}
            onChange={(v: number) => onUpdate('hueRotate', v === 0 ? '' : String(v))}
          />
          <button
            type="button"
            onClick={() => {
              onUpdate('opacity', '');
              onUpdate('brightness', '');
              onUpdate('contrast', '');
              onUpdate('saturate', '');
              onUpdate('hueRotate', '');
            }}
            className="w-full mt-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white/80 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-rotate-left text-[9px]" /> Reset adjustments
          </button>
        </div>
      </ImgSection>

      {/* ─────────── HOVER EFFECT ─────────── */}
      <ImgSection title="Hover Effect" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="On Hover"
            value={styles.hoverEffect || 'none'}
            options={[
              { label: 'None',     value: 'none' },
              { label: 'Zoom',     value: 'zoom' },
              { label: 'Lift',     value: 'lift' },
              { label: 'Brighten', value: 'brighten' },
              { label: 'Darken',   value: 'darken' },
              { label: 'Tint',     value: 'tint' },
            ]}
            onChange={(v: string) => onUpdate('hoverEffect', v === 'none' ? '' : v)}
          />
        </div>
      </ImgSection>

      {/* ─────────── BACKGROUND ─────────── */}
      <ImgSection title="Background" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Color behind the image — visible when the image is transparent, loading, or fits with letterbox bars (Image Fit = Contain).
          </p>
          <ColorInput
            label={styles.backgroundColor ? "Background Color" : "Background Color (Inherited)"}
            value={styles.backgroundColor || ''}
            onChange={(v: string) => onUpdate('backgroundColor', v)}
            onReset={() => onUpdate('backgroundColor', '')}
          />
        </div>
      </ImgSection>

      {/* ─────────── CAPTION ─────────── */}
      <ImgSection title="Caption" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Gap between the image and its caption. Set the caption text in the Content tab.
          </p>
          <NumericUnitInput
            label="Caption Gap"
            value={styles.captionTopSpace || ''}
            onChange={(v: string) => onUpdate('captionTopSpace', v)}
            placeholder="0.5rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </ImgSection>

      {/* ─────────── TINT OVERLAY ─────────── */}
      <ImgSection title="Tint Overlay" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            A flat color layer on top of the image — good for darkening hero photos.
          </p>
          <ColorInput
            label={styles.overlayColor ? "Overlay Color" : "Overlay Color (Inherited)"}
            value={styles.overlayColor || 'transparent'}
            onChange={(v: string) => onUpdate('overlayColor', v)}
            onReset={() => onUpdate('overlayColor', '')}
          />
          <RangeInput
            label="Overlay Opacity"
            value={Math.round(parseFloat(styles.overlayOpacity || '0') * 100)}
            min={0} max={100} step={1} unit="%"
            onChange={(v: number) => onUpdate('overlayOpacity', (v / 100).toString())}
          />
        </div>
      </ImgSection>
    </>
  );
};
