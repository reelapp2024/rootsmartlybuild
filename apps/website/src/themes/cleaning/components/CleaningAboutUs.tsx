import React, { useEffect, useState } from 'react';
import { httpFile } from '../../../config.js';
import CleaningLoader from '../components/CleaningLoader';
import DynamicIcon from '../../../extras/DynamicIcon.js';
import { getProjectId } from '../../../hooks/getProjectId';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';

interface Stat {
  serialno: number;
  iconName: string;
  value: string;
  label: string;
}

interface CleaningAboutUsProps {
  description?: string; // Optional prop from CleaningCountry
}

const sanitize = (raw: any): string =>
  typeof raw === 'string' ? raw.trim().replace(/^[,\s"]+|[,\s"]+$/g, '') : '';

const CleaningAboutUs: React.FC<CleaningAboutUsProps> = ({ description }) => {
  const [aboutImage, setAboutImage] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  useEffect(() => {
    const id = getProjectId();
    setProjectId(id);
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
    if (projectId) {
      (async () => {
        try {
          const { data } = await httpFile.post('/webapp/v1/my_site', {
            projectId,
            pageType: 'home',
            reqFrom: 'Aboutus',
          });

          const info = data.projectInfo || {};
          const about = data.aboutUs || {};

          setProjectCategory(info.serviceType || '');
          setProjectDescription(info.description || '');
          setAboutImage((info.images?.[0]?.url as string) || '');

          const fetchedStats: Stat[] = (info.statsSection || []).map((s: any) => ({
            serialno: s.serialno,
            iconName: sanitize(s.iconName),
            value: sanitize(s.value),
            label: sanitize(s.label),
          }));
          setStats(fetchedStats);
        } catch (err) {
          console.error('Error fetching About Us data:', err);
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false); // No loading if projectId is not available
    }
  }, [projectId]);

  // Use provided description or fallback to fetched projectDescription
  const finalDescription = description || projectDescription;
  // Split description into two parts
  const descriptionParts = finalDescription.split(/(?<=[.?!])\s+/);
  const firstPart = descriptionParts.slice(0, 2).join(' ');
  const secondPart = descriptionParts.slice(2).join(' ');

  if (isLoading) return <CleaningLoader />;

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
              About Us
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
            Professional {projectCategory || 'Cleaning'} Solutions You Can Trust
          </h2>
          
          <p 
            className="text-lg max-w-3xl mx-auto leading-relaxed"
            style={{ color: currentTheme.elements.surface }}
          >
            We provide top-notch cleaning services tailored to your needs with professional expertise and reliable results.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <p 
              className="text-lg mb-6 leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              {firstPart || 'We provide top-notch cleaning services tailored to your needs.'}
            </p>
            
            {secondPart && (
              <p 
                className="text-lg mb-8 leading-relaxed"
                style={{ color: currentTheme.elements.surface }}
              >
                {secondPart}
              </p>
            )}
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat) => (
                <div key={stat.serialno} className="text-center group">
                         <div
                           className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300"
                           style={{
                             backgroundColor: currentTheme.elements.accent,
                             boxShadow: `0 10px 30px ${currentTheme.elements.accent}40`
                           }}
                         >
                           <DynamicIcon iconName={stat.iconName} className="w-8 h-8 text-white" />
                         </div>
                         <div
                           className="text-xl font-bold mb-2"
                           style={{ color: currentTheme.elements.surface }}
                         >
                           {stat.value}
                         </div>
                         <div
                           className="text-sm"
                           style={{ color: currentTheme.elements.surface }}
                         >
                           {stat.label}
                         </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative order-1 lg:order-2">
            {aboutImage && (
              <div className="relative">
                <img
                  src={aboutImage}
                  alt="Professional cleaners at work"
                  className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
                />
                
                       {/* Floating Card */}
                       <div
                         className="absolute -bottom-6 -left-6 bg-white rounded-xl p-6 shadow-xl border-2"
                         style={{ borderColor: currentTheme.elements.ring }}
                       >
                         <div className="flex items-center space-x-3">
                           <div
                             className="w-12 h-12 rounded-xl flex items-center justify-center"
                             style={{ backgroundColor: currentTheme.elements.accent }}
                           >
                             <DynamicIcon iconName="Shield" className="w-6 h-6 text-white" />
                           </div>
                           <div>
                             <div
                               className="text-lg font-bold"
                               style={{ color: currentTheme.elements.surface }}
                             >
                               Bonded & Insured
                             </div>
                             <div
                               className="text-sm"
                               style={{ color: currentTheme.elements.surface }}
                             >
                               Your Property Protected
                             </div>
                           </div>
                         </div>
                       </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CleaningAboutUs;