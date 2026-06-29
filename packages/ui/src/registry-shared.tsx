/**
 * Shared Registry Configuration
 * This file defines the registry mapping that both builder and custom sites use
 * This ensures consistency and single source of truth
 * 
 * To add a new component:
 * 1. Add the path to REGISTRY_MAP below (ONLY place paths are defined)
 * 2. Import the component in builder registry.tsx (direct import)
 * 3. Import the component in customSites registry.tsx (dynamic import)
 * 4. Add to COMPONENT_MAP in both registries using REGISTRY_MAP['uniqueId']
 */

import type React from 'react';

export type ComponentRegistryMap = Record<string, string>;
export type ComponentLoader = (componentPath: string) => any; // Use 'any' to avoid React version conflicts

/**
 * Registry mapping: uniqueId -> component file path
 * This is the single source of truth for component registration
 * Only add components here - they will be available in both builder and customSites
 */
export const REGISTRY_MAP: ComponentRegistryMap = {
  // Hero variants
  'hero_a': './components/Hero/hero_a',
  'hero_b': './components/Hero/hero_b',
  'hero_c': './components/Hero/hero_c',
  'hero_d': './components/Hero/hero_d',
  'hero_e': './components/Hero/hero_e',
  'hero_f': './components/Hero/hero_f',
  'hero_g': './components/Hero/hero_g',
  'hero_h': './components/Hero/hero_h',
  
  // Services
  'services_a': './components/Services/services_a',
  
  // CTA variants
  'cta_a': './components/CTA/cta_a',
  'cta_b': './components/CTA/cta_b',
  'cta_c': './components/CTA/cta_c',
  'cta_d': './components/CTA/cta_d',
  
  // Header variants
  'header_a': './components/Header/header_a',
  
  // Footer variants
  'footer_a': './components/Footer/footer_a',
};

/**
 * Shared function to build registry from REGISTRY_MAP and component loader
 * This ensures both builder and customSites use the same registration logic
 * 
 * @param componentLoader Function that loads a component by its path
 * @returns Registry object mapping uniqueId -> React component
 */
export function buildRegistry(componentLoader: ComponentLoader): Record<string, any> {
  const registry: Record<string, any> = {};
  
  Object.entries(REGISTRY_MAP).forEach(([uniqueId, componentPath]) => {
    const Component = componentLoader(componentPath);
    if (Component) {
      registry[uniqueId] = Component;
    } else {
      console.warn(`[Registry] Component not found for path: ${componentPath} (uniqueId: ${uniqueId})`);
    }
  });
  
  return registry;
}

/**
 * Get component file path by uniqueId
 */
export function getComponentPath(uniqueId: string): string | null {
  return REGISTRY_MAP[uniqueId] || null;
}

/**
 * Get all registered component uniqueIds
 */
export function getRegisteredComponentIds(): string[] {
  return Object.keys(REGISTRY_MAP);
}

