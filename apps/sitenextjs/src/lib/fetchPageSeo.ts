import { normalizePageSeoFromApi, formatSeoMetadata, type PageSeoRecord } from './seo';
import { getDefaultProjectId } from './projectConfig';
import { resolveSiteNextJsApiUrl } from './resolveSiteNextApiUrl';
import type { Metadata } from 'next';

function getSiteNextJsApiUrl(): string {
  return resolveSiteNextJsApiUrl();
}

/**
 * Server-side SEO for generateMetadata. Uses resolve_slug so old slugs (301) still resolve.
 */
export async function fetchPageSeoForSlug(
  projectId: string,
  slug: string
): Promise<PageSeoRecord | null> {
  if (!projectId) return null;
  const base = getSiteNextJsApiUrl();
  const normalizedSlug = String(slug || '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();

  try {
    const resolveRes = await fetch(`${base}/resolve_slug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, slug: normalizedSlug }),
      next: { revalidate: 60 },
    });
    if (!resolveRes.ok) return null;
    const resolveBody = await resolveRes.json();
    const pageId = resolveBody?.data?.pageId;
    if (!pageId) return null;

    const pageRes = await fetch(`${base}/website_page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        pageId: String(pageId),
        slug: normalizedSlug,
      }),
      next: { revalidate: 60 },
    });
    if (!pageRes.ok) return null;
    const pageBody = await pageRes.json();
    return normalizePageSeoFromApi(pageBody?.data);
  } catch (e) {
    console.error('[fetchPageSeoForSlug]', e);
    return null;
  }
}

export async function buildMetadataForSlug(slug: string): Promise<Metadata> {
  const projectId = getDefaultProjectId();
  if (!projectId) {
    return formatSeoMetadata(null);
  }
  const seo = await fetchPageSeoForSlug(projectId, slug);
  return formatSeoMetadata(seo);
}
