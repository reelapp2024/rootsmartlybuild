import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, ChevronRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getMyHostings,
  browseHostingDirectories,
  linkProjectToHosting,
  canBrowseHosting,
  defaultRootPathForHosting,
  formatHostingSummary,
  hostingTypeLabel,
  HostingConnection,
} from "@/api/newHostingApi";

interface ConnectHostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

interface DirectoryItem {
  name: string;
  fullPath: string;
}

export function ConnectHostingDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: ConnectHostingDialogProps) {
  const [hostings, setHostings] = useState<HostingConnection[]>([]);
  const [selectedHosting, setSelectedHosting] = useState<HostingConnection | null>(null);
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [domainName, setDomainName] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"select-hosting" | "browse-directories" | "manual-path">(
    "select-hosting"
  );
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchHostings();
    }
  }, [open]);

  const fetchHostings = async () => {
    try {
      setIsLoading(true);
      const hostingList = await getMyHostings({ verifiedOnly: true });
      setHostings(hostingList.filter((h) => h.status === "success" || !h.status));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const browseDirectories = async (hostingId: string, path: string) => {
    try {
      setIsLoading(true);
      const dirs = await browseHostingDirectories(hostingId, path);
      setDirectories(dirs);
      setCurrentPath(path);

      if (!path) {
        setBreadcrumbs([]);
      } else {
        setBreadcrumbs(path.split("/").filter((part) => part !== ""));
      }
    } catch (error: any) {
      toast({
        title: "Browse failed",
        description: error.message,
        variant: "destructive",
      });
      setStep("manual-path");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHostingSelect = (hosting: HostingConnection) => {
    setSelectedHosting(hosting);
    setRootPath(defaultRootPathForHosting(hosting.connectionType));
    setDomainName("");

    if (canBrowseHosting(hosting.connectionType)) {
      setStep("browse-directories");
      browseDirectories(hosting._id, "");
    } else {
      setStep("manual-path");
    }
  };

  const handleDirectoryClick = (dir: DirectoryItem) => {
    browseDirectories(selectedHosting!._id, dir.fullPath);
  };

  const navigateToPath = (pathIndex: number) => {
    const newPath = breadcrumbs.slice(0, pathIndex + 1).join("/");
    browseDirectories(selectedHosting!._id, `/${newPath}`.replace(/\/+/g, "/"));
  };

  const goBack = () => {
    const parentPath = breadcrumbs.slice(0, -1).join("/");
    browseDirectories(
      selectedHosting!._id,
      parentPath ? `/${parentPath}`.replace(/\/+/g, "/") : ""
    );
  };

  const selectCurrentPath = () => {
    const path = currentPath
      ? currentPath.startsWith("/")
        ? currentPath
        : `/${currentPath}`
      : "/";
    setRootPath(path);
  };

  const handleConnect = async () => {
    if (!selectedHosting || !domainName.trim() || !rootPath.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in domain and root path.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await linkProjectToHosting({
        hostingId: selectedHosting._id,
        projectId,
        domainName: domainName.trim().replace(/^www\./i, ""),
        rootPath: rootPath.trim(),
      });

      toast({
        title: "Connected",
        description: "Project linked to hosting. Use Deploy to upload your build.",
      });

      onOpenChange(false);
      resetDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("select-hosting");
    setSelectedHosting(null);
    setDirectories([]);
    setCurrentPath("");
    setBreadcrumbs([]);
    setDomainName("");
    setRootPath("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetDialog();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect {projectName} to Hosting</DialogTitle>
        </DialogHeader>

        {step === "select-hosting" && (
          <div className="space-y-4">
            <Label>Select Hosting Connection</Label>
            {isLoading ? (
              <div className="text-center py-8">Loading hostings…</div>
            ) : (
              <div className="space-y-2">
                {hostings.map((hosting) => (
                  <div
                    key={hosting._id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleHostingSelect(hosting)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {hostingTypeLabel(hosting.connectionType)}
                        </h4>
                        <p className="text-sm text-gray-500 font-mono">
                          {formatHostingSummary(
                            hosting.connectionConfig,
                            hosting.connectionType
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
                {hostings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No verified hosting connections. Add one from Hosting first.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === "browse-directories" && selectedHosting && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Browse Directories</Label>
              <Button variant="outline" size="sm" onClick={() => setStep("select-hosting")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded flex-wrap">
              <FolderOpen className="h-4 w-4" />
              <span
                className="cursor-pointer hover:underline"
                onClick={() => browseDirectories(selectedHosting._id, "")}
              >
                Root
              </span>
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb}-${index}`} className="flex items-center space-x-2">
                  <ChevronRight className="h-3 w-3" />
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => navigateToPath(index)}
                  >
                    {crumb}
                  </span>
                </div>
              ))}
            </div>

            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">Loading directories…</div>
              ) : (
                <>
                  {breadcrumbs.length > 0 && (
                    <div
                      className="p-3 border-b cursor-pointer hover:bg-gray-50 flex items-center"
                      onClick={goBack}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      <span>.. (Go Back)</span>
                    </div>
                  )}
                  {directories.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No subfolders here. Select this path or enter one manually.
                    </div>
                  )}
                  {directories.map((item) => (
                    <div
                      key={item.fullPath}
                      className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 flex items-center"
                      onClick={() => handleDirectoryClick(item)}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      <span>{item.name}</span>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={selectCurrentPath}>
                Use Current Path
              </Button>
              <Button variant="outline" onClick={() => setStep("manual-path")}>
                Enter Path Manually
              </Button>
            </div>

            {rootPath ? (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="domain-browse">Domain Name *</Label>
                    <Input
                      id="domain-browse"
                      placeholder="example.com"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="root-browse">Root Path *</Label>
                    <Input
                      id="root-browse"
                      value={rootPath}
                      onChange={(e) => setRootPath(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleConnect}
                    disabled={isLoading || !domainName.trim() || !rootPath.trim()}
                    className="w-full"
                  >
                    {isLoading ? "Connecting…" : "Connect Project"}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {step === "manual-path" && selectedHosting && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Path & Domain</Label>
              <Button variant="outline" size="sm" onClick={() => setStep("select-hosting")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {hostingTypeLabel(selectedHosting.connectionType)} ·{" "}
              {formatHostingSummary(
                selectedHosting.connectionConfig,
                selectedHosting.connectionType
              )}
            </p>
            <div>
              <Label htmlFor="domain">Domain Name *</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rootPath">Root Path *</Label>
              <Input
                id="rootPath"
                placeholder={defaultRootPathForHosting(selectedHosting.connectionType)}
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Shared/cPanel often uses /public_html. VPS often uses /var/www/html or your site
                folder.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConnect}
                disabled={isLoading || !domainName.trim() || !rootPath.trim()}
                className="flex-1"
              >
                {isLoading ? "Connecting…" : "Connect Project"}
              </Button>
              {canBrowseHosting(selectedHosting.connectionType) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("browse-directories");
                    browseDirectories(selectedHosting._id, "");
                  }}
                >
                  Browse
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
