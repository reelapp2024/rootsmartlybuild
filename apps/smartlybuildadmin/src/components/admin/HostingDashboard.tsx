import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { HostingConnection, getMyHostings } from "@/api/newHostingApi";
import { HostingList } from "./HostingList";
import { AddHostingDialog } from "./AddHostingDialog";

export function HostingDashboard() {
  const [hostings, setHostings] = useState<HostingConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHostings = async () => {
    setIsLoading(true);
    try {
      const data = await getMyHostings();
      setHostings(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || `Failed to fetch hosting connections`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHostings();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Hosting Management</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Connect any hosting you have — <strong>Standard</strong> (FTP / cPanel) for shared
            hosting, or <strong>Advanced</strong> (SSH / VPS) for your own server. Edit, test, and
            fix credentials anytime.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchHostings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <AddHostingDialog onHostingAdded={fetchHostings} />
        </div>
      </div>

      <HostingList hostings={hostings} onChanged={fetchHostings} />
    </div>
  );
}
