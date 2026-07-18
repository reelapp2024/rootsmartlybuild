import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PROJECT_ID_COOKIE_KEY, resolveProjectId } from '@/lib/projectConfig';
import { resolveSiteNextJsApiUrl } from '@/lib/resolveSiteNextApiUrl';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const projectIdFromQuery = (request.nextUrl.searchParams.get('projectId') || '').trim();
  const projectId = resolveProjectId(projectIdFromQuery, {
    cookie: request.cookies.get(PROJECT_ID_COOKIE_KEY)?.value,
  });

  const continueWithProjectCookie = (response: NextResponse) => {
    if (projectIdFromQuery) {
      response.cookies.set(PROJECT_ID_COOKIE_KEY, projectIdFromQuery, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
    return response;
  };

  if (!projectId) return NextResponse.next();

  const slug = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!slug) return continueWithProjectCookie(NextResponse.next());

  try {
    const apiUrl = resolveSiteNextJsApiUrl();
    const response = await fetch(`${apiUrl}/resolve_slug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, slug }),
      cache: 'no-store',
    });

    if (!response.ok) return continueWithProjectCookie(NextResponse.next());

    const payload = await response.json();
    if (payload?.kind === 'redirect' && payload?.redirect?.to) {
      const destination = new URL(payload.redirect.to, request.url);
      request.nextUrl.searchParams.forEach((value, key) => {
        if (key !== 'pageId') destination.searchParams.set(key, value);
      });
      return continueWithProjectCookie(
        NextResponse.redirect(destination, payload.redirect.statusCode || 301)
      );
    }
  } catch {
    // Allow client-side resolution if middleware lookup fails.
  }

  return continueWithProjectCookie(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
