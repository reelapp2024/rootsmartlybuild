/**
 * Public blog reviews / comments API (Join the Conversation).
 * Uses existing backend routes: add_review, get_reviews (webapp + sitenextjs).
 */

import { API_BASE_URL } from '../config';

export type BlogReviewComment = {
  id?: string;
  name: string;
  avatar: string;
  date: string;
  text: string;
  rating?: number;
};

export type AddReviewPayload = {
  blogId: string;
  fullName: string;
  email: string;
  rating: number;
  reviewText: string;
};

function resolveReviewApiBases(): string[] {
  const bases: string[] = [];
  const push = (raw?: string | null) => {
    const v = String(raw || '').trim().replace(/\/+$/, '');
    if (v && !bases.includes(v)) bases.push(v);
  };

  const swapPrefix = (base: string, from: RegExp, to: string) =>
    from.test(base) ? base.replace(from, to) : base;

  push(API_BASE_URL);

  try {
    const nextAdmin =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITENEXTJS_API_URL
        : '';
    const trimmed = String(nextAdmin || '').trim().replace(/\/+$/, '');
    if (trimmed) {
      if (/\/sitenextjs\/v1$/i.test(trimmed)) {
        push(trimmed);
        push(trimmed.replace(/\/sitenextjs\/v1$/i, '/webapp/v1'));
        push(trimmed.replace(/\/sitenextjs\/v1$/i, '/admin/v1'));
      } else if (/\/admin\/v1$/i.test(trimmed)) {
        push(trimmed);
        push(trimmed.replace(/\/admin\/v1$/i, '/sitenextjs/v1'));
        push(trimmed.replace(/\/admin\/v1$/i, '/webapp/v1'));
      } else if (/\/webapp\/v1$/i.test(trimmed)) {
        push(trimmed);
      } else {
        push(`${trimmed}/sitenextjs/v1`);
        push(`${trimmed}/webapp/v1`);
        push(`${trimmed}/admin/v1`);
      }
    }
  } catch {
    /* ignore */
  }

  // Prefer public mounts first for anonymous review submit
  const preferred = bases.flatMap((b) => [
    swapPrefix(b, /\/admin\/v1$/i, '/sitenextjs/v1'),
    swapPrefix(b, /\/admin\/v1$/i, '/webapp/v1'),
    b,
  ]);
  const unique: string[] = [];
  for (const b of preferred) {
    if (b && !unique.includes(b)) unique.push(b);
  }
  if (!unique.length) {
    unique.push('http://localhost:1111/sitenextjs/v1', 'http://localhost:1111/webapp/v1');
  }
  return unique;
}

function formatRelativeDate(value?: string | Date | null): string {
  if (!value) return '';
  try {
    const then = new Date(value).getTime();
    if (!Number.isFinite(then)) return '';
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
    return new Date(then).toLocaleDateString();
  } catch {
    return '';
  }
}

function mapApiReview(raw: any): BlogReviewComment | null {
  const user = raw?.user || {};
  const name =
    String(user.fullName || user.name || raw?.fullName || 'Reader').trim() || 'Reader';
  const text = String(raw?.reviewText || raw?.text || '').trim();
  if (!text) return null;
  const avatar =
    String(user.image || raw?.image || raw?.avatar || '').trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E11D48&color=fff`;
  return {
    id: raw?._id ? String(raw._id) : undefined,
    name,
    avatar,
    date: formatRelativeDate(raw?.createdAt || raw?.updatedAt) || 'Recently',
    text,
    rating: Number(raw?.rating) || undefined,
  };
}

/** Fetch approved reviews for a blog (status=1). */
export async function fetchBlogReviews(blogId: string): Promise<BlogReviewComment[]> {
  const id = String(blogId || '').trim();
  if (!id) return [];

  let lastError: unknown = null;
  for (const base of resolveReviewApiBases()) {
    try {
      const res = await fetch(`${base}/get_reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId: id, page: 1, limit: 50 }),
      });
      if (!res.ok) continue;
      const body = await res.json().catch(() => ({}));
      const list = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.data?.reviews)
          ? body.data.reviews
          : [];
      return list.map(mapApiReview).filter(Boolean) as BlogReviewComment[];
    } catch (err) {
      lastError = err;
    }
  }
  console.warn('[fetchBlogReviews] failed:', lastError);
  return [];
}

/** Submit a new review (pending approval until admin approves). */
export async function submitBlogReview(
  payload: AddReviewPayload
): Promise<{ ok: boolean; message: string }> {
  const blogId = String(payload.blogId || '').trim();
  const fullName = String(payload.fullName || '').trim();
  const email = String(payload.email || '').trim();
  const reviewText = String(payload.reviewText || '').trim();
  const rating = Math.min(5, Math.max(1, Number(payload.rating) || 5));

  if (!blogId) return { ok: false, message: 'Missing blog id' };
  if (!fullName) return { ok: false, message: 'Please enter your name' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'Please enter a valid email' };
  }
  if (!reviewText || reviewText.length < 3) {
    return { ok: false, message: 'Please write a short comment' };
  }

  let lastMessage = 'Could not submit comment';
  for (const base of resolveReviewApiBases()) {
    try {
      const res = await fetch(`${base}/add_review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogId,
          fullName,
          email,
          rating,
          reviewText,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok || res.status === 201) {
        return {
          ok: true,
          message:
            String(body?.message || '').trim() ||
            'Thanks! Your comment was submitted and will appear after approval.',
        };
      }
      lastMessage = String(body?.message || lastMessage);
    } catch (err: any) {
      lastMessage = err?.message || lastMessage;
    }
  }
  return { ok: false, message: lastMessage };
}
