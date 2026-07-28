// components/editor/RichTextEditor.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Unlink, Undo2, Redo2, Eraser,
  Image as ImageIcon, Heading1, Heading2, Heading3,
  Minus, ChevronLeft, ChevronRight, Replace as ReplaceIcon
} from "lucide-react";
import { toast } from "sonner";
import { PRESET_FONTS, buildGoogleFontsCssUrl } from "@schema/core/presetFonts";
import {
  buildLocalBlogEditorCss,
  normalizeProjectId as normalizeEditorProjectIdFromHook,
} from "@/hooks/useBlogEditorTheme";

const EDITOR_FONT_OPTIONS = [
  { name: "Theme default", value: "" },
  ...PRESET_FONTS,
];
const EDITOR_GOOGLE_FONTS_URL = buildGoogleFontsCssUrl(PRESET_FONTS);

export type RteTab = "visual" | "html";

/** Project theme for WYSIWYG — same tokens as live site blog prose. */
export type BlogEditorThemePreview = {
  proseCss?: string;
  googleFontsUrl?: string;
  titleColor?: string;
  textColor?: string;
  linkColor?: string;
  accentColor?: string;
  titleFont?: string;
  bodyFont?: string;
  surfaceColor?: string;
  blogCss?: string;
  /** Which project this payload belongs to (guards against stale theme flash). */
  projectId?: string;
};

export type RichTextEditorProps = {
  /** Full HTML doc: <!doctype ...><html ...><head>...</head><body>...</body></html> */
  value?: string;
  onChange?: (fullHtml: string) => void;
  initialHTML?: string;
  uploadUrl?: string;
  disabled?: boolean;
  height?: number;
  /** When set, visual editor matches live site headings / paragraphs. */
  themePreview?: BlogEditorThemePreview | null;
  /** Optional — editor can fetch theme itself if parent themePreview is late. */
  projectId?: string | null;
};

/**
 * Editor theme CSS — same literal rules as SiteNextJS BlogContentDefault.
 * Inline style= / data-gb-*-override still win over these theme defaults.
 */
function buildDefaultEditorThemeCss(t?: BlogEditorThemePreview | null): string {
  const base = buildLocalBlogEditorCss({
    titleColor: t?.titleColor || "#111827",
    textColor: t?.textColor || "#374151",
    accentColor: t?.accentColor || t?.linkColor || "#E11D48",
    linkColor: t?.linkColor || t?.accentColor || "#E11D48",
    titleFont: t?.titleFont,
    bodyFont: t?.bodyFont,
    surfaceColor: t?.surfaceColor || "#FFFFFF",
  });
  const extraBlogCss = String(t?.blogCss || "").trim();
  return extraBlogCss ? `${base}\n${extraBlogCss}` : base;
}

/** Tiny chrome layered on API proseCss (selected images, etc.). */
const EDITOR_CHROME_CSS = `
  #root, .blog-prose { outline: none; min-height: 12rem; }
  img { max-width: 100%; height: auto; display: block; }
  img:focus, img.selected { outline: 2px solid #60a5fa; }
  #root [data-gb-color-override="1"],
  .blog-prose [data-gb-color-override="1"] { border-left-color: currentColor; }
  /* Empty blocks must keep height so Enter creates a visible new line (Word/WP behavior) */
  #root p, #root h1, #root h2, #root h3, #root h4, #root h5, #root h6,
  #root li, #root blockquote,
  .blog-prose p, .blog-prose h1, .blog-prose h2, .blog-prose h3 {
    min-height: 1.5em;
  }
  #root p:empty::before,
  #root h1:empty::before, #root h2:empty::before, #root h3:empty::before,
  .blog-prose p:empty::before {
    content: "\\00a0";
    display: inline-block;
  }
`;

function normalizeEditorProjectId(raw: unknown): string {
  return normalizeEditorProjectIdFromHook(raw);
}

function stripConflictingHeadStyles(head: string): string {
  return String(head || "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
    .trim();
}

const DEFAULT_UPLOAD_URL =
  (import.meta as any).env?.VITE_UPLOAD_URL ||
  "https://apis.smartlybuild.dev/admin/v1/uploadFile";

// Build absolute URL using env VITE_IMAGES_BASE_URL
const IMG_BASE: string =
  (import.meta as any).env?.VITE_IMAGES_BASE_URL ||
  "https://apis.smartlybuild.dev";

function toAbs(url?: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const join = (base: string, path: string) =>
    base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
  return join(IMG_BASE, url);
}

/* ---------------------- Full-doc helpers ---------------------- */
function splitHeadBody(fullHtml: string) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtml || "", "text/html");
    const head = doc.head?.innerHTML ?? "";
    const body = doc.body?.innerHTML ?? "";
    const doctype = doc.doctype ? `<!doctype ${doc.doctype.name}>` : "<!doctype html>";
    const htmlAttrs =
      doc.documentElement?.getAttributeNames?.()
        ?.map((n) => `${n}="${doc.documentElement.getAttribute(n) ?? ""}"`)
        .join(" ") || 'lang="en"';
    return { doctype, htmlAttrs, headHtml: head, bodyHtml: body };
  } catch {
    const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const doctypeMatch = fullHtml.match(/<!doctype[^>]*>/i);
    const htmlAttrsMatch = fullHtml.match(/<html([^>]*)>/i);
    return {
      doctype: doctypeMatch?.[0] || "<!doctype html>",
      htmlAttrs: (htmlAttrsMatch?.[1] || ' lang="en"').trim() || 'lang="en"',
      headHtml: headMatch?.[1] || "",
      bodyHtml: bodyMatch?.[1] || fullHtml || "",
    };
  }
}
function joinHeadBody(doctype: string, htmlAttrs: string, headHtml: string, bodyHtml: string) {
  return `${doctype || "<!doctype html>"}\n<html ${htmlAttrs || 'lang="en"'}>\n<head>\n${headHtml || ""}\n</head>\n<body>\n${bodyHtml || ""}\n</body>\n</html>`;
}

/* ---------------------- Image class / style helpers ---------------------- */
type AlignToken = "img-float-left" | "img-float-right" | "img-center" | "img-block";
type SizeToken = "img-25" | "img-33" | "img-50" | "img-66" | "img-75" | "img-100";

const SIZE_ORDER: SizeToken[] = ["img-25", "img-33", "img-50", "img-66", "img-75", "img-100"];
const ALIGN_DEFAULT: AlignToken = "img-block";
const SIZE_DEFAULT: SizeToken = "img-100";

function parseTokens(cls: string) {
  const parts = (cls || "").split(/\s+/).filter(Boolean);
  const align = (parts.find(p => /^img-(float-left|float-right|center|block)$/.test(p)) || ALIGN_DEFAULT) as AlignToken;
  const size = (parts.find(p => /^img-(25|33|50|66|75|100)$/.test(p)) || SIZE_DEFAULT) as SizeToken;
  return { align, size };
}

function buildClass(align: AlignToken, size: SizeToken) {
  return `${align} ${size}`.trim();
}

function styleFromTokens(align: AlignToken, size: SizeToken): string {
  let style = "height:auto;";
  if (align === "img-float-left") style += "float:left;margin:0.25rem 0.85rem 0.5rem 0;display:block;clear:none;";
  else if (align === "img-float-right") style += "float:right;margin:0.25rem 0 0.5rem 0.85rem;display:block;clear:none;";
  else if (align === "img-center") style += "float:none;display:block;margin:.75rem auto;clear:none;";
  else style += "float:none;display:block;margin:.75rem 0;clear:none;";

  const pct = size.split("-")[1];
  style += `width:${pct}%;max-width:${pct}%;`;
  return style;
}

function ensureImageTokensAndStyle(el: HTMLImageElement) {
  const { align, size } = parseTokens(el.className || "");
  const cls = buildClass(align, size);
  el.className = cls;
  
  // Always apply the full style from tokens to ensure consistency
  el.style.cssText = styleFromTokens(align, size);
}

/* ---------------------- Upload helper (uses your API shape) ---------------------- */
async function uploadImageToUrl(file: File, uploadUrl: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(uploadUrl, { method: "POST", body: fd });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || "Upload failed");

  const data = await res.json().catch(() => ({} as any));
  // Your response sample:
  // { "message": "File uploaded successfully!!", "data": { "url": "/files/xxxx.webp" } }
  const rel =
    data?.data?.url ||
    data?.url ||
    data?.filePath ||
    data?.path ||
    "";

  if (!rel) throw new Error("No URL returned from upload API");
  return toAbs(rel);
}

function rgbToHex(color: string): string {
  const raw = String(color || "").trim();
  if (!raw) return "#000000";
  if (raw.startsWith("#")) {
    if (raw.length === 4) {
      const r = raw[1], g = raw[2], b = raw[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    if (raw.length >= 7) return raw.slice(0, 7).toLowerCase();
    return raw.toLowerCase();
  }
  const match = raw.match(/\d+/g);
  if (!match || match.length < 3) return "#000000";
  const [r, g, b] = match.map(Number);
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, x | 0)).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Accept #RGB, #RRGGBB, rgb()/rgba(), or bare hex — return #rrggbb or null. */
function normalizeColorInput(raw: string): string | null {
  let s = String(raw || "").trim();
  if (!s) return null;
  // rgb(255, 0, 0) / rgba
  if (/^rgba?\(/i.test(s)) {
    const hex = rgbToHex(s);
    return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : null;
  }
  if (s[0] !== "#") s = `#${s}`;
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^#[0-9a-f]{8}$/i.test(s)) return s.slice(0, 7).toLowerCase();
  return null;
}

/** Resolve block under caret (heading / paragraph / list item / quote). */
function getBlockFromSelection(idoc: Document): HTMLElement | null {
  const sel = idoc.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let node: Node | null = sel.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
  const root = idoc.getElementById("root") || idoc.body;
  while (node && node !== root && node !== idoc.body) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName;
      if (/^(H[1-6]|P|LI|BLOCKQUOTE|DIV|PRE)$/i.test(tag) && (node as Element).id !== "root") {
        return node as HTMLElement;
      }
    }
    node = node.parentNode;
  }
  return null;
}

function readFormatFromBlock(block: HTMLElement | null, idoc: Document): string {
  if (block) {
    const tag = block.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag) || tag === "blockquote" || tag === "pre") return tag;
    if (tag === "li") {
      const list = block.closest("ul,ol");
      if (list?.tagName === "OL") return "ol";
      if (list?.tagName === "UL") return "ul";
      return "li";
    }
    if (tag === "p" || tag === "div") return "p";
  }
  try {
    const v = String(idoc.queryCommandValue("formatBlock") || "").toLowerCase();
    if (v && v !== "false" && v !== "null") return v.replace(/[<>]/g, "");
  } catch {
    /* ignore */
  }
  return "p";
}

/** Normalize formatBlock tag names (`<h2>` / `H2` → `h2`). */
function normalizeBlockTag(tag: string): string {
  return String(tag || "p").toLowerCase().replace(/[<>]/g, "").trim() || "p";
}

/**
 * Change the block under the caret in-place (h2 → h1, h1 → p, etc.).
 * Avoids execCommand("formatBlock"), which wraps a partial selection and
 * creates a NEW heading above/inside the current one.
 */
function setBlockFormatInIframe(
  idoc: Document,
  nextTagRaw: string,
  blockOverride?: HTMLElement | null
): HTMLElement | null {
  const nextTag = normalizeBlockTag(nextTagRaw);
  if (!/^(h[1-6]|p|blockquote|pre)$/.test(nextTag)) return null;

  let block = blockOverride || getBlockFromSelection(idoc);
  const root = idoc.getElementById("root") || idoc.body;

  // No block (bare text / empty editor) — create a paragraph at the caret first
  if (!block || block === root || block.id === "root") {
    try {
      idoc.execCommand("formatBlock", false, "p");
    } catch {
      /* ignore */
    }
    block = getBlockFromSelection(idoc);
    if (!block || block === root || block.id === "root") {
      if (!root) return null;
      const p = idoc.createElement("p");
      p.className = "gb-p gb-el";
      p.innerHTML = "<br>";
      root.appendChild(p);
      try {
        const sel = idoc.getSelection();
        const range = idoc.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch {
        /* ignore */
      }
      block = p;
    }
  }

  const current = block.tagName.toLowerCase();
  // Already the requested tag — nothing to do (toggle to paragraph is handled by caller)
  if (current === nextTag) return block;

  const replacement = idoc.createElement(nextTag);
  for (const attr of Array.from(block.attributes)) {
    if (attr.name === "id" && attr.value === "root") continue;
    // Don't copy stale semantic classes — re-apply below
    if (attr.name === "class") continue;
    replacement.setAttribute(attr.name, attr.value);
  }

  // Preserve non-gb classes, then stamp the correct gb-* class for the new tag
  const prevClass = String(block.className || "")
    .replace(/\bgb-h[1-6]\b/gi, "")
    .replace(/\bgb-p\b/gi, "")
    .replace(/\bgb-quote\b/gi, "")
    .replace(/\bgb-el\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const gbClass =
    /^h[1-6]$/.test(nextTag) ? `gb-${nextTag}` : nextTag === "blockquote" ? "gb-quote" : "gb-p";
  replacement.className = [prevClass, gbClass, "gb-el"].filter(Boolean).join(" ");

  while (block.firstChild) replacement.appendChild(block.firstChild);
  // Empty heading/paragraph must keep a <br> so caret/Enter keep working
  if (!replacement.childNodes.length) {
    replacement.appendChild(idoc.createElement("br"));
  }
  block.parentNode?.replaceChild(replacement, block);

  try {
    const sel = idoc.getSelection();
    const range = idoc.createRange();
    range.selectNodeContents(replacement);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
  } catch {
    /* ignore */
  }
  return replacement;
}

/** Normalize current block tag for heading toggle (div ≡ paragraph). */
function normalizeCurrentBlockTag(block: HTMLElement | null): string {
  if (!block) return "p";
  const t = block.tagName.toLowerCase();
  if (t === "div") return "p";
  return t;
}

function readAlignFromBlock(block: HTMLElement | null, idoc: Document): "left" | "center" | "right" | "justify" {
  try {
    if (idoc.queryCommandState("justifyCenter")) return "center";
    if (idoc.queryCommandState("justifyRight")) return "right";
    if (idoc.queryCommandState("justifyFull")) return "justify";
  } catch {
    /* ignore */
  }
  if (block) {
    const inline = (block.style?.textAlign || "").toLowerCase();
    if (inline === "center" || inline === "right" || inline === "justify" || inline === "left") {
      return inline;
    }
    try {
      const cs = idoc.defaultView?.getComputedStyle(block)?.textAlign || "";
      if (cs === "center") return "center";
      if (cs === "right" || cs === "end") return "right";
      if (cs === "justify") return "justify";
    } catch {
      /* ignore */
    }
  }
  return "left";
}

/** Actual visible color of selection (inline override → computed theme color). */
function readSelectionTextColor(idoc: Document, block: HTMLElement | null): string {
  const around = getColorAroundSelection(idoc);
  if (around) return rgbToHex(around);

  const sel = idoc.getSelection();
  let node: Node | null = sel?.anchorNode || null;
  if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
  const el =
    (node && node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : null) || block;
  if (el) {
    try {
      const cs = idoc.defaultView?.getComputedStyle(el)?.color;
      if (cs) return rgbToHex(cs);
    } catch {
      /* ignore */
    }
  }
  try {
    const q = String(idoc.queryCommandValue("foreColor") || "");
    if (q) return rgbToHex(q);
  } catch {
    /* ignore */
  }
  return "#000000";
}

function uid() {
  return "tmp-" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

/* ---------------------- Link helpers (iframe selection-safe) ---------------------- */
function normalizeHref(url: string): string {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/^(https?:|mailto:|tel:|sms:|\/|#)/i.test(u)) return u;
  return `https://${u}`;
}

function getAnchorAroundNode(node: Node | null, root: Node | null): HTMLAnchorElement | null {
  let cur: Node | null = node;
  while (cur && cur !== root) {
    if (cur.nodeType === Node.ELEMENT_NODE && (cur as Element).tagName === "A") {
      return cur as HTMLAnchorElement;
    }
    cur = cur.parentNode;
  }
  return null;
}

function getAnchorFromSelection(idoc: Document): HTMLAnchorElement | null {
  const sel = idoc.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const fromAnchor = getAnchorAroundNode(sel.anchorNode, idoc.body);
  if (fromAnchor) return fromAnchor;
  const fromFocus = getAnchorAroundNode(sel.focusNode, idoc.body);
  if (fromFocus) return fromFocus;
  // Common ancestor may be the <a> itself
  const common = range.commonAncestorContainer;
  return getAnchorAroundNode(common, idoc.body);
}

function saveIframeSelection(idoc: Document): Range | null {
  const sel = idoc.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  try {
    return sel.getRangeAt(0).cloneRange();
  } catch {
    return null;
  }
}

function restoreIframeSelection(idoc: Document, range: Range | null): boolean {
  if (!range) return false;
  try {
    idoc.body?.focus?.();
    const sel = idoc.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  } catch {
    return false;
  }
}

function enhanceAnchor(a: HTMLAnchorElement, href: string, color?: string) {
  a.setAttribute("href", href);
  // Keep relative / hash / mailto as-is; open http(s) in new tab
  if (/^https?:/i.test(href)) {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  } else {
    a.removeAttribute("target");
    a.removeAttribute("rel");
  }
  // Persist explicit color on the <a> so SiteNextJS / theme CSS can respect it
  const c = String(color || "").trim();
  if (c) {
    a.style.color = c;
  }
}

/** Resolve a CSS color from the current selection / surrounding markup. */
function getColorAroundSelection(idoc: Document): string {
  const sel = idoc.getSelection();
  if (!sel || sel.rangeCount === 0) return "";

  const readColor = (el: Element | null): string => {
    if (!el) return "";
    if (el instanceof HTMLElement && el.style?.color) return el.style.color;
    if (el.tagName === "FONT") {
      const fc = el.getAttribute("color");
      if (fc) return fc;
    }
    try {
      const cs = idoc.defaultView?.getComputedStyle(el)?.color;
      return cs && cs !== "rgba(0, 0, 0, 0)" ? cs : "";
    } catch {
      return "";
    }
  };

  // Prefer an explicit color on an ancestor (editor foreColor wraps selection)
  let node: Node | null = sel.anchorNode;
  while (node && node !== idoc.body) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el instanceof HTMLElement && el.style?.color) return el.style.color;
      if (el.tagName === "FONT" && el.getAttribute("color")) {
        return el.getAttribute("color") || "";
      }
    }
    node = node.parentNode;
  }

  const anchor = getAnchorFromSelection(idoc);
  if (anchor) {
    const own = readColor(anchor);
    if (own) return own;
    const child = anchor.querySelector("[style*='color'], font[color]") as Element | null;
    if (child) {
      if (child instanceof HTMLElement && child.style?.color) return child.style.color;
      if (child.tagName === "FONT") return child.getAttribute("color") || "";
    }
  }

  try {
    const q = String(idoc.queryCommandValue("foreColor") || "").trim();
    if (q && !/^rgba?\(\s*0,\s*0,\s*0/i.test(q) && q !== "#000000") return q;
  } catch {
    /* ignore */
  }
  return "";
}

/** True only when the selection's text equals the whole block (not caret). */
function selectionCoversWholeBlock(
  sel: Selection | null,
  block: HTMLElement | null
): boolean {
  if (!sel || !block || sel.rangeCount === 0 || sel.isCollapsed) return false;
  try {
    const blockText = (block.textContent || "").replace(/\s+/g, " ").trim();
    const selText = String(sel.getRangeAt(0).toString() || "").replace(/\s+/g, " ").trim();
    if (!selText || !blockText) return false;
    return selText === blockText;
  } catch {
    return false;
  }
}

function markColorOverride(el: HTMLElement, color: string) {
  el.style.setProperty("color", color);
  el.setAttribute("data-gb-color-override", "1");
}

function markFontOverride(el: HTMLElement, fontFamily: string) {
  el.style.setProperty("font-family", fontFamily);
  el.setAttribute("data-gb-font-override", "1");
}

function clearNestedInlineProp(root: HTMLElement, prop: "color" | "font-family") {
  const sel =
    prop === "color"
      ? 'font[color], span[style*="color"], [data-gb-color-override]'
      : 'font[face], span[style*="font-family"], [data-gb-font-override]';
  root.querySelectorAll(sel).forEach((node) => {
    if (!(node instanceof HTMLElement) || node === root) return;
    if (prop === "color") {
      node.style.removeProperty("color");
      node.removeAttribute("data-gb-color-override");
      if (node.tagName === "FONT") node.removeAttribute("color");
    } else {
      node.style.removeProperty("font-family");
      node.removeAttribute("data-gb-font-override");
      if (node.tagName === "FONT") node.removeAttribute("face");
    }
  });
}

/** Wrap exactly this range in a styled <span> (word / letter safe). */
function wrapRangeWithInlineStyles(
  idoc: Document,
  range: Range,
  styles: { color?: string; fontFamily?: string }
): HTMLSpanElement | null {
  const color = String(styles.color || "").trim();
  const fontFamily = String(styles.fontFamily || "").trim();
  if (!color && !fontFamily) return null;
  if (range.collapsed) return null;

  const span = idoc.createElement("span");
  if (color) markColorOverride(span, color);
  if (fontFamily) markFontOverride(span, fontFamily);

  try {
    const working = range.cloneRange();
    try {
      working.surroundContents(span);
    } catch {
      // Range splits elements — extract + reinsert is reliable
      const contents = working.extractContents();
      span.appendChild(contents);
      working.insertNode(span);
    }
  } catch {
    return null;
  }

  try {
    const sel = idoc.getSelection();
    const next = idoc.createRange();
    next.selectNodeContents(span);
    sel?.removeAllRanges();
    sel?.addRange(next);
  } catch {
    /* ignore */
  }
  return span;
}

/**
 * Apply color and/or font to:
 *  - exact text selection (word / letter / partial line), OR
 *  - the whole line/block when the caret has no selection
 */
function applyTextStyleInIframe(
  idoc: Document,
  savedRange: Range | null,
  styles: { color?: string; fontFamily?: string }
): void {
  const color = String(styles.color || "").trim();
  const fontFamily = String(styles.fontFamily || "").trim();
  if (!color && !fontFamily) return;

  // A non-collapsed saved range ALWAYS means "only this text" — never the whole line
  const intentionalPartial = Boolean(savedRange && !savedRange.collapsed);

  if (intentionalPartial && savedRange) {
    restoreIframeSelection(idoc, savedRange);
    const applied = wrapRangeWithInlineStyles(idoc, savedRange, { color, fontFamily });
    if (applied) return;
    // Fallback if wrap failed
    restoreIframeSelection(idoc, savedRange);
    try {
      idoc.execCommand("styleWithCSS", false, "true");
    } catch {
      /* ignore */
    }
    if (color) idoc.execCommand("foreColor", false, color);
    if (fontFamily) idoc.execCommand("fontName", false, fontFamily);
    return;
  }

  restoreIframeSelection(idoc, savedRange);
  try {
    idoc.execCommand("styleWithCSS", false, "true");
  } catch {
    /* older engines */
  }

  const sel = idoc.getSelection();
  const block = getBlockFromSelection(idoc);
  const anchor = getAnchorFromSelection(idoc);

  // Whole link only when caret is inside it, or the selection is the full link text
  if (anchor) {
    const linkText = (anchor.textContent || "").replace(/\s+/g, " ").trim();
    const selText =
      sel && !sel.isCollapsed && sel.rangeCount
        ? String(sel.getRangeAt(0).toString() || "").replace(/\s+/g, " ").trim()
        : "";
    const styleWholeLink =
      !sel ||
      sel.isCollapsed ||
      Boolean(selText && linkText && selText === linkText);
    if (styleWholeLink) {
      if (color) {
        markColorOverride(anchor, color);
        clearNestedInlineProp(anchor, "color");
      }
      if (fontFamily) {
        markFontOverride(anchor, fontFamily);
        clearNestedInlineProp(anchor, "font-family");
      }
      return;
    }
  }

  // Live selection covers the entire block text → style the block element
  const wholeBlock =
    block &&
    /^(H[1-6]|P|LI|BLOCKQUOTE|DIV|PRE)$/i.test(block.tagName) &&
    selectionCoversWholeBlock(sel, block);

  if (wholeBlock && block) {
    if (color) {
      markColorOverride(block, color);
      clearNestedInlineProp(block, "color");
    }
    if (fontFamily) {
      markFontOverride(block, fontFamily);
      clearNestedInlineProp(block, "font-family");
    }
    return;
  }

  // Caret only (no word selected) → style the whole line under the cursor
  if (!sel || !sel.rangeCount || sel.isCollapsed) {
    if (block && /^(H[1-6]|P|LI|BLOCKQUOTE|DIV|PRE)$/i.test(block.tagName)) {
      if (color) {
        markColorOverride(block, color);
        clearNestedInlineProp(block, "color");
      }
      if (fontFamily) {
        markFontOverride(block, fontFamily);
        clearNestedInlineProp(block, "font-family");
      }
    }
    return;
  }

  // Partial live selection — wrap only those characters
  try {
    const liveRange = sel.getRangeAt(0).cloneRange();
    if (wrapRangeWithInlineStyles(idoc, liveRange, { color, fontFamily })) return;
  } catch {
    /* fall through */
  }

  if (color) idoc.execCommand("foreColor", false, color);
  if (fontFamily) idoc.execCommand("fontName", false, fontFamily);

  // Normalize FONT tags → inline style + override marks
  restoreIframeSelection(idoc, savedRange || saveIframeSelection(idoc));
  const sel2 = idoc.getSelection();
  if (sel2 && sel2.rangeCount) {
    let n: Node | null = sel2.anchorNode;
    while (n && n !== idoc.body) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as HTMLElement;
        if (el.tagName === "FONT") {
          if (color || el.getAttribute("color")) {
            markColorOverride(el, color || el.getAttribute("color") || "#000");
          }
          if (fontFamily || el.getAttribute("face")) {
            markFontOverride(el, fontFamily || el.getAttribute("face") || "inherit");
          }
          break;
        }
        if (el.style?.color && color) {
          el.setAttribute("data-gb-color-override", "1");
        }
        if (el.style?.fontFamily && fontFamily) {
          el.setAttribute("data-gb-font-override", "1");
          el.style.setProperty("font-family", fontFamily);
        }
        if (el.style?.color || el.style?.fontFamily) break;
      }
      n = n.parentNode;
    }
  }
}

function applyColorInIframe(idoc: Document, savedRange: Range | null, color: string): void {
  applyTextStyleInIframe(idoc, savedRange, { color });
}

function applyFontInIframe(idoc: Document, savedRange: Range | null, fontFamily: string): void {
  applyTextStyleInIframe(idoc, savedRange, { fontFamily });
}

/** Read font-family from selection / block (normalized for the toolbar). */
function readSelectionFontFamily(idoc: Document, block: HTMLElement | null): string {
  const sel = idoc.getSelection();
  let node: Node | null = sel?.anchorNode || null;
  if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
  while (node && node !== idoc.body) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.getAttribute("data-gb-font-override") === "1" && el.style?.fontFamily) {
        return el.style.fontFamily;
      }
      if (el.style?.fontFamily) return el.style.fontFamily;
      if (el.tagName === "FONT" && el.getAttribute("face")) {
        return el.getAttribute("face") || "";
      }
    }
    node = node.parentNode;
  }
  if (block?.style?.fontFamily) return block.style.fontFamily;
  try {
    const q = String(idoc.queryCommandValue("fontName") || "").trim();
    if (q && q.toLowerCase() !== "false") return q.replace(/^['"]|['"]$/g, "");
  } catch {
    /* ignore */
  }
  return "";
}

function rangeStillInDocument(idoc: Document, range: Range | null): boolean {
  if (!range) return false;
  try {
    const root = idoc.getElementById("root") || idoc.body;
    if (!root) return false;
    return root.contains(range.commonAncestorContainer);
  } catch {
    return false;
  }
}

/**
 * Expand a collapsed caret to the whole line/block under the cursor.
 * Does NOT change an existing word/letter selection.
 * Returns didExpand so callers can put the caret back (avoid leaving the line selected).
 */
function expandCollapsedSelectionToBlock(
  idoc: Document
): { range: Range; didExpand: boolean } | null {
  const sel = idoc.getSelection();
  if (!sel) return null;
  const block = getBlockFromSelection(idoc);
  if (!block || !/^(H[1-6]|P|LI|BLOCKQUOTE|DIV|PRE)$/i.test(block.tagName)) return null;
  if (!sel.isCollapsed && sel.rangeCount > 0) {
    try {
      return { range: sel.getRangeAt(0).cloneRange(), didExpand: false };
    } catch {
      return null;
    }
  }
  try {
    const range = idoc.createRange();
    range.selectNodeContents(block);
    sel.removeAllRanges();
    sel.addRange(range);
    return { range: range.cloneRange(), didExpand: true };
  } catch {
    return null;
  }
}

/** Apply or update a link using a previously saved iframe Range. */
function applyLinkInIframe(idoc: Document, savedRange: Range | null, rawUrl: string): boolean {
  const href = normalizeHref(rawUrl);
  restoreIframeSelection(idoc, savedRange);

  const sel = idoc.getSelection();
  if (!sel) return false;

  // Capture color BEFORE createLink (wrapping can reshuffle markup)
  const priorColor = getColorAroundSelection(idoc);

  // Empty URL → unlink
  if (!href) {
    idoc.execCommand("unlink", false);
    return true;
  }

  // Caret inside existing link (no range text) → update href (keep existing color)
  const existing = getAnchorFromSelection(idoc);
  if (existing && sel.isCollapsed) {
    enhanceAnchor(existing, href, priorColor || existing.style.color || undefined);
    return true;
  }

  // Collapsed caret with no existing link:
  // - If we had a saved range that restored successfully but is empty → insert link at caret
  // - If selection was never captured (toolbar focus stole it) → fail so UI can prompt
  if (!sel.rangeCount) return false;
  if (sel.isCollapsed) {
    if (!savedRange) return false;
    const a = idoc.createElement("a");
    enhanceAnchor(a, href, priorColor || undefined);
    a.textContent = href.replace(/^https?:\/\//i, "");
    const range = sel.getRangeAt(0);
    range.insertNode(a);
    const after = idoc.createRange();
    after.setStartAfter(a);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    return true;
  }

  // Has text selection → wrap with createLink, then normalize anchors in the selection
  const ok = idoc.execCommand("createLink", false, href);
  if (!ok) {
    // Manual wrap fallback
    try {
      const range = sel.getRangeAt(0);
      const a = idoc.createElement("a");
      enhanceAnchor(a, href, priorColor || undefined);
      a.appendChild(range.extractContents());
      range.insertNode(a);
      sel.removeAllRanges();
      const selectLink = idoc.createRange();
      selectLink.selectNodeContents(a);
      sel.addRange(selectLink);
    } catch {
      return false;
    }
  }

  // Ensure target/rel + color on anchors that intersect the current selection
  const range = sel.rangeCount ? sel.getRangeAt(0) : null;
  const anchors = Array.from(idoc.body.querySelectorAll("a[href]")) as HTMLAnchorElement[];
  for (const a of anchors) {
    if (!range) {
      if (a.getAttribute("href") === href) enhanceAnchor(a, href, priorColor || a.style.color || undefined);
      continue;
    }
    try {
      if (
        range.intersectsNode(a) ||
        a.contains(range.commonAncestorContainer) ||
        range.commonAncestorContainer === a ||
        a.contains(sel.anchorNode!) ||
        a.contains(sel.focusNode!)
      ) {
        enhanceAnchor(a, href, priorColor || a.style.color || undefined);
      }
    } catch {
      if (a.getAttribute("href") === href) enhanceAnchor(a, href, priorColor || a.style.color || undefined);
    }
  }
  return true;
}

function unlinkInIframe(idoc: Document, savedRange: Range | null): void {
  restoreIframeSelection(idoc, savedRange);
  const existing = getAnchorFromSelection(idoc);
  if (existing && idoc.getSelection()?.isCollapsed) {
    // Unwrap <a> keeping children
    const parent = existing.parentNode;
    if (!parent) return;
    while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
    parent.removeChild(existing);
    return;
  }
  idoc.execCommand("unlink", false);
}









function applyFinalImageUrl(img: HTMLImageElement, newUrl: string) {
  // Update the <img> itself
  img.src = newUrl;
  img.setAttribute("srcset", newUrl);      // single candidate keeps it simple
  // keep existing sizes or default if missing
  if (!img.getAttribute("sizes")) img.setAttribute("sizes", "100vw");

  // If inside <picture>, update all <source> candidates too
  const pic =
    img.parentElement?.tagName === "PICTURE"
      ? (img.parentElement as HTMLPictureElement)
      : null;

  if (pic) {
    const sources = Array.from(pic.querySelectorAll("source"));
    sources.forEach((s) => {
      s.setAttribute("srcset", newUrl);
      if (!s.getAttribute("sizes")) s.setAttribute("sizes", "100vw");
    });
  }
}

// Re-apply our layout as !important so it beats outside CSS
function applyImportantLayout(img: HTMLImageElement) {
  const { align, size } = parseTokens(img.className || "");
  // derive float/margin/display/clear
  let floatVal = "none";
  let marginVal = ".75rem 0";
  let displayVal = "block";
  let clearVal = "none";
  if (align === "img-float-left") {
    floatVal = "left";
    marginVal = "0.25rem 0.85rem 0.5rem 0";
  } else if (align === "img-float-right") {
    floatVal = "right";
    marginVal = "0.25rem 0 0.5rem 0.85rem";
  } else if (align === "img-center") {
    floatVal = "none";
    marginVal = ".75rem auto";
  }
  const pct = size.split("-")[1] || "100";

  // apply with !important
  img.style.setProperty("height", "auto", "important");
  img.style.setProperty("float", floatVal, "important");
  img.style.setProperty("margin", marginVal, "important");
  img.style.setProperty("display", displayVal, "important");
  img.style.setProperty("clear", clearVal, "important");
  img.style.setProperty("width", `${pct}%`, "important");
  img.style.setProperty("max-width", `${pct}%`, "important");
}


/* ---------------------- Component ---------------------- */
export function RichTextEditor({
  value,
  onChange,
  initialHTML,
  uploadUrl = DEFAULT_UPLOAD_URL,
  disabled = false,
  height = 420,
  themePreview = null,
  projectId = null,
}: RichTextEditorProps) {
  // Split incoming full document
  const initialFull =
    value ??
    initialHTML ??
    '<!doctype html><html lang="en"><head></head><body><p>Start writing…</p></body></html>';
  const init = splitHeadBody(initialFull);

  const [doctype, setDoctype] = useState(init.doctype);
  const [htmlAttrs, setHtmlAttrs] = useState(init.htmlAttrs);
  const [headHtml, setHeadHtml] = useState(init.headHtml);
  const [bodyHtml, setBodyHtml] = useState(init.bodyHtml);

  // Track last full we emitted to avoid echo loops
  const lastPushedRef = useRef<string | null>(null);

  // Live edit shield (ignore external value updates while actively editing)
  const [isLiveEditing, setIsLiveEditing] = useState(false);
  const liveEditTimerRef = useRef<number | null>(null);
  const bumpLiveEditing = () => {
    setIsLiveEditing(true);
    if (liveEditTimerRef.current) window.clearTimeout(liveEditTimerRef.current);
    liveEditTimerRef.current = window.setTimeout(() => setIsLiveEditing(false), 900);
  };

  // If parent updates `value`, accept only when not live-editing (in visual)
  const [activeTab, setActiveTab] = useState<RteTab>("visual");
  useEffect(() => {
    if (typeof value !== "string") return;
    if (isLiveEditing && activeTab === "visual") return; // shield
    const currentFull = joinHeadBody(doctype, htmlAttrs, headHtml, bodyHtml);
    if (value === lastPushedRef.current || value === currentFull) return;
    const s = splitHeadBody(value);
    setDoctype(s.doctype);
    setHtmlAttrs(s.htmlAttrs);
    setHeadHtml(s.headHtml);
    setBodyHtml(s.bodyHtml);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // UI state
  const [textColor, setTextColor] = useState("#000000");
  /** Draft hex while typing/pasting — synced from selection when not editing. */
  const [colorDraft, setColorDraft] = useState("#000000");
  const colorDraftFocusedRef = useRef(false);
  const [textFont, setTextFont] = useState("");
  const fontSelectFocusedRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  /** Saved iframe Range — clicking toolbar would otherwise clear the selection. */
  const savedSelectionRef = useRef<Range | null>(null);
  /** Last non-collapsed word/letter selection — survives toolbar focus steal. */
  const stickyTextSelectionRef = useRef<Range | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  // Toolbar states
  const [currentFormat, setCurrentFormat] = useState("p");
  const [currentAlign, setCurrentAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBullet, setIsBullet] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [imageNode, setImageNode] = useState<HTMLImageElement | null>(null);
  /** Bumps when iframe document is rewritten so toolbar listeners re-bind. */
  const [iframeEpoch, setIframeEpoch] = useState(0);

  // HTML tab draft buffer (controlled)
  const [htmlDraft, setHtmlDraft] = useState<string>(
    joinHeadBody(doctype, htmlAttrs, headHtml, bodyHtml)
  );

  // While editing in HTML tab, live-emit the draft so parent can save it
  useEffect(() => {
    if (activeTab !== "html") return;
    const full = htmlDraft;
    lastPushedRef.current = full;
    onChange?.(full);
  }, [htmlDraft, activeTab, onChange]);

  // Keep draft in sync when parts change, except while actively typing in HTML tab
  useEffect(() => {
    if (activeTab === "html") return;
    setHtmlDraft(joinHeadBody(doctype, htmlAttrs, headHtml, bodyHtml));
  }, [doctype, htmlAttrs, headHtml, bodyHtml, activeTab]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const changeOriginRef = useRef<"visual" | "html" | null>(null);
  /** Prevent React from rewriting iframe innerHTML after editor-originated edits (kills undo). */
  const skipNextBodyPatchRef = useRef(false);
  /** Custom undo/redo — browser undo dies when React syncs DOM. */
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const historyTimerRef = useRef<number | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const HISTORY_LIMIT = 80;

  /** Resolved theme — never leave the visual editor unstyled. */
  const [internalTheme, setInternalTheme] = useState<BlogEditorThemePreview | null>(null);
  const editorProjectId = normalizeEditorProjectId(projectId);

  const parentThemeMatches =
    themePreview &&
    (!themePreview.projectId || themePreview.projectId === editorProjectId);

  const resolvedTheme =
    parentThemeMatches &&
    (themePreview?.proseCss || themePreview?.titleColor || themePreview?.accentColor)
      ? themePreview
      : internalTheme &&
          (!internalTheme.projectId || internalTheme.projectId === editorProjectId)
        ? internalTheme
        : null;

  /** Prefer API proseCss (exact same rules as live site). Tokens only as fallback. */
  const resolvedThemeCss = useMemo(() => {
    const apiCss = String(resolvedTheme?.proseCss || "").trim();
    if (apiCss) {
      const extra = String(resolvedTheme?.blogCss || "").trim();
      // Avoid double-injecting blogCss if already baked into proseCss from API
      const blogExtra =
        extra && !apiCss.includes(extra.slice(0, Math.min(40, extra.length)))
          ? `\n${extra}`
          : "";
      return `${apiCss}\n${EDITOR_CHROME_CSS}${blogExtra}`;
    }
    return buildDefaultEditorThemeCss(resolvedTheme);
  }, [resolvedTheme]);

  /** Don't paint crimson defaults while the project theme is still loading. */
  const themePending = Boolean(editorProjectId) && !resolvedTheme;

  const getIdoc = () => iframeRef.current?.contentDocument || null;
  const getRoot = () => getIdoc()?.getElementById("root") || null;

  const applyThemeToIframe = useCallback(() => {
    const idoc = getIdoc();
    if (!idoc?.head) return false;
    let styleEl = idoc.getElementById("gb-blog-editor-theme") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = idoc.createElement("style");
      styleEl.id = "gb-blog-editor-theme";
      idoc.head.appendChild(styleEl);
    }
    styleEl.textContent = resolvedThemeCss;

    const fontsUrl = EDITOR_GOOGLE_FONTS_URL;
    if (fontsUrl) {
      let linkEl = idoc.getElementById("gb-blog-editor-fonts") as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = idoc.createElement("link");
        linkEl.id = "gb-blog-editor-fonts";
        linkEl.rel = "stylesheet";
        idoc.head.insertBefore(linkEl, styleEl);
      }
      if (linkEl.getAttribute("href") !== fontsUrl) {
        linkEl.setAttribute("href", fontsUrl);
      }
    }

    const root = idoc.getElementById("root");
    if (root && !root.classList.contains("blog-prose")) root.classList.add("blog-prose");
    return true;
  }, [resolvedThemeCss, resolvedTheme?.googleFontsUrl]);

  // Parent theme late? Fetch here too so Edit Post never stays plain.
  useEffect(() => {
    if (
      parentThemeMatches &&
      (themePreview?.proseCss || themePreview?.titleColor || themePreview?.accentColor)
    ) {
      return;
    }
    if (!editorProjectId) {
      setInternalTheme({
        accentColor: "#E11D48",
        linkColor: "#E11D48",
        titleColor: "#0F172A",
        textColor: "#374151",
        surfaceColor: "#FFFFFF",
        titleFont: '"Poppins", sans-serif',
        bodyFont: '"Inter", sans-serif',
        proseCss: buildDefaultEditorThemeCss(null),
        googleFontsUrl:
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Poppins:wght@300;400;700;900&display=swap",
        projectId: "",
      });
      return;
    }
    let cancelled = false;
    setInternalTheme(null);
    (async () => {
      try {
        const { http } = await import("../../config.js");
        const token = localStorage.getItem("token");
        const res = await http.get(`/blogEditorTheme/${editorProjectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (cancelled) return;
        const data = res.data?.data || {};
        const titleFont = String(data.titleFont || "").trim();
        const bodyFont = String(data.bodyFont || "").trim();
        setInternalTheme({
          proseCss: String(data.proseCss || ""),
          googleFontsUrl: String(data.googleFontsUrl || ""),
          titleColor: data.titleColor,
          textColor: data.textColor,
          linkColor: data.linkColor || data.accentColor,
          accentColor: data.accentColor,
          surfaceColor: data.surfaceColor || "#FFFFFF",
          blogCss: data.blogCss || "",
          titleFont: titleFont && titleFont !== "inherit" ? titleFont : '"Poppins", sans-serif',
          bodyFont: bodyFont && bodyFont !== "inherit" ? bodyFont : '"Inter", sans-serif',
          projectId: editorProjectId,
        });
      } catch {
        if (cancelled) return;
        setInternalTheme({
          accentColor: "#E11D48",
          linkColor: "#E11D48",
          titleColor: "#0F172A",
          textColor: "#374151",
          surfaceColor: "#FFFFFF",
          titleFont: '"Poppins", sans-serif',
          bodyFont: '"Inter", sans-serif',
          proseCss: buildDefaultEditorThemeCss(null),
          googleFontsUrl:
            "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Poppins:wght@300;400;700;900&display=swap",
          projectId: editorProjectId,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    editorProjectId,
    parentThemeMatches,
    themePreview?.proseCss,
    themePreview?.titleColor,
    themePreview?.accentColor,
  ]);

  // Theme CSS only — never re-run on bodyHtml (that was thrashing the iframe)
  useEffect(() => {
    if (activeTab !== "visual") return;
    if (themePending) return;
    applyThemeToIframe();
    const t = window.setTimeout(() => applyThemeToIframe(), 50);
    return () => window.clearTimeout(t);
  }, [activeTab, resolvedThemeCss, applyThemeToIframe, iframeEpoch, themePending]);

  const refreshHistoryFlags = useCallback(() => {
    const idx = historyIndexRef.current;
    const len = historyRef.current.length;
    setCanUndo(idx > 0);
    setCanRedo(idx >= 0 && idx < len - 1);
  }, []);

  const resetHistory = useCallback(
    (html: string) => {
      if (historyTimerRef.current) {
        window.clearTimeout(historyTimerRef.current);
        historyTimerRef.current = null;
      }
      historyRef.current = [String(html || "")];
      historyIndexRef.current = 0;
      refreshHistoryFlags();
    },
    [refreshHistoryFlags]
  );

  const pushHistory = useCallback(
    (html: string) => {
      const nextHtml = String(html || "");
      const h = historyRef.current;
      const idx = historyIndexRef.current;
      if (idx >= 0 && h[idx] === nextHtml) {
        refreshHistoryFlags();
        return;
      }
      const trimmed = h.slice(0, idx + 1);
      trimmed.push(nextHtml);
      while (trimmed.length > HISTORY_LIMIT) trimmed.shift();
      historyRef.current = trimmed;
      historyIndexRef.current = trimmed.length - 1;
      refreshHistoryFlags();
    },
    [refreshHistoryFlags]
  );

  const scheduleHistoryPush = useCallback(
    (html: string) => {
      if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
      historyTimerRef.current = window.setTimeout(() => {
        historyTimerRef.current = null;
        pushHistory(html);
      }, 400);
    },
    [pushHistory]
  );

  const emitFull = (body: string) => {
    const full = joinHeadBody(doctype, htmlAttrs, headHtml, body);
    if (full !== lastPushedRef.current) {
      lastPushedRef.current = full;
      onChange?.(full);
    }
  };

  const focusEditor = () => {
    const idoc = getIdoc();
    const root = idoc?.getElementById("root") as HTMLElement | null;
    try {
      root?.focus?.();
    } catch {
      /* ignore */
    }
  };

  const markSkipBodyPatch = () => {
    skipNextBodyPatchRef.current = true;
    // Clear even when setBodyHtml is a no-op (effect would not run)
    window.requestAnimationFrame(() => {
      skipNextBodyPatchRef.current = false;
    });
  };

  /**
   * Sync React state from iframe without patching innerHTML back
   * (patching innerHTML clears the editing history).
   */
  const commitFromIframe = (historyMode: "push" | "schedule" | "none" = "push") => {
    const root = getRoot();
    if (!root) return;
    const html = root.innerHTML;
    markSkipBodyPatch();
    changeOriginRef.current = "visual";
    setBodyHtml((prev) => (prev === html ? prev : html));
    emitFull(html);
    if (historyMode === "push") pushHistory(html);
    else if (historyMode === "schedule") scheduleHistoryPush(html);
    window.setTimeout(() => {
      if (changeOriginRef.current === "visual") changeOriginRef.current = null;
    }, 0);
  };

  // Helper to get currently selected image
  const getSelectedImage = (): HTMLImageElement | null => {
    const idoc = getIdoc();
    if (!idoc) return null;
    
    const sel = idoc.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    
    const range = sel.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    
    // If text node, get parent element
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    const element = node as HTMLElement;
    
    // Check if the node itself is an image
    if (element?.tagName === 'IMG') {
      return element as HTMLImageElement;
    }
    
    // Check if an image is selected within the range
    if (range.startContainer === range.endContainer && range.startOffset === range.endOffset - 1) {
      const selectedNode = range.startContainer.childNodes[range.startOffset];
      if (selectedNode?.nodeType === Node.ELEMENT_NODE && (selectedNode as HTMLElement).tagName === 'IMG') {
        return selectedNode as HTMLImageElement;
      }
    }
    
    // Look for selected image in the range
    const images = element?.querySelectorAll?.('img') || [];
    for (const img of images) {
      if (range.intersectsNode(img)) {
        return img as HTMLImageElement;
      }
    }
    
    return null;
  };

  // Write iframe document — always branded (never plain system black/white)
  const writeIframeDoc = (head: string, body: string) => {
    const themeCss = resolvedThemeCss;
    const fontsUrl = EDITOR_GOOGLE_FONTS_URL;
    const fontsLink = `<link id="gb-blog-editor-fonts" rel="stylesheet" href="${String(fontsUrl).replace(/"/g, "")}" />`;
    // Strip old editor/system styles from saved post <head> so they can't override theme
    const cleanHead = stripConflictingHeadStyles(head);
    const docHtml = `${doctype || "<!doctype html>"}
<html ${htmlAttrs || 'lang="en"'}>
<head>
<meta charset="utf-8">
${fontsLink}
${cleanHead || ""}
<style id="gb-blog-editor-theme">${themeCss}</style>
</head>
<body>
  <main id="root" class="blog-prose" contenteditable="${!disabled}">${body || ""}</main>
  <script>
    (function(){
      const root = document.getElementById('root');
      function stampGbClasses(el){
        if (!el) return;
        var map = {
          H1:'gb-h1',H2:'gb-h2',H3:'gb-h3',H4:'gb-h4',H5:'gb-h5',H6:'gb-h6',
          P:'gb-p',A:'gb-link',UL:'gb-ul',OL:'gb-ol',LI:'gb-li',
          BLOCKQUOTE:'gb-quote',STRONG:'gb-strong',B:'gb-strong',EM:'gb-em',I:'gb-em',
          IMG:'gb-img',HR:'gb-hr',DETAILS:'gb-faq',SUMMARY:'gb-faq-q',CODE:'gb-code'
        };
        var nodes = el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,ul,ol,li,blockquote,strong,b,em,i,img,hr,details,summary,code');
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          var cls = map[node.tagName];
          if (!cls) continue;
          if (!node.classList.contains(cls)) node.classList.add(cls);
          if (!node.classList.contains('gb-el')) node.classList.add('gb-el');
        }
      }
      /** Convert FAQ h3+p (and legacy div.gb-faq) into <details> accordions. */
      function wrapFaqAccordions(el){
        if (!el) return;
        // Upgrade legacy static cards
        el.querySelectorAll('div.gb-faq').forEach(function(card){
          if (card.querySelector('details, summary')) return;
          var h3 = card.querySelector('h3');
          if (!h3) return;
          var details = document.createElement('details');
          details.className = 'gb-faq gb-el';
          details.setAttribute('name', 'gb-blog-faq');
          var summary = document.createElement('summary');
          summary.className = 'gb-faq-q gb-el';
          summary.innerHTML = h3.innerHTML;
          var qText = (h3.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase().replace(/[?？]/g, '');
          var ans = document.createElement('div');
          ans.className = 'gb-faq-a gb-el';
          Array.prototype.slice.call(card.children).forEach(function(n){
            if (n === h3 || n.tagName === 'H3') return;
            if (n.tagName === 'P') {
              var pText = (n.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase().replace(/[?？]/g, '');
              if (qText && pText === qText) return;
            }
            ans.appendChild(n.cloneNode(true));
          });
          if (!ans.textContent || !ans.textContent.trim()) return;
          details.appendChild(summary);
          details.appendChild(ans);
          card.parentNode && card.parentNode.replaceChild(details, card);
        });
        // Clean existing details that still have h3/question inside answer
        el.querySelectorAll('details.gb-faq').forEach(function(det){
          var sum = det.querySelector('summary');
          if (!sum) return;
          var qText = (sum.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase().replace(/[?？]/g, '');
          var ans = det.querySelector('.gb-faq-a') || null;
          if (!ans) {
            // Build answer box from non-summary children
            ans = document.createElement('div');
            ans.className = 'gb-faq-a gb-el';
            Array.prototype.slice.call(det.childNodes).forEach(function(n){
              if (n === sum || (n.nodeType === 1 && n.tagName === 'SUMMARY')) return;
              ans.appendChild(n);
            });
            det.appendChild(ans);
          }
          ans.querySelectorAll('h1,h2,h3,h4,h5,h6,summary').forEach(function(h){ h.remove(); });
          Array.prototype.slice.call(ans.querySelectorAll('p')).forEach(function(p){
            var pText = (p.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase().replace(/[?？]/g, '');
            if (qText && pText === qText) p.remove();
          });
        });
        // Find FAQ heading then wrap following h3+p siblings
        var headings = el.querySelectorAll('h2');
        headings.forEach(function(h2){
          if (!/^\\s*FAQ\\s*$/i.test((h2.textContent || '').trim())) return;
          var node = h2.nextSibling;
          while (node) {
            if (node.nodeType === 1 && node.tagName === 'H2') break;
            var next = node.nextSibling;
            if (node.nodeType === 1 && node.tagName === 'H3') {
              var answers = [];
              var cursor = next;
              while (cursor && cursor.nodeType === 1 && cursor.tagName === 'P') {
                answers.push(cursor);
                cursor = cursor.nextSibling;
              }
              if (answers.length) {
                var details = document.createElement('details');
                details.className = 'gb-faq gb-el';
                details.setAttribute('name', 'gb-blog-faq');
                var summary = document.createElement('summary');
                summary.className = 'gb-faq-q gb-el';
                summary.innerHTML = node.innerHTML;
                var ans = document.createElement('div');
                ans.className = 'gb-faq-a gb-el';
                answers.forEach(function(p){ ans.appendChild(p); });
                details.appendChild(summary);
                details.appendChild(ans);
                el.insertBefore(details, node);
                el.removeChild(node);
                next = cursor;
              }
            }
            node = next;
          }
        });
        // Match live blog: first FAQ item open by default
        var faqs = el.querySelectorAll('details.gb-faq');
        if (faqs.length) {
          var anyOpen = false;
          faqs.forEach(function(d){ if (d.open) anyOpen = true; });
          if (!anyOpen) faqs[0].open = true;
        }
      }
      stampGbClasses(root);
      wrapFaqAccordions(root);
      stampGbClasses(root);
      try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (err) {}
      try { document.execCommand('styleWithCSS', false, 'true'); } catch (err) {}

      function closestBlock(node){
        var r = document.getElementById('root');
        while (node && node !== r) {
          if (node.nodeType === 1) {
            var t = node.tagName;
            if (/^(H[1-6]|P|LI|BLOCKQUOTE|DIV|PRE)$/i.test(t) && node.id !== 'root') return node;
          }
          node = node.parentNode;
        }
        return null;
      }
      function placeCaretAtStart(el){
        var sel = window.getSelection();
        if (!sel || !el) return;
        var range = document.createRange();
        if (!el.childNodes.length) el.appendChild(document.createElement('br'));
        range.setStart(el, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      function ensureBreak(el){
        if (!el) return;
        if (!(el.textContent || '').replace(/\u00a0/g, '').trim()) {
          el.innerHTML = '<br>';
        }
      }
      /**
       * Word / WordPress Enter:
       * - Split current block at caret into a NEW visible block
       * - Leaving a heading always creates a paragraph (not another heading)
       */
      function splitBlockAtCaret(block){
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount || !block || !block.parentNode) return false;
        var caret = sel.getRangeAt(0);
        var sc = caret.startContainer;
        var so = caret.startOffset;
        try { caret.deleteContents(); } catch (err) {}

        var after = document.createRange();
        try {
          after.selectNodeContents(block);
          after.setStart(sc, Math.min(so, sc.nodeType === 3 ? (sc.nodeValue || '').length : (sc.childNodes ? sc.childNodes.length : 0)));
        } catch (err) {
          after.selectNodeContents(block);
          after.collapse(false);
        }
        var frag;
        try { frag = after.extractContents(); } catch (err) { frag = document.createDocumentFragment(); }

        var newTag = /^H[1-6]$/i.test(block.tagName) ? 'P' : block.tagName;
        if (/^BLOCKQUOTE$/i.test(block.tagName) && !(block.textContent || '').trim() && !(frag.textContent || '').trim()) {
          newTag = 'P';
        }
        var neu = document.createElement(newTag);
        var map = { H1:'gb-h1',H2:'gb-h2',H3:'gb-h3',H4:'gb-h4',H5:'gb-h5',H6:'gb-h6',P:'gb-p',BLOCKQUOTE:'gb-quote',DIV:'gb-p',PRE:'gb-p' };
        var cls = map[neu.tagName] || 'gb-p';
        neu.className = cls + ' gb-el';
        neu.appendChild(frag);
        ensureBreak(block);
        ensureBreak(neu);
        if (block.nextSibling) block.parentNode.insertBefore(neu, block.nextSibling);
        else block.parentNode.appendChild(neu);
        placeCaretAtStart(neu);
        return true;
      }

      const send = () => {
        stampGbClasses(root);
        parent.postMessage({ type: 'RTE_BODY_HTML', html: root.innerHTML }, '*');
      };
      root.addEventListener('input', send);
      root.addEventListener('blur', () => {
        wrapFaqAccordions(root);
        stampGbClasses(root);
        send();
      }, true);

      const ping = () => parent.postMessage({ type: 'RTE_PING_EDIT' }, '*');
      ['focusin','keydown','input','paste','drop','mouseup','click'].forEach(ev => {
        root.addEventListener(ev, ping);
      });

      // Enhanced image selection handling
      root.addEventListener('click', (e) => {
        const t = e.target;
        if (t && t.tagName === 'IMG') {
          try {
            root.querySelectorAll('img.selected').forEach(img => img.classList.remove('selected'));
            t.classList.add('selected');
            const sel = window.getSelection();
            const r = document.createRange();
            r.selectNode(t);
            sel.removeAllRanges();
            sel.addRange(r);
            parent.postMessage({ type: 'RTE_IMAGE_SELECTED', img: t }, '*');
          } catch(err) {
            console.log('Selection error:', err);
          }
        } else {
          root.querySelectorAll('img.selected').forEach(img => img.classList.remove('selected'));
          parent.postMessage({ type: 'RTE_IMAGE_DESELECTED' }, '*');
        }
      });

      root.addEventListener('contextmenu', (e) => {
        const t = e.target;
        if (t && t.tagName === 'IMG') {
          e.preventDefault();
          parent.postMessage({ type: 'RTE_REQ_REPLACE', img: t }, '*');
        }
      });
      
      ['selectionchange', 'keyup', 'mouseup'].forEach(ev => {
        document.addEventListener(ev, () => {
          parent.postMessage({ type: 'RTE_SELECTION_CHANGE' }, '*');
        });
      });

      // Enter + undo/redo (WordPress-style block splits)
      root.addEventListener('keydown', (e) => {
        const mod = e.metaKey || e.ctrlKey;
        if (mod) {
          const key = String(e.key || '').toLowerCase();
          if (key === 'z' && !e.shiftKey) {
            e.preventDefault();
            parent.postMessage({ type: 'RTE_UNDO' }, '*');
            return;
          }
          if (key === 'y' || (key === 'z' && e.shiftKey)) {
            e.preventDefault();
            parent.postMessage({ type: 'RTE_REDO' }, '*');
          }
          return;
        }

        if (e.key !== 'Enter' || e.isComposing) return;

        if (e.shiftKey) {
          e.preventDefault();
          try { document.execCommand('insertLineBreak'); } catch (err) {}
          send();
          return;
        }

        var sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        var anchor = sel.anchorNode;
        var el = anchor && anchor.nodeType === 1 ? anchor : (anchor && anchor.parentElement);
        if (el && el.closest && el.closest('summary')) {
          e.preventDefault();
          return;
        }

        var block = closestBlock(anchor);
        if (block && /^LI$/i.test(block.tagName)) return;

        e.preventDefault();
        if (!block) {
          try { document.execCommand('formatBlock', false, 'p'); } catch (err) {}
          block = closestBlock(window.getSelection() && window.getSelection().anchorNode);
        }
        if (block && splitBlockAtCaret(block)) {
          stampGbClasses(root);
          send();
          return;
        }
        try {
          document.execCommand('insertParagraph');
        } catch (err) {
          var p = document.createElement('p');
          p.className = 'gb-p gb-el';
          p.innerHTML = '<br>';
          root.appendChild(p);
          placeCaretAtStart(p);
        }
        stampGbClasses(root);
        send();
      });
    })();
  </script>
</body>
</html>`;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const idoc = iframe.contentDocument;
    if (!idoc) return;
    idoc.open();
    idoc.write(docHtml);
    idoc.close();
    // Re-assert theme after write (some browsers clear styles briefly)
    window.setTimeout(() => applyThemeToIframe(), 0);
    setIframeEpoch((n) => n + 1);
  };

  // Rebuild iframe only when switching to visual or structure/theme changes (NOT bodyHtml)
  useEffect(() => {
    if (activeTab !== "visual") return;
    // Wait for project theme — painting defaults first is what caused intermittent wrong themes
    if (themePending) return;
    writeIframeDoc(headHtml, bodyHtml);
    if (historyRef.current.length === 0) resetHistory(bodyHtml);
  }, [activeTab, headHtml, htmlAttrs, disabled, doctype, resolvedThemeCss, themePending]); // bodyHtml intentionally excluded

  // Patch body without rewriting doc when body changes externally
  useEffect(() => {
    if (activeTab !== "visual") return;
    if (skipNextBodyPatchRef.current) {
      skipNextBodyPatchRef.current = false;
      return;
    }
    if (changeOriginRef.current === "visual") return;
    const root = getRoot();
    if (root && root.innerHTML !== bodyHtml) {
      root.innerHTML = bodyHtml;
      resetHistory(bodyHtml);
    } else if (historyRef.current.length === 0) {
      resetHistory(bodyHtml);
    }
  }, [bodyHtml, activeTab, resetHistory]);

  const syncToolbarFromDocument = useCallback((doc: Document) => {
    try {
      setIsBold(!!doc.queryCommandState("bold"));
      setIsItalic(!!doc.queryCommandState("italic"));
      setIsUnderline(!!doc.queryCommandState("underline"));
      setIsBullet(!!doc.queryCommandState("insertUnorderedList"));
      setIsOrdered(!!doc.queryCommandState("insertOrderedList"));
    } catch {
      /* ignore */
    }

    const block = getBlockFromSelection(doc);
    const format = readFormatFromBlock(block, doc);
    setCurrentFormat(format);
    if (format === "ul") setIsBullet(true);
    if (format === "ol") setIsOrdered(true);

    setCurrentAlign(readAlignFromBlock(block, doc));
    const nextColor = readSelectionTextColor(doc, block);
    setTextColor(nextColor);
    if (!colorDraftFocusedRef.current) setColorDraft(nextColor);
    const nextFont = readSelectionFontFamily(doc, block);
    if (!fontSelectFocusedRef.current) setTextFont(nextFont);

    const anchor = getAnchorFromSelection(doc);
    setIsLink(Boolean(anchor?.getAttribute("href")));

    const sel = doc.getSelection();
    const root = doc.getElementById("root");
    // Only refresh sticky selection while the iframe editor actually has focus.
    // Blur/selectionclear from clicking the color picker must NOT wipe a word selection.
    const editorFocused =
      typeof doc.hasFocus === "function"
        ? doc.hasFocus()
        : Boolean(
            root &&
              doc.activeElement &&
              (doc.activeElement === root || root.contains(doc.activeElement))
          );
    if (sel && sel.rangeCount > 0 && root && editorFocused) {
      try {
        const live = sel.getRangeAt(0).cloneRange();
        savedSelectionRef.current = live;
        if (!live.collapsed) {
          stickyTextSelectionRef.current = live.cloneRange();
        } else {
          stickyTextSelectionRef.current = null;
        }
      } catch {
        /* ignore */
      }
    }

    const imgElement = getSelectedImage();
    if (imgElement) ensureImageTokensAndStyle(imgElement);
    setImageNode(imgElement);
  }, []);

  const restoreHistoryAt = useCallback(
    (index: number) => {
      const html = historyRef.current[index];
      if (html == null) return;
      historyIndexRef.current = index;
      refreshHistoryFlags();
      const idoc = getIdoc();
      const root = getRoot();
      if (!root || !idoc) return;
      focusEditor();
      markSkipBodyPatch();
      changeOriginRef.current = "visual";
      if (root.innerHTML !== html) root.innerHTML = html;
      setBodyHtml(html);
      emitFull(html);
      window.setTimeout(() => {
        changeOriginRef.current = null;
        syncToolbarFromDocument(idoc);
      }, 0);
    },
    [refreshHistoryFlags, syncToolbarFromDocument]
  );

  const flushPendingHistory = useCallback(() => {
    if (!historyTimerRef.current) return;
    window.clearTimeout(historyTimerRef.current);
    historyTimerRef.current = null;
    const root = getRoot();
    if (root) pushHistory(root.innerHTML);
  }, [pushHistory]);

  const undoEdit = useCallback(() => {
    flushPendingHistory();
    if (historyIndexRef.current <= 0) return;
    restoreHistoryAt(historyIndexRef.current - 1);
  }, [flushPendingHistory, restoreHistoryAt]);

  const redoEdit = useCallback(() => {
    if (historyTimerRef.current) {
      window.clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    }
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    restoreHistoryAt(historyIndexRef.current + 1);
  }, [restoreHistoryAt]);

  // Receive edits & pings & replace requests from iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e?.data?.type === "RTE_PING_EDIT") {
        bumpLiveEditing();
        return;
      }
      if (e?.data?.type === "RTE_BODY_HTML") {
        bumpLiveEditing();
        const html = String(e.data.html || "");
        markSkipBodyPatch();
        changeOriginRef.current = "visual";
        setBodyHtml((prev) => (prev === html ? prev : html));
        emitFull(html);
        scheduleHistoryPush(html);
        requestAnimationFrame(() => {
          changeOriginRef.current = null;
          const doc = getIdoc();
          if (doc) syncToolbarFromDocument(doc);
        });
      }
      if (e?.data?.type === "RTE_UNDO") {
        undoEdit();
        return;
      }
      if (e?.data?.type === "RTE_REDO") {
        redoEdit();
        return;
      }
      if (e?.data?.type === "RTE_REQ_REPLACE") {
        if (imageNode) {
          replaceInputRef.current?.click();
        } else {
          toast.message("Select an image first.");
        }
      }
      if (e?.data?.type === "RTE_IMAGE_SELECTED") {
        const imgElement = getSelectedImage();
        if (imgElement) {
          ensureImageTokensAndStyle(imgElement);
          setImageNode(imgElement);
        }
      }
      if (e?.data?.type === "RTE_IMAGE_DESELECTED") {
        setImageNode(null);
      }
      if (e?.data?.type === "RTE_SELECTION_CHANGE") {
        const imgElement = getSelectedImage();
        if (imgElement) ensureImageTokensAndStyle(imgElement);
        setImageNode(imgElement);
        const doc = getIdoc();
        if (doc) syncToolbarFromDocument(doc);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [doctype, htmlAttrs, headHtml, onChange, imageNode, syncToolbarFromDocument, undoEdit, redoEdit, scheduleHistoryPush]);

  // Update toolbar from selection — re-bind after every iframe rewrite
  useEffect(() => {
    if (activeTab !== "visual") return;
    const idoc = getIdoc();
    if (!idoc) return;

    const updateToolbar = () => syncToolbarFromDocument(idoc);

    idoc.addEventListener("selectionchange", updateToolbar);
    idoc.addEventListener("keyup", updateToolbar);
    idoc.addEventListener("mouseup", updateToolbar);
    idoc.addEventListener("input", updateToolbar);
    idoc.addEventListener("click", updateToolbar);
    idoc.addEventListener("focusin", updateToolbar);
    updateToolbar();
    const t = window.setTimeout(updateToolbar, 40);
    return () => {
      window.clearTimeout(t);
      idoc.removeEventListener("selectionchange", updateToolbar);
      idoc.removeEventListener("keyup", updateToolbar);
      idoc.removeEventListener("mouseup", updateToolbar);
      idoc.removeEventListener("input", updateToolbar);
      idoc.removeEventListener("click", updateToolbar);
      idoc.removeEventListener("focusin", updateToolbar);
    };
  }, [activeTab, iframeEpoch, syncToolbarFromDocument]);

  // ---- Image insertion helpers (show temp preview, then swap to uploaded URL) ----
  const insertTempImage = (file: File) => {
    const idoc = getIdoc();
    if (!idoc) return null;
    const tempUrl = URL.createObjectURL(file);
    const tempId = uid();
    const align: AlignToken = ALIGN_DEFAULT;
    const size: SizeToken = SIZE_DEFAULT;
    const cls = buildClass(align, size);
    const style = styleFromTokens(align, size);
    const imgHtml = `<img src="${tempUrl}" data-temp-id="${tempId}" alt="${file.name}" class="${cls}" style="${style}">`;
    idoc.execCommand("insertHTML", false, imgHtml);
    commitFromIframe(); // sync right away
    return { tempUrl, tempId };
  };

  const replaceTempImage = (tempId: string, finalUrl: string, revokeUrl?: string) => {
    const root = getRoot();
    if (!root) return;
    const el = root.querySelector(`img[data-temp-id="${tempId}"]`) as HTMLImageElement | null;
    if (el) {
      const prevStyle = el.style.cssText; // preserve dimensions
      const prevClass = el.className;
      el.src = finalUrl;
      el.removeAttribute("data-temp-id");
      el.className = prevClass;
      el.style.cssText = prevStyle;
    }
    if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    commitFromIframe(); // emit after replacement
  };

 const replaceExistingImage = async (file: File) => {
  const idoc = getIdoc();
  if (!idoc || !imageNode) return;

  // Remember current tokens/class to preserve layout intent
  const prevClass = imageNode.className || "";

  // Temp preview
  const tempUrl = URL.createObjectURL(file);
  const tempId = uid();
  imageNode.setAttribute("data-temp-id", tempId);
  imageNode.src = tempUrl;
  commitFromIframe();

  try {
    setIsUploading(true);
    const url = await uploadImageToUrl(file, uploadUrl);

    // Find the temp-tagged image again (DOM may have reflowed)
    const root = getRoot();
    const currentImg = root?.querySelector(`img[data-temp-id="${tempId}"]`) as HTMLImageElement | null;
    if (currentImg) {
      // 1) Point ALL responsive candidates to the new file
      applyFinalImageUrl(currentImg, url);

      // 2) Restore our class/tokens and re-assert layout with !important
      currentImg.removeAttribute("data-temp-id");
      currentImg.className = prevClass;
      applyImportantLayout(currentImg);   // <- critical: beats external CSS
      ensureImageTokensAndStyle(currentImg); // keep tokens sane (no-ops if already good)

      // 3) Keep reference/selection
      setImageNode(currentImg);
      const sel = idoc.getSelection();
      if (sel) {
        const range = idoc.createRange();
        range.selectNode(currentImg);
        sel.removeAllRanges();
        sel.addRange(range);
        currentImg.classList.add("selected");
      }
    }

    toast.success("Image replaced successfully");
  } catch (err: any) {
    toast.error(err?.message || "Replace failed");
  } finally {
    setIsUploading(false);
    URL.revokeObjectURL(tempUrl);
    commitFromIframe();
  }
};


  // Handle paste and drop for images
  useEffect(() => {
    if (activeTab !== "visual") return;
    const idoc = getIdoc();
    if (!idoc) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItems = Array.from(items).filter((item) => item.type.startsWith("image/"));
      if (!imageItems.length) return;
      e.preventDefault();
      bumpLiveEditing();

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (!file) continue;
        const temp = insertTempImage(file);
        try {
          setIsUploading(true);
          const url = await uploadImageToUrl(file, uploadUrl);
          if (temp) replaceTempImage(temp.tempId, url, temp.tempUrl);
          toast.success("Image added");
        } catch (err: any) {
          toast.error(err?.message || "Upload failed");
        } finally {
          setIsUploading(false);
        }
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      bumpLiveEditing();
      const files = Array.from(e.dataTransfer?.files || []);
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (!images.length) return;
      for (const file of images) {
        const temp = insertTempImage(file);
        try {
          setIsUploading(true);
          const url = await uploadImageToUrl(file, uploadUrl);
          if (temp) replaceTempImage(temp.tempId, url, temp.tempUrl);
          toast.success("Image added");
        } catch (err: any) {
          toast.error(err?.message || "Upload failed");
        } finally {
          setIsUploading(false);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => e.preventDefault();

    idoc.addEventListener("paste", handlePaste);
    idoc.addEventListener("drop", handleDrop);
    idoc.addEventListener("dragover", handleDragOver);

    return () => {
      idoc.removeEventListener("paste", handlePaste);
      idoc.removeEventListener("drop", handleDrop);
      idoc.removeEventListener("dragover", handleDragOver);
    };
  }, [activeTab, uploadUrl]);

  /** Keep iframe text selection when clicking the parent toolbar. */
  const keepIframeSelection = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  /**
   * Resolve what to style:
   * - Prefer sticky/saved word·letter selection (toolbar often steals focus)
   * - Only expand to the whole line when the caret is truly collapsed
   * - If we expanded, return caretToRestore so the line is not left selected
   */
  const resolveStyleTarget = (idoc: Document): {
    range: Range | null;
    caretToRestore: Range | null;
  } => {
    const sticky = stickyTextSelectionRef.current;
    const saved = savedSelectionRef.current;
    const preferred =
      sticky && !sticky.collapsed && rangeStillInDocument(idoc, sticky)
        ? sticky
        : saved && rangeStillInDocument(idoc, saved)
          ? saved
          : saveIframeSelection(idoc);

    if (preferred && !preferred.collapsed) {
      restoreIframeSelection(idoc, preferred);
      savedSelectionRef.current = preferred;
      return { range: preferred, caretToRestore: null };
    }

    restoreIframeSelection(idoc, preferred);
    const caret =
      preferred && preferred.collapsed
        ? preferred.cloneRange()
        : saveIframeSelection(idoc);
    const expanded = expandCollapsedSelectionToBlock(idoc);
    if (expanded?.didExpand) {
      return { range: expanded.range, caretToRestore: caret };
    }
    return { range: expanded?.range || preferred, caretToRestore: null };
  };

  const runDocCommand = (fn: (idoc: Document) => void) => {
    const idoc = getIdoc();
    if (!idoc) return;
    focusEditor();
    const { range, caretToRestore } = resolveStyleTarget(idoc);
    if (range) restoreIframeSelection(idoc, range);
    fn(idoc);
    // Never leave a whole-line auto-selection hanging in the editor
    if (caretToRestore) {
      restoreIframeSelection(idoc, caretToRestore);
      savedSelectionRef.current = caretToRestore;
      stickyTextSelectionRef.current = null;
    }
    commitFromIframe("push");
    requestAnimationFrame(() => syncToolbarFromDocument(idoc));
  };

  /**
   * Heading / quote: convert the current block in place.
   * - Paragraph (incl. new line after Enter) → H1/H2/H3 on first click
   * - Same heading again → back to paragraph (toggle off)
   * - Different heading → switch level (h2 → h1)
   */
  const runBlockFormat = (tag: string) => {
    const idoc = getIdoc();
    if (!idoc) return;
    focusEditor();

    // Prefer live caret over sticky word selection so we format THIS line
    const live = saveIframeSelection(idoc);
    const saved = savedSelectionRef.current;
    const preferred =
      live && rangeStillInDocument(idoc, live)
        ? live
        : saved && rangeStillInDocument(idoc, saved)
          ? saved
          : null;

    if (preferred) {
      try {
        const caret = preferred.cloneRange();
        caret.collapse(true);
        restoreIframeSelection(idoc, caret);
      } catch {
        restoreIframeSelection(idoc, preferred);
      }
    }

    const block = getBlockFromSelection(idoc);
    const current = normalizeCurrentBlockTag(block);
    // First click applies heading; second click on same level removes it → paragraph
    const target = current === tag ? "p" : tag;
    const next = setBlockFormatInIframe(idoc, target, block);

    stickyTextSelectionRef.current = null;
    savedSelectionRef.current = saveIframeSelection(idoc);
    if (next) {
      setCurrentFormat(normalizeCurrentBlockTag(next));
    }
    commitFromIframe("push");
    requestAnimationFrame(() => syncToolbarFromDocument(idoc));
  };

  // Commands
  const cmd = useMemo(
    () => ({
      h1: () => runBlockFormat("h1"),
      h2: () => runBlockFormat("h2"),
      h3: () => runBlockFormat("h3"),
      bold: () => runDocCommand((idoc) => idoc.execCommand("bold")),
      italic: () => runDocCommand((idoc) => idoc.execCommand("italic")),
      underline: () => runDocCommand((idoc) => idoc.execCommand("underline")),
      bullet: () => runDocCommand((idoc) => idoc.execCommand("insertUnorderedList")),
      ordered: () => runDocCommand((idoc) => idoc.execCommand("insertOrderedList")),
      indent: () => runDocCommand((idoc) => idoc.execCommand("indent")),
      outdent: () => runDocCommand((idoc) => idoc.execCommand("outdent")),
      quote: () => runBlockFormat("blockquote"),
      hr: () => runDocCommand((idoc) => idoc.execCommand("insertHorizontalRule")),
      alignLeft: () => runDocCommand((idoc) => idoc.execCommand("justifyLeft")),
      alignCenter: () => runDocCommand((idoc) => idoc.execCommand("justifyCenter")),
      alignRight: () => runDocCommand((idoc) => idoc.execCommand("justifyRight")),
      alignJustify: () => runDocCommand((idoc) => idoc.execCommand("justifyFull")),
      unlink: () => {
        const idoc = getIdoc();
        if (!idoc) return;
        const range = savedSelectionRef.current || saveIframeSelection(idoc);
        unlinkInIframe(idoc, range);
        savedSelectionRef.current = null;
        stickyTextSelectionRef.current = null;
        setIsLink(false);
        commitFromIframe();
      },
      setColor: (c: string) => {
        const idoc = getIdoc();
        if (!idoc) return;
        const hex = normalizeColorInput(c) || rgbToHex(c);
        const { range, caretToRestore } = resolveStyleTarget(idoc);
        // Snapshot before wrap — DOM mutation can invalidate the Range object
        const partial =
          range && !range.collapsed ? range.cloneRange() : null;
        applyColorInIframe(idoc, partial || range, hex);
        if (caretToRestore) {
          restoreIframeSelection(idoc, caretToRestore);
          savedSelectionRef.current = caretToRestore;
          stickyTextSelectionRef.current = null;
        } else {
          const live = saveIframeSelection(idoc);
          if (live && !live.collapsed) {
            savedSelectionRef.current = live;
            stickyTextSelectionRef.current = live.cloneRange();
          } else if (partial) {
            stickyTextSelectionRef.current = partial;
            savedSelectionRef.current = partial;
          }
        }
        setTextColor(hex);
        setColorDraft(hex);
        commitFromIframe();
        syncToolbarFromDocument(idoc);
      },
      setFont: (fontFamily: string) => {
        const idoc = getIdoc();
        if (!idoc) return;
        const { range, caretToRestore } = resolveStyleTarget(idoc);
        const partial =
          range && !range.collapsed ? range.cloneRange() : null;
        const family = String(fontFamily || "").trim();
        if (!family) {
          restoreIframeSelection(idoc, partial || range);
          const block = getBlockFromSelection(idoc);
          const sel = idoc.getSelection();
          if (block && selectionCoversWholeBlock(sel, block)) {
            block.style.removeProperty("font-family");
            block.removeAttribute("data-gb-font-override");
            clearNestedInlineProp(block, "font-family");
          } else if (partial) {
            restoreIframeSelection(idoc, partial);
            wrapRangeWithInlineStyles(idoc, partial, { fontFamily: "inherit" });
            // Clear inherit noise from the wrapper
            const live = saveIframeSelection(idoc);
            let n: Node | null = live?.startContainer || null;
            if (n?.nodeType === Node.TEXT_NODE) n = n.parentNode;
            if (n instanceof HTMLElement) {
              n.style.removeProperty("font-family");
              n.removeAttribute("data-gb-font-override");
            }
          } else if (sel && !sel.isCollapsed) {
            idoc.execCommand("fontName", false, "inherit");
          }
          if (caretToRestore) {
            restoreIframeSelection(idoc, caretToRestore);
            savedSelectionRef.current = caretToRestore;
            stickyTextSelectionRef.current = null;
          }
          setTextFont("");
          commitFromIframe();
          syncToolbarFromDocument(idoc);
          return;
        }
        applyFontInIframe(idoc, partial || range, family);
        if (caretToRestore) {
          restoreIframeSelection(idoc, caretToRestore);
          savedSelectionRef.current = caretToRestore;
          stickyTextSelectionRef.current = null;
        } else {
          const live = saveIframeSelection(idoc);
          if (live && !live.collapsed) {
            savedSelectionRef.current = live;
            stickyTextSelectionRef.current = live.cloneRange();
          } else if (partial) {
            stickyTextSelectionRef.current = partial;
            savedSelectionRef.current = partial;
          }
        }
        setTextFont(family);
        commitFromIframe();
        syncToolbarFromDocument(idoc);
      },
      clear: () => {
        const idoc = getIdoc();
        focusEditor();
        idoc?.execCommand("removeFormat");
        commitFromIframe("push");
      },
      undo: () => undoEdit(),
      redo: () => redoEdit(),
      /** Call from mousedown (before focus leaves iframe) so selection is kept. */
      captureLinkSelection: () => {
        const idoc = getIdoc();
        if (!idoc) return;
        const live = saveIframeSelection(idoc);
        if (live && !live.collapsed) {
          savedSelectionRef.current = live;
          stickyTextSelectionRef.current = live.cloneRange();
        } else if (live) {
          savedSelectionRef.current = live;
        }
      },
      openLinkBox: () => {
        const idoc = getIdoc();
        if (!idoc) return;
        if (!savedSelectionRef.current) {
          savedSelectionRef.current = saveIframeSelection(idoc);
        }
        restoreIframeSelection(idoc, savedSelectionRef.current);
        const anchor = getAnchorFromSelection(idoc);
        const href = anchor?.getAttribute("href") || "";
        setLinkUrl(href || "https://");
        setIsLink(Boolean(href));
        setShowLinkInput(true);
        window.setTimeout(() => linkInputRef.current?.focus(), 0);
      },
      applyLink: (rawUrl: string) => {
        const idoc = getIdoc();
        if (!idoc) return;
        const ok = applyLinkInIframe(idoc, savedSelectionRef.current, rawUrl);
        if (!ok) {
          toast.error("Select text in the editor first, then apply the link.");
          return;
        }
        savedSelectionRef.current = null;
        stickyTextSelectionRef.current = null;
        setShowLinkInput(false);
        setIsLink(Boolean(normalizeHref(rawUrl)));
        commitFromIframe();
        toast.success(normalizeHref(rawUrl) ? "Link applied" : "Link removed");
      },
    }),
    [syncToolbarFromDocument, undoEdit, redoEdit]
  );

  // Image helpers (align & size) — commit after changes so state & UI update
  const setImgAttrs = (align: AlignToken, size: SizeToken) => {
    if (!imageNode) {
      toast.message("Select an image first.");
      return;
    }
    
    const cls = buildClass(align, size);
    imageNode.className = cls;
    applyImportantLayout(imageNode);
    imageNode.style.cssText = styleFromTokens(align, size);
    
    // Keep the image selected and focused
    imageNode.focus();
    imageNode.classList.add('selected');
    
    // Maintain selection
    const idoc = getIdoc();
    if (idoc) {
      const sel = idoc.getSelection();
      if (sel) {
        const range = idoc.createRange();
        range.selectNode(imageNode);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    
    commitFromIframe();
  };

  const setImgSize = (sizeClass: string) => {
    if (!imageNode) {
      toast.message("Select an image first.");
      return;
    }
    const { align } = parseTokens(imageNode.className || "");
    const wanted = (SIZE_ORDER.find(s => s === sizeClass) || SIZE_DEFAULT) as SizeToken;
    setImgAttrs(align, wanted);
  };

  const setImgAlign = (alignClass: string) => {
    if (!imageNode) {
      toast.message("Select an image first.");
      return;
    }
    const { size } = parseTokens(imageNode.className || "");
    const wanted = alignClass as AlignToken;
    setImgAttrs(wanted, size);
  };

  // Upload
  const onUploadClick = () => fileInputRef.current?.click();
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");

    bumpLiveEditing();
    const temp = insertTempImage(file);
    try {
      setIsUploading(true);
      const url = await uploadImageToUrl(file, uploadUrl);
      if (temp) replaceTempImage(temp.tempId, url, temp.tempUrl);
      toast.success("Image added");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const onReplacePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (!imageNode) return toast.message("Select an image first.");
    bumpLiveEditing();
    await replaceExistingImage(file);
  };

  // HTML tab apply
  const applyFullHtml = () => {
    changeOriginRef.current = "html";
    setIsLiveEditing(false);
    const s = splitHeadBody(htmlDraft);
    setDoctype(s.doctype);
    setHtmlAttrs(s.htmlAttrs);
    setHeadHtml(s.headHtml);
    setBodyHtml(s.bodyHtml);
    resetHistory(s.bodyHtml);
    const rejoined = joinHeadBody(s.doctype, s.htmlAttrs, s.headHtml, s.bodyHtml);
    lastPushedRef.current = rejoined;
    onChange?.(rejoined);
    toast.success("Applied full HTML");
    setActiveTab("visual");
    requestAnimationFrame(() => {
      changeOriginRef.current = null;
    });
  };

  const is = {
    h1: currentFormat === "h1",
    h2: currentFormat === "h2",
    h3: currentFormat === "h3",
    bold: isBold,
    italic: isItalic,
    underline: isUnderline,
    bullet: isBullet || currentFormat === "ul",
    ordered: isOrdered || currentFormat === "ol",
    quote: currentFormat === "blockquote",
    link: isLink,
  };
  const imageSelected = !!imageNode;

  const formatLabel = (() => {
    const f = String(currentFormat || "p").toLowerCase();
    if (f === "h1") return "Heading 1";
    if (f === "h2") return "Heading 2";
    if (f === "h3") return "Heading 3";
    if (f === "h4") return "Heading 4";
    if (f === "h5") return "Heading 5";
    if (f === "h6") return "Heading 6";
    if (f === "blockquote") return "Quote";
    if (f === "ul" || is.bullet) return "Bullet list";
    if (f === "ol" || is.ordered) return "Numbered list";
    if (f === "pre") return "Code";
    return "Paragraph";
  })();
  const alignLabel =
    currentAlign === "center"
      ? "Center"
      : currentAlign === "right"
        ? "Right"
        : currentAlign === "justify"
          ? "Justify"
          : "Left";

  // Get current image alignment and size for UI
  const currentImageAlign = imageSelected ? parseTokens(imageNode!.className || "").align : ALIGN_DEFAULT;
  const currentImageSize = imageSelected ? parseTokens(imageNode!.className || "").size : SIZE_DEFAULT;

  /**
   * Capture selection for toolbar controls.
   * Never overwrite a word/letter selection with a collapsed caret that appears
   * only because the toolbar stole focus from the iframe.
   */
  const captureColorSelection = () => {
    const idoc = getIdoc();
    if (!idoc) return;
    const live = saveIframeSelection(idoc);
    if (live && !live.collapsed) {
      savedSelectionRef.current = live;
      stickyTextSelectionRef.current = live.cloneRange();
      return;
    }
    const sticky = stickyTextSelectionRef.current;
    if (sticky && !sticky.collapsed && rangeStillInDocument(idoc, sticky)) {
      savedSelectionRef.current = sticky;
      return;
    }
    const prev = savedSelectionRef.current;
    if (prev && !prev.collapsed && rangeStillInDocument(idoc, prev)) {
      // Keep prior word selection — live caret is just focus-steal noise
      return;
    }
    if (live) savedSelectionRef.current = live;
  };

  const applyPickedColor = (raw: string, opts?: { commit?: boolean }) => {
    const hex = normalizeColorInput(raw);
    if (!hex) {
      toast.error("Enter a valid color like #E11D48 or rgb(225,29,72)");
      setColorDraft(textColor);
      return false;
    }
    setTextColor(hex);
    setColorDraft(hex);
    // Live swatch preview only — don't paint the editor until commit.
    // (onInput while dragging used to re-apply and often hit the whole line.)
    if (opts?.commit === false) return true;
    cmd.setColor(hex);
    return true;
  };

  const colorPickerValue = /^#[0-9a-fA-F]{6}$/.test(textColor) ? textColor : "#000000";

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button size="sm" variant={activeTab === "visual" ? "default" : "outline"} onClick={() => setActiveTab("visual")}>Visual</Button>
        <Button size="sm" variant={activeTab === "html" ? "default" : "outline"} onClick={() => setActiveTab("html")}>HTML</Button>
      </div>

      {/* Visual (iframe editor) */}
      {activeTab === "visual" && (
        <div className="space-y-2">
          {/* Selection readout — current block / align / color */}
          <div className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 rounded-md border bg-muted/40 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{formatLabel}</span>
            <span aria-hidden>·</span>
            <span>Align: {alignLabel}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              Color
              <span
                className="inline-block h-3.5 w-3.5 rounded-sm border border-black/20 shadow-sm shrink-0"
                style={{ backgroundColor: textColor }}
                title={textColor}
              />
              <input
                type="text"
                value={colorDraft}
                spellCheck={false}
                aria-label="Color hex code"
                title="Type or paste a color code (#E11D48)"
                className="h-6 w-[5.5rem] rounded border bg-background px-1.5 font-mono text-[11px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  captureColorSelection();
                }}
                onFocus={() => {
                  colorDraftFocusedRef.current = true;
                  captureColorSelection();
                }}
                onChange={(e) => setColorDraft(e.target.value)}
                onBlur={() => {
                  colorDraftFocusedRef.current = false;
                  applyPickedColor(colorDraft);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPickedColor(colorDraft);
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === "Escape") {
                    setColorDraft(textColor);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  const hex = normalizeColorInput(pasted);
                  if (hex) {
                    e.preventDefault();
                    setColorDraft(hex);
                    applyPickedColor(hex);
                  }
                }}
              />
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5" title="Font for current selection or line">
              Font
              <span
                className="max-w-[7rem] truncate text-foreground"
                style={textFont ? { fontFamily: textFont } : undefined}
              >
                {EDITOR_FONT_OPTIONS.find(
                  (f) =>
                    f.value &&
                    textFont &&
                    f.value.replace(/['"]/g, "").toLowerCase().includes(
                      textFont.replace(/['"]/g, "").split(",")[0].trim().toLowerCase()
                    )
                )?.name || (textFont ? textFont.replace(/['"]/g, "").split(",")[0].trim() : "Theme")}
              </span>
            </span>
            {is.link ? (
              <>
                <span aria-hidden>·</span>
                <span className="text-foreground font-medium">Link</span>
              </>
            ) : null}
            {imageSelected ? (
              <>
                <span aria-hidden>·</span>
                <span className="text-foreground font-medium">Image selected</span>
              </>
            ) : null}
            {(is.bold || is.italic || is.underline) && (
              <>
                <span aria-hidden>·</span>
                <span>
                  {[is.bold && "Bold", is.italic && "Italic", is.underline && "Underline"]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 p-2 border rounded-md items-center">
            <Button
              size="sm"
              variant={is.h1 ? "default" : "outline"}
              title={is.h1 ? "Remove Heading 1 (back to paragraph)" : "Heading 1"}
              onMouseDown={(e) => {
                e.preventDefault();
                const idoc = getIdoc();
                if (idoc) savedSelectionRef.current = saveIframeSelection(idoc);
              }}
              onClick={cmd.h1}
              aria-pressed={is.h1}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={is.h2 ? "default" : "outline"}
              title={is.h2 ? "Remove Heading 2 (back to paragraph)" : "Heading 2"}
              onMouseDown={(e) => {
                e.preventDefault();
                const idoc = getIdoc();
                if (idoc) savedSelectionRef.current = saveIframeSelection(idoc);
              }}
              onClick={cmd.h2}
              aria-pressed={is.h2}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={is.h3 ? "default" : "outline"}
              title={is.h3 ? "Remove Heading 3 (back to paragraph)" : "Heading 3"}
              onMouseDown={(e) => {
                e.preventDefault();
                const idoc = getIdoc();
                if (idoc) savedSelectionRef.current = saveIframeSelection(idoc);
              }}
              onClick={cmd.h3}
              aria-pressed={is.h3}
            >
              <Heading3 className="h-4 w-4" />
            </Button>

            <Button size="sm" variant={is.bold ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.bold} aria-pressed={is.bold}><Bold className="h-4 w-4" /></Button>
            <Button size="sm" variant={is.italic ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.italic} aria-pressed={is.italic}><Italic className="h-4 w-4" /></Button>
            <Button size="sm" variant={is.underline ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.underline} aria-pressed={is.underline}><UnderlineIcon className="h-4 w-4" /></Button>

            <Button size="sm" variant={is.bullet ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.bullet} aria-pressed={is.bullet}><List className="h-4 w-4" /></Button>
            <Button size="sm" variant={is.ordered ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.ordered} aria-pressed={is.ordered}><ListOrdered className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onMouseDown={keepIframeSelection} onClick={cmd.indent} title="Indent"><ChevronRight className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onMouseDown={keepIframeSelection} onClick={cmd.outdent} title="Outdent"><ChevronLeft className="h-4 w-4" /></Button>

            <Button size="sm" variant={is.quote ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.quote} aria-pressed={is.quote}><Quote className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onMouseDown={keepIframeSelection} onClick={cmd.hr}><Minus className="h-4 w-4" /></Button>

            <Button size="sm" variant={currentAlign === "left" ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.alignLeft} aria-pressed={currentAlign === "left"} title="Align left"><AlignLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant={currentAlign === "center" ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.alignCenter} aria-pressed={currentAlign === "center"} title="Align center"><AlignCenter className="h-4 w-4" /></Button>
            <Button size="sm" variant={currentAlign === "right" ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.alignRight} aria-pressed={currentAlign === "right"} title="Align right"><AlignRight className="h-4 w-4" /></Button>
            <Button size="sm" variant={currentAlign === "justify" ? "default" : "outline"} onMouseDown={keepIframeSelection} onClick={cmd.alignJustify} aria-pressed={currentAlign === "justify"} title="Justify"><AlignJustify className="h-4 w-4" /></Button>

            <Button
              size="sm"
              variant={is.link ? "default" : "outline"}
              aria-pressed={is.link}
              title="Insert / edit link"
              onMouseDown={(e) => {
                // Prevent focus steal so iframe text selection is not cleared
                e.preventDefault();
                cmd.captureLinkSelection();
              }}
              onClick={() => cmd.openLinkBox()}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              title="Remove link"
              onMouseDown={(e) => {
                e.preventDefault();
                cmd.captureLinkSelection();
              }}
              onClick={() => cmd.unlink()}
            >
              <Unlink className="h-4 w-4" />
            </Button>

            <div
              className="flex items-center gap-1 text-sm px-1.5 py-1 rounded border"
              title="Font — applies to selection, or the whole line if nothing is selected"
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).tagName !== "SELECT") e.preventDefault();
                captureColorSelection();
              }}
            >
              <span className="text-[10px] text-muted-foreground hidden sm:inline">Font</span>
              <select
                className="h-6 max-w-[9.5rem] rounded border-0 bg-transparent px-1 text-[11px] outline-none focus:ring-1 focus:ring-ring"
                value={(() => {
                  const match = EDITOR_FONT_OPTIONS.find(
                    (f) =>
                      f.value &&
                      textFont &&
                      f.value.replace(/['"]/g, "").toLowerCase().includes(
                        textFont.replace(/['"]/g, "").split(",")[0].trim().toLowerCase()
                      )
                  );
                  return match?.value || "";
                })()}
                aria-label="Font family"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  captureColorSelection();
                }}
                onFocus={() => {
                  fontSelectFocusedRef.current = true;
                  // Do not re-capture here — iframe selection is already gone
                }}
                onBlur={() => {
                  fontSelectFocusedRef.current = false;
                }}
                onChange={(e) => {
                  cmd.setFont(e.target.value);
                }}
              >
                {EDITOR_FONT_OPTIONS.map((f) => (
                  <option key={f.name} value={f.value} style={f.value ? { fontFamily: f.value } : undefined}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="flex items-center gap-1 text-sm px-1.5 py-1 rounded border"
              title="Text color — pick, type, or paste a hex code (overrides theme)"
              onMouseDown={(e) => {
                // Keep iframe selection when interacting with color controls
                if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
                captureColorSelection();
              }}
            >
              <label className="relative inline-flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-black/25 shadow-sm shrink-0">
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: textColor }}
                  aria-hidden
                />
                <input
                  type="color"
                  value={colorPickerValue}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Pick color"
                  onMouseDown={captureColorSelection}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTextColor(v);
                    setColorDraft(v);
                    applyPickedColor(v);
                  }}
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    setTextColor(v);
                    setColorDraft(v);
                    applyPickedColor(v, { commit: false });
                  }}
                />
              </label>
              <input
                type="text"
                value={colorDraft}
                spellCheck={false}
                aria-label="Color hex code"
                placeholder="#000000"
                className="h-6 w-[5.75rem] rounded border-0 bg-transparent px-1 font-mono text-[11px] outline-none focus:ring-1 focus:ring-ring"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  captureColorSelection();
                }}
                onFocus={() => {
                  colorDraftFocusedRef.current = true;
                  captureColorSelection();
                }}
                onChange={(e) => setColorDraft(e.target.value)}
                onBlur={() => {
                  colorDraftFocusedRef.current = false;
                  applyPickedColor(colorDraft);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPickedColor(colorDraft);
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === "Escape") {
                    setColorDraft(textColor);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  const hex = normalizeColorInput(pasted);
                  if (hex) {
                    e.preventDefault();
                    setColorDraft(hex);
                    applyPickedColor(hex);
                  }
                }}
              />
            </div>

            <Button size="sm" variant="outline" onMouseDown={keepIframeSelection} onClick={cmd.undo} disabled={!canUndo} title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onMouseDown={keepIframeSelection} onClick={cmd.redo} disabled={!canRedo} title="Redo (Ctrl+Y)"><Redo2 className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onMouseDown={keepIframeSelection} onClick={cmd.clear}><Eraser className="h-4 w-4" /></Button>

            <Button size="sm" variant="outline" onClick={onUploadClick} disabled={isUploading || disabled}>
              <ImageIcon className="h-4 w-4" />
              <span className="ml-1">{isUploading ? "Uploading…" : "Image"}</span>
            </Button>

            {/* Image controls */}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-muted-foreground">Image:</span>
              <Button 
                size="sm" 
                variant={currentImageAlign === "img-float-left" ? "default" : "outline"} 
                title="Float Left (wrap)" 
                onClick={() => setImgAlign("img-float-left")} 
                disabled={!imageSelected}
              >
                L
              </Button>
              <Button 
                size="sm" 
                variant={currentImageAlign === "img-float-right" ? "default" : "outline"} 
                title="Float Right (wrap)" 
                onClick={() => setImgAlign("img-float-right")} 
                disabled={!imageSelected}
              >
                R
              </Button>
              <Button 
                size="sm" 
                variant={currentImageAlign === "img-center" ? "default" : "outline"} 
                title="Center" 
                onClick={() => setImgAlign("img-center")} 
                disabled={!imageSelected}
              >
                C
              </Button>
              <Button 
                size="sm" 
                variant={currentImageAlign === "img-block" ? "default" : "outline"} 
                title="Block / Full" 
                onClick={() => setImgAlign("img-block")} 
                disabled={!imageSelected}
              >
                Full
              </Button>
              <select
                className="border rounded px-1 py-[2px] text-xs"
                onChange={(e) => setImgSize(e.target.value)}
                value={imageSelected ? currentImageSize : ""}
                title="Image width"
                disabled={!imageSelected}
              >
                <option value="">Size</option>
                <option value="img-25">25%</option>
                <option value="img-33">33%</option>
                <option value="img-50">50%</option>
                <option value="img-66">66%</option>
                <option value="img-75">75%</option>
                <option value="img-100">100%</option>
              </select>

              {/* Replace button shows when an image is selected */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => replaceInputRef.current?.click()}
                disabled={!imageSelected || isUploading}
                title="Replace selected image"
                className="ml-1"
              >
                <ReplaceIcon className="h-4 w-4" />
                <span className="ml-1">Replace</span>
              </Button>
            </div>
          </div>

          {/* Inline "Insert Link" box */}
          {showLinkInput && (
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
              <input
                ref={linkInputRef}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    cmd.applyLink(linkUrl);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setShowLinkInput(false);
                  }
                }}
                placeholder="https://example.com"
                className="flex-1 h-9 px-3 rounded-md border bg-background"
              />
              <Button
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => cmd.applyLink(linkUrl)}
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  cmd.applyLink("");
                }}
              >
                Remove
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  savedSelectionRef.current = null;
                  setShowLinkInput(false);
                }}
              >
                Close
              </Button>
            </div>
          )}

          {/* Iframe */}
          <div className="relative">
            {themePending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border bg-white/80 text-sm text-muted-foreground">
                Loading project theme…
              </div>
            )}
            <iframe
              ref={iframeRef}
              className="w-full border rounded-md bg-white"
              style={{ height: `${height}px` }}
              title="Visual Editor"
              onLoad={() => {
                if (!themePending) applyThemeToIframe();
              }}
            />
          </div>
        </div>
      )}

      {/* HTML (full document) */}
      {activeTab === "html" && (
        <div className="space-y-2">
          <Textarea
            value={htmlDraft}
            onChange={(e) => setHtmlDraft(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Edit full HTML (head + body)…"
          />
          <div className="flex justify-end">
            <Button variant="outline" onClick={applyFullHtml}>
              Apply to Visual
            </Button>
          </div>
        </div>
      )}

      {/* Hidden pickers */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={onReplacePick} />
    </div>
  );
}