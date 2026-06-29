import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Server, FileText, MessageSquare, Trash2, Eye, ExternalLink, Globe, CheckCircle, XCircle, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { httpFile } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProjectOverview() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    servicesCount: 0,
    inquiriesCount: 0,
    deploymentStatus: "Not Deployed",
    deploymentDomain: "",
  });

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "No authentication token found",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        // Fetch project details
        const res = await httpFile.post(
          "getUserProjects",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { projectId },
          }
        );

        if (res.status === 200 && res.data.data) {
          const projectData = res.data.data.find((p: any) => p._id === projectId);
          if (projectData) {
            setProject(projectData);
            
            // Fetch additional stats after project is set
            await fetchProjectStats(projectData._id, token, projectData);
          }
        }
      } catch (err: any) {
        console.error("Error fetching project:", err);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, navigate, toast]);

  const fetchProjectStats = async (projectId: string, token: string, projectData?: any) => {
    try {
      // Fetch services count
      try {
        const servicesRes = await httpFile.post(
          "fetch_services",
          { projectId, page: 1, limit: 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (servicesRes.status === 200) {
          setStats(prev => ({ ...prev, servicesCount: servicesRes.data.totalServices || 0 }));
        }
      } catch (err) {
        console.error("Error fetching services:", err);
      }

      // Fetch deployment status (if available)
      const projectToCheck = projectData || project;
      if (projectToCheck?.domainName) {
        setStats(prev => ({
          ...prev,
          deploymentStatus: "Deployed",
          deploymentDomain: projectToCheck.domainName,
        }));
      }

      // Inquiries count - adjust based on your API
      // For now, setting to 0 as placeholder
      setStats(prev => ({ ...prev, inquiriesCount: 0 }));
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.delete(
        `deleteProject/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
        navigate("/admin/projects");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handlePreview = () => {
    if (project?._id) {
      // Get website URL from environment variable or use default
      // Website currently runs on port 8081
      const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 
                        'http://localhost:8081';
      
      const previewUrl = `${websiteUrl}/preview/${project._id}`;
      console.log('Opening preview URL:', previewUrl);
      window.open(previewUrl, "_blank");
    } else {
      console.error('Project ID not found');
    }
  };

  const handleVisitLiveSite = () => {
    if (project?.domainName) {
      window.open(`https://${project.domainName}`, "_blank");
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 1:
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 2:
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 3:
        return <Badge variant="destructive">Archived</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Draft";
      case 1:
        return "In Progress";
      case 2:
        return "Active";
      case 3:
        return "Archived";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="px-0 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Deployment Status Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardContent>
        </Card>

        {/* Project Details Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="px-0 py-6 space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.projectName}</h1>
            {getStatusBadge(project.status)}
          </div>
          <p className="text-gray-500">{project.serviceType || "Service"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!project._id}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          {project.domainName && (
            <Button
              variant="outline"
              onClick={handleVisitLiveSite}
            >
              <Globe className="h-4 w-4 mr-2" />
              Live Site
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Project Created Date */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Project Created
            </CardTitle>
            <Calendar className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.createdAt
                ? new Date(project.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {project.createdAt
                ? new Date(project.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </p>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Project Status
            </CardTitle>
            {project.status === 2 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-gray-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusText(project.status)}</div>
            <p className="text-xs text-gray-500 mt-1">Current status</p>
          </CardContent>
        </Card>

        {/* Services Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Services
            </CardTitle>
            <FileText className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servicesCount}</div>
            <p className="text-xs text-gray-500 mt-1">Total services</p>
          </CardContent>
        </Card>

        {/* Inquiries Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inquiries
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inquiriesCount}</div>
            <p className="text-xs text-gray-500 mt-1">Total inquiries</p>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Status</CardTitle>
          <CardDescription>Current deployment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-semibold">{stats.deploymentStatus}</p>
                {stats.deploymentDomain && (
                  <p className="text-sm text-gray-500 mt-1">
                    <ExternalLink className="h-3 w-3 inline mr-1" />
                    {stats.deploymentDomain}
                  </p>
                )}
              </div>
            </div>
            {stats.deploymentStatus === "Deployed" ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Not Deployed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Additional project information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">Project ID</Label>
              <p className="font-mono text-sm mt-1">{project._id}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Service Type</Label>
              <p className="text-sm mt-1">{project.serviceType || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Created At</Label>
              <p className="text-sm mt-1">
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Last Updated</Label>
              <p className="text-sm mt-1">
                {project.updatedAt
                  ? new Date(project.updatedAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              "{project.projectName}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

