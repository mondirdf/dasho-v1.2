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
import { Bell, Plus, Trash2, ArrowLeft, History, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Alerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggered, setTriggered] = useState<any[]>([]);
  const [coins, setCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

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
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    try {
      await createAlert(user.id, symbol, p, condition);
      setPrice("");
      toast({ title: "Alert created" });
      load();
    } catch {
      toast({ title: "Error creating alert", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_active: active } : a));
    await toggleAlert(id, active);
  };

  const handleDelete = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await deleteAlert(id);
  };

  const activeAlerts = alerts.filter((a) => a.is_active);
  const inactiveAlerts = alerts.filter((a) => !a.is_active);

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
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Bell className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Price Alerts</h1>
        {triggered.length > 0 && (
          <Badge variant="secondary" className="ml-auto">{triggered.length} triggered</Badge>
        )}
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Create Alert */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">New Alert</h2>
          <div className="flex flex-wrap gap-3">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-28" aria-label="Select coin">
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
              <SelectTrigger className="w-28" aria-label="Condition">
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
              aria-label="Target price"
              min="0"
              step="any"
            />
            <Button onClick={handleCreate} className="gap-1.5">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1">Active ({activeAlerts.length})</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History ({triggered.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {alerts.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No alerts yet. Create one above.</p>
              </div>
            ) : (
              <>
                {activeAlerts.map((a) => (
                  <div key={a.id} className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">{a.coin_symbol}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {a.condition_type} ${Number(a.target_price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={a.is_active} onCheckedChange={(v) => handleToggle(a.id, v)} aria-label="Toggle alert" />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} aria-label="Delete alert">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {inactiveAlerts.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs text-muted-foreground font-medium">Inactive</p>
                    {inactiveAlerts.map((a) => (
                      <div key={a.id} className="glass-card p-4 flex items-center justify-between opacity-60">
                        <div>
                          <span className="text-sm font-medium text-foreground">{a.coin_symbol}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {a.condition_type} ${Number(a.target_price).toLocaleString()}
                          </span>
                          {a.triggered_at && (
                            <Badge variant="secondary" className="ml-2 text-xs">Triggered</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={a.is_active} onCheckedChange={(v) => handleToggle(a.id, v)} aria-label="Toggle alert" />
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} aria-label="Delete alert">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            {triggered.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No triggered alerts yet.</p>
              </div>
            ) : (
              triggered.map((t: any) => (
                <div key={t.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">{t.coin_symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      at ${Number(t.triggered_price).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Alerts;
