import React, { useEffect, useState } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  withFunkyTextStyle,
  resolveFunkyIsLight,
  funkySurfaceColors
} from '../../funkyTheme';
import { fetchBlogAuthor } from '../../../../lib/authorApi';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: Partial<WebsiteElement>) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  projectId?: string;
}

/**
 * Single author card — same Author collection as business blogs.
 * Live hydrate via /get_blog_author when authorId / blogId present.
 */
export const AuthorBoxFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc, projectId,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } = funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const bg = surface.bg;
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const seedName = c.name || c.items?.[0]?.title || c.items?.[0]?.name || 'Blake';
  const seedJob = c.jobTitle || c.items?.[0]?.role || 'Blogger & Creative Designer';
  const seedBio =
    c.bio ||
    c.items?.[0]?.description ||
    'Hey, I’m a writer and creative designer sharing practical guides and authentic niche insights.';
  const seedImage = c.image || c.items?.[0]?.image || '';

  const [live, setLive] = useState({
    name: seedName,
    jobTitle: seedJob,
    bio: seedBio,
    image: seedImage,
  });

  useEffect(() => {
    if (!readOnly) return;
    const authorId = String(c.authorId || c.contentRef?.authorId || '').trim();
    const blogId = String(c.blogId || c.contentRef?.blogId || '').trim();
    const slug = String(c.slug || c.contentRef?.slug || '').trim();
    if (!authorId && !blogId && !(projectId && slug)) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBlogAuthor(
          authorId
            ? { authorId }
            : blogId
              ? { blogId }
              : { projectId: projectId || '', slug }
        );
        if (cancelled || !data) return;
        setLive({
          name: data.name || seedName,
          jobTitle: data.jobTitle || seedJob,
          bio: data.bio || seedBio,
          image: data.image || data.avatar || seedImage,
        });
      } catch {
        /* keep seed */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [readOnly, c.authorId, c.blogId, c.slug, projectId, seedName, seedJob, seedBio, seedImage]);

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-authorbox-title`) || {
    id: `${section.id}-cw-authorbox-title`, type: 'heading',
    content: { text: c.title || 'Written by', htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display },
  };
  const titleElPainted: WebsiteElement = { ...titleEl, style: { ...withFunkyTextStyle(titleEl.style as any, titleColor, isLight) } };

  const themeColors = { ...tc, ...funkyThemeBag, titleColor, textColor };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={`max-w-3xl mx-auto ${padX} ${padT} ${padB}`}>
        <div className="mb-5">
          <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [titleElPainted] }} {...passThrough} />
        </div>
        <div
          style={{
            background: surface.cardAlts?.[0] || f.cream || '#FFF8F0',
            border: `2.5px solid ${f.ink}`,
            borderRadius: 22,
            boxShadow: FUNKY.shadow,
            padding: 20,
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          {live.image ? (
            <img
              src={live.image}
              alt=""
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              style={{ border: `2px solid ${f.ink}` }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ border: `2px solid ${f.ink}`, background: f.accent, color: f.ink }}
            >
              {String(live.name || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p style={{ color: titleColor, fontFamily: FUNKY.fonts.display, fontWeight: 800, fontSize: '1.15rem' }}>
              {live.name}
            </p>
            <p style={{ color: textColor, opacity: 0.75, fontSize: '0.9rem', marginTop: 2 }}>
              {live.jobTitle}
            </p>
            <p style={{ color: textColor, fontFamily: FUNKY.fonts.body, marginTop: 10, lineHeight: 1.6, fontSize: '0.95rem' }}>
              {live.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorBoxFunky;
