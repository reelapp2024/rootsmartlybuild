import React from 'react';
import { Phone, Clock, CheckCircle, Star, Zap, Trees } from 'lucide-react';

const TreeHero = () => {
  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden font-poppins">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80"
          alt="Professional tree removal services"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900/95 via-nature-900/90 to-forest-800/95"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-nature-400/20 rounded-full blur-xl animate-bounce-slow"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-forest-400/20 rounded-full blur-xl animate-bounce-slow delay-1000"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
        <div className="max-w-5xl mx-auto">
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-white/90 text-sm">
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <CheckCircle size={16} className="mr-2 text-nature-400" />
              <span className="font-medium">Certified Arborists</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Trees size={16} className="mr-2 text-forest-400" />
              <span className="font-medium">Emergency Service</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Star size={16} className="mr-2 text-nature-400" />
              <span className="font-medium">5-Star Rated</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-6 leading-tight">
            Professional
            <span className="block bg-gradient-to-r from-nature-400 via-forest-400 to-forest-500 bg-clip-text text-transparent animate-pulse">
              Tree Removal
            </span>
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2 font-bold">
              & Tree Care Services!
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            🌲 Same-day service • 🌲 Eco-friendly disposal • ⚡ Licensed arborists in 30 minutes
          </p>

          {/* Phone Number Display - Fixed and Responsive */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/30 shadow-2xl">
              <Phone size={28} className="text-nature-400 mr-3 sm:mr-4 animate-pulse flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wide font-semibold">Call Now - Emergency Service</div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white break-all sm:break-normal">
                  (555) 123-4567
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <a 
              href="tel:5551234567"
              className="group bg-gradient-to-r from-nature-500 to-nature-600 hover:from-nature-400 hover:to-nature-500 text-black px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-full font-bold text-lg sm:text-xl lg:text-2xl transition-all duration-300 flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-center shadow-2xl transform hover:scale-105"
            >
              <Phone size={24} className="group-hover:animate-pulse flex-shrink-0" />
              <span className="whitespace-nowrap">CALL NOW: (555) 123-4567</span>
            </a>
            
            <a 
              href="tel:5551234567"
              className="group bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-400 hover:to-forest-500 text-white px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-full font-bold text-lg sm:text-xl lg:text-2xl transition-all duration-300 flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-center shadow-2xl transform hover:scale-105"
            >
              <Clock size={24} className="group-hover:rotate-12 transition-transform duration-200 flex-shrink-0" />
              <span className="whitespace-nowrap">Emergency Service</span>
            </a>
          </div>

          {/* Urgency Message */}
          <div className="bg-gradient-to-r from-forest-500/80 to-nature-500/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-white font-bold text-base sm:text-lg lg:text-xl flex items-center justify-center flex-wrap gap-2">
              <Zap className="text-nature-400 animate-pulse flex-shrink-0" />
              <span className="text-center">24/7 Emergency Tree Removal - Call Now!</span>
              <Zap className="text-nature-400 animate-pulse flex-shrink-0" />
            </p>
          </div>
        </div>
      </div>

      {/* Floating Call Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <a 
          href="tel:5551234567"
          className="bg-gradient-to-r from-nature-500 to-nature-600 hover:from-nature-400 hover:to-nature-500 text-black p-4 rounded-full shadow-2xl animate-bounce-slow"
        >
          <Phone size={24} />
        </a>
      </div>
    </section>
  );
};

export default TreeHero;
