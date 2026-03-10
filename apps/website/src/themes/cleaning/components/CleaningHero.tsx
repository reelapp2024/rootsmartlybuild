// src/themes/cleaning/components/CleaningHero.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpFile } from '../../../config.js';
import CleaningLoader from '../components/CleaningLoader';
import DynamicIcon from '../../../extras/DynamicIcon.js';
import { getProjectId } from '../../../hooks/getProjectId'; // Import the utility
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';

interface Feature {
  serialno: number;
  iconName: string;
  title: string;
  subtitle: string;
}

export default function CleaningHero() {
  const navigate = useNavigate();
  const [projectCategory, setProjectCategory] = useState('');
  const [welcomeLine, setWelcomeLine]       = useState('');
  const [projectSlogan, setProjectSlogan]       = useState('');
  const [phoneNumber, setPhoneNumber]       = useState('');
  const [features, setFeatures]             = useState<Feature[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [heroHeadingPart1, setHeroHeadingPart1] = useState('');
  const [heroHeadingPart2, setHeroHeadingPart2] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
const conjunctions = [
  'and', 'or', 'but', 'with', 'for', 'as', 'because', 'so', 'then', 'by', 'on', 'at', 
  'in', 'of', 'to', 'from', 'about', 'through', 'between', 'during', 'before', 'after'
];
  // projectId from query or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const site = urlParams.get('siteId');
  if (site && localStorage.getItem('currentSiteId') !== site) {
    localStorage.setItem('currentSiteId', site);
  }
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
  useEffect(() => {
    (async () => {
      try {
        const { data } = await httpFile.post('/webapp/v1/my_site', {
          projectId,
          pageType: 'home',
          reqFrom: 'Hero'
        });

        const info = data.projectInfo || {};
        const about = data.aboutUs || {};

        setProjectCategory(info.serviceType || '');
        setWelcomeLine(info.welcomeLine   || '');
        setPhoneNumber(about.phone       || '');
        // Split heroHeading intelligently
        const words = info.heroHeading?.split(' ') || [];

        // If heading has more than 3 words, attempt to split based on meaningful conjunctions
        if (words.length > 3) {
          let breakIndex = -1;
          // Find the first occurrence of any conjunction or preposition
          for (let i = 0; i < words.length; i++) {
            if (conjunctions.includes(words[i].toLowerCase())) {
              breakIndex = i;
              break;
            }
          }

          if (breakIndex !== -1) {
            // Split at the first meaningful conjunction
            setHeroHeadingPart1(words.slice(0, breakIndex + 1).join(' ') || '');
            setHeroHeadingPart2(words.slice(breakIndex + 1).join(' ') || '');
          } else {
            // Fallback to split the first part with a few words, and second part with the rest
            setHeroHeadingPart1(words.slice(0, words.length - 2).join(' ') || '');
            setHeroHeadingPart2(words.slice(-2).join(' ') || '');
          }
        } else {
          // For 2 or 3 words, use a simpler split
          if (words.length === 3) {
            setHeroHeadingPart1(words.slice(0, 1).join(' ') || '');
            setHeroHeadingPart2(words.slice(1).join(' ') || '');
          } else {
            setHeroHeadingPart1(words.slice(0, 1).join(' ') || '');
            setHeroHeadingPart2(words.slice(1).join(' ') || '');
          }
        }

setProjectSlogan(info.projectSlogan || `Professional ${info.serviceType}`);
        // sanitize helper
        const strip = (s: any) =>
          typeof s === 'string'
            ? s.trim().replace(/^[,\"\s]+|[,\"\s]+$/g, '')
            : '';

        // clean features
        setFeatures(
          (info.featuresSection || []).map((f: any) => ({
            serialno: f.serialno,
            iconName: strip(f.iconName),
            title:    strip(f.title),
            subtitle: strip(f.subtitle)
          }))
        );
      } catch (err) {
        console.error('Fetch hero data error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [projectId]);

  if (isLoading) return <CleaningLoader />;

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
      <section 
        className="relative py-16 text-white overflow-hidden min-h-[600px] flex items-center"
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
              backgroundColor: currentTheme.elements.accent,
              width: `${Math.random()*8+4}px`,
              height:`${Math.random()*8+4}px`,
              top:   `${Math.random()*100}%`,
              left:  `${Math.random()*100}%`,
              animationDelay:   `${Math.random()*3}s`,
              animationDuration:`${Math.random()*4+2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        {/* Badge */}
        <div 
          className="inline-flex items-center backdrop-blur-sm rounded-full px-6 py-3 mb-8 border"
          style={{
            backgroundColor: `${currentTheme.elements.primaryButton.bg}20`,
            borderColor: currentTheme.elements.ring
          }}
        >
          <DynamicIcon 
            iconName="Sparkles" 
            className="w-5 h-5 mr-2" 
            style={{ color: currentTheme.elements.accent }}
          />
          <span 
            className="font-semibold"
            style={{ color: currentTheme.elements.description }}
          >
             {projectSlogan}
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          <span 
            key={`gradient-1-${selectedTheme}`}
            className="bg-clip-text text-transparent"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.heading}, ${currentTheme.elements.accent}, ${currentTheme.elements.primaryButton.bg})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 3s ease infinite'
            }}
          >
             {heroHeadingPart1}
          </span><br/>
          <span 
            key={`gradient-2-${selectedTheme}`}
            className="bg-clip-text text-transparent"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.accent}, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.heading})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 3s ease infinite'
            }}
          >
            {heroHeadingPart2}
          </span>
        </h1>

        {/* Subheading */}
        <p 
          className="text-lg md:text-xl mb-8 leading-relaxed max-w-3xl mx-auto"
          style={{ color: currentTheme.elements.description }}
        >
          {welcomeLine}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          {/* Primary Button - Call Now */}
          <a
            href={`tel:${phoneNumber}`}
            className="group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-3 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
              color: currentTheme.elements.primaryButton.text,
              boxShadow: `0 15px 35px ${currentTheme.elements.shadow}, 0 5px 15px ${currentTheme.elements.primaryButton.bg}40`
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1.1) translateY(-2px)';
              (e.target as HTMLElement).style.boxShadow = `0 20px 40px ${currentTheme.elements.shadow}, 0 10px 20px ${currentTheme.elements.primaryButton.bg}60`;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1) translateY(0px)';
              (e.target as HTMLElement).style.boxShadow = `0 15px 35px ${currentTheme.elements.shadow}, 0 5px 15px ${currentTheme.elements.primaryButton.bg}40`;
            }}
          >
            {/* Shine Effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
            ></div>
            <DynamicIcon iconName="Phone" size={20} className="group-hover:animate-bounce relative z-10" />
            <span className="relative z-10">Call Now: {phoneNumber}</span>
          </a>

          {/* Secondary Button - Free Quote */}
          <button
            onClick={()=>navigate('/contact')}
            className="group relative px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all duration-300 hover:scale-105 border-2 backdrop-blur-md overflow-hidden"
            style={{
              backgroundColor: `${currentTheme.elements.secondaryButton.bg}`,
              color: currentTheme.elements.secondaryButton.text,
              borderColor: currentTheme.elements.secondaryButton.border,
              boxShadow: `0 15px 35px ${currentTheme.elements.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = currentTheme.elements.secondaryButton.hover;
              (e.target as HTMLElement).style.transform = 'scale(1.1) translateY(-2px)';
              (e.target as HTMLElement).style.boxShadow = `0 20px 40px ${currentTheme.elements.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = currentTheme.elements.secondaryButton.bg;
              (e.target as HTMLElement).style.transform = 'scale(1) translateY(0px)';
              (e.target as HTMLElement).style.boxShadow = `0 15px 35px ${currentTheme.elements.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`;
            }}
          >
            {/* Glow Effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
            ></div>
            <DynamicIcon iconName="Sparkles" size={20} className="group-hover:rotate-12 transition-transform relative z-10" />
            <span className="relative z-10">Free Quote</span>
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {features.map(f => (
            <div 
              key={f.serialno} 
              className="backdrop-blur-sm rounded-xl p-4 border text-center"
              style={{
                backgroundColor: `${currentTheme.elements.surface}40`,
                borderColor: currentTheme.elements.ring
              }}
            >
              <DynamicIcon
                iconName={f.iconName}
                className="w-6 h-6 mx-auto mb-3"
                style={{ color: currentTheme.elements.accent }}
              />
              <h3 
                className="text-base font-bold mb-2"
                style={{ color: currentTheme.elements.heading }}
              >
                {f.title}
              </h3>
              <p 
                className="text-xs"
                style={{ color: currentTheme.elements.description }}
              >
                {f.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}