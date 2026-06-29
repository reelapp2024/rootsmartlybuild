import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { httpFile } from "../../config";
import { useToast } from "@/hooks/use-toast";

type Plan = {
  _id: string;
  name: string;
  price: number;
  billing_type: "monthly" | "yearly" | "one_time";
  credits_per_cycle: number;
  validity_days: number;
  is_active: number;
};

type AvailablePlan = {
  _id: string;
  name: string;
  price: number;
  finalAmount: number;
  billing_type: "monthly" | "yearly" | "one_time";
  credits_per_cycle: number;
};

export default function Subscription() {
  const { toast } = useToast();
  const [isSuper, setIsSuper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [usdToCredits, setUsdToCredits] = useState("");
  const [minCreditsWebsite, setMinCreditsWebsite] = useState("");
  const [freepikPerImage, setFreepikPerImage] = useState("");
  const [nanobananaPerImage, setNanobananaPerImage] = useState("");
  const [openaiInputPer1k, setOpenaiInputPer1k] = useState("");
  const [openaiOutputPer1k, setOpenaiOutputPer1k] = useState("");

  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    billing_type: "monthly",
    credits_per_cycle: "",
    validity_days: "",
  });

  const fetchData = async () => {
    if (!isSuper) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [plansRes, cfgRes] = await Promise.all([
        httpFile.post("/wallet/v2/admin/plan/list", {}, { headers: { Authorization: `Bearer ${token}` } }),
        httpFile.post("/wallet/v2/config/get", {}, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setPlans(plansRes.data?.data || []);
      setUsdToCredits(String(cfgRes.data?.data?.usd_to_credits ?? ""));
      setMinCreditsWebsite(String(cfgRes.data?.data?.min_credits_for_website_creation ?? ""));
      setFreepikPerImage(String(cfgRes.data?.data?.freepik_credits_per_image ?? ""));
      setNanobananaPerImage(String(cfgRes.data?.data?.nanobanana_credits_per_image ?? ""));
      setOpenaiInputPer1k(String(cfgRes.data?.data?.openai_input_credits_per_1k_tokens ?? ""));
      setOpenaiOutputPer1k(String(cfgRes.data?.data?.openai_output_credits_per_1k_tokens ?? ""));
    } catch (e) {
      console.error("Failed to fetch subscription module data:", e);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCreditConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/wallet/v2/config/update",
        {
          usd_to_credits: Number(usdToCredits || 0),
          min_credits_for_website_creation: Number(minCreditsWebsite || 0),
          freepik_credits_per_image: Number(freepikPerImage || 0),
          nanobanana_credits_per_image: Number(nanobananaPerImage || 0),
          openai_input_credits_per_1k_tokens: Number(openaiInputPer1k || 0),
          openai_output_credits_per_1k_tokens: Number(openaiOutputPer1k || 0),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200) {
        toast({ title: "Saved", description: "Credit conversion settings updated." });
      }
      await fetchData();
    } catch (e: any) {
      console.error("Update config failed:", e);
      toast({
        title: "Failed to Save",
        description: e?.response?.data?.message || "Unable to update config",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("adminProfile") || "{}");
      setIsSuper(Number(profile?.isSuper || 0) === 1);
    } catch {
      setIsSuper(false);
    }
  }, []);

  useEffect(() => {
    if (isSuper) {
      fetchData();
    } else {
      fetchUserSubscriptionData();
    }
  }, [isSuper]);

  const createPlan = async () => {
    try {
      const token = localStorage.getItem("token");
      await httpFile.post(
        "/wallet/v2/admin/plan/create",
        {
          name: planForm.name,
          price: Number(planForm.price || 0),
          billing_type: planForm.billing_type,
          credits_per_cycle: Number(planForm.credits_per_cycle || 0),
          validity_days: Number(planForm.validity_days || 30),
          is_active: 1,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlanForm({
        name: "",
        price: "",
        billing_type: "monthly",
        credits_per_cycle: "",
        validity_days: "",
      });
      fetchData();
    } catch (e) {
      console.error("Create plan failed:", e);
    }
  };

  const fetchUserSubscriptionData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [checkoutRes, walletRes] = await Promise.all([
        httpFile.post("/wallet/v2/checkout/data", {}, { headers: { Authorization: `Bearer ${token}` } }),
        httpFile.post("/wallet/v2/dashboard", {}, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setAvailablePlans(checkoutRes.data?.data?.plans || []);
      setWallet(walletRes.data?.data?.wallet || null);
    } catch (e) {
      console.error("Failed to fetch user subscription data:", e);
      setAvailablePlans([]);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const buyPlanDummy = async (planId: string) => {
    try {
      setBuyingPlanId(planId);
      const token = localStorage.getItem("token");
      await httpFile.post(
        "/wallet/v2/purchase/plan",
        { plan_id: planId, payment_mode: "money", coupon_code: couponCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchUserSubscriptionData();
      setCouponCode("");
    } catch (e) {
      console.error("Plan purchase failed:", e);
    } finally {
      setBuyingPlanId(null);
    }
  };

  if (!isSuper) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">My Subscription</h1>
          <p className="text-sm text-gray-500">Current plan and available plans to purchase.</p>
        </div>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle>Wallet Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : wallet ? (
              <div className="space-y-1">
                <p className="font-semibold">Balance: {wallet.balance}</p>
                <p className="text-sm text-gray-500">Earned: {wallet.total_earned} | Spent: {wallet.total_spent}</p>
              </div>
            ) : (
              <p className="text-gray-500">No wallet data.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle>Buy Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code (optional)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <Button variant="outline" onClick={fetchUserSubscriptionData}>Apply</Button>
            </div>
            {loading ? (
              <p>Loading plans...</p>
            ) : availablePlans.length === 0 ? (
              <p className="text-gray-500">No plans available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePlans.map((p) => (
                  <div key={p._id} className="border rounded p-4 space-y-2">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm">Credits: {p.credits_per_cycle}</p>
                    <p className="text-sm">Type: {p.billing_type}</p>
                    <p className="text-sm">Price: {Number(p.price).toFixed(2)}</p>
                    <Button onClick={() => buyPlanDummy(p._id)} disabled={buyingPlanId === p._id}>
                      {buyingPlanId === p._id ? "Processing..." : (p.billing_type === "one_time" ? "Buy Now" : "Subscribe")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Plans Management (V2)</h1>
        <p className="text-sm text-gray-500">Create wallet-system plans only.</p>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Credit Conversion Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">USD to Credits</p>
            <Input placeholder="Credits for 1 USD (e.g. 100)" type="number" value={usdToCredits} onChange={(e) => setUsdToCredits(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Website Creation Minimum Credits</p>
            <Input placeholder="Minimum credits required (e.g. 10)" type="number" value={minCreditsWebsite} onChange={(e) => setMinCreditsWebsite(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Freepik Credits per Image</p>
            <Input placeholder="e.g. 1" type="number" value={freepikPerImage} onChange={(e) => setFreepikPerImage(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Nano Banana Credits per Image</p>
            <Input placeholder="e.g. 1" type="number" value={nanobananaPerImage} onChange={(e) => setNanobananaPerImage(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">OpenAI Input Credits / 1K Tokens</p>
            <Input placeholder="e.g. 0.5" type="number" value={openaiInputPer1k} onChange={(e) => setOpenaiInputPer1k(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">OpenAI Output Credits / 1K Tokens</p>
            <Input placeholder="e.g. 1" type="number" value={openaiOutputPer1k} onChange={(e) => setOpenaiOutputPer1k(e.target.value)} />
          </div>
          <Button onClick={updateCreditConfig}>Save Settings</Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Create Plan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Plan Name" value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} />
          <Input placeholder="Price" type="number" value={planForm.price} onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))} />
          <select className="px-3 py-2 border rounded-md" value={planForm.billing_type} onChange={(e) => setPlanForm((p) => ({ ...p, billing_type: e.target.value }))}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one_time">One-Time</option>
          </select>
          <Input placeholder="Credits Per Cycle" type="number" value={planForm.credits_per_cycle} onChange={(e) => setPlanForm((p) => ({ ...p, credits_per_cycle: e.target.value }))} />
          <Input placeholder="Validity Days" type="number" value={planForm.validity_days} onChange={(e) => setPlanForm((p) => ({ ...p, validity_days: e.target.value }))} />
          <div className="md:col-span-2">
            <Button onClick={createPlan}>Create Plan</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle>Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p>Loading...</p>
          ) : plans.length === 0 ? (
            <p className="text-gray-500">No plans yet</p>
          ) : (
            plans.map((p) => (
              <div key={p._id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {p.name} - ${p.price}/{p.billing_type}
                    {p.billing_type === "one_time" && <span className="ml-2 text-xs text-blue-700">(Pay Once)</span>}
                  </p>
                  <p className="text-sm text-gray-500">Credits/Cycle: {p.credits_per_cycle} | Validity: {p.validity_days}d</p>
                </div>
                <Badge className={p.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                  {p.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

