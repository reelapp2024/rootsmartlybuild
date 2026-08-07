import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { fetchBlogReviews, submitBlogReview, type BlogReviewComment } from '../../../../lib/reviewsApi';
import { resolveSectionBackground } from '../../../../utils/sectionBackground';
import { elementFromExistingOrDna } from '../../../../elements';

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

const DEFAULT_COMMENTS: BlogReviewComment[] = [
  {
    name: 'Michael R.',
    avatar: '',
    date: '2 days ago',
    text: 'Really helpful article — the point about verifying insurance saved me from a bad decision. Thank you!',
    rating: 5,
  },
  {
    name: 'Sarah L.',
    avatar: '',
    date: '5 days ago',
    text: 'Great read. I always forget to ask for references. Bookmarking this for next time.',
    rating: 4,
  },
];

/**
 * BlogCommentsDefault — live “Join the Conversation” reviews.
 * Lists approved reviews from DB; form posts to add_review (pending until admin approves).
 */
export const BlogCommentsDefault: React.FC<Props> = ({
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

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor = fb.textColor || lc.textColor || '#4B5563';
  const cardBg = fb.background || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border || lc.cardBorderColor || 'rgba(0,0,0,0.08)';
  const btnBg = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText = (lc.buttonTextColor as string) || tc?.buttonTextColor || '#FFFFFF';
  const inputBg = (lc as any).inputBg || '#F9FAFB';

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
  const bg = isThemeSurface ? '#FFFFFF' : savedBg;
  const bgStyle = resolveSectionBackground(s, { defaultSurface: bg });

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-14 sm:pb-16 lg:pb-20';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const blogId = String(c.blogId || c.contentRef?.blogId || '').trim();
  const isLive = Boolean(blogId);
  const seeded = Array.isArray(c.comments) ? (c.comments as BlogReviewComment[]) : [];

  const [comments, setComments] = useState<BlogReviewComment[]>(() =>
    isLive ? seeded : seeded.length ? seeded : DEFAULT_COMMENTS
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Keep in sync when section content hydrates / navigates between articles
  useEffect(() => {
    if (!isLive) {
      setComments(seeded.length ? seeded : DEFAULT_COMMENTS);
      return;
    }
    setComments(seeded);
    let cancelled = false;
    void (async () => {
      const fresh = await fetchBlogReviews(blogId);
      if (!cancelled && fresh.length) setComments(fresh);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId, isLive]);

  const ctaLabel = useMemo(
    () => String(c.ctaText || content.ctaText || 'Post Comment').trim() || 'Post Comment',
    [c.ctaText, content.ctaText]
  );

  const reviewerInitials = (name: string) => {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return (parts[0] || '?').slice(0, 2).toUpperCase();
  };

  const isPlaceholderAvatar = (url?: string) => {
    const u = String(url || '').trim();
    if (!u) return true;
    // Stock/demo avatars — prefer themed initials on live sites
    return /ui-avatars\.com|pravatar\.cc/i.test(u);
  };

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();
      setStatusMsg(null);
      if (!isLive) {
        setStatusMsg({
          type: 'err',
          text: 'Comments are available on the published blog page.',
        });
        return;
      }
      if (readOnly === false) {
        // Builder canvas: allow try-submit only when a real blogId is present
      }
      setSubmitting(true);
      try {
        const result = await submitBlogReview({
          blogId,
          fullName,
          email,
          rating,
          reviewText,
        });
        if (result.ok) {
          setStatusMsg({ type: 'ok', text: result.message });
          setReviewText('');
          // Approved list won't include this yet — refresh anyway for already-approved ones
          const fresh = await fetchBlogReviews(blogId);
          if (fresh.length) setComments(fresh);
        } else {
          setStatusMsg({ type: 'err', text: result.message });
        }
      } catch (err: any) {
        setStatusMsg({ type: 'err', text: err?.message || 'Failed to post comment' });
      } finally {
        setSubmitting(false);
      }
    },
    [blogId, email, fullName, isLive, rating, readOnly, reviewText]
  );

  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    secondaryHeadingColor: accent,
    buttonBackgroundColor: btnBg,
    buttonTextColor: btnText,
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

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-cm-title`;
    const existing = section.elements?.find((el) => el.id === id);
    const sourceText = String(c.commentSectionTitle || content.title || 'Join the Conversation')
      .replace(/<[^>]+>/g, '')
      .trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) {
      highlightedText = words[words.length - 1];
      textBefore = words.slice(0, -1).join(' ');
    }
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id,
      type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800',
        fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
        lineHeight: '1.15',
        textAlign: 'left' as any,
      },
    });
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

  const subEl: WebsiteElement = section.elements?.find((el) => el.id === `${section.id}-cm-sub`) || {
    id: `${section.id}-cm-sub`,
    type: 'text',
    content: {
      text: String(c.commentSectionSubtitle || "Share your thoughts — we'd love to hear from you."),
      textSize: 'base',
    },
    style: { lineHeight: '1.6', textAlign: 'left' as any },
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '0.625rem',
    backgroundColor: inputBg,
    border: `1px solid ${cardBorder}`,
    
    fontSize: '0.95rem',
    outline: 'none'};

  return (
    <div className="w-full" style={{ ...bgStyle }}>
      <div className={innerClass} style={innerStyle}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="space-y-1">
            <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
            <ElementsSection section={{ ...section, elements: [subEl] }} {...passThrough} />
          </div>

          {/* Approved reviews from DB */}
          <div className="space-y-4">
            {comments.length === 0 && isLive ? (
              <p className="text-sm" style={{ color: textColor }}>
                Be the first to leave a comment.
              </p>
            ) : null}
            {comments.map((cm, i) => (
              <div
                key={cm.id || `${cm.name}-${i}`}
                className="flex gap-4 p-4 rounded-xl"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                {isPlaceholderAvatar(cm.avatar) ? (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      color: btnText || '#FFFFFF',
                    }}
                    aria-hidden="true"
                    title={cm.name}
                  >
                    {reviewerInitials(cm.name || 'R')}
                  </div>
                ) : (
                  <img
                    src={cm.avatar}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold" style={{ color: titleColor }}>
                      {cm.name}
                    </span>
                    {cm.date ? (
                      <span className="text-xs" style={{ color: textColor }}>
                        · {cm.date}
                      </span>
                    ) : null}
                    {Number(cm.rating) > 0 ? (
                      <span
                        className="text-xs font-semibold"
                        style={{ color: accent }}
                        aria-label={`${cm.rating} stars`}
                      >
                        {'★'.repeat(Math.min(5, Math.max(1, Number(cm.rating))))}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm" style={{ color: textColor, lineHeight: 1.6 }}>
                    {cm.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Submit review → POST /add_review */}
          <form
            className="rounded-xl p-5 space-y-3"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            onSubmit={onSubmit}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                placeholder="Your name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isLive || submitting}
                required
                style={inputStyle}
              />
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Your email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isLive || submitting}
                required
                style={inputStyle}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: textColor }}>
                Rating
              </span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  onClick={() => setRating(n)}
                  disabled={!isLive || submitting}
                  className="text-lg leading-none transition-transform hover:scale-110 disabled:opacity-50"
                  style={{ color: n <= rating ? accent : `${accent}40` }}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              name="reviewText"
              placeholder="Write a comment…"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              disabled={!isLive || submitting}
              required
              style={inputStyle}
            />

            {statusMsg ? (
              <p
                className="text-sm"
                style={{ color: statusMsg.type === 'ok' ? '#15803d' : '#b91c1c' }}
                role="status"
              >
                {statusMsg.text}
              </p>
            ) : isLive ? (
              <p className="text-xs" style={{ color: textColor }}>
                Comments are reviewed before they appear publicly.
              </p>
            ) : (
              <p className="text-xs" style={{ color: textColor }}>
                Demo preview — publish a blog to collect real comments.
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!isLive || submitting}
                className="disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {submitting ? 'Posting…' : ctaLabel}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogCommentsDefault;
