import React, { useMemo } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { enhanceBlogHtmlClient, splitBlogFaqFromHtml } from '../../../../utils/blogHtmlEnhance';

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

const DEFAULT_BODY = `Choosing the right professional can feel overwhelming, but a few simple checks make all the difference. Start by verifying licenses and insurance — this protects you and signals a serious, accountable business.

Next, ask for references and read recent reviews. Look for consistent themes: punctuality, clear communication, and clean workmanship. A great provider will happily explain the scope of work and pricing before starting, so you never face surprise costs.

Finally, trust your instincts. The best providers make you feel informed and respected, not pressured. Take your time, compare a few options, and choose the team that treats your home like their own.`;

/** Pull article markup out of admin full-docs (`<!doctype>…<main id="root">…`). */
function extractBlogBodyHtml(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';

  const stripScripts = (html: string) =>
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .trim();

  let body = s;
  if (/<!doctype|<html[\s>]/i.test(s)) {
    if (typeof DOMParser !== 'undefined') {
      try {
        const doc = new DOMParser().parseFromString(s, 'text/html');
        const root = doc.getElementById('root') || doc.querySelector('main') || doc.body;
        if (root) body = root.innerHTML;
      } catch {
        /* fall through to regex */
      }
    }
    if (body === s) {
      const mainMatch = s.match(/<main\b[^>]*\bid=["']root["'][^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) body = mainMatch[1];
      else {
        const bodyMatch = s.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) body = bodyMatch[1].replace(/<\/?main\b[^>]*>/gi, '');
      }
    }
  }

  return promoteLinkColors(stripScripts(body));
}

/**
 * Move editor foreColor (parent <font>/<span> or nested) onto the <a> as inline
 * style so theme CSS cannot wipe per-link colors.
 */
function promoteLinkColors(html: string): string {
  const raw = String(html || '').trim();
  if (!raw || typeof DOMParser === 'undefined') return raw;
  try {
    const doc = new DOMParser().parseFromString(`<div id="__blog_wrap">${raw}</div>`, 'text/html');
    const wrap = doc.getElementById('__blog_wrap');
    if (!wrap) return raw;

    const readExplicitColor = (el: Element | null): string => {
      if (!el) return '';
      if (el instanceof HTMLElement && el.style?.color) return el.style.color.trim();
      if (el.tagName === 'FONT') return String(el.getAttribute('color') || '').trim();
      return '';
    };

    wrap.querySelectorAll('a[href]').forEach((node) => {
      const a = node as HTMLAnchorElement;
      if (a.style?.color) return;

      const nested = a.querySelector('font[color], [style*="color"]') as Element | null;
      const nestedColor = readExplicitColor(nested);
      if (nestedColor) {
        a.style.color = nestedColor;
        return;
      }

      let p: Element | null = a.parentElement;
      while (p && p !== wrap) {
        const parentColor = readExplicitColor(p);
        if (parentColor) {
          a.style.color = parentColor;
          return;
        }
        p = p.parentElement;
      }
    });

    return wrap.innerHTML;
  } catch {
    return raw;
  }
}

function resolveBodySource(content: any): string {
  if (!content || typeof content !== 'object') return String(content || '');
  const candidates = [content.content, content.body, content.html, content.text];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return '';
}

/**
 * BlogContentDefault — article body themed like WordPress/Wix:
 * site design tokens → .blog-prose / .gb-* classes; editor inline colors still win.
 */
export const BlogContentDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent =
    s.accentColor ||
    lc.accentColor ||
    tc?.accentColor ||
    '#E11D48';
  const titleColor =
    s.titleColor ||
    fb.titleColor ||
    lc.titleColor ||
    tc?.titleColor ||
    '#111827';
  const textColor =
    s.textColor ||
    s.color ||
    fb.textColor ||
    lc.textColor ||
    tc?.textColor ||
    '#374151';
  // Brand link color = site accent (amber/crimson), not generic blue
  const linkColor =
    s.linkColor ||
    accent ||
    lc.linkColor ||
    tc?.linkColor ||
    '#E11D48';

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
  const padT = s.paddingTop    ?? 'pt-16 sm:pt-20 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    linkColor,
    secondaryHeadingColor: accent,
  };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const titleFont =
    String((tc as any)?.titleFontFamily || (tc as any)?.titleFont || '').trim() || 'inherit';
  const bodyFont =
    String((tc as any)?.descriptionFontFamily || (tc as any)?.bodyFont || '').trim() || 'inherit';

  const articleHtml = useMemo(() => {
    const source = resolveBodySource(c) || DEFAULT_BODY;
    const extracted = extractBlogBodyHtml(source);
    return enhanceBlogHtmlClient(extracted);
  }, [c?.content, c?.body, c?.html, c?.text]);

  /** FAQ uses the same accordion element as website / admin FAQ sections. */
  const { htmlWithoutFaq, faqHeading, items: faqItems } = useMemo(
    () => splitBlogFaqFromHtml(articleHtml),
    [articleHtml]
  );

  const bodyHtml = faqItems.length ? htmlWithoutFaq : articleHtml;
  const isHtml = /<[a-z][\s\S]*>/i.test(bodyHtml);
  const paragraphs = isHtml
    ? []
    : bodyHtml.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const faqAccordionEl: WebsiteElement | null = faqItems.length
    ? {
        id: `${section.id}-blog-faq-accordion`,
        type: 'accordion',
        content: {
          items: faqItems.map((it, i) => ({
            title: it.title,
            content: it.content,
            openByDefault: i === 0,
          })),
          exclusive: true,
        } as any,
        style: {
          backgroundColor: bg,
          borderColor: `${accent}33`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '0.875rem',
          padding: '1.25rem 1.5rem',
          itemGap: '0.75rem',
          iconType: 'plus',
          iconPosition: 'right',
          iconShape: 'circle',
          iconSize: '0.875rem',
          iconColor: accent,
          iconBackgroundColor: `${accent}15`,
          titleColor,
          questionFontSize: '1.0625rem',
          questionFontWeight: '700',
          color: textColor,
          answerFontSize: '0.9375rem',
          answerLineHeight: '1.65',
          activeBackgroundColor: bg,
          activeBorderColor: `${accent}33`,
          hoverBackgroundColor: '',
          dividerColor: `${accent}22`,
        } as any,
      }
    : null;

  const leadEl: WebsiteElement = section.elements?.find((e) => e.id === `${section.id}-bc-lead`) || {
    id: `${section.id}-bc-lead`,
    type: 'text',
    content: { text: paragraphs[0] || '', textSize: 'large' },
    style: { lineHeight: '1.8', textAlign: 'left' as any, fontWeight: '500' },
  };

  const proseScopeId = `blog-prose-${String(section.id || 'body').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  /** Force theme tokens on the article node so blogs never render as plain B&W HTML. */
  const proseCssVars = {
    ['--blog-title-color' as any]: titleColor,
    ['--blog-text-color' as any]: textColor,
    ['--blog-link-color' as any]: linkColor,
    ['--blog-accent-color' as any]: accent,
    ['--blog-muted-color' as any]: (tc as any)?.mutedColor || (tc as any)?.light?.textColorMuted || '#6B7280',
    ['--blog-surface-color' as any]: bg,
    ['--blog-title-font' as any]: titleFont,
    ['--blog-body-font' as any]: bodyFont,
    color: textColor,
    fontFamily: bodyFont,
  } as React.CSSProperties;

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          {isHtml ? (
            <>
              <style>{`
                #${proseScopeId} {
                  color: ${textColor};
                  font-family: ${bodyFont};
                  font-size: var(--text-size-base, 1rem);
                  line-height: 1.8;
                }
                #${proseScopeId} a,
                #${proseScopeId} .gb-link {
                  color: ${linkColor};
                  text-decoration: underline;
                  text-underline-offset: 3px;
                  font-weight: 600;
                  cursor: pointer;
                }
                #${proseScopeId} a:hover,
                #${proseScopeId} .gb-link:hover { opacity: 0.85; }
                #${proseScopeId} font[color] a,
                #${proseScopeId} [style*="color:"] > a,
                #${proseScopeId} [style*="color :"] > a,
                #${proseScopeId} [data-gb-color-override="1"] > a { color: inherit; }
                /* Theme defaults lose to manual inline colors/fonts from the admin editor */
                #${proseScopeId} h1[style*="color"],
                #${proseScopeId} h2[style*="color"],
                #${proseScopeId} h3[style*="color"],
                #${proseScopeId} h4[style*="color"],
                #${proseScopeId} p[style*="color"],
                #${proseScopeId} [data-gb-color-override="1"],
                #${proseScopeId} [style*="font-family"],
                #${proseScopeId} [data-gb-font-override="1"] {
                  /* inline style on the element wins over rules above */
                }
                #${proseScopeId} [data-gb-color-override="1"] {
                  border-left-color: currentColor;
                }
                #${proseScopeId} img,
                #${proseScopeId} .gb-img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 0.75rem;
                }
                #${proseScopeId} h1, #${proseScopeId} h2,
                #${proseScopeId} .gb-h1, #${proseScopeId} .gb-h2 {
                  color: ${titleColor};
                  font-family: ${titleFont};
                  font-weight: 700;
                  line-height: 1.3;
                  margin: 1.65em 0 0.65em;
                  border-left: 4px solid ${accent};
                  padding-left: 0.85rem;
                }
                #${proseScopeId} h1, #${proseScopeId} .gb-h1 { font-size: var(--heading-h1-size, 2.25rem); }
                #${proseScopeId} h2, #${proseScopeId} .gb-h2 { font-size: var(--heading-h2-size, 1.75rem); }
                #${proseScopeId} h3, #${proseScopeId} .gb-h3 {
                  color: ${accent};
                  font-family: ${titleFont};
                  font-weight: 700;
                  line-height: 1.35;
                  margin: 1.25em 0 0.5em;
                  font-size: var(--heading-h3-size, 1.375rem);
                }
                #${proseScopeId} h4, #${proseScopeId} h5, #${proseScopeId} h6,
                #${proseScopeId} .gb-h4, #${proseScopeId} .gb-h5, #${proseScopeId} .gb-h6 {
                  color: ${titleColor};
                  font-family: ${titleFont};
                  font-weight: 700;
                  margin: 1.25em 0 0.5em;
                }
                #${proseScopeId} p,
                #${proseScopeId} .gb-p {
                  margin: 0 0 1em;
                  color: ${textColor};
                  font-family: ${bodyFont};
                }
                #${proseScopeId} ul, #${proseScopeId} ol,
                #${proseScopeId} .gb-ul, #${proseScopeId} .gb-ol {
                  margin: 0 0 1em;
                  padding-left: 1.35rem;
                  color: ${textColor};
                }
                #${proseScopeId} li::marker { color: ${accent}; }
                #${proseScopeId} blockquote,
                #${proseScopeId} .gb-quote {
                  margin: 1.25em 0;
                  padding: 0.85em 1.1em;
                  border-left: 4px solid ${accent};
                  background: color-mix(in srgb, ${accent} 8%, ${bg});
                  color: ${textColor};
                  font-style: italic;
                  border-radius: 0 0.65rem 0.65rem 0;
                }
                #${proseScopeId} strong,
                #${proseScopeId} .gb-strong {
                  color: ${titleColor};
                  font-weight: 700;
                }
                #${proseScopeId} .gb-faq,
                #${proseScopeId} details.gb-faq {
                  display: block;
                  margin: 0 0 0.75rem;
                  padding: 0;
                  border: 1px solid color-mix(in srgb, ${accent} 20%, transparent);
                  border-radius: 0.875rem;
                  background: ${bg};
                  box-shadow: none;
                  overflow: hidden;
                }
                #${proseScopeId} details.gb-faq:last-child { margin-bottom: 0; }
                #${proseScopeId} details.gb-faq > summary,
                #${proseScopeId} summary.gb-faq-q {
                  cursor: pointer;
                  list-style: none;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 0.75rem;
                  padding: 1.25rem 1.5rem;
                  margin: 0;
                  color: ${titleColor};
                  font-family: ${titleFont};
                  font-weight: 700;
                  font-size: 1.0625rem;
                  line-height: 1.4;
                  text-align: left;
                  user-select: none;
                  background: transparent;
                  border: none;
                }
                #${proseScopeId} details.gb-faq > summary::-webkit-details-marker,
                #${proseScopeId} summary::-webkit-details-marker { display: none; }
                #${proseScopeId} details.gb-faq > summary::after {
                  content: "+";
                  box-sizing: border-box;
                  width: 2rem;
                  height: 2rem;
                  border-radius: 9999px;
                  background: color-mix(in srgb, ${accent} 8%, transparent);
                  color: ${accent};
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 0.875rem;
                  font-weight: 700;
                  line-height: 1;
                  flex-shrink: 0;
                  transform: none;
                }
                #${proseScopeId} details.gb-faq[open] > summary {
                  background: transparent;
                  border-bottom: none;
                }
                #${proseScopeId} details.gb-faq[open] > summary::after {
                  content: "\\2212";
                  transform: none;
                }
                #${proseScopeId} details.gb-faq > .gb-faq-a,
                #${proseScopeId} .gb-faq-a {
                  padding: 1.25rem 1.5rem;
                  border-top: 1px solid color-mix(in srgb, ${accent} 13%, transparent);
                  color: ${textColor};
                  font-family: ${bodyFont};
                  font-size: 0.9375rem;
                  line-height: 1.65;
                }
                #${proseScopeId} .gb-faq .gb-faq-q,
                #${proseScopeId} .gb-faq h3 {
                  margin-top: 0;
                  color: ${titleColor};
                  font-size: 1.0625rem;
                }
                #${proseScopeId} .gb-faq p,
                #${proseScopeId} .gb-faq-a p { margin-bottom: 0.65em; }
                #${proseScopeId} .gb-faq-a p:last-child { margin-bottom: 0; }
              `}</style>
              <div
                id={proseScopeId}
                className="blog-prose leading-relaxed"
                style={proseCssVars}
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
              {faqAccordionEl ? (
                <div className="mt-10 sm:mt-12 space-y-5">
                  <h2
                    className="gb-h2 gb-el"
                    style={{
                      color: titleColor,
                      fontFamily: titleFont,
                      fontWeight: 700,
                      fontSize: 'var(--heading-h2-size, 1.75rem)',
                      lineHeight: 1.3,
                      margin: '0 0 0.25rem',
                      borderLeft: `4px solid ${accent}`,
                      paddingLeft: '0.85rem',
                    }}
                  >
                    {faqHeading || 'FAQ'}
                  </h2>
                  <ElementsSection
                    section={{ ...section, elements: [faqAccordionEl] }}
                    {...passThrough}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <>
              {paragraphs[0] ? (
                <ElementsSection section={{ ...section, elements: [leadEl] }} {...passThrough} />
              ) : null}
              {paragraphs.slice(1).map((p, i) => (
                <p
                  key={i}
                  className="gb-p gb-el"
                  style={{ color: textColor, fontSize: '1.05rem', lineHeight: 1.8, fontFamily: bodyFont }}
                >
                  {p}
                </p>
              ))}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
