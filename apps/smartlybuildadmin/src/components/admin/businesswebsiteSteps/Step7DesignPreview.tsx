import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, FileText, Grid, Layout, Monitor, Palette, RefreshCw } from "lucide-react";

type Step7DesignPreviewProps = {
  designPreview: any;
  businessName: string;
  generatingDesign: boolean;
  handleRegenerateDesign: () => void;
  projectId: string;
  onMissingProjectId: () => void;
};

export function Step7DesignPreview({
  designPreview,
  businessName,
  generatingDesign,
  handleRegenerateDesign,
  projectId,
  onMissingProjectId,
}: Step7DesignPreviewProps) {
  if (!designPreview) return null;

  const openBuilder = () => {
    if (projectId) {
      const token = localStorage.getItem("token");
      const genieBuildUrl = token
        ? `http://localhost:3000?projectId=${projectId}&token=${encodeURIComponent(token)}`
        : `http://localhost:3000?projectId=${projectId}`;
      window.open(genieBuildUrl, "_blank");
    } else {
      onMissingProjectId();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 7: Design Preview</CardTitle>
        <CardDescription>
          Review your generated theme design. You can regenerate or preview before generating the website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{designPreview.theme}</h3>
                <p className="text-sm text-gray-500">Your Custom Website Theme</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Ready
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Palette className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-500">Color Scheme</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">{designPreview.colorScheme}</p>
              <div className="flex space-x-1">
                <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: designPreview.colorPrimary }} title="Primary" />
                <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: designPreview.colorSecondary }} title="Secondary" />
                <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: designPreview.colorAccent }} title="Accent" />
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <Grid className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-500">Layout</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{designPreview.layout}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-500">Pages</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{designPreview.pages} Pages</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <Layout className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-500">Sections</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{designPreview.sections} Sections</p>
            </div>
          </div>

          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
            <div className="bg-gray-100 px-4 py-2 flex items-center space-x-2 border-b">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="flex-1 text-center">
                <span className="text-xs text-gray-600">{businessName || "Your Business"}</span>
              </div>
            </div>
            <div
              className="p-8 min-h-[300px] flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${designPreview.colorPrimary}15 0%, ${designPreview.colorSecondary}10 100%)`,
              }}
            >
              <div className="text-center space-y-4">
                <div
                  className="w-32 h-32 mx-auto rounded-lg flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: designPreview.colorPrimary }}
                >
                  <Monitor className="h-16 w-16 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{designPreview.theme}</h4>
                  <p className="text-sm text-gray-600">{designPreview.colorScheme} • {designPreview.layout}</p>
                  <div className="flex items-center justify-center space-x-2 mt-3">
                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: designPreview.colorPrimary }} />
                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: designPreview.colorSecondary }} />
                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: designPreview.colorAccent }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleRegenerateDesign}
            disabled={generatingDesign}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${generatingDesign ? "animate-spin" : ""}`} />
            <span>Regenerate Design</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openBuilder}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Preview Design</span>
          </Button>
          <Button
            type="button"
            onClick={openBuilder}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Monitor className="h-4 w-4" />
            <span>Open in GenieBuild</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

