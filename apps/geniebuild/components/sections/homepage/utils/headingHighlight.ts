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
        style: { ...(opts.style || {}), ...(existing.style || {}) },
      };
    }
  }
  const parts = splitHeadingWithLastWordHighlight(opts.sourceText);
  return {
    id: opts.id,
    type: "heading",
    content: { ...parts, htmlTag },
    style: { ...(opts.style || {}) },
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
