/**
 * MarketContextWidget — CONTENT ONLY.
 * Supports compact / standard / expanded responsive modes.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchCryptoDataCompat } from "@/adapters/market";
import type { CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";
import { useWidgetSize } from "@/hooks/useWidgetSize";

interface Props {
  config: {
    showVolume?: boolean;
    showDominance?: boolean;
    showTopMover?: boolean;
    showGainersLosers?: boolean;
  };
}

const MarketContextWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(() => {
    fetchCryptoDataCompat()
      .then((d) => { setData(d); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRealtimeCrypto(loadData);

  const isCompact = mode === "compact";

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className={`grid ${isCompact ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Failed to load data</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const totalMcap = data.reduce((s, c) => s + (c.market_cap ?? 0), 0);
  const totalVol = data.reduce((s, c) => s + (c.volume ?? 0), 0);
  const btc = data.find((c) => c.symbol === "BTC");
  const btcDom = btc && totalMcap > 0 ? ((btc.market_cap ?? 0) / totalMcap) * 100 : 0;

  const showVolume = config?.showVolume ?? true;
  const showDominance = (config?.showDominance ?? true) && !isCompact;
  const showTopMover = (config?.showTopMover ?? false) && !isCompact;
  const showGainersLosers = (config?.showGainersLosers ?? false) && !isCompact;

  // Compute top mover (highest absolute change)
  const topMover = data.length > 0
    ? data.reduce((best, c) => Math.abs(c.change_24h ?? 0) > Math.abs(best.change_24h ?? 0) ? c : best, data[0])
    : null;

  // Compute gainers vs losers
  const gainers = data.filter((c) => (c.change_24h ?? 0) > 0).length;
  const losers = data.filter((c) => (c.change_24h ?? 0) < 0).length;

  const stats: { label: string; value: string; accent: boolean; icon?: React.ReactNode }[] = [
    { label: "Total Market Cap", value: `$${(totalMcap / 1e12).toFixed(2)}T`, accent: true },
    ...(showVolume ? [{ label: "24h Volume", value: `$${(totalVol / 1e9).toFixed(1)}B`, accent: false }] : []),
    ...(showDominance ? [{ label: "BTC Dominance", value: `${btcDom.toFixed(1)}%`, accent: false }] : []),
    { label: "Tracked Coins", value: `${data.length}`, accent: false },
  ];

  return (
    <div ref={sizeRef} className="h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Globe className={`${isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} text-primary`} />
        <h3 className={`${isCompact ? "text-xs" : "text-sm"} font-semibold text-foreground`}>Market Context</h3>
      </div>
      <div className={`grid ${isCompact ? "grid-cols-1 gap-2" : "grid-cols-2 gap-3"}`}>
        {stats.map((s) => (
          <div key={s.label} className={`flex flex-col justify-center ${isCompact ? "p-1.5" : "p-2.5"} rounded-lg bg-secondary/30`}>
            <span className={`${isCompact ? "text-[9px]" : "text-[11px]"} text-muted-foreground font-medium`}>{s.label}</span>
            <span className={`${isCompact ? "text-sm" : "text-lg"} font-bold tabular-nums ${s.accent ? "gradient-text" : "text-foreground"}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Extra insights row */}
      {(showTopMover || showGainersLosers) && (
        <div className="mt-3 space-y-2">
          {showTopMover && topMover && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
              <span className="text-[11px] text-muted-foreground font-medium">Top Mover</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">{topMover.symbol}</span>
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1 py-0.5 rounded ${
                  (topMover.change_24h ?? 0) >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {(topMover.change_24h ?? 0) >= 0
                    ? <TrendingUp className="h-2.5 w-2.5" />
                    : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(topMover.change_24h ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>
          )}
          {showGainersLosers && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
              <span className="text-[11px] text-muted-foreground font-medium">Gainers / Losers</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-success">{gainers} ↑</span>
                <span className="text-[10px] text-muted-foreground">/</span>
                <span className="text-xs font-bold text-destructive">{losers} ↓</span>
              </div>
            </div>
          )}
        </div>
      )}

      {!isCompact && (
        <div className="flex items-center justify-end mt-3">
          <span className="animate-pulse-glow text-[10px] text-muted-foreground">● Live</span>
        </div>
      )}
    </div>
  );
});

MarketContextWidget.displayName = "MarketContextWidget";
export default MarketContextWidget;
