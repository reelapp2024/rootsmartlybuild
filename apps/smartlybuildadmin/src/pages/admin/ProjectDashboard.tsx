import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar as CalendarIcon, ArrowUp, ArrowDown, Plus, Send, Download, Clock, User, Phone, ExternalLink, ArrowLeft, BarChart3, Users, Zap, FileEdit, Wrench, Settings } from "lucide-react";
import { LeadDetailPanel } from "@/components/admin/LeadDetailPanel";
import { http } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopKPIsLeads from "./TopKPIsLeads";
import Calendar from "./Calendar";
import FollowUpSequences from "./FollowUpSequences";
import LeadEngineSettings from "./LeadEngineSettings";

export default function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isTopKpisPluginActive, setIsTopKpisPluginActive] = useState(true); // Default to true
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("ProjectDashboard Render - projectId:", projectId);
  console.log("ProjectDashboard Render - location.pathname:", location.pathname);
  console.log("ProjectDashboard Render - project:", project);
  console.log("ProjectDashboard Render - isTopKpisPluginActive:", isTopKpisPluginActive);
  console.log("ProjectDashboard Render - loading:", loading);

  // Sample KPI data - replace with actual API calls filtered by projectId
  const [kpis, setKpis] = useState({
    newLeadsToday: 0,
    newLeadsTrend: "+0%",
    newLeadsTrendDirection: "up" as "up" | "down",
    hotLeadsCount: 0,
    bookedAppointmentsToday: 0,
    bookedAppointmentsThisWeek: 0,
    conversionRate: 0,
    conversionTrend: "+0%",
  });

  // Sample leads data - replace with actual API calls
  const [recentLeads, setRecentLeads] = useState<any[]>([]);

  // Check if TOP KPIs plugin is enabled
  useEffect(() => {
    console.log("Checking plugin status...");
    const checkPluginStatus = () => {
      const pluginStatus = localStorage.getItem("top-kpis-plugin-active");
      console.log("Plugin status from localStorage:", pluginStatus);
      const isActive = pluginStatus === "true";
      console.log("Setting plugin active to:", isActive);
      setIsTopKpisPluginActive(isActive);
    };
    checkPluginStatus();
    // Set default to true if not set
    if (localStorage.getItem("top-kpis-plugin-active") === null) {
      console.log("Plugin status not set, defaulting to true");
      localStorage.setItem("top-kpis-plugin-active", "true");
      setIsTopKpisPluginActive(true);
    }
    // Listen for plugin status changes
    const handleStorageChange = () => checkPluginStatus();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("plugin-status-changed", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("plugin-status-changed", handleStorageChange);
    };
  }, []);

  // Determine active tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/leads")) setActiveTab("leads");
    else if (path.includes("/calendar")) setActiveTab("calendar");
    else if (path.includes("/automations")) setActiveTab("automations");
    else if (path.includes("/settings/lead-engine")) setActiveTab("settings");
    else setActiveTab("dashboard");
  }, [location.pathname]);

  // Fetch project details
  useEffect(() => {
    console.log("Fetching project data for projectId:", projectId);
    setLoading(true);
    setError(null);
    
    const fetchProject = async () => {
      try {
        console.log("Starting project fetch...");
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          setError("No authentication token found");
          toast({
            title: "Authentication Error",
            description: "No authentication token found",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        console.log("Fetching projects from API...");
        // Fetch project details
        const res = await http.post(
          "getUserProjects",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { projectId },
          }
        );

        console.log("API Response status:", res.status);
        console.log("API Response data:", res.data);

        if (res.status === 200 && res.data.data) {
          console.log("Projects found:", res.data.data.length);
          const projectData = res.data.data.find((p: any) => p._id === projectId);
          console.log("Matching project:", projectData);
          
          if (projectData) {
            console.log("Setting project data:", projectData);
            setProject(projectData);
          } else if (res.data.data.length > 0) {
            // If exact match not found, use first project or create default
            console.log("Exact match not found, using first project");
            setProject({
              _id: projectId,
              projectName: res.data.data[0].projectName || "Project",
              serviceType: res.data.data[0].serviceType || "Service",
              status: res.data.data[0].status || 2
            });
          } else {
            console.log("No projects found, setting default");
            setProject({
              _id: projectId,
              projectName: "Project",
              serviceType: "Service",
              status: 2
            });
          }
        } else {
          console.log("No data in response, setting default project");
          setProject({
            _id: projectId,
            projectName: "Project",
            serviceType: "Service",
            status: 2
          });
        }

        // TODO: Fetch project-specific KPIs
        // const kpiRes = await httpFile.post("getProjectKPIs", { projectId }, { headers: { Authorization: `Bearer ${token}` } });
        // setKpis(kpiRes.data);

        // TODO: Fetch project-specific leads
        // const leadsRes = await httpFile.post("getProjectLeads", { projectId }, { headers: { Authorization: `Bearer ${token}` } });
        // setRecentLeads(leadsRes.data);

        // Sample data for now - always set even if project not found
        console.log("Setting sample KPIs and leads data");
        setKpis({
          newLeadsToday: 12,
          newLeadsTrend: "+5.2%",
          newLeadsTrendDirection: "up",
          hotLeadsCount: 5,
          bookedAppointmentsToday: 3,
          bookedAppointmentsThisWeek: 15,
          conversionRate: 22.5,
          conversionTrend: "+3.1%",
        });

        setRecentLeads([
          {
            id: 1,
            name: "John Smith",
            phone: "+1 (555) 123-4567",
            serviceType: "Plumbing",
            score: 85,
            scoreType: "Hot",
            timeAgo: "2 mins ago"
          },
          {
            id: 2,
            name: "Sarah Johnson",
            phone: "+1 (555) 234-5678",
            serviceType: "HVAC",
            score: 65,
            scoreType: "Warm",
            timeAgo: "5 mins ago"
          },
        ]);

        setLoading(false);
        console.log("Project fetch completed successfully");
      } catch (err: any) {
        console.error("Error fetching project:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError(err.message || "Failed to load project data");
        
        // Set default project even on error
        console.log("Setting default project due to error");
        setProject({
          _id: projectId || "default",
          projectName: "Project",
          serviceType: "Service",
          status: 2
        });
        
        setKpis({
          newLeadsToday: 0,
          newLeadsTrend: "+0%",
          newLeadsTrendDirection: "up",
          hotLeadsCount: 0,
          bookedAppointmentsToday: 0,
          bookedAppointmentsThisWeek: 0,
          conversionRate: 0,
          conversionTrend: "+0%",
        });
        
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to load project data. Showing default view.",
          variant: "destructive",
        });
      }
    };

    if (projectId) {
      fetchProject();
    } else {
      console.log("No projectId, setting default project");
      setProject({
        _id: "default",
        projectName: "Project",
        serviceType: "Service",
        status: 2
      });
      setLoading(false);
    }
  }, [projectId, navigate, toast]);

  // Handle card clicks
  const handleNewLeadsClick = () => {
    setActiveTab("leads");
    navigate(`/admin/projects/${projectId}/dashboard/leads?filter=today`);
  };

  const handleHotLeadsClick = () => {
    setActiveTab("leads");
    navigate(`/admin/projects/${projectId}/dashboard/leads?filter=hot&score=70`);
  };

  const handleAppointmentsClick = () => {
    setActiveTab("calendar");
    navigate(`/admin/projects/${projectId}/dashboard/calendar?filter=appointments`);
  };

  const handleConversionRateClick = () => {
    setActiveTab("dashboard");
  };

  // Handle quick actions
  const handleAddLead = () => {
    setActiveTab("leads");
    navigate(`/admin/projects/${projectId}/dashboard/leads?action=add-lead`);
  };

  const handleSendQuickOffer = () => {
    setActiveTab("leads");
    navigate(`/admin/projects/${projectId}/dashboard/leads?action=quick-offer`);
  };

  const handleExportLeads = () => {
    console.log("Exporting leads for project:", projectId);
  };

  const handleOpenCalendar = () => {
    setActiveTab("calendar");
    navigate(`/admin/projects/${projectId}/dashboard/calendar`);
  };


  // Handle lead detail panel
  const handleOpenLeadDetail = (leadId: number) => {
    const lead = recentLeads.find(l => l.id === leadId);
    if (lead) {
      const leadData = {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        serviceType: lead.serviceType,
        city: "New York",
        score: lead.score,
        scoreType: lead.scoreType,
        status: "New",
        source: "Website",
        createdAt: new Date().toISOString()
      };
      setSelectedLead(leadData);
      setIsPanelOpen(true);
    }
  };

  // Get badge color based on score type
  const getScoreBadgeColor = (scoreType: string) => {
    switch (scoreType) {
      case "Hot":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "Warm":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "Cold":
        return "bg-gray-500 hover:bg-gray-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  console.log("Render check - project:", project, "loading:", loading, "error:", error);

  // Show loading state
  if (loading) {
    console.log("Showing loading state");
    return (
      <div className="px-0 py-6">
        {/* Quick Actions Bar Skeleton */}
        <div className="flex flex-wrap gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Leads Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error && !project) {
    console.log("Showing error state:", error);
    return (
      <div className="px-0 py-6 space-y-6">
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Ensure project exists
  if (!project) {
    console.log("No project data, setting default");
    const defaultProject = {
      _id: projectId || "default",
      projectName: "Project",
      serviceType: "Service",
      status: 2
    };
    setProject(defaultProject);
    return null; // Don't show anything while initializing
  }

  // If plugin is not active, show message but still show project info
  if (!isTopKpisPluginActive) {
    return (
      <div className="px-0 py-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">TOP KPIs plugin is not enabled. Please enable it from Plugins settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-0 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" onClick={() => navigate(`/admin/projects/${projectId}/dashboard`)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="leads" onClick={() => navigate(`/admin/projects/${projectId}/dashboard/leads`)}>
              <Users className="h-4 w-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="calendar" onClick={() => navigate(`/admin/projects/${projectId}/dashboard/calendar`)}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="automations" onClick={() => navigate(`/admin/projects/${projectId}/dashboard/automations/follow-up`)}>
              <Zap className="h-4 w-4 mr-2" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="settings" onClick={() => navigate(`/admin/projects/${projectId}/dashboard/settings/lead-engine`)}>
              <FileEdit className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <Button onClick={handleAddLead} variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead manually
              </Button>
              <Button onClick={handleSendQuickOffer} variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Send Quick Offer
              </Button>
              <Button onClick={handleExportLeads} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Leads
              </Button>
              <Button onClick={handleOpenCalendar} variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Open Calendar
              </Button>
            </div>

            {/* Top 4 Cards Row - Horizontal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* New Leads (Today) Card */}
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={handleNewLeadsClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    New Leads (Today)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{kpis.newLeadsToday}</div>
                  <div className="flex items-center space-x-2">
                    {kpis.newLeadsTrendDirection === "up" ? (
                      <ArrowUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      kpis.newLeadsTrendDirection === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {kpis.newLeadsTrend}
                    </span>
                    <span className="text-xs text-gray-500">vs last week</span>
                  </div>
                </CardContent>
              </Card>

              {/* Hot Leads Card */}
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={handleHotLeadsClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Hot Leads
                  </CardTitle>
                  <Badge className="bg-orange-500 hover:bg-orange-600">
                    Score &gt; 70
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{kpis.hotLeadsCount}</div>
                  <p className="text-xs text-gray-400">High priority leads</p>
                </CardContent>
              </Card>

              {/* Booked Appointments Card */}
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={handleAppointmentsClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Booked Appointments
                  </CardTitle>
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{kpis.bookedAppointmentsToday}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Today</span>
                    <span className="text-sm text-gray-400">/</span>
                    <span className="text-sm text-gray-600">{kpis.bookedAppointmentsThisWeek} This week</span>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Rate Card */}
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={handleConversionRateClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Conversion Rate (%)
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{kpis.conversionRate}%</div>
                  <div className="flex items-center space-x-2">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {kpis.conversionTrend}
                    </span>
                    <span className="text-xs text-gray-500">Leads → Bookings</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Lead Feed Section */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads (Real-time)</CardTitle>
                <CardDescription>Latest leads for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{lead.name}</p>
                            <Phone className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">{lead.phone}</p>
                          </div>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{lead.serviceType}</span>
                            <Badge className={getScoreBadgeColor(lead.scoreType)}>
                              {lead.scoreType}
                            </Badge>
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{lead.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOpenLeadDetail(lead.id)}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  ))}
                  {recentLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No leads found for this project
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-6">
          <TopKPIsLeads />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-6">
          <Calendar />
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="mt-6">
          <FollowUpSequences />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <LeadEngineSettings />
        </TabsContent>
      </Tabs>

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
      />
    </div>
  );
}
