/**
 * StockTrackerWidget — displays stock prices from adapter layer.
 * CONTENT ONLY — no container styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchMarketDataList } from "@/adapters/market";
import type { UnifiedMarketData } from "@/adapters/market";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, ChangeIndicator, SecondaryValue } from "./shared";

interface Props {
  config: {
    symbols?: string;
    maxItems?: number;
    showVolume?: boolean;
  };
}

const StockTrackerWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [stocks, setStocks] = useState<UnifiedMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  const loadData = useCallback(() => {
    fetchMarketDataList("stock")
      .then((result) => {
        if (result.success) {
          let data = result.data;
          const symbols = config.symbols?.split(",").map((s) => s.trim().toUpperCase());
          if (symbols?.length) data = data.filter((d) => symbols.includes(d.symbol));
          setStocks(data.slice(0, config.maxItems ?? 10));
          setError(false);
          setLastFetch(Date.now());
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [config.symbols, config.maxItems]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-1.5">
        <Skeleton className="h-4 w-20" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-full" />)}
      </div>
    );
  }

  if (error || stocks.length === 0) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-muted-foreground text-xs">{error ? "Failed to load stock data" : "No stock data available"}</p>
        <p className="text-muted-foreground/50 text-[10px]">Add ALPHA_VANTAGE_API_KEY to enable</p>
        <button onClick={loadData} className="text-[10px] text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const isCompact = mode === "compact";

  return (
    <div ref={sizeRef} className="h-full flex flex-col overflow-auto">
      <WidgetHeader title="Stocks" status="cached" updatedAt={lastFetch} compact={isCompact} />

      <div className="space-y-0 flex-1">
        {stocks.map((stock) => (
          <div key={stock.symbol} className={`flex items-center justify-between ${isCompact ? "py-1" : "py-1.5"} border-b border-border/20 last:border-0`}>
            <span className={`${isCompact ? "text-[10px]" : "text-xs"} font-semibold text-foreground w-14`}>
              {stock.symbol}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {config.showVolume && !isCompact && stock.volume && (
                <SecondaryValue label="Vol" value={`${(stock.volume / 1e6).toFixed(1)}M`} compact />
              )}
              <span className={`${isCompact ? "text-[10px]" : "text-xs"} font-medium text-foreground tabular-nums min-w-[60px] text-right`}>
                ${stock.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="min-w-[52px] text-right">
                <ChangeIndicator value={stock.change24h} compact={isCompact} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

StockTrackerWidget.displayName = "StockTrackerWidget";
export default StockTrackerWidget;
