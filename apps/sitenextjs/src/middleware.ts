import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveProjectId } from '@/lib/projectConfig';

function resolveSiteNextJsApiUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_SITENEXTJS_API_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const adminUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (adminUrl) {
    try {
      const normalized = adminUrl.replace(/\/+$/, '');
      const u = new URL(normalized.includes('://') ? normalized : `https://${normalized}`);
      return `${u.origin}/sitenextjs/v1`;
    } catch {
      /* fall through */
    }
  }

  return 'https://apis.smartlybuild.dev/sitenextjs/v1';
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const projectId = resolveProjectId(
    request.nextUrl.searchParams.get('projectId')
  );
  if (!projectId) return NextResponse.next();

  const slug = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!slug) return NextResponse.next();

  try {
    const apiUrl = resolveSiteNextJsApiUrl();
    const response = await fetch(`${apiUrl}/resolve_slug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, slug }),
      cache: 'no-store',
    });

    if (!response.ok) return NextResponse.next();

    const payload = await response.json();
    if (payload?.kind === 'redirect' && payload?.redirect?.to) {
      const destination = new URL(payload.redirect.to, request.url);
      request.nextUrl.searchParams.forEach((value, key) => {
        if (key !== 'pageId') destination.searchParams.set(key, value);
      });
      return NextResponse.redirect(destination, payload.redirect.statusCode || 301);
    }
  } catch {
    // Allow client-side resolution if middleware lookup fails.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
