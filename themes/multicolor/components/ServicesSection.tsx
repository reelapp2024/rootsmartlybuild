'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { httpFile } from '@/config';
import { getProjectId } from '../../../hooks/getProjectId';
import { useTheme } from '../contexts/ThemeContext';

interface ServicesSectionProps {
  formattedLocationName?: string;
}

interface ProjectService {
  _id?: string;
  service_name?: string;
  service_description?: string;
  images?: Array<{ url?: string }>;
  [key: string]: unknown;
}

const ServicesSection = ({ formattedLocationName = "" }: ServicesSectionProps) => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [projectServices, setProjectServices] = useState<ProjectService[]>([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const id = getProjectId();
    setProjectId(id || null);
  }, []);

  const getTruncatedDescription = (text: string | undefined): string => {
    if (!text) return '';
    const idx = text.indexOf('.');
    return idx !== -1 ? text.substring(0, idx + 1) : text;
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_services", { projectId });
        if (data) {
          setProjectServices(data.services || []);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    const fetchCategory = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "servicesSection"
        });
        if (data.projectInfo && data.projectInfo.serviceType) {
          setProjectCategory(data.projectInfo.serviceType);
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      }
    };

    if (projectId) {
      fetchServices();
      fetchCategory();
    }
  }, [projectId]);

  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span 
              className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
              style={{ 
                color: colors.primaryButton.bg,
                backgroundColor: `${colors.primaryButton.bg}15`
              }}
            >
              Our Services
            </span>
          </div>
          <h2 className="font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            Professional <span style={{ color: colors.primaryButton.bg }}>{projectCategory}</span> Services {formattedLocationName}
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
            Comprehensive {projectCategory} solutions delivered by experienced professionals. We ensure quality results for every project.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projectServices.map((service, index) => {
            const serviceUrl = service.service_name 
              ? `/services/${service.service_name.toLowerCase().replace(/\s+/g, '-')}` 
              : '#';
            
            return (
            <Link
              key={index}
              href={serviceUrl}
              className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              style={{
                border: `1px solid ${colors.primaryButton.bg}15`
              }}
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={service.images?.[0]?.url && service.images[0].url.trim() ? service.images[0].url : "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"}
                  alt={service.service_name || 'Service'}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={85}
                  loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {/* Icon */}
                <div 
                  className="absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: `2px solid ${colors.primaryButton.bg}30`
                  }}
                >
                  <i 
                    className={`${service.fas_fa_icon} text-xl`}
                    style={{ color: colors.primaryButton.bg }}
                  ></i>
                </div>

                {/* Hover Border Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    border: `2px solid ${colors.primaryButton.bg}40`,
                    boxShadow: `0 0 20px ${colors.primaryButton.bg}20`
                  }}
                ></div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                <h4 
                  className="font-bold leading-tight group-hover:transition-colors duration-300"
                  style={{ 
                    color: 'inherit',
                    '--hover-color': colors.primaryButton.bg
                  } as React.CSSProperties}
                >
                  {service.service_name} {formattedLocationName}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {getTruncatedDescription(service.service_description)}
                </p>

                {/* Bottom Accent Line */}
                <div 
                  className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                  style={{
                    width: '2rem',
                    background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                  }}
                >                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
