'use client';

import React, { useState, useEffect } from 'react';
import { httpFile } from "@/config";
// If you use a dynamic FontAwesome icon loader (like <DynamicFAIcon />), import it:
import DynamicFAIcon from '../../../extras/DynamicFAIcon';
import { useTheme } from '../contexts/ThemeContext';
import { getProjectId } from '../../../hooks/getProjectId';

interface WhyChooseUsFeature {
  title?: string;
  description?: string;
  iconClass?: string;
  [key: string]: unknown;
}

const WhyChooseUsSection = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [projectName, setProjectName] = useState("");
  const [projectWhyChooseUs, setProjectWhyChooseUs] = useState<WhyChooseUsFeature[]>([]);

  const projectId = getProjectId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "Whychooseus"
        });

        if (data.projectInfo) {
          setProjectName(data.projectInfo.projectName || "Our Team");
          setProjectWhyChooseUs(data.projectInfo.whyChooseUsSection || []);
        }
      } catch (error) {
        console.error("Error fetching WhyChooseUs data:", error);
      }
    };

    fetchData();
  }, [projectId]);

  return (
    <section className="py-16 bg-gray-50">
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
              Why Choose Us
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            Why Choose <span style={{ color: colors.primaryButton.bg }}>{projectName}</span>?
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
            When you choose us, you're choosing quality, reliability, and exceptional service that's backed by years of experience and thousands of satisfied customers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectWhyChooseUs.map((feature: WhyChooseUsFeature, index: number) => (
            <div 
              key={index} 
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
              <div className="relative space-y-5">
                {/* Icon Container */}
                <div className="w-fit">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                    style={{
                      backgroundColor: `${colors.primaryButton.bg}15`,
                      border: `2px solid ${colors.primaryButton.bg}30`
                    }}
                  >
                    {feature.iconClass ? (
                      <DynamicFAIcon 
                        iconClass={feature.iconClass} 
                        className="text-2xl"
                        style={{ color: colors.primaryButton.bg }}
                      />
                    ) : null}
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold leading-tight text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-base leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Accent Line */}
                <div 
                  className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                  style={{
                    width: '3rem',
                    background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
