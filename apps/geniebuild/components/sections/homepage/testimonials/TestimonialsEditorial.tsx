import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
import { motion } from 'motion/react';
import { resolveSectionElement, elementFromExistingOrDna } from '../../../../elements';

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
 * TestimonialsEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * A left-aligned header (neutral badge + heading + intro) sitting beside an
 * aggregate rating chip, then a balanced masonry of review cards. Each review
 * renders through the composite `testimonial-card` element (quote, author,
 * role/service, stars, avatar). Industry-neutral, light section.
 *
 * Fully dynamic keys: badgeText, title, subtitle/description, items[]{id,author,
 * role,service,rating,avatar,quote}. Element ids reuse the `tp-` prefix so
 * content carries over on variant switch. Add/remove wired; readOnly never
 * invents stock reviews. The aggregate rating chip is derived from item ratings.
 */
const REVIEWS = [
  { author: 'James Harrington', role: 'Long-time customer', service: 'Emergency callout', rating: 5,   avatar: 'https://i.pravatar.cc/80?img=11', quote: "They turned up fast, explained every step, and the price was exactly what they quoted. Couldn't ask for more." },
  { author: 'Maria Gonzalez',   role: 'Repeat client',      service: 'Planned work',      rating: 5,   avatar: 'https://i.pravatar.cc/80?img=5',  quote: "I'd struggled with the same problem for years. They found the real cause in minutes and sorted it properly." },
  { author: 'David Chen',       role: 'Homeowner',          service: 'Installation',      rating: 5,   avatar: 'https://i.pravatar.cc/80?img=33', quote: 'Quick, clean and professional. They even spotted a small issue and fixed it at no extra cost.' },
  { author: 'Sarah Mitchell',   role: 'Local resident',     service: 'Full project',      rating: 5,   avatar: 'https://i.pravatar.cc/80?img=9',  quote: 'Done on time and on budget, and they left the place spotless. We won\'t call anyone else now.' },
  { author: 'Robert Kim',       role: 'Business owner',     service: 'Maintenance',       rating: 5,   avatar: 'https://i.pravatar.cc/80?img=52', quote: 'Honest, reliable and easy to deal with. Saved us a fortune by catching a problem early.' },
];

export const TestimonialsEditorial: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  onSectionUpdate, isSelected = false,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const apiBadgeText = String((content as any).badgeText || 'Customer reviews');
  const apiTitleText = String((content as any).title || 'What our customers say');
  const apiDescriptionText = String((content as any).subtitle || (content as any).description || 'Real words from real customers who trusted us with the job.');

  const lc = tc?.light || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = lc.titleColor || '#111827';
  const textColor  = lc.textColor  || '#4B5563';
  const cardBg     = (lc as any).cardBackgroundColor || '#FFFFFF';
  const cardBorder = (lc as any).cardBorderColor || 'rgba(0,0,0,0.08)';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';

  // Section background: color / gradient / image (image-only overlay) via shared resolver.
  const defaultSurface = lc.surface || (lc as any).cardBackgroundColor || '#FFFFFF';
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const sourceItems: any[] = (content.items && content.items.length > 0) ? content.items : [];
  const itemsAreMaterialized = sourceItems.length > 0;
  const reviews = (sourceItems.length > 0 ? sourceItems : (readOnly ? [] : REVIEWS)).map((item: any, i: number) => {
    const fallback = REVIEWS[i % REVIEWS.length];
    const service = String(item?.service || item?.title || item?.badge || '').trim();
    return {
      id:      item?.id     || `tp-rev-${i}`,
      author:  item?.author  || (readOnly ? 'Customer' : fallback.author),
      role:    item?.role    || (readOnly ? '' : fallback.role),
      service: service || (readOnly ? '' : fallback.service),
      rating:  item?.rating ?? (readOnly ? 5 : fallback.rating),
      avatar:  item?.avatar  || (readOnly ? '' : fallback.avatar),
      quote:   item?.quote   || item?.description || (readOnly ? '' : fallback.quote),
    };
  }).filter((r: any) => r.quote);

  // Aggregate rating chip (derived, not a separate dynamic field).
  const ratingVals = reviews.map((r: any) => Number(r.rating)).filter((n: number) => Number.isFinite(n) && n > 0);
  const avgRating = ratingVals.length ? (ratingVals.reduce((a: number, b: number) => a + b, 0) / ratingVals.length) : 0;

  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return sourceItems;
    if (!onSectionUpdate) return reviews;
    onSectionUpdate(section.id, { content: { ...content, items: reviews } });
    return reviews;
  };
  const handleAddTestimonial = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = REVIEWS[current.length % REVIEWS.length];
    const newItem = { id: `tp-rev-x${current.length}`, author: 'Customer Name', role: 'Location', service: fallback.service, rating: 5, avatar: fallback.avatar, quote: 'Add a quote here.' };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };
  const handleRemoveTestimonial = (revId: string) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any) => it.id !== revId);
    const nextElements = (section.elements || []).filter((e) => e.id !== `${section.id}-tp-${revId}`);
    onSectionUpdate(section.id, { content: { ...content, items: next }, elements: nextElements });
  };

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, testimonialCardAccent: accent, testimonialCardStarColor: accent };

  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-tp-badge`, type: 'badge',
    content: { text: apiBadgeText, iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'left' as any},
  });
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: apiBadgeText } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-tp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = String((existing?.content as any)?.text || apiTitleText).replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.1', letterSpacing: '-0.03em', textAlign: 'left' as any },
    });
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-tp-desc`, type: 'text',
    content: { text: apiDescriptionText, textSize: 'large' },
    style: { textAlign: 'left' as any, maxWidth: '520px', lineHeight: '1.7' },
  });
  const descElResolved: WebsiteElement = { ...descEl, content: { ...(descEl.content || {}), text: apiDescriptionText } };

  const getReviewCardEl = (rev: any): WebsiteElement => {
    const id = `${section.id}-tp-${rev.id}`;
    const existing = section.elements?.find(e => e.id === id);
    const defaultContent: any = { quote: rev.quote, author: rev.author, role: rev.role, service: rev.service, rating: rev.rating, avatar: rev.avatar, showStars: true, showAvatar: true };
    if (existing) {
      return { ...existing, content: { ...(existing.content || {}), ...defaultContent }, style: { ...(existing.style || {}) } as any };
    }
    return { id, type: 'testimonial-card', content: defaultContent, style: {} as any };
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const showEdit = isSelected && !readOnly;
  const uid = `te-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className={`w-full relative ${uid}`} style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>

        {/* Header row: copy left, rating chip right */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-[640px]">
            <div className="inline-flex items-center gap-2.5">
              <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
              <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...pass} />
            </div>
            <div className="mt-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
            <div className="mt-5"><ElementsSection section={{ ...section, elements: [descElResolved] }} {...pass} /></div>
          </motion.div>

          {avgRating > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-4 rounded-2xl px-5 py-4 shrink-0" style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
              <span className="text-3xl font-extrabold leading-none" style={{ color: titleColor }}>{avgRating.toFixed(1)}</span>
              <span className="block w-px h-9" style={{ backgroundColor: cardBorder }} />
              <span>
                <span className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, k) => (
                    <svg key={k} viewBox="0 0 20 20" className="h-4 w-4" fill={k < Math.round(avgRating) ? accent : `${accent}33`}><path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15.9 4.7 17.6l1-5.8L1.5 7.7l5.9-.9z" /></svg>
                  ))}
                </span>
                <span className="mt-1 block text-[12px]" style={{ color: textColor }}>{reviews.length} verified review{reviews.length === 1 ? '' : 's'}</span>
              </span>
            </motion.div>
          )}
        </div>

        {/* Masonry review grid */}
        <div className="mt-14 columns-1 md:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
          {reviews.map((rev: any, i: number) => (
            <motion.div key={rev.id}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="relative group/item mb-5 break-inside-avoid">
              <ElementsSection section={{ ...section, elements: [getReviewCardEl(rev)] }} {...pass} />
              {showEdit && onSectionUpdate && reviews.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); handleRemoveTestimonial(rev.id); }}
                  className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover/item:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                  title="Remove testimonial" aria-label="Remove testimonial"><i className="fa-solid fa-xmark" /></button>
              )}
            </motion.div>
          ))}
          {showEdit && onSectionUpdate && (
            <button onClick={(e) => { e.stopPropagation(); handleAddTestimonial(); }}
              className="mb-5 break-inside-avoid w-full min-h-[160px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3"
              style={{ borderColor: `${accent}33`, backgroundColor: `${accent}05`, color: accent }} aria-label="Add testimonial">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}14` }}><i className="fa-solid fa-plus text-lg" /></div>
              <span className="text-xs font-bold uppercase tracking-widest">Add Testimonial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsEditorial;
