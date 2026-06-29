import { API_BASE_URL } from '../config';
import type { AboutUsContact } from './contactResolver';

function readProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('projectId');
}

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('token');
}

let cache: { projectId: string; data: AboutUsContact } | null = null;

export async function fetchProjectAboutUs(projectId: string): Promise<AboutUsContact | null> {
  if (cache?.projectId === projectId) return cache.data;
  const token = readToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/getAboutUs/${projectId}`, { method: 'GET', headers });
  if (!res.ok) return null;
  const body = await res.json().catch(() => ({}));
  const data = (body?.data || body?.aboutUs || body) as AboutUsContact;
  cache = { projectId, data };
  return data;
}

export function clearProjectAboutUsCache() {
  cache = null;
}

export function getProjectIdFromUrl(): string | null {
  return readProjectId();
}
