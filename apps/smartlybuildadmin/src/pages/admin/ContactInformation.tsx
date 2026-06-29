import ContactInformationManagement from "@/components/admin/ContactInformationManagement";
import { useParams } from "react-router-dom";

export default function ContactInformation() {
  const { projectId } = useParams<{ projectId?: string }>();
  return <ContactInformationManagement projectId={projectId} />;
}
