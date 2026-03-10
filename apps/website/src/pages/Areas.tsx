
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MapPin, Phone, Clock, CheckCircle } from 'lucide-react';

const Areas = () => {
  const areas = [
    {
      name: 'Downtown Metro',
      slug: 'downtown-metro',
      description: 'Professional junk removal services in the heart of the city',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=500&auto=format&fit=crop',
      features: ['Same-Day Service', '24/7 Emergency Calls', 'Commercial Focus']
    },
    {
      name: 'North Hills',
      slug: 'north-hills',
      description: 'Residential and estate cleanout services in North Hills area',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=500&auto=format&fit=crop',
      features: ['Residential Specialists', 'Estate Cleanouts', 'Senior Discounts']
    },
    {
      name: 'Westside District',
      slug: 'westside-district',
      description: 'Complete junk removal and hauling services for Westside residents',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop',
      features: ['Furniture Removal', 'Appliance Pickup', 'Eco-Friendly Disposal']
    },
    {
      name: 'East Valley',
      slug: 'east-valley',
      description: 'Construction debris and commercial cleanout services',
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=500&auto=format&fit=crop',
      features: ['Construction Debris', 'Large Item Removal', 'Business Cleanouts']
    },
    {
      name: 'South Bay Area',
      slug: 'south-bay-area',
      description: 'Comprehensive junk removal services for South Bay communities',
      image: 'https://images.unsplash.com/photo-1515263487990-61b07816b924?q=80&w=500&auto=format&fit=crop',
      features: ['Yard Waste Removal', 'Home Cleanouts', 'Moving Assistance']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-500 to-electric-600 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6">
            Areas We Serve
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto">
            Professional junk removal services across the metro area. Same-day service available in all locations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="tel:5551234567" className="bg-lime-500 hover:bg-lime-600 text-black px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg transition-all duration-300 transform hover:scale-105">
              <Phone className="inline mr-2" size={20} />
              Call Now: (555) 123-4567
            </a>
            <div className="flex items-center text-lime-200">
              <Clock className="mr-2" size={20} />
              <span className="text-sm md:text-base">Available 7 Days a Week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Grid */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
              Our Service Areas
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              We proudly serve communities throughout the metro area with fast, reliable junk removal services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {areas.map((area, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="relative h-48 md:h-56 overflow-hidden">
                  <img 
                    src={area.image} 
                    alt={area.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-brand-500 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                      <MapPin className="text-white" size={20} />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:p-6">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">{area.name}</h3>
                  <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">{area.description}</p>
                  
                  <div className="space-y-2 mb-4 md:mb-6">
                    {area.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-xs md:text-sm text-gray-700">
                        <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={14} />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <a 
                    href={`/areas/${area.slug}`} 
                    className="block w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-center transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                  >
                    View Area Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
              Our Coverage Map
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              See all the areas we serve with our professional junk removal services
            </p>
          </div>
          
          <div className="bg-gray-200 rounded-2xl h-64 md:h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto mb-4 text-brand-500" size={48} />
              <p className="text-gray-600 text-base md:text-lg">Interactive coverage map coming soon</p>
              <p className="text-gray-500 text-sm md:text-base">Call us to confirm service in your area</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-brand-600 to-electric-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            Ready to Schedule Your Junk Removal?
          </h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            Don't see your area listed? Call us! We're expanding our service areas and may be able to help.
          </p>
          <a href="tel:5551234567" className="bg-lime-500 hover:bg-lime-600 text-black px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
            <Phone className="inline mr-2" size={20} />
            Call Now: (555) 123-4567
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Areas;
