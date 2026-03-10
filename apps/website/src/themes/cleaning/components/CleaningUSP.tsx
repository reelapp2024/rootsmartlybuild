
import React, { useEffect, useState } from 'react';
import { Leaf, Shield, Clock, Award, Users, CheckCircle, Star, Sparkles, Zap } from 'lucide-react';
import { httpFile } from '../../../config.js';
import DynamicFAIcon from '../../../extras/DynamicFAIcon.js';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

const CleaningUSP = () => {
  const [usps, setUsps] = useState<any[]>([]);
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
        if (Array.isArray(info.whatMakesUsDifferent)) {
          setUsps(info.whatMakesUsDifferent);
        } else {
          setUsps([
            { iconClass: '', title: '100% Eco-Friendly', description: 'Safe, non-toxic cleaning products.' },
            { iconClass: '', title: 'Same-Day Service', description: 'Flexible scheduling with same-day booking.' },
            { iconClass: '', title: 'Bonded & Insured', description: 'Fully insured and background-checked staff.' },
            { iconClass: '', title: 'Quality Guarantee', description: "100% satisfaction guarantee." },
            { iconClass: '', title: 'Trained Professionals', description: 'Experienced, uniformed professionals.' },
            { iconClass: '', title: 'Consistent Results', description: 'Reliable, consistent results every time.' }
          ]);
        }
      } catch (e) {
        // keep fallback content
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
                What Makes Us Different
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
              What Makes Us Different
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              Our unique advantages that set us apart from other cleaning services
            </p>
          </div>

          {/* USP Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {usps.map((usp, index) => (
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
                      {usp.iconClass ? (
                        <DynamicFAIcon iconClass={usp.iconClass} className="text-2xl text-white" />
                      ) : (
                        <Leaf className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 
                      className="text-xl font-bold mb-3"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      {usp.title}
                    </h3>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      {usp.description}
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

          {/* Bottom CTA Section */}
          <div className="mt-16 text-center">
            <div 
              className="inline-flex items-center justify-center bg-white rounded-2xl shadow-xl p-6 border-2"
              style={{ borderColor: currentTheme.elements.ring }}
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                  boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                }}
              >
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 
                  className="text-lg font-bold mb-1"
                  style={{ color: currentTheme.elements.surface }}
                >
                  Experience the Difference
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.elements.surface }}
                >
                  Choose the cleaning service that goes above and beyond
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CleaningUSP;
