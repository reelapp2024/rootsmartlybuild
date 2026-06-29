import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { httpFile } from "../../config.js";
import { ArrowDownCircle, ArrowUpCircle, Coins, History, Wallet } from "lucide-react";

export default function ManageCredits() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [usdAmount, setUsdAmount] = useState("10");

  const load = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const [dashRes, cfgRes] = await Promise.all([
        httpFile.post("/wallet/v2/dashboard", {}, { headers: { Authorization: `Bearer ${token}` } }),
        httpFile.post("/wallet/v2/config/get", {}, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setWallet(dashRes.data?.data?.wallet || null);
      setTransactions(dashRes.data?.data?.transactions || []);
      setConfig(cfgRes.data?.data || null);
    } catch (error) {
      console.error("Error loading credits page:", error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const creditsToReceive = useMemo(() => {
    const usd = Math.max(0, Number(usdAmount || 0));
    const rate = Math.max(0, Number(config?.usd_to_credits || 0));
    return Number((usd * rate).toFixed(3));
  }, [usdAmount, config?.usd_to_credits]);

  const purchaseCredits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await httpFile.post(
        "/wallet/v2/purchase/credits",
        { usd_amount: Number(usdAmount || 0) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: "Credits Purchased",
        description: `Txn: ${res.data?.data?.transaction_id || "DUMMY"} | +${res.data?.data?.credits_added || 0} credits`,
      });
      await load();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to purchase credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Credits Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">Purchase credits and view transaction history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-2xl font-bold">{Number(wallet?.balance || 0).toLocaleString()}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">{Number(wallet?.total_earned || 0).toLocaleString()}</p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">{Number(wallet?.total_spent || 0).toLocaleString()}</p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-blue-600" /> Purchase Credits</CardTitle>
          <CardDescription>Conversion: 1 USD = {Number(config?.usd_to_credits || 0)} credits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              placeholder="USD Amount"
            />
            <Input readOnly value={`${creditsToReceive} credits`} />
            <Button onClick={purchaseCredits} disabled={loading || Number(usdAmount || 0) <= 0}>
              {loading ? "Processing..." : "Purchase (Dummy)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-blue-600" /> Purchase & Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions.length ? (
            <p className="text-sm text-gray-500">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isCredit = tx.type === "credit";
                return (
                  <div key={tx._id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{tx.source || "transaction"}</div>
                      <div className="text-xs text-gray-500">{formatDate(tx.created_at || tx.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className={isCredit ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {isCredit ? "+" : "-"}{Number(tx.amount || 0)}
                      </div>
                      <Badge className="mt-1">{isCredit ? "credit" : "debit"}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

