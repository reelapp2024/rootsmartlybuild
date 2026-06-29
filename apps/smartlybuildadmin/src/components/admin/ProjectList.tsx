
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ExternalLink, Pencil, Search, Server, Trash, Plus, Zap, Globe, Laptop, Wrench, Link, Settings, CheckCircle, BarChart3, MoreVertical, Layout, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import '@fortawesome/fontawesome-free/css/all.min.css';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { http, httpFile } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DeploymentDialog } from "./DeploymentDialog";
import { GoogleSiteVerificationDialog } from "./GoogleSiteVerificationDialog";
import socket from "../../socket.js";

interface ProjectListProps {
  projectType?: 0 | 1 | "all";
  moduleTitle?: string;
  moduleDescription?: string;
  createRoute?: string;
  createButtonLabel?: string;
  searchPlaceholder?: string;
}

export function ProjectList({
  projectType = "all",
  moduleTitle = "Project Management",
  moduleDescription = "Manage and monitor your projects",
  createRoute = "/admin/create-project",
  createButtonLabel = "New Project",
  searchPlaceholder = "Search projects...",
}: ProjectListProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(6); // Fixed items per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [projects, setProjects] = useState([]);
  const [Activeprojects, setActiveProjects] = useState([]);
  const [deploymentDialog, setDeploymentDialog] = useState({ open: false, projectId: '', projectName: '', hostingId: '' });
  const [googleVerificationDialog, setGoogleVerificationDialog] = useState({ open: false, projectId: '', projectName: '', verificationCode: '', htmlFileName: '' });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch projects from API with pagination and search (socket handles live status updates)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
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

        const params: any = {
          page: currentPage,
          limit,
          ...(searchTerm && { search: searchTerm }),
        };
        if (projectType !== "all") {
          params.projectType = projectType;
        }

        const res = await http.post(
          "getUserProjects",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
          }
        );

        if (res.status === 401) {
          localStorage.clear();
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        if (res.status === 400 || res.status === 404) {
          toast({
            title: "Error",
            description: res.data.message || "Request failed",
            variant: "destructive",
          });
          if (res.status === 404) navigate("/login");
          return;
        }

        const rawProjectList = res.data.data || [];
        const projectList = projectType === "all"
          ? rawProjectList
          : rawProjectList.filter((project) => Number(project?.projectType) === Number(projectType));
        setProjects(projectList);
        setActiveProjects(res.data.totalActiveProjects || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalProjects(projectType === "all" ? (res.data.total || projectList.length || 0) : projectList.length);

        // Join unique socket room for each project
        projectList.forEach((project) => {
          socket.emit("joinRoom", `project_${project._id}`);
        });

      } catch (err) {
        localStorage.clear();
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to fetch projects",
          variant: "destructive",
        });
        navigate("/login");
      }
    };

    fetchProjects();

    const onProjectStatusUpdate = ({ projectId, status }: { projectId: string; status: string }) => {
      setProjects((prev) =>
        prev.map((proj) =>
          proj._id === projectId ? { ...proj, deploymentStatus: status } : proj
        )
      );
    };

    socket.on("projectStatusUpdate", onProjectStatusUpdate);

    return () => {
      socket.off("projectStatusUpdate", onProjectStatusUpdate);
    };
  }, [navigate, currentPage, limit, searchTerm, projectType]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const getBadgeVariant = (status) => {
    switch (status) {
      case 2:
        return "bg-green-100 text-green-800 border-green-200";
      case 0:
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Action handlers
  const handleVisitLocalSite = (projectId) => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is missing",
        variant: "destructive",
      });
      return;
    }
    // Try both siteId and projectId parameters to ensure compatibility
    const previewUrl = `http://localhost:8081/?siteId=${projectId}&projectId=${projectId}`;
    console.log("Opening preview for project:", projectId, "URL:", previewUrl);
    window.open(previewUrl, "_blank");
  };

  const handleVisitLiveSite = (project) => {
    if (!project.domainName) {
      toast({
        title: "No Domain",
        description: "This project does not have a domain configured",
        variant: "destructive",
      });
      return;
    }

    // Ensure domain has protocol
    let domainUrl = project.domainName;
    if (!domainUrl.startsWith('http://') && !domainUrl.startsWith('https://')) {
      domainUrl = `https://${domainUrl}`;
    }

    window.open(domainUrl, "_blank");
  };

  const handleVisitServices = (id) => {
    // Store the project ID in localStorage so the services page knows which project
    localStorage.setItem("currentProjectId", id);
    navigate(`/services/${id}`);
  };

  const handleUpdateProject = (id, pType = 0) => {
    const isBusiness = Number(pType) === 1;
    const target = isBusiness
      ? `/admin/business-website/create?projectId=${id}`
      : `/admin/bulk-pages-websites/create?projectId=${id}`;
    const storageKey = isBusiness ? "businessWebsiteCreate" : "bulkWebsiteCreate";
    localStorage.setItem(`${storageKey}_projectId`, id);
    navigate(target, { replace: true });
  };

  const handleDeploy = (projectId, projectName, hostingId = '') => {
    setDeploymentDialog({ open: true, projectId, projectName, hostingId });
  };

  // Handle settings
  const handleSettings = (projectId) => {
    // Navigate to project settings page or open settings dialog
    navigate(`/admin/project/${projectId}/settings`);
  };

  // Handle Google Site Verification
  const handleGoogleSiteVerification = (projectId, projectName, currentVerificationCode = '', currentHtmlFileName = '') => {
    setGoogleVerificationDialog({ 
      open: true, 
      projectId, 
      projectName, 
      verificationCode: currentVerificationCode,
      htmlFileName: currentHtmlFileName
    });
  };

  // Handle generate default header/footer
  const handleGenerateDefaultHeaderFooter = async (projectId, userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found",
          variant: "destructive",
        });
        return;
      }

      // Create default header
      const headerRes = await httpFile.post(
        "/header-footer/create-default",
        {
          projectId,
          userId,
          type: 0, // Header
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Create default footer
      const footerRes = await httpFile.post(
        "/header-footer/create-default",
        {
          projectId,
          userId,
          type: 1, // Footer
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (headerRes.status === 201 && footerRes.status === 201) {
        toast({
          title: "Success",
          description: "Default header and footer created successfully",
        });
      } else {
        toast({
          title: "Partial Success",
          description: "Some items may not have been created",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating default header/footer:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create default header/footer",
        variant: "destructive",
      });
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    try {
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

      const res = await httpFile.post(`/deleteProject/${projectId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        // Remove project from state
        setProjects((prev) => prev.filter((project) => project._id !== projectId));
        toast({
          title: "Success",
          description: "Project deleted successfully",

        });
      } else {
        toast({
          title: "Error",
          description: res.data.message || "Failed to delete project",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete project",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="space-y-6 font-poppins">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              {React.createElement(Zap as any, { className: "h-5 w-5" })}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {moduleTitle}
              </h1>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {moduleDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            {React.createElement(Search as any, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" })}
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 pr-4 w-full sm:w-[250px] h-10"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              // Clear any existing projectId for new project
              localStorage.removeItem("lastCreateProjectId");
              navigate(createRoute, { state: { isEditMode: false } });
            }}>
            {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
            {createButtonLabel}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Total Projects</p>
                <p className="text-2xl font-bold text-blue-900">{totalProjects}</p>
              </div>
              <div className="p-2 bg-blue-600 rounded-lg">
                {React.createElement(Zap as any, { className: "h-4 w-4 text-white" })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Active Projects</p>
                <p className="text-2xl font-bold text-green-900">
                  {Activeprojects}
                </p>
              </div>
              <div className="p-2 bg-green-600 rounded-lg">
                {React.createElement(Eye as any, { className: "h-4 w-4 text-white" })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Total Images</p>
                <p className="text-2xl font-bold text-blue-900">
                  {projects.reduce((sum, p) => sum + (p.images?.length || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-blue-600 rounded-lg">
                {React.createElement(Server as any, { className: "h-4 w-4 text-white" })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-bold text-gray-900 text-sm min-w-[200px]">Project</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm">Service Type</TableHead>
                <TableHead className="font-bold text-gray-900 text-sm">Status</TableHead>
                <TableHead className="text-right font-bold text-gray-900 text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                return (
                  <TableRow 
                    key={project._id} 
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="pointer-events-none">
                      <div className="font-semibold text-base text-gray-900 capitalize">{project.projectName}</div>
                      {/* Deployment status under project name */}
                      <div className="mt-1">
                        <Badge
                          className={`text-xs px-2 py-0.5 ${project.deploymentStatus === "success"
                            ? "bg-green-100 text-green-700"
                            : project.deploymentStatus === "building"
                              ? "bg-yellow-100 text-yellow-700"
                              : project.deploymentStatus === "upload_failed" || project.deploymentStatus === "build_failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {project.deploymentStatus?.replace(/_/g, " ") || "not deployed"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{project.serviceType}</span>
                    </TableCell>
                    <TableCell className="pointer-events-none">
                      <Badge className={`text-xs px-2 py-1 ${getBadgeVariant(project.status)}`}>
                        {project.status === 2 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleVisitLocalSite(project._id)}
                      >
                        {React.createElement(Eye as any, { className: "h-3 w-3 mr-1" })}
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open(`/admin/projects/${project._id}/dashboard`, '_blank')}
                      >
                        {React.createElement(BarChart3 as any, { className: "h-3 w-3 mr-1" })}
                        Dashboard
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            {React.createElement(MoreVertical as any, { className: "h-4 w-4" })}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateProject(project._id, project.projectType)}>
                            {React.createElement(Pencil as any, { className: "h-4 w-4 mr-2" })}
                            Update
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleGenerateDefaultHeaderFooter(project._id, project.userId || localStorage.getItem('userId'))}
                          >
                            {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
                            Generate Default Header/Footer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project._id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            {React.createElement(Trash as any, { className: "h-4 w-4 mr-2" })}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {projects.length === 0 && (
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-blue-100">
                {React.createElement(Search as any, { className: "h-8 w-8 text-blue-500" })}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No projects found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search terms or create a new project</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // Clear any existing projectId for new project
                  localStorage.removeItem("lastCreateProjectId");
                  navigate(createRoute, { state: { isEditMode: false } });
                }}>
                {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
                Create New Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalProjects > 0 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="cursor-pointer"
                  >
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationLink
                  isActive={true}
                  onClick={() => handlePageChange(currentPage)}
                  className="cursor-pointer"
                >
                  {currentPage}
                </PaginationLink>
              </PaginationItem>

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="cursor-pointer"
                  >
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <DeploymentDialog
        open={deploymentDialog.open}
        onOpenChange={(open) => setDeploymentDialog(prev => ({ ...prev, open }))}
        projectId={deploymentDialog.projectId}
        projectName={deploymentDialog.projectName}
        preSelectedHostingId={deploymentDialog.hostingId}
      />

      <GoogleSiteVerificationDialog
        open={googleVerificationDialog.open}
        onOpenChange={(open) => setGoogleVerificationDialog(prev => ({ ...prev, open }))}
        projectId={googleVerificationDialog.projectId}
        projectName={googleVerificationDialog.projectName}
        currentVerificationCode={googleVerificationDialog.verificationCode}
        currentHtmlFileName={googleVerificationDialog.htmlFileName}
        onSuccess={() => {
          // Refresh projects list to show updated verification code
          const fetchProjects = async () => {
            try {
              const token = localStorage.getItem("token");
              if (!token) return;

              const params: any = {
                page: currentPage,
                limit,
                ...(searchTerm && { search: searchTerm }),
              };
              if (projectType !== "all") {
                params.projectType = projectType;
              }

              const res = await http.post(
                "getUserProjects",
                {},
                {
                  headers: { Authorization: `Bearer ${token}` },
                  params,
                }
              );

              if (res.status === 200) {
                const rawProjectList = res.data.data || [];
                const projectList = projectType === "all"
                  ? rawProjectList
                  : rawProjectList.filter((project) => Number(project?.projectType) === Number(projectType));
                setProjects(projectList);
              }
            } catch (err) {
              console.error("Failed to refresh projects:", err);
            }
          };
          fetchProjects();
        }}
      />

    </div>
  );
}
