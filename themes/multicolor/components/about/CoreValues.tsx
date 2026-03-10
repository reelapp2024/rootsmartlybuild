
import { Users, Award, Wrench, Shield, Clock, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const CoreValues = () => {
  const values = [
    {
      icon: Users,
      title: 'Customer First',
      description: 'Your satisfaction is our top priority. We listen to your needs and exceed your expectations with every service.',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Award,
      title: 'Professional Team',
      description: 'Our trained and experienced plumbing professionals are background-checked, insured, and committed to excellence.',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Wrench,
      title: 'Quality Tools',
      description: 'We use professional-grade tools and equipment that ensure reliable, long-lasting plumbing solutions.',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'Quality Standards',
      description: 'We maintain the highest standards of workmanship and quality control in every job we undertake.',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      icon: Clock,
      title: 'Reliability',
      description: 'Count on us to arrive on time and complete your plumbing service efficiently and thoroughly.',
      gradient: 'from-red-500 to-red-600'
    },
    {
      icon: Heart,
      title: 'Trust & Safety',
      description: 'We are fully licensed, bonded, and insured, giving you complete peace of mind with every service.',
      gradient: 'from-pink-500 to-pink-600'
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Our Core Values
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            These fundamental principles guide everything we do and define who we are as a plumbing service provider.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {values.map((value, index) => (
            <Card key={index} className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${value.gradient} mb-4`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreValues;
