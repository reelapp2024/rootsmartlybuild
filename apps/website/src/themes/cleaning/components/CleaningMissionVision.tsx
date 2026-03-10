
import React, { useEffect, useState } from 'react';
import { Target, Eye, Sparkles, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { httpFile } from '../../../config.js';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

interface SubHeadingItem {
  title?: string;
  description?: string;
}

const CleaningMissionVision = () => {
  const projectId = import.meta.env.VITE_PROJECT_ID;
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  const [missionLine, setMissionLine] = useState<string>(
    'To provide exceptional cleaning services that create healthy, beautiful environments for families and businesses while using eco-friendly products and sustainable practices.'
  );
  const [visionLine, setVisionLine] = useState<string>(
    'To be the most trusted and preferred cleaning service provider, known for our reliability, quality, and commitment to creating healthier spaces for our community.'
  );
  const [missionSubHeadings, setMissionSubHeadings] = useState<any[]>([
    { title: 'Spotless Results', description: 'Deliver spotless results every time' },
    { title: 'Eco-Safe', description: 'Use environmentally safe products' },
    { title: 'Exceed Expectations', description: 'Exceed customer expectations' }
  ]);
  const [visionSubHeadings, setVisionSubHeadings] = useState<any[]>([
    { title: 'Eco Leadership', description: 'Leading eco-friendly cleaning standards' },
    { title: 'Expansion', description: 'Expanding our service areas' },
    { title: 'Benchmarks', description: 'Setting industry benchmarks' }
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

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
        if (info.missionLine) setMissionLine(info.missionLine);
        if (info.visionLine) setVisionLine(info.visionLine);
        if (Array.isArray(info.missionSubHeadings)) setMissionSubHeadings(info.missionSubHeadings);
        if (Array.isArray(info.visionSubHeadings)) setVisionSubHeadings(info.visionSubHeadings);
      } catch (e) {
        // Keep fallback content on error
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
                Mission & Vision
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
              Our Mission & Vision
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              {isLoading ? 'Loading...' : 'Driving our commitment to excellence in professional cleaning services'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission Card */}
            <div 
              className="group relative"
              style={{ animationDelay: '0.1s' }}
            >
              <div 
                className="relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 h-full border-2"
                style={{ borderColor: currentTheme.elements.ring }}
              >
                {/* Decorative Elements */}
                <div 
                  className="absolute top-4 right-4 w-20 h-20 rounded-full opacity-10"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>
                <div 
                  className="absolute bottom-4 left-4 w-12 h-12 rounded-full opacity-5"
                  style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                ></div>

                {/* Header */}
                <div className="flex items-center mb-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-all duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                      boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
                    }}
                  >
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      Our Mission
                    </h3>
                    <div 
                      className="w-12 h-1 rounded-full"
                      style={{ backgroundColor: currentTheme.elements.accent }}
                    ></div>
                  </div>
                </div>

                {/* Mission Text */}
                <p 
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: currentTheme.elements.surface }}
                >
                  {missionLine}
                </p>

                {/* Mission Points */}
                <div className="space-y-4">
                  {missionSubHeadings.map((item, idx) => {
                    const text = typeof item === 'string' 
                      ? item 
                      : (item?.description || item?.title || item?.text || '');
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center group/item"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-4 group-hover/item:scale-110 transition-all duration-300"
                          style={{ backgroundColor: currentTheme.elements.accent }}
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <span 
                          className="font-medium"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          {text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Decoration */}
                <div className="mt-8 flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: currentTheme.elements.accent }}
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: currentTheme.elements.accent }}
                  >
                    Committed to Excellence
                  </span>
                </div>
              </div>
            </div>

            {/* Vision Card */}
            <div 
              className="group relative"
              style={{ animationDelay: '0.2s' }}
            >
              <div 
                className="relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 h-full border-2"
                style={{ borderColor: currentTheme.elements.ring }}
              >
                {/* Decorative Elements */}
                <div 
                  className="absolute top-4 right-4 w-20 h-20 rounded-full opacity-10"
                  style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                ></div>
                <div 
                  className="absolute bottom-4 left-4 w-12 h-12 rounded-full opacity-5"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                ></div>

                {/* Header */}
                <div className="flex items-center mb-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-all duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${currentTheme.elements.accent}, ${currentTheme.elements.primaryButton.bg})`,
                      boxShadow: `0 10px 30px ${currentTheme.elements.accent}40`
                    }}
                  >
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      Our Vision
                    </h3>
                    <div 
                      className="w-12 h-1 rounded-full"
                      style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                    ></div>
                  </div>
                </div>

                {/* Vision Text */}
                <p 
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: currentTheme.elements.surface }}
                >
                  {visionLine}
                </p>

                {/* Vision Points */}
                <div className="space-y-4">
                  {visionSubHeadings.map((item, idx) => {
                    const text = typeof item === 'string' 
                      ? item 
                      : (item?.description || item?.title || item?.text || '');
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center group/item"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-4 group-hover/item:scale-110 transition-all duration-300"
                          style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                        >
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <span 
                          className="font-medium"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          {text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Decoration */}
                <div className="mt-8 flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: currentTheme.elements.primaryButton.bg }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: currentTheme.elements.primaryButton.bg }}
                  >
                    Building the Future
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CleaningMissionVision;
