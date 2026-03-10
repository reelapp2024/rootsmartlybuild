'use client';

import { useSchemaMarkup } from '@/hooks/useSchemaMarkup';
import {
  generateOrganizationSchema,
  generateServiceSchema,
  generateContactPointSchema
} from '@/utils/schemaGenerator';
import { slugify } from "../../../extras/slug";
import React, { useEffect, useState } from 'react';
import { httpFile } from "@/config";
import { getProjectId } from '../../../hooks/getProjectId';

interface SchemaMarkupProps {
  areaId?: any;
  areaType?: any;
}

interface FetchPayload {
  projectId: any;
  areaId?: any;
  areaType?: any;
}

interface ProjectService {
  service_name?: string;
  service_description?: string;
  [key: string]: unknown;
}

const SchemaMarkup = ({ areaId, areaType }: SchemaMarkupProps) => {
  const [projectServices, setProjectServices] = useState<ProjectService[]>([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [mainLocation, setMainLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [origin, setOrigin] = useState("");

  const projectId = getProjectId();

  // Get origin safely for SSR
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const fetchBasicProjectInfo = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/basic_project_info", {
          projectId
        });
        if (data) {
          setProjectCategory(data.serviceType || "");
          setProjectName(data.projectName || "");
          setProjectDescription(data.descriptions?.[0] || "");
          setEmail(data.aboutUs?.email || "");
          setPhoneNumber(data.aboutUs?.phone || "");
          setMainLocation(data.aboutUs?.mainLocation || "");
        }
      } catch (error) {
        console.error("Error fetching basic project info:", error);
      }
    };
    if (projectId) fetchBasicProjectInfo();
  }, [projectId]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const payload: FetchPayload = { projectId };

        if (areaId && areaType) {
          payload.areaId = areaId;
          payload.areaType = areaType;
        }

        const { data } = await httpFile.post("/webapp/v1/fetch_services", payload);
        if (data) {
          setProjectServices(data.services || []);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    const fetchCategory = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
          reqFrom: "servicesSection"
        });
        if (data.projectInfo?.serviceType) {
          setProjectCategory(data.projectInfo.serviceType);
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      }
    };

    if (projectId) {
      fetchServices();
      fetchCategory();
    }
  }, [projectId, areaId, areaType]);

  // Get current origin safely
  const getCurrentOrigin = () => {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    return origin || 'https://example.com'; // Fallback for SSR
  };

  const currentOrigin = getCurrentOrigin();

  // Generate schemas exactly like before
  const organizationSchema = generateOrganizationSchema({
    name: projectName,
    description: projectDescription,
    url: currentOrigin,
    telephone: phoneNumber,
    email: email,
    address: {
      streetAddress: mainLocation,
      addressLocality: mainLocation,
      addressRegion: mainLocation,
      postalCode: mainLocation,
      addressCountry: mainLocation
    }
  });

  const formattedServices = projectServices.map(service => ({
    name: service.service_name || '',
    description: service.service_description || '',
    provider: projectName,
    areaServed: mainLocation,
    serviceType: projectCategory,
    url: `${currentOrigin}/services/${slugify(service.service_name || '')}`
  }));

  const servicesSchema = generateServiceSchema(formattedServices);
  const contactSchema = generateContactPointSchema(phoneNumber, [mainLocation]);

  useSchemaMarkup(organizationSchema, 'organization');
  useSchemaMarkup({ "@graph": servicesSchema }, 'services');
  useSchemaMarkup(contactSchema, 'contact');

  return null;
};

export default SchemaMarkup;

