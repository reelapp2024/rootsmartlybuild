'use client';

import React from 'react';
import { Award, CheckCircle, Heart, Shield, Star, Zap } from 'lucide-react';
import { useGuaranteeData } from '../../../hooks/useGuaranteeData.js';
import DynamicFAIcon from '../../../extras/DynamicFAIcon';
import { useTheme } from '../contexts/ThemeContext';

interface GuaranteeItem {
  title?: string;
  description?: string;
  iconClass?: string;
  color?: string;
  bgColor?: string;
  [key: string]: unknown;
}

const staticHighlights = [
  { icon: Shield, text: 'Licensed & Insured Professionals' },
  { icon: Star, text: '10,000+ Satisfied Customers' },
  { icon: Heart, text: '24/7 Emergency Support' },
  { icon: Zap, text: 'Fast Response Times' }
];

const staticPromisePoints = [
  'Quick Response',
  'Efficient Solutions',
  'Stress-Free Experience',
  'Complete Satisfaction'
];

const GuaranteeSection = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const {
    guarantees = [],
    guaranteeText = '',
    promiseLine = '',
    projectCategory = '',
    isLoading
  } = useGuaranteeData();

  // Keep all guarantee data intact
  const coloredGuarantees = (guarantees || []) as GuaranteeItem[];

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-12">
            <div className="animate-pulse bg-gray-200 h-12 w-64 mx-auto mb-6 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-96 mx-auto rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-64"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
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
              Our Guarantee
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            Our <span style={{ color: colors.primaryButton.bg }}>{projectCategory}</span> Guarantee
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed mt-6">
            {guaranteeText}
          </p>
        </div>

        {/* Guarantee Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {coloredGuarantees.map((guarantee, index) => (
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
                {/* Icon */}
                <div className="flex justify-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                    }}
                  >
                    {guarantee.iconClass
                      ? <DynamicFAIcon iconClass={guarantee.iconClass} className="text-white text-2xl" />
                      : <Award className="w-8 h-8 text-white" />
                    }
                  </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-3">
                  <h4 className="text-xl font-bold leading-tight text-gray-900">
                    {guarantee.title}
                  </h4>
                  <p className="text-base leading-relaxed text-gray-600">
                    {guarantee.description}
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

        {/* Highlights Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {staticHighlights.map((highlight, index) => (
            <div 
              key={index} 
              className="flex items-center gap-4 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: `${colors.primaryButton.bg}08`,
                border: `1px solid ${colors.primaryButton.bg}20`
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                }}
              >
                <highlight.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-900 font-semibold">{highlight.text}</span>
            </div>
          ))}
        </div>

        {/* Promise Section */}
        <div 
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            backgroundColor: `${colors.primaryButton.bg}08`,
            border: `2px solid ${colors.primaryButton.bg}20`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div 
              className="absolute top-8 left-8 w-20 h-20 border-2 rounded-full"
              style={{ borderColor: colors.primaryButton.bg }}
            ></div>
            <div 
              className="absolute bottom-8 right-8 w-16 h-16 border-2 rounded-lg rotate-45"
              style={{ borderColor: colors.accent }}
            ></div>
            <div 
              className="absolute top-1/2 left-1/4 w-12 h-12 border rounded-full"
              style={{ borderColor: colors.primaryButton.bg }}
            ></div>
          </div>
          
          <div className="relative">
            <div className="mb-8">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                }}
              >
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 
                className="text-xl sm:text-2xl font-bold mb-6"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Our Promise to You
              </h3>
            </div>
            <div className="max-w-4xl mx-auto">
              <p className="text-base sm:text-lg text-gray-900 font-semibold leading-relaxed mb-8">
                {promiseLine || `"We promise to fix your plumbing problems quickly and efficiently, so you can get back to enjoying your home without any stress or hassle!"`}
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-gray-600">
                {staticPromisePoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
