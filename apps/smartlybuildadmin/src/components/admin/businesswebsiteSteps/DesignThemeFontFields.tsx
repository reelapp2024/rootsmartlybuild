import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Settings } from "lucide-react";
import type { CustomColorScheme } from "./businessWebsiteConfig";
import { FontFamilySelect } from "./FontFamilySelect";

type DesignThemeFontFieldsProps = {
  showCustomColors: boolean;
  selectedColorSchemeName: string;
  selectedTheme: string;
  setSelectedTheme: (value: string) => void;
  presetThemes: ReadonlyArray<{
    id: string;
    name: string;
    primary: string;
    surface: string;
    heading: string;
    description: string;
  }>;
  setShowCustomColors: (value: boolean) => void;
  customColors: CustomColorScheme;
  setCustomColors: (value: CustomColorScheme) => void;
  selectedFont: string;
  setSelectedFont: (value: string) => void;
};

export function DesignThemeFontFields({
  showCustomColors,
  selectedColorSchemeName,
  selectedTheme,
  setSelectedTheme,
  presetThemes,
  setShowCustomColors,
  customColors,
  setCustomColors,
  selectedFont,
  setSelectedFont,
}: DesignThemeFontFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-900">Color theme</Label>
        <Badge variant="outline" className="text-xs">
          {showCustomColors ? "Custom theme" : selectedColorSchemeName}
        </Badge>
      </div>

      {!showCustomColors ? (
        <>
          <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {presetThemes.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex gap-1.5 items-center">
                        <div
                          className="w-5 h-5 rounded border border-gray-300"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div
                          className="flex-1 h-5 rounded border border-gray-300"
                          style={{ backgroundColor: theme.surface }}
                        />
                      </div>
                      <div
                        className="w-full h-1 rounded"
                        style={{ backgroundColor: theme.heading }}
                      />
                    </div>
                    <p
                      className={`text-xs font-semibold ${isSelected ? "text-indigo-900" : "text-gray-900"}`}
                    >
                      {theme.name}
                    </p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{theme.description}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCustomColors(true)}
            className="w-full border-dashed border-2 border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Create custom theme
          </Button>
        </>
      ) : (
        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Custom theme colors</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomColors(false)}
              className="text-xs"
            >
              Back to presets
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["heading", "Heading"],
                ["description", "Description"],
                ["surface", "Surface"],
                ["accent", "Accent"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">{label}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customColors[key]}
                    onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                    className="w-10 h-9 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColors[key]}
                    onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                    className="flex-1 h-9 text-sm"
                  />
                </div>
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label className="text-xs font-medium text-gray-700 mb-1 block">Primary button</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customColors.primaryButton.bg}
                  onChange={(e) =>
                    setCustomColors({
                      ...customColors,
                      primaryButton: { ...customColors.primaryButton, bg: e.target.value },
                    })
                  }
                  className="w-10 h-9 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={customColors.primaryButton.bg}
                  onChange={(e) =>
                    setCustomColors({
                      ...customColors,
                      primaryButton: { ...customColors.primaryButton, bg: e.target.value },
                    })
                  }
                  className="flex-1 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <FontFamilySelect value={selectedFont} onChange={setSelectedFont} />
    </div>
  );
}
