
import { Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AboutCTA = () => {
  return (
    <section className="py-20 bg-hero-gradient text-primary-foreground transition-all duration-300">
      <div className="container mx-auto px-16 text-center">
        <h2 className="text-4xl font-bold mb-6 text-primary-foreground">Transform your home with our professional Plumbing services</h2>
        <p className="text-xl mb-8 max-w-3xl mx-auto text-primary-foreground/80">
          Don't let plumbing problems disrupt your life. Our expert plumbers are ready to help 24/7. 
          Call now for immediate assistance or book your service online.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Highlighted Call Now Button */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 animate-border-dance bg-[length:300%_300%]"></div>
            <div className="absolute -inset-2 glass-card rounded-2xl animate-pulse-glow"></div>
            
            <Button
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white px-10 py-8 text-xl font-bold shadow-2xl rounded-2xl border-2 border-orange-400/50 transform hover:scale-105 transition-all duration-300 group animate-gradient-shift bg-[length:200%_200%]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-shift bg-[length:200%_200%]"></div>
              
              <div className="relative flex items-center">
                <div className="relative mr-4">
                  <Phone className="w-7 h-7 animate-float-bounce" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">EMERGENCY CALL</span>
                  <span className="text-2xl font-black tracking-wide">14676823822</span>
                </div>
              </div>
            </Button>
          </div>

          {/* Secondary Button */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-primary to-blue-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition duration-500 animate-border-dance bg-[length:300%_300%]"></div>
            
            <Button
              size="lg"
              variant="outline"
              className="relative bg-white/95 backdrop-blur-sm text-primary border-2 border-primary/30 px-10 py-8 text-xl font-bold shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 group hover:bg-primary hover:text-white"
            >
              <div className="relative flex items-center">
                <Calendar className="w-7 h-7 mr-4" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">BOOK ONLINE</span>
                  <span className="text-xl font-black tracking-wide">Schedule Service</span>
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-primary-foreground/80">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-semibold">24/7 Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-semibold">Licensed & Insured</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-semibold">Same Day Service</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCTA;
