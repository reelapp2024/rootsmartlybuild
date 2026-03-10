'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock} from 'lucide-react';
import { httpFile } from "@/config";
import DynamicFAIcon from '../../../../extras/DynamicFAIcon';
import { getProjectId } from '../../../../hooks/getProjectId';

interface ProcessStep {
  title?: string;
  description?: string;
  iconClass?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  number?: string | number;
  [key: string]: unknown;
}

interface ServicesProcessProps {
  formattedLocationName?: string;
}

// Define static color mapping for each step
const colorSets = [
  'bg-blue-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-pink-500'
];

const ServicesProcess = ({ formattedLocationName = "" }: ServicesProcessProps) => {
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [projectCategory, setProjectCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const projectId = getProjectId();

  // Fetch process steps dynamically from API
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

  // Loading state removed for better UX

  // Assign colors to each process step, cycling through the colors if there are more steps than colors
  const coloredSteps = processSteps.map((step: ProcessStep, index: number) => {
    const colorIndex = index % colorSets.length; // Cycle through colors if steps exceed available colors
    return {
      ...step,
      color: colorSets[colorIndex] // Assign color based on index
    };
  });

  return (



    <section className="py-20 bg-gradient-to-br from-background via-secondary/30 to-background transition-colors duration-300 relative overflow-hidden">
      {/* ...header and background stuff... */}
      <div className="container mx-auto px-16">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-6 py-3 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">  Our Simple Process </span>
          </div>
          {/* <h2 className="text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"> */}
          <h2 className="font-bold text-foreground mb-8">

            Our Simple Process
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our streamlined {coloredSteps.length}-step process ensures you get professional {projectCategory} service from start to finish.
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-primary via-accent to-primary h-full hidden lg:block"></div>
          <div className="space-y-16 lg:space-y-24">
            {coloredSteps.map((step, index) => (
              <div key={index} className={`flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col gap-8 lg:gap-16`}>
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8'} text-center lg:text-inherit`}>
                  <div className={`inline-block ${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 max-w-md w-full`}>
                    <div className="flex items-center justify-center mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                        <DynamicFAIcon iconClass={step.iconClass || ''} className="text-white text-3xl" />
                      </div>
                    </div>
                    <h3 className="font-bold text-foreground mb-4">{step.title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{step.description}</p>
                  </div>
                </div>
                <div className="relative z-10 hidden lg:block">
                  <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-background`}>
                    {index+1}
                  </div>
                  {index < coloredSteps.length - 1 && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
                      <ArrowRight className="w-6 h-6 text-primary rotate-90" />
                    </div>
                  )}
                </div>
                <div className="lg:hidden">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 hidden lg:block"></div>
              </div>
            ))}
          </div>
        </div>
        {/* ...call to action... */}


        {/* <div className="text-center mt-20">
                        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-8 border border-primary/20">
                          <h3 className="font-bold text-foreground mb-4">Ready to Get Started?</h3>
                          <p className="text-lg text-muted-foreground mb-6">
                            Experience our professional process firsthand. Contact us today for your free estimate!
                          </p>
                          <button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            Get Free Estimate
                          </button>
                        </div>
                      </div> */}






      </div>
    </section>
  );
};

export default ServicesProcess;
