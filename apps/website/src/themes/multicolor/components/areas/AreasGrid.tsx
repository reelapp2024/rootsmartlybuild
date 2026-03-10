
import { MapPin, Clock, Award, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AreasGrid = () => {
  const areas = [
    { name: "New York", href: "/areas/new-york", description: "Manhattan, Brooklyn, Queens, Bronx, Staten Island" },
    { name: "Los Angeles", href: "/areas/los-angeles", description: "Hollywood, Beverly Hills, Santa Monica, West Hollywood" },
    { name: "Chicago", href: "/areas/chicago", description: "Downtown, North Side, South Side, West Side" },
    { name: "Houston", href: "/areas/houston", description: "Downtown, Midtown, Galleria, Medical Center" },
    { name: "Phoenix", href: "/areas/phoenix", description: "Central Phoenix, Scottsdale, Tempe, Mesa" },
    { name: "Philadelphia", href: "/areas/philadelphia", description: "Center City, University City, Northern Liberties" },
    { name: "San Antonio", href: "/areas/san-antonio", description: "Downtown, River Walk, Stone Oak, The Dominion" },
    { name: "San Diego", href: "/areas/san-diego", description: "Downtown, La Jolla, Mission Beach, Balboa Park" },
    { name: "Dallas", href: "/areas/dallas", description: "Downtown, Uptown, Deep Ellum, Bishop Arts District" },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/30 transition-colors duration-300">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16 animate-hero-fade-in">
          <h2 className="text-5xl font-bold text-foreground mb-6 animate-heading-slide-up">Areas We Serve</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12 animate-subtitle-fade-in stagger-1">
            Professional <span className="text-plumbing-responsive font-bold">Plumbing</span> services throughout Our availability.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="glass-card rounded-2xl p-6 border border-border/50 shadow-lg animate-card-scale-in stagger-1 hover-float hover-glow">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4 animate-icon-bounce" />
              <h3 className="text-xl font-bold text-card-foreground mb-2">United States</h3>
              <p className="text-muted-foreground">Nationwide coverage with local expertise</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 border border-border/50 shadow-lg animate-card-scale-in stagger-2 hover-float hover-glow">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4 animate-icon-bounce-delayed" />
              <h3 className="text-xl font-bold text-card-foreground mb-2">Response time: Extreme</h3>
              <p className="text-muted-foreground">Fast and reliable service delivery</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 border border-border/50 shadow-lg animate-card-scale-in stagger-3 hover-float hover-glow">
              <Award className="w-12 h-12 text-primary mx-auto mb-4 animate-icon-bounce" />
              <h3 className="text-xl font-bold text-card-foreground mb-2">100% Original services</h3>
              <p className="text-muted-foreground">Quality guaranteed every time</p>
            </div>
          </div>
          
          <div className="mb-16 animate-cta-zoom-in stagger-2">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 hover-float hover-glow">
              <Eye className="w-5 h-5 mr-2 animate-icon-bounce" />
              See Areas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {areas.map((area, index) => (
            <div 
              key={area.name} 
              className={`group relative bg-card rounded-2xl p-6 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 animate-card-fade-up stagger-${Math.min(index + 1, 8)} hover-float hover-glow`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-shift bg-[length:200%_200%]"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <MapPin className="w-8 h-8 text-primary animate-icon-bounce" style={{ animationDelay: `${index * 0.1}s` }} />
                  <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full animate-badge-bounce" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                    Available 24/7
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-card-foreground mb-3 animate-text-slide-left" style={{ animationDelay: `${index * 0.1 + 0.3}s` }}>{area.name}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed animate-subtitle-fade-in" style={{ animationDelay: `${index * 0.1 + 0.4}s` }}>{area.description}</p>
                
                <div className="flex items-center justify-between animate-cta-zoom-in" style={{ animationDelay: `${index * 0.1 + 0.5}s` }}>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors duration-300 hover-float"
                    onClick={() => window.location.href = area.href}
                  >
                    View Details
                  </Button>
                  <div className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: `${index * 0.1 + 0.6}s` }}>
                    Same-day service
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AreasGrid;
