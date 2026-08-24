import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  addHosting,
  updateHosting,
  parseHostingConfig,
  HostingConnection,
  HostingConnectionType,
} from "@/api/newHostingApi";
import { Plus } from "lucide-react";

interface AddHostingDialogProps {
  onHostingAdded: () => void;
  /** When set, dialog opens in edit mode for this connection. */
  editingHosting?: HostingConnection | null;
  onEditingChange?: (hosting: HostingConnection | null) => void;
  /** Show the "Add Hosting" trigger button (default true). */
  showTrigger?: boolean;
}

export function AddHostingDialog({
  onHostingAdded,
  editingHosting = null,
  onEditingChange,
  showTrigger = true,
}: AddHostingDialogProps) {
  const isEdit = !!editingHosting;
  const [open, setOpen] = useState(false);
  const [connectionType, setConnectionType] = useState<HostingConnectionType>("ftp");
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [ftpHost, setFtpHost] = useState("");
  const [ftpUsername, setFtpUsername] = useState("");
  const [ftpPassword, setFtpPassword] = useState("");
  const [ftpPort, setFtpPort] = useState("21");
  const [ftpSecure, setFtpSecure] = useState(false);

  const [cpanelHost, setCpanelHost] = useState("");
  const [cpanelUsername, setCpanelUsername] = useState("");
  const [cpanelToken, setCpanelToken] = useState("");

  const [vpsHost, setVpsHost] = useState("");
  const [vpsUsername, setVpsUsername] = useState("");
  const [vpsPassword, setVpsPassword] = useState("");
  const [vpsPort, setVpsPort] = useState("22");
  const [vpsPrivateKey, setVpsPrivateKey] = useState("");

  const resetForm = () => {
    setConnectionType("ftp");
    setNickname("");
    setFtpHost("");
    setFtpUsername("");
    setFtpPassword("");
    setFtpPort("21");
    setFtpSecure(false);
    setCpanelHost("");
    setCpanelUsername("");
    setCpanelToken("");
    setVpsHost("");
    setVpsUsername("");
    setVpsPassword("");
    setVpsPort("22");
    setVpsPrivateKey("");
  };

  const fillFromHosting = (hosting: HostingConnection) => {
    const cfg = parseHostingConfig(hosting.connectionConfig) || {};
    setConnectionType(hosting.connectionType);
    setNickname(String(hosting.label || "").trim());

    if (hosting.connectionType === "ftp") {
      setFtpHost(String(cfg.host || ""));
      setFtpUsername(String(cfg.username || ""));
      setFtpPassword("");
      setFtpPort(String(cfg.port || 21));
      setFtpSecure(Boolean(cfg.secure));
    } else if (hosting.connectionType === "cpanel") {
      setCpanelHost(String(cfg.host || cfg.cpanelDomain || ""));
      setCpanelUsername(String(cfg.username || ""));
      setCpanelToken("");
    } else {
      setVpsHost(String(cfg.host || ""));
      setVpsUsername(String(cfg.username || ""));
      setVpsPassword("");
      setVpsPort(String(cfg.port || 22));
      setVpsPrivateKey("");
    }
  };

  useEffect(() => {
    if (editingHosting) {
      fillFromHosting(editingHosting);
      setOpen(true);
    }
  }, [editingHosting]);

  const closeDialog = () => {
    setOpen(false);
    resetForm();
    onEditingChange?.(null);
  };

  const buildConfig = (): string | null => {
    if (connectionType === "ftp") {
      if (!ftpHost.trim() || !ftpUsername.trim()) {
        toast({
          title: "Missing details",
          description: "Enter FTP host and username.",
          variant: "destructive",
        });
        return null;
      }
      if (!ftpPassword && !isEdit) {
        toast({
          title: "Missing password",
          description: "Enter your FTP password.",
          variant: "destructive",
        });
        return null;
      }
      return JSON.stringify({
        host: ftpHost.trim(),
        username: ftpUsername.trim(),
        password: ftpPassword || undefined,
        port: parseInt(ftpPort, 10) || 21,
        secure: ftpSecure,
      });
    }

    if (connectionType === "cpanel") {
      if (!cpanelHost.trim() || !cpanelUsername.trim()) {
        toast({
          title: "Missing details",
          description: "Enter cPanel host and username.",
          variant: "destructive",
        });
        return null;
      }
      if (!cpanelToken.trim() && !isEdit) {
        toast({
          title: "Missing API token",
          description: "Create a token in cPanel → Security → Manage API Tokens.",
          variant: "destructive",
        });
        return null;
      }
      const host = cpanelHost.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
      return JSON.stringify({
        host,
        username: cpanelUsername.trim(),
        token: cpanelToken.trim() || undefined,
        testUrl: `https://${host}:2083/execute/Version/get`,
      });
    }

    if (!vpsHost.trim() || !vpsUsername.trim()) {
      toast({
        title: "Missing details",
        description: "Enter server IP/hostname and username.",
        variant: "destructive",
      });
      return null;
    }
    if (!vpsPassword && !vpsPrivateKey.trim() && !isEdit) {
      toast({
        title: "Missing login",
        description: "Provide a password or private key.",
        variant: "destructive",
      });
      return null;
    }
    return JSON.stringify({
      host: vpsHost.trim(),
      username: vpsUsername.trim(),
      password: vpsPassword || undefined,
      privateKey: vpsPrivateKey.trim() || undefined,
      port: parseInt(vpsPort, 10) || 22,
      secure: false,
    });
  };

  const handleSubmit = async () => {
    const connectionConfig = buildConfig();
    if (!connectionConfig) return;

    setIsLoading(true);
    try {
      if (isEdit && editingHosting) {
        await updateHosting(editingHosting._id, {
          connectionType,
          connectionConfig,
          label: nickname.trim(),
        });
        toast({
          title: "Updated",
          description: "Hosting verified and saved.",
        });
      } else {
        await addHosting({
          connectionType,
          connectionConfig,
          label: nickname.trim() || undefined,
        });
        toast({
          title: "Connected",
          description: "Hosting verified and saved successfully.",
        });
      }
      closeDialog();
      onHostingAdded();
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error?.message || String(error),
        variant: "destructive",
      });
      onHostingAdded();
    } finally {
      setIsLoading(false);
    }
  };

  const tipText =
    connectionType === "ftp"
      ? "Most shared / cPanel hosts: use FTP host from the panel (often ftp.yourdomain.com), username, and password. Try FTPS if normal FTP fails."
      : connectionType === "cpanel"
        ? "Best when your host gives a cPanel API token. Host is usually your domain or server hostname."
        : "Use for VPS or any server with SSH. Password or private key works. Default port is 22.";

  return (
    <>
      {showTrigger && !isEdit && (
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Hosting
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDialog();
          else setOpen(true);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Hosting Connection" : "Connect Your Hosting"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 space-y-1">
              <span className="block">
                We verify live before saving. Choose Standard for shared hosting, or Advanced for
                VPS/SSH.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (optional)</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Client A – Shared hosting"
                className="h-11"
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="connectionType">How do you connect? *</Label>
              <Select
                value={connectionType}
                onValueChange={(value: HostingConnectionType) => setConnectionType(value)}
                disabled={isEdit}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ftp">
                    Standard — FTP (cPanel / shared hosting)
                  </SelectItem>
                  <SelectItem value="cpanel">Standard — cPanel API token</SelectItem>
                  <SelectItem value="ssh">Advanced — SSH / SFTP (any server)</SelectItem>
                  <SelectItem value="vps">Advanced — VPS (SSH)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">{tipText}</p>
            </div>

            {connectionType === "ftp" && (
              <div className="space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">FTP details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="ftpHost">FTP Host *</Label>
                    <Input
                      id="ftpHost"
                      value={ftpHost}
                      onChange={(e) => setFtpHost(e.target.value)}
                      placeholder="ftp.example.com"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ftpUsername">Username *</Label>
                    <Input
                      id="ftpUsername"
                      value={ftpUsername}
                      onChange={(e) => setFtpUsername(e.target.value)}
                      placeholder="user@example.com"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ftpPassword">
                      Password {isEdit ? "(leave blank to keep)" : "*"}
                    </Label>
                    <Input
                      id="ftpPassword"
                      type="password"
                      value={ftpPassword}
                      onChange={(e) => setFtpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ftpPort">Port</Label>
                    <Input
                      id="ftpPort"
                      type="number"
                      value={ftpPort}
                      onChange={(e) => setFtpPort(e.target.value)}
                      placeholder="21"
                      className="h-11"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="ftpSecure"
                      checked={ftpSecure}
                      onCheckedChange={(checked) => setFtpSecure(checked === true)}
                    />
                    <Label htmlFor="ftpSecure" className="font-normal cursor-pointer">
                      Use FTPS (secure) — try if normal FTP fails
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {connectionType === "cpanel" && (
              <div className="space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">cPanel API</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpanelHost">Host / Domain *</Label>
                    <Input
                      id="cpanelHost"
                      value={cpanelHost}
                      onChange={(e) => setCpanelHost(e.target.value)}
                      placeholder="example.com"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpanelUsername">cPanel Username *</Label>
                    <Input
                      id="cpanelUsername"
                      value={cpanelUsername}
                      onChange={(e) => setCpanelUsername(e.target.value)}
                      placeholder="cpanel-username"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpanelToken">
                      API Token {isEdit ? "(leave blank to keep)" : "*"}
                    </Label>
                    <Input
                      id="cpanelToken"
                      type="password"
                      value={cpanelToken}
                      onChange={(e) => setCpanelToken(e.target.value)}
                      placeholder="API token"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            )}

            {(connectionType === "ssh" || connectionType === "vps") && (
              <div className="space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Server SSH details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="vpsHost">Host / IP *</Label>
                    <Input
                      id="vpsHost"
                      value={vpsHost}
                      onChange={(e) => setVpsHost(e.target.value)}
                      placeholder="82.25.110.201"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vpsUsername">Username *</Label>
                    <Input
                      id="vpsUsername"
                      value={vpsUsername}
                      onChange={(e) => setVpsUsername(e.target.value)}
                      placeholder="root"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vpsPort">SSH Port</Label>
                    <Input
                      id="vpsPort"
                      type="number"
                      value={vpsPort}
                      onChange={(e) => setVpsPort(e.target.value)}
                      placeholder="22"
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="vpsPassword">
                      Password {isEdit ? "(leave blank to keep)" : "(or use key)"}
                    </Label>
                    <Input
                      id="vpsPassword"
                      type="password"
                      value={vpsPassword}
                      onChange={(e) => setVpsPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="vpsPrivateKey">
                      Private key {isEdit ? "(leave blank to keep)" : "(optional)"}
                    </Label>
                    <Textarea
                      id="vpsPrivateKey"
                      value={vpsPrivateKey}
                      onChange={(e) => setVpsPrivateKey(e.target.value)}
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                      className="min-h-[100px] font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={closeDialog} disabled={isLoading} className="h-11 px-6">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Verifying…" : isEdit ? "Verify & Update" : "Verify & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
