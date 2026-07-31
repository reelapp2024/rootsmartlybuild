/**
 * Content website wizard — pages & sections (blog/Pinterest style).
 * Similar UX to business/bulk Step 6, but content-site oriented.
 */

export type ContentSectionOption = {
  id: string;
  name: string;
  description: string;
  defaultSelected: boolean;
};

export type ContentPageOption = {
  id: string;
  name: string;
  description: string;
  defaultSelected: boolean;
  /** Template-only pages are blueprints for post/category layouts, not always static routes */
  templateOnly?: boolean;
  sections: ContentSectionOption[];
};

export const DEFAULT_CONTENT_PAGES: ContentPageOption[] = [
  {
    id: "home",
    name: "Home",
    description: "Main landing page for the niche site",
    defaultSelected: true,
    sections: [
      { id: "hero", name: "Hero", description: "Brand headline + CTA", defaultSelected: true },
      { id: "featured_posts", name: "Featured Posts", description: "Top articles / pins", defaultSelected: true },
      { id: "categories_grid", name: "Categories Grid", description: "Content category cards", defaultSelected: true },
      { id: "about_teaser", name: "About Teaser", description: "Short brand story", defaultSelected: true },
      { id: "authors", name: "Authors", description: "E-E-A-T author strip", defaultSelected: true },
      { id: "newsletter", name: "Newsletter", description: "Email capture", defaultSelected: true },
      { id: "faq", name: "FAQ", description: "Common niche questions", defaultSelected: false },
    ],
  },
  {
    id: "blog",
    name: "Blog / Articles",
    description: "Article listing & archive",
    defaultSelected: true,
    sections: [
      { id: "blog_hero", name: "Blog Hero", description: "Listing hero", defaultSelected: true },
      { id: "post_grid", name: "Post Grid", description: "Article cards", defaultSelected: true },
      { id: "category_filter", name: "Category Filter", description: "Filter by category", defaultSelected: true },
      { id: "newsletter", name: "Newsletter", description: "Email capture on blog", defaultSelected: false },
    ],
  },
  {
    id: "category",
    name: "Category Template",
    description: "Layout for each content category",
    defaultSelected: true,
    templateOnly: true,
    sections: [
      { id: "category_hero", name: "Category Hero", description: "Category title + intro", defaultSelected: true },
      { id: "post_grid", name: "Post Grid", description: "Posts in this category", defaultSelected: true },
      { id: "related_categories", name: "Related Categories", description: "Cross-links", defaultSelected: false },
    ],
  },
  {
    id: "article",
    name: "Article Template",
    description: "Single article / pin landing layout",
    defaultSelected: true,
    templateOnly: true,
    sections: [
      { id: "article_hero", name: "Article Hero", description: "Title, byline, featured image", defaultSelected: true },
      { id: "article_body", name: "Article Body", description: "Main content + TOC", defaultSelected: true },
      { id: "author_box", name: "Author Box", description: "E-E-A-T author bio", defaultSelected: true },
      { id: "related_posts", name: "Related Posts", description: "Internal links", defaultSelected: true },
      { id: "pin_cta", name: "Pin / Save CTA", description: "Pinterest save prompt", defaultSelected: true },
      { id: "faq", name: "FAQ Schema", description: "Article FAQs", defaultSelected: false },
    ],
  },
  {
    id: "about",
    name: "About",
    description: "Brand story + E-E-A-T",
    defaultSelected: true,
    sections: [
      { id: "about_hero", name: "About Hero", description: "About banner", defaultSelected: true },
      { id: "brand_story", name: "Brand Story", description: "Mission / voice", defaultSelected: true },
      { id: "authors", name: "Team / Authors", description: "Author profiles", defaultSelected: true },
      { id: "about_cta", name: "CTA", description: "Contact / subscribe", defaultSelected: false },
    ],
  },
  {
    id: "contact",
    name: "Contact",
    description: "Contact form & details",
    defaultSelected: true,
    sections: [
      { id: "contact_hero", name: "Contact Hero", description: "Contact banner", defaultSelected: true },
      { id: "contact_form", name: "Contact Form", description: "Message form", defaultSelected: true },
      { id: "contact_info", name: "Contact Info", description: "Email / social", defaultSelected: true },
    ],
  },
  {
    id: "privacy",
    name: "Privacy Policy",
    description: "Legal privacy page",
    defaultSelected: true,
    sections: [
      { id: "legal_body", name: "Policy Body", description: "Privacy content", defaultSelected: true },
    ],
  },
  {
    id: "terms",
    name: "Terms of Use",
    description: "Legal terms page",
    defaultSelected: true,
    sections: [
      { id: "legal_body", name: "Terms Body", description: "Terms content", defaultSelected: true },
    ],
  },
  {
    id: "disclaimer",
    name: "Disclaimer",
    description: "Affiliate / editorial disclaimer",
    defaultSelected: true,
    sections: [
      { id: "legal_body", name: "Disclaimer Body", description: "Disclaimer content", defaultSelected: true },
    ],
  },
];

export function buildDefaultSelectedPages(pages: ContentPageOption[] = DEFAULT_CONTENT_PAGES) {
  return pages.filter((p) => p.defaultSelected);
}

export function buildDefaultPageSections(pages: ContentPageOption[] = DEFAULT_CONTENT_PAGES) {
  const map: Record<string, ContentSectionOption[]> = {};
  pages.forEach((page) => {
    if (!page.defaultSelected) return;
    map[page.id] = page.sections.filter((s) => s.defaultSelected);
  });
  return map;
}
