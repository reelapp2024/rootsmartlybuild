
import { Leaf, Zap, Shield, Star, Users, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const WhyDifferent = () => {
  const differences = [
    {
      icon: Leaf,
      title: '100% Professional',
      description: 'Licensed, professional plumbing solutions that protect your property and ensure lasting results.',
      color: 'text-green-600'
    },
    {
      icon: Zap,
      title: 'Same-Day Service',
      description: 'Need plumbing repair today? We offer flexible scheduling with same-day booking available.',
      color: 'text-yellow-600'
    },
    {
      icon: Shield,
      title: 'Bonded & Insured',
      description: 'Complete protection for your property with fully insured and background-checked staff.',
      color: 'text-blue-600'
    },
    {
      icon: Star,
      title: 'Quality Guarantee',
      description: '100% satisfaction guarantee - if you\'re not happy, we\'ll make it right at no charge.',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Trained Professionals',
      description: 'Experienced, uniformed plumbing professionals who treat your space with respect.',
      color: 'text-orange-600'
    },
    {
      icon: CheckCircle,
      title: 'Consistent Results',
      description: 'Reliable, consistent plumbing results every time with detailed quality checklists.',
      color: 'text-red-600'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            What Makes Us Different
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our unique advantages that set us apart from other plumbing services
          </p>
        </div>

        {/* Commitment Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="bg-card border-border shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">Our Commitment to Excellence</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                At our core, we believe that reliable plumbing contributes to better living, increased comfort, and overall well-being. This belief drives us to continuously improve our services, invest in our team's training, and adopt the latest plumbing technologies and methods.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We don't just fix pipes; we create reliable systems where families can thrive and businesses can prosper. Every job we complete is a testament to our dedication to quality and our commitment to making a positive difference in our clients' lives.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Differences Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {differences.map((diff, index) => (
            <Card key={index} className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <diff.icon className={`w-8 h-8 ${diff.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{diff.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{diff.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
