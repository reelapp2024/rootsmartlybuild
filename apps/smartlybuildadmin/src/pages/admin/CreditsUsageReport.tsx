import { useEffect, useMemo, useState } from "react";
import { httpFile } from "../../config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type UsageRow = {
  serialNo: number;
  projectId: string;
  projectName: string;
  name: string;
  usageTypeLabel: string;
  transactionType: "credit" | "debit";
  creditUsage: number;
  creditsLeft: number;
  totalCredits: number;
  promptFrom: string;
  promptFor: string;
  inputTokens: number;
  outputTokens: number;
  imagesCount: number;
  status: number;
  createdAt: string | null;
  pricing?: number;
  totalCredits?: number;
  transactionId?: string;
  subscriptionPurchaseId?: string;
};

export default function CreditsUsageReport() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [canViewUserName, setCanViewUserName] = useState(false);
  const [search, setSearch] = useState("");
  const [usageType, setUsageType] = useState<string>("");
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [pageActionLoading, setPageActionLoading] = useState<"prev" | "next" | "search" | null>(null);

  const statusBadge = useMemo(
    () => ({
      1: "bg-green-100 text-green-800",
      0: "bg-red-100 text-red-800",
    }),
    []
  );

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/getCreditsUsageReport",
        {
          page,
          limit,
          search,
          usageType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRows(res.data?.data || []);
      setTotalPages(res.data?.meta?.totalPages || 1);
      setCanViewUserName(Boolean(res.data?.meta?.canViewUserName));
    } catch (e) {
      console.error("Failed to fetch credits usage report:", e);
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setPageActionLoading(null);
    }
  };

  useEffect(() => {
    setExpandedRowKey(null);
    fetchReport();
  }, [page, usageType]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  const formatAmount = (value: number) => {
    const n = Number(value || 0);
    return n.toFixed(3).replace(/\.?0+$/, "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credits Usage Report</h1>
          <p className="text-sm text-gray-500">
            Per-user and per-project credits usage details
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search by project, user, prompt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={usageType}
          onChange={(e) => {
            setPageActionLoading("search");
            setUsageType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-md bg-white"
        >
          <option value="">All Types</option>
          <option value="0">OpenAI</option>
          <option value="1">FreePik</option>
          <option value="2">Images</option>
          <option value="3">Other</option>
        </select>
        <Button onClick={() => { setPageActionLoading("search"); setPage(1); fetchReport(); }} disabled={loading}>
          {pageActionLoading === "search" ? "Loading..." : "Search"}
        </Button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr No</TableHead>
              <TableHead>Project ID</TableHead>
              <TableHead>Project Name</TableHead>
              {canViewUserName && <TableHead>User Name</TableHead>}
              <TableHead>Credit Usage</TableHead>
              <TableHead>Credits Left</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canViewUserName ? 7 : 6} className="text-center py-8 text-gray-500">
                  {loading ? "Loading..." : "No usage entries found"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const rowKey = `${r.projectId}-${r.serialNo}-${r.createdAt || "na"}`;
                const isExpanded = expandedRowKey === rowKey;
                return [
                    <TableRow key={rowKey}>
                      <TableCell>{r.serialNo}</TableCell>
                      <TableCell>{r.projectId}</TableCell>
                      <TableCell>{r.projectName}</TableCell>
                      {canViewUserName && <TableCell>{r.name}</TableCell>}
                      <TableCell className={r.transactionType === "credit" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {r.transactionType === "credit" ? "+" : "-"}
                        {formatAmount(Number(r.creditUsage || 0))}
                      </TableCell>
                      <TableCell>{formatAmount(Number(r.creditsLeft || 0))}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedRowKey(isExpanded ? null : rowKey)}
                        >
                          {isExpanded ? "Hide" : "View More"}
                        </Button>
                      </TableCell>
                    </TableRow>,
                    isExpanded ? (
                      <TableRow key={`${rowKey}-details`}>
                        <TableCell colSpan={canViewUserName ? 7 : 6} className="bg-slate-50">
                          <div className="grid grid-cols-2 gap-3 text-sm p-2">
                            <div><span className="font-medium">Usage Type:</span> {r.usageTypeLabel}</div>
                            <div><span className="font-medium">Txn Type:</span> {r.transactionType}</div>
                            <div><span className="font-medium">Credit Usage:</span> {formatAmount(Number(r.creditUsage || 0))}</div>
                            <div><span className="font-medium">Credits Left:</span> {formatAmount(Number(r.creditsLeft || 0))}</div>
                            <div><span className="font-medium">Prompt From:</span> {r.promptFrom}</div>
                            <div><span className="font-medium">Prompt For:</span> {r.promptFor}</div>
                            <div><span className="font-medium">Input Tokens:</span> {r.inputTokens}</div>
                            <div><span className="font-medium">Output Tokens:</span> {r.outputTokens}</div>
                            <div><span className="font-medium">Images Count:</span> {r.imagesCount}</div>
                            <div><span className="font-medium">Transaction ID:</span> {r.transactionId || "-"}</div>
                            <div><span className="font-medium">Purchase Entry ID:</span> {r.subscriptionPurchaseId || "-"}</div>
                            <div><span className="font-medium">Status:</span> <Badge className={statusBadge[r.status as 0 | 1] || "bg-gray-100 text-gray-800"}>{r.status === 1 ? "Success" : "Failed"}</Badge></div>
                            <div><span className="font-medium">Created At:</span> {formatDate(r.createdAt)}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null
                ];
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => {
              setPageActionLoading("prev");
              setPage((p) => p - 1);
            }}
          >
            {pageActionLoading === "prev" ? "Loading..." : "Prev"}
          </Button>
          <Button
            variant="outline"
            disabled={loading || page >= totalPages}
            onClick={() => {
              setPageActionLoading("next");
              setPage((p) => p + 1);
            }}
          >
            {pageActionLoading === "next" ? "Loading..." : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

