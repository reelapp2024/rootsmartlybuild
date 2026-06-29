import type { Metadata } from 'next';
import { fetchSEOData } from '@/utils/fetchSEOData';
import BlogPageClient from '../components/BlogPageClient';

/**
 * Generate metadata for Blog listing page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await fetchSEOData('/blog');
  
  const title = seoData.meta_title || 'Blog | Latest Articles & Insights';
  const description = seoData.meta_description || 'Browse the latest blog posts, articles, and expert insights from our team of professionals.';
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

const Blog = () => {
  return <BlogPageClient />;
};

export default Blog;
