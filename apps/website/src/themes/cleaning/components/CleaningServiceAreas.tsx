import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { httpFile } from "../../../config.js";
import { MapPin, Clock, Shield } from 'lucide-react';
import { slugify } from "../../../extras/slug";
import { useNavigate, useLocation } from "react-router-dom";
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

interface CleaningServiceAreasProps {
  locations?: any[];
}

const CleaningServiceAreas: React.FC<CleaningServiceAreasProps> = ({ locations: propLocations }) => {
  const [projectCategory, setProjectCategory] = useState("");
  const [welcomeLine, setWelcomeLine] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [UpcomingPage, setUpcomingPage] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
  const navigate = useNavigate();
  const location = useLocation();

  // 1) Read the query-param once:
  const urlParams = new URLSearchParams(window.location.search);
  const site = urlParams.get("siteId");

  // 2) Only overwrite localStorage if `site` is a non-null string:
  if (site) {
    const currentSiteId = localStorage.getItem("currentSiteId");
    if (currentSiteId !== site) {
      localStorage.setItem("currentSiteId", site);
    }
  }
  // If `site` is null, do not touch localStorage at all.

  // 3) Now read back from localStorage (or fall back to default):
  const projectId = import.meta.env.VITE_PROJECT_ID;

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "servicesAreas"

        });

        if (data.projectInfo && data.projectInfo.serviceType) {
          setProjectCategory(data.projectInfo.serviceType);
          setWelcomeLine(data.projectInfo.welcomeLine);
          setPhoneNumber(data.aboutUs.phone);
          setUpcomingPage(data.upcomingPage);
          setLocations(data.locations);
        }

        console.log(data.slug, "data.slug")
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && getThemeByName(savedTheme)) {
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

  console.log(locations, "locations");


  const getLocationPath = (locationName, id, _id, sortname) => {
    let nextPage = '';

    if (sortname) {
      console.log("country page so sortname is available")
    }

    if (UpcomingPage === 'country') {
      nextPage = 'States';
    } else if (UpcomingPage === 'state') {
      nextPage = 'Cities';
    } else if (UpcomingPage === 'city') {
      nextPage = 'Local Areas';
    } else if (UpcomingPage === 'local') {
      nextPage = 'whole areas';
    }

    return {
      pathname: `/${slugify(locationName)}`,
      state: {
        id,
        projectId,
        UpcomingPage,
        nextPage,
        locationName,
        sortname,
        _id
      }
    };
  };

 const handleLocationClick = (area, isButtonClick) => {
  const slugPath = `/${area.slug}`;

  // If navigating to this page, pass the scroll flag
  if (location.pathname === slugPath) {
    const areaSection = document.getElementById("area-we-serve-section");
    if (areaSection && isButtonClick) {
      const yOffset = -100; // Adjust for header
      const y = areaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else {
    navigate(slugPath, {
      state: {
        id: area.location_id,
        projectId,
        UpcomingPage,
        nextPage: getNextPage(),
        locationName: area.name,
        sortname: area.sortname,
        _id: area._id,
        scrollToAreaSection: isButtonClick, // Only set to true when button clicked
      }
    });
  }
};


  const getNextPage = () => {
    if (UpcomingPage === 'country') return 'States';
    if (UpcomingPage === 'state') return 'Cities';
    if (UpcomingPage === 'city') return 'Local Areas';
    if (UpcomingPage === 'local') return 'whole areas';
    return '';
  };

  // Use provided locations or fallback to fetched locations
  const finalLocations = propLocations || locations;


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
              Service Areas
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
            Areas We Serve
          </h2>
          
          <p 
            className="text-lg max-w-3xl mx-auto leading-relaxed"
            style={{ color: currentTheme.elements.surface }}
          >
            Professional {projectCategory} services throughout our availability.
          </p>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {finalLocations.length > 0 ? (
            finalLocations.map((area, index) => (
              <div
                key={index}
                className="group relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Area Card */}
                <div
                  className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 h-full border-2 cursor-pointer"
                  style={{
                    borderColor: currentTheme.elements.ring
                  }}
                  onClick={() => handleLocationClick(area, false)}
                >
                  {/* Header with Icon */}
                  <div className="flex items-center mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md mr-4"
                      style={{
                        backgroundColor: currentTheme.elements.accent
                      }}
                    >
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h3 
                      className="text-xl font-bold"
                      style={{ color: currentTheme.elements.surface }}
                    >
                      {area.name}
                    </h3>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                        style={{
                          backgroundColor: currentTheme.elements.accent
                        }}
                      >
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <span 
                        className="text-sm"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        Response time: Extreme
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                        style={{
                          backgroundColor: currentTheme.elements.accent
                        }}
                      >
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <span 
                        className="text-sm"
                        style={{ color: currentTheme.elements.surface }}
                      >
                        100% Original services
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLocationClick(area, true);
                    }}
                    className="w-full py-3 rounded-xl font-semibold transition-all duration-300 text-center"
                    style={{
                      backgroundColor: currentTheme.elements.primaryButton.bg,
                      color: currentTheme.elements.primaryButton.text,
                      boxShadow: `0 4px 15px ${currentTheme.elements.primaryButton.bg}40`
                    }}
                  >
                    See Areas
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: currentTheme.elements.accent }}
              >
                <span className="text-white text-3xl">📍</span>
              </div>
              <p
                className="text-xl"
                style={{ color: currentTheme.elements.surface }}
              >
                No service areas listed yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CleaningServiceAreas;
