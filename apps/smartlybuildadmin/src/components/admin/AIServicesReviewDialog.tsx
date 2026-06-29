import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIServicesReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: string[];
  onConfirm: (services: string[]) => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  isRegenerating?: boolean;
}

export function AIServicesReviewDialog({
  open,
  onOpenChange,
  services,
  onConfirm,
  onRegenerate,
  isLoading = false,
  isRegenerating = false,
}: AIServicesReviewDialogProps) {
  const [editedServices, setEditedServices] = useState("");
  const [validationError, setValidationError] = useState("");
  const { toast } = useToast();

  // Load services when dialog opens
  useEffect(() => {
    if (open && services.length > 0) {
      setEditedServices(services.join("\n"));
      setValidationError("");
    }
  }, [open, services]);

  const handleConfirm = () => {
    const servicesArray = editedServices
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (servicesArray.length === 0) {
      setValidationError("Please keep at least one service name.");
      return;
    }

    setValidationError("");
    onConfirm(servicesArray);
  };

  const handleCancel = () => {
    setEditedServices("");
    setValidationError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      // Prevent closing on outside click - only close via Cancel button
      // Do nothing when trying to close from outside
    }}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing on Escape key
          e.preventDefault();
        }}
      >
        <DialogHeader className="pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Review & Edit AI Service Names
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Review the AI-generated services below. You can edit, add, or remove services.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="services-textarea" className="text-sm font-semibold text-gray-900">
                Service Names <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs text-gray-500">
                {editedServices.split("\n").filter((l) => l.trim()).length} service(s)
              </span>
            </div>
            <Textarea
              id="services-textarea"
              placeholder="One service name per line&#10;Example:&#10;Plumbing Services&#10;Drain Cleaning&#10;Water Heater Installation"
              value={editedServices}
              onChange={(e) => {
                setEditedServices(e.target.value);
                setValidationError("");
              }}
              className="min-h-[300px] font-mono text-sm resize-y"
              rows={12}
            />
            {validationError && (
              <p className="text-xs text-red-600 mt-1">{validationError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Each line represents one service. You can edit, add, or remove services as needed.
            </p>
          </div>

          {services.length > 0 && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-1.5">
                AI Generated {services.length} Service{services.length !== 1 ? "s" : ""}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {services.slice(0, 8).map((service, index) => (
                  <span
                    key={index}
                    className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200"
                  >
                    {service}
                  </span>
                ))}
                {services.length > 8 && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">
                    +{services.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <Button
            onClick={handleConfirm}
            disabled={isLoading || isRegenerating || !editedServices.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Use These Services
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-10 border-gray-200 hover:bg-gray-50 px-6"
            disabled={isLoading || isRegenerating}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

