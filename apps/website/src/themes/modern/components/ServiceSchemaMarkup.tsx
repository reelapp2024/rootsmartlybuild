
import { useSchemaMarkup } from '@/hooks/useSchemaMarkup';
import { generateServiceSchema, generateOrganizationSchema } from '@/utils/schemaGenerator';

interface ServiceSchemaMarkupProps {
  serviceName: string;
  serviceDescription: string;
  serviceUrl?: string;
}

const ServiceSchemaMarkup = ({ serviceName, serviceDescription, serviceUrl }: ServiceSchemaMarkupProps) => {
  // Organization Schema
  const organizationSchema = generateOrganizationSchema({
    name: "Emergency Plumbing Service",
    description: "Professional 24/7 emergency plumbing services with fast response time guarantee.",
    url: window.location.origin,
    telephone: "14676823822"
  });

  // Specific Service Schema
  const serviceSchema = generateServiceSchema([{
    name: serviceName,
    description: serviceDescription,
    provider: "Emergency Plumbing Service",
    areaServed: "United States",
    serviceType: "Plumbing Service",
    url: serviceUrl || window.location.href
  }]);

  useSchemaMarkup(organizationSchema, 'service-organization');
  useSchemaMarkup(serviceSchema[0], 'specific-service');

  return null;
};

export default ServiceSchemaMarkup;
