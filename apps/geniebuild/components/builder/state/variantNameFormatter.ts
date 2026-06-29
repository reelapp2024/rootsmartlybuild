/**
 * Strip the section-type prefix from a variant id and convert the
 * remaining camelCase into human-readable Title Case.
 * Example: ('HeroCenter', 'hero') -> 'Center'
 *          ('HeroGeometric', 'hero') -> 'Geometric'
 */
export function formatVariantName(
  variant: string | undefined,
  sectionType: string | undefined
): string | null {
  if (!variant) return null;

  const sectionTypeCapitalized = sectionType
    ? sectionType.charAt(0).toUpperCase() + sectionType.slice(1)
    : '';
  let formatted = variant;

  if (variant.startsWith(sectionTypeCapitalized)) {
    formatted = variant.slice(sectionTypeCapitalized.length);
  }

  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return formatted;
}
