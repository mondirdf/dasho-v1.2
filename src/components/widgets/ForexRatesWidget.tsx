/**
 * ForexRatesWidget — displays forex pair rates from adapter layer.
 * CONTENT ONLY — no container styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchMarketDataList } from "@/adapters/market";
import type { UnifiedMarketData } from "@/adapters/market";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useWidgetSize } from "@/hooks/useWidgetSize";

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

  const loadData = useCallback(() => {
    fetchMarketDataList("forex")
      .then((result) => {
        if (result.success) {
          setPairs(result.data.slice(0, config.maxItems ?? 10));
          setError(false);
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
      <div ref={sizeRef} className="h-full space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  if (error || pairs.length === 0) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">{error ? "Failed to load forex data" : "No forex data available"}</p>
        <p className="text-muted-foreground text-xs">Add TWELVE_DATA_API_KEY to enable</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const isCompact = mode === "compact";

  return (
    <div ref={sizeRef} className="h-full flex flex-col gap-1 overflow-auto">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Forex</div>
      {pairs.map((pair) => {
        const positive = pair.change24h >= 0;
        return (
          <div key={pair.symbol} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
            <span className={`${isCompact ? "text-xs" : "text-sm"} font-semibold text-foreground`}>{pair.symbol}</span>
            <div className="flex items-center gap-3">
              <span className={`${isCompact ? "text-xs" : "text-sm"} font-mono text-foreground`}>
                {pair.price.toFixed(4)}
              </span>
              <span className={`flex items-center gap-0.5 ${isCompact ? "text-[10px]" : "text-xs"} font-semibold ${positive ? "text-success" : "text-destructive"}`}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(pair.change24h).toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

ForexRatesWidget.displayName = "ForexRatesWidget";
export default ForexRatesWidget;
