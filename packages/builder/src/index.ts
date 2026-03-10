/**
 * @builder/core - Standalone Builder Package
 * 
 * This package contains all builder-related code that can be shared
 * with third-party developers without exposing the full admin panel.
 * 
 * Main exports:
 * - BuilderApp: Main builder component
 * - useStudio: Zustand store for builder state
 * - Builder types and utilities
 */

import BuilderApp from './App';

export default BuilderApp;
export { BuilderApp };
export { useStudio } from './store';
export type { Section, Row, Column, Element } from './types/builder';

// Re-export commonly used components
export { default as BuilderCanvas } from './components/canvas/BuilderCanvas';
export { default as SettingsSidebar } from './components/sidebar/SettingsSidebar';
export { default as ElementsPanel } from './components/sidebar/ElementsPanel';

// Export element properties utilities
export { getBuilderElementsList } from './elementProperties';
export type { BuilderElement, ElementPropertyGroup, ElementProperty } from './elementProperties';
