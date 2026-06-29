import React, { useState, useEffect, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Edit,
  Trash,
  Power,
  PowerOff,
  ChevronRight,
  ChevronDown,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { httpFile, http } from "../../config.js";
import { pagePublicPath } from "@/utils/url";
import { useToast } from "@/hooks/use-toast";
import {
  FooterLayoutEditor,
  FooterLayoutConfig,
  getFooterLayoutFromItem,
} from "./FooterLayoutEditor";

interface MenuItem {
  id: string;
  name: string;
  url: string;
  pageId?: string;
  /** Catalog service id — submenu URL is resolved per area on the live site (read-only in admin). */
  serviceId?: string;
  linkPerArea?: boolean;
  icon?: string;
  target: string;
  order: number;
  children: MenuItem[];
  style: any;
}

interface Element {
  elementId: string;
  elementType: string;
  style: any;
  data: any;
  order: number;
  children: any[];
}

interface HeaderFooter {
  _id: string;
  projectId: string;
  userId: string;
  type: number;
  variant: string;
  status: string;
  logo: any;
  menu: MenuItem[];
  contactDetails: any;
  style: any;
  elementIds: Element[];
  settings: any;
  footerLayout?: FooterLayoutConfig;
  footerMarketing?: {
    tagline?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    ctaButtonText?: string;
    ctaButtonLink?: string;
  };
  dynamicItems?: {
    phones?: Array<{ value: string; is_primary?: boolean }>;
    emails?: Array<{ value: string; is_primary?: boolean }>;
    phone?: string;
    email?: string;
    address?: string;
    mainLocation?: string;
    socialLinks?: any[];
    navSources?: any;
    contactSettings?: {
      useAboutUsContact?: boolean;
      phoneDisplayMode?: "primary" | "all";
      emailDisplayMode?: "primary" | "all";
    };
  };
}

export function HeaderFooterManagement() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [headers, setHeaders] = useState<HeaderFooter[]>([]);
  const [footers, setFooters] = useState<HeaderFooter[]>([]);
  const [activeHeader, setActiveHeader] = useState<HeaderFooter | null>(null);
  const [activeFooter, setActiveFooter] = useState<HeaderFooter | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<HeaderFooter | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());
  const [editingMenuItem, setEditingMenuItem] = useState<{ path: string; item: MenuItem } | null>(null);
  const [pages, setPages] = useState<Array<{ pageId?: string; _id?: string; name: string; displayName: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch headers and footers
  useEffect(() => {
    if (projectId) {
      fetchHeadersFooters();
      fetchPages();
    }
  }, [projectId]);

  // Fetch available pages for the project
  const fetchPages = async () => {
    if (!projectId) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await http.get(`/getWebsitePages/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data) {
        setPages(response.data.data);
      }
    } catch (error: any) {
      console.error('[HeaderFooterManagement] Error fetching pages:', error);
    }
  };

  // Utility function to update menu URLs when a page slug changes
  // This can be called from other components when a page slug is updated
  const updateMenuUrlsForPage = async (pageId: string, newSlug: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await http.post(
        `/header-footer/update-menu-urls`,
        { pageId, newSlug },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh headers and footers to show updated URLs
      fetchHeadersFooters();
      
      toast({
        title: "Menu URLs Updated",
        description: `Menu items linked to this page have been updated to use the new slug: /${newSlug}`,
      });
    } catch (error: any) {
      console.error('[HeaderFooterManagement] Error updating menu URLs:', error);
      toast({
        title: "Error",
        description: "Failed to update menu URLs. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Expose the function globally so it can be called from other components
  useEffect(() => {
    (window as any).updateMenuUrlsForPage = updateMenuUrlsForPage;
    return () => {
      delete (window as any).updateMenuUrlsForPage;
    };
  }, [projectId]);

  const fetchHeadersFooters = async () => {
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

      // Fetch headers
      const headersRes = await http.get(`/header/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch footers
      const footersRes = await http.get(`/footer/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch active header
      try {
        const activeHeaderRes = await http.get(`/header/active/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActiveHeader(activeHeaderRes.data.data || null);
      } catch (e) {
        setActiveHeader(null);
      }

      // Fetch active footer
      try {
        const activeFooterRes = await http.get(`/footer/active/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActiveFooter(activeFooterRes.data.data || null);
      } catch (e) {
        setActiveFooter(null);
      }

      console.log('[HeaderFooterManagement] Fetch response:', {
        headersStatus: headersRes.status,
        headersData: headersRes.data,
        footersStatus: footersRes.status,
        footersData: footersRes.data,
      });

      if (headersRes.status === 200) {
        const headersData = headersRes.data?.data || headersRes.data;
        setHeaders(Array.isArray(headersData) ? headersData : []);
      }
      if (footersRes.status === 200) {
        const footersData = footersRes.data?.data || footersRes.data;
        setFooters(Array.isArray(footersData) ? footersData : []);
      }
    } catch (error: any) {
      console.error("Error fetching headers/footers:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch headers/footers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string, type: "header" | "footer") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const endpoint = type === "header" ? `/header/activate/${id}` : `/footer/activate/${id}`;
      await http.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Success",
        description: `${type === "header" ? "Header" : "Footer"} activated successfully`,
      });

      fetchHeadersFooters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to activate ${type}`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, type: "header" | "footer") => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const endpoint = type === "header" ? `/header/delete/${id}` : `/footer/delete/${id}`;
      await http.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Success",
        description: `${type === "header" ? "Header" : "Footer"} deleted successfully`,
      });

      fetchHeadersFooters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to delete ${type}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (item: HeaderFooter) => {
    const copy = JSON.parse(JSON.stringify(item)) as HeaderFooter;
    setEditingMenuItem(null);
    setExpandedMenuItems(new Set());
    setIsEditDialogOpen(true);

    try {
      const token = localStorage.getItem("token");
      if (!token || !projectId) {
        setEditingItem(copy);
        return;
      }
      const endpoint =
        item.type === 0 ? `/header/active/${projectId}` : `/footer/active/${projectId}`;
      const res = await http.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const enriched = res.data?.data;
      if (enriched) {
        const footerMarketing = enriched.footerMarketing || null;
        const footerLayout = getFooterLayoutFromItem({
          ...copy,
          footerLayout: enriched.footerLayout,
          footerMarketing,
          settings: enriched.settings ?? copy.settings,
          menu: enriched.menu ?? copy.menu,
        });
        const settings = {
          ...(enriched.settings ?? copy.settings),
          custom: {
            ...((enriched.settings ?? copy.settings)?.custom || {}),
            footer: footerLayout,
          },
        };
        setEditingItem({
          ...copy,
          menu: enriched.menu ?? copy.menu,
          contactDetails: enriched.contactDetails ?? copy.contactDetails,
          dynamicItems: enriched.dynamicItems,
          footerLayout,
          footerMarketing: footerMarketing || undefined,
          settings,
        } as HeaderFooter & { dynamicItems?: any });
        return;
      }
    } catch {
      // fall back to stored document
    }
    setEditingItem(copy);
  };

  const handleSave = async () => {
    if (!editingItem || isSaving) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsSaving(false);
        return;
      }

      const type = editingItem.type === 0 ? "header" : "footer";
      const endpoint = type === "header" ? `/header/update/${editingItem._id}` : `/footer/update/${editingItem._id}`;
      
      console.log('[HeaderFooterManagement] Updating:', {
        endpoint,
        editingItemId: editingItem._id,
        menu: editingItem.menu,
        menuLength: editingItem.menu?.length,
      });
      
      // Use http (JSON) instead of httpFile (multipart) for JSON data
      const response = await http.put(endpoint, {
        variant: editingItem.variant,
        logo: editingItem.logo,
        menu: editingItem.menu,
        contactDetails: editingItem.contactDetails,
        style: editingItem.style,
        elementIds: editingItem.elementIds,
        settings: editingItem.settings,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('[HeaderFooterManagement] Update response:', response.data);

      toast({
        title: "Success",
        description: `${type === "header" ? "Header" : "Footer"} updated successfully`,
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchHeadersFooters();
      
      // Dispatch event to notify header/footer components to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('headerFooterUpdated'));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuDragEnd = async (event: DragEndEvent, menuItems: MenuItem[], setMenuItems: (items: MenuItem[]) => void) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = menuItems.findIndex((item) => item.id === active.id);
    const newIndex = menuItems.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(menuItems, oldIndex, newIndex);
      // Update order numbers
      newItems.forEach((item, index) => {
        item.order = index;
      });
      setMenuItems(newItems);
      
      // Auto-save if editingItem exists
      if (editingItem) {
        const updatedItem = { ...editingItem, menu: newItems };
        setEditingItem(updatedItem);
        
        // Auto-save to database
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          
          const type = updatedItem.type === 0 ? "header" : "footer";
          const endpoint = type === "header" ? `/header/update/${updatedItem._id}` : `/footer/update/${updatedItem._id}`;
          
          await http.put(endpoint, {
            variant: updatedItem.variant,
            logo: updatedItem.logo,
            menu: updatedItem.menu,
            contactDetails: updatedItem.contactDetails,
            style: updatedItem.style,
            elementIds: updatedItem.elementIds,
            settings: updatedItem.settings,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Refresh data to reflect changes
          fetchHeadersFooters();
          
          // Dispatch event to notify header/footer components to refresh
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('headerFooterUpdated'));
          }
        } catch (error: any) {
          console.error("Error auto-saving menu reorder:", error);
          toast({
            title: "Warning",
            description: "Menu reordered but save failed. Please save manually.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleElementDragEnd = async (event: DragEndEvent) => {
    if (!editingItem) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const elementIds = [...editingItem.elementIds];
    const oldIndex = elementIds.findIndex((el) => el.elementId === active.id);
    const newIndex = elementIds.findIndex((el) => el.elementId === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newElements = arrayMove(elementIds, oldIndex, newIndex);
      newElements.forEach((el, index) => {
        el.order = index;
      });
      const updatedItem = { ...editingItem, elementIds: newElements };
      setEditingItem(updatedItem);
      
      // Auto-save to database
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const type = updatedItem.type === 0 ? "header" : "footer";
        const endpoint = type === "header" ? `/header/update/${updatedItem._id}` : `/footer/update/${updatedItem._id}`;
        
        await http.put(endpoint, {
          variant: updatedItem.variant,
          logo: updatedItem.logo,
          menu: updatedItem.menu,
          contactDetails: updatedItem.contactDetails,
          style: updatedItem.style,
          elementIds: updatedItem.elementIds,
          settings: updatedItem.settings,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Refresh data to reflect changes
        fetchHeadersFooters();
        
        // Dispatch event to notify header/footer components to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('headerFooterUpdated'));
        }
      } catch (error: any) {
        console.error("Error auto-saving element reorder:", error);
        toast({
          title: "Warning",
          description: "Elements reordered but save failed. Please save manually.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleMenuItemExpansion = (itemId: string) => {
    setExpandedMenuItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const updateMenuItem = async (path: string, updates: Partial<MenuItem>) => {
    if (!editingItem) return;

    const updateMenuRecursive = (menu: MenuItem[], currentPath: string = ""): MenuItem[] => {
      return menu.map((item) => {
        const itemPath = currentPath ? `${currentPath}.${item.id}` : item.id;
        
        if (itemPath === path) {
          const updatedItem = { ...item, ...updates };
          // Ensure pageId is valid - if it's not a valid ObjectId string, set to null
          if (updatedItem.pageId) {
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(updatedItem.pageId));
            if (!isValidObjectId) {
              console.warn('[updateMenuItem] Invalid pageId format, setting to null:', updatedItem.pageId);
              updatedItem.pageId = null;
            }
          }
          return updatedItem;
        }
        
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: updateMenuRecursive(item.children, itemPath),
          };
        }
        
        return item;
      });
    };

    const updatedMenu = updateMenuRecursive(editingItem.menu);
    const updatedItem = {
      ...editingItem,
      menu: updatedMenu,
    };
    setEditingItem(updatedItem);
    
    // Auto-save to database
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const type = updatedItem.type === 0 ? "header" : "footer";
      const endpoint = type === "header" ? `/header/update/${updatedItem._id}` : `/footer/update/${updatedItem._id}`;
      
      await http.put(endpoint, {
        variant: updatedItem.variant,
        logo: updatedItem.logo,
        menu: updatedItem.menu,
        contactDetails: updatedItem.contactDetails,
        style: updatedItem.style,
        elementIds: updatedItem.elementIds,
        settings: updatedItem.settings,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh data to reflect changes
      fetchHeadersFooters();
      
      // Dispatch event to notify header/footer components to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('headerFooterUpdated'));
      }
    } catch (error: any) {
      console.error("Error auto-saving menu item update:", error);
      toast({
        title: "Warning",
        description: "Menu item updated but save failed. Please save manually.",
        variant: "destructive",
      });
    }
  };

  const addChildMenuItem = (parentPath: string) => {
    if (!editingItem) return;

    const addChildRecursive = (menu: MenuItem[], currentPath: string = ""): MenuItem[] => {
      return menu.map((item) => {
        const itemPath = currentPath ? `${currentPath}.${item.id}` : item.id;
        
        if (itemPath === parentPath) {
          const newChild: MenuItem = {
            id: `menu-${Date.now()}`,
            name: "New Submenu",
            url: "#",
            icon: "",
            target: "_self",
            order: (item.children || []).length,
            children: [],
            style: {},
          };
          return {
            ...item,
            children: [...(item.children || []), newChild],
          };
        }
        
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: addChildRecursive(item.children, itemPath),
          };
        }
        
        return item;
      });
    };

    setEditingItem({
      ...editingItem,
      menu: addChildRecursive(editingItem.menu),
    });
  };

  const renderMenuItems = (items: MenuItem[], level: number = 0, parentPath: string = "") => {
    const sortedItems = [...items].sort((a, b) => a.order - b.order);
    
    return (
      <SortableContext
        items={sortedItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {sortedItems.map((item) => {
          const itemPath = parentPath ? `${parentPath}.${item.id}` : item.id;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenuItems.has(itemPath);
          const isEditing = editingMenuItem?.path === itemPath;

          return (
            <SortableMenuItem
              key={item.id}
              item={item}
              level={level}
              itemPath={itemPath}
              hasChildren={hasChildren}
              isExpanded={isExpanded}
              isEditing={isEditing}
              onToggleExpand={() => toggleMenuItemExpansion(itemPath)}
              onEdit={() => setEditingMenuItem({ path: itemPath, item })}
              pages={pages}
              onDelete={() => {
                if (editingItem) {
                  const updateMenu = (menu: MenuItem[]): MenuItem[] => {
                    return menu
                      .filter((m) => m.id !== item.id)
                      .map((m) => ({
                        ...m,
                        children: updateMenu(m.children || []),
                      }));
                  };
                  setEditingItem({
                    ...editingItem,
                    menu: updateMenu(editingItem.menu),
                  });
                }
              }}
              onAddChild={() => addChildMenuItem(itemPath)}
              onSaveEdit={(updates) => {
                updateMenuItem(itemPath, updates);
                setEditingMenuItem(null);
              }}
              onCancelEdit={() => setEditingMenuItem(null)}
            >
              {hasChildren && isExpanded && (
                <div className="mt-2 ml-6 border-l-2 border-gray-200 pl-4">
                  {renderMenuItems(item.children, level + 1, itemPath)}
                </div>
              )}
            </SortableMenuItem>
          );
        })}
      </SortableContext>
    );
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
          <h1 className="text-2xl font-bold">Header & Footer Management</h1>
          <p className="text-sm text-gray-500">Manage headers and footers for this project</p>
        </div>
        <Button onClick={() => navigate(`/admin/projects`)} variant="outline">
          Back to Projects
        </Button>
      </div>

      <Tabs defaultValue="headers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="footers">Footers</TabsTrigger>
        </TabsList>

        <TabsContent value="headers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Headers</CardTitle>
                  <CardDescription>Manage header variants for this project</CardDescription>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const userId = localStorage.getItem("userId");
                      if (!token || !projectId || !userId) return;

                      await http.post(
                        "/header-footer/create-default",
                        { projectId, userId, type: 0 },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      toast({
                        title: "Success",
                        description: "Default header created",
                      });
                      fetchHeadersFooters();
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.response?.data?.message || "Failed to create default header",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Default Header
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Menu Items</TableHead>
                    <TableHead>Elements</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header) => (
                    <TableRow key={header._id}>
                      <TableCell className="font-medium">Header {header.variant.toUpperCase()}</TableCell>
                      <TableCell>
                        <Badge variant={header.status === "active" ? "default" : "secondary"}>
                          {header.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{header.menu?.length || 0} items</TableCell>
                      <TableCell>{header.elementIds?.length || 0} elements</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {header.status !== "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(header._id, "header")}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(header)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(header._id, "header")}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {headers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No headers found. Create a default header to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Footers</CardTitle>
                  <CardDescription>Manage footer variants for this project</CardDescription>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const userId = localStorage.getItem("userId");
                      if (!token || !projectId || !userId) return;

                      await http.post(
                        "/header-footer/create-default",
                        { projectId, userId, type: 1 },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      toast({
                        title: "Success",
                        description: "Default footer created",
                      });
                      fetchHeadersFooters();
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.response?.data?.message || "Failed to create default footer",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Default Footer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Menu Items</TableHead>
                    <TableHead>Elements</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {footers.map((footer) => (
                    <TableRow key={footer._id}>
                      <TableCell className="font-medium">Footer {footer.variant.toUpperCase()}</TableCell>
                      <TableCell>
                        <Badge variant={footer.status === "active" ? "default" : "secondary"}>
                          {footer.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{footer.menu?.length || 0} items</TableCell>
                      <TableCell>{footer.elementIds?.length || 0} elements</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {footer.status !== "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(footer._id, "footer")}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(footer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(footer._id, "footer")}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {footers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No footers found. Create a default footer to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingItem?.type === 0 ? "Header" : "Footer"} {editingItem?.variant.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Edit menu items, elements, styles, and settings
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-6">
              {editingItem.type === 1 ? (
                <FooterLayoutEditor
                  layout={getFooterLayoutFromItem(editingItem)}
                  livePreview={editingItem.footerMarketing}
                  pages={pages}
                  navSources={editingItem.dynamicItems?.navSources}
                  onChange={(footerLayout) => {
                    setEditingItem({
                      ...editingItem,
                      footerLayout,
                      settings: {
                        ...editingItem.settings,
                        custom: {
                          ...(editingItem.settings?.custom || {}),
                          footer: footerLayout,
                        },
                      },
                    });
                  }}
                />
              ) : null}

              {editingItem.type === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Menu Items</CardTitle>
                  <CardDescription>Drag to reorder, click to expand/collapse nested items</CardDescription>
                </CardHeader>
                <CardContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => {
                      if (!editingItem) return;
                      const { active, over } = e;
                      if (!over || active.id === over.id) return;

                      const findAndMoveMenuItem = (menu: MenuItem[], activeId: string, overId: string): MenuItem[] => {
                        const activeIndex = menu.findIndex((item) => item.id === activeId);
                        const overIndex = menu.findIndex((item) => item.id === overId);

                        if (activeIndex !== -1 && overIndex !== -1) {
                          const newMenu = arrayMove(menu, activeIndex, overIndex);
                          newMenu.forEach((item, index) => {
                            item.order = index;
                          });
                          return newMenu;
                        }

                        // Try to find in children
                        return menu.map((item) => {
                          if (item.children && item.children.length > 0) {
                            return {
                              ...item,
                              children: findAndMoveMenuItem(item.children, activeId, overId),
                            };
                          }
                          return item;
                        });
                      };

                      const newMenu = findAndMoveMenuItem(
                        editingItem.menu,
                        active.id as string,
                        over.id as string
                      );
                      setEditingItem({ ...editingItem, menu: newMenu });
                    }}
                  >
                    <div className="space-y-2">
                      {renderMenuItems(editingItem.menu)}
                    </div>
                  </DndContext>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      const newItem: MenuItem = {
                        id: `menu-${Date.now()}`,
                        name: "New Menu Item",
                        url: "#",
                        icon: "",
                        target: "_self",
                        order: editingItem.menu.length,
                        children: [],
                        style: {},
                      };
                      setEditingItem({
                        ...editingItem,
                        menu: [...editingItem.menu, newItem],
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </CardContent>
              </Card>
              ) : null}

              {editingItem.type === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Elements</CardTitle>
                  <CardDescription>Drag to reorder elements</CardDescription>
                </CardHeader>
                <CardContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleElementDragEnd}
                  >
                    <SortableContext
                      items={editingItem.elementIds.map((el) => el.elementId)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {editingItem.elementIds
                          .sort((a, b) => a.order - b.order)
                          .map((element) => (
                            <SortableElement
                              key={element.elementId}
                              element={element}
                              onEdit={() => {
                                // Handle element edit
                              }}
                              onDelete={() => {
                                setEditingItem({
                                  ...editingItem,
                                  elementIds: editingItem.elementIds.filter(
                                    (el) => el.elementId !== element.elementId
                                  ),
                                });
                              }}
                            />
                          ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      const newElement: Element = {
                        elementId: `element-${Date.now()}`,
                        elementType: "text",
                        style: {},
                        data: { text: "New Element" },
                        order: editingItem.elementIds.length,
                        children: [],
                      };
                      setEditingItem({
                        ...editingItem,
                        elementIds: [...editingItem.elementIds, newElement],
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Element
                  </Button>
                </CardContent>
              </Card>
              ) : null}

              {/* Logo Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Logo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Logo URL</Label>
                    <Input
                      value={editingItem.logo?.url || ""}
                      onChange={(e) => {
                        setEditingItem({
                          ...editingItem,
                          logo: { ...editingItem.logo, url: e.target.value },
                        });
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Width</Label>
                      <Input
                        type="number"
                        value={editingItem.logo?.width || 150}
                        onChange={(e) => {
                          setEditingItem({
                            ...editingItem,
                            logo: { ...editingItem.logo, width: parseInt(e.target.value) || 150 },
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Height</Label>
                      <Input
                        type="number"
                        value={editingItem.logo?.height || 50}
                        onChange={(e) => {
                          setEditingItem({
                            ...editingItem,
                            logo: { ...editingItem.logo, height: parseInt(e.target.value) || 50 },
                          });
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                  <CardDescription>
                    Menu and dropdowns sync from your pages. Contact can pull from About Us.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label>Use About Us contact</Label>
                      <Switch
                        checked={
                          editingItem.settings?.custom?.useAboutUsContact !== false
                        }
                        onCheckedChange={(checked) => {
                          setEditingItem({
                            ...editingItem,
                            settings: {
                              ...editingItem.settings,
                              custom: {
                                ...(editingItem.settings?.custom || {}),
                                useAboutUsContact: checked,
                              },
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Phones on site</Label>
                        <select
                          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={
                            editingItem.settings?.custom?.phoneDisplayMode === "all"
                              ? "all"
                              : "primary"
                          }
                          onChange={(e) => {
                            setEditingItem({
                              ...editingItem,
                              settings: {
                                ...editingItem.settings,
                                custom: {
                                  ...(editingItem.settings?.custom || {}),
                                  phoneDisplayMode: e.target.value as "primary" | "all",
                                },
                              },
                            });
                          }}
                        >
                          <option value="primary">Primary phone only</option>
                          <option value="all">All phones</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Emails on site</Label>
                        <select
                          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={
                            editingItem.settings?.custom?.emailDisplayMode === "all"
                              ? "all"
                              : "primary"
                          }
                          onChange={(e) => {
                            setEditingItem({
                              ...editingItem,
                              settings: {
                                ...editingItem.settings,
                                custom: {
                                  ...(editingItem.settings?.custom || {}),
                                  emailDisplayMode: e.target.value as "primary" | "all",
                                },
                              },
                            });
                          }}
                        >
                          <option value="primary">Primary email only</option>
                          <option value="all">All emails</option>
                        </select>
                      </div>
                    </div>
                    {editingItem.dynamicItems && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {editingItem.dynamicItems.phones?.length ? (
                          <p>
                            Phones:{" "}
                            {editingItem.dynamicItems.phones.map((p) => p.value).join(", ")}
                          </p>
                        ) : null}
                        {editingItem.dynamicItems.emails?.length ? (
                          <p>
                            Emails:{" "}
                            {editingItem.dynamicItems.emails.map((e) => e.value).join(", ")}
                          </p>
                        ) : null}
                        {editingItem.dynamicItems.address ? (
                          <p>Address: {editingItem.dynamicItems.address}</p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Phone</Label>
                    <Switch
                      checked={editingItem.contactDetails?.phone?.enabled || false}
                      onCheckedChange={(checked) => {
                        setEditingItem({
                          ...editingItem,
                          contactDetails: {
                            ...editingItem.contactDetails,
                            phone: {
                              ...editingItem.contactDetails?.phone,
                              enabled: checked,
                            },
                          },
                        });
                      }}
                    />
                  </div>
                  {editingItem.contactDetails?.phone?.enabled && (
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={editingItem.contactDetails?.phone?.number || ""}
                        onChange={(e) => {
                          setEditingItem({
                            ...editingItem,
                            contactDetails: {
                              ...editingItem.contactDetails,
                              phone: {
                                ...editingItem.contactDetails.phone,
                                number: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label>Email</Label>
                    <Switch
                      checked={editingItem.contactDetails?.email?.enabled || false}
                      onCheckedChange={(checked) => {
                        setEditingItem({
                          ...editingItem,
                          contactDetails: {
                            ...editingItem.contactDetails,
                            email: {
                              ...editingItem.contactDetails?.email,
                              enabled: checked,
                            },
                          },
                        });
                      }}
                    />
                  </div>
                  {editingItem.contactDetails?.email?.enabled && (
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        value={editingItem.contactDetails?.email?.address || ""}
                        onChange={(e) => {
                          setEditingItem({
                            ...editingItem,
                            contactDetails: {
                              ...editingItem.contactDetails,
                              email: {
                                ...editingItem.contactDetails.email,
                                address: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingItem.type === 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Sticky Header</Label>
                        <Switch
                          checked={editingItem.settings?.sticky || false}
                          onCheckedChange={(checked) => {
                            setEditingItem({
                              ...editingItem,
                              settings: {
                                ...editingItem.settings,
                                sticky: checked,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Transparent Header</Label>
                        <Switch
                          checked={editingItem.settings?.transparent || false}
                          onCheckedChange={(checked) => {
                            setEditingItem({
                              ...editingItem,
                              settings: {
                                ...editingItem.settings,
                                transparent: checked,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Mobile Menu (Hamburger Icon)</Label>
                          <p className="text-sm text-gray-500 mt-1">
                            Show hamburger menu icon for mobile navigation
                          </p>
                        </div>
                        <Switch
                          checked={editingItem.settings?.mobileMenuEnabled !== false}
                          onCheckedChange={(checked) => {
                            setEditingItem({
                              ...editingItem,
                              settings: {
                                ...editingItem.settings,
                                mobileMenuEnabled: checked,
                              },
                            });
                          }}
                        />
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <Label>Show on Mobile</Label>
                    <Switch
                      checked={editingItem.settings?.showOnMobile !== false}
                      onCheckedChange={(checked) => {
                        setEditingItem({
                          ...editingItem,
                          settings: {
                            ...editingItem.settings,
                            showOnMobile: checked,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show on Tablet</Label>
                    <Switch
                      checked={editingItem.settings?.showOnTablet !== false}
                      onCheckedChange={(checked) => {
                        setEditingItem({
                          ...editingItem,
                          settings: {
                            ...editingItem.settings,
                            showOnTablet: checked,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show on Desktop</Label>
                    <Switch
                      checked={editingItem.settings?.showOnDesktop !== false}
                      onCheckedChange={(checked) => {
                        setEditingItem({
                          ...editingItem,
                          settings: {
                            ...editingItem.settings,
                            showOnDesktop: checked,
                          },
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sortable Menu Item Component
function SortableMenuItem({
  item,
  level,
  itemPath,
  hasChildren,
  isExpanded,
  isEditing,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  onSaveEdit,
  onCancelEdit,
  children,
  pages = [],
}: {
  item: MenuItem;
  level: number;
  itemPath: string;
  hasChildren: boolean;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onSaveEdit: (updates: Partial<MenuItem>) => void;
  onCancelEdit: () => void;
  children?: React.ReactNode;
  pages?: Array<{ _id: string; name: string; displayName: string }>;
}) {
  const [editName, setEditName] = useState(item.name);
  const [editUrl, setEditUrl] = useState(item.url);
  const [editPageId, setEditPageId] = useState(item.pageId || '');

  useEffect(() => {
    if (isEditing) {
      setEditName(item.name);
      setEditUrl(item.url);
      setEditPageId(item.pageId || '');
    }
  }, [isEditing, item.name, item.url, item.pageId]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCatalogServiceEntry = Boolean(item.linkPerArea || item.serviceId);

  const handleSave = () => {
    if (isCatalogServiceEntry) {
      onSaveEdit({
        name: editName,
        url: item.url || '#',
        pageId: undefined,
        serviceId: item.serviceId,
        linkPerArea: true,
      });
      return;
    }

    let validPageId = undefined;
    if (editPageId && editPageId.trim()) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(editPageId.trim());
      if (isValidObjectId) {
        validPageId = editPageId.trim();
      } else {
        console.warn('[SortableMenuItem] Invalid pageId format, ignoring:', editPageId);
      }
    }

    onSaveEdit({
      name: editName,
      url: editUrl,
      pageId: validPageId,
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${level > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""}`}
    >
      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {isEditing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Menu Name"
              className="h-8"
            />
            {isCatalogServiceEntry ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
                This service link is resolved per area on the live site. Reorder it under Services;
                the URL is not fixed to one page.
              </p>
            ) : (
              <>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Link to Page (Optional)</Label>
                  <select
                    value={editPageId}
                    onChange={(e) => {
                      const selectedPageId = e.target.value;
                      setEditPageId(selectedPageId);
                      if (selectedPageId) {
                        const selectedPage = pages.find(p => (p.pageId || p._id) === selectedPageId);
                        if (selectedPage) {
                          setEditUrl(pagePublicPath(selectedPage));
                        }
                      }
                    }}
                    className="w-full h-8 px-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">-- Manual URL --</option>
                    {pages.map((page) => {
                      const pageIdValue = page.pageId || page._id;
                      return (
                        <option key={pageIdValue} value={pageIdValue}>
                          {page.displayName || page.name} ({page.name})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="URL (auto-filled if page selected)"
                  className="h-8"
                />
                {editPageId && (
                  <p className="text-xs text-blue-600">
                    ✓ Linked to page — URL will auto-update if page slug changes
                  </p>
                )}
              </>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              {!isCatalogServiceEntry && (
                <div className="text-xs text-gray-500">{item.url}</div>
              )}
              {isCatalogServiceEntry ? (
                <div className="text-xs text-emerald-700 mt-1">🔗 Linked to services per area</div>
              ) : item.pageId ? (
                <div className="text-xs text-blue-600 mt-1">🔗 Linked to page</div>
              ) : null}
            </div>
            {hasChildren && (
              <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onAddChild}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      </div>
      {hasChildren && isExpanded && children}
    </div>
  );
}

// Sortable Element Component
function SortableElement({
  element,
  onEdit,
  onDelete,
}: {
  element: Element;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.elementId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50"
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{element.elementType}</div>
        <div className="text-xs text-gray-500">{element.elementId}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        <Trash className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

