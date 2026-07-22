import React, { useEffect, useMemo, useState } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { toAbsoluteMediaUrl, extractMediaUrl } from '../../../../config';
import {
  authorIconClassName,
  coerceAuthorLinks,
  fetchBlogAuthor,
  iconForAuthorLabel,
  type BlogAuthorLink,
} from '../../../../lib/authorApi';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  projectId?: string;
}

/**
 * BlogAuthorDefault — author bio from Author collection.
 * Links always come from DB (section payload + live get_blog_author refresh)
 * so every admin-saved social / custom link appears — not a truncated subset.
 */
export const BlogAuthorDefault: React.FC<Props> = ({
  section,
  onTextEdit,
  buttonClass,
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false,
  themeColors: tc,
  projectId,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor = fb.textColor || lc.textColor || '#4B5563';
  const cardBg = fb.background || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border || lc.cardBorderColor || 'rgba(0,0,0,0.08)';

  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some((t) => {
      const dark = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  const bg = isThemeSurface ? '#F8FAFC' : savedBg;

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop ?? 'pt-8 sm:pt-10';
  const padB = s.paddingBottom ?? 'pb-8 sm:pb-10';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const authorId = String(c.authorId || c.contentRef?.authorId || '').trim();
  const blogId = String(c.blogId || c.contentRef?.blogId || '').trim();
  const seededLinks = useMemo(() => coerceAuthorLinks(c.links), [c.links]);

  const [liveLinks, setLiveLinks] = useState<BlogAuthorLink[] | null>(null);
  const [liveMeta, setLiveMeta] = useState<{
    name?: string;
    jobTitle?: string;
    bio?: string;
    image?: string;
  } | null>(null);

  // Live refresh — guarantees ALL DB links (not a stale/partial section payload)
  useEffect(() => {
    if (!authorId && !blogId) {
      setLiveLinks(null);
      setLiveMeta(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const fresh = await fetchBlogAuthor({
        authorId: authorId || undefined,
        blogId: blogId || undefined,
        projectId: projectId || undefined,
      });
      if (cancelled || !fresh) return;
      const links = coerceAuthorLinks(fresh.links);
      // Prefer longer list from API (never shrink what we already have unless API is richer/equal)
      setLiveLinks(links);
      setLiveMeta({
        name: fresh.name,
        jobTitle: fresh.jobTitle,
        bio: fresh.bio,
        image: fresh.image || fresh.avatar,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [authorId, blogId, projectId]);

  const hasLiveAuthor = Boolean(
    authorId ||
      blogId ||
      String(c.name || c.authorName || liveMeta?.name || c.image || c.avatar || '').trim()
  );

  const name = String(
    liveMeta?.name || c.name || c.authorName || (hasLiveAuthor ? '' : 'Jane Doe')
  );
  const role = String(
    liveMeta?.jobTitle || c.jobTitle || c.role || (hasLiveAuthor ? '' : 'Senior Content Writer')
  );
  const bio = String(
    liveMeta?.bio ||
      c.bio ||
      (hasLiveAuthor
        ? ''
        : 'Jane has over 10 years of hands-on industry experience and loves sharing practical tips that help homeowners make confident decisions.')
  );
  const avatarRaw =
    extractMediaUrl(liveMeta?.image) ||
    extractMediaUrl(c.image) ||
    extractMediaUrl(c.avatar);
  const avatar =
    toAbsoluteMediaUrl(avatarRaw) || (hasLiveAuthor ? '' : 'https://i.pravatar.cc/160?img=47');

  const links = useMemo(() => {
    // Prefer live DB set; fall back to section payload; never invent fake # links on live authors
    const primary = liveLinks && liveLinks.length ? liveLinks : seededLinks;
    if (primary.length) {
      return primary.map((l) => ({
        ...l,
        icon: iconForAuthorLabel(l.label),
      }));
    }
    if (hasLiveAuthor) return [];
    return [
      { label: 'Twitter', url: 'https://twitter.com', icon: 'fa-x-twitter' },
      { label: 'LinkedIn', url: 'https://linkedin.com', icon: 'fa-linkedin-in' },
    ];
  }, [liveLinks, seededLinks, hasLiveAuthor]);

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
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

  const nameEl: WebsiteElement = section.elements?.find((e) => e.id === `${section.id}-au-name`) || {
    id: `${section.id}-au-name`,
    type: 'heading',
    content: { text: name, htmlTag: 'h3' },
    style: { fontWeight: '800', fontSize: '1.25rem', textAlign: 'left' as any },
  };
  const nameElResolved: WebsiteElement = {
    ...nameEl,
    content: { ...(nameEl.content || {}), text: name },
  };

  const roleEl: WebsiteElement = section.elements?.find((e) => e.id === `${section.id}-au-role`) || {
    id: `${section.id}-au-role`,
    type: 'text',
    content: { text: role, textSize: 'base' },
    style: { color: accent, fontWeight: '600', fontSize: '0.85rem', textAlign: 'left' as any },
  };
  const roleElResolved: WebsiteElement = {
    ...roleEl,
    content: { ...(roleEl.content || {}), text: role },
  };

  const bioEl: WebsiteElement = section.elements?.find((e) => e.id === `${section.id}-au-bio`) || {
    id: `${section.id}-au-bio`,
    type: 'text',
    content: { text: bio, textSize: 'base' },
    style: { lineHeight: '1.6', textAlign: 'left' as any },
  };
  const bioElResolved: WebsiteElement = {
    ...bioEl,
    content: { ...(bioEl.content || {}), text: bio },
  };

  if (hasLiveAuthor && !name && !bio && !avatar) {
    return null;
  }

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left"
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: `0 10px 30px -20px ${accent}30`,
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name || 'Author'}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
              style={{ border: `2px solid ${accent}33` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold"
              style={{ backgroundColor: `${accent}18`, color: accent, border: `2px solid ${accent}33` }}
              aria-hidden="true"
            >
              {(name || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-1.5 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
              Written by
            </span>
            <ElementsSection section={{ ...section, elements: [nameElResolved] }} {...passThrough} />
            {role ? (
              <ElementsSection section={{ ...section, elements: [roleElResolved] }} {...passThrough} />
            ) : null}
            {bio ? (
              <ElementsSection section={{ ...section, elements: [bioElResolved] }} {...passThrough} />
            ) : null}
            {links.length > 0 ? (
              <div className="flex items-center gap-2 justify-center sm:justify-start pt-2 flex-wrap">
                {links.map((l, i) => (
                  <a
                    key={`${l.label}-${l.url}-${i}`}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: `${accent}12`, color: accent }}
                    title={l.label}
                    aria-label={l.label}
                  >
                    <i className={authorIconClassName(l.icon || iconForAuthorLabel(l.label))} aria-hidden="true" />
                    <span className="max-w-[9rem] truncate">{l.label}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogAuthorDefault;
