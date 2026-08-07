'use client';

import dynamic from 'next/dynamic';

/**
 * Thin client boundary so `app/[[...slug]]/page.js` stays small.
 * Loading GenieBuild directly from the Server Component page pulled ~15MB into
 * that chunk and caused ChunkLoadError timeouts on cold webpack compiles.
 */
const HomePageClientV2 = dynamic(() => import('./HomePageClientV2'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen text-sm text-slate-500">
      Loading site…
    </div>
  ),
});

type SiteAppLoaderProps = {
  defaultProjectId?: string;
  demoMode?: boolean;
};

export default function SiteAppLoader({ defaultProjectId, demoMode }: SiteAppLoaderProps) {
  return <HomePageClientV2 defaultProjectId={defaultProjectId} demoMode={demoMode} />;
}
