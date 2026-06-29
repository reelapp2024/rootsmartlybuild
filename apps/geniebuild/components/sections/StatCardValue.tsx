import React from 'react';
import { useCountUp, formatCountUpValue, parseCountUpTarget } from '../builder/state/useCountUp';

interface StatCardValueProps {
  /** Raw user-entered value, e.g. "500+", "99%", "2.4K". */
  raw: string;
  /** Disable animation while editor is live (otherwise counting up
   *  while user is typing looks broken). */
  readOnly: boolean;
  color: string;
  className?: string;
  onBlur?: (value: string) => void;
}

/**
 * Animated number display for <StatCard>: counts up from 0 → target over
 * 1.6s with ease-out, waiting until scrolled into view. While in the
 * builder's edit mode (readOnly=false), shows the static raw value so
 * typing into it feels natural.
 */
export const StatCardValue: React.FC<StatCardValueProps> = ({ raw, readOnly, color, className, onBlur }) => {
  const target = parseCountUpTarget(raw);
  // Only animate on the public/preview side. In edit mode the contentEditable
  // flow + animated updates conflict — show the raw value instead.
  const animate = readOnly && target > 0;
  const [value, ref] = useCountUp({ target, enabled: animate, triggerOnView: true, duration: 1600 });

  const display = animate ? formatCountUpValue(value, raw) : raw;

  return (
    <div
      ref={ref}
      className={className}
      style={{ color }}
      contentEditable={!readOnly}
      suppressContentEditableWarning={!readOnly}
      onBlur={!readOnly && onBlur ? (e) => onBlur(e.currentTarget.innerHTML) : undefined}
      // Use text node (not dangerouslySetInnerHTML) for the animated state so
      // React can swap the content cleanly every frame; fall back to HTML
      // payload when editable so user rich-text (if any) is preserved.
      {...(animate
        ? { children: display }
        : { dangerouslySetInnerHTML: { __html: raw || '0' } })}
    />
  );
};
