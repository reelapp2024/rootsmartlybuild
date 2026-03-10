
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Phone, MapPin, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TreeHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const services = [
    { name: 'Tree Removal', slug: 'tree-removal' },
    { name: 'Tree Trimming', slug: 'tree-trimming' },
    { name: 'Stump Grinding', slug: 'stump-grinding' },
    { name: 'Emergency Tree Service', slug: 'emergency-tree-service' },
    { name: 'Tree Health Assessment', slug: 'tree-health-assessment' }
  ];

  const areas = [
    { name: 'Downtown District', slug: 'downtown-district' },
    { name: 'Greenwood Heights', slug: 'greenwood-heights' },
    { name: 'Oak Valley', slug: 'oak-valley' },
    { name: 'Pine Ridge', slug: 'pine-ridge' },
    { name: 'Maple Grove', slug: 'maple-grove' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 font-poppins">
      {/* Top bar with contact info */}
      <div className="bg-gradient-to-r from-forest-500 to-forest-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Phone size={14} className="mr-2" />
                <a href="tel:5551234567" className="font-medium hover:text-nature-200 transition-colors">(555) 123-4567</a>
              </div>
              <div className="hidden sm:flex items-center">
                <MapPin size={14} className="mr-2" />
                <span>24/7 Emergency Tree Service</span>
              </div>
            </div>
            <div className="hidden md:block">
              <span className="font-semibold">Licensed • Insured • Certified Arborists</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button onClick={() => handleNavigation('/')} className="text-xl md:text-2xl font-bold bg-gradient-to-r from-forest-500 to-nature-600 bg-clip-text text-transparent">
              TreeCare Pro
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            <button onClick={() => handleNavigation('/')} className="text-gray-700 hover:text-forest-600 transition-all duration-300 font-medium relative group">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-forest-500 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => handleNavigation('/about')} className="text-gray-700 hover:text-forest-600 transition-all duration-300 font-medium relative group">
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-forest-500 transition-all duration-300 group-hover:w-full"></span>
            </button>
            
            {/* Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-gray-700 hover:text-forest-600 transition-all duration-300 font-medium relative group outline-none">
                Services
                <ChevronDown size={16} className="ml-1" />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-forest-500 transition-all duration-300 group-hover:w-full"></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg z-50 min-w-[250px] p-2 font-poppins">
                {services.map((service) => (
                  <DropdownMenuItem key={service.slug} className="p-0">
                    <button 
                      onClick={() => handleNavigation(`/services/${service.slug}`)}
                      className="w-full px-4 py-3 text-gray-700 hover:text-forest-600 hover:bg-forest-50 rounded-md transition-all duration-200 font-medium text-left"
                    >
                      {service.name}
                    </button>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem className="p-0 border-t border-gray-100 mt-2 pt-2">
                  <button 
                    onClick={() => handleNavigation('/services')}
                    className="w-full px-4 py-3 text-forest-600 font-semibold hover:bg-forest-50 rounded-md transition-all duration-200 text-left"
                  >
                    View All Services
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Areas We Serve Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-gray-700 hover:text-forest-600 transition-all duration-300 font-medium relative group outline-none">
                Areas We Serve
                <ChevronDown size={16} className="ml-1" />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-forest-500 transition-all duration-300 group-hover:w-full"></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg z-50 min-w-[220px] p-2 font-poppins">
                {areas.map((area) => (
                  <DropdownMenuItem key={area.slug} className="p-0">
                    <button 
                      onClick={() => handleNavigation(`/areas/${area.slug}`)}
                      className="w-full px-4 py-3 text-gray-700 hover:text-forest-600 hover:bg-forest-50 rounded-md transition-all duration-200 font-medium text-left"
                    >
                      {area.name}
                    </button>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem className="p-0 border-t border-gray-100 mt-2 pt-2">
                  <button 
                    onClick={() => handleNavigation('/areas')}
                    className="w-full px-4 py-3 text-forest-600 font-semibold hover:bg-forest-50 rounded-md transition-all duration-200 text-left"
                  >
                    View All Areas
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button onClick={() => handleNavigation('/contact')} className="text-gray-700 hover:text-forest-600 transition-all duration-300 font-medium relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-forest-500 transition-all duration-300 group-hover:w-full"></span>
            </button>
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <a href="tel:5551234567" className="bg-gradient-to-r from-nature-500 to-nature-600 hover:from-nature-600 hover:to-nature-700 text-black px-4 lg:px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg animate-pulse-slow">
              CALL NOW: (555) 123-4567
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-forest-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 max-h-96 overflow-y-auto">
              <button onClick={() => handleNavigation('/')} className="block w-full text-left px-3 py-2 text-gray-700 hover:text-forest-600 hover:bg-forest-50 rounded-md font-medium transition-all duration-200">Home</button>
              <button onClick={() => handleNavigation('/about')} className="block w-full text-left px-3 py-2 text-gray-700 hover:text-forest-600 hover:bg-forest-50 rounded-md font-medium transition-all duration-200">About</button>
              
              {/* Mobile Services */}
              <div className="px-3 py-2">
                <div className="text-gray-700 font-semibold mb-3 text-base">Services</div>
                <div className="pl-4 space-y-2">
                  {services.map((service) => (
                    <button key={service.slug} onClick={() => handleNavigation(`/services/${service.slug}`)} className="block w-full text-left py-2 text-sm text-gray-600 hover:text-forest-600 transition-colors duration-200 font-medium">
                      {service.name}
                    </button>
                  ))}
                  <button onClick={() => handleNavigation('/services')} className="block w-full text-left py-2 text-sm text-forest-600 font-semibold border-t border-gray-100 pt-3 mt-2">View All Services</button>
                </div>
              </div>

              {/* Mobile Areas */}
              <div className="px-3 py-2">
                <div className="text-gray-700 font-semibold mb-3 text-base">Areas We Serve</div>
                <div className="pl-4 space-y-2">
                  {areas.map((area) => (
                    <button key={area.slug} onClick={() => handleNavigation(`/areas/${area.slug}`)} className="block w-full text-left py-2 text-sm text-gray-600 hover:text-forest-600 transition-colors duration-200 font-medium">
                      {area.name}
                    </button>
                  ))}
                  <button onClick={() => handleNavigation('/areas')} className="block w-full text-left py-2 text-sm text-forest-600 font-semibold border-t border-gray-100 pt-3 mt-2">View All Areas</button>
                </div>
              </div>

              <button onClick={() => handleNavigation('/contact')} className="block w-full text-left px-3 py-2 text-gray-700 hover:text-forest-600 hover:bg-forest-50 rounded-md font-medium transition-all duration-200">Contact</button>
              <div className="px-3 py-2">
                <a href="tel:5551234567" className="block w-full bg-gradient-to-r from-nature-500 to-nature-600 text-black px-4 py-3 rounded-full font-bold text-sm text-center transition-all duration-300 transform hover:scale-105">
                  CALL NOW: (555) 123-4567
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TreeHeader;
