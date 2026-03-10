
import React from 'react';
import { MapPin, Clock, Phone, Truck, Building, Flag, Navigation } from 'lucide-react';

const ServiceAreas = () => {
  return (
    <section className="py-20 bg-white font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            Our Service Locations
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            We proudly serve multiple states, cities, and areas with fast, reliable junk removal services. 
            Same-day pickup available in most locations!
          </p>
        </div>

        {/* States Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">States We Serve</h3>
            <p className="text-lg text-gray-600">Professional junk removal across multiple states</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <a 
              href="/states"
              className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-lime-200 group transform hover:-translate-y-2 block text-center"
            >
              <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 rounded-full mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <Flag className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">View All States</h4>
              <p className="text-gray-600 mb-4">Statewide coverage with licensed professionals</p>
              <div className="text-lime-600 font-semibold group-hover:text-lime-700 transition-colors">
                Explore States →
              </div>
            </a>

            <a 
              href="/cities"
              className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-brand-200 group transform hover:-translate-y-2 block text-center"
            >
              <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-4 rounded-full mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <Building className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">View All Cities</h4>
              <p className="text-gray-600 mb-4">Major metropolitan areas and urban centers</p>
              <div className="text-brand-600 font-semibold group-hover:text-brand-700 transition-colors">
                Explore Cities →
              </div>
            </a>

            <a 
              href="/areas"
              className="bg-gradient-to-br from-electric-50 to-electric-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-electric-200 group transform hover:-translate-y-2 block text-center"
            >
              <div className="bg-gradient-to-r from-electric-500 to-electric-600 p-4 rounded-full mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">View All Areas</h4>
              <p className="text-gray-600 mb-4">Local neighborhoods and districts</p>
              <div className="text-electric-600 font-semibold group-hover:text-electric-700 transition-colors">
                Explore Areas →
              </div>
            </a>
          </div>
        </div>

        {/* Service Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-gradient-to-br from-electric-500 to-electric-600 rounded-2xl p-8 text-white text-center shadow-xl transform hover:scale-105 transition-all duration-300">
            <Clock className="w-16 h-16 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">Same Day Service</h3>
            <p className="text-electric-100">Most locations receive same-day junk removal service when you call before 2 PM</p>
          </div>
          
          <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-2xl p-8 text-black text-center shadow-xl transform hover:scale-105 transition-all duration-300">
            <Phone className="w-16 h-16 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">Quick Response</h3>
            <p>Fast quotes and scheduling available in all service locations</p>
          </div>
          
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-8 text-white text-center shadow-xl transform hover:scale-105 transition-all duration-300">
            <Truck className="w-16 h-16 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">Local Experts</h3>
            <p className="text-brand-100">We know your location and provide the best junk removal solutions</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-electric-500 to-brand-600 rounded-2xl p-8 max-w-5xl mx-auto text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">Don't See Your Location Listed?</h3>
            <p className="mb-8 text-electric-100 text-lg">
              We're constantly expanding our junk removal service locations. Call us to check if we serve your area!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
                Call Now: (555) 123-4567
              </button>
              <button className="bg-white hover:bg-gray-100 text-electric-600 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
                Get Free Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreas;
