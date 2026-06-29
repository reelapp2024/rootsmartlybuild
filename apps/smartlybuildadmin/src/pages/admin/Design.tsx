import DesignManagement from "@/components/admin/DesignManagement";
import { useParams } from "react-router-dom";

export default function Design() {
  const { projectId } = useParams<{ projectId?: string }>();
  return <DesignManagement projectId={projectId} />;
}
