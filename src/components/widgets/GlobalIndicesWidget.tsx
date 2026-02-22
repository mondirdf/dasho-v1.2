/**
 * GlobalIndicesWidget — displays index ETF prices from adapter layer.
 * CONTENT ONLY — no container styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchMarketDataList } from "@/adapters/market";
import type { UnifiedMarketData } from "@/adapters/market";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, DataRow, ListSkeleton, WidgetEmptyState } from "./shared";

const INDEX_LABELS: Record<string, string> = {
  SP500: "S&P 500",
  NASDAQ: "NASDAQ",
  DJIA: "Dow Jones",
  RUSSELL: "Russell 2000",
};

interface Props {
  config: Record<string, any>;
}

const GlobalIndicesWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [indices, setIndices] = useState<UnifiedMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  const loadData = useCallback(() => {
    fetchMarketDataList("index")
      .then((result) => {
        if (result.success) {
          setIndices(result.data);
          setError(false);
          setLastFetch(Date.now());
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const isCompact = mode === "compact";

  if (loading) return <div ref={sizeRef}><ListSkeleton rows={3} /></div>;
  if (error || indices.length === 0) {
    return (
      <div ref={sizeRef}>
        <WidgetEmptyState
          error={error}
          message={error ? "Failed to load index data" : "No index data available"}
          hint="Add ALPHA_VANTAGE_API_KEY to enable"
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div ref={sizeRef} className="h-full flex flex-col overflow-auto">
      <WidgetHeader title="Global Indices" status="cached" updatedAt={lastFetch} compact={isCompact} />

      <div className="space-y-0 flex-1">
        {indices.map((idx) => (
          <DataRow
            key={idx.symbol}
            label={INDEX_LABELS[idx.symbol] || idx.symbol}
            sublabel={idx.symbol}
            price={idx.price}
            change={idx.change24h}
            compact={isCompact}
          />
        ))}
      </div>
    </div>
  );
});

GlobalIndicesWidget.displayName = "GlobalIndicesWidget";
export default GlobalIndicesWidget;
