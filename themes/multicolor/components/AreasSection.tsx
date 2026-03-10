'use client';

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { httpFile } from "@/config";
import { MapPin, Clock, Shield, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from '../contexts/ThemeContext';
import { getProjectId } from '../../../hooks/getProjectId';

interface AreaLocation {
  slug?: string;
  name?: string;
  sortname?: string;
  _id?: string;
  location_id?: string;
  [key: string]: unknown;
}

const AreasSection = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [locations, setLocations] = useState<AreaLocation[]>([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [UpcomingPage, setUpcomingPage] = useState("");
  const router = useRouter();

  const projectId = getProjectId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "servicesAreas",
        });

        if (data.projectInfo && data.projectInfo.serviceType) {
          setProjectCategory(data.projectInfo.serviceType);
          setUpcomingPage(data.upcomingPage);
          setLocations(data.locations || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);

  const getNextPage = () => {
    if (UpcomingPage === "country") return "States";
    if (UpcomingPage === "state") return "Cities";
    if (UpcomingPage === "city") return "Local Areas";
    if (UpcomingPage === "local") return "whole areas";
    return "";
  };

  const handleLocationClick = (area: AreaLocation) => {
    return `/${area.slug || ''}`;
  };

  // Handler for "See Areas" button: Navigate with scroll state
  const handleSeeAreasClick = (area: AreaLocation, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default link behavior if needed
    // Store state in localStorage for the target page to access
    const state = {
      nextPage: getNextPage(),
      locationName: area.name,
      sortname: area.sortname,
      _id: area._id,
      scrollToAreas: true, // Flag to trigger scroll on target page
    };
    localStorage.setItem('areaNavigationState', JSON.stringify(state));
    router.push(handleLocationClick(area));
  };

  // Common state for outer Link (no scroll flag)
  const commonState = (area: AreaLocation) => ({
    id: area.location_id,
    projectId,
    UpcomingPage,
    nextPage: getNextPage(),
    locationName: area.name,
    sortname: area.sortname,
    _id: area._id,
  });

  return (
    <section id="areas" className="py-16 bg-white">
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
              Service Areas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            Areas We <span style={{ color: colors.primaryButton.bg }}>Serve</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
            Professional {projectCategory} throughout our availability.
          </p>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {locations.map((area, index) => (
            <Link
              key={index}
              href={handleLocationClick(area)}
              className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl"
              style={{
                border: `1px solid ${colors.primaryButton.bg}15`
              }}
            >
              {/* Hover Border Effect */}
              <div 
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  border: `2px solid ${colors.primaryButton.bg}40`,
                  boxShadow: `0 0 20px ${colors.primaryButton.bg}20`
                }}
              ></div>

              {/* Content */}
              <div className="relative text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                    }}
                  >
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Area Name */}
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                  {area.name}
                </h3>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${colors.primaryButton.bg}15`
                      }}
                    >
                      <Clock className="w-4 h-4" style={{ color: colors.primaryButton.bg }} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">Response time: Extreme</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${colors.primaryButton.bg}15`
                      }}
                    >
                      <Shield className="w-4 h-4" style={{ color: colors.primaryButton.bg }} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">100% Original services</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={(e) => handleSeeAreasClick(area, e)}
                  className="w-full px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 inline-flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: colors.primaryButton.bg,
                    color: colors.primaryButton.text
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
                >
                  <Phone className="w-4 h-4" />
                  See Areas
                </button>

                {/* Bottom Accent Line */}
                <div 
                  className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                  style={{
                    width: '3rem',
                    background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                  }}
                ></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl"
            style={{
              backgroundColor: `${colors.primaryButton.bg}08`,
              border: `1px solid ${colors.primaryButton.bg}20`
            }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
              <span className="text-gray-900 font-semibold text-sm sm:text-base">Serving {locations.length}+ Areas</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div className="text-gray-600 text-sm sm:text-base">
              <span className="font-bold text-gray-900">24/7</span> Emergency Service
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div className="text-gray-600 text-sm sm:text-base">
              <span className="font-bold text-gray-900">100%</span> Coverage
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AreasSection;