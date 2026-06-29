import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

/**
 * Redirects bulk project edits to the unified bulk website wizard.
 */
export function UpdateProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is missing",
        variant: "destructive",
      });
      navigate("/admin/bulk-pages-websites/list");
      return;
    }

    localStorage.setItem("bulkWebsiteCreate_projectId", projectId);
    navigate(`/admin/bulk-pages-websites/create?projectId=${projectId}`, {
      replace: true,
    });

    toast({
      title: "Loading Project",
      description: "Opening bulk website editor...",
    });
  }, [projectId, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-600">Loading project editor...</p>
      </div>
    </div>
  );
}
