import type { Section } from '../../../../types';
import { toAbsoluteMediaUrl } from '../../../../config';

/** Shown when section has no `content.images[]` and no legacy `imageUrl` / element URL */
export const SECTION_IMAGE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

function pushUrl(urls: string[], raw: unknown) {
  if (typeof raw === 'string' && raw.trim()) urls.push(raw.trim());
}

/**
 * Collects ordered image URLs from `content.images`, then from `styles.background.image.images`.
 * Accepts `{ url }` entries or plain strings.
 */
export function collectSectionImageUrls(
  content?: Record<string, unknown> | null,
  styles?: Record<string, unknown> | null
): string[] {
  const urls: string[] = [];
  const c = content && typeof content === 'object' ? content : null;
  const fromArray = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (typeof item === 'string') pushUrl(urls, item);
      else if (item && typeof item === 'object' && 'url' in item) {
        pushUrl(urls, (item as { url?: unknown }).url);
      }
    }
  };
  if (c) fromArray((c as { images?: unknown }).images);
  if (urls.length === 0) {
    const bg = styles?.background as { image?: { images?: unknown } } | undefined;
    if (bg?.image?.images) fromArray(bg.image.images);
  }
  return urls;
}

/** Avatars / logos on items should not consume the section-level images[] pool */
function shouldPreferSectionImages(elementId: string): boolean {
  const lid = (elementId || '').toLowerCase();
  if (lid.includes('avatar')) return false;
  if (lid.includes('author-img')) return false;
  if (lid.includes('profile-photo')) return false;
  return true;
}

/**
 * Slot index for multi-image sections: `...-image-2`, `img_3`, or founder-style ids use slot 1 when present.
 */
export function inferImageSlotIndex(elementId: string): number {
  const m = elementId.match(/(?:image|img)[_-]?(\d+)/i);
  if (m) return Math.max(0, parseInt(m[1], 10) - 1);
  if (/founder|secondary-img|image-2|photo-2/i.test(elementId)) return 1;
  return 0;
}

export function toDisplayImageUrl(url: string): string {
  const u = (url || '').trim();
  if (!u) return SECTION_IMAGE_PLACEHOLDER;
  return toAbsoluteMediaUrl(u) || SECTION_IMAGE_PLACEHOLDER;
}

/**
 * Resolve display URL: **content.images[] (slot)** → **element / per-element URL** → **section content.imageUrl** → placeholder.
 */
export function resolveSectionImageUrl(
  section: Pick<Section, 'content' | 'styles'>,
  options: {
    elementId?: string;
    index?: number;
    /** Saved or virtual element `imageUrl` / `src` (e.g. hero `content.imageUrl`) */
    elementImageUrl?: string | null | undefined;
  } = {}
): string {
  const content = section.content as unknown as Record<string, unknown> | undefined;
  const styles = section.styles as unknown as Record<string, unknown> | undefined;

  const index =
    options.index !== undefined && options.index !== null
      ? options.index
      : options.elementId
        ? inferImageSlotIndex(options.elementId)
        : 0;

  const list =
    options.elementId && !shouldPreferSectionImages(options.elementId)
      ? []
      : collectSectionImageUrls(content, styles);

  const fromList = list[index] || list[0] || '';

  const elUrl =
    (typeof options.elementImageUrl === 'string' && options.elementImageUrl.trim()) || '';

  const sectionLegacy =
    (content && typeof content.imageUrl === 'string' && content.imageUrl.trim()) ||
    (content && typeof (content as { src?: string }).src === 'string' && (content as { src: string }).src.trim()) ||
    '';

  // Priority: explicit element/section user-edit URL wins over the AI-seeded
  // `images[]` pool. Previously `fromList` came first, which caused the pool
  // to mask user uploads — users reported "image won't change" after upload.
  if (elUrl) return elUrl;
  if (sectionLegacy) return sectionLegacy;
  if (fromList) return fromList;
  return SECTION_IMAGE_PLACEHOLDER;
}

export function resolveSectionImageUrlForElement(
  section: Pick<Section, 'content' | 'styles'>,
  element: { id: string; content?: Record<string, unknown> | null | undefined }
): string {
  const ec = (element.content || {}) as Record<string, unknown>;
  const elementImageUrl =
    (typeof ec.imageUrl === 'string' && ec.imageUrl) || (typeof ec.src === 'string' && ec.src) || '';
  return resolveSectionImageUrl(section, {
    elementId: element.id,
    elementImageUrl: String(elementImageUrl).trim() || undefined,
  });
}
