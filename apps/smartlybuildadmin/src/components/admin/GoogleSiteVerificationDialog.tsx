import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { httpFile } from "../../config.js";

interface GoogleSiteVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  currentVerificationCode?: string;
  currentHtmlFileName?: string;
  onSuccess?: () => void;
}

export function GoogleSiteVerificationDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  currentVerificationCode = "",
  currentHtmlFileName = "",
  onSuccess,
}: GoogleSiteVerificationDialogProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("meta");
  const { toast } = useToast();

  // Load current verification data when dialog opens
  useEffect(() => {
    if (open) {
      setVerificationCode(currentVerificationCode || "");
      setSelectedFile(null);
      // Set active tab based on what's currently set
      if (currentHtmlFileName) {
        setActiveTab("html");
      } else {
        setActiveTab("meta");
      }
    }
  }, [open, currentVerificationCode, currentHtmlFileName]);

  const handleSaveMetaTag = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a Google Site Verification meta tag",
        variant: "destructive",
      });
      return;
    }

    // Validate that it's a meta tag
    const trimmedCode = verificationCode.trim();
    if (!trimmedCode.includes('google-site-verification') || !trimmedCode.includes('<meta')) {
      toast({
        title: "Validation Error",
        description: "Please paste the complete meta tag line (e.g., <meta name=\"google-site-verification\" content=\"...\" />)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found",
          variant: "destructive",
        });
        return;
      }

      const res = await httpFile.post(
        "/updateGoogleSiteVerification",
        {
          projectId,
          verificationCode: trimmedCode,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        toast({
          title: "Success",
          description: "Google Site Verification meta tag saved successfully. It will be included in the next build.",
        });
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to save verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadHtmlFile = async () => {
    if (!selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please select an HTML file to upload",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.html')) {
      toast({
        title: "Validation Error",
        description: "Only HTML files are allowed",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('htmlFile', selectedFile);
      formData.append('projectId', projectId);
      formData.append('fileName', selectedFile.name); // Send filename separately to avoid truncation

      const res = await httpFile.post(
        "/uploadGoogleSiteVerificationHtml",
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.status === 200) {
        toast({
          title: "Success",
          description: `HTML file "${selectedFile.name}" uploaded successfully. It will be included in the next build.`,
        });
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to upload HTML file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Google Site Verification
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Add verification for {projectName}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="meta" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meta Tag
              </TabsTrigger>
              <TabsTrigger value="html" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                HTML File
              </TabsTrigger>
            </TabsList>

            {/* Meta Tag Tab */}
            <TabsContent value="meta" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-sm font-semibold text-gray-900">
                  Meta Tag Line <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="verificationCode"
                  placeholder='<meta name="google-site-verification" content="FP9gc4-lGmiUe95oOcxBuzGCXSfNMxv1jmZLVV8IbgM" />'
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the complete meta tag line you received from Google Search Console. This will be added directly to your site's index.html during the next build.
                </p>
              </div>

              {currentVerificationCode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-1">Current Meta Tag:</p>
                  <p className="text-xs text-blue-700 font-mono break-all">{currentVerificationCode}</p>
                </div>
              )}

              <Button
                onClick={handleSaveMetaTag}
                disabled={isLoading || !verificationCode.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Meta Tag
                  </>
                )}
              </Button>
            </TabsContent>

            {/* HTML File Upload Tab */}
            <TabsContent value="html" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="htmlFile" className="text-sm font-semibold text-gray-900">
                  HTML File <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="htmlFile"
                    type="file"
                    accept=".html"
                    onChange={handleFileChange}
                    className="h-10"
                  />
                </div>
                {selectedFile && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-medium text-green-900 mb-1">Selected File:</p>
                    <p className="text-xs text-green-700 font-mono break-all">{selectedFile.name}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Upload the HTML verification file you received from Google Search Console. The file will be placed in the root of your site during the next build with the exact same filename.
                </p>
              </div>

              {currentHtmlFileName && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-1">Current HTML File:</p>
                  <p className="text-xs text-blue-700 font-mono break-all">
                    {currentHtmlFileName.includes('/') ? currentHtmlFileName.split('/').pop() : currentHtmlFileName}
                  </p>
                </div>
              )}

              <Button
                onClick={handleUploadHtmlFile}
                disabled={isLoading || !selectedFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload HTML File
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
