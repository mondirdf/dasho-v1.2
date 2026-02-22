/**
 * ForexRatesWidget — displays forex pair rates from adapter layer.
 * CONTENT ONLY — no container styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchMarketDataList } from "@/adapters/market";
import type { UnifiedMarketData } from "@/adapters/market";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, DataRow, ListSkeleton, WidgetEmptyState } from "./shared";

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

  const isCompact = mode === "compact";

  if (loading) return <div ref={sizeRef}><ListSkeleton rows={4} /></div>;
  if (error || pairs.length === 0) {
    return (
      <div ref={sizeRef}>
        <WidgetEmptyState
          error={error}
          message={error ? "Failed to load forex data" : "No forex data available"}
          hint="Add TWELVE_DATA_API_KEY to enable"
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div ref={sizeRef} className="h-full flex flex-col overflow-auto">
      <WidgetHeader title="Forex" status="cached" updatedAt={lastFetch} compact={isCompact} />

      <div className="space-y-0 flex-1">
        {pairs.map((pair) => (
          <DataRow
            key={pair.symbol}
            label={pair.symbol}
            priceFormatted={pair.price.toFixed(pair.price > 100 ? 2 : 5)}
            change={pair.change24h}
            compact={isCompact}
          />
        ))}
      </div>
    </div>
  );
});

ForexRatesWidget.displayName = "ForexRatesWidget";
export default ForexRatesWidget;
