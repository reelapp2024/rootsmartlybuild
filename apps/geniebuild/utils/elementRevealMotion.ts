import type React from 'react';

export type RevealAnimVariant = {
  initial: Record<string, unknown>;
  animate: Record<string, unknown>;
  transition?: Record<string, unknown>;
};

/** Shared reveal presets (heading / text / image). */
export const REVEAL_ANIM_VARIANTS: Record<string, RevealAnimVariant> = {
  none: { initial: {}, animate: {} },
  'fade-up': { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  'slide-left': { initial: { opacity: 0, x: -28 }, animate: { opacity: 1, x: 0 } },
  'slide-right': { initial: { opacity: 0, x: 28 }, animate: { opacity: 1, x: 0 } },
  'blur-in': { initial: { opacity: 0, filter: 'blur(6px)' }, animate: { opacity: 1, filter: 'blur(0px)' } },
  'scale-in': { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } },
  typewriter: {
    initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
    animate: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
  },
  zoom: { initial: { opacity: 0, scale: 1.1 }, animate: { opacity: 1, scale: 1 } },
};

/** Button / CTA presets (includes pulse). */
export const REVEAL_BUTTON_ANIM_VARIANTS: Record<string, RevealAnimVariant> = {
  none: { initial: {}, animate: {} },
  'fade-up': { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } },
  'slide-left': { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 } },
  'slide-right': { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 } },
  'scale-in': { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 } },
  pulse: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
};

type RevealMotionProps = {
  key: string;
  enabled: boolean;
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  whileInView?: Record<string, unknown>;
  viewport?: { once?: boolean; margin?: string };
  transition?: Record<string, unknown>;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Builder: `animate` on mount so every sidebar change (key remount) replays the motion.
 * Live site: `whileInView` once (pulse repeats).
 */
export function buildRevealAnimatedDivProps(opts: {
  elementId: string;
  readOnly: boolean;
  preset: string;
  delay?: number;
  variant: RevealAnimVariant;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}): RevealMotionProps {
  const delay = Number(opts.delay) || 0;
  const key = `${opts.elementId}-reveal-${opts.preset}-${delay}`;
  const transition =
    opts.variant.transition ??
    ({
      duration: opts.duration ?? (opts.preset === 'pulse' ? 1.6 : 0.65),
      delay,
      ease: [0.16, 1, 0.3, 1],
      ...(opts.preset === 'pulse' ? { repeat: Infinity, ease: 'easeInOut' } : {}),
    } as Record<string, unknown>);

  const base: RevealMotionProps = {
    key,
    enabled: !opts.readOnly,
    initial: opts.variant.initial,
    transition,
    className: opts.className,
    style: opts.style ?? { display: 'block' },
  };

  if (!opts.readOnly) {
    return { ...base, animate: opts.variant.animate };
  }

  return {
    ...base,
    whileInView: opts.variant.animate,
    viewport: { once: opts.preset !== 'pulse', margin: '-50px' },
  };
}
