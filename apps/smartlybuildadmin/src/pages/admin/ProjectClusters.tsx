import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Network, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { http } from "../../config.js";

type Supporting = { primaryKeyword?: string; keywordId?: string };
type InternalLink = { from?: string; to?: string; relation?: string };

type ProjectCluster = {
  _id: string;
  clusterName?: string;
  clusterSlug?: string;
  pillarKeyword?: string;
  supportingKeywords?: Supporting[];
  publishOrder?: string[];
  internalLinks?: InternalLink[];
  approved?: boolean;
  status?: string;
};

export default function ProjectClustersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<ProjectCluster[]>([]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await http.post(
        "/pinterest/v2/listProjectClusters",
        { projectId, status: "active" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClusters(res.data?.data?.clusters || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load clusters",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6" />
            Content Clusters
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Silo map for this site — 1 pillar + supporting articles and internal-link relationships.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : clusters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No clusters saved yet. Approve Content Clusters in the create wizard, or re-run
            `/pinterest/v2/runContentClusters` with this projectId.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clusters.map((cluster) => {
            const supporting = (cluster.supportingKeywords || [])
              .map((s) => (typeof s === "string" ? s : s.primaryKeyword))
              .filter(Boolean) as string[];
            return (
              <Card key={cluster._id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">{cluster.clusterName}</CardTitle>
                    <div className="flex gap-1.5">
                      {cluster.approved && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Approved</Badge>
                      )}
                      <Badge variant="secondary">{1 + supporting.length} articles</Badge>
                    </div>
                  </div>
                  <CardDescription>Slug: {cluster.clusterSlug || "—"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Pillar
                    </p>
                    <p className="font-medium">{cluster.pillarKeyword}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Supporting
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {supporting.length ? (
                        supporting.map((s) => (
                          <Badge key={s} variant="outline" className="font-normal">
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Publish order</p>
                      <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-0.5">
                        {(cluster.publishOrder || [cluster.pillarKeyword, ...supporting])
                          .filter(Boolean)
                          .map((p) => (
                            <li key={`${cluster._id}-order-${p}`}>{p}</li>
                          ))}
                      </ol>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Internal links ({cluster.internalLinks?.length || 0})
                      </p>
                      <div className="max-h-36 overflow-y-auto text-[11px] text-muted-foreground space-y-0.5">
                        {(cluster.internalLinks || []).slice(0, 20).map((link, i) => (
                          <div key={`${cluster._id}-link-${i}`}>
                            {link.from} → {link.to}{" "}
                            <span className="opacity-60">({link.relation})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
