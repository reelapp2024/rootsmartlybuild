
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: "What areas do you serve?",
      answer: "We provide local services throughout the metropolitan area and surrounding communities. Contact us to confirm service availability in your specific location."
    },
    {
      question: "Do you offer emergency services?",
      answer: "Yes! We provide 24/7 emergency services for urgent repairs and issues. Call us anytime at (555) 123-4567 for immediate assistance."
    },
    {
      question: "Are you licensed and insured?",
      answer: "Absolutely. All our technicians are fully licensed professionals, and we carry comprehensive insurance coverage for your protection and peace of mind."
    },
    {
      question: "How quickly can you respond to service calls?",
      answer: "For emergency calls, we typically respond within 1-2 hours. For scheduled appointments, we offer same-day or next-day service based on availability."
    },
    {
      question: "Do you provide free estimates?",
      answer: "Yes, we provide free, no-obligation estimates for all our services. Contact us to schedule your free consultation and quote."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept cash, check, and all major credit cards. Payment is typically due upon completion of services unless other arrangements are made."
    },
    {
      question: "Do you guarantee your work?",
      answer: "Yes, we stand behind all our work with a 100% satisfaction guarantee. If you're not completely satisfied, we'll make it right."
    },
    {
      question: "Can I schedule recurring maintenance services?",
      answer: "Absolutely! We offer flexible scheduling for regular maintenance services to keep your property in excellent condition year-round."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white font-poppins">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Got questions? We've got answers. Find everything you need to know about our services, 
            process, and what to expect when you choose us.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 last:border-b-0">
                <AccordionTrigger className="text-left text-xl font-bold text-gray-900 hover:text-brand-600 py-6 transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-6 leading-relaxed text-lg">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-electric-500 to-brand-600 rounded-2xl p-8 text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">Still Have Questions?</h3>
            <p className="text-electric-100 mb-8 text-lg">
              Can't find what you're looking for? Our friendly team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
                Call (555) 123-4567
              </button>
              <button className="bg-white hover:bg-gray-100 text-electric-600 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
