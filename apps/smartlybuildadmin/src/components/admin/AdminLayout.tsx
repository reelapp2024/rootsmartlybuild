import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { NotificationBell } from "./NotificationBell";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut, User, Wallet, Coins, ChevronDown, CreditCard, RefreshCw } from "lucide-react";
import React from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { httpFile } from "../../config";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [adminProfile, setAdminProfile] = useState<{ email?: string; username?: string } | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const fetchCredits = async () => {
    try {
      setCreditsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await httpFile.post(
        "/wallet/v2/dashboard",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCredits(Number(res.data?.data?.wallet?.balance || 0));
    } catch (error) {
      console.warn("Could not fetch credits:", error);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Load admin profile from localStorage
  useEffect(() => {
    try {
      const profile = localStorage.getItem("adminProfile");
      if (profile) {
        setAdminProfile(JSON.parse(profile));
      }
    } catch (error) {
      console.error("Error loading admin profile:", error);
    }
  }, []);

  const handleSectionChange = (section: string) => {
    const routeMap: Record<string, string> = {
      "dashboard": "/admin",
      "create-project": "/admin/create-project",
      "project-list": "/admin/projects",
      "hosting": "/admin/hosting",
      "domains": "/admin/domains",
      "users": "/admin/users",
      "manage-subadmin": "/admin/subadmin",
      "credits-usage": "/admin/credits-usage",
      "subscription-plans": "/admin/subscription",
      "themes": "/admin/themes",
      "danger-zone": "/admin/danger-zone",
      "posts": "/admin/posts",
      "post-categories": "/admin/post-categories",
      "post-tags": "/admin/post-tags",
      "pages": "/admin/pages",
      "services": "/admin/services",
      "blog-posts": "/admin/blog-posts"
    };

    const route = routeMap[section];
    if (route) {
      navigate(route);
    }
  };

  // Get current section from URL
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === "/admin") return "dashboard";
    if (path === "/admin/create-project") return "create-project";
    if (path === "/admin/projects") return "project-list";
    if (path === "/admin/hosting") return "hosting";
    if (path === "/admin/domains") return "domains";
    if (path === "/admin/users") return "users";
    if (path === "/admin/subadmin") return "manage-subadmin";
    if (path === "/admin/credits-usage") return "credits-usage";
    if (path === "/admin/subscription") return "subscription-plans";
    if (path === "/admin/themes") return "themes";
    if (path === "/admin/danger-zone") return "danger-zone";
    if (path === "/admin/posts") return "posts";
    if (path === "/admin/post-categories") return "post-categories";
    if (path === "/admin/post-tags") return "post-tags";
    if (path === "/admin/pages") return "pages";
    if (path === "/admin/services") return "services";
    if (path === "/admin/blog-posts") return "blog-posts";
    return "dashboard";
  };

  // Logout handler
  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out.",
      icon: "warning",
      width: 420,
      padding: "1.25rem",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, log out!",
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear stored auth data
        localStorage.removeItem("token");
        localStorage.removeItem("Role");
        localStorage.removeItem("adminProfile");
        localStorage.clear();

        // Show a success toast
        Swal.fire({
          toast: true,
          icon: "success",
          title: "User logged out successfully!",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        // Navigate to login after toast disappears
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    });
  };

  // Get admin initials for avatar
  const getInitials = () => {
    if (adminProfile?.username) {
      return adminProfile.username.charAt(0).toUpperCase();
    }
    if (adminProfile?.email) {
      return adminProfile.email.charAt(0).toUpperCase();
    }
    return "A";
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900 flex flex-col font-poppins overflow-hidden">
      <AdminSidebar
        activeSection={getCurrentSection()}
        setActiveSection={handleSectionChange}
        onCollapseChange={setIsSidebarCollapsed}
      />
      
      {/* Fixed Top Header */}
      <header className={cn(
        "fixed top-0 right-0 left-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300",
        isSidebarCollapsed ? "left-16" : "left-64"
      )}>
        <div className="h-16 flex items-center justify-end px-6">
          {/* Right side - Credits, Notification, Profile & Logout */}
          <div className="flex items-center space-x-3">
            {/* Credits Display */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800">
              {React.createElement(Coins as any, { className: "h-4 w-4 text-blue-600 dark:text-blue-400" })}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">Credits</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {credits === null ? "—" : credits.toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={fetchCredits}
                disabled={creditsLoading}
                title="Refresh credits"
                className="ml-1 p-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50"
              >
                {React.createElement(RefreshCw as any, {
                  className: `h-4 w-4 ${creditsLoading ? "animate-spin" : ""}`,
                })}
              </button>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                  {adminProfile?.email || adminProfile?.username ? (
                    <span className="text-xs font-semibold text-white">{getInitials()}</span>
                  ) : (
                    React.createElement(User as any, { className: "h-4 w-4 text-white" })
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {adminProfile?.username || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {adminProfile?.email || "admin@example.com"}
                  </p>
                </div>
                {React.createElement(ChevronDown as any, { className: "h-4 w-4 text-gray-500" })}
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {adminProfile?.username || "Admin User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {adminProfile?.email || "admin@example.com"}
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate("/admin/profile");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate("/admin/subscription");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
                      >
                        {React.createElement(CreditCard as any, { className: "h-4 w-4" })}
                        Subscription
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate("/admin/credits");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
                      >
                        {React.createElement(Wallet as any, { className: "h-4 w-4" })}
                        Manage Credits
                      </button>
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center gap-2"
                      >
                        {React.createElement(LogOut as any, { className: "h-4 w-4" })}
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto transition-all duration-300 mt-16",
        isSidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-8 max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-800/20 min-h-[calc(100vh-8rem)]">
            <div className="p-8">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}