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
}

/** Local editor/demo placeholders only — never used when API items exist. */
const DEMO_RELATED = [
  { icon: 'fa-screwdriver-wrench', title: 'Service One', description: 'Add services in admin — related cards load from your catalog.' },
  { icon: 'fa-toolbox', title: 'Service Two', description: 'Cards are location-aware when opened under an area page.' },
];

function isValidLink(v: unknown): boolean {
  const s = String(v || '').trim();
  if (!s || s === '#') return false;
  return s.startsWith('/') || /^https?:\/\//i.test(s) || s.startsWith('tel:') || s.startsWith('mailto:');
}

/** Published cards: show up to 70 words, then "..." */
const RELATED_SERVICE_DESC_MAX_WORDS = 70;

function truncateToWords(text: string, maxWords: number): string {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function formatRelatedServiceDescription(raw: string, readOnlyMode: boolean): string {
  const description = String(raw || '').trim();
  if (!readOnlyMode || !description) return description;
  const words = description.split(/\s+/).filter(Boolean);
  if (words.length <= RELATED_SERVICE_DESC_MAX_WORDS) return description;
  return truncateToWords(description, RELATED_SERVICE_DESC_MAX_WORDS);
}

/**
 * RelatedServicesDefault — sibling services from the same scope as this service page:
 * home/parent catalog on home service URLs, that location's catalog under area URLs.
 * Items come from resolve-time DB (buildServicesGridContentFromBundle), current service excluded.
 */
export const RelatedServicesDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const iconColor  = fb.iconColor  || lc.iconColor  || accent;
  const iconBg     = fb.iconBg     || lc.iconBgColor || `${accent}15`;
  const cardBg     = fb.background || lc.cardBackgroundColor || '#FFFFFF';
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
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  const textAlignClass = s.textAlign === 'left' ? 'text-left' : s.textAlign === 'right' ? 'text-right' : 'text-center';
  const hideAllIcons = !!(content as any).hideIcons;

  const apiItems = Array.isArray(content.items) ? content.items : [];
  const rawItems = (apiItems.length > 0
    ? apiItems
    : readOnly
      ? []
      : DEMO_RELATED
  )
    .map((item: any, i: number) => {
      const title = String(item.title || item.name || item.service_name || '').trim();
      const description = formatRelatedServiceDescription(
        String(item.description || item.subText || item.about_service || '').trim(),
        readOnly
      );
      const icon = String(item.icon || item.iconClass || 'fa-screwdriver-wrench')
        .replace(/^fas?\s+/, '')
        .trim() || 'fa-screwdriver-wrench';
      const linkRaw =
        item.link || item.href || item.url || item.path || item.permalink || '';
      const link = isValidLink(linkRaw) ? String(linkRaw).trim() : '';
      const imageUrl = String(item.imageUrl || item.image || '').trim();
      const serviceId = String(item.serviceId || item.id || '').trim();
      return { title, description, icon, link, imageUrl, serviceId, _i: i };
    })
    .filter((it: any) => it.title);

  const badgeText = String(
    c.badgeText || c.relatedServicesBadge || 'More Services'
  ).trim();
  const titleText = String(
    c.title || c.relatedServicesTitle || 'Related Services'
  ).trim();
  const subtitleText = String(
    c.subtitle ||
      c.relatedServicesSubtitle ||
      c.intro ||
      'Explore other services we offer to keep your home running smoothly.'
  ).trim();

  const themeColors = {
    ...tc,
    titleColor, textColor, accentColor: accent,
    iconColor, iconBgColor: iconBg,
    secondaryHeadingColor: accent,
    featureBoxBackground: cardBg,
    featureBoxBorder:     cardBorder,
    featureBoxIconColor:  iconColor,
    featureBoxIconBg:     iconBg,
    featureBoxTitleColor: titleColor,
    featureBoxTextColor:  textColor,
  };

  const passThrough = {
    onTextEdit,
    onElementUpdate: onElementUpdate || (() => {}),
    onElementSelect,
    selectedElementId,
    readOnly,
    isWrapped: false,
    buttonClass,
    themeColors,
  } as const;

  const badgeEl: WebsiteElement = (() => {
    const id = `${section.id}-rs-badge`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = existing || {
      id, type: 'badge',
      content: { text: badgeText, icon: 'fa-layer-group', iconPosition: 'left', iconSize: '0.65rem' },
      style: {
        fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
        textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
        textAlign: 'center' as any,
      },
    };
    return {
      ...base,
      content: {
        ...(base.content || {}),
        text: readOnly ? badgeText : (String((base.content as any)?.text || '').trim() || badgeText),
        icon: (base.content as any)?.icon || 'fa-layer-group',
        iconPosition: 'left',
        iconSize: '0.65rem',
      },
    };
  })();

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-rs-title`;
    const existing = section.elements?.find(e => e.id === id);
    const sourceText = (readOnly
      ? titleText
      : String((existing?.content as any)?.text || titleText)
    ).replace(/<[^>]+>/g, '').trim();
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
    return {
      ...base,
      content: {
        ...(base.content || {}),
        text: sourceText,
        textBefore,
        highlightedText,
        textAfter: '',
        htmlTag: base.content?.htmlTag || 'h2',
      },
    };
  })();

  const descEl: WebsiteElement = (() => {
    const id = `${section.id}-rs-desc`;
    const existing = section.elements?.find(e => e.id === id);
    const text = readOnly
      ? subtitleText
      : String((existing?.content as any)?.text || subtitleText).trim() || subtitleText;
    const base: WebsiteElement = existing || {
      id, type: 'text',
      content: { text, textSize: 'large' },
      style: { textAlign: 'center' as any, maxWidth: '580px', margin: '0 auto', lineHeight: '1.65' },
    };
    return { ...base, content: { ...(base.content as any), text, textSize: (base.content as any)?.textSize || 'large' } };
  })();

  const getItemEl = (i: number): WebsiteElement => {
    const item = rawItems[i];
    const id = `${section.id}-rs-card${i}`;
    const existing = section.elements?.find(e => e.id === id);
    const useImageBox = Boolean(item.imageUrl);

    if (existing && !readOnly) {
      return hideAllIcons
        ? { ...existing, content: { ...(existing.content || {}), icon: 'none' } }
        : existing;
    }

    if (useImageBox) {
      const base: WebsiteElement = existing?.type === 'image-box' ? existing : {
        id, type: 'image-box',
        content: {},
        style: {
          backgroundColor: 'transparent',
          borderRadius: '0.875rem',
          contentPadding: '1rem 0 0',
          imageHeight: '10rem',
          imageObjectFit: 'cover',
          titleColor,
          titleFontWeight: '700',
          descriptionColor: textColor,
          descriptionFontSize: '0.875rem',
          descriptionLineClamp: 3,
          buttonVariant: 'link',
          buttonTextColor: accent,
          buttonFontSize: '0.875rem',
          buttonFontWeight: 600,
        } as any,
      };
      return {
        ...base,
        type: 'image-box',
        content: {
          ...(base.content || {}),
          imageUrl: item.imageUrl,
          text: item.title,
          title: item.title,
          description: item.description,
          subText: item.description,
          link: item.link || '#',
          showButton: Boolean(item.link),
          buttonText: 'Learn More',
          buttonLink: item.link || '#',
        } as any,
      };
    }

    const base: WebsiteElement = existing || {
      id, type: 'feature-box',
      content: {},
      style: {
        iconContainerSize: '3rem',
        iconBorderRadius:  '0.75rem',
        titleFontSize:     '1.0625rem',
        titleFontWeight:   '700',
        descriptionFontSize: '0.875rem',
        borderWidth:       '1px',
        borderStyle:       'solid',
        borderRadius:      '1rem',
        padding:           '1.5rem',
        backgroundColor:   cardBg,
        textAlign:         'center' as any,
        titleAlign:        'center' as any,
        descriptionAlign:  'center' as any,
      } as any,
    };

    return {
      ...base,
      type: 'feature-box',
      content: {
        ...(base.content || {}),
        icon: hideAllIcons ? 'none' : item.icon,
        text: item.title,
        subText: item.description,
        link: item.link || undefined,
        iconPosition: 'top',
      },
    };
  };

  if (readOnly && rawItems.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${textAlignClass}`} style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-10 sm:mb-14">
          <ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {rawItems.map((it: any, i: number) => {
            const card = (
              <ElementsSection section={{ ...section, elements: [getItemEl(i)] }} {...passThrough} />
            );
            return (
              <motion.div key={it.serviceId || it.link || `${it.title}-${i}`}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              >
                {readOnly && it.link ? (
                  <a href={it.link} className="block no-underline text-inherit h-full">
                    {card}
                  </a>
                ) : (
                  card
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RelatedServicesDefault;
