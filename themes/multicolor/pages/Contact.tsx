'use client';

import React, { useEffect, useState } from 'react';
import { httpFile } from "@/config";
import { getProjectId } from '../../../hooks/getProjectId';
import { useRouter, usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, Clock, Calendar, ChevronUp, ChevronDown, Star, Wrench, HelpCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContactHero from '../components/contact/ContactHero';
import ContactForm from '../components/contact/ContactForm';
import ContactInfo from '../components/contact/ContactInfo';
import BookingSection from '../components/BookingSection';
import FAQSection from '../components/FAQSection';
import PageSchemaMarkup from '../components/PageSchemaMarkup';
import SEOHead from '../components/SEOHead';
import { useSEO } from '../../../hooks/useSEO';
import { generateFAQSchema, generateReviewSchema, generateServicesSchema } from "../../../hooks/schemaMarkup"
// @ts-ignore - react-helmet-async may not be installed
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTheme } from '../contexts/ThemeContext';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
// @ts-ignore - DynamicContactForm may not exist
import DynamicContactForm from '../../../components/DynamicContactForm';

const Contact = () => {
  const breadcrumbItems = [
    { label: "Contact" }
  ];

  const { seoData } = useSEO('/contact');
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();

  console.log(seoData)

  const router = useRouter();
  const pathname = usePathname();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [mainLocation, setMainLocation] = useState("");
  const [projectCategory, setProjectCategory] = useState("");
  const [image, setImage] = useState("");
  interface CTAItem {
    title?: string;
    description?: string;
    [key: string]: unknown;
  }
  interface FAQItem {
    question?: string;
    answer?: string;
    [key: string]: unknown;
  }
  const [CTA, setCTA] = useState<CTAItem[]>([]);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [projectFaqs, setprojectFaqs] = useState<FAQItem[]>([]);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormExists, setIsFormExists] = useState(0);

  const projectId = getProjectId();
  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowThankYou(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setShowThankYou(false);
      (e.target as HTMLFormElement).reset();
    }, 3000);
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]); // runs every time URL path changes




  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "contact"

        });

        if (data.aboutUs && data.aboutUs) {
          setCTA(data.projectInfo.cta);
          setprojectFaqs(data.faq || []);
          setIsFormExists(data.projectInfo.isFormExists || 0);

          setEmail(data.aboutUs.email);
          setPhoneNumber(data.aboutUs.phone);
          setMainLocation(data.aboutUs.mainLocation);
          setProjectCategory(data.projectInfo.serviceType);
          setImage(data.projectInfo.images[3].url);
          setHeroImage(data.projectInfo.images[1].url);


        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);


  const getCTAContent = (index: number): CTAItem => {
    if (CTA.length === 0) {
      return { title: "What are you waiting for", description: "Contact us for our services" };
    }
    return CTA[index] || CTA[0];
  };


  const faqSchema = generateFAQSchema(projectFaqs);

  // Show skeleton loading state like header
  const showSkeleton = !phoneNumber && !email;

  return (

    <HelmetProvider>
      <div className="min-h-screen font-poppins">
        <Helmet>
          <title>{`${seoData?.meta_title} `}</title>

          <meta name="description" content={seoData.meta_description} />
          <meta name="keywords" content={seoData.meta_keywords} />

          {/* Embed FAQ schema */}
          {faqSchema && (
            <script type="application/ld+json">
              {JSON.stringify(faqSchema, null, 2)}
            </script>
          )}
          {/* Embed Reviews schema */}


        </Helmet>

        <PageSchemaMarkup
          pageType="contact"
          pageTitle={seoData.meta_title}
          pageDescription={seoData.meta_description}
          breadcrumbs={[{ name: "Contact", url: "/contact" }]}
        />
        <Header />

        {/* Hero Section */}
        <section
          id="home"
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
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
                    <BreadcrumbPage className="font-medium text-xs" style={{ color: colors.primaryButton.bg }}>Contact Us</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
            <div className="max-w-7xl mx-auto py-20 sm:py-24 lg:py-32">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* Left Side - Content */}
                <div className="text-center lg:text-left space-y-8 relative z-20">
                  {/* Badge */}
                  {showSkeleton ? (
                    <div className="inline-block animate-pulse">
                      <div className="h-6 w-24 bg-gray-300 rounded-full"></div>
                    </div>
                  ) : (
                    <div className="inline-block">
                      <span
                        className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-semibold"
                        style={{
                          color: colors.heading,
                          backgroundColor: `${colors.primaryButton.bg}15`
                        }}
                      >
                        <Star className="w-3 h-3" />
                        Contact Us
                      </span>
                    </div>
                  )}

                  {/* Main Heading */}
                  {showSkeleton ? (
                    <div className="space-y-3">
                      <div className="h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <h1 className="font-black">
                      <span style={{ color: colors.heading }}>
                        Get In Touch
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
                      Today
                    </span>
                  </h1>
                  )}

                  {/* Subheading */}
                  <p
                    className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                    style={{ color: colors.description }}
                  >
                    Ready for professional {projectCategory}? Contact us today for a free quote and same-day booking.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                    {/* Call Button */}
                    <a
                      href={`tel:${phoneNumber}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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

                  {/* Contact Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6">
                    {/* Phone */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center break-words">
                      <Phone className="w-6 h-6 mx-auto mb-2" style={{ color: colors.accent }} />
                      <h3 className="font-bold text-white mb-1">Phone</h3>
                      <p className="text-white/80 text-xs sm:text-sm break-all">{phoneNumber}</p>
                    </div>

                    {/* Email */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center break-words">
                      <Mail className="w-6 h-6 mx-auto mb-2" style={{ color: colors.accent }} />
                      <h3 className="text-xs sm:text-sm font-bold text-white mb-1">Email</h3>
                      <p className="text-white/80 text-xs sm:text-sm break-all">{email}</p>
                    </div>

                    {/* Hours */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center break-words">
                      <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: colors.accent }} />
                      <h3 className="text-xs sm:text-sm font-bold text-white mb-1">Hours</h3>
                      <p className="text-white/80 text-xs sm:text-sm">24/7 Service</p>
                    </div>
                  </div>

                </div>

                {/* Right Side - Contact Form */}
                <div className="relative z-20">
                  <div
                    className="bg-white/95 backdrop-blur-md rounded-3xl p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300"
                  >
                    {/* Form Header */}
                    <div className="text-center mb-8">
                      <h3 className="font-bold text-gray-900 mb-2">
                        Request a <span style={{ color: colors.primaryButton.bg }}>Free Quote</span>
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Fill out the form below and we'll get back to you within 24 hours
                      </p>
                    </div>

                    {/* Thank You Message */}
                    {showThankYou && (
                      <div className="mb-6 p-4 rounded-xl text-center" style={{ backgroundColor: `${colors.primaryButton.bg}10`, border: `1px solid ${colors.primaryButton.bg}30` }}>
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: colors.primaryButton.bg }}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">Thank You!</h4>
                        <p className="text-sm text-gray-600">Your message has been sent successfully. We'll get back to you soon!</p>
                      </div>
                    )}

                    {/* Contact Form - Only Dynamic */}
                    {isFormExists === 1 && (
                      <DynamicContactForm 
                        projectId={projectId}
                        colors={colors}
                        onSuccess={() => setShowThankYou(true)}
                      />
                    )}

                    {/* Form Footer */}
                    <div className="mt-6 text-center">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        By submitting this form, you agree to our privacy policy and terms of service.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



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
                            {faq.answer || ''}
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

        {/* CTA Section */}
        {CTA && (
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
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 max-w-2xl mx-auto leading-tight">
                  {getCTAContent(0).title}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
                  {getCTAContent(0).description}
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

                  {/* Email Button */}
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg"
                    style={{
                      backgroundColor: colors.secondaryButton.bg,
                      color: colors.secondaryButton.text,
                      border: `2px solid ${colors.secondaryButton.border}`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondaryButton.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.secondaryButton.bg}
                  >
                    <Mail className="w-5 h-5" />
                    <span>Email Us</span>
                  </a>
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
        )}

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default Contact;
