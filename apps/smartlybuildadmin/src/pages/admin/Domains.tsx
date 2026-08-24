import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCcw,
  Plus,
  Copy,
  Trash2,
  Globe,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DomainRow,
  DomainVerificationOptions,
  addDomain as apiAddDomain,
  deleteDomain as apiDeleteDomain,
  domainStatusBadge,
  listDomains,
  normalizeDomainInput,
  verifyDomain as apiVerifyDomain,
} from "@/api/domainsApi";

function CopyButton({ value, label }: { value: string; label?: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-xs px-2"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast({ title: "Copied", description: label || value });
        } catch {
          toast({ title: "Copy failed", variant: "destructive" });
        }
      }}
    >
      <Copy className="h-3 w-3 mr-1" />
      Copy
    </Button>
  );
}

function VerificationGuide({
  domain,
  options,
}: {
  domain: string;
  options: DomainVerificationOptions;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">How to connect {domain}</CardTitle>
        <CardDescription className="text-sm">
          Pick <strong>any one</strong> method, wait a few minutes for DNS, then click{" "}
          <strong>Verify</strong> on that domain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nameservers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nameservers" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Nameservers
            </TabsTrigger>
            <TabsTrigger value="arecords" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              A Records
            </TabsTrigger>
            <TabsTrigger value="dnstxt" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              DNS-TXT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nameservers" className="mt-4">
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <p className="text-sm text-gray-700">
                At your registrar, set both nameservers to ours:
              </p>
              <div className="bg-white border rounded-lg p-3 space-y-2">
                {options.nameservers.map((ns, index) => (
                  <div
                    key={ns}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-gray-500">NS{index + 1}</span>
                      <code className="text-xs font-mono truncate">{ns}</code>
                    </div>
                    <CopyButton value={ns} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded p-2">
                Propagation can take a few minutes up to several hours.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="arecords" className="mt-4">
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <p className="text-sm text-gray-700">
                Point these A records to our server IP (keep your current nameservers):
              </p>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Host</th>
                      <th className="px-3 py-2 text-left">Value</th>
                      <th className="px-3 py-2 text-left">TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.a_records.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-medium">{r.type}</td>
                        <td className="px-3 py-2">
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded">{r.host}</code>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <code className="font-mono">{r.value}</code>
                            <CopyButton value={r.value} />
                          </div>
                        </td>
                        <td className="px-3 py-2">{r.ttl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dnstxt" className="mt-4">
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <p className="text-sm text-gray-700">
                Add this TXT record to prove you own the domain (site can stay on current hosting):
              </p>
              <div className="bg-white border rounded-lg p-3 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Host</div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded border">
                    <code className="text-xs font-mono break-all">
                      {options.dns_txt.recommended_host}
                    </code>
                    <CopyButton value="_hosting-verify" label="_hosting-verify" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    If your DNS UI already shows the domain, enter only{" "}
                    <code className="bg-gray-100 px-1 rounded">_hosting-verify</code>.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Value</div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded border">
                    <code className="text-xs font-mono break-all flex-1">
                      {options.dns_txt.value}
                    </code>
                    <CopyButton value={options.dns_txt.value} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [domainName, setDomainName] = useState("");
  const [adding, setAdding] = useState(false);
  const [guideDomain, setGuideDomain] = useState<string | null>(null);
  const [guideOpts, setGuideOpts] = useState<DomainVerificationOptions | null>(null);

  const [query, setQuery] = useState("");
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return domains;
    const q = query.toLowerCase();
    return domains.filter(
      (d) =>
        d.domain.toLowerCase().includes(q) ||
        (d.method || "").toLowerCase().includes(q) ||
        (d.status || "").toLowerCase().includes(q) ||
        (d.statusLabel || "").toLowerCase().includes(q)
    );
  }, [domains, query]);

  const fmtDate = (val?: string | null) => (val ? new Date(val).toLocaleString() : "—");

  const fetchList = useCallback(
    async (nextPage = page, nextLimit = limit) => {
      setLoading(true);
      try {
        const data = await listDomains({ page: nextPage, limit: nextLimit });
        setDomains(data.results);
        setPage(data.page);
        setLimit(data.limit);
        setPages(data.pages);
        setTotal(data.total);
      } catch (e: any) {
        toast({
          title: "Could not load domains",
          description: e?.response?.data?.error || e?.message || "Try again",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchList(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showGuideFor = (row: DomainRow) => {
    const opts = row.verification_options;
    if (!opts) {
      toast({
        title: "No setup needed",
        description: "This domain is already verified or connected.",
      });
      return;
    }
    setGuideDomain(row.domain);
    setGuideOpts(opts);
  };

  async function handleAdd() {
    const clean = normalizeDomainInput(domainName);
    if (!clean) {
      toast({
        title: "Enter a domain",
        description: "Example: example.com (no https://)",
        variant: "destructive",
      });
      return;
    }
    setAdding(true);
    try {
      const data = await apiAddDomain(clean);
      const opts = data.verification_options || null;
      setGuideOpts(opts);
      setGuideDomain(clean);
      if (opts?.dns_txt?.value) {
        try {
          await navigator.clipboard.writeText(opts.dns_txt.value);
          toast({
            title: "Domain added",
            description: "TXT token copied. Follow any method below, then Verify.",
          });
        } catch {
          toast({
            title: "Domain added",
            description: data.message || "Follow a verification method, then click Verify.",
          });
        }
      } else {
        toast({
          title: "Domain added",
          description: data.message || "Ready to verify.",
        });
      }
      setDomainName("");
      await fetchList(1, limit);
    } catch (e: any) {
      toast({
        title: "Could not add domain",
        description: e?.response?.data?.error || e?.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(domain: string, force = false) {
    setVerifyingDomain(domain);
    try {
      const row = await apiVerifyDomain(domain, force);
      setDomains((prev) => {
        const map = new Map(prev.map((r) => [r.domain, r]));
        map.set(row.domain, { ...map.get(row.domain), ...row });
        return Array.from(map.values());
      });
      if (row.ok) {
        toast({
          title: "Success",
          description: row.message || `${row.domain} is ${row.statusLabel || row.status}`,
        });
        if (guideDomain === domain) {
          setGuideDomain(null);
          setGuideOpts(null);
        }
      } else {
        toast({
          title: "Still pending",
          description: row.message || "DNS not updated yet. Wait a bit and try again.",
        });
        if (row.verification_options) {
          setGuideDomain(row.domain);
          setGuideOpts(row.verification_options);
        }
      }
    } catch (e: any) {
      toast({
        title: "Verify failed",
        description: e?.response?.data?.error || e?.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setVerifyingDomain(null);
    }
  }

  async function handleDelete() {
    if (!domainToDelete) return;
    try {
      await apiDeleteDomain(domainToDelete);
      toast({ title: "Domain removed", description: domainToDelete });
      if (guideDomain === domainToDelete) {
        setGuideDomain(null);
        setGuideOpts(null);
      }
      setShowDeleteDialog(false);
      setDomainToDelete(null);
      await fetchList(page, limit);
    } catch (e: any) {
      toast({
        title: "Could not remove domain",
        description: e?.response?.data?.error || e?.message || "Try again",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Domains</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add a domain, connect it with Nameservers, A records, or DNS-TXT, then verify — use it on
            Deploy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search domains…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" onClick={() => fetchList(page, limit)} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Domain</CardTitle>
          <CardDescription className="text-sm">
            Enter the apex domain (example.com). www is optional — we normalize it automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="e.g. example.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button onClick={handleAdd} disabled={adding}>
              <Plus className="h-4 w-4 mr-2" />
              {adding ? "Adding…" : "Add domain"}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            After adding, complete one DNS method below, wait a few minutes, then click Verify.
          </p>
        </CardContent>
      </Card>

      {guideOpts && guideDomain ? (
        <VerificationGuide domain={guideDomain} options={guideOpts} />
      ) : null}

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-600" />
            Your domains
            {total > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {total}
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription className="text-sm">
            Pending domains need DNS setup. Verified / Connected domains are ready for deploy.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Last checked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      Loading domains…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <Globe className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">No domains yet</p>
                      <p className="text-xs text-gray-400">Add your first domain above</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d) => {
                    const badge = domainStatusBadge(d.status);
                    const busy = verifyingDomain === d.domain;
                    const needsSetup =
                      d.status === "pending" || d.status === "verification_failed";
                    return (
                      <TableRow key={d.id || d.domain} className="hover:bg-gray-50">
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                            <span>{d.domain}</span>
                          </div>
                          {needsSetup && d.message ? (
                            <p className="text-xs text-amber-700 mt-1 max-w-md leading-snug">
                              {d.message}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${badge.className} text-xs`}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {d.method === "dns-txt"
                            ? "DNS-TXT"
                            : d.method === "nameserver_or_ip"
                              ? "NS / A record"
                              : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {fmtDate(d.lastVerifiedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {needsSetup ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => showGuideFor(d)}
                              >
                                Setup
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              disabled={!!verifyingDomain}
                              onClick={() => handleVerify(d.domain, !needsSetup)}
                              title="Check DNS now"
                            >
                              <RefreshCcw
                                className={`h-3.5 w-3.5 mr-1 ${busy ? "animate-spin" : ""}`}
                              />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs hover:text-red-600"
                              onClick={() => {
                                setDomainToDelete(d.domain);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <div className="px-6 py-4 border-t bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Page {page} of {pages} · {total} domain{total === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => fetchList(page - 1, limit)}
            >
              Prev
            </Button>
            <select
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={limit}
              onChange={(e) => fetchList(1, Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages || loading}
              onClick={() => fetchList(page + 1, limit)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete domain?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Remove <span className="font-semibold text-gray-900">{domainToDelete}</span> from your
              account? Projects using it will need another domain for deploy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setDomainToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
