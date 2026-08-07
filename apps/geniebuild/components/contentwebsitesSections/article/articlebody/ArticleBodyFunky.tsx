import React, { useMemo } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  resolveFunkyIsLight,
  funkySurfaceColors, resolveFunkySectionChrome } from '../../funkyTheme';
import { resolveSectionElement } from '../../../../elements';

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

/**
 * Article body for content sites.
 * Future-proof path: Blog.content HTML (CMS) is the source of truth.
 * Supports TOC, numbered listicles, comparison tables (.article-table), Also See.
 */
export const ArticleBodyFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc }) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } = funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const bg = surface.bg;
  const { wrapperStyle, overlayStyle } = resolveFunkySectionChrome(styles, isLight);
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const html = String(c.html || c.bodyHtml || c.content || '').trim();
  const tocTitle = c.tableOfContentsTitle || c.tocTitle || 'Table of Contents';
  const toc: Array<{ id?: string; label?: string; href?: string }> = Array.isArray(c.toc)
    ? c.toc
    : [];

  const titleEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cw-artbody-title`, type: 'heading',
    content: { text: c.title || (toc.length || html.includes('article-toc') ? tocTitle : 'On this page'), htmlTag: 'h2' },
    style: { fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display } });
  const plainFallback =
    c.body ||
    c.description ||
    'Start with a sharp niche angle, then build clusters that feed Pinterest demand. Keep E-E-A-T visible — authors, sources, and real examples beat generic filler.';

  const proseCss = useMemo(
    () => `
      .cw-article-prose { color: ${textColor}; font-family: ${FUNKY.fonts.body}; line-height: 1.75; font-size: 1.05rem; }
      .cw-article-prose h2 { color: ${titleColor}; font-family: ${FUNKY.fonts.display}; font-weight: 800; font-size: 1.35rem; margin: 1.75rem 0 0.75rem; scroll-margin-top: 5rem; }
      .cw-article-prose h3 { color: ${titleColor}; font-family: ${FUNKY.fonts.display}; font-weight: 700; font-size: 1.15rem; margin: 1.4rem 0 0.6rem; }
      .cw-article-prose p { margin: 0 0 1rem; }
      .cw-article-prose a { color: ${f.primary || f.accent}; text-decoration: underline; }
      .cw-article-prose .also-see { margin: 1rem 0 1.5rem; padding: 0.75rem 1rem; border-left: 3px solid ${f.accent}; background: ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.06)'}; }
      .cw-article-prose .article-toc { margin: 0 0 1.5rem; padding: 1rem 1.15rem; border: 2px solid ${f.ink}; border-radius: 16px; background: ${isLight ? f.cream || '#FFF8F0' : 'rgba(255,255,255,0.04)'}; }
      .cw-article-prose .article-toc ol { margin: 0.5rem 0 0; padding-left: 1.25rem; }
      .cw-article-prose .article-toc a { text-decoration: none; font-weight: 600; }
      .cw-article-prose table.article-table, .cw-article-prose table { width: 100%; border-collapse: collapse; margin: 1.25rem 0 1.5rem; font-size: 0.95rem; }
      .cw-article-prose table th, .cw-article-prose table td { border: 1.5px solid ${f.ink}; padding: 0.65rem 0.75rem; vertical-align: top; }
      .cw-article-prose table th { background: ${f.accent}33; font-weight: 700; }
      .cw-article-prose figure { margin: 1.25rem 0; }
      .cw-article-prose figcaption { font-size: 0.85rem; opacity: 0.75; margin-top: 0.4rem; }
      .cw-article-prose aside.related-card { margin: 1.25rem 0; padding: 1rem; border: 2px dashed ${f.ink}; border-radius: 14px; }
    `,
    [textColor, titleColor, f, isLight]
  );

  const themeColors = { ...tc, ...funkyThemeBag, titleColor, textColor };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors } as const;

  return (
    <div className="w-full" style={{ ...wrapperStyle }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      {overlayStyle ? (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={overlayStyle} />
      ) : null}
      <style dangerouslySetInnerHTML={{ __html: proseCss }} />
      <div className={`max-w-3xl mx-auto ${padX} ${padT} ${padB}`}>
        <div style={{ background: f.white || surface.card || '#fff', border: `2.5px solid ${f.ink}`, borderRadius: 24, boxShadow: FUNKY.shadow, padding: 28 }}>
          {!html && toc.length > 0 && (
            <>
              <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [titleEl] }} {...passThrough} />
              <ol className="mt-3 space-y-1 list-decimal pl-5" style={{ color: textColor }}>
                {toc.map((item, i) => (
                  <li key={i}>
                    <a href={`#${item.id || item.href || ''}`} style={{ color: f.primary || f.accent }}>
                      {item.label || `Item ${i + 1}`}
                    </a>
                  </li>
                ))}
              </ol>
            </>
          )}

          {html ? (
            <div
              className="cw-article-prose"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="mt-4">
              <ElementsSection
                section={{
                  ...section,
                  styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor },
                  elements: [{
                    id: `${section.id}-cw-artbody-body`,
                    type: 'text',
                    content: { text: plainFallback, textSize: 'large' },
                    style: { lineHeight: '1.7', fontFamily: FUNKY.fonts.body } }] }}
                {...passThrough}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleBodyFunky;
