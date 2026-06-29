import React from 'react';
import { toAbsoluteMediaUrl } from '../../../../config';

export function mergeSectionContent(section: { content?: any; data?: any }): Record<string, any> {
  const dataLayer = (section as any)?.data && typeof (section as any).data === 'object' ? (section as any).data : {};
  return { ...(section.content || {}), ...dataLayer };
}

export function pickAboutServiceImage(c: Record<string, any>): string {
  const direct = String(c.imageUrl || '').trim();
  if (direct) return direct;
  const imgs = c.images;
  if (Array.isArray(imgs) && imgs[0]) {
    const u = typeof imgs[0] === 'string' ? imgs[0] : (imgs[0] as any)?.url;
    return String(u || '').trim();
  }
  return '';
}

export function resolveAboutImageUrl(raw: string): string {
  const u = (raw || '').trim();
  if (!u) return '';
  return toAbsoluteMediaUrl(u) || u;
}

export function pickAboutServiceTitle(c: Record<string, any>): string {
  return String(c.service_name || c.title || 'About this service').trim() || 'About this service';
}

export function pickAboutServiceBody(c: Record<string, any>): string {
  return String(c.about_service || c.description || c.subtitle || '').trim();
}

export function renderAboutBody(aboutRaw: string): React.ReactNode {
  if (!aboutRaw) {
    return (
      <p className="text-gray-500 italic text-base">
        No description yet. It will match the homepage services card for this service and location once content is
        generated or edited.
      </p>
    );
  }
  if (aboutRaw.includes('<')) {
    return (
      <div
        className="prose prose-lg max-w-none text-gray-700 [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: aboutRaw }}
      />
    );
  }
  const paras = aboutRaw
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-4 text-gray-700 leading-relaxed text-base">
      {paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
