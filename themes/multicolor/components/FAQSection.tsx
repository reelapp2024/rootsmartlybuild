'use client';

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Phone, MessageSquare, HelpCircle } from "lucide-react";
import { httpFile } from "@/config";
import { getProjectId } from '../../../hooks/getProjectId';
import { generateFAQSchema } from "../../../hooks/schemaMarkup";
import { useTheme } from '../contexts/ThemeContext';

interface FAQItem {
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

const FAQSection = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  const projectId = getProjectId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_faq_reviews", {
          projectId,
        });
        if (data) {
          setFaqs(data.faq || []);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };
    fetchData();
  }, [projectId]);

  const faqSchema = generateFAQSchema(faqs);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <>
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
                FAQ
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
              Frequently Asked <span style={{ color: colors.primaryButton.bg }}>Questions</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
              Got questions? We've got answers. Here are the most common questions about our professional services.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="group bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
                  style={{
                    border: `1px solid ${colors.primaryButton.bg}15`
                  }}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-left flex items-center justify-between transition-all duration-300"
                    style={{
                      backgroundColor: openFAQ === index ? `${colors.primaryButton.bg}08` : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (openFAQ !== index) {
                        e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}05`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (openFAQ !== index) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: openFAQ === index ? colors.primaryButton.bg : `${colors.primaryButton.bg}15`
                        }}
                      >
                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 pr-4 leading-tight">
                        {faq.question}
                      </h3>
                    </div>
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: openFAQ === index ? colors.primaryButton.bg : `${colors.primaryButton.bg}15`,
                        transform: openFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      {openFAQ === index ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
                      )}
                    </div>
                  </button>
                  
                  {openFAQ === index && (
                    <div 
                      className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 transition-all duration-300"
                      style={{
                        borderTop: `1px solid ${colors.primaryButton.bg}20`
                      }}
                    >
                      <div className="pt-4">
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl"
              style={{
                backgroundColor: `${colors.primaryButton.bg}08`,
                border: `1px solid ${colors.primaryButton.bg}20`
              }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
                <span className="text-gray-900 font-semibold text-sm sm:text-base">Still have questions?</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primaryButton.bg }} />
                <span className="text-gray-600 text-sm sm:text-base">
                  <span className="font-bold text-gray-900">Call us</span> for immediate help
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQSection;
