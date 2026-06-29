import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, ArrowUp, ArrowDown, Plus, Send, Download, Clock, User, Phone, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function TopKPIs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Sample data - replace with actual API calls
  const newLeadsToday = 42;
  const newLeadsTrend = "+8.2%"; // vs last week
  const newLeadsTrendDirection = "up"; // "up" or "down"

  const hotLeadsCount = 15;
  const hotLeadsScore = 70; // threshold

  const bookedAppointmentsToday = 8;
  const bookedAppointmentsThisWeek = 24;

  const conversionRate = 18.5; // %
  const conversionTrend = "+2.3%"; // vs last period

  // Sample leads data - replace with actual API calls
  const recentLeads = [
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
    {
      id: 3,
      name: "Mike Davis",
      phone: "+1 (555) 345-6789",
      serviceType: "Electrical",
      score: 45,
      scoreType: "Cold",
      timeAgo: "12 mins ago"
    },
    {
      id: 4,
      name: "Emily Wilson",
      phone: "+1 (555) 456-7890",
      serviceType: "Plumbing",
      score: 92,
      scoreType: "Hot",
      timeAgo: "15 mins ago"
    },
    {
      id: 5,
      name: "David Brown",
      phone: "+1 (555) 567-8901",
      serviceType: "Roofing",
      score: 58,
      scoreType: "Warm",
      timeAgo: "18 mins ago"
    },
    {
      id: 6,
      name: "Lisa Anderson",
      phone: "+1 (555) 678-9012",
      serviceType: "HVAC",
      score: 78,
      scoreType: "Hot",
      timeAgo: "22 mins ago"
    },
    {
      id: 7,
      name: "Robert Taylor",
      phone: "+1 (555) 789-0123",
      serviceType: "Plumbing",
      score: 52,
      scoreType: "Warm",
      timeAgo: "28 mins ago"
    },
    {
      id: 8,
      name: "Jennifer Martinez",
      phone: "+1 (555) 890-1234",
      serviceType: "Electrical",
      score: 88,
      scoreType: "Hot",
      timeAgo: "35 mins ago"
    }
  ];

  // Handle card clicks
  const handleNewLeadsClick = () => {
    // Navigate to forms/leads page with today filter
    navigate("/admin/forms?filter=today");
  };

  const handleHotLeadsClick = () => {
    // Navigate to forms/leads page with score > 70 filter
    navigate("/admin/forms?filter=hot&score=70");
  };

  const handleAppointmentsClick = () => {
    // Navigate to appointments page
    navigate("/admin/forms?filter=appointments");
  };

  const handleConversionRateClick = () => {
    // Navigate to analytics or detailed conversion view
    navigate("/admin/top-kpis?view=conversion");
  };

  // Handle quick actions
  const handleAddLead = () => {
    navigate("/admin/forms?action=add-lead");
  };

  const handleSendQuickOffer = () => {
    navigate("/admin/forms?action=quick-offer");
  };

  const handleExportLeads = () => {
    // Export leads functionality
    console.log("Exporting leads...");
  };

  const handleOpenCalendar = () => {
    navigate("/admin/forms?filter=appointments");
  };

  // Handle lead detail panel
  const handleOpenLeadDetail = (leadId: number) => {
    // Open lead detail panel on right
    navigate(`/admin/forms?leadId=${leadId}&panel=detail`);
  };

  // Get badge color based on score type
  const getScoreBadgeColor = (scoreType: string) => {
    switch (scoreType) {
      case "Hot":
        return "bg-red-500 hover:bg-red-600";
      case "Warm":
        return "bg-orange-500 hover:bg-orange-600";
      case "Cold":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="px-0 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Quick Actions Bar Skeleton */}
        <div className="flex flex-wrap gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  return (
    <div className="px-0 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TOP KPIs</h1>
        <p className="text-gray-500 mt-2">Key Performance Indicators Dashboard</p>
      </div>

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
          <Calendar className="h-4 w-4 mr-2" />
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
            <div className="text-3xl font-bold mb-2">{newLeadsToday}</div>
            <div className="flex items-center space-x-2">
              {newLeadsTrendDirection === "up" ? (
                <ArrowUp className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                newLeadsTrendDirection === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {newLeadsTrend}
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
              Score &gt; {hotLeadsScore}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{hotLeadsCount}</div>
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
            <Calendar className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{bookedAppointmentsToday}</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Today</span>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm text-gray-600">{bookedAppointmentsThisWeek} This week</span>
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
            <div className="text-3xl font-bold mb-2">{conversionRate}%</div>
            <div className="flex items-center space-x-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                {conversionTrend}
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
          <CardDescription>Live Lead Feed - Latest leads from your system</CardDescription>
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
          </div>
        </CardContent>
      </Card>

      {/* Additional KPI Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Last 6 months overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart component will be added here
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Metrics</CardTitle>
            <CardDescription>Best performing KPIs this quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart component will be added here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

