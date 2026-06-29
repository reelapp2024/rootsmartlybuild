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
  /** Full section patch — used to materialize defaults to content.items on first edit */
  onSectionUpdate?: (sectionId: string, updates: any) => void;
  isSelected?: boolean;
}

const DEFAULT_FEATURES = [
  { icon: 'fa-clock',               title: '24/7 Emergency Service', desc: 'Burst pipes, floods, blocked drains — we respond day or night, 365 days a year.' },
  { icon: 'fa-certificate',         title: 'Licensed & Insured',     desc: 'Fully certified plumbers with comprehensive insurance for your complete peace of mind.' },
  { icon: 'fa-bolt',                title: 'Same-Day Repairs',       desc: "Fast response time means we're at your door quickly and fix the problem on the first visit." },
  { icon: 'fa-file-invoice-dollar', title: 'Free Estimates',         desc: 'Transparent upfront pricing with no hidden fees. Know the cost before we start.' },
  { icon: 'fa-shield-alt',          title: '10-Year Guarantee',      desc: 'All our work is backed by a full 10-year workmanship guarantee. We stand by quality.' },
  { icon: 'fa-leaf',                title: 'Eco-Friendly Solutions', desc: 'Water-saving fixtures and sustainable techniques that cut your utility bills long-term.' },
];

export const FeaturesPlumbing: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  onAddItem, onRemoveItem, onSectionUpdate, isSelected = false,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  // Section background: stays white by default across theme switches.
  // Only a genuinely user-picked color (one that does NOT match any theme's surface/light.surface) wins.
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
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const iconColor  = fb.iconColor  || lc.iconColor  || lc.accentColor || accent;
  const iconBg     = fb.iconBg     || lc.iconBgColor || `${accent}15`;

  // Padding: accept both Tailwind class strings and raw CSS values ("32px", "2rem").
  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop  ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX    ?? 'px-4 sm:px-6';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  // textAlign sidebar value: apply to whole section
  const textAlignClass = s.textAlign === 'center' ? 'text-center' : s.textAlign === 'right' ? 'text-right' : 'text-left';

  // Feature list — driven by content.items when present so add/delete can mutate it.
  // Each row carries a stable id so per-card element edits don't scramble when items shift.
  const sourceItems: any[] = (content.items && content.items.length > 0) ? content.items : [];
  const itemsAreMaterialized = sourceItems.length > 0;
  const rawFeatures = (sourceItems.length > 0 ? sourceItems : DEFAULT_FEATURES).map((item: any, i: number) => {
    const fb = DEFAULT_FEATURES[i % DEFAULT_FEATURES.length];
    return {
      id:    item?.id    || `fp-feat-${i}`,
      icon:  item?.icon  || fb.icon,
      title: item?.title || fb.title,
      desc:  item?.description || fb.desc,
    };
  });

  // Section-level "Hide All Icons" toggle — overrides per-card icons when true
  const hideAllIcons = !!(content as any).hideIcons;

  // feature-box element: icon + title + description in one element.
  // Colors (icon, iconBg, card bg, border, title, text) are intentionally NOT baked in —
  // they flow through live from the active theme via ElementsSection.
  // Defaults are ALWAYS merged with any existing element so that a Bulk-created
  // shell (only style.iconColor set, no content) still renders with proper text + icons.
  // Existing values win over defaults for overlapping keys.
  const getFeatureBoxEl = (feat: { id: string; icon: string; title: string; desc: string }): WebsiteElement => {
    const id = `${section.id}-fp-${feat.id}`;
    const existing = section.elements?.find(e => e.id === id);

    const defaultContent: any = {
      icon:    hideAllIcons ? 'none' : feat.icon,
      text:    feat.title,
      subText: feat.desc,
      iconPosition: 'top',
    };
    const defaultStyle: any = {
      iconContainerSize:   '3rem',
      iconBorderRadius:    '0.75rem',
      titleFontSize:       '1.05rem',
      titleFontWeight:     '700',
      descriptionFontSize: '0.875rem',
      borderWidth:         '1px',
      borderStyle:         'solid',
      borderRadius:        '1rem',
      padding:             '1.5rem',
    };

    if (existing) {
      const existingContent = (existing.content || {}) as any;
      const existingStyle = (existing.style || {}) as any;
      return {
        ...existing,
        content: {
          ...defaultContent,
          ...existingContent,
          ...(hideAllIcons ? { icon: 'none' } : {}),
        },
        style: {
          ...defaultStyle,
          ...existingStyle,
        } as any,
      };
    }
    return { id, type: 'feature-box', content: defaultContent, style: defaultStyle as any };
  };

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fp-title`) || {
    id: `${section.id}-fp-title`, type: 'heading',
    content: {
      text: content.title || 'Why Homeowners Trust Us',
      textBefore: 'Why Homeowners',
      highlightedText: 'Trust Us',
      textAfter: '',
      htmlTag: 'h2',
    },
    // No explicit color — global heading color / theme.titleColor drives it.
    style: { textAlign: 'center' as any, fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15' },
  };

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fp-desc`) || {
    id: `${section.id}-fp-desc`, type: 'text',
    content: { text: content.subtitle || 'We combine speed, expertise and transparency to deliver plumbing services you can rely on.', textSize: 'large' },
    style: { color: textColor, textAlign: 'center' as any, maxWidth: '560px', margin: '0 auto' },
  };

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fp-badge`) || {
    id: `${section.id}-fp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Our Features', icon: 'fa-wrench', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem',
      fontWeight: '700',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as any,
      padding: '6px 14px',
      borderRadius: '9999px',
      textAlign: 'center' as any,
      // Denser tinted accent bg (~25% alpha) so badge has more presence on white
      backgroundColor: `${accent}40`,
      color: accent,
    },
  };

  // Feature-box tokens from active theme — forwarded to ElementsSection via top-level aliases
  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    iconColor,
    iconBgColor: iconBg,
    featureBoxBackground: fb.background || lc.cardBackgroundColor || '#FFFFFF',
    featureBoxBorder:     fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.10)',
    featureBoxIconColor:  iconColor,
    featureBoxIconBg:     iconBg,
    featureBoxTitleColor: titleColor,
    featureBoxTextColor:  textColor,
  };

  // Materialize the visible defaults to content.items if user has never edited the
  // section's items array. Returns the materialized list so callers can build on top.
  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return sourceItems;
    if (!onSectionUpdate) return rawFeatures;
    const seeded = rawFeatures.map((f) => ({
      id: f.id,
      icon: f.icon,
      title: f.title,
      description: f.desc,
    }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };

  // Add a new feature. Materializes defaults first if items array was empty.
  // Bypasses the generic onAddItem because we need a plumbing-shaped record.
  const handleAddFeature = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const idx = current.length;
    const fallback = DEFAULT_FEATURES[idx % DEFAULT_FEATURES.length];
    const newItem = {
      id: `fp-feat-${Date.now()}`,
      icon: fallback.icon,
      title: 'New Feature',
      description: 'Add a description here.',
    };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };

  // Remove a feature by id. Materializes defaults first if items array was empty.
  const handleRemoveFeature = (featId: string) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any) => it.id !== featId);
    // Also drop any per-card element overrides associated with this feature
    const elementIdToRemove = `${section.id}-fp-${featId}`;
    const nextElements = (section.elements || []).filter((e) => e.id !== elementIdToRemove);
    onSectionUpdate(section.id, {
      content: { ...content, items: next },
      elements: nextElements,
    });
  };

  return (
    <div className={`w-full ${textAlignClass}`} style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8 sm:mb-14">
          <ElementsSection section={{ ...section, elements: [descEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Feature boxes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {rawFeatures.map((feat, i: number) => (
            <motion.div key={feat.id}
              className="relative group/item transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <ElementsSection
                section={{ ...section, elements: [getFeatureBoxEl(feat)] }}
                onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})}
                onElementSelect={onElementSelect}
                selectedElementId={selectedElementId}
                readOnly={readOnly}
                isWrapped={false}
                buttonClass={buttonClass}
                themeColors={themeColors}
              />
              {isSelected && !readOnly && onSectionUpdate && rawFeatures.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFeature(feat.id); }}
                  className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover/item:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                  title="Remove feature"
                  aria-label="Remove feature"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </motion.div>
          ))}

          {/* Add feature tile — only when the section is selected */}
          {isSelected && !readOnly && onSectionUpdate && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); handleAddFeature(); }}
              initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="min-h-[180px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 group/add"
              style={{
                borderColor: `${accent}33`,
                backgroundColor: `${accent}05`,
                color: accent,
              }}
              aria-label="Add feature"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover/add:scale-110"
                style={{ backgroundColor: `${accent}14` }}
              >
                <i className="fa-solid fa-plus text-lg" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Add Feature</span>
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
};
