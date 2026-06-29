import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import AboutPageClient from '../components/AboutPageClient';

/**
 * Generate metadata for About page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSEOData('/about');
  
  const title = seoData.meta_title || 'About Us - Professional Services';
  const description = seoData.meta_description || 'Learn more about our company and our commitment to excellence.';
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

const About = () => {
  return <AboutPageClient />;
};

export default About;
