'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (projectId) {
        // Set projectId in localStorage immediately
        localStorage.setItem('currentSiteId', projectId);
        console.log('Preview: Setting projectId in localStorage:', projectId);
        
        // Redirect immediately to home page with siteId query parameter
        const redirectUrl = `/?siteId=${projectId}`;
        console.log('Preview: Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
        // If no projectId, redirect to home
        console.error('Preview: No projectId found in URL');
        window.location.href = '/';
      }
    }
  }, [projectId]);

  // Show minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

