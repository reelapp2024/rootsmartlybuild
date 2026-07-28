import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, Search, Sparkles, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { httpFile } from "../../config.js";
import { resolveAdminProjectId, blogPostsListPath } from "@/lib/adminProjectPaths";

type TreeNode = {
  name: string;
  id: string;
  children: TreeNode[];
  type?: number;
  label?: string;
  parentId?: string | null;
};
type AuthorItem = { _id: string; name: string };

const BLOG_TYPES = [
  { id: "how", label: "How-To", note: "Step-by-step guides" },
  { id: "best", label: "Best", note: "Telling about best" },
  { id: "comparison", label: "Comparison", note: "A comparison B breakdown" },
  { id: "what", label: "What", note: "What is the reason or use of…" },
] as const;

const STYLE_MAP: Record<(typeof BLOG_TYPES)[number]["id"], string> = {
  how: "how to",
  best: "best",
  comparison: "comparison",
  what: "what",
};

export default function AiBlogsWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId: paramProjectId } = useParams<{ projectId?: string }>();
  const projectId = resolveAdminProjectId({
    paramProjectId,
    stateProjectId: (location.state as any)?.projectId,
    queryProjectId: new URLSearchParams(location.search).get("projectId"),
  });
  const postsListHref = blogPostsListPath(projectId);

  const [step, setStep] = useState(1);

  // Step 1: blog type
  const [blogType, setBlogType] = useState<(typeof BLOG_TYPES)[number]["id"] | null>(null);

  // Step 2: location (dynamic)
  const [locationBased, setLocationBased] = useState<boolean>(false);
  const [locLoading, setLocLoading] = useState(false);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [locSearch, setLocSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Step 3: quantity or manual
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [count, setCount] = useState<number>(3);
  const [manualInput, setManualInput] = useState("");
  const [genLoading, setGenLoading] = useState(false);

  // Step 4: titles (editable)
  const [titles, setTitles] = useState<string[]>([]);

  // Step 5: SEO mode (0 manual · 1 basic · 2 premium)
  const [blogSeoMode, setBlogSeoMode] = useState<0 | 1 | 2>(2);

  // Step 6: authors dropdown (+ submit)
  const [authors, setAuthors] = useState<AuthorItem[]>([]);
  const [authorId, setAuthorId] = useState<string>("");
  const [authorMode, setAuthorMode] = useState<"existing" | "new">("existing");
  const [newAuthorName, setNewAuthorName] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [done, setDone] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const totalSteps = 6;
  const stepTitle = useMemo(() => {
    switch (step) {
      case 1: return "Choose Blog Type";
      case 2: return "Choose Locations (optional)";
      case 3: return "How Many Titles?";
      case 4: return "Review & Edit Titles";
      case 5: return "SEO Mode";
      case 6: return "Generate Blogs";
      default: return "AI Blog Generator";
    }
  }, [step]);

  const SEO_MODE_OPTIONS = [
    {
      id: 0 as const,
      label: "Manual SEO",
      note: "Content only — fill meta title, description & keywords yourself later",
    },
    {
      id: 1 as const,
      label: "Basic SEO",
      note: "AI generates meta title, description, keywords & tags",
    },
    {
      id: 2 as const,
      label: "Premium SEO",
      note: "Basic meta + Open Graph + JSON-LD (BlogPosting, FAQ, Breadcrumbs)",
    },
  ];

  // ----- load authors for step 6 -----
  useEffect(() => {
    (async () => {
      try {
        const res = await httpFile.get<{ data: AuthorItem[] }>("/fetch_authors", {
          headers: { Authorization: `Bearer ${token || ""}` },
        });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setAuthors(list);
        if (list.length) {
          setAuthorId(String(list[0]._id));
          setAuthorMode("existing");
        } else {
          setAuthorMode("new");
        }
      } catch (err: any) {
        console.error("fetch_authors error:", err);
        if (err?.response?.status === 401) {
          toast({ title: "Session expired", description: "Please login", variant: "destructive" });
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          toast({ title: "Failed to load authors", description: err?.response?.data?.message || "Please try again.", variant: "destructive" });
        }
      }
    })();
  }, [navigate, token]); // don't include authorId to avoid loops

  // ----- load locations tree (step 2) -----
  useEffect(() => {
    const fetchLocations = async () => {
      if (!locationBased) return;
      if (!projectId) {
        toast({
          title: "Project missing",
          description: "projectId is required to load locations",
          variant: "destructive"
        });
        return;
      }
      try {
        setLocLoading(true);
        const res = await httpFile.post(
          "/getProjectLocations",
          { projectId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data: TreeNode[] = Array.isArray(res?.data?.data) ? res.data.data : [];
        setTree(data);
        // Expand all parents by default so hierarchy is visible
        const parentIds = new Set<string>();
        const collectParents = (nodes: TreeNode[]) => {
          nodes.forEach((n) => {
            if (n.children?.length) {
              parentIds.add(n.id);
              collectParents(n.children);
            }
          });
        };
        collectParents(data);
        setExpandedIds(parentIds);
        if (!data.length) {
          toast({
            title: "No locations",
            description: "Add locations for this project first (Locations in the project dashboard).",
          });
        }
      } catch (err: any) {
        console.log(err, "error while loading locations");
        toast({
          title: "Error",
          description: err?.response?.data?.message || "Failed to load locations",
          variant: "destructive"
        });
      } finally {
        setLocLoading(false);
      }
    };
    if (step === 2) fetchLocations();
  }, [step, locationBased, projectId, token]);


  // Reset success state whenever you move away from Step 6
  useEffect(() => {
    if (step !== 6 && done) setDone(false);
  }, [step]);

  // Reset success state if the user changes anything that affects output
  useEffect(() => {
    if (done) setDone(false);
  }, [titles, blogType, locationBased, authorId, blogSeoMode]);


  // ----- Tree helpers -----
  const isNodeChecked = (n: TreeNode) => selectedIds.has(n.id);
  const toggleNode = (n: TreeNode) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(n.id)) next.delete(n.id);
      else next.add(n.id);
      return next;
    });
  };
  const allIds = (nodes: TreeNode[]): string[] =>
    nodes.flatMap(n => [n.id, ...(n.children?.length ? allIds(n.children) : [])]);
  const parentIdsOnly = (nodes: TreeNode[]): string[] => {
    const out: string[] = [];
    const walk = (list: TreeNode[]) => {
      list.forEach((n) => {
        if (Number(n.type) === 0 || (n.children?.length ?? 0) > 0) out.push(n.id);
        if (n.children?.length) walk(n.children);
      });
    };
    walk(nodes);
    return out;
  };
  /** Local areas / nested children — not top-level parents */
  const childIdsOnly = (nodes: TreeNode[]): string[] => {
    const out: string[] = [];
    const walk = (list: TreeNode[], depth: number) => {
      list.forEach((n) => {
        if (Number(n.type) === 1 || depth > 0) out.push(n.id);
        if (n.children?.length) walk(n.children, depth + 1);
      });
    };
    walk(nodes, 0);
    return out;
  };
  const selectAll = () => setSelectedIds(new Set(allIds(tree)));
  const selectParentsOnly = () => setSelectedIds(new Set(parentIdsOnly(tree)));
  const selectChildrenOnly = () => setSelectedIds(new Set(childIdsOnly(tree)));
  const clearAll = () => setSelectedIds(new Set());
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTree = useMemo<TreeNode[]>(() => {
    if (!locSearch.trim()) return tree;
    const q = locSearch.toLowerCase();
    const filterRec = (node: TreeNode): TreeNode | null => {
      const matchSelf = node.name.toLowerCase().includes(q);
      const kids = node.children.map(filterRec).filter(Boolean) as TreeNode[];
      if (matchSelf || kids.length) return { ...node, children: kids };
      return null;
    };
    return tree.map(filterRec).filter(Boolean) as TreeNode[];
  }, [tree, locSearch]);

  const locationNames = useMemo(() => {
    const names: string[] = [];
    const walk = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        if (selectedIds.has(n.id)) names.push(n.name);
        if (n.children?.length) walk(n.children);
      });
    };
    walk(tree);
    return Array.from(new Set(names));
  }, [selectedIds, tree]);

  const collectSelected = (): { id: string; name: string; path: string[] }[] => {
    const out: { id: string; name: string; path: string[] }[] = [];
    const walk = (nodes: TreeNode[], path: string[]) => {
      nodes.forEach(n => {
        const nextPath = [...path, n.name];
        if (selectedIds.has(n.id)) out.push({ id: n.id, name: n.name, path: nextPath });
        if (n.children?.length) walk(n.children, nextPath);
      });
    };
    walk(tree, []);
    return out;
  };

  // ----- Generate titles from API (auto mode) -----
  const styleString = blogType ? STYLE_MAP[blogType] : "";
  const requestTitlesFromApi = async (desiredCount?: number) => {
    if (!projectId) {
      toast({
        title: "Missing projectId",
        description: "Cannot generate without projectId.",
        variant: "destructive"
      });
      return false;
    }
    if (!styleString) {
      toast({
        title: "Pick a type",
        description: "Please choose one blog type to continue.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setGenLoading(true);
      const payload = {
        projectId,
        style: styleString,
        count: desiredCount ?? count,
        locations: locationBased ? locationNames : []
      };

      const res = await httpFile.post("/generateBlogTitles", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });

      const arr: string[] = Array.isArray(res?.data?.data) ? res.data.data : [];
      if (!arr.length) {
        toast({
          title: "No titles returned",
          description: "The API returned no titles.",
          variant: "destructive"
        });
        return false;
      }
      setTitles(arr);
      return true;
    } catch (err: any) {
      console.error("generateBlogTitles error:", err);
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to generate titles.",
        variant: "destructive"
      });
      return false;
    } finally {
      setGenLoading(false);
    }
  };

  // ----- Manual titles -> array -----
  const fromManual = () => {
    const lines = manualInput
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    setTitles(lines);
  };

  // ----- Navigation -----
  const next = async () => {
    if (step === 1 && !blogType) {
      toast({ title: "Pick a type", description: "Please choose one blog type to continue.", variant: "destructive" });
      return;
    }
    if (step === 2) {
      const selected = collectSelected();
      console.log("Selected locations count:", selected.length);
      console.log("Selected locations (flat):", selected.map(s => ({ id: s.id, name: s.name })));
      console.log("Selected locations (with path):", selected);
    }
    if (step === 3) {
      if (mode === "auto") {
        if (!count || count < 1 || count > 10) {
          toast({ title: "Missing / Invalid count", description: "Set a count between 1 and 10.", variant: "destructive" });
          return;
        }
        const ok = await requestTitlesFromApi(count);
        if (!ok) return;
      } else {
        if (!manualInput.trim()) {
          toast({ title: "Missing titles", description: "Enter at least one title.", variant: "destructive" });
          return;
        }
        fromManual();
      }
    }
    if (step === 4 && !titles.length) {
      toast({ title: "No titles", description: "Add at least one title.", variant: "destructive" });
      return;
    }
    setStep(Math.min(step + 1, totalSteps));
  };

  const back = () => setStep(Math.max(step - 1, 1));

  // ----- Regenerate helpers -----
  const regenerateOne = (i: number) => {
    if (!blogType) return;
    const withLoc = locationBased && locationNames.length ? ` in ${locationNames[i % locationNames.length]}` : "";
    setTitles(prev => {
      const copy = [...prev];
      copy[i] = `New ${STYLE_MAP[blogType]} Title${withLoc} #${i + 1}`;
      return copy;
    });
  };

  const regenerateAll = async () => {
    const desired = titles.length || count || 5;
    await requestTitlesFromApi(desired);
  };

  const addEmptyTitle = () => {
    if (titles.length >= 10) {
      toast({ title: "Limit reached", description: "Max 10 titles.", variant: "destructive" });
      return;
    }
    setTitles(prev => [...prev, `New Title ${prev.length + 1}`]);
  };

  // ----- Scheduling feature (new) -----
  type Frequency = "once" | "daily" | "weekly" | "monthly";

  const [publishMode, setPublishMode] = useState<"instant" | "schedule">("instant");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [firstPublishIso, setFirstPublishIso] = useState<string>(() => {
    // default now + 1 hour
    const d = new Date();
    d.setHours(d.getHours() + 1);
    // reduce seconds to 0
    d.setSeconds(0); d.setMilliseconds(0);
    return d.toISOString().slice(0, 16); // local datetime-local expects "YYYY-MM-DDTHH:MM"
  });

  // per-title schedule entries (ISO string)
  const [titleSchedules, setTitleSchedules] = useState<string[]>([]);

  // compute schedule dates based on firstPublishIso + frequency for number of titles
  const computeScheduleDates = (firstIsoLocal: string, freq: Frequency, countItems: number) => {
    if (!firstIsoLocal) return Array(countItems).fill("");
    // firstIsoLocal is "YYYY-MM-DDTHH:MM" (local). Create Date using local components.
    const parseLocal = (localIso: string) => {
      const [d, t] = (localIso || "").split("T");
      if (!d || !t) return null;
      const [y, m, day] = d.split("-").map(Number);
      const [hh, mm] = t.split(":").map(Number);
      return new Date(y, (m || 1) - 1, day, hh || 0, mm || 0, 0, 0);
    };
    const first = parseLocal(firstIsoLocal);
    if (!first) return Array(countItems).fill("");

    const out: string[] = [];
    for (let i = 0; i < countItems; i++) {
      const dt = new Date(first.getTime());
      if (i > 0) {
        if (freq === "daily") dt.setDate(dt.getDate() + i);
        else if (freq === "weekly") dt.setDate(dt.getDate() + 7 * i);
        else if (freq === "monthly") {
          // Add months preserving day as best as possible
          const newMonth = dt.getMonth() + i;
          dt.setMonth(newMonth);
        } else {
          // once -> set same timestamp for all (but user can edit individually)
        }
      }
      // produce ISO in local datetime-local format "YYYY-MM-DDTHH:MM"
      const pad = (n: number) => String(n).padStart(2, "0");
      const isoLocal = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      out.push(isoLocal);
    }
    return out;
  };

  // regenerate titleSchedules whenever titles/firstPublishIso/frequency/publishMode change
  useEffect(() => {
    if (publishMode === "schedule" && titles.length) {
      const dates = computeScheduleDates(firstPublishIso, frequency, titles.length);
      setTitleSchedules(dates);
    } else {
      setTitleSchedules([]);
    }
  }, [titles, publishMode, firstPublishIso, frequency]);

  // update a single title schedule (manual override)
  const updateTitleScheduleAt = (index: number, isoLocal: string) => {
    setTitleSchedules(prev => {
      const copy = [...prev];
      copy[index] = isoLocal;
      return copy;
    });
  };

  // Keep count in sync with editable title list (Add Title → finish must queue ALL)
  useEffect(() => {
    if (titles.length > 0) setCount(titles.length);
  }, [titles.length]);

  // ----- Finish: call create_ai_blog with titles[] + authorId + publish/schedule info -----
  const finish = async () => {
    if (!projectId) {
      toast({ title: "Missing projectId", description: "Cannot generate without projectId.", variant: "destructive" });
      return;
    }
    // Always use the live editable list (includes manually added titles)
    const finalTitles = titles
      .map((t) => String(t || "").trim())
      .filter(Boolean);
    if (!finalTitles.length) {
      toast({ title: "No titles", description: "Add at least one title.", variant: "destructive" });
      return;
    }
    if (!blogType) {
      toast({ title: "Type missing", description: "Please choose a blog type.", variant: "destructive" });
      return;
    }
    if (authorMode === "existing" && !authorId) {
      toast({ title: "Pick an author", description: "Please select an author.", variant: "destructive" });
      return;
    }
    if (authorMode === "new" && !newAuthorName.trim()) {
      toast({ title: "Missing author name", description: "Please enter a name for the new author.", variant: "destructive" });
      return;
    }

    // Validate schedule entries if scheduling chosen
    if (publishMode === "schedule") {
      const anyEmpty = finalTitles.some((_, i) => !titleSchedules[i] || !String(titleSchedules[i]).trim());
      if (anyEmpty) {
        toast({ title: "Missing schedule datetimes", description: "Please set the datetime for each post.", variant: "destructive" });
        return;
      }
    }

    setSubmitLoading(true);
    try {
      let finalAuthorId = authorId;

      if (authorMode === "new") {
        const formData = new FormData();
        formData.append("name", newAuthorName);
        const createRes = await httpFile.post("/create_author", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const newAuthor = createRes?.data?.data;
        if (!newAuthor?._id) {
          throw new Error("Failed to create author");
        }
        finalAuthorId = String(newAuthor._id);
        setAuthors(prev => [...prev, { _id: newAuthor._id, name: newAuthor.name }]);
        setAuthorId(finalAuthorId);
        setAuthorMode("existing");
        setNewAuthorName("");
      }

      let payload: any = {
        projectId,
        title: finalTitles,
        type: blogType,
        authorId: finalAuthorId,
        locations: locationBased ? locationNames : [],
        seoMode: blogSeoMode,
      };

      if (publishMode === "instant") {
        payload.status = 1;
      } else {
        payload.status = 0;
        const convertLocalToUTCiso = (localIso: string) => {
          const [d, t] = localIso.split("T");
          const [y, m, day] = d.split("-").map(Number);
          const [hh, mm] = t.split(":").map(Number);
          const dt = new Date(y, m - 1, day, hh || 0, mm || 0, 0, 0);
          return dt.toISOString();
        };
        payload.titlesWithSchedule = finalTitles.map((t, i) => ({
          title: t,
          scheduledAt: convertLocalToUTCiso(titleSchedules[i] || firstPublishIso),
          scheduleKey: frequency,
        }));
      }

      console.log("[create-post-ai] finishing with titles:", finalTitles.length, finalTitles);

      const res = await httpFile.post("/create_ai_blog", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });

      const queued = Number(res?.data?.count ?? finalTitles.length);
      if (queued !== finalTitles.length) {
        toast({
          title: "Partial queue",
          description: `Expected ${finalTitles.length} blogs but API queued ${queued}. Check server logs.`,
          variant: "destructive",
        });
      }

      setDone(true);
      toast({
        title: "Background blogs creation started",
        description: `${queued} article(s) queued with ${res?.data?.parallelWorkers ?? 6} workers. Watch progress on Blog Posts.`,
      });
      navigate(postsListHref, {
        state: {
          projectId,
          aiBlogJobIds: res?.data?.jobIds || [],
          aiBlogGenerating: true,
          aiBlogExpectedCount: finalTitles.length,
          // Seed Blog Posts banner immediately (sockets/poll take over after)
          aiBlogProgress: res?.data?.progress || null,
        },
      });
    } catch (err: any) {
      console.error("create_ai_blog error:", err);
      toast({
        title: "Generation failed",
        description: err?.response?.data?.message || "The blog creation API failed.",
        variant: "destructive"
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // ----- UI -----
  const Stepper = () => (
    <div className="flex items-center space-x-1 overflow-x-auto pb-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
        <div key={i} className={`flex items-center flex-shrink-0 ${i > 1 && "ml-1"}`}>
          <div
            className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium
              ${step === i ? "bg-blue-600 text-white" : step > i ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
          >
            {step > i ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : i}
          </div>
          {i < totalSteps && <div className={`h-1 w-3 sm:w-6 ${step > i ? "bg-green-500" : "bg-gray-200"}`}></div>}
        </div>
      ))}
    </div>
  );

  const TypeCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {BLOG_TYPES.map(t => {
        const active = blogType === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setBlogType(t.id)}
            className={`text-left border rounded-lg p-4 hover:shadow-md transition-all
              ${active ? "ring-2 ring-blue-500 bg-blue-50" : "hover:border-gray-300"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-gray-500">{t.note}</div>
              </div>
              {active && <Badge variant="secondary">Selected</Badge>}
            </div>
          </button>
        );
      })}
    </div>
  );

  const Tree = ({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) => (
    <div className={depth === 0 ? "space-y-1" : "space-y-0.5 mt-1"}>
      {nodes.map((n) => {
        const hasKids = (n.children?.length ?? 0) > 0;
        const expanded = locSearch.trim() ? true : expandedIds.has(n.id);
        const isParent = Number(n.type) === 0 || hasKids;
        const badgeLabel =
          n.label ||
          (isParent ? (depth === 0 ? "Parent" : "Area") : "Local area");
        return (
          <div key={n.id} className="flex flex-col">
            <div
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/80"
              style={{ paddingLeft: 8 + depth * 18 }}
            >
              {hasKids ? (
                <button
                  type="button"
                  className="h-5 w-5 flex items-center justify-center text-gray-500 shrink-0"
                  onClick={() => toggleExpand(n.id)}
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-5 shrink-0" />
              )}
              <Checkbox
                checked={isNodeChecked(n)}
                onCheckedChange={() => toggleNode(n)}
                id={`loc-${n.id}`}
              />
              <label
                htmlFor={`loc-${n.id}`}
                className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
              >
                <span className="text-sm font-medium truncate">{n.name}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${
                    isParent
                      ? "border-blue-300 text-blue-700 bg-blue-50"
                      : "border-emerald-300 text-emerald-700 bg-emerald-50"
                  }`}
                >
                  {badgeLabel}
                </Badge>
              </label>
            </div>
            {hasKids && expanded ? <Tree nodes={n.children} depth={depth + 1} /> : null}
          </div>
        );
      })}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pick a blog style</h3>
            <TypeCards />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={locationBased} onCheckedChange={v => setLocationBased(!!v)} id="locbased" />
              <Label htmlFor="locbased">Make titles location-based?</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Pick any mix: parents only, local areas only, or both. Each checked location can appear in titles.
            </p>

            {locationBased && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search locations…"
                      className="pl-10"
                      value={locSearch}
                      onChange={e => setLocSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAll} disabled={locLoading || !tree.length}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectParentsOnly} disabled={locLoading || !tree.length}>
                    Parents only
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectChildrenOnly} disabled={locLoading || !tree.length}>
                    Local areas only
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll} disabled={locLoading}>
                    Clear
                  </Button>
                </div>

                <div className="border rounded-lg p-3 max-h-96 overflow-y-auto bg-gray-50">
                  {locLoading ? (
                    <div className="text-sm text-gray-500">Loading locations…</div>
                  ) : filteredTree.length ? (
                    <Tree nodes={filteredTree} />
                  ) : tree.length === 0 ? (
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>No locations found for this project.</p>
                      <p className="text-xs">
                        Add parent areas and local areas under Project → Locations, then come back here.
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No matching locations for “{locSearch}”.</div>
                  )}
                </div>

                <div className="text-xs text-gray-600 flex flex-wrap gap-3 items-center">
                  <span>
                    Selected: <Badge variant="outline">{selectedIds.size}</Badge>
                  </span>
                  {locationNames.length > 0 && (
                    <span className="text-muted-foreground truncate max-w-full">
                      {locationNames.slice(0, 8).join(", ")}
                      {locationNames.length > 8 ? ` +${locationNames.length - 8} more` : ""}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex gap-3">
              <Button variant={mode === "auto" ? "default" : "outline"} onClick={() => setMode("auto")}>
                Auto (count)
              </Button>
              <Button variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode("manual")}>
                Manual (titles)
              </Button>
            </div>

            {mode === "auto" ? (
              <div className="space-y-2">
                <Label htmlFor="count">How many blog titles? (1–10)</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={10}
                  value={count}
                  onChange={e => setCount(Math.min(10, Math.max(1, Number(e.target.value || 1))))}
                  className="w-32"
                />
                {genLoading && <div className="text-xs text-gray-500">Generating titles…</div>}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="manual">Enter titles (one per line, max 10)</Label>
                <textarea
                  id="manual"
                  className="w-full min-h-48 border rounded-md p-3"
                  placeholder="Title 1&#10;Title 2&#10;Title 3"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Edit Titles</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={addEmptyTitle}>
                  Add Title
                </Button>
                <Button variant="outline" onClick={regenerateAll} disabled={genLoading}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  {genLoading ? "Regenerating…" : "Regenerate All"}
                </Button>
              </div>
            </div>

            {!titles.length ? (
              <div className="text-sm text-gray-500">No titles yet.</div>
            ) : (
              <div className="space-y-3">
                {titles.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={t}
                      onChange={e => {
                        setDone(false);
                        setTitles(prev => prev.map((x, idx) => (idx === i ? e.target.value : x)));
                      }}

                    />
                    <Button variant="outline" onClick={() => regenerateOne(i)}>
                      <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setTitles(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How should SEO be handled?</h3>
            <p className="text-sm text-muted-foreground">
              Same scale as site <code className="text-xs">seo_mode</code>: 0 manual, 1 basic meta, 2 premium with JSON-LD.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {SEO_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBlogSeoMode(opt.id)}
                  className={`text-left border rounded-lg p-4 transition ${
                    blogSeoMode === opt.id
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold">{opt.label}</span>
                    <Badge variant={blogSeoMode === opt.id ? "default" : "outline"}>{opt.id}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{opt.note}</p>
                </button>
              ))}
            </div>
            {blogSeoMode === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Articles will be created without meta fields. Edit each post later to add SEO manually.
              </p>
            )}
            {blogSeoMode === 2 && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                Premium packs BlogPosting + BreadcrumbList + FAQPage JSON-LD from the article (injected on the live blog URL).
              </p>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            {!done ? (
              <>
                <h3 className="text-lg font-medium">Ready to generate blogs</h3>
                <p className="text-sm text-gray-600">
                  We’ll create posts from these titles. SEO mode:{" "}
                  <Badge variant="outline">
                    {SEO_MODE_OPTIONS.find((o) => o.id === blogSeoMode)?.label || blogSeoMode}
                  </Badge>
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <Button variant={authorMode === "existing" ? "default" : "outline"} onClick={() => setAuthorMode("existing")}>
                        Existing Author
                      </Button>
                      <Button variant={authorMode === "new" ? "default" : "outline"} onClick={() => setAuthorMode("new")}>
                        New Author
                      </Button>
                    </div>
                    {authorMode === "existing" ? (
                      <>
                        <Label htmlFor="author">Author (for all blogs)</Label>
                        <Select
                          value={authorId}
                          onValueChange={setAuthorId}
                          disabled={!authors.length}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select author" />
                          </SelectTrigger>
                          <SelectContent>
                            {authors.length ? (
                              authors
                                .filter(a => a && a._id && a.name)
                                .map(a => (
                                  <SelectItem key={a._id} value={String(a._id)}>
                                    {a.name}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="__noauthors" disabled>
                                No authors found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
                        <Label htmlFor="newAuthorName">Author Name</Label>
                        <Input
                          id="newAuthorName"
                          value={newAuthorName}
                          onChange={e => setNewAuthorName(e.target.value)}
                          placeholder="Enter new author name"
                        />
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Type sent to API</Label>
                    <Input
                      readOnly
                      value={
                        blogType
                          ? (BLOG_TYPES.find(t => t.id === blogType)?.label ?? blogType)
                          : ""
                      }
                    />
                  </div>
                </div>

                {/* Publish Mode */}
                <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center gap-3">
                    <Label className="min-w-[110px]">Publish mode</Label>
                    <div className="flex gap-2">
                      <Button variant={publishMode === "instant" ? "default" : "outline"} onClick={() => setPublishMode("instant")}>Instant</Button>
                      <Button variant={publishMode === "schedule" ? "default" : "outline"} onClick={() => setPublishMode("schedule")}>Schedule</Button>
                    </div>
                  </div>

                  {publishMode === "instant" ? (
                    <div className="text-sm text-gray-600">Posts will be created as published (status: 1).</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Label className="min-w-[110px]">Frequency</Label>
                        <select className="border rounded px-2 py-1" value={frequency} onChange={e => setFrequency(e.target.value as Frequency)}>
                          <option value="once">Once (manual per post)</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <Label className="min-w-[110px]">First publish</Label>
                        <input
                          type="datetime-local"
                          value={firstPublishIso}
                          onChange={e => setFirstPublishIso(e.target.value)}
                          className="border rounded px-2 py-1"
                        />
                        <div className="text-sm text-gray-500">This sets the datetime for the first post; others auto-fill below.</div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Preview schedule</div>
                        <div className="space-y-2">
                          {titles.map((t, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1 text-sm">{t}</div>
                              <input
                                type="datetime-local"
                                value={titleSchedules[i] ?? firstPublishIso}
                                onChange={e => updateTitleScheduleAt(i, e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">You can edit any individual publish time above before creating posts.</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm font-medium mb-2">
                    Titles to generate ({titles.filter((t) => String(t || "").trim()).length})
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {titles.map((t, i) => (
                      <li key={i} className="text-sm">
                        {t} {publishMode === "schedule" ? (<span className="ml-2 text-xs text-gray-500"> — {titleSchedules[i] ?? "-"}</span>) : null}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Finish queues every title above (including ones you added manually).
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-md">
                  <Check className="h-4 w-4" /> Success — your blogs will be ready soon!
                </div>
                <p className="text-sm text-gray-600">You can manage or schedule them from the posts page.</p>
                <Button
                  variant="outline"
                  onClick={() => navigate(postsListHref, { state: { projectId } })}
                >
                  Go to Blogs
                </Button>

              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">AI Blog Generator</h1>
      </div>

      <div className="flex justify-between mb-6">
        <Stepper />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{stepTitle}</CardTitle>
          <CardDescription>
            {step === 1 && "Pick the style of blogs you want to generate."}
            {step === 2 && "Optionally make titles location-based and pick the areas from your project."}
            {step === 3 && "Choose a number of titles (auto) or enter them manually."}
            {step === 4 && "Edit, add or regenerate any title before generating."}
            {step === 5 && "Choose SEO handling: manual, basic meta, or premium JSON-LD."}
            {step === 6 && "Pick author, publish mode, then queue generation."}
          </CardDescription>
        </CardHeader>

        <CardContent>{renderStep()}</CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={step === 1 || genLoading || submitLoading}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            type="button"
            onClick={step < totalSteps ? next : finish}
            disabled={(locLoading && step === 2) || genLoading || submitLoading}
          >
            {step < totalSteps ? (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            ) : submitLoading ? (
              "Generating…"
            ) : done ? (
              "Done"
            ) : (
              "Finish"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}