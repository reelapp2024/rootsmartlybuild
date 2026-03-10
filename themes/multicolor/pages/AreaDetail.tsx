'use client';

import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useSEO } from '../../../hooks/useSEO';
import { httpFile } from "@/config";
import { getProjectId } from '../../../hooks/getProjectId';
import { generateFAQSchema, generateReviewSchema, generateServicesSchema } from "../../../hooks/schemaMarkup"
import { useTheme } from '../contexts/ThemeContext';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
// @ts-ignore - react-helmet-async may not be installed
import { Helmet, HelmetProvider } from 'react-helmet-async';
import DynamicFAIcon from '../../../extras/DynamicFAIcon';
import SchemaMarkup from '../components/SchemaMarkup';

import { Home, Heart, CheckCircle, Zap, Phone, Calendar, Award, Shield, Sparkles, Star, Wrench, StarHalf, Clock, ChevronUp, ChevronDown, Flag, Building, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { removeDot } from "../../../extras/removeDot.js";
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageBreadcrumb from '../components/PageBreadcrumb';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import ServicesSection from '../components/ServicesSection';
import BookingSection from '../components/BookingSection';
import WhyChooseUsSection from '../components/WhyChooseUsSection';
import ProcessSection from '../components/ProcessSection';
import { ArrowRight, Quote, HelpCircle, MessageSquare } from 'lucide-react';

import TestimonialsSection from '../components/TestimonialsSection';
import GuaranteeSection from '../components/GuaranteeSection';
import FAQSection from '../components/FAQSection';
import MapSection from '../components/MapSection';
import PageSchemaMarkup from '../components/PageSchemaMarkup';
import AreaSchemaMarkup from '../components/AreaSchemaMarkup';
import humanizeString from "../../../extras/stringUtils.js";
import { Card, CardContent } from "@/components/ui/card";

interface Testimonial {
  review_text?: string;
  customer_image?: string;
  customer_name?: string;
  rating?: number | string;
  [key: string]: unknown;
}

interface Guarantee {
  title?: string;
  description?: string;
  iconClass?: string;
  color?: string;
  bgColor?: string;
  [key: string]: unknown;
}

interface ProcessStep {
  title?: string;
  description?: string;
  iconClass?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  [key: string]: unknown;
}

interface ProjectService {
  _id?: string;
  service_name?: string;
  service_description?: string;
  images?: Array<{ url?: string }>;
  fas_fa_icon?: string;
  [key: string]: unknown;
}

interface StatItem {
  iconName?: string;
  value?: string;
  label?: string;
  [key: string]: unknown;
}

interface FAQItem {
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

interface ProjectLocation {
  _id?: string;
  name?: string;
  slug?: string;
  location_id?: string;
  [key: string]: unknown;
}
const colorSets = [
  {
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200'
  },
  {
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  }
];


// const colorSets = [
//   {
//     color: 'from-yellow-500 to-orange-500',
//     bgColor: 'bg-yellow-50'
//   },
//   {
//     color: 'from-green-500 to-emerald-500',
//     bgColor: 'bg-green-50'
//   },
//   {
//     color: 'from-blue-500 to-cyan-500',
//     bgColor: 'bg-blue-50'
//   },
//   {
//     color: 'from-purple-500 to-pink-500',
//     bgColor: 'bg-purple-50'
//   }
// ];

const staticHighlights = [
  { icon: Shield, text: 'Licensed & Insured Professionals' },
  { icon: Star, text: '10,000+ Satisfied Customers' },
  { icon: Heart, text: '24/7 Emergency Support' },
  { icon: Zap, text: 'Fast Response Times' }
];

const staticPromisePoints = [
  'Quick Response',
  'Efficient Solutions',
  'Stress-Free Experience',
  'Complete Satisfaction'
];


// const {
//   guarantees = [],
//   guaranteeText = '',
//   promiseLine = '',
//   projectCategory = '',
//   isLoading
// } = useGuaranteeData();

// Add color classes to each guarantee, repeating as needed






const AreaDetail = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { countryName } = params as { countryName?: string };
  const displayCountryName = humanizeString(countryName) || 'United States';
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  // Note: Next.js doesn't support route state, use localStorage instead
  const getLocationState = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('areaNavigationState');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
    }
    return {};
  };
  let { id, UpcomingPage, nextPage, locationName, sortname, _id } = getLocationState();

  const [refId, setRefId] = useState(() => {
    if (id) return id; // coming from internal navigation
    return ""; // will set after slugToPageType API call on refresh
  });
  const sanitize = (raw: any): string =>
    typeof raw === 'string'
      ? raw.trim().replace(/^[,\s"]+|[,\s"]+$/g, '')
      : '';


  const slug = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const [phoneNumber, setPhoneNumber] = useState("");
  interface WhyChooseUsFeature {
    title?: string;
    description?: string;
    iconClass?: string;
    [key: string]: unknown;
  }
  const [projectWhyChooseUs, setProjectWhyChooseUs] = useState<WhyChooseUsFeature[]>([]);
  const [projectName, setProjectName] = useState("");
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  // Add these inside your component to lift those values into state:

  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [guaranteeText, setGuaranteeText] = useState("");
  const [guaranteeText2, setGuaranteeText2] = useState("");
  const [promiseLine, setPromiseLine] = useState("");
  const [heroHeading, setHeroHeading] = useState("");

  const [projectCategory, setProjectCategory] = useState("");
  const [pageType, setPageType] = useState('');
  const [projectLocations, setProjectLocations] = useState<ProjectLocation[]>([]);
  const [projectServices, setprojectServices] = useState<ProjectService[]>([]);
  const [projectReviews, setProjectReviews] = useState<Testimonial[]>([]);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [projectFaqs, setprojectFaqs] = useState<FAQItem[]>([]);
  const [welcomeLine, setWelcomeLine] = useState("");
  const [showName, setShowName] = useState("");
  const [countryDescription, setCountryDescription] = useState("");
  const [stateDescription, setStateDescription] = useState("");
  const [cityDescription, setCityDescription] = useState("");
  const [localAreaDescription, setLocalAreaDescription] = useState("");
  const [projectDescription, setProjectDescription] = useState('');
  const [stats, setStats] = useState<StatItem[]>([]);
  const [pageLocation, setPageLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isHeroLoading, setIsHeroLoading] = useState(true);

  const [locInfo, setLocInfo] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [CTA, setCTA] = useState<CTAItem[]>([]);
  const { seoData } = useSEO(pathname);
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [heroImage, setHeroImage] = useState("");
  const [hero2Image, setHero2Image] = useState("");
  const [hero3Image, setHero3Image] = useState("");
  const [hero4Image, setHero4Image] = useState("");
  const areaSectionRef = useRef<HTMLDivElement>(null);

  const ctaSlotMap = {
    country: {
      slot1: 0, // first CTA
      slot2: 2, // third CTA
      slot3: 1, // second CTA
      slot4: 4, // fifth CTA
      slot5: 3  // fourth CTA
    },
    state: {
      slot1: 3, // fourth CTA
      slot2: 0, // first CTA
      slot3: 1, // second CTA
      slot4: 2, // third CTA
      slot5: 4  // fifth CTA
    },
    city: {
      slot1: 4, // second CTA
      slot2: 2, // third CTA
      slot3: 0, // first CTA
      slot4: 3, // fourth CTA
      slot5: 1  // fifth CTA
    },
    local_area: {
      slot1: 1, // second CTA
      slot2: 3, // fourth CTA
      slot3: 2, // third CTA
      slot4: 0, // first CTA
      slot5: 4  // fifth CTA
    }
  };

  const coloredGuarantees = (guarantees || []).map((g: Guarantee, i: number) => ({
    ...g,
    color: g.color || colorSets[i % colorSets.length].color,
    bgColor: g.bgColor || colorSets[i % colorSets.length].bgColor
  }));



  const getNextPage = () => {
    if (UpcomingPage === "country") return "States";
    if (UpcomingPage === "state") return "Cities";
    if (UpcomingPage === "city") return "Local Areas";
    if (UpcomingPage === "local") return "whole areas";
    return "";
  };



  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };


  interface CTAItem {
    title?: string;
    description?: string;
    [key: string]: unknown;
  }
  const renderCTA = (CTA: CTAItem[], pageType: string, slot: string, phoneNumber: string, projectCategory: string) => {
    const slotMap = (ctaSlotMap as Record<string, Record<string, number>>)[pageType] || {};
    const index = slotMap[slot];

    if (CTA.length === 0) return null;
    const cta = CTA[index] || CTA[0];

    return (
      <section className="py-12 relative overflow-hidden">
        {/* Dynamic Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`
          }}
        ></div>
        
        {/* Animated Background Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-20 animate-pulse" style={{ backgroundColor: colors.accent }}></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full opacity-30 animate-pulse" style={{ backgroundColor: colors.primaryButton.bg, animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full opacity-25 animate-pulse" style={{ backgroundColor: colors.accent, animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          <div className="text-center">
            <h2 className="font-bold text-white mb-4 max-w-2xl mx-auto">
              {cta.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
              {cta.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              {/* Call Button */}
              <a
                href={`tel:${phoneNumber}`}
                className="inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg"
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
                className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg"
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

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }}></div>
                <span className="text-xs font-semibold">24/7 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3B82F6' }}></div>
                <span className="text-xs font-semibold">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
                <span className="text-xs font-semibold">Same Day Service</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };


  const projectId = getProjectId();

  // Extract values from location state or URL

  // Get city name from URL for city/local area pages
  let cityName = pathname.split('/').pop() || '';
  console.log(cityName, showName,"initial city name cityNamecityNamecityNamecityName2222")
  cityName = showName ? showName : cityName

  console.log(cityName, "initial city name cityNamecityNamecityNamecityName")
  // Convert the first letter of each word to uppercase and the rest to lowercase
  cityName = (cityName || '').split(' ').map((word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');

  function formatLocation(input: string) {
    const [first, second] = input.split(",").map((s: string) => s.trim());
    if (!second) return input;
    return second.length <= 3
      ? `${first}, ${second.toUpperCase()}`
      : `${first}, ${second.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())}`;
  }


  console.log(cityName, "cityNamecityNamecityNamecityName")

  cityName = formatLocation(cityName)

  const getTruncatedDescription = (text: string | undefined) => {
    if (!text) return '';
    const idx = text.indexOf('.');
    return idx !== -1 ? text.substring(0, idx + 1) : text;
  };



  const getPageTitle = () => {
    switch (pageType) {
      case 'country':
        return `${projectCategory} services in ${cityName}`;
      case 'state':
        return `${cityName} ${projectCategory} Services`;
      case 'city':
        return `${cityName} ${projectCategory} Services`;
      case 'local_area':
        return `${cityName} ${projectCategory} Services`;
      default:
        return `${projectCategory} services`;
    }
  };

  const getPageDescription = () => {
    switch (pageType) {
      case 'country':
        return `${countryDescription} in ${humanizeString(pageLocation)}.`;
      case 'state':
        return ` ${stateDescription} `;
      case 'city':
        return ` ${cityDescription} `;
      case 'local_area':
        return `${localAreaDescription} `;
      default:
        return `${projectCategory} services.`;
    }
  };

  const getHeroIcon = () => {
    switch (pageType) {
      case 'country':
        return Flag;
      case 'state':
      case 'city':
        return Building;
      case 'local_area':
        return MapPin;
      default:
        return Flag;
    }
  };

  useEffect(() => {
    // Check localStorage for scroll flag (Next.js doesn't support route state)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('areaNavigationState');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state.scrollToAreaSection && areaSectionRef.current) {
            areaSectionRef.current.scrollIntoView({ behavior: "smooth" });
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [pathname]); // Runs when pathname changes



  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); // runs every time URL path changes

  useEffect(() => {
    if (heroImage && hero2Image && hero3Image && hero4Image) {
      setIsHeroLoading(false);  // Set to false when hero data is ready
    }
  }, [heroImage, hero2Image, hero3Image, hero4Image]);

  // First API call to determine page type
  useEffect(() => {
    const fetchPageType = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/slugToPageType", {
          projectId,
          slug
        });

        console.log(data, "<<<<<>>>>>>>>data of slug")

        if (data?.slugType) {
          setPageType(data.slugType);
        }

        if (data?.locationId) {
          setRefId(data.locationId);
        } else if (id) {
          setRefId(id);
        }
      } catch (error) {
        console.error("Error fetching page type:", error);
        setPageType('country');
      }
    };



    if (slug) {
      fetchPageType();
    }
  }, [slug, projectId]);

  // Second API call based on page type
  useEffect(() => {
    const fetchData = async () => {
      try {
        let apiPageType = pageType;
        let refId = id;
        let apiId = _id;
        let refLocation = slug;
        let reqFrom = "";

        switch (pageType) {
          case 'country':
            reqFrom = "cleaningCountry";
            break;
          case 'state':
            reqFrom = "cleaningState";
            break;
          case 'city':
            reqFrom = "cleaningCity";
            break;
          case 'local_area':
            reqFrom = "cleningArea";
            refLocation = slug;
            break;
        }

        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: apiPageType,
          refId: refId,
          _id: apiId,
          RefLocation: refLocation,
          reqFrom: reqFrom
        });

        if (data.projectInfo && data.projectInfo.serviceType) {

          console.log(data, "faq")
          setProcessSteps(data.projectInfo.ourProcessSection || []);

          setProjectCategory(data.projectInfo.serviceType);
          setWelcomeLine(data.projectInfo.welcomeLine);
          setProjectWhyChooseUs(data.projectInfo.whyChooseUsSection || []);
          setProjectName(data.projectInfo.projectName || "Our Team");

          // after fetching data:
          setGuarantees(data.projectInfo.ourGuaranteeSection || []);
          setGuaranteeText(data.projectInfo.ourGuaranteeText || "");
          setGuaranteeText2(data.projectInfo.ourGuaranteeText2 || "");

          setPromiseLine(data.projectInfo.promiseLine || "");
          setHeroHeading(data.projectInfo.heroHeading || "");
          console.log(data.projectInfo.heroHeading, "data.projectInfo.heroHeading data.projectInfo.heroHeading ")



          setProjectReviews(data.testimonials || []);
          setprojectFaqs(data.faq || []);
          setPageLocation(data.RefLocation || '');
          setShowName(data.showName);
          setPhoneNumber(data.aboutUs.phone);
          setCTA(data.projectInfo.cta || []); // <-- store CTA here
          setIsLoading(false);
          setHeroImage(data.projectInfo.images?.[0]?.url ?? "");
          setHero2Image(data.projectInfo.images?.[1]?.url ?? "");
          setHero3Image(data.projectInfo.images?.[2]?.url ?? "");
          setHero4Image(data.projectInfo.images?.[3]?.url ?? "");

          setProjectDescription(data.projectInfo.description || '');

          if (data.projectInfo.statsSection) {

            const fetchedStats = (data.projectInfo.statsSection || []).map((s: any) => ({
              serialno: s.serialno,
              iconName: sanitize(s.iconName),
              value: sanitize(s.value),
              label: sanitize(s.label),
            }));
            setStats(fetchedStats);

          }

          // Split projectDescription into two parts



          if (data.projectInfo.descriptions) {

            setCountryDescription(removeDot(data.projectInfo.description || "")); // Country description (index 0)
            setStateDescription(removeDot(data.projectInfo.description || ""));   // State description (index 1)
            setCityDescription(removeDot(data.projectInfo.description || ""));    // City description (index 2)
            setLocalAreaDescription(removeDot(data.projectInfo.description || "")); // Local Area description (index 3)
          }

          if (data.info && data.info.lat && data.info.lng) {
            setLocInfo({
              name: data.info.name,
              lat: data.info.lat,
              lng: data.info.lng
            });
          }

          // Set isHeroLoading to false once title and description are ready
          if (getPageTitle() && getPageDescription()) {
            setIsHeroLoading(false);
          }

        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    if (pageType) {
      fetchData();
    }
  }, [pageType, projectId, slug]);

  // Make sure this useEffect runs on mount, and when the pageType and refId are available
  useEffect(() => {
    const fetchAreasWeServe = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/area_we_serve", {
          projectId,
          pageType,
          refId
        });

        if (data && data.locations) {
          setProjectLocations(data.locations || []);
        }
      } catch (error) {
        console.error("Error fetching areas we serve:", error);
      }
    };

    // Check if pageType and refId are available
    if (pageType) {

      console.log("having page type and refid")
      fetchAreasWeServe();
    } else {
      console.log("not haveing page tiyep ofr refid", pageType, refId)
    }
  }, [projectId, pageType, refId]); // Add these as dependencies so it runs when they change


  useEffect(() => {
    // Check localStorage for scroll flag (Next.js doesn't support route state)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('areaNavigationState');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state.scrollToAreaSection && areaSectionRef.current) {
            areaSectionRef.current.scrollIntoView({ behavior: "smooth" });
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [pathname]);

  const handleLocationClick = (locationSlug: string) => {
    return `/${locationSlug}`;
  };

  const handleServiceClick = (service: any) => {
    const serviceName = service.service_name.toLowerCase().replace(/\s+/g, '-');

    // Build the new route using the current pathname
    const newRoute = `${pathname}/services/${serviceName}`;

    // Store service data in localStorage (Next.js doesn't support route state)
    if (typeof window !== 'undefined') {
      localStorage.setItem('serviceNavigationState', JSON.stringify({
        serviceId: service._id,
        serviceName: service.service_name,
        serviceDescription: service.service_description,
        locationName: cityName, // or your preferred location identifier
        serviceImage: service.images?.[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
        serviceImage1: service.images?.[1]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
        serviceImage2: service.images?.[2]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"
      }));
    }
    router.push(newRoute);
  };




  const getFirstSentence = (text: string) => {
    if (!text) return '';
    const idx = text.indexOf('.');
    return idx > -1 ? text.slice(0, idx + 1) : text;
  };



  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_services", {
          projectId,
        });

        if (data) {
          setprojectServices(data.services || []);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, [projectId]);

  const descriptionParts = projectDescription.split(/(?<=[.?!])\s+/); // splits by sentence endings
  const firstPart = descriptionParts.slice(0, 2).join(' ');
  const secondPart = descriptionParts.slice(2).join(' ');

  const coloredSteps = processSteps.map((step: ProcessStep, i: number) => ({
    ...step,
    color: step.color || colorSets[i % colorSets.length].color,
    bgColor: step.bgColor || colorSets[i % colorSets.length].bgColor,
    borderColor: step.borderColor || colorSets[i % colorSets.length].borderColor,
    number: (i + 1).toString()
  }));
  // Show skeleton loading state like header
  const showSkeleton = isHeroLoading || isLoading;

  // console.log(countryDescription,"countryDescriptioncountryDescriptioncountryDescriptioncountryDescription")

  const HeroIcon = getHeroIcon();
  // Extract route segments for dynamic breadcrumbs
  const segments = pathname.split('/').filter(Boolean); // removes empty strings due to leading '/'




  const faqSchema = generateFAQSchema(projectFaqs);
  const reviewSchema = generateReviewSchema(projectReviews);
  const servicesSchema = generateServicesSchema(projectServices);


  const areaName = cityName; // This would typically come from route params

  const breadcrumbItems = [
    { label: "Areas", href: "/areas" },
    { label: areaName }
  ];
  // Build breadcrumb data for schema from the same segments used by the UI
  const schemaBreadcrumbs = segments.map((segment: string, index: number) => {
    const url = '/' + segments.slice(0, index + 1).join('/');
    const name = segment
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { name, url };
  });

  console.log(seoData,"<<<<< seo data in area detail page seoDataseoDataseoDataseoDataseoData")

  return (

    <HelmetProvider>
      <Helmet>
        <title>{`${seoData?.meta_title} in ${cityName}`}</title>

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
      <SchemaMarkup areaId={refId} areaType={pageType} />

      <div className="min-h-screen font-poppins">



        {/* Breadcrumb */}


        <div className="min-h-screen font-poppins">


          <PageSchemaMarkup
            pageType="area-detail"
            pageTitle={seoData.meta_title}
            pageDescription={seoData.meta_description}
            breadcrumbs={schemaBreadcrumbs} // ← now matches the visible breadcrumb trail
            areaName={areaName}
            serviceName={projectCategory}
          />

          <AreaSchemaMarkup
            areaName={areaName}
            areaDescription={seoData.meta_description}
          />
          <Header />
          {/* Hero section */}
          <section
            id="home"
            className="relative min-h-screen flex items-center justify-center overflow-hidden pb-16 sm:pb-20 lg:pb-24"
            style={{
              backgroundImage: `url(${heroImage})`,
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
              <div className="absolute top-20 left-10 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ backgroundColor: colors.accent }}></div>
              <div className="absolute top-40 right-20 w-3 h-3 bg-accent/30 rounded-full animate-pulse" style={{ backgroundColor: colors.primaryButton.bg, animationDelay: '1s' }}></div>
              <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-primary/50 rounded-full animate-ping" style={{ backgroundColor: colors.accent, animationDelay: '2s' }}></div>
              <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-accent/40 rounded-full animate-pulse" style={{ backgroundColor: colors.primaryButton.bg, animationDelay: '3s' }}></div>
            </div>

            <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
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

                      {segments.map((segment, index) => {
                        const url = '/' + segments.slice(0, index + 1).join('/');
                        const isLast = index === segments.length - 1;

                        // Capitalize each segment for display
                        const displayName = segment
                          .split('-')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');

                        return (
                          <React.Fragment key={index}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                              {isLast ? (
                                <BreadcrumbPage className="font-medium text-xs" style={{ color: colors.primaryButton.bg }}>{displayName}</BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink asChild>
                                  <Link href={url} className="text-xs text-gray-600 hover:text-gray-900 transition-colors">{displayName}</Link>
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                          </React.Fragment>
                        );
                      })}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </div>

              <div className="max-w-5xl mx-auto pt-16 sm:pt-20 lg:pt-24">
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
                        {heroHeading}
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
                      <span style={{ color: colors.heading }}>
                        {cityName}
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
                        Services
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
                      {getPageDescription()}
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
          </section>





          {/* About Section */}
          <section id="about" className="py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              {/* Section Title */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4" style={{ backgroundColor: `${colors.primaryButton.bg}15` }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.primaryButton.bg }}></div>
                  <span className="text-sm font-semibold" style={{ color: colors.primaryButton.bg }}>About Us</span>
                </div>
                <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                  Professional <span style={{ color: colors.primaryButton.bg }}>{projectCategory}</span> You Can Trust
                </h2>
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Image - 5 columns */}
                <div className="lg:col-span-5 relative">
                  <div className="relative">
                    {/* Decorative Square */}
                    <div className="absolute -top-4 -left-4 w-20 h-20 rounded-2xl opacity-20" style={{ backgroundColor: colors.primaryButton.bg }}></div>
                    
                    {/* Main Image */}
                    <div className="relative rounded-3xl overflow-hidden h-[500px]">
                      <Image
                        src={hero2Image || '/placeholder.svg'}
                        alt="Professional services"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        quality={90}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      
                      {/* Licensed Badge */}
                      <div className="absolute bottom-6 left-6 bg-white rounded-xl px-4 py-3 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.primaryButton.bg }}></div>
                          <span className="text-gray-900 font-semibold text-sm">Licensed Professional</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content - 7 columns */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Description */}
                  <div className="space-y-6">
                    <p className="text-xs sm:text-sm md:text-lg text-gray-700 leading-relaxed">
                      {firstPart}
                    </p>
                    <p className="text-xs sm:text-sm md:text-lg text-gray-700 leading-relaxed">
                      {secondPart}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat: StatItem, index: number) => (
                      <div key={index} className="text-center group">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: `${colors.primaryButton.bg}15`, border: `2px solid ${colors.primaryButton.bg}30` }}>
                          <div style={{ color: colors.primaryButton.bg }}>
                            <DynamicFAIcon iconClass={stat.iconName || ''} className="text-2xl" />
                          </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: colors.primaryButton.bg }}>{stat.value}</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Services Section */}
          <section id="services" className="py-16 bg-white">
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
                    Our Services
                  </span>
                </div>
                <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                  Professional <span style={{ color: colors.primaryButton.bg }}>{projectCategory}</span> Services {cityName}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
                  Comprehensive {projectCategory} solutions delivered by experienced professionals. We ensure quality results for every project.
                </p>
              </div>

              {/* Services Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projectServices.map((service: ProjectService, index: number) => {
                  const serviceName = (service.service_name || '').toLowerCase().replace(/\s+/g, '-');
                  const servicePath = `${pathname}/services/${serviceName}`;
                  return (
                    <Link
                      key={index}
                      href={servicePath}
                      rel="noopener noreferrer"
                      onClick={() => {
                        // Store service data in localStorage (Next.js doesn't support route state)
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('serviceNavigationState', JSON.stringify({
                            serviceId: service._id,
                            serviceName: service.service_name,
                            serviceDescription: service.service_description,
                            locationName: cityName,
                            serviceImage: service.images?.[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
                            serviceImage1: service.images?.[1]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
                            serviceImage2: service.images?.[2]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"
                          }));
                        }
                      }}
                      className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                      style={{
                        border: `1px solid ${colors.primaryButton.bg}15`
                      }}
                    >
                      {/* Image Container */}
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={service.images?.[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"}
                          alt={service.service_name || 'Service'}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={85}
                          loading="lazy"
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                        
                        {/* Icon */}
                        <div 
                          className="absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: `2px solid ${colors.primaryButton.bg}30`
                          }}
                        >
                          <i 
                            className={`${service.fas_fa_icon} text-xl`}
                            style={{ color: colors.primaryButton.bg }}
                          ></i>
                        </div>

                        {/* Hover Border Effect */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            border: `2px solid ${colors.primaryButton.bg}40`,
                            boxShadow: `0 0 20px ${colors.primaryButton.bg}20`
                          }}
                        ></div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-3">
                        <h4 
                          className="font-bold text-lg leading-tight group-hover:transition-colors duration-300"
                          style={{ 
                            color: 'inherit'
                          } as React.CSSProperties & { '--hover-color': string }}
                        >
                          {service.service_name} {cityName}
                        </h4>
                        <p className="text-gray-600 leading-relaxed text-sm">
                          {getTruncatedDescription(service.service_description)}
                        </p>

                        {/* Bottom Accent Line */}
                        <div 
                          className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                          style={{
                            width: '2rem',
                            background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                          }}
                        ></div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
          {/* CTA */}

          {renderCTA(CTA, pageType, 'slot2', phoneNumber, projectCategory)}

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
                    Why Choose Us in {cityName}
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
                {projectWhyChooseUs.map((feature: WhyChooseUsFeature, index: number) => (
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
          {/* Process Section */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-8 lg:px-16">
              
              {/* Section Header */}
              <div className="text-center mb-16">
                <div className="inline-block mb-4">
                  <span 
                    className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                    style={{ 
                      color: colors.primaryButton.bg,
                      backgroundColor: `${colors.primaryButton.bg}15`
                    }}
                  >
                    Our Process
                  </span>
                </div>
                <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                  Our Simple <span style={{ color: colors.primaryButton.bg }}>Process </span>in {cityName}
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
                    background: `linear-gradient(to bottom, ${colors.primaryButton.bg}, ${colors.accent})`
                  }}
                ></div>

                {/* Process Steps */}
                <div className="space-y-12 lg:space-y-16">
                  {coloredSteps.map((step: ProcessStep & { number?: string }, index: number) => (
                    <div 
                      key={index} 
                      className={`flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col gap-8 lg:gap-12`}
                    >
                      {/* Content Card */}
                      <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8'} text-center lg:text-inherit`}>
                        <div 
                          className="inline-block rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 max-w-md w-full"
                          style={{
                            backgroundColor: `${colors.primaryButton.bg}08`,
                            border: `2px solid ${colors.primaryButton.bg}20`
                          }}
                        >
                          {/* Icon */}
                          {step.iconClass && (
                            <div className="flex justify-center mb-4">
                              <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                                style={{
                                  background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
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
                          <h3 className="font-bold text-gray-900 mb-4">{step.title}</h3>
                          <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
                        </div>
                      </div>

                      {/* Step Number Circle */}
                      <div className="relative z-10 hidden lg:block">
                        <div 
                          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                          }}
                        >
                          {step.number}
                        </div>
                        
                        {/* Arrow */}
                        {index < coloredSteps.length - 1 && (
                          <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
                            <ArrowRight 
                              className="w-6 h-6 rotate-90" 
                              style={{ color: colors.primaryButton.bg }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Mobile Step Number */}
                      <div className="lg:hidden">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                          }}
                        >
                          {step.number}
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
          {/* CTA */}

          {renderCTA(CTA, pageType, 'slot3', phoneNumber, projectCategory)}



          {/* Areas Section */}
          <section id="areas" className="py-16 bg-white">
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
                  Professional {projectCategory} throughout our availability.
                </p>
              </div>

              {/* Areas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {projectLocations.map((area: ProjectLocation, index: number) => (
                  <Link
                    key={index}
                    href={handleLocationClick(area.slug || '')}
                    onClick={() => {
                      // Store location data in localStorage (Next.js doesn't support route state)
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('areaNavigationState', JSON.stringify({
                          id: area.location_id,
                          projectId,
                          UpcomingPage,
                          nextPage: getNextPage(),
                          locationName: area.name,
                          sortname: sortname,
                          _id: area._id,
                        }));
                      }
                    }}
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
                    <div className="relative text-center space-y-6">
                      {/* Icon */}
                      <div className="flex justify-center">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                          }}
                        >
                          <MapPin className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Area Name */}
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {area.name}
                      </h3>

                      {/* Features */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${colors.primaryButton.bg}15`
                            }}
                          >
                            <Clock className="w-4 h-4" style={{ color: colors.primaryButton.bg }} />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">Response time: Extreme</span>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${colors.primaryButton.bg}15`
                            }}
                          >
                            <Shield className="w-4 h-4" style={{ color: colors.primaryButton.bg }} />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">100% Original services</span>
                        </div>
                      </div>

                      {/* Button */}
                      <button
                        className="w-full px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 inline-flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: colors.primaryButton.bg,
                          color: colors.primaryButton.text
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
                      >
                        <Phone className="w-4 h-4" />
                        See Areas
                      </button>

                      {/* Bottom Accent Line */}
                      <div 
                        className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                        style={{
                          width: '3rem',
                          background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                        }}
                      ></div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="text-center mt-16">
                <div 
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl"
                  style={{
                    backgroundColor: `${colors.primaryButton.bg}08`,
                    border: `1px solid ${colors.primaryButton.bg}20`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
                    <span className="text-gray-900 font-semibold text-sm sm:text-base">Serving {projectLocations.length}+ Areas</span>
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
            </div>
          </section>

          {/* Guarantee Section */}
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
                    Our Guarantee
                  </span>
                </div>
                <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                  Our <span style={{ color: colors.primaryButton.bg }}>{projectCategory}</span> Guarantee
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
                  {guaranteeText}
                </p>
              </div>

              {/* Guarantee Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {coloredGuarantees.map((guarantee, index) => (
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
                      {/* Icon */}
                      <div className="flex justify-center">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                          }}
                        >
                          {guarantee.iconClass
                            ? <DynamicFAIcon iconClass={guarantee.iconClass} className="text-white text-2xl" />
                            : <Award className="w-8 h-8 text-white" />
                          }
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
                          background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Highlights Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {staticHighlights.map((highlight, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-4 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      backgroundColor: `${colors.primaryButton.bg}08`,
                      border: `1px solid ${colors.primaryButton.bg}20`
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                      }}
                    >
                      <highlight.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-gray-900 font-semibold">{highlight.text}</span>
                  </div>
                ))}
              </div>

              {/* Promise Section */}
              <div 
                className="rounded-3xl p-12 text-center relative overflow-hidden"
                style={{
                  backgroundColor: `${colors.primaryButton.bg}08`,
                  border: `2px solid ${colors.primaryButton.bg}20`
                }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div 
                    className="absolute top-8 left-8 w-20 h-20 border-2 rounded-full"
                    style={{ borderColor: colors.primaryButton.bg }}
                  ></div>
                  <div 
                    className="absolute bottom-8 right-8 w-16 h-16 border-2 rounded-lg rotate-45"
                    style={{ borderColor: colors.accent }}
                  ></div>
                  <div 
                    className="absolute top-1/2 left-1/4 w-12 h-12 border rounded-full"
                    style={{ borderColor: colors.primaryButton.bg }}
                  ></div>
                </div>
                
                <div className="relative">
                  <div className="mb-8">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                      }}
                    >
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h3 
                      className="text-xl sm:text-2xl font-bold mb-6"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`,
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
                    <p className="text-base sm:text-lg text-gray-900 font-semibold leading-relaxed mb-8">
                      {promiseLine || `"We promise to fix your plumbing problems quickly and efficiently, so you can get back to enjoying your home without any stress or hassle!"`}
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 text-gray-600">
                      {staticPromisePoints.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-medium">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Testimonials */}



          {/* Testimonials Section */}
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
                    Customer Reviews
                  </span>
                </div>
                <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                  What Our <span style={{ color: colors.primaryButton.bg }}>Customers</span> Say
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
                  Don't just take our word for it. Here's what our satisfied customers have to say about our services.
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

                      {/* Quote Icon */}
                      <div className="flex justify-center mb-6">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
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
                            backgroundColor: `${colors.primaryButton.bg}10`
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
                          background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
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
                    backgroundColor: `${colors.primaryButton.bg}08`,
                    border: `1px solid ${colors.primaryButton.bg}20`
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



          {/* CTA */}

          {renderCTA(CTA, pageType, 'slot4', phoneNumber, projectCategory)}




          {locInfo && (
            <MapSection
              locationName={locInfo.name}
              lat={locInfo.lat}
              lng={locInfo.lng}
              pageType={pageType}
            />
          )}

          {/* FAQ Section */}


          {/* FAQ Section */}
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
                    FAQ
                  </span>
                </div>
                <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                  Frequently Asked <span style={{ color: colors.primaryButton.bg }}>Questions</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
                  Got questions? We've got answers. Here are the most common questions about our professional services.
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
                        border: `1px solid ${colors.primaryButton.bg}15`
                      }}
                    >
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-left flex items-center justify-between transition-all duration-300"
                        style={{
                          backgroundColor: openFAQ === index ? `${colors.primaryButton.bg}08` : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (openFAQ !== index) {
                            e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}05`;
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
                              backgroundColor: openFAQ === index ? colors.primaryButton.bg : `${colors.primaryButton.bg}15`
                            }}
                          >
                            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 pr-4 leading-tight">
                            {faq.question || ''}
                          </h3>
                        </div>
                        <div 
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                          style={{
                            backgroundColor: openFAQ === index ? colors.primaryButton.bg : `${colors.primaryButton.bg}15`,
                            transform: openFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        >
                          {openFAQ === index ? (
                            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          ) : (
                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
                          )}
                        </div>
                      </button>
                      
                      {openFAQ === index && (
                        <div 
                          className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 transition-all duration-300"
                          style={{
                            borderTop: `1px solid ${colors.primaryButton.bg}20`
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
                    backgroundColor: `${colors.primaryButton.bg}08`,
                    border: `1px solid ${colors.primaryButton.bg}20`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
                    <span className="text-gray-900 font-semibold text-sm sm:text-base">Still have questions?</span>
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
                    <span className="text-gray-600 text-sm sm:text-base">
                      <span className="font-bold text-gray-900">Call us</span> for immediate help
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </div>
    </HelmetProvider>
  );
};

export default AreaDetail;