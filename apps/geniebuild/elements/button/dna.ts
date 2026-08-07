import type { WebsiteElement } from '../../types';

export const BUTTON_DNA_STYLE: Record<string, any> = {
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: '600',
};

export const BUTTON_DNA_CONTENT = {
  text: 'Button',
  link: '#',
};

export const CTA_BUTTON_DNA_STYLE: Record<string, any> = {
  buttonVariant: 'primary',
  padding: '0 1.75rem',
  height: '3rem',
  borderRadius: '0.6rem',
  fontWeight: '600',
};

export const CTA_BUTTON_DNA_CONTENT = {
  text: 'Get started',
  link: '#',
  buttonVariant: 'primary',
};

export function buttonDna(
  partial: Partial<WebsiteElement> & { id: string }
): WebsiteElement {
  return {
    id: partial.id,
    type: 'button',
    content: { ...BUTTON_DNA_CONTENT, ...(partial.content as any) },
    style: { ...BUTTON_DNA_STYLE, ...(partial.style as any) },
    settings: partial.settings || {},
  };
}

export function ctaButtonDna(
  partial: Partial<WebsiteElement> & { id: string }
): WebsiteElement {
  return {
    id: partial.id,
    type: 'cta-button',
    content: { ...CTA_BUTTON_DNA_CONTENT, ...(partial.content as any) },
    style: { ...CTA_BUTTON_DNA_STYLE, ...(partial.style as any) },
    settings: partial.settings || {},
  };
}
