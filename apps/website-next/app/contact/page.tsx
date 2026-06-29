import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import ContactPageClient from '../components/ContactPageClient';

/**
 * Generate metadata for Contact page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSEOData('/contact');
  
  const title = seoData.meta_title || 'Contact Us - Professional Services';
  const description = seoData.meta_description || 'Get in touch with us for professional services. Contact us today for a free quote and same-day booking.';
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

const Contact = () => {
  return <ContactPageClient />;
};

export default Contact;
