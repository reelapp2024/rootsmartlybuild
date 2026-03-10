import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, useParams } from "react-router-dom";

import { httpFile } from "../../../config.js";
import CleaningHeader from '../components/CleaningHeader';
import CleaningCTA from '../components/CleaningCTA';
import CleaningMissionVision from '../components/CleaningMissionVision';
import CleaningValues from '../components/CleaningValues';
import CleaningUSP from '../components/CleaningUSP';
import CleaningFooter from '../components/CleaningFooter';
import CleaningLoader from '../components/CleaningLoader';
import { Sparkles } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';


const CleaningAbout = () => {
    const location = useLocation();
  
  const [aboutHeroText, setAboutHeroText] = useState('');
  const [projectCategory, setProjectCategory] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
  const [isLoading, setIsLoading] = useState(true);

  const projectId = import.meta.env.VITE_PROJECT_ID;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]); // runs every time URL path changes

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
        // Fetch hero text from my_site API
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
        });

        if (data.projectInfo && data.projectInfo.aboutHeroText) {
          setAboutHeroText(data.projectInfo.aboutHeroText);
          setProjectCategory(data.projectInfo.serviceType);
          setHeroImage(data.projectInfo.images[0].url);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);

  if (isLoading) return <CleaningLoader />;

  return (
    <div className="min-h-screen font-poppins">
      <CleaningHeader />

      {/* About Hero */}
      <section 
        className="relative py-20 text-white overflow-hidden min-h-[500px] flex items-center"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.elements.surface}, ${currentTheme.elements.gradient.to})`
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
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
                About Our {projectCategory} Services
              </h1>
            </div>
            <p 
              className="text-xl max-w-3xl mx-auto"
              style={{ color: currentTheme.elements.description }}
            >
              {aboutHeroText || 'Learn more about our professional cleaning services and commitment to excellence.'}
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
                  <BreadcrumbPage className="font-medium" style={{ color: currentTheme.elements.accent }}>About Us</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </section>

      <CleaningMissionVision />
      <CleaningValues />
      <CleaningUSP />
      <CleaningCTA />
      <CleaningFooter />
    </div>
  );
};

export default CleaningAbout;
