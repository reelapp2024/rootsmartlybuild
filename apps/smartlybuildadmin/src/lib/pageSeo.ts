export type PageSeoForm = {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  meta_image: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: string;
  og_site_name: string;
  twitter_card: string;
  twitter_site: string;
  robots: string;
  favicon: string;
  structured_data: string;
  language: string;
};

export const EMPTY_PAGE_SEO: PageSeoForm = {
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  meta_image: "",
  canonical_url: "",
  og_title: "",
  og_description: "",
  og_image: "",
  og_type: "website",
  og_site_name: "",
  twitter_card: "summary_large_image",
  twitter_site: "",
  robots: "index,follow",
  favicon: "",
  structured_data: "",
  language: "en",
};

/** Map GET /getWebsitePageSeo or generate response into the admin form. */
export function apiResponseToPageSeoForm(data: Record<string, unknown> | null | undefined): PageSeoForm {
  if (!data) return { ...EMPTY_PAGE_SEO };
  const nested = data.seo && typeof data.seo === "object" ? (data.seo as Record<string, unknown>) : null;
  const s = nested || data;
  const str = (k: string, alt?: string) => String(s[k] ?? (alt ? s[alt] : "") ?? "").trim();

  return {
    ...EMPTY_PAGE_SEO,
    meta_title: str("meta_title", "title"),
    meta_description: str("meta_description", "description"),
    meta_keywords: str("meta_keywords", "keywords"),
    meta_image: str("meta_image") || str("og_image", "ogImage"),
    canonical_url: str("canonical_url", "canonicalUrl"),
    og_title: str("og_title", "ogTitle"),
    og_description: str("og_description", "ogDescription"),
    og_image: str("og_image", "ogImage") || str("meta_image"),
    og_type: str("og_type", "ogType") || "website",
    og_site_name: str("og_site_name", "ogSiteName"),
    twitter_card: str("twitter_card", "twitterCard") || "summary_large_image",
    twitter_site: str("twitter_site", "twitterSite"),
    robots: str("robots") || "index,follow",
    favicon: str("favicon"),
    structured_data: str("structured_data", "structuredData"),
    language: str("language") || "en",
  };
}
