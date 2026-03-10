
import { Phone, Clock, Star, Shield, Award, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AboutHeroProps {
  projectCategory?: string;
  phoneNumber?: string;
  aboutHeroText?: string;
}

const AboutHero = ({projectCategory,phoneNumber,aboutHeroText}: AboutHeroProps) => {
  return (
    <section
      className="relative min-h-[80vh] md:min-h-[85vh] flex items-center justify-center py-8 px-16 transition-all duration-300 overflow-hidden"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
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
          <div className="inline-flex items-center glass-card rounded-full px-6 py-3 text-primary-foreground font-semibold text-base sm:text-lg animate-badge-bounce shadow-2xl">
            <Star className="w-5 h-5 mr-2 fill-current animate-pulse" />
            <Sparkles className="w-4 h-4 mr-1 animate-pulse" />
            Your Trusted Partners
            <Sparkles className="w-4 h-4 ml-1 animate-pulse" />
          </div>

          {/* Enhanced Main Headline */}
          <div className="space-y-3 animate-heading-slide-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground leading-tight">
              About
              <span className="block md:inline text-plumbing-responsive bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text animate-gradient-shift"> US Plumbers</span>
            </h1>
          </div>

          {/* Enhanced Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/90 font-medium max-w-4xl mx-auto leading-relaxed animate-subtitle-fade-in" style={{ animationDelay: '0.4s' }}>
            Your trusted partner for all plumbing needs. With years of experience and a commitment to excellence, we deliver reliable solutions for your home or business.
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
                    <span className="text-sm font-semibold opacity-90">CALL NOW</span>
                    <span className="text-xl font-black tracking-wide">14676823822</span>
                  </div>
                </div>
                
                <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                </div>
              </Button>
            </div>

            {/* Learn More Button */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-primary to-blue-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition duration-500 animate-border-dance bg-[length:300%_300%]"></div>
              
              <Button
                size="lg"
                variant="outline"
                className="relative bg-white/95 backdrop-blur-sm text-primary border-2 border-primary/30 px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl font-bold shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 group hover:bg-primary hover:text-white"
              >
                <div className="relative flex items-center">
                  <div className="relative mr-3">
                    <Users className="w-6 h-6 animate-float-bounce" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold opacity-90">LEARN</span>
                    <span className="text-xl font-black tracking-wide">Our Story</span>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
