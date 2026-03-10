import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomePageClient from './components/HomePageClient';
import { getSeoSettings, formatSeoMetadata } from '@/lib/seo';

const DEFAULT_PAGE_ID = '696f79b4166cab82e3ac09a5';

// Generate dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    
    if (!projectId) {
      return {
        title: 'Custom Website',
        description: 'Website created with SmartlyBuild',
      };
    }

    // Fetch SEO settings
    const seoData = await getSeoSettings(projectId, DEFAULT_PAGE_ID);
    
    // Format and return metadata
    return formatSeoMetadata(seoData);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Custom Website',
      description: 'Website created with SmartlyBuild',
    };
  }
}

export default function HomePage() {
  return (
    <div className="full-width min-h-screen">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <HomePageClient />
      </Suspense>
    </div>
  );
}
