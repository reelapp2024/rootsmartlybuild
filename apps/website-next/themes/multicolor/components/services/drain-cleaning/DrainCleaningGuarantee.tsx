
import { Shield, Clock, Users, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const DrainCleaningGuarantee = () => {
  const guarantees = [
    {
      icon: Shield,
      title: 'Satisfaction Guaranteed',
      description: 'We guarantee your satisfaction with our drain cleaning service.',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Clock,
      title: '24/7 Emergency Service',
      description: 'We offer 24/7 emergency drain cleaning service to handle any urgent issues.',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Users,
      title: 'Experienced Professionals',
      description: 'Our team consists of experienced professionals who are experts in drain cleaning.',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'We provide upfront pricing and ensure transparency in all our drain cleaning services.',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Our Drain Cleaning Guarantee
          </h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            At US Plumbers, we guarantee reliable and effective drain cleaning services. Our team of experienced professionals is committed to providing top-notch solutions for all your plumbing needs. Trust us to unclog your drains and keep your plumbing system running smoothly. Your satisfaction is our priority.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {guarantees.map((guarantee, index) => (
            <Card key={index} className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${guarantee.gradient} mb-4`}>
                    <guarantee.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{guarantee.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{guarantee.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DrainCleaningGuarantee;
