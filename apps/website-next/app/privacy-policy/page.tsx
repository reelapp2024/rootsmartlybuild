import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import PrivacyPolicyPageClient from '../components/PrivacyPolicyPageClient';

/**
 * Generate metadata for Privacy Policy page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSEOData('/privacy-policy');
  
  const title = seoData.meta_title || 'Privacy Policy - Data Protection & Privacy';
  const description = seoData.meta_description || 'Privacy Policy. Learn how we collect, use, and protect your personal information. We are committed to protecting your privacy.';
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

const PrivacyPolicyPage = () => {
  return <PrivacyPolicyPageClient />;
};

export default PrivacyPolicyPage;
