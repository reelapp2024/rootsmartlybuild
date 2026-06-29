'use client';

import { useSchemaMarkup } from '@/hooks/useSchemaMarkup';
import { generateLocalBusinessSchema, generateContactPointSchema } from '@/utils/schemaGenerator';
import React, { useEffect, useState } from 'react';
import { httpFile } from "@/config";
import { getProjectId } from '../../../hooks/getProjectId';

interface AreaSchemaMarkupProps {
  areaName: string;
  areaDescription: string;
}

const AreaSchemaMarkup = ({ areaName, areaDescription }: AreaSchemaMarkupProps) => {
  // Dynamic fields
  const [projectCategory, setProjectCategory] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [mainLocation, setMainLocation] = useState<string>("");

  const projectId = getProjectId();

  useEffect(() => {
    const fetchBasicProjectInfo = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/basic_project_info", { projectId });
        if (data) {
          setProjectCategory(data.serviceType || "");
          setProjectName(data.projectName || "");
          setPhoneNumber(data.aboutUs?.phone || "");
          setMainLocation(data.aboutUs?.mainLocation || "");
        }
      } catch (err) {
        console.error("Error fetching basic project info (AreaSchemaMarkup):", err);
      }
    };

    if (projectId) fetchBasicProjectInfo();
  }, [projectId]);

  // Build a dynamic business name and description
  const businessDisplayName =
    projectCategory
      ? `${projectCategory} - ${areaName}`
      : `${projectName || 'Our Services'} - ${areaName}`;

  const descriptionText =
    projectCategory
      ? `Professional ${projectCategory} services in ${areaName}. ${areaDescription}`.trim()
      : `Professional services in ${areaName}. ${areaDescription}`.trim();

  // Local Business Schema (dynamic)
  const localBusinessSchema = generateLocalBusinessSchema({
    name: businessDisplayName,
    description: descriptionText,
    telephone: phoneNumber || "",
    address: {
      streetAddress: mainLocation || "",    // use your mainLocation string
      addressLocality: areaName,            // current area page
      addressRegion: mainLocation || "",
      postalCode: "",
      addressCountry: mainLocation || ""
    },
    openingHours: ["Mo-Su 00:00-23:59"],
    priceRange: "$$",
    serviceArea: [areaName, "Surrounding Areas"]
  });

  // Contact Point for this area (dynamic phone)
  const contactSchema = generateContactPointSchema(phoneNumber || "", [areaName]);

  const keySafeArea = areaName.toLowerCase().replace(/\s+/g, '-');

  useSchemaMarkup(localBusinessSchema, `local-business-${keySafeArea}`);
  useSchemaMarkup(contactSchema, `contact-${keySafeArea}`);

  return null;
};

export default AreaSchemaMarkup;
