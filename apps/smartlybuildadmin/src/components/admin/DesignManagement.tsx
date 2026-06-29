import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Palette, Save, Type } from "lucide-react";
import {
  PRESET_THEMES,
  type CustomColorScheme,
} from "./businesswebsiteSteps/businessWebsiteConfig";
import { DesignThemeFontFields } from "./businesswebsiteSteps/DesignThemeFontFields";
import {
  DEFAULT_CUSTOM_COLORS,
  DEFAULT_FONT_FAMILY,
  buildThemeApiPayload,
  parseThemeSettingsFromApi,
} from "./businesswebsiteSteps/designConfig";
import { TypographyStylesPanel, type GlobalElementStyles } from "./TypographyStylesPanel";

type DesignManagementProps = {
  projectId?: string;
};

export default function DesignManagement({ projectId: propProjectId }: DesignManagementProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const projectId = propProjectId || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("crimson-jet");
  const [showCustomColors, setShowCustomColors] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColorScheme>({ ...DEFAULT_CUSTOM_COLORS });
  const [selectedFont, setSelectedFont] = useState(DEFAULT_FONT_FAMILY);
  const [globalElementStyles, setGlobalElementStyles] = useState<GlobalElementStyles>({});
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const selectedPresetTheme = PRESET_THEMES.find((t) => t.id === selectedTheme);
  const selectedColorSchemeName = useMemo(() => {
    if (showCustomColors) return "Custom theme";
    return selectedPresetTheme?.name || "Crimson Jet";
  }, [showCustomColors, selectedPresetTheme]);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        theme: showCustomColors ? "custom" : selectedTheme,
        showCustomColors,
        customColors,
        selectedFont,
        globalElementStyles,
      }),
    [showCustomColors, selectedTheme, customColors, selectedFont, globalElementStyles]
  );

  const loadDesign = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await http.get(`/businessWebsite/${projectId}/design`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const parsed = parseThemeSettingsFromApi(res.data?.data);
      setSelectedTheme(parsed.selectedTheme);
      setShowCustomColors(parsed.showCustomColors);
      setCustomColors(parsed.customColors);
      setSelectedFont(parsed.selectedFont);
      // Load globalElementStyles if present
      const loadedElementStyles = res.data?.data?.globalElementStyles || {};
      setGlobalElementStyles(loadedElementStyles);
      setSavedSnapshot(
        JSON.stringify({
          theme: parsed.showCustomColors ? "custom" : parsed.selectedTheme,
          showCustomColors: parsed.showCustomColors,
          customColors: parsed.customColors,
          selectedFont: parsed.selectedFont,
          globalElementStyles: loadedElementStyles,
        })
      );
    } catch (error: any) {
      toast({
        title: "Load failed",
        description: error?.response?.data?.message || "Failed to load design settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDesign();
  }, [loadDesign]);

  const handleSave = async () => {
    if (!projectId) return;
    if (currentSnapshot === savedSnapshot) {
      toast({
        title: "No changes",
        description: "No design changes to save.",
      });
      return;
    }

    setSaving(true);
    try {
      const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");
      const token = localStorage.getItem("token");
      const payload = buildThemeApiPayload({
        projectId,
        userId: admin._id || localStorage.getItem("userId") || "",
        selectedTheme,
        showCustomColors,
        customColors,
        selectedFont,
      });

      // Add globalElementStyles to the payload
      (payload as any).globalElementStyles = globalElementStyles;

      await http.post("/updateProjectTheme", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Settings updated",
        description: "Design settings saved successfully.",
      });
      setSavedSnapshot(currentSnapshot);
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.response?.data?.message || "Failed to save design settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!projectId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Open this page from a project dashboard to manage design settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 font-poppins max-w-5xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 mt-0.5"
            onClick={() => navigate(`/admin/projects/${projectId}/dashboard`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="h-7 w-7 text-blue-600" />
              Design
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Update your website color theme and typography. Changes apply across the live site and
              GenieBuild preview.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 shrink-0"
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme &amp; font</CardTitle>
          <CardDescription>
            Pick a preset palette or build a custom theme, then choose a font for your brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center text-gray-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading design settings…
            </div>
          ) : (
            <DesignThemeFontFields
              showCustomColors={showCustomColors}
              selectedColorSchemeName={selectedColorSchemeName}
              selectedTheme={selectedTheme}
              setSelectedTheme={setSelectedTheme}
              presetThemes={PRESET_THEMES}
              setShowCustomColors={setShowCustomColors}
              customColors={customColors}
              setCustomColors={setCustomColors}
              selectedFont={selectedFont}
              setSelectedFont={setSelectedFont}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-blue-600" />
            Typography Styles
          </CardTitle>
          <CardDescription>
            Configure site-wide default styles for headings, body text, buttons, and links. 
            These settings apply everywhere unless overridden in GenieBuild for specific elements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center text-gray-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading typography settings…
            </div>
          ) : (
            <TypographyStylesPanel
              value={globalElementStyles}
              onChange={setGlobalElementStyles}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
