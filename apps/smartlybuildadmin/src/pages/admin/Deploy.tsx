import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { httpFile } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import socket from '@/socket';
import { Rocket, Loader2, CheckCircle, XCircle, ExternalLink, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type BuildStatus = 'idle' | 'building' | 'success' | 'build_failed';

const Deploy = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();

  const [projectName, setProjectName] = useState('Project');
  const [pageLoading, setPageLoading] = useState(true);
  const [domains, setDomains] = useState<string[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [artifactPath, setArtifactPath] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildPhase, setBuildPhase] = useState('');
  const [buildMessage, setBuildMessage] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);

  const applyStatusPayload = useCallback(
    (data: {
      status?: string;
      artifactPath?: string;
      error?: string;
      message?: string;
      phase?: string;
    }) => {
      const s = String(data.status || '').toLowerCase();
      if (data.phase) setBuildPhase(String(data.phase));
      if (data.message) setBuildMessage(String(data.message));

      if (s === 'building' || s === 'queued') {
        setBuildStatus('building');
        setIsBuilding(true);
        setBuildError(null);
      } else if (s === 'success') {
        setBuildStatus('success');
        setIsBuilding(false);
        if (data.artifactPath) setArtifactPath(String(data.artifactPath));
      } else if (s === 'build_failed') {
        setBuildStatus('build_failed');
        setIsBuilding(false);
        setBuildError(data.error || data.message || 'Build failed');
      }
    },
    []
  );

  const loadDomains = useCallback(async () => {
    try {
      setDomainsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const { data } = await httpFile.get('/domains/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list: string[] = Array.isArray(data?.domains) ? data.domains : [];
      setDomains(list);
      if (list.length === 1) setSelectedDomain(list[0]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      toast({
        title: 'Could not load domains',
        description: err.response?.data?.error || err.message || 'Try again',
        variant: 'destructive',
      });
      setDomains([]);
    } finally {
      setDomainsLoading(false);
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
      if (p?.domainName) setSelectedDomain(String(p.domainName).replace(/^www\./i, '').trim());
    } catch {
      /* optional */
    } finally {
      setPageLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadDomains();
  }, [loadProject, loadDomains]);

  const lastNotifiedStatus = useRef<string>('');

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
      phase?: string;
    }) => {
      if (!payload || payload.projectId !== projectId) return;
      applyStatusPayload(payload);
      const s = String(payload.status || '').toLowerCase();
      if (s === 'success' && lastNotifiedStatus.current !== 'success') {
        lastNotifiedStatus.current = 'success';
        toast({ title: 'Static build complete', description: 'Your out/ folder is ready.' });
      }
      if (s === 'build_failed' && lastNotifiedStatus.current !== 'build_failed') {
        lastNotifiedStatus.current = 'build_failed';
        toast({
          title: 'Build failed',
          description: payload.error || 'See message below or backend terminal',
          variant: 'destructive',
        });
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
  }, [projectId, toast, applyStatusPayload]);

  useEffect(() => {
    if (!isBuilding) lastNotifiedStatus.current = '';
  }, [isBuilding]);

  useEffect(() => {
    if (!isBuilding) {
      setElapsedSec(0);
      return;
    }
    const t0 = Date.now();
    const tick = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - t0) / 1000));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [isBuilding]);

  useEffect(() => {
    if (!isBuilding || !projectId) return;

    const poll = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const { data } = await httpFile.get('/getStaticBuildStatus', {
          params: { projectId },
          headers: { Authorization: `Bearer ${token}` },
        });
        applyStatusPayload(data);
        if (data.status === 'success') {
          setIsBuilding(false);
          if (lastNotifiedStatus.current !== 'success') {
            lastNotifiedStatus.current = 'success';
            toast({ title: 'Static build complete', description: 'Your out/ folder is ready.' });
          }
        } else if (data.status === 'build_failed') {
          setIsBuilding(false);
          if (lastNotifiedStatus.current !== 'build_failed') {
            lastNotifiedStatus.current = 'build_failed';
            toast({
              title: 'Build failed',
              description: data.error || data.message || 'Check backend terminal',
              variant: 'destructive',
            });
          }
        }
      } catch {
        /* keep polling */
      }
    };

    poll();
    const id = window.setInterval(poll, 3000);
    return () => window.clearInterval(id);
  }, [isBuilding, projectId, applyStatusPayload]);

  const handleDeployNow = async () => {
    const domain = selectedDomain.replace(/^www\./i, '').trim();
    if (!projectId) return;
    if (!domain) {
      toast({
        title: 'Pick a domain',
        description: 'Add domains under Domains, then select one here.',
        variant: 'destructive',
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Not logged in', variant: 'destructive' });
      return;
    }

    try {
      setIsBuilding(true);
      setBuildStatus('building');
      setArtifactPath(null);
      setBuildError(null);
      setBuildPhase('queued');
      setBuildMessage('Starting build on server…');

      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('domainName', domain);

      await httpFile.post('/buildStaticSite', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: 'Build started',
        description: 'Usually takes 1–3 minutes. Status updates every few seconds.',
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setIsBuilding(false);
      setBuildStatus('build_failed');
      setBuildError(err.response?.data?.message || err.message || 'Request failed');
      toast({
        title: 'Could not start build',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  if (pageLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deploy — {projectName}</h1>
        <p className="text-gray-600 mt-1">
          Choose your domain, then build a static <code className="text-sm bg-gray-100 px-1 rounded">out/</code> folder
          (SiteNextJS) with sitemap, robots.txt, and llms.txt from your Website Pages.
        </p>
      </div>

      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-600" />
            Static build
          </CardTitle>
          <CardDescription>
            Select domain, then Deploy Now. First build often takes <strong>1–3 minutes</strong> (Next.js compile on
            your machine).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Domain *</Label>
              <Link
                to="/admin/domains"
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Add / manage domains
              </Link>
            </div>
            {domainsLoading ? (
              <p className="text-sm text-gray-500">Loading domains…</p>
            ) : domains.length === 0 ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                No domains yet.{' '}
                <Link to="/admin/domains" className="font-medium underline">
                  Add a domain
                </Link>{' '}
                first, then return here.
              </p>
            ) : (
              <Select value={selectedDomain || undefined} onValueChange={setSelectedDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain for sitemap & build" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isBuilding || !selectedDomain || domains.length === 0}
            onClick={handleDeployNow}
          >
            {isBuilding ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Building static site…
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                Deploy Now
              </>
            )}
          </Button>

          {buildStatus !== 'idle' && (
            <div
              className={`rounded-lg border p-4 flex items-start gap-3 ${
                buildStatus === 'success'
                  ? 'bg-green-50 border-green-200'
                  : buildStatus === 'build_failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
              }`}
            >
              {buildStatus === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : buildStatus === 'build_failed' ? (
                <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  {buildStatus === 'building' && `Building… (${elapsedSec}s)`}
                  {buildStatus === 'success' && 'Build finished'}
                  {buildStatus === 'build_failed' && 'Build failed'}
                </p>
                {buildStatus === 'building' && buildMessage && (
                  <p className="text-sm text-gray-600 mt-1">{buildMessage}</p>
                )}
                {buildStatus === 'building' && buildPhase && (
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">Phase: {buildPhase}</p>
                )}
                {buildError && <p className="text-sm text-red-700 mt-1">{buildError}</p>}
                {artifactPath && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-gray-700">
                    <FolderOpen className="h-4 w-4 shrink-0 mt-0.5" />
                    <code className="break-all text-xs bg-white/80 p-2 rounded border w-full block">
                      {artifactPath}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Deploy;
