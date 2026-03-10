
'use client';

import { Phone, Mail, MapPin, Clock, Star, Shield, Award } from 'lucide-react';
import { useFooterData } from '../../../hooks/useFooterData.js';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import Loader from './Loader';

interface FooterData {
  projectName?: string;
  projectSlogan?: string;
  welcomeLine?: string;
  aboutUs?: {
    phone?: string;
    email?: string;
    mainLocation?: string;
    [key: string]: unknown;
  };
  services?: Array<{
    service_name?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

const Footer = () => {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();

  const quickLinks = [
    'About Us',
    'Service Areas',
    'Contact Us',
    'Terms & Conditions',
    'Privacy Policy'
  ];

  const { footerData, isLoading } = useFooterData();
  const typedFooterData = footerData as FooterData | null;
  // Footer should not show full page loading, just show skeleton
  if (isLoading) {
    return (
      <footer 
        className="font-poppins"
        style={{
          background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-16">
          {/* Loading state removed for better UX */}
        </div>
      </footer>
    );
  }


  const projectName = typedFooterData?.projectName || "SparkleClean Pro";
  const projectSlogan = typedFooterData?.projectSlogan || "Professional Cleaning";
  const welcomeLine = typedFooterData?.welcomeLine || "Professional residential and commercial cleaning services with eco-friendly products and satisfaction guaranteed.";
  const aboutUs = typedFooterData?.aboutUs || {};
  const services = typedFooterData?.services || [];


  return (
    <footer 
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 rounded-full animate-pulse" style={{ borderColor: colors.accent }}></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 border-2 rounded-lg rotate-45 animate-pulse" style={{ borderColor: colors.primaryButton.bg, animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-12 h-12 border rounded-full animate-pulse" style={{ borderColor: colors.accent, animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-16 py-16 relative z-10">
        
        {/* Top Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 
                className="text-2xl font-bold mb-4"
                style={{
                  color: '#ffffff'
                }}
              >
                {projectName}
              </h3>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{
                  backgroundColor: `${colors.primaryButton.bg}20`,
                  border: `1px solid ${colors.primaryButton.bg}40`
                }}
              >
                <Star className="w-4 h-4" style={{ color: colors.primaryButton.bg }} />
                <span className="text-sm font-semibold text-white">{projectSlogan}</span>
              </div>
              <p className="text-white/80 leading-relaxed text-sm">
                {welcomeLine}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.primaryButton.bg}20` }}
                >
                  <Shield className="w-4 h-4" style={{ color: colors.primaryButton.bg }} />
                </div>
                <span className="text-white/80 text-sm font-medium">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  <Award className="w-4 h-4" style={{ color: colors.accent }} />
                </div>
                <span className="text-white/80 text-sm font-medium">5-Star Rated</span>
              </div>
            </div>
          </div>

          {/* Our Services */}
          <div>
            <h4 className="font-bold mb-6" style={{ color: '#ffffff' }}>Our Services</h4>
            <ul className="space-y-3">
              {services.slice(0, 6).map((service, index) => (
                <li key={index}>
                  <Link
                    href={service.service_name ? `/services/${service.service_name.toLowerCase().replace(/\s+/g, '-')}` : '#'}
                    className="text-white/80 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:w-2 group-hover:h-2"
                      style={{ backgroundColor: colors.primaryButton.bg }}
                    ></div>
                    {service.service_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-6" style={{ color: '#ffffff' }}>Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/about" 
                  className="text-white/80 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 group"
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:w-2 group-hover:h-2"
                    style={{ backgroundColor: colors.accent }}
                  ></div>
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/areas" 
                  className="text-white/80 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 group"
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:w-2 group-hover:h-2"
                    style={{ backgroundColor: colors.accent }}
                  ></div>
                  Service Areas
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-white/80 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 group"
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:w-2 group-hover:h-2"
                    style={{ backgroundColor: colors.accent }}
                  ></div>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms-conditions" 
                  className="text-white/80 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 group"
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:w-2 group-hover:h-2"
                    style={{ backgroundColor: colors.accent }}
                  ></div>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-white/80 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 group"
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:w-2 group-hover:h-2"
                    style={{ backgroundColor: colors.accent }}
                  ></div>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-6" style={{ color: '#ffffff' }}>Contact Info</h4>
            <div className="space-y-4">
              {aboutUs.phone && (
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.primaryButton.bg}20` }}
                  >
                    <Phone className="w-5 h-5" style={{ color: colors.primaryButton.bg }} />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide">Phone</p>
                    <p className="text-white font-semibold">{aboutUs.phone}</p>
                  </div>
                </div>
              )}
              {aboutUs.email && (
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.accent}20` }}
                  >
                    <Mail className="w-5 h-5" style={{ color: colors.accent }} />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide">Email</p>
                    <p className="text-white font-semibold text-sm">{aboutUs.email}</p>
                  </div>
                </div>
              )}
              {aboutUs.mainLocation && (
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.primaryButton.bg}20` }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: colors.primaryButton.bg }} />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide">Location</p>
                    <p className="text-white font-semibold text-sm">{aboutUs.mainLocation}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  <Clock className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wide">Hours</p>
                  <p className="text-white font-semibold text-sm">Mon-Sat: 7AM-6PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="border-t pt-8"
          style={{ borderColor: `${colors.primaryButton.bg}30` }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-center md:text-left text-sm">
              © 2025 {projectName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.primaryButton.bg }}></div>
                <span className="text-white/60 text-sm">24/7 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
                <span className="text-white/60 text-sm">Licensed & Insured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
