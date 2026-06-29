import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import type { WebsiteWizardVariant } from "./WizardProgressHeader";

type WizardNavigationProps = {
  step: number;
  variant?: WebsiteWizardVariant;
  loading: boolean;
  generatingDesign: boolean;
  onPrevious: () => void;
  onSkip: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function WizardNavigation({
  step,
  variant = "business",
  loading,
  generatingDesign,
  onPrevious,
  onSkip,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  const isBulk = variant === "bulk";
  const designStep = isBulk ? 8 : 6;
  const previewStep = isBulk ? 9 : 7;
  const skipSteps = isBulk ? [3, 4, 5] : [2, 3, 4];

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={step === 1}
        className="flex items-center space-x-2"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </Button>

      <div className="flex items-center space-x-2">
        {skipSteps.includes(step) && (
          <Button variant="outline" onClick={onSkip} className="flex items-center space-x-2">
            <span>Skip</span>
          </Button>
        )}
        {step < designStep ? (
          <Button
            onClick={onNext}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : step === designStep ? (
          <Button
            onClick={onSubmit}
            disabled={generatingDesign}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            {generatingDesign ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Design...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Create Design</span>
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onNext} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
            <Sparkles className="h-4 w-4" />
            <span>Generate Website</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
