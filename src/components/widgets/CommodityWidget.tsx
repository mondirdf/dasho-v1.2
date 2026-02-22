/**
 * CommodityWidget — displays commodity prices from adapter layer.
 * CONTENT ONLY — no container styling.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchMarketDataList } from "@/adapters/market";
import type { UnifiedMarketData } from "@/adapters/market";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, DataRow, ListSkeleton, WidgetEmptyState } from "./shared";

interface Props {
  config: Record<string, any>;
}

const CommodityWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [commodities, setCommodities] = useState<UnifiedMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  const loadData = useCallback(() => {
    fetchMarketDataList("commodity")
      .then((result) => {
        if (result.success) {
          setCommodities(result.data);
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
  if (error || commodities.length === 0) {
    return (
      <div ref={sizeRef}>
        <WidgetEmptyState
          error={error}
          message={error ? "Failed to load commodity data" : "No commodity data available"}
          hint="Add TWELVE_DATA_API_KEY to enable"
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div ref={sizeRef} className="h-full flex flex-col overflow-auto">
      <WidgetHeader title="Commodities" status="cached" updatedAt={lastFetch} compact={isCompact} />

      <div className="space-y-0 flex-1">
        {commodities.map((c) => (
          <DataRow
            key={c.symbol}
            label={c.symbol}
            price={c.price}
            change={c.change24h}
            compact={isCompact}
          />
        ))}
      </div>
    </div>
  );
});

CommodityWidget.displayName = "CommodityWidget";
export default CommodityWidget;
