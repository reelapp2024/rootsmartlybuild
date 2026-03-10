
import React, { useEffect, useState } from "react";
import { httpFile } from "../../../config.js";
import DOMPurify from 'dompurify';
import CleaningHeader from '../components/CleaningHeader';
import CleaningFooter from '../components/CleaningFooter';
import CleaningLoader from '../components/CleaningLoader';
import { CheckCircle, FileText, Sparkles } from 'lucide-react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useSEO } from '../../../hooks/useSEO';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';

const CleaningTermsConditions = () => {
  const { seoData } = useSEO('/terms-conditions');
  const [termsContent, setTermsContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  const projectId = import.meta.env.VITE_PROJECT_ID;

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && getThemeByName(savedTheme)) {
      setSelectedTheme(savedTheme);
      setCurrentTheme(getThemeByName(savedTheme));
    }
  }, []);

  // Listen for theme changes
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
    window.scrollTo(0, 0);
  }, [location.pathname]); // runs every time URL path changes

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await httpFile.post("/webapp/v1/fetchTnC_Au_Pp", { projectId });

        if (data.termsAndConditions) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.termsAndConditions, "text/html");
          const bodyContent = doc.body.innerHTML;
          const cleanHTML = DOMPurify.sanitize(bodyContent);
          setTermsContent(cleanHTML);
        } else {
          setTermsContent("<p>No terms and conditions available.</p>");
        }

        
      } catch (err) {
        setError("Failed to load terms and conditions.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  console.log("Raw seoData content:", seoData);

  if (loading) return <CleaningLoader />;

  return (
    <HelmetProvider>
      <Helmet>
        <title>{seoData.meta_title}</title>
        <meta name="description" content={seoData.meta_description} />
        <meta name="keywords" content={seoData.meta_keywords} />
      </Helmet>
      
      <div className="min-h-screen font-poppins">
        <CleaningHeader />

        {/* Hero Section */}
        <section 
          className="relative py-20 text-white overflow-hidden min-h-[500px] flex items-center"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
          }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.surface}85, ${currentTheme.elements.gradient.to}85)`
            }}
          ></div>

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
            {/* Hero Content */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Sparkles 
                  className="w-8 h-8 mr-3" 
                  style={{ color: currentTheme.elements.accent }}
                />
                <h1 
                  className="text-4xl md:text-5xl font-bold"
                  style={{ color: currentTheme.elements.heading }}
                >
                  Terms & Conditions
                </h1>
              </div>
              <p 
                className="text-xl max-w-3xl mx-auto"
                style={{ color: currentTheme.elements.description }}
              >
                Please read our terms and conditions carefully before using our services.
              </p>
            </div>

            {/* Breadcrumb */}
            <div className="flex justify-center">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="flex items-center" style={{ color: currentTheme.elements.description }}>
                        <Home className="w-4 h-4 mr-1" />
                        Home
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium" style={{ color: currentTheme.elements.accent }}>Terms & Conditions</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </section>

        {/* Content Section */}
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

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`
                }}
              >
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 
                className="text-3xl font-bold mb-4 flex items-center justify-center"
                style={{ color: currentTheme.elements.surface }}
              >
                <CheckCircle 
                  className="w-8 h-8 mr-3" 
                  style={{ color: currentTheme.elements.accent }}
                />
                Service Agreement
              </h2>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto">
              {error && (
                <div 
                  className="p-4 rounded-lg mb-6"
                  style={{
                    backgroundColor: `${currentTheme.elements.primaryButton.bg}10`,
                    border: `1px solid ${currentTheme.elements.primaryButton.bg}30`
                  }}
                >
                  <p style={{ color: currentTheme.elements.primaryButton.bg }}>
                    {error}
                  </p>
                </div>
              )}
              
              {!loading && !error && (
                <div 
                  className="prose max-w-none"
                  style={{ 
                    color: '#000000',
                    lineHeight: '1.6',
                    fontSize: '15px'
                  }}
                >
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .prose h1 {
                        font-size: 1.5rem !important;
                        margin-bottom: 1.5rem !important;
                        color: #000000 !important;
                      }
                      .prose h2 {
                        font-size: 1.5rem !important;
                        margin-bottom: 1.5rem !important;
                        color: #000000 !important;
                      }
                      .prose p {
                        color: #000000 !important;
                        margin-bottom: 1rem !important;
                      }
                    `
                  }} />
                  <div dangerouslySetInnerHTML={{ __html: termsContent }} />
                </div>
              )}
            </div>
          </div>
        </section>

        <CleaningFooter />
      </div>
    </HelmetProvider>
  );
};

export default CleaningTermsConditions;
