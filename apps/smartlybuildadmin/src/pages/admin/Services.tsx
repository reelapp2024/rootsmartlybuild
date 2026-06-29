import ServicesManagement from "@/components/admin/ServicesManagement";
import { useParams } from "react-router-dom";

export default function Services() {
  const { projectId } = useParams<{ projectId?: string }>();
  
  // If projectId is in path (from project dashboard), use it
  // Otherwise, ServicesManagement will handle project selection
  return <ServicesManagement projectId={projectId} />;
}