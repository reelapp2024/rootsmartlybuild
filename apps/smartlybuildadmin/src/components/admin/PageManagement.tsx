import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash,
  Save,
  X,
  Link as LinkIcon,
  AlertCircle,
  Codesandbox,
  Eye,
  CheckCircle2,
  ArrowRightLeft,
  History,
  Search,
  EyeOff,
  Layout,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { http } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import { PageSeoSettingsDialog } from "./PageSeoSettingsDialog";
import { buildSiteNextJsPreviewUrl } from "@/lib/sitePreviewUrl";

interface WebsitePage {
  _id?: string;
  pageId?: string;
  name: string;
  slug: string;
  displayName: string;
  description?: string;
  hasSeo?: boolean;
  schemaCount?: number;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SlugHistoryEntry {
  slug: string;
  path: string;
  status: "live" | "redirect";
  statusCode: number;
  isCurrent: boolean;
  createdAt?: string;
}

interface SlugHistoryData {
  pageId: string;
  displayName: string;
  currentSlug: string;
  currentPath: string;
  history: SlugHistoryEntry[];
}

interface PageListCounts {
  total: number;
  live: number;
  inactive: number;
  redirects301: number;
}

export function PageManagement() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [listCounts, setListCounts] = useState<PageListCounts>({
    total: 0,
    live: 0,
    inactive: 0,
    redirects301: 0,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [slugHistory, setSlugHistory] = useState<SlugHistoryData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [seoDialogOpen, setSeoDialogOpen] = useState(false);
  const [seoPage, setSeoPage] = useState<WebsitePage | null>(null);
  const [togglingPageId, setTogglingPageId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState(""); // Unique identifier, non-changeable after creation
  const [formSlug, setFormSlug] = useState(""); // Changeable URL path
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Fetch pages
  useEffect(() => {
    if (projectId) {
      fetchPages(currentPage);
    }
  }, [projectId, currentPage]);

  useEffect(() => {
    const onSeoUpdated = () => {
      if (projectId) fetchPages(currentPage);
    };
    window.addEventListener("website-page-seo-updated", onSeoUpdated);
    return () => window.removeEventListener("website-page-seo-updated", onSeoUpdated);
  }, [projectId, currentPage]);

  const fetchPages = async (page = 1) => {
    if (!projectId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }

      const response = await http.get(`/getWebsitePages/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: pageLimit },
      });

      if (response.data?.data) {
        setPages(response.data.data);
      }
      const counts = response.data?.counts;
      if (counts) {
        setListCounts({
          total: Number(counts.total) || 0,
          live: Number(counts.live) || 0,
          inactive: Number(counts.inactive) || 0,
          redirects301: Number(counts.redirects301) || 0,
        });
      }
      const pagination = response.data?.pagination;
      if (pagination) {
        setTotalPages(Math.max(1, Number(pagination.totalPages) || 1));
      } else {
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("[PageManagement] Error fetching pages:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch pages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle create page
  const handleCreate = async () => {
    if (!formName || !formDisplayName) {
      toast({
        title: "Validation Error",
        description: "Page name (slug) and display name are required",
        variant: "destructive",
      });
      return;
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formName)) {
      toast({
        title: "Validation Error",
        description: "Page name (slug) must be lowercase, alphanumeric, and can contain hyphens only",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // For new pages, slug defaults to name if not provided
      const slugToUse = formSlug.trim() || formName.toLowerCase().trim();
      
      await http.post(
        "/upsertWebsitePage",
        {
          projectId: projectId,
          name: formName.toLowerCase().trim(), // Unique identifier
          slug: slugToUse, // URL path (can be different from name)
          displayName: formDisplayName.trim(),
          description: formDescription.trim() || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Success",
        description: "Page created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      setCurrentPage(1);
      fetchPages(1);
    } catch (error: any) {
      console.error("[PageManagement] Error creating page:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create page",
        variant: "destructive",
      });
    }
  };

  // Get page ID (supports both pageId and _id)
  const getPageId = (page: WebsitePage): string => {
    return page.pageId || page._id || '';
  };

  const handleTogglePagePublished = async (page: WebsitePage, isPublished: boolean) => {
    const pageId = getPageId(page);
    if (!projectId || !pageId) return;

    setTogglingPageId(pageId);
    try {
      const token = localStorage.getItem("token");
      await http.put(
        `/toggleWebsitePagePublished/${projectId}`,
        { pageId, isPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPages((prev) =>
        prev.map((p) =>
          getPageId(p) === pageId ? { ...p, isPublished } : p
        )
      );
      setListCounts((prev) => {
        const wasLive = page.isPublished !== false;
        if (wasLive === isPublished) return prev;
        return {
          ...prev,
          live: prev.live + (isPublished ? 1 : -1),
          inactive: prev.inactive + (isPublished ? -1 : 1),
        };
      });
      toast({
        title: isPublished ? "Page visible" : "Page hidden",
        description: isPublished
          ? "This page will appear on the live website."
          : "This page is hidden from the live website.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update page visibility",
        variant: "destructive",
      });
    } finally {
      setTogglingPageId(null);
    }
  };

  const fetchSlugHistory = async (pageId: string) => {
    if (!projectId || !pageId) return;

    try {
      setLoadingHistory(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await http.get(`/getPageSlugHistory/${projectId}/${pageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data) {
        setSlugHistory(response.data.data);
      } else {
        setSlugHistory(null);
      }
    } catch (error) {
      console.error("[PageManagement] Error fetching slug history:", error);
      setSlugHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEdit = (page: WebsitePage) => {
    setEditingPage(page);
    setFormName(page.name);
    setFormSlug(page.slug || page.name);
    setFormDisplayName(page.displayName);
    setFormDescription(page.description || "");
    setOriginalSlug(page.slug || page.name);
    setSlugHistory(null);
    setIsEditDialogOpen(true);
    fetchSlugHistory(getPageId(page));
  };

  // Handle update page
  const handleUpdate = async () => {
    if (!editingPage || !formDisplayName) {
      toast({
        title: "Validation Error",
        description: "Display name is required",
        variant: "destructive",
      });
      return;
    }

    // Validate slug format (if provided)
    if (formSlug.trim()) {
      const slugRegex = /^[a-z0-9\/-]+$/; // Allow slashes for nested paths like /services/service1
      const normalizedSlug = formSlug.trim().toLowerCase().replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
      if (!slugRegex.test(normalizedSlug)) {
        toast({
          title: "Validation Error",
          description: "Page slug must be lowercase, alphanumeric, and can contain hyphens and slashes only",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const newSlug = formSlug.trim().toLowerCase().replace(/^\/+|\/+$/g, '') || editingPage.slug || editingPage.name;
      const slugChanged = originalSlug !== newSlug;
      const pageIdToUse = getPageId(editingPage);

      await http.post(
        "/upsertWebsitePage",
        {
          projectId: projectId,
          pageId: pageIdToUse,
          name: editingPage.name,
          slug: newSlug,
          displayName: formDisplayName.trim(),
          description: formDescription.trim() || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (slugChanged && pageIdToUse) {
        toast({
          title: "Success",
          description: `Page updated. Old URL will permanently redirect (301) to /${newSlug}. Internal links were updated automatically.`,
        });
      } else {
        toast({
          title: "Success",
          description: "Page updated successfully",
        });
      }

      setIsEditDialogOpen(false);
      resetForm();
      fetchPages(currentPage);
    } catch (error: any) {
      console.error("[PageManagement] Error updating page:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update page",
        variant: "destructive",
      });
    }
  };

  // Handle delete page
  const handleDelete = async (page: WebsitePage) => {
    if (!confirm(`Are you sure you want to delete the page "${page.displayName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Note: You may need to add a delete endpoint in the backend
      // For now, we'll just show an error
      toast({
        title: "Not Implemented",
        description: "Page deletion is not yet implemented. Please contact support.",
        variant: "destructive",
      });

      // TODO: Implement delete endpoint
      // await http.delete(`/websitePage/${page._id}`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });

      // fetchPages();
    } catch (error: any) {
      console.error("[PageManagement] Error deleting page:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormDisplayName("");
    setFormDescription("");
    setEditingPage(null);
    setOriginalSlug("");
    setSlugHistory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Page Management</h1>
          <p className="text-sm text-gray-500">Manage website pages and their URLs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/admin/projects/${projectId}/dashboard`)} variant="outline">
            Back to Dashboard
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Total pages
            </CardDescription>
            <CardTitle className="text-3xl">{listCounts.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-green-700">
              <Eye className="h-4 w-4" />
              Live pages
            </CardDescription>
            <CardTitle className="text-3xl text-green-700">{listCounts.live}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-slate-600">
              <EyeOff className="h-4 w-4" />
              Inactive pages
            </CardDescription>
            <CardTitle className="text-3xl">{listCounts.inactive}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-amber-800">
              <ArrowRightLeft className="h-4 w-4" />
              301 redirects
            </CardDescription>
            <CardTitle className="text-3xl text-amber-800">{listCounts.redirects301}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website Pages</CardTitle>
          <CardDescription>
            Manage your website pages. Changing a page URL (slug) automatically updates internal links and creates a permanent 301 redirect from the old URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {listCounts.total === 0
                ? "No pages found. Create your first page to get started."
                : "No pages on this page. Try another page number."}
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>URL Slug</TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => {
                  const pageId = getPageId(page);
                  return (
                    <TableRow key={pageId}>
                      <TableCell className="font-medium">{page.displayName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-3 w-3 text-gray-400" />
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            /{page.slug || page.name}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        {page.hasSeo ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="secondary" className="text-xs">Configured</Badge>
                            {(page.schemaCount ?? 0) > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                {page.schemaCount} schema{(page.schemaCount ?? 0) === 1 ? "" : "s"}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Missing</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={page.isPublished !== false}
                            disabled={togglingPageId === pageId}
                            onCheckedChange={(checked) =>
                              handleTogglePagePublished(page, checked)
                            }
                            aria-label={`Toggle visibility for ${page.displayName}`}
                          />
                          {page.isPublished === false ? (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <EyeOff className="h-3 w-3" />
                              Hidden
                            </span>
                          ) : (
                            <span className="text-xs text-green-700">Live</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(page)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSeoPage(page);
                              setSeoDialogOpen(true);
                            }}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Edit SEO
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (projectId) {
                                window.open(
                                  buildSiteNextJsPreviewUrl(projectId, page.slug),
                                  "_blank"
                                );
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Unable to open Preview. Missing project or page ID.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const pageId = getPageId(page);
                              const token = localStorage.getItem("token");
                              if (projectId && pageId) {
                                const genieBuildUrl = token 
                                  ? `http://localhost:3000?projectId=${projectId}&pageId=${pageId}&token=${encodeURIComponent(token)}`
                                  : `http://localhost:3000?projectId=${projectId}&pageId=${pageId}`;
                                window.open(genieBuildUrl, '_blank');
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Unable to open GenieBuild. Missing project or page ID.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                          >
                            <Codesandbox className="h-3 w-3 mr-1" />
                            Open with GenieBuild
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(page)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} · {listCounts.total} total
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={
                          currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Create a new page for your website. The page name (slug) will be used in the URL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Page Name (Unique Identifier) *</Label>
              <Input
                id="create-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="about-us"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lowercase, alphanumeric, and hyphens only. This is a unique identifier and cannot be changed after creation.
              </p>
            </div>
            <div>
              <Label htmlFor="create-slug">URL Slug (Optional)</Label>
              <Input
                id="create-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\/-]/g, ""))}
                placeholder="about-us or about/about-us"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                The URL path for this page. Defaults to page name if not provided. Can include slashes for nested paths (e.g., /services/service1). This can be changed later.
              </p>
            </div>
            <div>
              <Label htmlFor="create-display">Display Name *</Label>
              <Input
                id="create-display"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                placeholder="About Us"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the name shown to users
              </p>
            </div>
            <div>
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Page description (optional)"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                <Save className="h-4 w-4 mr-2" />
                Create Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Update page details. Changing the URL slug creates a 301 redirect from the old URL and updates internal links automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <div className="space-y-4">
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                <History className="h-4 w-4" />
                URL slug history
              </div>
              {loadingHistory ? (
                <p className="text-sm text-slate-500">Loading slug history...</p>
              ) : slugHistory?.history?.length ? (
                <div className="max-h-48 space-y-2 overflow-y-auto overscroll-contain pr-1">
                  {slugHistory.history.map((entry) => (
                    <div
                      key={`${entry.slug}-${entry.status}-${entry.statusCode}`}
                      className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{entry.path}</code>
                        {entry.isCurrent ? (
                          <Badge className="bg-green-600 hover:bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Live · 200
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            <ArrowRightLeft className="mr-1 h-3 w-3" />
                            301 → {slugHistory.currentPath}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No slug history yet.</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-name">Page Name (Unique Identifier)</Label>
              <Input
                id="edit-name"
                value={formName}
                disabled
                className="mt-1 bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is a unique identifier and cannot be changed after creation.
              </p>
            </div>
            <div>
              <Label htmlFor="edit-slug">URL Slug (Changeable) *</Label>
              <Input
                id="edit-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\/-]/g, ""))}
                placeholder="about-us or about/about-us"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                The URL path for this page. Can include slashes for nested paths (e.g., /services/service1). Current URL: /{formSlug || formName}
              </p>
              {originalSlug !== formSlug && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Old URL <code>/{originalSlug}</code> will redirect with 301 to <code>/{formSlug || formName}</code>. Internal links will update automatically.
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit-display">Display Name *</Label>
              <Input
                id="edit-display"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                placeholder="About Us"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Page description (optional)"
                className="mt-1"
              />
            </div>
          </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4 sm:justify-end">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              <Save className="h-4 w-4 mr-2" />
              Update Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {projectId && seoPage && (
        <PageSeoSettingsDialog
          open={seoDialogOpen}
          onOpenChange={setSeoDialogOpen}
          projectId={projectId}
          pageId={getPageId(seoPage)}
          pageLabel={seoPage.displayName || seoPage.name}
        />
      )}
    </div>
  );
}

