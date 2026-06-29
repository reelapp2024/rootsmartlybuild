import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Globe, Users, ShoppingCart, Clock } from "lucide-react";
import { http } from "../../config.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const websiteData = [
  { month: "Jan", websites: 45, users: 120 },
  { month: "Feb", websites: 52, users: 145 },
  { month: "Mar", websites: 48, users: 138 },
  { month: "Apr", websites: 67, users: 189 },
  { month: "May", websites: 85, users: 234 },
  { month: "Jun", websites: 92, users: 267 },
];

const aiModelUsage = [
  { name: "GPT-4", value: 45, color: "#3b82f6" },
  { name: "Claude", value: 30, color: "#10b981" },
  { name: "Gemini", value: 25, color: "#f59e0b" },
];

const recentActivity = [
  { id: 1, user: "john@example.com", action: "Generated website", time: "5 min ago" },
  { id: 2, user: "sarah@example.com", action: "Updated profile", time: "12 min ago" },
  { id: 3, user: "mike@example.com", action: "Generated website", time: "18 min ago" },
  { id: 4, user: "emma@example.com", action: "Deleted website", time: "25 min ago" },
];

export function DashboardOverview() {
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [totalThemesCount, setTotalThemesCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    try {
      // Fetch dashboard stats
      const statsResponse = await http.get("/getDashboardStats", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsResponse.status === 401) {
        toast.error("Invalid token");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (statsResponse.status === 200 && statsResponse.data?.data) {
        const { totalUsers, totalProjects, totalThemes } = statsResponse.data.data;
        setTotalUsersCount(totalUsers || 0);
        setTotalProjectsCount(totalProjects || 0);
        setTotalThemesCount(totalThemes || 0);
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      toast.error(
        err.response?.data?.message || "Error fetching dashboard data",
        { toastId: "dashboardError" }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Total Users (from API) */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl md:text-4xl font-bold">{totalUsersCount}</div>
            <p className="text-xs opacity-90 mt-1">Registered users</p>
          </CardContent>
        </Card>

        {/* Total Projects (from API) */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <Globe className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl md:text-4xl font-bold">{totalProjectsCount}</div>
            <p className="text-xs opacity-90 mt-1">Your projects</p>
          </CardContent>
        </Card>

        {/* Total Themes (from API) */}
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Themes</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl md:text-4xl font-bold">{totalThemesCount}</div>
            <p className="text-xs opacity-90 mt-1">Available themes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ... existing chart code ... */}
      </div>

      {/* Recent Activity & Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity & Notifications</span>
            </CardTitle>
            <button
              onClick={() => navigate("/admin/notifications")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>Notifications load only when you open the Notifications page.</p>
            <button
              type="button"
              onClick={() => navigate("/admin/notifications")}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Open Notifications
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
