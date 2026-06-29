'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Phone, Wrench, Clock, Star, Shield } from 'lucide-react';
// Step 4: Code Splitting - Keep above-the-fold components loaded immediately
import Header from '@/themes/multicolor/components/Header';
import HeroSection from '@/themes/multicolor/components/HeroSection';

// Step 4: Code Splitting - Lazy load below-the-fold components for better performance
const AboutSection = lazy(() => import('@/themes/multicolor/components/AboutSection'));
const ServicesSection = lazy(() => import('@/themes/multicolor/components/ServicesSection'));
const Footer = lazy(() => import('@/themes/multicolor/components/Footer'));
import { httpFile } from "@/config";
import DynamicIcon from '@/extras/DynamicIcon';
import { useTheme } from '@/themes/multicolor/contexts/ThemeContext';
import { getProjectId } from '@/hooks/getProjectId';
import { useHomePageData } from '@/app/hooks/useHomePageData';

// Lazy load heavy components
const BookingSection = lazy(() => import('@/themes/multicolor/components/BookingSection'));
const WhyChooseUsSection = lazy(() => import('@/themes/multicolor/components/WhyChooseUsSection'));
const ProcessSection = lazy(() => import('@/themes/multicolor/components/ProcessSection'));
const TestimonialsSection = lazy(() => import('@/themes/multicolor/components/TestimonialsSection'));
const GuaranteeSection = lazy(() => import('@/themes/multicolor/components/GuaranteeSection'));
const AreasSection = lazy(() => import('@/themes/multicolor/components/AreasSection'));
const FAQSection = lazy(() => import('@/themes/multicolor/components/FAQSection'));
const SchemaMarkup = lazy(() => import('@/themes/multicolor/components/SchemaMarkup'));
const PageSchemaMarkup = lazy(() => import('@/themes/multicolor/components/PageSchemaMarkup'));
const ProcessSchemaMarkup = lazy(() => import('@/themes/multicolor/components/ProcessSchemaMarkup'));
const WebVitals = lazy(() => import('@/themes/multicolor/components/WebVitals'));

interface Feature {
  serialno: number;
  iconName: string;
  title: string;
  subtitle: string;
}

interface HomePageClientProps {
  initialData?: {
    projectInfo?: any;
    aboutUs?: any;
  } | null;
}

const HomePageClient = ({ initialData }: HomePageClientProps) => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const pathname = usePathname();
  const router = useRouter();
  
  // Step 3: API Caching - Use React Query hook with SSR data
  const { data: cachedData, isLoading: isQueryLoading } = useHomePageData({ 
    initialData,
    projectId: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('siteId') : null
  });
  
  // Step 1: SSR - Initialize state from server-side data if available
  const processData = (data: any) => {
    if (!data) return;
    
    const info = data?.projectInfo || {};
    const about = data?.aboutUs || {};
    
    setCTA(info.cta || []);
    const imageUrl = info.images?.[2]?.url || "";
    setBackgroundImage(imageUrl);
    setProjectCategory(info.serviceType || '');
    setWelcomeLine(info.welcomeLine || '');
    setPhoneNumber(about.phone || '');
    
    // Split heroHeading intelligently
    const words = info.heroHeading?.split(' ') || [];
    
    if (words.length > 3) {
      let breakIndex = -1;
      for (let i = 0; i < words.length; i++) {
        if (conjunctions.includes(words[i].toLowerCase())) {
          breakIndex = i;
          break;
        }
      }
      
      if (breakIndex !== -1) {
        setHeroHeadingPart1(words.slice(0, breakIndex + 1).join(' ') || '');
        setHeroHeadingPart2(words.slice(breakIndex + 1).join(' ') || '');
      } else {
        setHeroHeadingPart1(words.slice(0, words.length - 2).join(' ') || '');
        setHeroHeadingPart2(words.slice(-2).join(' ') || '');
      }
    } else {
      if (words.length === 3) {
        setHeroHeadingPart1(words.slice(0, 1).join(' ') || '');
        setHeroHeadingPart2(words.slice(1).join(' ') || '');
      } else {
        setHeroHeadingPart1(words.slice(0, 1).join(' ') || '');
        setHeroHeadingPart2(words.slice(1).join(' ') || '');
      }
    }
    
    setProjectSlogan(info.projectSlogan || `Professional ${info.serviceType}`);
    
    const strip = (s: any) =>
      typeof s === 'string'
        ? s.trim().replace(/^[,\"\s]+|[,\"\s]+$/g, '')
        : '';
    
    const modifiedFeatures = (info.featuresSection || []).map((f: any) => ({
      serialno: f.serialno,
      iconName: strip(f.iconName),
      title: strip(f.title),
      subtitle: strip(f.subtitle),
    }));
    
    setFeatures(modifiedFeatures);
  };

  const [projectCategory, setProjectCategory] = useState("");
  const [CTA, setCTA] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [welcomeLine, setWelcomeLine] = useState('');
  const [projectSlogan, setProjectSlogan] = useState('');
  let [features, setFeatures] = useState<Feature[]>([]);
  // Skeleton Loading Fix: Always start with loading state, even with SSR data (for better UX)
  const [isLoading, setIsLoading] = useState(true);
  const [heroHeadingPart1, setHeroHeadingPart1] = useState('');
  const [heroHeadingPart2, setHeroHeadingPart2] = useState('');

  const conjunctions = [
    'and', 'or', 'but', 'with', 'for', 'as', 'because', 'so', 'then', 'by', 'on', 'at',
    'in', 'of', 'to', 'from', 'about', 'through', 'between', 'during', 'before', 'after'
  ];

  // Get projectId from URL params first, then fallback to getProjectId()
  const getCurrentProjectId = () => {
    if (typeof window !== 'undefined') {
      // Priority 1: URL search params (most immediate)
      const urlParams = new URLSearchParams(window.location.search);
      const siteIdFromUrl = urlParams.get('siteId');
      if (siteIdFromUrl) {
        localStorage.setItem('currentSiteId', siteIdFromUrl);
        return siteIdFromUrl;
      }
    }
    // Priority 2: getProjectId() hook (checks localStorage and env)
    return getProjectId();
  };

  // Step 3: API Caching - Process data from React Query cache or SSR
  // Skeleton Loading Fix: Show skeleton briefly even with SSR data for better UX
  useEffect(() => {
    // Step 3: Priority 1 - Use cached data from React Query (if available)
    const dataToProcess = cachedData || initialData;
    
    if (dataToProcess) {
      processData(dataToProcess);
      // Show skeleton for at least 200ms for better perceived performance
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    } else if (isQueryLoading) {
      // Step 3: React Query is fetching, show loading
      setIsLoading(true);
    } else {
      // No data and not loading, keep loading state
      setIsLoading(true);
    }
  }, [cachedData, initialData, isQueryLoading]); // Update when cache or SSR data changes

  // Step 2: Mobile Image Optimization - Preload LCP image immediately with SSR/cached data
  // Mobile LCP Fix: Preload image as soon as component mounts (works with SSR/cached data)
  useEffect(() => {
    // Step 2 & 3: Extract image URL from cached data, SSR data, or state
    const imageUrl = cachedData?.projectInfo?.images?.[2]?.url || 
                     initialData?.projectInfo?.images?.[2]?.url || 
                     backgroundImage;
    
    if (imageUrl) {
      // Check if preload link already exists
      const existingPreload = document.querySelector(`link[rel="preload"][href="${imageUrl}"]`);
      
      if (!existingPreload) {
        // Step 2: Mobile LCP Fix - Create preload link with highest priority
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = imageUrl;
        preloadLink.setAttribute('fetchpriority', 'high');
        preloadLink.crossOrigin = 'anonymous';
        // Step 2: Mobile optimization - Add media attribute for mobile devices
        preloadLink.setAttribute('media', '(max-width: 768px)');
        // Insert at the very beginning for highest priority
        const firstChild = document.head.firstChild;
        if (firstChild) {
          document.head.insertBefore(preloadLink, firstChild);
        } else {
          document.head.appendChild(preloadLink);
        }
      }
    }
  }, [cachedData, initialData, backgroundImage]); // Run when cached/SSR data or backgroundImage changes

  // Step 3: API Caching - React Query handles fetching and caching automatically
  // No need for manual fetch - React Query will use SSR data as initial data
  // and cache it for 5 minutes (configured in providers.tsx)

  const getCTAContent = (index: number) => {
    if (CTA.length === 0) {
      return { title: "What are you waiting for?", description: "Contact us for our services" };
    }
    return CTA[index] || CTA[0];
  };

  return (
    <div className="min-h-screen font-poppins">
        {/* Step 4: Code Splitting - Lazy load non-critical components (SEO/analytics) */}
        <Suspense fallback={null}>
          <WebVitals />
          <SchemaMarkup />
          <PageSchemaMarkup
            pageType="home"
            pageTitle={projectSlogan || `Professional ${projectCategory} Services`}
            pageDescription={welcomeLine || `Professional ${projectCategory} services available 24/7. Expert technicians with fast response times.`}
          />
          <ProcessSchemaMarkup />
        </Suspense>
        <Header />

        {/* Modern Hero Section - Mobile CLS Fix: Fixed dimensions to prevent layout shift */}
        <section
          id="home"
          className="relative min-h-screen flex items-center justify-center overflow-hidden py-8 sm:py-12 lg:py-16 pb-16 sm:pb-20 lg:pb-24"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: colors.surface
          }}
        >
          {/* Dynamic Gradient Overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`,
              mixBlendMode: colors.overlay.blend as any
            }}
          ></div>
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: colors.overlay.color
            }}
          ></div>
          
          {/* Animated Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: `${colors.primaryButton.bg}40` }}></div>
            <div className="absolute top-40 right-20 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: `${colors.accent}30`, animationDelay: '1s' }}></div>
            <div className="absolute bottom-32 left-1/4 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: `${colors.primaryButton.bg}50`, animationDelay: '2s' }}></div>
            <div className="absolute bottom-20 right-1/3 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: `${colors.accent}40`, animationDelay: '3s' }}></div>
          </div>

          {/* Hero Content */}
          <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div 
                className="text-center lg:text-left space-y-6 relative z-20"
              >
                
                {isLoading ? (
                  /* Skeleton Loading - Maintains natural spacing */
                  <>
                    {/* Badge Skeleton */}
                    <div className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-2.5 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-white/50"></div>
                      <div className="h-4 w-32 bg-white/50 rounded"></div>
                    </div>

                    {/* Heading Skeleton */}
                    <div className="space-y-2">
                      <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-full max-w-2xl bg-white/50 rounded animate-pulse"></div>
                      <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-3/4 max-w-xl bg-white/40 rounded animate-pulse"></div>
                    </div>

                    {/* Subheading Skeleton */}
                    <div className="space-y-2 max-w-3xl mx-auto lg:mx-0">
                      <div className="h-4 sm:h-5 md:h-6 lg:h-7 w-full bg-white/50 rounded animate-pulse"></div>
                      <div className="h-4 sm:h-5 md:h-6 lg:h-7 w-5/6 bg-white/40 rounded animate-pulse"></div>
                      <div className="h-4 sm:h-5 md:h-6 lg:h-7 w-4/6 bg-white/30 rounded animate-pulse"></div>
                    </div>

                    {/* CTA Buttons Skeleton */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">
                      <div className="h-12 w-40 sm:w-44 bg-white/50 rounded-xl animate-pulse"></div>
                      <div className="h-12 w-44 sm:w-48 bg-white/40 rounded-xl animate-pulse"></div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Badge - Same structure as skeleton */}
                    <div 
                      className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-2.5"
                      style={{
                        backgroundColor: `${colors.primaryButton.bg}20`,
                        border: `1px solid ${colors.primaryButton.bg}40`
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: colors.primaryButton.bg }}
                      ></div>
                      <span 
                        className="font-semibold text-sm tracking-wide"
                        style={{ color: colors.heading }}
                      >
                        {projectSlogan}
                      </span>
                    </div>

                    {/* Main Heading */}
                    <h1 
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight"
                    >
                      <span style={{ color: colors.heading }}>
                        {heroHeadingPart1}
                      </span>{' '}
                      <span 
                        className="inline-block"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`,
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {heroHeadingPart2}
                      </span>
                    </h1>

                    {/* Subheading */}
                    <p 
                      className="text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto lg:mx-0 leading-relaxed"
                      style={{ 
                        color: colors.description
                      }}
                    >
                      {welcomeLine}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">
                      
                      {/* Call Button */}
                      <a
                        href={`tel:${phoneNumber}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300"
                        style={{
                          backgroundColor: colors.primaryButton.bg,
                          color: colors.primaryButton.text
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
                      >
                        <Phone className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-xs opacity-90">Call Now</div>
                          <div className="text-sm font-bold">{phoneNumber}</div>
                        </div>
                      </a>

                      {/* Get Estimate Button */}
                      <button
                        onClick={() => router.push('/contact')}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300"
                        style={{
                          backgroundColor: colors.secondaryButton.bg,
                          color: colors.secondaryButton.text,
                          border: `2px solid ${colors.secondaryButton.border}`
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondaryButton.hover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.secondaryButton.bg}
                      >
                        <Wrench className="w-5 h-5" />
                        <span>Get Free Estimate</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Trust Indicators */}
                <div 
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-8"
                  style={{ color: colors.description }}
                >
                  <div className="flex items-center gap-2">
                    <Shield 
                      className="w-5 h-5" 
                      style={{ color: colors.accent }}
                    />
                    <span className="text-sm font-medium">Licensed & Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star 
                      className="w-5 h-5 fill-current" 
                      style={{ color: colors.accent }}
                    />
                    <span className="text-sm font-medium">5-Star Rated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock 
                      className="w-5 h-5" 
                      style={{ color: colors.accent }}
                    />
                    <span className="text-sm font-medium">24/7 Available</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-16 md:h-24" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-background"/>
            </svg>
          </div>
        </section>

        {/* Step 4: Code Splitting - Lazy load below-the-fold sections with skeleton */}
        <Suspense fallback={
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="max-w-4xl mx-auto">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse w-2/3 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                </div>
              </div>
            </div>
          </section>
        }>
          <AboutSection />
        </Suspense>

        {/* Features Section - Skeleton Loading for all states */}
        <section className="py-16 bg-gray-50" style={{ contain: 'layout style' }}>
          <div className="container mx-auto px-4 sm:px-8 lg:px-16" style={{ contain: 'layout style' }}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Skeleton Loading - Show when loading or no features */}
              {(isLoading || features.length === 0) ? (
                // Detailed skeleton for features section
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-8 shadow-lg" style={{ minHeight: '256px' }}>
                    <div className="space-y-5">
                      {/* Icon Skeleton */}
                      <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse"></div>
                      {/* Title Skeleton */}
                      <div className="space-y-3">
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                features.map((f, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl"
                  style={{
                    border: `1px solid ${colors.primaryButton.bg}15`
                  }}
                >
                  <div className="relative space-y-5">
                    <div className="w-fit">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                        style={{
                          backgroundColor: `${colors.primaryButton.bg}15`,
                          border: `2px solid ${colors.primaryButton.bg}30`
                        }}
                      >
                        <DynamicIcon
                          iconName={f.iconName}
                          className="w-8 h-8 transition-transform duration-500 group-hover:rotate-12"
                          style={{ color: colors.primaryButton.bg }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold leading-tight text-gray-900">
                        {f.title}
                      </h3>
                      <p className="text-base leading-relaxed text-gray-600">
                        {f.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Step 4: Code Splitting - Lazy load ServicesSection with skeleton */}
        <Suspense fallback={
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="text-center mb-12">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mx-auto mb-4"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse w-64 mx-auto"></div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="h-48 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }>
          <ServicesSection />
        </Suspense>

        {/* Step 4: Code Splitting - CTA Sections with detailed skeleton loading */}
        <Suspense fallback={
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="text-center mb-12">
                <div className="h-10 bg-gray-200 rounded animate-pulse w-64 mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-96 mx-auto"></div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }>
          <WhyChooseUsSection />
        </Suspense>

        <Suspense fallback={
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="text-center mb-12">
                <div className="h-10 bg-gray-200 rounded animate-pulse w-56 mx-auto mb-4"></div>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }>
          <ProcessSection />
        </Suspense>

        <Suspense fallback={
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="text-center mb-12">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-40 mx-auto mb-4"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse w-80 mx-auto"></div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-8 shadow-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse mx-auto mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }>
          <GuaranteeSection />
        </Suspense>

        <Suspense fallback={
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="text-center mb-12">
                <div className="h-10 bg-gray-200 rounded animate-pulse w-64 mx-auto"></div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }>
          <TestimonialsSection />
        </Suspense>

        <Suspense fallback={
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="text-center mb-12">
                <div className="h-10 bg-gray-200 rounded animate-pulse w-56 mx-auto"></div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-6">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }>
          <AreasSection />
        </Suspense>

        <Suspense fallback={
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="text-center mb-12">
                <div className="h-10 bg-gray-200 rounded animate-pulse w-48 mx-auto"></div>
              </div>
              <div className="max-w-3xl mx-auto space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }>
          <FAQSection />
        </Suspense>

        {/* Step 4: Code Splitting - Lazy load Footer with skeleton */}
        <Suspense fallback={
          <footer className="bg-gray-900 text-white py-16">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-6 bg-gray-800 rounded animate-pulse w-32"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-800 rounded animate-pulse w-full"></div>
                      <div className="h-4 bg-gray-800 rounded animate-pulse w-5/6"></div>
                      <div className="h-4 bg-gray-800 rounded animate-pulse w-4/6"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-gray-800">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2 mx-auto"></div>
              </div>
            </div>
          </footer>
        }>
          <Footer />
        </Suspense>
      </div>
  );
};

export default HomePageClient;

