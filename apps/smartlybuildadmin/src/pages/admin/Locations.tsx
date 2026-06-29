import LocationsManagement from "@/components/admin/LocationsManagement";
import { useParams } from "react-router-dom";

export default function Locations() {
  const { projectId } = useParams<{ projectId?: string }>();
  return <LocationsManagement projectId={projectId} />;
}
