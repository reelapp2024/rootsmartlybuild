import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Sparkles } from "lucide-react";

type DesignGenerationDialogProps = {
  open: boolean;
  designReady: boolean;
};

export function DesignGenerationDialog({ open, designReady }: DesignGenerationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
            <span>Generating Your Theme Design</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          {!designReady ? (
            <>
              <div className="flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Analyzing your business requirements...</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span>Creating custom theme design...</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span>Optimizing color schemes and layouts...</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span>Configuring selected pages and sections...</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span>Applying responsive design principles...</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span>Finalizing your unique website theme...</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-gray-900">Theme Design Ready!</p>
                <p className="text-sm text-gray-600">Your custom website theme has been generated successfully.</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
