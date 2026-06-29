
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { themeApi, Theme } from "@/api/themeApi";
import { EditThemeDialog } from "./EditThemeDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Palette, SwatchBook, Search, Edit, Eye, Power, PowerOff, Loader2, Plus, Sparkles, Image as ImageIcon, ExternalLink } from "lucide-react";

export function ThemesManagement() {
  const [activeTab, setActiveTab] = useState<string>("available");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Preview states - Same logic as ThemeNew
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  
  const { toast } = useToast();

  // Generate preview URL from theme name - Same Logic as ThemeNew and Website App.tsx
  const getPreviewUrl = (themeName: string) => {
    if (!themeName) return '';
    
    // Normalize theme name to match website App.tsx logic
    const normalizedTheme = themeName.toLowerCase().trim();
    
    // Map theme names to valid theme types (same as website App.tsx)
    let themeParam = '';
    if (normalizedTheme === 'cleaning' || normalizedTheme.includes('cleaning')) {
      themeParam = 'cleaning';
    } else if (normalizedTheme === 'multicolor' || normalizedTheme === 'multi-color' || normalizedTheme.includes('multicolor') || normalizedTheme.includes('multi')) {
      themeParam = 'multicolor';
    } else {
      // If theme name doesn't match, use it as-is (lowercase, no spaces)
      themeParam = normalizedTheme.replace(/\s+/g, '-');
    }
    
    return `http://localhost:8081/?theme=${themeParam}`;
  };

  // Reset iframe state when preview opens/closes
  useEffect(() => {
    if (previewOpen && previewTheme?.themeName) {
      setIframeLoading(true);
      setIframeError(false);
    } else if (!previewOpen) {
      setIframeLoading(true);
      setIframeError(false);
    }
  }, [previewOpen, previewTheme]);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      console.log('Loading themes...');
      const themeData = await themeApi.listThemes();
      console.log('Themes loaded successfully:', themeData);
      
      // Auto-seed themes - Always ensure all 3 default themes exist
      const defaultThemeNames = ['cleaning', 'multicolor', 'modern'];
      const existingThemeNames = (themeData || []).map((t: Theme) => t.themeName.toLowerCase().trim());
      const missingThemes = defaultThemeNames.filter(name => !existingThemeNames.includes(name));
      
      console.log('📊 Theme Status:', {
        existing: existingThemeNames,
        missing: missingThemes,
        totalFound: themeData?.length || 0
      });
      
      // Always seed if any default theme is missing
      if (missingThemes.length > 0) {
        console.log('🌱 Auto-seeding missing themes:', missingThemes);
        try {
          const { http } = await import('@/config');
          console.log('📡 Calling seed API...');
          const seedResponse = await http.post('/seed_themes');
          console.log('✅ Seed API success:', seedResponse?.data?.message || 'Themes seeded');
          
          // Wait longer for database to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Reload themes after seeding
          console.log('🔄 Reloading themes...');
          const reseededData = await themeApi.listThemes();
          console.log('✅ Final themes count:', reseededData?.length || 0);
          setThemes(reseededData || []);
          
          toast({
            title: "Success",
            description: `Default themes automatically added! (${missingThemes.length} theme${missingThemes.length > 1 ? 's' : ''} added)`,
          });
        } catch (seedError: any) {
          console.error('❌ Seed API error:', seedError);
          console.error('Error details:', {
            message: seedError?.message,
            status: seedError?.response?.status,
            data: seedError?.response?.data
          });
          // Still show existing themes even if seed fails
          setThemes(themeData || []);
          toast({
            title: "Warning",
            description: seedError?.response?.data?.message || seedError?.message || "Could not auto-add themes. Please check server.",
            variant: "default"
          });
        }
      } else {
        console.log('✅ All 3 default themes exist');
        setThemes(themeData || []);
      }
    } catch (error: any) {
      console.error('Error loading themes:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to load themes",
        variant: "destructive"
      });
      setThemes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (themeId: string, currentStatus: boolean) => {
    try {
      console.log('Toggling theme status:', { themeId, currentStatus });
      await themeApi.changeThemeStatus(themeId, !currentStatus);
      toast({
        title: "Success",
        description: `Theme ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      loadThemes();
    } catch (error: any) {
      console.error('Error toggling theme status:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to update theme status",
        variant: "destructive"
      });
    }
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setEditDialogOpen(true);
  };

  const filteredThemes = searchTerm 
    ? themes.filter(theme => 
        theme.themeName.toLowerCase().includes(searchTerm.toLowerCase()))
    : themes;

  const activeThemes = filteredThemes.filter(theme => theme.isActive);
  const availableThemes = filteredThemes;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="p-4 rounded-full bg-blue-100 w-fit mx-auto">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-700">Loading themes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-poppins">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Themes Management
              </h1>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Manage and customize website themes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Total Themes</p>
                <p className="text-2xl font-bold text-blue-900">{themes.length}</p>
              </div>
              <div className="p-2 bg-blue-600 rounded-lg">
                <Palette className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Active Themes</p>
                <p className="text-2xl font-bold text-green-900">{activeThemes.length}</p>
              </div>
              <div className="p-2 bg-green-600 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Available Themes</p>
                <p className="text-2xl font-bold text-blue-900">{availableThemes.length}</p>
              </div>
              <div className="p-2 bg-blue-600 rounded-lg">
                <SwatchBook className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search themes..."
                className="pl-10 pr-4 w-full h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="available" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Available Themes
                <Badge variant="secondary" className="ml-2">{availableThemes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Active Themes
                <Badge variant="secondary" className="ml-2">{activeThemes.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4 mt-0">
              {availableThemes.length === 0 ? (
                <Card className="py-16">
                  <CardContent className="text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 rounded-full bg-blue-100">
                        <Palette className="h-12 w-12 text-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">No themes found</h3>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? "Try adjusting your search terms" : "No themes available"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableThemes.map((theme) => (
                    <Card key={theme._id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200 group">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {theme.themeImageUrl ? (
                          <img 
                            src={theme.themeImageUrl} 
                            alt={theme.themeName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <ImageIcon className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className={`${theme.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"} text-xs px-2 py-1 border`}>
                            {theme.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900">{theme.themeName}</CardTitle>
                        <CardDescription>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {theme.supportSecondaryColor && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Secondary Color
                              </Badge>
                            )}
                            {theme.supportThemeSubColor && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                Sub Color
                              </Badge>
                            )}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            onClick={() => {
                              setPreviewTheme(theme);
                              setPreviewOpen(true);
                              setIframeLoading(true);
                              setIframeError(false);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                          <div className="grid grid-cols-3 gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              onClick={() => handleEditTheme(theme)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={theme.isActive ? "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200"}
                              onClick={() => handleToggleStatus(theme._id!, theme.isActive)}
                              title={theme.isActive ? "Deactivate" : "Activate"}
                            >
                              {theme.isActive ? (
                                <Power className="h-4 w-4" />
                              ) : (
                                <PowerOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200"
                              onClick={() => window.open(getPreviewUrl(theme.themeName), '_blank')}
                              title="Open Demo"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4 mt-0">
              {activeThemes.length === 0 ? (
                <Card className="py-16">
                  <CardContent className="text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 rounded-full bg-green-100">
                        <Sparkles className="h-12 w-12 text-green-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">No active themes</h3>
                        <p className="text-sm text-gray-500">
                          Activate a theme to make it available for use
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeThemes.map((theme) => (
                    <Card key={theme._id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-2 border-green-200 bg-green-50/30">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {theme.themeImageUrl ? (
                          <img 
                            src={theme.themeImageUrl} 
                            alt={theme.themeName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <ImageIcon className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1 border">
                            Active
                          </Badge>
                        </div>
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900">{theme.themeName}</CardTitle>
                        <CardDescription>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {theme.supportSecondaryColor && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Secondary Color
                              </Badge>
                            )}
                            {theme.supportThemeSubColor && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                Sub Color
                              </Badge>
                            )}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            onClick={() => {
                              setPreviewTheme(theme);
                              setPreviewOpen(true);
                              setIframeLoading(true);
                              setIframeError(false);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                          <div className="grid grid-cols-3 gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              onClick={() => handleEditTheme(theme)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              onClick={() => handleToggleStatus(theme._id!, theme.isActive)}
                              title="Deactivate"
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200"
                              onClick={() => window.open(getPreviewUrl(theme.themeName), '_blank')}
                              title="Open Demo"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EditThemeDialog 
        theme={editingTheme}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onThemeUpdated={loadThemes}
      />

      {/* Preview Dialog - Same Logic as ThemeNew */}
      <Dialog open={previewOpen} onOpenChange={(open) => {
        setPreviewOpen(open);
        if (!open) {
          setPreviewTheme(null);
          setIframeLoading(true);
          setIframeError(false);
        }
      }}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">
                  {previewTheme?.themeName} - Preview
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {previewTheme?.themeName ? (
                    <>Preview of the theme demo. You can interact with the preview below.</>
                  ) : (
                    <>No preview available for this theme.</>
                  )}
                </DialogDescription>
              </div>
              {previewTheme?.themeName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getPreviewUrl(previewTheme.themeName), '_blank')}
                  className="ml-4"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6 relative" style={{ height: 'calc(90vh - 120px)' }}>
            {previewTheme?.themeName ? (
              <>
                {/* Loading State */}
                {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                    <div className="text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                      <p className="text-sm font-medium text-gray-700">Loading preview...</p>
                    </div>
                  </div>
                )}
                
                {/* Error State */}
                {iframeError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                    <div className="text-center space-y-4 p-6">
                      <div className="p-4 rounded-full bg-red-100 w-fit mx-auto">
                        <ImageIcon className="h-8 w-8 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Unable to load the preview. This might be due to CORS restrictions or the URL not being accessible.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIframeError(false);
                              setIframeLoading(true);
                              const iframe = document.getElementById('theme-preview-iframe-management') as HTMLIFrameElement;
                              if (iframe && previewTheme?.themeName) {
                                iframe.src = getPreviewUrl(previewTheme.themeName);
                              }
                            }}
                          >
                            Retry
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => {
                              if (previewTheme?.themeName) {
                                window.open(getPreviewUrl(previewTheme.themeName), '_blank');
                              }
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Iframe */}
                <iframe
                  id="theme-preview-iframe-management"
                  src={getPreviewUrl(previewTheme.themeName)}
                  className="w-full h-full border-0 rounded-lg"
                  title={`${previewTheme.themeName} Preview`}
                  allow="fullscreen"
                  style={{ minHeight: '600px', display: iframeError ? 'none' : 'block' }}
                  onLoad={() => {
                    setIframeLoading(false);
                    setIframeError(false);
                  }}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-full bg-gray-100 w-fit mx-auto">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Preview Available</h3>
                    <p className="text-sm text-gray-600">
                      This theme does not have a name configured.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
