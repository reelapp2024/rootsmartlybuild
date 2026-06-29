'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, MessageSquare } from 'lucide-react';

const DrainCleaningFAQ = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How often should I have my drains cleaned?',
      answer: 'For preventive maintenance, we recommend having your drains professionally cleaned every 1-2 years. However, if you notice slow drainage, gurgling sounds, or frequent clogs, you may need more frequent cleaning.'
    },
    {
      question: 'What causes drain clogs?',
      answer: 'Common causes include hair, soap scum, food particles, grease buildup, tree roots (for outdoor drains), and foreign objects. Regular maintenance can prevent most clogs from forming.'
    },
    {
      question: 'Do you offer emergency drain cleaning services?',
      answer: 'Yes, we provide 24/7 emergency drain cleaning services. If you have a severe blockage or backup, call us immediately and we\'ll dispatch a technician to resolve the issue quickly.'
    },
    {
      question: 'What methods do you use for drain cleaning?',
      answer: 'We use various methods including hydro jetting, drain snaking, video inspection, and eco-friendly cleaning solutions depending on the type and severity of the blockage.'
    },
    {
      question: 'How long does drain cleaning take?',
      answer: 'Most drain cleaning services take 1-3 hours depending on the complexity of the blockage and the method used. Simple clogs can often be cleared in under an hour.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-secondary to-background transition-colors duration-300">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Got questions? We've got answers. Here are the most common questions about our Drain Cleaning services.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-card-foreground pr-4">{faq.question}</h3>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-8 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Enhanced CTA Section */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary via-primary/95 to-primary rounded-3xl p-8 text-primary-foreground relative overflow-hidden">
              {/* Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 animate-gradient-shift bg-[length:200%_200%]"></div>
              
              <div className="relative text-center">
                <h3 className="text-3xl font-bold mb-4">Still Have Questions?</h3>
                <p className="text-primary-foreground/90 mb-8 text-lg max-w-2xl mx-auto">
                  Our friendly customer service team is ready to help with any additional questions you might have. 
                  Get immediate assistance or schedule your service today.
                </p>
                
                <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
                  {/* Theme-Responsive Call Button */}
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 animate-border-dance bg-[length:300%_300%]"></div>
                    <div className="absolute -inset-2 glass-card rounded-2xl animate-pulse-glow"></div>
                    
                    <button className="relative overflow-hidden btn-cta-primary text-white px-10 py-6 text-xl font-bold shadow-2xl rounded-2xl btn-cta-border btn-cta-glow group animate-gradient-shift bg-[length:200%_200%]">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-shift bg-[length:200%_200%]"></div>
                      
                      <div className="relative flex items-center">
                        <div className="relative mr-4">
                          <Phone className="w-6 h-6 animate-float-bounce" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">CALL NOW</span>
                          <span className="text-xl font-black tracking-wide">14676823822</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Secondary Button */}
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-white/30 to-primary-foreground/30 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition duration-500"></div>
                    
                    <button className="relative bg-white/95 backdrop-blur-sm text-primary border-2 border-white/30 px-10 py-6 text-xl font-bold shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 group hover:bg-white hover:text-primary">
                      <div className="relative flex items-center">
                        <MessageSquare className="w-6 h-6 mr-4" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">GET QUOTE</span>
                          <span className="text-xl font-black tracking-wide">Free Estimate</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 flex flex-wrap justify-center gap-6 text-primary-foreground/80">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-semibold">Available 24/7</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-semibold">Licensed Professionals</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-semibold">Satisfaction Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DrainCleaningFAQ;
