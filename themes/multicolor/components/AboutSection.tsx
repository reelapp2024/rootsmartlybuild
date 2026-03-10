'use client';

import Image from 'next/image';
import DynamicIcon from '../../../extras/DynamicIcon';
// src/themes/multicolor/components/CleaningAboutUs.tsx
import React, { useEffect, useState } from 'react';
import { httpFile } from '@/config';
import { getProjectId } from '../../../hooks/getProjectId';
import { useTheme } from '../contexts/ThemeContext';

const AboutSection = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();

interface StatItem {
  serialno?: number | string;
  iconName?: string;
  value?: string;
  label?: string;
}

const sanitize = (raw: any): string =>
  typeof raw === 'string'
    ? raw.trim().replace(/^[,\s"]+|[,\s"]+$/g, '')
    : '';

   const [aboutImage, setAboutImage] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read projectId from query or localStorage
  const projectId = getProjectId();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const site = urlParams.get('siteId');
      if (site && localStorage.getItem('currentSiteId') !== site) {
        localStorage.setItem('currentSiteId', site);
      }
    }
  }, []);

  useEffect(() => {
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

        const fetchedStats= (info.statsSection || []).map((s: any) => ({
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
  }, [projectId]);

  // Split projectDescription into two parts
  const descriptionParts = projectDescription.split(/(?<=[.?!])\s+/); // splits by sentence endings
  const firstPart = descriptionParts.slice(0, 2).join(' ');
  const secondPart = descriptionParts.slice(2).join(' ');


  // const stats = [
  //   { number: '120+', label: 'Projects Completed' },
  //   { number: '10K+', label: 'Customer Satisfaction' },
  //   { number: '500+', label: 'Hours Worked' },
  //   { number: '$1M+', label: 'Revenue Generated' }
  // ];

  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        
        {/* Section Title */}
        <div className="text-center mb-12">
          {isLoading ? (
            /* Skeleton Loading */
            <>
              <div className="inline-block mb-4">
                <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
              </div>
              <div className="space-y-2 max-w-3xl mx-auto">
                <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            </>
          ) : (
            <>
              <div className="inline-block mb-4">
                <span 
                  className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{ 
                    color: colors.primaryButton.bg,
                    backgroundColor: `${colors.primaryButton.bg}15`
                  }}
                >
                  About Us
                </span>
              </div>
              <h2 className="font-bold text-gray-900 max-w-3xl mx-auto">
                Professional <span style={{ color: colors.primaryButton.bg }}>{projectCategory}</span> You Can Trust
              </h2>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Image - 5 columns */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Main Image */}
              <div className="relative rounded-3xl overflow-hidden h-[500px]">
                {isLoading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse rounded-3xl"></div>
                ) : aboutImage ? (
                  <Image 
                    src={aboutImage}
                    alt="Professional service"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                    quality={85}
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className="w-full h-[500px] flex items-center justify-center"
                    style={{ backgroundColor: `${colors.primaryButton.bg}10` }}
                  >
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: `${colors.primaryButton.bg}20` }}
                      >
                        <DynamicIcon
                          iconName="Image"
                          className="w-8 h-8"
                          style={{ color: colors.primaryButton.bg }}
                        />
                      </div>
                      {/* Image loading state removed */}
                    </div>
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {/* Badge at Bottom */}
                <div className="absolute bottom-8 left-8 right-8">
                  <div 
                    className="backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-3"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: `2px solid ${colors.primaryButton.bg}30`
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: colors.primaryButton.bg }}
                    ></div>
                    <span className="font-bold text-gray-900">Licensed Professional</span>
                  </div>
                </div>
              </div>

              {/* Decorative Element */}
              <div 
                className="absolute -bottom-6 -right-6 w-32 h-32 rounded-3xl -z-10"
                style={{ backgroundColor: `${colors.primaryButton.bg}20` }}
              ></div>
            </div>
          </div>

          {/* Right: Content - 7 columns */}
          <div className="lg:col-span-7 space-y-10">
            
            {isLoading ? (
              /* Skeleton Loading for Content */
              <>
                {/* Description Skeleton */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Stats Skeleton */}
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Description */}
                <div className="space-y-6">
                  <p className="text-gray-700 leading-relaxed">
                    {firstPart}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {secondPart}
                  </p>
                </div>

                {/* Stats Section */}
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                      <div 
                        key={index}
                        className="group"
                      >
                        <div className="flex flex-col items-center text-center space-y-4">
                          {/* Icon Circle */}
                      {stat.iconName && (
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: `${colors.primaryButton.bg}15`,
                            border: `2px solid ${colors.primaryButton.bg}30`
                          }}
                        >
                          <DynamicIcon
                            iconName={stat.iconName}
                            className="w-8 h-8"
                            style={{ color: colors.primaryButton.bg }}
                          />
                        </div>
                      )}
                      
                      {/* Value */}
                      <div>
                        <div 
                          className="text-xl md:text-2xl font-black mb-1"
                          style={{ color: colors.primaryButton.bg }}
                        >
                          {stat.value}
                        </div>
                        
                        {/* Label */}
                        <div className="text-xs font-semibold text-gray-600 capitalize tracking-wide">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
