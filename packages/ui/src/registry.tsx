import type React from "react";
// Import shared registry builder and paths
import { buildRegistry, REGISTRY_MAP } from "./registry-shared";

// Import only required components
import HeroA from "./components/Hero/hero_a";
import HeroB from "./components/Hero/hero_b";
import HeroC from "./components/Hero/hero_c";
import HeroD from "./components/Hero/hero_d";
import HeroE from "./components/Hero/hero_e";
import HeroF from "./components/Hero/hero_f";
import HeroG from "./components/Hero/hero_g";
import HeroH from "./components/Hero/hero_h";
import ServicesA from "./components/Services/services_a";
import CTAA from "./components/CTA/cta_a";
import CTAB from "./components/CTA/cta_b";
import CTAC from "./components/CTA/cta_c";
import CTAD from "./components/CTA/cta_d";
import HeaderA from "./components/Header/header_a";
import FooterA from "./components/Footer/footer_a";

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

// Component loader function for builder (direct imports)
const componentLoader = (componentPath: string): React.ComponentType<any> | null => {
  return COMPONENT_MAP[componentPath] || null;
};

// Build registry using shared function
export const registry = buildRegistry(componentLoader);

// Re-export individual components for convenience
