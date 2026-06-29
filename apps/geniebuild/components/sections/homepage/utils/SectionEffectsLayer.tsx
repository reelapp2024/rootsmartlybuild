import React from 'react';
import { motion } from 'motion/react';

/**
 * Section-level decorative effects: animated background shapes + top/bottom
 * dividers (slant / curve / wave / triangle). Used by `SectionRenderer` so
 * EVERY section type gets these features for free.
 *
 * Theme prop is the resolved global theme (passed from SectionRenderer's
 * `getActiveGlobalTheme()` call). Uses theme.accent / theme.primaryButton.bg
 * etc. for color cues, falling back to neutral defaults.
 */
interface SectionEffectsLayerProps {
  styles: any;
  theme: any;
}

const speedToDuration = (speed?: string): number =>
  speed === 'slow' ? 25 : speed === 'fast' ? 8 : 15;

/** Animated decorative shapes layered behind section content. */
const BackgroundShapes: React.FC<SectionEffectsLayerProps> = ({ styles, theme }) => {
  if (!styles?.enableBackgroundShapes) return null;

  const shapeType: string = styles.backgroundShapeType || 'circles';
  const isAnimated: boolean = styles.enableBackgroundAnimation ?? true;
  const duration = speedToDuration(styles.backgroundAnimationSpeed);

  const accentColor    = theme?.accent || theme?.accentColor || '#E11D48';
  const primaryColor   = theme?.primaryButton?.bg || theme?.buttonBackgroundColor || accentColor;
  const ringColor      = theme?.ring || theme?.borderColor || primaryColor;
  const headingColor   = theme?.heading || theme?.titleColor || '#F8FAFC';

  if (shapeType === 'circles') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-[10%] -left-[10%] w-[40%] aspect-square rounded-full opacity-20 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${primaryColor} 0%, ${primaryColor}80 50%, transparent 100%)` }}
          animate={isAnimated ? { x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] } : {}}
          transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[20%] -right-[15%] w-[50%] aspect-square rounded-full opacity-15 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, ${accentColor}80 50%, transparent 100%)` }}
          animate={isAnimated ? { x: [0, -60, 0], y: [0, 80, 0], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: duration * 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-[15%] left-[20%] w-[35%] aspect-square rounded-full opacity-10 blur-[80px]"
          style={{ background: `radial-gradient(circle, ${ringColor} 0%, ${ringColor}80 50%, transparent 100%)` }}
          animate={isAnimated ? { x: [0, 40, 0], y: [0, -30, 0], opacity: [0.1, 0.2, 0.1] } : {}}
          transition={{ duration: duration * 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    );
  }

  if (shapeType === 'blobs') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute top-[-15%] right-[-10%] w-[60%] aspect-square opacity-20 blur-[100px]"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          }}
          animate={isAnimated ? {
            borderRadius: [
              '60% 40% 30% 70% / 60% 30% 70% 40%',
              '30% 60% 70% 30% / 50% 60% 30% 60%',
              '60% 40% 30% 70% / 60% 30% 70% 40%',
            ],
            rotate: [0, 45, 0],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: duration * 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-15%] w-[50%] aspect-square opacity-15 blur-[100px]"
          style={{
            background: `linear-gradient(225deg, ${accentColor} 0%, ${primaryColor} 100%)`,
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          }}
          animate={isAnimated ? {
            borderRadius: [
              '30% 70% 70% 30% / 30% 30% 70% 70%',
              '70% 30% 30% 70% / 60% 70% 30% 40%',
              '30% 70% 70% 30% / 30% 30% 70% 70%',
            ],
            rotate: [0, -30, 0],
            scale: [1, 1.2, 1],
          } : {}}
          transition={{ duration: duration * 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    );
  }

  if (shapeType === 'geometric') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.08]">
          <motion.div
            className="absolute top-[15%] left-[15%] w-[15%] aspect-square border rounded-2xl"
            style={{ borderColor: `${primaryColor}66` }}
            animate={isAnimated ? { rotate: 360, x: [0, 30, 0], y: [0, 20, 0] } : {}}
            transition={{ duration, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-[45%] right-[20%] w-[20%] aspect-square border rounded-full"
            style={{ borderColor: `${accentColor}66` }}
            animate={isAnimated ? { scale: [1, 1.15, 1], x: [0, -30, 0] } : {}}
            transition={{ duration: duration * 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[25%] left-[25%] w-[10%] aspect-square border rotate-45"
            style={{ borderColor: `${ringColor}66` }}
            animate={isAnimated ? { rotate: -360, scale: [1, 1.1, 1] } : {}}
            transition={{ duration: duration * 1.7, repeat: Infinity, ease: 'linear' }}
          />
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                top: `${15 + ((i * 17) % 70)}%`,
                left: `${10 + ((i * 23) % 80)}%`,
                backgroundColor: `${headingColor}4D`,
              }}
              animate={isAnimated ? {
                y: [0, -80, 0],
                opacity: [0, 0.8, 0],
                scale: [0, 1.2, 0],
              } : {}}
              transition={{
                duration: duration * (0.6 + ((i * 0.07) % 0.4)),
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

/** Top OR bottom divider — SVG shape clipped to section edge. */
const SectionDivider: React.FC<{
  styles: any;
  position: 'top' | 'bottom';
}> = ({ styles, position }) => {
  const shape = position === 'top' ? styles?.topDividerShape : styles?.bottomDividerShape;
  if (!shape || shape === 'none') return null;

  const height = (position === 'top' ? styles.topDividerHeight : styles.bottomDividerHeight) || 100;
  const color  = (position === 'top' ? styles.topDividerColor  : styles.bottomDividerColor)  || 'currentColor';

  const isTop = position === 'top';
  const containerClasses = `absolute left-0 right-0 z-20 pointer-events-none ${isTop ? 'top-0' : 'bottom-0'}`;
  const svgClasses = `w-full block ${isTop ? '' : 'rotate-180'}`;

  return (
    <div className={containerClasses} style={{ height: `${height}px` }}>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={svgClasses}
           style={{ height: '100%', fill: color }}>
        {shape === 'slant' && <path d="M1200 120L0 120L0 0Z" />}
        {shape === 'curve' && <path d="M0 0 C 400 120 800 120 1200 0 L 1200 120 L 0 120 Z" />}
        {shape === 'wave' && <path d="M0 0 C 300 120 600 -120 1200 0 L 1200 120 L 0 120 Z" />}
        {shape === 'triangle' && <path d="M600 0 L 1200 120 L 0 120 Z" />}
      </svg>
    </div>
  );
};

/** Top-level wrapper — renders both shapes + dividers for any section. */
export const SectionEffectsLayer: React.FC<SectionEffectsLayerProps> = ({ styles, theme }) => {
  // Skip entire layer if neither feature is in use (cheap render)
  const hasShapes = !!styles?.enableBackgroundShapes;
  const hasTopDiv = !!(styles?.topDividerShape && styles.topDividerShape !== 'none');
  const hasBotDiv = !!(styles?.bottomDividerShape && styles.bottomDividerShape !== 'none');
  if (!hasShapes && !hasTopDiv && !hasBotDiv) return null;

  return (
    <>
      {hasShapes && <BackgroundShapes styles={styles} theme={theme} />}
      {hasTopDiv && <SectionDivider styles={styles} position="top" />}
      {hasBotDiv && <SectionDivider styles={styles} position="bottom" />}
    </>
  );
};
