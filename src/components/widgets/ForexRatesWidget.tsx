/**
 * ForexRatesWidget — displays forex pair rates from adapter layer.
 * CONTENT ONLY — no container styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchMarketDataList } from "@/adapters/market";
import type { UnifiedMarketData } from "@/adapters/market";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, ChangeIndicator } from "./shared";

interface Props {
  config: {
    maxItems?: number;
  };
}

const ForexRatesWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [pairs, setPairs] = useState<UnifiedMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  const loadData = useCallback(() => {
    fetchMarketDataList("forex")
      .then((result) => {
        if (result.success) {
          setPairs(result.data.slice(0, config.maxItems ?? 10));
          setError(false);
          setLastFetch(Date.now());
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [config.maxItems]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-1.5">
        <Skeleton className="h-4 w-16" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-full" />)}
      </div>
    );
  }

  if (error || pairs.length === 0) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-muted-foreground text-xs">{error ? "Failed to load forex data" : "No forex data available"}</p>
        <p className="text-muted-foreground/50 text-[10px]">Add TWELVE_DATA_API_KEY to enable</p>
        <button onClick={loadData} className="text-[10px] text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const isCompact = mode === "compact";

  return (
    <div ref={sizeRef} className="h-full flex flex-col overflow-auto">
      <WidgetHeader title="Forex" status="cached" updatedAt={lastFetch} compact={isCompact} />

      <div className="space-y-0 flex-1">
        {pairs.map((pair) => (
          <div key={pair.symbol} className={`flex items-center justify-between ${isCompact ? "py-1" : "py-1.5"} border-b border-border/20 last:border-0`}>
            <span className={`${isCompact ? "text-[10px]" : "text-xs"} font-semibold text-foreground`}>
              {pair.symbol}
            </span>
            <div className="flex items-center gap-3">
              <span className={`${isCompact ? "text-[10px]" : "text-xs"} font-mono text-foreground tabular-nums`}>
                {pair.price.toFixed(pair.price > 100 ? 2 : 5)}
              </span>
              <span className="min-w-[48px] text-right">
                <ChangeIndicator value={pair.change24h} compact={isCompact} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ForexRatesWidget.displayName = "ForexRatesWidget";
export default ForexRatesWidget;
