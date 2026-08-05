import type { Section } from '../types';
import type { PublishedBlogDetail } from './blogsApi';
import { INITIAL_TEMPLATE, SECTION_TEMPLATES } from '../constants';
import { toAbsoluteMediaUrl, extractMediaUrl } from '../config';

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sectionFromTemplate(type: string, id: string): Section {
  const t = (SECTION_TEMPLATES as any)[type] || { type, content: {}, styles: {} };
  return {
    ...cloneDeep(t),
    id,
    type: (t?.type as any) || type,
    elements: Array.isArray(t?.elements) ? cloneDeep(t.elements) : [],
  } as Section;
}

function pickChrome(sections: Section[] | undefined) {
  const list = Array.isArray(sections) ? sections : [];
  const header =
    list.find((s) => s.type === 'header' || s.type === 'navbar') ||
    cloneDeep(INITIAL_TEMPLATE.sections.find((s) => s.type === 'header')!);
  const footer =
    list.find((s) => s.type === 'footer') ||
    cloneDeep(INITIAL_TEMPLATE.sections.find((s) => s.type === 'footer')!);
  return {
    header: header ? { ...cloneDeep(header), id: 'live-blog-header' } : null,
    footer: footer ? { ...cloneDeep(footer), id: 'live-blog-footer' } : null,
  };
}

function absCover(cover: any, fallbackTitle = ''): { url: string; alt: string } {
  const url = toAbsoluteMediaUrl(extractMediaUrl(cover));
  const alt = String(
    (cover && typeof cover === 'object' ? cover.alt || cover.caption : '') || fallbackTitle || ''
  ).trim();
  return { url, alt };
}

/**
 * Build GenieBuild blog-detail sections from live getPublishedBlog payload.
 * Reuses chrome (header/footer) from an existing page load when available.
 */
export function assembleLiveBlogDetailSections(
  detail: PublishedBlogDetail,
  chromeSections?: Section[]
): Section[] {
  const { header, footer } = pickChrome(chromeSections);
  const sections: Section[] = [];
  if (header) sections.push(header);

  const heroCover = absCover(
    detail.hero?.coverImage || detail.coverImage || detail.hero?.imageUrl || detail.imageUrl,
    detail.title || ''
  );
  // Prefer API cover; never leave an empty {url:''} that blanks a usable imageUrl string
  if (!heroCover.url) {
    heroCover.url = toAbsoluteMediaUrl(
      extractMediaUrl(detail.hero?.imageUrl) || extractMediaUrl((detail as any).imageUrl)
    );
  }

  const hero = sectionFromTemplate('blogarticlehero', 'live-blog-hero');
  const templateCover = absCover((hero.content as any)?.coverImage);
  hero.content = {
    ...(hero.content as any),
    ...(detail.hero || {}),
    // Only overwrite template cover when we have a real URL from the blog
    coverImage: heroCover.url
      ? heroCover
      : { url: '', alt: heroCover.alt || detail.title || '' },
    imageUrl: heroCover.url || '',
  };
  // Drop template Unsplash so live empty-cover articles don't show a fake stock photo
  if (!heroCover.url && templateCover.url) {
    (hero.content as any).coverImage = { url: '', alt: String(detail.title || '') };
    (hero.content as any).imageUrl = '';
  }

  const body = sectionFromTemplate('blogcontent', 'live-blog-content');
  const contentPayload = { ...(body.content as any), ...(detail.content || {}) };
  // Prefer explicit HTML fields; avoid leaving nested objects that String() badly
  const rawHtml =
    (typeof contentPayload.content === 'string' && contentPayload.content) ||
    (typeof contentPayload.body === 'string' && contentPayload.body) ||
    '';
  body.content = {
    ...contentPayload,
    content: rawHtml,
    body: rawHtml,
  };

  const authorImage = toAbsoluteMediaUrl(
    extractMediaUrl(detail.author?.image) || extractMediaUrl(detail.author?.avatar)
  );
  const author = sectionFromTemplate('blogauthor', 'live-blog-author');
  author.content = {
    ...(author.content as any),
    ...(detail.author || {}),
    name: String(detail.author?.name || (detail.author as any)?.authorName || '').trim(),
    jobTitle: String(detail.author?.jobTitle || (detail.author as any)?.role || '').trim(),
    bio: String(detail.author?.bio || '').trim(),
    image: authorImage,
    avatar: authorImage,
    links: Array.isArray(detail.author?.links) ? detail.author!.links : [],
    authorId: String((detail.author as any)?.authorId || '').trim(),
    blogId: String(detail.blogId || '').trim(),
    contentRef: {
      source: 'blog_author',
      authorId: String((detail.author as any)?.authorId || '').trim(),
      blogId: String(detail.blogId || '').trim(),
    },
  };

  const relatedItems = (Array.isArray(detail.related?.items) ? detail.related!.items : []).map(
    (it: any) => {
      const img = toAbsoluteMediaUrl(
        extractMediaUrl(it?.img) ||
          extractMediaUrl(it?.image) ||
          extractMediaUrl(it?.imageUrl) ||
          extractMediaUrl(it?.coverImage)
      );
      return { ...it, img, image: img, imageUrl: img };
    }
  );
  const related = sectionFromTemplate('blogrelated', 'live-blog-related');
  related.content = {
    ...(related.content as any),
    ...(detail.related || {}),
    items: relatedItems,
    blogId: detail.blogId,
  };

  const faqItems = (
    Array.isArray((detail as any).faq?.items) ? (detail as any).faq.items : []
  ).map((it: any) => ({
    title: it.title || it.question || it.q || '',
    question: it.question || it.title || it.q || '',
    description: it.description || it.answer || it.a || it.content || '',
    answer: it.answer || it.description || it.a || it.content || '',
  }));
  const faq = sectionFromTemplate('faq', 'live-blog-faq');
  faq.content = {
    ...(faq.content as any),
    title: String((detail as any).faq?.title || 'Frequently Asked Questions'),
    subtitle: String((detail as any).faq?.subtitle || ''),
    items: faqItems.length
      ? faqItems
      : Array.isArray((faq.content as any)?.items)
        ? (faq.content as any).items
        : [],
  };
  faq.styles = {
    ...(faq.styles as any),
    variant: 'FaqFunky',
  };

  const comments = sectionFromTemplate('blogcomments', 'live-blog-comments');
  const commentsBlogId = String(
    (detail.comments as any)?.blogId || detail.blogId || (detail.comments as any)?.contentRef?.blogId || ''
  ).trim();
  comments.content = {
    ...(comments.content as any),
    ...(detail.comments || {}),
    blogId: commentsBlogId,
    comments: Array.isArray(detail.comments?.comments) ? detail.comments!.comments : [],
    contentRef: {
      source: 'blog_reviews',
      blogId: commentsBlogId,
      ...((detail.comments as any)?.contentRef || {}),
    },
  };

  sections.push(hero, body, author, related);
  if (faqItems.length || Array.isArray((faq.content as any)?.items)) {
    sections.push(faq);
  }
  sections.push(comments);
  if (footer) sections.push(footer);
  return sections;
}

export function extractBlogSlugFromPath(pathname: string): string | null {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const match = normalized.match(/(?:^|\/)blog\/([^/]+)$/i);
  return match ? decodeURIComponent(match[1]) : null;
}
