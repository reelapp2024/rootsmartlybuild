
import React, { useEffect, useState } from 'react';
import { Heart, Users, Leaf, Award, Clock, Shield, Star, CheckCircle, Sparkles } from 'lucide-react';
import { httpFile } from '../../../config.js';
import DynamicFAIcon from '../../../extras/DynamicFAIcon.js';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

const CleaningValues = () => {
  const [values, setValues] = useState<any[]>([]);
  const [commitment, setCommitment] = useState<string>(
    "At our core, we believe that a clean environment contributes to better health, increased productivity, and overall well-being. This belief drives us to continuously improve our services, invest in our team's training, and adopt the latest cleaning technologies and methods."
  );
  const [commitment2, setCommitment2] = useState<string>(
    "We don't just clean spaces; we create healthier environments where families can thrive and businesses can prosper. Every job we complete is a testament to our dedication to quality and our commitment to making a positive difference in our clients' lives."
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  const projectId = import.meta.env.VITE_PROJECT_ID;

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post('/webapp/v1/my_site', {
          projectId,
          pageType: 'home'
        });
        const info = data?.projectInfo || {};

        if (Array.isArray(info.coreValues)) {
          setValues(info.coreValues);
        } else {
          setValues([
            { iconClass: '', title: 'Customer First', description: 'Your satisfaction is our top priority.' },
            { iconClass: '', title: 'Professional Team', description: 'Trained, insured and experienced professionals.' },
            { iconClass: '', title: 'Eco-Friendly', description: 'Environmentally safe, non-toxic products.' },
            { iconClass: '', title: 'Quality Standards', description: 'Highest standards of cleanliness and control.' },
            { iconClass: '', title: 'Reliability', description: 'On-time, efficient and thorough service.' },
            { iconClass: '', title: 'Trust & Safety', description: 'Licensed, bonded, insured for your peace of mind.' }
          ]);
        }

        if (info.commitment) setCommitment(info.commitment);
        if (info.commitment2) setCommitment2(info.commitment2);
      } catch (e) {
        // keep fallbacks
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

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
                Core Values
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
              Our Core Values
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              These fundamental principles guide everything we do and define who we are as a cleaning service provider.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {values.map((value, index) => (
              <div 
                key={index} 
                className="group relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div 
                  className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 h-full border-2"
                  style={{ borderColor: currentTheme.elements.ring }}
                >
                  {/* Decorative Elements */}
                  <div 
                    className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-5"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  ></div>
                  <div 
                    className="absolute bottom-4 left-4 w-8 h-8 rounded-full opacity-10"
                    style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                  ></div>

                  {/* Icon */}
                  <div className="text-center mb-6">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                        boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                      }}
                    >
                      {value.iconClass ? (
                        <DynamicFAIcon iconClass={value.iconClass} className="text-2xl text-white" />
                      ) : (
                        <Heart className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 
                      className="text-xl font-bold mb-3"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      {value.title}
                    </h3>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      {value.description}
                    </p>
                  </div>

                  {/* Bottom Decoration */}
                  <div className="mt-6 flex items-center justify-center">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    >
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Commitment Section */}
          <div 
            className="relative bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2"
            style={{ borderColor: currentTheme.elements.ring }}
          >
            {/* Decorative Elements */}
            <div 
              className="absolute top-6 right-6 w-20 h-20 rounded-full opacity-5"
              style={{ backgroundColor: currentTheme.elements.accent }}
            ></div>
            <div 
              className="absolute bottom-6 left-6 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
            ></div>

            <div className="text-center relative">
              <div className="flex items-center justify-center mb-6">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                    boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                  }}
                >
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 
                  className="text-2xl font-bold"
                  style={{ color: currentTheme.elements.surface }}
                >
                  Our Commitment to Excellence
                </h3>
              </div>
              
              <div className="space-y-6">
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: currentTheme.elements.surface }}
                >
                  {commitment}
                </p>
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: currentTheme.elements.surface }}
                >
                  {commitment2}
                </p>
              </div>

              {/* Bottom CTA */}
              <div className="mt-8 flex items-center justify-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span 
                  className="text-sm font-semibold"
                  style={{ color: currentTheme.elements.accent }}
                >
                  Committed to Your Success
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CleaningValues;
