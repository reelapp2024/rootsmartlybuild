import { Card, CardContent } from "@/components/ui/card";
import { Check, Eye, Info, Mail, Map as MapIcon, MapPin, Palette, Briefcase, Globe, Building2 } from "lucide-react";

export type WebsiteWizardVariant = "business" | "bulk";

type WizardProgressHeaderProps = {
  step: number;
  variant?: WebsiteWizardVariant;
};

const BUSINESS_STEPS = [
  { num: 1, label: "Basic Info", short: "Basic", icon: Info },
  { num: 2, label: "Locations", short: "Locations", icon: MapPin },
  { num: 3, label: "Local Areas", short: "Areas", icon: MapIcon },
  { num: 4, label: "Services", short: "Services", icon: Briefcase },
  { num: 5, label: "Contact", short: "Contact", icon: Mail },
  { num: 6, label: "Design", short: "Design", icon: Palette },
  { num: 7, label: "Preview", short: "Preview", icon: Eye },
] as const;

const BULK_STEPS = [
  { num: 1, label: "Basic Info", short: "Basic", icon: Info },
  { num: 2, label: "Countries", short: "Countries", icon: Globe },
  { num: 3, label: "States", short: "States", icon: MapIcon },
  { num: 4, label: "Cities", short: "Cities", icon: Building2 },
  { num: 5, label: "Local Areas", short: "Areas", icon: MapPin },
  { num: 6, label: "Services", short: "Services", icon: Briefcase },
  { num: 7, label: "Contact", short: "Contact", icon: Mail },
  { num: 8, label: "Design", short: "Design", icon: Palette },
  { num: 9, label: "Preview", short: "Preview", icon: Eye },
] as const;

export function WizardProgressHeader({ step, variant = "business" }: WizardProgressHeaderProps) {
  const STEPS = variant === "bulk" ? BULK_STEPS : BUSINESS_STEPS;
  const total = STEPS.length;
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / (total - 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between relative">
            {STEPS.map((stepInfo) => {
              const isActive = step === stepInfo.num;
              const isCompleted = step > stepInfo.num;
              const IconComponent = stepInfo.icon;

              return (
                <div key={stepInfo.num} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110"
                        : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
                    )}
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-medium block ${
                        isActive
                          ? "text-blue-600"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      <span className="hidden sm:inline">{stepInfo.label}</span>
                      <span className="sm:hidden">{stepInfo.short}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2 border-t">
            <p className="text-sm text-gray-600">
              Step <span className="font-semibold text-blue-600">{step}</span> of <span className="font-semibold">{total}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
