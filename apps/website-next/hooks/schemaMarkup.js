export const generateFAQSchema = (faqs = []) => {
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

export const generateReviewSchema = (reviews = []) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product", // or Service or LocalBusiness based on context
    "name": "Your Project Service Name",
    "review": reviews.map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": Number(review.rating) || 5,
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": review.customer_name
      },
      "reviewBody": review.review_text
    }))
  };
};

export const generateServicesSchema = (services = []) => {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Cleaning Services",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Our Cleaning Services",
      "itemListElement": services.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service.service_name,
          "description": service.service_description
        }
      }))
    }
  };
};








