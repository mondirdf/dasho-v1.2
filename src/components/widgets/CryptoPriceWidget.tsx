/**
 * CryptoPriceWidget — CONTENT ONLY.
 * Supports compact / standard / expanded responsive modes.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchCryptoDataCompat } from "@/adapters/market";
import type { CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, ChangeIndicator, SecondaryValue, WidgetEmptyState } from "./shared";

interface Props {
  config: {
    symbol?: string;
    showChart?: boolean;
    showMarketCap?: boolean;
    showVolume?: boolean;
    showLastUpdate?: boolean;
  };
}

const CryptoPriceWidget = memo(({ config }: Props) => {
  const [sizeRef, { mode }] = useWidgetSize();
  const [coin, setCoin] = useState<CryptoData | null>(null);
  const [allCoins, setAllCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(() => {
    const symbol = config.symbol || "BTC";
    fetchCryptoDataCompat()
      .then((data) => {
        setAllCoins(data);
        setCoin(data.find((c) => c.symbol === symbol) || data[0] || null);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [config.symbol]);

  useEffect(() => { loadData(); }, [loadData]);
  useRealtimeCrypto(loadData);

  if (loading) {
    return (
      <div ref={sizeRef} className="h-full space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12 rounded-full" />
        </div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div ref={sizeRef}>
        <WidgetEmptyState error={error} onRetry={loadData} />
      </div>
    );
  }

  const positive = (coin.change_24h ?? 0) >= 0;
  const isCompact = mode === "compact";
  const showChart = (config.showChart ?? true) && !isCompact;
  const showMarketCap = (config.showMarketCap ?? true) && !isCompact;
  const showVolume = (config.showVolume ?? false) && !isCompact;

  const sparkline = allCoins.slice(0, 8).map((c, i) => ({
    x: (i / 7) * 100,
    y: 50 - ((c.change_24h ?? 0) * 2.5),
  }));
  const sparkPath = sparkline.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillPath = sparkPath + ` L 100 60 L 0 60 Z`;

  return (
    <div ref={sizeRef} className="h-full flex flex-col justify-between overflow-hidden">
      <WidgetHeader
        title={coin.symbol}
        status="live"
        updatedAt={coin.last_updated}
        compact={isCompact}
      />

      {/* Main price */}
      <div className="flex items-end gap-2.5">
        <span className={`${isCompact ? "text-xl" : "text-[28px]"} font-bold text-foreground tabular-nums leading-none`}>
          ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <ChangeIndicator value={coin.change_24h ?? 0} compact={isCompact} />
      </div>

      {/* Sparkline */}
      {showChart && (
        <div className="relative mt-1">
          <svg viewBox="0 0 100 60" className="w-full h-10 shrink-0" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`grad-${coin.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity="0.25" />
                <stop offset="100%" stopColor={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill={`url(#grad-${coin.symbol})`} />
            <path d={sparkPath} fill="none" stroke={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}

      {/* Secondary metrics */}
      {(showMarketCap || showVolume) && (
        <div className="flex items-center gap-4 pt-1">
          {showMarketCap && <SecondaryValue label="MCap" value={`$${((coin.market_cap ?? 0) / 1e9).toFixed(1)}B`} compact={isCompact} />}
          {showVolume && <SecondaryValue label="Vol" value={`$${((coin.volume ?? 0) / 1e9).toFixed(2)}B`} compact={isCompact} />}
        </div>
      )}
    </div>
  );
});

CryptoPriceWidget.displayName = "CryptoPriceWidget";
export default CryptoPriceWidget;
