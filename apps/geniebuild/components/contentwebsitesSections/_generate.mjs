/**
 * Generate GenieBuild-compatible funky content sections.
 * Structure mirrors components/sections: {page}/{sectionType}/{Variant}.tsx
 *
 * node apps/geniebuild/components/contentwebsitesSections/_generate.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function write(rel, body) {
  const full = path.join(__dirname, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body.replace(/^\n/, ''), 'utf8');
  console.log('wrote', rel);
}

const HEADER = `import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { FUNKY, funkyFromTheme } from '../../funkyTheme';
import { motion } from 'motion/react';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: Partial<WebsiteElement>) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}
`;

function heroLike({
  file,
  exportName,
  prefix,
  defaultBadge,
  defaultTitle,
  defaultSubtitle,
  bgKey,
}) {
  write(
    file,
    `${HEADER}
/**
 * ${exportName} — funky content-site hero (GenieBuild ElementsSection compatible).
 */
export const ${exportName}: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);

  const titleColor = tc?.titleColor || f.ink;
  const textColor = tc?.textColor || f.muted;
  const accent = tc?.iconColor || tc?.accentColor || f.primary;
  const bg = s.backgroundColor || ${bgKey};

  const padT = s.paddingTop ?? 'pt-20 sm:pt-24 lg:pt-28';
  const padB = s.paddingBottom ?? 'pb-16 sm:pb-20';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-badge\`) || {
    id: \`\${section.id}-${prefix}-badge\`, type: 'badge',
    content: { text: c.badgeText || ${JSON.stringify(defaultBadge)}, icon: 'fa-sparkles', iconPosition: 'left' },
    style: { fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px' },
  };
  const titleEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-title\`) || {
    id: \`\${section.id}-${prefix}-title\`, type: 'heading',
    content: { text: c.title || ${JSON.stringify(defaultTitle)}, htmlTag: 'h1' },
    style: { color: titleColor, fontSize: s.titleSize || 'clamp(2.2rem, 5.5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-0.03em', fontFamily: FUNKY.fonts.display },
  };
  const descEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-desc\`) || {
    id: \`\${section.id}-${prefix}-desc\`, type: 'text',
    content: { text: c.subtitle || c.description || ${JSON.stringify(defaultSubtitle)}, textSize: 'large' },
    style: { color: textColor, maxWidth: '560px', fontFamily: FUNKY.fonts.body },
  };

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg, fontFamily: FUNKY.fonts.body }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className="absolute pointer-events-none" style={{ width: 240, height: 240, borderRadius: '40% 60% 55% 45% / 50% 40% 60% 50%', background: f.accent, opacity: 0.45, top: -60, right: -40 }} />
      <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '40% 60% 55% 45% / 50% 40% 60% 50%', background: f.secondary, opacity: 0.3, bottom: 20, left: -50 }} />
      <div className={\`relative z-10 max-w-7xl mx-auto \${padX} \${padT} \${padB}\`}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5 text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
          <div className="inline-flex" style={{ transform: 'rotate(-2deg)', border: \`2.5px solid \${f.ink}\`, borderRadius: 999, boxShadow: FUNKY.shadow, background: f.sunshine, overflow: 'hidden' }}>
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
          <div className="mx-auto sm:mx-0">
            <ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ${exportName};
`
  );
}

function ctaHeroLike({ file, exportName, prefix, defaultTitle, defaultSubtitle, defaultCta, cardBg }) {
  write(
    file,
    `${HEADER}
export const ${exportName}: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const titleColor = tc?.titleColor || f.ink;
  const textColor = tc?.textColor || f.muted;
  const bg = s.backgroundColor || f.cream;
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-title\`) || {
    id: \`\${section.id}-${prefix}-title\`, type: 'heading',
    content: { text: c.title || ${JSON.stringify(defaultTitle)}, htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display, textAlign: 'center' as any },
  };
  const descEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-desc\`) || {
    id: \`\${section.id}-${prefix}-desc\`, type: 'text',
    content: { text: c.subtitle || c.description || ${JSON.stringify(defaultSubtitle)} },
    style: { color: textColor, textAlign: 'center' as any, fontFamily: FUNKY.fonts.body },
  };
  const btnEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-btn\`) || {
    id: \`\${section.id}-${prefix}-btn\`, type: 'cta-button',
    content: { text: c.ctaText || c.buttonText || ${JSON.stringify(defaultCta)}, href: c.ctaHref || '#' },
    style: { backgroundColor: f.primary, color: '#fff', fontWeight: '800', borderRadius: '9999px', padding: '14px 22px', border: \`2.5px solid \${f.ink}\`, boxShadow: FUNKY.shadow, fontFamily: FUNKY.fonts.display },
  };

  const themeColors = { ...tc, titleColor, textColor, buttonBackgroundColor: f.primary, buttonTextColor: '#fff' };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={\`max-w-7xl mx-auto \${padX} \${padT} \${padB}\`}>
        <div style={{ background: ${cardBg}, border: \`2.5px solid \${f.ink}\`, borderRadius: 24, boxShadow: FUNKY.shadowLg, padding: '36px 28px', textAlign: 'center' }}>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
          <div className="mt-3 max-w-xl mx-auto"><ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} /></div>
          <div className="mt-6 inline-flex"><ElementsSection section={{ ...section, elements: [btnEl] }} {...passThrough} /></div>
        </div>
      </div>
    </div>
  );
};

export default ${exportName};
`
  );
}

function cardsGrid({ file, exportName, prefix, defaultTitle, itemFallback, cardColors }) {
  write(
    file,
    `${HEADER}
export const ${exportName}: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const titleColor = tc?.titleColor || f.ink;
  const textColor = tc?.textColor || f.muted;
  const bg = s.backgroundColor || f.cream;
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const colors = ${JSON.stringify(cardColors)};

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-title\`) || {
    id: \`\${section.id}-${prefix}-title\`, type: 'heading',
    content: { text: c.title || ${JSON.stringify(defaultTitle)}, htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display },
  };

  const items: any[] = Array.isArray(c.items) && c.items.length ? c.items : ${JSON.stringify(itemFallback)};

  const themeColors = { ...tc, titleColor, textColor };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={\`max-w-7xl mx-auto \${padX} \${padT} \${padB}\`}>
        <div className="mb-8"><ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const itemTitle: WebsiteElement = {
              id: \`\${section.id}-${prefix}-item-\${i}-title\`, type: 'heading',
              content: { text: item.title || item.name || 'Item', htmlTag: 'h3' },
              style: { color: f.ink, fontSize: '1.15rem', fontWeight: '800', fontFamily: FUNKY.fonts.display },
            };
            const itemDesc: WebsiteElement = {
              id: \`\${section.id}-${prefix}-item-\${i}-desc\`, type: 'text',
              content: { text: item.description || item.subtitle || item.tag || '' },
              style: { color: textColor, fontFamily: FUNKY.fonts.body },
            };
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ background: colors[i % colors.length], border: \`2.5px solid \${f.ink}\`, borderRadius: 22, boxShadow: FUNKY.shadow, transform: i % 2 ? 'rotate(1.2deg)' : 'rotate(-1.2deg)', overflow: 'hidden', padding: 16 }}>
                {item.image ? <img src={item.image} alt="" className="w-full h-40 object-cover rounded-xl mb-3" style={{ border: \`2px solid \${f.ink}\` }} /> : null}
                <ElementsSection section={{ ...section, elements: [itemTitle] }} {...passThrough} />
                <div className="mt-2"><ElementsSection section={{ ...section, elements: [itemDesc] }} {...passThrough} /></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ${exportName};
`
  );
}

function textBody({ file, exportName, prefix, defaultTitle, defaultBody }) {
  write(
    file,
    `${HEADER}
export const ${exportName}: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const titleColor = tc?.titleColor || f.ink;
  const textColor = tc?.textColor || f.muted;
  const bg = s.backgroundColor || f.cream;
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-title\`) || {
    id: \`\${section.id}-${prefix}-title\`, type: 'heading',
    content: { text: c.title || ${JSON.stringify(defaultTitle)}, htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display },
  };
  const bodyEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-body\`) || {
    id: \`\${section.id}-${prefix}-body\`, type: 'text',
    content: { text: c.body || c.description || c.html || ${JSON.stringify(defaultBody)}, textSize: 'large' },
    style: { color: textColor, lineHeight: '1.7', fontFamily: FUNKY.fonts.body },
  };

  const themeColors = { ...tc, titleColor, textColor };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={\`max-w-3xl mx-auto \${padX} \${padT} \${padB}\`}>
        <div style={{ background: f.white, border: \`2.5px solid \${f.ink}\`, borderRadius: 24, boxShadow: FUNKY.shadow, padding: 28 }}>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
          <div className="mt-4"><ElementsSection section={{ ...section, elements: [bodyEl] }} {...passThrough} /></div>
        </div>
      </div>
    </div>
  );
};

export default ${exportName};
`
  );
}

function faqLike({ file, exportName, prefix }) {
  write(
    file,
    `${HEADER}
export const ${exportName}: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const titleColor = tc?.titleColor || f.ink;
  const textColor = tc?.textColor || f.muted;
  const bg = s.backgroundColor || f.cream;
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const items: any[] = Array.isArray(c.items) && c.items.length ? c.items : [
    { title: 'Is this for beginners?', description: 'Yes — we start simple and level up.' },
    { title: 'Do you cover monetization?', description: 'Affiliate, digital products, and ads angles.' },
  ];

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-title\`) || {
    id: \`\${section.id}-${prefix}-title\`, type: 'heading',
    content: { text: c.title || 'FAQ', htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display },
  };

  const faqEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-faq\`) || {
    id: \`\${section.id}-${prefix}-faq\`, type: 'accordion',
    content: {
      exclusive: true,
      items: items.map((it) => ({
        title: it.title || it.q || it.question || '',
        content: it.description || it.a || it.answer || it.content || '',
      })),
    },
    style: {},
  };

  const themeColors = {
    ...tc, titleColor, textColor,
    accordionQuestionColor: f.ink, accordionAnswerColor: textColor, accordionBackgroundColor: f.white,
  };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={\`max-w-3xl mx-auto \${padX} \${padT} \${padB}\`}>
        <div className="mb-6"><ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} /></div>
        <div style={{ border: \`2.5px solid \${f.ink}\`, borderRadius: 22, boxShadow: FUNKY.shadow, overflow: 'hidden', background: f.white }}>
          <ElementsSection section={{ ...section, elements: [faqEl] }} {...passThrough} />
        </div>
      </div>
    </div>
  );
};

export default ${exportName};
`
  );
}

function newsletterLike({ file, exportName, prefix }) {
  write(
    file,
    `${HEADER}
export const ${exportName}: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const titleColor = tc?.titleColor || f.ink;
  const textColor = tc?.textColor || f.muted;
  const bg = s.backgroundColor || f.cream;
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-title\`) || {
    id: \`\${section.id}-${prefix}-title\`, type: 'heading',
    content: { text: c.title || 'Inbox, but make it spicy', htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display, textAlign: 'center' as any },
  };
  const descEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-desc\`) || {
    id: \`\${section.id}-${prefix}-desc\`, type: 'text',
    content: { text: c.subtitle || 'Weekly niche drops. Zero boring.' },
    style: { color: textColor, textAlign: 'center' as any },
  };
  const formEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-form\`) || {
    id: \`\${section.id}-${prefix}-form\`, type: 'newsletter',
    content: { placeholder: c.placeholder || 'you@email.com', buttonText: c.ctaText || 'Join the list' },
    style: {},
  };

  const themeColors = { ...tc, titleColor, textColor, buttonBackgroundColor: f.ink, buttonTextColor: f.cream };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={\`max-w-2xl mx-auto \${padX} \${padT} \${padB}\`}>
        <div style={{ background: f.accent, border: \`2.5px solid \${f.ink}\`, borderRadius: 24, boxShadow: FUNKY.shadowLg, padding: 32, textAlign: 'center' }}>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
          <div className="mt-2"><ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} /></div>
          <div className="mt-5"><ElementsSection section={{ ...section, elements: [formEl] }} {...passThrough} /></div>
        </div>
      </div>
    </div>
  );
};

export default ${exportName};
`
  );
}

function contactFormLike({ file, exportName, prefix }) {
  write(
    file,
    `${HEADER}
export const ${exportName}: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const f = funkyFromTheme(tc);
  const bg = s.backgroundColor || f.cream;
  const padT = s.paddingTop ?? 'pt-10 sm:pt-14';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-14';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const formEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-${prefix}-form\`) || {
    id: \`\${section.id}-${prefix}-form\`, type: 'contact-form',
    content: content || {},
    style: {},
  };

  const themeColors = { ...tc, buttonBackgroundColor: f.primary, buttonTextColor: '#fff', titleColor: f.ink, textColor: f.muted };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={\`max-w-xl mx-auto \${padX} \${padT} \${padB}\`}>
        <div style={{ background: f.white, border: \`2.5px solid \${f.ink}\`, borderRadius: 24, boxShadow: FUNKY.shadow, padding: 24 }}>
          <ElementsSection section={{ ...section, elements: [formEl] }} {...passThrough} />
        </div>
      </div>
    </div>
  );
};

export default ${exportName};
`
  );
}

// ——— Generate all ———

heroLike({
  file: 'homepage/hero/HeroFunky.tsx',
  exportName: 'HeroFunky',
  prefix: 'cw-hero',
  defaultBadge: 'Pin-worthy ideas',
  defaultTitle: 'Make it cute. Make it yours.',
  defaultSubtitle: 'Fresh niche guides, boards & how-tos that actually convert to saves.',
  bgKey: 'f.cream',
});

cardsGrid({
  file: 'homepage/featuredposts/FeaturedPostsFunky.tsx',
  exportName: 'FeaturedPostsFunky',
  prefix: 'cw-feat',
  defaultTitle: 'Featured & juicy',
  itemFallback: [
    { title: 'Weekend board makeover', description: 'DIY', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80' },
    { title: 'Color combos that slap', description: 'Design', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80' },
    { title: 'Pin titles that get saves', description: 'Growth', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80' },
  ],
  cardColors: ['#FFFFFF', '#FFE566', '#FFF8F0'],
});

cardsGrid({
  file: 'homepage/categoriesgrid/CategoriesGridFunky.tsx',
  exportName: 'CategoriesGridFunky',
  prefix: 'cw-catgrid',
  defaultTitle: 'Browse the vibes',
  itemFallback: [
    { title: 'Home DIY', description: '42 posts' },
    { title: 'Printables', description: '18 posts' },
    { title: 'How-to Guides', description: '31 posts' },
    { title: 'Seasonal', description: '12 posts' },
  ],
  cardColors: ['#C8F542', '#FFB4C8', '#5BDBFF', '#FFE566'],
});

textBody({
  file: 'homepage/aboutteaser/AboutTeaserFunky.tsx',
  exportName: 'AboutTeaserFunky',
  prefix: 'cw-aboutteaser',
  defaultTitle: 'Built for curious makers',
  defaultBody: 'We obsess over niche depth, E-E-A-T authors, and pins that feel human — not factory SEO sludge.',
});

cardsGrid({
  file: 'homepage/authors/AuthorsFunky.tsx',
  exportName: 'AuthorsFunky',
  prefix: 'cw-authors',
  defaultTitle: 'Meet the brains',
  itemFallback: [
    { title: 'Alex Rivera', description: 'Editor · Niche deep-dives', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
    { title: 'Sam Okonkwo', description: 'Creator · Visual storytelling', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  ],
  cardColors: ['#5BDBFF', '#FFFFFF'],
});

newsletterLike({ file: 'homepage/newsletter/NewsletterFunky.tsx', exportName: 'NewsletterFunky', prefix: 'cw-news' });
faqLike({ file: 'homepage/faq/FaqFunky.tsx', exportName: 'FaqFunky', prefix: 'cw-faq' });

cardsGrid({
  file: 'homepage/trendingpins/TrendingPinsFunky.tsx',
  exportName: 'TrendingPinsFunky',
  prefix: 'cw-trend',
  defaultTitle: 'Trending on the board',
  itemFallback: [
    { title: 'Peach kitchen moodboard', description: '12.4k saves' },
    { title: 'Budget shelf glow-up', description: '8.1k saves' },
    { title: 'Sunday reset checklist', description: '6.9k saves' },
  ],
  cardColors: ['#FFE566', '#C8F542', '#5BDBFF'],
});

ctaHeroLike({
  file: 'homepage/pinboardcta/PinBoardCtaFunky.tsx',
  exportName: 'PinBoardCtaFunky',
  prefix: 'cw-pinboard',
  defaultTitle: 'Steal our starter board',
  defaultSubtitle: 'One click → curated niche pins to remix.',
  defaultCta: 'Open board',
  cardBg: 'f.grape',
});

ctaHeroLike({
  file: 'homepage/seasonalspotlight/SeasonalSpotlightFunky.tsx',
  exportName: 'SeasonalSpotlightFunky',
  prefix: 'cw-season',
  defaultTitle: 'Seasonal content sprint',
  defaultSubtitle: 'Ride the trend curve with timely pin packs & article angles.',
  defaultCta: 'See calendar',
  cardBg: 'f.sunshine',
});

// Blog
heroLike({
  file: 'blog/bloghero/BlogHeroFunky.tsx',
  exportName: 'BlogHeroFunky',
  prefix: 'cw-bloghero',
  defaultBadge: 'Blog',
  defaultTitle: 'The archive of awesome',
  defaultSubtitle: 'Guides, lists & pin-ready deep dives.',
  bgKey: 'f.cream',
});

cardsGrid({
  file: 'blog/postgrid/PostGridFunky.tsx',
  exportName: 'PostGridFunky',
  prefix: 'cw-postgrid',
  defaultTitle: 'Latest posts',
  itemFallback: [
    { title: 'How to niche down without dying', description: 'Strategy', image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&q=80' },
    { title: 'Affiliate angles that feel honest', description: 'Money', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80' },
    { title: 'E-E-A-T author bios that rank', description: 'SEO', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80' },
  ],
  cardColors: ['#FFFFFF', '#FFF8F0', '#FFFFFF'],
});

cardsGrid({
  file: 'blog/categoryfilter/CategoryFilterFunky.tsx',
  exportName: 'CategoryFilterFunky',
  prefix: 'cw-catfilter',
  defaultTitle: 'Filter by vibe',
  itemFallback: [
    { title: 'All', description: 'Everything' },
    { title: 'DIY', description: 'Projects' },
    { title: 'Printables', description: 'Downloads' },
    { title: 'Guides', description: 'How-tos' },
  ],
  cardColors: ['#FF4D6D', '#C8F542', '#5BDBFF', '#FFE566'],
});

newsletterLike({ file: 'blog/newsletter/NewsletterFunky.tsx', exportName: 'BlogNewsletterFunky', prefix: 'cw-blognews' });

cardsGrid({
  file: 'blog/popularposts/PopularPostsFunky.tsx',
  exportName: 'PopularPostsFunky',
  prefix: 'cw-popular',
  defaultTitle: 'Reader faves',
  itemFallback: [
    { title: '01 · The 7-pin content pack', description: 'Most saved' },
    { title: '02 · Niche score explained', description: 'Popular' },
    { title: '03 · Author bios that convert', description: 'Trending' },
  ],
  cardColors: ['#FFFFFF', '#FFB4C8', '#C8F542'],
});

// Category
heroLike({
  file: 'category/categoryhero/CategoryHeroFunky.tsx',
  exportName: 'CategoryHeroFunky',
  prefix: 'cw-cathero',
  defaultBadge: 'Category',
  defaultTitle: 'Home DIY',
  defaultSubtitle: 'Hands-on projects with pin-ready visuals.',
  bgKey: 'f.accent',
});

cardsGrid({
  file: 'category/postgrid/PostGridFunky.tsx',
  exportName: 'CategoryPostGridFunky',
  prefix: 'cw-catposts',
  defaultTitle: 'In this category',
  itemFallback: [
    { title: 'Closet glow-up in a weekend', description: 'DIY' },
    { title: 'Paint palettes that pop', description: 'Color' },
    { title: 'Budget thrift finds', description: 'Tips' },
  ],
  cardColors: ['#FFB4C8', '#FFFFFF', '#FFE566'],
});

cardsGrid({
  file: 'category/relatedcategories/RelatedCategoriesFunky.tsx',
  exportName: 'RelatedCategoriesFunky',
  prefix: 'cw-relcat',
  defaultTitle: 'Also explore',
  itemFallback: [
    { title: 'Printables', description: 'Related' },
    { title: 'Seasonal', description: 'Related' },
    { title: 'Organization', description: 'Related' },
  ],
  cardColors: ['#5BDBFF', '#C8F542', '#FFB4C8'],
});

// Article
heroLike({
  file: 'article/articlehero/ArticleHeroFunky.tsx',
  exportName: 'ArticleHeroFunky',
  prefix: 'cw-arthero',
  defaultBadge: 'Article',
  defaultTitle: 'How to build a niche site people actually save',
  defaultSubtitle: 'By Alex Rivera · 8 min read',
  bgKey: 'f.cream',
});

textBody({
  file: 'article/articlebody/ArticleBodyFunky.tsx',
  exportName: 'ArticleBodyFunky',
  prefix: 'cw-artbody',
  defaultTitle: 'On this page',
  defaultBody: 'Start with a sharp niche angle, then build clusters that feed Pinterest demand. Keep E-E-A-T visible — authors, sources, and real examples beat generic filler.',
});

cardsGrid({
  file: 'article/authorbox/AuthorBoxFunky.tsx',
  exportName: 'AuthorBoxFunky',
  prefix: 'cw-authorbox',
  defaultTitle: 'Written by',
  itemFallback: [
    { title: 'Alex Rivera', description: 'Founder & Editor — research-backed niche guides with a visual-first mindset.', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  ],
  cardColors: ['#5BDBFF'],
});

cardsGrid({
  file: 'article/relatedposts/RelatedPostsFunky.tsx',
  exportName: 'RelatedPostsFunky',
  prefix: 'cw-relposts',
  defaultTitle: 'Keep scrolling',
  itemFallback: [
    { title: 'Cluster map template', description: 'Related' },
    { title: 'Pin CTA examples', description: 'Related' },
    { title: 'Seasonal keyword list', description: 'Related' },
  ],
  cardColors: ['#FFB4C8', '#C8F542', '#FFE566'],
});

ctaHeroLike({
  file: 'article/pincta/PinCtaFunky.tsx',
  exportName: 'PinCtaFunky',
  prefix: 'cw-pincta',
  defaultTitle: 'Love this? Pin it.',
  defaultSubtitle: 'Help your future self (and our little site).',
  defaultCta: 'Save to Pinterest',
  cardBg: 'f.primary',
});

faqLike({ file: 'article/faq/FaqFunky.tsx', exportName: 'ArticleFaqFunky', prefix: 'cw-artfaq' });

cardsGrid({
  file: 'article/shopthelook/ShopTheLookFunky.tsx',
  exportName: 'ShopTheLookFunky',
  prefix: 'cw-shop',
  defaultTitle: 'Shop the look',
  itemFallback: [
    { title: 'Clip-on pegboard', description: '$24' },
    { title: 'Pastel washi set', description: '$12' },
    { title: 'Desk lamp glow', description: '$39' },
  ],
  cardColors: ['#FFFFFF', '#FFF8F0', '#FFFFFF'],
});

// About
heroLike({
  file: 'about/abouthero/AboutHeroFunky.tsx',
  exportName: 'AboutHeroFunky',
  prefix: 'cw-abhero',
  defaultBadge: 'About us',
  defaultTitle: 'We make niche sites feel alive',
  defaultSubtitle: 'Content + pins + E-E-A-T — without the beige.',
  bgKey: 'f.cream',
});

textBody({
  file: 'about/brandstory/BrandStoryFunky.tsx',
  exportName: 'BrandStoryFunky',
  prefix: 'cw-brandstory',
  defaultTitle: 'Our origin story',
  defaultBody: 'Started as a pin-obsessed side project. Grew into a quality-first content system for niche publishers.',
});

cardsGrid({
  file: 'about/authors/AuthorsFunky.tsx',
  exportName: 'AboutAuthorsFunky',
  prefix: 'cw-abauthors',
  defaultTitle: 'The crew',
  itemFallback: [
    { title: 'Alex', description: 'Editor' },
    { title: 'Sam', description: 'Designer' },
    { title: 'Jordan', description: 'SEO' },
  ],
  cardColors: ['#C8F542', '#5BDBFF', '#FFB4C8'],
});

ctaHeroLike({
  file: 'about/aboutcta/AboutCtaFunky.tsx',
  exportName: 'AboutCtaFunky',
  prefix: 'cw-abcta',
  defaultTitle: 'Want to collab?',
  defaultSubtitle: 'Partnerships, tips, or just vibes.',
  defaultCta: 'Say hello',
  cardBg: 'f.charcoal',
});

textBody({
  file: 'about/brandvoice/BrandVoiceFunky.tsx',
  exportName: 'BrandVoiceFunky',
  prefix: 'cw-voice',
  defaultTitle: 'Brand voice',
  defaultBody: 'Tone: warm expert · playful · clear. Do: show receipts, talk like a human, lead with visuals. Don’t: keyword spam, fake urgency, generic fluff.',
});

// Contact
heroLike({
  file: 'contact/contacthero/ContactHeroFunky.tsx',
  exportName: 'ContactHeroFunky',
  prefix: 'cw-conhero',
  defaultBadge: 'Contact',
  defaultTitle: 'Slide into our inbox',
  defaultSubtitle: 'Partnerships, tips, or just vibes.',
  bgKey: 'f.cream',
});

contactFormLike({ file: 'contact/contactform/ContactFormFunky.tsx', exportName: 'ContactFormFunky', prefix: 'cw-conform' });

cardsGrid({
  file: 'contact/contactinfo/ContactInfoFunky.tsx',
  exportName: 'ContactInfoFunky',
  prefix: 'cw-coninfo',
  defaultTitle: 'Reach us',
  itemFallback: [
    { title: 'Email', description: 'hello@example.com' },
    { title: 'Pinterest', description: '@yourbrand' },
    { title: 'Instagram', description: '@yourbrand' },
  ],
  cardColors: ['#C8F542', '#5BDBFF', '#FFB4C8'],
});

// Legal
textBody({
  file: 'legal/privacybody/PrivacyBodyFunky.tsx',
  exportName: 'PrivacyBodyFunky',
  prefix: 'cw-privacy',
  defaultTitle: 'Privacy Policy',
  defaultBody: 'Replace with generated legal copy from your blueprint. Funky frame, readable body.',
});
textBody({
  file: 'legal/termsbody/TermsBodyFunky.tsx',
  exportName: 'TermsBodyFunky',
  prefix: 'cw-terms',
  defaultTitle: 'Terms of Use',
  defaultBody: 'Replace with generated terms copy from your blueprint.',
});
textBody({
  file: 'legal/disclaimerbody/DisclaimerBodyFunky.tsx',
  exportName: 'DisclaimerBodyFunky',
  prefix: 'cw-disc',
  defaultTitle: 'Disclaimer',
  defaultBody: 'Affiliate / editorial disclaimer — replace with generated copy.',
});

// Author
heroLike({
  file: 'author/authorhero/AuthorHeroFunky.tsx',
  exportName: 'AuthorHeroFunky',
  prefix: 'cw-authhero',
  defaultBadge: 'Author',
  defaultTitle: 'Alex Rivera',
  defaultSubtitle: 'Editor · Visual niche storytelling',
  bgKey: 'f.cream',
});

textBody({
  file: 'author/authorbio/AuthorBioFunky.tsx',
  exportName: 'AuthorBioFunky',
  prefix: 'cw-authbio',
  defaultTitle: 'Bio',
  defaultBody: 'Alex builds content systems that blend Pinterest demand with honest expertise.',
});

cardsGrid({
  file: 'author/authorposts/AuthorPostsFunky.tsx',
  exportName: 'AuthorPostsFunky',
  prefix: 'cw-authposts',
  defaultTitle: 'From this author',
  itemFallback: [
    { title: 'Pin hooks that convert', description: 'Guide' },
    { title: 'Cluster planning 101', description: 'Strategy' },
    { title: 'Affiliate ethics', description: 'Money' },
  ],
  cardColors: ['#5BDBFF', '#C8F542', '#FFE566'],
});

// Header / Footer — lighter wrappers with editable brand + nav via ElementsSection
write(
  'headerfooter/header/HeaderFunky.tsx',
  `${HEADER}
export const HeaderFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const bg = s.backgroundColor || f.cream;

  const brandEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-cw-hdr-brand\`) || {
    id: \`\${section.id}-cw-hdr-brand\`, type: 'heading',
    content: { text: c.brand || c.siteName || 'NichePop', htmlTag: 'h2' },
    style: { fontFamily: FUNKY.fonts.display, fontWeight: '800', fontSize: '1.4rem', color: f.ink },
  };
  const navEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-cw-hdr-nav\`) || {
    id: \`\${section.id}-cw-hdr-nav\`, type: 'navigation',
    content: { items: c.links || [{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }] },
    style: {},
  };

  const themeColors = { ...tc, titleColor: f.ink, textColor: f.ink };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <header className="w-full sticky top-0 z-40" style={{ backgroundColor: bg, borderBottom: \`2.5px solid \${f.ink}\` }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div style={{ transform: 'rotate(-2deg)' }}><ElementsSection section={{ ...section, elements: [brandEl] }} {...passThrough} /></div>
        <ElementsSection section={{ ...section, elements: [navEl] }} {...passThrough} />
      </div>
    </header>
  );
};

export default HeaderFunky;
`
);

write(
  'headerfooter/footer/FooterFunky.tsx',
  `${HEADER}
export const FooterFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const bg = s.backgroundColor || f.charcoal;

  const brandEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-cw-ftr-brand\`) || {
    id: \`\${section.id}-cw-ftr-brand\`, type: 'heading',
    content: { text: c.brand || 'NichePop', htmlTag: 'h3' },
    style: { fontFamily: FUNKY.fonts.display, fontWeight: '800', fontSize: '1.3rem', color: f.cream },
  };
  const blurbEl: WebsiteElement = section.elements?.find(e => e.id === \`\${section.id}-cw-ftr-blurb\`) || {
    id: \`\${section.id}-cw-ftr-blurb\`, type: 'text',
    content: { text: c.blurb || 'Funky niche content for curious humans.' },
    style: { color: f.cream, opacity: 0.85 },
  };

  const themeColors = { ...tc, titleColor: f.cream, textColor: f.cream };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <footer className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div style={{ border: \`2.5px solid \${f.cream}\`, borderRadius: 22, padding: 28, boxShadow: '6px 6px 0 ' + f.accent }}>
          <ElementsSection section={{ ...section, elements: [brandEl] }} {...passThrough} />
          <div className="mt-2"><ElementsSection section={{ ...section, elements: [blurbEl] }} {...passThrough} /></div>
        </div>
      </div>
    </footer>
  );
};

export default FooterFunky;
`
);

console.log('Done — GenieBuild-compatible content website sections.');
