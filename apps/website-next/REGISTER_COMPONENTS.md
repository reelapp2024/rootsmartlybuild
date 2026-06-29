# Component Registration Guide

## API Endpoint
**POST** `/admin/v1/upsertWebsiteComponent`

## Component Mapping

### Components Available in Monorepo:
1. **HeroSection** - `packages/ui/src/components/Hero/HeroSection.tsx`
2. **HeroSectionVariantA** - `packages/ui/src/components/Hero/HeroSectionVariantA.tsx`
3. **HeroSectionVariantB** - `packages/ui/src/components/Hero/HeroSectionVariantB.tsx`
4. **HeroSectionVariantC** - `packages/ui/src/components/Hero/HeroSectionVariantC.tsx`
5. **HeroSectionVariantD** - `packages/ui/src/components/Hero/HeroSectionVariantD.tsx`
6. **FeaturesSection** - `packages/ui/src/components/Hero/FeaturesSection.tsx`
7. **TestimonialSection** - `packages/ui/src/components/Testimonial/TestimonialSection.tsx`
8. **FAQSection** - `packages/ui/src/components/FAQ/FAQSection.tsx`
9. **ProcessSection** - `packages/ui/src/components/Process/ProcessSection.tsx`

## Registration Payload

### For HeroSection (2 variants - A and B):
```json
[
  {
    "name": "HeroSection",
    "category": "homepage",
    "uniqueId": "HeroSectionVariantA",
    "variant": "A",
    "displayName": "Hero Section Variant A",
    "description": "Gradient background, centered layout"
  },
  {
    "name": "HeroSection",
    "category": "homepage",
    "uniqueId": "HeroSectionVariantB",
    "variant": "B",
    "displayName": "Hero Section Variant B",
    "description": "Split layout with image on right"
  }
]
```

### For FeaturesSection (2 variants - A and B):
```json
[
  {
    "name": "FeaturesSection",
    "category": "homepage",
    "uniqueId": "FeaturesSectionVariantA",
    "variant": "A",
    "displayName": "Features Section Variant A",
    "description": "Key features showcase"
  },
  {
    "name": "FeaturesSection",
    "category": "homepage",
    "uniqueId": "FeaturesSectionVariantB",
    "variant": "B",
    "displayName": "Features Section Variant B",
    "description": "Features with different layout"
  }
]
```

### For Other Components (Base only, no variants):
```json
[
  {
    "name": "TestimonialSection",
    "category": "homepage",
    "uniqueId": "TestimonialSection",
    "variant": "A",
    "displayName": "Testimonial Section",
    "description": "Customer reviews"
  },
  {
    "name": "FAQSection",
    "category": "homepage",
    "uniqueId": "FAQSection",
    "variant": "A",
    "displayName": "FAQ Section",
    "description": "Frequently asked questions"
  },
  {
    "name": "ProcessSection",
    "category": "homepage",
    "uniqueId": "ProcessSection",
    "variant": "A",
    "displayName": "Process Section",
    "description": "How it works"
  }
]
```

## Section ID to Component Name Mapping

From BusinessWebsiteCreate, sections map to components:

| Section ID | Component Name | Category | Notes |
|------------|---------------|----------|-------|
| hero | HeroSection | homepage | Has 2 variants (A, B) |
| features | FeaturesSection | homepage | Has 2 variants (A, B) |
| testimonials | TestimonialSection | homepage | Base only |
| faq | FAQSection | homepage | Base only |
| process | ProcessSection | homepage | Base only |

## Note
- For sections that don't have components yet (like "services", "cta", "stats", etc.), they will be registered when components are created
- Category is based on the page where the section appears (homepage, about, services, contact, etc.)

