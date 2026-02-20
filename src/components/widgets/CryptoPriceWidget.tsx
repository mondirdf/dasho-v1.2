/**
 * CryptoPriceWidget — CONTENT ONLY.
 * Supports compact / standard / expanded responsive modes.
 */
import { useEffect, useState, memo, useCallback } from "react";
import { fetchCryptoDataCompat } from "@/adapters/market";
import type { CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";
import { useWidgetSize } from "@/hooks/useWidgetSize";
import { WidgetHeader, ChangeIndicator, SecondaryValue } from "./shared";

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
      <div ref={sizeRef} className="h-full space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div ref={sizeRef} className="h-full flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-muted-foreground text-xs">{error ? "Failed to load data" : "No data available"}</p>
        <button onClick={loadData} className="text-[10px] text-primary hover:underline">Retry</button>
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
      <div className="flex items-baseline gap-2">
        <span className={`${isCompact ? "text-xl" : "text-2xl"} font-bold text-foreground tabular-nums`}>
          ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <ChangeIndicator value={coin.change_24h ?? 0} compact={isCompact} />
      </div>

      {/* Sparkline */}
      {showChart && (
        <svg viewBox="0 0 100 60" className="w-full h-8 shrink-0 opacity-60" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${coin.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity="0.2" />
              <stop offset="100%" stopColor={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#grad-${coin.symbol})`} />
          <path d={sparkPath} fill="none" stroke={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      )}

      {/* Secondary metrics */}
      <div className="flex items-center gap-3 flex-wrap">
        {showMarketCap && <SecondaryValue label="MCap" value={`$${((coin.market_cap ?? 0) / 1e9).toFixed(1)}B`} compact={isCompact} />}
        {showVolume && <SecondaryValue label="Vol" value={`$${((coin.volume ?? 0) / 1e9).toFixed(2)}B`} compact={isCompact} />}
      </div>
    </div>
  );
});

CryptoPriceWidget.displayName = "CryptoPriceWidget";
export default CryptoPriceWidget;
