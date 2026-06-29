'use client';

import React, { useEffect, useState } from "react";
import { Star, StarHalf, Quote } from "lucide-react";
import { httpFile } from "@/config";
import { generateReviewSchema } from "../../../hooks/schemaMarkup"; // use your existing utility
import { useTheme } from '../contexts/ThemeContext';
import { getProjectId } from '../../../hooks/getProjectId';

interface Testimonial {
  rating?: string | number;
  review?: string;
  review_text?: string;
  text?: string;
  author?: string;
  customer_name?: string;
  name?: string;
  [key: string]: unknown;
}

const TestimonialsSection = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const projectId = getProjectId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_faq_reviews", {
          projectId,
        });
        if (data) {
          // Normalize to always have an array
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      }
    };

    fetchData();
  }, [projectId]);

  const reviewSchema = generateReviewSchema(testimonials);

  return (
    <>
      {testimonials.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
        />
      )}
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
                Customer Reviews
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
              What Our <span style={{ color: colors.primaryButton.bg }}>Customers</span> Say
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
              Don't just take our word for it. Here's what our satisfied customers have to say about our services.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial: Testimonial, index: number) => {
              const rawRating = Number(testimonial.rating) || 0;
              const fullStars = Math.floor(rawRating);
              const hasHalf = rawRating - fullStars >= 0.5;
              const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

              return (
                <div 
                  key={index} 
                  className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl flex flex-col h-full"
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

                  {/* Quote Icon */}
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primaryButton.bg}, ${colors.accent})`
                      }}
                    >
                      <Quote className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Stars Rating */}
                  <div className="flex items-center justify-center mb-6">
                    {[...Array(fullStars)].map((_, i) => (
                      <Star key={`full-${index}-${i}`} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                    {hasHalf && (
                      <StarHalf key={`half-${index}`} className="w-5 h-5 text-yellow-400 fill-current" />
                    )}
                    {[...Array(emptyStars)].map((_, i) => (
                      <Star key={`empty-${index}-${i}`} className="w-5 h-5 text-gray-300 fill-current" />
                    ))}
                  </div>

                  {/* Review Text */}
                  <div className="relative flex-1">
                    <p className="text-gray-700 mb-6 leading-relaxed text-center italic">
                      "{String(testimonial.review_text || testimonial.text || '')}"
                    </p>
                  </div>

                  {/* Customer Name */}
                  <div className="text-center mt-auto">
                    <div 
                      className="inline-block px-4 py-2 rounded-full"
                      style={{
                        backgroundColor: `${colors.primaryButton.bg}10`
                      }}
                    >
                      <h4 className="font-bold text-gray-900">
                        {String(testimonial.customer_name || testimonial.name || '')}
                      </h4>
                    </div>
                  </div>

                  {/* Bottom Accent Line */}
                  <div 
                    className="h-1 rounded-full transition-all duration-500 group-hover:w-full mt-4"
                    style={{
                      width: '3rem',
                      background: `linear-gradient(90deg, ${colors.primaryButton.bg}, ${colors.accent})`
                    }}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl"
              style={{
                backgroundColor: `${colors.primaryButton.bg}08`,
                border: `1px solid ${colors.primaryButton.bg}20`
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-gray-900 font-bold text-sm sm:text-base lg:text-lg">5.0</span>
              </div>
              <div className="hidden sm:block w-px h-6 lg:h-8 bg-gray-300"></div>
              <div className="text-gray-600 text-sm sm:text-base">
                <span className="font-bold text-gray-900">{testimonials.length}+</span> Happy Customers
              </div>
              <div className="hidden sm:block w-px h-6 lg:h-8 bg-gray-300"></div>
              <div className="text-gray-600 text-sm sm:text-base">
                <span className="font-bold text-gray-900">100%</span> Satisfaction Rate
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TestimonialsSection;
