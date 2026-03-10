
'use client';
import { Droplets, Zap, Settings, Trash2, Flame, Wrench, Cylinder, ShowerHead, Database, Toilet, Thermometer, Filter } from 'lucide-react';
import { getProjectId } from '../../../../hooks/getProjectId'; // Import the utility
import { generateServicesSchema } from "../../../../hooks/schemaMarkup";
import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { httpFile } from "@/config";

interface ServicesGridProps {
  formattedLocationName?: string;
}

interface ProjectService {
  _id?: string;
  service_name?: string;
  service_description?: string;
  images?: Array<{ url?: string }>;
  fas_fa_icon?: string;
  [key: string]: unknown;
}

const ServicesGrid = ({ formattedLocationName = "" }: ServicesGridProps) => {

  const [projectServices, setProjectServices] = useState<ProjectService[]>([]);
  const [projectCategory, setProjectCategory] = useState("");

  const [projectId, setProjectId] = useState<string | null>(null); // Initialize as null



  useEffect(() => {
    // Get projectId from utility function
    const id = getProjectId();

    console.log(id, "this is id")
    setProjectId(id || null); // Set projectId in state
  }, []);
  // Helper to truncate at first period
  const getTruncatedDescription = (text: string | undefined): string => {
    if (!text) return '';
    const idx = text.indexOf('.');
    return idx !== -1 ? text.substring(0, idx + 1) : text;
  };

  const handleServiceClick = (service: ProjectService): string => {
    const serviceName = (service.service_name || '').toLowerCase().replace(/\s+/g, '-');
    return `/services/${serviceName}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/fetch_services", { projectId });
        if (data) {
          setProjectServices(data.services || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "cleaningServices"
        });
        if (data.projectInfo && data.projectInfo.serviceType) {
          setProjectCategory(data.projectInfo.serviceType);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [projectId]);


  const servicesSchema = generateServicesSchema(projectServices);


  return (


    <>
      {projectServices.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
        />
      )}
      <section className="py-20 bg-gradient-to-b from-secondary to-background transition-colors duration-300">
        <div className="container mx-auto px-16">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-foreground mb-6">    Our {projectCategory} Services {formattedLocationName}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive  {projectCategory} solutions delivered by experienced professionals. We ensure quality results for every project, big or small.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projectServices.map((service, index) => {
              const shortDesc = getTruncatedDescription(service.service_description); // Truncated description

              return (
                <Link
                  key={index}
                  href={handleServiceClick(service)} // Navigate dynamically based on the service
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('serviceNavigationState', JSON.stringify({
                    serviceId: service._id,
                    serviceName: service.service_name || '',
                    serviceDescription: service.service_description || '',
                    serviceImage: service.images?.[0]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
                    serviceImage1: service.images?.[1]?.url || "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg",
                    serviceImage2: service.images?.[2]?.url || "https://img.free-photo/standard-quality-control-concept-m_23-2150041850.jpg"
                      }));
                    }
                  }}
                  className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.images?.[0]?.url && service.images[0].url.trim() ? service.images[0].url : "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg"}
                      alt={service.service_name || 'Service'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={192}
                      onError={(e) => {
                        e.currentTarget.src = "https://img.freepik.com/free-photo/standard-quality-control-concept-m_23-2150041850.jpg";
                      }}
                    />
                    {/* <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors duration-300"></div> */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                    <div className="absolute top-4 left-4 w-12 h-12 bg-background rounded-xl flex items-center justify-center shadow-lg">
                      <i className={service.fas_fa_icon || ''} />

                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                      {service.service_name || 'Service'} {formattedLocationName} {/* Display service name */}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {shortDesc}  {/* Display truncated description */}
                    </p>
                  </div>
                </Link>
              );
            })}

          </div>
        </div>
      </section>
    </>

  );
};

export default ServicesGrid;
