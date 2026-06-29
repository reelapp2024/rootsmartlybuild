import {
  reorderHomeSectionsInConfig,
  sortSectionObjectsByCanonicalOrder,
} from "@shared/siteSectionOrder";

export interface SectionOption {
  id: string;
  name: string;
  description: string;
  defaultSelected: boolean;
}

export interface PageOption {
  id: string;
  name: string;
  description: string;
  defaultSelected: boolean;
  /** When true, page is only a section template (e.g. single service); not upserted as WebsitePage. */
  templateOnly?: boolean;
  /** When true, AI content is generated per service area/location; otherwise main (parent) location only. */
  defaultPerLocationContent?: boolean;
  /** Short role label in Step 6 (helps users understand what this page is). */
  pageRoleLabel?: string;
  sections: SectionOption[];
}

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

export interface CustomColorScheme {
  heading: string;
  description: string;
  surface: string;
  primaryButton: { bg: string; text: string; hover: string };
  secondaryButton: { bg: string; text: string; border: string; hover: string };
  accent: string;
}

export const DEFAULT_PAGES: PageOption[] = [
  {
    id: "home",
    name: "Home",
    description: "Main landing page",
    defaultSelected: true,
    defaultPerLocationContent: true,
    sections: reorderHomeSectionsInConfig([
      { id: "hero", name: "Hero", description: "Main banner section", defaultSelected: true },
      { id: "about", name: "About", description: "Business introduction section", defaultSelected: false },
      { id: "features", name: "Features", description: "Key features and benefits", defaultSelected: false },
      { id: "servicesgrid", name: "Services Grid", description: "Services listing section on home", defaultSelected: false },
      { id: "cta", name: "CTA", description: "Call to action section", defaultSelected: false },
      { id: "whychooseus", name: "Why Choose Us", description: "Trust and differentiation section", defaultSelected: false },
      { id: "process", name: "Process", description: "How your service process works", defaultSelected: false },
      { id: "guarantee", name: "Guarantee", description: "Service guarantees and promises", defaultSelected: false },
      { id: "testimonials", name: "Testimonials", description: "Customer reviews and proof", defaultSelected: false },
      { id: "areas", name: "Areas", description: "Service areas/locations section", defaultSelected: false },
      { id: "faq", name: "FAQ", description: "Frequently asked questions", defaultSelected: false },
    ]),
  },
  {
    id: "about",
    name: "About Us",
    description: "Company information",
    defaultSelected: false,
    defaultPerLocationContent: false,
    sections: [
      { id: "hero", name: "Hero", description: "Page header", defaultSelected: false },
      { id: "features", name: "Features", description: "Key features showcase", defaultSelected: false },
      { id: "testimonials", name: "Testimonials", description: "Customer reviews", defaultSelected: false },
      { id: "cta", name: "CTA", description: "Contact CTA", defaultSelected: false },
      { id: "faq", name: "FAQ", description: "Frequently asked questions", defaultSelected: false },
    ],
  },
  {
    id: "services",
    name: "Services",
    description: "One shared page that lists all your services",
    pageRoleLabel: "All services listing",
    defaultSelected: false,
    defaultPerLocationContent: false,
    sections: [
      { id: "serviceshero", name: "Services Hero", description: "Hero for the all-services page", defaultSelected: false },
      { id: "descriptions", name: "Descriptions", description: "SEO description paragraphs", defaultSelected: false },
      { id: "relatedservices", name: "Related Services", description: "Related services header block", defaultSelected: false },
      { id: "subservices", name: "Sub Services", description: "Sub-service keyword labels", defaultSelected: false },
      { id: "cta", name: "CTA", description: "Call to action on services listing", defaultSelected: false },
      { id: "faq", name: "FAQ", description: "Frequently asked questions about your services", defaultSelected: false },
    ],
  },
  {
    id: "contact",
    name: "Contact",
    description: "Contact and reach-us page",
    defaultSelected: false,
    defaultPerLocationContent: false,
    sections: [
      { id: "contactpage", name: "Contact Page", description: "Contact page hero and intro", defaultSelected: false },
      { id: "faq", name: "FAQ", description: "Frequently asked questions about contacting you", defaultSelected: false },
    ],
  },
  {
    id: "service",
    name: "Service",
    description: "Layout used for every individual service (e.g. Haircut, Facial) in each area",
    pageRoleLabel: "Each service page",
    templateOnly: true,
    defaultSelected: true,
    defaultPerLocationContent: true,
    sections: sortSectionObjectsByCanonicalOrder("service", [
      { id: "servicehero", name: "Service Hero", description: "Service page hero banner", defaultSelected: false },
      { id: "aboutservice", name: "About Service", description: "Detailed service description", defaultSelected: false },
      { id: "servicecopy", name: "Service Copy", description: "Coverage text and feature highlights", defaultSelected: false },
      { id: "servicegroups", name: "Service Groups", description: "Grouped service offerings with icons", defaultSelected: false },
      { id: "servicedetailcta", name: "Service Detail CTA", description: "Call to action blocks for service page", defaultSelected: false },
      { id: "servicewhychooseus", name: "Service Why Choose Us", description: "Trust and differentiation on service page", defaultSelected: false },
      { id: "serviceprocess", name: "Service Process", description: "Step-by-step service process", defaultSelected: false },
      { id: "serviceguarantee", name: "Service Guarantee", description: "Service guarantees and promises", defaultSelected: false },
      { id: "promiseline", name: "Promise Line", description: "Short promise tagline", defaultSelected: false },
      { id: "relatedservices", name: "Related Services", description: "Related services section header", defaultSelected: false },
      { id: "subservices", name: "Sub Services", description: "Sub-service keyword labels", defaultSelected: false },
      { id: "testimonials", name: "Testimonials", description: "Customer reviews and proof", defaultSelected: false },
      { id: "faq", name: "FAQ", description: "Service-specific frequently asked questions", defaultSelected: false },
    ], (s) => s.id),
  },
];

/** Initial per-page location toggle map from DEFAULT_PAGES. */
export function buildDefaultPerLocationByPage(
  pages: PageOption[] = DEFAULT_PAGES
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const page of pages) {
    out[page.id] = Boolean(page.defaultPerLocationContent);
  }
  return out;
}

export const PRESET_THEMES = [
  { id: "crimson-jet", name: "Crimson Jet", primary: "#E11D48", surface: "#0E1214", heading: "#F8FAFC", description: "Bold and modern" },
  { id: "indigo-sand", name: "Indigo Sand", primary: "#4F46E5", surface: "#0F1222", heading: "#F8FAFC", description: "Professional and trustworthy" },
  { id: "saffron-charcoal", name: "Saffron Charcoal", primary: "#FDB022", surface: "#121212", heading: "#FFFFFF", description: "Vivid and energetic" },
  { id: "mint-slate", name: "Mint Slate", primary: "#22C55E", surface: "#0B1412", heading: "#FFFFFF", description: "Fresh and punchy" },
  { id: "marine-teal", name: "Marine Teal", primary: "#0EA5A4", surface: "#0B1720", heading: "#FFFFFF", description: "Crisp and modern" },
  { id: "royal-plum", name: "Royal Plum", primary: "#A855F7", surface: "#120C18", heading: "#FFFFFF", description: "Elegant and creative" },
  { id: "electric-cobalt", name: "Electric Cobalt", primary: "#2563EB", surface: "#0A1220", heading: "#F8FAFC", description: "Bold and dynamic" },
  { id: "copper-forest", name: "Copper Forest", primary: "#D97706", surface: "#0D1512", heading: "#FFFFFF", description: "Warm and natural" },
  { id: "ruby-night", name: "Ruby Night", primary: "#DC2626", surface: "#140A0D", heading: "#FFFFFF", description: "Bold and dramatic" },
  { id: "citrus-navy", name: "Citrus Navy", primary: "#F59E0B", surface: "#0A1224", heading: "#FFFFFF", description: "Vibrant and energetic" },
  { id: "midnight-amber", name: "Midnight Amber", primary: "#F59E0B", surface: "#060504", heading: "#FFFBF0", description: "Warm amber on deep night" },
] as const;
