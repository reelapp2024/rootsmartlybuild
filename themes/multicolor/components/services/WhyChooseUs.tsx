
import { Users, Award, Clock, DollarSign, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const WhyChooseUs = () => {
  const reasons = [
    {
      icon: Users,
      title: 'Experienced Professionals',
      description: 'Our team consists of highly skilled and experienced plumbers who are experts in their field.',
      color: 'text-blue-600'
    },
    {
      icon: Award,
      title: 'Quality Workmanship',
      description: 'We take pride in our work and always strive to deliver high-quality results that meet or exceed our customers\' expectations.',
      color: 'text-green-600'
    },
    {
      icon: Clock,
      title: 'Prompt Service',
      description: 'We understand the importance of timely service and always strive to respond quickly to our customers\' plumbing needs.',
      color: 'text-orange-600'
    },
    {
      icon: DollarSign,
      title: 'Affordable Pricing',
      description: 'We offer competitive pricing without compromising on the quality of our work, making us a cost-effective choice for plumbing services.',
      color: 'text-purple-600'
    },
    {
      icon: Shield,
      title: 'Customer Satisfaction Guarantee',
      description: 'We are committed to ensuring our customers are satisfied with our work, and we offer a satisfaction guarantee on all our plumbing services.',
      color: 'text-red-600'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Choose US Plumbers?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            When you choose us, you're choosing quality, reliability, and exceptional service that's backed by years of experience and thousands of satisfied customers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reasons.map((reason, index) => (
            <Card key={index} className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <reason.icon className={`w-8 h-8 ${reason.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{reason.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{reason.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
