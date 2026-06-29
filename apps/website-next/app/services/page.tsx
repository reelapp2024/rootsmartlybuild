import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import ServicesPageClient from '../components/ServicesPageClient';

/**
 * Generate metadata for Services listing page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSEOData('/services');
  
  const title = seoData.meta_title || 'Professional Services - Emergency Service Available 24/7';
  const description = seoData.meta_description || 'Comprehensive professional services including emergency repairs, installations, and more. Available 24/7 nationwide.';
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

const Services = () => {
  return <ServicesPageClient />;
};

export default Services;
