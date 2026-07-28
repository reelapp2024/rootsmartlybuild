import { useCallback, useEffect, useState } from "react";
import { http } from "../config.js";
import type { BlogEditorThemePreview } from "@/components/editor/RichTextEditor";

/** Normalize Mongo id / populated ref so theme API never gets `[object Object]`. */
export function normalizeProjectId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || s === "[object Object]") return "";
    return s;
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return normalizeProjectId(obj._id ?? obj.id ?? obj.$oid);
  }
  const s = String(raw).trim();
  return s === "[object Object]" ? "" : s;
}

/**
 * Local fallback when API proseCss is missing — mirrors SiteNextJS BlogContentDefault
 * (literal colors, no :where() so theme actually wins in the iframe).
 */
export function buildLocalBlogEditorCss(tokens: BlogEditorThemePreview): string {
  const title = tokens.titleColor || "#111827";
  const text = tokens.textColor || "#374151";
  const accent = tokens.accentColor || tokens.linkColor || "#E11D48";
  const link = tokens.linkColor || accent;
  const titleFont =
    tokens.titleFont && tokens.titleFont !== "inherit"
      ? tokens.titleFont
      : '"Poppins", sans-serif';
  const bodyFont =
    tokens.bodyFont && tokens.bodyFont !== "inherit"
      ? tokens.bodyFont
      : '"Inter", sans-serif';
  const surface = tokens.surfaceColor || "#fff";
  const scope = "#root.blog-prose";
  return `
    :root {
      --blog-title-color: ${title};
      --blog-text-color: ${text};
      --blog-link-color: ${link};
      --blog-accent-color: ${accent};
      --blog-title-font: ${titleFont};
      --blog-body-font: ${bodyFont};
      --blog-surface-color: ${surface};
      --heading-h1-size: 2.25rem;
      --heading-h2-size: 1.75rem;
      --heading-h3-size: 1.375rem;
      --text-size-base: 1rem;
    }
    html, body { margin: 0; background: ${surface}; color: ${text}; font-family: ${bodyFont}; }
    body { padding: 1rem 1.15rem; }
    ${scope}, .blog-prose {
      outline: none; min-height: 12rem; color: ${text};
      font-family: ${bodyFont}; line-height: 1.8; font-size: 1rem;
    }
    ${scope} h1, ${scope} h2, ${scope} .gb-h1, ${scope} .gb-h2,
    .blog-prose h1, .blog-prose h2, .blog-prose .gb-h1, .blog-prose .gb-h2 {
      color: ${title}; font-family: ${titleFont}; font-weight: 700;
      border-left: 4px solid ${accent}; padding-left: 0.85rem;
      margin: 1.65em 0 0.65em; line-height: 1.3;
    }
    ${scope} h1, ${scope} .gb-h1, .blog-prose h1, .blog-prose .gb-h1 { font-size: var(--heading-h1-size, 2.25rem); }
    ${scope} h2, ${scope} .gb-h2, .blog-prose h2, .blog-prose .gb-h2 { font-size: var(--heading-h2-size, 1.75rem); }
    ${scope} h3, ${scope} .gb-h3,
    .blog-prose h3, .blog-prose .gb-h3 {
      color: ${accent}; font-family: ${titleFont}; font-weight: 700;
      font-size: var(--heading-h3-size, 1.375rem); margin: 1.25em 0 0.5em; line-height: 1.35;
    }
    ${scope} h4, ${scope} h5, ${scope} h6,
    .blog-prose h4, .blog-prose h5, .blog-prose h6 {
      color: ${title}; font-family: ${titleFont}; font-weight: 700; margin: 1.25em 0 0.5em;
    }
    ${scope} p, ${scope} .gb-p, .blog-prose p, .blog-prose .gb-p {
      color: ${text}; font-family: ${bodyFont}; margin: 0 0 1em;
    }
    ${scope} a, ${scope} .gb-link, .blog-prose a, .blog-prose .gb-link {
      color: ${link}; font-weight: 600; text-decoration: underline; text-underline-offset: 3px;
    }
    ${scope} ul, ${scope} ol, .blog-prose ul, .blog-prose ol {
      color: ${text}; padding-left: 1.35rem; margin: 0 0 1em; font-family: ${bodyFont};
    }
    ${scope} li::marker, .blog-prose li::marker { color: ${accent}; }
    ${scope} blockquote, ${scope} .gb-quote, .blog-prose blockquote, .blog-prose .gb-quote {
      border-left: 4px solid ${accent}; padding: 0.85em 1.1em; margin: 1.25em 0;
      background: color-mix(in srgb, ${accent} 8%, ${surface}); font-style: italic;
      border-radius: 0 0.65rem 0.65rem 0; color: ${text}; font-family: ${bodyFont};
    }
    ${scope} strong, ${scope} .gb-strong, .blog-prose strong, .blog-prose b {
      color: ${title}; font-weight: 700;
    }
    /* FAQ — match live SiteNextJS accordion (plus chip, title questions, card gaps) */
    ${scope} details.gb-faq, ${scope} .gb-faq,
    .blog-prose details.gb-faq, .blog-prose .gb-faq {
      display: block; margin: 0 0 0.75rem; padding: 0; overflow: hidden;
      border: 1px solid color-mix(in srgb, ${accent} 20%, transparent);
      border-radius: 0.875rem; background: ${surface}; box-shadow: none;
    }
    ${scope} details.gb-faq:last-child, .blog-prose details.gb-faq:last-child { margin-bottom: 0; }
    ${scope} details.gb-faq > summary, ${scope} summary.gb-faq-q,
    .blog-prose details.gb-faq > summary {
      cursor: pointer; list-style: none; display: flex; align-items: center;
      justify-content: space-between; gap: 0.75rem; padding: 1.25rem 1.5rem; margin: 0;
      color: ${title}; font-family: ${titleFont}; font-weight: 700;
      font-size: 1.0625rem; line-height: 1.4; text-align: left; user-select: none;
      background: transparent; border: none;
    }
    ${scope} details.gb-faq > summary::-webkit-details-marker { display: none; }
    ${scope} details.gb-faq > summary::after,
    .blog-prose details.gb-faq > summary::after {
      content: "+"; box-sizing: border-box; width: 2rem; height: 2rem; border-radius: 9999px;
      background: color-mix(in srgb, ${accent} 8%, transparent); color: ${accent};
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700; line-height: 1; flex-shrink: 0;
      transform: none; margin-left: 0.25rem;
    }
    ${scope} details.gb-faq[open] > summary,
    .blog-prose details.gb-faq[open] > summary { background: transparent; border-bottom: none; }
    ${scope} details.gb-faq[open] > summary::after,
    .blog-prose details.gb-faq[open] > summary::after {
      content: "\\2212"; transform: none;
    }
    ${scope} details.gb-faq > .gb-faq-a, ${scope} .gb-faq-a,
    .blog-prose .gb-faq-a {
      padding: 1.25rem 1.5rem; margin: 0;
      border-top: 1px solid color-mix(in srgb, ${accent} 13%, transparent);
      color: ${text}; font-family: ${bodyFont}; font-size: 0.9375rem; line-height: 1.65;
    }
    ${scope} .gb-faq-a p, .blog-prose .gb-faq-a p { margin: 0 0 0.65em; color: inherit; font-size: inherit; }
    ${scope} .gb-faq-a p:last-child, .blog-prose .gb-faq-a p:last-child { margin-bottom: 0; }
    /* Keep empty lines visible after Enter */
    ${scope} p, ${scope} h1, ${scope} h2, ${scope} h3, ${scope} h4, ${scope} h5, ${scope} h6,
    .blog-prose p, .blog-prose h1, .blog-prose h2, .blog-prose h3 {
      min-height: 1.5em;
    }
    img { max-width: 100%; height: auto; border-radius: 0.75rem; }
    img:focus, img.selected { outline: 2px solid #60a5fa; }
  `;
}

function mapThemePayload(data: Record<string, unknown>, forProjectId: string): BlogEditorThemePreview {
  const titleFont = String(data.titleFont || "").trim();
  const bodyFont = String(data.bodyFont || "").trim();
  const accent = String(data.accentColor || data.linkColor || "#E11D48");
  const next: BlogEditorThemePreview = {
    proseCss: String(data.proseCss || ""),
    googleFontsUrl: String(data.googleFontsUrl || ""),
    titleColor: data.titleColor != null ? String(data.titleColor) : "#111827",
    textColor: data.textColor != null ? String(data.textColor) : "#374151",
    linkColor: String(data.linkColor || accent),
    accentColor: accent,
    titleFont: titleFont && titleFont !== "inherit" ? titleFont : '"Poppins", sans-serif',
    bodyFont: bodyFont && bodyFont !== "inherit" ? bodyFont : '"Inter", sans-serif',
    surfaceColor: data.surfaceColor != null ? String(data.surfaceColor) : "#FFFFFF",
    blogCss: data.blogCss != null ? String(data.blogCss) : "",
    projectId: forProjectId,
  };
  if (!next.proseCss) {
    next.proseCss = buildLocalBlogEditorCss(next);
  }
  return next;
}

/**
 * Load project theme for blog WYSIWYG — same fonts/colors/sizes as the live site.
 */
export function useBlogEditorTheme(projectId?: string | null) {
  const pid = normalizeProjectId(projectId);
  const [themePreview, setThemePreview] = useState<BlogEditorThemePreview | null>(null);
  const [loading, setLoading] = useState(Boolean(pid));

  const load = useCallback(async () => {
    if (!pid) {
      setThemePreview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Drop stale theme from a previous project immediately (major mismatch bug)
    setThemePreview(null);
    try {
      const token = localStorage.getItem("token");
      const res = await http.get(`/blogEditorTheme/${pid}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = (res.data?.data || {}) as Record<string, unknown>;
      setThemePreview(mapThemePayload(data, pid));
    } catch (err) {
      console.warn("[useBlogEditorTheme] failed, using brand fallback", err);
      const fallback: BlogEditorThemePreview = {
        titleColor: "#111827",
        textColor: "#374151",
        linkColor: "#E11D48",
        accentColor: "#E11D48",
        surfaceColor: "#FFFFFF",
        titleFont: '"Poppins", sans-serif',
        bodyFont: '"Inter", sans-serif',
        googleFontsUrl:
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Poppins:wght@300;400;700;900&display=swap",
        projectId: pid,
      };
      fallback.proseCss = buildLocalBlogEditorCss(fallback);
      setThemePreview(fallback);
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    load();
  }, [load]);

  // Only expose theme when it matches the requested project (avoid flash of wrong theme)
  const safeTheme =
    themePreview && (!themePreview.projectId || themePreview.projectId === pid)
      ? themePreview
      : null;

  return { themePreview: safeTheme, loading, reload: load, projectId: pid };
}
