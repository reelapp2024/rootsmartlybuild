import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { http } from "../../config.js";

type ProjectKeywordRow = {
  _id: string;
  primaryKeyword?: string;
  relatedKeywords?: string[];
  faqKeywords?: string[];
  pinterestKeywords?: string[];
  seasonalKeywords?: string[];
  keywordType?: string;
  volume?: string | null;
  trend?: string | null;
  pinterestDemand?: string | null;
  competition?: string | null;
  clusterId?: string | null;
  articleCreated?: boolean;
  status?: string;
};

export default function ProjectKeywordsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProjectKeywordRow[]>([]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await http.post(
        "/pinterest/v2/listProjectKeywords",
        { projectId, status: "active" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRows(res.data?.data?.keywords || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load keywords",
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
            <Search className="h-6 w-6" />
            Keyword Database
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Master search intents for this content website. Clusters and articles read from here.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search intents</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${rows.length} unique search intents`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No keywords saved yet. Run Keyword Engine during create, or re-run it with this projectId.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Primary</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Related</TableHead>
                    <TableHead>FAQs</TableHead>
                    <TableHead>Pinterest</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Comp</TableHead>
                    <TableHead>Cluster</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell className="font-medium">{row.primaryKeyword}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {row.keywordType || "main"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                        {(row.relatedKeywords || []).slice(0, 3).join(", ") || "—"}
                        {(row.relatedKeywords || []).length > 3 ? "…" : ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(row.faqKeywords || []).length || 0}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(row.pinterestKeywords || []).length || 0}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{row.volume || "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{row.trend || "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{row.competition || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {row.clusterId ? (
                          <Badge variant="secondary" className="text-[10px]">Assigned</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
