
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MapPin, Phone, Clock, CheckCircle, Users, Star } from 'lucide-react';

const CityDetail = () => {
  const { slug } = useParams();

  // Mock data - in real app this would come from API
  const cityData = {
    'metro-city': {
      name: 'Metro City',
      state: 'California',
      description: 'Premier junk removal services in Metro City downtown and surrounding areas',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&auto=format&fit=crop',
      population: '1.2M',
      neighborhoods: ['Downtown', 'Midtown', 'Riverside District', 'Oak Hills', 'Tech Quarter'],
      services: [
        'Residential Junk Removal',
        'Office Cleanouts',
        'Construction Debris',
        'Appliance Removal',
        'Furniture Disposal',
        'Estate Cleanouts'
      ],
      features: [
        '24/7 Emergency Service',
        'Commercial Buildings',
        'High-Rise Apartments',
        'Same-Day Service',
        'Licensed & Insured',
        'Eco-Friendly Disposal'
      ]
    },
    'riverside-city': {
      name: 'Riverside City',
      state: 'California',
      description: 'Professional junk hauling services for Riverside residents and businesses',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop',
      population: '850K',
      neighborhoods: ['Old Town', 'Riverside Heights', 'Garden District', 'University Area', 'Waterfront'],
      services: [
        'Home Cleanouts',
        'Garage Cleaning',
        'Yard Waste Removal',
        'Hot Tub Removal',
        'Shed Demolition',
        'Moving Cleanouts'
      ],
      features: [
        'Residential Focus',
        'Same-Day Service',
        'Eco-Friendly Disposal',
        'Family Owned',
        'Affordable Rates',
        'Free Estimates'
      ]
    },
    'westfield-city': {
      name: 'Westfield City',
      state: 'Texas',
      description: 'Comprehensive junk removal for Westfield communities and businesses',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      population: '650K',
      neighborhoods: ['City Center', 'Westfield Hills', 'Industrial District', 'Suburban Heights', 'Lakeside'],
      services: [
        'Commercial Cleanouts',
        'Retail Store Cleanup',
        'Warehouse Clearing',
        'Restaurant Equipment',
        'Medical Facility Cleanup',
        'School Cleanouts'
      ],
      features: [
        'Furniture Removal',
        'Construction Debris',
        'Business Cleanouts',
        'Large Item Pickup',
        'Scheduled Service',
        'Volume Discounts'
      ]
    }
  };

  const city = cityData[slug as keyof typeof cityData];

  if (!city) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">City Not Found</h1>
          <p className="text-xl text-gray-600">The city you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-to-br from-brand-500 to-electric-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${city.image})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/80 to-electric-600/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            {city.name} Junk Removal
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            {city.description}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg">
            <div className="flex items-center">
              <MapPin className="mr-2" size={20} />
              {city.state}
            </div>
            <div className="flex items-center">
              <Users className="mr-2" size={20} />
              {city.population} Population
            </div>
            <div className="flex items-center">
              <Star className="mr-2" size={20} />
              5-Star Service
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Our Services in {city.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {city.services.map((service, index) => (
              <div key={index} className="bg-gradient-to-br from-electric-50 to-electric-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <CheckCircle className="text-electric-500 mb-4" size={24} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service}</h3>
                <p className="text-gray-600">Professional {service.toLowerCase()} service in {city.name}.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Neighborhoods We Serve in {city.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {city.neighborhoods.map((neighborhood, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <MapPin className="text-brand-500 mx-auto mb-3" size={24} />
                <h3 className="text-lg font-bold text-gray-900">{neighborhood}</h3>
                <p className="text-gray-600 text-sm">Same-day service available</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose Us in {city.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {city.features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-brand-500 to-electric-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature}</h3>
                <p className="text-gray-600">Reliable service throughout {city.name}.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-500 to-electric-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Need Junk Removal in {city.name}?</h2>
          <p className="text-xl mb-8">Fast, reliable service with upfront pricing</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-brand-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
              Call (555) 123-4567
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-brand-600 transition-colors">
              Schedule Pickup
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CityDetail;
