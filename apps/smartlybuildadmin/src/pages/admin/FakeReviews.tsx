import { useParams } from "react-router-dom";
import { FakeReviewsManagement } from "@/components/admin/FakeReviewsManagement";

export default function FakeReviews() {
  const { projectId } = useParams<{ projectId?: string }>();

  return <FakeReviewsManagement projectId={projectId} />;
}
