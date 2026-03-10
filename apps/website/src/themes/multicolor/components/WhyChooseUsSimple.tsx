
import { Shield, Award, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const WhyChooseUsSimple = () => {
  const features = [
    {
      icon: Shield,
      title: "Licensed Professionals",
      description: "Certified and insured plumbers with years of experience and expertise."
    },
    {
      icon: Award,
      title: "100% Satisfaction",
      description: "Quality workmanship guaranteed with complete customer satisfaction promise."
    },
    {
      icon: Clock,
      title: "Fast Response",
      description: "Quick response times with reliable and efficient service delivery."
    }
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose US Plumbers?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We're committed to providing exceptional plumbing services with professional expertise and customer satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="bg-card border border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-card-foreground mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSimple;
