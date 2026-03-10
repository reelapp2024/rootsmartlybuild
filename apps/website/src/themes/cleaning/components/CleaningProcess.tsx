import React, { useState, useEffect } from 'react';
import { useProcessData } from '../../../hooks/useProcessData.js';
import DynamicFAIcon from '../../../extras/DynamicFAIcon.js';
import { useNavigate, useLocation } from 'react-router-dom';
import humanizeString from '../../../extras/stringUtils.js';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

interface CleaningProcessProps {
  steps?: any[]; // Optional prop from CleaningCountry
}

const CleaningProcess: React.FC<CleaningProcessProps> = ({ steps }) => {
  const { projectOurProcess, projectCategory, isLoading: hookLoading } = useProcessData();
  const [showName, setShowName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
  const location = useLocation();
  const pathname = location.pathname;
  const slug = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  let cityName = pathname.split('/').pop();
  cityName = showName ? showName : cityName; // Use showName if set
  cityName = cityName ? `in ${humanizeString(cityName)}` : '';

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

  // Use provided steps or fallback to hook data
  const finalSteps = steps || projectOurProcess;
  const finalCategory = projectCategory || 'Cleaning';
  const isLoading = hookLoading && !steps; // Only show loading if no steps prop and hook is loading

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white font-poppins">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="bg-gray-200 h-12 w-64 mx-auto mb-6 rounded"></div>
              <div className="bg-gray-200 h-4 w-96 mx-auto rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-64"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
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
            Our Simple Process
          </h2>
          
          <p 
            className="text-lg max-w-3xl mx-auto leading-relaxed"
            style={{ color: currentTheme.elements.surface }}
          >
            Our streamlined {finalSteps.length}-step process ensures you get professional {finalCategory} service from start to finish {cityName}.
          </p>
        </div>

        {/* Process Flow */}
        <div className="relative">
          {/* Process Steps */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4">
          {finalSteps.length > 0 ? (
            finalSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center group relative" style={{ animationDelay: `${index * 0.1}s` }}>
                  {/* Step Card */}
                  <div
                    className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 w-full max-w-xs border-2"
                    style={{
                      borderColor: currentTheme.elements.ring
                    }}
                  >
                    {/* Step Number Badge */}
                    <div 
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg"
                      style={{
                        backgroundColor: currentTheme.elements.accent,
                        color: 'white'
                      }}
                    >
                  {index + 1}
                </div>
                
                    {/* Icon Container */}
                    <div className="mb-4 mt-2">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-md transition-all duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: currentTheme.elements.accent
                        }}
                      >
                        <DynamicFAIcon iconClass={step.iconClass || ''} className="text-white text-lg" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 
                        className="text-lg font-bold mb-2"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {step.title}
                      </h3>
                      <p 
                        className="leading-relaxed text-sm"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {step.description}
                      </p>
                  </div>
                </div>

                  {/* Connecting Line/Arrow */}
                {index < finalSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                      <div className="flex items-center">
                        {/* Line */}
                        <div 
                          className="w-12 h-0.5"
                          style={{ backgroundColor: currentTheme.elements.accent }}
                        ></div>
                        {/* Arrow */}
                        <div 
                          className="w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-transparent ml-1"
                          style={{ borderLeftColor: currentTheme.elements.accent }}
                        ></div>
                      </div>
                  </div>
                )}
              </div>
            ))
          ) : (
              <div className="col-span-full text-center py-12">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                >
                  <span className="text-white text-3xl">📋</span>
                </div>
                <p
                  className="text-xl"
                  style={{ color: currentTheme.elements.surface }}
                >
                  No process steps listed yet.
                </p>
              </div>
            )}
          </div>

          {/* Mobile Process Flow */}
          <div className="lg:hidden mt-8">
            <div className="space-y-8">
              {finalSteps.length > 0 && finalSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  {/* Step Number */}
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg"
                    style={{
                      backgroundColor: currentTheme.elements.accent,
                      color: 'white'
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div
                      className="bg-white rounded-xl shadow-lg p-4 border-2"
                      style={{
                        borderColor: currentTheme.elements.ring
                      }}
                    >
                      <div className="flex items-center mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md"
                          style={{
                            backgroundColor: currentTheme.elements.accent
                          }}
                        >
                          <DynamicFAIcon iconClass={step.iconClass || ''} className="text-white text-sm" />
                        </div>
                        <h3 
                          className="text-lg font-bold"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Arrow */}
                  {index < finalSteps.length - 1 && (
                    <div className="flex justify-center mt-4">
                      <div 
                        className="w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-transparent"
                        style={{ borderLeftColor: currentTheme.elements.accent }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CleaningProcess;