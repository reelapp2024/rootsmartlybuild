import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import AreasPageClient from './page';

/**
 * Generate metadata for Areas listing page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSEOData('/areas');
  
  const title = seoData.meta_title || 'Service Areas - Professional Services Available Nationwide';
  const description = seoData.meta_description || 'Find professional services in your area. Available 24/7 with fast response times and expert technicians.';
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

const AreasPage = () => {
  return <AreasPageClient />;
};

export default AreasPage;

