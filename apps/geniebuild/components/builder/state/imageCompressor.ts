/**
 * Client-side image compressor. Resizes to a max dimension and re-encodes
 * as WebP (preferred) or falls back to JPEG for compatibility.
 * No external dependencies — uses <canvas> and File constructor.
 *
 * Returns the original file unchanged if:
 *   - file is already tiny (< 200KB) — not worth re-encoding
 *   - file is an SVG (vector — no raster compression needed)
 *   - file is a GIF (animation would be lost)
 *   - browser can't decode the image
 */

interface CompressOptions {
  /** Max width OR height (whichever is larger). Aspect ratio preserved. */
  maxDimension?: number;
  /** JPEG/WebP quality 0-1. WebP typically needs less. */
  quality?: number;
  /** Skip files smaller than this (bytes) — not worth recompressing. */
  skipIfBelowBytes?: number;
  /** Prefer WebP when browser supports it (most modern browsers do). */
  preferWebp?: boolean;
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 2000,
  quality: 0.82,
  skipIfBelowBytes: 200 * 1024, // 200 KB
  preferWebp: true,
};

function supportsWebp(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/** Read File → HTMLImageElement (via object URL). */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };
    img.src = url;
  });
}

/**
 * Compress a single image file. Returns the compressed File (or the original
 * if compression doesn't help / isn't applicable).
 */
export async function compressImageFile(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const options = { ...DEFAULTS, ...opts };

  // Skip non-images
  if (!file.type.startsWith('image/')) return file;
  // Skip SVG (vector — no raster compress)
  if (file.type === 'image/svg+xml') return file;
  // Skip GIF (animation would be lost)
  if (file.type === 'image/gif') return file;
  // Skip tiny files
  if (file.size < options.skipIfBelowBytes) return file;

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file; // Decode failed — return original
  }

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  if (!origW || !origH) return file;

  // Compute target size (never upscale)
  const scale = Math.min(1, options.maxDimension / Math.max(origW, origH));
  const targetW = Math.round(origW * scale);
  const targetH = Math.round(origH * scale);

  // If no resize AND file < 1MB, skip — re-encode alone rarely helps small JPEGs
  if (scale === 1 && file.size < 1024 * 1024) return file;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Try WebP first, fall back to JPEG
  const useWebp = options.preferWebp && supportsWebp();
  const mime = useWebp ? 'image/webp' : 'image/jpeg';

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, mime, options.quality)
  );
  if (!blob) return file;

  // If compressed is bigger than original, keep original
  if (blob.size >= file.size) return file;

  const ext = useWebp ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.${ext}`, {
    type: mime,
    lastModified: Date.now(),
  });
}
