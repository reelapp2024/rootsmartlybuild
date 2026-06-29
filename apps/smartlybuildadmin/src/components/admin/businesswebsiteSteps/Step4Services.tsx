import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, ClipboardList, Loader2, Wand2 } from "lucide-react";

type Step4ServicesProps = {
  serviceOption: "" | "manual" | "ai";
  generatingServices: boolean;
  businessName: string;
  serviceType: string;
  projectId?: string | null;
  handleGenerateAIServices: () => void;
  handleManualServiceEntry: () => void;
  setServiceOption: (value: "" | "manual" | "ai") => void;
  setServiceNames: (value: string) => void;
  serviceNames: string;
  existingServiceNames?: string[];
};

export function Step4Services({
  serviceOption,
  generatingServices,
  businessName,
  serviceType,
  projectId = null,
  handleGenerateAIServices,
  handleManualServiceEntry,
  setServiceOption,
  setServiceNames,
  serviceNames,
  existingServiceNames = [],
}: Step4ServicesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Services</CardTitle>
        <CardDescription>
          Add services to your business website. Choose manual entry or AI generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {existingServiceNames.length > 0 && (
          <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-800">Saved services (read-only)</p>
            <ul className="text-sm text-gray-600 list-disc pl-5 max-h-40 overflow-y-auto">
              {existingServiceNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">
              Add only new service names below. Existing names cannot be changed here.
            </p>
          </div>
        )}
        {!serviceOption ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Bot className="h-8 w-8 text-blue-500" />
                <h4 className="text-lg font-semibold text-gray-800">AI Generation</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Let our AI generate service names automatically based on your business type.
              </p>
              <Button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleGenerateAIServices}
                disabled={generatingServices || !projectId}
              >
                {generatingServices ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate AI Services
                  </>
                )}
              </Button>
            </div>

            <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <ClipboardList className="h-8 w-8 text-green-500" />
                <h4 className="text-lg font-semibold text-gray-800">Manual Entry</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enter service names manually or upload an Excel file with service names.
              </p>
              <Button
                type="button"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleManualServiceEntry}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Add Services Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {serviceOption === "ai" ? (
                  <>
                    <Bot className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">AI Generated Services</span>
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Manual Services</span>
                  </>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setServiceOption("");
                  setServiceNames("");
                }}
              >
                Change Method
              </Button>
            </div>
            <Textarea
              value={serviceNames}
              onChange={(e) => setServiceNames(e.target.value)}
              placeholder={
                existingServiceNames.length > 0
                  ? "New services only — one name per line"
                  : "One service name per line"
              }
              className="w-full min-h-[200px]"
            />
            <p className="text-xs text-gray-500">
              {serviceOption === "ai"
                ? "Review and edit the AI-generated services. One service per line."
                : existingServiceNames.length > 0
                  ? "Enter only new service names to add. One per line."
                  : "Enter service names, one per line. You can also upload an Excel file."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

