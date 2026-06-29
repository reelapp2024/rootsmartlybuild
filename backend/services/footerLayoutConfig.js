/**
 * Structured footer layout (SiteHeaderFooter.settings.custom.footer).
 * Separates CTA, About, Quick Links, Services, and Contact from the header-style nav tree.
 */

const { normalizeSlugInput, toPublicPath } = require("./pageSlugService");

const FOOTER_LAYOUT_VERSION = 1;

const DEFAULT_COLUMNS = {
  about: { enabled: true, order: 0 },
  quickLinks: { enabled: true, order: 1 },
  services: { enabled: true, order: 2 },
  contact: { enabled: true, order: 3 },
};

const DEFAULT_FOOTER_LAYOUT = {
  version: FOOTER_LAYOUT_VERSION,
  showCtaBanner: true,
  cta: {
    title: "",
    subtitle: "",
    buttonText: "Book Now",
    buttonLink: "/contact",
  },
  columns: { ...DEFAULT_COLUMNS },
  about: {
    showTagline: true,
    tagline: "",
    showSocial: true,
  },
  quickLinks: {
    items: [],
  },
  services: {
    children: [],
  },
  contact: {
    showPhone: true,
    showEmail: true,
    showLocation: true,
    showHours: true,
    hoursText: "Open 24/7",
    hoursSub: "Always on call",
    phoneSub: "Available 24/7",
    emailSub: "We reply within an hour",
  },
};

function sortMenuByOrder(items = []) {
  return [...(Array.isArray(items) ? items : [])]
    .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))
    .map((item) => ({
      ...item,
      children: sortMenuByOrder(item.children || []),
    }));
}

function isServicesMenuItem(item = {}) {
  const url = normalizeSlugInput(String(item?.url || "").replace(/^\//, ""));
  const name = String(item?.name || item?.label || "").toLowerCase();
  return (
    item?.id === "services" ||
    name.includes("service") ||
    url === "services" ||
    url.endsWith("/services")
  );
}

function cloneMenuItems(items = []) {
  return sortMenuByOrder(items).map((item) => ({
    id: String(item?.id || `menu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    name: String(item?.name || item?.label || "").trim() || "Link",
    url: String(item?.url || item?.link || "#").trim(),
    pageId: item?.pageId || null,
    serviceId: item?.serviceId || undefined,
    linkPerArea: Boolean(item?.linkPerArea),
    icon: item?.icon || "",
    target: item?.target === "_blank" ? "_blank" : "_self",
    order: Number(item?.order ?? 0),
    children: cloneMenuItems(item?.children || []),
    style: item?.style && typeof item.style === "object" ? { ...item.style } : {},
  }));
}

function migrateFooterFromLegacyMenu(menu = []) {
  const sorted = sortMenuByOrder(menu);
  const servicesParent = sorted.find((item) => isServicesMenuItem(item));
  const quickItems = sorted
    .filter((item) => !isServicesMenuItem(item))
    .map((item) => ({ ...item, children: [] }));

  return {
    ...JSON.parse(JSON.stringify(DEFAULT_FOOTER_LAYOUT)),
    quickLinks: { items: cloneMenuItems(quickItems) },
    services: { children: cloneMenuItems(servicesParent?.children || []) },
  };
}

function getFooterLayoutFromDoc(doc = {}) {
  const custom = doc?.settings?.custom || {};
  const stored = custom?.footer;
  if (stored && typeof stored === "object" && Number(stored.version) >= 1) {
    return normalizeFooterLayout(stored);
  }
  if (Array.isArray(doc?.menu) && doc.menu.length) {
    return migrateFooterFromLegacyMenu(doc.menu);
  }
  return JSON.parse(JSON.stringify(DEFAULT_FOOTER_LAYOUT));
}

function normalizeFooterLayout(input = {}) {
  const src = input && typeof input === "object" ? input : {};
  const columns = { ...DEFAULT_COLUMNS };
  if (src.columns && typeof src.columns === "object") {
    Object.keys(columns).forEach((key) => {
      const col = src.columns[key];
      if (col && typeof col === "object") {
        columns[key] = {
          enabled: col.enabled !== false,
          order: Number(col.order ?? columns[key].order),
        };
      }
    });
  }

  const cta = {
    ...DEFAULT_FOOTER_LAYOUT.cta,
    ...(src.cta && typeof src.cta === "object" ? src.cta : {}),
  };

  const about = {
    ...DEFAULT_FOOTER_LAYOUT.about,
    ...(src.about && typeof src.about === "object" ? src.about : {}),
  };

  const contact = {
    ...DEFAULT_FOOTER_LAYOUT.contact,
    ...(src.contact && typeof src.contact === "object" ? src.contact : {}),
  };

  return {
    version: FOOTER_LAYOUT_VERSION,
    showCtaBanner: src.showCtaBanner !== false,
    cta: {
      title: String(cta.title || "").trim(),
      subtitle: String(cta.subtitle || "").trim(),
      buttonText: String(cta.buttonText || "Book Now").trim() || "Book Now",
      buttonLink: String(cta.buttonLink || "/contact").trim() || "/contact",
    },
    columns,
    about: {
      showTagline: about.showTagline !== false,
      tagline: String(about.tagline || about.taglineOverride || "").trim(),
      showSocial: about.showSocial !== false,
    },
    quickLinks: {
      items: cloneMenuItems(src.quickLinks?.items || []),
    },
    services: {
      children: cloneMenuItems(src.services?.children || []),
    },
    contact: {
      showPhone: contact.showPhone !== false,
      showEmail: contact.showEmail !== false,
      showLocation: contact.showLocation !== false,
      showHours: contact.showHours !== false,
      hoursText: String(contact.hoursText || "Open 24/7").trim() || "Open 24/7",
      hoursSub: String(contact.hoursSub || "Always on call").trim(),
      phoneSub: String(contact.phoneSub || "Available 24/7").trim(),
      emailSub: String(contact.emailSub || "We reply within an hour").trim(),
    },
  };
}

/** Rebuild legacy `menu` array for backward-compatible saves. */
function syncLegacyMenuFromFooterLayout(footerLayout = {}) {
  const layout = normalizeFooterLayout(footerLayout);
  const quick = layout.quickLinks.items || [];
  const serviceChildren = layout.services.children || [];
  const items = [...quick];
  if (serviceChildren.length) {
    items.push({
      id: "services",
      name: "Services",
      url: "/services",
      icon: "",
      target: "_self",
      order: items.length,
      children: serviceChildren,
      style: {},
    });
  }
  return sortMenuByOrder(items.map((item, idx) => ({ ...item, order: idx })));
}

function buildPagesByIdMap(pages = []) {
  const map = new Map();
  for (const page of pages) {
    const id = page?._id || page?.pageId;
    if (id) map.set(String(id), page);
  }
  return map;
}

function resolveMenuItemUrlFromPages(item = {}, pagesById = null) {
  if (pagesById && item?.pageId && !item?.linkPerArea && !item?.serviceId) {
    const page = pagesById.get(String(item.pageId));
    if (page) {
      const slug = normalizeSlugInput(page.slug || page.name || "");
      return slug ? toPublicPath(slug) : "/";
    }
  }
  return String(item?.url || item?.link || "#").trim();
}

function applyPageUrlsToMenuItems(items = [], pagesById = null) {
  if (!pagesById || !pagesById.size) return items;
  return (Array.isArray(items) ? items : []).map((item) => {
    const next = { ...item };
    if (next.pageId && !next.linkPerArea && !next.serviceId) {
      next.url = resolveMenuItemUrlFromPages(next, pagesById);
    }
    if (Array.isArray(next.children) && next.children.length) {
      next.children = applyPageUrlsToMenuItems(next.children, pagesById);
    }
    return next;
  });
}

function applyPageUrlsToFooterLayout(layout = {}, pagesById = null) {
  if (!layout || typeof layout !== "object" || !pagesById?.size) return layout;
  return {
    ...layout,
    quickLinks: {
      ...layout.quickLinks,
      items: applyPageUrlsToMenuItems(layout.quickLinks?.items || [], pagesById),
    },
    services: {
      ...layout.services,
      children: applyPageUrlsToMenuItems(layout.services?.children || [], pagesById),
    },
  };
}

function menuItemsToListItems(items = [], pagesById = null) {
  return sortMenuByOrder(items)
    .map((item) => ({
      title: String(item?.name || item?.label || "").trim(),
      link: resolveMenuItemUrlFromPages(item, pagesById),
      linkNewTab: item?.target === "_blank",
    }))
    .filter((row) => row.title);
}

function pickFooterMarketingFromProject(project = {}) {
  const ctaEntry = Array.isArray(project.cta) && project.cta.length ? project.cta[0] : null;
  const projectName = String(project.projectName || "").trim();
  const mainCategory = String(project.mainCategory || project.serviceType || "services").trim();

  // Footer description under logo: prefer AI (footerSection) / saved copy, not welcomeLine.
  const tagline = String(project.description || "").trim();

  const ctaTitle =
    String(ctaEntry?.title || "").trim() ||
    String(project.callToAction || "").trim() ||
    (projectName ? `Get in touch with ${projectName}` : `Need ${mainCategory} today?`);

  const ctaSubtitle =
    String(ctaEntry?.description || "").trim() ||
    String(project.promiseLine || "").trim() ||
    (projectName
      ? `Quality ${mainCategory} you can trust. Call or book online.`
      : "Same-day appointments available. Call us or book online.");

  return {
    tagline,
    ctaTitle,
    ctaSubtitle,
    ctaButtonText: String(ctaEntry?.buttonText || "").trim() || "Book Now",
    ctaButtonLink: String(ctaEntry?.link || "").trim() || "/contact",
  };
}

/** Fill editor fields with values shown on the live site (stored layout + project fallbacks). */
function resolveFooterLayoutForEditor(layout = {}, marketing = {}) {
  const normalized = normalizeFooterLayout(layout);
  const m = marketing && typeof marketing === "object" ? marketing : {};

  return normalizeFooterLayout({
    ...normalized,
    cta: {
      ...normalized.cta,
      title: String(normalized.cta.title || m.ctaTitle || "").trim(),
      subtitle: String(normalized.cta.subtitle || m.ctaSubtitle || "").trim(),
      buttonText:
        String(normalized.cta.buttonText || m.ctaButtonText || "Book Now").trim() || "Book Now",
      buttonLink:
        String(normalized.cta.buttonLink || m.ctaButtonLink || "/contact").trim() || "/contact",
    },
    about: {
      ...normalized.about,
      tagline: String(normalized.about.tagline || m.tagline || "").trim(),
    },
  });
}

function mergeFooterLayoutIntoSettings(settings = {}, footerLayout) {
  const next = settings && typeof settings === "object" ? { ...settings } : {};
  const custom =
    next.custom && typeof next.custom === "object" ? { ...next.custom } : {};
  custom.footer = normalizeFooterLayout(footerLayout);
  next.custom = custom;
  return next;
}

function catalogRowsToFooterServiceMenuItems(catalogServices = []) {
  return (Array.isArray(catalogServices) ? catalogServices : [])
    .filter((row) => row?.serviceId)
    .map((row, idx) => ({
      id: `svc-${String(row.serviceId)}`,
      name: String(row.label || "Service").trim() || "Service",
      url: "#",
      pageId: null,
      serviceId: String(row.serviceId),
      linkPerArea: true,
      icon: "",
      target: "_self",
      order: idx,
      children: [],
      style: {},
    }));
}

function buildFooterLayoutFromDefaultMenu(defaultMenu = [], catalogServices = []) {
  const layout = migrateFooterFromLegacyMenu(defaultMenu);
  const catalogChildren = catalogRowsToFooterServiceMenuItems(catalogServices);
  if (catalogChildren.length) {
    layout.services = { children: catalogChildren };
  }
  return normalizeFooterLayout(layout);
}

/** Full default footer layout when no pages/menu exist yet. */
function buildEmptyDefaultFooterLayout() {
  return normalizeFooterLayout({
    ...DEFAULT_FOOTER_LAYOUT,
    quickLinks: {
      items: [
        {
          id: "home",
          name: "Home",
          url: "/",
          target: "_self",
          order: 0,
          children: [],
          style: {},
        },
        {
          id: "about",
          name: "About Us",
          url: "/about",
          target: "_self",
          order: 1,
          children: [],
          style: {},
        },
        {
          id: "areas",
          name: "Areas",
          url: "/areas",
          target: "_self",
          order: 2,
          children: [],
          style: {},
        },
        {
          id: "contact",
          name: "Contact",
          url: "/contact",
          target: "_self",
          order: 3,
          children: [],
          style: {},
        },
      ],
    },
  });
}

module.exports = {
  DEFAULT_FOOTER_LAYOUT,
  FOOTER_LAYOUT_VERSION,
  getFooterLayoutFromDoc,
  normalizeFooterLayout,
  migrateFooterFromLegacyMenu,
  syncLegacyMenuFromFooterLayout,
  menuItemsToListItems,
  buildPagesByIdMap,
  resolveMenuItemUrlFromPages,
  applyPageUrlsToMenuItems,
  applyPageUrlsToFooterLayout,
  mergeFooterLayoutIntoSettings,
  buildFooterLayoutFromDefaultMenu,
  buildEmptyDefaultFooterLayout,
  catalogRowsToFooterServiceMenuItems,
  pickFooterMarketingFromProject,
  resolveFooterLayoutForEditor,
  sortMenuByOrder,
  isServicesMenuItem,
};
