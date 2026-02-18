import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAlerts,
  createAlert,
  toggleAlert,
  deleteAlert,
  fetchTriggeredAlerts,
  fetchCryptoData,
  type Alert,
  type CryptoData,
} from "@/services/dataService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Alerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggered, setTriggered] = useState<any[]>([]);
  const [coins, setCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [symbol, setSymbol] = useState("BTC");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [a, t, c] = await Promise.all([
      fetchAlerts(user.id),
      fetchTriggeredAlerts(user.id),
      fetchCryptoData(),
    ]);
    setAlerts(a);
    setTriggered(t);
    setCoins(c);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!user || !price) return;
    try {
      await createAlert(user.id, symbol, parseFloat(price), condition);
      setPrice("");
      toast({ title: "Alert created" });
      load();
    } catch {
      toast({ title: "Error creating alert", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleAlert(id, active);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteAlert(id);
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Bell className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Price Alerts</h1>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Create Alert */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">New Alert</h2>
          <div className="flex flex-wrap gap-3">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {coins.map((c) => (
                  <SelectItem key={c.symbol} value={c.symbol}>{c.symbol}</SelectItem>
                ))}
                {coins.length === 0 && <SelectItem value="BTC">BTC</SelectItem>}
              </SelectContent>
            </Select>
            <Select value={condition} onValueChange={(v) => setCondition(v as "above" | "below")}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Target price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-36"
            />
            <Button onClick={handleCreate} className="gap-1.5">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Active Alerts ({alerts.filter((a) => a.is_active).length})</h2>
          {alerts.length === 0 && (
            <p className="text-muted-foreground text-sm">No alerts yet.</p>
          )}
          {alerts.map((a) => (
            <div key={a.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground">{a.coin_symbol}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {a.condition_type} ${a.target_price.toLocaleString()}
                </span>
                {a.triggered_at && (
                  <span className="text-xs text-success ml-2">Triggered</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={a.is_active} onCheckedChange={(v) => handleToggle(a.id, v)} />
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Triggered History */}
        {triggered.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Triggered History</h2>
            {triggered.map((t: any) => (
              <div key={t.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">{t.coin_symbol}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    at ${t.triggered_price?.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
