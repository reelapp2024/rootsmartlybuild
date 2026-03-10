
import { Target, Eye, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MissionVision = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Our Mission & Vision
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Driving our commitment to excellence in professional plumbing services
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Mission */}
          <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Our Mission</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                To provide exceptional plumbing services that create safe, functional environments for families and businesses while using reliable methods and sustainable practices.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span>Deliver reliable results every time</span>
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span>Use professional-grade equipment</span>
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span>Exceed customer expectations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Our Vision</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                To be the most trusted and preferred plumbing service provider, known for our reliability, quality, and commitment to creating safer spaces for our community.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span>Leading professional plumbing standards</span>
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span>Expanding our service areas</span>
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span>Setting industry benchmarks</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MissionVision;
