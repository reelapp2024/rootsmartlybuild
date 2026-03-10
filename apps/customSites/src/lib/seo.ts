import type { Metadata } from 'next';

/**
 * Fetch SEO settings for a builder page
 */
export async function getSeoSettings(projectId: string, pageId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://apis.smartlybuild.dev/admin/v1';
    const queryParams = new URLSearchParams({ projectId });
    if (pageId) {
      queryParams.append('pageId', pageId);
    }

    const response = await fetch(`${apiUrl}/builderSeoSettings?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      // If 404 or no data, return null (not an error)
      if (response.status === 404) {
        return null;
      }
      console.error('Error fetching SEO settings:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return null;
  }
}

/**
 * Format SEO data for Next.js metadata
 */
export function formatSeoMetadata(seoData: any): Metadata {
  if (!seoData) {
    return {
      title: 'Custom Website',
      description: 'Website created with SmartlyBuild',
    };
  }

  const metadata: Metadata = {
    title: seoData.meta_title || 'Custom Website',
    description: seoData.meta_description || 'Website created with SmartlyBuild',
    openGraph: {
      title: seoData.meta_title || 'Custom Website',
      description: seoData.meta_description || 'Website created with SmartlyBuild',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.meta_title || 'Custom Website',
      description: seoData.meta_description || 'Website created with SmartlyBuild',
    },
  };

  // Add meta image if available
  if (seoData.meta_image) {
    metadata.openGraph!.images = [{ url: seoData.meta_image }];
    metadata.twitter!.images = [seoData.meta_image];
  }

  // Add canonical URL if available
  if (seoData.canonical_url) {
    metadata.alternates = {
      canonical: seoData.canonical_url,
    };
  }

  // Add keywords as other metadata (Next.js doesn't have direct keywords support)
  if (seoData.meta_keywords) {
    metadata.other = {
      keywords: seoData.meta_keywords,
    };
  }

  return metadata;
}

