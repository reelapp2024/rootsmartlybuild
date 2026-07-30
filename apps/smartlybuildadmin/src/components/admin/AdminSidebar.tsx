import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Zap,
  Menu,
  X,
  ListPlus,
  ListTodo,
  UserCog,
  Palette,
  Code2,
  Plug,
  Link,
  ExternalLink,
  FileText,
  Layout,
  Newspaper,
  FolderOpen,
  Tag,
  Tags,
  Coins,
  Server,
  MessageSquare,
  FileEdit,
  Bell,
  Building2,
  BarChart3,
  Calendar,
  Wrench,
  MapPin,
  Contact,
  Settings,
  Plus,
  CreditCard,
  Rocket,
  Eye,
  Globe,
  CheckCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { http } from "../../config.js";
import { GoogleSiteVerificationDialog } from "./GoogleSiteVerificationDialog";
import { clearWebsiteWizardStorageForRoute } from "./businesswebsiteSteps/businessWebsiteConfig";

interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

const CREATE_WIZARD_ROUTES = new Set([
  "/admin/bulk-pages-websites/create",
  "/admin/business-website/create",
  "/admin/content-websites/create",
]);

function navigateToCreateWizard(
  route: string,
  navigate: (path: string, options?: { state?: { isEditMode: boolean } }) => void
) {
  localStorage.removeItem("lastCreateProjectId");
  clearWebsiteWizardStorageForRoute(route);
  navigate(route, { state: { isEditMode: false } });
}

const getBaseSidebarItems = () => [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/admin" },
  {
    id: "projects",
    label: "Bulk Pages Websites",
    icon: ListTodo,
    submenu: [
      { id: "create-project", label: "Create", icon: ListPlus, route: "/admin/bulk-pages-websites/create" },
      { id: "project-list", label: "List", icon: ListTodo, route: "/admin/bulk-pages-websites/list" },
    ],
  },
  {
    id: "content-websites",
    label: "Content Websites",
    icon: Sparkles,
    submenu: [
      { id: "content-websites-create", label: "Create", icon: ListPlus, route: "/admin/content-websites/create" },
      { id: "content-websites-list", label: "List", icon: ListTodo, route: "/admin/content-websites/list" },
      { id: "content-websites-settings", label: "Settings", icon: Settings, route: "/admin/content-websites/settings" },
    ],
  },
  { id: "hosting", label: "Hosting", icon: Server, route: "/admin/hosting" },
  { id: "domains", label: "Domains", icon: Link, route: "/admin/domains" },

  {
    id: "subadmin",
    label: "Sub Admin",
    icon: UserCog,
    submenu: [{ id: "manage-subadmin", label: "Manage", icon: UserCog, route: "/admin/subadmin" }],
  },
  { id: "credits-usage", label: "Credits Usage", icon: Coins, route: "/admin/credits-usage" },
  { id: "subscription-plans", label: "Subscription Plans", icon: CreditCard, route: "/admin/subscription" },
  { id: "themes", label: "Themes", icon: Palette, route: "/admin/themes" },
  { 
    id: "plugins", 
    label: "Plugins", 
    icon: Plug,
    route: "/admin/plugins",
  },
  {
    id: "danger-zone",
    label: "Danger Zone",
    icon: AlertTriangle,
    route: "/admin/danger-zone",
  },
  { id: "forms", label: "Forms", icon: FileEdit, route: "/admin/forms" },
  { id: "notifications", label: "Notifications", icon: Bell, route: "/admin/notifications" },
  {
    id: "blog",
    label: "Blog",
    icon: Newspaper,
    submenu: [
      { id: "project-blogs", label: "Blog Projects", icon: Newspaper, route: "/admin/project-blogs" },
      { id: "all-blog-posts", label: "All Blog Posts", icon: FileText, route: "/admin/blog-posts" },
      { id: "blog-authors", label: "Blog Authors", icon: Users, route: "/admin/authors" },
    ],
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: MessageSquare,
    submenu: [
      { id: "reviews-approval", label: "Approval", icon: MessageSquare, route: "/admin/reviews" },
      { id: "generate-reviews", label: "Generate Reviews", icon: Tags, route: "/admin/fake-reviews" },
    ],
  },
];

const getContentManagementItems = () => [
  {
    id: "post-management",
    label: "Posts",
    icon: Newspaper,
    submenu: [
      { id: "posts", label: "All Posts", icon: Newspaper, route: "/admin/posts" },
      { id: "post-categories", label: "Categories", icon: FolderOpen, route: "/admin/post-categories" },
      { id: "post-subcategories", label: "Subcategories", icon: Tag, route: "/admin/post-subcategories" },
      { id: "post-tags", label: "Tags", icon: Tags, route: "/admin/post-tags" },
    ],
  },
  { id: "pages", label: "Pages", icon: Layout, route: "/admin/pages" },
  { id: "website-generator", label: "Website Generator", icon: FileText, route: "/admin/website-generator" },
];

export function AdminSidebar({ activeSection, setActiveSection, onCollapseChange }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Notify parent about collapse state changes
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [sidebarItems, setSidebarItems] = useState(getBaseSidebarItems());
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // State for dialogs
  const [verifyDialog, setVerifyDialog] = useState({ open: false, projectId: '', projectName: '', verificationCode: '', htmlFileName: '' });
  const [projectData, setProjectData] = useState<any>(null);

  // Fetch project data when on project dashboard
  useEffect(() => {
    // Check if we're on project dashboard - must match pattern: /admin/projects/:projectId/dashboard*
    const projectDashboardPattern = /^\/admin\/projects\/[^\/]+\/dashboard/;
    const isProjectDashboard = projectDashboardPattern.test(location.pathname);
    if (isProjectDashboard) {
      const projectIdMatch = location.pathname.match(/\/projects\/([^\/]+)/);
      const projectId = projectIdMatch ? projectIdMatch[1] : "";
      
      if (projectId) {
        const fetchProject = async () => {
          try {
            const token = localStorage.getItem("token");
            if (!token) return;
            
            const res = await http.post(
              "getUserProjects",
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
                params: { projectId },
              }
            );
            
            if (res.status === 200 && res.data.data) {
              const project = res.data.data.find((p: any) => p._id === projectId);
              if (project) {
                setProjectData(project);
              }
            }
          } catch (err) {
            console.error("Error fetching project data:", err);
          }
        };
        
        fetchProject();
      }
    } else {
      setProjectData(null);
    }
  }, [location.pathname]);

  // Handle Google Site Verification
  const handleGoogleSiteVerification = (projectId: string, projectName: string, currentVerificationCode = '', currentHtmlFileName = '') => {
    setVerifyDialog({ 
      open: true, 
      projectId, 
      projectName, 
      verificationCode: currentVerificationCode,
      htmlFileName: currentHtmlFileName
    });
  };

  // Handle Visit Live Site
  const handleVisitLiveSite = () => {
    if (!projectData?.domainName) {
      toast({
        title: "No Domain",
        description: "This project does not have a domain configured",
        variant: "destructive",
      });
      return;
    }

    let domainUrl = projectData.domainName;
    if (!domainUrl.startsWith('http://') && !domainUrl.startsWith('https://')) {
      domainUrl = `https://${domainUrl}`;
    }

    window.open(domainUrl, "_blank");
  };

  // Handle Visit Preview
  const handleVisitPreview = (projectId: string) => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is missing",
        variant: "destructive",
      });
      return;
    }
    const previewUrl = `http://localhost:8081/?siteId=${projectId}&projectId=${projectId}`;
    window.open(previewUrl, "_blank");
  };

  // Function to update sidebar items based on plugin status and route
  const updateSidebarItems = () => {
    // Check if we're on project dashboard - must match pattern: /admin/projects/:projectId/dashboard*
    const projectDashboardPattern = /^\/admin\/projects\/[^\/]+\/dashboard/;
    const isProjectDashboard = projectDashboardPattern.test(location.pathname);
    
    if (isProjectDashboard) {
      // Extract projectId from path
      const projectIdMatch = location.pathname.match(/\/projects\/([^\/]+)/);
      const projectId = projectIdMatch ? projectIdMatch[1] : "";
      
      // On project dashboard - show TOP KPIs menu items only if plugin active
      const isTopKpisActive = localStorage.getItem("top-kpis-plugin-active") === "true";
      
      // Start with Dashboard (always at top)
      const projectItems: any[] = [
        { id: "project-overview", label: "Dashboard", icon: LayoutDashboard, route: `/admin/projects/${projectId}/dashboard/overview` },
      ];
      
      if (isTopKpisActive) {
        // Add TOP KPIs as a parent menu with submenu
        const topKpisItem = {
          id: "top-kpis",
          label: "TOP KPIs",
          icon: BarChart3,
          submenu: [
            { id: "project-dashboard", label: "Dashboard", icon: BarChart3, route: `/admin/projects/${projectId}/dashboard` },
            { id: "project-leads", label: "Leads", icon: Users, route: `/admin/projects/${projectId}/dashboard/leads` },
            { id: "project-calendar", label: "Calendar", icon: Calendar, route: `/admin/projects/${projectId}/dashboard/calendar` },
            { id: "project-automations", label: "Follow-up Sequences", icon: Zap, route: `/admin/projects/${projectId}/dashboard/automations/follow-up` },
            { id: "project-settings", label: "Settings", icon: FileEdit, route: `/admin/projects/${projectId}/dashboard/settings/lead-engine` },
          ],
        };
        // Add TOP KPIs after Dashboard
        projectItems.push(topKpisItem);
      }
      
      // Pages, Header/Footer - Content Management
      projectItems.push(
        { id: "project-pages", label: "Pages", icon: Layout, route: `/admin/projects/${projectId}/dashboard/pages` },
        { id: "project-header-footer", label: "Header/Footer", icon: FileText, route: `/admin/projects/${projectId}/dashboard/header-footer` }
      );
      
      // Services, Locations, Forms, Blog, Reviews, Deploy - Core Features
      projectItems.push(
        { id: "project-services", label: "Services", icon: Wrench, route: `/admin/projects/${projectId}/dashboard/services` },
        { id: "project-locations", label: "Locations", icon: MapPin, route: `/admin/projects/${projectId}/dashboard/locations` },
        { id: "project-contact", label: "Contact Information", icon: Contact, route: `/admin/projects/${projectId}/dashboard/contact` },
        { id: "project-design", label: "Design", icon: Palette, route: `/admin/projects/${projectId}/dashboard/design` },
        { id: "project-additional-css", label: "Additional CSS", icon: Code2, route: `/admin/projects/${projectId}/dashboard/additional-css` },
        { 
          id: "project-forms", 
          label: "Forms", 
          icon: FileText, 
          submenu: [
            { id: "create-form", label: "Create Form", icon: Plus, route: `/admin/projects/${projectId}/dashboard/forms/create` },
            { id: "forms-list", label: "List", icon: FileText, route: `/admin/projects/${projectId}/dashboard/forms/list` },
            { id: "forms-responses", label: "Responses", icon: MessageSquare, route: `/admin/projects/${projectId}/dashboard/forms/responses` },
          ],
        },
        {
          id: "project-blog",
          label: "Blogs",
          icon: Newspaper,
          submenu: [
            { id: "project-blog-posts", label: "Blog Posts", icon: Newspaper, route: `/admin/projects/${projectId}/dashboard/blog-posts` },
            { id: "project-create-post", label: "Create Post", icon: Plus, route: `/admin/projects/${projectId}/dashboard/create-post` },
            { id: "project-create-post-ai", label: "Create with AI", icon: Sparkles, route: `/admin/projects/${projectId}/dashboard/create-post-ai` },
          ],
        },
        {
          id: "project-reviews",
          label: "Reviews",
          icon: MessageSquare,
          submenu: [
            { id: "project-reviews-approval", label: "Approval", icon: MessageSquare, route: `/admin/projects/${projectId}/dashboard/reviews` },
            { id: "project-generate-reviews", label: "Generate Reviews", icon: Tags, route: `/admin/projects/${projectId}/dashboard/fake-reviews` },
          ],
        },
        { id: "project-deploy", label: "Deploy", icon: Rocket, route: `/admin/projects/${projectId}/dashboard/deploy` }
      );
      
      // Verify and Visit - External Actions
      projectItems.push(
        { 
          id: "project-verify", 
          label: "Verify", 
          icon: CheckCircle, 
          action: "verify",
          projectId: projectId
        },
        {
          id: "project-visit",
          label: "Visit",
          icon: ExternalLink,
          submenu: [
            { 
              id: "visit-live", 
              label: "Live Site", 
              icon: Globe, 
              action: "visit-live",
              disabled: !projectData?.domainName
            },
            { 
              id: "visit-preview", 
              label: "Preview", 
              icon: Eye, 
              action: "visit-preview",
              projectId: projectId
            },
          ],
        }
      );
      
      // Project Settings - Always at the end
      projectItems.push(
        { id: "project-settings", label: "Project Settings", icon: Settings, route: `/admin/projects/${projectId}/dashboard/project-settings` }
      );
      
      setSidebarItems(projectItems);
      return;
    }
    
    // Regular sidebar for other pages
    const baseItems = getBaseSidebarItems();
    let newItems = [...baseItems];
    
    // Check if website generator plugin is active
    const isWebsiteGeneratorActive = localStorage.getItem("website-generator-plugin-active") === "true";
    if (isWebsiteGeneratorActive) {
      const websiteIndex = newItems.findIndex((item) => item.id === "websites");
      if (websiteIndex !== -1) {
        const contentItems = getContentManagementItems();
        newItems.splice(websiteIndex + 2, 0, ...contentItems);
      }
    }
    
    // Check if business website plugin is active
    const businessWebsiteStored = localStorage.getItem("business-website-plugin-active");
    const isBusinessWebsiteActive = businessWebsiteStored === null || businessWebsiteStored === "true";
    if (isBusinessWebsiteActive) {
      // Add Business Website menu item after projects
      const projectsIndex = newItems.findIndex((item) => item.id === "projects");
      if (projectsIndex !== -1) {
        const businessWebsiteItem = {
          id: "business-website",
          label: "Business Website",
          icon: Building2,
          submenu: [
            { id: "business-website-create", label: "Create", icon: ListPlus, route: "/admin/business-website/create" },
            { id: "business-website-list", label: "List", icon: ListTodo, route: "/admin/business-website/list" },
          ],
        };
        newItems.splice(projectsIndex + 1, 0, businessWebsiteItem);
      }
    }
    
    // TOP KPIs is only in project dashboard, not in main menu
    
    setSidebarItems(newItems);
  };

  // Check plugin status on component mount and route change
  useEffect(() => {
    updateSidebarItems();
  }, [location.pathname]);

    // Listen for storage events from other components
    useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "website-generator-plugin-active" || e.key === "business-website-plugin-active" || e.key === "top-kpis-plugin-active") {
          updateSidebarItems();
        }
      };

    // Also listen for custom events (for same-window updates)
    const handleCustomStorageChange = () => {
      updateSidebarItems();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("plugin-status-changed", handleCustomStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("plugin-status-changed", handleCustomStorageChange);
    };
  }, []);

  // Sync activeSection with current route
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find matching item in sidebar (exact route match only)
    const findMatchingItem = (items: any[]): { id: string | null; parentId: string | null } => {
      for (const item of items) {
        // Check if route matches exactly (not just starts with)
        if (item.route && currentPath === item.route) {
          return { id: item.id, parentId: null };
        }
        // Check submenu items
        if (item.submenu) {
          for (const subItem of item.submenu) {
            if (subItem.route && currentPath === subItem.route) {
              // Auto-expand parent submenu
              if (expandedSubmenu !== item.id) {
                setExpandedSubmenu(item.id);
              }
              return { id: subItem.id, parentId: item.id };
            }
          }
        }
      }
      return { id: null, parentId: null };
    };
    
    const { id: matchingId } = findMatchingItem(sidebarItems);
    // Only update if we found a match and it's different from current
    if (matchingId) {
      // Only update activeSection if it's different (to avoid unnecessary re-renders)
      // But for route-based items, we don't really need activeSection, route matching handles it
      if (matchingId !== activeSection) {
        setActiveSection(matchingId);
      }
    } else {
      // If no route matches, check if we're on dashboard
      // Only set dashboard if we're actually on the dashboard route
      if (currentPath === "/admin" || currentPath === "/") {
        if (activeSection !== "dashboard") {
          setActiveSection("dashboard");
        }
      } else {
        // If we're on a route that doesn't match any sidebar item, clear activeSection
        // This prevents dashboard from staying active
        if (activeSection === "dashboard") {
          setActiveSection("");
        }
      }
    }
  }, [location.pathname, sidebarItems]);

  const toggleSubmenu = (id: string) => {
    setExpandedSubmenu(expandedSubmenu === id ? null : id);
  };

  return (
    <div
      className={cn(
        "bg-gray-900 text-white transition-all duration-300 flex flex-col h-screen fixed left-0 top-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            {React.createElement(Zap as any, { className: "h-8 w-8 text-blue-400" })}
            <span className="text-xl font-bold">SmartlyBuild</span>
          </div>
        )}
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
          }}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isCollapsed 
            ? React.createElement(Menu as any, { className: "h-5 w-5" })
            : React.createElement(X as any, { className: "h-5 w-5" })
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon as React.ComponentType<{ className?: string }>;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuOpen = expandedSubmenu === item.id;
          
          // Check if current route matches this item's route (exact match only)
          const isRouteActive = item.route && location.pathname === item.route;
          // Check if any submenu item's route matches current route (exact match only)
          const isSubmenuRouteActive = hasSubmenu && item.submenu?.some((sub) => sub.route && location.pathname === sub.route);
          
          // For items with routes, ONLY use route matching (ignore activeSection)
          // For items without routes, use activeSection
          // IMPORTANT: Parent menu should NOT be active when submenu is active
          let isActive = false;
          if (item.route) {
            // Route-based items: only active if THIS item's route matches (not submenu)
            isActive = isRouteActive;
          } else if (hasSubmenu) {
            // Items with submenu: only active if THIS item's activeSection matches (not submenu items)
            isActive = activeSection === item.id;
          } else {
            // Non-route items without submenu: use activeSection
            isActive = activeSection === item.id;
          }

          return (
            <div key={item.id} className="space-y-1">
              {item.route && !hasSubmenu && !(item as any).comingSoon && !(item as any).action ? (
                <a
                  href={item.route}
                  onClick={(e) => {
                    e.preventDefault();
                    if (CREATE_WIZARD_ROUTES.has(item.route)) {
                      navigateToCreateWizard(item.route, navigate);
                    } else {
                      navigate(item.route);
                    }
                    setActiveSection(item.id);
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="flex-1">{item.label}</span>}
                </a>
              ) : (
                <button
                  onClick={() => {
                    if (hasSubmenu) {
                      toggleSubmenu(item.id);
                    } else if ((item as any).comingSoon) {
                      Swal.fire({
                        title: "Coming Soon!",
                        text: "This feature is under development and will be available soon.",
                        icon: "info",
                        confirmButtonColor: "#3085d6",
                        confirmButtonText: "OK",
                      });
                    } else if ((item as any).action === "verify") {
                      const projectId = (item as any).projectId || "";
                      const projectName = projectData?.projectName || "Project";
                      const verificationCode = projectData?.googleSiteVerification || "";
                      const htmlFileName = projectData?.googleSiteVerificationHtmlFile || "";
                      handleGoogleSiteVerification(projectId, projectName, verificationCode, htmlFileName);
                    } else if (item.route) {
                      if (CREATE_WIZARD_ROUTES.has(item.route)) {
                        navigateToCreateWizard(item.route, navigate);
                      } else {
                        navigate(item.route);
                      }
                      setActiveSection(item.id);
                    } else {
                      setActiveSection(item.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", (item as any).comingSoon && "opacity-60")} />
                  {!isCollapsed && (
                    <>
                      <span className={cn("flex-1", (item as any).comingSoon && "opacity-60")}>{item.label}</span>
                      {(item as any).comingSoon && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                      {hasSubmenu && (
                        <svg
                          className={`w-4 h-4 transition-transform ${isSubmenuOpen ? "rotate-180" : ""
                            }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      )}
                    </>
                  )}
                </button>
              )}

              {/* Submenu */}
              {!isCollapsed && hasSubmenu && isSubmenuOpen && (
                <div className="pl-11 space-y-1">
                  {item.submenu?.map((subItem) => {
                    const SubIcon = subItem.icon as React.ComponentType<{ className?: string }>;
                    // Check if current route matches this submenu item's route
                    const isSubItemRouteActive = subItem.route && location.pathname === subItem.route;
                    // Check if activeSection matches
                    const isSubItemActive = activeSection === subItem.id || isSubItemRouteActive;
                    
                    return (
                      subItem.route && !(subItem as any).action ? (
                        <a
                          key={subItem.id}
                          href={subItem.route}
                          onClick={(e) => {
                            e.preventDefault();
                            if (CREATE_WIZARD_ROUTES.has(subItem.route)) {
                              navigateToCreateWizard(subItem.route, navigate);
                            } else {
                              navigate(subItem.route);
                            }
                            setActiveSection(subItem.id);
                          }}
                          className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                            isSubItemActive
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          )}
                        >
                          <SubIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{subItem.label}</span>
                        </a>
                      ) : (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            if ((subItem as any).action === "visit-live") {
                              handleVisitLiveSite();
                            } else if ((subItem as any).action === "visit-preview") {
                              handleVisitPreview((subItem as any).projectId || "");
                            } else {
                              setActiveSection(subItem.id);
                            }
                          }}
                          disabled={(subItem as any).disabled}
                          className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                            isSubItemActive
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white",
                            (subItem as any).disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <SubIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{subItem.label}</span>
                        </button>
                      )
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Google Site Verification Dialog */}
      <GoogleSiteVerificationDialog
        open={verifyDialog.open}
        onOpenChange={(open) => setVerifyDialog(prev => ({ ...prev, open }))}
        projectId={verifyDialog.projectId}
        projectName={verifyDialog.projectName}
        currentVerificationCode={verifyDialog.verificationCode}
        currentHtmlFileName={verifyDialog.htmlFileName}
        onSuccess={() => {
          // Refresh project data after successful verification
          const projectIdMatch = location.pathname.match(/\/projects\/([^\/]+)/);
          const projectId = projectIdMatch ? projectIdMatch[1] : "";
          if (projectId) {
            const fetchProject = async () => {
              try {
                const token = localStorage.getItem("token");
                if (!token) return;
                
                const res = await http.post(
                  "getUserProjects",
                  {},
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { projectId },
                  }
                );
                
                if (res.status === 200 && res.data.data) {
                  const project = res.data.data.find((p: any) => p._id === projectId);
                  if (project) {
                    setProjectData(project);
                  }
                }
              } catch (err) {
                console.error("Error refreshing project data:", err);
              }
            };
            fetchProject();
          }
        }}
      />
    </div>
  );
}
