import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { httpFile } from "../../../config";
import CleaningHeader from '../components/CleaningHeader';
import CleaningCTA from '../components/CleaningCTA';
import CleaningServices from '../components/CleaningServices';
import CleaningWhyChooseUs from '../components/CleaningWhyChooseUs';
import CleaningGuarantee from '../components/CleaningGuarantee';
import CleaningProcess from '../components/CleaningProcess';
import CleaningServiceAreas from '../components/CleaningServiceAreas';
import CleaningFAQ from '../components/CleaningFAQ';
import CleaningFooter from '../components/CleaningFooter';
import { MapPin } from 'lucide-react';
import humanizeString from "../../../extras/stringUtils.js";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';
import { Sparkles } from 'lucide-react';

const CleaningAreaDetail = () => {
  const { areaName } = useParams();
  const location = useLocation();
  const [projectCategory, setProjectCategory] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
  
  const projectId = import.meta.env.VITE_PROJECT_ID;
  const displayAreaName = humanizeString(areaName) || 'Your Area';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
        });

        if (data.projectInfo) {
          setProjectCategory(data.projectInfo.serviceType);
          setProjectName(data.projectInfo.projectName);
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

  return (
    <div className="min-h-screen font-poppins">
      <CleaningHeader />
      
      {/* Area Hero */}
      <section 
        className="relative py-20 text-white overflow-hidden min-h-[500px] flex items-center"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
        }}
      >
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
                Professional {projectCategory} Services in {displayAreaName}
              </h1>
            </div>
            <p 
              className="text-xl max-w-3xl mx-auto"
              style={{ color: currentTheme.elements.description }}
            >
              Trusted {projectCategory} services in {displayAreaName}. {projectName} provides reliable, 
              professional cleaning solutions for homes and businesses in your local area.
            </p>
          </div>

          {/* Breadcrumb at bottom */}
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
                  <BreadcrumbLink asChild>
                    <Link to="/areas" style={{ color: currentTheme.elements.description }}>Areas We Serve</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium" style={{ color: currentTheme.elements.accent }}>{displayAreaName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </section>

      <CleaningServices />
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

export default CleaningAreaDetail;
