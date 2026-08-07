import type { WebsiteElement } from '../../types';

/** Structural DNA for heading — no color keys (theme owns color). */
export const HEADING_DNA_STYLE: Record<string, any> = {
  fontWeight: '700',
  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
  textAlign: 'left',
};

export const HEADING_DNA_CONTENT = {
  text: 'Your heading',
  htmlTag: 'h2' as const,
};

export function headingDna(
  partial: Partial<WebsiteElement> & { id: string }
): WebsiteElement {
  return {
    id: partial.id,
    type: 'heading',
    content: { ...HEADING_DNA_CONTENT, ...(partial.content as any) },
    style: { ...HEADING_DNA_STYLE, ...(partial.style as any) },
    settings: partial.settings || {},
  };
}
