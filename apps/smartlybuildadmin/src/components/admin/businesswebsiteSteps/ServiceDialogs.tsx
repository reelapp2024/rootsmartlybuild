import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";

type ServiceDialogsProps = {
  showAICountDialog: boolean;
  setShowAICountDialog: (open: boolean) => void;
  aiServiceCount: string;
  setAIServiceCount: (value: string) => void;
  handleConfirmAIGeneration: () => void;
  showManualDialog: boolean;
  setShowManualDialog: (open: boolean) => void;
  manualServiceText: string;
  setManualServiceText: (value: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  handleSaveManualServices: () => void;
};

export function ServiceDialogs(props: ServiceDialogsProps) {
  const {
    showAICountDialog,
    setShowAICountDialog,
    aiServiceCount,
    setAIServiceCount,
    handleConfirmAIGeneration,
    showManualDialog,
    setShowManualDialog,
    manualServiceText,
    setManualServiceText,
    handleFileUpload,
    uploadedFile,
    setUploadedFile,
    handleSaveManualServices,
  } = props;

  return (
    <>
      <Dialog open={showAICountDialog} onOpenChange={setShowAICountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate AI Services</DialogTitle>
            <DialogDescription>
              How many services would you like to generate? (1-50)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="ai-count">Number of Services</Label>
            <Input
              id="ai-count"
              type="number"
              min="1"
              max="50"
              value={aiServiceCount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 50)) {
                  setAIServiceCount(val);
                }
              }}
              placeholder="Enter number (1-50)"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-2">
              AI will generate service names based on your business type
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAICountDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAIGeneration} className="bg-blue-600 hover:bg-blue-700">
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Service Names</DialogTitle>
            <DialogDescription>
              Enter service names manually (one per line) or upload an Excel file (.xlsx, .xls)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-textarea">Service Names (one per line)</Label>
              <Textarea
                id="service-textarea"
                placeholder={"Service 1\nService 2\nService 3"}
                value={manualServiceText}
                onChange={(e) => setManualServiceText(e.target.value)}
                className="w-full min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Enter each service name on a new line
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excel-upload">Or Upload Excel File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                {uploadedFile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {uploadedFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Excel file should have service names in the first column
              </p>
            </div>
            {manualServiceText && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Services Preview ({manualServiceText.split("\n").filter((l) => l.trim()).length} services)
                </p>
                <div className="max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {manualServiceText
                      .split("\n")
                      .filter((l) => l.trim())
                      .slice(0, 10)
                      .map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {service.trim()}
                        </Badge>
                      ))}
                    {manualServiceText.split("\n").filter((l) => l.trim()).length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{manualServiceText.split("\n").filter((l) => l.trim()).length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowManualDialog(false);
                setManualServiceText("");
                setUploadedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveManualServices} className="bg-blue-600 hover:bg-blue-700">
              Save Services
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
