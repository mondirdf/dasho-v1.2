/**
 * MorningSummary — Auto-popup on first daily dashboard open.
 * Shows key market changes from cached data.
 * Uses localStorage to track "last shown" date.
 */
import { useState, useEffect, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sun, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "dasho_morning_summary_date";

interface MarketItem {
  symbol: string;
  price: number | null;
  change: number | null;
}

const MorningSummary = memo(() => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MarketItem[]>([]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;

    // Mark as shown
    localStorage.setItem(STORAGE_KEY, today);

    // Fetch top crypto changes
    supabase
      .from("cache_crypto_data")
      .select("symbol, price, change_24h")
      .order("market_cap", { ascending: false })
      .limit(6)
      .then(({ data: crypto }) => {
        if (crypto && crypto.length > 0) {
          setData(crypto.map((c) => ({ symbol: c.symbol, price: c.price, change: c.change_24h })));
          setOpen(true);
        }
      });
  }, []);

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return "صباح الخير";
    if (h < 17) return "مساء الخير";
    return "مساء الخير";
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
            Good Morning, Trader!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
