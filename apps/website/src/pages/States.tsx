
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MapPin, Phone, Clock, CheckCircle } from 'lucide-react';

const States = () => {
  const states = [
    {
      name: 'California',
      slug: 'california',
      description: 'Statewide junk removal services across California',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=500&auto=format&fit=crop',
      cities: '50+ Cities',
      features: ['Statewide Coverage', 'Licensed & Insured', 'Eco-Friendly Disposal']
    },
    {
      name: 'Texas',
      slug: 'texas',
      description: 'Comprehensive junk hauling across the Lone Star State',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=500&auto=format&fit=crop',
      cities: '40+ Cities',
      features: ['Large Item Removal', 'Commercial Services', 'Same-Day Available']
    },
    {
      name: 'Florida',
      slug: 'florida',
      description: 'Professional junk removal services throughout Florida',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop',
      cities: '35+ Cities',
      features: ['Hurricane Cleanup', 'Beach Area Service', 'Resort Cleanouts']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="bg-gradient-to-br from-lime-500 to-brand-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            States We Serve
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Professional junk removal services across multiple states
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {states.map((state, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={state.image} 
                    alt={state.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-lime-500 rounded-full w-12 h-12 flex items-center justify-center">
                      <MapPin className="text-white" size={20} />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1">
                    <span className="text-sm font-bold text-gray-800">{state.cities}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{state.name}</h3>
                  <p className="text-gray-600 mb-4">{state.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {state.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="text-green-500 mr-2" size={14} />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <Link 
                    to={`/states/${state.slug}`} 
                    className="block w-full bg-gradient-to-r from-lime-500 to-lime-600 text-black px-6 py-3 rounded-full font-bold text-center transition-all duration-300 transform hover:scale-105"
                  >
                    View State Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default States;
