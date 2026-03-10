/**
 * Get theme typography values for an element type
 * Reads from theme settings (DB) and returns resolved typography defaults
 */
export function getThemeTypography(
  theme: any,
  elementType: string,
  elementTag?: string
): {
  fontFamily?: string;
  fontSize?: string;
  color?: string;
} {
  if (!theme) return {};

  // FONT FAMILY
  const fontFamily =
    theme.defaultFont ||
    theme.customColors?.fontFamily ||
    undefined;

  // FONT SIZE RESOLUTION
  let fontSize: string | undefined;

  if (elementType === 'heading') {
    const headingKey = elementTag || 'h2';
    // Map h1-h6 to headingSizes keys
    const sizeKey = headingKey.toLowerCase();
    fontSize =
      theme.customColors?.headingSizes?.[sizeKey] ||
      theme.defaultStyles?.find((s: any) => s.tag === sizeKey)?.fontSize ||
      undefined;
  } else if (elementType === 'text') {
    fontSize =
      theme.customColors?.textSizes?.base ||
      theme.defaultStyles?.find((s: any) => s.tag === 'text-base')?.fontSize ||
      undefined;
  } else if (elementType === 'button') {
    fontSize =
      theme.customColors?.buttonSizes?.fontSize ||
      undefined;
  }

  // COLOR
  let color: string | undefined;
  if (elementType === 'heading') {
    color = theme.customColors?.heading || undefined;
  } else if (elementType === 'text') {
    color = theme.customColors?.description || undefined;
  } else if (elementType === 'button') {
    color = theme.customColors?.buttonText || theme.primaryButton?.text || undefined;
  }

  return {
    fontFamily,
    fontSize,
    color,
  };
}
