import { Suspense } from 'react';
import HomePageClientV2 from '../components/HomePageClientV2';
import { getDefaultProjectId, isDemoMode } from '@/lib/projectConfig';

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
