import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import { httpFile, http } from "../../config.js";
import { toast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { AIServicesReviewDialog } from "./AIServicesReviewDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Step1BasicInfo } from "./businesswebsiteSteps/Step1BasicInfo";
import { Step2Locations } from "./businesswebsiteSteps/Step2Locations";
import { Step3LocalAreas } from "./businesswebsiteSteps/Step3LocalAreas";
import { Step4Services } from "./businesswebsiteSteps/Step4Services";
import { Step5ContactInfo } from "./businesswebsiteSteps/Step5ContactInfo";
import { Step6PagesSections } from "./businesswebsiteSteps/Step6PagesSections";
import { Step7DesignPreview } from "./businesswebsiteSteps/Step7DesignPreview";
import { ServiceDialogs } from "./businesswebsiteSteps/ServiceDialogs";
import { LocalAreaGenerateDialog } from "./businesswebsiteSteps/LocalAreaGenerateDialog";
import { DesignGenerationDialog } from "./businesswebsiteSteps/DesignGenerationDialog";
import { WizardProgressHeader, type WebsiteWizardVariant } from "./businesswebsiteSteps/WizardProgressHeader";
import {
  defaultBusinessHours,
  normalizeBusinessHours,
} from "./businesswebsiteSteps/businessHoursUtils";
import {
  BulkGeoLocationPanel,
  type BulkGeoLocationPanelHandle,
} from "./bulkwebsiteSteps/BulkGeoLocationPanel";

type BusinessWebsiteCreateProps = {
  variant?: WebsiteWizardVariant;
};

function servicesStepFor(variant: WebsiteWizardVariant) {
  return variant === "bulk" ? 6 : 4;
}

function contactStepFor(variant: WebsiteWizardVariant) {
  return variant === "bulk" ? 7 : 5;
}

function designStepFor(variant: WebsiteWizardVariant) {
  return variant === "bulk" ? 8 : 6;
}

function previewStepFor(variant: WebsiteWizardVariant) {
  return variant === "bulk" ? 9 : 7;
}
import { WizardNavigation } from "./businesswebsiteSteps/WizardNavigation";
import {
  ColorScheme,
  CustomColorScheme,
  buildDefaultPerLocationByPage,
  buildInitialPageSections,
  clearWebsiteWizardStorage,
  DEFAULT_PAGES,
  PageOption,
  PRESET_THEMES,
  SectionOption,
  wizardStoragePrefix,
} from "./businesswebsiteSteps/businessWebsiteConfig";
import {
  DEFAULT_CUSTOM_COLORS,
  DEFAULT_FONT_FAMILY,
  buildColorSchemeFromThemeState,
  buildThemeApiPayload,
  parseThemeSettingsFromApi,
  type ThemeDesignState,
} from "./businesswebsiteSteps/designConfig";
import { sortSectionObjectsByCanonicalOrder } from "@shared/siteSectionOrder";

const SOCIAL_PRESET_PLATFORMS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
  { key: "threads", label: "Threads", placeholder: "https://threads.net/..." },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/15551234567" },
] as const;

type SocialPresetKey = (typeof SOCIAL_PRESET_PLATFORMS)[number]["key"];

function emptyPresetSocialUrls(): Record<SocialPresetKey, string> {
  return Object.fromEntries(SOCIAL_PRESET_PLATFORMS.map((p) => [p.key, ""])) as Record<
    SocialPresetKey,
    string
  >;
}

function ensureUrlProtocol(input: string): string {
  const t = input.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isValidHttpUrl(input: string): boolean {
  const withProto = ensureUrlProtocol(input);
  try {
    const u = new URL(withProto);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface CustomSocialLinkRow {
  id: string;
  label: string;
  url: string;
}

function stableSocialLinksPayload(
  links: { platform: string; customLabel?: string; url: string }[]
) {
  return JSON.stringify(
    [...links].sort((a, b) =>
      `${a.platform}|${a.url}|${a.customLabel || ""}`.localeCompare(
        `${b.platform}|${b.url}|${b.customLabel || ""}`
      )
    )
  );
}

function buildSocialLinksFromForm(
  presetUrls: Record<string, string>,
  customRows: CustomSocialLinkRow[]
): { platform: string; customLabel?: string; url: string }[] {
  const links: { platform: string; customLabel?: string; url: string }[] = [];
  for (const p of SOCIAL_PRESET_PLATFORMS) {
    const raw = (presetUrls[p.key] || "").trim();
    if (!raw) continue;
    links.push({ platform: p.key, url: ensureUrlProtocol(raw) });
  }
  for (const row of customRows) {
    const raw = row.url.trim();
    if (!raw) continue;
    const label = row.label.trim();
    links.push({
      platform: "custom",
      ...(label ? { customLabel: label } : {}),
      url: ensureUrlProtocol(raw),
    });
  }
  return links;
}

function parseSocialLinksFromAboutUs(socialLinks: unknown): {
  presetUrls: Record<SocialPresetKey, string>;
  customRows: CustomSocialLinkRow[];
} {
  const presetKeys = new Set<string>(SOCIAL_PRESET_PLATFORMS.map((p) => p.key));
  const presetUrls = emptyPresetSocialUrls();
  const customRows: CustomSocialLinkRow[] = [];
  if (!Array.isArray(socialLinks)) {
    return { presetUrls, customRows };
  }
  for (const item of socialLinks) {
    if (!item || typeof item !== "object") continue;
    const row = item as { platform?: string; url?: string; customLabel?: string };
    const platform = String(row.platform || "").toLowerCase();
    const url = String(row.url || "").trim();
    if (!url) continue;
    if (platform === "custom" || !presetKeys.has(platform)) {
      customRows.push({
        id: crypto.randomUUID(),
        label:
          platform === "custom"
            ? String(row.customLabel || "").trim()
            : platform,
        url,
      });
    } else {
      presetUrls[platform as SocialPresetKey] = url;
    }
  }
  return { presetUrls, customRows };
}

/** Navbar/footer are project-wide (Header & Footer dashboard), not per-page Genie sections. */
const SITE_WIDE_HEADER_FOOTER_SECTION_IDS = new Set(["navbar", "footer"]);

async function ensureDefaultHeaderFooterForProject(projectId: string) {
  const token = localStorage.getItem("token");
  const userId =
    localStorage.getItem("userId") ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("adminProfile") || "{}")._id;
      } catch {
        return "";
      }
    })();
  if (!token || !userId) return;

  for (const type of [0, 1] as const) {
    try {
      await http.post(
        "/header-footer/create-default",
        { projectId, userId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e: any) {
      const msg = String(e?.response?.data?.message || "");
      if (e?.response?.status === 400 && /already exists/i.test(msg)) continue;
      console.warn("[ensureDefaultHeaderFooterForProject] create-default skipped:", type, e?.message || e);
    }
  }
}

/** After pages are upserted — fill header with all selected page links (About, Services, Areas, Blog, Contact…). */
async function rebuildHeaderFooterMenusForProject(projectId: string) {
  const token = localStorage.getItem("token");
  if (!token || !projectId) return;
  try {
    await http.post(
      "/header-footer/rebuild-menus",
      { projectId, syncSections: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (e: any) {
    console.warn(
      "[rebuildHeaderFooterMenusForProject] skipped:",
      e?.response?.data?.message || e?.message || e
    );
  }
}

export function BusinessWebsiteCreate({ variant = "business" }: BusinessWebsiteCreateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const storagePrefix = wizardStoragePrefix(variant);
  const isBulk = variant === "bulk";
  const geoPanelRef = useRef<BulkGeoLocationPanelHandle>(null);
  const servicesStep = servicesStepFor(variant);
  const contactStep = contactStepFor(variant);
  const designStep = designStepFor(variant);
  const previewStep = previewStepFor(variant);

  // Load last step from localStorage
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem(`${storagePrefix}_step`);
    return savedStep ? parseInt(savedStep, 10) : 1;
  });

  // Save step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}_step`, step.toString());
  }, [step, storagePrefix]);

  // Basic Info
  const [businessName, setBusinessName] = useState("");
  /** 1 = Freepik stock, 2 = Gemini (nano) AI — stored as UserProject.sectionImageOrigin */
  const [sectionImageOrigin, setSectionImageOrigin] = useState<1 | 2>(1);
  const [serviceType, setServiceType] = useState("");

  // Keywords
  const [projectKeywordsText, setProjectKeywordsText] = useState<string>("");
  const [generatingPK, setGeneratingPK] = useState(false);
  const [focusKeyword, setFocusKeyword] = useState<string>("");
  const [generatingFK, setGeneratingFK] = useState(false);

  // Categories state (similar to CreateProject)
  const [categories, setCategories] = useState<{ _id: string, name: string }[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<{ _id: string, name: string } | null>(null);

  const [subCategories, setSubCategories] = useState<{ _id: string, name: string }[]>([]);
  
  const [selectedSubCategories, setSelectedSubCategories] = useState<Array<string>>([]);
  const [manualSubCategories, setManualSubCategories] = useState<Array<string>>([]);

  
  const [manualMicroCategories, setManualMicroCategories] = useState<Array<string>>([]);

  // Project state
  const [projectId, setProjectId] = useState<string | null>(() => {
    const savedProjectId = localStorage.getItem(`${storagePrefix}_projectId`);
    if (savedProjectId) {
      return savedProjectId;
    }
    // Try to load from URL params (if editing existing project)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get('projectId');
      if (urlProjectId) {
        return urlProjectId;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Save projectId to localStorage whenever it changes
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`${storagePrefix}_projectId`, projectId);
    } else {
      localStorage.removeItem(`${storagePrefix}_projectId`);
    }
  }, [projectId, storagePrefix]);

  // Step 2: Services
  const [serviceOption, setServiceOption] = useState<"manual" | "ai" | "">("");
  const [serviceNames, setServiceNames] = useState("");
  /** Saved in DB — shown read-only; step 4 only submits new names */
  const [existingServiceNames, setExistingServiceNames] = useState<string[]>([]);
  const [generatingServices, setGeneratingServices] = useState(false);
  const [showAIServicesReview, setShowAIServicesReview] = useState(false);
  const [aiGeneratedServices, setAIGeneratedServices] = useState<string[]>([]);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualServiceText, setManualServiceText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Step 3: Multiple Locations
  interface Location {
    id: string;
    address: string;
    createPage: boolean;
  }
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocationInput, setCurrentLocationInput] = useState("");

  // Step 5: Contact Information
  interface ContactValue {
    value: string;
    is_primary: boolean;
  }
  const [emails, setEmails] = useState<ContactValue[]>([{ value: "", is_primary: true }]);
  const [phones, setPhones] = useState<ContactValue[]>([{ value: "", is_primary: true }]);
  const [businessHours, setBusinessHours] = useState(() => defaultBusinessHours());
  const [lastSavedEmails, setLastSavedEmails] = useState("");
  const [lastSavedPhones, setLastSavedPhones] = useState("");
  const [lastSavedBusinessHours, setLastSavedBusinessHours] = useState(() =>
    JSON.stringify(defaultBusinessHours())
  );
  const [presetSocialUrls, setPresetSocialUrls] = useState<Record<SocialPresetKey, string>>(emptyPresetSocialUrls);
  const [customSocialLinks, setCustomSocialLinks] = useState<CustomSocialLinkRow[]>([]);
  const [lastSavedSocialLinks, setLastSavedSocialLinks] = useState(() =>
    stableSocialLinksPayload([])
  );

  // Local Areas for each location
  interface LocalArea {
    id: string;
    name: string;
    createPage: boolean;
  }
  interface LocationWithAreas {
    locationId: string;
    locationName?: string; // Location name for display
    localAreas: LocalArea[];
    localAreaInput: string;
    generatingAreas: boolean;
  }
  const [locationsWithAreas, setLocationsWithAreas] = useState<LocationWithAreas[]>([]);
  const [showLocalAreaGenerateDialog, setShowLocalAreaGenerateDialog] = useState(false);
  const [selectedLocationForGenerate, setSelectedLocationForGenerate] = useState<string>("");
  const [localAreaGenerateCount, setLocalAreaGenerateCount] = useState("10");

  // Step 6: Pages and Sections Selection
  const [selectedPages, setSelectedPages] = useState<PageOption[]>(() =>
    DEFAULT_PAGES.filter(p => p.defaultSelected)
  );
  const [pageSections, setPageSections] = useState<Record<string, SectionOption[]>>(
    () => buildInitialPageSections()
  );
  const [perLocationByPage, setPerLocationByPage] = useState<Record<string, boolean>>(
    () => buildDefaultPerLocationByPage()
  );

  /**
   * Pages to persist as WebsitePage rows.
   *
   * - Include Service + Blog Article templates (they store section blueprints).
   * - Exclude Area Detail (`location`): landings are `location-{id}` pages that
   *   reuse Home design; publishing a fake `/location` page breaks Areas nav.
   */
  const getUpsertablePages = (pages: PageOption[] = selectedPages) =>
    pages.filter((p) => p.id !== "location");

  // Keep pageSections keys in sync so a selected page can legally have zero sections.
  useEffect(() => {
    setPageSections((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const page of selectedPages) {
        if (!Array.isArray(next[page.id])) {
          next[page.id] = [];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedPages]);

  // Service template always includes About Service (required for grids + service pages).
  useEffect(() => {
    const serviceSelected = selectedPages.some((p) => p.id === "service");
    if (!serviceSelected) return;
    setPageSections((prev) => {
      const list = Array.isArray(prev.service) ? [...prev.service] : [];
      const hasAbout = list.some(
        (s) => String(s?.id || "").toLowerCase() === "servicedetailabout"
      );
      if (hasAbout) return prev;
      const aboutOpt =
        DEFAULT_PAGES.find((p) => p.id === "service")?.sections.find(
          (s) => s.id === "servicedetailabout"
        ) || {
          id: "servicedetailabout",
          name: "About Service",
          description: "Detailed service description (required)",
          defaultSelected: true,
        };
      return {
        ...prev,
        service: sortSectionObjectsByCanonicalOrder(
          "service",
          [...list, aboutOpt],
          (s: any) => s.id
        ),
      };
    });
  }, [selectedPages]);

  // Location pages use the exact same sections as Home — keep selection in sync.
  useEffect(() => {
    const locationSelected = selectedPages.some((p) => p.id === "location");
    if (!locationSelected) return;
    setPageSections((prev) => {
      const homeSecs = Array.isArray(prev.home) ? prev.home : [];
      const locSecs = Array.isArray(prev.location) ? prev.location : [];
      const same =
        homeSecs.length === locSecs.length &&
        homeSecs.every(
          (s, i) => String(s?.id || "") === String(locSecs[i]?.id || "")
        );
      if (same) return prev;
      return { ...prev, location: homeSecs.map((s) => ({ ...s })) };
    });
  }, [selectedPages, pageSections.home]);

  // Location landings share Home's location-specific content flag.
  // Selecting Area Detail means per-location content must be on for Home
  // (landings reuse Home design + location-scoped SectionContent).
  useEffect(() => {
    const locationSelected = selectedPages.some((p) => p.id === "location");
    const homeSelected = selectedPages.some((p) => p.id === "home");
    if (!locationSelected && !homeSelected) return;
    setPerLocationByPage((prev) => {
      if (locationSelected) {
        if (prev.home && prev.location) return prev;
        return { ...prev, home: true, location: true };
      }
      return prev;
    });
  }, [selectedPages, perLocationByPage.home, perLocationByPage.location]);
  const [generatingDesign, setGeneratingDesign] = useState(false);
  const [showDesignDialog, setShowDesignDialog] = useState(false);
  const [designReady, setDesignReady] = useState(false);
  const [designPreview, setDesignPreview] = useState<any>(null);

  const [selectedTheme, setSelectedTheme] = useState<string>('crimson-jet');
  const [showCustomColors, setShowCustomColors] = useState(false);
  const [selectedFont, setSelectedFont] = useState(DEFAULT_FONT_FAMILY);
  const [customColors, setCustomColors] = useState<CustomColorScheme>({ ...DEFAULT_CUSTOM_COLORS });

  const themeStateRef = useRef<ThemeDesignState>({
    selectedTheme: 'crimson-jet',
    showCustomColors: false,
    customColors: { ...DEFAULT_CUSTOM_COLORS },
    selectedFont: DEFAULT_FONT_FAMILY,
  });
  const userModifiedThemeRef = useRef(false);

  useEffect(() => {
    themeStateRef.current = { selectedTheme, showCustomColors, customColors, selectedFont };
  }, [selectedTheme, showCustomColors, customColors, selectedFont]);

  useEffect(() => {
    userModifiedThemeRef.current = false;
  }, [projectId]);

  const handleSelectTheme = (value: string) => {
    userModifiedThemeRef.current = true;
    setSelectedTheme(value);
  };
  const handleSetShowCustomColors = (value: boolean) => {
    userModifiedThemeRef.current = true;
    setShowCustomColors(value);
  };
  const handleSetCustomColors = (value: CustomColorScheme) => {
    userModifiedThemeRef.current = true;
    setCustomColors(value);
  };
  const handleSetSelectedFont = (value: string) => {
    userModifiedThemeRef.current = true;
    setSelectedFont(value);
  };

  const selectedPresetTheme = PRESET_THEMES.find((t) => t.id === selectedTheme);

  /** Reset wizard to step 1 after generation or when starting a new project. */
  const resetWizardToFreshStart = () => {
    clearWebsiteWizardStorage(variant);
    localStorage.removeItem("lastCreateProjectId");

    setStep(1);
    setProjectId(null);
    setBusinessName("");
    setSectionImageOrigin(1);
    setServiceType("");
    setProjectKeywordsText("");
    setFocusKeyword("");
    setSelectedCategory(null);
    setSelectedSubCategories([]);
    setManualSubCategories([]);
    setManualMicroCategories([]);
    setServiceOption("");
    setServiceNames("");
    setExistingServiceNames([]);
    setLocations([]);
    setCurrentLocationInput("");
    setLocationsWithAreas([]);
    setEmails([{ value: "", is_primary: true }]);
    setPhones([{ value: "", is_primary: true }]);
    const defaultHours = defaultBusinessHours();
    setBusinessHours(defaultHours);
    setPresetSocialUrls(emptyPresetSocialUrls());
    setCustomSocialLinks([]);
    setLastSavedEmails("");
    setLastSavedPhones("");
    setLastSavedBusinessHours(JSON.stringify(defaultHours));
    setLastSavedSocialLinks(stableSocialLinksPayload([]));
    setSelectedPages(DEFAULT_PAGES.filter((p) => p.defaultSelected));
    setPageSections(buildInitialPageSections());
    setPerLocationByPage(buildDefaultPerLocationByPage());
    setGeneratingDesign(false);
    setShowDesignDialog(false);
    setDesignReady(false);
    setDesignPreview(null);
    setSelectedTheme("crimson-jet");
    setShowCustomColors(false);
    setSelectedFont(DEFAULT_FONT_FAMILY);
    setCustomColors({ ...DEFAULT_CUSTOM_COLORS });
    themeStateRef.current = {
      selectedTheme: "crimson-jet",
      showCustomColors: false,
      customColors: { ...DEFAULT_CUSTOM_COLORS },
      selectedFont: DEFAULT_FONT_FAMILY,
    };
    userModifiedThemeRef.current = false;
    setLoading(false);
    setShowAIServicesReview(false);
    setAIGeneratedServices([]);
    setShowManualDialog(false);
    setManualServiceText("");
    setUploadedFile(null);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  // Fresh create from projects list / sidebar (?projectId= means resume/edit)
  useEffect(() => {
    const urlProjectId = new URLSearchParams(window.location.search).get("projectId");
    const freshStart = location.state?.isEditMode === false;
    if (freshStart && !urlProjectId) {
      resetWizardToFreshStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Legacy support - convert theme to ColorScheme format for backward compatibility
  const selectedColorScheme: ColorScheme = showCustomColors
    ? {
      id: 'custom',
      name: 'Custom Theme',
      primary: customColors.primaryButton.bg,
      secondary: customColors.accent,
      accent: customColors.accent,
      description: 'Your custom color scheme'
    }
    : {
      id: selectedTheme,
      name: selectedPresetTheme?.name || 'Crimson Jet',
      primary: selectedPresetTheme?.primary || '#E11D48',
      secondary: selectedPresetTheme?.surface || '#0E1214',
      accent: selectedPresetTheme?.heading || '#F8FAFC',
      description: selectedPresetTheme?.description || 'Bold and modern'
    };

  // Fetch all categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.get("/fetchCategories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedCategory || !selectedCategory._id) return;
      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("categoryId", selectedCategory._id);
        const res = await httpFile.post("/fetchSubCategories", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          setSubCategories(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch subcategories", err);
      }
    };
    fetchSubCategories();
    setSelectedSubCategories([]);
    setManualSubCategories([]);
    setManualMicroCategories([]);
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory) setServiceType(selectedCategory.name);
  }, [selectedCategory]);

  const handleInsufficientCredits = async (error: any) => {
    const message = String(error?.response?.data?.message || error?.message || "").toLowerCase();
    if (!message.includes("insufficient credits")) return false;

    const result = await Swal.fire({
      title: "Insufficient Credits",
      text: "You have insufficient credits. Please buy credits to continue.",
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Go to Purchase Credits",
      cancelButtonText: "Close",
    });
    if (result.isConfirmed) navigate("/admin/credits");
    return true;
  };

  // Generate Focus Keyword function
  const generateFocusKeyword = async () => {
    if (!businessName || (!serviceType && !selectedCategory)) {
      toast({
        title: "Missing info",
        description: "Please enter Business Name and Category/Service Type first.",
        variant: "destructive",
      });
      return;
    }
    setGeneratingFK(true);
    try {
      const categoryPayload = selectedCategory?.name || serviceType?.trim();
      // Combine selected subcategories from dropdown and manual entries
      const subCategoriesPayload = [
        ...selectedSubCategories,
        ...manualSubCategories
      ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      const microCategoriesPayload = [...manualMicroCategories];

      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("serviceType", selectedCategory?.name || serviceType || categoryPayload || "");
      form.append("projectName", businessName);
      form.append("categories", JSON.stringify([categoryPayload]));
      form.append("subCategories", JSON.stringify(subCategoriesPayload));
      form.append("microCategories", JSON.stringify(microCategoriesPayload));

      const res = await httpFile.post("/getFocusedKeyword", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const kw = cleanAIString(res?.data?.data || "");
      setFocusKeyword(kw);
      toast({ title: "Generated", description: `Focus keyword: ${kw}` });
    } catch (err: any) {
      const handled = await handleInsufficientCredits(err);
      if (handled) return;
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to generate focus keyword.",
        variant: "destructive",
      });
    } finally {
      setGeneratingFK(false);
    }
  };

  // Add location to list (allows manual entry like categories)
  const handleAddLocation = () => {
    const locationName = currentLocationInput.trim();
    if (!locationName) {
      toast({
        title: "Validation Error",
        description: "Please enter a location name",
        variant: "destructive",
      });
      return;
    }

    // Check if location already exists
    if (locations.some(loc => loc.address === locationName)) {
      toast({
        title: "Duplicate Location",
        description: "This location is already added",
        variant: "destructive",
      });
      return;
    }

    // Create location - only save the name, not other Google data
    const newLocation: Location = {
      id: Date.now().toString(),
      address: locationName, // Only save the location name
      createPage: true, // Default to creating page
    };

    setLocations([...locations, newLocation]);
    setCurrentLocationInput("");
  };

  // Remove location from list
  const handleRemoveLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  // Toggle page creation for a location
  const handleToggleCreatePage = (id: string) => {
    setLocations(locations.map(loc =>
      loc.id === id ? { ...loc, createPage: !loc.createPage } : loc
    ));
  };

  // Handle AI generation for Project Keywords
  // Helper function to clean AI-generated strings
  const cleanAIString = (str: any) =>
    typeof str === "string"
      ? str
        .replace(/^"+|"+$/g, "")
        .replace(/\\"/g, '"')
        .replace(/\\n/g, " ")
        .trim()
      : String(str || "").trim();

  const handleGenerateProjectKeywords = async () => {
    if (!businessName || (!serviceType && !selectedCategory)) {
      toast({
        title: "Missing Information",
        description: "Please fill in Business Name and Category/Service Type first",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPK(true);
    try {
      const categoryPayload = selectedCategory?.name || serviceType?.trim();
      // Combine selected subcategories from dropdown and manual entries
      const subCategoriesPayload = [
        ...selectedSubCategories,
        ...manualSubCategories
      ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      const microCategoriesPayload = [...manualMicroCategories];

      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("serviceType", selectedCategory?.name || serviceType || categoryPayload || "");
      form.append("projectName", businessName);
      form.append("categories", JSON.stringify([categoryPayload]));
      form.append("subCategories", JSON.stringify(subCategoriesPayload));
      form.append("microCategories", JSON.stringify(microCategoriesPayload));

      if (focusKeyword) form.append("focusKeyword", focusKeyword);

      const res = await httpFile.post("/getProjectKeywords", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
      const joined = arr
        .map((s: any) => cleanAIString(String(s || "")))
        .filter(Boolean)
        .join(", ");
      setProjectKeywordsText(joined);

      toast({ title: "Generated", description: "Project keywords updated." });
    } catch (err: any) {
      const handled = await handleInsufficientCredits(err);
      if (handled) return;
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to generate project keywords.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPK(false);
    }
  };

  // AI Service Generation - Count Input State
  const [showAICountDialog, setShowAICountDialog] = useState(false);
  const [aiServiceCount, setAIServiceCount] = useState("10");

  // Handle AI Service Generation - Open Count Dialog
  const handleGenerateAIServices = () => {
    if (!projectId) {
      toast({
        title: "Missing Information",
        description: "Please complete Step 1 (Basic Info) first",
        variant: "destructive",
      });
      return;
    }
    setAIServiceCount("10");
    setShowAICountDialog(true);
  };

  // Confirm AI Generation
  const handleConfirmAIGeneration = async () => {
    const count = parseInt(aiServiceCount || "10", 10);
    if (isNaN(count) || count < 1 || count > 50) {
      toast({
        title: "Invalid Number",
        description: "Please enter a number between 1 and 50",
        variant: "destructive",
      });
      return;
    }

    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is missing. Please complete Step 1 first.",
        variant: "destructive",
      });
      return;
    }

    setShowAICountDialog(false);
    setGeneratingServices(true);
    try {
      const token = localStorage.getItem("token");
      // 1) Preview names via backend AI (no DB write)
      const preview = await httpFile.post(
        "/genrateAiProjectServices",
        { projectId, count: count },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const aiNames: string[] = Array.isArray(preview.data?.services) ? preview.data.services : [];
      if (!aiNames.length) {
        toast({
          title: "No Services",
          description: "AI did not return any service names",
          variant: "destructive"
        });
        setGeneratingServices(false);
        return;
      }

      // 2) Show review dialog
      setAIGeneratedServices(aiNames);
      setShowAIServicesReview(true);
      setGeneratingServices(false);
    } catch (error: any) {
      const handled = await handleInsufficientCredits(error);
      if (handled) return;
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to generate services",
        variant: "destructive",
      });
    } finally {
      setGeneratingServices(false);
    }
  };

  // Handle Manual Service Entry - Open Dialog
  const handleManualServiceEntry = () => {
    setManualServiceText(serviceNames);
    setUploadedFile(null);
    setShowManualDialog(true);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);

      // Read Excel file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const fromFile = rows
            .map((r: any) => r[0])
            .filter((v: any) => typeof v === "string" && v.trim())
            .join("\n");

          setManualServiceText(prev => {
            const existing = prev.trim();
            return existing ? `${existing}\n${fromFile}` : fromFile;
          });

          toast({
            title: "File Uploaded",
            description: "Services from Excel file have been added",
          });
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to parse Excel file",
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Save Manual Services
  const handleSaveManualServices = () => {
    const servicesArray = manualServiceText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (servicesArray.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one service name or upload an Excel file",
        variant: "destructive",
      });
      return;
    }

    setServiceNames(servicesArray.join("\n"));
    setServiceOption("manual");
    setShowManualDialog(false);
    setManualServiceText("");
    setUploadedFile(null);

    toast({
      title: "Success",
      description: "Services saved successfully",
    });
  };

  // Validate Step 1
  const validateStep1 = () => {
    if (!businessName.trim()) {
      toast({
        title: "Validation Error",
        description: "Business name is required",
        variant: "destructive",
      });
      return false;
    }
    if (!serviceType.trim()) {
      toast({
        title: "Validation Error",
        description: "Service type is required",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Validate Step 2
  const validateStep2 = () => {
    if (!serviceOption) {
      toast({
        title: "Validation Error",
        description: "Please add services using Manual Entry or AI Generation",
        variant: "destructive",
      });
      return false;
    }
    if (!serviceNames.trim()) {
      toast({
        title: "Validation Error",
        description: "Please add at least one service",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const applyAboutUsToContactForm = (aboutUsData: any) => {
    const normalizedEmails = Array.isArray(aboutUsData.emails) && aboutUsData.emails.length > 0
      ? aboutUsData.emails.map((item: any, index: number) => ({
        value: item?.value || "",
        is_primary: item?.is_primary === true || index === 0,
      }))
      : [{
        value: aboutUsData.email || "",
        is_primary: true,
      }];
    const normalizedPhones = Array.isArray(aboutUsData.phones) && aboutUsData.phones.length > 0
      ? aboutUsData.phones.map((item: any, index: number) => ({
        value: item?.value || "",
        is_primary: item?.is_primary === true || index === 0,
      }))
      : [{
        value: aboutUsData.phone || "",
        is_primary: true,
      }];

    setEmails(normalizedEmails);
    setPhones(normalizedPhones);
    setLastSavedEmails(JSON.stringify(normalizedEmails));
    setLastSavedPhones(JSON.stringify(normalizedPhones));
    const hours = normalizeBusinessHours(aboutUsData.businessHours);
    setBusinessHours(hours);
    setLastSavedBusinessHours(JSON.stringify(hours));
    const { presetUrls, customRows } = parseSocialLinksFromAboutUs(aboutUsData.socialLinks);
    setPresetSocialUrls(presetUrls);
    setCustomSocialLinks(customRows);
    setLastSavedSocialLinks(
      stableSocialLinksPayload(buildSocialLinksFromForm(presetUrls, customRows))
    );
  };

  // Load basic info when creating/editing/resuming a project (step 1 or later if fields were lost)
  useEffect(() => {
    if (!projectId) return;
    const needsReload =
      step === 1 ||
      !businessName.trim() ||
      (!serviceType.trim() && !selectedCategory);
    if (!needsReload) return;

    let cancelled = false;

    const loadBasicInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await http.get(`/businessWebsite/${projectId}/basicInfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || res.status !== 200 || !res.data?.data) return;

        const data = res.data.data;
        setBusinessName(data.projectName || "");
        setProjectKeywordsText(data.projectKeywordsText || "");
        setFocusKeyword(data.focusKeyword || "");
        if (data.sectionImageOrigin === 2) setSectionImageOrigin(2);

        const categoryName = data.categories?.[0] || data.serviceType || "";
        if (categoryName) {
          const match = categories.find((c) => c.name === categoryName);
          setSelectedCategory(match || { _id: "", name: categoryName });
          setServiceType(data.serviceType || categoryName);
        }
        setSelectedSubCategories(Array.isArray(data.subCategories) ? data.subCategories : []);
        setManualMicroCategories(Array.isArray(data.microCategories) ? data.microCategories : []);
      } catch (error: any) {
        if (!cancelled) console.error("Error loading basic info:", error);
      }
    };

    loadBasicInfo();
    return () => { cancelled = true; };
  }, [step, projectId, categories, businessName, serviceType, selectedCategory]);

  // Step 2: reload parent locations (business wizard only)
  useEffect(() => {
    if (isBulk || step !== 2 || !projectId) return;
    let cancelled = false;

    const loadLocations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await http.get(`/businessWebsite/${projectId}/locations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || res.status !== 200) return;
        const rows = res.data?.data?.locations || [];
        setLocations(
          rows.map((loc: any) => ({
            id: String(loc.id),
            address: loc.address || loc.areaName || "",
            createPage: loc.createPage !== false,
          }))
        );
      } catch (error: any) {
        if (!cancelled) console.error("Error loading locations:", error);
      }
    };

    loadLocations();
    return () => { cancelled = true; };
  }, [step, projectId, isBulk]);

  // Step 3: reload local areas grouped by parent location (business wizard only)
  useEffect(() => {
    if (isBulk || step !== 3 || !projectId) return;
    let cancelled = false;

    const loadLocalAreas = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await http.get(`/businessWebsite/${projectId}/localAreas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || res.status !== 200) return;
        const rows = res.data?.data?.locations || [];
        if (rows.length > 0) {
          setLocationsWithAreas(rows);
        }
      } catch (error: any) {
        if (!cancelled) console.error("Error loading local areas:", error);
      }
    };

    loadLocalAreas();
    return () => { cancelled = true; };
  }, [step, projectId, isBulk]);

  // Services step: reload existing services (read-only list)
  useEffect(() => {
    if (step !== servicesStep || !projectId) return;
    let cancelled = false;

    const loadServices = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await http.get(`/businessWebsite/${projectId}/services`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || res.status !== 200) return;
        const names = (res.data?.data?.services || [])
          .map((s: any) => String(s.name || s.service_name || "").trim())
          .filter(Boolean);
        setExistingServiceNames(names);
        if (names.length > 0 && !serviceOption) {
          setServiceOption("manual");
        }
      } catch (error: any) {
        if (!cancelled) console.error("Error loading services:", error);
      }
    };

    loadServices();
    return () => { cancelled = true; };
  }, [step, projectId, servicesStep]);

  // Design step: reload saved theme + font when returning
  useEffect(() => {
    if (step !== designStep || !projectId) return;
    let cancelled = false;

    const loadDesignSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await http.get(`/businessWebsite/${projectId}/design`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || res.status !== 200) return;
        if (userModifiedThemeRef.current) return;
        const parsed = parseThemeSettingsFromApi(res.data?.data);
        setSelectedTheme(parsed.selectedTheme);
        setShowCustomColors(parsed.showCustomColors);
        setCustomColors(parsed.customColors);
        setSelectedFont(parsed.selectedFont);
      } catch (error: any) {
        if (!cancelled) console.error("Error loading design settings:", error);
      }
    };

    loadDesignSettings();
    return () => { cancelled = true; };
  }, [step, projectId, designStep]);

  // Contact step: reload contact / AboutUs
  useEffect(() => {
    if (step !== contactStep || !projectId) return;
    let cancelled = false;

    const fetchContactDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await http.get(`/businessWebsite/${projectId}/contact`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || res.status !== 200 || !res.data?.data) return;
        applyAboutUsToContactForm(res.data.data);
      } catch (error: any) {
        if (!cancelled && error.response?.status !== 404) {
          console.error("Error fetching contact details:", error);
        }
      }
    };

    fetchContactDetails();
    return () => { cancelled = true; };
  }, [step, projectId, contactStep]);
  const validateStep3 = () => {
    if (locations.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one location",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Validate Step 5
  const validateStep5 = () => {
    const validEmails = emails.filter((item) => item.value.trim());
    const validPhones = phones.filter((item) => item.value.trim());

    if (validEmails.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one email is required",
        variant: "destructive",
      });
      return false;
    }

    if (validEmails.some((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.value.trim()))) {
      toast({
        title: "Validation Error",
        description: "Please enter valid email addresses",
        variant: "destructive",
      });
      return false;
    }

    if (validPhones.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one phone number is required",
        variant: "destructive",
      });
      return false;
    }

    if (!validEmails.some((item) => item.is_primary)) {
      toast({
        title: "Validation Error",
        description: "Please select one primary email",
        variant: "destructive",
      });
      return false;
    }

    if (!validPhones.some((item) => item.is_primary)) {
      toast({
        title: "Validation Error",
        description: "Please select one primary phone",
        variant: "destructive",
      });
      return false;
    }

    for (const p of SOCIAL_PRESET_PLATFORMS) {
      const v = (presetSocialUrls[p.key] || "").trim();
      if (v && !isValidHttpUrl(v)) {
        toast({
          title: "Validation Error",
          description: `Please enter a valid URL for ${p.label}`,
          variant: "destructive",
        });
        return false;
      }
    }
    for (let i = 0; i < customSocialLinks.length; i++) {
      const row = customSocialLinks[i];
      const url = row.url.trim();
      const label = row.label.trim();
      if (!url && !label) continue;
      if (url && !isValidHttpUrl(url)) {
        toast({
          title: "Validation Error",
          description: `Please enter a valid URL for custom link #${i + 1}`,
          variant: "destructive",
        });
        return false;
      }
      if (label && !url) {
        toast({
          title: "Validation Error",
          description: `Add a URL for the custom platform "${label}", or clear the name`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const updateContactValue = (
    type: "email" | "phone",
    index: number,
    value: string
  ) => {
    if (type === "email") {
      setEmails((prev) =>
        prev.map((item, i) => (i === index ? { ...item, value } : item))
      );
      return;
    }
    setPhones((prev) =>
      prev.map((item, i) => (i === index ? { ...item, value } : item))
    );
  };

  const setPrimaryContact = (type: "email" | "phone", index: number) => {
    if (type === "email") {
      setEmails((prev) => prev.map((item, i) => ({ ...item, is_primary: i === index })));
      return;
    }
    setPhones((prev) => prev.map((item, i) => ({ ...item, is_primary: i === index })));
  };

  const addContactField = (type: "email" | "phone") => {
    if (type === "email") {
      setEmails((prev) => [...prev, { value: "", is_primary: prev.length === 0 }]);
      return;
    }
    setPhones((prev) => [...prev, { value: "", is_primary: prev.length === 0 }]);
  };

  const removeContactField = (type: "email" | "phone", index: number) => {
    if (type === "email") {
      setEmails((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (next.length === 0) return [{ value: "", is_primary: true }];
        if (!next.some((item) => item.is_primary)) next[0].is_primary = true;
        return [...next];
      });
      return;
    }
    setPhones((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) return [{ value: "", is_primary: true }];
      if (!next.some((item) => item.is_primary)) next[0].is_primary = true;
      return [...next];
    });
  };

  // Generate Local Areas (AI)
  const handleConfirmGenerateLocalAreas = async () => {
    if (!selectedLocationForGenerate) return;

    const locationArea = locationsWithAreas.find(l => l.locationId === selectedLocationForGenerate);
    if (!locationArea) return;

    const count = parseInt(localAreaGenerateCount || "10", 10);
    if (isNaN(count) || count < 1 || count > 50) {
      toast({
        title: "Invalid Number",
        description: "Please enter a number between 1 and 50",
        variant: "destructive",
      });
      return;
    }

    setShowLocalAreaGenerateDialog(false);
    setLocationsWithAreas(locationsWithAreas.map(l =>
      l.locationId === selectedLocationForGenerate ? { ...l, generatingAreas: true } : l
    ));

    try {
      // TODO: Add API call for AI generation
      const location = locations.find(l => l.id === selectedLocationForGenerate);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      const generatedAreas: LocalArea[] = Array.from({ length: count }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        name: `Local Area ${i + 1}${location ? ` - ${location.address}` : ''}`,
        createPage: true, // Default to creating page
      }));

      setLocationsWithAreas(locationsWithAreas.map(l =>
        l.locationId === selectedLocationForGenerate
          ? {
            ...l,
            localAreas: [...l.localAreas, ...generatedAreas],
            generatingAreas: false,
          }
          : l
      ));

      toast({
        title: "Success",
        description: `${count} local areas generated successfully`,
      });
    } catch (error) {
      setLocationsWithAreas(locationsWithAreas.map(l =>
        l.locationId === selectedLocationForGenerate ? { ...l, generatingAreas: false } : l
      ));
      toast({
        title: "Error",
        description: "Failed to generate local areas",
        variant: "destructive",
      });
    }
  };

  // Toggle create page for local area
  const handleToggleLocalAreaPage = (locationId: string, areaId: string) => {
    setLocationsWithAreas(locationsWithAreas.map(l =>
      l.locationId === locationId
        ? {
          ...l,
          localAreas: l.localAreas.map(area =>
            area.id === areaId ? { ...area, createPage: !area.createPage } : area
          ),
        }
        : l
    ));
  };

  // Validate Step 4 - No validation needed as it's optional
  const validateStep4 = () => {
    return true;
  };

  // Handle skip step
  const handleSkip = () => {
    if (isBulk) {
      if (step >= 3 && step <= 5) {
        setStep(step === 5 ? servicesStep : step + 1);
      }
      return;
    }
    if (step === 2 || step === 3) {
      setStep(servicesStep);
      return;
    }
    if (step === 4) {
      setStep(5);
    }
  };

  // Toggle page selection
  const handleTogglePage = (pageId: string) => {
    const page = DEFAULT_PAGES.find(p => p.id === pageId);
    if (!page) return;

    const isSelected = selectedPages.some(p => p.id === pageId);
    if (isSelected) {
      // Remove page
      setSelectedPages(selectedPages.filter(p => p.id !== pageId));
      // Remove its sections
      const newSections = { ...pageSections };
      delete newSections[pageId];
      setPageSections(newSections);
    } else if (pageId === "location") {
      // Location landings reuse Home layout — ensure Home is selected and copy its sections.
      const homePage = DEFAULT_PAGES.find((p) => p.id === "home");
      const homeAlready = selectedPages.some((p) => p.id === "home");
      const homeSecs =
        (Array.isArray(pageSections.home) && pageSections.home.length
          ? pageSections.home
          : homePage?.sections.filter((s) => s.defaultSelected)) ||
        page.sections.filter((s) => s.defaultSelected);
      const nextPages = [...selectedPages];
      if (!homeAlready && homePage) nextPages.push(homePage);
      nextPages.push(page);
      const homePerLoc = Boolean(
        perLocationByPage.home ?? homePage?.defaultPerLocationContent ?? true
      );
      setSelectedPages(nextPages);
      setPageSections({
        ...pageSections,
        home: homeSecs.map((s) => ({ ...s })),
        location: homeSecs.map((s) => ({ ...s })),
      });
      setPerLocationByPage({
        ...perLocationByPage,
        home: homePerLoc,
        location: homePerLoc,
      });
    } else {
      // Add page with default sections
      const nextSections = {
        ...pageSections,
        [pageId]: page.sections.filter((s) => s.defaultSelected),
      };
      const nextPerLoc = {
        ...perLocationByPage,
        [pageId]: Boolean(page.defaultPerLocationContent),
      };
      // Keep Location mirror when Home sections are (re)added
      if (pageId === "home" && selectedPages.some((p) => p.id === "location")) {
        nextSections.location = nextSections.home.map((s) => ({ ...s }));
        nextPerLoc.location = nextPerLoc.home;
      }
      setSelectedPages([...selectedPages, page]);
      setPageSections(nextSections);
      setPerLocationByPage(nextPerLoc);
    }
  };

  // Handle Create Design
  const handleCreateDesign = async () => {
    if (!validateStep6()) {
      return;
    }

    // Show design generation dialog
    setShowDesignDialog(true);
    setGeneratingDesign(true);

    try {
     

      // Try to get projectId from localStorage if not in state
      let currentProjectId = projectId;
      if (!currentProjectId) {
        const savedProjectId = localStorage.getItem(`${storagePrefix}_projectId`);
        if (savedProjectId) {
          currentProjectId = savedProjectId;
          setProjectId(savedProjectId);
        }
      }

      // Try to get from URL params as last resort
      if (!currentProjectId && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlProjectId = urlParams.get('projectId');
        if (urlProjectId) {
          currentProjectId = urlProjectId;
          setProjectId(urlProjectId);
          localStorage.setItem(`${storagePrefix}_projectId`, urlProjectId);
        }
      }

   

      if (!currentProjectId) {
        throw new Error("Project ID is missing. Please create a project first or ensure you're editing an existing project.");
      }

      await ensureDefaultHeaderFooterForProject(currentProjectId);

      // Save theme first so ThemeSetting always matches the user's selection
      await saveThemeSettings(currentProjectId);

      // Phase 1: Save GenieBuild design structure (styles + variants) — creates WebsitePage rows
      await saveDesignStructure();

      // Phase 1.25: Rebuild header/footer nav from selected pages (About, Services, Areas, Blog, Contact…)
      await rebuildHeaderFooterMenusForProject(currentProjectId);

      // Phase 1.5: Queue AI for selected sections (design + service pages via queue pass 2)
      try {
        await enqueueSectionsContentGeneration(currentProjectId);
      } catch (queueErr: any) {
        console.warn("[handleCreateDesign] Section content queue:", queueErr);
      }

      const savedColorScheme = buildColorSchemeFromThemeState(themeStateRef.current, PRESET_THEMES);



      // Design ready
      setDesignReady(true);
      setDesignPreview({
        theme: "Modern Business",
        colorScheme: savedColorScheme.name,
        colorPrimary: savedColorScheme.primary,
        colorSecondary: savedColorScheme.secondary,
        colorAccent: savedColorScheme.accent,
        layout: "Responsive Grid",
        pages: selectedPages.length,
        sections: Object.values(pageSections).reduce((sum, sections) => sum + sections.length, 0),
      });

      // Move to Step 7 after a short delay
      setTimeout(() => {
        setShowDesignDialog(false);
        setStep(previewStep);
        setGeneratingDesign(false);
      }, 1000);

    } catch (error: any) {
      console.error("[] Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create design",
        variant: "destructive",
      });
      setShowDesignDialog(false);
      setGeneratingDesign(false);
    }
  };

  const enqueueSectionsContentGeneration = async (currentProjectId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Queue only currently selected admin section IDs; backend generation
    // should stay aligned to backend prompt/module IDs (e.g. servicesgrid).
    const selectedSectionIdSet = new Set(
      Object.values(pageSections)
        .flat()
        .map((s) => String(s?.id || "").toLowerCase())
        .filter(Boolean)
        .filter((id) => !SITE_WIDE_HEADER_FOOTER_SECTION_IDS.has(id))
    );

    // Home services grid needs per-location about bundles on each service page
    // (GenieBuild servicedetailabout dual-writes aboutservice for Multicolor grids).
    const homeSectionIds = (pageSections.home || []).map((s) =>
      String(s?.id || "").toLowerCase()
    );
    if (homeSectionIds.includes("servicesgrid") || homeSectionIds.includes("services")) {
      selectedSectionIdSet.add("servicedetailabout");
      selectedSectionIdSet.add("aboutservice");
    }
    const servicesListIds = (pageSections.services || []).map((s) =>
      String(s?.id || "").toLowerCase()
    );
    if (servicesListIds.includes("serviceslistgrid")) {
      selectedSectionIdSet.add("servicedetailabout");
      selectedSectionIdSet.add("aboutservice");
    }

    const selectedSectionIds = Array.from(selectedSectionIdSet);

    if (selectedSectionIds.length === 0) {
      console.log("[enqueueSectionsContentGeneration] No sections selected — skipping content queue");
      return;
    }

    const perLocationContentByPage: Record<string, boolean> = {};
    for (const page of selectedPages) {
      if (page.id === "location") {
        perLocationContentByPage.location = Boolean(
          perLocationByPage.home ?? perLocationByPage.location
        );
      } else {
        perLocationContentByPage[page.id] = Boolean(perLocationByPage[page.id]);
      }
    }
    if (
      selectedPages.some((p) => p.id === "location") &&
      perLocationContentByPage.home === undefined
    ) {
      perLocationContentByPage.home = Boolean(
        perLocationByPage.home ?? perLocationByPage.location
      );
    }

    await http.post(
      "/enqueueSectionsContentGeneration",
      {
        projectId: currentProjectId,
        selectedSectionIds,
        locations: [],
        perLocationContentByPage,
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  };

  // Handle Regenerate Design
  const handleRegenerateDesign = async () => {
    setGeneratingDesign(true);
    setShowDesignDialog(true);
    setDesignReady(false);

    try {
      if (!projectId) {
        throw new Error("Project ID is missing");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Get existing design data
      const existingDesignResponse = await http.get(
        `/getWebsiteDesignData/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const existingDesign = existingDesignResponse.data?.data;
      if (!existingDesign || !existingDesign.pages) {
        throw new Error("Existing design data not found");
      }

      const theme = PRESET_THEMES.find(t => t.id === themeStateRef.current.selectedTheme) || PRESET_THEMES[0];
      const colorSchemeForSave = buildColorSchemeFromThemeState(themeStateRef.current, PRESET_THEMES);

      await saveThemeSettings(projectId);

      // Randomize variants for each GenieBuild section in each page
      const updatedPages = existingDesign.pages.map((page: any) => {
        if (page.style?.renderer === "geniebuild" && page.style?.sections) {
          const updatedSections = page.style.sections.map((section: any) => {
            const variants = GENIEBUILD_VARIANTS[section.type] || ['default'];
            const randomVariant = variants[Math.floor(Math.random() * variants.length)];
            return {
              ...section,
              styles: {
                ...section.styles,
                variant: randomVariant,
                backgroundColor: theme.surface,
                titleColor: theme.heading,
                buttonBackgroundColor: theme.primary,
              },
            };
          });
          return {
            pageId: page.pageId?._id || page.pageId,
            style: { renderer: "geniebuild", sections: updatedSections },
            componentIds: [],
          };
        }
        return page;
      });

      // Sync updated variants to websitecomponents table
      await syncGenieBuildSectionsToComponents(updatedPages, token);

      // Save updated design
      await http.post(
        "/saveWebsiteDesignData",
        {
          projectId,
          colorScheme: colorSchemeForSave.name,
          colorPrimary: colorSchemeForSave.primary,
          colorSecondary: colorSchemeForSave.secondary,
          colorAccent: colorSchemeForSave.accent,
          pageStyles: { style: {} },
          pages: updatedPages,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDesignReady(true);
      setDesignPreview({
        theme: "Modern Business",
        colorScheme: colorSchemeForSave.name,
        colorPrimary: colorSchemeForSave.primary,
        colorSecondary: colorSchemeForSave.secondary,
        colorAccent: colorSchemeForSave.accent,
        layout: "Responsive Grid",
        pages: selectedPages.length,
        sections: Object.values(pageSections).reduce((sum, sections) => sum + sections.length, 0),
      });

      setTimeout(() => {
        setShowDesignDialog(false);
        setGeneratingDesign(false);
      }, 1000);

    } catch (error: any) {
      console.error("[handleRegenerateDesign] Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate design",
        variant: "destructive",
      });
      setShowDesignDialog(false);
      setGeneratingDesign(false);
    }
  };

  // Handle Generate Website — finalize wizard and reset for the next project
  const handleGenerateWebsite = async () => {
    let currentProjectId = projectId;
    if (!currentProjectId) {
      currentProjectId = localStorage.getItem(`${storagePrefix}_projectId`);
    }

    if (!currentProjectId) {
      toast({
        title: "Error",
        description: "Project ID is missing. Please complete the wizard first.",
        variant: "destructive",
      });
      return;
    }

    const completedName = businessName.trim() || "Your website";
    setLoading(true);
    try {
      toast({
        title: "Success",
        description: isBulk
          ? `"${completedName}" is generating. Open it anytime from Bulk Pages Websites → List.`
          : `"${completedName}" is generating. Open it anytime from Business Websites → List.`,
      });

      resetWizardToFreshStart();
    } finally {
      setLoading(false);
    }
  };

  // Handle next step
  const handleNext = async () => {
    if (step === 1) {
      if (!businessName || !selectedCategory) {
        toast({
          title: "Validation Error",
          description: "Please enter Business Name and select/enter a category",
          variant: "destructive",
        });
        return;
      }

      if (!projectKeywordsText || !focusKeyword) {
        toast({
          title: "Validation Error",
          description: "Please enter Project Keywords and Focus Keyword",
          variant: "destructive",
        });
        return;
      }

      const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");
      const categoryPayload = selectedCategory?.name || serviceType?.trim();
      const subCategoriesPayload = [
        ...selectedSubCategories,
        ...manualSubCategories
      ].filter((value, index, self) => self.indexOf(value) === index);
      const microCategoriesPayload = [...manualMicroCategories];

      if (!categoryPayload) {
        toast({
          title: "Error",
          description: "Please select or enter a category.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        userId: admin._id,
        serviceType: selectedCategory?.name || serviceType || categoryPayload,
        projectName: businessName,
        projectKeywordsText,
        focusKeyword,
        categories: JSON.stringify([categoryPayload]),
        subCategories: JSON.stringify(subCategoriesPayload),
        microCategories: JSON.stringify(microCategoriesPayload),
        wantImages: 1,
        sectionImageOrigin,
      };

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        if (projectId) {
          const res = await httpFile.put(
            `/businessWebsite/${projectId}/basicInfo`,
            payload,
            { headers }
          );
          if (res.status === 200) {
            toast({
              title: "Success",
              description: "Basic info updated successfully!",
            });
            setStep(2);
          }
          return;
        }

        const createUrl = isBulk ? "/createProject" : "/createBusinessWebsite";
        const res = await httpFile.post(createUrl, payload, { headers });

        if (res.status === 401) {
          toast({
            title: "Error",
            description: "invalid token",
            variant: "destructive",
          });
          localStorage.removeItem("token");
          return;
        }

        if (res.status === 201) {
          const newId = res.data.data._id;
          setProjectId(newId);
          localStorage.setItem(`${storagePrefix}_projectId`, newId);
          toast({
            title: "Success",
            description: isBulk
              ? "Bulk pages website created successfully!"
              : "Business website created successfully!",
          });
          setStep(2);
        }
      } catch (err: any) {
        const handled = await handleInsufficientCredits(err);
        if (handled) return;
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred!",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else if (isBulk && step >= 2 && step <= 5) {
      setLoading(true);
      try {
        const ok = await geoPanelRef.current?.saveCurrentStep();
        if (ok) setStep(step + 1);
      } finally {
        setLoading(false);
      }
    } else if (!isBulk && step === 2) {
      // Step 2: Locations (moved from step 3)
      if (locations.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one location before proceeding.",
          variant: "destructive",
        });
        return;
      }

      if (!projectId) {
        toast({
          title: "Error",
          description: "Project ID is missing. Please complete Step 1 first.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        // ✅ Send ALL locations in one request (bulk)
        await httpFile.post(
          `/businessWebsite/${projectId}/locations`,
          {
            locations: locations.map((loc) => ({
              id: loc.id,
              areaName: loc.address,
              createPage: loc.createPage,
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        toast({
          title: "Success",
          description: "Locations saved successfully!",
        });
        setStep(3);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.response?.data?.message || "An error occurred while saving locations!",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
   } else if (!isBulk && step === 3) {
  // Step 3: Local Areas (optional)

  if (!projectId) {
    toast({
      title: "Error",
      description: "Project ID is missing.",
      variant: "destructive",
    });
    return;
  }

  // Collect all local areas into one array
  const allLocalAreas: any[] = [];

  for (const locationWithAreas of locationsWithAreas) {
    for (const localArea of locationWithAreas.localAreas) {
      if (!localArea.name || !localArea.name.trim()) continue;

      allLocalAreas.push({
        areaName: localArea.name.trim(),
        parentId: locationWithAreas.locationId, // required for type 1
        type: 1,
        createPage: localArea.createPage ?? true,
      });
    }
  }

  // If no local areas → skip directly
  if (allLocalAreas.length === 0) {
    setStep(servicesStep);
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("token");

    await httpFile.post(
      `/businessWebsite/${projectId}/localAreas`,
      { localAreas: allLocalAreas },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    toast({
      title: "Success",
      description: "Local areas saved successfully!",
    });

    // ✅ move to next step ONLY on success
    setStep(servicesStep);

  } catch (error: any) {
    console.error("Local area save error:", error);

    toast({
      title: "Error",
      description:
        error?.response?.data?.message ||
        "Failed to save local areas",
      variant: "destructive",
    });

    // ❌ DO NOT MOVE STEP ON ERROR
  } finally {
    setLoading(false);
  }
}
    else if (step === servicesStep) {
      if (!projectId) {
        toast({
          title: "Error",
          description: "Project ID is missing. Please complete Step 1 first.",
          variant: "destructive",
        });
        return;
      }

      const servicesArray = serviceNames
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const existingLower = new Set(existingServiceNames.map((n) => n.toLowerCase()));
      const newServices = servicesArray.filter((name) => !existingLower.has(name.toLowerCase()));

      if (newServices.length === 0) {
        if (existingServiceNames.length > 0) {
          setStep(contactStep);
          return;
        }
        toast({
          title: "Error",
          description: "Please add at least one service using Manual Entry or AI Generation.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const payload = { projectId, wantAiServices: 0, services: newServices };
        const res = await httpFile.post(
          "/addBusinessServicesToLocation",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.status === 200) {
          setExistingServiceNames((prev) => [
            ...prev,
            ...newServices.filter((n) => !prev.some((p) => p.toLowerCase() === n.toLowerCase())),
          ]);
          setServiceNames("");
          toast({
            title: "Success",
            description: "New services added successfully!",
          });

          setStep(contactStep);
        } else {
          toast({
            title: "Error",
            description: "Failed to add services",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.response?.data?.message || "An error occurred while adding services!",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else if (step === contactStep) {
      if (!validateStep5()) {
        return;
      }

      const normalizedEmails = emails
        .map((item) => ({ ...item, value: item.value.trim() }))
        .filter((item) => item.value);
      const normalizedPhones = phones
        .map((item) => ({ ...item, value: item.value.trim() }))
        .filter((item) => item.value);
      const mainLocation = (locations[0]?.address || businessName || "").trim();
      const primaryEmail = normalizedEmails.find((item) => item.is_primary)?.value || normalizedEmails[0]?.value || "";
      const primaryPhone = normalizedPhones.find((item) => item.is_primary)?.value || normalizedPhones[0]?.value || "";
      const normalizedSocialLinks = buildSocialLinksFromForm(presetSocialUrls, customSocialLinks);
      const socialLinksSignature = stableSocialLinksPayload(normalizedSocialLinks);
      const normalizedHours = normalizeBusinessHours(businessHours);
      const hoursSignature = JSON.stringify(normalizedHours);

      // Check if contact details have changed
      const hasContactChanged =
        JSON.stringify(normalizedEmails) !== lastSavedEmails ||
        JSON.stringify(normalizedPhones) !== lastSavedPhones ||
        socialLinksSignature !== lastSavedSocialLinks ||
        hoursSignature !== lastSavedBusinessHours;

      if (!hasContactChanged) {
        setStep(step + 1); // Proceed to next step
        return;
      }

      // Save contact details to aboutus table
      setLoading(true);
      try {
        const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");
        const userId = admin._id;
        const payload = {
          userId,
          projectId,
          email: primaryEmail,
          phone: primaryPhone,
          emails: normalizedEmails,
          phones: normalizedPhones,
          address: mainLocation,
          mainLocation,
          socialLinks: normalizedSocialLinks,
          businessHours: normalizedHours,
        };
        const token = localStorage.getItem("token");
        const res = await http.put(
          `/businessWebsite/${projectId}/contact`,
          payload,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        if ([200, 201, 204].includes(res.status)) {
          toast({
            title: "Success",
            description: "Contact information saved successfully!",
          });
          setLastSavedEmails(JSON.stringify(normalizedEmails));
          setLastSavedPhones(JSON.stringify(normalizedPhones));
          setLastSavedSocialLinks(socialLinksSignature);
          setLastSavedBusinessHours(hoursSignature);
          setBusinessHours(normalizedHours);
          setStep(step + 1);
        } else {
          throw new Error("Failed to save contact information");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred while saving contact information!",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } 
    
    else if (step === designStep) {
      console.log("[handleNext] Design step - validateStep6 called");
      if (validateStep6()) {
        await handleCreateDesign();
      } else {
        console.log("[handleNext] Design step validation failed");
      }
    } else if (step === previewStep) {
      handleGenerateWebsite();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Phase 1: Save Design Structure Only (pages + componentIds, no variants/styles)
  const saveDesignStructure = async () => {
  

    // Try to get projectId from state, localStorage, or URL
    let currentProjectId = projectId;
    if (!currentProjectId) {
      const savedProjectId = localStorage.getItem(`${storagePrefix}_projectId`);
      if (savedProjectId) {
        currentProjectId = savedProjectId;
        setProjectId(savedProjectId);
      }
    }

    if (!currentProjectId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get('projectId');
      if (urlProjectId) {
        currentProjectId = urlProjectId;
        setProjectId(urlProjectId);
        localStorage.setItem(`${storagePrefix}_projectId`, urlProjectId);
      }
    }

    if (!currentProjectId) {
      throw new Error("Project ID is missing");
    }

    const upsertablePages = getUpsertablePages();
    if (upsertablePages.length === 0) {
      throw new Error(
        "Select at least one website page (Home, About Us, Services, etc.)."
      );
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Step 1: Bulk upsert all pages and delete missing ones
    const pageIdsMap: Record<string, string> = {};

    try {
      // Prepare pages array for bulk upsert (GenieBuild sections stored separately, not as componentIds)
      const pagesToUpsert = upsertablePages.map(page => {
        return {
          name: page.id,
          displayName: page.name,
          description: page.description || '',
          perLocationContent:
            page.id === "home" && selectedPages.some((p) => p.id === "location")
              ? true
              : Boolean(perLocationByPage[page.id]),
          componentIds: [], // GenieBuild sections are saved in WebsiteDesignsData.pages[].style
        };
      });

      // Call bulk upsert API (this will also delete pages not in the list)
      const bulkResponse = await http.post(
        "/bulkUpsertWebsitePages",
        {
          projectId: currentProjectId,
          pages: pagesToUpsert,
          deleteMissing: true, // Delete pages not in the selected list
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Backend returns { results: { created, updated, deleted } }.
      // Keep backward compatibility with older { data: { created, ... } } shape.
      const bulkResults =
        bulkResponse.data?.data ||
        bulkResponse.data?.results ||
        {};

      // Map created and updated pages to pageIdsMap
      [...(bulkResults.created || []), ...(bulkResults.updated || [])].forEach((result: any) => {
        // Find the corresponding page by name
        const page = selectedPages.find(p => p.id.toLowerCase() === result.name);
        if (page && result.pageId) {
          pageIdsMap[page.id] = String(result.pageId);
        }
      });

      // Log summary
      console.log(`[saveDesignStructure] Bulk upsert completed:`, {
        created: bulkResults.created?.length || 0,
        updated: bulkResults.updated?.length || 0,
        deleted: bulkResults.deleted?.length || 0,
        errors: bulkResults.errors?.length || 0,
      });

    
      if (bulkResults.errors && bulkResults.errors.length > 0) {
        console.warn(`[saveDesignStructure] Errors during bulk upsert:`, bulkResults.errors);
      }
    } catch (err: any) {
      console.error(`[saveDesignStructure] Error in bulk upsert:`, err);
      throw new Error(`Failed to save pages: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    }

    if (Object.keys(pageIdsMap).length === 0) {
      throw new Error(
        "Could not save website pages. Check your selection and try again, or re-select Home / About / Services."
      );
    }

    // Step 2: Build GenieBuild sections for each page (empty componentIds allowed per page)
    console.log('[saveDesignStructure] Building GenieBuild sections...');

    const pagesData = upsertablePages
      .map((page) => {
      // Location template mirrors Home sections (same GenieBuild ids).
      const sections =
        page.id === "location"
          ? pageSections.home || pageSections.location || []
          : pageSections[page.id] || [];
      const dbPageId = pageIdsMap[page.id];

      if (!dbPageId) {
        console.warn(`[saveDesignStructure] No pageId found for page ${page.id}, skipping`);
        return null;
      }

      // Build GenieBuild section objects (canonical order — builder can reorder later)
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
      const orderedSections = sortSectionObjectsByCanonicalOrder(
        pageKey,
        sections.filter((section) => section && section.id),
        (s) => s.id
      );
      const genieBuildSections = orderedSections
        .filter(
          (section) =>
            !SITE_WIDE_HEADER_FOOTER_SECTION_IDS.has(String(section.id).toLowerCase())
        )
        .map((section, idx) =>
          buildGenieBuildSection(section.id, section.name, idx)
        );

      // Build componentIds from GenieBuild sections (single source of truth)
      // componentId will be populated after syncing to websitecomponents table
      const componentIds = genieBuildSections.map((section: any) => {
        const variant_uniqueId = section.styles?.variant || `${section.type}Default`; // variant is the uniqueId
        return {
          variant_uniqueId: variant_uniqueId, // The variant filename (e.g., "NavbarSimple", "HeroCenter")
          componentId: null, // Will be populated after syncGenieBuildSectionsToComponents
          sectionData: section, // Full section data (type, content, styles) - single source of truth
        };
      });

      return {
        pageId: dbPageId,
        style: {
          renderer: "geniebuild"
          // No sections array - all data is in componentIds[].sectionData
        },
        componentIds: componentIds // Single source of truth with variant_uniqueId, componentId, and sectionData
      };
    }).filter((page) => page !== null);

    // Step 3: Sync GenieBuild sections to websitecomponents table
    await syncGenieBuildSectionsToComponents(pagesData, token);

    // Step 4: Save to database
    const colorSchemeForSave = buildColorSchemeFromThemeState(themeStateRef.current, PRESET_THEMES);
    const designDataResponse = await http.post(
      "/saveWebsiteDesignData",
      {
        projectId: currentProjectId,
        skipAutoEnqueue: true,
        colorScheme: colorSchemeForSave.name,
        colorPrimary: colorSchemeForSave.primary,
        colorSecondary: colorSchemeForSave.secondary,
        colorAccent: colorSchemeForSave.accent,
        pageStyles: {
          style: {},
          perLocationContentByPage: perLocationByPage,
        },
        pages: pagesData,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("[saveDesignStructure] GenieBuild sections saved successfully");

    return { pageIdsMap, componentNames: [] };
  };

  // Single source of truth:
  // Sync WebsiteComponent registry from GenieBuild filesystem using refreshComponentsFromRegistry.
  // websitecomponents is a GLOBAL registry - NO pageId, only sections and variants
  const syncGenieBuildSectionsToComponents = async (pagesData: any[], token: string) => {
    void pagesData; // registry sync is filesystem-driven, not payload-driven
    try {
      const syncResponse = await http.post(
        "/refreshComponentsFromRegistry",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("[syncGenieBuildSectionsToComponents] Synced registry via refreshComponentsFromRegistry:", syncResponse.data);
      return syncResponse.data;
    } catch (syncError: any) {
      console.warn("[syncGenieBuildSectionsToComponents] Registry refresh failed (non-critical):", syncError);
      return null;
    }
  };

  // Map section IDs to component names (for database lookup)
  const mapSectionIdToComponentName = (sectionId: string): string => {
    // Map section IDs to simple component names (e.g., "hero", "services")
    // These will be used to generate uniqueId as {name}_{variant} (e.g., "hero_a", "services_a")
    const mapping: Record<string, string> = {
      'hero': 'hero',
      'features': 'features',
      'testimonials': 'testimonial',
      'testimonial': 'testimonial',
      'faq': 'faq',
      'process': 'process',
      'services': 'services',
      'servicesgrid': 'services',
      'cta': 'cta',
      'whychooseus': 'whychooseus',
      'guarantee': 'guarantee',
      'areas': 'areas',
      'stats': 'stats',
      // About
      'abouthero': 'abouthero',
      'missionvision': 'missionvision',
      'corevalues': 'corevalues',
      'usp': 'usp',
      'aboutwhychoose': 'aboutwhychoose',
      'aboutcta': 'aboutcta',
      'aboutfaq': 'aboutfaq',
      // Services list
      'serviceslisthero': 'serviceslisthero',
      'serviceslistgrid': 'serviceslistgrid',
      'serviceslistwhychoose': 'serviceslistwhychoose',
      'serviceslistcta': 'serviceslistcta',
      'serviceslistguarantee': 'serviceslistguarantee',
      'serviceslistprocess': 'serviceslistprocess',
      'serviceslistareas': 'serviceslistareas',
      'serviceslistfaq': 'serviceslistfaq',
      // Contact
      'contacthero': 'contacthero',
      'contactinfo': 'contactinfo',
      'contactform': 'contactform',
      'contactcta': 'contactcta',
      'contactfaq': 'contactfaq',
      // Service detail (GenieBuild)
      'servicedetailhero': 'servicedetailhero',
      'servicedetailabout': 'servicedetailabout',
      'servicedetailservices': 'servicedetailservices',
      'servicedetailprocess': 'servicedetailprocess',
      'servicedetailcta': 'servicedetailcta',
      'servicedetailwhychoose': 'servicedetailwhychoose',
      'servicedetailguarantee': 'servicedetailguarantee',
      'servicedetailtestimonials': 'servicedetailtestimonials',
      'servicedetailfaq': 'servicedetailfaq',
      'relatedservices': 'relatedservices',
      // Blog
      'blogshero': 'blogshero',
      'blogssearch': 'blogssearch',
      'blogslist': 'blogslist',
      'blogarticlehero': 'blogarticlehero',
      'blogcontent': 'blogcontent',
      'blogauthor': 'blogauthor',
      'blogrelated': 'blogrelated',
      'blogcomments': 'blogcomments',
      // Legal
      'legalhero': 'legalhero',
      'legalcontent': 'legalcontent',
      // All Areas listing page (dedicated allareas/* sections)
      'areashero': 'areashero',
      'areastestimonials': 'areastestimonials',
      'areasfaq': 'areasfaq',
      'locationmap': 'locationmap',
      'sublocations': 'sublocations',
      // Legacy Multicolor fallbacks
      'servicehero': 'servicehero',
      'aboutservice': 'aboutservice',
      'serviceshero': 'serviceshero',
      'servicecopy': 'servicecopy',
      'servicegroups': 'servicegroups',
      'serviceprocess': 'serviceprocess',
      'servicewhychooseus': 'servicewhychooseus',
      'serviceguarantee': 'serviceguarantee',
      'promiseline': 'promiseline',
      'subservices': 'subservices',
      'descriptions': 'descriptions',
      'contactpage': 'contacthero',
    };

    const componentName = mapping[sectionId.toLowerCase()] || sectionId.toLowerCase();
    return componentName.replace(/-/g, '_');
  };

  // ============================================
  // GenieBuild Section Integration
  // ============================================
  // Maps admin panel section IDs to GenieBuild section types + default variants
  // NOTE: Backend now auto-scans filesystem, but we keep this for admin panel defaults
  // uniqueId = variant = filename (all same)
  const GENIEBUILD_SECTION_MAP: Record<string, { type: string; variant: string }> = {
    // Core homepage
    'navbar': { type: 'navbar', variant: 'NavbarSimple' },
    'hero': { type: 'hero', variant: 'HeroPlumbing1' },
    'about': { type: 'about', variant: 'AboutPlumbing' },
    'features': { type: 'features', variant: 'FeaturesGrid' },
    'servicesgrid': { type: 'services', variant: 'ServicesGrid' },
    'cta': { type: 'cta', variant: 'CTACenter' },
    'whychooseus': { type: 'why-choose-us', variant: 'WhyChooseUsGrid' },
    'process': { type: 'process', variant: 'ProcessSteps' },
    'guarantee': { type: 'guarantee', variant: 'GuaranteeSimple' },
    'testimonials': { type: 'testimonials', variant: 'TestimonialsGrid' },
    'areas': { type: 'areas', variant: 'AreasGrid' },
    'faq': { type: 'faq', variant: 'FAQCentered' },
    'footer': { type: 'footer', variant: 'FooterColumns' },

    // About page
    'abouthero': { type: 'abouthero', variant: 'AboutHeroDefault' },
    'missionvision': { type: 'missionvision', variant: 'MissionVisionDefault' },
    'corevalues': { type: 'corevalues', variant: 'CoreValuesDefault' },
    'usp': { type: 'usp', variant: 'USPDefault' },
    'aboutwhychoose': { type: 'aboutwhychoose', variant: 'AboutWhyChooseDefault' },
    'aboutcta': { type: 'aboutcta', variant: 'AboutCtaDefault' },
    'aboutfaq': { type: 'aboutfaq', variant: 'AboutFaqDefault' },

    // Services listing
    'serviceslisthero': { type: 'serviceslisthero', variant: 'ServicesListHeroDefault' },
    'serviceslistgrid': { type: 'serviceslistgrid', variant: 'ServicesListGridDefault' },
    'serviceslistwhychoose': { type: 'serviceslistwhychoose', variant: 'ServicesListWhyChooseDefault' },
    'serviceslistcta': { type: 'serviceslistcta', variant: 'ServicesListCtaDefault' },
    'serviceslistguarantee': { type: 'serviceslistguarantee', variant: 'ServicesListGuaranteeDefault' },
    'serviceslistprocess': { type: 'serviceslistprocess', variant: 'ServicesListProcessDefault' },
    'serviceslistareas': { type: 'serviceslistareas', variant: 'ServicesListAreasDefault' },
    'serviceslistfaq': { type: 'serviceslistfaq', variant: 'ServicesListFaqDefault' },

    // Contact
    'contacthero': { type: 'contacthero', variant: 'ContactHeroDefault' },
    'contactinfo': { type: 'contactinfo', variant: 'ContactInfoDefault' },
    'contactform': { type: 'contactform', variant: 'ContactFormDefault' },
    'contactcta': { type: 'contactcta', variant: 'ContactCtaDefault' },
    'contactfaq': { type: 'contactfaq', variant: 'ContactFaqDefault' },
    'contactpage': { type: 'contacthero', variant: 'ContactHeroDefault' },

    // Service detail (GenieBuild)
    'servicedetailhero': { type: 'servicedetailhero', variant: 'ServiceDetailHeroDefault' },
    'servicedetailabout': { type: 'servicedetailabout', variant: 'ServiceDetailAboutDefault' },
    'servicedetailservices': { type: 'servicedetailservices', variant: 'ServiceDetailServicesDefault' },
    'servicedetailprocess': { type: 'servicedetailprocess', variant: 'ServiceDetailProcessDefault' },
    'servicedetailcta': { type: 'servicedetailcta', variant: 'ServiceDetailCtaDefault' },
    'servicedetailwhychoose': { type: 'servicedetailwhychoose', variant: 'ServiceDetailWhyChooseDefault' },
    'servicedetailguarantee': { type: 'servicedetailguarantee', variant: 'ServiceDetailGuaranteeDefault' },
    'servicedetailtestimonials': { type: 'servicedetailtestimonials', variant: 'ServiceDetailTestimonialsDefault' },
    'servicedetailfaq': { type: 'servicedetailfaq', variant: 'ServiceDetailFaqDefault' },
    'relatedservices': { type: 'relatedservices', variant: 'RelatedServicesDefault' },
    'promise': { type: 'promise', variant: 'PromiseDefault' },

    // Blog
    'blogshero': { type: 'blogshero', variant: 'BlogsHeroDefault' },
    'blogssearch': { type: 'blogssearch', variant: 'BlogsSearchDefault' },
    'blogslist': { type: 'blogslist', variant: 'BlogsListDefault' },
    'blogarticlehero': { type: 'blogarticlehero', variant: 'BlogArticleHeroDefault' },
    'blogcontent': { type: 'blogcontent', variant: 'BlogContentDefault' },
    'blogauthor': { type: 'blogauthor', variant: 'BlogAuthorDefault' },
    'blogrelated': { type: 'blogrelated', variant: 'BlogRelatedDefault' },
    'blogcomments': { type: 'blogcomments', variant: 'BlogCommentsDefault' },

    // Legal
    'legalhero': { type: 'legalhero', variant: 'LegalHeroDefault' },
    'legalcontent': { type: 'legalcontent', variant: 'LegalContentDefault' },

    // All Areas listing (`geniebuild/.../allareas`)
    'areashero': { type: 'areashero', variant: 'AreasHeroDefault' },
    'areastestimonials': { type: 'areastestimonials', variant: 'AreasTestimonialsDefault' },
    'areasfaq': { type: 'areasfaq', variant: 'AreasFaqDefault' },
    'locationmap': { type: 'locationmap', variant: 'LocationMapDefault' },
    'sublocations': { type: 'sublocations', variant: 'SubLocationsDefault' },

    // Legacy Multicolor fallbacks (old projects)
    'servicehero': { type: 'servicedetailhero', variant: 'ServiceDetailHeroDefault' },
    'aboutservice': { type: 'servicedetailabout', variant: 'ServiceDetailAboutDefault' },
    'serviceshero': { type: 'serviceslisthero', variant: 'ServicesListHeroDefault' },
    'serviceprocess': { type: 'servicedetailprocess', variant: 'ServiceDetailProcessDefault' },
    'servicewhychooseus': { type: 'servicedetailwhychoose', variant: 'ServiceDetailWhyChooseDefault' },
    'serviceguarantee': { type: 'servicedetailguarantee', variant: 'ServiceDetailGuaranteeDefault' },
    'subservices': { type: 'servicedetailservices', variant: 'ServiceDetailServicesDefault' },
    'promiseline': { type: 'promise', variant: 'PromiseDefault' },
    'servicecopy': { type: 'servicedetailabout', variant: 'ServiceDetailAboutDefault' },
    'servicegroups': { type: 'servicedetailservices', variant: 'ServiceDetailServicesDefault' },

    'pricing': { type: 'pricing', variant: 'PricingCards' },
    'image-banner': { type: 'image-banner', variant: 'BannerCenter' },
    'elements': { type: 'elements', variant: 'ElementsSection' },
  };

  // Available variants per GenieBuild section type (for regeneration)
  // NOTE: Backend auto-scans filesystem, but we keep this as fallback for admin panel UI
  // To add new variant: Just create the file, backend will auto-detect it!
  // uniqueId = variant = filename (all same)
  const [genieBuildVariants] = useState<Record<string, string[]>>({
    'navbar': ['NavbarSimple', 'NavbarCentered', 'NavbarMinimal', 'NavbarApi'],
    'hero': [
      'HeroPlumbing1',
      'HeroCenter',
      'HeroGeometric',
      'HeroLight',
      'HeroCrimsonJet',
      'HeroModern',
      'HeroExplore',
      'HeroOverlay',
      'HeroMarquee',
    ],
    'features': ['FeaturesGrid', 'FeaturesList', 'FeaturesCards'],
    'cta': ['CTACenter', 'CTASplit', 'CTALight', 'CTAModern', 'CTAMulticolor'],
    'testimonials': [
      'TestimonialsGrid',
      'TestimonialsCentered',
      'TestimonialsColumns',
      'TestimonialsLight',
      'TestimonialsModern',
      'TestimonialsMulticolor',
    ],
    'faq': ['FAQCentered', 'FAQSplit', 'FAQLight', 'FAQModern', 'FAQMulticolor'],
    'footer': ['FooterColumns', 'FooterCentered', 'FooterMinimal', 'FooterApi'],
    'services': ['ServicesGrid'],
    'why-choose-us': ['WhyChooseUsGrid'],
    'process': ['ProcessSteps'],
    'guarantee': ['GuaranteeSimple'],
    'about': ['AboutPlumbing', 'About1'],
    'areas': ['AreasGrid'],

    'abouthero': ['AboutHeroDefault'],
    'missionvision': ['MissionVisionDefault'],
    'corevalues': ['CoreValuesDefault'],
    'usp': ['USPDefault'],
    'aboutwhychoose': ['AboutWhyChooseDefault'],
    'aboutcta': ['AboutCtaDefault'],
    'aboutfaq': ['AboutFaqDefault'],

    'serviceslisthero': ['ServicesListHeroDefault'],
    'serviceslistgrid': ['ServicesListGridDefault'],
    'serviceslistwhychoose': ['ServicesListWhyChooseDefault'],
    'serviceslistcta': ['ServicesListCtaDefault'],
    'serviceslistguarantee': ['ServicesListGuaranteeDefault'],
    'serviceslistprocess': ['ServicesListProcessDefault'],
    'serviceslistareas': ['ServicesListAreasDefault'],
    'serviceslistfaq': ['ServicesListFaqDefault'],

    'contacthero': ['ContactHeroDefault'],
    'contactinfo': ['ContactInfoDefault'],
    'contactform': ['ContactFormDefault'],
    'contactcta': ['ContactCtaDefault'],
    'contactfaq': ['ContactFaqDefault'],

    'servicedetailhero': ['ServiceDetailHeroDefault'],
    'servicedetailabout': ['ServiceDetailAboutDefault'],
    'servicedetailservices': ['ServiceDetailServicesDefault'],
    'servicedetailprocess': ['ServiceDetailProcessDefault'],
    'servicedetailcta': ['ServiceDetailCtaDefault'],
    'servicedetailwhychoose': ['ServiceDetailWhyChooseDefault'],
    'servicedetailguarantee': ['ServiceDetailGuaranteeDefault'],
    'servicedetailtestimonials': ['ServiceDetailTestimonialsDefault'],
    'servicedetailfaq': ['ServiceDetailFaqDefault'],
    'relatedservices': ['RelatedServicesDefault'],
    'promise': ['PromiseDefault'],

    'blogshero': ['BlogsHeroDefault'],
    'blogssearch': ['BlogsSearchDefault'],
    'blogslist': ['BlogsListDefault'],
    'blogarticlehero': ['BlogArticleHeroDefault'],
    'blogcontent': ['BlogContentDefault'],
    'blogauthor': ['BlogAuthorDefault'],
    'blogrelated': ['BlogRelatedDefault'],
    'blogcomments': ['BlogCommentsDefault'],

    'legalhero': ['LegalHeroDefault'],
    'legalcontent': ['LegalContentDefault'],

    'areashero': ['AreasHeroDefault'],
    'areastestimonials': ['AreasTestimonialsDefault'],
    'areasfaq': ['AreasFaqDefault'],
    'locationmap': ['LocationMapDefault'],
    'sublocations': ['SubLocationsDefault'],
  });

  const GENIEBUILD_VARIANTS = genieBuildVariants;

  // Builds a complete GenieBuild section object with themed styles
  // uniqueId = variant = filename (all same)
  const buildGenieBuildSection = (sectionId: string, sectionName: string, index: number) => {
    const normalizedSectionId = sectionId.toLowerCase();
    const mapping = GENIEBUILD_SECTION_MAP[normalizedSectionId] || {
      type: normalizedSectionId,
      variant: 'Default',
    };
    const theme = PRESET_THEMES.find(t => t.id === themeStateRef.current.selectedTheme) || PRESET_THEMES[0];
    // Content is generated on backend from prompts; keep frontend content minimal.
    const content: any = {};

    // Base styles common to all sections
    // variant = filename (e.g., 'HeroCenter', 'NavbarApi')
    const baseStyles: any = {
      variant: mapping.variant, // This is now the filename (e.g., 'HeroCenter')
      backgroundColor: theme.surface,
      textColor: '#D1D5DB',
      titleColor: theme.heading,
      buttonBackgroundColor: theme.primary,
      buttonTextColor: '#FFFFFF',
    };

    // Section-specific style overrides
    if (mapping.type === 'navbar') {
      return {
        id: `sec-${sectionId}-${index}`,
        type: mapping.type,
        content,
        styles: {
          ...baseStyles,
          textColor: '#FFFFFF',
          buttonStyle: 'pill',
          paddingTop: 'py-4 md:py-6',
          paddingBottom: 'py-4 md:py-6',
          paddingX: 'px-6',
        },
      };
    } else if (mapping.type === 'footer') {
      return {
        id: `sec-${sectionId}-${index}`,
        type: mapping.type,
        content,
        styles: {
          ...baseStyles,
          textColor: '#D1D5DB',
          brandColor: '#FFFFFF',
          descriptionColor: '#D1D5DB',
          linkTitleColor: '#FFFFFF',
          linkColor: '#D1D5DB',
          newsletterTextColor: '#FFFFFF',
          newsletterButtonBackgroundColor: theme.primary,
          newsletterButtonTextColor: '#FFFFFF',
          paddingTop: 'pt-8 md:pt-16',
          paddingBottom: 'pb-8 md:pb-16',
          paddingX: 'px-6',
        },
      };
    } else if (mapping.type === 'hero') {
      // Hero section needs backgroundImage and overlay for proper styling
      return {
        id: `sec-${sectionId}-${index}`,
        type: mapping.type,
        content,
        styles: {
          ...baseStyles,
          subtitleColor: '#D1D5DB',
          descriptionColor: '#D1D5DB',
          buttonStyle: 'filled',
          maxWidth: 'max-w-7xl',
          paddingTop: 'py-24',
          paddingBottom: 'py-24',
          // Hero-specific: backgroundImage and overlay for black overlay effect
          backgroundImage: content.imageUrl || '', // Use imageUrl as backgroundImage
          overlayColor: '#000000', // Black overlay
          overlayOpacityValue: '0.6', // 60% opacity for overlay
        },
      };
    } else {
      // Default styles for features, testimonials, cta, faq
      return {
        id: `sec-${sectionId}-${index}`,
        type: mapping.type,
        content,
        styles: {
          ...baseStyles,
          subtitleColor: '#D1D5DB',
          descriptionColor: '#D1D5DB',
          buttonStyle: 'filled',
          maxWidth: 'max-w-7xl',
          paddingTop: 'py-24',
          paddingBottom: 'py-24',
        },
      };
    }
  };

  // Generate Theme: Pick random variants for components
  const generateTheme = async (componentNames: string[]) => {
    console.log("========================================");
    console.log("[generateTheme] Generating theme with random variants...");
    console.log("========================================");

    if (!projectId) {
      throw new Error("Project ID is missing");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Map section IDs to component names
    const mappedComponentNames = componentNames.map(mapSectionIdToComponentName);
    console.log("[generateTheme] Original names:", componentNames);
    console.log("[generateTheme] Mapped names:", mappedComponentNames);

    // Call generateTheme API
    const response = await http.post(
      "/generateTheme",
      {
        projectId,
        componentNames: mappedComponentNames,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data?.data && response.data.data.length > 0) {
      console.log("[generateTheme] Theme generated:", response.data.data);
      // Map back to original component names for consistency
      const themeDataWithOriginalNames = response.data.data.map((item: any) => ({
        ...item,
        originalComponentName: componentNames.find((name, idx) =>
          mapSectionIdToComponentName(name) === item.componentName
        ) || item.componentName
      }));
      return themeDataWithOriginalNames; // Array of { componentName, componentId, variant, uniqueId, originalComponentName }
    }

    throw new Error("Failed to generate theme - no components found");
  };

  // Phase 2: Save Complete Design Data (with variants, styles, elementIds)
  const saveDesignData = async (themeData?: any[]) => {
    console.log("========================================");
    console.log("[saveDesignData] PHASE 2: Saving complete design with variants...");
    console.log("========================================");

    // Try to get projectId from state, localStorage, or URL
    let currentProjectId = projectId;
    if (!currentProjectId) {
      const savedProjectId = localStorage.getItem(`${storagePrefix}_projectId`);
      if (savedProjectId) {
        currentProjectId = savedProjectId;
        setProjectId(savedProjectId);
      }
    }

    if (!currentProjectId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get('projectId');
      if (urlProjectId) {
        currentProjectId = urlProjectId;
        setProjectId(urlProjectId);
        localStorage.setItem(`${storagePrefix}_projectId`, urlProjectId);
      }
    }

    if (!currentProjectId) {
      throw new Error("Project ID is missing");
    }

    if (!themeData || themeData.length === 0) {
      throw new Error("Theme data is required for Phase 2");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Create a map of componentName -> theme data (componentId, variant, uniqueId)
      // Use originalComponentName if available (section ID), otherwise use componentName
      const themeMap: Record<string, any> = {};
      themeData.forEach((item) => {
        const key = (item.originalComponentName || item.componentName).toLowerCase();
        themeMap[key] = item;
      });
      console.log("[saveDesignData] Theme map:", themeMap);

      // Get existing design data to get pageIds
      const existingDesignResponse = await http.get(
        `/getWebsiteDesignData/${currentProjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const existingDesign = existingDesignResponse.data?.data;
      if (!existingDesign || !existingDesign.pages) {
        throw new Error("Existing design data not found. Please run Phase 1 first.");
      }

      // Build pages array with selected variants
      // Use existing componentIds from Phase 1, just update the variant
      const pagesData = existingDesign.pages.map((page: any) => {
        const componentIds = (page.componentIds || []).map((compData: any) => {
          // Get the componentId from existing data
          const existingComponentId = compData.componentId?._id || compData.componentId;

          // Try to find theme data by matching componentId
          // First, try to find by componentId
          let themeItem = themeData.find((item: any) =>
            item.componentId === existingComponentId ||
            item.componentId?._id === existingComponentId ||
            item.componentId?.toString() === existingComponentId?.toString()
          );

          // If not found by componentId, try to find by section name (for backward compatibility)
          if (!themeItem && page.componentNames) {
            const sectionName = page.componentNames.find((name: string, idx: number) => {
              const comp = page.componentIds?.[idx];
              return (comp?.componentId?._id || comp?.componentId) === existingComponentId;
            });
            if (sectionName) {
              themeItem = themeMap[sectionName.toLowerCase()];
            }
          }

          if (themeItem) {
            // Use uniqueId from themeItem (e.g., "hero_a", "cta_b")
            const uniqueId = themeItem.uniqueId || `${themeItem.componentName}_${themeItem.variant.toLowerCase()}`;
            return {
              uniqueId: uniqueId, // Save uniqueId (string) - primary field
              componentId: themeItem.componentId, // Keep for backward compatibility (deprecated)
              variant: themeItem.variant,
              style: compData.style || {}, // Keep existing styles
              elementIds: compData.elementIds || [], // Keep existing elements
            };
          } else {
            // If no theme data found, try to use existing uniqueId or generate from componentId
            const existingUniqueId = compData.uniqueId;
            if (!existingUniqueId) {
              console.warn(`[saveDesignData] No theme data and no uniqueId for componentId: ${existingComponentId}`);
            }
            return {
              uniqueId: existingUniqueId || compData.uniqueId || `unknown_${existingComponentId}`, // Try to preserve uniqueId
              componentId: existingComponentId, // Keep for backward compatibility
              variant: compData.variant || "A",
              style: compData.style || {},
              elementIds: compData.elementIds || [],
            };
          }
        }).filter((comp: any) => comp !== null);

        return {
          pageId: page.pageId,
          style: page.style || {}, // Main style of this whole page
          componentIds: componentIds,
        };
      });

      // Save complete design data (NO theme colors here - they're saved in ThemeSetting table)
      const designDataResponse = await http.post(
        "/saveWebsiteDesignData",
        {
          projectId: currentProjectId,
          // Removed colorScheme, colorPrimary, colorSecondary, colorAccent - these are now in ThemeSetting table
          pageStyles: {
            style: existingDesign.pageStyles?.style || {}
          },
          pages: pagesData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("[saveDesignData] Complete design saved successfully");

      if (designDataResponse.data?.message) {
        toast({
          title: "Success",
          description: "Complete design data saved successfully!",
        });
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err: any) {
      console.error("Error saving complete design data:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message || "Failed to save complete design data",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Save Theme Settings to ThemeSetting model
  const saveThemeSettings = async (currentProjectId: string) => {
    const snap = themeStateRef.current;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("[saveThemeSettings] No token found, skipping theme save");
        return;
      }

      const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");
      const userId = String(admin._id || localStorage.getItem("userId") || "");
      const payload = buildThemeApiPayload({
        projectId: currentProjectId,
        userId,
        selectedTheme: snap.selectedTheme,
        showCustomColors: snap.showCustomColors,
        customColors: snap.customColors,
        selectedFont: snap.selectedFont,
      });

      console.log("[saveThemeSettings] Saving theme:", payload.theme, "presetId:", payload.presetId);

      const response = await http.post("/updateProjectTheme", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("[saveThemeSettings] Theme settings saved:", response.data);
    } catch (error: any) {
      console.error("[saveThemeSettings] Error saving theme:", error);
      throw new Error(
        error?.response?.data?.message || error?.message || "Failed to save theme settings"
      );
    }
  };

  // Validate Step 6 — pages required; sections are optional per page
  const validateStep6 = () => {
    if (selectedPages.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one page",
        variant: "destructive",
      });
      return false;
    }

    if (getUpsertablePages().length === 0) {
      toast({
        title: "Validation Error",
        description:
          "Select at least one website page.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Handle submit - saves design data and creates design
  const handleSubmit = async () => {
    console.log("[handleSubmit] Function called!");

    if (!validateStep6()) {
      console.log("[handleSubmit] Validation failed");
      return;
    }

   
    await handleCreateDesign();
  };

  return (
    <div className="space-y-6 font-poppins max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isBulk ? "Create Bulk Pages Website" : "Create Business Website"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isBulk
            ? "Build location-based bulk pages with the same design and content flow as business websites"
            : "Build a professional business website in simple steps"}
        </p>
      </div>

      <WizardProgressHeader step={step} variant={variant} />


      {/* Step 1: Basic Info with Categories (similar to CreateProject) */}
      {step === 1 && (
        <Step1BasicInfo
          businessName={businessName}
          setBusinessName={setBusinessName}
          sectionImageOrigin={sectionImageOrigin}
          setSectionImageOrigin={setSectionImageOrigin}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          selectedSubCategories={selectedSubCategories}
          setSelectedSubCategories={setSelectedSubCategories}
          manualSubCategories={manualSubCategories}
          setManualSubCategories={setManualSubCategories}
          subCategories={subCategories}
          manualMicroCategories={manualMicroCategories}
          setManualMicroCategories={setManualMicroCategories}
          focusKeyword={focusKeyword}
          setFocusKeyword={setFocusKeyword}
          generatingFK={generatingFK}
          generateFocusKeyword={generateFocusKeyword}
          projectKeywordsText={projectKeywordsText}
          setProjectKeywordsText={setProjectKeywordsText}
          generatingPK={generatingPK}
          handleGenerateProjectKeywords={handleGenerateProjectKeywords}
          serviceType={serviceType}
        />
      )}

      <ServiceDialogs
        showAICountDialog={showAICountDialog}
        setShowAICountDialog={setShowAICountDialog}
        aiServiceCount={aiServiceCount}
        setAIServiceCount={setAIServiceCount}
        handleConfirmAIGeneration={handleConfirmAIGeneration}
        showManualDialog={showManualDialog}
        setShowManualDialog={setShowManualDialog}
        manualServiceText={manualServiceText}
        setManualServiceText={setManualServiceText}
        handleFileUpload={handleFileUpload}
        uploadedFile={uploadedFile}
        setUploadedFile={setUploadedFile}
        handleSaveManualServices={handleSaveManualServices}
      />

      {isBulk && step >= 2 && step <= 5 && (
        <BulkGeoLocationPanel
          ref={geoPanelRef}
          step={step as 2 | 3 | 4 | 5}
          projectId={projectId}
        />
      )}

      {/* Step 2: Locations (business only) */}
      {!isBulk && step === 2 && (
        <Step2Locations
          currentLocationInput={currentLocationInput}
          setCurrentLocationInput={setCurrentLocationInput}
          handleAddLocation={handleAddLocation}
          locations={locations}
          setLocations={setLocations}
          handleToggleCreatePage={handleToggleCreatePage}
          handleRemoveLocation={handleRemoveLocation}
        />
      )}

      {/* Step 3: Local Areas (business only) */}
      {!isBulk && step === 3 && (
        <Step3LocalAreas
          locationsWithAreas={locationsWithAreas}
          setLocationsWithAreas={setLocationsWithAreas}
          handleToggleLocalAreaPage={handleToggleLocalAreaPage}
        />
      )}

      <LocalAreaGenerateDialog
        open={showLocalAreaGenerateDialog}
        onOpenChange={setShowLocalAreaGenerateDialog}
        localAreaGenerateCount={localAreaGenerateCount}
        setLocalAreaGenerateCount={setLocalAreaGenerateCount}
        handleConfirmGenerateLocalAreas={handleConfirmGenerateLocalAreas}
      />

      {/* Services */}
      {step === servicesStep && (
        <Step4Services
          serviceOption={serviceOption}
          generatingServices={generatingServices}
          businessName={businessName}
          serviceType={serviceType || selectedCategory?.name || ""}
          projectId={projectId}
          handleGenerateAIServices={handleGenerateAIServices}
          handleManualServiceEntry={handleManualServiceEntry}
          setServiceOption={setServiceOption}
          setServiceNames={setServiceNames}
          serviceNames={serviceNames}
          existingServiceNames={existingServiceNames}
        />
      )}

      {/* Contact */}
      {step === contactStep && (
        <Step5ContactInfo
          emails={emails}
          phones={phones}
          addContactField={addContactField}
          updateContactValue={updateContactValue}
          setPrimaryContact={setPrimaryContact}
          removeContactField={removeContactField}
          socialPlatforms={SOCIAL_PRESET_PLATFORMS}
          presetSocialUrls={presetSocialUrls}
          setPresetSocialUrls={setPresetSocialUrls}
          customSocialLinks={customSocialLinks}
          setCustomSocialLinks={setCustomSocialLinks}
          businessHours={businessHours}
          setBusinessHours={setBusinessHours}
        />
      )}

      <DesignGenerationDialog open={showDesignDialog} designReady={designReady} />

      {/* Design — pages and sections */}
      {step === designStep && (
        <Step6PagesSections
          showCustomColors={showCustomColors}
          selectedColorScheme={selectedColorScheme}
          selectedTheme={selectedTheme}
          setSelectedTheme={handleSelectTheme}
          presetThemes={PRESET_THEMES}
          setShowCustomColors={handleSetShowCustomColors}
          customColors={customColors}
          setCustomColors={handleSetCustomColors}
          selectedFont={selectedFont}
          setSelectedFont={handleSetSelectedFont}
          selectedPages={selectedPages}
          defaultPages={DEFAULT_PAGES}
          setSelectedPages={setSelectedPages}
          pageSections={pageSections}
          setPageSections={setPageSections}
          handleTogglePage={handleTogglePage}
          mapSectionIdToComponentName={mapSectionIdToComponentName}
          perLocationByPage={perLocationByPage}
          setPerLocationByPage={setPerLocationByPage}
        />
      )}

      {/* Preview */}
      {step === previewStep && designPreview && (
        <Step7DesignPreview
          designPreview={designPreview}
          businessName={businessName}
          generatingDesign={generatingDesign}
          handleRegenerateDesign={handleRegenerateDesign}
          projectId={projectId}
          onMissingProjectId={() =>
            toast({
              title: "Error",
              description: "Project ID is missing. Please create a project first.",
              variant: "destructive",
            })
          }
        />
      )}

      <WizardNavigation
        step={step}
        variant={variant}
        loading={loading}
        generatingDesign={generatingDesign}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />

      {/* AI Services Review Dialog */}
      <AIServicesReviewDialog
        open={showAIServicesReview}
        onOpenChange={setShowAIServicesReview}
        services={aiGeneratedServices}
        isLoading={generatingServices}
        onConfirm={(servicesArray) => {
          setShowAIServicesReview(false);
          const servicesText = servicesArray.join("\n");
          setServiceNames(servicesText);
          setServiceOption("ai");
          toast({
            title: "Success",
            description: "Services generated and saved successfully",
          });
        }}
      />
    </div>
  );
}