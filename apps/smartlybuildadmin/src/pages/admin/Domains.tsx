// src/pages/DomainsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Search, RefreshCcw, Plus, Copy, Trash2, Globe, Link2, CheckCircle2, AlertTriangle } from "lucide-react";
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

// ================== Types ==================

type ApiDomainResult = {
  ok: boolean;
  domain: string;
  status: "pending" | "verified" | "connected_to_our_server" | "verification_failed" | string;
  method?: "dns-txt" | "nameserver_or_ip" | string;
  skipped?: string[];
  details?: any;
  verificationDetails?: any;
  lastVerifiedAt?: string;
  action?: "create-dns-txt";
  instructions?: {
    type: "TXT";
    recommended_host?: string;
    fallback_host?: string;
    host?: string;
    value?: string;
    ttl?: number;
    note?: string;
  };
  dnsToken?: string; // we return this from API on pending TXT
  usedDnsToken?: string; // we return this from API on success TXT
};

type AddVerificationOptions = {
  nameservers: string[];
  a_records: { type: "A" | "CNAME"; host: string; value: string; ttl: number }[];
  dns_txt: {
    recommended_host: string;
    fallback_host: string;
    type: "TXT";
    value: string;
    ttl: number;
  };
};

// ================== Helpers (cache) ==================

type DomainsCachePayload = {
  page: number;
  limit: number;
  pages: number;
  total: number;
  results: ApiDomainResult[];
  fetchedAt: number; // epoch ms
};

function cacheKey(page: number, limit: number) {
  return `domainsCache:${page}:${limit}`;
}

function loadFromCache(page: number, limit: number): DomainsCachePayload | null {
  try {
    const raw = localStorage.getItem(cacheKey(page, limit));
    if (!raw) return null;
    return JSON.parse(raw) as DomainsCachePayload;
  } catch {
    return null;
  }
}

function saveToCache(payload: DomainsCachePayload) {
  try {
    localStorage.setItem(cacheKey(payload.page, payload.limit), JSON.stringify(payload));
  } catch {}
}

export default function DomainsPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const BASE = (import.meta as any).env?.VITE_API_URL ;
 
  const [domains, setDomains] = useState<ApiDomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // last updated (from cache or network)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // add form
  const [domainName, setDomainName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addOpts, setAddOpts] = useState<AddVerificationOptions | null>(null);
  const [addedDomain, setAddedDomain] = useState<string | null>(null);

  // search (client-side on current page)
  const [query, setQuery] = useState("");

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return domains;
    const q = query.toLowerCase();
    return domains.filter((d) => d.domain.toLowerCase().includes(q) || (d.method || "").toLowerCase().includes(q) || (d.status || "").toLowerCase().includes(q));
  }, [domains, query]);

  function statusBadgeVariant(s?: string) {
    switch (s) {
      case "verified":
        return { variant: "default" as const, className: "bg-emerald-600 hover:bg-emerald-600 text-white" };
      case "connected_to_our_server":
        return { variant: "default" as const, className: "bg-blue-600 hover:bg-blue-600 text-white" };
      case "verification_failed":
        return { variant: "secondary" as const, className: "bg-red-100 text-red-700" };
      default:
        return { variant: "secondary" as const, className: "" }; // pending / unknown
    }
  }

  const fmtDate = (val?: string) => (val ? new Date(val).toLocaleString() : "—");

  // ================== Data Fetching with Cache ==================

  async function fetchAllStatuses(nextPage = page, nextLimit = limit, opts: { background?: boolean } = {}) {
    const { background = false } = opts;
    if (!token) {
      toast({ title: "Auth error", description: "Missing token", variant: "destructive" });
      return;
    }

    if (!background) setLoading(true);
    try {
      const url = `${BASE}domains/verify?page=${nextPage}&limit=${nextLimit}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load domains");

      const list: ApiDomainResult[] = json?.results || [];
      setDomains(list);
      const newPage = Number(json?.page || nextPage);
      const newLimit = Number(json?.limit || nextLimit);
      const newPages = Number(json?.pages || 1);
      const newTotal = Number(json?.total || 0);
      setPage(newPage);
      setLimit(newLimit);
      setPages(newPages);
      setTotal(newTotal);

      const fetchedAt = Date.now();
      setLastUpdated(fetchedAt);
      saveToCache({ page: newPage, limit: newLimit, pages: newPages, total: newTotal, results: list, fetchedAt });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not fetch domains", variant: "destructive" });
    } finally {
      if (!background) setLoading(false);
    }
  }

  // Merge an updated row and persist to cache
  function mergeAndPersist(updated: ApiDomainResult[]) {
    setDomains((prev) => {
      const map = new Map(prev.map((r) => [r.domain, r]));
      updated.forEach((r) => map.set(r.domain, { ...map.get(r.domain), ...r }));
      const next = Array.from(map.values());
      // persist into the current page cache snapshot
      const fetchedAt = Date.now();
      setLastUpdated(fetchedAt);
      saveToCache({ page, limit, pages, total, results: next, fetchedAt });
      return next;
    });
  }

  async function addDomain() {
    if (!token) {
      toast({ title: "Auth error", description: "Missing token", variant: "destructive" });
      return;
    }
    if (!domainName.trim()) return;
    setAdding(true);
    try {
      const fd = new FormData();
      fd.append("domainName", domainName.trim());

      const res = await fetch(`${BASE}domains`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || json?.message || "Failed to add domain");

      const opts: AddVerificationOptions | undefined = json?.verification_options;
      setAddOpts(opts || null);
      setAddedDomain(domainName.trim());

      const tokenValue =
        opts?.dns_txt?.value ||
        json?.txt_instructions?.value ||
        json?.txt_instructions?.recordValue;

      if (tokenValue) {
        try {
          await navigator.clipboard.writeText(tokenValue);
          toast({ title: "Domain added", description: "TXT token copied to clipboard." });
        } catch {
          toast({ title: "Domain added", description: "Use any method below to verify." });
        }
      } else {
        toast({ title: "Domain added", description: "Use any method below to verify." });
      }

      setDomainName("");
      // After add, reload first page so the new domain is easy to find (do visible load)
      await fetchAllStatuses(1, limit);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not add domain", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function refreshOne(domain: string) {
    if (!token) {
      toast({ title: "Auth error", description: "Missing token", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const fd = new FormData();
      fd.append("domainName", domain);

      const res = await fetch(`${BASE}domains/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to verify");
      const result: ApiDomainResult[] = json?.results || [];

      mergeAndPersist(result);

      const r = result[0];
      if (r?.ok) {
        toast({ title: "Verification updated", description: `${r.domain} → ${r.status}` });
      } 
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not refresh status", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  }

  const handleDeleteClick = (domain: string) => {
    setDomainToDelete(domain);
    setShowDeleteDialog(true);
  };

  async function removeOne(domain: string) {
    if (!token) {
      toast({ title: "Auth error", description: "Missing token", variant: "destructive" });
      return;
    }

    try {
      // Use query param (some proxies drop DELETE bodies)
      const url = `${BASE}deleteDomain?domainName=${encodeURIComponent(domain)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || json?.message || "Failed to remove domain");

      toast({ title: "Domain removed", description: domain });
      setShowDeleteDialog(false);
      setDomainToDelete(null);
      // Re-fetch current page to keep pagination counters accurate (visible load)
      await fetchAllStatuses(page, limit);
      // Clear guide if the removed domain was the last added
      if (addedDomain === domain) {
        setAddedDomain(null);
        setAddOpts(null);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not remove domain", variant: "destructive" });
    }
  }

  // On mount: hydrate from cache immediately, then fetch latest in background
  useEffect(() => {
    const cached = loadFromCache(1, limit);
    if (cached && cached.results?.length) {
      setDomains(cached.results);
      setPage(cached.page);
      setLimit(cached.limit);
      setPages(cached.pages);
      setTotal(cached.total);
      setLastUpdated(cached.fetchedAt);
      // Do not show a loading spinner when we have cached data
      fetchAllStatuses(cached.page, cached.limit, { background: true });
    } else {
      // No cache — do a visible load
      fetchAllStatuses(1, limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastUpdatedText = lastUpdated ? new Date(lastUpdated).toLocaleString() : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Domains</h1>
          <p className="text-sm text-muted-foreground mt-1">Add a domain and verify via Nameservers, A records (IP), or DNS-TXT.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            {React.createElement(Search as any, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" })}
            <Input
              placeholder="Search domains…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" onClick={() => fetchAllStatuses(page, limit)} disabled={loading || verifying}>
            {React.createElement(RefreshCcw as any, { className: "h-4 w-4 mr-2" })}
            Refresh page
          </Button>
        </div>
      </div>

      {/* Add domain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Domain</CardTitle>
          <CardDescription className="text-sm">We'll return all verification options. You can use any method.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="e.g. best-smm.in or www.example.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
            />
            <Button onClick={addDomain} disabled={adding}>
              {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
              {adding ? "Adding…" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simple guide + options after add */}
      {addOpts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to connect {addedDomain}</CardTitle>
            <CardDescription className="text-sm">Pick any one method below, then click "Refresh status".</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="nameservers" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="nameservers" className="flex items-center space-x-2">
                  {React.createElement(Globe as any, { className: "h-4 w-4" })}
                  <span>Nameservers</span>
                </TabsTrigger>
                <TabsTrigger value="arecords" className="flex items-center space-x-2">
                  {React.createElement(Link2 as any, { className: "h-4 w-4" })}
                  <span>A Records</span>
                </TabsTrigger>
                <TabsTrigger value="dnstxt" className="flex items-center space-x-2">
                  {React.createElement(CheckCircle2 as any, { className: "h-4 w-4" })}
                  <span>DNS-TXT</span>
                </TabsTrigger>
              </TabsList>

              {/* Nameservers Tab */}
              <TabsContent value="nameservers" className="mt-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-base mb-3 flex items-center space-x-2">
                    {React.createElement(Globe as any, { className: "h-4 w-4 text-blue-600" })}
                    <span>Option 1: Use our Nameservers</span>
                  </h4>
                  <ol className="text-xs list-decimal ml-4 space-y-1.5 mb-3 text-gray-700">
                    <li>Go to your domain registrar.</li>
                    <li>Find "Change Nameservers" or "DNS Settings".</li>
                    <li>Replace both nameservers with:</li>
                  </ol>
                  <div className="bg-white border rounded-lg p-3 space-y-2">
                    {addOpts.nameservers.map((ns, index) => (
                      <div key={ns} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-500 w-6">NS{index + 1}</span>
                          <code className="text-xs font-mono text-gray-900">{ns}</code>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={async () => { 
                            await navigator.clipboard.writeText(ns); 
                            toast({ title: "Copied", description: ns }); 
                          }}
                          className="ml-2 h-7 text-xs px-2"
                        >
                          {React.createElement(Copy as any, { className: "h-3 w-3 mr-1" })}
                          Copy
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Propagation can take from a few minutes up to several hours depending on your registrar.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* A Records Tab */}
              <TabsContent value="arecords" className="mt-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-base mb-3 flex items-center space-x-2">
                    {React.createElement(Link2 as any, { className: "h-4 w-4 text-purple-600" })}
                    <span>Option 2: Point A Records</span>
                  </h4>
                  <ol className="text-xs list-decimal ml-4 space-y-1.5 mb-3 text-gray-700">
                    <li>Open your DNS (zone) editor in your domain registrar or hosting provider.</li>
                    <li>Add or update these A records:</li>
                  </ol>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-900 text-xs">Type</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-900 text-xs">Host</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-900 text-xs">Value</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-900 text-xs">TTL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addOpts.a_records.map((r, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">{r.type}</td>
                            <td className="px-3 py-2">
                              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{r.host}</code>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center space-x-1.5">
                                <code className="font-mono text-xs">{r.value}</code>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={async () => { 
                                    await navigator.clipboard.writeText(r.value); 
                                    toast({ title: "Copied", description: r.value }); 
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  {React.createElement(Copy as any, { className: "h-3 w-3" })}
                                </Button>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs">{r.ttl}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-800">
                      <strong>Tip:</strong> Use CNAME <code className="bg-purple-100 px-1 rounded text-xs">www → @</code> if you prefer.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* DNS-TXT Tab */}
              <TabsContent value="dnstxt" className="mt-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-base mb-3 flex items-center space-x-2">
                    {React.createElement(CheckCircle2 as any, { className: "h-4 w-4 text-green-600" })}
                    <span>Option 3: DNS-TXT (Ownership Verification)</span>
                  </h4>
                  <ol className="text-xs list-decimal ml-4 space-y-1.5 mb-3 text-gray-700">
                    <li>In your DNS editor, add a TXT record with the following details:</li>
                  </ol>
                  <div className="bg-white border rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Host</label>
                        <div className="p-2 bg-gray-50 rounded border">
                          <code className="text-xs font-mono">{addOpts.dns_txt.recommended_host}</code>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                        <div className="p-2 bg-gray-50 rounded border">
                          <code className="text-xs font-mono">{addOpts.dns_txt.type}</code>
                        </div>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Value (TXT Record)</label>
                        <div className="p-2 bg-gray-50 rounded border flex items-center justify-between">
                          <code className="text-xs font-mono break-all flex-1">{addOpts.dns_txt.value}</code>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={async () => { 
                              await navigator.clipboard.writeText(addOpts.dns_txt.value); 
                              toast({ title: "Copied TXT", description: addOpts.dns_txt.value }); 
                            }}
                            className="ml-2 h-7 text-xs px-2"
                          >
                            {React.createElement(Copy as any, { className: "h-3 w-3 mr-1" })}
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">TTL</label>
                        <div className="p-2 bg-gray-50 rounded border">
                          <code className="text-xs font-mono">{addOpts.dns_txt.ttl}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-semibold text-green-800 mb-1.5">Important Notes:</p>
                      <ul className="text-xs text-green-700 list-disc ml-4 space-y-0.5">
                        <li>If your UI shows the domain automatically, enter only <code className="bg-green-100 px-1 rounded text-xs">_hosting-verify</code> as Host.</li>
                        <li>Avoid setting TXT on <code className="bg-green-100 px-1 rounded text-xs">www</code> if it's a CNAME record.</li>
                        <li>Wait ~10–15 minutes after adding, then click "Refresh status" to verify.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Domains list */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                {React.createElement(Globe as any, { className: "h-5 w-5 text-gray-600" })}
                <span>Domains List</span>
                {total > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {total} {total === 1 ? 'domain' : 'domains'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Manage and verify your domains
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-900 text-sm">Domain</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">Method</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">TXT Token</TableHead>
                <TableHead className="font-semibold text-gray-900 text-sm">Last Checked</TableHead>
                <TableHead className="text-right font-semibold text-gray-900 text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {React.createElement(RefreshCcw as any, { className: "h-8 w-8 text-gray-400 animate-spin" })}
                      <p className="text-sm text-gray-500">Loading domains…</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {React.createElement(Globe as any, { className: "h-12 w-12 text-gray-300" })}
                      <p className="text-sm font-medium text-gray-500">No domains found</p>
                      <p className="text-xs text-gray-400">Add your first domain to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => {
                  const badge = statusBadgeVariant(d.status);
                  const tokenInRow =
                    d?.dnsToken ||
                    d?.verificationDetails?.dnsToken ||
                    d?.instructions?.value ||
                    d?.usedDnsToken;

                  return (
                    <TableRow key={d.domain} className="hover:bg-gray-50 transition-colors border-b">
                      <TableCell className="font-semibold py-3">
                        <div className="flex items-center space-x-2">
                          {React.createElement(Globe as any, { className: "h-4 w-4 text-gray-400 flex-shrink-0" })}
                          <span className="text-gray-900">{d.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={badge.variant} className={`${badge.className} text-xs`}>
                          {d.status === "connected_to_our_server" ? "Connected" : d.status === "verified" ? "Verified" : d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3 text-sm text-gray-600">
                        {d.method || <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="max-w-[280px] py-3">
                        {tokenInRow ? (
                          <div className="flex items-center gap-2">
                            <code className="truncate text-xs bg-gray-100 px-2 py-1 rounded font-mono">{tokenInRow}</code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(tokenInRow);
                                  toast({ title: "TXT token copied", description: tokenInRow });
                                } catch {}
                              }}
                              title="Copy TXT token"
                              className="h-7 w-7 p-0"
                            >
                              {React.createElement(Copy as any, { className: "h-3.5 w-3.5" })}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm py-3">{fmtDate(d.lastVerifiedAt)}</TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refreshOne(d.domain)}
                            disabled={verifying}
                            title="Verify domain status"
                            className="h-8 text-xs border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                          >
                            {React.createElement(RefreshCcw as any, { className: `h-3.5 w-3.5 ${verifying ? 'animate-spin' : ''}` })}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(d.domain)}
                            title="Remove domain"
                            className="h-8 text-xs border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          >
                            {React.createElement(Trash2 as any, { className: "h-3.5 w-3.5" })}
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

        {/* Pagination controls */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Page {page} of {pages}</span>
              <span className="mx-2">·</span>
              <span>Total: <span className="font-semibold">{total}</span> {total === 1 ? 'domain' : 'domains'}</span>
              {lastUpdated && (
                <>
                  <span className="mx-2">·</span>
                  <span className="text-xs text-gray-500">Updated: {lastUpdatedText}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prev = Math.max(1, page - 1);
                  // Try hydrate from cache for target page, then background refresh
                  const cached = loadFromCache(prev, limit);
                  if (cached && cached.results?.length) {
                    setDomains(cached.results);
                    setPage(cached.page);
                    setPages(cached.pages);
                    setTotal(cached.total);
                    setLastUpdated(cached.fetchedAt);
                    fetchAllStatuses(prev, limit, { background: true });
                  } else {
                    fetchAllStatuses(prev, limit);
                  }
                }}
                disabled={page <= 1 || loading}
              >
                Prev
              </Button>
              <select
                className="flex h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={limit}
                onChange={(e) => {
                  const nextLimit = Number(e.target.value);
                  // When limit changes, default to page 1 and try cache first
                  const cached = loadFromCache(1, nextLimit);
                  if (cached && cached.results?.length) {
                    setDomains(cached.results);
                    setPage(cached.page);
                    setLimit(cached.limit);
                    setPages(cached.pages);
                    setTotal(cached.total);
                    setLastUpdated(cached.fetchedAt);
                    fetchAllStatuses(1, nextLimit, { background: true });
                  } else {
                    fetchAllStatuses(1, nextLimit);
                  }
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nxt = Math.min(pages, page + 1);
                  const cached = loadFromCache(nxt, limit);
                  if (cached && cached.results?.length) {
                    setDomains(cached.results);
                    setPage(cached.page);
                    setPages(cached.pages);
                    setTotal(cached.total);
                    setLastUpdated(cached.fetchedAt);
                    fetchAllStatuses(nxt, limit, { background: true });
                  } else {
                    fetchAllStatuses(nxt, limit);
                  }
                }}
                disabled={page >= pages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 rounded-xl bg-red-100">
                {React.createElement(AlertTriangle as any, { className: "h-6 w-6 text-red-600" })}
              </div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                Delete Domain
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600 mt-2 text-base">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{domainToDelete}</span>? This action cannot be undone and will permanently remove the domain from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 border-t border-gray-200 mt-4">
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setDomainToDelete(null);
              }}
              className="h-11 px-6 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => domainToDelete && removeOne(domainToDelete)}
              className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
