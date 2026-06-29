import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http, httpFile } from "../../config.js";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Plus,
  Loader2,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  XCircle,
  ArrowLeft,
  Globe2,
  AlertCircle,
} from "lucide-react";

export type LocationNode = {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  status?: number;
  enabled?: boolean;
  pageGenerated?: boolean;
  hasPages?: boolean;
  children: LocationNode[];
  isDraft?: boolean;
  draftParentId?: string | null;
};

type DraftLocation = {
  tempId: string;
  name: string;
  type: 0 | 1;
  parentId: string | null;
};

type LocationsManagementProps = {
  projectId?: string;
};

function flattenNodes(nodes: LocationNode[]): LocationNode[] {
  const out: LocationNode[] = [];
  const walk = (n: LocationNode) => {
    out.push(n);
    (n.children || []).forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

function mergeDraftIntoTree(saved: LocationNode[], drafts: DraftLocation[]): LocationNode[] {
  const clone = JSON.parse(JSON.stringify(saved)) as LocationNode[];
  const findNode = (nodes: LocationNode[], id: string): LocationNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const child = findNode(n.children || [], id);
      if (child) return child;
    }
    return null;
  };

  const parentDrafts = drafts.filter((d) => d.type === 0);
  const childDrafts = drafts.filter((d) => d.type === 1);

  parentDrafts.forEach((d) => {
    clone.push({
      id: d.tempId,
      name: d.name,
      type: 0,
      parentId: null,
      enabled: true,
      status: 1,
      pageGenerated: false,
      isDraft: true,
      children: [],
    });
  });

  childDrafts.forEach((d) => {
    const parent = d.parentId ? findNode(clone, d.parentId) : null;
    const childNode: LocationNode = {
      id: d.tempId,
      name: d.name,
      type: 1,
      parentId: d.parentId,
      enabled: true,
      status: 1,
      pageGenerated: false,
      isDraft: true,
      children: [],
    };
    if (parent) {
      parent.children = [...(parent.children || []), childNode];
    } else {
      clone.push(childNode);
    }
  });

  return clone;
}

export default function LocationsManagement({ projectId: propProjectId }: LocationsManagementProps) {
  const navigate = useNavigate();
  const projectId = propProjectId || "";

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [savedTree, setSavedTree] = useState<LocationNode[]>([]);
  const [drafts, setDrafts] = useState<DraftLocation[]>([]);
  const [meta, setMeta] = useState({ total: 0, pendingPageGeneration: 0 });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addContext, setAddContext] = useState<{
    mode: "sibling" | "child";
    anchorId: string | null;
    anchorName: string;
    anchorType: number;
  } | null>(null);
  const [newLocationName, setNewLocationName] = useState("");

  const displayTree = useMemo(
    () => mergeDraftIntoTree(savedTree, drafts),
    [savedTree, drafts]
  );

  const hasDrafts = drafts.length > 0;
  const pendingCount =
    meta.pendingPageGeneration +
    drafts.filter((d) => d.type === 1).length;

  const fetchHierarchy = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/getBusinessLocationHierarchy",
        { projectId, includeInactive: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tree: LocationNode[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setSavedTree(tree);
      setMeta({
        total: res.data?.meta?.total ?? flattenNodes(tree).length,
        pendingPageGeneration: res.data?.meta?.pendingPageGeneration ?? 0,
      });
      const exp: Record<string, boolean> = {};
      flattenNodes(tree).forEach((n) => {
        exp[n.id] = true;
      });
      setExpanded((prev) => ({ ...exp, ...prev }));
    } catch {
      toast.error("Failed to load location hierarchy");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const openAddDialog = (
    mode: "sibling" | "child",
    anchor: LocationNode | null
  ) => {
    setAddContext({
      mode,
      anchorId: anchor?.id ?? null,
      anchorName: anchor?.name ?? "Root",
      anchorType: anchor?.type ?? -1,
    });
    setNewLocationName("");
    setAddDialogOpen(true);
  };

  const handleConfirmAdd = () => {
    const name = newLocationName.trim();
    if (!name || !addContext) return;

    if (addContext.mode === "child") {
      if (!addContext.anchorId || addContext.anchorType !== 0) {
        toast.error("Child locations must be added under a parent area");
        return;
      }
      setDrafts((prev) => [
        ...prev,
        {
          tempId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          type: 1,
          parentId: addContext.anchorId,
        },
      ]);
    } else {
      setDrafts((prev) => [
        ...prev,
        {
          tempId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          type: 0,
          parentId: null,
        },
      ]);
    }

    if (addContext.anchorId) {
      setExpanded((prev) => ({ ...prev, [addContext.anchorId!]: true }));
    }
    setAddDialogOpen(false);
    toast.success("Location added to draft — click Generate Pages to save & create pages");
  };

  const handleDiscard = () => {
    setDrafts([]);
    toast.info("Unsaved location drafts discarded");
  };

  const syncDraftLocations = async () => {
    if (!projectId || !drafts.length) return;

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const parentDrafts = drafts.filter((d) => d.type === 0);
    const existingParents = flattenNodes(savedTree).filter((n) => n.type === 0 && !n.isDraft);

    if (parentDrafts.length) {
      await httpFile.post(
        `/businessWebsite/${projectId}/locations`,
        {
          locations: [
            ...existingParents.map((p) => ({ id: p.id, areaName: p.name })),
            ...parentDrafts.map((d) => ({ areaName: d.name })),
          ],
        },
        { headers }
      );
    }

    const freshRes = await httpFile.post(
      "/getBusinessLocationHierarchy",
      { projectId, includeInactive: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const freshTree: LocationNode[] = freshRes.data?.data || [];
    const parentByName = new Map(
      flattenNodes(freshTree)
        .filter((n) => n.type === 0)
        .map((n) => [n.name.toLowerCase(), n.id])
    );

    const childDrafts = drafts.filter((d) => d.type === 1);
    if (childDrafts.length) {
      const localAreas: { areaName: string; parentId: string }[] = [];
      for (const d of childDrafts) {
        let parentId = d.parentId;
        if (parentId?.startsWith("draft-")) {
          const anchorDraft = parentDrafts.find((p) => p.tempId === parentId);
          if (anchorDraft) {
            parentId = parentByName.get(anchorDraft.name.toLowerCase()) || parentId;
          }
        }
        if (!parentId || parentId.startsWith("draft-")) continue;
        localAreas.push({ areaName: d.name, parentId });
      }

      if (localAreas.length) {
        const existingChildren = flattenNodes(freshTree)
          .filter((n) => n.type === 1 && !n.isDraft)
          .map((n) => ({
            id: n.id,
            areaName: n.name,
            parentId: n.parentId,
          }));

        await httpFile.post(
          `/businessWebsite/${projectId}/localAreas`,
          { localAreas: [...existingChildren, ...localAreas] },
          { headers }
        );
      }
    }
  };

  const handleGeneratePages = async () => {
    if (!projectId) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      if (drafts.length) {
        await syncDraftLocations();
        setDrafts([]);
      }

      const res = await httpFile.post(
        "/generateBusinessLocationPages",
        { projectId },
        { headers }
      );

      const data = res.data?.data;
      if (data?.newLocationCount > 0) {
        const parts = [
          `Generated pages for ${data.newLocationCount} new location(s)`,
        ];
        if (data.servicePagesCreated) {
          parts.push(`${data.servicePagesCreated} service page(s) created/updated`);
        }
        if (data.contentQueued) {
          parts.push("section content is generating in the background");
        } else if (data.contentQueueReason === "no_design_data") {
          parts.push("complete Step 6 design in the wizard to auto-generate section content");
        }
        toast.success(parts.join(" · "));
      } else {
        toast.info(res.data?.message || "No new locations needed page generation");
      }

      await fetchHierarchy();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate pages");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleLocation = async (node: LocationNode, enabled: boolean) => {
    if (!projectId || node.isDraft) return;
    setTogglingId(node.id);
    try {
      const token = localStorage.getItem("token");
      await httpFile.post(
        "/toggleBusinessLocationStatus",
        { projectId, locationId: node.id, enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedTree((prev) => {
        const update = (nodes: LocationNode[]): LocationNode[] =>
          nodes.map((n) => {
            if (n.id === node.id) {
              return { ...n, enabled, status: enabled ? 1 : 0 };
            }
            return { ...n, children: update(n.children || []) };
          });
        return update(prev);
      });
      toast.success(enabled ? "Location enabled on website" : "Location hidden from website");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update location");
    } finally {
      setTogglingId(null);
    }
  };

  const removeDraft = (tempId: string) => {
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const renderNode = (node: LocationNode, depth = 0) => {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isOpen = expanded[node.id] !== false;
    const isParent = node.type === 0;
    const enabled = node.isDraft ? true : node.enabled !== false && node.status !== 0;
    const pagesReady = Boolean(node.hasPages || node.pageGenerated);

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-colors ${
            node.isDraft
              ? "bg-amber-50/80 border-amber-200"
              : enabled
                ? "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"
                : "bg-gray-50 border-gray-200 opacity-75"
          }`}
          style={{ marginLeft: depth * 20 }}
        >
          <button
            type="button"
            className="shrink-0 p-0.5 text-gray-400 hover:text-gray-700"
            onClick={() =>
              setExpanded((prev) => ({ ...prev, [node.id]: !isOpen }))
            }
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            {hasChildren ? (
              isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="inline-block w-4" />
            )}
          </button>

          <div
            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${
              isParent ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isParent ? <Globe2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 truncate">{node.name}</span>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {isParent ? "Parent area" : "Local area"}
              </Badge>
              {node.isDraft && (
                <Badge className="bg-amber-500 text-white text-[10px]">Draft</Badge>
              )}
              {!node.isDraft && !pagesReady && node.type === 1 && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Pages pending
                </Badge>
              )}
              {!node.isDraft && pagesReady && node.type === 1 && (
                <Badge className="bg-green-600 text-white text-[10px]">Pages live</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!node.isDraft && (
              <div className="flex items-center gap-2">
                <Label htmlFor={`loc-toggle-${node.id}`} className="text-xs text-gray-500 sr-only">
                  Enable {node.name}
                </Label>
                <Switch
                  id={`loc-toggle-${node.id}`}
                  checked={enabled}
                  disabled={togglingId === node.id}
                  onCheckedChange={(checked) => handleToggleLocation(node, checked)}
                />
              </div>
            )}
            {node.isDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-red-600 hover:text-red-700"
                onClick={() => removeDraft(node.id)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isOpen && hasChildren && (
          <div className="mt-1 space-y-1">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}

        {isOpen && isParent && (
          <div style={{ marginLeft: (depth + 1) * 20 }} className="mt-1 mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs border-dashed"
              onClick={() => openAddDialog("child", node)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add local area under {node.name}
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (!projectId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Open this page from a project dashboard to manage locations.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 font-poppins">
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
              <Layers className="h-7 w-7 text-blue-600" />
              Locations
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your service areas hierarchy. Add locations, enable or disable them on the live site, and generate pages for new areas only.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasDrafts && (
            <Button type="button" variant="outline" onClick={handleDiscard} disabled={generating}>
              <XCircle className="h-4 w-4 mr-2" />
              Discard drafts
            </Button>
          )}
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleGeneratePages}
            disabled={generating || loading}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate pages
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-white/20 text-white">{pendingCount}</Badge>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-500 uppercase">Total locations</p>
            <p className="text-2xl font-bold text-gray-900">{meta.total + drafts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-amber-600 uppercase">Pending page generation</p>
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-500 uppercase">Unsaved drafts</p>
            <p className="text-2xl font-bold text-gray-900">{drafts.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Location hierarchy</CardTitle>
            <CardDescription>
              Parent areas group local service areas. Toggle off to hide a location and its pages from the website.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => openAddDialog("sibling", null)}>
            <Plus className="h-4 w-4 mr-1" />
            Add parent area
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading locations…
            </div>
          ) : displayTree.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No locations yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Add a parent service area, then add local areas underneath.
              </p>
              <Button type="button" onClick={() => openAddDialog("sibling", null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add first location
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {displayTree.map((node) => renderNode(node, 0))}
              <div className="pt-3 border-t mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-blue-600"
                  onClick={() => openAddDialog("sibling", null)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add another parent area (sibling)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addContext?.mode === "child"
                ? `Add local area under “${addContext.anchorName}”`
                : "Add parent service area"}
            </DialogTitle>
            <DialogDescription>
              {addContext?.mode === "child"
                ? "This creates a child local area under the selected parent. Pages are generated when you click Generate pages."
                : "This creates a top-level parent area. Add local areas under it afterwards."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-loc-name">Location name</Label>
            <Input
              id="new-loc-name"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder={addContext?.mode === "child" ? "e.g. Downtown, Westside" : "e.g. Austin, Dallas"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmAdd();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmAdd} disabled={!newLocationName.trim()}>
              Add to draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
