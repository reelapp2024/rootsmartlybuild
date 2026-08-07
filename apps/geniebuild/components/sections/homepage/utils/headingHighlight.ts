import type { Section } from "../../../../types";
import {
  resolveSectionElement,
  stripInheritedColorKeys,
} from "../../../../elements";

export type SplitHeadingParts = {
  text: string;
  textBefore: string;
  highlightedText: string;
  textAfter: string;
};

export const splitHeadingWithLastWordHighlight = (input?: string): SplitHeadingParts => {
  const text = String(input || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) {
    return { text: "", textBefore: "", highlightedText: "", textAfter: "" };
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { text, textBefore: "", highlightedText: text, textAfter: "" };
  }

  const highlightedText = words[words.length - 1];
  const textBefore = words.slice(0, -1).join(" ");
  return { text: `${textBefore} ${highlightedText}`, textBefore, highlightedText, textAfter: "" };
};

export const composeHeadingText = (textBefore = "", highlightedText = "", textAfter = ""): string => {
  return [textBefore, highlightedText, textAfter].map((p) => String(p || "").trim()).filter(Boolean).join(" ").trim();
};

/**
 * Sidebar + canvas must show the same heading parts.
 * If explicit textBefore/highlightedText/textAfter exist, use them.
 * Otherwise derive last-word highlight from plain `text` (same as ElementsSection render).
 */
export const resolveHeadingSidebarParts = (content?: {
  text?: string;
  textBefore?: string;
  highlightedText?: string;
  textAfter?: string;
} | null): SplitHeadingParts => {
  const c = content || {};
  const hasParts = !!(
    String(c.textBefore || "").trim() ||
    String(c.highlightedText || "").trim() ||
    String(c.textAfter || "").trim()
  );
  if (hasParts) {
    const textBefore = String(c.textBefore || "");
    const highlightedText = String(c.highlightedText || "");
    const textAfter = String(c.textAfter || "");
    return {
      text: composeHeadingText(textBefore, highlightedText, textAfter) || String(c.text || ""),
      textBefore,
      highlightedText,
      textAfter,
    };
  }
  return splitHeadingWithLastWordHighlight(String(c.text || ""));
};

/**
 * Prefer an already-edited heading element over API/default source text.
 * Always normalizes to last-word highlight when only plain `text` is present.
 */
export const resolveEditableHeadingElement = (opts: {
  id: string;
  existing?: { id?: string; type?: string; content?: any; style?: any } | null;
  sourceText: string;
  htmlTag?: string;
  style?: Record<string, any>;
}): { id: string; type: "heading"; content: any; style: any } => {
  const htmlTag = opts.htmlTag || "h2";
  const existing = opts.existing;
  const dnaStyle = stripInheritedColorKeys(opts.style || {});
  if (existing?.content) {
    const ec = existing.content || {};
    const hasParts = !!(
      String(ec.textBefore || "").trim() ||
      String(ec.highlightedText || "").trim() ||
      String(ec.textAfter || "").trim()
    );
    const plain = String(ec.text || "").trim();
    if (hasParts || plain) {
      const parts = hasParts
        ? {
            text: composeHeadingText(ec.textBefore, ec.highlightedText, ec.textAfter) || plain,
            textBefore: ec.textBefore || "",
            highlightedText: ec.highlightedText || "",
            textAfter: ec.textAfter || "",
          }
        : splitHeadingWithLastWordHighlight(plain || opts.sourceText);
      return {
        id: opts.id,
        type: "heading",
        content: { ...ec, ...parts, htmlTag: ec.htmlTag || htmlTag },
        style: {
          ...dnaStyle,
          ...Object.fromEntries(
            Object.entries((existing.style || {}) as Record<string, any>).filter(
              ([, v]) => v !== undefined && v !== null && v !== ""
            )
          ),
        },
      };
    }
  }
  const parts = splitHeadingWithLastWordHighlight(opts.sourceText);
  return {
    id: opts.id,
    type: "heading",
    content: { ...parts, htmlTag },
    style: { ...dnaStyle },
  };
};

export const resolveHeadingContent = (baseText?: string, existingContent?: any): SplitHeadingParts => {
  if (
    existingContent &&
    (String(existingContent.textBefore || "").trim() ||
      String(existingContent.highlightedText || "").trim() ||
      String(existingContent.textAfter || "").trim() ||
      String(existingContent.text || "").trim())
  ) {
    const textBefore = existingContent.textBefore ?? "";
    const highlightedText = existingContent.highlightedText ?? "";
    const textAfter = existingContent.textAfter ?? "";
    const hasParts = !!(
      String(textBefore).trim() ||
      String(highlightedText).trim() ||
      String(textAfter).trim()
    );
    if (hasParts) {
      const composed = composeHeadingText(textBefore, highlightedText, textAfter);
      return {
        text: composed || String(existingContent.text || baseText || ""),
        textBefore,
        highlightedText,
        textAfter,
      };
    }
    return splitHeadingWithLastWordHighlight(String(existingContent.text || baseText || ""));
  }
  return splitHeadingWithLastWordHighlight(baseText || "");
};

/**
 * Prefer a saved element over API/default content (badge, text, button, etc.).
 * Once the user edited the element, never force section.content back on top.
 *
 * Theme color keys are stripped from DNA/fallback style so Inherited sidebar
 * matches canvas (theme resolves at render).
 */
export function preferSavedElement<T extends { id?: string; type?: string; content?: any; style?: any }>(
  existing: T | null | undefined,
  fallback: T
): T {
  const cleanFallback = {
    ...fallback,
    style: stripInheritedColorKeys(fallback.style as Record<string, any>),
  } as T;

  if (!existing?.content) return cleanFallback;
  const ec = existing.content || {};
  const hasUserContent = Object.keys(ec).some((k) => {
    const v = ec[k];
    if (v === undefined || v === null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "number" || typeof v === "boolean") return true;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  });
  if (!hasUserContent) return cleanFallback;

  return resolveSectionElement(
    { elements: [existing as any] } as Section,
    {
      ...(cleanFallback as any),
      id: String(existing.id || fallback.id || ""),
      type: (existing.type || fallback.type || "text") as any,
    }
  ) as T;
}
