
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MapPin, Phone, Clock, CheckCircle } from 'lucide-react';

const Cities = () => {
  const cities = [
    {
      name: 'Metro City',
      slug: 'metro-city',
      description: 'Complete junk removal services in Metro City downtown area',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=500&auto=format&fit=crop',
      population: '1.2M',
      features: ['24/7 Emergency Service', 'Commercial Buildings', 'High-Rise Apartments']
    },
    {
      name: 'Riverside City',
      slug: 'riverside-city',
      description: 'Professional junk hauling services for Riverside residents',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=500&auto=format&fit=crop',
      population: '850K',
      features: ['Residential Focus', 'Same-Day Service', 'Eco-Friendly Disposal']
    },
    {
      name: 'Westfield City',
      slug: 'westfield-city',
      description: 'Comprehensive junk removal for Westfield communities',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop',
      population: '650K',
      features: ['Furniture Removal', 'Construction Debris', 'Business Cleanouts']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="bg-gradient-to-br from-brand-500 to-electric-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Cities We Serve
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Professional junk removal services across major metropolitan cities
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cities.map((city, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={city.image} 
                    alt={city.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-brand-500 rounded-full w-12 h-12 flex items-center justify-center">
                      <MapPin className="text-white" size={20} />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1">
                    <span className="text-sm font-bold text-gray-800">{city.population}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{city.name}</h3>
                  <p className="text-gray-600 mb-4">{city.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {city.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="text-green-500 mr-2" size={14} />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <Link 
                    to={`/cities/${city.slug}`} 
                    className="block w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-full font-bold text-center transition-all duration-300 transform hover:scale-105"
                  >
                    View City Details
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

export default Cities;
