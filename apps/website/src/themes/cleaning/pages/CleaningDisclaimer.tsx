import React, { useEffect, useState } from "react";
import CleaningHeader from '../components/CleaningHeader';
import CleaningFooter from '../components/CleaningFooter';
import CleaningLoader from '../components/CleaningLoader';
import { FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useSEO } from '../../../hooks/useSEO';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';

const CleaningDisclaimer = () => {
  const { seoData } = useSEO('/disclaimer');
  const [loading, setLoading] = useState(true);
  const location = useLocation();

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
  }, [location.pathname]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
                  Disclaimer
                </h1>
              </div>
              <p 
                className="text-xl max-w-3xl mx-auto"
                style={{ color: currentTheme.elements.description }}
              >
                Important information about our services and limitations.
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
                    <BreadcrumbPage className="font-medium" style={{ color: currentTheme.elements.accent }}>Disclaimer</BreadcrumbPage>
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
                <AlertTriangle 
                  className="w-8 h-8 mr-3" 
                  style={{ color: currentTheme.elements.accent }}
                />
                Service Disclaimer
              </h2>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto">
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
                
                <h1>Service Disclaimer</h1>
                <p>This disclaimer governs the use of our cleaning services. By engaging our services, you acknowledge and agree to the terms outlined below.</p>

                <h2>Service Limitations</h2>
                <p>While we strive to provide the highest quality cleaning services, we cannot guarantee that all stains, marks, or damage will be completely removed. Some materials and surfaces may have limitations that prevent complete restoration.</p>

                <h2>Client Responsibilities</h2>
                <p>Clients are responsible for:</p>
                <ul>
                  <li>Providing clear access to all areas requiring cleaning</li>
                  <li>Removing or securing valuable and fragile items</li>
                  <li>Informing our team of any special requirements or concerns</li>
                  <li>Ensuring the safety of our cleaning staff</li>
                </ul>

                <h2>Liability Limitations</h2>
                <p>Our liability is limited to the cost of the cleaning service provided. We are not responsible for:</p>
                <ul>
                  <li>Pre-existing damage to items or surfaces</li>
                  <li>Damage caused by normal wear and tear</li>
                  <li>Items not properly secured or protected by the client</li>
                  <li>Consequential or indirect damages</li>
                </ul>

                <h2>Insurance Coverage</h2>
                <p>We maintain appropriate insurance coverage for our cleaning services. However, clients are encouraged to maintain their own insurance for valuable items and property.</p>

                <h2>Service Guarantees</h2>
                <p>We offer satisfaction guarantees for our services, but these are subject to reasonable limitations based on the condition of items and surfaces prior to cleaning.</p>

                <h2>Force Majeure</h2>
                <p>We are not liable for delays or inability to perform services due to circumstances beyond our control, including but not limited to natural disasters, government actions, or other force majeure events.</p>

                <h2>Contact Information</h2>
                <p>If you have any questions about this disclaimer or our services, please contact us directly. We are committed to providing clear communication and addressing any concerns you may have.</p>

                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </section>

        <CleaningFooter />
      </div>
    </HelmetProvider>
  );
};

export default CleaningDisclaimer;
