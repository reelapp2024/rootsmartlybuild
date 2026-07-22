import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { http } from "@/config";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import socket from "@/socket";

interface Blog {
  _id: string;
  title: string;
  type: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  content?: string;
}

interface FakeReviewFormData {
  count: string;
  exampleNames: string;
}

type FakeReviewsProgress = {
  blogId?: string;
  blogTitle?: string;
  status?: string;
  total?: number;
  done?: number;
  failed?: number;
  pending?: number;
  percent?: number;
  parallelWorkers?: number;
  activeWorkers?: number;
  message?: string;
  startedAt?: string;
  finishedAt?: string;
  recentEvents?: Array<{ at?: string; message?: string; type?: string }>;
};

function decodeJwtUserId(token: string | null): string {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return String(payload?.userId || payload?.id || payload?._id || "").trim();
  } catch {
    return "";
  }
}

export function FakeReviewsManagement() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FakeReviewFormData>({
    count: "5",
    exampleNames: "",
  });
  const [submitting, setSubmitting] = useState(false);
  /** blogId → live progress */
  const [progressByBlog, setProgressByBlog] = useState<Record<string, FakeReviewsProgress>>({});

  const limit = 10;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userId = useMemo(() => decodeJwtUserId(token), [token]);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await http.get("/listBlogs", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit },
      });

      if (response.data && response.data.data) {
        setBlogs(response.data.data.items || []);
        setTotalPages(response.data.data.pages || 1);
      } else {
        toast.error("Failed to fetch blogs");
      }
    } catch (error: any) {
      console.error("Error fetching blogs:", error);
      toast.error(error.response?.data?.message || "Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, token]);

  useEffect(() => {
    void fetchBlogs();
  }, [fetchBlogs]);

  const hydrateProgress = useCallback(
    async (blogId: string) => {
      if (!blogId || !token) return;
      try {
        const res = await http.post(
          "/fake_reviews_generation_progress",
          { blogId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.data) {
          setProgressByBlog((prev) => ({
            ...prev,
            [blogId]: res.data.data as FakeReviewsProgress,
          }));
        }
      } catch (err) {
        console.warn("fake_reviews_generation_progress failed", err);
      }
    },
    [token]
  );

  // Sockets + hydrate active/recent generations for visible blogs
  useEffect(() => {
    if (!userId) return;
    socket.emit("joinRoom", `user_${userId}`);

    const onProgress = (payload: FakeReviewsProgress) => {
      if (!payload?.blogId) return;
      setProgressByBlog((prev) => ({
        ...prev,
        [String(payload.blogId)]: payload,
      }));
      const st = String(payload.status || "");
      if (st === "completed" || st === "completed_with_errors") {
        toast.success(
          payload.message ||
            `Reviews ready: ${payload.done || 0}/${payload.total || 0}`
        );
      }
    };

    socket.on("fakeReviewsGenerationProgress", onProgress);
    return () => {
      socket.off("fakeReviewsGenerationProgress", onProgress);
      socket.emit("leaveRoom", `user_${userId}`);
    };
  }, [userId]);

  // Join blog rooms + hydrate when list loads
  useEffect(() => {
    if (!blogs.length) return;
    for (const b of blogs) {
      socket.emit("joinRoom", `blog_${b._id}`);
      void hydrateProgress(b._id);
    }
    return () => {
      for (const b of blogs) {
        socket.emit("leaveRoom", `blog_${b._id}`);
      }
    };
  }, [blogs, hydrateProgress]);

  const handleGenerateReviews = (blog: Blog) => {
    setSelectedBlog(blog);
    setFormData({ count: "5", exampleNames: "" });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBlog || !formData.count) {
      toast.error("Please enter how many reviews to generate");
      return;
    }

    const countNum = Number(formData.count);
    if (!Number.isFinite(countNum) || countNum < 1 || countNum > 50) {
      toast.error("Count must be between 1 and 50");
      return;
    }

    try {
      setSubmitting(true);
      // JSON body — avoid multipart Content-Type without boundary
      const response = await http.post(
        "/add_fake_reviews",
        {
          blogId: selectedBlog._id,
          count: countNum,
          exampleNames: formData.exampleNames || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );

      const ok =
        response.status === 202 ||
        response.data?.success === true ||
        Boolean(response.data?.jobIds?.length) ||
        Boolean(response.data?.progress);

      if (ok) {
        const progress = response.data?.progress as FakeReviewsProgress | undefined;
        if (progress) {
          setProgressByBlog((prev) => ({
            ...prev,
            [selectedBlog._id]: progress,
          }));
        }
        toast.success(
          response.data?.message ||
            `Queued ${countNum} reviews — generating in the background`
        );
        setIsDialogOpen(false);
        setFormData({ count: "5", exampleNames: "" });
        socket.emit("joinRoom", `blog_${selectedBlog._id}`);
        void hydrateProgress(selectedBlog._id);
        setSelectedBlog(null);
      } else {
        toast.error(response.data?.message || "Failed to queue review generation");
      }
    } catch (error: any) {
      console.error("Error generating reviews:", error);
      toast.error(error.response?.data?.message || "Failed to generate reviews");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FakeReviewFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const activeGenerations = useMemo(() => {
    return Object.values(progressByBlog).filter(
      (p) =>
        p &&
        (p.status === "generating" ||
          ((p.status === "completed" || p.status === "completed_with_errors") &&
            p.finishedAt &&
            Date.now() - Date.parse(p.finishedAt) < 10 * 60 * 1000))
    );
  }, [progressByBlog]);

  if (loading && blogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Fake Reviews</h1>
        <p className="text-muted-foreground mt-2">
          Queue AI reviews in Redis — multiple workers generate in parallel with live progress
        </p>
      </div>

      {/* Live generation status */}
      {activeGenerations.length > 0 ? (
        <div className="space-y-3">
          {activeGenerations.map((gen) => {
            const isGenerating = gen.status === "generating";
            const isComplete =
              gen.status === "completed" || gen.status === "completed_with_errors";
            const done = Number(gen.done || 0);
            const failed = Number(gen.failed || 0);
            const total = Number(gen.total || 0);
            const pending = Number(
              gen.pending ?? Math.max(0, total - done - failed)
            );
            const percent = Number(
              gen.percent || (isComplete ? 100 : total ? Math.round(((done + failed) / total) * 100) : 0)
            );
            return (
              <Card
                key={gen.blogId || gen.blogTitle}
                className={
                  isGenerating
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-green-200 bg-green-50/30"
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {isGenerating ? "Generating reviews" : "Reviews generation finished"}
                    {gen.blogTitle ? (
                      <span className="font-normal text-muted-foreground truncate">
                        — {gen.blogTitle}
                      </span>
                    ) : null}
                  </CardTitle>
                  <CardDescription>
                    {gen.message ||
                      (isGenerating
                        ? "Workers are creating reviews in the background…"
                        : "Batch complete")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {done}/{total || "—"} done
                      {failed ? ` · ${failed} failed` : ""}
                      {pending ? ` · ${pending} left` : ""}
                      {gen.parallelWorkers
                        ? ` · ${gen.activeWorkers || 0}/${gen.parallelWorkers} workers`
                        : ""}
                    </span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isComplete ? "bg-green-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.max(isGenerating ? 2 : 0, percent)}%` }}
                    />
                  </div>
                  {Array.isArray(gen.recentEvents) && gen.recentEvents.length > 0 ? (
                    <div className="text-[11px] text-muted-foreground border-t pt-2 space-y-0.5 max-h-24 overflow-y-auto">
                      {gen.recentEvents.slice(0, 8).map((ev, i) => (
                        <div key={`${ev.at || i}-${ev.message}`} className="truncate">
                          {ev.message || ev.type}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-4">
        {blogs.map((blog) => {
          const gen = progressByBlog[blog._id];
          const isGenerating = gen?.status === "generating";
          return (
            <Card key={blog._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">{blog.title}</CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={blog.status === 1 ? "default" : "secondary"}>
                      {blog.status === 1
                        ? "Published"
                        : blog.status === 0
                          ? "Draft"
                          : "Archived"}
                    </Badge>
                    {isGenerating ? (
                      <Badge variant="outline" className="gap-1 border-amber-300 text-amber-800">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {gen?.done || 0}/{gen?.total || "—"}
                      </Badge>
                    ) : null}

                    <Dialog
                      open={isDialogOpen && selectedBlog?._id === blog._id}
                      onOpenChange={setIsDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => handleGenerateReviews(blog)}
                          size="sm"
                          className="gap-2"
                          disabled={isGenerating}
                        >
                          <Plus className="h-4 w-4" />
                          {isGenerating ? "Generating…" : "Generate Reviews"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Generate Fake Reviews
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="blogTitle">Selected Blog</Label>
                            <Input
                              id="blogTitle"
                              value={selectedBlog?.title || ""}
                              disabled
                              className="bg-muted"
                            />
                          </div>

                          <div>
                            <Label htmlFor="count">Count *</Label>
                            <Input
                              id="count"
                              type="number"
                              min="1"
                              max="50"
                              placeholder="e.g. 10"
                              value={formData.count}
                              onChange={(e) => handleInputChange("count", e.target.value)}
                              required
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Runs in Redis with parallel workers (background)
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="exampleNames">Example Names (optional)</Label>
                            <Textarea
                              id="exampleNames"
                              placeholder="John Doe, Jane Smith, Mike Johnson"
                              value={formData.exampleNames}
                              onChange={(e) => handleInputChange("exampleNames", e.target.value)}
                              rows={3}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Comma-separated. Defaults used if empty.
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDialogOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="flex-1">
                              {submitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Queuing…
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Start Generation
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {blog.content
                    ? blog.content.replace(/<[^>]*>/g, "").substring(0, 150) + "..."
                    : "No description available"}
                </p>

                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Created: {new Date(blog.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(blog.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {blogs.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No blogs found.</p>
        </div>
      )}
    </div>
  );
}
