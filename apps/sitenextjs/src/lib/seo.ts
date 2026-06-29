import type { Metadata } from 'next';



export type PageSeoRecord = {

  meta_title?: string;

  meta_description?: string;

  meta_keywords?: string;

  meta_image?: string;

  canonical_url?: string;

  og_title?: string;

  og_description?: string;

  og_image?: string;

  og_type?: string;

  og_site_name?: string;

  twitter_card?: string;

  twitter_site?: string;

  robots?: string;

  favicon?: string;

  structured_data?: string;

  language?: string;

};



/** Normalize WebsitePage SEO from getGenieBuildPageData / website_page (supports legacy shapes). */

export function normalizePageSeoFromApi(payload: {

  seo?: Record<string, unknown>;

  seoSettings?: Array<Record<string, unknown>>;

} | null | undefined): PageSeoRecord | null {

  if (!payload) return null;



  const camel = payload.seo;

  if (camel && typeof camel === 'object') {

    const c = camel as Record<string, unknown>;

    return {

      meta_title: String(c.title ?? c.meta_title ?? c.ogTitle ?? '').trim(),

      meta_description: String(c.description ?? c.meta_description ?? c.ogDescription ?? '').trim(),

      meta_keywords: String(c.keywords ?? c.meta_keywords ?? '').trim(),

      meta_image: String(c.ogImage ?? c.meta_image ?? c.og_image ?? '').trim(),

      canonical_url: String(c.canonicalUrl ?? c.canonical_url ?? '').trim(),

      og_title: String(c.ogTitle ?? c.og_title ?? c.title ?? '').trim(),

      og_description: String(c.ogDescription ?? c.og_description ?? c.description ?? '').trim(),

      og_image: String(c.ogImage ?? c.og_image ?? c.meta_image ?? '').trim(),

      og_type: String(c.ogType ?? c.og_type ?? 'website').trim(),

      og_site_name: String(c.ogSiteName ?? c.og_site_name ?? '').trim(),

      twitter_card: String(c.twitterCard ?? c.twitter_card ?? 'summary_large_image').trim(),

      twitter_site: String(c.twitterSite ?? c.twitter_site ?? '').trim(),

      robots: String(c.robots ?? 'index,follow').trim(),

      favicon: String(c.favicon ?? '').trim(),

      structured_data: String(c.structuredData ?? c.structured_data ?? '').trim(),

      language: String(c.language ?? 'en').trim(),

    };

  }



  const row = Array.isArray(payload.seoSettings) ? payload.seoSettings[0] : null;

  if (!row || typeof row !== 'object') return null;



  const s = row as Record<string, unknown>;

  return {

    meta_title: String(s.meta_title ?? '').trim(),

    meta_description: String(s.meta_description ?? '').trim(),

    meta_keywords: String(s.meta_keywords ?? '').trim(),

    meta_image: String(s.meta_image ?? s.og_image ?? '').trim(),

    canonical_url: String(s.canonical_url ?? '').trim(),

    og_title: String(s.og_title ?? s.meta_title ?? '').trim(),

    og_description: String(s.og_description ?? s.meta_description ?? '').trim(),

    og_image: String(s.og_image ?? s.meta_image ?? '').trim(),

    og_type: String(s.og_type ?? 'website').trim(),

    og_site_name: String(s.og_site_name ?? '').trim(),

    twitter_card: String(s.twitter_card ?? 'summary_large_image').trim(),

    twitter_site: String(s.twitter_site ?? '').trim(),

    robots: String(s.robots ?? 'index,follow').trim(),

    favicon: String(s.favicon ?? '').trim(),

    structured_data: String(s.structured_data ?? '').trim(),

    language: String(s.language ?? 'en').trim(),

  };

}



export function formatSeoMetadata(seoData: PageSeoRecord | null | undefined): Metadata {

  if (!seoData) {

    return {

      title: 'Custom Website',

      description: 'Website created with SmartlyBuild',

    };

  }



  const title = seoData.meta_title || seoData.og_title || 'Custom Website';

  const description = seoData.meta_description || seoData.og_description || 'Website created with SmartlyBuild';

  const image = seoData.og_image || seoData.meta_image;



  const metadata: Metadata = {

    title,

    description,

    robots: seoData.robots || undefined,

    openGraph: {

      title: seoData.og_title || title,

      description: seoData.og_description || description,

      type: (seoData.og_type as 'website') || 'website',

      siteName: seoData.og_site_name || undefined,

    },

    twitter: {

      card: (seoData.twitter_card as 'summary' | 'summary_large_image') || 'summary_large_image',

      title: seoData.og_title || title,

      description: seoData.og_description || description,

      site: seoData.twitter_site || undefined,

    },

  };



  if (image) {

    metadata.openGraph!.images = [{ url: image }];

    metadata.twitter!.images = [image];

  }



  if (seoData.canonical_url) {

    metadata.alternates = { canonical: seoData.canonical_url };

  }



  if (seoData.meta_keywords) {

    metadata.other = { keywords: seoData.meta_keywords };

  }



  return metadata;

}



/** Client-side head tags (HomePageClientV2). Canonical uses live path from API (301-safe). */

export function applySeoToDocument(seoData: PageSeoRecord | null | undefined) {

  if (typeof document === 'undefined' || !seoData) return;



  document.querySelectorAll('[data-sitenextjs-seo]').forEach((el) => el.remove());



  const title = seoData.meta_title || seoData.og_title;

  if (title) document.title = title;



  if (seoData.language) {

    document.documentElement.setAttribute('lang', seoData.language);

  }



  const head = document.head;

  const addMeta = (attrs: Record<string, string>) => {

    const el = document.createElement('meta');

    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));

    el.setAttribute('data-sitenextjs-seo', '');

    head.appendChild(el);

  };

  const addLink = (attrs: Record<string, string>) => {

    const el = document.createElement('link');

    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));

    el.setAttribute('data-sitenextjs-seo', '');

    head.appendChild(el);

  };



  let canonical = (seoData.canonical_url || '').trim();

  if (canonical && canonical.startsWith('/')) {

    canonical = `${window.location.origin}${canonical}`;

  }



  if (seoData.meta_description) addMeta({ name: 'description', content: seoData.meta_description });

  if (seoData.meta_keywords) addMeta({ name: 'keywords', content: seoData.meta_keywords });

  if (seoData.robots) addMeta({ name: 'robots', content: seoData.robots });

  if (canonical) addLink({ rel: 'canonical', href: canonical });

  if (seoData.favicon) addLink({ rel: 'icon', href: seoData.favicon });



  const ogTitle = seoData.og_title || seoData.meta_title;

  const ogDesc = seoData.og_description || seoData.meta_description;

  const ogImg = seoData.og_image || seoData.meta_image;

  if (ogTitle) addMeta({ property: 'og:title', content: ogTitle });

  if (ogDesc) addMeta({ property: 'og:description', content: ogDesc });

  if (ogImg) addMeta({ property: 'og:image', content: ogImg });

  if (canonical) addMeta({ property: 'og:url', content: canonical });

  if (seoData.og_type) addMeta({ property: 'og:type', content: seoData.og_type });

  if (seoData.og_site_name) addMeta({ property: 'og:site_name', content: seoData.og_site_name });



  const tCard = seoData.twitter_card || (ogImg ? 'summary_large_image' : 'summary');

  addMeta({ name: 'twitter:card', content: tCard });

  if (ogTitle) addMeta({ name: 'twitter:title', content: ogTitle });

  if (ogDesc) addMeta({ name: 'twitter:description', content: ogDesc });

  if (ogImg) addMeta({ name: 'twitter:image', content: ogImg });

  if (seoData.twitter_site) addMeta({ name: 'twitter:site', content: seoData.twitter_site });



  if (seoData.structured_data) {

    try {

      JSON.parse(seoData.structured_data);

      const script = document.createElement('script');

      script.type = 'application/ld+json';

      script.textContent = seoData.structured_data;

      script.setAttribute('data-sitenextjs-seo', '');

      head.appendChild(script);

    } catch {

      /* invalid JSON — skip */

    }

  }

}


