
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Truck, Home, Recycle, Building, Sofa, Trash, Phone, CheckCircle, Clock, DollarSign, Shield } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: <Truck className="w-12 h-12" />,
      title: "Residential Junk Removal",
      description: "Complete household junk removal including furniture, appliances, and debris",
      gradient: "from-electric-500 to-electric-600",
      slug: "residential-junk-removal",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=500&auto=format&fit=crop",
      features: ["Same-day service", "Furniture removal", "Appliance disposal", "Eco-friendly"],
      pricing: "Starting at $75"
    },
    {
      icon: <Building className="w-12 h-12" />,
      title: "Commercial Cleanouts",
      description: "Office cleanouts, retail space clearing, and commercial waste removal",
      gradient: "from-lime-500 to-lime-600",
      slug: "commercial-cleanouts",
      image: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?q=80&w=500&auto=format&fit=crop",
      features: ["Office furniture", "Retail equipment", "After-hours service", "Licensed hauling"],
      pricing: "Starting at $125"
    },
    {
      icon: <Home className="w-12 h-12" />,
      title: "Estate Cleanouts",
      description: "Compassionate estate and foreclosure cleanout services",
      gradient: "from-brand-500 to-brand-600",
      slug: "estate-cleanouts",
      image: "https://images.unsplash.com/photo-1465379944081-7f47de8d74ac?q=80&w=500&auto=format&fit=crop",
      features: ["Sensitive handling", "Donation coordination", "Full property", "Quick turnaround"],
      pricing: "Custom quotes"
    },
    {
      icon: <Sofa className="w-12 h-12" />,
      title: "Furniture Removal",
      description: "Safe removal and disposal of old furniture and appliances",
      gradient: "from-electric-600 to-brand-500",
      slug: "furniture-removal",
      image: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?q=80&w=500&auto=format&fit=crop",
      features: ["Heavy lifting", "Safe removal", "Recycling options", "No damage"],
      pricing: "Starting at $50"
    },
    {
      icon: <Recycle className="w-12 h-12" />,
      title: "Construction Debris",
      description: "Construction waste removal and renovation cleanup services",
      gradient: "from-brand-600 to-electric-500",
      slug: "construction-debris",
      image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=500&auto=format&fit=crop",
      features: ["Drywall removal", "Lumber disposal", "Contractor rates", "Scheduled pickup"],
      pricing: "Starting at $100"
    },
    {
      icon: <Trash className="w-12 h-12" />,
      title: "Yard Waste Removal",
      description: "Tree limbs, leaves, brush, and landscaping debris hauling",
      gradient: "from-lime-600 to-brand-500",
      slug: "yard-waste-removal",
      image: "https://images.unsplash.com/photo-1433832597046-4f10e10ac764?q=80&w=500&auto=format&fit=crop",
      features: ["Tree branches", "Leaf cleanup", "Storm debris", "Composting"],
      pricing: "Starting at $60"
    }
  ];

  const benefits = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Same-Day Service",
      description: "Need it gone today? We offer same-day pickup for urgent needs."
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Transparent Pricing",
      description: "Upfront quotes with no hidden fees or surprise charges."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Licensed & Insured",
      description: "Fully licensed and insured for your complete peace of mind."
    },
    {
      icon: <Recycle className="w-8 h-8" />,
      title: "Eco-Friendly",
      description: "We recycle and donate items whenever possible."
    }
  ];

  const handleServiceClick = (slug: string) => {
    window.open(`/services/${slug}`, '_blank');
  };

  return (
    <div className="min-h-screen font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            Our Junk Removal Services
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            Professional junk removal and hauling services you can trust. From single items to complete cleanouts, 
            we handle all your junk removal needs with same-day service available.
          </p>
          <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-black px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
            <Phone className="w-5 h-5 mr-2" />
            Call Now: (555) 123-4567
          </button>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-2 cursor-pointer"
                onClick={() => handleServiceClick(service.slug)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className={`bg-gradient-to-br ${service.gradient} rounded-full w-16 h-16 flex items-center justify-center m-4 text-white shadow-xl`}>
                      {service.icon}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-lime-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    {service.pricing}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{service.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">What's Included:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="flex items-center justify-center w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-6 py-3 rounded-full font-bold text-lg transition-all duration-300 transform group-hover:scale-105 shadow-lg">
                    <Phone className="w-5 h-5 mr-2" />
                    Call Now: (555) 123-4567
                  </button>
                </div>
                <div className={`h-1 bg-gradient-to-r ${service.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Our Services */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              Why Choose Our Services?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We're not just another junk removal company. Here's what sets us apart from the competition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-4 p-8 border border-gray-100">
                <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 text-white shadow-xl">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Our simple 3-step process makes junk removal easy and stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center relative">
              <div className="bg-gradient-to-br from-electric-500 to-electric-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-white shadow-xl text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Call Us</h3>
              <p className="text-gray-600 leading-relaxed">
                Give us a call and describe what needs to be removed. We'll provide an upfront estimate over the phone.
              </p>
            </div>

            <div className="text-center relative">
              <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-black shadow-xl text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">We Come to You</h3>
              <p className="text-gray-600 leading-relaxed">
                Schedule a convenient time for pickup. Our team arrives on time and ready to work, often same-day.
              </p>
            </div>

            <div className="text-center relative">
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-white shadow-xl text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">We Haul It Away</h3>
              <p className="text-gray-600 leading-relaxed">
                We safely remove your junk and clean up the area. Items are recycled or donated whenever possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            Transparent Pricing
          </h2>
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-center mb-6">
              <DollarSign className="w-12 h-12 text-lime-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Hidden Fees, Ever</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We provide upfront pricing based on volume, not weight. You'll know the cost before we start.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-lime-500 mb-2">1/4 Truck</div>
                <div className="text-gray-600">Starting at $125</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-electric-500 mb-2">1/2 Truck</div>
                <div className="text-gray-600">Starting at $225</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-brand-500 mb-2">Full Truck</div>
                <div className="text-gray-600">Starting at $375</div>
              </div>
            </div>
            <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
              <Phone className="w-5 h-5 mr-2" />
              Call for Free Estimate: (555) 123-4567
            </button>
          </div>
        </div>
      </section>

      {/* Emergency Service Banner */}
      <section className="py-16 bg-gradient-to-r from-red-500 to-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-12 h-12 text-white mr-4" />
            <h2 className="text-3xl font-bold text-white">Same-Day Service Available</h2>
          </div>
          <p className="text-red-100 mb-6 text-lg">
            Emergency cleanout? Property closing? We're here to help with urgent junk removal needs.
          </p>
          <button className="bg-white hover:bg-gray-100 text-red-600 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
            <Phone className="w-5 h-5 mr-2" />
            Emergency Call: (555) 123-4567
          </button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-electric-500 to-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Clear Out Your Space?
          </h2>
          <p className="text-xl text-electric-100 mb-8 leading-relaxed">
            Don't let junk pile up any longer. Choose the service you need and get started today!
          </p>
          <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-12 py-4 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6 mr-2" />
            Call Now: (555) 123-4567
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
