import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Star, StarHalf, Quote } from "lucide-react";

import { useMemo } from 'react';
import CleaningHeader from '../components/CleaningHeader';
import CleaningCTA from '../components/CleaningCTA';
import CleaningAboutUs from '../components/CleaningAboutUs';
import CleaningProcess from '../components/CleaningProcess';
import CleaningBeforeAfter from '../components/CleaningBeforeAfter';
import CleaningWhyChooseUs from '../components/CleaningWhyChooseUs';
import CleaningGuarantee from '../components/CleaningGuarantee';
import CleaningRelatedServices from '../components/CleaningRelatedServices';
import CleaningServiceAreas from '../components/CleaningServiceAreas';
import CleaningFooter from '../components/CleaningFooter';
import CleaningLoader from '../components/CleaningLoader';
import { Sparkles, Phone, CheckCircle } from 'lucide-react';
import { httpFile } from "../../../config.js";
import humanizeString from "../../../extras/stringUtils.js";
import DynamicFAIcon from '../../../extras/DynamicFAIcon.js';
import { removeDot } from "../../../extras/removeDot.js";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { slugify } from "../../../extras/slug";
import { useSEO } from '../../../hooks/useSEO';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';

const CleaningServiceDetail = () => {
  let { serviceName: urlServiceName } = useParams();
  const [projectOurProcess, setprojectOurProcess] = useState([]);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [serviceImage, setServiceImage] = useState("");
  const [ProjectBaseImage, setProjectBaseImage] = useState("");
  const [stepProcess, setStepProcess] = useState([]);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reloadFlag, setReloadFlag] = useState(0);
  const [aboutService, setAboutService] = useState('');
  const [subServices, setSubServices] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const projectId = import.meta.env.VITE_PROJECT_ID;
  const [serviceId, setServiceId] = useState(location.state?.serviceId || "");
  let displayServiceName = humanizeString(urlServiceName) || 'Residential Cleaning';
  const [guarantees, setGuarantees] = useState([]);
  const [guaranteeText, setGuaranteeText] = useState("");
  const [promiseLine, setPromiseLine] = useState("");
  const [projectCategory, setProjectCategory] = useState("");
  const [projectName, setprojectName] = useState("");
  const [locationName, setDisplayLocationName] = useState("");
  const [areaType, setAreaType] = useState("");
  const [areaId, setAreaId] = useState("");
  const [cta1, setCta1] = useState(null);
  const [cta2, setCta2] = useState(null);
  const [cta3, setCta3] = useState(null);
  const [cta4, setCta4] = useState(null);
  const [projectReviews, setProjectReviews] = useState<Testimonial[]>([]);

  const [projectWhyChooseUs, setprojectWhyChooseUs] = useState([]);
  const [projectFaqs, setprojectFaqs] = useState([]);
  const [slugApiCompleted, setSlugApiCompleted] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      setCurrentTheme(getThemeByName(savedTheme));
    }
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setSelectedTheme(newTheme);
      setCurrentTheme(getThemeByName(newTheme));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  interface Testimonial {
    review_text: string;
    customer_image: string;
    customer_name: string;
    rating: number | string;
  }

  // Extract the slug after "/services/"
  const serviceSlug = useMemo(() => {
    const segments = location.pathname.split('/');
    const idx = segments.findIndex(s => s === 'services');
    return idx >= 0 && segments[idx + 1] ? segments[idx + 1] : '';
  }, [location.pathname]);

  console.log(slugify(serviceSlug), "serviceSlug<<<<<<>>>>>>>>>><<<<<<<<<<<<<>>>>>>>>>>>>>>>");

  const pathname = location.pathname;

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

        console.log(data, "<<<<<>>>>>>>>data of slug type useful for unique data of service");

        if (data?.slugType) {
          setDisplayLocationName(data.showName);
          setAreaType(data.slugType);
          setAreaId(data.locationId);
        }
      } catch (error) {
        console.error("Error fetching page type:", error);
      } finally {
        setSlugApiCompleted(true);
      }
    };

    if (locationSlug) {
      fetchPageType();
    } else {
      setSlugApiCompleted(true);
    }
  }, [locationSlug, projectId]);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme && colorThemes.find(theme => theme.name === savedTheme)) {
      setSelectedTheme(savedTheme);
      setCurrentTheme(getThemeByName(savedTheme));
    }
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setSelectedTheme(newTheme);
      setCurrentTheme(getThemeByName(newTheme));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // Update SEO payload to include locationSlug
  const seoPayload = locationSlug ? `/${locationSlug}/services/${slugify(serviceSlug)}` : `/services/${slugify(serviceSlug)}`;
  const { seoData } = useSEO(seoPayload);

  displayServiceName = location.state?.locationName ? displayServiceName : removeDot(displayServiceName);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("locaitonname", locationName);
  }, [locationName]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setServiceId(location.state?.serviceId || "");
    setReloadFlag(prev => prev + 1);
  }, [urlServiceName]);

  useEffect(() => {
    const fetchServiceId = async () => {
      if (!serviceId && displayServiceName && slugApiCompleted) {
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
  }, [projectId, urlServiceName, displayServiceName, slugApiCompleted, reloadFlag]);

  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId || !slugApiCompleted) return;

      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_service", { serviceId, areaType, areaId });

        console.log(areaType, areaId);
        if (data.service) {
          setServiceDetails(data.service);
          setServiceImage(data.service.images?.[0]?.url || "");
          setProjectBaseImage(data.service.images?.[2]?.url || "");
          setStepProcess(data.service.steps_process || []);
          setAboutService(data.service.about_service || '');
          setCta1(data.cta1 || null);
          setCta2(data.cta2 || null);
          setCta3(data.cta3 || null);
          setCta4(data.cta4 || null);
          setGuarantees(data.service.ourGuaranteeSection || []);
          setGuaranteeText(data.service.ourGuaranteeText || "");
          setPromiseLine(data.service.promiseLine || "");
          setprojectWhyChooseUs(data.service.whyChooseUsSection || []);
          setProjectReviews(data.testimonials || []);

          setprojectFaqs(data.faq || []);

          // Parse subServices from comma-separated string
          const subServicesArray = Array.isArray(data.service.subServices)
            ? data.service.subServices.map(item => item.trim()).filter(Boolean)
            : typeof data.service.subServices === 'string'
              ? data.service.subServices.split(',').map(item => item.trim()).filter(Boolean)
              : [];

          setSubServices(subServicesArray);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching service details:", error);
      }
    };

    fetchServiceData();
  }, [serviceId, slugApiCompleted, areaType, areaId]);

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

  const hasLocationName = Boolean(location.state?.locationName);
  let inlocationName = '';
  if (hasLocationName) {
    inlocationName = `in ${location.state?.locationName}`;
  }

  const rawDescription = serviceDetails?.service_description || "";
  const cleaned = removeDot(rawDescription);
  const displayServiceDescription = location.state?.locationName
    ? `${cleaned} in ${location.state.locationName}.`
    : cleaned;

  const displayServiceImage = serviceImage || '';

  if (isLoading) return <CleaningLoader />;

  return (
    <HelmetProvider>
      <Helmet>
        <title>{`${seoData?.meta_title} ${locationName}`}</title>
        <meta name="description" content={seoData.meta_description} />
        <meta name="keywords" content={seoData.meta_keywords} />
      </Helmet>
      <div className="min-h-screen font-poppins">
        <CleaningHeader />


        <section 
          className="relative py-20 text-white overflow-hidden min-h-[600px] flex items-center"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
          }}
        >
          
          {/* animated dots */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  width: Math.random() * 4 + 2 + 'px',
                  height: Math.random() * 4 + 2 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  backgroundColor: currentTheme.elements.accent,
                  animationDelay: Math.random() * 3 + 's',
                  animationDuration: Math.random() * 3 + 2 + 's'
                }}
              />
            ))}
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <Sparkles 
                    className="w-8 h-8 mr-3" 
                    style={{ color: currentTheme.elements.accent }}
                  />
                  <h1 
                    className="text-4xl md:text-5xl font-bold"
                    style={{ color: currentTheme.elements.heading }}
                  >
                    {displayServiceName} {locationName}
                  </h1>
                </div>
                <p 
                  className="text-xl mb-8"
                  style={{ color: currentTheme.elements.description }}
                >
                  <span className="text-lg">{displayServiceDescription}</span>
                </p>
                <div className="flex items-center space-x-4">
                  <a
                    href={`tel:${phoneNumber}`}
                    className="group px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center space-x-3 w-full sm:w-auto justify-center shadow-xl transform hover:scale-105"
                    style={{
                      backgroundColor: currentTheme.elements.primaryButton.bg,
                      color: currentTheme.elements.primaryButton.text
                    }}
                  >
                    <Phone size={24} className="group-hover:animate-pulse" />
                    <span>Call Now: {phoneNumber}</span>
                  </a>
                </div>
              </div>
              <div>
                <img 
                  src={displayServiceImage} 
                  alt={displayServiceName} 
                  className="rounded-2xl shadow-2xl" 
                  onError={(e) => {
                    console.log('❌ Service image failed to load:', displayServiceImage);
                    (e.target as HTMLImageElement).src = "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg";
                  }}
                />
              </div>
            </div>

            {/* Breadcrumb at bottom */}
            <div className="flex justify-center mt-12">
                <Breadcrumb>
                  <BreadcrumbList>
                    {/* Home */}
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                      <Link to="/" className="flex items-center" style={{ color: currentTheme.elements.description }}>
                          <Home className="w-4 h-4 mr-1" />
                          Home
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>

                    {/* Dynamic segments */}
                    {(() => {
                      const segments = location.pathname.split('/').filter(Boolean);
                      let cumulativePath = '';
                      return segments.map((segment, index) => {
                        cumulativePath += `/${segment}`;
                        const isLast = index === segments.length - 1;
                        const displayName = segment === 'services'
                          ? 'Services'
                          : humanizeString(segment);

                        return (
                          <React.Fragment key={index}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                              {isLast ? (
                              <BreadcrumbPage className="font-medium" style={{ color: currentTheme.elements.accent }}>
                                  {displayName}
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink asChild>
                                <Link to={cumulativePath} style={{ color: currentTheme.elements.description }}>{displayName}</Link>
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
        </section>

        {/* About Section */}
        {aboutService && (
          <section 
            className="py-16 font-poppins relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: Math.random() * 6 + 3 + 'px',
                    height: Math.random() * 6 + 3 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                    backgroundColor: currentTheme.elements.accent,
                    animationDelay: Math.random() * 3 + 's',
                    animationDuration: Math.random() * 3 + 2 + 's'
                  }}
                />
              ))}
          </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              {/* Header Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center mb-6">
                  <div 
                    className="w-12 h-1 rounded-full mr-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: currentTheme.elements.accent }}
                  >
                    About Service
                  </span>
                  <div 
                    className="w-12 h-1 rounded-full ml-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
        </div>

                <h2 
                  className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                  style={{ color: currentTheme.elements.surface }}
                >
                  About {displayServiceName}
                </h2>
                </div>

              {/* Content Section */}
              <div 
                className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2"
                style={{ borderColor: currentTheme.elements.ring }}
              >
                {/* Decorative Elements */}
                <div 
                  className="absolute top-6 right-6 w-20 h-20 rounded-full opacity-5"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
                <div 
                  className="absolute bottom-6 left-6 w-16 h-16 rounded-full opacity-10"
                  style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                ></div>

                <div className="text-center relative">
                  <div className="flex items-center justify-center mb-6">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                        boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 
                      className="text-2xl font-bold"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      Service Overview
                    </h3>
                  </div>
                  
                  <p 
                    className="text-lg leading-relaxed"
                    style={{ color: currentTheme.elements.surface }}
                  >
                    {aboutService}
                  </p>

                  {/* Bottom CTA */}
                  <div className="mt-8 flex items-center justify-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                </div>
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: currentTheme.elements.accent }}
                    >
                      Professional Service Guaranteed
                    </span>
              </div>
              </div>
            </div>
            </div>
          </section>
        )}

        {/* Sub-Services Section */}
        {subServices.length > 0 && (
          <section 
            className="py-16 font-poppins relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: Math.random() * 6 + 3 + 'px',
                    height: Math.random() * 6 + 3 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                    backgroundColor: currentTheme.elements.accent,
                    animationDelay: Math.random() * 3 + 's',
                    animationDuration: Math.random() * 3 + 2 + 's'
                  }}
                />
              ))}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              {/* Header Section */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center mb-6">
                  <div 
                    className="w-12 h-1 rounded-full mr-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: currentTheme.elements.accent }}
                  >
                    Our Services
                  </span>
                  <div 
                    className="w-12 h-1 rounded-full ml-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                </div>
                
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                  style={{ color: currentTheme.elements.surface }}
                >
                  Our {displayServiceName} Services {inlocationName} Include
                </h2>
                
                <p 
                  className="text-lg max-w-3xl mx-auto leading-relaxed"
                  style={{ color: currentTheme.elements.surface }}
                >
                  We offer comprehensive {displayServiceName.toLowerCase()} services to meet all your needs.
                </p>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subServices.map((service, index) => (
                  <div 
                    key={index} 
                    className="group relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div 
                      className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 h-full border-2"
                      style={{ borderColor: currentTheme.elements.ring }}
                    >
                      {/* Decorative Elements */}
                      <div 
                        className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-5"
                        style={{ backgroundColor: currentTheme.elements.accent }}
                      ></div>
                      <div 
                        className="absolute bottom-4 left-4 w-8 h-8 rounded-full opacity-10"
                        style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                      ></div>

                      {/* Icon */}
                      <div className="text-center mb-6">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                            boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                          }}
                        >
                          <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      </div>

                      {/* Content */}
                      <div className="text-center">
                        <h3 
                          className="text-xl font-bold mb-3"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          {service} service {inlocationName}
                        </h3>
                      </div>

                      {/* Bottom Decoration */}
                      <div className="mt-6 flex items-center justify-center">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: currentTheme.elements.accent }}
                        >
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Process Section */}
        <section 
          className="py-16 font-poppins relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  width: Math.random() * 6 + 3 + 'px',
                  height: Math.random() * 6 + 3 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  backgroundColor: currentTheme.elements.accent,
                  animationDelay: Math.random() * 3 + 's',
                  animationDuration: Math.random() * 3 + 2 + 's'
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center mb-6">
                <div 
                  className="w-12 h-1 rounded-full mr-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
                <span 
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: currentTheme.elements.accent }}
                >
                  Our Process
                </span>
                <div 
                  className="w-12 h-1 rounded-full ml-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
              </div>
              
              <h2 
                className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                style={{ color: currentTheme.elements.surface }}
              >
                Our Simple {displayServiceName} Process {inlocationName}
              </h2>
              
              <p 
                className="text-lg max-w-4xl mx-auto leading-relaxed"
                style={{ color: currentTheme.elements.surface }}
              >
                Our streamlined {stepProcess.length}-step {displayServiceName} process ensures you get professional {projectCategory} service from start to finish.
              </p>
            </div>

            {/* Process Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stepProcess.length > 0 ? (
                stepProcess.map((step, index) => (
                  <div 
                    key={index} 
                    className="group relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div 
                      className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 h-full border-2"
                      style={{ borderColor: currentTheme.elements.ring }}
                    >
                      {/* Step Number */}
                      <div 
                        className="absolute -top-4 -left-4 w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl z-10 shadow-xl group-hover:scale-110 transition-all duration-300"
                        style={{ 
                          background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                          color: 'white'
                        }}
                      >
                      {index + 1}
                    </div>

                      {/* Decorative Elements */}
                      <div 
                        className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-5"
                        style={{ backgroundColor: currentTheme.elements.accent }}
                      ></div>
                      <div 
                        className="absolute bottom-4 left-4 w-8 h-8 rounded-full opacity-10"
                        style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                      ></div>

                      {/* Icon */}
                      <div className="text-center mb-6 mt-4">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                            boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                          }}
                        >
                          <i className={`${step.iconClass || 'fas fa-star'} text-2xl text-white`}></i>
                      </div>
                    </div>

                      {/* Content */}
                      <div className="text-center">
                        <h3 
                          className="text-xl font-bold mb-3"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          {step.stepName || 'Step'}
                        </h3>
                        <p 
                          className="text-sm leading-relaxed"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          {step.serviceDescription || 'No description available.'}
                        </p>
                      </div>

                      {/* Bottom Decoration */}
                      <div className="mt-6 flex items-center justify-center">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: currentTheme.elements.accent }}
                        >
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Connecting Arrow */}
                    {index < stepProcess.length - 1 && (
                      <div 
                        className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20"
                        style={{ color: currentTheme.elements.accent }}
                      >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center py-12">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  >
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <p 
                    className="text-lg"
                    style={{ color: currentTheme.elements.surface }}
                  >
                    No process steps available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA 1 Section */}
        {cta1 ? (
          <section 
            className="py-16 font-poppins relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: Math.random() * 6 + 3 + 'px',
                    height: Math.random() * 6 + 3 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                    backgroundColor: currentTheme.elements.accent,
                    animationDelay: Math.random() * 3 + 's',
                    animationDuration: Math.random() * 3 + 2 + 's'
                  }}
                />
              ))}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
              {/* Header Section */}
              <div className="mb-12">
                <div className="inline-flex items-center justify-center mb-6">
                  <div 
                    className="w-12 h-1 rounded-full mr-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: currentTheme.elements.accent }}
                  >
                    Get Started Today
                  </span>
                  <div 
                    className="w-12 h-1 rounded-full ml-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                </div>
                
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                  style={{ color: currentTheme.elements.heading }}
                >
                {cta1?.title}
              </h2>
                
                <p 
                  className="text-lg max-w-3xl mx-auto leading-relaxed"
                  style={{ color: currentTheme.elements.description }}
                >
                {cta1?.description}
              </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <a
                  href={`tel:${phoneNumber}`}
                  className="group px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 w-full sm:w-auto justify-center shadow-xl transform hover:scale-105"
                  style={{
                    backgroundColor: currentTheme.elements.primaryButton.bg,
                    color: currentTheme.elements.primaryButton.text,
                    boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                  }}
                >
                  <Phone size={24} className="group-hover:animate-pulse" />
                  <span>Call Now: {phoneNumber}</span>
                </a>
                
                <Link
                  to="/contact"
                  className="group px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 w-full sm:w-auto justify-center shadow-xl transform hover:scale-105 border-2"
                  style={{
                    backgroundColor: currentTheme.elements.secondaryButton.bg,
                    color: currentTheme.elements.secondaryButton.text,
                    borderColor: currentTheme.elements.secondaryButton.border
                  }}
                >
                  <Sparkles size={24} />
                  <span>Book Services of {projectCategory}</span>
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* Why Choose Us Section */}
        <section 
          className="py-16 font-poppins relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  width: Math.random() * 6 + 3 + 'px',
                  height: Math.random() * 6 + 3 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  backgroundColor: currentTheme.elements.accent,
                  animationDelay: Math.random() * 3 + 's',
                  animationDuration: Math.random() * 3 + 2 + 's'
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center mb-6">
                <div 
                  className="w-12 h-1 rounded-full mr-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
                <span 
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: currentTheme.elements.accent }}
                >
                  Why Choose Us
                </span>
                <div 
                  className="w-12 h-1 rounded-full ml-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
              </div>
              
              <h2 
                className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                style={{ color: currentTheme.elements.surface }}
              >
                Why Choose {displayServiceName} by {projectName} {inlocationName}?
              </h2>
              
              <p 
                className="text-lg max-w-3xl mx-auto leading-relaxed"
                style={{ color: currentTheme.elements.surface }}
              >
                {serviceDetails?.why_choose_us_text || "When you choose us, you're choosing quality, reliability, and exceptional service that's backed by years of experience and thousands of satisfied customers."}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectWhyChooseUs.map((feature, index) => (
                <div 
                  key={index} 
                  className="group relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div 
                    className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 h-full border-2"
                    style={{ borderColor: currentTheme.elements.ring }}
                  >
                    {/* Decorative Elements */}
                    <div 
                      className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-5"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    ></div>
                    <div 
                      className="absolute bottom-4 left-4 w-8 h-8 rounded-full opacity-10"
                      style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                    ></div>

                    {/* Icon */}
                    <div className="text-center mb-6">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300"
                        style={{ 
                          background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                          boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                        }}
                      >
                        <DynamicFAIcon iconClass={feature.iconClass || ''} className="text-2xl text-white" />
                    </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 
                        className="text-xl font-bold mb-3"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {feature.title}
                      </h3>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {feature.description}
                      </p>
                    </div>

                    {/* Bottom Decoration */}
                    <div className="mt-6 flex items-center justify-center">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: currentTheme.elements.accent }}
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guarantee Section */}
        <section 
          className="py-16 font-poppins relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  width: Math.random() * 6 + 3 + 'px',
                  height: Math.random() * 6 + 3 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  backgroundColor: currentTheme.elements.accent,
                  animationDelay: Math.random() * 3 + 's',
                  animationDuration: Math.random() * 3 + 2 + 's'
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center mb-6">
                <div 
                  className="w-12 h-1 rounded-full mr-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
                <span 
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: currentTheme.elements.accent }}
                >
                  Our Guarantee
                </span>
                <div 
                  className="w-12 h-1 rounded-full ml-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
              </div>
              
              <h2 
                className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                style={{ color: currentTheme.elements.surface }}
              >
                Our {displayServiceName} Guarantee {inlocationName}
              </h2>
              
              <p 
                className="text-lg max-w-3xl mx-auto leading-relaxed"
                style={{ color: currentTheme.elements.surface }}
              >
                {guaranteeText}
              </p>
            </div>

            {/* Guarantees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {guarantees.map((guarantee, index) => (
                <div 
                  key={index} 
                  className="group relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div 
                    className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 h-full border-2"
                    style={{ borderColor: currentTheme.elements.ring }}
                  >
                    {/* Decorative Elements */}
                    <div 
                      className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-5"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    ></div>
                    <div 
                      className="absolute bottom-4 left-4 w-8 h-8 rounded-full opacity-10"
                      style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                    ></div>

                    {/* Icon */}
                    <div className="text-center mb-6">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300"
                        style={{ 
                          background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                          boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                        }}
                      >
                        <DynamicFAIcon iconClass={guarantee.iconClass || ''} className="text-2xl text-white" />
                    </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 
                        className="text-xl font-bold mb-3"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {guarantee.title}
                      </h3>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {guarantee.description}
                      </p>
                    </div>

                    {/* Bottom Decoration */}
                    <div className="mt-6 flex items-center justify-center">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: currentTheme.elements.accent }}
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promise Section */}
            <div className="text-center">
              <div 
                className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2 max-w-4xl mx-auto"
                style={{ borderColor: currentTheme.elements.ring }}
              >
                {/* Decorative Elements */}
                <div 
                  className="absolute top-6 right-6 w-20 h-20 rounded-full opacity-5"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
                <div 
                  className="absolute bottom-6 left-6 w-16 h-16 rounded-full opacity-10"
                  style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                ></div>

                <div className="text-center relative">
                  <div className="flex items-center justify-center mb-6">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                        boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                      }}
                    >
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 
                      className="text-2xl font-bold"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      Our Promise to You
                    </h3>
                  </div>
                  
                  <p 
                    className="text-lg leading-relaxed"
                    style={{ color: currentTheme.elements.surface }}
                  >
                  {promiseLine}
                </p>

                  {/* Bottom CTA */}
                  <div className="mt-8 flex items-center justify-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: currentTheme.elements.accent }}
                    >
                      Guaranteed Satisfaction
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 2 Section */}
        {cta2 ? (
          <section 
            className="py-16 font-poppins relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: Math.random() * 6 + 3 + 'px',
                    height: Math.random() * 6 + 3 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                    backgroundColor: currentTheme.elements.accent,
                    animationDelay: Math.random() * 3 + 's',
                    animationDuration: Math.random() * 3 + 2 + 's'
                  }}
                />
              ))}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
              {/* Header Section */}
              <div className="mb-12">
                <div className="inline-flex items-center justify-center mb-6">
                  <div 
                    className="w-12 h-1 rounded-full mr-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: currentTheme.elements.accent }}
                  >
                    Get Started Today
                  </span>
                  <div 
                    className="w-12 h-1 rounded-full ml-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                </div>
                
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                  style={{ color: currentTheme.elements.heading }}
                >
                {cta2?.title}
              </h2>
                
                <p 
                  className="text-lg max-w-3xl mx-auto leading-relaxed"
                  style={{ color: currentTheme.elements.description }}
                >
                {cta2?.description}
              </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <a
                  href={`tel:${phoneNumber}`}
                  className="group px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 w-full sm:w-auto justify-center shadow-xl transform hover:scale-105"
                  style={{
                    backgroundColor: currentTheme.elements.primaryButton.bg,
                    color: currentTheme.elements.primaryButton.text,
                    boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                  }}
                >
                  <Phone size={24} className="group-hover:animate-pulse" />
                  <span>Call Now: {phoneNumber}</span>
                </a>
                
                <Link
                  to="/contact"
                  className="group px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 w-full sm:w-auto justify-center shadow-xl transform hover:scale-105 border-2"
                  style={{
                    backgroundColor: currentTheme.elements.secondaryButton.bg,
                    color: currentTheme.elements.secondaryButton.text,
                    borderColor: currentTheme.elements.secondaryButton.border
                  }}
                >
                  <Sparkles size={24} />
                  <span>Book Services of {projectCategory}</span>
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <CleaningRelatedServices />

        <section 
          className="py-16 font-poppins relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  width: Math.random() * 6 + 3 + 'px',
                  height: Math.random() * 6 + 3 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  backgroundColor: currentTheme.elements.accent,
                  animationDelay: Math.random() * 3 + 's',
                  animationDuration: Math.random() * 3 + 2 + 's'
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center mb-6">
                <div 
                  className="w-12 h-1 rounded-full mr-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
                <span 
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: currentTheme.elements.accent }}
                >
                  Customer Reviews
                </span>
                <div 
                  className="w-12 h-1 rounded-full ml-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
              </div>
              
              <h2 
                className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                style={{ color: currentTheme.elements.surface }}
              >
                What Our Customers Say
              </h2>
              
              <p 
                className="text-lg max-w-3xl mx-auto leading-relaxed"
                style={{ color: currentTheme.elements.surface }}
              >
                Don't just take our word for it. Here's what our satisfied
                customers have to say about our cleaning services.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectReviews.map((testimonial, index) => {
                const rawRating = Number(testimonial.rating) || 0;
                const fullStars = Math.floor(rawRating);
                const hasHalf = rawRating - fullStars >= 0.5;
                const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

                return (
                  <div
                    key={index}
                    className="group relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div 
                      className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 h-full border-2"
                      style={{ borderColor: currentTheme.elements.ring }}
                    >
                      {/* Decorative Elements */}
                      <div 
                        className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-5"
                        style={{ backgroundColor: currentTheme.elements.accent }}
                      ></div>
                      <div 
                        className="absolute bottom-4 left-4 w-8 h-8 rounded-full opacity-10"
                        style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                      ></div>

                      {/* Quote Icon */}
                      <div className="mb-6">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                            boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                          }}
                        >
                          <Quote className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                    <div className="mb-6 flex-grow">
                        <p 
                          className="leading-relaxed text-sm"
                          style={{ color: currentTheme.elements.surface }}
                        >
                        "{testimonial.review_text}"
                      </p>
                    </div>

                      {/* Customer Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: currentTheme.elements.accent }}
                          >
                            <span className="text-white font-bold text-sm">
                              {testimonial.customer_name?.charAt(0) || 'C'}
                            </span>
                          </div>
                        <div>
                            <h4 
                              className="font-bold text-sm"
                              style={{ color: currentTheme.elements.surface }}
                            >
                            {testimonial.customer_name}
                          </h4>
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        {[...Array(fullStars)].map((_, i) => (
                          <Star
                            key={`full-${index}-${i}`}
                              className="w-4 h-4 text-yellow-400 fill-current"
                          />
                        ))}
                        {hasHalf && (
                          <StarHalf
                            key={`half-${index}`}
                              className="w-4 h-4 text-yellow-400 fill-current"
                          />
                        )}
                        {[...Array(emptyStars)].map((_, i) => (
                          <Star
                            key={`empty-${index}-${i}`}
                              className="w-4 h-4 text-gray-300 fill-current"
                          />
                        ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {projectFaqs.length > 0 && (
          <section 
            className="py-16 font-poppins relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: Math.random() * 6 + 3 + 'px',
                    height: Math.random() * 6 + 3 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                    backgroundColor: currentTheme.elements.accent,
                    animationDelay: Math.random() * 3 + 's',
                    animationDuration: Math.random() * 3 + 2 + 's'
                  }}
                />
              ))}
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              {/* Header Section */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center mb-6">
                  <div 
                    className="w-12 h-1 rounded-full mr-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: currentTheme.elements.accent }}
                  >
                    FAQ
                  </span>
                  <div 
                    className="w-12 h-1 rounded-full ml-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                </div>
                
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                  style={{ color: currentTheme.elements.surface }}
                >
                  Frequently Asked Questions
                </h2>
                
                <p 
                  className="text-lg max-w-3xl mx-auto leading-relaxed"
                  style={{ color: currentTheme.elements.surface }}
                >
                  Got questions? We've got answers. Here are the most common questions about our {displayServiceName} services.
                </p>
              </div>

              {/* FAQ Items */}
              <div className="space-y-4">
                {projectFaqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className="group relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div 
                      className="bg-white rounded-2xl border-2 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ borderColor: currentTheme.elements.ring }}
                    >
                    <button
                        className="w-full px-6 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200 group"
                      onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    >
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: currentTheme.elements.accent }}
                          >
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <h3 
                            className="text-lg font-bold pr-4"
                            style={{ color: currentTheme.elements.surface }}
                          >
                            {faq.question}
                          </h3>
                        </div>
                      {openFAQ === index ? (
                          <ChevronUp 
                            className="w-6 h-6 flex-shrink-0 transition-transform duration-200" 
                            style={{ color: currentTheme.elements.accent }}
                          />
                      ) : (
                          <ChevronDown 
                            className="w-6 h-6 flex-shrink-0 transition-transform duration-200" 
                            style={{ color: currentTheme.elements.accent }}
                          />
                      )}
                    </button>
                    {openFAQ === index && (
                        <div className="px-6 pb-6">
                          <div 
                            className="border-t pt-4"
                            style={{ borderColor: currentTheme.elements.ring }}
                          >
                            <p 
                              className="leading-relaxed"
                              style={{ color: currentTheme.elements.surface }}
                            >
                              {faq.answer}
                            </p>
                          </div>
                      </div>
                    )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <CleaningFooter />
      </div>
    </HelmetProvider>
  );
};

export default CleaningServiceDetail;