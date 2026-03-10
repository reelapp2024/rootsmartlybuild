
interface OrganizationSchemaData {
  name: string;
  description: string;
  url: string;
  telephone: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

interface ServiceSchemaData {
  name: string;
  description: string;
  provider: string;
  areaServed: string;
  serviceType: string;
  url?: string;
  priceRange?: string;
  openingHours?: string[];
}

interface FAQSchemaData {
  question: string;
  answer: string;
}

interface LocalBusinessSchemaData {
  name: string;
  description: string;
  telephone: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  openingHours: string[];
  priceRange: string;
  serviceArea: string[];
}

interface BreadcrumbItemData {
  name: string;
  url: string;
  position: number;
}

interface WebPageSchemaData {
  name: string;
  description: string;
  url: string;
  inLanguage?: string;
  isPartOf?: string;
}

interface HowToSchemaData {
  name: string;
  description: string;
  steps: Array<{
    name: string;
    text: string;
    position: number;
  }>;
}

interface ReviewSchemaData {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}

interface AggregateRatingSchemaData {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

// schemaGenerator.ts

interface ContactPageSchemaData {
  name?: string;
  description?: string;
  url?: string;
}

interface AboutPageSchemaData {
  name?: string;
  description?: string;
  url?: string;
}

export const generateOrganizationSchema = (data: OrganizationSchemaData) => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.name,
    "description": data.description,
    "url": data.url,
    "telephone": data.telephone,
    "email": data.email,
    "address": data.address ? {
      "@type": "PostalAddress",
      "streetAddress": data.address.streetAddress,
      "addressLocality": data.address.addressLocality,
      "addressRegion": data.address.addressRegion,
      "postalCode": data.address.postalCode,
      "addressCountry": data.address.addressCountry
    } : undefined,
    "sameAs": data.sameAs,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": data.telephone,
      "contactType": "customer service",
      "availableLanguage": "English",
      "areaServed": "US"
    }
  };
};

export const generateLocalBusinessSchema = (data: LocalBusinessSchemaData) => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": data.name,
    "description": data.description,
    "telephone": data.telephone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address.streetAddress,
      "addressLocality": data.address.addressLocality,
      "addressRegion": data.address.addressRegion,
      "postalCode": data.address.postalCode,
      "addressCountry": data.address.addressCountry
    },
    "openingHours": data.openingHours,
    "priceRange": data.priceRange,
    "serviceArea": data.serviceArea.map(area => ({
      "@type": "GeoCircle",
      "name": area
    }))
  };
};

export const generateServiceSchema = (services: ServiceSchemaData[]) => {
  return services.map(service => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "Organization",
      "name": service.provider
    },
    "areaServed": service.areaServed,
    "serviceType": service.serviceType,
    "url": service.url,
    "priceRange": service.priceRange,
    "hoursAvailable": service.openingHours ? {
      "@type": "OpeningHoursSpecification",
      "opens": "00:00",
      "closes": "23:59",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    } : undefined
  }));
};

export const generateFAQSchema = (faqs: FAQSchemaData[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export const generateContactPointSchema = (telephone: string, areas: string[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPoint",
    "telephone": telephone,
    "contactType": "customer service",
    "availableLanguage": "English",
    "areaServed": areas,
    "hoursAvailable": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    }
  };
};

export const generateReviewSchema = (reviews: ReviewSchemaData[]) => {
  return reviews.map(review => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": 5
    },
    "reviewBody": review.reviewBody,
    "datePublished": review.datePublished
  }));
};

export const generateBreadcrumbSchema = (items: BreadcrumbItemData[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map(item => ({
      "@type": "ListItem",
      "position": item.position,
      "name": item.name,
      "item": item.url
    }))
  };
};

export const generateWebPageSchema = (data: WebPageSchemaData) => {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": data.name,
    "description": data.description,
    "url": data.url,
    "inLanguage": data.inLanguage || "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Emergency Plumbing Service",
      "url": data.isPartOf || window.location.origin
    }
  };
};

export const generateHowToSchema = (data: HowToSchemaData) => {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": data.name,
    "description": data.description,
    "step": data.steps.map(step => ({
      "@type": "HowToStep",
      "name": step.name,
      "text": step.text,
      "position": step.position
    }))
  };
};

export const generateAggregateRatingSchema = (data: AggregateRatingSchemaData) => {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": data.ratingValue,
    "reviewCount": data.reviewCount,
    "bestRating": data.bestRating || 5,
    "worstRating": data.worstRating || 1
  };
};

export const generateContactPageSchema = (data?: ContactPageSchemaData) => {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": data?.name || "Contact Us - Emergency Plumbing Service",
    "description": data?.description || "Get in touch with Emergency Plumbing Service for 24/7 plumbing assistance",
    "url": data?.url || `${window.location.origin}/contact`
  };
};

export const generateAboutPageSchema = (data?: AboutPageSchemaData) => {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": data?.name || "About our services",
    "description": data?.description || "Learn about our professional services and experienced team",
    "url": data?.url || `${window.location.origin}/about`
  };
};
