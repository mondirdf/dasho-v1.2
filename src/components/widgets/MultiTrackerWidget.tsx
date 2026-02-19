/**
 * MultiTrackerWidget — CONTENT ONLY.
 * Supports compact / standard / expanded responsive modes.
 */
import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";
import { useWidgetSize } from "@/hooks/useWidgetSize";

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

  // Parse symbols from symbolsText (comma-separated string) or symbols array
  const targetSymbols = useMemo(() => {
    if (config.symbolsText) {
      return config.symbolsText.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    }
    return config.symbols || ["BTC", "ETH", "SOL", "ADA", "DOGE"];
  }, [config.symbolsText, config.symbols]);

  const maxItems = config.maxItems || 10;

  const loadData = useCallback(() => {
    fetchCryptoData()
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
        case "market_cap":
        default: return (b.market_cap ?? 0) - (a.market_cap ?? 0);
      }
    });
  }, [coins, config.sortBy]);

  const isCompact = mode === "compact";
  const showVolume = config.showVolume ?? false;
  const showMarketCap = (config.showMarketCap ?? false) && !isCompact;

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Failed to load data</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div ref={sizeRef} className="h-full overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${isCompact ? "text-xs" : "text-sm"} font-semibold text-foreground`}>Market Overview</h3>
        <span className="text-[10px] text-muted-foreground">{sorted.length} coins</span>
      </div>
      <div className="space-y-0.5">
        {sorted.map((coin) => {
          const positive = (coin.change_24h ?? 0) >= 0;
          return (
            <div key={coin.symbol} className={`flex items-center justify-between ${isCompact ? "py-1.5 px-1" : "py-2.5 px-2"} rounded-lg hover:bg-secondary/30 transition-colors`}>
              <div className="flex items-center gap-2">
                {!isCompact && (
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {coin.symbol.slice(0, 2)}
                  </div>
                )}
                <span className={`${isCompact ? "text-xs" : "text-sm"} font-medium text-foreground`}>{coin.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                {showMarketCap && (
                  <span className="text-[10px] text-muted-foreground tabular-nums hidden sm:inline">
                    ${((coin.market_cap ?? 0) / 1e9).toFixed(1)}B
                  </span>
                )}
                {showVolume && !isCompact && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    ${((coin.volume ?? 0) / 1e9).toFixed(1)}B
                  </span>
                )}
                <span className={`${isCompact ? "text-xs" : "text-sm"} text-foreground tabular-nums font-medium`}>
                  ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: isCompact ? 0 : 2 })}
                </span>
                <span className={`flex items-center gap-0.5 ${isCompact ? "text-[10px] min-w-[44px] px-1" : "text-xs min-w-[56px] px-1.5"} font-semibold justify-end py-0.5 rounded-md ${
                  positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {positive ? <TrendingUp className="h-3 w-3 shrink-0" /> : <TrendingDown className="h-3 w-3 shrink-0" />}
                  {Math.abs(coin.change_24h ?? 0).toFixed(isCompact ? 1 : 2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MultiTrackerWidget.displayName = "MultiTrackerWidget";
export default MultiTrackerWidget;
