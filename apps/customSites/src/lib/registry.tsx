'use client';

import dynamic from 'next/dynamic';
import React from 'react';
// Import shared registry builder and paths
import { buildRegistry, REGISTRY_MAP } from '../../../../packages/ui/src/registry-shared';

/**
 * Shared Registry for Custom Sites
 * Uses Next.js dynamic imports for SSR compatibility
 * Uses the same buildRegistry function as the builder for consistency
 * 
 * This ensures both builder and custom sites use the same component mappings
 * and styles remain consistent across both environments
 */

// Create dynamic imports for only required components (Next.js requires static strings)
const HeroA = dynamic(() => import('../../../../packages/ui/src/components/Hero/hero_a'), { ssr: false });
const HeroB = dynamic(() => import('../../../../packages/ui/src/components/Hero/hero_b'), { ssr: false });
const HeroC = dynamic(() => import('../../../../packages/ui/src/components/Hero/hero_c'), { ssr: false });
const HeroD = dynamic(() => import('../../../../packages/ui/src/components/Hero/hero_d'), { ssr: false });
const HeroE = dynamic(() => import('../../../../packages/ui/src/components/Hero/hero_e'), { ssr: false });
const HeroF = dynamic(() => import('../../../../packages/ui/src/components/Hero/hero_f'), { ssr: false });
const HeroG = dynamic(() => import('../../../../packages/ui/src/components/Hero/hero_g'), { ssr: false });
const HeroH = dynamic(() => import('../../../../packages/ui/src/components/Hero/hero_h'), { ssr: false });
const ServicesA = dynamic(() => import('../../../../packages/ui/src/components/Services/services_a'), { ssr: false });
const CTAA = dynamic(() => import('../../../../packages/ui/src/components/CTA/cta_a'), { ssr: false });
const CTAB = dynamic(() => import('../../../../packages/ui/src/components/CTA/cta_b'), { ssr: false });
const CTAC = dynamic(() => import('../../../../packages/ui/src/components/CTA/cta_c'), { ssr: false });
const CTAD = dynamic(() => import('../../../../packages/ui/src/components/CTA/cta_d'), { ssr: false });
const HeaderA = dynamic(() => import('../../../../packages/ui/src/components/Header/header_a'), { ssr: false });
const FooterA = dynamic(() => import('../../../../packages/ui/src/components/Footer/footer_a'), { ssr: false });

// Component mapping: component file path -> React component
// Uses paths from REGISTRY_MAP (single source of truth)
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  [REGISTRY_MAP['hero_a']]: HeroA,
  [REGISTRY_MAP['hero_b']]: HeroB,
  [REGISTRY_MAP['hero_c']]: HeroC,
  [REGISTRY_MAP['hero_d']]: HeroD,
  [REGISTRY_MAP['hero_e']]: HeroE,
  [REGISTRY_MAP['hero_f']]: HeroF,
  [REGISTRY_MAP['hero_g']]: HeroG,
  [REGISTRY_MAP['hero_h']]: HeroH,
  [REGISTRY_MAP['services_a']]: ServicesA,
  [REGISTRY_MAP['cta_a']]: CTAA,
  [REGISTRY_MAP['cta_b']]: CTAB,
  [REGISTRY_MAP['cta_c']]: CTAC,
  [REGISTRY_MAP['cta_d']]: CTAD,
  [REGISTRY_MAP['header_a']]: HeaderA,
  [REGISTRY_MAP['footer_a']]: FooterA,
};

// Component loader function for customSites (dynamic imports)
const componentLoader = (componentPath: string): React.ComponentType<any> | null => {
  return COMPONENT_MAP[componentPath] || null;
};

// Build registry using shared function
export const registry = buildRegistry(componentLoader);

// Fallback: try to get component by name if not found by uniqueId
export async function getComponent(uniqueId: string): Promise<React.ComponentType<any> | null> {
  // Try direct lookup
  if (registry[uniqueId]) {
    return registry[uniqueId];
  }

  // Try case-insensitive lookup
  const lowerId = uniqueId.toLowerCase();
  for (const [key, component] of Object.entries(registry)) {
    if (key.toLowerCase() === lowerId) {
      return component;
    }
  }

  return null;
}
