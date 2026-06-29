import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Type } from "lucide-react";
import { buildGoogleFontsCssUrl } from "@schema/core/presetFonts";
import { DEFAULT_FONT_FAMILY, PRESET_FONT_OPTIONS } from "./designConfig";

type FontFamilySelectProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
};

export function FontFamilySelect({
  value,
  onChange,
  label = "Website font",
  description = "Used for headings, body text, and buttons across your site.",
}: FontFamilySelectProps) {
  const current = value || DEFAULT_FONT_FAMILY;

  useEffect(() => {
    if (document.getElementById("admin-design-fonts")) return;
    const link = document.createElement("link");
    link.id = "admin-design-fonts";
    link.rel = "stylesheet";
    link.href = buildGoogleFontsCssUrl(PRESET_FONT_OPTIONS);
    document.head.appendChild(link);
  }, []);

  return (
    <div className="space-y-2 pt-3 border-t">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-gray-500" />
        <Label className="text-sm font-semibold text-gray-900">{label}</Label>
      </div>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger className="w-full max-w-md bg-white">
          <SelectValue placeholder="Choose a font" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {PRESET_FONT_OPTIONS.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              <span style={{ fontFamily: font.value }}>{font.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
