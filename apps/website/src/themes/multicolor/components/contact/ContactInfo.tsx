
import { Clock, MapPin, Phone, Mail, Shield, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ContactInfo = () => {
  const contactDetails = [
    {
      icon: Phone,
      title: "24/7 Emergency Line",
      info: "14676823822",
      description: "Call anytime for immediate assistance"
    },
    {
      icon: Mail,
      title: "Email Support",
      info: "info@usplumbers.com",
      description: "Get a response within 24 hours"
    },
    {
      icon: MapPin,
      title: "Service Coverage",
      info: "Nationwide",
      description: "Professional service across the US"
    },
    {
      icon: Clock,
      title: "Business Hours",
      info: "24/7 Available",
      description: "Emergency services always available"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Licensed & Insured",
      description: "Fully licensed professionals with comprehensive insurance coverage"
    },
    {
      icon: Award,
      title: "Satisfaction Guaranteed", 
      description: "100% satisfaction guarantee on all our plumbing services"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose US Plumbers?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We're committed to providing exceptional plumbing services with professional expertise and customer satisfaction as our top priorities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {contactDetails.map((detail, index) => {
            const IconComponent = detail.icon;
            return (
              <Card key={index} className="bg-card border border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-card-foreground mb-2">{detail.title}</h3>
                  <p className="text-primary font-bold text-lg mb-2">{detail.info}</p>
                  <p className="text-muted-foreground text-sm">{detail.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="bg-card border border-border shadow-lg">
                <CardContent className="p-8 flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-card-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactInfo;
