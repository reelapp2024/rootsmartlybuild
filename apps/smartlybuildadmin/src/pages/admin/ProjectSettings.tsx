import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { httpFile } from "../../config.js";
import { ArrowLeft, Upload, Image as ImageIcon, X, Code, Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Globe, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [logoDragActive, setLogoDragActive] = useState(false);
  const [faviconDragActive, setFaviconDragActive] = useState(false);
  const [headCode, setHeadCode] = useState<string>("");
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    github: "",
    website: "",
  });

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

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

        const res = await httpFile.get(`/getProject/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 200) {
          setProject(res.data.project || res.data);
          // Set previews if logo/favicon exist
          if (res.data.project?.logo || res.data.logo) {
            setLogoPreview(res.data.project?.logo || res.data.logo);
          }
          if (res.data.project?.favicon || res.data.favicon) {
            setFaviconPreview(res.data.project?.favicon || res.data.favicon);
          }
          // Set head code if exists
          if (res.data.project?.headCode || res.data.headCode) {
            setHeadCode(res.data.project?.headCode || res.data.headCode || "");
          }
          // Set maintenance mode
          if (res.data.project?.maintenanceMode !== undefined) {
            setMaintenanceMode(res.data.project.maintenanceMode || false);
          } else if (res.data.maintenanceMode !== undefined) {
            setMaintenanceMode(res.data.maintenanceMode || false);
          }
          // Set social links
          if (res.data.project?.socialLinks || res.data.socialLinks) {
            const links = res.data.project?.socialLinks || res.data.socialLinks || {};
            setSocialLinks({
              facebook: links.facebook || "",
              twitter: links.twitter || "",
              instagram: links.instagram || "",
              linkedin: links.linkedin || "",
              youtube: links.youtube || "",
              github: links.github || "",
              website: links.website || "",
            });
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch project details",
          variant: "destructive",
        });
      }
    };

    fetchProject();
  }, [projectId, navigate, toast]);

  // Validate and process logo file
  const processLogoFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file for logo",
        variant: "destructive",
      });
      return false;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo file size should be less than 5MB",
        variant: "destructive",
      });
      return false;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    return true;
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  // Handle logo drag and drop
  const handleLogoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setLogoDragActive(true);
    } else if (e.type === "dragleave") {
      setLogoDragActive(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  // Validate and process favicon file
  const processFaviconFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file for favicon",
        variant: "destructive",
      });
      return false;
    }
    // Validate file size (max 1MB for favicon)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Favicon file size should be less than 1MB",
        variant: "destructive",
      });
      return false;
    }
    setFaviconFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFaviconPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    return true;
  };

  // Handle favicon file selection
  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFaviconFile(file);
    }
  };

  // Handle favicon drag and drop
  const handleFaviconDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setFaviconDragActive(true);
    } else if (e.type === "dragleave") {
      setFaviconDragActive(false);
    }
  };

  const handleFaviconDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFaviconDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFaviconFile(file);
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Remove favicon
  const handleRemoveFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setLoading(true);
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

      // Check if there are any changes
      const hasFileChanges = logoFile || faviconFile;
      const hasHeadCodeChange = headCode !== (project?.headCode || "");
      const hasMaintenanceModeChange = maintenanceMode !== (project?.maintenanceMode || false);
      const hasSocialLinksChange = JSON.stringify(socialLinks) !== JSON.stringify(project?.socialLinks || {});
      
      if (!hasFileChanges && !hasHeadCodeChange && !hasMaintenanceModeChange && !hasSocialLinksChange) {
        toast({
          title: "No Changes",
          description: "Please make some changes before saving",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        let res;
        
        // If files are present, use FormData
        if (hasFileChanges) {
          const formData = new FormData();
          if (logoFile) {
            formData.append("logo", logoFile);
          }
          if (faviconFile) {
            formData.append("favicon", faviconFile);
          }
          // Add head code to FormData
          formData.append("headCode", headCode || "");
          formData.append("maintenanceMode", maintenanceMode.toString());
          formData.append("socialLinks", JSON.stringify(socialLinks));

          res = await httpFile.post(`/updateProjectSettings/${projectId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          // If only non-file data is changed, send as JSON
          res = await httpFile.post(
            `/updateProjectSettings/${projectId}`,
            { 
              headCode: headCode || "",
              maintenanceMode: maintenanceMode,
              socialLinks: socialLinks,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        }

        if (res.status === 200) {
          toast({
            title: "Success",
            description: "Settings updated successfully",
          });
          // Reset file states
          setLogoFile(null);
          setFaviconFile(null);
          // Update project state
          if (res.data.project) {
            setProject(res.data.project);
          }
          // Update previews with new URLs if returned
          if (res.data.logo) {
            setLogoPreview(res.data.logo);
          }
          if (res.data.favicon) {
            setFaviconPreview(res.data.favicon);
          }
          // Update head code if returned
          if (res.data.headCode !== undefined) {
            setHeadCode(res.data.headCode || "");
          } else if (res.data.project?.headCode !== undefined) {
            setHeadCode(res.data.project.headCode || "");
          }
          // Update maintenance mode
          if (res.data.maintenanceMode !== undefined) {
            setMaintenanceMode(res.data.maintenanceMode);
          } else if (res.data.project?.maintenanceMode !== undefined) {
            setMaintenanceMode(res.data.project.maintenanceMode);
          }
          // Update social links
          if (res.data.socialLinks) {
            setSocialLinks({
              facebook: res.data.socialLinks.facebook || "",
              twitter: res.data.socialLinks.twitter || "",
              instagram: res.data.socialLinks.instagram || "",
              linkedin: res.data.socialLinks.linkedin || "",
              youtube: res.data.socialLinks.youtube || "",
              github: res.data.socialLinks.github || "",
              website: res.data.socialLinks.website || "",
            });
          } else if (res.data.project?.socialLinks) {
            setSocialLinks({
              facebook: res.data.project.socialLinks.facebook || "",
              twitter: res.data.project.socialLinks.twitter || "",
              instagram: res.data.project.socialLinks.instagram || "",
              linkedin: res.data.project.socialLinks.linkedin || "",
              youtube: res.data.project.socialLinks.youtube || "",
              github: res.data.project.socialLinks.github || "",
              website: res.data.project.socialLinks.website || "",
            });
          }
        }
      } catch (submitError: any) {
        throw submitError;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // If we came from project dashboard, go back to dashboard
              const currentPath = window.location.pathname;
              if (currentPath.includes("/dashboard/")) {
                const projectIdMatch = currentPath.match(/\/projects\/([^\/]+)/);
                if (projectIdMatch) {
                  navigate(`/admin/projects/${projectIdMatch[1]}/dashboard`);
                } else {
                  navigate("/admin/projects");
                }
              } else {
                navigate("/admin/projects");
              }
            }}
            className="h-8 w-8 p-0"
          >
            {React.createElement(ArrowLeft as any, { className: "h-4 w-4" })}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              {project?.projectName || "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo and Favicon Upload in Single Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {React.createElement(ImageIcon as any, { className: "h-5 w-5 text-blue-600" })}
                Logo
              </CardTitle>
              <CardDescription className="text-sm">
                Recommended: 200x200px or higher • Max: 5MB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragEnter={handleLogoDrag}
                onDragLeave={handleLogoDrag}
                onDragOver={handleLogoDrag}
                onDrop={handleLogoDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                  logoDragActive
                    ? "border-blue-500 bg-blue-50 scale-105"
                    : logoPreview
                    ? "border-gray-200 bg-gray-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
              >
                {logoPreview ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-40 w-40 object-contain rounded-lg bg-white shadow-sm border border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full shadow-md"
                        onClick={handleRemoveLogo}
                      >
                        {React.createElement(X as any, { className: "h-4 w-4" })}
                      </Button>
                    </div>
                    {logoFile && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-700">{logoFile.name}</p>
                        <p className="text-xs text-gray-500">{(logoFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    {React.createElement(Upload as any, {
                      className: `h-12 w-12 ${logoDragActive ? "text-blue-600" : "text-gray-400"}`,
                    })}
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        {logoDragActive ? "Drop logo here" : "Drag & drop logo here"}
                      </p>
                      <p className="text-xs text-gray-500">or click to browse</p>
                    </div>
                  </div>
                )}
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                {!logoPreview && (
                  <Label
                    htmlFor="logo-upload"
                    className="absolute inset-0 cursor-pointer"
                  />
                )}
              </div>
              {logoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                >
                  {React.createElement(Upload as any, { className: "h-4 w-4 mr-2" })}
                  Change Logo
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Favicon Upload */}
          <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {React.createElement(ImageIcon as any, { className: "h-5 w-5 text-blue-600" })}
                Favicon
              </CardTitle>
              <CardDescription className="text-sm">
                Recommended: 32x32px or 16x16px • Max: 1MB • Formats: .ico, .png, .svg
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragEnter={handleFaviconDrag}
                onDragLeave={handleFaviconDrag}
                onDragOver={handleFaviconDrag}
                onDrop={handleFaviconDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                  faviconDragActive
                    ? "border-blue-500 bg-blue-50 scale-105"
                    : faviconPreview
                    ? "border-gray-200 bg-gray-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
              >
                {faviconPreview ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <img
                        src={faviconPreview}
                        alt="Favicon preview"
                        className="h-24 w-24 object-contain rounded-lg bg-white shadow-sm border border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full shadow-md"
                        onClick={handleRemoveFavicon}
                      >
                        {React.createElement(X as any, { className: "h-4 w-4" })}
                      </Button>
                    </div>
                    {faviconFile && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-700">{faviconFile.name}</p>
                        <p className="text-xs text-gray-500">{(faviconFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    {React.createElement(Upload as any, {
                      className: `h-12 w-12 ${faviconDragActive ? "text-blue-600" : "text-gray-400"}`,
                    })}
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        {faviconDragActive ? "Drop favicon here" : "Drag & drop favicon here"}
                      </p>
                      <p className="text-xs text-gray-500">or click to browse</p>
                    </div>
                  </div>
                )}
                <Input
                  id="favicon-upload"
                  type="file"
                  accept="image/*,.ico"
                  onChange={handleFaviconChange}
                  className="hidden"
                />
                {!faviconPreview && (
                  <Label
                    htmlFor="favicon-upload"
                    className="absolute inset-0 cursor-pointer"
                  />
                )}
              </div>
              {faviconPreview && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                  onClick={() => document.getElementById("favicon-upload")?.click()}
                >
                  {React.createElement(Upload as any, { className: "h-4 w-4 mr-2" })}
                  Change Favicon
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Custom Head Code Section */}
        <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {React.createElement(Code as any, { className: "h-5 w-5 text-blue-600" })}
              Custom Head Code
            </CardTitle>
            <CardDescription className="text-sm">
              Add custom code (scripts, meta tags, etc.) that will be injected into the HTML &lt;head&gt; section. Useful for Google Analytics, Facebook Pixel, custom meta tags, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="head-code" className="text-sm font-medium text-gray-700">
                Head Code
              </Label>
              <Textarea
                id="head-code"
                value={headCode}
                onChange={(e) => setHeadCode(e.target.value)}
                placeholder="<!-- Google Analytics -->&#10;&lt;script&gt;&#10;  // Your code here&#10;&lt;/script&gt;&#10;&#10;&lt;meta name=&quot;custom-meta&quot; content=&quot;value&quot;&gt;"
                className="min-h-[200px] font-mono text-sm"
                rows={10}
              />
              <p className="text-xs text-gray-500">
                Paste your HTML code here. It will be added to the &lt;head&gt; section of all pages.
              </p>
            </div>
            {headCode && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {headCode.length} characters
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setHeadCode("")}
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Mode Section */}
        <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {React.createElement(AlertCircle as any, { className: "h-5 w-5 text-blue-600" })}
              Maintenance Mode
            </CardTitle>
            <CardDescription className="text-sm">
              Enable maintenance mode to temporarily disable your site for visitors while you make updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <Label htmlFor="maintenance-mode" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Enable Maintenance Mode
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, visitors will see a maintenance message instead of your site.
                </p>
              </div>
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
            {maintenanceMode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  {React.createElement(AlertCircle as any, { className: "h-4 w-4 text-yellow-600 mt-0.5" })}
                  <div className="flex-1">
                    <p className="text-xs font-medium text-yellow-800">Maintenance mode is active</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your site is currently in maintenance mode. Remember to disable it when you're done.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media Links Section */}
        <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {React.createElement(Globe as any, { className: "h-5 w-5 text-blue-600" })}
              Social Media Links
            </CardTitle>
            <CardDescription className="text-sm">
              Add your social media profiles. These links can be used in your website footer, contact page, or anywhere else.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Facebook */}
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2 text-sm font-medium">
                  {React.createElement(Facebook as any, { className: "h-4 w-4 text-blue-600" })}
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  className="h-10"
                />
              </div>

              {/* Twitter */}
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2 text-sm font-medium">
                  {React.createElement(Twitter as any, { className: "h-4 w-4 text-blue-400" })}
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  placeholder="https://twitter.com/yourhandle"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  className="h-10"
                />
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2 text-sm font-medium">
                  {React.createElement(Instagram as any, { className: "h-4 w-4 text-pink-600" })}
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/yourprofile"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  className="h-10"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2 text-sm font-medium">
                  {React.createElement(Linkedin as any, { className: "h-4 w-4 text-blue-700" })}
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/company/yourcompany"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  className="h-10"
                />
              </div>

              {/* YouTube */}
              <div className="space-y-2">
                <Label htmlFor="youtube" className="flex items-center gap-2 text-sm font-medium">
                  {React.createElement(Youtube as any, { className: "h-4 w-4 text-red-600" })}
                  YouTube
                </Label>
                <Input
                  id="youtube"
                  type="url"
                  placeholder="https://youtube.com/@yourchannel"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  className="h-10"
                />
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2 text-sm font-medium">
                  {React.createElement(Github as any, { className: "h-4 w-4 text-gray-800" })}
                  GitHub
                </Label>
                <Input
                  id="github"
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={socialLinks.github}
                  onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                  className="h-10"
                />
              </div>

              {/* Website */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
                  {React.createElement(Globe as any, { className: "h-4 w-4 text-blue-600" })}
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // If we came from project dashboard, go back to dashboard
              const currentPath = window.location.pathname;
              if (currentPath.includes("/dashboard/")) {
                const projectIdMatch = currentPath.match(/\/projects\/([^\/]+)/);
                if (projectIdMatch) {
                  navigate(`/admin/projects/${projectIdMatch[1]}/dashboard`);
                } else {
                  navigate("/admin/projects");
                }
              } else {
                navigate("/admin/projects");
              }
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading || (!logoFile && !faviconFile && headCode === (project?.headCode || "") && maintenanceMode === (project?.maintenanceMode || false) && JSON.stringify(socialLinks) === JSON.stringify(project?.socialLinks || {}))}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

