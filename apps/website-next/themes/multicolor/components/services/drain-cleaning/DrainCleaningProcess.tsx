
import { Search, FileText, Wrench, CheckCircle, Shield } from 'lucide-react';

const DrainCleaningProcess = () => {
  const steps = [
    {
      icon: Search,
      number: '1',
      title: 'Initial Assessment',
      description: 'Thorough assessment using state-of-the-art equipment to identify clogs or blockages.',
      color: 'bg-blue-500'
    },
    {
      icon: FileText,
      number: '2', 
      title: 'Customized Solution',
      description: 'Tailored drain cleaning solution recommended by professional plumbers.',
      color: 'bg-green-500'
    },
    {
      icon: Wrench,
      number: '3',
      title: 'Drain Cleaning Service',
      description: 'Efficient removal of debris, buildup, and blockages using advanced tools.',
      color: 'bg-orange-500'
    },
    {
      icon: CheckCircle,
      number: '4',
      title: 'Inspection and Maintenance', 
      description: 'Final inspection to ensure clear pipes and recommendations for ongoing maintenance.',
      color: 'bg-purple-500'
    },
    {
      icon: Shield,
      number: '5',
      title: 'Customer Satisfaction',
      description: 'Dedicated to providing exceptional service and ensuring customer satisfaction.',
      color: 'bg-red-500'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Our Simple Drain Cleaning Process
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our streamlined 5-step Drain Cleaning process ensures you get professional plumbing service from start to finish.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-card rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border">
                  <div className="flex items-start space-x-4">
                    <div className={`${step.color} rounded-full p-3 flex-shrink-0`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl font-bold text-primary mr-2">{step.number}</span>
                        <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DrainCleaningProcess;
