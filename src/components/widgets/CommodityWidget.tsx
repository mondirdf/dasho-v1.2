/**
 * CommodityWidget — displays commodity prices from adapter layer.
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

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-1.5">
        <Skeleton className="h-4 w-24" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-full" />)}
      </div>
    );
  }

  if (error || commodities.length === 0) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-muted-foreground text-xs">{error ? "Failed to load commodity data" : "No commodity data available"}</p>
        <p className="text-muted-foreground/50 text-[10px]">Add TWELVE_DATA_API_KEY to enable</p>
        <button onClick={loadData} className="text-[10px] text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const isCompact = mode === "compact";

  return (
    <div ref={sizeRef} className="h-full flex flex-col overflow-auto">
      <WidgetHeader title="Commodities" status="cached" updatedAt={lastFetch} compact={isCompact} />

      <div className="space-y-0 flex-1">
        {commodities.map((c) => (
          <div key={c.symbol} className={`flex items-center justify-between ${isCompact ? "py-1" : "py-1.5"} border-b border-border/20 last:border-0`}>
            <span className={`${isCompact ? "text-[10px]" : "text-xs"} font-semibold text-foreground`}>
              {c.symbol}
            </span>
            <div className="flex items-center gap-3">
              <span className={`${isCompact ? "text-[10px]" : "text-xs"} font-mono text-foreground tabular-nums`}>
                ${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="min-w-[48px] text-right">
                <ChangeIndicator value={c.change24h} compact={isCompact} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CommodityWidget.displayName = "CommodityWidget";
export default CommodityWidget;
