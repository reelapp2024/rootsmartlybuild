import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { http } from "../../config";

export function DangerZoneManagement() {
  const [terminatingRedisTasks, setTerminatingRedisTasks] = useState(false);
  const [clearingEntries, setClearingEntries] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const handleTerminateAllRedisTasks = async () => {
    const shouldTerminate = window.confirm(
      "Are you sure you want to terminate all currently running and queued Redis tasks? New tasks will still work after this."
    );
    if (!shouldTerminate) return;

    setTerminatingRedisTasks(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const response = await http.post(
        "/terminateAllRedisTasks",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const totals = response?.data?.totals || {};
      toast.success(
        `Redis tasks terminated. Active stopped: ${totals.activeFailed || 0}, waiting removed: ${totals.waitingRemoved || 0}, delayed removed: ${totals.delayedRemoved || 0}`
      );
    } catch (error: any) {
      console.error("Error terminating redis tasks:", error);
      toast.error(error.response?.data?.message || "Failed to terminate Redis tasks");
    } finally {
      setTerminatingRedisTasks(false);
    }
  };

  const handleClearEntries = async () => {
    const shouldClear = window.confirm(
      "This will delete ALL entries from selected core collections. Are you absolutely sure?"
    );
    if (!shouldClear) return;

    setClearingEntries(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }
      const response = await http.post(
        "/clearDangerZoneEntries",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response?.data?.message || "Entries cleared successfully");
    } catch (error: any) {
      console.error("Error clearing entries:", error);
      toast.error(error.response?.data?.message || "Failed to clear entries");
    } finally {
      setClearingEntries(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }
      const response = await http.post(
        "/createProjectDataBackupZip",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mongo-full-backup.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Backup zip generated and downloaded");
    } catch (error: any) {
      console.error("Error creating backup:", error);
      toast.error(error.response?.data?.message || "Failed to create backup");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (file: File | null) => {
    if (!file) return;
    setRestoringBackup(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }
      const arrayBuffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(arrayBuffer);
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
      }
      const backupBase64 = btoa(binary);
      const response = await http.post(
        "/restoreProjectDataBackupZip",
        { backupBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response?.data?.message || "Backup restored");
    } catch (error: any) {
      console.error("Error restoring backup:", error);
      toast.error(error.response?.data?.message || "Failed to restore backup");
    } finally {
      setRestoringBackup(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h1 className="text-2xl font-bold tracking-tight">Danger Zone</h1>
      </div>

      <Card className="border-red-300 bg-red-50/40 dark:bg-red-950/10">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400">Emergency Queue Controls</CardTitle>
          <CardDescription>
            Use this only if background jobs started by mistake and are burning credits.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            This will terminate all currently running and queued Redis tasks. New project tasks will continue to run normally afterwards.
          </p>
          <Button
            variant="destructive"
            onClick={handleTerminateAllRedisTasks}
            disabled={terminatingRedisTasks}
          >
            {terminatingRedisTasks ? "Terminating..." : "Terminate All Redis Tasks"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-300 bg-red-50/40 dark:bg-red-950/10">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400">Data Controls</CardTitle>
          <CardDescription>
            Backup and restore the full product database or clear critical entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={handleClearEntries}
              disabled={clearingEntries}
            >
              {clearingEntries ? "Clearing..." : "Clear Entries"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCreateBackup}
              disabled={creatingBackup}
            >
              {creatingBackup ? "Generating Full Backup..." : "Backup Full Mongo (ZIP)"}
            </Button>
            <label className="inline-flex items-center">
              <input
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => handleRestoreBackup(e.target.files?.[0] || null)}
              />
              <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium">
                {restoringBackup ? "Restoring Full Backup..." : "Restore Full Mongo (ZIP)"}
              </span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
