import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  mergeFunkyElement,
  withFunkyTextStyle,
  resolveFunkyIsLight,
  funkySurfaceColors,
} from '../../funkyTheme';
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

type DocSection = { heading: string; bodyHtml: string };

function normalizeDocSections(c: any): DocSection[] {
  if (Array.isArray(c?.sections) && c.sections.length) {
    return c.sections
      .map((x: any) => ({
        heading: String(x?.heading || x?.title || '').trim(),
        bodyHtml: String(x?.bodyHtml || x?.body || x?.description || '').trim(),
      }))
      .filter((x: DocSection) => x.heading || x.bodyHtml);
  }
  const flat = String(c?.body || c?.html || c?.description || '').trim();
  if (flat) return [{ heading: '', bodyHtml: flat }];
  return [];
}

export const TermsBodyFunky: React.FC<Props> = ({
  section,
  onTextEdit,
  buttonClass,
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false,
  themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const live = Boolean(readOnly);
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } =
    funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const bg = surface.bg;
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const docSections = normalizeDocSections(c);
  const lastUpdated = String(c.lastUpdatedLabel || c.lastUpdated || '').trim();

  const titleEl = mergeFunkyElement(
    section,
    `${section.id}-cw-terms-title`,
    {
      id: `${section.id}-cw-terms-title`,
      type: 'heading',
      content: { text: c.title || 'Terms of Use', htmlTag: 'h1' },
      style: {
        color: titleColor,
        fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
        fontWeight: '800',
        fontFamily: FUNKY.fonts.display,
      },
    },
    { preferFallbackText: live }
  );
  const titleElPainted: WebsiteElement = {
    ...titleEl,
    style: { ...withFunkyTextStyle(titleEl.style as any, titleColor, isLight) },
  };

  const subtitleEl = mergeFunkyElement(
    section,
    `${section.id}-cw-terms-sub`,
    {
      id: `${section.id}-cw-terms-sub`,
      type: 'text',
      content: {
        text: c.subtitle || 'Please review these terms before using this website.',
      },
      style: {
        color: textColor,
        fontFamily: FUNKY.fonts.body,
        lineHeight: '1.65',
        marginTop: '0.5rem',
      },
    },
    { preferFallbackText: live }
  );
  const subtitleElPainted: WebsiteElement = {
    ...subtitleEl,
    style: { ...withFunkyTextStyle(subtitleEl.style as any, textColor, isLight) },
  };

  const themeColors = { ...tc, ...funkyThemeBag, titleColor, textColor };
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
  const lightStyles = {
    ...(section.styles || {}),
    themeMode: funkyThemeMode as any,
    titleColor,
    textColor,
  };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={`max-w-3xl mx-auto ${padX} ${padT} ${padB}`}>
        <div
          style={{
            background: f.white,
            border: `2.5px solid ${f.ink}`,
            borderRadius: 24,
            boxShadow: FUNKY.shadow,
            padding: 28,
          }}
        >
          <ElementsSection
            section={{ ...section, styles: lightStyles, elements: [titleElPainted] }}
            {...passThrough}
          />
          <div className="mt-2">
            <ElementsSection
              section={{ ...section, styles: lightStyles, elements: [subtitleElPainted] }}
              {...passThrough}
            />
          </div>
          {lastUpdated ? (
            <p
              className="mt-3 text-sm font-semibold"
              style={{ color: textColor, fontFamily: FUNKY.fonts.body, opacity: 0.8 }}
            >
              {lastUpdated}
            </p>
          ) : null}

          <div className="mt-8 space-y-8">
            {docSections.length ? (
              docSections.map((sec, i) => {
                const headingEl = mergeFunkyElement(
                  section,
                  `${section.id}-cw-terms-h${i}`,
                  {
                    id: `${section.id}-cw-terms-h${i}`,
                    type: 'heading',
                    content: { text: sec.heading || `Section ${i + 1}`, htmlTag: 'h2' },
                    style: {
                      color: titleColor,
                      fontSize: '1.25rem',
                      fontWeight: '800',
                      fontFamily: FUNKY.fonts.display,
                    },
                  },
                  { preferFallbackText: live }
                );
                const headingPainted: WebsiteElement = {
                  ...headingEl,
                  style: {
                    ...withFunkyTextStyle(headingEl.style as any, titleColor, isLight),
                  },
                };
                const isHtml = /<[a-z][\s\S]*>/i.test(sec.bodyHtml);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-3"
                  >
                    {sec.heading ? (
                      <ElementsSection
                        section={{
                          ...section,
                          styles: lightStyles,
                          elements: [headingPainted],
                        }}
                        {...passThrough}
                      />
                    ) : null}
                    {isHtml ? (
                      <div
                        className="legal-prose"
                        style={{
                          color: textColor,
                          fontSize: '1rem',
                          lineHeight: 1.75,
                          fontFamily: FUNKY.fonts.body,
                        }}
                        dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
                      />
                    ) : (
                      <p
                        style={{
                          color: textColor,
                          fontSize: '1rem',
                          lineHeight: 1.75,
                          fontFamily: FUNKY.fonts.body,
                        }}
                      >
                        {sec.bodyHtml}
                      </p>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <p style={{ color: textColor, fontFamily: FUNKY.fonts.body, lineHeight: 1.7 }}>
                Terms content is generating. Refresh after section generation finishes.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsBodyFunky;
