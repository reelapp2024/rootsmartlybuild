import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { httpFile } from "../../config.js";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, FileText, Plus, Edit, Trash2, Eye, Power, PowerOff, MessageSquare, Layout, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  _id: string;
  projectName: string;
  serviceType: string;
  isFormExists: number;
}

interface FormField {
  _id?: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface DynamicForm {
  _id: string;
  projectId: string;
  name: string;
  fields: FormField[];
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormSubmission {
  _id: string;
  formId: string;
  projectId: string;
  submittedData: Record<string, any>;
  createdAt: string;
}

interface FormsManagementProps {
  projectId?: string;
  viewMode?: "list" | "create" | "responses";
}

export function FormsManagement(props: FormsManagementProps = {}) {
  const { projectId: propProjectId, viewMode = "list" } = props;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Form management state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFormsDialog, setShowFormsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  
  // Responses state
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  const [responses, setResponses] = useState<FormSubmission[]>([]);
  const [responsesPage, setResponsesPage] = useState(1);
  const [responsesLimit] = useState(10);
  const [responsesTotalPages, setResponsesTotalPages] = useState(1);
  const [responsesTotal, setResponsesTotal] = useState(0);
  const [loadingResponses, setLoadingResponses] = useState(false);
  
  // Form creation/edit state
  const [formName, setFormName] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([
    { name: "name", label: "Name", type: "text", required: true, placeholder: "Enter your name" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "Enter your email" },
  ]);

  // Track if we're already fetching to prevent duplicate calls
  const fetchingProjectInfoRef = useRef<string | null>(null);
  
  // Fetch project info - memoized to prevent recreation on every render
  const fetchProjectInfo = useCallback(async (projectId: string) => {
    // Prevent duplicate calls for the same projectId
    if (fetchingProjectInfoRef.current === projectId) return;
    fetchingProjectInfoRef.current = projectId;
    
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "getUserProjects",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { projectId },
        }
      );
      if (res.status === 200 && res.data.data) {
        const project = res.data.data.find((p: Project) => p._id === projectId);
        if (project) {
          setSelectedProject(project);
        }
      }
    } catch (err: any) {
      console.error("Error fetching project info:", err);
    } finally {
      // Reset after a delay to allow the same projectId to be fetched again if needed
      setTimeout(() => {
        if (fetchingProjectInfoRef.current === projectId) {
          fetchingProjectInfoRef.current = null;
        }
      }, 1000);
    }
  }, []); // Empty dependency array since it doesn't depend on any props/state

  // Fetch forms for a project (admin - gets all forms)
  const fetchForms = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/fetch_all_forms_admin",
        { projectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setForms(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching forms:", err);
      toast.error(err.response?.data?.message || "Failed to fetch forms");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found");
        navigate("/login");
        return;
      }

      const params = {
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm }),
      };

      const res = await httpFile.post(
        "getUserProjects",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      if (res.status === 401) {
        localStorage.clear();
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      const projectList = res.data.data || [];
      setProjects(projectList);
      setTotalPages(res.data.totalPages || 1);
      setTotalProjects(res.data.total || 0);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      toast.error(err.response?.data?.message || "Failed to fetch projects");
    }
  }, [currentPage, limit, searchTerm, navigate]);

  // Fetch projects or forms based on props
  useEffect(() => {
    if (propProjectId) {
      // If projectId is provided, fetch forms directly
      fetchForms(propProjectId);
      // Fetch project info
      fetchProjectInfo(propProjectId);
      // For project dashboard, don't open dialog - show page instead
      setShowFormsDialog(false);
    } else {
      // Original behavior - fetch projects list
      fetchProjects();
      // If viewMode is create and no projectId, open create dialog (admin page)
      if (viewMode === "create") {
        setTimeout(() => {
          setShowCreateDialog(true);
        }, 500);
      }
    }
  }, [currentPage, searchTerm, propProjectId, viewMode, fetchProjectInfo, fetchForms, fetchProjects]);

  // Fetch form responses
  const fetchResponses = useCallback(async (formId: string, page: number = 1) => {
    setLoadingResponses(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/fetch_form_submissions",
        { formId, page, limit: responsesLimit },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200 && res.data.data) {
        const { submissions, meta } = res.data.data;
        setResponses(submissions || []);
        setResponsesTotal(meta?.total || 0);
        setResponsesTotalPages(meta?.pages || 1);
        setResponsesPage(page);
      }
    } catch (err: any) {
      console.error("Error fetching responses:", err);
      toast.error(err.response?.data?.message || "Failed to fetch responses");
    } finally {
      setLoadingResponses(false);
    }
  }, [responsesLimit]);

  // Separate effect for handling responses view mode after forms are loaded
  useEffect(() => {
    if (propProjectId && viewMode === "responses" && forms.length > 0 && !selectedForm) {
      setSelectedForm(forms[0]);
      fetchResponses(forms[0]._id, 1);
    }
  }, [propProjectId, viewMode, forms.length, selectedForm, fetchResponses]); // Only run when forms are actually loaded

  // Handle view forms
  const handleViewForms = async (project: Project) => {
    setSelectedProject(project);
    await fetchForms(project._id);
    setShowFormsDialog(true);
  };

  // Handle create form
  const handleCreateForm = () => {
    const projectToUse = propProjectId ? { _id: propProjectId } as Project : selectedProject;
    if (!projectToUse && !propProjectId) {
      toast.error("Please select a project first");
      return;
    }
    setFormName(selectedProject ? `${selectedProject.projectName} Form` : "New Form");
    setFormFields([
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Enter your name" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "Enter your email" },
      { name: "phone", label: "Phone", type: "tel", required: false, placeholder: "Enter your phone" },
      { name: "message", label: "Message", type: "textarea", required: true, placeholder: "Enter your message" },
    ]);
    setShowCreateDialog(true);
  };

  // Submit create form
  const submitCreateForm = async () => {
    const projectToUse = propProjectId ? { _id: propProjectId } as Project : selectedProject;
    if (!projectToUse) {
      toast.error("Project not found");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/create_dynamic_form",
        {
          projectId: projectToUse._id,
          name: formName,
          fields: JSON.stringify(formFields),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 201) {
        toast.success("Form created successfully!");
        setShowCreateDialog(false);
        // If in project dashboard, navigate to list page
        if (propProjectId && viewMode === "create") {
          navigate(`/admin/projects/${propProjectId}/dashboard/forms/list`);
        } else {
          if (selectedProject) {
            await fetchForms(selectedProject._id);
          }
          await fetchProjects(); // Refresh to update isFormExists
        }
        // Reset form
        setFormName("");
        setFormFields([
          { name: "name", label: "Name", type: "text", required: true, placeholder: "Enter your name" },
          { name: "email", label: "Email", type: "email", required: true, placeholder: "Enter your email" },
        ]);
      }
    } catch (err: any) {
      console.error("Error creating form:", err);
      toast.error(err.response?.data?.message || "Failed to create form");
    }
  };

  // Handle edit form
  const handleEditForm = (form: DynamicForm) => {
    setSelectedForm(form);
    setFormName(form.name);
    setFormFields(form.fields);
    setShowEditDialog(true);
  };

  // Submit edit form
  const submitEditForm = async () => {
    if (!selectedForm) return;

    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/edit_dynamic_form",
        {
          formId: selectedForm._id,
          name: formName,
          fields: JSON.stringify(formFields),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast.success("Form updated successfully!");
        setShowEditDialog(false);
        if (selectedProject) {
          await fetchForms(selectedProject._id);
        }
      }
    } catch (err: any) {
      console.error("Error updating form:", err);
      toast.error(err.response?.data?.message || "Failed to update form");
    }
  };

  // Handle delete form
  const handleDeleteForm = (form: DynamicForm) => {
    setSelectedForm(form);
    setShowDeleteDialog(true);
  };

  // Confirm delete form
  const confirmDeleteForm = async () => {
    if (!selectedForm) return;

    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/delete_dynamic_form",
        { formId: selectedForm._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast.success("Form deleted successfully!");
        setShowDeleteDialog(false);
        if (selectedProject) {
          await fetchForms(selectedProject._id);
          await fetchProjects(); // Refresh to update isFormExists
        }
      }
    } catch (err: any) {
      console.error("Error deleting form:", err);
      toast.error(err.response?.data?.message || "Failed to delete form");
    }
  };

  // Handle enable/disable form
  const handleToggleForm = async (form: DynamicForm) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = !Boolean(form.isEnabled); // Explicitly convert to boolean
      
      console.log('Toggling form:', form._id, 'from', form.isEnabled, 'to', newStatus);
      
      const res = await httpFile.post(
        "/enable_disable_form",
        {
          formId: form._id,
          isEnabled: newStatus,
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (res.status === 200) {
        toast.success(`Form ${newStatus ? "enabled" : "disabled"} successfully!`);
        // Refresh the forms list to show updated status
        if (selectedProject) {
          await fetchForms(selectedProject._id);
        }
      }
    } catch (err: any) {
      console.error("Error toggling form:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to toggle form status");
    }
  };

  // Add field to form
  const addField = () => {
    setFormFields([
      ...formFields,
      { name: "", label: "", type: "text", required: false, placeholder: "" },
    ]);
  };

  // Update field
  const updateField = (index: number, key: keyof FormField, value: any) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], [key]: value };
    setFormFields(updated);
  };

  // Remove field
  const removeField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // Handle view responses
  const handleViewResponses = async (form: DynamicForm) => {
    setSelectedForm(form);
    setResponsesPage(1);
    await fetchResponses(form._id, 1);
    setShowResponsesDialog(true);
  };

  const filteredProjects = projects.filter((project) =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-poppins">
      {/* Header - Only show if no projectId prop */}
      {!propProjectId && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                {React.createElement(FileText as any, { className: "h-5 w-5" })}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  Forms Management
                </h1>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Manage dynamic forms for your projects
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects List - Only show if no projectId prop */}
      {!propProjectId && (
        <>
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                {React.createElement(Search as any, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" })}
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Projects Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Form Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell className="font-medium">{project.projectName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.serviceType || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          {project.isFormExists === 1 ? (
                            <Badge className="bg-green-100 text-green-800">Form Exists</Badge>
                          ) : (
                            <Badge variant="secondary">No Form</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleViewForms(project)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {React.createElement(FileText as any, { className: "h-4 w-4 mr-2" })}
                            Manage Forms
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(i + 1)}
                            isActive={currentPage === i + 1}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Form Page - Show directly if projectId is provided and viewMode is create */}
      {propProjectId && viewMode === "create" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Create Form</h1>
              <p className="text-gray-500 mt-2">Define the fields for your dynamic form</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate(`/admin/projects/${propProjectId}/dashboard/forms/list`)}
            >
              Back to List
            </Button>
          </div>

          {/* Create Form Content */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Form Name Section */}
                <div className="space-y-2">
                  <Label htmlFor="formName" className="text-sm font-semibold text-gray-900">
                    Form Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="formName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Contact Form, Inquiry Form"
                    className="h-10"
                  />
                  <p className="text-xs text-gray-500">
                    Give your form a descriptive name
                  </p>
                </div>

                {/* Form Fields Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center space-x-2">
                      {React.createElement(Layout as any, { className: "h-4 w-4 text-blue-600" })}
                      <Label className="text-sm font-semibold text-gray-900">
                        Form Fields
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        {formFields.length} {formFields.length === 1 ? 'field' : 'fields'}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={addField}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                    >
                      {React.createElement(Plus as any, { className: "h-3.5 w-3.5 mr-1.5" })}
                      Add Field
                    </Button>
                  </div>

                  {formFields.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      {React.createElement(Layout as any, { className: "h-10 w-10 text-gray-400 mx-auto mb-3" })}
                      <p className="text-sm text-gray-500 mb-2">No fields added yet</p>
                      <p className="text-xs text-gray-400">Click "Add Field" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formFields.map((field, index) => (
                        <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Field Header */}
                              <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">Field {index + 1}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeField(index)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {React.createElement(X as any, { className: "h-4 w-4" })}
                                </Button>
                              </div>

                              {/* Field Inputs */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-gray-700">
                                    Label <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) => updateField(index, "label", e.target.value)}
                                    placeholder="e.g., Email Address"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-gray-700">
                                    Field Type
                                  </Label>
                                  <Select
                                    value={field.type}
                                    onValueChange={(value) => updateField(index, "type", value)}
                                  >
                                    <SelectTrigger className="h-9 text-sm">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="tel">Phone</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="textarea">Textarea</SelectItem>
                                      <SelectItem value="file">File Upload</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-gray-700">
                                    Placeholder
                                  </Label>
                                  <Input
                                    value={field.placeholder || ""}
                                    onChange={(e) => updateField(index, "placeholder", e.target.value)}
                                    placeholder="Optional"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="flex items-center space-x-2 md:col-span-3 pt-1">
                                  <Checkbox
                                    id={`required-${index}`}
                                    checked={field.required}
                                    onCheckedChange={(checked) => updateField(index, "required", checked)}
                                  />
                                  <Label 
                                    htmlFor={`required-${index}`}
                                    className="text-xs font-medium text-gray-700 cursor-pointer"
                                  >
                                    Required Field
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/admin/projects/${propProjectId}/dashboard/forms/list`)}
                    className="h-9"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitCreateForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                    disabled={!formName || formFields.length === 0}
                  >
                    {React.createElement(FileText as any, { className: "h-4 w-4 mr-2" })}
                    Create Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Responses Page - Show directly if projectId is provided and viewMode is responses */}
      {propProjectId && viewMode === "responses" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Form Responses</h1>
              <p className="text-gray-500 mt-2">View all submissions for your forms</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate(`/admin/projects/${propProjectId}/dashboard/forms/list`)}
            >
              Back to List
            </Button>
          </div>

          {/* Form Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Select Form</Label>
                <Select
                  value={selectedForm?._id || ""}
                  onValueChange={(formId) => {
                    const form = forms.find(f => f._id === formId);
                    if (form) {
                      setSelectedForm(form);
                      setResponsesPage(1);
                      fetchResponses(form._id, 1);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a form to view responses" />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map((form) => (
                      <SelectItem key={form._id} value={form._id}>
                        {form.name} {form.isEnabled ? "(Active)" : "(Inactive)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Responses Content */}
          {selectedForm && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedForm.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Total responses: {responsesTotal}
                      </p>
                    </div>
                  </div>

                  {loadingResponses ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-500">Loading responses...</p>
                    </div>
                  ) : responses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        {React.createElement(MessageSquare as any, { className: "h-8 w-8 text-gray-400" })}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inquiries</h3>
                      <p className="text-sm text-gray-500">
                        No inquiries have been submitted for this form yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {responses.map((response, index) => (
                          <Card key={response._id} className="border border-gray-200">
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b pb-2">
                                  <h4 className="font-semibold text-gray-700">
                                    Response #{responsesTotal - ((responsesPage - 1) * responsesLimit + index)}
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {new Date(response.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.entries(response.submittedData).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                      <label className="text-xs font-semibold text-gray-600 uppercase">
                                        {key.replace(/_/g, ' ')}
                                      </label>
                                      <div className="text-sm text-gray-800">
                                        {typeof value === 'string' && value.startsWith('/files/') ? (
                                          <a
                                            href={`${import.meta.env.VITE_API_BASE_URL || 'https://apis.smartlybuild.dev'}${value}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                          >
                                            {React.createElement(Eye as any, { className: "h-3 w-3" })}
                                            View File
                                          </a>
                                        ) : (
                                          <p className="break-words">{String(value) || '-'}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Pagination */}
                      {responsesTotalPages > 1 && (
                        <div className="mt-6">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => {
                                    if (responsesPage > 1 && selectedForm) {
                                      fetchResponses(selectedForm._id, responsesPage - 1);
                                    }
                                  }}
                                  className={responsesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                              {[...Array(responsesTotalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                  <PaginationLink
                                    onClick={() => {
                                      if (selectedForm) {
                                        fetchResponses(selectedForm._id, i + 1);
                                      }
                                    }}
                                    isActive={responsesPage === i + 1}
                                    className="cursor-pointer"
                                  >
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => {
                                    if (responsesPage < responsesTotalPages && selectedForm) {
                                      fetchResponses(selectedForm._id, responsesPage + 1);
                                    }
                                  }}
                                  className={responsesPage === responsesTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No form selected state */}
          {!selectedForm && forms.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    {React.createElement(FileText as any, { className: "h-8 w-8 text-gray-400" })}
                  </div>
                  <p className="text-lg font-semibold mb-2">No forms available</p>
                  <p className="text-sm mb-4">Create a form first to view responses.</p>
                  <Button 
                    onClick={() => navigate(`/admin/projects/${propProjectId}/dashboard/forms/create`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
                    Create Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Forms List - Show directly if projectId is provided */}
      {propProjectId && viewMode === "list" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Forms</h1>
              <p className="text-gray-500 mt-2">Manage and track all your forms and queries</p>
            </div>
            <Button onClick={handleCreateForm} className="bg-blue-600 hover:bg-blue-700 text-white">
              {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
              Create Form
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search Skeleton */}
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  {/* Table Skeleton */}
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {!loading && (
            <>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  {React.createElement(Search as any, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" })}
                  <Input
                    type="text"
                    placeholder="Search forms by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <Select
                    value={searchTerm ? "all" : "all"}
                    onValueChange={(value) => {
                      // Filter by status if needed
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forms Table */}
          {forms.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    {React.createElement(FileText as any, { className: "h-8 w-8 text-blue-600" })}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No forms created yet</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Get started by creating your first form for this project
                  </p>
                  <Button onClick={handleCreateForm} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
                    Create New Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Fields</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms
                      .filter((form) =>
                        form.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((form) => (
                        <TableRow key={form._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              {React.createElement(FileText as any, { className: "h-4 w-4 text-blue-600" })}
                              <span>{form.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{form.fields.length} {form.fields.length === 1 ? 'field' : 'fields'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${form.isEnabled ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"} border`}>
                              {form.isEnabled ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {new Date(form.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleForm(form)}
                                className="h-8 text-xs"
                                title={form.isEnabled ? "Disable" : "Enable"}
                              >
                                {form.isEnabled ? (
                                  React.createElement(PowerOff as any, { className: "h-3 w-3" })
                                ) : (
                                  React.createElement(Power as any, { className: "h-3 w-3" })
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewResponses(form)}
                                className="h-8 text-xs"
                                title="View Responses"
                              >
                                {React.createElement(MessageSquare as any, { className: "h-3 w-3 mr-1" })}
                                Responses
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditForm(form)}
                                className="h-8 text-xs"
                                title="Edit"
                              >
                                {React.createElement(Edit as any, { className: "h-3 w-3" })}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteForm(form)}
                                className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                title="Delete"
                              >
                                {React.createElement(Trash2 as any, { className: "h-3 w-3" })}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </div>
      )}

      {/* Forms Dialog */}
      <Dialog open={showFormsDialog} onOpenChange={setShowFormsDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                {React.createElement(FileText as any, { className: "h-5 w-5 text-blue-600" })}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Forms for {selectedProject?.projectName}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Manage dynamic forms for this project. Only one form can be active at a time.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {forms.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  {React.createElement(FileText as any, { className: "h-8 w-8 text-blue-600" })}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No forms created yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Get started by creating your first form for this project
                </p>
                <Button onClick={handleCreateForm} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
                  Create New Form
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center space-x-2">
                    {React.createElement(FileText as any, { className: "h-4 w-4 text-blue-600" })}
                    <h3 className="text-sm font-semibold text-gray-700">
                      {forms.length} {forms.length === 1 ? 'Form' : 'Forms'} Available
                    </h3>
                  </div>
                  <Button 
                    onClick={handleCreateForm} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                  >
                    {React.createElement(Plus as any, { className: "h-3.5 w-3.5 mr-1.5" })}
                    Add Form
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {forms.map((form) => (
                    <Card key={form._id} className="border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Form Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1.5">
                                {React.createElement(FileText as any, { className: "h-4 w-4 text-blue-600 flex-shrink-0" })}
                                <h3 className="font-semibold text-sm text-gray-900 truncate">{form.name}</h3>
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-gray-500 ml-6">
                                <span className="flex items-center space-x-1">
                                  <span className="font-medium text-gray-700">{form.fields.length}</span>
                                  <span>{form.fields.length === 1 ? 'field' : 'fields'}</span>
                                </span>
                                <span>•</span>
                                <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Badge className={`${form.isEnabled ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"} text-xs px-2 py-0.5 border flex-shrink-0 ml-2`}>
                              {form.isEnabled ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant={form.isEnabled ? "outline" : "default"}
                              onClick={() => handleToggleForm(form)}
                              className={`h-7 text-xs ${form.isEnabled ? "border-gray-300 hover:bg-gray-50" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                            >
                              {form.isEnabled ? (
                                <>
                                  {React.createElement(PowerOff as any, { className: "h-3 w-3 mr-1" })}
                                  Disable
                                </>
                              ) : (
                                <>
                                  {React.createElement(Power as any, { className: "h-3 w-3 mr-1" })}
                                  Enable
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditForm(form)}
                              className="h-7 text-xs border-gray-300 hover:bg-gray-50"
                            >
                              {React.createElement(Edit as any, { className: "h-3 w-3 mr-1" })}
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewResponses(form)}
                              className="h-7 text-xs border-gray-300 hover:bg-gray-50 flex-1"
                            >
                              {React.createElement(MessageSquare as any, { className: "h-3 w-3 mr-1" })}
                              Responses
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteForm(form)}
                              className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                              {React.createElement(Trash2 as any, { className: "h-3 w-3" })}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Form Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                {React.createElement(Plus as any, { className: "h-5 w-5 text-blue-600" })}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Create New Form
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Define the fields for your dynamic form. Field names will be auto-generated from labels.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Form Name Section */}
            <div className="space-y-2">
              <Label htmlFor="formName" className="text-sm font-semibold text-gray-900">
                Form Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="formName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Contact Form, Inquiry Form"
                className="h-10"
              />
              <p className="text-xs text-gray-500">
                Give your form a descriptive name
              </p>
            </div>

            {/* Form Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center space-x-2">
                  {React.createElement(Layout as any, { className: "h-4 w-4 text-blue-600" })}
                  <Label className="text-sm font-semibold text-gray-900">
                    Form Fields
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    {formFields.length} {formFields.length === 1 ? 'field' : 'fields'}
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={addField}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                >
                  {React.createElement(Plus as any, { className: "h-3.5 w-3.5 mr-1.5" })}
                  Add Field
                </Button>
              </div>

              {formFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  {React.createElement(Layout as any, { className: "h-10 w-10 text-gray-400 mx-auto mb-3" })}
                  <p className="text-sm text-gray-500 mb-2">No fields added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Field" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formFields.map((field, index) => (
                    <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Field Header */}
                          <div className="flex items-center justify-between pb-2 border-b">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">Field {index + 1}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeField(index)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {React.createElement(X as any, { className: "h-4 w-4" })}
                            </Button>
                          </div>

                          {/* Field Inputs */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-gray-700">
                                Label <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={field.label}
                                onChange={(e) => updateField(index, "label", e.target.value)}
                                placeholder="e.g., Email Address"
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-gray-700">
                                Field Type
                              </Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => updateField(index, "type", value)}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="tel">Phone</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="textarea">Textarea</SelectItem>
                                  <SelectItem value="file">File Upload</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-gray-700">
                                Placeholder
                              </Label>
                              <Input
                                value={field.placeholder || ""}
                                onChange={(e) => updateField(index, "placeholder", e.target.value)}
                                placeholder="Optional"
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="flex items-center space-x-2 md:col-span-3 pt-1">
                              <Checkbox
                                id={`required-${index}`}
                                checked={field.required}
                                onCheckedChange={(checked) => updateField(index, "required", checked)}
                              />
                              <Label 
                                htmlFor={`required-${index}`}
                                className="text-xs font-medium text-gray-700 cursor-pointer"
                              >
                                Required Field
                              </Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              className="h-9"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitCreateForm}
              className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              disabled={!formName || formFields.length === 0}
            >
              {React.createElement(FileText as any, { className: "h-4 w-4 mr-2" })}
              Create Form
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
            <DialogDescription>
              Update the form fields. Field names will be auto-generated from labels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Form Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter form name"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Form Fields</label>
                <Button size="sm" onClick={addField}>
                        {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
                  Add Field
                </Button>
              </div>

              {formFields.map((field, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs">Label *</label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, "label", e.target.value)}
                          placeholder="e.g., Email Address"
                        />
                      </div>
                      <div>
                        <label className="text-xs">Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, "type", e.target.value)}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="number">Number</option>
                          <option value="textarea">Textarea</option>
                          <option value="file">File</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs">Placeholder</label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) => updateField(index, "placeholder", e.target.value)}
                          placeholder="Placeholder text"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, "required", e.target.checked)}
                        />
                        <label className="text-xs">Required</label>
                      </div>
                      <div className="col-span-2 flex justify-end items-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeField(index)}
                        >
                          {React.createElement(Trash2 as any, { className: "h-4 w-4 mr-2" })}
                          Remove Field
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitEditForm}>
                Update Form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form "{selectedForm?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteForm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Responses Dialog */}
      <Dialog open={showResponsesDialog} onOpenChange={setShowResponsesDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Form Responses - {selectedForm?.name}
            </DialogTitle>
            <DialogDescription>
              View all submissions for this form. Total responses: {responsesTotal}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingResponses ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading responses...</p>
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  {React.createElement(MessageSquare as any, { className: "h-8 w-8 text-gray-400" })}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inquiries</h3>
                <p className="text-sm text-gray-500">
                  No inquiries have been submitted for this form yet.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {responses.map((response, index) => (
                    <Card key={response._id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-semibold text-gray-700">
                              Response #{responsesTotal - ((responsesPage - 1) * responsesLimit + index)}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {new Date(response.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(response.submittedData).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase">
                                  {key.replace(/_/g, ' ')}
                                </label>
                                <div className="text-sm text-gray-800">
                                  {typeof value === 'string' && value.startsWith('/files/') ? (
                                    <a
                                      href={`${import.meta.env.VITE_API_BASE_URL || 'https://apis.smartlybuild.dev'}${value}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      {React.createElement(Eye as any, { className: "h-3 w-3" })}
                                      View File
                                    </a>
                                  ) : (
                                    <p className="break-words">{String(value) || '-'}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {responsesTotalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => {
                              if (responsesPage > 1 && selectedForm) {
                                fetchResponses(selectedForm._id, responsesPage - 1);
                              }
                            }}
                            className={responsesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {[...Array(responsesTotalPages)].map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => {
                                if (selectedForm) {
                                  fetchResponses(selectedForm._id, i + 1);
                                }
                              }}
                              isActive={responsesPage === i + 1}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => {
                              if (responsesPage < responsesTotalPages && selectedForm) {
                                fetchResponses(selectedForm._id, responsesPage + 1);
                              }
                            }}
                            className={responsesPage === responsesTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

