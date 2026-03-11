/**
 * SectionRouter.tsx
 * 
 * COMMON ROUTER for ALL sections - Uses SectionsAndVariantRegistry.tsx
 * 
 * This replaces all individual router files (HeroSection.tsx, NavbarSection.tsx, etc.)
 * 
 * How it works:
 * 1. Reads section type and variant from section prop
 * 2. Uses registry to find available variants
 * 3. Routes to the correct variant component based on registry
 */

import React, { useState } from 'react';
import { Section } from '../../types';
import { getDefaultVariant, isValidVariant } from '../SectionsAndVariantRegistry';
import { getHeadingSizeClass } from '../../utils/headingSizeUtils';

// Import all variant components
// Hero variants
import { HeroCenter } from './hero/HeroCenter';
import { HeroSplitLeft } from './hero/HeroSplitLeft';
import { HeroSplitRight } from './hero/HeroSplitRight';
import { HeroGradient } from './hero/HeroGradient';
import { HeroGeometric } from './hero/HeroGeometric';
import { HeroMulticolor } from './hero/HeroMulticolor';
import { HeroMulticolorV1 } from './hero/HeroMulticolorV1';
// Navbar variants
import { NavbarSimple } from './navbar/NavbarSimple';
import { NavbarCentered } from './navbar/NavbarCentered';
import { NavbarMinimal } from './navbar/NavbarMinimal';
import { NavbarApi } from './navbar/NavbarApi';

// Features variants
import { FeaturesGrid } from './features/FeaturesGrid';
import { FeaturesList } from './features/FeaturesList';
import { FeaturesCards } from './features/FeaturesCards';

// CTA variants
import { CTACenter } from './cta/CTACenter';
import { CTASplit } from './cta/CTASplit';
import { CTAMulticolor } from './cta/CTAMulticolor';

// Footer variants
import { FooterColumns } from './footer/FooterColumns';
import { FooterCentered } from './footer/FooterCentered';
import { FooterMinimal } from './footer/FooterMinimal';
import { FooterApi } from './footer/FooterApi';

// Pricing variants
import { PricingCards } from './pricing/PricingCards';
import { PricingMinimal } from './pricing/PricingMinimal';

// Image Banner variants
import { BannerCenter } from './image-banner/BannerCenter';
import { BannerSplit } from './image-banner/BannerSplit';
import { BannerBottomLeft } from './image-banner/BannerBottomLeft';

// Single-component sections
import { TestimonialsGrid } from './testimonials/TestimonialsGrid';
import { TestimonialsCentered } from './testimonials/TestimonialsCentered';
import { TestimonialsColumns } from './testimonials/TestimonialsColumns';
import { TestimonialsMulticolor } from './testimonials/TestimonialsMulticolor';
// FAQ variants
import { FAQCentered } from './faq/FAQCentered';
import { FAQSplit } from './faq/FAQSplit';
import { FAQMulticolor } from './faq/FAQMulticolor';

import { ElementsSection } from './ElementsSection';
import { AllElementsTest } from './allelementsTest/AllElementsTest';
interface SectionRouterProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onImageClick?: () => void;
  onLinkEdit?: (index: number, value: string) => void;
  onLogoClick?: () => void;
  onItemEdit?: (itemId: string, updates: any) => void;
  onAddItem?: () => void;
  onRemoveItem?: (id: string) => void;
  onUpload?: (sectionId: string, field: string) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  selectedElementId?: string | null;
  buttonClass: string;
  isSelected?: boolean;
  titleClass?: string;
  titleStyle?: React.CSSProperties;
  readOnly?: boolean;
}

/**
 * Common Section Router - Routes to correct variant based on registry
 */
export const SectionRouter: React.FC<SectionRouterProps> = (props) => {
  const { section } = props;
  const sectionType = section.type as string; // Cast to string to handle 'faq' type
  const variant = section.styles?.variant || getDefaultVariant(sectionType);

 
  // Route to correct variant component based on section type and variant
  const baseProps = {
    section: props.section,
    onTextEdit: props.onTextEdit,
    buttonClass: props.buttonClass,
    readOnly: props.readOnly,
    isSelected: props.isSelected,
    titleClass: props.titleClass,
    titleStyle: props.titleStyle,
    onElementSelect: props.onElementSelect,
    selectedElementId: props.selectedElementId,
  };

  // Route based on section type and variant
  switch (sectionType) {
    case 'hero':
      switch (variant) {
        case 'HeroCenter':
          return <HeroCenter {...baseProps} onImageClick={props.onImageClick} onElementSelect={props.onElementSelect} selectedElementId={props.selectedElementId} />;
        case 'HeroSplitLeft':
          return <HeroSplitLeft {...baseProps} onImageClick={props.onImageClick} onElementSelect={props.onElementSelect} selectedElementId={props.selectedElementId} />;
        case 'HeroSplitRight':
          return <HeroSplitRight {...baseProps} onImageClick={props.onImageClick} onElementSelect={props.onElementSelect} onElementUpdate={props.onElementUpdate} selectedElementId={props.selectedElementId} />;
        case 'HeroGradient':
          return <HeroGradient {...baseProps} onElementSelect={props.onElementSelect} selectedElementId={props.selectedElementId} />;
        case 'HeroGeometric':
          return <HeroGeometric {...baseProps} onElementSelect={props.onElementSelect} onElementUpdate={props.onElementUpdate} selectedElementId={props.selectedElementId} />;
        case 'HeroMulticolor':
          return <HeroMulticolor {...baseProps} onImageClick={props.onImageClick} onElementSelect={props.onElementSelect} onElementUpdate={props.onElementUpdate} selectedElementId={props.selectedElementId} />;
        case 'HeroMulticolorV1':
          return <HeroMulticolorV1 {...baseProps} onImageClick={props.onImageClick} onElementSelect={props.onElementSelect} onElementUpdate={props.onElementUpdate} selectedElementId={props.selectedElementId} />;
        default:
          return <HeroCenter {...baseProps} onImageClick={props.onImageClick} onElementSelect={props.onElementSelect} selectedElementId={props.selectedElementId} />;
      }

    case 'navbar':
      switch (variant) {
        case 'NavbarApi':
          return <NavbarApi section={props.section} readOnly={props.readOnly} />;
        case 'NavbarCentered':
          return <NavbarCentered {...baseProps} onLinkEdit={props.onLinkEdit} onLogoClick={props.onLogoClick} />;
        case 'NavbarMinimal':
          return <NavbarMinimal {...baseProps} onLinkEdit={props.onLinkEdit} onLogoClick={props.onLogoClick} />;
        case 'NavbarSimple':
        default:
          return <NavbarSimple {...baseProps} onLinkEdit={props.onLinkEdit} onLogoClick={props.onLogoClick} />;
      }

    case 'features':
      switch (variant) {
        case 'FeaturesList':
          return (
            <FeaturesList
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onAddItem={props.onAddItem}
              onRemoveItem={props.onRemoveItem}
            />
          );
        case 'FeaturesCards':
          return (
            <FeaturesCards
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onAddItem={props.onAddItem}
              onRemoveItem={props.onRemoveItem}
            />
          );
        case 'FeaturesGrid':
        default:
          return (
            <FeaturesGrid
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onAddItem={props.onAddItem}
              onRemoveItem={props.onRemoveItem}
            />
          );
      }

    case 'cta':
      switch (variant) {
        case 'CTASplit':
          return <CTASplit {...baseProps} onElementUpdate={props.onElementUpdate} />;
        case 'CTAMulticolor':
          return <CTAMulticolor {...baseProps} onElementSelect={props.onElementSelect} onElementUpdate={props.onElementUpdate} selectedElementId={props.selectedElementId} />;
        case 'CTACenter':
        default:
          return <CTACenter {...baseProps} onElementUpdate={props.onElementUpdate} />;
      }

    case 'footer':
      switch (variant) {
        case 'FooterApi':
          return <FooterApi section={props.section} readOnly={props.readOnly} />;
        case 'FooterCentered':
          return <FooterCentered {...baseProps} onLinkEdit={props.onLinkEdit} onLogoClick={props.onLogoClick} />;
        case 'FooterMinimal':
          return <FooterMinimal {...baseProps} onLinkEdit={props.onLinkEdit} onLogoClick={props.onLogoClick} />;
        case 'FooterColumns':
        default:
          return <FooterColumns {...baseProps} onLinkEdit={props.onLinkEdit} onLogoClick={props.onLogoClick} />;
      }

    case 'pricing':
      switch (variant) {
        case 'PricingMinimal':
          return (
            <PricingMinimal
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onRemoveItem={props.onRemoveItem}
              onAddItem={props.onAddItem}
            />
          );
        case 'PricingCards':
        default:
          return (
            <PricingCards
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onRemoveItem={props.onRemoveItem}
              onAddItem={props.onAddItem}
            />
          );
      }

    case 'testimonials':
      switch (variant) {
        case 'TestimonialsCentered':
          return (
            <TestimonialsCentered
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onRemoveItem={props.onRemoveItem}
              onAddItem={props.onAddItem}
              onElementUpdate={props.onElementUpdate}
              onElementSelect={props.onElementSelect}
              selectedElementId={props.selectedElementId}
            />
          );
        case 'TestimonialsColumns':
          return (
            <TestimonialsColumns
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onRemoveItem={props.onRemoveItem}
              onAddItem={props.onAddItem}
              onElementUpdate={props.onElementUpdate}
              onElementSelect={props.onElementSelect}
              selectedElementId={props.selectedElementId}
            />
          );
        case 'TestimonialsMulticolor':
          return (
            <TestimonialsMulticolor
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onRemoveItem={props.onRemoveItem}
              onAddItem={props.onAddItem}
              onElementUpdate={props.onElementUpdate}
              onElementSelect={props.onElementSelect}
              selectedElementId={props.selectedElementId}
            />
          );
        case 'TestimonialsGrid':
        default:
          return (
            <TestimonialsGrid
              {...baseProps}
              onItemEdit={props.onItemEdit}
              onRemoveItem={props.onRemoveItem}
              onAddItem={props.onAddItem}
              onElementUpdate={props.onElementUpdate}
              onElementSelect={props.onElementSelect}
              selectedElementId={props.selectedElementId}
            />
          );
      }
   case 'faq':
      switch (variant) {
        case 'FAQMulticolor':
          return (
            <FAQMulticolor
              {...baseProps}
              onElementUpdate={props.onElementUpdate}
              onElementSelect={props.onElementSelect}
              selectedElementId={props.selectedElementId}
            />
          );
        case 'FAQSplit':
          return (
            <FAQSplit
              {...baseProps}
              onElementUpdate={props.onElementUpdate}
              onElementSelect={props.onElementSelect}
              selectedElementId={props.selectedElementId}
            />
          );
        case 'FAQCentered':
        default:
          return (
            <FAQCentered
              {...baseProps}
              onElementUpdate={props.onElementUpdate}
              onElementSelect={props.onElementSelect}
              selectedElementId={props.selectedElementId}
            />
          );
      }

    case 'elements':
      return (
        <ElementsSection
          {...baseProps}
          onUpload={props.onUpload}
          onElementUpdate={props.onElementUpdate}
          onElementSelect={props.onElementSelect}
          selectedElementId={props.selectedElementId}
          themeColors={{
            titleColor: props.section.styles?.titleColor,
            textColor: props.section.styles?.textColor,
            accentColor: props.section.styles?.accentColor,
            buttonBackgroundColor: props.section.styles?.buttonBackgroundColor,
            buttonTextColor: props.section.styles?.buttonTextColor,
            backgroundColor: props.section.styles?.backgroundColor,
          }}
        />
      );

    case 'image-banner':
      switch (variant) {
        case 'BannerBottomLeft':
          return <BannerBottomLeft {...baseProps} />;
        case 'BannerSplit':
          return <BannerSplit {...baseProps} />;
        case 'BannerCenter':
        default:
          return <BannerCenter {...baseProps} />;
      }

    case 'allelementsTest':
      return (
        <AllElementsTest
          {...baseProps}
          onElementUpdate={props.onElementUpdate}
          onElementSelect={props.onElementSelect}
          selectedElementId={props.selectedElementId}
          onTextEdit={props.onTextEdit}
        />
      );
    default:
      return <div className="p-10 text-center">Unsupported Section Type: {sectionType}</div>;
  }
};
