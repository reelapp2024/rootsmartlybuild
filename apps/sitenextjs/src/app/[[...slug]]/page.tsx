import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getDefaultProjectId, isDemoMode } from '@/lib/projectConfig';

/** Lazy-load the heavy GenieBuild client so `page.js` itself stays small and
 *  doesn't hit webpack's ChunkLoadError timeout on cold compile. */
const HomePageClientV2 = dynamic(() => import('../components/HomePageClientV2'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen text-sm text-slate-500">
      Loading site…
    </div>
  ),
});

/** Static export: only `/` HTML; other paths use SPA + .htaccess. Dev: all paths render the app shell. */
export function generateStaticParams() {
  return [{ slug: [] }];
}

export default function CatchAllPage() {
  const defaultProjectId = getDefaultProjectId();
  const demoMode = isDemoMode();
  return (
    <div className="full-width min-h-screen">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">Loading...</div>
        }
      >
        <HomePageClientV2 defaultProjectId={defaultProjectId} demoMode={demoMode} />
      </Suspense>
    </div>
  );
}
