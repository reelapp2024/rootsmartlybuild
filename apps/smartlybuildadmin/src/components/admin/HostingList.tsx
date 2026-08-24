import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  HostingConnection,
  deleteHosting,
  formatHostingSummary,
  hostingCategoryLabel,
  hostingDisplayName,
  hostingTypeLabel,
  verifyHosting,
} from "@/api/newHostingApi";
import { toast } from "@/hooks/use-toast";
import { Loader2, Pencil, RefreshCw, Server, Trash2, Wifi, WifiOff } from "lucide-react";
import { AddHostingDialog } from "./AddHostingDialog";

interface HostingListProps {
  hostings: HostingConnection[];
  onChanged: () => void;
}

export function HostingList({ hostings, onChanged }: HostingListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<HostingConnection | null>(null);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVerify = async (id: string) => {
    setBusyId(id);
    try {
      await verifyHosting(id);
      toast({
        title: "Verified",
        description: "Hosting connection is working.",
      });
      onChanged();
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error?.message || String(error),
        variant: "destructive",
      });
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setBusyId(id);
    try {
      await deleteHosting(id);
      toast({
        title: "Deleted",
        description: "Hosting connection removed.",
      });
      setDeleteId(null);
      onChanged();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (hostings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <Server className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="text-lg font-medium">No hosting connected yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Connect FTP or cPanel for shared hosting, or SSH/VPS for your own server. Click{" "}
              <span className="font-medium">Add Hosting</span> to start.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Hosting Connections ({hostings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostings.map((hosting) => {
                const isBusy = busyId === hosting._id;
                const isAdvanced = hostingCategoryLabel(hosting.connectionType) === "Advanced";
                return (
                  <TableRow key={hosting._id}>
                    <TableCell>
                      <div className="font-medium">{hostingDisplayName(hosting)}</div>
                      {hosting.label ? (
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {formatHostingSummary(
                            hosting.connectionConfig,
                            hosting.connectionType
                          )}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant={isAdvanced ? "default" : "secondary"} className="text-xs">
                          {hostingCategoryLabel(hosting.connectionType)}
                        </Badge>
                        <span className="text-sm text-gray-700">
                          {hostingTypeLabel(hosting.connectionType)}
                        </span>
                        {hosting.isOur ? (
                          <Badge variant="outline" className="text-xs">
                            Ours
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-[220px]">
                      <span className="break-all">
                        {formatHostingSummary(
                          hosting.connectionConfig,
                          hosting.connectionType
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <Badge
                        className={
                          hosting.status === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {hosting.status === "success" ? (
                          <Wifi className="h-3 w-3 mr-1" />
                        ) : (
                          <WifiOff className="h-3 w-3 mr-1" />
                        )}
                        {hosting.status === "success" ? "Verified" : "Failed"}
                      </Badge>
                      {hosting.status === "failed" && hosting.lastError ? (
                        <p className="text-xs text-red-600 mt-1.5 leading-snug line-clamp-3">
                          {hosting.lastError}
                        </p>
                      ) : null}
                      {hosting.status === "success" && hosting.lastVerifiedAt ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Last OK: {formatDate(hosting.lastVerifiedAt)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(hosting.updatedAt || hosting.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setEditing(hosting)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="ml-1 hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleVerify(hosting._id)}
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          <span className="ml-1 hidden sm:inline">Test</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteId(hosting._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddHostingDialog
        onHostingAdded={onChanged}
        editingHosting={editing}
        onEditingChange={setEditing}
        showTrigger={false}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete hosting connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved credentials. Projects linked to this hosting will need a new
              connection before deploy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={!!busyId}
              className="bg-red-600 hover:bg-red-700"
            >
              {busyId ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
