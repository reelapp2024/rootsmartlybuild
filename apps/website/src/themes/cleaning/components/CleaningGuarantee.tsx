import React, { useEffect, useState } from 'react';
import { useGuaranteeData } from '../../../hooks/useGuaranteeData.js';
import DynamicFAIcon from '../../../extras/DynamicFAIcon.js';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

interface CleaningGuaranteeProps {
  guarantees?: any[];
  guaranteeText?: string;
  promiseLine?: string;
}

const CleaningGuarantee: React.FC<CleaningGuaranteeProps> = ({
  guarantees: propGuarantees,
  guaranteeText: propGuaranteeText,
  promiseLine: propPromiseLine,
}) => {
  const { guarantees: hookGuarantees, guaranteeText: hookGuaranteeText, promiseLine: hookPromiseLine, projectCategory, isLoading } = useGuaranteeData();
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  // Use provided props or fallback to hook data
  const finalGuarantees = propGuarantees || hookGuarantees;
  const finalGuaranteeText = propGuaranteeText || hookGuaranteeText;
  const finalPromiseLine = propPromiseLine || hookPromiseLine;
  const finalCategory = projectCategory || 'Cleaning';

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

  if (isLoading && !propGuarantees) {
    return (
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 font-poppins">
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
            Our {finalCategory} Guarantee
          </h2>
          
          <p 
            className="text-lg max-w-3xl mx-auto leading-relaxed"
            style={{ color: currentTheme.elements.surface }}
          >
            {finalGuaranteeText || 'We stand behind our work with a commitment to quality and satisfaction.'}
          </p>
        </div>

        {/* Guarantee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {finalGuarantees.length > 0 ? (
            finalGuarantees.map((guarantee, index) => (
              <div key={index} className="group relative" style={{ animationDelay: `${index * 0.1}s` }}>
                {/* Card */}
                <div
                  className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 h-full border-2"
                  style={{
                    borderColor: currentTheme.elements.ring
                  }}
                >
                  {/* Icon Container */}
                  <div className="mb-6">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto shadow-md transition-all duration-300"
                      style={{
                        backgroundColor: currentTheme.elements.accent
                      }}
                    >
                      <DynamicFAIcon iconClass={guarantee.iconClass || ''} className="text-white text-xl" />
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
                      className="leading-relaxed text-sm"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      {guarantee.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: currentTheme.elements.accent }}
              >
                <span className="text-white text-3xl">🛡️</span>
              </div>
              <p
                className="text-xl"
                style={{ color: currentTheme.elements.surface }}
              >
                No guarantees listed yet.
              </p>
            </div>
          )}
        </div>

        {/* Promise Section */}
        <div className="text-center">
          <div 
            className="bg-white rounded-2xl p-8 shadow-xl max-w-4xl mx-auto border-2"
            style={{
              borderColor: currentTheme.elements.ring
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center mr-4 shadow-md"
                style={{
                  backgroundColor: currentTheme.elements.accent
                }}
              >
                <span className="text-white text-2xl">✓</span>
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
              {finalPromiseLine || 'We promise to deliver exceptional cleaning services with complete satisfaction.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CleaningGuarantee;