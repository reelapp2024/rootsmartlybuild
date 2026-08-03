
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { PostEditor } from "./components/admin/PostEditor";
import { UpdateProject } from "./components/admin/UpdateProject";
import Login from "./pages/Login";
import { AdminLayout } from "./components/admin/AdminLayout";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import CreateProject from "./pages/admin/CreateProject";
import Projects from "./pages/admin/Projects";
import Hosting from "./pages/admin/Hosting";
import Domains from "./pages/admin/Domains";

import SubAdmin from "./pages/admin/SubAdmin";
import Themes from "./pages/admin/Themes";
import Forms from "./pages/admin/Forms";
import Notifications from "./pages/admin/Notifications";

import CreateBlogPost from "./pages/admin/CreateBlogPost"
import CreateBlogPostAi from "./pages/admin/CreateBlogPostAi"

import EditBlogPost from "./pages/admin/EditBlogPost"


import Pages from "./pages/admin/Pages";
import Services from "./pages/admin/Services";
import Locations from "./pages/admin/Locations";
import ContactInformation from "./pages/admin/ContactInformation";
import Design from "./pages/admin/Design";
import AdditionalCss from "./pages/admin/AdditionalCss";
import WebsiteGenerator from "./pages/admin/WebsiteGenerator";
import Authors from "./pages/admin/Authors";
import Reviews from "./pages/admin/Reviews";
import FakeReviews from "./pages/admin/FakeReviews";
import BlogPosts from "./pages/admin/BlogPosts";
import ProjectBlogs from "./pages/admin/ProjectBlogs";
import { PluginManagement } from "./components/admin/PluginManagement";
import BusinessWebsite from "./pages/admin/BusinessWebsite";
import BusinessWebsiteList from "./pages/admin/BusinessWebsiteList";
import ContentWebsite from "./pages/admin/ContentWebsite";
import ContentWebsiteList from "./pages/admin/ContentWebsiteList";
import ContentWebsiteSettingsPage from "./pages/admin/ContentWebsiteSettings";
import ProjectSettings from "./pages/admin/ProjectSettings";
import Subscription from "./pages/admin/Subscription";
import ProfileSettings from "./pages/admin/ProfileSettings";
import ManageCredits from "./pages/admin/ManageCredits";
import CreditsUsageReport from "./pages/admin/CreditsUsageReport";
import TopKPIs from "./pages/admin/TopKPIs";
import TopKPIsLeads from "./pages/admin/TopKPIsLeads";
import Calendar from "./pages/admin/Calendar";
import FollowUpSequences from "./pages/admin/FollowUpSequences";
import LeadEngineSettings from "./pages/admin/LeadEngineSettings";
import ProjectDashboard from "./pages/admin/ProjectDashboard";
import ProjectForms from "./pages/admin/ProjectForms";
import ProjectOverview from "./pages/admin/ProjectOverview";
import Deploy from "./pages/admin/Deploy";
import HeaderFooter from "./pages/admin/HeaderFooter";
import { PageManagement } from "./components/admin/PageManagement";
import DangerZone from "./pages/admin/DangerZone";
import ProjectKeywords from "./pages/admin/ProjectKeywords";
import ProjectClusters from "./pages/admin/ProjectClusters";

const queryClient = new QueryClient();



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes with Layout */}
          <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/admin/top-kpis" element={<AdminLayout><TopKPIs /></AdminLayout>} />
          <Route path="/admin/top-kpis/leads" element={<AdminLayout><TopKPIsLeads /></AdminLayout>} />
          <Route path="/admin/top-kpis/calendar" element={<AdminLayout><Calendar /></AdminLayout>} />
          <Route path="/admin/top-kpis/automations/follow-up" element={<AdminLayout><FollowUpSequences /></AdminLayout>} />
          <Route path="/admin/top-kpis/settings/lead-engine" element={<AdminLayout><LeadEngineSettings /></AdminLayout>} />
          {/* Project Dashboard Routes - More specific routes first */}
          <Route path="/admin/projects/:projectId/dashboard/overview" element={<AdminLayout><ProjectOverview /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/leads" element={<AdminLayout><ProjectDashboard /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/calendar" element={<AdminLayout><ProjectDashboard /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/services" element={<AdminLayout><Services /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/locations" element={<AdminLayout><Locations /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/contact" element={<AdminLayout><ContactInformation /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/design" element={<AdminLayout><Design /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/additional-css" element={<AdminLayout><AdditionalCss /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/automations/follow-up" element={<AdminLayout><ProjectDashboard /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/settings/lead-engine" element={<AdminLayout><ProjectDashboard /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/project-settings" element={<AdminLayout><ProjectSettings /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/forms/list" element={<AdminLayout><ProjectForms /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/forms/create" element={<AdminLayout><ProjectForms /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/forms/responses" element={<AdminLayout><ProjectForms /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/blog-posts" element={<AdminLayout><BlogPosts /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/create-post" element={<AdminLayout><CreateBlogPost /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/create-post-ai" element={<AdminLayout><CreateBlogPostAi /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/edit-post" element={<AdminLayout><EditBlogPost /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/reviews" element={<AdminLayout><Reviews /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/fake-reviews" element={<AdminLayout><FakeReviews /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/deploy" element={<AdminLayout><Deploy /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/pages" element={<AdminLayout><PageManagement /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/header-footer" element={<AdminLayout><HeaderFooter /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/keywords" element={<AdminLayout><ProjectKeywords /></AdminLayout>} />
          <Route path="/admin/projects/:projectId/dashboard/clusters" element={<AdminLayout><ProjectClusters /></AdminLayout>} />
          {/* General project dashboard route - must come after all specific routes */}
          <Route path="/admin/projects/:projectId/dashboard" element={<AdminLayout><ProjectDashboard /></AdminLayout>} />
          <Route path="/admin/create-project" element={<AdminLayout><CreateProject /></AdminLayout>} />
          <Route path="/admin/projects" element={<AdminLayout><Projects /></AdminLayout>} />
          <Route path="/admin/project-list" element={<AdminLayout><Projects /></AdminLayout>} />
          <Route path="/admin/bulk-pages-websites" element={<AdminLayout><Projects /></AdminLayout>} />
          <Route path="/admin/bulk-pages-websites/list" element={<AdminLayout><Projects /></AdminLayout>} />
          <Route path="/admin/bulk-pages-websites/create" element={<AdminLayout><CreateProject /></AdminLayout>} />
          <Route path="/admin/hosting" element={<AdminLayout><Hosting /></AdminLayout>} />
          <Route path="/admin/domains" element={<AdminLayout><Domains /></AdminLayout>} />
    
          <Route path="/admin/subadmin" element={<AdminLayout><SubAdmin /></AdminLayout>} />
          <Route path="/admin/themes" element={<AdminLayout><Themes /></AdminLayout>} />
          <Route path="/admin/plugins" element={<AdminLayout><PluginManagement /></AdminLayout>} />
          <Route path="/admin/danger-zone" element={<AdminLayout><DangerZone /></AdminLayout>} />
          <Route path="/admin/business-website" element={<AdminLayout><BusinessWebsiteList /></AdminLayout>} />
          <Route path="/admin/business-website/list" element={<AdminLayout><BusinessWebsiteList /></AdminLayout>} />
          <Route path="/admin/business-website/create" element={<AdminLayout><BusinessWebsite /></AdminLayout>} />
          <Route path="/admin/content-websites" element={<AdminLayout><ContentWebsiteList /></AdminLayout>} />
          <Route path="/admin/content-websites/list" element={<AdminLayout><ContentWebsiteList /></AdminLayout>} />
          <Route path="/admin/content-websites/create" element={<AdminLayout><ContentWebsite /></AdminLayout>} />
          <Route path="/admin/content-websites/settings" element={<AdminLayout><ContentWebsiteSettingsPage /></AdminLayout>} />
          <Route path="/admin/forms" element={<AdminLayout><Forms /></AdminLayout>} />
          <Route path="/admin/notifications" element={<AdminLayout><Notifications /></AdminLayout>} />
      
  
   
          <Route path="/admin/pages" element={<AdminLayout><Pages /></AdminLayout>} />
          <Route path="/admin/services" element={<AdminLayout><Services /></AdminLayout>} />
          <Route path="/admin/website-generator" element={<AdminLayout><WebsiteGenerator /></AdminLayout>} />
           <Route path="/admin/authors" element={<AdminLayout><Authors /></AdminLayout>} />
           <Route path="/admin/reviews" element={<AdminLayout><Reviews /></AdminLayout>} />
           <Route path="/admin/fake-reviews" element={<AdminLayout><FakeReviews /></AdminLayout>} />
          <Route path="/admin/project-blogs" element={<AdminLayout><ProjectBlogs /></AdminLayout>} />
          <Route path="/admin/blog-posts" element={<AdminLayout><BlogPosts /></AdminLayout>} />
          <Route path="/admin/create-post" element={<AdminLayout><CreateBlogPost /></AdminLayout>} />
          <Route path="/admin/create-post-ai" element={<AdminLayout><CreateBlogPostAi /></AdminLayout>} />
          <Route path="/admin/edit-post" element={<AdminLayout><EditBlogPost /></AdminLayout>} />
          
          {/* Project and Post Editor Routes */}
          <Route path="/admin/project/:projectId/details" element={<AdminLayout><UpdateProject /></AdminLayout>} />
          <Route path="/admin/project/:projectId/settings" element={<AdminLayout><ProjectSettings /></AdminLayout>} />
          <Route path="/admin/subscription" element={<AdminLayout><Subscription /></AdminLayout>} />
          <Route path="/admin/profile" element={<AdminLayout><ProfileSettings /></AdminLayout>} />
          <Route path="/admin/credits" element={<AdminLayout><ManageCredits /></AdminLayout>} />
          <Route path="/admin/credits-usage" element={<AdminLayout><CreditsUsageReport /></AdminLayout>} />
          <Route path="/post-editor" element={<AdminLayout><PostEditor /></AdminLayout>} />
          <Route path="/post-editor/:postId" element={<AdminLayout><PostEditor /></AdminLayout>} />
          
          {/* Legacy Routes - Redirect to Admin */}
          <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />

          <Route path="/services/:projectId" element={<AdminLayout><Services /></AdminLayout>} />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
