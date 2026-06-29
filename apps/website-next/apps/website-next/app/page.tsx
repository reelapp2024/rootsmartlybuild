import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import { fetchHomePageData } from './utils/fetchHomePageData';
import HomePageClient from './components/HomePageClient';

/**
 * Generate metadata for home page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSEOData('/home');
  
  const title = seoData.meta_title || 'Home - Professional Services';
  const description = seoData.meta_description || 'Professional services for your needs';
  const keywords = seoData.meta_keywords || '';

  return {
    title,
    description,
    keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Step 1: SSR Implementation - Fetch data server-side for faster LCP
const Index = async ({ searchParams = {} }: PageProps) => {
  try {
    // Get projectId from URL params or env variable
    // Handle both string and string[] cases (Next.js can return arrays for duplicate params)
    const siteIdParam = searchParams?.siteId;
    const siteId = siteIdParam 
      ? (Array.isArray(siteIdParam) ? siteIdParam[0] : siteIdParam)
      : undefined;
    
    const projectId = 
      (typeof siteId === 'string' && siteId.trim() ? siteId.trim() : null) ||
      process.env.NEXT_PUBLIC_PROJECT_ID ||
      null;

    // Fetch homepage data server-side (SSR)
    const initialData = await fetchHomePageData(projectId);

    return <HomePageClient initialData={initialData} />;
  } catch (error) {
    // Fallback: render without initial data if SSR fetch fails
    // Client-side will handle fetching
    console.error('Error in Index page:', error);
    return <HomePageClient initialData={null} />;
  }
};

export default Index;
