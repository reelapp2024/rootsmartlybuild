import React, { useMemo } from 'react';
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

      // Prefer nested colored node inside the link
      const nested = a.querySelector('font[color], [style*="color"]') as Element | null;
      const nestedColor = readExplicitColor(nested);
      if (nestedColor) {
        a.style.color = nestedColor;
        return;
      }

      // Then colored parent wrappers (common foreColor result)
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
 * BlogContentDefault — the article body. Light section (tc.light).
 * HTML posts render once as prose (with working links). Plain-text posts keep
 * an editable lead + remaining paragraphs.
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
  // Same cascade as ElementsSection: section → theme linkColor → accent
  const linkColor =
    s.linkColor ||
    lc.linkColor ||
    tc?.linkColor ||
    (tc?.light as any)?.linkColor ||
    accent;

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

  const articleHtml = useMemo(() => {
    const source = resolveBodySource(c) || DEFAULT_BODY;
    return extractBlogBodyHtml(source);
  }, [c?.content, c?.body, c?.html, c?.text]);

  const isHtml = /<[a-z][\s\S]*>/i.test(articleHtml);
  const paragraphs = isHtml
    ? []
    : articleHtml.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  // Plain-text only: first paragraph as editable lead (HTML must not duplicate this).
  const leadEl: WebsiteElement = section.elements?.find((e) => e.id === `${section.id}-bc-lead`) || {
    id: `${section.id}-bc-lead`,
    type: 'text',
    content: { text: paragraphs[0] || '', textSize: 'large' },
    style: { lineHeight: '1.8', textAlign: 'left' as any, fontWeight: '500' },
  };

  const proseScopeId = `blog-prose-${String(section.id || 'body').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

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
              {/*
                Default link color is theme/section-customizable (linkColor).
                Inline style="color:…" on <a> always wins (editor per-link color).
                Colored parents (font/span from foreColor) pass through via inherit.
              */}
              <style>{`
                #${proseScopeId} a {
                  color: ${linkColor};
                  text-decoration: underline;
                  text-underline-offset: 3px;
                  font-weight: 600;
                  cursor: pointer;
                }
                #${proseScopeId} a:hover {
                  opacity: 0.85;
                }
                /* Respect colors from the HTML editor when applied around the link */
                #${proseScopeId} font[color] a,
                #${proseScopeId} [style*="color:"] > a,
                #${proseScopeId} [style*="color :"] > a {
                  color: inherit;
                }
                /* Nested colored nodes inside a link keep their own color */
                #${proseScopeId} a font[color],
                #${proseScopeId} a [style*="color:"],
                #${proseScopeId} a [style*="color :"] {
                  text-decoration: inherit;
                }
                #${proseScopeId} img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 0.75rem;
                }
                #${proseScopeId} h1, #${proseScopeId} h2, #${proseScopeId} h3,
                #${proseScopeId} h4, #${proseScopeId} h5, #${proseScopeId} h6 {
                  color: ${titleColor};
                  font-weight: 700;
                  line-height: 1.3;
                  margin: 1.5em 0 0.6em;
                }
                #${proseScopeId} p { margin: 0 0 1em; }
                #${proseScopeId} ul, #${proseScopeId} ol {
                  margin: 0 0 1em;
                  padding-left: 1.35rem;
                }
                #${proseScopeId} blockquote {
                  margin: 1.25em 0;
                  padding: 0.75em 1em;
                  border-left: 3px solid ${linkColor};
                  opacity: 0.95;
                }
              `}</style>
              <div
                id={proseScopeId}
                className="blog-prose leading-relaxed"
                style={{ color: textColor, fontSize: '1.05rem', lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: articleHtml }}
              />
            </>
          ) : (
            <>
              {paragraphs[0] ? (
                <ElementsSection section={{ ...section, elements: [leadEl] }} {...passThrough} />
              ) : null}
              {paragraphs.slice(1).map((p, i) => (
                <p key={i} style={{ color: textColor, fontSize: '1.05rem', lineHeight: 1.8 }}>
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

export default BlogContentDefault;
