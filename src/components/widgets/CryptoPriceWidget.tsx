import { useEffect, useState, memo, useCallback } from "react";
import { fetchCryptoData, type CryptoData } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useRealtimeCrypto } from "@/hooks/useRealtimeData";

interface Props {
  config: {
    symbol?: string;
    currency?: string;
    showChart?: boolean;
    showMarketCap?: boolean;
  };
}

const CryptoPriceWidget = memo(({ config }: Props) => {
  const [coin, setCoin] = useState<CryptoData | null>(null);
  const [allCoins, setAllCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(() => {
    const symbol = config.symbol || "BTC";
    fetchCryptoData()
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
      <div className="h-full p-4 space-y-3">
        <div className="flex justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-16 rounded-md" /></div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-12" /></div>
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">{error ? "Failed to load data" : "No data available"}</p>
        <button onClick={loadData} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const positive = (coin.change_24h ?? 0) >= 0;
  const changeAbs = Math.abs(coin.change_24h ?? 0);

  const showChart = config.showChart ?? true;
  const showMarketCap = config.showMarketCap ?? true;

  const sparkline = allCoins.slice(0, 8).map((c, i) => ({
    x: (i / 7) * 100,
    y: 50 - ((c.change_24h ?? 0) * 2.5),
  }));
  const sparkPath = sparkline.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
  ).join(" ");
  const fillPath = sparkPath + ` L 100 60 L 0 60 Z`;

  return (
    <div className="h-full flex flex-col justify-between p-4 relative overflow-hidden">
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-10 ${positive ? "bg-success" : "bg-destructive"}`} />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {coin.symbol.slice(0, 2)}
          </div>
          <span className="text-sm font-semibold text-foreground">{coin.symbol}</span>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
          positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        }`}>
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {changeAbs.toFixed(2)}%
        </span>
      </div>
      <div className="relative z-10 my-2">
        <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
          ${(coin.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>
      {showChart && (
        <svg viewBox="0 0 100 60" className="w-full h-10 relative z-10" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${coin.symbol}-${coin.last_updated}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#grad-${coin.symbol}-${coin.last_updated})`} />
          <path d={sparkPath} fill="none" stroke={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {showMarketCap && (
        <div className="flex items-center justify-between text-xs text-muted-foreground relative z-10 pt-1">
          <span>MCap: ${((coin.market_cap ?? 0) / 1e9).toFixed(1)}B</span>
          <span className="animate-pulse-glow text-[10px]">● Live</span>
        </div>
      )}
      {!showMarketCap && (
        <div className="flex items-center justify-end text-xs text-muted-foreground relative z-10 pt-1">
          <span className="animate-pulse-glow text-[10px]">● Live</span>
        </div>
      )}
    </div>
  );
});

CryptoPriceWidget.displayName = "CryptoPriceWidget";
export default CryptoPriceWidget;
