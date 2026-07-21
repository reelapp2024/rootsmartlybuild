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

    description: "Company story and values",

    defaultSelected: false,

    defaultPerLocationContent: false,

    sections: [

      { id: "abouthero", name: "About Hero", description: "About page hero banner", defaultSelected: true },

      { id: "missionvision", name: "Mission & Vision", description: "Mission and vision statements", defaultSelected: true },

      { id: "corevalues", name: "Core Values", description: "Company values cards", defaultSelected: true },

      { id: "usp", name: "USP / Difference", description: "What makes you different", defaultSelected: true },

      { id: "aboutwhychoose", name: "Why Choose Us", description: "Trust reasons on About page", defaultSelected: true },

      { id: "aboutcta", name: "About CTA", description: "Call to action on About page", defaultSelected: true },

      { id: "aboutfaq", name: "About FAQ", description: "FAQs about your company", defaultSelected: true },

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

      { id: "serviceslisthero", name: "Services Hero", description: "Hero for the all-services page", defaultSelected: true },

      { id: "serviceslistgrid", name: "Services Grid", description: "All services cards from your catalog", defaultSelected: true },

      { id: "serviceslistwhychoose", name: "Why Choose Us", description: "Trust strip on services listing", defaultSelected: false },

      { id: "serviceslistprocess", name: "Process", description: "How booking / workflow works", defaultSelected: false },

      { id: "serviceslistguarantee", name: "Guarantee", description: "Service guarantees", defaultSelected: false },

      { id: "serviceslistareas", name: "Areas", description: "Areas you serve", defaultSelected: false },

      { id: "serviceslistcta", name: "CTA", description: "Call-to-action band with live phone", defaultSelected: false },

      { id: "serviceslistfaq", name: "FAQ", description: "FAQs about your services", defaultSelected: false },

    ],

  },

  {

    id: "contact",

    name: "Contact",

    description: "Contact and reach-us page",

    defaultSelected: false,

    defaultPerLocationContent: false,

    sections: [

      { id: "contacthero", name: "Contact Hero", description: "Contact page hero banner", defaultSelected: true },

      { id: "contactinfo", name: "Contact Info", description: "Phone, email, address cards from About Us", defaultSelected: true },

      { id: "contactform", name: "Contact Form", description: "Dynamic form from Admin Forms Management", defaultSelected: true },

      { id: "contactcta", name: "Contact CTA", description: "Call-now band with live phone", defaultSelected: false },

      { id: "contactfaq", name: "Contact FAQ", description: "FAQs about reaching you", defaultSelected: false },

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

      { id: "servicedetailhero", name: "Service Hero", description: "Service page hero banner", defaultSelected: true },

      { id: "servicedetailabout", name: "About Service", description: "Detailed service description (required)", defaultSelected: true },

      { id: "servicedetailservices", name: "What's Included", description: "Sub-services / inclusions grid", defaultSelected: false },

      { id: "servicedetailprocess", name: "Process", description: "Step-by-step for this service", defaultSelected: false },

      { id: "servicedetailcta", name: "Service CTA", description: "Call-to-action for booking this service", defaultSelected: false },

      { id: "servicedetailwhychoose", name: "Why Choose Us", description: "Trust reasons for this service", defaultSelected: false },

      { id: "servicedetailguarantee", name: "Guarantee", description: "Service-specific guarantees", defaultSelected: false },

      { id: "relatedservices", name: "Related Services", description: "Related services from your catalog", defaultSelected: false },

      { id: "servicedetailtestimonials", name: "Testimonials", description: "Reviews for this service", defaultSelected: false },

      { id: "servicedetailfaq", name: "FAQ", description: "Service-specific FAQs", defaultSelected: true },

    ], (s) => s.id),

  },

  {

    id: "blog",

    name: "Blog",

    description: "Blog index — posts come from Blog Management; AI only fills page chrome",

    pageRoleLabel: "Blog listing",

    defaultSelected: false,

    defaultPerLocationContent: false,

    sections: [

      { id: "blogshero", name: "Blog Hero", description: "Blog index hero copy", defaultSelected: true },

      { id: "blogssearch", name: "Blog Search", description: "Search/filter chrome", defaultSelected: true },

      { id: "blogslist", name: "Blog List", description: "Cards from published Blog posts (DB)", defaultSelected: true },

    ],

  },

  {

    id: "blogdetail",

    name: "Blog Article",

    description: "Template for each article — body/author come from Blog + Author collections",

    pageRoleLabel: "Each blog post",

    templateOnly: true,

    defaultSelected: false,

    defaultPerLocationContent: false,

    sections: [

      { id: "blogarticlehero", name: "Article Hero", description: "Title, author, date, cover (from Blog)", defaultSelected: true },

      { id: "blogcontent", name: "Article Body", description: "HTML content from Blog", defaultSelected: true },

      { id: "blogauthor", name: "Author Bio", description: "Author card from Author collection", defaultSelected: true },

      { id: "blogrelated", name: "Related Articles", description: "Related posts from Blog + header AI", defaultSelected: false },

      { id: "blogcomments", name: "Comments", description: "Comments section framing copy", defaultSelected: false },

    ],

  },

  {

    id: "legal",

    name: "Legal",

    description: "Privacy / Terms / Disclaimer layout (document type follows each legal page)",

    pageRoleLabel: "Legal pages",

    defaultSelected: false,

    defaultPerLocationContent: false,

    sections: [

      { id: "legalhero", name: "Legal Hero", description: "Title, subtitle, last updated", defaultSelected: true },

      { id: "legalcontent", name: "Legal Content", description: "Document sections (AI; type from page)", defaultSelected: true },

    ],

  },

  {
    id: "areas",
    name: "All Areas",
    description: "Listing page of every area you serve — cards link to each area detail page",
    pageRoleLabel: "Areas directory (/areas)",
    defaultSelected: false,
    defaultPerLocationContent: false,
    sections: [
      {
        id: "areashero",
        name: "Hero",
        description: "All Areas page intro banner",
        defaultSelected: true,
      },
      {
        id: "sublocations",
        name: "Areas Grid",
        description: "All areas / cities cards (from locations)",
        defaultSelected: true,
      },
      {
        id: "locationmap",
        name: "Areas Map",
        description: "Optional map of coverage",
        defaultSelected: false,
      },
      {
        id: "areastestimonials",
        name: "Reviews",
        description: "Multi-area customer reviews",
        defaultSelected: true,
      },
      {
        id: "areasfaq",
        name: "FAQ",
        description: "Coverage and booking questions",
        defaultSelected: true,
      },
    ],
  },

  {
    id: "location",
    name: "Area Detail",
    description:
      "Each area/city landing uses the same sections as Home — only the content changes per location",
    pageRoleLabel: "Each location page (same as Home)",
    /** Template toggle only — real public pages are location-{id}; do not publish /location. */
    templateOnly: true,
    defaultSelected: false,
    /** Area detail landings inherit Home layout; content is location-scoped. */
    defaultPerLocationContent: true,
    /** Same catalog as Home — homepage sections only. */
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
      { id: "areas", name: "Areas", description: "Nearby areas teaser on this location page", defaultSelected: false },
      { id: "faq", name: "FAQ", description: "Frequently asked questions", defaultSelected: false },
    ]),
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

export type WebsiteWizardVariant = "business" | "bulk";

export function wizardStoragePrefix(variant: WebsiteWizardVariant) {
  return variant === "bulk" ? "bulkWebsiteCreate" : "businessWebsiteCreate";
}

/** Clear persisted wizard step/project for business or bulk create flows. */
export function clearWebsiteWizardStorage(variant: WebsiteWizardVariant) {
  const prefix = wizardStoragePrefix(variant);
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(`${prefix}_`)) {
      localStorage.removeItem(key);
    }
  });
}

export function clearWebsiteWizardStorageForRoute(route: string) {
  if (route.includes("/business-website/create")) {
    clearWebsiteWizardStorage("business");
  } else if (route.includes("/bulk-pages-websites/create")) {
    clearWebsiteWizardStorage("bulk");
  }
}

export function buildInitialPageSections(
  pages: PageOption[] = DEFAULT_PAGES
): Record<string, SectionOption[]> {
  const sections: Record<string, SectionOption[]> = {};
  pages.forEach((page) => {
    sections[page.id] = page.sections.filter((s) => s.defaultSelected);
  });
  return sections;
}


