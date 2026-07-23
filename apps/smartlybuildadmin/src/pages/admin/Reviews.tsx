import React from "react";
import { useParams } from "react-router-dom";
import { ReviewsManagement } from "@/components/admin/ReviewsManagement";

const Reviews = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const scoped = Boolean(projectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews Approval</h1>
        <p className="text-muted-foreground">
          {scoped
            ? "Manage and approve reviews for blogs in this project only."
            : "Manage and approve reviews across all of your projects."}
        </p>
      </div>
      <ReviewsManagement projectId={projectId} />
    </div>
  );
};

export default Reviews;
