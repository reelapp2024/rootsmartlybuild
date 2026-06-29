'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { Phone, Star, Sparkles, Home, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import humanizeString from "@/extras/stringUtils";
import { useParams, useRouter } from "next/navigation";

import Header from '@/themes/multicolor/components/Header';
import Footer from '@/themes/multicolor/components/Footer';
import PageBreadcrumb from '@/themes/multicolor/components/PageBreadcrumb';
import ServicesHero from '@/themes/multicolor/components/services/ServicesHero';
import ServicesSection from '@/themes/multicolor/components/ServicesSection';
import WhyChooseUsSimple from '@/themes/multicolor/components/WhyChooseUsSimple';
import WhyChooseUsSection from '@/themes/multicolor/components/WhyChooseUsSection';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useTheme } from '@/themes/multicolor/contexts/ThemeContext';

import GuaranteeSection from '@/themes/multicolor/components/GuaranteeSection';
import ProcessSection from '@/themes/multicolor/components/ProcessSection';
import AreasSection from '@/themes/multicolor/components/AreasSection';
import FAQSection from '@/themes/multicolor/components/FAQSection';
import BookingSection from '@/themes/multicolor/components/BookingSection';
import PageSchemaMarkup from '@/themes/multicolor/components/PageSchemaMarkup';
import ProcessSchemaMarkup from '@/themes/multicolor/components/ProcessSchemaMarkup';
import { httpFile } from "@/config";

interface CTAItem {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

const ServicesPageClient = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const pathname = usePathname();
  const router = useRouter();

  const breadcrumbItems = [
    { label: "Services" }
  ];
  const [phoneNumber, setPhoneNumber] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [CTA, setCTA] = useState<CTAItem[]>([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescriptions, setProjectDescriptions] = useState([]);
  let [locationName, setDisplayLocationName] = useState("");

  const formattedLocationName = locationName ? `in ${locationName}` : "";
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

  // Ensure pathname is defined before using it
  const currentPathname = pathname || '';
  const segments = currentPathname.split('/').filter(Boolean);

  let cumulativePath = '';

  // Remove trailing '/services' if present
  let locationSlug = currentPathname;

  // If pathname ends with '/services', remove it
  if (locationSlug.endsWith('/services')) {
    locationSlug = locationSlug.slice(0, -('/services'.length));
  }

  // Remove leading '/' if needed
  if (locationSlug.startsWith('/')) {
    locationSlug = locationSlug.slice(1);
  }

  console.log(locationSlug, "locationSlug");

  useEffect(() => {
    const fetchPageType = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/slugToPageType", {
          projectId,
          slug: locationSlug
        });

        console.log(data, "<<<<<>>>>>>>>data of slug")

        if (data?.slugType) {
          setDisplayLocationName(data.showName);
        }


      } catch (error) {
        console.error("Error fetching page type:", error);

      }
    };



    if (locationSlug) {
      fetchPageType();
    }
  }, [locationSlug, projectId]);


  useEffect(() => {
    const fetchBasicProjectInfo = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/basic_project_info", {
          projectId
        });

        if (data) {
          setProjectCategory(data.serviceType || "");
          setProjectName(data.projectName || "");
          setProjectDescriptions(data.descriptions || []);
        }
      } catch (error) {
        console.error("Error fetching basic project info:", error);
      }
    };

    if (projectId) {
      console.log("Fetching basic project info for projectId:", projectId);
      fetchBasicProjectInfo();
    } else {
      console.log("No projectId available for fetching basic project info");
    }
  }, [projectId]);


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
        setBackgroundImage(data.projectInfo.images?.[4]?.url || "");

        setProjectCategory(info.serviceType || '');

        setPhoneNumber(about.phone || '');
        // Split heroHeading intelligently


      } catch (err) {
        console.error('Fetch hero data error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [projectId]);

  const getCTAContent = (index: number): CTAItem => {
    if (CTA.length === 0) {
      return { title: "What are you waiting for?", description: "Contact us for our services" };
    }
    return CTA[index] || CTA[0];
  };

  // Generate title and description for PageSchemaMarkup
  const pageTitle = `Professional ${projectCategory || 'Services'} Services ${formattedLocationName}`;
  const pageDescription = `Comprehensive ${projectCategory || 'professional'} services including emergency repairs, installations, and more. Available 24/7 ${formattedLocationName ? formattedLocationName.replace('in ', '') : 'nationwide'}.`;

  console.log(formattedLocationName, "formattedLocationName in services page");


  return (
    <div className="min-h-screen font-poppins">
      <PageSchemaMarkup
        pageType="services"
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        breadcrumbs={[{ name: "Services", url: "/services" }]}
      />
      <ProcessSchemaMarkup />
      <Header />
      {/* Hero Section */}
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
                      <BreadcrumbPage className="font-medium text-xs" style={{ color: colors.primaryButton.bg }}>Services</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>

            <div className="pt-16 sm:pt-20 lg:pt-24">
              <div className="text-center lg:text-left space-y-6 relative z-20">

                {isLoading ? (
                  /* Skeleton Loading */
                  <>
                    {/* Badge Skeleton */}
                    <div className="inline-block mb-4">
                      <div className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-2.5 animate-pulse">
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        <div className="h-4 w-56 bg-gray-300 rounded"></div>
                      </div>
                    </div>

                    {/* Heading Skeleton */}
                    <div className="space-y-2">
                      <div className="h-7 sm:h-8 md:h-10 lg:h-12 xl:h-14 w-full max-w-2xl bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-7 sm:h-8 md:h-10 lg:h-12 xl:h-14 w-3/4 max-w-xl bg-gray-200 rounded animate-pulse"></div>
                    </div>

                    {/* Subheading Skeleton */}
                    <div className="space-y-2 max-w-3xl mx-auto lg:mx-0">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
                    </div>

                    {/* CTA Buttons Skeleton */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">
                      <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="h-12 w-44 bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Badge */}
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

                    {/* Main Heading */}
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black leading-[1.1] tracking-tight">
                      <span style={{ color: colors.heading }}>
                        Professional
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
                        {projectCategory}
                      </span>{' '}
                      <span style={{ color: colors.heading }}>
                        Services {formattedLocationName}
                      </span>
                    </h1>

                    {/* Subheading */}
                    <p
                      className="text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto lg:mx-0 leading-relaxed"
                      style={{ color: colors.description }}
                    >
                      {projectDescriptions[2] || "Professional services tailored to meet your needs with quality and reliability."}
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
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={backgroundImage || '/placeholder.svg'}
                alt="Professional Services"
                className="w-full h-[500px] object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
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
                <span className="text-gray-900 font-semibold text-sm">Our Services</span>
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
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`,
            zIndex: -1
          }}
        >
          {/* Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${colors.gradient.from}CC, ${colors.gradient.to}CC)`
            }}
          ></div>
        </div>
      </section>




      <ServicesSection formattedLocationName={formattedLocationName} />
      <WhyChooseUsSection />
      <GuaranteeSection />
      <ProcessSection />
      <AreasSection />
      <FAQSection />
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
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 max-w-2xl mx-auto leading-tight">
              {getCTAContent(4).title}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-2xl mx-auto leading-relaxed">
              {getCTAContent(4).description}
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
      <Footer />
    </div>
  );
};

export default ServicesPageClient;

