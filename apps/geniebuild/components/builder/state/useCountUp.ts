import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  /** Target number to count to. */
  target: number;
  /** Animation duration in ms. */
  duration?: number;
  /** When true, waits for element to scroll into view before starting. */
  triggerOnView?: boolean;
  /** When false, skips animation entirely (returns target immediately). Useful
   *  for edit-time to keep input stable and avoid distracting the user. */
  enabled?: boolean;
}

/**
 * Animates a number from 0 → target with ease-out over `duration` ms.
 * Returns [currentValue, refToAttach].
 *
 * When `triggerOnView` is true (default), the animation waits until the
 * element scrolls into the viewport — matches user intent of "count up when
 * user sees this stat".
 */
export function useCountUp({
  target,
  duration = 1600,
  triggerOnView = true,
  enabled = true,
}: UseCountUpOptions): [number, React.RefObject<HTMLDivElement | null>] {
  const [value, setValue] = useState<number>(enabled ? 0 : target);
  const ref = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      const from = 0;
      const to = target;
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setValue(to);
      };
      requestAnimationFrame(tick);
    };

    if (!triggerOnView) {
      run();
      return;
    }

    const el = ref.current;
    if (!el) {
      // Element not mounted — start anyway after a short delay
      const t = setTimeout(run, 100);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
          break;
        }
      }
    }, { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
    // Re-run when target changes (e.g. user edits the number)
  }, [target, duration, triggerOnView, enabled]);

  return [value, ref];
}

/**
 * Formats a number respecting the original string's formatting hints:
 * - If raw included "%" → appends %
 * - If raw included "+" → appends +
 * - If raw included "K"/"k" → divides by 1000 + K suffix
 * - If raw included "M"/"m" → divides by 1_000_000 + M suffix
 * Otherwise uses locale thousands separators.
 */
/**
 * True only when a value is a *pure* count-up number: optional minus, digits
 * (with commas / one decimal), then optionally ONE magnitude/format suffix
 * (K, M, %, +). Anything else — "6AM", "7PM", "10km", "4.9/5", "Open 24/7",
 * "$29" — is NOT eligible and must render as-is with no animation. This is what
 * fixes "6AM" animating to "6.0M" (the "M" in "AM" was read as millions).
 */
export function isCountUpEligible(raw: unknown): boolean {
  if (typeof raw === 'number') return Number.isFinite(raw);
  const s = String(raw || '').trim();
  if (!s) return false;
  return /^-?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*[kKmM]?[%+]?$/.test(s)
      || /^-?\d+(?:\.\d+)?\s*[kKmM]?[%+]?$/.test(s);
}

export function formatCountUpValue(current: number, originalText: string): string {
  const raw = String(originalText || '').trim();
  // Non-numeric / non-unit values (times, ratios, prices) are shown verbatim.
  if (!isCountUpEligible(raw)) return raw;
  const hasPercent = raw.endsWith('%');
  const hasPlus = raw.endsWith('+');
  const hasK = /[kK]$/.test(raw.replace(/[+%]$/, ''));
  const hasM = /[mM]$/.test(raw.replace(/[+%]$/, ''));

  let n = current;
  let suffix = '';
  if (hasPercent) suffix = '%';
  else if (hasK) { n = n / 1000; suffix = 'K'; }
  else if (hasM) { n = n / 1_000_000; suffix = 'M'; }
  if (hasPlus) suffix = suffix + '+';

  // Show 1 decimal if K/M to preserve precision; integer otherwise
  const rounded = (hasK || hasM) && n < 10
    ? n.toFixed(1)
    : Math.round(n).toLocaleString();

  return `${rounded}${suffix}`;
}

/**
 * Extracts a numeric target from a content value like "500+", "99%", "2.4K".
 */
export function parseCountUpTarget(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  const s = String(raw || '').trim();
  if (!s) return 0;
  // Only parse values that are genuinely count-up numbers; everything else
  // returns NaN so the caller can skip the animation and render raw text.
  if (!isCountUpEligible(s)) return NaN;
  const cleaned = s.replace(/[,\s]/g, '');
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)([kKmM])?/);
  if (!match) return NaN;
  const n = parseFloat(match[1]);
  const mult = match[2] ? (match[2].toLowerCase() === 'k' ? 1000 : 1_000_000) : 1;
  return n * mult;
}
