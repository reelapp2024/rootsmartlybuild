import React, { useEffect, useState } from "react";
import { httpFile } from "../../../config.js";
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Helmet } from "react-helmet-async"; // ✅ import Helmet
import { generateFAQSchema } from "../../../hooks/schemaMarkup"; // ✅ import generateFAQSchema
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

interface CleaningFAQProps {
  faqs?: any[];
}

const CleaningFAQ: React.FC<CleaningFAQProps> = ({ faqs: propFaqs }) => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [projectFaqs, setprojectFaqs] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  const projectId = import.meta.env.VITE_PROJECT_ID;

  // Use provided faqs or fallback to fetched faqs
  const finalFaqs = propFaqs || projectFaqs;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_faq_reviews", {
          projectId,
        });

        if (data) {
          setprojectFaqs(data.faq || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      setCurrentTheme(getThemeByName(savedTheme));
    }
  }, []);

  // Listen for theme changes from header
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setSelectedTheme(newTheme);
      setCurrentTheme(getThemeByName(newTheme));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // ✅ Generate schema
  const faqSchema = generateFAQSchema(finalFaqs);

  return (
    <>
      <Helmet>
        {/* Embed FAQ schema */}
        {finalFaqs.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>

      <section 
        className="py-16 font-poppins relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.elements.surface}05, ${currentTheme.elements.gradient.to}05)`
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: Math.random() * 6 + 3 + 'px',
                height: Math.random() * 6 + 3 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                backgroundColor: currentTheme.elements.accent,
                animationDelay: Math.random() * 3 + 's',
                animationDuration: Math.random() * 3 + 2 + 's'
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-6">
              <div 
                className="w-12 h-1 rounded-full mr-3"
                style={{ backgroundColor: currentTheme.elements.accent }}
              ></div>
              <span 
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: currentTheme.elements.accent }}
              >
                FAQ
              </span>
              <div 
                className="w-12 h-1 rounded-full ml-3"
                style={{ backgroundColor: currentTheme.elements.accent }}
              ></div>
            </div>
            
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
              style={{ color: currentTheme.elements.surface }}
            >
              Frequently Asked Questions
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              Got questions? We've got answers. Here are the most common questions about our cleaning services.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {finalFaqs.length > 0 ? (
              finalFaqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="group relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 overflow-hidden"
                    style={{
                      borderColor: currentTheme.elements.ring
                    }}
                  >
                    <button
                      className="w-full px-6 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                          style={{
                            backgroundColor: currentTheme.elements.accent
                          }}
                        >
                          <HelpCircle className="w-5 h-5 text-white" />
                        </div>
                        <h3 
                          className="text-lg font-bold pr-4"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          {faq.question}
                        </h3>
                      </div>
                      {openFAQ === index ? (
                        <ChevronUp 
                          className="w-6 h-6 flex-shrink-0"
                          style={{ color: currentTheme.elements.accent }}
                        />
                      ) : (
                        <ChevronDown 
                          className="w-6 h-6 flex-shrink-0"
                          style={{ color: currentTheme.elements.surface }}
                        />
                      )}
                    </button>
                    {openFAQ === index && (
                      <div className="px-6 pb-6">
                        <div 
                          className="w-full h-px mb-4"
                          style={{ backgroundColor: currentTheme.elements.ring }}
                        ></div>
                        <p 
                          className="leading-relaxed"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                >
                  <span className="text-white text-3xl">❓</span>
                </div>
                <p
                  className="text-xl"
                  style={{ color: currentTheme.elements.surface }}
                >
                  No FAQs available yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default CleaningFAQ;
