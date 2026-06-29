import type { WebsiteElement, Section } from '../../../types';

/** Pulled from WebsiteElement — every field optional at the form level. */
export type ElementContent = Partial<WebsiteElement['content']> & Record<string, unknown>;
export type ElementStyleInput = Partial<WebsiteElement['style']> & Record<string, unknown>;

/** Shared prop shape used by every simple element content form. */
export interface ContentFormProps {
  content: ElementContent;
  onContentUpdate: (updates: Partial<ElementContent>) => void;
}

/** For forms that also accept an image/video upload trigger. */
export interface ContentFormWithUploadProps extends ContentFormProps {
  onUpload: () => void;
}

/** For the Icon form — merges both content and style updates into a single call. */
export interface IconContentFormProps {
  content: ElementContent;
  style: ElementStyleInput;
  onElementUpdate: (updates: { content?: ElementContent; style?: ElementStyleInput }) => void;
}

/** For forms with section-aware Typography editing (heading/text). */
export interface TypographyContentFormProps {
  element: WebsiteElement;
  section: Section;
  defaultSizes: Record<string, string>;
  onContentUpdate: (updates: Partial<ElementContent>) => void;
  onStyleUpdate: (updates: Partial<ElementStyleInput>) => void;
  onSectionStyleUpdate: (key: string, value: unknown) => void;
}
