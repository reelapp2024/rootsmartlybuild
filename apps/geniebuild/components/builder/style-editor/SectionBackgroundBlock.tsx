import React from 'react';
import { Section } from '../../../types';
import { PRESET_THEMES } from '../../../constants';
import { AccordionGroup, BackgroundControl, ColorInput, RangeInput, SelectInput, TextInput } from '../inputs';
import { normalizeBackground, syncLegacyBackgroundFlats } from '../../../utils/normalizeSectionStyles';
import { BG_PATTERN_CHOICES } from '../../sections/homepage/utils/sectionBgPatterns';
import { isCanvasRenderedVariant } from '../../sections/canvas/isCanvasVariant';

interface SectionBackgroundBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  sectionId?: string;
  selectedSection?: Section | null;
  onSectionUpdate: (id: string, updates: any) => void;
  triggerUpload: (sectionId: string, field: string) => void;
  uploading: boolean;
  uploadTarget: { sectionId: string; elementId?: string; field: string } | null;
  uploadProgress: number;
  /** Returns the active theme's elements (e.g. from PRESET_THEMES lookup or custom). */
  getActiveGlobalTheme: () => any;
  /** Returns overlay defaults `{ color, opacity, blendMode }` for the active theme. */
  getThemeOverlayDefaults: () => { color: string; opacity: number; blendMode: string };
}

export const SectionBackgroundBlock: React.FC<SectionBackgroundBlockProps> = ({
  styles,
  onUpdate,
  onBatchUpdate,
  sectionId,
  selectedSection,
  onSectionUpdate,
  triggerUpload,
  uploading,
  uploadTarget,
  uploadProgress,
  getActiveGlobalTheme,
  getThemeOverlayDefaults,
}) => {
  const _activeTheme = getActiveGlobalTheme() as any;
  const _isLight = styles.themeMode === 'light';
  // Canvas (freeform) sections — and any variant built on the Canvas renderer
  // (e.g. HeroCanvas) — don't use the light/dark theme-mode surface swap, so the
  // Theme Mode toggle is hidden for them.
  const _variantName = String((styles as any)?.variant || '');
  const _isCanvasSection = isCanvasRenderedVariant(_variantName, selectedSection?.type);
  const _themeOverlayColor = _isLight
    ? (_activeTheme?.light?.overlay?.color || '#FFFFFF')
    : (_activeTheme?.overlay?.color || PRESET_THEMES[0].elements.overlay.color);
  const _themeOverlayOpacity = _isLight
    ? (_activeTheme?.light?.overlay?.opacity ?? 0.92)
    : (_activeTheme?.overlay?.opacity ?? 0.92);
  const _themeOverlayBlend = _activeTheme?.overlay?.blend || 'normal';
  const _themeSurface = _isLight
    ? (_activeTheme?.light?.surface || '#FFFFFF')
    : (_activeTheme?.surface || PRESET_THEMES[0].elements.surface);

  const _bgFallback = styles.background || (() => {
    if (styles.backgroundImage && styles.backgroundImage !== 'transparent' && styles.backgroundImage !== '') {
      return {
        type: 'image',
        image: {
          url: styles.backgroundImage,
          position: 'center', size: 'cover', repeat: 'no-repeat', attachment: 'scroll',
          overlay: {
            enabled: !!styles.overlayColor && styles.overlayColor !== 'transparent',
            color: styles.overlayColor || _themeOverlayColor,
            opacity: parseFloat(styles.overlayOpacityValue || styles.overlayOpacity || _themeOverlayOpacity.toString()),
            blendMode: styles.overlayBlendMode || _themeOverlayBlend,
          },
        },
      };
    }
    return {
      type: 'color',
      color: styles.backgroundColor || _themeSurface,
      overlay: {
        enabled: !!styles.overlayColor && styles.overlayColor !== 'transparent',
        color: styles.overlayColor || _themeOverlayColor,
        opacity: parseFloat(styles.overlayOpacityValue || styles.overlayOpacity || _themeOverlayOpacity.toString()),
        blendMode: styles.overlayBlendMode || _themeOverlayBlend,
      },
    };
  })();

  const _bgWithUrl = (() => {
    if (_bgFallback.type === 'image' && _bgFallback.image && !_bgFallback.image.url) {
      const contentImageUrl = (selectedSection?.content as any)?.imageUrl || '';
      return {
        ..._bgFallback,
        image: { ..._bgFallback.image, url: contentImageUrl },
      };
    }
    return _bgFallback;
  })();

  // Overlay color resolution for the UI
  const themeDefaults = getThemeOverlayDefaults();
  const savedColor = styles.background?.image?.overlay?.color || styles.background?.overlay?.color || styles.overlayColor;
  const isGhostColor = !savedColor || savedColor === 'transparent' || savedColor === '#000000' || savedColor.replace(/\s/g, '') === 'rgba(0,0,0,0)' || savedColor.includes(', 0)');
  let uiOverlayColor = isGhostColor ? themeDefaults.color : (savedColor === themeDefaults.color ? themeDefaults.color : savedColor);
  if (!uiOverlayColor) uiOverlayColor = themeDefaults.color;

  return (
    <AccordionGroup title="Background" defaultOpen={true}>
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); e.stopPropagation();
            const resetPatch = {
              background: undefined,
              backgroundColor: undefined,
              backgroundImage: undefined,
              backgroundVideoUrl: undefined,
              backgroundPattern: undefined,
              overlayColor: undefined,
              overlayOpacityValue: undefined,
              overlayOpacity: undefined,
              overlayBlendMode: undefined,
            };
            if (onBatchUpdate) onBatchUpdate(resetPatch);
            else Object.entries(resetPatch).forEach(([k, v]) => onUpdate(k, v));
          }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset Background
        </button>
      </div>

      <BackgroundControl
        value={{
          ..._bgWithUrl,
          pattern: styles.backgroundPattern,
          enableGeometry: styles.enableGeometry,
          variant: styles.variant,
          sectionImages: selectedSection?.content?.images || [],
        }}
        onImagesChange={(images) => {
          if (!selectedSection) return;
          onSectionUpdate(selectedSection.id, {
            content: {
              ...selectedSection.content,
              images,
              imageUrl: images[0]?.url || '',
            },
          });
        }}
        onChange={(v) => {
          const { enableGeometry, pattern, ...backgroundObj } = v;
          const sectionImages = Array.isArray(selectedSection?.content?.images)
            ? selectedSection?.content?.images
            : [];
          const firstSectionImage = (() => {
            const first = sectionImages[0];
            if (typeof first === 'string') return first;
            if (first && typeof first === 'object' && 'url' in first) return (first as any).url || '';
            return '';
          })();

          // Ensure image type always carries a url when section content has one
          let nextBg = backgroundObj;
          if (nextBg?.type === 'image' && nextBg.image && !nextBg.image.url && firstSectionImage) {
            nextBg = {
              ...nextBg,
              image: { ...nextBg.image, url: firstSectionImage },
            };
          }
          const normalized = normalizeBackground(nextBg, {
            backgroundColor: nextBg?.type === 'color' ? nextBg.color : undefined,
            backgroundImage: nextBg?.type === 'image' ? nextBg?.image?.url : undefined,
          });
          onUpdate('background', normalized);
          if (enableGeometry !== undefined) onUpdate('enableGeometry', enableGeometry);
          if (pattern !== undefined) onUpdate('backgroundPattern', pattern);

          const flats = syncLegacyBackgroundFlats({
            background: normalized,
            backgroundColor: styles.backgroundColor,
            backgroundImage: styles.backgroundImage,
          });
          if (normalized?.type === 'color') {
            onUpdate('backgroundColor', flats.backgroundColor || normalized.color || '#000000');
            onUpdate('backgroundImage', '');
          } else if (normalized?.type === 'image') {
            onUpdate('backgroundImage', flats.backgroundImage || firstSectionImage || '');
            onUpdate('backgroundColor', 'transparent');
            if (normalized.image?.overlay?.enabled) {
              onUpdate('overlayColor', normalized.image.overlay.color);
              onUpdate('overlayOpacityValue', String(normalized.image.overlay.opacity ?? 0));
              onUpdate('overlayBlendMode', normalized.image.overlay.blendMode);
            } else {
              onUpdate('overlayColor', 'transparent');
            }
          } else if (normalized?.type === 'gradient') {
            onUpdate('backgroundColor', 'transparent');
            onUpdate('backgroundImage', flats.backgroundImage || '');
          } else {
            onUpdate('backgroundColor', undefined);
            onUpdate('backgroundImage', undefined);
          }
        }}
        onUpload={(imageIndex) => {
          if (sectionId) triggerUpload(sectionId, imageIndex !== undefined ? `backgroundImage.${imageIndex}` : 'backgroundImage');
        }}
        uploading={uploading && !!uploadTarget?.field?.startsWith('backgroundImage') && uploadTarget?.sectionId === sectionId}
        uploadProgress={uploading && !!uploadTarget?.field?.startsWith('backgroundImage') && uploadTarget?.sectionId === sectionId ? uploadProgress : 0}
      />

      {/* --- THEME MODE TOGGLE --- (hidden for freeform Canvas sections) */}
      {!_isCanvasSection && (
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Theme Mode</label>
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => onUpdate('themeMode', 'light')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${styles.themeMode === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Light
            </button>
            <button
              onClick={() => onUpdate('themeMode', 'dark')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${styles.themeMode !== 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>
      )}

      {/* --- BACKGROUND VIDEO --- (Elementor parity: self-hosted mp4/webm loop) */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Video</h4>
        <TextInput
          label="Video URL (mp4 / webm)"
          value={(styles as any).backgroundVideoUrl || ''}
          onChange={(v) => onUpdate('backgroundVideoUrl', v)}
          placeholder="https://…/clip.mp4"
        />
        <p className="text-[10px] text-white/40 leading-relaxed">
          Plays muted + looped behind the content. Uses the background image as the poster. Add a dark overlay below for text legibility.
        </p>
      </div>

      {/* --- BACKGROUND PATTERN ---
          A reusable, theme-driven decorative layer (grid / glow / dots) painted
          ON TOP of the section's base colour. Works on ANY section — pick once,
          and it follows whichever theme is active (uses accent + divider colour).
      */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Pattern</h4>
        <p className="text-[10px] text-white/40 leading-relaxed">
          A decorative grid / glow layer over the background. Theme-coloured, so it matches the active theme.
        </p>
        <SelectInput
          label="Pattern"
          value={String((styles as any).bgPattern || 'none')}
          options={BG_PATTERN_CHOICES}
          onChange={(v) => onUpdate('bgPattern', v)}
        />
      </div>

      {/* --- BACKGROUND OVERLAY ---
          Overlay only makes sense on top of an image or vivid gradient
          (to dim it for text legibility). Solid color backgrounds don't need it
          (just pick a darker color). Hidden in color mode to avoid confusion. */}
      {(styles.background?.type === 'image' || styles.background?.type === 'gradient') && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Overlay</h4>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Dims the {styles.background?.type === 'image' ? 'image' : 'gradient'} so foreground text stays legible.
          </p>
          <ColorInput
            label="Overlay Color"
            value={uiOverlayColor}
            onChange={(v) => {
              onUpdate('overlayColor', v);
              const newBg = { ...(styles.background || {}) };
              newBg.overlay = { ...(newBg.overlay || {}), color: v, enabled: v !== 'transparent' };
              if (newBg.type === 'image' && newBg.image) {
                newBg.image = { ...newBg.image, overlay: { ...(newBg.image.overlay || {}), color: v, enabled: v !== 'transparent' } };
              }
              onUpdate('background', newBg);
            }}
          />
          <RangeInput
            label="Overlay Opacity"
            value={Math.round((styles.background?.overlay?.opacity !== undefined ? styles.background.overlay.opacity : (styles.background?.image?.overlay?.opacity !== undefined ? styles.background.image.overlay.opacity : parseFloat(styles.overlayOpacityValue || themeDefaults.opacity?.toString() || '0.7'))) * 100)}
            min={0} max={100} step={1} unit="%"
            onChange={(v) => {
              const decimalVal = v / 100;
              onUpdate('overlayOpacityValue', decimalVal.toString());
              const newBg = { ...(styles.background || {}) };
              newBg.overlay = { ...(newBg.overlay || {}), opacity: decimalVal };
              if (newBg.type === 'image' && newBg.image) {
                newBg.image = { ...newBg.image, overlay: { ...(newBg.image.overlay || {}), opacity: decimalVal } };
              }
              onUpdate('background', newBg);
            }}
          />
          <SelectInput
            label="Blend Mode"
            value={styles.background?.overlay?.blendMode || styles.background?.image?.overlay?.blendMode || styles.overlayBlendMode || 'normal'}
            options={[
              { label: 'Normal', value: 'normal' },
              { label: 'Multiply', value: 'multiply' },
              { label: 'Screen', value: 'screen' },
              { label: 'Overlay', value: 'overlay' },
              { label: 'Darken', value: 'darken' },
              { label: 'Lighten', value: 'lighten' },
              { label: 'Color Dodge', value: 'color-dodge' },
              { label: 'Color Burn', value: 'color-burn' },
              { label: 'Hard Light', value: 'hard-light' },
              { label: 'Soft Light', value: 'soft-light' },
            ]}
            onChange={(v) => {
              onUpdate('overlayBlendMode', v);
              const newBg = { ...(styles.background || {}) };
              newBg.overlay = { ...(newBg.overlay || {}), blendMode: v };
              if (newBg.type === 'image' && newBg.image) {
                newBg.image = { ...newBg.image, overlay: { ...(newBg.image.overlay || {}), blendMode: v } };
              }
              onUpdate('background', newBg);
            }}
          />
        </div>
      )}
    </AccordionGroup>
  );
};
