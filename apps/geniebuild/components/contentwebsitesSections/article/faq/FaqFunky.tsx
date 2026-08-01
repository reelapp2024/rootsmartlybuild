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
  funkySurfaceColors
} from '../../funkyTheme';

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

export const ArticleFaqFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } = funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const accent = tc?.iconColor || tc?.accentColor || f.primary;
  const bg = surface.bg;
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const items: any[] = Array.isArray(c.items) && c.items.length ? c.items : [
    { title: 'Is this for beginners?', description: 'Yes — we start simple and level up.' },
    { title: 'Do you cover monetization?', description: 'Affiliate, digital products, and ads angles.' },
  ];

  const titleEl = mergeFunkyElement(section, `${section.id}-cw-artfaq-title`, {
    id: `${section.id}-cw-artfaq-title`, type: 'heading',
    content: { text: c.title || 'FAQ', htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display },
  });
  const titleElPainted: WebsiteElement = {
    ...titleEl,
    style: { ...withFunkyTextStyle(titleEl.style as any, titleColor, isLight) },
  };

  const faqEl = mergeFunkyElement(section, `${section.id}-cw-artfaq-faq`, {
    id: `${section.id}-cw-artfaq-faq`, type: 'accordion',
    content: {
      exclusive: true,
      items: items.map((it) => ({
        title: it.title || it.q || it.question || '',
        content: it.description || it.a || it.answer || it.content || '',
      })),
    },
    style: {
      backgroundColor: surface.card,
      borderColor: 'transparent',
      borderWidth: '0',
      borderRadius: '0',
      padding: '1.1rem 1.25rem',
      itemGap: '0',
      iconType: 'plus',
      iconPosition: 'right',
      iconShape: 'circle',
      iconColor: accent,
      iconBackgroundColor: `${accent}18`,
      questionFontSize: '1.05rem',
      questionFontWeight: '700',
      answerFontSize: '0.95rem',
      answerLineHeight: '1.65',
      titleColor,
      color: textColor,
    } as any,
  });
  const faqElPainted: WebsiteElement = {
    ...faqEl,
    style: {
      ...(faqEl.style as any),
      backgroundColor: surface.card,
      titleColor: withFunkyTextStyle(
        { color: (faqEl.style as any)?.titleColor },
        titleColor,
        isLight
      ).color as string,
      color: withFunkyTextStyle(faqEl.style as any, textColor, isLight).color as string,
    },
  };

  const themeColors = {
    ...tc,
    ...funkyThemeBag,
    titleColor,
    textColor,
    accordionQuestionColor: titleColor,
    accordionAnswerColor: textColor,
    accordionBackgroundColor: f.white,
  };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;
  const lightStyles = {
    ...(section.styles || {}),
    themeMode: funkyThemeMode as any,
    titleColor,
    textColor,
    accordionQuestionColor: titleColor,
    accordionAnswerColor: textColor,
  };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={`max-w-3xl mx-auto ${padX} ${padT} ${padB}`}>
        <div className="mb-6">
          <ElementsSection section={{ ...section, styles: lightStyles, elements: [titleElPainted] }} {...passThrough} />
        </div>
        <div style={{ border: `2.5px solid ${f.ink}`, borderRadius: 22, boxShadow: FUNKY.shadow, overflow: 'hidden', background: f.white }}>
          <ElementsSection section={{ ...section, styles: lightStyles, elements: [faqElPainted] }} {...passThrough} />
        </div>
      </div>
    </div>
  );
};

export default ArticleFaqFunky;
