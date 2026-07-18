import React from 'react';
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
  /** Called when the user taps the "+" button in the grid — appends a new item */
  onAddItem?: () => void;
  /** Called when the user taps the trash icon on a card — removes the item at that index */
  onRemoveItem?: (id: string) => void;
  /** Full section patch — used to materialize defaults to content.items on first edit */
  onSectionUpdate?: (sectionId: string, updates: any) => void;
  /** Selected section flag — controls visibility of add/remove affordances */
  isSelected?: boolean;
}

const REVIEWS = [
  { author: 'James Harrington', role: 'Austin, TX',      service: 'Service Booking',     rating: 5,   avatar: 'https://i.pravatar.cc/80?img=11', quote: "They handled the whole job start to finish without a hitch. On time, professional, and the price was exactly what they quoted. Couldn't ask for more." },
  { author: 'Maria Gonzalez',   role: 'Houston, TX',     service: 'Repeat Customer',     rating: 4.5, avatar: 'https://i.pravatar.cc/80?img=5',  quote: "I've used them for this service more than once now. Every time it's the same reliable, friendly experience. Finally a team I can trust." },
  { author: 'David Chen',       role: 'Dallas, TX',      service: 'New Installation',    rating: 5,   avatar: 'https://i.pravatar.cc/80?img=33', quote: 'Quick, clean, and professional from the first call to the final walkthrough. They even spotted a small issue and fixed it at no extra cost.' },
  { author: 'Sarah Mitchell',   role: 'San Antonio, TX', service: 'Full Service',        rating: 5,   avatar: 'https://i.pravatar.cc/80?img=9',  quote: "The job was done on time and on budget, and they left the place spotless. My family won't call anyone else for this." },
  { author: 'Robert Kim',       role: 'Fort Worth, TX',  service: 'Emergency Call',      rating: 4.5, avatar: 'https://i.pravatar.cc/80?img=52', quote: 'Called them in a panic and they were out fast. Diagnosed the problem right away and had it sorted the same day. Total lifesavers.' },
  { author: 'Emily Thompson',   role: 'Plano, TX',       service: 'Same-Day Service',    rating: 5,   avatar: 'https://i.pravatar.cc/80?img=16', quote: "Same-day service, professional, quick and friendly. Explained everything clearly and never tried to upsell me. Highly recommend." },
];

export const ServiceDetailTestimonialsDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  onAddItem, onRemoveItem, onSectionUpdate, isSelected = false,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const apiBadgeText = String((content as any).badgeText || 'Customer Reviews');
  const apiTitleText = String((content as any).title || 'Happy Customers');
  const apiDescriptionText = String(
    (content as any).subtitle ||
    (content as any).description ||
    'Real reviews from real customers who trusted us with this service.'
  );

  const lc = tc?.light || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = lc.titleColor || '#111827';
  const textColor  = lc.textColor  || '#4B5563';

  // Section bg: white-lock on theme switch
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
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  const textAlignClass = s.textAlign === 'left' ? 'text-left' : s.textAlign === 'right' ? 'text-right' : 'text-center';

  // Reviews from content.items. Live site: never invent stock demo service badges.
  const sourceItems: any[] = (content.items && content.items.length > 0) ? content.items : [];
  const itemsAreMaterialized = sourceItems.length > 0;
  const reviews = (sourceItems.length > 0 ? sourceItems : (readOnly ? [] : REVIEWS)).map((item: any, i: number) => {
    const fallback = REVIEWS[i % REVIEWS.length];
    const service = String(item?.service || item?.title || item?.badge || '').trim();
    return {
      id:      item?.id     || `sdt-rev-${i}`,
      author:  item?.author  || (readOnly ? 'Customer' : fallback.author),
      role:    item?.role    || (readOnly ? '' : fallback.role),
      service: service || (readOnly ? '' : fallback.service),
      rating:  item?.rating ?? (readOnly ? 5 : fallback.rating),
      avatar:  item?.avatar  || (readOnly ? '' : fallback.avatar),
      quote:   item?.quote   || item?.description || (readOnly ? '' : fallback.quote),
    };
  }).filter((r: any) => r.quote);

  // Materialize defaults to content.items if user has never edited.
  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return sourceItems;
    if (!onSectionUpdate) return reviews;
    onSectionUpdate(section.id, { content: { ...content, items: reviews } });
    return reviews;
  };

  const handleAddTestimonial = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const idx = current.length;
    const fallback = REVIEWS[idx % REVIEWS.length];
    const newItem = {
      id: `sdt-rev-${Date.now()}`,
      author: 'Customer Name',
      role: 'Location',
      service: fallback.service,
      rating: 5,
      avatar: fallback.avatar,
      quote: 'Add a quote here.',
    };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };

  const handleRemoveTestimonial = (revId: string) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any) => it.id !== revId);
    const elementIdToRemove = `${section.id}-sdt-${revId}`;
    const nextElements = (section.elements || []).filter((e) => e.id !== elementIdToRemove);
    onSectionUpdate(section.id, {
      content: { ...content, items: next },
      elements: nextElements,
    });
  };

  const themeColors = {
    ...tc,
    titleColor, textColor, accentColor: accent,
    testimonialCardAccent: accent,
    testimonialCardStarColor: accent,
  };

  // Section header elements
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sdt-badge`) || {
    id: `${section.id}-sdt-badge`, type: 'badge',
    content: { text: content.badgeText || 'Customer Reviews', icon: 'fa-star', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
      backgroundColor: `${accent}1A`,
      color: accent,
    },
  };
  const badgeElResolved: WebsiteElement = {
    ...badgeEl,
    content: { ...(badgeEl.content || {}), text: apiBadgeText },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-sdt-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const sourceText: string = apiTitleText.toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) {
      highlightedText = words[words.length - 1];
      textBefore = words.slice(0, -1).join(' ');
    }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sdt-desc`) || {
    id: `${section.id}-sdt-desc`, type: 'text',
    content: { text: apiDescriptionText, textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '520px', margin: '0 auto', lineHeight: '1.65' },
  };
  const descElResolved: WebsiteElement = {
    ...descEl,
    content: { ...(descEl.content || {}), text: apiDescriptionText },
  };

  // Single composite testimonial-card per review — keyed by review.id.
  const getReviewCardEl = (rev: { id: string; quote: string; author: string; role: string; service: string; rating: number; avatar: string }): WebsiteElement => {
    const id = `${section.id}-sdt-${rev.id}`;
    const existing = section.elements?.find(e => e.id === id);
    const defaultContent: any = {
      quote:   rev.quote,
      author:  rev.author,
      role:    rev.role,
      service: rev.service,
      rating:  rev.rating,
      avatar:  rev.avatar,
      showStars: true,
      showAvatar: true,
    };
    if (existing) {
      // Live/API content (rev.*) wins over stale element shells with stock badges.
      return {
        ...existing,
        content: { ...(existing.content || {}), ...defaultContent },
        style: { ...(existing.style || {}) } as any,
      };
    }
    return { id, type: 'testimonial-card', content: defaultContent, style: {} as any };
  };

  const showEditAffordances = isSelected && !readOnly;

  return (
    <div className={`w-full ${textAlignClass}`} style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeElResolved] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-10 sm:mb-14">
          <ElementsSection section={{ ...section, elements: [descElResolved] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Review cards — one testimonial-card element per review */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reviews.map((rev, i: number) => (
            <motion.div
              key={rev.id}
              className="relative group/item"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <ElementsSection
                section={{ ...section, elements: [getReviewCardEl(rev)] }}
                onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})}
                onElementSelect={onElementSelect}
                selectedElementId={selectedElementId}
                readOnly={readOnly}
                isWrapped={false}
                buttonClass={buttonClass}
                themeColors={themeColors}
              />
              {showEditAffordances && onSectionUpdate && reviews.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveTestimonial(rev.id); }}
                  className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover/item:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                  title="Remove testimonial"
                  aria-label="Remove testimonial"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </motion.div>
          ))}

          {/* Add testimonial tile — only when the section is selected */}
          {showEditAffordances && onSectionUpdate && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); handleAddTestimonial(); }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="min-h-[200px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 group/add"
              style={{
                borderColor: `${accent}33`,
                backgroundColor: `${accent}05`,
                color: accent,
              }}
              aria-label="Add testimonial"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover/add:scale-110"
                style={{ backgroundColor: `${accent}14` }}
              >
                <i className="fa-solid fa-plus text-lg" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Add Testimonial</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailTestimonialsDefault;
