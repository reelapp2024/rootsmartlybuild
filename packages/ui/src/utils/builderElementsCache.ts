/**
 * Builder elements list - generated from elementPropertiesRegistry (single source of truth)
 * No API calls - simple and fast
 */

// Import from builder package
import { getBuilderElementsList } from '@builder/core';
import type { BuilderElement } from '@builder/core';

/**
 * Get builder elements - generated from registry instantly
 * No API calls, no caching, simple and fast
 * Single source of truth: elementPropertiesRegistry
 * @returns Promise<BuilderElement[]> Array of builder elements
 */
export function getBuilderElements(): Promise<BuilderElement[]> {
  return Promise.resolve(getBuilderElementsList());
}

// Re-export BuilderElement type for convenience
export type { BuilderElement };

/**
 * Clear the builder elements cache (no-op, kept for compatibility)
 */
export function clearBuilderElementsCache(): void {
  // No-op: no cache to clear
}
