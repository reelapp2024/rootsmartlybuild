import type { WebsiteData } from '../../../types';
import type { DefaultSizes } from './themeSettingsHelpers';

/**
 * When the global defaultSizes change, sweep through all section styles
 * and element styles, clearing any inline fontSize/titleSize that now
 * matches the new defaults. Purpose: let the CSS fallback apply so
 * sections and elements stay in sync with the canonical defaults
 * instead of being frozen to a stale explicit size.
 */
export function applyClearMatchingDefaultSizes(
  prev: WebsiteData,
  defaultSizes: DefaultSizes
): WebsiteData {
  return {
    ...prev,
    sections: prev.sections.map((section) => {
      const updatedSection: any = { ...section };
      const stylesAny = updatedSection.styles as any;

      if (stylesAny.titleHeadingTag && stylesAny.titleSize) {
        const headingTag = stylesAny.titleHeadingTag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        const currentDefaultSize = defaultSizes[headingTag];
        if (stylesAny.titleSize === currentDefaultSize) {
          const { titleSize, ...restStyles } = stylesAny;
          updatedSection.styles = restStyles;
        }
      }

      if (updatedSection.elements && Array.isArray(updatedSection.elements)) {
        updatedSection.elements = updatedSection.elements.map((element: any) => {
          const htmlTag = element.content?.htmlTag;
          if (htmlTag && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(htmlTag)) {
            const headingTag = htmlTag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
            const currentDefaultSize = defaultSizes[headingTag];
            if (element.style?.fontSize === currentDefaultSize) {
              const { fontSize, ...restStyle } = element.style;
              return { ...element, style: restStyle };
            }
          }
          if (
            htmlTag === 'p' &&
            element.style?.fontSize &&
            (
              element.style.fontSize === defaultSizes.text ||
              element.style.fontSize === defaultSizes.textSmall ||
              element.style.fontSize === defaultSizes.textLarge ||
              element.style.fontSize === defaultSizes.textXl
            )
          ) {
            const { fontSize, ...restStyle } = element.style;
            return { ...element, style: restStyle };
          }
          return element;
        });
      }

      return updatedSection;
    }),
  };
}
