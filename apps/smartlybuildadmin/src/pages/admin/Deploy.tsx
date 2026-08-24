import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { httpFile } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import socket from '@/socket';
import {
  Rocket,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  FolderOpen,
  Server,
  Globe,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  Cloud,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HostingConnection,
  getMyHostings,
  browseHostingDirectories,
  linkProjectToHosting,
  setCurrentHostingForProject,
  canBrowseHosting,
  defaultRootPathForHosting,
  formatHostingSummary,
  hostingTypeLabel,
  hostingCategory,
} from '@/api/newHostingApi';
import {
  DomainRow,
  DomainConflict,
  listDomains,
  checkDomainForProject,
  normalizeDomainInput,
  domainStatusBadge,
} from '@/api/domainsApi';
import { AddHostingDialog } from '@/components/admin/AddHostingDialog';

type DeployTarget = 'ours' | 'theirs';
type BuildMode = 'static' | 'node';
type DeployStatus =
  | 'idle'
  | 'checking'
  | 'connecting'
  | 'building'
  | 'uploading'
  | 'success'
  | 'failed';

type DirItem = { name: string; fullPath: string };

const WEBROOT_BASE = '/var/www/ai';

function defaultOurWebroot(domain: string) {
  return `${WEBROOT_BASE}/${normalizeDomainInput(domain)}`;
}

/** What build modes a connection can run. */
function hostingBuildSupport(type: string): { static: boolean; advanced: boolean; label: string } {
  const t = String(type || '').toLowerCase();
  if (t === 'ssh' || t === 'vps') {
    return {
      static: true,
      advanced: true,
      label: 'Static + Advanced (Node)',
    };
  }
  // ftp, cpanel, and shared-style connections
  return {
    static: true,
    advanced: false,
    label: 'Static only',
  };
}

const Deploy = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();

  const [projectName, setProjectName] = useState('Project');
  const [pageLoading, setPageLoading] = useState(true);

  const [target, setTarget] = useState<DeployTarget>('ours');
  const [buildMode, setBuildMode] = useState<BuildMode>('static');

  const [domainRows, setDomainRows] = useState<DomainRow[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('');

  const [hostings, setHostings] = useState<HostingConnection[]>([]);
  const [hostingsLoading, setHostingsLoading] = useState(false);
  const [selectedHosting, setSelectedHosting] = useState<HostingConnection | null>(null);
  const [rootPath, setRootPath] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);
  const [directories, setDirectories] = useState<DirItem[]>([]);
  const [browsePath, setBrowsePath] = useState('');
  const [browseLoading, setBrowseLoading] = useState(false);

  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [artifactPath, setArtifactPath] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [projectDeploymentId, setProjectDeploymentId] = useState<string | null>(null);

  const [conflict, setConflict] = useState<DomainConflict | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const lastNotified = useRef('');

  const ourHosting = useMemo(
    () => hostings.find((h) => h.isOur === true || h.connectionType === 'vps') || null,
    [hostings]
  );

  const theirHostings = useMemo(
    () => hostings.filter((h) => !h.isOur && h.status === 'success'),
    [hostings]
  );

  const selectedDomainRow = useMemo(
    () => domainRows.find((d) => d.domain === selectedDomain) || null,
    [domainRows, selectedDomain]
  );

  const domainUsedElsewhere = useMemo(() => {
    const used = selectedDomainRow?.usedBy;
    if (!used || !projectId) return null;
    if (String(used.projectId) === String(projectId)) return null;
    return used;
  }, [selectedDomainRow, projectId]);

  const nodeAllowed = useMemo(() => {
    if (target === 'ours') return true;
    if (!selectedHosting) return false;
    return hostingCategory(selectedHosting.connectionType) === 'advanced';
  }, [target, selectedHosting]);

  const loadDomains = useCallback(async () => {
    setDomainsLoading(true);
    try {
      const data = await listDomains({ page: 1, limit: 100 });
      setDomainRows(data.results);
      setSelectedDomain((prev) => {
        if (prev) return prev;
        if (data.results.length === 1) return data.results[0].domain;
        return prev;
      });
    } catch (e: any) {
      toast({
        title: 'Could not load domains',
        description: e?.message || 'Try again',
        variant: 'destructive',
      });
    } finally {
      setDomainsLoading(false);
    }
  }, [toast]);

  const loadHostings = useCallback(async () => {
    setHostingsLoading(true);
    try {
      const list = await getMyHostings();
      setHostings(list);
      return list;
    } catch (e: any) {
      toast({
        title: 'Could not load hostings',
        description: e?.message || 'Try again',
        variant: 'destructive',
      });
      return [];
    } finally {
      setHostingsLoading(false);
    }
  }, [toast]);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setPageLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const { data } = await httpFile.post(
        '/getProject',
        { projectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const p = data?.data;
      if (p?.projectName) setProjectName(p.projectName);
      if (p?.domainName) {
        setSelectedDomain(normalizeDomainInput(p.domainName));
      }
      if (p?.hostingId) {
        // will match after hostings load
      }
    } catch {
      /* optional */
    } finally {
      setPageLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadDomains();
    loadHostings();
  }, [loadProject, loadDomains, loadHostings]);

  useEffect(() => {
    if (target === 'ours' && ourHosting) {
      setSelectedHosting(ourHosting);
      if (selectedDomain) setRootPath(defaultOurWebroot(selectedDomain));
    }
  }, [target, ourHosting, selectedDomain]);

  useEffect(() => {
    if (buildMode === 'node' && !nodeAllowed) {
      setBuildMode('static');
    }
  }, [buildMode, nodeAllowed]);

  // Socket + poll for deploy status
  useEffect(() => {
    if (!projectId) return;
    try {
      socket.emit('joinProject', projectId);
    } catch {
      /* ignore */
    }

    const onStatus = (payload: {
      projectId?: string;
      status?: string;
      artifactPath?: string;
      error?: string;
      message?: string;
    }) => {
      if (!payload || payload.projectId !== projectId) return;
      const s = String(payload.status || '').toLowerCase();
      if (payload.artifactPath) setArtifactPath(String(payload.artifactPath));
      if (payload.message) setStatusMessage(String(payload.message));

      if (s === 'building' || s === 'queued') {
        setDeployStatus('building');
        setBusy(true);
      } else if (s === 'uploading') {
        setDeployStatus('uploading');
        setBusy(true);
      } else if (s === 'success') {
        setDeployStatus('success');
        setBusy(false);
        if (lastNotified.current !== 'success') {
          lastNotified.current = 'success';
          toast({ title: 'Deploy complete', description: 'Site uploaded successfully.' });
        }
      } else if (s === 'build_failed' || s === 'upload_failed') {
        setDeployStatus('failed');
        setBusy(false);
        setStatusMessage(payload.error || payload.message || 'Deploy failed');
        if (lastNotified.current !== s) {
          lastNotified.current = s;
          toast({
            title: 'Deploy failed',
            description: payload.error || payload.message || 'See details below',
            variant: 'destructive',
          });
        }
      }
    };

    socket.on('projectStatusUpdate', onStatus);
    return () => {
      try {
        socket.emit('leaveProject', projectId);
      } catch {
        /* ignore */
      }
      socket.off('projectStatusUpdate', onStatus);
    };
  }, [projectId, toast]);

  useEffect(() => {
    if (!busy) {
      setElapsedSec(0);
      lastNotified.current = '';
      return;
    }
    const t0 = Date.now();
    const id = window.setInterval(() => setElapsedSec(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [busy]);

  const browseDirs = async (hostingId: string, path: string) => {
    setBrowseLoading(true);
    try {
      const dirs = await browseHostingDirectories(hostingId, path);
      setDirectories(dirs);
      setBrowsePath(path);
    } catch (e: any) {
      toast({
        title: 'Browse failed',
        description: e?.message || 'Could not list folders',
        variant: 'destructive',
      });
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleSelectTheirHosting = async (hosting: HostingConnection) => {
    setSelectedHosting(hosting);
    setRootPath(defaultRootPathForHosting(hosting.connectionType));
    const support = hostingBuildSupport(hosting.connectionType);
    // Shared hosting → static only; SSH/VPS keep current choice or default static
    if (!support.advanced) {
      setBuildMode('static');
    }
    if (canBrowseHosting(hosting.connectionType)) {
      setBrowseOpen(true);
      await browseDirs(hosting._id, '');
    } else {
      setBrowseOpen(false);
    }
  };

  const handleTargetChange = (next: DeployTarget) => {
    setTarget(next);
    if (next === 'ours') {
      setSelectedHosting(ourHosting);
      setBrowseOpen(false);
      if (selectedDomain) setRootPath(defaultOurWebroot(selectedDomain));
    } else {
      setSelectedHosting(null);
      setRootPath('');
      setBuildMode('static');
    }
  };

  const ensureDeploymentLink = async (
    hostingId: string,
    domain: string,
    path: string
  ): Promise<string> => {
    const response = await linkProjectToHosting({
      hostingId,
      projectId: projectId!,
      domainName: domain,
      rootPath: path,
    });
    const id =
      response?.data?.data?._id ||
      response?.data?._id ||
      response?.data?.data?.id ||
      null;
    if (!id) {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('projectId', projectId!);
      fd.append('hostingId', hostingId);
      const { data } = await httpFile.post('/getProjectDeploymentId', fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found =
        data?.data?.projectDeploymentId ||
        data?.data?._id ||
        data?.projectDeploymentId;
      if (!found) throw new Error('Could not create project deployment link');
      return String(found);
    }
    return String(id);
  };

  const runDeploy = async (opts?: { skipConflictCheck?: boolean }) => {
    if (!projectId) return;
    const domain = normalizeDomainInput(selectedDomain);
    if (!domain) {
      toast({
        title: 'Pick a domain',
        description: 'Select a domain from your Domains list.',
        variant: 'destructive',
      });
      return;
    }

    if (target === 'theirs' && !selectedHosting) {
      toast({
        title: 'Pick hosting',
        description: 'Select or add a hosting connection.',
        variant: 'destructive',
      });
      return;
    }

    if (target === 'ours' && !ourHosting) {
      toast({
        title: 'Our hosting not found',
        description: 'No SmartlyBuild VPS hosting is linked to your account yet.',
        variant: 'destructive',
      });
      return;
    }

    if (buildMode === 'node' && !nodeAllowed) {
      toast({
        title: 'Node needs Advanced hosting',
        description: 'Use Our hosting or an SSH/VPS connection for Node builds.',
        variant: 'destructive',
      });
      return;
    }

    const hosting = target === 'ours' ? ourHosting! : selectedHosting!;
    const path =
      target === 'ours'
        ? defaultOurWebroot(domain)
        : rootPath.trim() || defaultRootPathForHosting(hosting.connectionType);

    try {
      setBusy(true);
      setDeployStatus('checking');
      setStatusMessage('Checking domain availability…');
      setArtifactPath(null);

      if (!opts?.skipConflictCheck) {
        try {
          await checkDomainForProject(domain, projectId);
        } catch (e: any) {
          if (e?.conflict) {
            setConflict(e.conflict);
            setConflictOpen(true);
            setBusy(false);
            setDeployStatus('idle');
            return;
          }
          throw e;
        }
      }

      setDeployStatus('connecting');
      setStatusMessage('Linking domain and hosting…');

      if (target === 'ours') {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('domainName', domain);
        await httpFile.post('/connectDomain', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await setCurrentHostingForProject({ projectId, hostingId: hosting._id });
      const depId = await ensureDeploymentLink(hosting._id, domain, path);
      setProjectDeploymentId(depId);
      setRootPath(path);

      setDeployStatus('building');
      setStatusMessage(
        buildMode === 'node'
          ? 'Building site (Advanced / Node-ready package)…'
          : 'Building static SiteNextJS export…'
      );

      // Today both modes produce the static export artifact and upload it.
      // Node mode is reserved for SSH/VPS targets (same upload path until SSR pipeline ships).
      const token = localStorage.getItem('token');
      const uploadFd = new FormData();
      uploadFd.append('projectDeploymentId', depId);
      uploadFd.append('projectId', projectId);
      uploadFd.append('domainName', domain);
      uploadFd.append('buildMode', buildMode);

      await httpFile.post('/uploadToHostingFromBuild', uploadFd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: 'Deploy started',
        description:
          buildMode === 'static'
            ? 'Static build + upload in progress (1–3 min).'
            : 'Advanced build + upload to your server in progress.',
      });
    } catch (e: any) {
      setBusy(false);
      setDeployStatus('failed');
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Deploy failed';
      setStatusMessage(msg);
      toast({ title: 'Deploy failed', description: msg, variant: 'destructive' });
    }
  };

  const handleUnlinkAndContinue = async () => {
    if (!conflict || !projectId) return;
    try {
      setBusy(true);
      const token = localStorage.getItem('token');
      const otherId =
        conflict.options?.unlink?.requiredParams?.projectId ||
        conflict.existingProject?.projectId;
      const formData = new FormData();
      formData.append('projectId', String(otherId));
      formData.append('domainName', conflict.domain);
      await httpFile.post('/unlinkDomain', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: 'Domain unlinked',
        description: `Removed from ${conflict.existingProject.projectName}. Continuing deploy…`,
      });
      setConflictOpen(false);
      setConflict(null);
      await loadDomains();
      await runDeploy({ skipConflictCheck: true });
    } catch (e: any) {
      setBusy(false);
      toast({
        title: 'Unlink failed',
        description: e?.response?.data?.error || e?.message || 'Try again',
        variant: 'destructive',
      });
    }
  };

  if (pageLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deploy — {projectName}</h1>
        <p className="text-gray-600 mt-1">
          1) Where to host → 2) Hosting or build type → 3) Domain → Deploy.
        </p>
      </div>

      {/* 1. Target */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            1. Where to deploy
          </CardTitle>
          <CardDescription>Our managed servers, or hosting credentials you connected.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTargetChange('ours')}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              target === 'ours'
                ? 'border-blue-600 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="font-semibold text-gray-900">Our hosting</div>
            <p className="text-sm text-gray-600 mt-1">
              SmartlyBuild VPS — next you choose Static or Advanced build.
            </p>
            {ourHosting ? (
              <Badge className="mt-2 bg-emerald-100 text-emerald-800">Ready</Badge>
            ) : (
              <Badge className="mt-2 bg-amber-100 text-amber-800">Not linked</Badge>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTargetChange('theirs')}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              target === 'theirs'
                ? 'border-blue-600 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="font-semibold text-gray-900">Their hosting</div>
            <p className="text-sm text-gray-600 mt-1">
              Next: pick which of their connections to use (Static vs Advanced shown).
            </p>
            <Badge className="mt-2" variant="secondary">
              {theirHostings.length} connection{theirHostings.length === 1 ? '' : 's'}
            </Badge>
          </button>
        </CardContent>
      </Card>

      {/* 2a. Their hosting selection */}
      {target === 'theirs' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                2. Choose their hosting
              </CardTitle>
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/hosting"
                  className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Hosting page
                </Link>
                <AddHostingDialog onHostingAdded={loadHostings} />
              </div>
            </div>
            <CardDescription>
              Each connection shows what it supports. FTP/cPanel = Static only. SSH/VPS = Static +
              Advanced.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hostingsLoading ? (
              <p className="text-sm text-gray-500">Loading hostings…</p>
            ) : theirHostings.length === 0 ? (
              <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 space-y-2">
                <p>No personal hosting connections yet. Add FTP/cPanel/SSH first.</p>
                <AddHostingDialog onHostingAdded={loadHostings} />
              </div>
            ) : (
              <div className="space-y-2">
                {theirHostings.map((h) => {
                  const selected = selectedHosting?._id === h._id;
                  const support = hostingBuildSupport(h.connectionType);
                  return (
                    <button
                      key={h._id}
                      type="button"
                      onClick={() => handleSelectTheirHosting(h)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium flex flex-wrap items-center gap-2">
                            <span>{hostingTypeLabel(h.connectionType)}</span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                support.advanced
                                  ? 'bg-violet-100 text-violet-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {support.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 font-mono mt-1 truncate">
                            {formatHostingSummary(h.connectionConfig, h.connectionType)}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">Static</Badge>
                            {support.advanced ? (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Advanced (Node)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                No Advanced
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedHosting && hostingBuildSupport(selectedHosting.connectionType).advanced ? (
              <div className="space-y-2 pt-2 border-t">
                <Label>Build type for this hosting</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBuildMode('static')}
                    className={`text-left p-3 rounded-lg border-2 ${
                      buildMode === 'static' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">Static</div>
                    <p className="text-xs text-gray-600 mt-0.5">HTML export — recommended</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuildMode('node')}
                    className={`text-left p-3 rounded-lg border-2 ${
                      buildMode === 'node' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">Advanced (Node)</div>
                    <p className="text-xs text-gray-600 mt-0.5">SSH/VPS Node-ready package</p>
                  </button>
                </div>
              </div>
            ) : selectedHosting ? (
              <p className="text-xs text-gray-600 bg-slate-50 border rounded-md p-2">
                This hosting supports <strong>Static</strong> builds only. Build type is set to
                Static.
              </p>
            ) : null}

            {selectedHosting ? (
              <div className="space-y-2">
                <Label>Upload path *</Label>
                <div className="flex gap-2">
                  <Input
                    value={rootPath}
                    onChange={(e) => setRootPath(e.target.value)}
                    placeholder={defaultRootPathForHosting(selectedHosting.connectionType)}
                  />
                  {canBrowseHosting(selectedHosting.connectionType) ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setBrowseOpen(true);
                        browseDirs(selectedHosting._id, browsePath || '');
                      }}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Browse
                    </Button>
                  ) : null}
                </div>

                {browseOpen && canBrowseHosting(selectedHosting.connectionType) ? (
                  <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 font-mono truncate">
                        {browsePath || '/'}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const parent = browsePath
                            .split('/')
                            .filter(Boolean)
                            .slice(0, -1)
                            .join('/');
                          browseDirs(selectedHosting._id, parent ? `/${parent}` : '');
                        }}
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        Up
                      </Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded bg-white">
                      {browseLoading ? (
                        <p className="p-3 text-sm text-center text-gray-500">Loading…</p>
                      ) : directories.length === 0 ? (
                        <p className="p-3 text-sm text-center text-gray-500">No subfolders</p>
                      ) : (
                        directories.map((d) => (
                          <button
                            key={d.fullPath}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 border-b last:border-0"
                            onClick={() => browseDirs(selectedHosting._id, d.fullPath)}
                          >
                            <FolderOpen className="h-4 w-4 text-gray-400" />
                            {d.name}
                          </button>
                        ))
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setRootPath(browsePath || '/');
                        setBrowseOpen(false);
                        toast({ title: 'Path selected', description: browsePath || '/' });
                      }}
                    >
                      Use this path
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* 2b. Our hosting → build type */}
      {target === 'ours' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-600" />
              2. Choose build type
            </CardTitle>
            <CardDescription>
              On our servers you can deploy Static (everywhere-compatible) or Advanced (Node).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBuildMode('static')}
              className={`text-left p-4 rounded-xl border-2 ${
                buildMode === 'static' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="font-semibold">Standard — Static</div>
              <p className="text-sm text-gray-600 mt-1">
                HTML/CSS/JS export with sitemap &amp; meta. Fast and reliable.
              </p>
              <Badge className="mt-2 bg-emerald-100 text-emerald-800">Recommended</Badge>
            </button>
            <button
              type="button"
              onClick={() => setBuildMode('node')}
              className={`text-left p-4 rounded-xl border-2 ${
                buildMode === 'node' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="font-semibold">Advanced — Node</div>
              <p className="text-sm text-gray-600 mt-1">
                Node-ready package on our VPS for stronger SEO / server rendering.
              </p>
              <Badge className="mt-2 bg-blue-100 text-blue-800">Advanced</Badge>
            </button>
          </CardContent>
        </Card>
      )}

      {/* 3. Domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              3. Domain
            </CardTitle>
            <Link
              to="/admin/domains"
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage domains
            </Link>
          </div>
          <CardDescription>
            Domains already used by another project are marked — you can unlink and take them over.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {domainsLoading ? (
            <p className="text-sm text-gray-500">Loading domains…</p>
          ) : domainRows.length === 0 ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
              No domains yet.{' '}
              <Link to="/admin/domains" className="font-medium underline">
                Add a domain
              </Link>{' '}
              first.
            </p>
          ) : (
            <Select value={selectedDomain || undefined} onValueChange={setSelectedDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                {domainRows.map((d) => {
                  const used =
                    d.usedBy && projectId && String(d.usedBy.projectId) !== String(projectId)
                      ? d.usedBy
                      : null;
                  const badge = domainStatusBadge(d.status);
                  return (
                    <SelectItem key={d.domain} value={d.domain}>
                      <span className="flex items-center gap-2">
                        <span>{d.domain}</span>
                        <span className="text-xs text-gray-500">({badge.label})</span>
                        {used ? (
                          <span className="text-xs text-amber-700">
                            · used by {used.projectName}
                          </span>
                        ) : null}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {domainUsedElsewhere ? (
            <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>{selectedDomain}</strong> is linked to project{' '}
                <strong>{domainUsedElsewhere.projectName}</strong>. Deploy will ask to unlink it
                first.
              </div>
            </div>
          ) : null}

          {selectedDomainRow &&
          selectedDomainRow.status !== 'verified' &&
          selectedDomainRow.status !== 'connected_to_our_server' ? (
            <p className="text-xs text-gray-500">
              Domain status is <strong>{domainStatusBadge(selectedDomainRow.status).label}</strong>.
              You can still deploy to their hosting; for Our hosting, finish domain setup under
              Domains if connect fails.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Deploy */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg">4. Deploy</CardTitle>
          <CardDescription>
            {target === 'ours'
              ? `Our hosting · ${buildMode === 'static' ? 'Static' : 'Advanced (Node)'}`
              : selectedHosting
                ? `${hostingTypeLabel(selectedHosting.connectionType)} · ${
                    buildMode === 'static' ? 'Static' : 'Advanced (Node)'
                  }`
                : 'Select their hosting first'}
            {selectedDomain ? ` · ${selectedDomain}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={
              busy ||
              !selectedDomain ||
              domainRows.length === 0 ||
              (target === 'theirs' && !selectedHosting) ||
              (target === 'ours' && !ourHosting)
            }
            onClick={() => runDeploy()}
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Deploying… ({elapsedSec}s)
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                Deploy Now
              </>
            )}
          </Button>

          {deployStatus !== 'idle' && (
            <div
              className={`rounded-lg border p-4 flex items-start gap-3 ${
                deployStatus === 'success'
                  ? 'bg-green-50 border-green-200'
                  : deployStatus === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
              }`}
            >
              {deployStatus === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : deployStatus === 'failed' ? (
                <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 capitalize">
                  {deployStatus === 'checking' && 'Checking domain…'}
                  {deployStatus === 'connecting' && 'Connecting…'}
                  {deployStatus === 'building' && `Building… (${elapsedSec}s)`}
                  {deployStatus === 'uploading' && `Uploading… (${elapsedSec}s)`}
                  {deployStatus === 'success' && 'Deploy finished'}
                  {deployStatus === 'failed' && 'Deploy failed'}
                </p>
                {statusMessage ? (
                  <p className="text-sm text-gray-600 mt-1">{statusMessage}</p>
                ) : null}
                {artifactPath ? (
                  <code className="mt-2 block text-xs bg-white/80 p-2 rounded border break-all">
                    {artifactPath}
                  </code>
                ) : null}
                {projectDeploymentId ? (
                  <p className="text-xs text-gray-500 mt-1">Deployment ID: {projectDeploymentId}</p>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Domain already in use</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{conflict?.domain}</strong> is linked to project{' '}
              <strong>{conflict?.existingProject?.projectName}</strong>. Unlink it from that project
              to use it here, or pick another domain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConflictOpen(false);
                setConflict(null);
              }}
            >
              Use another domain
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleUnlinkAndContinue();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Unlink & deploy here
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
};

export default Deploy;
