/**
 * MultiTrackerWidget — CONTENT ONLY.
 * Dense multi-coin tracker with terminal-style layout.
 */
import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { fetchCryptoDataCompat } from "@/adapters/market";
import type { CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, ChangeIndicator } from "./shared";

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

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-1.5">
        <Skeleton className="h-4 w-28" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-muted-foreground text-xs">Failed to load data</p>
        <button onClick={loadData} className="text-[10px] text-primary hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div ref={sizeRef} className="h-full overflow-auto">
      <WidgetHeader title="Market Overview" status="live" compact={isCompact}>
        <span className="text-[9px] text-muted-foreground/40 tabular-nums">{sorted.length} coins</span>
      </WidgetHeader>

      <div className="space-y-0">
        {sorted.map((coin) => (
          <div
            key={coin.symbol}
            className={`flex items-center justify-between ${isCompact ? "py-1 px-0.5" : "py-1.5 px-1"} border-b border-border/20 last:border-0`}
          >
            <span className={`${isCompact ? "text-[10px]" : "text-xs"} font-semibold text-foreground w-12`}>
              {coin.symbol}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {showMarketCap && (
                <span className="text-[9px] text-muted-foreground/50 tabular-nums hidden sm:inline">
                  ${((coin.market_cap ?? 0) / 1e9).toFixed(1)}B
                </span>
              )}
              {showVolume && !isCompact && (
                <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                  ${((coin.volume ?? 0) / 1e9).toFixed(1)}B
                </span>
              )}
              <span className={`${isCompact ? "text-[10px]" : "text-xs"} text-foreground tabular-nums font-medium min-w-[60px] text-right`}>
                ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: isCompact ? 0 : 2 })}
              </span>
              <span className="min-w-[52px] text-right">
                <ChangeIndicator value={coin.change_24h ?? 0} compact={isCompact} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

MultiTrackerWidget.displayName = "MultiTrackerWidget";
export default MultiTrackerWidget;
