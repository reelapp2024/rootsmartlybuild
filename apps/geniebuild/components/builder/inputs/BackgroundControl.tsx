import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTheme } from '@ui/blocks';
import { PRESET_THEMES } from '../../../constants';
import { SelectInput } from './SelectInput';
import { ColorInput } from './ColorInput';
import { RangeInput } from './RangeInput';
import { ImageControl } from './ImageControl';

interface BackgroundControlProps {
  value: any;
  onChange: (val: any) => void;
  onImagesChange?: (images: Array<{ id: string; url: string }>) => void;
  onUpload?: (index?: number) => void;
  uploading?: boolean;
  uploadProgress?: number;
}

export const BackgroundControl: React.FC<BackgroundControlProps> = ({
  value,
  onChange,
  onImagesChange,
  onUpload,
  uploading = false,
  uploadProgress = 0,
}) => {
  const { themeData } = useTheme();

  const themeOverlayDefaults = useMemo(() => {
    const activeThemeColor = themeData?.elements?.overlay?.color || themeData?.overlay?.color;
    const activeThemeOpacity = themeData?.elements?.overlay?.opacity ?? themeData?.overlay?.opacity;
    const activeThemeBlend = themeData?.elements?.overlay?.blend || themeData?.overlay?.blend;

    return {
      enabled: true,
      color: activeThemeColor || PRESET_THEMES[0].elements.overlay.color,
      opacity: activeThemeOpacity ?? PRESET_THEMES[0].elements.overlay.opacity,
      blendMode: activeThemeBlend || PRESET_THEMES[0].elements.overlay.blend,
    };
  }, [themeData]);

  const background = value || { type: 'color', color: '#000000', overlay: themeOverlayDefaults };
  const [localBackground, setLocalBackground] = useState(background);

  const normalizeImages = useCallback((images: unknown): Array<{ id: string; url: string }> => {
    if (!Array.isArray(images)) return [];
    return images
      .map((item, index) => {
        if (typeof item === 'string') {
          const url = item.trim();
          return url ? { id: `img-${index}`, url } : null;
        }
        if (item && typeof item === 'object') {
          const raw = item as { id?: unknown; url?: unknown };
          const url = typeof raw.url === 'string' ? raw.url.trim() : '';
          if (!url) return null;
          return { id: String(raw.id || `img-${index}`), url };
        }
        return null;
      })
      .filter((item): item is { id: string; url: string } => !!item);
  }, []);

  const sectionImages = useMemo(
    () => normalizeImages((value as any)?.sectionImages || []),
    [normalizeImages, value]
  );
  const styleImages = useMemo(
    () => normalizeImages(localBackground.image?.images || []),
    [normalizeImages, localBackground.image?.images]
  );
  const effectiveImages = sectionImages.length > 0 ? sectionImages : styleImages;
  const singleImageValue = effectiveImages[0]?.url || localBackground.image?.url || '';
  const isMultiEnabled = localBackground.image?.mode === 'multiple';
  const defaultCarouselSettings = {
    enabled: true,
    autoplay: true,
    duration: 5000,
    transitionType: 'fade',
    transitionSpeed: 800,
    loop: true,
    pauseOnHover: false,
    buttonVariant: 'minimal',
  } as const;

  const updateBackground = (updates: any) => {
    const newBg = { ...localBackground, ...updates };
    setLocalBackground(newBg);
    onChange(newBg);
  };

  const syncImages = useCallback((images: Array<{ id: string; url: string }>) => {
    if (onImagesChange) onImagesChange(images);
    updateBackground({
      image: {
        ...localBackground.image,
        url: images[0]?.url || '',
        images,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localBackground.image, onImagesChange]);

  useEffect(() => {
    const defaultBg = value || {
      type: 'color',
      color: '#000000',
      overlay: themeOverlayDefaults,
    };
    if (defaultBg && !defaultBg.overlay) {
      defaultBg.overlay = themeOverlayDefaults;
    }
    if (defaultBg?.overlay && defaultBg.overlay.enabled === undefined) {
      defaultBg.overlay.enabled = true;
    }
    setLocalBackground(defaultBg);
  }, [value, themeOverlayDefaults]);

  const addGradientStop = () => {
    const stops = localBackground.gradient?.stops || [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 100 }];
    const newStop = { color: '#888888', position: 50 };
    updateBackground({
      gradient: {
        ...localBackground.gradient,
        stops: [...stops, newStop].sort((a: any, b: any) => a.position - b.position),
      },
    });
  };

  const removeGradientStop = (index: number) => {
    const stops = localBackground.gradient?.stops || [];
    if (stops.length <= 2) return;
    updateBackground({
      gradient: {
        ...localBackground.gradient,
        stops: stops.filter((_: any, i: number) => i !== index),
      },
    });
  };

  const updateGradientStop = (index: number, field: 'color' | 'position', val: string | number) => {
    const stops = [...(localBackground.gradient?.stops || [])];
    stops[index] = { ...stops[index], [field]: val };
    updateBackground({
      gradient: {
        ...localBackground.gradient,
        stops: stops.sort((a: any, b: any) => a.position - b.position),
      },
    });
  };


  return (
    <div className="space-y-4">
      {/* Enable Geometry toggle removed — decorative background geometry/shapes
          are rarely useful and clutter the panel. */}

      {/* Background Type Selector */}
      <SelectInput
        label="Background Type"
        value={localBackground.type || 'color'}
        options={[
          { label: 'Color', value: 'color' },
          { label: 'Gradient', value: 'gradient' },
          { label: 'Image', value: 'image' },
        ]}
        onChange={(v) => {
          if (v === 'color') {
            updateBackground({
              type: 'color',
              color: localBackground.color || '#000000',
              overlay: localBackground.overlay || themeOverlayDefaults,
            });
          } else if (v === 'gradient') {
            updateBackground({
              type: 'gradient',
              gradient: localBackground.gradient || {
                type: 'linear',
                direction: 90,
                stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 100 }],
              },
              overlay: localBackground.overlay || themeOverlayDefaults,
            });
          } else if (v === 'image') {
            updateBackground({
              type: 'image',
              image: localBackground.image || {
                url: '',
                position: 'center',
                size: 'cover',
                repeat: 'no-repeat',
                attachment: 'scroll',
                overlay: themeOverlayDefaults,
              },
            });
          }
        }}
      />

      {/* Background Pattern selector removed — decorative pattern overlays
          (dots/lines/circuit/topography) are rarely useful and clutter the panel. */}

      {/* Color Background */}
      {localBackground.type === 'color' && (
        <div className="space-y-3">
          <ColorInput
            label="Background Color"
            value={localBackground.color || '#000000'}
            onChange={(v) => updateBackground({ color: v })}
          />
        </div>
      )}

      {/* Gradient Background */}
      {localBackground.type === 'gradient' && (
        <div className="space-y-3">
          <SelectInput
            label="Gradient Type"
            value={localBackground.gradient?.type || 'linear'}
            options={[
              { label: 'Linear', value: 'linear' },
              { label: 'Radial', value: 'radial' },
            ]}
            onChange={(v) => updateBackground({
              gradient: { ...localBackground.gradient, type: v as 'linear' | 'radial' },
            })}
          />

          {localBackground.gradient?.type === 'linear' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Direction</label>
              <RangeInput
                label="Angle"
                value={localBackground.gradient?.direction || 90}
                min={0}
                max={360}
                step={1}
                unit="°"
                onChange={(v) => updateBackground({
                  gradient: { ...localBackground.gradient, direction: v },
                })}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Gradient Stops</label>
              <button
                onClick={addGradientStop}
                className="px-2 py-1 text-[9px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30"
              >
                <i className="fa-solid fa-plus mr-1"></i>Add Stop
              </button>
            </div>
            {(localBackground.gradient?.stops || []).map((stop: any, index: number) => (
              <div key={index} className="flex gap-2 items-center bg-[#151515] p-2 rounded border border-[#333]">
                <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                  <input
                    type="color"
                    className="absolute inset-[-4px] w-[150%] h-[150%] p-0 border-none cursor-pointer"
                    value={stop.color || '#000000'}
                    onChange={(e) => updateGradientStop(index, 'color', e.target.value)}
                  />
                </div>
                <RangeInput
                  label=""
                  value={stop.position || 0}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(v) => updateGradientStop(index, 'position', v)}
                />
                {(localBackground.gradient?.stops || []).length > 2 && (
                  <button
                    onClick={() => removeGradientStop(index)}
                    className="px-2 py-1 text-[9px] bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded border border-red-600/30"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Background */}
      {localBackground.type === 'image' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#151515] rounded border border-[#333]">
            <div>
              <label className="text-xs font-medium text-white/80">Enable Multi Images</label>
              <div className="text-[10px] text-white/40 mt-1">
                Single-image variants use the first section image. Enable this for carousel-capable sections.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const currentImage = localBackground.image || {};
                const nextMulti = !isMultiEnabled;
                const nextImages =
                  effectiveImages.length > 0
                    ? effectiveImages
                    : singleImageValue
                      ? [{ id: `img-${Date.now()}`, url: singleImageValue }]
                      : [];
                updateBackground({
                  type: 'image',
                  image: {
                    ...currentImage,
                    mode: nextMulti ? 'multiple' : 'single',
                    url: nextImages[0]?.url || currentImage.url || '',
                    images: nextImages,
                    carouselSettings: {
                      ...defaultCarouselSettings,
                      ...(currentImage.carouselSettings || {}),
                      enabled:
                        currentImage.carouselSettings?.enabled !== undefined
                          ? currentImage.carouselSettings.enabled
                          : nextMulti,
                    },
                  },
                });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isMultiEnabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isMultiEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isMultiEnabled ? (
            <div className="space-y-3 p-3 bg-[#151515] rounded border border-[#333]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Carousel Images</label>
                <button
                  onClick={() => {
                    syncImages([
                      ...effectiveImages,
                      { id: `img-${Date.now()}`, url: '' },
                    ]);
                  }}
                  className="px-2 py-1 text-[9px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30"
                >
                  <i className="fa-solid fa-plus mr-1"></i>Add Image
                </button>
              </div>

              {effectiveImages.map((img: any, index: number) => (
                <div key={img.id} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <ImageControl
                      label={`Image ${index + 1}`}
                      value={img.url}
                      onChange={(v) => {
                        const newImages = [...effectiveImages];
                        newImages[index] = { ...newImages[index], url: v };
                        syncImages(newImages);
                      }}
                      onUpload={() => onUpload?.(index)}
                      uploading={uploading}
                      uploadProgress={uploadProgress}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newImages = [...effectiveImages];
                      newImages.splice(index, 1);
                      syncImages(newImages);
                    }}
                    className="mt-5 px-2 py-1.5 text-[10px] bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded border border-red-600/30"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}

              <div className="pt-2 border-t border-[#333] space-y-3">
                <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Carousel Settings</label>

                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-white/70">Enable Carousel</label>
                  <input
                    type="checkbox"
                    checked={localBackground.image?.carouselSettings?.enabled ?? true}
                    onChange={(e) => updateBackground({
                      image: { ...localBackground.image, carouselSettings: { ...localBackground.image?.carouselSettings, enabled: e.target.checked } },
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-white/70">Autoplay</label>
                  <input
                    type="checkbox"
                    checked={localBackground.image?.carouselSettings?.autoplay ?? true}
                    onChange={(e) => updateBackground({
                      image: { ...localBackground.image, carouselSettings: { ...localBackground.image?.carouselSettings, autoplay: e.target.checked } },
                    })}
                  />
                </div>

                <SelectInput
                  label="Transition Type"
                  value={localBackground.image?.carouselSettings?.transitionType || 'fade'}
                  options={[
                    { label: 'Fade', value: 'fade' },
                    { label: 'Slide', value: 'slide' },
                  ]}
                  onChange={(v) => updateBackground({
                    image: { ...localBackground.image, carouselSettings: { ...localBackground.image?.carouselSettings, transitionType: v } },
                  })}
                />

                <SelectInput
                  label="Button Style"
                  value={localBackground.image?.carouselSettings?.buttonVariant || 'minimal'}
                  options={[
                    { label: 'Minimal', value: 'minimal' },
                    { label: 'Rounded', value: 'rounded' },
                    { label: 'Square', value: 'square' },
                    { label: 'Outline', value: 'outline' },
                    { label: 'Hidden', value: 'hidden' },
                  ]}
                  onChange={(v) => updateBackground({
                    image: { ...localBackground.image, carouselSettings: { ...localBackground.image?.carouselSettings, buttonVariant: v } },
                  })}
                />
              </div>
            </div>
          ) : (
            <ImageControl
              label="Background Image"
              value={singleImageValue}
              onChange={(v) => {
                const currentImage = localBackground.image || {
                  url: '',
                  position: 'center',
                  size: 'cover',
                  repeat: 'no-repeat',
                  attachment: 'scroll',
                  overlay: themeOverlayDefaults,
                };
                const nextImages = effectiveImages.length > 0
                  ? effectiveImages.map((img, index) => index === 0 ? { ...img, url: v } : img)
                  : (v ? [{ id: `img-${Date.now()}`, url: v }] : []);
                if (onImagesChange) {
                  syncImages(nextImages);
                } else {
                  updateBackground({
                    type: 'image',
                    image: { ...currentImage, url: v },
                  });
                }
              }}
              onUpload={() => onUpload?.(0)}
              uploading={uploading}
              uploadProgress={uploadProgress}
            />
          )}
        </div>
      )}
    </div>
  );
};
