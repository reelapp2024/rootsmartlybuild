import React, { useEffect, useState } from "react";
import { httpFile } from "../../../config.js";
import { Star, StarHalf, Quote } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { generateReviewSchema } from "../../../hooks/schemaMarkup"; // ✅ imported here
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

interface Testimonial {
  review_text: string;
  customer_image: string;
  customer_name: string;
  rating: number | string;
}

interface CleaningTestimonialsProps {
  reviews?: Testimonial[];
}

const CleaningTestimonials: React.FC<CleaningTestimonialsProps> = ({ reviews: propReviews }) => {
  const [projectReviews, setProjectReviews] = useState<Testimonial[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  const projectId = import.meta.env.VITE_PROJECT_ID;

  // Use provided reviews or fallback to fetched reviews
  const finalReviews = propReviews || projectReviews;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_faq_reviews", {
          projectId,
        });

        if (data) {
          setProjectReviews(data.testimonials || []);
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

  // ✅ Generate schema from imported utility
  const reviewSchema = generateReviewSchema(finalReviews);

  return (
    <>
      <Helmet>
        {/* Embed Reviews schema */}
        {finalReviews.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(reviewSchema)}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
                Testimonials
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
              What Our Customers Say
            </h2>
            
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: currentTheme.elements.surface }}
            >
              Don't just take our word for it. Here's what our satisfied customers have to say about our cleaning services.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {finalReviews.length > 0 ? (
              finalReviews.map((testimonial, index) => {
                const rawRating = Number(testimonial.rating) || 0;
                const fullStars = Math.floor(rawRating);
                const hasHalf = rawRating - fullStars >= 0.5;
                const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

                return (
                  <div
                    key={index}
                    className="group relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Testimonial Card */}
                    <div
                      className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 h-full border-2"
                      style={{
                        borderColor: currentTheme.elements.ring
                      }}
                    >
                      {/* Quote Icon */}
                      <div className="mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                          style={{
                            backgroundColor: currentTheme.elements.accent
                          }}
                        >
                          <Quote className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="mb-6 flex-grow">
                        <p 
                          className="leading-relaxed text-sm"
                          style={{ color: currentTheme.elements.surface }}
                        >
                          "{testimonial.review_text}"
                        </p>
                      </div>

                      {/* Customer Info & Rating */}
                      <div className="flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                            style={{
                              backgroundColor: currentTheme.elements.accent
                            }}
                          >
                            <span className="text-white text-sm font-bold">
                              {testimonial.customer_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 
                              className="font-bold text-sm"
                              style={{ color: currentTheme.elements.surface }}
                            >
                              {testimonial.customer_name}
                            </h4>
                            <p 
                              className="text-xs"
                              style={{ color: currentTheme.elements.surface }}
                            >
                              Verified Customer
                            </p>
                          </div>
                        </div>

                        {/* Rating Stars */}
                        <div className="flex space-x-1">
                          {[...Array(fullStars)].map((_, i) => (
                            <Star
                              key={`full-${index}-${i}`}
                              className="w-4 h-4 text-yellow-400 fill-current"
                            />
                          ))}
                          {hasHalf && (
                            <StarHalf
                              key={`half-${index}`}
                              className="w-4 h-4 text-yellow-400 fill-current"
                            />
                          )}
                          {[...Array(emptyStars)].map((_, i) => (
                            <Star
                              key={`empty-${index}-${i}`}
                              className="w-4 h-4 text-gray-300 fill-current"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: currentTheme.elements.accent }}
                >
                  <span className="text-white text-3xl">💬</span>
                </div>
                <p
                  className="text-xl"
                  style={{ color: currentTheme.elements.surface }}
                >
                  No testimonials available yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default CleaningTestimonials;
