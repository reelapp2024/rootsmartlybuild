// src/components/DeploymentDialog.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, ChevronRight, ArrowLeft, Check, Loader2, Settings, Server, Cog, Rocket, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getMyHostings,
  browseHostingDirectories,
  linkProjectToHosting,
  HostingConnection,
  setCurrentHostingForProject,
  canBrowseHosting,
  defaultRootPathForHosting,
  formatHostingSummary,
  hostingTypeLabel,
} from "@/api/newHostingApi";
import { httpFile } from "@/config";
import socket from "@/socket";

interface DeploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  preSelectedHostingId?: string;
}

interface DirectoryItem {
  name: string;
  fullPath: string;
}

export function DeploymentDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  preSelectedHostingId,
}: DeploymentDialogProps) {
  const [hostings, setHostings] = useState<HostingConnection[]>([]);
  const [selectedHosting, setSelectedHosting] = useState<HostingConnection | null>(null);

  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  const [domainName, setDomainName] = useState("");
  const [rootPath, setRootPath] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const { toast } = useToast();

  const [projectDeploymentId, setProjectDeploymentId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>("Waiting for update...");
  const [artifactPath, setArtifactPath] = useState<string | null>(null);

  const [showDomainDialog, setShowDomainDialog] = useState(false);
  const [isOurHostingFlow, setIsOurHostingFlow] = useState(false);

  // NEW: user domains list for the "Enter Domain Name" dialog
  const [domainList, setDomainList] = useState<string[]>([]);
  const [domainListLoading, setDomainListLoading] = useState(false);
  const [domainSearch, setDomainSearch] = useState("");

  // Domain conflict state
  const [showDomainConflictDialog, setShowDomainConflictDialog] = useState(false);
  const [domainConflict, setDomainConflict] = useState<{
    domain: string;
    existingProject: { projectId: string; projectName: string };
    options: any;
  } | null>(null);

  // === Deployment progress & phases ===
  type PhaseKey =
    | 'validate_domain'
    | 'connect_domain'
    | 'select_hosting'
    | 'link_hosting'
    | 'build_artifacts'
    | 'upload_files'
    | 'configure_server'
    | 'issue_ssl'
    | 'finalize'
    | 'complete';

  const phaseOrder: PhaseKey[] = [
    'validate_domain',
    'connect_domain',
    'select_hosting',
    'link_hosting',
    'build_artifacts',
    'upload_files',
    'configure_server',
    'issue_ssl',
    'finalize',
    'complete',
  ];

  const phaseLabels: Record<PhaseKey, string> = {
    validate_domain: 'Validating domain',
    connect_domain: 'Connecting domain',
    select_hosting: 'Selecting hosting',
    link_hosting: 'Linking hosting',
    build_artifacts: 'Building website',
    upload_files: 'Uploading files',
    configure_server: 'Configuring server',
    issue_ssl: 'Issuing SSL',
    finalize: 'Finalizing',
    complete: 'Completed',
  };

  const phaseProgress: Record<PhaseKey, number> = {
    validate_domain: 5,
    connect_domain: 12,
    select_hosting: 20,
    link_hosting: 30,
    build_artifacts: 55,
    upload_files: 75,
    configure_server: 85,
    issue_ssl: 92,
    finalize: 98,
    complete: 100,
  };

  const [currentPhase, setCurrentPhase] = useState<PhaseKey>('validate_domain');
  const [progressPct, setProgressPct] = useState<number>(0);

  const advanceTo = (key: PhaseKey) => {
    setCurrentPhase(key);
    setProgressPct(phaseProgress[key]);
  };

  // Live socket listeners for backend-driven statuses
  useEffect(() => {
    if (!projectId) return;
    // join project room
    try { socket.emit('joinRoom', `project_${projectId}`); } catch {}

    const onProjectStatus = (payload: any) => {
      if (!payload || payload.projectId !== projectId) return;
      const s = String(payload.status || '').toLowerCase();
      setLiveStatus(s);
      if (s === 'building') advanceTo('build_artifacts');
      else if (s === 'uploading') advanceTo('upload_files');
      else if (s === 'build_failed' || s === 'upload_failed') {
        // keep current phase but mark stalled
        setProgressPct((prev) => (prev > 5 ? prev : 5));
      }       else if (s === 'success') advanceTo('complete');
      if (payload.artifactPath) {
        const p = String(payload.artifactPath);
        setArtifactPath(p);
        if (s === 'uploading' || s === 'success') {
          toast({
            title: 'Static build ready',
            description: p,
          });
        }
      }
    };

    const onSitemap = (payload: any) => {
      if (!payload || payload.projectId !== projectId) return;
      const s = String(payload.status || '').toLowerCase();
      if (s === 'uploading') advanceTo('finalize');
      if (s === 'failed') setProgressPct((prev) => (prev > 90 ? prev : 90));
    };

    const onSSL = (payload: any) => {
      if (!payload || payload.projectId !== projectId) return;
      const s = String(payload.status || '').toLowerCase();
      if (s === 'issuing') advanceTo('issue_ssl');
      if (s === 'ready') advanceTo('finalize');
      if (s === 'failed') setProgressPct((prev) => (prev > 85 ? prev : 85));
    };

    socket.on('projectStatusUpdate', onProjectStatus);
    socket.on('sitemapUpdate', onSitemap);
    socket.on('sslUpdate', onSSL);

    return () => {
      try { socket.emit('leaveRoom', `project_${projectId}`); } catch {}
      socket.off('projectStatusUpdate', onProjectStatus);
      socket.off('sitemapUpdate', onSitemap);
      socket.off('sslUpdate', onSSL);
    };
  }, [projectId]);

  const filteredDomains = useMemo(() => {
    const q = domainSearch.trim().toLowerCase();
    if (!q) return domainList;
    return domainList.filter((d) => d.toLowerCase().includes(q));
  }, [domainList, domainSearch]);

  // --- API helpers for "our hosting" ---
  const fetchDomainRootFromOurHosting = async (projectId: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const { data } = await httpFile.post(
      "/getOurHostedDetails",
      { id: projectId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { domain: data?.domain ?? "", root: data?.root ?? "" };
  };

  const fetchDeployInfo = async (projectId: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const { data } = await httpFile.post(
      "/getDeployInfo",
      { projectId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      domainName: data?.domainName ?? "",
      rootPath: data?.rootPath ?? "",
      isOur: data?.isOur ?? false,
    };
  };

  const checkDomainAvailability = async (domain: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const cleanDomain = domain.replace(/^www\./i, "").trim();

    try {
      const { data, status } = await httpFile.post(
        "/checkDomain",
        { domainName: cleanDomain, projectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (status === 200 && (data.ok === true || data.message === "This domain is available to use")) {
        return { isAvailable: true, message: data.message };
      } else {
        return { isAvailable: false, message: data.error || "Domain unavailable" };
      }
    } catch (error: any) {
      // If 409 conflict, re-throw it so handleDomainSubmit can catch it
      if (error.response?.status === 409 && error.response?.data?.options) {
        throw error; // Re-throw to be handled by handleDomainSubmit
      }
      // For other errors, return unavailable
      return { 
        isAvailable: false, 
        message: error.response?.data?.error || error.message || "Failed to check domain availability" 
      };
    }
  };

  // --- Effects ---
  useEffect(() => {
    const shouldFetchForOurHosting = isOurHostingFlow || selectedHosting?.isOur === true;

    if (step === 2 && shouldFetchForOurHosting) {
      (async () => {
        try {
          if (!domainName || !rootPath) {
            const { domain, root } = await fetchDomainRootFromOurHosting(projectId);
            if (domain) setDomainName(domain);
            if (root) setRootPath(root);
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch domain/root",
            variant: "destructive",
          });
        }
      })();
    }

    if (step === 3) {
      (async () => {
        try {
          const { domainName: fetchedDomain, rootPath: fetchedRoot, isOur } = await fetchDeployInfo(projectId);
          if (isOur) {
            if (fetchedDomain) setDomainName(fetchedDomain);
            if (fetchedRoot) setRootPath(fetchedRoot);
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch deployment info",
            variant: "destructive",
          });
        }
      })();
    }
  }, [step, isOurHostingFlow, selectedHosting, projectId]);

  // Ensure ProjectDeployment exists when both domain and hosting are set on step 2
  useEffect(() => {
    if (step === 2 && domainName && domainName.trim() && selectedHosting?._id && !projectDeploymentId) {
      (async () => {
        try {
          // First try to fetch existing
          const config = await fetchProjectDeploymentConfig(projectId, selectedHosting._id);
          if (config?.projectDeploymentId) {
            setProjectDeploymentId(config.projectDeploymentId);
            return;
          }

          // If not found, create it
          const response = await linkProjectToHosting({
            hostingId: selectedHosting._id,
            projectId,
            domainName: domainName.replace(/^www\./i, "").trim(),
            rootPath: rootPath || "/",
          });
          
          // Extract and save deploymentId
          if (response?.data?.data?._id) {
            setProjectDeploymentId(response.data.data._id);
          } else if (response?.data?._id) {
            setProjectDeploymentId(response.data._id);
          }
        } catch (error: any) {
          // Silently fail - will be created when deploy is clicked
          console.log("Could not create ProjectDeployment in useEffect:", error.message);
        }
      })();
    }
  }, [step, domainName, selectedHosting, projectId, rootPath, projectDeploymentId]);

  useEffect(() => {
    if (open) {
      fetchHostings();
      setStep(0);
      setArtifactPath(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && step === 2) {
      loadUserDomains();
    }
  }, [open, step]);

  useEffect(() => {
    const isOur = isOurHostingFlow || selectedHosting?.isOur === true;
    const d = domainName.replace(/^www\./i, "").trim();
    if (isOur && d && !(rootPath || "").trim()) {
      setRootPath(defaultOurWebroot(d));
    }
  }, [domainName, isOurHostingFlow, selectedHosting, rootPath]);

  useEffect(() => {
    if (hostings.length > 0 && preSelectedHostingId) {
      const preSelected = hostings.find((h) => h._id === preSelectedHostingId);
      if (preSelected) {
        setSelectedHosting(preSelected);
        setStep(2);
        if (canBrowseHosting(preSelected.connectionType)) {
          browseDirectories(preSelected._id, "");
        } else {
          setRootPath(defaultRootPathForHosting(preSelected.connectionType));
        }
      }
    }
  }, [hostings, preSelectedHostingId]);

  useEffect(() => {
    if (hostings.length > 0 && preSelectedHostingId) {
      const preSelected = hostings.find((h) => h._id === preSelectedHostingId);
      if (preSelected) {
        setSelectedHosting(preSelected);
        setStep(2);
        if (canBrowseHosting(preSelected.connectionType)) {
          browseDirectories(preSelected._id, "");
        } else {
          setRootPath(defaultRootPathForHosting(preSelected.connectionType));
        }

        fetchProjectDeploymentConfig(projectId, preSelected._id).then((config) => {
          if (config) {
            setDomainName(config.domainName || "");
            setRootPath(config.rootPath || "");
            setProjectDeploymentId(config.projectDeploymentId || null);
          } else {
            setDomainName("");
            setRootPath("");
            setProjectDeploymentId(null);
          }
        });
      }
    }
  }, [hostings, preSelectedHostingId]);

  useEffect(() => {
    if (step === 3) {
      socket.emit("joinProject", projectId);

      socket.on("projectStatusUpdate", ({ projectId: updatedId, status }) => {
        if (updatedId === projectId) {
          setLiveStatus(status);
        }
      });

      return () => {
        socket.emit("leaveProject", projectId);
        socket.off("projectStatusUpdate");
      };
    }
  }, [step, projectId]);

  // --- Data loaders ---
  const fetchCurrentHostingForProject = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await httpFile.post(
        "/getCurrentHostingForProject",
        { projectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data.hostingId;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const findOurHosting = (list: HostingConnection[]) =>
    list.find((h) => (h as { isOur?: boolean }).isOur === true || h.connectionType === "vps") ?? null;

  const defaultOurWebroot = (domain: string) => {
    const d = domain.replace(/^www\./i, "").trim();
    return d ? `/var/www/ai/${d}` : "/var/www/ai";
  };

  const fetchHostings = async (): Promise<HostingConnection[]> => {
    try {
      setIsLoading(true);
      const hostingList = await getMyHostings({ verifiedOnly: true });
      setHostings(hostingList);

      const currentHostingId = await fetchCurrentHostingForProject();
      if (currentHostingId) {
        const currentHosting = hostingList.find((h) => h._id === currentHostingId);
        if (currentHosting) {
          setSelectedHosting(currentHosting);
          setStep(2);
          if (canBrowseHosting(currentHosting.connectionType)) {
            browseDirectories(currentHosting._id, "");
          } else {
            setRootPath(defaultRootPathForHosting(currentHosting.connectionType));
          }
        }
      }
      return hostingList;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleHostingSelect = async (hosting: HostingConnection) => {
    setSelectedHosting(hosting);
    setStep(2);

    const config = await fetchProjectDeploymentConfig(projectId, hosting._id);
    if (config) {
      setDomainName(config.domainName || "");
      setRootPath(config.rootPath || "");
      setProjectDeploymentId(config.projectDeploymentId || null);
    } else {
      setDomainName("");
      setRootPath("");
      setProjectDeploymentId(null);
    }

    try {
      await setCurrentHostingForProject({ projectId, hostingId: hosting._id });
      toast({ title: "Success", description: "Hosting linked to the project successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    if (canBrowseHosting(hosting.connectionType)) {
      browseDirectories(hosting._id, "");
    } else {
      setRootPath(defaultRootPathForHosting(hosting.connectionType));
    }

    // If domain is already set, create/link ProjectDeployment immediately
    if (domainName && domainName.trim()) {
      try {
        const response = await linkProjectToHosting({
          hostingId: hosting._id,
          projectId,
          domainName: domainName.replace(/^www\./i, "").trim(),
          rootPath: rootPath || "/",
        });
        
        // Extract and save deploymentId
        if (response?.data?.data?._id) {
          setProjectDeploymentId(response.data.data._id);
        } else if (response?.data?._id) {
          setProjectDeploymentId(response.data._id);
        }
      } catch (error: any) {
        // Silently fail - will be created later when deploy is clicked
        console.log("Could not create ProjectDeployment yet:", error.message);
      }
    }
  };

  const browseDirectories = async (hostingId: string, path: string) => {
    try {
      setIsLoading(true);
      const dirs = await browseHostingDirectories(hostingId, path);
      setDirectories(dirs);
      setCurrentPath(path);

      if (path === "") {
        setBreadcrumbs([]);
      } else {
        const pathParts = path.split("/").filter((part) => part !== "");
        setBreadcrumbs(pathParts);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectoryClick = (dir: DirectoryItem) => {
    browseDirectories(selectedHosting!._id, dir.fullPath);
  };

  const navigateToPath = (pathIndex: number) => {
    const newPath = breadcrumbs.slice(0, pathIndex + 1).join("/");
    browseDirectories(selectedHosting!._id, newPath);
  };

  const goBack = () => {
    const parentPath = breadcrumbs.slice(0, -1).join("/");
    browseDirectories(selectedHosting!._id, parentPath);
  };

  const selectCurrentPath = () => {
    const chosen = currentPath || "/";
    setRootPath(chosen);
    toast({ title: "Path Selected", description: `Root path set to: ${chosen}` });
  };

  const fetchProjectDeploymentConfig = async (projectId: string, hostingId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await httpFile.post(
        "/getProjectDeploymentId",
        { projectId, hostingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch {
      return null;
    }
  };

  const uploadToHostingFromBuild = async (projectDeploymentId: string, deployDomain: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const formData = new FormData();
    formData.append("projectDeploymentId", projectDeploymentId);
    formData.append("projectId", projectId);
    formData.append("domainName", deployDomain.replace(/^www\./i, "").trim());

    try {
      await httpFile.post("/uploadToHostingFromBuild", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to upload to hosting");
    }
  };

  const updateProjectDomain = async (domainName: string, projectId: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const formData = new FormData();
    formData.append("domainName", domainName);
    formData.append("projectId", projectId);

    try {
      await httpFile.post("/updateProjectDomain", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update project domain");
    }
  };

  const generateSitemap = async (projectId: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const formData = new FormData();
    formData.append("projectId", projectId);

    try {
      const response = await httpFile.post("/generateSitemap", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to generate sitemap");
    }
  };

  // ---- New: Domains list API helpers for dialog ----
  const loadUserDomains = async () => {
    try {
      setDomainListLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      // Prefer listDomains helper (same as Domains page) when available via shared API shape
      const { data } = await httpFile.get("/domains/list", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      });

      const domains: string[] = Array.isArray(data?.domains) ? data.domains : [];
      setDomainList(domains);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to load your domains",
        variant: "destructive",
      });
      setDomainList([]);
    } finally {
      setDomainListLoading(false);
    }
  };

  const addDomainToAccount = async (domain: string) => {
    const clean = domain.trim();
    if (!clean) {
      toast({ title: "Validation", description: "Enter a domain first", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      const fd = new FormData();
      fd.append("domainName", clean);

      // per your curl: POST /admin/v1/domains with form-data
      const { data } = await httpFile.post("/domains", fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      // if success, merge into list (avoid dupes)
      setDomainList((prev) => {
        if (prev.includes(clean)) return prev;
        return [clean, ...prev];
      });

      toast({
        title: "Added",
        description: data?.message || `Domain "${clean}" added to your account.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to add domain",
        variant: "destructive",
      });
    }
  };

  // ---- Flow handlers ----
  const handleOurHosting = async () => {
    setIsOurHostingFlow(true);
    setShowDomainDialog(true);
    setSelectedHosting(null);
    setRootPath("");
    setDomainName("");
    await loadUserDomains();
  };

  const handleDomainDialogOpen = async (openState: boolean) => {
    setShowDomainDialog(openState);
    if (openState) {
      await loadUserDomains();
    }
  };

  const handleDomainSubmit = async () => {
    if (!domainName) {
      toast({ title: "Missing Information", description: "Please enter a domain name", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      advanceTo('validate_domain');

      // Validate domain availability for this project usage
      try {
        const { isAvailable, message } = await checkDomainAvailability(domainName);
        if (!isAvailable) {
          toast({ title: "Domain Unavailable", description: message, variant: "destructive" });
          setIsLoading(false);
          return;
        }
      } catch (error: any) {
        // Handle 409 conflict from checkDomainAvailability
        if (error.response?.status === 409 && error.response?.data?.options) {
          setDomainConflict({
            domain: error.response.data.domain,
            existingProject: error.response.data.existingProject,
            options: error.response.data.options
          });
          setShowDomainConflictDialog(true);
          setIsLoading(false);
          return;
        }
        // Re-throw other errors
        throw error;
      }

      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("domainName", domainName.replace(/^www\./i, "").trim());

      advanceTo('connect_domain');
      const { data: res } = await httpFile.post("/connectDomain", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Case 1: Domain already connected to this project (skipped)
      if (res.ok === true && res.skipped === true) {
        const skippedDomain = res.domain || domainName.replace(/^www\./i, "").trim();
        const skippedRoot = res.project?.siteHostRootPath || defaultOurWebroot(skippedDomain);
        setDomainName(skippedDomain);
        setRootPath(skippedRoot);
        
        const hostingListAfterSkip = await fetchHostings();
        const found = findOurHosting(hostingListAfterSkip);
        if (found) {
          setSelectedHosting(found);
          try {
            await setCurrentHostingForProject({ projectId, hostingId: found._id });
            
            // Try to fetch existing ProjectDeployment config
            const config = await fetchProjectDeploymentConfig(projectId, found._id);
            if (config?.projectDeploymentId) {
              setProjectDeploymentId(config.projectDeploymentId);
            } else {
              // Create/link ProjectDeployment if it doesn't exist
              try {
                const response = await linkProjectToHosting({
                  hostingId: found._id,
                  projectId,
                  domainName: skippedDomain,
                  rootPath: skippedRoot,
                });
                
                // Extract and save deploymentId
                if (response?.data?.data?._id) {
                  setProjectDeploymentId(response.data.data._id);
                } else if (response?.data?._id) {
                  setProjectDeploymentId(response.data._id);
                }
              } catch (error: any) {
                console.log("Could not create ProjectDeployment yet:", error.message);
              }
            }
          } catch {}
        } else {
          setSelectedHosting(null);
        }

        toast({ 
          title: "Domain Already Connected", 
          description: res.message || `Domain ${res.domain} is already connected to this project` 
        });
        setShowDomainDialog(false);
        advanceTo('select_hosting');
        setStep(2);
        return;
      }

      // Case 2: Normal success response
      setDomainName(res.domain || domainName.replace(/^www\./i, "").trim());
      setRootPath(res.webroot || "");

      const hostingListAfterConnect = await fetchHostings();
      const found = findOurHosting(hostingListAfterConnect);
      if (found) {
        setSelectedHosting(found);
        try {
          await setCurrentHostingForProject({ projectId, hostingId: found._id });
          
          // Create/link ProjectDeployment immediately since both domain and hosting are now set
          try {
            const webroot = res.webroot || defaultOurWebroot(res.domain || domainName);
            setRootPath(webroot);
            const response = await linkProjectToHosting({
              hostingId: found._id,
              projectId,
              domainName: (res.domain || domainName.replace(/^www\./i, "").trim()),
              rootPath: webroot,
            });
            
            // Extract and save deploymentId
            if (response?.data?.data?._id) {
              setProjectDeploymentId(response.data.data._id);
            } else if (response?.data?._id) {
              setProjectDeploymentId(response.data._id);
            }
          } catch (error: any) {
            // Silently fail - will be created later when deploy is clicked
            console.log("Could not create ProjectDeployment yet:", error.message);
          }
        } catch {}
      } else {
        setSelectedHosting(null);
      }

      toast({ title: "Domain connected", description: res.message || `Connected ${res.domain}` });
      setShowDomainDialog(false);
      advanceTo('select_hosting');
      setStep(2);
    } catch (error: any) {
      // Case 3: Domain exists in another project (409 conflict)
      if (error.response?.status === 409 && error.response?.data?.options) {
        setDomainConflict({
          domain: error.response.data.domain,
          existingProject: error.response.data.existingProject,
          options: error.response.data.options
        });
        setShowDomainConflictDialog(true);
        return;
      }

      // Other errors
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to connect domain";

      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkDomain = async () => {
    if (!domainConflict) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      // Get projectId from conflict - use existingProject.projectId as fallback
      const conflictingProjectId = domainConflict.options?.unlink?.requiredParams?.projectId || 
                                   domainConflict.existingProject?.projectId;
      
      if (!conflictingProjectId) {
        toast({ 
          title: "Error", 
          description: "Could not find the conflicting project ID", 
          variant: "destructive" 
        });
        return;
      }

      // Convert to string if it's an object
      const projectIdString = String(conflictingProjectId);
      
      const formData = new FormData();
      formData.append("projectId", projectIdString);
      formData.append("domainName", domainConflict.domain);

      await httpFile.post("/unlinkDomain", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({ 
        title: "Domain Unlinked", 
        description: `Domain ${domainConflict.domain} has been unlinked from the other project` 
      });

      const unlinkedDomain = domainConflict.domain;
      setShowDomainConflictDialog(false);
      setDomainConflict(null);

      // Retry connecting the domain (use the domain name we tried to connect)
      const connectFormData = new FormData();
      connectFormData.append("projectId", projectId);
      connectFormData.append("domainName", unlinkedDomain);

      const { data: res } = await httpFile.post("/connectDomain", connectFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle successful connection
      setDomainName(res.domain || unlinkedDomain);
      setRootPath(res.webroot || "");

      const hostingListAfterUnlink = await fetchHostings();
      const found = findOurHosting(hostingListAfterUnlink);
      if (found) {
        setSelectedHosting(found);
        try {
          await setCurrentHostingForProject({ projectId, hostingId: found._id });
        } catch {}
      } else {
        setSelectedHosting(null);
      }

      toast({ title: "Domain connected", description: res.message || `Connected ${res.domain}` });
      setShowDomainDialog(false);
      setStep(2);
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to unlink domain";

      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseAnotherDomain = () => {
    setShowDomainConflictDialog(false);
    setDomainConflict(null);
    setDomainName("");
    // Keep domain dialog open so user can enter another domain
  };

  const handleDeploy = async () => {
    try {
      setIsLoading(true);

      const isOur = isOurHostingFlow || selectedHosting?.isOur === true;
      const cleanDomain = domainName.replace(/^www\./i, "").trim();

      let effectiveHosting = selectedHosting;
      let effectiveRoot = (rootPath || "").trim();

      if (isOur) {
        if (!effectiveHosting) {
          const list = hostings.length ? hostings : await getMyHostings({ verifiedOnly: true });
          effectiveHosting = findOurHosting(list);
          if (effectiveHosting) setSelectedHosting(effectiveHosting);
        }
        if (!effectiveRoot && cleanDomain) {
          effectiveRoot = defaultOurWebroot(cleanDomain);
          setRootPath(effectiveRoot);
        }
      } else if (!effectiveRoot) {
        effectiveRoot = selectedHosting
          ? defaultRootPathForHosting(selectedHosting.connectionType)
          : "/public_html";
        setRootPath(effectiveRoot);
      }

      if (!isOur) {
        try {
          const { isAvailable, message } = await checkDomainAvailability(domainName);
          if (!isAvailable) {
            setIsLoading(false);
            toast({ title: "Domain Unavailable", description: message, variant: "destructive" });
            return;
          }
        } catch (error: any) {
          // Handle 409 conflict from checkDomainAvailability
          if (error.response?.status === 409 && error.response?.data?.options) {
            setDomainConflict({
              domain: error.response.data.domain,
              existingProject: error.response.data.existingProject,
              options: error.response.data.options
            });
            setShowDomainConflictDialog(true);
            setIsLoading(false);
            return;
          }
          // Re-throw other errors
          throw error;
        }
      }

      // Begin linking & build/upload phases
      advanceTo('link_hosting');
      if (isOur && !cleanDomain) {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No auth token found");

        const { data } = await httpFile.post(
          "/getOurHostedDetails",
          { id: projectId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const fetchedDomain = data?.domain ?? "";
        const fetchedRoot = data?.root ?? "";

        if (fetchedDomain) setDomainName(fetchedDomain);
        if (fetchedRoot) {
          setRootPath(fetchedRoot);
          effectiveRoot = fetchedRoot;
        } else if (fetchedDomain) {
          effectiveRoot = defaultOurWebroot(fetchedDomain);
          setRootPath(effectiveRoot);
        }
      }

      if (!cleanDomain && !domainName.trim()) {
        setIsLoading(false);
        toast({
          title: "Domain required",
          description: "Select a domain from your account (Domains page) for sitemap and deploy.",
          variant: "destructive",
        });
        return;
      }

      if (!isOur && !effectiveHosting) {
        setIsLoading(false);
        toast({ title: "Missing hosting", description: "Select a hosting connection first.", variant: "destructive" });
        return;
      }

      if (!effectiveRoot) {
        setIsLoading(false);
        toast({ title: "Missing root path", description: "Set a deployment root path.", variant: "destructive" });
        return;
      }

      if (isOur && !effectiveHosting) {
        setIsLoading(false);
        toast({
          title: "Our hosting unavailable",
          description: "Could not find platform VPS hosting on your account. Contact support.",
          variant: "destructive",
        });
        return;
      }

      setStep(3);

      let deploymentId = projectDeploymentId;
      const deployDomain = cleanDomain || domainName.replace(/^www\./i, "").trim();
      const hostingIdForDeploy = effectiveHosting!._id;

      // Ensure we have a deploymentId before proceeding
      if (!deploymentId && hostingIdForDeploy && deployDomain && effectiveRoot) {
        const config = await fetchProjectDeploymentConfig(projectId, hostingIdForDeploy);
        if (config?.projectDeploymentId) {
          deploymentId = config.projectDeploymentId;
          setProjectDeploymentId(deploymentId);
        } else {
          const response = await linkProjectToHosting({
            hostingId: hostingIdForDeploy,
            projectId,
            domainName: deployDomain,
            rootPath: effectiveRoot,
          });
          
          // Extract deploymentId from response
          if (response?.data?.data?._id) {
            deploymentId = response.data.data._id;
            setProjectDeploymentId(deploymentId);
          } else if (response?.data?._id) {
            deploymentId = response.data._id;
            setProjectDeploymentId(deploymentId);
          } else {
            // Wait a moment and try fetching again (database sync delay)
            await new Promise(resolve => setTimeout(resolve, 500));
            const retryConfig = await fetchProjectDeploymentConfig(projectId, hostingIdForDeploy);
            if (retryConfig?.projectDeploymentId) {
              deploymentId = retryConfig.projectDeploymentId;
              setProjectDeploymentId(deploymentId);
            }
          }
        }
      }

      if (!deploymentId) {
        throw new Error("Could not determine ProjectDeploymentId! Please ensure the project is linked to hosting.");
      }

      advanceTo('build_artifacts');
      setArtifactPath(null);
      advanceTo('upload_files');
      await uploadToHostingFromBuild(deploymentId, deployDomain);
      advanceTo('configure_server');
      await updateProjectDomain(deployDomain, projectId);
      advanceTo('issue_ssl');
      // Sitemap, robots.txt, llms.txt are generated during SiteNextJS static build
      // Do not force-complete here; wait for backend 'success'
    } catch (error: any) {
      toast({ title: "Deployment Error", description: error.message, variant: "destructive" });
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setStep(0);
    setSelectedHosting(null);
    setDirectories([]);
    setCurrentPath("");
    setBreadcrumbs([]);
    setDomainName("");
    setRootPath("");
    setShowDomainDialog(false);
    setDomainList([]);
    setDomainSearch("");
    setArtifactPath(null);
  };

  const goToStep = (targetStep: 0 | 1 | 2 | 3) => {
    if (targetStep < step) setStep(targetStep);
  };

  // --- UI ---
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) resetDialog();
          onOpenChange(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                {React.createElement(FolderOpen as any, { className: "h-5 w-5 text-blue-600" })}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Deploy {projectName}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Configure and deploy your project to hosting
                </p>
              </div>
            </div>

            {/* Live progress */}
            {step === 3 && (
              <div className="mt-4 space-y-3">
                <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2.5 bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="text-sm text-gray-700 flex items-center justify-between">
                  <span className="font-medium">{phaseLabels[currentPhase]}</span>
                  <span className="font-semibold text-blue-600">{progressPct}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t">
                  {phaseOrder.map((p) => (
                    <div key={p} className={`flex items-center gap-2 ${phaseOrder.indexOf(p) <= phaseOrder.indexOf(currentPhase) ? 'text-gray-900 font-medium' : ''}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${phaseOrder.indexOf(p) < phaseOrder.indexOf(currentPhase) ? 'bg-green-500' : phaseOrder.indexOf(p) === phaseOrder.indexOf(currentPhase) ? 'bg-blue-600' : 'bg-gray-300'}`} />
                      <span className="truncate">{phaseLabels[p]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* steps */}
            <div className="flex items-center justify-center space-x-3 pt-4 pb-2">
              {[
                { num: 0, icon: Settings, label: "Method" },
                { num: 1, icon: Server, label: "Hosting" },
                { num: 2, icon: Cog, label: "Configure" },
                { num: 3, icon: Rocket, label: "Deploy" }
              ].map((stepInfo) => {
                const Icon = stepInfo.icon;
                const stepNumber = stepInfo.num;
                const isCompleted = step > stepNumber;
                const isActive = step === stepNumber;
                
                return (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all relative ${
                        isCompleted 
                          ? "bg-green-50 border-2 border-green-500 text-green-600 shadow-sm" 
                          : isActive 
                            ? "bg-blue-600 text-white shadow-md" 
                            : "bg-gray-200 text-gray-600"
                      }`}
                      onClick={() => goToStep(stepNumber as 0 | 1 | 2 | 3)}
                      title={stepInfo.label}
                    >
                      {React.createElement(Icon as any, { className: `w-5 h-5 ${isCompleted ? "text-green-600" : isActive ? "text-white" : "text-gray-600"}` })}
                      {isCompleted && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          {React.createElement(Check as any, { className: "w-2.5 h-2.5 text-white" })}
                        </div>
                      )}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`w-12 h-1 mx-1 rounded ${isCompleted ? "bg-green-500" : isActive ? "bg-blue-600" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </DialogHeader>

          <div className="py-4">

          {/* Step 0: choose method */}
          {step === 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-900">Select Deployment Method</Label>
              <div className="space-y-3">
                <div
                  className="p-5 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all shadow-sm"
                  onClick={handleOurHosting}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Use Our Hosting Servers</h4>
                      <p className="text-sm text-gray-600">Deploy to our managed hosting servers</p>
                    </div>
                    {React.createElement(ChevronRight as any, { className: "h-5 w-5 text-gray-400" })}
                  </div>
                </div>
                <div
                  className="p-5 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all shadow-sm"
                  onClick={() => setStep(1)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Use Your Own Hosting</h4>
                      <p className="text-sm text-gray-600">Deploy to your own hosting server</p>
                    </div>
                    {React.createElement(ChevronRight as any, { className: "h-5 w-5 text-gray-400" })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: hosting list */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center space-x-2">
                  {React.createElement(Server as any, { className: "h-4 w-4 text-blue-600" })}
                  <Label className="text-sm font-semibold text-gray-900">Select Hosting Server</Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(0)} className="h-8">
                  {React.createElement(ArrowLeft as any, { className: "h-3.5 w-3.5 mr-1.5" })}
                  Back
                </Button>
              </div>
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-blue-100 w-fit mx-auto mb-4">
                    {React.createElement(Loader2 as any, { className: "h-8 w-8 animate-spin text-blue-600" })}
                  </div>
                  <p className="text-sm font-medium text-gray-700">Loading hostings...</p>
                  <p className="text-xs text-gray-500 mt-1">Please wait while we fetch your hosting connections</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hostings.map((hosting) => {
                    const isSelected = selectedHosting?._id === hosting._id;
                    const summary = formatHostingSummary(
                      hosting.connectionConfig,
                      hosting.connectionType
                    );
                    return (
                      <div
                        key={hosting._id}
                        className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? "border-blue-500 bg-blue-50 shadow-md" 
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm"
                        }`}
                        onClick={() => handleHostingSelect(hosting)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2.5 rounded-lg ${
                              isSelected ? "bg-blue-600" : "bg-gray-100"
                            }`}>
                              {React.createElement(Server as any, { className: `h-5 w-5 ${isSelected ? "text-white" : "text-gray-600"}` })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 mb-1.5 text-base font-mono truncate">
                                {summary}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                                <span className="px-2 py-0.5 bg-gray-100 rounded font-medium">
                                  {hostingTypeLabel(hosting.connectionType)}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 font-medium">
                                  <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                                    {React.createElement(Check as any, { className: "h-2.5 w-2.5 text-white" })}
                                  </div>
                                  <span>Already connected to this project</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {React.createElement(ChevronRight as any, { className: `h-5 w-5 flex-shrink-0 ml-2 ${isSelected ? "text-blue-600" : "text-gray-400"}` })}
                        </div>
                      </div>
                    );
                  })}

                  {hostings.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <div className="p-4 rounded-full bg-gray-200 w-fit mx-auto mb-4">
                        {React.createElement(Server as any, { className: "h-12 w-12 text-gray-400" })}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">No hosting connections found</h3>
                      <p className="text-sm text-gray-600 mb-4">You need to add a hosting connection before deploying</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          // Navigate to hosting settings or add hosting page
                          window.open('/admin/hosting', '_blank');
                        }}
                      >
                        {React.createElement(Plus as any, { className: "h-4 w-4 mr-2" })}
                        Add Hosting Connection
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: configure */}
          {step === 2 && (selectedHosting || isOurHostingFlow) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Configure Deployment</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(isOurHostingFlow ? 0 : selectedHosting?.isOur ? 0 : 1)}
                >
                  {React.createElement(ArrowLeft as any, { className: "h-4 w-4 mr-2" })}
                  Back
                </Button>
              </div>

              {/* directory browsing (not for our hosting) */}
              {!isOurHostingFlow && selectedHosting?.isOur !== true && (
                <>
                  <div className="space-y-2">
                    <Label>Directory</Label>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={goBack} disabled={currentPath === "" || isLoading}>
                        {React.createElement(ArrowLeft as any, { className: "h-4 w-4 mr-2" })}
                        Back
                      </Button>
                      <Button variant="outline" size="sm" onClick={selectCurrentPath} disabled={isLoading}>
                        Select Current Path
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Path:</span>
                      <span className="cursor-pointer hover:underline" onClick={() => browseDirectories(selectedHosting!._id, "")}>
                        /
                      </span>
                      {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center">
                          {React.createElement(ChevronRight as any, { className: "h-4 w-4" })}
                          <span className="cursor-pointer hover:underline" onClick={() => navigateToPath(index)}>
                            {crumb}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      {isLoading ? (
                        <div className="text-center py-4">Loading directories...</div>
                      ) : directories.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No directories found</div>
                      ) : (
                        directories.map((dir) => (
                          <div
                            key={dir.fullPath}
                            className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                            onClick={() => handleDirectoryClick(dir)}
                          >
                            {React.createElement(FolderOpen as any, { className: "h-4 w-4 mr-2" })}
                            <span>{dir.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* domain (account list) + root path */}
              <div className="space-y-4">
                {(() => {
                  const disableRootOnly = isOurHostingFlow || selectedHosting?.isOur === true;
                  return (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label>Domain for sitemap &amp; deploy *</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-600"
                            onClick={() => window.open("/admin/domains", "_blank")}
                          >
                            {React.createElement(ExternalLink as any, { className: "h-3.5 w-3.5 mr-1" })}
                            Manage domains
                          </Button>
                        </div>
                        {domainListLoading ? (
                          <p className="text-sm text-gray-500">Loading your domains…</p>
                        ) : (
                          <>
                            {domainList.length > 0 && (
                              <Select
                                value={domainName || undefined}
                                onValueChange={(v) => setDomainName(v.replace(/^www\./i, "").trim())}
                              >
                                <SelectTrigger id="domain">
                                  <SelectValue placeholder="Select a domain from your account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {domainList.map((d) => (
                                    <SelectItem key={d} value={d}>
                                      {d}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <Input
                              id="domain-manual"
                              placeholder={
                                domainList.length > 0
                                  ? "Or type domain (example.com)"
                                  : "Enter domain (add more at Domains page)"
                              }
                              value={domainName}
                              onChange={(e) => setDomainName(e.target.value.replace(/^www\./i, "").trim())}
                            />
                            {domainList.length === 0 && (
                              <p className="text-xs text-amber-700">
                                No saved domains yet — type one above or add at Domains.
                              </p>
                            )}
                          </>
                        )}
                        <p className="text-xs text-gray-500">
                          Used in sitemap.xml (all WebsitePage slugs) and written into the static build.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="rootPath">Root Path *</Label>
                        <Input
                          id="rootPath"
                          placeholder="/public_html"
                          value={rootPath}
                          onChange={(e) => setRootPath(e.target.value)}
                          disabled={disableRootOnly}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleDeploy} 
                  disabled={isLoading || !domainName?.trim() || !rootPath?.trim()} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      {React.createElement(Loader2 as any, { className: "h-4 w-4 mr-2 animate-spin" })}
                      Deploying...
                    </>
                  ) : (
                    "Deploy Project"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: live status */}
          {step === 3 && (
            <div className="text-center py-8 space-y-5">
              <div
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg ${
                  liveStatus === "success" ? "bg-green-100" : liveStatus === "build_failed" || liveStatus === "upload_failed" ? "bg-red-100" : "bg-blue-100"
                }`}
              >
                {liveStatus === "success" ? (
                  React.createElement(Check as any, { className: "w-10 h-10 text-green-600" })
                ) : liveStatus === "build_failed" || liveStatus === "upload_failed" ? (
                  <div className="w-10 h-10 text-red-600 text-2xl">✕</div>
                ) : (
                  React.createElement(Loader2 as any, { className: "w-10 h-10 text-blue-600 animate-spin" })
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {liveStatus === "building" && "Building Project"}
                  {liveStatus === "uploading" && "Uploading to Server"}
                  {liveStatus === "success" && "Deployment Completed"}
                  {liveStatus === "build_failed" && "Build Failed"}
                  {liveStatus === "upload_failed" && "Upload Failed"}
                  {liveStatus === "Waiting for update..." && "Deployment Started"}
                  {!["building", "uploading", "success", "build_failed", "upload_failed", "Waiting for update..."].includes(
                    liveStatus
                  ) && "Deploying..."}
                </h3>

                <p className="text-gray-600 mt-2 text-sm">
                  {liveStatus === "building" && "Your project is currently being built. Please wait..."}
                  {liveStatus === "uploading" && "Build complete. Uploading to your hosting server..."}
                  {liveStatus === "success" && "Congratulations! Your project was deployed successfully."}
                  {liveStatus === "build_failed" && "Build process failed. Please check logs or try again."}
                  {liveStatus === "upload_failed" && "Uploading to the server failed. Please verify connection."}
                  {liveStatus === "Waiting for update..." && "Your deployment process has started. Waiting for build to begin..."}
                  {!["building", "uploading", "success", "build_failed", "upload_failed", "Waiting for update..."].includes(
                    liveStatus
                  ) && "Your deployment is in progress. Please wait..."}
                </p>
              </div>

              {artifactPath && (
                <div className="text-left text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3 w-full max-w-lg mx-auto break-all">
                  <span className="font-semibold text-gray-900 block mb-1">Static build folder</span>
                  <code>{artifactPath}</code>
                </div>
              )}

              <div className="text-sm text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-lg p-4 w-full max-w-md mx-auto">
                <span className="font-semibold text-gray-900">Live Status:</span>{" "}
                <span className="capitalize">{liveStatus}</span>
              </div>

              {liveStatus === "success" && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Domain Input Dialog: pick existing OR add new */}
      <Dialog open={showDomainDialog} onOpenChange={handleDomainDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                {React.createElement(FolderOpen as any, { className: "h-5 w-5" })}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Enter Domain Name
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Select or add a domain for your project
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="domainInput" className="text-sm font-semibold text-gray-900">
                Domain Name <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="domainInput"
                  placeholder="www.example.com"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="h-10"
                />
                <Button 
                  variant="outline" 
                  onClick={() => addDomainToAccount(domainName)} 
                  disabled={!domainName}
                  className="h-10 px-4 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                >
                  {React.createElement(Plus as any, { className: "h-4 w-4 mr-1.5" })}
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Type a new domain and click <span className="font-semibold text-gray-700">Add</span>, or select one you already added below.
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {React.createElement(FolderOpen as any, { className: "h-4 w-4 text-blue-600" })}
                <Label className="text-sm font-semibold text-gray-900">My Domains</Label>
                {domainList.length > 0 && (
                  <span className="text-xs text-gray-500">({domainList.length} {domainList.length === 1 ? 'domain' : 'domains'})</span>
                )}
              </div>
              <Input
                placeholder="Search in my domains…"
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                className="h-9"
              />
              <div className="border-2 border-gray-200 rounded-lg max-h-64 overflow-auto bg-gray-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {domainListLoading ? (
                  <div className="p-8 text-center">
                    {React.createElement(Loader2 as any, { className: "h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" })}
                    <p className="text-sm text-gray-600">Loading domains…</p>
                  </div>
                ) : filteredDomains.length === 0 ? (
                  <div className="p-8 text-center">
                    {React.createElement(FolderOpen as any, { className: "h-10 w-10 text-gray-400 mx-auto mb-3" })}
                    <p className="text-sm font-medium text-gray-700 mb-1">No domains found</p>
                    <p className="text-xs text-gray-500">
                      {domainSearch ? "Try a different search term" : "Add a domain above to get started"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredDomains.map((d) => {
                      const isSelected = domainName.trim().toLowerCase() === d.toLowerCase();
                      return (
                        <div
                          key={d}
                          className={`px-4 py-3 cursor-pointer text-sm flex items-center justify-between transition-colors ${
                            isSelected 
                              ? "bg-blue-50 border-l-4 border-blue-600" 
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => setDomainName(d)}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isSelected ? "bg-blue-600" : "bg-gray-300"
                            }`}></div>
                            <span className="truncate font-medium text-gray-900">{d}</span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
                              {React.createElement(Check as any, { className: "w-3 h-3 text-white" })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t mt-4">
            <Button 
              onClick={handleDomainSubmit} 
              disabled={isLoading || !domainName} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
            >
              {isLoading ? (
                <>
                  {React.createElement(Loader2 as any, { className: "h-4 w-4 mr-2 animate-spin" })}
                  Connecting...
                </>
              ) : (
                <>
                  {React.createElement(Check as any, { className: "h-4 w-4 mr-2" })}
                  Use This Domain
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDomainDialog(false)} 
              className="flex-1 h-10"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Domain Conflict Dialog */}
      <Dialog open={showDomainConflictDialog} onOpenChange={setShowDomainConflictDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                {React.createElement(FolderOpen as any, { className: "h-5 w-5 text-yellow-600" })}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Domain Already in Use
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  This domain is connected to another project
                </p>
              </div>
            </div>
          </DialogHeader>

          {domainConflict && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  The domain <strong>{domainConflict.domain}</strong> is already connected to another project:
                </p>
                <p className="text-sm font-medium mt-2 text-gray-900">
                  {domainConflict.existingProject.projectName}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">Choose an option:</p>
                
                <div className="space-y-2">
                  <Button
                    onClick={handleUnlinkDomain}
                    disabled={isLoading}
                    className="w-full"
                    variant="default"
                  >
                    {isLoading ? (
                      <>
                        {React.createElement(Loader2 as any, { className: "h-4 w-4 mr-2 animate-spin" })}
                        Unlinking...
                      </>
                    ) : (
                      "Unlink from Other Project & Connect Here"
                    )}
                  </Button>
                  <p className="text-xs text-gray-500">
                    This will unlink the domain from "{domainConflict.existingProject.projectName}" and connect it to "{projectName}"
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleUseAnotherDomain}
                    disabled={isLoading}
                    className="w-full"
                    variant="outline"
                  >
                    Use a Different Domain
                  </Button>
                  <p className="text-xs text-gray-500">
                    Choose a different domain for this project
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDomainConflictDialog(false);
                    setDomainConflict(null);
                  }}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
