/**
 * MultiTrackerWidget — CONTENT ONLY.
 * All container styling is handled by WidgetContainer.
 */
import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowUpDown, AlertCircle } from "lucide-react";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";

interface Props {
  config: { symbols?: string[] };
}

const MultiTrackerWidget = memo(({ config }: Props) => {
  const [coins, setCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortByChange, setSortByChange] = useState(false);

  const loadData = useCallback(() => {
    fetchCryptoData()
      .then((data) => {
        const symbols = config.symbols || ["BTC", "ETH", "SOL", "ADA", "DOGE"];
        const filtered = data.filter((c) => symbols.includes(c.symbol));
        setCoins(filtered.length > 0 ? filtered : data.slice(0, 5));
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [config.symbols]);

  useEffect(() => { loadData(); }, [loadData]);
  useRealtimeCrypto(loadData);

  const sorted = useMemo(() => {
    if (!sortByChange) return coins;
    return [...coins].sort((a, b) => Math.abs(b.change_24h ?? 0) - Math.abs(a.change_24h ?? 0));
  }, [coins, sortByChange]);

  if (loading) {
    return (
      <div className="h-full space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Failed to load data</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Market Overview</h3>
        <button
          onClick={() => setSortByChange(!sortByChange)}
          className={`p-1.5 rounded-lg transition-colors ${sortByChange ? "bg-primary/10 text-primary" : "hover:bg-secondary/60 text-muted-foreground"}`}
          aria-label="Sort by change"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-0.5">
        {sorted.map((coin) => {
          const positive = (coin.change_24h ?? 0) >= 0;
          return (
            <div key={coin.symbol} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {coin.symbol.slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-foreground">{coin.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground tabular-nums font-medium">
                  ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold min-w-[56px] justify-end px-1.5 py-0.5 rounded-md ${
                  positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(coin.change_24h ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MultiTrackerWidget.displayName = "MultiTrackerWidget";
export default MultiTrackerWidget;
