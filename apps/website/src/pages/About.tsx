import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Users, Award, Clock, Shield, Truck, Recycle, Heart, MapPin, Phone, Star, CheckCircle } from 'lucide-react';

const About = () => {
  const stats = [
    { number: "10+", label: "Years Experience" },
    { number: "5000+", label: "Jobs Completed" },
    { number: "500+", label: "Happy Customers" },
    { number: "24/7", label: "Available Service" }
  ];

  const values = [
    {
      icon: <Heart className="w-12 h-12" />,
      title: "Community Focused",
      description: "We're locally owned and committed to serving our community with integrity and care."
    },
    {
      icon: <Recycle className="w-12 h-12" />,
      title: "Eco-Friendly",
      description: "We prioritize recycling and donating items whenever possible to reduce landfill waste."
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Reliable Service",
      description: "Licensed, insured, and committed to showing up on time, every time."
    },
    {
      icon: <Award className="w-12 h-12" />,
      title: "Quality Guarantee",
      description: "We stand behind our work with a 100% satisfaction guarantee on every job."
    }
  ];

  const team = [
    {
      name: "Mike Rodriguez",
      role: "Founder & CEO",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
      description: "With 15+ years in the hauling industry, Mike founded JunkPro to provide honest, reliable service."
    },
    {
      name: "Sarah Chen",
      role: "Operations Manager",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400&auto=format&fit=crop",
      description: "Sarah ensures every job runs smoothly and customers receive exceptional service."
    },
    {
      name: "David Thompson",
      role: "Lead Hauler",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
      description: "David leads our hauling team with expertise in safe, efficient junk removal."
    }
  ];

  const guarantees = [
    {
      title: "100% Satisfaction Guarantee",
      description: "If you're not completely satisfied with our service, we'll make it right or refund your money."
    },
    {
      title: "On-Time Promise",
      description: "We arrive when we say we will. If we're late, your service is discounted."
    },
    {
      title: "No Hidden Fees",
      description: "The price we quote is the price you pay. No surprises, no unexpected charges."
    },
    {
      title: "Licensed & Insured",
      description: "Fully licensed and insured for your complete peace of mind and protection."
    }
  ];

  return (
    <div className="min-h-screen font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              About JunkPro Hauling
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Your trusted local junk removal experts, committed to providing exceptional service 
              while caring for our community and environment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-400 to-electric-400 rounded-2xl blur opacity-75"></div>
              <img
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80"
                alt="JunkPro team at work"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
            
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
                Our Story
              </h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Founded in 2013, JunkPro Hauling started as a small family business with a simple mission: 
                provide honest, reliable junk removal services to our local community. What began with just 
                one truck and a commitment to excellence has grown into the area's most trusted hauling service.
              </p>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                We've built our reputation on three core principles: showing up on time, providing fair pricing, 
                and treating every customer's property with respect. Whether it's a single item pickup or a complete 
                estate cleanout, we approach every job with the same level of professionalism and care.
              </p>
              <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Call Now: (555) 123-4567
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-white rounded-2xl shadow-lg p-8 transform hover:-translate-y-2 transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              These core values guide everything we do and shape how we serve our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-electric-500 to-electric-600 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-6 text-white shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Guarantee Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              Our Guarantee to You
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We stand behind our work with unmatched guarantees that give you complete confidence in our service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100">
                <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 text-white shadow-xl">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{guarantee.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{guarantee.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
              <Phone className="w-5 h-5 mr-2" />
              Experience Our Guarantee: (555) 123-4567
            </button>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              The dedicated professionals who make JunkPro Hauling the best choice for your junk removal needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-4 overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-brand-600 font-semibold mb-4">{member.role}</p>
                  <p className="text-gray-600 leading-relaxed">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              Why Choose JunkPro?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-full w-12 h-12 flex items-center justify-center text-white flex-shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Local & Family Owned</h3>
                    <p className="text-gray-600">We're your neighbors, invested in keeping our community clean and beautiful.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-full w-12 h-12 flex items-center justify-center text-white flex-shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Same-Day Service</h3>
                    <p className="text-gray-600">Need it gone today? We offer same-day pickup for urgent junk removal needs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-electric-500 to-electric-600 rounded-full w-12 h-12 flex items-center justify-center text-white flex-shrink-0">
                    <Recycle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Eco-Friendly Disposal</h3>
                    <p className="text-gray-600">We recycle and donate whenever possible, keeping items out of landfills.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-lime-600 to-brand-500 rounded-full w-12 h-12 flex items-center justify-center text-white flex-shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Fully Licensed & Insured</h3>
                    <p className="text-gray-600">Complete peace of mind with full licensing and comprehensive insurance coverage.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=800&auto=format&fit=crop"
                alt="Professional junk removal service"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center mb-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <p className="text-sm font-bold text-gray-900">5-Star Rated Service</p>
                <p className="text-xs text-gray-600">500+ Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            We Serve Your Area
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Proudly serving the greater metropolitan area with reliable junk removal services.
          </p>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-12 h-12 text-brand-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Service Areas Include:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-600">
              <div>Downtown</div>
              <div>Midtown</div>
              <div>Suburbs North</div>
              <div>Suburbs South</div>
              <div>East District</div>
              <div>West End</div>
              <div>Industrial Area</div>
              <div>Surrounding Cities</div>
            </div>
            <div className="mt-8">
              <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
                <Phone className="w-5 h-5 mr-2" />
                Call Now: (555) 123-4567
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-electric-500 to-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Experience the JunkPro Difference?
          </h2>
          <p className="text-xl text-electric-100 mb-8 leading-relaxed">
            Join hundreds of satisfied customers who trust us with their junk removal needs.
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

export default About;
