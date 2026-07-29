import React, { useEffect, useMemo, useRef } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

type MapMarker = {
  id?: string;
  name?: string;
  lat: number;
  lng: number;
  formattedAddress?: string;
};

function normalizeMarkers(content: any): MapMarker[] {
  const raw = Array.isArray(content?.markers) ? content.markers : [];
  const fromArray = raw
    .map((m: any, i: number) => {
      const lat = Number(m?.lat ?? m?.latitude);
      const lng = Number(m?.lng ?? m?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: String(m?.id || m?.locationId || `m-${i}`),
        name: String(m?.name || m?.title || m?.areaName || `Area ${i + 1}`).trim(),
        lat,
        lng,
        formattedAddress: String(m?.formattedAddress || '').trim(),
      } as MapMarker;
    })
    .filter(Boolean) as MapMarker[];

  if (fromArray.length) return fromArray;

  const lat = Number(content?.lat ?? content?.latitude);
  const lng = Number(content?.lng ?? content?.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [
      {
        id: 'single',
        name: String(content?.formattedAddress || content?.title || 'Location').trim(),
        lat,
        lng,
        formattedAddress: String(content?.formattedAddress || '').trim(),
      },
    ];
  }
  return [];
}

function ensureLeafletAssets(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);

  const cssId = 'leaflet-css-cdn';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('leaflet-js-cdn') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).L));
      existing.addEventListener('error', reject);
      if ((window as any).L) resolve((window as any).L);
      return;
    }
    const script = document.createElement('script');
    script.id = 'leaflet-js-cdn';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Location map (`locationmap`).
 * - 1 pin → Google Maps embed
 * - 2+ pins → interactive multi-marker map (Leaflet) highlighting all areas
 */
export const LocationMapDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const cardBorder = fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';

  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some(t => {
      const dark  = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  const bg = isThemeSurface ? '#FFFFFF' : savedBg;

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-6xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const markers = useMemo(() => normalizeMarkers(c), [c]);
  const multi = markers.length > 1;

  const lat = c.lat ?? c.latitude ?? markers[0]?.lat;
  const lng = c.lng ?? c.longitude ?? markers[0]?.lng;
  const hasLatLng = (lat !== undefined && lat !== null && lat !== '') && (lng !== undefined && lng !== null && lng !== '');
  const embedUrl: string | null =
    !multi && (typeof c.mapEmbedUrl === 'string' && c.mapEmbedUrl.trim())
      ? c.mapEmbedUrl.trim()
      : !multi && hasLatLng
        ? `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&z=13&output=embed`
        : null;

  useEffect(() => {
    if (!multi || !mapHostRef.current) return;
    let cancelled = false;

    ensureLeafletAssets()
      .then((L) => {
        if (cancelled || !L || !mapHostRef.current) return;
        if (mapRef.current) {
          try { mapRef.current.remove(); } catch { /* ignore */ }
          mapRef.current = null;
        }

        const map = L.map(mapHostRef.current, {
          scrollWheelZoom: false,
          attributionControl: true,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        const icon = L.divIcon({
          className: '',
          html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${accent};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const group: any[] = [];
        markers.forEach((m) => {
          const marker = L.marker([m.lat, m.lng], { icon })
            .addTo(map)
            .bindPopup(`<strong>${m.name || 'Area'}</strong>${m.formattedAddress ? `<br/><span style="font-size:12px;opacity:.8">${m.formattedAddress}</span>` : ''}`);
          group.push(marker);
        });

        if (group.length) {
          const bounds = L.featureGroup(group).getBounds();
          map.fitBounds(bounds.pad(0.18));
        } else {
          map.setView([20, 0], 2);
        }

        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 80);
      })
      .catch(() => {
        /* map assets failed — placeholder remains */
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
      }
    };
  }, [multi, markers, accent]);

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-mp-badge`) || {
    id: `${section.id}-mp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Find Us', icon: 'fa-map-pin', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-mp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText = (
      (readOnly ? String(content.title || '').trim() : '') ||
      cc.text ||
      content.title ||
      (multi ? 'Areas We Serve' : 'Our Service Area')
    ).toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em', textAlign: 'center' as any },
    };
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h2',
        },
        style: { ...(base.style as any), ...(existing.style as any) },
      } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const hasMap = multi ? markers.length > 0 : Boolean(embedUrl);

  return (
    <div className="w-full text-center" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-8 flex flex-col items-center gap-3">
          <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
          {multi && markers.length > 0 ? (
            <p className="text-sm max-w-2xl" style={{ color: textColor }}>
              {String(c.subtitle || `${markers.length} service areas highlighted on the map`).trim()}
            </p>
          ) : null}
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${cardBorder}`, boxShadow: `0 12px 40px -20px ${accent}30` }}
        >
          {multi && markers.length > 0 ? (
            <div ref={mapHostRef} className="w-full" style={{ height: '420px' }} />
          ) : embedUrl ? (
            <iframe
              title="Service area map"
              src={embedUrl}
              className="w-full"
              style={{ height: '420px', border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-3"
              style={{ height: '420px', backgroundColor: `${accent}08` }}>
              <span className="flex items-center justify-center w-16 h-16 rounded-full"
                style={{ backgroundColor: `${accent}18`, color: accent }}>
                <i className="fas fa-map-location-dot text-2xl" aria-hidden="true" />
              </span>
              <p className="text-sm" style={{ color: textColor }}>
                {hasMap
                  ? 'Loading map…'
                  : 'Add locations with Google Maps so pins appear here.'}
              </p>
            </div>
          )}
        </motion.div>

        {multi && markers.length > 0 ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {markers.slice(0, 24).map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${accent}12`, color: titleColor, border: `1px solid ${accent}33` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                {m.name}
              </span>
            ))}
            {markers.length > 24 ? (
              <span className="text-xs" style={{ color: textColor }}>+{markers.length - 24} more</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LocationMapDefault;
