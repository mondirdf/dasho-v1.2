/**
 * MultiTrackerWidget — CONTENT ONLY.
 * Dense multi-coin tracker with terminal-style layout.
 */
import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { fetchCryptoDataCompat } from "@/adapters/market";
import type { CryptoData } from "@/services/dataService";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, DataRow, ListSkeleton, WidgetEmptyState } from "./shared";

interface Props {
  config: {
    symbols?: string[];
    symbolsText?: string;
    maxItems?: number;
    showVolume?: boolean;
    showMarketCap?: boolean;
    sortBy?: "market_cap" | "price" | "change" | "volume";
  };
}

const MultiTrackerWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [coins, setCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const targetSymbols = useMemo(() => {
    if (config.symbolsText) {
      return config.symbolsText.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    }
    return config.symbols || ["BTC", "ETH", "SOL", "ADA", "DOGE"];
  }, [config.symbolsText, config.symbols]);

  const maxItems = config.maxItems || 10;

  const loadData = useCallback(() => {
    fetchCryptoDataCompat()
      .then((data) => {
        const filtered = data.filter((c) => targetSymbols.includes(c.symbol));
        const result = filtered.length > 0 ? filtered : data.slice(0, 5);
        setCoins(result.slice(0, maxItems));
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [targetSymbols, maxItems]);

  useEffect(() => { loadData(); }, [loadData]);
  useRealtimeCrypto(loadData);

  const sorted = useMemo(() => {
    const sortBy = config.sortBy || "market_cap";
    return [...coins].sort((a, b) => {
      switch (sortBy) {
        case "price": return (b.price ?? 0) - (a.price ?? 0);
        case "change": return Math.abs(b.change_24h ?? 0) - Math.abs(a.change_24h ?? 0);
        case "volume": return (b.volume ?? 0) - (a.volume ?? 0);
        default: return (b.market_cap ?? 0) - (a.market_cap ?? 0);
      }
    });
  }, [coins, config.sortBy]);

  const isCompact = mode === "compact";
  const showVolume = config.showVolume ?? false;
  const showMarketCap = (config.showMarketCap ?? false) && !isCompact;

  if (loading) return <div ref={sizeRef}><ListSkeleton rows={4} /></div>;
  if (error) return <div ref={sizeRef}><WidgetEmptyState error onRetry={loadData} /></div>;

  return (
    <div ref={sizeRef} className="h-full overflow-auto">
      <WidgetHeader title="Market Overview" status="live" compact={isCompact}>
        <span className="text-[8px] text-muted-foreground/35 tabular-nums font-medium">{sorted.length} coins</span>
      </WidgetHeader>

      <div className="space-y-0">
        {sorted.map((coin) => (
          <DataRow
            key={coin.symbol}
            label={coin.symbol}
            price={coin.price ?? 0}
            change={coin.change_24h ?? 0}
            compact={isCompact}
            extra={
              <>
                {showMarketCap && (
                  <span className="text-[8px] text-muted-foreground/40 tabular-nums hidden sm:inline">
                    ${((coin.market_cap ?? 0) / 1e9).toFixed(1)}B
                  </span>
                )}
                {showVolume && !isCompact && (
                  <span className="text-[8px] text-muted-foreground/40 tabular-nums">
                    ${((coin.volume ?? 0) / 1e9).toFixed(1)}B
                  </span>
                )}
              </>
            }
          />
        ))}
      </div>
    </div>
  );
});

MultiTrackerWidget.displayName = "MultiTrackerWidget";
export default MultiTrackerWidget;
