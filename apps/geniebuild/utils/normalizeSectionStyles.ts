/**
 * Normalize section styles so background objects are always complete and
 * compatible with resolveSectionBackground + DB round-trips.
 */

export type BackgroundValue = {
  type: 'color' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    direction?: number;
    stops: Array<{ color: string; position: number }>;
  };
  image?: {
    url?: string;
    position?: string;
    size?: string;
    repeat?: string;
    attachment?: string;
    overlay?: {
      enabled?: boolean;
      color?: string;
      opacity?: number;
      blendMode?: string;
    };
    [key: string]: unknown;
  };
  overlay?: {
    enabled?: boolean;
    color?: string;
    opacity?: number;
    blendMode?: string;
  };
};

function hasImageUrl(image: any): boolean {
  if (!image || typeof image !== 'object') return false;
  if (typeof image.url === 'string' && image.url.trim()) return true;
  if (Array.isArray(image.images) && image.images[0]?.url) return true;
  return false;
}

/**
 * Repair / complete a rich background object. Returns undefined when there is
 * no usable background (caller should omit the key).
 */
export function normalizeBackground(
  background: any,
  legacy?: { backgroundColor?: string; backgroundImage?: string }
): BackgroundValue | undefined {
  const flatColor =
    typeof legacy?.backgroundColor === 'string' && legacy.backgroundColor.trim()
      ? legacy.backgroundColor.trim()
      : '';
  const flatImage =
    typeof legacy?.backgroundImage === 'string' && legacy.backgroundImage.trim()
      ? legacy.backgroundImage.trim()
      : '';

  if (!background || typeof background !== 'object') {
    if (flatImage && !/gradient/i.test(flatImage)) {
      return {
        type: 'image',
        image: {
          url: /^url\(/i.test(flatImage) ? flatImage.replace(/^url\(["']?|["']?\)$/g, '') : flatImage,
          position: 'center',
          size: 'cover',
          repeat: 'no-repeat',
        },
      };
    }
    if (flatColor && flatColor.toLowerCase() !== 'transparent') {
      return { type: 'color', color: flatColor };
    }
    return undefined;
  }

  const typeRaw = String(background.type || '').toLowerCase().trim();
  if (!typeRaw || typeRaw === 'undefined' || typeRaw === 'null') {
    // Infer from contents
    if (hasImageUrl(background.image) || flatImage) {
      return normalizeBackground({ ...background, type: 'image' }, legacy);
    }
    if (background.gradient?.stops?.length) {
      return normalizeBackground({ ...background, type: 'gradient' }, legacy);
    }
    if (background.color || flatColor) {
      return normalizeBackground({ ...background, type: 'color' }, legacy);
    }
    return undefined;
  }

  if (typeRaw === 'color') {
    const color = background.color || flatColor;
    if (!color || String(color).toLowerCase() === 'transparent') {
      // Incomplete color bg — drop rather than leave empty type
      return undefined;
    }
    return { ...background, type: 'color', color: String(color) };
  }

  if (typeRaw === 'gradient') {
    const stops = background.gradient?.stops;
    if (!Array.isArray(stops) || stops.length === 0) return undefined;
    return {
      ...background,
      type: 'gradient',
      gradient: {
        type: background.gradient?.type === 'radial' ? 'radial' : 'linear',
        direction: background.gradient?.direction ?? 90,
        stops,
      },
    };
  }

  if (typeRaw === 'image') {
    const image = { ...(background.image || {}) };
    if (!hasImageUrl(image) && flatImage && !/gradient/i.test(flatImage)) {
      image.url = /^url\(/i.test(flatImage)
        ? flatImage.replace(/^url\(["']?|["']?\)$/g, '')
        : flatImage;
    }
    if (!hasImageUrl(image)) return undefined;
    if (!image.position) image.position = 'center';
    if (!image.size) image.size = 'cover';
    if (!image.repeat) image.repeat = 'no-repeat';
    // Mirror top-level overlay onto image.overlay for image bgs
    if (background.overlay && !image.overlay) {
      image.overlay = { ...background.overlay };
    }
    return { ...background, type: 'image', image };
  }

  return undefined;
}

/** Sync legacy flat keys from a normalized rich background (for older readers). */
export function syncLegacyBackgroundFlats(styles: Record<string, any>): Record<string, any> {
  const next = { ...styles };
  const b = next.background as BackgroundValue | undefined;
  if (!b?.type) return next;

  if (b.type === 'color') {
    next.backgroundColor = b.color || next.backgroundColor;
    delete next.backgroundImage;
  } else if (b.type === 'gradient') {
    next.backgroundColor = 'transparent';
    const stops = (b.gradient?.stops || [])
      .map((st) => `${st.color} ${st.position}%`)
      .join(', ');
    if (stops) {
      next.backgroundImage =
        b.gradient?.type === 'radial'
          ? `radial-gradient(circle, ${stops})`
          : `linear-gradient(${b.gradient?.direction ?? 90}deg, ${stops})`;
    }
  } else if (b.type === 'image') {
    next.backgroundColor = 'transparent';
    const url = b.image?.url || (b.image as any)?.images?.[0]?.url;
    if (url) next.backgroundImage = url;
    if (b.image?.overlay?.color) next.overlayColor = b.image.overlay.color;
    if (b.image?.overlay?.opacity != null) {
      next.overlayOpacityValue = String(b.image.overlay.opacity);
    }
    if (b.image?.overlay?.blendMode) next.overlayBlendMode = b.image.overlay.blendMode;
  }
  return next;
}

/** Normalize styles on load / before save. */
export function normalizeSectionStyles(styles: any): any {
  if (!styles || typeof styles !== 'object') return styles || {};
  const next = { ...styles };
  const normalized = normalizeBackground(next.background, {
    backgroundColor: next.backgroundColor,
    backgroundImage: next.backgroundImage,
  });
  if (normalized) {
    next.background = normalized;
    return syncLegacyBackgroundFlats(next);
  }
  // Drop incomplete / empty background objects
  if (next.background && typeof next.background === 'object') {
    const t = String(next.background.type || '').trim();
    if (!t) delete next.background;
  }
  return next;
}
