import type { WebsiteElement } from '../../types';

export const TEXT_DNA_STYLE: Record<string, any> = {
  textAlign: 'left',
  lineHeight: '1.7',
};

export const TEXT_DNA_CONTENT = {
  text: 'Add your text here. Click to edit.',
  textSize: 'base' as const,
};

export function textDna(
  partial: Partial<WebsiteElement> & { id: string }
): WebsiteElement {
  return {
    id: partial.id,
    type: 'text',
    content: { ...TEXT_DNA_CONTENT, ...(partial.content as any) },
    style: { ...TEXT_DNA_STYLE, ...(partial.style as any) },
    settings: partial.settings || {},
  };
}
