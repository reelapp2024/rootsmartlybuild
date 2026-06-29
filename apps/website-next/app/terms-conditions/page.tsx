import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import TermsConditionsPageClient from '../components/TermsConditionsPageClient';

/**
 * Generate metadata for Terms & Conditions page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSEOData('/terms-conditions');
  
  const title = seoData.meta_title || 'Terms & Conditions - Service Terms & Policies';
  const description = seoData.meta_description || 'Terms and Conditions. Learn about our service terms, policies, liability, and user agreements for our services.';
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

const TermsConditionsPage = () => {
  return <TermsConditionsPageClient />;
};

export default TermsConditionsPage;
