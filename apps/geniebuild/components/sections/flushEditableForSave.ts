import type { WebsiteData, WebsiteElement } from '../../types';
import { applyUpdateElement, composeHeadingPlainText } from '../builder/state/sectionUpdaters';
import {
  plainTextFromHtml,
  splitHeadingToHighlightParts,
} from '../../utils/resolveElementTypography';
import {
  collectPendingEditableHtml,
  getEditableNode,
} from './editableHtmlHelpers';

/** Find which section owns an element id (including virtual `${sectionId}-…` ids). */
export function findSectionIdForElement(
  siteData: WebsiteData,
  elementId: string
): string | null {
  const lists = [
    ...(siteData.sections || []),
    ...(siteData.globalSections || []),
  ];
  for (const section of lists) {
    if (section.elements?.some((e) => e.id === elementId)) return section.id;
  }
  for (const section of lists) {
    const sid = String(section.id || '');
    if (sid && elementId.startsWith(`${sid}-`)) return sid;
  }
  return null;
}

function isHeadingElement(
  siteData: WebsiteData,
  sectionId: string,
  elementId: string
): boolean {
  const section =
    siteData.sections?.find((s) => s.id === sectionId) ||
    siteData.globalSections?.find((s) => s.id === sectionId);
  const el = section?.elements?.find((e) => e.id === elementId);
  if (el?.type === 'heading') return true;
  const node = getEditableNode(elementId);
  if (node?.getAttribute('data-gb-heading-id')) return true;
  return /-(title|name|heading)$/i.test(elementId) || elementId.includes('-hero-title');
}

/**
 * Synchronously fold in-progress contentEditable DOM into siteData BEFORE save.
 * React setState from blur/onInput is async — without this, save persists stale text.
 */
export function commitPendingEditablesToSiteData(siteData: WebsiteData): WebsiteData {
  const htmlById = collectPendingEditableHtml();
  if (!htmlById.size) return siteData;

  let next = siteData;
  htmlById.forEach((html, elementId) => {
    const sectionId = findSectionIdForElement(next, elementId);
    if (!sectionId) return;

    const section =
      next.sections?.find((s) => s.id === sectionId) ||
      next.globalSections?.find((s) => s.id === sectionId);
    const existing = section?.elements?.find((e) => e.id === elementId);
    const heading = isHeadingElement(next, sectionId, elementId);

    let content: Partial<WebsiteElement['content']>;
    if (heading) {
      const parts = splitHeadingToHighlightParts(html);
      content = {
        ...(existing?.content || {}),
        text: parts.text,
        textBefore: parts.textBefore,
        highlightedText: parts.highlightedText,
        textAfter: parts.textAfter,
      };
    } else {
      const plain = plainTextFromHtml(html, { trim: true });
      content = {
        ...(existing?.content || {}),
        text: plain,
      };
    }

    // Seed virtual element when missing so applyUpdateElement can materialize it.
    const seed: WebsiteElement | null = existing
      ? null
      : {
          id: elementId,
          type: heading ? 'heading' : 'text',
          content: content as WebsiteElement['content'],
          style: {},
        };

    next = applyUpdateElement(
      next,
      sectionId,
      elementId,
      {
        type: (existing?.type || seed?.type || (heading ? 'heading' : 'text')) as WebsiteElement['type'],
        content,
      },
      seed
    );

    // Ensure composed heading text is present for SectionContent upserts.
    if (heading) {
      const plain = composeHeadingPlainText(content as Record<string, unknown>);
      if (plain) {
        const sec =
          next.sections?.find((s) => s.id === sectionId) ||
          next.globalSections?.find((s) => s.id === sectionId);
        const el = sec?.elements?.find((e) => e.id === elementId);
        if (el && !(el.content as any)?.text) {
          next = applyUpdateElement(
            next,
            sectionId,
            elementId,
            { content: { ...(el.content || {}), text: plain } },
            null
          );
        }
      }
    }
  });

  return next;
}
