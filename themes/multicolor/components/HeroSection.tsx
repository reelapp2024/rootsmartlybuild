'use client';

import Image from 'next/image';
import { Phone, Clock, Star, Shield, Award, CheckCircle, Sparkles, Zap, Users, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-[80vh] md:min-h-[85vh] flex items-center justify-center py-8 px-16 transition-all duration-300 overflow-hidden"
    >
      {/* LCP Optimized Background Image - Next.js Image for better performance */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Emergency Plumbing Service"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
      </div>
      {/* Background Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-accent/80 animate-gradient-shift bg-[length:200%_200%]"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-foreground/10 rounded-full animate-float-bounce"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-accent-foreground/20 rounded-full animate-float-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 bg-primary-foreground/15 animate-morphing-shape"></div>
        <div className="absolute bottom-40 right-10 w-24 h-24 bg-accent-foreground/10 rounded-full animate-float-bounce" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-16 py-8 z-10 max-w-6xl relative">
        <div className="text-center space-y-6 animate-hero-fade-in">

          {/* Enhanced Trust Badge */}
          <div className="inline-flex items-center glass-card rounded-full px-6 py-3 text-primary-foreground font-semibold animate-badge-bounce shadow-2xl">
            <Star className="w-5 h-5 mr-2 fill-current animate-pulse" />
            <Sparkles className="w-4 h-4 mr-1 animate-pulse" />
            Trusted by 10,000+ Customers
            <Sparkles className="w-4 h-4 ml-1 animate-pulse" />
          </div>

          {/* Enhanced Main Headline */}
          <div className="space-y-3 animate-heading-slide-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="font-bold text-primary-foreground leading-tight">
              Emergency
              <span className="block md:inline text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text animate-gradient-shift"> Plumbing </span>
              <span className="block md:inline text-primary-foreground/90">
                Service
              </span>
            </h1>
          </div>

          {/* Enhanced Subheadline */}
          <p className="text-primary-foreground/90 font-medium max-w-4xl mx-auto leading-relaxed animate-subtitle-fade-in" style={{ animationDelay: '0.4s' }}>
            Professional plumbers available 24/7 for all your emergency plumbing needs.
            Fast response, guaranteed satisfaction.
          </p>

          {/* Two Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-cta-zoom-in" style={{ animationDelay: '0.6s' }}>
            {/* Call Now Button */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 animate-border-dance bg-[length:300%_300%]"></div>
              <div className="absolute -inset-1 glass-card rounded-2xl animate-pulse-glow"></div>
              
              <Button
                size="lg"
                className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl font-bold shadow-2xl rounded-2xl border-2 border-orange-400/50 transform hover:scale-105 transition-all duration-300 group animate-gradient-shift bg-[length:200%_200%]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-shift bg-[length:200%_200%]"></div>
                
                <div className="relative flex items-center">
                  <div className="relative mr-3">
                    <Phone className="w-6 h-6 animate-float-bounce" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold opacity-90">CALL NOW</span>
                    <span className="font-black tracking-wide">14676823822</span>
                  </div>
                </div>
                
                <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                </div>
              </Button>
            </div>

            {/* Get Estimate Button */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-primary to-blue-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition duration-500 animate-border-dance bg-[length:300%_300%]"></div>
              
              <Button
                size="lg"
                variant="outline"
                className="relative bg-white/95 backdrop-blur-sm text-primary border-2 border-primary/30 px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl font-bold shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 group hover:bg-primary hover:text-white"
              >
                <div className="relative flex items-center">
                  <div className="relative mr-3">
                    <Wrench className="w-6 h-6 animate-float-bounce" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold opacity-90">FREE</span>
                    <span className="font-black tracking-wide">Get Estimate</span>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* White Service Cards with Theme Colors */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-6 sm:pt-8 max-w-5xl mx-auto">

            {/* Emergency Card - White Background with Red Theme */}
            <div className="group relative bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-red-500/30 shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:transform hover:scale-105 animate-card-fade-up overflow-hidden" style={{ animationDelay: '1s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative text-center space-y-3 sm:space-y-4">
                <div className="mx-auto p-3 sm:p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl w-fit relative">
                  <Clock className="w-8 h-8 sm:w-10 md:w-12 text-red-500 relative z-10" />
                  <div className="absolute inset-0 bg-red-500/10 rounded-xl sm:rounded-2xl animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-red-600 mb-2 sm:mb-3">Emergency Response</h3>
                  <p className="text-gray-700">
                    24/7 emergency plumbing service with fast response time guarantee.
                  </p>
                </div>
                
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 rounded-full animate-float opacity-50"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-500/20 rounded-full animate-float-delayed opacity-50"></div>
              </div>
            </div>

            {/* Professional Card - White Background with Primary Theme */}
            <div className="group relative bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-primary/30 shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:transform hover:scale-105 animate-card-fade-up overflow-hidden" style={{ animationDelay: '1.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-500/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative text-center space-y-3 sm:space-y-4">
                <div className="mx-auto p-3 sm:p-4 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-xl sm:rounded-2xl w-fit relative">
                  <Shield className="w-8 h-8 sm:w-10 md:w-12 text-primary relative z-10" />
                  <div className="absolute inset-0 bg-primary/10 rounded-xl sm:rounded-2xl animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-2 sm:mb-3">Licensed Professionals</h3>
                  <p className="text-gray-700">
                    Certified and insured plumbers with years of experience and expertise.
                  </p>
                </div>
                
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/20 rounded-full animate-float opacity-50"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500/20 rounded-full animate-float-delayed opacity-50"></div>
              </div>
            </div>

            {/* Guarantee Card - White Background with Success/Yellow Theme */}
            <div className="group relative bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-yellow-500/30 shadow-2xl hover:shadow-yellow-500/20 transition-all duration-500 hover:transform hover:scale-105 sm:col-span-2 lg:col-span-1 animate-card-fade-up overflow-hidden" style={{ animationDelay: '1.4s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-green-500/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative text-center space-y-3 sm:space-y-4">
                <div className="mx-auto p-3 sm:p-4 bg-gradient-to-br from-yellow-500/20 to-green-500/20 rounded-xl sm:rounded-2xl w-fit relative">
                  <Award className="w-8 h-8 sm:w-10 md:w-12 text-yellow-500 relative z-10" />
                  <div className="absolute inset-0 bg-yellow-500/10 rounded-xl sm:rounded-2xl animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-yellow-600 mb-2 sm:mb-3">100% Satisfaction</h3>
                  <p className="text-gray-700">
                    Quality workmanship guaranteed with complete customer satisfaction promise.
                  </p>
                </div>
                
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500/20 rounded-full animate-float opacity-50"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-500/20 rounded-full animate-float-delayed opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
