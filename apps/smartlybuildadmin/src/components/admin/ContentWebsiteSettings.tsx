import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { http } from "../../config.js";
import { Switch } from "@/components/ui/switch";

type GoalRow = { _id: string; name: string; slug: string; status: number };
type LanguageRow = { _id: string; code: string; name: string; status: number };
type CategoryRow = { _id: string; categoryName: string; status: number };
type NicheRow = {
  _id: string;
  nicheName: string;
  status: number;
  categoryId: string | { _id: string; categoryName?: string };
};

type ListMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const SETTINGS_TABS = [
  { id: "goals", label: "Goals" },
  { id: "languages", label: "Languages" },
  { id: "categories", label: "Categories" },
  { id: "niches", label: "Niches" },
] as const;

type TabId = (typeof SETTINGS_TABS)[number]["id"];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token") || ""}` };
}

function StatusToggle({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={checked ? "Active" : "Inactive"}
      />
      <span
        className={`text-xs font-medium ${
          checked ? "text-emerald-700" : "text-muted-foreground"
        }`}
      >
        {checked ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function SortableHead({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  label: string;
  column: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  className?: string;
}) {
  const active = sortBy === column;
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() => onSort(column)}
      >
        {label}
        {active ? (
          sortOrder === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

function ListToolbar({
  search,
  onSearchChange,
  placeholder,
  total,
  limit,
  onLimitChange,
  extra,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder: string;
  total: number;
  limit: number;
  onLimitChange: (n: number) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {extra}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{total} total</span>
          <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function ListPagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  if (total <= 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground order-2 sm:order-1">
        Showing <span className="font-medium text-foreground">{from}</span>
        –<span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>

      {pages > 1 && (
        <Pagination className="mx-0 w-auto order-1 sm:order-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => canPrev && onPageChange(page - 1)}
                className={
                  canPrev ? "cursor-pointer" : "pointer-events-none opacity-50"
                }
              />
            </PaginationItem>

            {canPrev && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => onPageChange(page - 1)}
                  className="cursor-pointer"
                >
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationLink
                isActive
                onClick={() => onPageChange(page)}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>

            {canNext && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => onPageChange(page + 1)}
                  className="cursor-pointer"
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => canNext && onPageChange(page + 1)}
                className={
                  canNext ? "cursor-pointer" : "pointer-events-none opacity-50"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export function ContentWebsiteSettings() {
  const [tab, setTab] = useState<TabId>("goals");
  const [loading, setLoading] = useState(false);

  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryRow[]>([]);
  const [niches, setNiches] = useState<NicheRow[]>([]);

  const [meta, setMeta] = useState<ListMeta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [nicheFilterCategoryId, setNicheFilterCategoryId] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState("");

  const [goalName, setGoalName] = useState("");
  const [langCode, setLangCode] = useState("");
  const [langName, setLangName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [nicheName, setNicheName] = useState("");
  const [nicheCategoryId, setNicheCategoryId] = useState("");
  const [itemStatus, setItemStatus] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset list controls when switching tabs
  useEffect(() => {
    setPage(1);
    setSearchInput("");
    setSearch("");
    setLimit(20);
    if (tab === "goals") {
      setSortBy("name");
      setSortOrder("asc");
    } else if (tab === "languages") {
      setSortBy("code");
      setSortOrder("asc");
    } else if (tab === "categories") {
      setSortBy("categoryName");
      setSortOrder("asc");
    } else {
      setSortBy("nicheName");
      setSortOrder("asc");
    }
  }, [tab]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const loadCategoryOptions = useCallback(async () => {
    const res = await http.post(
      "/pinterest/v2/fetchCategories",
      { limit: 100, sortBy: "categoryName", sortOrder: "asc" },
      { headers: authHeaders() }
    );
    setCategoryOptions(res.data?.data?.categories || []);
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const base = {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      };

      if (tab === "goals") {
        const res = await http.post("/pinterest/v2/fetchGoals", base, { headers: authHeaders() });
        setGoals(res.data?.data?.goals || []);
        setMeta(res.data?.data?.meta || { total: 0, page: 1, limit, pages: 1 });
      } else if (tab === "languages") {
        const res = await http.post("/pinterest/v2/fetchLanguages", base, {
          headers: authHeaders(),
        });
        setLanguages(res.data?.data?.languages || []);
        setMeta(res.data?.data?.meta || { total: 0, page: 1, limit, pages: 1 });
      } else if (tab === "categories") {
        const res = await http.post("/pinterest/v2/fetchCategories", base, {
          headers: authHeaders(),
        });
        setCategories(res.data?.data?.categories || []);
        setMeta(res.data?.data?.meta || { total: 0, page: 1, limit, pages: 1 });
      } else if (tab === "niches") {
        await loadCategoryOptions();
        const res = await http.post(
          "/pinterest/v2/fetchNiches",
          {
            ...base,
            categoryId: nicheFilterCategoryId === "all" ? undefined : nicheFilterCategoryId,
          },
          { headers: authHeaders() }
        );
        setNiches(res.data?.data?.niches || []);
        setMeta(res.data?.data?.meta || { total: 0, page: 1, limit, pages: 1 });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load settings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tab, page, limit, search, sortBy, sortOrder, nicheFilterCategoryId, loadCategoryOptions]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openCreate = () => {
    setDialogMode("create");
    setEditId("");
    setGoalName("");
    setLangCode("");
    setLangName("");
    setCategoryName("");
    setNicheName("");
    setNicheCategoryId(nicheFilterCategoryId !== "all" ? nicheFilterCategoryId : "");
    setItemStatus(1);
    setDialogOpen(true);
  };

  const openEditGoal = (row: GoalRow) => {
    setDialogMode("edit");
    setEditId(row._id);
    setGoalName(row.name);
    setItemStatus(row.status);
    setDialogOpen(true);
  };

  const openEditLanguage = (row: LanguageRow) => {
    setDialogMode("edit");
    setEditId(row._id);
    setLangCode(row.code);
    setLangName(row.name);
    setItemStatus(row.status);
    setDialogOpen(true);
  };

  const openEditCategory = (row: CategoryRow) => {
    setDialogMode("edit");
    setEditId(row._id);
    setCategoryName(row.categoryName);
    setItemStatus(row.status);
    setDialogOpen(true);
  };

  const openEditNiche = (row: NicheRow) => {
    setDialogMode("edit");
    setEditId(row._id);
    setNicheName(row.nicheName);
    const catId = typeof row.categoryId === "object" ? row.categoryId?._id : row.categoryId;
    setNicheCategoryId(catId || "");
    setItemStatus(row.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === "goals") {
        if (!goalName.trim()) throw new Error("Goal name is required");
        if (dialogMode === "create") {
          await http.post(
            "/pinterest/v2/createGoal",
            { name: goalName.trim(), status: itemStatus },
            { headers: authHeaders() }
          );
        } else {
          await http.post(
            "/pinterest/v2/updateGoal",
            { goalId: editId, name: goalName.trim(), status: itemStatus },
            { headers: authHeaders() }
          );
        }
      } else if (tab === "languages") {
        if (!langCode.trim() || !langName.trim()) throw new Error("Code and name are required");
        if (dialogMode === "create") {
          await http.post(
            "/pinterest/v2/createLanguage",
            { code: langCode.trim(), name: langName.trim(), status: itemStatus },
            { headers: authHeaders() }
          );
        } else {
          await http.post(
            "/pinterest/v2/updateLanguage",
            {
              languageId: editId,
              code: langCode.trim(),
              name: langName.trim(),
              status: itemStatus,
            },
            { headers: authHeaders() }
          );
        }
      } else if (tab === "categories") {
        if (!categoryName.trim()) throw new Error("Category name is required");
        if (dialogMode === "create") {
          await http.post(
            "/pinterest/v2/createCategory",
            { categoryName: categoryName.trim(), status: itemStatus },
            { headers: authHeaders() }
          );
        } else {
          await http.post(
            "/pinterest/v2/updateCategory",
            { categoryId: editId, categoryName: categoryName.trim(), status: itemStatus },
            { headers: authHeaders() }
          );
        }
      } else if (tab === "niches") {
        if (!nicheCategoryId) {
          throw new Error("Category is required");
        }
        if (dialogMode === "create") {
          const names = nicheName
            .split(/\r?\n/)
            .map((n) => n.trim())
            .filter(Boolean);
          if (names.length === 0) {
            throw new Error("Enter at least one niche (one per line)");
          }
          const res = await http.post(
            "/pinterest/v2/createNichesBulk",
            {
              categoryId: nicheCategoryId,
              niches: names,
              status: itemStatus,
            },
            { headers: authHeaders() }
          );
          const data = res.data?.data || {};
          toast({
            title: "Niches saved",
            description: `Created ${data.createdCount || 0}${
              data.skippedCount ? `, skipped ${data.skippedCount} existing` : ""
            }.`,
          });
          setDialogOpen(false);
          await loadList();
          return;
        }
        if (!nicheName.trim()) {
          throw new Error("Niche name is required");
        }
        await http.post(
          "/pinterest/v2/updateNiche",
          {
            nicheId: editId,
            categoryId: nicheCategoryId,
            nicheName: nicheName.trim(),
            status: itemStatus,
          },
          { headers: authHeaders() }
        );
      }

      toast({
        title: "Saved",
        description: dialogMode === "create" ? "Item created." : "Item updated.",
      });
      setDialogOpen(false);
      await loadList();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message || "Save failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (
    type: TabId,
    id: string,
    currentStatus: number
  ) => {
    const nextStatus = Number(currentStatus) === 1 ? 0 : 1;
    setTogglingId(id);

    // Optimistic UI
    if (type === "goals") {
      setGoals((rows) =>
        rows.map((r) => (r._id === id ? { ...r, status: nextStatus } : r))
      );
    } else if (type === "languages") {
      setLanguages((rows) =>
        rows.map((r) => (r._id === id ? { ...r, status: nextStatus } : r))
      );
    } else if (type === "categories") {
      setCategories((rows) =>
        rows.map((r) => (r._id === id ? { ...r, status: nextStatus } : r))
      );
    } else if (type === "niches") {
      setNiches((rows) =>
        rows.map((r) => (r._id === id ? { ...r, status: nextStatus } : r))
      );
    }

    try {
      if (type === "goals") {
        await http.post(
          "/pinterest/v2/updateGoal",
          { goalId: id, status: nextStatus },
          { headers: authHeaders() }
        );
      } else if (type === "languages") {
        await http.post(
          "/pinterest/v2/updateLanguage",
          { languageId: id, status: nextStatus },
          { headers: authHeaders() }
        );
      } else if (type === "categories") {
        await http.post(
          "/pinterest/v2/updateCategory",
          { categoryId: id, status: nextStatus },
          { headers: authHeaders() }
        );
      } else if (type === "niches") {
        await http.post(
          "/pinterest/v2/updateNiche",
          { nicheId: id, status: nextStatus },
          { headers: authHeaders() }
        );
      }
      toast({
        title: nextStatus === 1 ? "Activated" : "Deactivated",
        description: `Status set to ${nextStatus === 1 ? "Active" : "Inactive"}.`,
      });
    } catch (err: any) {
      // Revert
      if (type === "goals") {
        setGoals((rows) =>
          rows.map((r) => (r._id === id ? { ...r, status: currentStatus } : r))
        );
      } else if (type === "languages") {
        setLanguages((rows) =>
          rows.map((r) => (r._id === id ? { ...r, status: currentStatus } : r))
        );
      } else if (type === "categories") {
        setCategories((rows) =>
          rows.map((r) => (r._id === id ? { ...r, status: currentStatus } : r))
        );
      } else if (type === "niches") {
        setNiches((rows) =>
          rows.map((r) => (r._id === id ? { ...r, status: currentStatus } : r))
        );
      }
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (type: TabId, id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"?`)) return;
    try {
      if (type === "goals") {
        await http.post("/pinterest/v2/deleteGoal", { goalId: id }, { headers: authHeaders() });
      } else if (type === "languages") {
        await http.post(
          "/pinterest/v2/deleteLanguage",
          { languageId: id },
          { headers: authHeaders() }
        );
      } else if (type === "categories") {
        await http.post(
          "/pinterest/v2/deleteCategory",
          { categoryId: id },
          { headers: authHeaders() }
        );
      } else if (type === "niches") {
        await http.post("/pinterest/v2/deleteNiche", { nicheId: id }, { headers: authHeaders() });
      }
      toast({ title: "Deleted", description: `"${label}" removed.` });
      await loadList();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

  const seedDefaults = async () => {
    try {
      if (tab === "goals") {
        await http.post("/pinterest/v2/addGoals", {}, { headers: authHeaders() });
        toast({ title: "Seeded", description: "Default goals added (skipped existing)." });
      } else if (tab === "languages") {
        await http.post("/pinterest/v2/seedLanguages", {}, { headers: authHeaders() });
        toast({ title: "Seeded", description: "Default languages added (skipped existing)." });
      } else if (tab === "categories" || tab === "niches") {
        const res = await http.post(
          "/pinterest/v2/seedCategoriesAndNiches",
          {},
          { headers: authHeaders() }
        );
        const data = res.data?.data || {};
        toast({
          title: "Seeded",
          description: `Categories +${data.categoriesCreated || 0}, niches +${data.nichesCreated || 0} (under their own categories).`,
        });
      }
      setPage(1);
      await loadList();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Seed failed",
        variant: "destructive",
      });
    }
  };

  const categoryLabel = (row: NicheRow) => {
    if (typeof row.categoryId === "object" && row.categoryId?.categoryName) {
      return row.categoryId.categoryName;
    }
    const found = categoryOptions.find((c) => c._id === row.categoryId);
    return found?.categoryName || "—";
  };

  const srNo = (index: number) => (meta.page - 1) * meta.limit + index + 1;

  const emptyCell = (cols: number, message: string) => (
    <TableRow>
      <TableCell colSpan={cols} className="text-center text-muted-foreground py-8">
        {message}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          Content Websites · Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage goals, languages, categories, and niches. Search, sort, and paginate each list.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as TabId);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            {SETTINGS_TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={seedDefaults}>
              Seed defaults
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Add {SETTINGS_TABS.find((t) => t.id === tab)?.label.slice(0, -1) || "item"}
            </Button>
          </div>
        </div>

        {/* Goals */}
        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
              <CardDescription>Project goals shown in Create wizard step 1.</CardDescription>
            </CardHeader>
            <CardContent>
              <ListToolbar
                search={searchInput}
                onSearchChange={setSearchInput}
                placeholder="Search goals…"
                total={meta.total}
                limit={limit}
                onLimitChange={(n) => {
                  setLimit(n);
                  setPage(1);
                }}
              />
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Sr No</TableHead>
                        <SortableHead label="Name" column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                        <SortableHead label="Slug" column="slug" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                        <SortableHead label="Status" column="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goals.length === 0
                        ? emptyCell(5, 'No goals yet. Click "Seed defaults" or Add Goal.')
                        : goals.map((row, i) => (
                            <TableRow key={row._id}>
                              <TableCell className="text-muted-foreground">{srNo(i)}</TableCell>
                              <TableCell className="font-medium">{row.name}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{row.slug}</TableCell>
                              <TableCell>
                                <StatusToggle
                                  checked={Number(row.status) === 1}
                                  disabled={togglingId === row._id}
                                  onToggle={() =>
                                    handleToggleStatus("goals", row._id, row.status)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button type="button" size="sm" variant="ghost" onClick={() => openEditGoal(row)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleDelete("goals", row._id, row.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                  <ListPagination
                    page={meta.page}
                    pages={meta.pages}
                    total={meta.total}
                    limit={meta.limit}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages */}
        <TabsContent value="languages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>Languages available in the create wizard.</CardDescription>
            </CardHeader>
            <CardContent>
              <ListToolbar
                search={searchInput}
                onSearchChange={setSearchInput}
                placeholder="Search languages…"
                total={meta.total}
                limit={limit}
                onLimitChange={(n) => {
                  setLimit(n);
                  setPage(1);
                }}
              />
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Sr No</TableHead>
                        <SortableHead label="Code" column="code" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                        <SortableHead label="Name" column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                        <SortableHead label="Status" column="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {languages.length === 0
                        ? emptyCell(5, 'No languages yet. Click "Seed defaults" or Add Language.')
                        : languages.map((row, i) => (
                            <TableRow key={row._id}>
                              <TableCell className="text-muted-foreground">{srNo(i)}</TableCell>
                              <TableCell className="font-medium">{row.code}</TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>
                                <StatusToggle
                                  checked={Number(row.status) === 1}
                                  disabled={togglingId === row._id}
                                  onToggle={() =>
                                    handleToggleStatus("languages", row._id, row.status)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button type="button" size="sm" variant="ghost" onClick={() => openEditLanguage(row)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleDelete("languages", row._id, row.code)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                  <ListPagination
                    page={meta.page}
                    pages={meta.pages}
                    total={meta.total}
                    limit={meta.limit}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Content categories (e.g. Home Decor, Recipes).</CardDescription>
            </CardHeader>
            <CardContent>
              <ListToolbar
                search={searchInput}
                onSearchChange={setSearchInput}
                placeholder="Search categories…"
                total={meta.total}
                limit={limit}
                onLimitChange={(n) => {
                  setLimit(n);
                  setPage(1);
                }}
              />
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Sr No</TableHead>
                        <SortableHead
                          label="Name"
                          column="categoryName"
                          sortBy={sortBy}
                          sortOrder={sortOrder}
                          onSort={handleSort}
                        />
                        <SortableHead label="Status" column="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length === 0
                        ? emptyCell(4, 'No categories yet. Click "Seed defaults" or Add Category.')
                        : categories.map((row, i) => (
                            <TableRow key={row._id}>
                              <TableCell className="text-muted-foreground">{srNo(i)}</TableCell>
                              <TableCell className="font-medium">{row.categoryName}</TableCell>
                              <TableCell>
                                <StatusToggle
                                  checked={Number(row.status) === 1}
                                  disabled={togglingId === row._id}
                                  onToggle={() =>
                                    handleToggleStatus("categories", row._id, row.status)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button type="button" size="sm" variant="ghost" onClick={() => openEditCategory(row)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleDelete("categories", row._id, row.categoryName)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                  <ListPagination
                    page={meta.page}
                    pages={meta.pages}
                    total={meta.total}
                    limit={meta.limit}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Niches */}
        <TabsContent value="niches" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Niches / Subcategories</CardTitle>
              <CardDescription>
                Each niche stays under its parent category. Filter, search, and paginate to manage all 450.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListToolbar
                search={searchInput}
                onSearchChange={setSearchInput}
                placeholder="Search niches or category…"
                total={meta.total}
                limit={limit}
                onLimitChange={(n) => {
                  setLimit(n);
                  setPage(1);
                }}
                extra={
                  <Select
                    value={nicheFilterCategoryId}
                    onValueChange={(v) => {
                      setNicheFilterCategoryId(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-56 h-9">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categoryOptions.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Sr No</TableHead>
                        <SortableHead
                          label="Niche"
                          column="nicheName"
                          sortBy={sortBy}
                          sortOrder={sortOrder}
                          onSort={handleSort}
                        />
                        <SortableHead
                          label="Category"
                          column="categoryName"
                          sortBy={sortBy}
                          sortOrder={sortOrder}
                          onSort={handleSort}
                        />
                        <SortableHead label="Status" column="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {niches.length === 0
                        ? emptyCell(
                            5,
                            'No niches yet. Click "Seed defaults" (15 × 30 under their categories) or Add Niche.'
                          )
                        : niches.map((row, i) => (
                            <TableRow key={row._id}>
                              <TableCell className="text-muted-foreground">{srNo(i)}</TableCell>
                              <TableCell className="font-medium">{row.nicheName}</TableCell>
                              <TableCell>{categoryLabel(row)}</TableCell>
                              <TableCell>
                                <StatusToggle
                                  checked={Number(row.status) === 1}
                                  disabled={togglingId === row._id}
                                  onToggle={() =>
                                    handleToggleStatus("niches", row._id, row.status)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button type="button" size="sm" variant="ghost" onClick={() => openEditNiche(row)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleDelete("niches", row._id, row.nicheName)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                  <ListPagination
                    page={meta.page}
                    pages={meta.pages}
                    total={meta.total}
                    limit={meta.limit}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Add" : "Edit"}{" "}
              {tab === "goals"
                ? "Goal"
                : tab === "languages"
                  ? "Language"
                  : tab === "categories"
                    ? "Category"
                    : "Niche"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {tab === "goals" && (
              <div className="space-y-2">
                <Label htmlFor="goalName">Name</Label>
                <Input
                  id="goalName"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Pinterest Traffic"
                />
              </div>
            )}

            {tab === "languages" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="langCode">Code</Label>
                  <Input
                    id="langCode"
                    value={langCode}
                    onChange={(e) => setLangCode(e.target.value.toUpperCase())}
                    placeholder="EN"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="langName">Name</Label>
                  <Input
                    id="langName"
                    value={langName}
                    onChange={(e) => setLangName(e.target.value)}
                    placeholder="English"
                  />
                </div>
              </>
            )}

            {tab === "categories" && (
              <div className="space-y-2">
                <Label htmlFor="categoryName">Name</Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Home Decor"
                />
              </div>
            )}

            {tab === "niches" && (
              <>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={nicheCategoryId} onValueChange={setNicheCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions
                        .filter((c) => c.status === 1)
                        .map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.categoryName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {dialogMode === "create" ? (
                  <div className="space-y-2">
                    <Label htmlFor="nicheNames">Niche names</Label>
                    <Textarea
                      id="nicheNames"
                      value={nicheName}
                      onChange={(e) => setNicheName(e.target.value)}
                      placeholder={"Small Bedroom Decor\nLuxury Bedroom Decor\nBoho Bedroom Decor"}
                      className="min-h-[180px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      One niche per line. Add as many as you want — each line becomes a separate
                      niche under the selected category. Empty lines are ignored; duplicates are
                      skipped.
                    </p>
                    {nicheName.trim() && (
                      <p className="text-xs text-muted-foreground">
                        Ready to add:{" "}
                        <span className="font-medium text-foreground">
                          {
                            nicheName
                              .split(/\r?\n/)
                              .map((n) => n.trim())
                              .filter(Boolean).length
                          }
                        </span>{" "}
                        niche(s)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="nicheName">Niche name</Label>
                    <Input
                      id="nicheName"
                      value={nicheName}
                      onChange={(e) => setNicheName(e.target.value)}
                      placeholder="e.g. Bedroom"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div>
                <Label className="text-sm">Status</Label>
                <p className="text-xs text-muted-foreground">
                  {itemStatus === 1 ? "Visible in create wizard" : "Hidden from create wizard"}
                </p>
              </div>
              <StatusToggle
                checked={itemStatus === 1}
                onToggle={(on) => setItemStatus(on ? 1 : 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
