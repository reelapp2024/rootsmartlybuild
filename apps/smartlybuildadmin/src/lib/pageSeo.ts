export type SeoSchema = {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  source: "system" | "ai" | "manual" | string;
  json: Record<string, unknown>;
  updatedAt?: string;
};

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
  schemas: SeoSchema[];
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
  schemas: [],
};

const SCHEMA_SOURCES = new Set(["system", "ai", "manual"]);

export function normalizeSeoSchema(raw: unknown): SeoSchema | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  let json: Record<string, unknown> = {};
  if (typeof s.json === "string") {
    try {
      const parsed = JSON.parse(s.json);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        json = parsed as Record<string, unknown>;
      }
    } catch {
      json = {};
    }
  } else if (s.json && typeof s.json === "object" && !Array.isArray(s.json)) {
    json = s.json as Record<string, unknown>;
  }

  const typeFromJson = Array.isArray(json["@type"])
    ? String(json["@type"][0] || "")
    : String(json["@type"] || "");
  const type = String(s.type || typeFromJson || "Thing").trim() || "Thing";
  const name = String(s.name || type).trim() || type;
  const id = String(s.id || "").trim();
  if (!id) return null;

  const sourceRaw = String(s.source || "manual");
  return {
    id,
    type,
    name,
    enabled: !(s.enabled === false || s.enabled === "false" || s.enabled === 0),
    source: SCHEMA_SOURCES.has(sourceRaw) ? sourceRaw : "manual",
    json,
    updatedAt: s.updatedAt ? String(s.updatedAt) : undefined,
  };
}

export function normalizeSeoSchemas(list: unknown): SeoSchema[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeSeoSchema).filter((s): s is SeoSchema => Boolean(s));
}

/** Map GET /getWebsitePageSeo or generate response into the admin form. */
export function apiResponseToPageSeoForm(data: Record<string, unknown> | null | undefined): PageSeoForm {
  if (!data) return { ...EMPTY_PAGE_SEO, schemas: [] };
  const nested = data.seo && typeof data.seo === "object" ? (data.seo as Record<string, unknown>) : null;
  const s = nested || data;
  const str = (k: string, alt?: string) => String(s[k] ?? (alt ? s[alt] : "") ?? "").trim();

  const schemasRaw = s.schemas ?? data.schemas;
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
    schemas: normalizeSeoSchemas(schemasRaw),
  };
}

export function newClientSchemaId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `seo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const COMMON_SCHEMA_TYPES = [
  "Organization",
  "LocalBusiness",
  "WebPage",
  "BreadcrumbList",
  "Service",
  "FAQPage",
  "AggregateRating",
  "Product",
  "Article",
  "WebSite",
] as const;
