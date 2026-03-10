import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Truck, Home, Recycle, Building, Sofa, Trash, CheckCircle, Star, Phone, Clock, Award, Users, MapPin, DollarSign, Shield, Headphones, ThumbsUp } from 'lucide-react';

const ServiceDetail = () => {
  const { slug } = useParams();

  const serviceData: { [key: string]: any } = {
    'residential-junk-removal': {
      icon: <Truck className="w-16 h-16" />,
      title: "Residential Junk Removal",
      description: "Complete household junk removal including furniture, appliances, and debris with same-day service available.",
      gradient: "from-electric-500 to-electric-600",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      beforeAfter: [
        {
          before: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          after: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          description: "Living Room Cleanout"
        },
        {
          before: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          after: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          description: "Garage Cleanout"
        }
      ],
      features: [
        "Furniture and appliance removal",
        "Household clutter cleanup",
        "Basement and attic cleanouts",
        "Same-day service available",
        "Eco-friendly disposal",
        "No hidden fees"
      ]
    },
    'commercial-cleanouts': {
      icon: <Building className="w-16 h-16" />,
      title: "Commercial Cleanouts",
      description: "Professional office cleanouts, retail space clearing, and commercial waste removal services.",
      gradient: "from-lime-500 to-lime-600",
      image: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      beforeAfter: [
        {
          before: "https://images.unsplash.com/photo-1558002038-bb4237b54e5c?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          after: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          description: "Office Space Cleanout"
        }
      ],
      features: [
        "Office furniture removal",
        "Retail equipment disposal",
        "Document shredding services",
        "After-hours service available",
        "Licensed commercial hauling",
        "Free estimates"
      ]
    },
    'estate-cleanouts': {
      icon: <Home className="w-16 h-16" />,
      title: "Estate Cleanouts",
      description: "Compassionate estate and foreclosure cleanout services with respectful handling of belongings.",
      gradient: "from-brand-500 to-brand-600",
      image: "https://images.unsplash.com/photo-1465379944081-7f47de8d74ac?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      beforeAfter: [
        {
          before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          after: "https://images.unsplash.com/photo-1465379944081-7f47de8d74ac?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          description: "Complete Estate Cleanout"
        }
      ],
      features: [
        "Sensitive estate handling",
        "Donation coordination",
        "Full property cleanouts",
        "Foreclosure cleanup",
        "Respectful service",
        "Quick turnaround"
      ]
    },
    'furniture-removal': {
      icon: <Sofa className="w-16 h-16" />,
      title: "Furniture Removal",
      description: "Safe removal and disposal of old furniture and appliances with eco-friendly recycling options.",
      gradient: "from-electric-600 to-brand-500",
      image: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      beforeAfter: [
        {
          before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          after: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          description: "Old Furniture Removal"
        }
      ],
      features: [
        "Heavy furniture removal",
        "Appliance disposal",
        "Mattress and box spring removal",
        "Recycling coordination",
        "Safe lifting techniques",
        "Damage-free removal"
      ]
    },
    'construction-debris': {
      icon: <Recycle className="w-16 h-16" />,
      title: "Construction Debris",
      description: "Construction waste removal and renovation cleanup services for contractors and homeowners.",
      gradient: "from-brand-600 to-electric-500",
      image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      beforeAfter: [
        {
          before: "https://images.unsplash.com/photo-1558002038-bb4237b54e5c?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          after: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          description: "Construction Cleanup"
        }
      ],
      features: [
        "Drywall and lumber removal",
        "Concrete and brick disposal",
        "Roofing material cleanup",
        "Contractor partnerships",
        "Proper waste sorting",
        "Timely pickup schedules"
      ]
    },
    'yard-waste-removal': {
      icon: <Trash className="w-16 h-16" />,
      title: "Yard Waste Removal",
      description: "Tree limbs, leaves, brush, and landscaping debris hauling with eco-friendly disposal methods.",
      gradient: "from-lime-600 to-brand-500",
      image: "https://images.unsplash.com/photo-1433832597046-4f10e10ac764?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      beforeAfter: [
        {
          before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          after: "https://images.unsplash.com/photo-1433832597046-4f10e10ac764?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
          description: "Yard Cleanup"
        }
      ],
      features: [
        "Tree branch removal",
        "Leaf and brush cleanup",
        "Storm debris clearing",
        "Landscaping waste disposal",
        "Composting services",
        "Seasonal cleanup"
      ]
    }
  };

  const service = serviceData[slug || ''];

  const guarantees = [
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "100% Satisfaction",
      description: "We guarantee your complete satisfaction or we'll make it right."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "On-Time Service",
      description: "We arrive when promised or your service is discounted."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Fully Insured",
      description: "Complete insurance coverage for your peace of mind."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Quality Work",
      description: "Professional service that exceeds industry standards."
    }
  ];

  const customerSupport = [
    {
      icon: <Phone className="w-12 h-12" />,
      title: "24/7 Support",
      description: "Call us anytime for emergency service or questions"
    },
    {
      icon: <Headphones className="w-12 h-12" />,
      title: "Friendly Staff",
      description: "Our team is always ready to help with a smile"
    },
    {
      icon: <ThumbsUp className="w-12 h-12" />,
      title: "Follow-Up Service",
      description: "We check back to ensure you're completely satisfied"
    }
  ];

  if (!service) {
    return (
      <div className="min-h-screen font-poppins">
        <Header />
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <p className="text-gray-600 mb-8">The service you're looking for doesn't exist.</p>
          <a 
            href="/"
            className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Return Home
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`bg-gradient-to-br ${service.gradient} rounded-3xl w-24 h-24 flex items-center justify-center mb-6 text-white shadow-2xl`}>
                {service.icon}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
                {service.title}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                {service.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="tel:5551234567" className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now: (555) 123-4567
                </a>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>Same-day service available</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={service.image} 
                alt={service.title}
                className="w-full h-80 object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-900">500+ Happy Customers</p>
                <p className="text-xs text-gray-600">Trusted Local Service</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`bg-gradient-to-br ${service.gradient} rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-3 text-white shadow-xl`}>
                <Award className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Licensed Haulers</h3>
              <p className="text-xs text-gray-600">Fully certified</p>
            </div>
            <div className="text-center">
              <div className={`bg-gradient-to-br ${service.gradient} rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-3 text-white shadow-xl`}>
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Same-Day Service</h3>
              <p className="text-xs text-gray-600">7 days a week</p>
            </div>
            <div className="text-center">
              <div className={`bg-gradient-to-br ${service.gradient} rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-3 text-white shadow-xl`}>
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">500+ Customers</h3>
              <p className="text-xs text-gray-600">Local community</p>
            </div>
            <div className="text-center">
              <div className={`bg-gradient-to-br ${service.gradient} rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-3 text-white shadow-xl`}>
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Local Business</h3>
              <p className="text-xs text-gray-600">Your neighborhood</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Features */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-4">
              What We Include
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.features.map((feature: string, index: number) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div className={`bg-gradient-to-br ${service.gradient} rounded-xl w-12 h-12 flex items-center justify-center mb-4 text-white shadow-lg`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-gray-900 font-semibold">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Guarantee Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-4">
              Our Service Guarantee
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We stand behind every job with unmatched guarantees for your complete peace of mind.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 text-center">
                <div className={`bg-gradient-to-br ${service.gradient} rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                  {guarantee.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{guarantee.title}</h3>
                <p className="text-gray-600 text-sm">{guarantee.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before & After Gallery */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-4">
              Before & After Results
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See the amazing transformations we've delivered for our satisfied customers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {service.beforeAfter.map((project: any, index: number) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img src={project.before} alt="Before" className="w-full h-40 object-cover" />
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      Before
                    </div>
                  </div>
                  <div className="relative">
                    <img src={project.after} alt="After" className="w-full h-40 object-cover" />
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      After
                    </div>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{project.description}</h3>
                  <a href="tel:5551234567" className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now: (555) 123-4567
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Support Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-4">
              Exceptional Customer Support
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our commitment to you doesn't end when the job is done. We're here to support you every step of the way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {customerSupport.map((support, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className={`bg-gradient-to-br ${service.gradient} rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 text-white shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
                  {support.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{support.title}</h3>
                <p className="text-gray-600 leading-relaxed">{support.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="tel:5551234567" className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto max-w-sm">
              <Phone className="w-5 h-5 mr-2" />
              Call Now: (555) 123-4567
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            Transparent Pricing
          </h2>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <DollarSign className="w-12 h-12 text-lime-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Hidden Fees</h3>
            <p className="text-gray-600 mb-6">
              Get upfront pricing with detailed estimates. We believe in transparent costs with no surprise charges.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-lime-500">Free</div>
                <div className="text-sm text-gray-600">Estimates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-electric-500">No</div>
                <div className="text-sm text-gray-600">Hidden Fees</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-500">Same</div>
                <div className="text-sm text-gray-600">Day Service</div>
              </div>
            </div>
            <a href="tel:5551234567" className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto max-w-sm">
              <Phone className="w-5 h-5 mr-2" />
              Call Now: (555) 123-4567
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-electric-500 to-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Clear Out Your Space?
          </h2>
          <p className="text-xl text-electric-100 mb-8">
            Don't let junk pile up any longer. Contact us now for professional {service.title.toLowerCase()}!
          </p>
          <a href="tel:5551234567" className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-10 py-4 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto max-w-sm">
            <Phone className="w-5 h-5 mr-2" />
            Call Now: (555) 123-4567
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
