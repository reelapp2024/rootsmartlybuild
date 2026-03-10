import React, { useState, useEffect } from 'react';
import { httpFile } from '../../../config.js';
import DynamicFAIcon from '../../../extras/DynamicFAIcon.js';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';

interface CleaningWhyChooseUsProps {
  items?: any[]; // Optional prop from CleaningCountry
}

const CleaningWhyChooseUs: React.FC<CleaningWhyChooseUsProps> = ({ items }) => {
  const [projectCategory, setProjectCategory] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectWhyChooseUs, setProjectWhyChooseUs] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
  const projectId = import.meta.env.VITE_PROJECT_ID;

  useEffect(() => {
    // Only fetch data if items prop is not provided
    if (!items) {
      const fetchData = async () => {
        try {
          const { data } = await httpFile.post('/webapp/v1/my_site', {
            projectId,
            pageType: 'home',
            reqFrom: 'Whychooseus',
          });

          if (data.projectInfo) {
            setProjectCategory(data.projectInfo.serviceType || '');
            setProjectName(data.projectInfo.projectName || '');
            setProjectWhyChooseUs(data.projectInfo.whyChooseUsSection || []);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchData();
    }
  }, [projectId, items]);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme) {
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

  // Use provided items or fallback to fetched projectWhyChooseUs
  const finalItems = items || projectWhyChooseUs;

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
              Why Choose Us
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
            Why Choose {projectName || 'Us'}?
          </h2>
          
          <p 
            className="text-lg max-w-3xl mx-auto leading-relaxed"
            style={{ color: currentTheme.elements.surface }}
          >
            Experience the difference with our professional {projectCategory} services. 
            We combine expertise, reliability, and cutting-edge technology to deliver 
            exceptional results that exceed your expectations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {finalItems.length > 0 ? (
            finalItems.map((feature, index) => (
              <div 
                key={index} 
                className="group relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
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
                      <DynamicFAIcon 
                        iconClass={feature.iconClass || ''} 
                        className="text-white text-xl"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 
                      className="text-xl font-bold mb-3"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      {feature.title}
                    </h3>
                    <p 
                      className="leading-relaxed text-sm"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      {feature.description}
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
                <span className="text-white text-3xl">📋</span>
              </div>
              <p 
                className="text-xl"
                style={{ color: currentTheme.elements.surface }}
              >
                No reasons listed yet.
              </p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default CleaningWhyChooseUs;