
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Sparkles, Facebook, Twitter, Instagram, Star, CheckCircle } from 'lucide-react';
import { useFooterData } from '../../../hooks/useFooterData.js';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

const CleaningFooter = () => {
  const { footerData, isLoading } = useFooterData();
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme) {
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

  if (isLoading) {
    return (
      <footer 
        className="font-poppins relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center" style={{ color: currentTheme.elements.description }}>
            Loading...
          </div>
        </div>
      </footer>
    );
  }

  const projectName = footerData?.projectName || "SparkleClean Pro";
  const projectSlogan = footerData?.projectSlogan || "Professional Cleaning";
  const welcomeLine = footerData?.welcomeLine || "Professional residential and commercial cleaning services with eco-friendly products and satisfaction guaranteed.";
  const aboutUs = footerData?.aboutUs || {};
  const services = footerData?.services || [];

  return (
    <>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>
      <footer 
        className="font-poppins relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-6">
                <div 
                  className="p-2 rounded-lg mr-3 shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                    boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                  }}
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ color: currentTheme.elements.heading }}
                  >
                    {projectName}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: currentTheme.elements.description }}
                  >
                    {projectSlogan}
                  </p>
                </div>
              </div>
              <p 
                className="mb-6 leading-relaxed"
                style={{ color: currentTheme.elements.description }}
              >
                {welcomeLine}
              </p>
              <div className="flex space-x-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
                  style={{ 
                    backgroundColor: currentTheme.elements.accent + '20',
                    border: `2px solid ${currentTheme.elements.accent}`
                  }}
                >
                  <Facebook className="w-5 h-5" style={{ color: currentTheme.elements.accent }} />
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
                  style={{ 
                    backgroundColor: currentTheme.elements.accent + '20',
                    border: `2px solid ${currentTheme.elements.accent}`
                  }}
                >
                  <Twitter className="w-5 h-5" style={{ color: currentTheme.elements.accent }} />
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
                  style={{ 
                    backgroundColor: currentTheme.elements.accent + '20',
                    border: `2px solid ${currentTheme.elements.accent}`
                  }}
                >
                  <Instagram className="w-5 h-5" style={{ color: currentTheme.elements.accent }} />
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 
                className="text-lg font-bold mb-6"
                style={{ color: currentTheme.elements.heading }}
              >
                Our Services
              </h4>
              <ul className="space-y-3">
                {services.slice(0, 5).map((service, index) => (
                  <li key={index}>
                    <Link
                      to={`/services/${service.service_name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center transition-all duration-300 hover:translate-x-2"
                      style={{ color: currentTheme.elements.description }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" style={{ color: currentTheme.elements.accent }} />
                      <span className="hover:font-semibold">{service.service_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 
                className="text-lg font-bold mb-6"
                style={{ color: currentTheme.elements.heading }}
              >
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/about" 
                    className="flex items-center transition-all duration-300 hover:translate-x-2"
                    style={{ color: currentTheme.elements.description }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: currentTheme.elements.accent }} />
                    <span className="hover:font-semibold">About Us</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/areas" 
                    className="flex items-center transition-all duration-300 hover:translate-x-2"
                    style={{ color: currentTheme.elements.description }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: currentTheme.elements.accent }} />
                    <span className="hover:font-semibold">Service Areas</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="flex items-center transition-all duration-300 hover:translate-x-2"
                    style={{ color: currentTheme.elements.description }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: currentTheme.elements.accent }} />
                    <span className="hover:font-semibold">Contact Us</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms-conditions" 
                    className="flex items-center transition-all duration-300 hover:translate-x-2"
                    style={{ color: currentTheme.elements.description }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: currentTheme.elements.accent }} />
                    <span className="hover:font-semibold">Terms & Conditions</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/privacy-policy" 
                    className="flex items-center transition-all duration-300 hover:translate-x-2"
                    style={{ color: currentTheme.elements.description }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: currentTheme.elements.accent }} />
                    <span className="hover:font-semibold">Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/disclaimer" 
                    className="flex items-center transition-all duration-300 hover:translate-x-2"
                    style={{ color: currentTheme.elements.description }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: currentTheme.elements.accent }} />
                    <span className="hover:font-semibold">Disclaimer</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 
                className="text-lg font-bold mb-6"
                style={{ color: currentTheme.elements.heading }}
              >
                Contact Info
              </h4>
              <div className="space-y-4">
                {aboutUs.phone && (
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    >
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <span style={{ color: currentTheme.elements.description }}>{aboutUs.phone}</span>
                  </div>
                )}
                {aboutUs.email && (
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    >
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <span style={{ color: currentTheme.elements.description }}>{aboutUs.email}</span>
                  </div>
                )}

                {aboutUs.mainLocation && (
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    >
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span style={{ color: currentTheme.elements.description }}>{aboutUs.mainLocation}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  >
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span style={{ color: currentTheme.elements.description }}>Mon-Sat: 7AM-6PM</span>
                </div>
              </div>
            </div>
          </div>

          <div 
            className="border-t mt-12 pt-8"
            style={{ borderColor: currentTheme.elements.ring }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p 
                className="text-sm"
                style={{ color: currentTheme.elements.description }}
              >
                © 2025 {projectName}. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link 
                  to="/terms-conditions" 
                  className="text-sm transition-all duration-300 hover:font-semibold"
                  style={{ color: currentTheme.elements.description }}
                >
                  Terms
                </Link>
                <Link 
                  to="/privacy-policy" 
                  className="text-sm transition-all duration-300 hover:font-semibold"
                  style={{ color: currentTheme.elements.description }}
                >
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default CleaningFooter;
