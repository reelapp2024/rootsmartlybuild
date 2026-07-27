import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
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
  onAddItem?: () => void;
  onRemoveItem?: (id: string) => void;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
  isSelected?: boolean;
}

/**
 * FeaturesBento — alternate `features` variant (2026 bento grid, ref: FeaturesNext).
 *
 * Left-aligned header (eyebrow + accent heading + intro), then a 3-col bento
 * grid of cards. Each card: a mono "code" label + icon tile, title, body and a
 * row of detail chips. First card spans 2 cols (the headline benefit). Footer
 * CTA + footnote. Colors from theme (`tc.light`), nothing hardcoded.
 *
 * Builder-compatible: header (badge/title/desc) + each feature card
 * (feature-box element) are editable; add/remove preserved. Element ids reuse
 * the `fp-` prefix so content carries over on variant switch.
 */
const DEFAULT_FEATURES = [
  { icon: 'fa-phone',      code: '01 / RESPONSE', title: 'Fast, honest callbacks', desc: 'Ring us and you speak to a real person, not a queue. If we cannot answer straight away we call you back the same working day.', tags: ['Same-day callback', 'Emergency slots', 'Evening & weekend cover'], wide: true },
  { icon: 'fa-receipt',    code: '02 / PRICING',  title: 'Fixed price, up front',  desc: 'You get a written quote before any work starts. The price we agree is the price you pay.', tags: ['Free written quotes', 'No call-out fee'] },
  { icon: 'fa-shield-halved', code: '03 / PEOPLE', title: 'Vetted, local, insured', desc: 'Every member of our team is background checked, fully qualified and covered by our insurance.', tags: ['DBS checked', 'Fully insured'] },
  { icon: 'fa-clock',      code: '04 / TIMING',   title: 'We turn up when we say', desc: 'You get a two-hour arrival window and a text when we set off, so you are not writing off a whole day.', tags: ['2-hour window', 'Text when we set off'] },
  { icon: 'fa-circle-check', code: '05 / AFTERCARE', title: 'Guaranteed workmanship', desc: 'We tidy up before we leave and stand behind every job in writing. If something is not right, we come back.', tags: ['Written guarantee', 'Free return visits'] },
];

export const FeaturesBento: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  onAddItem, onRemoveItem, onSectionUpdate, isSelected = false,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const cardBg     = fb.background  || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border      || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';

  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some(t => {
      const dark = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  const bg = isThemeSurface ? '#FFFFFF' : savedBg;

  // Section-level background: honor the rich `s.background` object (color /
  // gradient / image + overlay) set from the Section → Background control, in
  // addition to the flat backgroundColor above.
  const sectionBg = (() => {
    const out: React.CSSProperties = {};
    const b = s.background;
    if (b && typeof b === 'object') {
      if (b.type === 'gradient' && b.gradient) {
        const stops = (b.gradient.stops || []).map((st: any) => `${st.color} ${st.position}%`).join(', ');
        if (stops) out.backgroundImage = b.gradient.type === 'radial' ? `radial-gradient(circle, ${stops})` : `linear-gradient(${b.gradient.direction || 90}deg, ${stops})`;
      } else if (b.type === 'image') {
        const url = b.image?.url || (Array.isArray(b.image?.images) ? b.image.images[0]?.url : '');
        if (url) {
          out.backgroundImage = `url(${url})`;
          out.backgroundPosition = b.image?.position || 'center';
          out.backgroundSize = b.image?.size || 'cover';
          out.backgroundRepeat = b.image?.repeat || 'no-repeat';
        } else {
          out.backgroundColor = bg;
        }
      } else if (b.type === 'color') {
        out.backgroundColor = b.color || bg;
      } else {
        out.backgroundColor = bg;
      }
    } else if (typeof s.backgroundImage === 'string' && s.backgroundImage.trim()) {
      // Legacy flat backgroundImage
      out.backgroundImage = /^url\(|gradient/i.test(s.backgroundImage) ? s.backgroundImage : `url(${s.backgroundImage})`;
      out.backgroundSize = s.backgroundSize || 'cover';
      out.backgroundPosition = s.backgroundPosition || 'center';
      out.backgroundRepeat = s.backgroundRepeat || 'no-repeat';
    } else {
      out.backgroundColor = bg;
    }
    return out;
  })();
  // Optional overlay (image/gradient legibility) from the Background control.
  const bgOverlay = (() => {
    const b = s.background;
    const color = b?.image?.overlay?.color || b?.overlay?.color || s.overlayColor;
    const opacityRaw = b?.image?.overlay?.opacity ?? b?.overlay?.opacity ?? s.overlayOpacityValue;
    const opacity = typeof opacityRaw === 'number' ? opacityRaw : (opacityRaw !== undefined ? parseFloat(opacityRaw) : NaN);
    if (color && Number.isFinite(opacity) && opacity > 0) {
      return { backgroundColor: color, opacity } as React.CSSProperties;
    }
    return null;
  })();
  const hasBgImage = !!(sectionBg.backgroundImage);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop  ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  // Section-level styling all honored: bg, padding (class or raw CSS), margin.
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  const sectionOuterStyle: React.CSSProperties = {
    ...sectionBg,
    position: 'relative',
    ...(s.marginTop ? { marginTop: s.marginTop } : {}),
    ...(s.marginBottom ? { marginBottom: s.marginBottom } : {}),
  };

  const sourceItems: any[] = (content.items && content.items.length > 0) ? content.items : [];
  const itemsAreMaterialized = sourceItems.length > 0;
  const rawFeatures = (sourceItems.length > 0 ? sourceItems : DEFAULT_FEATURES).map((item: any, i: number) => {
    const d = DEFAULT_FEATURES[i % DEFAULT_FEATURES.length];
    const fid = item?.id || `fp-feat-${i}`;
    // API / previously-saved content also lives on the shared `fp-<id>`
    // feature-box element (same id scheme as FeaturesPlumbing). Read from it so
    // dynamic content shows even when it's on the element rather than the item.
    const fbEl = section.elements?.find(e => e.id === `${section.id}-fp-${fid}`);
    const fbc = (fbEl?.content || {}) as any;
    return {
      id:    fid,
      icon:  item?.icon  || fbc.icon || d.icon,
      code:  item?.code  || fbc.code || d.code,
      title: item?.title || fbc.text  || fbc.title || d.title,
      desc:  item?.description || fbc.subText || fbc.description || d.desc,
      tags:  Array.isArray(item?.tags) && item.tags.length ? item.tags.map((t: any) => String(t?.text ?? t ?? '').trim()).filter(Boolean) : d.tags,
      wide:  item?.wide ?? d.wide ?? false,
    };
  });
  const hideAllIcons = !!(content as any).hideIcons;

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fp-badge`) || {
    id: `${section.id}-fp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Why choose us', iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'left' as any, backgroundColor: 'transparent', color: accent },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-fp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = (existing?.content as any)?.text || content.title || "Everything you'd want from a local team.";
    const words = String(src).replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean);
    const before = words.length > 2 ? words.slice(0, -2).join(' ') : '';
    const highlight = words.length > 2 ? words.slice(-2).join(' ') : src;
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: src, textBefore: before, highlightedText: highlight, textAfter: '', htmlTag: 'h2' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.08', letterSpacing: '-0.035em', textAlign: 'left' as any, highlightColor: accent },
    };
    return { ...base, content: { ...(base.content || {}), text: src, textBefore: before, highlightedText: highlight, textAfter: '', htmlTag: (base.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), highlightColor: (base.style as any)?.highlightColor || accent } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fp-desc`) || {
    id: `${section.id}-fp-desc`, type: 'text',
    content: { text: content.subtitle || 'No call centres, no surprise invoices and no waiting around all day. Here is exactly what you get when you book with us.', textSize: 'large' },
    style: { color: textColor, textAlign: 'left' as any, maxWidth: '600px', lineHeight: '1.75' },
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, iconColor: accent,
    featureBoxBackground: 'transparent', featureBoxBorder: 'transparent',
    featureBoxTitleColor: titleColor, featureBoxTextColor: textColor,
    featureBoxIconColor: accent, featureBoxIconBg: `${accent}15`,
  };

  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return sourceItems;
    if (!onSectionUpdate) return rawFeatures;
    const seeded = rawFeatures.map((f) => ({ id: f.id, icon: f.icon, code: f.code, title: f.title, description: f.desc, tags: f.tags, wide: f.wide }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };
  const handleAddFeature = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = DEFAULT_FEATURES[current.length % DEFAULT_FEATURES.length];
    const newItem = { id: `fp-feat-${Date.now()}`, icon: fallback.icon, code: `0${current.length + 1} / NEW`, title: 'New Feature', description: 'Add a description here.', tags: ['Detail'] };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };
  const handleRemoveFeature = (featId: string) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any) => it.id !== featId);
    onSectionUpdate(section.id, { content: { ...content, items: next } });
  };

  // Each feature is a single `feature-box` element (icon + title + desc) — the
  // SAME id scheme as FeaturesPlumbing (`fp-<feat.id>`), so API/edited content
  // renders here too. Defaults are merged with any existing element (existing
  // content wins) so a bulk/API-created shell still shows title + icon.
  const getFeatureBoxEl = (feat: any): WebsiteElement => {
    const id = `${section.id}-fp-${feat.id}`;
    const existing = section.elements?.find(e => e.id === id);
    const defaultContent: any = {
      icon: hideAllIcons ? 'none' : feat.icon,
      text: feat.title,
      subText: feat.desc,
      iconPosition: 'top',
    };
    // Icon rendered as a rounded accent tile (bento look). All of these are
    // sidebar-editable via the feature-box Design controls (existing wins).
    const defaultStyle: any = {
      iconContainerSize: '2.5rem', iconBorderRadius: '0.75rem',
      titleFontSize: '1.3rem', titleFontWeight: '700',
      descriptionFontSize: '0.9rem',
      borderWidth: '0', backgroundColor: 'transparent', padding: '0',
      textAlign: 'left' as any, titleAlign: 'left' as any, descriptionAlign: 'left' as any,
    };
    if (existing) {
      return {
        ...existing,
        content: { ...defaultContent, ...(existing.content || {}), ...(hideAllIcons ? { icon: 'none' } : {}) },
        style: { ...defaultStyle, ...(existing.style as any) },
      };
    }
    return { id, type: 'feature-box', content: defaultContent, style: defaultStyle };
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const uid = `fb-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className={`w-full ${uid}`} style={sectionOuterStyle}>
      {/* Background overlay (only when a bg image/gradient + overlay is set) */}
      {hasBgImage && bgOverlay && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />
      )}
      {/* Card hover: border turns accent + a soft cursor-follow glow */}
      <style>{`
        .${uid} .fb-card { position:relative; }
        .${uid} .fb-card::after { content:''; position:absolute; inset:0; border-radius:1rem; opacity:0; transition:opacity .3s; pointer-events:none; background:radial-gradient(320px circle at var(--cx,50%) var(--cy,50%), ${accent}14, transparent 70%); }
        .${uid} .fb-card:hover { border-color:${accent}66 !important; }
        .${uid} .fb-card:hover::after { opacity:1; }
        .${uid} .fb-card:hover .fb-icon { border-color:${accent}66 !important; }
      `}</style>
      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>

        {/* Header — left aligned */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-[720px]">
          <div className="inline-flex items-center gap-2.5">
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: accent }} />
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...pass} />
          </div>
          <div className="mt-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
          <div className="mt-6"><ElementsSection section={{ ...section, elements: [descEl] }} {...pass} /></div>
        </motion.div>

        {/* Bento grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rawFeatures.map((feat, i) => (
            <motion.div key={feat.id}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: (i % 3) * 0.09 }}
              onPointerMove={(e) => { const el = e.currentTarget; const r = el.getBoundingClientRect(); el.style.setProperty('--cx', `${e.clientX - r.left}px`); el.style.setProperty('--cy', `${e.clientY - r.top}px`); }}
              className={`fb-card group relative flex flex-col overflow-hidden rounded-2xl p-6 transition-[border-color] duration-300 ${feat.wide ? 'lg:col-span-2' : ''}`}
              style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
              {/* Code label (top). The feature-box element below renders its own
                  icon + title + desc — all sidebar-editable, single icon. */}
              <div className="relative z-10 flex items-start justify-between gap-4">
                <span className="text-[10px] uppercase tracking-[0.18em] font-mono" style={{ color: textColor }}>{feat.code}</span>
              </div>
              <div className="relative z-10 mt-4"><ElementsSection section={{ ...section, elements: [getFeatureBoxEl(feat)] }} {...pass} /></div>
              {feat.tags?.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {feat.tags.map((point: string, t: number) => (
                    <li key={t} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]" style={{ border: `1px solid ${cardBorder}`, color: textColor }}>
                      <svg aria-hidden viewBox="0 0 20 20" className="h-3 w-3 shrink-0" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5 8 14.5 16 5.5" /></svg>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
              {isSelected && !readOnly && onSectionUpdate && rawFeatures.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); handleRemoveFeature(feat.id); }}
                  className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                  title="Remove feature" aria-label="Remove feature"><i className="fa-solid fa-xmark" /></button>
              )}
            </motion.div>
          ))}
          {isSelected && !readOnly && onSectionUpdate && (
            <motion.button type="button" onClick={(e) => { e.stopPropagation(); handleAddFeature(); }}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="min-h-[180px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}05`, color: accent }} title="Add a feature">
              <i className="fa-solid fa-plus text-xl" />
              <span className="text-xs font-bold uppercase tracking-widest">Add Feature</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesBento;
