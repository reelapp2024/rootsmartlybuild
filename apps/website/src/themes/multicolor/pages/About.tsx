
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageBreadcrumb from '../components/PageBreadcrumb';
import AboutHero from '../components/about/AboutHero';
import MissionVision from '../components/about/MissionVision';
import CoreValues from '../components/about/CoreValues';
import WhyDifferent from '../components/about/WhyDifferent';
import WhyChooseUsSimple from '../components/WhyChooseUsSimple';
import BookingSection from '../components/BookingSection';
import FAQSection from '../components/FAQSection';
import PageSchemaMarkup from '../components/PageSchemaMarkup';
import SEOHead from '../components/SEOHead';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, useParams } from "react-router-dom";
import { Phone, Clock, Calendar, Star, Shield, Award, Sparkles, Users, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { httpFile } from "../../../config.js";

import { Target, Eye, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import DynamicFAIcon from '../../../extras/DynamicFAIcon.js';

import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Loader from '../components/Loader';

const About = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  
  // Fallback colors in case theme is not loaded
  const fallbackColors = {
    heading: '#1F2937',
    description: '#6B7280',
    surface: '#F9FAFB',
    primaryButton: { bg: '#3B82F6', text: '#FFFFFF', hover: '#2563EB' },
    secondaryButton: { bg: 'transparent', text: '#1F2937', border: '#3B82F6', hover: '#F3F4F6' },
    accent: '#F59E0B',
    gradient: { from: '#3B82F6', to: '#1D4ED8' }
  };
  
  const safeColors = colors || fallbackColors;
  
  const breadcrumbItems = [
    { label: "About" }
  ];

  const location = useLocation();
  const [backgroundImage, setBackgroundImage] = useState("");

  const [aboutHeroText, setAboutHeroText] = useState('');
  const [projectCategory, setProjectCategory] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [missionLine, setMissionLine] = useState("");
  const [visionLine, setVisionLine] = useState("");
  const [missionSubHeadings, setMissionSubHeadings] = useState([]);
  const [visionSubHeadings, setVisionSubHeadings] = useState([]);
  const [coreValuesIntro, setCoreValuesIntro] = useState("");
  const [commitment, setCommitment] = useState("");
  const [coreValues, setCoreValues] = useState([]);
  const [coloredCoreValues, setColoredCoreValues] = useState([]);
  const [whatMakesUsDifferent, setWhatMakesUsDifferent] = useState([]);
  const [whyChooseUsAboutPage, setWhyChooseUsAboutPage] = useState([]);

  const [email, setEmail] = useState("");

  const [CTA, setCTA] = useState([]);

  const coreValueGradients = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-red-500 to-red-600',
    'from-pink-500 to-pink-600'
  ];


  const whatMakesUsDifferentColors = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFC300', '#9D4EDD', '#00C2CB'];


  const projectId = import.meta.env.VITE_PROJECT_ID;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]); // runs every time URL path changes

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hero text from my_site API
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
        });

        if (data?.projectInfo) {
          // Strings
          setAboutHeroText(data.projectInfo.aboutHeroText || "");
          setProjectName(data.projectInfo.projectName || "");
          setCoreValuesIntro(data.projectInfo.coreValuesIntro || "");
          setProjectCategory(data.projectInfo.serviceType || "");
          setCommitment(data.projectInfo.commitment || "");
          setMissionLine(data.projectInfo.missionLine || "");
          setVisionLine(data.projectInfo.visionLine || "");
          setBackgroundImage(data.projectInfo.images?.[3]?.url || "");

          // Contact (strings)
          setPhoneNumber(data?.aboutUs?.phone || "");
          setEmail(data?.aboutUs?.email || "");

          // Image (string)
          setHeroImage(data?.projectInfo?.images?.[0]?.url || "");

          // Arrays
          const coreValues = Array.isArray(data.projectInfo.coreValues)
            ? data.projectInfo.coreValues
            : [];
          setCoreValues(coreValues);

          const whatMakesUsDifferent = Array.isArray(data.projectInfo.whatMakesUsDifferent)
            ? data.projectInfo.whatMakesUsDifferent
            : [];
          setWhatMakesUsDifferent(
            whatMakesUsDifferent.map((item, index) => ({
              ...item,
              color: whatMakesUsDifferentColors[index % whatMakesUsDifferentColors.length],
            }))
          );

          setColoredCoreValues(
            coreValues.map((value, index) => ({
              ...value,
              gradient: coreValueGradients[index % coreValueGradients.length],
            }))
          );

          setWhyChooseUsAboutPage(
            Array.isArray(data.projectInfo.whyChooseUsAboutPage)
              ? data.projectInfo.whyChooseUsAboutPage
              : []
          );

          setMissionSubHeadings(
            Array.isArray(data.projectInfo.missionSubHeadings)
              ? data.projectInfo.missionSubHeadings
              : []
          );
          setVisionSubHeadings(
            Array.isArray(data.projectInfo.visionSubHeadings)
              ? data.projectInfo.visionSubHeadings
              : []
          );

          // CTA (choose one fallback based on your UI expects)
          // If CTA is a string in your UI:
          setCTA(data.projectInfo.cta || "");
          // If CTA is an object in your UI, use this instead:
          // setCTA(data.projectInfo.cta || {});
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);

  console.log(missionLine, "missionLinemissionLinemissionLinemissionLinemissionLinemissionLinemissionLinemissionLine")


  const getCTAContent = (index) => {
    if (CTA.length === 0) {
      return { title: "What are you waiting for", description: "Contact us for our services" };
    }
    return CTA[index] || CTA[0];
  };

  let title = `About ${projectCategory} Service - ${projectName}`

  // Simple loading state
  if (!projectName && !aboutHeroText) {
    return <Loader message="Loading About Page..." />;
  }

  return (
    <div className="min-h-screen font-poppins">
      <SEOHead
        title={title}
        description={aboutHeroText}
        canonical="/about"
      />
      <PageSchemaMarkup
        pageType="about"
        pageTitle={title}
        pageDescription={aboutHeroText}
        breadcrumbs={[{ name: "About", url: "/about" }]}
      />
      <Header />
      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden py-4 sm:py-8 lg:py-12 pb-12 sm:pb-16 lg:pb-20"
        style={{
          backgroundColor: safeColors.surface
        }}
      >
        {/* Left Side - Content */}
        <div className="w-full lg:w-1/2 relative z-10">
          <div className="container mx-auto px-4 sm:px-8 lg:px-16">
            {/* Breadcrumb - Top Left */}
            <div className="absolute top-2 left-4 sm:left-8 lg:left-16 z-30">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/" className="flex items-center text-xs text-gray-600 hover:text-gray-900 transition-colors">
                          <Home className="w-3 h-3 mr-1" />
                          Home
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium text-xs" style={{ color: safeColors.primaryButton.bg }}>About Us</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
        </div>

            <div className="pt-20 sm:pt-24 lg:pt-28">
              <div className="text-center lg:text-left space-y-6 relative z-20">

                {/* Badge */}
                <div className="inline-block mb-4">
                  <span
                    className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-2.5"
                    style={{
                      color: safeColors.heading,
                      backgroundColor: `${safeColors.primaryButton.bg}15`
                    }}
                  >
                    <Star className="w-4 h-4" />
              Your Trusted {projectCategory} Partners
                  </span>
            </div>

                {/* Main Heading */}
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight">
                  <span style={{ color: safeColors.heading }}>
                About
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
                    {projectName}
                  </span>
              </h1>

                {/* Subheading */}
                <p
                  className="text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto lg:mx-0 leading-relaxed"
                  style={{ color: safeColors.description }}
                >
              {aboutHeroText}
            </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">

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

                  {/* Learn More Button */}
                  <button
                    onClick={() => {
                      const aboutSection = document.getElementById('about-content');
                      if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300"
                    style={{
                      backgroundColor: safeColors.secondaryButton.bg,
                      color: safeColors.secondaryButton.text,
                      border: `2px solid ${safeColors.secondaryButton.border}`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = safeColors.secondaryButton.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = safeColors.secondaryButton.bg}
                  >
                    <Users className="w-5 h-5" />
                    <span>Learn Our Story</span>
                  </button>
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
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={heroImage || '/placeholder.svg'}
                alt="About Us"
                className="w-full h-[500px] object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width="600"
                height="500"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
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
                <span className="text-gray-900 font-semibold text-sm">About Us</span>
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
            backgroundImage: heroImage ? `url(${heroImage})` : `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`,
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
      {/* Our Mission & Vision Section */}
      <section 
        className="py-16 relative overflow-hidden bg-white"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 rounded-lg rotate-45 animate-pulse" style={{ backgroundColor: safeColors.accent, animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  color: safeColors.primaryButton.bg,
                  backgroundColor: `${safeColors.primaryButton.bg}15`
                }}
              >
                <Target className="w-4 h-4" />
                Our Foundation
              </span>
            </div>
          <h2 
            className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-gray-900"
          >
              Our Mission & Vision
            </h2>
          <p 
            className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
              Driving our commitment to excellence in professional {projectCategory} services
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Mission Card */}
            <div 
              className="relative group bg-white border-2 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                borderColor: `${safeColors.primaryButton.bg}30`
              }}
            >
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden">
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 rounded-lg rotate-45" style={{ backgroundColor: safeColors.accent }}></div>
              </div>

              <div className="relative p-8">
                {/* Header */}
                <div className="flex items-center mb-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${safeColors.primaryButton.bg}, ${safeColors.accent})`
                    }}
                  >
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div>
                  <h3 
                    className="text-lg sm:text-xl font-bold text-gray-900"
                  >
                    Our Mission
                  </h3>
                    <div 
                      className="w-12 h-1 rounded-full mt-2"
                      style={{ backgroundColor: safeColors.primaryButton.bg }}
                    ></div>
                  </div>
                </div>

                {/* Mission Description */}
                  <p 
                    className="text-xs sm:text-sm leading-relaxed mb-6 text-gray-600"
                  >
                  {missionLine}
                </p>

                {/* Mission Points */}
                <ul className="space-y-4">
                  {missionSubHeadings.map((heading, i) => (
                    <li key={i} className="flex items-start">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: `${safeColors.primaryButton.bg}20` }}
                      >
                        <CheckCircle className="w-4 h-4" style={{ color: safeColors.primaryButton.bg }} />
                      </div>
                      <span 
                        className="text-xs sm:text-sm text-gray-800"
                      >
                        {heading}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Decorative Element */}
                <div className="absolute top-6 right-6 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: safeColors.accent }}></div>
              </div>
            </div>

            {/* Vision Card */}
            <div 
              className="relative group bg-white border-2 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                borderColor: `${safeColors.accent}30`
              }}
            >
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden">
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full" style={{ backgroundColor: safeColors.accent }}></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 rounded-lg rotate-45" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
              </div>

              <div className="relative p-8">
                {/* Header */}
                <div className="flex items-center mb-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${safeColors.accent}, ${safeColors.primaryButton.bg})`
                    }}
                  >
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <div>
                  <h3 
                    className="text-lg sm:text-xl font-bold text-gray-900"
                  >
                    Our Vision
                  </h3>
                    <div 
                      className="w-12 h-1 rounded-full mt-2"
                      style={{ backgroundColor: safeColors.accent }}
                    ></div>
                  </div>
                </div>

                {/* Vision Description */}
                  <p 
                    className="text-xs sm:text-sm leading-relaxed mb-6 text-gray-600"
                  >
                  {visionLine}
                </p>

                {/* Vision Points */}
                <ul className="space-y-4">
                  {visionSubHeadings.map((heading, i) => (
                    <li key={i} className="flex items-start">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: `${safeColors.accent}20` }}
                      >
                        <CheckCircle className="w-4 h-4" style={{ color: safeColors.accent }} />
                      </div>
                      <span 
                        className="text-xs sm:text-sm text-gray-800"
                      >
                        {heading}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Decorative Element */}
                <div className="absolute top-6 right-6 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
              </div>
            </div>
          </div>

          {/* Bottom Accent */}
          <div className="flex justify-center mt-12">
            <div 
              className="w-24 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent}, ${safeColors.primaryButton.bg})`
              }}
            ></div>
          </div>
        </div>
      </section>

      {/* Our Core Values Section */}
      <section 
        className="py-16 relative overflow-hidden"
        style={{ backgroundColor: safeColors.surface }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 rounded-lg rotate-45 animate-pulse" style={{ backgroundColor: safeColors.accent, animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  color: safeColors.heading,
                  backgroundColor: `${safeColors.accent}15`
                }}
              >
                <Sparkles className="w-4 h-4" />
                What We Stand For
              </span>
            </div>
          <h2 
            className="text-lg sm:text-xl md:text-2xl font-bold mb-4"
            style={{ color: safeColors.heading }}
          >
              Our Core Values
            </h2>
          <p 
            className="text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed"
            style={{ color: safeColors.description }}
          >
              {coreValuesIntro}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {coloredCoreValues.map((value, index) => (
              <div 
                key={index} 
                className="group relative"
                style={{
                  backgroundColor: `${safeColors.surface}95`,
                  border: `1px solid ${safeColors.primaryButton.bg}20`,
                  borderRadius: '1.5rem'
                }}
              >
                {/* Card Background Pattern */}
                <div className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden">
                  <div 
                    className="absolute top-4 right-4 w-12 h-12 rounded-full" 
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                  <div 
                    className="absolute bottom-4 left-4 w-8 h-8 rounded-lg rotate-45" 
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                </div>

                <div className="relative p-6 text-center">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 bg-white"
                      style={{
                        border: `3px solid ${safeColors.primaryButton.bg}30`,
                        boxShadow: `0 4px 20px ${safeColors.primaryButton.bg}25`
                      }}
                    >
                      <DynamicFAIcon 
                        iconClass={value.iconClass || ''} 
                        className="w-7 h-7" 
                      />
                    </div>
                    {/* Decorative Dots */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: safeColors.accent }}></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '1s' }}></div>
                  </div>

                  {/* Content */}
                <h3 
                  className="text-base sm:text-lg font-bold mb-3"
                  style={{ color: safeColors.heading }}
                >
                  {value.title}
                </h3>
                <p 
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: safeColors.description }}
                >
                  {value.description}
                </p>

                  {/* Bottom Accent Line */}
                  <div 
                    className="w-12 h-1 rounded-full mx-auto mt-4 opacity-60"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>

                  {/* Hover Effect */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Accent */}
          <div className="flex justify-center mt-12">
            <div 
              className="w-24 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent}, ${safeColors.primaryButton.bg})`
              }}
            ></div>
          </div>
        </div>
      </section>


      {/* What Makes Us Different Section */}
      <section 
        className="py-16 relative overflow-hidden bg-white"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 rounded-lg rotate-45 animate-pulse" style={{ backgroundColor: safeColors.accent, animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  color: safeColors.primaryButton.bg,
                  backgroundColor: `${safeColors.primaryButton.bg}15`
                }}
              >
                <Star className="w-4 h-4" />
                Our Unique Edge
              </span>
            </div>
            <h2 
              className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-gray-900"
            >
              What Makes Us Different
            </h2>
            <p 
              className="text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed text-gray-600"
            >
              Our unique advantages that set us apart from other {projectCategory} services
            </p>
          </div>

          {/* Commitment Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div 
              className="relative group bg-white border-2 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                borderColor: `${safeColors.accent}30`
              }}
            >
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden">
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full" style={{ backgroundColor: safeColors.accent }}></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 rounded-lg rotate-45" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
              </div>

              <div className="relative p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${safeColors.accent}, ${safeColors.primaryButton.bg})`
                    }}
                  >
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h3 
                    className="text-xl sm:text-2xl font-bold text-gray-900"
                  >
                    Our Commitment to Excellence
                  </h3>
                </div>
                <p 
                  className="text-sm sm:text-base leading-relaxed text-gray-600"
                >
                  {commitment}
                </p>
              </div>
            </div>
          </div>

          {/* Differences Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {whatMakesUsDifferent.map((diff, index) => (
              <div 
                key={index}
                className="group relative bg-white border-2 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                style={{
                  borderColor: `${safeColors.primaryButton.bg}20`
                }}
              >
                {/* Card Background Pattern */}
                <div className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden">
                  <div 
                    className="absolute top-4 right-4 w-12 h-12 rounded-full" 
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                  <div 
                    className="absolute bottom-4 left-4 w-8 h-8 rounded-lg rotate-45" 
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                </div>

                <div className="relative p-6 text-center">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 bg-white"
                      style={{
                        border: `3px solid ${safeColors.primaryButton.bg}30`,
                        boxShadow: `0 4px 20px ${safeColors.primaryButton.bg}25`
                      }}
                    >
                      <DynamicFAIcon 
                        iconClass={diff.iconClass || ''} 
                        className="w-7 h-7" 
                      />
                    </div>
                    {/* Decorative Dots */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: safeColors.accent }}></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '1s' }}></div>
                  </div>

                  {/* Content */}
                  <h3 
                    className="text-base sm:text-lg font-bold mb-3 text-gray-900"
                  >
                    {diff.title}
                  </h3>
                  <p 
                    className="text-xs sm:text-sm leading-relaxed text-gray-600"
                  >
                    {diff.description}
                  </p>

                  {/* Bottom Accent Line */}
                  <div 
                    className="w-12 h-1 rounded-full mx-auto mt-4 opacity-60"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>

                  {/* Hover Effect */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Accent */}
          <div className="flex justify-center mt-12">
            <div 
              className="w-24 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent}, ${safeColors.primaryButton.bg})`
              }}
            ></div>
          </div>
        </div>
      </section>




      {/* Why Choose Us Section */}
      <section 
        className="py-16 relative overflow-hidden"
        style={{ backgroundColor: safeColors.surface }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 rounded-lg rotate-45 animate-pulse" style={{ backgroundColor: safeColors.accent, animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  color: safeColors.heading,
                  backgroundColor: `${safeColors.accent}15`
                }}
              >
                <Shield className="w-4 h-4" />
                Your Trusted Choice
              </span>
            </div>
            <h2 
              className="text-lg sm:text-xl md:text-2xl font-bold mb-4"
              style={{ color: safeColors.heading }}
            >
              Why Choose {projectName}?
            </h2>
            <p 
              className="text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed"
              style={{ color: safeColors.description }}
            >
              We're committed to providing exceptional {projectCategory} services with professional expertise and customer satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {whyChooseUsAboutPage.map((feature, index) => (
              <div 
                key={index} 
                className="group relative"
                style={{
                  backgroundColor: `${safeColors.surface}95`,
                  border: `1px solid ${safeColors.primaryButton.bg}20`,
                  borderRadius: '1.5rem'
                }}
              >
                {/* Card Background Pattern */}
                <div className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden">
                  <div 
                    className="absolute top-4 right-4 w-12 h-12 rounded-full" 
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                  <div 
                    className="absolute bottom-4 left-4 w-8 h-8 rounded-lg rotate-45" 
                    style={{ backgroundColor: safeColors.accent }}
                  ></div>
                </div>

                <div className="relative p-6 text-center">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 bg-white"
                      style={{
                        border: `3px solid ${safeColors.primaryButton.bg}30`,
                        boxShadow: `0 4px 20px ${safeColors.primaryButton.bg}25`
                      }}
                    >
                      <DynamicFAIcon 
                        iconClass={feature.iconClass || ''} 
                        className="w-7 h-7" 
                      />
                    </div>
                    {/* Decorative Dots */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: safeColors.accent }}></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '1s' }}></div>
                  </div>

                  {/* Content */}
                  <h3 
                    className="text-base sm:text-lg font-bold mb-3"
                    style={{ color: safeColors.heading }}
                  >
                    {feature.title}
                  </h3>
                  <p 
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: safeColors.description }}
                  >
                    {feature.description}
                  </p>

                  {/* Bottom Accent Line */}
                  <div 
                    className="w-12 h-1 rounded-full mx-auto mt-4 opacity-60"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>

                  {/* Hover Effect */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ backgroundColor: safeColors.primaryButton.bg }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Accent */}
          <div className="flex justify-center mt-12">
            <div 
              className="w-24 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${safeColors.primaryButton.bg}, ${safeColors.accent}, ${safeColors.primaryButton.bg})`
              }}
            ></div>
          </div>
        </div>
      </section>

      <FAQSection />
      {CTA && (
        <section 
          className="py-16 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${safeColors.gradient.from}, ${safeColors.gradient.to})`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg }}></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 rounded-lg rotate-45 animate-pulse" style={{ backgroundColor: safeColors.accent, animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full animate-pulse" style={{ backgroundColor: safeColors.primaryButton.bg, animationDelay: '2s' }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10 text-center">
            
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 max-w-2xl mx-auto leading-tight">
              {getCTAContent(3).title}
            </h2>
              <p className="text-xs sm:text-sm text-white/90 max-w-2xl mx-auto leading-relaxed">
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
                  backgroundColor: safeColors.primaryButton.bg,
                  color: safeColors.primaryButton.text
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = safeColors.primaryButton.bg}
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
              <a
                href={`mailto:${email}`}
                className="group relative inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1 shadow-lg backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: safeColors.primaryButton.bg,
                  border: `2px solid ${safeColors.primaryButton.bg}30`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = safeColors.primaryButton.bg;
                  e.currentTarget.style.color = safeColors.primaryButton.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.color = safeColors.primaryButton.bg;
                }}
              >
                <Calendar className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs font-semibold opacity-90 uppercase tracking-wide">Book Online</div>
                  <div className="text-sm font-bold">Schedule Service</div>
                    </div>
              </a>
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
  );
};

export default About;
