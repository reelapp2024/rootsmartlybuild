
import React from 'react';
import { Truck, Home, Recycle, Building, Sofa, Trash, Phone } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: <Truck className="w-10 h-10" />,
      title: "Residential Junk Removal",
      description: "Complete household junk removal including furniture, appliances, and debris",
      gradient: "from-electric-500 to-electric-600",
      slug: "residential-junk-removal",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=500&auto=format&fit=crop"
    },
    {
      icon: <Building className="w-10 h-10" />,
      title: "Commercial Cleanouts",
      description: "Office cleanouts, retail space clearing, and commercial waste removal",
      gradient: "from-lime-500 to-lime-600",
      slug: "commercial-cleanouts",
      image: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?q=80&w=500&auto=format&fit=crop"
    },
    {
      icon: <Home className="w-10 h-10" />,
      title: "Estate Cleanouts",
      description: "Compassionate estate and foreclosure cleanout services",
      gradient: "from-brand-500 to-brand-600",
      slug: "estate-cleanouts",
      image: "https://images.unsplash.com/photo-1465379944081-7f47de8d74ac?q=80&w=500&auto=format&fit=crop"
    },
    {
      icon: <Sofa className="w-10 h-10" />,
      title: "Furniture Removal",
      description: "Safe removal and disposal of old furniture and appliances",
      gradient: "from-electric-600 to-brand-500",
      slug: "furniture-removal",
      image: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?q=80&w=500&auto=format&fit=crop"
    },
    {
      icon: <Recycle className="w-10 h-10" />,
      title: "Construction Debris",
      description: "Construction waste removal and renovation cleanup services",
      gradient: "from-brand-600 to-electric-500",
      slug: "construction-debris",
      image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=500&auto=format&fit=crop"
    },
    {
      icon: <Trash className="w-10 h-10" />,
      title: "Yard Waste Removal",
      description: "Tree limbs, leaves, brush, and landscaping debris hauling",
      gradient: "from-lime-600 to-brand-500",
      slug: "yard-waste-removal",
      image: "https://images.unsplash.com/photo-1433832597046-4f10e10ac764?q=80&w=500&auto=format&fit=crop"
    }
  ];

  const handleServiceClick = (slug: string) => {
    window.open(`/services/${slug}`, '_blank');
  };

  return (
    <section id="services" className="py-20 bg-white font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            Our Junk Removal Services
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Professional junk removal and hauling services you can trust. From single items to complete cleanouts, 
            we handle all your junk removal needs with same-day service available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-2 cursor-pointer h-full flex flex-col"
              onClick={() => handleServiceClick(service.slug)}
            >
              <div className="relative h-48 overflow-hidden flex-shrink-0">
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
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex-shrink-0">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6 flex-grow">{service.description}</p>
                <button className="flex items-center justify-center w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-6 py-3 rounded-full font-bold text-lg transition-all duration-300 transform group-hover:scale-105 shadow-lg flex-shrink-0">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now: (555) 123-4567
                </button>
              </div>
              <div className={`h-1 bg-gradient-to-r ${service.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 max-w-3xl mx-auto shadow-xl border border-gray-200">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-4">
              Need Something Removed Today?
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              No job too big or small! We remove everything from single items to complete property cleanouts.
            </p>
            <button className="flex items-center justify-center bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-black px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Phone className="w-5 h-5 mr-2" />
              Call Now: (555) 123-4567
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
