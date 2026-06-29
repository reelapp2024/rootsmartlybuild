import { createContext, useContext } from 'react';
import type { GlobalElementStyles } from '../../../types';

/**
 * Context that exposes the user's site-wide element style overrides to
 * every component down the tree. Wraps the editor canvas + the published
 * site renderer so element renders can read it without prop-drilling.
 *
 * Resolution order in renders:
 *   element.style → bulk section style → globalElementStyles → theme tokens → defaults
 */
export const GlobalElementStylesContext = createContext<GlobalElementStyles | undefined>(undefined);

export function useGlobalElementStyles(): GlobalElementStyles | undefined {
  return useContext(GlobalElementStylesContext);
}

/**
 * Convenience helper — pluck the per-type sub-object, returning {} when
 * no globals are set (so callers can spread without null-guards).
 */
export function useGlobalElementStyleFor<K extends keyof GlobalElementStyles>(
  type: K,
): NonNullable<GlobalElementStyles[K]> {
  const all = useGlobalElementStyles();
  return (all?.[type] || {}) as NonNullable<GlobalElementStyles[K]>;
}
