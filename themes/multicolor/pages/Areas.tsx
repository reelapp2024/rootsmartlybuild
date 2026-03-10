'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { httpFile } from "@/config";
import { MapPin, Clock, Award, Phone, Star, Sparkles, Eye, Home, Wrench, Calendar } from 'lucide-react';

import Header from '../components/Header';
import Footer from '../components/Footer';
import PageBreadcrumb from '../components/PageBreadcrumb';
import AreasHero from '../components/areas/AreasHero';
import AreasGrid from '../components/areas/AreasGrid';
import WhyChooseUsSimple from '../components/WhyChooseUsSimple';
import FAQSection from '../components/FAQSection';
import PageSchemaMarkup from '../components/PageSchemaMarkup';
import SEOHead from '../components/SEOHead';
import { Button } from '@/components/ui/button';
// @ts-ignore - react-helmet-async may not be installed
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useSEO } from '../../../hooks/useSEO';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getProjectId } from '../../../hooks/getProjectId';
import { Card, CardContent } from '@/components/ui/card';
import DynamicFAIcon from '../../../extras/DynamicFAIcon';
import { useTheme } from '../contexts/ThemeContext';

const Areas = () => {
  const breadcrumbItems = [
    { label: "Areas" }
  ];
  interface WhyChooseUsFeature {
    title?: string;
    description?: string;
    iconClass?: string;
    [key: string]: unknown;
  }
  interface AreaLocation {
    _id?: string;
    name?: string;
    slug?: string;
    location_id?: string;
    sortname?: string;
    description?: string;
    [key: string]: unknown;
  }
  interface CTAItem {
    title?: string;
    description?: string;
    [key: string]: unknown;
  }
  const [whyChooseUsAboutPage, setWhyChooseUsAboutPage] = useState<WhyChooseUsFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { seoData } = useSEO('/areas');
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [aboutHeroText, setAboutHeroText] = useState('');
  const [projectCategory, setProjectCategory] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [projectName, setProjectName] = useState("");

  const [welcomeLine, setWelcomeLine] = useState("");

  const [UpcomingPage, setUpcomingPage] = useState("");
  const [locations, setLocations] = useState<AreaLocation[]>([]);
  const [CTA, setCTA] = useState<CTAItem[]>([]);
  const router = useRouter();
  const pathname = usePathname();


  const projectId = getProjectId();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); // runs every time URL path changes


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hero text from my_site API
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
        });

        if (data.projectInfo && data.projectInfo.aboutHeroText) {
          setAboutHeroText(data.projectInfo.aboutHeroText);
          setProjectCategory(data.projectInfo.serviceType);
          setPhoneNumber(data.aboutUs.phone);
          setWhyChooseUsAboutPage(data.projectInfo.whyChooseUsAboutPage)
          setProjectName(data.projectInfo.projectName);
          setCTA(data.projectInfo.cta || []);

          setHeroImage(data.projectInfo.images[4].url);



        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "servicesAreas"

        });

        if (data.projectInfo && data.projectInfo.serviceType) {
          setProjectCategory(data.projectInfo.serviceType);
          setWelcomeLine(data.projectInfo.welcomeLine);
          setPhoneNumber(data.aboutUs.phone);
          setUpcomingPage(data.upcomingPage);
          setLocations(data.locations);
        }

        console.log(data.slug, "data.slug")
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  console.log(locations, "locations");

  const handleLocationClick = (area: AreaLocation, isButtonClick?: boolean) => {
    const slugPath = `/${area.slug || ''}`;

    // If navigating to this page, pass the scroll flag
    if (pathname === slugPath) {
      const areaSection = document.getElementById("area-we-serve-section");
      if (areaSection && isButtonClick) {
        const yOffset = -100; // Adjust for header
        const y = areaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Store state in localStorage for Next.js (since it doesn't support route state)
      if (typeof window !== 'undefined') {
        const projectId = getProjectId();
        localStorage.setItem('areaNavigationState', JSON.stringify({
          id: area.location_id,
          projectId,
          UpcomingPage,
          nextPage: getNextPage(),
          locationName: area.name,
          sortname: area.sortname,
          _id: area._id,
          scrollToAreaSection: isButtonClick, // Only set to true when button clicked
        }));
      }
      router.push(slugPath);
    }
  };
  const getNextPage = () => {
    if (UpcomingPage === 'country') return 'States';
    if (UpcomingPage === 'state') return 'Cities';
    if (UpcomingPage === 'city') return 'Local Areas';
    if (UpcomingPage === 'local') return 'whole areas';
    return '';
  };

  const getCTAContent = (index: number): CTAItem => {
    if (CTA.length === 0) {
      return { title: "Ready to Get Started?", description: "Contact us for professional services in your area" };
    }
    return CTA[index] || CTA[0];
  };


  // Show skeleton loading state like header
  const showSkeleton = isLoading;

  return (

    <HelmetProvider>
      <Helmet>
        <title>{seoData.meta_title}</title>
        <meta name="description" content={seoData.meta_description} />
        <meta name="keywords" content={seoData.meta_keywords} />
      </Helmet>


      <div className="min-h-screen font-poppins">

        <PageSchemaMarkup
          pageType="areas"
          pageTitle={seoData.meta_title}
          pageDescription={seoData.meta_description}
          breadcrumbs={[{ name: "Areas", url: "/areas" }]}
        />
        <Header />
        
        {/* Hero section */}
        <section
          id="home"
          className="relative min-h-screen flex items-center overflow-hidden pb-16 sm:pb-20 lg:pb-24"
          style={{
            backgroundColor: colors.surface
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
                        <BreadcrumbPage className="font-medium text-xs" style={{ color: colors.primaryButton.bg }}>Areas We Serve</BreadcrumbPage>
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
                          color: colors.heading,
                          backgroundColor: `${colors.primaryButton.bg}15`
                        }}
                      >
                        <Star className="w-4 h-4" />
                        Professional Services Available
                      </span>
                    </div>
                  )}

                  {/* Main Heading */}
                  {showSkeleton ? (
                    <div className="space-y-3">
                      <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-1/2 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <h1 className="font-black">
                      <span style={{ color: colors.heading }}>
                        Areas We
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
                        Serve
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
                      style={{ color: colors.description }}
                    >
                      Professional <span className="font-bold">{projectCategory}</span> {aboutHeroText}.
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
                      </>
                    )}
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-6">
                    <div className="flex items-center gap-2" style={{ color: colors.description }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }}></div>
                      <span className="text-xs font-semibold">24/7 Available</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: colors.description }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3B82F6' }}></div>
                      <span className="text-xs font-semibold">Licensed & Insured</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: colors.description }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
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
                  src={heroImage || '/placeholder.svg'}
                  alt="Professional Services"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0vw, 50vw"
                  quality={90}
                />
                
                {/* Gradient Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.gradient.from}20, ${colors.gradient.to}20)`
                  }}
                ></div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl opacity-20" style={{ backgroundColor: colors.primaryButton.bg }}></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl opacity-15" style={{ backgroundColor: colors.accent }}></div>
              
              {/* Floating Badge */}
              <div className="absolute top-6 right-6 bg-white rounded-xl px-4 py-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.primaryButton.bg }}></div>
                  <span className="text-gray-900 font-semibold text-sm">Professional Service</span>
                </div>
              </div>
            </div>
            
            {/* Animated Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 right-10 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ backgroundColor: colors.accent }}></div>
              <div className="absolute top-40 right-20 w-3 h-3 bg-accent/30 rounded-full animate-pulse" style={{ backgroundColor: colors.primaryButton.bg, animationDelay: '1s' }}></div>
              <div className="absolute bottom-32 right-1/4 w-2 h-2 bg-primary/50 rounded-full animate-ping" style={{ backgroundColor: colors.accent, animationDelay: '2s' }}></div>
              <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-accent/40 rounded-full animate-pulse" style={{ backgroundColor: colors.primaryButton.bg, animationDelay: '3s' }}></div>
            </div>
          </div>

          {/* Mobile Background Image */}
          <div
            className="lg:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: heroImage ? `url(${heroImage})` : `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`,
              zIndex: -1
            }}
          >
            {/* Gradient Overlay */}
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
          </div>
        </section>
        {/* <AreasGrid /> */}
        {/* Areas grid */}


        {/* Areas We Serve Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">
            
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span 
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{ 
                    color: colors.primaryButton.bg,
                    backgroundColor: `${colors.primaryButton.bg}15`
                  }}
                >
                  Service Areas
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                Areas We <span style={{ color: colors.primaryButton.bg }}>Serve</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
                Professional <span className="font-bold">{projectCategory}</span> services throughout our availability.
              </p>
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
              {locations.slice(0, 6).map((location, index) => (
                <div 
                  key={location._id || index}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleLocationClick(location, false)}
                >
                  {/* Hover Border Effect */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      border: `2px solid ${colors.primaryButton.bg}40`,
                      boxShadow: `0 0 20px ${colors.primaryButton.bg}20`
                    }}
                  ></div>

                  {/* Content */}
                  <div className="relative">
                    {/* Icon and Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${colors.primaryButton.bg}15` }}
                      >
                        <MapPin className="w-6 h-6" style={{ color: colors.primaryButton.bg }} />
                      </div>
                      <span 
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ 
                          color: colors.primaryButton.bg,
                          backgroundColor: `${colors.primaryButton.bg}15`
                        }}
                      >
                        Available
                      </span>
                    </div>

                    {/* Location Info */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                        {location.name}
                      </h3>
                      {location.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {location.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Accent Line */}
                    <div 
                      className="h-1 rounded-full transition-all duration-300 group-hover:w-full mt-4"
                      style={{
                        width: '2rem',
                        background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Locations Button */}
            {locations.length > 6 && (
              <div className="text-center mb-8">
                <button
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: colors.primaryButton.bg,
                    color: colors.primaryButton.text
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
                  onClick={() => {
                    const areasSection = document.getElementById('areas-grid-section');
                    if (areasSection) {
                      areasSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <MapPin className="w-5 h-5" />
                  View All {locations.length} Locations
                </button>
              </div>
            )}

            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
                <span className="text-gray-900 font-semibold text-sm sm:text-base">Serving {locations.length}+ Areas</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div className="text-gray-600 text-sm sm:text-base">
                <span className="font-bold text-gray-900">24/7</span> Emergency Service
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div className="text-gray-600 text-sm sm:text-base">
                <span className="font-bold text-gray-900">100%</span> Coverage
              </div>
            </div>
          </div>
        </section>

        {/* Areas Grid Section */}
        <section id="areas-grid-section" className="py-20 bg-background">
          <div className="container mx-auto px-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              {locations.map((area, index) => (
                <div
                  key={area.name}
                  className={`group relative bg-card rounded-2xl p-6 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 animate-card-fade-up stagger-${Math.min(index + 1, 8)} hover-float hover-glow`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-shift bg-[length:200%_200%]"></div>

                  <div
                    className="relative cursor-pointer" // Add cursor-pointer here for the div
                    onClick={() => handleLocationClick(area, false)} // pass false for div click
                  >
                    <div className="flex items-center justify-between mb-4">
                      <MapPin className="w-8 h-8 text-primary animate-icon-bounce" style={{ animationDelay: `${index * 0.1}s` }} />
                      <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full animate-badge-bounce" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                        Available 24/7
                      </span>
                    </div>

                    <h3 className="font-bold text-card-foreground mb-3 animate-text-slide-left" style={{ animationDelay: `${index * 0.1 + 0.3}s` }}>
                      {area.name}
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed animate-subtitle-fade-in" style={{ animationDelay: `${index * 0.1 + 0.4}s` }}>
                      {area.description}
                    </p>

                    <div className="flex items-center justify-between animate-cta-zoom-in" style={{ animationDelay: `${index * 0.1 + 0.5}s` }}>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors duration-300 hover-float"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent div click
                          handleLocationClick(area, true);
                        }}
                      >
                        View locations
                      </Button>
                      <div className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: `${index * 0.1 + 0.6}s` }}>
                      
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">
            
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span 
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{ 
                    color: colors.primaryButton.bg,
                    backgroundColor: `${colors.primaryButton.bg}15`
                  }}
                >
                  Why Choose Us
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                Why Choose <span style={{ color: colors.primaryButton.bg }}>{projectName}</span>?
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
                When you choose us, you're choosing quality, reliability, and exceptional service that's backed by years of experience and thousands of satisfied customers.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyChooseUsAboutPage.map((feature, index) => (
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
                        {feature.iconClass ? (
                          <div style={{ color: colors.primaryButton.bg }}>
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
                        background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
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
                {getCTAContent(0).title}
              </h2>
              <p className="text-xs sm:text-sm text-white/90 max-w-2xl mx-auto leading-relaxed">
                {getCTAContent(0).description}
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
                  <div className="text-xs font-semibold opacity-90 uppercase tracking-wide">Emergency Call</div>
                  <div className="text-sm font-bold">{phoneNumber}</div>
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
                  <div className="text-xs font-semibold opacity-90 uppercase tracking-wide">Book Online</div>
                  <div className="text-sm font-bold">Schedule Service</div>
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
                <span className="text-xs font-semibold">24/7 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.primaryButton.bg }}
                ></div>
                <span className="text-xs font-semibold">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.accent }}
                ></div>
                <span className="text-xs font-semibold">Same Day Service</span>
              </div>
            </div>
          </div>
        </section>

        <FAQSection />
        <Footer />
      </div>

    </HelmetProvider>
  );
};

export default Areas;
