
import React from 'react';
import { Users, Award, Clock, Shield } from 'lucide-react';

const AboutUs = () => {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-gray-50 to-white font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            About Us
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            We are your trusted local service provider, committed to delivering exceptional quality and reliable solutions for all your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-electric-500 to-electric-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Expert Team</h3>
            <p className="text-gray-600 leading-relaxed">Skilled professionals with years of experience</p>
          </div>

          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <Award className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Quality Service</h3>
            <p className="text-gray-600 leading-relaxed">Guaranteed satisfaction with every project</p>
          </div>

          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Fast Response</h3>
            <p className="text-gray-600 leading-relaxed">Quick turnaround times for urgent needs</p>
          </div>

          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-electric-600 to-brand-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Trusted</h3>
            <p className="text-gray-600 leading-relaxed">Licensed, insured, and locally owned</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-8">
              Your Local Service Experts
            </h3>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              With over a decade of experience serving our community, we understand the unique needs of local customers. Our team of certified professionals is dedicated to providing top-quality services that exceed expectations.
            </p>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              We take pride in our reputation for reliability, professionalism, and customer satisfaction. Whether it's an emergency call or a scheduled service, we're here to help 24/7.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-electric-50 to-electric-100 p-4 rounded-xl">
                <div className="w-3 h-3 bg-gradient-to-r from-electric-500 to-electric-600 rounded-full"></div>
                <span className="text-gray-700 font-semibold">Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-lime-50 to-lime-100 p-4 rounded-xl">
                <div className="w-3 h-3 bg-gradient-to-r from-lime-500 to-lime-600 rounded-full"></div>
                <span className="text-gray-700 font-semibold">Locally Owned</span>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-brand-50 to-brand-100 p-4 rounded-xl">
                <div className="w-3 h-3 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"></div>
                <span className="text-gray-700 font-semibold">24/7 Available</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-400 to-electric-400 rounded-2xl blur opacity-75"></div>
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80"
              alt="Professional team at work"
              className="relative rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
