import type { Metadata } from 'next';
import axios from 'axios';
import BlogDetailPageClient from '../../components/BlogDetailPageClient';

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.smartlybuild.dev";
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || "";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "";

/**
 * Generate metadata for Blog detail page using Next.js Metadata API
 * This runs on the server and provides better SEO than client-side meta tags
 */
export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("projectId", PROJECT_ID);

    const res = await axios.post(`${API_URL}/webapp/v1/get_blog_by_slug`, formData, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const blog = res.data.data;
    const title = blog.title || `${slug} - Blog Post`;
    
    // Extract description from content (first 160 characters)
    const doc = new DOMParser().parseFromString(blog.content || '', "text/html");
    const textContent = doc.body.textContent || '';
    const description = textContent.substring(0, 160).trim() || `Read our blog post about ${slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Error fetching blog metadata:", error);
    // Fallback metadata
    return {
      title: `${slug} - Blog Post`,
      description: `Read our blog post about ${slug}`,
    };
  }
}

const BlogDetailPage = async ({ params }: BlogDetailPageProps) => {
  return <BlogDetailPageClient />;
};

export default BlogDetailPage;
