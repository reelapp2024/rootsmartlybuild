
import { 
  CheckCircle, 
  Home, 
  Building2, 
  Zap, 
  Droplets, 
  Shield, 
  Leaf, 
  Camera, 
  Wrench, 
  Database, 
  Trash2, 
  Factory, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DrainCleaningServices = () => {
  const serviceCategories = [
    {
      title: "Residential Services",
      icon: Home,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      services: [
        { name: "Residential Drain Cleaning", icon: Droplets },
        { name: "Emergency Drain Cleaning", icon: Zap },
        { name: "Clogged Drain Cleaning", icon: AlertTriangle },
        { name: "Slow Drain Cleaning", icon: Clock }
      ]
    },
    {
      title: "Commercial Services", 
      icon: Building2,
      color: "text-green-500",
      bgColor: "bg-green-50",
      services: [
        { name: "Commercial Drain Cleaning", icon: Building2 },
        { name: "Industrial Drain Cleaning", icon: Factory },
        { name: "Grease Trap Drain Cleaning", icon: Trash2 },
        { name: "Septic Tank Drain Cleaning", icon: Database }
      ]
    },
    {
      title: "Professional Methods",
      icon: Shield,
      color: "text-purple-500", 
      bgColor: "bg-purple-50",
      services: [
        { name: "Hydro Jet Drain Cleaning", icon: Droplets },
        { name: "Video Inspection Drain Cleaning", icon: Camera },
        { name: "Rooter Drain Cleaning", icon: Wrench },
        { name: "High-pressure Drain Cleaning", icon: Zap }
      ]
    },
    {
      title: "Premium Options",
      icon: Leaf,
      color: "text-teal-500",
      bgColor: "bg-teal-50", 
      services: [
        { name: "Professional Drain Cleaning", icon: Shield },
        { name: "Affordable Drain Cleaning", icon: CheckCircle },
        { name: "Eco-Friendly Drain Cleaning", icon: Leaf }
      ]
    }
  ];

  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="mb-6 animate-heading-slide-up">
            Our Complete Drain Cleaning Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-subtitle-fade-in" style={{ animationDelay: '0.2s' }}>
            Comprehensive drain cleaning solutions for every need. From emergency repairs to routine maintenance, we've got you covered.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          {serviceCategories.map((category, categoryIndex) => (
            <Card 
              key={categoryIndex} 
              className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300 group animate-card-scale-in overflow-hidden"
              style={{ animationDelay: `${0.1 * categoryIndex}s` }}
            >
              <CardContent className="p-6">
                {/* Category Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 ${category.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <category.icon className={`w-8 h-8 ${category.color}`} />
                  </div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                </div>

                {/* Services List */}
                <div className="space-y-3">
                  {category.services.map((service, serviceIndex) => (
                    <div 
                      key={serviceIndex}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 group/item"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                        <service.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover/item:text-primary transition-colors leading-tight">
                        {service.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Services Banner */}
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 animate-card-fade-up" style={{ animationDelay: '0.8s' }}>
          <CardContent className="p-8 text-center">
            <h4 className="font-bold text-foreground mb-4">
              Need a Custom Solution?
            </h4>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Every drain cleaning situation is unique. Our experienced technicians can handle any challenge with specialized equipment and proven techniques.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-primary hover:bg-primary/90">
                Get Custom Quote
              </Button>
              <Button variant="outline">
                Schedule Inspection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DrainCleaningServices;
