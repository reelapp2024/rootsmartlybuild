
import { Card, CardContent } from '@/components/ui/card';

const DrainCleaningPromise = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Our Promise to You
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                "Experience the difference with our drain cleaning service - fast, reliable, and guaranteed to unclog any blockage. Trust US Plumbers to keep your pipes flowing smoothly and your home running efficiently. Say goodbye to stubborn clogs and hello to exceptional service. Let us take care of your drains so you can focus on what truly matters."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DrainCleaningPromise;
