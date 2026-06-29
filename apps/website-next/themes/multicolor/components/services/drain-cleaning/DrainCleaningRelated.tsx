'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { httpFile } from "@/config";
import { getProjectId } from '../../../../../hooks/getProjectId';
import humanizeString from "../../../../../extras/stringUtils.js";
import { useTheme } from '../../../contexts/ThemeContext';
import { ArrowRight } from 'lucide-react';

interface ServicesSectionProps {
  serviceId?: string;
  cta3?: any;
  phoneNumber?: string;
  locationUrl?: string;
}

interface ProjectService {
  _id?: string;
  service_name?: string;
  service_description?: string;
  images?: Array<{ url?: string }>;
  [key: string]: unknown;
}

const ServicesSection = ({ serviceId, cta3, phoneNumber, locationUrl }: ServicesSectionProps) => {
  const [projectServices, setProjectServices] = useState<ProjectService[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const { getThemeColors } = useTheme();
  
  // Fallback colors in case theme context is not loaded
  const fallbackColors = {
    primaryButton: { bg: '#e11d48', text: '#ffffff', hover: '#be123c' },
    secondaryButton: { bg: 'transparent', text: '#ffffff', border: '#e11d48', hover: 'rgba(225,29,72,0.1)' },
    accent: '#f59e0b',
    surface: '#f8fafc',
    gradient: { from: '#e11d48', to: '#f59e0b' },
    heading: '#1f2937',
    description: '#6b7280'
  };
  
  const safeColors = getThemeColors() || fallbackColors;

  useEffect(() => {
    const id = getProjectId();
    setProjectId(id || null);
  }, []);

  const getTruncatedDescription = (text: string | undefined): string => {
    if (!text) return '';
    const idx = text.indexOf('.');
    return idx !== -1 ? text.substring(0, idx + 1) : text;
  };

  // Ensure locationUrl is defined
  const safeLocationUrl = locationUrl || '';
  let locationName = '';
  if (safeLocationUrl) {
    const parts = safeLocationUrl.split("/services/");
    if (parts.length > 0) {
      locationName = parts[0].split("/").pop() || '';
    }
  }
  if (locationName && locationName.trim() !== "") {
    locationName = `in ${humanizeString(locationName)}`;
  } else {
    locationName = "";
  }

  const handleServiceClick = (service: ProjectService) => {
    const serviceName = (service.service_name || '').toLowerCase().replace(/\s+/g, '-');
    // Build the path - if locationUrl is provided, use it, otherwise use just /services
    const basePath = safeLocationUrl ? safeLocationUrl.split("/services/")[0] : '';
    const servicePath = basePath ? `${basePath}/services/${serviceName}` : `/services/${serviceName}`;
    
    return {
      href: servicePath,
      serviceData: {
        serviceId: service._id,
        serviceName: service.service_name || '',
        serviceDescription: service.service_description || '',
        serviceImage: service.images?.[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
        serviceImage1: service.images?.[1]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
        serviceImage2: service.images?.[2]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
      },
    };
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_random_services", { projectId });
        if (data) {
          setProjectServices(
            (data.services || []).filter((service: ProjectService) => service._id !== serviceId)
          );
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    if (projectId) {
      fetchServices();
    }
  }, [projectId, serviceId]);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-4" style={{ backgroundColor: `${safeColors.primaryButton.bg}15`, color: safeColors.primaryButton.bg }}>
            Related Services
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Explore Our Other Services
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Discover our complete range of professional services designed to meet all your needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projectServices.map((service, index) => {
            const serviceClickData = handleServiceClick(service);
            return (
            <Link
              key={index}
              href={serviceClickData.href || '#'}
              onClick={(e) => {
                // Store service data in localStorage for Next.js (since it doesn't support route state)
                if (typeof window !== 'undefined' && serviceClickData.href) {
                  localStorage.setItem('serviceNavigationState', JSON.stringify(serviceClickData.serviceData));
                }
              }}
              className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              style={{
                border: `1px solid ${safeColors.primaryButton.bg}15`
              }}
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.images?.[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"}
                  alt={service.service_name || 'Service'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {/* Service Icon */}
                <div 
                  className="absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: `${safeColors.primaryButton.bg}90`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <i className={`${service.fas_fa_icon} text-white text-lg`}></i>
                </div>

                {/* Arrow Icon */}
                <div 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{
                    backgroundColor: `${safeColors.primaryButton.bg}90`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                <h4 className="font-bold text-lg leading-tight text-gray-900 group-hover:transition-colors duration-300">
                  {service.service_name || 'Service'} {locationName}
                </h4>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {getTruncatedDescription(service.service_description)}
                </p>
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