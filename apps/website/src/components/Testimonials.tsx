
import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Downtown Area",
      rating: 5,
      text: "Absolutely amazing service! They fixed my plumbing emergency within an hour. Professional, reliable, and affordable. Highly recommended!",
      service: "Emergency Plumbing"
    },
    {
      name: "Mike Rodriguez",
      location: "Suburban District",
      rating: 5,
      text: "Best local service company I've ever worked with. Quick response, fair pricing, and excellent workmanship. Will definitely call again!",
      service: "Electrical Repair"
    },
    {
      name: "Emily Chen",
      location: "City Center",
      rating: 5,
      text: "Professional team that goes above and beyond. They not only fixed the issue but also provided helpful maintenance tips. Outstanding service!",
      service: "Home Maintenance"
    },
    {
      name: "David Thompson",
      location: "East Side",
      rating: 5,
      text: "Called them for an emergency repair and they were at my door in 30 minutes! Quality work and honest pricing. These guys are the real deal.",
      service: "Emergency Service"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            What Our Customers Are Saying
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Don't just take our word for it. See what our satisfied customers have to say about our services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 group transform hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-brand-500 to-electric-500 p-3 rounded-full mr-4">
                  <Quote className="w-8 h-8 text-white" />
                </div>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-lime-500 fill-current" />
                  ))}
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed italic text-lg">
                "{testimonial.text}"
              </p>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-gradient-to-r from-electric-500 to-brand-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {testimonial.service}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-lime-400 to-lime-500 rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl">
            <h3 className="text-3xl font-bold text-black mb-4">Join Thousands of Happy Customers!</h3>
            <p className="mb-6 text-black text-lg">
              Experience the same quality service that earned us these amazing reviews.
            </p>
            <button className="bg-gradient-to-r from-electric-600 to-brand-600 hover:from-electric-500 hover:to-brand-500 text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
              Get Your Free Quote Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
