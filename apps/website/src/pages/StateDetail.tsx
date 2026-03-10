
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MapPin, Phone, Clock, CheckCircle, Users, Building } from 'lucide-react';

const StateDetail = () => {
  const { slug } = useParams();

  // Mock data - in real app this would come from API
  const stateData = {
    'california': {
      name: 'California',
      description: 'Professional junk removal services across the Golden State',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&auto=format&fit=crop',
      cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno'],
      totalCities: '50+',
      population: '39.5M',
      features: [
        'Statewide Coverage',
        'Licensed & Insured',
        'Eco-Friendly Disposal',
        'Same-Day Service',
        'Commercial & Residential',
        'Construction Debris Removal'
      ]
    },
    'texas': {
      name: 'Texas',
      description: 'Comprehensive junk hauling across the Lone Star State',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop',
      cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
      totalCities: '40+',
      population: '30.0M',
      features: [
        'Large Item Removal',
        'Commercial Services',
        'Same-Day Available',
        'Estate Cleanouts',
        'Office Furniture Removal',
        'Appliance Disposal'
      ]
    },
    'florida': {
      name: 'Florida',
      description: 'Professional junk removal services throughout the Sunshine State',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
      totalCities: '35+',
      population: '22.6M',
      features: [
        'Hurricane Cleanup',
        'Beach Area Service',
        'Resort Cleanouts',
        'Vacation Rental Service',
        'Pool Area Cleanup',
        'Storm Debris Removal'
      ]
    }
  };

  const state = stateData[slug as keyof typeof stateData];

  if (!state) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">State Not Found</h1>
          <p className="text-xl text-gray-600">The state you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-to-br from-lime-500 to-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${state.image})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-lime-500/80 to-brand-600/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            {state.name} Junk Removal
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            {state.description}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg">
            <div className="flex items-center">
              <Users className="mr-2" size={20} />
              {state.population} Population
            </div>
            <div className="flex items-center">
              <Building className="mr-2" size={20} />
              {state.totalCities} Cities Served
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose Us in {state.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {state.features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <CheckCircle className="text-green-500 mb-4" size={24} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature}</h3>
                <p className="text-gray-600">Professional service you can trust throughout {state.name}.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Major Cities We Serve in {state.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {state.cities.map((city, index) => (
              <div key={index} className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <MapPin className="text-brand-500 mx-auto mb-4" size={32} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{city}</h3>
                <p className="text-gray-600 mb-4">Professional junk removal services</p>
                <button className="bg-brand-500 text-white px-6 py-2 rounded-full hover:bg-brand-600 transition-colors">
                  Get Quote
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-lime-500 to-brand-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started in {state.name}?</h2>
          <p className="text-xl mb-8">Call us today for fast, reliable junk removal service</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-brand-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
              Call (555) 123-4567
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-brand-600 transition-colors">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StateDetail;
