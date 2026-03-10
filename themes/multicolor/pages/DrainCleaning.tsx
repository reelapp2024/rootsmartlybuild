'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronUp, MessageSquare, Calendar, ArrowRight, Quote, HelpCircle, Heart } from 'lucide-react';
import { generateFAQSchema, generateReviewSchema, generateServicesSchema } from "../../../hooks/schemaMarkup"

import Header from '../components/Header';
import Footer from '../components/Footer';
import PageBreadcrumb from '../components/PageBreadcrumb';
import DrainCleaningHero from '../components/services/drain-cleaning/DrainCleaningHero';
import DrainCleaningAbout from '../components/services/drain-cleaning/DrainCleaningAbout';
import DrainCleaningServices from '../components/services/drain-cleaning/DrainCleaningServices';
import DrainCleaningProcess from '../components/services/drain-cleaning/DrainCleaningProcess';
import WhyChooseUsSimple from '../components/WhyChooseUsSimple';
import DrainCleaningGuarantee from '../components/services/drain-cleaning/DrainCleaningGuarantee';
import DrainCleaningPromise from '../components/services/drain-cleaning/DrainCleaningPromise';
import DrainCleaningRelated from '../components/services/drain-cleaning/DrainCleaningRelated';
import DrainCleaningFAQ from '../components/services/drain-cleaning/DrainCleaningFAQ';
import BookingSection from '../components/BookingSection';
import ServiceSchemaMarkup from '../components/ServiceSchemaMarkup';
import PageSchemaMarkup from '../components/PageSchemaMarkup';
import { useMemo } from 'react';
import DynamicIcon from '../../../extras/DynamicIcon';
import { Shield, Award, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Star, StarHalf, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { httpFile } from "@/config";
import humanizeString from "../../../extras/stringUtils.js";
import DynamicFAIcon from '../../../extras/DynamicFAIcon'; // make sure the path is correct
import { removeDot } from "../../../extras/removeDot.js";
import Link from 'next/link';
// @ts-ignore - react-helmet-async may not be installed
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { slugify } from "../../../extras/slug";
import { useSEO } from '../../../hooks/useSEO';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Testimonial {
  review_text?: string;
  customer_image?: string;
  customer_name?: string;
  rating?: number | string;
  [key: string]: unknown;
}

interface ProcessStep {
  title?: string;
  description?: string;
  iconClass?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  number?: string | number;
  [key: string]: unknown;
}

interface SubService {
  service_name?: string;
  service_description?: string;
  [key: string]: unknown;
}

interface GuaranteeItem {
  title?: string;
  description?: string;
  iconClass?: string;
  color?: string;
  bgColor?: string;
  [key: string]: unknown;
}

interface WhyChooseUsFeature {
  title?: string;
  description?: string;
  iconClass?: string;
  [key: string]: unknown;
}

interface ServiceGroup {
  groupTitle?: string;
  items?: SubService[];
  [key: string]: unknown;
}

interface FAQItem {
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

interface ServiceDetails {
  service_name?: string;
  service_description?: string;
  images?: Array<{ url?: string }>;
  [key: string]: unknown;
}

const DrainCleaning = () => {
  const { getThemeColors } = useTheme();

  // Fallback colors in case theme context is not loaded
  const fallbackColors = {
    primaryButton: { bg: '#e11d48', text: '#ffffff', hover: '#be123c' },
    secondaryButton: { bg: 'transparent', text: '#ffffff', border: '#e11d48', hover: 'rgba(225,29,72,0.1)' },
    accent: '#f59e0b',
    surface: '#f8fafc',
    gradient: { from: '#e11d48', to: '#f59e0b' },
    heading: '#1f2937',
    description: '#6b7280'
  };

  const safeColors = getThemeColors() || fallbackColors;

  const breadcrumbItems = [
    { label: "Services", href: "/services" },
    { label: "Drain Cleaning" }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };


  const params = useParams();
  const { serviceName: urlServiceName } = params as { serviceName?: string };
  const router = useRouter();
  const pathname = usePathname();
  
  const [projectOurProcess, setprojectOurProcess] = useState<ProcessStep[]>([]);
  const [slugApiCompleted, setSlugApiCompleted] = useState(false); // Tracks slug API completion
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [serviceImage, setServiceImage] = useState("");
  const [ProjectBaseImage, setProjectBaseImage] = useState("");
  const [stepProcess, setStepProcess] = useState<ProcessStep[]>([]);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [projectReviews, setProjectReviews] = useState<Testimonial[]>([]);

  const [whyChooseUsHeading, setWhyChooseUsHeading] = useState("");
  const [customSolutionText, setCustomSolutionText] = useState("");
  const [comprehensiveCoverageText, setComprehensiveCoverageText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reloadFlag, setReloadFlag] = useState(0);
  const [aboutService, setAboutService] = useState('');
  const [subServices, setSubServices] = useState<SubService[]>([]);

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  // Note: Next.js doesn't support route state, use query params or localStorage if needed
  const [serviceId, setServiceId] = useState("");
  let displayServiceName = humanizeString(urlServiceName) || 'Residential Cleaning';
  const [guarantees, setGuarantees] = useState<GuaranteeItem[]>([]);
  const [guaranteeText, setGuaranteeText] = useState("");
  const [promiseLine, setPromiseLine] = useState("");
  const [projectCategory, setProjectCategory] = useState("");
  const [projectName, setprojectName] = useState("");
  const [locationName, setDisplayLocationName] = useState("");
  const [areaType, setAreaType] = useState("");
  const [areaId, setAreaId] = useState("");
  interface CTAItem {
    title?: string;
    description?: string;
    [key: string]: unknown;
  }
  const [cta1, setCta1] = useState<CTAItem | null>(null);
  const [cta2, setCta2] = useState<CTAItem | null>(null);
  const [cta3, setCta3] = useState<CTAItem | null>(null);
  const [cta4, setCta4] = useState<CTAItem | null>(null);
  const [projectWhyChooseUs, setprojectWhyChooseUs] = useState<WhyChooseUsFeature[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);  // Dynamic groups from API
  const [projectFaqs, setprojectFaqs] = useState<FAQItem[]>([]);

  const stepColors = [
    'bg-red-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500'
  ];

  const gradients = [
    'from-red-500 to-pink-500',
    'from-yellow-500 to-orange-500',
    'from-green-500 to-emerald-500',
    'from-blue-500 to-indigo-500',
    'from-purple-500 to-fuchsia-500',
    'from-amber-500 to-lime-500'
  ];

  // extract the slug after "/services/"
  const serviceSlug = useMemo(() => {
    const segments = pathname.split('/');
    const idx = segments.findIndex(s => s === 'services');
    return idx >= 0 && segments[idx + 1] ? segments[idx + 1] : '';
  }, [pathname]);

  // Extract path before '/services/'
  const routeBeforeServices = pathname.split('/services/')[0];

  // Remove leading '/' if needed
  const locationSlug = routeBeforeServices.startsWith('/') ? routeBeforeServices.slice(1) : routeBeforeServices;



  useEffect(() => {
    const fetchPageType = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/slugToPageType", {
          projectId,
          slug: locationSlug
        });


        if (data?.slugType) {

          setDisplayLocationName(data.showName);
          setAreaType(data.slugType);
          setAreaId(data.locationId);
        }
      } catch (error) {
        console.error("Error fetching page type:", error);
      } finally {
        setSlugApiCompleted(true); // Mark slug API as completed
      }
    };

    if (locationSlug) {
      fetchPageType();
    } else {
      setSlugApiCompleted(true); // If no locationSlug, mark as completed
    }
  }, [locationSlug, projectId]);

  let seoPayload = locationSlug ? `/${locationSlug}/services/${slugify(serviceSlug)}` : `/services/${slugify(serviceSlug)}`




  const { seoData } = useSEO(seoPayload);




  displayServiceName = locationName ? displayServiceName : removeDot(displayServiceName)

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); // runs every time URL path changes


  useEffect(() => {
    localStorage.setItem("locaitonname", locationName);
  }, [locationName]);


  // When URL changes (same page but different param), force refetch
  useEffect(() => {
    window.scrollTo(0, 0);
    // Note: Next.js doesn't support route state, use query params or localStorage if needed
    const savedServiceId = localStorage.getItem('serviceId') || "";
    setServiceId(savedServiceId);
    setReloadFlag(prev => prev + 1);
  }, [urlServiceName]);

  useEffect(() => {
    const fetchServiceId = async () => {
      if (!serviceId && displayServiceName && slugApiCompleted) { // Wait for slug API completion
        try {
          const { data } = await httpFile.post("/webapp/v1/fetch_service_by_name_and_project", {
            projectId,
            serviceName: displayServiceName,
          });

          if (data?.serviceId) {
            setServiceId(data.serviceId);
          }
        } catch (error) {
          console.error("Error fetching service ID:", error);
        }
      }
    };

    fetchServiceId();
  }, [projectId, urlServiceName, displayServiceName, slugApiCompleted, reloadFlag]); // Add slugApiCompleted as dependency

  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId || !slugApiCompleted) return;

      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_service", { serviceId, areaType, areaId });


        console.log("hello");

        console.log(data.service, "Data fetched for service details<<<<<<<<<<666666666666666>>>>>>>>>>>>>>")
        if (data.service) {




          setServiceDetails(data.service);
          setServiceImage(data.service.images?.[0]?.url || "");
          setProjectBaseImage(data.service.images?.[2]?.url || "");
          setStepProcess(
            (data.service.steps_process || []).map((step: ProcessStep, index: number) => ({
              ...step,
              color: stepColors[index % stepColors.length],
              number: index + 1  // Also set number for display
            }))
          );


          setAboutService(data.service.about_service || '');
          setCta1(data.cta1 || null);
          setCta2(data.cta2 || null);
          setCta3(data.cta3 || null);
          setCta4(data.cta4 || null);
          setWhyChooseUsHeading(data.service.whyChooseUsHeading || '');
          setCustomSolutionText(data.service.customSolutionText || '');
          setComprehensiveCoverageText(data.service.comprehensiveCoverageText || '');
          setServiceGroups(data.service.serviceGroups || []);  // Dynamic groups for sections


          setGuarantees(
            (data.service.ourGuaranteeSection || []).map((item: GuaranteeItem, index: number) => ({
              ...item,
              gradient: gradients[index % gradients.length]
            }))
          );


          setGuaranteeText(data.service.ourGuaranteeText);
          setPromiseLine(data.service.promiseLine)
          setprojectWhyChooseUs(data.service.whyChooseUsSection);
          setProjectReviews(data.testimonials || []);


          setprojectFaqs(data.faq || []);

          // Parse subServices from comma-separated string
          const subServicesArray = Array.isArray(data.service.subServices)
            ? data.service.subServices.map((item: any) => String(item).trim()).filter(Boolean) // If it's an array, trim and filter
            : typeof data.service.subServices === 'string'
              ? data.service.subServices.split(',').map((item: string) => item.trim()).filter(Boolean) // If it's a string, split, trim, and filter
              : []; // Default to an empty array if it's neither a string nor an array

          setSubServices(subServicesArray);

          // Fetch SEO data based on current route



          setIsLoading(false);


        }
      } catch (error) {
        console.error("Error fetching service details:", error);
      }
    };

    fetchServiceData();
  }, [serviceId, slugApiCompleted]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
        });

        if (data.projectInfo) {
          setprojectOurProcess(data.projectInfo.ourProcessSection);
          setProjectCategory(data.projectInfo.serviceType);
          setPhoneNumber(data.aboutUs.phone);
          setprojectName(data.projectInfo.projectName);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);
  const hasLocationName = Boolean(locationName);
  let inlocationName = ''

  if (hasLocationName) {
    inlocationName = `in ${locationName}`;

  }
  const rawDescription = serviceDetails?.service_description || "";
  // Always clean it first:
  const cleaned = removeDot(rawDescription);

  const displayServiceDescription = locationName
    // then, if you have a location, tack it on:
    ? `${cleaned}.`
    : cleaned;


  const displayServiceImage = serviceImage && serviceImage.trim() !== '' ? serviceImage : '/placeholder.svg';




  const schemaBreadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    let cumulativePath = '';
    return segments.map((segment, index) => {
      cumulativePath += `/${segment}`;
      const isLast = index === segments.length - 1;

      const name =
        segment === 'services'
          ? 'Services'
          : isLast
            ? displayServiceName
            : humanizeString(segment);

      // PageSchemaMarkup will absolutize relative URLs
      return { name, url: cumulativePath };
    });
  }, [location.pathname, displayServiceName]);

  // Get origin and pathname safely (works in both SSR and client)
  const getOrigin = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  };

  const getLocationUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.split('/services/')[0];
    }
    return '';
  };

  const locationUrl = getLocationUrl();


  const faqSchema = generateFAQSchema(projectFaqs);
  const reviewSchema = generateReviewSchema(projectReviews);
const coloredSteps = stepProcess.map((step: ProcessStep, i: number) => ({
  ...step,
  color: step.color || stepColors[i % stepColors.length], // Use stepColors array
  bgColor: step.bgColor || stepColors[i % stepColors.length], // Use stepColors for bgColor
  borderColor: step.borderColor || `${stepColors[i % stepColors.length]}80`, // Add transparency for border
  number: (i + 1).toString()
}));


  // Show skeleton loading state like header
  const showSkeleton = isLoading;

  return (
    <HelmetProvider>
      <Helmet>
        <title>{`${seoData?.meta_title} ${locationName}`}</title>

        <meta name="description" content={seoData.meta_description} />
        <meta name="keywords" content={seoData.meta_keywords} />

        {/* Embed FAQ schema */}
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema, null, 2)}
          </script>
        )}
        {/* Embed Reviews schema */}
        {reviewSchema && (
          <script type="application/ld+json">
            {JSON.stringify(reviewSchema, null, 2)}
          </script>
        )}

      </Helmet>

      <div className="min-h-screen font-poppins">
        {/* ✅ Replace your existing PageSchemaMarkup usage with this */}
        <PageSchemaMarkup
          pageType="service-detail"
          pageTitle={`${seoData?.meta_title} ${locationName}`}
          pageDescription={seoData.meta_description}
          breadcrumbs={schemaBreadcrumbs}
          serviceName={displayServiceName}
        />

        <ServiceSchemaMarkup
          serviceName="Professional Drain Cleaning Services"
          serviceDescription="Expert drain cleaning solutions to keep your pipes flowing smoothly. 24/7 emergency service available with fast response times."
          serviceUrl={`${getOrigin()}/services/drain-cleaning`}
        />
        <Header />
        {/* Hero Section */}
        <section
          id="home"
          className="relative min-h-screen flex items-center overflow-hidden pb-16 sm:pb-20 lg:pb-24"
          style={{
            backgroundColor: safeColors.surface
          }}
        >
          {/* Left Side - Content */}
          <div className="w-full lg:w-1/2 relative z-10">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              {/* Breadcrumb - Top Left */}
              <div className="absolute top-6 left-4 sm:left-8 lg:left-16 z-30">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href="/" className="flex items-center text-xs text-gray-600 hover:text-gray-900 transition-colors">
                            <Home className="w-3 h-3 mr-1" />
                            Home
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href="/services" className="text-xs text-gray-600 hover:text-gray-900 transition-colors">Services</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium text-xs" style={{ color: safeColors.primaryButton.bg }}>{displayServiceName}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </div>

              <div className="pt-16 sm:pt-20 lg:pt-24">
                <div className="text-center lg:text-left space-y-6 relative z-20">

                  {/* Badge */}
                  {showSkeleton ? (
                    <div className="inline-block mb-4 animate-pulse">
                      <div className="h-8 w-48 bg-gray-300 rounded-full"></div>
                    </div>
                  ) : (
                    <div className="inline-block mb-4">
                      <span
                        className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-2.5"
                        style={{
                          color: safeColors.heading,
                          backgroundColor: `${safeColors.primaryButton.bg}15`
                        }}
                      >
                        <Star className="w-4 h-4" />
                        Professional {displayServiceName} Solutions
                      </span>
                    </div>
                  )}

                  {/* Main Heading */}
                  {showSkeleton ? (
                    <div className="space-y-3">
                      <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-full bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <h1 className="font-black">
                      <span style={{ color: safeColors.heading }}>
                        {locationName}
                      </span>{' '}
                      <span
                        className="inline-block"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`,
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {displayServiceName}
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
                      className="text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto lg:mx-0 leading-relaxed"
                      style={{ color: safeColors.description }}
                    >
                      {displayServiceDescription}
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
                        backgroundColor: safeColors.primaryButton.bg,
                        color: safeColors.primaryButton.text
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.bg}
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
                        backgroundColor: safeColors.secondaryButton.bg,
                        color: safeColors.secondaryButton.text,
                        border: `2px solid ${safeColors.secondaryButton.border}`
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = safeColors.secondaryButton.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = safeColors.secondaryButton.bg}
                    >
                      <Wrench className="w-5 h-5" />
                      <span>Get Free Estimate</span>
                    </button>
                      </>
                    )}
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-6">
                    <div className="flex items-center gap-2" style={{ color: safeColors.description }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }}></div>
                      <span className="text-xs font-semibold">24/7 Available</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: safeColors.description }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3B82F6' }}></div>
                      <span className="text-xs font-semibold">Licensed & Insured</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: safeColors.description }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: safeColors.accent }}></div>
                      <span className="text-xs font-semibold">Same Day Service</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="hidden lg:flex w-1/2 relative min-h-screen items-center justify-center p-8">
            <div className="relative w-full max-w-lg">
              {/* Main Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px]">
                <Image
                  src={displayServiceImage || '/placeholder.svg'}
                  alt="Professional Services"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0vw, 50vw"
                  quality={90}
                  loading="lazy"
                />

                {/* Gradient Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${safeColors.gradient.from}20, ${safeColors.gradient.to}20)`
                  }}
                ></div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl opacity-20" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl opacity-15" style={{ backgroundColor: safeColors.accent }}></div>

              {/* Floating Badge */}
              <div className="absolute top-6 right-6 bg-white rounded-xl px-4 py-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
                  <span className="text-gray-900 font-semibold text-sm">Professional Service</span>
                </div>
              </div>
            </div>

            {/* Animated Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 right-10 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ backgroundColor: safeColors.accent }}></div>
              <div className="absolute top-40 right-20 w-3 h-3 bg-accent/30 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '1s' }}></div>
              <div className="absolute bottom-32 right-1/4 w-2 h-2 bg-primary/50 rounded-full animate-ping" style={{ backgroundColor: safeColors.accent, animationDelay: '2s' }}></div>
              <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-accent/40 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '3s' }}></div>
            </div>
          </div>

          {/* Mobile Background Image */}
          <div
            className="lg:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: displayServiceImage ? `url(${displayServiceImage})` : `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`,
              zIndex: -1
            }}
          >
            {/* Gradient Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${safeColors.gradient.from}CC, ${safeColors.gradient.to}CC)`
              }}
            ></div>
          </div>
        </section>
        {/* <DrainCleaningAbout /> */}


        {/* About Section */}
        <section
          className="py-16 relative overflow-hidden bg-white"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 rounded-lg rotate-45 animate-pulse" style={{ backgroundColor: safeColors.accent, animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '2s' }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">

                {/* Content Column */}
                <div className="space-y-6">
                  <div className="text-center lg:text-left">
                    <div className="inline-block mb-4">
                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                        style={{
                          color: safeColors.primaryButton.bg,
                          backgroundColor: `${safeColors.primaryButton.bg}15`
                        }}
                      >
                        <Wrench className="w-4 h-4" />
                        Professional Service
                      </span>
                    </div>
                    <h2
                      className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-gray-900"
                    >
                      About Our Professional {displayServiceName} Services
                    </h2>
                    <p
                      className="text-xs sm:text-sm leading-relaxed text-gray-600"
                    >
                      {aboutService}
                    </p>
                  </div>
                </div>

                {/* Image Column */}
                <div className="lg:order-first">
                  <div className="relative">
                    {/* Main Image */}
                    {ProjectBaseImage && typeof ProjectBaseImage === 'string' && ProjectBaseImage.trim() !== '' ? (
                      <div className="relative overflow-hidden rounded-2xl shadow-lg">
                        <img
                          src={ProjectBaseImage}
                          alt="Professional plumber performing drain cleaning service with modern equipment"
                          className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}20, transparent)`
                          }}
                        ></div>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden rounded-2xl shadow-lg h-[400px] bg-gray-200 animate-pulse"></div>
                    )}

                    {/* Floating Stats Cards */}
                    <div
                      className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg border-2"
                      style={{
                        borderColor: `${safeColors.primaryButton.bg}30`
                      }}
                    >
                      <div className="text-center">
                        <div
                          className="text-xl font-bold text-gray-900"
                        >
                          15+
                        </div>
                        <div
                          className="text-xs text-gray-600"
                        >
                          Years Experience
                        </div>
                      </div>
                    </div>

                    <div
                      className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border-2"
                      style={{
                        borderColor: `${safeColors.accent}30`
                      }}
                    >
                      <div className="text-center">
                        <div
                          className="text-xl font-bold text-gray-900"
                        >
                          24/7
                        </div>
                        <div
                          className="text-xs text-gray-600"
                        >
                          Emergency Service
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Service Coverage Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">

            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{
                    color: safeColors.primaryButton.bg,
                    backgroundColor: `${safeColors.primaryButton.bg}15`
                  }}
                >
                  Service Coverage
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                Comprehensive <span style={{ color: safeColors.primaryButton.bg }}>{displayServiceName}</span> Solutions
              </h2>
              <p
                className="text-sm sm:text-base max-w-3xl mx-auto leading-relaxed mt-4 text-gray-600"
              >
                {comprehensiveCoverageText}
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {projectWhyChooseUs.map((feature: WhyChooseUsFeature, index: number) => {
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl"
                    style={{
                      border: `1px solid ${safeColors.primaryButton.bg}15`
                    }}
                  >
                    {/* Hover Border Effect */}
                    <div
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        border: `2px solid ${safeColors.primaryButton.bg}40`,
                        boxShadow: `0 0 20px ${safeColors.primaryButton.bg}20`
                      }}
                    ></div>

                    {/* Content */}
                    <div className="relative space-y-5">
                      {/* Icon Container */}
                      <div className="w-fit">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                          style={{
                            backgroundColor: `${safeColors.primaryButton.bg}15`,
                            border: `2px solid ${safeColors.primaryButton.bg}30`
                          }}
                        >
                          {feature.iconClass ? (
                            <div style={{ color: safeColors.primaryButton.bg }}>
                              <DynamicFAIcon
                                iconClass={feature.iconClass}
                                className="text-2xl"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Text Content */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="text-base leading-relaxed text-gray-600">
                          {feature.description}
                        </p>
                      </div>

                      {/* Bottom Accent Line */}
                      <div
                        className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                        style={{
                          width: '3rem',
                          background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>












        {/* Services Section */}
       {/* Services Section */}
{/* Services Section */}
{/* Services Section */}
<section className="py-16 bg-white">
  <div className="container mx-auto px-4 sm:px-8 lg:px-16">
    
    {/* Section Header - Unchanged */}
    <div className="text-center mb-12">
      <div className="inline-block mb-4">
        <span 
          className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
          style={{ 
            color: safeColors.primaryButton.bg,
            backgroundColor: `${safeColors.primaryButton.bg}15`
          }}
        >
          Complete Solutions
        </span>
      </div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
        Our Complete {projectCategory} Services
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed">
        Comprehensive {projectCategory} solutions for every need. For all kinds of services related to {projectCategory} we've got you covered.
      </p>
    </div>

    {/* Services Grid - Dynamic with Inline Static Fallbacks */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
      {serviceGroups.slice(0, 4).map((group: ServiceGroup, groupIndex: number) => {
        // Inline static fallbacks (your original data, no state refs)
        const staticData = [
          { title: "Residential Services", icon: "fas fa-home", subtitle: "Home & Family Solutions", items: [] },  // Empty items for dynamic
          { title: "Commercial Services", icon: "fas fa-building", subtitle: "Business & Industrial Solutions", items: [] },
          { title: "Professional Methods", icon: "fas fa-tools", subtitle: "Advanced Techniques & Tools", items: [] },
          { title: "Premium Options", icon: "fas fa-gem", subtitle: "Luxury & High-End Solutions", items: [] }
        ];
        const fallback = staticData[groupIndex] || { title: "Services", icon: "fas fa-cogs", subtitle: "Essential Solutions", items: [] };
        
        const groupTitle = group?.groupTitle || fallback.title;
        const groupIcon = group?.items?.[0]?.iconClass || fallback.icon;  // First service icon
        const groupSubtitle = fallback.subtitle;  // Use fixed subtitle to match old look
        const dynamicItems = group?.items?.slice(0, 5) || fallback.items;  // Up to 5

        // Alternating colors like old code
        const isEven = groupIndex % 2 === 0;
        const headerFrom = isEven ? safeColors.primaryButton.bg : safeColors.accent;
        const headerTo = isEven ? safeColors.accent : safeColors.primaryButton.bg;
        const iconBg = isEven ? safeColors.primaryButton.bg : safeColors.accent;
        const cardBorder = `${iconBg}20`;
        const itemBgColor = `${iconBg}15`;
        const itemBorderColor = `${iconBg}30`;
        const patternColor1 = isEven ? safeColors.primaryButton.bg : safeColors.accent;
        const patternColor2 = isEven ? safeColors.accent : safeColors.primaryButton.bg;

        return (
          <div 
            key={groupIndex}
            className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 shadow-lg hover:shadow-2xl"
            style={{
              border: `2px solid ${cardBorder}`
            }}
          >
            {/* Header Section - With alternating colors */}
            <div 
              className="p-6 text-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${headerFrom}10, ${headerTo}10)`
              }}
            >
              {/* Background Pattern - Unchanged */}
              <div className="absolute inset-0 opacity-5">
                <div 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full animate-pulse" 
                  style={{ backgroundColor: patternColor1 }}
                ></div>
                <div 
                  className="absolute bottom-4 left-4 w-6 h-6 rounded-lg rotate-45 animate-pulse" 
                  style={{ backgroundColor: patternColor2, animationDelay: '1s' }}
                ></div>
              </div>

              {/* Icon - First service icon */}
              <div className="relative mb-4">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12"
                  style={{
                    backgroundColor: iconBg,
                    boxShadow: `0 8px 25px ${iconBg}30`
                  }}
                >
                  <DynamicFAIcon 
                    iconClass={String(groupIcon || '')} 
                    className="w-8 h-8 text-white"
                  />
                </div>
              </div>

              {/* Title & Subtitle - Dynamic */}
              <h3 className="font-bold text-gray-900 mb-2">
                {groupTitle}
              </h3>
              <p className="text-sm text-gray-600">
                {groupSubtitle}
              </p>
            </div>

            {/* Services List - Dynamic */}
            <div className="p-6 space-y-3">
              {dynamicItems.map((item: SubService, idx: number) => (
                <div key={idx} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group/item">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover/item:scale-110"
                    style={{
                      backgroundColor: itemBgColor,
                      border: `2px solid ${itemBorderColor}`
                    }}
                  >
                    <DynamicFAIcon 
                      iconClass={String((item as SubService).iconClass || "fas fa-cogs")} 
                      className="w-5 h-5"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover/item:text-gray-900 transition-colors">
                    {(item as SubService).service_name || ''}
                  </span>
                </div>
              ))}
              {dynamicItems.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-4">No specific options available yet.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>



        {cta2 && (
          <section
            className="py-16 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${safeColors.gradient.from}, ${safeColors.gradient.to})`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: safeColors.accent }}></div>
              <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '1s', backgroundColor: safeColors.primaryButton.bg }}></div>
              <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ animationDelay: '2s', backgroundColor: safeColors.accent }}></div>
            </div>

            <div className="container mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">

              {/* Section Header */}
              <div className="mb-12">
                <h2
                  className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white"
                >
                  {cta2.title}
                </h2>
                <p
                  className="text-xs sm:text-sm text-white/90 max-w-3xl mx-auto"
                >
                  {cta2.description}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">

                {/* Call Button */}
                <a
                  href={`tel:${phoneNumber}`}
                  className="group relative px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: safeColors.primaryButton.bg,
                    color: safeColors.primaryButton.text
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.bg}
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs font-semibold">Call Now</div>
                      <div className="text-sm font-bold">{phoneNumber}</div>
                    </div>
                  </div>
                </a>

                {/* Book Button */}
                <Link
                  href="/contact"
                  className="group relative px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs font-semibold">Book Online</div>
                      <div className="text-sm font-bold">Schedule Service</div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                  <span className="text-xs font-semibold">24/7 Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                  <span className="text-xs font-semibold">Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                  <span className="text-xs font-semibold">Same Day Service</span>
                </div>
              </div>
            </div>
          </section>
        )}










        {/* <DrainCleaningProcess /> */}







        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">

            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{
                    color: safeColors.primaryButton.bg,
                    backgroundColor: `${safeColors.primaryButton.bg}15`
                  }}
                >
                  Our Process
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                Our Simple <span style={{ color: safeColors.primaryButton.bg }}>Process</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
                Our streamlined {coloredSteps.length}-step process ensures you get professional {projectCategory} service from start to finish.
              </p>
            </div>
            {/* Process Flow */}
            <div className="relative max-w-5xl mx-auto">
              {/* Connecting Line */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full hidden lg:block"
                style={{
                  background: `linear-gradient(to bottom, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                }}
              ></div>

              {/* Process Steps */}
              <div className="space-y-12 lg:space-y-16">
                {coloredSteps.map((step: ProcessStep, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col gap-8 lg:gap-12`}
                  >
                    {/* Content Card */}
                    <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8'} text-center lg:text-inherit`}>
                      <div
                        className="inline-block rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 max-w-md w-full"
                        style={{
                          backgroundColor: `${safeColors.primaryButton.bg}08`,
                          border: `2px solid ${safeColors.primaryButton.bg}20`
                        }}
                      >
                        {/* Icon */}
                        {step.iconClass && (
                          <div className="flex justify-center mb-4">
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                              style={{
                                background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                              }}
                            >
                              <DynamicFAIcon
                                iconClass={step.iconClass}
                                className="text-2xl text-white"
                              />
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <h3 className="font-bold text-gray-900 mb-4">{step.title || ''}</h3>
                        <p className="text-gray-600 text-lg leading-relaxed">{step.description || ''}</p>
                      </div>
                    </div>
                    {/* Step Number Circle */}
                    <div className="relative z-10 hidden lg:block">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white"
                        style={{
                          background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                        }}
                      >
                        {String(step.number || '')}
                      </div>

                      {/* Arrow */}
                      {index < coloredSteps.length - 1 && (
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
                          <ArrowRight
                            className="w-6 h-6 rotate-90"
                            style={{ color: safeColors.primaryButton.bg }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Mobile Step Number */}
                    <div className="lg:hidden">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                        }}
                      >
                        {String(step.number || '')}
                      </div>
                    </div>

                    {/* Empty space for alternating layout */}
                    <div className="flex-1 hidden lg:block"></div>
                  </div>
                ))}
              </div>
            </div>






          </div>
        </section>
        {/* <WhyChooseUsSimple /> */}

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">

            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{
                    color: safeColors.primaryButton.bg,
                    backgroundColor: `${safeColors.primaryButton.bg}15`
                  }}
                >
                  Why Choose Us
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                Why Choose <span style={{ color: safeColors.primaryButton.bg }}>{displayServiceName}</span> by {projectName} {inlocationName}?
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
                We're committed to providing exceptional {displayServiceName} services with professional expertise and customer satisfaction.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectWhyChooseUs.map((feature: WhyChooseUsFeature, index: number) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl"
                  style={{
                    border: `1px solid ${safeColors.primaryButton.bg}15`
                  }}
                >
                  {/* Hover Border Effect */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      border: `2px solid ${safeColors.primaryButton.bg}40`,
                      boxShadow: `0 0 20px ${safeColors.primaryButton.bg}20`
                    }}
                  ></div>

                  {/* Content */}
                  <div className="relative space-y-5">
                    {/* Icon Container */}
                    <div className="w-fit">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                        style={{
                          backgroundColor: `${safeColors.primaryButton.bg}15`,
                          border: `2px solid ${safeColors.primaryButton.bg}30`
                        }}
                      >
                        {feature.iconClass ? (
                          <DynamicFAIcon
                            iconClass={feature.iconClass}
                            className="text-2xl"
                          />
                        ) : null}
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold leading-tight text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-base leading-relaxed text-gray-600">
                        {feature.description}
                      </p>
                    </div>

                    {/* Bottom Accent Line */}
                    <div
                      className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                      style={{
                        width: '3rem',
                        background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* <DrainCleaningGuarantee /> */}

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">

            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{
                    color: safeColors.primaryButton.bg,
                    backgroundColor: `${safeColors.primaryButton.bg}15`
                  }}
                >
                  Our Guarantee
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                Our <span style={{ color: safeColors.primaryButton.bg }}>{displayServiceName}</span> Guarantee {inlocationName}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
                {guaranteeText}
              </p>
            </div>

            {/* Guarantee Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {guarantees.map((guarantee: GuaranteeItem, index: number) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl"
                  style={{
                    border: `1px solid ${safeColors.primaryButton.bg}15`
                  }}
                >
                  {/* Hover Border Effect */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      border: `2px solid ${safeColors.primaryButton.bg}40`,
                      boxShadow: `0 0 20px ${safeColors.primaryButton.bg}20`
                    }}
                  ></div>

                  {/* Content */}
                  <div className="relative space-y-5">
                    {/* Icon */}
                    <div className="flex justify-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                        }}
                      >
                        <DynamicFAIcon
                          iconClass={guarantee.iconClass || ''}
                          className="text-white text-2xl"
                        />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="text-center space-y-3">








                      <h4 className="text-xl font-bold leading-tight text-gray-900">
                        {guarantee.title}
                      </h4>
                      <p className="text-base leading-relaxed text-gray-600">
                        {guarantee.description}
                      </p>
                    </div>

                    {/* Bottom Accent Line */}
                    <div
                      className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                      style={{
                        width: '3rem',
                        background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>



        {/* <DrainCleaningPromise /> */}


        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">
            <div className="max-w-4xl mx-auto">
              <div
                className="rounded-3xl p-12 text-center relative overflow-hidden"
                style={{
                  backgroundColor: `${safeColors.primaryButton.bg}08`,
                  border: `2px solid ${safeColors.primaryButton.bg}20`
                }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div
                    className="absolute top-8 left-8 w-20 h-20 border-2 rounded-full"
                    style={{ borderColor: safeColors.primaryButton.bg }}
                  ></div>
                  <div
                    className="absolute bottom-8 right-8 w-16 h-16 border-2 rounded-lg rotate-45"
                    style={{ borderColor: safeColors.accent }}
                  ></div>
                  <div
                    className="absolute top-1/2 left-1/4 w-12 h-12 border rounded-full"
                    style={{ borderColor: safeColors.primaryButton.bg }}
                  ></div>
                </div>

                <div className="relative">
                  <div className="mb-8">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                      }}
                    >
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h3
                      className="text-xl sm:text-2xl font-bold mb-6"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Our Promise to You
                    </h3>
                  </div>
                  <div className="max-w-4xl mx-auto">
                    <p className="text-base sm:text-lg text-gray-900 font-semibold leading-relaxed">
                      {promiseLine || `"We promise to fix your plumbing problems quickly and efficiently, so you can get back to enjoying your home without any stress or hassle!"`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <DrainCleaningRelated serviceId={serviceId} cta3={cta3} phoneNumber={phoneNumber} locationUrl={locationUrl} />

        {cta3 && (
          <section
            className="py-16 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${safeColors.gradient.from}, ${safeColors.gradient.to})`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: safeColors.accent }}></div>
              <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '1s', backgroundColor: safeColors.primaryButton.bg }}></div>
              <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ animationDelay: '2s', backgroundColor: safeColors.accent }}></div>
            </div>

            <div className="container mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">

              {/* Section Header */}
              <div className="mb-12">
                <h2
                  className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white"
                >
                  {cta3.title}
                </h2>
                <p
                  className="text-xs sm:text-sm text-white/90 max-w-3xl mx-auto"
                >
                  {cta3.description}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">

                {/* Call Button */}
                <a
                  href={`tel:${phoneNumber}`}
                  className="group relative px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: safeColors.primaryButton.bg,
                    color: safeColors.primaryButton.text
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.bg}
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs font-semibold">Call Now</div>
                      <div className="text-sm font-bold">{phoneNumber}</div>
                    </div>
                  </div>
                </a>

                {/* Book Button */}
                <Link
                  href="/contact"
                  className="group relative px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs font-semibold">Book Online</div>
                      <div className="text-sm font-bold">Schedule Service</div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                  <span className="text-xs font-semibold">24/7 Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                  <span className="text-xs font-semibold">Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                  <span className="text-xs font-semibold">Same Day Service</span>
                </div>
              </div>
            </div>
          </section>
        )}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">

            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{
                    color: safeColors.primaryButton.bg,
                    backgroundColor: `${safeColors.primaryButton.bg}15`
                  }}
                >
                  Customer Reviews
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                What Our <span style={{ color: safeColors.primaryButton.bg }}>Customers</span> Say
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
                Don't just take our word for it. Here's what our satisfied customers have to say about our {projectCategory} services.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectReviews.map((testimonial, index) => {
                const rawRating = Number(testimonial.rating) || 0;
                const fullStars = Math.floor(rawRating);
                const hasHalf = rawRating - fullStars >= 0.5;
                const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl flex flex-col h-full"
                    style={{
                      border: `1px solid ${safeColors.primaryButton.bg}15`
                    }}
                  >
                    {/* Hover Border Effect */}
                    <div
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        border: `2px solid ${safeColors.primaryButton.bg}40`,
                        boxShadow: `0 0 20px ${safeColors.primaryButton.bg}20`
                      }}
                    ></div>

                    {/* Quote Icon */}
                    <div className="flex justify-center mb-6">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                        }}
                      >
                        <Quote className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Stars Rating */}
                    <div className="flex items-center justify-center mb-6">
                      {[...Array(fullStars)].map((_, i) => (
                        <Star key={`full-${index}-${i}`} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                      {hasHalf && (
                        <StarHalf key={`half-${index}`} className="w-5 h-5 text-yellow-400 fill-current" />
                      )}
                      {[...Array(emptyStars)].map((_, i) => (
                        <Star key={`empty-${index}-${i}`} className="w-5 h-5 text-gray-300 fill-current" />
                      ))}
                    </div>

                    {/* Review Text */}
                    <div className="relative flex-1">
                      <p className="text-gray-700 mb-6 leading-relaxed text-center italic">
                        "{testimonial.review_text}"
                      </p>
                    </div>

                    {/* Customer Name */}
                    <div className="text-center mt-auto">
                      <div
                        className="inline-block px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: `${safeColors.primaryButton.bg}10`
                        }}
                      >
                        <h4 className="font-bold text-gray-900">
                          {testimonial.customer_name}
                        </h4>
                      </div>
                    </div>

                    {/* Bottom Accent Line */}
                    <div
                      className="h-1 rounded-full transition-all duration-500 group-hover:w-full mt-4"
                      style={{
                        width: '3rem',
                        background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                      }}
                    ></div>
                  </div>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 text-center">
              <div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl"
                style={{
                  backgroundColor: `${safeColors.primaryButton.bg}08`,
                  border: `1px solid ${safeColors.primaryButton.bg}20`
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-900 font-bold text-sm sm:text-base lg:text-lg">5.0</span>
                </div>
                <div className="hidden sm:block w-px h-6 lg:h-8 bg-gray-300"></div>
                <div className="text-gray-600 text-sm sm:text-base">
                  <span className="font-bold text-gray-900">{projectReviews.length}+</span> Happy Customers
                </div>
                <div className="hidden sm:block w-px h-6 lg:h-8 bg-gray-300"></div>
                <div className="text-gray-600 text-sm sm:text-base">
                  <span className="font-bold text-gray-900">100%</span> Satisfaction Rate
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">

            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{
                    color: safeColors.primaryButton.bg,
                    backgroundColor: `${safeColors.primaryButton.bg}15`
                  }}
                >
                  FAQ
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                Frequently Asked <span style={{ color: safeColors.primaryButton.bg }}>Questions</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
                Got questions? We've got answers. Here are the most common questions about our {displayServiceName} services.
              </p>
            </div>

            {/* FAQ Accordion */}
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                {projectFaqs.map((faq: FAQItem, index: number) => (
                  <div
                    key={index}
                    className="group bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
                    style={{
                      border: `1px solid ${safeColors.primaryButton.bg}15`
                    }}
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-left flex items-center justify-between transition-all duration-300"
                      style={{
                        backgroundColor: openFAQ === index ? `${safeColors.primaryButton.bg}08` : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (openFAQ !== index) {
                          e.currentTarget.style.backgroundColor = `${safeColors.primaryButton.bg}05`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (openFAQ !== index) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: openFAQ === index ? safeColors.primaryButton.bg : `${safeColors.primaryButton.bg}15`
                          }}
                        >
                          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 pr-4 leading-tight">
                          {faq.question}
                        </h3>
                      </div>
                      <div
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                        style={{
                          backgroundColor: openFAQ === index ? safeColors.primaryButton.bg : `${safeColors.primaryButton.bg}15`,
                          transform: openFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                      >
                        {openFAQ === index ? (
                          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: safeColors.primaryButton.bg }} />
                        )}
                      </div>
                    </button>

                    {openFAQ === index && (
                      <div
                        className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 transition-all duration-300"
                        style={{
                          borderTop: `1px solid ${safeColors.primaryButton.bg}20`
                        }}
                      >
                        <div className="pt-4">
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-16">
              <div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl"
                style={{
                  backgroundColor: `${safeColors.primaryButton.bg}08`,
                  border: `1px solid ${safeColors.primaryButton.bg}20`
                }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: safeColors.primaryButton.bg }} />
                  <span className="text-gray-900 font-semibold text-sm sm:text-base">Still have questions?</span>
                </div>
                <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: safeColors.primaryButton.bg }} />
                  <span className="text-gray-600 text-sm sm:text-base">
                    <span className="font-bold text-gray-900">Call us</span> for immediate help
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>



        {cta1 && (
          <section
            className="py-16 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${safeColors.gradient.from}, ${safeColors.gradient.to})`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: safeColors.accent }}></div>
              <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '1s', backgroundColor: safeColors.primaryButton.bg }}></div>
              <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ animationDelay: '2s', backgroundColor: safeColors.accent }}></div>
            </div>

            <div className="container mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">

              {/* Section Header */}
              <div className="mb-12">
                <h2
                  className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white"
                >
                  {cta1.title}
                </h2>
                <p
                  className="text-xs sm:text-sm text-white/90 max-w-3xl mx-auto"
                >
                  {cta1.description}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">

                {/* Call Button */}
                <a
                  href={`tel:${phoneNumber}`}
                  className="group relative px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: safeColors.primaryButton.bg,
                    color: safeColors.primaryButton.text
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.bg}
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs font-semibold">Call Now</div>
                      <div className="text-sm font-bold">{phoneNumber}</div>
                    </div>
                  </div>
                </a>

                {/* Book Button */}
                <Link
                  href="/contact"
                  className="group relative px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs font-semibold">Book Online</div>
                      <div className="text-sm font-bold">Schedule Service</div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                  <span className="text-xs font-semibold">24/7 Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                  <span className="text-xs font-semibold">Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                  <span className="text-xs font-semibold">Same Day Service</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default DrainCleaning;
