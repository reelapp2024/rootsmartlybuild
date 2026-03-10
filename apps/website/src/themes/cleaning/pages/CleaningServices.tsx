import React, { useEffect, useState } from 'react';

import { useLocation } from "react-router-dom";
import humanizeString from "../../../extras/stringUtils.js";
import { httpFile } from "../../../config.js";

import CleaningHeader from '../components/CleaningHeader';
import CleaningCTA from '../components/CleaningCTA';
import CleaningServices from '../components/CleaningServices';
import CleaningWhyChooseUs from '../components/CleaningWhyChooseUs';
import CleaningGuarantee from '../components/CleaningGuarantee';
import CleaningProcess from '../components/CleaningProcess';
import CleaningServiceAreas from '../components/CleaningServiceAreas';
import CleaningFAQ from '../components/CleaningFAQ';
import CleaningFooter from '../components/CleaningFooter';
import CleaningLoader from '../components/CleaningLoader';
import { Sparkles } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';

const CleaningServicesPage = () => {
  const [projectCategory, setProjectCategory] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescriptions, setProjectDescriptions] = useState([]);
  let [locationName, setDisplayLocationName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
  const [isLoading, setIsLoading] = useState(true);

const formattedLocationName = locationName ? `in ${locationName}` : "";
  const projectId = import.meta.env.VITE_PROJECT_ID;

  // Load saved theme from localStorage
  useEffect(() => {
    // Try multiple localStorage keys for compatibility
    const savedTheme = localStorage.getItem('cleaningTheme') || 
                       localStorage.getItem('selectedTheme') || 
                       localStorage.getItem('theme');
    if (savedTheme && getThemeByName(savedTheme)) {
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

  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  let cumulativePath = '';

const pathname = location.pathname;

// Remove trailing '/services' if present
let locationSlug = pathname;

// If pathname ends with '/services', remove it
if (locationSlug.endsWith('/services')) {
  locationSlug = locationSlug.slice(0, -('/services'.length));
}

// Remove leading '/' if needed
if (locationSlug.startsWith('/')) {
  locationSlug = locationSlug.slice(1);
}

console.log(locationSlug, "locationSlug");

    useEffect(() => {
       const fetchPageType = async () => {
         try {
           const { data } = await httpFile.post("/webapp/v1/slugToPageType", {
             projectId,
             slug:locationSlug
           });
   
           console.log(data,"<<<<<>>>>>>>>data of slug")
   
           if (data?.slugType) {
             setDisplayLocationName(data.showName);
           }
   
           
         } catch (error) {
           console.error("Error fetching page type:", error);
           
         }
       };
   
   
   
       if (locationSlug) {
         fetchPageType();
       }
     }, [locationSlug, projectId]);


  useEffect(() => {
    const fetchBasicProjectInfo = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/basic_project_info", {
          projectId
        });

        if (data) {
          setProjectCategory(data.serviceType || "");
          setProjectName(data.projectName || "");
          setProjectDescriptions(data.descriptions || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching basic project info:", error);
      }
    };

    if (projectId) {
      console.log("Fetching basic project info for projectId:", projectId);
      fetchBasicProjectInfo();
    } else {
      console.log("No projectId available for fetching basic project info");
    }
  }, [projectId]);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme && colorThemes.find(theme => theme.name === savedTheme)) {
      console.log('🎨 Services: Loading saved theme:', savedTheme);
      setSelectedTheme(savedTheme);
      setCurrentTheme(getThemeByName(savedTheme));
    } else {
      console.log('🎨 Services: Using default theme:', defaultTheme);
    }
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      console.log('🎨 Services: Theme changed to:', newTheme);
      setSelectedTheme(newTheme);
      setCurrentTheme(getThemeByName(newTheme));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  if (isLoading) return <CleaningLoader />;

  return (
    <div className="min-h-screen font-poppins">
      <CleaningHeader />



      {/* Services Hero */}
      <section 
        className="relative py-20 text-white overflow-hidden min-h-[500px] flex items-center"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.elements.surface}85, ${currentTheme.elements.gradient.to}85)`
          }}
        ></div>

        {/* animated dots */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                backgroundColor: currentTheme.elements.accent,
                animationDelay: Math.random() * 3 + 's',
                animationDuration: Math.random() * 3 + 2 + 's'
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Hero Content */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Sparkles 
                className="w-8 h-8 mr-3" 
                style={{ color: currentTheme.elements.accent }}
              />
              <h1 
                className="text-4xl md:text-5xl font-bold"
                style={{ color: currentTheme.elements.heading }}
              >
                Our {projectCategory} Services {formattedLocationName}
              </h1>
            </div>
            <p 
              className="text-xl max-w-3xl mx-auto"
              style={{ color: currentTheme.elements.description }}
            >
              {projectDescriptions[2]}
            </p>
          </div>

          {/* Breadcrumb */}
          <div className="flex justify-center">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center" style={{ color: currentTheme.elements.description }}>
                      <Home className="w-4 h-4 mr-1" />
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium" style={{ color: currentTheme.elements.accent }}>Services</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </section>
      

  <CleaningServices formattedLocationName={formattedLocationName} />

      <CleaningWhyChooseUs />
      <CleaningCTA />
      <CleaningGuarantee />
      <CleaningProcess />
      <CleaningCTA />
      <CleaningServiceAreas />
      <CleaningFAQ />
      <CleaningCTA />
      <CleaningFooter />
    </div>
  );
};

export default CleaningServicesPage;
