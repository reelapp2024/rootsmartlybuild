'use client';

import React, { useEffect, useState } from 'react';
import { httpFile } from "@/config";
import { getProjectId } from '../../../../hooks/getProjectId';
import { useRouter, usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CTAItem {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

const ContactHero = () => {
    const router = useRouter();
    const pathname = usePathname(); 
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [heroImage, setHeroImage] = useState("");
    const [mainLocation, setMainLocation] = useState("");
    const [projectCategory, setProjectCategory] = useState("");
    const [image, setImage] = useState("");
    const [CTA, setCTA] = useState<CTAItem[]>([]);
  
    const savedSiteId = localStorage.getItem("currentSiteId");
    const projectId = getProjectId();
  
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [location.pathname]); // runs every time URL path changes
  
  
  
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const { data } = await httpFile.post("/webapp/v1/my_site", {
            projectId,
            pageType: "home",
          });
  
          if (data.aboutUs && data.aboutUs) {
            setCTA(data.projectInfo.cta);
  
  
            setEmail(data.aboutUs.email);
            setPhoneNumber(data.aboutUs.phone);
            setMainLocation(data.aboutUs.mainLocation);
            setProjectCategory(data.projectInfo.serviceType);
            setImage(data.projectInfo.images[3].url);
            setHeroImage(data.projectInfo.images[1].url);
  
  
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
  
      fetchData();
    }, [projectId]);
  
  
    const getCTAContent = (index: number): CTAItem => {
      if (CTA.length === 0) {
        return { title: "What are you waiting for", description: "Contact us for our services" };
      }
      return CTA[index] || CTA[0];
    };



  return (
    <section className="relative bg-gradient-to-br from-primary via-blue-600 to-primary py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-primary/20 to-blue-600/20 animate-gradient-shift bg-[length:200%_200%]"></div>
      
      <div className="container mx-auto px-16 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Contact <span className="text-yellow-300">Us</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in">
             Ready for professional {projectCategory}? Contact us today for a free quote and same-day booking.
          </p>
          
          <div className="flex flex-col lg:flex-row gap-6 justify-center items-center mb-12">
            <Button className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white px-10 py-6 text-xl font-bold shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
              <Phone className="w-6 h-6 mr-3" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold opacity-90">CALL NOW</span>
                <span className="text-xl font-black">{phoneNumber}</span>
              </div>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Phone className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Phone</h3>
              <p className="text-white/80">{phoneNumber}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Mail className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Email</h3>
              <p className="text-white/80">{email}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <MapPin className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Service Area</h3>
              <p className="text-white/80">Nationwide Coverage</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Clock className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Hours</h3>
              <p className="text-white/80">24/7 Service</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactHero;
