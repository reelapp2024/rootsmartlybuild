import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { themeApi, CreateThemeData } from "@/api/themeApi";
import { Plus, Loader2, Palette, Sparkles } from "lucide-react";

interface CreateThemeDialogProps {
  onThemeCreated: () => void;
}

export function CreateThemeDialog({ onThemeCreated }: CreateThemeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateThemeData>({
    themeName: "",
    supportThemeSubColor: "false",
    supportSecondaryColor: "false",
    themeDemoUrl: "",
    themeImageUrl: "",
    isActive: "false"
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.themeName || !formData.themeDemoUrl || !formData.themeImageUrl) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await themeApi.createTheme(formData);
      toast({
        title: "Success",
        description: "Theme created successfully"
      });
      setOpen(false);
      setFormData({
        themeName: "",
        supportThemeSubColor: "false",
        supportSecondaryColor: "false",
        themeDemoUrl: "",
        themeImageUrl: "",
        isActive: "false"
      });
      onThemeCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create theme",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4">
          <Plus className="mr-2 h-4 w-4" />
          Create Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-blue-100">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Create New Theme
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                Add a new theme to your collection
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="themeName" className="text-sm font-semibold text-gray-900">
              Theme Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="themeName"
              value={formData.themeName}
              onChange={(e) => setFormData(prev => ({ ...prev, themeName: e.target.value }))}
              placeholder="Enter theme name"
              className="h-10"
              required
            />
            <p className="text-xs text-gray-500">Give your theme a descriptive name</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="themeDemoUrl" className="text-sm font-semibold text-gray-900">
              Demo URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="themeDemoUrl"
              value={formData.themeDemoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, themeDemoUrl: e.target.value }))}
              placeholder="https://example.com/demo"
              className="h-10"
              required
            />
            <p className="text-xs text-gray-500">URL where users can preview the theme</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="themeImageUrl" className="text-sm font-semibold text-gray-900">
              Image URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="themeImageUrl"
              value={formData.themeImageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, themeImageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="h-10"
              required
            />
            <p className="text-xs text-gray-500">Preview image URL for the theme</p>
          </div>

          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <Palette className="h-4 w-4 text-blue-600" />
                <div>
                  <Label htmlFor="supportThemeSubColor" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Support Sub Color
                  </Label>
                  <p className="text-xs text-gray-500">Enable sub color customization</p>
                </div>
              </div>
              <Switch
                id="supportThemeSubColor"
                checked={formData.supportThemeSubColor === "true"}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, supportThemeSubColor: checked.toString() }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <div>
                  <Label htmlFor="supportSecondaryColor" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Support Secondary Color
                  </Label>
                  <p className="text-xs text-gray-500">Enable secondary color customization</p>
                </div>
              </div>
              <Switch
                id="supportSecondaryColor"
                checked={formData.supportSecondaryColor === "true"}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, supportSecondaryColor: checked.toString() }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <div>
                  <Label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Make Active
                  </Label>
                  <p className="text-xs text-gray-500">Activate this theme immediately</p>
                </div>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive === "true"}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isActive: checked.toString() }))
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white h-10">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Theme
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
