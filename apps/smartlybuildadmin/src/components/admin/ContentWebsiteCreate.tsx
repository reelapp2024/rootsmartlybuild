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
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Languages,
  LayoutGrid,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { http, httpFile } from "../../config.js";

const TOTAL_STEPS = 5;

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

const STEP_META = [
  { title: "Choose Goal", icon: Target, hint: "Wizard 1/6 · What is this project for?" },
  { title: "Country", icon: Globe, hint: "Wizard 2/6 · Primary market" },
  { title: "Language", icon: Languages, hint: "Wizard 3/6 · Site language" },
  { title: "Category", icon: LayoutGrid, hint: "Wizard 4/6 · Content category" },
  { title: "Niche", icon: Sparkles, hint: "Wizard 5/6 · Focus niche" },
] as const;

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

  const canContinue = () => {
    if (step === 1) return !!selectedGoal;
    if (step === 2) return !!selectedCountry;
    if (step === 3) return !!selectedLanguage;
    if (step === 4) return !!selectedCategoryId;
    if (step === 5) return !!selectedNicheId && projectName.trim().length > 0;
    return false;
  };

  const handleCreate = async () => {
    if (!selectedGoal || !selectedCountry || !selectedLanguage || !selectedCategoryId || !selectedNicheId) {
      return;
    }
    if (!projectName.trim()) {
      toast({
        title: "Project name required",
        description: "Enter a name for this content website.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const createRes = await http.post(
        "/pinterest/v2/createContentWebsite",
        {
          projectName: projectName.trim(),
          contentGoal: selectedGoal,
          language: selectedLanguage,
          categoryId: selectedCategoryId,
          nicheId: selectedNicheId,
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
          manualCountries: isGlobal
            ? [{ name: "Global", status: 1 }]
            : [],
        },
        {
          headers: {
            Authorization: `Bearer ${token()}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Content website created",
        description: `"${projectName.trim()}" is ready. More wizard steps coming next.`,
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

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Content Website</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Goal → Country → Language → Category → Niche. Blueprint &amp; content steps come later.
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
                  <div><span className="text-muted-foreground">Goal:</span> {selectedGoal}</div>
                  <div><span className="text-muted-foreground">Country:</span> {selectedCountry?.name}</div>
                  <div><span className="text-muted-foreground">Language:</span> {selectedLanguage}</div>
                  <div><span className="text-muted-foreground">Category:</span> {selectedCategory?.categoryName}</div>
                  <div><span className="text-muted-foreground">Niche:</span> {selectedNiche?.nicheName || "—"}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || saving}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button type="button" onClick={goNext} disabled={!canContinue() || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {step === TOTAL_STEPS ? "Create project" : "Continue"}
            {step !== TOTAL_STEPS && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
