'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { httpFile } from "@/config";
import DynamicFAIcon from '../../../extras/DynamicFAIcon';
import { useTheme } from '../contexts/ThemeContext';
import { getProjectId } from '../../../hooks/getProjectId';

interface ProcessStep {
  title?: string;
  description?: string;
  iconClass?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  [key: string]: unknown;
}

const ProcessSection = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [projectCategory, setProjectCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const projectId = getProjectId();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "ourProcess"
        });

        if (data.projectInfo) {
          setProcessSteps(data.projectInfo.ourProcessSection || []);
          setProjectCategory(data.projectInfo.serviceType || '');
        }
      } catch (error) {
        console.error("Error fetching ourProcessSection:", error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [projectId]);

  const coloredSteps = processSteps.map((step, i) => ({
    ...step,
    number: (i + 1).toString()
  }));

  if (isLoading) {
    return null; // Or your skeleton
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span 
              className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
              style={{ 
                color: colors.primaryButton.bg,
                backgroundColor: `${colors.primaryButton.bg}15`
              }}
            >
              Our Process
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            Our Simple <span style={{ color: colors.primaryButton.bg }}>Process</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
            Our streamlined {coloredSteps.length}-step process ensures you get professional {projectCategory} service from start to finish.
          </p>
        </div>

        {/* Process Flow */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full hidden lg:block"
            style={{
              background: `linear-gradient(to bottom, ${colors.primaryButton.bg}, ${colors.accent})`
            }}
          ></div>

          {/* Process Steps */}
          <div className="space-y-12 lg:space-y-16">
            {coloredSteps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col gap-8 lg:gap-12`}
              >
                {/* Content Card */}
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8'} text-center lg:text-inherit`}>
                  <div 
                    className="inline-block rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 max-w-md w-full"
                    style={{
                      backgroundColor: `${colors.primaryButton.bg}08`,
                      border: `2px solid ${colors.primaryButton.bg}20`
                    }}
                  >
                    {/* Icon */}
                    {step.iconClass && (
                      <div className="flex justify-center mb-4">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                          }}
                        >
                          <DynamicFAIcon 
                            iconClass={step.iconClass} 
                            className="text-2xl text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Step Number Circle */}
                <div className="relative z-10 hidden lg:block">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                    }}
                  >
                    {step.number}
                  </div>
                  
                  {/* Arrow */}
                  {index < coloredSteps.length - 1 && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
                      <ArrowRight 
                        className="w-6 h-6 rotate-90" 
                        style={{ color: colors.primaryButton.bg }}
                      />
                    </div>
                  )}
                </div>

                {/* Mobile Step Number */}
                <div className="lg:hidden">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                    }}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Empty space for alternating layout */}
                <div className="flex-1 hidden lg:block"></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProcessSection;
