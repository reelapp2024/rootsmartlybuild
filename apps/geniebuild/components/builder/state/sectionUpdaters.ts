import { WebsiteData, Section, WebsiteElement } from '../../../types';

/** Convert rgb/rgba string to hex #RRGGBB so saved colors are stable. */
export const colorToHex = (val: string | undefined): string | undefined => {
  if (!val || typeof val !== 'string' || val.startsWith('#')) return val;
  const m = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/);
  if (!m) return val;
  const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
  const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
  const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

/**
 * Plain text for a heading element — prefer structured parts from the sidebar
 * (textBefore / highlightedText / textAfter), else fall back to `text`.
 */
export function composeHeadingPlainText(content: Record<string, unknown> | null | undefined): string {
  if (!content || typeof content !== 'object') return '';
  const hasParts =
    Object.prototype.hasOwnProperty.call(content, 'textBefore') ||
    Object.prototype.hasOwnProperty.call(content, 'highlightedText') ||
    Object.prototype.hasOwnProperty.call(content, 'textAfter');
  if (hasParts) {
    return [content.textBefore, content.highlightedText, content.textAfter]
      .map((p) => String(p || '').trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return String(content.text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Merge content patches; keep heading `text` aligned with 3-part fields. */
export function mergeElementContent(
  prevContent: WebsiteElement['content'] | undefined,
  patch: Partial<WebsiteElement['content']> | undefined,
  elementType?: string,
): WebsiteElement['content'] {
  const merged: any = { ...(prevContent || {}), ...(patch || {}) };
  const touchesHeadingParts =
    patch &&
    (Object.prototype.hasOwnProperty.call(patch, 'textBefore') ||
      Object.prototype.hasOwnProperty.call(patch, 'highlightedText') ||
      Object.prototype.hasOwnProperty.call(patch, 'textAfter') ||
      Object.prototype.hasOwnProperty.call(patch, 'text'));
  if (elementType === 'heading' || touchesHeadingParts) {
    const plain = composeHeadingPlainText(merged);
    if (plain) merged.text = plain;
  }
  return merged;
}

/**
 * Merge or replace a style object on an element update.
 * Empty object `{}` means "clean all styles" (full replace), not a no-op merge.
 */
export function resolveStyleFieldUpdate(
  existing: Record<string, any> | undefined,
  patch: Record<string, any> | undefined,
  fieldProvided: boolean,
): Record<string, any> | undefined {
  if (!fieldProvided) return existing;
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return {};
  if (Object.keys(patch).length === 0) return {};
  return { ...(existing || {}), ...patch };
}

/** Pure reducer: merge section-level updates into siteData. */
export const applyUpdateSection = (
  prev: WebsiteData,
  id: string,
  updates: Partial<Section>,
): WebsiteData => {
  // If the id matches a global section (navbar/footer), update that instead.
  const inGlobal = prev.globalSections?.some(s => s.id === id);
  if (inGlobal) {
    return {
      ...prev,
      globalSections: prev.globalSections!.map(s => s.id === id ? { ...s, ...updates } as Section : s),
    };
  }
  return {
    ...prev,
    sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } as Section : s),
  };
};

/**
 * Pure reducer: merge element updates into a section.
 * Handles:
 *  - Standard update for existing element
 *  - Universal upsert: first edit on a virtual (hydrated) element
 *  - Sync to content.items when elementId targets an item
 *  - Sync virtual title/subtitle/description/button/image back to section content/styles
 */
export const applyUpdateElement = (
  prev: WebsiteData,
  sectionId: string,
  elementId: string,
  updates: Partial<WebsiteElement>,
  selectedVirtualElement: WebsiteElement | null,
): WebsiteData => {
  // If the target section is a global section, route the edit there.
  const isGlobal = prev.globalSections?.some(s => s.id === sectionId);
  const sectionList = isGlobal ? (prev.globalSections || []) : prev.sections;
  const mappedSections = sectionList.map(s => {
    if (s.id !== sectionId) return s;

    const existingElementIndex = s.elements?.findIndex(e => e.id === elementId) ?? -1;

    const COLOR_STYLE_KEYS = ['backgroundColor', 'color', 'titleColor', 'borderColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'borderBottomColor'];
    const normalizeStyle = (style: Record<string, any> | undefined) => {
      if (!style) return style;
      const out = { ...style };
      COLOR_STYLE_KEYS.forEach(k => {
        if (typeof out[k] === 'string' && /^rgba?\(/i.test(out[k])) {
          const hex = colorToHex(out[k]);
          if (hex) out[k] = hex;
        }
      });
      return out;
    };

    let updatedSection = s;
    if (existingElementIndex >= 0) {
      const newElements = [...(s.elements || [])];
      const prev = newElements[existingElementIndex];
      const nextStyle = resolveStyleFieldUpdate(
        prev.style as Record<string, any> | undefined,
        updates.style as Record<string, any> | undefined,
        'style' in updates,
      );
      const nextTabletStyle = resolveStyleFieldUpdate(
        prev.tabletStyle as Record<string, any> | undefined,
        updates.tabletStyle as Record<string, any> | undefined,
        'tabletStyle' in updates,
      );
      const nextMobileStyle = resolveStyleFieldUpdate(
        prev.mobileStyle as Record<string, any> | undefined,
        updates.mobileStyle as Record<string, any> | undefined,
        'mobileStyle' in updates,
      );
      newElements[existingElementIndex] = {
        ...prev,
        ...updates,
        content: updates.content !== undefined
          ? mergeElementContent(prev.content, updates.content, prev.type || updates.type)
          : prev.content,
        style: normalizeStyle(nextStyle || {}) as WebsiteElement['style'],
        tabletStyle: nextTabletStyle,
        mobileStyle: nextMobileStyle,
        settings: { ...(prev.settings || {}), ...(updates.settings || {}) },
      };
      updatedSection = { ...s, elements: newElements };
    } else if (
      (selectedVirtualElement && selectedVirtualElement.id === elementId) ||
      updates.content !== undefined ||
      updates.type !== undefined
    ) {
      // Materialize virtual / first-time sidebar edits into section.elements so the
      // canvas can find them on the next render.
      const seed = selectedVirtualElement?.id === elementId ? selectedVirtualElement : null;
      const nextStyle = resolveStyleFieldUpdate(
        seed?.style as Record<string, any> | undefined,
        updates.style as Record<string, any> | undefined,
        'style' in updates,
      );
      const nextTabletStyle = resolveStyleFieldUpdate(
        seed?.tabletStyle as Record<string, any> | undefined,
        updates.tabletStyle as Record<string, any> | undefined,
        'tabletStyle' in updates,
      );
      const nextMobileStyle = resolveStyleFieldUpdate(
        seed?.mobileStyle as Record<string, any> | undefined,
        updates.mobileStyle as Record<string, any> | undefined,
        'mobileStyle' in updates,
      );
      const newElement: WebsiteElement = {
        ...(seed || {}),
        ...updates,
        id: elementId,
        type: (updates.type || seed?.type || 'heading') as WebsiteElement['type'],
        content: updates.content !== undefined
          ? mergeElementContent(seed?.content, updates.content, updates.type || seed?.type)
          : (seed?.content || {}),
        style: normalizeStyle(nextStyle || (seed?.style as any) || {}) as WebsiteElement['style'],
        tabletStyle: nextTabletStyle,
        mobileStyle: nextMobileStyle,
      };
      updatedSection = { ...s, elements: [...(s.elements || []), newElement] };
    }

    // Sync with content.items
    const itemToUpdate = updatedSection.content.items?.find((i: any) =>
      i.id === elementId ||
      elementId === `${i.id}-title` ||
      elementId === `${i.id}-description` ||
      elementId === `${i.id}-icon` ||
      elementId === `${i.id}-price` ||
      elementId === `${i.id}-feature` ||
      elementId === `${i.id}-feature-box`
    );

    if (itemToUpdate) {
      const newItems = (updatedSection.content.items || []).map((item: any) => {
        const isExactMatch = item.id === elementId;
        const isTitleMatch = elementId === `${item.id}-title`;
        const isDescMatch = elementId === `${item.id}-description`;
        const isIconMatch = elementId === `${item.id}-icon`;
        const isPriceMatch = elementId === `${item.id}-price`;
        const isFeatureMatch = elementId === `${item.id}-feature` || elementId === `${item.id}-feature-box`;

        if (!isExactMatch && !isTitleMatch && !isDescMatch && !isIconMatch && !isPriceMatch && !isFeatureMatch) return item;

        const itemUpdates: any = {};
        if (updates.content) {
          if (isExactMatch || isFeatureMatch) {
            if (updates.content.text !== undefined) itemUpdates.title = updates.content.text;
            if (updates.content.subText !== undefined) itemUpdates.description = updates.content.subText;
            if (updates.content.icon !== undefined) itemUpdates.icon = updates.content.icon;
            if ((updates.content as any).price !== undefined) itemUpdates.price = (updates.content as any).price;
            if ((updates.content as any).iconPosition !== undefined) itemUpdates.iconPosition = (updates.content as any).iconPosition;
          } else if (isTitleMatch) {
            if (updates.content.text !== undefined) itemUpdates.title = updates.content.text;
          } else if (isDescMatch) {
            if (updates.content.text !== undefined) itemUpdates.description = updates.content.text;
          } else if (isIconMatch) {
            if (updates.content.icon !== undefined) itemUpdates.icon = updates.content.icon;
          } else if (isPriceMatch) {
            if (updates.content.text !== undefined) itemUpdates.price = updates.content.text;
          }

          Object.keys(updates.content).forEach(key => {
            if (!['text', 'subText', 'icon', 'price'].includes(key)) {
              itemUpdates[key] = (updates.content as any)[key];
            }
          });
        }

        if ('style' in updates) {
          itemUpdates.style = resolveStyleFieldUpdate(
            item.style as Record<string, any> | undefined,
            updates.style as Record<string, any> | undefined,
            true,
          );
        }

        return { ...item, ...itemUpdates };
      });
      updatedSection = { ...updatedSection, content: { ...updatedSection.content, items: newItems } };
    }

    // ServicesPriceList / ServicesPlumbing2: `${section.id}-sp2-svc0-name|desc|img` (+ bare card id)
    const sp2SvcMatch =
      String(updatedSection.type || '').toLowerCase() === 'services'
        ? String(elementId).match(/-sp2-svc(\d+)(?:-(name|desc|img|title|description|image))?$/)
        : null;
    if (sp2SvcMatch) {
      const idx = parseInt(sp2SvcMatch[1], 10);
      const field = sp2SvcMatch[2] || '';
      const items = Array.isArray(updatedSection.content?.items)
        ? [...updatedSection.content.items]
        : [];
      if (items.length > idx) {
        const item = { ...items[idx] };
        const elAfter = updatedSection.elements?.find((e) => e.id === elementId);
        const uc = (elAfter?.content || updates.content || {}) as Record<string, unknown>;
        const plain = composeHeadingPlainText(uc);
        const isName = !field || field === 'name' || field === 'title';
        const isDesc = field === 'desc' || field === 'description';
        const isImg = field === 'img' || field === 'image';
        if (isName) {
          if (plain) item.title = plain;
          else if (uc.title !== undefined) item.title = uc.title as string;
          else if (uc.text !== undefined) item.title = uc.text as string;
        }
        if (isDesc) {
          if (uc.text !== undefined) item.description = uc.text as string;
          if (uc.subText !== undefined) item.description = uc.subText as string;
          if (uc.description !== undefined) item.description = uc.description as string;
        }
        if (isImg || (!field && uc.imageUrl !== undefined)) {
          if (uc.imageUrl !== undefined) item.imageUrl = uc.imageUrl as string;
        }
        if (!field) {
          if (uc.imageUrl !== undefined) item.imageUrl = uc.imageUrl as string;
          if (uc.link !== undefined) item.link = uc.link as string;
          if (uc.buttonLink !== undefined) item.link = uc.buttonLink as string;
        }
        items[idx] = item;
        updatedSection = {
          ...updatedSection,
          content: { ...updatedSection.content, items },
        };
      }
    }

    // Services header virtuals: `${section.id}-sp2-title|badge|desc`
    const sp2HeaderMatch =
      String(updatedSection.type || '').toLowerCase() === 'services'
        ? String(elementId).match(/-sp2-(title|badge|desc)$/)
        : null;
    if (sp2HeaderMatch) {
      const elAfter = updatedSection.elements?.find((e) => e.id === elementId);
      const uc = (elAfter?.content || updates.content || {}) as Record<string, unknown>;
      const plain = composeHeadingPlainText(uc);
      const key =
        sp2HeaderMatch[1] === 'title'
          ? 'title'
          : sp2HeaderMatch[1] === 'badge'
            ? 'badgeText'
            : 'description';
      const nextVal =
        key === 'title'
          ? plain || (uc.text as string) || ''
          : String(uc.text ?? '');
      if (nextVal || updates.content) {
        updatedSection = {
          ...updatedSection,
          content: {
            ...updatedSection.content,
            [key]: nextVal,
          },
        };
      }
    }

    // Sync virtual title/subtitle/description/button/image back to section content/styles
    const isTitle = elementId === `${updatedSection.id}-title` || elementId === `${updatedSection.id}-hero-title`;
    const isSubtitle = elementId === `${updatedSection.id}-subtitle` || elementId === `${updatedSection.id}-hero-subtitle`;
    const isDescription = elementId === `${updatedSection.id}-description` || elementId === `${updatedSection.id}-hero-description`;
    const isButton = elementId === `${updatedSection.id}-hero-button`;
    const isImage = elementId === `${updatedSection.id}-hero-image`;

    if (isTitle || isSubtitle || isDescription || isButton || isImage) {
      const prefix = isTitle ? 'title' : (isSubtitle ? 'subtitle' : (isDescription ? 'description' : (isButton ? 'cta' : 'image')));
      const sectionUpdates: any = { content: { ...updatedSection.content }, styles: { ...updatedSection.styles } };
      const elAfter = updatedSection.elements?.find((e) => e.id === elementId);
      const uc = (elAfter?.content || updates.content || {}) as any;

      if (isButton) {
        if (uc.text !== undefined) sectionUpdates.content.ctaText = uc.text;
        if (uc.link !== undefined) sectionUpdates.content.ctaHref = uc.link;
      } else if (isImage) {
        if (uc.imageUrl !== undefined) sectionUpdates.content.imageUrl = uc.imageUrl;
      } else {
        const plain = composeHeadingPlainText(uc);
        if (plain || uc.text !== undefined) {
          sectionUpdates.content[prefix] = plain || uc.text;
        }
      }

      if (updates.style) {
        const normalizedStyle = normalizeStyle(updates.style) as any;
        if (isButton) {
          if (normalizedStyle.backgroundColor) sectionUpdates.styles.buttonBackgroundColor = normalizedStyle.backgroundColor;
          if (normalizedStyle.color) sectionUpdates.styles.buttonTextColor = normalizedStyle.color;
        } else {
          if (normalizedStyle.color) sectionUpdates.styles[`${prefix}Color`] = normalizedStyle.color;
          if (normalizedStyle.fontSize) sectionUpdates.styles[`${prefix}FontSize`] = normalizedStyle.fontSize;
          if (normalizedStyle.fontWeight) sectionUpdates.styles[`${prefix}FontWeight`] = normalizedStyle.fontWeight;
          if (normalizedStyle.fontFamily) sectionUpdates.styles[`${prefix}FontFamily`] = normalizedStyle.fontFamily;
          if (normalizedStyle.textTransform) sectionUpdates.styles[`${prefix}TextTransform`] = normalizedStyle.textTransform;
          if (normalizedStyle.letterSpacing) sectionUpdates.styles[`${prefix}LetterSpacing`] = normalizedStyle.letterSpacing;
          if (normalizedStyle.fontStyle) sectionUpdates.styles[`${prefix}FontStyle`] = normalizedStyle.fontStyle;
        }
      }

      updatedSection = { ...updatedSection, ...sectionUpdates };
    }

    return updatedSection;
  });

  if (isGlobal) {
    return { ...prev, globalSections: mappedSections };
  }
  return { ...prev, sections: mappedSections };
};
