/**
 * StockTrackerWidget — displays stock prices from adapter layer.
 * CONTENT ONLY — no container styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchMarketDataList } from "@/adapters/market";
import type { UnifiedMarketData } from "@/adapters/market";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, DataRow, SecondaryValue, ListSkeleton, WidgetEmptyState } from "./shared";

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

  const isCompact = mode === "compact";

  if (loading) return <div ref={sizeRef}><ListSkeleton rows={4} /></div>;
  if (error || stocks.length === 0) {
    return (
      <div ref={sizeRef}>
        <WidgetEmptyState
          error={error}
          message={error ? "Failed to load stock data" : "No stock data available"}
          hint="Add ALPHA_VANTAGE_API_KEY to enable"
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div ref={sizeRef} className="h-full flex flex-col overflow-auto">
      <WidgetHeader title="Stocks" status="cached" updatedAt={lastFetch} compact={isCompact} />

      <div className="space-y-0 flex-1">
        {stocks.map((stock) => (
          <DataRow
            key={stock.symbol}
            label={stock.symbol}
            price={stock.price}
            change={stock.change24h}
            compact={isCompact}
            extra={
              config.showVolume && !isCompact && stock.volume ? (
                <span className="text-[8px] text-muted-foreground/40 tabular-nums">
                  Vol {(stock.volume / 1e6).toFixed(1)}M
                </span>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
});

StockTrackerWidget.displayName = "StockTrackerWidget";
export default StockTrackerWidget;
