'use client';

import { Award, Clock, Shield, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useGuaranteeData } from '../../../../hooks/useGuaranteeData.js';
import DynamicFAIcon from '../../../../extras/DynamicFAIcon';

interface GuaranteeItem {
  title?: string;
  description?: string;
  iconClass?: string;
  gradient?: string;
  [key: string]: unknown;
}

const ServicesGuarantee = () => {


  const {
    guarantees,
    guaranteeText,
    promiseLine,
    projectCategory,
    isLoading
  } = useGuaranteeData();

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 font-poppins">
        <div className="max-w-7xl mx-auto px-16 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="bg-gray-200 h-12 w-64 mx-auto mb-6 rounded"></div>
              <div className="bg-gray-200 h-4 w-96 mx-auto rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-64"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
 const colorSets = [
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-orange-500 to-orange-600',
  'from-purple-500 to-purple-600',
];

// Add gradient if missing
const updatedGuarantees = (guarantees || []).map((guarantee: GuaranteeItem, index: number) => ({
  ...guarantee,
  gradient: guarantee.gradient || colorSets[index % colorSets.length]  // Apply gradient if missing
}));

console.log(updatedGuarantees);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Our {projectCategory} Guarantee
          </h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {guaranteeText}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {updatedGuarantees.map((guarantee: GuaranteeItem, index: number) => (
            <Card key={index} className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${guarantee.gradient} mb-4`}>
                    <DynamicFAIcon iconClass={guarantee.iconClass || ''}  className="text-white"/>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{guarantee.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{guarantee.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-primary/5 border-primary/20 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">Our Promise to You</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {promiseLine}

              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ServicesGuarantee;
