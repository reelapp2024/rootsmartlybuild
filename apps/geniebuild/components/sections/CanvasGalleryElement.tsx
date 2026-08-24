import React, { useState, useRef } from 'react';

interface GalleryImage { src: string; alt?: string; }

interface CanvasGalleryElementProps {
  content: any;
  style: any;
  theme: any;
  readOnly: boolean;
  /** Resolve an image url (handles relative/proxied urls). */
  resolveImg: (url: string) => string;
  placeholder: string;
}

/**
 * Canvas 'gallery' element — grid OR carousel of images (Elementor Gallery /
 * Image Carousel). Layout, columns, gap, radius, aspect-ratio all editable.
 */
export const CanvasGalleryElement: React.FC<CanvasGalleryElementProps> = ({
  content, style, theme, readOnly, resolveImg, placeholder,
}) => {
  const s = style || {};
  const images: GalleryImage[] = Array.isArray(content?.images) && content.images.length
    ? content.images
    : [{ src: '' }, { src: '' }, { src: '' }];

  const layout: string = s.galleryLayout || 'grid';
  const cols = Math.min(Math.max(parseInt(String(s.columns), 10) || 3, 1), 6);
  const gap = s.imageGap || '0.75rem';
  const radius = s.imageRadius || '0.75rem';
  const ratio = s.imageAspectRatio || '1/1';
  const fit = s.imageObjectFit || 'cover';
  const accent = s.accentColor || theme?.accentColor || '#6366f1';

  const src = (img: GalleryImage) => (img.src ? resolveImg(img.src) : placeholder);

  const imgEl = (img: GalleryImage, i: number, extra?: React.CSSProperties) => (
    <img
      key={i}
      src={src(img)}
      alt={img.alt || `Gallery image ${i + 1}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => { (e.target as HTMLImageElement).src = placeholder; }}
      style={{ width: '100%', height: '100%', objectFit: fit as any, borderRadius: radius, display: 'block', ...extra }}
    />
  );

  // ── CAROUSEL ──────────────────────────────────────────────────────────
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const perView = Math.min(Math.max(parseInt(String(s.carouselPerView), 10) || cols, 1), 6);
  const go = (dir: number) => {
    const max = Math.max(0, images.length - perView);
    setIdx((p) => Math.min(max, Math.max(0, p + dir)));
  };

  if (layout === 'carousel') {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div
            ref={trackRef}
            style={{
              display: 'flex', gap,
              transform: `translateX(calc(-${idx} * (100% + ${gap}) / ${perView}))`,
              transition: 'transform .4s cubic-bezier(.22,.61,.36,1)',
            }}
          >
            {images.map((img, i) => (
              <div key={i} style={{ flex: `0 0 calc((100% - (${perView - 1} * ${gap})) / ${perView})`, aspectRatio: ratio }}>
                {imgEl(img, i)}
              </div>
            ))}
          </div>
        </div>
        {images.length > perView && (
          <>
            <button type="button" aria-label="Previous" onClick={() => go(-1)}
              style={navBtn(accent, 'left')}><i className="fa-solid fa-chevron-left" /></button>
            <button type="button" aria-label="Next" onClick={() => go(1)}
              style={navBtn(accent, 'right')}><i className="fa-solid fa-chevron-right" /></button>
          </>
        )}
      </div>
    );
  }

  // ── MASONRY (CSS columns) ─────────────────────────────────────────────
  if (layout === 'masonry') {
    return (
      <div style={{ columnCount: cols, columnGap: gap, width: '100%' }}>
        {images.map((img, i) => (
          <div key={i} style={{ breakInside: 'avoid', marginBottom: gap }}>
            {imgEl(img, i, { height: 'auto' })}
          </div>
        ))}
      </div>
    );
  }

  // ── GRID (default) ────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap, width: '100%' }}>
      {images.map((img, i) => (
        <div key={i} style={{ aspectRatio: ratio, overflow: 'hidden', borderRadius: radius }}>
          {imgEl(img, i)}
        </div>
      ))}
    </div>
  );
};

function navBtn(accent: string, side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: '-8px', width: '36px', height: '36px', borderRadius: '50%',
    border: 'none', cursor: 'pointer', backgroundColor: accent, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,.25)', zIndex: 2,
  } as React.CSSProperties;
}
