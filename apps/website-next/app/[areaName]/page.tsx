import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import AreaDetailPageClient from '../components/AreaDetailPageClient';

interface AreaDetailPageProps {
  params: Promise<{ areaName: string }>;
}

/**
 * Generate metadata for Area detail page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata({ params }: AreaDetailPageProps): Promise<Metadata> {
  const { areaName } = await params;
  
  // Construct the SEO path
  const seoPath = `/${areaName}`;
  const seoData = await fetchSEOData(seoPath);
  
  const title = seoData.meta_title || `Professional Services in ${areaName} - Available 24/7`;
  const description = seoData.meta_description || `Professional services available in ${areaName}. Expert technicians available 24/7 with fast response times.`;
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

const AreaDetailPage = async ({ params }: AreaDetailPageProps) => {
  return <AreaDetailPageClient />;
};

export default AreaDetailPage;
