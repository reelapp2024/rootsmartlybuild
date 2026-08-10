import React from 'react';
import { RangeInput, SelectInput, TextAreaInput, TextInput } from '../inputs';
import { LinkNewTabToggle } from './LinkNewTabToggle';
import type { TypographyContentFormProps } from './types';
import type { WebsiteElement, Section } from '../../../types';
import {
  parseFontSizeToRem,
  resolveHeadingFontSize,
  type HeadingTag,
} from '../../../utils/resolveElementTypography';
import { useDefaultSizes } from '../state/DefaultSizesContext';
import { useGlobalElementStyles } from '../state/GlobalElementStylesContext';
import {
  composeHeadingText,
  resolveHeadingSidebarParts,
} from '../../sections/homepage/utils/headingHighlight';
import { TextLimitControls } from './TextLimitControls';

type HeadingContentFormProps = TypographyContentFormProps;

/**
 * Heading content form. Fields:
 *   3-part text (start / highlight / end), tag, size, link  (existing)
 *   kicker        — small uppercase line above the heading ("OUR FEATURES")
 *   animation     — reveal-on-scroll preset (none / fade-up / slide-left / blur-in / typewriter / split-words)
 *   animationDelay  — seconds before the animation starts
 *   highlightMode — color (default) / background / underline — per-element override
 */
export const HeadingContentForm: React.FC<HeadingContentFormProps> = ({
  element,
  section,
  onContentUpdate,
  onStyleUpdate,
  onSectionStyleUpdate,
}) => {
  const defaultSizesFromContext = useDefaultSizes();
  const globalElementStyles = useGlobalElementStyles();
  const c = (element.content || {}) as any;
  // Same derivation as ElementsSection heading render — never show empty fields /
  // static placeholders while the canvas is painting from `content.text`.
  const parts = resolveHeadingSidebarParts(c);
  const isLegacyHeroTitle = element.id.startsWith(`${section.id}-hero-title`);
  const headingTag = (isLegacyHeroTitle
    ? (section.styles.titleHeadingTag || 'h1')
    : (element.content?.htmlTag || 'h2')) as HeadingTag;

  const resolvedSizeStr = resolveHeadingFontSize({
    elementStyle: element.style as Record<string, unknown>,
    sectionStyles: section.styles as Record<string, unknown>,
    isHeroTitle: isLegacyHeroTitle,
    headingTag,
    globalHeadings: globalElementStyles?.headings,
    defaultSizes: defaultSizesFromContext,
  });

  const currentNum = parseFontSizeToRem(resolvedSizeStr);

  const patchHeadingParts = (patch: {
    textBefore?: string;
    highlightedText?: string;
    textAfter?: string;
  }) => {
    const nextBefore = patch.textBefore !== undefined ? patch.textBefore : parts.textBefore;
    const nextHighlight = patch.highlightedText !== undefined ? patch.highlightedText : parts.highlightedText;
    const nextAfter = patch.textAfter !== undefined ? patch.textAfter : parts.textAfter;
    onContentUpdate({
      textBefore: nextBefore,
      highlightedText: nextHighlight,
      textAfter: nextAfter,
      text: composeHeadingText(nextBefore, nextHighlight, nextAfter),
    });
  };

  return (
    <>
      <div className="space-y-3">
        <TextInput
          label="Heading Start"
          value={parts.textBefore}
          onChange={(v) => patchHeadingParts({ textBefore: v })}
          placeholder="Expert"
        />
        <TextInput
          label="Highlighted Word"
          value={parts.highlightedText}
          onChange={(v) => patchHeadingParts({ highlightedText: v })}
          placeholder="plumbing"
        />
        <TextInput
          label="Heading End"
          value={parts.textAfter}
          onChange={(v) => patchHeadingParts({ textAfter: v })}
          placeholder="solution for me"
        />
      </div>
      <TextInput
        label="Link (optional URL)"
        value={element.content?.link || ''}
        onChange={(v) => onContentUpdate({ link: v })}
        placeholder="https://... or # or tel:..."
      />
      <LinkNewTabToggle
        visible={!!element.content?.link && !!String(element.content.link).trim()}
        value={(element.content as any)?.linkNewTab}
        onChange={(v) => onContentUpdate({ linkNewTab: v } as any)}
      />
      <SelectInput
        key={`heading-tag-${element.id}-${headingTag}`}
        label="Heading Level"
        value={headingTag}
        options={[
          { label: 'H1 (Largest)', value: 'h1' },
          { label: 'H2', value: 'h2' },
          { label: 'H3', value: 'h3' },
          { label: 'H4', value: 'h4' },
          { label: 'H5', value: 'h5' },
          { label: 'H6 (Smallest)', value: 'h6' },
        ]}
        onChange={(v) => {
          const targetTag = v as HeadingTag;
          const elementStyle = (element.style || {}) as Record<string, unknown>;
          const titleColor = String(
            elementStyle.color || section.styles?.titleColor || ''
          )
            .trim()
            .toLowerCase();
          const secondaryColor = String(elementStyle.secondaryHeadingColor || '')
            .trim()
            .toLowerCase();
          const clearStaleHighlight =
            !!secondaryColor && !!titleColor && secondaryColor === titleColor;

          if (isLegacyHeroTitle) {
            onSectionStyleUpdate('titleHeadingTag', targetTag);
            onSectionStyleUpdate('titleSize', '');
            if (clearStaleHighlight) {
              onSectionStyleUpdate('secondaryHeadingColor', '');
            }
          } else {
            onContentUpdate({ htmlTag: targetTag as any });
            onStyleUpdate({
              fontSize: '',
              ...(clearStaleHighlight ? { secondaryHeadingColor: '' } : {}),
            });
          }
        }}
      />
      <RangeInput
        label="Heading Size"
        value={currentNum}
        min={0.5}
        max={10}
        step={0.1}
        unit="rem"
        onChange={(v) => {
          const newSize = `${v}rem`;
          if (isLegacyHeroTitle) {
            onSectionStyleUpdate('titleSize', newSize);
          } else {
            onStyleUpdate({ fontSize: newSize });
          }
        }}
      />

      {/* ───────── KICKER ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kicker (optional)</h4>
        <TextInput
          label="Kicker Text"
          value={(c.kicker as string) || ''}
          onChange={(v) => onContentUpdate({ kicker: v })}
          placeholder="OUR FEATURES · CHAPTER 01"
        />
        <p className="text-[9px] text-white/30 italic ml-1">
          Small accent-colored line shown above the heading.
        </p>
      </div>

      {/* ───────── HIGHLIGHT MODE ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Highlighted Word Style</h4>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'color',      label: 'Color',     icon: 'fa-font' },
            { value: 'background', label: 'Filled',    icon: 'fa-fill-drip' },
            { value: 'underline',  label: 'Underline', icon: 'fa-underline' },
          ] as const).map(opt => {
            const current = c.highlightMode || 'color';
            const active = current === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onContentUpdate({ highlightMode: opt.value })}
                className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                  active ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                         : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >
                <i className={`fa-solid ${opt.icon} text-sm`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────── ANIMATION ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reveal Animation</h4>
        <SelectInput
          label="Preset"
          value={(c.animation as string) || 'none'}
          options={[
            { label: 'None',          value: 'none' },
            { label: 'Fade Up',       value: 'fade-up' },
            { label: 'Slide Left',    value: 'slide-left' },
            { label: 'Slide Right',   value: 'slide-right' },
            { label: 'Blur In',       value: 'blur-in' },
            { label: 'Scale In',      value: 'scale-in' },
            { label: 'Typewriter',    value: 'typewriter' },
          ]}
          onChange={(v) => onContentUpdate({ animation: v })}
        />
        {c.animation && c.animation !== 'none' && (
          <RangeInput
            label="Delay (seconds)"
            value={Number(c.animationDelay) || 0}
            min={0} max={2} step={0.1}
            unit="s"
            onChange={(v) => onContentUpdate({ animationDelay: v })}
          />
        )}
      </div>
    </>
  );
};

interface TextContentFormProps {
  element: WebsiteElement;
  /** Latest section from siteData (has most recent content) */
  currentSection?: Section;
  /** Latest element from siteData (has most recent content) */
  currentElement?: WebsiteElement;
  onContentUpdate: (updates: Partial<WebsiteElement['content']>) => void;
  onStyleUpdate: (updates: Partial<WebsiteElement['style']>) => void;
}

const parseCssToPx = (val?: unknown): number => {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val !== 'string') return 16;
  const num = parseFloat(val);
  if (!Number.isFinite(num)) return 16;
  if (val.includes('rem')) return num * 16;
  if (val.includes('em')) return num * 16;
  if (val.includes('px')) return num;
  return num;
};

const parsePaddingYpx = (val?: unknown): number => {
  if (typeof val !== 'string' || val.trim() === '') return 10;
  const parts = val.trim().split(/\s+/);
  return parseCssToPx(parts[0]);
};

/**
 * Text content form. Fields:
 *   text-size preset (existing), marquee toggle + speed/direction/dimensions (existing)
 *   marqueePauseOnHover, marqueeEdgeFade  — NEW marquee polish
 *   animation, animationDelay              — NEW reveal-on-scroll
 */
export const TextContentForm: React.FC<TextContentFormProps> = ({
  element,
  currentSection,
  currentElement,
  onContentUpdate,
  onStyleUpdate,
}) => {
  const c = (currentElement?.content || element.content || {}) as any;
  let currentTextSize: 'base' | 'small' | 'large' | 'xl' | 'subheading' = 'base';

  if (element.id.includes('-hero-subtitle')) {
    if (currentSection && currentSection.content?.subtitleTextSize) {
      currentTextSize = currentSection.content.subtitleTextSize;
    } else {
      currentTextSize = element.content?.textSize || 'base';
    }
  } else {
    currentTextSize = (currentElement?.content?.textSize || element.content?.textSize || 'base') as 'base' | 'small' | 'large' | 'xl';
  }

  const currentEnableMarquee = Boolean(currentElement?.content?.enableMarquee ?? element.content?.enableMarquee ?? false);
  const currentMarqueeSpeed = (currentElement?.content?.marqueeSpeed || element.content?.marqueeSpeed || '4x') as '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
  const currentMarqueeDirection = (currentElement?.content?.marqueeDirection || element.content?.marqueeDirection || 'left') as 'left' | 'right';

  const currentMarqueeBgWidthPercent = (() => {
    const w = currentElement?.style?.width ?? element.style?.width;
    if (typeof w === 'string' && w.includes('%')) return Math.min(100, Math.max(70, parseFloat(w)));
    return 100;
  })();

  const currentMarqueeBgHeightPx = (() => {
    const h = currentElement?.style?.height ?? element.style?.height;
    if (typeof h === 'string' && h.includes('px')) {
      const n = parseCssToPx(h);
      if (Number.isFinite(n)) return Math.round(Math.min(140, Math.max(20, n)));
    }
    const fontPx = parseCssToPx((currentElement?.style?.fontSize ?? element.style?.fontSize) || '16px');
    const lhStr = currentElement?.style?.lineHeight ?? element.style?.lineHeight;
    const lhNum = typeof lhStr === 'string' && lhStr.includes('px') ? parseCssToPx(lhStr) / Math.max(1, fontPx) : parseFloat(String(lhStr));
    const multiplier = Number.isFinite(lhNum) ? lhNum : 1.25;
    const padY = parsePaddingYpx(currentElement?.style?.padding ?? element.style?.padding);
    const est = fontPx * multiplier + padY * 2;
    return Math.round(Math.min(140, Math.max(20, est)));
  })();

  return (
    <>
      <SelectInput
        key={`text-size-${element.id}-${currentTextSize}`}
        label="Text Size"
        value={currentTextSize}
        options={[
          { label: 'Base', value: 'base' },
          { label: 'Small', value: 'small' },
          { label: 'Large', value: 'large' },
          { label: 'XL', value: 'xl' },
        ]}
        onChange={(v) => {
          // Atomic: set preset + clear custom fontSize so DNA/stale overrides cannot win.
          onContentUpdate({ textSize: v as 'base' | 'small' | 'large' | 'xl', __clearFontSize: true } as any);
        }}
      />

      <div className="mt-3">
        <TextLimitControls content={c} onContentUpdate={(u) => onContentUpdate(u as any)} />
      </div>

      <div className="flex items-center justify-between mt-3">
        <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Enable Marquee</label>
        <input
          type="checkbox"
          checked={currentEnableMarquee}
          onChange={(e) => onContentUpdate({ enableMarquee: e.target.checked })}
        />
      </div>
      {currentEnableMarquee && (
        <>
          <SelectInput
            label="Marquee Speed"
            value={currentMarqueeSpeed}
            options={[
              { label: '1x (Slowest)', value: '1x' },
              { label: '2x', value: '2x' },
              { label: '3x', value: '3x' },
              { label: '4x', value: '4x' },
              { label: '5x', value: '5x' },
              { label: '6x', value: '6x' },
              { label: '7x', value: '7x' },
              { label: '8x', value: '8x' },
              { label: '9x', value: '9x' },
              { label: '10x (Fastest)', value: '10x' },
            ]}
            onChange={(v) => onContentUpdate({ marqueeSpeed: v as any })}
          />
          <SelectInput
            label="Marquee Direction"
            value={currentMarqueeDirection}
            options={[
              { label: 'Left', value: 'left' },
              { label: 'Right', value: 'right' },
            ]}
            onChange={(v) => onContentUpdate({ marqueeDirection: v as any })}
          />
          <RangeInput
            label="Marquee BG Width"
            value={currentMarqueeBgWidthPercent}
            min={70}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => onStyleUpdate({ width: `${v}%` })}
          />
          <RangeInput
            label="Marquee BG Height"
            value={currentMarqueeBgHeightPx}
            min={20}
            max={140}
            step={2}
            unit="px"
            onChange={(v) => onStyleUpdate({ height: `${v}px` })}
          />

          {/* Marquee polish: hover pause + edge fade */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {([
              { key: 'marqueePauseOnHover', label: 'Pause on Hover', icon: 'fa-pause' },
              { key: 'marqueeEdgeFade',     label: 'Edge Fade',      icon: 'fa-grip-lines-vertical' },
            ] as const).map(opt => {
              const active = !!c[opt.key];
              return (
                <button
                  key={opt.key}
                  onClick={() => onContentUpdate({ [opt.key]: !active } as any)}
                  className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-1.5 ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${opt.icon}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ───────── REVEAL ANIMATION ───────── */}
      <div className="pt-4 mt-2 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reveal Animation</h4>
        <SelectInput
          label="Preset"
          value={(c.animation as string) || 'none'}
          options={[
            { label: 'None',          value: 'none' },
            { label: 'Fade Up',       value: 'fade-up' },
            { label: 'Slide Left',    value: 'slide-left' },
            { label: 'Slide Right',   value: 'slide-right' },
            { label: 'Blur In',       value: 'blur-in' },
            { label: 'Scale In',      value: 'scale-in' },
            { label: 'Typewriter',    value: 'typewriter' },
          ]}
          onChange={(v) => onContentUpdate({ animation: v } as any)}
        />
        {c.animation && c.animation !== 'none' && (
          <RangeInput
            label="Delay (seconds)"
            value={Number(c.animationDelay) || 0}
            min={0} max={2} step={0.1}
            unit="s"
            onChange={(v) => onContentUpdate({ animationDelay: v } as any)}
          />
        )}
      </div>
    </>
  );
};
