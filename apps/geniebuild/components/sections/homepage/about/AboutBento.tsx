import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
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

/**
 * AboutBento — alternate `about` variant (2026 bento: tilt photo + counters).
 *
 * Design reference: a Next.js AboutNext component — a bento layout with a
 * grayscale→color photo (service-area overlay + "Open" badge) on the left and
 * copy on the right: eyebrow, accent-underlined heading, paragraphs, trust
 * chips, a 3-stat counter rail and a CTA.
 *
 * Builder-compatible: badge, title, description, feature boxes (as chips), image
 * and CTA are real editable elements. Colors come from the theme (`tc.light`),
 * nothing hardcoded. Element ids reuse the `about-` prefix so content carries
 * over on variant switch. Stats are static defaults (make dynamic later).
 */

const DEFAULT_STATS = [
  { value: '15+',   label: 'Years in business' },
  { value: '1,200+', label: 'Jobs completed' },
  { value: '98%',   label: 'Would recommend' },
];

export const AboutBento: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const cardBg     = fb.background  || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border      || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';

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
  const padT = s.paddingTop  ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  // ── content values ──
  const apiBadge = String((content as any).badgeText || 'About us');
  const apiTitle = String((content as any).title || 'A local team you can actually get hold of.');
  const apiDesc  = String((content as any).subtitle || (content as any).description ||
    'We are a local, independently run business built on repeat customers and word of mouth. You speak to the same people who do the work.');
  const apiCta   = String((content as any).ctaText || 'Get your free quote');
  const apiCtaHref = String((content as any).ctaHref || '#');
  const serviceArea = String((content as any).serviceArea || 'Your local area');
  const serviceAreaLabel = String((content as any).serviceAreaLabel || 'Proudly serving');

  const trustPoints: string[] = (() => {
    const raw = (content as any).featureBoxes || (content as any).trustPoints;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((it: any) => String(it?.heading || it?.title || it?.label || it || '').trim()).filter(Boolean).slice(0, 6);
    }
    return ['Free written quotes', 'Licensed & insured', 'No hidden charges', 'Workmanship guarantee', 'Local, family run', 'Emergency callouts'];
  })();

  const stats = (() => {
    const raw = (content as any).stats;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 3).map((r: any, i: number) => ({ value: String(r?.value ?? DEFAULT_STATS[i % 3].value), label: String(r?.label ?? DEFAULT_STATS[i % 3].label) }));
    }
    return DEFAULT_STATS;
  })();

  const image = (() => {
    const url = resolveSectionImageUrl(section, { elementId: `${section.id}-about-image`, elementImageUrl: (content as any).imageUrl });
    if (url && url !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(url);
    return 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&h=1125&fit=crop&auto=format&q=80';
  })();

  // ── editable elements (about- ids → carry across variants) ──
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-badge`) || {
    id: `${section.id}-about-badge`, type: 'badge',
    content: { text: apiBadge, iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'left' as any, backgroundColor: 'transparent', color: accent },
  };
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: apiBadge } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-about-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = (existing?.content as any)?.text || apiTitle;
    const words = String(src).replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean);
    const before = words.length > 2 ? words.slice(0, -2).join(' ') : '';
    const highlight = words.length > 2 ? words.slice(-2).join(' ') : src;
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: src, textBefore: before, highlightedText: highlight, textAfter: '', htmlTag: 'h2' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 2.875rem)', lineHeight: '1.1', letterSpacing: '-0.035em', textAlign: 'left' as any, highlightColor: accent },
    };
    return { ...base, content: { ...(base.content || {}), text: src, textBefore: before, highlightedText: highlight, textAfter: '', htmlTag: (base.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), highlightColor: (base.style as any)?.highlightColor || accent } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-desc`) || {
    id: `${section.id}-about-desc`, type: 'text',
    content: { text: apiDesc, textSize: 'large' },
    style: { color: textColor, textAlign: 'left' as any, maxWidth: '640px', lineHeight: '1.75' },
  };
  const descElResolved: WebsiteElement = { ...descEl, content: { ...(descEl.content || {}), text: apiDesc } };

  const ctaEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-cta`) || {
    id: `${section.id}-about-cta`, type: 'cta-button',
    content: { text: apiCta, link: apiCtaHref, buttonVariant: 'primary' },
    style: { buttonVariant: 'primary', padding: '0 1.75rem', height: '3rem', borderRadius: '9999px', fontWeight: '600', fontSize: '0.9rem' } as any,
  };
  const ctaElResolved: WebsiteElement = { ...ctaEl, content: { ...(ctaEl.content || {}), text: apiCta, link: apiCtaHref } };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent,
    buttonBackgroundColor: lc.buttonBackgroundColor || tc?.buttonBackgroundColor || accent,
    buttonTextColor: lc.buttonTextColor || tc?.buttonTextColor || '#FFFFFF',
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">

          {/* Photo — left (tilts toward the pointer) */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="md:col-span-5">
            <TiltCard disabled={readOnly === false ? false : false} className="relative max-w-[440px]">
              <div aria-hidden className="absolute -inset-3 rounded-[26px]" style={{ border: `1px solid ${accent}4D` }} />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px]" style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
                <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
                <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, transparent)' }} />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: accent }}>{serviceAreaLabel}</div>
                    <div className="mt-1 truncate text-[20px] font-bold text-white">{serviceArea}</div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-white backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                    Open
                  </span>
                </div>
              </div>
            </TiltCard>
          </motion.div>

          {/* Copy — right */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-7">
            <div className="inline-flex items-center gap-2.5">
              <span aria-hidden className="h-px w-8" style={{ backgroundColor: accent }} />
              <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...pass} />
            </div>

            <div className="mt-5">
              <ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} />
            </div>

            <div className="mt-7">
              <ElementsSection section={{ ...section, elements: [descElResolved] }} {...pass} />
            </div>

            {/* Trust chips */}
            {trustPoints.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {trustPoints.map((point, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] transition-colors duration-200"
                    style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg, color: textColor }}>
                    <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5 8 14.5 16 5.5" /></svg>
                    {point}
                  </li>
                ))}
              </ul>
            )}

            {/* Stats rail — values count up when scrolled into view */}
            <dl className="mt-10 grid max-w-[520px] grid-cols-3 gap-px overflow-hidden rounded-2xl" style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBorder }}>
              {stats.map((stat, i) => (
                <div key={i} className="px-4 py-5 transition-colors duration-200 hover:brightness-[0.98]" style={{ backgroundColor: cardBg }}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-[26px] sm:text-[30px] font-extrabold leading-none tracking-[-0.03em]" style={{ color: titleColor }}>
                      <CountUp value={stat.value} delay={i * 120} disabled={readOnly === false ? false : false} />
                    </span>
                    <span aria-hidden className="mt-2 block text-[10px] uppercase leading-[1.4] tracking-[0.14em]" style={{ color: textColor }}>{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10" style={{ width: 'max-content' }}>
              <ElementsSection section={{ ...section, elements: [ctaElResolved] }} {...pass} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/** Pointer-tilt wrapper — tilts children toward the cursor (fine pointers only). */
const TiltCard: React.FC<{ children: React.ReactNode; className?: string; disabled?: boolean }> = ({ children, className, disabled }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
      });
    };
    const reset = () => { el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'; };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', reset);
    return () => { el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', reset); if (frame) cancelAnimationFrame(frame); };
  }, [disabled]);
  return <div ref={ref} className={className} style={{ transition: 'transform .25s ease', willChange: 'transform' }}>{children}</div>;
};

/** Counts up the numeric part of a value (e.g. "1,200+") when scrolled into view. */
const CountUp: React.FC<{ value: string; delay?: number; disabled?: boolean }> = ({ value, delay = 0 }) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const m = String(value).match(/^(\D*)([\d,]+)(.*)$/);
  const prefix = m?.[1] ?? '';
  const target = m ? parseInt(m[2].replace(/,/g, ''), 10) : NaN;
  const suffix = m?.[3] ?? '';
  const [display, setDisplay] = React.useState<string>(Number.isFinite(target) ? '0' : value);
  React.useEffect(() => {
    if (!Number.isFinite(target)) { setDisplay(value); return; }
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(target.toLocaleString()); return; }
    let raf = 0; let timer: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      timer = setTimeout(() => {
        const start = performance.now(); const DUR = 1100;
        const tick = (now: number) => {
          const t = Math.min((now - start) / DUR, 1);
          if (t >= 1) { setDisplay(target.toLocaleString()); return; }
          setDisplay(Math.round((1 - Math.pow(2, -10 * t)) * target).toLocaleString());
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }, delay);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); if (raf) cancelAnimationFrame(raf); };
  }, [target, value, delay]);
  return <span ref={ref} className="tabular-nums">{Number.isFinite(target) ? `${prefix}${display}${suffix}` : value}</span>;
};

export default AboutBento;
