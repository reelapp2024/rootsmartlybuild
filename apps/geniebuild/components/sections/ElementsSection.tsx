
import React, { useState, useEffect, useRef } from 'react';
import { AnimatedDiv } from '../motionSafe';
import { Section, WebsiteElement } from '../../types';
import { toAbsoluteMediaUrl } from '../../config';
import { useTheme } from '@ui/blocks';
import { useGlobalElementStyles } from '../builder/state/GlobalElementStylesContext';
import { useDefaultSizes } from '../builder/state/DefaultSizesContext';
import {
  buildHeadingHighlightSpanStyle,
  buildHeadingEditableHtml,
  plainTextFromHtml,
  resolveHeadingFontSize,
  resolveHighlightAccentColor,
  resolveTextFontSize,
  splitHeadingToHighlightParts,
  type HeadingTag,
  type TextSizePreset,
} from '../../utils/resolveElementTypography';
import {
  plainTextForTruncate,
  resolveLimitedTextDisplay,
  withDefaultTextLimit,
} from '../../utils/textTruncate';
import {
  isDarkCanvasTextColor,
  resolveIsLightSurface,
} from '../../utils/themeSurface';
import { resolveElementColor, hasExplicitStyleValue } from '../../utils/applyElementComputedStyle';
import { resolveSectionBackground } from '../../utils/sectionBackground';
import { ELEMENT_DEFAULTS, IMAGE_BOX_DEFAULT_TITLE_HEADING, PRESET_THEMES } from '../../constants';
import * as LucideIcons from 'lucide-react';
import { StatCardValue } from './StatCardValue';
import { CanvasFormElement } from './CanvasFormElement';
import { CanvasGalleryElement } from './CanvasGalleryElement';
import { resolveElementBackground } from '../builder/style-editor/ElementBackgroundBlock';
import {
  resolveSectionImageUrl,
  resolveSectionImageUrlForElement,
  toDisplayImageUrl,
  SECTION_IMAGE_PLACEHOLDER,
} from './homepage/utils/sectionImageResolve';
import {
  bindEditableHtml,
  cancelCaretRestore,
  createEditableHtmlProps,
  editableFocusBlur,
  forceSyncEditableHtml,
  getEditableNode,
  getLiveCaretOffset,
  getPlainTextCaretOffset,
  htmlPreserveTrailingSpaces,
  isInlineEditing,
  restoreCaretAfterReactUpdate,
  setLiveTrailingSpace,
} from './editableHtmlHelpers';
import {
  stripImageBoxImageKeys,
  normalizeImageBoxImageStyle,
  buildCombinedImageFilter,
  buildImageOuterStyle,
  buildImageImgStyle,
  buildImageHoverCss,
} from './utils/imagePresentation';
import { isNavItemActive } from '../../lib/navActiveState';
import { resolveHeadingHtmlTag } from '../../utils/htmlTagUtils';
import { LinkClickChooser } from '../builder/canvas/LinkClickChooser';
import { useOpenInternalLink } from '../builder/context/OpenInternalLinkContext';
import {
  hasUsableHref,
  resolveAnchorTargetRel,
} from '../../utils/resolveInternalPageLink';

interface ElementsSectionProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onUpload?: (sectionId: string, field: string) => void;
  onElementUpdate: (elementId: string, updates: Partial<WebsiteElement>) => void;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  /** Builder: open an internal page (or external URL) from a link click chooser.
   *  Prefer OpenInternalLinkProvider; this prop is an optional override. */
  onOpenInternalLink?: (href: string) => void;
  selectedElementId?: string | null;
  buttonClass?: string;
  readOnly?: boolean;
  /** Live site: current pathname for nav active indicator (e.g. from Next.js usePathname). */
  sitePathname?: string;
  /** Live site: pageType from API (e.g. service → highlight Services). */
  sitePageType?: string;
  isWrapped?: boolean; // If false, renders elements without wrapper div (for use in custom layouts)
  themeColors?: {
    titleColor?: string;
    textColor?: string;
    accordionQuestionColor?: string;
    accordionAnswerColor?: string;
    accordionBackgroundColor?: string;
    accordionBorderColor?: string;
    cardBackgroundColor?: string;
    cardBorderColor?: string;
    accentColor?: string;
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    buttonBorderColor?: string;
    borderColor?: string;
    backgroundColor?: string;
    subheadingColor?: string;
    iconBgColor?: string;
    iconColor?: string;
    icon?: string;
    secondaryHeadingColor?: string;
    themeMode?: string;
    // Global style properties for unified styling
    buttonFontWeight?: string;
    buttonFontSize?: string;
    buttonAlign?: string;
    buttonFontFamily?: string;
    titleFontWeight?: string;
    titleFontSize?: string;
    titleAlign?: string;
    titleFontFamily?: string;
    subtitleFontWeight?: string;
    subtitleFontSize?: string;
    subtitleAlign?: string;
    subtitleFontFamily?: string;
    descriptionFontFamily?: string;
    fontWeight?: string;
    fontSize?: string;
    textAlign?: string;
    fontFamily?: string;
  };
  /** When set + readOnly, image-box "Learn More" opens detail instead of only navigating (e.g. homepage services). */
  publishedImageBoxDetailHandler?: (payload: {
    title: string;
    description: string;
    href: string;
  }) => void;
}

// Helper for Icons (Supports FontAwesome and Lucide)
const IconRenderer = ({ icon, className, style, size }: { icon: string, className?: string, style?: React.CSSProperties, size?: string | number }) => {
    if (!icon || icon === 'none') return null;
    const rawIcon = String(icon).trim();

    // Handle full FontAwesome class strings first (e.g. "fas fa-tools", "fa-solid fa-wrench", "fa-wrench")
    if (rawIcon.includes('fa-')) {
        const hasFaStylePrefix = /\b(fa-solid|fa-regular|fa-brands|fa-light|fa-thin|fas|far|fab|fal|fat)\b/.test(rawIcon);
        const finalFaClass = hasFaStylePrefix ? rawIcon : `fa-solid ${rawIcon}`;
        return <i className={`${finalFaClass} ${className || ''}`.trim()} style={{ ...style, fontSize: size || style?.fontSize }}></i>;
    }

    // Handle potential 'default' property in LucideIcons import
    const icons = (LucideIcons as any).default || LucideIcons;

    // Normalize icon name for Lucide (PascalCase)
    // Lucide icons are exported as PascalCase (e.g., "Globe", "Settings")
    const normalizedLucideName = icon.charAt(0).toUpperCase() + icon.slice(1);
    
    // Try to find the icon in LucideIcons
    let LucideIcon = icons[normalizedLucideName] || icons[icon];
    
    // If not found, try to find it by checking all keys (case-insensitive)
    if (!LucideIcon) {
        const iconLower = icon.toLowerCase();
        const foundKey = Object.keys(icons).find(k => k.toLowerCase() === iconLower);
        if (foundKey) {
            LucideIcon = icons[foundKey];
        }
    }

    if (LucideIcon) {
        // Lucide icons use 'size' prop or 'width'/'height' in style
        const iconSize = size || style?.fontSize || '1em';
        return <LucideIcon className={className} style={{ ...style, width: iconSize, height: iconSize }} />;
    }

    // Fallback to Font Awesome (lowercase)
    const faIconName = icon.toLowerCase().replace('fa-', '');
    const faClass = `fa-solid fa-${faIconName}`;
    return <i className={`${faClass} ${className || ''}`} style={{ ...style, fontSize: size || style?.fontSize }}></i>;
};

// Helper for Countdown
const CountdownTimer = ({ targetDate, style, content }: { targetDate: string, style: any, content?: any }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const tick = () => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;
            if (distance < 0) {
                setExpired(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            setExpired(false);
            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    // Style mode: boxed (default) | minimal | flip | inline
    const mode: string = style.timerMode || 'boxed';
    const showSeconds: boolean = content?.showSeconds !== false;
    const showDays: boolean = content?.showDays !== false;
    const padZero: boolean = content?.padZero !== false;

    const accent = style.accentColor || '#F59E0B';
    const numColor = style.numberColor || style.color || '#F8FAFC';
    const labelColor = style.labelColor || style.color || '#C7CDD6';
    const boxBg = style.boxBackgroundColor || (mode === 'boxed' ? 'rgba(255,255,255,0.05)' : 'transparent');
    const boxBorder = style.boxBorderColor || accent;
    const boxRadius = style.boxBorderRadius || '8px';
    const numFontSize = style.numberFontSize || '1.75rem';
    const labelFontSize = style.labelFontSize || '0.625rem';
    const gap = style.timerGap || '12px';

    const fmt = (n: number) => padZero && n < 10 ? `0${n}` : String(n);
    const labels = {
        days:    content?.labelDays    || 'Days',
        hours:   content?.labelHours   || 'Hrs',
        minutes: content?.labelMinutes || 'Min',
        seconds: content?.labelSeconds || 'Sec',
    };

    if (expired) {
        return (
            <div className="flex" style={{ justifyContent: style.textAlign === 'center' ? 'center' : (style.textAlign === 'right' ? 'flex-end' : 'flex-start') }}>
                <span className="font-bold text-lg" style={{ color: accent }}>{content?.expiredText || 'Time\'s up!'}</span>
            </div>
        );
    }

    const justify = style.textAlign === 'center' ? 'center' : (style.textAlign === 'right' ? 'flex-end' : 'flex-start');
    const containerStyle: React.CSSProperties = { justifyContent: justify, gap, display: mode === 'inline' ? 'inline-flex' : 'flex' };

    const boxStyle: React.CSSProperties = mode === 'boxed' ? {
        backgroundColor: boxBg,
        border: `1px solid ${boxBorder}`,
        borderRadius: boxRadius,
        padding: '0.75rem 1rem',
        minWidth: '4rem',
    } : mode === 'flip' ? {
        backgroundColor: boxBg || '#1a1a1a',
        border: `1px solid ${boxBorder}`,
        borderRadius: boxRadius,
        padding: '0.5rem 0.875rem',
        minWidth: '4rem',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.08), 0 2px 0 rgba(0,0,0,0.3)',
    } : {};

    const renderUnit = (val: number, label: string, key: string) => {
        if (mode === 'inline') {
            return (
                <span key={key} className="inline-flex items-baseline gap-1">
                    <span className="font-bold tabular-nums" style={{ color: numColor, fontSize: numFontSize }}>{fmt(val)}</span>
                    <span className="uppercase" style={{ color: labelColor, fontSize: labelFontSize }}>{label}</span>
                </span>
            );
        }
        return (
            <div key={key} className="flex flex-col items-center" style={boxStyle}>
                <span className="font-bold tabular-nums leading-none" style={{ color: numColor, fontSize: numFontSize }}>{fmt(val)}</span>
                <span className="uppercase tracking-wider mt-1" style={{ color: labelColor, fontSize: labelFontSize, opacity: mode === 'minimal' ? 0.6 : 0.85 }}>{label}</span>
            </div>
        );
    };

    const sep = mode === 'inline' || mode === 'minimal' ? null : null;
    void sep;
    return (
        <div style={containerStyle}>
            {showDays && renderUnit(timeLeft.days, labels.days, 'd')}
            {renderUnit(timeLeft.hours, labels.hours, 'h')}
            {renderUnit(timeLeft.minutes, labels.minutes, 'm')}
            {showSeconds && renderUnit(timeLeft.seconds, labels.seconds, 's')}
        </div>
    );
};

/** Convert rgb/rgba to hex so card/accordion and all elements use # colors per theme */
const colorToHex = (val: string | undefined): string | undefined => {
  if (!val || typeof val !== 'string' || val.startsWith('#')) return val;
  const m = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/);
  if (!m) return val;
  const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
  const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
  const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

/**
 * Resolve the active text alignment for an element from its style.
 * Falls back to 'left' when not set. Returns three pre-built strings:
 *   - textAlignClass: Tailwind class for inline text alignment ('text-left' / 'text-center' / 'text-right')
 *   - justifyClass:   Flex container alignment ('justify-start' / 'justify-center' / 'justify-end')
 *                      — use for wrapper around an inline-level element (image/badge/icon/etc.)
 *   - itemsAlignClass: Flex column alignment ('items-start' / 'items-center' / 'items-end')
 *                      — use when the element stacks vertically and inner items should align
 *   - value:          The raw 'left' | 'center' | 'right' value
 */
const resolveTextAlign = (style: any): {
  value: 'left' | 'center' | 'right';
  textAlignClass: string;
  justifyClass: string;
  itemsAlignClass: string;
} => {
  const raw = (style?.textAlign || '').toString().toLowerCase();
  const value: 'left' | 'center' | 'right' =
    raw === 'center' ? 'center' :
    raw === 'right' ? 'right' : 'left';
  return {
    value,
    textAlignClass:  value === 'center' ? 'text-center' : value === 'right' ? 'text-right' : 'text-left',
    justifyClass:    value === 'center' ? 'justify-center' : value === 'right' ? 'justify-end' : 'justify-start',
    itemsAlignClass: value === 'center' ? 'items-center' : value === 'right' ? 'items-end' : 'items-start',
  };
};

const getSafeStyle = (style: any): React.CSSProperties => {
  const css: any = { ...style };
  if (css.backgroundColor) css.backgroundColor = colorToHex(css.backgroundColor) || css.backgroundColor;
  if (css.borderColor) css.borderColor = colorToHex(css.borderColor) || css.borderColor;
  
  // Explicitly handle 'margin' object from state
  if (typeof style.margin === 'object' && style.margin !== null) {
      if(style.margin.top) css.marginTop = style.margin.top;
      if(style.margin.right) css.marginRight = style.margin.right;
      if(style.margin.bottom) css.marginBottom = style.margin.bottom;
      if(style.margin.left) css.marginLeft = style.margin.left;
      delete css.margin;
  }
  
  // Explicitly handle 'padding' object from state
  if (typeof style.padding === 'object' && style.padding !== null) {
      if(style.padding.top) css.paddingTop = style.padding.top;
      if(style.padding.right) css.paddingRight = style.padding.right;
      if(style.padding.bottom) css.paddingBottom = style.padding.bottom;
      if(style.padding.left) css.paddingLeft = style.padding.left;
      delete css.padding;
  }
  
  // Remove non-standard CSS properties
  delete css.backgroundGradient;
  delete css.backgroundOverlay;
  delete css.accentColor;
  delete css.hiddenOnDesktop;
  delete css.hiddenOnTablet;
  delete css.hiddenOnMobile;
  // Advanced-tab meta keys — applied on the wrapper (id/class/scoped CSS/anim),
  // not valid inline CSS, so strip them from the element's inline style.
  delete css.customId;
  delete css.customClasses;
  delete css.customCss;
  delete css.entranceAnimation;
  // hover-* keys are consumed by scoped :hover CSS (button + canvas element
  // wrapper), never valid inline style — strip them. Cast because CSSProperties
  // doesn't declare these custom keys.
  delete (css as any).hoverMotion;
  delete (css as any).hoverColor;
  delete (css as any).hoverBackgroundColor;
  delete (css as any).hoverBorderColor;
  delete (css as any).hoverBoxShadow;
  delete (css as any).hoverTransitionMs;
  
  // Remove fontFamily if it's undefined, null, or empty string (let CSS theme handle it)
  if (!css.fontFamily || css.fontFamily.trim() === '') {
    delete css.fontFamily;
  }

  return css as React.CSSProperties;
};

/**
 * resolveElementChrome — SHARED "card / box" wrapper style resolver.
 *
 * The audit of all element types found the same class of bug in a few of them
 * (stat-card, and the risk in any new card-like element): the wrapper chrome —
 * padding, background, border and radius — was HARDCODED (e.g. a fixed
 * `p-6 rounded-2xl bg-white/5 border border-white/10` class), which ignored the
 * user's Design/Advance controls.
 *
 * Any card/box/panel-style element should build its wrapper style through THIS
 * helper instead of hardcoding. It always honours a user-set value first, then
 * falls back to a theme token, then to the caller's default. Nothing is
 * hard-hardcoded except the caller-supplied defaults. This keeps every card-like
 * element editable and consistent, and stops the bug from recurring in new ones.
 *
 * Usage:
 *   const chrome = resolveElementChrome(safeStyle, theme, {
 *     padding: '1.5rem', radius: '1rem', bg: theme?.cardBackgroundColor, ...
 *   });
 *   <div style={{ ...safeStyle, ...chrome }} />
 */
const resolveElementChrome = (
  safeStyle: any,
  theme: any,
  defaults: {
    padding?: string;
    radius?: string;
    bg?: string;
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
  } = {}
): React.CSSProperties => {
  const s = safeStyle || {};
  const hasUserPadding = s.padding || s.paddingTop || s.paddingBottom || s.paddingLeft || s.paddingRight;
  const hasUserBorder = s.borderWidth || s.borderTopWidth || s.borderBottomWidth || s.borderLeftWidth || s.borderRightWidth || s.borderColor || s.borderStyle;
  return {
    // Padding: per-side keys come through the ...safeStyle spread; only set the
    // shorthand when the user gave one, else the caller default.
    padding: s.padding ?? (hasUserPadding ? undefined : defaults.padding),
    backgroundColor: s.backgroundColor || defaults.bg || theme?.cardBackgroundColor || undefined,
    borderRadius: s.borderRadius ?? defaults.radius,
    ...(hasUserBorder
      ? {
          borderWidth: s.borderWidth ?? defaults.borderWidth ?? '1px',
          borderStyle: s.borderStyle || defaults.borderStyle || 'solid',
          borderColor: s.borderColor || defaults.borderColor || theme?.cardBorderColor,
        }
      : defaults.borderWidth
      ? {
          borderWidth: defaults.borderWidth,
          borderStyle: defaults.borderStyle || 'solid',
          borderColor: defaults.borderColor || theme?.cardBorderColor,
        }
      : {}),
  };
};

const getMarqueePxPerSecond = (speed: unknown): number => {
  const pxPerSecondMap: Record<string, number> = {
    '1x': 80,
    '2x': 120,
    '3x': 160,
    '4x': 210,
    '5x': 260,
    '6x': 310,
    '7x': 360,
    '8x': 420,
    '9x': 470,
    '10x': 530,
  };
  return pxPerSecondMap[String(speed)] || 210;
};

/**
 * Lightbox modal — fullscreen image overlay used by `image` elements with
 * `content.lightbox: true`. Click anywhere or press ESC to close.
 */
const ImageLightbox: React.FC<{
  src: string;
  alt: string;
  onClose: () => void;
}> = ({ src, alt, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Image preview"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 cursor-zoom-out"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(4px)',
        animation: 'gb-lightbox-fade 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes gb-lightbox-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gb-lightbox-zoom {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <button
        type="button"
        aria-label="Close lightbox"
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition-colors"
      >
        <i className="fa-solid fa-xmark" />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain shadow-2xl rounded"
        style={{ animation: 'gb-lightbox-zoom 0.25s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </div>
  );
};

const MarqueeTextElement: React.FC<{
  id: string;
  text: string;
  speed: unknown;
  direction: 'left' | 'right';
  readOnly: boolean;
  selectedClass: string;
  textSizeClass: string;
  textStyle: React.CSSProperties;
  safeStyle: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onBlurText: (value: string) => void;
  pauseOnHover?: boolean;
  edgeFade?: boolean;
}> = ({ id, text, speed, direction, readOnly, selectedClass, textSizeClass, textStyle, safeStyle, onClick, onBlurText, pauseOnHover, edgeFade }) => {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const [copyWidth, setCopyWidth] = useState<number>(0);

  useEffect(() => {
    const measure = () => {
      const el = spanRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setCopyWidth(rect.width);
    };
    measure();
    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [text]);

  const distancePx = Math.max(240, copyWidth); // fallback avoids “stuck” animation on first render
  const pxPerSecond = getMarqueePxPerSecond(speed);
  const durationSeconds = Math.max(2, distancePx / Math.max(60, pxPerSecond));

  const wrapperStyle: React.CSSProperties = {
    margin: (safeStyle as any).margin,
    padding: safeStyle.padding || '6px 16px',
    backgroundColor: (safeStyle as any).backgroundColor || 'rgba(0,0,0,0.35)',
    borderRadius: (safeStyle as any).borderRadius,
    width: (safeStyle as any).width || '100%',
    height: (safeStyle as any).height,
    minHeight: (safeStyle as any).minHeight,
    maxHeight: (safeStyle as any).maxHeight,
    overflow: 'hidden',
    // Edge fade — soft gradient mask on left/right edges so the marquee fades in/out
    ...(edgeFade ? {
      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
    } : {}),
  };

  const trackStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    willChange: 'transform',
    animationName: direction === 'right' ? 'gb-marquee-right' : 'gb-marquee-left',
    animationDuration: `${durationSeconds}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    // CSS var used by keyframes for pixel-accurate distance
    ['--gb-marquee-distance' as any]: `${distancePx}px`
  };

  const editableTextStyle: React.CSSProperties = { ...textStyle };

  return (
    <div
      key={`${id}-marquee-${direction}-${String(speed)}`}
      className={`outline-none rounded relative transition-all cursor-pointer ${textSizeClass} ${selectedClass} ${pauseOnHover ? 'gb-marquee-pause-on-hover' : ''}`}
      style={wrapperStyle}
      onClick={onClick}
    >
      <style>{`
        @keyframes gb-marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-1 * var(--gb-marquee-distance))); }
        }
        @keyframes gb-marquee-right {
          0% { transform: translateX(calc(-1 * var(--gb-marquee-distance))); }
          100% { transform: translateX(0); }
        }
        .gb-marquee-pause-on-hover:hover > div { animation-play-state: paused; }
      `}</style>

      <div
        className="w-max"
        style={trackStyle}
      >
        <span
          ref={(node) => {
            spanRef.current = node;
            bindEditableHtml(node, `${id}-marquee-text`, text);
          }}
          style={editableTextStyle}
          contentEditable={!readOnly}
          {...editableFocusBlur(`${id}-marquee-text`, readOnly, onBlurText)}
        />
        <span style={editableTextStyle} dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </div>
  );
};

export const ElementsSection: React.FC<ElementsSectionProps> = ({
  section,
  onTextEdit,
  onElementUpdate,
  onElementSelect,
  onOpenInternalLink,
  selectedElementId,
  buttonClass,
  readOnly = false,
  isWrapped = true,
  themeColors,
  publishedImageBoxDetailHandler,
  sitePathname = '',
  sitePageType = '',
}) => {
  const elements = section.elements || [];
  const openInternalLinkFromContext = useOpenInternalLink();
  const resolveOpenInternalLink = onOpenInternalLink || openInternalLinkFromContext;
  const [activeTabs, setActiveTabs] = useState<Record<string, number>>({});
  // Open lightbox keyed by element id — null when no lightbox is open
  const [openLightboxId, setOpenLightboxId] = useState<string | null>(null);
  /** Word-limit preview stays truncated until the user clicks to edit (then expands to full copy). */
  const [limitEditIds, setLimitEditIds] = useState<Record<string, true>>({});
  const [linkChooser, setLinkChooser] = useState<{
    element: WebsiteElement;
    href: string;
    x: number;
    y: number;
  } | null>(null);

  const { themeData } = useTheme();
  // Site-wide global element-style overrides (sit between theme and per-element style).
  const globalElementStyles = useGlobalElementStyles();
  const defaultSizes = useDefaultSizes();
  // Headings — `all` defaults + per-level (h1..h6) + legacy flat `heading`
  const gHeadings    = globalElementStyles?.headings || {};
  const gHeadingAll  = gHeadings.all || {};
  const gHeadingLegacy = globalElementStyles?.heading || {};
  // Compose a heading getter that respects level + light/dark mode.
  const getHeadingStyleFor = (level: 'h1'|'h2'|'h3'|'h4'|'h5'|'h6', light: boolean) => {
    const lvl = (gHeadings as any)[level] || {};
    // Per-level / all mode color only — never fall back across modes.
    // Legacy flat `heading.color` is usually dark-canvas light text and breaks light sections.
    const modeColor = light
      ? (lvl.colorLight ?? gHeadingAll.colorLight)
      : (lvl.color ?? gHeadingAll.color);
    const legacy = gHeadingLegacy.color as string | undefined;
    const legacySafe =
      !legacy
        ? undefined
        : light
          ? (isDarkCanvasTextColor(legacy) ? undefined : legacy)
          : (isDarkCanvasTextColor(legacy) ? legacy : undefined);
    return {
      color: modeColor ?? legacySafe,
      fontSize:        lvl.fontSize ?? gHeadingAll.fontSize,
      fontFamily:      lvl.fontFamily ?? gHeadingAll.fontFamily ?? gHeadingLegacy.fontFamily,
      fontWeight:      lvl.fontWeight ?? gHeadingAll.fontWeight ?? gHeadingLegacy.fontWeight,
      lineHeight:      lvl.lineHeight ?? gHeadingAll.lineHeight ?? gHeadingLegacy.lineHeight,
      letterSpacing:   lvl.letterSpacing ?? gHeadingAll.letterSpacing ?? gHeadingLegacy.letterSpacing,
      highlightColor:  (light ? lvl.highlightColorLight : lvl.highlightColor)
                       ?? (light ? gHeadingAll.highlightColorLight : gHeadingAll.highlightColor)
                       ?? gHeadingLegacy.highlightColor,
    } as Record<string, string | undefined>;
  };
  const gText    = globalElementStyles?.text    || {};
  const gButton  = globalElementStyles?.button  || {};
  const gIcon    = globalElementStyles?.icon    || {};
  const gList    = globalElementStyles?.list    || {};
  const gBadge   = globalElementStyles?.badge   || {};

  // Get theme colors from section styles or passed prop.
  // Prefer actual background luminance over themeMode — dark mode + cream/white
  // bg (or light mode + dark bg) was painting unreadable element colors.
  const sectionStyles = (section.styles || {}) as Record<string, unknown>;
  const sectionBgResolved = resolveSectionBackground(section.styles as any, {
    defaultSurface:
      (sectionStyles.backgroundColor as string) ||
      (themeColors as any)?.backgroundColor ||
      (themeColors as any)?.cardBackgroundColor ||
      '',
  });
  const sectionSurfaceForLuminance =
    (sectionBgResolved.backgroundColor as string | undefined) ||
    (sectionStyles.backgroundColor as string) ||
    (themeColors as any)?.backgroundColor;
  const isLightMode = resolveIsLightSurface({
    themeMode: (section.styles?.themeMode as string) || (themeColors as any)?.themeMode,
    backgroundColor: sectionSurfaceForLuminance,
    fallbackBackgroundColor: (themeColors as any)?.cardBackgroundColor,
  });
  // themeData may be { name, elements: {...} } or the elements object directly — normalise the same way SectionRenderer does
  const td = (themeData as any)?.elements || themeData || {};
  const tdLight = (td as any)?.light || {};
  const baseTheme = {
    // Globals win over theme tokens but per-section/per-element overrides still trump globals.
    // Drop section title/text tokens that disagree with the resolved surface.
    titleColor: (() => {
      const raw = section.styles?.titleColor as string | undefined;
      if (raw && isLightMode && isDarkCanvasTextColor(raw)) return undefined;
      if (raw && !isLightMode && !isDarkCanvasTextColor(raw)) return undefined;
      return raw;
    })()
      || (isLightMode ? gHeadingAll.colorLight : gHeadingAll.color)
      || (isLightMode ? undefined : gHeadingLegacy.color)
      || (isLightMode ? tdLight?.heading : td?.heading)
      || (isLightMode ? '#111827' : '#F8FAFC'),
    textColor: (() => {
      const raw = section.styles?.textColor as string | undefined;
      if (raw && isLightMode && isDarkCanvasTextColor(raw)) return undefined;
      if (raw && !isLightMode && !isDarkCanvasTextColor(raw)) return undefined;
      return raw;
    })()
      || (isLightMode ? gText.colorLight : gText.color)
      || (isLightMode ? tdLight?.description : td?.description)
      || (isLightMode ? '#4B5563' : '#D1D5DB'),
    backgroundColor: (sectionStyles?.backgroundColor as string) || td?.surface || '',
    accordionQuestionColor:
      (sectionStyles?.accordionQuestionColor as string) ||
      td?.accordion?.questionColor ||
      td?.heading ||
      (isLightMode ? '#111827' : '#F8FAFC'),
    accordionAnswerColor:
      (sectionStyles?.accordionAnswerColor as string) ||
      td?.accordion?.answerColor ||
      td?.description ||
      (isLightMode ? '#4B5563' : '#D1D5DB'),
    cardBackgroundColor: (sectionStyles?.cardBackgroundColor as string) || td?.cardBackground || td?.surface || (isLightMode ? '#FFFFFF' : '#131A20'),
    cardBorderColor: (sectionStyles?.cardBorderColor as string) || td?.cardBorder || td?.borderColor || (isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'),
    accordionBackgroundColor:
      (sectionStyles?.accordionBackgroundColor as string) ||
      (sectionStyles?.cardBackgroundColor as string) ||
      td?.cardBackground || td?.surface ||
      (isLightMode ? '#FFFFFF' : '#131A20'),
    accordionBorderColor:
      (sectionStyles?.accordionBorderColor as string) ||
      (sectionStyles?.cardBorderColor as string) ||
      td?.cardBorder || td?.borderColor ||
      (isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'),
    accentColor: section.styles?.accentColor || td?.accent || '#E11D48',
    iconColor: section.styles?.iconColor || gIcon.color || td?.icon || td?.accent || '#E11D48',
    buttonBackgroundColor:
      (section.styles?.buttonBackgroundColor &&
      !['#fff', '#ffffff', 'white'].includes(String(section.styles.buttonBackgroundColor).trim().toLowerCase())
        ? section.styles.buttonBackgroundColor
        : undefined) ||
      (gButton.backgroundColor &&
      !['#fff', '#ffffff', 'white'].includes(String(gButton.backgroundColor).trim().toLowerCase())
        ? gButton.backgroundColor
        : undefined) ||
      td?.primaryButton?.bg ||
      '#E11D48',
    buttonTextColor: section.styles?.buttonTextColor || gButton.color || td?.primaryButton?.text || '#FFFFFF',
    // Globals exposed for renders that read these directly off the theme bag
    titleFontWeight: gHeadingAll.fontWeight ?? gHeadingLegacy.fontWeight,
    titleLineHeight: gHeadingAll.lineHeight ?? gHeadingLegacy.lineHeight,
    titleLetterSpacing: gHeadingAll.letterSpacing ?? gHeadingLegacy.letterSpacing,
    descriptionFontSize: gText.fontSize,
    descriptionLineHeight: gText.lineHeight,
    listMarkerColor: gList.markerColor,
    listItemGap: gList.itemGap,
    badgeBackgroundColor: gBadge.backgroundColor,
    badgeTextColor: gBadge.color,
    badgeBorderRadius: gBadge.borderRadius,
    buttonBorderColor: (section.styles as any)?.borderColor || (section.styles as any)?.secondaryButtonBorderColor || 'transparent',
    // Secondary button colors
    secondaryButtonBg: (sectionStyles?.secondaryButtonBg as string) || td?.secondaryButton?.bg || 'transparent',
    secondaryButtonText: (sectionStyles?.secondaryButtonText as string) || td?.secondaryButton?.text || td?.heading || '#F8FAFC',
    secondaryButtonBorder: (sectionStyles?.secondaryButtonBorder as string) || td?.secondaryButton?.border || td?.ring || td?.accent || '#E11D48',
    subheadingColor: section.styles?.subheadingColor || td?.subheading || td?.description || '#D1D5DB',
    iconBgColor: section.styles?.iconBgColor || gIcon.backgroundColor || td?.iconBg || `${td?.icon || td?.accent || '#E11D48'}15`,
    secondaryHeadingColor: (sectionStyles?.secondaryHeadingColor as string)
      || (isLightMode ? gHeadingAll.highlightColorLight : gHeadingAll.highlightColor)
      || gHeadingLegacy.highlightColor
      || (sectionStyles?.buttonBackgroundColor as string) || td?.secondaryHeading || td?.primaryButton?.bg || td?.accent || '#E11D48',

    // Font fallbacks from global theme typography (per-element global overrides win)
    titleFontFamily: gHeadingAll.fontFamily || gHeadingLegacy.fontFamily || ((themeData as any)?.typography || td?.typography)?.h1?.fontFamily,
    subtitleFontFamily: gHeadings.h2?.fontFamily || gHeadingAll.fontFamily || ((themeData as any)?.typography || td?.typography)?.h2?.fontFamily,
    descriptionFontFamily: gText.fontFamily || ((themeData as any)?.typography || td?.typography)?.p?.fontFamily,
    buttonFontFamily: ((themeData as any)?.typography || td?.typography)?.button?.fontFamily,
    
    // Text Transform fallbacks from section styles
    titleTextTransform: section.styles?.titleTextTransform,
    subtitleTextTransform: section.styles?.subtitleTextTransform,
    descriptionTextTransform: section.styles?.descriptionTextTransform,

    // Section-level typography (sliders / H1–H6) — used when element has no inline override
    titleFontSize: (sectionStyles?.titleSize as string) || (sectionStyles?.titleFontSize as string) || gHeadings.h2?.fontSize || gHeadingAll.fontSize || (sectionStyles?.fontSize as string),
    subtitleFontSize:
      (sectionStyles?.subtitleSize as string) ||
      (sectionStyles?.subtitleFontSize as string),
  };

  const theme = (() => {
    const incoming = { ...(themeColors || {}) } as Record<string, any>;
    if (isLightMode) {
      if (isDarkCanvasTextColor(incoming.titleColor)) delete incoming.titleColor;
      if (isDarkCanvasTextColor(incoming.textColor)) delete incoming.textColor;
      if (isDarkCanvasTextColor(incoming.subheadingColor)) delete incoming.subheadingColor;
      if (isDarkCanvasTextColor(incoming.accordionQuestionColor)) delete incoming.accordionQuestionColor;
      if (isDarkCanvasTextColor(incoming.accordionAnswerColor)) delete incoming.accordionAnswerColor;
    } else {
      // Drop light-surface ink tokens on dark surfaces
      const inkLike = (c?: string) => {
        const s = String(c || '').trim().toLowerCase();
        return (
          s === '#111827' ||
          s === '#1a1025' ||
          s === '#0f172a' ||
          s === '#4b5563' ||
          s === '#6b6178' ||
          s === '#6b7280'
        );
      };
      if (inkLike(incoming.titleColor)) delete incoming.titleColor;
      if (inkLike(incoming.textColor)) delete incoming.textColor;
      if (inkLike(incoming.subheadingColor)) delete incoming.subheadingColor;
      if (inkLike(incoming.accordionQuestionColor)) delete incoming.accordionQuestionColor;
      if (inkLike(incoming.accordionAnswerColor)) delete incoming.accordionAnswerColor;
    }
    return { ...baseTheme, ...incoming };
  })();
  
  // Helper to merge element style with theme defaults
  // Only uses element color if it's explicitly set (not undefined/null/empty)
  const getThemeAwareStyle = (elementStyle: any, colorKey: 'color' | 'backgroundColor' | 'borderColor', themeColor?: string): any => {
    const mergedStyle = { ...elementStyle };
    
    // If element has explicit color, use it; otherwise use theme color
    if (themeColor && (!elementStyle[colorKey] || elementStyle[colorKey] === 'transparent' || elementStyle[colorKey] === '')) {
      mergedStyle[colorKey] = themeColor;
    }
    
    return mergedStyle;
  };

  const handleContentUpdate = (id: string, key: string, value: any) => {
    if (readOnly) return;
    
    // Special handling for virtual hero elements
    if (id.includes('-hero-title') && key === 'text' && onTextEdit) {
      onTextEdit('title', value);
    } else if (id.includes('-hero-subtitle') && key === 'text' && onTextEdit) {
      onTextEdit('subtitle', value);
    } else if (id.includes('-hero-button') && key === 'text' && onTextEdit) {
      onTextEdit('ctaText', value);
    } else if (id.includes('-hero-button') && key === 'link' && onTextEdit) {
      onTextEdit('ctaHref', value);
    } else if (id.includes('-hero-image') && key === 'imageUrl' && onTextEdit) {
      onTextEdit('imageUrl', value);
    } else if (id.includes('-hero-badge') && key === 'text' && onTextEdit) {
      onTextEdit('badgeText', value);
    }

    const el = elements.find(e => e.id === id);
    if (el) {
      // Heading: last-word highlight. Sidebar + canvas must stay identical while typing.
      // Typing often lands inside the highlight <span>; we re-canonicalize DOM immediately.
      if (el.type === 'heading' && key === 'text') {
        handleHeadingTextCommit(id, el, String(value || ''));
        return;
      }

      onElementUpdate(id, { ...el, content: { ...el.content, [key]: value } });
      return;
    }

    // Virtual / hydrated element present in the canvas but not yet in section.elements —
    // still push content so the sidebar + upsert path stay in sync while typing.
    onElementUpdate(id, { content: { [key]: value } } as Partial<WebsiteElement>);
  };

  /**
   * Heading live edit — canvas highlight must match sidebar (last word only).
   * - Trailing Space: do NOT rewrite (keeps the space so the next word can be typed).
   * - After the next word starts: rewrite DOM so only that last word is highlighted,
   *   restoring caret by plain-text offset so typing stays smooth.
   * - Blur: always rewrite highlight structure.
   */
  const applyHeadingParts = (
    id: string,
    el: WebsiteElement,
    parts: ReturnType<typeof splitHeadingToHighlightParts>,
    highlightSpanStyle: string | undefined,
    opts: {
      rewriteDom: boolean;
      caretOffset?: number | null;
      focused?: boolean;
    }
  ) => {
    if (id.includes('-hero-title') && onTextEdit) {
      onTextEdit('title', parts.text);
    }

    onElementUpdate(id, {
      type: el.type || 'heading',
      content: {
        ...(el.content || {}),
        text: parts.text,
        textBefore: parts.textBefore,
        highlightedText: parts.highlightedText,
        textAfter: parts.textAfter,
      },
    });

    if (!opts.rewriteDom) {
      if (opts.caretOffset !== null && opts.caretOffset !== undefined) {
        restoreCaretAfterReactUpdate(id, opts.caretOffset);
      }
      return;
    }

    const node = getEditableNode(id);
    const style =
      highlightSpanStyle ||
      node?.getAttribute('data-gb-highlight-style') ||
      '';
    const html = buildHeadingEditableHtml(parts, style);

    if (opts.focused) {
      const plainAfter = `${parts.text}${parts.trailingSpace ? ' ' : ''}`;
      const safeOffset =
        opts.caretOffset === null || opts.caretOffset === undefined
          ? plainAfter.length
          : Math.max(0, Math.min(opts.caretOffset, plainAfter.length));
      forceSyncEditableHtml(id, html, {
        caret: 'preserve',
        caretOffset: safeOffset,
      });
      // Keep caret after React re-render from onElementUpdate.
      restoreCaretAfterReactUpdate(id, safeOffset);
      return;
    }

    forceSyncEditableHtml(id, html, { caret: 'none' });
  };

  const handleHeadingTextCommit = (
    id: string,
    el: WebsiteElement,
    rawHtml: string,
    highlightSpanStyle?: string
  ) => {
    cancelCaretRestore(id);
    const node = getEditableNode(id);
    const caretOffset =
      getLiveCaretOffset(id) ?? (node ? getPlainTextCaretOffset(node) : null);
    const parts = splitHeadingToHighlightParts(rawHtml);
    const focused = isInlineEditing(id);
    // Only skip rewrite while the line still ends with a Space (so Space isn't eaten).
    // As soon as the next word is typed, rewrite so canvas highlight matches sidebar.
    const holdingSpace = focused && parts.trailingSpace === true;

    applyHeadingParts(id, el, parts, highlightSpanStyle, {
      rewriteDom: !holdingSpace,
      caretOffset,
      focused,
    });

    if (!parts.trailingSpace) setLiveTrailingSpace(id, false);
  };

  const handleArrayContentUpdate = (id: string, arrayKey: string, index: number, itemKey: string, value: any) => {
    if (readOnly) return;
    const el = elements.find(e => e.id === id);
    if(el && el.content[arrayKey]) {
        const newArray = [...el.content[arrayKey]];
        newArray[index] = { ...newArray[index], [itemKey]: value };
        onElementUpdate(id, { ...el, content: { ...el.content, [arrayKey]: newArray } });
    }
  };

  const handleClick = (e: React.MouseEvent, element: WebsiteElement) => {
      e.stopPropagation();
      // Signal to the iframe background click handler that an element was selected,
      // so it doesn't fire deselect on the same click.
      try { (window as any).__gbElementClicked = true; } catch (_) {}
      if (onElementSelect) {
          onElementSelect(element.id, element);
      }
  };

  /**
   * Edit mode: ONLY when the element has a real link → Open page | Select to edit.
   * No link → normal select. Never navigates the iframe.
   */
  const handleLinkedClick = (
    e: React.MouseEvent,
    element: WebsiteElement,
    href?: string | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try { (window as any).__gbElementClicked = true; } catch (_) {}

    const trimmed = String(href || '').trim();
    if (!hasUsableHref(trimmed)) {
      // No link on this element — just select for edit (no chooser).
      if (onElementSelect) onElementSelect(element.id, element);
      return;
    }

    if (readOnly) {
      resolveOpenInternalLink?.(trimmed);
      return;
    }

    const x = typeof e.clientX === 'number' ? e.clientX : 24;
    const y = typeof e.clientY === 'number' ? e.clientY : 24;
    setLinkChooser({ element, href: trimmed, x, y });
  };

  /** Select element, or show link chooser when this editable element has a link. */
  const handleElementActivate = (
    e: React.MouseEvent,
    element: WebsiteElement,
    href?: string | null
  ) => {
    if (!readOnly && hasUsableHref(href)) {
      handleLinkedClick(e, element, href);
      return;
    }
    handleClick(e, element);
  };

  const dismissLinkChooser = () => setLinkChooser(null);

  const renderLinkChooser = () => {
    if (readOnly || !linkChooser) return null;
    return (
      <LinkClickChooser
        x={linkChooser.x}
        y={linkChooser.y}
        href={linkChooser.href}
        onDismiss={dismissLinkChooser}
        onSelect={() => {
          const el = linkChooser.element;
          dismissLinkChooser();
          try { (window as any).__gbElementClicked = true; } catch (_) {}
          onElementSelect?.(el.id, el);
        }}
        onOpen={() => {
          const href = linkChooser.href;
          dismissLinkChooser();
          if (resolveOpenInternalLink) {
            resolveOpenInternalLink(href);
          } else if (/^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)) {
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        }}
      />
    );
  };

  const renderElement = (el: WebsiteElement) => {
    const { id, content, style } = el;
    // Normalize so aliases like `navigation` (content-site chrome) always match.
    const type = String(el.type || '').toLowerCase().trim();
    const bindHtml = (elementId: string, html: string) => (node: HTMLElement | null) =>
      bindEditableHtml(node, elementId, html);
    const editHandlers = (
      elementId: string,
      onCommit: (html: string) => void,
      liveCommit = true
    ) => editableFocusBlur(elementId, readOnly, onCommit, liveCommit);
    const isSelected = selectedElementId === id;
    const selectedClass = readOnly
      ? ''
      : (isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black z-20' : 'hover:ring-1 hover:ring-white/20');

    // STEP 1: Merge Global Element Defaults with Element's specific style
    const renderStyle = {
      ...(ELEMENT_DEFAULTS[type === 'navigation' ? 'nav-menu' : type] || ELEMENT_DEFAULTS[el.type] || {}),
      ...(el.style || {})
    };

    let mergedStyle = { ...renderStyle };
    
    // Only pre-fill buttons globally, let individual case blocks handle their specific semantic colors
    if (theme) {
      if (type === 'button' || type === 'call-to-action') {
        const variant = renderStyle.buttonVariant || (el.content as any)?.buttonVariant || 'primary';
        const isNearWhiteBg = (v: unknown) => {
          const s = String(v || '').trim().toLowerCase();
          return (
            s === '#fff' ||
            s === '#ffffff' ||
            s === 'white' ||
            s === 'rgb(255,255,255)' ||
            s === 'rgb(255, 255, 255)' ||
            s === 'rgba(255,255,255,1)' ||
            s === 'rgba(255, 255, 255, 1)'
          );
        };
        const missingBg =
          !renderStyle?.backgroundColor ||
          renderStyle.backgroundColor === 'transparent' ||
          renderStyle.backgroundColor === '' ||
          (variant === 'primary' && isNearWhiteBg(renderStyle.backgroundColor));
        if (missingBg) {
          if (variant === 'secondary') {
            mergedStyle.backgroundColor = (theme as any).secondaryButtonBg || 'transparent';
          } else if (variant === 'outline') {
            mergedStyle.backgroundColor = 'transparent';
          } else if (variant === 'ghost') {
            mergedStyle.backgroundColor = 'transparent';
          } else {
            mergedStyle.backgroundColor = theme.buttonBackgroundColor;
          }
        }
        if (!renderStyle?.color || renderStyle.color === 'transparent' || renderStyle.color === '') {
          if (variant === 'secondary') {
            mergedStyle.color = (theme as any).secondaryButtonText || theme.buttonTextColor;
          } else if (variant === 'outline' || variant === 'ghost') {
            mergedStyle.color = theme.accentColor || theme.buttonBackgroundColor;
          } else {
            mergedStyle.color = theme.buttonTextColor;
          }
        }
      }
    }
    
    const safeStyle = getSafeStyle(mergedStyle);

    // ---- Layout elements: row (N columns) + column (vertical group) --------
    // Canvas-based variants (HeroDarkBold, HeroCanvasTrust, …) lay elements out
    // with `row`/`column` wrappers. These must render everywhere ElementsSection
    // renders (live preview + published), not only inside CanvasFreeform — else
    // their children (buttons, stats, stars) silently drop to the fallback.
    if (type === 'row') {
      const cc = (content || {}) as any;
      const rst = (style || {}) as any;
      // Layout props are editable from the Row styles panel (style wins) with the
      // element's own content as the fallback — Elementor container parity.
      const cols = Math.min(Math.max(parseInt(String(rst.columnCount ?? cc.columnCount), 10) || 2, 1), 4);
      const kids: WebsiteElement[] = Array.isArray(cc.children) ? cc.children : [];
      const gap = rst.columnGap || rst.gap || cc.gap || '1.5rem';
      const align = rst.verticalAlign || cc.verticalAlign || 'stretch';
      // Column widths: default equal (1fr each). If `columnRatios` is given
      // (e.g. [30,70] or ['1fr','2fr']) use those for asymmetric layouts —
      // Elementor-style 30/70, 70/30, sidebar layouts, etc.
      const ratioSrc = rst.columnRatios ?? cc.columnRatios;
      const ratios: any[] = Array.isArray(ratioSrc)
        ? ratioSrc
        : (typeof ratioSrc === 'string' && ratioSrc.trim()
            ? ratioSrc.split(/[\/,\s]+/).filter(Boolean)
            : []);
      const gridTemplateColumns = (ratios.length === cols && cols > 1)
        ? ratios.map((r) => (typeof r === 'number' ? `${r}fr` : String(r))).join(' ')
        : `repeat(${cols}, minmax(0, 1fr))`;
      // Multi-column rows collapse to a single column on mobile (≤767px), so
      // the layout never squishes side-by-side content on small screens.
      const rowUid = `gbrow-${String(id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
      const stackOnMobile = cols > 1 && (rst.stackOnMobile ?? cc.stackOnMobile) !== false;
      // Layout mode: 'grid' (default, equal/ratio columns) or 'flex' (Elementor
      // Container flexbox — direction / justify / align / wrap).
      const rowLayoutMode = rst.layoutMode === 'flex' ? 'flex' : 'grid';
      // Strip layout-only keys so they don't leak into the wrapper's inline CSS.
      const { columnCount: _cc, columnGap: _cg, columnRatios: _cr, verticalAlign: _va, stackOnMobile: _sm, layoutMode: _lm, flexDirection: _fd, justifyContent: _jc, flexWrap: _fw, ...rowBoxStyle } = rst;

      if (rowLayoutMode === 'flex') {
        const flexStyle: React.CSSProperties = {
          ...(rowBoxStyle as any),
          display: 'flex',
          flexDirection: (rst.flexDirection || 'row') as any,
          justifyContent: rst.justifyContent || 'flex-start',
          alignItems: align === 'stretch' ? 'stretch' : align,
          flexWrap: (rst.flexWrap || 'wrap') as any,
          gap,
        };
        return (
          <div key={id} className={`gb-canvas-row ${rowUid}`} style={flexStyle}>
            {stackOnMobile && (
              <style>{`@media (max-width:767px){.${rowUid}{flex-direction:column !important;}}`}</style>
            )}
            {kids.map((child) => (
              <div key={child.id} className="min-w-0">{renderElement(child)}</div>
            ))}
          </div>
        );
      }

      return (
        <div
          key={id}
          className={`gb-canvas-row grid ${rowUid}`}
          style={{ ...(rowBoxStyle as any), gridTemplateColumns, gap, alignItems: align }}
        >
          {stackOnMobile && (
            <style>{`@media (max-width:767px){.${rowUid}{grid-template-columns:1fr !important;}}`}</style>
          )}
          {kids.map((child) => (
            <div key={child.id} className="min-w-0">{renderElement(child)}</div>
          ))}
        </div>
      );
    }
    if (type === 'column') {
      const cc = (content || {}) as any;
      const cst = (style || {}) as any;
      const kids: WebsiteElement[] = Array.isArray(cc.children) ? cc.children : [];
      const gap = cst.columnGap || cst.gap || cc.gap || '1rem';
      const alignItems = cst.alignItems || cc.horizontalAlign || 'flex-start';
      const justifyContent = cst.justifyContent || cc.verticalAlign || undefined;
      const { columnGap: _ccg, ...colBoxStyle } = cst;
      return (
        <div key={id} className="gb-canvas-col flex flex-col min-w-0" style={{ ...(colBoxStyle as any), gap, alignItems, justifyContent }}>
          {/* Each child is wrapped in a real element (not a Fragment) so the
              data-element-id responsive wrapper can attach without a warning. */}
          {kids.map((child) => (
            <div key={child.id} className="min-w-0">{renderElement(child)}</div>
          ))}
        </div>
      );
    }

    switch (type) {
        case 'heading': {
            const c: any = content || {};
            const isMainSectionTitle =
              id === `${section.id}-hero-title` || id === `${section.id}-title`;
            const sectionHeadingTag = (sectionStyles?.titleHeadingTag as string) || '';
            let headingTag = resolveHeadingHtmlTag(
              c.htmlTag ||
                (isMainSectionTitle && sectionHeadingTag ? sectionHeadingTag : undefined) ||
                'h2',
              'h2'
            ) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
            // SEO guard — exactly one <h1> per page lives in the hero section.
            // If a non-hero variant ever asks for h1 (legacy data, hand-edited
            // export, or a future variant that forgets), silently demote to h2
            // so we don't ship a multi-h1 page. This is cheap defence-in-depth;
            // it won't override anything an SEO-aware author should be doing.
            if (headingTag === 'h1' && section.type !== 'hero') {
              headingTag = 'h2';
            }
            // Per-level + light/dark global overrides for THIS heading's tag.
            const gHead = getHeadingStyleFor(headingTag, isLightMode);
            // Dark-canvas global heading colors must not win on light sections.
            const gHeadColorRaw = gHead.color;
            const gHeadColorLooksLight = (() => {
              const s = String(gHeadColorRaw || '').trim().toLowerCase();
              if (!s) return false;
              return (
                s === '#fff' ||
                s === '#ffffff' ||
                s === 'white' ||
                s === '#f8fafc' ||
                s === '#f1f5f9' ||
                s === '#e2e8f0' ||
                s === '#d1d5db' ||
                s === '#cbd5e1'
              );
            })();
            const gHeadColor =
              isLightMode && gHeadColorLooksLight ? undefined : gHeadColorRaw;

            const resolvedTitleFontSize = resolveHeadingFontSize({
              elementStyle: renderStyle,
              sectionStyles,
              isHeroTitle: isMainSectionTitle,
              headingTag,
              globalHeadings: gHeadings,
              defaultSizes,
            });
            const resolvedHeadingFontFamily =
              safeStyle.fontFamily && safeStyle.fontFamily.trim() !== ''
                ? safeStyle.fontFamily
                : (gHead.fontFamily || theme?.titleFontFamily);

            // Color resolution — explicit element.style.color always wins (never luminance-replaced).
            const titleCol = resolveElementColor({
              elementStyle: safeStyle,
              colorKey: 'color',
              themeFallback: gHeadColor || theme?.titleColor || renderStyle.color,
              isLightMode,
              lightFallback: '#111827',
              darkFallback: '#F8FAFC',
            });

            const accentCol = resolveHighlightAccentColor({
              elementStyle: renderStyle,
              contentHighlightColor: c.highlightColor,
              headingGlobals: gHead,
              themeSecondary: theme?.secondaryHeadingColor,
              themeAccent: theme?.accentColor,
              titleColor: String(titleCol),
              isLightMode,
            });

            // Gradient text fill (when both colors set)
            const grad1 = renderStyle.gradientFrom;
            const grad2 = renderStyle.gradientTo;
            const useGradient = !!(grad1 && grad2);

            // Highlight mode: color (default) | background | underline
            const highlightMode: 'color' | 'background' | 'underline' =
                (c.highlightMode === 'background' || c.highlightMode === 'underline') ? c.highlightMode : 'color';

            const highlightSpanStyle = buildHeadingHighlightSpanStyle(
              accentCol,
              highlightMode,
              useGradient
            );

            const headingStyle: React.CSSProperties = {
                ...safeStyle,
                // When gradient is active we set transparent fill + bg-clip; else solid color
                color: useGradient ? 'transparent' : titleCol,
                ...(useGradient ? {
                    backgroundImage: `linear-gradient(135deg, ${grad1}, ${grad2})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                } : {}),
                fontWeight: renderStyle.fontWeight || gHead.fontWeight || 'bold',
                fontSize: resolvedTitleFontSize,
                textAlign: (renderStyle.textAlign as any) || 'left',
                textTransform: safeStyle.textTransform || theme?.titleTextTransform || undefined,
                fontFamily: resolvedHeadingFontFamily && resolvedHeadingFontFamily.trim() !== '' ? resolvedHeadingFontFamily : undefined,
                lineHeight: renderStyle.lineHeight || gHead.lineHeight || undefined,
                letterSpacing: renderStyle.letterSpacing || gHead.letterSpacing || undefined,
                fontStyle: renderStyle.fontStyle || undefined,
                textDecoration: renderStyle.textDecoration || undefined,
                textShadow: renderStyle.textShadow || undefined,
                // Don't force margin:0 inline — that overrides parent `space-y-*` Tailwind classes
                // (inline styles win over class selectors). Let parent layout handle spacing.
                // Only zero browser default margins via reset class on the element below.
                // Honor a user-set padding (Advance tab). Only fall back to 0 (reset the
                // browser default) when the user hasn't set any padding.
                padding: ((safeStyle as any).padding
                    || (safeStyle as any).paddingTop || (safeStyle as any).paddingBottom
                    || (safeStyle as any).paddingLeft || (safeStyle as any).paddingRight)
                    ? (safeStyle as any).padding
                    : 0,
            };
            // Remove undefined properties
            if (!headingStyle.fontFamily) delete headingStyle.fontFamily;

            let headingText = c.text || '';
            const hasPartValues = !!(
              String(c.textBefore || '').trim() ||
              String(c.highlightedText || '').trim() ||
              String(c.textAfter || '').trim()
            );
            let textBefore = c.textBefore || '';
            let highlightedText = c.highlightedText || '';
            let textAfter = c.textAfter || '';

            // Always last-word highlight when parts are missing/empty.
            if (!hasPartValues) {
              const split = splitHeadingToHighlightParts(
                String(c.text || '').replace(/<[^>]*>/g, ' ')
              );
              textBefore = split.textBefore;
              highlightedText = split.highlightedText;
              textAfter = split.textAfter;
              if (split.text) headingText = split.text;
            }

            if (highlightedText || textBefore || textAfter) {
                headingText = buildHeadingEditableHtml(
                  {
                    text: String(headingText || ''),
                    textBefore,
                    highlightedText,
                    textAfter,
                  },
                  highlightSpanStyle
                );
            }

            const safeHeadingTag = resolveHeadingHtmlTag(headingTag, 'h2');
            const headingLink = String(c.link || '').trim();
            const headingEl = React.createElement(
                safeHeadingTag,
                {
                    key: `${id}-${headingTag}`,
                    // m-0 resets browser default heading margin; parent `space-y-*` (sibling
                    // selector, higher specificity) re-applies the right vertical rhythm.
                    className: `font-bold outline-none relative transition-all cursor-pointer m-0 ${selectedClass}`,
                    style: headingStyle,
                    'data-gb-heading-id': id,
                    'data-gb-highlight-style': highlightSpanStyle,
                    ...(hasUsableHref(headingLink) && !readOnly
                      ? { 'data-gb-editable-link': '1' as const }
                      : {}),
                    onClick: !readOnly
                      ? (e: React.MouseEvent) => handleElementActivate(e, el, headingLink)
                      : undefined,
                    contentEditable: !readOnly,
                    ...createEditableHtmlProps(id, headingText, readOnly, (html) => {
                      const target = elements.find((e) => e.id === id) || el;
                      handleHeadingTextCommit(id, target, html, highlightSpanStyle);
                    }),
                }
            );

            // Kicker line above heading
            const kickerText = (c.kicker || '').toString().trim();
            const hasKicker = kickerText !== '';

            // Animation preset → motion variants. Each preset maps initial+animate frames.
            const animationPreset: string = c.animation || 'none';
            const animationDelay = Number(c.animationDelay) || 0;
            const animVariants: Record<string, { initial: any; animate: any }> = {
                'none':        { initial: {}, animate: {} },
                'fade-up':     { initial: { opacity: 0, y: 24 },                 animate: { opacity: 1, y: 0 } },
                'slide-left':  { initial: { opacity: 0, x: -32 },                animate: { opacity: 1, x: 0 } },
                'slide-right': { initial: { opacity: 0, x: 32 },                 animate: { opacity: 1, x: 0 } },
                'blur-in':     { initial: { opacity: 0, filter: 'blur(8px)' },   animate: { opacity: 1, filter: 'blur(0px)' } },
                'scale-in':    { initial: { opacity: 0, scale: 0.92 },           animate: { opacity: 1, scale: 1 } },
                'typewriter':  { initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, animate: { opacity: 1, clipPath: 'inset(0 0% 0 0)' } },
            };
            const animVar = animVariants[animationPreset] || animVariants.none;
            const hasAnimation = animationPreset !== 'none';

            // If neither kicker nor animation, just return the heading element directly (preserves behavior)
            if (!hasKicker && !hasAnimation) {
                return headingEl;
            }

            const wrapperContent = (
                <>
                    {hasKicker && (
                        <span
                            className="block outline-none"
                            style={{
                                color: renderStyle.kickerColor || accentCol,
                                fontSize: renderStyle.kickerFontSize || '0.75rem',
                                fontWeight: 800,
                                letterSpacing: renderStyle.kickerLetterSpacing || '0.18em',
                                textTransform: 'uppercase',
                                // Overridable gap between kicker and heading (default 0.75rem = mb-3)
                                marginBottom: (renderStyle as any).kickerBottomSpace || '0.75rem',
                            }}
                            ref={bindHtml(`${id}::kicker`, kickerText)}
                            contentEditable={!readOnly}
                            {...editHandlers(`${id}::kicker`, (html) => handleContentUpdate(id, 'kicker', html))}
                        />
                    )}
                    {headingEl}
                </>
            );

            if (hasAnimation) {
                return (
                    <AnimatedDiv
                        key={`${id}-anim`}
                        enabled={!readOnly}
                        initial={animVar.initial}
                        whileInView={animVar.animate}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.7, delay: animationDelay, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: 'block' }}
                    >
                        {wrapperContent}
                    </AnimatedDiv>
                );
            }

            // No animation but has kicker — plain wrapper
            return <div key={`${id}-wrap`}>{wrapperContent}</div>;
        }

        case 'text': {
            const c: any = content || {};
            const isSubtitleElement = id.includes('-hero-subtitle') || id.includes('subheading') || c.textSize === 'subheading';
            const textSizePreset = (c.textSize || 'base') as TextSizePreset;
            // Use el.style only — renderStyle includes ELEMENT_DEFAULTS which must not
            // override content.textSize presets (base / small / large / xl).
            const resolvedTextFontSize = resolveTextFontSize({
              elementStyle: (el.style || {}) as Record<string, unknown>,
              textSize: textSizePreset,
              sectionSubtitleTextSize: section.content?.subtitleTextSize as TextSizePreset | undefined,
              isHeroSubtitle: id.includes('-hero-subtitle'),
              globalText: gText,
              defaultSizes,
            });
            const resolvedTextFontFamily =
              safeStyle.fontFamily && safeStyle.fontFamily.trim() !== ''
                ? safeStyle.fontFamily
                : isSubtitleElement
                  ? theme?.subtitleFontFamily
                  : theme?.descriptionFontFamily;

            const linkColor = renderStyle.linkColor || (theme as any)?.linkColor || theme?.accentColor || '#3B82F6';

            const textStyle: React.CSSProperties = {
                ...safeStyle,
                color: resolveElementColor({
                  elementStyle: safeStyle,
                  colorKey: 'color',
                  themeFallback: isSubtitleElement ? theme.subheadingColor : theme.textColor,
                  isLightMode,
                  lightFallback: '#4B5563',
                  darkFallback: '#D1D5DB',
                }),
                fontWeight: renderStyle.fontWeight || gText.fontWeight || '400',
                fontSize: resolvedTextFontSize,
                textAlign: (renderStyle.textAlign as any) || 'left',
                textTransform: safeStyle.textTransform || (isSubtitleElement ? theme?.subtitleTextTransform : theme?.descriptionTextTransform) || undefined,
                fontFamily: resolvedTextFontFamily && resolvedTextFontFamily.trim() !== '' ? resolvedTextFontFamily : undefined,
                lineHeight: renderStyle.lineHeight || undefined,
                letterSpacing: renderStyle.letterSpacing || undefined,
                fontStyle: renderStyle.fontStyle || undefined,
                textDecoration: renderStyle.textDecoration || undefined,
                textShadow: renderStyle.textShadow || undefined,
                marginBottom: renderStyle.paragraphSpacing || undefined,
            };
            if (!textStyle.fontFamily) delete textStyle.fontFamily;

            // Drop cap for first letter (magazine vibe)
            const dropCapEnabled = !!renderStyle.dropCap;
            const dropCapSize = renderStyle.dropCapSize || '3em';
            const dropCapColor = renderStyle.dropCapColor || theme?.accentColor || textStyle.color;

            // Animation preset wrapper
            const animationPreset: string = c.animation || 'none';
            const animationDelay = Number(c.animationDelay) || 0;
            const animVariants: Record<string, { initial: any; animate: any }> = {
                'none':        { initial: {}, animate: {} },
                'fade-up':     { initial: { opacity: 0, y: 20 },                 animate: { opacity: 1, y: 0 } },
                'slide-left':  { initial: { opacity: 0, x: -28 },                animate: { opacity: 1, x: 0 } },
                'slide-right': { initial: { opacity: 0, x: 28 },                 animate: { opacity: 1, x: 0 } },
                'blur-in':     { initial: { opacity: 0, filter: 'blur(6px)' },   animate: { opacity: 1, filter: 'blur(0px)' } },
                'scale-in':    { initial: { opacity: 0, scale: 0.95 },           animate: { opacity: 1, scale: 1 } },
                'typewriter':  { initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, animate: { opacity: 1, clipPath: 'inset(0 0% 0 0)' } },
            };
            const animVar = animVariants[animationPreset] || animVariants.none;
            const hasAnimation = animationPreset !== 'none';

            // Per-element CSS injection for inline link color + drop cap
            const scopedCss = `
                #gb-${id.replace(/[^a-zA-Z0-9_-]/g, '_')} a { color: ${linkColor}; text-decoration: underline; text-underline-offset: 2px; }
                #gb-${id.replace(/[^a-zA-Z0-9_-]/g, '_')} a:hover { opacity: 0.85; }
                ${dropCapEnabled ? `#gb-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}::first-letter {
                    font-size: ${dropCapSize};
                    float: left;
                    line-height: 0.9;
                    margin-right: 0.08em;
                    margin-top: 0.05em;
                    color: ${dropCapColor};
                    font-weight: 700;
                }` : ''}
            `;
            const scopedId = `gb-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

            if (c.enableMarquee) {
                return (
                    <MarqueeTextElement
                      key={id}
                      id={id}
                      text={c.text || ''}
                      speed={c.marqueeSpeed}
                      direction={c.marqueeDirection === 'right' ? 'right' : 'left'}
                      readOnly={readOnly}
                      selectedClass={selectedClass}
                      textSizeClass=""
                      textStyle={textStyle}
                      safeStyle={safeStyle as any}
                      onClick={!readOnly ? (e) => handleClick(e, el) : undefined}
                      onBlurText={(v) => handleContentUpdate(id, 'text', v)}
                      pauseOnHover={!!c.marqueePauseOnHover}
                      edgeFade={!!c.marqueeEdgeFade}
                    />
                );
            }

            const fullTextHtml = c.text || '';
            // Focus OR explicit click-to-edit expands words preview. Selection alone does NOT —
            // so sidebar Max Lines / Word Limit update the canvas live while the element is selected.
            const focusedText = isInlineEditing(id) || !!limitEditIds[id];
            const limited = resolveLimitedTextDisplay({
              fullHtml: fullTextHtml,
              content: c,
              isFocused: focusedText,
            });
            const textEditable = !readOnly && limited.allowEdit;

            const paragraphEl = (
                <p
                    key={`${id}-${c.textSize || 'base'}-${resolvedTextFontSize}-${limited.limitKey}`}
                    id={scopedId}
                    data-gb-editable-id={id}
                    className={`outline-none rounded px-1 relative transition-all cursor-pointer ${selectedClass}`}
                    style={{
                      ...textStyle,
                      ...limited.clampStyle,
                      ...(limited.limit.mode === 'lines' && limited.limit.maxLines > 0
                        ? { lineHeight: textStyle.lineHeight || 1.7 }
                        : {}),
                    }}
                    title={
                      limited.limit.mode !== 'none' && !focusedText
                        ? plainTextForTruncate(fullTextHtml) || undefined
                        : undefined
                    }
                    {...(hasUsableHref(String(c.link || '').trim()) && !readOnly
                      ? { 'data-gb-editable-link': '1' }
                      : {})}
                    onClick={!readOnly ? (e: React.MouseEvent) => {
                      handleElementActivate(e, el, c.link);
                      if (limited.limit.mode === 'words' && !focusedText) {
                        setLimitEditIds((prev) => ({ ...prev, [id]: true }));
                      }
                    } : undefined}
                    ref={bindHtml(id, limited.displayHtml)}
                    contentEditable={textEditable}
                    {...editHandlers(id, (html) => {
                      if (!limited.allowEdit) return;
                      handleContentUpdate(id, 'text', html);
                      setLimitEditIds((prev) => {
                        if (!prev[id]) return prev;
                        const next = { ...prev };
                        delete next[id];
                        return next;
                      });
                    }, textEditable)}
                />
            );

            const wrapped = (
                <>
                    <style>{scopedCss}</style>
                    {paragraphEl}
                </>
            );

            const textLinkUrl = String(c.link || '').trim();
            const { target: textLinkTarget, rel: textLinkRel } = resolveAnchorTargetRel(
              textLinkUrl,
              c.openInNewTab
            );

            // Preview only: real <a>. Edit mode uses handleElementActivate (chooser if linked).
            const wrappedWithLink =
                textLinkUrl && readOnly ? (
                    <a
                        href={textLinkUrl}
                        target={textLinkTarget}
                        rel={textLinkRel}
                        className="no-underline text-inherit hover:underline inline-block"
                    >
                        {wrapped}
                    </a>
                ) : (
                    wrapped
                );

            if (hasAnimation) {
                return (
                    <AnimatedDiv
                        key={`${id}-anim`}
                        enabled={!readOnly}
                        initial={animVar.initial}
                        whileInView={animVar.animate}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.65, delay: animationDelay, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: 'block' }}
                    >
                        {wrappedWithLink}
                    </AnimatedDiv>
                );
            }
            return wrappedWithLink;
        }

        case 'button':      // legacy 'button' now uses the new reliable renderer
        case 'cta-button': {
            // New reliable CTA button element. Variant ALWAYS drives the base
            // look (so secondary/outline/ghost can never look filled like primary),
            // while user overrides from the sidebar (bg / text / border colors,
            // radius, padding, size, hover) still win on top. Fully editable via
            // the Button content form + ButtonStylesBlock (wired by element type).
            const c: any = content || {};
            const cbVariant: 'primary' | 'secondary' | 'outline' | 'ghost' =
              (['primary','secondary','outline','ghost'] as const).includes((renderStyle as any).buttonVariant || c.buttonVariant)
                ? ((renderStyle as any).buttonVariant || c.buttonVariant) : 'primary';
            const cbAccent = theme?.buttonBackgroundColor || theme?.accentColor || '#E11D48';
            const cbOnAccent = theme?.buttonTextColor || '#FFFFFF';
            const cbLight = theme?.titleColor || '#FFFFFF';
            const resolvedButtonFontFamilyCta = (safeStyle.fontFamily && safeStyle.fontFamily.trim() !== '')
              ? safeStyle.fontFamily : theme?.buttonFontFamily;
            // Variant base — user's explicit style keys override these below.
            const cbBase = {
              primary:   { bg: cbAccent,      color: cbOnAccent, border: 'transparent', bw: '0'     },
              secondary: { bg: 'transparent', color: cbLight,    border: cbAccent,      bw: '1.5px' },
              outline:   { bg: 'transparent', color: cbAccent,   border: cbAccent,      bw: '1.5px' },
              ghost:     { bg: 'transparent', color: cbAccent,   border: 'transparent', bw: '0'     },
            }[cbVariant];
            // User overrides (from the sidebar) WIN over the variant base.
            const uBg = safeStyle.backgroundColor && safeStyle.backgroundColor !== 'transparent' ? safeStyle.backgroundColor : undefined;
            const uColor = safeStyle.color && safeStyle.color !== 'transparent' ? safeStyle.color : undefined;
            const uBorder = safeStyle.borderColor && safeStyle.borderColor !== 'transparent' ? safeStyle.borderColor : undefined;
            const cbBg = uBg ?? cbBase.bg;
            const cbColor = uColor ?? cbBase.color;
            const cbBorderColor = uBorder ?? cbBase.border;
            const cbBorderW = safeStyle.borderWidth || cbBase.bw;
            // Border style: user's borderStyle wins; else solid when a border shows.
            let cbBorderStyle = (safeStyle.borderStyle && safeStyle.borderStyle !== 'none')
              ? safeStyle.borderStyle
              : (cbBorderColor !== 'transparent' && cbBorderW !== '0' ? 'solid' : 'none');

            // ── Button DESIGN preset ───────────────────────────────────────
            // Reusable modern looks. Everything below is derived from the theme
            // accent (cbAccent) + resolved colors — NO hardcoded brand colors —
            // and every value can still be overridden by the sidebar controls.
            const cbDesign: string = (renderStyle as any).buttonDesign || 'classic';
            const hex = (h: string, a: string) => `${h}${a}`; // accent + alpha suffix
            // Per-design overrides. Fields left undefined fall through to the
            // variant/base values already resolved above.
            const dz: {
              radius?: string; bg?: string; color?: string; border?: string;
              borderW?: string; borderStyle?: string; shadow?: string;
              extraCss?: string; padExtra?: string; fontWeight?: any; letter?: string;
              hoverCss?: string; beforeCss?: string; textTransform?: any;
            } = (() => {
              const isFilled = cbVariant === 'primary';
              switch (cbDesign) {
                case 'pill':      return { radius: '9999px' };
                case 'sharp':     return { radius: '0px' };
                case 'soft':      return { radius: '0.5rem' };
                case 'glow':      return { radius: '9999px', shadow: `0 0 24px ${hex(cbAccent,'55')}`, hoverCss: `box-shadow:0 0 40px ${hex(cbAccent,'88')} !important;` };
                case 'neon':      return { radius: '9999px', bg: 'transparent', color: cbAccent, border: cbAccent, borderW: '1.5px', shadow: `0 0 12px ${hex(cbAccent,'66')}, inset 0 0 8px ${hex(cbAccent,'22')}`, hoverCss: `background-color:${hex(cbAccent,'14')} !important; box-shadow:0 0 20px ${hex(cbAccent,'99')} !important;` };
                case 'glass':     return { radius: '0.75rem', bg: hex(cbAccent,'22'), color: cbLight, border: hex(cbAccent,'44'), borderW: '1px', extraCss: 'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);', hoverCss: `background-color:${hex(cbAccent,'33')} !important;` };
                case 'gradient': return { radius: '9999px', bg: 'transparent', color: cbOnAccent, extraCss: `background-image:linear-gradient(135deg, ${cbAccent}, ${hex(cbAccent,'AA')});`, hoverCss: 'filter:brightness(1.08);' };
                case 'gradient-sheen': return { radius: '9999px', bg: 'transparent', color: cbOnAccent, extraCss: `background-image:linear-gradient(135deg, ${cbAccent} 0%, ${hex(cbAccent,'CC')} 50%, ${cbAccent} 100%);background-size:200% 100%;`, hoverCss: 'background-position:100% 0;' };
                case 'shine':     return { radius: '9999px', extraCss: 'position:relative;overflow:hidden;', beforeCss: `content:'';position:absolute;top:0;left:-75%;width:50%;height:100%;background:linear-gradient(120deg, transparent, ${hex('#ffffff','66')}, transparent);transform:skewX(-20deg);transition:left .6s ease;`, hoverCss: 'left:130%;' };
                case '3d':        return { radius: '0.75rem', shadow: `0 5px 0 ${hex(cbAccent,'99')}`, hoverCss: `transform:translateY(2px) !important;box-shadow:0 3px 0 ${hex(cbAccent,'99')} !important;` };
                case 'elevated':  return { radius: '0.75rem', shadow: `0 12px 28px -10px ${hex(cbAccent,'88')}`, hoverCss: `transform:translateY(-3px) !important;box-shadow:0 18px 36px -12px ${hex(cbAccent,'AA')} !important;` };
                case 'underline': return { radius: '0px', bg: 'transparent', color: isFilled ? cbAccent : (cbColor as string), border: 'transparent', borderW: '0', extraCss: `border-bottom:2px solid ${cbAccent};padding-bottom:2px;`, padExtra: '0', hoverCss: 'letter-spacing:0.03em;' };
                case 'bracket':   return { radius: '0px', bg: 'transparent', color: cbAccent, border: cbAccent, borderW: '2px', borderStyle: 'solid', extraCss: 'border-left:none;border-right:none;position:relative;' };
                case 'dashed':    return { radius: '9999px', bg: 'transparent', color: cbAccent, border: cbAccent, borderW: '1.5px', borderStyle: 'dashed', hoverCss: `background-color:${hex(cbAccent,'14')} !important;` };
                case 'double':    return { radius: '9999px', bg: 'transparent', color: cbAccent, border: cbAccent, borderW: '3px', borderStyle: 'double' };
                case 'icon-circle': return { radius: '9999px' };
                case 'link':      return { radius: '0px', bg: 'transparent', color: cbAccent, border: 'transparent', borderW: '0', padExtra: '0', extraCss: 'text-decoration:underline;text-underline-offset:4px;', hoverCss: 'text-decoration-thickness:2px;' };
                case 'frosted':   return { radius: '9999px', bg: hex(cbAccent,'1A'), color: cbAccent, border: hex(cbAccent,'33'), borderW: '1px', extraCss: 'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);', hoverCss: `background-color:${hex(cbAccent,'2A')} !important;` };
                case 'retro':     return { radius: '0.5rem', shadow: `4px 4px 0 ${cbAccent}`, border: cbColor as string, borderW: '2px', borderStyle: 'solid', hoverCss: `transform:translate(2px,2px) !important;box-shadow:2px 2px 0 ${cbAccent} !important;` };
                case 'classic':
                default:          return {};
              }
            })();
            // Apply design overrides (only where the user hasn't set their own).
            const cbRadiusFinal = safeStyle.borderRadius || dz.radius || '9999px';
            const cbBgFinal      = uBg ?? (dz.bg ?? cbBg);
            const cbColorFinal   = uColor ?? (dz.color ?? cbColor);
            const cbBorderFinal  = uBorder ?? (dz.border ?? cbBorderColor);
            const cbBorderWFinal = safeStyle.borderWidth || dz.borderW || cbBorderW;
            if (dz.borderStyle) cbBorderStyle = (safeStyle.borderStyle && safeStyle.borderStyle !== 'none') ? cbBorderStyle : dz.borderStyle;

            // Content-tab controls: icon (+ pos/size/rotation), width, size, loading.
            const cbIcon = c.icon && c.icon !== 'none' ? c.icon : undefined;
            const cbIconPos = c.iconPosition === 'right' ? 'right' : 'left';
            const cbIconSize = safeStyle.iconSize || '1em';
            const cbIconRot = Number(safeStyle.iconRotation) || 0;
            const cbWidthMode: 'auto' | 'full' | 'fixed' = (['auto','full','fixed'] as const).includes(c.width) ? c.width : 'auto';
            const cbSizePreset: 'sm'|'md'|'lg'|'xl' = (['sm','md','lg','xl'] as const).includes(c.size) ? c.size : 'md';
            const cbSizeMap: Record<string, { padding: string; fontSize: string }> = {
              sm: { padding: '0 1rem',    fontSize: '0.8125rem' },
              md: { padding: '0 1.5rem',  fontSize: '0.9rem' },
              lg: { padding: '0 1.75rem', fontSize: '1rem' },
              xl: { padding: '0 2.25rem', fontSize: '1.125rem' },
            };
            const cbLoading = !!c.loading;
            const cbHref = String(c.link || '#');
            // Open-in-new-tab (Content tab toggle) — target + secure rel.
            const cbNewTab = c.openInNewTab === undefined ? true : !!c.openInNewTab;
            const cbIsExternal = /^https?:\/\//i.test(cbHref);
            const cbTarget = (readOnly && cbNewTab && cbIsExternal) ? '_blank' : undefined;
            const cbRel = cbTarget === '_blank' ? 'noopener noreferrer' : undefined;
            // Hover effect (Content tab): none / lift / scale / arrow / glow.
            const cbHoverEffect: string = c.hoverEffect || 'lift';
            // Reveal animation (Content tab): fade-up / slide-* / scale-in / pulse.
            const cbAnimPreset: string = c.animation || 'none';
            const cbHoverId = `gb-cta-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

            // User hover overrides (sidebar Hover Colors) win over variant defaults.
            // Read from renderStyle (safeStyle strips these non-CSS hover keys).
            const cbHoverBg     = (renderStyle as any).hoverBackgroundColor || '';
            const cbHoverColor  = (renderStyle as any).hoverColor || '';
            const cbHoverBorder = (renderStyle as any).hoverBorderColor || '';
            const cbHoverCss = (() => {
              let css = '';
              if (cbHoverBg)     css += `background-color:${cbHoverBg} !important;`;
              if (cbHoverColor)  css += `color:${cbHoverColor} !important;`;
              if (cbHoverBorder) css += `border-color:${cbHoverBorder} !important;`;
              // Built-in hover EFFECT (lift/scale/glow/arrow) — applies alongside
              // any color overrides.
              if (cbHoverEffect === 'lift')  css += 'transform:translateY(-2px); box-shadow:0 8px 20px -8px rgba(0,0,0,.25);';
              if (cbHoverEffect === 'scale') css += 'transform:scale(1.04);';
              if (cbHoverEffect === 'glow')  css += `box-shadow:0 0 32px ${cbAccent}66;`;
              // Fallback tint only when no color override AND no effect chosen.
              if (!cbHoverBg && !cbHoverColor && !cbHoverBorder && (cbHoverEffect === 'none')) {
                css += cbVariant === 'primary' ? `box-shadow:0 0 42px ${cbAccent}2E;` : `background-color:${cbAccent}14;`;
              }
              return css;
            })();
            const cbUseArrow = cbHoverEffect === 'arrow' && !cbIcon && !cbLoading;

            const cbStyle: React.CSSProperties = {
              ...safeStyle,
              backgroundColor: cbBgFinal,
              color: cbColorFinal,
              borderColor: cbBorderFinal,
              borderWidth: cbBorderWFinal,
              borderStyle: cbBorderStyle,
              borderRadius: cbRadiusFinal,
              padding: dz.padExtra !== undefined ? dz.padExtra : (safeStyle.padding || cbSizeMap[cbSizePreset].padding),
              height: (safeStyle as any).height || (dz.padExtra === '0' ? undefined : '2.9rem'),
              fontWeight: (safeStyle.fontWeight as any) || dz.fontWeight || 600,
              fontSize: safeStyle.fontSize || cbSizeMap[cbSizePreset].fontSize,
              fontFamily: resolvedButtonFontFamilyCta || undefined,
              letterSpacing: safeStyle.letterSpacing || dz.letter || undefined,
              textTransform: (safeStyle.textTransform as any) || dz.textTransform || undefined,
              boxShadow: safeStyle.boxShadow || dz.shadow || undefined,
              textDecoration: 'none',
              cursor: readOnly ? 'pointer' : 'text',
              width: cbWidthMode === 'full' ? '100%' : cbWidthMode === 'fixed' ? (c.fixedWidth || '200px') : undefined,
            };
            const cbRenderIcon = (pos: 'left' | 'right') => cbIcon && cbIconPos === pos ? (
              <i className={`fa-solid ${cbIcon}`} style={{ color: cbColorFinal, fontSize: cbIconSize, transform: cbIconRot ? `rotate(${cbIconRot}deg)` : undefined }} aria-hidden />
            ) : null;
            const cbAnimVar: Record<string, { initial: any; animate: any; transition?: any }> = {
              'none':        { initial: {}, animate: {} },
              'fade-up':     { initial: { opacity: 0, y: 16 },       animate: { opacity: 1, y: 0 } },
              'slide-left':  { initial: { opacity: 0, x: -24 },      animate: { opacity: 1, x: 0 } },
              'slide-right': { initial: { opacity: 0, x: 24 },       animate: { opacity: 1, x: 0 } },
              'scale-in':    { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 } },
              'pulse':       { initial: { scale: 1 },                animate: { scale: [1, 1.05, 1] }, transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
            };
            const cbAnim = cbAnimVar[cbAnimPreset] || cbAnimVar.none;
            const cbAnchor = (
              <a
                id={cbHoverId}
                href={readOnly ? cbHref : undefined}
                target={cbTarget}
                rel={cbRel}
                onClick={(e) => { if (readOnly) { return; } e.preventDefault(); handleClick(e, el); }}
                className={`inline-flex items-center justify-center gap-2 ${selectedClass}`}
                style={cbStyle}
              >
                {cbLoading ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ borderColor: cbColorFinal, borderTopColor: 'transparent' }} aria-hidden />
                    <span>{c.loadingText || 'Loading…'}</span>
                  </>
                ) : (
                  <>
                    {cbRenderIcon('left')}
                    <span
                      ref={bindHtml(id, c.text || '')}
                      contentEditable={!readOnly}
                      {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                    />
                    {cbRenderIcon('right')}
                    {cbUseArrow && (
                      <span aria-hidden className="gb-cta-arrow inline-block transition-transform duration-200" style={{ color: cbColor }}>
                        <i className="fa-solid fa-arrow-right" style={{ fontSize: cbIconSize }} />
                      </span>
                    )}
                  </>
                )}
              </a>
            );
            return (
              <>
                <style>{`
                  #${cbHoverId} { transition: all .25s cubic-bezier(0.16,1,0.3,1); ${dz.extraCss || ''} }
                  #${cbHoverId}:hover { ${cbHoverCss}${dz.hoverCss || ''} }
                  #${cbHoverId}:focus-visible { outline:2px solid ${cbAccent}; outline-offset:3px; }
                  ${dz.beforeCss ? `#${cbHoverId}::before { ${dz.beforeCss} } #${cbHoverId}:hover::before { ${dz.hoverCss || ''} }` : ''}
                  ${cbUseArrow ? `#${cbHoverId}:hover .gb-cta-arrow { transform: translateX(4px); }` : ''}
                `}</style>
                {cbAnimPreset !== 'none' ? (
                  <AnimatedDiv style={{ width: 'max-content' }} initial={cbAnim.initial} whileInView={cbAnim.animate} viewport={{ once: true }} transition={cbAnim.transition}>
                    {cbAnchor}
                  </AnimatedDiv>
                ) : cbAnchor}
              </>
            );
        }

        case 'call-to-action': {
            const c: any = content || {};
            const btnVariant = (renderStyle as any).buttonVariant || c.buttonVariant || 'primary';
            const resolvedButtonFontFamily =
              safeStyle.fontFamily && safeStyle.fontFamily.trim() !== ''
                ? safeStyle.fontFamily
                : theme?.buttonFontFamily;

            // Resolve colors based on variant
            const isNearWhite = (v: unknown) => {
              const s = String(v || '').trim().toLowerCase();
              return (
                s === '#fff' ||
                s === '#ffffff' ||
                s === 'white' ||
                s === 'rgb(255,255,255)' ||
                s === 'rgb(255, 255, 255)' ||
                s === 'rgba(255,255,255,1)' ||
                s === 'rgba(255, 255, 255, 1)'
              );
            };
            let btnBg = safeStyle.backgroundColor;
            let btnColor = safeStyle.color;
            let btnBorderColor = safeStyle.borderColor;
            let btnBorderWidth = safeStyle.borderWidth;
            let btnBorderStyle = safeStyle.borderStyle;

            // Stale white fills on primary CTAs (common after preset strip + Tailwind bg-white)
            // must yield to the live brand button color — GenieBuild already looks red via theme.
            if (
              btnVariant === 'primary' &&
              isNearWhite(btnBg)
            ) {
              btnBg = '';
            }

            if (!btnBg || btnBg === 'transparent' || btnBg === '') {
              if (btnVariant === 'secondary') {
                btnBg = (theme as any)?.secondaryButtonBg || 'transparent';
              } else if (btnVariant === 'outline' || btnVariant === 'ghost') {
                btnBg = 'transparent';
              } else {
                btnBg = theme?.buttonBackgroundColor || '#E11D48';
              }
            }
            if (!btnColor || btnColor === 'transparent' || btnColor === '') {
              if (btnVariant === 'secondary') {
                btnColor = (theme as any)?.secondaryButtonText || theme?.buttonTextColor || '#F8FAFC';
              } else if (btnVariant === 'outline') {
                btnColor = (theme as any)?.secondaryButtonBorder || theme?.accentColor || theme?.buttonBackgroundColor;
              } else if (btnVariant === 'ghost') {
                btnColor = theme?.textColor || theme?.buttonTextColor || '#F8FAFC';
              } else {
                btnColor = theme?.buttonTextColor || '#FFFFFF';
              }
            }
            if (!btnBorderColor || btnBorderColor === 'transparent' || btnBorderColor === '') {
              if (btnVariant === 'secondary') {
                btnBorderColor = (theme as any)?.secondaryButtonBorder || theme?.accentColor || '#E11D48';
                btnBorderWidth = btnBorderWidth || '1px';
                btnBorderStyle = btnBorderStyle || 'solid';
              } else if (btnVariant === 'outline') {
                btnBorderColor = (theme as any)?.secondaryButtonBorder || theme?.accentColor || theme?.buttonBackgroundColor || '#E11D48';
                btnBorderWidth = btnBorderWidth || '2px';
                btnBorderStyle = btnBorderStyle || 'solid';
              } else if (btnVariant === 'ghost') {
                btnBorderColor = 'transparent';
              } else {
                btnBorderColor = theme?.buttonBorderColor && theme?.buttonBorderColor !== 'transparent' ? theme?.buttonBorderColor : 'transparent';
              }
            }

            // Size preset (sm/md/lg/xl) — sets padding + fontSize together. Sidebar overrides win.
            const sizePreset: 'sm' | 'md' | 'lg' | 'xl' = (['sm','md','lg','xl'] as const).includes(c.size) ? c.size : 'md';
            const sizeMap: Record<string, { padding: string; fontSize: string }> = {
                sm: { padding: '8px 16px',   fontSize: '0.8125rem' },
                md: { padding: '12px 24px',  fontSize: '0.9375rem' },
                lg: { padding: '14px 28px',  fontSize: '1rem' },
                xl: { padding: '18px 36px',  fontSize: '1.125rem' },
            };
            const sizeDef = sizeMap[sizePreset];

            // Width mode — auto / full / fixed
            const widthMode: 'auto' | 'full' | 'fixed' = (['auto','full','fixed'] as const).includes(c.width) ? c.width : 'auto';
            const fixedWidth = c.fixedWidth || '200px';

            // Hover effect
            const hoverEffect: string = c.hoverEffect || 'lift';

            const buttonStyle: React.CSSProperties = {
                ...safeStyle,
                backgroundColor: btnBg,
                color: btnColor,
                borderColor: btnBorderColor,
                borderWidth: btnBorderWidth || (btnBorderColor && btnBorderColor !== 'transparent' ? '1px' : undefined),
                borderStyle: btnBorderStyle || (btnBorderColor && btnBorderColor !== 'transparent' ? 'solid' : undefined),
                textAlign: ((renderStyle.textAlign as any) || 'center'),
                fontWeight: renderStyle.fontWeight || 'bold',
                fontSize: renderStyle.fontSize || sizeDef.fontSize,
                padding: safeStyle.padding || sizeDef.padding,
                letterSpacing: renderStyle.letterSpacing || undefined,
                textTransform: renderStyle.textTransform || undefined,
                boxShadow: renderStyle.boxShadow || undefined,
                fontFamily: resolvedButtonFontFamily && resolvedButtonFontFamily.trim() !== '' ? resolvedButtonFontFamily : undefined,
                width: widthMode === 'full' ? '100%' : widthMode === 'fixed' ? fixedWidth : undefined,
            };
            if (!buttonStyle.fontFamily) delete buttonStyle.fontFamily;
            // Icon support
            const btnIcon: string | undefined = c.icon && c.icon !== 'none' ? c.icon : undefined;
            const btnIconPosition: 'left' | 'right' = c.iconPosition === 'right' ? 'right' : 'left';
            const btnLoading: boolean = !!c.loading;
            const iconRotation: number = Number(renderStyle.iconRotation) || 0;
            const iconSize: string = renderStyle.iconSize || '1em';

            // Hover & focus styling injected via scoped CSS
            const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
            const hoverBg = renderStyle.hoverBackgroundColor || '';
            const hoverFg = renderStyle.hoverColor || '';
            const hoverBorder = renderStyle.hoverBorderColor || '';
            const accentForGlow = (theme?.accentColor || btnBg || '#E11D48');
            const hoverCss = (() => {
                let css = '';
                if (hoverBg)     css += `background-color: ${hoverBg} !important;`;
                if (hoverFg)     css += `color: ${hoverFg} !important;`;
                if (hoverBorder) css += `border-color: ${hoverBorder} !important;`;
                // Built-in hover effects
                if (hoverEffect === 'lift')   css += 'transform: translateY(-2px); box-shadow: 0 8px 20px -8px rgba(0,0,0,0.25);';
                if (hoverEffect === 'scale')  css += 'transform: scale(1.04);';
                if (hoverEffect === 'glow')   css += `box-shadow: 0 0 24px ${accentForGlow}55;`;
                if (hoverEffect === 'arrow')  css += '/* arrow span handled below */';
                return css;
            })();
            const arrowMoveCss = hoverEffect === 'arrow'
                ? `#gb-btn-${safeId}:hover .gb-btn-arrow { transform: translateX(4px); }`
                : '';
            const scopedButtonCss = `
                #gb-btn-${safeId} { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); }
                #gb-btn-${safeId}:hover { ${hoverCss} }
                ${arrowMoveCss}
            `;

            // Slide-arrow hover effect: append a small chevron at the end (right side)
            const useArrowSpan = hoverEffect === 'arrow' && !btnLoading;
            const renderIcon = (extraStyle?: React.CSSProperties) => btnIcon ? (
                <IconRenderer
                    icon={btnIcon}
                    size={iconSize}
                    style={{
                        color: btnColor,
                        transform: iconRotation ? `rotate(${iconRotation}deg)` : undefined,
                        ...extraStyle,
                    }}
                />
            ) : null;

            const buttonInnerWithIconOrLoad = (
                <>
                    {btnLoading ? (
                        <>
                            <span
                                className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: btnColor, borderTopColor: 'transparent' }}
                                aria-hidden="true"
                            />
                            <span>{c.loadingText || 'Loading…'}</span>
                        </>
                    ) : (
                        <>
                            {btnIcon && btnIconPosition === 'left' && renderIcon()}
                            <span
                                ref={bindHtml(id, c.text || '')}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                            />
                            {btnIcon && btnIconPosition === 'right' && renderIcon()}
                            {useArrowSpan && !btnIcon && (
                                <span
                                    aria-hidden
                                    className="gb-btn-arrow inline-block transition-transform duration-200"
                                    style={{ color: btnColor }}
                                >
                                    <i className="fa-solid fa-arrow-right" style={{ fontSize: iconSize }} />
                                </span>
                            )}
                        </>
                    )}
                </>
            );

            const showAsFlex = !!btnIcon || btnLoading || useArrowSpan;
            const buttonElement = showAsFlex ? (
                <button
                    id={`gb-btn-${safeId}`}
                    className={`${buttonClass} ${!readOnly ? 'outline-none relative cursor-pointer' : ''} ${selectedClass} inline-flex items-center justify-center gap-2`}
                    style={buttonStyle}
                    onClick={!readOnly ? (e) => handleClick(e, el) : undefined}
                    disabled={btnLoading}
                >
                    {buttonInnerWithIconOrLoad}
                </button>
            ) : (
                <button
                    id={`gb-btn-${safeId}`}
                    className={`${buttonClass} ${!readOnly ? 'outline-none relative cursor-pointer' : ''} ${selectedClass}`}
                    style={buttonStyle}
                    onClick={!readOnly ? (e) => handleClick(e, el) : undefined}
                    ref={bindHtml(id, c.text || '')}
                    contentEditable={!readOnly}
                    {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                />
            );
            
            // Use flexbox with justify-content for proper button alignment
            // Convert textAlign to flexbox justify-content: left -> flex-start, center -> center, right -> flex-end
            const getJustifyContent = (textAlign?: string): 'flex-start' | 'center' | 'flex-end' => {
                if (!textAlign) return 'center';
                switch (textAlign) {
                    case 'left': return 'flex-start';
                    case 'right': return 'flex-end';
                    case 'center': return 'center';
                    case 'justify': return 'center'; // justify doesn't make sense for buttons, default to center
                    default: return 'center';
                }
            };
            
            // CRITICAL: Use display: flex and map element.style.textAlign to justify-content
            // Read textAlign directly from renderStyle (which includes ELEMENT_DEFAULTS)
            const elementTextAlign = (renderStyle?.textAlign as string) || undefined;
            const buttonTextAlign = elementTextAlign || 'center';
            
            // Reveal animation
            const animationPreset: string = c.animation || 'none';
            const animVariants: Record<string, { initial: any; animate: any; transition?: any }> = {
                'none':        { initial: {}, animate: {} },
                'fade-up':     { initial: { opacity: 0, y: 16 },         animate: { opacity: 1, y: 0 } },
                'slide-left':  { initial: { opacity: 0, x: -24 },        animate: { opacity: 1, x: 0 } },
                'slide-right': { initial: { opacity: 0, x: 24 },         animate: { opacity: 1, x: 0 } },
                'scale-in':    { initial: { opacity: 0, scale: 0.92 },   animate: { opacity: 1, scale: 1 } },
                'pulse':       { initial: { scale: 1 },                  animate: { scale: [1, 1.05, 1] }, transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
            };
            const animVar = animVariants[animationPreset] || animVariants.none;
            const hasAnimation = animationPreset !== 'none';

            // Anchor wrapping:
            // - edit mode: never use a real <a href> (avoids iframe refresh / new tabs)
            // - preview: real <a>; internal stays same-tab; external only if openInNewTab
            const linkUrl = String(c.link || '').trim();
            const { target: linkTarget, rel: linkRel } = resolveAnchorTargetRel(
              linkUrl,
              c.openInNewTab
            );

            const buttonWithLink = hasUsableHref(linkUrl) ? (
                !readOnly ? (
                    <div
                        role="link"
                        data-gb-editable-link="1"
                        data-gb-href={linkUrl}
                        onClick={(e) => handleLinkedClick(e, el, linkUrl)}
                        className={widthMode === 'full' ? 'block cursor-pointer' : 'inline-block cursor-pointer'}
                        style={widthMode === 'full' ? { width: '100%' } : undefined}
                    >
                        {buttonElement}
                    </div>
                ) : (
                    <a
                        href={linkUrl}
                        target={linkTarget}
                        rel={linkRel}
                        className={widthMode === 'full' ? 'block' : 'inline-block'}
                        style={widthMode === 'full' ? { width: '100%' } : undefined}
                    >
                        {buttonElement}
                    </a>
                )
            ) : buttonElement;

            const wrapperJustify =
                buttonTextAlign === 'left' ? 'flex-start' :
                buttonTextAlign === 'right' ? 'flex-end' : 'center';

            const inner = (
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: widthMode === 'full' ? 'stretch' : wrapperJustify,
                    }}
                >
                    <style>{scopedButtonCss}</style>
                    <div style={widthMode === 'full' ? { width: '100%' } : undefined}>
                        {buttonWithLink}
                        {type === 'call-to-action' && c.subText && (
                            <p className="text-sm opacity-70"
                               style={{ marginTop: (renderStyle as any).subTextTopSpace || '0.5rem' }}
                               ref={bindHtml(id, c.subText || '')}
                               contentEditable={!readOnly}
                               {...editHandlers(id, (html) => handleContentUpdate(id, 'subText', html))} />
                        )}
                    </div>
                </div>
            );

            if (hasAnimation) {
                return (
                    <AnimatedDiv
                        key={`${id}-anim`}
                        enabled={!readOnly}
                        initial={animVar.initial}
                        whileInView={animVar.animate}
                        viewport={{ once: animationPreset !== 'pulse', margin: '-50px' }}
                        transition={animVar.transition || { duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {inner}
                    </AnimatedDiv>
                );
            }
            return <div key={id}>{inner}</div>;
        }

        case 'image': {
            const c: any = content || {};
            const objectFit = (renderStyle?.objectFit || 'cover') as any;
            const objectPosition = (renderStyle?.objectPosition || 'center') as string;
            const overlayColor = renderStyle?.overlayColor;
            const overlayOpacity = renderStyle?.overlayOpacity !== undefined ? parseFloat(renderStyle.overlayOpacity) : 0;

            const resolvedSrc = resolveSectionImageUrlForElement(section, { id, content });
            const fullImageUrl = toDisplayImageUrl(resolvedSrc);

            // Combine filter preset + numeric adjustments into one CSS filter string
            const filterParts: string[] = [];
            if (renderStyle?.filterPreset) filterParts.push(renderStyle.filterPreset);
            if (renderStyle?.brightness)   filterParts.push(`brightness(${renderStyle.brightness}%)`);
            if (renderStyle?.contrast)     filterParts.push(`contrast(${renderStyle.contrast}%)`);
            if (renderStyle?.saturate)     filterParts.push(`saturate(${renderStyle.saturate}%)`);
            if (renderStyle?.hueRotate)    filterParts.push(`hue-rotate(${renderStyle.hueRotate}deg)`);
            // Backward compat: legacy `filter` style key
            if (filterParts.length === 0 && renderStyle?.filter && renderStyle.filter !== 'none') {
                filterParts.push(renderStyle.filter);
            }
            const combinedFilter = filterParts.length > 0 ? filterParts.join(' ') : undefined;

            // Outer style — keeps borders + shadow + ring
            const outerStyle: React.CSSProperties = {
                position: 'relative',
                width: renderStyle?.width || '100%',
                aspectRatio: renderStyle?.aspectRatio || 'auto',
                borderRadius: renderStyle?.borderRadius || '0%',
                borderWidth: renderStyle?.borderWidth || '0px',
                borderStyle: renderStyle?.borderStyle || 'none',
                borderColor: renderStyle?.borderColor || 'transparent',
                backgroundColor: renderStyle?.backgroundColor || undefined,
            };
            let finalBoxShadow = (renderStyle?.boxShadow && renderStyle.boxShadow !== 'none')
                ? renderStyle.boxShadow
                : (themeData?.shadow ? `0 4px 6px -1px ${themeData.shadow}, 0 2px 4px -1px ${themeData.shadow}` : undefined);
            if (isSelected && !readOnly) {
                const ringColor = themeData?.ring || '#3b82f6';
                const ringShadow = `0 0 0 2px #000000, 0 0 0 4px ${ringColor}`;
                finalBoxShadow = finalBoxShadow ? `${finalBoxShadow}, ${ringShadow}` : ringShadow;
            }
            if (finalBoxShadow) outerStyle.boxShadow = finalBoxShadow;

            const innerStyle: React.CSSProperties = {
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: 'inherit',
                overflow: 'hidden',
            };
            const imgStyle: React.CSSProperties = {
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                objectPosition: objectPosition,
                opacity: renderStyle?.opacity !== undefined ? renderStyle.opacity : 1,
                filter: combinedFilter,
                transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), filter 0.3s, opacity 0.3s',
            };

            // Behaviour flags
            const altText = c.imageAlt || c.altText || c.alt || 'Image';
            const isLazy = c.lazy !== false;
            const linkUrl = (c.link || '').toString().trim();
            const hasLink = hasUsableHref(linkUrl);
            const lightboxOn = !!c.lightbox;
            const { target: linkTarget, rel: linkRel } = resolveAnchorTargetRel(
              linkUrl,
              c.openInNewTab
            );

            // Hover effect — scoped CSS on the outer container
            const hoverEffect: string = renderStyle?.hoverEffect || 'none';
            const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
            const hoverCss = (() => {
                if (hoverEffect === 'none') return '';
                if (hoverEffect === 'zoom')     return `#gb-img-${safeId}:hover img { transform: scale(1.06); }`;
                if (hoverEffect === 'lift')     return `#gb-img-${safeId}:hover { transform: translateY(-4px); box-shadow: 0 16px 32px -12px rgba(0,0,0,0.35) !important; }`;
                if (hoverEffect === 'brighten') return `#gb-img-${safeId}:hover img { filter: brightness(1.15) ${combinedFilter || ''}; }`;
                if (hoverEffect === 'darken')   return `#gb-img-${safeId}:hover img { filter: brightness(0.7) ${combinedFilter || ''}; }`;
                if (hoverEffect === 'tint')     return `#gb-img-${safeId}:hover .gb-img-tint { opacity: 1; }`;
                return '';
            })();
            const scopedCss = hoverCss
                ? `#gb-img-${safeId} { transition: transform 0.3s, box-shadow 0.3s; } ${hoverCss}`
                : '';

            // Reveal animation
            const animationPreset: string = c.animation || 'none';
            const animationDelay = Number(c.animationDelay) || 0;
            const animVariants: Record<string, { initial: any; animate: any }> = {
                'none':        { initial: {}, animate: {} },
                'fade-up':     { initial: { opacity: 0, y: 24 },                  animate: { opacity: 1, y: 0 } },
                'slide-left':  { initial: { opacity: 0, x: -32 },                 animate: { opacity: 1, x: 0 } },
                'slide-right': { initial: { opacity: 0, x: 32 },                  animate: { opacity: 1, x: 0 } },
                'blur-in':     { initial: { opacity: 0, filter: 'blur(10px)' },   animate: { opacity: 1, filter: 'blur(0px)' } },
                'scale-in':    { initial: { opacity: 0, scale: 0.92 },            animate: { opacity: 1, scale: 1 } },
                'zoom':        { initial: { opacity: 0, scale: 1.1 },             animate: { opacity: 1, scale: 1 } },
            };
            const animVar = animVariants[animationPreset] || animVariants.none;
            const hasAnimation = animationPreset !== 'none';

            // Caption
            const caption = (c.caption || '').toString();
            const hasCaption = caption.trim() !== '';

            // Click handling: in builder, linked images get Open|Select; otherwise select.
            // In preview: lightbox > soft-nav via <a> / PreviewFrame.
            const handleImgClick = (e: React.MouseEvent) => {
                if (!readOnly) {
                  handleElementActivate(e, el, hasLink ? linkUrl : '');
                  return;
                }
                if (lightboxOn) { e.preventDefault(); setOpenLightboxId(id); return; }
            };

            const imageBlock = (
                <div
                    id={`gb-img-${safeId}`}
                    style={outerStyle}
                    className={`group transition-all duration-300 ${lightboxOn && readOnly ? 'cursor-zoom-in' : (hasLink ? 'cursor-pointer' : '')}`}
                    {...(hasLink && !readOnly ? { 'data-gb-editable-link': '1' } : {})}
                    onClick={handleImgClick}
                >
                    <div style={innerStyle}>
                        <img
                            src={fullImageUrl}
                            alt={altText}
                            loading={isLazy ? 'lazy' : 'eager'}
                            style={imgStyle}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = SECTION_IMAGE_PLACEHOLDER;
                            }}
                        />
                        {/* Hover tint overlay (revealed on hover when hoverEffect = 'tint') */}
                        {hoverEffect === 'tint' && (
                            <div
                                className="gb-img-tint absolute inset-0 pointer-events-none transition-opacity duration-300"
                                style={{
                                    backgroundColor: overlayColor || ((theme as any)?.accentColor || '#E11D48'),
                                    opacity: 0,
                                    mixBlendMode: 'multiply',
                                }}
                            />
                        )}
                        {/* Static tint overlay (always-on dim) */}
                        {overlayOpacity > 0 && (
                            <div
                                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                                style={{
                                    backgroundColor: overlayColor || '#000000',
                                    opacity: overlayOpacity,
                                }}
                            />
                        )}
                    </div>
                </div>
            );

            // Caption shown below the image — alignment + gap overridable
            const captionAlign = resolveTextAlign(renderStyle);
            const captionEl = hasCaption ? (
                <p
                    className={`text-sm outline-none ${renderStyle?.textAlign ? captionAlign.textAlignClass : 'text-center'}`}
                    style={{
                        color: theme?.textColor || '#9CA3AF',
                        opacity: 0.85,
                        fontStyle: 'italic',
                        marginTop: (renderStyle as any).captionTopSpace || '0.5rem',
                    }}
                    ref={bindHtml(id, caption)}
                    contentEditable={!readOnly}
                    {...editHandlers(id, (html) => handleContentUpdate(id, 'caption', html))}
                />
            ) : null;

            // Wrap with anchor only when in preview AND link is set AND no lightbox
            const wrapped = hasLink && readOnly && !lightboxOn ? (
                <a href={linkUrl} target={linkTarget} rel={linkRel} className="block">
                    {imageBlock}
                </a>
            ) : imageBlock;

            const innerWithCaption = (
                <>
                    {scopedCss && <style>{scopedCss}</style>}
                    {wrapped}
                    {captionEl}
                    {lightboxOn && openLightboxId === id && readOnly && (
                        <ImageLightbox src={fullImageUrl} alt={altText} onClose={() => setOpenLightboxId(null)} />
                    )}
                </>
            );

            // Wrapper alignment — image is intrinsically inline; align via flex container
            const imgAlign = resolveTextAlign(renderStyle);
            const outerAlignClass = `flex flex-col ${imgAlign.itemsAlignClass}`;

            if (hasAnimation) {
                return (
                    <AnimatedDiv
                        key={`${id}-anim`}
                        enabled={!readOnly}
                        className={outerAlignClass}
                        initial={animVar.initial}
                        whileInView={animVar.animate}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.7, delay: animationDelay, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {innerWithCaption}
                    </AnimatedDiv>
                );
            }
            return <div key={id} className={outerAlignClass}>{innerWithCaption}</div>;
        }

        case 'video':
            // Helper to check if URL is YouTube
            const isYouTubeUrl = (url: string): boolean => {
                return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(url);
            };
            
            // Helper to convert YouTube URL to embed format
            const convertToEmbedUrl = (url: string): string => {
                if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
                    return url;
                }
                const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                if (match && match[1]) {
                    return `https://www.youtube.com/embed/${match[1]}`;
                }
                return url;
            };
            
            // Construct full video URL
            const videoUrl = content.src || '';
            const fullVideoUrl = videoUrl
                ? (videoUrl.startsWith('http')
                    ? (isYouTubeUrl(videoUrl) ? convertToEmbedUrl(videoUrl) : videoUrl)
                    // Relative media path → resolve against the real media host
                    // (was hardcoded to http://localhost:1111, wrong in production).
                    : toAbsoluteMediaUrl(videoUrl))
                : '';
            
            // Wrapper alignment — wrap the (intrinsically full-width) video player.
            // Effect only visible when user constrains width via maxWidth in style.
            const videoAlign = resolveTextAlign(renderStyle);
            const videoAspect = (renderStyle as any).videoAspectRatio || '16 / 9';
            const videoRadius = (renderStyle as any).borderRadius || '0.5rem';
            const videoBg = (renderStyle as any).videoBg || (safeStyle.backgroundColor as string) || '#000000';
            const videoObjectFit = (renderStyle as any).videoObjectFit || 'contain';
            const posterImg = (content as any).poster || '';
            const vidAutoplay: boolean = !!(content as any).autoplay;
            const vidLoop:     boolean = !!(content as any).loop;
            const vidMuted:    boolean = (content as any).muted !== false; // muted is default-on (browsers require for autoplay)
            const vidControls: boolean = (content as any).controls !== false;
            return (
                <div
                    key={`${id}-wrap`}
                    className={`flex w-full ${videoAlign.justifyClass}`}
                >
                <div
                    key={id}
                    className={`relative overflow-hidden group ${selectedClass}`}
                    onClick={!readOnly ? (e) => {
                        if ((e.target as HTMLElement).closest('.video-edit-overlay')) {
                            return;
                        }
                        handleClick(e, el);
                    } : undefined}
                    style={{
                        width: renderStyle?.width || '100%',
                        maxWidth: renderStyle?.maxWidth,
                        ...safeStyle,
                        // Re-apply our dimensional props AFTER safeStyle so they win over any stray
                        // legacy keys that might leak in (e.g. an old `aspectRatio: undefined`).
                        aspectRatio: videoAspect,
                        backgroundColor: videoBg,
                        borderRadius: videoRadius,
                    }}
                >
                    {fullVideoUrl ? (
                        <>
                            {isYouTubeUrl(videoUrl) || fullVideoUrl.includes('youtube.com/embed/') ? (
                                <>
                                    <iframe 
                                        src={fullVideoUrl} 
                                        className={`w-full h-full border-0 ${!readOnly ? 'pointer-events-none' : ''}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    />
                                    {!readOnly && (
                                        <div 
                                            className="video-edit-overlay absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleClick(e, el);
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedElementId !== id) {
                                                    e.currentTarget.style.opacity = '0';
                                                }
                                            }}
                                            style={{ 
                                                opacity: selectedElementId === id ? 1 : 0 
                                            }}
                                        >
                                            <div className="bg-white text-black px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
                                                <i className="fa-solid fa-edit"></i>
                                                Edit Video
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <video
                                        src={fullVideoUrl}
                                        poster={posterImg || undefined}
                                        className={`w-full h-full ${!readOnly ? 'pointer-events-none' : ''}`}
                                        style={{ objectFit: videoObjectFit as any }}
                                        controls={readOnly && vidControls}
                                        autoPlay={readOnly && vidAutoplay}
                                        loop={vidLoop}
                                        muted={vidMuted}
                                        playsInline
                                        onClick={!readOnly ? (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleClick(e, el);
                                        } : undefined}
                                    />
                                    {!readOnly && (
                                        <div 
                                            className="video-edit-overlay absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleClick(e, el);
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedElementId !== id) {
                                                    e.currentTarget.style.opacity = '0';
                                                }
                                            }}
                                            style={{ 
                                                opacity: selectedElementId === id ? 1 : 0 
                                            }}
                                        >
                                            <div className="bg-white text-black px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
                                                <i className="fa-solid fa-edit"></i>
                                                Edit Video
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-white/20 flex-col gap-4">
                            <i className="fa-solid fa-play text-4xl"></i>
                            <span className="text-sm font-bold uppercase tracking-widest">Add Video URL</span>
                        </div>
                    )}
                </div>
                </div>
            );

         case 'icon': {
             const iconColor = (safeStyle as any).iconColor || safeStyle.color || (renderStyle as any)?.iconColor || theme?.iconColor || theme?.icon || (renderStyle as any)?.accentColor || theme?.accentColor || '#F59E0B';
             const iconBg = renderStyle.iconBackgroundColor || renderStyle.iconBgColor || 'transparent';
             const hasContainer = iconBg !== 'transparent' || (renderStyle.iconBorderStyle && renderStyle.iconBorderStyle !== 'none') || renderStyle.iconBorder || renderStyle.iconShadow;
             const iconAlign = resolveTextAlign(renderStyle);
             // Hover + entry animation classes (registered via inline keyframes below)
             const hoverEffect: string = (renderStyle as any).iconHoverEffect || '';
             const entryAnim: string  = (renderStyle as any).iconEntryAnimation || '';
             const hoverClass = hoverEffect === 'scale'  ? 'iconHover-scale'
                              : hoverEffect === 'rotate' ? 'iconHover-rotate'
                              : hoverEffect === 'bounce' ? 'iconHover-bounce'
                              : hoverEffect === 'pulse'  ? 'iconHover-pulse'
                              : hoverEffect === 'lift'   ? 'iconHover-lift'
                              : '';
             const entryClass = entryAnim === 'fade'     ? 'animate-[iconFade_0.5s_ease-out]'
                              : entryAnim === 'scale-in' ? 'animate-[iconScaleIn_0.4s_ease-out]'
                              : entryAnim === 'pop'      ? 'animate-[iconPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]'
                              : entryAnim === 'spin-in'  ? 'animate-[iconSpinIn_0.6s_ease-out]'
                              : '';

             return (
                 <div key={`${id}-wrap`} className={`flex w-full ${iconAlign.justifyClass}`}>
                 <style>{`
                   @keyframes iconFade { from { opacity: 0; } to { opacity: 1; } }
                   @keyframes iconScaleIn { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
                   @keyframes iconPop { 0% { opacity: 0; transform: scale(0.3); } 60% { opacity: 1; transform: scale(1.15); } 100% { transform: scale(1); } }
                   @keyframes iconSpinIn { from { opacity: 0; transform: rotate(-180deg) scale(0.5); } to { opacity: 1; transform: rotate(0) scale(1); } }
                   .iconHover-scale  { transition: transform 0.25s ease; }
                   .iconHover-scale:hover  { transform: scale(1.12); }
                   .iconHover-rotate { transition: transform 0.4s ease; }
                   .iconHover-rotate:hover { transform: rotate(15deg); }
                   .iconHover-bounce:hover { animation: iconBounce 0.5s ease; }
                   @keyframes iconBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                   .iconHover-pulse:hover  { animation: iconPulseHover 0.8s ease infinite; }
                   @keyframes iconPulseHover { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
                   .iconHover-lift   { transition: transform 0.25s ease, box-shadow 0.25s ease; }
                   .iconHover-lift:hover { transform: translateY(-2px); box-shadow: 0 6px 16px -4px rgba(0,0,0,0.25); }
                 `}</style>
                 <div key={id} className={`${selectedClass} ${hoverClass} ${entryClass}`} onClick={(e) => handleClick(e, el)}
                     style={{
                         ...safeStyle,
                         display: 'inline-flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         width: hasContainer ? (renderStyle.iconContainerSize || '3rem') : 'auto',
                         height: hasContainer ? (renderStyle.iconContainerSize || '3rem') : 'auto',
                         backgroundColor: iconBg,
                         border: renderStyle.iconBorderStyle && renderStyle.iconBorderStyle !== 'none'
                             ? `${renderStyle.iconBorderWidth || '1px'} ${renderStyle.iconBorderStyle} ${renderStyle.iconBorderColor || iconColor}`
                             : (renderStyle.iconBorder || 'none'),
                         borderRadius: renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0px',
                         borderTopLeftRadius: renderStyle.iconBorderTopLeftRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0px'),
                         borderTopRightRadius: renderStyle.iconBorderTopRightRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0px'),
                         borderBottomRightRadius: renderStyle.iconBorderBottomRightRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0px'),
                         borderBottomLeftRadius: renderStyle.iconBorderBottomLeftRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0px'),
                         boxShadow: renderStyle.iconShadow || 'none'
                     }}>
                     <IconRenderer icon={content.icon} size={content.iconSize || safeStyle.fontSize || '2rem'} style={{ color: iconColor }} />
                 </div>
                 </div>
             );
         }
            
        case 'icon-box': {
            const iconBoxColor = renderStyle.iconColor || theme?.iconColor || renderStyle?.accentColor || theme?.accentColor || '#F59E0B';
            const iconBoxBg = renderStyle.iconBackgroundColor || renderStyle.iconBgColor || theme?.iconBgColor || 'rgba(241, 245, 249, 0.05)';
            const ibResolvedBg = resolveElementBackground(renderStyle);
            const ibTitleId = `${id}::title`;
            const ibDescId = `${id}::desc`;
            const ibDescLimitContent = withDefaultTextLimit(content as any, { mode: 'lines', maxLines: 3 });
            const ibDescFocused = isInlineEditing(ibDescId) || !!limitEditIds[ibDescId];
            const ibDescLimited = resolveLimitedTextDisplay({
              fullHtml: String(content.subText || 'Description for this icon box goes here.'),
              content: ibDescLimitContent,
              isFocused: ibDescFocused,
            });
            const ibDescEditable = !readOnly && ibDescLimited.allowEdit;

            const ibs = renderStyle as any;
            // Wrapper padding / radius / icon-to-content gap were hardcoded Tailwind
            // classes (p-4 gap-4 rounded-lg). Now overridable (Elementor icon_space
            // + container padding/radius). Defaults preserve the old look.
            const ibGap = ibs.iconSpace || ibs.contentGap || '1rem';
            const ibPad = safeStyle.padding || '1rem';
            const ibRadius = safeStyle.borderRadius || '0.5rem';
            return (
                <div key={id} className={`flex relative ${ibResolvedBg.overlay ? 'overflow-hidden' : ''} ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={{ ...safeStyle, gap: ibGap, padding: ibPad, borderRadius: ibRadius, backgroundColor: safeStyle.backgroundColor || theme?.cardBackgroundColor || 'rgba(255,255,255,0.05)', borderColor: safeStyle.borderColor || theme?.cardBorderColor || 'rgba(255,255,255,0.08)', borderWidth: safeStyle.borderWidth || '1px', borderStyle: safeStyle.borderStyle || 'solid', ...ibResolvedBg.backgroundStyle }}>
                    {ibResolvedBg.overlay && (
                        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundColor: ibResolvedBg.overlay.color, opacity: ibResolvedBg.overlay.opacity, mixBlendMode: ibResolvedBg.overlay.blendMode as any, zIndex: 0 }} />
                    )}
                    <div className="shrink-0 flex items-center justify-center rounded-lg"
                        style={{ 
                            width: renderStyle.iconContainerSize || '3rem',
                            height: renderStyle.iconContainerSize || '3rem',
                            backgroundColor: iconBoxBg,
                            color: iconBoxColor,
                            border: renderStyle.iconBorderStyle && renderStyle.iconBorderStyle !== 'none' 
                                ? `${renderStyle.iconBorderWidth || '1px'} ${renderStyle.iconBorderStyle} ${renderStyle.iconBorderColor || iconBoxColor}`
                                : (renderStyle.iconBorder || 'none'),
                            borderRadius: renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '8px',
                            borderTopLeftRadius: renderStyle.iconBorderTopLeftRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '8px'),
                            borderTopRightRadius: renderStyle.iconBorderTopRightRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '8px'),
                            borderBottomRightRadius: renderStyle.iconBorderBottomRightRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '8px'),
                            borderBottomLeftRadius: renderStyle.iconBorderBottomLeftRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '8px'),
                            boxShadow: renderStyle.iconShadow || 'none'
                        }}>
                         <IconRenderer icon={content.icon || 'fa-layer-group'} size={renderStyle.iconSize || '1.5rem'} style={{ color: iconBoxColor }} />
                    </div>
                    <div style={{ textAlign: (renderStyle.textAlign as any) || undefined }}>
                        <h3 className="font-bold outline-none"
                            style={{
                                color: renderStyle.titleColor || theme?.titleColor || '#0F172A',
                                fontSize: renderStyle.titleFontSize || '1.125rem',
                                fontWeight: renderStyle.titleFontWeight || '700',
                                textTransform: (renderStyle.titleTextTransform || renderStyle.textTransform) as any || 'none',
                                fontStyle: renderStyle.titleFontStyle || 'normal',
                                letterSpacing: renderStyle.titleLetterSpacing || 'normal',
                                fontFamily: renderStyle.titleFontFamily || renderStyle.fontFamily || theme?.titleFontFamily,
                                marginBottom: ibs.titleBottomSpace || '0.25rem',
                            }}
                            ref={bindHtml(ibTitleId, content.text || 'Icon Box Title')} 
                            contentEditable={!readOnly} 
                            {...editHandlers(ibTitleId, (html) => handleContentUpdate(id, 'text', html))} 
                        />
                        <p
                            key={`${ibDescId}-${ibDescLimited.limitKey}`}
                            className="outline-none"
                            data-gb-editable-id={ibDescId}
                            style={{
                                color: renderStyle.descriptionColor || renderStyle.textColor || theme?.textColor || '#475569',
                                fontSize: renderStyle.descriptionFontSize || '0.875rem',
                                fontWeight: renderStyle.descriptionFontWeight || '400',
                                textTransform: (renderStyle.descriptionTextTransform || renderStyle.textTransform) as any || 'none',
                                fontStyle: renderStyle.descriptionFontStyle || 'normal',
                                letterSpacing: renderStyle.descriptionLetterSpacing || 'normal',
                                fontFamily: renderStyle.descriptionFontFamily || renderStyle.fontFamily || theme?.descriptionFontFamily,
                                lineHeight: ibs.descriptionLineHeight || 1.7,
                                opacity: ibs.descriptionOpacity !== undefined ? ibs.descriptionOpacity : 0.7,
                                ...ibDescLimited.clampStyle,
                            }}
                            onClick={!readOnly ? (e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (ibDescLimited.limit.mode === 'words' && !ibDescFocused) {
                                setLimitEditIds((prev) => ({ ...prev, [ibDescId]: true }));
                              }
                            } : undefined}
                            ref={bindHtml(ibDescId, ibDescLimited.displayHtml)} 
                            contentEditable={ibDescEditable} 
                            {...editHandlers(ibDescId, (html) => {
                              if (!ibDescLimited.allowEdit) return;
                              handleContentUpdate(id, 'subText', html);
                              setLimitEditIds((prev) => {
                                if (!prev[ibDescId]) return prev;
                                const next = { ...prev };
                                delete next[ibDescId];
                                return next;
                              });
                            }, ibDescEditable)} 
                        />
                    </div>
                </div>
            );
        }

        case 'feature-box': {
            const fbSelectedClass = isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black z-20' : '';
            const c: any = content || {};
            const iconPos = c.iconPosition || renderStyle.iconPosition || 'top';
            const hasIcon = c.icon && c.icon !== 'none' && c.icon !== '';

            // Theme tokens: explicit featureBox.* wins, then falls back to generic theme tokens.
            const t: any = theme || {};
            const themeIconColor = t.featureBoxIconColor || t.iconColor || t.accentColor || '#E11D48';
            const themeIconBg    = t.featureBoxIconBg    || t.iconBgColor || `${themeIconColor}15`;
            const themeCardBg    = t.featureBoxBackground || t.cardBackgroundColor || '#FFFFFF';
            const themeCardBorder = t.featureBoxBorder   || t.cardBorderColor || t.borderColor || 'rgba(0,0,0,0.08)';
            const themeTitleColor = t.featureBoxTitleColor || t.titleColor || '#111827';
            const themeTextColor  = t.featureBoxTextColor  || t.textColor || '#4B5563';

            // User-customized element styles (sidebar edits) override theme; otherwise follow live theme.
            const featureIconColor = resolveElementColor({
              elementStyle: renderStyle as any,
              colorKey: 'iconColor',
              themeFallback: themeIconColor,
              isLightMode,
            });
            const featureIconBg      = renderStyle.iconBackgroundColor || renderStyle.iconBgColor || themeIconBg;
            const featureCardBg      = renderStyle.backgroundColor || themeCardBg;
            const featureBorderColor = renderStyle.borderColor || themeCardBorder;
            const featureTitleColor = resolveElementColor({
              elementStyle: renderStyle as any,
              colorKey: hasExplicitStyleValue(renderStyle as any, 'titleColor') ? 'titleColor' : 'color',
              themeFallback: themeTitleColor,
              isLightMode,
              lightFallback: '#111827',
              darkFallback: '#F8FAFC',
            });
            const featureTextColor = resolveElementColor({
              elementStyle: renderStyle as any,
              colorKey: hasExplicitStyleValue(renderStyle as any, 'descriptionColor')
                ? 'descriptionColor'
                : 'textColor',
              themeFallback: themeTextColor,
              isLightMode,
              lightFallback: '#4B5563',
              darkFallback: '#D1D5DB',
            });
            const accentColor        = t.accentColor || themeIconColor;

            const iconSize   = renderStyle.iconContainerSize || '3rem';
            const iconRadius = renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0.75rem';

            // Layout variant
            type FbLayout = 'classic' | 'inline' | 'minimal' | 'numbered' | 'stat' | 'split';
            const FB_ALLOWED: FbLayout[] = ['classic','inline','minimal','numbered','stat','split'];
            const layout: FbLayout = (FB_ALLOWED as string[]).includes(c.cardLayout) ? c.cardLayout : 'classic';

            const isMinimal  = layout === 'minimal';
            const isNumbered = layout === 'numbered';
            const isStat     = layout === 'stat';
            const isSplit    = layout === 'split';
            const isInline   = layout === 'inline';

            // Auto-number: index of this element among feature-box siblings in the section (1-based, 2-digit).
            const autoNumber = (() => {
                if (c.number && c.number.toString().trim() !== '') return c.number.toString().trim();
                const siblings = (section?.elements || []).filter(e => e.type === 'feature-box');
                const idx = siblings.findIndex(e => e.id === id);
                return String(Math.max(1, idx + 1)).padStart(2, '0');
            })();

            // Optional extras
            const badgeText = (c.badgeText || '').toString().trim();
            const hasBadge  = badgeText !== '';
            const ctaText   = (c.ctaText || '').toString().trim();
            const hasCta    = ctaText !== '';
            const statText  = (c.stat || '').toString().trim();
            const linkUrl   = (c.link || '').toString().trim();
            const hasLink   = linkUrl !== '';

            // Default padding / bg vary per layout
            const defaultPadding =
                isMinimal ? '0.5rem 0' :
                isSplit   ? '0' :
                isInline  ? '1.25rem 1.5rem' :
                '1.5rem';

            // Resolve flexible background (Color/Gradient/Image) from element style.
            // resolved.backgroundStyle wins over the legacy single backgroundColor.
            const fbResolvedBg = resolveElementBackground(renderStyle);
            const fbHasFlexBg = !!(fbResolvedBg.backgroundStyle.backgroundImage); // gradient/image
            // Per-corner card radius overrides (when user uses per-corner mode)
            const fbCardCornerStyle: React.CSSProperties = {
                ...(renderStyle.borderTopLeftRadius     ? { borderTopLeftRadius:     renderStyle.borderTopLeftRadius }     : {}),
                ...(renderStyle.borderTopRightRadius    ? { borderTopRightRadius:    renderStyle.borderTopRightRadius }    : {}),
                ...(renderStyle.borderBottomRightRadius ? { borderBottomRightRadius: renderStyle.borderBottomRightRadius } : {}),
                ...(renderStyle.borderBottomLeftRadius  ? { borderBottomLeftRadius:  renderStyle.borderBottomLeftRadius }  : {}),
            };

            // Per-side padding wins over shorthand. Strip leftover `padding` from safeStyle
            // when per-sides are present so it doesn't reset them via shorthand.
            const hasPerSidePadding = !!(renderStyle.paddingTop || renderStyle.paddingRight || renderStyle.paddingBottom || renderStyle.paddingLeft);
            const safeStyleNoPadding = hasPerSidePadding
                ? (() => { const { padding: _p, ...rest } = safeStyle as any; return rest; })()
                : safeStyle;

            const fbPaddingStyle: React.CSSProperties = hasPerSidePadding
                ? {
                    paddingTop:    renderStyle.paddingTop    || undefined,
                    paddingRight:  renderStyle.paddingRight  || undefined,
                    paddingBottom: renderStyle.paddingBottom || undefined,
                    paddingLeft:   renderStyle.paddingLeft   || undefined,
                }
                : { padding: safeStyle.padding || defaultPadding };

            const featureBoxStyle: React.CSSProperties = {
                ...safeStyleNoPadding,
                ...fbResolvedBg.backgroundStyle,
                backgroundColor: isMinimal
                    ? 'transparent'
                    : (fbResolvedBg.backgroundStyle.backgroundColor || featureCardBg),
                borderColor: featureBorderColor,
                borderWidth: safeStyle.borderWidth || (isMinimal ? '0' : '1px'),
                borderStyle: safeStyle.borderStyle || 'solid',
                borderRadius: (safeStyle as any).borderRadius || (isMinimal ? '0' : '1rem'),
                ...fbCardCornerStyle,
                ...fbPaddingStyle,
                overflow: (isSplit || fbHasFlexBg || fbResolvedBg.overlay) ? 'hidden' : undefined,
                position: fbResolvedBg.overlay ? 'relative' : undefined,
            };

            // ─── Sub-renderers (shared across variants) ───

            const softBorder = `${featureTitleColor}12`;

            const fbx = renderStyle as any;
            const badgeCol = renderStyle.badgeColor || accentColor;
            const renderBadge = () => hasBadge && (
                <span
                    className="outline-none inline-flex items-center"
                    style={{
                        backgroundColor: fbx.badgeBackgroundColor || `${badgeCol}14`,
                        color: badgeCol,
                        fontSize: fbx.badgeFontSize || '0.62rem',
                        fontWeight: fbx.badgeFontWeight || 800,
                        letterSpacing: fbx.badgeLetterSpacing || '0.08em',
                        textTransform: (fbx.badgeTextTransform as any) || 'uppercase',
                        padding: fbx.badgePadding || '3px 9px',
                        borderRadius: fbx.badgeRadius || '9999px',
                    }}
                    ref={bindHtml(id, badgeText)}
                    contentEditable={!readOnly}
                    {...editHandlers(id, (html) => handleContentUpdate(id, 'badgeText', html))}
                />
            );

            // Per-corner overrides win over the unified iconBorderRadius
            const fbIconCornerStyle: React.CSSProperties = {
                borderRadius: iconRadius,
                ...(renderStyle.iconBorderTopLeftRadius     ? { borderTopLeftRadius:     renderStyle.iconBorderTopLeftRadius }     : {}),
                ...(renderStyle.iconBorderTopRightRadius    ? { borderTopRightRadius:    renderStyle.iconBorderTopRightRadius }    : {}),
                ...(renderStyle.iconBorderBottomRightRadius ? { borderBottomRightRadius: renderStyle.iconBorderBottomRightRadius } : {}),
                ...(renderStyle.iconBorderBottomLeftRadius  ? { borderBottomLeftRadius:  renderStyle.iconBorderBottomLeftRadius }  : {}),
            };

            const renderIconBox = (size: string = iconSize) => hasIcon && (
                <div
                    className="shrink-0 flex items-center justify-center transition-all duration-300"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: featureIconBg,
                        color: featureIconColor,
                        ...fbIconCornerStyle,
                        boxShadow: renderStyle.iconShadow || 'none',
                        border: renderStyle.iconBorderStyle && renderStyle.iconBorderStyle !== 'none'
                            ? `${renderStyle.iconBorderWidth || '1px'} ${renderStyle.iconBorderStyle} ${renderStyle.iconBorderColor || featureIconColor}`
                            : 'none',
                    } as any}
                >
                    <IconRenderer icon={c.icon} size={renderStyle.iconSize || '1.25rem'} style={{ color: featureIconColor }} />
                </div>
            );

            const titleEditId = `${id}::title`;
            const descEditId = `${id}::desc`;
            const descLimitContent = withDefaultTextLimit(c, { mode: 'lines', maxLines: 3 });
            const descFocused = isInlineEditing(descEditId) || !!limitEditIds[descEditId];
            const descLimited = resolveLimitedTextDisplay({
              fullHtml: String(c.subText || ''),
              content: descLimitContent,
              isFocused: descFocused,
            });
            const descEditable = !readOnly && descLimited.allowEdit;

            const renderTitle = (size?: string) => (
                <h4
                    className="font-bold outline-none leading-snug"
                    style={{
                        color: featureTitleColor,
                        fontSize: renderStyle.titleFontSize || size || '1.05rem',
                        fontWeight: renderStyle.titleFontWeight || '700',
                        textTransform: (renderStyle.titleTextTransform || renderStyle.textTransform) as any || 'none',
                        fontStyle: renderStyle.titleFontStyle || 'normal',
                        letterSpacing: renderStyle.titleLetterSpacing || '-0.01em',
                        fontFamily: renderStyle.titleFontFamily || renderStyle.fontFamily || theme?.titleFontFamily,
                        margin: 0,
                    }}
                    ref={bindHtml(titleEditId, c.text || 'Feature Title')}
                    contentEditable={!readOnly}
                    {...editHandlers(titleEditId, (html) => handleContentUpdate(id, 'text', html))}
                />
            );

            const renderDescription = () => c.subText && c.subText.toString().trim() !== '' && (
                <p
                    key={`${descEditId}-${descLimited.limitKey}`}
                    className="leading-relaxed outline-none"
                    data-gb-editable-id={descEditId}
                    style={{
                        color: featureTextColor,
                        fontSize: renderStyle.descriptionFontSize || '0.875rem',
                        fontWeight: renderStyle.descriptionFontWeight || '400',
                        textTransform: (renderStyle.descriptionTextTransform || renderStyle.textTransform) as any || 'none',
                        fontStyle: renderStyle.descriptionFontStyle || 'normal',
                        letterSpacing: renderStyle.descriptionLetterSpacing || 'normal',
                        fontFamily: renderStyle.descriptionFontFamily || renderStyle.fontFamily || theme?.descriptionFontFamily,
                        opacity: fbx.descriptionOpacity !== undefined ? fbx.descriptionOpacity : 0.85,
                        margin: 0,
                        lineHeight: fbx.descriptionLineHeight || 1.7,
                        ...descLimited.clampStyle,
                    }}
                    title={
                      descLimited.limit.mode !== 'none' && !descFocused
                        ? plainTextForTruncate(String(c.subText || '')) || undefined
                        : undefined
                    }
                    onClick={!readOnly ? (e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleClick(e, el);
                      if (descLimited.limit.mode === 'words' && !descFocused) {
                        setLimitEditIds((prev) => ({ ...prev, [descEditId]: true }));
                      }
                    } : undefined}
                    ref={bindHtml(descEditId, descLimited.displayHtml)}
                    contentEditable={descEditable}
                    {...editHandlers(descEditId, (html) => {
                      if (!descLimited.allowEdit) return;
                      handleContentUpdate(id, 'subText', html);
                      setLimitEditIds((prev) => {
                        if (!prev[descEditId]) return prev;
                        const next = { ...prev };
                        delete next[descEditId];
                        return next;
                      });
                    }, descEditable)}
                />
            );

            const ctaCol = renderStyle.ctaColor || accentColor;
            const renderCta = () => hasCta && (
                <span
                    className="inline-flex items-center gap-1.5 mt-3 outline-none group/cta"
                    style={{
                        color: ctaCol,
                        fontSize: fbx.ctaFontSize || '0.82rem',
                        fontWeight: fbx.ctaFontWeight || 700,
                    }}
                >
                    <span
                        className="outline-none"
                        ref={bindHtml(`${id}::cta`, ctaText)}
                        contentEditable={!readOnly}
                        {...editHandlers(`${id}::cta`, (html) => handleContentUpdate(id, 'ctaText', html))}
                    />
                    <i className="fa-solid fa-arrow-right text-[0.7rem] transition-transform group-hover/cta:translate-x-0.5" />
                </span>
            );

            const numChipCol  = renderStyle.numberBadgeColor || accentColor;
            const numChipSize = renderStyle.numberBadgeSize || '2.5rem';
            const renderNumberBadge = (sizeOverride?: string) => {
                const size = sizeOverride || numChipSize;
                return (
                    <div
                        className="shrink-0 flex items-center justify-center font-black tabular-nums"
                        style={{
                            width: size,
                            height: size,
                            borderRadius: '9999px',
                            backgroundColor: `${numChipCol}14`,
                            color: numChipCol,
                            fontSize: `calc(${size} * 0.42)`,
                            letterSpacing: '-0.02em',
                            border: `1px solid ${numChipCol}22`,
                        }}
                    >
                        {autoNumber}
                    </div>
                );
            };

            const statCol = renderStyle.statColor || accentColor;
            const renderStatValue = () => (
                <div
                    className="outline-none font-black leading-none tabular-nums"
                    style={{
                        color: statCol,
                        fontSize: renderStyle.statFontSize || 'clamp(2rem, 4vw, 2.75rem)',
                        letterSpacing: '-0.03em',
                        marginBottom: '0.5rem',
                    }}
                    ref={bindHtml(id, statText || '100%')}
                    contentEditable={!readOnly}
                    {...editHandlers(id, (html) => handleContentUpdate(id, 'stat', html))}
                />
            );

            // Text alignment inside the card (left/center/right) — applies to all variants.
            // content.cardTextAlign wins; else honor the style-panel textAlign; else left.
            const cardTextAlignRaw =
                (c.cardTextAlign === 'center' || c.cardTextAlign === 'right' || c.cardTextAlign === 'left')
                    ? c.cardTextAlign
                    : (renderStyle.textAlign as string);
            const cardTextAlign: 'left' | 'center' | 'right' =
                (cardTextAlignRaw === 'center' || cardTextAlignRaw === 'right') ? cardTextAlignRaw : 'left';
            // Overridable gap between the card's stacked sub-parts (title/desc/cta).
            const fbContentGap = fbx.contentGap || '0.375rem';
            const textAlignClass =
                cardTextAlign === 'center' ? 'text-center' :
                cardTextAlign === 'right'  ? 'text-right'  : 'text-left';
            const itemsAlignClass =
                cardTextAlign === 'center' ? 'items-center' :
                cardTextAlign === 'right'  ? 'items-end'    : 'items-start';

            // ─── Content (layout-dependent) ───
            let inner: React.ReactNode;

            if (isMinimal) {
                inner = (
                    <div className={`flex flex-col gap-2 ${itemsAlignClass}`}>
                        {hasBadge && <div>{renderBadge()}</div>}
                        <div className="flex items-center gap-3">
                            {hasIcon && (
                                <span style={{ color: featureIconColor }}>
                                    <IconRenderer icon={c.icon} size={renderStyle.iconSize || '1.25rem'} style={{ color: featureIconColor }} />
                                </span>
                            )}
                            {renderTitle()}
                        </div>
                        {renderDescription()}
                        {renderCta()}
                    </div>
                );
            } else if (isInline) {
                inner = (
                    <div className="flex items-start gap-4">
                        {renderIconBox()}
                        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: fbContentGap }}>
                            {hasBadge && <div>{renderBadge()}</div>}
                            {renderTitle()}
                            {renderDescription()}
                            {renderCta()}
                        </div>
                    </div>
                );
            } else if (isNumbered) {
                inner = (
                    <div className="flex items-start gap-4">
                        {renderNumberBadge()}
                        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: fbContentGap }}>
                            {hasBadge && <div>{renderBadge()}</div>}
                            {renderTitle()}
                            {renderDescription()}
                            {renderCta()}
                        </div>
                    </div>
                );
            } else if (isStat) {
                inner = (
                    <div className={`flex flex-col ${itemsAlignClass}`} style={{ gap: fbContentGap }}>
                        {hasBadge && <div className="mb-1">{renderBadge()}</div>}
                        {renderStatValue()}
                        {renderTitle()}
                        {renderDescription()}
                        {renderCta()}
                    </div>
                );
            } else if (isSplit) {
                inner = (
                    <div className="flex min-h-[140px]">
                        <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                                width: '5.5rem',
                                background: `linear-gradient(180deg, ${accentColor}14, ${accentColor}06)`,
                                borderRight: `1px solid ${softBorder}`,
                            }}
                        >
                            {hasIcon ? renderIconBox('3rem') : renderNumberBadge('2.75rem')}
                        </div>
                        <div className="flex-1 p-5 flex flex-col" style={{ gap: fbContentGap }}>
                            {hasBadge && <div>{renderBadge()}</div>}
                            {renderTitle()}
                            {renderDescription()}
                            {renderCta()}
                        </div>
                    </div>
                );
            } else {
                // classic — respects iconPosition (top/left/right)
                const isTop   = iconPos === 'top';
                const isRight = iconPos === 'right';
                const flexDir = isTop ? 'flex-col' : isRight ? 'flex-row-reverse' : 'flex-row';
                // When icon stacks on top, align the whole column per text-align
                const outerAlign = isTop ? itemsAlignClass : 'items-start';
                inner = (
                    <div className={`flex ${flexDir} gap-4 ${outerAlign}`}>
                        {renderIconBox()}
                        <div className={`flex-1 flex flex-col ${isTop && hasIcon ? 'mt-1' : ''} ${isTop ? itemsAlignClass : ''}`} style={{ gap: fbContentGap }}>
                            {hasBadge && <div>{renderBadge()}</div>}
                            {renderTitle()}
                            {renderDescription()}
                            {renderCta()}
                        </div>
                    </div>
                );
            }

            // Wrap in <a> when linked (preview shows arrow + hover lift). In builder,
            // linked boxes get Open | Select via handleLinkedClick — never navigate.
            const wrapperClass = `relative overflow-hidden transition-all duration-300 ${textAlignClass} ${fbSelectedClass} ${hasLink && !isMinimal ? 'hover:-translate-y-0.5' : ''}`;
            const commonProps = {
                style: featureBoxStyle,
                ...(hasLink && !readOnly ? { 'data-gb-editable-link': '1' } : {}),
                onClick: (e: React.MouseEvent) => {
                    if (!readOnly) {
                      if (hasLink) {
                        handleLinkedClick(e, el, String((content as any).link || ''));
                      } else {
                        e.preventDefault();
                        handleClick(e as any, el);
                      }
                      return;
                    }
                    handleClick(e as any, el);
                },
            };

            // Optional overlay layer — only when the user set Background Overlay in sidebar
            const fbOverlayEl = fbResolvedBg.overlay ? (
                <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: fbResolvedBg.overlay.color,
                        opacity: fbResolvedBg.overlay.opacity,
                        mixBlendMode: fbResolvedBg.overlay.blendMode as any,
                        zIndex: 0,
                    }}
                />
            ) : null;
            // Inner content needs to sit above the overlay
            const innerWithOverlay = fbOverlayEl ? (
                <>
                    {fbOverlayEl}
                    <div className="relative" style={{ zIndex: 1 }}>{inner}</div>
                </>
            ) : inner;

            if (hasLink && readOnly) {
                return (
                    <a
                        key={id}
                        href={linkUrl}
                        className={`${wrapperClass} block no-underline`}
                        style={{ ...featureBoxStyle, color: 'inherit' }}
                    >
                        {innerWithOverlay}
                    </a>
                );
            }
            return (
                <div key={id} className={wrapperClass} {...commonProps}>
                    {innerWithOverlay}
                </div>
            );
        }

        case 'testimonial-card': {
            // Premium testimonial card — composite element with 3 layout variants
            // (classic / compact / hero). Every content field is optional and hides
            // when not populated. Every style key flows through the sidebar.
            const tcSelectedClass = isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black z-20' : '';
            const c: any = content || {};

            const t: any = theme || {};
            const themeAccent     = t.testimonialCardAccent || t.accentColor || '#E11D48';
            const themeStarColor  = t.testimonialCardStarColor || t.accentColor || '#F59E0B';

            // Priority everywhere: explicit element style (user sidebar edit)
            //   → dedicated `testimonialCard.*` theme token
            //   → hardcoded editorial defaults (white card, dark text — testimonial cards look best this way)
            // User CAN always override any of these from the sidebar.
            const cardBg      = renderStyle.backgroundColor || t.testimonialCardBackground || '#FFFFFF';
            const cardBorder  = renderStyle.borderColor     || t.testimonialCardBorder     || 'rgba(15,23,42,0.08)';
            const titleColor  = renderStyle.titleColor      || t.testimonialCardTitleColor || '#0F172A';
            const textColor   = renderStyle.descriptionColor || renderStyle.textColor || t.testimonialCardTextColor || '#475569';
            const quoteColor  = renderStyle.quoteColor || renderStyle.color || titleColor;
            const accentColor = renderStyle.accentColor || themeAccent;
            const starColor   = renderStyle.starColor || themeStarColor;

            // Text alignment — content.cardTextAlign drives the whole card.
            // Falls back to renderStyle.textAlign if set (sidebar-level override).
            const tcAlign = ((c.cardTextAlign as string) || (renderStyle.textAlign as string) || 'left').toLowerCase();
            const tcAlignValue: 'left' | 'center' | 'right' =
                tcAlign === 'center' ? 'center' : tcAlign === 'right' ? 'right' : 'left';
            const tcTextAlignClass =
                tcAlignValue === 'center' ? 'text-center' :
                tcAlignValue === 'right'  ? 'text-right'  : 'text-left';
            const tcItemsAlignClass =
                tcAlignValue === 'center' ? 'items-center' :
                tcAlignValue === 'right'  ? 'items-end'    : 'items-start';

            // Round incoming rating to the nearest 0.5 step (supports 3.5, 4.5 etc.)
            const rawRating   = Number(c.rating);
            const rating      = Number.isFinite(rawRating)
                ? Math.max(0, Math.min(5, Math.round(rawRating * 2) / 2))
                : 5;
            const maxRating   = 5;
            const service     = (c.service ?? '').toString();
            const hasService  = service.trim() !== '';
            const quote       = c.quote || c.text || 'Great service — fast, fair and friendly.';
            const author      = c.author || 'Customer Name';
            const role        = c.role || 'Location';
            const date        = (c.date ?? '').toString().trim();
            const hasDate     = date !== '';
            const avatarUrl   = toDisplayImageUrl(
                resolveSectionImageUrl(section, {
                    elementId: `${id}-avatar`,
                    elementImageUrl: c.avatar || c.imageUrl || '',
                })
            );
            const showAvatar  = c.showAvatar !== false;
            const showStars   = c.showStars !== false;
            const showVerified = c.showVerified !== false;
            const showVerifiedCustomer = !!c.showVerifiedCustomer;
            const verifiedCustomerLabel = (c.verifiedCustomerLabel || 'Verified Customer').toString();
            const helpfulCount = c.helpfulCount !== undefined && c.helpfulCount !== null
                ? Math.max(0, parseInt(String(c.helpfulCount).replace(/[^0-9]/g, ''), 10) || 0)
                : null;
            const showReply = !!c.showReply;
            const replyAuthor = (c.replyAuthor || 'Business Response').toString();
            const replyText = (c.reply || '').toString();
            const accentStripe = !!c.accentStripe;

            // Source platform pill — Google / Yelp / etc.
            const sourceKey: string = c.source || 'none';
            const sourceMap: Record<string, { label: string; icon: string; brand: string }> = {
                google:     { label: 'via Google',     icon: 'fa-brands fa-google',     brand: '#4285F4' },
                yelp:       { label: 'via Yelp',       icon: 'fa-brands fa-yelp',       brand: '#D32323' },
                trustpilot: { label: 'via Trustpilot', icon: 'fa-solid fa-star',        brand: '#00B67A' },
                facebook:   { label: 'via Facebook',   icon: 'fa-brands fa-facebook',   brand: '#1877F2' },
                custom:     { label: `via ${c.sourceLabel || 'Custom'}`, icon: 'fa-solid fa-link', brand: accentColor },
            };
            const sourceMeta = sourceMap[sourceKey];

            // Criteria rating breakdown (up to 3)
            const criteriaList: Array<{ label: string; rating: number }> = Array.isArray(c.criteria) ? c.criteria : [];
            const hasCriteria = criteriaList.length > 0;

            const avatarSize   = renderStyle.avatarSize || '3rem';
            const avatarRadius = renderStyle.avatarBorderRadius !== undefined ? renderStyle.avatarBorderRadius : '50%';
            const starSize     = renderStyle.starSize || '0.95rem';

            // Layout variant — 6 options
            type CardLayout = 'classic' | 'compact' | 'hero' | 'minimal' | 'quote-first' | 'split';
            const ALLOWED: CardLayout[] = ['classic','compact','hero','minimal','quote-first','split'];
            const layout: CardLayout = (ALLOWED as string[]).includes(c.cardLayout) ? c.cardLayout : 'classic';

            // Resting / hover shadow — neutral, no accent glow
            const restShadow  = renderStyle.boxShadow || '0 1px 2px rgba(15,23,42,0.04)';
            const hoverShadow = '0 12px 28px -12px rgba(15,23,42,0.15), 0 4px 10px -4px rgba(15,23,42,0.08)';

            const stripeWidth = renderStyle.accentStripeWidth || '4px';
            const stripeColor = renderStyle.accentStripeColor || accentColor;

            // Minimal variant: borderless, no bg — airy editorial layout
            const isMinimal = layout === 'minimal';
            // Split variant uses internal panels, so outer card has zero padding
            const isSplit   = layout === 'split';

            const defaultPadding =
                isMinimal ? '0.5rem 0' :
                isSplit ? '0' :
                layout === 'compact' ? '1.5rem' :
                '2rem';

            // Resolve flexible background (Color/Gradient/Image) from element style.
            const tcResolvedBg = resolveElementBackground(renderStyle);
            const tcHasFlexBg = !!(tcResolvedBg.backgroundStyle.backgroundImage);
            const cardStyle: React.CSSProperties = {
                ...safeStyle,
                ...tcResolvedBg.backgroundStyle,
                backgroundColor: isMinimal
                    ? 'transparent'
                    : (tcResolvedBg.backgroundStyle.backgroundColor || cardBg),
                borderColor: cardBorder,
                borderWidth: safeStyle.borderWidth || (isMinimal ? '0' : '1px'),
                borderStyle: safeStyle.borderStyle || 'solid',
                borderRadius: (safeStyle as any).borderRadius || (isMinimal ? '0' : '1.5rem'),
                padding: safeStyle.padding || defaultPadding,
                boxShadow: isMinimal ? 'none' : restShadow,
                overflow: (isSplit || tcHasFlexBg || tcResolvedBg.overlay) ? 'hidden' : undefined,
                position: tcResolvedBg.overlay ? 'relative' : (isSplit ? undefined : undefined),
                // Accent stripe uses a thicker left border — overrides borderWidth/borderColor partially
                ...(accentStripe && !isMinimal ? {
                    borderLeftWidth: stripeWidth,
                    borderLeftColor: stripeColor,
                    borderLeftStyle: 'solid',
                } : {}),
            };

            // ─── Sub-renderers (shared across variants) ───

            // Editorial design language:
            //   • Accent color is reserved for ONE thing that earns it (the stars).
            //   • Everything else uses calm neutrals with soft borders — calmer,
            //     more trustworthy, less "template-y".
            const softBg      = `${titleColor}06`;   // very faint neutral chip background
            const softBorder  = `${titleColor}12`;   // subtle neutral border
            const mutedText   = `${titleColor}99`;   // secondary label color — darkens with theme

            // Render 0–5 stars supporting half-steps (e.g. 3.5 → 3 full + 1 half + 1 empty).
            // Subtle accent-tinted soft pill brings back one small color accent without noise.
            const renderStars = (displayRating: number, size: string = starSize) => (
                <div
                    className="inline-flex items-center gap-2"
                    style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: `${starColor}10`,
                    }}
                >
                    <div className="flex items-center" style={{ gap: '3px', color: starColor, fontSize: size }}>
                        {Array.from({ length: maxRating }).map((_, i) => {
                            const diff = displayRating - i;
                            if (diff >= 1) {
                                return <i key={i} className="fa-solid fa-star" />;
                            }
                            if (diff >= 0.5) {
                                return <i key={i} className="fa-solid fa-star-half-stroke" />;
                            }
                            return <i key={i} className="fa-regular fa-star" style={{ opacity: 0.3 }} />;
                        })}
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: starColor, opacity: 0.9 }}>
                        {displayRating.toFixed(1)}
                    </span>
                </div>
            );

            const renderServiceTag = () => hasService && (
                <span
                    className="outline-none inline-flex items-center"
                    style={{
                        backgroundColor: 'transparent',
                        color: mutedText,
                        fontSize: renderStyle.serviceFontSize || '0.68rem',
                        fontWeight: renderStyle.serviceFontWeight || '700',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${softBorder}`,
                    } as any}
                    ref={bindHtml(id, service)}
                    contentEditable={!readOnly}
                    {...editHandlers(id, (html) => handleContentUpdate(id, 'service', html))}
                />
            );

            // Source pill — mostly neutral; only the platform icon keeps its brand color
            // (small, recognizable, not overwhelming). Sidebar can still force a full override.
            const sourceOverride = renderStyle.sourceColor;
            const renderSourcePill = () => sourceMeta && (
                <span
                    className="inline-flex items-center gap-1.5"
                    style={{
                        fontSize: renderStyle.dateFontSize || '0.7rem',
                        fontWeight: 500,
                        color: mutedText,
                    }}
                    title={sourceMeta.label}
                >
                    <i className={sourceMeta.icon} style={{ color: sourceOverride || sourceMeta.brand, fontSize: '0.75rem' }} />
                    <span>{sourceMeta.label}</span>
                </span>
            );

            const renderDate = () => hasDate && (
                <span
                    className="outline-none"
                    style={{
                        color: renderStyle.dateColor || mutedText,
                        fontSize: renderStyle.dateFontSize || '0.7rem',
                        fontWeight: 500,
                    }}
                    ref={bindHtml(id, date)}
                    contentEditable={!readOnly}
                    {...editHandlers(id, (html) => handleContentUpdate(id, 'date', html))}
                />
            );

            // Verified-customer: subtle neutral pill, tiny shield icon keeps the trust cue
            // but doesn't scream "look at me" in green anymore.
            const vcColor = renderStyle.verifiedCustomerColor || mutedText;
            const renderVerifiedPill = () => showVerifiedCustomer && (
                <span
                    className="inline-flex items-center gap-1.5"
                    style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: vcColor,
                        backgroundColor: softBg,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: `1px solid ${softBorder}`,
                    }}
                >
                    <i className="fa-solid fa-shield-check" style={{ fontSize: '0.65rem', color: renderStyle.verifiedCustomerColor || '#16A34A', opacity: 0.85 }} />
                    <span
                        className="outline-none"
                        ref={bindHtml(id, verifiedCustomerLabel)}
                        contentEditable={!readOnly}
                        {...editHandlers(id, (html) => handleContentUpdate(id, 'verifiedCustomerLabel', html))}
                    />
                </span>
            );

            // Criteria chips: flat, borderless, use subtle soft background — keeps focus on the stars
            const criteriaBg = renderStyle.criteriaBgColor || softBg;
            const criteriaLabelColor = renderStyle.criteriaLabelColor || mutedText;
            const renderCriteria = () => hasCriteria && (
                <div className="grid gap-2 mb-5 relative z-10" style={{ gridTemplateColumns: `repeat(${Math.min(criteriaList.length, 3)}, minmax(0, 1fr))` }}>
                    {criteriaList.slice(0, 3).map((cr, i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-1 px-3 py-2 rounded-md"
                            style={{ backgroundColor: criteriaBg }}
                        >
                            <span className="text-[0.6rem] font-semibold uppercase tracking-wider truncate" style={{ color: criteriaLabelColor }}>
                                {cr.label || 'Criterion'}
                            </span>
                            <div className="flex items-center" style={{ gap: '1px', color: starColor, fontSize: '0.7rem' }}>
                                {Array.from({ length: maxRating }).map((_, j) => {
                                    const crVal = Math.max(0, Math.min(5, Math.round((cr.rating || 0) * 2) / 2));
                                    const diff = crVal - j;
                                    if (diff >= 1) return <i key={j} className="fa-solid fa-star" />;
                                    if (diff >= 0.5) return <i key={j} className="fa-solid fa-star-half-stroke" />;
                                    return <i key={j} className="fa-regular fa-star" style={{ opacity: 0.25 }} />;
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            );

            const renderQuote = (size?: string, weight?: string) => (
                <p
                    className="outline-none relative z-10"
                    style={{
                        color: quoteColor,
                        fontSize: renderStyle.quoteFontSize || size || '1.0625rem',
                        lineHeight: renderStyle.quoteLineHeight || '1.6',
                        fontStyle: renderStyle.quoteFontStyle || 'normal',
                        fontWeight: renderStyle.quoteFontWeight || weight || '500',
                        letterSpacing: renderStyle.quoteLetterSpacing || '-0.005em',
                        fontFamily: renderStyle.quoteFontFamily || renderStyle.fontFamily || theme?.descriptionFontFamily,
                    }}
                    ref={bindHtml(id, quote)}
                    contentEditable={!readOnly}
                    {...editHandlers(id, (html) => handleContentUpdate(id, 'quote', html))}
                />
            );

            // Thin accent ring on avatar — subtle color touch that anchors the card.
            const renderAvatar = (size: string = avatarSize) => showAvatar && (
                <img
                    src={avatarUrl}
                    alt={author.replace(/<[^>]+>/g, '')}
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = SECTION_IMAGE_PLACEHOLDER; }}
                    className="flex-shrink-0"
                    style={{
                        display: 'block',
                        width: size,
                        height: size,
                        borderRadius: avatarRadius,
                        objectFit: 'cover',
                        border: `2px solid ${accentColor}2A`,
                    }}
                />
            );

            const renderAuthorBlock = (align: 'left' | 'center' = 'left') => (
                <div className={`flex-1 min-w-0 ${align === 'center' ? 'text-center' : ''}`}>
                    <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''}`}>
                        <div
                            className="outline-none leading-tight truncate"
                            style={{
                                color: titleColor,
                                fontSize: renderStyle.titleFontSize || '0.9375rem',
                                fontWeight: renderStyle.titleFontWeight || '700',
                                fontFamily: renderStyle.titleFontFamily || renderStyle.fontFamily || theme?.titleFontFamily,
                                letterSpacing: renderStyle.titleLetterSpacing || '-0.005em',
                            }}
                            ref={bindHtml(id, author)}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'author', html))}
                        />
                        {showVerified && (
                            <span
                                aria-hidden
                                className="inline-flex items-center justify-center flex-shrink-0"
                                title="Verified"
                                style={{
                                    width: '15px', height: '15px', borderRadius: '9999px',
                                    backgroundColor: renderStyle.verifiedColor || `${titleColor}18`,
                                    color: renderStyle.verifiedColor ? '#FFFFFF' : titleColor,
                                    fontSize: '8px', lineHeight: 1,
                                }}
                            >
                                <i className="fa-solid fa-check" style={{ fontSize: '7px' }} />
                            </span>
                        )}
                    </div>
                    <div
                        className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''}`}
                        style={{
                            color: textColor,
                            fontSize: renderStyle.descriptionFontSize || '0.75rem',
                            fontWeight: renderStyle.descriptionFontWeight || '500',
                            fontFamily: renderStyle.descriptionFontFamily || renderStyle.fontFamily || theme?.descriptionFontFamily,
                            marginTop: '3px',
                            opacity: 0.75,
                        }}
                    >
                        <i className="fa-solid fa-location-dot" style={{ fontSize: '0.625rem', opacity: 0.6 }} />
                        <span
                            className="outline-none truncate"
                            ref={bindHtml(id, role)}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'role', html))}
                        />
                    </div>
                </div>
            );

            const replyBg = renderStyle.replyBgColor || softBg;
            const replyStripe = renderStyle.replyStripeColor || softBorder;
            const replyAuthorCol = renderStyle.replyAuthorColor || titleColor;
            const replyTextCol = renderStyle.replyTextColor || textColor;
            const renderReply = () => showReply && replyText.trim() !== '' && (
                <div
                    className="mt-5 pl-4 py-3 pr-4 rounded-lg relative z-10"
                    style={{
                        backgroundColor: replyBg,
                        borderLeft: `3px solid ${replyStripe}`,
                    }}
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <i className="fa-solid fa-reply" style={{ color: mutedText, fontSize: '0.7rem' }} />
                        <span
                            className="text-[0.7rem] font-bold outline-none"
                            style={{ color: replyAuthorCol }}
                            ref={bindHtml(id, replyAuthor)}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'replyAuthor', html))}
                        />
                    </div>
                    <p
                        className="outline-none text-[0.8rem] leading-relaxed"
                        style={{ color: replyTextCol }}
                        ref={bindHtml(id, replyText)}
                        contentEditable={!readOnly}
                        {...editHandlers(id, (html) => handleContentUpdate(id, 'reply', html))}
                    />
                </div>
            );

            const helpfulCol = renderStyle.helpfulColor || textColor;
            const helpfulFontSize = renderStyle.helpfulFontSize || '0.7rem';
            const renderFooterMeta = () => {
                // Bottom row: helpful count on left, source + date on right
                const hasAnyMeta = helpfulCount !== null || sourceMeta || hasDate;
                if (!hasAnyMeta) return null;
                return (
                    <div className="flex items-center justify-between gap-2 flex-wrap mt-4 pt-4 relative z-10"
                         style={{ borderTop: `1px dashed ${cardBorder}` }}>
                        {helpfulCount !== null ? (
                            <span className="flex items-center gap-1.5 font-medium" style={{ color: helpfulCol, fontSize: helpfulFontSize, opacity: renderStyle.helpfulColor ? 1 : 0.7 }}>
                                <i className="fa-solid fa-thumbs-up" style={{ fontSize: helpfulFontSize }} />
                                <span><strong style={{ color: titleColor }}>{helpfulCount}</strong> found this helpful</span>
                            </span>
                        ) : <span />}
                        <div className="flex items-center gap-2 flex-wrap">
                            {renderDate()}
                            {renderSourcePill()}
                        </div>
                    </div>
                );
            };

            // Subtle quote mark — small, neutral, top-right corner so it doesn't collide
            // with the header row. Hero centers it above the quote text.
            const decorativeQuoteGlyph = (
                <i
                    aria-hidden
                    className="fa-solid fa-quote-left absolute pointer-events-none select-none"
                    style={{
                        fontSize: layout === 'hero' ? '1.75rem' : '1rem',
                        color: titleColor,
                        opacity: layout === 'hero' ? 0.16 : 0.12,
                        top: layout === 'hero' ? '1.5rem' : '1.25rem',
                        ...(layout === 'hero'
                            ? { left: '50%', transform: 'translateX(-50%)' }
                            : { right: '1.25rem' }),
                    } as any}
                />
            );

            // Optional bg overlay layer
            const tcOverlayEl = tcResolvedBg.overlay ? (
                <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: tcResolvedBg.overlay.color,
                        opacity: tcResolvedBg.overlay.opacity,
                        mixBlendMode: tcResolvedBg.overlay.blendMode as any,
                        zIndex: 0,
                    }}
                />
            ) : null;

            // ─── Layout switch ───
            return (
                <div
                    key={id}
                    className={`group relative flex flex-col ${tcTextAlignClass} ${tcItemsAlignClass} h-full overflow-hidden transition-all duration-500 hover:-translate-y-1 ${tcSelectedClass}`}
                    onClick={(e) => handleClick(e, el)}
                    style={cardStyle}
                    onMouseEnter={(e) => { if (!isMinimal) { (e.currentTarget as HTMLDivElement).style.boxShadow = hoverShadow; (e.currentTarget as HTMLDivElement).style.borderColor = `${titleColor}18`; } }}
                    onMouseLeave={(e) => { if (!isMinimal) { (e.currentTarget as HTMLDivElement).style.boxShadow = restShadow; (e.currentTarget as HTMLDivElement).style.borderColor = cardBorder; } }}
                >
                    {tcOverlayEl}
                    {!isMinimal && decorativeQuoteGlyph}

                    {layout === 'compact' && (
                        <>
                            {/* Compact: avatar left, everything inline */}
                            <div className="flex items-start gap-4 mb-4 relative z-10">
                                {renderAvatar('2.5rem')}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div
                                                className="outline-none truncate text-[0.9rem] font-bold leading-tight"
                                                style={{ color: titleColor }}
                                                ref={bindHtml(id, author)}
                                                contentEditable={!readOnly}
                                                {...editHandlers(id, (html) => handleContentUpdate(id, 'author', html))}
                                            />
                                            {showVerified && (
                                                <span aria-hidden style={{ width: '13px', height: '13px', borderRadius: '9999px', backgroundColor: renderStyle.verifiedColor || `${titleColor}18`, color: renderStyle.verifiedColor ? '#FFF' : titleColor, fontSize: '7px', lineHeight: 1 }} className="inline-flex items-center justify-center flex-shrink-0">
                                                    <i className="fa-solid fa-check" style={{ fontSize: '6px' }} />
                                                </span>
                                            )}
                                        </div>
                                        {showStars && renderStars(rating, '0.8rem')}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className="outline-none text-[0.7rem] truncate"
                                            style={{ color: textColor, opacity: 0.7 }}
                                            ref={bindHtml(id, role)}
                                            contentEditable={!readOnly}
                                            {...editHandlers(id, (html) => handleContentUpdate(id, 'role', html))}
                                        />
                                        {hasService && <span style={{ color: textColor, opacity: 0.3 }}>·</span>}
                                        {renderServiceTag()}
                                    </div>
                                </div>
                            </div>
                            {(showVerifiedCustomer) && (
                                <div className="flex items-center gap-2 flex-wrap mb-3 relative z-10">
                                    {renderVerifiedPill()}
                                </div>
                            )}
                            {renderCriteria()}
                            <div className="flex-1 relative z-10">
                                {renderQuote('0.95rem', '500')}
                            </div>
                            {renderReply()}
                            {renderFooterMeta()}
                        </>
                    )}

                    {layout === 'hero' && (
                        <>
                            {/* Hero: massive centered quote, author below */}
                            {(showStars || hasService || showVerifiedCustomer) && (
                                <div className="flex items-center justify-center gap-2 flex-wrap mb-5 relative z-10">
                                    {showStars && renderStars(rating)}
                                    {hasService && renderServiceTag()}
                                    {renderVerifiedPill()}
                                </div>
                            )}
                            {renderCriteria()}
                            <div className="flex-1 flex items-center justify-center mb-6 relative z-10">
                                <div className="max-w-2xl text-center">
                                    {renderQuote('1.375rem', '500')}
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3 relative z-10">
                                {renderAvatar('3.5rem')}
                                {renderAuthorBlock('center')}
                            </div>
                            {renderReply()}
                            {renderFooterMeta()}
                        </>
                    )}

                    {layout === 'classic' && (
                        <>
                            {/* Classic: rating + service top, quote middle, author bottom */}
                            <div className="flex items-start justify-between gap-3 mb-5 relative z-10 flex-wrap">
                                {showStars ? renderStars(rating) : <div />}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {renderVerifiedPill()}
                                    {renderServiceTag()}
                                </div>
                            </div>
                            {renderCriteria()}
                            <div className="flex-1 mb-6 relative z-10">
                                {renderQuote()}
                            </div>
                            {/* Divider — flat, understated */}
                            <div
                                aria-hidden
                                className="h-px w-full mb-5 relative z-10"
                                style={{ backgroundColor: softBorder }}
                            />
                            {/* Author row */}
                            <div className="flex items-center gap-4 relative z-10">
                                {renderAvatar()}
                                {renderAuthorBlock('left')}
                            </div>
                            {renderReply()}
                            {renderFooterMeta()}
                        </>
                    )}

                    {layout === 'minimal' && (
                        <>
                            {/* Minimal: no card chrome at all. Airy stack: stars, quote, —  author inline */}
                            {showStars && <div className="mb-4 relative z-10">{renderStars(rating, '0.85rem')}</div>}
                            {renderCriteria()}
                            <div className="relative z-10">
                                {renderQuote('1.05rem', '500')}
                            </div>
                            <div className="flex items-center gap-3 mt-5 relative z-10">
                                <span className="inline-block w-8 h-px" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
                                <div className="flex items-center gap-2 text-[0.85rem]">
                                    <span
                                        className="outline-none font-semibold"
                                        style={{ color: titleColor }}
                                        ref={bindHtml(id, author)}
                                        contentEditable={!readOnly}
                                        {...editHandlers(id, (html) => handleContentUpdate(id, 'author', html))}
                                    />
                                    {hasDate && (
                                        <>
                                            <span style={{ color: mutedText, opacity: 0.5 }}>·</span>
                                            <span
                                                className="outline-none text-[0.8rem]"
                                                style={{ color: mutedText }}
                                                ref={bindHtml(id, date)}
                                                contentEditable={!readOnly}
                                                {...editHandlers(id, (html) => handleContentUpdate(id, 'date', html))}
                                            />
                                        </>
                                    )}
                                    <span style={{ color: mutedText, opacity: 0.5 }}>·</span>
                                    <span
                                        className="outline-none text-[0.8rem]"
                                        style={{ color: mutedText }}
                                        ref={bindHtml(id, role)}
                                        contentEditable={!readOnly}
                                        {...editHandlers(id, (html) => handleContentUpdate(id, 'role', html))}
                                    />
                                </div>
                            </div>
                            {renderReply()}
                        </>
                    )}

                    {layout === 'quote-first' && (
                        <>
                            {/* Editorial: big italic quote up top with oversized glyph, then small attribution row */}
                            <div className="relative z-10 mb-6">
                                {renderQuote('1.375rem', '500')}
                            </div>
                            {renderCriteria()}
                            <div className="flex items-center justify-between gap-4 pt-5 relative z-10" style={{ borderTop: `1px solid ${softBorder}` }}>
                                <div className="flex items-center gap-3">
                                    {renderAvatar('2.25rem')}
                                    {renderAuthorBlock('left')}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {showStars && renderStars(rating, '0.75rem')}
                                    {renderVerifiedPill()}
                                </div>
                            </div>
                            {renderReply()}
                            {renderFooterMeta()}
                        </>
                    )}

                    {layout === 'split' && (
                        <>
                            {/* Split: two internal panels — left tinted accent panel with avatar, right white panel with quote */}
                            <div className="flex relative z-10 min-h-[180px]">
                                <div
                                    className="flex flex-col items-center justify-center gap-3 p-5 flex-shrink-0"
                                    style={{
                                        width: '130px',
                                        background: `linear-gradient(180deg, ${accentColor}14, ${accentColor}06)`,
                                        borderRight: `1px solid ${softBorder}`,
                                    }}
                                >
                                    {renderAvatar('3.25rem')}
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <div
                                                className="outline-none text-[0.82rem] font-bold leading-tight"
                                                style={{ color: titleColor }}
                                                ref={bindHtml(id, author)}
                                                contentEditable={!readOnly}
                                                {...editHandlers(id, (html) => handleContentUpdate(id, 'author', html))}
                                            />
                                            {showVerified && (
                                                <span aria-hidden style={{ width: '12px', height: '12px', borderRadius: '9999px', backgroundColor: renderStyle.verifiedColor || `${titleColor}18`, color: renderStyle.verifiedColor ? '#FFF' : titleColor, fontSize: '6px', lineHeight: 1 }} className="inline-flex items-center justify-center flex-shrink-0">
                                                    <i className="fa-solid fa-check" style={{ fontSize: '6px' }} />
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="outline-none text-[0.68rem] mt-1"
                                            style={{ color: mutedText }}
                                            ref={bindHtml(id, role)}
                                            contentEditable={!readOnly}
                                            {...editHandlers(id, (html) => handleContentUpdate(id, 'role', html))}
                                        />
                                    </div>
                                    {showStars && <div style={{ transform: 'scale(0.85)' }}>{renderStars(rating, '0.7rem')}</div>}
                                </div>
                                <div className="flex-1 p-6 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        {renderServiceTag()}
                                        {renderVerifiedPill()}
                                    </div>
                                    {renderCriteria()}
                                    <div className="flex-1">
                                        {renderQuote('0.95rem', '500')}
                                    </div>
                                    {(hasDate || sourceMeta || helpfulCount !== null) && (
                                        <div className="flex items-center justify-between gap-2 flex-wrap mt-4 pt-3" style={{ borderTop: `1px dashed ${softBorder}` }}>
                                            {helpfulCount !== null ? (
                                                <span className="flex items-center gap-1.5 font-medium" style={{ color: helpfulCol, fontSize: helpfulFontSize, opacity: renderStyle.helpfulColor ? 1 : 0.7 }}>
                                                    <i className="fa-solid fa-thumbs-up" style={{ fontSize: helpfulFontSize }} />
                                                    <span><strong style={{ color: titleColor }}>{helpfulCount}</strong> helpful</span>
                                                </span>
                                            ) : <span />}
                                            <div className="flex items-center gap-2">
                                                {renderDate()}
                                                {renderSourcePill()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {renderReply()}
                        </>
                    )}
                </div>
            );
        }

        case 'image-box': {
            // Simple, bulletproof image-box: image on top, content below. ONE layout.
            // All visuals come from plain style keys; no layout switcheroo or react.cloneElement.
            const resolvedBoxSrc = resolveSectionImageUrlForElement(section, { id, content });
            const fullImageBoxUrl = toDisplayImageUrl(resolvedBoxSrc);

            // Strip image-area + layout keys so they do not leak onto the card wrapper.
            const ibSafeStyle: any = stripImageBoxImageKeys({ ...(safeStyle as any) });
            delete ibSafeStyle.aspectRatio;
            delete ibSafeStyle.overflow;
            delete ibSafeStyle.padding;
            delete ibSafeStyle.flexDirection;
            delete ibSafeStyle.position;

            // Card chrome
            const ibCardBg     = ibSafeStyle.backgroundColor || 'transparent';
            const ibCardBorder = ibSafeStyle.borderColor || 'transparent';
            const ibBorderWidth = ibSafeStyle.borderWidth || '0px';
            const ibRadius     = ibSafeStyle.borderRadius || '0.875rem';
            // Content area — generous default gap so title/desc/button breathe
            const ibContentPadding = (renderStyle as any).contentPadding || '1rem';
            const ibContentGap     = (renderStyle as any).contentGap || '1rem';
            // Gap between the image and the content block (title starts here)
            const ibImageGap       = (renderStyle as any).imageContentGap || '1rem';
            const ibImageHeight    = (renderStyle as any).imageHeight  || '12rem';
            const safeImgId = `ib-${id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            const ibImageScopeId = `ib-img-${safeImgId}`;
            const ibImageNorm = normalizeImageBoxImageStyle(renderStyle as any);
            const ibCombinedFilter = buildCombinedImageFilter(
              ibImageNorm,
              (renderStyle as any).filter
            );
            const ibImageAspectRaw = (renderStyle as any).imageAspectRatio || '';
            const ibHasImageAspect = !!(ibImageAspectRaw && ibImageAspectRaw !== 'auto');
            const ibImageOuterStyle = buildImageOuterStyle(ibImageNorm, {
              height: ibImageHeight,
              useAspectRatio: ibHasImageAspect,
            });
            const ibImgStyle = buildImageImgStyle(ibImageNorm, ibCombinedFilter);
            // Title
            const ibTitleCol      = (renderStyle as any).titleColor || theme?.titleColor || '#111827';
            const ibTitleHeadingTag = (
              ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(String((renderStyle as any).titleHeadingTag || ''))
                ? String((renderStyle as any).titleHeadingTag)
                : IMAGE_BOX_DEFAULT_TITLE_HEADING
            ) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
            const ibHeadingSizeFallback: Record<string, string> = {
              h1: '3rem', h2: '2.5rem', h3: '2rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem',
            };
            const ibTitleFontSize = (renderStyle as any).titleFontSize
              || ibHeadingSizeFallback[ibTitleHeadingTag]
              || ibHeadingSizeFallback.h5;
            const IbTitleTag = ibTitleHeadingTag;
            const ibTitleFontFamily = (renderStyle as any).titleFontFamily || theme?.titleFontFamily || '';
            const ibTitleWeight   = (renderStyle as any).titleFontWeight || '700';
            const ibTitleAlign    = (renderStyle as any).titleAlign || (renderStyle as any).textAlign || 'left';
            // Description
            const ibDescCol      = (renderStyle as any).descriptionColor || theme?.textColor || '#4B5563';
            const ibDescTextSize = (renderStyle as any).descriptionTextSize as string | undefined;
            const ibDescFontSize = (renderStyle as any).descriptionFontSize
              || (ibDescTextSize === 'small' ? '0.875rem'
                : ibDescTextSize === 'large' ? '1.125rem'
                : ibDescTextSize === 'xl' ? '1.25rem'
                : '0.875rem');
            const ibDescFontFamily = (renderStyle as any).descriptionFontFamily || theme?.descriptionFontFamily || '';
            const ibDescAlign    = (renderStyle as any).descriptionAlign || (renderStyle as any).textAlign || 'left';
            // Line clamp — limit description to N lines (0 = no clamp). Prefer content Show Text.
            const ibDescLineClamp: number = parseInt(String((renderStyle as any).descriptionLineClamp || 0), 10) || 0;
            const ibDescEditId = `${id}::desc`;
            const ibDescFull = String(content.description || content.subText || 'Description text.');
            const ibDescLimitContent = (() => {
              const base: Record<string, any> = { ...(content as any) };
              if (
                !base.textLimitMode &&
                !(Number(base.maxLines) > 0) &&
                !(Number(base.wordLimit) > 0) &&
                ibDescLineClamp > 0
              ) {
                return { ...base, textLimitMode: 'lines', maxLines: ibDescLineClamp };
              }
              return base;
            })();
            const ibDescFocused = isInlineEditing(ibDescEditId) || !!limitEditIds[ibDescEditId];
            const ibDescLimited = resolveLimitedTextDisplay({
              fullHtml: ibDescFull,
              content: ibDescLimitContent,
              isFocused: ibDescFocused,
            });
            const ibDescEditable = !readOnly && ibDescLimited.allowEdit;
            // Button (CTA) — default to showing when showButton is unset
            const ibShowButton: boolean = (content as any).showButton !== false && (
                (content as any).showButton === true || !!(content as any).buttonText || (content as any).showButton === undefined
            );
            const ibBtnText: string = (content as any).buttonText || 'Learn More';
            const ibBtnLink: string = (content as any).buttonLink || '#';
            // Default to "link" variant — simple text + URL, no big colored button.
            const ibBtnVariant: string = (renderStyle as any).buttonVariant || 'link';
            // New-tab opt-in. Defaults to ON across all linkable elements;
            // user can explicitly flip to same-tab in the sidebar.
            const ibBtnNewTabPref = (content as any).buttonNewTab;
            const ibBtnNewTab: boolean = ibBtnNewTabPref === undefined ? true : !!ibBtnNewTabPref;
            const ibBtnAccent = theme?.accentColor || theme?.buttonBackgroundColor || '#E11D48';
            const variantBg = ibBtnVariant === 'outline' || ibBtnVariant === 'ghost' || ibBtnVariant === 'link'
                ? 'transparent'
                : ibBtnVariant === 'secondary'
                    ? `${ibBtnAccent}1A`
                    : (theme?.buttonBackgroundColor || ibBtnAccent);
            const variantText = ibBtnVariant === 'primary'
                ? (theme?.buttonTextColor || '#FFFFFF')
                : ibBtnVariant === 'ghost'
                    ? (theme?.titleColor || '#111827')
                    : ibBtnAccent;
            const variantBorder = ibBtnVariant === 'outline' ? `1.5px solid ${ibBtnAccent}` : 'none';
            const variantUnderline = ibBtnVariant === 'link' ? 'underline' : 'none';
            const variantPadding = ibBtnVariant === 'link' ? '0.25rem 0' : '0.625rem 1.25rem';
            const ibBtnBg    = (renderStyle as any).buttonBgColor    || variantBg;
            const ibBtnText_ = (renderStyle as any).buttonTextColor  || variantText;

            // Whole-card link (preview mode only — when button is off + content.link is set)
            const wholeCardLink: string = (!ibShowButton && (content as any).link) ? String((content as any).link) : '';

            const ibImageHoverCss = buildImageHoverCss(
              `#${ibImageScopeId}`,
              ibImageNorm.hoverEffect,
              ibCombinedFilter,
              ibImageNorm.overlayColor
            );

            const cardNode = (
                <div
                    key={id}
                    className={`${safeImgId}-card ${selectedClass}`}
                    onClick={!readOnly ? (e) => handleElementActivate(e, el, wholeCardLink || ibBtnLink || (content as any).link) : undefined}
                    style={{
                        ...ibSafeStyle,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: ibCardBg,
                        borderColor: ibCardBorder,
                        borderWidth: ibBorderWidth,
                        borderStyle: 'solid',
                        borderRadius: ibRadius,
                        overflow: 'hidden',
                    }}
                >
                    {ibImageHoverCss && <style>{ibImageHoverCss}</style>}
                    <div id={ibImageScopeId} style={ibImageOuterStyle}>
                        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden' }}>
                            <img
                                src={fullImageBoxUrl}
                                alt={(content.title as string) || (content.text as string) || 'Image Box'}
                                className={`w-full block ${safeImgId}-img`}
                                style={ibImgStyle}
                                onError={(e) => { (e.target as HTMLImageElement).src = SECTION_IMAGE_PLACEHOLDER; }}
                            />
                            {ibImageNorm.hoverEffect === 'tint' && (
                                <div
                                    className="gb-img-tint absolute inset-0 pointer-events-none transition-opacity duration-300"
                                    style={{
                                        backgroundColor: ibImageNorm.overlayColor || theme?.accentColor || '#E11D48',
                                        opacity: 0,
                                        mixBlendMode: 'multiply',
                                    }}
                                />
                            )}
                            {ibImageNorm.overlayOpacity > 0 && (
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        backgroundColor: ibImageNorm.overlayColor || '#000000',
                                        opacity: ibImageNorm.overlayOpacity,
                                    }}
                                />
                            )}
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            // marginTop separates the content block from the image above —
                            // a real gap, not absorbed by content padding.
                            marginTop: ibImageGap,
                            paddingTop: ibContentPadding,
                            paddingRight: ibContentPadding,
                            paddingBottom: ibContentPadding,
                            paddingLeft: ibContentPadding,
                            gap: ibContentGap,
                        }}
                    >
                        <IbTitleTag
                            className="outline-none m-0"
                            style={{
                                color: ibTitleCol,
                                fontSize: ibTitleFontSize,
                                fontFamily: ibTitleFontFamily || undefined,
                                fontWeight: ibTitleWeight as any,
                                lineHeight: 1.3,
                                textAlign: ibTitleAlign as any,
                                margin: 0,
                            }}
                            ref={bindHtml(`${id}::title`, content.title || content.text || 'Image Box Title')}
                            contentEditable={!readOnly}
                            {...editHandlers(`${id}::title`, (html) => {
                                if (readOnly) return;
                                const el0 = elements.find((e) => e.id === id);
                                if (!el0) return;
                                onElementUpdate(id, {
                                    ...el0,
                                    content: { ...el0.content, text: html, title: html },
                                });
                            }, true)}
                        />
                        <p
                            key={`${ibDescEditId}-${ibDescLimited.limitKey}`}
                            className="outline-none m-0"
                            data-gb-editable-id={ibDescEditId}
                            style={{
                                color: ibDescCol,
                                fontSize: ibDescFontSize,
                                fontFamily: ibDescFontFamily || undefined,
                                lineHeight: 1.6,
                                textAlign: ibDescAlign as any,
                                margin: 0,
                                ...ibDescLimited.clampStyle,
                            }}
                            title={
                              ibDescLimited.limit.mode !== 'none' && !ibDescFocused
                                ? plainTextForTruncate(ibDescFull) || undefined
                                : undefined
                            }
                            onClick={!readOnly ? (e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (ibDescLimited.limit.mode === 'words' && !ibDescFocused) {
                                setLimitEditIds((prev) => ({ ...prev, [ibDescEditId]: true }));
                              }
                            } : undefined}
                            ref={bindHtml(ibDescEditId, ibDescLimited.displayHtml)}
                            contentEditable={ibDescEditable}
                            {...editHandlers(ibDescEditId, (html) => {
                                if (readOnly || !ibDescLimited.allowEdit) return;
                                const el0 = elements.find((e) => e.id === id);
                                if (!el0) return;
                                onElementUpdate(id, {
                                    ...el0,
                                    content: { ...el0.content, description: html, subText: html },
                                });
                                setLimitEditIds((prev) => {
                                  if (!prev[ibDescEditId]) return prev;
                                  const next = { ...prev };
                                  delete next[ibDescEditId];
                                  return next;
                                });
                            }, ibDescEditable)}
                        />
                        {ibShowButton && (() => {
                            const ibBtnIcon: string | undefined = (content as any).buttonIcon && (content as any).buttonIcon !== 'none'
                                ? (content as any).buttonIcon : undefined;
                            const ibBtnIconPos: 'left' | 'right' = (content as any).buttonIconPosition === 'right' ? 'right' : 'left';
                            const ibBtnIconSize: string = (renderStyle as any).buttonIconSize || '1em';
                            const ibBtnIconGap: string = (renderStyle as any).buttonIconGap || '0.5rem';
                            const iconNode = ibBtnIcon ? (
                                <IconRenderer icon={ibBtnIcon} size={ibBtnIconSize} style={{ color: ibBtnText_ }} />
                            ) : null;
                            const descRaw = String((content as any).description || (content as any).subText || '').trim();
                            const useLearnMoreModal =
                                typeof publishedImageBoxDetailHandler === 'function' &&
                                descRaw.length > 40;
                            const cardTitle = String((content as any).title || (content as any).text || '').trim();
                            const btnCommonClass = `self-start cursor-pointer transition-opacity hover:opacity-90 outline-none ${ibBtnIcon ? 'inline-flex items-center' : 'inline-block'}`;
                            const btnCommonStyle: React.CSSProperties = {
                                backgroundColor: ibBtnBg,
                                color: ibBtnText_,
                                padding: (renderStyle as any).buttonPadding || variantPadding,
                                borderRadius: (renderStyle as any).buttonRadius || (ibBtnVariant === 'link' ? '0' : '0.5rem'),
                                fontSize: (renderStyle as any).buttonFontSize || '0.875rem',
                                fontWeight: (renderStyle as any).buttonFontWeight || 600,
                                border: (renderStyle as any).buttonBorderColor
                                    ? `1.5px solid ${(renderStyle as any).buttonBorderColor}`
                                    : variantBorder,
                                textDecoration: variantUnderline,
                                margin: 0,
                                gap: ibBtnIcon ? ibBtnIconGap : undefined,
                            };
                            const innerLabel = (
                                <>
                                    {ibBtnIcon && ibBtnIconPos === 'left' && iconNode}
                                    <span
                                        contentEditable={!readOnly}
                                        suppressContentEditableWarning={!readOnly}
                                        onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'buttonText', e.currentTarget.textContent || '') : undefined}
                                    >
                                        {ibBtnText}
                                    </span>
                                    {ibBtnIcon && ibBtnIconPos === 'right' && iconNode}
                                </>
                            );
                            if (useLearnMoreModal) {
                                return (
                                    <button
                                        type="button"
                                        className={btnCommonClass}
                                        style={{ ...btnCommonStyle, font: 'inherit' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            publishedImageBoxDetailHandler({
                                                title: cardTitle,
                                                description: descRaw,
                                                href: ibBtnLink || '#',
                                            });
                                        }}
                                    >
                                        {innerLabel}
                                    </button>
                                );
                            }
                            return (
                                <a
                                    href={ibBtnLink}
                                    target={ibBtnNewTab ? '_blank' : undefined}
                                    rel={ibBtnNewTab ? 'noopener noreferrer' : undefined}
                                    onClick={!readOnly ? (e) => handleLinkedClick(e, el, ibBtnLink) : undefined}
                                    className={btnCommonClass}
                                    style={btnCommonStyle}
                                >
                                    {innerLabel}
                                </a>
                            );
                        })()}
                    </div>
                </div>
            );

            // Wrap in <a> only in preview mode — edit mode would block element selection.
            if (wholeCardLink && readOnly) {
                const isExternal = /^https?:\/\//i.test(wholeCardLink);
                return (
                    <a
                        key={`${id}-cardlink`}
                        href={wholeCardLink}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className="block no-underline text-inherit"
                    >
                        {cardNode}
                    </a>
                );
            }
            return cardNode;
        }

        case 'list': {
            // List type options (stored on style for one-place editing):
            //   bullet/number/check/dash/arrow/star/none/custom
            // Falls back to content.listType for backward compat.
            const listType: string = (renderStyle as any).listType || (content as any).listType || 'bullet';
            const items: any[] = content.items || [{title: 'List Item 1'}, {title: 'List Item 2'}, {title: 'List Item 3'}];
            const textCol = resolveElementColor({
              elementStyle: safeStyle,
              colorKey: 'color',
              themeFallback: theme?.textColor,
              isLightMode,
              lightFallback: '#4B5563',
              darkFallback: '#D1D5DB',
            });
            const markerCol = hasExplicitStyleValue(renderStyle as any, 'markerColor')
              ? String((renderStyle as any).markerColor)
              : hasExplicitStyleValue(renderStyle as any, 'iconColor')
                ? String((renderStyle as any).iconColor)
                : (theme?.listMarkerColor || theme?.accentColor || textCol);
            const itemGap   = (renderStyle as any).itemGap || '0.5rem';
            const indent    = (renderStyle as any).indent || '0px';
            const customIcon: string = (renderStyle as any).bulletIcon || (content as any).bulletIcon || 'fa-check';

            // Marker sizing + chip styling (all optional, default to current behavior)
            const markerSize: string = (renderStyle as any).markerSize || '0.875rem';
            const markerGap:  string = (renderStyle as any).markerGap  || '0.625rem';
            const markerContainerSize: string = (renderStyle as any).markerContainerSize || '';
            const markerBgColor: string        = (renderStyle as any).markerBackgroundColor || '';
            const markerRadius: string         = (renderStyle as any).markerBorderRadius || '9999px';
            const markerBorderColor: string    = (renderStyle as any).markerBorderColor || '';
            const markerBorderWidth: string    = (renderStyle as any).markerBorderWidth || '0';

            // Per-item dividers — paint a subtle line between items
            const dividerColor: string = (renderStyle as any).dividerColor || '';
            const dividerWidth: string = (renderStyle as any).dividerWidth || '1px';

            // Hover color on text (optional)
            const hoverColor: string = (renderStyle as any).hoverColor || '';

            // Multi-column layout — 1 / 2 / 3
            const cols: number = Math.max(1, Math.min(3, parseInt(String((renderStyle as any).columns || 1), 10) || 1));
            const colGap: string = (renderStyle as any).columnGap || '2rem';

            const listStyle = { ...safeStyle, color: textCol, paddingLeft: indent };

            // Build per-item style with optional divider between items
            const itemDivider: React.CSSProperties = dividerColor
                ? { borderBottom: `${dividerWidth} solid ${dividerColor}`, paddingBottom: itemGap }
                : {};

            // Scoped hover CSS — only injected when hoverColor is set
            const safeListId = `gb-list-${id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            const hoverCss = hoverColor
                ? `#${safeListId} > li { transition: color 0.18s ease; } #${safeListId} > li:hover { color: ${hoverColor}; }`
                : '';

            // Layout — horizontal (single row, wraps) wins over multi-column
            // CSS columns; otherwise multi-column flow when cols > 1; otherwise stacked.
            const orientation: string = (renderStyle as any).orientation || 'vertical';
            const isHorizontal = orientation === 'horizontal';
            const containerLayout: React.CSSProperties = isHorizontal
                ? { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: itemGap, alignItems: 'center' }
                : cols > 1
                    ? { columnCount: cols, columnGap: colGap, display: 'block' }
                    : { display: 'flex', flexDirection: 'column', gap: itemGap };

            // Use real <ol>/<ul> for native bullets/numbers (better a11y);
            // for icon-style markers we render a styled flex layout per item.
            if (listType === 'number') {
                return (
                    <>
                        {hoverCss && <style>{hoverCss}</style>}
                        <ol
                            key={id}
                            id={safeListId}
                            className={`list-decimal list-inside ${selectedClass}`}
                            style={{ ...listStyle, ...containerLayout }}
                            onClick={(e) => handleClick(e, el)}
                        >
                            {items.map((item: any, i: number) => (
                                <li
                                    key={i}
                                    className="opacity-90 outline-none"
                                    style={{ ...itemDivider, breakInside: 'avoid' as any }}
                                    ref={bindHtml(`${id}-item-${i}`, item.title || '')}
                                    contentEditable={!readOnly}
                                    {...editHandlers(`${id}-item-${i}`, (html) => handleArrayContentUpdate(id, 'items', i, 'title', html))}
                                />
                            ))}
                        </ol>
                    </>
                );
            }
            if (listType === 'bullet') {
                return (
                    <>
                        {hoverCss && <style>{hoverCss}</style>}
                        <ul
                            key={id}
                            id={safeListId}
                            className={`list-disc list-inside ${selectedClass}`}
                            style={{ ...listStyle, ...containerLayout }}
                            onClick={(e) => handleClick(e, el)}
                        >
                            {items.map((item: any, i: number) => (
                                <li
                                    key={i}
                                    className="opacity-90 outline-none"
                                    style={{ ...itemDivider, breakInside: 'avoid' as any }}
                                    ref={bindHtml(`${id}-item-${i}`, item.title || '')}
                                    contentEditable={!readOnly}
                                    {...editHandlers(`${id}-item-${i}`, (html) => handleArrayContentUpdate(id, 'items', i, 'title', html))}
                                />
                            ))}
                        </ul>
                    </>
                );
            }
            // Icon-style: check / dash / arrow / star / none / custom
            const iconForType: Record<string, string | null> = {
                check: 'fa-check',
                dash: null, // render a literal dash
                arrow: 'fa-arrow-right',
                star: 'fa-star',
                none: null,
                custom: customIcon,
            };
            const iconClass = iconForType[listType];
            // Marker chip styling — when markerContainerSize OR bg is set, wrap the
            // icon in a fixed-size flex container so it reads as a chip.
            const useMarkerChip = !!markerContainerSize || !!markerBgColor || markerBorderWidth !== '0';
            const markerChipStyle: React.CSSProperties = useMarkerChip
                ? {
                    width: markerContainerSize || '1.5rem',
                    height: markerContainerSize || '1.5rem',
                    backgroundColor: markerBgColor || 'transparent',
                    borderRadius: markerRadius,
                    border: markerBorderWidth !== '0'
                        ? `${markerBorderWidth} solid ${markerBorderColor || markerCol}`
                        : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: markerCol,
                    marginTop: '2px',
                }
                : { color: markerCol, flexShrink: 0, marginTop: '4px' };
            return (
                <>
                    {hoverCss && <style>{hoverCss}</style>}
                    <ul
                        key={id}
                        id={safeListId}
                        role="list"
                        className={`${selectedClass}`}
                        style={{ ...listStyle, listStyle: 'none', padding: safeStyle.padding || 0, paddingLeft: indent, ...containerLayout }}
                        onClick={(e) => handleClick(e, el)}
                    >
                        {items.map((item: any, i: number) => {
                            // Per-item icon override (only meaningful when listType=custom).
                            const perItemIcon = listType === 'custom' && item.icon ? item.icon : iconClass;
                            const itemLink: string = (item.link && String(item.link).trim()) || '';
                            // Per-item new-tab default — ON unless user explicitly flips it.
                            const itemNewTabPref = item.linkNewTab;
                            const itemNewTab: boolean = itemNewTabPref === undefined ? true : !!itemNewTabPref;
                            const textNode = (
                                <span
                                    className="outline-none flex-1"
                                    ref={bindHtml(`${id}-item-${i}`, item.title || '')}
                                    contentEditable={!readOnly}
                                    {...editHandlers(`${id}-item-${i}`, (html) => handleArrayContentUpdate(id, 'items', i, 'title', html))}
                                />
                            );
                            return (
                                <li key={i}
                                    className="flex items-start opacity-90"
                                    style={{ gap: markerGap, ...itemDivider, breakInside: 'avoid' as any }}
                                >
                                    {listType === 'dash' && (
                                        <span aria-hidden="true" style={{ color: markerCol, lineHeight: 1.5 }}>—</span>
                                    )}
                                    {perItemIcon && listType !== 'none' && listType !== 'dash' && (
                                        <span style={markerChipStyle}>
                                            <IconRenderer icon={perItemIcon} size={markerSize} style={{ color: markerCol }} />
                                        </span>
                                    )}
                                    {itemLink ? (
                                        <a
                                            href={itemLink}
                                            target={readOnly && itemNewTab ? '_blank' : undefined}
                                            rel={readOnly && itemNewTab ? 'noopener noreferrer' : undefined}
                                            className="flex-1 no-underline text-inherit hover:underline"
                                            onClick={(e) => {
                                                if (!readOnly) {
                                                    handleLinkedClick(e, el, itemLink);
                                                }
                                            }}
                                        >
                                            {textNode}
                                        </a>
                                    ) : (
                                        textNode
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </>
            );
        }

        case 'star-rating': {
            const rating = content.rating !== undefined ? parseFloat(String(content.rating)) : 5;
            const maxRating = content.maxRating !== undefined ? parseInt(String(content.maxRating)) : 5;
            const starColor = safeStyle.color || theme?.accentColor || '#F59E0B';
            // Empty-star colour: user override, else a translucent tint of the star
            // colour (visible on BOTH light and dark surfaces). Was hardcoded to a
            // white 20% tint, which is invisible on light backgrounds.
            const inactiveColor = (renderStyle as any).inactiveColor
                || (renderStyle as any).emptyStarColor
                || (renderStyle as any).unmarkedColor
                || `${starColor}33`;
            const starAlign = resolveTextAlign(renderStyle);
            const rs = renderStyle as any;
            // Star size + gap between stars are now overridable (Elementor `size` /
            // `spacing`). Before: size was uncontrollable (no font-size at all) and
            // gap was locked to Tailwind `gap-1`.
            const starSize = rs.starSize || '1rem';
            const starGap = rs.starSpacing || '0.25rem';
            // Empty-star fill: solid star vs hollow outline (Elementor unmarked_style).
            const emptyStarClass = rs.unmarkedStyle === 'outline' ? 'fa-regular fa-star' : 'fa-solid fa-star';

            return (
                <div key={id} className={`flex w-full ${starAlign.justifyClass} ${selectedClass}`} onClick={!readOnly ? (e) => handleClick(e, el) : undefined} style={{ ...safeStyle, color: undefined, gap: starGap, fontSize: starSize }}>
                    {Array.from({ length: maxRating }, (_, i) => i + 1).map(star => {
                        const isFull = rating >= star;
                        const isHalf = !isFull && rating >= star - 0.5;

                        return (
                            <div key={star} className="relative inline-block leading-none" style={{ fontSize: starSize }}>
                                {/* Always render inactive background star */}
                                <i className={emptyStarClass} style={{ color: inactiveColor, fontSize: 'inherit' }}></i>

                                {/* Render colored foreground star (Full or Half) over it */}
                                {(isFull || isHalf) && (
                                    <i
                                        className={`fa-solid ${isFull ? 'fa-star' : 'fa-star-half-stroke'} absolute top-0 left-0`}
                                        style={{ color: starColor, fontSize: 'inherit' }}
                                    ></i>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        case 'badge': {
            // Badge colours — light/dark aware, clean (no theme-guessing heuristic).
            // A user's explicit colour always wins; otherwise we build a readable
            // default from the theme accent that works on BOTH light and dark
            // sections (previously a white text on a 15%-accent wash was faded /
            // unreadable on light sections).
            const elementStyle = el.style || {};
            const rawBg = String(elementStyle.backgroundColor || (elementStyle as any).accentColor || '').trim();
            const rawText = String(elementStyle.color || '').trim();

            const badgeAccent =
                theme?.accentColor || theme?.buttonBackgroundColor || '#3b82f6';

            // Default fill = a soft accent tint; default text = the accent itself
            // (readable on light AND dark because it's the saturated brand colour,
            // not white). Explicit element colours override.
            const defaultBadgeBg = `${badgeAccent}22`; // ~13% accent tint
            const defaultBadgeText = badgeAccent;

            const badgeBgColor = rawBg && rawBg.toLowerCase() !== 'transparent' ? rawBg : defaultBadgeBg;
            const badgeTextColor = rawText && rawText.toLowerCase() !== 'transparent' ? rawText : defaultBadgeText;
            
            // 7. Badge size and padding
            const badgeFontSize = renderStyle?.fontSize || '0.75rem';
            const badgePadding = renderStyle?.padding || '6px 12px';
            const badgeBorderRadius = renderStyle?.borderRadius || '9999px';
            
            // 8. Create safe style object excluding colors
            const badgeSafeStyle = { ...safeStyle };
            delete badgeSafeStyle.backgroundColor;
            delete badgeSafeStyle.color;

            // 9. Icon logic
            const hasIcon = content.icon && content.icon !== 'none';
            const iconPosition = content.iconPosition || 'left';
            const iconSize = content.iconSize || '0.75rem';
            
            // Pulse animation for attention-grabbing badges ("NEW", "SALE", "LIVE").
            // Two variants — "pulse-dot" adds an animated dot before the text,
            // "pulse-glow" makes the whole badge gently pulse its background.
            const pulseMode: string = (content as any).pulse || 'none';
            const pulseDotClass = pulseMode === 'pulse-dot' ? 'animate-pulse' : '';
            const pulseGlowClass = pulseMode === 'pulse-glow' ? 'animate-[pulse_1.8s_ease-in-out_infinite]' : '';
            // Wrapper alignment for the inline-level badge
            const badgeAlign = resolveTextAlign(renderStyle);
            // Entry animation — small CSS keyframe applied to the badge on first paint.
            // Stored on style.entryAnimation; render injects a one-shot animation class.
            const entryAnim: string = (renderStyle as any)?.entryAnimation || '';
            const entryClass = entryAnim === 'fade'      ? 'animate-[badgeFade_0.5s_ease-out]'
                              : entryAnim === 'slide-up' ? 'animate-[badgeSlideUp_0.5s_ease-out]'
                              : entryAnim === 'scale-in' ? 'animate-[badgeScaleIn_0.4s_ease-out]'
                              : entryAnim === 'pop'      ? 'animate-[badgePop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]'
                              : '';
            // Gradient variant uses backgroundImage. Strip safeStyle's bg props so
            // our explicit values win (avoid double-painting from spread).
            const badgeBgImage = (renderStyle as any)?.backgroundImage || '';

            // Link support — preview wraps in <a>; edit mode uses chooser only if linked.
            const badgeLinkRaw: string = String((content as any).link || '').trim();
            const badgeLink: string =
              badgeLinkRaw && badgeLinkRaw !== '#' && !/^https?:\/\//i.test(badgeLinkRaw) && !/^mailto:|^tel:/i.test(badgeLinkRaw)
                ? (badgeLinkRaw.startsWith('/') ? badgeLinkRaw : `/${badgeLinkRaw}`)
                : badgeLinkRaw;
            const { target: badgeTarget, rel: badgeRel } = resolveAnchorTargetRel(
              badgeLink,
              (content as any).linkNewTab
            );

            const badgeInner = (
                <span
                    key={id}
                    className={`inline-flex items-center font-medium ${selectedClass} ${pulseGlowClass} ${entryClass}`}
                    style={{
                        backgroundColor: badgeBgImage ? 'transparent' : badgeBgColor,
                        backgroundImage: badgeBgImage || undefined,
                        color: badgeTextColor,
                        fontSize: badgeFontSize,
                        padding: badgePadding,
                        borderRadius: badgeBorderRadius,
                        ...badgeSafeStyle,
                        // Re-apply after spread so safeStyle doesn't clobber our gradient.
                        ...(badgeBgImage ? { backgroundImage: badgeBgImage, backgroundColor: 'transparent' } : {}),
                        // Force inline-flex + content-width so badge can never stretch full-width
                        // even if a stray `display`/`width`/`textAlign` leaks in from safeStyle.
                        display: 'inline-flex',
                        width: 'max-content',
                        maxWidth: '100%',
                        textAlign: 'left' as any, // text inside the badge always reads naturally L→R
                    }}
                    onClick={
                      !readOnly && !hasUsableHref(badgeLink)
                        ? (e) => handleClick(e, el)
                        : undefined
                    }
                >
                    {pulseMode === 'pulse-dot' && (
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${pulseDotClass}`}
                        style={{ backgroundColor: badgeTextColor }}
                        aria-hidden="true"
                      />
                    )}
                    {hasIcon && iconPosition === 'left' && (
                        <IconRenderer icon={content.icon} size={iconSize} className="mr-2" />
                    )}
                    <span
                        ref={bindHtml(id, htmlPreserveTrailingSpaces(content.text || 'Badge'))}
                        contentEditable={!readOnly}
                        style={{ whiteSpace: 'pre-wrap' }}
                        {...editHandlers(id, (html) =>
                          handleContentUpdate(id, 'text', plainTextFromHtml(html, { trim: false }))
                        )}
                    />
                    {hasIcon && iconPosition === 'right' && (
                        <IconRenderer icon={content.icon} size={iconSize} className="ml-2" />
                    )}
                </span>
            );

            return (
                <div key={`${id}-wrap`} className={`flex w-full ${badgeAlign.justifyClass}`}>
                    <style>{`
                      @keyframes badgeFade { from { opacity: 0; } to { opacity: 1; } }
                      @keyframes badgeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                      @keyframes badgeScaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
                      @keyframes badgePop { 0% { opacity: 0; transform: scale(0.5); } 60% { opacity: 1; transform: scale(1.1); } 100% { transform: scale(1); } }
                    `}</style>
                    {badgeLink && badgeLink !== '#' && readOnly ? (
                        <a
                            href={badgeLink}
                            target={badgeTarget}
                            rel={badgeRel}
                            className="no-underline text-inherit inline-block cursor-pointer"
                        >
                            {badgeInner}
                        </a>
                    ) : (
                        <span
                          {...(hasUsableHref(badgeLink) && !readOnly ? { 'data-gb-editable-link': '1' } : {})}
                          onClick={!readOnly ? (e) => handleElementActivate(e, el, badgeLink) : undefined}
                          className="inline-block"
                        >
                          {badgeInner}
                        </span>
                    )}
                </div>
            );
        }

        case 'highlight-text': {
            // Highlight style mode (stored on style for one-place editing).
            //   marker        — bg fill + text color (default)
            //   underline     — colored line under the text
            //   brushstroke   — slanted thick underline (organic feel)
            //   box-outline   — thin border around the text
            //   strikethrough — line through the text
            //   none          — no decoration (just colored text)
            const hlMode: string = (renderStyle as any).highlightMode || 'marker';
            const highlightBgColor   = (safeStyle as any).highlightColor || renderStyle?.accentColor || theme?.accentColor || '#facc15';
            const highlightTextColor = (safeStyle as any).highlightTextColor || (hlMode === 'marker' ? '#000000' : highlightBgColor);
            const highlightTextStyle = { ...safeStyle, color: safeStyle.color || theme?.textColor || '#D1D5DB' };
            const padX = (renderStyle as any).highlightPaddingX || (hlMode === 'marker' || hlMode === 'box-outline' ? '0.375rem' : '0');
            const padY = (renderStyle as any).highlightPaddingY || (hlMode === 'marker' || hlMode === 'box-outline' ? '0.125rem' : '0');
            const hlRadius = (renderStyle as any).highlightRadius || (hlMode === 'marker' ? '0.25rem' : '0');
            const textBefore = content.textBefore || '';
            const textAfter  = content.textAfter  || '';
            const highlighted = content.text || content.highlightedText || 'Highlighted';

            // Per-mode highlight span style
            const hlSpanStyle: React.CSSProperties = (() => {
                const base: React.CSSProperties = {
                    color: highlightTextColor,
                    padding: `${padY} ${padX}`,
                    borderRadius: hlRadius,
                };
                if (hlMode === 'marker') {
                    return { ...base, backgroundColor: highlightBgColor };
                }
                if (hlMode === 'underline') {
                    return {
                        ...base,
                        backgroundImage: `linear-gradient(${highlightBgColor}, ${highlightBgColor})`,
                        backgroundSize: '100% 0.18em',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '0 88%',
                    };
                }
                if (hlMode === 'brushstroke') {
                    return {
                        ...base,
                        backgroundImage: `linear-gradient(105deg, transparent 4%, ${highlightBgColor}66 4%, ${highlightBgColor}66 96%, transparent 96%)`,
                        backgroundSize: '100% 0.6em',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '0 88%',
                    };
                }
                if (hlMode === 'box-outline') {
                    return {
                        ...base,
                        border: `1.5px solid ${highlightBgColor}`,
                    };
                }
                if (hlMode === 'strikethrough') {
                    return { ...base, textDecoration: `line-through ${highlightBgColor}`, textDecorationThickness: '2px' };
                }
                /* none */ return base;
            })();

            return (
                <p key={id} className={`leading-relaxed ${selectedClass}`} style={highlightTextStyle} onClick={!readOnly ? (e) => handleClick(e, el) : undefined}>
                    {textBefore && (
                        <span
                            className="outline-none"
                            ref={bindHtml(id, textBefore)}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'textBefore', html))}
                        />
                    )}
                    {textBefore && ' '}
                    <span
                        className="font-semibold outline-none"
                        style={hlSpanStyle}
                        ref={bindHtml(id, highlighted)}
                        contentEditable={!readOnly}
                        {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                    />
                    {textAfter && ' '}
                    {textAfter && (
                        <span
                            className="outline-none"
                            ref={bindHtml(id, textAfter)}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'textAfter', html))}
                        />
                    )}
                </p>
            );
        }

        case 'blockquote': {
            // Visual style mode (stored on style for sidebar parity).
            //   bar-left    — default classic, accent vertical bar on left
            //   large-quote — big decorative ❝ mark above the text
            //   card        — soft card background, no bar
            //   minimal     — italic only, no bar / no bg
            //   center      — centered text with quote marks on both sides
            const bqMode: string = (renderStyle as any).blockquoteMode || 'bar-left';
            const accentCol = renderStyle?.accentColor || theme?.accentColor || '#E11D48';
            const blockquoteBorderColor = renderStyle?.borderColor || accentCol;
            const bqResolvedBg = resolveElementBackground(renderStyle);
            const isItalic: boolean = ((renderStyle as any).fontStyle ?? 'italic') !== 'normal';
            // Skip wrapping the text in `"..."` — users can type their own punctuation.
            const quoteText = content.text || 'This is a quote.';
            const authorName = content.author || 'Author Name';

            // Mode-specific layout / class composition
            const baseStyle: React.CSSProperties = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB',
                ...bqResolvedBg.backgroundStyle,
                position: bqResolvedBg.overlay ? 'relative' : safeStyle.position,
                overflow: bqResolvedBg.overlay ? 'hidden' : safeStyle.overflow,
                fontStyle: isItalic ? 'italic' : 'normal',
            };

            const bq = renderStyle as any;
            // Per-mode padding / radius / bar width are overridable now (were baked
            // into Tailwind classes pl-4 py-2 / p-6 rounded-xl). Sensible per-mode
            // defaults kick in only when the user hasn't set a value.
            const bqBarWidth = bq.barWidth || '4px';
            let modeClass = '';
            const modeStyle: React.CSSProperties = { ...baseStyle };
            if (bq.opacity !== undefined) modeStyle.opacity = bq.opacity;
            if (bqMode === 'bar-left') {
                modeStyle.padding = safeStyle.padding || '0.5rem 0 0.5rem 1rem';
                modeStyle.borderLeftWidth = bqBarWidth;
                modeStyle.borderLeftStyle = 'solid';
                modeStyle.borderColor = blockquoteBorderColor;
            } else if (bqMode === 'card') {
                modeStyle.padding = safeStyle.padding || '1.5rem';
                modeStyle.borderRadius = safeStyle.borderRadius || '0.75rem';
                modeStyle.backgroundColor = safeStyle.backgroundColor || theme?.cardBackgroundColor || 'rgba(255,255,255,0.04)';
                if (!safeStyle.borderColor) modeStyle.border = `1px solid ${theme?.cardBorderColor || 'rgba(255,255,255,0.08)'}`;
            } else if (bqMode === 'large-quote' || bqMode === 'center') {
                modeClass = bqMode === 'center' ? 'text-center' : '';
                modeStyle.padding = safeStyle.padding || (bqMode === 'center' ? '1rem 0' : '0.5rem 0');
            } else { /* minimal */ modeStyle.padding = safeStyle.padding || '0.5rem 0'; }
            // Explicit style-panel textAlign wins over the per-mode default.
            if (renderStyle.textAlign) modeStyle.textAlign = renderStyle.textAlign as any;

            const bqQuoteSize = bq.quoteFontSize || (bqMode === 'center' ? '1.125rem' : undefined);
            const bqAuthorSize = bq.authorFontSize || '0.875rem';
            const bqAuthorWeight = bq.authorFontWeight || 700;
            const bqAuthorOpacity = bq.authorOpacity !== undefined ? bq.authorOpacity : 0.7;
            // Overridable gap between the quote text and the author line.
            const bqQuoteBottomSpace = bq.quoteBottomSpace || (bqMode === 'center' ? '0.75rem' : '0.5rem');

            return (
                <blockquote key={id} className={`${modeClass} ${selectedClass}`} style={modeStyle} onClick={!readOnly ? (e) => handleClick(e, el) : undefined}>
                    {bqResolvedBg.overlay && (
                        <div aria-hidden className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundColor: bqResolvedBg.overlay.color,
                                opacity: bqResolvedBg.overlay.opacity,
                                mixBlendMode: bqResolvedBg.overlay.blendMode as any,
                                zIndex: 0,
                            }} />
                    )}
                    <div className={bqResolvedBg.overlay ? 'relative' : ''} style={bqResolvedBg.overlay ? { zIndex: 1 } : undefined}>
                        {bqMode === 'large-quote' && (
                            <div aria-hidden className="leading-none" style={{ color: accentCol, fontStyle: 'normal', fontSize: bq.quoteMarkSize || '3rem', opacity: bq.quoteMarkOpacity !== undefined ? bq.quoteMarkOpacity : 0.5, marginBottom: bq.quoteMarkBottomSpace || '0.5rem' }}>❝</div>
                        )}
                        {bqMode === 'center' ? (
                            <p
                              style={{ fontSize: bqQuoteSize, marginBottom: bqQuoteBottomSpace }}
                              ref={bindHtml(id, `“${quoteText}”`)}
                              contentEditable={!readOnly}
                              {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                            />
                        ) : (
                            <p style={{ ...(bqQuoteSize ? { fontSize: bqQuoteSize } : {}), marginBottom: bqQuoteBottomSpace }} ref={bindHtml(id, quoteText)} contentEditable={!readOnly} {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))} />
                        )}
                        <cite
                            className="not-italic outline-none"
                            style={{ color: bq.authorColor || accentCol, fontSize: bqAuthorSize, fontWeight: bqAuthorWeight, opacity: bqAuthorOpacity }}
                            contentEditable={!readOnly}
                            suppressContentEditableWarning={!readOnly}
                            onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'author', e.currentTarget.innerHTML.replace(/^—\s*/, '').replace(/^-\s*/, '')) : undefined}
                        >
                            — {authorName}
                        </cite>
                    </div>
                </blockquote>
            );
        }

        case 'faq':
        case 'accordion': {
            // Wrapper: opt-in background only when user explicitly sets `bgType`
            // (gradient/image) OR a dedicated `wrapperBackgroundColor` key.
            // Plain `backgroundColor` is treated as the ITEM card color, NOT the
            // wrapper — otherwise sections that style items would also paint a
            // tinted wrapper around them.
            // `faq` is an alias of accordion (content-site Funky sections).
            const accWantsWrapperBg = !!(renderStyle as any).wrapperBackgroundColor
                || (renderStyle as any).bgType === 'gradient'
                || (renderStyle as any).bgType === 'image';
            const accResolvedBg = accWantsWrapperBg
                ? resolveElementBackground({
                    ...(renderStyle as any),
                    backgroundColor: (renderStyle as any).wrapperBackgroundColor || (renderStyle as any).backgroundColor,
                })
                : { backgroundStyle: {} as React.CSSProperties, overlay: undefined as any };
            const accordionWrapperStyle: React.CSSProperties = {
                color: safeStyle.color || theme?.textColor || '#D1D5DB',
                ...accResolvedBg.backgroundStyle,
                padding: accWantsWrapperBg ? ((renderStyle as any).wrapperPadding || '1rem') : undefined,
                borderRadius: accWantsWrapperBg ? ((renderStyle as any).wrapperBorderRadius || '0.75rem') : undefined,
                position: accResolvedBg.overlay ? 'relative' : undefined,
                overflow: accResolvedBg.overlay ? 'hidden' : undefined,
            };
            const items = content.items && content.items.length > 0 ? content.items : [
                { title: 'Sample Question 1', content: 'Sample answer 1.' },
                { title: 'Sample Question 2', content: 'Sample answer 2.' }
            ];
            const exclusiveMode: boolean = !!(content as any).exclusive;
            const detailsGroupName = exclusiveMode ? `acc-${id}` : undefined;

            // ── New style keys (all optional) ────────────────────────────
            // Icon: type (chevron/plus/arrow/caret/none) + position + size + colors.
            const accIconType: string = (renderStyle as any).iconType || 'chevron';
            const accIconPos:  string = (renderStyle as any).iconPosition || 'right';
            const accIconSize: string = (renderStyle as any).iconSize || '0.875rem';
            const accIconColor: string = (renderStyle as any).iconColor || theme?.accentColor || '#3b82f6';
            const accIconBg: string = (renderStyle as any).iconBackgroundColor || 'rgba(255,255,255,0.05)';
            const accIconShape: string = (renderStyle as any).iconShape || 'circle'; // circle | square | none
            // Active state — colors when an item is open.
            const accActiveBg: string = (renderStyle as any).activeBackgroundColor || '';
            const accActiveBorder: string = (renderStyle as any).activeBorderColor || '';
            const accActiveTitleCol: string = (renderStyle as any).activeTitleColor || '';
            // Spacing + borders
            const accItemGap: string = (renderStyle as any).itemGap || '0.75rem';
            const accBorderWidth: string = (renderStyle as any).borderWidth || '1px';
            const accBorderStyle: string = (renderStyle as any).borderStyle || 'solid';
            // Question + answer typography
            const accQuestionFontSize: string = (renderStyle as any).questionFontSize || '1.125rem';
            const accQuestionFontWeight: string = (renderStyle as any).questionFontWeight || '700';
            const accAnswerFontSize: string = (renderStyle as any).answerFontSize || '1rem';
            const accAnswerLineHeight: string = (renderStyle as any).answerLineHeight || '1.65';
            // Divider between question and answer
            const accDividerColor: string = (renderStyle as any).dividerColor || '';
            // Hover behavior
            const accHoverBg: string = (renderStyle as any).hoverBackgroundColor || '';

            // Pick the icon font-awesome class for closed/open states.
            // For most icons we just rotate; for plus/minus we swap glyphs.
            const iconForClosed = (() => {
                if (accIconType === 'none')    return null;
                if (accIconType === 'plus')    return 'fa-plus';
                if (accIconType === 'arrow')   return 'fa-arrow-down';
                if (accIconType === 'caret')   return 'fa-caret-down';
                return 'fa-chevron-down';
            })();
            const iconForOpen = accIconType === 'plus' ? 'fa-minus' : iconForClosed;
            const iconShouldRotate = accIconType !== 'plus' && accIconType !== 'none';

            // Resolved colors with theme fallback. On a LIGHT section the item
            // card must be light even if the passed theme card colour is a dark
            // token (which can happen for Canvas variants) — isLightMode wins.
            const itemBg = (safeStyle.backgroundColor && safeStyle.backgroundColor !== 'transparent')
                ? safeStyle.backgroundColor
                : (isLightMode
                    ? '#FFFFFF'
                    : (theme?.accordionBackgroundColor || theme?.cardBackgroundColor || '#131A20'));
            const itemBorder = (safeStyle.borderColor && safeStyle.borderColor !== 'transparent')
                ? safeStyle.borderColor
                : (isLightMode
                    ? 'rgba(15,23,42,0.10)'
                    : (theme?.accordionBorderColor || theme?.cardBorderColor || 'rgba(255,255,255,0.10)'));
            const itemRadius = safeStyle.borderRadius || '0.75rem';
            const itemPadding = safeStyle.padding || '1.25rem';

            // Per-item icon side helpers
            const safeAccId = `acc-${id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            const scopedCss = `
                #${safeAccId} > details { transition: background-color 0.2s ease, border-color 0.2s ease; }
                ${accHoverBg ? `#${safeAccId} > details:hover { background-color: ${accHoverBg} !important; }` : ''}
                ${accActiveBg ? `#${safeAccId} > details[open] { background-color: ${accActiveBg} !important; }` : ''}
                ${accActiveBorder ? `#${safeAccId} > details[open] { border-color: ${accActiveBorder} !important; }` : ''}
                ${accActiveTitleCol ? `#${safeAccId} > details[open] .acc-q { color: ${accActiveTitleCol} !important; }` : ''}
            `;

            const renderIconChip = (isOpen: boolean) => {
                if (!iconForClosed) return null;
                const glyph = isOpen && accIconType === 'plus' ? iconForOpen : iconForClosed;
                const wrapperBase: React.CSSProperties = accIconShape === 'none'
                    ? { color: accIconColor }
                    : {
                        width: '2rem', height: '2rem',
                        backgroundColor: accIconBg,
                        borderRadius: accIconShape === 'square' ? '0.5rem' : '9999px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    };
                return (
                    <div className={`shrink-0 ${iconShouldRotate ? 'group-open:rotate-180 transition-transform' : ''}`}
                        style={wrapperBase}
                    >
                        <i className={`fa-solid ${glyph}`} style={{ color: accIconColor, fontSize: accIconSize }} />
                    </div>
                );
            };

            return (
                <div key={id} id={safeAccId} className={`w-full ${selectedClass}`} onClick={!readOnly ? (e) => handleClick(e, el) : undefined} style={{ ...accordionWrapperStyle, display: 'flex', flexDirection: 'column', gap: accItemGap }}>
                    {scopedCss && <style>{scopedCss}</style>}
                    {accResolvedBg.overlay && (
                        <div aria-hidden className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundColor: accResolvedBg.overlay.color,
                                opacity: accResolvedBg.overlay.opacity,
                                mixBlendMode: accResolvedBg.overlay.blendMode as any,
                                zIndex: 0,
                            }} />
                    )}
                    {items.map((item: any, idx: number) => {
                        const openByDefault = !!item.openByDefault;
                        return (
                            <details
                                key={idx}
                                name={detailsGroupName}
                                open={openByDefault || undefined}
                                className="group w-full overflow-hidden"
                                style={{
                                    backgroundColor: itemBg,
                                    borderColor: itemBorder,
                                    borderWidth: accBorderWidth,
                                    borderStyle: accBorderStyle,
                                    borderRadius: itemRadius,
                                }}
                            >
                                <summary
                                    className="flex items-center justify-between gap-3 cursor-pointer list-none select-none"
                                    style={{ padding: itemPadding, flexDirection: accIconPos === 'left' ? 'row-reverse' : 'row' }}
                                >
                                    <span
                                        className="acc-q outline-none flex-1"
                                        style={{
                                            color: resolveElementColor({
                                              elementStyle: safeStyle as Record<string, any>,
                                              colorKey: 'titleColor',
                                              themeFallback:
                                                theme?.accordionQuestionColor ||
                                                theme?.titleColor ||
                                                safeStyle.color,
                                              isLightMode,
                                              lightFallback: '#111827',
                                              darkFallback: '#F8FAFC',
                                            }),
                                            fontFamily: (renderStyle as any).questionFontFamily || (renderStyle as any).fontFamily || theme?.titleFontFamily,
                                            fontSize: accQuestionFontSize,
                                            fontWeight: accQuestionFontWeight as any,
                                            lineHeight: 1.4,
                                            textAlign: 'left',
                                        }}
                                        ref={bindHtml(`${id}-acc-${idx}-q`, item.title || item.question || '')}
                                        contentEditable={!readOnly}
                                        {...editHandlers(`${id}-acc-${idx}-q`, (html) =>
                                          handleArrayContentUpdate(id, 'items', idx, item.title !== undefined ? 'title' : 'question', html)
                                        )}
                                    />
                                    {renderIconChip(false)}
                                </summary>
                                <div
                                    className="outline-none"
                                    style={{
                                        padding: itemPadding,
                                        paddingTop: accDividerColor ? itemPadding : 0,
                                        borderTop: accDividerColor ? `1px solid ${accDividerColor}` : 'none',
                                        marginTop: accDividerColor ? '0' : '-0.5rem',
                                        color: resolveElementColor({
                                          elementStyle: safeStyle,
                                          colorKey: 'color',
                                          themeFallback: theme?.accordionAnswerColor || theme?.textColor,
                                          isLightMode,
                                          lightFallback: '#4B5563',
                                          darkFallback: '#D1D5DB',
                                        }),
                                        fontFamily: (renderStyle as any).answerFontFamily || (renderStyle as any).fontFamily || theme?.descriptionFontFamily,
                                        fontSize: accAnswerFontSize,
                                        lineHeight: accAnswerLineHeight,
                                    }}
                                    ref={bindHtml(`${id}-acc-${idx}-a`, item.content || item.answer || '')}
                                    contentEditable={!readOnly}
                                    {...editHandlers(`${id}-acc-${idx}-a`, (html) =>
                                      handleArrayContentUpdate(id, 'items', idx, item.content !== undefined ? 'content' : 'answer', html)
                                    )}
                                />
                            </details>
                        );
                    })}
                </div>
            );
        }

        case 'toggle': {
            // Switch geometry — pill (default) | square | ios (rounded square w/ inner indicator)
            const switchShape: string = (renderStyle as any).switchShape || 'pill';
            const switchSize: string = (renderStyle as any).switchSize || 'md'; // sm | md | lg
            const labelPos: string = (renderStyle as any).labelPosition || 'right'; // left | right
            const onColor  = (renderStyle as any).switchOnColor  || theme?.accentColor || '#22c55e';
            const offColor = (renderStyle as any).switchOffColor || 'rgba(255,255,255,0.15)';
            const knobColor = (renderStyle as any).switchKnobColor || '#FFFFFF';
            const titleCol = (renderStyle as any).titleColor || theme?.titleColor || '#F8FAFC';
            const descCol  = (renderStyle as any).descriptionColor || safeStyle.color || theme?.textColor || '#D1D5DB';

            // Size dimensions per preset
            const dim = switchSize === 'sm'
                ? { w: 32, h: 18, knob: 14, off: 2, on: 16 }
                : switchSize === 'lg'
                    ? { w: 56, h: 32, knob: 26, off: 3, on: 27 }
                    : { w: 44, h: 24, knob: 18, off: 3, on: 23 };

            const switchRadius = switchShape === 'square' ? '4px' : switchShape === 'pill' ? '9999px' : '8px';
            const knobRadius   = switchShape === 'square' ? '2px' : switchShape === 'pill' ? '9999px' : '6px';

            const toggleWrapStyle: React.CSSProperties = {
                ...safeStyle,
                color: descCol,
                backgroundColor: safeStyle.backgroundColor || 'rgba(255,255,255,0.05)',
                borderColor: safeStyle.borderColor || 'rgba(255,255,255,0.1)',
                borderWidth: safeStyle.borderWidth || '1px',
                borderStyle: safeStyle.borderStyle || 'solid',
                borderRadius: safeStyle.borderRadius || '0.5rem',
                padding: safeStyle.padding || '0',
            };

            // Switch markup (reused for both label positions). Uses inline keyframe-free
            // CSS via per-element style scope for the open state.
            const toggleId = `tg-${id}`;
            const switchEl = (
                <div
                    aria-hidden="true"
                    className={`flex-shrink-0 relative transition-colors duration-200 ${toggleId}-track`}
                    style={{
                        width: `${dim.w}px`,
                        height: `${dim.h}px`,
                        backgroundColor: offColor,
                        borderRadius: switchRadius,
                    }}
                >
                    <div
                        className={`absolute top-1/2 transition-all duration-200 ${toggleId}-knob`}
                        style={{
                            width: `${dim.knob}px`,
                            height: `${dim.knob}px`,
                            backgroundColor: knobColor,
                            borderRadius: knobRadius,
                            left: `${dim.off}px`,
                            transform: 'translateY(-50%)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        }}
                    />
                </div>
            );

            // Inline scoped CSS handles the [open] state of <details> without arbitrary Tailwind classes.
            const scopedCss = `
                details[data-toggle="${toggleId}"][open] .${toggleId}-track { background-color: ${onColor} !important; }
                details[data-toggle="${toggleId}"][open] .${toggleId}-knob  { left: ${dim.on}px !important; }
            `;

            const labelEl = (
                <span
                    className="font-bold outline-none flex-1"
                    style={{ color: titleCol, fontSize: (renderStyle as any).titleFontSize || '0.95rem' }}
                    ref={bindHtml(id, content.text || 'Toggle Title')}
                    contentEditable={!readOnly}
                    {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                />
            );

            return (
                <div key={id} className={`${selectedClass}`} onClick={(e) => handleClick(e, el)} style={toggleWrapStyle}>
                    <style>{scopedCss}</style>
                    <details data-toggle={toggleId}>
                        <summary className="flex items-center gap-3 cursor-pointer list-none" style={{ padding: safeStyle.padding ? '0' : '1rem' }}>
                            {labelPos === 'left' ? <>{labelEl}{switchEl}</> : <>{switchEl}{labelEl}</>}
                        </summary>
                        <div
                            className="text-sm opacity-90 outline-none"
                            style={{
                                color: descCol,
                                fontSize: (renderStyle as any).descriptionFontSize || '0.875rem',
                                padding: safeStyle.padding ? '0 0 1rem' : '0 1rem 1rem',
                            }}
                            ref={bindHtml(id, content.subText || 'Toggle Content goes here...')}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'subText', html))}
                        />
                    </details>
                </div>
            );
        }

        case 'tabs': {
            const currentTab = activeTabs[id] || 0;
            const ts = renderStyle as any;
            // Light/dark-aware neutral surfaces — the old hardcoded rgba(255,255,255,…)
            // defaults were invisible on light sections. On a light surface we tint
            // toward black; on dark toward white. User overrides always win.
            const softSurface = isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
            const softBorder = isLightMode ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.1)';
            const softInactive = isLightMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)';
            const tabsAccentColor = ts.activeColor || renderStyle?.accentColor || theme?.accentColor || '#3b82f6';
            const inactiveColor = ts.inactiveColor || (safeStyle.color ? `${safeStyle.color}B0` : softInactive);
            const activeTextColor = ts.activeTextColor || theme?.titleColor || (isLightMode ? '#0F172A' : '#FFFFFF');
            const pillActiveText = ts.pillActiveTextColor || '#FFFFFF';
            const tabsStyle = { ...safeStyle, color: safeStyle.color || theme?.textColor || (isLightMode ? '#334155' : '#D1D5DB') };
            const tabsAlign = resolveTextAlign(renderStyle);
            // Tab style variant — underline (default) | pills | box | segmented
            const tabStyle: string = ts.tabStyle || 'underline';
            const showPanel: boolean = (content as any).showPanel !== false;
            const items: any[] = content.items?.length > 0 ? content.items : [{ title: 'Tab 1', content: 'Content 1' }, { title: 'Tab 2', content: 'Content 2' }];
            // Tab-title typography is now overridable (was locked to text-sm font-bold px-4 py-2).
            const tabFontSize = ts.tabFontSize || '0.875rem';
            const tabFontWeight = ts.tabFontWeight || 700;
            const tabPadding = ts.tabPadding || '0.5rem 1rem';
            const tabFontFamily = ts.tabFontFamily || ts.fontFamily;

            // Per-style helpers
            const buildTabBtn = (item: any, idx: number) => {
                const isActive = currentTab === idx;
                let btnClass = 'transition-all whitespace-nowrap cursor-pointer outline-none';
                let btnStyle: React.CSSProperties = { fontSize: tabFontSize, fontWeight: tabFontWeight, padding: tabPadding, fontFamily: tabFontFamily };

                if (tabStyle === 'underline') {
                    btnClass += ' border-b-2';
                    btnStyle = {
                        ...btnStyle,
                        borderBottomColor: isActive ? tabsAccentColor : 'transparent',
                        color: isActive ? activeTextColor : inactiveColor,
                    };
                } else if (tabStyle === 'pills') {
                    btnClass += ' rounded-full';
                    btnStyle = {
                        ...btnStyle,
                        backgroundColor: isActive ? tabsAccentColor : 'transparent',
                        color: isActive ? pillActiveText : inactiveColor,
                    };
                } else if (tabStyle === 'box') {
                    btnClass += ' rounded-t-lg border border-b-0';
                    btnStyle = {
                        ...btnStyle,
                        backgroundColor: isActive ? (ts.panelBackground || softSurface) : 'transparent',
                        borderColor: isActive ? (ts.panelBorder || softBorder) : 'transparent',
                        color: isActive ? activeTextColor : inactiveColor,
                        marginBottom: '-1px',
                        position: 'relative',
                        zIndex: 1,
                    };
                } else if (tabStyle === 'segmented') {
                    btnStyle = {
                        ...btnStyle,
                        borderRadius: '0.375rem',
                        backgroundColor: isActive ? tabsAccentColor : 'transparent',
                        color: isActive ? pillActiveText : inactiveColor,
                    };
                }

                return (
                    <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActiveTabs({ ...activeTabs, [id]: idx }); }}
                        className={btnClass}
                        style={btnStyle}
                    >
                        <span
                            className="outline-none"
                            ref={bindHtml(`${id}-tab-${idx}`, item.title || '')}
                            contentEditable={!readOnly}
                            {...editHandlers(`${id}-tab-${idx}`, (html) =>
                              handleArrayContentUpdate(id, 'items', idx, 'title', html)
                            )}
                        />
                    </button>
                );
            };

            // Header wrapper class per style
            const headerClass = tabStyle === 'underline'
                ? `flex mb-4 overflow-x-auto ${tabsAlign.justifyClass}`
                : tabStyle === 'pills'
                    ? `flex gap-2 mb-4 overflow-x-auto ${tabsAlign.justifyClass}`
                    : tabStyle === 'box'
                        ? `flex gap-1 mb-0 overflow-x-auto ${tabsAlign.justifyClass}`
                        : /* segmented */ `inline-flex p-1 rounded-lg mb-4 overflow-x-auto`;

            const headerBorder = tabStyle === 'underline'
                ? { borderBottom: `1px solid ${ts.headerBorderColor || softBorder}` }
                : {};
            const headerStyle: React.CSSProperties = tabStyle === 'segmented'
                ? { backgroundColor: ts.segmentedBg || softSurface, borderRadius: '0.5rem' }
                : headerBorder;

            // Panel style per variant
            const panelStyle: React.CSSProperties = {
                backgroundColor: ts.panelBackground || (tabStyle === 'box' || showPanel ? softSurface : 'transparent'),
                borderColor: ts.panelBorder || softBorder,
                borderWidth: showPanel ? '1px' : '0px',
                borderStyle: showPanel ? 'solid' : 'none',
                borderRadius: tabStyle === 'box' ? '0 0.5rem 0.5rem 0.5rem' : '0.5rem',
                padding: showPanel ? (ts.panelPadding || '1rem') : '0',
                minHeight: showPanel ? '100px' : 'auto',
            };

            return (
                <div key={id} className={`${selectedClass}`} onClick={(e) => handleClick(e, el)} style={tabsStyle}>
                    {tabStyle === 'segmented' ? (
                        <div className={tabsAlign.justifyClass + ' flex w-full mb-4'}>
                            <div className={headerClass} style={headerStyle}>
                                {items.map((item: any, idx: number) => buildTabBtn(item, idx))}
                            </div>
                        </div>
                    ) : (
                        <div className={headerClass} style={headerStyle}>
                            {items.map((item: any, idx: number) => buildTabBtn(item, idx))}
                        </div>
                    )}
                    <div
                        className="outline-none"
                        style={panelStyle}
                        ref={bindHtml(`${id}-tab-panel-${currentTab}`, items[currentTab]?.content || '')}
                        contentEditable={!readOnly}
                        {...editHandlers(`${id}-tab-panel-${currentTab}`, (html) =>
                          handleArrayContentUpdate(id, 'items', currentTab, 'content', html)
                        )}
                    />
                </div>
            );
        }

        case 'progress-bar': {
            const progressBarColor = (renderStyle as any).fillColor || renderStyle?.accentColor || theme?.accentColor || '#3b82f6';
            const trackColor = (renderStyle as any).trackColor || 'rgba(255,255,255,0.1)';
            const barShape: string = (renderStyle as any).barShape || 'pill';
            const barHeight = (renderStyle as any).barHeight || '10px';
            const showLabel: boolean = (content as any).showLabel !== false;
            const showPercent: boolean = (content as any).showPercent !== false;
            const isStriped: boolean = (renderStyle as any).striped === true;
            const isAnimated: boolean = (renderStyle as any).striped === true && (renderStyle as any).animatedStripes !== false;
            const labelPos: string = (renderStyle as any).labelPosition || 'top'; // top | bottom | inside

            const radius = barShape === 'pill' ? '9999px' : barShape === 'square' ? '0px' : '0.375rem';
            const labelColor = (renderStyle as any).labelColor || safeStyle.color || theme?.textColor || '#D1D5DB';

            const progressBarStyle: React.CSSProperties = {
                ...safeStyle,
                color: labelColor,
            };
            const pct = Math.max(0, Math.min(100, parseFloat(String(content.percentage ?? 0)) || 0));

            const stripedBg = isStriped
                ? `repeating-linear-gradient(45deg, ${progressBarColor}, ${progressBarColor} 10px, ${progressBarColor}cc 10px, ${progressBarColor}cc 20px)`
                : undefined;

            const labelRow = (showLabel || showPercent) ? (
                <div className="flex justify-between mb-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: labelColor }}>
                    {showLabel ? (
                        <span
                            className="outline-none"
                            ref={bindHtml(id, content.text || 'Progress')}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                        />
                    ) : <span />}
                    {showPercent && (
                        <span
                            className="outline-none"
                            contentEditable={!readOnly}
                            suppressContentEditableWarning={!readOnly}
                            onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'percentage', e.currentTarget.textContent?.replace('%', '') || '') : undefined}
                        >{pct}%</span>
                    )}
                </div>
            ) : null;

            return (
                <div key={id} className={`${selectedClass}`} onClick={(e) => handleClick(e, el)} style={progressBarStyle}>
                    <style>{`@keyframes pbStripes { from { background-position: 0 0; } to { background-position: 40px 0; } }`}</style>
                    {labelPos === 'top' && labelRow}
                    <div
                        className="w-full overflow-hidden relative"
                        style={{ backgroundColor: trackColor, height: barHeight, borderRadius: radius }}
                    >
                        <div
                            className="h-full transition-all duration-1000"
                            style={{
                                width: `${pct}%`,
                                backgroundColor: isStriped ? undefined : progressBarColor,
                                backgroundImage: stripedBg,
                                backgroundSize: isStriped ? '40px 40px' : undefined,
                                animation: isAnimated && isStriped ? 'pbStripes 1s linear infinite' : undefined,
                                borderRadius: radius,
                            }}
                        />
                        {labelPos === 'inside' && (showLabel || showPercent) && (
                            <div
                                className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: (renderStyle as any).insideLabelColor || '#FFFFFF' }}
                            >
                                {showLabel && (content.text || 'Progress')}{showLabel && showPercent ? ' · ' : ''}{showPercent && `${pct}%`}
                            </div>
                        )}
                    </div>
                    {labelPos === 'bottom' && labelRow}
                </div>
            );
        }

        case 'counter': {
            const counterAccentColor = renderStyle.numberColor || renderStyle?.accentColor || theme?.accentColor || '#ffffff';
            const counterMode: string = (renderStyle as any).counterMode || 'card';
            const labelPosition: string = (renderStyle as any).labelPosition || 'below';
            const counterStyle: React.CSSProperties = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB',
            };
            const counterAlign = resolveTextAlign(renderStyle);

            // Mode-specific class composition
            let modeClass = '';
            if (counterMode === 'card') {
                modeClass = 'p-6 border border-white/10 bg-white/5 rounded-xl';
            } else if (counterMode === 'huge') {
                modeClass = 'py-4';
            } else if (counterMode === 'minimal') {
                modeClass = 'py-2';
            } else if (counterMode === 'inline') {
                modeClass = 'inline-flex items-baseline gap-2';
            }

            const numberFontSize = (renderStyle as any).numberFontSize ||
                (counterMode === 'huge' ? 'clamp(3rem, 8vw, 6rem)' : counterMode === 'inline' ? '1.5rem' : 'clamp(2.5rem, 5vw, 3.5rem)');
            const labelFontSize = (renderStyle as any).labelFontSize || '0.875rem';
            const labelColor = (renderStyle as any).subheadingColor || (renderStyle as any).labelColor || theme?.subheadingColor || theme?.textColor || '#C7CDD6';

            const numberEl = (
                <div
                    className="font-bold outline-none"
                    style={{
                        color: counterAccentColor,
                        fontSize: numberFontSize,
                        fontWeight: (renderStyle as any).numberFontWeight || '800',
                        lineHeight: '1.05',
                    }}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning={!readOnly}
                    onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'targetNumber', e.currentTarget.textContent || '') : undefined}
                >
                    {content.prefix}{content.targetNumber}{content.suffix}
                </div>
            );

            const labelEl = (
                <div
                    className="font-bold uppercase tracking-widest outline-none"
                    style={{
                        color: labelColor,
                        fontSize: labelFontSize,
                        opacity: theme?.subheadingColor ? 1 : 0.7,
                        marginTop: counterMode === 'inline' ? 0 : ((renderStyle as any).labelTopSpace || '0.5rem'),
                    }}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning={!readOnly}
                    onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'text', e.currentTarget.textContent || '') : undefined}
                >
                    {content.text}
                </div>
            );

            return (
                <div key={id} className={`${counterAlign.textAlignClass} ${modeClass} ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={counterStyle}>
                    {labelPosition === 'above' ? <>{labelEl}{numberEl}</> : <>{numberEl}{labelEl}</>}
                </div>
            );
        }
        
        case 'social-icons' as any: {
            const si = renderStyle as any;
            const siItems: any[] = Array.isArray(content?.items) ? content.items : [];
            const siShape: string = si.socialShape || 'circle';
            const siSize = si.socialSize || '2.5rem';
            const siGap = si.socialGap || '0.6rem';
            const siColor = si.socialIconColor || '#FFFFFF';
            const siBg = si.socialBackgroundColor || theme?.accentColor || '#6366f1';
            const siRadius = siShape === 'circle' ? '50%' : siShape === 'rounded' ? '0.5rem' : '0';
            const siAlign = resolveTextAlign(renderStyle);
            return (
                <div key={id} className={`flex ${siAlign.justifyClass} ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={{ ...safeStyle, gap: siGap }}>
                    {siItems.map((it: any, i: number) => (
                        <a
                            key={i}
                            href={readOnly ? (it.url || '#') : undefined}
                            target={readOnly ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            aria-label={it.network || `social-${i}`}
                            className="inline-flex items-center justify-center transition-transform hover:scale-110"
                            style={{
                                width: siSize, height: siSize, borderRadius: siRadius,
                                backgroundColor: siShape === 'plain' ? 'transparent' : siBg,
                                color: siShape === 'plain' ? siBg : siColor,
                                fontSize: si.socialIconSize || `calc(${siSize} * 0.45)`,
                            }}
                            onClick={!readOnly ? (e) => e.preventDefault() : undefined}
                        >
                            <i className={it.icon || 'fa-solid fa-link'} />
                        </a>
                    ))}
                </div>
            );
        }

        case 'gallery' as any: {
            return (
                <div key={id} className={selectedClass} onClick={(e) => handleClick(e, el)} style={safeStyle}>
                    <CanvasGalleryElement
                        content={content}
                        style={renderStyle}
                        theme={theme}
                        readOnly={!!readOnly}
                        resolveImg={toDisplayImageUrl}
                        placeholder={SECTION_IMAGE_PLACEHOLDER}
                    />
                </div>
            );
        }

        case 'form' as any: {
            const formChrome: React.CSSProperties = {
                ...safeStyle,
                ...resolveElementChrome(safeStyle, theme, {
                    padding: '1.5rem', radius: '1rem',
                    bg: theme?.cardBackgroundColor || 'transparent',
                    borderWidth: safeStyle.borderWidth || '1px',
                    borderColor: theme?.cardBorderColor || 'rgba(0,0,0,0.08)',
                }),
            };
            return (
                <div key={id} className={selectedClass} onClick={(e) => handleClick(e, el)} style={formChrome}>
                    <CanvasFormElement
                        content={content}
                        style={renderStyle}
                        theme={theme}
                        readOnly={!!readOnly}
                        formId={(content as any)?.formId || (sectionStyles as any)?.projectFormId || ''}
                    />
                </div>
            );
        }

        case 'alert-box': {
            // Variant palette (used as fallbacks; user can override every color via style props).
            const VARIANT_PALETTE: Record<string, { bg: string; border: string; text: string; icon: string }> = {
                info:    { bg: 'rgba(59, 130, 246, 0.1)',  border: '#3b82f6', text: '#1e40af', icon: 'circle-info' },
                success: { bg: 'rgba(34, 197, 94, 0.1)',   border: '#22c55e', text: '#166534', icon: 'circle-check' },
                warning: { bg: 'rgba(234, 179, 8, 0.1)',   border: '#eab308', text: '#854d0e', icon: 'triangle-exclamation' },
                error:   { bg: 'rgba(239, 68, 68, 0.1)',   border: '#ef4444', text: '#991b1b', icon: 'circle-exclamation' },
                neutral: { bg: 'rgba(148, 163, 184, 0.1)', border: '#94a3b8', text: '#334155', icon: 'circle-info' },
            };
            const alertVariant = (content.alertType || 'info') as keyof typeof VARIANT_PALETTE;
            const palette = VARIANT_PALETTE[alertVariant] || VARIANT_PALETTE.info;

            // Style preset (controls border placement). Stored on style for editor parity.
            //   bar-left  → vertical accent bar on the left (default classic)
            //   bar-top   → horizontal accent bar on top
            //   full      → border on all sides
            //   soft      → no border, just tinted bg + colored icon
            const stylePreset: string = (renderStyle as any).alertStyle || 'bar-left';
            const iconPosition: string = (content as any).iconPosition || 'left';
            const dismissible: boolean = !!(content as any).dismissible;

            // Resolved colors — user style wins, else palette
            const bgCol     = (renderStyle as any).backgroundColor || palette.bg;
            const borderCol = (renderStyle as any).borderColor     || palette.border;
            const textCol   = (renderStyle as any).color           || palette.text;
            const iconCol   = (renderStyle as any).iconColor       || borderCol;
            const iconName  = content.icon || palette.icon;

            // Border placement based on preset
            const borderStyles: React.CSSProperties = (() => {
                if (stylePreset === 'bar-top')  return { borderTopWidth: '4px', borderTopStyle: 'solid', borderTopColor: borderCol };
                if (stylePreset === 'full')     return { borderWidth: '1px', borderStyle: 'solid', borderColor: borderCol };
                if (stylePreset === 'soft')     return { border: 'none' };
                /* bar-left default */ return { borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: borderCol };
            })();

            const abResolvedBg = resolveElementBackground(renderStyle);
            const isReverseLayout = iconPosition === 'right';

            return (
                <div key={id} className={`p-4 rounded-lg flex gap-4 relative overflow-hidden ${selectedClass} ${isReverseLayout ? 'flex-row-reverse' : ''}`}
                    onClick={(e) => handleClick(e, el)}
                    style={{
                        backgroundColor: bgCol,
                        ...borderStyles,
                        // safeStyle spread — user-set padding/radius/etc. win over our defaults
                        // but we re-apply borderStyles after to keep preset working.
                        ...safeStyle,
                        ...borderStyles,
                        ...abResolvedBg.backgroundStyle,
                    }}
                >
                    {abResolvedBg.overlay && (
                        <div aria-hidden className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundColor: abResolvedBg.overlay.color,
                                opacity: abResolvedBg.overlay.opacity,
                                mixBlendMode: abResolvedBg.overlay.blendMode as any,
                                zIndex: 0,
                            }} />
                    )}
                    {iconName !== 'none' && (
                        <div className="relative flex-shrink-0" style={{ zIndex: 1, color: iconCol }}>
                            <IconRenderer
                                icon={iconName}
                                size={(renderStyle as any).iconSize || '1.25rem'}
                                style={{ color: iconCol }}
                            />
                        </div>
                    )}
                    <div className="relative flex-1 min-w-0" style={{ zIndex: 1, color: textCol, textAlign: (renderStyle.textAlign as any) || undefined }}>
                        <strong className="block font-bold" style={{ marginBottom: (renderStyle as any).titleBottomSpace || '0.25rem' }} ref={bindHtml(id, content.text || 'Alert Title')} contentEditable={!readOnly} {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))} />
                        <p className="text-sm opacity-80" ref={bindHtml(id, content.subText || 'Alert description.')} contentEditable={!readOnly} {...editHandlers(id, (html) => handleContentUpdate(id, 'subText', html))} />
                    </div>
                    {dismissible && (
                        <button
                            type="button"
                            aria-label="Dismiss alert"
                            className="relative flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1"
                            style={{ zIndex: 1, color: textCol, pointerEvents: readOnly ? 'auto' : 'none' }}
                            onClick={(e) => { e.stopPropagation(); }}
                        >
                            <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
                        </button>
                    )}
                </div>
            );
        }

        case 'testimonial':
            // Use theme textColor if element color is not explicitly set
            const testimonialStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            const testimonialItems = content.items || [{ author: 'John Doe', role: 'Customer', content: 'Great service!', avatar: 'https://via.placeholder.com/50' }];
            return (
                <div key={id} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full ${selectedClass}`} onClick={(e) => handleClick(e, el)}>
                    {testimonialItems.map((item: any, idx: number) => (
                        <div key={idx} className="p-6 rounded-xl flex flex-col h-full" style={{ ...testimonialStyle, backgroundColor: testimonialStyle.backgroundColor || theme?.cardBackgroundColor || 'rgba(255,255,255,0.05)', borderColor: testimonialStyle.borderColor || theme?.cardBorderColor || 'rgba(255,255,255,0.08)', borderWidth: '1px', borderStyle: 'solid' }}>
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                  src={toDisplayImageUrl(
                                    resolveSectionImageUrl(section, {
                                      elementId: `${id}-avatar-${idx}`,
                                      elementImageUrl:
                                        item.avatar || item.image || item.imageUrl || '',
                                    })
                                  )}
                                  className="w-12 h-12 rounded-full object-cover"
                                  alt="Avatar"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = SECTION_IMAGE_PLACEHOLDER;
                                  }}
                                />
                                <div>
                                    <div 
                                        className="font-bold outline-none" 
                                        style={{ color: theme?.titleColor }}
                                        ref={bindHtml(`${id}-rev-${idx}-author`, item.author || 'John Doe')}
                                        contentEditable={!readOnly}
                                        {...editHandlers(`${id}-rev-${idx}-author`, (html) =>
                                          handleArrayContentUpdate(id, 'items', idx, 'author', html)
                                        )}
                                    />
                                    <div 
                                        className="text-xs outline-none" 
                                        style={{ color: renderStyle.subheadingColor || theme?.subheadingColor || theme?.textColor || '#C7CDD6', opacity: theme?.subheadingColor ? 1 : 0.5 }}
                                        ref={bindHtml(`${id}-rev-${idx}-role`, item.role || 'Customer')}
                                        contentEditable={!readOnly}
                                        {...editHandlers(`${id}-rev-${idx}-role`, (html) =>
                                          handleArrayContentUpdate(id, 'items', idx, 'role', html)
                                        )}
                                    />
                                </div>
                                <div className="ml-auto text-yellow-500 text-sm">
                                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                                </div>
                            </div>
                            <p 
                                className="italic opacity-80 flex-grow outline-none" 
                                style={{ color: theme?.textColor }}
                                ref={bindHtml(`${id}-rev-${idx}-content`, `"${item.content || 'Great service!'}"`)}
                                contentEditable={!readOnly}
                                {...editHandlers(`${id}-rev-${idx}-content`, (html) =>
                                  handleArrayContentUpdate(id, 'items', idx, 'content', html)
                                )}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'logo-cloud': {
            const logos = content.items || [];
            const grayscale: boolean = (content as any).grayscale !== false; // default true
            const marquee: boolean = !!(content as any).marquee;
            const marqueeSpeed: string = String((content as any).marqueeSpeed || '30s');

            // Style overrides
            const logoHeight = (renderStyle as any).logoHeight || '40px';
            const logoGap    = (renderStyle as any).logoGap || '48px';
            const logoOpacity = typeof (renderStyle as any).logoOpacity === 'number'
                ? (renderStyle as any).logoOpacity
                : (grayscale ? 0.5 : 0.9);
            const hoverOpacity = typeof (renderStyle as any).logoHoverOpacity === 'number'
                ? (renderStyle as any).logoHoverOpacity
                : 1;
            const justify: string = (renderStyle as any).justifyContent || 'center';
            const justifyClass = justify === 'flex-start' ? 'justify-start'
                : justify === 'flex-end' ? 'justify-end'
                : justify === 'space-between' ? 'justify-between'
                : 'justify-center';
            const padY = (renderStyle as any).logoPaddingY || '32px';
            const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');

            const logoImgClass = `lc-${safeId}-img w-auto transition-all duration-300 flex-shrink-0 ${grayscale ? 'grayscale hover:grayscale-0' : ''}`;
            // Scoped CSS — height + opacity + hover opacity (custom values, not Tailwind classes).
            const scopedCss = `
                .lc-${safeId}-img { height: ${logoHeight}; opacity: ${logoOpacity}; }
                .lc-${safeId}-img:hover { opacity: ${hoverOpacity}; }
            `;

            const renderLogo = (logo: any, idx: number, keyPrefix = '') => {
              const img = (
                <img
                  key={`${keyPrefix}${idx}`}
                  src={logo.src}
                  alt={logo.alt || 'Logo'}
                  className={logoImgClass}
                  referrerPolicy="no-referrer"
                />
              );
              // Optional per-logo link (wraps image). No-op in edit mode so
              // the canvas still routes clicks to the element selector.
              if (logo.link && readOnly) {
                return (
                  <a key={`${keyPrefix}${idx}-link`} href={logo.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    {img}
                  </a>
                );
              }
              return img;
            };

            if (marquee) {
              // Duplicate the list so the scroll loops seamlessly
              return (
                <div
                  key={id}
                  className={`relative overflow-hidden ${selectedClass}`}
                  onClick={(e) => handleClick(e, el)}
                  style={{ paddingTop: padY, paddingBottom: padY, ...safeStyle }}
                >
                  <style>{scopedCss}</style>
                  <div
                    className="flex items-center animate-[marquee_var(--speed)_linear_infinite] whitespace-nowrap"
                    style={{ '--speed': marqueeSpeed, width: 'max-content', gap: logoGap } as React.CSSProperties}
                  >
                    {logos.map((l: any, i: number) => renderLogo(l, i, 'a-'))}
                    {logos.map((l: any, i: number) => renderLogo(l, i, 'b-'))}
                  </div>
                  <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
                </div>
              );
            }

            return (
                <div
                    key={id}
                    className={`flex flex-wrap items-center ${justifyClass} ${selectedClass}`}
                    onClick={(e) => handleClick(e, el)}
                    style={{ gap: logoGap, paddingTop: padY, paddingBottom: padY, ...safeStyle }}
                >
                    <style>{scopedCss}</style>
                    {logos.map((logo: any, idx: number) => renderLogo(logo, idx))}
                </div>
            );
        }

        case 'trust-strip': {
            // Horizontal row of trust badges — each item: { icon, label }.
            // Editable via sidebar (TrustStripContentForm). Style controls cover icon + label.
            const items: Array<{ icon?: string; label?: string }> = Array.isArray((content as any).items)
              ? (content as any).items
              : [];
            const tsIconColor = renderStyle.iconColor || theme?.iconColor || theme?.accentColor || '#E11D48';
            const tsIconBg    = renderStyle.iconBackgroundColor || renderStyle.iconBgColor || `${tsIconColor}25`;
            const tsLabelColor = renderStyle.titleColor || renderStyle.color || theme?.titleColor || '#F8FAFC';
            const tsContainerSize = renderStyle.iconContainerSize || '32px';
            const tsIconSize      = renderStyle.iconSize || '14px';
            const tsAlign: string = (renderStyle as any).justifyContent || 'center';
            const justifyClass = tsAlign === 'flex-start' ? 'justify-start'
              : tsAlign === 'flex-end' ? 'justify-end'
              : tsAlign === 'space-between' ? 'justify-between'
              : 'justify-center';
            return (
                <div
                  key={id}
                  className={`flex flex-wrap items-center ${justifyClass} ${selectedClass}`}
                  onClick={(e) => handleClick(e, el)}
                  style={{
                    gap: renderStyle.gap || '24px',
                    padding: safeStyle.padding || '12px 0',
                    backgroundColor: safeStyle.backgroundColor,
                    borderColor: safeStyle.borderColor,
                    borderWidth: safeStyle.borderWidth,
                    borderStyle: safeStyle.borderStyle,
                    borderRadius: safeStyle.borderRadius,
                  }}
                >
                  {items.map((item, idx) => {
                    const itemLink = String((item as { link?: string }).link || '').trim();
                    const itemNewTab =
                      (item as { linkNewTab?: boolean }).linkNewTab === undefined
                        ? true
                        : !!(item as { linkNewTab?: boolean }).linkNewTab;
                    const chip = (
                      <>
                        <span
                          className="flex-shrink-0 flex items-center justify-center"
                          style={{
                            width: tsContainerSize,
                            height: tsContainerSize,
                            backgroundColor: tsIconBg,
                            color: tsIconColor,
                            borderRadius: renderStyle.iconBorderRadius || '9999px',
                            border:
                              renderStyle.iconBorderStyle && renderStyle.iconBorderStyle !== 'none'
                                ? `${renderStyle.iconBorderWidth || '1px'} ${renderStyle.iconBorderStyle} ${renderStyle.iconBorderColor || tsIconColor}`
                                : 'none',
                          }}
                        >
                          <IconRenderer icon={item.icon || 'fa-check'} size={tsIconSize} style={{ color: tsIconColor }} />
                        </span>
                        <span
                          style={{
                            color: tsLabelColor,
                            fontSize: renderStyle.titleFontSize || '13px',
                            fontWeight: (renderStyle.titleFontWeight as any) || 600,
                            fontFamily:
                              renderStyle.titleFontFamily || renderStyle.fontFamily || theme?.titleFontFamily,
                            letterSpacing: renderStyle.titleLetterSpacing || 'normal',
                          }}
                        >
                          {item.label || 'Social'}
                        </span>
                      </>
                    );
                    return (
                      <div key={idx} className="flex items-center gap-2.5">
                        {itemLink && readOnly ? (
                          <a
                            href={itemLink}
                            target={itemNewTab ? '_blank' : undefined}
                            rel={itemNewTab ? 'noopener noreferrer' : undefined}
                            className="flex items-center gap-2.5 no-underline text-inherit hover:opacity-90"
                            aria-label={item.label || 'Social link'}
                          >
                            {chip}
                          </a>
                        ) : (
                          chip
                        )}
                      </div>
                    );
                  })}
                </div>
            );
        }

        case 'navigation':
        case 'nav-menu': {
            // `navigation` is a content-site alias of `nav-menu` (HeaderFunky / FooterFunky).
            // Normalize href → link so both shapes render.
            // Single editable navigation menu element. Holds an array of items:
            //   {
            //     label, link, icon?, linkNewTab?, active?,
            //     dropdown?:    [...],          // hand-curated sub-items
            //     selectSource?: 'services'…,   // OR auto-populated source (backend later)
            //     viewAllLabel?, viewAllLink?,  // optional "View all" footer in the dropdown
            //   }
            //
            // Visual options:
            //   • orientation, alignment, indicator, mobileBreakpoint
            //   • hover/active colors, item gap, padding, font, weight
            const rawItems: Array<any> = Array.isArray((content as any).items)
                ? (content as any).items
                : [];
            const items: Array<any> = rawItems.map((item) => ({
                ...item,
                label: item?.label || item?.name || 'Link',
                link: item?.link || item?.href || item?.url || '#',
            }));

            // Builder-only MOCK for `selectSource` when navSources are empty.
            // Live/published (readOnly) must never show Austin/Dallas-style placeholders.
            const SOURCE_MOCK: Record<string, Array<{ label: string; link: string; icon?: string; linkNewTab?: boolean }>> = {
                locations: [
                    { label: 'Austin, TX',      link: '/areas/austin', linkNewTab: false },
                    { label: 'Dallas, TX',      link: '/areas/dallas', linkNewTab: false },
                    { label: 'Houston, TX',     link: '/areas/houston', linkNewTab: false },
                    { label: 'San Antonio, TX', link: '/areas/san-antonio', linkNewTab: false },
                    { label: 'Fort Worth, TX',  link: '/areas/fort-worth', linkNewTab: false },
                ],
                services: [
                    { label: 'Drain Cleaning',    link: '/services/drain-cleaning', linkNewTab: false },
                    { label: 'Water Heaters',     link: '/services/water-heaters', linkNewTab: false },
                    { label: 'Pipe Repair',       link: '/services/pipe-repair', linkNewTab: false },
                    { label: 'Bathroom Plumbing', link: '/services/bathroom', linkNewTab: false },
                    { label: 'Emergency Repairs', link: '/services/emergency', linkNewTab: false },
                ],
                categories: [
                    { label: 'Residential', link: '/categories/residential', linkNewTab: false },
                    { label: 'Commercial',  link: '/categories/commercial', linkNewTab: false },
                    { label: 'Industrial',  link: '/categories/industrial', linkNewTab: false },
                ],
            };
            const navSources = (content as any).navSources || {};
            const livePathname =
              readOnly && sitePathname
                ? sitePathname
                : readOnly && typeof window !== 'undefined'
                  ? window.location.pathname || '/'
                  : '';
            const resolveSourceChildren = (source: string | undefined) => {
                if (!source) return [] as Array<{ label: string; link: string; icon?: string; linkNewTab?: boolean }>;
                const key = String(source).toLowerCase();
                const live =
                    key === 'services'
                        ? navSources.services
                        : key === 'locations'
                          ? navSources.locations
                          : null;
                if (Array.isArray(live) && live.length) {
                    return live.map((row: any) => ({
                        label: row.label || row.name || '',
                        link: row.link || row.url || '#',
                        icon: row.icon,
                        // Internal SPA links must stay same-tab so projectId soft-nav works.
                        linkNewTab: row.linkNewTab === undefined ? false : !!row.linkNewTab,
                    }));
                }
                if (readOnly) return [];
                return SOURCE_MOCK[key] || [];
            };

            // Final list — same as input. Per-item dropdown comes from either
            // explicit `dropdown` array OR `selectSource` mock.
            const renderedItems: Array<any> = items;

            const navOrient: 'horizontal' | 'vertical' = (renderStyle as any).orientation === 'vertical' ? 'vertical' : 'horizontal';
            const navAlign: string = (renderStyle as any).justifyContent || 'flex-start';
            const indicator: string = (renderStyle as any).indicator || 'underline';
            const mobileBreak: string = (renderStyle as any).mobileBreakpoint || 'lg';
            const itemColor   = (renderStyle as any).color || theme?.titleColor || '#111827';
            const hoverColor  = (renderStyle as any).hoverColor || theme?.accentColor || '#E11D48';
            const activeColor = (renderStyle as any).activeColor || hoverColor;
            const fontSize    = (renderStyle as any).fontSize || '0.9375rem';
            const fontWeight  = (renderStyle as any).fontWeight || '600';
            const itemGap     = (renderStyle as any).itemGap || '1.75rem';
            const itemPadding = (renderStyle as any).itemPadding || '0.5rem 0.25rem';

            // Dropdown-panel styling — pure white card with neutral border by
            // default. Theme tokens often tint cardBackgroundColor with the
            // accent (e.g. Crimson Jet → pink wash), which doesn't read as a
            // clean menu surface, so we hardcode neutral defaults here. Users
            // can override via `dropdownBackgroundColor` / `dropdownBorderColor`.
            const dropdownBg     = (renderStyle as any).dropdownBackgroundColor || '#FFFFFF';
            const dropdownBorder = (renderStyle as any).dropdownBorderColor     || 'rgba(15,23,42,0.08)';

            // Mobile menu open state (read-only mode). Edit mode keeps everything visible.
            const safeNavId = `gb-nav-${id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            const breakClass = mobileBreak === 'sm' ? 'sm' : mobileBreak === 'md' ? 'md' : 'lg';

            // Indicator CSS — applied to the link's hover and active states.
            // Active items get the same visual as hover but persistent.
            const indicatorCss = (() => {
                const base = `#${safeNavId} .gb-nav-link { color: ${itemColor}; transition: color 0.18s ease, background-color 0.18s ease; position: relative; }`;
                if (indicator === 'underline') {
                    return base + `
                        #${safeNavId} .gb-nav-link::after {
                            content: ''; position: absolute; left: 0.5rem; right: 0.5rem; bottom: 0;
                            height: 2px; background: ${activeColor};
                            transform: scaleX(0); transform-origin: center;
                            transition: transform 0.2s ease;
                        }
                        #${safeNavId} .gb-nav-link:hover { color: ${hoverColor}; }
                        #${safeNavId} .gb-nav-link:hover::after { transform: scaleX(1); }
                        #${safeNavId} .gb-nav-link.is-active { color: ${activeColor}; }
                        #${safeNavId} .gb-nav-link.is-active::after { transform: scaleX(1); }
                    `;
                }
                if (indicator === 'pill') {
                    return base + `
                        #${safeNavId} .gb-nav-link { border-radius: 9999px; }
                        #${safeNavId} .gb-nav-link:hover { color: ${hoverColor}; background-color: ${hoverColor}15; }
                        #${safeNavId} .gb-nav-link.is-active { color: ${activeColor}; background-color: ${activeColor}1F; }
                    `;
                }
                if (indicator === 'bg') {
                    return base + `
                        #${safeNavId} .gb-nav-link { border-radius: 0.5rem; }
                        #${safeNavId} .gb-nav-link:hover { color: ${hoverColor}; background-color: ${hoverColor}10; }
                        #${safeNavId} .gb-nav-link.is-active { color: ${activeColor}; background-color: ${activeColor}15; }
                    `;
                }
                return base + `
                    #${safeNavId} .gb-nav-link:hover { color: ${hoverColor}; }
                    #${safeNavId} .gb-nav-link.is-active { color: ${activeColor}; }
                `;
            })();

            // Dropdown CSS — pure selectors (not Tailwind group/nav) so the
            // iframe CDN reliably shows panels in edit + preview. padding-top
            // on the outer shell is a hover bridge (no mt gap that kills hover).
            const dropdownCss = `
                #${safeNavId} .gb-nav-list { overflow: visible; }
                #${safeNavId} .gb-nav-item { position: relative; display: inline-flex; align-items: center; }
                #${safeNavId} .gb-nav-dropdown {
                    position: absolute; top: 100%; left: 0; min-width: 240px;
                    padding-top: 0.75rem; z-index: 80;
                    opacity: 0; visibility: hidden; pointer-events: none;
                    transform: translateY(4px);
                    transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
                }
                #${safeNavId} .gb-nav-item:hover > .gb-nav-dropdown,
                #${safeNavId} .gb-nav-item:focus-within > .gb-nav-dropdown {
                    opacity: 1; visibility: visible; pointer-events: auto;
                    transform: translateY(0);
                }
                #${safeNavId} .gb-nav-dropdown-inner {
                    border-radius: 0.75rem; padding: 0.5rem 0;
                    background: ${dropdownBg};
                    border: 1px solid ${dropdownBorder};
                    box-shadow: 0 12px 32px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -4px rgba(15, 23, 42, 0.08);
                    backdrop-filter: blur(8px);
                }
                #${safeNavId} .gb-nav-sub:hover { background-color: ${hoverColor}10; color: ${hoverColor}; }
                #${safeNavId} .gb-nav-viewall:hover { background-color: ${hoverColor}1F; }
                #${safeNavId} .gb-nav-viewall:hover i { transform: translateX(3px); }
            `;

            // Hamburger CSS — uses :checked on a hidden checkbox so JS isn't required.
            const hamburgerCss = `
                #${safeNavId} .gb-nav-toggle { display: none; }
                #${safeNavId} .gb-nav-burger { display: none; }
                @media (max-width: ${breakClass === 'sm' ? '639px' : breakClass === 'md' ? '767px' : '1023px'}) {
                    #${safeNavId} .gb-nav-burger { display: inline-flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; cursor: pointer; color: ${itemColor}; }
                    #${safeNavId} .gb-nav-list {
                        display: none;
                        position: absolute; top: 100%; left: 0; right: 0;
                        flex-direction: column;
                        background: ${(safeStyle.backgroundColor as string) || theme?.cardBackgroundColor || '#FFFFFF'};
                        border: 1px solid ${(safeStyle.borderColor as string) || 'rgba(0,0,0,0.08)'};
                        border-radius: 0.75rem;
                        padding: 0.5rem;
                        gap: 0;
                        margin-top: 0.5rem;
                        box-shadow: 0 12px 32px -16px rgba(0,0,0,0.18);
                        z-index: 50;
                    }
                    #${safeNavId} .gb-nav-toggle:checked ~ .gb-nav-list { display: flex; }
                    #${safeNavId} .gb-nav-list .gb-nav-link { padding: 0.625rem 0.875rem; }
                }
            `;

            const renderIcon = (icon: string | undefined, side: 'left' | 'right') =>
                icon && icon !== 'none'
                    ? <i className={`fa-solid ${icon} text-[0.875em] opacity-90 ${side === 'left' ? 'mr-2' : 'ml-1.5'}`} aria-hidden />
                    : null;

            const renderLink = (
                label: string,
                link: string,
                newTabPref: boolean | undefined,
                key: string | number,
                icon?: string,
                isActive?: boolean,
            ) => {
                const trimmed = (link || '').trim();
                // Internal nav must stay in-app; never default to new tab.
                const { target, rel } = resolveAnchorTargetRel(trimmed, newTabPref);
                const activeClass = isActive ? 'is-active' : '';
                const inner = (
                    <>
                        {renderIcon(icon, 'left')}
                        {label || 'Link'}
                    </>
                );
                // Edit mode: Open | Select only when this item has a real link.
                if (!readOnly) {
                    return (
                        <span
                          key={key}
                          className={`gb-nav-link ${activeClass} inline-flex items-center cursor-pointer`}
                          style={{ padding: itemPadding, fontSize, fontWeight: fontWeight as any }}
                          {...(hasUsableHref(trimmed) ? { 'data-gb-editable-link': '1' } : {})}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasUsableHref(trimmed)) handleLinkedClick(e, el, trimmed);
                            else handleClick(e, el);
                          }}
                        >
                            {inner}
                        </span>
                    );
                }
                return (
                    <a key={key} href={trimmed || '#'} target={target} rel={rel}
                        className={`gb-nav-link ${activeClass} inline-flex items-center no-underline`}
                        style={{ padding: itemPadding, fontSize, fontWeight: fontWeight as any, color: itemColor }}
                    >
                        {inner}
                    </a>
                );
            };

            return (
                <nav
                    key={id}
                    id={safeNavId}
                    className={`relative ${selectedClass}`}
                    onClick={!readOnly ? (e) => handleClick(e, el) : undefined}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: navAlign,
                        gap: itemGap,
                        padding: safeStyle.padding,
                        backgroundColor: safeStyle.backgroundColor,
                        borderColor: safeStyle.borderColor,
                        borderWidth: safeStyle.borderWidth,
                        borderStyle: safeStyle.borderStyle,
                        borderRadius: safeStyle.borderRadius,
                    }}
                >
                    <style>{indicatorCss}{hamburgerCss}{dropdownCss}</style>
                    {/* Hamburger toggle — only shows below mobileBreak */}
                    <input type="checkbox" id={`${safeNavId}-toggle`} className="gb-nav-toggle" aria-hidden="true" />
                    <label htmlFor={`${safeNavId}-toggle`} className="gb-nav-burger ml-auto" aria-label="Toggle menu">
                        <i className="fa-solid fa-bars text-lg" />
                    </label>

                    <div className="gb-nav-list" style={{
                        display: 'flex',
                        flexDirection: navOrient === 'vertical' ? 'column' : 'row',
                        alignItems: navOrient === 'vertical' ? 'flex-start' : 'center',
                        gap: navOrient === 'vertical' ? '0.25rem' : itemGap,
                    }}>
                        {renderedItems.length === 0 ? (
                            <span className="text-sm opacity-50" style={{ color: itemColor, padding: itemPadding }}>Add nav items in the sidebar</span>
                        ) : renderedItems.map((item: any, idx: number) => {
                            const itemIcon: string | undefined = item.icon;
                            const isActive: boolean = readOnly
                                ? isNavItemActive(item, livePathname || '/', navSources, sitePageType)
                                : !!item.active;
                            // Dropdown: explicit `dropdown` array OR auto-resolved from `selectSource`.
                            const explicitDropdown: Array<any> = Array.isArray(item.dropdown) ? item.dropdown : [];
                            const sourceDropdown = explicitDropdown.length === 0 && item.selectSource
                                ? resolveSourceChildren(item.selectSource)
                                : [];
                            const dropdownItems = explicitDropdown.length > 0 ? explicitDropdown : sourceDropdown;
                            const hasDropdown = dropdownItems.length > 0;
                            const viewAllLabel: string = item.viewAllLabel || '';
                            const viewAllLink: string  = item.viewAllLink  || '';
                            if (!hasDropdown) {
                                return renderLink(item.label || '', item.link || '', item.linkNewTab, idx, itemIcon, isActive);
                            }
                            return (
                                <div key={idx} className="gb-nav-item">
                                    {renderLink(item.label || '', item.link || '', item.linkNewTab, `link-${idx}`, itemIcon, isActive)}
                                    <i className="fa-solid fa-chevron-down text-[10px] ml-1 opacity-60" style={{ color: itemColor }} aria-hidden />
                                    <div className="gb-nav-dropdown" role="menu">
                                        <div className="gb-nav-dropdown-inner relative">
                                            <div
                                                aria-hidden
                                                className="absolute -top-1.5 left-6 w-3 h-3 rotate-45"
                                                style={{
                                                    backgroundColor: dropdownBg,
                                                    borderLeft: `1px solid ${dropdownBorder}`,
                                                    borderTop: `1px solid ${dropdownBorder}`,
                                                }}
                                            />
                                            {dropdownItems.map((sub: any, j: number) => {
                                                const subLink = (sub.link || '').trim();
                                                const subIsExternal = /^https?:\/\//i.test(subLink);
                                                const subNewTab = sub.linkNewTab === undefined
                                                    ? subIsExternal
                                                    : !!sub.linkNewTab;
                                                if (!readOnly) {
                                                    return (
                                                        <span
                                                            key={j}
                                                            role="menuitem"
                                                            className="gb-nav-sub flex items-center gap-2.5 mx-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                                                            style={{ color: itemColor }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (subLink) handleLinkedClick(e, el, subLink);
                                                                else handleClick(e, el);
                                                            }}
                                                        >
                                                            {sub.icon && sub.icon !== 'none' && (
                                                                <span
                                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                                                                    style={{ backgroundColor: `${hoverColor}12`, color: hoverColor }}
                                                                >
                                                                    <i className={`fa-solid ${sub.icon} text-[11px]`} />
                                                                </span>
                                                            )}
                                                            <span>{sub.label || 'Link'}</span>
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <a key={j} href={subLink || '#'}
                                                        target={subLink && subNewTab ? '_blank' : undefined}
                                                        rel={subLink && subNewTab ? 'noopener noreferrer' : undefined}
                                                        className="gb-nav-sub flex items-center gap-2.5 mx-1.5 px-3 py-2 rounded-lg text-sm no-underline transition-colors"
                                                        style={{ color: itemColor }}
                                                        role="menuitem"
                                                    >
                                                        {sub.icon && sub.icon !== 'none' && (
                                                            <span
                                                                className="inline-flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                                                                style={{ backgroundColor: `${hoverColor}12`, color: hoverColor }}
                                                            >
                                                                <i className={`fa-solid ${sub.icon} text-[11px]`} />
                                                            </span>
                                                        )}
                                                        <span>{sub.label || 'Link'}</span>
                                                    </a>
                                                );
                                            })}
                                            {viewAllLabel && (
                                                <>
                                                    <div className="my-1.5 mx-3 h-px" style={{ backgroundColor: dropdownBorder }} />
                                                    {!readOnly ? (
                                                        <span
                                                            className="gb-nav-viewall flex items-center justify-between mx-1.5 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors"
                                                            style={{ color: hoverColor, backgroundColor: `${hoverColor}10` }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const href = (viewAllLink || '').trim();
                                                                if (href) handleLinkedClick(e, el, href);
                                                                else handleClick(e, el);
                                                            }}
                                                        >
                                                            <span>{viewAllLabel}</span>
                                                            <i className="fa-solid fa-arrow-right text-[11px] transition-transform" aria-hidden />
                                                        </span>
                                                    ) : (
                                                        <a href={(viewAllLink || '#').trim() || '#'}
                                                            className="gb-nav-viewall flex items-center justify-between mx-1.5 px-3 py-2 rounded-lg text-sm font-bold no-underline transition-colors"
                                                            style={{ color: hoverColor, backgroundColor: `${hoverColor}10` }}
                                                        >
                                                            <span>{viewAllLabel}</span>
                                                            <i className="fa-solid fa-arrow-right text-[11px] transition-transform" aria-hidden />
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </nav>
            );
        }

        case 'stat-card':
            const statIconColor = renderStyle.iconColor || theme?.iconColor || theme?.accentColor || '#3b82f6';
            const statIconBg = renderStyle.iconBackgroundColor || renderStyle.iconBgColor || theme?.iconBgColor || (statIconColor + '1A');
            // Card chrome via the shared resolver — honours the user's padding /
            // background / border / radius controls with theme fallbacks (was
            // previously hardcoded p-6 / rounded-2xl / bg-white/5 / border-white/10).
            const statCardStyle: React.CSSProperties = {
                ...safeStyle,
                ...resolveElementChrome(safeStyle, theme, {
                    padding: '1.5rem', radius: '1rem',
                    bg: theme?.cardBackgroundColor || 'rgba(255,255,255,0.05)',
                    borderWidth: '1px', borderColor: theme?.cardBorderColor || 'rgba(255,255,255,0.1)',
                }),
            };
            const sc = renderStyle as any;
            // Every sub-part is overridable now (Elementor-level). Icon container
            // size, wrapper gap/spacing, label + subtext typography & opacity were
            // all hardcoded Tailwind classes before — the exact "predefined design"
            // complaint. Defaults kick in only when the user hasn't set a value.
            const statIconBox = sc.iconContainerSize || '2.5rem';
            const statWrapGap = sc.iconGap || '1rem';
            const statHeadGap = sc.valueBottomSpace || '0.75rem';
            return (
                <div
                    key={id}
                    className={`transition-all duration-300 group ${selectedClass}`}
                    onClick={(e) => handleClick(e, el)}
                    style={{ ...statCardStyle, textAlign: (renderStyle.textAlign as any) || (statCardStyle as any).textAlign }}
                >
                    <div className="flex items-center" style={{ gap: statWrapGap, marginBottom: statHeadGap, justifyContent: renderStyle.textAlign === 'center' ? 'center' : renderStyle.textAlign === 'right' ? 'flex-end' : undefined }}>
                        {content.icon && (
                            <div className="flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"
                                style={{
                                    width: statIconBox,
                                    height: statIconBox,
                                    backgroundColor: statIconBg,
                                    color: statIconColor,
                                    border: renderStyle.iconBorderStyle && renderStyle.iconBorderStyle !== 'none'
                                        ? `${renderStyle.iconBorderWidth || '1px'} ${renderStyle.iconBorderStyle} ${renderStyle.iconBorderColor || statIconColor}`
                                        : (renderStyle.iconBorder || 'none'),
                                    borderRadius: renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0.5rem',
                                    borderTopLeftRadius: renderStyle.iconBorderTopLeftRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0.5rem'),
                                    borderTopRightRadius: renderStyle.iconBorderTopRightRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0.5rem'),
                                    borderBottomRightRadius: renderStyle.iconBorderBottomRightRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0.5rem'),
                                    borderBottomLeftRadius: renderStyle.iconBorderBottomLeftRadius || renderStyle.iconBorderRadius || (renderStyle.iconBorderRadius !== undefined ? renderStyle.iconBorderRadius : '0.5rem'),
                                    boxShadow: renderStyle.iconShadow || 'none'
                                }}
                            >
                                <IconRenderer icon={content.icon} size={sc.iconSize || '1.125rem'} style={{ color: statIconColor }} />
                            </div>
                        )}
                        <StatCardValue
                            raw={String(content.value ?? content.targetNumber ?? '0')}
                            readOnly={!!readOnly}
                            color={renderStyle.titleColor || theme?.titleColor || '#F8FAFC'}
                            className="tracking-tight outline-none"
                            style={{
                                fontSize: sc.titleFontSize || '1.875rem',
                                fontWeight: sc.titleFontWeight || 700,
                                fontFamily: sc.titleFontFamily || sc.fontFamily,
                                lineHeight: sc.titleLineHeight || 1.1,
                            }}
                            onBlur={(v) => handleContentUpdate(id, content.value !== undefined ? 'value' : 'targetNumber', v)}
                        />
                    </div>
                    <div
                        className="outline-none"
                        style={{
                            marginBottom: sc.labelBottomSpace || '0.25rem',
                            fontSize: sc.labelFontSize || '0.875rem',
                            fontWeight: sc.labelFontWeight || 600,
                            textTransform: sc.labelTextTransform || 'uppercase',
                            letterSpacing: sc.labelLetterSpacing || '0.05em',
                            lineHeight: sc.labelLineHeight,
                            fontFamily: sc.labelFontFamily || sc.fontFamily,
                            color: renderStyle.subheadingColor || theme?.subheadingColor || theme?.textColor || '#C7CDD6',
                            opacity: sc.labelOpacity !== undefined ? sc.labelOpacity : (theme?.subheadingColor ? 1 : 0.6),
                        }}
                        ref={bindHtml(id, content.text || 'Label')}
                        contentEditable={!readOnly}
                        {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                    />
                    {content.subText && (
                        <div
                            className="leading-relaxed outline-none"
                            style={{
                                fontSize: sc.subTextFontSize || '0.75rem',
                                fontWeight: sc.subTextFontWeight,
                                lineHeight: sc.subTextLineHeight,
                                opacity: sc.subTextOpacity !== undefined ? sc.subTextOpacity : 0.4,
                                color: sc.subTextColor || renderStyle.textColor || theme?.textColor || '#C7CDD6',
                            }}
                            ref={bindHtml(id, content.subText)}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'subText', html))}
                        />
                    )}
                </div>
            );

        case 'user-avatars': {
            const avatars = content.items || [];
            const avatarSize = (renderStyle as any).avatarSize || '40px';
            const overlap   = (renderStyle as any).avatarOverlap || '12px';
            const ringColor = (renderStyle as any).ringColor || theme?.cardBackgroundColor || '#0F172A';
            const ringWidth = (renderStyle as any).ringWidth || '2px';
            const showCount: boolean = (content as any).showCount !== false;
            const labelBefore: string = (content as any).labelBefore || 'Join';
            const labelAfter:  string = (content as any).labelAfter  || 'others';
            const labelColor = (renderStyle as any).labelColor || safeStyle.color || theme?.textColor || '#D1D5DB';
            const numberColor = (renderStyle as any).numberColor || theme?.accentColor || '#60A5FA';
            const labelFontSize = (renderStyle as any).labelFontSize || '0.875rem';
            const justify: string = (renderStyle as any).justifyContent || 'flex-start';
            const justifyClass = justify === 'flex-start' ? 'justify-start'
                : justify === 'center' ? 'justify-center'
                : justify === 'flex-end' ? 'justify-end'
                : 'justify-start';

            return (
                <div
                    key={id}
                    className={`flex items-center ${justifyClass} ${selectedClass}`}
                    onClick={(e) => handleClick(e, el)}
                    style={{ ...safeStyle, color: labelColor }}
                >
                    <div className="flex overflow-hidden mr-4" style={{ marginRight: showCount ? '1rem' : 0 }}>
                        {avatars.map((avatar: any, idx: number) => (
                            <img
                                key={idx}
                                className="inline-block rounded-full object-cover"
                                src={avatar.src}
                                alt={(avatar.alt as string) || `User ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                style={{
                                    width: avatarSize,
                                    height: avatarSize,
                                    boxShadow: `0 0 0 ${ringWidth} ${ringColor}`,
                                    marginLeft: idx === 0 ? 0 : `-${overlap}`,
                                    position: 'relative',
                                    zIndex: avatars.length - idx,
                                }}
                            />
                        ))}
                    </div>
                    {showCount && content.targetNumber && (
                        <div className="font-medium" style={{ color: labelColor, fontSize: labelFontSize }}>
                            <span
                                className="outline-none"
                                contentEditable={!readOnly}
                                suppressContentEditableWarning={!readOnly}
                                onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'labelBefore', e.currentTarget.textContent || '') : undefined}
                            >{labelBefore}</span>
                            {' '}
                            <span
                                className="font-bold outline-none"
                                style={{ color: numberColor }}
                                ref={bindHtml(id, content.targetNumber)}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'targetNumber', html))}
                            />
                            {' '}
                            <span
                                className="outline-none"
                                contentEditable={!readOnly}
                                suppressContentEditableWarning={!readOnly}
                                onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'labelAfter', e.currentTarget.textContent || '') : undefined}
                            >{labelAfter}</span>
                        </div>
                    )}
                </div>
            );
        }

        case 'pricing-table': {
            const accent = renderStyle?.accentColor || theme?.accentColor || '#3b82f6';
            const isPopular: boolean = !!(content as any).popular;
            const popularBadgeText: string = (content as any).popularBadgeText || 'Most Popular';
            const checkColor = (renderStyle as any).checkColor || accent;
            const featureSeparator: boolean = (renderStyle as any).featureSeparator === true;
            const ctaText: string = (content as any).ctaText || (content.link as string) || 'Choose Plan';
            const ctaLink: string = (content as any).ctaLink || '#';
            const ctaBgColor = (renderStyle as any).ctaBgColor || accent;
            const ctaTextColor = (renderStyle as any).ctaTextColor || '#FFFFFF';
            const planTitleColor = (renderStyle as any).planTitleColor || theme?.titleColor || '#F8FAFC';
            const priceColor = (renderStyle as any).priceColor || accent;
            const featureColor = (renderStyle as any).featureColor || safeStyle.color || theme?.textColor || '#D1D5DB';

            const pricingStyle: React.CSSProperties = {
                ...safeStyle,
                color: featureColor,
                backgroundColor: safeStyle.backgroundColor || theme?.cardBackgroundColor || 'rgba(255,255,255,0.05)',
                borderColor: isPopular ? accent : (safeStyle.borderColor || theme?.cardBorderColor || 'rgba(255,255,255,0.08)'),
                borderWidth: isPopular ? '2px' : (safeStyle.borderWidth || '1px'),
                borderStyle: 'solid',
                padding: safeStyle.padding || '2rem',
                borderRadius: safeStyle.borderRadius || '1rem',
                position: 'relative',
            };

            return (
                <div key={id} className={`flex flex-col items-center text-center ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={pricingStyle}>
                    {isPopular && (
                        <span
                            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full"
                            style={{ backgroundColor: accent, color: '#FFFFFF' }}
                        >
                            {popularBadgeText}
                        </span>
                    )}
                    <h3
                        className="text-xl font-bold mb-2 outline-none"
                        style={{ color: planTitleColor }}
                        ref={bindHtml(id, content.text || 'Plan Name')}
                        contentEditable={!readOnly}
                        {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                    />
                    <div
                        className="text-4xl font-bold mb-1 outline-none"
                        style={{ color: priceColor }}
                        ref={bindHtml(id, content.price || '$99')}
                        contentEditable={!readOnly}
                        {...editHandlers(id, (html) => handleContentUpdate(id, 'price', html))}
                    />
                    <div
                        className="text-sm mb-6 outline-none"
                        style={{
                            color: renderStyle.subheadingColor || theme?.subheadingColor || theme?.textColor || '#C7CDD6',
                            opacity: theme?.subheadingColor ? 1 : 0.7,
                        }}
                        ref={bindHtml(id, content.period || 'per month')}
                        contentEditable={!readOnly}
                        {...editHandlers(id, (html) => handleContentUpdate(id, 'period', html))}
                    />
                    <ul className="space-y-3 mb-8 w-full text-left">
                        {(content.items || [{ title: 'Feature 1' }, { title: 'Feature 2' }, { title: 'Feature 3' }]).map((feature: any, i: number) => (
                            <li
                                key={i}
                                className="flex gap-2 text-sm"
                                style={{
                                    color: featureColor,
                                    paddingBottom: featureSeparator ? '0.75rem' : 0,
                                    borderBottom: featureSeparator ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                }}
                            >
                                <i className="fa-solid fa-check mt-1 flex-shrink-0" style={{ color: checkColor }} />
                                <span
                                    className="outline-none flex-1"
                                    ref={bindHtml(`${id}-item-${i}`, feature.title || '')}
                                    contentEditable={!readOnly}
                                    {...editHandlers(`${id}-item-${i}`, (html) => handleArrayContentUpdate(id, 'items', i, 'title', html))}
                                />
                            </li>
                        ))}
                    </ul>
                    <a
                        href={ctaLink}
                        onClick={(e) => {
                          if (!readOnly) handleLinkedClick(e, el, ctaLink);
                        }}
                        className="w-full py-3 px-6 rounded-lg font-bold text-sm transition-opacity hover:opacity-90 outline-none cursor-pointer block text-center"
                        style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
                    >
                        <span
                            contentEditable={!readOnly}
                            suppressContentEditableWarning={!readOnly}
                            onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'ctaText', e.currentTarget.textContent || '') : undefined}
                        >
                            {ctaText}
                        </span>
                    </a>
                </div>
            );
        }

        case 'flip-box': {
            const directionClass: Record<string, string> = {
                left:   'group-hover:[transform:rotateY(180deg)]',
                right:  'group-hover:[transform:rotateY(-180deg)]',
                top:    'group-hover:[transform:rotateX(180deg)]',
                bottom: 'group-hover:[transform:rotateX(-180deg)]',
            };
            const dir = content.flipDirection || 'left';
            const rotateClass = directionClass[dir] || directionClass.left;
            const isVertical = dir === 'top' || dir === 'bottom';
            const backInitialTransform = isVertical ? 'rotateX(180deg)' : 'rotateY(180deg)';

            // Per-face colors (renderStyle override → theme fallback)
            const accent          = (renderStyle as any).accentColor   || theme?.accentColor || '#3b82f6';
            const frontBg         = (renderStyle as any).frontBg       || 'rgba(255,255,255,0.05)';
            const frontBorderCol  = (renderStyle as any).frontBorderColor || 'rgba(255,255,255,0.1)';
            const frontTitleCol   = (renderStyle as any).frontTitleColor   || theme?.titleColor || '#F8FAFC';
            const frontDescCol    = (renderStyle as any).frontDescColor    || safeStyle.color || theme?.textColor || '#D1D5DB';
            const frontIconCol    = (renderStyle as any).frontIconColor    || accent;
            const backBg          = (renderStyle as any).backBg        || accent;
            const backTitleCol    = (renderStyle as any).backTitleColor    || '#FFFFFF';
            const backDescCol     = (renderStyle as any).backDescColor     || 'rgba(255,255,255,0.9)';
            const backBtnBg       = (renderStyle as any).backBtnBg     || '#FFFFFF';
            const backBtnText     = (renderStyle as any).backBtnText   || '#000000';

            // Layout
            const flipHeight = (renderStyle as any).flipBoxHeight || '16rem';
            const flipRadius = (renderStyle as any).borderRadius   || '0.75rem';
            const flipDuration = (renderStyle as any).flipDuration || '700ms';
            const showFrontIcon: boolean = (content as any).showFrontIcon !== false;
            const frontIcon: string = content.icon || 'star';
            const frontIconSize = (renderStyle as any).frontIconSize || '2.25rem';
            const showBackBtn: boolean = (content as any).showBackBtn !== false;
            const backBtnText_str: string = (content as any).backBtnText || 'Learn More';
            const backBtnLink: string = (content as any).backBtnLink || '#';

            const flipBoxStyle: React.CSSProperties = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB',
                height: flipHeight,
                perspective: '1000px',
            };

            const faceStyle: React.CSSProperties = {
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden' as any,
                borderRadius: flipRadius,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: safeStyle.padding || '1.5rem',
                textAlign: 'center',
            };

            return (
                <div key={id} className={`group ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={flipBoxStyle}>
                    <div
                        className={`relative w-full h-full transition-transform [transform-style:preserve-3d] ${rotateClass}`}
                        style={{ transitionDuration: flipDuration }}
                    >
                        {/* Front face */}
                        <div style={{ ...faceStyle, backgroundColor: frontBg, border: `1px solid ${frontBorderCol}` }}>
                            {showFrontIcon && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <IconRenderer icon={frontIcon} size={frontIconSize} style={{ color: frontIconCol }} />
                                </div>
                            )}
                            <h3
                                className="font-bold text-xl outline-none"
                                style={{ color: frontTitleCol }}
                                ref={bindHtml(id, content.frontTitle || 'Front Title')}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'frontTitle', html))}
                            />
                            <p
                                className="text-sm mt-2 outline-none"
                                style={{ color: frontDescCol, opacity: 0.85 }}
                                ref={bindHtml(id, content.frontDesc || 'Hover to flip')}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'frontDesc', html))}
                            />
                        </div>
                        {/* Back face */}
                        <div style={{ ...faceStyle, backgroundColor: backBg, transform: backInitialTransform }}>
                            <h3
                                className="font-bold text-xl outline-none"
                                style={{ color: backTitleCol }}
                                ref={bindHtml(id, content.backTitle || 'Back Title')}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'backTitle', html))}
                            />
                            <p
                                className="text-sm mt-2 mb-4 outline-none"
                                style={{ color: backDescCol }}
                                ref={bindHtml(id, content.backDesc || 'Hidden details revealed.')}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'backDesc', html))}
                            />
                            {showBackBtn && (
                                <a
                                    href={backBtnLink}
                                    onClick={(e) => {
                                      if (!readOnly) {
                                        handleLinkedClick(
                                          e,
                                          el,
                                          (content as any).backLink || (content as any).link || ''
                                        );
                                      }
                                    }}
                                    className="px-4 py-2 text-xs font-bold rounded-full transition-opacity hover:opacity-90 outline-none cursor-pointer"
                                    style={{ backgroundColor: backBtnBg, color: backBtnText }}
                                >
                                    <span
                                        contentEditable={!readOnly}
                                        suppressContentEditableWarning={!readOnly}
                                        onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'backBtnText', e.currentTarget.textContent || '') : undefined}
                                    >
                                        {backBtnText_str}
                                    </span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        case 'countdown-timer': {
            const countdownAccentColor = (renderStyle as any).accentColor || theme?.accentColor || '#F59E0B';
            const countdownStyle: React.CSSProperties = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB',
            };
            const showHeading: boolean = (content as any).showHeading !== false;
            return (
                <div key={id} className={`${selectedClass}`} onClick={(e) => handleClick(e, el)} style={countdownStyle}>
                    {showHeading && (
                        <h4
                            className="font-bold mb-4 uppercase tracking-widest outline-none"
                            style={{
                                textAlign: safeStyle.textAlign,
                                color: (renderStyle as any).subheadingColor || theme?.subheadingColor || theme?.textColor || '#C7CDD6',
                                opacity: theme?.subheadingColor ? 1 : 0.7,
                                fontSize: (renderStyle as any).headingFontSize || '0.75rem',
                            }}
                            ref={bindHtml(id, content.text || 'Offer Ends In')}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                        />
                    )}
                    <CountdownTimer
                        targetDate={content.targetDate || new Date(Date.now() + 86400000).toISOString()}
                        style={{ ...renderStyle, accentColor: countdownAccentColor, textAlign: safeStyle.textAlign }}
                        content={content}
                    />
                </div>
            );
        }

        case 'review-carousel': {
            const items = content.items || [{ author: 'Sarah K.', content: 'Excellent product, exceeded expectations.', rating: 5 },
                                            { author: 'Mike T.', content: 'Great value for the price. Highly recommend.', rating: 5 }];
            const wrapBg     = (renderStyle as any).wrapBg     || safeStyle.backgroundColor || 'rgba(255,255,255,0.05)';
            const wrapBorder = (renderStyle as any).wrapBorder || safeStyle.borderColor || 'rgba(255,255,255,0.1)';
            const wrapPadding = (renderStyle as any).wrapPadding || safeStyle.padding || '1.5rem';
            const wrapRadius = (renderStyle as any).wrapRadius || safeStyle.borderRadius || '0.75rem';
            const cardBg     = (renderStyle as any).reviewCardBg     || 'rgba(0,0,0,0.2)';
            const cardBorder = (renderStyle as any).reviewCardBorder || 'rgba(255,255,255,0.05)';
            const cardWidth  = (renderStyle as any).reviewCardWidth  || '260px';
            const cardGap    = (renderStyle as any).reviewCardGap    || '1rem';
            const cardRadius = (renderStyle as any).reviewCardRadius || '0.5rem';
            const starColor  = (renderStyle as any).starColor  || '#F59E0B';
            const reviewTextColor = (renderStyle as any).reviewTextColor || safeStyle.color || theme?.textColor || themeData?.description || '#D1D5DB';
            const authorColor = (renderStyle as any).authorColor || theme?.titleColor || themeData?.heading || '#F8FAFC';
            const reviewFontSize = (renderStyle as any).reviewFontSize || '0.875rem';
            const authorFontSize = (renderStyle as any).authorFontSize || '0.75rem';
            const isMarquee: boolean = !!(content as any).marquee;
            const marqueeSpeed: string = String((content as any).marqueeSpeed || '40s');
            const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');

            const renderRating = (rating: number) => {
                const r = Math.max(0, Math.min(5, rating));
                return Array.from({ length: 5 }).map((_, k) => (
                    <i
                        key={k}
                        className="fa-solid fa-star text-xs"
                        style={{ color: k < r ? starColor : 'rgba(255,255,255,0.18)' }}
                        aria-hidden="true"
                    />
                ));
            };

            const renderReviewCard = (item: any, i: number, keyPrefix = '') => (
                <div
                    key={`${keyPrefix}${i}`}
                    className="flex-shrink-0"
                    style={{
                        minWidth: cardWidth,
                        width: cardWidth,
                        backgroundColor: cardBg,
                        border: `1px solid ${cardBorder}`,
                        borderRadius: cardRadius,
                        padding: '1rem',
                    }}
                >
                    <div className="mb-2 flex gap-0.5">{renderRating(typeof item.rating === 'number' ? item.rating : 5)}</div>
                    <p
                        className="italic mb-3 outline-none"
                        style={{ color: reviewTextColor, fontSize: reviewFontSize, opacity: 0.9 }}
                        ref={bindHtml(`${id}-item-${i}`, item.content || 'Excellent product.')}
                        contentEditable={!readOnly}
                        {...editHandlers(`${id}-item-${i}`, (html) => handleArrayContentUpdate(id, 'items', i, 'content', html))}
                    />
                    <div
                        className="font-bold outline-none"
                        style={{ color: authorColor, fontSize: authorFontSize }}
                        ref={bindHtml(`${id}-item-${i}`, item.author || 'User')}
                        contentEditable={!readOnly}
                        {...editHandlers(`${id}-item-${i}`, (html) => handleArrayContentUpdate(id, 'items', i, 'author', html))}
                    />
                </div>
            );

            const wrapStyle: React.CSSProperties = {
                ...safeStyle,
                backgroundColor: wrapBg,
                borderColor: wrapBorder,
                borderWidth: safeStyle.borderWidth || '1px',
                borderStyle: safeStyle.borderStyle || 'solid',
                borderRadius: wrapRadius,
                padding: wrapPadding,
            };

            if (isMarquee) {
                return (
                    <div key={id} className={`relative overflow-hidden ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={wrapStyle}>
                        <style>{`@keyframes rc-${safeId}-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
                        <div
                            className="flex whitespace-nowrap"
                            style={{
                                gap: cardGap,
                                width: 'max-content',
                                animation: `rc-${safeId}-scroll ${marqueeSpeed} linear infinite`,
                            }}
                        >
                            {items.map((item: any, i: number) => renderReviewCard(item, i, 'a-'))}
                            {items.map((item: any, i: number) => renderReviewCard(item, i, 'b-'))}
                        </div>
                    </div>
                );
            }

            return (
                <div key={id} className={`${selectedClass}`} onClick={(e) => handleClick(e, el)} style={wrapStyle}>
                    <div className="flex overflow-x-auto" style={{ gap: cardGap }}>
                        {items.map((item: any, i: number) => renderReviewCard(item, i))}
                    </div>
                </div>
            );
        }

        case 'card': {
            const cardBg = (safeStyle.backgroundColor && safeStyle.backgroundColor !== 'transparent')
                ? safeStyle.backgroundColor
                : (theme?.cardBackgroundColor || '#FFFFFF');
            const cardBorder = (safeStyle.borderColor && safeStyle.borderColor !== 'transparent')
                ? safeStyle.borderColor
                : (theme?.cardBorderColor || '#E5E7EB');
            const cardImgUrl = content.imageUrl || content.src || '';
            const resolvedCardImg = cardImgUrl
                ? toDisplayImageUrl(cardImgUrl)
                : null;
            const cs = renderStyle as any;
            // Every visual prop is overridable (Elementor-level). Defaults kick in
            // only when the user hasn't set a value.
            const cardRadius = safeStyle.borderRadius || '1rem';
            const cardImgRatio = cs.imageAspectRatio || '16/9';
            const cardImgFit = cs.imageObjectFit || 'cover';
            const cardPad = safeStyle.padding || '1.5rem';
            const cardGap = cs.contentGap || '0.75rem';
            // Hover lift/shadow is opt-out (was hardcoded on).
            const cardHover = cs.hoverEffect !== 'none' && cs.hoverLift !== false;
            const cardHoverShadow = cs.hoverBoxShadow || '0 20px 40px -12px rgba(0,0,0,0.25)';
            const cardLift = cs.hoverLiftDistance || '-4px';
            const cardHoverCls = `cv-card-${(id || '').replace(/[^a-zA-Z0-9_-]/g, '')}`;
            // LAYOUT VARIANT (Elementor-style): one card element, many looks.
            //   image-top (default) | image-left | image-right | overlay | no-image | icon-top
            const cardLayout: string = cs.cardLayout || 'image-top';
            const cardIcon = content.icon || cs.cardIcon;
            const isHorizontal = cardLayout === 'image-left' || cardLayout === 'image-right';
            const isOverlay = cardLayout === 'overlay';
            const isIconTop = cardLayout === 'icon-top';
            const showImage = resolvedCardImg && cardLayout !== 'no-image' && !isIconTop;
            const cardAccent = cs.accentColor || theme?.accentColor || '#6366f1';

            // The media block (image), reused across layouts.
            const mediaBlock = showImage ? (
                <div
                    className="overflow-hidden shrink-0"
                    style={
                        isHorizontal
                            ? { width: cs.imageWidth || '40%', alignSelf: 'stretch' }
                            : { aspectRatio: cardImgRatio, width: '100%' }
                    }
                >
                    <img
                        src={resolvedCardImg!}
                        alt={content.text || 'Card image'}
                        className="w-full h-full"
                        style={{ objectFit: cardImgFit as any, minHeight: isHorizontal ? '100%' : undefined }}
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).src = SECTION_IMAGE_PLACEHOLDER; }}
                    />
                </div>
            ) : null;

            // Icon-top layout renders an icon chip instead of an image.
            const iconBlock = isIconTop ? (
                <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                        width: cs.iconContainerSize || '3.5rem',
                        height: cs.iconContainerSize || '3.5rem',
                        borderRadius: cs.iconRadius || '0.875rem',
                        backgroundColor: cs.iconBackgroundColor || `${cardAccent}1A`,
                        color: cardAccent,
                        marginBottom: '0.25rem',
                    }}
                >
                    <IconRenderer icon={cardIcon || 'fa-star'} size={cs.iconSize || '1.5rem'} style={{ color: cardAccent }} />
                </div>
            ) : null;

            // Overlay layout: image is the background, content sits on top with a scrim.
            const outerFlexClass = isHorizontal ? 'flex-row' : 'flex-col';
            const bodyPad = cardPad;
            return (
                <div
                    key={id}
                    className={`overflow-hidden flex ${outerFlexClass} transition-all duration-300 relative ${cardHover ? cardHoverCls : ''} ${selectedClass}`}
                    style={{
                        ...safeStyle,
                        backgroundColor: isOverlay ? '#000' : cardBg,
                        borderColor: cardBorder,
                        borderWidth: safeStyle.borderWidth || '1px',
                        borderStyle: safeStyle.borderStyle || 'solid',
                        borderRadius: cardRadius,
                        boxShadow: safeStyle.boxShadow || undefined,
                        padding: 0,
                        minHeight: isOverlay ? (cs.overlayMinHeight || '320px') : undefined,
                    }}
                    onClick={(e) => handleClick(e, el)}
                >
                    {cardHover && (
                        <style>{`.${cardHoverCls}:hover{transform:translateY(${cardLift});box-shadow:${cardHoverShadow};}`}</style>
                    )}
                    {/* Overlay: full-bleed image + scrim behind the content */}
                    {isOverlay && resolvedCardImg && (
                        <>
                            <img
                                src={resolvedCardImg}
                                alt={content.text || 'Card image'}
                                className="absolute inset-0 w-full h-full"
                                style={{ objectFit: 'cover', zIndex: 0 }}
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.target as HTMLImageElement).src = SECTION_IMAGE_PLACEHOLDER; }}
                            />
                            <div className="absolute inset-0" style={{ background: cs.overlayScrim || 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.8) 100%)', zIndex: 1 }} />
                        </>
                    )}
                    {/* image-left: media first; image-right: media after body (order swap) */}
                    {cardLayout === 'image-left' && mediaBlock}
                    {!isHorizontal && !isOverlay && mediaBlock}
                    <div
                        className={`flex flex-col flex-1 ${isOverlay ? 'justify-end relative' : ''}`}
                        style={{ padding: bodyPad, gap: cardGap, zIndex: isOverlay ? 2 : undefined, justifyContent: isHorizontal ? 'center' : undefined, textAlign: (renderStyle.textAlign as any) || undefined, alignItems: renderStyle.textAlign === 'center' ? 'center' : renderStyle.textAlign === 'right' ? 'flex-end' : undefined }}
                    >
                        {iconBlock}
                        {(content.badge || content.badgeText) && (
                            <span
                                className="self-start font-bold rounded-full"
                                style={{
                                    fontSize: cs.badgeFontSize || '0.75rem',
                                    padding: cs.badgePadding || '4px 12px',
                                    borderRadius: cs.badgeRadius || '9999px',
                                    backgroundColor: cs.badgeBackgroundColor || (theme as any)?.badge?.background || ((theme?.accentColor || '#6366f1') + '22'),
                                    color: cs.badgeColor || theme?.accentColor || '#6366f1',
                                }}
                            >
                                {content.badge || content.badgeText}
                            </span>
                        )}
                        <div
                            className="outline-none"
                            style={{
                                fontSize: cs.titleFontSize || '1.125rem',
                                fontWeight: cs.titleFontWeight || 700,
                                fontFamily: cs.titleFontFamily || cs.fontFamily,
                                lineHeight: cs.titleLineHeight || 1.35,
                                letterSpacing: cs.titleLetterSpacing,
                                textTransform: cs.titleTextTransform,
                                color: cs.titleColor || (isOverlay ? '#FFFFFF' : (theme?.titleColor || '#111827')),
                            }}
                            ref={bindHtml(id, content.text || 'Card Title')}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                        />
                        {(content.subText || content.description) && (
                            <div
                                className="flex-1 outline-none"
                                style={{
                                    fontSize: cs.descriptionFontSize || '0.875rem',
                                    fontWeight: cs.descriptionFontWeight,
                                    lineHeight: cs.descriptionLineHeight || 1.625,
                                    opacity: cs.descriptionOpacity !== undefined ? cs.descriptionOpacity : (isOverlay ? 0.9 : 0.8),
                                    color: cs.descriptionColor || (isOverlay ? '#E5E7EB' : (safeStyle.color || theme?.textColor || '#4B5563')),
                                }}
                                ref={bindHtml(`${id}-card-desc`, content.subText || content.description || '')}
                                contentEditable={!readOnly}
                                {...editHandlers(`${id}-card-desc`, (html) =>
                                  handleContentUpdate(id, content.subText !== undefined ? 'subText' : 'description', html)
                                )}
                            />
                        )}
                        {content.link && (
                            <a
                                href={readOnly ? (content.link || '#') : undefined}
                                className="mt-auto inline-flex items-center gap-1 font-semibold"
                                style={{
                                    fontSize: cs.linkFontSize || '0.875rem',
                                    color: cs.linkColor || (isOverlay ? '#FFFFFF' : (theme?.accentColor || theme?.secondaryHeadingColor || '#6366f1')),
                                }}
                            >
                                {content.linkText || 'Learn more'} <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8em' }}></i>
                            </a>
                        )}
                    </div>
                    {/* image-right: media after the body */}
                    {cardLayout === 'image-right' && mediaBlock}
                </div>
            );
        }

        case 'pricing-item': {
            const accentCol = (renderStyle as any).accentColor || theme?.accentColor || '#6366f1';
            const isFeatured = content.featured === true || content.featured === 'true';
            const liftFeatured: boolean = (renderStyle as any).liftFeatured !== false; // default on
            const features: any[] = content.items || (Array.isArray(content.features) ? content.features.map((f: string) => ({ title: f })) : []);
            const planBg = (safeStyle.backgroundColor && safeStyle.backgroundColor !== 'transparent')
                ? safeStyle.backgroundColor
                : (theme?.cardBackgroundColor || '#FFFFFF');
            const planBorder = (safeStyle.borderColor && safeStyle.borderColor !== 'transparent')
                ? safeStyle.borderColor
                : (theme?.cardBorderColor || '#E5E7EB');

            // Per-element color overrides
            const planTitleCol  = (renderStyle as any).planTitleColor  || (renderStyle as any).titleColor || theme?.titleColor || '#111827';
            const priceCol      = (renderStyle as any).priceColor      || accentCol;
            const periodCol     = (renderStyle as any).periodColor     || safeStyle.color || theme?.textColor || '#6B7280';
            const descCol       = (renderStyle as any).descriptionColor || safeStyle.color || theme?.textColor || '#6B7280';
            const featureCol    = (renderStyle as any).featureColor    || safeStyle.color || theme?.textColor || '#4B5563';
            const checkCol      = (renderStyle as any).checkColor      || accentCol;
            const ctaBgCol      = (renderStyle as any).ctaBgColor      || accentCol;
            const ctaTextCol    = (renderStyle as any).ctaTextColor    || '#FFFFFF';
            const badgeBgCol    = (renderStyle as any).badgeBgColor    || accentCol;
            const badgeTextCol  = (renderStyle as any).badgeTextColor  || '#FFFFFF';

            return (
                <div
                    key={id}
                    className={`relative overflow-hidden flex flex-col transition-all duration-300 ${isFeatured && liftFeatured ? 'shadow-xl scale-105' : ''} ${selectedClass}`}
                    style={{
                        ...safeStyle,
                        backgroundColor: planBg,
                        borderColor: isFeatured ? accentCol : planBorder,
                        borderWidth: isFeatured ? '2px' : (safeStyle.borderWidth || '1px'),
                        borderStyle: safeStyle.borderStyle || 'solid',
                        borderRadius: safeStyle.borderRadius || '1rem',
                    }}
                    onClick={(e) => handleClick(e, el)}
                >
                    {isFeatured && (
                        <div
                            className="text-center text-xs font-bold py-2 tracking-widest uppercase"
                            style={{ backgroundColor: badgeBgCol, color: badgeTextCol }}
                        >
                            <span
                                className="outline-none"
                                contentEditable={!readOnly}
                                suppressContentEditableWarning={!readOnly}
                                onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'badge', e.currentTarget.textContent || '') : undefined}
                            >{content.badge || 'Most Popular'}</span>
                        </div>
                    )}
                    <div className="flex flex-col flex-1 gap-4" style={{ padding: safeStyle.padding || '2rem' }}>
                        <div
                            className="font-bold outline-none"
                            style={{ color: planTitleCol, fontSize: (renderStyle as any).planTitleFontSize || '1.25rem' }}
                            ref={bindHtml(id, content.text || content.planName || 'Starter')}
                            contentEditable={!readOnly}
                            {...editHandlers(id, (html) => handleContentUpdate(id, 'text', html))}
                        />
                        <div className="flex items-end gap-1">
                            <span
                                className="font-extrabold outline-none"
                                style={{ color: priceCol, fontSize: (renderStyle as any).priceFontSize || '3rem', lineHeight: 1 }}
                                ref={bindHtml(id, content.price || '$29')}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'price', html))}
                            />
                            <span
                                className="mb-2 text-sm outline-none"
                                style={{ color: periodCol, opacity: 0.7 }}
                                ref={bindHtml(id, content.period || '/month')}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'period', html))}
                            />
                        </div>
                        {content.subText && (
                            <p
                                className="text-sm outline-none"
                                style={{ color: descCol, opacity: 0.85 }}
                                ref={bindHtml(id, content.subText)}
                                contentEditable={!readOnly}
                                {...editHandlers(id, (html) => handleContentUpdate(id, 'subText', html))}
                            />
                        )}
                        {features.length > 0 && (
                            <ul className="space-y-2 flex-1 my-2">
                                {features.map((feat: any, fi: number) => (
                                    <li key={fi} className="flex items-start gap-2 text-sm">
                                        <i
                                            className="fa-solid fa-circle-check mt-0.5 flex-shrink-0"
                                            style={{ color: checkCol }}
                                        />
                                        <span
                                            className="outline-none flex-1"
                                            style={{ color: featureCol }}
                                            ref={bindHtml(`${id}-feat-${fi}`, String(feat.title || feat.text || feat))}
                                            contentEditable={!readOnly}
                                            {...editHandlers(`${id}-feat-${fi}`, (html) =>
                                              handleArrayContentUpdate(id, 'items', fi, 'title', html)
                                            )}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                        <a
                            href={(content as any).ctaLink || (content.link as string) || '#'}
                            onClick={(e) => {
                              if (!readOnly) {
                                handleLinkedClick(
                                  e,
                                  el,
                                  (content as any).ctaLink || (content.link as string) || ''
                                );
                              }
                            }}
                            className="mt-auto w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 outline-none cursor-pointer block text-center"
                            style={{ backgroundColor: ctaBgCol, color: ctaTextCol }}
                        >
                            <span
                                contentEditable={!readOnly}
                                suppressContentEditableWarning={!readOnly}
                                onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'ctaText', e.currentTarget.textContent || '') : undefined}
                            >
                                {content.ctaText || content.link || 'Get Started'}
                            </span>
                        </a>
                    </div>
                </div>
            );
        }

        case 'divider': {
            // Divider styles: solid / dashed / dotted / double / icon-centered.
            // Line color follows theme borderColor unless user overrides via renderStyle.borderColor.
            const divStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'icon' = ((content as any).dividerStyle || 'solid');
            const divColor = renderStyle.borderColor || (theme as any)?.borderColor || 'rgba(255,255,255,0.15)';
            // thickness / marginY can come from either the Design tab (style) or Content tab (legacy).
            const divThickness = String((renderStyle as any).dividerThickness || (content as any).thickness || '1px');
            const divMarginY = String((renderStyle as any).dividerMarginY || (content as any).marginY || '24px');

            if (divStyle === 'icon') {
                const divIcon = (content as any).icon && (content as any).icon !== 'none' ? (content as any).icon : 'star';
                return (
                    <div
                        key={id}
                        className={`flex items-center gap-4 w-full ${selectedClass}`}
                        style={{ margin: `${divMarginY} 0` }}
                        onClick={(e) => handleClick(e, el)}
                    >
                        <div className="flex-1" style={{ borderTop: `${divThickness} solid ${divColor}` }} aria-hidden="true" />
                        <IconRenderer icon={divIcon} size={(renderStyle as any).fontSize || '1.25rem'} style={{ color: renderStyle.color || (theme as any)?.accentColor || divColor }} />
                        <div className="flex-1" style={{ borderTop: `${divThickness} solid ${divColor}` }} aria-hidden="true" />
                    </div>
                );
            }

            // Divider is visually a 1px line, but in edit mode we wrap it in a
            // taller hit-area so it's actually clickable in the canvas.
            return (
                <div
                    key={id}
                    role="separator"
                    aria-orientation="horizontal"
                    className={`w-full ${!readOnly ? 'cursor-pointer py-3' : ''} ${selectedClass}`}
                    style={{
                        margin: `${divMarginY} 0`,
                    }}
                    onClick={(e) => handleClick(e, el)}
                >
                    <div
                        className="w-full"
                        style={{ borderTop: `${divThickness} ${divStyle} ${divColor}` }}
                        aria-hidden="true"
                    />
                </div>
            );
        }

        case 'spacer': {
            const height = String((content as any).height || '40px');
            return (
                <div
                    key={id}
                    aria-hidden="true"
                    className={`w-full ${selectedClass} ${!readOnly ? 'bg-white/[0.02] border border-dashed border-white/10' : ''}`}
                    style={{ height, minHeight: height }}
                    onClick={(e) => handleClick(e, el)}
                    title={!readOnly ? `Spacer — ${height}` : undefined}
                />
            );
        }

        case 'table': {
            const headers: string[] = Array.isArray((content as any).headers)
                ? (content as any).headers
                : ['Column 1', 'Column 2'];
            const rows: string[][] = Array.isArray((content as any).rows)
                ? (content as any).rows
                : [['—', '—']];
            const caption = String((content as any).caption || '').trim();
            const borderColor =
                (renderStyle as any).borderColor ||
                theme?.cardBorderColor ||
                'rgba(15,23,42,0.12)';
            const headerBg =
                (renderStyle as any).backgroundColor ||
                theme?.cardBackgroundColor ||
                'rgba(15,23,42,0.04)';
            return (
                <div
                    key={id}
                    className={`w-full overflow-x-auto ${selectedClass}`}
                    onClick={(e) => handleClick(e, el)}
                >
                    <table
                        className="gb-data-table w-full text-left text-sm"
                        style={{
                            borderCollapse: 'collapse',
                            width: '100%',
                            color: renderStyle.color || theme?.textColor || '#111827',
                            fontFamily: renderStyle.fontFamily || theme?.descriptionFontFamily,
                        }}
                    >
                        {caption ? (
                            <caption className="caption-top text-left text-xs opacity-70 mb-2">
                                {caption}
                            </caption>
                        ) : null}
                        <thead>
                            <tr>
                                {headers.map((h, i) => (
                                    <th
                                        key={i}
                                        className="px-3 py-2 font-semibold"
                                        style={{
                                            border: `1px solid ${borderColor}`,
                                            backgroundColor: headerBg,
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr key={ri}>
                                    {headers.map((_, ci) => (
                                        <td
                                            key={ci}
                                            className="px-3 py-2 align-top"
                                            style={{ border: `1px solid ${borderColor}` }}
                                        >
                                            {row?.[ci] ?? ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        default:
             return (
                 <div key={id} className={`${selectedClass} opacity-50`} onClick={(e) => handleClick(e, el)}>
                     Element {type} not fully implemented in preview.
                 </div>
             );
    }
  };

  // Wrap with a link only when content.link is set. Edit mode never uses a
  // navigable <a href> (prevents iframe refresh). Preview uses soft-nav via PreviewFrame.
  const wrapWithLink = (el: WebsiteElement, node: React.ReactNode): React.ReactNode => {
    const rawLink = String((el.content as any)?.link || '').trim();
    if (!hasUsableHref(rawLink)) return node;

    // These always wire links themselves (button markup / nav / cards).
    const alwaysSelf = new Set([
      'button',
      'call-to-action',
      'image-box',
      'badge',
      'image',
      'feature-box',
      'nav-menu',
      'navigation',
      'table',
    ]);
    if (alwaysSelf.has(el.type)) return node;

    // Heading/text handle the chooser in edit mode; still need <a> in preview.
    if (!readOnly && (el.type === 'heading' || el.type === 'text')) return node;

    if (!readOnly) {
      return (
        <div
          key={`lnk-${el.id}`}
          role="link"
          data-gb-editable-link="1"
          data-gb-href={rawLink}
          className="block no-underline text-inherit cursor-pointer"
          onClick={(e) => handleLinkedClick(e, el, rawLink)}
        >
          {node}
        </div>
      );
    }

    const { target, rel } = resolveAnchorTargetRel(rawLink, (el.content as any)?.openInNewTab);
    return (
      <a
        key={`lnk-${el.id}`}
        href={rawLink}
        target={target}
        rel={rel}
        className="block no-underline text-inherit"
      >
        {node}
      </a>
    );
  };

  /** Attach data-element-id so tablet/mobile CSS overrides from buildResponsiveOverrideCss match. */
  const withElementId = (el: WebsiteElement, node: React.ReactNode): React.ReactNode => {
    // A React.Fragment IS a valid element but can only take `key`/`children` —
    // cloning `data-element-id` onto it warns. Wrap those in a display:contents
    // span instead (same layout, no warning).
    if (React.isValidElement(node) && node.type !== React.Fragment) {
      const props = node.props as Record<string, unknown>;
      if (props['data-element-id']) return node;
      return React.cloneElement(node as React.ReactElement<any>, {
        'data-element-id': el.id,
        key: node.key ?? el.id,
      });
    }
    return (
      <span key={el.id} data-element-id={el.id} style={{ display: 'contents' }}>
        {node}
      </span>
    );
  };

  const renderElementWithLink = (el: WebsiteElement) =>
    withElementId(el, wrapWithLink(el, renderElement(el)));

  // Render elements
  const elementsContent = isWrapped ? (
    <div className="grid gap-8">
      {elements.map(renderElementWithLink)}
    </div>
  ) : (
    <>
      {elements.map(renderElementWithLink)}
    </>
  );

  // If isWrapped is false, render elements directly without wrapper (for use in custom layouts)
  if (!isWrapped) {
    return (
      <>
        {elementsContent}
        {renderLinkChooser()}
      </>
    );
  }

  // Default: render with wrapper div for standard sections
  return (
    <div className="max-w-6xl mx-auto px-6 py-4 relative z-10 text-left">
      {elementsContent}
      {renderLinkChooser()}
    </div>
  );
};
