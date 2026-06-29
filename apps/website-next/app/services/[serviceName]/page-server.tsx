import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import DrainCleaning from './page';

interface ServiceDetailPageProps {
  params: Promise<{ serviceName: string }>;
}

/**
 * Generate metadata for Service detail page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { serviceName } = await params;
  
  // Construct the SEO path - try with and without location prefix
  // Since location is client-side, we'll use the base path
  const seoPath = `/services/${serviceName}`;
  const seoData = await fetchSEOData(seoPath);
  
  const title = seoData.meta_title || `${serviceName} - Professional Service`;
  const description = seoData.meta_description || `Professional ${serviceName} service available 24/7. Expert technicians with fast response times.`;
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

const ServiceDetailPage = async ({ params }: ServiceDetailPageProps) => {
  return <DrainCleaning />;
};

export default ServiceDetailPage;

