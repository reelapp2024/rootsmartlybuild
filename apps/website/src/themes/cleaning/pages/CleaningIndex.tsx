import React, { useEffect, useState, useLayoutEffect } from 'react';

import { httpFile } from "../../../config.js";
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { Phone, Sparkles } from 'lucide-react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useSEO } from '../../../hooks/useSEO';
import CleaningHeader from '../components/CleaningHeader';
import CleaningHero from '../components/CleaningHero';
import CleaningAboutUs from '../components/CleaningAboutUs';
import CleaningServices from '../components/CleaningServices';
import CleaningWhyChooseUs from '../components/CleaningWhyChooseUs';
import CleaningProcess from '../components/CleaningProcess';
import CleaningGuarantee from '../components/CleaningGuarantee';
import CleaningTestimonials from '../components/CleaningTestimonials';
import CleaningServiceAreas from '../components/CleaningServiceAreas';
import CleaningFAQ from '../components/CleaningFAQ';
import CleaningFooter from '../components/CleaningFooter';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';
const CleaningIndex = () => {
  const { seoData } = useSEO('/home');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [projectCategory, setProjectCategory] = useState("");
  const [CTA, setCTA] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
  const projectId = import.meta.env.VITE_PROJECT_ID;
  const location = useLocation();


  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location, navigationType]);

  // Load saved theme from localStorage
  useEffect(() => {
    // Try multiple localStorage keys for compatibility
    const savedTheme = localStorage.getItem('cleaningTheme') || 
                       localStorage.getItem('selectedTheme') || 
                       localStorage.getItem('theme');
    if (savedTheme && getThemeByName(savedTheme)) {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "home"
        });

        if (data.projectInfo && data.projectInfo.serviceType) {
          setCTA(data.projectInfo.cta);
          setPhoneNumber(data.aboutUs.phone);
          setProjectCategory(data.projectInfo.serviceType);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && getThemeByName(savedTheme)) {
      setSelectedTheme(savedTheme);
      setCurrentTheme(getThemeByName(savedTheme));
    }
  }, []);

  // Listen for theme changes from header
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setSelectedTheme(newTheme);
      setCurrentTheme(getThemeByName(newTheme));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // Ensure there are at least 4 CTAs by reusing the first one if necessary
  const getCTAContent = (index) => {
    if (CTA.length === 0) {
      return { title: "Default CTA", description: "Contact us for our services" };
    }
    return CTA[index] || CTA[0];
  };

  const renderCTA = (cta, phoneNumber, projectCategory) => {
    return (
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
              style={{ color: currentTheme.elements.heading }}
            >
              {cta.title}
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.description }}
            >
              {cta.description}
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
    );
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>{seoData.meta_title}</title>
        <meta name="description" content={seoData.meta_description} />
        <meta name="keywords" content={seoData.meta_keywords} />
      </Helmet>

      <div className="min-h-screen font-poppins">
        <CleaningHeader />
        <CleaningHero />

        <CleaningAboutUs />
        <CleaningServices />
        {/* First CTA */}
        {renderCTA(getCTAContent(0), phoneNumber, projectCategory)}
        <CleaningWhyChooseUs />
        <CleaningProcess />
        {/* Second CTA */}
        {renderCTA(getCTAContent(1), phoneNumber, projectCategory)}
        <CleaningGuarantee />
        <CleaningTestimonials />
        {/* Third CTA */}
        {renderCTA(getCTAContent(2), phoneNumber, projectCategory)}
        <CleaningServiceAreas />
        <CleaningFAQ />
        {/* Fourth CTA */}
        {renderCTA(getCTAContent(3), phoneNumber, projectCategory)}
        <CleaningFooter />
      </div>
    </HelmetProvider>
  );
};

export default CleaningIndex;