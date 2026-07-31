import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Languages,
  Layout,
  LayoutGrid,
  Loader2,
  Palette,
  RefreshCw,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { http, httpFile } from "../../config.js";
import {
  buildDefaultPageSections,
  buildDefaultSelectedPages,
  DEFAULT_CONTENT_PAGES,
  type ContentPageOption,
  type ContentSectionOption,
} from "./contentWebsiteSteps/contentWebsiteConfig";

const TOTAL_STEPS = 7;

const QUICK_COUNTRY_NAMES = ["United States", "Canada", "United Kingdom", "Australia"];

type CountryOption = {
  countryId: string | number;
  name: string;
  status: number;
};

type GoalOption = {
  _id: string;
  name: string;
  slug: string;
};

type LanguageOption = {
  _id: string;
  code: string;
  name: string;
};

type CategoryOption = {
  _id: string;
  categoryName: string;
};

type NicheOption = {
  _id: string;
  nicheName: string;
  categoryId: string;
};

type AnalysisLevel = {
  level?: string;
  summary?: string;
};

type NicheAnalysisResult = {
  input?: Record<string, unknown>;
  signals?: {
    ads?: {
      mode?: string;
      dataLabel?: string;
      primary?: {
        volumeLevel?: string;
        volumeRange?: string;
        competition?: string;
        competitionNote?: string;
      };
      related?: Array<{ keyword?: string }>;
    };
    trends?: {
      mode?: string;
      dataLabel?: string;
      summary?: {
        trendDirection?: string;
        seasonality?: string;
        averageInterest?: number;
        rising?: boolean;
      };
    };
    pinterest?: {
      mode?: string;
      dataLabel?: string;
      level?: string;
      score?: number;
      summary?: string;
      pinAngles?: string[];
      note?: string;
    };
    amazon?: {
      mode?: string;
      dataLabel?: string;
      level?: string;
      score?: number;
      summary?: string;
      suggestions?: string[];
      productAngles?: string[];
      note?: string;
    };
    collectedAt?: string;
  };
  analysis?: {
    competition?: AnalysisLevel;
    searches?: AnalysisLevel;
    pinterestPotential?: AnalysisLevel;
    affiliatePotential?: AnalysisLevel;
    adsPotential?: AnalysisLevel;
    digitalProductPotential?: AnalysisLevel;
    difficulty?: AnalysisLevel;
    seasonality?: AnalysisLevel;
    overallScore?: number;
    verdict?: string;
    recommendedNextSteps?: string[];
  };
  labels?: { volume?: string; trends?: string; pinterest?: string; amazon?: string; note?: string };
  score?: {
    overall?: number;
    method?: string;
    signalScore?: number;
    aiScore?: number | null;
    note?: string;
    formula?: string;
    breakdown?: Record<
      string,
      {
        points?: number;
        max?: number;
        [key: string]: unknown;
      }
    >;
  };
  sourcesUsed?: {
    volume?: string;
    trends?: string;
    pinterest?: string;
    amazon?: string;
    scoring?: string;
    scoringDetail?: string;
    adsApiMode?: string;
    trendsApiMode?: string;
    pinterestApiMode?: string;
    amazonApiMode?: string;
  };
};

type WebsiteBlueprint = {
  websiteName?: string;
  tagline?: string;
  logo?: { text?: string; style?: string; iconHint?: string; tagline?: string };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    schemeName?: string;
  };
  fonts?: { heading?: string; body?: string };
  brandVoice?: {
    tone?: string;
    personality?: string[];
    do?: string[];
    dont?: string[];
    sampleBio?: string;
  };
  authors?: Array<{
    name?: string;
    role?: string;
    bio?: string;
    expertise?: string[];
  }>;
  contentCategories?: string[];
  urlStructure?: Record<string, string>;
  navigation?: string[];
  footer?: {
    columns?: Array<{ title?: string; links?: string[] }>;
    copyright?: string;
    disclaimerLine?: string;
  };
  pages?: {
    homepage?: { heroHeading?: string; heroSubheading?: string; sections?: string[] };
    about?: { outline?: string };
    contact?: { outline?: string };
    privacy?: { outline?: string };
    terms?: { outline?: string };
    disclaimer?: { outline?: string };
  };
  selectedPages?: Array<{
    id: string;
    name: string;
    templateOnly?: boolean;
    sections: Array<{ id: string; name: string }>;
  }>;
};

const STEP_META = [
  { title: "Choose Goal", icon: Target, hint: "Wizard 1/7 · What is this project for?" },
  { title: "Country", icon: Globe, hint: "Wizard 2/7 · Primary market" },
  { title: "Language", icon: Languages, hint: "Wizard 3/7 · Site language" },
  { title: "Category", icon: LayoutGrid, hint: "Wizard 4/7 · Content category" },
  { title: "Niche", icon: Sparkles, hint: "Wizard 5/7 · Focus niche" },
  { title: "Niche Analysis", icon: BarChart3, hint: "Wizard 6/7 · Demand & opportunity signals" },
  { title: "Website Blueprint", icon: Palette, hint: "Wizard 7/7 · Pages, brand, Approve → create" },
] as const;

const ANALYSIS_CARDS: Array<{ key: keyof NonNullable<NicheAnalysisResult["analysis"]>; label: string }> = [
  { key: "searches", label: "Search demand" },
  { key: "competition", label: "Competition" },
  { key: "pinterestPotential", label: "Pinterest potential" },
  { key: "affiliatePotential", label: "Affiliate potential" },
  { key: "adsPotential", label: "Ads potential" },
  { key: "digitalProductPotential", label: "Digital products" },
  { key: "difficulty", label: "Difficulty" },
  { key: "seasonality", label: "Seasonality" },
];

function levelBadgeClass(level?: string) {
  const l = String(level || "").toLowerCase();
  if (l.includes("high") || l.includes("strong")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (l.includes("low") || l.includes("avoid")) return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export function ContentWebsiteCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [projectName, setProjectName] = useState("");

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [countrySearch, setCountrySearch] = useState("");

  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [nichesLoading, setNichesLoading] = useState(false);
  const [selectedNicheId, setSelectedNicheId] = useState<string>("");

  const [nicheAnalysis, setNicheAnalysis] = useState<NicheAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [selectedPages, setSelectedPages] = useState<ContentPageOption[]>(() =>
    buildDefaultSelectedPages()
  );
  const [pageSections, setPageSections] = useState<Record<string, ContentSectionOption[]>>(() =>
    buildDefaultPageSections()
  );

  const [blueprint, setBlueprint] = useState<WebsiteBlueprint | null>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(false);
  const [blueprintApproved, setBlueprintApproved] = useState(false);

  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    async function loadGoals() {
      setGoalsLoading(true);
      try {
        const res = await http.post(
          "/pinterest/v2/fetchGoals",
          { status: 1, limit: 100 },
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        setGoals(res.data?.data?.goals || []);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch goals. Add them under Settings.",
          variant: "destructive",
        });
      } finally {
        setGoalsLoading(false);
      }
    }
    loadGoals();
  }, []);

  useEffect(() => {
    async function loadLanguages() {
      setLanguagesLoading(true);
      try {
        const res = await http.post(
          "/pinterest/v2/fetchLanguages",
          { status: 1, limit: 100 },
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        const list = res.data?.data?.languages || [];
        setLanguages(list);
        if (list.length && !selectedLanguage) {
          const en = list.find((l: LanguageOption) => l.code === "EN");
          setSelectedLanguage(en?.code || list[0].code);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch languages. Add them under Settings.",
          variant: "destructive",
        });
      } finally {
        setLanguagesLoading(false);
      }
    }
    loadLanguages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadCountries() {
      setCountriesLoading(true);
      try {
        const res = await httpFile.get("/fetch_countries", {
          headers: { Authorization: `Bearer ${token()}` },
        });
        const list = (res.data?.data || []).map((item: any) => ({
          countryId: item.id,
          name: item.name,
          status: 1,
        }));
        setCountries(list);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch countries.",
          variant: "destructive",
        });
      } finally {
        setCountriesLoading(false);
      }
    }
    loadCountries();
  }, []);

  useEffect(() => {
    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const res = await http.post(
          "/pinterest/v2/fetchCategories",
          { status: 1, limit: 100 },
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        setCategories(res.data?.data?.categories || []);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch categories.",
          variant: "destructive",
        });
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setNiches([]);
      setSelectedNicheId("");
      return;
    }

    async function loadNiches() {
      setNichesLoading(true);
      setSelectedNicheId("");
      try {
        const res = await http.post(
          "/pinterest/v2/fetchNiches",
          { categoryId: selectedCategoryId, status: 1, limit: 100 },
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        setNiches(res.data?.data?.niches || []);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch niches.",
          variant: "destructive",
        });
        setNiches([]);
      } finally {
        setNichesLoading(false);
      }
    }
    loadNiches();
  }, [selectedCategoryId]);

  const quickCountries = useMemo(() => {
    return QUICK_COUNTRY_NAMES.map((name) =>
      countries.find((c) => c.name.toLowerCase() === name.toLowerCase())
    ).filter(Boolean) as CountryOption[];
  }, [countries]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countries.slice(0, 40);
    return countries.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 40);
  }, [countries, countrySearch]);

  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);
  const selectedNiche = niches.find((n) => n._id === selectedNicheId);

  const handleTogglePage = (pageId: string) => {
    const page = DEFAULT_CONTENT_PAGES.find((p) => p.id === pageId);
    if (!page) return;

    const isSelected = selectedPages.some((p) => p.id === pageId);
    if (isSelected) {
      setSelectedPages((prev) => prev.filter((p) => p.id !== pageId));
      setPageSections((prev) => {
        const next = { ...prev };
        delete next[pageId];
        return next;
      });
    } else {
      setSelectedPages((prev) =>
        [...prev, page].sort(
          (a, b) =>
            DEFAULT_CONTENT_PAGES.findIndex((p) => p.id === a.id) -
            DEFAULT_CONTENT_PAGES.findIndex((p) => p.id === b.id)
        )
      );
      setPageSections((prev) => ({
        ...prev,
        [pageId]: page.sections.filter((s) => s.defaultSelected),
      }));
    }
    setBlueprint(null);
    setBlueprintApproved(false);
  };

  const handleToggleSection = (pageId: string, section: ContentSectionOption) => {
    setPageSections((prev) => {
      const current = prev[pageId] || [];
      const exists = current.some((s) => s.id === section.id);
      const nextList = exists
        ? current.filter((s) => s.id !== section.id)
        : [...current, section];
      return { ...prev, [pageId]: nextList };
    });
    setBlueprint(null);
    setBlueprintApproved(false);
  };

  const runNicheAnalysis = async () => {
    if (!selectedGoal || !selectedCountry || !selectedLanguage || !selectedCategoryId || !selectedNicheId) {
      return;
    }
    setAnalysisLoading(true);
    try {
      const res = await http.post(
        "/pinterest/v2/analyzeNiche",
        {
          contentGoal: selectedGoal,
          country: selectedCountry.name,
          language: selectedLanguage,
          categoryId: selectedCategoryId,
          nicheId: selectedNicheId,
        },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const data = res.data?.data || null;
      setNicheAnalysis(data);
      if (data) {
        console.groupCollapsed("[NicheAnalysis] Frontend — response sources");
        console.log("sourcesUsed:", data.sourcesUsed);
        console.log("score engine:", data.score);
        console.log("signals.ads:", {
          mode: data.signals?.ads?.mode,
          dataLabel: data.signals?.ads?.dataLabel,
          primary: data.signals?.ads?.primary,
        });
        console.log("signals.trends:", {
          mode: data.signals?.trends?.mode,
          dataLabel: data.signals?.trends?.dataLabel,
          summary: data.signals?.trends?.summary,
        });
        console.log("signals.pinterest:", data.signals?.pinterest);
        console.log("signals.amazon:", data.signals?.amazon);
        console.log("analysis score:", data.analysis?.overallScore, data.analysis?.verdict);
        console.groupEnd();
      }
      toast({
        title: "Analysis ready",
        description: data?.sourcesUsed
          ? `Pin: ${data.sourcesUsed.pinterest} · Amazon: ${data.sourcesUsed.amazon}`
          : "Review signals, then continue to Blueprint.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to analyze niche",
        variant: "destructive",
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const generateBlueprint = async () => {
    if (!selectedGoal || !selectedCountry || !selectedLanguage || !selectedCategoryId || !selectedNicheId) {
      return;
    }
    if (selectedPages.length === 0) {
      toast({
        title: "Select pages",
        description: "Choose at least one page before generating the blueprint.",
        variant: "destructive",
      });
      return;
    }

    setBlueprintLoading(true);
    setBlueprintApproved(false);
    try {
      const res = await http.post(
        "/pinterest/v2/generateWebsiteBlueprint",
        {
          contentGoal: selectedGoal,
          country: selectedCountry.name,
          language: selectedLanguage,
          categoryId: selectedCategoryId,
          nicheId: selectedNicheId,
          projectName: projectName.trim() || undefined,
          selectedPages: selectedPages.map((p) => ({
            id: p.id,
            name: p.name,
            templateOnly: p.templateOnly,
            sections: (pageSections[p.id] || []).map((s) => ({ id: s.id, name: s.name })),
          })),
          pageSections: Object.fromEntries(
            selectedPages.map((p) => [
              p.id,
              (pageSections[p.id] || []).map((s) => ({ id: s.id, name: s.name })),
            ])
          ),
          nicheAnalysis: nicheAnalysis || undefined,
        },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const bp = res.data?.data?.blueprint || null;
      setBlueprint(bp);
      if (bp?.websiteName && !projectName.trim()) {
        setProjectName(bp.websiteName);
      }
      toast({ title: "Blueprint ready", description: "Review and approve to create the website." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to generate blueprint",
        variant: "destructive",
      });
    } finally {
      setBlueprintLoading(false);
    }
  };

  useEffect(() => {
    setNicheAnalysis(null);
    setBlueprint(null);
    setBlueprintApproved(false);
  }, [selectedCategoryId, selectedNicheId, selectedGoal, selectedLanguage, selectedCountry?.countryId]);

  useEffect(() => {
    if (step === 6 && !nicheAnalysis && !analysisLoading) {
      runNicheAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === 7 && !blueprint && !blueprintLoading && selectedPages.length > 0) {
      generateBlueprint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const canContinue = () => {
    if (step === 1) return !!selectedGoal;
    if (step === 2) return !!selectedCountry;
    if (step === 3) return !!selectedLanguage;
    if (step === 4) return !!selectedCategoryId;
    if (step === 5) return !!selectedNicheId && projectName.trim().length > 0;
    if (step === 6) return !!nicheAnalysis && !analysisLoading;
    if (step === 7)
      return (
        selectedPages.length > 0 &&
        !!blueprint &&
        blueprintApproved &&
        !blueprintLoading
      );
    return false;
  };

  const handleCreate = async () => {
    if (!selectedGoal || !selectedCountry || !selectedLanguage || !selectedCategoryId || !selectedNicheId) {
      return;
    }
    if (!blueprint) {
      toast({
        title: "Blueprint required",
        description: "Generate and approve the website blueprint first.",
        variant: "destructive",
      });
      return;
    }

    const finalName = (projectName.trim() || blueprint.websiteName || "").trim();
    if (!finalName) {
      toast({
        title: "Website name required",
        description: "Set a website name before approving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const selectedPagesPayload = selectedPages.map((p) => ({
        id: p.id,
        name: p.name,
        templateOnly: Boolean(p.templateOnly),
        sections: (pageSections[p.id] || []).map((s) => ({ id: s.id, name: s.name })),
      }));

      const createRes = await http.post(
        "/pinterest/v2/createContentWebsite",
        {
          projectName: finalName,
          contentGoal: selectedGoal,
          language: selectedLanguage,
          categoryId: selectedCategoryId,
          nicheId: selectedNicheId,
          nicheAnalysis: nicheAnalysis || undefined,
          blueprint: {
            ...blueprint,
            websiteName: finalName,
            selectedPages: selectedPagesPayload,
          },
        },
        { headers: { Authorization: `Bearer ${token()}` } }
      );

      const project = createRes.data?.data;
      const projectId = project?._id;
      if (!projectId) {
        throw new Error("Project created but ID missing");
      }

      const isGlobal =
        String(selectedCountry.countryId) === "global" ||
        selectedCountry.name.toLowerCase() === "global";

      await httpFile.post(
        "/updateCountryInProject",
        {
          projectId,
          countries: isGlobal
            ? []
            : [
                {
                  countryId: selectedCountry.countryId,
                  name: selectedCountry.name,
                  status: 1,
                },
              ],
          manualCountries: isGlobal ? [{ name: "Global", status: 1 }] : [],
        },
        {
          headers: {
            Authorization: `Bearer ${token()}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Website created",
        description: `"${finalName}" blueprint approved. Next: Keywords.`,
      });
      navigate("/admin/content-websites/list");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message || "Failed to create content website",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    handleCreate();
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const meta = STEP_META[step - 1];
  const StepIcon = meta.icon;
  const analysis = nicheAnalysis?.analysis;
  const adsPrimary = nicheAnalysis?.signals?.ads?.primary;
  const trendSummary = nicheAnalysis?.signals?.trends?.summary;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Content Website</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Goal → Country → Language → Category → Niche → Analysis → Blueprint (Approve creates the site).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEP_META.map((s, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div
              key={s.title}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                active && "border-blue-600 bg-blue-50 text-blue-700",
                done && "border-emerald-500 bg-emerald-50 text-emerald-700",
                !active && !done && "text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <span className="font-medium">{n}</span>}
              {s.title}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StepIcon className="h-5 w-5 text-blue-600" />
            <CardTitle>{meta.title}</CardTitle>
          </div>
          <CardDescription>{meta.hint}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              {goalsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading goals…
                </div>
              ) : goals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No goals yet. Add them under{" "}
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => navigate("/admin/content-websites/settings")}
                  >
                    Content Websites → Settings
                  </button>
                  .
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {goals.map((goal) => {
                    const active = selectedGoal === goal.name;
                    return (
                      <button
                        key={goal._id}
                        type="button"
                        onClick={() => setSelectedGoal(goal.name)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition hover:border-blue-400 hover:shadow-sm",
                          active && "border-blue-600 ring-2 ring-blue-200 bg-blue-50/50"
                        )}
                      >
                        <div className="font-medium">{goal.name}</div>
                        {active && (
                          <Badge className="mt-3" variant="default">
                            Selected
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {countriesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading countries…
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Quick picks</Label>
                    <div className="flex flex-wrap gap-2">
                      {quickCountries.map((c) => (
                        <Button
                          key={String(c.countryId)}
                          type="button"
                          size="sm"
                          variant={selectedCountry?.countryId === c.countryId ? "default" : "outline"}
                          onClick={() => setSelectedCountry(c)}
                        >
                          {c.name}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCountry?.name === "Global" ? "default" : "outline"}
                        onClick={() =>
                          setSelectedCountry({
                            countryId: "global",
                            name: "Global",
                            status: 1,
                          })
                        }
                      >
                        Global
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countrySearch">Search all countries</Label>
                    <Input
                      id="countrySearch"
                      placeholder="Search country…"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                    />
                    <div className="max-h-56 overflow-y-auto rounded-lg border divide-y">
                      {filteredCountries.map((c) => (
                        <button
                          key={String(c.countryId)}
                          type="button"
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted/60",
                            selectedCountry?.countryId === c.countryId && "bg-blue-50 text-blue-700"
                          )}
                          onClick={() => setSelectedCountry(c)}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedCountry && (
                    <p className="text-sm">
                      Selected: <strong>{selectedCountry.name}</strong>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {languagesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading languages…
                </div>
              ) : languages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No languages yet. Add them under{" "}
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => navigate("/admin/content-websites/settings")}
                  >
                    Content Websites → Settings
                  </button>
                  .
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {languages.map((lang) => {
                    const active = selectedLanguage === lang.code;
                    return (
                      <button
                        key={lang._id}
                        type="button"
                        onClick={() => setSelectedLanguage(lang.code)}
                        className={cn(
                          "rounded-xl border p-4 text-center transition hover:border-blue-400",
                          active && "border-blue-600 ring-2 ring-blue-200 bg-blue-50/50"
                        )}
                      >
                        <div className="text-lg font-semibold">{lang.code}</div>
                        <div className="text-xs text-muted-foreground mt-1">{lang.name}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading categories…
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No categories yet. Add them under{" "}
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => navigate("/admin/content-websites/settings")}
                  >
                    Content Websites → Settings
                  </button>
                  .
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((cat) => {
                    const active = selectedCategoryId === cat._id;
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat._id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition hover:border-blue-400",
                          active && "border-blue-600 ring-2 ring-blue-200 bg-blue-50/50"
                        )}
                      >
                        <div className="font-medium">{cat.categoryName}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project / Website name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Cozy Bedroom Decor Hub"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Niches for {selectedCategory?.categoryName || "category"}
                </Label>
                {nichesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading niches…
                  </div>
                ) : niches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No niches for this category. Add them under{" "}
                    <button
                      type="button"
                      className="text-blue-600 underline"
                      onClick={() => navigate("/admin/content-websites/settings")}
                    >
                      Content Websites → Settings
                    </button>
                    .
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {niches.map((niche) => {
                      const active = selectedNicheId === niche._id;
                      return (
                        <button
                          key={niche._id}
                          type="button"
                          onClick={() => {
                            setSelectedNicheId(niche._id);
                            if (!projectName.trim()) {
                              setProjectName(
                                `${niche.nicheName} ${selectedCategory?.categoryName || ""}`.trim()
                              );
                            }
                          }}
                          className={cn(
                            "rounded-xl border p-4 text-left transition hover:border-blue-400",
                            active && "border-blue-600 ring-2 ring-blue-200 bg-blue-50/50"
                          )}
                        >
                          <div className="font-medium">{niche.nicheName}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {(selectedGoal || selectedCountry || selectedLanguage || selectedCategory || selectedNiche) && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Goal:</span> {selectedGoal}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Country:</span> {selectedCountry?.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Language:</span> {selectedLanguage}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>{" "}
                    {selectedCategory?.categoryName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Niche:</span>{" "}
                    {selectedNiche?.nicheName || "—"}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              {analysisLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing niche demand (Ads / OpenAI + Trends)…
                </div>
              )}

              {!analysisLoading && nicheAnalysis && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        Score {analysis?.overallScore ?? "—"}/100
                      </Badge>
                      <Badge variant="secondary">
                        Ads: {nicheAnalysis.signals?.ads?.mode || "—"} (
                        {nicheAnalysis.labels?.volume || "estimate"})
                      </Badge>
                      <Badge variant="secondary">
                        Trends: {nicheAnalysis.signals?.trends?.mode || "—"}
                      </Badge>
                      {nicheAnalysis.sourcesUsed && (
                        <Badge variant="outline" className="max-w-full whitespace-normal text-left">
                          Using: {nicheAnalysis.sourcesUsed.volume} ·{" "}
                          {nicheAnalysis.sourcesUsed.trends} · {nicheAnalysis.sourcesUsed.pinterest} ·{" "}
                          {nicheAnalysis.sourcesUsed.amazon} · {nicheAnalysis.sourcesUsed.scoring}
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={runNicheAnalysis}
                      disabled={analysisLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Re-analyze
                    </Button>
                  </div>

                  <div className="rounded-xl border p-4 bg-muted/20">
                    <p className="text-sm font-medium mb-1">
                      {selectedNiche?.nicheName} · {selectedCategory?.categoryName}
                    </p>
                    <p className="text-sm text-muted-foreground">{analysis?.verdict || "—"}</p>
                    {(adsPrimary || trendSummary) && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {adsPrimary && (
                          <span>
                            Volume: {adsPrimary.volumeLevel} ({adsPrimary.volumeRange}) · Competition:{" "}
                            {adsPrimary.competition}
                          </span>
                        )}
                        {trendSummary && (
                          <span>
                            Trend: {trendSummary.trendDirection || "—"} · Seasonality:{" "}
                            {trendSummary.seasonality || "—"}
                            {trendSummary.rising ? " · Rising" : ""}
                            {typeof trendSummary.averageInterest === "number"
                              ? ` · Interest ${trendSummary.averageInterest}`
                              : ""}
                          </span>
                        )}
                      </div>
                    )}
                    {nicheAnalysis.score && (
                      <div className="mt-3 rounded-lg border bg-background/80 p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-foreground">
                            Score engine · {nicheAnalysis.score.method || "—"}
                          </span>
                          <span className="text-muted-foreground">
                            Signal {nicheAnalysis.score.signalScore ?? "—"}
                            {nicheAnalysis.score.aiScore != null && nicheAnalysis.score.aiScore !== 0
                              ? ` + AI ${nicheAnalysis.score.aiScore}`
                              : " (AI score ignored if 0)"}
                            {" → "}
                            <strong className="text-foreground">{nicheAnalysis.score.overall}</strong>
                          </span>
                        </div>
                        {nicheAnalysis.score.breakdown && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {Object.entries(nicheAnalysis.score.breakdown).map(([key, row]) => (
                              <div
                                key={key}
                                className="rounded border px-2 py-1.5 text-[11px] bg-muted/40"
                              >
                                <div className="flex justify-between gap-1 font-medium capitalize">
                                  <span>{key.replace(/([A-Z])/g, " $1")}</span>
                                  <span>
                                    {row.points}/{row.max}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {nicheAnalysis.score.note && (
                          <p className="text-[11px] text-muted-foreground">{nicheAnalysis.score.note}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                        <p className="font-medium">
                          Pinterest{" "}
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            {nicheAnalysis.signals?.pinterest?.mode || "—"}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score {nicheAnalysis.signals?.pinterest?.score ?? "—"} ·{" "}
                          {nicheAnalysis.signals?.pinterest?.level || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {nicheAnalysis.signals?.pinterest?.summary ||
                            nicheAnalysis.signals?.pinterest?.note ||
                            "—"}
                        </p>
                        {!!nicheAnalysis.signals?.pinterest?.pinAngles?.length && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {nicheAnalysis.signals.pinterest.pinAngles.map((a) => (
                              <Badge key={a} variant="secondary" className="text-[10px]">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                        <p className="font-medium">
                          Amazon{" "}
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            {nicheAnalysis.signals?.amazon?.mode || "—"}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score {nicheAnalysis.signals?.amazon?.score ?? "—"} ·{" "}
                          {nicheAnalysis.signals?.amazon?.level || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {nicheAnalysis.signals?.amazon?.summary ||
                            nicheAnalysis.signals?.amazon?.note ||
                            "—"}
                        </p>
                        {!!nicheAnalysis.signals?.amazon?.suggestions?.length && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {nicheAnalysis.signals.amazon.suggestions.slice(0, 6).map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px]">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {ANALYSIS_CARDS.map(({ key, label }) => {
                      const card = analysis?.[key] as AnalysisLevel | undefined;
                      if (!card || typeof card !== "object" || !("level" in card || "summary" in card)) {
                        return null;
                      }
                      return (
                        <div key={key} className="rounded-lg border p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{label}</p>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                                levelBadgeClass(card.level)
                              )}
                            >
                              {card.level || "—"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{card.summary || "—"}</p>
                        </div>
                      );
                    })}
                  </div>

                  {!!analysis?.recommendedNextSteps?.length && (
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium mb-2">Recommended next steps</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {analysis.recommendedNextSteps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!!nicheAnalysis.signals?.ads?.related?.length && (
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium mb-2">Related keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {nicheAnalysis.signals.ads.related.map((r, i) => (
                          <Badge key={`${r.keyword}-${i}`} variant="outline">
                            {r.keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {nicheAnalysis.labels?.note && (
                    <p className="text-xs text-muted-foreground">{nicheAnalysis.labels.note}</p>
                  )}
                </>
              )}

              {!analysisLoading && !nicheAnalysis && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">No analysis yet.</p>
                  <Button type="button" onClick={runNicheAnalysis}>
                    Run niche analysis
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              {/* Pages & sections — like business/bulk Step 6, content-site catalog */}
              <div className="space-y-3 border-b pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <Label className="text-sm font-semibold">
                      Select Pages ({selectedPages.length}/{DEFAULT_CONTENT_PAGES.length})
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Content-site pages (Home, Blog, templates, About, legal). Header/footer are shared.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedPages([...DEFAULT_CONTENT_PAGES]);
                        setPageSections(
                          Object.fromEntries(
                            DEFAULT_CONTENT_PAGES.map((p) => [
                              p.id,
                              p.sections.filter((s) => s.defaultSelected),
                            ])
                          )
                        );
                        setBlueprint(null);
                        setBlueprintApproved(false);
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedPages(buildDefaultSelectedPages());
                        setPageSections(buildDefaultPageSections());
                        setBlueprint(null);
                        setBlueprintApproved(false);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-muted/30">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {DEFAULT_CONTENT_PAGES.map((page) => {
                      const isSelected = selectedPages.some((p) => p.id === page.id);
                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => handleTogglePage(page.id)}
                          className={cn(
                            "p-2 rounded border text-left text-xs transition-all",
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-border bg-background hover:border-blue-300"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleTogglePage(page.id)}
                              className="h-3 w-3"
                            />
                            <FileText
                              className={cn(
                                "h-3 w-3 shrink-0",
                                isSelected ? "text-blue-600" : "text-muted-foreground"
                              )}
                            />
                            <div className="min-w-0">
                              <span className="font-medium truncate block">{page.name}</span>
                              {page.templateOnly && (
                                <span className="text-[10px] text-muted-foreground">Template</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedPages.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-semibold">Select sections per page</Label>
                    <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
                      {selectedPages.map((page) => {
                        const catalog =
                          DEFAULT_CONTENT_PAGES.find((p) => p.id === page.id)?.sections ||
                          page.sections;
                        const selected = pageSections[page.id] || [];
                        return (
                          <div key={page.id} className="border rounded-lg p-3 bg-muted/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Layout className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold text-sm">{page.name}</h4>
                              <Badge variant="outline" className="text-[10px]">
                                {selected.length}/{catalog.length}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {catalog.map((section) => {
                                const on = selected.some((s) => s.id === section.id);
                                return (
                                  <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => handleToggleSection(page.id, section)}
                                    className={cn(
                                      "flex items-start gap-2 rounded border p-2 text-left text-xs",
                                      on ? "border-blue-400 bg-blue-50/60" : "border-border bg-background"
                                    )}
                                  >
                                    <Checkbox checked={on} className="mt-0.5 h-3 w-3" />
                                    <span>
                                      <span className="font-medium block">{section.name}</span>
                                      <span className="text-muted-foreground">{section.description}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* AI brand preview + approve */}
              {blueprintLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI is building brand, voice, authors, URLs from your pages…
                </div>
              )}

              {!blueprintLoading && blueprint && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={blueprintApproved ? "default" : "outline"}>
                        {blueprintApproved ? "Approved" : "Pending approval"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Preview → Approve → website create
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBlueprint(null);
                        setBlueprintApproved(false);
                        generateBlueprint();
                      }}
                      disabled={blueprintLoading || saving}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate AI
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bpWebsiteName">Website name</Label>
                    <Input
                      id="bpWebsiteName"
                      value={projectName || blueprint.websiteName || ""}
                      onChange={(e) => {
                        setProjectName(e.target.value);
                        setBlueprintApproved(false);
                      }}
                    />
                    {blueprint.tagline && (
                      <p className="text-sm text-muted-foreground">{blueprint.tagline}</p>
                    )}
                  </div>

                  <div
                    className="rounded-xl border-2 p-5"
                    style={{
                      background: `linear-gradient(135deg, ${blueprint.colors?.primary || "#2563eb"}18 0%, ${blueprint.colors?.secondary || "#64748b"}12 100%)`,
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Logo / wordmark</p>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: blueprint.colors?.primary || "#111" }}
                        >
                          {blueprint.logo?.text || blueprint.websiteName || projectName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Style: {blueprint.logo?.style || "—"} · Icon: {blueprint.logo?.iconHint || "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">
                          {blueprint.colors?.schemeName || "Palette"}
                        </p>
                        <div className="flex gap-1 justify-end">
                          {["primary", "secondary", "accent", "background", "text"].map((key) => {
                            const hex = (blueprint.colors as any)?.[key];
                            if (!hex) return null;
                            return (
                              <div
                                key={key}
                                className="w-7 h-7 rounded border border-black/10"
                                style={{ backgroundColor: hex }}
                                title={`${key}: ${hex}`}
                              />
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Fonts: {blueprint.fonts?.heading || "—"} / {blueprint.fonts?.body || "—"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="rounded-lg border bg-white/80 p-6 text-center shadow-sm"
                      style={{ color: blueprint.colors?.text || "#111" }}
                    >
                      <p className="text-xl font-semibold">
                        {blueprint.pages?.homepage?.heroHeading || "Homepage hero"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {blueprint.pages?.homepage?.heroSubheading || blueprint.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Brand voice (E-E-A-T)
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Tone:</span>{" "}
                        {blueprint.brandVoice?.tone || "—"}
                      </p>
                      {!!blueprint.brandVoice?.personality?.length && (
                        <div className="flex flex-wrap gap-1">
                          {blueprint.brandVoice.personality.map((p) => (
                            <Badge key={p} variant="secondary">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {blueprint.brandVoice?.sampleBio && (
                        <p className="text-sm text-muted-foreground">{blueprint.brandVoice.sampleBio}</p>
                      )}
                    </div>

                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Users className="h-4 w-4 text-blue-600" />
                        Author profiles
                      </div>
                      {(blueprint.authors || []).map((a, idx) => (
                        <div key={`${a.name}-${idx}`} className="rounded-md bg-muted/40 p-3 text-sm">
                          <p className="font-medium">
                            {a.name}{" "}
                            <span className="text-muted-foreground font-normal">· {a.role}</span>
                          </p>
                          <p className="text-muted-foreground mt-1">{a.bio}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4 space-y-2 text-sm">
                      <p className="font-medium">Navigation</p>
                      <div className="flex flex-wrap gap-1">
                        {(blueprint.navigation || []).map((n) => (
                          <Badge key={n} variant="secondary">
                            {n}
                          </Badge>
                        ))}
                      </div>
                      <p className="font-medium pt-2">Content categories</p>
                      <div className="flex flex-wrap gap-1">
                        {(blueprint.contentCategories || []).map((c) => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4 space-y-2 text-sm">
                      <p className="font-medium">URL structure</p>
                      <div className="space-y-1 font-mono text-xs text-muted-foreground">
                        {Object.entries(blueprint.urlStructure || {}).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-foreground">{k}</span>: {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      variant={blueprintApproved ? "default" : "outline"}
                      onClick={() => setBlueprintApproved(true)}
                      disabled={saving || selectedPages.length === 0}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {blueprintApproved ? "Approved" : "Approve blueprint"}
                    </Button>
                    {!blueprintApproved && (
                      <p className="text-xs text-muted-foreground self-center">
                        Approve to enable Create website
                      </p>
                    )}
                  </div>
                </>
              )}

              {!blueprintLoading && !blueprint && (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Select pages/sections, then generate the AI brand blueprint.
                  </p>
                  <Button type="button" onClick={generateBlueprint} disabled={selectedPages.length === 0}>
                    Generate blueprint
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 1 || saving || blueprintLoading || analysisLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            type="button"
            onClick={goNext}
            disabled={!canContinue() || saving || blueprintLoading || analysisLoading}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {step === TOTAL_STEPS ? "Create website" : "Continue"}
            {step !== TOTAL_STEPS && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
