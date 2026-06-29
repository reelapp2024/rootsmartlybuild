import { useEffect, useState } from 'react';

export type ViewportBreakpoint = 'desktop' | 'tablet' | 'mobile';

const TABLET_MAX = 1023;
const MOBILE_MAX = 767;

function compute(width: number): ViewportBreakpoint {
  if (width <= MOBILE_MAX) return 'mobile';
  if (width <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

/**
 * Returns the current viewport breakpoint, updating on window resize.
 * During SSR / before hydration, returns 'desktop'.
 */
export function useViewportBreakpoint(): ViewportBreakpoint {
  const [bp, setBp] = useState<ViewportBreakpoint>(() =>
    typeof window === 'undefined' ? 'desktop' : compute(window.innerWidth)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setBp(compute(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}
