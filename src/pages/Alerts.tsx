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
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useRealtimeTriggeredAlerts } from "@/hooks/useRealtimeData";
import { usePlanLimits } from "@/hooks/usePlanLimits";

/** Source type definitions — add new data sources here */
const SOURCE_TYPES = [
  { id: "crypto", label: "Crypto" },
  { id: "custom", label: "Custom" },
] as const;

const CONDITION_TYPES = [
  { value: "above", label: "Above" },
  { value: "below", label: "Below" },
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
] as const;

const Alerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { maxAlerts, isPro } = usePlanLimits();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggered, setTriggered] = useState<any[]>([]);
  const [coins, setCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [sourceType, setSourceType] = useState("crypto");
  const [symbol, setSymbol] = useState("BTC");
  const [customLabel, setCustomLabel] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("above");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [a, t, c] = await Promise.all([
        fetchAlerts(user.id),
        fetchTriggeredAlerts(user.id),
        fetchCryptoData(),
      ]);
      setAlerts(a);
      setTriggered(t);
      setCoins(c);
    } catch {
      toast({ title: "Error loading alerts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { load(); }, [load]);

  useRealtimeTriggeredAlerts(user?.id, useCallback((newAlert: any) => {
    setTriggered((prev) => [newAlert, ...prev]);
    toast({ title: `🔔 Alert triggered: ${newAlert.coin_symbol} at $${Number(newAlert.triggered_price).toLocaleString()}` });
    load();
  }, [toast, load]));

  const handleCreate = async () => {
    if (!user || !price) return;
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0 || p > 1e12) {
      toast({ title: "Invalid value. Enter a positive number.", variant: "destructive" });
      return;
    }

    const alertSymbol = sourceType === "crypto" ? symbol : customLabel.trim().toUpperCase();
    if (!alertSymbol) {
      toast({ title: "Please enter a data source identifier.", variant: "destructive" });
      return;
    }

    // Check for duplicate
    const duplicate = alerts.find(
      (a) => a.coin_symbol === alertSymbol && a.condition_type === condition && Number(a.target_price) === p
    );
    if (duplicate) {
      toast({ title: "Duplicate alert", description: `You already have a ${condition} ${p.toLocaleString()} alert for ${alertSymbol}.`, variant: "destructive" });
      return;
    }

    // Check plan limit
    if (!isPro && alerts.length >= maxAlerts) {
      toast({ title: "Plan limit reached", description: `Free plan allows ${maxAlerts} alerts. Upgrade to Pro for unlimited.`, variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      await createAlert(user.id, alertSymbol, p, condition as "above" | "below", sourceType, sourceType !== "crypto" ? customLabel.trim() : undefined);
      setPrice("");
      setCustomLabel("");
      toast({ title: "Alert created" });
      load();
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("Free plan")) {
        toast({ title: "Plan limit reached", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Error creating alert", variant: "destructive" });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_active: active } : a));
    try {
      await toggleAlert(id, active);
    } catch {
      toast({ title: "Error toggling alert", variant: "destructive" });
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setAlerts((prev) => prev.filter((a) => a.id !== deleteTarget));
    setDeleteTarget(null);
    try {
      await deleteAlert(deleteTarget);
      toast({ title: "Alert deleted" });
    } catch {
      toast({ title: "Error deleting alert", variant: "destructive" });
      load();
    }
  };

  const activeAlerts = alerts.filter((a) => a.is_active);
  const inactiveAlerts = alerts.filter((a) => !a.is_active);

  const getAlertLabel = (a: Alert) => {
    const src = (a as any).source_type || "crypto";
    const label = (a as any).source_label || a.coin_symbol;
    const srcBadge = SOURCE_TYPES.find((s) => s.id === src);
    return { symbol: a.coin_symbol, label, srcLabel: srcBadge?.label || src };
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-12 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Bell className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Alerts</h1>
        {triggered.length > 0 && (
          <Badge variant="secondary" className="ml-auto">{triggered.length} triggered</Badge>
        )}
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Create Alert */}
        <div className="glass-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">New Alert</h2>
            {!isPro && (
              <span className="text-[11px] text-muted-foreground">{alerts.length}/{maxAlerts} alerts</span>
            )}
          </div>

          {/* Source type selector */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {SOURCE_TYPES.map((src) => (
              <button
                key={src.id}
                onClick={() => setSourceType(src.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  sourceType === src.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {sourceType === "crypto" ? (
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-full sm:w-28" aria-label="Select source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coins.map((c) => (
                    <SelectItem key={c.symbol} value={c.symbol}>{c.symbol}</SelectItem>
                  ))}
                  {coins.length === 0 && <SelectItem value="BTC">BTC</SelectItem>}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder={sourceType === "stock" ? "e.g. AAPL" : sourceType === "weather" ? "e.g. NYC" : "Identifier"}
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full sm:w-36"
                aria-label="Data source identifier"
                maxLength={20}
              />
            )}
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-full sm:w-28" aria-label="Condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Target value"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full sm:w-36"
              aria-label="Target value"
              min="0"
              step="any"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} className="gap-1.5 w-full sm:w-auto" disabled={creating}>
              <Plus className="h-4 w-4" /> {creating ? "Creating…" : "Create"}
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
                {activeAlerts.map((a) => {
                  const info = getAlertLabel(a);
                  return (
                    <div key={a.id} className="glass-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[10px] shrink-0">{info.srcLabel}</Badge>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground">{info.symbol}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {a.condition_type} {Number(a.target_price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={a.is_active} onCheckedChange={(v) => handleToggle(a.id, v)} aria-label="Toggle alert" />
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(a.id)} aria-label="Delete alert">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {inactiveAlerts.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs text-muted-foreground font-medium">Inactive</p>
                    {inactiveAlerts.map((a) => {
                      const info = getAlertLabel(a);
                      return (
                        <div key={a.id} className="glass-card p-4 flex items-center justify-between opacity-60">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="outline" className="text-[10px] shrink-0">{info.srcLabel}</Badge>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-foreground">{info.symbol}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {a.condition_type} {Number(a.target_price).toLocaleString()}
                              </span>
                              {a.triggered_at && (
                                <Badge variant="secondary" className="ml-2 text-xs">Triggered</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch checked={a.is_active} onCheckedChange={(v) => handleToggle(a.id, v)} aria-label="Toggle alert" />
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(a.id)} aria-label="Delete alert">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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
                      at {Number(t.triggered_price).toLocaleString()}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete alert?"
        description="This alert will be permanently removed."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
};

export default Alerts;