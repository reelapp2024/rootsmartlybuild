
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Home, Search, ArrowLeft, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

const NotFound = () => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // Consistent theme colors
  const colors = {
    primaryButton: { bg: '#e11d48', text: '#ffffff', hover: '#be123c' },
    accent: '#f59e0b',
    surface: '#f8fafc',
    heading: '#1f2937',
    description: '#6b7280'
  };

  useEffect(() => {
    // Simple loading timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname
    );
  }, [pathname]);

  // Loading state removed for better UX

  return (
    <div className="min-h-screen font-poppins" style={{ backgroundColor: colors.surface }}>
      <SEOHead 
        title="Page Not Found - Emergency Plumbing Service"
        description="The page you're looking for doesn't exist. Return to our homepage for professional plumbing services."
        canonical="/404"
        noindex={true}
      />
      <Header />
      
      {/* 404 Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 rounded-full" style={{ borderColor: colors.primaryButton.bg }}></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 border-2 rounded-lg rotate-45" style={{ borderColor: colors.accent }}></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border rounded-full" style={{ borderColor: colors.primaryButton.bg }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              {/* 404 Icon */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                }}
              >
                <Search className="w-12 h-12 text-white" />
              </div>
              
              {/* 404 Number */}
              <h1 
                className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-4"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                404
              </h1>
              
              {/* Error Message */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Page Not Found
              </h2>
              
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
                The page you're looking for doesn't exist or has been moved. 
                Don't worry, we'll help you find what you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-8 lg:px-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-6">
              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: colors.primaryButton.bg,
                    color: colors.primaryButton.text
                  }}
                >
                  <Home className="w-5 h-5" />
                  Return to Home
                </Link>
                
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'transparent',
                    color: colors.primaryButton.bg,
                    border: `2px solid ${colors.primaryButton.bg}`
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </button>
              </div>

              {/* Contact Information */}
              <div 
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: `${colors.primaryButton.bg}08`,
                  border: `1px solid ${colors.primaryButton.bg}20`
                }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h3>
                <p className="text-gray-700 mb-4">
                  If you're looking for our services or have any questions, we're here to help!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="tel:(467) 682-3822"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: colors.primaryButton.bg,
                      color: colors.primaryButton.text
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    Call Us Now
                  </a>
                  <a
                    href="mailto:info@example.com"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: 'transparent',
                      color: colors.primaryButton.bg,
                      border: `2px solid ${colors.primaryButton.bg}`
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    Email Us
                  </a>
                </div>
              </div>

              {/* Popular Links */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">Or try these popular pages:</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link
                    href="/services"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: `${colors.primaryButton.bg}10`,
                      color: colors.primaryButton.bg
                    }}
                  >
                    Services
                  </Link>
                  <Link
                    href="/about"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: `${colors.primaryButton.bg}10`,
                      color: colors.primaryButton.bg
                    }}
                  >
                    About Us
                  </Link>
                  <Link
                    href="/contact"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: `${colors.primaryButton.bg}10`,
                      color: colors.primaryButton.bg
                    }}
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NotFound;
