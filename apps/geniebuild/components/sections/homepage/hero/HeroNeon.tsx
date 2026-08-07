import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
import { motion } from 'motion/react';
import {
  preferSavedElement,
} from '../utils/headingHighlight';
import { resolveSectionElement, elementFromExistingOrDna } from '../../../../elements';

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
 * HeroNeon — 2026-trend "aurora + spotlight" dark hero.
 *
 * Design reference: a Next.js HeroNext component (aurora mesh blobs, drifting
 * grid, cursor-follow spotlight, shimmering accent headline word, an
 * animated-border availability pill, a bento stat rail and a trust marquee).
 * Re-implemented fully SELF-CONTAINED (scoped <style>, no globals.css) and
 * theme-driven (accent + dark surface come from the active theme).
 *
 * FULLY EDITABLE: every visible piece is a real builder element rendered
 * through ElementsSection — badge (pill), headline (heading, last word accent
 * + shimmer), subhead (text), both CTAs (buttons), each of the 3 stats
 * (value heading + label text) and each trust item (text). Element ids reuse
 * the `h4-` prefix so header content carries over across hero variants.
 */

type Stat = { value: string; label: string };

const DEFAULT_STATS: Stat[] = [
  { value: '4.9★',     label: 'Average rating' },
  { value: '1,200+',   label: 'Jobs completed' },
  { value: 'Same day', label: 'Callback' },
];

const DEFAULT_TRUST = [
  'Fully insured', 'Licensed & certified', 'Free estimates', 'No call-out fee',
  'Workmanship guarantee', 'Family owned', 'Serving the local area',
];

export const HeroNeon: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  // Theme-driven colors (no hardcoded cyan / black).
  const accent     = tc?.iconColor || tc?.accentColor || '#00E5FF';
  const accentDeep = tc?.accentDeepColor || accent;
  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor  = tc?.textColor  || '#9AA4B2';
  const btnBg      = tc?.buttonBackgroundColor || accent;
  const btnText    = tc?.buttonTextColor || '#05070A';
  const bg         = s.backgroundColor || tc?.backgroundColor || '#0A0A0B';
  // Section background: honor user color / gradient / image (image-only overlay); default = dark bg.
  const sectionBg = resolveSectionBackground(s, { defaultSurface: bg });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);
  const surface    = tc?.surface || 'rgba(255,255,255,0.02)';
  const line       = tc?.navBorderColor || 'rgba(255,255,255,0.10)';
  const mutedColor = tc?.textColorMuted || (tc as any)?.muted || 'rgba(255,255,255,0.55)';

  const uid = `hn-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // ── content values ──
  const badgeText = String((content as any).badgeText || 'Now booking this week');
  const headlineText = String((content as any).title || 'Your local experts, one call away.');
  const subheadText = String(
    (content as any).subtitle ||
    'Friendly, fully-licensed and fairly priced. We turn up on time, quote before we start, and stand behind every job we do.'
  );
  const primaryText = String((content as any).ctaText || 'Get a free quote');
  const primaryHref = String((content as any).ctaHref || '#');
  const secondaryText = String((content as any).secondaryCtaText || 'See our services');
  const secondaryHref = String((content as any).secondaryCtaHref || '#');

  const stats: Stat[] = (() => {
    const raw = (content as any).stats;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 3).map((r: any, i: number) => ({
        value: String(r?.value ?? DEFAULT_STATS[i % 3].value),
        label: String(r?.label ?? DEFAULT_STATS[i % 3].label),
      }));
    }
    return DEFAULT_STATS;
  })();

  const trustItems: string[] = (() => {
    const raw = (content as any).trustStripItems;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((it: any) => String(it?.label ?? it?.text ?? it ?? '').trim()).filter(Boolean);
    }
    return DEFAULT_TRUST;
  })();

  // ── editable header elements (h4- ids → carry across hero variants) ──
  const badgeElResolved: WebsiteElement = preferSavedElement(
    section.elements?.find(e => e.id === `${section.id}-h4-badge`),
    {
      id: `${section.id}-h4-badge`, type: 'badge',
      content: { text: badgeText, iconPosition: 'left' },
      style: { fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.02em', textTransform: 'none' as any, padding: '4px 6px', borderRadius: '9999px', textAlign: 'center' as any},
    }
  );

  // Headline — plain neutral heading (no accent highlight); fully editable.
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-h4-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = (existing?.content as any)?.text || String(headlineText || '').replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h1' },
      style: { fontWeight: '800',
        fontSize: 'clamp(2.75rem, 6vw, 5.1rem)',
        lineHeight: '1.02',
        letterSpacing: '-0.045em',
        textAlign: 'center' as any},
    });
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: (base.content as any)?.htmlTag || 'h1' } };
  })();

  const descElResolved: WebsiteElement = preferSavedElement(
    section.elements?.find(e => e.id === `${section.id}-h4-desc`),
    {
      id: `${section.id}-h4-desc`, type: 'text',
      content: { text: subheadText, textSize: 'large' },
      style: { textAlign: 'center' as any, maxWidth: '620px', margin: '0 auto', lineHeight: '1.7' },
    }
  );

  // Both CTAs use the new 'cta-button' element — reliable variants, fully
  // sidebar-editable (Button content form + ButtonStylesBlock), theme-driven.
  const btn1ElResolved: WebsiteElement = preferSavedElement(
    section.elements?.find(e => e.id === `${section.id}-h4-btn1`),
    {
      id: `${section.id}-h4-btn1`, type: 'cta-button',
      content: { text: primaryText, link: primaryHref, buttonVariant: 'primary' },
      style: { buttonVariant: 'primary', padding: '0 1.75rem', height: '3rem', borderRadius: '9999px', fontWeight: '600', fontSize: '0.9rem' } as any,
    }
  );

  const btn2ElResolved: WebsiteElement = preferSavedElement(
    section.elements?.find(e => e.id === `${section.id}-h4-btn2`),
    {
      id: `${section.id}-h4-btn2`, type: 'cta-button',
      content: { text: secondaryText, link: secondaryHref, buttonVariant: 'secondary' },
      style: { buttonVariant: 'secondary', padding: '0 1.75rem', height: '3rem', borderRadius: '9999px', fontWeight: '500', fontSize: '0.9rem' } as any,
    }
  );

  // Stat value = white on the dark hero (theme title color, forced white
  // fallback). No highlightedText → never picks up the accent.
  const statValueColor = titleColor || '#FFFFFF';
  const getStatValueEl = (i: number, value: string): WebsiteElement => {
    const id = `${section.id}-h4-stat${i}-value`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return preferSavedElement(existing, {
        id, type: 'heading',
        content: { text: value, htmlTag: 'div' as any },
        style: { color: statValueColor, fontWeight: '800', fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', lineHeight: '1', letterSpacing: '-0.03em', textAlign: 'center' as any },
      });
    }
    return {
      id, type: 'heading',
      content: { text: value, htmlTag: 'div' as any },
      style: { color: statValueColor, fontWeight: '800', fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', lineHeight: '1', letterSpacing: '-0.03em', textAlign: 'center' as any },
    };
  };
  const getStatLabelEl = (i: number, label: string): WebsiteElement => {
    const id = `${section.id}-h4-stat${i}-label`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'text',
      content: { text: label, textSize: 'small' },
      style: { fontSize: '10px', textTransform: 'uppercase' as any, letterSpacing: '0.14em', textAlign: 'center' as any, lineHeight: '1.4' },
    });
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || label } };
  };

  // Trust marquee — a SINGLE `trust-strip` element (one click selects it; the
  // sidebar's TrustStripContentForm edits all items at once). Its items are the
  // slider chips. We render it once for editing + a plain duplicate for the
  // seamless scroll loop.
  const trustStripItems = trustItems.map((label) => ({ icon: 'fa-check', label }));
  const trustStripEl: WebsiteElement = resolveSectionElement(section, ({
    id: `${section.id}-h4-trust`, type: 'trust-strip',
    content: { items: trustStripItems } as any,
    style: { iconContainerSize: '18px',
      iconSize: '14px', iconBorderRadius: '9999px', 
      titleFontSize: '13px', titleFontWeight: '500', gap: '40px', padding: '0',
      justifyContent: 'flex-start'} as any,
  } as WebsiteElement));
  const trustStripElResolved: WebsiteElement = {
    ...trustStripEl,
    content: { ...(trustStripEl.content || {}), items: (trustStripEl.content as any)?.items?.length ? (trustStripEl.content as any).items : trustStripItems },
  };
  const resolvedTrustLabels: string[] = ((trustStripElResolved.content as any)?.items || [])
    .map((it: any) => String(it?.label ?? '').trim()).filter(Boolean);

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent,
    buttonBackgroundColor: btnBg, buttonTextColor: btnText,
    // Secondary CTA = outline only: NO background (transparent), just a dynamic
    // accent BORDER + white text. Distinct from the filled-accent primary.
    secondaryButtonBg: 'transparent',
    secondaryButtonText: titleColor || '#FFFFFF',
    secondaryButtonBorder: accent,
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  // Section-level padding — accept both Tailwind classes and raw CSS values
  // ("32px", "4rem") so the builder's section spacing controls work.
  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padTraw = s.paddingTop ?? 'pt-24 md:pt-32';
  const padBraw = s.paddingBottom ?? 'pb-16 md:pb-20';
  const padXraw = s.paddingX ?? 'px-6';
  const padT = isCssValue(padTraw) ? '' : padTraw;
  const padB = isCssValue(padBraw) ? '' : padBraw;
  const padX = isCssValue(padXraw) ? '' : padXraw;
  const innerPadStyle: React.CSSProperties = {
    ...(isCssValue(padTraw) ? { paddingTop: padTraw } : {}),
    ...(isCssValue(padBraw) ? { paddingBottom: padBraw } : {}),
    ...(isCssValue(padXraw) ? { paddingLeft: padXraw, paddingRight: padXraw } : {}),
  };

  return (
    <header className={`${uid} relative isolate overflow-hidden w-full`} style={{ ...sectionBg, borderBottom: `1px solid ${line}` }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none z-[1]" style={bgOverlay} />}
      {/* Scoped styles — self-contained, no globals.css dependency */}
      <style>{`
        .${uid} { --mx: 50%; --my: 30%; }
        .${uid} .hn-aurora { position:absolute; border-radius:9999px; filter:blur(90px); opacity:.5; will-change:transform; pointer-events:none; }
        .${uid} .hn-a { top:-14%; left:8%; width:46vw; height:46vw; max-width:620px; max-height:620px; background:radial-gradient(circle, ${accent}47, transparent 68%); animation:${uid}-a 18s ease-in-out infinite; }
        .${uid} .hn-b { top:6%; right:4%; width:40vw; height:40vw; max-width:540px; max-height:540px; background:radial-gradient(circle, ${accentDeep}3D, transparent 70%); animation:${uid}-b 24s ease-in-out infinite; }
        .${uid} .hn-c { bottom:-22%; left:34%; width:44vw; height:44vw; max-width:580px; max-height:580px; background:radial-gradient(circle, ${accent}33, transparent 72%); animation:${uid}-c 30s ease-in-out infinite; }
        @keyframes ${uid}-a { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(6%,8%,0) scale(1.12)} }
        @keyframes ${uid}-b { 0%,100%{transform:translate3d(0,0,0) scale(1.05)} 50%{transform:translate3d(-8%,6%,0) scale(.92)} }
        @keyframes ${uid}-c { 0%,100%{transform:translate3d(0,0,0) scale(.95)} 50%{transform:translate3d(5%,-7%,0) scale(1.1)} }
        .${uid} .hn-grid { background-image:linear-gradient(to right, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px); background-size:64px 64px; -webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 35%, #000 30%, transparent 78%); mask-image:radial-gradient(ellipse 80% 60% at 50% 35%, #000 30%, transparent 78%); animation:${uid}-drift 20s linear infinite; }
        @keyframes ${uid}-drift { 0%{transform:translate3d(0,0,0)} 100%{transform:translate3d(-64px,-64px,0)} }
        .${uid} .hn-spot { background:radial-gradient(460px circle at var(--mx) var(--my), ${accent}1A, transparent 70%); transition:background 120ms linear; }
        /* Shimmer the highlighted (last) word of the editable heading */
        .${uid} .hn-title :is(.highlighted-text, [data-highlight], mark, .accent, b) { background:linear-gradient(100deg, ${accent} 0%, #ffffff 42%, ${accent} 62%, ${accentDeep} 100%); background-size:220% 100%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; animation:${uid}-shim 5s ease-in-out infinite; }
        @keyframes ${uid}-shim { 0%,100%{background-position:140% 0} 50%{background-position:-40% 0} }
        .${uid} .hn-dot { animation:${uid}-blink 1.4s steps(2) infinite; }
        @keyframes ${uid}-blink { 0%,60%{opacity:1} 61%,100%{opacity:.2} }
        .${uid} .hn-marquee { animation:${uid}-marq 34s linear infinite; }
        @keyframes ${uid}-marq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .${uid} .hn-marquee-mask { -webkit-mask-image:linear-gradient(to right, transparent, #000 12%, #000 88%, transparent); mask-image:linear-gradient(to right, transparent, #000 12%, #000 88%, transparent); }
        .${uid} .hn-cta { transition:transform .2s ease, box-shadow .2s ease; }
        .${uid} .hn-cta:hover { transform:translateY(-2px); box-shadow:0 0 42px ${accent}2E; }
        .${uid} .hn-sec:hover { background-color:${accent}14 !important; }
        .${uid} .hn-sec:focus-visible { outline:2px solid ${accent}; outline-offset:3px; }
        .${uid} .hn-sec:hover { background-color:${accent}14 !important; border-color:${accent} !important; }
        .${uid} .hn-sec:focus-visible { outline:2px solid ${accent}; outline-offset:3px; }
        @media (prefers-reduced-motion: reduce) {
          .${uid} .hn-aurora, .${uid} .hn-marquee, .${uid} .hn-grid,
          .${uid} .hn-title :is(.highlighted-text, [data-highlight], mark, .accent, b) { animation:none !important; }
          .${uid} .hn-title :is(.highlighted-text, [data-highlight], mark, .accent, b) { background:none; -webkit-text-fill-color:${accent}; color:${accent}; }
          .${uid} .hn-spot { display:none; }
        }
      `}</style>

      {/* Layer 1: aurora mesh */}
      <div aria-hidden className="absolute inset-0 -z-30">
        <div className="hn-aurora hn-a" />
        <div className="hn-aurora hn-b" />
        <div className="hn-aurora hn-c" />
      </div>
      {/* Layer 2: drifting grid */}
      <div aria-hidden className="absolute inset-0 -z-20 hn-grid" />
      {/* Layer 3: cursor spotlight */}
      <HeroSpotlight uid={uid} disabled={readOnly} />

      <div className={`relative mx-auto max-w-[1240px] ${padX} ${padT} ${padB}`} style={innerPadStyle}>
        <div className="mx-auto max-w-[900px] text-center">
          {/* Availability pill — animated border wrapper around the editable badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full px-1 py-1 pr-3 backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${line}` }}>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ backgroundColor: accent, color: btnText }}>
                <span aria-hidden className="hn-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `${btnText}B3` }} />
                Open
              </span>
              <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...pass} />
            </div>
          </motion.div>

          {/* Headline — real editable heading (last word = accent + shimmer via CSS) */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="hn-title mt-8">
            <ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="mt-7">
            <ElementsSection section={{ ...section, elements: [descElResolved] }} {...pass} />
          </motion.div>

          {/* CTAs — new 'cta-button' element: reliable variants, sidebar-editable */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <div style={{ width: 'max-content' }}>
              <ElementsSection section={{ ...section, elements: [btn1ElResolved] }} {...pass} />
            </div>
            <div style={{ width: 'max-content' }}>
              <ElementsSection section={{ ...section, elements: [btn2ElResolved] }} {...pass} />
            </div>
          </motion.div>

          {/* Bento stat rail — each stat's value + label are editable elements */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
            className="mx-auto mt-14 grid max-w-[560px] grid-cols-3 gap-px overflow-hidden rounded-2xl"
            style={{ border: `1px solid ${line}`, backgroundColor: line }}>
            {stats.map((stat, i) => (
              <div key={i} className="px-4 py-5 flex flex-col items-center gap-2" style={{ backgroundColor: surface }}>
                <ElementsSection section={{ ...section, elements: [getStatValueEl(i, stat.value)] }} {...pass} />
                <ElementsSection section={{ ...section, elements: [getStatLabelEl(i, stat.label)] }} {...pass} />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Trust marquee — a single editable `trust-strip` element (click it once,
          edit ALL items from the sidebar). First copy is the live element; the
          second is a plain mirror so the scroll loops seamlessly. */}
      <div className="relative py-6" style={{ borderTop: `1px solid ${line}` }} aria-label="Our credentials and guarantees">
        <div className="hn-marquee-mask overflow-hidden">
          <div className="hn-marquee flex w-max items-center gap-10">
            {/* editable strip */}
            <div className="shrink-0">
              <ElementsSection section={{ ...section, elements: [trustStripElResolved] }} {...pass} />
            </div>
            {/* mirror copy for seamless loop */}
            <div className="shrink-0 flex items-center" style={{ gap: '40px' }} aria-hidden>
              {resolvedTrustLabels.map((label, i) => (
                <span key={i} className="flex items-center gap-2" >
                  <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5 8 14.5 16 5.5" /></svg>
                  <span className="whitespace-nowrap text-[13px]" style={{ color: `${textColor}B3` }}>{label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

/** Cursor-follow spotlight — writes CSS vars directly, no React re-render. */
const HeroSpotlight: React.FC<{ uid: string; disabled: boolean }> = ({ uid, disabled }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (disabled) return;
    const host = ref.current?.closest(`.${uid}`) as HTMLElement | null;
    if (!host) return;
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;
    }
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = host.getBoundingClientRect();
        host.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        host.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    };
    host.addEventListener('pointermove', onMove);
    return () => { host.removeEventListener('pointermove', onMove); if (frame) cancelAnimationFrame(frame); };
  }, [uid, disabled]);
  return <div ref={ref} aria-hidden className="absolute inset-0 -z-10 hn-spot" />;
};

export default HeroNeon;
