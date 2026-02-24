/**
 * MorningSummary — Auto-popup on first daily dashboard open.
 * Shows key market changes, Fear & Greed, active sessions, and AI recap.
 */
import { useState, useEffect, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sun, TrendingUp, TrendingDown, Clock, Gauge, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSession } from "@/engines/sessionEngine";
import { trackBehavior } from "@/analytics/behaviorTracker";

const STORAGE_KEY = "dasho_morning_summary_date";

interface MarketItem {
  symbol: string;
  price: number | null;
  change: number | null;
}

const MorningSummary = memo(() => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MarketItem[]>([]);
  const [fearGreed, setFearGreed] = useState<{ value: number; label: string } | null>(null);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [aiRecap, setAiRecap] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;

    localStorage.setItem(STORAGE_KEY, today);

    // Fetch all data in parallel
    Promise.all([
      supabase
        .from("cache_crypto_data")
        .select("symbol, price, change_24h")
        .order("market_cap", { ascending: false })
        .limit(6),
      supabase
        .from("cache_fear_greed")
        .select("value, value_classification")
        .eq("id", "current")
        .single(),
      supabase
        .from("daily_briefs")
        .select("summary")
        .order("brief_date", { ascending: false })
        .limit(1)
        .single(),
    ]).then(([cryptoRes, fgRes, briefRes]) => {
      const crypto = cryptoRes.data;
      if (crypto && crypto.length > 0) {
        setData(crypto.map((c) => ({ symbol: c.symbol, price: c.price, change: c.change_24h })));
        setOpen(true);
        trackBehavior("morning_summary_open");
      }

      if (fgRes.data) {
        setFearGreed({ value: fgRes.data.value, label: fgRes.data.value_classification });
      }

      if (briefRes.data?.summary) {
        setAiRecap(briefRes.data.summary);
      }

      // Session analysis (pure local computation)
      const session = analyzeSession();
      setActiveSessions(session.sessions.filter((s) => s.active).map((s) => s.label));
    });
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning, Trader!";
    if (h < 17) return "Good Afternoon, Trader!";
    return "Good Evening, Trader!";
  };

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return "text-destructive";
    if (value <= 45) return "text-warning";
    if (value <= 55) return "text-muted-foreground";
    if (value <= 75) return "text-success";
    return "text-success";
  };

  if (!open) return null;

  const topGainer = [...data].sort((a, b) => (b.change ?? 0) - (a.change ?? 0))[0];
  const topLoser = [...data].sort((a, b) => (a.change ?? 0) - (b.change ?? 0))[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sun className="h-5 w-5 text-warning" />
            {getGreeting()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fear & Greed + Active Sessions row */}
          <div className="grid grid-cols-2 gap-2">
            {fearGreed && (
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40 text-center">
                <Gauge className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground">Fear & Greed</p>
                <p className={`text-lg font-bold ${getFearGreedColor(fearGreed.value)}`}>
                  {fearGreed.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{fearGreed.label}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/40 text-center">
              <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-[11px] text-muted-foreground">Active Sessions</p>
              {activeSessions.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {activeSessions.map((s) => (
                    <p key={s} className="text-xs font-semibold text-success">{s}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">No session active</p>
              )}
            </div>
          </div>

          {/* AI Recap snippet */}
          {aiRecap && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="h-3.5 w-3.5 text-primary" />
                <p className="text-[11px] font-medium text-primary">AI Brief</p>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{aiRecap}</p>
            </div>
          )}

          {/* Market Overview */}
          <div className="grid grid-cols-2 gap-2">
            {data.map((item) => (
              <div
                key={item.symbol}
                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/40"
              >
                <span className="text-xs font-medium text-foreground">{item.symbol}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    ${item.price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      (item.change ?? 0) > 0
                        ? "text-success"
                        : (item.change ?? 0) < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {(item.change ?? 0) > 0 ? "+" : ""}
                    {item.change?.toFixed(2) ?? "0.00"}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Top mover highlights */}
          <div className="grid grid-cols-2 gap-2">
            {topGainer && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                <TrendingUp className="h-4 w-4 text-success mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground">Top Gainer</p>
                <p className="text-sm font-bold text-success">
                  {topGainer.symbol} +{topGainer.change?.toFixed(2)}%
                </p>
              </div>
            )}
            {topLoser && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                <TrendingDown className="h-4 w-4 text-destructive mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground">Top Loser</p>
                <p className="text-sm font-bold text-destructive">
                  {topLoser.symbol} {topLoser.change?.toFixed(2)}%
                </p>
              </div>
            )}
          </div>

          <Button onClick={() => setOpen(false)} className="w-full" size="sm">
            Let's Trade 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

MorningSummary.displayName = "MorningSummary";
export default MorningSummary;
