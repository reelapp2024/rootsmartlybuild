import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Menu, X, ChevronDown } from 'lucide-react';
import { useHeaderData } from '../../../hooks/useHeaderData.js';
import { httpFile } from "../../../config.js";
import { getProjectId } from '../../../hooks/getProjectId';
import { getThemeByName, defaultTheme } from '../colors.js';

const CleaningHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const navigate = useNavigate();

  
  const {
    phoneNumber,
    projectName,
    projectCategory,
    projectFasFA,
    projectSlogan,
    isLoading
  } = useHeaderData();

  const [projectId, setProjectId] = useState(null);
  const currentTheme = getThemeByName(selectedTheme);


  useEffect(() => {
    const id = getProjectId();
    console.log(id, "this is id");
    setProjectId(id);
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    // Try multiple localStorage keys for compatibility
    const savedTheme = localStorage.getItem('cleaningTheme') || 
                       localStorage.getItem('selectedTheme') || 
                       localStorage.getItem('theme');
    if (savedTheme && getThemeByName(savedTheme)) {
      setSelectedTheme(savedTheme);
    }
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setSelectedTheme(newTheme);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const formData = new FormData();
        formData.append('projectId', projectId);
        
        const response = await httpFile.post('/webapp/v1/getheader', formData);
        
        if (response.data && response.data.services) {
          setServices(response.data.services);
        }
        
        if (response.data && response.data.locations) {
          setLocations(response.data.locations);
        }
      } catch (error) {
        console.error("Error fetching header data:", error);
      }
    };

    if (projectId) {
      fetchHeaderData();
    }
  }, [projectId]);

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services', hasDropdown: true },
    { name: 'Areas', href: '/areas', hasDropdown: true },
    { name: 'Contact', href: '/contact' }
  ];

  const handleServiceClick = (service) => {
    const serviceSlug = service.service_name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/services/${serviceSlug}`, {
      state: {
        serviceId: service._id,
        serviceName: service.service_name,
        serviceDescription: service.service_description,
        serviceImage: service.images[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
        serviceImage1: service.images[1]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
        serviceImage2: service.images[2]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"
      }
    });
  };

  const handleAreaClick = (location) => {
    navigate(`/${location.slug}`, {
      state: {
        locationData: location,
        pageType: location.slugType,
        id: location.location_id,
        projectId,
        UpcomingPage: location.slugType,
        locationName: location.name,
        _id: location.location_id
      }
    });
  };

  if (isLoading) {
    return (
      <header className="bg-white shadow-lg sticky top-0 z-50 font-poppins">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header 
        className="shadow-lg sticky top-0 z-50 font-poppins border-b"
        style={{
          backgroundColor: currentTheme.elements.surface,
          borderColor: currentTheme.elements.ring
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div 
                  className="w-12 h-12 rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                    boxShadow: `0 4px 15px ${currentTheme.elements.shadow}`
                  }}
                >
                  <i className={`fas ${projectFasFA} text-white text-lg`}></i>
                </div>
                <div 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>

              <Link to="/" className="flex flex-col">
                <h1 
                  className="text-2xl font-bold leading-tight"
                  style={{ color: currentTheme.elements.heading }}
                >
                  {projectName}
                </h1>
                <p 
                  className="text-sm font-medium"
                  style={{ color: currentTheme.elements.description }}
                >
                  {projectSlogan}
                </p>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => (
                <div key={item.name} className="relative group">
                  {item.hasDropdown ? (
                    <>
                      <Link
                        to={item.href}
                        className="font-semibold text-sm transition-colors duration-200 flex items-center py-2"
                        style={{ color: currentTheme.elements.heading }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.color = currentTheme.elements.primaryButton.bg;
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.color = currentTheme.elements.heading;
                        }}
                      >
                        {item.name}
                        <ChevronDown size={14} className="ml-1 group-hover:rotate-180 transition-transform duration-300" />
                      </Link>
                    
                    {/* Services Dropdown */}
                    {item.name === 'Services' && (
                      <div 
                        className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                        style={{
                          backgroundColor: currentTheme.elements.surface,
                          border: `1px solid ${currentTheme.elements.ring}`,
                          boxShadow: `0 8px 25px ${currentTheme.elements.shadow}`
                        }}
                      >
                        {services.slice(0, 5).map((service) => (
                          <Link
                            key={service._id}
                            to={`/services/${service.service_name.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => handleServiceClick(service)}
                            onContextMenu={(e) => e.stopPropagation()}
                            className="block w-full text-left px-4 py-3 transition-colors duration-200"
                            style={{ color: currentTheme.elements.heading }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}20`;
                              (e.target as HTMLElement).style.color = currentTheme.elements.primaryButton.bg;
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = 'transparent';
                              (e.target as HTMLElement).style.color = currentTheme.elements.heading;
                            }}
                          >
                            <div className="flex items-center">
                              <i 
                                className={`${service.fas_fa_icon} mr-3`}
                                style={{ color: currentTheme.elements.accent }}
                              ></i>
                              <span>{service.service_name}</span>
                            </div>
                          </Link>
                        ))}
                        <div 
                          className="border-t mt-2 pt-2"
                          style={{ borderColor: currentTheme.elements.ring }}
                        >
                          <Link
                            to="/services"
                            className="block w-full text-left px-4 py-3 font-semibold transition-colors duration-200"
                            style={{ color: currentTheme.elements.primaryButton.bg }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}20`;
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            View All Services
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Areas Dropdown */}
                    {item.name === 'Areas' && (
                      <div 
                        className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                        style={{
                          backgroundColor: currentTheme.elements.surface,
                          border: `1px solid ${currentTheme.elements.ring}`,
                          boxShadow: `0 8px 25px ${currentTheme.elements.shadow}`
                        }}
                      >
                        {locations.slice(0, 5).map((location) => (
                          <Link
                            key={location.location_id}
                            to={`/${location.slug}`}
                            onClick={() => handleAreaClick(location)}
                            onContextMenu={(e) => e.stopPropagation()}
                            className="block w-full text-left px-4 py-3 transition-colors duration-200"
                            style={{ color: currentTheme.elements.heading }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}20`;
                              (e.target as HTMLElement).style.color = currentTheme.elements.primaryButton.bg;
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = 'transparent';
                              (e.target as HTMLElement).style.color = currentTheme.elements.heading;
                            }}
                          >
                            {location.name}
                          </Link>
                        ))}
                        <div 
                          className="border-t mt-2 pt-2"
                          style={{ borderColor: currentTheme.elements.ring }}
                        >
                          <Link
                            to="/areas"
                            className="block w-full text-left px-4 py-3 font-semibold transition-colors duration-200"
                            style={{ color: currentTheme.elements.primaryButton.bg }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}20`;
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            View All Areas
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                  ) : (
                    <Link
                      to={item.href}
                      className="font-semibold text-sm transition-colors duration-200 py-2"
                      style={{ color: currentTheme.elements.heading }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color = currentTheme.elements.primaryButton.bg;
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color = currentTheme.elements.heading;
                      }}
                    >
                      {item.name}
                    </Link>
                  )}
              </div>
            ))}
          </nav>

          {/* Call Button */}
          <div className="hidden md:flex items-center">
            <a
              href={`tel:${phoneNumber}`}
              className="px-6 py-3 rounded-full font-bold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
              style={{
                backgroundColor: currentTheme.elements.primaryButton.bg,
                color: currentTheme.elements.primaryButton.text,
                boxShadow: `0 4px 15px ${currentTheme.elements.shadow}`
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = currentTheme.elements.primaryButton.hover;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = currentTheme.elements.primaryButton.bg;
              }}
            >
              <Phone size={16} />
              <span>{phoneNumber}</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-all duration-300"
            style={{
              color: currentTheme.elements.heading,
              backgroundColor: isMenuOpen ? `${currentTheme.elements.primaryButton.bg}20` : 'transparent'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = currentTheme.elements.primaryButton.bg;
              (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}20`;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = currentTheme.elements.heading;
              (e.target as HTMLElement).style.backgroundColor = isMenuOpen ? `${currentTheme.elements.primaryButton.bg}20` : 'transparent';
            }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            className="md:hidden py-4 border-t"
            style={{
              borderColor: currentTheme.elements.ring,
              backgroundColor: `${currentTheme.elements.surface}20`
            }}
          >
            <div className="flex flex-col space-y-3">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    className="font-semibold text-sm transition-colors duration-200 text-left block py-3 px-4"
                    style={{ color: currentTheme.elements.heading }}
                    onClick={() => setIsMenuOpen(false)}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = currentTheme.elements.primaryButton.bg;
                      (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}10`;
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color = currentTheme.elements.heading;
                      (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {item.name}
                  </Link>
                  
                  {/* Mobile Services */}
                  {item.name === 'Services' && (
                    <div className="pl-4 mt-2 space-y-2">
                      {services.slice(0, 5).map((service) => (
                        <Link
                          key={service._id}
                          to={`/services/${service.service_name.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => {
                            handleServiceClick(service);
                            setIsMenuOpen(false);
                          }}
                          onContextMenu={(e) => e.stopPropagation()}
                          className="block w-full text-left py-2 text-sm transition-colors duration-200"
                          style={{ color: currentTheme.elements.heading }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.color = currentTheme.elements.primaryButton.bg;
                            (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}10`;
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.color = currentTheme.elements.heading;
                            (e.target as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          <div className="flex items-center">
                            <i 
                              className={`${service.fas_fa_icon} mr-2 text-xs`}
                              style={{ color: currentTheme.elements.accent }}
                            ></i>
                            <span>{service.service_name}</span>
                          </div>
                        </Link>
                      ))}
                      <Link
                        to="/services"
                        className="block w-full text-left py-2 text-sm font-semibold transition-colors duration-200"
                        style={{ color: currentTheme.elements.primaryButton.bg }}
                        onClick={() => setIsMenuOpen(false)}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}20`;
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        View All Services
                      </Link>
                    </div>
                  )}

                  {/* Mobile Areas */}
                  {item.name === 'Areas' && (
                    <div className="pl-4 mt-2 space-y-2">
                      {locations.slice(0, 5).map((location) => (
                        <Link
                          key={location.location_id}
                          to={`/${location.slug}`}
                          onClick={() => {
                            handleAreaClick(location);
                            setIsMenuOpen(false);
                          }}
                          onContextMenu={(e) => e.stopPropagation()}
                          className="block w-full text-left py-2 text-sm transition-colors duration-200"
                          style={{ color: currentTheme.elements.heading }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.color = currentTheme.elements.primaryButton.bg;
                            (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}10`;
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.color = currentTheme.elements.heading;
                            (e.target as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          {location.name}
                        </Link>
                      ))}
                      <Link
                        to="/areas"
                        className="block w-full text-left py-2 text-sm font-semibold transition-colors duration-200"
                        style={{ color: currentTheme.elements.primaryButton.bg }}
                        onClick={() => setIsMenuOpen(false)}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = `${currentTheme.elements.primaryButton.bg}20`;
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        View All Areas
                      </Link>
                    </div>
                  )}
                </div>
              ))}
              <a
                href={`tel:${phoneNumber}`}
                className="px-6 py-3 rounded-full font-bold flex items-center justify-center space-x-2 w-full mt-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
                  color: currentTheme.elements.primaryButton.text,
                  boxShadow: `0 4px 15px ${currentTheme.elements.shadow}`
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1.05)';
                  (e.target as HTMLElement).style.boxShadow = `0 8px 25px ${currentTheme.elements.shadow}`;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                  (e.target as HTMLElement).style.boxShadow = `0 4px 15px ${currentTheme.elements.shadow}`;
                }}
              >
                <Phone size={16} />
                <span>{phoneNumber}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
};

export default CleaningHeader;