

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { httpFile } from "../../../config.js";
import { Home, Building, Sparkles, Car, Sofa, Shirt } from 'lucide-react';
import { getProjectId } from '../../../hooks/getProjectId'; // Import the utility
import { Helmet } from 'react-helmet-async';
import { generateServicesSchema } from "../../../hooks/schemaMarkup";
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';

const CleaningServices = ({ formattedLocationName = "" }) => {
  const [projectServices, setProjectServices] = useState([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  const [projectId, setProjectId] = useState(null); // Initialize as null

  useEffect(() => {
    // Get projectId from utility function
    const id = getProjectId();

    console.log(id, "this is id")
    setProjectId(id); // Set projectId in state
  }, []);

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
  // Helper to truncate at first period
  const getTruncatedDescription = (text) => {
    if (!text) return '';
    const idx = text.indexOf('.');
    return idx !== -1 ? text.substring(0, idx + 1) : text;
  };

  const handleServiceClick = (service) => {
    const serviceName = service.service_name.toLowerCase().replace(/\s+/g, '-');
    return `/services/${serviceName}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_services", { projectId });
        if (data) {
          console.log('📊 Services API Response:', data);
          console.log('🖼️ Services with images:', data.services?.map(s => ({
            name: s.service_name,
            hasImages: !!s.images,
            imageCount: s.images?.length || 0,
            firstImage: s.images?.[0]?.url
          })));
          setProjectServices(data.services || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "cleaningServices"
        });
        if (data.projectInfo && data.projectInfo.serviceType) {
          setProjectCategory(data.projectInfo.serviceType);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [projectId]);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme && colorThemes.find(theme => theme.name === savedTheme)) {
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

  const servicesSchema = generateServicesSchema(projectServices);

  return (
    <>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <Helmet>
        {projectServices.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(servicesSchema)}
          </script>
        )}
      </Helmet>

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
                Our Services
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
              Our {projectCategory} Services {formattedLocationName}
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              Comprehensive {projectCategory} solutions for you and we make sure for professional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectServices.map((service, index) => {
              const shortDesc = getTruncatedDescription(service.service_description);
              return (
                <Link
                  key={index}
                  to={handleServiceClick(service)}
                  state={{
                    serviceId: service._id,
                    serviceName: service.service_name,
                    serviceDescription: service.service_description,
                    serviceImage: service.images[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
                    serviceImage1: service.images[1]?.url || "https://img.free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
                    serviceImage2: service.images[2]?.url || "https://img.free-photo/standard-quality-control-concept-m_23-2150041850.jpg"
                  }}
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
                    {/* Image Container */}
                    <div className="relative h-40 overflow-hidden rounded-xl mb-6 bg-gray-100">
                      <img
                        src={service.images[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"}
                        alt={service.service_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.log('❌ Image failed to load:', service.images[0]?.url);
                          e.target.src = "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg";
                        }}
                        style={{
                          minHeight: '160px',
                          backgroundColor: '#f3f4f6'
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      <div 
                        className="absolute top-3 left-3 rounded-lg p-2 text-white shadow-md"
                        style={{
                          backgroundColor: currentTheme.elements.accent
                        }}
                      >
                        <i className={service.fas_fa_icon} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 
                        className="text-xl font-bold mb-3"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {service.service_name} {formattedLocationName}
                      </h3>
                      <p 
                        className="leading-relaxed text-sm"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        {shortDesc}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

    </>
  );
};

export default CleaningServices;
