
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Phone, MapPin, Clock, Mail, MessageCircle, Truck, CheckCircle } from 'lucide-react';

const Contact = () => {
  const contactMethods = [
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Call Us Now",
      info: "(555) 123-4567",
      description: "Talk to our team directly for immediate assistance",
      gradient: "from-lime-500 to-lime-600",
      action: "Call Now"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Text Message",
      info: "(555) 123-4567",
      description: "Send us a text for quick questions or estimates",
      gradient: "from-electric-500 to-electric-600",
      action: "Text Us"
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Email Us",
      info: "info@junkprohauling.com",
      description: "Send detailed information about your project",
      gradient: "from-brand-500 to-brand-600",
      action: "Email Us"
    }
  ];

  const serviceHours = [
    { day: "Monday - Friday", hours: "7:00 AM - 7:00 PM" },
    { day: "Saturday", hours: "8:00 AM - 6:00 PM" },
    { day: "Sunday", hours: "9:00 AM - 5:00 PM" },
    { day: "Emergency Service", hours: "24/7 Available" }
  ];

  const serviceAreas = [
    "Downtown District",
    "Midtown Area",
    "North Suburbs",
    "South Suburbs",
    "East Valley",
    "West End",
    "Industrial Zone",
    "Surrounding Cities"
  ];

  return (
    <div className="min-h-screen font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              Contact JunkPro Hauling
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Ready to get rid of your junk? Contact us today for fast, reliable, and affordable junk removal services. 
              Same-day pickup available!
            </p>
            <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-black px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
              <Phone className="w-5 h-5 mr-2" />
              Call Now: (555) 123-4567
            </button>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-4 p-8 border border-gray-100 text-center">
                <div className={`bg-gradient-to-br ${method.gradient} rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 text-white shadow-xl`}>
                  {method.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{method.title}</h3>
                <p className="text-xl font-semibold text-gray-700 mb-3">{method.info}</p>
                <p className="text-gray-600 leading-relaxed mb-6">{method.description}</p>
                <button className={`bg-gradient-to-r ${method.gradient} hover:shadow-lg text-white px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105`}>
                  {method.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Hours & Areas */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Service Hours */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <Clock className="w-12 h-12 text-brand-500 mr-4" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent">
                  Service Hours
                </h2>
              </div>
              <div className="space-y-4">
                {serviceHours.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                    <span className="font-semibold text-gray-900">{schedule.day}</span>
                    <span className="text-gray-600">{schedule.hours}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center mb-2">
                  <Truck className="w-5 h-5 text-red-500 mr-2" />
                  <span className="font-bold text-red-700">Emergency Service</span>
                </div>
                <p className="text-red-600 text-sm">
                  Need urgent junk removal? We offer 24/7 emergency service for critical situations.
                </p>
              </div>
            </div>

            {/* Service Areas */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <MapPin className="w-12 h-12 text-electric-500 mr-4" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent">
                  Service Areas
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                We proudly serve the greater metropolitan area and surrounding communities:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {serviceAreas.map((area, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{area}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-green-700 text-sm">
                  <strong>Don't see your area?</strong> Give us a call! We may still be able to serve your location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Response Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            Get a Quick Response
          </h2>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            We understand that junk removal is often time-sensitive. That's why we prioritize quick responses and same-day service.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-white shadow-xl">
                <span className="font-bold text-lg">5</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Minutes</h3>
              <p className="text-gray-600">Average phone response time</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-electric-500 to-electric-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-white shadow-xl">
                <span className="font-bold text-lg">30</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Minutes</h3>
              <p className="text-gray-600">Free estimate provided</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-white shadow-xl">
                <span className="font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hours</h3>
              <p className="text-gray-600">Same-day pickup available</p>
            </div>
          </div>

          <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-12 py-4 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6 mr-2" />
            Call Now: (555) 123-4567
          </button>
        </div>
      </section>

      {/* Location & Directions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
              Our Location
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Locally owned and operated, serving the community with pride for over 10 years.
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">JunkPro Hauling</h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-brand-500 mr-3" />
                    <span>123 Industrial Way, Your City, ST 12345</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-electric-500 mr-3" />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-lime-500 mr-3" />
                    <span>info@junkprohauling.com</span>
                  </div>
                </div>
                <div className="mt-6">
                  <button className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Get Directions
                  </button>
                </div>
              </div>
              <div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>Interactive Map</p>
                  <p className="text-sm">Call for exact location details</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Quick Contact */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-600 to-electric-600 bg-clip-text text-transparent mb-6">
            Have Questions?
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Don't wait! Get your questions answered and your junk removed today. Our friendly team is standing by to help.
          </p>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h3 className="font-bold text-gray-900 mb-2">Common Questions:</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• What items can you remove?</li>
                  <li>• How much does it cost?</li>
                  <li>• Do you offer same-day service?</li>
                  <li>• Are you licensed and insured?</li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 mb-2">Quick Facts:</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Free estimates over the phone</li>
                  <li>• No hidden fees or charges</li>
                  <li>• We recycle and donate items</li>
                  <li>• 100% satisfaction guarantee</li>
                </ul>
              </div>
            </div>
            
            <button className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-black px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto">
              <Phone className="w-5 h-5 mr-2" />
              Call Now: (555) 123-4567
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-electric-500 to-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Don't Let Junk Take Over Your Space
          </h2>
          <p className="text-xl text-electric-100 mb-8 leading-relaxed">
            Contact JunkPro Hauling today and reclaim your space. Professional, reliable, and affordable junk removal is just a phone call away.
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

export default Contact;
