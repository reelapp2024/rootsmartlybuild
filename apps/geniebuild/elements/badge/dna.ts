import type { WebsiteElement } from '../../types';

export const BADGE_DNA_STYLE: Record<string, any> = {
  fontSize: '0.72rem',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '6px 14px',
  borderRadius: '9999px',
};

export const BADGE_DNA_CONTENT = {
  text: 'Badge',
  iconPosition: 'left' as const,
};

export function badgeDna(
  partial: Partial<WebsiteElement> & { id: string }
): WebsiteElement {
  return {
    id: partial.id,
    type: 'badge',
    content: { ...BADGE_DNA_CONTENT, ...(partial.content as any) },
    style: { ...BADGE_DNA_STYLE, ...(partial.style as any) },
    settings: partial.settings || {},
  };
}
