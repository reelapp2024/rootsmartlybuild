
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Sparkles } from 'lucide-react';
import { useCTAData } from '../../../hooks/useCTAData.js';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

const CleaningCTA = () => {
  const {
    phoneNumber,
    CTA,
    projectCategory,
    isLoading
  } = useCTAData();

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
      <section 
        className="py-16 font-poppins relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">
            <div 
              className="h-8 w-64 mx-auto mb-4 rounded"
              style={{ backgroundColor: currentTheme.elements.heading + '20' }}
            ></div>
            <div 
              className="h-4 w-96 mx-auto mb-8 rounded"
              style={{ backgroundColor: currentTheme.elements.description + '20' }}
            ></div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div 
                className="h-12 w-48 rounded-full"
                style={{ backgroundColor: currentTheme.elements.primaryButton.bg + '20' }}
              ></div>
              <div 
                className="h-12 w-48 rounded-full"
                style={{ backgroundColor: currentTheme.elements.secondaryButton.bg + '20' }}
              ></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
              {CTA}
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.description }}
            >
              Transform your world with our professional {projectCategory} services.  
              Top-tier quality, experienced professionals, and satisfaction guaranteed every time.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
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
    </>
  );
};

export default CleaningCTA;