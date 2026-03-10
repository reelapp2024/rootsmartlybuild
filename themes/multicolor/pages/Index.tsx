
'use client';

import React, { useEffect, useState, useLayoutEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
// @ts-ignore - react-helmet-async may not be installed
import { Helmet, HelmetProvider } from 'react-helmet-async';

import { Phone, Clock, Star, Shield, Award, CheckCircle, Zap, Users, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import ServicesSection from '../components/ServicesSection';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { httpFile } from "@/config";
import { useSEO } from '../../../hooks/useSEO';
import DynamicIcon from '../../../extras/DynamicIcon';
import { useTheme } from '../contexts/ThemeContext';
import { getProjectId } from '../../../hooks/getProjectId';

// Lazy load heavy components
const BookingSection = lazy(() => import('../components/BookingSection'));
const WhyChooseUsSection = lazy(() => import('../components/WhyChooseUsSection'));
const ProcessSection = lazy(() => import('../components/ProcessSection'));
const TestimonialsSection = lazy(() => import('../components/TestimonialsSection'));
const GuaranteeSection = lazy(() => import('../components/GuaranteeSection'));
const AreasSection = lazy(() => import('../components/AreasSection'));
const FAQSection = lazy(() => import('../components/FAQSection'));
const SchemaMarkup = lazy(() => import('../components/SchemaMarkup'));
const PageSchemaMarkup = lazy(() => import('../components/PageSchemaMarkup'));
const TestimonialsSchemaMarkup = lazy(() => import('../components/TestimonialsSchemaMarkup'));
const ProcessSchemaMarkup = lazy(() => import('../components/ProcessSchemaMarkup'));
const WebVitals = lazy(() => import('../components/WebVitals'));

interface Feature {
  serialno: number;
  iconName: string;
  title: string;
  subtitle: string;
}



const Index = () => {

  const { seoData } = useSEO('/home');
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  interface CTAItem {
    title?: string;
    description?: string;
    [key: string]: unknown;
  }
  const [projectCategory, setProjectCategory] = useState("");
  const [CTA, setCTA] = useState<CTAItem[]>([]);
  const projectId = getProjectId();
  const pathname = usePathname();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");


  const [welcomeLine, setWelcomeLine] = useState('');
  const [projectSlogan, setProjectSlogan] = useState('');

  let [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroHeadingPart1, setHeroHeadingPart1] = useState('');
  const [heroHeadingPart2, setHeroHeadingPart2] = useState('');
  const conjunctions = [
    'and', 'or', 'but', 'with', 'for', 'as', 'because', 'so', 'then', 'by', 'on', 'at',
    'in', 'of', 'to', 'from', 'about', 'through', 'between', 'during', 'before', 'after'
  ];


  useEffect(() => {
    (async () => {
      try {
        const { data } = await httpFile.post('/webapp/v1/my_site', {
          projectId,
          pageType: 'home',
          reqFrom: 'Hero'
        });

        const info = data.projectInfo || {};
        const about = data.aboutUs || {};
        setCTA(info.cta);
        setBackgroundImage(info.images?.[2]?.url || "");

        setProjectCategory(info.serviceType || '');
        setWelcomeLine(info.welcomeLine || '');
        setPhoneNumber(about.phone || '');
        // Split heroHeading intelligently
        const words = info.heroHeading?.split(' ') || [];

        // If heading has more than 3 words, attempt to split based on meaningful conjunctions
        if (words.length > 3) {
          let breakIndex = -1;
          // Find the first occurrence of any conjunction or preposition
          for (let i = 0; i < words.length; i++) {
            if (conjunctions.includes(words[i].toLowerCase())) {
              breakIndex = i;
              break;
            }
          }

          if (breakIndex !== -1) {
            // Split at the first meaningful conjunction
            setHeroHeadingPart1(words.slice(0, breakIndex + 1).join(' ') || '');
            setHeroHeadingPart2(words.slice(breakIndex + 1).join(' ') || '');
          } else {
            // Fallback to split the first part with a few words, and second part with the rest
            setHeroHeadingPart1(words.slice(0, words.length - 2).join(' ') || '');
            setHeroHeadingPart2(words.slice(-2).join(' ') || '');
          }
        } else {
          // For 2 or 3 words, use a simpler split
          if (words.length === 3) {
            setHeroHeadingPart1(words.slice(0, 1).join(' ') || '');
            setHeroHeadingPart2(words.slice(1).join(' ') || '');
          } else {
            setHeroHeadingPart1(words.slice(0, 1).join(' ') || '');
            setHeroHeadingPart2(words.slice(1).join(' ') || '');
          }
        }

        setProjectSlogan(info.projectSlogan || `Professional ${info.serviceType}`);
        // sanitize helper
        const strip = (s: any) =>
          typeof s === 'string'
            ? s.trim().replace(/^[,\"\s]+|[,\"\s]+$/g, '')
            : '';

        // clean features

        // No more hardcoded classArray - we'll use theme colors dynamically
        const modifiedFeatures = (info.featuresSection || []).map((f: any, index: number) => ({
          serialno: f.serialno,
          iconName: strip(f.iconName),
          title: strip(f.title),
          subtitle: strip(f.subtitle),
        }));

        setFeatures(modifiedFeatures);

      } catch (err) {
        console.error('Fetch hero data error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [projectId]);
  // Example API fetch and modification

  const getCTAContent = (index: number): CTAItem => {
    if (CTA.length === 0) {
      return { title: "What are you waiting for?", description: "Contact us for our services" };
    }
    return CTA[index] || CTA[0];
  };



  // Show skeleton loading state like header
  const showSkeleton = isLoading;

  return (
    <HelmetProvider>
      <div className="min-h-screen">
        <Helmet>
          <title>{seoData.meta_title}</title>
          <meta name="description" content={seoData.meta_description} />
          <meta name="keywords" content={seoData.meta_keywords} />
        </Helmet>
        <WebVitals />
        <SchemaMarkup />
        <PageSchemaMarkup
          pageType="home"
          pageTitle={seoData.meta_title}
          pageDescription={seoData.meta_description}
        />
        {/* <TestimonialsSchemaMarkup /> */}
        <ProcessSchemaMarkup />
        <Header />
        {/* Hero section */}


        {/* Modern Hero Section */}
        <section
          id="home"
          className="relative min-h-screen flex items-center justify-center overflow-hidden py-8 sm:py-12 lg:py-16 pb-16 sm:pb-20 lg:pb-24"
          style={{
            backgroundImage: `url(${backgroundImage})`,
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
            <div className="absolute top-20 left-10 w-2 h-2 bg-primary/40 rounded-full animate-ping"></div>
            <div className="absolute top-40 right-20 w-3 h-3 bg-accent/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-primary/50 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center lg:text-left space-y-6 relative z-20">
                
                {/* Badge */}
                {showSkeleton ? (
                  <div className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-2.5 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                  </div>
                ) : (
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
                      className="font-semibold tracking-wide"
                      style={{ color: colors.heading }}
                    >
                      {projectSlogan}
                    </span>
                  </div>
                )}

                {/* Main Heading */}
                {showSkeleton ? (
                  <div className="space-y-3">
                    <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-full max-w-2xl bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-3/4 max-w-xl bg-gray-300 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <h1 className="font-black">
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
                )}

                {/* Subheading */}
                {showSkeleton ? (
                  <div className="space-y-2 max-w-3xl mx-auto lg:mx-0">
                    <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <p 
                    className="max-w-3xl mx-auto lg:mx-0"
                    style={{ color: colors.description }}
                  >
                    {welcomeLine}
                  </p>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">
                  {showSkeleton ? (
                    <>
                      <div className="h-12 w-32 bg-gray-300 rounded-xl animate-pulse"></div>
                      <div className="h-12 w-36 bg-gray-300 rounded-xl animate-pulse"></div>
                    </>
                  ) : (
                    <>
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
                      <div className="opacity-90">Call Now</div>
                      <div className="font-bold">{phoneNumber}</div>
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
                    </>
                  )}
                </div>

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
                    <span className="font-medium">Licensed & Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star 
                      className="w-5 h-5 fill-current" 
                      style={{ color: colors.accent }}
                    />
                    <span className="font-medium">5-Star Rated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock 
                      className="w-5 h-5" 
                      style={{ color: colors.accent }}
                    />
                    <span className="font-medium">24/7 Available</span>
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

        <AboutSection />

        {/* Features Section - After About */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">
            {/* Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {features.map((f, index) => {
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl"
                    style={{
                      border: `1px solid ${colors.primaryButton.bg}15`
                    }}
                  >
                    {/* Hover Border Effect */}
                    <div 
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        border: `2px solid ${colors.primaryButton.bg}40`,
                        boxShadow: `0 0 20px ${colors.primaryButton.bg}20`
                      }}
                    ></div>

                    {/* Content */}
                    <div className="relative space-y-5">
                      {/* Icon Container */}
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

                      {/* Text Content */}
                      <div className="space-y-3">
                        <h3 
                          className="font-bold"
                          style={{ color: colors.heading }}
                        >
                          {f.title}
                        </h3>
                        <p 
                          style={{ color: colors.description }}
                        >
                          {f.subtitle}
                        </p>
                      </div>

                      {/* Bottom Accent Line */}
                      <div 
                        className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                        style={{
                          width: '3rem',
                          background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <ServicesSection />
        {/* <BookingSection />*/}

        <section 
          className="py-16 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '1s', backgroundColor: colors.primaryButton.bg }}></div>
            <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ animationDelay: '2s', backgroundColor: colors.accent }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">
            
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="font-bold text-white mb-4 max-w-2xl mx-auto">
                {getCTAContent(1).title}
              </h2>
              <p className="text-white/90 max-w-2xl mx-auto">
                {getCTAContent(1).description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              
              {/* Call Button */}
              <a
                href={`tel:${phoneNumber}`}
                className="group relative inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1 shadow-lg"
                style={{
                  backgroundColor: colors.primaryButton.bg,
                  color: colors.primaryButton.text
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
              >
                <div className="relative">
                  <Phone className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-left">
                  <div className="font-semibold opacity-90 uppercase tracking-wide">Emergency Call</div>
                  <div className="font-bold">{phoneNumber}</div>
                </div>
              </a>

              {/* Book Online Button */}
              <Link
                href="/contact"
                className="group relative inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1 shadow-lg backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: colors.primaryButton.bg,
                  border: `2px solid ${colors.primaryButton.bg}30`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryButton.bg;
                  e.currentTarget.style.color = colors.primaryButton.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.color = colors.primaryButton.bg;
                }}
              >
                <Calendar className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold opacity-90 uppercase tracking-wide">Book Online</div>
                  <div className="font-bold">Schedule Service</div>
                </div>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.accent }}
                ></div>
                <span className="font-semibold">24/7 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.primaryButton.bg }}
                ></div>
                <span className="font-semibold">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.accent }}
                ></div>
                <span className="font-semibold">Same Day Service</span>
              </div>
            </div>
          </div>
        </section>



        <WhyChooseUsSection />
        <ProcessSection />
        {/* <BookingSection /> */}

        <section 
          className="py-16 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '1s', backgroundColor: colors.primaryButton.bg }}></div>
            <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ animationDelay: '2s', backgroundColor: colors.accent }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">
            
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="font-bold text-white mb-4 max-w-2xl mx-auto">
                {getCTAContent(2).title}
              </h2>
              <p className="text-white/90 max-w-2xl mx-auto">
                {getCTAContent(2).description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              
              {/* Call Button */}
              <a
                href={`tel:${phoneNumber}`}
                className="group relative inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1 shadow-lg"
                style={{
                  backgroundColor: colors.primaryButton.bg,
                  color: colors.primaryButton.text
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
              >
                <div className="relative">
                  <Phone className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-left">
                  <div className="font-semibold opacity-90 uppercase tracking-wide">Emergency Call</div>
                  <div className="font-bold">{phoneNumber}</div>
                </div>
              </a>

              {/* Book Online Button */}
              <Link
                href="/contact"
                className="group relative inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1 shadow-lg backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: colors.primaryButton.bg,
                  border: `2px solid ${colors.primaryButton.bg}30`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryButton.bg;
                  e.currentTarget.style.color = colors.primaryButton.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.color = colors.primaryButton.bg;
                }}
              >
                <Calendar className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold opacity-90 uppercase tracking-wide">Book Online</div>
                  <div className="font-bold">Schedule Service</div>
                </div>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.accent }}
                ></div>
                <span className="font-semibold">24/7 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.primaryButton.bg }}
                ></div>
                <span className="font-semibold">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.accent }}
                ></div>
                <span className="font-semibold">Same Day Service</span>
              </div>
            </div>
          </div>
        </section>


        <Suspense fallback={<div className="py-16 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto border-pink-500"></div></div>}>
          <GuaranteeSection />
        </Suspense>
        
        <Suspense fallback={<div className="py-16 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto border-pink-500"></div></div>}>
          <TestimonialsSection />
        </Suspense>
        
        {/* <BookingSection /> */}

        <section 
          className="py-16 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '1s', backgroundColor: colors.primaryButton.bg }}></div>
            <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ animationDelay: '2s', backgroundColor: colors.accent }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">
            
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="font-bold text-white mb-4 max-w-2xl mx-auto">
                {getCTAContent(3).title}
              </h2>
              <p className="text-white/90 max-w-2xl mx-auto">
                {getCTAContent(3).description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              
              {/* Call Button */}
              <a
                href={`tel:${phoneNumber}`}
                className="group relative inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1 shadow-lg"
                style={{
                  backgroundColor: colors.primaryButton.bg,
                  color: colors.primaryButton.text
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
              >
                <div className="relative">
                  <Phone className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-left">
                  <div className="font-semibold opacity-90 uppercase tracking-wide">Emergency Call</div>
                  <div className="font-bold">{phoneNumber}</div>
                </div>
              </a>

              {/* Book Online Button */}
              <Link
                href="/contact"
                className="group relative inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1 shadow-lg backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: colors.primaryButton.bg,
                  border: `2px solid ${colors.primaryButton.bg}30`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryButton.bg;
                  e.currentTarget.style.color = colors.primaryButton.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.color = colors.primaryButton.bg;
                }}
              >
                <Calendar className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold opacity-90 uppercase tracking-wide">Book Online</div>
                  <div className="font-bold">Schedule Service</div>
                </div>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.accent }}
                ></div>
                <span className="font-semibold">24/7 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.primaryButton.bg }}
                ></div>
                <span className="font-semibold">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.accent }}
                ></div>
                <span className="font-semibold">Same Day Service</span>
              </div>
            </div>
          </div>
        </section>
        <AreasSection />
        <FAQSection />
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default Index;
