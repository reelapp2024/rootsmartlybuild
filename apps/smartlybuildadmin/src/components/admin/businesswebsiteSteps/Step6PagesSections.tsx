import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText, Layout } from "lucide-react";
import { DesignThemeFontFields } from "./DesignThemeFontFields";
import { sortSectionObjectsByCanonicalOrder } from "@shared/siteSectionOrder";

type Step6PagesSectionsProps = {
  showCustomColors: boolean;
  selectedColorScheme: { name: string };
  selectedTheme: string;
  setSelectedTheme: (value: string) => void;
  presetThemes: ReadonlyArray<any>;
  setShowCustomColors: (value: boolean) => void;
  customColors: any;
  setCustomColors: (value: any) => void;
  selectedFont: string;
  setSelectedFont: (value: string) => void;
  selectedPages: any[];
  defaultPages: any[];
  setSelectedPages: (value: any[]) => void;
  pageSections: Record<string, any[]>;
  setPageSections: (value: Record<string, any[]>) => void;
  handleTogglePage: (pageId: string) => void;
  mapSectionIdToComponentName: (sectionId: string) => string;
  perLocationByPage: Record<string, boolean>;
  setPerLocationByPage: (value: Record<string, boolean>) => void;
};

export function Step6PagesSections({
  showCustomColors,
  selectedColorScheme,
  selectedTheme,
  setSelectedTheme,
  presetThemes,
  setShowCustomColors,
  customColors,
  setCustomColors,
  selectedFont,
  setSelectedFont,
  selectedPages,
  defaultPages,
  setSelectedPages,
  pageSections,
  setPageSections,
  handleTogglePage,
  mapSectionIdToComponentName,
  perLocationByPage,
  setPerLocationByPage,
}: Step6PagesSectionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Step 6: Select Pages & Sections</CardTitle>
        <CardDescription className="text-sm">
          Choose pages and sections for your website. Default selections are pre-selected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="pb-4 border-b">
          <DesignThemeFontFields
            showCustomColors={showCustomColors}
            selectedColorSchemeName={selectedColorScheme.name}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
            presetThemes={presetThemes}
            setShowCustomColors={setShowCustomColors}
            customColors={customColors}
            setCustomColors={setCustomColors}
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-gray-900">Select Pages ({selectedPages.length}/{defaultPages.length})</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => {
                  setSelectedPages([...defaultPages]);
                  const allSections: Record<string, any[]> = {};
                  defaultPages.forEach((page: any) => {
                    allSections[page.id] = page.sections.filter((s: any) => s.defaultSelected);
                  });
                  setPageSections(allSections);
                  setPerLocationByPage(
                    Object.fromEntries(
                      defaultPages.map((page: any) => [
                        page.id,
                        Boolean(page.defaultPerLocationContent),
                      ])
                    )
                  );
                }}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => {
                  setSelectedPages(defaultPages.filter((p: any) => p.defaultSelected));
                  const defaultSections: Record<string, any[]> = {};
                  defaultPages.forEach((page: any) => {
                    if (page.defaultSelected) {
                      defaultSections[page.id] = page.sections.filter((s: any) => s.defaultSelected);
                    }
                  });
                  setPageSections(defaultSections);
                  setPerLocationByPage(
                    Object.fromEntries(
                      defaultPages
                        .filter((p: any) => p.defaultSelected)
                        .map((page: any) => [
                          page.id,
                          Boolean(page.defaultPerLocationContent),
                        ])
                    )
                  );
                }}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {defaultPages.map((page: any) => {
                const isSelected = selectedPages.some((p) => p.id === page.id);
                return (
                  <div
                    key={page.id}
                    onClick={() => handleTogglePage(page.id)}
                    className={`p-2 rounded border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleTogglePage(page.id)}
                        className="h-3 w-3"
                      />
                      <FileText className={`h-3 w-3 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 truncate block">{page.name}</span>
                        {page.pageRoleLabel ? (
                          <span className="text-[10px] text-gray-500 leading-tight block truncate">
                            {page.pageRoleLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selectedPages.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <Label className="text-sm font-semibold text-gray-900">Select Components</Label>
            <p className="text-xs text-gray-500 mb-3">
              Select any sections you want on each page — you can leave a page with no sections selected. The site header and footer are shared on every page, are not listed here, and are created automatically when you continue; edit them anytime in Dashboard {"->"} Header &amp; Footer.
            </p>
            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
              {selectedPages.map((page: any) => {
                const isLocationPage = page.id === "location";
                const homePage = defaultPages.find((p: any) => p.id === "home");
                const sectionsCatalog =
                  isLocationPage && homePage?.sections?.length
                    ? homePage.sections
                    : page.sections;
                // Location landings always mirror Home section selection
                const pageSectionsList = isLocationPage
                  ? pageSections.home || []
                  : pageSections[page.id] || [];
                const pageRoleLabel = String(page.pageRoleLabel || "").trim();
                const perLocationKey = isLocationPage ? "home" : page.id;

                return (
                  <div key={page.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Layout className="h-4 w-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900">{page.name}</h4>
                          {pageRoleLabel ? (
                            <p className="text-[10px] font-medium text-blue-700 leading-tight">
                              {pageRoleLabel}
                            </p>
                          ) : null}
                        </div>
                        <Badge variant="secondary" className="text-xs h-5 px-1.5 shrink-0">
                          {pageSectionsList.length}/{sectionsCatalog.length}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => {
                            const next = sectionsCatalog.filter((s: any) => s.defaultSelected);
                            if (isLocationPage) {
                              setPageSections({
                                ...pageSections,
                                home: next,
                                location: next.map((s: any) => ({ ...s })),
                              });
                            } else {
                              setPageSections({
                                ...pageSections,
                                [page.id]: next,
                              });
                            }
                          }}
                        >
                          Reset
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => {
                            const next = [...sectionsCatalog];
                            if (isLocationPage) {
                              setPageSections({
                                ...pageSections,
                                home: next,
                                location: next.map((s: any) => ({ ...s })),
                              });
                            } else {
                              setPageSections({
                                ...pageSections,
                                [page.id]: next,
                              });
                            }
                          }}
                        >
                          All
                        </Button>
                      </div>
                    </div>
                    {isLocationPage ? (
                      <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5">
                        <p className="text-xs font-medium text-amber-900">
                          Same sections as Home
                        </p>
                        <p className="text-[10px] text-amber-800 leading-tight">
                          Location pages reuse the Home layout. Changing sections here also updates Home — content is generated per area when location-specific content is on.
                        </p>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 mb-2 rounded border border-blue-100 bg-blue-50/50 px-2 py-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900">Location-specific content</p>
                        <p className="text-[10px] text-gray-500 leading-tight">
                          On = unique content per area. Off = one version for main area only.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(perLocationByPage[perLocationKey])}
                        onCheckedChange={(checked) => {
                          const next = {
                            ...perLocationByPage,
                            [perLocationKey]: Boolean(checked),
                          };
                          if (isLocationPage || page.id === "home") {
                            next.home = Boolean(checked);
                            next.location = Boolean(checked);
                          }
                          setPerLocationByPage(next);
                        }}
                        aria-label={`Location-specific content for ${page.name}`}
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto border rounded bg-white p-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {sectionsCatalog.map((section: any) => {
                          const isLockedServiceAbout =
                            page.id === "service" &&
                            String(section.id).toLowerCase() === "servicedetailabout";

                          const isSelected = pageSectionsList.some(
                            (sel: any) => sel.id === section.id
                          );

                          const toggleSection = () => {
                            if (isLockedServiceAbout) return;
                            const pageKey =
                              page.id === "service"
                                ? "service"
                                : page.id === "services"
                                  ? "services"
                                  : page.id === "areas"
                                    ? "areas"
                                    : page.id === "about"
                                      ? "about"
                                      : page.id === "contact"
                                        ? "contact"
                                        : page.id === "legal"
                                          ? "legal"
                                          : page.id === "blog"
                                            ? "blog"
                                            : page.id === "blogdetail"
                                              ? "blogdetail"
                                              : "home";
                            const baseList = isLocationPage
                              ? pageSections.home || []
                              : pageSectionsList;
                            const nextList = isSelected
                              ? baseList.filter((sel: any) => sel.id !== section.id)
                              : [...baseList, section];
                            const ordered = sortSectionObjectsByCanonicalOrder(
                              pageKey,
                              nextList,
                              (s: any) => s.id
                            );
                            if (isLocationPage || page.id === "home") {
                              setPageSections({
                                ...pageSections,
                                home: ordered,
                                location: ordered.map((s: any) => ({ ...s })),
                              });
                            } else {
                              setPageSections({
                                ...pageSections,
                                [page.id]: ordered,
                              });
                            }
                          };

                          const label = String(section.name || section.id);

                          return (
                            <div
                              key={section.id}
                              onClick={toggleSection}
                              className={`p-2 rounded border cursor-pointer transition-all text-xs ${
                                isSelected
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 bg-white hover:border-green-300"
                              } ${isLockedServiceAbout ? "opacity-80 cursor-not-allowed" : ""}`}
                            >
                              <div className="flex items-center space-x-1.5">
                                <Checkbox
                                  checked={isLockedServiceAbout ? true : isSelected}
                                  onCheckedChange={toggleSection}
                                  disabled={isLockedServiceAbout}
                                  className="h-3 w-3"
                                />
                                <span className="text-xs font-medium text-gray-900">
                                  {label}
                                  {isLockedServiceAbout ? " (Auto)" : ""}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedPages.length === 0 && (
          <div className="text-center p-6 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/30">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-gray-700 font-medium text-sm mb-1">No pages selected</p>
            <p className="text-gray-500 text-xs">Please select at least one page to continue</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

