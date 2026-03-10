
import React from 'react';
import { Shield, Clock, Award, CheckCircle, Truck, Star } from 'lucide-react';

const JunkGuarantee = () => {
  const guarantees = [
    {
      icon: Shield,
      title: '100% Satisfaction Guarantee',
      description: 'If you\'re not completely satisfied, we\'ll make it right or provide a full refund.',
      highlight: '100% Guaranteed'
    },
    {
      icon: Clock,
      title: 'Same-Day Service',
      description: 'Call us and we\'ll be there the same day to remove your junk quickly and efficiently.',
      highlight: 'Same-Day Pickup'
    },
    {
      icon: Award,
      title: 'Eco-Friendly Disposal',
      description: 'We recycle and donate items whenever possible to minimize environmental impact.',
      highlight: 'Earth-Friendly'
    },
    {
      icon: Truck,
      title: 'Licensed & Insured',
      description: 'Fully licensed and insured for your protection and peace of mind.',
      highlight: 'Fully Protected'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-brand-900 to-electric-900 text-white font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Our Junk Removal
            <span className="block bg-gradient-to-r from-lime-400 to-electric-400 bg-clip-text text-transparent">
              Guarantee
            </span>
          </h2>
          <p className="text-xl text-brand-100 max-w-3xl mx-auto">
            We stand behind our service with guarantees that protect you and exceed your expectations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {guarantees.map((guarantee, index) => (
            <div key={index} className="bg-gradient-to-br from-brand-800 to-electric-800 rounded-2xl p-6 shadow-xl border border-brand-600 hover:border-lime-500 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-lime-500 to-electric-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <guarantee.icon size={32} className="text-black" />
              </div>
              <h3 className="text-xl font-bold text-center mb-4">{guarantee.title}</h3>
              <p className="text-brand-200 text-center mb-4">{guarantee.description}</p>
              <div className="bg-lime-500/20 border border-lime-500/30 rounded-lg p-3 text-center">
                <span className="text-lime-400 font-semibold">{guarantee.highlight}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="tel:5551234567"
            className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Call Now: (555) 123-4567
          </a>
        </div>
      </div>
    </section>
  );
};

export default JunkGuarantee;
