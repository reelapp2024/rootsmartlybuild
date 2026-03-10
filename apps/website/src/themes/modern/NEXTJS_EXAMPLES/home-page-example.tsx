// app/page.tsx - Home Page with Server-Side Data Fetching
import { Metadata } from 'next'
import HomePageClient from './HomePageClient'
import { httpFile } from '@/config'

// Server-side data fetching function
async function getHomePageData() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'default'
  
  try {
    const { data } = await httpFile.post('/webapp/v1/my_site', {
      projectId,
      pageType: 'home',
      reqFrom: 'Hero'
    })
    return data
  } catch (error) {
    console.error('Error fetching home page data:', error)
    return null
  }
}

// Server-side SEO metadata generation
export async function generateMetadata(): Promise<Metadata> {
  // You can fetch SEO data here or use static data
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'default'
  
  try {
    // Fetch SEO data from your API
    const seoData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webapp/v1/seo?pageType=home&projectId=${projectId}`)
      .then(res => res.json())
      .catch(() => null)
    
    return {
      title: seoData?.meta_title || 'Home - Modern Theme',
      description: seoData?.meta_description || 'Professional services',
      keywords: seoData?.meta_keywords || '',
      openGraph: {
        title: seoData?.meta_title || 'Home - Modern Theme',
        description: seoData?.meta_description || 'Professional services',
        type: 'website',
      },
    }
  } catch (error) {
    return {
      title: 'Home - Modern Theme',
      description: 'Professional services',
    }
  }
}

// Main page component (Server Component)
export default async function HomePage() {
  // Fetch data on server
  const pageData = await getHomePageData()
  
  // Pass data to client component
  return <HomePageClient initialData={pageData} />
}


