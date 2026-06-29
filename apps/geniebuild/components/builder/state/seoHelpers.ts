import type { SEOMetadata } from '../../../types';

/**
 * Apply SEO metadata to the current document's `<head>`:
 *   - <title>
 *   - <meta name="description">
 *   - <meta name="keywords">
 *   - <meta name="robots">
 *   - <link rel="canonical">
 *   - OpenGraph tags (og:title, og:description, og:image)
 *   - Twitter card tags
 *   - <link rel="icon"> (favicon)
 *   - Optional JSON-LD <script>
 *
 * All tags carry `data-geniebuild-seo=""` so we can remove/replace them on
 * subsequent updates without touching user/host tags.
 */
export function applySeoToDocument(seo: SEOMetadata | undefined | null): void {
  if (typeof document === 'undefined') return;
  const data = seo || {};

  // Remove any previously-applied tags
  document.querySelectorAll('[data-geniebuild-seo]').forEach((el) => el.remove());

  // <html lang="..."> — set whenever the SEO carries a language hint. We
  // don't tag this with data-geniebuild-seo because the attribute lives on
  // <html>, not a removable meta tag, and we want it to persist across
  // re-applies. Defaults are left to the host page when language is absent.
  if (data.language) {
    document.documentElement.setAttribute('lang', data.language);
  }

  // <title>
  if (data.title) document.title = data.title;

  const head = document.head;
  const addMeta = (attrs: Record<string, string>) => {
    const el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.setAttribute('data-geniebuild-seo', '');
    head.appendChild(el);
  };
  const addLink = (attrs: Record<string, string>) => {
    const el = document.createElement('link');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.setAttribute('data-geniebuild-seo', '');
    head.appendChild(el);
  };

  if (data.description) addMeta({ name: 'description', content: data.description });
  if (data.keywords) addMeta({ name: 'keywords', content: data.keywords });
  if (data.robots) addMeta({ name: 'robots', content: data.robots });
  if (data.canonicalUrl) addLink({ rel: 'canonical', href: data.canonicalUrl });

  // OpenGraph — every social sharer (FB, LinkedIn, WhatsApp, Slack) reads these.
  // Fall back through og_* → title/description so existing pages without
  // explicit OG fields still produce valid preview cards.
  const ogTitle = data.ogTitle || data.title;
  const ogDescription = data.ogDescription || data.description;
  if (ogTitle) addMeta({ property: 'og:title', content: ogTitle });
  if (ogDescription) addMeta({ property: 'og:description', content: ogDescription });
  if (data.ogImage) addMeta({ property: 'og:image', content: data.ogImage });
  if (data.ogImage) addMeta({ property: 'og:image:alt', content: ogTitle || '' });
  if (data.canonicalUrl) addMeta({ property: 'og:url', content: data.canonicalUrl });
  addMeta({ property: 'og:type', content: data.ogType || 'website' });
  if (data.ogSiteName) addMeta({ property: 'og:site_name', content: data.ogSiteName });

  // Twitter Card — auto-pick summary_large_image when an image is present.
  const tCard = data.twitterCard || (data.ogImage ? 'summary_large_image' : 'summary');
  addMeta({ name: 'twitter:card', content: tCard });
  if (ogTitle) addMeta({ name: 'twitter:title', content: ogTitle });
  if (ogDescription) addMeta({ name: 'twitter:description', content: ogDescription });
  if (data.ogImage) addMeta({ name: 'twitter:image', content: data.ogImage });
  if (data.twitterSite) addMeta({ name: 'twitter:site', content: data.twitterSite });

  // Favicon
  if (data.favicon) addLink({ rel: 'icon', href: data.favicon });

  // JSON-LD (only if it parses as JSON to avoid injecting broken script)
  if (data.structuredData) {
    try {
      const parsed = JSON.parse(data.structuredData);
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(parsed);
      script.setAttribute('data-geniebuild-seo', '');
      head.appendChild(script);
    } catch {
      // Invalid JSON — silently skip in preview; the form will still save the
      // raw string so the user can fix it.
    }
  }
}

/**
 * Generate a robots.txt body from SEO metadata. The host app is expected to
 * serve this at /robots.txt when publishing.
 */
export function buildRobotsTxt(seo: SEOMetadata | undefined | null, sitemapUrl?: string): string {
  const lines: string[] = ['User-agent: *'];
  const robots = seo?.robots || 'index,follow';
  if (robots.includes('noindex')) {
    lines.push('Disallow: /');
  } else {
    lines.push('Allow: /');
  }
  if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`);
  return lines.join('\n') + '\n';
}

/**
 * Generate a minimal sitemap.xml containing a single URL entry.
 * Host app should extend this to include all published pages.
 */
export function buildSitemapXml(seo: SEOMetadata | undefined | null): string {
  const url = seo?.canonicalUrl;
  if (!url) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n`;
  }
  const today = new Date().toISOString().split('T')[0];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${escapeXml(url)}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
}
