import type { WebsiteElement } from '../../../types';
import {
  AboutUsContact,
  inferElementContactKind,
  resolveElementContactContent,
} from '../../../lib/contactResolver';
import { resolveHeadingHtmlTag } from '../../../utils/htmlTagUtils';

/**
 * Merges live section.content values onto an element so saved element copy
 * does not override dynamic About Us / project fields.
 */
export function mergeDynamicElement(
  existing: WebsiteElement | undefined,
  id: string,
  type: WebsiteElement['type'],
  content: Record<string, unknown>,
  style?: Record<string, unknown>,
  aboutUs?: AboutUsContact | null
): WebsiteElement {
  let mergedContent = { ...content };
  const probe = { id, content: mergedContent };
  const kind = inferElementContactKind(probe);
  if (kind && aboutUs) {
    const base = {
      ...(existing?.content as Record<string, unknown>),
      ...mergedContent,
      contactKind: kind,
      contactSource: (mergedContent.contactSource as string) || (existing?.content as any)?.contactSource || 'about_primary',
    };
    mergedContent = resolveElementContactContent(base, kind, aboutUs);
  }

  if (typeof mergedContent.htmlTag === 'string') {
    mergedContent.htmlTag = resolveHeadingHtmlTag(
      mergedContent.htmlTag,
      type === 'heading' ? 'h2' : 'div'
    );
  }

  if (existing) {
    const existingContent = { ...(existing.content as Record<string, unknown>), ...mergedContent };
    if (typeof existingContent.htmlTag === 'string') {
      existingContent.htmlTag = resolveHeadingHtmlTag(
        existingContent.htmlTag,
        type === 'heading' ? 'h2' : 'div'
      );
    }
    return {
      ...existing,
      content: existingContent,
    };
  }
  return {
    id,
    type,
    content: mergedContent,
    style: (style || {}) as WebsiteElement['style'],
  } as WebsiteElement;
}
