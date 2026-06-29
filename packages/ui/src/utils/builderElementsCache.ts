export type BuilderElement = Record<string, unknown>;

/**
 * Smartbuilder is deprecated. This helper now intentionally returns no elements.
 */
export function getBuilderElements(): Promise<BuilderElement[]> {
  return Promise.resolve([]);
}

export function clearBuilderElementsCache(): void {
  // no-op
}
