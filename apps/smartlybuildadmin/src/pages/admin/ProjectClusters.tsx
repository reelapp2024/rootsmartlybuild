import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Network,
  RefreshCw,
  ChevronRight,
  FolderTree,
  FolderOpen,
  FileText,
  Pencil,
  Eye,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { http } from "../../config.js";
import { editBlogPostPath } from "@/lib/adminProjectPaths";

type ArticleNode = {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  slug?: string;
  link?: string;
  href?: string;
  published?: boolean;
  articleCreated?: boolean;
  blogId?: string | null;
  clusterName?: string | null;
  keywordType?: string;
};

type CategoryNode = {
  id?: string;
  title?: string;
  name?: string;
  slug?: string;
  link?: string;
  href?: string;
  description?: string;
  articleCount?: number;
  childCount?: number;
  hasChildren?: boolean;
  nodeType?: string;
  children?: CategoryNode[];
  articles?: ArticleNode[];
  aggregatedArticles?: ArticleNode[];
};

type Taxonomy = {
  categories?: CategoryNode[];
  featuredArticles?: ArticleNode[];
  allArticles?: ArticleNode[];
  publishedBlogCount?: number;
};

type Crumb = {
  label: string;
  /** null = root clusters list */
  node: CategoryNode | null;
};

export default function ProjectClustersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  /** Drill path: [] = root categories; last item = current folder */
  const [stack, setStack] = useState<CategoryNode[]>([]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await http.post(
        "/pinterest/v2/getContentTaxonomy",
        { projectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data?.data || {};
      setTaxonomy({
        categories: data.categories || [],
        featuredArticles: data.featuredArticles || [],
        allArticles: data.allArticles || [],
        publishedBlogCount: data.publishedBlogCount || 0,
      });
      // Keep drill position if still valid; otherwise reset
      setStack((prev) => {
        if (!prev.length) return [];
        const roots = data.categories || [];
        const still = [];
        let pool: CategoryNode[] = roots;
        for (const node of prev) {
          const hit = pool.find((c) => c.id === node.id || c.slug === node.slug);
          if (!hit) return [];
          still.push(hit);
          pool = hit.children || [];
        }
        return still;
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load cluster hierarchy",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const roots = taxonomy?.categories || [];
  const current = stack.length ? stack[stack.length - 1] : null;

  const childCategories: CategoryNode[] = useMemo(() => {
    if (!current) return roots;
    return current.children || [];
  }, [current, roots]);

  const articles: ArticleNode[] = useMemo(() => {
    if (!current) return [];
    // Leaf: own articles. Parent with children: still show direct articles if any.
    if (current.hasChildren && (current.children || []).length) {
      return current.articles || [];
    }
    return current.articles || current.aggregatedArticles || [];
  }, [current]);

  const crumbs: Crumb[] = useMemo(() => {
    const list: Crumb[] = [{ label: "All categories", node: null }];
    for (const node of stack) {
      list.push({ label: node.title || node.name || "Category", node });
    }
    return list;
  }, [stack]);

  const openCategory = (node: CategoryNode) => {
    setStack((prev) => [...prev, node]);
  };

  const goToCrumb = (index: number) => {
    if (index <= 0) {
      setStack([]);
      return;
    }
    setStack((prev) => prev.slice(0, index));
  };

  const goBack = () => {
    setStack((prev) => prev.slice(0, -1));
  };

  const handleEdit = (article: ArticleNode) => {
    if (!article.blogId) {
      toast({
        title: "Article not generated yet",
        description: "Wait for starter blog generation to finish, then refresh.",
        variant: "destructive",
      });
      return;
    }
    navigate(editBlogPostPath(projectId, article.blogId), {
      state: { projectId, id: article.blogId },
    });
  };

  const handlePreview = (article: ArticleNode) => {
    if (article.blogId) {
      window.open(`/post/${article.blogId}`, "_blank");
      return;
    }
    const href = article.link || article.href;
    if (href) {
      window.open(href, "_blank");
      return;
    }
    toast({
      title: "Nothing to preview",
      description: "This article has not been generated yet.",
      variant: "destructive",
    });
  };

  const totalCategories = roots.length;
  const totalArticles = taxonomy?.allArticles?.length || 0;
  const publishedCount = taxonomy?.publishedBlogCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6" />
            Content Clusters
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hierarchy: Category → Subcategory → Articles. Click through to browse and edit content.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1">
          <Layers className="h-3 w-3" />
          {totalCategories} categor{totalCategories === 1 ? "y" : "ies"}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <FileText className="h-3 w-3" />
          {totalArticles} article intents
        </Badge>
        <Badge
          className={
            publishedCount
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }
        >
          {publishedCount} published
        </Badge>
      </div>

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <button
                type="button"
                disabled={isLast}
                onClick={() => goToCrumb(i)}
                className={
                  isLast
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:underline"
                }
              >
                {c.label}
              </button>
            </span>
          );
        })}
      </nav>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : roots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No clusters saved yet. Approve Content Clusters in the create wizard first.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {current && (
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="text-sm text-muted-foreground">
                Viewing{" "}
                <span className="font-medium text-foreground">
                  {current.title || current.name}
                </span>
                {current.hasChildren
                  ? ` · ${childCategories.length} subcategor${childCategories.length === 1 ? "y" : "ies"}`
                  : ` · ${articles.length} article${articles.length === 1 ? "" : "s"}`}
              </div>
            </div>
          )}

          {/* Subcategories / categories */}
          {childCategories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  {current ? "Subcategories" : "Categories (site clusters)"}
                </CardTitle>
                <CardDescription>
                  {current
                    ? "Click a subcategory to see its articles."
                    : "Click a category to open subcategories or articles."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {childCategories.map((cat) => {
                  const hasKids = Boolean(cat.hasChildren && (cat.children || []).length);
                  const count = hasKids
                    ? cat.childCount || cat.children?.length || 0
                    : cat.articleCount || cat.articles?.length || 0;
                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => openCategory(cat)}
                      className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                    >
                      <div className="mt-0.5 rounded-md bg-muted p-2">
                        {hasKids ? (
                          <FolderOpen className="h-4 w-4 text-amber-600" />
                        ) : (
                          <FolderTree className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold truncate">{cat.title || cat.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {hasKids ? "has subcategories" : "articles"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {cat.description || cat.slug || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {hasKids
                            ? `${count} subcategor${count === 1 ? "y" : "ies"}`
                            : `${count} article${count === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Articles at this level */}
          {current && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Articles
                  {current.hasChildren && articles.length === 0
                    ? " (open a subcategory)"
                    : ""}
                </CardTitle>
                <CardDescription>
                  Edit published posts or preview. Unpublished rows are still keyword intents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {articles.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    {current.hasChildren
                      ? "This category has subcategories — open one to see its articles."
                      : "No articles assigned to this category yet."}
                  </p>
                ) : (
                  articles.map((article) => {
                    const title = article.title || article.name || "Untitled";
                    const published = Boolean(article.published || article.blogId);
                    return (
                      <div
                        key={article.id || article.blogId || title}
                        className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium truncate">{title}</p>
                            {published ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                                Not generated
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {article.description || article.slug || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!article.blogId && !(article.link || article.href)}
                            onClick={() => handlePreview(article)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Preview
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!article.blogId}
                            onClick={() => handleEdit(article)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Root helper when no selection */}
          {!current && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Select a category above to drill into subcategories and articles.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
