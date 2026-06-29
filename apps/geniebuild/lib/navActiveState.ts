/** Normalize URL path for nav matching (no query/hash, no leading/trailing slashes). */
export function normalizeNavPath(path: string): string {
  const raw = String(path || '/').split('?')[0].split('#')[0];
  const trimmed = raw.replace(/^\/+|\/+$/g, '').toLowerCase();
  return trimmed === 'home' ? '' : trimmed;
}

/** Normalize a nav item href — hash-only links (e.g. /#contact) must not match homepage "/". */
export function normalizeNavItemLink(link: string): string {
  const raw = String(link || '').trim();
  if (!raw || raw === '#') return '';
  if (raw.includes('#')) {
    const pathPart = raw.split('#')[0].replace(/^\/+|\/+$/g, '').toLowerCase();
    const hashPart = (raw.split('#').pop() || '').replace(/^\/+|\/+$/g, '').toLowerCase();
    if (pathPart && pathPart !== 'home') return pathPart;
    return hashPart === 'home' ? '' : hashPart;
  }
  return normalizeNavPath(raw);
}

export type NavActiveHint = 'home' | 'services' | 'areas' | 'about' | 'contact';

function collectRelatedLinks(item: Record<string, unknown>, navSources: Record<string, unknown>): string[] {
  const links: string[] = [];
  const push = (v: unknown) => {
    const n = normalizeNavPath(String(v || ''));
    if (n) links.push(n);
  };
  push(normalizeNavItemLink(String(item.link || '')));
  if (item.viewAllLink) push(item.viewAllLink);
  const dropdown = Array.isArray(item.dropdown) ? item.dropdown : [];
  dropdown.forEach((sub: Record<string, unknown>) => push(sub.link));

  const source = String(item.selectSource || '').toLowerCase();
  const rows =
    source === 'services'
      ? (navSources.services as unknown[])
      : source === 'locations'
        ? (navSources.locations as unknown[])
        : null;
  if (Array.isArray(rows)) {
    rows.forEach((row: Record<string, unknown>) => push(row.link || row.url));
  }
  return links;
}

export function getNavActiveHint(pathname: string, pageType?: string): NavActiveHint | null {
  const cur = normalizeNavPath(pathname);
  const pt = String(pageType || '').toLowerCase().trim();

  if (pt === 'service') return 'services';
  if (!cur) return 'home';
  if (cur === 'services' || cur.startsWith('services/')) return 'services';
  if (cur === 'areas' || cur.startsWith('areas/')) return 'areas';
  if (cur === 'about' || cur.startsWith('about/') || cur === 'about-us') return 'about';
  if (cur === 'contact' || cur.startsWith('contact/') || cur === 'contact-us') return 'contact';
  return null;
}

function itemMatchesHint(item: Record<string, unknown>, hint: NavActiveHint): boolean {
  const label = String(item.label || '').toLowerCase();
  const link = normalizeNavItemLink(String(item.link || ''));
  const selectSource = String(item.selectSource || '').toLowerCase();

  switch (hint) {
    case 'home':
      return label.includes('home') || link === '';
    case 'services':
      return selectSource === 'services' || label.includes('service');
    case 'areas':
      return selectSource === 'locations' || label.includes('area');
    case 'about':
      return label.includes('about');
    case 'contact':
      return label.includes('contact');
    default:
      return false;
  }
}

/** Whether a top-level nav item should show the active indicator on the live site. */
export function isNavItemActive(
  item: Record<string, unknown>,
  pathname: string,
  navSources: Record<string, unknown> = {},
  pageType?: string
): boolean {
  const hint = getNavActiveHint(pathname, pageType);
  if (hint !== null) {
    return itemMatchesHint(item, hint);
  }

  const cur = normalizeNavPath(pathname);
  const label = String(item.label || '').toLowerCase();
  const link = normalizeNavItemLink(String(item.link || ''));
  const selectSource = String(item.selectSource || '').toLowerCase();
  const related = collectRelatedLinks(item, navSources);

  if (label.includes('home') && (link === '' || link === 'home')) {
    return cur === '';
  }

  if (selectSource === 'services' || label.includes('service')) {
    if (cur === 'services' || cur.startsWith('services/')) return true;
    return related.some((l) => l && (cur === l || (l && cur.startsWith(`${l}/`))));
  }

  if (selectSource === 'locations' || label.includes('area')) {
    if (cur === 'areas' || cur.startsWith('areas/')) return true;
    return related.some((l) => l && (cur === l || (l && cur.startsWith(`${l}/`))));
  }

  if (link && (cur === link || cur.startsWith(`${link}/`))) return true;
  return related.some((l) => l && cur === l);
}
