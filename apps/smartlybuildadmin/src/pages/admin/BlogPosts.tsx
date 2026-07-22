import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Edit, Eye, Trash2, Sparkles, FileText, Search, ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import socket from "@/socket";

type ApiBlog = {
  _id: string;
  title: string;
  type: string;
  views: number;
  author?: string | null;
  status: 0 | 1 | 2;
  createdAt: string;
  updatedAt: string;
  scheduleTime?: string | null;
};

type AiBlogGenerationProgress = {
  projectId?: string;
  status?: string;
  total?: number;
  done?: number;
  failed?: number;
  pending?: number;
  percent?: number;
  parallelWorkers?: number;
  activeWorkers?: number;
  currentBlogs?: Array<{ jobId?: string; title?: string; step?: string; jobPercent?: number }>;
  recentEvents?: Array<{ at?: string; message?: string; type?: string; title?: string }>;
  message?: string;
  startedAt?: string;
  finishedAt?: string;
};

export default function BlogPosts() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateProjectId = (location.state as any)?.projectId;
  const queryProjectId = new URLSearchParams(location.search).get("projectId");
  const projectId = stateProjectId || queryProjectId || "";
  const cameFromAi = Boolean((location.state as any)?.aiBlogGenerating);

  // List state (server)
  const [posts, setPosts] = useState<ApiBlog[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // AI generation progress (sockets — same pattern as project content generation)
  const [aiGen, setAiGen] = useState<AiBlogGenerationProgress | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  // Local edit/create state
  const [currentPost, setCurrentPost] = useState<{ id: string; title: string; introduction: string; content: string } | null>(null);
  const [newPost, setNewPost] = useState({ title: "", introduction: "", content: "" });
  const [aiPostTitle, setAiPostTitle] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const BASE_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  const apiUrl = (path: string) => `${BASE_URL}/${String(path).replace(/^\/+/, "")}`;

  const mapStatus = (s: ApiBlog["status"]) => (s === 1 ? "published" : s === 2 ? "archived" : "draft");
  const statusBadgeVariant = (s: ApiBlog["status"]) =>
    s === 1 ? { variant: "default", className: "bg-green-500 text-white" } : s === 2 ? { variant: "secondary", className: "" } : { variant: "secondary", className: "" };

  const fmtDate = (value?: string | null) => {
    if (!value) return "—";
    if (/^\d+$/.test(value)) {
      const ms = Number(value) < 1e12 ? Number(value) * 1000 : Number(value);
      const d = new Date(ms);
      return isNaN(d.getTime()) ? "—" : d.toLocaleString();
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  // Fetch list (adds projectId if present)
  const fetchPosts = useCallback(async (nextPage = 1, nextLimit = 10) => {
    try {
      if (!token) {
        toast({ title: "Auth error", description: "Missing token", variant: "destructive" });
        return;
      }
      setLoading(true);

      const url = new URL(apiUrl("listBlogs"));
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("limit", String(nextLimit));
      if (projectId) url.searchParams.set("projectId", projectId);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch blogs");

      const data = json?.data || {};
      const items: ApiBlog[] = (data.items || []).map((it: any) => ({
        _id: it._id,
        title: it.title,
        type: it.type,
        views: it.views ?? 0,
        author: it.author ?? null,
        status: it.status,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        scheduleTime: it.scheduleTime ?? null,
      }));

      setPosts(items);
      setPage(Number(data.page || nextPage));
      setLimit(Number(data.limit || nextLimit));
      setPages(Number(data.pages || 1));
      setTotal(Number(data.total || 0));
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Could not load blogs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, BASE_URL, projectId]);

  const normalizeAiGen = (raw: AiBlogGenerationProgress | null): AiBlogGenerationProgress | null => {
    if (!raw) return null;
    const total = Number(raw.total || 0);
    const done = Number(raw.done || 0);
    const failed = Number(raw.failed || 0);
    const finished = done + failed;
    // Client-side safety net if API returned stale generating with full counters
    if (
      String(raw.status || "") === "generating" &&
      total > 0 &&
      finished >= total
    ) {
      return {
        ...raw,
        status: failed > 0 ? "completed_with_errors" : "completed",
        pending: 0,
        activeWorkers: 0,
        percent: 100,
        currentBlogs: [],
        finishedAt: raw.finishedAt || new Date().toISOString(),
      };
    }
    return raw;
  };

  const fetchAiProgressOnce = useCallback(async () => {
    if (!projectId || !token || !BASE_URL) return;
    try {
      const res = await fetch(apiUrl("ai_blog_generation_progress"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (res.ok && json?.data) {
        const next = normalizeAiGen(json.data as AiBlogGenerationProgress);
        setAiGen(next);
        // Refresh list when hydrate shows work already finished while user was away
        const st = String(next?.status || "");
        if (st === "completed" || st === "completed_with_errors" || st === "generating") {
          void fetchPosts(page, limit);
        }
      } else if (res.ok && json?.data === null) {
        setAiGen(null);
      }
    } catch (err) {
      console.warn("ai_blog_generation_progress failed", err);
    }
  }, [projectId, token, BASE_URL, fetchPosts, page, limit]);

  // Initial list load only
  useEffect(() => {
    if (!projectId && !token) return;
    fetchPosts(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Sockets for live progress + hydrate on mount / tab focus (no polling loop)
  useEffect(() => {
    if (!projectId) return;

    socket.emit("joinRoom", `project_${projectId}`);
    socket.emit("joinProject", projectId);

    void fetchAiProgressOnce();

    let lastDone = -1;
    const onProgress = (payload: AiBlogGenerationProgress) => {
      if (!payload) return;
      if (payload.projectId && String(payload.projectId) !== String(projectId)) return;
      const next = normalizeAiGen(payload);
      setAiGen(next);

      const status = String(next?.status || "");
      const done = Number(next?.done || 0);
      if (
        status === "completed" ||
        status === "completed_with_errors" ||
        (done > 0 && done !== lastDone)
      ) {
        lastDone = done;
        void fetchPosts(1, limit);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchAiProgressOnce();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    socket.on("aiBlogGenerationProgress", onProgress);
    return () => {
      socket.off("aiBlogGenerationProgress", onProgress);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      socket.emit("leaveRoom", `project_${projectId}`);
      socket.emit("leaveProject", projectId);
    };
    // intentionally stable: do not re-subscribe on fetch identity churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Clear one-shot navigation flag so it doesn't stick around
  useEffect(() => {
    if (!cameFromAi || !projectId) return;
    void fetchAiProgressOnce();
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: { projectId },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameFromAi, projectId]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) => p.title.toLowerCase().includes(q) || (p.type || "").toLowerCase().includes(q) || (p.author || "").toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const genStatus = String(aiGen?.status || "idle");
  const isGenerating = genStatus === "generating";
  const isComplete =
    genStatus === "completed" || genStatus === "completed_with_errors";
  const genTotal = Number(aiGen?.total || 0);
  const genDone = Number(aiGen?.done || 0);
  const genFailed = Number(aiGen?.failed || 0);
  const genPending = Number(
    aiGen?.pending ?? Math.max(0, genTotal - genDone - genFailed)
  );
  const genPercent = Number(aiGen?.percent || (isComplete ? 100 : 0));
  // Banner: always while generating; finished only if completed in last 45 min (or just arrived from AI wizard)
  const finishedAtMs = aiGen?.finishedAt ? Date.parse(aiGen.finishedAt) : NaN;
  const finishedRecently =
    Number.isFinite(finishedAtMs) && Date.now() - finishedAtMs < 45 * 60 * 1000;
  const showAiBanner = Boolean(
    projectId && (isGenerating || (isComplete && (finishedRecently || cameFromAi)))
  );

  // AI
  const handleAIPost = () => {
    setAiPostTitle("");
    setIsAIDialogOpen(true);
  };

  const handleGenerateAIPost = async () => {
    if (!aiPostTitle.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      return;
    }
    // Call your AI create endpoint here and then refresh
    toast({ title: "Generating…", description: "Call your AI create endpoint here." });
    setIsAIDialogOpen(false);
  };

  // Edit
// Edit -> go to /admin/edit-post and pass the blog id (and projectId for context)
const handleEditPost = (p: ApiBlog) => {
  navigate(`/admin/edit-post?id=${p._id}`, { state: { projectId } });
};


  const handleUpdatePost = async () => {
    if (!currentPost) return;
    // Call your update API here, then refresh
    setIsEditDialogOpen(false);
    toast({ title: "Updated", description: "Post updated (refresh list)" });
    fetchPosts(page, limit);
  };

  const handleDeletePost = async (id: string) => {
    // Call delete API then refresh
    toast({ title: "Deleted", description: "Post removed (refresh list)" });
    fetchPosts(page, limit);
  };

  // Pagination
  const handlePrev = () => {
    if (page <= 1) return;
    fetchPosts(page - 1, limit);
  };
  const handleNext = () => {
    if (page >= pages) return;
    fetchPosts(page + 1, limit);
  };
  const handleLimitChange = (val: number) => {
    setLimit(val);
    fetchPosts(1, val);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">
            {projectId ? "Showing blogs for selected project" : "Create and manage your blog posts (server list with pagination)"}
          </p>
        </div>

        {/* TOP BUTTONS */}
        <div className="flex gap-2">
          {/* Add Manual Blog -> navigate */}
          <Button
            onClick={() => navigate("/admin/create-post", { state: { projectId } })}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Add Manual Blog
          </Button>


          {/* AI Generated Blogs -> open dialog */}
        {/* AI Generated Blogs -> go to new page */}
<Button
  onClick={() => navigate("/admin/create-post-ai", { state: { projectId } })}
  variant="outline"
  className="flex items-center gap-2"
>
  <Sparkles className="h-4 w-4" />
  AI Generated Blogs
</Button>

        </div>
      </div>

      {/* AI blog generation progress (sockets only — no polling) */}
      {showAiBanner ? (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
                  AI blog generation in progress
                </>
              ) : isComplete ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  AI blog generation finished
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  AI blog generation
                </>
              )}
            </CardTitle>
            <CardDescription>
              {aiGen?.message ||
                (isGenerating
                  ? "Generating rich article content in the background…"
                  : "Latest batch status")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {genDone}/{genTotal || "—"} done
                {genFailed ? ` · ${genFailed} failed` : ""}
                {genPending ? ` · ${genPending} left` : ""}
                {aiGen?.parallelWorkers
                  ? ` · ${aiGen.activeWorkers || 0}/${aiGen.parallelWorkers} workers`
                  : ""}
              </span>
              <span className="font-semibold">{genPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isComplete ? "bg-green-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.max(isGenerating ? 2 : 0, genPercent)}%` }}
              />
            </div>
            {Array.isArray(aiGen?.currentBlogs) && aiGen!.currentBlogs!.length > 0 ? (
              <ul className="text-xs text-muted-foreground space-y-1 max-h-28 overflow-y-auto">
                {aiGen!.currentBlogs!.slice(0, 6).map((b, i) => (
                  <li key={`${b.jobId || i}-${b.title}`} className="truncate">
                    <span className="font-medium text-foreground/80">{b.title || "Blog"}</span>
                    {b.step ? ` — ${b.step}` : ""}
                    {typeof b.jobPercent === "number" ? ` (${b.jobPercent}%)` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            {Array.isArray(aiGen?.recentEvents) && aiGen!.recentEvents!.length > 0 ? (
              <div className="text-[11px] text-muted-foreground border-t pt-2 space-y-0.5 max-h-24 overflow-y-auto">
                {aiGen!.recentEvents!.slice(0, 8).map((ev, i) => (
                  <div key={`${ev.at || i}-${ev.message}`} className="truncate">
                    {ev.message || ev.type}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Search + page size */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by title / type / author…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* List (Table) */}
      <Card>
        <CardHeader>
          <CardTitle>Blogs</CardTitle>
          <CardDescription>
            Fetched from {BASE_URL}/listBlogs{projectId ? `?projectId=${projectId}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">Loading…</TableCell>
                </TableRow>
              ) : filteredPosts.length ? (
                filteredPosts.map((p) => {
                  const badge = statusBadgeVariant(p.status);
                  return (
                    <TableRow key={p._id}>
                      <TableCell className="max-w-[360px] truncate">{p.title}</TableCell>
                      <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={badge.variant as any} className={badge.className}>{mapStatus(p.status)}</Badge>
                      </TableCell>
                      <TableCell>{p.author || "—"}</TableCell>
                      <TableCell>{p.views ?? 0}</TableCell>
                      <TableCell>{fmtDate(p.createdAt)}</TableCell>
                      <TableCell>{fmtDate(p.scheduleTime || null)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(`/post/${p._id}`, "_blank")}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditPost(p)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeletePost(p._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">No posts found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Page {page} of {pages} · Total {total}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext} disabled={page >= pages}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>Update your blog post</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-introduction">Introduction</Label>
              <Textarea id="edit-introduction" value={newPost.introduction} onChange={(e) => setNewPost({ ...newPost, introduction: e.target.value })} rows={3} />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea id="edit-content" value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows={10} className="font-mono" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdatePost}>Update Post</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Dialog */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate AI Blog Post</DialogTitle>
            <DialogDescription>Enter a title and let AI generate the content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-title">Post Title</Label>
              <Input id="ai-title" value={aiPostTitle} onChange={(e) => setAiPostTitle(e.target.value)} placeholder="Enter topic…" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerateAIPost} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
