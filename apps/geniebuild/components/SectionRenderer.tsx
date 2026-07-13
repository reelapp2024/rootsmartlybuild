import React, { useState, Component, useMemo } from 'react';
import { AnimatedDiv } from './motionSafe';
import { Section, WebsiteElement } from '../types';
import { SectionRouter } from './sections/SectionRouter';
import { useTheme } from '@ui/blocks';
import { DEFAULT_TYPOGRAPHY, PRESET_THEMES } from '../constants';
import { useGlobalElementStyles } from './builder/state/GlobalElementStylesContext';
import { useDefaultSizes } from './builder/state/DefaultSizesContext';
import {
  pickHeadingLevelStyle,
  resolveHeadingFontSize,
  type HeadingTag,
} from '../utils/resolveElementTypography';
import {
  collectSectionImageUrls,
  resolveSectionImageUrl,
  toDisplayImageUrl,
} from './sections/homepage/utils/sectionImageResolve';
import { SectionEffectsLayer } from './sections/homepage/utils/SectionEffectsLayer';
import { resolveStyleFieldUpdate } from './builder/state/sectionUpdaters';
import { useAboutUsContact } from './builder/context/AboutUsContactContext';
import { applySectionContactForDisplay } from '../lib/contactResolver';

interface SectionRendererProps {
  section: Section;
  onUpdate: (id: string, updates: Partial<Section>) => void;
  isSelected: boolean;
  readOnly?: boolean;
  sitePathname?: string;
  sitePageType?: string;
  /** When true, draw a persistent subtle outline around every section
   *  (not just hovered/selected) so users can see the boundaries at a
   *  glance. Toggleable from Global Settings. */
  showSectionOutlines?: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onUpload?: (sectionId: string, field: string) => void;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  selectedElementId?: string | null;
}

interface SectionErrorBoundaryProps {
  sectionType: string;
  children: React.ReactNode;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[SectionRenderer] Section render failed for "${this.props.sectionType}"`, error);
  }

  componentDidUpdate(prevProps: SectionErrorBoundaryProps) {
    if (prevProps.sectionType !== this.props.sectionType && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-8 max-w-4xl rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
          <div className="text-sm font-semibold text-amber-300">
            Section "{this.props.sectionType}" is not available
          </div>
          <div className="mt-2 text-xs text-amber-200/80">
            This section variant is missing or incompatible with GenieBuild.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const BackgroundCarousel: React.FC<{
  images: Array<{ url: string; id: string }>;
  settings: any;
  styles: any;
}> = ({ images, settings, styles }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (!settings.enabled || !settings.autoplay || images.length <= 1) return;
    if (settings.pauseOnHover && isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, settings.duration || 5000);
    return () => clearInterval(interval);
  }, [settings.enabled, settings.autoplay, settings.duration, images.length, settings.pauseOnHover, isHovered]);

  if (!images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const transitionStyle = settings.transitionType === 'fade' 
    ? { transition: `opacity ${settings.transitionSpeed || 500}ms ease-in-out` }
    : { transition: `transform ${settings.transitionSpeed || 500}ms ease-in-out` };

  const buttonVariant = settings.buttonVariant || 'minimal';

  const renderButtons = () => {
    if (buttonVariant === 'hidden' || images.length <= 1) return null;

    let btnClass = "absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center cursor-pointer transition-all ";
    
    switch (buttonVariant) {
      case 'rounded':
        btnClass += "w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm";
        break;
      case 'square':
        btnClass += "w-12 h-12 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm";
        break;
      case 'outline':
        btnClass += "w-12 h-12 rounded-full border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm";
        break;
      case 'minimal':
      default:
        btnClass += "w-10 h-10 text-white/70 hover:text-white drop-shadow-md";
        break;
    }

    return (
      <>
        <div className={`${btnClass} left-4`} onClick={handlePrev}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <div className={`${btnClass} right-4`} onClick={handleNext}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </>
    );
  };

  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {settings.transitionType === 'slide' ? (
        <div 
          className="absolute inset-0 flex h-full w-full"
          style={{ 
            ...transitionStyle,
            transform: `translateX(-${currentIndex * 100}%)` 
          }}
        >
          {images.map((img) => (
            <div 
              key={img.id}
              className="w-full h-full flex-shrink-0 bg-cover bg-center bg-no-repeat"
              style={{ 
                backgroundImage: `url(${img.url})`,
                backgroundPosition: styles.background?.image?.position || styles.backgroundPosition || 'center',
                backgroundSize: styles.background?.image?.size || styles.backgroundSize || 'cover',
                backgroundRepeat: styles.background?.image?.repeat || styles.backgroundRepeat || 'no-repeat',
              }}
            />
          ))}
        </div>
      ) : (
        images.map((img, idx) => (
          <div 
            key={img.id}
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${img.url})`,
              opacity: currentIndex === idx ? 1 : 0,
              backgroundPosition: styles.background?.image?.position || styles.backgroundPosition || 'center',
              backgroundSize: styles.background?.image?.size || styles.backgroundSize || 'cover',
              backgroundRepeat: styles.background?.image?.repeat || styles.backgroundRepeat || 'no-repeat',
              ...transitionStyle
            }}
          />
        ))
      )}
      {renderButtons()}
    </div>
  );
};

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  onUpdate,
  isSelected,
  readOnly = false,
  sitePathname,
  sitePageType,
  showSectionOutlines = false,
  onClick,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onUpload,
  onElementSelect,
  selectedElementId
}) => {
  const { aboutUs } = useAboutUsContact();
  const displaySection = useMemo(
    () => applySectionContactForDisplay(section, aboutUs),
    [section, aboutUs]
  );
  const { type, content, styles } = displaySection;
  const { themeData } = useTheme();
  const globalElementStyles = useGlobalElementStyles();
  const defaultSizes = useDefaultSizes();

  const handleTextEdit = (key: keyof typeof content, value: string) => {
    if (readOnly) return;
    onUpdate(section.id, {
      content: { ...content, [key]: value }
    });
  };

  const handleItemEdit = (itemId: string, updates: any) => {
    if (readOnly) return;
    const newItems = content.items?.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    onUpdate(section.id, { content: { ...content, items: newItems } });
  };

  const handleElementUpdate = (elementId: string, updates: Partial<WebsiteElement>) => {
    if (readOnly) return;
    const elements = section.elements || [];
    const existingIndex = elements.findIndex(el => el.id === elementId);

    const applyStyleFields = (prev: WebsiteElement, patch: Partial<WebsiteElement>): WebsiteElement => {
      const next: WebsiteElement = { ...prev, ...patch };
      if ('style' in patch) {
        next.style = (resolveStyleFieldUpdate(
          prev.style as Record<string, any> | undefined,
          patch.style as Record<string, any> | undefined,
          true,
        ) || {}) as WebsiteElement['style'];
      }
      if ('tabletStyle' in patch) {
        next.tabletStyle = resolveStyleFieldUpdate(
          prev.tabletStyle as Record<string, any> | undefined,
          patch.tabletStyle as Record<string, any> | undefined,
          true,
        );
      }
      if ('mobileStyle' in patch) {
        next.mobileStyle = resolveStyleFieldUpdate(
          prev.mobileStyle as Record<string, any> | undefined,
          patch.mobileStyle as Record<string, any> | undefined,
          true,
        );
      }
      if (patch.content !== undefined) {
        next.content = { ...(prev.content || {}), ...(patch.content || {}) };
      }
      return next;
    };
    
    let newElements;
    if (existingIndex >= 0) {
      newElements = [...elements];
      newElements[existingIndex] = applyStyleFields(newElements[existingIndex], updates);
    } else {
      newElements = [...elements, applyStyleFields({ id: elementId, type: 'text', content: {}, style: {} } as WebsiteElement, updates)];
    }

    // Sync with section content/styles if this elementId refers to virtual title/subtitle/description
    const isTitle = elementId === `${section.id}-title` || elementId === `${section.id}-hero-title`;
    const isSubtitle = elementId === `${section.id}-subtitle` || elementId === `${section.id}-hero-subtitle`;
    const isDescription = elementId === `${section.id}-description` || elementId === `${section.id}-hero-description`;
    const isButton = elementId === `${section.id}-hero-button`;
    const isImage = elementId === `${section.id}-hero-image`;

    if (isTitle || isSubtitle || isDescription || isButton || isImage) {
      const prefix = isTitle ? 'title' : (isSubtitle ? 'subtitle' : (isDescription ? 'description' : (isButton ? 'cta' : 'image')));
      const sectionUpdates: any = { content: { ...content }, styles: { ...styles } };
      
      if (isButton) {
        if (updates.content?.text !== undefined) sectionUpdates.content.ctaText = updates.content.text;
        if (updates.content?.link !== undefined) sectionUpdates.content.ctaHref = updates.content.link;
      } else if (isImage) {
        if (updates.content?.imageUrl !== undefined) sectionUpdates.content.imageUrl = updates.content.imageUrl;
      } else if (updates.content?.text !== undefined) {
          sectionUpdates.content[prefix] = updates.content.text;
      }
      
      if (updates.style) {
        if (isButton) {
          if (updates.style.backgroundColor) sectionUpdates.styles.buttonBackgroundColor = updates.style.backgroundColor;
          if (updates.style.color) sectionUpdates.styles.buttonTextColor = updates.style.color;
        } else {
          if (updates.style.color) sectionUpdates.styles[`${prefix}Color`] = updates.style.color;
          if (updates.style.fontSize) sectionUpdates.styles[`${prefix}FontSize`] = updates.style.fontSize;
          if (updates.style.fontWeight) sectionUpdates.styles[`${prefix}FontWeight`] = updates.style.fontWeight;
          if (updates.style.fontFamily) sectionUpdates.styles[`${prefix}FontFamily`] = updates.style.fontFamily;
          if (updates.style.textTransform) sectionUpdates.styles[`${prefix}TextTransform`] = updates.style.textTransform;
          if (updates.style.letterSpacing) sectionUpdates.styles[`${prefix}LetterSpacing`] = updates.style.letterSpacing;
          if (updates.style.fontStyle) sectionUpdates.styles[`${prefix}FontStyle`] = updates.style.fontStyle;
        }
      }
      
      onUpdate(section.id, { elements: newElements, ...sectionUpdates });
      return;
    }

    // ServicesPlumbing2 service cards use ids `${section.id}-sp2-svc0` — sync edits into content.items[index]
    const sp2CardMatch =
      String(section.type || '').toLowerCase() === 'services'
        ? elementId.match(/-sp2-svc(\d+)$/)
        : null;
    if (sp2CardMatch) {
      const idx = parseInt(sp2CardMatch[1], 10);
      const items = Array.isArray(content.items) ? [...content.items] : [];
      if (items.length > idx) {
        const item = { ...items[idx] };
        const uc = (updates.content || {}) as Record<string, unknown>;
        if (uc.imageUrl !== undefined) item.imageUrl = uc.imageUrl as string;
        if (uc.title !== undefined) item.title = uc.title as string;
        if (uc.text !== undefined) item.title = uc.text as string;
        if (uc.description !== undefined) item.description = uc.description as string;
        if (uc.subText !== undefined) item.description = uc.subText as string;
        if (uc.link !== undefined) item.link = uc.link as string;
        if (uc.buttonLink !== undefined) item.link = uc.buttonLink as string;
        items[idx] = item;
        onUpdate(section.id, { elements: newElements, content: { ...content, items } });
        return;
      }
    }

    // Sync with content.items if this elementId refers to an item or its sub-parts
    const itemToUpdate = content.items?.find(i => 
      i.id === elementId || 
      elementId === `${i.id}-title` || 
      elementId === `${i.id}-description` || 
      elementId === `${i.id}-icon` ||
      elementId === `${i.id}-price`
    );

    if (itemToUpdate) {
      const newItems = content.items?.map(item => {
        const isExactMatch = item.id === elementId;
        const isTitleMatch = elementId === `${item.id}-title`;
        const isDescMatch = elementId === `${item.id}-description`;
        const isIconMatch = elementId === `${item.id}-icon`;
        const isPriceMatch = elementId === `${item.id}-price`;

        if (!isExactMatch && !isTitleMatch && !isDescMatch && !isIconMatch && !isPriceMatch) return item;

        const itemUpdates: any = {};
        if (updates.content) {
          if (isExactMatch) {
            if (updates.content.text !== undefined) itemUpdates.title = updates.content.text;
            if (updates.content.subText !== undefined) itemUpdates.description = updates.content.subText;
            if (updates.content.icon !== undefined) itemUpdates.icon = updates.content.icon;
            if (updates.content.price !== undefined) itemUpdates.price = updates.content.price;
          } else if (isTitleMatch) {
            if (updates.content.text !== undefined) itemUpdates.title = updates.content.text;
          } else if (isDescMatch) {
            if (updates.content.text !== undefined) itemUpdates.description = updates.content.text;
          } else if (isIconMatch) {
            if (updates.content.icon !== undefined) itemUpdates.icon = updates.content.icon;
          } else if (isPriceMatch) {
            if (updates.content.text !== undefined) itemUpdates.price = updates.content.text;
          }
        }

        if (updates.style) {
          itemUpdates.style = {
            ...(item.style || {}),
            ...updates.style
          };
        }

        return { ...item, ...itemUpdates };
      });
      onUpdate(section.id, { elements: newElements, content: { ...content, items: newItems } });
    } else {
      onUpdate(section.id, { elements: newElements });
    }
  };

  const handleLinkEdit = (index: number, newLabel: string) => {
    if (readOnly) return;
    const links = content.links || [];
    const newLinks = [...links];
    if(newLinks[index]) {
        newLinks[index] = { ...newLinks[index], label: newLabel };
        onUpdate(section.id, { content: { ...content, links: newLinks } });
    }
  };

  const addItem = () => {
    if (readOnly) return;
    const newItem = {
      id: `item-${Date.now()}`,
      title: 'New Item',
      description: 'Add a description here.',
      icon: '✨',
      price: '$29',
      features: ['Feature 1', 'Feature 2'],
      author: 'Name',
      role: 'Role',
      avatar: 'https://i.pravatar.cc/150'
    };
    onUpdate(section.id, { content: { ...content, items: [...(content.items || []), newItem] } });
  };

  const removeItem = (id: string) => {
    if (readOnly) return;
    onUpdate(section.id, { content: { ...content, items: content.items?.filter(i => i.id !== id) } });
  };

  const handleImageClick = () => {
    if (readOnly) return;
    if (onUpload) {
        onUpload(section.id, 'imageUrl');
    } else {
        const newUrl = prompt('Enter image URL:', content.imageUrl || '');
        if (newUrl !== null) {
          handleTextEdit('imageUrl', newUrl);
        }
    }
  };
  
  const handleLogoClick = () => {
    if (readOnly) return;
    if (onUpload) {
        onUpload(section.id, 'logoImageUrl');
    } else {
        const newUrl = prompt('Enter Logo URL:', content.logoImageUrl || '');
        if (newUrl !== null) {
          handleTextEdit('logoImageUrl', newUrl);
        }
    }
  };

  const isTailwindClass = (val?: string) => {
    if (!val) return false;
    const prefixes = ['text-', 'pt-', 'pb-', 'pl-', 'pr-', 'px-', 'py-', 'mt-', 'mb-', 'ml-', 'mr-', 'mx-', 'my-', 'bg-', 'font-', 'rounded-', 'shadow-', 'border-'];
    return prefixes.some(p => val.startsWith(p)) && !val.includes('px') && !val.includes('rem') && !val.includes('%');
  };
  
  const isCustomColor = (value?: string) => value && (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl'));

  // 1. Resolve Colors - Fallback to global theme (Respecting Light/Dark mode requests)
  const ALWAYS_LIGHT_VARIANTS = new Set([
    'FeaturesPlumbing', 'ServicesPlumbing2', 'ProcessPlumbing',
    'TestimonialsPlumbing', 'WhyChoosePlumbing',
    'AboutPlumbing', 'AreasPlumbing', 'GuaranteePlumbing', 'FAQPlumbing',
    'HeaderPlumbing',
    // About / Service page light sections — keep them theme-consistent (light)
    'MissionVisionDefault', 'CoreValuesDefault', 'USPDefault',
    'PromiseDefault', 'RelatedServicesDefault', 'AboutServiceConsistent',
    // Contact page light sections
    'ContactInfoDefault', 'ContactFormDefault',
    // Blog page light sections
    'BlogsSearchDefault', 'BlogsListDefault',
    // Blog detail light sections
    'BlogContentDefault', 'BlogAuthorDefault', 'BlogCommentsDefault', 'BlogRelatedDefault',
    // Legal page light section
    'LegalContentDefault',
    // Location page light sections (hero + cta are dark, so not listed)
    'SubLocationsDefault', 'LocationMapDefault',
    'LocationAboutDefault', 'LocationServicesDefault', 'LocationWhyChooseDefault',
    'LocationProcessDefault', 'LocationGuaranteeDefault', 'LocationPromiseDefault',
    'LocationTestimonialsDefault', 'LocationAreasDefault', 'LocationFaqDefault',
    // About page own light sections (cta is dark)
    'AboutWhyChooseDefault', 'AboutFaqDefault',
    // Contact page own light section (cta is dark)
    'ContactFaqDefault',
    // Services listing own light sections (hero + cta dark)
    'ServicesListGridDefault', 'ServicesListWhyChooseDefault', 'ServicesListGuaranteeDefault',
    'ServicesListProcessDefault', 'ServicesListAreasDefault', 'ServicesListFaqDefault',
    // Service Detail own light sections (hero + cta dark)
    'ServiceDetailAboutDefault', 'ServiceDetailServicesDefault', 'ServiceDetailProcessDefault',
    'ServiceDetailWhyChooseDefault', 'ServiceDetailGuaranteeDefault', 'ServiceDetailTestimonialsDefault',
    'ServiceDetailFaqDefault',
  ]);
  const isLight = styles.themeMode === 'light' || ALWAYS_LIGHT_VARIANTS.has((styles as any).variant || '');

  const titleHeadingTag: HeadingTag =
    (styles.titleHeadingTag as HeadingTag) ||
    (type === 'hero' ? 'h1' : 'h2');
  const globalTitleHeading = pickHeadingLevelStyle(globalElementStyles?.headings, titleHeadingTag);
  const globalTitleColor = isLight
    ? (globalTitleHeading.colorLight || globalTitleHeading.color)
    : (globalTitleHeading.color || globalTitleHeading.colorLight);
  const globalTitleHighlight = isLight
    ? (globalTitleHeading.highlightColorLight || globalTitleHeading.highlightColor)
    : (globalTitleHeading.highlightColor || globalTitleHeading.highlightColorLight);
  const resolvedGlobalTitleSize = resolveHeadingFontSize({
    sectionStyles: styles as Record<string, unknown>,
    isHeroTitle: type === 'hero',
    headingTag: titleHeadingTag,
    globalHeadings: globalElementStyles?.headings,
    defaultSizes,
  });

  // Single source of truth: always resolve from ThemeProvider state.
  // Using localStorage here causes stale cross-project colors on refresh.
  const activeGlobalTheme = (themeData as any)?.elements || themeData || PRESET_THEMES[0].elements;
  const activeTypography =
    (themeData as any)?.typography ||
    (PRESET_THEMES[0] as any)?.typography ||
    DEFAULT_TYPOGRAPHY;

  // Typography font families (active by hierarchy: section styles -> design globals -> global theme)
  const resolvedTitleFontFamily =
    styles.titleFontFamily ||
    globalTitleHeading.fontFamily ||
    styles.fontFamily ||
    (activeTypography as any)?.[titleHeadingTag]?.fontFamily ||
    activeTypography?.h1?.fontFamily;

  const resolvedSubtitleFontFamily =
    styles.subtitleFontFamily ||
    styles.fontFamily ||
    activeTypography?.h2?.fontFamily;

  const resolvedDescriptionFontFamily =
    styles.descriptionFontFamily ||
    styles.fontFamily ||
    activeTypography?.p?.fontFamily;

  const resolvedButtonFontFamily =
    styles.buttonFontFamily ||
    styles.fontFamily ||
    activeTypography?.button?.fontFamily;
  
  // Use activeGlobalTheme (already resolved from themeData?.elements or themeData) — NOT themeData directly,
  // because ThemeProvider may return the full { name, elements: {...} } shape where themeData.surface is undefined.
  const activeLight = (activeGlobalTheme as any)?.light || {};
  const defaultBg    = isLight ? (activeLight.surface   || '#FFFFFF') : (activeGlobalTheme?.surface    || '#0E1214');
  const defaultTitle = isLight ? (activeLight.heading   || '#000000') : (activeGlobalTheme?.heading    || '#F8FAFC');
  const defaultText  = isLight ? (activeLight.description || '#333333') : (activeGlobalTheme?.description || '#C7CDD6');

  const resolvedBorderColor =
    styles.borderColor ||
    (isLight ? (activeLight.borderColor || 'rgba(0,0,0,0.1)') : (activeGlobalTheme?.borderColor || activeGlobalTheme?.ring || 'rgba(255,255,255,0.1)'));

  const themeColors = {
      backgroundColor: styles.backgroundColor || defaultBg,
      textColor: styles.textColor || defaultText,
      titleColor: styles.titleColor || globalTitleColor || defaultTitle,
      subtitleColor: styles.subtitleColor || (isLight ? (activeLight.accent || activeGlobalTheme?.accent || '#F59E0B') : defaultText),
      subheadingColor: (styles as any).subheadingColor || (isLight ? (activeLight.subheading || activeLight.accent) : activeGlobalTheme?.subheading) || activeGlobalTheme?.accent || '#F59E0B',
      secondaryHeadingColor: (styles as any).secondaryHeadingColor || globalTitleHighlight || (isLight ? (activeLight.secondaryHeading || activeLight.accent) : activeGlobalTheme?.secondaryHeading) || activeGlobalTheme?.accent || '#E11D48',
      accentColor: styles.accentColor || (isLight ? (activeLight.accent || activeGlobalTheme?.accent) : activeGlobalTheme?.accent) || '#F59E0B',
      buttonBackgroundColor: styles.buttonBackgroundColor || activeGlobalTheme?.primaryButton?.bg || '#E11D48',
      buttonTextColor: styles.buttonTextColor || activeGlobalTheme?.primaryButton?.text || '#FFFFFF',
      // Secondary button
      secondaryButtonBg: (styles as any).secondaryButtonBg || activeGlobalTheme?.secondaryButton?.bg || 'transparent',
      secondaryButtonText: (styles as any).secondaryButtonText || activeGlobalTheme?.secondaryButton?.text || '#F8FAFC',
      secondaryButtonBorder: (styles as any).secondaryButtonBorder || activeGlobalTheme?.secondaryButton?.border || resolvedBorderColor,
      borderColor: resolvedBorderColor,
      accordionBorderColor: (styles as any).accordionBorderColor || resolvedBorderColor,
      accordionQuestionColor: (styles as any).accordionQuestionColor || (isLight ? (activeLight.accordion?.questionColor || defaultTitle) : (activeGlobalTheme?.accordion?.questionColor || defaultTitle)),
      accordionAnswerColor: (styles as any).accordionAnswerColor || (isLight ? (activeLight.accordion?.answerColor || defaultText) : (activeGlobalTheme?.accordion?.answerColor || defaultText)),
      iconColor: styles.iconColor || (isLight ? (activeLight.icon || activeGlobalTheme?.icon) : activeGlobalTheme?.icon) || (isLight ? (activeLight.accent || activeGlobalTheme?.accent) : activeGlobalTheme?.accent) || '#E11D48',
      iconBgColor: styles.iconBgColor || (isLight ? (activeLight.iconBg || activeGlobalTheme?.iconBg) : activeGlobalTheme?.iconBg) || 'rgba(225, 29, 72, 0.1)',
      // Badge
      badgeText: activeGlobalTheme?.badge?.text || '#F8FAFC',
      badgeBackground: activeGlobalTheme?.badge?.background || 'rgba(225, 29, 72, 0.15)',
      // Gradient
      gradientFrom: activeGlobalTheme?.gradient?.from || (isLight ? '#F9FAFB' : '#0E1214'),
      gradientTo: activeGlobalTheme?.gradient?.to || (isLight ? '#FFFFFF' : '#1F2937'),
      // Shadow / trust
      shadowColor: activeGlobalTheme?.shadow || 'rgba(0,0,0,0.35)',
      trustText: activeGlobalTheme?.trust?.text || defaultText,
      trustDot1: activeGlobalTheme?.trust?.dot1 || '#22C55E',
      trustDot2: activeGlobalTheme?.trust?.dot2 || '#3B82F6',
      trustDot3: activeGlobalTheme?.trust?.dot3 || '#F59E0B',
      // Card colors
      cardBackgroundColor: (styles as any).cardBackgroundColor || (isLight ? (activeLight.cardBackground || activeLight.surface || '#FFFFFF') : (activeGlobalTheme?.cardBackground || activeGlobalTheme?.surface || '#131A20')),
      cardBorderColor: (styles as any).cardBorderColor || resolvedBorderColor || (isLight ? (activeLight.cardBorder || 'rgba(0,0,0,0.1)') : (activeGlobalTheme?.cardBorder || 'rgba(255,255,255,0.08)')),
      // Divider / muted
      dividerColor: (styles as any).dividerColor || (isLight ? (activeLight.divider || 'rgba(0,0,0,0.08)') : (activeGlobalTheme?.divider || 'rgba(255,255,255,0.06)')),
      mutedColor: (styles as any).mutedColor || (isLight ? (activeLight.muted || '#6B7280') : (activeGlobalTheme?.muted || '#6B7280')),
      // Link
      linkColor: (styles as any).linkColor || (isLight ? (activeLight.link || activeGlobalTheme?.accent || '#3B82F6') : (activeGlobalTheme?.link || activeGlobalTheme?.accent || '#60A5FA')),
      // Status colors
      successColor: activeGlobalTheme?.success || '#22C55E',
      warningColor: activeGlobalTheme?.warning || '#F59E0B',
      errorColor: activeGlobalTheme?.error || '#EF4444',
      // Form inputs
      inputBgColor: (styles as any).inputBgColor || (isLight ? (activeLight.inputBg || '#F9FAFB') : (activeGlobalTheme?.inputBg || '#1E2733')),
      inputBorderColor: (styles as any).inputBorderColor || (isLight ? (activeLight.inputBorder || 'rgba(0,0,0,0.15)') : (activeGlobalTheme?.inputBorder || 'rgba(255,255,255,0.1)')),
      inputTextColor: (styles as any).inputTextColor || (isLight ? (activeLight.inputText || '#111827') : (activeGlobalTheme?.inputText || '#F8FAFC')),
      inputPlaceholderColor: (styles as any).inputPlaceholderColor || (isLight ? (activeLight.inputPlaceholder || '#9CA3AF') : (activeGlobalTheme?.inputPlaceholder || '#64748B')),
      // Nav / Footer backgrounds
      navBackgroundColor: (styles as any).navBackgroundColor || (isLight ? (activeLight.surface || '#FFFFFF') : (activeGlobalTheme?.navBackground || activeGlobalTheme?.surface || '#0C1015')),
      navBorderColor: (styles as any).navBorderColor || (isLight ? (activeLight.cardBorder || 'rgba(0,0,0,0.08)') : (activeGlobalTheme?.navBorder || 'rgba(255,255,255,0.06)')),
      footerBackgroundColor: (styles as any).footerBackgroundColor || (isLight ? (activeLight.surface || '#F9FAFB') : (activeGlobalTheme?.footerBackground || activeGlobalTheme?.surface || '#080C10')),
      // themeMode indicator
      themeMode: styles.themeMode || 'dark',
      // Overlay — always from active theme so hero sections pick it up without hardcoding
      overlayColor: (styles as any).overlayColor || (isLight ? (activeLight.overlay?.color || activeGlobalTheme?.light?.overlay?.color || '#FFFFFF') : (activeGlobalTheme?.overlay?.color || PRESET_THEMES[0].elements.overlay.color)),
      overlayOpacity: (styles as any).overlayOpacity ?? (styles as any).overlayOpacityValue ?? (isLight ? (activeGlobalTheme?.light?.overlay?.opacity ?? 0.80) : (activeGlobalTheme?.overlay?.opacity ?? 0.80)),
      overlayBlendMode: (styles as any).overlayBlendMode || activeGlobalTheme?.overlay?.blend || 'normal',
      // Typography font families (used by hero components + ElementsSection)
      titleFontFamily: resolvedTitleFontFamily,
      titleFontSize: styles.titleSize || styles.titleFontSize || globalTitleHeading.fontSize || resolvedGlobalTitleSize,
      titleFontWeight: styles.titleFontWeight || globalTitleHeading.fontWeight,
      titleLineHeight: styles.titleLineHeight || globalTitleHeading.lineHeight,
      titleLetterSpacing: styles.titleLetterSpacing || globalTitleHeading.letterSpacing,
      subtitleFontFamily: resolvedSubtitleFontFamily,
      descriptionFontFamily: resolvedDescriptionFontFamily,
      buttonFontFamily: resolvedButtonFontFamily,
      // Feature box tokens from active theme (falls back to theme derivatives if not explicitly defined)
      featureBox: {
        background: activeGlobalTheme?.featureBox?.background || activeGlobalTheme?.cardBackground || activeGlobalTheme?.surface || '#131A20',
        border: activeGlobalTheme?.featureBox?.border || activeGlobalTheme?.cardBorder || activeGlobalTheme?.borderColor || 'rgba(255,255,255,0.08)',
        iconColor: activeGlobalTheme?.featureBox?.iconColor || activeGlobalTheme?.icon || activeGlobalTheme?.accent || '#E11D48',
        iconBg: activeGlobalTheme?.featureBox?.iconBg || activeGlobalTheme?.iconBg || `${activeGlobalTheme?.icon || activeGlobalTheme?.accent || '#E11D48'}15`,
        titleColor: activeGlobalTheme?.featureBox?.titleColor || activeGlobalTheme?.heading || '#F8FAFC',
        textColor: activeGlobalTheme?.featureBox?.textColor || activeGlobalTheme?.description || '#C7CDD6',
      },
      // Always-available light palette — section components that are "always light" use these directly
      light: {
        backgroundColor: activeLight.surface || '#F9FAFB',
        titleColor: activeLight.heading || '#111827',
        textColor: activeLight.description || '#4B5563',
        cardBackgroundColor: activeLight.cardBackground || activeLight.surface || '#FFFFFF',
        cardBorderColor: activeLight.cardBorder || activeLight.borderColor || 'rgba(0,0,0,0.08)',
        accentColor: activeLight.accent || activeGlobalTheme?.accent || '#E11D48',
        iconColor: activeLight.icon || activeLight.accent || '#E11D48',
        iconBgColor: activeLight.iconBg || `${activeLight.accent || '#E11D48'}15`,
        borderColor: activeLight.borderColor || 'rgba(0,0,0,0.08)',
        textColorMuted: activeLight.muted || '#6B7280',
        buttonBackgroundColor: activeGlobalTheme?.primaryButton?.bg || '#E11D48',
        buttonTextColor: activeGlobalTheme?.primaryButton?.text || '#FFFFFF',
        secondaryButtonBg: activeGlobalTheme?.secondaryButton?.bg || 'transparent',
        secondaryButtonText: activeLight.heading || '#111827',
        secondaryButtonBorder: activeLight.accent || activeGlobalTheme?.accent || '#E11D48',
        subheadingColor: activeLight.subheading || activeLight.accent || '#E11D48',
        // Feature box tokens from light palette
        featureBox: {
          background: activeLight.featureBox?.background || activeLight.cardBackground || activeLight.surface || '#FFFFFF',
          border: activeLight.featureBox?.border || activeLight.cardBorder || activeLight.borderColor || 'rgba(0,0,0,0.10)',
          iconColor: activeLight.featureBox?.iconColor || activeLight.icon || activeLight.accent || '#E11D48',
          iconBg: activeLight.featureBox?.iconBg || activeLight.iconBg || `${activeLight.icon || activeLight.accent || '#E11D48'}15`,
          titleColor: activeLight.featureBox?.titleColor || activeLight.heading || '#111827',
          textColor: activeLight.featureBox?.textColor || activeLight.description || '#4B5563',
        },
      },
  };

  /** Variants that paint their own full-bleed background (avoid duplicate SectionRenderer layers). */
  const selfContainedBgVariants = new Set(['HeroPlumbing4']);
  const isSelfContainedBg = selfContainedBgVariants.has(String((styles as any).variant || ''));

  const getBackgroundStyles = (): React.CSSProperties => {
    if (isSelfContainedBg) {
      return { backgroundColor: 'transparent' };
    }

    const bgStyles: React.CSSProperties = {};
    
    if (styles.background) {
      if (styles.background.type === 'color') {
        bgStyles.backgroundColor = styles.background.color || styles.backgroundColor || activeGlobalTheme?.surface || '#000000';
      } else if (styles.background.type === 'gradient') {
        const gradient = styles.background.gradient;
        if (gradient) {
          const stops = gradient.stops.map((stop: any) => `${stop.color} ${stop.position}%`).join(', ');
          if (gradient.type === 'linear') {
            bgStyles.backgroundImage = `linear-gradient(${gradient.direction || 90}deg, ${stops})`;
          } else {
            bgStyles.backgroundImage = `radial-gradient(circle, ${stops})`;
          }
        }
      } else if (styles.background.type === 'image') {
        type BgImageConfig = {
          url?: string;
          mode?: 'single' | 'multiple';
          images?: Array<{ id?: string; url?: string }>;
          carouselSettings?: { enabled?: boolean; autoplay?: boolean; duration?: number; pauseOnHover?: boolean; transitionType?: string; transitionSpeed?: number; buttonVariant?: string };
          position?: string;
          size?: string;
          repeat?: string;
          attachment?: string;
        };
        const imgConfig = (styles.background.image || {}) as BgImageConfig;
        const contentOnlyImageLen = collectSectionImageUrls(
          section.content as Record<string, unknown>,
          {} as Record<string, unknown>
        ).length;
        const imagePoolLen = collectSectionImageUrls(
          section.content as Record<string, unknown>,
          styles as unknown as Record<string, unknown>
        ).length;
        const isCarousel =
          imgConfig.mode === 'multiple' &&
          !!imgConfig.carouselSettings?.enabled &&
          ((Array.isArray(imgConfig.images) && imgConfig.images.length > 0) ||
            contentOnlyImageLen > 0 ||
            imagePoolLen > 0);

        const hasExplicitSingleImage =
          !!((typeof imgConfig.url === 'string' && imgConfig.url.trim()) ||
            (typeof styles.backgroundImage === 'string' && styles.backgroundImage.trim()));
        const hasResolvedImagePool = imagePoolLen > 0;

        if (!isCarousel && (hasExplicitSingleImage || hasResolvedImagePool)) {
          const explicit =
            (typeof imgConfig.url === 'string' && imgConfig.url.trim()) ||
            (typeof styles.backgroundImage === 'string' && styles.backgroundImage.trim()) ||
            undefined;
          const resolved = toDisplayImageUrl(
            resolveSectionImageUrl(section, {
              elementId: `${section.id}-section-background`,
              elementImageUrl: explicit,
            })
          );
          bgStyles.backgroundImage = `url(${resolved})`;
          bgStyles.backgroundPosition = imgConfig.position || styles.backgroundPosition || 'center';
          bgStyles.backgroundSize = imgConfig.size || styles.backgroundSize || 'cover';
          bgStyles.backgroundRepeat = imgConfig.repeat || styles.backgroundRepeat || 'no-repeat';
          bgStyles.backgroundAttachment = imgConfig.attachment || styles.backgroundAttachment || 'scroll';
        }
      }
    } else {
      if (styles.backgroundImage) {
        const resolved = toDisplayImageUrl(
          resolveSectionImageUrl(section, {
            elementId: `${section.id}-section-background`,
            elementImageUrl: styles.backgroundImage,
          })
        );
        bgStyles.backgroundImage = `url(${resolved})`;
        bgStyles.backgroundSize = 'cover';
        bgStyles.backgroundPosition = 'center';
      }
      if (isCustomColor(styles.backgroundColor)) {
        bgStyles.backgroundColor = styles.backgroundColor;
      } else {
        // Fall back to theme surface color if no background is set (including empty string, null, undefined)
        const hasBackground = styles.backgroundColor && styles.backgroundColor.trim() !== '';
        if (!hasBackground && defaultBg) {
          bgStyles.backgroundColor = defaultBg;
        } else if (hasBackground && !isCustomColor(styles.backgroundColor)) {
          // Keep Tailwind class-based backgrounds
          bgStyles.backgroundColor = undefined;
        }
      }
    }
    
    // Fallback chain: saved inline backgroundColor → theme surface
    if (!bgStyles.backgroundColor) {
      bgStyles.backgroundColor = (styles.backgroundColor && isCustomColor(styles.backgroundColor)
        ? styles.backgroundColor
        : null) || defaultBg;
    }
    
    return bgStyles;
  };

  const isFullBleed = styles.maxWidth === 'max-w-full' || 
                     styles.variant?.includes('Modern') || 
                     styles.variant?.includes('Geometric') || 
                     styles.variant?.includes('CrimsonJet') ||
                     styles.variant?.includes('Multicolor') ||
                     styles.variant?.includes('Gradient') ||
                     styles.variant?.includes('Explore') ||
                     styles.variant?.includes('Marquee') ||
                     styles.variant?.includes('About1') ||
                     styles.variant?.includes('ServicesGrid') ||
                     styles.variant === 'HeroPlumbing4';

  const inlineStyles: React.CSSProperties = {
    ...getBackgroundStyles(),
    ...(isCustomColor(styles.textColor) ? { color: styles.textColor } : { color: activeGlobalTheme?.description }),
    // Margins — only apply when explicitly set as a CSS value (not a Tailwind class)
    ...(styles.marginTop    && !isTailwindClass(styles.marginTop)    ? { marginTop:    styles.marginTop }    : {}),
    ...(styles.marginBottom && !isTailwindClass(styles.marginBottom) ? { marginBottom: styles.marginBottom } : {}),
    ...(styles.marginLeft   && !isTailwindClass(styles.marginLeft)   ? { marginLeft:   styles.marginLeft }   : {}),
    ...(styles.marginRight  && !isTailwindClass(styles.marginRight)  ? { marginRight:  styles.marginRight }  : {}),
    // NOTE: No padding on the wrapper — sections manage their own internal padding.
    ...(styles.borderColor ? { borderColor: styles.borderColor } : {}),
    ...(styles.borderWidth ? { borderWidth: styles.borderWidth } : {}),
    ...(styles.borderStyle ? { borderStyle: styles.borderStyle } : {}),
    ...(styles.borderRadius ? { borderRadius: styles.borderRadius } : {}),
    // Minimum height (auto / half / full / custom)
    ...((styles as any).minHeight ? { minHeight: (styles as any).minHeight } : {}),
    // Max-width — only when stored as a CSS dimension (e.g. "1100px" or "100%").
    // Skip when stored as a Tailwind class like "max-w-7xl" — those are handled inside
    // section components' own inner containers.
    ...(typeof styles.maxWidth === 'string' && /^\d+\s*(px|rem|em|%|vw)$/i.test(styles.maxWidth.trim())
      ? { maxWidth: styles.maxWidth, marginLeft: 'auto', marginRight: 'auto' }
      : {}),
  };

  const bgClass = !styles.background && !isCustomColor(styles.backgroundColor) ? styles.backgroundColor : '';
  const textClass = !isCustomColor(styles.textColor) ? styles.textColor : '';
  
  // Only margins on the wrapper — padding is handled inside each section component.
  const spacingClasses = [
      isTailwindClass(styles.marginTop) ? styles.marginTop : '',
      isTailwindClass(styles.marginBottom) ? styles.marginBottom : '',
      isTailwindClass(styles.marginLeft) ? styles.marginLeft : '',
      isTailwindClass(styles.marginRight) ? styles.marginRight : ''
  ].filter(Boolean).join(' ');
  
  // Persistent outline when "show outlines" mode is on and this section isn't
  // actively selected. Uses outline-dashed so it doesn't affect layout (unlike
  // a border) and is dimmed compared to the selected ring for visual hierarchy.
  const outlineClass = !readOnly && showSectionOutlines && !isSelected
    ? 'outline outline-1 outline-dashed outline-blue-500/40 outline-offset-[-4px]'
    : '';
  const selectedClass = !readOnly && isSelected
    ? 'ring-2 ring-white ring-offset-2 ring-offset-black z-10 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
    : '';
  // Responsive visibility — Tailwind breakpoint-prefixed display utilities.
  // sm: ~tablet, lg: ~desktop. Mobile is the default <sm.
  const visibilityClasses = [
    (styles as any).hiddenOnMobile  ? 'max-sm:hidden' : '',
    (styles as any).hiddenOnTablet  ? 'sm:max-lg:hidden' : '',
    (styles as any).hiddenOnDesktop ? 'lg:hidden' : '',
  ].filter(Boolean).join(' ');

  // Custom user-supplied class names (sanitized — string only, spaces preserved)
  const userCustomClass = typeof (styles as any).customClass === 'string'
    ? String((styles as any).customClass).trim()
    : '';

  // Header sits above every other section so its dropdowns can overflow into
  // them. Other sections stay at the default stacking level.
  const stackingClass = type === 'header' ? 'z-[100]' : '';
  const containerClass = `relative group transition-all duration-300 ${stackingClass} ${bgClass} ${textClass} ${spacingClasses} ${visibilityClasses} ${userCustomClass} ${selectedClass} ${outlineClass}`.replace(/\s+/g, ' ').trim();

  const formatColorClass = (prefix: string, val?: string) => {
    if (!val) return '';
    if (val.startsWith('#') || val.startsWith('rgb')) return `${prefix}-[${val}]`;
    return val;
  };

  const btnBg = formatColorClass('bg', styles.buttonBackgroundColor) || 'bg-white';
  const btnText = formatColorClass('text', styles.buttonTextColor) || 'text-black';

  const buttonBase = `${btnBg} ${btnText} px-6 py-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-current/20`;
  
  let borderRadius = 'rounded-lg';
  if (styles.borderRadius) {
      borderRadius = styles.borderRadius; 
  } else if (styles.buttonStyle === 'pill') {
      borderRadius = 'rounded-full';
  } else if (styles.buttonStyle === 'square') {
      borderRadius = 'rounded-none';
  }

  const buttonClass = `${buttonBase} ${borderRadius}`;
  
  const hasCustomSize = styles.titleSize && (styles.titleSize.includes('px') || styles.titleSize.includes('rem') || styles.titleSize.includes('em'));
  const effectiveTitleColor = styles.titleColor || globalTitleColor;
  const titleClass = `font-bold mb-6 ${!isCustomColor(styles.titleColor) && !globalTitleColor ? styles.titleColor || '' : ''}`;
  const titleStyle: React.CSSProperties = {
    ...(effectiveTitleColor && (isCustomColor(effectiveTitleColor) || !!globalTitleColor) ? { color: effectiveTitleColor } : {}),
    ...(hasCustomSize
      ? { fontSize: styles.titleSize }
      : (globalTitleHeading.fontSize || resolvedGlobalTitleSize)
        ? { fontSize: globalTitleHeading.fontSize || resolvedGlobalTitleSize }
        : {}),
    ...(styles.titleTextTransform ? { textTransform: styles.titleTextTransform } : {}),
    ...(styles.titleFontWeight || globalTitleHeading.fontWeight
      ? { fontWeight: styles.titleFontWeight || globalTitleHeading.fontWeight }
      : {}),
    ...(styles.titleLineHeight || globalTitleHeading.lineHeight
      ? { lineHeight: styles.titleLineHeight || globalTitleHeading.lineHeight }
      : {}),
    ...(styles.titleLetterSpacing || globalTitleHeading.letterSpacing
      ? { letterSpacing: styles.titleLetterSpacing || globalTitleHeading.letterSpacing }
      : {}),
    fontFamily: resolvedTitleFontFamily,
  };

  const hasSubtitleCustomSize = styles.subtitleSize && (styles.subtitleSize.includes('px') || styles.subtitleSize.includes('rem') || styles.subtitleSize.includes('em'));
  const subtitleStyle: React.CSSProperties = {
    ...(isCustomColor(styles.subtitleColor) ? { color: styles.subtitleColor } : {}),
    ...(hasSubtitleCustomSize ? { fontSize: styles.subtitleSize } : {}),
    ...(styles.subtitleTextTransform ? { textTransform: styles.subtitleTextTransform } : {}),
    fontFamily: resolvedSubtitleFontFamily,
  };

  const hasDescriptionCustomSize = styles.descriptionSize && (styles.descriptionSize.includes('px') || styles.descriptionSize.includes('rem') || styles.descriptionSize.includes('em'));
  const descriptionStyle: React.CSSProperties = {
    ...(isCustomColor(styles.descriptionColor) ? { color: styles.descriptionColor } : {}),
    ...(hasDescriptionCustomSize ? { fontSize: styles.descriptionSize } : {}),
    ...(styles.descriptionTextTransform ? { textTransform: styles.descriptionTextTransform } : {}),
    fontFamily: resolvedDescriptionFontFamily,
  };

  const buttonStyle: React.CSSProperties = {
    fontFamily: resolvedButtonFontFamily,
  };

  const isFixedSection = type === 'navbar' || type === 'footer' || type === 'header';

  // MATCH WEBSITE MULTICOLOR THEME: Two-layer overlay system (gradient + solid color)
  const getOverlayStyles = (): { 
    gradientOverlay: React.CSSProperties | null, 
    colorOverlay: React.CSSProperties | null 
  } => {
    if (isSelfContainedBg) {
      return { gradientOverlay: null, colorOverlay: null };
    }

    // 1. Primary Source: Unified Background Object
    const bgAny = styles.background as any;
    const bgOverlay = (styles.background?.type === 'image'
      ? styles.background?.image?.overlay
      : bgAny?.overlay) || bgAny?.overlay || styles.background?.image?.overlay;
    
    // 2. Secondary Source: Legacy Flat Properties
    const legacyColor = styles.overlayColor;
    const legacyOpacity = styles.overlayOpacityValue !== undefined ? styles.overlayOpacityValue : styles.overlayOpacity;
    const legacyBlend = styles.overlayBlendMode;
    
    // 3. Determine original color to check for ghost states FIRST
    const originalColor = bgOverlay?.color || legacyColor;
    let overlayColor = originalColor;
    const isGhostColor = !originalColor || originalColor === 'transparent' || originalColor === '#000000' || originalColor.replace(/\s/g, '') === 'rgba(0,0,0,0)' || originalColor.includes(', 0)');
    
    const activeThemeOverlay = activeGlobalTheme?.overlay;
    const activeThemeOverlayColor = activeThemeOverlay?.color || PRESET_THEMES[0].elements.overlay.color;

    // If the saved DB color exactly matches the theme, it's a legacy theme save. We treat it like a ghost color to ensure it stays fully synced and visually enabled.
    const isThemeMatch = originalColor && originalColor.toLowerCase() === activeThemeOverlayColor.toLowerCase();

    // 4. Determine if we should skip the overlay for color backgrounds
    // We are more strict now: if type is 'color', it IS a color background regardless of leftover backgroundImage
    const isColorBg = styles.background
      ? (styles.background.type === 'color')
      : (!styles.backgroundImage || styles.backgroundImage === '' || !!styles.backgroundColor);

    const hasImage = styles.background
      ? styles.background.type === 'image'
      : !!styles.backgroundImage && styles.backgroundImage !== '';

    const isExplicitlyEnabled = bgOverlay?.enabled === true;
    const isExplicitlyDisabled = bgOverlay?.enabled === false;

    // Hard skip: when bg type is explicitly 'color', NEVER render overlay.
    // (Sidebar hides the overlay UI in color mode too — render-side matches.)
    if (styles.background?.type === 'color') {
      return { gradientOverlay: null, colorOverlay: null };
    }

    // Overlays are primarily for images/gradients.
    // For solid colors / no-image legacy state, default to NONE unless explicitly enabled.
    if ((isColorBg || !hasImage) && !isExplicitlyEnabled) {
      return { gradientOverlay: null, colorOverlay: null };
    }

    // 5. Exit early if explicitly disabled.
    // We HONOUR explicit disablement above all else.
    if (isExplicitlyDisabled) {
      return { gradientOverlay: null, colorOverlay: null };
    }

    // 6. Resurrection Logic: Only resurrect if we have an image AND the color is "ghostly" (broken/default)
    // We don't resurrect for color backgrounds (handled above)
    const requiresResurrection = hasImage && isGhostColor;

    if (isGhostColor && !requiresResurrection) {
       // If it's a ghost color but doesn't require resurrection (e.g. no image), we just hide it
       return { gradientOverlay: null, colorOverlay: null };
    }

    // 7. Auto-fix broken transparent colors OR legacy pure black (#000000) from old database saves
    if (requiresResurrection) {
        overlayColor = activeThemeOverlayColor;
    }

    const blendMode = bgOverlay?.blendMode || legacyBlend || activeThemeOverlay?.blend || PRESET_THEMES[0].elements.overlay.blend;

    // 5. Calculate correct Opacity
    let rawOpacityStr = bgOverlay?.opacity !== undefined ? bgOverlay.opacity : (legacyOpacity !== undefined ? legacyOpacity : activeThemeOverlay?.opacity);
    let finalOpacity: number | undefined = PRESET_THEMES[0].elements.overlay.opacity;

    // If we intercepted a broken color, we MUST intercept the opacity as well to prevent legacy 0.5 from overriding the theme's perfect glass opacity
    if (isGhostColor) {
        rawOpacityStr = activeThemeOverlay?.opacity ?? PRESET_THEMES[0].elements.overlay.opacity;
    }

    if (rawOpacityStr !== undefined && rawOpacityStr !== '') {
      const parsedOpacity = typeof rawOpacityStr === 'string' ? parseFloat(rawOpacityStr) : rawOpacityStr;
      finalOpacity = parsedOpacity > 1 ? parsedOpacity / 100 : parsedOpacity;
    }
    
    // Layer 1: Gradient overlay (Removed: Was causing a double-dimming bug by forcing 100% opacity gradients over all images)
    const gradientOverlay = null;
    
    // Layer 2: Solid color overlay
    let finalBackgroundColor = overlayColor;
    // Strip rgba alpha if we are explicitly controlling it via CSS opacity to avoid double-dimming
    if (finalOpacity !== undefined && finalBackgroundColor.includes('rgba')) {
      finalBackgroundColor = finalBackgroundColor.replace(/rgba\((.*?),\s*[\d.]+\)/, 'rgb($1)');
    }

    const colorOverlay: React.CSSProperties = {
      backgroundColor: finalBackgroundColor,
      mixBlendMode: blendMode as any, // CRITICAL: Ensure blend mode applies to the color layer
      position: 'absolute' as const,
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none' as const
    };

    // CRITICAL: Apply explicit opacity if the user set one in the builder
    if (finalOpacity !== undefined) {
      colorOverlay.opacity = finalOpacity;
    }
    
    return { gradientOverlay, colorOverlay };
  };

  const overlays = getOverlayStyles();

  const renderContent = () => {
    return (
      <SectionRouter
        section={displaySection}
        onTextEdit={handleTextEdit}
        onImageClick={handleImageClick}
        onLinkEdit={handleLinkEdit}
        onLogoClick={handleLogoClick}
        onItemEdit={handleItemEdit}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSectionUpdate={onUpdate}
        onUpload={onUpload}
        onElementUpdate={handleElementUpdate}
        onElementSelect={onElementSelect}
        selectedElementId={selectedElementId}
        buttonClass={buttonClass}
        isSelected={isSelected}
        titleClass={titleClass}
        titleStyle={titleStyle}
        subtitleStyle={subtitleStyle}
        descriptionStyle={descriptionStyle}
        buttonStyle={buttonStyle}
        themeColors={themeColors}
        readOnly={readOnly}
        sitePathname={sitePathname}
        sitePageType={sitePageType}
      />
    );
  };

  const enableGeometry = styles.enableGeometry !== undefined ? styles.enableGeometry : (styles.variant === 'HeroGeometric');

  const carouselModeOn =
    styles.background?.type === 'image' &&
    styles.background.image?.mode === 'multiple' &&
    !!styles.background.image?.carouselSettings?.enabled;
  const styleCarouselImages = (styles.background?.image?.images || []) as Array<{ id?: string; url?: string }>;
  /** `content.images` only — beats template `styles.background.image.images` for carousel */
  const contentOnlyCarouselUrls = collectSectionImageUrls(
    section.content as Record<string, unknown>,
    {} as Record<string, unknown>
  );
  const carouselPoolUrls = collectSectionImageUrls(
    section.content as Record<string, unknown>,
    styles as unknown as Record<string, unknown>
  );
  const isCarouselRender =
    carouselModeOn &&
    (contentOnlyCarouselUrls.length > 0 ||
      styleCarouselImages.length > 0 ||
      carouselPoolUrls.length > 0);
  const carouselSlidesForRender: Array<{ id: string; url: string }> = isCarouselRender
    ? contentOnlyCarouselUrls.length > 0
      ? contentOnlyCarouselUrls.map((url, i) => ({
          id: `bg-carousel-${section.id}-${i}`,
          url: toDisplayImageUrl(url),
        }))
      : styleCarouselImages.length > 0
        ? styleCarouselImages.map((img, i) => ({
            id: String(img.id || `bg-carousel-${section.id}-${i}`),
            url: toDisplayImageUrl(img.url || ''),
          }))
        : carouselPoolUrls.map((url, i) => ({
            id: `bg-carousel-${section.id}-${i}`,
            url: toDisplayImageUrl(url),
          }))
    : [];

  // Reveal animation — wrap section in motion.div when set
  const revealPreset: string = (styles as any).revealAnimation || '';
  const revealDelay = Number((styles as any).revealDelay) || 0;
  const revealVariants: Record<string, { initial: any; animate: any }> = {
    'fade-up':     { initial: { opacity: 0, y: 32 },                 animate: { opacity: 1, y: 0 } },
    'slide-left':  { initial: { opacity: 0, x: -48 },                animate: { opacity: 1, x: 0 } },
    'slide-right': { initial: { opacity: 0, x: 48 },                 animate: { opacity: 1, x: 0 } },
    'blur-in':     { initial: { opacity: 0, filter: 'blur(12px)' },  animate: { opacity: 1, filter: 'blur(0px)' } },
    'scale-in':    { initial: { opacity: 0, scale: 0.95 },           animate: { opacity: 1, scale: 1 } },
    'zoom':        { initial: { opacity: 0, scale: 1.06 },           animate: { opacity: 1, scale: 1 } },
  };
  const revealVar = revealVariants[revealPreset];
  const hasReveal = !!revealVar && !readOnly; // reveal in GenieBuild preview only — live site uses plain div
  // Anchor id for scroll-to-section nav (e.g. /page#features)
  const anchorId = (styles as any).anchorId
    ? String((styles as any).anchorId).trim().replace(/\s+/g, '-').toLowerCase()
    : undefined;

  // Semantic HTML5 element per section type. Using the right outer tag
  // (header/nav/footer/section) is a free SEO + a11y win — screen readers
  // and crawlers use these landmarks to understand page structure. Anything
  // we don't have an explicit role for falls through to <section>.
  const SectionTag: any = (
    type === 'header' ? 'header' :
    type === 'navbar' ? 'nav' :
    type === 'footer' ? 'footer' :
    'section'
  );

  const sectionInnerJsx = (
    <SectionTag
      className={containerClass}
      style={inlineStyles}
      data-section-id={section.id}
      id={anchorId || undefined}
    >
      {/* Select Section Button — hover-only on the canvas. The button is the
          escape hatch for clicking the section background; selected sections
          already have a visible ring, so we don't need to broadcast it always. */}
      {!readOnly && (
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className={`absolute top-3 left-3 z-50 transition-opacity duration-150 bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-lg shadow-xl flex items-center justify-center border border-blue-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
          title="Select section"
          aria-label={`Select ${section.type} section`}
        >
          <i className="fa-solid fa-layer-group text-xs" aria-hidden="true"></i>
        </button>
      )}
      {/* Background Carousel */}
      {isCarouselRender && carouselSlidesForRender.length > 0 && (
        <BackgroundCarousel
          images={carouselSlidesForRender}
          settings={styles.background!.image!.carouselSettings || {}}
          styles={styles}
        />
      )}

      {/* Background overlay - Layer 1: Gradient (like website multicolor theme) */}
      {overlays.gradientOverlay && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={overlays.gradientOverlay}
        ></div>
      )}
      
      {/* Background overlay - Layer 2: Solid Color (like website multicolor theme) */}
      {overlays.colorOverlay && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={overlays.colorOverlay}
        ></div>
      )}
      
      {/* Geometry overlay */}
      {enableGeometry && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
        </div>
      )}
      
      {isSelected && !readOnly && type !== 'header' && (
        <div className="absolute top-3 right-3 z-50 flex items-center space-x-2 bg-black/90 backdrop-blur-md p-1.5 rounded-lg shadow-2xl border border-white/10 font-sans">
            <div className="px-3 text-[10px] font-black uppercase tracking-widest text-white">Section {type}</div>

            {!isFixedSection && (
                <>
                <button onClick={(e) => { e.stopPropagation(); onMoveUp(section.id); }} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors" title="Move Up" aria-label="Move section up">
                <i className="fa-solid fa-arrow-up text-xs" aria-hidden="true"></i>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onMoveDown(section.id); }} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors" title="Move Down" aria-label="Move section down">
                <i className="fa-solid fa-arrow-down text-xs" aria-hidden="true"></i>
                </button>
                </>
            )}

            {onDuplicate && (
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(section.id); }}
                className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-blue-400 transition-colors"
                title="Duplicate Section"
                aria-label="Duplicate section"
              >
                <i className="fa-solid fa-clone text-xs" aria-hidden="true"></i>
              </button>
            )}

            <div className="w-px h-6 bg-white/20 mx-1" aria-hidden="true"></div>

            <button
              onClick={(e) => { e.stopPropagation(); onDelete(section.id); }}
              className="bg-red-500/10 text-red-500 p-2 rounded-md hover:bg-red-500 hover:text-white transition-all"
              title="Delete Section"
              aria-label="Delete section"
            >
               <i className="fa-solid fa-trash-can text-xs"></i>
            </button>
        </div>
      )}
      
      {/* Decorative effects: background shapes + top/bottom dividers — works for ALL section types */}
      <SectionEffectsLayer styles={styles} theme={activeGlobalTheme} />

      {/* Ensure content sits above the background and overlays */}
      <div className="relative z-10 w-full h-full" data-section-content={section.id}>
        <SectionErrorBoundary
          sectionType={section.type}
        >
          {renderContent()}
        </SectionErrorBoundary>
      </div>
    </SectionTag>
  );

  // Wrap with motion.div for reveal animation in preview mode only.
  // In builder we skip the wrapper so editing isn't disrupted by transitions.
  if (hasReveal) {
    return (
      <AnimatedDiv
        enabled={!readOnly}
        initial={revealVar!.initial}
        whileInView={revealVar!.animate}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: revealDelay, ease: [0.16, 1, 0.3, 1] }}
      >
        {sectionInnerJsx}
      </AnimatedDiv>
    );
  }
  return sectionInnerJsx;
};

export default SectionRenderer;