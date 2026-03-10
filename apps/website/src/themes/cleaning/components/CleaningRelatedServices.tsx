import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { httpFile } from "../../../config.js";
import DynamicFAIcon from '../../../extras/DynamicFAIcon.js';
import { getProjectId } from '../../../hooks/getProjectId';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';
import { CheckCircle, Sparkles } from 'lucide-react';

const CleaningRelatedServices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projectServices, setProjectServices] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  const savedSiteId = localStorage.getItem("currentSiteId");
  const [projectId, setProjectId] = useState(null);

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
    // Get projectId from utility function
    const id = getProjectId();
    console.log(id, "this is id")
    setProjectId(id);
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await httpFile.post("/webapp/v1/fetch_random_services", {
        projectId,
      });
      if (data) {
        setProjectServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (location.state) {
      fetchData();
    }
  }, [location]);

  const handleServiceClick = (service) => {
    const serviceName = service.service_name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/services/${serviceName}`, {
      state: {
        serviceId: service._id,
        serviceName: service.service_name,
        serviceDescription: service.service_description,
        serviceImage: service.images?.[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
        serviceImage1: service.images?.[1]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
        serviceImage2: service.images?.[2]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"
      }
    });
  };

  // Helper to truncate at first period
  const getTruncatedDescription = (text) => {
    if (!text) return '';
    const idx = text.indexOf('.');
    return idx !== -1 ? text.substring(0, idx + 1) : text;
  };

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
                Related Services
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
              Related Services
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              Explore our complete range of professional services
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {projectServices.map((service, index) => {
              const shortDesc = getTruncatedDescription(service.service_description);
              return (
                <div 
                  key={index} 
                  className="group relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <button
                    onClick={() => handleServiceClick(service)}
                    className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 h-full border-2 w-full text-left"
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
                        <DynamicFAIcon className='text-white text-2xl' iconClass={service.fas_fa_icon || ''} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 
                        className="text-xl font-bold mb-3"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {service.service_name}
                      </h3>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {shortDesc}
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
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div 
              className="inline-flex items-center justify-center bg-white rounded-2xl shadow-xl p-6 border-2"
              style={{ borderColor: currentTheme.elements.ring }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: currentTheme.elements.accent }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h3 
                  className="text-lg font-bold mb-1"
                  style={{ color: currentTheme.elements.surface }}
                >
                  Explore All Services
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.elements.surface }}
                >
                  Discover our complete range of professional solutions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CleaningRelatedServices;