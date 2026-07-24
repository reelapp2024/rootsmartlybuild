/**
 * Deterministic JSON-LD builders for seo_mode=2 (premium).
 * Prefer built schemas over LLM JSON-LD (valid, stable, cheap).
 */
const crypto = require("crypto");

function newSchemaId() {
  return crypto.randomUUID ? crypto.randomUUID() : `seo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function clean(str) {
  return String(str || "").replace(/\s+/g, " ").trim();
}

function makeSchemaEntry({ type, name, json, source = "system" }) {
  return {
    id: newSchemaId(),
    type: String(type || "Thing"),
    name: String(name || type || "Schema"),
    enabled: true,
    source,
    json: json && typeof json === "object" ? json : {},
    updatedAt: new Date(),
  };
}

function buildOrganizationSchema({ projectName, serviceType, url, telephone, email, address }) {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: clean(projectName) || "Business",
    url: clean(url) || undefined,
  };
  if (serviceType) org.description = clean(serviceType);
  if (telephone) org.telephone = clean(telephone);
  if (email) org.email = clean(email);
  if (address && typeof address === "object") org.address = address;
  return makeSchemaEntry({
    type: "Organization",
    name: "Organization",
    json: org,
  });
}

function buildLocalBusinessSchema({
  projectName,
  serviceType,
  url,
  telephone,
  email,
  address,
  areaServed,
}) {
  const biz = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: clean(projectName) || "Local Business",
    url: clean(url) || undefined,
    description: clean(serviceType) || undefined,
  };
  if (telephone) biz.telephone = clean(telephone);
  if (email) biz.email = clean(email);
  if (address && typeof address === "object") biz.address = address;
  if (areaServed) {
    biz.areaServed = Array.isArray(areaServed)
      ? areaServed.map((a) => ({ "@type": "Place", name: clean(a) })).filter((p) => p.name)
      : { "@type": "Place", name: clean(areaServed) };
  }
  return makeSchemaEntry({
    type: "LocalBusiness",
    name: "Local Business",
    json: biz,
  });
}

function buildWebPageSchema({ name, description, url, pageType }) {
  return makeSchemaEntry({
    type: "WebPage",
    name: "Web Page",
    json: {
      "@context": "https://schema.org",
      "@type": pageType === "contact" ? "ContactPage" : "WebPage",
      name: clean(name) || "Page",
      description: clean(description) || undefined,
      url: clean(url) || undefined,
    },
  });
}

function buildBreadcrumbSchema({ pageUrl, pageName, projectName }) {
  const path = clean(pageUrl) || "/";
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: clean(projectName) || "Home",
      item: "/",
    },
  ];
  if (path && path !== "/") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: clean(pageName) || path.replace(/^\//, ""),
      item: path,
    });
  }
  return makeSchemaEntry({
    type: "BreadcrumbList",
    name: "Breadcrumbs",
    json: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items,
    },
  });
}

function buildServiceSchema({ serviceName, description, providerName, url, areaServed }) {
  if (!clean(serviceName)) return null;
  const svc = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: clean(serviceName),
    description: clean(description) || undefined,
    url: clean(url) || undefined,
    provider: {
      "@type": "LocalBusiness",
      name: clean(providerName) || clean(serviceName),
    },
  };
  if (areaServed) {
    svc.areaServed = { "@type": "Place", name: clean(areaServed) };
  }
  return makeSchemaEntry({
    type: "Service",
    name: "Service",
    json: svc,
  });
}

function buildFaqPageSchema(faqItems = []) {
  const entities = (Array.isArray(faqItems) ? faqItems : [])
    .map((it) => {
      const q = clean(it?.question || it?.q || it?.title);
      const a = clean(it?.answer || it?.a || it?.description);
      if (!q || !a) return null;
      return {
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: a,
        },
      };
    })
    .filter(Boolean);

  if (!entities.length) return null;

  return makeSchemaEntry({
    type: "FAQPage",
    name: "FAQ",
    json: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: entities,
    },
  });
}

function buildAggregateRatingSchema({ projectName, ratingValue, reviewCount, reviews = [] }) {
  const value = Number(ratingValue);
  const count = Number(reviewCount);
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(count) || count <= 0) {
    return null;
  }

  const json = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: clean(projectName) || "Business",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Math.min(5, Math.max(1, value)),
      reviewCount: Math.floor(count),
      bestRating: 5,
      worstRating: 1,
    },
  };

  const reviewEntities = (Array.isArray(reviews) ? reviews : [])
    .slice(0, 8)
    .map((r) => {
      const body = clean(r?.review || r?.comment || r?.text || r?.description);
      const author = clean(r?.name || r?.author || r?.reviewerName || "Customer");
      if (!body) return null;
      return {
        "@type": "Review",
        author: { "@type": "Person", name: author },
        reviewBody: body,
        reviewRating: {
          "@type": "Rating",
          ratingValue: Number(r?.rating) || 5,
          bestRating: 5,
        },
      };
    })
    .filter(Boolean);

  if (reviewEntities.length) json.review = reviewEntities;

  return makeSchemaEntry({
    type: "AggregateRating",
    name: "Reviews & Rating",
    json,
  });
}

/**
 * Build premium schema pack for a page.
 */
function buildPremiumSchemas({
  project = {},
  page = {},
  locationName = "",
  serviceName = "",
  seoMeta = {},
  faqItems = [],
  testimonials = [],
  contact = {},
} = {}) {
  const projectName = clean(project.projectName || project.name);
  const serviceType = clean(project.serviceType || project.mainCategory);
  const pageUrl = clean(seoMeta.canonical_url || page.slug || page.name || "/");
  const pageLabel = clean(page.displayName || page.name || "Page");
  const pageType = String(page.pageType || page.name || "").toLowerCase();
  const telephone = clean(contact.phone || contact.telephone || project.phone || "");
  const email = clean(contact.email || project.email || "");

  const addressParts = [
    clean(contact.address || project.address || ""),
    clean(locationName),
  ].filter(Boolean);

  const postalAddress =
    addressParts.length || locationName
      ? {
          "@type": "PostalAddress",
          streetAddress: clean(contact.address || "") || undefined,
          addressLocality: clean(locationName) || undefined,
          addressCountry: clean(contact.country || project.country || "") || undefined,
        }
      : null;

  const schemas = [];

  // Site-wide business identity on home / about / contact
  if (
    !pageUrl ||
    pageUrl === "/" ||
    pageType === "home" ||
    pageType === "homepage" ||
    /^(home|about|contact)$/i.test(String(page.name || ""))
  ) {
    schemas.push(
      buildOrganizationSchema({
        projectName,
        serviceType,
        url: pageUrl === "/" ? "/" : undefined,
        telephone,
        email,
        address: postalAddress,
      })
    );
    schemas.push(
      buildLocalBusinessSchema({
        projectName,
        serviceType,
        url: pageUrl || "/",
        telephone,
        email,
        address: postalAddress,
        areaServed: locationName || undefined,
      })
    );
  }

  schemas.push(
    buildWebPageSchema({
      name: seoMeta.meta_title || pageLabel,
      description: seoMeta.meta_description || serviceType,
      url: pageUrl,
      pageType: /contact/i.test(String(page.name || pageType)) ? "contact" : "page",
    })
  );

  schemas.push(
    buildBreadcrumbSchema({
      pageUrl,
      pageName: pageLabel,
      projectName,
    })
  );

  if (serviceName || pageType === "service" || /service/i.test(String(page.name || ""))) {
    const svc = buildServiceSchema({
      serviceName: serviceName || pageLabel,
      description: seoMeta.meta_description || serviceType,
      providerName: projectName,
      url: pageUrl,
      areaServed: locationName,
    });
    if (svc) schemas.push(svc);
  }

  const faqSchema = buildFaqPageSchema(faqItems);
  if (faqSchema) schemas.push(faqSchema);

  if (Array.isArray(testimonials) && testimonials.length) {
    const ratings = testimonials
      .map((t) => Number(t?.rating))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avg =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 5;
    const ratingSchema = buildAggregateRatingSchema({
      projectName,
      ratingValue: avg,
      reviewCount: testimonials.length,
      reviews: testimonials,
    });
    if (ratingSchema) schemas.push(ratingSchema);
  }

  return schemas.filter(Boolean);
}

/** Serialize schemas[] into a single @graph string for legacy structured_data consumers. */
function schemasToStructuredDataString(schemas = []) {
  const graph = (Array.isArray(schemas) ? schemas : [])
    .filter((s) => s && s.enabled !== false && s.json && typeof s.json === "object")
    .map((s) => {
      const j = { ...s.json };
      delete j["@context"];
      return j;
    });

  if (!graph.length) return "";
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  });
}

module.exports = {
  newSchemaId,
  makeSchemaEntry,
  buildOrganizationSchema,
  buildLocalBusinessSchema,
  buildWebPageSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  buildFaqPageSchema,
  buildAggregateRatingSchema,
  buildPremiumSchemas,
  schemasToStructuredDataString,
};
