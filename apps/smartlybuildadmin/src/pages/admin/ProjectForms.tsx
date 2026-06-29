import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FormsManagement } from "@/components/admin/FormsManagement";

export default function ProjectForms() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"list" | "create" | "responses">("list");

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/create")) {
      setViewMode("create");
    } else if (path.includes("/responses")) {
      setViewMode("responses");
    } else {
      setViewMode("list");
    }
  }, [location.pathname]);

  // Initialize form fields when in create mode
  useEffect(() => {
    if (viewMode === "create") {
      // Form fields will be initialized in FormsManagement component
    }
  }, [viewMode, projectId]);

  return (
    <div className="px-0 py-6 space-y-6">
      <FormsManagement projectId={projectId} viewMode={viewMode} />
    </div>
  );
}

