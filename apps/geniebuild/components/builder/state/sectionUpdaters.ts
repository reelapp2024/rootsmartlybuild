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
          ? { ...(prev.content || {}), ...(updates.content || {}) }
          : prev.content,
        style: normalizeStyle(nextStyle || {}) as WebsiteElement['style'],
        tabletStyle: nextTabletStyle,
        mobileStyle: nextMobileStyle,
        settings: { ...(prev.settings || {}), ...(updates.settings || {}) },
      };
      updatedSection = { ...s, elements: newElements };
    } else if (selectedVirtualElement && selectedVirtualElement.id === elementId) {
      const nextStyle = resolveStyleFieldUpdate(
        selectedVirtualElement.style as Record<string, any> | undefined,
        updates.style as Record<string, any> | undefined,
        'style' in updates,
      );
      const nextTabletStyle = resolveStyleFieldUpdate(
        selectedVirtualElement.tabletStyle as Record<string, any> | undefined,
        updates.tabletStyle as Record<string, any> | undefined,
        'tabletStyle' in updates,
      );
      const nextMobileStyle = resolveStyleFieldUpdate(
        selectedVirtualElement.mobileStyle as Record<string, any> | undefined,
        updates.mobileStyle as Record<string, any> | undefined,
        'mobileStyle' in updates,
      );
      const newElement = {
        ...selectedVirtualElement,
        ...updates,
        content: updates.content !== undefined
          ? { ...(selectedVirtualElement.content || {}), ...(updates.content || {}) }
          : selectedVirtualElement.content,
        style: normalizeStyle(nextStyle || {}) as WebsiteElement['style'],
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

    // Sync virtual title/subtitle/description/button/image back to section content/styles
    const isTitle = elementId === `${updatedSection.id}-title` || elementId === `${updatedSection.id}-hero-title`;
    const isSubtitle = elementId === `${updatedSection.id}-subtitle` || elementId === `${updatedSection.id}-hero-subtitle`;
    const isDescription = elementId === `${updatedSection.id}-description` || elementId === `${updatedSection.id}-hero-description`;
    const isButton = elementId === `${updatedSection.id}-hero-button`;
    const isImage = elementId === `${updatedSection.id}-hero-image`;

    if (isTitle || isSubtitle || isDescription || isButton || isImage) {
      const prefix = isTitle ? 'title' : (isSubtitle ? 'subtitle' : (isDescription ? 'description' : (isButton ? 'cta' : 'image')));
      const sectionUpdates: any = { content: { ...updatedSection.content }, styles: { ...updatedSection.styles } };

      if (isButton) {
        if (updates.content?.text !== undefined) sectionUpdates.content.ctaText = updates.content.text;
        if ((updates.content as any)?.link !== undefined) sectionUpdates.content.ctaHref = (updates.content as any).link;
      } else if (isImage) {
        if ((updates.content as any)?.imageUrl !== undefined) sectionUpdates.content.imageUrl = (updates.content as any).imageUrl;
      } else if (updates.content?.text !== undefined) {
        sectionUpdates.content[prefix] = updates.content.text;
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
