import type { SEOMetadata } from '../../../types';

/** API / WebsitePage.seoSettings row (snake_case or GenieBuild camelCase). */
export type ApiSeoPayload = Record<string, unknown> | null | undefined;

export function apiSeoToMetadata(raw: ApiSeoPayload): SEOMetadata {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const nested =
    r.seo && typeof r.seo === 'object' ? (r.seo as Record<string, unknown>) : null;
  const s = nested || r;

  return {
    title: String(s.meta_title ?? s.title ?? s.og_title ?? '').trim(),
    description: String(s.meta_description ?? s.description ?? s.og_description ?? '').trim(),
    keywords: String(s.meta_keywords ?? s.keywords ?? '').trim(),
    canonicalUrl: String(s.canonical_url ?? s.canonicalUrl ?? '').trim(),
    ogTitle: String(s.og_title ?? s.ogTitle ?? '').trim(),
    ogDescription: String(s.og_description ?? s.ogDescription ?? '').trim(),
    ogImage: String(s.og_image ?? s.ogImage ?? s.meta_image ?? '').trim(),
    ogType: String(s.og_type ?? s.ogType ?? 'website').trim(),
    ogSiteName: String(s.og_site_name ?? s.ogSiteName ?? '').trim(),
    twitterCard: (s.twitter_card ?? s.twitterCard ?? 'summary_large_image') as SEOMetadata['twitterCard'],
    twitterSite: String(s.twitter_site ?? s.twitterSite ?? '').trim(),
    robots: (s.robots ?? 'index,follow') as SEOMetadata['robots'],
    favicon: String(s.favicon ?? '').trim(),
    structuredData: String(s.structured_data ?? s.structuredData ?? '').trim(),
    language: String(s.language ?? 'en').trim(),
  };
}

export function metadataToApiPatch(seo: SEOMetadata): Record<string, string> {
  return {
    title: seo.title || '',
    description: seo.description || '',
    keywords: seo.keywords || '',
    canonicalUrl: seo.canonicalUrl || '',
    ogTitle: seo.ogTitle || '',
    ogDescription: seo.ogDescription || '',
    ogImage: seo.ogImage || '',
    ogType: seo.ogType || 'website',
    ogSiteName: seo.ogSiteName || '',
    twitterCard: seo.twitterCard || 'summary_large_image',
    twitterSite: seo.twitterSite || '',
    robots: seo.robots || 'index,follow',
    favicon: seo.favicon || '',
    structuredData: seo.structuredData || '',
    language: seo.language || 'en',
  };
}

export function pickSeoFromGenieBuildPageResponse(data: ApiSeoPayload): SEOMetadata {
  if (!data || typeof data !== 'object') return {};
  const d = data as Record<string, unknown>;
  if (d.seo && typeof d.seo === 'object') {
    return apiSeoToMetadata(d.seo as Record<string, unknown>);
  }
  const first = Array.isArray(d.seoSettings) ? d.seoSettings[0] : null;
  if (first && typeof first === 'object') {
    return apiSeoToMetadata(first as Record<string, unknown>);
  }
  return {};
}

export async function fetchPageSeo(
  apiBaseUrl: string,
  projectId: string,
  pageId: string,
  token?: string | null
): Promise<SEOMetadata | null> {
  if (!projectId || !pageId) return null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${apiBaseUrl}/getWebsitePageSeo/${projectId}/${pageId}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => ({}));
  const data = body?.data;
  if (!data) return null;
  return apiSeoToMetadata(data);
}
