'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Menu, X, ChevronDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeaderData } from '../../../hooks/useHeaderData';
import { httpFile } from "@/config";
import { getProjectId } from '../../../hooks/getProjectId';
import { getCachedData, setCachedData } from '../../../hooks/useApiCache';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';
import Loader from './Loader';

interface Service {
  _id?: string;
  service_name?: string;
  [key: string]: unknown;
}

interface Location {
  _id?: string;
  location_id?: string | number;
  name?: string;
  slug?: string;
  [key: string]: unknown;
}

const Header = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const router = useRouter();


  const { phoneNumber, projectName, projectSlogan, projectFasFA, isLoading } = useHeaderData();

  useEffect(() => {
    const id = getProjectId();
    setProjectId(id || null);
  }, []);

  useEffect(() => {
    const fetchHeaderData = async () => {
      if (!projectId) return;

      try {
        const endpoint = '/webapp/v1/getheader';
        const params = { projectId };
        const cacheTime = 10 * 60 * 1000; // 10 minutes cache

        // Check cache first
        const cached = getCachedData<{ services?: Service[]; locations?: Location[] }>(endpoint, params);
        if (cached) {
          if (cached.services) setServices(cached.services);
          if (cached.locations) setLocations(cached.locations);
          return; // Use cached data, no API call needed
        }

        // Fetch from API if not cached
        const formData = new FormData();
        formData.append('projectId', projectId);
        const response = await httpFile.post(endpoint, formData);
        
        const responseData = response.data?.data || response.data;
        
        // Cache the response
        setCachedData(endpoint, responseData, params, cacheTime);
        
        if (responseData?.services) setServices(responseData.services);
        if (responseData?.locations) setLocations(responseData.locations);
      } catch (error) {
        console.error("Error fetching header data:", error);
      }
    };
    
    fetchHeaderData();
  }, [projectId]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Show skeleton loading state without changing header structure
  const showSkeleton = isLoading;

  return (
    <>
      <header 
        className="sticky top-0 z-50 transition-colors duration-200 font-poppins backdrop-blur-md"
        style={{
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.primaryButton.bg}20`,
          boxShadow: `0 4px 20px ${colors.primaryButton.bg}10`
        }}
      >
      <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        <div className="flex items-center justify-between py-3 min-h-[64px]">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group min-w-[200px]">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: colors.primaryButton.bg
              }}
            >
              {showSkeleton ? (
                <div className="animate-pulse w-4 h-4 bg-white/50 rounded"></div>
              ) : (
                <i className={`fas ${projectFasFA} text-white text-sm`}></i>
              )}
            </div>
            <div>
              {showSkeleton ? (
                <>
                  <div className="animate-pulse h-5 w-32 bg-gray-300 rounded mb-1"></div>
                  <div className="animate-pulse h-3 w-24 bg-gray-200 rounded hidden sm:block"></div>
                </>
              ) : (
                <>
                  <h3 
                    className="font-bold"
                    style={{ color: '#1f2937' }}
                  >
                    {projectName}
                  </h3>
                  <p className="text-xs hidden sm:block" style={{ color: '#6b7280' }}>
                    {projectSlogan}
                  </p>
                </>
              )}
          </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 min-w-[400px] justify-center">
            {showSkeleton ? (
              <>
                <div className="animate-pulse h-8 w-16 bg-gray-300 rounded"></div>
                <div className="animate-pulse h-8 w-20 bg-gray-300 rounded"></div>
                <div className="animate-pulse h-8 w-24 bg-gray-300 rounded"></div>
                <div className="animate-pulse h-8 w-20 bg-gray-300 rounded"></div>
                <div className="animate-pulse h-8 w-24 bg-gray-300 rounded"></div>
                <div className="animate-pulse h-8 w-20 bg-gray-300 rounded"></div>
              </>
            ) : (
              <>
            <Link 
              href="/" 
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              About
            </Link>

            {/* Services Dropdown */}
            <div className="relative group">
              <Link
                href="/services"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1"
                style={{ color: '#1f2937' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                  e.currentTarget.style.color = colors.primaryButton.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1f2937';
                }}
              >
                Services <ChevronDown className="w-3 h-3" />
              </Link>
              <div 
                className="absolute top-full left-0 mt-1 w-64 rounded-xl shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                style={{
                  backgroundColor: 'white',
                  border: `1px solid ${colors.primaryButton.bg}20`
                }}
              >
                {services.slice(0, 6).map((service) => (
                  <Link
                    key={service._id}
                    href={`/services/${(service.service_name || '').toLowerCase().replace(/\s+/g, '-')}`}
                    className="block w-full px-4 py-2 text-sm transition-colors duration-200"
                    style={{ color: '#1f2937' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                      e.currentTarget.style.color = colors.primaryButton.bg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#1f2937';
                    }}
                  >
                    {service.service_name || 'Service'}
                  </Link>
                ))}
                <div 
                  className="border-t mt-1 pt-1"
                  style={{ borderColor: `${colors.primaryButton.bg}20` }}
                >
                  <Link
                    href="/services"
                    className="block w-full px-4 py-2 text-sm font-semibold"
                    style={{ color: colors.primaryButton.bg }}
                  >
                    View All Services
                  </Link>
                </div>
              </div>
            </div>

            {/* Areas Dropdown */}
            <div className="relative group">
              <Link
                href="/areas"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1"
                style={{ color: '#1f2937' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                  e.currentTarget.style.color = colors.primaryButton.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1f2937';
                }}
              >
                Areas <ChevronDown className="w-3 h-3" />
              </Link>
              <div 
                className="absolute top-full left-0 mt-1 w-56 rounded-xl shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                style={{
                  backgroundColor: 'white',
                  border: `1px solid ${colors.primaryButton.bg}20`
                }}
              >
                {locations.slice(0, 6).map((loc, idx) => (
                  <Link
                    key={loc.location_id || loc._id || idx}
                    href={loc?.slug ? `/${loc.slug}` : '#'}
                    className="block w-full px-4 py-2 text-sm transition-colors duration-200"
                    style={{ color: '#1f2937' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                      e.currentTarget.style.color = colors.primaryButton.bg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#1f2937';
                    }}
                  >
                    {loc.name}
                  </Link>
                ))}
                <div 
                  className="border-t mt-1 pt-1"
                  style={{ borderColor: `${colors.primaryButton.bg}20` }}
                >
                  <Link
                    href="/areas"
                    className="block w-full px-4 py-2 text-sm font-semibold"
                    style={{ color: colors.primaryButton.bg }}
                  >
                    View All Areas
                  </Link>
                </div>
              </div>
            </div>

            <Link 
              href="/contact" 
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              Contact
            </Link>
            <Link 
              href="/blog" 
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              Blogs
            </Link>
              </>
            )}
          </nav>

          {/* Contact Button */}
          <div className="hidden lg:flex items-center min-w-[120px] justify-end">
            {showSkeleton ? (
              <div className="animate-pulse h-10 w-32 bg-gray-300 rounded-lg flex items-center justify-center">
                <div className="animate-pulse w-4 h-4 bg-gray-400 rounded"></div>
              </div>
            ) : (
              <a 
                href={`tel:${phoneNumber}`}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                style={{
                  backgroundColor: colors.primaryButton.bg,
                  color: colors.primaryButton.text
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
              >
                  <Phone className="w-4 h-4" />
                <span className="hidden xl:inline">{phoneNumber}</span>
                <span className="xl:hidden">Call</span>
                </a>
            )}
          </div>

          {/* Mobile Call Button */}
          {showSkeleton ? (
            <div className="lg:hidden animate-pulse h-10 w-20 bg-gray-300 rounded-lg flex items-center justify-center">
              <div className="animate-pulse w-4 h-4 bg-gray-400 rounded"></div>
            </div>
          ) : (
            <a 
              href={`tel:${phoneNumber}`}
              className="lg:hidden px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: colors.primaryButton.bg,
                color: colors.primaryButton.text
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Call</span>
            </a>
          )}
        </div>
      </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div 
          className="bg-white border-t-2 px-4 py-2"
          style={{ 
            borderTopColor: colors.primaryButton.bg,
            boxShadow: `0 -4px 20px ${colors.primaryButton.bg}10`
          }}
        >
          <nav className="flex items-center justify-around">
            {/* Home */}
            <Link 
              href="/" 
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <i className="fas fa-home text-lg"></i>
              <span className="text-xs font-medium">Home</span>
            </Link>

            {/* About */}
            <Link 
              href="/about" 
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <i className="fas fa-info-circle text-lg"></i>
              <span className="text-xs font-medium">About</span>
            </Link>

            {/* Services */}
            <Link 
              href="/services" 
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <i className="fas fa-tools text-lg"></i>
              <span className="text-xs font-medium">Services</span>
            </Link>

            {/* Areas */}
            <Link 
              href="/areas" 
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <i className="fas fa-map-marker-alt text-lg"></i>
              <span className="text-xs font-medium">Areas</span>
            </Link>

            {/* All Menu */}
            <button
              onClick={toggleMenu}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                e.currentTarget.style.color = colors.primaryButton.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <i className="fas fa-bars text-lg"></i>
              <span className="text-xs font-medium">Menu</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Full Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            style={{ borderTop: `3px solid ${colors.primaryButton.bg}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: colors.primaryButton.bg }}>
                All Menu
              </h3>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-full"
                style={{ backgroundColor: `${colors.primaryButton.bg}10` }}
              >
                <X className="w-5 h-5" style={{ color: colors.primaryButton.bg }} />
              </button>
            </div>

            <nav className="space-y-4">
              {/* All Services */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: colors.primaryButton.bg }}>
                  Services
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((service) => (
                    <Link
                      key={service._id}
                      href={`/services/${(service.service_name || '').toLowerCase().replace(/\s+/g, '-')}`}
                      className="p-3 rounded-lg text-sm transition-colors duration-200"
                      style={{ 
                        backgroundColor: `${colors.primaryButton.bg}05`,
                        color: '#1f2937',
                        border: `1px solid ${colors.primaryButton.bg}15`
                      }}
                      onClick={() => setIsMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                        e.currentTarget.style.color = colors.primaryButton.bg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}05`;
                        e.currentTarget.style.color = '#1f2937';
                      }}
                    >
                      {service.service_name || 'Service'}
                    </Link>
                  ))}
                </div>
              </div>

              {/* All Areas */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: colors.primaryButton.bg }}>
                  Service Areas
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {locations.map((loc, idx) => (
                    <Link
                      key={loc.location_id || loc._id || idx}
                      href={loc?.slug ? `/${loc.slug}` : '#'}
                      className="p-3 rounded-lg text-sm transition-colors duration-200"
                      style={{ 
                        backgroundColor: `${colors.primaryButton.bg}05`,
                        color: '#1f2937',
                        border: `1px solid ${colors.primaryButton.bg}15`
                      }}
                      onClick={() => setIsMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                        e.currentTarget.style.color = colors.primaryButton.bg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}05`;
                        e.currentTarget.style.color = '#1f2937';
                      }}
                    >
                      {loc.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Contact & Blog */}
              <div className="flex gap-3">
                <Link 
                  href="/contact" 
                  className="flex-1 p-4 rounded-lg text-center font-semibold transition-colors duration-200"
                  style={{
                    backgroundColor: colors.primaryButton.bg,
                    color: colors.primaryButton.text
                  }}
                  onClick={() => setIsMenuOpen(false)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primaryButton.bg}
                >
                  Contact Us
                </Link>
                <Link 
                  href="/blog" 
                  className="flex-1 p-4 rounded-lg text-center font-semibold transition-colors duration-200"
                  style={{
                    backgroundColor: `${colors.primaryButton.bg}10`,
                    color: colors.primaryButton.bg,
                    border: `2px solid ${colors.primaryButton.bg}`
                  }}
                  onClick={() => setIsMenuOpen(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryButton.bg;
                    e.currentTarget.style.color = colors.primaryButton.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.primaryButton.bg}10`;
                    e.currentTarget.style.color = colors.primaryButton.bg;
                  }}
                >
                  Blogs
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
