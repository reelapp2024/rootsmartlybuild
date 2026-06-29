
import { Users, Clock, Settings, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const DrainCleaningWhyChoose = () => {
  const reasons = [
    {
      icon: Users,
      title: 'Professional Service',
      description: 'Our team of experienced plumbers provide top-quality drain cleaning services.',
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      title: 'Fast Response Time',
      description: 'We understand the urgency of clogged drains, and respond quickly to your service calls.',
      color: 'text-green-600'
    },
    {
      icon: Settings,
      title: 'Advanced Equipment',
      description: 'We use the latest technology and tools to efficiently clean your drains and prevent future clogs.',
      color: 'text-orange-600'
    },
    {
      icon: Shield,
      title: 'Customer Satisfaction',
      description: 'Our goal is to ensure that you are completely satisfied with our drain cleaning services.',
      color: 'text-purple-600'
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Choose Drain Cleaning by US Plumbers?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            When you choose us, you're choosing quality, reliability, and exceptional service that's backed by years of experience and thousands of satisfied customers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
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

export default DrainCleaningWhyChoose;
