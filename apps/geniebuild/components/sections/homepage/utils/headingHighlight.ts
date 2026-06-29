export type SplitHeadingParts = {
  text: string;
  textBefore: string;
  highlightedText: string;
  textAfter: string;
};

export const splitHeadingWithLastWordHighlight = (input?: string): SplitHeadingParts => {
  const text = String(input || "").trim();
  if (!text) {
    return { text: "", textBefore: "", highlightedText: "", textAfter: "" };
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { text, textBefore: "", highlightedText: text, textAfter: "" };
  }

  const highlightedText = words[words.length - 1];
  const textBefore = words.slice(0, -1).join(" ");
  return { text, textBefore, highlightedText, textAfter: "" };
};

export const composeHeadingText = (textBefore = "", highlightedText = "", textAfter = ""): string => {
  return [textBefore, highlightedText, textAfter].filter(Boolean).join(" ").trim();
};

export const resolveHeadingContent = (baseText?: string, existingContent?: any): SplitHeadingParts => {
  const split = splitHeadingWithLastWordHighlight(baseText || "");
  const textBefore = existingContent?.textBefore ?? split.textBefore;
  const highlightedText = existingContent?.highlightedText ?? split.highlightedText;
  const textAfter = existingContent?.textAfter ?? split.textAfter;

  const composed = composeHeadingText(textBefore, highlightedText, textAfter) || split.text;

  return {
    text: composed,
    textBefore,
    highlightedText,
    textAfter,
  };
};
