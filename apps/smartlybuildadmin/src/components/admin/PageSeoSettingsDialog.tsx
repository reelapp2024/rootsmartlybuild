import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { http } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  EMPTY_PAGE_SEO,
  apiResponseToPageSeoForm,
  newClientSchemaId,
  COMMON_SCHEMA_TYPES,
  type PageSeoForm,
  type SeoSchema,
} from "@/lib/pageSeo";

export type { PageSeoForm, SeoSchema };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  pageId: string;
  pageLabel: string;
}

type SchemaDraft = {
  id?: string;
  name: string;
  type: string;
  enabled: boolean;
  source: string;
  jsonText: string;
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errMessage(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    fallback
  );
}

function schemaToDraft(s: SeoSchema): SchemaDraft {
  return {
    id: s.id,
    name: s.name || s.type,
    type: s.type || "Thing",
    enabled: s.enabled !== false,
    source: s.source || "manual",
    jsonText: JSON.stringify(s.json || {}, null, 2),
  };
}

function emptyDraft(type = "WebPage"): SchemaDraft {
  return {
    name: type,
    type,
    enabled: true,
    source: "manual",
    jsonText: JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": type,
        name: "",
      },
      null,
      2
    ),
  };
}

function applyApiToForm(
  data: Record<string, unknown> | null | undefined,
  setForm: React.Dispatch<React.SetStateAction<PageSeoForm>>
) {
  setForm(apiResponseToPageSeoForm(data));
}

export function PageSeoSettingsDialog({
  open,
  onOpenChange,
  projectId,
  pageId,
  pageLabel,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [schemaBusy, setSchemaBusy] = useState(false);
  const [form, setForm] = useState<PageSeoForm>({ ...EMPTY_PAGE_SEO, schemas: [] });
  const [tab, setTab] = useState("basic");
  const [editing, setEditing] = useState<SchemaDraft | null>(null);
  const [jsonError, setJsonError] = useState("");

  const enabledCount = useMemo(
    () => (form.schemas || []).filter((s) => s.enabled !== false).length,
    [form.schemas]
  );

  const loadSeo = async () => {
    if (!projectId || !pageId) return;
    setLoading(true);
    setEditing(null);
    setJsonError("");
    try {
      const res = await http.get(`/getWebsitePageSeo/${projectId}/${pageId}`, {
        headers: authHeaders(),
      });
      applyApiToForm(res.data?.data, setForm);
    } catch (e: unknown) {
      setForm({ ...EMPTY_PAGE_SEO, schemas: [] });
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status !== 404) {
        toast({
          title: "Error",
          description: "Could not load SEO settings",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTab("basic");
      loadSeo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, pageId]);

  const patch = (key: keyof PageSeoForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const notifyListRefresh = () => {
    window.dispatchEvent(
      new CustomEvent("website-page-seo-updated", { detail: { projectId, pageId } })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await http.post(
        "/updateWebsitePageSeo",
        {
          projectId,
          pageId,
          ...form,
          schemas: form.schemas,
        },
        { headers: authHeaders() }
      );
      applyApiToForm(res.data?.data, setForm);
      toast({ title: "Saved", description: "SEO settings updated on this page." });
      notifyListRefresh();
      onOpenChange(false);
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: errMessage(e, "Failed to save SEO"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await http.post(
        "/generateWebsitePageSeo",
        { projectId, pageId },
        { headers: authHeaders() }
      );
      applyApiToForm(res.data?.data, setForm);
      notifyListRefresh();
      toast({
        title: "Generated",
        description: "AI SEO applied and saved. Review Basic and Advanced tabs.",
      });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: errMessage(e, "AI generation failed"),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRebuildSchemas = async () => {
    setRebuilding(true);
    try {
      const res = await http.post(
        "/regenerateWebsitePageSeoSchemas",
        { projectId, pageId },
        { headers: authHeaders() }
      );
      applyApiToForm(res.data?.data, setForm);
      setEditing(null);
      notifyListRefresh();
      toast({
        title: "Schemas rebuilt",
        description: "System schemas refreshed. Manual schemas were kept.",
      });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: errMessage(e, "Failed to rebuild schemas"),
        variant: "destructive",
      });
    } finally {
      setRebuilding(false);
    }
  };

  const persistSchema = async (draft: SchemaDraft) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(draft.jsonText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("JSON-LD must be an object");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid JSON";
      setJsonError(msg);
      toast({ title: "Invalid JSON", description: msg, variant: "destructive" });
      return;
    }
    setJsonError("");
    setSchemaBusy(true);
    try {
      const type =
        draft.type ||
        (Array.isArray(parsed["@type"])
          ? String(parsed["@type"][0] || "Thing")
          : String(parsed["@type"] || "Thing"));
      const payload = {
        id: draft.id || newClientSchemaId(),
        name: draft.name || type,
        type,
        enabled: draft.enabled,
        source: draft.id ? draft.source || "manual" : "manual",
        json: {
          "@context": "https://schema.org",
          ...parsed,
          "@type": parsed["@type"] || type,
        },
      };
      const res = await http.post(
        "/upsertWebsitePageSeoSchema",
        { projectId, pageId, schema: payload },
        { headers: authHeaders() }
      );
      applyApiToForm(res.data?.data, setForm);
      setEditing(null);
      notifyListRefresh();
      toast({ title: "Schema saved", description: `${payload.name} updated.` });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: errMessage(e, "Failed to save schema"),
        variant: "destructive",
      });
    } finally {
      setSchemaBusy(false);
    }
  };

  const toggleSchema = async (schema: SeoSchema, enabled: boolean) => {
    setSchemaBusy(true);
    try {
      const res = await http.post(
        "/setWebsitePageSeoSchemaEnabled",
        { projectId, pageId, schemaId: schema.id, enabled },
        { headers: authHeaders() }
      );
      applyApiToForm(res.data?.data, setForm);
      notifyListRefresh();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: errMessage(e, "Failed to update schema"),
        variant: "destructive",
      });
    } finally {
      setSchemaBusy(false);
    }
  };

  const deleteSchema = async (schema: SeoSchema) => {
    if (!window.confirm(`Delete schema “${schema.name || schema.type}”?`)) return;
    setSchemaBusy(true);
    try {
      const res = await http.post(
        "/deleteWebsitePageSeoSchema",
        { projectId, pageId, schemaId: schema.id },
        { headers: authHeaders() }
      );
      applyApiToForm(res.data?.data, setForm);
      if (editing?.id === schema.id) setEditing(null);
      notifyListRefresh();
      toast({ title: "Deleted", description: "Schema removed from this page." });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: errMessage(e, "Failed to delete schema"),
        variant: "destructive",
      });
    } finally {
      setSchemaBusy(false);
    }
  };

  const onDraftTypeChange = (type: string) => {
    setEditing((d) => {
      if (!d) return d;
      let nextJson = d.jsonText;
      try {
        const obj = JSON.parse(d.jsonText);
        obj["@type"] = type;
        if (!obj["@context"]) obj["@context"] = "https://schema.org";
        nextJson = JSON.stringify(obj, null, 2);
      } catch {
        /* keep text */
      }
      return {
        ...d,
        type,
        name: d.name === d.type ? type : d.name,
        jsonText: nextJson,
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">
          <DialogTitle>SEO — {pageLabel}</DialogTitle>
          <DialogDescription>
            Meta tags, social previews, and JSON-LD schemas for this page.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="schemas">
                  Schemas
                  {enabledCount > 0 ? (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {enabledCount}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3 mt-0">
                <div>
                  <Label>Meta title</Label>
                  <Input
                    value={form.meta_title}
                    onChange={(e) => patch("meta_title", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Meta description</Label>
                  <Textarea
                    value={form.meta_description}
                    onChange={(e) => patch("meta_description", e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Meta keywords</Label>
                  <Input
                    value={form.meta_keywords}
                    onChange={(e) => patch("meta_keywords", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Meta image URL</Label>
                  <Input
                    value={form.meta_image}
                    onChange={(e) => patch("meta_image", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Canonical URL</Label>
                  <Input
                    value={form.canonical_url}
                    onChange={(e) => patch("canonical_url", e.target.value)}
                    placeholder="/your-page-slug"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Uses the live slug after renames (301 redirects).
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Language</Label>
                    <Input
                      value={form.language}
                      onChange={(e) => patch("language", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Robots</Label>
                    <Select value={form.robots} onValueChange={(v) => patch("robots", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="index,follow">index, follow</SelectItem>
                        <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>
                        <SelectItem value="index,nofollow">index, nofollow</SelectItem>
                        <SelectItem value="noindex,follow">noindex, follow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Favicon URL</Label>
                  <Input
                    value={form.favicon}
                    onChange={(e) => patch("favicon", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-3 mt-0">
                <h3 className="text-sm font-semibold">Open Graph</h3>
                <div>
                  <Label>OG title</Label>
                  <Input
                    value={form.og_title}
                    onChange={(e) => patch("og_title", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>OG description</Label>
                  <Textarea
                    value={form.og_description}
                    onChange={(e) => patch("og_description", e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>OG image URL</Label>
                  <Input
                    value={form.og_image}
                    onChange={(e) => patch("og_image", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>OG type</Label>
                    <Input
                      value={form.og_type}
                      onChange={(e) => patch("og_type", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>OG site name</Label>
                    <Input
                      value={form.og_site_name}
                      onChange={(e) => patch("og_site_name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <h3 className="text-sm font-semibold pt-2 border-t">Twitter</h3>
                <div>
                  <Label>Card type</Label>
                  <Select
                    value={form.twitter_card}
                    onValueChange={(v) => patch("twitter_card", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary_large_image">Large image</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Twitter @site</Label>
                  <Input
                    value={form.twitter_site}
                    onChange={(e) => patch("twitter_site", e.target.value)}
                    placeholder="@yourbrand"
                    className="mt-1"
                  />
                </div>
              </TabsContent>

              <TabsContent value="schemas" className="space-y-4 mt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Multiple JSON-LD schemas inject on the live site. Rebuild needs{" "}
                    <code className="text-xs">seo_mode=2</code>.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={rebuilding || schemaBusy || loading}
                      onClick={handleRebuildSchemas}
                    >
                      {rebuilding ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      Rebuild
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={schemaBusy || loading}
                      onClick={() => {
                        setEditing(emptyDraft("WebPage"));
                        setJsonError("");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add schema
                    </Button>
                  </div>
                </div>

                {(form.schemas || []).length === 0 && !editing ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No schemas yet. Add one manually or Rebuild (premium mode).
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(form.schemas || []).map((schema) => (
                      <li
                        key={schema.id}
                        className="flex items-center gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {schema.name || schema.type}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {schema.type}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {schema.source || "manual"}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={schema.enabled !== false}
                          disabled={schemaBusy}
                          onCheckedChange={(checked) => toggleSchema(schema, checked)}
                          aria-label={`Enable ${schema.name}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={schemaBusy}
                          onClick={() => {
                            setEditing(schemaToDraft(schema));
                            setJsonError("");
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={schemaBusy}
                          onClick={() => deleteSchema(schema)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {editing ? (
                  <div className="space-y-3 rounded-md border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">
                        {editing.id ? "Edit schema" : "New schema"}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(null);
                          setJsonError("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={editing.name}
                          onChange={(e) =>
                            setEditing((d) => (d ? { ...d, name: e.target.value } : d))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={editing.type} onValueChange={onDraftTypeChange}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_SCHEMA_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                            {!COMMON_SCHEMA_TYPES.includes(
                              editing.type as (typeof COMMON_SCHEMA_TYPES)[number]
                            ) ? (
                              <SelectItem value={editing.type}>{editing.type}</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>JSON-LD</Label>
                      <Textarea
                        value={editing.jsonText}
                        onChange={(e) => {
                          setEditing((d) => (d ? { ...d, jsonText: e.target.value } : d));
                          setJsonError("");
                        }}
                        rows={12}
                        className="mt-1 font-mono text-xs"
                        spellCheck={false}
                      />
                      {jsonError ? (
                        <p className="text-xs text-destructive mt-1">{jsonError}</p>
                      ) : null}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(null);
                          setJsonError("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        disabled={schemaBusy}
                        onClick={() => persistSchema(editing)}
                      >
                        {schemaBusy ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Save schema
                      </Button>
                    </div>
                  </div>
                ) : null}

                {form.structured_data ? (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Legacy structured_data preview</summary>
                    <pre className="mt-2 max-h-40 overflow-auto rounded border bg-background p-2 font-mono whitespace-pre-wrap">
                      {form.structured_data}
                    </pre>
                  </details>
                ) : null}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={generating || loading || schemaBusy}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate with AI
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || schemaBusy}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save SEO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
