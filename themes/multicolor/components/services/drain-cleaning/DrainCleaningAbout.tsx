
import { Shield, Zap, CheckCircle, Award } from 'lucide-react';

const DrainCleaningAbout = () => {
  const features = [
    {
      icon: Shield,
      title: "Licensed & Insured",
      description: "Fully licensed professionals with comprehensive insurance coverage"
    },
    {
      icon: Zap,
      title: "24/7 Emergency Service",
      description: "Round-the-clock availability for urgent drain cleaning needs"
    },
    {
      icon: CheckCircle,
      title: "100% Satisfaction Guarantee",
      description: "We stand behind our work with a complete satisfaction promise"
    },
    {
      icon: Award,
      title: "Expert Technicians",
      description: "Trained and certified drain cleaning specialists with years of experience"
    }
  ];

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent rounded-full animate-float-delayed"></div>
      </div>

      <div className="container mx-auto px-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content Column */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="mb-6 animate-heading-slide-up">
                  About Our Professional Drain Cleaning Services
                </h2>
                <p className="text-xl text-muted-foreground mb-8 animate-subtitle-fade-in" style={{ animationDelay: '0.2s' }}>
                  Trusted by thousands of homeowners and businesses across the US for reliable, effective drain cleaning solutions.
                </p>
              </div>
              
              <div className="prose prose-lg max-w-none animate-text-slide-left" style={{ animationDelay: '0.4s' }}>
                <h3 className="mb-4">Why Choose Our Drain Cleaning Experts?</h3>
                <p className="mb-6">
                  For top-notch drain cleaning services in the US, trust our team of experts at US Plumbers. We specialize in both residential and commercial drain cleaning, offering emergency services when you need them most. Our advanced hydro jet drain cleaning uses high-pressure water to effectively clear out any blockages, while our professional approach ensures a thorough and efficient job every time.
                </p>
                
                <h4 className="mb-4">Comprehensive Service Coverage</h4>
                <p className="mb-6">
                  With affordable drain cleaning options and eco-friendly practices, we prioritize both your budget and the environment. From video inspection drain cleaning to rooter services, septic tank maintenance to grease trap cleaning, we have the tools and expertise to handle any job. Say goodbye to clogged drains and slow drains with our industrial-grade cleaning services.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid sm:grid-cols-2 gap-4 animate-card-fade-up" style={{ animationDelay: '0.6s' }}>
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3 p-4 rounded-lg bg-card border border-border hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Column */}
            <div className="lg:order-first animate-image-slide-right" style={{ animationDelay: '0.3s' }}>
              <div className="relative">
                {/* Main Image */}
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="Professional plumber performing drain cleaning service with modern equipment"
                    className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"></div>
                </div>

                {/* Floating Stats Cards */}
                <div className="absolute -bottom-8 -left-8 bg-card border border-border rounded-xl p-4 shadow-lg animate-float">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">15+</div>
                    <div className="text-sm text-muted-foreground">Years Experience</div>
                  </div>
                </div>

                <div className="absolute -top-8 -right-8 bg-card border border-border rounded-xl p-4 shadow-lg animate-float-delayed">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-sm text-muted-foreground">Emergency Service</div>
                  </div>
                </div>

                {/* Background decoration */}
                <div className="absolute -z-10 top-8 left-8 w-full h-full bg-primary/10 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DrainCleaningAbout;
