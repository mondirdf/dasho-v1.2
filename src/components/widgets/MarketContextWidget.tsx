/**
 * MarketContextWidget — CONTENT ONLY.
 * Dense market overview with consistent styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchCryptoDataCompat } from "@/adapters/market";
import type { CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, ChangeIndicator, WidgetEmptyState } from "./shared";

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
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-10 rounded-full" />
        </div>
        <div className={`grid ${isCompact ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) return <div ref={sizeRef}><WidgetEmptyState error onRetry={loadData} /></div>;

  const totalMcap = data.reduce((s, c) => s + (c.market_cap ?? 0), 0);
  const totalVol = data.reduce((s, c) => s + (c.volume ?? 0), 0);
  const btc = data.find((c) => c.symbol === "BTC");
  const btcDom = btc && totalMcap > 0 ? ((btc.market_cap ?? 0) / totalMcap) * 100 : 0;

  const showVolume = config?.showVolume ?? true;
  const showDominance = (config?.showDominance ?? true) && !isCompact;
  const showTopMover = (config?.showTopMover ?? false) && !isCompact;
  const showGainersLosers = (config?.showGainersLosers ?? false) && !isCompact;

  const topMover = data.length > 0
    ? data.reduce((best, c) => Math.abs(c.change_24h ?? 0) > Math.abs(best.change_24h ?? 0) ? c : best, data[0])
    : null;
  const gainers = data.filter((c) => (c.change_24h ?? 0) > 0).length;
  const losers = data.filter((c) => (c.change_24h ?? 0) < 0).length;

  const stats = [
    { label: "Total MCap", value: `$${(totalMcap / 1e12).toFixed(2)}T`, accent: true },
    ...(showVolume ? [{ label: "24h Volume", value: `$${(totalVol / 1e9).toFixed(1)}B`, accent: false }] : []),
    ...(showDominance ? [{ label: "BTC Dom", value: `${btcDom.toFixed(1)}%`, accent: false }] : []),
    { label: "Tracked", value: `${data.length}`, accent: false },
  ];

  return (
    <div ref={sizeRef} className="h-full overflow-hidden">
      <WidgetHeader title="Market Context" status="live" compact={isCompact} />

      <div className={`grid ${isCompact ? "grid-cols-1 gap-1.5" : "grid-cols-2 gap-2"}`}>
        {stats.map((s) => (
          <div key={s.label} className={`flex flex-col ${isCompact ? "p-2" : "p-2.5"} rounded-lg bg-secondary/15 border border-border/10`}>
            <span className={`${isCompact ? "text-[7px]" : "text-[8px]"} text-muted-foreground/50 font-medium uppercase tracking-widest`}>{s.label}</span>
            <span className={`${isCompact ? "text-sm" : "text-lg"} font-bold tabular-nums leading-tight ${s.accent ? "text-primary" : "text-foreground"}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {(showTopMover || showGainersLosers) && (
        <div className="mt-2.5 space-y-1.5">
          {showTopMover && topMover && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/10 border border-border/10">
              <span className="text-[8px] text-muted-foreground/45 font-medium uppercase tracking-wider">Top Mover</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-foreground">{topMover.symbol}</span>
                <ChangeIndicator value={topMover.change_24h ?? 0} compact />
              </div>
            </div>
          )}
          {showGainersLosers && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/10 border border-border/10">
              <span className="text-[8px] text-muted-foreground/45 font-medium uppercase tracking-wider">Gainers / Losers</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-success">{gainers} ▲</span>
                <span className="text-[7px] text-muted-foreground/25">/</span>
                <span className="text-[10px] font-bold text-destructive">{losers} ▼</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MarketContextWidget.displayName = "MarketContextWidget";
export default MarketContextWidget;
